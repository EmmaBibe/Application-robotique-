#!/bin/bash
# Enchaîne les campagnes des mondes version 2 (PLAN_SEANCE8.md §6 et §7), après la campagne au rythme du C++.
# Chaque campagne reprend là où elle s'est arrêtée : on peut relancer ce script autant de fois que nécessaire.
cd "$(dirname "$0")"
while pgrep -f "seance8.py 6000:6060 seance8_cpp.csv" >/dev/null; do sleep 30; done
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=2
export SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite
export CONDS=nominal,perception,reactifs
PIETONS=simple python3 seance8.py 8000:8060 seance8_monde2.csv 71,49,54 >> seance8_monde2.log 2>&1
PIETONS=sfm python3 seance8.py 8000:8060 seance8_sfm.csv 71,49,54 >> seance8_sfm.log 2>&1
