"""Résumé d'une campagne de réglage : succès global, par condition, collisions en mouvement, temps moyen
sur les essais réussis par tous. Usage : python3 resume_reglage.py fichier.csv"""
import csv, sys
from collections import defaultdict
import numpy as np

R = list(csv.DictReader(open(sys.argv[1])))
P = list(dict.fromkeys(r['planner'] for r in R))
C = list(dict.fromkeys(r['cond'] for r in R))
key = lambda r: (r['scene'], r['seed'], r['cond'])
by = {p: {key(r): r for r in R if r['planner'] == p} for p in P}
communs = set.intersection(*(set(v) for v in by.values()))
tous_ok = [k for k in communs if all(by[p][k]['outcome'] == 'succes' for p in P)]
manque = {p: len(by[p]) for p in P}
print(f'{len(R)} lignes, {len(communs)} essais communs, {len(tous_ok)} réussis par toutes les méthodes')
if len(set(manque.values())) > 1:
    print('ATTENTION : nombre d\'essais inégal', manque)
tete = '| Méthode | Succès | ' + ' | '.join(C) + ' | Collisions en mouvement | Temps (essais communs) | Calcul moyen (ms) |'
print(tete); print('|' + '---|' * (tete.count('|') - 1))
for p in sorted(P, key=lambda p: -np.mean([by[p][k]['outcome'] == 'succes' for k in communs])):
    ks = sorted(communs)
    s = np.mean([by[p][k]['outcome'] == 'succes' for k in ks])
    pc = [np.mean([by[p][k]['outcome'] == 'succes' for k in ks if k[2] == c]) for c in C]
    cm = np.mean([by[p][k]['outcome'] == 'collision' and by[p][k]['collision_a_larret'] != 'True' for k in ks])
    t = np.mean([float(by[p][k]['temps']) for k in tous_ok]) if tous_ok else float('nan')
    cal = np.mean([float(by[p][k]['calcul_ms']) for k in ks])
    print(f'| {p} | {100*s:.1f} % | ' + ' | '.join(f'{100*x:.1f} %' for x in pc) + f' | {100*cm:.1f} % | {t:.1f} s | {cal:.0f} |')
