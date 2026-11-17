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
            e = self.tr.e.get(int(row[6]))
            if e is not None: v[k] = max(self.VAR_RATE, (e / RAYLEIGH) ** 2)
        return v

    def risk(self, tr, obs):
        mob = obs[:, 5] > 0
        if not mob.any(): return np.zeros(tr.shape[:-2])
        o = obs[mob]; t = np.arange(1, self.T + 1) * DT
        mu = o[None, :, :2] + o[None, :, 2:4] * t[:, None, None]          # (T, M, 2)
        sig = np.sqrt(self.var_rates(o)[None, :] * t[:, None])              # (T, M)
        d = np.sqrt(((tr[..., :, None, :2] - mu) ** 2).sum(-1))             # (..., T, M)
        p = REF.collision_prob(d, o[:, 4] + R_ROB, sig)
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
        return c + self.risk(tr, obs)


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
