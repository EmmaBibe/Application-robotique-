# Séance 7 · Plan : des références à la hauteur, puis de nouvelles pistes

Ce plan est écrit avant tout essai. Les hypothèses, les mondes de test et la façon de juger sont fixés ici, et ne seront plus changés après avoir vu les résultats. Toute entorse sera notée dans le journal, avec sa raison.

## 1. Ce que l'audit des sources a révélé

**Notre référence n'est pas celle que nous citions.** Depuis la séance 1, la référence « MPPI multimodal (2025) » renvoie à Bertipaglia, Gavrila et Shyrokau, arXiv 2508.21364. Après relecture complète, ce texte décrit autre chose : quatre modes d'échantillonnage pour une voiture (suivre la commande précédente, freinage maximal, accélération maximale, évitement), activés quand le temps avant le point de plus proche approche passe sous 2 s. Il n'y a ni routes topologiques ni chiffres de comparaison, et c'est une prépublication sans relecture.

Ce que notre code fait (un MPPI par route distincte, on exécute celui de coût minimal) correspond en réalité à **T-MPC**, de de Groot, Ferranti, Gavrila et Alonso-Mora (IEEE Transactions on Robotics, vol. 41, 2024, p. 110-126). Mais notre version est **plus faible que T-MPC** sur deux points :

1. **Routes guides.** T-MPC cherche ses routes dans l'espace libre *dynamique* (espace et temps). Les nôtres (`diverse_guides`) sont tracées sur une carte figée des positions actuelles.
2. **Cohérence.** T-MPC préfère garder la route qu'il suit déjà. La nôtre compte les changements de route sans les pénaliser.

Conséquence : une partie de l'avance de VIGIE 3, qui ajoute justement une route espace-temps (`MMST`), vient peut-être de ce qu'il complète une référence incomplète. **L'avance mesurée jusqu'ici est donc probablement surestimée.** Il faut le vérifier avec une référence fidèle avant tout nouveau travail.

## 2. Le panel de références (état de l'art vérifié)

Des méthodes publiées et relues, qui ne demandent pas d'apprentissage sur des données que nous n'avons pas, et qui tournent en temps réel :

| Référence | Source | Pourquoi elle |
|---|---|---|
| **T-MPC fidèle** (routes espace-temps distinctes, cohérence, planificateurs locaux MPPI en parallèle) | de Groot et al., T-RO 2024 | ce que notre référence prétendait être ; sur robot parmi des piétons, trajectoires plus rapides que les planificateurs comparés |
| **DRA-MPPI** (probabilité de collision jointe estimée par Monte-Carlo, échantillons rejetés au-delà de 5 %) | Trevisan et al., IROS 2025 | dans sa publication, 98 à 100 % de succès contre 96 à 99 % pour le MPC à scénarios (de Groot et al., IJRR 2023) et 43 à 86 % pour MPPI |
| **MPC à ensembles atteignables pour les zones masquées** | OA-MPC, IEEE TCST 2024 | référence spécifique aux angles morts |
| **Marges calibrées en ligne par prédiction conforme** | Huang et al., ICP 2025 ; CoCoNav 2026 | référence spécifique à la perception imparfaite |

Les paramètres non publiés (poids des coûts, température) seront réglés pour chaque référence sur les mondes de développement, **avec le même budget de réglage que VIGIE**. La référence officielle sera **la meilleure du panel sur les mondes de développement**, choisie avant l'évaluation finale.

Chaque référence aura des tests unitaires qui vérifient le comportement décrit dans la publication :
- T-MPC : routes guides réellement de classes différentes, préférence de cohérence active.
- DRA-MPPI : estimation Monte-Carlo comparée à l'intégrale exacte sur un cas gaussien (erreur de classification inférieure à 2 %, comme annoncé), seuil de 5 % respecté.

## 3. Audit du simulateur avant toute campagne

- **Personnes qui ne voient pas le robot.** Hors condition « réactifs », les personnes ne s'écartent jamais du robot, même arrêté. C'est un cadre connu (« robot invisible »), plus dur que la réalité. On le garde, mais on rapportera aussi, défini dès maintenant, le taux de collisions dont le robot est responsable : collision avec un robot en mouvement (sécurité passive, au sens de Fraichard).
- **Poursuite.** Le poursuivant vise le robot : c'est une scène adverse, à lire comme telle.
- **Revue indépendante du code** de chaque nouvelle référence et de chaque nouvelle brique, avant toute campagne, avec relecture des équations ligne à ligne contre la publication.

