"""Où notre méthode perd face à la référence : les essais que la référence réussit et que la méthode rate,
classés par type d'échec, par scène et par condition. Sert à choisir les pistes d'amélioration.
Usage : python3 analyse_echecs.py fichier.csv "Méthode" "Référence" """
import csv, sys
from collections import Counter, defaultdict

src, meth, ref = sys.argv[1], sys.argv[2], sys.argv[3]
R = list(csv.DictReader(open(src)))
key = lambda r: (r['scene'], r['seed'], r['cond'])
M = {key(r): r for r in R if r['planner'] == meth}
F = {key(r): r for r in R if r['planner'] == ref}
communs = sorted(set(M) & set(F))


def type_echec(r):
    if r['outcome'] == 'temps': return 'bloqué (temps limite)'
    if r['outcome'] != 'collision': return r['outcome']
    if r.get('collision_a_larret') == 'True': return 'heurté à l\'arrêt'
    if float(r['temps']) < 3.0: return 'collision au départ (< 3 s)'
    return 'collision en mouvement'


perdus = [k for k in communs if F[k]['outcome'] == 'succes' and M[k]['outcome'] != 'succes']
gagnes = [k for k in communs if M[k]['outcome'] == 'succes' and F[k]['outcome'] != 'succes']
print(f'{len(communs)} essais communs : {len(gagnes)} gagnés, {len(perdus)} perdus face à la référence\n')
print('## Perdus, par type d\'échec')
for t, n in Counter(type_echec(M[k]) for k in perdus).most_common(): print(f'- {t} : {n}')
print('\n## Perdus, par scène et condition')
par = defaultdict(list)
for k in perdus: par[(k[0], k[2])].append(k)
for (sc, c), ks in sorted(par.items(), key=lambda x: -len(x[1])):
    print(f'- {sc} ({c}) : {len(ks)} — ' + ', '.join(f'{k[1]} {type_echec(M[k])}' for k in ks))
print('\n## Gagnés, par type d\'échec de la référence')
for t, n in Counter(type_echec(F[k]) for k in gagnes).most_common(): print(f'- {t} : {n}')
