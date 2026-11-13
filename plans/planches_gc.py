"""Planches architecture et génie civil : plan de masse, plan, coupe, fondations et élévations."""

from dessin import Feuille


def plan_masse():
    f = Feuille("A01", "Plan de masse", "1:200", lot="Lot architecture - parcelle de travail 30 x 25 m")
    s = 5.0  # 1 m = 5 mm (1:200)
    ox, oy = 60, 40
    f.rect(ox, oy, 30 * s, 25 * s, ep=0.5, tirets="4,2", rempli="#fbfaf6")
    f.texte(ox + 2, oy - 2, "Clôture grillagée h = 2,20 m sur poteaux béton", 2.0, c="fin")
    # bande sanitaire
    f.rect(ox + 7 * s, oy + 2 * s, 16 * s, 16 * s, c="none", rempli="url(#hach)", ep=0)
    f.rect(ox + 7 * s, oy + 2 * s, 16 * s, 16 * s, ep=0.25, tirets="1.5,1")
    # serre
    f.rect(ox + 10 * s, oy + 5 * s, 10 * s, 10 * s, ep=0.8, rempli="#eef6ef")
    f.ligne(ox + 10 * s, oy + 10 * s, ox + 20 * s, oy + 10 * s, ep=0.3, tirets="2,1")
    f.texte(ox + 15 * s, oy + 8 * s, "SERRE", 3, "middle", gras=True)
    f.texte(ox + 15 * s, oy + 8 * s + 4, "compartiment fruits", 2, "middle")
    f.texte(ox + 15 * s, oy + 13 * s, "compartiment feuilles", 2, "middle")
    # sas et annexe
    f.rect(ox + 14.25 * s, oy + 15 * s, 1.5 * s, 2 * s, ep=0.5, rempli="#fff3d6")
    f.rect(ox + 10 * s, oy + 17 * s, 10 * s, 3 * s, ep=0.8, rempli="#f7f1e6")
    f.texte(ox + 15 * s, oy + 18.8 * s, "ANNEXE", 2.6, "middle", gras=True)
    # citerne, forage, PV sol, station, mât
    f.cercle(ox + 6 * s, oy + 10 * s, 1.4 * s, ep=0.5, rempli="#e0eef8")
    f.texte(ox + 6 * s, oy + 10 * s + 1, "CI-001", 2, "middle", gras=True)
    f.cercle(ox + 4 * s, oy + 16 * s, 2, ep=0.4, rempli="#1f6fb2")
    f.texte(ox + 4 * s, oy + 16 * s + 5, "forage", 1.9, "middle")
    f.rect(ox + 22.5 * s, oy + 17.5 * s, 5 * s, 2.5 * s, ep=0.4, rempli="#dfe7f2")
    f.texte(ox + 25 * s, oy + 19 * s, "PV sol (option)", 1.9, "middle")
    f.rect(ox + 24 * s, oy + 3 * s, 2, 2, ep=0.4, rempli="#d9a400")
    f.texte(ox + 24 * s + 4, oy + 3 * s + 2, "station météo", 1.9)
    f.cercle(ox + 22.5 * s, oy + 16 * s, 1.5, c="elec", ep=0.5, rempli="#fff")
    f.texte(ox + 22.5 * s + 3, oy + 16 * s + 1, "mât paratonnerre", 1.9)
    f.rect(ox + 10 * s, oy + 21 * s, 10 * s, 3.5 * s, ep=0.3, rempli="#efefef")
    f.texte(ox + 15 * s, oy + 23 * s, "aire de livraison et stationnement", 2, "middle")
    f.rect(ox + 14 * s, oy + 25 * s - 1, 2 * s, 2, ep=0.3, rempli="#333")
    f.texte(ox + 15 * s, oy + 25 * s + 5, "portail 4 m", 2, "middle")
    f.rect(ox + 21.5 * s, oy + 6 * s, 7.5 * s, 9 * s, ep=0.3, tirets="2,1.5")
    f.texte(ox + 25.25 * s, oy + 10.5 * s, "réserve", 2, "middle", c="accent")
    f.texte(ox + 25.25 * s, oy + 10.5 * s + 3.5, "extension", 2, "middle", c="accent")
    # cotes
    f.cote(ox, oy + 25 * s, ox + 30 * s, oy + 25 * s, "30,00", 10)
    f.cote(ox + 30 * s, oy, ox + 30 * s, oy + 25 * s, "25,00", 10)
    f.cote(ox + 10 * s, oy + 5 * s, ox + 20 * s, oy + 5 * s, "10,00", -6)
    f.cote(ox + 10 * s, oy + 5 * s, ox + 10 * s, oy + 15 * s, "10,00", -6)
    f.cote(ox + 10 * s, oy + 15 * s, ox + 10 * s, oy + 17 * s, "2,00", -6)
    f.cote(ox + 10 * s, oy + 17 * s, ox + 10 * s, oy + 20 * s, "3,00", -6)
    # nord
    f.poly([(ox + 28 * s, oy + 4), (ox + 28 * s + 3, oy + 12), (ox + 28 * s, oy + 10), (ox + 28 * s - 3, oy + 12)], ferme=True, rempli="#1a1a1a")
    f.texte(ox + 28 * s, oy + 2, "N", 3, "middle", gras=True)
    f.note(235, 40, [
        "Implantation :",
        "- faîtage de la serre orienté est-ouest ; murs évaporatifs au pignon est",
        "  (vents dominants de saison sèche E - SE), extracteurs au pignon ouest ;",
        "- annexe au sud, à 2 m : ombre portée nulle sur la serre (soleil au",
        "  nord du zénith dix mois sur douze ; 78° au plus bas vers le sud) ;",
        "- bande sanitaire de 3 m en gravier nu autour de la serre ;",
        "- aucun arbre ni bâtiment haut à moins de 20 m au N, à l'E et à l'O ;",
        "- pas de culture de solanacées ni de crucifères à moins de 50 m.",
        "",
        "Réseaux enterrés : eau (PE-HD 32), câble SNEL (U1000R2V sous fourreau",
        "TPC rouge Ø 63), boucle de terre en fond de fouille, pluvial vers",
        "citerne et puits d'infiltration ; profondeur 0,6 m minimum.",
        "",
        "Terrain : plateforme compactée, pente 1 % vers l'ouest ;",
        "élimination des termitières dans un rayon de 20 m.",
    ], titre="Notes", taille=2.1)
    return f


