#!/usr/bin/env bash
# Mise au point des idées propres sur les mondes réalistes (PLAN_SEANCE8.md, sections 8 à 10). Reprend tout seul.
cd "$(dirname "$0")"
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=3
export CONDS=nominal,perception,reactifs
SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite \
  python3 seance8.py 7000:7020 dev_vigie7.csv 49,54,71,77,78,79,80,81 >> dev_vigie7.log 2>&1
