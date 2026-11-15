"""Tableaux et figures à partir du fichier de résultats."""
import csv, sys
from collections import defaultdict
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt

src = sys.argv[1] if len(sys.argv) > 1 else 'resultats_v1.csv'
tag = sys.argv[2] if len(sys.argv) > 2 else 'v1'
rows = list(csv.DictReader(open(src)))
import os
GROUP = os.environ.get('GROUP', 'scene')
for r in rows: r['seed'] = r['seed'] + '|' + r.get('cond', '') + '|' + r.get('scene', '')
for r in rows: r['scene'] = r.get(GROUP, r['scene']) if GROUP != 'scene' else r['scene']
for r in rows:
    for k in ('temps', 'longueur', 'marge_min', 'jerk', 'lissage_w', 'calcul_ms', 'calcul_max_ms', 'changements'): r[k] = float(r[k])
planners = list(dict.fromkeys(r['planner'] for r in rows))
scenes = list(dict.fromkeys(r['scene'] for r in rows))
by = defaultdict(list)
for r in rows: by[(r['planner'], r['scene'])].append(r); by[(r['planner'], 'TOUS')].append(r)

def stats(L):
    n = len(L); ok = [r for r in L if r['outcome'] == 'succes']
    return dict(n=n, succes=100 * len(ok) / n, collision=100 * sum(r['outcome'] == 'collision' for r in L) / n,
                temps=np.mean([r['temps'] for r in ok]) if ok else np.nan,
                longueur=np.mean([r['longueur'] for r in ok]) if ok else np.nan,
                marge=np.median([r['marge_min'] for r in ok]) if ok else np.nan,
                jerk=np.mean([r['jerk'] for r in ok]) if ok else np.nan,
                calcul=np.mean([r['calcul_ms'] for r in L]))

out = [f'# Résultats {tag}\n', f'Source : `{src}`, {len(rows)} épisodes.\n']
for sc in scenes + ['TOUS']:
    out.append(f'\n## {sc}\n\n| Planificateur | Succès % | Collisions % | Temps (s) | Longueur (m) | Marge médiane (m) | À-coups (m/s³) | Calcul (ms) |\n|---|---|---|---|---|---|---|---|')
    for p in planners:
        s = stats(by[(p, sc)])
        out.append(f"| {p} | {s['succes']:.0f} | {s['collision']:.0f} | {s['temps']:.1f} | {s['longueur']:.1f} | {s['marge']:.2f} | {s['jerk']:.1f} | {s['calcul']:.1f} |")

# comparaison appariée (mêmes mondes) : intervalle de confiance par bootstrap
def paired(a, b):
    A = {(r['scene'], r['seed']): r['outcome'] == 'succes' for r in rows if r['planner'] == a}
    B = {(r['scene'], r['seed']): r['outcome'] == 'succes' for r in rows if r['planner'] == b}
    keys = sorted(set(A) & set(B)); d = np.array([A[k] - B[k] for k in keys], float)
    rng = np.random.default_rng(0); bs = [rng.choice(d, len(d)).mean() for _ in range(5000)]
    wins = int(sum(A[k] and not B[k] for k in keys)); losses = int(sum(B[k] and not A[k] for k in keys))
    return 100 * d.mean(), 100 * np.percentile(bs, 2.5), 100 * np.percentile(bs, 97.5), wins, losses
import os
ref = [os.environ['REF']] if os.environ.get('REF') else ([p for p in planners if 'v2 (proposé)' in p] or [p for p in planners if 'proposé' in p])
if ref:
    out.append(f'\n## Comparaisons appariées : {ref[0]}\n\nDifférence de taux de succès (cette méthode − autre), intervalle de confiance à 95 % par bootstrap, et nombre de mondes gagnés / perdus.\n\n| Contre | Écart (points) | IC 95 % | Gagnés | Perdus |\n|---|---|---|---|---|')
    for p in planners:
        if p == ref[0]: continue
        m, lo, hi, w, l = paired(ref[0], p)
        out.append(f'| {p} | {m:+.1f} | [{lo:+.1f} ; {hi:+.1f}] | {w} | {l} |')
open(f'resultats_{tag}.md', 'w').write('\n'.join(out) + '\n')

fig, ax = plt.subplots(figsize=(11, 4.5))
wdt = 0.8 / len(planners)
for i, p in enumerate(planners):
    ax.bar(np.arange(len(scenes) + 1) + i * wdt, [stats(by[(p, sc)])['succes'] for sc in scenes + ['TOUS']], wdt, label=p)
ax.set_xticks(np.arange(len(scenes) + 1) + 0.4 - wdt / 2); ax.set_xticklabels(scenes + ['tous'])
ax.set_ylabel('succès (%)'); ax.set_ylim(0, 105); ax.legend(fontsize=7, ncol=2, loc='lower left'); ax.grid(axis='y', alpha=.3)
plt.tight_layout(); plt.savefig(f'succes_{tag}.png', dpi=130)
print('\n'.join(out))
