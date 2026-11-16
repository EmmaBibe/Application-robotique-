"""Comparaisons appariées par scène (et par condition), avec intervalles de confiance à 95 % (bootstrap)
et collisions subies à l'arrêt comptées à part. Usage : python3 analyse_scenes.py fichier.csv \"Référence\""""
import csv, sys
import numpy as np
src, ref = sys.argv[1], sys.argv[2]
R = list(csv.DictReader(open(src)))
P = list(dict.fromkeys(r['planner'] for r in R)); S = list(dict.fromkeys(r['scene'] for r in R))
key = lambda r: (r['scene'], r['seed'], r.get('cond', ''))
by = {p: {key(r): r for r in R if r['planner'] == p} for p in P}
rng = np.random.default_rng(0)
def ic(d):
    bs = [rng.choice(d, len(d)).mean() for _ in range(4000)]; return np.percentile(bs, [2.5, 97.5])
out = [f'# Comparaisons par scène : {src}\n', f'Référence : {ref}\n']
for sc in S + ['TOUTES']:
    out.append(f'\n## {sc}\n\n| Méthode | Succès | Collisions (dont à l\'arrêt) | Écart / référence | IC 95 % | Gagnés / perdus |\n|---|---|---|---|---|---|')
    for p in P:
        ks = [k for k in by[p] if sc == 'TOUTES' or k[0] == sc]
        succ = np.array([by[p][k]['outcome'] == 'succes' for k in ks], float)
        col = sum(by[p][k]['outcome'] == 'collision' for k in ks); pas = sum(by[p][k].get('collision_a_larret') == 'True' for k in ks)
        if p == ref: out.append(f'| **{p}** | {100 * succ.mean():.0f} % | {100 * col / len(ks):.0f} % ({pas}) | – | – | – |'); continue
        d = np.array([(by[p][k]['outcome'] == 'succes') - (by[ref][k]['outcome'] == 'succes') for k in ks], float)
        lo, hi = ic(d); w = int((d > 0).sum()); l = int((d < 0).sum())
        sig = ' (significatif)' if lo > 0 or hi < 0 else ''
        out.append(f'| {p} | {100 * succ.mean():.0f} % | {100 * col / len(ks):.0f} % ({pas}) | {100 * d.mean():+.1f}{sig} | [{100 * lo:+.1f} ; {100 * hi:+.1f}] | {w} / {l} |')
txt = '\n'.join(out) + '\n'
open(src.replace('.csv', '_scenes.md'), 'w').write(txt); print(txt)
