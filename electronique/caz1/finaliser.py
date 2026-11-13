"""Dernière passe sur la carte routée : raccords aux pastilles, liaison des
îlots restants (signaux puis masse), recoulage des plans et contrôle DRC.

Usage : python3 finaliser.py   (après generer_pcb.py finir maison)
"""

import math
import re
import sys
from pathlib import Path

import numpy as np
import pcbnew

import conception as C
from raccorder import raccorder

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / "outils"))
from routeur import Routeur  # noqa: E402

PCB = ICI / "caz1.kicad_pcb"
PRIORITAIRES = ("DI6", "ETH_RST", "DI5", "DI4")
RAPPORT = ICI / "fabrication" / "drc.rpt"
OX = OY = 50.0


def classes():
    cl = {}
    for n in C.nets():
        if n in C.NETS_PUISSANCE_230:
            cl[n] = (2.5, 2.0, True)
        elif n == "GND":
            cl[n] = (0.5, 0.2, False)
        elif n in C.NETS_ALIM:
            cl[n] = (0.6, 0.2, False)
        else:
            cl[n] = (0.3, 0.2, False)
    return cl


def routeur(board, zones=False):
    r = Routeur(board, OX, OY, C.LARGEUR, C.HAUTEUR, classes())
    couloirs = []
    for fp in board.GetFootprints():
        if fp.GetReference().startswith("K"):
            for pad in fp.Pads():
                if pad.GetNetname() == "+24V" or pad.GetNetname().endswith("_COIL"):
                    x, y = pcbnew.ToMM(pad.GetPosition().x), pcbnew.ToMM(pad.GetPosition().y)
                    couloirs.append((x - 1.6, x + 1.6, y - 1.6))
    r.bande_haute_tension(OY + 39.0, couloirs)
    r.importer_cuivre(zones=zones)
    return r


def drc(board):
    board.BuildConnectivity()
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.WriteDRCReport(board, str(RAPPORT), pcbnew.EDA_UNITS_MILLIMETRES, True)
    txt = RAPPORT.read_text()
    nets = []
    for bloc in txt.split("[unconnected_items]")[1:]:
        m = re.search(r"\[([^\]<>]+)\]", bloc.split("\n[")[0].split("Severity")[1])
        if m:
            nets.append(m.group(1))
    return txt, nets


def retirer_conflits(board, txt, sections=("clearance",)):
    """Supprime les pistes et vias signalés dans les sections du rapport DRC
    (isolement, trous trop proches, vias ou pistes pendants) : ils seront refaits.
    La suppression se fait dans le fichier : board.Remove() rend l'API Python instable."""
    from sexpr import ecrire, enfant, enfants, lire
    cibles, vias = [], []
    for sec in sections:
        for bloc in txt.split(f"[{sec}]")[1:]:
            corps = bloc.split("\n[")[0]
            cibles += [(float(x), float(y), n) for x, y, n in
                       re.findall(r"@\(([\d.]+) mm, ([\d.]+) mm\): Track \[([^\]]+)\]", corps)]
            v = [(float(x), float(y), n) for x, y, n in
                 re.findall(r"@\(([\d.]+) mm, ([\d.]+) mm\): Via \[([^\]]+)\]", corps)]
            # trous trop proches : on ne retire qu'un des deux vias
            vias += v[:1] if sec == "hole_near_hole" else v
    if not cibles and not vias:
        return board, 0
    pcbnew.SaveBoard(str(PCB), board)
    arbre = lire(PCB.read_text())
    noms = {e[1]: e[2] for e in enfants(arbre, "net")}

    def touche(seg, x, y):
        (_, x0, y0), (_, x1, y1) = enfant(seg, "start"), enfant(seg, "end")
        x0, y0, x1, y1 = map(float, (x0, y0, x1, y1))
        dx, dy = x1 - x0, y1 - y0
        L = dx * dx + dy * dy
        t = 0 if L == 0 else max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / L))
        return math.hypot(x0 + t * dx - x, y0 + t * dy - y) < float(enfant(seg, "width")[1]) / 2 + 0.05
    retires = 0
    for seg in enfants(arbre, "segment"):
        net = noms.get(enfant(seg, "net")[1])
        if any(n == net and touche(seg, x, y) for x, y, n in cibles):
            arbre.remove(seg)
            retires += 1
    for via in enfants(arbre, "via"):
        _, x0, y0 = enfant(via, "at")[:3]
        net = noms.get(enfant(via, "net")[1])
        if any(n == net and math.hypot(float(x0) - x, float(y0) - y) < 0.02 for x, y, n in vias):
            arbre.remove(via)
            retires += 1
    PCB.write_text(ecrire(arbre) + "\n")
    return pcbnew.LoadBoard(str(PCB)), retires


