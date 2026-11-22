"""Fidélité du portage JavaScript (js/sims/vigie6/) au banc Python.

Mêmes entrées des deux côtés, mêmes sorties exigées : grille, Dijkstra, A*, routes topologiques, route espace-temps,
coûts, probabilité de collision, cohérence de route, fantômes, robot réaliste, monde, perception, et, pour finir,
des décisions complètes de VIGIE 6 et de DRA-MPPI rejouées pas à pas sur des épisodes du banc.
Les tirages aléatoires des planificateurs sont remplacés, des deux côtés, par un même générateur à arithmétique
entière (xorshift32 et somme de 12 uniformes) : identique au bit près en Python et en JavaScript.
Usage : python3 parite_js.py   (ou via tests_banc.py, test 32)"""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sim, planners as P, references as REF, vigie_risque as VR, robot_reel as RR


class Gen:
    """xorshift32 ; normal() = somme de 12 uniformes - 6 (assez proche d'une gaussienne pour exercer le code)."""
    def __init__(self, seed): self.s = (seed * 2654435761) & 0xFFFFFFFF or 1

    def u(self):
        x = self.s
        x ^= (x << 13) & 0xFFFFFFFF; x ^= x >> 17; x ^= (x << 5) & 0xFFFFFFFF
        self.s = x & 0xFFFFFFFF
        return self.s / 4294967296.0

    def normal(self, loc=0.0, scale=1.0, size=None):
        n = int(np.prod(size)) if size is not None else 1
        out = np.empty(n)
        for k in range(n):
            acc = 0.0
            for _ in range(12): acc += self.u()
            out[k] = acc - 6.0
        out = loc + scale * out
        return out.reshape(size) if size is not None else float(out[0])


def _obs_list(a): return [[float(v) for v in r] for r in np.asarray(a)]


