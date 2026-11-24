"""Planificateurs comparés : références classiques, références récentes et notre proposition."""
import heapq
import numpy as np
from sim import DT, R_ROB, VMAX, WMAX, AMAX, SIZE

RES = 0.25
NG = int(SIZE / RES)
XS = (np.arange(NG) + 0.5) * RES


# ---------------------------------------------------------------- outils de grille
def occupancy(circles, margin):
    occ = np.zeros((NG, NG), bool)
    gx, gy = np.meshgrid(XS, XS, indexing='ij')
    for x, y, r in circles:
        occ |= (gx - x) ** 2 + (gy - y) ** 2 < (r + margin) ** 2
    m = max(1, int(np.ceil(margin / RES)))
    occ[:m, :] = occ[-m:, :] = occ[:, :m] = occ[:, -m:] = True
    return occ


def cell(p):
    return (int(np.clip(p[0] / RES, 0, NG - 1)), int(np.clip(p[1] / RES, 0, NG - 1)))


NB = [(1, 0, 1), (-1, 0, 1), (0, 1, 1), (0, -1, 1), (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)]


def dijkstra(occ, goal):
    D = np.full((NG, NG), np.inf); g = cell(goal); D[g] = 0; pq = [(0.0, g)]
    while pq:
        d, (i, j) = heapq.heappop(pq)
        if d > D[i, j]: continue
        for di, dj, c in NB:
            a, b = i + di, j + dj
            if 0 <= a < NG and 0 <= b < NG and not occ[a, b] and d + c < D[a, b]:
                D[a, b] = d + c; heapq.heappush(pq, (d + c, (a, b)))
    # cases occupées ou isolées : on prolonge le champ de façon continue au lieu d'une falaise artificielle
    # (les obstacles eux-mêmes sont déjà punis par le coût de collision)
    pq = [(D[i, j], (i, j)) for i, j in zip(*np.nonzero(np.isfinite(D)))]
    heapq.heapify(pq); E = D.copy()
    while pq:
        d, (i, j) = heapq.heappop(pq)
        if d > E[i, j]: continue
        for di, dj, c in NB:
            a, b = i + di, j + dj
            if 0 <= a < NG and 0 <= b < NG and np.isinf(D[a, b]) and d + 2 * c < E[a, b]:
                E[a, b] = d + 2 * c; heapq.heappush(pq, (d + 2 * c, (a, b)))
    E[np.isinf(E)] = np.nanmax(E[np.isfinite(E)]) + 10
    return E * RES


def astar(occ, start, goal, extra=None):
    s, g = cell(start), cell(goal)
    occ = occ.copy(); occ[max(0, s[0] - 1):s[0] + 2, max(0, s[1] - 1):s[1] + 2] = False
    G = {s: 0.0}; prev = {}; pq = [(0.0, s)]; closed = set()
    while pq:
        _, u = heapq.heappop(pq)
        if u in closed: continue
        closed.add(u)
        if u == g: break
        for di, dj, c in NB:
            v = (u[0] + di, u[1] + dj)
            if not (0 <= v[0] < NG and 0 <= v[1] < NG) or occ[v]: continue
            nd = G[u] + c + (extra[v] if extra is not None else 0)
            if nd < G.get(v, np.inf):
                G[v] = nd; prev[v] = u
                heapq.heappush(pq, (nd + np.hypot(v[0] - g[0], v[1] - g[1]), v))
    if g not in closed: return None
    path = [g]
    while path[-1] != s: path.append(prev[path[-1]])
    pts = (np.array(path[::-1], float) + 0.5) * RES
    pts[-1] = goal
    return pts


def lookup(D, x, y):
    i = np.clip((x / RES).astype(int), 0, NG - 1); j = np.clip((y / RES).astype(int), 0, NG - 1)
    return D[i, j]


def rollout(s, U):
    """U : (..., T, 2) -> trajectoires (..., T, 3)."""
    T = U.shape[-2]
    out = np.empty(U.shape[:-1] + (3,))
    x = np.full(U.shape[:-2], s[0]); y = np.full(U.shape[:-2], s[1]); th = np.full(U.shape[:-2], s[2])
    for t in range(T):
        v, w = U[..., t, 0], U[..., t, 1]
        x = x + DT * v * np.cos(th); y = y + DT * v * np.sin(th); th = th + DT * w
        out[..., t, 0] = x; out[..., t, 1] = y; out[..., t, 2] = th
    return out


def predict(obs, T, scen=None):
    """Positions prédites des obstacles (T, M, 2).
    scen = (angle, facteur) : futur alternatif pour les mobiles. Le changement se fait progressivement
    (rotation sur 2 s, changement de vitesse sur 1 s), comme l'éventail d'une prévision d'ensemble
    qui s'ouvre avec le temps."""
    p, v = obs[:, :2], obs[:, 2:4]
    t = (np.arange(1, T + 1) * DT)
    if scen is None or scen == (0.0, 1.0):
        return p[None] + v[None] * t[:, None, None]
    ang, k = scen
    mob = obs[:, 5] > 0
    a = ang * np.minimum(1.0, t / 2.0); f = 1.0 + (k - 1.0) * np.minimum(1.0, t / 1.0)
    c, s_ = np.cos(a)[:, None], np.sin(a)[:, None]
    vx = f[:, None] * (c * v[None, :, 0] - s_ * v[None, :, 1]); vy = f[:, None] * (s_ * v[None, :, 0] + c * v[None, :, 1])
    vx[:, ~mob] = 0; vy[:, ~mob] = 0
    pos = p[None] + DT * np.cumsum(np.stack([vx, vy], -1), 0)
    pos[:, mob] = np.where(np.isfinite(pos[:, mob]), pos[:, mob], 0)
    return pos


def obstacle_cost(traj, P, R):
    """traj (..., T, 3), P (T, M, 2), R (M,) -> coût (...,)."""
    if P.shape[1] == 0: d = np.full(traj.shape[:-1], 10.0)
    else:
        dx = traj[..., :, None, 0] - P[:, :, 0]; dy = traj[..., :, None, 1] - P[:, :, 1]
        d = (np.sqrt(dx * dx + dy * dy) - R - R_ROB).min(-1)
    xw, yw = traj[..., 0], traj[..., 1]
    d = np.minimum(d, np.minimum(np.minimum(xw, yw), np.minimum(SIZE - xw, SIZE - yw)) - R_ROB)
    tw = 0.97 ** np.arange(traj.shape[-2])
    return ((3000.0 * (d < 0) + 60.0 * np.clip(0.6 - d, 0, None) ** 2) * tw).sum(-1)


def first_hit(traj, P, R):
    if P.shape[1] == 0: return np.zeros(traj.shape[:-2], bool)
    dx = traj[..., :, None, 0] - P[:, :, 0]; dy = traj[..., :, None, 1] - P[:, :, 1]
    return ((np.sqrt(dx * dx + dy * dy) - R - R_ROB) < 0).any((-1, -2))


# ---------------------------------------------------------------- 1. A* + poursuite pure
class AStarPursuit:
    name = 'A* + poursuite pure'

    def reset(self, static, goal):
        self.goal = goal; self.static = static; self.path = None; self.k = 0

    def act(self, t, s, obs):
        if self.k % 3 == 0 or self.path is None:
            circ = [(o[0], o[1], o[4] + (0.25 if o[5] else 0)) for o in obs]
            occ = occupancy(circ, R_ROB + 0.1)
            p = astar(occ, s[:2], self.goal)
            if p is not None: self.path = p
        self.k += 1
        if self.path is None: return 0.0, 0.0
        d = np.hypot(self.path[:, 0] - s[0], self.path[:, 1] - s[1])
        i = int(np.argmin(d)); j = i
        while j < len(self.path) - 1 and np.hypot(*(self.path[j] - s[:2])) < 1.0: j += 1
        tgt = self.path[j]
        a = np.arctan2(tgt[1] - s[1], tgt[0] - s[0]) - s[2]; a = np.arctan2(np.sin(a), np.cos(a))
        v = VMAX * max(0.0, np.cos(a)) ** 2
        # arrêt d'urgence si un obstacle est juste devant
        rel = obs[:, :2] - s[:2]; dist = np.hypot(*rel.T) - obs[:, 4] - R_ROB
        ang = np.abs(np.arctan2(np.sin(np.arctan2(rel[:, 1], rel[:, 0]) - s[2]), np.cos(np.arctan2(rel[:, 1], rel[:, 0]) - s[2])))
        if np.any((dist < 0.45) & (ang < 0.8)): v = 0.0
        return v, 2.0 * np.sin(a) * VMAX / 1.0


# ---------------------------------------------------------------- 2. fenêtre dynamique (DWA)
class DWA:
    name = 'DWA'

    def reset(self, static, goal):
        self.goal = goal; self.D = dijkstra(occupancy([tuple(c) for c in static], R_ROB + 0.1), goal); self.v = 0; self.w = 0

    def update_static(self, static):
        self.D = dijkstra(occupancy([tuple(c) for c in static], R_ROB + 0.1), self.goal)

    def act(self, t, s, obs):
        vs = np.linspace(max(0, self.v - AMAX * 0.3), min(VMAX, self.v + AMAX * 0.3), 9)
        ws = np.linspace(max(-WMAX, self.w - 1.2), min(WMAX, self.w + 1.2), 17)
        V, W = np.meshgrid(vs, ws, indexing='ij'); T = 15
        U = np.stack([np.repeat(V[..., None], T, -1), np.repeat(W[..., None], T, -1)], -1)
        tr = rollout(s, U)
        P = predict(obs, T); c = obstacle_cost(tr, P, obs[:, 4])
        c = c + 6.0 * lookup(self.D, tr[..., -1, 0], tr[..., -1, 1]) - 1.0 * V
        i, j = np.unravel_index(np.argmin(c), c.shape)
        self.v, self.w = V[i, j], W[i, j]
        return self.v, self.w


# ---------------------------------------------------------------- 3. MPPI
class MPPI:
    name = 'MPPI'
    T, N, SIG = 25, 256, np.array([0.5, 1.0])

    def reset(self, static, goal):
        self.goal = goal; self.rng = np.random.default_rng(0)
        self.D = dijkstra(occupancy([tuple(c) for c in static], R_ROB + 0.1), goal)
        self.U = np.zeros((self.T, 2)); self.U[:, 0] = 0.5

    def update_static(self, static):
        self.D = dijkstra(occupancy([tuple(c) for c in static], R_ROB + 0.1), self.goal)

    def _roll(self, s, U):
        return rollout(s, U)

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        tr = self._roll(s, U)
        c = obstacle_cost(tr, predict(obs, self.T, scen), obs[:, 4])
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        c = c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)
        if guide is not None:
            gp = guide[None, None] if tr.ndim == 3 else guide[None]
            d = np.sqrt(((tr[..., None, :2] - guide) ** 2).sum(-1)).min(-1)
            c = c + 1.5 * (d ** 2).sum(-1)
        return c

    def mppi_step(self, s, Unom, obs, scen_list=None, guide=None, iters=1):
        for _ in range(iters):
            eps = self.rng.normal(0, 1, (self.N, self.T, 2)) * self.SIG
            U = Unom[None] + eps
            U[0] = Unom; U[1] = 0.0                  # garder la solution actuelle et l'arrêt
            U[..., 0] = np.clip(U[..., 0], 0, VMAX); U[..., 1] = np.clip(U[..., 1], -WMAX, WMAX)
            if scen_list is None: J = self.eval_cost(s, U, obs, guide=guide)
            else: J = np.mean([self.eval_cost(s, U, obs, sc, guide) for sc in scen_list], 0)
            lam = max(1e-6, (np.percentile(J, 10) - J.min()) / 2.0)
            wgt = np.exp(-(J - J.min()) / lam); wgt /= wgt.sum()
            Unom = (wgt[:, None, None] * U).sum(0)
        return Unom

    def act(self, t, s, obs):
        self.U = self.mppi_step(s, self.U, obs)
        u = self.U[0].copy(); self.U = np.roll(self.U, -1, 0); self.U[-1] = self.U[-2]
        return u


# ---------------------------------------------------------------- 4. MPPI multimodal (routes distinctes)
SCENARIOS = [(0.0, 1.0), (np.pi / 2, 1.0), (-np.pi / 2, 1.0), (0.0, 0.0), (0.0, 1.6)]   # tout droit, gauche, droite, arrêt, accélère
SCEN_W = np.array([0.4, 0.15, 0.15, 0.15, 0.15])


