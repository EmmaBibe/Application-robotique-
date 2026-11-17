"""Références de l'état de l'art, codées d'après leurs publications.

T-MPC++ : O. de Groot, L. Ferranti, D. M. Gavrila, J. Alonso-Mora, « Topology-Driven Parallel Trajectory
          Optimization in Dynamic Environments », IEEE Transactions on Robotics, vol. 41, p. 110-126, 2024.
DRA-MPPI : E. Trevisan, K. A. Mustafa, G. Notten, X. Wang, J. Alonso-Mora, « Dynamic Risk-Aware MPPI for
          Mobile Robots in Crowds via Efficient Monte Carlo Approximations », IROS 2025.

Ce qui suit la publication à la lettre et ce qui a dû être adapté au banc est listé dans ADAPTATIONS.
"""
import numpy as np
import planners as P
from planners import (MPPI, SmithMixin, rollout, predict, lookup, obstacle_cost, timed_controls)
from sim import DT, R_ROB, VMAX, WMAX, SIZE

ADAPTATIONS = """
T-MPC++
- publication : planificateurs locaux par optimisation non linéaire (FORCES Pro, LMPCC).
  ici : planificateurs locaux MPPI, avec le coût commun à toutes les méthodes du banc. La publication
  précise que le cadre ne modifie pas le coût du planificateur local : on garde donc celui du banc.
- guidage : graphe de visibilité (Visibility-PRM) dans l'espace-temps, n = 30 tirages, 4 trajectoires
  distinctes, cibles en grille 5 × 5 le long du chemin de référence : comme la publication.
  Horizon du guidage égal à l'horizon local (comme la publication, note 1), ici 2,5 s.
- distinction des classes : nombres d'enroulement autour de chaque obstacle (une des trois méthodes
  prévues par la publication ; ses expériences utilisent la signature H, équivalente pour ce test).
- contraintes d'homotopie (éq. 8) avec beta = 0, sur les obstacles à moins de 4 m de la trajectoire
  guide, mobiles et fixes (la publication n'a que des piétons comme obstacles). En MPPI, une contrainte
  devient une forte pénalité.
- sélection : argmin w_i J_i avec w_i = 0,75 pour la classe suivie au cycle précédent (éq. 12, tableau I).
  Le coût du banc contient la distance restante au but, qui ne dépend pas du choix ; on retire donc la
  part qu'une trajectoire idéale (vitesse maximale le long du plus court chemin) ne peut pas éviter,
  pour que la remise de 25 % porte, comme dans la publication, sur des écarts et non sur une constante.
- départ à chaud : la publication réinitialise chaque planificateur sur son guide ; un MPPI à une
  itération repart mieux de sa solution précédente. On garde la meilleure des deux, à coût égal pour
  tous les planificateurs.
- T-MPC++ : un planificateur supplémentaire non guidé (section IV-G).
- extension : la publication place ses cibles le long d'une seule route de référence (une route
  routière, les obstacles fixes étant les bords). Dans nos scènes, les obstacles fixes créent plusieurs
  routes ; avec une seule route, toutes les cibles tombent du même côté et le guidage ne voit qu'une
  classe. On ajoute donc la même grille de cibles le long de deux routes globales distinctes de plus
  (même calcul que la référence précédente, recalculé chaque seconde). Cela ne peut que renforcer T-MPC.

DRA-MPPI
- prédiction : vitesse constante plus bruit gaussien, Sigma_w = 0,3² I avec dt = 0,2 s (section V-A),
  soit une variance de position qui croît de 0,018 m² par seconde ; même loi ici.
- probabilité de collision par instant et par trajectoire, jointe sur les obstacles (éq. 9),
  coût C = w_soft P + w_hard 1(P > sigma), sigma = 0,05 (section V-B), sommé sur l'horizon.
- la publication estime la probabilité par Monte-Carlo (moins de 2 % d'erreurs de classement contre
  le calcul exact). Ici on utilise le calcul exact (table précalculée et vérifiée), qui est ce que
  l'estimation approche.
- poids w_soft et w_hard non publiés : réglés sur les mondes de développement.
- 400 trajectoires tirées (section V-B), dont une à l'arrêt ; bruit gaussien au lieu de splines de
  Halton (même échantillonneur que les autres MPPI du banc).
- obstacles fixes et murs : coût de collision déterministe commun au banc.
"""


