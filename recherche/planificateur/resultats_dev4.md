# Résultats dev4

Source : `dev_v4.csv`, 1764 épisodes.


## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 96 | 4 | 18.1 | 18.2 | 0.49 | 16.1 | 16.4 |
| VIGIE 2 (proposé) | 95 | 5 | 17.9 | 18.5 | 0.50 | 16.4 | 17.3 |
| MPPI multimodal | 96 | 4 | 18.1 | 18.2 | 0.49 | 16.1 | 16.1 |

## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 96 | 2 | 18.6 | 18.6 | 0.49 | 16.2 | 17.3 |
| VIGIE 2 (proposé) | 100 | 0 | 18.6 | 18.7 | 0.51 | 16.5 | 17.8 |
| MPPI multimodal | 96 | 2 | 18.6 | 18.6 | 0.49 | 16.2 | 17.1 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 94 | 6 | 18.5 | 18.5 | 0.51 | 16.3 | 17.6 |
| VIGIE 2 (proposé) | 95 | 5 | 18.6 | 18.8 | 0.53 | 16.5 | 18.0 |
| MPPI multimodal | 90 | 10 | 19.9 | 19.6 | 0.40 | 16.1 | 17.6 |

## glissement

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 93 | 7 | 19.1 | 18.6 | 0.49 | 16.3 | 17.6 |
| VIGIE 2 (proposé) | 99 | 1 | 19.0 | 18.7 | 0.52 | 16.6 | 17.8 |
| MPPI multimodal | 93 | 7 | 19.1 | 18.6 | 0.49 | 16.3 | 17.3 |

## reactifs

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 99 | 0 | 18.0 | 18.3 | 0.56 | 16.3 | 17.3 |
| VIGIE 2 (proposé) | 99 | 1 | 18.0 | 18.4 | 0.57 | 16.5 | 17.8 |
| MPPI multimodal | 99 | 0 | 18.0 | 18.3 | 0.56 | 16.3 | 17.0 |

## enfer

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 100 | 0 | 20.0 | 19.1 | 0.52 | 16.1 | 17.9 |
| VIGIE 2 (proposé) | 99 | 1 | 19.1 | 19.1 | 0.53 | 16.5 | 18.7 |
| MPPI multimodal | 99 | 1 | 21.4 | 20.0 | 0.49 | 16.0 | 17.6 |

## carte_inconnue

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 98 | 2 | 19.2 | 19.0 | 0.50 | 16.1 | 18.3 |
| VIGIE 2 (proposé) | 98 | 2 | 18.6 | 19.0 | 0.52 | 16.6 | 19.7 |
| MPPI multimodal | 98 | 2 | 19.2 | 19.0 | 0.50 | 16.1 | 18.1 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | 97 | 3 | 18.8 | 18.6 | 0.51 | 16.2 | 17.5 |
| VIGIE 2 (proposé) | 98 | 2 | 18.5 | 18.8 | 0.53 | 16.5 | 18.1 |
| MPPI multimodal | 96 | 4 | 19.2 | 18.9 | 0.49 | 16.2 | 17.3 |

## Comparaisons appariées : VIGIE 2 (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI multimodal + prédicteur de Smith | +1.2 | [-0.3 ; +2.7] | 15 | 8 |
| MPPI multimodal | +1.9 | [+0.2 ; +3.6] | 20 | 9 |
