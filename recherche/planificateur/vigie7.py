"""VIGIE 7 : quatre idées propres à VIGIE (PLAN_SEANCE8.md, sections 8 et 9).

Diagnostic de départ (porte étroite, piétons à forces sociales, graines de développement 7001 et 7003) : VIGIE 6
s'arrête à 1,4 m du mur et attend 35 s qu'un flux continu s'interrompe ; T-MPC++ passe en 10 à 20 s en longeant
le bord de l'ouverture. Chaque idée est un mélange (mixin) ajouté à VIGIE 6, testable seule ou avec les autres.

A. Budget d'échec : le risque de choc accepté augmente avec le risque d'arriver hors délai.
B. Créneaux d'un flux : une option qui se place au bord du passage et part au créneau prévu par la statistique
   des passages observés.
C. Prédiction multi-modèles : chaque personne est prédite par trois modèles (vitesse constante, ralentissement,
   forces sociales entre personnes), pondérés en ligne par leur justesse récente sur cette personne.
D. Engagement réversible : une option n'est retenue que si, après sa première seconde, le robot peut encore
   freiner jusqu'à l'arrêt sans risque ; sinon elle est pénalisée.
"""
from collections import deque
import numpy as np
import planners as P
import vigie_risque as VR
import references as REF
from sim import DT, R_ROB, T_MAX, VMAX

AMAX = getattr(P, 'AMAX', 1.0)


# ---------------------------------------------------------------- A. budget d'échec
class BudgetEchecMixin:
    """Le banc compte comme échec un choc aussi bien qu'un temps dépassé. VIGIE 6 ne pèse que le premier ; attendre
    ne lui coûte qu'un peu de lenteur, si bien que devant un flux continu il attend jusqu'à la fin du temps.
    Modèle d'attente : si le robot n'a pas progressé depuis w secondes, l'attente restante suit une loi exponentielle
    de moyenne w (l'estimation la plus simple quand on ne sait rien d'autre). Avec m la marge de temps une fois le
    trajet restant fait à vitesse de croisière, P(retard) = exp(-m / w).
    Pour chaque trajectoire essayée, on calcule le P(retard) où elle laisserait le robot au bout de l'horizon (distance
    restante, attente prolongée si elle ne progresse pas de 0,3 m) et on l'ajoute au coût avec le poids d'un choc
    certain sur tout l'horizon : choc et retard sont ainsi comptés dans la même unité, une probabilité d'échec."""
    V_CROISIERE = 0.8
    PROGRES = 0.3            # progression (m) qui remet l'attente à zéro
    F_RETARD = 1.0           # part du poids d'un choc certain donnée au retard (1 : même unité exacte)

    def reset(self, static, goal):
        super().reset(static, goal)
        self._p_retard = 0.0; self._best_d = None; self._t_prog = 0.0; self._tnow = 0.0; self._d0 = None

    def maj_retard(self, t, s):
        d = float(P.lookup(self.D, np.array([s[0]]), np.array([s[1]]))[0])
        if self._best_d is None or d < self._best_d - self.PROGRES: self._best_d = d; self._t_prog = t
        self._tnow = t; self._d0 = d
        w = max(t - self._t_prog, 0.5)
        marge = (T_MAX - t) - d / self.V_CROISIERE
        self._p_retard = 1.0 if marge <= 0 else float(np.exp(-marge / w))

    def act(self, t, s, obs):
        self.maj_retard(t, s)
        return super().act(t, s, obs)

    def p_retard_fin(self, s, U):
        """P(retard) à la fin de l'horizon, pour chaque trajectoire de commandes U (..., T, 2)."""
        tr = self._roll(s, U)
        d_end = P.lookup(self.D, tr[..., -1, 0], tr[..., -1, 1])
        h = self.T * DT
        w = np.where(self._d0 - d_end > self.PROGRES, 0.5, max(self._tnow - self._t_prog, 0.0) + h)
        marge = (T_MAX - self._tnow - h) - d_end / self.V_CROISIERE
        return np.where(marge <= 0, 1.0, np.exp(-np.maximum(marge, 0) / np.maximum(w, 0.5)))

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        c = super().eval_cost(s, U, obs, scen, guide)
        if self._d0 is None: return c
        poids = self.F_RETARD * self.T * (self.W_SOFT + self.W_HARD) * self.DISC ** (self.T / 2)   # choc certain sur tout l'horizon
        return c + poids * self.p_retard_fin(s, U)