def diverse_guides(s, goal, obs, K=3):
    circ = [(o[0], o[1], o[4] + (0.2 if o[5] else 0)) for o in obs]
    occ = occupancy(circ, R_ROB + 0.1)
    guides = []; extra = np.zeros((NG, NG))
    gx, gy = np.meshgrid(XS, XS, indexing='ij')
    for _ in range(K + 2):
        p = astar(occ, s[:2], goal, extra)
        if p is None: break
        if all(np.mean(np.sqrt(((p[:, None] - g[None]) ** 2).sum(-1)).min(1)) > 0.8 for g in guides):
            guides.append(p)
        if len(guides) == K: break
        # pénaliser le voisinage du chemin trouvé pour forcer une autre route
        for q in p[::2]:
            far = np.hypot(q[0] - s[0], q[1] - s[1]) > 1.2 and np.hypot(q[0] - goal[0], q[1] - goal[1]) > 1.2
            if far: extra += 6.0 * np.exp(-((gx - q[0]) ** 2 + (gy - q[1]) ** 2) / (2 * 0.6 ** 2))
    return guides


def guide_to_controls(s, g, T):
    """Commande initiale qui suit grossièrement la route g."""
    U = np.zeros((T, 2)); x = s.copy()
    for t in range(T):
        d = np.hypot(g[:, 0] - x[0], g[:, 1] - x[1]); i = int(np.argmin(d)); j = min(len(g) - 1, i + 4)
        a = np.arctan2(g[j, 1] - x[1], g[j, 0] - x[0]) - x[2]; a = np.arctan2(np.sin(a), np.cos(a))
        U[t] = (VMAX * 0.8 * max(0.1, np.cos(a)), np.clip(2.5 * a, -WMAX, WMAX))
        x = x + DT * np.array([U[t, 0] * np.cos(x[2]), U[t, 0] * np.sin(x[2]), U[t, 1]])
    return U


class MultiModalMPPI(MPPI):
    """Référence récente : un MPPI par route distincte, on exécute le mode de coût minimal."""
    name = 'MPPI multimodal'
    K = 3
    ensemble = False      # prédictions en ensemble (plusieurs futurs possibles)
    option = False        # sélection par valeur d'option
    tau = False           # gouverneur de temps avant contact
    N = 128

    def reset(self, static, goal):
        super().reset(static, goal)
        self.modes = []; self.k = 0; self.cur = 0; self.switches = 0; self.last = None

    def refresh_modes(self, s, obs):
        guides = diverse_guides(s, self.goal, obs, self.K)
        new = []
        for g in guides:
            # garder la commande optimisée du mode existant le plus proche de cette route
            best, bd = None, 1e9
            for m in self.modes:
                d = np.mean(np.sqrt(((m['g'][:, None] - g[None]) ** 2).sum(-1)).min(1))
                if d < bd: best, bd = m, d
            U = best['U'] if best is not None and bd < 1.0 else guide_to_controls(s, g, self.T)
            new.append(dict(g=g, U=U))
        # sans route trouvée (passage bouché), on garde les modes topologiques précédents mais pas les routes
        # horodatées : les sous-classes les recalculent, sinon elles s'empileraient à chaque rafraîchissement
        self.modes = new if new else [m for m in self.modes if not m.get('st')]
        self.empty_refresh = getattr(self, 'empty_refresh', 0) + (not new)

    sample_ensemble = True   # v1 : les échantillons MPPI sont notés sur tous les futurs (trop prudent)

    def scen(self):
        return SCENARIOS if (self.ensemble and self.sample_ensemble) else None

    def act(self, t, s, obs):
        if self.k % 10 == 0 or not self.modes: self.refresh_modes(s, obs)
        self.k += 1
        if not self.modes: return 0.0, 0.0
        for m in self.modes: m['U'] = self.mppi_step(s, m['U'], obs, self.scen(), m['g'])
        Us = np.stack([m['U'] for m in self.modes])
        if self.option and len(self.modes) > 1: i = self.option_choice(s, Us, obs)
        else:
            if self.ensemble: J = np.mean([self.eval_cost(s, Us, obs, sc) for sc in SCENARIOS], 0)
            else: J = self.eval_cost(s, Us, obs)
            i = int(np.argmin(J))
        if self.last is not None and i != self.last: self.switches += 1
        self.last = i
        u = Us[i, 0].copy(); self.chosen_g = self.modes[i]['g']
        if self.tau:
            v0 = u[0]; u[0] = tau_governor(s, u, obs)
            self.tau_hits = getattr(self, 'tau_hits', 0) + (u[0] < v0 - 1e-9)
        for m in self.modes: m['U'] = np.roll(m['U'], -1, 0); m['U'][-1] = m['U'][-2]
        return u

    def option_choice(self, s, Us, obs, P=10):
        """Valeur d'option : on choisit le début de trajectoire qui garde les meilleures suites possibles
        dans chacun des futurs envisagés, au lieu de parier tout de suite sur un seul futur."""
        K = len(Us)
        seq = np.empty((K, K, self.T, 2))
        for i in range(K):
            for k in range(K):
                seq[i, k, :P] = Us[i, :P]; seq[i, k, P:] = Us[k, P:]
        C = np.stack([self.eval_cost(s, seq, obs, sc) for sc in SCENARIOS], -1)   # (K, K, S)
        V = (C.min(1) * SCEN_W).sum(-1)                                            # E_s[min_k]
        i = int(np.argmin(V))
        # hystérésis inspirée de l'accumulation de preuves : on ne change d'avis que si l'écart est net
        if self.last is not None and self.last < K and V[self.last] <= V[i] * 1.05 + 2.0: i = self.last
        return i


def tau_governor(s, u, obs, a_brake=0.6 * AMAX, cone=1.2):
    """Règle du τ̇ (psychologie écologique, D. N. Lee) : on peut encore s'arrêter avant le contact
    tant que la décélération nécessaire c²/2d reste sous la décélération disponible. Sinon on ralentit."""
    v = u[0]
    hd = np.array([np.cos(s[2]), np.sin(s[2])])
    rel = obs[:, :2] - s[:2]; dist = np.hypot(*rel.T); gap = dist - obs[:, 4] - R_ROB
    ang = np.abs(np.arctan2(rel[:, 1] * hd[0] - rel[:, 0] * hd[1], rel @ hd))
    sel = (ang < cone) & (gap < 3.0)
    if not sel.any(): return v
    n = rel[sel] / dist[sel, None]; ov = obs[sel, 2:4]; g = np.maximum(gap[sel], 0.02)
    for _ in range(12):
        closing = (v * hd - ov) @ n.T if n.ndim == 1 else ((v * hd)[None] - ov) * n
        closing = closing.sum(-1)
        need = np.where(closing > 0, closing ** 2 / (2 * g), 0)
        if np.all(need <= a_brake): break
        v *= 0.75
    return v


class MMEnsemble(MultiModalMPPI):
    name = 'MPPI multimodal + ensemble'
    ensemble = True


class MMTau(MultiModalMPPI):
    name = 'MPPI multimodal + gouverneur τ'
    tau = True


class OptionNoTau(MultiModalMPPI):
    name = 'Options topologiques (sans τ)'
    ensemble = True; option = True


class TopoOptionTau(MultiModalMPPI):
    name = 'Options topologiques + τ (proposé)'
    ensemble = True; option = True; tau = True


class OptionV2(MultiModalMPPI):
    name = 'Options topologiques v2 (proposé)'
    ensemble = True; option = True; tau = True; sample_ensemble = False


class OptionV2NoTau(MultiModalMPPI):
    name = 'Options topologiques v2 sans τ'
    ensemble = True; option = True; tau = False; sample_ensemble = False


ALL = [AStarPursuit, DWA, MPPI, MultiModalMPPI, MMEnsemble, MMTau, OptionNoTau, TopoOptionTau, OptionV2, OptionV2NoTau]


# ---------------------------------------------------------------- piste 3 : coût en temps avant collision
def ttc_cost(traj, obs, T, k=1.5, tau0=3.0):
    """Loi de puissance des interactions piétonnes (Karamouzas, Skinner, Guy 2014) :
    E = k / τ² · exp(−τ/τ0), où τ est le temps avant collision si chacun garde sa vitesse.
    Un obstacle proche qui s'éloigne ne coûte rien, un obstacle lointain qui fonce droit sur nous coûte cher."""
    mob = obs[:, 5] > 0
    if not mob.any(): return 0.0
    o = obs[mob]
    P = o[None, :, :2] + o[None, :, 2:4] * (np.arange(1, T + 1) * DT)[:, None, None]   # (T, M, 2)
    xy = traj[..., :2]
    vel = np.diff(xy, axis=-2, prepend=xy[..., :1, :]) / DT
    vel[..., 0, :] = vel[..., 1, :]
    p = xy[..., :, None, :] - P                                  # (..., T, M, 2)
    v = vel[..., :, None, :] - o[None, :, 2:4]
    rr = o[:, 4] + R_ROB
    a = (v * v).sum(-1); b = (p * v).sum(-1); c = (p * p).sum(-1) - rr ** 2
    disc = b * b - a * c
    tau = np.where((b < 0) & (disc > 0) & (a > 1e-6), (-b - np.sqrt(np.maximum(disc, 0))) / np.maximum(a, 1e-6), np.inf)
    tau = np.where(c < 0, 0.05, tau)
    tau = np.clip(tau, 0.05, None)
    E = np.where(np.isfinite(tau), k / tau ** 2 * np.exp(-tau / tau0), 0.0)
    tw = 0.97 ** np.arange(T)
    return (E.sum(-1) * tw).sum(-1)


class TTCMixin:
    def eval_cost(self, s, U, obs, scen=None, guide=None):
        c = super().eval_cost(s, U, obs, scen, guide)
        if scen is None or scen == (0.0, 1.0):
            c = c + 25.0 * ttc_cost(rollout(s, U), obs, self.T)
        return c


class MPPITTC(TTCMixin, MPPI):
    name = 'MPPI + coût τ (Karamouzas)'


class MMTTC(TTCMixin, MultiModalMPPI):
    name = 'MPPI multimodal + coût τ'


class OptionV3(TTCMixin, MultiModalMPPI):
    name = 'Options topologiques v3 (+ coût τ)'
    ensemble = True; option = True; tau = True; sample_ensemble = False


ALL += [MPPITTC, MMTTC, OptionV3]


def reach_governor(s, u, obs, a_brake=0.8 * AMAX, k_obs=1.3, cone=1.0, margin=0.15):
    """Garde d'atteignabilité : le robot doit pouvoir s'arrêter avant que l'obstacle,
    en accélérant un peu (facteur k_obs), puisse atteindre le point où il s'arrêtera.
    On ne regarde que devant le robot : se faire percuter à l'arrêt n'est pas de son fait."""
    v = u[0]
    hd = np.array([np.cos(s[2]), np.sin(s[2])])
    rel = obs[:, :2] - s[:2]; dist = np.hypot(*rel.T); gap = dist - obs[:, 4] - R_ROB
    ang = np.abs(np.arctan2(rel[:, 1] * hd[0] - rel[:, 0] * hd[1], rel @ hd))
    sel = (obs[:, 5] > 0) & (ang < cone) & (gap < 4.0)
    if not sel.any(): return v
    vo = k_obs * np.hypot(obs[sel, 2], obs[sel, 3]); g = gap[sel]
    for _ in range(15):
        ts = v / a_brake
        need = v * v / (2 * a_brake) + vo * ts + margin
        if np.all(need <= g): break
        v *= 0.8
    return v


class ReachMixin:
    def act(self, t, s, obs):
        u = np.array(super().act(t, s, obs), float)
        v0 = u[0]; u[0] = reach_governor(s, u, obs)
        self.reach_hits = getattr(self, 'reach_hits', 0) + (u[0] < v0 - 1e-9)
        return u


class MPPIReach(ReachMixin, MPPI):
    name = 'MPPI + garde d\'atteignabilité'


class MPPITTCReach(ReachMixin, TTCMixin, MPPI):
    name = 'MPPI + coût τ + garde'


ALL += [MPPIReach, MPPITTCReach]


