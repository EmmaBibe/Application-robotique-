"""Banc d'essai : robot unicycle dans une arène 20 x 20 m, obstacles fixes et mobiles.

Les obstacles mobiles peuvent changer d'intention (tourner, s'arrêter, accélérer)
sans prévenir : c'est ce qui rend la prédiction difficile.
"""
import numpy as np

DT = 0.1
R_ROB = 0.3
VMAX, WMAX = 1.5, 2.0
AMAX, ALPHA = 2.0, 4.0
SIZE = 20.0
T_MAX = 45.0


class World:
    def __init__(self, name, seed):
        self.name, self.seed = name, seed
        self.nrng = np.random.default_rng(10_000 + seed)   # bruit de mesure, séparé de l'évolution du monde
        self.keepout = []
        self.start = np.array([1.5, 10.0, 0.0])
        self.goal = np.array([18.5, 10.0])
        self.static = []      # (x, y, r)
        self.dyn = []         # dict(p, v, r, mode, t_switch, kind)
        # on régénère tant que le monde n'a pas de passage pour le robot (marge 0,35 m)
        for k in range(50):
            self.rng = np.random.default_rng(seed + 100_000 * k)
            self.static, self.dyn, self.keepout = [], [], []
            getattr(self, 'build_' + name)()
            self.static = np.array(self.static, float).reshape(-1, 3)
            if self.feasible(): break

    def feasible(self):
        from planners import astar, occupancy
        return astar(occupancy([tuple(c) for c in self.static], 0.35), self.start[:2], self.goal) is not None

    # ------------------------------------------------------------ scénarios
    def _free(self, x, y, r, margin=1.6):
        if np.hypot(x - self.start[0], y - self.start[1]) < margin + r: return False
        if np.hypot(x - self.goal[0], y - self.goal[1]) < margin + r: return False
        if any(np.hypot(x - a, y - b) < r + 1.4 for a, b in self.keepout): return False
        return all(np.hypot(x - a, y - b) > r + c + 0.15 for a, b, c in self.static)

    def _rand_static(self, n, rmin=0.4, rmax=1.0, box=(3, 17, 1, 19)):
        while n > 0:
            r = self.rng.uniform(rmin, rmax); x = self.rng.uniform(box[0], box[1]); y = self.rng.uniform(box[2], box[3])
            if self._free(x, y, r): self.static.append((x, y, r)); n -= 1

    def _add_dyn(self, p, v, r=0.35, kind='intent'):
        t_switch = self.rng.uniform(1.0, 12.0)
        mode = self.rng.choice(['tout_droit', 'gauche', 'droite', 'arret', 'accel'], p=[0.3, 0.2, 0.2, 0.15, 0.15])
        self.dyn.append(dict(p=np.array(p, float), v=np.array(v, float), r=r, mode=mode, t_switch=t_switch, kind=kind, done=False,
                         reactif=bool(np.random.default_rng(len(self.dyn) * 31 + 7).random() < 0.7)))

    def build_foret(self):
        self._rand_static(30)

    def build_carrefour(self):
        self._rand_static(6)
        for i in range(10):
            x = self.rng.uniform(5, 15); s = self.rng.uniform(0.6, 1.3)
            if i % 2: self._add_dyn((x, self.rng.uniform(0.5, 4)), (self.rng.uniform(-0.2, 0.2), s))
            else: self._add_dyn((x, self.rng.uniform(16, 19.5)), (self.rng.uniform(-0.2, 0.2), -s))

    def build_couloir(self):
        gap = self.rng.uniform(7, 13)
        y = 0.4
        while y < SIZE:
            if abs(y - gap) > 1.1: self.static.append((10.0, y, 0.45))
            y += 0.8
        self.keepout = [(10.0, gap), (8.5, gap), (11.5, gap)]
        self._rand_static(8)
        self._add_dyn((14, gap + self.rng.uniform(-1, 1)), (-self.rng.uniform(0.5, 0.9), 0), r=0.4)
        for _ in range(3): self._add_dyn((self.rng.uniform(4, 16), self.rng.uniform(1, 19)), self.rng.uniform(-0.8, 0.8, 2))

    def build_piege(self):
        # un U ouvert vers le départ : le piège classique des champs de potentiel
        cx = 9.0
        for a in np.linspace(-np.pi / 2, np.pi / 2, 15):
            self.static.append((cx + 2.6 * np.cos(a), 10 + 2.6 * np.sin(a), 0.42))
        for x in np.linspace(cx - 2.4, cx, 4):
            self.static.append((x, 7.4, 0.42)); self.static.append((x, 12.6, 0.42))
        self._rand_static(10, box=(12, 17, 1, 19))
        for _ in range(2): self._add_dyn((self.rng.uniform(12, 17), self.rng.uniform(2, 18)), self.rng.uniform(-0.7, 0.7, 2))

    def build_foule(self):
        self._rand_static(8)
        for _ in range(16):
            while True:
                x, y = self.rng.uniform(3, 17), self.rng.uniform(1, 19)
                if self._free(x, y, 0.35, 2.5): break
            ang = self.rng.uniform(0, 2 * np.pi); s = self.rng.uniform(0.4, 1.1)
            self._add_dyn((x, y), (s * np.cos(ang), s * np.sin(ang)), kind='errant')

    def build_foule_dense(self):
        self._rand_static(5)
        for _ in range(26):
            while True:
                x, y = self.rng.uniform(3, 17), self.rng.uniform(1, 19)
                if self._free(x, y, 0.35, 2.5): break
            ang = self.rng.uniform(0, 2 * np.pi); s = self.rng.uniform(0.6, 1.4)
            self._add_dyn((x, y), (s * np.cos(ang), s * np.sin(ang)), kind='errant')

    def build_carrefour_rapide(self):
        self._rand_static(4)
        for i in range(14):
            x = self.rng.uniform(4, 16); s = self.rng.uniform(1.0, 1.8)
            if i % 2: self._add_dyn((x, self.rng.uniform(0.5, 6)), (self.rng.uniform(-0.3, 0.3), s))
            else: self._add_dyn((x, self.rng.uniform(14, 19.5)), (self.rng.uniform(-0.3, 0.3), -s))

    # ------------------------------------------------------------ évolution
    def step_obstacles(self, t, robot=None, react=False):
        for o in self.dyn:
            if react and robot is not None and o['reactif']:
                # les agents réactifs s'écartent du robot quand il est proche (force sociale simplifiée)
                d = o['p'] - robot; n = np.hypot(*d)
                if 1e-6 < n < 2.0:
                    o['v'] = o['v'] + DT * 1.5 * d / n * (2.0 - n)
                    sp = np.hypot(*o['v'])
                    if sp > 1.8: o['v'] = o['v'] / sp * 1.8
            if o['kind'] == 'errant':
                if self.rng.random() < 0.03:   # change de direction de temps en temps
                    ang = np.arctan2(o['v'][1], o['v'][0]) + self.rng.normal(0, 1.2)
                    s = np.clip(np.hypot(*o['v']) + self.rng.normal(0, 0.2), 0.2, 1.2)
                    o['v'] = s * np.array([np.cos(ang), np.sin(ang)])
            elif not o['done'] and t >= o['t_switch']:
                o['done'] = True
                c, s = np.cos(np.pi / 2), np.sin(np.pi / 2)
                if o['mode'] == 'gauche': o['v'] = np.array([c * o['v'][0] - s * o['v'][1], s * o['v'][0] + c * o['v'][1]])
                elif o['mode'] == 'droite': o['v'] = np.array([c * o['v'][0] + s * o['v'][1], -s * o['v'][0] + c * o['v'][1]])
                elif o['mode'] == 'arret': o['v'] = o['v'] * 0.0
                elif o['mode'] == 'accel': o['v'] = o['v'] * 1.6
            o['p'] = o['p'] + o['v'] * DT
            for k in (0, 1):   # rebond sur les murs de l'arène
                if o['p'][k] < o['r'] or o['p'][k] > SIZE - o['r']:
                    o['v'][k] *= -1; o['p'][k] = np.clip(o['p'][k], o['r'], SIZE - o['r'])

    def obstacles(self, noise=0.0, robot=None, rng_range=None, occl=False, drop=0.0):
        """Tableau N x 7 : x, y, vx, vy, r, mobile, identifiant. Les mesures des mobiles sont bruitées.
        Avec rng_range / occl / drop : portée limitée, masquage par les autres obstacles, pertes de détection."""
        rows = [(x, y, 0, 0, r, 0, i) for i, (x, y, r) in enumerate(self.static)]
        for j, o in enumerate(self.dyn):
            p = o['p'] + self.nrng.normal(0, noise, 2); v = o['v'] + self.nrng.normal(0, noise, 2)
            rows.append((p[0], p[1], v[0], v[1], o['r'], 1, 1000 + j))
        A = np.array(rows, float).reshape(-1, 7)
        if robot is None or len(A) == 0: return A
        keep = np.ones(len(A), bool)
        d = np.hypot(A[:, 0] - robot[0], A[:, 1] - robot[1])
        if rng_range: keep &= d - A[:, 4] < rng_range
        if occl:
            for i in np.nonzero(keep)[0]:
                u = A[i, :2] - robot[:2]; L = np.hypot(*u)
                if L < 1e-6: continue
                u = u / L
                rel = A[:, :2] - robot[:2]; proj = rel @ u
                perp = np.abs(rel[:, 0] * u[1] - rel[:, 1] * u[0])
                block = (proj > 0) & (proj < L - A[i, 4] - A[:, 4]) & (perp < 0.85 * A[:, 4])
                block[i] = False
                if block.any(): keep[i] = False
        if drop: keep &= ~((A[:, 5] > 0) & (self.nrng.random(len(A)) < drop))
        return A[keep]

    def true_obstacles(self):
        rows = [(x, y, r) for x, y, r in self.static] + [(o['p'][0], o['p'][1], o['r']) for o in self.dyn]
        return np.array(rows, float).reshape(-1, 3)


