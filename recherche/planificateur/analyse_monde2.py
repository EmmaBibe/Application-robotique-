"""Analyse des campagnes sur les mondes corrigés (PLAN_SEANCE8.md, sections 6 et 7).
Usage : python3 analyse_monde2.py seance8_monde2.csv [seance8_sfm.csv]
Bootstrap apparié simple (mondes x conditions) et par grappes : un monde garde ses trois conditions, tirage par scène."""
import sys
import numpy as np
import pandas as pd

def charger(f):
    d = pd.read_csv(f)
    d['m'] = d.planner.str.split(r' \(| \+').str[0].str.replace(' tirages', '')
    d['ok'] = (d.outcome == 'succes').astype(float)
    return d

def ic_simple(x, B=4000, g=None):
    g = g or np.random.default_rng(1); x = np.asarray(x)
    bs = x[g.integers(0, len(x), (B, len(x)))].mean(1)
    return np.percentile(bs, [2.5, 97.5])

def ic_grappes(df, a, b, B=4000):
    """df : lignes (scene, seed, cond) ; une grappe = un monde (scene, seed) et ses conditions ; tirage dans chaque scène."""
    g = np.random.default_rng(2)
    w = (df[a] - df[b]).groupby(level=['scene', 'seed']).agg(['sum', 'count'])
    par = [(v['sum'].values, v['count'].values) for _, v in w.groupby(level='scene')]
    r = []
    for _ in range(B):
        s = n = 0
        for su, co in par:
            i = g.integers(0, len(su), len(su)); s += su[i].sum(); n += co[i].sum()
        r.append(s / n)
    return np.percentile(r, [2.5, 97.5])

def bloc(d, titre, paires, grappes=True):
    p = d.pivot_table(index=['scene', 'seed', 'cond'], columns='m', values='ok')
    print(f'\n=== {titre} ({len(p)} essais appariés par méthode)')
    print('  ' + '  '.join(f'{m} {100 * p[m].mean():.1f}' for m in p.columns))
    for a, b in paires:
        x = p[a] - p[b]; lo, hi = ic_simple(x.values)
        s = f'  {a} − {b} : {100 * x.mean():+.1f} [{100 * lo:+.1f} ; {100 * hi:+.1f}]{"*" if lo > 0 or hi < 0 else ""}'
        if grappes:
            gl, gh = ic_grappes(p, a, b); s += f'   par grappes [{100 * gl:+.1f} ; {100 * gh:+.1f}]{"*" if gl > 0 or gh < 0 else ""}'
        s += f'   gagnés {int((x > 0).sum())}, perdus {int((x < 0).sum())}'
        print(s)

P = [('VIGIE 6', 'DRA-MPPI'), ('VIGIE 6', 'T-MPC++')]
d = charger(sys.argv[1])
print(d.groupby(['cond', 'm']).size().unstack())
bloc(d, 'Global', P)
for c in ['nominal', 'perception', 'reactifs']: bloc(d[d.cond == c], f'Condition {c}', P, grappes=False)
tou = ['carrefour', 'carrefour_rapide', 'couloir', 'piege']
bloc(d[d.scene.isin(tou)], 'Les quatre scènes touchées par la correction', P)
bloc(d[~d.scene.isin(tou)], 'Les sept autres scènes', P)
print('\n=== Par scène (réussite %, VIGIE 6 − DRA-MPPI, VIGIE 6 − T-MPC++)')
for sc, v in d.groupby('scene'):
    p = v.pivot_table(index=['seed', 'cond'], columns='m', values='ok')
    print(f'  {sc:17s} V {100 * p["VIGIE 6"].mean():5.1f}  T {100 * p["T-MPC++"].mean():5.1f}  D {100 * p["DRA-MPPI"].mean():5.1f}'
          f'   V−D {100 * (p["VIGIE 6"] - p["DRA-MPPI"]).mean():+6.1f}   V−T {100 * (p["VIGIE 6"] - p["T-MPC++"]).mean():+6.1f}')
print('\n=== Collisions en roulant et temps de trajet réussi')
for m, v in d.groupby('m'):
    print(f'  {m:10s} collisions {100 * (v.outcome == "collision").mean():.1f} %   temps dépassé {100 * (v.outcome == "temps").mean():.1f} %   temps moyen {v[v.ok == 1].temps.mean():.1f} s')

if len(sys.argv) > 2:
    s = charger(sys.argv[2])
    print('\n\n######## Forces sociales (section 7)')
    print(s.groupby(['cond', 'm']).size().unstack())
    bloc(s, 'Global, forces sociales', P)
    for c in ['nominal', 'perception', 'reactifs']: bloc(s[s.cond == c], f'Condition {c}', P, grappes=False)
    print('\n=== Sensibilité au modèle de piétons (forces sociales − simple, mêmes mondes de départ)')
    k = ['scene', 'seed', 'cond', 'm']
    j = d.set_index(k).ok.to_frame('simple').join(s.set_index(k).ok.to_frame('sfm'), how='inner')
    for m, v in j.groupby(level='m'):
        x = (v.sfm - v.simple).values; lo, hi = ic_simple(x)
        print(f'  {m:10s} {100 * x.mean():+.1f} [{100 * lo:+.1f} ; {100 * hi:+.1f}]   ({len(x)} essais)')
