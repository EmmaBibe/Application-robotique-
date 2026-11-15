# Résultats dev3

Source : `dev_v3.csv`, 1176 épisodes.


## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 98 | 1 | 18.3 | 18.7 | 0.53 | 15.0 | 14.3 |
| MPPI multimodal | 96 | 4 | 19.2 | 18.8 | 0.48 | 16.1 | 17.1 |

## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 98 | 1 | 18.0 | 18.6 | 0.49 | 15.2 | 13.8 |
| MPPI multimodal | 96 | 4 | 18.4 | 18.3 | 0.47 | 16.3 | 16.1 |

## glissement

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 95 | 4 | 18.8 | 18.7 | 0.52 | 15.2 | 14.5 |
| MPPI multimodal | 94 | 6 | 18.9 | 18.5 | 0.50 | 16.3 | 17.2 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 92 | 7 | 19.0 | 19.3 | 0.49 | 15.1 | 14.8 |
| MPPI multimodal | 90 | 10 | 20.2 | 19.7 | 0.40 | 16.0 | 17.5 |

## reactifs

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 99 | 0 | 18.5 | 18.6 | 0.58 | 15.1 | 14.6 |
| MPPI multimodal | 100 | 0 | 18.4 | 18.4 | 0.55 | 16.3 | 17.0 |

## carte_inconnue

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 95 | 4 | 18.4 | 19.1 | 0.53 | 15.2 | 14.2 |
| MPPI multimodal | 98 | 2 | 19.3 | 19.1 | 0.50 | 16.1 | 16.3 |

## enfer

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 96 | 4 | 19.7 | 19.6 | 0.52 | 15.2 | 13.8 |
| MPPI multimodal | 98 | 2 | 21.2 | 19.9 | 0.46 | 16.0 | 16.0 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE (proposé) | 96 | 3 | 18.7 | 18.9 | 0.52 | 15.1 | 14.3 |
| MPPI multimodal | 96 | 4 | 19.4 | 18.9 | 0.49 | 16.1 | 16.7 |

## Comparaisons appariées : VIGIE (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI multimodal | +0.0 | [-1.9 ; +1.9] | 16 | 16 |