class OracleMPPI(MPPI):
    """Borne haute : MPPI qui connaît le futur exact des obstacles (impossible en vrai)."""
    name = 'Oracle (MPPI qui connaît le futur)'

    def bind(self, world): self.world = world

    def future(self, obs, s=None):
        """Vrai futur des agents. Ceux qui réagissent au robot (poursuivants, agents réactifs) sont
        simulés face à la trajectoire que le robot prévoit de suivre (son plan actuel) : exact si le robot
        suit son plan, approché sinon."""
        import copy
        w = copy.deepcopy(self.world); t = getattr(w, 't', 0.0)
        path = rollout(s, self.U)[:, :2] if s is not None else None
        react = getattr(self.world, 'react', False)
        P = []
        for k in range(self.T):
            w.step_obstacles(t, robot=None if path is None else path[k], react=react); t += DT
            P.append(w.true_obstacles()[:, :2])
        return np.array(P)

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        tr = rollout(s, U)
        R = self.world.true_obstacles()[:, 2]
        c = obstacle_cost(tr, self._P, R)
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        return c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)

    def act(self, t, s, obs):
        self._P = self.future(obs, s)
        self.U = self.mppi_step(s, self.U, obs, iters=2)
        u = self.U[0].copy(); self.U = np.roll(self.U, -1, 0); self.U[-1] = self.U[-2]
        return u


ALL += [OracleMPPI]


# ---------------------------------------------------------------- piste 4 : feux d'alignement (navigation maritime)
def clearance_field(static):
    """Distance de chaque case au bord d'obstacle fixe le plus proche (en m)."""
    occ = occupancy([tuple(c) for c in static], 0.0)
    D = np.full((NG, NG), np.inf); pq = []
    for i, j in zip(*np.nonzero(occ)): D[i, j] = 0; pq.append((0.0, (i, j)))
    heapq.heapify(pq)
    while pq:
        d, (i, j) = heapq.heappop(pq)
        if d > D[i, j]: continue
        for di, dj, c in NB:
            a, b = i + di, j + dj
            if 0 <= a < NG and 0 <= b < NG and d + c < D[a, b]:
                D[a, b] = d + c; heapq.heappush(pq, (d + c, (a, b)))
    return D * RES


def find_channels(path, Cl, thresh=1.3):
    """Goulets le long du chemin global : minima locaux de la distance aux obstacles.
    Pour chacun, l'axe du chenal (direction du chemin à cet endroit), comme les feux d'alignement d'un port."""
    c = lookup(Cl, path[:, 0], path[:, 1])
    out = []
    for i in range(2, len(path) - 2):
        if c[i] < thresh and c[i] <= c[i - 2:i + 3].min() + 1e-9:
            a, b = path[max(0, i - 4)], path[min(len(path) - 1, i + 4)]
            ax = (b - a) / (np.linalg.norm(b - a) + 1e-9)
            if not out or np.linalg.norm(path[i] - out[-1][0]) > 1.5: out.append((path[i].copy(), ax, c[i]))
    return out


class HarborMPPI(MPPI):
    """MPPI + feux d'alignement + attention : avant un goulet, on se place dans l'axe du chenal ;
    près des obstacles, on resserre l'exploration des échantillons."""
    name = 'MPPI + feux d\'alignement'
    align = True; attention = True

    def reset(self, static, goal):
        super().reset(static, goal)
        self.Cl = clearance_field(static)
        occ = occupancy([tuple(c) for c in static], R_ROB + 0.1)
        self.chan = []; self.started = False
        self.static = static

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        c = super().eval_cost(s, U, obs, scen, guide)
        if self.align and self.chan:
            tr = rollout(s, U)[..., :2]
            for p0, ax, w in self.chan:
                rel = tr - p0; along = rel @ ax; lat = rel[..., 0] * ax[1] - rel[..., 1] * ax[0]
                zone = (along > -2.5) & (along < 0.8)
                c = c + (4.0 * zone * lat ** 2).sum(-1)
        return c

    def act(self, t, s, obs):
        if not self.started:
            occ = occupancy([tuple(c) for c in self.static], R_ROB + 0.1)
            p = astar(occ, s[:2], self.goal)
            self.chan = find_channels(p, self.Cl) if p is not None else []
            self.started = True
        if self.attention:
            cl = float(lookup(self.Cl, np.array([s[0]]), np.array([s[1]]))[0]) - R_ROB
            k = np.clip(cl / 0.8, 0.35, 1.0)
            self.SIG = np.array([0.5, 1.0]) * k
        return super().act(t, s, obs)


class AttentionMPPI(HarborMPPI):
    name = 'MPPI + attention seule'
    align = False


class AlignMPPI(HarborMPPI):
    name = 'MPPI + alignement seul'
    attention = False


ALL += [HarborMPPI, AttentionMPPI, AlignMPPI]



# ---------------------------------------------------------------- mémoire de carte (identique pour tous)
class Memory:
    """Enveloppe commune : retient les obstacles fixes déjà vus (carte construite en roulant)
    et les rend au planificateur, même quand ils sortent du champ des capteurs."""
    def __init__(self, P):
        self.p = P(); self.name = P.name

    def __getattr__(self, k):
        return getattr(self.__dict__['p'], k)

    def reset(self, static, goal):
        self.known = {}
        for i, (x, y, r) in enumerate(static): self.known[(round(x, 1), round(y, 1))] = (x, y, 0, 0, r, 0, i)
        self.dirty = 0; self.k = 0
        self.p.reset(np.array([v[:2] + (v[4],) for v in self.known.values()], float).reshape(-1, 3), goal)

    def act(self, t, s, obs):
        self.k += 1
        for o in obs[obs[:, 5] == 0]:
            key = (round(o[0], 1), round(o[1], 1))
            if key not in self.known: self.known[key] = tuple(o[:4]) + (o[4], 0, o[6] if len(o) > 6 else 0); self.dirty += 1
        if self.dirty and self.k % 5 == 0 and hasattr(self.p, 'update_static'):
            self.p.update_static(np.array([(v[0], v[1], v[4]) for v in self.known.values()], float).reshape(-1, 3)); self.dirty = 0
        st = np.array(list(self.known.values()), float).reshape(-1, 7)
        dyn = obs[obs[:, 5] > 0]
        if dyn.shape[1] < 7: dyn = np.hstack([dyn, np.zeros((len(dyn), 7 - dyn.shape[1]))])
        return self.p.act(t, s, np.vstack([st, dyn]))


# =====================================================================================
# VIGIE : notre proposition
#   V : Valeur d'option, on choisit le début de trajectoire qui garde les meilleures suites possibles
#   I : Imprévisibilité mesurée en ligne pour chaque agent (comme on vérifie une prévision météo)
#   G : Gestes réflexes (freiner, esquiver) mis en concurrence avec les plans
#   I : Inertie d'engagement, pour ne pas hésiter entre deux routes
#   E : Ensemble de routes qui contient toujours le MPPI de base
# =====================================================================================
from collections import deque


class SurpriseTracker:
    """Pour chaque agent mobile : erreur entre où on l'attendait (vitesse constante, 1 s plus tôt)
    et où il est vraiment. Lissée dans le temps, elle donne un indice d'imprévisibilité entre 0 et 1.
    On ne compare que des mesures séparées d'environ une seconde : un agent qui disparaît
    puis réapparaît ne doit pas paraître imprévisible pour autant."""
    def __init__(self, horizon=1.0, default=0.3, mesures_seules=False):
        self.h = {}; self.e = {}; self.H = horizon; self.default = default; self.mesures_seules = mesures_seules

    def update(self, obs, t):
        for o in obs[obs[:, 5] > 0]:
            # une piste prolongée par le filtre (colonne « mobile » à 2) n'est pas une mesure : la comparer à sa propre
            # extrapolation ferait croire que la personne devient prévisible pendant qu'on ne la voit plus
            if self.mesures_seules and o[5] == 2: continue
            i = int(o[6]); q = self.h.setdefault(i, deque(maxlen=40)); q.append((t, o[:4].copy()))
            while q and t - q[0][0] > self.H + 0.15: q.popleft()
            t0, old = q[0]
            if abs((t - t0) - self.H) <= 0.15:
                pred = old[:2] + old[2:4] * (t - t0)
                err = np.hypot(*(o[:2] - pred))
                self.e[i] = 0.85 * self.e.get(i, err) + 0.15 * err

    def u(self, obs):
        out = np.zeros(len(obs))
        for k, o in enumerate(obs):
            if o[5] > 0:
                i = int(o[6])
                out[k] = np.clip((self.e[i] - 0.08) / 0.45, 0, 1) if i in self.e else self.default
        return out


def predict_u(obs, T, scen, u):
    """Futur d'un scénario, dont l'écart à la vitesse constante est proportionnel à l'imprévisibilité de chaque agent."""
    p, v = obs[:, :2], obs[:, 2:4]
    t = np.arange(1, T + 1) * DT
    mob = obs[:, 5] > 0
    ang, k = scen
    a = (ang * u)[None, :] * np.minimum(1.0, t / 2.0)[:, None]
    f = 1.0 + ((k - 1.0) * u)[None, :] * np.minimum(1.0, t / 1.0)[:, None]
    c, s_ = np.cos(a), np.sin(a)
    vx = f * (c * v[None, :, 0] - s_ * v[None, :, 1]); vy = f * (s_ * v[None, :, 0] + c * v[None, :, 1])
    vx[:, ~mob] = 0; vy[:, ~mob] = 0
    return p[None] + DT * np.cumsum(np.stack([vx, vy], -1), 0)


def obstacle_cost_tube(traj, P, Rt):
    """Comme obstacle_cost, mais avec un rayon qui dépend du temps (T, M) : le tube d'incertitude s'ouvre."""
    if P.shape[1] == 0: d = np.full(traj.shape[:-1], 10.0)
    else:
        dx = traj[..., :, None, 0] - P[:, :, 0]; dy = traj[..., :, None, 1] - P[:, :, 1]
        d = (np.sqrt(dx * dx + dy * dy) - Rt - R_ROB).min(-1)
    xw, yw = traj[..., 0], traj[..., 1]
    d = np.minimum(d, np.minimum(np.minimum(xw, yw), np.minimum(SIZE - xw, SIZE - yw)) - R_ROB)
    tw = 0.97 ** np.arange(traj.shape[-2])
    return ((3000.0 * (d < 0) + 60.0 * np.clip(0.6 - d, 0, None) ** 2) * tw).sum(-1)


