// Fonction pour afficher la position de l'utilisateur sur la carte
function showUserPosition() {
  // Vérifier si le navigateur supporte la géolocalisation
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
    return;
  }

  // Obtenir la position GPS de l'utilisateur
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Ajouter un marqueur pour la position de l'utilisateur
      const userIcon = L.icon({
        iconUrl: "assets/img/user_icon.png", // Une icône pour l'utilisateur
        iconSize: [30, 30], // Taille de l'icône
        iconAnchor: [15, 15], // Point d'ancrage de l'icône
        popupAnchor: [0, -15], // Position de l'info-bulle
      });

      // Ajouter un marqueur à la position de l'utilisateur
      const userMarker = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup("Vous êtes ici.");

      // Centrer la carte sur la position de l'utilisateur
      map.setView([latitude, longitude], 15);
    },
    (error) => {
      // Gérer les erreurs de géolocalisation
      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert("Permission de localisation refusée.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("Position non disponible.");
          break;
        case error.TIMEOUT:
          alert("Le temps de demande de localisation a expiré.");
          break;
        default:
          alert("Une erreur inconnue s'est produite.");
      }
    }
  );
}

// Associer l'action à un bouton, par exemple celui qui gère les arrêts de bus
document.getElementById("posgps").addEventListener("click", showUserPosition);
