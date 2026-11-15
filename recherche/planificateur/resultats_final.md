# Résultats final

Source : `resultats_final.csv`, 1680 épisodes.


## foret

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 73 | 3 | 25.2 | 18.7 | 0.33 | 12.5 | 4.8 |
| Oracle (MPPI qui connaît le futur) | 100 | 0 | 20.2 | 19.0 | 0.34 | 12.0 | 8.6 |
| MPPI + coût τ (Karamouzas) | 100 | 0 | 20.6 | 19.0 | 0.35 | 12.4 | 4.2 |
| Options topologiques v2 (proposé) | 100 | 0 | 22.6 | 19.0 | 0.35 | 15.8 | 19.7 |
| MPPI multimodal | 93 | 0 | 22.0 | 19.1 | 0.37 | 16.3 | 18.2 |
| MPPI | 100 | 0 | 20.6 | 19.0 | 0.35 | 12.4 | 2.5 |
| DWA | 27 | 0 | 14.0 | 18.7 | 0.46 | 4.4 | 0.9 |
| A* + poursuite pure | 97 | 3 | 12.5 | 17.8 | 0.07 | 4.0 | 0.6 |

## carrefour

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 83 | 10 | 17.8 | 18.3 | 0.53 | 11.9 | 2.8 |
| Oracle (MPPI qui connaît le futur) | 100 | 0 | 16.4 | 18.1 | 0.57 | 11.1 | 5.4 |
| MPPI + coût τ (Karamouzas) | 87 | 13 | 18.2 | 18.8 | 0.56 | 12.1 | 9.5 |
| Options topologiques v2 (proposé) | 100 | 0 | 20.7 | 18.9 | 0.56 | 15.4 | 16.6 |
| MPPI multimodal | 87 | 13 | 17.8 | 18.1 | 0.54 | 16.5 | 15.4 |
| MPPI | 93 | 7 | 17.4 | 18.7 | 0.56 | 11.5 | 1.9 |
| DWA | 100 | 0 | 14.2 | 18.4 | 0.44 | 4.4 | 0.6 |
| A* + poursuite pure | 23 | 77 | 12.6 | 16.9 | 0.16 | 2.3 | 0.5 |

## couloir

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 90 | 0 | 19.5 | 18.1 | 0.45 | 12.3 | 4.8 |
| Oracle (MPPI qui connaît le futur) | 93 | 7 | 18.8 | 18.9 | 0.45 | 11.0 | 9.5 |
| MPPI + coût τ (Karamouzas) | 87 | 10 | 17.7 | 18.1 | 0.48 | 12.1 | 6.8 |
| Options topologiques v2 (proposé) | 97 | 0 | 18.5 | 18.2 | 0.47 | 16.1 | 18.8 |
| MPPI multimodal | 93 | 3 | 18.6 | 18.5 | 0.45 | 16.2 | 17.4 |
| MPPI | 97 | 3 | 18.6 | 18.8 | 0.44 | 11.6 | 2.8 |
| DWA | 73 | 0 | 16.9 | 18.4 | 0.45 | 5.9 | 1.0 |
| A* + poursuite pure | 53 | 47 | 12.2 | 17.3 | 0.07 | 3.5 | 1.0 |

## piege

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 80 | 0 | 21.4 | 19.5 | 0.50 | 13.5 | 5.3 |
| Oracle (MPPI qui connaît le futur) | 100 | 0 | 17.9 | 19.5 | 0.55 | 11.0 | 9.7 |
| MPPI + coût τ (Karamouzas) | 100 | 0 | 18.3 | 19.7 | 0.60 | 11.0 | 5.9 |
| Options topologiques v2 (proposé) | 100 | 0 | 19.4 | 19.6 | 0.54 | 16.4 | 20.3 |
| MPPI multimodal | 100 | 0 | 19.8 | 19.6 | 0.54 | 16.4 | 18.6 |
| MPPI | 100 | 0 | 18.3 | 19.6 | 0.59 | 10.9 | 2.8 |
| DWA | 80 | 0 | 16.1 | 20.0 | 0.45 | 4.1 | 0.9 |
| A* + poursuite pure | 93 | 7 | 13.3 | 19.0 | 0.12 | 3.4 | 0.9 |