class Vigie(MPPI):
    name = 'VIGIE (proposé)'
    K = 3; N = 128; P = 8
    use_option = True; use_surprise = True; use_reflex = True; use_inertia = True; use_tube = False; use_permanence = False
    GHOST_T = 1.5

    def reset(self, static, goal):
        super().reset(static, goal)
        self.tr = SurpriseTracker(); self.modes = []; self.k = 0; self.commit = 0; self.switches = 0
        self.seen = {}; self.t = 0.0
        self.vlast = 0.0; self.wlast = 0.0; self.reflex_n = 0; self._u = None

    # coût d'échantillonnage : vitesse constante, tube élargi selon l'imprévisibilité
    def sample_cost(self, s, U, obs, guide):
        tr = rollout(s, U)
        P = predict(obs, self.T)
        R = obs[:, 4][None, :] + (0.35 * self._u[None, :] * np.minimum(np.arange(1, self.T + 1) * DT, 2.0)[:, None] if self.use_tube else 0)
        c = obstacle_cost_tube(tr, P, np.broadcast_to(R, P.shape[:2]))
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        c = c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)
        if guide is not None:
            d = np.sqrt(((tr[..., None, :2] - guide) ** 2).sum(-1)).min(-1)
            c = c + 1.5 * (d ** 2).sum(-1)
        return c

    def optimize(self, s, Unom, obs, guide):
        eps = self.rng.normal(0, 1, (self.N, self.T, 2)) * self.SIG
        U = Unom[None] + eps; U[0] = Unom; U[1] = 0.0
        U[..., 0] = np.clip(U[..., 0], 0, VMAX); U[..., 1] = np.clip(U[..., 1], -WMAX, WMAX)
        J = self.sample_cost(s, U, obs, guide)
        lam = max(1e-6, (np.percentile(J, 10) - J.min()) / 2.0)
        w = np.exp(-(J - J.min()) / lam); w /= w.sum()
        return (w[:, None, None] * U).sum(0)

    # coût d'évaluation commun à toutes les options, dans un futur donné
    def eval_scen(self, s, U, obs, scen):
        tr = rollout(s, U)
        P = predict_u(obs, self.T, scen, self._u) if self.use_surprise else predict(obs, self.T, scen)
        c = obstacle_cost(tr, P, obs[:, 4])
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        return c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)

    def option_values(self, s, seq, obs):
        C = np.stack([self.eval_scen(s, seq, obs, sc) for sc in SCENARIOS], -1)   # (options, suites, futurs)
        return (C.min(1) * SCEN_W).sum(-1)

    def refresh(self, s, obs):
        guides = diverse_guides(s, self.goal, obs, self.K - 1 + 1)
        old = self.modes[1:] if self.modes else []
        base = self.modes[0] if self.modes else dict(g=None, U=self.U.copy())
        new = [base]
        cg = self.modes[self.commit]['g'] if self.modes and self.commit > 0 else None
        newcommit = 0
        for g in guides[:self.K - 1]:
            best, bd = None, 1e9
            for m in old:
                d = np.mean(np.sqrt(((m['g'][:, None] - g[None]) ** 2).sum(-1)).min(1))
                if d < bd: best, bd = m, d
            new.append(dict(g=g, U=best['U'] if best is not None and bd < 1.0 else guide_to_controls(s, g, self.T)))
            if cg is not None:
                d = np.mean(np.sqrt(((cg[:, None] - g[None]) ** 2).sum(-1)).min(1))
                if d < 1.0: newcommit = len(new) - 1
        self.modes = new; self.commit = newcommit

    def update_static(self, static):
        super().update_static(static)
        self.commit = 0; self.k = 0          # la carte a changé : on revient au plan de base et on recalcule les routes

    def permanence(self, t, obs):
        """Permanence de l'objet : un agent qui sort du champ (masqué, non détecté) reste en mémoire
        pendant GHOST_T secondes, prolongé à vitesse constante, avec une imprévisibilité qui grandit."""
        mob = obs[obs[:, 5] > 0]
        for o in mob: self.seen[int(o[6])] = (o.copy(), t)
        ghosts, gu = [], []
        ids = set(int(o[6]) for o in mob)
        for i, (o, t0) in list(self.seen.items()):
            dt = t - t0
            if i in ids: continue
            if dt > self.GHOST_T: del self.seen[i]; continue
            g = o.copy(); g[:2] = o[:2] + o[2:4] * dt; ghosts.append(g); gu.append(min(1.0, 0.3 + 0.7 * dt / self.GHOST_T))
        return (np.vstack([obs] + ghosts) if ghosts else obs), np.array(gu)

    def act(self, t, s, obs):
        self.tr.update(obs, t)
        gu = np.zeros(0)
        if self.use_permanence: obs, gu = self.permanence(t, obs)
        self._u = self.tr.u(obs) if self.use_surprise else np.where(obs[:, 5] > 0, 0.5, 0.0)
        if len(gu): self._u[-len(gu):] = np.maximum(self._u[-len(gu):], gu) if self.use_surprise else gu
        if self.k % 10 == 0 or not self.modes: self.refresh(s, obs)
        self.k += 1
        for m in self.modes: m['U'] = self.optimize(s, m['U'], obs, m['g'])
        Us = np.stack([m['U'] for m in self.modes]); K = len(Us); P = self.P

        # options : début de chaque plan, plus les gestes réflexes
        pref = [Us[i, :P] for i in range(K)]
        kinds = list(range(K))
        if self.use_reflex:
            v0 = self.vlast
            pref += [np.tile([0.0, self.wlast], (P, 1)), np.tile([0.6 * v0, 1.6], (P, 1)), np.tile([0.6 * v0, -1.6], (P, 1))]
            kinds += [-1, -2, -3]
        nO = len(pref)
        if self.use_option:
            seq = np.empty((nO, K, self.T, 2))
            for i in range(nO):
                for k in range(K): seq[i, k, :P] = pref[i]; seq[i, k, P:] = Us[k, P:]
            V = self.option_values(s, seq, obs)
        else:
            seq = np.stack([np.concatenate([pr, Us[0, P:]]) for pr in pref])
            V = self.eval_scen(s, seq, obs, (0.0, 1.0))
        if self.use_reflex:
            # un réflexe n'est permis que si tous les plans sont menacés (risque de collision attendu > 25 %)
            plan_best = V[:K].min()
            if plan_best < 0.25 * 3000.0: V[K:] = np.inf
        if self.use_inertia:
            for i, kd in enumerate(kinds):
                if kd >= 0 and kd != self.commit: V[i] += 0.04 * abs(V[self.commit]) + 2.0
        i = int(np.argmin(V)); kd = kinds[i]
        if kd >= 0:
            if kd != self.commit: self.switches += 1
            self.commit = kd
        else: self.reflex_n += 1
        u = pref[i][0].copy()
        for m in self.modes: m['U'] = np.roll(m['U'], -1, 0); m['U'][-1] = m['U'][-2]
        self.U = self.modes[0]['U']
        self.vlast, self.wlast = float(np.clip(u[0], 0, VMAX)), float(u[1])
        return u


class VigieNoOption(Vigie):
    name = 'VIGIE sans valeur d\'option'; use_option = False


class VigieNoSurprise(Vigie):
    name = 'VIGIE sans mesure d\'imprévisibilité'; use_surprise = False


class VigieNoReflex(Vigie):
    name = 'VIGIE sans gestes réflexes'; use_reflex = False


class VigieNoInertia(Vigie):
    name = 'VIGIE sans inertie d\'engagement'; use_inertia = False


class VigieNoPermanence(Vigie):
    name = 'VIGIE avec permanence de l\'objet'; use_permanence = True


class VigieNoTube(Vigie):
    name = 'VIGIE avec tube calibré (écarté)'; use_tube = True


ALL += [Vigie, VigieNoOption, VigieNoSurprise, VigieNoReflex, VigieNoInertia, VigieNoTube, VigieNoPermanence]


class Vigie4(Vigie):
    name = 'VIGIE à 4 routes'; K = 4; N = 96




ALL += [Vigie4]


# ---------------------------------------------------------------- anticipation du retard (prédicteur de Smith)
class SmithMixin:
    """Prédicteur de Smith (O. J. M. Smith, 1957, commande des procédés chimiques) : quand les mesures
    arrivent avec un retard connu, on rejoue les commandes déjà envoyées pendant ce retard pour estimer
    l'état présent du robot, et on avance les agents d'autant."""
    lat = 0

    def set_latency(self, L):
        self.lat = int(L); self._cmds = deque(maxlen=max(1, self.lat)); self._v = 0.0; self._w = 0.0

    def act(self, t, s, obs):
        if self.lat <= 0: return super().act(t, s, obs)
        x = np.array(s, float); v, w = self._v_hist if hasattr(self, '_v_hist') else (0.0, 0.0)
        # état des vitesses au moment de la mesure : celles d'il y a « lat » pas
        vs = list(self._cmds)
        vv, ww = self._vw_at_meas if hasattr(self, '_vw_at_meas') else (0.0, 0.0)
        for vc, wc in vs:
            vv = vv + np.clip(vc - vv, -AMAX * DT, AMAX * DT); ww = ww + np.clip(wc - ww, -4.0 * DT, 4.0 * DT)
            x = x + DT * np.array([vv * np.cos(x[2]), vv * np.sin(x[2]), ww])
        o = obs.copy(); mob = o[:, 5] > 0
        o[mob, :2] += o[mob, 2:4] * len(vs) * DT
        u = super().act(t + len(vs) * DT, x, o)
        # mémoriser la commande, et la vitesse réelle estimée au moment de la prochaine mesure
        if len(self._cmds) == self._cmds.maxlen and vs:
            vc, wc = vs[0]; v0, w0 = self._vw_at_meas if hasattr(self, '_vw_at_meas') else (0.0, 0.0)
            self._vw_at_meas = (v0 + np.clip(vc - v0, -AMAX * DT, AMAX * DT), w0 + np.clip(wc - w0, -4.0 * DT, 4.0 * DT))
        self._cmds.append((float(np.clip(u[0], 0, VMAX)), float(np.clip(u[1], -WMAX, WMAX))))
        return u


class VigieV2(SmithMixin, Vigie):
    """VIGIE 2 : quatre routes (plan de base + trois routes distinctes, même budget de calcul que le MPPI multimodal),
    anticipation du retard des mesures, réensemencement des plans et arcs de virage injectés dans les tirages."""
    name = 'VIGIE 2 (proposé)'; K = 4; N = 96
    ARCS = np.array([[0.8, w] for w in np.linspace(-1.6, 1.6, 7)] + [[0.3, -2.0], [0.3, 2.0]])

    use_arcs = True; use_reseed = True

    def optimize(self, s, Unom, obs, guide):
        if not self.use_arcs: return Vigie.optimize(self, s, Unom, obs, guide)
        eps = self.rng.normal(0, 1, (self.N, self.T, 2)) * self.SIG
        U = Unom[None] + eps; U[0] = Unom; U[1] = 0.0
        na = len(self.ARCS)
        U[2:2 + na] = self.ARCS[:, None, :]          # arcs francs : tourner vraiment, pas seulement trembler
        U[..., 0] = np.clip(U[..., 0], 0, VMAX); U[..., 1] = np.clip(U[..., 1], -WMAX, WMAX)
        J = self.sample_cost(s, U, obs, guide)
        lam = max(1e-6, (np.percentile(J, 10) - J.min()) / 2.0)
        w = np.exp(-(J - J.min()) / lam); w /= w.sum()
        return (w[:, None, None] * U).sum(0)

    def refresh(self, s, obs):
        super().refresh(s, obs)
        if not self.use_reseed: return
        # réensemencement : pour chaque route, plan hérité ou plan neuf tracé vers la route, on garde le meilleur
        for m in self.modes[1:]:
            fresh = guide_to_controls(s, m['g'], self.T)
            J = self.sample_cost(s, np.stack([m['U'], fresh]), obs, m['g'])
            if J[1] < J[0]: m['U'] = fresh


class MMSmith(SmithMixin, MultiModalMPPI):
    name = 'MPPI multimodal + prédicteur de Smith'


ALL += [VigieV2, MMSmith]


class V2NoArcs(VigieV2):
    name = 'VIGIE 2 sans arcs de virage'; use_arcs = False


class V2NoReseed(VigieV2):
    name = 'VIGIE 2 sans réensemencement'; use_reseed = False


class V2NoSmith(VigieV2):
    name = 'VIGIE 2 sans prédicteur de Smith'
    def set_latency(self, L): SmithMixin.set_latency(self, 0)


ALL += [V2NoArcs, V2NoReseed, V2NoSmith]


# =====================================================================================
# Séance 4 : planification espace-temps et fantômes d'angle mort
# =====================================================================================
ST_RES, ST_DT, ST_K = 0.5, 0.5, 20          # grille de 0,5 m, pas de 0,5 s, horizon de 10 s
ST_N = int(SIZE / ST_RES)
ST_MOVES = [(0, 0, 0.3)] + [(di, dj, np.hypot(di, dj)) for di in (-1, 0, 1) for dj in (-1, 0, 1) if di or dj]