def dedoublonner_vias(board):
    """Supprime les vias empilés au même endroit (on en garde un)."""
    from sexpr import ecrire, enfant, enfants, lire
    pcbnew.SaveBoard(str(PCB), board)
    arbre = lire(PCB.read_text())
    vus, n = set(), 0
    for via in enfants(arbre, "via"):
        cle = (round(float(enfant(via, "at")[1]), 3), round(float(enfant(via, "at")[2]), 3))
        if cle in vus:
            arbre.remove(via)
            n += 1
        vus.add(cle)
    PCB.write_text(ecrire(arbre) + "\n")
    return pcbnew.LoadBoard(str(PCB)), n


def trous_sans_cuivre(chemin):
    """H1 et H2 sont dans la bande 230 V : trou nu non métallisé, sans net.
    Modification faite dans le fichier (l'API pcbnew supporte mal la suppression de pastilles)."""
    from sexpr import Chaine, ecrire, enfant, enfants, lire
    arbre = lire(chemin.read_text())
    change = False
    for fp in enfants(arbre, "footprint"):
        refs = [e for e in enfants(fp, "property") if e[1] == "Reference"] + [e for e in enfants(fp, "fp_text") if e[1] == "reference"]
        if not refs or refs[0][2] not in ("H1", "H2"):
            continue
        pads = enfants(fp, "pad")
        if not any(enfant(p, "net") for p in pads):
            continue
        for p in pads:
            fp.remove(p)
        fp.append(["pad", Chaine(""), "np_thru_hole", "circle", ["at", "0", "0"], ["size", "3.2", "3.2"],
                   ["drill", "3.2"], ["layers", Chaine("*.Cu"), Chaine("*.Mask")]])
        change = True
    if change:
        chemin.write_text(ecrire(arbre) + "\n")


def coutures(board, pas=4.0, marge=0.75):
    """Vias de couture entre les plans de masse des deux faces : partout où les
    deux remplissages se superposent avec une marge suffisante."""
    import numpy as np
    from matplotlib.path import Path as Chemin
    mm = pcbnew.ToMM
    remplis = {}
    for z in board.Zones():
        if z.GetNetname() != "GND":
            continue
        for couche in (pcbnew.F_Cu, pcbnew.B_Cu):
            if z.IsOnLayer(couche):
                ps = z.GetFilledPolysList(couche)
                chemins = []
                for k in range(ps.OutlineCount()):
                    def contour(ch):
                        return np.array([[mm(ch.CPoint(m).x), mm(ch.CPoint(m).y)] for m in range(ch.PointCount())])
                    chemins.append((Chemin(contour(ps.Outline(k))), [Chemin(contour(ps.Hole(k, h))) for h in range(ps.HoleCount(k))]))
                remplis[couche] = chemins
    xs = np.arange(OX + 2, OX + C.LARGEUR - 2, pas)
    ys = np.arange(OY + 43, OY + C.HAUTEUR - 2, pas)
    gx, gy = np.meshgrid(xs, ys)
    centres = np.column_stack([gx.ravel(), gy.ravel()])
    ang = np.linspace(0, 2 * np.pi, 9)[:-1]
    ok = np.ones(len(centres), dtype=bool)
    for dx, dy in [(0, 0)] + [(marge * np.cos(a), marge * np.sin(a)) for a in ang]:
        pts = centres + [dx, dy]
        for couche, chemins in remplis.items():
            dedans = np.zeros(len(pts), dtype=bool)
            for ext, trous in chemins:
                d = ext.contains_points(pts)
                for t in trous:
                    d &= ~t.contains_points(pts)
                dedans |= d
            ok &= dedans
    # pas de via à moins de 1 mm d'un trou ou d'un via existant
    existants = [(mm(t.GetPosition().x), mm(t.GetPosition().y)) for t in board.GetTracks() if t.GetClass() == "PCB_VIA"]
    existants += [(mm(p.GetPosition().x), mm(p.GetPosition().y)) for fp in board.GetFootprints() for p in fp.Pads()
                  if p.GetDrillSize().x > 0]
    gnd = board.FindNet("GND")
    n = 0
    for (x, y), bon in zip(centres, ok):
        if not bon or any(math.hypot(x - a, y - b) < 1.2 for a, b in existants):
            continue
        v = pcbnew.PCB_VIA(board)
        v.SetPosition(pcbnew.VECTOR2I(pcbnew.FromMM(float(x)), pcbnew.FromMM(float(y))))
        v.SetWidth(pcbnew.FromMM(0.6))
        v.SetDrill(pcbnew.FromMM(0.3))
        v.SetNet(gnd)
        board.Add(v)
        existants.append((x, y))
        n += 1
    return n


