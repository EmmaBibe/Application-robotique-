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
    D = D * RES
    D[np.isinf(D)] = np.nanmax(D[np.isfinite(D)]) + 10
    return D


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

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        tr = rollout(s, U)
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
        if new: self.modes = new

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
        u = Us[i, 0].copy()
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

    def future(self, obs):
        import copy
        w = copy.deepcopy(self.world); t = getattr(w, 't', 0.0)
        P = []
        for _ in range(self.T):
            w.step_obstacles(t); t += DT
            P.append(w.true_obstacles()[:, :2])
        return np.array(P)

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        tr = rollout(s, U)
        R = self.world.true_obstacles()[:, 2]
        c = obstacle_cost(tr, self._P, R)
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        return c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)

    def act(self, t, s, obs):
        self._P = self.future(obs)
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