def spacetime_plan(s, goal, obs, D, unc=0.12):
    """A* dans l'espace-temps (x, y, t) : chaque couche de temps a sa propre carte d'occupation,
    construite avec la position prédite de chaque agent. Le plan peut attendre sur place,
    pour laisser passer un flux puis se glisser dans un trou."""
    xs = (np.arange(ST_N) + 0.5) * ST_RES
    gx, gy = np.meshgrid(xs, xs, indexing='ij')
    stat = np.zeros((ST_N, ST_N), bool)
    for o in obs[obs[:, 5] == 0]:
        stat |= (gx - o[0]) ** 2 + (gy - o[1]) ** 2 < (o[4] + R_ROB + 0.1) ** 2
    stat[0, :] = stat[-1, :] = stat[:, 0] = stat[:, -1] = True
    mob = obs[obs[:, 5] > 0]
    occ = np.empty((ST_K + 1, ST_N, ST_N), bool)
    for k in range(ST_K + 1):
        t = k * ST_DT; o = stat.copy()
        for a in mob:
            px, py = a[0] + a[2] * t, a[1] + a[3] * t; rr = a[4] + R_ROB + 0.15 + unc * t
            o |= (gx - px) ** 2 + (gy - py) ** 2 < rr * rr
        occ[k] = o
    cell = lambda p: (min(ST_N - 1, max(0, int(p[0] / ST_RES))), min(ST_N - 1, max(0, int(p[1] / ST_RES))))
    si, sj = cell(s); gi, gj = cell(goal)
    Dst = lookup(D, gx, gy) / (ST_RES * 1.0)   # coût restant estimé, en pas de grille
    start = (si, sj, 0); G = {start: 0.0}; prev = {}; pq = [(Dst[si, sj], start)]
    best, bestc = None, np.inf; closed = set(); n = 0
    while pq and n < 60000:
        f, u = heapq.heappop(pq)
        if u in closed: continue
        closed.add(u); n += 1
        i, j, k = u
        if (i, j) == (gi, gj) or k == ST_K:
            c = G[u] + (0 if (i, j) == (gi, gj) else Dst[i, j])
            if c < bestc: bestc, best = c, u
            if (i, j) == (gi, gj): break
            continue
        for di, dj, c in ST_MOVES:
            a, b = i + di, j + dj
            if not (0 <= a < ST_N and 0 <= b < ST_N) or occ[k + 1, a, b]: continue
            if k == 0 and occ[0, a, b] and (a, b) != (si, sj): continue
            v = (a, b, k + 1); nd = G[u] + c + 0.15   # chaque pas de temps coûte un peu : ne pas traîner
            if nd < G.get(v, np.inf):
                G[v] = nd; prev[v] = u; heapq.heappush(pq, (nd + Dst[a, b], v))
    if best is None: return None
    path = [best]
    while path[-1] in prev: path.append(prev[path[-1]])
    path = path[::-1]
    pts = np.array([[(i + 0.5) * ST_RES, (j + 0.5) * ST_RES] for i, j, k in path]); pts[0] = s[:2]
    # positions au pas de la commande (0,1 s), interpolées
    tq = np.arange(1, int(len(pts) * ST_DT / DT) + 1) * DT
    tk = np.arange(len(pts)) * ST_DT
    return np.stack([np.interp(tq, tk, pts[:, 0]), np.interp(tq, tk, pts[:, 1])], 1)


def timed_controls(s, gt, T):
    """Commande initiale qui suit une trajectoire horodatée (position voulue à chaque instant)."""
    U = np.zeros((T, 2)); x = s.copy()
    for t in range(T):
        q = gt[min(len(gt) - 1, t + 3)]
        d = np.hypot(q[0] - x[0], q[1] - x[1])
        a = np.arctan2(q[1] - x[1], q[0] - x[0]) - x[2]; a = np.arctan2(np.sin(a), np.cos(a))
        U[t] = (np.clip(d / 0.4, 0, VMAX) * max(0.0, np.cos(a)), np.clip(2.5 * a, -WMAX, WMAX))
        x = x + DT * np.array([U[t, 0] * np.cos(x[2]), U[t, 0] * np.sin(x[2]), U[t, 1]])
    return U


def phantoms(s, obs, rng_=5.0, speed=1.5):
    """Fantômes d'angle mort : derrière chaque bord d'obstacle qui cache une zone libre,
    on imagine une personne qui pourrait surgir en coupant la ligne de vue."""
    st = obs[obs[:, 5] == 0]
    if not len(st): return np.zeros((0, obs.shape[1]))
    rel = st[:, :2] - s[:2]; d = np.hypot(*rel.T)
    hd = np.array([np.cos(s[2]), np.sin(s[2])])
    out = []
    for k in np.nonzero((d < rng_ + 1.5) & (d > st[:, 4] + 0.2))[0]:
        c, r = st[k, :2], st[k, 4]
        if (rel[k] @ hd) / d[k] < -0.2: continue           # obstacles derrière le robot : inutile
        base = np.arctan2(rel[k, 1], rel[k, 0]); half = np.arcsin(min(1.0, r / d[k]))
        for sg in (-1, 1):
            a = base + sg * (half + 0.02); L = np.sqrt(max(d[k] ** 2 - r ** 2, 0))
            E = s[:2] + L * np.array([np.cos(a), np.sin(a)])        # bord vu par le robot
            nrm = E - c; nrm /= np.linalg.norm(nrm) + 1e-9
            away = (E - s[:2]) / (np.linalg.norm(E - s[:2]) + 1e-9)
            P = E + 1.0 * away - 0.25 * nrm                            # caché dans l'ombre, juste derrière le bord
            if np.any(np.hypot(st[:, 0] - P[0], st[:, 1] - P[1]) < st[:, 4] + 0.35): continue
            if not (0.5 < P[0] < SIZE - 0.5 and 0.5 < P[1] < SIZE - 0.5): continue
            # le bord n'est utile que s'il est lui-même visible (pas au milieu d'un mur)
            seg = E - s[:2]; Ls = np.linalg.norm(seg); u_ = seg / (Ls + 1e-9)
            pr = rel @ u_; perp = np.abs(rel[:, 0] * u_[1] - rel[:, 1] * u_[0])
            blocked = (pr > 0) & (pr < Ls - 0.05) & (perp < st[:, 4] - 0.05); blocked[k] = False
            if blocked.any(): continue
            # le fantôme doit être réellement caché (sinon les capteurs le verraient)
            relP = P - s[:2]; LP = np.linalg.norm(relP); uP = relP / (LP + 1e-9)
            prP = rel @ uP; perpP = np.abs(rel[:, 0] * uP[1] - rel[:, 1] * uP[0])
            if not np.any((prP > 0) & (prP < LP) & (perpP < st[:, 4])): continue
            v = np.array([-u_[1], u_[0]]) * sg * speed     # surgit en travers de la ligne de vue
            if (v @ (s[:2] - P)) < 0: v = -v
            row = np.zeros(obs.shape[1]); row[:2] = P; row[2:4] = v; row[4] = 0.35; row[5] = 1; row[6] = -1 - len(out)
            out.append((Ls, row))
    out.sort(key=lambda x: x[0])
    return np.array([r for _, r in out[:6]]).reshape(-1, obs.shape[1])


def phantom_speed(s, ph, a=0.8 * AMAX, cone=1.3, margin=0.25):
    """Vitesse prudente : pouvoir s'arrêter avant qu'une personne surgissant d'un angle mort
    (à la vitesse du fantôme) n'atteigne le robot. v²/2a + v_f·v/a ≤ d  ⇒  v = −v_f + √(v_f² + 2ad)."""
    if not len(ph): return VMAX
    hd = np.array([np.cos(s[2]), np.sin(s[2])])
    rel = ph[:, :2] - s[:2]; d = np.hypot(*rel.T) - ph[:, 4] - R_ROB - margin
    ang = np.abs(np.arctan2(rel[:, 1] * hd[0] - rel[:, 0] * hd[1], rel @ hd))
    sel = ang < cone
    if not sel.any(): return VMAX
    vf = np.hypot(ph[sel, 2], ph[sel, 3]); dd = np.maximum(d[sel], 0.0)
    return float(np.clip((-vf + np.sqrt(vf ** 2 + 2 * a * dd)).min(), 0.15, VMAX))


class VigieST(VigieV2):
    """VIGIE-ST : VIGIE 2 + une route espace-temps (qui peut attendre) + fantômes d'angle mort."""
    name = 'VIGIE-ST (proposé)'
    use_st = True; use_phantom = True
    occl = False

    def set_perception(self, occl, rng_):
        self.occl = bool(occl); self.sense = rng_ or 5.0

    def sample_cost(self, s, U, obs, guide):
        if isinstance(guide, dict):          # route horodatée : on compare à la position voulue au même instant
            tr = rollout(s, U)
            c = Vigie.sample_cost(self, s, U, obs, None)
            g = guide['gt']; n = min(self.T, len(g))
            d2 = ((tr[..., :n, :2] - g[:n]) ** 2).sum(-1)
            return c + 2.0 * d2.sum(-1)
        return Vigie.sample_cost(self, s, U, obs, guide)

    def refresh(self, s, obs):
        was_st = bool(self.modes) and self.commit < len(self.modes) and self.modes[self.commit].get('st', False)
        self.modes = [m for m in self.modes if not m.get('st')]
        if was_st: self.commit = 0
        super().refresh(s, obs)
        if not self.use_st: return
        gt = spacetime_plan(s, self.goal, obs, self.D)
        if gt is None or len(gt) < 3: return
        old = [m for m in getattr(self, '_stmodes', [])]
        U = old[0]['U'] if old else timed_controls(s, gt, self.T)
        fresh = timed_controls(s, gt, self.T)
        g = {'gt': gt}
        J = self.sample_cost(s, np.stack([U, fresh]), obs, g)
        m = dict(g=g, U=fresh if J[1] < J[0] else U, st=True)
        self.modes.append(m); self._stmodes = [m]
        if was_st: self.commit = len(self.modes) - 1

    def act(self, t, s, obs):
        # la route horodatée vieillit : on la décale d'un pas à chaque cycle
        for m in self.modes:
            if m.get('st') and len(m['g']['gt']) > 1: m['g']['gt'] = m['g']['gt'][1:]
        u = np.array(super().act(t, s, obs), float)
        if self.use_phantom and self.occl:
            u[0] = min(u[0], phantom_speed(s, phantoms(s, obs, self.sense)))
        return u


class VigieSTNoPhantom(VigieST):
    name = 'VIGIE-ST sans fantômes'; use_phantom = False


class VigieSTNoST(VigieST):
    name = 'VIGIE-ST sans route espace-temps'; use_st = False


ALL += [VigieST, VigieSTNoPhantom, VigieSTNoST]


class MMStrong(MultiModalMPPI):
    """Référence renforcée : même MPPI multimodal, mais deux passes d'optimisation et deux fois plus de tirages."""
    name = 'MPPI multimodal renforcé (2 passes, 256 tirages)'
    N = 256

    def mppi_step(self, s, Unom, obs, scen_list=None, guide=None, iters=1):
        return MultiModalMPPI.mppi_step(self, s, Unom, obs, scen_list, guide, iters=2)


ALL += [MMStrong]


# ---------------------------------------------------------------- planificateur espace-temps v2 (contrôle continu)
ST2_RES, ST2_DT, ST2_K, ST2_SUB = 0.35, 1.0 / 3.0, 24, 4      # 0,35 m, 1/3 s, horizon 8 s, 4 contrôles par transition
ST2_N = int(round(SIZE / ST2_RES))


def spacetime_plan2(s, goal, obs, D, unc=0.05, margin=0.3, unc_agent=None, margin_static=None):
    """A* espace-temps avec vérification continue : entre deux instants du plan, on vérifie
    4 positions intermédiaires contre la position prédite des agents aux mêmes instants.
    Un agent rapide ne peut plus « traverser » le plan entre deux couches de temps."""
    xs = (np.arange(ST2_N) + 0.5) * ST2_RES
    gx, gy = np.meshgrid(xs, xs, indexing='ij')
    stat = np.zeros((ST2_N, ST2_N), bool)
    for o in obs[obs[:, 5] == 0]:
        stat |= (gx - o[0]) ** 2 + (gy - o[1]) ** 2 < (o[4] + R_ROB + (margin if margin_static is None else margin_static)) ** 2
    stat[0, :] = stat[-1, :] = stat[:, 0] = stat[:, -1] = True
    mobmask = obs[:, 5] > 0
    mob = obs[mobmask]
    ua = (np.full(len(mob), unc) if unc_agent is None else unc_agent[mobmask])
    nf = ST2_K * ST2_SUB + 1; dtf = ST2_DT / ST2_SUB
    occ = np.empty((nf, ST2_N, ST2_N), bool)
    for q in range(nf):
        t = q * dtf; o = stat.copy()
        for a, ui in zip(mob, ua):
            px, py = a[0] + a[2] * t, a[1] + a[3] * t; rr = a[4] + R_ROB + margin + ui * t
            i0, i1 = max(0, int((px - rr) / ST2_RES)), min(ST2_N - 1, int((px + rr) / ST2_RES) + 1)
            j0, j1 = max(0, int((py - rr) / ST2_RES)), min(ST2_N - 1, int((py + rr) / ST2_RES) + 1)
            if i0 > i1 or j0 > j1: continue
            o[i0:i1 + 1, j0:j1 + 1] |= (gx[i0:i1 + 1, j0:j1 + 1] - px) ** 2 + (gy[i0:i1 + 1, j0:j1 + 1] - py) ** 2 < rr * rr
        occ[q] = o
    cell = lambda p: (min(ST2_N - 1, max(0, int(p[0] / ST2_RES))), min(ST2_N - 1, max(0, int(p[1] / ST2_RES))))
    si, sj = cell(s); gi, gj = cell(goal)
    Dst = lookup(D, gx, gy) / ST2_RES
    moves = [(0, 0, 0.25)] + [(di, dj, np.hypot(di, dj)) for di in (-1, 0, 1) for dj in (-1, 0, 1) if di or dj]
    start = (si, sj, 0); G = {start: 0.0}; prev = {}; pq = [(Dst[si, sj], start)]
    best, bestc = None, np.inf; closed = set(); n = 0
    while pq and n < 80000:
        f, u = heapq.heappop(pq)
        if u in closed: continue
        closed.add(u); n += 1
        i, j, k = u
        if (i, j) == (gi, gj) or k == ST2_K:
            c = G[u] + (0 if (i, j) == (gi, gj) else Dst[i, j])
            if c < bestc: bestc, best = c, u
            if (i, j) == (gi, gj): break
            continue
        for di, dj, c in moves:
            a, b = i + di, j + dj
            if not (0 <= a < ST2_N and 0 <= b < ST2_N): continue
            ok = True
            for q in range(1, ST2_SUB + 1):
                ci = int(round(i + di * q / ST2_SUB)); cj = int(round(j + dj * q / ST2_SUB))
                if occ[k * ST2_SUB + q, ci, cj] and not (k == 0 and q < 2): ok = False; break
            if not ok: continue
            v = (a, b, k + 1); nd = G[u] + c + 0.2
            if nd < G.get(v, np.inf):
                G[v] = nd; prev[v] = u; heapq.heappush(pq, (nd + Dst[a, b], v))
    if best is None: return None
    path = [best]
    while path[-1] in prev: path.append(prev[path[-1]])
    path = path[::-1]
    pts = np.array([[(i + 0.5) * ST2_RES, (j + 0.5) * ST2_RES] for i, j, k in path]); pts[0] = s[:2]
    tq = np.arange(1, int(len(pts) * ST2_DT / DT) + 1) * DT
    tk = np.arange(len(pts)) * ST2_DT
    return np.stack([np.interp(tq, tk, pts[:, 0]), np.interp(tq, tk, pts[:, 1])], 1)