def coutures_ciblees(board, marge=0.62, pas=0.25):
    """Un via de couture dans chaque fragment du plan avant qui n'en a pas,
    là où le plan arrière est présent dessous."""
    import numpy as np
    mm = pcbnew.ToMM
    z = next(z for z in board.Zones() if z.GetNetname() == "GND" and z.IsOnLayer(pcbnew.F_Cu))
    zb = next(z for z in board.Zones() if z.GetNetname() == "GND" and z.IsOnLayer(pcbnew.B_Cu))
    pf, pb = z.GetFilledPolysList(pcbnew.F_Cu), zb.GetFilledPolysList(pcbnew.B_Cu)
    vias = [t.GetPosition() for t in board.GetTracks() if t.GetClass() == "PCB_VIA" and t.GetNetname() == "GND"]
    trous = [(mm(p.GetPosition().x), mm(p.GetPosition().y)) for fp in board.GetFootprints() for p in fp.Pads() if p.GetDrillSize().x > 0]
    trous += [(mm(v.x), mm(v.y)) for v in vias]
    gnd = board.FindNet("GND")
    ang = np.linspace(0, 2 * np.pi, 13)[:-1]

    def dans(ps, x, y):
        return ps.Contains(pcbnew.VECTOR2I(pcbnew.FromMM(float(x)), pcbnew.FromMM(float(y))))
    n = 0
    for k in range(pf.OutlineCount()):
        ch = pf.Outline(k)
        if any(ch.PointInside(v) for v in vias):
            continue
        bb = ch.BBox()
        x0, y0, x1, y1 = mm(bb.GetLeft()), mm(bb.GetTop()), mm(bb.GetRight()), mm(bb.GetBottom())
        place = None
        for x in np.arange(x0 + marge, x1 - marge + 1e-6, pas):
            for y in np.arange(y0 + marge, y1 - marge + 1e-6, pas):
                pts = [(x, y)] + [(x + marge * np.cos(a), y + marge * np.sin(a)) for a in ang]
                if all(dans(pf, *q) and dans(pb, *q) for q in pts) and all(math.hypot(x - a, y - b) > 1.0 for a, b in trous):
                    place = (x, y)
                    break
            if place:
                break
        if place:
            v = pcbnew.PCB_VIA(board)
            v.SetPosition(pcbnew.VECTOR2I(pcbnew.FromMM(float(place[0])), pcbnew.FromMM(float(place[1]))))
            v.SetWidth(pcbnew.FromMM(0.6))
            v.SetDrill(pcbnew.FromMM(0.3))
            v.SetNet(gnd)
            board.Add(v)
            trous.append(place)
            n += 1
    return n


def pastilles_isolees(board):
    """Pastilles de masse dont la seule liaison est un fragment de plan isolé
    (une seule branche de raccord thermique vers un petit îlot)."""
    import subprocess
    out = subprocess.run([sys.executable, str(ICI / "grappes.py"), str(PCB)], capture_output=True, text=True).stdout
    return [l.split()[1] for l in out.splitlines() if l.startswith("ISOLE ")]


