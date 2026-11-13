# 18. Simulateurs, dossier de plans et carte électronique CAZ-1

Ce chapitre décrit les outils qui permettent de « vivre » la serre avant de l'avoir construite, le dossier de plans qui servira à consulter les entreprises, et la carte électronique conçue pour les automates de zone.

## 18.1 Trois simulateurs, un même moteur

Les trois simulateurs fonctionnent hors ligne dans un navigateur récent, d'un double-clic (dossier `simulateurs/`). Ils partagent le même moteur de calcul, aux hypothèses identiques à celles de ce dossier et du classeur financier :

- le modèle climatique (rayonnement, transmission de la couverture, transpiration, ventilation naturelle à travers les filets, mur évaporatif, écran, stockage thermique, pertes par la paroi et vers le ciel) ;
- la régulation par priorités du chapitre 8, avec la raison de chaque décision ;
- les sous-systèmes : eau (pluie, premier flot, citerne, tampon, forage, osmoseur), fertirrigation (somme de rayonnement, drainage, recyclage, UV, dosage CE puis pH), bassins (oxygène, température, refroidissement, appoint), électricité (production, batterie, réseau intermittent, groupe, contacteurs de délestage, puissance de chaque départ), automatismes (messages MQTT, passage en mode autonome, alarmes et SMS) ;
- l'aptitude des cultures : pour chaque culture, la température, le DPV, la solution (température, CE, pH) et l'oxygène sont comparés à la recette ; le facteur le plus défavorable fixe le score (loi du minimum).

| Simulateur | Fichier | À quoi il sert |
|---|---|---|
| Maquette 3D vivante | `serre_3d_autonome.html` | Se promener dans la serre, voir le soleil réel du mois et de l'heure, voir bouger ouvrants, écran, pad, extracteurs ; voir circuler l'eau et l'énergie dans les tuyaux et câbles ; cliquer sur chaque élément ; isoler un domaine ; retirer un équipement ; piloter en manuel ; provoquer une panne ; lire les conditions de chaque culture ; jouer sur les prix et rendements |
| Simulateur des systèmes | `systemes_autonome.html` | Huit vues schématiques animées (ensemble, climat, fertirrigation, bassins, eau, électricité, électronique et IIoT, cultures) : qui fait quoi, quand, sous quelles conditions ; règles allumées en direct ; journal des événements ; carte CAZ-1 avec ses voyants |
| Supervision | `../logiciel/dashboard/index.html` | L'écran de travail du technicien, tel qu'il sera sur site |

### Pannes que l'on peut provoquer

| Panne | Ce que l'on doit voir |
|---|---|
| Serveur de supervision arrêté | après 2 min, les trois automates passent en mode autonome (voyant AUTO), la serre continue à se réguler, alarme « serveur muet » |
| Coupure SNEL prolongée | fonctionnement sur solaire et batterie, délestage progressif KM3 puis KM2 puis KM1, démarrage du groupe sous 15 % sans soleil |
| Sonde pH qui dérive | le dosage d'acide se trompe, l'écart avec le contrôle manuel déclenche l'alarme « pH incohérent » |
| Pompe d'irrigation bloquée | arrosage commandé sans débit : alarme critique et SMS |
| Surpresseur des bassins en panne | bascule automatique sur le surpresseur de secours 24 V, oxygène qui baisse moins vite |
| Rafale d'orage | ouvrants fermés immédiatement (sécurité de la structure) |
| Capteur T/HR muet | alarme, régulation sur valeurs de secours |
| Lampe UV grillée | alarme : le drainage revient en cuve sans désinfection |

### Ce que le simulateur dit des cultures

Moyenne sur 24 heures du score d'aptitude (100 = toutes les grandeurs dans la plage optimale de la recette), serre complète, régulation automatique, et facteur qui limite le plus souvent :

| Culture | Janvier (pluies) | Avril | Juillet (froid sec) | Octobre (chaud sec) |
|---|---|---|---|---|
| Tomate | 82 (DPV) | 90 | 79 | 84 |
| Poivron | 84 | 89 | 69 (DPV) | 81 |
| Piment | 69 (DPV) | 72 | 65 | 71 |
| Laitue | 65 (température) | 76 | 83 | 72 (température) |
| Chou de Chine | 58 (température) | 69 | 81 | 63 (température) |
| Épinard | 47 (température) | 54 | 65 | 46 (température) |
| Céleri | 34 (solution trop chaude) | 58 | 79 | 40 (solution trop chaude) |
| Amarante | 89 | 90 | 71 (température) | 92 |
| Basilic | 85 | 92 | 76 (température) | 84 |
| Poireau, oignon vert | 65 | 83 | 87 | 73 |