# ============================================================ outils communs
def _wrap(a):
    return (a + np.pi) % (2 * np.pi) - np.pi


def sample_path(path, times):
    """path : (n, 3) points (x, y, t) à temps croissants -> positions (len(times), 2) interpolées."""
    t = path[:, 2]
    x = np.interp(times, t, path[:, 0]); y = np.interp(times, t, path[:, 1])
    return np.stack([x, y], -1)


def obstacle_tracks(obs, times):
    """Positions des obstacles aux instants donnés, vitesse constante (comme la publication) : (len(times), M, 2)."""
    return obs[None, :, :2] + obs[None, :, 2:4] * times[:, None, None]


def winding(rel_a, rel_b):
    """Nombre d'enroulement de la boucle formée par deux trajectoires de même départ, autour de chaque
    obstacle. rel_a, rel_b : (K, M, 2) positions relatives (robot - obstacle) aux mêmes instants.
    La boucle : a de 0 à T, segment de fermeture à T de a vers b, puis b de T à 0."""
    th_a = np.arctan2(rel_a[..., 1], rel_a[..., 0]); th_b = np.arctan2(rel_b[..., 1], rel_b[..., 0])
    sa = _wrap(np.diff(th_a, axis=0)).sum(0); sb = _wrap(np.diff(th_b, axis=0)).sum(0)
    close = _wrap(th_b[-1] - th_a[-1])
    return (sa + close - sb) / (2 * np.pi)


def same_class(pa, pb, obs, times):
    """Vrai si les deux trajectoires (positions aux instants times) passent tous les obstacles du même côté."""
    O = obstacle_tracks(obs, times)
    w = winding(pa[:, None, :] - O, pb[:, None, :] - O)
    return bool(np.all(np.abs(w) < 0.5))


