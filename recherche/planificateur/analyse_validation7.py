"""Analyse de la validation de VIGIE 7 (PLAN_SEANCE8.md, section 12). Usage : python3 analyse_validation7.py validation_vigie7.csv
Écarts appariés (bootstrap simple, 4 000 tirages, et par grappes : un monde garde ses trois conditions, tirage par scène),
par condition et par scène ; règle d'adoption ; « bat T-MPC++ » ; « ne perd nulle part » ; bornes de Clopper-Pearson à 95 %."""
import sys
import numpy as np
import pandas as pd
from scipy.stats import beta

NOMS = {'VIGIE 6': 'VIGIE 6', 'VIGIE 7-AC': 'VIGIE 7-AC', 'VIGIE 7-EA': 'VIGIE 7-EA', 'T-MPC++': 'T-MPC++', 'DRA-MPPI': 'DRA-MPPI'}
d = pd.read_csv(sys.argv[1])
d['m'] = d.planner.map(lambda s: next(k for k in NOMS if s.startswith(k)))
d['ok'] = (d.outcome == 'succes').astype(float); d['coll'] = (d.outcome == 'collision').astype(float)
print(d.groupby('m').size().to_string())
P = d.pivot_table(index=['scene', 'seed', 'cond'], columns='m', values='ok')
g = np.random.default_rng(1)


def ic(x):
    x = np.asarray(x); bs = x[g.integers(0, len(x), (4000, len(x)))].mean(1); return np.percentile(bs, [2.5, 97.5])


def ic_grappes(diff):
    w = diff.groupby(level=['scene', 'seed']).agg(['sum', 'count'])
    par = [(v['sum'].values, v['count'].values) for _, v in w.groupby(level='scene')]
    r = []
    for _ in range(4000):
        s = n = 0
        for su, co in par:
            i = g.integers(0, len(su), len(su)); s += su[i].sum(); n += co[i].sum()
        r.append(s / n)
    return np.percentile(r, [2.5, 97.5])


def ecrit(a, b, x, grappes=False):
    lo, hi = ic(x.values); s = f'{100 * x.mean():+5.1f} [{100 * lo:+.1f} ; {100 * hi:+.1f}]{"*" if lo > 0 or hi < 0 else " "}'
    if grappes:
        gl, gh = ic_grappes(x); s += f'  par grappes [{100 * gl:+.1f} ; {100 * gh:+.1f}]{"*" if gl > 0 or gh < 0 else ""}'
    return s, lo, hi


print('\n=== Taux et garanties (Clopper-Pearson, 95 %)')
for m in ['VIGIE 7-EA', 'VIGIE 7-AC', 'VIGIE 6', 'T-MPC++', 'DRA-MPPI']:
    v = d[d.m == m]; n = len(v); k = int(v.ok.sum()); c = int(v.coll.sum())
    lo = beta.ppf(0.025, k, n - k + 1) if k else 0.0; hi_c = beta.ppf(0.975, c + 1, n - c) if c < n else 1.0
    print(f'  {m:11s} réussite {100 * k / n:5.1f} % (au moins {100 * lo:.1f} %)   collisions {100 * c / n:4.1f} % (au plus {100 * hi_c:.1f} %)   temps dépassé {100 * (v.outcome == "temps").mean():4.1f} %   n={n}')

for v in ['VIGIE 7-EA', 'VIGIE 7-AC']:
    print(f'\n=== {v}')
    for ref in ['VIGIE 6', 'T-MPC++', 'DRA-MPPI']:
        s, _, _ = ecrit(v, ref, P[v] - P[ref], grappes=True); print(f'  − {ref:9s} global {s}')
        for c, q in (P[v] - P[ref]).groupby(level='cond'):
            s, _, _ = ecrit(v, ref, q); print(f'        {c:11s} {s}')
    print('  par scène : − VIGIE 6 | − meilleure référence (T-MPC++ ou DRA-MPPI, la meilleure sur la scène)')
    recul_v6 = recul_ref = []
    recul_v6, recul_ref = [], []
    for sc, q in P.groupby(level='scene'):
        s1, l1, h1 = ecrit(v, 'VIGIE 6', q[v] - q['VIGIE 6'])
        best = 'T-MPC++' if q['T-MPC++'].mean() >= q['DRA-MPPI'].mean() else 'DRA-MPPI'
        s2, l2, h2 = ecrit(v, best, q[v] - q[best])
        if h1 < 0: recul_v6.append(sc)
        if h2 < 0: recul_ref.append(sc)
        print(f'    {sc:17s} {100 * q[v].mean():5.1f} %   {s1}   | {best:8s} {100 * q[best].mean():5.1f} %  {s2}')
    x = P[v] - P['VIGIE 6']; lo, _ = ic(x.values)
    conds_recul = [c for c, q in x.groupby(level='cond') if ic(q.values)[1] < 0]
    print(f'  Règle d\'adoption : +1 point au moins ({100 * x.mean():+.1f}), aucun recul significatif par condition ({conds_recul or "aucun"}) ni par scène ({recul_v6 or "aucun"})'
          f' -> {"ADOPTÉE" if x.mean() >= 0.01 and not conds_recul and not recul_v6 else "non adoptée"}')
    y = P[v] - P['T-MPC++']; ly, hy = ic(y.values)
    print(f'  Bat T-MPC++ : {"OUI" if ly > 0 else "non"} ({100 * y.mean():+.1f} [{100 * ly:+.1f} ; {100 * hy:+.1f}])')
    print(f'  Ne perd nulle part face à la meilleure référence : {"OUI" if not recul_ref else "non, recul significatif : " + ", ".join(recul_ref)}')