# ---------------------------------------------------------------- C. prédiction multi-modèles
SFM_A, SFM_B, SFM_TAU = 2.1, 0.3, 0.5          # mêmes ordres de grandeur que Helbing et Molnár (1995)
TAU_RALENTI = 1.0


def sfm_predire(p, v, r, st, T):
    """Futur des personnes p (M, 2), v (M, 2) qui s'évitent entre elles et évitent les obstacles fixes st (K, 3) ;
    chacune garde sa vitesse actuelle comme vitesse voulue. Renvoie (T, M, 2)."""
    M = len(p); out = np.empty((T, M, 2))
    if M == 0: return out
    x = p.copy(); u = v.copy(); v0 = v.copy()
    for k in range(T):
        F = (v0 - u) / SFM_TAU
        if M > 1:
            d = x[:, None] - x[None]; n = np.hypot(d[..., 0], d[..., 1]); np.fill_diagonal(n, np.inf)
            f = SFM_A * np.exp((r[:, None] + r[None] - n) / SFM_B)
            F += (f[..., None] * d / np.maximum(n, 1e-6)[..., None]).sum(1)
        if len(st):
            d = x[:, None] - st[None, :, :2]; n = np.hypot(d[..., 0], d[..., 1])
            f = 3.0 * np.exp((r[:, None] + st[None, :, 2] - n) / 0.2)
            F += (f[..., None] * d / np.maximum(n, 1e-6)[..., None]).sum(1)
        u = u + DT * F
        sp = np.hypot(u[:, 0], u[:, 1]); lim = np.maximum(1.3 * np.hypot(v0[:, 0], v0[:, 1]), 0.6)
        u = np.where((sp > lim)[:, None], u / np.maximum(sp, 1e-9)[:, None] * lim[:, None], u)
        x = x + DT * u; out[k] = x
    return out


class MultiModeleMixin:
    """Trois futurs par personne : vitesse constante (VIGIE 6), ralentissement (la personne freine, constante 1 s)
    et forces sociales entre personnes. Chaque modèle est noté en continu sur chaque personne : on garde l'état de
    tout le monde une seconde plus tôt, on le fait avancer selon chaque modèle et on compare à la position mesurée.
    Poids = exp(-erreur² / 2 s²) lissés, avec un plancher de 10 % pour qu'aucun modèle ne disparaisse."""
    S_ERR = 0.25
    PLANCHER = 0.10

    def reset(self, static, goal):
        super().reset(static, goal)
        self._frames = deque(maxlen=20); self._wmod = {}

    def maj_modeles(self, t, obs):
        mob = obs[obs[:, 5] == 1]
        self._frames.append((t, mob.copy()))
        while len(self._frames) > 1 and t - self._frames[0][0] > 1.05: self._frames.popleft()
        t0, old = self._frames[0]
        if abs((t - t0) - 1.0) > 0.15 or not len(old) or not len(mob): return
        n = int(round((t - t0) / DT)); st = obs[obs[:, 5] == 0][:, [0, 1, 4]]
        cv = old[:, :2] + old[:, 2:4] * (t - t0)
        ra = old[:, :2] + old[:, 2:4] * TAU_RALENTI * (1 - np.exp(-(t - t0) / TAU_RALENTI))
        sf = sfm_predire(old[:, :2], old[:, 2:4], old[:, 4], st, max(n, 1))[-1]
        now = {int(o[6]): o[:2] for o in mob}
        for k, o in enumerate(old):
            i = int(o[6])
            if i not in now: continue
            e = np.array([np.hypot(*(now[i] - q[k])) for q in (cv, ra, sf)])
            l = np.exp(-e ** 2 / (2 * self.S_ERR ** 2)) + 1e-6
            w = self._wmod.get(i, np.array([0.6, 0.2, 0.2]))
            w = 0.8 * w + 0.2 * (l / l.sum()); w = np.maximum(w, self.PLANCHER); self._wmod[i] = w / w.sum()

    def act(self, t, s, obs):
        self.maj_modeles(t, obs)
        return super().act(t, s, obs)

    def risk(self, tr, obs, s=None):
        mob = obs[:, 5] > 0
        base = super().risk(tr, obs, s)                      # vitesse constante, fantômes compris
        if not mob.any(): return base
        o = obs[mob]; t = np.arange(1, self.T + 1) * DT
        W = np.array([self._wmod.get(int(i), np.array([0.6, 0.2, 0.2])) for i in o[:, 6]])   # (M, 3)
        st = obs[obs[:, 5] == 0][:, [0, 1, 4]]
        mus = [o[None, :, :2] + o[None, :, 2:4] * (TAU_RALENTI * (1 - np.exp(-t / TAU_RALENTI)))[:, None, None],
               sfm_predire(o[:, :2], o[:, 2:4], o[:, 4], st, self.T)]
        sig = np.sqrt(self.var_rates(o)[None, :] * t[:, None])
        tw = self.DISC ** np.arange(self.T)
        # vitesse constante : déjà dans base ; on recalcule sa probabilité par personne pour le mélange
        mu_cv = o[None, :, :2] + o[None, :, 2:4] * t[:, None, None]
        pm = []
        for mu in [mu_cv] + mus:
            d = np.sqrt(((tr[..., :, None, :2] - mu) ** 2).sum(-1))
            pm.append(REF.collision_prob(d, o[:, 4] + R_ROB, sig))           # (..., T, M)
        p = sum(W[:, k] * pm[k] for k in range(3))
        pj = 1 - np.prod(1 - p, axis=-1)
        p_cv = 1 - np.prod(1 - pm[0], axis=-1)
        mix = ((self.W_SOFT * pj + self.W_HARD * (pj > self.SIGMA)) * tw).sum(-1)
        cv = ((self.W_SOFT * p_cv + self.W_HARD * (p_cv > self.SIGMA)) * tw).sum(-1)
        return base + (mix - cv)                         # on remplace la part « vitesse constante » par le mélange


