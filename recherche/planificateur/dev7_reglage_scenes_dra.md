# Comparaisons par scène : dev7_reglage.csv

Référence : DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]


## foret

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 95 % | 5 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |
| T-MPC++ + prédicteur de Smith [h300.0] | 90 % | 10 % (0) | -10.0 (significatif) | [-20.0 ; -2.5] | 0 / 4 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 100 % | 0 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| DRA-MPPI + prédicteur de Smith | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| T-MPC++ + prédicteur de Smith | 95 % | 5 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |
| VIGIE 3 (proposé) | 90 % | 0 % (0) | -10.0 (significatif) | [-20.0 ; -2.5] | 0 / 4 |
| MPPI multimodal + prédicteur de Smith | 95 % | 0 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |

## carrefour

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 90 % | 10 % (0) | +0.0 | [-12.5 ; +12.5] | 3 / 3 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 85 % | 15 % (0) | -5.0 | [-17.5 ; +7.5] | 2 / 4 |
| T-MPC++ + prédicteur de Smith [h300.0] | 85 % | 15 % (0) | -5.0 | [-17.5 ; +7.5] | 2 / 4 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 90 % | 10 % (0) | +0.0 | [-7.5 ; +7.5] | 1 / 1 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 90 % | 10 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 82 % | 18 % (0) | -7.5 | [-17.5 ; +0.0] | 0 / 3 |
| DRA-MPPI + prédicteur de Smith | 90 % | 10 % (0) | +0.0 | [-7.5 ; +7.5] | 1 / 1 |
| T-MPC++ + prédicteur de Smith | 85 % | 15 % (0) | -5.0 | [-17.5 ; +7.5] | 2 / 4 |
| VIGIE 3 (proposé) | 78 % | 22 % (1) | -12.5 | [-25.0 ; +0.0] | 1 / 6 |
| MPPI multimodal + prédicteur de Smith | 80 % | 20 % (0) | -10.0 | [-22.5 ; +2.5] | 2 / 6 |

## couloir

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 82 % | 18 % (0) | -2.5 | [-15.0 ; +10.0] | 3 / 4 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 90 % | 10 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |
| T-MPC++ + prédicteur de Smith [h300.0] | 90 % | 10 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 90 % | 10 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 85 % | 15 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 88 % | 12 % (0) | +2.5 | [-7.5 ; +12.5] | 3 / 2 |
| DRA-MPPI + prédicteur de Smith | 90 % | 10 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |
| T-MPC++ + prédicteur de Smith | 90 % | 10 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |
| VIGIE 3 (proposé) | 95 % | 5 % (0) | +10.0 (significatif) | [+2.5 ; +20.0] | 4 / 0 |
| MPPI multimodal + prédicteur de Smith | 90 % | 10 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |

## piege

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 98 % | 2 % (0) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| T-MPC++ + prédicteur de Smith [h300.0] | 98 % | 2 % (0) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 100 % | 0 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| DRA-MPPI + prédicteur de Smith | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |
| T-MPC++ + prédicteur de Smith | 98 % | 2 % (0) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| VIGIE 3 (proposé) | 95 % | 5 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |
| MPPI multimodal + prédicteur de Smith | 100 % | 0 % (0) | +0.0 | [+0.0 ; +0.0] | 0 / 0 |

## foule

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 85 % | 15 % (0) | -2.5 | [-15.0 ; +10.0] | 3 / 4 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 82 % | 18 % (0) | -5.0 | [-20.0 ; +7.5] | 3 / 5 |
| T-MPC++ + prédicteur de Smith [h300.0] | 82 % | 18 % (0) | -5.0 | [-17.5 ; +7.5] | 3 / 5 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 85 % | 15 % (0) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 88 % | 12 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 75 % | 25 % (0) | -12.5 (significatif) | [-22.5 ; -2.5] | 0 / 5 |
| DRA-MPPI + prédicteur de Smith | 85 % | 15 % (0) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| T-MPC++ + prédicteur de Smith | 82 % | 18 % (0) | -5.0 | [-17.5 ; +7.5] | 3 / 5 |
| VIGIE 3 (proposé) | 88 % | 12 % (0) | +0.0 | [-7.5 ; +7.5] | 1 / 1 |
| MPPI multimodal + prédicteur de Smith | 85 % | 15 % (0) | -2.5 | [-10.0 ; +5.0] | 1 / 2 |