def plan_serre():
    f = Feuille("A02", "Plan de la serre et de l'annexe", "1:75", lot="Lot architecture - niveau 0,00")
    s = 13.3  # 1 m = 13,3 mm (≈ 1:75)
    ox, oy = 45, 30
    W = 10 * s
    # serre
    f.rect(ox, oy, W, W, ep=0.9, rempli="#f6faf6")
    f.ligne(ox, oy + 5 * s, ox + W, oy + 5 * s, ep=0.4, tirets="3,1.5")
    f.texte(ox + W + 2, oy + 5 * s + 1, "cloison (porte au centre)", 1.9)
    f.rect(ox + 4.4 * s, oy, 1.2 * s, W, c="none", rempli="#e8e8e8", ep=0)
    f.texte(ox + 5 * s, oy + 7.5 * s, "allée béton 1,20 m", 1.9, "middle", rot=-90)
    for k in range(3):
        for side in (0, 1):
            x0 = ox + (0.4 if side == 0 else 5.8) * s
            y0 = oy + (0.8 + k * 1.6) * s
            for dz in (-0.25, 0.25):
                f.rect(x0, y0 + dz * s - 1, 3.8 * s, 2, ep=0.25, rempli="#c96b6b")
    f.texte(ox + 2.3 * s, oy - 2.5, "compartiment fruits - 50 m²", 2.3, "middle", gras=True)
    for x0 in (0.4, 5.6):
        f.rect(ox + x0 * s, oy + 5.4 * s, 4.0 * s, 4.2 * s, ep=0.5, rempli="#dceef8")
        f.texte(ox + (x0 + 2) * s, oy + 7.5 * s, "bassin 4,0 x 4,2", 2.0, "middle", gras=True)
    f.texte(ox + 2.4 * s, oy + 7.5 * s + 3.5, "frais (laitue, chou, épinard)", 1.8, "middle")
    f.texte(ox + 7.6 * s, oy + 7.5 * s + 3.5, "tempéré (céleri, aromatiques)", 1.8, "middle")
    # pads et extracteurs
    f.rect(ox + W, oy + 0.25 * s, 1.2, 4.5 * s, ep=0.3, rempli="#1f6fb2")
    f.rect(ox + W, oy + 5.25 * s, 1.2, 4.5 * s, ep=0.3, rempli="#1f6fb2")
    f.texte(ox + W + 3, oy + 2.5 * s, "pad 5 x 1,5 m", 1.9)
    f.texte(ox + W + 3, oy + 7.5 * s, "pad 5 x 1,5 m", 1.9)
    for y in (2.5, 7.5):
        f.cercle(ox, oy + y * s, 8, ep=0.5, rempli="#fff")
        f.texte(ox, oy + y * s + 1, "EX", 2, "middle", gras=True)
    f.texte(ox - 11, oy + 5 * s, "extracteurs Ø 1,25 m", 1.9, "middle", rot=-90)
    # cuves stockage
    for k in range(3):
        f.cercle(ox + (0.6 + k * 0.85) * s, oy + 4.4 * s, 0.4 * s, ep=0.4, rempli="#333")
    f.texte(ox + 3.4 * s, oy + 4.5 * s, "stockage 3 x 2 m³", 1.8)
    # sas et annexe
    f.rect(ox + 4.25 * s, oy + W, 1.5 * s, 2 * s, ep=0.6, rempli="#fff3d6")
    f.texte(ox + 5 * s, oy + W + 1.2 * s, "sas", 2, "middle", gras=True)
    ya = oy + 12 * s
    f.rect(ox, ya, W, 3 * s, ep=0.9, rempli="#f7f1e6")
    for xx, nom, l in ((0, "local technique", 3), (3, "vestiaire", 1.5), (4.5, "pépinière", 2.5), (7, "conditionnement", 3)):
        f.rect(ox + xx * s, ya, l * s, 3 * s, ep=0.4)
        f.texte(ox + (xx + l / 2) * s, ya + 1.6 * s, nom, 1.9, "middle", gras=True)
        f.texte(ox + (xx + l / 2) * s, ya + 1.6 * s + 3, f"{l:.1f} x 3,0 m".replace(".", ","), 1.7, "middle", c="fin")
    f.rect(ox + 8.5 * s, ya + 0.3 * s, 1.3 * s, 1.0 * s, ep=0.4, rempli="#dceef8")
    f.texte(ox + 9.15 * s, ya + 0.9 * s, "CF 3 m³", 1.7, "middle")
    # cotes
    f.cote(ox, oy, ox + W, oy, "10,00", -8)
    f.cote(ox + W, oy, ox + W, oy + W, "10,00", 22)
    f.cote(ox, oy + W, ox, oy + 12 * s, "2,00", -14)
    f.cote(ox, ya, ox, ya + 3 * s, "3,00", -14)
    f.cote(ox + 4.4 * s, ya + 3 * s, ox + 5.6 * s, ya + 3 * s, "1,20", 7)
    f.note(250, 30, [
        "Surfaces :",
        "  serre 100 m² (fruits 50, feuilles 50) ; radeaux 33,6 m² ;",
        "  annexe 30 m² ; sas 3 m².",
        "",
        "Sol de la serre : plateforme compactée, géotextile, gravier 10 cm,",
        "toile tissée blanche ; allée et bordures de bassins en béton dosé",
        "à 350 kg/m³, épaisseur 10 cm, treillis ST 25.",
        "",
        "Bassins semi-enterrés de 20 cm, isolés en périphérie (XPS 40 mm),",
        "liner EPDM 1 mm, traitement anti-termites sous dalle.",
        "",
        "Annexe : ossature acier et panneaux isolants (optimisée) ou blocs",
        "de ciment enduits (complète) ; toiture monopente à 12° vers le",
        "nord portant les panneaux solaires ; pépinière sous polycarbonate.",
        "",
        "Circulations : jeunes plants -> feuilles -> fruits (biosécurité) ;",
        "récoltes par le passe-plat du sas vers le conditionnement.",
    ], titre="Notes", taille=2.1)
    return f