class MMST(MultiModalMPPI):
    """Référence + route espace-temps : pour isoler l'apport de la planification espace-temps."""
    name = 'MPPI multimodal + route espace-temps'

    def sample_cost_t(self, s, U, obs, gt):
        tr = self._roll(s, U); c = self.eval_cost(s, U, obs)
        n = min(self.T, len(gt)); return c + 2.0 * ((tr[..., :n, :2] - gt[:n]) ** 2).sum(-1).sum(-1)

    def refresh_modes(self, s, obs):
        super().refresh_modes(s, obs)
        gt = spacetime_plan2(s, self.goal, obs, self.D)
        self.gt = gt
        if gt is not None and len(gt) > 3:
            self.modes.append(dict(g=gt, U=timed_controls(s, gt, self.T), st=True, neuf=True))

    def act(self, t, s, obs):
        if self.k % 10 == 0 or not self.modes: self.refresh_modes(s, obs)
        self.k += 1
        if not self.modes: return 0.0, 0.0
        for m in self.modes:
            if m.get('st'):
                if len(m['g']) > 1 and not m.pop('neuf', False): m['g'] = m['g'][1:]   # pas de décalage au cycle de création
                for _ in range(1):
                    eps = self.rng.normal(0, 1, (self.N, self.T, 2)) * self.SIG
                    U = m['U'][None] + eps; U[0] = m['U']; U[1] = 0
                    U[..., 0] = np.clip(U[..., 0], 0, VMAX); U[..., 1] = np.clip(U[..., 1], -WMAX, WMAX)
                    J = self.sample_cost_t(s, U, obs, m['g'])
                    lam = max(1e-6, (np.percentile(J, 10) - J.min()) / 2.0); w = np.exp(-(J - J.min()) / lam); w /= w.sum()
                    m['U'] = (w[:, None, None] * U).sum(0)
            else:
                m['U'] = self.mppi_step(s, m['U'], obs, self.scen(), m['g'])
        self._cands = self.modes + self.extra_candidates(s, obs)
        Us = np.stack([m['U'] for m in self._cands])
        i = self.select(s, Us, obs)
        u = Us[i, 0].copy(); self.chosen_g = self._cands[i]['g']
        for m in self._cands: m['U'] = np.roll(m['U'], -1, 0); m['U'][-1] = m['U'][-2]
        return u

    def extra_candidates(self, s, obs):
        """Options supplémentaires, optimisées à part (aucune par défaut)."""
        return []

    def select(self, s, Us, obs):
        """Choix du mode exécuté : coût minimal."""
        return int(np.argmin(self.eval_cost(s, Us, obs)))


ALL += [MMST]


class TubeMixin:
    """Marges espace-temps croissantes (règle heuristique, non calibrée statistiquement, malgré le nom historique
    « tubes calibrés » gardé dans les fichiers de résultats) : la place réservée autour de chaque agent dans le plan espace-temps
    s'élargit avec le temps d'autant plus vite que l'agent s'est montré imprévisible."""
    def refresh_modes(self, s, obs):
        MultiModalMPPI.refresh_modes(self, s, obs)
        ua = 0.02 + 0.30 * self.tr.u(obs)
        gt = spacetime_plan2(s, self.goal, obs, self.D, unc_agent=ua)
        if gt is not None and len(gt) > 3:
            self.modes.append(dict(g=gt, U=timed_controls(s, gt, self.T), st=True, neuf=True))

    def act(self, t, s, obs):
        if not hasattr(self, 'tr'): self.tr = SurpriseTracker()
        self.tr.update(obs, t)
        return super().act(t, s, obs)


class MMSTTube(TubeMixin, MMST):
    name = 'Espace-temps à tubes calibrés'


class PhantomMixin:
    occl = False
    def set_perception(self, occl, rng_): self.occl = bool(occl); self.sense = rng_ or 5.0
    def act(self, t, s, obs):
        u = np.array(super().act(t, s, obs), float)
        if self.occl: u[0] = min(u[0], phantom_speed(s, phantoms(s, obs, self.sense)))
        return u


class Vigie3(PhantomMixin, SmithMixin, TubeMixin, MMST):
    """VIGIE 3 : route espace-temps (guide holonome x, y, t, sans garantie cinématique) à marges croissantes selon l'imprévisibilité de chaque agent,
    plus les routes topologiques, compensation du retard et vitesse prudente aux angles morts."""
    name = 'VIGIE 3 (proposé)'


class Vigie2ST(VigieV2):
    """VIGIE 2 (valeur d'option) + route espace-temps v2 comme option supplémentaire."""
    name = 'VIGIE 2 + espace-temps'
    def sample_cost(self, s, U, obs, guide):
        if isinstance(guide, dict):
            tr = rollout(s, U); c = Vigie.sample_cost(self, s, U, obs, None)
            g = guide['gt']; n = min(self.T, len(g))
            return c + 2.0 * ((tr[..., :n, :2] - g[:n]) ** 2).sum(-1).sum(-1)
        return Vigie.sample_cost(self, s, U, obs, guide)
    def refresh(self, s, obs):
        was = bool(self.modes) and self.commit < len(self.modes) and self.modes[self.commit].get('st', False)
        self.modes = [m for m in self.modes if not m.get('st')]
        if was: self.commit = 0
        super().refresh(s, obs)
        gt = spacetime_plan2(s, self.goal, obs, self.D, unc_agent=0.02 + 0.30 * self._u if self._u is not None and len(self._u) == len(obs) else None)
        if gt is not None and len(gt) > 3:
            self.modes.append(dict(g={'gt': gt}, U=timed_controls(s, gt, self.T), st=True))
            if was: self.commit = len(self.modes) - 1
    def act(self, t, s, obs):
        for m in self.modes:
            if m.get('st') and len(m['g']['gt']) > 1: m['g']['gt'] = m['g']['gt'][1:]
        return super().act(t, s, obs)


ALL += [MMSTTube, Vigie3, Vigie2ST]



# ---------------------------------------------------------------- modèle interne appris en ligne (inspiration : le cervelet)
def rollout_dyn(s, U, v0, w0, tv, tw, av, aw):
    """Comme rollout, mais le robot ne suit pas la commande instantanément : premier ordre de constante
    de temps tv (tw en rotation), accélérations limitées à av (aw). Part des vitesses actuelles v0, w0."""
    T = U.shape[-2]
    out = np.empty(U.shape[:-1] + (3,))
    x = np.full(U.shape[:-2], s[0]); y = np.full(U.shape[:-2], s[1]); th = np.full(U.shape[:-2], s[2])
    v = np.full(U.shape[:-2], v0); w = np.full(U.shape[:-2], w0)
    kv, kw = min(1.0, DT / tv), min(1.0, DT / tw)
    for t in range(T):
        v = v + np.clip((U[..., t, 0] - v) * kv, -av * DT, av * DT)
        w = w + np.clip((U[..., t, 1] - w) * kw, -aw * DT, aw * DT)
        x = x + DT * v * np.cos(th); y = y + DT * v * np.sin(th); th = th + DT * w
        out[..., t, 0] = x; out[..., t, 1] = y; out[..., t, 2] = th
    return out


class InternalModelMixin:
    """Modèle interne appris en ligne. Le planificateur compare ce qu'il a commandé à ce qu'il mesure
    (vitesses tirées des poses estimées) et ajuste, chaque seconde, la constante de temps et l'accélération
    du robot qui expliquent le mieux les mesures. Ses prédictions partent ensuite de la vitesse actuelle
    du robot et respectent sa réactivité réelle, au lieu de supposer qu'il obéit instantanément."""
    TAUS = np.array([0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.55, 0.7, 0.9, 1.2])
    ACCS = np.array([0.8, 1.2, 1.6, 2.0, 3.0])

    def _im_init(self):
        self.im_hist = deque(maxlen=60); self.im_par = [0.1, 0.1, 2.0, 4.0]; self.im_v = 0.0; self.im_w = 0.0; self.im_k = 0
        self.im_last = None

    def _roll(self, s, U):
        tv, tw, av, aw = self.im_par
        return rollout_dyn(s, U, self.im_v, self.im_w, tv, tw, av, aw)

    def _identify(self):
        H = list(self.im_hist)
        if len(H) < 25: return
        cmd = np.array([h[0] for h in H]); mea = np.array([h[1] for h in H])
        best = []
        for j, amax_set in ((0, self.ACCS), (1, self.ACCS * 2)):
            bc, be = None, np.inf
            for tau in self.TAUS:
                for a in amax_set:
                    v = mea[0, j]; e = 0.0
                    for k in range(len(H) - 1):
                        v = v + np.clip((cmd[k, j] - v) * min(1, DT / tau), -a * DT, a * DT)
                        e += (v - mea[k + 1, j]) ** 2
                    if e < be: be, bc = e, (tau, a)
            best.append(bc)
        self.im_par = [best[0][0], best[1][0], best[0][1], best[1][1]]

    def act(self, t, s, obs):
        if not hasattr(self, 'im_hist'): self._im_init()
        # vitesses mesurées à partir des poses successives
        if self.im_last is not None:
            d = s[:2] - self.im_last[:2]; dth = np.arctan2(np.sin(s[2] - self.im_last[2]), np.cos(s[2] - self.im_last[2]))
            vm = (d @ np.array([np.cos(s[2]), np.sin(s[2])])) / DT; wm = dth / DT
        else: vm, wm = 0.0, 0.0
        self.im_last = np.array(s, float)
        # observateur : modèle + petite correction par la mesure (bruitée)
        self.im_v += 0.25 * (vm - self.im_v); self.im_w += 0.25 * (wm - self.im_w)
        self.im_k += 1
        if self.im_k % 10 == 0: self._identify()
        u = np.array(super().act(t, s, obs), float)
        if self.im_hist and len(self.im_hist) > 0: pass
        self.im_hist.append(((float(np.clip(u[0], 0, VMAX)), float(np.clip(u[1], -WMAX, WMAX))), (vm, wm)))
        # prédiction du modèle pour le pas suivant
        tv, tw, av, aw = self.im_par
        self.im_v += np.clip((u[0] - self.im_v) * min(1, DT / tv), -av * DT, av * DT)
        self.im_w += np.clip((u[1] - self.im_w) * min(1, DT / tw), -aw * DT, aw * DT)
        return u