# ============================================================ T-MPC++ : planificateur de guidage
class GuidancePlanner:
    """Visibility-PRM dans l'espace (x, y, t) (Siméon et al. 2000, utilisé par T-MPC, section IV-A)."""
    N_SAMPLES = 30          # tableau I
    P = 4                   # trajectoires distinctes, tableau I
    GRID = (5, 5)           # cibles, tableau I
    MARGIN = 0.1            # la publication utilise 0,4 m pour des piétons de 0,3 m
    SUB = 6                 # vérifications par arête

    def __init__(self, horizon, rng):
        self.Tg = horizon; self.rng = rng; self.prev_nodes = []

    def _free_seg(self, a, b, obs):
        """Arête a -> b (x, y, t) libre de collision et faisable en vitesse ?"""
        dt = b[2] - a[2]
        if dt <= 1e-6: return False
        if np.hypot(b[0] - a[0], b[1] - a[1]) > VMAX * dt + 1e-9: return False
        f = np.linspace(0, 1, self.SUB + 1)[1:]
        pts = a[None] + f[:, None] * (b - a)[None]
        x, y, t = pts[:, 0], pts[:, 1], pts[:, 2]
        if np.any((x < R_ROB) | (y < R_ROB) | (x > SIZE - R_ROB) | (y > SIZE - R_ROB)): return False
        ox = obs[None, :, 0] + obs[None, :, 2] * t[:, None]; oy = obs[None, :, 1] + obs[None, :, 3] * t[:, None]
        rr = obs[None, :, 4] + R_ROB + self.MARGIN
        if a[2] == 0.0:
            # arête qui part du robot : s'il est déjà dans la marge d'un obstacle, on exige seulement de ne pas
            # s'en approcher davantage (sinon aucune arête ne part du robot dès qu'une personne est proche)
            d0 = np.hypot(a[0] - obs[:, 0], a[1] - obs[:, 1])
            rr = np.minimum(rr, np.maximum(d0 - 0.02, obs[:, 4] + R_ROB)[None])
        return not np.any((x[:, None] - ox) ** 2 + (y[:, None] - oy) ** 2 < rr ** 2)

    def _free_pt(self, p, obs):
        x, y, t = p
        if x < R_ROB or y < R_ROB or x > SIZE - R_ROB or y > SIZE - R_ROB: return False
        ox = obs[:, 0] + obs[:, 2] * t; oy = obs[:, 1] + obs[:, 3] * t
        return not np.any((x - ox) ** 2 + (y - oy) ** 2 < (obs[:, 4] + R_ROB + self.MARGIN) ** 2)

    def _reference(self, s, D):
        """Chemin de référence : descente du champ de distance au but, à la vitesse maximale."""
        pts = [s[:2].copy()]; p = s[:2].copy(); step = 0.1
        for _ in range(int(VMAX * self.Tg / step) + 1):
            best, bd = p, lookup(D, np.array([p[0]]), np.array([p[1]]))[0]
            for a in np.linspace(-np.pi, np.pi, 16, endpoint=False):
                q = p + 0.25 * np.array([np.cos(a), np.sin(a)])
                d = lookup(D, np.array([q[0]]), np.array([q[1]]))[0]
                if d < bd - 1e-9: best, bd = q, d
            if best is p: break
            dirv = best - p; p = p + step * dirv / max(np.linalg.norm(dirv), 1e-9); pts.append(p.copy())
        return np.array(pts)

    def _goals(self, s, D, obs, routes=()):
        goals = []
        for ref in [self._reference(s, D)] + [r for r in routes]:
            goals += self._goals_on(s, ref, obs)
        return goals

    def _goals_on(self, s, ref, obs):
        # point de la route le plus proche du robot, puis la suite
        i0 = int(np.argmin(np.hypot(ref[:, 0] - s[0], ref[:, 1] - s[1])))
        ref = np.concatenate([s[None, :2], ref[i0 + 1:]]) if i0 + 1 < len(ref) else np.stack([s[:2], ref[-1]])
        L = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(ref, axis=0).T))])
        goals = []
        nl, nt = self.GRID
        for fl in np.linspace(0.6, 1.0, nl):
            d = min(fl * VMAX * self.Tg, L[-1])
            i = int(np.searchsorted(L, d)); i = min(i, len(ref) - 1)
            j = min(i + 1, len(ref) - 1); k = max(i - 1, 0)
            tg = ref[j] - ref[k]; n = np.array([-tg[1], tg[0]]) / max(np.linalg.norm(tg), 1e-9)
            for lat in np.linspace(-1.0, 1.0, nt):
                g = np.array([*(ref[i] + lat * n), self.Tg])
                if self._free_pt(g, obs): goals.append((g, d, abs(lat)))
        return goals

    def plan(self, s, obs, D, routes=()):
        start = np.array([s[0], s[1], 0.0])
        goals = self._goals(s, D, obs, routes)
        guards = [start]; conns = []          # conns : (i_guard_a, j_guard_or_goal, noeud, est_cible)
        goal_pts = [g[0] for g in goals]
        # échantillons : noeuds propagés du cycle précédent (section IV-H), puis tirages neufs
        cand = [np.array([p[0], p[1], p[2] - DT]) for p in self.prev_nodes if p[2] - DT > 0.05]
        for _ in range(self.N_SAMPLES):
            t = self.rng.uniform(0.1, self.Tg - 0.05)
            r = VMAX * t * np.sqrt(self.rng.uniform()); a = self.rng.uniform(-np.pi, np.pi)
            cand.append(np.array([s[0] + r * np.cos(a), s[1] + r * np.sin(a), t]))
        kept = []
        for q in cand:
            if not self._free_pt(q, obs): continue
            vis = [i for i, g in enumerate(guards) if (g[2] < q[2] and self._free_seg(g, q, obs)) or
                   (g[2] > q[2] and self._free_seg(q, g, obs))]
            vis_goal = [i for i, g in enumerate(goal_pts) if self._free_seg(q, g, obs)]
            if not vis:
                guards.append(q); kept.append(q)
            elif len(vis) == 1 and vis_goal:
                # connecteur entre un gardien et une cible (chaque noeud ne mène qu'à une cible, la plus proche
                # du point de référence)
                jg = min(vis_goal, key=lambda j: goals[j][2])
                conns.append((vis[0], ('g', jg), q)); kept.append(q)
            elif len(vis) == 2:
                conns.append((vis[0], vis[1], q)); kept.append(q)
        self.prev_nodes = kept
        # chemins : départ -> (gardiens / connecteurs) -> cible, temps croissants (recherche en profondeur)
        paths = []
        for j, g in enumerate(goal_pts):          # arête directe départ -> cible
            if self._free_seg(start, g, obs): paths.append([start, g])
        adj = {}
        for a, b, q in conns:
            adj.setdefault(a, []).append((b, q))
            if not isinstance(b, tuple): adj.setdefault(b, []).append((a, q))

        def dfs(u, path, depth):
            if depth > 4 or len(paths) > 200: return
            for b, q in adj.get(u, []):
                if q[2] <= path[-1][2]: continue
                if isinstance(b, tuple):
                    paths.append(path + [q, goal_pts[b[1]]])
                else:
                    gb = guards[b]
                    if gb[2] > q[2] and all(gb is not p for p in path): dfs(b, path + [q, gb], depth + 1)
        dfs(0, [start], 0)
        if not paths: return []
        times = np.arange(1, int(round(self.Tg / DT)) + 1) * DT
        cands = []
        for pth in paths:
            pa = np.array(pth); pos = sample_path(pa, times)
            gend = pa[-1]
            cost = np.hypot(*np.diff(pa[:, :2], axis=0).T).sum() + 2.0 * lookup(D, np.array([gend[0]]), np.array([gend[1]]))[0]
            cands.append((cost, pos))
        cands.sort(key=lambda c: c[0])
        tfine = np.arange(1, int(round(self.Tg / 0.05)) + 1) * 0.05
        sel = []
        for cost, pos in cands:
            pf = np.stack([np.interp(tfine, times, pos[:, 0], left=s[0]), np.interp(tfine, times, pos[:, 1], left=s[1])], -1)
            pf = np.concatenate([s[None, :2], pf])
            tt = np.concatenate([[0], tfine])
            if all(not same_class(pf, q, obs, tt) for _, q in sel):
                sel.append((pos, pf))
            if len(sel) == self.P: break
        return [p for p, _ in sel]


