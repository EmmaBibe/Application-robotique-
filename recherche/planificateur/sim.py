"""Banc d'essai : robot unicycle dans une arène 20 x 20 m, obstacles fixes et mobiles.

Les obstacles mobiles peuvent changer d'intention (tourner, s'arrêter, accélérer)
sans prévenir : c'est ce qui rend la prédiction difficile.
"""
import os
import numpy as np

DT = 0.1
R_ROB = 0.3
BALAYAGE = bool(__import__('os').environ.get('BALAYAGE'))   # diagnostic de contact entre deux instants (sans effet sur l'issue)
VMAX, WMAX = 1.5, 2.0
AMAX, ALPHA = 2.0, 4.0
SIZE = 20.0
T_MAX = 45.0


class World:
    def __init__(self, name, seed, version=None, pietons=None):
        self.name, self.seed = name, seed
        # version 2 des mondes (relecture extérieure du 23 novembre) : placement valide des personnes et piétons qui
        # contournent les obstacles fixes au lieu de les traverser. Version 1 par défaut, inchangée au bit près.
        self.version = int(version or os.environ.get('MONDE', 1))
        # modèle de marche des piétons : « simple » (vitesse imposée, ils ne s'évitent pas entre eux) ou « sfm » (forces
        # sociales de Helbing et Molnár, 1995 : chacun tend vers sa vitesse voulue et s'écarte des autres et des obstacles)
        self.pietons = pietons or os.environ.get('PIETONS', 'simple')
        assert self.pietons in ('simple', 'sfm') and (self.pietons == 'simple' or self.version >= 2)
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
        if self.version >= 2: self.placement_rejets, self.placement_echecs = self._valider_placement()

    # ------------------------------------------------------------ mondes version 2
    def _place_ok(self, p, r, j):
        if not (r <= p[0] <= SIZE - r and r <= p[1] <= SIZE - r): return False
        if len(self.static) and np.any(np.hypot(self.static[:, 0] - p[0], self.static[:, 1] - p[1]) < self.static[:, 2] + r + 0.1): return False
        if any(np.hypot(*(p - q['p'])) < r + q['r'] + 0.05 for q in self.dyn[:j]): return False
        if np.hypot(p[0] - self.start[0], p[1] - self.start[1]) < 1.6 + r: return False
        return np.hypot(p[0] - self.goal[0], p[1] - self.goal[1]) >= 0.5 + r

    def _valider_placement(self):
        """Déplace le moins possible chaque personne mal placée (dans un obstacle, sur une autre personne, sur le départ
        ou l'arrivée) : recherche autour de sa position d'origine, rayon croissant, générateur séparé. La densité et la
        disposition voulue par la scène sont conservées. Renvoie le nombre de personnes déplacées et d'échecs."""
        g = np.random.default_rng(7_777_777 + self.seed); rejets = echecs = 0
        for j, o in enumerate(self.dyn):
            if self._place_ok(o['p'], o['r'], j): continue
            rejets += 1; p0 = o['p'].copy()
            for k in range(600):
                q = p0 + g.normal(0, 0.2 + 0.02 * k, 2)
                if self._place_ok(q, o['r'], j): o['p'] = q; break
            else: echecs += 1
        return rejets, echecs

    def _contourner(self, o, j):
        """Un piéton qui heurte un obstacle fixe glisse le long de lui à sa vitesse, puis reprend sa direction."""
        if not len(self.static): return
        C, Rs = self.static[:, :2], self.static[:, 2] + o['r']
        d = o['p'] - C; dist = np.hypot(d[:, 0], d[:, 1]); k = int(np.argmin(dist - Rs))
        if dist[k] >= Rs[k]: return
        n = d[k] / max(dist[k], 1e-9); o['p'] = C[k] + n * Rs[k]
        sp = np.hypot(*o['v'])
        if sp > 1e-9:
            tg = np.array([-n[1], n[0]]); vt = o['v'] @ tg
            sgn = np.sign(vt) if abs(vt) > 1e-9 else (1.0 if j % 2 == 0 else -1.0)   # face à l'obstacle : un côté fixé par personne
            o['p'] = o['p'] + sgn * tg * (sp - abs(vt)) * DT   # la part de vitesse perdue contre l'obstacle, rendue le long de lui
        for _ in range(8):   # puis on ressort de tout obstacle touché (murs faits de disques jointifs)
            d = o['p'] - C; dist = np.hypot(d[:, 0], d[:, 1]); pen = Rs - dist
            if pen.max() <= 1e-9: break
            for m in np.nonzero(pen > 1e-9)[0]:
                dd = o['p'] - C[m]; L = max(np.hypot(*dd), 1e-9)
                if L < Rs[m]: o['p'] = C[m] + dd / L * Rs[m]
        # coincé (passage trop étroit) : il change de direction d'un quart de tour au lieu de pousser indéfiniment
        if sp > 0.05 and '_p0' in o and np.hypot(*(o['p'] - o['_p0'])) < 0.3 * sp * DT:
            c = 1.0 if j % 2 == 0 else -1.0; o['v'] = np.array([-c * o['v'][1], c * o['v'][0]])

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

    # ---------------------------------------------------------------- scènes dures (séance 4)
    def _flux(self, p, v, r=0.35):
        self.dyn.append(dict(p=np.array(p, float), v=np.array(v, float), r=r, mode='tout_droit', t_switch=1e9, kind='flux', done=True,
                             reactif=bool(np.random.default_rng(len(self.dyn) * 31 + 7).random() < 0.7)))

    def build_traversee(self):
        """Un flux continu de piétons rapides à traverser, dans les deux sens : il faut choisir son trou."""
        for i in range(26):
            x = self.rng.uniform(6.3, 13.7); s = self.rng.uniform(0.8, 1.4) * (1 if i % 2 else -1)   # recalibré pour un robot réaliste
            self._flux((x, self.rng.uniform(0.5, 19.5)), (0.0, s))

    def build_goulot(self):
        """Une porte de 1,6 m dans un mur, avec un flux de personnes qui la franchit à contre-sens."""
        gap = self.rng.uniform(8, 12); self.door = np.array([10.0, gap])
        y = 0.4
        while y < SIZE:
            if abs(y - gap) > 1.25: self.static.append((10.0, y, 0.45))
            y += 0.8
        self.keepout = [(10.0, gap), (8.5, gap), (11.5, gap)]
        for _ in range(14):
            x = self.rng.uniform(10.8, 19.5); yy = gap + self.rng.uniform(-3, 3)
            self.dyn.append(dict(p=np.array([x, yy]), v=np.array([-1.0, 0.0]), r=0.35, mode='tout_droit', t_switch=1e9, kind='porte', done=True,
                                 sp=self.rng.uniform(1.0, 1.5), reactif=bool(np.random.default_rng(len(self.dyn) * 31 + 7).random() < 0.7)))

    def build_coin_aveugle(self):
        """Un couloir entre deux murs, percé d'ouvertures d'où surgissent des personnes pressées."""
        gaps = [6.5, 10.5, 14.5]
        for yw in (8.9, 11.1):
            x = 3.0
            while x < 17.5:
                if all(abs(x - g) > 1.0 for g in gaps): self.static.append((x, yw, 0.4))
                x += 0.7
        for g in gaps:
            for k in range(4):
                s = self.rng.uniform(1.6, 2.2) * (1 if self.rng.random() < 0.5 else -1)
                self._flux((g + self.rng.uniform(-0.3, 0.3), self.rng.uniform(0.5, 19.5)), (0.0, s))

    def build_poursuite(self):
        """Des agents qui foncent vers le robot (ils visent sa position, avec un temps de réaction)."""
        self._rand_static(10)
        for _ in range(6):
            while True:
                x, y = self.rng.uniform(6, 19), self.rng.uniform(1, 19)
                if self._free(x, y, 0.35, 4.0): break
            self.dyn.append(dict(p=np.array([x, y]), v=np.zeros(2), r=0.35, mode='tout_droit', t_switch=1e9, kind='chasseur', done=True,
                                 sp=self.rng.uniform(0.75, 1.05), reactif=False))   # recalibré pour un robot réaliste

    # ------------------------------------------------------------ évolution
    # forces sociales : paramètres de Helbing et al. (2000) ramenés à l'unité de masse
    SFM_A, SFM_B, SFM_TAU, SFM_LAMBDA, SFM_AW, SFM_BW = 2.1, 0.3, 0.5, 0.35, 3.0, 0.2

    def _forces_sociales(self):
        n = len(self.dyn); F = np.zeros((n, 2))
        if n == 0: return F
        P = np.array([o['p'] for o in self.dyn]); R = np.array([o['r'] for o in self.dyn])
        V = np.array([o.get('vs', o['v']) for o in self.dyn])
        sp = np.hypot(V[:, 0], V[:, 1]); E = V / np.maximum(sp, 1e-9)[:, None]
        D = P[:, None, :] - P[None, :, :]; dist = np.hypot(D[..., 0], D[..., 1]); np.fill_diagonal(dist, np.inf)
        N = D / np.maximum(dist, 1e-9)[..., None]
        mag = self.SFM_A * np.exp((R[:, None] + R[None, :] - dist) / self.SFM_B)
        cosphi = -(N * E[:, None, :]).sum(-1)                       # l'autre est-il devant moi ?
        w = self.SFM_LAMBDA + (1 - self.SFM_LAMBDA) * (1 + cosphi) / 2
        F += (mag * w)[..., None].__mul__(N).sum(1)
        if len(self.static):
            Ds = P[:, None, :] - self.static[None, :, :2]; ds = np.hypot(Ds[..., 0], Ds[..., 1])
            Ns = Ds / np.maximum(ds, 1e-9)[..., None]
            F += (self.SFM_AW * np.exp((R[:, None] + self.static[None, :, 2] - ds) / self.SFM_BW))[..., None].__mul__(Ns).sum(1)
        return F

    def _vitesse(self, o, j):
        """Vitesse réellement suivie pendant ce pas : la vitesse voulue (modèle simple) ou la relaxation vers elle sous
        l'effet des forces sociales (modèle sfm)."""
        if self.pietons != 'sfm': return o['v']
        vs = o.get('vs', o['v'].copy()); vs = vs + DT * ((o['v'] - vs) / self.SFM_TAU + self._F[j])
        lim = max(1.3 * np.hypot(*o['v']), 0.6); n = np.hypot(*vs)
        if n > lim: vs = vs / n * lim
        o['vs'] = vs; return vs

    def step_obstacles(self, t, robot=None, react=False):
        if self.pietons == 'sfm': self._F = self._forces_sociales()
        for j, o in enumerate(self.dyn):
            if self.version >= 2: o['_p0'] = o['p'].copy()
            if react and robot is not None and o['reactif']:
                # les agents réactifs s'écartent du robot quand il est proche (force sociale simplifiée)
                d = o['p'] - robot; n = np.hypot(*d)
                if 1e-6 < n < 2.0:
                    o['v'] = o['v'] + DT * 1.5 * d / n * (2.0 - n)
                    sp = np.hypot(*o['v'])
                    if sp > 1.8: o['v'] = o['v'] / sp * 1.8
            if o['kind'] == 'chasseur' and robot is not None:
                d = robot - o['p']; n = np.hypot(*d)
                if n > 1e-6: o['v'] = 0.85 * o['v'] + 0.15 * o['sp'] * d / n   # vise le robot, avec un temps de réaction
            elif o['kind'] == 'porte':
                door = self.door
                if o['p'][0] > door[0] + 0.3:
                    d = door - o['p']; n = np.hypot(*d); o['v'] = o['sp'] * d / max(n, 1e-6)
                else: o['v'] = np.array([-o['sp'], 0.0])
                if o['p'][0] < 0.8:
                    # la personne sort par la gauche ; elle ne revient par la droite que si le robot n'est pas
                    # juste devant le point d'entrée (sinon elle surgirait de nulle part à côté de lui)
                    y_in = door[1] + self.rng.uniform(-3, 3)
                    if robot is None or np.hypot(19.5 - robot[0], y_in - robot[1]) > 3.5:
                        o['p'] = np.array([19.5, y_in])
                    else:
                        o['p'] = np.array([-5.0, -5.0]); o['v'] = np.zeros(2)   # attend hors de l'arène
                        continue
            if o['kind'] == 'flux':
                o['p'] = o['p'] + self._vitesse(o, j) * DT
                if o['p'][1] > SIZE + 0.4: o['p'][1] -= SIZE + 0.8
                if o['p'][1] < -0.4: o['p'][1] += SIZE + 0.8
                if self.version >= 2: self._contourner(o, j)
                continue
            if o['kind'] in ('chasseur', 'porte'):
                o['p'] = o['p'] + self._vitesse(o, j) * DT
                if self.version >= 2: self._contourner(o, j)
                continue
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
            o['p'] = o['p'] + self._vitesse(o, j) * DT
            for k in (0, 1):   # rebond sur les murs de l'arène
                if o['p'][k] < o['r'] or o['p'][k] > SIZE - o['r']:
                    o['v'][k] *= -1; o['p'][k] = np.clip(o['p'][k], o['r'], SIZE - o['r'])
                    if 'vs' in o: o['vs'][k] *= -1
            if self.version >= 2: self._contourner(o, j)

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
    # séance 8 : toutes les difficultés à la fois (même contenu qu'« enfer »), puis en comptant aussi le temps de calcul
    'tout': dict(range=5.0, occl=True, drop=0.1, lat=2, slip=True, unknown=True, react=True),
    'tout_calcul': dict(range=5.0, occl=True, drop=0.1, lat=2, slip=True, unknown=True, react=True, calc=True),
    # temps de calcul fixe, celui que garantit le portage C++ (pire cas mesuré 40 ms sur PC) ou un calculateur embarqué
    # deux fois et demie plus lent : reproductible au bit près, aucun cycle sauté tant que le délai ne dépasse pas 100 ms
    'tout_c50': dict(range=5.0, occl=True, drop=0.1, lat=2, slip=True, unknown=True, react=True, calc=True, calc_fixe=0.05),
    'tout_c100': dict(range=5.0, occl=True, drop=0.1, lat=2, slip=True, unknown=True, react=True, calc=True, calc_fixe=0.10),
}


