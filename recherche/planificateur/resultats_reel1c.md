# Résultats reel1c

Source : `reel_dev1.csv`, 1650 épisodes.


## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 3 + modèle interne (proposé) | 55 | 38 | 25.1 | 20.5 | 0.29 | 2.8 | 30.1 |
| VIGIE 3 (proposé) | 28 | 52 | 32.6 | 25.4 | 0.13 | 2.7 | 29.2 |
| MPPI multimodal renforcé (2 passes, 256 tirages) | 5 | 65 | 33.2 | 26.8 | 0.25 | 2.5 | 73.5 |
| MPPI multimodal + prédicteur de Smith | 33 | 51 | 31.8 | 24.9 | 0.22 | 2.7 | 19.3 |
| VIGIE 2 (proposé) | 42 | 34 | 25.5 | 22.4 | 0.27 | 2.6 | 19.1 |

## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 3 + modèle interne (proposé) | 50 | 46 | 24.0 | 20.1 | 0.27 | 2.8 | 31.3 |
| VIGIE 3 (proposé) | 25 | 61 | 29.9 | 24.7 | 0.14 | 2.7 | 30.9 |
| MPPI multimodal renforcé (2 passes, 256 tirages) | 8 | 65 | 36.2 | 26.1 | 0.16 | 2.8 | 69.9 |
| MPPI multimodal + prédicteur de Smith | 31 | 60 | 30.8 | 24.3 | 0.18 | 2.7 | 18.5 |
| VIGIE 2 (proposé) | 45 | 44 | 27.0 | 23.2 | 0.20 | 2.6 | 18.4 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 3 + modèle interne (proposé) | 43 | 52 | 23.9 | 20.5 | 0.22 | 2.7 | 30.9 |
| VIGIE 3 (proposé) | 31 | 61 | 25.6 | 23.3 | 0.13 | 2.5 | 30.8 |
| MPPI multimodal renforcé (2 passes, 256 tirages) | 1 | 77 | 44.6 | 31.4 | 0.08 | 2.7 | 78.5 |
| MPPI multimodal + prédicteur de Smith | 30 | 62 | 29.5 | 24.9 | 0.12 | 2.6 | 19.8 |
| VIGIE 2 (proposé) | 36 | 41 | 24.2 | 22.2 | 0.29 | 2.6 | 19.8 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 3 + modèle interne (proposé) | 49 | 45 | 24.4 | 20.4 | 0.27 | 2.8 | 30.8 |
| VIGIE 3 (proposé) | 28 | 58 | 29.2 | 24.4 | 0.13 | 2.6 | 30.3 |
| MPPI multimodal renforcé (2 passes, 256 tirages) | 5 | 69 | 35.8 | 26.7 | 0.16 | 2.7 | 73.9 |
| MPPI multimodal + prédicteur de Smith | 31 | 58 | 30.8 | 24.7 | 0.17 | 2.7 | 19.2 |
| VIGIE 2 (proposé) | 41 | 39 | 25.7 | 22.7 | 0.25 | 2.6 | 19.1 |

## Comparaisons appariées : VIGIE 3 + modèle interne (proposé)

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| VIGIE 3 (proposé) | +21.5 | [+16.1 ; +27.3] | 89 | 18 |
| MPPI multimodal renforcé (2 passes, 256 tirages) | +44.8 | [+39.1 ; +50.3] | 152 | 4 |
| MPPI multimodal + prédicteur de Smith | +18.2 | [+12.4 ; +23.9] | 82 | 22 |
| VIGIE 2 (proposé) | +8.5 | [+3.6 ; +13.6] | 51 | 23 |
