"""Simulation des 12 journées types et comparaison des variantes de conception.

Usage : python -m outils.etude_climatique   (depuis le dossier logiciel/)
Écrit donnees/simulation_climat_mensuelle.csv et donnees/simulation_variantes.csv
"""

from __future__ import annotations

import csv
from pathlib import Path

from serre_core.recettes import charger_recettes, consignes
from serre_core.simulateur import Equipements, simuler_jour_type

RACINE = Path(__file__).resolve().parents[2]

VARIANTES = {
    "retenue": Equipements(),
    "sans_stockage": Equipements(avec_stockage=False),
    "sans_ecran": Equipements(avec_ecran=False),
    "sans_pad": Equipements(avec_pad=False),
    "serre_simple": Equipements(avec_stockage=False, avec_ecran=False, avec_pad=False),
}


def main() -> None:
    r = charger_recettes()
    c = consignes(r, "tomate", "production")

    lignes = []
    for mois in range(1, 13):
        b = simuler_jour_type(mois, c)
        lignes.append({
            "mois": mois,
            "t_min_int": round(b.t_min, 1),
            "t_max_int": round(b.t_max, 1),
            "heures_sup_30": round(b.heures_sup_30, 1),
            "heures_inf_12": round(b.heures_inf_12, 1),
            "heures_hr_sup_90": round(b.heures_hr_sup_90, 1),
            "dpv_moyen_jour_kPa": round(b.dpv_moyen_jour, 2),
            "transpiration_L_j": round(b.transpiration_l),
            "eau_pad_L_j": round(b.eau_pad_l),
            "ventilateurs_kWh_j": round(b.energie_ventilateurs_kwh, 2),
            "aerothermes_kWh_j": round(b.energie_aerotherme_kwh, 2),
            "chaleur_destockee_kWh_j": round(b.chaleur_destockee_kwh, 1),
        })
    with open(RACINE / "donnees" / "simulation_climat_mensuelle.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(lignes[0]))
        w.writeheader()
        w.writerows(lignes)

    var = []
    for nom, eq in VARIANTES.items():
        for mois in (1, 7, 10):
            b = simuler_jour_type(mois, c, eq=eq)
            var.append({
                "variante": nom, "mois": mois,
                "t_min_int": round(b.t_min, 1), "t_max_int": round(b.t_max, 1),
                "heures_sup_30": round(b.heures_sup_30, 1), "heures_inf_12": round(b.heures_inf_12, 1),
                "heures_hr_sup_90": round(b.heures_hr_sup_90, 1),
            })
    with open(RACINE / "donnees" / "simulation_variantes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(var[0]))
        w.writeheader()
        w.writerows(var)

    for l in lignes:
        print(l)
    print()
    for v in var:
        print(v)


if __name__ == "__main__":
    main()