# ---------------------------------------------------------------- D. engagement réversible
class EngagementMixin:
    """Avant de choisir, chaque option est prolongée ainsi : sa première seconde, puis un freinage franc jusqu'à
    l'arrêt. Le risque de cette manœuvre de secours s'ajoute au coût de l'option. On préfère ainsi les options
    après lesquelles on peut encore renoncer sans heurter personne (engagement réversible)."""
    T_ENGAGE = 10
    W_SECOURS = 1.0

    def secours(self, Us):
        U = np.array(Us, float)
        v = U[:, self.T_ENGAGE - 1, 0].copy()
        for k in range(self.T_ENGAGE, self.T):
            v = np.maximum(v - 1.5 * AMAX * DT, 0.0); U[:, k, 0] = v; U[:, k, 1] = 0.0
        return U

    def select(self, s, Us, obs):
        self._secours_cost = self.W_SECOURS * self.risk(self._roll(s, self.secours(Us)), obs, s)
        try: return super().select(s, Us, obs)
        finally: self._secours_cost = None

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        c = super().eval_cost(s, U, obs, scen, guide)
        sc = getattr(self, '_secours_cost', None)
        if sc is not None and np.shape(sc) == np.shape(c): c = c + sc
        return c


# ---------------------------------------------------------------- B. créneaux d'un flux
class CreneauMixin:
    """Repère le prochain passage étroit sur la route suivie (dégagement aux obstacles fixes sous 0,8 m, dans les
    8 m), note quand il est occupé par quelqu'un (à moins de 0,9 m de son centre) et en tire la durée moyenne des
    occupations. Option ajoutée : rejoindre un point d'attente 1,0 m avant le passage, décalé vers le côté le moins
    fréquenté, y attendre la fin prévue de l'occupation en cours, puis traverser à 1 m/s. L'option n'est qu'une
    proposition : elle est jugée sur le même coût que les autres."""
    OUVERT = 0.8
    PORTEE = 8.0
    R_OCC = 0.9

    def reset(self, static, goal):
        super().reset(static, goal)
        self._passage = None; self._occ = False; self._t_occ = 0.0; self._durees = deque(maxlen=12)

    def trouver_passage(self, s, obs):
        g = getattr(self, 'chosen_g', None)
        st = obs[obs[:, 5] == 0]
        if g is None or not len(st): return None
        g = VR._route_ahead(g, s, 80)
        L = np.r_[0, np.cumsum(np.hypot(*np.diff(g, axis=0).T))]
        g = g[L <= self.PORTEE]
        if len(g) < 3: return None
        c = np.min(np.hypot(g[:, None, 0] - st[None, :, 0], g[:, None, 1] - st[None, :, 1]) - st[None, :, 4], 1)
        k = int(np.argmin(c))
        if c[k] > self.OUVERT or k == 0: return None
        tg = g[min(k + 1, len(g) - 1)] - g[max(k - 1, 0)]; tg = tg / max(np.hypot(*tg), 1e-9)
        return g[k], tg

    def maj_occupation(self, t, obs):
        if self._passage is None: return
        c = self._passage[0]; mob = obs[obs[:, 5] > 0]
        occ = bool(len(mob)) and bool((np.hypot(mob[:, 0] - c[0], mob[:, 1] - c[1]) < self.R_OCC).any())
        if occ and not self._occ: self._t_occ = t
        if not occ and self._occ: self._durees.append(t - self._t_occ)
        self._occ = occ

    def act(self, t, s, obs):
        self._t7 = t
        if not hasattr(self, 'k') or self.k % 10 == 0 or self._passage is None:
            pa = self.trouver_passage(s, obs)
            if pa is not None and (self._passage is None or np.hypot(*(pa[0] - self._passage[0])) > 0.5):
                self._durees.clear(); self._occ = False
            self._passage = pa
        self.maj_occupation(t, obs)
        return super().act(t, s, obs)

    def extra_candidates(self, s, obs):
        out = super().extra_candidates(s, obs)
        if self._passage is None: return out
        c, tg = self._passage; nrm = np.array([-tg[1], tg[0]])
        mob = obs[obs[:, 5] > 0]
        # côté le moins fréquenté : celui où les personnes proches du passage sont les moins nombreuses
        cote = 1.0
        if len(mob):
            near = mob[np.hypot(mob[:, 0] - c[0], mob[:, 1] - c[1]) < 3.0]
            if len(near): cote = -1.0 if ((near[:, :2] - c) @ nrm).mean() > 0 else 1.0
        dec = 0.25 * cote * nrm
        attente = c - 1.0 * tg + dec
        sortie = c + 1.5 * tg + dec
        moy = np.mean(self._durees) if len(self._durees) else 2.0
        t_go = (self._t_occ + moy - self._t7) if self._occ else 0.0
        t_go = float(np.clip(t_go, 0.0, 2.0))
        # trajectoire horodatée : aller au point d'attente à 0,8 m/s, attendre, traverser à 1 m/s
        pts = []; x = s[:2].copy()
        d1 = np.hypot(*(attente - x)); n1 = max(int(d1 / (0.8 * DT)), 1)
        pts += [x + (attente - x) * (k + 1) / n1 for k in range(n1)]
        n_wait = max(int(round(t_go / DT)) - n1, 0); pts += [attente] * n_wait
        d2 = np.hypot(*(sortie - attente)); n2 = max(int(d2 / (1.0 * DT)), 1)
        pts += [attente + (sortie - attente) * (k + 1) / n2 for k in range(n2)]
        gt = np.array(pts)
        U = P.timed_controls(s, gt, self.T)
        return out + [dict(U=U, g=np.vstack([gt, self.goal[None]]), creneau=True)]


