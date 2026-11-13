# 12. Logiciel de supervision et interface

Code : dossier `logiciel/`. Démonstrateur interactif de l'interface (fonctionne hors ligne dans un navigateur, sur données simulées) : `logiciel/dashboard/index.html`.

## 12.1 Pour qui

| Profil | Ce qu'il doit pouvoir faire sans effort |
|---|---|
| Technicien de culture | Voir d'un coup d'œil si tout va bien, savoir quoi faire aujourd'hui, saisir ses observations au téléphone dans la serre, acquitter une alarme |
| Responsable d'exploitation | Suivre la production, les ventes, les coûts d'énergie et d'intrants, la disponibilité des équipements |
| Chercheur ou étudiant | Définir un essai, comparer des lots, exporter des données propres et datées, accéder à l'historique complet |
| Porteur de projet à distance | Recevoir les alertes, consulter l'état de la serre et les indicateurs clés depuis son téléphone |

## 12.2 Principe : la serre comme un organisme

L'interface ne se contente pas d'afficher des chiffres. Elle montre la serre telle qu'elle vit :

- **Le plan vivant** : vue de dessus de la serre, compartiments colorés selon l'écart à la consigne (température, HR, DPV au choix), position de chaque capteur, état de chaque actionneur (ouvrants dessinés ouverts ou fermés, écran tiré ou non, pad humide, extracteur qui tourne). Un clic sur un capteur ouvre sa courbe des dernières 48 h.
- **De la racine à la fleur** : pour chaque lot (une rangée de tomates, un radeau de laitues), une fiche qui raconte sa vie : variété et lot de semences, date de semis, de repiquage, stade actuel calculé, jours avant récolte, climat réellement vécu (DLI cumulée, température moyenne, heures d'humidité excessive), solution reçue, photos datées, observations de ravageurs, interventions, récoltes pesées. La fiche est accessible par le code QR collé sur le radeau ou la rangée.
- **Les flux** : un schéma animé montre d'où vient l'énergie (soleil, batterie, réseau, groupe) et où elle va, et d'où vient l'eau (pluie, forage) et où elle va (plantes, pad, purge). On voit en temps réel le coût de chaque fonction.
- **Pourquoi** : chaque mouvement d'actionneur est accompagné de la raison donnée par le régulateur (« rayonnement fort : écran d'ombrage », « nuit froide : déstockage »). C'est la meilleure façon de faire confiance à un automatisme et d'apprendre à le régler.

## 12.3 Écrans

1. **Accueil** : état global (vert, orange, rouge), alarmes actives, météo actuelle et prévue, indicateurs du jour (DLI reçue, eau consommée, énergie produite et consommée, SOC), tâches du jour.
2. **Plan de la serre** (décrit ci-dessus).
3. **Climat** : courbes température, HR, DPV, CO2, rayonnement, consignes superposées, par compartiment ; actionneurs en bandes sous les courbes.
4. **Eau et solution** : CE, pH, température, oxygène, volumes, drainage, état des cuves, historique des doses.
5. **Énergie** : production, consommation par priorité, SOC, présence réseau, heures de groupe, délestages.
6. **Cultures et lots** : liste des lots en cours avec stade, prévision de récolte, alertes spécifiques au lot ; calendrier de production (semis, repiquages, récoltes prévus et réalisés).
7. **Observations** : saisie au téléphone (ravageur, maladie, désordre physiologique, photo, position), carte de chaleur des observations, courbes des pièges.
8. **Récoltes et ventes** : pesées par lot, catégories (vendable, déclassé, perte), clients, prix, factures ; marge par culture.
9. **Recettes** : édition des consignes par culture et par stade (fichier `donnees/recettes_climat.json`), avec historique des modifications et l'auteur.
10. **Maintenance** : étalonnages, entretiens planifiés et réalisés, stock de pièces, temps de fonctionnement des pompes et moteurs.
11. **Recherche** : voir 12.5.
12. **Paramètres** : utilisateurs et rôles, seuils d'alarme, destinataires des alertes, réglages du régulateur.

L'interface est en français, utilisable sur tablette murale dans l'annexe, sur téléphone dans la serre (gros boutons, lisible en plein soleil, fonctionne avec des gants), et sur ordinateur pour l'analyse.

## 12.4 Alarmes

| Niveau | Exemples | Notification |
|---|---|---|
| Critique | Serre > 35 °C, serre < 8 °C, oxygène des bassins < 5 mg/L, batterie critique, automate muet, CO2 > 1 500 ppm | Sirène locale, SMS et appel au technicien puis au responsable, relance toutes les 15 min jusqu'à acquittement |
| Attention | HR > 92 % depuis 1 h, pH ou CE hors plage, solution trop chaude, citerne basse, porte de sas ouverte, capteur en retard d'étalonnage | Notification sur téléphone et interface |
| Information | Bascule en mode évaporatif, délestage, démarrage du groupe | Journal |

