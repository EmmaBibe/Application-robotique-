# Cartographie des inspirations pour la planification et le suivi de trajectoire

Objectif : passer en revue tous les domaines qui peuvent apporter une idée à la planification et au suivi de trajectoire. Pour chacun, on note ce qu'il apporte, ce que la robotique en a déjà tiré, et ce qui semble encore peu exploité. La colonne « Piste » sert à repérer les combinaisons qui n'ont pas l'air d'avoir été essayées.

Légende de l'exploitation en robotique : **forte** (technique standard), **moyenne** (publications régulières), **faible** (quelques travaux isolés), **rien trouvé** (aucune publication repérée pendant nos recherches, ce qui ne prouve pas qu'il n'en existe aucune).

## 1. Physique

| Domaine | Concept | Ce qu'il apporte | Exploitation | Piste |
|---|---|---|---|---|
| Optique | Principe de Fermat, réfraction de Snell | le chemin le plus rapide dans un milieu de vitesse variable | forte (méthode de fast marching, équation eikonale) | coût de terrain qui change avec le temps : « optique en espace-temps » |
| Électrostatique | Champs de potentiel | attraction vers le but, répulsion des obstacles | forte, avec le défaut connu des minima locaux | – |
| Mécanique des fluides | Écoulement potentiel, fonctions harmoniques | champs sans minimum local | moyenne | écoulement autour d'obstacles mobiles (théorème du cercle) |
| Physique statistique | Intégrale de chemin, énergie libre | moyenne pondérée de trajectoires aléatoires : c'est l'origine de MPPI | forte | – |
| Relativité, géométrie | Géodésiques dans une métrique déformée | trajectoires naturellement lisses (RMP, geometric fabrics) | moyenne | – |
| Élasticité | Bandes élastiques | une trajectoire qui se déforme comme un élastique (TEB) | forte | – |
| Réaction-diffusion | Ondes chimiques (réaction de Belousov-Zhabotinsky) | une onde qui se propage calcule le plus court chemin | faible | – |
| Électronique analogique | Réseaux de résistances | le courant suit le plus court chemin, calcul instantané | faible (années 1990) | puces analogiques basse consommation pour petits robots |

## 2. Biologie et neurosciences

