"""Analyse de la campagne au rythme du C++ (PLAN_SEANCE8.md §5), lecture fixée avant les essais.
Compare tout_c50 et tout_c100 entre méthodes, et à la condition « tout » (seance8_tout.csv, mêmes mondes).
Usage : python3 analyse_cpp.py seance8_cpp.csv seance8_tout.csv"""
import sys
import numpy as np
import pandas as pd

f, g = (sys.argv[1:3] + ['seance8_cpp.csv', 'seance8_tout.csv'][len(sys.argv) - 1:])[:2]
d = pd.concat([pd.read_csv(f), pd.read_csv(g)])
d['ok'] = (d.outcome == 'succes').astype(float)
NOMS = {'VIGIE 6 (proposé)': 'VIGIE 6', 'VIGIE 6 [400 tirages]': 'VIGIE 6 [400]', 'T-MPC++ + prédicteur de Smith': 'T-MPC++',
        'DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]': 'DRA-MPPI'}
d['m'] = d.planner.map(NOMS)
rng = np.random.default_rng(0)


def ci(x):
    x = np.asarray(x, float); b = rng.integers(0, len(x), (4000, len(x))); m = x[b].mean(1)
    return 100 * x.mean(), 100 * np.percentile(m, 2.5), 100 * np.percentile(m, 97.5)


def fmt(t):
    m, lo, hi = t
    return f'{m:+.1f} [{lo:+.1f} ; {hi:+.1f}]' + ('*' if lo > 0 or hi < 0 else '')


print(d.groupby(['cond', 'm']).size().unstack().to_string(), '\n')
for cond in ['tout', 'tout_c50', 'tout_c100']:
    q = d[d.cond == cond]
    p = q.pivot_table(index=['scene', 'seed'], columns='m', values='ok').dropna()
    print(f'=== {cond} ({len(p)} mondes appariés)')
    print((100 * q.groupby('m').ok.mean()).round(1).to_string())
    for a, b in [('VIGIE 6', 'DRA-MPPI'), ('VIGIE 6', 'T-MPC++'), ('VIGIE 6 [400]', 'DRA-MPPI'), ('VIGIE 6 [400]', 'VIGIE 6')]:
        dd = p[a] - p[b]; print(f'  {a} − {b} : {fmt(ci(dd))}   gagnés {int((dd > 0).sum())}, perdus {int((dd < 0).sum())}')
    print()
print('=== Effet du délai (même monde, même méthode, écart à « tout »)')
for m in NOMS.values():
    q = d[d.m == m].pivot_table(index=['scene', 'seed'], columns='cond', values='ok').dropna()
    print(f'  {m:14s} 50 ms {fmt(ci(q.tout_c50 - q.tout))}   100 ms {fmt(ci(q.tout_c100 - q.tout))}')
