import sys, collections
from multiprocessing import Pool
import sim, planners as P
def job(a):
    pi, sc, sd, c = a; C = P.ALL[pi]; r = sim.run_episode(sim.World(sc, sd), P.Memory(C), cond=c)
    return C.name, sc, c, r['outcome']
if __name__ == '__main__':
    pis = [int(x) for x in sys.argv[1].split(',')]; scs = sys.argv[2].split(','); cs = sys.argv[3].split(','); seeds = range(*map(int, sys.argv[4].split(':')))
    with Pool(4) as pool: res = pool.map(job, [(pi, sc, sd, c) for pi in pis for sc in scs for c in cs for sd in seeds])
    agg = collections.defaultdict(collections.Counter)
    for n, sc, c, o in res: agg[(sc, c, n)][o] += 1
    for k in sorted(agg): v = agg[k]; print(f'{k[0]:13s} {k[1]:11s} {k[2][:30]:30s} {100*v["succes"]/sum(v.values()):5.0f}%  {dict(v)}')
