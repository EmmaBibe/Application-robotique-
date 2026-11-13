"""Bilan technique de l'aquaculture découplée couplée aux serres.

Calcule, pour la ferme de 1 000 m² (tranche 2) et celle de 2 000 m² (tranche 3) :
  - les flux d'azote, de phosphore et de potassium entre l'aliment, les poissons et les plantes ;
  - l'eau échangée entre les bacs et les cultures ;
  - les besoins de chaleur des bacs en juillet et la couverture par le chauffe-eau solaire ;
  - la consommation électrique de l'unité aquacole ;
  - le volume de bacs et la densité d'élevage.

Usage : python -m outils.bilan_aquaponie   (depuis logiciel/)
Écrit donnees/bilan_aquaponie.csv
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]


@dataclass
class Aliment:
    proteines: float = 0.38      # aliment de grossissement Clarias, 35 à 40 %
    p: float = 0.012             # phosphore total
    k: float = 0.009             # potassium
    @property
    def n(self) -> float:
        return self.proteines / 6.25


@dataclass
class Poisson:
    n: float = 0.0256            # azote du poisson entier frais (16 % de protéines)
    p: float = 0.0045
    k: float = 0.0035


@dataclass
class Configuration:
    nom: str
    poisson_t_an: float
    fcr: float
    radeaux_m2: float
    fruits_m2: float
    bacs_m3: float


# besoins d'absorption nette des cultures (g/m²/jour), ordres de grandeur publiés pour des
# cultures hors-sol productives : laitue ~50 kg/m²/an à 0,25 % d'azote ; tomate ~25 kg/m²/an + feuillage
BESOIN = {"radeaux": {"n": 0.40, "p": 0.06, "k": 0.55}, "fruits": {"n": 0.25, "p": 0.045, "k": 0.42}}
PERTES_N = (0.20, 0.30, 0.50)          # dénitrification et boues : faible, central, fort
DISSOUS = {"n": 0.75, "p": 0.30, "k": 0.90}   # part des rejets émise sous forme dissoute
MINERALISATION = {"n": 0.50, "p": 0.40, "k": 0.80}  # part des rejets solides récupérée par le minéralisateur


def bilan(cfg: Configuration, al=Aliment(), po=Poisson()) -> dict:
    aliment_kg_j = cfg.poisson_t_an * 1000 * cfg.fcr / 365
    poisson_kg_j = cfg.poisson_t_an * 1000 / 365
    out = {"configuration": cfg.nom, "aliment_kg_j": aliment_kg_j}
    for el in ("n", "p", "k"):
        entree = aliment_kg_j * 1000 * getattr(al, el)
        fixe = poisson_kg_j * 1000 * getattr(po, el)
        rejet = entree - fixe
        dispo = rejet * DISSOUS[el] + rejet * (1 - DISSOUS[el]) * MINERALISATION[el]
        besoin = cfg.radeaux_m2 * BESOIN["radeaux"][el] + cfg.fruits_m2 * BESOIN["fruits"][el]
        out[f"{el}_aliment_g_j"] = entree
        out[f"{el}_fixe_poisson_pct"] = 100 * fixe / entree
        if el == "n":
            for nom, pe in zip(("faible", "central", "fort"), PERTES_N):
                out[f"n_couverture_pct_pertes_{nom}"] = 100 * dispo * (1 - pe) / besoin
            dispo *= 1 - PERTES_N[1]
        out[f"{el}_disponible_g_j"] = dispo
        out[f"{el}_besoin_plantes_g_j"] = besoin
        out[f"{el}_couverture_pct"] = 100 * dispo / besoin
    out["g_aliment_par_m2_cultive_j"] = aliment_kg_j * 1000 / (cfg.radeaux_m2 + cfg.fruits_m2)
    out["g_aliment_par_m2_radeau_j"] = aliment_kg_j * 1000 / cfg.radeaux_m2
    # eau : renouvellement de 5 % du volume par jour, entièrement envoyé vers les cultures
    echange = 0.05 * cfg.bacs_m3
    besoin_eau = cfg.radeaux_m2 * 2.5e-3 + cfg.fruits_m2 * 4.0e-3   # m³/j, saison sèche
    out["eau_echangee_m3_j"] = echange
    out["eau_besoin_cultures_m3_j"] = besoin_eau
    out["eau_part_couverte_pct"] = 100 * echange / besoin_eau
    # élevage : biomasse moyenne ~ 40 % de la biomasse finale d'un lot, 2 lots par an et par bac
    out["biomasse_moyenne_kg"] = cfg.poisson_t_an * 1000 / 2 * 0.55
    out["densite_moyenne_kg_m3"] = out["biomasse_moyenne_kg"] / (cfg.bacs_m3 * 0.75)  # 25 % des bacs en écloserie/quarantaine
    # chaleur en juillet : bacs couverts et isolés (U ~1 W/m²K, 14 m² par bac de 8 m³), eau d'appoint 20 -> 27 °C
    n_bacs = cfg.bacs_m3 / 8
    pertes_parois = n_bacs * 14 * 1.0 * 9 * 24 / 1000          # kWh/j, eau à 27 °C, air du bâtiment à 18 °C la nuit (moyenne)
    appoint = echange * 1000 * 4.186 * 7 / 3600                 # kWh/j
    out["chaleur_juillet_kwh_j"] = pertes_parois + appoint
    capteurs = 20.0                                             # 20 m² posés en tranche 2, suffisants pour les deux modules
    out["solaire_thermique_m2"] = capteurs
    out["solaire_thermique_kwh_j"] = capteurs * 5.6 * 0.50      # 5,6 kWh/m²/j en juillet, rendement 50 %
    out["couverture_solaire_pct"] = 100 * out["solaire_thermique_kwh_j"] / out["chaleur_juillet_kwh_j"]
    out["inertie_kwh_par_degre"] = cfg.bacs_m3 * 1000 * 4.186 / 3600
    # électricité : air-lift 0,40 kW par module de 32 m³, écloserie 0,15 kW, capteurs et automate 0,05 kW
    puissance = 0.40 * cfg.bacs_m3 / 32 + 0.15 + 0.05
    out["puissance_continue_kw"] = puissance
    out["electricite_kwh_j"] = puissance * 24
    out["kwh_par_kg_poisson"] = puissance * 24 * 365 / (cfg.poisson_t_an * 1000)
    out["boues_kg_ms_j"] = aliment_kg_j * 0.92 * 0.25            # 25 % de la matière sèche de l'aliment
    return out


CONFIGS = [
    Configuration("Ferme 1 000 m² (tranche 2)", 5, 1.15, 418.6, 400, 32),
    Configuration("Ferme 2 000 m² (tranche 3)", 10, 1.15, 658.6, 1050, 64),
]


def main():
    lignes = [bilan(c) for c in CONFIGS]
    sortie = RACINE / "donnees" / "bilan_aquaponie.csv"
    with open(sortie, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["grandeur"] + [l["configuration"] for l in lignes])
        for k in lignes[0]:
            if k == "configuration":
                continue
            w.writerow([k] + [round(l[k], 2) for l in lignes])
    for l in lignes:
        print(l["configuration"])
        for k, v in l.items():
            if k != "configuration":
                print(f"  {k:38s} {v:10.1f}")
    print("écrit :", sortie)


if __name__ == "__main__":
    main()
