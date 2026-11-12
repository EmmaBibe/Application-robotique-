"""Générateur de journées types à partir des normales mensuelles de Lubumbashi."""

from __future__ import annotations

import csv
import math
from dataclasses import dataclass
from pathlib import Path

from .psychro import humidite_absolue, pression_vapeur_saturante

RACINE = Path(__file__).resolve().parents[2]
FICHIER_CLIMAT = RACINE / "donnees" / "climat_lubumbashi_mensuel.csv"


@dataclass
class NormaleMensuelle:
    mois: int
    t_max: float
    t_min: float
    pluie_mm: float
    hr_moy: float
    rayonnement_kwh: float
    duree_jour_h: float


def charger_normales(chemin: Path = FICHIER_CLIMAT) -> dict[int, NormaleMensuelle]:
    out = {}
    with open(chemin, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            m = int(r["mois"])
            out[m] = NormaleMensuelle(
                m, float(r["t_max_moy_C"]), float(r["t_min_moy_C"]), float(r["pluie_mm"]),
                float(r["hr_moy_pct"]), float(r["rayonnement_global_kWh_m2_j"]), float(r["duree_jour_h"]),
            )
    return out


def temperature_horaire(n: NormaleMensuelle, h: float, decalage_min: float = 0.0) -> float:
    """Profil classique : minimum au lever du soleil, maximum vers 14 h 30."""
    lever = 12.0 - n.duree_jour_h / 2
    h_max = 14.5
    t_min, t_max = n.t_min + decalage_min, n.t_max
    if lever <= h <= h_max:
        x = (h - lever) / (h_max - lever)
        return t_min + (t_max - t_min) * math.sin(math.pi / 2 * x)
    # décroissance exponentielle du maximum vers le minimum du lendemain
    duree = 24 - (h_max - lever)
    ecoule = (h - h_max) % 24
    x = ecoule / duree
    return t_min + (t_max - t_min) * (1 - x) ** 1.6


def rayonnement_horaire(n: NormaleMensuelle, h: float) -> float:
    lever = 12.0 - n.duree_jour_h / 2
    coucher = 12.0 + n.duree_jour_h / 2
    if not (lever < h < coucher):
        return 0.0
    pic = n.rayonnement_kwh * 1000 * math.pi / (2 * n.duree_jour_h)
    return pic * math.sin(math.pi * (h - lever) / n.duree_jour_h)


def humidite_horaire(n: NormaleMensuelle, t: float) -> float:
    """HR horaire en supposant l'humidité absolue constante sur la journée."""
    t_moy = (n.t_max + n.t_min) / 2
    ha = humidite_absolue(t_moy, n.hr_moy)
    e_pa = ha * (t + 273.15) / 2.1674
    return max(10.0, min(100.0, 100 * e_pa / 1000 / pression_vapeur_saturante(t)))


def vent_horaire(h: float) -> float:
    return 1.5 + 2.0 * max(0.0, math.sin(math.pi * (h - 9) / 10))
