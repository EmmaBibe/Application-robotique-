# Mobilier étudiant : dressing, étagère de cuisine, station de cuisson

Trois meubles en tube acier et contreplaqué pour une colocation de deux étudiants. Ils sont démontables, modulaires et fixés au mur.

| Meuble | Encombrement | Structure | Panneaux |
|---|---|---|---|
| **A** · Dressing à rideaux (2 penderies + étagères + chaussures) | 1850 × 620 × 1945 mm | tube 25×25×1,5 | CP 15 mm, joues CP 5 mm |
| **B** · Étagère murale de cuisine (assiettes, verres, tasses, bouteilles) | 900 × 290 × 915 mm, posée à 1250 mm du sol | tube 20×20×1,5 | CP 15 mm, bac inox |
| **C** · Station de cuisson (gaz 5 kg, induction BOMA, réchaud, dépose, rangement) | 1550 × 570 × 1420 mm, plan à 808 mm | tube 25×25×1,5 | CP 18 mm, bac inox, écran galva |

## Livrables (dossier `livrables/`)

- `simulation_mobilier.html` : visualisation 3D autonome (aucune connexion nécessaire). Montage étape par étape avec Précédent / Suivant / lecture automatique / sens démontage, rendu final, vues prédéfinies, couches affichables, écartement des modules, fiche de chaque pièce au clic.
- `01_dossier_conception_plans.pdf` : hypothèses, choix 20×20 / 25×25, panneaux, calculs de flèche, flambement et ancrage, assemblages, chevilles selon le mur, sécurité gaz / chaleur / électricité, plans cotés (face, droite, dessus, cadres soudés) et perspectives.
- `02_nomenclature_fiches_debit.pdf` : pièces repérées avec longueurs et usinages, sous-ensembles soudés, quincaillerie, plans de débit des barres de 6 m, calepinage des panneaux 2440 × 1220, liste d'achat avec colonnes de prix à remplir.
- `03_notice_montage_pose_demontage.pdf` : fabrication en atelier, montage illustré pas à pas, pose murale, démontage et colisage, entretien.

Chaque PDF existe aussi en `.html` : il s'ouvre dans un navigateur et s'imprime (Ctrl + P, « Enregistrer en PDF », marges par défaut).

## Modifier une cote

Toutes les dimensions sont dans `src/modele.js`. Après modification :

```
node outils/construire.js            # simulation + documents HTML + PDF
node outils/construire.js --sans-pdf # sans les PDF
```

La génération des PDF utilise Playwright (Chromium). Les listes de débit, les plans, les vues 3D et les calculs sont recalculés à chaque construction.

## Organisation des sources

| Fichier | Rôle |
|---|---|
| `src/modele.js` | Géométrie paramétrique des trois meubles, étapes de montage, hypothèses appareils |
| `src/calculs.js` | Sections, nomenclature et repères, débit en barres, calepinage |
| `src/moteur3d.js` | Rendu 3D logiciel (tampon de profondeur, sélection, arêtes) |
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
