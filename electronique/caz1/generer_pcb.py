"""Génère le circuit imprimé de la carte CAZ-1 à partir de conception.py.

Étapes : placement des empreintes, affectation des nets, contour, zones
interdites (antenne, zone 230 V), export Specctra, routage automatique
(Freerouting), réimport, plans de masse, contrôle DRC.

Usage :
    python3 generer_pcb.py placer          # crée caz1_place.kicad_pcb + caz1.dsn
    python3 generer_pcb.py finir caz1.ses  # importe le routage, coule les masses, DRC
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pcbnew

import conception as C

ICI = Path(__file__).resolve().parent
FP = Path("/usr/share/kicad/footprints")
OX, OY = 50.0, 50.0  # décalage de la carte dans la page KiCad


def P(x, y):
    return pcbnew.VECTOR2I(pcbnew.FromMM(OX + x), pcbnew.FromMM(OY + y))


def segment(board, x1, y1, x2, y2, couche, largeur=0.1):
    s = pcbnew.PCB_SHAPE(board)
    s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(P(x1, y1))
    s.SetEnd(P(x2, y2))
    s.SetLayer(couche)
    s.SetWidth(pcbnew.FromMM(largeur))
    board.Add(s)


def texte(board, txt, x, y, taille=1.0, couche=pcbnew.F_SilkS, gras=False, rot=0):
    t = pcbnew.PCB_TEXT(board)
    t.SetText(txt)
    t.SetPosition(P(x, y))
    t.SetLayer(couche)
    t.SetTextSize(pcbnew.VECTOR2I(pcbnew.FromMM(taille), pcbnew.FromMM(taille)))
    t.SetTextThickness(pcbnew.FromMM(taille * (0.2 if gras else 0.15)))
    if rot:
        t.SetTextAngle(pcbnew.EDA_ANGLE(rot, pcbnew.DEGREES_T))
    if couche in (pcbnew.B_SilkS, pcbnew.B_Cu):
        t.SetMirrored(True)
    board.Add(t)


def zone_interdite(board, pts, pistes=True, coulee=True, vias=True):
    z = pcbnew.ZONE(board)
    z.SetIsRuleArea(True)
    z.SetDoNotAllowTracks(pistes)
    z.SetDoNotAllowVias(vias)
    z.SetDoNotAllowCopperPour(coulee)
    z.SetDoNotAllowPads(False)
    z.SetDoNotAllowFootprints(False)
    ls = pcbnew.LSET()
    ls.AddLayer(pcbnew.F_Cu)
    ls.AddLayer(pcbnew.B_Cu)
    z.SetLayerSet(ls)
    o = z.Outline()
    o.NewOutline()
    for x, y in pts:
        o.Append(pcbnew.FromMM(OX + x), pcbnew.FromMM(OY + y))
    board.Add(z)


def placer():
    board = pcbnew.BOARD()
    ds = board.GetDesignSettings()
    ds.SetCopperLayerCount(2)
    ds.m_TrackMinWidth = pcbnew.FromMM(0.2)
    ds.m_MinClearance = pcbnew.FromMM(0.2)
    ds.m_ViasMinSize = pcbnew.FromMM(0.6)
    ds.m_MinThroughDrill = pcbnew.FromMM(0.2)

    nets = {}
    for n in C.nets():
        ni = pcbnew.NETINFO_ITEM(board, n)
        board.Add(ni)
        nets[n] = ni

    for comp in C.COMPOSANTS:
        lib, nom = comp.empreinte.split(":")
        fp = pcbnew.FootprintLoad(str(FP / f"{lib}.pretty"), nom)
        if fp is None:
            raise SystemExit(f"empreinte introuvable : {comp.empreinte}")
        fp.SetReference(comp.ref)
        fp.SetValue(comp.valeur)
        fp.SetFPID(pcbnew.LIB_ID(lib, nom))
        board.Add(fp)
        fp.SetPosition(P(comp.x, comp.y))
        fp.SetOrientationDegrees(comp.rot)
        fp.Reference().SetTextSize(pcbnew.VECTOR2I(pcbnew.FromMM(0.8), pcbnew.FromMM(0.8)))
        fp.Reference().SetTextThickness(pcbnew.FromMM(0.12))
        fp.Value().SetVisible(False)
        for pad in fp.Pads():
            net = comp.broches.get(pad.GetNumber())
            if net:
                pad.SetNet(nets[net])

    # contour à coins arrondis (rayon 3 mm)
    W, H, R = C.LARGEUR, C.HAUTEUR, 3.0
    for x1, y1, x2, y2 in ((R, 0, W - R, 0), (W, R, W, H - R), (W - R, H, R, H), (0, H - R, 0, R)):
        segment(board, x1, y1, x2, y2, pcbnew.Edge_Cuts)
    for cx, cy, a0 in ((R, R, 180), (W - R, R, 270), (W - R, H - R, 0), (R, H - R, 90)):
        arc = pcbnew.PCB_SHAPE(board)
        arc.SetShape(pcbnew.SHAPE_T_ARC)
        arc.SetCenter(P(cx, cy))
        import math
        sx = cx + R * math.cos(math.radians(a0))
        sy = cy + R * math.sin(math.radians(a0))
        arc.SetStart(P(sx, sy))
        arc.SetArcAngleAndEnd(pcbnew.EDA_ANGLE(90, pcbnew.DEGREES_T))
        arc.SetLayer(pcbnew.Edge_Cuts)
        arc.SetWidth(pcbnew.FromMM(0.1))
        board.Add(arc)

    # antenne de l'ESP32 : aucun cuivre sous l'antenne ni à côté
    # l antenne de l ESP32 depasse du bord gauche : la zone interdite est celle de l empreinte

    # séparation basse tension / 230 V : sérigraphie et zone sans coulée de masse
    segment(board, 2, 40.5, 148, 40.5, pcbnew.F_SilkS, 0.3)
    texte(board, "ZONE 230 V AC - ISOLER AVANT INTERVENTION", 75, 39, 1.2, gras=True)

    # sérigraphie : titre, repères de borniers
    texte(board, f"{C.TITRE.upper()}  rev {C.REVISION}", 75, 66, 1.6, gras=True)
    texte(board, "Serre pilote Lubumbashi - 24 V DC - 6 x 5 A / 250 V AC", 75, 69, 1.0)
    for txt, x, y in C.SERIGRAPHIE:
        texte(board, txt, x, y, 0.9)
    for n, lab in ((51, "ALIM"), (52, "RUN"), (53, "AUTO"), (54, "DEF")):
        comp = next(c for c in C.COMPOSANTS if c.ref == f"D{n}")
        texte(board, lab, comp.x, comp.y + 3.2, 0.8)
    texte(board, "CAZ-1", 75, 80, 3, couche=pcbnew.B_SilkS, gras=True)
    texte(board, "Projet serre Lubumbashi - fabrication 2 couches FR4 1,6 mm 35 µm", 75, 85, 1.0, couche=pcbnew.B_SilkS)

    board.SetFileName(str(ICI / "caz1_place.kicad_pcb"))
    pcbnew.SaveBoard(str(ICI / "caz1_place.kicad_pcb"), board)
    pcbnew.ExportSpecctraDSN(board, str(ICI / "caz1.dsn"))
    ajouter_classes_dsn(ICI / "caz1.dsn")
    print("placement enregistré, DSN exporté")


def ajouter_classes_dsn(chemin: Path):
    """Ajoute au fichier Specctra les classes de pistes (largeur, isolement), en µm.

    - puissance_230 : contacts des relais, pistes de 2,5 mm, isolement 2 mm ;
    - alimentation : 24 V, 3,3 V et masse, pistes de 0,8 mm ;
    - par défaut : signaux, pistes de 0,3 mm.
    """
    t = chemin.read_text()
    debut = t.index("(class kicad_default")
    fin_noms = t.index("(circuit", debut)
    noms = t[debut + len("(class kicad_default"):fin_noms].split()
    speciaux = set(C.NETS_PUISSANCE_230) | set(C.NETS_ALIM)
    restants = [n for n in noms if n not in speciaux]
    via = re.search(r"\(use_via ([^)]+)\)", t[fin_noms:]).group(1)

    def bloc(nom, membres, largeur, isolement):
        return (f"    (class {nom} " + " ".join(membres) + "\n"
                f"      (circuit (use_via {via}))\n"
                f"      (rule (width {largeur}) (clearance {isolement}))\n    )\n")

    fin_classe = t.index("  (wiring")
    fin_reseau = t.rindex("  )", 0, fin_classe)
    nouveau = (bloc("kicad_default", restants, 300, 200)
               + bloc("puissance_230", C.NETS_PUISSANCE_230, 2500, 2000)
               + bloc("alimentation", C.NETS_ALIM, 800, 250))
    t = t[:debut - 4] + nouveau + t[fin_reseau:]
    chemin.write_text(t)


def router(echecs_prec=None):
    """Routage par le routeur maison (electronique/outils/routeur.py).

    Plusieurs passes : les connexions qui ont échoué sont routées en premier à
    la passe suivante (principe du « rip-up and reroute »). On garde la
    meilleure passe."""
    sys.path.insert(0, str(ICI.parent / "outils"))
    from routeur import Routeur
    classes = {}
    for n in C.nets():
        if n in C.NETS_PUISSANCE_230:
            classes[n] = (2.5, 2.0, True)
        elif n == "GND":
            classes[n] = (0.5, 0.2, False)
        elif n in C.NETS_ALIM:
            classes[n] = (0.6, 0.2, False)
        else:
            classes[n] = (0.3, 0.2, False)
    meilleur, prioritaires = None, []
    for passe in range(4):
        board = pcbnew.LoadBoard(str(ICI / "caz1_place.kicad_pcb"))
        r = Routeur(board, OX, OY, C.LARGEUR, C.HAUTEUR, classes)
        couloirs = []
        for fp in board.GetFootprints():
            if fp.GetReference().startswith("K"):
                for pad in fp.Pads():
                    if pad.GetNetname() in ("+24V",) or pad.GetNetname().endswith("_COIL"):
                        x = pcbnew.ToMM(pad.GetPosition().x) - OX
                        y = pcbnew.ToMM(pad.GetPosition().y) - OY
                        couloirs.append((OX + x - 1.6, OX + x + 1.6, OY + y - 1.6))
        r.bande_haute_tension(OY + 39.0, couloirs)

        def etendue(n):
            pads = r.pads_par_net.get(n, [])
            if len(pads) < 2:
                return 0
            xs = [p["centre"][0] for p in pads]
            ys = [p["centre"][1] for p in pads]
            return (max(xs) - min(xs)) + (max(ys) - min(ys))

        base = (C.NETS_PUISSANCE_230
                + ["+24V_IN", "+24V_F", "+24V", "+24V_AUX", "+3V3"]
                + sorted([n for n in C.nets() if n not in C.NETS_PUISSANCE_230 + C.NETS_ALIM], key=etendue)
                )
        ordre = [n for n in C.NETS_PUISSANCE_230] + [n for n in prioritaires if n not in C.NETS_PUISSANCE_230] \
            + [n for n in base if n not in prioritaires and n not in C.NETS_PUISSANCE_230]
        for n in ordre:
            r.router_net(n)
        nets_ko = sorted({e[0] for e in r.echecs})
        print(f"passe {passe + 1} : {len(r.echecs)} connexions non routées {nets_ko}", flush=True)
        if meilleur is None or len(r.echecs) < meilleur[0]:
            meilleur = (len(r.echecs), board, list(r.echecs), r)
        if not nets_ko:
            break
        prioritaires = nets_ko + [n for n in prioritaires if n not in nets_ko]
    # finition : connexions restantes en pistes de 0,2 mm, isolement 0,15 mm
    _, board, echecs, r = meilleur
    restants = []
    for net, k in echecs:
        ok = r.completer(net, k, 0.2 if net not in C.NETS_ALIM else 0.4, 0.15)
        print(f"finition {net} pastille {k} : {'ok' if ok else 'échec'}", flush=True)
        if not ok:
            restants.append((net, k))
    return board, restants


def finir(ses: str):
    if ses == "maison":
        board, echecs = router()
        print("connexions non routées :", echecs)
    else:
        board = pcbnew.LoadBoard(str(ICI / "caz1_place.kicad_pcb"))
        if not pcbnew.ImportSpecctraSES(board, str(ICI / ses)):
            raise SystemExit("import SES échoué")
    gnd = board.FindNet("GND")
    # plans de masse sur les deux faces, uniquement en zone basse tension
    for couche in (pcbnew.F_Cu, pcbnew.B_Cu):
        z = pcbnew.ZONE(board)
        z.SetLayer(couche)
        z.SetNetCode(gnd.GetNetCode())
        z.SetLocalClearance(pcbnew.FromMM(0.35))
        z.SetMinThickness(pcbnew.FromMM(0.25))
        z.SetThermalReliefGap(pcbnew.FromMM(0.4))
        z.SetThermalReliefSpokeWidth(pcbnew.FromMM(0.5))
        z.SetPadConnection(pcbnew.ZONE_CONNECTION_THT_THERMAL)  # CMS en plein, traversants en thermique
        o = z.Outline()
        o.NewOutline()
        for x, y in ((1, 42), (149, 42), (149, 109), (1, 109)):
            o.Append(pcbnew.FromMM(OX + x), pcbnew.FromMM(OY + y))
        board.Add(z)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    sortie = ICI / "caz1.kicad_pcb"
    board.SetFileName(str(sortie))
    pcbnew.SaveBoard(str(sortie), board)
    pcbnew.WriteDRCReport(board, str(ICI / "fabrication" / "drc.rpt"), pcbnew.EDA_UNITS_MILLIMETRES, True)
    print("carte routée enregistrée :", sortie)


if __name__ == "__main__":
    (ICI / "fabrication").mkdir(exist_ok=True)
    if sys.argv[1] == "placer":
        placer()
    else:
        finir(sys.argv[2])
