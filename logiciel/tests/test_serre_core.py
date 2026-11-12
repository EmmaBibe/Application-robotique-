import math
from datetime import date

import pytest

from serre_core import psychro
from serre_core.alarmes import GestionnaireAlarmes
from serre_core.climat import Mesures, RegulateurClimat
from serre_core.energie import decider
from serre_core.fertirrigation import PiloteIrrigation, corriger_solution, surveiller_bassin
from serre_core.recettes import charger_recettes, consignes, consignes_compartiment, stade_courant
from serre_core.simulateur import Equipements, simuler_jour_type


@pytest.fixture(scope="module")
def recettes():
    return charger_recettes()


# --- psychrométrie -------------------------------------------------------

def test_pression_saturante_25c():
    assert psychro.pression_vapeur_saturante(25) == pytest.approx(3.17, abs=0.02)


def test_dpv_nul_a_saturation():
    assert psychro.dpv(22, 100) == pytest.approx(0.0, abs=1e-9)


def test_point_de_rosee():
    assert psychro.point_de_rosee(25, 60) == pytest.approx(16.7, abs=0.3)


def test_temperature_humide_stull():
    # valeur de référence publiée par Stull : 20 °C / 50 % -> 13,7 °C
    assert psychro.temperature_humide(20, 50) == pytest.approx(13.7, abs=0.2)


def test_pad_refroidit_air_sec():
    t, hr = psychro.sortie_pad(32, 35, 0.8)
    assert 21 < t < 25
    assert hr > 70


# --- recettes -----------------------------------------------------------------

def test_toutes_les_recettes_sont_coherentes(recettes):
    for nom, rc in recettes["cultures"].items():
        for s in rc["stades"]:
            assert s["t_jour"] >= s["t_nuit"], nom
            assert s["dpv_min"] < s["dpv_max"], nom
            assert 5.0 <= s["ph"] <= 7.0, nom


def test_stade_courant(recettes):
    rc = recettes["cultures"]["tomate"]
    assert stade_courant(rc, date(2026, 1, 1), date(2026, 1, 3)) == "germination"
    assert stade_courant(rc, date(2026, 1, 1), date(2026, 3, 15)) == "production"


def test_fusion_compartiment_prend_la_plage_commune(recettes):
    lots = [
        {"culture": "epinard", "date_semis": date(2026, 1, 1)},
        {"culture": "amarante", "date_semis": date(2026, 1, 1)},
    ]
    c = consignes_compartiment(recettes, lots, date(2026, 1, 30))
    assert c.t_solution_max == 21  # l'épinard impose la solution la plus fraîche


# --- régulation climat -------------------------------------------------------

def _m(**kw):
    base = dict(t_int=22, hr_int=70, co2_ppm=420, t_ext=20, hr_ext=60, rayonnement_ext=400,
                vent_m_s=2, pluie=False, t_stockage=25, jour=True)
    base.update(kw)
    return Mesures(**base)


def test_aeration_proportionnelle(recettes):
    c = consignes(recettes, "tomate", "production")
    cmd = RegulateurClimat().calculer(_m(t_int=c.t_ventilation(True) + 2, hr_ext=80), c)
    assert 40 <= cmd.ouvrant_pct <= 60


def test_vent_violent_ferme_les_ouvrants(recettes):
    c = consignes(recettes, "tomate", "production")
    cmd = RegulateurClimat().calculer(_m(t_int=35, hr_ext=80, vent_m_s=16), c)
    assert cmd.ouvrant_pct == 0


def test_mode_evaporatif_par_temps_sec(recettes):
    c = consignes(recettes, "tomate", "production")
    cmd = RegulateurClimat().calculer(_m(t_int=31, t_ext=32, hr_ext=30, rayonnement_ext=900), c)
    assert cmd.mode == "evaporatif" and cmd.pad and cmd.ouvrant_pct == 0


def test_ecran_ferme_par_nuit_froide(recettes):
    c = consignes(recettes, "tomate", "production")
    cmd = RegulateurClimat().calculer(_m(jour=False, t_int=14, t_ext=8, rayonnement_ext=0, t_stockage=24), c)
    assert cmd.ecran_pct >= 95
    assert cmd.stockage_mode == "decharge"


def test_co2_pas_injecte_ouvrants_ouverts(recettes):
    c = consignes(recettes, "tomate", "production")
    cmd = RegulateurClimat().calculer(_m(t_int=30, hr_ext=80, co2_ppm=380), c)
    assert cmd.ouvrant_pct > 10 and not cmd.co2


# --- fertirrigation -----------------------------------------------------------

def test_irrigation_somme_rayonnement():
    p = PiloteIrrigation()
    declenchements = sum(p.pas(t, 600, 60) for t in range(0, 6 * 3600, 60))
    # 600 W/m² pendant 6 h = 1 296 J/cm² -> une douzaine d'arrosages
    assert 10 <= declenchements <= 14


def test_ajustement_drainage():
    p = PiloteIrrigation()
    s0 = p.p.seuil_j_cm2
    assert p.ajuster_sur_drainage(10) < s0
    assert p.ajuster_sur_drainage(40) == pytest.approx(s0 * 0.9 * 1.1)


def test_dosage_ec_avant_ph():
    a = corriger_solution(ec=1.5, ph=6.8, ec_cible=2.0, ph_cible=5.8, dernier_dosage_s=None, t_s=0)
    assert a.dose_a_ml > 0 and a.dose_acide_ml == 0


def test_dosage_plafonne_et_capteur_aberrant():
    a = corriger_solution(ec=0.2, ph=5.8, ec_cible=3.0, ph_cible=5.8, dernier_dosage_s=None, t_s=0)
    assert a.dose_a_ml <= 100
    b = corriger_solution(ec=12, ph=5.8, ec_cible=2.0, ph_cible=5.8, dernier_dosage_s=None, t_s=0)
    assert b.alertes and b.dose_a_ml == 0


def test_surveillance_bassin():
    assert len(surveiller_bassin(4.0, 26, 22)) == 2


# --- énergie et alarmes ------------------------------------------------------

def test_delestage_garde_les_charges_vitales():
    d = decider(soc_pct=10, reseau_present=False, production_pv_w=0)
    assert "aeration_bassins" in d.charges_autorisees
    assert "chambre_froide" in d.charges_delestees
    assert d.demarrer_groupe


def test_reseau_present_pas_de_delestage():
    d = decider(soc_pct=10, reseau_present=True, production_pv_w=0)
    assert not d.charges_delestees and d.charger_depuis_reseau


def test_alarme_temporisee():
    g = GestionnaireAlarmes()
    assert g.evaluer(0, {"t_int": 36}) == []
    ev = g.evaluer(400, {"t_int": 36})
    assert ev and ev[0][0].code == "T_HAUTE" and ev[0][1] == "leve"
    ev = g.evaluer(500, {"t_int": 25})
    assert ev[0][1] == "retombe"


# --- simulation --------------------------------------------------------------

def test_simulation_juillet_stockage_utile(recettes):
    c = consignes(recettes, "tomate", "production")
    avec = simuler_jour_type(7, c)
    sans = simuler_jour_type(7, c, eq=Equipements(avec_stockage=False, avec_ecran=False))
    assert avec.t_min > sans.t_min + 3


def test_simulation_octobre_pad_utile(recettes):
    c = consignes(recettes, "tomate", "production")
    avec = simuler_jour_type(10, c)
    sans = simuler_jour_type(10, c, eq=Equipements(avec_pad=False))
    assert avec.t_max < sans.t_max - 3
    assert 200 < avec.transpiration_l < 450
