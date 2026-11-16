"""Diagnostic des collisions : contre quoi (personne ou mur), à quelle vitesse, où, et d'où venait la personne."""
import sys, csv, os
import numpy as np
from multiprocessing import Pool
import sim, planners

def job(a):
    pi, scene, seed, cond = a
    P = planners.ALL[pi]; p = planners.Memory(P); w = sim.World(scene, seed)
    r = sim.run_episode(w, p, cond=cond, record=True)
    if r['outcome'] != 'collision': return None
    s = r['path'][-1]
    st = np.array(w.static); ds = np.hypot(st[:, 0] - s[0], st[:, 1] - s[1]) - st[:, 2] - sim.R_ROB
    dyn = [(np.hypot(*(o['p'] - s)) - o['r'] - sim.R_ROB, o) for o in w.dyn]
    dd, o = min(dyn, key=lambda x: x[0])
    rel = o['p'] - s
    return dict(planner=P.name[:24], seed=seed, x=round(s[0], 2), y=round(s[1], 2), v_fin=round(r['v_fin'], 2),
                cible='mur' if ds.min() < dd else 'personne', vy_pers=round(o['v'][1], 2) if ds.min() >= dd else '',
                cote='devant' if rel[0] > 0.15 else ('derriere' if rel[0] < -0.15 else 'flanc'), t=round(r['temps'], 1))

if __name__ == '__main__':
    f, scene, cond, pis = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(',')
    rows = [x for x in csv.DictReader(open(f)) if x['scene'] == scene and x['cond'] == cond and x['outcome'] == 'collision']
    names = {planners.ALL[int(i)].name: int(i) for i in pis}
    jobs = [(names[x['planner']], scene, int(x['seed']), cond) for x in rows if x['planner'] in names]
    with Pool(4) as pool: out = [o for o in pool.map(job, jobs) if o]
    for o in out: print(o)
    print(len(jobs), 'collisions rejouées,', len(out), 'reproduites')
