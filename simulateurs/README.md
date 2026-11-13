# Simulateurs

Ouvrir `index.html` (double-clic), puis choisir un simulateur. Aucun serveur ni internet n'est nécessaire.

| Fichier | Rôle |
|---|---|
| `serre_3d_autonome.html` | Maquette 3D vivante, en un seul fichier (à ouvrir directement) |
| `serre_3d.html` | Source de la maquette ; ne s'ouvre que via un petit serveur local (`python3 -m http.server` dans ce dossier, puis http://localhost:8000/serre_3d.html) |
| `systemes_autonome.html` | Simulateur des systèmes (schémas animés par domaine), en un seul fichier |
| `carte_3d_autonome.html` | Carte CAZ-1 en 3D, en un seul fichier |
| `systemes.html`, `carte_3d.html` | Sources des deux pages précédentes (serveur local nécessaire, comme `serre_3d.html`) |
| `lib/systemes.js` | Sous-systèmes : eau, fertirrigation, bassins, aquaculture du pilote, électricité et délestage, automatismes et mode autonome, pannes, aptitude des cultures, table des règles |
| `lib/schemas.js` | Dessins des huit schémas et fiches des organes |
| `lib/caz1_*.png`, `lib/caz1_3d.json` | Textures et volumes de la carte, produits par `electronique/caz1/fabriquer.py` |
| `lib/modele.js` | Noyau de simulation : climat, régulation, soleil, énergie, finance. Mêmes hypothèses que le dossier et le classeur Excel |
| `lib/three/` | Three.js 0.160 (licence MIT) et les extensions utilisées |
| `construire.py` | Régénère les fichiers `*_autonome.html` après une modification des sources ou de `lib/` |

## Ce que l'on peut faire dans la maquette 3D

- **Regarder** : survol à la souris (clic gauche pour tourner, molette pour zoomer, clic droit pour se déplacer), vue de dessus, marche dans les allées (Z Q S D ou flèches).
- **Comprendre** : cliquer sur n'importe quel élément pour sa fiche (rôle, caractéristiques, coût).
- **Isoler un domaine** : agronomie, génie civil, climat, eau, électricité, capteurs, ou tout ensemble ; masquer le film pour voir l'intérieur.
- **Faire passer le temps** : mois et heure, soleil à sa vraie position pour Lubumbashi (11,7° sud), ombres réelles, lecture accélérée jusqu'à 2 h par seconde.
- **Voir pousser** : tomates du repiquage à la pleine production (fruits verts puis rouges), radeaux de feuilles à tous les stades.
- **Tester une idée** : retirer le stockage thermique, l'écran ou le mur évaporatif et regarder ce que devient la température ; passer en mode manuel et piloter vous-même les ouvrants, l'écran, les extracteurs, le pad et le stockage.
- **Chiffrer** : onglet Finance, curseurs prix et rendements des légumes, coût des tranches, prix du poisson et alevins vendus, ferme avec ou sans aquaculture, avec ou sans tranche 3 ; EBE, VAN, TRI et trésorerie se recalculent avec les formules du classeur.
- **Aller plus loin en rendu** : le bouton « Exporter en glTF » produit un fichier `.glb` qui s'ouvre dans Blender (gratuit) pour des images ou une vidéo photoréalistes.

## Ce que l'on peut faire dans le simulateur des systèmes

- **Choisir une vue** : ensemble, climat, fertirrigation, bassins, eau, électricité, électronique et IIoT, aquaculture, cultures.
- **Suivre les flux** : les tuyaux et câbles en service s'animent dans le sens de circulation ; les organes à l'arrêt restent gris.
- **Lire les raisons** : le tableau des règles indique, pour chaque actionneur, la condition qui l'a mis en marche (par exemple « somme de rayonnement > seuil » pour l'arrosage, « SOC < 30 % » pour le délestage).
- **Provoquer une panne** et regarder la serre se défendre : bascule sur le surpresseur de secours, délestage, mode autonome des automates, alarmes et SMS.
- **Évaluer les cultures** : score d'aptitude de 0 à 100 par culture, calculé sur la température, le DPV, la solution et l'oxygène, avec le facteur limitant affiché.

## Limites

Le climat est calculé par un modèle simplifié (voir `docs/08_climat_thermique.md`) : il est fait pour comparer des choix et sentir les ordres de grandeur, pas pour garantir une température au dixième de degré. Les plantes sont stylisées. Sur un ordinateur ancien, décocher « Film et parois » rend l'affichage plus fluide.
