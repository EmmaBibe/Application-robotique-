"""Routeur de pistes sur grille pour cartes deux couches (KiCad / pcbnew).

Algorithme : recherche A* sur une grille de 0,25 mm, deux couches, passages
de couche par vias, déplacements à 45°, coûts de direction préférentielle
(horizontal en face avant, vertical en face arrière) pour limiter les
croisements. Chaque net est routé en arbre (Prim) : on relie la pastille la
plus proche à l'ensemble déjà connecté.

Isolements gérés par classe :
  - pistes 230 V : 2,5 mm de large, 2 mm d'isolement vis-à-vis de tout autre net ;
  - alimentations : 0,6 mm (masse 0,5 mm) ;
  - signaux : 0,3 mm, isolement 0,2 mm.

Le résultat est vérifié ensuite par le contrôle DRC de KiCad.
"""

from __future__ import annotations

import heapq
import math

import numpy as np
import pcbnew
from scipy import ndimage

G = 0.25  # pas de grille (mm)


class Routeur:
    def __init__(self, board, ox, oy, largeur, hauteur, classes, bord=0.4):
        self.b = board
        self.ox, self.oy = ox, oy
        self.nx = int(round(largeur / G)) + 1
        self.ny = int(round(hauteur / G)) + 1
        self.classes = classes  # net -> (largeur, isolement, haute_tension)
        # cuivre par couche : -1 libre, sinon code de net ; -2 obstacle dur
        self.cu = np.full((2, self.ny, self.nx), -1, dtype=np.int32)
        self.hv = np.zeros((2, self.ny, self.nx), dtype=bool)
        self.pastille = np.zeros((self.ny, self.nx), dtype=bool)
        self.disques = {}
        n = int(math.ceil(bord / G))
        for l in range(2):
            self.cu[l, :n, :] = -2
            self.cu[l, -n:, :] = -2
            self.cu[l, :, :n] = -2
            self.cu[l, :, -n:] = -2
        self.pads_par_net = {}
        self._rasteriser_pastilles()
        self.echecs = []
        self.interdit_bt = np.zeros((self.ny, self.nx), dtype=bool)
        self.limite = 350000

    def bande_haute_tension(self, y_limite, couloirs, isolement_bt=4.0):
        """Interdit aux nets basse tension la bande y < y_limite, sauf des couloirs
        rectangulaires (x0, x1, y0) menant aux bobines des relais. L'isolement entre
        basse tension et 230 V est porté à isolement_bt."""
        jl = int((y_limite - self.oy) / G)
        self.interdit_bt[:jl, :] = True
        for x0, x1, y0 in couloirs:
            i0, j0 = self.vers_grille(x0, y0)
            i1, _ = self.vers_grille(x1, y0)
            self.interdit_bt[j0:jl + 1, i0:i1 + 1] = False
        self.iso_bt_hv = isolement_bt

    # ------------------------------------------------------------ outils
    def mm(self, v):
        return pcbnew.ToMM(v)

    def vers_grille(self, x, y):
        return int(round((x - self.ox) / G)), int(round((y - self.oy) / G))

    def vers_mm(self, i, j):
        return self.ox + i * G, self.oy + j * G

    def disque(self, rayon_mm):
        r = int(math.ceil(rayon_mm / G))
        if r not in self.disques:
            y, x = np.ogrid[-r:r + 1, -r:r + 1]
            self.disques[r] = (x * x + y * y) <= (rayon_mm / G) ** 2 + 0.5
        return self.disques[r]

    def net_hv(self, net):
        return self.classes.get(net, (0.3, 0.2, False))[2]

    # ------------------------------------------------------------ pastilles
    def _rasteriser_pastilles(self):
        for fp in self.b.GetFootprints():
            for pad in fp.Pads():
                net = pad.GetNetname()
                code = pad.GetNetCode() if net else -2
                bb = pad.GetBoundingBox()
                x0, x1 = self.mm(bb.GetLeft()), self.mm(bb.GetRight())
                y0, y1 = self.mm(bb.GetTop()), self.mm(bb.GetBottom())
                i0, j0 = self.vers_grille(x0, y0)
                i1, j1 = self.vers_grille(x1, y1)
                i0, j0 = max(i0, 0), max(j0, 0)
                i1, j1 = min(i1, self.nx - 1), min(j1, self.ny - 1)
                forme = pad.GetShape()
                rond = forme in (pcbnew.PAD_SHAPE_CIRCLE, pcbnew.PAD_SHAPE_OVAL)
                cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
                rx, ry = max((x1 - x0) / 2, G / 2), max((y1 - y0) / 2, G / 2)
                cellules = []
                for j in range(j0, j1 + 1):
                    for i in range(i0, i1 + 1):
                        x, y = self.vers_mm(i, j)
                        if rond and rx == ry and ((x - cx) ** 2 + (y - cy) ** 2) > rx * rx + 0.01:
                            continue
                        cellules.append((i, j))
                if not cellules:
                    i, j = self.vers_grille(cx, cy)
                    cellules = [(i, j)]
                couches = []
                if pad.IsOnLayer(pcbnew.F_Cu):
                    couches.append(0)
                if pad.IsOnLayer(pcbnew.B_Cu):
                    couches.append(1)
                hv = self.net_hv(net)
                for l in couches:
                    for i, j in cellules:
                        self.cu[l, j, i] = code
                        self.hv[l, j, i] = hv
                for i, j in cellules:
                    self.pastille[j, i] = True
                if net:
                    centre = self.vers_grille(cx, cy)
                    self.pads_par_net.setdefault(net, []).append({
                        "cellules": cellules, "couches": couches, "centre": centre, "code": code})

    # ------------------------------------------------------------ masques
    def masque_libre(self, net, code, largeur):
        """Cellules où le centre d'une piste du net peut passer, par couche."""
        demi = largeur / 2
        hv_moi = self.net_hv(net)
        libre = []
        for l in range(2):
            autres = (self.cu[l] != code) & (self.cu[l] != -1)
            dur = self.cu[l] == -2
            iso_bt = self.classes.get(net, (0.3, 0.2, False))[1]
            r_bt = demi + max(iso_bt, 0.2) + G * 0.7
            r_hv = demi + (2.0 if hv_moi else getattr(self, "iso_bt_hv", 2.0)) + G * 0.7
            if hv_moi:
                bloque = ndimage.binary_dilation(autres & ~dur, self.disque(r_hv))
            else:
                bt = autres & ~self.hv[l] & ~dur
                hv = autres & self.hv[l]
                bloque = ndimage.binary_dilation(bt, self.disque(r_bt)) | ndimage.binary_dilation(hv, self.disque(r_hv))
            bloque |= ndimage.binary_dilation(dur, self.disque(demi + 0.2 + G * 0.5))
            if not hv_moi:
                bloque |= self.interdit_bt
            libre.append(~bloque)
        return libre

    def masque_via(self, code, hv_moi):
        r = 0.3 + (2.0 if hv_moi else 0.2) + G * 0.7
        ok = np.ones((self.ny, self.nx), dtype=bool)
        for l in range(2):
            autres = (self.cu[l] != code) & (self.cu[l] != -1)
            r_hv = 0.3 + 2.0 + G * 0.7
            bt = autres & ~self.hv[l]
            ok &= ~ndimage.binary_dilation(bt, self.disque(r))
            ok &= ~ndimage.binary_dilation(autres & self.hv[l], self.disque(r_hv))
        ok &= ~ndimage.binary_dilation(self.pastille, self.disque(0.45))
        return ok

    # ------------------------------------------------------------ A*
    def astar(self, sources, cibles, libre, via_ok, cout_via=7.0):
        nx = self.nx
        cible_set = set(cibles)
        tx = sum(c[1] for c in cibles) / len(cibles)
        ty = sum(c[2] for c in cibles) / len(cibles)
        lib = [libre[0].ravel(), libre[1].ravel()]
        vok = via_ok.ravel()
        dist = {}
        parent = {}
        tas = []
        for s in sources:
            l, i, j = s
            dist[s] = 0.0
            heapq.heappush(tas, (math.hypot(i - tx, j - ty), 0.0, s))
        voisins = [(1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0),
                   (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)]
        expansions = 0
        while tas:
            f, d, s = heapq.heappop(tas)
            if d > dist.get(s, 1e18):
                continue
            if s in cible_set:
                chemin = [s]
                while s in parent:
                    s = parent[s]
                    chemin.append(s)
                return chemin[::-1]
            expansions += 1
            if expansions > self.limite:
                return None
            l, i, j = s
            for di, dj, c in voisins:
                ii, jj = i + di, j + dj
                if not (0 <= ii < nx and 0 <= jj < self.ny):
                    continue
                k = jj * nx + ii
                if not lib[l][k]:
                    continue
                if di and dj and not (lib[l][j * nx + ii] and lib[l][jj * nx + i]):
                    continue
                # direction préférentielle : avant horizontal, arrière vertical
                if (l == 0 and dj and not di) or (l == 1 and di and not dj):
                    c *= 1.25
                n = (l, ii, jj)
                nd = d + c
                if nd < dist.get(n, 1e18):
                    dist[n] = nd
                    parent[n] = s
                    heapq.heappush(tas, (nd + math.hypot(ii - tx, jj - ty) * 1.15, nd, n))
            k = j * nx + i
            if vok[k] and lib[1 - l][k]:
                n = (1 - l, i, j)
                nd = d + cout_via
                if nd < dist.get(n, 1e18):
                    dist[n] = nd
                    parent[n] = s
                    heapq.heappush(tas, (nd + math.hypot(i - tx, j - ty) * 1.15, nd, n))
        return None

    # ------------------------------------------------------------ dépôt du cuivre
    def deposer(self, chemin, net, code, largeur):
        netinfo = self.b.FindNet(net)
        hv = self.net_hv(net)
        r = self.disque(largeur / 2)
        rr = r.shape[0] // 2
        # rasterisation
        for (l, i, j) in chemin:
            j0, j1 = max(j - rr, 0), min(j + rr + 1, self.ny)
            i0, i1 = max(i - rr, 0), min(i + rr + 1, self.nx)
            sous = r[rr - (j - j0):rr + (j1 - j), rr - (i - i0):rr + (i1 - i)]
            zone = self.cu[l, j0:j1, i0:i1]
            m = sous & (zone == -1)
            zone[m] = code
            self.hv[l, j0:j1, i0:i1][m] = hv
        # segments et vias
        segs = []
        debut = chemin[0]
        prec = chemin[0]
        dirp = None
        dernier_via = None
        for s in chemin[1:]:
            if s[0] != prec[0]:
                if prec != debut:
                    segs.append((debut, prec))
                if dernier_via and abs(dernier_via[0] - prec[1]) + abs(dernier_via[1] - prec[2]) <= 4:
                    # deux changements de couche rapprochés : un seul via, liaison directe sur la couche d'arrivée
                    segs.append(((s[0], dernier_via[0], dernier_via[1]), (s[0], prec[1], prec[2])))
                else:
                    self._via(prec[1], prec[2], netinfo, code)
                    dernier_via = (prec[1], prec[2])
                debut = s
                dirp = None
            else:
                d = (s[1] - prec[1], s[2] - prec[2])
                if dirp is not None and d != dirp:
                    segs.append((debut, prec))
                    debut = prec
                dirp = d
            prec = s
        if prec != debut:
            segs.append((debut, prec))
        for a, bq in segs:
            if (a[1], a[2]) == (bq[1], bq[2]):
                continue
            t = pcbnew.PCB_TRACK(self.b)
            t.SetStart(pcbnew.VECTOR2I(pcbnew.FromMM(self.ox + a[1] * G), pcbnew.FromMM(self.oy + a[2] * G)))
            t.SetEnd(pcbnew.VECTOR2I(pcbnew.FromMM(self.ox + bq[1] * G), pcbnew.FromMM(self.oy + bq[2] * G)))
            t.SetWidth(pcbnew.FromMM(largeur))
            t.SetLayer(pcbnew.F_Cu if a[0] == 0 else pcbnew.B_Cu)
            t.SetNet(netinfo)
            self.b.Add(t)

    def _via(self, i, j, netinfo, code):
        v = pcbnew.PCB_VIA(self.b)
        v.SetPosition(pcbnew.VECTOR2I(pcbnew.FromMM(self.ox + i * G), pcbnew.FromMM(self.oy + j * G)))
        v.SetWidth(pcbnew.FromMM(0.6))
        v.SetDrill(pcbnew.FromMM(0.3))
        v.SetNet(netinfo)
        self.b.Add(v)
        d = self.disque(0.3)
        rr = d.shape[0] // 2
        for l in range(2):
            j0, j1 = max(j - rr, 0), min(j + rr + 1, self.ny)
            i0, i1 = max(i - rr, 0), min(i + rr + 1, self.nx)
            sous = d[rr - (j - j0):rr + (j1 - j), rr - (i - i0):rr + (i1 - i)]
            zone = self.cu[l, j0:j1, i0:i1]
            zone[sous & (zone == -1)] = code
        self.pastille[j, i] = True

    # ------------------------------------------------------------ routage d'un net
    def router_net(self, net):
        pads = self.pads_par_net.get(net, [])
        if len(pads) < 2:
            return True
        largeur = self.classes.get(net, (0.3, 0.2, False))[0]
        code = pads[0]["code"]
        hv = self.net_hv(net)
        restants = list(range(1, len(pads)))
        arbre = set((l, i, j) for l in pads[0]["couches"] for i, j in pads[0]["cellules"])
        ok_total = True
        while restants:
            # pastille la plus proche de l'arbre
            ax = np.array([[s[1], s[2]] for s in arbre])
            meilleur = min(restants, key=lambda k: np.min(np.abs(ax - np.array(pads[k]["centre"])).sum(axis=1)))
            restants.remove(meilleur)
            p = pads[meilleur]
            cibles = [(l, i, j) for l in p["couches"] for i, j in p["cellules"]]
            libre = self.masque_libre(net, code, largeur)
            # les cellules de l'arbre et de la cible restent accessibles
            for (l, i, j) in list(arbre) + cibles:
                libre[l][j, i] = True
            via_ok = self.masque_via(code, hv)
            # sources limitées aux cellules les plus proches pour accélérer
            cx, cy = p["centre"]
            sources = sorted(arbre, key=lambda s: abs(s[1] - cx) + abs(s[2] - cy))[:400]
            chemin = self.astar(sources, cibles, libre, via_ok)
            if chemin is None:
                self.echecs.append((net, meilleur))
                ok_total = False
                continue
            self.deposer(chemin, net, code, largeur)
            arbre.update(chemin)
            arbre.update(cibles)
        return ok_total

    # ------------------------------------------------------------ finition
    def completer(self, net, index_pad, largeur, isolement):
        """Relie une pastille restée isolée au cuivre déjà posé du même net,
        avec une piste plus fine et une recherche plus profonde."""
        pads = self.pads_par_net[net]
        code = pads[0]["code"]
        p = pads[index_pad]
        ancien = self.classes.get(net)
        self.classes[net] = (largeur, isolement, False)
        libre = self.masque_libre(net, code, largeur)
        cibles = [(l, i, j) for l in p["couches"] for i, j in p["cellules"]]
        cibles_set = set(cibles)
        sources = [(l, int(i), int(j)) for l in range(2) for j, i in zip(*np.nonzero(self.cu[l] == code))
                   if (l, int(i), int(j)) not in cibles_set]
        if not sources:
            self.classes[net] = ancien
            return False
        for (l, i, j) in sources + cibles:
            libre[l][j, i] = True
        cx, cy = p["centre"]
        sources = sorted(sources, key=lambda s: abs(s[1] - cx) + abs(s[2] - cy))[:1500]
        via_ok = self.masque_via(code, False)
        limite = self.limite
        self.limite = 2500000
        chemin = self.astar(sources, cibles, libre, via_ok, cout_via=5.0)
        self.limite = limite
        if chemin:
            self.deposer(chemin, net, code, largeur)
        self.classes[net] = ancien
        return chemin is not None

    # ------------------------------------------------------------ reprise d'une carte déjà routée
    def importer_cuivre(self, zones=False):
        """Rasterise les pistes et vias existants (et, si demandé, le remplissage
        des zones) pour reprendre le routage d'une carte déjà travaillée."""
        self.traversant = np.zeros((self.ny, self.nx), dtype=bool)
        for fp in self.b.GetFootprints():
            for pad in fp.Pads():
                if pad.IsOnLayer(pcbnew.F_Cu) and pad.IsOnLayer(pcbnew.B_Cu) and pad.GetNetCode() > 0:
                    for d in self.pads_par_net.get(pad.GetNetname(), []):
                        if d["couches"] == [0, 1]:
                            for i, j in d["cellules"]:
                                self.traversant[j, i] = True
        for t in self.b.GetTracks():
            code = t.GetNetCode()
            hv = self.net_hv(t.GetNetname())
            if t.GetClass() == "PCB_VIA":
                x, y = self.mm(t.GetPosition().x), self.mm(t.GetPosition().y)
                i, j = self.vers_grille(x, y)
                for l in range(2):
                    self._tampon(l, i, j, self.mm(t.GetWidth()) / 2, code, hv)
                self.pastille[j, i] = True
                self.traversant[j, i] = True
                continue
            l = 0 if t.GetLayer() == pcbnew.F_Cu else 1
            x0, y0 = self.mm(t.GetStart().x), self.mm(t.GetStart().y)
            x1, y1 = self.mm(t.GetEnd().x), self.mm(t.GetEnd().y)
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / (G / 2)))
            for k in range(n + 1):
                i, j = self.vers_grille(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)
                self._tampon(l, i, j, max(self.mm(t.GetWidth()) / 2, G * 0.6), code, hv)
        if zones:
            from matplotlib.path import Path as Chemin
            xs = self.ox + np.arange(self.nx) * G
            ys = self.oy + np.arange(self.ny) * G
            gx, gy = np.meshgrid(xs, ys)
            pts = np.column_stack([gx.ravel(), gy.ravel()])
            for z in self.b.Zones():
                code = z.GetNetCode()
                for couche, l in ((pcbnew.F_Cu, 0), (pcbnew.B_Cu, 1)):
                    if not z.IsOnLayer(couche):
                        continue
                    ps = z.GetFilledPolysList(couche)
                    for k in range(ps.OutlineCount()):
                        def contour(ch):
                            return np.array([[self.mm(ch.CPoint(m).x), self.mm(ch.CPoint(m).y)] for m in range(ch.PointCount())])
                        dedans = Chemin(contour(ps.Outline(k))).contains_points(pts, radius=-0.01)
                        for h in range(ps.HoleCount(k)):
                            dedans &= ~Chemin(contour(ps.Hole(k, h))).contains_points(pts)
                        m = dedans.reshape(self.ny, self.nx) & (self.cu[l] == -1)
                        self.cu[l][m] = code

    def _tampon(self, l, i, j, rayon, code, hv):
        d = self.disque(rayon)
        rr = d.shape[0] // 2
        j0, j1 = max(j - rr, 0), min(j + rr + 1, self.ny)
        i0, i1 = max(i - rr, 0), min(i + rr + 1, self.nx)
        if j0 >= j1 or i0 >= i1:
            return
        sous = d[rr - (j - j0):rr + (j1 - j), rr - (i - i0):rr + (i1 - i)]
        zone = self.cu[l, j0:j1, i0:i1]
        m = sous & (zone == -1)
        zone[m] = code
        self.hv[l, j0:j1, i0:i1][m] = hv

    def ilots(self, code, huit_voisins=False):
        """Îlots de cuivre d'un net : liste de listes de cellules (l, i, j)."""
        # connexité 4 par défaut (pistes fines) ; 8 pour les plans coulés
        huit = np.ones((3, 3), dtype=bool) if huit_voisins else None
        lab = []
        n = 0
        for l in range(2):
            e, k = ndimage.label(self.cu[l] == code, structure=huit)
            e[e > 0] += n
            lab.append(e)
            n += k
        parent = list(range(n + 1))

        def racine(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a
        lien = self.traversant & (lab[0] > 0) & (lab[1] > 0)
        for a, b in zip(lab[0][lien], lab[1][lien]):
            ra, rb = racine(int(a)), racine(int(b))
            if ra != rb:
                parent[ra] = rb
        groupes = {}
        for l in range(2):
            js, is_ = np.nonzero(lab[l])
            for j, i in zip(js, is_):
                groupes.setdefault(racine(int(lab[l][j, i])), []).append((l, int(i), int(j)))
        return list(groupes.values())

    def relier_ilots(self, net, largeur, isolement, essais=12, huit_voisins=False):
        """Relie entre eux les îlots d'un net : chaque îlot, du plus petit au plus
        grand, est relié au reste ; un îlot impossible à joindre est mis de côté."""
        code = self.b.FindNet(net).GetNetCode()
        ancien = self.classes.get(net)
        self.classes[net] = (largeur, isolement, False)
        abandon = set()
        for _ in range(essais):
            gr = sorted(self.ilots(code, huit_voisins), key=len)
            gr_ok = [g for g in gr if g[0] not in abandon]
            if len(gr) < 2 or len(gr_ok) == 0 or (len(gr_ok) == 1 and len(gr) - len(abandon) <= 1):
                break
            cible = gr_ok[0]
            sources = [c for g in gr if g is not cible for c in g]
            libre = self.masque_libre(net, code, largeur)
            for (l, i, j) in sources + cible:
                libre[l][j, i] = True
            ci = sum(c[1] for c in cible) / len(cible)
            cj = sum(c[2] for c in cible) / len(cible)
            sources = sorted(sources, key=lambda s: abs(s[1] - ci) + abs(s[2] - cj))[:3000]
            limite, self.limite = self.limite, 3000000
            chemin = self.astar(sources, cible, libre, self.masque_via(code, False), cout_via=4.0)
            self.limite = limite
            if not chemin:
                abandon.add(cible[0])
                continue
            self.deposer(chemin, net, code, largeur)
        self.classes[net] = ancien
        reste = len(self.ilots(code, huit_voisins))
        return reste <= 1, reste
