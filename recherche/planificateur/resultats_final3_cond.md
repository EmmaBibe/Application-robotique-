# Résultats final3_cond

Source : `final_v3.csv`, 11760 épisodes.


## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 95 | 4 | 18.6 | 18.4 | 0.47 | 16.3 | 16.3 |
| VIGIE 2 (proposé) | 91 | 6 | 18.4 | 18.7 | 0.47 | 16.6 | 17.1 |
| MPPI multimodal | 95 | 4 | 18.6 | 18.4 | 0.47 | 16.3 | 16.1 |
| MPPI | 93 | 7 | 17.8 | 18.6 | 0.47 | 11.7 | 2.0 |
| DWA | 74 | 5 | 15.0 | 18.7 | 0.43 | 5.5 | 0.8 |
| A* + poursuite pure | 54 | 46 | 12.8 | 17.9 | 0.09 | 3.7 | 0.7 |

## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 93 | 5 | 18.9 | 18.7 | 0.51 | 16.3 | 17.3 |
| VIGIE 2 (proposé) | 95 | 3 | 18.4 | 18.7 | 0.50 | 16.5 | 17.6 |
| MPPI multimodal | 93 | 5 | 18.9 | 18.7 | 0.51 | 16.3 | 17.1 |
| MPPI | 94 | 6 | 17.9 | 18.7 | 0.51 | 11.6 | 2.5 |
| DWA | 76 | 3 | 15.4 | 18.9 | 0.45 | 5.4 | 1.0 |
| A* + poursuite pure | 57 | 43 | 12.9 | 17.9 | 0.09 | 3.7 | 1.0 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 92 | 6 | 19.0 | 18.6 | 0.49 | 16.2 | 17.4 |
| VIGIE 2 (proposé) | 92 | 6 | 18.6 | 18.8 | 0.49 | 16.5 | 17.7 |
| MPPI multimodal | 90 | 8 | 20.4 | 19.5 | 0.39 | 16.0 | 17.5 |
| MPPI | 92 | 7 | 18.4 | 19.1 | 0.48 | 11.5 | 2.5 |
| DWA | 73 | 6 | 15.0 | 19.0 | 0.50 | 4.9 | 1.0 |
| A* + poursuite pure | 52 | 48 | 13.4 | 18.1 | 0.12 | 4.8 | 1.0 |

## glissement

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 95 | 4 | 20.0 | 18.6 | 0.46 | 16.2 | 17.2 |
| VIGIE 2 (proposé) | 96 | 3 | 19.8 | 18.8 | 0.48 | 16.5 | 17.5 |
| MPPI multimodal | 95 | 4 | 20.0 | 18.6 | 0.46 | 16.2 | 17.0 |
| MPPI | 93 | 6 | 18.6 | 18.6 | 0.47 | 11.5 | 2.5 |
| DWA | 73 | 5 | 16.0 | 19.0 | 0.42 | 5.2 | 0.9 |
| A* + poursuite pure | 56 | 44 | 13.7 | 17.9 | 0.09 | 3.8 | 1.0 |

## reactifs

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 96 | 2 | 18.8 | 18.5 | 0.55 | 16.2 | 17.3 |
| VIGIE 2 (proposé) | 98 | 0 | 18.1 | 18.5 | 0.57 | 16.5 | 17.6 |
| MPPI multimodal | 96 | 2 | 18.8 | 18.5 | 0.55 | 16.2 | 17.0 |
| MPPI | 98 | 1 | 17.7 | 18.5 | 0.56 | 11.6 | 2.5 |
| DWA | 78 | 1 | 14.5 | 18.3 | 0.48 | 5.1 | 0.9 |
| A* + poursuite pure | 81 | 19 | 13.0 | 17.8 | 0.10 | 4.0 | 1.0 |

## enfer

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 98 | 1 | 20.5 | 19.1 | 0.49 | 16.3 | 17.6 |
| VIGIE 2 (proposé) | 97 | 2 | 20.3 | 19.4 | 0.50 | 16.6 | 18.7 |
| MPPI multimodal | 96 | 3 | 21.9 | 19.9 | 0.43 | 16.3 | 17.5 |
| MPPI | 94 | 5 | 20.6 | 20.1 | 0.50 | 11.9 | 3.7 |
| DWA | 72 | 4 | 15.8 | 19.2 | 0.47 | 4.9 | 2.4 |
| A* + poursuite pure | 71 | 29 | 15.1 | 18.6 | 0.11 | 4.7 | 0.6 |

## carte_inconnue

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 94 | 5 | 19.5 | 19.1 | 0.50 | 16.2 | 18.4 |
| VIGIE 2 (proposé) | 96 | 4 | 19.2 | 19.2 | 0.49 | 16.7 | 19.5 |
| MPPI multimodal | 94 | 5 | 19.5 | 19.1 | 0.50 | 16.2 | 18.1 |
| MPPI | 94 | 5 | 18.3 | 19.1 | 0.51 | 11.7 | 4.2 |
| DWA | 75 | 2 | 15.5 | 19.2 | 0.45 | 5.5 | 2.6 |
| A* + poursuite pure | 58 | 42 | 13.5 | 18.5 | 0.08 | 4.2 | 0.7 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 95 | 4 | 19.3 | 18.7 | 0.50 | 16.2 | 17.4 |
| VIGIE 2 (proposé) | 95 | 4 | 19.0 | 18.9 | 0.50 | 16.5 | 18.0 |
| MPPI multimodal | 94 | 5 | 19.7 | 19.0 | 0.47 | 16.2 | 17.2 |
| MPPI | 94 | 5 | 18.5 | 18.9 | 0.50 | 11.6 | 2.8 |
| DWA | 74 | 4 | 15.3 | 18.9 | 0.45 | 5.2 | 1.4 |
| A* + poursuite pure | 61 | 39 | 13.5 | 18.1 | 0.10 | 4.1 | 0.9 |

## Comparaisons appariées : VIGIE 2 (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | +0.3 | [-0.8 ; +1.3] | 62 | 56 |
| MPPI multimodal | +0.8 | [-0.3 ; +1.9] | 69 | 53 |
| MPPI | +1.0 | [-0.3 ; +2.2] | 85 | 66 |
| DWA | +20.6 | [+18.5 ; +22.7] | 467 | 63 |
| A* + poursuite pure | +33.7 | [+31.4 ; +36.0] | 705 | 45 |
