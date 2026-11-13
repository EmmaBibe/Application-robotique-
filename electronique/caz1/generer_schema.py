"""Génère le schéma KiCad (.kicad_sch) de la carte CAZ-1 depuis conception.py.

Chaque bloc fonctionnel occupe un cadre titré sur une feuille A1. Les liaisons
sont faites par étiquettes de net au bout de chaque broche : la lecture se
fait bloc par bloc et chaque net porte un nom explicite (DI3, K2_COIL, ...).
Les broches inutilisées reçoivent un marqueur de non-connexion.
"""

from __future__ import annotations

import copy
import sys
import uuid
from pathlib import Path

import conception as C

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "outils"))
import sexpr  # noqa: E402
from sexpr import Chaine as S  # noqa: E402

ICI = Path(__file__).resolve().parent
LIBS = Path("/usr/share/kicad/symbols")
GRILLE = 1.27
RACINE = str(uuid.uuid4())

_cache = {}


def u():
    return str(uuid.uuid4())


def lib(nom):
    if nom not in _cache:
        _cache[nom] = sexpr.lire((LIBS / f"{nom}.kicad_sym").read_text())
    return _cache[nom]


def trouver(libnom, nom):
    for s in sexpr.enfants(lib(libnom), "symbol"):
        if s[1] == nom:
            return s
    raise KeyError(f"{libnom}:{nom}")


def symbole_aplati(lib_id):
    libnom, nom = lib_id.split(":")
    s = copy.deepcopy(trouver(libnom, nom))
    ext = sexpr.enfant(s, "extends")
    if ext:
        parent = symbole_aplati(f"{libnom}:{ext[1]}")
        pnom = parent[1].split(":")[1]
        nouveau = [x for x in parent if not (isinstance(x, list) and x[0] == "property")]
        props = sexpr.enfants(s, "property")
        corps = []
        for x in nouveau[2:]:
            if isinstance(x, list) and x[0] == "symbol":
                x = copy.deepcopy(x)
                x[1] = S(str(x[1]).replace(pnom, nom, 1))
            corps.append(x)
        s = ["symbol", S(lib_id)] + props + corps
    else:
        s[1] = S(lib_id)
    return s


def broches(sym):
    out = []
    for sub in sexpr.enfants(sym, "symbol"):
        for p in sexpr.enfants(sub, "pin"):
            at = sexpr.enfant(p, "at")
            out.append({"num": str(sexpr.enfant(p, "number")[1]), "nom": str(sexpr.enfant(p, "name")[1]),
                        "x": float(at[1]), "y": float(at[2]), "a": float(at[3]) if len(at) > 3 else 0.0,
                        "l": float(sexpr.enfant(p, "length")[1])})
    return out


def boite(sym):
    xs, ys = [], []
    for p in broches(sym):
        xs.append(p["x"])
        ys.append(p["y"])
    for sub in sexpr.enfants(sym, "symbol"):
        for g in sub[2:]:
            if not isinstance(g, list):
                continue
            for k in ("start", "end", "center"):
                e = sexpr.enfant(g, k)
                if e:
                    xs.append(float(e[1]))
                    ys.append(float(e[2]))
            pts = sexpr.enfant(g, "pts")
            if pts:
                for xy in sexpr.enfants(pts, "xy"):
                    xs.append(float(xy[1]))
                    ys.append(float(xy[2]))
    return min(xs), max(xs), min(ys), max(ys)


def g(v):
    return round(round(v / GRILLE) * GRILLE, 4)


def police(t=1.27, gras=False, cache=False, justif=None):
    f = ["font", ["size", t, t]]
    if gras:
        f.append("bold")
    e = ["effects", f]
    if justif:
        e.append(["justify"] + justif)
    if cache:
        e.append("hide")
    return e