def coupe():
    f = Feuille("A03", "Coupe transversale A-A (nord-sud)", "1:50", lot="Lot architecture et structure - configuration optimisée")
    s = 20.0  # 1 m = 20 mm (1:50)
    ox, oy = 40, 215  # niveau 0,00 au sud de la serre
    f.rect(20, oy, 380, 20, c="none", rempli="url(#hach)", ep=0)
    f.ligne(20, oy, 400, oy, ep=0.7)
    import math
    # arc gothique : de x=0 (sud) à x=10 m (nord), chéneau 4 m, faîtage 6 m
    pts = []
    for i in range(41):
        t = i / 40
        sp = t * 2 if t < 0.5 else (1 - t) * 2
        y = 4 + 2 * math.sin(sp * math.pi / 2) ** 0.75
        pts.append((ox + 2 * s + t * 10 * s, oy - y * s))
    xs, xn = ox + 2 * s, ox + 12 * s
    f.poly([(xs, oy), (xs, oy - 4 * s)] + pts + [(xn, oy - 4 * s), (xn, oy)], ep=0.9, c="accent")
    f.ligne(ox + 7 * s, oy, ox + 7 * s, oy - 6 * s, ep=0.4, tirets="3,1.5")
    f.ligne(xs + 1, oy - 4 * s, xn - 1, oy - 4 * s, "fin", 0.35, tirets="1,1")
    f.texte(ox + 7.2 * s, oy - 4 * s - 2, "écran d'ombrage / thermique", 1.9)
    # ouvrants
    f.ligne(ox + 6.0 * s, oy - 5.95 * s, ox + 6.6 * s, oy - 6.0 * s, "eau", 1.4)
    f.ligne(ox + 7.4 * s, oy - 6.0 * s, ox + 8.0 * s, oy - 5.95 * s, "eau", 1.4)
    f.ligne(xs, oy - 1 * s, xs, oy - 2.5 * s, "eau", 1.4)
    f.ligne(xn, oy - 1 * s, xn, oy - 2.5 * s, "eau", 1.4)
    f.texte(xn + 3, oy - 1.8 * s, "ouvrant latéral nord 10 x 1,5 m + filet 50 mesh", 1.9)
    f.texte(ox + 7 * s, oy - 6.3 * s, "ouvrants de toiture (un par versant)", 1.9, "middle")
    # cultures
    f.rect(ox + 2.6 * s, oy - 0.45 * s, 4 * s, 0.45 * s, ep=0.4, rempli="#dceef8")
    for k in range(9):
        f.cercle(ox + (2.85 + k * 0.45) * s, oy - 0.6 * s, 3.2, c="accent", rempli="#7fc25a", ep=0.3)
    f.texte(ox + 4.6 * s, oy + 6, "bassin à radeaux (25 cm d'eau, semi-enterré)", 1.9, "middle")
    f.ligne(ox + 7.6 * s, oy - 3.8 * s, ox + 11.6 * s, oy - 3.8 * s, "fin", 0.25)
    for k in range(4):
        x = ox + (8.1 + k * 1.0) * s
        f.rect(x - 4, oy - 0.6 * s, 8, 0.6 * s, ep=0.3, rempli="#333")
        f.ligne(x, oy - 0.6 * s, x, oy - 3.8 * s, "accent", 1.6)
    f.texte(ox + 9.6 * s, oy + 6, "seaux hollandais, palissage sur fil à 3,80 m", 1.9, "middle")
    # annexe et sas (au sud, à gauche)
    f.poly([(ox - 1.2 * s, oy), (ox - 1.2 * s, oy - 3.0 * s), (ox + 1.2 * s, oy - 2.5 * s), (ox + 1.2 * s, oy)], ep=0.6, rempli="#f7f1e6")
    f.texte(ox, oy - 1.2 * s, "annexe", 2.0, "middle", gras=True)
    f.ligne(ox - 1.3 * s, oy - 3.15 * s, ox + 1.3 * s, oy - 2.6 * s, "eau", 1.2)
    f.texte(ox, oy - 3.4 * s, "PV 12°", 1.8, "middle")
    f.rect(ox + 1.2 * s, oy - 2.4 * s, 0.8 * s, 2.4 * s, ep=0.4, rempli="#fff3d6")
    f.texte(ox + 1.6 * s, oy - 2.6 * s, "sas", 1.8, "middle")
    # fondations
    for x in (xs, xn):
        f.rect(x - 0.2 * s, oy, 0.4 * s, 0.8 * s, ep=0.5, rempli="url(#beton)")
        f.rect(x - 0.15 * s, oy - 0.1 * s, 0.3 * s, 0.4 * s, ep=0.3, rempli="url(#beton)")
    f.texte(xs + 0.3 * s, oy + 0.6 * s, "plot BA 40 x 40 x 80 + longrine 20 x 30", 1.8)
    # cotes
    f.cote(xs, oy, xn, oy, "10,00", 22)
    f.cote(ox + 7 * s, oy, ox + 7 * s, oy - 2.0 * s, "", 0)
    f.cote(xn, oy, xn, oy - 4 * s, "4,00", 16)
    f.cote(ox + 12.8 * s, oy, ox + 12.8 * s, oy - 6 * s, "6,00", 12)
    f.cote(xs, oy, ox + 7 * s, oy, "5,00", 30)
    f.texte(ox + 7 * s, oy - 6 * s - 1, "faîtage +6,00", 1.9, "middle")
    f.texte(xs - 2, oy - 4 * s - 1, "chéneau +4,00", 1.9, "end")
    f.texte(xs - 2, oy + 2.5, "± 0,00", 1.9, "end")
    f.texte(ox + 4.5 * s, oy - 5 * s, "FEUILLES (sud)", 2.6, "middle", gras=True)
    f.texte(ox + 9.5 * s, oy - 5 * s, "FRUITS (nord)", 2.6, "middle", gras=True)
    f.note(300, 30, [
        "Structure acier galvanisé à chaud (275 g/m²) :",
        "  arcs Ø 60 x 2 mm tous les 2,50 m,",
        "  poteaux 80 x 80 x 2 mm, pannes Ø 32 mm,",
        "  contreventements en croix aux travées d'extrémité.",
        "Charges : rafale 28 m/s (q ≈ 0,42 kPa),",
        "  cultures palissées 15 kg/m², écran 5 kg/m².",
        "Référentiel : EN 13031-1 (serres de production).",
        "Couverture : film PE diffusant 200 µm, profils",
        "  alu à ressort ; pignons PC 8 mm en partie basse.",
        "Ensoleillement : midi juin 55° au nord,",
        "  midi décembre 78° au sud.",
    ], titre="Notes", taille=2.1)
    return f


