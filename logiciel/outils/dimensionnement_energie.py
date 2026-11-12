"""Bilan électrique mois par mois et dimensionnement solaire + batteries.

Usage : python -m outils.dimensionnement_energie  (après etude_climatique)
Écrit donnees/bilan_puissance.csv et donnees/bilan_energie_mensuel.csv
"""

from __future__ import annotations

import csv
import math
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]

# nom, puissance W, heures/j (None = saisonnier), part la nuit, priorité de délestage
CHARGES_FIXES = [
    ("Automates, capteurs, serveur local, routeur 4G, caméras", 60, 24, 0.5, 0),
    ("Surpresseur d'aération des bassins (radeaux)", 80, 24, 0.5, 0),
    ("Pompe d'irrigation goutte-à-goutte (fruits)", 370, 1.5, 0.0, 1),
    ("Recirculation drainage + UV-C (fruits)", 160, 6, 0.2, 1),
    ("Filtration + UV-C bassins (feuilles)", 150, 6, 0.3, 1),
    ("Ventilateurs de brassage (4 x 45 W)", 180, 12, 0.6, 1),
    ("Moteurs d'ouvrants et d'écran", 250, 0.8, 0.3, 1),
    ("Chambre froide 6 m3 (moyenne)", 900, 3.0, 0.4, 2),
    ("Éclairage LED de germination", 200, 14, 0.3, 3),
    ("Osmoseur et pompe de transfert", 400, 1.0, 0.0, 3),
    ("Éclairage, prises, divers", 150, 3.0, 0.5, 3),
]

PR = 0.75                 # ratio de performance du champ PV
GAIN_INCLINAISON = 1.04   # 12° plein nord, gain moyen sur l'année
DOD = 0.90                # profondeur de décharge utile LiFePO4
PANNEAU_WC = 550
MODULE_BATTERIE_KWH = 5.12


def lire_csv(nom: str) -> list[dict]:
    with open(RACINE / "donnees" / nom, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main() -> None:
    climat = {int(r["mois"]): r for r in lire_csv("climat_lubumbashi_mensuel.csv")}
    sim = {int(r["mois"]): r for r in lire_csv("simulation_climat_mensuelle.csv")}

    fixe_jour = sum(p * h / 1000 for _, p, h, _, _ in CHARGES_FIXES)
    fixe_nuit = sum(p * h * n / 1000 for _, p, h, n, _ in CHARGES_FIXES)

    lignes = []
    besoin_kwc = 0.0
    besoin_nuit_max = 0.0
    for m in range(1, 13):
        ventil = float(sim[m]["ventilateurs_kWh_j"])
        heures_pad = ventil / 0.55
        pad = 0.10 * heures_pad
        aero = float(sim[m]["aerothermes_kWh_j"]) * (380 / 300)  # + pompe de circulation 80 W
        chaud = float(sim[m]["t_max_int"]) > 28.5 or m in (9, 10, 11)
        refroid_solution = 0.5 * 3 if chaud else 0.0
        tapis_germination = 0.1 * 12 if m in (5, 6, 7, 8) else 0.0
        total = fixe_jour + ventil + pad + aero + refroid_solution + tapis_germination
        nuit = fixe_nuit + 0.8 * aero + tapis_germination * 0.5
        h_plan = float(climat[m]["rayonnement_global_kWh_m2_j"]) * GAIN_INCLINAISON
        kwc = total / (h_plan * PR)
        besoin_kwc = max(besoin_kwc, kwc)
        besoin_nuit_max = max(besoin_nuit_max, nuit)
        lignes.append({
            "mois": m, "charges_fixes_kWh": round(fixe_jour, 2), "extracteurs_pad_kWh": round(ventil + pad, 2),
            "stockage_thermique_kWh": round(aero, 2), "refroid_solution_kWh": refroid_solution,
            "germination_kWh": tapis_germination, "total_kWh_j": round(total, 2), "dont_nuit_kWh": round(nuit, 2),
            "irradiation_plan_kWh_m2_j": round(h_plan, 2), "kWc_necessaires": round(kwc, 2),
        })

    n_panneaux = math.ceil(besoin_kwc * 1.15 * 1000 / PANNEAU_WC)  # 15 % de marge (vieillissement, salissure)
    kwc = n_panneaux * PANNEAU_WC / 1000
    # batterie : nuit la plus chargée + une journée de charges vitales (prio 0 et 1) sans soleil
    vital = sum(p * h / 1000 for _, p, h, _, prio in CHARGES_FIXES if prio <= 1)
    utile = besoin_nuit_max + vital
    brut = utile / DOD
    n_mod = math.ceil(brut / MODULE_BATTERIE_KWH)

    with open(RACINE / "donnees" / "bilan_energie_mensuel.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(lignes[0]))
        w.writeheader()
        w.writerows(lignes)
    with open(RACINE / "donnees" / "bilan_puissance.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["charge", "puissance_W", "heures_j", "energie_kWh_j", "part_nuit", "priorite_delestage"])
        for nom, p, h, n, prio in CHARGES_FIXES:
            w.writerow([nom, p, h, round(p * h / 1000, 2), n, prio])
        w.writerow(["Extracteurs 2 x 550 W + pompe pad 100 W", 1200, "saisonnier", "voir bilan mensuel", 0, 2])
        w.writerow(["Aérothermes 2 x 150 W + pompe stockage 80 W", 380, "saisonnier", "voir bilan mensuel", 0.8, 1])
        w.writerow(["Refroidisseur de solution 500 W", 500, "saisonnier", "voir bilan mensuel", 0, 2])

    total_an = sum(l["total_kWh_j"] * 30.4 for l in lignes)
    print(f"Consommation annuelle estimée : {total_an:,.0f} kWh")
    print(f"Mois le plus exigeant : {besoin_kwc:.2f} kWc nets")
    print(f"Champ retenu : {n_panneaux} x {PANNEAU_WC} Wc = {kwc:.2f} kWc")
    print(f"Énergie nocturne max : {besoin_nuit_max:.1f} kWh ; charges vitales 24 h : {vital:.1f} kWh")
    print(f"Batterie : {utile:.1f} kWh utiles -> {brut:.1f} kWh bruts -> {n_mod} modules de {MODULE_BATTERIE_KWH} kWh ({n_mod * MODULE_BATTERIE_KWH:.1f} kWh)")
    for l in lignes:
        print(l)


if __name__ == "__main__":
    main()
