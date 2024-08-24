// Initialiser la carte avec le centre et le zoom initial
const map = L.map("map").setView([49.884287, 2.309166], 13);

// Ajouter une couche de tuiles à la carte
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Fonction pour charger le fichier GeoJSON et créer un dictionnaire des arrêts
async function loadStopData() {
  try {
    const response = await fetch("assets/json/info.geoJson");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des données des arrêts.");
    }
    const geoJsonData = await response.json();

    const stops = {};
    geoJsonData.features.forEach((feature) => {
      const stopId = feature.properties.id;
      const stopName = feature.properties.name;
      stops[stopId] = stopName;
    });

    return stops;
  } catch (error) {
    return {}; // Retourner un dictionnaire vide en cas d'erreur
  }
}

// Fonction pour ajouter les bus sur la carte
async function loadBusData() {
  try {
    // Charger les données des arrêts
    const stops = await loadStopData();

    // Charger les données JSON du serveur
    const response = await fetch("/scrapedData.json");
    if (!response.ok) {
      throw new Error("Erreur de réseau lors du chargement des données.");
    }
    const data = await response.json();

    // Vider les marqueurs existants
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Log pour le nombre de bus
    console.log(`Nombre total de bus : ${data.content.entity.length}`);

    // Traductions des statuts en français
    const statusTranslations = {
      IN_TRANSIT_TO: "En transit",
      STOPPED_AT: "Arrêté",
      INCOMING_AT: "En approche",
    };

    // Ajouter les nouveaux marqueurs pour les bus
    data.content.entity.forEach((bus) => {
      if (bus.vehicle && bus.vehicle.position) {
        const { latitude, longitude, speed } = bus.vehicle.position;
        const currentStatus = bus.vehicle.current_status;
        const stopId = bus.vehicle.stop_id;

        // Vérifiez que les coordonnées existent
        if (latitude && longitude) {
          let routeIcon = "assets/img/bus_icon.png"; // Icône par défaut
          if (bus.vehicle.trip && bus.vehicle.trip.route_id) {
            routeIcon = `assets/img/${bus.vehicle.trip.route_id}.png`;
          }

          // Création d'une icône de marqueur avec l'image de la ligne
          const icon = L.icon({
            iconUrl: routeIcon,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
          });

          // Vérifiez si la vitesse est définie et valide
          let speedText = "Inconnu";
          if (speed != null) {
            speedText = Math.floor(speed * 3.6) + " km/h"; // Conversion de m/s à km/h
          }

          // Traduire le statut en français
          const statusText = statusTranslations[currentStatus] || "Inconnu";

          // Récupérer le nom de l'arrêt à partir de l'ID de l'arrêt
          const stopName = stops[stopId] || "Inconnu";

          // Ajouter le marqueur sur la carte avec l'icône de l'image
          L.marker([latitude, longitude], { icon })
            .addTo(map)
            .bindPopup(
              `<b>Bus ID:</b> ${bus.id}<br><b>Ligne:</b> ${
                bus.vehicle.trip ? bus.vehicle.trip.route_id : "N/A"
              }<br><b>Vitesse:</b> ${speedText}<br><b>Statut:</b> ${statusText}<br><b>Prochain arrêt:</b> ${stopName}`
            );
        }
      }
    });
  } catch (error) {
    // Gestion des erreurs globales
  }
}

// Fonction pour effectuer le scraping
async function scrapeContent() {
  try {
    const response = await fetch("/scrape");
    if (!response.ok) {
      throw new Error("Erreur lors du scraping.");
    }
    const data = await response.json();
    // Mettre à jour la carte après le scraping
    await loadBusData();
  } catch (error) {
    // Gestion des erreurs globales
  }
}

// Ajouter un événement de clic au bouton pour scraper les données
document
  .getElementById("scrapeButton")
  .addEventListener("click", scrapeContent);

// Exécuter le scraping au chargement de la page
window.addEventListener("load", loadBusData); // Charge les données initiales au chargement de la page