# ---------------------------------------------------------------- variantes
class Vigie7A(BudgetEchecMixin, VR.Vigie6):
    name = 'VIGIE 7-A (budget d\'échec)'


class Vigie7B(CreneauMixin, VR.Vigie6):
    name = 'VIGIE 7-B (créneaux d\'un flux)'


class Vigie7C(MultiModeleMixin, VR.Vigie6):
    name = 'VIGIE 7-C (prédiction multi-modèles)'


class Vigie7D(EngagementMixin, VR.Vigie6):
    name = 'VIGIE 7-D (engagement réversible)'


class Vigie7(EngagementMixin, CreneauMixin, MultiModeleMixin, BudgetEchecMixin, VR.Vigie6):
    name = 'VIGIE 7 (A+B+C+D)'


P.ALL += [Vigie7A, Vigie7B, Vigie7C, Vigie7D, Vigie7]   # indices 77 à 81


# Deuxième tour de mise au point (graines 7000 à 7019) : A supprime les temps dépassés mais double les collisions,
# C fait l'inverse. On les associe avec un poids du retard réduit, pour viser les deux à la fois.
class Vigie7AC30(MultiModeleMixin, BudgetEchecMixin, VR.Vigie6):
    name = 'VIGIE 7-AC (retard × 0,3)'
    F_RETARD = 0.3


class Vigie7AC10(MultiModeleMixin, BudgetEchecMixin, VR.Vigie6):
    name = 'VIGIE 7-AC (retard × 0,1)'
    F_RETARD = 0.1


P.ALL += [Vigie7AC30, Vigie7AC10]   # indices 82 et 83
