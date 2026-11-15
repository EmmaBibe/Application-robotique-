# Résultats dev2

Source : `dev_v2.csv`, 672 épisodes.


## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 95 | 5 | 18.9 | 19.0 | 0.53 | 14.9 | 13.9 |
| MPPI multimodal | 98 | 2 | 19.6 | 18.8 | 0.51 | 16.3 | 16.5 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 100 | 0 | 20.0 | 19.7 | 0.42 | 15.1 | 14.7 |
| MPPI multimodal | 96 | 2 | 20.9 | 19.6 | 0.44 | 15.9 | 17.8 |

## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 100 | 0 | 19.1 | 19.2 | 0.51 | 15.3 | 14.3 |
| MPPI multimodal | 96 | 4 | 19.2 | 18.7 | 0.51 | 16.4 | 17.5 |

## glissement

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 98 | 0 | 19.7 | 18.9 | 0.48 | 15.0 | 14.4 |
| MPPI multimodal | 100 | 0 | 20.3 | 18.8 | 0.49 | 16.0 | 17.3 |

## reactifs

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 100 | 0 | 18.6 | 18.8 | 0.58 | 15.2 | 14.3 |
| MPPI multimodal | 100 | 0 | 19.3 | 18.8 | 0.54 | 16.4 | 17.5 |

## enfer

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 91 | 5 | 22.3 | 20.3 | 0.45 | 15.3 | 13.8 |
| MPPI multimodal | 98 | 2 | 21.9 | 19.9 | 0.47 | 16.3 | 16.4 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 97 | 2 | 19.7 | 19.3 | 0.50 | 15.1 | 14.2 |
| MPPI multimodal | 98 | 1 | 20.2 | 19.1 | 0.48 | 16.2 | 17.2 |

## Comparaisons appariées : VIGIE (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI multimodal | -0.9 | [-3.0 ; +0.9] | 4 | 7 |
