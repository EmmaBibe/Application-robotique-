"""Collisions en perception limitée : depuis combien de temps la personne heurtée était-elle visible ?"""
import sys, csv, numpy as np
from multiprocessing import Pool
import sim, planners

def job(a):
    pi, scene, seed, cond = a
    P = planners.ALL[pi]; p = planners.Memory(P); w = sim.World(scene, seed)
    seen = {}; orig = p.act; T = [0.0]
    def act(t, s, obs):
        for i in obs[obs[:, 5] > 0, 6].astype(int):
            seen.setdefault(i, []).append(round(t, 1))
        T[0] = t; return orig(t, s, obs)
    p.act = act
    r = sim.run_episode(w, p, cond=cond, record=True)
    if r['outcome'] != 'collision': return None
    s = r['path'][-1]
    j = min(range(len(w.dyn)), key=lambda j: np.hypot(*(w.dyn[j]['p'] - s)) - w.dyn[j]['r'])
    ts = seen.get(1000 + j, [])
    # début de la dernière période de visibilité continue (trous de 0,3 s tolérés : détections perdues)
    first = None
    for t in reversed(ts):
        if first is None or first - t <= 0.31: first = t
        else: break
    vu = round(r['temps'] - first, 1) if first is not None else None
    return (P.name[:20], seed, vu, round(r['v_fin'], 2))

if __name__ == '__main__':
    f, scene, cond, pis = sys.argv[1], sys.argv[2], sys.argv[3], [int(x) for x in sys.argv[4].split(',')]
    names = {planners.ALL[i].name: i for i in pis}
    rows = [x for x in csv.DictReader(open(f)) if x['scene'] == scene and x['cond'] == cond and x['outcome'] == 'collision' and x['planner'] in names]
    with Pool(4) as pool: out = [o for o in pool.map(job, [(names[x['planner']], scene, int(x['seed']), cond) for x in rows]) if o]
    for o in out: print(o)
    vus = np.array([o[2] if o[2] is not None else 0.0 for o in out])
    print(f'{len(out)} collisions : visible depuis < 0,5 s : {(vus < 0.5).sum()}, 0,5 à 1 s : {((vus >= 0.5) & (vus < 1)).sum()}, plus de 1 s : {(vus >= 1).sum()}, jamais vue : {sum(o[2] is None for o in out)}')