class Vigie3M(InternalModelMixin, Vigie3):
    name = 'VIGIE 3 + modèle interne (proposé)'


ALL += [Vigie3M]


# ---------------------------------------------------------------- valeur d'option corrigée (suite à l'audit externe)
def predict_agents(obs, T, ang, fac):
    """Futur où chaque agent a son propre scénario (angle de virage ang[m], facteur de vitesse fac[m])."""
    p, v = obs[:, :2], obs[:, 2:4]
    t = np.arange(1, T + 1) * DT
    mob = obs[:, 5] > 0
    a = ang[None, :] * np.minimum(1.0, t / 2.0)[:, None]
    f = 1.0 + (fac - 1.0)[None, :] * np.minimum(1.0, t / 1.0)[:, None]
    c, s_ = np.cos(a), np.sin(a)
    vx = f * (c * v[None, :, 0] - s_ * v[None, :, 1]); vy = f * (s_ * v[None, :, 0] + c * v[None, :, 1])
    vx[:, ~mob] = 0; vy[:, ~mob] = 0
    return p[None] + DT * np.cumsum(np.stack([vx, vy], -1), 0)


class Vigie2C(InternalModelMixin, VigieV2):
    """VIGIE 2 corrigé : (1) chaque agent tire son propre futur, indépendamment des autres (plus de futur collectif) ;
    (2) on branche au prochain cycle de décision (0,1 s) : les options ne diffèrent que par la commande
    réellement exécutée avant la prochaine observation ; (3) les prédictions respectent la réactivité réelle
    du robot (modèle interne), ce qui lisse les raccords entre début et suite.
    La valeur reste E[min], donc optimiste (elle suppose qu'on saura quel futur se produit) : on la combine
    avec min E pour ne pas surestimer les routes alternatives."""
    name = 'VIGIE 2 corrigé (audit)'
    P = 1; NJ = 12

    def eval_joint(self, s, U, obs, ang, fac):
        tr = self._roll(s, U)
        c = obstacle_cost(tr, predict_agents(obs, self.T, ang, fac), obs[:, 4])
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        return c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)

    def option_values(self, s, seq, obs):
        m = len(obs); u = self._u if self._u is not None and len(self._u) == m else np.zeros(m)
        idx = self.rng.choice(len(SCENARIOS), size=(self.NJ, m), p=SCEN_W)
        C = np.stack([self.eval_joint(s, seq, obs, np.array([SCENARIOS[k][0] for k in row]) * u,
                                      1 + (np.array([SCENARIOS[k][1] for k in row]) - 1) * u) for row in idx], -1)
        optimiste = C.min(1).mean(-1)            # E[min] : suppose qu'on saura quel futur se produit
        prudent = C.mean(-1).min(1)              # min E : meilleure suite sans information nouvelle
        return 0.5 * optimiste + 0.5 * prudent


ALL += [Vigie2C]


# =====================================================================================
# Séance 5 : profil de vitesse espace-temps compatible avec la dynamique réelle
# =====================================================================================
def speed_profile(path, obs, ua, acc=1.2, dec=1.6, vmax=VMAX, a_lat=1.0, v0=0.0, H=8.0, dt=0.2, ds=0.2, margin=0.25):
    """Décomposition chemin-vitesse : le chemin (x, y) est fixé, on cherche quand y passer.
    Programmation dynamique dans (temps, abscisse le long du chemin, vitesse) avec les accélérations
    atteignables par le robot (acc, dec), la vitesse limitée dans les virages, et les agents prédits
    (tube qui s'élargit selon l'imprévisibilité ua de chacun). Renvoie la trajectoire horodatée la plus
    avancée possible sans conflit, ou None."""
    seg = np.hypot(*np.diff(path, axis=0).T); L = np.r_[0, np.cumsum(seg)]
    if L[-1] < 0.3: return None
    sg = np.arange(0, L[-1] + 1e-9, ds); n = len(sg)
    px = np.interp(sg, L, path[:, 0]); py = np.interp(sg, L, path[:, 1])
    # vitesse maximale selon la courbure locale
    hd = np.unwrap(np.arctan2(np.gradient(py), np.gradient(px)))
    kappa = np.abs(np.gradient(hd)) / ds
    vcap = np.minimum(vmax, np.sqrt(a_lat / np.maximum(kappa, 1e-3)))
    K = int(H / dt)
    mob = obs[:, 5] > 0; A = obs[mob]; U_ = ua[mob] if ua is not None else np.full(mob.sum(), 0.05)
    occ = np.zeros((K + 1, n), bool)
    if len(A):
        for k in range(K + 1):
            t = k * dt
            ax_ = A[:, 0] + A[:, 2] * t; ay_ = A[:, 1] + A[:, 3] * t
            rr = A[:, 4] + R_ROB + margin + U_ * t
            d = np.hypot(px[:, None] - ax_[None], py[:, None] - ay_[None]) - rr[None]
            occ[k] = (d < 0).any(1)
    vs = np.arange(0, vmax + 1e-9, 0.1); nv = len(vs)
    accs = np.array([-dec, -dec / 2, 0, acc / 2, acc])
    reach = np.zeros((K + 1, n, nv), bool); par = np.full((K + 1, n, nv, 2), -1, int)
    sval = np.zeros((K + 1, n, nv)); vval = np.zeros((K + 1, n, nv))   # position et vitesse continues (pas arrondies)
    j0 = 0; v0c = float(np.clip(v0, 0, vmax)); v0i = int(round(v0c / 0.1))
    if occ[0, j0]: occ[0, j0] = False
    reach[0, j0, v0i] = True; sval[0, j0, v0i] = 0.0; vval[0, j0, v0i] = v0c
    goal_hit = None
    for k in range(K):
        js, vis = np.nonzero(reach[k])
        for j, vi in zip(js, vis):
            v = vval[k, j, vi]; s0 = sval[k, j, vi]
            for a in accs:
                v2 = float(np.clip(v + a * dt, 0, vmax))
                s2 = min(L[-1], s0 + (v + v2) / 2 * dt)
                j2 = min(n - 1, int(s2 / ds))
                jlo = int(s0 / ds)
                if v2 > vcap[j2] + 1e-9: continue
                if occ[k + 1, jlo:j2 + 1].any() or occ[k, jlo:j2 + 1].any(): continue   # balayage des cases traversées
                vi2 = int(round(v2 / 0.1))
                if not reach[k + 1, j2, vi2] or s2 > sval[k + 1, j2, vi2]:
                    reach[k + 1, j2, vi2] = True; par[k + 1, j2, vi2] = (j, vi); sval[k + 1, j2, vi2] = s2; vval[k + 1, j2, vi2] = v2
                    if s2 >= L[-1] - 1e-6 and goal_hit is None: goal_hit = (k + 1, j2, vi2)
        if goal_hit: break
    if goal_hit: kf, jf, vf = goal_hit
    else:
        kf = K
        while kf > 0 and not reach[kf].any(): kf -= 1
        if kf == 0: return None
        js, vis = np.nonzero(reach[kf]); b = np.lexsort((vis, js))[-1]; jf, vf = js[b], vis[b]
    seq = [(kf, jf, vf)]
    while seq[-1][0] > 0:
        k, j, vi = seq[-1]; pj, pv = par[k, j, vi]; seq.append((k - 1, pj, pv))
    seq = seq[::-1]
    tk = np.array([q[0] * dt for q in seq]); sk = np.array([sval[q] for q in seq]); vk = np.array([vval[q] for q in seq])
    tq = np.arange(1, int(round(tk[-1] / DT)) + 1) * DT
    # interpolation exacte : accélération constante entre deux points du plan
    idx = np.clip(np.searchsorted(tk, tq, side='right') - 1, 0, len(tk) - 2)
    tau = tq - tk[idx]; acc_k = (vk[idx + 1] - vk[idx]) / dt
    sq = np.minimum(sk[idx] + vk[idx] * tau + 0.5 * acc_k * tau ** 2, L[-1])
    return np.stack([np.interp(sq, L, path[:, 0]), np.interp(sq, L, path[:, 1])], 1)


class Vigie4Core(MultiModalMPPI):
    """Cœur de VIGIE 4 : routes topologiques + pour chacune, un profil de vitesse espace-temps calculé avec les
    accélérations identifiées en ligne et des tubes calibrés sur l'imprévisibilité de chaque agent."""
    name = 'VIGIE 4 (cœur)'

    def sample_cost_t(self, s, U, obs, gt):
        tr = self._roll(s, U); c = self.eval_cost(s, U, obs)
        n = min(self.T, len(gt)); return c + 2.0 * ((tr[..., :n, :2] - gt[:n]) ** 2).sum(-1).sum(-1)

    def refresh_modes(self, s, obs):
        MultiModalMPPI.refresh_modes(self, s, obs)
        if not hasattr(self, 'tr'): self.tr = SurpriseTracker()
        ua = 0.02 + 0.30 * self.tr.u(obs)
        tv, tw, av, aw = getattr(self, 'im_par', [0.1, 0.1, AMAX, 4.0])
        acc = min(av, 2.0) * 0.8                         # marge sur l'accélération identifiée
        timed = []
        for m in self.modes:
            g = np.vstack([s[:2], m['g']])
            gt = speed_profile(g, obs, ua, acc=acc, dec=acc * 1.3, v0=max(0.0, getattr(self, 'im_v', 0.0)))
            if gt is not None and len(gt) > 3:
                timed.append(dict(g=gt, U=timed_controls(s, gt, self.T), st=True, neuf=True))
        self.modes += timed

    def act(self, t, s, obs):
        if not hasattr(self, 'tr'): self.tr = SurpriseTracker()
        self.tr.update(obs, t)
        if self.k % 10 == 0 or not self.modes: self.refresh_modes(s, obs)
        self.k += 1
        if not self.modes: return 0.0, 0.0
        for m in self.modes:
            if m.get('st'):
                if len(m['g']) > 1 and not m.pop('neuf', False): m['g'] = m['g'][1:]   # pas de décalage au cycle de création
                eps = self.rng.normal(0, 1, (self.N, self.T, 2)) * self.SIG
                U = m['U'][None] + eps; U[0] = m['U']; U[1] = 0
                U[..., 0] = np.clip(U[..., 0], 0, VMAX); U[..., 1] = np.clip(U[..., 1], -WMAX, WMAX)
                J = self.sample_cost_t(s, U, obs, m['g'])
                lam = max(1e-6, (np.percentile(J, 10) - J.min()) / 2.0); w = np.exp(-(J - J.min()) / lam); w /= w.sum()
                m['U'] = (w[:, None, None] * U).sum(0)
            else:
                m['U'] = self.mppi_step(s, m['U'], obs, None, m['g'])
        Us = np.stack([m['U'] for m in self.modes])
        J = self.eval_cost(s, Us, obs)
        i = int(np.argmin(J)); u = Us[i, 0].copy(); self.chosen_g = self.modes[i]['g']
        for m in self.modes: m['U'] = np.roll(m['U'], -1, 0); m['U'][-1] = m['U'][-2]
        return u




class VigieQuatre(InternalModelMixin, PhantomMixin, SmithMixin, Vigie4Core):
    """VIGIE 4 : le robot peut ralentir ou attendre avant un flux, puis passer dans un trou, avec un horaire
    qu'il est réellement capable de tenir (accélérations identifiées en ligne), plus compensation du retard
    et vitesse prudente aux angles morts. Les briques héritées s'exécutent avant le cœur (ordre des classes)."""
    name = 'VIGIE 4 (proposé)'


ALL += [VigieQuatre]


# ---------------------------------------------------------------- modèle interne v2 : par roue, tenant compte du retard
WB = 0.45   # entraxe supposé connu (donnée de construction du robot)


def wheel_step(vl, vr, vc, wc, tau, a, dt=DT):
    """Un pas du modèle par roue : consignes de roues saturées (courbure conservée), premier ordre de constante tau,
    accélération limitée à a, réduite à haute vitesse (force contre-électromotrice), freinage 30 % plus fort."""
    l, r = vc - wc * WB / 2, vc + wc * WB / 2
    k = np.maximum(1.0, np.maximum(np.abs(l), np.abs(r)) / VMAX); l = l / k; r = r / k
    g = np.minimum(1.0, dt / tau)
    al = a * (1 - np.abs(vl) / 1.9); ar = a * (1 - np.abs(vr) / 1.9)
    vl = vl + np.clip((l - vl) * g, -1.3 * a * dt, al * dt); vr = vr + np.clip((r - vr) * g, -1.3 * a * dt, ar * dt)
    return vl, vr


