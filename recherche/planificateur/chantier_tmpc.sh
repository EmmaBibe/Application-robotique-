#!/usr/bin/env bash
# Chantier « battre T-MPC++ » (PLAN_SEANCE8.md, section 2) : essais de développement sur les graines 7000 à 7039,
# mondes corrigés, VIGIE 6 et T-MPC++. Attend la fin des campagnes de la section 6 et 7. Reprend tout seul.
cd "$(dirname "$0")"
while pgrep -f "campagnes_v2.sh" >/dev/null || pgrep -f "seance8.py 8000:8060" >/dev/null; do sleep 60; done
export REEL=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 MONDE=2 PIETONS=simple
export SCENES=foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide,traversee,goulot,coin_aveugle,poursuite
export CONDS=nominal,perception,reactifs
python3 seance8.py 7000:7040 seance8_dev_tmpc.csv 71,49 >> seance8_dev_tmpc.log 2>&1
