"""Dossier PDF de la carte CAZ-1 : présentation, caractéristiques, nomenclature,
vues de la carte, puis schéma KiCad et plan de perçage en annexe.

Usage : python3 documents/construire_carte.py
"""

import csv
import re
import subprocess
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from weasyprint import HTML

R = Path(__file__).resolve().parents[1]
FAB = R / "electronique" / "caz1" / "fabrication"
sys_css = (Path(__file__).resolve().parent / "construire_dossier.py").read_text(encoding="utf-8")
CSS = re.search(r'CSS = """(.*?)"""', sys_css, re.S).group(1).replace("VERSION", "1.0").replace("Étude de faisabilité", "Dossier carte CAZ-1")


def main():
    md = (R / "docs" / "18_simulateurs_et_carte_electronique.md").read_text(encoding="utf-8")
    partie = "# Carte automate de zone CAZ-1\n" + md[md.index("### Pourquoi une carte dédiée"):]
    corps = subprocess.run(["pandoc", "-f", "gfm", "-t", "html5"], input=partie, capture_output=True, text=True, check=True).stdout
    with open(FAB / "CAZ-1_nomenclature.csv", encoding="utf-8") as f:
        bom = list(csv.DictReader(f))
    tab = (f"<h1>Nomenclature</h1><p>{len(bom)} lignes, {sum(int(b['Quantité']) for b in bom)} composants. Les passifs (résistances, condensateurs) sont donnés en séries courantes : "
           "tout équivalent de même valeur, boîtier, tolérance et tension convient. Fichier CSV : <code>fabrication/CAZ-1_nomenclature.csv</code>.</p>"
           "<table class='bom'><colgroup><col style='width:19%'><col style='width:5%'><col style='width:20%'><col style='width:22%'><col style='width:34%'></colgroup>"
           "<thead><tr><th>Repères</th><th>Qté</th><th>Valeur / boîtier</th><th>Référence fabricant</th><th>Fonction</th></tr></thead><tbody>" + "".join(
        f"<tr><td>{b['Repères']}</td><td>{b['Quantité']}</td><td><b>{b['Valeur']}</b><br><span class='fp'>{b['Empreinte']}</span></td>"
        f"<td>{b['Référence fabricant']}</td><td>{b['Fonction']}</td></tr>" for b in bom) + "</tbody></table>")
    vues = "<h1>Vues de la carte</h1>"
    for f, leg in (("CAZ-1_rendu_3d.png", "Rendu 3D de la carte assemblée"), ("CAZ-1_texture_dessus.png", "Face avant : vernis, cuivre, pastilles et sérigraphie"),
                   ("CAZ-1_texture_dessous.png", "Face arrière (vue en miroir)"), ("CAZ-1_cuivre_dessus.svg", "Cuivre face avant"), ("CAZ-1_cuivre_dessous.svg", "Cuivre face arrière (miroir)"),
                   ("CAZ-1_serigraphie_dessus.svg", "Plan d'assemblage : contours et repères de tous les composants (couches sérigraphie et fabrication)")):
        if (FAB / f).exists():
            vues += f'<figure><img src="{(FAB / f).as_uri()}"><figcaption>{leg}</figcaption></figure>'
    couv = f"""<section class="couverture"><div class="bande"></div>
      {f'<img class="image" src="{(FAB / "CAZ-1_rendu_3d.png").as_uri()}">' if (FAB / "CAZ-1_rendu_3d.png").exists() else ""}
      <div class="titre"><div class="sur">Dossier électronique · SLB-ELN-001</div><h0>Carte automate de zone<br>CAZ-1 révision 1.0</h0>
      <div class="sous">ESP32, Ethernet, RS485, 8 entrées isolées, 6 relais, 2 entrées 4-20 mA<br>Serre pilote de Lubumbashi</div></div>
      <div class="pied"><b>Version 1.0</b> · 13 novembre 2026<br>Contenu : description, caractéristiques, nomenclature, vues, schéma KiCad (annexe A2), plan de perçage.</div></section>"""
    bom_css = ("table.bom{table-layout:fixed;width:100%;font-size:7.6pt}table.bom td{vertical-align:top;overflow-wrap:anywhere;padding:3px 4px}"
               "table.bom .fp{color:#6b7a70;font-size:6.6pt}")
    html = f"<!doctype html><html lang='fr'><head><meta charset='utf-8'><style>{CSS}{bom_css}</style></head><body>{couv}{corps}{tab}{vues}</body></html>"
    tmp = FAB / "_corps.pdf"
    HTML(string=html, base_url=str(R)).write_pdf(str(tmp))
    w = PdfWriter()
    for src in (tmp, FAB / "CAZ-1_schema.pdf", *sorted((FAB / "gerbers").glob("*drl_map.pdf"))):
        if src.exists():
            for page in PdfReader(str(src)).pages:
                w.add_page(page)
    w.add_metadata({"/Title": "Carte automate de zone CAZ-1 - dossier électronique"})
    with open(R / "electronique" / "Dossier_carte_CAZ-1.pdf", "wb") as f:
        w.write(f)
    tmp.unlink()
    print("dossier carte écrit")


if __name__ == "__main__":
    main()
