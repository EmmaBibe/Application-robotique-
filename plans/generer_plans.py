"""Génère les planches A3 (SVG) et le dossier de plans (PDF).

Usage : python3 plans/generer_plans.py
Sortie : plans/svg/*.svg et plans/Dossier_plans_et_schemas.pdf
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))

from dessin import Feuille  # noqa: E402
import planches_elec as E  # noqa: E402
import planches_gc as G  # noqa: E402
import planches_hydro as H  # noqa: E402
import planches_iiot as I  # noqa: E402


def bordereau(planches):
    f = Feuille("000", "Bordereau des plans", "sans", lot="Dossier de plans et schémas - indice A")
    lignes = [(p.numero, p.titre, p.echelle, p.indice, p.date) for p in planches]
    f.tableau(25, 30, [("N°", 20), ("Titre", 190), ("Échelle", 30), ("Indice", 20), ("Date", 30)], lignes, taille=2.3, h=6.5)
    f.note(25, 200, [
        "Codification : A = architecture et génie civil, H = hydraulique (P&ID), E = électricité,",
        "I = automatisme et IIoT, T = tableaux, C = carte électronique CAZ-1 (dossier KiCad joint).",
        "Indice A : première diffusion pour étude et consultation des entreprises.",
        "Les repères d'équipements (P-101, EV-102, KM2, AUT-F...) sont identiques dans les plans,",
        "le dossier d'étude, le logiciel de supervision et les simulateurs.",
    ], titre="Notes", taille=2.2)
    return f


def toutes():
    planches = [
        G.plan_masse(), G.plan_serre(), G.coupe(), G.fondations(), G.plan_masse_ferme(),
        H.eau(), H.fertirrigation(), H.bassins(), H.aquaculture(),
        E.unifilaire(), E.commande(), E.cablage_armoire(), E.terre_foudre(),
        I.architecture(), I.logique(), I.liste_es(), I.liste_cables(),
    ]
    return [bordereau(planches)] + planches


def main():
    out = ICI / "svg"
    out.mkdir(exist_ok=True)
    pages = []
    for p in toutes():
        s = p.svg()
        (out / f"{p.numero}.svg").write_text(s, encoding="utf-8")
        pages.append(s)
    html = ("<!doctype html><html><head><meta charset='utf-8'><style>@page{size:420mm 297mm;margin:0}"
            "body{margin:0}.p{width:420mm;height:297mm;page-break-after:always;overflow:hidden}.p svg{display:block}</style></head><body>"
            + "".join(f"<div class='p'>{s}</div>" for s in pages) + "</body></html>")
    (out / "_dossier.html").write_text(html, encoding="utf-8")
    script = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://{out / "_dossier.html"}');
  await p.pdf({{ path: '{ICI / "Dossier_plans_et_schemas.pdf"}', preferCSSPageSize: true, printBackground: true }});
  await b.close();
}})();
"""
    subprocess.run(["node", "-e", script], check=True)
    (out / "_dossier.html").unlink()
    print(f"{len(pages)} planches, PDF écrit")


if __name__ == "__main__":
    main()