def generer():
    elements = []
    lib_symbols = {}
    blocs = []
    for comp in C.COMPOSANTS:
        if comp.bloc not in blocs:
            blocs.append(comp.bloc)

    # disposition des blocs : 3 colonnes sur une feuille A1 (841 x 594)
    col_l = [182, 182, 182]
    x_col = [12, 200, 388]
    y_col = [14, 14, 14]
    disposition = {
        "Alimentation 24 V": 0, "Microcontrôleur ESP32": 0, "Ethernet (module W5500)": 0, "Bus RS485 (Modbus RTU)": 0,
        "Entrées 24 V isolées": 1, "Extension d'E/S et pilotage": 2, "Sorties relais 230 V": 2,
        "Entrées 4-20 mA": 1, "Voyants et extension": 2,
    }
    for bloc in blocs:
        k = disposition.get(bloc, 2)
        comps = [c for c in C.COMPOSANTS if c.bloc == bloc]
        x0, y0, largeur = x_col[k], y_col[k], col_l[k]
        cx, cy, haut_ligne = x0 + 6, y0 + 12, 0
        for comp in comps:
            sym = symbole_aplati(comp.symbole)
            lib_symbols[comp.symbole] = sym
            bx0, bx1, by0, by1 = boite(sym)
            pins = broches(sym)
            long_lab = max([len(comp.broches.get(p["num"]) or "") for p in pins] + [1]) * 0.95 + 4
            larg = (bx1 - bx0) + 2 * long_lab + 4
            haut = (by1 - by0) + 11
            if cx + larg > x0 + largeur - 4:
                cx = x0 + 6
                cy += haut_ligne
                haut_ligne = 0
            sx = g(cx + long_lab - bx0)
            sy = g(cy + 5 + by1)  # y de la bibliothèque inversé
            haut_ligne = max(haut_ligne, haut)
            cx += larg
            elements.append(instance(comp, sym, sx, sy, by1))
            for p in pins:
                net = comp.broches.get(p["num"])
                px, py = sx + p["x"], sy - p["y"]
                if net is None:
                    elements.append(["no_connect", ["at", g(px), g(py)], ["uuid", S(u())]])
                    continue
                import math
                a = math.radians(p["a"] + 180)
                dx, dy = round(math.cos(a)), -round(math.sin(a))
                ex, ey = px + dx * 2.54, py + dy * 2.54
                elements.append(["wire", ["pts", ["xy", g(px), g(py)], ["xy", g(ex), g(ey)]],
                                 ["stroke", ["width", 0], ["type", "default"]], ["uuid", S(u())]])
                angle = {(1, 0): 0, (-1, 0): 180, (0, -1): 90, (0, 1): 270}[(dx, dy)]
                justif = ["left", "bottom"] if angle in (0, 90) else ["right", "bottom"]
                elements.append(["label", S(net), ["at", g(ex), g(ey), angle], ["fields_autoplaced"],
                                 police(1.0, justif=justif), ["uuid", S(u())]])
        hauteur = cy + haut_ligne - y0 + 4
        elements.append(["rectangle", ["start", x0, y0], ["end", x0 + largeur, y0 + hauteur],
                         ["stroke", ["width", 0.3], ["type", "dash"], ["color", 72, 72, 72, 1]],
                         ["fill", ["type", "none"]], ["uuid", S(u())]])
        elements.append(["text", S(bloc.upper()), ["at", x0 + 3, y0 + 6, 0], police(2.5, True, justif=["left", "bottom"]),
                         ["uuid", S(u())]])
        y_col[k] = y0 + hauteur + 10

    notes = [
        "Notes de conception :",
        "1. Isolement 230 V : pistes de contact 2,5 mm, 2 mm entre contacts, 4 mm vers la basse tension ; bande 230 V repérée en sérigraphie.",
        "2. Entrées : 24 V nominal, seuil de commutation ≈ 9 V, courant ≈ 4,5 mA ; inversion de polarité tolérée.",
        "3. Relais SRD : isolement bobine-contact de base. Pour une isolation renforcée, monter un relais à isolement renforcé de même empreinte.",
        "4. Bus RS485 : terminaison 120 ohms par cavalier JP1 (seulement en bout de ligne) ; polarisation 680 ohms permanente.",
        "5. Module W5500 enfiché sur J3 : brochage de l'adaptateur décrit dans electronique/caz1/README.md.",
        "6. Programmation : J2 (TX, RX, EN, IO0), adaptateur USB-série 3,3 V ; maintenir BOOT puis appuyer sur RESET.",
    ]
    for k, n in enumerate(notes):
        elements.append(["text", S(n), ["at", x_col[1] + 3, y_col[1] + 4 + k * 4.5, 0], police(1.5 if k else 1.9, k == 0, justif=["left", "bottom"]),
                         ["uuid", S(u())]])

    doc = ["kicad_sch", ["version", 20230121], ["generator", "eeschema"], ["uuid", S(RACINE)], ["paper", S("A2")],
           ["title_block", ["title", S(C.TITRE)], ["date", S("2026-11-13")], ["rev", S(C.REVISION)],
            ["company", S("Projet serre Lubumbashi")],
            ["comment", 1, S("Automate de zone : ESP32, Ethernet, RS485, 8 entrées isolées, 6 relais, 2 entrées 4-20 mA")],
            ["comment", 2, S("Généré depuis electronique/caz1/conception.py")]],
           ["lib_symbols"] + list(lib_symbols.values())]
    doc += elements
    doc.append(["sheet_instances", ["path", S("/"), ["page", S("1")]]])
    (ICI / "caz1.kicad_sch").write_text(sexpr.ecrire(doc) + "\n")
    print("schéma écrit")


def instance(comp, sym, sx, sy, by1):
    props = {"Reference": comp.ref, "Value": comp.valeur, "Footprint": comp.empreinte, "Datasheet": "~"}
    out = ["symbol", ["lib_id", S(comp.symbole)], ["at", sx, sy, 0], ["unit", 1], ["in_bom", "yes"],
           ["on_board", "yes"], ["dnp", "no"], ["uuid", S(u())]]
    for k, (nom, val) in enumerate(props.items()):
        cache = nom in ("Footprint", "Datasheet")
        out.append(["property", S(nom), S(val), ["at", sx, round(sy - by1 - 3.2 + k * 1.9, 3), 0],
                    police(1.27 if nom == "Reference" else 1.1, nom == "Reference", cache, ["left", "bottom"])])
    out.append(["property", S("Fabricant"), S(comp.reference_fabricant or ""), ["at", sx, sy, 0], police(1, cache=True)])
    out.append(["property", S("Description"), S(comp.description), ["at", sx, sy, 0], police(1, cache=True)])
    for p in broches(sym):
        out.append(["pin", S(p["num"]), ["uuid", S(u())]])
    out.append(["instances", ["project", S("caz1"), ["path", S("/" + RACINE), ["reference", S(comp.ref)], ["unit", 1]]]])
    return out


if __name__ == "__main__":
    generer()
