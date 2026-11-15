# Résultats v3

Source : `resultats_v3.csv`, 720 épisodes.


## carrefour

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + coût τ + garde | 93 | 7 | 17.9 | 17.9 | 0.63 | 12.5 | 10.5 |
| MPPI + garde d'atteignabilité | 87 | 13 | 17.6 | 18.3 | 0.52 | 12.0 | 1.9 |
| MPPI multimodal + coût τ | 97 | 3 | 19.3 | 18.0 | 0.55 | 16.8 | 24.4 |
| MPPI + coût τ (Karamouzas) | 93 | 7 | 17.6 | 18.2 | 0.61 | 12.3 | 7.6 |
| MPPI multimodal | 100 | 0 | 17.7 | 18.0 | 0.53 | 16.4 | 14.9 |
| MPPI | 90 | 10 | 16.9 | 18.4 | 0.56 | 11.5 | 1.8 |

## foule

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + coût τ + garde | 93 | 7 | 20.5 | 19.8 | 0.55 | 12.7 | 15.7 |
| MPPI + garde d'atteignabilité | 97 | 3 | 17.3 | 18.2 | 0.55 | 12.0 | 3.1 |
| MPPI multimodal + coût τ | 97 | 3 | 21.2 | 18.7 | 0.55 | 16.8 | 29.0 |
| MPPI + coût τ (Karamouzas) | 90 | 7 | 19.6 | 19.4 | 0.57 | 12.3 | 15.0 |
| MPPI multimodal | 97 | 3 | 18.4 | 18.4 | 0.52 | 16.4 | 16.2 |
| MPPI | 93 | 7 | 16.9 | 18.2 | 0.57 | 11.4 | 2.2 |

## foule_dense

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + coût τ + garde | 93 | 7 | 22.1 | 20.2 | 0.48 | 13.1 | 24.7 |
| MPPI + garde d'atteignabilité | 90 | 10 | 19.1 | 18.9 | 0.52 | 12.2 | 4.1 |
| MPPI multimodal + coût τ | 87 | 13 | 21.5 | 19.0 | 0.47 | 16.8 | 39.8 |
| MPPI + coût τ (Karamouzas) | 93 | 7 | 21.7 | 20.5 | 0.43 | 13.0 | 23.2 |
| MPPI multimodal | 90 | 10 | 18.7 | 18.7 | 0.47 | 16.1 | 16.9 |
| MPPI | 93 | 7 | 18.6 | 19.2 | 0.48 | 12.2 | 2.6 |

## carrefour_rapide

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + coût τ + garde | 83 | 17 | 21.1 | 19.3 | 0.55 | 12.2 | 12.5 |
| MPPI + garde d'atteignabilité | 73 | 27 | 19.0 | 18.7 | 0.32 | 11.6 | 1.9 |
| MPPI multimodal + coût τ | 93 | 7 | 19.8 | 18.1 | 0.57 | 17.4 | 26.5 |
| MPPI + coût τ (Karamouzas) | 97 | 3 | 19.8 | 19.3 | 0.57 | 12.2 | 12.1 |
| MPPI multimodal | 93 | 7 | 16.9 | 17.8 | 0.50 | 16.1 | 15.5 |
| MPPI | 100 | 0 | 16.9 | 18.3 | 0.50 | 11.3 | 1.8 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + coût τ + garde | 91 | 9 | 20.4 | 19.3 | 0.55 | 12.7 | 15.8 |
| MPPI + garde d'atteignabilité | 87 | 13 | 18.2 | 18.5 | 0.50 | 12.0 | 2.7 |
| MPPI multimodal + coût τ | 93 | 7 | 20.4 | 18.4 | 0.54 | 17.0 | 29.9 |
| MPPI + coût τ (Karamouzas) | 93 | 6 | 19.7 | 19.3 | 0.56 | 12.4 | 14.5 |
| MPPI multimodal | 95 | 5 | 17.9 | 18.2 | 0.51 | 16.2 | 15.9 |
| MPPI | 94 | 6 | 17.3 | 18.5 | 0.54 | 11.6 | 2.1 |

## Comparaisons appariées : MPPI + coût τ + garde

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI + garde d'atteignabilité | +4.2 | [-2.5 ; +10.8] | 12 | 7 |
| MPPI multimodal + coût τ | -2.5 | [-9.2 ; +4.2] | 7 | 10 |
| MPPI + coût τ (Karamouzas) | -2.5 | [-7.5 ; +2.5] | 3 | 6 |
| MPPI multimodal | -4.2 | [-10.8 ; +2.5] | 5 | 10 |
| MPPI | -3.3 | [-9.2 ; +2.5] | 4 | 8 |