| Domaine | Concept | Ce qu'il apporte | Exploitation | Piste |
|---|---|---|---|---|
| Fourmis | Phéromones (ACO) | routes renforcées par l'usage | forte | – |
| Physarum (myxomycète) | Réseau qui s'épaissit là où ça coule, mémoire externe des zones visitées | sortir des pièges en U | faible | – |
| Hippocampe | Cellules de lieu et de grille, rejeu, représentation « successeur » | planifier en rejouant mentalement des trajets | moyenne en recherche | – |
| Décision neuronale | Modèle de dérive-diffusion : on accumule des preuves jusqu'à un seuil | ne pas changer d'avis à chaque instant | **rien trouvé** pour le choix entre routes dans un MPPI | **utilisé dans notre proposition** (hystérésis) |
| Cervelet | Modèles internes, apprentissage de l'erreur | suivi qui s'améliore à chaque répétition | moyenne (commande itérative par apprentissage) | – |
| Psychologie écologique | Variable τ de D. N. Lee : temps avant contact, et règle « τ̇ ≥ −0,5 » pour freiner à temps | freinage sûr sans prédire la trajectoire exacte de l'obstacle | faible (atterrissage de drones) ; **rien trouvé** comme filtre de sécurité d'un MPPI | **utilisé dans notre proposition** |
| Sport | Heuristique du regard (attraper une balle en gardant l'angle constant) | interception sans calcul de trajectoire | faible | suivi d'une cible mobile |
| Éthologie | Poursuite du faucon (navigation proportionnelle) | interception optimale | moyenne (interception) | – |
| Écologie | « Paysage de la peur » : les animaux évitent les zones où ils ont eu peur | carte de risque apprise des quasi-collisions | **rien trouvé** | piste B ci-dessous |
| Immunologie | Sélection clonale, mémoire immunitaire | réutiliser des solutions passées | faible | – |
| Psychologie du développement | Permanence de l'objet (Piaget) : un objet caché existe toujours | garder en mémoire les agents masqués | moyenne (agents « fantômes » en conduite autonome) | testée dans VIGIE, sans gain mesurable |
| Physiologie | Réflexe de retrait, déclenché seulement par une menace | gestes d'urgence en concurrence avec les plans | faible | **utilisée dans VIGIE** |

## 3. Sciences humaines, économie, société

| Domaine | Concept | Ce qu'il apporte | Exploitation | Piste |
|---|---|---|---|---|
| Finance | Options réelles : garder le droit de choisir plus tard a une valeur | ne pas s'engager trop tôt quand le futur est incertain | moyenne sous le nom de commande « contingente » ou « en branches » (Alsterda 2019, Chen 2022) | **adaptée dans notre proposition** aux routes topologiques d'un MPPI |
| Finance | Couverture, CVaR | se protéger contre les pires cas | moyenne | – |
| Théorie des jeux | Jeux dynamiques, poursuite-évasion | anticiper les réactions des autres | moyenne | – |
| Économie | Enchères | répartir des tâches entre robots | forte en multi-robots | – |
| Urbanisme | Lignes de désir (chemins tracés par les piétons) | les routes émergent de l'usage | faible (modèle des marcheurs actifs de Helbing) | piste C ci-dessous |
| Navigation maritime | Règle du relèvement constant, règles de barre (COLREG) | détecter une collision avec un seul angle | moyenne (navires autonomes) | – |
| Aviation | Résolution de conflits (TCAS), évitement réciproque | manœuvres coordonnées sans communication | forte (ORCA) | – |
| Météorologie | Prévision d'ensemble : plusieurs futurs possibles plutôt qu'un seul | prédire les obstacles sous plusieurs hypothèses | moyenne (prédictions multimodales) | **utilisé dans notre proposition** |
| Sport automobile | Trajectoire idéale | vitesse maximale sous contrainte d'adhérence | forte | – |

## 4. Mathématiques et informatique

| Domaine | Concept | Ce qu'il apporte | Exploitation | Piste |
|---|---|---|---|---|
| Topologie | Classes d'homotopie | énumérer les façons vraiment différentes de contourner les obstacles | moyenne, et MPPI multimodal récent (2025) | **base de notre proposition** |
| Graphes | A*, D* Lite, Dijkstra | plus court chemin garanti | forte | – |
| Échantillonnage | RRT, RRT*, PRM | grandes dimensions | forte | – |
| Optimisation | Programmation quadratique séquentielle, CHOMP, TrajOpt | trajectoires lisses localement optimales | forte | – |
| Apprentissage | Modèles de diffusion, transformers | générer des trajectoires variées appris de données | forte et récente | – |
| Théorie de l'information | Inférence active | exploration guidée par la curiosité | faible à moyenne | – |
| Commande | Entonnoirs (LQR-trees), contraction, barrières de sécurité | garanties de sûreté | forte | – |

## 5. Ce que dit l'état de l'art récent

- **MPPI** (commande prédictive par intégrale de chemin) est devenu une référence pour la navigation réactive. Son défaut connu : ses échantillons restent autour d'une seule solution, d'où des minima locaux.
- **MPPI multimodal** (2025) : plusieurs MPPI en parallèle, chacun guidé par une route topologiquement différente, et on exécute la moins coûteuse. C'est notre référence la plus forte.
- **Commande contingente** ou **en branches** : un début de trajectoire commun, puis une suite par futur possible. Une version MPPI existe pour garantir une zone de repli (« Contingency-MPPI », 2024).
- **Planificateurs par diffusion** : très étudiés depuis 2023, mais demandent des données d'entraînement et un GPU.

## 6. Pistes retenues

**Piste A, testée maintenant : « Options topologiques + τ ».** Trois idées venues de domaines différents :
1. **Topologie** : plusieurs MPPI, un par route distincte (comme le MPPI multimodal).
2. **Finance et météorologie** : on prédit plusieurs futurs pour les obstacles mobiles, et on choisit le début de trajectoire qui garde les meilleures suites possibles dans chacun de ces futurs. On choisit selon la moyenne sur les futurs du meilleur coût possible (« E[min] »), et non selon le meilleur coût moyen (« min E »). La différence est la valeur d'avoir gardé le choix ouvert. Une hystérésis inspirée de l'accumulation de preuves évite de changer d'avis à chaque pas.
3. **Psychologie écologique** : un gouverneur de vitesse fondé sur la règle du τ̇ de Lee : le robot ralentit dès que la décélération nécessaire pour s'arrêter avant un obstacle devient trop grande.

**Piste B, à tester : le paysage de la peur.** Une carte de risque qui garde la mémoire des quasi-collisions et qui s'estompe avec le temps, pour les robots qui passent souvent aux mêmes endroits.

**Piste C, à tester : les lignes de désir.** Pour un robot qui refait souvent les mêmes trajets, des routes qui se renforcent avec l'usage et s'effacent si elles ne servent plus. On obtient une carte qui apprend la circulation réelle.

## Sources consultées

- [MPPI multimodal pour l'évitement de collision (2025)](https://arxiv.org/html/2508.21364)
- [Contingency-MPPI, MPPI dans MPPI (2024)](https://arxiv.org/html/2412.09777v1)
- [Commande en branches contre des prédictions multimodales (2025)](https://arxiv.org/html/2502.02550)
- [Navigation multi-agents tenant compte de l'homotopie (2025)](https://arxiv.org/html/2507.19860)
- [MPPI guidé par la topologie (2015)](https://arxiv.org/pdf/1510.05344)
- [Diffusion et MPPI : composition de diffusion (2025)](https://arxiv.org/html/2507.04384)
- [MP-MPPI, primitives de mouvement (2026)](https://arxiv.org/pdf/2607.06123)
- [Décision retardée en présence de plusieurs prédictions (Isele et al., ICRA 2025)](https://consensus.app/papers/details/w:f62b4db2-001c-42af-9d90-0f8b38face73/)
- [Optimalité de l'attente d'information sous incertitude (2026)](https://consensus.app/papers/details/w:83f6b876-7731-4ce4-91cd-b9a8cb5c433c/)
- [Planification inspirée de Physarum](https://arxiv.org/pdf/1503.03265)
- [Interception robotique par navigation proportionnelle (Borg 2002)](https://cimlab.mie.utoronto.ca/wp-content/uploads/2018/06/Borg-2002-Navigation-guidance-based-robotic-interception-of-moving-objects-in-industrial-settings.pdf)
- [Analyse bibliométrique planification et suivi 2000-2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12900099/)
