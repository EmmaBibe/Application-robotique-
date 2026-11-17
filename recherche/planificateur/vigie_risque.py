"""VIGIE 3 avec risque calibré (séance 7).

Le réglage à budget égal a montré deux familles complémentaires : DRA-MPPI (probabilité de collision)
gagne dans les espaces ouverts, VIGIE 3 (routes espace-temps) dans les passages étroits et la foule dense.
On garde donc tout VIGIE 3 et on remplace seulement, pour les personnes, la pénalité de distance
par le coût de risque de DRA-MPPI, avec les poids retenus au réglage (3000 / 3000).

Variante adaptative : l'incertitude de chaque personne suit l'erreur de prédiction réellement observée
sur elle (traqueur de surprise de VIGIE, erreur à 1 s de la vitesse constante). Pour une erreur gaussienne
isotrope de variance s² par axe, l'écart moyen vaut s·sqrt(pi/2) (loi de Rayleigh), d'où
s² = (e / 1,2533)² à 1 s. La valeur publiée de DRA-MPPI reste un plancher."""
import numpy as np
import planners as P
import references as REF
from sim import DT, R_ROB

RAYLEIGH = np.sqrt(np.pi / 2)


class RiskCostMixin:
    W_SOFT = 3000.0
    W_HARD = 3000.0
    SIGMA = REF.DRAMPPI.SIGMA
    VAR_RATE = REF.DRAMPPI.VAR_RATE
    adaptive = False
    DISC = 1.0              # escompte temporel du risque (1 : aucun, comme DRA-MPPI)

    def var_rates(self, o):
        """Variance de position par seconde pour chaque personne de o (lignes mobiles)."""
        v = np.full(len(o), self.VAR_RATE)
        if not self.adaptive or not hasattr(self, 'tr'): return v
        for k, row in enumerate(o):
            if row[6] < 0: continue                                          # fantôme : pas d'historique
            e = self.tr.e.get(int(row[6]))
            if e is not None: v[k] = max(self.VAR_RATE, (e / RAYLEIGH) ** 2)
        return v

    P_EXIST = 0.0           # fantômes d'angle mort dans le risque (0 : non utilisés)
    DELAIS = np.array([0.0, 0.5, 1.0, 1.5])   # délais de sortie d'un fantôme (s)

    def phantom_rows(self, s, obs):
        """Personnes hypothétiques derrière les bords qui masquent une zone libre (perception limitée seulement),
        mises en cache pour l'état du cycle en cours."""
        if self.P_EXIST <= 0 or not getattr(self, 'occl', False): return np.zeros((0, obs.shape[1]))
        key = (s.tobytes(), obs.shape)
        if getattr(self, '_ph_key', None) != key:
            self._ph_key = key; self._ph = P.phantoms(s, obs, getattr(self, 'sense', 5.0))
        return self._ph

    def risk(self, tr, obs, s=None):
        mob = obs[:, 5] > 0
        ph = self.phantom_rows(s, obs) if s is not None else np.zeros((0, obs.shape[1]))
        if not mob.any() and not len(ph): return np.zeros(tr.shape[:-2])
        # chaque fantôme est répété avec un délai de sortie (arrivées de Poisson : probabilité P_EXIST par fenêtre de 0,5 s)
        nph = len(ph); ph = np.repeat(ph, len(self.DELAIS), 0)
        o = np.vstack([obs[mob], ph]); w_ex = np.r_[np.ones(mob.sum()), np.full(len(ph), self.P_EXIST)]
        tau = np.r_[np.zeros(mob.sum()), np.tile(self.DELAIS, nph)]
        t = np.arange(1, self.T + 1) * DT
        mu = o[None, :, :2] + o[None, :, 2:4] * np.maximum(t[:, None] - tau[None, :], 0)[..., None]   # (T, M, 2)
        sig = np.sqrt(self.var_rates(o)[None, :] * t[:, None])              # (T, M)
        d = np.sqrt(((tr[..., :, None, :2] - mu) ** 2).sum(-1))             # (..., T, M)
        present = (t[:, None] >= tau[None, :] - 1e-9)                       # une arrivée n'existe qu'à partir de son instant
        p = REF.collision_prob(d, o[:, 4] + R_ROB, sig) * w_ex * present    # fantômes : pondérés par leur probabilité d'exister
        pj = 1 - np.prod(1 - p, axis=-1)
        tw = self.DISC ** np.arange(self.T)
        return ((self.W_SOFT * pj + self.W_HARD * (pj > self.SIGMA)) * tw).sum(-1)

    def eval_cost(self, s, U, obs, scen=None, guide=None):
        tr = self._roll(s, U)
        st = obs[obs[:, 5] == 0]
        c = P.obstacle_cost(tr, P.predict(st, self.T), st[:, 4])         # fixes et murs : inchangé
        nav = P.lookup(self.D, tr[..., 0], tr[..., 1])
        c = c + 8.0 * nav[..., -1] + 0.4 * nav.sum(-1) + 0.05 * (U[..., 1] ** 2).sum(-1)
        if guide is not None:                                              # suivi de route, comme MPPI.eval_cost
            d = np.sqrt(((tr[..., None, :2] - guide) ** 2).sum(-1)).min(-1)
            c = c + 1.5 * (d ** 2).sum(-1)
        return c + self.risk(tr, obs, s)


class Vigie3R(RiskCostMixin, P.Vigie3):
    name = 'VIGIE 3 + risque calibré'


class Vigie3RA(RiskCostMixin, P.Vigie3):
    name = 'VIGIE 3 + risque calibré adaptatif'
    adaptive = True


P.ALL += [Vigie3R, Vigie3RA]


# réglage à budget égal (quatre configurations, comme pour chaque référence)
REGLAGE = [REF._variant(Vigie3R, 'soft1000', W_SOFT=1000.0), REF._variant(Vigie3R, 'soft300', W_SOFT=300.0),
           REF._variant(Vigie3R, 'escompte0.97', DISC=0.97)]
P.ALL += REGLAGE


class SansPlafondMixin:
    """Retire le plafond de vitesse aux angles morts (PhantomMixin) : le risque des fantômes le remplace."""
    def act(self, t, s, obs):
        return np.array(super(P.PhantomMixin, self).act(t, s, obs), float)


# Une zone seule ne doit jamais déclencher le seuil dur (sinon chaque ouverture devient un mur). Les copies d'un fantôme
# sont espacées de 1,5 m/s x 0,5 s = 0,75 m : le robot (rayon cumulé 0,65 m) en recouvre au plus deux, d'où
# 1 - (1 - p)² < 0,05, soit p < 1 - sqrt(0,95) = 0,0253.
P_MAX_FANTOME = 1 - np.sqrt(1 - REF.DRAMPPI.SIGMA)
DIAG_FANTOMES = [REF._variant(Vigie3R, 'fantômes0.01', P_EXIST=0.01), REF._variant(Vigie3R, 'fantômes0.02', P_EXIST=0.02)]
DIAG_FANTOMES += [type(c.__name__ + '_sp', (SansPlafondMixin, c), dict(name=c.name + ' sans plafond')) for c in DIAG_FANTOMES]
P.ALL += DIAG_FANTOMES
