"""Analyse de la mise au point de VIGIE 7 (PLAN_SEANCE8.md, sections 8 à 10). Usage : python3 analyse_vigie7.py dev_vigie7.csv"""
import sys
import numpy as np
import pandas as pd
d = pd.read_csv(sys.argv[1]); d['ok'] = (d.outcome == 'succes').astype(float)
d['m'] = d.planner.str.replace(r' \+ prédicteur.*', '', regex=True).str.replace(r' \((proposé|budget|créneaux|prédiction|engagement|A\+B).*', '', regex=True)
print(d.groupby('m').size().to_string())
n = d.groupby('m').size(); d = d[d.m.isin(n[n == n.max()].index)]
p = d.pivot_table(index=['scene', 'seed', 'cond'], columns='m', values='ok').dropna()
g = np.random.default_rng(1)
def ic(x):
    bs = x[g.integers(0, len(x), (4000, len(x)))].mean(1); return np.percentile(bs, [2.5, 97.5])
print(f'\n{len(p)} situations appariées')
for m in p.columns:
    v = d[d.m == m]
    print(f'  {m:28s} réussite {100 * p[m].mean():5.1f} %   collisions {100 * (v.outcome == "collision").mean():4.1f} %   temps dépassé {100 * (v.outcome == "temps").mean():4.1f} %')
for ref in ['VIGIE 6', 'T-MPC++', 'DRA-MPPI']:
    print(f'\nÉcart à {ref}')
    for m in p.columns:
        if m == ref: continue
        x = (p[m] - p[ref]).values; lo, hi = ic(x)
        print(f'  {m:28s} {100 * x.mean():+5.1f} [{100 * lo:+.1f} ; {100 * hi:+.1f}]{"*" if lo > 0 or hi < 0 else ""}')
print('\nRéussite par scène (%)')
print((100 * p.groupby(level='scene').mean()).round(0).astype(int).to_string())
print('\nRéussite par condition (%)')
print((100 * p.groupby(level='cond').mean()).round(1).to_string())