## 4. Pistes nouvelles, chacune ciblée sur un point faible mesuré

| Point faible | Piste | Inspiration |
|---|---|---|
| Perception limitée (avance perdue) | **Marges conformes adaptatives** : la marge autour de chaque personne suit l'erreur de prédiction réellement observée, par horizon, et non une valeur fixe | prédiction conforme adaptative (Gibbs et Candès 2021 ; ICP, CoCoNav) |
| Angles morts (personne visible 1,4 s avant l'impact en médiane) | **Approche qui donne de la vue** : prendre les coins plus large et ralentir là où la zone masquée est proche, pour allonger le temps de vue | conduite défensive ; ensembles atteignables (OA-MPC) |
| Foule dense (−5 à −7,5 points) | **S'aligner sur le flux** : suivre une personne qui va dans la même direction plutôt que croiser la foule | HiCrowd (ICRA 2026), formation spontanée de files en dynamique des piétons |
| Toutes scènes | **Risque calibré** : remplacer la pénalité de distance par une probabilité de collision estimée, quand elle s'avère meilleure | DRA-MPPI |

Chaque piste sera d'abord testée en ablation, une brique à la fois, contre la référence officielle.

## 5. Mondes et décisions

- Développement : graines déjà utilisées (1100 à 1459, 3000 à 3059 comprises, puisque leurs résultats sont connus).
- Évaluation finale : **graines 5000 à 5099, jamais utilisées**, ajoutées au test 12 avant tout essai.
- Critère principal : taux de succès, comparaison appariée, intervalle de confiance bootstrap à 95 %. Critères secondaires : collisions dont le robot est responsable, temps de trajet.
- Toutes les scènes et les deux conditions (vision complète, perception limitée) sont publiées, qu'elles soient favorables ou non.
- **Première étape : réévaluer VIGIE 3 contre T-MPC fidèle et DRA-MPPI** sur les mondes de développement. Si l'avance de VIGIE 3 disparaît, on le dira.

## 6. Résultat du réglage des références et suite (ajouté après le réglage, avant tout essai de la suite)

- **Référence officielle : DRA-MPPI réglé (3000 / 3000)**, meilleur du panel sur les mondes de développement (83,6 % de succès). Les écarts entre configurations sont faibles (quelques essais sur 440) : le choix suit la règle fixée, sans prétendre à une différence réelle.
- **VIGIE 3 n'a pas d'avance mesurable** sur les références fidèles (82,5 % contre 83,0 % pour DRA-MPPI non réglé, IC [−4,5 ; +3,4]). L'avance des séances précédentes venait d'une référence trop faible. On le publie tel quel.
- Les deux familles sont **complémentaires** : DRA-MPPI gagne en espace ouvert (forêt, carrefour, piège, poursuite), VIGIE 3 dans les passages étroits et la foule dense (goulot, foule dense).
- **Piste testée : VIGIE 3 + risque calibré.** Tout VIGIE 3 est gardé ; pour les personnes, la pénalité de distance est remplacée par le coût de risque de DRA-MPPI. Budget de réglage identique aux références (4 configurations, graines 1400 à 1419) : poids 3000/3000, 1000/3000, 300/3000, et 3000/3000 avec escompte temporel 0,97. La meilleure sur ces mondes est retenue.
- **Piste testée à part : incertitude adaptative** (variance de chaque personne tirée de l'erreur de prédiction observée sur elle, plancher publié de DRA-MPPI), en ablation contre la version fixe.
- Un premier diagnostic sur goulot (graines 1400 à 1409) a montré que les poids de DRA-MPPI figent le robot devant une porte à contre-flux (3 essais sur 10 au temps limite) : c'est ce qui a motivé d'inclure des poids plus faibles dans le réglage.
- Puis comparaison de développement sur les graines 1420 à 1459 (VIGIE 3, VIGIE retenu, DRA-MPPI réglé, T-MPC++), et seulement ensuite l'évaluation finale sur 5000 à 5099.
