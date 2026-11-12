"""Calcul des solutions mères A et B à partir d'une recette cible en mmol/L.

Usage :
    python -m outils.calcul_solution                  # recettes par défaut, eau de pluie
    python -m outils.calcul_solution --hco3 3.2 --ca 1.5 --mg 0.8

L'eau d'appoint apporte déjà du calcium, du magnésium, et des bicarbonates
qu'il faut neutraliser à l'acide. Le script en tient compte : il déduit le Ca
et le Mg de l'eau, laisse 0,5 mmol/L de HCO3 comme tampon, et neutralise le
reste avec de l'acide nitrique (qui apporte aussi du nitrate, déduit du
nitrate de potassium).

Les engrais pris en compte sont ceux que l'on trouve en qualité soluble chez
les distributeurs d'Afrique australe.
"""

from __future__ import annotations

import argparse

MASSES = {
    "nitrate_calcium": 1080.5,   # 5Ca(NO3)2.NH4NO3.10H2O : 5 Ca, 11 NO3, 1 NH4
    "nitrate_potassium": 101.1,
    "phosphate_monopotassique": 136.1,
    "sulfate_magnesium": 246.5,  # MgSO4.7H2O
    "sulfate_potassium": 174.3,
}

RECETTES = {
    "fruits_production": {"NO3": 16.0, "H2PO4": 1.5, "K": 9.5, "Ca": 5.0, "Mg": 2.4},
    "fruits_jeunes_plants": {"NO3": 12.0, "H2PO4": 1.2, "K": 6.0, "Ca": 4.0, "Mg": 1.5},
    "feuilles": {"NO3": 12.0, "H2PO4": 1.0, "K": 6.0, "Ca": 4.0, "Mg": 1.5},
}

# Oligo-éléments en µmol/L et produit utilisé : (masse molaire du produit, nb d'atomes, teneur si chélate)
OLIGOS = {
    "fruits": {"Fe": 15, "Mn": 10, "Zn": 5, "B": 30, "Cu": 0.75, "Mo": 0.5},
    "feuilles": {"Fe": 25, "Mn": 5, "Zn": 4, "B": 25, "Cu": 0.75, "Mo": 0.5},
}
PRODUITS_OLIGOS = {
    "Fe": ("chélate de fer DTPA 11 %", None, 0.11, 55.85),
    "Mn": ("sulfate de manganèse monohydraté", 169.0, None, None),
    "Zn": ("sulfate de zinc heptahydraté", 287.5, None, None),
    "B": ("acide borique", 61.8, None, None),
    "Cu": ("sulfate de cuivre pentahydraté", 249.7, None, None),
    "Mo": ("molybdate de sodium dihydraté", 242.0, None, None),
}


def calculer(recette: dict, ca_eau=0.0, mg_eau=0.0, hco3_eau=0.0, so4_eau=0.0) -> dict:
    """Renvoie les doses en mmol/L de chaque engrais et d'acide nitrique."""
    acide = max(0.0, hco3_eau - 0.5)
    ca = max(0.0, recette["Ca"] - ca_eau)
    mg = max(0.0, recette["Mg"] - mg_eau)
    cn = ca / 5.0
    no3_cn = 11 * cn
    mkp = recette["H2PO4"]
    mgso4 = mg
    kno3 = max(0.0, recette["NO3"] - no3_cn - acide)
    k_restant = recette["K"] - kno3 - mkp
    k2so4 = max(0.0, k_restant / 2)
    return {
        "nitrate_calcium": cn,
        "nitrate_potassium": kno3,
        "phosphate_monopotassique": mkp,
        "sulfate_magnesium": mgso4,
        "sulfate_potassium": k2so4,
        "acide_nitrique": acide,
        "_NH4": cn,
        "_SO4": mgso4 + k2so4 + so4_eau,
    }


def bilan_ionique(d: dict, recette: dict, ca_eau=0.0, mg_eau=0.0) -> tuple[float, float]:
    cations = d["_NH4"] + recette["K"] + 2 * (recette["Ca"]) + 2 * (recette["Mg"])
    anions = recette["NO3"] + recette["H2PO4"] + 2 * d["_SO4"]
    return cations, anions


def grammes_pour(d: dict, volume_l: float) -> dict:
    return {k: d[k] * MASSES[k] * volume_l / 1000 for k in MASSES}


def oligos_grammes(groupe: str, volume_l: float) -> dict:
    out = {}
    for el, umol in OLIGOS[groupe].items():
        nom, masse, teneur, m_el = PRODUITS_OLIGOS[el]
        if teneur:
            g = umol * 1e-6 * m_el / teneur * volume_l
        else:
            g = umol * 1e-6 * masse * volume_l
        out[nom] = g
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ca", type=float, default=0.0, help="Ca de l'eau, mmol/L")
    ap.add_argument("--mg", type=float, default=0.0, help="Mg de l'eau, mmol/L")
    ap.add_argument("--hco3", type=float, default=0.0, help="HCO3 de l'eau, mmol/L")
    ap.add_argument("--so4", type=float, default=0.0, help="SO4 de l'eau, mmol/L")
    ap.add_argument("--volume", type=float, default=1000.0, help="volume de solution finale, L")
    ap.add_argument("--concentration", type=float, default=100.0, help="facteur de concentration des solutions mères")
    a = ap.parse_args()

    for nom, rec in RECETTES.items():
        d = calculer(rec, a.ca, a.mg, a.hco3, a.so4)
        g = grammes_pour(d, a.volume)
        cat, an = bilan_ionique(d, rec)
        groupe = "feuilles" if nom == "feuilles" else "fruits"
        print(f"\n=== {nom} : cible {rec}")
        print(f"bilan ionique : cations {cat:.1f} meq/L, anions {an:.1f} meq/L ; CE estimée ≈ {cat / 10:.1f} mS/cm (hors eau)")
        print(f"pour {a.volume:.0f} L de solution finale :")
        for k, v in g.items():
            print(f"  {k:28s} {v:8.1f} g")
        if d["acide_nitrique"] > 0:
            ml = d["acide_nitrique"] * 63.0 / 1.38 / 0.60 * a.volume / 1000  # HNO3 60 %, densité 1,38
            print(f"  acide nitrique 60 %          {ml:8.0f} mL")
        for k, v in oligos_grammes(groupe, a.volume).items():
            print(f"  {k:34s} {v:6.2f} g")
        vol_mere = a.volume / a.concentration
        print(f"solutions mères à {a.concentration:.0f}x : {vol_mere:.0f} L de A et {vol_mere:.0f} L de B par {a.volume:.0f} L de solution")
        print("  A : nitrate de calcium + moitié du nitrate de potassium + chélate de fer")
        print("  B : reste du nitrate de potassium + phosphate monopotassique + sulfates + autres oligo-éléments")


if __name__ == "__main__":
    main()
