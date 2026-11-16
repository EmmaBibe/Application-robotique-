"""Erreur d'estimation de la vitesse des personnes proches du robot, filtre de suivi par filtre de suivi."""
import sys, numpy as np, sim, robot_reel

def mesure(make, scene, cond, seeds=range(1400, 1410), rmax=5.0):
    C = sim.COND[cond]; errs = []; pics = 0
    for sd in seeds:
        w = sim.World(scene, sd); tr = make(); rob = np.array([10.0, 10.0, 0.0])
        for k in range(300):
            obs = w.obstacles(noise=0.05, robot=rob, rng_range=C.get('range'), occl=C.get('occl', False), drop=C.get('drop', 0.0))
            out = tr(obs)
            if k > 10:
                for o in out:
                    if o[5] <= 0: continue
                    j = int(o[6]) - 1000; tv = w.dyn[j]['v']; p = w.dyn[j]['p']
                    if np.hypot(*(p - rob[:2])) < rmax:
                        e = np.hypot(*(o[2:4] - tv)); errs.append(e); pics += e > 1.0
            w.step_obstacles(k * 0.1, robot=rob[:2])
    e = np.array(errs)
    return f'erreur moyenne {e.mean():.2f} m/s, médiane {np.median(e):.2f}, 95e centile {np.percentile(e, 95):.2f}, pics > 1 m/s : {pics / len(e) * 100:.1f} %'

if __name__ == '__main__':
    makers = {'actuel (alpha-bêta)': robot_reel.Tracker}
    if hasattr(robot_reel, 'TrackerKF'): makers['Kalman + gestion des pistes'] = robot_reel.TrackerKF
    for sc in ['coin_aveugle', 'goulot', 'traversee']:
        for cond in ['nominal', 'perception']:
            for nm, mk in makers.items(): print(f'{sc:13s} {cond:10s} {nm:28s} {mesure(mk, sc, cond)}', flush=True)
