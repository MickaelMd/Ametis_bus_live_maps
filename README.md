

<p align="center">
  <img src="https://github.com/MickaelMd/Ametis_bus_live_maps/blob/main/assets/img/bus_icon.png?raw=true" alt="enter image description here">
</p>

Ce projet est un prototype d'application web de visualisation en temps réel des données de transport public, notamment des bus, utilisant Node.js avec une carte interactive basée sur la bibliothèque Leaflet et des données issues de scraping provenant de sources publiques.

L'application se compose de plusieurs fonctionnalités clés :

1.  **Scraping des données des bus** : L'application utilise [`axios`](https://axios-http.com/docs/intro) pour récupérer des données de transport en temps réel depuis l'API [`transport.data.gouv.fr`](https://transport.data.gouv.fr/datasets/ametis), incluant les positions, statuts, et horaires des bus. Ces données sont ensuite stockées dans un fichier JSON pour être affichées sur la carte.
    
2.  **Visualisation des bus sur une carte** : La carte, construite avec Leaflet et les tuiles OpenStreetMap, affiche les positions des bus sous forme de marqueurs dynamiques. Chaque bus est représenté par une icône personnalisée, dépendant de la ligne, et est enrichi d'informations telles que la vitesse, le statut actuel, et le prochain arrêt. Les utilisateurs peuvent cliquer sur ces marqueurs pour obtenir des détails supplémentaires sur chaque bus.
    
3.  **Affichage des arrêts de bus** : Une couche séparée affiche les arrêts de bus à partir de données GeoJSON. Les utilisateurs peuvent activer ou désactiver l'affichage des arrêts via un bouton interactif.
    
4.  **Gestion des retards des bus** : L'application scrape également les données de retards des bus, ce qui permet d'afficher des estimations des retards pour chaque bus. Si aucune donnée de retard n'est disponible, un message indiquant "Retard estimé : Non disponible" est affiché.
    
5. **Mise à jour en temps réel** : Les informations des bus sont mises à jour manuellement en appuyant sur un bouton. Cela déclenche un nouveau scraping des données et les met à jour sur la carte.
    