# ============================================================ T-MPC++
class TMPC(MPPI):
    """T-MPC++ (de Groot et al., T-RO 2024) avec planificateurs locaux MPPI. Voir ADAPTATIONS."""
    name = 'T-MPC++ (de Groot et al., T-RO 2024)'
    N = 128
    C_CONS = 0.75           # tableau I
    W_H = 1000.0            # pénalité de contrainte d'homotopie
    H_RANGE = 4.0
    non_guided = True       # T-MPC++

    def reset(self, static, goal):
        super().reset(static, goal)
        self.guidance = GuidancePlanner(self.T * DT, np.random.default_rng(1))
        self.guidance.MARGIN = getattr(self, 'guidance_margin', GuidancePlanner.MARGIN)
        self.plans = []            # dict(g=positions guides (T, 2) ou None, U)
        self.Ufree = self.U.copy()
        self.prev_exec = None      # trajectoire exécutée au cycle précédent (T, 2)
        self.switches = 0; self.last_cls = None
        self.times = np.arange(1, self.T + 1) * DT
        self.k_routes = 0; self.routes = []

    def ideal_cost(self, s):
        """Coût de navigation qu'une trajectoire idéale ne peut pas éviter (voir ADAPTATIONS)."""
        n0 = lookup(self.D, np.array([s[0]]), np.array([s[1]]))[0]
        ideal = np.maximum(0.0, n0 - VMAX * self.times)
        return 8.0 * ideal[-1] + 0.4 * ideal.sum()

    def h_penalty(self, s, U, g, obs):
        """Contraintes d'homotopie (éq. 8), beta = 0 : rester du côté du guide par rapport à chaque obstacle."""
        tr = rollout(s, U)[..., :2]                       # (N, T, 2)
        O = obstacle_tracks(obs, self.times)              # (T, M, 2)
        A = O - g[:, None, :]; nA = np.linalg.norm(A, axis=-1, keepdims=True)
        near = (nA[..., 0] < self.H_RANGE)
        A = A / np.maximum(nA, 1e-9)
        b = (A * O).sum(-1)                               # A_k^T o_k
        viol = (tr[:, :, None, :] * A[None]).sum(-1) - b[None]   # A x - b > 0 : violation
        viol = np.where(near[None], np.maximum(viol, 0.0), 0.0)
        tw = 0.97 ** np.arange(self.T)
        return self.W_H * ((viol > 0).any(-1) * tw).sum(-1) + 300.0 * ((viol ** 2).sum(-1) * tw).sum(-1)

    def local_step(self, s, Unom, obs, g):
        eps = self.rng.normal(0, 1, (self.N, self.T, 2)) * self.SIG
        U = Unom[None] + eps; U[0] = Unom; U[1] = 0.0
        U[..., 0] = np.clip(U[..., 0], 0, VMAX); U[..., 1] = np.clip(U[..., 1], -WMAX, WMAX)
        J = self.eval_cost(s, U, obs)
        if g is not None: J = J + self.h_penalty(s, U, g, obs)
        lam = max(1e-6, (np.percentile(J, 10) - J.min()) / 2.0)
        w = np.exp(-(J - J.min()) / lam); w /= w.sum()
        return (w[:, None, None] * U).sum(0)

    def act(self, t, s, obs):
        # routes globales distinctes entre obstacles fixes (extension, voir ADAPTATIONS), recalculées chaque seconde
        if self.k_routes % 10 == 0:
            st = obs[obs[:, 5] == 0]
            self.routes = P.diverse_guides(s, self.goal, st, 3)[1:]
        self.k_routes += 1
        guides = self.guidance.plan(s, obs, self.D, self.routes)
        tt = np.concatenate([[0], self.times])
        new = []
        for g in guides:
            pg = np.concatenate([s[None, :2], g])
            # identité : planificateur du cycle précédent dans la même classe (éq. 7)
            Uw = None
            for m in self.plans:
                if m['g'] is not None and len(m['g']) == len(g):
                    gs = np.concatenate([m['g'][1:], m['g'][-1:]])
                    if same_class(pg, np.concatenate([s[None, :2], gs]), obs, tt): Uw = m['U']; break
            Ug = timed_controls(s, g, self.T)
            if Uw is not None:
                Js = self.eval_cost(s, np.stack([Uw, Ug]), obs) + self.h_penalty(s, np.stack([Uw, Ug]), g, obs)
                Ug = Uw if Js[0] <= Js[1] else Ug
            new.append(dict(g=g, U=self.local_step(s, Ug, obs, g)))
        if self.non_guided or not new:
            self.Ufree = self.local_step(s, self.Ufree, obs, None)
            new.append(dict(g=None, U=self.Ufree))
        self.plans = new
        Us = np.stack([m['U'] for m in new])
        J = self.eval_cost(s, Us, obs) - self.ideal_cost(s)
        J = np.maximum(J, 0.0)
        trs = rollout(s, Us)[..., :2]
        w = np.ones(len(new))
        if self.prev_exec is not None:
            pe = np.concatenate([s[None, :2], self.prev_exec[1:], self.prev_exec[-1:]])
            for i in range(len(new)):
                if same_class(np.concatenate([s[None, :2], trs[i]]), pe, obs, tt): w[i] = self.C_CONS
        i = int(np.argmin(w * J))
        if self.prev_exec is not None and w[i] == 1.0: self.switches += 1
        self.prev_exec = trs[i]
        self.chosen_g = new[i]['g'] if new[i]['g'] is not None else trs[i]
        u = Us[i, 0].copy()
        for m in new: m['U'] = np.roll(m['U'], -1, 0); m['U'][-1] = m['U'][-2]
        self.Ufree = np.roll(self.Ufree, -1, 0); self.Ufree[-1] = self.Ufree[-2]
        return u


