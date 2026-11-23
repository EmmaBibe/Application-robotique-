"""Séance 8 (PLAN_SEANCE8.md) : même banc que bench.py, avec le nombre de cycles sautés quand le temps de calcul
compte dans la boucle (condition tout_calcul). Usage : CONDS=tout,tout_calcul python3 seance8.py 6000:6060 sortie.csv 71,74,49,54"""
import csv, os, sys, time
from multiprocessing import Pool
import bench, planners

KEYS = bench.KEYS + ["cycles_sautes"]

if __name__ == '__main__':
    a = sys.argv[1]; out = sys.argv[2]; which = [int(x) for x in sys.argv[3].split(',')]
    seeds = range(int(a.split(':')[0]), int(a.split(':')[1]))
    jobs = [(sc, sd, pi, c) for pi in which for sc in bench.SCENES for sd in seeds for c in bench.CONDS]
    done = set()
    if os.path.exists(out):
        for r in csv.DictReader(open(out)): done.add((r['scene'], int(r['seed']), r['planner'], r['cond']))
    jobs = [j for j in jobs if (j[0], j[1], planners.ALL[j[2]].name, j[3]) not in done]
    jobs.sort(key=lambda j: -j[2])
    print(f'{len(done)} essais déjà enregistrés, {len(jobs)} à faire', flush=True)
    new = not os.path.exists(out); t0 = time.time()
    with open(out, 'a', newline='') as f:
        w = csv.DictWriter(f, KEYS, extrasaction='ignore')
        if new: w.writeheader(); f.flush()
        with Pool(4) as pool:
            for i, r in enumerate(pool.imap_unordered(bench.job, jobs)):
                w.writerow(r); f.flush(); os.fsync(f.fileno())
                if i % 25 == 0: print(f'{i}/{len(jobs)} {time.time() - t0:.0f}s', flush=True)
    print('fini', time.time() - t0, flush=True)
