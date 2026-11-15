# Résultats dur2

Source : `dur_v2.csv`, 1350 épisodes.


## traversee

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 31 | 31 | 28.6 | 23.6 | 0.11 | 15.9 | 33.8 |
| VIGIE 3 (proposé) | 62 | 31 | 23.9 | 21.3 | 0.17 | 15.8 | 30.1 |
| Espace-temps à tubes calibrés | 51 | 47 | 24.7 | 21.6 | 0.16 | 15.9 | 30.8 |
| MPPI multimodal + route espace-temps | 49 | 51 | 22.7 | 21.0 | 0.18 | 15.7 | 32.4 |
| MPPI multimodal + prédicteur de Smith | 51 | 47 | 25.3 | 23.0 | 0.08 | 15.9 | 19.1 |

## goulot

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 98 | 2 | 21.1 | 20.6 | 0.48 | 15.9 | 23.3 |
| VIGIE 3 (proposé) | 98 | 0 | 19.2 | 19.7 | 0.43 | 15.9 | 29.5 |
| Espace-temps à tubes calibrés | 98 | 0 | 19.5 | 19.9 | 0.42 | 16.1 | 29.3 |
| MPPI multimodal + route espace-temps | 100 | 0 | 19.9 | 19.9 | 0.41 | 16.1 | 30.2 |
| MPPI multimodal + prédicteur de Smith | 96 | 2 | 20.9 | 19.9 | 0.45 | 16.3 | 19.0 |

## coin_aveugle

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 91 | 9 | 27.3 | 17.0 | 0.31 | 16.4 | 27.9 |
| VIGIE 3 (proposé) | 89 | 11 | 24.8 | 16.9 | 0.32 | 15.7 | 26.9 |
| Espace-temps à tubes calibrés | 84 | 16 | 25.5 | 17.8 | 0.28 | 15.3 | 25.9 |
| MPPI multimodal + route espace-temps | 91 | 7 | 23.4 | 17.5 | 0.27 | 15.4 | 26.0 |
| MPPI multimodal + prédicteur de Smith | 87 | 13 | 27.4 | 17.2 | 0.31 | 15.7 | 19.2 |

## poursuite

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 84 | 13 | 20.5 | 24.8 | 0.22 | 15.0 | 24.4 |
| VIGIE 3 (proposé) | 78 | 22 | 19.0 | 23.1 | 0.19 | 13.7 | 23.9 |
| Espace-temps à tubes calibrés | 73 | 27 | 19.3 | 23.5 | 0.19 | 13.9 | 24.0 |
| MPPI multimodal + route espace-temps | 64 | 36 | 17.2 | 21.1 | 0.18 | 13.7 | 25.8 |
| MPPI multimodal + prédicteur de Smith | 87 | 13 | 18.1 | 21.8 | 0.23 | 14.7 | 16.3 |

## foule_dense

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 89 | 11 | 19.3 | 19.5 | 0.43 | 15.9 | 27.6 |
| VIGIE 3 (proposé) | 87 | 13 | 17.8 | 18.4 | 0.39 | 16.1 | 31.4 |
| Espace-temps à tubes calibrés | 96 | 4 | 18.2 | 18.9 | 0.39 | 16.0 | 28.3 |
| MPPI multimodal + route espace-temps | 89 | 11 | 18.1 | 18.9 | 0.36 | 16.2 | 29.8 |
| MPPI multimodal + prédicteur de Smith | 93 | 7 | 20.3 | 19.4 | 0.40 | 16.2 | 17.1 |

## carrefour_rapide

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 96 | 4 | 18.8 | 18.6 | 0.48 | 15.9 | 28.2 |
| VIGIE 3 (proposé) | 98 | 2 | 17.4 | 17.9 | 0.47 | 15.5 | 32.0 |
| Espace-temps à tubes calibrés | 96 | 4 | 17.7 | 18.0 | 0.46 | 15.7 | 27.7 |
| MPPI multimodal + route espace-temps | 100 | 0 | 17.5 | 18.0 | 0.45 | 15.6 | 28.2 |
| MPPI multimodal + prédicteur de Smith | 93 | 7 | 18.8 | 18.4 | 0.48 | 16.2 | 15.9 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 + espace-temps | 81 | 12 | 21.8 | 20.3 | 0.36 | 15.9 | 27.6 |
| VIGIE 3 (proposé) | 85 | 13 | 20.1 | 19.4 | 0.35 | 15.5 | 29.0 |
| Espace-temps à tubes calibrés | 83 | 16 | 20.4 | 19.7 | 0.33 | 15.5 | 27.6 |
| MPPI multimodal + route espace-temps | 82 | 17 | 19.7 | 19.1 | 0.33 | 15.5 | 28.7 |
| MPPI multimodal + prédicteur de Smith | 84 | 15 | 21.5 | 19.7 | 0.35 | 15.8 | 17.8 |

## Comparaisons appariées : VIGIE 3 (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| VIGIE 2 + espace-temps | +3.7 | [-1.1 ; +8.5] | 27 | 17 |
| Espace-temps à tubes calibrés | +2.2 | [-1.5 ; +6.3] | 17 | 11 |
| MPPI multimodal + route espace-temps | +3.0 | [-2.2 ; +8.1] | 28 | 20 |
| MPPI multimodal + prédicteur de Smith | +0.7 | [-4.1 ; +5.6] | 23 | 21 |
