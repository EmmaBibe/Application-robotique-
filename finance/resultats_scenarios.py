"""Recalcule le classeur financier avec LibreOffice pour les trois scénarios et
imprime les résultats clés (utilisé pour rédiger les documents).

Usage : python3 finance/resultats_scenarios.py [--sans-aquaculture] [--arret-1000]
Nécessite LibreOffice (commande soffice).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from openpyxl import load_workbook

ICI = Path(__file__).resolve().parent
SOURCE = ICI / "modele_financier_serre_lubumbashi.xlsx"


def recalculer(scenario: int, sans_aqua: bool = False, arret_1000: bool = False) -> dict:
    tmp = Path(tempfile.mkdtemp())
    wb = load_workbook(SOURCE)
    wb["Hypotheses"]["B4"] = scenario
    if arret_1000:
        wb["Hypotheses"]["B21"] = 99
    if sans_aqua:
        po, cp = wb["Poissons"], wb["CAPEX"]
        for r in (5, 6, 7):
            for c in "BCD":
                po[f"{c}{r}"] = 0
        po["E22"] = 0
        for row in cp.iter_rows(min_row=4):
            lib = str(row[0].value or "")
            if isinstance(row[1].value, int) and ("aquacole" in lib or lib.startswith("Aquaculture") or "grossissement module 2" in lib):
                row[2].value = 0
        # imprévus recalculés à 10 % des lignes restantes de chaque phase
        for ph in (1, 2, 3):
            base = sum(r[2].value for r in cp.iter_rows(min_row=4) if r[1].value == ph
                       and isinstance(r[2].value, (int, float)) and not str(r[0].value).startswith("Imprévus"))
            for r in cp.iter_rows(min_row=4):
                if r[1].value == ph and str(r[0].value).startswith("Imprévus"):
                    r[2].value = round(base * 0.10, -1)
        op = wb["OPEX"]
        for row in op.iter_rows(min_row=4):
            if str(row[0].value or "").startswith("Aquaculture"):
                for cell in row[1:4]:
                    cell.value = 0
    src = tmp / "m.xlsx"
    wb.save(src)
    subprocess.run(["soffice", "--headless", "--convert-to", "xlsx", "--outdir", str(tmp / "o"), str(src)],
                   check=True, capture_output=True)
    v = load_workbook(tmp / "o" / "m.xlsx", data_only=True)
    rs, cp, op, po, cu, ps, se = (v[n] for n in ("Resultats", "CAPEX", "OPEX", "Poissons", "Cultures", "Pilote_seul", "Sensibilite"))
    lab = {rs.cell(row=r, column=1).value: r for r in range(1, rs.max_row + 1)}
    def ligne(nom):
        r = lab[nom]
        return [round(rs.cell(row=r, column=c).value or 0) for c in range(2, 13)]
    tot = {}
    for r in range(1, cp.max_row + 1):
        a = str(cp.cell(row=r, column=1).value or "")
        if a.startswith("Total phase") or a == "Total projet" or a.startswith("dont aquaculture"):
            tot[a.split(" (")[0]] = round(cp.cell(row=r, column=3).value or 0)
    out = {
        "capex": tot,
        "opex": {"pilote": round(op["B26"].value), "1000": round(op["C26"].value), "2000": round(op["D26"].value)},
        "ca_legumes_brut": {"pilote": round(cu["O19"].value), "t2": round(cu["P19"].value), "t3": round(cu["Q19"].value)},
        "poissons": {k: [round(po.cell(row=r, column=c).value or 0, 2) for c in (5, 6, 7)] for k, r in
                     (("prod_t", 22), ("alevins_internes", 23), ("alevins_vendus", 24), ("aliment_t", 25), ("ca_poisson", 26),
                      ("ca_alevins", 27), ("ca_aqua", 28), ("aliment", 30), ("ecloserie", 31), ("intrants", 32),
                      ("marge_var", 33), ("cout_var_kg", 34))},
        "annees": {n: ligne(n) for n in ("CA net total", "CA aquacole net", "Charges d'exploitation",
                                          "EBE (excédent brut d'exploitation)", "Investissements", "Flux de trésorerie",
                                          "Trésorerie cumulée")},
    }
    for r in range(lab["Trésorerie cumulée"] + 2, lab["Trésorerie cumulée"] + 10):
        n = rs.cell(row=r, column=1).value
        if n:
            val = rs.cell(row=r, column=2).value
            out[n] = round(val, 4) if isinstance(val, float) else val
    out["pilote_seul"] = {"perte_max": round(ps["B10"].value), "ebe_sans_salarie": round(ps["B11"].value),
                          "ebe": [round(ps.cell(row=6, column=c).value) for c in range(2, 8)]}
    out["sensibilite"] = [[round(se.cell(row=r, column=c).value) for c in range(2, 9)] for r in range(5, 12)]
    out["prix_min_legumes"] = round(se["B13"].value, 3)
    out["sensibilite_poisson"] = [[round(se.cell(row=r, column=c).value) for c in range(2, 8)] for r in range(17, 22)]
    shutil.rmtree(tmp)
    return out


if __name__ == "__main__":
    sans = "--sans-aquaculture" in sys.argv
    arret = "--arret-1000" in sys.argv
    res = {s: recalculer(i, sans, arret) for i, s in ((1, "prudent"), (2, "median"), (3, "optimiste"))}
    print(json.dumps(res, ensure_ascii=False, indent=1))
