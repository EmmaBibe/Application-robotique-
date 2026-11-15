# Résultats reel2c

Source : `reel_dev2.csv`, 1650 épisodes.


## nominal

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 corrigé (audit) | 59 | 31 | 25.5 | 20.5 | 0.46 | 4.0 | 24.8 |
| VIGIE 3 + modèle interne (proposé) | 70 | 26 | 21.5 | 18.1 | 0.35 | 4.0 | 29.4 |
| VIGIE 3 (proposé) | 75 | 20 | 21.2 | 18.9 | 0.44 | 3.6 | 27.2 |
| MPPI multimodal + prédicteur de Smith | 72 | 25 | 22.1 | 18.5 | 0.43 | 3.8 | 18.2 |
| VIGIE 2 (proposé) | 62 | 18 | 22.8 | 19.5 | 0.46 | 3.9 | 18.3 |

## perception

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 corrigé (audit) | 55 | 44 | 24.3 | 20.3 | 0.44 | 3.9 | 23.8 |
| VIGIE 3 + modèle interne (proposé) | 61 | 36 | 20.8 | 17.8 | 0.37 | 3.8 | 31.0 |
| VIGIE 3 (proposé) | 61 | 38 | 19.9 | 18.2 | 0.44 | 3.4 | 28.8 |
| MPPI multimodal + prédicteur de Smith | 63 | 36 | 21.6 | 18.8 | 0.44 | 3.7 | 17.6 |
| VIGIE 2 (proposé) | 62 | 35 | 21.8 | 19.3 | 0.48 | 3.9 | 17.8 |

## latence

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 corrigé (audit) | 52 | 39 | 26.6 | 20.9 | 0.42 | 4.0 | 25.0 |
| VIGIE 3 + modèle interne (proposé) | 68 | 30 | 22.3 | 18.2 | 0.35 | 4.0 | 29.6 |
| VIGIE 3 (proposé) | 66 | 32 | 20.7 | 18.5 | 0.42 | 3.7 | 27.5 |
| MPPI multimodal + prédicteur de Smith | 66 | 31 | 21.9 | 18.6 | 0.46 | 3.9 | 18.6 |
| VIGIE 2 (proposé) | 61 | 21 | 22.4 | 19.2 | 0.44 | 3.9 | 18.7 |

## TOUS

| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| VIGIE 2 corrigé (audit) | 55 | 38 | 25.5 | 20.6 | 0.44 | 4.0 | 24.5 |
| VIGIE 3 + modèle interne (proposé) | 66 | 31 | 21.5 | 18.0 | 0.36 | 4.0 | 30.0 |
| VIGIE 3 (proposé) | 68 | 30 | 20.6 | 18.6 | 0.44 | 3.6 | 27.8 |
| MPPI multimodal + prédicteur de Smith | 67 | 31 | 21.9 | 18.6 | 0.45 | 3.8 | 18.2 |
| VIGIE 2 (proposé) | 62 | 25 | 22.3 | 19.3 | 0.48 | 3.9 | 18.3 |

## Comparaisons appariées : MPPI multimodal + prédicteur de Smith

Différence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.

| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |
|---|---|---|---|---|
| VIGIE 2 corrigé (audit) | +11.8 | [+7.0 ; +16.7] | 56 | 17 |
| VIGIE 3 + modèle interne (proposé) | +0.6 | [-3.6 ; +4.8] | 25 | 23 |
| VIGIE 3 (proposé) | -0.6 | [-4.2 ; +3.0] | 18 | 20 |
| VIGIE 2 (proposé) | +5.5 | [+0.3 ; +10.6] | 45 | 27 |
