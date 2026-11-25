# Ampère Académie — consignes pour continuer le projet

Application d'apprentissage des schémas électriques, du câblage, des coffrets (2D/3D), des automates et de la maintenance, de zéro au niveau ingénieur. Cibles : Windows (WebView2), Android (APK WebView), web (un seul fichier).

## Principes non négociables (demandés par la propriétaire du projet)
- Qualité avant quantité : chaque notion juste, vérifiée 2 à 3 fois (valeurs normatives NF C 15-100, NF C 18-510, IEC 60617, IEC 60204-1, IEC 61131-3…).
- On apprend en voyant, en manipulant et en étant mis à l'épreuve : simulations, interactivité, 3D, défis.
- Défis **aléatoires** (jamais deux jours identiques), à **chaque étape**, de plus en plus durs ; niveau expert = forcer la réflexion, l'inventivité, la recherche. Défis sur cahier des charges textuel avec plusieurs solutions valides + une solution de référence « la meilleure ». Très grands projets industriels interconnectés.
- Interface : jamais d'interface « générique d'IA », et pas de métaphore mécanique ou électrique (la refonte « rail DIN / poussoirs / synoptique » a été rejetée, comme la palette encre + cuivre). Direction actuelle : artistique — fond vivant (nappes de couleur liquides qui dérivent, `.ambient`), panneaux de verre translucides, titres à empattements, ruban de navigation en verre avec bulle liquide, XP en goutte qui se remplit, accueil en « fil » de gouttes, parcours en gouttes. Sept thèmes : Aube de verre, Abysses, Aquarelle, Nébuleuse, Miel, Brume, Contraste. Effets de souris sobres (aucun effet qui suit le pointeur). La propriétaire attache une grande importance à l'ambiance : « le goût de revenir ».
- Chaque simulation doit permettre de changer les valeurs et afficher ses formules : bandeau « Les formules » via `AA.SIMFORM` (src/sim-formulas.js) pour les simulations qui ne les montrent pas déjà.
- Chaque leçon doit avoir une visualisation ou simulation (AA.VISMAP dans visuals-map.js ou dans le fichier de leçons) ; le parcours automatique des leçons vérifie qu'aucune n'en est dépourvue.
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
| `app/src/base.css` | Thèmes, fond vivant, verre, navigation, accueil, parcours |
| `app/src/fx.js` | Changement de thème (révélation circulaire) — aucun effet de pointeur |
| `app/src/sim-formulas.js` | Formules affichées sous les simulations (`AA.SIMFORM`, `AA.addFormula`) |
| `app/src/defis-elec.js` | Défi « Électrotechnique » : études chiffrées moteur / transformateur / four |
| `app/src/defis-auto.js` | Défis « Grafcet » (prédire la situation finale), « Réglage PID » (cahier des charges) et « Trame Modbus » (décoder une réponse RTU) |
| `app/src/lessons/n6b.js` | Capteurs, sorties, AU câblé, moteur et simulateur Grafcet (`AA.GRAFCET`, IEC 60848), GEMMA |
| `app/src/lessons/n9.js` | Dépannage sur folios en panne (missions + quiz), index de polarisation, boucle de défaut, harmoniques, AMDEC, disponibilité, stock (`AA.N9`) |
| `app/src/lessons/n8.js` | Variateurs (MLI, U/f, rampes, freinage), codeurs, boucle de position, interpolation, Modbus (CRC), réseaux, IO-Link, cybersécurité, IHM, historisation, TRS (`AA.N8`) |
| `app/src/lessons/n7.js` | Langages IEC 61131-3, analogique (4-20 mA, Pt100, échelle, filtre), PID (`AA.N7`), sécurité, alarmes |
| `app/src/visuals-a.js`, `visuals-b.js`, `visuals-map.js`, `visuals.css` | Visualisations des leçons et association leçon → visualisation |
| `app/src/solar.js` | Site isolé, chaînes, MPPT, ombrage, orientation, batteries, ASI, inverseur de sources, défis associés |
| `app/src/photos.js`, `app/img/` | Photos d'appareils (Wikimedia Commons, licences libres, crédits affichés dans le profil) |
| `app/src/app.js` | Vues (accueil, parcours, leçon, atelier, profil) et blocs de leçon |
| `app/tests/tests.html` | Tests automatiques (ouvrir dans un navigateur ; titre « OK n » si tout passe) |

