#!/usr/bin/env bash
# Mise au point des idées propres (PLAN_SEANCE8.md, sections 8 et 9). Attend la fin du chantier T-MPC++. Reprend tout seul.
cd "$(dirname "$0")"
while pgrep -f "chantier_tmpc.sh" >/dev/null || pgrep -f "seance8.py 7000:7040" >/dev/null; do sleep 60; done
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=2
export CONDS=nominal,perception,reactifs
SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite \
  PIETONS=simple python3 seance8.py 7000:7020 dev_vigie7.csv 77,78,79,80,81 >> dev_vigie7.log 2>&1
SCENES=goulot,foule,foule_dense,coin_aveugle \
  PIETONS=sfm python3 seance8.py 7000:7020 dev_vigie7_sfm.csv 71,49,77,78,79,80,81 >> dev_vigie7_sfm.log 2>&1
