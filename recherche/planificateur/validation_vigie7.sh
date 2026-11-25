#!/usr/bin/env bash
# Validation de VIGIE 7 sur les mondes réalistes (PLAN_SEANCE8.md, section 12). Reprend tout seul.
cd "$(dirname "$0")"
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=3
export CONDS=nominal,perception,reactifs
SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite \
  python3 seance8.py 7100:7160 validation_vigie7.csv 49,54,71,82,85 >> validation_vigie7.log 2>&1