Blocs de leçon : `h p list analogy tip warn real formula table quiz num think recap sim circuit symbols plc`.
`circuit` accepte `tasks` (missions vérifiées sur la simulation), `meter`, `overload`, `fault`, `guide`. `plc` accepte `test` (`table` ou `seq`/`at`) : ajouter la solution dans tests.js (bloc « Leçons d'automate »).

## Lancer / tester
`python outils/serve.py 8779` (serveur sans cache) puis http://localhost:8779/ et http://localhost:8779/tests/tests.html

## Construire (sur le PC Windows de la propriétaire)
```powershell
powershell -ExecutionPolicy Bypass -File outils\build.ps1     # dist\index.html
powershell -ExecutionPolicy Bypass -File android\build.ps1    # dist\Ampere-Academie.apk
powershell -ExecutionPolicy Bypass -File windows\build.ps1    # dist\Ampere-Academie-Windows.zip
```
Les outils (JDK, SDK Android, WebView2) sont dans `C:\Users\SUZANE\AndroidBuild`. La clé de signature Android est dans `C:\Users\SUZANE\AndroidBuild\cles\ampere-academie` (hors dépôt) : à sauvegarder aussi sur un support externe.

## État au 25/11/2026 (soir)
- 13 niveaux ; 223 leçons rédigées (niveaux 0 à 9 complets, plus mesure et solaire), toutes avec une visualisation ou une simulation.
- Modèles vérifiés par les tests : `AA.ELEC`, `AA.DESIGN`, `AA.GRAFCET` (règles d'évolution IEC 60848, actions N/S/R/D/L, traduction Ladder), `AA.N7` (Pt100 IEC 60751, 4-20 mA et NAMUR NE 43, mise à l'échelle, filtre, PID avec anti-saturation, Ziegler-Nichols).
- 8 folios vivants ; 13 types de défis aléatoires (dont électrotechnique avec études de variateur et de maintenance, Grafcet, réglage PID, trame Modbus) ; 7 labos ; coffret 3D.
- 156 tests automatiques au vert (dont CRC Modbus comparé aux exemples de référence), dont un contrôle de syntaxe de tous les scripts.
- L'appli Windows est copiée sur le Bureau de la propriétaire (`Desktop\Ampere Academie` + raccourci « Ampère Académie ») : le dossier `dist` est trop profond pour Windows (chemin > 260 caractères). Après chaque fabrication, recopier `dist\Ampere Academie PC\*` vers ce dossier.

## Suite prévue (par ordre de priorité)
1. Rédiger les leçons restantes, module par module (n10 ingénierie : sécurité des machines ISO 13849 / IEC 62061, réseaux HTA, énergie, conduite de projet), chacune avec sa visualisation réglable et ses formules, et un défi par module.
   Continuer la passe sur les simulations : valeurs réglables partout où c'est pertinent (cable, tableau, megger, rcdtest, ups…).
2. Nouveaux folios : marche par à-coups, commande multi-postes, Dahlander, freinage, démarrage statorique, va-et-vient automatique par fins de course, schémas TT/TN/IT.
3. Défis : éditeur de schéma (câbler soi-même un folio à partir d'un cahier des charges), Grafcet, diagnostic sur coffret 3D, projets multi-sites et extensions d'usine.
4. Coffret 3D : autres armoires (inversion, étoile-triangle), mode « câblage » où l'apprenant tire les fils.
5. Labo : variateur détaillé, batteries et recharge VE, protection différentielle, harmoniques.

Attention : sous Windows, csc et WebView2 refusent les chemins de plus de 260 caractères ; les scripts de fabrication compilent dans %TEMP%.