COND = {
    'nominal': {},
    'perception': dict(range=5.0, occl=True, drop=0.1),
    'latence': dict(lat=2),
    'glissement': dict(slip=True),
    'carte_inconnue': dict(unknown=True, range=6.0),
    'reactifs': dict(react=True),
    'enfer': dict(range=5.0, occl=True, drop=0.1, lat=2, slip=True, unknown=True, react=True),
}


def run_episode(world, planner, perturb=True, record=False, cond='nominal'):
    import zlib
    rng = np.random.default_rng(12345 + zlib.crc32(world.name.encode()) % 1000 + 7919 * world.seed)
    s = world.start.copy(); v = w = 0.0; t = 0.0
    C = COND[cond] if isinstance(cond, str) else cond
    known = world.static.copy()
    if C.get('unknown'): known = known[np.hypot(known[:, 0] - s[0], known[:, 1] - s[1]) - known[:, 2] < C.get('range', 6.0)]
    planner.reset(known, world.goal.copy())
    if hasattr(planner, 'bind'): planner.bind(world)
    gv, gw, bw = 1.0, 1.0, 0.0
    if C.get('slip'):   # erreur de modèle persistante : roues qui patinent, moteur mal étalonné
        gv, gw, bw = rng.uniform(0.75, 1.15), rng.uniform(0.75, 1.2), rng.uniform(-0.12, 0.12)
    from collections import deque
    queue = deque()
    path = [s[:2].copy()]; vs = []; ws = []; comp = []; minclear = np.inf
    outcome = 'temps'
    import time
    while t < T_MAX:
        meas = s + (rng.normal(0, [0.03, 0.03, 0.02]) if perturb else 0)
        obs = world.obstacles(noise=0.05 if perturb else 0.0, robot=s, rng_range=C.get('range'), occl=C.get('occl', False), drop=C.get('drop', 0.0))
        if not C.get('range'):
            pass
        if C.get('lat'):
            queue.append((meas, obs))
            meas, obs = queue[0] if len(queue) > C['lat'] else queue[0]
            if len(queue) > C['lat']: queue.popleft()
        t0 = time.perf_counter()
        vc, wc = planner.act(t, meas, obs)
        comp.append(time.perf_counter() - t0)
        vc = float(np.clip(vc, 0, VMAX)); wc = float(np.clip(wc, -WMAX, WMAX))
        v = v + np.clip(vc - v, -AMAX * DT, AMAX * DT); w = w + np.clip(wc - w, -ALPHA * DT, ALPHA * DT)
        va, wa = v, w
        if perturb: va = v * (1 + rng.normal(0, 0.05)); wa = w + rng.normal(0, 0.05)
        va, wa = va * gv, wa * gw + bw * (abs(va) > 0.05)
        s = s + DT * np.array([va * np.cos(s[2]), va * np.sin(s[2]), wa])
        s[2] = (s[2] + np.pi) % (2 * np.pi) - np.pi
        world.step_obstacles(t, robot=s[:2], react=C.get('react', False)); t += DT
        world.t = t
        path.append(s[:2].copy()); vs.append(v); ws.append(w)
        ob = world.true_obstacles()
        clear = np.min(np.hypot(ob[:, 0] - s[0], ob[:, 1] - s[1]) - ob[:, 2]) - R_ROB if len(ob) else np.inf
        clear = min(clear, s[0] - R_ROB, s[1] - R_ROB, SIZE - R_ROB - s[0], SIZE - R_ROB - s[1])
        minclear = min(minclear, clear)
        if clear < 0: outcome = 'collision'; break
        if np.hypot(*(s[:2] - world.goal)) < 0.5: outcome = 'succes'; break
    path = np.array(path); vs = np.array(vs); ws = np.array(ws)
    length = float(np.sum(np.hypot(*np.diff(path, axis=0).T)))
    acc = np.diff(vs) / DT if len(vs) > 1 else np.zeros(1)
    jerk = float(np.mean(np.abs(np.diff(acc) / DT))) if len(acc) > 1 else 0.0
    res = dict(outcome=outcome, temps=t, longueur=length, marge_min=float(minclear), jerk=jerk,
               lissage_w=float(np.mean(np.abs(np.diff(ws)))) if len(ws) > 1 else 0.0,
               calcul_ms=1000 * float(np.mean(comp)), calcul_max_ms=1000 * float(np.max(comp)))
    if record: res['path'] = path
    return res
