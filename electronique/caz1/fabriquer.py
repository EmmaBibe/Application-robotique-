"""Sorties de fabrication de la carte CAZ-1 : Gerbers, perçage, implantation,
nomenclature, schéma PDF, rendus des faces, données pour la vue 3D.

Usage : python3 fabriquer.py   (après generer_schema.py et generer_pcb.py)
"""

from __future__ import annotations

import csv
import json
import shutil
import subprocess
import zipfile
from collections import OrderedDict
from pathlib import Path

import pcbnew

import conception as C

ICI = Path(__file__).resolve().parent
FAB = ICI / "fabrication"
PCB = ICI / "caz1.kicad_pcb"
SCH = ICI / "caz1.kicad_sch"
OX, OY = 50.0, 50.0


def cli(*args):
    subprocess.run(["kicad-cli", *args], check=True, capture_output=True)


def gerbers():
    g = FAB / "gerbers"
    if g.exists():
        shutil.rmtree(g)
    g.mkdir(parents=True)
    couches = "F.Cu,B.Cu,F.Paste,B.Paste,F.Silkscreen,B.Silkscreen,F.Mask,B.Mask,Edge.Cuts"
    cli("pcb", "export", "gerbers", "--layers", couches, "--subtract-soldermask", "--no-x2", "-o", str(g) + "/", str(PCB))
    cli("pcb", "export", "drill", "--format", "excellon", "--excellon-units", "mm", "--generate-map", "--map-format", "pdf",
        "-o", str(g) + "/", str(PCB))
    with zipfile.ZipFile(FAB / "CAZ-1_rev1.0_gerbers.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(g.iterdir()):
            z.write(f, f.name)
    cli("pcb", "export", "pos", "--format", "csv", "--units", "mm", "--side", "both", "-o", str(FAB / "CAZ-1_implantation.csv"), str(PCB))


def nomenclature():
    groupes = OrderedDict()
    for c in C.COMPOSANTS:
        cle = (c.valeur, c.empreinte.split(":")[1], c.reference_fabricant)
        g = groupes.setdefault(cle, {"refs": [], "desc": c.description, "bloc": c.bloc})
        g["refs"].append(c.ref)
    import re

    def fonctions(refs):
        vues = []
        for r in refs:
            d = next(c.description for c in C.COMPOSANTS if c.ref == r)
            d = re.sub(r"\s\d(?=$|\s|,\s)", "", d.split(" (")[0]).strip()  # « entrée 3 » -> « entrée »
            if d not in vues:
                vues.append(d)
        return " ; ".join(vues)
    lignes = []
    for (val, fp, mpn), g in groupes.items():
        lignes.append({"Repères": " ".join(sorted(g["refs"], key=lambda r: (r.rstrip("0123456789"), int("".join(ch for ch in r if ch.isdigit()) or 0)))),
                       "Quantité": len(g["refs"]), "Valeur": val, "Empreinte": fp, "Référence fabricant": mpn,
                       "Fonction": fonctions(g["refs"]) if len(g["refs"]) > 1 else g["desc"], "Bloc": g["bloc"]})
    with open(FAB / "CAZ-1_nomenclature.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(lignes[0]))
        w.writeheader()
        w.writerows(lignes)
    return lignes


def rendus():
    cli("sch", "export", "pdf", "-o", str(FAB / "CAZ-1_schema.pdf"), str(SCH))
    cli("sch", "export", "svg", "-o", str(FAB), str(SCH))
    for nom, couches in (("dessus", "F.Cu,F.Mask,F.Silkscreen,Edge.Cuts"), ("dessous", "B.Cu,B.Mask,B.Silkscreen,Edge.Cuts"),
                         ("cuivre_dessus", "F.Cu,Edge.Cuts"), ("cuivre_dessous", "B.Cu,Edge.Cuts"),
                         ("serigraphie_dessus", "F.Silkscreen,F.Fab,Edge.Cuts")):
        cli("pcb", "export", "svg", "--layers", couches, "--exclude-drawing-sheet", "--page-size-mode", "2",
            *(["--mirror"] if nom == "dessous" else []), "-o", str(FAB / f"CAZ-1_{nom}.svg"), str(PCB))
    cli("pcb", "export", "pdf", "--layers", "F.Cu,F.Silkscreen,Edge.Cuts", "-o", str(FAB / "CAZ-1_face_avant.pdf"), str(PCB))
    cli("pcb", "export", "pdf", "--layers", "B.Cu,B.Silkscreen,Edge.Cuts", "--mirror", "-o", str(FAB / "CAZ-1_face_arriere.pdf"), str(PCB))


HAUTEURS = {"ESP32": 3.2, "Relay": 15.6, "TerminalBlock": 10.0, "RF_Module": 3.2, "Converter_DCDC": 10.0, "Buzzer": 9.5, "CP_Elec": 10.2,
            "PinSocket": 8.5, "PinHeader": 8.5, "SW_PUSH": 5.0, "DIP-4": 3.5, "SOIC": 1.75, "JST": 7.0, "SOT-23": 1.1,
            "D_SM": 2.3, "LED": 0.8, "R_": 0.6, "C_": 0.9, "Fuse": 1.5, "MountingHole": 0.0}
COULEURS = {"ESP32": "#c9ccd1", "Relay": "#1f5fbf", "TerminalBlock": "#2b9b4a", "RF_Module": "#c9ccd1", "Converter_DCDC": "#222222", "Buzzer": "#1a1a1a",
            "CP_Elec": "#3d4c7a", "PinSocket": "#1a1a1a", "PinHeader": "#1a1a1a", "SW_PUSH": "#555555", "DIP-4": "#1a1a1a", "SOIC": "#1a1a1a",
            "JST": "#f2efe6", "SOT-23": "#1a1a1a", "D_SM": "#1a1a1a", "LED": "#f4f4f4", "R_": "#202020", "C_": "#b08a5a", "Fuse": "#c8a24a"}


def donnees_3d():
    board = pcbnew.LoadBoard(str(PCB))
    out = []
    for fp in board.GetFootprints():
        nom = str(fp.GetFPIDAsString()).split(":")[-1]
        bb = None
        for g in fp.GraphicalItems():
            if g.GetLayer() in (pcbnew.F_Fab, pcbnew.B_Fab):
                r = g.GetBoundingBox()
                r = (r.GetLeft(), r.GetTop(), r.GetRight(), r.GetBottom())
                bb = r if bb is None else (min(bb[0], r[0]), min(bb[1], r[1]), max(bb[2], r[2]), max(bb[3], r[3]))
        if bb is None:
            r = fp.GetBoundingBox(False, False)
            bb = (r.GetLeft(), r.GetTop(), r.GetRight(), r.GetBottom())
        cle = next((k for k in HAUTEURS if k in nom), None)
        if not cle or HAUTEURS[cle] == 0:
            continue
        x0, x1 = pcbnew.ToMM(bb[0]) - OX, pcbnew.ToMM(bb[2]) - OX
        y0, y1 = pcbnew.ToMM(bb[1]) - OY, pcbnew.ToMM(bb[3]) - OY
        if nom.startswith("ESP32"):
            y0, y1 = pcbnew.ToMM(fp.GetPosition().y) - OY - 9.0, pcbnew.ToMM(fp.GetPosition().y) - OY + 9.0
            x0, x1 = pcbnew.ToMM(fp.GetPosition().x) - OX - 15.8, pcbnew.ToMM(fp.GetPosition().x) - OX + 9.8
        comp = next((c for c in C.COMPOSANTS if c.ref == fp.GetReference()), None)
        out.append({"ref": fp.GetReference(), "valeur": fp.GetValue(), "type": cle,
                    "description": comp.description if comp else "", "fabricant": comp.reference_fabricant if comp else "", "x0": round(x0, 2), "x1": round(x1, 2),
                    "y0": round(y0, 2), "y1": round(y1, 2), "h": HAUTEURS[cle], "couleur": COULEURS.get(cle, "#333")})
    (FAB / "CAZ-1_3d.json").write_text(json.dumps({"largeur": C.LARGEUR, "hauteur": C.HAUTEUR, "composants": out}, ensure_ascii=False))
    return out


def textures():
    """Textures réalistes des deux faces (vernis vert, cuivre, pastilles dorées, sérigraphie blanche)."""
    from PIL import Image, ImageChops
    tmp = FAB / "_tex"
    tmp.mkdir(exist_ok=True)
    jeux = {"dessus": ("F.Cu", "F.Mask", "F.Silkscreen"), "dessous": ("B.Cu", "B.Mask", "B.Silkscreen")}
    for face, (cu, masque, seri) in jeux.items():
        for nom, couche in (("cu", cu), ("masque", masque), ("seri", seri), ("bord", "Edge.Cuts")):
            cli("pcb", "export", "svg", "--layers", f"{couche},Edge.Cuts" if nom != "bord" else "Edge.Cuts", "--black-and-white",
                "--exclude-drawing-sheet", "--page-size-mode", "0", *(["--mirror"] if face == "dessous" else []),
                "-o", str(tmp / f"{face}_{nom}.svg"), str(PCB))  # page entière : même repère pour toutes les couches
    script = r"""
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch();
for (const f of fs.readdirSync(process.argv[1]).filter(x => x.endsWith('.svg'))) {
  let svg = fs.readFileSync(process.argv[1] + '/' + f, 'utf8');
  const vb = svg.match(/viewBox="([\d. ]+)"/)[1].trim().split(/\s+/).map(Number);
  const W = 3600, H = Math.round(W * vb[3] / vb[2]);
  svg = svg.replace(/\swidth="[^"]*mm"/, '').replace(/\sheight="[^"]*mm"/, '');
  svg = svg.slice(svg.indexOf('<svg')).replace('<svg', `<svg style="display:block;width:${W}px;height:${H}px"`);
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent('<html><body style="margin:0;background:#fff">' + svg + '</body></html>');
  await p.screenshot({ path: process.argv[1] + '/' + f.replace('.svg', '.png') }); await p.close(); }
await b.close(); })();"""
    subprocess.run(["node", "-e", script, str(tmp)], check=True)
    for face in jeux:
        def masque(n):
            return Image.open(tmp / f"{face}_{n}.png").convert("L").point(lambda v: 255 if v < 128 else 0)
        cu, ouv, seri = masque("cu"), masque("masque"), masque("seri")
        bord = masque("bord")
        # recadrage sur le contour de la carte (l'antenne de l'ESP32 déborde à gauche)
        boite = bord.getbbox()
        cu, ouv, seri, bord = (im.crop(boite) for im in (cu, ouv, seri, bord))
        base = Image.new("RGB", cu.size, (22, 84, 44))
        base.paste((44, 110, 60), mask=cu)
        base.paste((205, 170, 85), mask=ImageChops.multiply(cu, ouv))
        base.paste((240, 240, 236), mask=seri)
        base.paste((30, 30, 30), mask=bord)
        base.save(FAB / f"CAZ-1_texture_{face}.png")
    shutil.rmtree(tmp)


if __name__ == "__main__":
    import sys
    FAB.mkdir(exist_ok=True)
    if "--sans-gerbers" not in sys.argv:
        gerbers()
        rendus()
    l = nomenclature()
    d = donnees_3d()
    textures()
    lib = ICI.parents[1] / "simulateurs" / "lib"
    shutil.copy(FAB / "CAZ-1_3d.json", lib / "caz1_3d.json")
    for face in ("dessus", "dessous"):
        shutil.copy(FAB / f"CAZ-1_texture_{face}.png", lib / f"caz1_texture_{face}.png")
    shutil.copy(FAB / "CAZ-1_texture_dessus.png", lib / "caz1_dessus.png")
    print(f"fabrication : {len(l)} lignes de nomenclature, {len(d)} volumes 3D")
