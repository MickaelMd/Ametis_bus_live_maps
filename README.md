

<p align="center">
  <img src="https://github.com/MickaelMd/Ametis_bus_live_maps/blob/main/thumbnail.jpg?raw=true"  height="300" alt="enter image description here">
</p>

Ce projet est un prototype d'application web de visualisation en temps réel des données de transport public du réseau [Ametis](https://www.ametis.fr/),  Il est construit avec Node.js et utilise une carte interactive grâce à la bibliothèque Leaflet, tout en se basant sur des données récupérées par scraping depuis des sources publiques.

L'application se compose de plusieurs fonctionnalités clés :

1.  **Scraping des données des bus** : L'application utilise [`axios`](https://axios-http.com/docs/intro) pour obtenir des informations en temps réel sur les bus depuis l'API [`transport.data.gouv.fr`](https://transport.data.gouv.fr/datasets/ametis), incluant les positions, statuts, et horaires des bus. Ces données sont ensuite stockées dans un fichier JSON pour être affichées sur la carte.
    
2.  **Visualisation des bus sur une carte** : La carte, construite avec Leaflet et les tuiles OpenStreetMap, affiche les positions des bus sous forme de marqueurs dynamiques. Chaque bus est représenté par une icône personnalisée en fonction de sa ligne, et on peut voir des informations comme sa vitesse, son statut actuel et le prochain arrêt. Les utilisateurs peuvent cliquer sur les marqueurs pour obtenir plus de détails sur chaque bus.
    
3.  **Affichage des arrêts de bus** : Une couche séparée affiche les arrêts de bus à partir de données GeoJSON. Les utilisateurs peuvent activer ou désactiver l'affichage des arrêts via un bouton interactif.
    
4.  **Gestion des retards des bus** : L'application scrape également les données de retards des bus, ce qui permet d'afficher des estimations des retards pour chaque bus. Si aucune donnée de retard n'est disponible, un message indiquant "Retard estimé : Non disponible" est affiché.
    
5. **Mise à jour en temps réel** : Les informations des bus sont mises à jour manuellement en appuyant sur un bouton. Cela déclenche un nouveau scraping des données et les met à jour sur la carte.




---

<p align="center">
:heavy_exclamation_mark: Si cela ne fonctionne pas, vérifiez la récupération ou la structure des fichiers JSON. :heavy_exclamation_mark:
</p>

