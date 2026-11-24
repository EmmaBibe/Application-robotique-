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
| `app/src/bench.js` | Banc de schéma réutilisable (manœuvre, multimètre V/Ω, missions vérifiées) |
| `app/src/lesson-sims.js` | Simulateurs de leçons (électrons, Ohm, oscilloscope, corps humain, plaque moteur) |
| `app/src/defis-data.js` | Tableaux normatifs (Iz IEC 60364-5-52, kT, kG, calibres, transformateurs) |
| `app/src/defis.js` | Moteur de défis : panne, logique, calcul, cahier des charges, défi du jour, anti-répétition |
| `app/src/projets.js` | Grands projets industriels interconnectés (sites générés, 5 à 9 étapes) |
| `app/src/labo.js` | Labo : triphasé, cos φ, transformateur, moteur + variateur, PV, régulation, chute de tension |
| `app/src/gl.js`, `coffret.js` | Moteur WebGL maison et coffret de démarrage direct 3D (même simulation que le folio) |
| `app/src/ladder.js` | Automate : moteur Ladder, éditeur, procédé animé, cahiers des charges notés |
| `app/src/app.js` | Vues (accueil, parcours, leçon, atelier, profil) et blocs de leçon |
| `app/tests/tests.html` | Tests automatiques (ouvrir dans un navigateur ; titre « OK n » si tout passe) |

Blocs de leçon : `h p list analogy tip warn real formula table quiz num think recap sim circuit symbols plc`.
`circuit` accepte `tasks` (missions vérifiées sur la simulation), `meter`, `overload`, `fault`, `guide`. `plc` accepte `test` (`table` ou `seq`/`at`) : ajouter la solution dans tests.js (bloc « Leçons d'automate »).

## Lancer / tester
`python -m http.server 8779 --directory app` puis http://localhost:8779/ et http://localhost:8779/tests/tests.html

## Construire (sur le PC Windows de la propriétaire)
```powershell
powershell -ExecutionPolicy Bypass -File outils\build.ps1     # dist\index.html
powershell -ExecutionPolicy Bypass -File android\build.ps1    # dist\Ampere-Academie.apk
powershell -ExecutionPolicy Bypass -File windows\build.ps1    # dist\Ampere-Academie-Windows.zip
```
Les outils (JDK, SDK Android, WebView2) sont dans `C:\Users\SUZANE\AndroidBuild`. Garder `android\signing\` hors du dépôt (clé de signature, ignorée par git).

## État au 24/11/2026
- 76 leçons rédigées (niveaux 0, 1, 2, 3 et 6 en partie) sur ~240 au programme.
- 6 folios vivants : simple allumage, va-et-vient, télérupteur, démarrage direct, inversion, étoile-triangle.
- 6 types de défis aléatoires + défi du jour ; 7 labos ; coffret 3D ; automate Ladder.
- 88 tests automatiques au vert (`app/tests/tests.html`).
- Fabrications vérifiées : `dist/index.html`, `dist/Ampere-Academie-Windows.zip`, `dist/Ampere-Academie.apk`.

## Suite prévue (par ordre de priorité)
1. Rédiger les leçons restantes, module par module (n4 électrotechnique, n5 conception, n6m4 Grafcet, n7, n8, n9, n10), avec un défi par module.
2. Nouveaux folios : marche par à-coups, commande multi-postes, Dahlander, freinage, démarrage statorique, va-et-vient automatique par fins de course, schémas TT/TN/IT.
3. Défis : éditeur de schéma (câbler soi-même un folio à partir d'un cahier des charges), Grafcet, diagnostic sur coffret 3D, projets multi-sites et extensions d'usine.
4. Coffret 3D : autres armoires (inversion, étoile-triangle), mode « câblage » où l'apprenant tire les fils.
5. Labo : variateur détaillé, batteries et recharge VE, protection différentielle, harmoniques.

Attention : sous Windows, csc et WebView2 refusent les chemins de plus de 260 caractères ; les scripts de fabrication compilent dans %TEMP%.
