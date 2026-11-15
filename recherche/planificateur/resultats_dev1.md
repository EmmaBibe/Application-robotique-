# Résultats dev1

Source : `dev_v1.csv`, 720 épisodes.


## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 95 | 2 | 20.3 | 19.2 | 0.51 | 15.1 | 12.8 |
| MPPI multimodal | 98 | 2 | 19.0 | 18.4 | 0.51 | 16.1 | 15.1 |
| MPPI | 92 | 8 | 17.8 | 18.8 | 0.49 | 11.9 | 1.7 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 90 | 8 | 18.7 | 19.0 | 0.43 | 15.1 | 13.7 |
| MPPI multimodal | 95 | 2 | 19.9 | 19.2 | 0.45 | 15.9 | 17.0 |
| MPPI | 95 | 5 | 18.4 | 19.2 | 0.51 | 11.8 | 2.3 |

## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 90 | 2 | 18.7 | 18.8 | 0.53 | 15.4 | 13.6 |
| MPPI multimodal | 95 | 5 | 18.4 | 18.3 | 0.52 | 16.3 | 16.9 |
| MPPI | 90 | 10 | 18.6 | 19.4 | 0.52 | 11.8 | 2.3 |

## glissement

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 90 | 5 | 19.4 | 18.3 | 0.52 | 15.2 | 13.6 |
| MPPI multimodal | 100 | 0 | 19.1 | 18.4 | 0.49 | 15.9 | 16.5 |
| MPPI | 92 | 8 | 18.3 | 18.5 | 0.49 | 11.7 | 2.4 |

## reactifs

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 95 | 0 | 18.1 | 18.3 | 0.60 | 15.2 | 13.6 |
| MPPI multimodal | 100 | 0 | 18.5 | 18.4 | 0.56 | 16.3 | 16.8 |
| MPPI | 98 | 2 | 18.0 | 18.7 | 0.60 | 11.9 | 2.4 |

## enfer

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 98 | 0 | 21.0 | 19.0 | 0.55 | 14.8 | 12.3 |
| MPPI multimodal | 100 | 0 | 19.5 | 18.6 | 0.48 | 16.4 | 15.1 |
| MPPI | 98 | 2 | 17.4 | 18.2 | 0.55 | 11.5 | 1.7 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 93 | 3 | 19.4 | 18.8 | 0.53 | 15.1 | 13.2 |
| MPPI multimodal | 98 | 2 | 19.1 | 18.5 | 0.50 | 16.1 | 16.2 |
| MPPI | 94 | 6 | 18.1 | 18.8 | 0.52 | 11.7 | 2.1 |

## Comparaisons appariées : VIGIE (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI multimodal | -5.0 | [-8.8 ; -1.2] | 5 | 17 |
| MPPI | -1.2 | [-5.4 ; +2.9] | 11 | 14 |
