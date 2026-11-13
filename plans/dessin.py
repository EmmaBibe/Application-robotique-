"""Petit moteur de dessin technique en SVG (unités : mm, format A3 paysage).

Fournit le cadre normalisé avec repères de zones, le cartouche, les lignes
de cote, et des bibliothèques de symboles :
  - P&ID (ISO 10628 / ISA 5.1) : pompes, vannes, électrovannes, clapets,
    filtres, cuves, appareils de mesure ;
  - électricité (IEC 60617) : disjoncteurs, interrupteurs différentiels,
    contacteurs, fusibles, parafoudres, moteurs, transformateurs, terre.
"""

from __future__ import annotations

import html
import math

A3 = (420.0, 297.0)
MARGE = 10.0
PROJET = "Serre pilote en environnement contrôlé - Lubumbashi"
MAITRE = "Projet serre Lubumbashi"

COUL = {
    "trait": "#1a1a1a", "fin": "#4a4a4a", "doux": "#8a8a8a", "eau": "#1f6fb2", "sol": "#7d4bb3",
    "drain": "#8a5a2b", "air": "#2f8f8f", "elec": "#c0392b", "terre": "#2e7d32", "signal": "#555555",
    "fond": "#ffffff", "cartouche": "#f4f6f4", "accent": "#2f7d4f",
}


def esc(t):
    return html.escape(str(t), quote=True)