Trois enseignements, cohérents avec le chapitre 3 :

- Les cultures de fruits et l'amarante sont à l'aise toute l'année ; leur seule gêne est un DPV un peu élevé l'après-midi en saison sèche, ou trop bas la nuit en saison des pluies.
- L'épinard et, dans une moindre mesure, le chou de Chine souffrent dès que l'air dépasse 24-25 °C : en saison chaude, l'épinard est remplacé par l'amarante ou la baselle (calendrier du chapitre 3).
- Le céleri est limité par la température de la solution du bassin tempéré (25 à 26 °C en octobre et en janvier, pour un maximum souhaitable de 22 °C). Deux réponses : le cultiver dans le bassin frais de septembre à mars (en échange d'une partie de l'épinard, lui-même gêné par la chaleur), ou ne le produire qu'en saison froide. Le calendrier de `donnees/calendrier_production.csv` le place toute l'année dans le bassin tempéré : il faut le corriger dans ce sens avant le démarrage du pilote, et vérifier avec les premières mesures de température de solution.

Ces scores sont des indicateurs de conditions, pas des prévisions de rendement : ils disent si le climat et la solution sont dans la bonne plage, pas combien la culture produira.

## 18.2 Dossier de plans et schémas

Le dossier `plans/Dossier_plans_et_schemas.pdf` (format A3, cadre normalisé avec repères de zones et cartouche) comprend 16 planches :

| N° | Planche |
|---|---|
| 000 | Bordereau des plans |
| A01 à A04 | Plan de masse, plan de la serre et de l'annexe, coupe A-A, fondations et élévation du pignon est |
| H01 à H03 | P&ID de l'eau (collecte, traitement, stockage), de la fertirrigation fruits, des bassins feuilles |
| E01 à E04 | Schéma unifilaire (calibres, sections, différentiels séparés pour les charges vitales), commande 24 V et délestage, câblage de l'armoire AUT-F, mise à la terre et foudre |
| I01, I02 | Architecture réseau et adressage (IP, Modbus, MQTT), organigramme de la régulation climatique |
| T01, T02 | Liste des entrées et sorties des trois automates, liste des câbles |

Les planches sont générées par `plans/generer_plans.py` : une modification de conception se reporte en relançant le script.

## 18.3 Carte électronique CAZ-1

### Pourquoi une carte dédiée

L'architecture du chapitre 11 associait un ESP32 du commerce et un module de relais Modbus. Pour une installation durable en milieu humide, loin des fournisseurs, une carte unique est préférable : moins de connexions, borniers à vis adaptés, protections intégrées, voyants de diagnostic, réparation possible composant par composant. Les trois automates (AUT-F, AUT-L, AUT-E) utilisent la même carte, ce qui réduit le stock de rechange à une seule référence.

### Caractéristiques

| Fonction | Réalisation |
|---|---|
| Alimentation | 24 V DC, fusible réarmable 1,5 A, diode Schottky contre l'inversion, écrêteur 33 V / 600 W, convertisseur à découpage 24 V -> 3,3 V 1 A (RECOM R-78E3.3-1.0, rendement 90 %) |
| Microcontrôleur | ESP32-WROOM-32E, 4 Mo, antenne en débord de carte (recommandation du fabricant), boutons RESET et BOOT, connecteur de programmation |
| Ethernet | module W5500 enfiché (SPI), RJ45 sur le module |
| Bus de terrain | RS485 (MAX3485), protection SM712, polarisation 680 ohms, terminaison 120 ohms par cavalier |
| Entrées | 8 entrées 24 V isolées par optocoupleurs PC817 (5 kV), voyant par entrée, filtre anti-rebond, protection contre l'inversion |
| Sorties | 6 relais 24 V à contact inverseur (10 A / 250 V AC, utilisés à 5 A), voyant par relais, pilotage par extension I2C MCP23017 et ULN2003A |
| Analogique | 2 entrées 4-20 mA (shunt 120 ohms 0,1 %, filtre, protection), alimentation de boucle 24 V protégée par fusible réarmable 100 mA |
| Divers | buzzer d'alarme 24 V, 4 voyants d'état (ALIM, MARCHE, AUTONOME, DÉFAUT), extension I2C (JST XH), 4 trous de fixation M3 (les deux du bas reliés à la masse, les deux du haut nus car situés dans la bande 230 V) |
| Circuit imprimé | 150 x 110 mm, 2 couches FR4 1,6 mm, cuivre 35 µm, plans de masse sur les deux faces en zone basse tension |

