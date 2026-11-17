# Comparaisons par scène : dev7_comparaison.csv

Référence : DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]


## foret

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 98 % | 0 % (0) | +0.0 | [-3.8 ; +3.8] | 1 / 1 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 99 % | 0 % (0) | +1.2 | [+0.0 ; +3.8] | 1 / 0 |
| VIGIE 3 + carte commune + cohérence | 99 % | 0 % (0) | +1.2 | [+0.0 ; +3.8] | 1 / 0 |
| VIGIE 3 + risque calibré [escompte0.97] | 99 % | 0 % (0) | +1.2 | [+0.0 ; +3.8] | 1 / 0 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 98 % | 0 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 98 % | 2 % (0) | +0.0 | [-5.0 ; +5.0] | 2 / 2 |
| VIGIE 3 (proposé) | 99 % | 0 % (0) | +1.2 | [+0.0 ; +3.8] | 1 / 0 |

## carrefour

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 84 % | 15 % (0) | +2.5 | [-6.2 ; +11.2] | 7 / 5 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 82 % | 18 % (0) | +1.2 | [-7.5 ; +10.0] | 7 / 6 |
| VIGIE 3 + carte commune + cohérence | 79 % | 21 % (0) | -2.5 | [-13.8 ; +8.8] | 9 / 11 |
| VIGIE 3 + risque calibré [escompte0.97] | 81 % | 19 % (0) | +0.0 | [-10.0 ; +10.0] | 8 / 8 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 81 % | 18 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 84 % | 16 % (1) | +2.5 | [-7.5 ; +12.5] | 9 / 7 |
| VIGIE 3 (proposé) | 76 % | 24 % (0) | -5.0 | [-15.0 ; +5.0] | 7 / 11 |

## couloir

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 94 % | 4 % (0) | +5.0 | [+0.0 ; +11.2] | 5 / 1 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 95 % | 2 % (0) | +6.2 (significatif) | [+1.2 ; +12.5] | 5 / 0 |
| VIGIE 3 + carte commune + cohérence | 94 % | 4 % (0) | +5.0 | [-1.2 ; +12.5] | 6 / 2 |
| VIGIE 3 + risque calibré [escompte0.97] | 94 % | 4 % (0) | +5.0 | [+0.0 ; +11.2] | 5 / 1 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 89 % | 11 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 92 % | 6 % (0) | +3.8 | [-2.5 ; +10.0] | 5 / 2 |
| VIGIE 3 (proposé) | 95 % | 2 % (0) | +6.2 | [+0.0 ; +12.5] | 6 / 1 |

## piege

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 98 % | 0 % (0) | +1.2 | [-3.8 ; +6.2] | 3 / 2 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 98 % | 0 % (0) | +1.2 | [-3.8 ; +6.3] | 3 / 2 |
| VIGIE 3 + carte commune + cohérence | 96 % | 2 % (0) | +0.0 | [-6.2 ; +6.2] | 3 / 3 |
| VIGIE 3 + risque calibré [escompte0.97] | 98 % | 0 % (0) | +1.2 | [-3.8 ; +6.2] | 3 / 2 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 96 % | 4 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 96 % | 2 % (0) | +0.0 | [-6.2 ; +6.2] | 3 / 3 |
| VIGIE 3 (proposé) | 95 % | 0 % (0) | -1.2 | [-7.5 ; +5.0] | 3 / 4 |

## foule

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 75 % | 25 % (0) | -15.0 (significatif) | [-25.0 ; -6.2] | 2 / 14 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 79 % | 21 % (0) | -11.2 (significatif) | [-20.0 ; -2.5] | 3 / 12 |
| VIGIE 3 + carte commune + cohérence | 78 % | 22 % (0) | -12.5 (significatif) | [-21.2 ; -3.8] | 2 / 12 |
| VIGIE 3 + risque calibré [escompte0.97] | 76 % | 24 % (1) | -13.8 (significatif) | [-22.5 ; -5.0] | 2 / 13 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 90 % | 10 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 91 % | 9 % (1) | +1.2 | [-6.2 ; +8.8] | 5 / 4 |
| VIGIE 3 (proposé) | 82 % | 18 % (1) | -7.5 | [-16.2 ; +1.2] | 4 / 10 |

## foule_dense

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 66 % | 34 % (0) | +0.0 | [-11.2 ; +11.2] | 11 / 11 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 66 % | 34 % (1) | +0.0 | [-12.5 ; +12.5] | 12 / 12 |
| VIGIE 3 + carte commune + cohérence | 69 % | 31 % (2) | +2.5 | [-10.0 ; +15.0] | 14 / 12 |
| VIGIE 3 + risque calibré [escompte0.97] | 70 % | 30 % (0) | +3.8 | [-6.2 ; +13.8] | 10 / 7 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 66 % | 34 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 62 % | 38 % (2) | -3.8 | [-13.8 ; +6.2] | 7 / 10 |
| VIGIE 3 (proposé) | 70 % | 30 % (2) | +3.8 | [-8.8 ; +16.2] | 15 / 12 |

