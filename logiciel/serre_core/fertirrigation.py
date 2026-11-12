"""Pilotage de la fertirrigation.

Deux circuits indépendants (un par compartiment) pour qu'une contamination
racinaire ne puisse pas passer d'un compartiment à l'autre.

* Compartiment fruits : goutte-à-goutte sur substrat, déclenché par somme de
  rayonnement, ajusté sur le pourcentage de drainage mesuré par la balance.
* Compartiment feuilles : radeaux flottants, surveillance EC/pH/O2/T et
  corrections par petites doses.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ParametresIrrigation:
    seuil_j_cm2: float = 100.0         # somme de rayonnement extérieur entre deux arrosages
    seuil_min: float = 50.0
    seuil_max: float = 200.0
    volume_ml_par_goutteur: float = 150.0
    drainage_cible_pct: float = 25.0
    tolerance_drainage_pct: float = 5.0
    intervalle_min_s: int = 20 * 60
    rayonnement_debut_w_m2: float = 50.0
    premier_arrosage_j_cm2: float = 30.0


@dataclass
class EtatIrrigation:
    somme_j_cm2: float = 0.0
    dernier_arrosage_s: float | None = None
    arrosages_du_jour: int = 0
    deja_premier: bool = False
    historique: list[tuple[float, float]] = field(default_factory=list)


class PiloteIrrigation:
    def __init__(self, params: ParametresIrrigation | None = None):
        self.p = params or ParametresIrrigation()
        self.e = EtatIrrigation()

    def nouveau_jour(self) -> None:
        self.e.somme_j_cm2 = 0.0
        self.e.arrosages_du_jour = 0
        self.e.deja_premier = False

    def pas(self, t_s: float, rayonnement_w_m2: float, dt_s: float) -> bool:
        """Accumule le rayonnement. Renvoie True s'il faut arroser maintenant."""
        if rayonnement_w_m2 < self.p.rayonnement_debut_w_m2:
            return False
        self.e.somme_j_cm2 += rayonnement_w_m2 * dt_s / 1e4
        seuil = self.p.premier_arrosage_j_cm2 if not self.e.deja_premier else self.p.seuil_j_cm2
        trop_tot = (
            self.e.dernier_arrosage_s is not None
            and t_s - self.e.dernier_arrosage_s < self.p.intervalle_min_s
        )
        if self.e.somme_j_cm2 >= seuil and not trop_tot:
            self.e.somme_j_cm2 = 0.0
            self.e.dernier_arrosage_s = t_s
            self.e.arrosages_du_jour += 1
            self.e.deja_premier = True
            return True
        return False

    def ajuster_sur_drainage(self, drainage_pct: float) -> float:
        """Ajuste le seuil de rayonnement selon le drainage mesuré.

        Trop peu de drainage : le substrat se concentre en sels, on arrose plus
        souvent. Trop de drainage : gaspillage d'eau et d'engrais, on espace.
        """
        p = self.p
        if drainage_pct < p.drainage_cible_pct - p.tolerance_drainage_pct:
            p.seuil_j_cm2 *= 0.9
        elif drainage_pct > p.drainage_cible_pct + p.tolerance_drainage_pct:
            p.seuil_j_cm2 *= 1.1
        p.seuil_j_cm2 = max(p.seuil_min, min(p.seuil_max, p.seuil_j_cm2))
        self.e.historique.append((drainage_pct, p.seuil_j_cm2))
        return p.seuil_j_cm2


@dataclass
class ParametresDosage:
    ec_tolerance: float = 0.1
    ph_tolerance: float = 0.2
    ml_par_dose_ab: float = 20.0
    ml_par_dose_acide: float = 5.0
    doses_max_par_cycle: int = 5
    attente_melange_s: int = 300


@dataclass
class ActionDosage:
    dose_a_ml: float = 0.0
    dose_b_ml: float = 0.0
    dose_acide_ml: float = 0.0
    dose_base_ml: float = 0.0
    appoint_eau: bool = False
    alertes: list[str] = field(default_factory=list)


def corriger_solution(ec: float, ph: float, ec_cible: float, ph_cible: float,
                      dernier_dosage_s: float | None, t_s: float,
                      p: ParametresDosage | None = None) -> ActionDosage:
    """Corrections par petites doses, jamais plus d'une famille à la fois.

    On corrige d'abord l'EC (les engrais modifient le pH), puis le pH au cycle
    suivant, après le temps de mélange. Les doses sont proportionnelles à
    l'écart mais plafonnées : un capteur défaillant ne peut pas vider la cuve
    d'acide dans le bassin.
    """
    p = p or ParametresDosage()
    a = ActionDosage()
    if dernier_dosage_s is not None and t_s - dernier_dosage_s < p.attente_melange_s:
        return a
    if not (0.0 < ec < 6.0) or not (3.0 < ph < 9.5):
        a.alertes.append("mesure EC/pH incohérente : dosage suspendu, vérifier les sondes")
        return a

    ecart_ec = ec_cible - ec
    if ecart_ec > p.ec_tolerance:
        n = min(p.doses_max_par_cycle, max(1, round(ecart_ec / 0.1)))
        a.dose_a_ml = a.dose_b_ml = n * p.ml_par_dose_ab
        return a
    if ecart_ec < -p.ec_tolerance:
        a.appoint_eau = True
        if ecart_ec < -0.8:
            a.alertes.append("EC très au-dessus de la consigne : accumulation de sels, prévoir un renouvellement partiel")
        return a

    ecart_ph = ph - ph_cible
    if ecart_ph > p.ph_tolerance:
        n = min(p.doses_max_par_cycle, max(1, round(ecart_ph / 0.1)))
        a.dose_acide_ml = n * p.ml_par_dose_acide
    elif ecart_ph < -p.ph_tolerance:
        n = min(p.doses_max_par_cycle, max(1, round(-ecart_ph / 0.1)))
        a.dose_base_ml = n * p.ml_par_dose_acide
    return a


def surveiller_bassin(o2_mg_l: float, t_solution: float, t_max: float) -> list[str]:
    alertes = []
    if o2_mg_l < 5.0:
        alertes.append(f"oxygène dissous bas ({o2_mg_l:.1f} mg/L) : vérifier le surpresseur et les diffuseurs")
    if t_solution > t_max:
        alertes.append(f"solution trop chaude ({t_solution:.1f} °C > {t_max} °C) : risque Pythium, activer le refroidissement de cuve")
    return alertes