def vectors():
    V = {}
    # --- mondes de référence : obstacles et personnes de quelques scènes du banc
    worlds = []
    for scene, seed in [('foret', 1412), ('goulot', 1460), ('coin_aveugle', 1427), ('foule_dense', 1449), ('piege', 1408)]:
        w = sim.World(scene, seed)
        worlds.append(dict(scene=scene, seed=seed, static=w.static.tolist(), obs=_obs_list(w.obstacles(noise=0.0)),
                           dyn=[dict(p=o['p'].tolist(), v=o['v'].tolist(), r=o['r'], kind=o['kind'], mode=str(o['mode']),
                                     t_switch=float(o['t_switch']), done=bool(o['done']), reactif=bool(o['reactif']), sp=float(o.get('sp', 0.0)))
                                for o in w.dyn], door=(w.door.tolist() if hasattr(w, 'door') else None)))
    V['worlds'] = worlds
    # --- grille, champ de distance, A*, routes
    g = []
    for w in worlds:
        st = [tuple(c) for c in w['static']]
        occ = P.occupancy(st, sim.R_ROB + 0.1); D = P.dijkstra(occ, np.array([18.5, 10.0]))
        path = P.astar(P.occupancy(st, 0.35), np.array([1.5, 10.0]), np.array([18.5, 10.0]))
        obs = np.array(w['obs'], float)
        s = np.array([4.0, 9.5, 0.3])
        guides = P.diverse_guides(s, np.array([18.5, 10.0]), obs, 3)
        ua = 0.02 + 0.30 * np.linspace(0, 1, len(obs))
        gt = P.spacetime_plan2(s, np.array([18.5, 10.0]), obs, D, unc_agent=ua, margin_static=0.1)
        gt3 = P.spacetime_plan2(s, np.array([18.5, 10.0]), obs, D, unc_agent=ua)
        g.append(dict(occ_sum=int(occ.sum()), D=D.ravel().tolist(), path=None if path is None else path.tolist(),
                      guides=[q.tolist() for q in guides], gt=None if gt is None else gt.tolist(), gt3=None if gt3 is None else gt3.tolist(),
                      gtc=P.guide_to_controls(s, guides[0], 25).ravel().tolist() if guides else None,
                      tc=P.timed_controls(s, gt, 25).ravel().tolist() if gt is not None else None, s=s.tolist(), ua=ua.tolist()))
    V['grid'] = g
    # --- probabilité de collision
    rng = np.random.default_rng(3)
    d = rng.uniform(0, 4, 4000); r = rng.uniform(0.3, 1.0, 4000); sg = rng.uniform(0.02, 2.0, 4000)
    V['cp'] = dict(d=d.tolist(), r=r.tolist(), sig=sg.tolist(), p=REF.collision_prob(d, r, sg).tolist())
    # --- coûts de VIGIE 6 et de DRA-MPPI sur des commandes variées
    costs = []
    for wi, w in enumerate(worlds):
        obs = np.array(w['obs'], float); st = np.array(w['static'], float)
        v6 = VR.Vigie6(); v6.reset(st, np.array([18.5, 10.0]))
        dr = REF.TUNING[1](); dr.reset(st, np.array([18.5, 10.0]))
        U = np.clip(np.stack([np.tile([1.0, 0.0], (25, 1)) + rng.normal(0, 1, (25, 2)) * [0.5, 1.0] for _ in range(24)]), [0, -2], [1.5, 2])
        s = np.array([3.0 + wi, 9.0 + 0.2 * wi, 0.1 * wi])
        guide = np.array(g[wi]['guides'][0]) if g[wi]['guides'] else None
        gtv = np.array(g[wi]['gt']) if g[wi]['gt'] is not None else None
        c_plain = v6.eval_cost(s, U, obs)
        c_guide = v6.eval_cost(s, U, obs, guide=guide) if guide is not None else None
        c_gt = v6.sample_cost_t(s, U, obs, gtv) if gtv is not None else None
        costs.append(dict(s=s.tolist(), U=U.ravel().tolist(), vigie=c_plain.tolist(), vigie_guide=None if c_guide is None else c_guide.tolist(),
                          vigie_gt=None if c_gt is None else c_gt.tolist(), dra=dr.eval_cost(s, U, obs).tolist(), ideal=float(v6.ideal_cost(s))))
    V['costs'] = costs
    # --- cohérence : route restante et classes d'homotopie
    hom = []
    for wi, w in enumerate(worlds):
        st = np.array(w['static'], float)
        gs = g[wi]['guides']
        if len(gs) < 2: continue
        s = np.array(g[wi]['s'])
        ra = [VR._route_ahead(np.array(q), s).tolist() for q in gs]
        stobs = np.hstack([st[:, :2], np.zeros((len(st), 2)), st[:, 2:3], np.zeros((len(st), 2))])   # lignes d'obstacles fixes
        same = [[bool(REF.same_class(np.array(ra[a]), np.array(ra[b]), stobs, np.zeros(60))) for b in range(len(ra))] for a in range(len(ra))]
        hom.append(dict(wi=wi, ra=ra, same=same))
    V['homotopy'] = hom
    # --- fantômes d'angle mort et vitesse prudente
    ph = []
    for wi, w in enumerate(worlds):
        obs = np.array(w['obs'], float)
        for s in ([4.0, 10.0, 0.0], [6.0, 9.95, 0.2], [9.0, 10.2, -0.3], [12.0, 10.0, 0.0]):
            s = np.array(s); pr = P.phantoms(s, obs, 5.0)
            ph.append(dict(wi=wi, s=s.tolist(), ph=_obs_list(pr), v=float(P.phantom_speed(s, pr))))
    V['phantoms'] = ph
    # --- robot réaliste, bruit nul des deux côtés
    class Zero:
        def normal(self, loc=0.0, scale=1.0, size=None): return np.zeros(size) if size is not None else 0.0
    rb = RR.RealRobot([1.5, 10.0, 0.0], Zero()); traj = []
    cmds = [(min(1.5, 0.05 * k), 0.8 * np.sin(0.1 * k)) for k in range(60)]
    for vc, wc in cmds:
        rb.step(vc, wc); traj.append([*rb.p.tolist(), *rb.est.tolist(), rb.v, rb.w])
    V['robot'] = dict(cmds=[list(c) for c in cmds], traj=traj)
    # --- évolution des personnes sans hasard (trajectoire du robot imposée) et filtrage des capteurs
    dyn = []
    for scene, seed in [('traversee', 1461), ('coin_aveugle', 1462), ('poursuite', 1463), ('carrefour', 1464), ('couloir', 1465), ('piege', 1466)]:
        w = sim.World(scene, seed)
        init = [dict(p=o['p'].tolist(), v=o['v'].tolist(), r=o['r'], kind=o['kind'], mode=str(o['mode']), t_switch=float(o['t_switch']),
                     done=bool(o['done']), reactif=bool(o['reactif']), sp=float(o.get('sp', 0.0))) for o in w.dyn]
        robot = lambda k: np.array([1.5 + 0.12 * k, 10.0 + 0.6 * np.sin(0.05 * k)])
        states, keeps = [], []
        for k in range(120):
            react = scene in ('carrefour', 'couloir')
            w.step_obstacles(k * sim.DT, robot=robot(k), react=react)
            states.append([o['p'].tolist() + o['v'].tolist() for o in w.dyn])
            if k % 10 == 0:
                A = w.obstacles(noise=0.0, robot=robot(k), rng_range=5.0, occl=True, drop=0.0)
                keeps.append(sorted(int(i) for i in A[:, 6]))
        dyn.append(dict(scene=scene, seed=seed, static=w.static.tolist(), init=init, states=states, keeps=keeps,
                        door=(w.door.tolist() if hasattr(w, 'door') else None), react=scene in ('carrefour', 'couloir')))
    V['dynamics'] = dyn
    # --- décisions complètes rejouées
    V['episodes'] = [record_episode('goulot', 1460, 'nominal', 'vigie', 70), record_episode('coin_aveugle', 1427, 'perception', 'vigie', 60),
                     record_episode('foule_dense', 1449, 'reactifs', 'vigie', 50), record_episode('foule', 1427, 'perception', 'dra', 60)]
    return V


