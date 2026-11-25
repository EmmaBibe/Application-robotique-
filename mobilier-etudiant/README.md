# Mobilier étudiant : dressing, étagère de cuisine, station de cuisson

Trois meubles en tube acier et contreplaqué pour une colocation de deux étudiants. Ils sont démontables, modulaires et fixés au mur.

| Meuble | Encombrement | Structure | Panneaux |
|---|---|---|---|
| **A** · Dressing à rideaux (2 penderies + étagères + chaussures) | 1850 × 620 × 1945 mm | tube 25×25×1,5 | CP 15 mm, joues CP 5 mm |
| **B** · Étagère murale de cuisine (assiettes, verres, tasses, bouteilles) | 900 × 290 × 915 mm, posée à 1250 mm du sol | tube 20×20×1,5 | CP 15 mm, bac inox |
| **C** · Station de cuisson (gaz 5 kg, induction BOMA, réchaud, dépose, rangement) | 1550 × 570 × 1420 mm, plan à 808 mm | tube 25×25×1,5 | CP 18 mm, bac inox, écran galva |

## Livrables (dossier `livrables/`)

- `simulation_mobilier.html` : visualisation 3D autonome (aucune connexion nécessaire, environ 2,4 Mo). Trois niveaux de rendu :
  - **Photo** (par défaut sur ordinateur) : lancer de rayons progressif. La lumière d'une vraie pièce photographiée (HDRI) éclaire la scène, rebondit sur les murs et le bois, se reflète dans l'inox et traverse les verres. L'image s'affine pendant quelques secondes dès qu'on lâche la souris (compteur de passes en bas à droite).
  - **Réaliste** : rendu temps réel avec ombres douces et occlusion ambiante, pour manipuler la vue sans attendre.
  - **Rapide** : allégé pour les téléphones (choisi automatiquement sur écran tactile).

  Matières physiques (acier peint, inox brossé, chrome, contreplaqué avec chants, verre, céramique, lin, jersey, denim), détails de fabrication visibles (cordons de soudure, collerettes des écrous à sertir, têtes de vis CHC, boulons de liaison, bouchons, câbles électriques). Montage étape par étape avec Précédent / Suivant / lecture automatique / sens démontage, rendu final, vues prédéfinies, couches affichables, rideaux ouverts ou fermés, écartement des modules, fiche de chaque pièce au clic. Adresse directe d'un meuble et d'un rendu : `simulation_mobilier.html?meuble=C&rendu=photo` (meuble A, B, C ou K pour la cuisine ; rendu photo, haute ou standard).
- `01_dossier_conception_plans.pdf` : hypothèses, choix 20×20 / 25×25, panneaux, calculs de flèche, flambement et ancrage, assemblages, chevilles selon le mur, sécurité gaz / chaleur / électricité, plans cotés (face, droite, dessus, cadres soudés) et perspectives.
- `02_nomenclature_fiches_debit.pdf` : pièces repérées avec longueurs et usinages, sous-ensembles soudés, quincaillerie, plans de débit des barres de 6 m, calepinage des panneaux 2440 × 1220, liste d'achat avec colonnes de prix à remplir.
- `03_notice_montage_pose_demontage.pdf` : fabrication en atelier, montage illustré pas à pas, pose murale, démontage et colisage, entretien.
- `04_devis_achats.pdf` et `04_devis_achats.xlsx` : liste d'achat consolidée des trois meubles (barres de tube, panneaux, tôles, petits profilés, quincaillerie, finitions, main d'œuvre estimée), quantités minimales et conseillées, coupes des tubes et des panneaux. Dans l'Excel, saisir les prix unitaires (cases jaunes) : montants, sous-totaux, TVA et total se calculent seuls.

Chaque PDF existe aussi en `.html` : il s'ouvre dans un navigateur et s'imprime (Ctrl + P, « Enregistrer en PDF », marges par défaut).

## Modifier une cote

Toutes les dimensions sont dans `src/modele.js`. Après modification :

```
npm install                          # une seule fois : three.js et esbuild
node outils/construire.js            # simulation + documents HTML + PDF
node outils/construire.js --sans-pdf # sans les PDF
node outils/construire.js --passes=0 # PDF avec perspectives en rendu temps réel (rapide)
```

La génération des PDF utilise Playwright (Chromium). Les perspectives principales sont calculées par lancer de rayons (`--passes=40` par défaut) ; sans carte graphique, le calcul passe par le WebGL logiciel SwiftShader et prend une vingtaine de minutes. Les listes de débit, les plans, les vues 3D et les calculs sont recalculés à chaque construction.

## Organisation des sources

| Fichier | Rôle |
|---|---|
| `src/modele.js` | Géométrie paramétrique des trois meubles, étapes de montage, hypothèses appareils |
| `src/calculs.js` | Sections, nomenclature et repères, débit en barres, calepinage |
| `src/rendu3d/` | Rendu réaliste WebGL (three.js) : matières, géométrie détaillée des équipements, éclairage, ombres |
| `src/rendu3d/details.js` | Détails de fabrication (soudures, écrous à sertir, vis, câbles) |
| `src/textures/` | Textures photographiques et éclairage HDRI, CC0 (Poly Haven), voir `SOURCES.txt` |
| `src/moteur3d.js` | Rendu 3D logiciel de secours et vues techniques |
| `src/scenes.js` | Construction des scènes (couches, sol, mur) |
| `src/plans.js` | Vues 2D cotées en SVG, cadres soudés, détails d'assemblage |
| `src/simulation.html`, `src/simulation.js` | Interface de la simulation |
| `src/document.html`, `src/documents.js` | Mise en page des trois documents |
| `outils/construire.js` | Assemblage des fichiers autonomes et export PDF |

## Points à confirmer avant fabrication

1. Dimensions réelles de la bouteille 5 kg avec son brûleur, de la plaque BOMA et du réchaud (le plateau gaz est réglable sur 3 crans, mais la zone bois et le bac inox ont des limites, voir dossier § 1.3).
2. Nature des murs (béton, brique creuse, parpaing) pour choisir les chevilles.
3. Place disponible : largeur de mur pour le dressing (1,85 m) et pour la cuisine (1,55 m + étagère B à côté, jamais au-dessus du gaz).
4. Hauteur de la plinthe (l'écart prévu entre meuble et mur est de 15 mm).
