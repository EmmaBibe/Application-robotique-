#!/usr/bin/env bash
# Deuxième tour de mise au point de VIGIE 7 (A et C associés, poids du retard réduit). Attend la fin du premier tour.
cd "$(dirname "$0")"
while pgrep -f "dev_vigie7.sh" >/dev/null || pgrep -f "seance8.py 7000:7020 dev_vigie7.csv 49," >/dev/null; do sleep 60; done
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=3
export CONDS=nominal,perception,reactifs
SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite \
  python3 seance8.py 7000:7020 dev_vigie7.csv 82,83 >> dev_vigie7.log 2>&1