def run_episode(world, planner, perturb=True, record=False, cond='nominal'):
    import zlib, os, time
    from collections import deque
    rng = np.random.default_rng(12345 + zlib.crc32(world.name.encode()) % 1000 + 7919 * world.seed)
    s = world.start.copy(); v = w = 0.0; t = 0.0
    C = dict(COND[cond] if isinstance(cond, str) else cond)
    if os.environ.get('REEL'): C['reel'] = True   # chaîne de commande et perception réalistes, pour toutes les conditions
    robot = tracker = None
    if C.get('reel'):
        import robot_reel
        robot = robot_reel.RealRobot(s, np.random.default_rng(777 + world.seed), file_commandes=bool(C.get('calc')))
        tk = os.environ.get('TRACKER')   # naif : ancien filtre alpha-bêta ; sans_prolongation : Kalman d'avant l'audit (pistes non vues effacées de la sortie)
        tracker = robot_reel.Tracker() if tk == 'naif' else robot_reel.TrackerKF(prolonger=(tk != 'sans_prolongation'))
        C['lat'] = C.get('lat', 0) + 1          # chaîne lidar + traitement : une période de retard de plus
    known = world.static.copy()
    if C.get('unknown'): known = known[np.hypot(known[:, 0] - s[0], known[:, 1] - s[1]) - known[:, 2] < C.get('range', 6.0)]
    planner.reset(known, world.goal.copy())
    world.react = C.get('react', False)
    if hasattr(planner, 'bind'): planner.bind(world)
    try: planner.set_perception(bool(C.get('occl')), C.get('range') or 0.0)
    except AttributeError: pass
    try: planner.set_latency(C.get('lat', 0))   # retard connu du système (mesurable par horodatage sur un vrai robot)
    except AttributeError: pass
    gv, gw, bw = 1.0, 1.0, 0.0
    if C.get('slip'):   # erreur de modèle persistante : roues qui patinent, moteur mal étalonné
        gv, gw, bw = rng.uniform(0.75, 1.15), rng.uniform(0.75, 1.2), rng.uniform(-0.12, 0.12)
    queue = deque()
    path = [s[:2].copy()]; vs = []; ws = []; comp = []; minclear = np.inf
    outcome = 'temps'; marge_bal = np.inf
    # temps de calcul compté dans la boucle (C['calc']) : le planificateur, s'il est encore occupé, ne reçoit pas
    # de nouvelle mesure ; sa commande prend effet après la chaîne (50 ms) plus son propre temps de calcul mesuré
    calc = bool(C.get('calc')) and robot is not None; occupe_jusqua = 0.0; sautes = 0; c_dernier = 0.0
    while t < T_MAX:
        if robot is not None:
            meas = robot.est.copy()                                   # pose estimée (odométrie + recalage lidar)
            obs = world.obstacles(noise=0.05, robot=s, rng_range=C.get('range'), occl=C.get('occl', False), drop=C.get('drop', 0.0))
            if not os.environ.get('VITESSES_EXACTES'): obs = tracker(obs)   # vitesses estimées, pas données (diagnostic : VITESSES_EXACTES=1)
            cov = dict(getattr(tracker, 'last_cov', {}))
        else:
            meas = s + (rng.normal(0, [0.03, 0.03, 0.02]) if perturb else 0)
            obs = world.obstacles(noise=0.05 if perturb else 0.0, robot=s, rng_range=C.get('range'), occl=C.get('occl', False), drop=C.get('drop', 0.0))
        if robot is None: cov = {}
        if C.get('lat'):
            queue.append((meas, obs, cov))
            meas, obs, cov = queue[0]
            if len(queue) > C['lat']: queue.popleft()
        planifie = not calc or t >= occupe_jusqua - 1e-9
        if planifie:
            if hasattr(planner, 'set_track_cov'): planner.set_track_cov(cov)   # incertitude du suivi, retardée comme les mesures
            t0 = time.perf_counter()
            vc, wc = planner.act(t, meas, obs)
            c_dernier = time.perf_counter() - t0; comp.append(c_dernier)
            if C.get('calc_fixe') is not None: c_dernier = C['calc_fixe']
            if calc: occupe_jusqua = t + c_dernier
            vc = float(np.clip(vc, 0, VMAX)); wc = float(np.clip(wc, -WMAX, WMAX))
        else: sautes += 1
        if robot is not None:
            if calc:
                if planifie and C.get('slip'): vc, wc = vc * gv, wc * gw + bw * (abs(vc) > 0.05)
                s = robot.step(vc if planifie else None, wc, retard_calcul=c_dernier).copy(); v, w = robot.speeds()
            else:
                if C.get('slip'):   # le glissement s'applique en plus, comme une erreur de gain sur les roues
                    vc, wc = vc * gv, wc * gw + bw * (abs(vc) > 0.05)
                s = robot.step(vc, wc).copy(); v, w = robot.speeds()
        else:
            v = v + np.clip(vc - v, -AMAX * DT, AMAX * DT); w = w + np.clip(wc - w, -ALPHA * DT, ALPHA * DT)
            va, wa = v, w
            if perturb: va = v * (1 + rng.normal(0, 0.05)); wa = w + rng.normal(0, 0.05)
            va, wa = va * gv, wa * gw + bw * (abs(va) > 0.05)
            s = s + DT * np.array([va * np.cos(s[2]), va * np.sin(s[2]), wa])
            s[2] = (s[2] + np.pi) % (2 * np.pi) - np.pi
        if BALAYAGE: ob_avant = world.true_obstacles().copy()
        world.step_obstacles(t, robot=s[:2], react=C.get('react', False)); t += DT
        world.t = t
        path.append(s[:2].copy()); vs.append(v); ws.append(w)
        ob = world.true_obstacles()
        if BALAYAGE and len(ob) == len(ob_avant) and len(ob):
            # contrôle entre deux instants (diagnostic, sans effet sur l'issue) : robot et personnes interpolés
            # linéairement sur 10 sous-pas ; un saut de position (personne replacée) est ignoré
            lam = np.linspace(0.1, 0.9, 9)[:, None]
            rp = path[-2][None] + lam * (s[:2] - path[-2])[None]
            ok = np.hypot(*(ob[:, :2] - ob_avant[:, :2]).T) < 1.0
            op = ob_avant[None, ok, :2] + lam[:, :, None] * (ob[None, ok, :2] - ob_avant[None, ok, :2])
            if ok.any():
                cb = (np.hypot(op[..., 0] - rp[:, None, 0], op[..., 1] - rp[:, None, 1]) - ob[ok, 2][None]).min() - R_ROB
                marge_bal = min(marge_bal, float(cb))
        clear = np.min(np.hypot(ob[:, 0] - s[0], ob[:, 1] - s[1]) - ob[:, 2]) - R_ROB if len(ob) else np.inf
        clear = min(clear, s[0] - R_ROB, s[1] - R_ROB, SIZE - R_ROB - s[0], SIZE - R_ROB - s[1])
        minclear = min(minclear, clear)
        if clear < 0: outcome = 'collision'; break
        if np.hypot(*(s[:2] - world.goal)) < 0.5: outcome = 'succes'; break
    path = np.array(path); vs = np.array(vs); ws = np.array(ws)
    length = float(np.sum(np.hypot(*np.diff(path, axis=0).T)))
    acc = np.diff(vs) / DT if len(vs) > 1 else np.zeros(1)
    jerk = float(np.mean(np.abs(np.diff(acc) / DT))) if len(acc) > 1 else 0.0
    v_fin = float(vs[-1]) if len(vs) else 0.0
    res = dict(outcome=outcome, temps=t, longueur=length, marge_min=float(minclear), jerk=jerk,
               collision_a_larret=bool(outcome == 'collision' and abs(v_fin) < 0.1), v_fin=v_fin,
               lissage_w=float(np.mean(np.abs(np.diff(ws)))) if len(ws) > 1 else 0.0,
               calcul_ms=1000 * float(np.mean(comp)), calcul_max_ms=1000 * float(np.max(comp)))
    if BALAYAGE: res['marge_balayee'] = min(marge_bal, float(minclear))
    if calc: res['cycles_sautes'] = sautes
    if record: res['path'] = path
    return res
