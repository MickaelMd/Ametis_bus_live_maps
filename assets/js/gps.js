function showUserPosition() {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      const userIcon = L.icon({
        iconUrl: "assets/img/user_icon.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });

      const userMarker = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup("Vous êtes ici.");

      map.setView([latitude, longitude], 15);
    },
    (error) => {
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

document.getElementById("posgps").addEventListener("click", showUserPosition);