class Feuille:
    def __init__(self, numero, titre, echelle="sans", indice="A", date="13/11/2026", lot=""):
        self.numero, self.titre, self.echelle, self.indice, self.date, self.lot = numero, titre, echelle, indice, date, lot
        self.e = []

    # ------------------------------------------------------------ primitives
    def add(self, s):
        self.e.append(s)

    def ligne(self, x1, y1, x2, y2, c="trait", ep=0.35, tirets=None):
        d = f' stroke-dasharray="{tirets}"' if tirets else ""
        self.add(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{COUL.get(c, c)}" stroke-width="{ep}"{d}/>')

    def poly(self, pts, c="trait", ep=0.35, rempli="none", ferme=False, tirets=None, fleche=False):
        d = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + (" Z" if ferme else "")
        da = f' stroke-dasharray="{tirets}"' if tirets else ""
        mk = ' marker-end="url(#fl)"' if fleche else ""
        self.add(f'<path d="{d}" fill="{COUL.get(rempli, rempli)}" stroke="{COUL.get(c, c)}" stroke-width="{ep}" stroke-linejoin="round"{da}{mk}/>')

    def rect(self, x, y, l, h, c="trait", ep=0.35, rempli="none", r=0, tirets=None):
        da = f' stroke-dasharray="{tirets}"' if tirets else ""
        self.add(f'<rect x="{x:.2f}" y="{y:.2f}" width="{l:.2f}" height="{h:.2f}" rx="{r}" fill="{COUL.get(rempli, rempli)}" stroke="{COUL.get(c, c)}" stroke-width="{ep}"{da}/>')

    def cercle(self, x, y, r, c="trait", ep=0.35, rempli="none"):
        self.add(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{COUL.get(rempli, rempli)}" stroke="{COUL.get(c, c)}" stroke-width="{ep}"/>')

    def texte(self, x, y, t, taille=2.5, ancre="start", gras=False, c="trait", rot=0, italique=False):
        w = ' font-weight="700"' if gras else ""
        it = ' font-style="italic"' if italique else ""
        tr = f' transform="rotate({rot} {x:.2f} {y:.2f})"' if rot else ""
        self.add(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{taille}" text-anchor="{ancre}" fill="{COUL.get(c, c)}"{w}{it}{tr}>{esc(t)}</text>')

    def textes(self, x, y, lignes, taille=2.5, interligne=1.35, **kw):
        for k, t in enumerate(lignes):
            self.texte(x, y + k * taille * interligne, t, taille, **kw)

    def cote(self, x1, y1, x2, y2, txt, decal=6, taille=2.4):
        """Ligne de cote avec lignes d'attache et flèches."""
        if abs(y1 - y2) < 1e-6:  # horizontale
            y = y1 + decal
            self.ligne(x1, y1, x1, y + 1.5 * math.copysign(1, decal), "fin", 0.18)
            self.ligne(x2, y2, x2, y + 1.5 * math.copysign(1, decal), "fin", 0.18)
            self.add(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{COUL["fin"]}" stroke-width="0.2" marker-start="url(#fc)" marker-end="url(#fc)"/>')
            self.texte((x1 + x2) / 2, y - 1, txt, taille, "middle")
        else:
            x = x1 + decal
            self.ligne(x1, y1, x + 1.5 * math.copysign(1, decal), y1, "fin", 0.18)
            self.ligne(x2, y2, x + 1.5 * math.copysign(1, decal), y2, "fin", 0.18)
            self.add(f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="{COUL["fin"]}" stroke-width="0.2" marker-start="url(#fc)" marker-end="url(#fc)"/>')
            self.texte(x - 1, (y1 + y2) / 2, txt, taille, "middle", rot=-90)

    def tableau(self, x, y, colonnes, lignes, taille=2.2, h=5.0, entete_fond="cartouche"):
        """colonnes : [(titre, largeur)]"""
        largeur = sum(c[1] for c in colonnes)
        self.rect(x, y, largeur, h, rempli=entete_fond, ep=0.3)
        cx = x
        for titre, l in colonnes:
            self.texte(cx + 1.2, y + h * 0.7, titre, taille, gras=True)
            cx += l
        for i, li in enumerate(lignes):
            yy = y + h * (i + 1)
            if i % 2 == 1:
                self.rect(x, yy, largeur, h, c="none", rempli="#f7f8f7", ep=0)
            cx = x
            for (titre, l), v in zip(colonnes, li):
                self.texte(cx + 1.2, yy + h * 0.7, v, taille)
                cx += l
            self.ligne(x, yy + h, x + largeur, yy + h, "doux", 0.15)
        self.rect(x, y, largeur, h * (len(lignes) + 1), ep=0.3)
        cx = x
        for titre, l in colonnes[:-1]:
            cx += l
            self.ligne(cx, y, cx, y + h * (len(lignes) + 1), "doux", 0.15)
        return y + h * (len(lignes) + 1)

    # ------------------------------------------------------------ cadre et cartouche
    def cadre(self):
        W, H = A3
        m = MARGE
        self.rect(m, m, W - 2 * m, H - 2 * m, ep=0.7)
        self.rect(m + 5, m + 5, W - 2 * m - 10, H - 2 * m - 10, ep=0.25)
        # repères de zones : 8 colonnes, 6 lignes
        for i in range(8):
            x0 = m + 5 + i * (W - 2 * m - 10) / 8
            if i:
                self.ligne(x0, m, x0, m + 5, ep=0.25)
                self.ligne(x0, H - m - 5, x0, H - m, ep=0.25)
            xc = x0 + (W - 2 * m - 10) / 16
            self.texte(xc, m + 3.6, str(i + 1), 2.6, "middle")
            self.texte(xc, H - m - 1.4, str(i + 1), 2.6, "middle")
        for j in range(6):
            y0 = m + 5 + j * (H - 2 * m - 10) / 6
            if j:
                self.ligne(m, y0, m + 5, y0, ep=0.25)
                self.ligne(W - m - 5, y0, W - m, y0, ep=0.25)
            yc = y0 + (H - 2 * m - 10) / 12 + 1
            self.texte(m + 2.5, yc, "ABCDEF"[j], 2.6, "middle")
            self.texte(W - m - 2.5, yc, "ABCDEF"[j], 2.6, "middle")
        # cartouche (ISO 7200, simplifié)
        cw, ch = 175, 38
        x0, y0 = W - m - 5 - cw, H - m - 5 - ch
        self.rect(x0, y0, cw, ch, rempli="cartouche", ep=0.5)
        self.ligne(x0, y0 + 9, x0 + cw, y0 + 9, ep=0.3)
        self.ligne(x0, y0 + 24, x0 + cw, y0 + 24, ep=0.3)
        self.ligne(x0 + 115, y0 + 24, x0 + 115, y0 + ch, ep=0.3)
        self.ligne(x0 + 145, y0 + 24, x0 + 145, y0 + ch, ep=0.3)
        self.ligne(x0 + 60, y0 + 24, x0 + 60, y0 + ch, ep=0.3)
        self.texte(x0 + 3, y0 + 6.2, PROJET, 3.0, gras=True)
        self.texte(x0 + 3, y0 + 15, self.titre, 4.2, gras=True, c="accent")
        self.texte(x0 + 3, y0 + 21, self.lot, 2.6, c="fin")
        self.texte(x0 + 3, y0 + 28, "Maître d'ouvrage", 2.0, c="doux")
        self.texte(x0 + 3, y0 + 32.5, MAITRE, 2.6)
        self.texte(x0 + 62, y0 + 28, "Échelle", 2.0, c="doux")
        self.texte(x0 + 62, y0 + 32.5, self.echelle, 2.8)
        self.texte(x0 + 88, y0 + 28, "Date", 2.0, c="doux")
        self.texte(x0 + 88, y0 + 32.5, self.date, 2.6)
        self.texte(x0 + 117, y0 + 28, "Format / indice", 2.0, c="doux")
        self.texte(x0 + 117, y0 + 32.5, f"A3  -  {self.indice}", 2.8)
        self.texte(x0 + 147, y0 + 28, "Planche", 2.0, c="doux")
        self.texte(x0 + 160, y0 + 34.5, self.numero, 6.0, "middle", gras=True)
        return x0, y0

    def svg(self):
        W, H = A3
        self.cadre()
        defs = (
            '<defs>'
            '<marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#1a1a1a"/></marker>'
            '<marker id="fc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 Z" fill="#4a4a4a"/></marker>'
            '<pattern id="hach" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#8a8a8a" stroke-width="0.25"/></pattern>'
            '<pattern id="beton" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.3" fill="#8a8a8a"/><circle cx="3" cy="2.6" r="0.25" fill="#8a8a8a"/></pattern>'
            '</defs>'
        )
        corps = "\n".join(self.e)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}" '
                f'font-family="DejaVu Sans, Arial, sans-serif">{defs}<rect width="{W}" height="{H}" fill="#fff"/>{corps}</svg>')

    # ------------------------------------------------------------ symboles P&ID
    def pompe(self, x, y, tag, r=4, sens=0):
        self.cercle(x, y, r, ep=0.45, rempli="#fff")
        a = math.radians(sens)
        p1 = (x + r * math.cos(a), y + r * math.sin(a))
        p2 = (x + r * math.cos(a + 2.4), y + r * math.sin(a + 2.4))
        p3 = (x + r * math.cos(a - 2.4), y + r * math.sin(a - 2.4))
        self.poly([p2, p1, p3], ep=0.35)
        self.texte(x, y + r + 3.2, tag, 2.2, "middle", gras=True)

    def pompe_doseuse(self, x, y, tag):
        self.cercle(x, y, 3.5, ep=0.45, rempli="#fff")
        self.texte(x, y + 1.1, "D", 3, "middle", gras=True)
        self.texte(x, y + 6.8, tag, 2.1, "middle", gras=True)

    def vanne(self, x, y, tag="", vertical=False, ev=False, ouverte=True):
        s = 3
        if vertical:
            self.poly([(x - s, y - s), (x + s, y + s), (x - s, y + s), (x + s, y - s)], ferme=True, ep=0.4, rempli="#fff")
        else:
            self.poly([(x - s, y - s), (x + s, y + s), (x + s, y - s), (x - s, y + s)], ferme=True, ep=0.4, rempli="#fff")
        if ev:
            self.ligne(x, y, x, y - 5.5, ep=0.3)
            self.rect(x - 2.2, y - 9.5, 4.4, 4, ep=0.3, rempli="#fff")
            self.texte(x, y - 6.6, "S", 2.4, "middle", gras=True)
        if tag:
            self.texte(x, y + 6.5, tag, 2.1, "middle", gras=True)

    def clapet(self, x, y, tag=""):
        self.poly([(x - 3, y - 3), (x + 3, y), (x - 3, y + 3)], ferme=True, ep=0.4, rempli="#fff")
        self.ligne(x + 3, y - 3, x + 3, y + 3, ep=0.4)
        if tag:
            self.texte(x, y + 6.5, tag, 2.1, "middle")

    def filtre(self, x, y, tag, legende=""):
        self.poly([(x, y - 5), (x + 5, y), (x, y + 5), (x - 5, y)], ferme=True, ep=0.4, rempli="#fff")
        self.ligne(x - 3.5, y, x + 3.5, y, ep=0.3, tirets="1,0.8")
        self.texte(x, y + 8.5, tag, 2.1, "middle", gras=True)
        if legende:
            self.texte(x, y + 11.5, legende, 1.9, "middle", c="fin")

    def uv(self, x, y, tag):
        self.rect(x - 8, y - 3.5, 16, 7, r=3.5, ep=0.45, rempli="#f1e9fa")
        self.texte(x, y + 1, "UV-C", 2.4, "middle", gras=True, c="sol")
        self.texte(x, y + 7.5, tag, 2.1, "middle", gras=True)

    def cuve(self, x, y, l, h, tag, legende="", niveau=0.6, coul="eau"):
        self.rect(x, y, l, h, ep=0.5, rempli="#fff", r=1.5)
        self.rect(x + 0.6, y + h * (1 - niveau), l - 1.2, h * niveau - 0.6, c="none", rempli=COUL[coul] + "22", ep=0)
        self.ligne(x + 0.6, y + h * (1 - niveau), x + l - 0.6, y + h * (1 - niveau), coul, 0.25, tirets="1.2,0.8")
        self.texte(x + l / 2, y + h / 2 - 1, tag, 2.6, "middle", gras=True)
        if legende:
            self.texte(x + l / 2, y + h / 2 + 2.6, legende, 2.0, "middle", c="fin")

    def instrument(self, x, y, lettres, numero, local=False, ligne_vers=None):
        """Bulle ISA : lettres de fonction en haut, numéro en bas."""
        if ligne_vers:
            self.ligne(x, y, ligne_vers[0], ligne_vers[1], "signal", 0.25, tirets="1.2,0.8")
        self.cercle(x, y, 4.2, ep=0.4, rempli="#fff")
        if not local:
            self.ligne(x - 4.2, y, x + 4.2, y, ep=0.3)
        self.texte(x, y - 0.8, lettres, 2.1, "middle", gras=True)
        self.texte(x, y + 2.9, numero, 2.0, "middle")

    def conduite(self, pts, nature="eau", ep=0.55, fleche=True, tirets=None):
        self.poly(pts, c=nature, ep=ep, fleche=fleche, tirets=tirets)

    # ------------------------------------------------------------ symboles électriques
    def disjoncteur(self, x, y, rep, cal, vertical=True, diff=False, moteur=False):
        """Disjoncteur vertical : connexion haute (x,y), basse (x,y+12)."""
        self.ligne(x, y, x, y + 3, ep=0.35)
        self.ligne(x, y + 3, x + 2.6, y + 8.5, ep=0.4)
        self.ligne(x, y + 9, x, y + 12, ep=0.35)
        self.ligne(x - 1, y + 2, x + 1, y + 4, ep=0.35)
        self.ligne(x - 1, y + 4, x + 1, y + 2, ep=0.35)
        if diff:
            self.add(f'<ellipse cx="{x + 1.3}" cy="{y + 6}" rx="3.6" ry="1.5" fill="none" stroke="#1a1a1a" stroke-width="0.3"/>')
        if moteur:
            self.rect(x + 3.2, y + 4, 3, 3, ep=0.3)
            self.texte(x + 4.7, y + 6.3, "I>", 1.6, "middle")
        self.texte(x + 4.5, y + 3.2, rep, 2.2, gras=True)
        self.texte(x + 4.5, y + 11.2, cal, 1.9, c="fin")

    def interrupteur(self, x, y, rep, cal=""):
        self.ligne(x, y, x, y + 3, ep=0.35)
        self.ligne(x, y + 3, x + 2.6, y + 8.5, ep=0.4)
        self.ligne(x, y + 9, x, y + 12, ep=0.35)
        self.texte(x + 4.5, y + 4, rep, 2.2, gras=True)
        if cal:
            self.texte(x + 4.5, y + 11, cal, 1.9, c="fin")

    def contacteur(self, x, y, rep, ouvert=True):
        self.ligne(x, y, x, y + 3, ep=0.35)
        self.ligne(x, y + 3, x + 2.6, y + 8.5, ep=0.4)
        self.ligne(x, y + 9, x, y + 12, ep=0.35)
        self.add(f'<path d="M{x - 1.4},{y + 3} A1.4,1.4 0 0 1 {x + 1.4},{y + 3}" fill="none" stroke="#1a1a1a" stroke-width="0.3"/>')
        self.texte(x + 4.5, y + 6.5, rep, 2.2, gras=True)

    def fusible(self, x, y, rep, cal):
        self.ligne(x, y, x, y + 12, ep=0.35)
        self.rect(x - 1.3, y + 3, 2.6, 6, ep=0.4, rempli="#fff")
        self.texte(x + 3, y + 5.5, rep, 2.2, gras=True)
        self.texte(x + 3, y + 8.8, cal, 1.9, c="fin")

    def parafoudre(self, x, y, rep, cal):
        """Parafoudre raccordé en (x,y), vers la terre en dessous."""
        self.ligne(x, y, x, y + 3, ep=0.35)
        self.rect(x - 1.8, y + 3, 3.6, 6, ep=0.4, rempli="#fff")
        self.poly([(x, y + 4), (x, y + 8)], ep=0.3, fleche=True)
        self.ligne(x, y + 9, x, y + 12, ep=0.35)
        self.terre(x, y + 12)
        self.texte(x + 3, y + 5.5, rep, 2.1, gras=True)
        self.texte(x + 3, y + 8.6, cal, 1.8, c="fin")

    def terre(self, x, y):
        self.ligne(x - 2.5, y, x + 2.5, y, "terre", 0.4)
        self.ligne(x - 1.6, y + 0.9, x + 1.6, y + 0.9, "terre", 0.4)
        self.ligne(x - 0.7, y + 1.8, x + 0.7, y + 1.8, "terre", 0.4)

    def moteur(self, x, y, rep, legende="", r=4):
        self.cercle(x, y, r, ep=0.45, rempli="#fff")
        self.texte(x, y + 1, "M", 3, "middle", gras=True)
        self.texte(x, y + 2.8, "1~", 1.5, "middle")
        self.texte(x, y + r + 3, rep, 2.1, "middle", gras=True)
        if legende:
            self.texte(x, y + r + 5.8, legende, 1.8, "middle", c="fin")

    def charge(self, x, y, rep, legende=""):
        self.rect(x - 3, y - 3, 6, 6, ep=0.4, rempli="#fff")
        self.texte(x, y + 6.2, rep, 2.1, "middle", gras=True)
        if legende:
            self.texte(x, y + 9, legende, 1.8, "middle", c="fin")

    def boite(self, x, y, l, h, titre, lignes=(), rempli="#fff", taille=2.4, ep=0.45):
        self.rect(x, y, l, h, ep=ep, rempli=rempli, r=0.8)
        self.texte(x + l / 2, y + 4.2, titre, taille, "middle", gras=True)
        for k, li in enumerate(lignes):
            self.texte(x + l / 2, y + 4.2 + (k + 1) * 3.1, li, 1.9, "middle", c="fin")

    def bobine(self, x, y, rep, legende=""):
        self.rect(x - 3, y, 6, 4, ep=0.4, rempli="#fff")
        self.texte(x + 4.5, y + 3, rep, 2.2, gras=True)
        if legende:
            self.texte(x + 4.5, y + 6, legende, 1.8, c="fin")

    def contact_no(self, x, y, rep="", vertical=True):
        self.ligne(x, y, x, y + 3, ep=0.35)
        self.ligne(x, y + 3, x + 2.4, y + 8, ep=0.4)
        self.ligne(x, y + 8.5, x, y + 12, ep=0.35)
        if rep:
            self.texte(x + 3.8, y + 7, rep, 2.0)

    def legende(self, x, y, items, titre="Légende"):
        self.texte(x, y, titre, 2.6, gras=True)
        for k, (style, txt) in enumerate(items):
            yy = y + 4 + k * 4.2
            c, tir = style
            self.ligne(x, yy - 0.8, x + 10, yy - 0.8, c, 0.55, tirets=tir)
            self.texte(x + 12, yy, txt, 2.1)

    def note(self, x, y, lignes, titre="Notes", taille=2.1, largeur=None):
        self.texte(x, y, titre, 2.6, gras=True)
        for k, li in enumerate(lignes):
            self.texte(x, y + 4.2 + k * taille * 1.45, li, taille)
