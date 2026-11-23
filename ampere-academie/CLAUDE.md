# Ampère Académie — consignes pour continuer le projet

Application d'apprentissage des schémas électriques, du câblage, des coffrets (2D/3D), des automates et de la maintenance, de zéro au niveau ingénieur. Cibles : Windows (WebView2), Android (APK WebView), web (un seul fichier).

## Principes non négociables (demandés par la propriétaire du projet)
- Qualité avant quantité : chaque notion juste, vérifiée 2 à 3 fois (valeurs normatives NF C 15-100, NF C 18-510, IEC 60617, IEC 60204-1, IEC 61131-3…).
- On apprend en voyant, en manipulant et en étant mis à l'épreuve : simulations, interactivité, 3D, défis.
- Défis **aléatoires** (jamais deux jours identiques), à **chaque étape**, de plus en plus durs ; niveau expert = forcer la réflexion, l'inventivité, la recherche. Défis sur cahier des charges textuel avec plusieurs solutions valides + une solution de référence « la meilleure ». Très grands projets industriels interconnectés.
- Interface : pas d'interface « générique d'IA ». Identité « atelier de nuit » (encre bleu-noir, cuivre, lueur ambre), Bahnschrift, thème clair « papier calque ».
- Langue : français. Aucune donnée envoyée : progression en localStorage (export/import JSON).
- JavaScript pur, sans dépendance ni CDN (l'APK et l'exe fonctionnent hors ligne). La 3D est un mini-moteur WebGL maison (src/gl.js).

## Organisation
| Fichier | Rôle |
|---|---|
| `app/index.html` | Page ; liste des scripts entre `<!--SCRIPTS-->` (ordre important) |
| `app/src/core.js` | Stockage, routeur, galons/XP, icônes, utilitaires (`AA.rng` reproductible) |
| `app/src/sim.js` | Moteur électrique (nets, contacts, bobines, protections, triphasé, multimètre, pannes) |
| `app/src/circuits.js` | Folios (coordonnées en grille de 20 px, organes verticaux, borne amont en haut) |
| `app/src/schema-view.js` | Rendu SVG IEC + interaction (poussoirs, multimètre, zoom) |
| `app/src/curriculum.js` | Programme complet (niveaux > modules > leçons) |
| `app/src/lessons/*.js` | Contenu des leçons `AA.L[id] = { min, why, screens:[[blocs]] }` |
| `app/src/app.js` | Vues (accueil, parcours, leçon, atelier, labo, défis, coffret, automate, profil) |
| `app/tests/tests.html` | Tests automatiques (ouvrir dans un navigateur ; titre « OK n » si tout passe) |

Blocs de leçon : `h p list analogy tip warn real formula table quiz num think recap sim circuit`.

## Lancer / tester
`python -m http.server 8779 --directory app` puis http://localhost:8779/ et http://localhost:8779/tests/tests.html

## Construire (sur le PC Windows de la propriétaire)
```powershell
powershell -ExecutionPolicy Bypass -File outils\build.ps1     # dist\index.html
powershell -ExecutionPolicy Bypass -File android\build.ps1    # dist\Ampere-Academie.apk
powershell -ExecutionPolicy Bypass -File windows\build.ps1    # dist\Ampere-Academie-Windows.zip
```
Les outils (JDK, SDK Android, WebView2) sont dans `C:\Users\SUZANE\AndroidBuild`. Garder `android\signing\` hors du dépôt (clé de signature, ignorée par git).
