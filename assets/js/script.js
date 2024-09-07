// Initialiser la carte avec le centre (latitude et longitude) et le niveau de zoom initial.
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
          radius: 6,
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

// Déclaration d'une variable pour stocker les données des bus récupérées précédemment
let previousBusData = null;

// Fonction pour comparer deux jeux de données
function areBusDataEqual(newData, oldData) {
  return JSON.stringify(newData) === JSON.stringify(oldData);
}

// Fonction pour charger les données des bus et les afficher sur la carte
async function loadBusData() {
  try {
    const response = await fetch("/scrapedData.json");
    if (!response.ok) {
      throw new Error("Erreur de réseau lors du chargement des données.");
    }
    const data = await response.json();

    // Comparer les nouvelles données avec les précédentes
    if (previousBusData && areBusDataEqual(data, previousBusData)) {
      console.log("Les données sont identiques, pas besoin de mettre à jour.");
      return; // Ne pas continuer si les données n'ont pas changé
    }

    console.log(`Nombre total de bus : ${data.content.entity.length}`);

    // Vider les marqueurs de bus existants avant d'ajouter les nouveaux
    busMarkersLayer.clearLayers();

    const statusTranslations = {
      IN_TRANSIT_TO: "En transit",
      STOPPED_AT: "Arrêté",
      INCOMING_AT: "En approche",
    };

    data.content.entity.forEach((bus) => {
      if (bus.vehicle && bus.vehicle.position) {
        const { latitude, longitude, speed } = bus.vehicle.position;
        const currentStatus = bus.vehicle.current_status;
        const stopId = bus.vehicle.stop_id;

        if (latitude && longitude) {
          let defaultIconUrl = "assets/img/bus_icon.png";
          let routeIconUrl =
            bus.vehicle.trip && bus.vehicle.trip.route_id
              ? `assets/img/${bus.vehicle.trip.route_id}.png`
              : defaultIconUrl;

          let icon = L.icon({
            iconUrl: routeIconUrl,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
          });

          let speedText =
            speed != null ? Math.floor(speed * 3.6) + " km/h" : "Inconnu";
          const statusText = statusTranslations[currentStatus] || "Inconnu";
          const stopName = stops[stopId] || "Inconnu";

          const currentTimestamp = Math.floor(Date.now() / 1000);
          const busTimestamp = parseInt(bus.vehicle.timestamp, 10);
          let delayMinutes = Math.floor((currentTimestamp - busTimestamp) / 60);
          let delayText =
            delayMinutes > 1
              ? `${delayMinutes} minutes de retard`
              : "À l'heure";

          const busMarker = L.marker([latitude, longitude], { icon })
            .addTo(busMarkersLayer)
            .bindPopup(
              `<b>Bus ID:</b> ${bus.id}<br><b>Ligne:</b> ${
                bus.vehicle.trip ? bus.vehicle.trip.route_id : "Non attribué"
              }<br><b>Vitesse:</b> ${speedText}<br><b>Statut:</b> ${statusText}<br><b>Prochain arrêt:</b> ${stopName}<br><b>Retard estimé:</b> ${delayText}`
            );

          const busIconImg = new Image();
          busIconImg.src = routeIconUrl;
          busIconImg.onerror = function () {
            icon = L.icon({
              iconUrl: defaultIconUrl,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              popupAnchor: [0, -15],
            });
            busMarker.setIcon(icon);
          };
        }
      }
    });

    // Stocker les nouvelles données comme étant les données précédentes
    previousBusData = data;
  } catch (error) {
    console.error("Erreur de chargement des données des bus: ", error);
  }
}

// Fonction pour effectuer le scraping des données des bus et les charger
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
