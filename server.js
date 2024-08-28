// Importation des modules nécessaires
const express = require("express"); // Framework pour créer le serveur web
const axios = require("axios"); // Bibliothèque pour effectuer des requêtes HTTP
const cheerio = require("cheerio"); // Outil pour manipuler le DOM HTML côté serveur, comme jQuery
const fs = require("fs"); // Module pour manipuler le système de fichiers
const path = require("path"); // Module pour travailler avec les chemins de fichiers et de répertoires

// Initialisation de l'application Express
const app = express();
const PORT = 3000; // Définition du port sur lequel le serveur écoutera

// Configuration pour servir des fichiers statiques à partir du répertoire courant
app.use(express.static(path.join(__dirname)));

// Route pour la page d'accueil
app.get("/", (req, res) => {
  // Quand un utilisateur accède à "/", envoie le fichier "index.html"
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route pour effectuer le scraping
app.get("/scrape", async (req, res) => {
  try {
    // Effectue une requête HTTP GET à l'URL spécifiée
    const { data } = await axios.get(
      "https://transport.data.gouv.fr/validation/261998?token=d9f611e9-6ff3-41fb-bf5b-74359a1f508e"
    );

    // Charge le HTML récupéré dans cheerio pour pouvoir manipuler le DOM
    const $ = cheerio.load(data);

    // Extrait le contenu du div avec l'ID "feed_payload"
    const targetDivContent = $("#feed_payload").text();

    // Si le contenu ciblé n'est pas trouvé, lance une erreur
    if (!targetDivContent) {
      throw new Error("Le contenu ciblé n'a pas été trouvé.");
    }

    let parsedData;
    try {
      // Tente de parser le contenu comme du JSON
      parsedData = JSON.parse(targetDivContent);
    } catch (parseError) {
      // En cas d'erreur lors du parsing, lance une erreur avec un message explicite
      throw new Error("Erreur lors du parsing du JSON : " + parseError.message);
    }

    // Crée un objet JSON avec les données analysées
    const jsonData = { content: parsedData };

    // Convertit l'objet JSON en une chaîne de caractères formatée
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Affiche le JSON converti dans la console pour le débogage
    console.log("JSON string :", jsonString);

    // Écrit la chaîne JSON dans un fichier nommé "scrapedData.json"
    fs.writeFileSync("scrapedData.json", jsonString, "utf-8");

    // Envoie l'objet JSON en réponse à la requête HTTP
    res.json(jsonData);
  } catch (error) {
    // En cas d'erreur durant le scraping ou le traitement, affiche l'erreur dans la console
    console.error("Erreur lors du scraping :", error);
    // Envoie une réponse d'erreur 500 avec un message d'erreur générique
    res.status(500).send("Une erreur s'est produite lors du scraping.");
  }
});

// Lance le serveur sur le port défini et affiche un message de confirmation
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
