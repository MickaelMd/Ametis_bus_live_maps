// Fonction pour charger les retards des bus et les afficher sur la carte
async function loadDelayData() {
  try {
    const response = await fetch("/scrapeDelays");
    if (!response.ok) {
      throw new Error("Erreur de réseau lors du chargement des retards.");
    }
    const data = await response.json();

    // Comparer les nouvelles données avec les précédentes
    if (previousDelayData && areDelayDataEqual(data, previousDelayData)) {
      console.log(
        "Les données des retards sont identiques, pas besoin de mettre à jour."
      );
      return; // Ne pas continuer si les données n'ont pas changé
    }

    console.log(`Nombre total de retards : ${data.content.entity.length}`);

    // Afficher ou mettre à jour les retards des bus
    data.content.entity.forEach((delay) => {
      if (delay.vehicle && delay.vehicle.position) {
        const { latitude, longitude } = delay.vehicle.position;
        const delayTime = delay.vehicle.delay; // Supposons que les retards soient dans la propriété "delay"

        if (latitude && longitude && delayTime != null) {
          let delayText = `Retard : ${delayTime} minutes`;

          // Créer un marqueur pour les retards
          const delayMarker = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`<b>Retard ID:</b> ${delay.id}<br><b>${delayText}</b>`);

          // Stocker les retards dans une variable
          delayMarkers[delay.id] = delayMarker;
        }
      }
    });

    // Stocker les nouvelles données comme étant les données précédentes
    previousDelayData = data;

    // Mettre à jour l'heure de la dernière mise à jour
    const lastUpdate = new Date();
    const formattedUpdateTime = lastUpdate.toLocaleTimeString();
    // Vous pouvez également mettre à jour un élément HTML pour afficher l'heure de la dernière mise à jour des retards ici
    // document.getElementById("lastUpdateTimeDelays").innerText = `Dernière mise à jour : ${formattedUpdateTime}`;
  } catch (error) {
    console.error("Erreur de chargement des retards des bus: ", error);
  }
}

// Déclaration d'une variable pour stocker les marqueurs de retard récupérés précédemment
let previousDelayData = null;
let delayMarkers = {}; // Stocker les marqueurs de retard par ID

// Fonction pour comparer deux jeux de données de retards
function areDelayDataEqual(newData, oldData) {
  return JSON.stringify(newData) === JSON.stringify(oldData);
}

// Fonction pour effectuer le scraping des retards des bus et les charger
async function scrapeDelays() {
  try {
    const response = await fetch("/scrapeDelays");
    if (!response.ok) {
      throw new Error("Erreur lors du scraping des retards.");
    }

    const data = await response.json();

    // Charger les nouvelles données des retards après le scraping
    await loadDelayData();
  } catch (error) {
    console.error("Erreur lors du scraping des retards: ", error);
  }
}

// Ajouter un événement de clic au bouton pour lancer le scraping des retards
document.getElementById("scrapeButton").addEventListener("click", scrapeDelays);

// Charger les données initiales des retards au chargement de la page
window.addEventListener("load", async () => {
  await loadDelayData(); // Charger les données initiales des retards
});
