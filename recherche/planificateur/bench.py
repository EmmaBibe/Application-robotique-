"""Campagne de tests : chaque planificateur sur les mêmes mondes, mêmes graines, mêmes perturbations."""
import csv, sys, time
from multiprocessing import Pool
import numpy as np
import sim, planners

import os
SCENES = os.environ.get('SCENES', 'foret,carrefour,couloir,piege,foule,foule_dense,carrefour_rapide').split(',')


CONDS = os.environ.get('CONDS', 'nominal').split(',')


def job(args):
    scene, seed, pi, cond = args
    P = planners.ALL[pi]
    p = planners.Memory(P); r = sim.run_episode(sim.World(scene, seed), p, cond=cond)
    r.update(scene=scene, seed=seed, planner=P.name, cond=cond, changements=getattr(p.p, 'switches', 0), reflexes=getattr(p.p, 'reflex_n', 0), sans_route=getattr(p.p, 'empty_refresh', 0))
    return r


KEYS = ['planner', 'cond', 'scene', 'seed', 'outcome', 'temps', 'longueur', 'marge_min', 'jerk', 'lissage_w', 'calcul_ms', 'calcul_max_ms', 'changements', 'reflexes', 'collision_a_larret', 'v_fin', 'sans_route']


if __name__ == '__main__':
    a = sys.argv[1] if len(sys.argv) > 1 else '20'
    seeds = range(int(a.split(':')[0]), int(a.split(':')[1])) if ':' in a else range(int(a))
    out = sys.argv[2] if len(sys.argv) > 2 else 'resultats.csv'
    which = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else range(len(planners.ALL))
    jobs = [(sc, sd, pi, c) for pi in which for sc in SCENES for sd in seeds for c in CONDS]
    # reprise : les essais déjà enregistrés ne sont pas refaits
    done = set()
    if os.path.exists(out):
        for r in csv.DictReader(open(out)): done.add((r['scene'], int(r['seed']), r['planner'], r['cond']))
    jobs = [j for j in jobs if (j[0], j[1], planners.ALL[j[2]].name, j[3]) not in done]
    jobs.sort(key=lambda j: -j[2])   # les plus lents d'abord
    print(f'{len(done)} essais déjà enregistrés, {len(jobs)} à faire', flush=True)
    new = not os.path.exists(out)
    t0 = time.time()
    with open(out, 'a', newline='') as f:
        w = csv.DictWriter(f, KEYS, extrasaction='ignore')
        if new: w.writeheader(); f.flush()
        with Pool(4) as pool:
            for i, r in enumerate(pool.imap_unordered(job, jobs)):
                w.writerow(r); f.flush(); os.fsync(f.fileno())     # chaque essai est écrit dès qu'il est fini
                if i % 25 == 0: print(f'{i}/{len(jobs)} {time.time() - t0:.0f}s', flush=True)
    print('fini', time.time() - t0, flush=True)
