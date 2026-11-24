#!/usr/bin/env bash
# Troisième tour : idées E (prédiction interactive) et F (continuité du geste). Attend la fin du deuxième tour.
cd "$(dirname "$0")"
while pgrep -f "dev_vigie7_tour2.sh" >/dev/null || pgrep -f "seance8.py 7000:7020 dev_vigie7.csv 82," >/dev/null; do sleep 60; done
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=3
export CONDS=nominal,perception,reactifs
SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite \
  python3 seance8.py 7000:7020 dev_vigie7.csv 84,85,86,87 >> dev_vigie7.log 2>&1
