# Résultats final2_scene

Source : `final_v2.csv`, 4900 épisodes.


## foret

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 100 | 0 | 21.0 | 19.1 | 0.29 | 14.9 | 15.7 |
| MPPI multimodal | 100 | 0 | 22.1 | 19.2 | 0.31 | 15.7 | 17.1 |
| MPPI | 100 | 0 | 19.8 | 19.0 | 0.30 | 11.4 | 2.7 |
| DWA | 37 | 0 | 13.5 | 18.0 | 0.49 | 3.5 | 1.1 |
| A* + poursuite pure | 92 | 8 | 12.9 | 18.0 | 0.07 | 4.2 | 0.7 |

## carrefour

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 97 | 3 | 17.2 | 18.1 | 0.56 | 15.4 | 17.0 |
| MPPI multimodal | 99 | 1 | 18.0 | 18.1 | 0.55 | 16.2 | 15.3 |
| MPPI | 96 | 4 | 16.9 | 17.9 | 0.55 | 11.9 | 1.8 |
| DWA | 95 | 4 | 14.7 | 18.5 | 0.46 | 4.7 | 0.7 |
| A* + poursuite pure | 37 | 63 | 13.3 | 17.3 | 0.12 | 4.0 | 0.5 |

## couloir

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 99 | 0 | 18.9 | 19.1 | 0.50 | 14.9 | 19.7 |
| MPPI multimodal | 98 | 0 | 19.1 | 18.7 | 0.49 | 16.2 | 18.1 |
| MPPI | 94 | 6 | 18.2 | 18.7 | 0.50 | 11.7 | 2.7 |
| DWA | 74 | 1 | 16.5 | 18.3 | 0.47 | 5.4 | 1.2 |
| A* + poursuite pure | 64 | 36 | 13.3 | 17.9 | 0.09 | 4.1 | 1.0 |

## piege

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 94 | 2 | 19.8 | 20.9 | 0.54 | 15.5 | 16.5 |
| MPPI multimodal | 96 | 3 | 20.5 | 20.8 | 0.51 | 16.8 | 18.9 |
| MPPI | 95 | 4 | 19.3 | 20.7 | 0.57 | 10.8 | 2.8 |
| DWA | 76 | 0 | 16.5 | 20.9 | 0.46 | 4.2 | 1.2 |
| A* + poursuite pure | 91 | 9 | 14.3 | 19.7 | 0.10 | 3.7 | 1.2 |

## foule

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 99 | 1 | 16.1 | 17.6 | 0.57 | 15.1 | 12.9 |
| MPPI multimodal | 99 | 1 | 17.6 | 18.1 | 0.51 | 16.6 | 15.3 |
| MPPI | 96 | 4 | 15.6 | 17.4 | 0.58 | 11.2 | 2.0 |
| DWA | 100 | 0 | 13.9 | 17.7 | 0.46 | 4.4 | 0.8 |
| A* + poursuite pure | 54 | 46 | 12.8 | 17.3 | 0.13 | 3.8 | 0.9 |

## foule_dense

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 90 | 10 | 18.3 | 18.8 | 0.54 | 15.3 | 13.3 |
| MPPI multimodal | 92 | 8 | 18.2 | 18.5 | 0.52 | 16.0 | 16.2 |
| MPPI | 87 | 13 | 17.2 | 18.4 | 0.57 | 11.6 | 2.2 |
| DWA | 87 | 13 | 14.6 | 18.4 | 0.46 | 5.7 | 0.9 |
| A* + poursuite pure | 54 | 46 | 13.6 | 17.5 | 0.14 | 4.6 | 1.2 |

## carrefour_rapide

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 95 | 5 | 18.5 | 18.9 | 0.54 | 15.1 | 13.0 |
| MPPI multimodal | 97 | 3 | 18.9 | 18.5 | 0.51 | 16.3 | 15.3 |
| MPPI | 91 | 9 | 17.8 | 18.6 | 0.51 | 11.5 | 1.7 |
| DWA | 97 | 3 | 14.7 | 18.8 | 0.44 | 4.5 | 0.7 |
| A* + poursuite pure | 35 | 65 | 13.3 | 17.0 | 0.18 | 3.6 | 0.6 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 96 | 3 | 18.5 | 18.9 | 0.53 | 15.2 | 15.4 |
| MPPI multimodal | 97 | 2 | 19.2 | 18.8 | 0.50 | 16.3 | 16.6 |
| MPPI | 94 | 6 | 17.8 | 18.7 | 0.54 | 11.4 | 2.3 |
| DWA | 81 | 3 | 14.9 | 18.6 | 0.46 | 4.7 | 0.9 |
| A* + poursuite pure | 61 | 39 | 13.4 | 18.0 | 0.10 | 4.0 | 0.9 |

## Comparaisons appariées : VIGIE (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI multimodal | -1.0 | [-2.3 ; +0.3] | 17 | 27 |
| MPPI | +2.2 | [+0.8 ; +3.8] | 38 | 16 |
| DWA | +15.3 | [+12.7 ; +18.1] | 177 | 27 |
| A* + poursuite pure | +35.2 | [+32.0 ; +38.6] | 366 | 21 |
