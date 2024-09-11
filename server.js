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
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route pour effectuer le scraping des données des bus
app.get("/scrape", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://transport.data.gouv.fr/validation/261998?token=d9f611e9-6ff3-41fb-bf5b-74359a1f508e"
    );
    const $ = cheerio.load(data);
    const targetDivContent = $("#feed_payload").text();

    if (!targetDivContent) {
      throw new Error("Le contenu ciblé n'a pas été trouvé.");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(targetDivContent);
    } catch (parseError) {
      throw new Error("Erreur lors du parsing du JSON : " + parseError.message);
    }

    const jsonData = { content: parsedData };
    const jsonString = JSON.stringify(jsonData, null, 2);

    fs.writeFileSync("scrapedData.json", jsonString, "utf-8");
    res.json(jsonData);
  } catch (error) {
    console.error("Erreur lors du scraping des données des bus :", error);
    res
      .status(500)
      .send("Une erreur s'est produite lors du scraping des données des bus.");
  }
});

// Route pour effectuer le scraping des retards des bus
app.get("/scrapeDelays", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://transport.data.gouv.fr/validation/270502?token=8168aaac-ba22-4e34-9138-43843cd535ed"
    );
    const $ = cheerio.load(data);
    const targetDivContent = $("#feed_payload").text();

    if (!targetDivContent) {
      throw new Error("Le contenu ciblé n'a pas été trouvé.");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(targetDivContent);
    } catch (parseError) {
      throw new Error("Erreur lors du parsing du JSON : " + parseError.message);
    }

    const jsonData = { content: parsedData };
    const jsonString = JSON.stringify(jsonData, null, 2);

    fs.writeFileSync("scrapedDelays.json", jsonString, "utf-8");
    res.json(jsonData);
  } catch (error) {
    console.error("Erreur lors du scraping des retards :", error);
    res
      .status(500)
      .send("Une erreur s'est produite lors du scraping des retards.");
  }
});

// Lance le serveur sur le port défini et affiche un message de confirmation
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