class TMPCSmith(SmithMixin, TMPC):
    name = 'T-MPC++ + prédicteur de Smith'


# ============================================================ DRA-MPPI : probabilité de collision exacte
def _cp_table(amax=60.0, bmax=40.0, step=0.05, rho_step=0.005):
    """P(||X|| <= b) pour X ~ N((a, 0), I) en 2D : table sur (a, b).
    P = int_0^b rho exp(-(rho² + a²)/2) I0(a rho) d rho (loi du chi-deux non centrée, 2 degrés)."""
    A = np.arange(0, amax + 1e-9, step); B = np.arange(0, bmax + 1e-9, step)
    rho = np.arange(0, bmax + 1e-9, rho_step)
    tab = np.empty((len(A), len(B)))
    for i, a in enumerate(A):
        x = a * rho
        # log I0 : exact sous 50, développement asymptotique au-delà
        logi0 = np.where(x < 50, np.log(np.i0(np.minimum(x, 50))),
                         x - 0.5 * np.log(2 * np.pi * np.maximum(x, 1e-9)) + np.log1p(1 / (8 * np.maximum(x, 1e-9)) + 9 / (128 * np.maximum(x, 1e-9) ** 2)))
        f = rho * np.exp(-(rho ** 2 + a * a) / 2 + logi0)
        c = np.concatenate([[0], np.cumsum((f[1:] + f[:-1]) / 2 * rho_step)])
        tab[i] = np.interp(B, rho, c)
    return A, B, np.clip(tab, 0, 1)


