"""Chargement des recettes de culture et calcul des consignes du moment.

Une recette décrit, pour une culture et un stade, les consignes de jour et de
nuit (température, HR, DPV, CO2, lumière, EC, pH, température de solution).
Les recettes sont stockées dans donnees/recettes_climat.json, éditables par
le responsable de culture depuis l'interface de supervision.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
FICHIER_RECETTES = RACINE / "donnees" / "recettes_climat.json"


@dataclass(frozen=True)
class Consignes:
    culture: str
    stade: str
    t_jour: float
    t_nuit: float
    t_ventilation_ecart: float
    hr_max: float
    dpv_min: float
    dpv_max: float
    co2_ppm: int
    dli_cible: float
    ec_ms_cm: float
    ph: float
    t_solution_max: float

    def t_chauffage(self, jour: bool) -> float:
        return self.t_jour if jour else self.t_nuit

    def t_ventilation(self, jour: bool) -> float:
        return self.t_chauffage(jour) + self.t_ventilation_ecart


def charger_recettes(chemin: Path | str = FICHIER_RECETTES) -> dict:
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def stade_courant(recette_culture: dict, date_semis: date, aujourd_hui: date) -> str:
    """Détermine le stade à partir du nombre de jours depuis le semis."""
    jours = (aujourd_hui - date_semis).days
    cumul = 0
    dernier = None
    for stade in recette_culture["stades"]:
        dernier = stade["nom"]
        cumul += stade["duree_j"]
        if jours < cumul:
            return stade["nom"]
    return dernier


def consignes(recettes: dict, culture: str, stade: str) -> Consignes:
    rc = recettes["cultures"][culture]
    s = next(x for x in rc["stades"] if x["nom"] == stade)
    return Consignes(
        culture=culture,
        stade=stade,
        t_jour=s["t_jour"],
        t_nuit=s["t_nuit"],
        t_ventilation_ecart=s.get("t_ventilation_ecart", 3.0),
        hr_max=s["hr_max"],
        dpv_min=s["dpv_min"],
        dpv_max=s["dpv_max"],
        co2_ppm=s.get("co2_ppm", 400),
        dli_cible=s["dli"],
        ec_ms_cm=s["ec"],
        ph=s["ph"],
        t_solution_max=s.get("t_solution_max", 24.0),
    )


def consignes_compartiment(recettes: dict, lots: list[dict], aujourd_hui: date) -> Consignes:
    """Fusionne les consignes de plusieurs lots partageant un même compartiment.

    Règle de prudence : on retient la plage commune la plus étroite
    (chauffage au plus haut des minima, aération au plus bas des maxima,
    HR max la plus basse). Si la plage commune est vide, l'interface
    signale un conflit de cohabitation.
    """
    cs = [
        consignes(recettes, lot["culture"], stade_courant(recettes["cultures"][lot["culture"]], lot["date_semis"], aujourd_hui))
        for lot in lots
    ]
    ref = cs[0]
    return Consignes(
        culture="+".join(sorted({c.culture for c in cs})),
        stade="mixte" if len(cs) > 1 else ref.stade,
        t_jour=max(c.t_jour for c in cs),
        t_nuit=max(c.t_nuit for c in cs),
        t_ventilation_ecart=min(c.t_ventilation_ecart for c in cs),
        hr_max=min(c.hr_max for c in cs),
        dpv_min=max(c.dpv_min for c in cs),
        dpv_max=min(c.dpv_max for c in cs),
        co2_ppm=min(c.co2_ppm for c in cs),
        dli_cible=max(c.dli_cible for c in cs),
        ec_ms_cm=ref.ec_ms_cm,
        ph=ref.ph,
        t_solution_max=min(c.t_solution_max for c in cs),
    )