## carrefour_rapide

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 80 % | 20 % (0) | +3.8 | [-7.5 ; +13.8] | 11 / 8 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 81 % | 19 % (0) | +5.0 | [-6.2 ; +16.2] | 12 / 8 |
| VIGIE 3 + carte commune + cohérence | 72 % | 28 % (0) | -3.8 | [-16.2 ; +7.5] | 10 / 13 |
| VIGIE 3 + risque calibré [escompte0.97] | 80 % | 20 % (0) | +3.8 | [-7.5 ; +15.0] | 11 / 8 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 76 % | 24 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 65 % | 35 % (0) | -11.2 | [-22.5 ; +0.0] | 7 / 16 |
| VIGIE 3 (proposé) | 75 % | 25 % (1) | -1.2 | [-13.8 ; +10.0] | 11 / 12 |

## traversee

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 91 % | 9 % (0) | +5.0 | [-5.0 ; +15.0] | 10 / 6 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 91 % | 9 % (0) | +5.0 | [-5.0 ; +15.0] | 10 / 6 |
| VIGIE 3 + carte commune + cohérence | 85 % | 15 % (1) | -1.2 | [-12.5 ; +8.8] | 9 / 10 |
| VIGIE 3 + risque calibré [escompte0.97] | 91 % | 9 % (0) | +5.0 | [-5.0 ; +15.0] | 10 / 6 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 86 % | 10 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 76 % | 24 % (1) | -10.0 | [-21.2 ; +1.2] | 7 / 15 |
| VIGIE 3 (proposé) | 85 % | 15 % (1) | -1.2 | [-12.5 ; +10.0] | 9 / 10 |

## goulot

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 80 % | 2 % (0) | +8.8 | [-1.2 ; +18.8] | 13 / 6 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 82 % | 4 % (0) | +11.2 (significatif) | [+1.2 ; +22.5] | 14 / 5 |
| VIGIE 3 + carte commune + cohérence | 81 % | 12 % (0) | +10.0 | [-1.2 ; +21.2] | 15 / 7 |
| VIGIE 3 + risque calibré [escompte0.97] | 76 % | 6 % (0) | +5.0 | [-6.2 ; +15.0] | 12 / 8 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 71 % | 20 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 89 % | 10 % (0) | +17.5 (significatif) | [+6.2 ; +30.0] | 19 / 5 |
| VIGIE 3 (proposé) | 90 % | 6 % (0) | +18.8 (significatif) | [+7.5 ; +30.0] | 19 / 4 |

## coin_aveugle

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 57 % | 40 % (3) | -1.2 | [-12.5 ; +10.0] | 10 / 11 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 60 % | 38 % (5) | +1.2 | [-10.0 ; +11.2] | 10 / 9 |
| VIGIE 3 + carte commune + cohérence | 59 % | 41 % (4) | +0.0 | [-11.2 ; +11.2] | 10 / 10 |
| VIGIE 3 + risque calibré [escompte0.97] | 62 % | 36 % (5) | +3.8 | [-6.2 ; +15.0] | 11 / 8 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 59 % | 41 % (1) | – | – | – |
| T-MPC++ + prédicteur de Smith | 66 % | 34 % (0) | +7.5 | [-5.0 ; +20.0] | 18 / 12 |
| VIGIE 3 (proposé) | 55 % | 45 % (10) | -3.8 | [-16.2 ; +8.8] | 12 / 15 |

## poursuite

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 80 % | 20 % (0) | -3.8 | [-12.5 ; +5.0] | 5 / 8 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 80 % | 20 % (0) | -3.8 | [-12.5 ; +5.0] | 6 / 9 |
| VIGIE 3 + carte commune + cohérence | 80 % | 20 % (0) | -3.8 | [-15.0 ; +7.5] | 8 / 11 |
| VIGIE 3 + risque calibré [escompte0.97] | 81 % | 19 % (0) | -2.5 | [-11.2 ; +6.2] | 5 / 7 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 84 % | 16 % (0) | – | – | – |
| T-MPC++ + prédicteur de Smith | 79 % | 21 % (0) | -5.0 | [-15.0 ; +3.8] | 5 / 9 |
| VIGIE 3 (proposé) | 76 % | 24 % (0) | -7.5 | [-17.5 ; +2.5] | 6 / 12 |

## TOUTES

| Méthode | Succès | Collisions (dont à l'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| VIGIE 3 + risque calibré + carte commune + cohérence + fantômes | 82 % | 15 % (3) | +0.6 | [-2.2 ; +3.3] | 78 / 73 |
| VIGIE 3 + risque calibré + carte commune + cohérence | 83 % | 15 % (6) | +1.6 | [-1.2 ; +4.3] | 83 / 69 |
| VIGIE 3 + carte commune + cohérence | 81 % | 18 % (7) | -0.5 | [-3.4 ; +2.5] | 87 / 91 |
| VIGIE 3 + risque calibré [escompte0.97] | 83 % | 15 % (6) | +1.1 | [-1.5 ; +4.0] | 78 / 68 |
| **DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]** | 81 % | 17 % (1) | – | – | – |
| T-MPC++ + prédicteur de Smith | 82 % | 18 % (5) | +0.2 | [-2.6 ; +3.2] | 87 / 85 |
| VIGIE 3 (proposé) | 82 % | 17 % (15) | +0.2 | [-2.8 ; +3.3] | 93 / 91 |
