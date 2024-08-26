// Initialiser la carte avec le centre et le zoom initial
const map = L.map("map").setView([49.884287, 2.309166], 13);

// Ajouter une couche de tuiles à la carte
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Déclarer des variables globales pour les couches
let stopsLayer = null;
let busMarkersLayer = L.layerGroup().addTo(map); // Initialisation de la couche de groupe pour les bus

// Variable globale pour stocker les arrêts
let stops = {};

// Fonction pour charger les données GeoJSON et créer une couche de marqueurs pour les arrêts
async function loadStopData() {
  try {
    const response = await fetch("assets/json/info.geoJson");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des données des arrêts.");
    }
    const geoJsonData = await response.json();

    // Stocker les arrêts dans une variable globale
    geoJsonData.features.forEach((feature) => {
      const stopId = feature.properties.id;
      const stopName = feature.properties.name;
      stops[stopId] = stopName;
    });

    // Créer une couche GeoJSON pour les arrêts
    stopsLayer = L.geoJSON(geoJsonData, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: "red",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        });
      },
      onEachFeature: (feature, layer) => {
        const stopName = feature.properties.name || "Inconnu";
        layer.bindPopup(`<b>Arrêt:</b> ${stopName}`);
      },
    });
  } catch (error) {
    console.error("Erreur de chargement des données des arrêts: ", error);
  }
}

// Fonction pour afficher ou cacher les arrêts sur la carte
function toggleStops() {
  if (stopsLayer) {
    if (map.hasLayer(stopsLayer)) {
      map.removeLayer(stopsLayer);
    } else {
      map.addLayer(stopsLayer);
    }
  }
}

// Fonction pour charger les données des bus et les afficher sur la carte
async function loadBusData() {
  try {
    // Charger les données JSON du serveur
    const response = await fetch("/scrapedData.json");
    if (!response.ok) {
      throw new Error("Erreur de réseau lors du chargement des données.");
    }
    const data = await response.json();
    console.log(`Nombre total de bus : ${data.content.entity.length}`);

    // Vider les marqueurs de bus existants
    busMarkersLayer.clearLayers();

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

          // Ajouter le marqueur sur la couche de groupe des bus
          L.marker([latitude, longitude], { icon })
            .addTo(busMarkersLayer)
            .bindPopup(
              `<b>Bus ID:</b> ${bus.id}<br><b>Ligne:</b> ${
                bus.vehicle.trip ? bus.vehicle.trip.route_id : "Non attribué"
              }<br><b>Vitesse:</b> ${speedText}<br><b>Statut:</b> ${statusText}<br><b>Prochain arrêt:</b> ${stopName}`
            );
        }
      }
    });
  } catch (error) {
    console.error("Erreur de chargement des données des bus: ", error);
  }
}

// Fonction pour effectuer le scraping et charger les nouvelles données des bus
async function scrapeContent() {
  try {
    const response = await fetch("/scrape");
    if (!response.ok) {
      throw new Error("Erreur lors du scraping.");
    }
    const data = await response.json();
    // Charger les nouvelles données des bus après le scraping
    await loadBusData();
  } catch (error) {
    console.error("Erreur lors du scraping des données: ", error);
  }
}

// Ajouter un événement de clic au bouton pour scraper les données
document
  .getElementById("scrapeButton")
  .addEventListener("click", scrapeContent);

// Ajouter un événement de clic au bouton pour afficher ou cacher les arrêts
document.getElementById("stopbus").addEventListener("click", toggleStops);

// Charger les données initiales au chargement de la page
window.addEventListener("load", async () => {
  await loadStopData(); // Charger les arrêts une seule fois au début
  await loadBusData(); // Charger les données de bus initiales
});