Les règles, seuils et délais sont dans `logiciel/serre_core/alarmes.py` et modifiables depuis l'interface. Une alarme n'est levée qu'après un délai de confirmation, pour éviter les alertes à répétition qui finissent ignorées.

## 12.5 Mode recherche

Pour qu'un chercheur, un étudiant ou l'exploitant lui-même puisse mener des essais sérieux :

- **Définition d'un essai** : objectif, hypothèse, modalités (par exemple deux variétés de tomate, ou deux CE dans les deux bassins), répartition des unités expérimentales sur le plan (aléatoire ou en blocs), variables mesurées, durée.
- **Saisie structurée** des mesures manuelles (hauteur, nombre de feuilles, nombre de bouquets, calibre, teneur en sucre au réfractomètre, poids) avec contrôle de cohérence.
- **Rattachement automatique** du climat et de la solution vécus par chaque modalité.
- **Export** au format CSV et Parquet, avec dictionnaire des variables et métadonnées (unités, capteurs, dates d'étalonnage), prêt pour R ou Python.
- **Journal d'essai** horodaté et non modifiable (les corrections sont tracées), pour la rigueur scientifique.
- **API** en lecture (REST et MQTT) pour les outils extérieurs.

Exemples d'essais prévus dès la première année : comparaison de deux variétés de tomate par type ; effet du refroidissement de solution sur l'épinard en saison chaude ; densité de laitue sur radeau ; prévernalisation de l'ail ; comparaison de deux substrats.

## 12.6 Pile logicielle

| Fonction | Outil | Pourquoi |
|---|---|---|
| Messagerie temps réel | Mosquitto (MQTT) | Léger, standard, éprouvé |
| Régulation et logique métier | Python (`serre_core`) | Lisible, testé (23 tests automatiques), facile à faire évoluer localement |
| Séries temporelles | InfluxDB 2 | Conçu pour les mesures horodatées, rétention configurable |
| Collecte | Telegraf (MQTT vers InfluxDB) | Configuration sans code |
| Analyse et tableaux | Grafana | Graphiques riches, alertes, accès par rôles |
| Interface d'exploitation | Application web dédiée (démonstrateur fourni) | Plan vivant, fiches de lots, saisie terrain |
| Automates | Micrologiciel C++ sur ESP32 (PlatformIO) | Fourni dans `logiciel/firmware/` |
| Déploiement | Docker Compose | Installation et mise à jour en une commande, fourni dans `logiciel/edge/` |

Tout est libre et fonctionne sans abonnement. Le serveur local suffit pour la ferme complète de 1 000 m².

## 12.7 Données conservées

- Mesures brutes à 30 s : 90 jours ; agrégats à 5 min : 3 ans ; agrégats horaires : illimité.
- Événements, alarmes, consignes, observations, récoltes, essais : illimité.
- Volume estimé : moins de 5 Go par an. Sauvegarde quotidienne sur un second disque et, quand internet le permet, vers un stockage distant.

## 12.8 Installation

Voir `logiciel/README.md`. Résumé :

```
cd logiciel/edge
docker compose up -d                 # courtier, base, collecte, Grafana, régulation
python -m pytest                     # depuis logiciel/ : tests du noyau
python -m outils.etude_climatique    # simulation des 12 mois
```

Le démonstrateur d'interface s'ouvre directement : `logiciel/dashboard/index.html`.

## 12.9 Aquaculture dans la supervision

- **Lots de poissons** suivis comme les lots de plantes : date d'empoissonnement, origine des alevins, nombre, poids moyen échantillonné, mortalités, aliment distribué, indice de conversion calculé, date de récolte prévue.
- **Écloserie** : chaque ponte avec sa femelle, son poids d'œufs, son taux d'éclosion, les tris et le nombre d'alevins vendus ou transférés.
- **Ration du jour** proposée à partir de la biomasse estimée et de la température de l'eau (table de rationnement du Clarias), à valider par le technicien.
- **Sujets MQTT** : `serre/lub1/aqua/mesure/bacN` (`{"o2": 6.4, "t": 27.2}`), `serre/lub1/aqua/mesure/reprise` (`{"ph": 7.2, "niveau": 82}`), `serre/lub1/aqua/etat` (soufflantes, pompe vers les cultures, UV), `serre/lub1/aqua/alarme`.
- **Bilan des nutriments** : azote, phosphore et potassium apportés par l'eau des poissons, et complément dosé par la station de fertirrigation, pour suivre l'économie d'engrais réelle.
