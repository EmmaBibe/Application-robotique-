"""Borne physique pour la scène des angles morts : existe-t-il un profil de vitesse le long du couloir qui
évite tout le monde, en connaissant le vrai futur ? Les personnes y vont tout droit à vitesse constante,
sans réagir au robot (conditions nominal et perception) : leur futur est exact, la borne est rigoureuse
pour cette famille de trajets (axe du couloir, sans écart latéral)."""
import sys, copy
import numpy as np
import sim

def faisable(seed, acc=1.6, dec=2.0, ds=0.0025, dv=0.05, vmax=1.5, marge=0.0, scene='coin_aveugle'):
    w = sim.World(scene, seed); w0 = copy.deepcopy(w)
    x0, xg, y = w.start[0], w.goal[0], w.start[1]
    K = int(sim.T_MAX / sim.DT); dt = sim.DT
    sg = np.arange(0, xg - x0 + 1e-9, ds); n = len(sg); px = x0 + sg
    occ = np.zeros((K + 1, n), bool)
    for k in range(K + 1):
        P = np.array([o['p'] for o in w0.dyn]).reshape(-1, 2); r = np.array([o['r'] for o in w0.dyn])
        d = np.hypot(px[:, None] - P[None, :, 0], y - P[None, :, 1]) - r[None] - sim.R_ROB - marge
        occ[k] = (d < 0).any(1)
        w0.step_obstacles(k * dt)
    nv = int(round(vmax / dv)) + 1
    dvi = range(-int(round(dec * dt / dv)), int(round(acc * dt / dv)) + 1)
    reach = np.zeros((n, nv), bool); reach[0, 0] = True
    jg = int((xg - x0 - 0.5) / ds)              # but atteint à 0,5 m (comme dans le simulateur)
    for k in range(K):
        nxt = np.zeros_like(reach)
        js, vis = np.nonzero(reach)
        for di in dvi:
            v2 = np.clip(vis + di, 0, nv - 1)
            j2 = np.minimum(n - 1, js + np.rint((vis + v2) * dv / 2 * dt / ds).astype(int))   # exact : (v+v2)/2·dt multiple de ds
            nxt[j2, v2] = True
        nxt[occ[k + 1]] = False
        reach = nxt
        if reach[jg:].any(): return True, (k + 1) * dt
        if not reach.any(): return False, (k + 1) * dt
    return False, sim.T_MAX

if __name__ == '__main__':
    a, b = (int(x) for x in sys.argv[1].split(':')) if len(sys.argv) > 1 else (1400, 1460)
    kw = dict(acc=float(sys.argv[2]), dec=float(sys.argv[3])) if len(sys.argv) > 3 else {}
    ok = 0
    for s in range(a, b):
        f, t = faisable(s, **kw); ok += f
        print(s, 'faisable' if f else 'IMPOSSIBLE', f'{t:.1f} s', flush=True)
    print(f'{ok}/{b - a} mondes faisables')
