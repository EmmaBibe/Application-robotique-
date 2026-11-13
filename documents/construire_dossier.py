"""Mise en page du dossier d'étude en PDF (WeasyPrint) et en Word (pandoc).

Usage : python3 documents/construire_dossier.py
Sortie : Etude_faisabilite_serre_Lubumbashi.pdf et .docx à la racine du dépôt.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from weasyprint import HTML

R = Path(__file__).resolve().parents[1]
D = R / "docs"
FIG = Path(__file__).resolve().parent / "figures"
VERSION, DATE = "1.1", "13 novembre 2026"

FIGURES = {
    "3.6 ": [("chiffre_affaires.svg", "Chiffre d'affaires brut annuel du pilote par culture (scénario médian)", "")],
    "7.3 ": [(R / "plans" / "svg" / "A02.svg", "Plan de la serre et de l'annexe (extrait de la planche A02)", "plan")],
    "8.4 ": [("climat_serre.svg", "Températures extérieures et intérieures simulées, journée type de chaque mois", "")],
    "8.5 ": [("variantes.svg", "Effet de chaque équipement sur les températures extrêmes (simulation)", "")],
    "9.4 ": [(R / "plans" / "svg" / "H02.svg", "P&ID de la fertirrigation du compartiment fruits (planche H02)", "plan")],
    "10.3 ": [("energie.svg", "Consommation électrique journalière par poste et production solaire, mois par mois", "")],
    "10.6 ": [(R / "plans" / "svg" / "E01.svg", "Schéma unifilaire général (planche E01)", "plan")],
    "11.2 ": [(R / "plans" / "svg" / "I01.svg", "Architecture réseau, bus de terrain et adressage (planche I01)", "plan")],
    "13.5 ": [("tresorerie.svg", "Trésorerie cumulée du projet selon l'indice prix x rendement obtenu", "")],
}

CSS = """
@page { size: A4; margin: 24mm 19mm 22mm 21mm;
  @top-left { content: string(chapitre); font: 7.5pt Inter; color: #6b7a71; }
  @top-right { content: "Serre pilote - Lubumbashi"; font: 7.5pt Inter; color: #6b7a71; }
  @bottom-left { content: "Étude de faisabilité · version VERSION"; font: 7.5pt Inter; color: #8a948e; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 7.5pt Inter; color: #33403a; }
}
@page couverture { margin: 0; @top-left{content:none} @top-right{content:none} @bottom-left{content:none} @bottom-right{content:none} }
@page liminaire { @top-left{content:none} @top-right{content:none} }
@page plan { size: A4 landscape; margin: 14mm 14mm 16mm 14mm; }
html { font-family: Inter, "DejaVu Sans", sans-serif; font-size: 9.4pt; line-height: 1.52; color: #1d2a22; }
h1 { string-set: chapitre content(); font-size: 21pt; line-height: 1.15; color: #1f5e3a; margin: 0 0 10mm; padding-top: 14mm;
     border-top: 3pt solid #2f7d4f; page-break-before: always; font-weight: 700; letter-spacing: -0.01em; }
h2 { font-size: 12.5pt; color: #1f5e3a; margin: 7mm 0 2.5mm; font-weight: 700; page-break-after: avoid; }
h3 { font-size: 10.5pt; color: #2b3a31; margin: 5mm 0 2mm; page-break-after: avoid; }
p { margin: 0 0 2.6mm; text-align: justify; hyphens: auto; }
ul, ol { margin: 0 0 3mm; padding-left: 6mm; } li { margin: 0.6mm 0; }
strong { color: #13241a; }
code { font-family: "DejaVu Sans Mono"; font-size: 8pt; background: #eef3ef; padding: 0 1mm; border-radius: 1mm; }
pre { font-family: "DejaVu Sans Mono"; font-size: 7.6pt; background: #f3f6f4; border-left: 2pt solid #2f7d4f; padding: 2.5mm 3mm; white-space: pre-wrap; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 8.1pt; page-break-inside: auto; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th { background: #2f7d4f; color: #fff; text-align: left; padding: 1.6mm 2mm; font-weight: 600; }
td { padding: 1.4mm 2mm; border-bottom: 0.4pt solid #dde4df; vertical-align: top; }
tbody tr:nth-child(even) td { background: #f5f8f6; }
hr { border: 0; border-top: 0.6pt solid #cfd8d2; margin: 5mm 0; }
blockquote { margin: 3mm 0; padding: 2mm 4mm; background: #eef6f0; border-left: 3pt solid #2f7d4f; }
figure { margin: 4mm 0 6mm; page-break-inside: avoid; text-align: center; }
figure img { width: 100%; }
figcaption { font-size: 8pt; color: #55625b; margin-top: 1.5mm; text-align: left; }
figcaption::before { counter-increment: figure; content: "Figure " counter(figure) " - "; font-weight: 700; color: #2f7d4f; }
.plan { page: plan; page-break-before: always; page-break-after: always; }
.plan img { width: 100%; }
/* couverture */
.couverture { page: couverture; width: 210mm; height: 297mm; position: relative; background: #f2f5f2; }
.couverture .bande { position: absolute; left: 0; top: 0; width: 210mm; height: 104mm; background: #1f5e3a; }
.couverture .image { position: absolute; left: 0; top: 104mm; width: 210mm; height: 118mm; object-fit: cover; }
.couverture .titre { position: absolute; left: 20mm; top: 26mm; width: 170mm; color: #fff; }
.couverture .titre .sur { font-size: 10pt; letter-spacing: 0.18em; text-transform: uppercase; opacity: .8; }
.couverture .titre h0 { display: block; font-size: 30pt; font-weight: 700; line-height: 1.1; margin: 5mm 0 4mm; }
.couverture .titre .sous { font-size: 12.5pt; opacity: .92; }
.couverture .pied { position: absolute; left: 20mm; bottom: 18mm; width: 170mm; font-size: 9pt; color: #33403a; }
.couverture .pied b { color: #1f5e3a; }
.liminaire { page: liminaire; }
.sommaire h1, .fiche h1 { page-break-before: always; }
.sommaire ul { list-style: none; padding: 0; }
.sommaire li { margin: 1.6mm 0; font-size: 10pt; }
.sommaire li a { color: #1d2a22; text-decoration: none; }
.sommaire li a::after { content: leader('.') target-counter(attr(href), page); color: #55625b; }
.encart { background: #eef6f0; border: 0.6pt solid #cfe1d5; border-radius: 2mm; padding: 3mm 4mm; margin: 3mm 0 5mm; }
a { color: #1f5e3a; text-decoration: none; }
"""


def pandoc_html(md: Path) -> str:
    return subprocess.run(["pandoc", "-f", "gfm", "-t", "html5", str(md)], capture_output=True, text=True, check=True).stdout


def figure(src, legende, classe):
    chemin = src if isinstance(src, Path) else FIG / src
    uri = chemin.resolve().as_uri()
    if classe == "plan":
        return f'<div class="plan"><figure><img src="{uri}"><figcaption>{legende}</figcaption></figure></div>'
    return f'<figure><img src="{uri}"><figcaption>{legende}</figcaption></figure>'


def chapitres():
    out, sommaire = [], []
    for k, md in enumerate(sorted(D.glob("[0-9][0-9]_*.md"))):
        h = pandoc_html(md)
        ident = f"ch{k:02d}"
        h = re.sub(r"<h1[^>]*>", f'<h1 id="{ident}">', h, count=1)
        titre = re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S).group(1)
        sommaire.append((ident, re.sub("<.*?>", "", titre)))
        for debut, figs in FIGURES.items():
            m = re.search(r"(<h2[^>]*>" + re.escape(debut) + r".*?</h2>)", h, re.S)
            if m:
                bloc = "".join(figure(*f) for f in figs)
                # la figure vient après le premier paragraphe ou tableau qui suit le titre
                fin = h.find("</table>", m.end())
                fin_p = h.find("</p>", m.end())
                pos = min(x for x in (fin + 8 if fin > 0 else 10**9, fin_p + 4 if fin_p > 0 else 10**9))
                h = h[:pos] + bloc + h[pos:]
        out.append(h)
    return out, sommaire


def construire():
    corps, sommaire = chapitres()
    image = (FIG / "couverture.png")
    img = f'<img class="image" src="{image.as_uri()}">' if image.exists() else ""
    couverture = f"""
    <section class="couverture">
      <div class="bande"></div>{img}
      <div class="titre"><div class="sur">Étude de faisabilité</div>
        <h0>Serre agricole autonome<br>en environnement contrôlé</h0>
        <div class="sous">Pilote de 100 m² et extension à 1 000 m²<br>Lubumbashi, Haut-Katanga, République démocratique du Congo</div></div>
      <div class="pied"><b>Version {VERSION}</b> · {DATE}<br>Agronomie · architecture et génie civil · thermique · hydraulique · électricité et énergie ·
        électronique et IIoT · logiciel · économie et finance · exploitation · risques</div>
    </section>"""
    fiche = f"""
    <section class="liminaire fiche"><h1 style="string-set:chapitre ''">Fiche du document</h1>
      <table><tbody>
      <tr><td><b>Titre</b></td><td>Étude de faisabilité d'une serre agricole autonome en environnement contrôlé</td></tr>
      <tr><td><b>Référence</b></td><td>SLB-ETU-001</td></tr>
      <tr><td><b>Version</b></td><td>{VERSION} du {DATE}</td></tr>
      <tr><td><b>Statut</b></td><td>Diffusion pour décision (phase 0)</td></tr>
      <tr><td><b>Site</b></td><td>Lubumbashi, Haut-Katanga (11,7° S, 1 230 m d'altitude)</td></tr>
      <tr><td><b>Documents associés</b></td><td>Dossier de plans et schémas (SLB-PLA-001, 16 planches A3) ; dossier de la carte automate CAZ-1 (SLB-ELN-001) ;
        modèle financier (classeur Excel) ; simulateurs 2D et 3D ; logiciel de supervision</td></tr>
      </tbody></table>
      <h2>Historique</h2>
      <table><thead><tr><th>Version</th><th>Date</th><th>Objet</th></tr></thead><tbody>
      <tr><td>1.0</td><td>12/11/2026</td><td>Première diffusion de l'étude</td></tr>
      <tr><td>1.1</td><td>13/11/2026</td><td>Ajout des simulateurs des systèmes, du dossier de plans, de la carte électronique CAZ-1 ; mise en page</td></tr>
      </tbody></table>
      <div class="encart"><b>Comment lire ce dossier.</b> Le chapitre 0 répond à la question « faut-il se lancer ? ». Les chapitres 1 à 16 détaillent
      chaque discipline ; chaque choix y est justifié et chiffré. Les repères d'équipements (P-101, KM2, AUT-F…) sont identiques dans ce dossier,
      les plans, le logiciel et les simulateurs.</div>
    </section>"""
    som = "<section class='liminaire sommaire'><h1 style=\"string-set:chapitre ''\">Sommaire</h1><ul>" + "".join(
        f'<li><a href="#{i}">{t}</a></li>' for i, t in sommaire) + "</ul></section>"
    html = f"<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>Étude de faisabilité - serre Lubumbashi</title>" \
           f"<style>{CSS.replace('VERSION', VERSION)}</style></head><body>{couverture}{fiche}{som}{''.join(corps)}</body></html>"
    sortie = R / "Etude_faisabilite_serre_Lubumbashi.pdf"
    doc = HTML(string=html, base_url=str(R)).write_pdf(str(sortie), pdf_identifier=b"SLB-ETU-001",
                                                         metadata={"title": "Étude de faisabilité - serre pilote de Lubumbashi"})
    print("PDF :", sortie)
    md = sorted(D.glob("[0-9][0-9]_*.md"))
    subprocess.run(["pandoc", *map(str, md), "--toc", "--toc-depth=2", "-M", "title=Serre agricole autonome en environnement contrôlé",
                    "-M", "subtitle=Étude de faisabilité, Lubumbashi", "-M", "lang=fr-FR", "--resource-path", str(R),
                    "-o", str(R / "Etude_faisabilite_serre_Lubumbashi.docx")], check=True)
    print("DOCX écrit")


if __name__ == "__main__":
    construire()