def via_de_masse(board, iso):
    """Pour chaque pastille de masse isolée : courte piste en face avant et via
    vers le plan arrière, posés là où l'isolement le permet."""
    mm = pcbnew.ToMM
    zb = next(z for z in board.Zones() if z.GetNetname() == "GND" and z.IsOnLayer(pcbnew.B_Cu))
    pb = zb.GetFilledPolysList(pcbnew.B_Cu)
    grand = max(range(pb.OutlineCount()), key=lambda k: pb.Outline(k).Area())
    r = routeur(board)
    gnd = board.FindNet("GND")
    code = gnd.GetNetCode()
    libre = r.masque_libre("GND", code, 0.3)[0]
    via_ok = r.masque_via(code, False)
    poses = 0
    import numpy as np
    for q in iso:
        ref, num, x, y = q.split(":")
        x, y = float(x), float(y)
        pi, pj = r.vers_grille(x, y)
        # cible : le plan arrière principal (marge 0,4 mm), atteint par un via posé
        # au ras de la pastille (le via peut toucher sa propre pastille)
        from scipy import ndimage
        x0, x1 = max(1, pi - 24), min(r.nx - 1, pi + 25)
        y0, y1 = max(1, pj - 24), min(r.ny - 1, pj + 25)
        cibles = []
        for j in range(y0, y1):
            for i in range(x0, x1):
                vx, vy = r.vers_mm(i, j)
                if r.cu[1, j, i] == -1 and all(pb.Outline(grand).PointInside(pcbnew.VECTOR2I(pcbnew.FromMM(vx + 0.45 * math.cos(t)), pcbnew.FromMM(vy + 0.45 * math.sin(t))))
                                               for t in [k * math.pi / 4 for k in range(8)]):
                    cibles.append((1, i, j))
        sources = [(0, int(i), int(j)) for j, i in zip(*np.nonzero(r.cu[0] == code))
                   if abs(int(i) - pi) <= 4 and abs(int(j) - pj) <= 4]
        if not cibles or not sources:
            print(f"  {ref}.{num} : pas de place pour un via")
            continue
        r.classes["GND"] = (0.3, 0.2, False)
        lib = r.masque_libre("GND", code, 0.3)
        for (l, i, j) in sources + cibles:
            lib[l][j, i] = True
        autres_pads = r.pastille & ~((r.cu[0] == code) | (r.cu[1] == code))
        vok = r.masque_via(code, False) | (~ndimage.binary_dilation(autres_pads, r.disque(0.45)) & lib[0] & lib[1])
        chemin = r.astar(sources, cibles, lib, vok, cout_via=2.0)
        if not chemin:
            print(f"  {ref}.{num} : pas de chemin vers le plan arrière")
            continue
        r.deposer(chemin, "GND", code, 0.3)
        poses += 1
        print(f"  {ref}.{num} : relié au plan arrière ({len(chemin)} cellules)")
    return poses


def relier_pastille_masse(board, iso, largeur=0.25):
    """Relie une pastille de masse isolée par une vraie piste au cuivre de masse
    (pistes, vias, pastilles) situé à plus de 1,2 mm d'elle, sans compter sur les plans."""
    r = routeur(board, zones=False)
    gnd = board.FindNet("GND")
    code = gnd.GetNetCode()
    poses = 0
    for q in iso:
        ref, num, x, y = q.split(":")
        x, y = float(x), float(y)
        pi, pj = r.vers_grille(x, y)
        tout = [(l, int(i), int(j)) for l in range(2) for j, i in zip(*np.nonzero(r.cu[l] == code))]
        sources = [c for c in tout if math.hypot(c[1] - pi, c[2] - pj) * 0.25 < 0.7 and c[0] == 0]
        cibles = [c for c in tout if math.hypot(c[1] - pi, c[2] - pj) * 0.25 > 1.2]
        cibles = sorted(cibles, key=lambda c: abs(c[1] - pi) + abs(c[2] - pj))[:4000]
        r.classes["GND"] = (largeur, 0.2, False)
        lib = r.masque_libre("GND", code, largeur)
        for (l, i, j) in sources + cibles:
            lib[l][j, i] = True
        limite, r.limite = r.limite, 3000000
        chemin = r.astar(sources, cibles, lib, r.masque_via(code, False), cout_via=3.0)
        r.limite = limite
        if chemin:
            r.deposer(chemin, "GND", code, largeur)
            poses += 1
        print(f"  {ref}.{num} : {'relié' if chemin else 'échec'}")
    return poses


def paires(txt):
    """Paires d'éléments non reliés du rapport DRC : (net, élément A, élément B)."""
    out = []
    for bloc in txt.split("[unconnected_items]")[1:]:
        lignes = re.findall(r"@\(([\d.]+) mm, ([\d.]+) mm\): (.*)", bloc.split("\n[")[0])
        if len(lignes) < 2:
            continue
        elts = []
        for x, y, desc in lignes[:2]:
            m = re.search(r"\[([^\]]+)\]", desc)
            elts.append((float(x), float(y), desc, m.group(1) if m else ""))
        out.append((elts[0][3], elts[0], elts[1]))
    return out


