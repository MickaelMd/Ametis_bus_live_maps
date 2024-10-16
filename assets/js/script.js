const map = L.map("map").setView([49.884287, 2.309166], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let stopsLayer = null;
let busMarkersLayer = L.layerGroup().addTo(map);
let stops = {};

// Fonction pour charger les données GeoJSON des arrêts et créer une couche de marqueurs
async function loadStopData() {
  try {
    const response = await fetch("assets/json/info.geoJson");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des données des arrêts.");
    }
    const geoJsonData = await response.json();

    geoJsonData.features.forEach((feature) => {
      const stopId = feature.properties.id;
      const stopName = feature.properties.name;
      stops[stopId] = stopName;
    });

    stopsLayer = L.geoJSON(geoJsonData, {
      pointToLayer: (feature, latlng) => {
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

let previousBusData = null;

function areBusDataEqual(newData, oldData) {
  return JSON.stringify(newData) === JSON.stringify(oldData);
}

// Fonction pour charger les données des bus et les afficher sur la carte
let busMarkers = {};

async function loadBusData() {
  try {
    // Charger les données des bus
    const busResponse = await fetch("/scrapedData.json");
    if (!busResponse.ok) {
      throw new Error(
        "Erreur de réseau lors du chargement des données des bus."
      );
    }
    const busData = await busResponse.json();

    // Charger les retards des bus
    const delayResponse = await fetch("/scrapedDelays.json");
    if (!delayResponse.ok) {
      throw new Error(
        "Erreur de réseau lors du chargement des données des retards."
      );
    }
    const delayData = await delayResponse.json();

    // Comparer les nouvelles données avec les précédentes
    if (previousBusData && areBusDataEqual(busData, previousBusData)) {
      console.log(
        "Les données des bus sont identiques, pas besoin de mettre à jour."
      );
      return;
    }

    console.log(`Nombre total de bus : ${busData.content.entity.length}`);

    // Vider les marqueurs de bus existants avant d'ajouter les nouveaux
    busMarkersLayer.clearLayers();
    busMarkers = {}; // Réinitialiser les marqueurs de bus

    const statusTranslations = {
      IN_TRANSIT_TO: "En transit",
      STOPPED_AT: "Arrêté",
      INCOMING_AT: "En approche",
    };

    // Créer un objet pour stocker les retards associés aux bus
    const delayMap = {};
    delayData.content.entity.forEach((delay) => {
      const tripId = delay.id;
      if (
        delay.trip_update &&
        Array.isArray(delay.trip_update.stop_time_update)
      ) {
        delay.trip_update.stop_time_update.forEach((update) => {
          if (update.arrival && update.arrival.delay) {
            delayMap[tripId] = update.arrival.delay;
          }
        });
      }
    });

    busData.content.entity.forEach((bus) => {
      if (bus.vehicle && bus.vehicle.position) {
        const { latitude, longitude, speed } = bus.vehicle.position;
        const currentStatus = bus.vehicle.current_status;
        const stopId = bus.vehicle.stop_id;
        const tripId = bus.vehicle.trip ? bus.vehicle.trip.trip_id : null;

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
          let timeDifference = currentTimestamp - busTimestamp;

          let minutes = Math.floor(timeDifference / 60);
          let seconds = timeDifference % 60;

          let delayText = `Dernière mise à jour : ${minutes} min ${seconds} sec`;

          // Déterminer le retard estimé pour ce bus
          const delay = delayMap[tripId];
          const estimatedDelayText =
            delay !== undefined
              ? `Retard estimé : ${delay} sec`
              : "Retard estimé : Non disponible";

          // Créer le marqueur et stocker les informations du bus
          const busMarker = L.marker([latitude, longitude], { icon })
            .addTo(busMarkersLayer)
            .bindPopup(
              `<b>Bus ID:</b> ${bus.id}<br><b>Ligne:</b> ${
                bus.vehicle.trip ? bus.vehicle.trip.route_id : "Non attribué"
              }<br><b>Vitesse:</b> ${speedText}<br><b>Statut:</b> ${statusText}<br><b>Prochain arrêt:</b> ${stopName}<br><b>${delayText}</b><br><b>${estimatedDelayText}</b>`
            );

          // Stocker le timestamp et le marqueur pour chaque bus
          busMarkers[bus.id] = {
            marker: busMarker,
            timestamp: busTimestamp,
          };

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
        } else {
          console.warn(
            `Les données du bus ID ${bus.id} sont incomplètes. Latitude ou Longitude manquante.`
          );
        }
      } else {
        console.warn(
          `Les données du bus ID ${bus.id} sont incomplètes. Position ou véhicule manquant.`
        );
      }
    });

    // Stocker les nouvelles données comme étant les données précédentes
    previousBusData = busData;

    // Mettre à jour l'heure de la dernière mise à jour
    const lastUpdate = new Date();
    const formattedUpdateTime = lastUpdate.toLocaleTimeString();
  } catch (error) {
    console.error("Erreur de chargement des données des bus: ", error);
  }
}

function updateBusTimestamps() {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  Object.keys(busMarkers).forEach((busId) => {
    const busData = busMarkers[busId];
    const timeDifference = currentTimestamp - busData.timestamp;

    const minutes = Math.floor(timeDifference / 60);
    const seconds = timeDifference % 60;

    const delayText = `Dernière mise à jour : ${minutes} min ${seconds} sec`;

    const popupContent = busData.marker.getPopup().getContent();
    const updatedContent = popupContent.replace(
      /Dernière mise à jour :.*?(min.*?)<\/b>/,
      `<b>${delayText}</b>`
    );
    busData.marker.getPopup().setContent(updatedContent);
  });
}

setInterval(updateBusTimestamps, 1000);

async function scrapeContent() {
  try {
    const response = await fetch("/scrape");
    if (!response.ok) {
      throw new Error("Erreur lors du scraping.");
    }

    await loadBusData();
  } catch (error) {
    console.error("Erreur lors du scraping des données: ", error);
  }
}

document
  .getElementById("scrapeButton")
  .addEventListener("click", scrapeContent);

document.getElementById("stopbus").addEventListener("click", toggleStops);

window.addEventListener("load", async () => {
  await loadStopData();
  await loadBusData();
});