## foule

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 73 | 17 | 18.2 | 18.1 | 0.52 | 12.0 | 3.8 |
| Oracle (MPPI qui connaît le futur) | 100 | 0 | 16.5 | 17.8 | 0.55 | 11.1 | 8.3 |
| MPPI + coût τ (Karamouzas) | 83 | 17 | 17.4 | 18.1 | 0.51 | 12.3 | 15.2 |
| Options topologiques v2 (proposé) | 97 | 3 | 21.8 | 20.2 | 0.53 | 15.4 | 17.7 |
| MPPI multimodal | 93 | 7 | 17.1 | 17.8 | 0.52 | 16.3 | 16.0 |
| MPPI | 77 | 23 | 15.7 | 17.3 | 0.54 | 11.3 | 2.2 |
| DWA | 87 | 13 | 14.0 | 17.4 | 0.46 | 4.5 | 0.7 |
| A* + poursuite pure | 57 | 43 | 12.2 | 17.0 | 0.12 | 3.0 | 1.0 |

## foule_dense

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 90 | 7 | 18.0 | 18.5 | 0.53 | 12.1 | 4.3 |
| Oracle (MPPI qui connaît le futur) | 100 | 0 | 17.2 | 18.6 | 0.55 | 11.2 | 10.0 |
| MPPI + coût τ (Karamouzas) | 93 | 3 | 21.6 | 20.1 | 0.52 | 12.9 | 23.9 |
| Options topologiques v2 (proposé) | 87 | 13 | 23.2 | 20.4 | 0.52 | 15.5 | 18.8 |
| MPPI multimodal | 90 | 10 | 17.1 | 18.0 | 0.51 | 16.5 | 17.7 |
| MPPI | 97 | 3 | 16.8 | 18.2 | 0.54 | 11.9 | 2.7 |
| DWA | 97 | 3 | 14.4 | 18.2 | 0.43 | 6.2 | 0.9 |
| A* + poursuite pure | 47 | 53 | 13.3 | 17.3 | 0.17 | 4.3 | 1.2 |

## carrefour_rapide

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 97 | 3 | 18.3 | 19.0 | 0.53 | 11.7 | 2.9 |
| Oracle (MPPI qui connaît le futur) | 100 | 0 | 15.8 | 17.8 | 0.54 | 11.1 | 6.3 |
| MPPI + coût τ (Karamouzas) | 87 | 10 | 20.2 | 19.9 | 0.50 | 12.3 | 12.7 |
| Options topologiques v2 (proposé) | 80 | 20 | 24.0 | 19.5 | 0.44 | 14.7 | 17.6 |
| MPPI multimodal | 97 | 3 | 18.5 | 18.5 | 0.48 | 15.9 | 15.9 |
| MPPI | 97 | 3 | 16.9 | 18.3 | 0.55 | 11.4 | 1.8 |
| DWA | 97 | 3 | 14.2 | 18.4 | 0.42 | 5.5 | 0.6 |
| A* + poursuite pure | 13 | 87 | 14.5 | 17.2 | 0.11 | 3.7 | 0.7 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| MPPI + feux d'alignement | 84 | 6 | 19.6 | 18.6 | 0.50 | 12.3 | 4.1 |
| Oracle (MPPI qui connaît le futur) | 99 | 1 | 17.5 | 18.5 | 0.54 | 11.2 | 8.3 |
| MPPI + coût τ (Karamouzas) | 91 | 8 | 19.2 | 19.1 | 0.52 | 12.2 | 11.2 |
| Options topologiques v2 (proposé) | 94 | 5 | 21.4 | 19.4 | 0.51 | 15.7 | 18.5 |
| MPPI multimodal | 93 | 5 | 18.7 | 18.5 | 0.51 | 16.3 | 17.0 |
| MPPI | 94 | 6 | 17.8 | 18.6 | 0.53 | 11.6 | 2.4 |
| DWA | 80 | 3 | 14.8 | 18.5 | 0.45 | 5.1 | 0.8 |
| A* + poursuite pure | 55 | 45 | 12.8 | 17.8 | 0.10 | 3.6 | 0.8 |

## Comparaisons appariées : MPPI

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| MPPI + feux d'alignement | +10.5 | [+5.7 ; +15.2] | 25 | 3 |
| Oracle (MPPI qui connaît le futur) | -4.8 | [-8.1 ; -1.4] | 2 | 12 |
| MPPI + coût τ (Karamouzas) | +3.3 | [-1.0 ; +7.6] | 14 | 7 |
| Options topologiques v2 (proposé) | +0.0 | [-4.3 ; +4.3] | 11 | 11 |
| MPPI multimodal | +1.0 | [-3.3 ; +5.2] | 12 | 10 |
| DWA | +14.3 | [+8.6 ; +20.5] | 38 | 8 |
| A* + poursuite pure | +39.5 | [+32.4 ; +46.7] | 87 | 4 |
