"""Analyse de la campagne « toutes difficultés » (PLAN_SEANCE8.md §1), lecture fixée avant les essais.
Usage : python3 analyse_seance8.py seance8_tout.csv"""
import sys
import numpy as np
import pandas as pd

f = sys.argv[1] if len(sys.argv) > 1 else 'seance8_tout.csv'
d = pd.read_csv(f)
d['ok'] = (d.outcome == 'succes').astype(float)
d['col_mvt'] = ((d.outcome == 'collision') & (~d.collision_a_larret.astype(str).eq('True'))).astype(float)
NOMS = {'VIGIE 6 (proposé)': 'VIGIE 6', 'VIGIE 6 [400 tirages]': 'VIGIE 6 [400]', 'T-MPC++ + prédicteur de Smith': 'T-MPC++',
        'DRA-MPPI + prédicteur de Smith [soft3000.0_hard3000.0]': 'DRA-MPPI'}
d['m'] = d.planner.map(NOMS)
rng = np.random.default_rng(0)


def ci(x):
    x = np.asarray(x, float)
    b = rng.integers(0, len(x), (4000, len(x)))
    m = x[b].mean(1)
    return 100 * x.mean(), 100 * np.percentile(m, 2.5), 100 * np.percentile(m, 97.5)


def fmt(t):
    m, lo, hi = t
    s = '*' if lo > 0 or hi < 0 else ''
    return f'{m:+.1f} [{lo:+.1f} ; {hi:+.1f}]{s}'


print(f'{len(d)} essais ; par méthode et condition :')
print(d.groupby(['cond', 'm']).size().unstack().to_string(), '\n')

for cond in ['tout', 'tout_calcul']:
    q = d[d.cond == cond]
    p = q.pivot_table(index=['scene', 'seed'], columns='m', values='ok').dropna()
    print(f'=== {cond} ({len(p)} mondes appariés)')
    tab = q.groupby('m').agg(succes=('ok', 'mean'), col_mvt=('col_mvt', 'mean'), temps_depasse=('outcome', lambda s: (s == 'temps').mean()),
                             calcul_moy=('calcul_ms', 'median'), calcul_max=('calcul_max_ms', 'median'))
    if 'cycles_sautes' in q: tab['cycles_sautes'] = q.groupby('m').cycles_sautes.mean()
    tab[['succes', 'col_mvt', 'temps_depasse']] *= 100
    print(tab.round(1).to_string())
    for a, b in [('VIGIE 6', 'DRA-MPPI'), ('VIGIE 6', 'T-MPC++'), ('VIGIE 6 [400]', 'VIGIE 6'), ('VIGIE 6 [400]', 'T-MPC++'), ('T-MPC++', 'DRA-MPPI')]:
        dd = p[a] - p[b]
        print(f'  {a} − {b} : {fmt(ci(dd))}   gagnés {int((dd > 0).sum())}, perdus {int((dd < 0).sum())}')
    # temps de trajet sur les succès communs
    t = q.pivot_table(index=['scene', 'seed'], columns='m', values='temps')
    both = p[(p['VIGIE 6'] == 1) & (p['T-MPC++'] == 1)].index
    print(f'  temps de trajet VIGIE 6 − T-MPC++ sur {len(both)} succès communs : {(t.loc[both, "VIGIE 6"] - t.loc[both, "T-MPC++"]).mean():+.2f} s')
    print('  par scène (VIGIE 6 − DRA-MPPI ; VIGIE 6 − T-MPC++) :')
    for sc, g in p.groupby(level='scene'):
        print(f'    {sc:17s} {100 * (g["VIGIE 6"] - g["DRA-MPPI"]).mean():+6.1f} ; {100 * (g["VIGIE 6"] - g["T-MPC++"]).mean():+6.1f}')
    print()

print('=== Effet du temps de calcul (tout_calcul − tout, mêmes mondes)')
for m in NOMS.values():
    q = d[d.m == m].pivot_table(index=['scene', 'seed'], columns='cond', values='ok').dropna()
    if {'tout', 'tout_calcul'} <= set(q.columns): print(f'  {m:14s} {fmt(ci(q.tout_calcul - q.tout))}')
