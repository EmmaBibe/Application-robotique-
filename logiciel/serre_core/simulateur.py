"""Modèle thermique et hydrique simplifié d'une serre de 10 m x 10 m.

Modèle à un nœud (air + végétation + couche superficielle du sol), au pas
d'une minute. Il ne prétend pas à la précision d'un modèle type KASPRO ou
GreenLight ; il sert à comparer des options de conception et à tester le
régulateur avant mise en service. Les ordres de grandeur ont été recoupés
avec les valeurs usuelles de la littérature (coefficients U des couvertures,
taux de ventilation des serres à filets anti-insectes, transpiration d'une
tomate adulte de 2 à 4 L/m²/j).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from . import meteo
from .climat import Commandes, Mesures, ParametresRegulation, RegulateurClimat
from .psychro import hr_depuis_rapport_melange, rapport_melange, sortie_pad, dpv
from .recettes import Consignes

LAMBDA = 2.45e6  # J/kg, chaleur latente de vaporisation
RHO_AIR = 1.02   # kg/m³ à 1 230 m et 25 °C
CP_AIR = 1006.0


@dataclass
class Geometrie:
    surface_sol: float = 100.0
    hauteur_moyenne: float = 5.83      # volume 583 m³
    surface_paroi: float = 314.0       # parois + toiture
    u_paroi: float = 4.0               # W/m²K, double film gonflé
    facteur_ecran_nuit: float = 0.6    # réduction des pertes écran fermé
    transmission: float = 0.70         # double film diffusant + structure
    transmission_ecran_ombrage: float = 0.50
    capacite_kj_m2k: float = 60.0
    echange_sol_w_m2k: float = 3.0
    perte_ciel_nuit_w_m2: float = 10.0


@dataclass
class Equipements:
    debit_nat_base: float = 0.012      # m³/s par m² au sol, ouvrants 100 %, vent nul
    debit_nat_vent: float = 0.004      # par m/s de vent
    facteur_filet: float = 0.6         # perte de débit due au filet anti-insectes
    infiltration: float = 0.0008
    debit_extracteur_etage: float = 0.023
    puissance_extracteur_w: float = 550.0
    efficacite_pad: float = 0.80
    stockage_volume_m3: float = 10.0
    echangeur_w_k: float = 1200.0      # deux aérothermes eau/air
    puissance_aerotherme_w: float = 300.0
    stockage_pertes_w_k: float = 10.0
    avec_stockage: bool = True
    avec_ecran: bool = True
    avec_pad: bool = True


@dataclass
class Bilan:
    t_min: float = 99.0
    t_max: float = -99.0
    heures_sup_30: float = 0.0
    heures_inf_12: float = 0.0
    heures_hr_sup_90: float = 0.0
    transpiration_l: float = 0.0
    eau_pad_l: float = 0.0
    energie_ventilateurs_kwh: float = 0.0
    energie_aerotherme_kwh: float = 0.0
    chaleur_destockee_kwh: float = 0.0
    chaleur_stockee_kwh: float = 0.0
    dpv_moyen_jour: float = 0.0
    trace: list[dict] = field(default_factory=list)


def simuler_jour_type(mois: int, consignes: Consignes, geo: Geometrie | None = None,
                      eq: Equipements | None = None, jours_chauffe: int = 3,
                      garder_trace: bool = False) -> Bilan:
    geo = geo or Geometrie()
    eq = eq or Equipements()
    normales = meteo.charger_normales()
    n = normales[mois]
    params = ParametresRegulation()
    if not eq.avec_pad:
        params.hr_ext_max_evaporatif = -1  # désactive le mode évaporatif
    reg = RegulateurClimat(params)

    t_in = (n.t_max + n.t_min) / 2
    w_in = rapport_melange(t_in, 70)
    t_sto = 20.0
    t_sol = (n.t_max + n.t_min) / 2 + 2.0
    c_sto = eq.stockage_volume_m3 * 1000 * 4186  # J/K
    c_air = geo.capacite_kj_m2k * 1000 * geo.surface_sol
    vol = geo.surface_sol * geo.hauteur_moyenne
    masse_air = vol * RHO_AIR

    bilan = Bilan()
    dt = 60.0
    n_dpv = 0
    for jour in range(jours_chauffe + 1):
        mesure_finale = jour == jours_chauffe
        for minute in range(24 * 60):
            h = minute / 60
            t_ext = meteo.temperature_horaire(n, h)
            hr_ext = meteo.humidite_horaire(n, t_ext)
            w_ext = rapport_melange(t_ext, hr_ext)
            g = meteo.rayonnement_horaire(n, h)
            vent = meteo.vent_horaire(h)
            hr_in = hr_depuis_rapport_melange(t_in, w_in)
            est_jour = g > 5

            if minute % 5 == 0:
                m = Mesures(t_in, hr_in, 420, t_ext, hr_ext, g, vent, False, t_sto, est_jour)
                cmd: Commandes = reg.calculer(m, consignes)
                if not eq.avec_ecran:
                    cmd.ecran_pct = 0
                if not eq.avec_stockage:
                    cmd.stockage_mode = "arret"

            # rayonnement transmis
            tau = geo.transmission
            if cmd.ecran_pct > 0 and est_jour:
                tau *= 1 - (1 - geo.transmission_ecran_ombrage) * cmd.ecran_pct / 100
            q_sol_in = tau * g
            # transpiration (forme simplifiée de Stanghellini)
            deficit = dpv(t_in, hr_in)
            latent = 0.45 * q_sol_in + 25.0 * deficit
            e_transp = latent / LAMBDA  # kg/m²/s
            q_sensible_sol = q_sol_in - latent

            # pertes par la couverture
            u_eff = geo.u_paroi
            if cmd.ecran_pct >= 95 and not est_jour:
                u_eff *= geo.facteur_ecran_nuit
            q_paroi = u_eff * geo.surface_paroi / geo.surface_sol * (t_in - t_ext)
            q_ciel = 0.0 if est_jour else geo.perte_ciel_nuit_w_m2 * (0.4 if cmd.ecran_pct >= 95 else 1.0)
            q_sol = geo.echange_sol_w_m2k * (t_sol - t_in)

            # renouvellement d'air
            if cmd.pad and eq.avec_pad:
                debit = eq.debit_extracteur_etage * cmd.ventilateurs_extraction
                t_entree, hr_entree = sortie_pad(t_ext, hr_ext, eq.efficacite_pad)
                w_entree = rapport_melange(t_entree, hr_entree)
                bilan_eau_pad = debit * RHO_AIR * (w_entree - w_ext) * geo.surface_sol * dt
                if mesure_finale:
                    bilan.eau_pad_l += bilan_eau_pad
                    bilan.energie_ventilateurs_kwh += eq.puissance_extracteur_w * cmd.ventilateurs_extraction * dt / 3.6e6
            else:
                debit = cmd.ouvrant_pct / 100 * (eq.debit_nat_base + eq.debit_nat_vent * vent) * eq.facteur_filet
                t_entree, w_entree = t_ext, w_ext
            debit += eq.infiltration
            q_vent = debit * RHO_AIR * CP_AIR * (t_in - t_entree)

            # stockage thermique
            q_sto = 0.0
            if cmd.stockage_mode == "decharge":
                q_sto = eq.echangeur_w_k * (t_sto - t_in) / geo.surface_sol
            elif cmd.stockage_mode == "charge":
                q_sto = -eq.echangeur_w_k * (t_in - t_sto) / geo.surface_sol
            if cmd.stockage_mode != "arret" and mesure_finale:
                bilan.energie_aerotherme_kwh += eq.puissance_aerotherme_w * dt / 3.6e6
                if q_sto > 0:
                    bilan.chaleur_destockee_kwh += q_sto * geo.surface_sol * dt / 3.6e6
                else:
                    bilan.chaleur_stockee_kwh += -q_sto * geo.surface_sol * dt / 3.6e6
            t_sto -= (q_sto * geo.surface_sol + eq.stockage_pertes_w_k * (t_sto - t_sol)) * dt / c_sto

            # bilan sensible
            q_net = q_sensible_sol + q_sol + q_sto - q_paroi - q_ciel - q_vent
            t_in += q_net * geo.surface_sol * dt / c_air

            # bilan hydrique (condensation sur la paroi si nécessaire)
            w_in += (e_transp * geo.surface_sol * dt - debit * geo.surface_sol * RHO_AIR * (w_in - w_entree) * dt) / masse_air
            t_paroi = (t_in + t_ext) / 2
            w_sat_paroi = rapport_melange(t_paroi, 100)
            if w_in > w_sat_paroi * 1.02:
                w_in -= (w_in - w_sat_paroi * 1.02) * 0.05
            w_sat_in = rapport_melange(t_in, 100)
            w_in = min(w_in, w_sat_in)

            if mesure_finale:
                bilan.t_min = min(bilan.t_min, t_in)
                bilan.t_max = max(bilan.t_max, t_in)
                hr_in = hr_depuis_rapport_melange(t_in, w_in)
                if t_in > 30:
                    bilan.heures_sup_30 += dt / 3600
                if t_in < 12:
                    bilan.heures_inf_12 += dt / 3600
                if hr_in > 90:
                    bilan.heures_hr_sup_90 += dt / 3600
                bilan.transpiration_l += e_transp * geo.surface_sol * dt
                if est_jour:
                    bilan.dpv_moyen_jour += dpv(t_in, hr_in)
                    n_dpv += 1
                if garder_trace and minute % 15 == 0:
                    bilan.trace.append({
                        "h": round(h, 2), "t_ext": round(t_ext, 1), "t_int": round(t_in, 1),
                        "hr_int": round(hr_in, 0), "t_sto": round(t_sto, 1), "rayonnement": round(g),
                        "ouvrant": round(cmd.ouvrant_pct), "ecran": round(cmd.ecran_pct),
                        "mode": cmd.mode, "stockage": cmd.stockage_mode,
                    })
    bilan.dpv_moyen_jour = bilan.dpv_moyen_jour / max(1, n_dpv)
    return bilan