def cellules_element(r, board, elt, net):
    """Cellules de grille couvertes par un élément cité dans le rapport DRC."""
    x, y, desc, _ = elt
    code = board.FindNet(net).GetNetCode()
    if desc.startswith("Zone"):
        couche = 0 if "F.Cu" in desc else 1
        return None, couche
    p = pcbnew.VECTOR2I(pcbnew.FromMM(x), pcbnew.FromMM(y))
    cells = set()
    if "pad" in desc.lower():
        for fp in board.GetFootprints():
            for pad in fp.Pads():
                if pad.GetNetCode() == code and (pad.GetPosition() - p).EuclideanNorm() < pcbnew.FromMM(0.01):
                    couches = [l for l, c in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)) if pad.IsOnLayer(c)]
                    bb = pad.GetBoundingBox()
                    i0, j0 = r.vers_grille(pcbnew.ToMM(bb.GetLeft()), pcbnew.ToMM(bb.GetTop()))
                    i1, j1 = r.vers_grille(pcbnew.ToMM(bb.GetRight()), pcbnew.ToMM(bb.GetBottom()))
                    for l in couches:
                        for j in range(j0, j1 + 1):
                            for i in range(i0, i1 + 1):
                                if r.cu[l, j, i] == code:
                                    cells.add((l, i, j))
                    if not cells:
                        i, j = r.vers_grille(x, y)
                        cells = {(l, i, j) for l in couches}
        return cells, None
    if "Via" in desc:
        i, j = r.vers_grille(x, y)
        return {(0, i, j), (1, i, j)}, None
    # piste : on prend toutes les pistes du net qui passent par ce point, puis leurs voisines directes
    for t in board.GetTracks():
        if t.GetClass() == "PCB_TRACK" and t.GetNetCode() == code and t.HitTest(p, pcbnew.FromMM(0.05)):
            l = 0 if t.GetLayer() == pcbnew.F_Cu else 1
            x0, y0 = pcbnew.ToMM(t.GetStart().x), pcbnew.ToMM(t.GetStart().y)
            x1, y1 = pcbnew.ToMM(t.GetEnd().x), pcbnew.ToMM(t.GetEnd().y)
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 0.1))
            for k in range(n + 1):
                i, j = r.vers_grille(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)
                cells.add((l, i, j))
    return cells, None


def ilot_de(r, code, depart):
    """Îlot (connexité 8, passages de couche aux vias et trous) contenant les cellules de départ."""
    vu = set(c for c in depart if r.cu[c[0], c[2], c[1]] == code)
    pile = list(vu)
    while pile:
        l, i, j = pile.pop()
        voisins = [(l, i + di, j + dj) for di in (-1, 0, 1) for dj in (-1, 0, 1) if di or dj]
        if r.traversant[j, i]:
            voisins.append((1 - l, i, j))
        for v in voisins:
            if v not in vu and 0 <= v[1] < r.nx and 0 <= v[2] < r.ny and r.cu[v[0], v[2], v[1]] == code:
                vu.add(v)
                pile.append(v)
    return vu