## foule_dense

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 68 % | 32 % (0) | -5.0 | [-22.5 ; +12.5] | 6 / 8 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 70 % | 30 % (0) | -2.5 | [-20.0 ; +17.5] | 7 / 8 |
| T-MPC++ + prédicteur de Smith [h300.0] | 75 % | 25 % (0) | +2.5 | [-17.5 ; +22.5] | 8 / 7 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 65 % | 35 % (0) | -7.5 | [-17.5 ; +2.5] | 1 / 4 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 72 % | 28 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 68 % | 32 % (0) | -5.0 | [-17.5 ; +7.5] | 2 / 4 |
| DRA-MPPI + prédicteur de Smith | 68 % | 32 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |
| T-MPC++ + prédicteur de Smith | 72 % | 28 % (0) | +0.0 | [-20.0 ; +20.0] | 8 / 8 |
| VIGIE 3 (proposé) | 78 % | 22 % (1) | +5.0 | [-10.0 ; +20.0] | 5 / 3 |
| MPPI multimodal + prédicteur de Smith | 70 % | 30 % (0) | -2.5 | [-20.0 ; +15.0] | 6 / 7 |

## carrefour_rapide

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 82 % | 18 % (0) | -2.5 | [-12.6 ; +7.5] | 2 / 3 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 80 % | 20 % (1) | -5.0 | [-20.0 ; +7.5] | 3 / 5 |
| T-MPC++ + prédicteur de Smith [h300.0] | 78 % | 22 % (1) | -7.5 | [-22.5 ; +7.5] | 3 / 6 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 80 % | 20 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 85 % | 15 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 82 % | 18 % (0) | -2.5 | [-10.0 ; +5.0] | 1 / 2 |
| DRA-MPPI + prédicteur de Smith | 80 % | 20 % (0) | -5.0 | [-12.5 ; +0.0] | 0 / 2 |
| T-MPC++ + prédicteur de Smith | 78 % | 22 % (1) | -7.5 | [-20.0 ; +5.0] | 2 / 5 |
| VIGIE 3 (proposé) | 82 % | 18 % (0) | -2.5 | [-12.5 ; +7.5] | 2 / 3 |
| MPPI multimodal + prédicteur de Smith | 80 % | 20 % (0) | -5.0 | [-17.5 ; +7.5] | 2 / 4 |

## traversee

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 82 % | 18 % (0) | -5.0 | [-17.5 ; +7.5] | 3 / 5 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 90 % | 10 % (0) | +2.5 | [-10.0 ; +15.0] | 4 / 3 |
| T-MPC++ + prédicteur de Smith [h300.0] | 88 % | 12 % (0) | +0.0 | [-15.0 ; +12.5] | 4 / 4 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 88 % | 12 % (0) | +0.0 | [-12.5 ; +12.5] | 3 / 3 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 88 % | 12 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 90 % | 10 % (0) | +2.5 | [-7.5 ; +12.5] | 3 / 2 |
| DRA-MPPI + prédicteur de Smith | 88 % | 12 % (0) | +0.0 | [-12.5 ; +12.5] | 3 / 3 |
| T-MPC++ + prédicteur de Smith | 88 % | 12 % (0) | +0.0 | [-15.0 ; +12.5] | 4 / 4 |
| VIGIE 3 (proposé) | 75 % | 25 % (1) | -12.5 | [-27.5 ; +2.5] | 3 / 8 |
| MPPI multimodal + prédicteur de Smith | 88 % | 12 % (0) | +0.0 | [-12.5 ; +15.0] | 4 / 4 |

## goulot

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 82 % | 15 % (0) | +12.5 | [-7.5 ; +32.5] | 11 / 6 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 80 % | 18 % (0) | +10.0 | [-10.0 ; +30.0] | 11 / 7 |
| T-MPC++ + prédicteur de Smith [h300.0] | 78 % | 20 % (0) | +7.5 | [-12.5 ; +27.5] | 10 / 7 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 65 % | 18 % (0) | -5.0 | [-15.0 ; +5.0] | 1 / 3 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 70 % | 15 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 72 % | 20 % (0) | +2.5 | [-12.5 ; +20.0] | 6 / 5 |
| DRA-MPPI + prédicteur de Smith | 68 % | 20 % (0) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| T-MPC++ + prédicteur de Smith | 80 % | 18 % (0) | +10.0 | [-10.0 ; +30.0] | 11 / 7 |
| VIGIE 3 (proposé) | 85 % | 12 % (0) | +15.0 | [+0.0 ; +32.5] | 9 / 3 |
| MPPI multimodal + prédicteur de Smith | 85 % | 2 % (0) | +15.0 | [+0.0 ; +32.5] | 9 / 3 |

