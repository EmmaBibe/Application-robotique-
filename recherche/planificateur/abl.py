import sys, collections
from multiprocessing import Pool
import sim, planners as P
def job(a):
    pi, sc, sd, c = a; C = P.ALL[pi]; m = P.Memory(C); r = sim.run_episode(sim.World(sc, sd), m, cond=c)
    return C.name, sc, c, sd, r['outcome'], getattr(m.p, 'reflex_n', 0)
if __name__ == '__main__':
    pis = [int(x) for x in sys.argv[1].split(',')]; scs = sys.argv[2].split(','); cs = sys.argv[3].split(','); seeds = range(*map(int, sys.argv[4].split(':')))
    jobs = [(pi, sc, sd, c) for pi in pis for sc in scs for c in cs for sd in seeds]
    with Pool(4) as pool: res = pool.map(job, jobs)
    agg = collections.defaultdict(collections.Counter)
    for n, sc, c, sd, o, rf in res: agg[n][o] += 1
    for n, c in agg.items(): print(f'{n:40s} succès {100*c["succes"]/sum(c.values()):5.1f}%  {dict(c)}')
    for x in res:
        if x[4] != 'succes': print('  ', x)