def relier_paires(board, txt, nets_vises, largeur_de, iso=0.2):
    routeurs = {}

    def rt(gnd):
        if gnd not in routeurs:
            routeurs[gnd] = routeur(board, zones=gnd)
        return routeurs[gnd]
    bilan = []
    for net, a, b in sorted(paires(txt), key=lambda p: (p[0] == "GND", PRIORITAIRES.index(p[0]) if p[0] in PRIORITAIRES else 9)):
        if net not in nets_vises:
            continue
        r = rt(net == "GND")
        code = board.FindNet(net).GetNetCode()
        ca, la = cellules_element(r, board, a, net)
        cb, lb = cellules_element(r, board, b, net)
        if (ca is None and cb is None) or ca == set() or cb == set():
            print(f"  {net}: élément introuvable ({a[2][:30]} / {b[2][:30]})")
            continue
        if ca is None or cb is None:
            # pastille contre zone : on relie l'îlot de la pastille à tout le reste du net
            src = ca if ca is not None else cb
            ilot = ilot_de(r, code, src)
            ci = sum(c[1] for c in src) / len(src)
            cj = sum(c[2] for c in src) / len(src)
            cible = [(l, int(i), int(j)) for l in range(2) for j, i in zip(*np.nonzero(r.cu[l] == code))
                     if (l, int(i), int(j)) not in ilot]
            if not cible:
                continue
            cible = sorted(cible, key=lambda c: abs(c[1] - ci) + abs(c[2] - cj))[:4000]
            ca, cb = sorted(ilot, key=lambda c: abs(c[1] - ci) + abs(c[2] - cj))[:3000], cible
        ok = False
        for larg in largeur_de(net):
            ancien = r.classes.get(net)
            r.classes[net] = (larg, iso, False)
            libre = r.masque_libre(net, code, larg)
            for (l, i, j) in list(ca) + list(cb):
                libre[l][j, i] = True
            limite, r.limite = r.limite, 3000000
            chemin = r.astar(list(ca)[:3000], list(cb), libre, r.masque_via(code, False), cout_via=4.0)
            r.limite = limite
            r.classes[net] = ancien
            if chemin:
                r.deposer(chemin, net, code, larg)
                ok = True
                break
        bilan.append((net, ok))
        print(f"  {net}: {'ok' if ok else 'échec'}", flush=True)
    return bilan


def degager(board, x0, y0, x1, y1, couche=None):
    """Retire (dans le fichier) les pistes qui traversent une fenêtre, pour libérer
    la sortie de broches enfermées ; elles sont refaites ensuite."""
    from sexpr import ecrire, enfant, enfants, lire
    pcbnew.SaveBoard(str(PCB), board)
    arbre = lire(PCB.read_text())
    n = 0
    for seg in enfants(arbre, "segment"):
        if couche and enfant(seg, "layer")[1] != couche:
            continue
        (_, a, b), (_, c, d) = enfant(seg, "start"), enfant(seg, "end")
        a, b, c, d = map(float, (a, b, c, d))
        if any(x0 <= a + (c - a) * k / 10 <= x1 and y0 <= b + (d - b) * k / 10 <= y1 for k in range(11)):
            arbre.remove(seg)
            n += 1
    PCB.write_text(ecrire(arbre) + "\n")
    return pcbnew.LoadBoard(str(PCB)), n


if __name__ == "__main__":
    trous_sans_cuivre(PCB)
    board = pcbnew.LoadBoard(str(PCB))
    print("raccords :", raccorder(board, portee=1.9))
    txt, nets = drc(board)
    board, n = retirer_conflits(board, txt)
    print("pistes en conflit retirées :", n)
    txt, nets = drc(board)
    print("vias de couture :", coutures(board))
    txt, nets = drc(board)
    if "DI5" in nets or "ETH_RST" in nets:
        board, n = degager(board, 61.5, 116.0, 70.5, 121.5)
        print("pistes dégagées autour de l'ESP32 :", n)
    for tour in range(10):
        txt, nets = drc(board)
        defauts = len(re.findall(r"^\[(clearance|hole_near_hole|via_dangling)\]", txt, re.M))
        print(f"tour {tour + 1} : non connectés {len(nets)} {sorted(set(nets))}, défauts {defauts}", flush=True)
        if not nets and not defauts:
            break
        relier_paires(board, txt, set(nets) - {"GND"},
                      lambda n: (0.4, 0.25) if n in C.NETS_ALIM else (0.25, 0.2))
        print("raccords :", raccorder(board, portee=1.9))
        txt, nets = drc(board)
        if "GND" in nets:
            relier_paires(board, txt, {"GND"}, lambda n: (0.4, 0.3))
            drc(board)
            ok, reste = routeur(board, zones=True).relier_ilots("GND", 0.4, 0.3, essais=30, huit_voisins=True)
            print(f"  îlots de masse : {reste} restant(s)")
            drc(board)
            pcbnew.SaveBoard(str(PCB), board)
            iso = pastilles_isolees(board)
            if relier_pastille_masse(board, iso) < len(iso):
                via_de_masse(board, iso)
        board, n = dedoublonner_vias(board)
        txt, nets = drc(board)
        board, n = retirer_conflits(board, txt, ("clearance", "hole_near_hole", "via_dangling", "track_dangling"))
        print("  éléments en défaut retirés pour reprise :", n)
    txt, nets = drc(board)
    pcbnew.SaveBoard(str(PCB), board)
    print("restant non connecté :", nets)