## coin_aveugle

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 57 % | 42 % (1) | -5.0 | [-22.5 ; +10.0] | 5 / 7 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 52 % | 48 % (0) | -10.0 | [-27.5 ; +7.5] | 5 / 9 |
| T-MPC++ + prédicteur de Smith [h300.0] | 52 % | 48 % (1) | -10.0 | [-27.5 ; +7.5] | 5 / 9 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 60 % | 40 % (0) | -2.5 | [-12.5 ; +7.5] | 2 / 3 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 62 % | 38 % (1) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 57 % | 42 % (0) | -5.0 | [-15.0 ; +5.0] | 1 / 3 |
| DRA-MPPI + prédicteur de Smith | 60 % | 40 % (1) | -2.5 | [-7.5 ; +0.0] | 0 / 1 |
| T-MPC++ + prédicteur de Smith | 57 % | 42 % (0) | -5.0 | [-22.5 ; +12.5] | 6 / 8 |
| VIGIE 3 (proposé) | 62 % | 38 % (5) | +0.0 | [-17.5 ; +20.0] | 7 / 7 |
| MPPI multimodal + prédicteur de Smith | 52 % | 48 % (3) | -10.0 | [-27.5 ; +7.5] | 5 / 9 |

## poursuite

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 70 % | 30 % (0) | -10.0 | [-25.0 ; +5.0] | 3 / 7 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 80 % | 20 % (0) | +0.0 | [-12.5 ; +12.5] | 3 / 3 |
| T-MPC++ + prédicteur de Smith [h300.0] | 80 % | 20 % (0) | +0.0 | [-12.5 ; +12.5] | 3 / 3 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 78 % | 22 % (0) | -2.5 | [-12.5 ; +7.5] | 2 / 3 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 80 % | 20 % (0) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 75 % | 25 % (0) | -5.0 | [-17.5 ; +7.5] | 3 / 5 |
| DRA-MPPI + prédicteur de Smith | 85 % | 15 % (0) | +5.0 | [-5.0 ; +15.0] | 3 / 1 |
| T-MPC++ + prédicteur de Smith | 80 % | 20 % (0) | +0.0 | [-12.5 ; +12.5] | 3 / 3 |
| VIGIE 3 (proposé) | 80 % | 20 % (0) | +0.0 | [-15.0 ; +12.5] | 4 / 4 |
| MPPI multimodal + prédicteur de Smith | 68 % | 32 % (0) | -12.5 | [-27.5 ; +2.5] | 2 / 7 |

## TOUTES

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| T-MPC++ + prédicteur de Smith [marge0.2] | 82 % | 18 % (1) | -1.8 | [-5.9 ; +2.0] | 39 / 47 |
| T-MPC++ + prédicteur de Smith [h3000.0] | 82 % | 18 % (1) | -1.6 | [-5.7 ; +2.5] | 41 / 48 |
| T-MPC++ + prédicteur de Smith [h300.0] | 81 % | 18 % (2) | -2.3 | [-6.6 ; +1.8] | 41 / 51 |
| DRA-MPPI + prédicteur de Smith [soft1000.0_hard10000.0] | 82 % | 17 % (0) | -1.8 | [-4.3 ; +0.7] | 13 / 21 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 84 % | 15 % (1) | – | – | – |
| DRA-MPPI + prédicteur de Smith [soft300.0_hard3000.0] | 81 % | 18 % (0) | -2.7 | [-5.9 ; +0.2] | 19 / 31 |
| DRA-MPPI + prédicteur de Smith | 83 % | 16 % (1) | -0.7 | [-2.7 ; +1.4] | 10 / 13 |
| T-MPC++ + prédicteur de Smith | 82 % | 18 % (1) | -1.4 | [-5.5 ; +3.0] | 42 / 48 |
| VIGIE 3 (proposé) | 82 % | 16 % (8) | -1.1 | [-5.0 ; +3.0] | 36 / 41 |
| MPPI multimodal + prédicteur de Smith | 81 % | 17 % (3) | -2.5 | [-6.6 ; +1.6] | 34 / 45 |