### Isolement 230 V

Les contacts des relais sont regroupés dans une bande supérieure, repérée en sérigraphie. Les pistes de puissance font 2,5 mm de large, avec 2 mm d'isolement entre contacts et 4 mm vers la basse tension ; aucune piste basse tension ne traverse la bande 230 V, à l'exception des couloirs d'accès aux bobines. Le relais SRD n'offre qu'un isolement de base entre bobine et contact : pour une isolation renforcée (exigée si la partie basse tension est accessible sans outil), il faut monter un relais à isolement renforcé de même empreinte, ou ne commuter en 230 V que des relais d'interface externes (solution retenue dans l'armoire, planche E03 : les relais de la carte commandent des relais d'interface KA).

### Conception et fabrication

- **Source unique** : `electronique/caz1/conception.py` décrit chaque composant (valeur, empreinte, référence fabricant, fonction, connexions, position). Le schéma KiCad, le circuit imprimé et la nomenclature en sont générés : il n'y a pas de double saisie.
- **Schéma** : `caz1.kicad_sch` (KiCad 7), organisé en blocs fonctionnels ; sa liste de connexions a été comparée automatiquement à la conception (393 liaisons, aucun écart).
- **Circuit imprimé** : placement par blocs, routage par un routeur à grille (A*, deux couches, vias) écrit pour le projet, avec classes d'isolement, puis passe de finition qui relit la connectivité calculée par KiCad et reprend chaque liaison manquante ; plans de masse sur les deux faces reliés par des vias de couture ; pastilles CMS raccordées en plein au plan de masse, traversantes par raccord thermique.
- **Bilan du contrôle DRC (KiCad 7)** : 0 pastille non connectée, 0 violation d'isolement, 0 erreur d'empreinte. Restent six avertissements, tous voulus ou sans effet : les trous H1 et H2, situés dans la bande 230 V, sont des trous nus sans cuivre (empreinte modifiée, donc différente de la bibliothèque) ; l'antenne de l'ESP32 déborde de la carte comme le recommande Espressif, son contour sérigraphié sort donc du bord ; deux pistes dépassent de quelques dixièmes de millimètre la pastille qu'elles traversent. Rapport complet : `fabrication/drc.rpt`.
- **Chiffres** : 3 256 segments de piste, 453 vias, isolement minimal 0,2 mm en basse tension, pistes de 0,25 mm pour les signaux, 0,4 à 0,6 mm pour les alimentations, 2,5 mm pour le 230 V (en face arrière). Sur 135 composants, 33 repères ne tiennent pas en sérigraphie sans chevaucher une pastille ou un autre texte : ils sont masqués sur la carte et restent lisibles sur le plan d'assemblage (`CAZ-1_serigraphie_dessus.svg`).
- **Fabrication** : dossier `fabrication/` avec Gerbers et perçage (zip prêt à envoyer à un fabricant de circuits imprimés), fichier d'implantation pour l'assemblage, nomenclature avec références fabricant, schéma en PDF, rendus des deux faces.
- **Régénération complète** (dans `electronique/caz1/`, KiCad 7 installé) : `python3 generer_schema.py`, `python3 generer_pcb.py placer`, `python3 generer_pcb.py finir maison` (routage, environ 40 min), `python3 finaliser.py` (finition et contrôle ; sur la révision 1.0, quatre liaisons de masse ont ensuite été reprises une à une avec les fonctions de ce script : après toute modification, lire le rapport DRC et reprendre de même, ou à la main dans KiCad), `python3 serigraphie.py`, `python3 fabriquer.py`. Une modification de `conception.py` se propage ainsi au schéma, au circuit imprimé, aux fichiers de fabrication et à la vue 3D.
- **Prototype** : commander 5 cartes nues et un jeu de composants, assembler une carte, la tester sur banc (alimentation, programmation, chaque entrée, chaque relais, RS485 avec un capteur, Ethernet), puis assembler les autres.

Coût indicatif d'une carte assemblée en petite série : 45 à 70 $ (circuit imprimé 5 à 8 $, composants 35 à 50 $, module W5500 5 $), contre 180 $ pour l'automate du commerce prévu au budget ; l'économie couvre le temps de mise au point dès la ferme complète.