def fondations():
    f = Feuille("A04", "Plan des fondations et élévation du pignon est", "1:75 / 1:50", lot="Lot génie civil")
    s = 13.3
    ox, oy = 40, 40
    W = 10 * s
    f.rect(ox, oy, W, W, ep=0.3, tirets="2,1.5")
    f.rect(ox - 2, oy - 2, W + 4, W + 4, ep=0.6)
    f.rect(ox + 2, oy + 2, W - 4, W - 4, ep=0.6)
    f.texte(ox + W / 2, oy - 5, "longrine périphérique BA 20 x 30 cm, 4 HA 10, cadres HA 6 / 20 cm", 2.0, "middle")
    for i in range(5):
        for y in (oy, oy + W):
            x = ox + i * 2.5 * s
            f.rect(x - 2.7, y - 2.7, 5.4, 5.4, ep=0.5, rempli="url(#beton)")
    for j in (1, 2, 3):
        for x in (ox, ox + W):
            y = oy + j * 2.5 * s
            f.rect(x - 2.7, y - 2.7, 5.4, 5.4, ep=0.5, rempli="url(#beton)")
    f.texte(ox + W / 2, oy + W / 2, "18 plots BA 40 x 40 x 80 cm, platines galvanisées scellées", 2.1, "middle", gras=True)
    f.texte(ox + W / 2, oy + W / 2 + 4, "béton C25/30, enrobage 4 cm, semelle sur sol compacté", 1.9, "middle")
    for i in range(4):
        f.cote(ox + i * 2.5 * s, oy + W, ox + (i + 1) * 2.5 * s, oy + W, "2,50", 8)
    f.cote(ox + W, oy, ox + W, oy + W, "10,00", 10)
    # élévation pignon est
    import math
    ex, ey, se = 230, 200, 12.0
    pts = []
    for i in range(41):
        t = i / 40
        sp = t * 2 if t < 0.5 else (1 - t) * 2
        y = 4 + 2 * math.sin(sp * math.pi / 2) ** 0.75
        pts.append((ex + t * 10 * se, ey - y * se))
    f.poly([(ex, ey), (ex, ey - 4 * se)] + pts + [(ex + 10 * se, ey - 4 * se), (ex + 10 * se, ey)], ep=0.8, c="accent")
    f.ligne(ex - 10, ey, ex + 10 * se + 10, ey, ep=0.6)
    f.rect(ex + 0.25 * se, ey - 1.8 * se, 4.5 * se, 1.5 * se, ep=0.4, rempli="#1f6fb233")
    f.rect(ex + 5.25 * se, ey - 1.8 * se, 4.5 * se, 1.5 * se, ep=0.4, rempli="#1f6fb233")
    f.texte(ex + 2.5 * se, ey - 1.0 * se, "pad feuilles", 1.9, "middle")
    f.texte(ex + 7.5 * se, ey - 1.0 * se, "pad fruits", 1.9, "middle")
    f.rect(ex, ey - 2.5 * se, 10 * se, 2.5 * se, c="fin", ep=0.25, tirets="1,1")
    f.texte(ex + 5 * se, ey - 2.7 * se - 1, "polycarbonate 8 mm jusqu'à 2,50 m, film au-dessus", 1.8, "middle")
    for i in range(5):
        x = ex + i * 2.5 * se
        f.ligne(x, ey, x, ey - 4 * se if i in (0, 4) else ey - 5.5 * se, "fin", 0.3)
    f.texte(ex + 5 * se, ey + 6, "Élévation du pignon est (1:83)", 2.4, "middle", gras=True)
    f.note(230, 30, [
        "Prescriptions génie civil :",
        "- étude de sol légère (portance, termites) avant exécution ;",
        "- fond de fouille propre, béton de propreté 5 cm ;",
        "- platines et tiges d'ancrage galvanisées, scellement chimique ;",
        "- traitement anti-termites du sol sous dalles et bassins ;",
        "- tolérances d'implantation ± 5 mm entre axes de plots ;",
        "- boucle de terre posée en fond de fouille avant coulage (E04).",
    ], titre="Notes", taille=2.1)
    return f