def rollout_wheels(s, U, vl0, vr0, tau, a):
    T = U.shape[-2]; out = np.empty(U.shape[:-1] + (3,))
    x = np.full(U.shape[:-2], s[0]); y = np.full(U.shape[:-2], s[1]); th = np.full(U.shape[:-2], s[2])
    vl = np.full(U.shape[:-2], vl0); vr = np.full(U.shape[:-2], vr0)
    for t in range(T):
        vl, vr = wheel_step(vl, vr, U[..., t, 0], U[..., t, 1], tau, a)
        v, w = (vl + vr) / 2, (vr - vl) / WB
        x = x + DT * v * np.cos(th); y = y + DT * v * np.sin(th); th = th + DT * w
        out[..., t, 0] = x; out[..., t, 1] = y; out[..., t, 2] = th
    return out


class WheelModelMixin:
    """Modèle interne v2. Structure supposée connue (deux roues motrices à moteurs à courant continu),
    paramètres appris en ligne : constante de temps et accélération des roues. Le retard des mesures (connu,
    voir SmithMixin) est pris en compte : la mesure reçue maintenant décrit le robot d'il y a « lat » pas,
    on rejoue donc les commandes envoyées depuis pour estimer sa vitesse présente."""
    TAUS = np.array([0.05, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4])
    ACCS = np.array([0.8, 1.0, 1.2, 1.4, 1.6, 2.0, 2.5, 3.0, 4.0])

    def _wm_init(self):
        self.wm_cmd = []; self.wm_meas = []; self.wm_par = (0.15, 2.0); self.wm_last = None; self.wm_k = 0
        self.wm_now = (0.0, 0.0)

    def _roll(self, s, U):
        tau, a = self.wm_par; vl, vr = self.wm_now
        return rollout_wheels(s, U, vl, vr, tau, a)

    def _wm_fit(self, d):
        C = np.array(self.wm_cmd[-60 - d:]); M = np.array(self.wm_meas[-60 - d:])
        m = len(C) - 1 - d
        if m < 20: return None
        tg, ag = np.meshgrid(self.TAUS, self.ACCS, indexing='ij'); tg = tg.ravel(); ag = ag.ravel()
        v0, w0 = M[d]
        vl = np.full(len(tg), v0 - w0 * WB / 2); vr = np.full(len(tg), v0 + w0 * WB / 2); err = np.zeros(len(tg))
        for i in range(m):
            vl, vr = wheel_step(vl, vr, C[i, 0], C[i, 1], tg, ag)
            vm, wm = M[i + 1 + d]
            err += ((vl + vr) / 2 - vm) ** 2 + (0.25 * ((vr - vl) / WB - wm)) ** 2
        b = int(np.argmin(err)); return err[b] / m, (float(tg[b]), float(ag[b]))

    def _wm_identify(self):
        """Paramètres des roues. Alignement commandes / mesures : retard des mesures (connu) + 1 pas pour la chaîne
        de commande (50 ms) et le fait que la vitesse mesurée est une moyenne sur le pas écoulé. Cette règle a été
        établie expérimentalement : c'est elle qui donne l'estimation la plus juste de la vitesse présente,
        pour 1 comme pour 3 pas de retard (voir tests_banc.py)."""
        d = getattr(self, 'lat', 0) + 1
        if len(self.wm_cmd) < 30 + d: return
        f = self._wm_fit(d)
        if f is not None: self.wm_par = f[1]; self.wm_d = d

    def act(self, t, s, obs):
        if not hasattr(self, 'wm_cmd'): self._wm_init()
        if self.wm_last is not None:
            dxy = s[:2] - self.wm_last[:2]; dth = np.arctan2(np.sin(s[2] - self.wm_last[2]), np.cos(s[2] - self.wm_last[2]))
            vm = (dxy @ np.array([np.cos(s[2]), np.sin(s[2])])) / DT; wm = dth / DT
        else: vm, wm = 0.0, 0.0
        self.wm_last = np.array(s, float); self.wm_meas.append((vm, wm)); self.wm_k += 1
        if self.wm_k % 10 == 0: self._wm_identify()
        # vitesse présente : dernière mesure (vieille de « lat » pas), lissée, puis commandes rejouées
        d = getattr(self, 'lat', 0) + 1; tau, a = self.wm_par
        M = np.array(self.wm_meas[-3:]).mean(0)
        vl, vr = M[0] - M[1] * WB / 2, M[0] + M[1] * WB / 2
        for c in self.wm_cmd[len(self.wm_cmd) - d:] if d else []:
            vl, vr = wheel_step(vl, vr, c[0], c[1], tau, a)
        self.wm_now = (float(vl), float(vr))
        u = np.array(super().act(t, s, obs), float)
        self.wm_cmd.append((float(np.clip(u[0], 0, VMAX)), float(np.clip(u[1], -WMAX, WMAX))))
        return u


class Vigie3W(WheelModelMixin, Vigie3):
    name = 'VIGIE 3 + modèle par roue (proposé)'


class VigieQuatreW(WheelModelMixin, PhantomMixin, SmithMixin, Vigie4Core):
    name = 'VIGIE 4 + modèle par roue (proposé)'

    def refresh_modes(self, s, obs):
        tau, a = getattr(self, 'wm_par', (0.15, 2.0))
        self.im_par = [tau, tau, a, 2 * a / WB]; self.im_v = sum(getattr(self, 'wm_now', (0, 0))) / 2
        Vigie4Core.refresh_modes(self, s, obs)


ALL += [Vigie3W, VigieQuatreW]


# ---------------------------------------------------------------- règle du carrefour
class CarrefourMixin:
    """Règle du carrefour, empruntée au code de la route (R415-2) : ne pas s'engager dans une zone de passage
    si l'on risque d'y être immobilisé. Le long de la route choisie, on repère les tronçons que les agents
    prédits vont balayer dans les prochaines secondes. On n'y entre que si un démarrage franc permet de les
    traverser sans conflit ; sinon la vitesse est limitée pour pouvoir s'arrêter avant. Filtre qui ne fait
    que ralentir (une première version qui forçait aussi à dégager la zone poussait le robot contre les murs) ;
    la direction reste celle du planificateur."""
    CF_H, CF_L, CF_DS = 4.0, 5.0, 0.1       # horizon (s), longueur de route examinée (m), pas le long de la route
    CF_ACC, CF_DEC, CF_TAU = 1.0, 1.5, 0.15  # accélération supposée pour passer, freinage, retard de réaction
    CF_M0, CF_M1 = 0.15, 0.10                # marge (m) et élargissement par seconde de prédiction
    CF_DEGAGE = True                         # dégager la zone quand s'y arrêter mènerait au conflit

    def reset(self, static, goal):
        super().reset(static, goal); self._cf_v = 0.0; self.cf_n = 0

    def _cf_path(self, s):
        g = getattr(self, 'chosen_g', None)
        if g is None or not isinstance(g, np.ndarray) or len(g) < 2: return None
        i0 = int(np.argmin(np.hypot(g[:, 0] - s[0], g[:, 1] - s[1])))
        P = np.vstack([s[:2], g[i0 + 1:]])
        seg = np.hypot(*np.diff(P, axis=0).T); L = np.r_[0, np.cumsum(seg)]
        if L[-1] < 0.3: return None
        sg = np.arange(0, min(L[-1], self.CF_L) + 1e-9, self.CF_DS)
        return np.stack([np.interp(sg, L, P[:, 0]), np.interp(sg, L, P[:, 1])], 1)

    def _cf_occ(self, path, obs):
        A = obs[obs[:, 5] > 0]
        K = int(round(self.CF_H / DT))
        occ = np.zeros((K + 1, len(path)), bool)
        if not len(A): return occ
        for k in range(K + 1):
            t = k * DT
            ax_ = A[:, 0] + A[:, 2] * t; ay_ = A[:, 1] + A[:, 3] * t
            rr = A[:, 4] + R_ROB + self.CF_M0 + self.CF_M1 * t
            occ[k] = (np.hypot(path[:, 0, None] - ax_[None], path[:, 1, None] - ay_[None]) < rr[None]).any(1)
        return occ

    def _cf_profile(self, v0, a, n):
        """Abscisses (indices de cellule) aux instants k = 1..K pour une accélération constante a (bornée)."""
        K = int(round(self.CF_H / DT)); v = v0; x = 0.0; out = []
        for _ in range(K):
            v2 = float(np.clip(v + a * DT, 0.0, VMAX)); x += (v + v2) / 2 * DT; v = v2
            out.append(min(n - 1, int(x / self.CF_DS)) if x / self.CF_DS < n else -1)   # -1 : sorti de la route examinée
        return out

    def _cf_first_conflict(self, occ, prof):
        for k, i in enumerate(prof):
            if i >= 0 and occ[k + 1, i]: return k + 1
        return None

    def act(self, t, s, obs):
        u = np.array(super().act(t, s, obs), float)
        v0 = self._cf_v
        path = self._cf_path(s)
        if path is not None and len(obs):
            occ = self._cf_occ(path, obs); n = len(path)
            swept = occ.any(0)
            cg = self._cf_first_conflict(occ, self._cf_profile(v0, self.CF_ACC, n))
            if cg is not None and not swept[0]:
                # un démarrage franc ne passe pas : on garde de quoi s'arrêter avant la zone
                go = self._cf_profile(v0, self.CF_ACC, n); i_in = go[cg - 1]
                while i_in > 0 and swept[i_in - 1]: i_in -= 1
                s_in = i_in * self.CF_DS - 0.1
                b = self.CF_DEC * self.CF_TAU
                vcap = max(0.0, -b + np.sqrt(b * b + 2 * self.CF_DEC * max(0.0, s_in)))
                if u[0] > vcap: u[0] = vcap; self.cf_n += 1
            elif cg is not None:
                # déjà dans la zone et passer ne marche pas : s'arrêter si cela évite le conflit, sinon laisser faire
                if self._cf_first_conflict(occ, self._cf_profile(v0, -self.CF_DEC, n)) is None:
                    u[0] = 0.0; self.cf_n += 1
            elif swept[0] and self.CF_DEGAGE:
                # dans la zone, passer est sans conflit : si s'arrêter mène au conflit, on dégage
                # (seulement si le robot est aligné avec sa route, pour ne pas foncer dans un mur en tournant)
                hd = np.arctan2(path[min(3, n - 1), 1] - path[0, 1], path[min(3, n - 1), 0] - path[0, 0])
                if abs((hd - s[2] + np.pi) % (2 * np.pi) - np.pi) < 0.5 and \
                        self._cf_first_conflict(occ, self._cf_profile(v0, -self.CF_DEC, n)) is not None:
                    u[0] = max(u[0], min(VMAX, v0 + self.CF_ACC * DT)); self.cf_n += 1
        self._cf_v = float(np.clip(np.clip(u[0], 0, VMAX), v0 - AMAX * DT, v0 + AMAX * DT))
        return u


class MMSmithCarrefour(SmithMixin, CarrefourMixin, MultiModalMPPI):
    name = 'MPPI multimodal + Smith + règle du carrefour'


class Vigie3Carrefour(PhantomMixin, SmithMixin, CarrefourMixin, TubeMixin, MMST):
    name = 'VIGIE 3 + règle du carrefour (proposé)'



class Vigie3CarrefourSansDegager(Vigie3Carrefour):
    name = 'VIGIE 3 + règle du carrefour, sans dégager'
    CF_DEGAGE = False



class Vigie5(Vigie3CarrefourSansDegager):
    """VIGIE 5 : VIGIE 3 (route espace-temps à tubes calibrés, routes topologiques, prédicteur de Smith, vitesse
    prudente aux angles morts) + règle du carrefour (ne pas s'engager dans une zone de passage qu'on ne peut pas
    traverser sans conflit). Version retenue à l'issue de l'étape 2 (campagne de développement etape2_dev.csv)."""
    name = 'VIGIE 5 (proposé)'


ALL += [MMSmithCarrefour, Vigie3Carrefour, Vigie3CarrefourSansDegager, Vigie5]

import references  # références de l'état de l'art (ajoutées à ALL)
import vigie_risque  # VIGIE 3 + risque calibré (séance 7)
import vigie7  # idées propres (séance 8, sections 8 et 9)
