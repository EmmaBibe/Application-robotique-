"""Raccordement final des pistes aux pastilles.

Le routeur travaille sur une grille de 0,25 mm ; certaines pastilles ne tombent
pas sur la grille et la piste s'arrête à quelques dixièmes de millimètre du
cuivre. Ce script prolonge chaque extrémité de piste jusqu'au centre de la
pastille du même net la plus proche, puis recoule les plans de masse et
relance le contrôle DRC.
"""

from pathlib import Path

import pcbnew

ICI = Path(__file__).resolve().parent
PCB = ICI / "caz1.kicad_pcb"


def raccorder(board, portee=1.3):
    pads = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() > 0]
    ajouts = 0
    pistes = [t for t in board.GetTracks() if t.GetClass() == "PCB_TRACK"]
    vias = [t for t in board.GetTracks() if t.GetClass() == "PCB_VIA"]
    for t in pistes:
        for pt in (t.GetStart(), t.GetEnd()):
            # extrémité déjà reliée à une autre piste ou à un via : on n'y touche pas
            if any(v.GetNetCode() == t.GetNetCode() and (v.GetPosition() - pt).EuclideanNorm() < 1000 for v in vias):
                continue
            autres = sum(1 for u in pistes if u is not t and u.GetNetCode() == t.GetNetCode()
                         and ((u.GetStart() - pt).EuclideanNorm() < 1000 or (u.GetEnd() - pt).EuclideanNorm() < 1000))
            if autres:
                continue
            cand = [p for p in pads if p.GetNetCode() == t.GetNetCode() and p.IsOnLayer(t.GetLayer())
                    and (p.GetPosition() - pt).EuclideanNorm() < pcbnew.FromMM(portee)]
            if not cand:
                continue
            p = min(cand, key=lambda p: (p.GetPosition() - pt).EuclideanNorm())
            if p.HitTest(pt) and (p.GetPosition() - pt).EuclideanNorm() < pcbnew.FromMM(0.05):
                continue
            s = pcbnew.PCB_TRACK(board)
            s.SetStart(pt)
            s.SetEnd(p.GetPosition())
            s.SetWidth(min(t.GetWidth(), pcbnew.FromMM(0.3)) if t.GetWidth() < pcbnew.FromMM(1) else t.GetWidth())
            s.SetLayer(t.GetLayer())
            s.SetNetCode(t.GetNetCode())
            board.Add(s)
            ajouts += 1
    return ajouts


def nettoyer_pendantes(board):
    """Retire les bouts de piste qui ne mènent nulle part (restes de finition)."""
    retires = 0
    for _ in range(6):
        conn = board.GetConnectivity()
        board.BuildConnectivity()
        pendantes = []
        for t in board.GetTracks():
            if t.GetClass() != "PCB_TRACK":
                continue
            for pt in (t.GetStart(), t.GetEnd()):
                if board.GetConnectivity().TestTrackEndpointDangling(t, pt):
                    pendantes.append(t)
                    break
        if not pendantes:
            break
        for t in pendantes:
            board.Remove(t)
            retires += 1
    return retires


if __name__ == "__main__":
    board = pcbnew.LoadBoard(str(PCB))
    n = raccorder(board)
    print("raccords ajoutés :", n)
    board.BuildConnectivity()
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.SaveBoard(str(PCB), board)
    pcbnew.WriteDRCReport(board, str(ICI / "fabrication" / "drc.rpt"), pcbnew.EDA_UNITS_MILLIMETRES, True)