def record_episode(scene, seed, cond, which, n_steps):
    """Épisode du banc (REEL=1) dont on enregistre, à chaque décision, les entrées du planificateur et sa commande."""
    os.environ['REEL'] = '1'
    cls = VR.Vigie6 if which == 'vigie' else REF.TUNING[1]
    mem = P.Memory(cls)
    log = []
    orig_reset = mem.reset

    def reset(static, goal):
        orig_reset(static, goal); mem.p.rng = Gen(seed + 17)
    mem.reset = reset
    orig_act = mem.act

    def act(t, s, obs):
        u = orig_act(t, s, obs)
        log.append(dict(t=float(t), s=[float(x) for x in s], obs=_obs_list(obs), u=[float(u[0]), float(u[1])],
                        chosen=getattr(mem.p, '_last_choice', None)))
        return u
    mem.act = act
    if which == 'vigie':
        orig_sel = mem.p.select

        def sel(s_, Us, obs_):
            i = orig_sel(s_, Us, obs_); mem.p._last_choice = int(i); return i
        mem.p.select = sel
    old = sim.T_MAX; sim.T_MAX = n_steps * sim.DT - 1e-9
    try: sim.run_episode(sim.World(scene, seed), mem, cond=cond)
    finally: sim.T_MAX = old
    return dict(scene=scene, seed=seed, cond=cond, which=which, steps=log, gen_seed=seed + 17,
                lat=int(mem.p.lat), occl=bool(getattr(mem.p, 'occl', False)), sense=float(getattr(mem.p, 'sense', 5.0)),
                static=np.asarray(sim.World(scene, seed).static).tolist())


def run():
    """Calcule les vecteurs, lance le côté JavaScript, renvoie la liste des vérifications (nom, réussi, détail)."""
    V = vectors()
    js = subprocess.run(['node', os.path.join(HERE, 'parite_js.mjs')], input=json.dumps(V).encode(), capture_output=True, timeout=900)
    if js.returncode != 0: return [('côté JavaScript exécuté sans erreur', False, js.stderr.decode()[-2000:])]
    return [tuple(c) for c in json.loads(js.stdout.decode())]


if __name__ == '__main__':
    res = run()
    for name, ok, detail in res: print(('  ok   ' if ok else '  ÉCHEC ') + name + (f'  ({detail})' if detail else ''))
    print(f"\n{sum(ok for _, ok, _ in res)} vérifications réussies, {sum(not ok for _, ok, _ in res)} échecs")