_CP = _cp_table()   # précalculée au chargement, pour ne pas compter ce calcul dans le temps de décision


def collision_prob(d, r, sig):
    """Probabilité que le centre d'un obstacle, de position N(mu, sig² I), tombe à moins de r du robot,
    d = ||mu - robot||. Tableaux numpy de même forme."""
    global _CP
    if _CP is None: _CP = _cp_table()
    A, B, tab = _CP
    a = d / sig; b = r / sig
    out = np.zeros(np.broadcast(a, b).shape)
    a = np.broadcast_to(a, out.shape); b = np.broadcast_to(b, out.shape)
    far = a - b > 9.0; inside = b - a > 9.0
    out[inside] = 1.0
    m = ~(far | inside)
    am, bm = np.clip(a[m], 0, A[-1]), np.clip(b[m], 0, B[-1])
    st = A[1] - A[0]
    ia = np.minimum((am / st).astype(int), len(A) - 2); ib = np.minimum((bm / st).astype(int), len(B) - 2)
    fa = am / st - ia; fb = bm / st - ib
    out[m] = ((1 - fa) * (1 - fb) * tab[ia, ib] + fa * (1 - fb) * tab[ia + 1, ib] +
              (1 - fa) * fb * tab[ia, ib + 1] + fa * fb * tab[ia + 1, ib + 1])
    return out


class DRAMPPI(MPPI):
    """DRA-MPPI (Trevisan et al., IROS 2025). Voir ADAPTATIONS."""
    name = 'DRA-MPPI (Trevisan et al., IROS 2025)'
    N = 400                 # section V-B
    SIGMA = 0.05            # seuil de probabilité de collision, section V-B
    VAR_RATE = 0.3 ** 2 * 0.2   # Sigma_w dt : variance de position par seconde (section V-A)
    W_SOFT = 1000.0         # non publiés : réglés sur les mondes de développement
    W_HARD = 3000.0

    def risk(self, tr, obs):
        mob = obs[:, 5] > 0
        if not mob.any(): return np.zeros(tr.shape[:-2]), np.zeros(tr.shape[:-1])
        o = obs[mob]; t = np.arange(1, self.T + 1) * DT
        mu = o[None, :, :2] + o[None, :, 2:4] * t[:, None, None]       # (T, M, 2)
        sig = np.sqrt(self.VAR_RATE * t)[:, None]                          # (T, 1)
        d = np.sqrt(((tr[..., :, None, :2] - mu) ** 2).sum(-1))           # (..., T, M)
        p = collision_prob(d, o[:, 4] + R_ROB, sig)
        pj = 1 - np.prod(1 - p, axis=-1)                                   # éq. 9
        c = (self.W_SOFT * pj + self.W_HARD * (pj > self.SIGMA)).sum(-1)
        return c, pj

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        tr = self._roll(s, U)
        st = obs[obs[:, 5] == 0]
        c = obstacle_cost(tr, predict(st, self.T), st[:, 4])      # fixes et murs : déterministe
        nav = lookup(self.D, tr[..., 0], tr[..., 1])
        c = c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)
        return c + self.risk(tr, obs)[0]


class DRAMPPISmith(SmithMixin, DRAMPPI):
    name = 'DRA-MPPI + prédicteur de Smith'


P.ALL += [TMPCSmith, DRAMPPISmith, TMPC, DRAMPPI]


# ------------------------------------------------------------ variantes de réglage (même budget pour chaque référence)
def _variant(base, label, **kw):
    return type(base.__name__ + '_' + label, (base,), dict(kw, name=base.name + ' [' + label + ']'))


TUNING = ([_variant(DRAMPPISmith, f'soft{ws}_hard{wh}', W_SOFT=ws, W_HARD=wh)
           for ws, wh in [(300.0, 3000.0), (3000.0, 3000.0), (1000.0, 10000.0)]] +
          [_variant(TMPCSmith, f'h{wh}', W_H=wh) for wh in [300.0, 3000.0]] +
          [_variant(TMPCSmith, 'marge0.2', W_H=1000.0)])
TUNING[-1].guidance_margin = 0.2
P.ALL += TUNING
