"""Mise au propre de la sérigraphie : repères des composants placés là où ils
ne chevauchent ni une pastille, ni un autre texte, ni un contour de composant ;
textes de la carte déplacés vers une zone libre si nécessaire.

Usage : python3 serigraphie.py   (après finaliser.py)
"""

from pathlib import Path

import pcbnew

ICI = Path(__file__).resolve().parent
PCB = ICI / "caz1.kicad_pcb"
mm, FM = pcbnew.ToMM, pcbnew.FromMM


def boite(item, marge=0.0):
    b = item.GetBoundingBox()
    return (mm(b.GetLeft()) - marge, mm(b.GetTop()) - marge, mm(b.GetRight()) + marge, mm(b.GetBottom()) + marge)


def touche(a, b):
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def obstacles(board, cote):
    """Rectangles interdits à la sérigraphie d'une face : pastilles, traits de sérigraphie des empreintes."""
    couche_cu = pcbnew.F_Cu if cote == "F" else pcbnew.B_Cu
    couche_si = pcbnew.F_SilkS if cote == "F" else pcbnew.B_SilkS
    rects = []
    for fp in board.GetFootprints():
        for p in fp.Pads():
            if p.IsOnLayer(couche_cu) or p.GetAttribute() == pcbnew.PAD_ATTRIB_NPTH:
                rects.append(boite(p, 0.2))
        for g in fp.GraphicalItems():
            if g.GetLayer() == couche_si and g.GetClass() != "PCB_TEXT" and "TEXT" not in g.GetClass():
                rects.append(boite(g, 0.12))
    return rects


def ranger(board):
    e = board.GetBoardEdgesBoundingBox()
    x0, y0, x1, y1 = mm(e.GetLeft()) + 0.6, mm(e.GetTop()) + 0.6, mm(e.GetRight()) - 0.6, mm(e.GetBottom()) - 0.6
    obs = {"F": obstacles(board, "F"), "B": obstacles(board, "B")}
    places = {"F": [], "B": []}
    caches = []
    # textes de la carte d'abord (ils sont plus gros)
    for t in board.GetDrawings():
        if t.GetClass() != "PCB_TEXT" or t.GetLayer() not in (pcbnew.F_SilkS, pcbnew.B_SilkS):
            continue
        cote = "F" if t.GetLayer() == pcbnew.F_SilkS else "B"
        depart = t.GetPosition()
        ok = False
        for r in range(0, 60):
            for dx, dy in ((0, 0),) if r == 0 else [(r * 0.5 * sx, r * 0.5 * sy) for sx, sy in ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (-1, 1), (1, -1), (-1, -1))]:
                t.SetPosition(pcbnew.VECTOR2I(depart.x + FM(dx), depart.y + FM(dy)))
                b = boite(t, 0.15)
                if b[0] < x0 or b[1] < y0 or b[2] > x1 or b[3] > y1:
                    continue
                if not any(touche(b, o) for o in obs[cote] + places[cote]):
                    ok = True
                    break
            if ok:
                break
        if not ok:
            t.SetPosition(depart)
        places[cote].append(boite(t, 0.15))
    for fp in sorted(board.GetFootprints(), key=lambda f: -boite(f)[2] + boite(f)[0]):
        ref = fp.Reference()
        cote = "B" if fp.IsFlipped() else "F"
        if not ref.IsVisible():
            continue
        fb = None
        for g in fp.GraphicalItems():
            if g.GetLayer() in (pcbnew.F_CrtYd, pcbnew.B_CrtYd):
                b = boite(g)
                fb = b if fb is None else (min(fb[0], b[0]), min(fb[1], b[1]), max(fb[2], b[2]), max(fb[3], b[3]))
        if fb is None:
            fb = boite(fp)
        cx, cy = (fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2
        ok = False
        for taille in (0.8,):
            ref.SetTextSize(pcbnew.VECTOR2I(FM(taille), FM(taille)))
            ref.SetTextThickness(FM(taille * 0.15))
            ref.SetTextAngle(pcbnew.EDA_ANGLE(0, pcbnew.DEGREES_T))
            h = taille
            cands = [(cx, fb[1] - h / 2 - 0.15), (cx, fb[3] + h / 2 + 0.15), (cx, cy)]
            larg = len(ref.GetText()) * taille * 0.75
            cands += [(fb[0] - larg / 2 - 0.2, cy), (fb[2] + larg / 2 + 0.2, cy)]
            cands += [(cx + dx, cy + dy) for dx in (-2, 2, -3.5, 3.5) for dy in (-2.5, 2.5, 0)]
            for x, y in cands:
                ref.SetPosition(pcbnew.VECTOR2I(FM(x), FM(y)))
                b = boite(ref, 0.1)
                if b[0] < x0 or b[1] < y0 or b[2] > x1 or b[3] > y1:
                    continue
                if not any(touche(b, o) for o in obs[cote] + places[cote]):
                    ok = True
                    break
            if ok:
                break
        if ok:
            places[cote].append(boite(ref, 0.1))
        else:
            ref.SetVisible(False)   # le repère reste sur le plan d'assemblage (couche Fab)
            caches.append(fp.GetReference())
    return caches


if __name__ == "__main__":
    board = pcbnew.LoadBoard(str(PCB))
    caches = ranger(board)
    print("repères masqués en sérigraphie (visibles sur le plan d'assemblage) :", caches)
    pcbnew.SaveBoard(str(PCB), board)
