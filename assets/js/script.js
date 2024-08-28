// Initialiser la carte avec le centre (latitude et longitude) et le niveau de zoom initial
const map = L.map("map").setView([49.884287, 2.309166], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Déclarer des variables globales pour les couches de la carte
let stopsLayer = null; // Pour stocker la couche GeoJSON des arrêts de bus
let busMarkersLayer = L.layerGroup().addTo(map); // Initialisation de la couche de groupe pour les marqueurs des bus

// Variable globale pour stocker les arrêts de bus avec leurs noms
let stops = {};

// Fonction pour charger les données GeoJSON des arrêts et créer une couche de marqueurs
async function loadStopData() {
  try {
    // Récupérer les données GeoJSON depuis le fichier local
    const response = await fetch("assets/json/info.geoJson");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des données des arrêts.");
    }
    const geoJsonData = await response.json();

    // Stocker les arrêts dans une variable globale pour un accès facile plus tard
    geoJsonData.features.forEach((feature) => {
      const stopId = feature.properties.id;
      const stopName = feature.properties.name;
      stops[stopId] = stopName;
    });

    // Créer une couche GeoJSON pour afficher les arrêts sur la carte
    stopsLayer = L.geoJSON(geoJsonData, {
      pointToLayer: (feature, latlng) => {
        // Personnaliser l'apparence des marqueurs d'arrêt
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
        // Ajouter une info-bulle à chaque marqueur d'arrêt
        const stopName = feature.properties.name || "Inconnu";
        layer.bindPopup(`<b>Arrêt:</b> ${stopName}`);
      },
    });
  } catch (error) {
    // Afficher une erreur dans la console si le chargement des données échoue
    console.error("Erreur de chargement des données des arrêts: ", error);
  }
}

// Fonction pour afficher ou cacher les arrêts sur la carte
function toggleStops() {
  if (stopsLayer) {
    // Vérifier si la couche des arrêts est déjà sur la carte
    if (map.hasLayer(stopsLayer)) {
      map.removeLayer(stopsLayer); // La retirer si elle est présente
    } else {
      map.addLayer(stopsLayer); // L'ajouter sinon
    }
  }
}

// Fonction pour charger les données des bus et les afficher sur la carte
async function loadBusData() {
  try {
    // Charger les données JSON des bus depuis un fichier local
    const response = await fetch("/scrapedData.json");
    if (!response.ok) {
      throw new Error("Erreur de réseau lors du chargement des données.");
    }
    const data = await response.json();
    console.log(`Nombre total de bus : ${data.content.entity.length}`);

    // Vider les marqueurs de bus existants avant d'ajouter les nouveaux
    busMarkersLayer.clearLayers();

    // Traductions des statuts des bus en français pour l'affichage
    const statusTranslations = {
      IN_TRANSIT_TO: "En transit",
      STOPPED_AT: "Arrêté",
      INCOMING_AT: "En approche",
    };

    // Parcourir chaque entité de bus et ajouter un marqueur pour chaque bus avec ses informations
    data.content.entity.forEach((bus) => {
      if (bus.vehicle && bus.vehicle.position) {
        const { latitude, longitude, speed } = bus.vehicle.position;
        const currentStatus = bus.vehicle.current_status;
        const stopId = bus.vehicle.stop_id;

        // Vérifier que les coordonnées du bus existent
        if (latitude && longitude) {
          let routeIcon = "assets/img/bus_icon.png"; // Icône par défaut pour le bus
          if (bus.vehicle.trip && bus.vehicle.trip.route_id) {
            routeIcon = `assets/img/${bus.vehicle.trip.route_id}.png`; // Icône spécifique à la ligne de bus
          }

          // Créer une icône de marqueur pour le bus avec l'image de la ligne
          const icon = L.icon({
            iconUrl: routeIcon,
            iconSize: [30, 30], // Taille de l'icône
            iconAnchor: [15, 15], // Point d'ancrage de l'icône
            popupAnchor: [0, -15], // Position de l'info-bulle
          });

          // Vérifier si la vitesse est définie et valide
          let speedText = "Inconnu";
          if (speed != null) {
            speedText = Math.floor(speed * 3.6) + " km/h"; // Conversion de m/s à km/h
          }

          // Traduire le statut du bus en français
          const statusText = statusTranslations[currentStatus] || "Inconnu";

          // Récupérer le nom de l'arrêt à partir de l'ID de l'arrêt
          const stopName = stops[stopId] || "Inconnu";

          // Ajouter le marqueur du bus sur la couche de groupe des bus avec ses informations
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
    // Afficher une erreur dans la console si le chargement des données des bus échoue
    console.error("Erreur de chargement des données des bus: ", error);
  }
}

// Fonction pour effectuer le scraping des données des bus et les charger
async function scrapeContent() {
  try {
    // Envoyer une requête au serveur pour lancer le scraping
    const response = await fetch("/scrape");
    if (!response.ok) {
      throw new Error("Erreur lors du scraping.");
    }
    const data = await response.json();
    // Charger les nouvelles données des bus après le scraping
    await loadBusData();
  } catch (error) {
    // Afficher une erreur dans la console si le scraping échoue
    console.error("Erreur lors du scraping des données: ", error);
  }
}

// Ajouter un événement de clic au bouton pour lancer le scraping des données
document
  .getElementById("scrapeButton")
  .addEventListener("click", scrapeContent);

// Ajouter un événement de clic au bouton pour afficher ou cacher les arrêts de bus
document.getElementById("stopbus").addEventListener("click", toggleStops);

// Charger les données initiales des arrêts et des bus au chargement de la page
window.addEventListener("load", async () => {
  await loadStopData(); // Charger les données des arrêts une seule fois au début
  await loadBusData(); // Charger les données initiales des bus
});
