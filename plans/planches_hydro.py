"""Planches hydrauliques (P&ID) : eau d'appoint, fertirrigation fruits, bassins feuilles."""

from dessin import Feuille

LEG = [(("eau", None), "eau brute / traitée"), (("sol", None), "solution nutritive"), (("drain", None), "drainage"),
       (("air", None), "air (aération)"), (("signal", "1.2,0.8"), "liaison de mesure / commande")]


def eau():
    f = Feuille("H01", "P&ID : collecte, traitement et stockage de l'eau", "sans", lot="Lot hydraulique - repères ISA 5.1")
    # toiture et chéneaux
    f.poly([(25, 45), (55, 30), (85, 45)], ep=0.7, c="accent")
    f.texte(55, 26, "Toiture serre 100 m² (projection)", 2.2, "middle", gras=True)
    f.conduite([(85, 45), (95, 45), (95, 60)])
    f.texte(97, 52, "chéneau 125 mm, descente Ø 100", 1.9, c="fin")
    f.filtre(95, 66, "FG-001", "grille à feuilles")
    f.conduite([(95, 71), (95, 82)])
    f.rect(88, 82, 14, 16, ep=0.45, rempli="#fff")
    f.texte(95, 91, "FF-001", 2.1, "middle", gras=True)
    f.texte(95, 101, "premier flot 50 L", 1.9, "middle", c="fin")
    f.conduite([(88, 95), (78, 95), (78, 110)], "drain")
    f.texte(70, 114, "vers puits d'infiltration", 1.8, c="fin")
    f.conduite([(102, 88), (125, 88), (125, 100)])
    f.cuve(110, 100, 34, 48, "CI-001", "citerne 10 m³ (20 m³)", 0.65)
    f.instrument(155, 110, "LT", "001", ligne_vers=(144, 110))
    f.instrument(155, 128, "LSL", "001", ligne_vers=(144, 140))
    f.conduite([(110, 145), (100, 145)], "eau")
    f.texte(80, 150, "trop-plein vers puits", 1.8, c="fin")
    # pompe de transfert
    f.conduite([(144, 142), (170, 142)])
    f.vanne(170, 142, "V-001")
    f.conduite([(173, 142), (190, 142)])
    f.pompe(194, 142, "P-001", sens=0)
    f.texte(194, 152, "1,5 m³/h - 0,55 kW", 1.8, "middle", c="fin")
    f.conduite([(198, 142), (210, 142)])
    f.clapet(213, 142, "CL-001")
    f.conduite([(216, 142), (228, 142)])
    f.filtre(233, 142, "F-001", "sédiments 50 µm")
    f.conduite([(238, 142), (252, 142)])
    f.filtre(257, 142, "F-002", "charbon actif")
    f.conduite([(262, 142), (290, 142), (290, 120)])
    # forage et osmoseur
    f.rect(165, 195, 16, 24, ep=0.45, rempli="#fff")
    f.texte(173, 206, "FOR", 2.1, "middle", gras=True)
    f.texte(173, 210, "forage", 1.8, "middle")
    f.pompe(173, 188, "P-002", sens=-90)
    f.conduite([(173, 184), (173, 176), (205, 176)])
    f.texte(185, 173, "ou réseau REGIDESO", 1.8, c="fin")
    f.vanne(205, 176, "V-002")
    f.conduite([(208, 176), (225, 176)])
    f.boite(225, 168, 32, 16, "RO-001", ["osmoseur 100 L/h"], rempli="#fff")
    f.conduite([(257, 176), (300, 176), (300, 120)])
    f.conduite([(241, 184), (241, 196)], "drain")
    f.texte(243, 200, "concentrat : nettoyage / arrosage extérieur", 1.8, c="fin")
    f.instrument(275, 190, "CE", "002", ligne_vers=(275, 176))
    # tampon
    f.cuve(280, 70, 34, 50, "T-002", "tampon 1 m³", 0.7)
    f.instrument(328, 82, "LT", "002", ligne_vers=(314, 82))
    f.conduite([(314, 108), (350, 108), (350, 60), (395, 60)])
    f.texte(397, 61, "vers H02 (EV-102)", 2.0, gras=True)
    f.conduite([(350, 85), (395, 85)])
    f.texte(397, 86, "vers H03 (EV-201, EV-202)", 2.0, gras=True)
    f.conduite([(350, 108), (395, 108)])
    f.vanne(370, 108, "EV-301", ev=True)
    f.texte(397, 109, "vers bac pad BP-301", 2.0, gras=True)
    f.note(25, 225, [
        "Fonctionnement (AUT-E) : quand LT-002 < 50 %, P-001 transfère l'eau de pluie si LT-001 > 10 % ;",
        "sinon P-002 et RO-001 démarrent. Arrêt à LT-002 > 90 %. LSL-001 interdit P-001 (protection marche à sec).",
        "Eau de pluie prioritaire pour le pad (pas de tartre). Tuyauteries PE-HD PN10 opaques, sans cuivre ni laiton.",
    ], titre="Logique", taille=2.1)
    f.legende(330, 140, LEG)
    return f


def fertirrigation():
    f = Feuille("H02", "P&ID : fertirrigation du compartiment fruits", "sans", lot="Lot hydraulique - circuit fermé avec désinfection UV-C")
    f.texte(25, 40, "depuis H01 (T-002)", 2.0, gras=True)
    f.conduite([(25, 45), (45, 45)])
    f.vanne(50, 45, "EV-102", ev=True)
    f.conduite([(53, 45), (75, 45), (75, 70)])
    # solutions mères
    for k, (tag, nom, pd) in enumerate([("CA-101", "A", "P-103"), ("CB-101", "B", "P-104"), ("CC-101", "acide", "P-105")]):
        x = 95 + k * 30
        f.cuve(x, 25, 20, 24, tag, f"100 L {nom}", 0.7, "sol")
        f.pompe_doseuse(x + 10, 60, pd)
        f.conduite([(x + 10, 49), (x + 10, 56.5)], "sol", fleche=False)
        f.conduite([(x + 10, 63.5), (x + 10, 70)], "sol")
    f.cuve(70, 70, 110, 45, "CU-101", "cuve de solution 500 L, couverte, opaque", 0.6, "sol")
    f.instrument(195, 78, "CE", "101", ligne_vers=(180, 78))
    f.instrument(195, 92, "pH", "101", ligne_vers=(180, 92))
    f.instrument(195, 106, "TT", "101", ligne_vers=(180, 106))
    f.instrument(57, 92, "LT", "101", ligne_vers=(70, 92))
    f.pompe(125, 125, "P-106", sens=180)
    f.texte(125, 134.5, "brassage", 1.8, "middle", c="fin")
    f.conduite([(150, 115), (150, 125), (129, 125)], "sol", fleche=False)
    f.conduite([(121, 125), (100, 125), (100, 115)], "sol")
    # irrigation
    f.conduite([(180, 112), (210, 112)], "sol")
    f.vanne(214, 112, "V-101")
    f.conduite([(217, 112), (230, 112)], "sol")
    f.pompe(234, 112, "P-101")
    f.texte(234, 121.5, "2 m³/h - 2,5 bar", 1.8, "middle", c="fin")
    f.conduite([(238, 112), (250, 112)], "sol")
    f.filtre(255, 112, "FI-101", "disques 120 mesh")
    f.conduite([(260, 112), (272, 112)], "sol")
    f.instrument(272, 98, "PT", "101", ligne_vers=(272, 112))
    f.instrument(288, 98, "FT", "101", ligne_vers=(288, 112))
    f.conduite([(272, 112), (296, 112)], "sol")
    f.vanne(300, 112, "EV-101", ev=True)
    f.conduite([(303, 112), (395, 112)], "sol")
    for k in range(5):
        x = 315 + k * 18
        f.ligne(x, 112, x, 130, "sol", 0.3)
        f.rect(x - 4, 130, 8, 9, ep=0.4, rempli="#333")
        f.ligne(x, 130, x, 120, "accent", 0.9)
        f.ligne(x - 6, 141, x + 6, 141, "drain", 0.6)
    f.texte(355, 108, "rampes PE 16 mm, goutteurs autorégulants 2 L/h, 1 par plante", 1.9, "middle", c="fin")
    f.texte(355, 150, "seaux hollandais à perlite sur gouttière de drainage", 1.9, "middle", c="fin")
    f.instrument(395, 140, "WT", "101", ligne_vers=(380, 141))
    f.texte(395, 150, "balance de drainage", 1.8, "middle", c="fin")
    # drainage
    f.conduite([(381, 141), (381, 170), (360, 170)], "drain")
    f.cuve(320, 160, 40, 30, "CU-102", "drainage 200 L", 0.4, "drain")
    f.instrument(372, 190, "LT", "102", ligne_vers=(360, 182))
    f.conduite([(320, 185), (300, 185)], "drain")
    f.pompe(296, 185, "P-102", sens=180)
    f.conduite([(292, 185), (275, 185)], "drain")
    f.filtre(270, 185, "FL-102", "tamis 50 µm")
    f.conduite([(265, 185), (245, 185)], "drain")
    f.uv(236, 185, "UV-101")
    f.texte(236, 197, "≥ 250 mJ/cm² à 1 m³/h", 1.8, "middle", c="fin")
    f.conduite([(228, 185), (160, 185), (160, 115)], "drain")
    f.conduite([(190, 185), (190, 210), (175, 210)], "drain", tirets="2,1")
    f.vanne(190, 200, "V-103", vertical=True)
    f.texte(150, 214, "purge vers fosse de valorisation (Na, CE excessifs)", 1.8, c="fin")
    f.note(25, 225, [
        "Arrosage : à chaque somme de rayonnement atteinte (≈ 100 J/cm², ajustée sur le drainage visé 20-30 %), P-101 + EV-101 délivrent 150 mL par goutteur.",
        "Dosage : CE puis pH, petites doses plafonnées (A/B 20 mL, acide 5 mL), 5 min de mélange entre deux corrections ; arrêt si mesure incohérente.",
        "Recyclage : CU-102 > 120 L déclenche P-102 ; le drainage passe le tamis 50 µm et l'UV-C avant de revenir dans CU-101.",
        "Ce circuit n'est jamais relié au circuit des bassins (H03) : une contamination racinaire reste confinée au compartiment.",
    ], titre="Logique", taille=2.05)
    f.legende(25, 140, LEG)
    return f


def bassins():
    f = Feuille("H03", "P&ID : bassins à radeaux du compartiment feuilles", "sans", lot="Lot hydraulique - deux bassins indépendants de 4,2 m³")
    # surpresseurs
    f.boite(30, 30, 30, 14, "SP-201", ["surpresseur 80 W"], rempli="#fff")
    f.boite(30, 52, 30, 14, "SP-202", ["secours 24 V DC"], rempli="#fff")
    f.conduite([(60, 37), (80, 37)], "air")
    f.conduite([(60, 59), (80, 59), (80, 37)], "air", fleche=False)
    f.clapet(70, 37)
    f.clapet(70, 59)
    f.instrument(92, 25, "PSL", "201", ligne_vers=(92, 37))
    f.conduite([(80, 37), (110, 37), (110, 120)], "air")
    f.conduite([(110, 75), (260, 75), (260, 120)], "air")
    for nom, x0, tag in (("Bassin frais (B1)", 60, "1"), ("Bassin tempéré (B2)", 210, "2")):
        f.rect(x0, 120, 120, 50, ep=0.6, rempli="#fff")
        f.rect(x0 + 0.6, 128, 118.8, 41.4, c="none", rempli="#1f6fb222", ep=0)
        for k in range(6):
            f.rect(x0 + 4 + k * 19, 124, 17, 4, ep=0.3, rempli="#f5f5f0")
            f.cercle(x0 + 12.5 + k * 19, 122, 2.2, c="accent", ep=0.3, rempli="#7fc25a")
        for k in range(5):
            f.rect(x0 + 12 + k * 22, 165, 8, 2, ep=0.3, rempli="#ddd")
        f.texte(x0 + 60, 150, nom, 2.6, "middle", gras=True)
        f.texte(x0 + 60, 154, "4,0 x 4,2 m, 25 cm d'eau, liner EPDM, isolé", 1.9, "middle", c="fin")
        for k, (l, n) in enumerate([("AT", f"20{tag}"), ("TT", f"20{tag}"), ("CE", f"20{tag}"), ("pH", f"20{tag}"), ("LT", f"20{tag}")]):
            f.instrument(x0 + 12 + k * 24, 185, l, n, ligne_vers=(x0 + 12 + k * 24, 170))
        f.texte(x0 + 60, 196, "AT = oxygène dissous (optique)", 1.8, "middle", c="fin")
    # refroidissement bassin frais
    f.conduite([(180, 135), (195, 135), (195, 100)], "eau")
    f.boite(180, 85, 30, 14, "CH-201", ["refroidisseur 500 W"], rempli="#fff")
    f.conduite([(185, 100), (185, 160), (180, 160)], "eau")
    # filtration UV
    f.uv(340, 140, "UV-201")
    f.pompe(340, 160, "P-205", sens=90)
    f.conduite([(330, 165), (336, 160)], "eau", fleche=False)
    f.texte(370, 150, "filtration 50 µm + UV", 1.8, c="fin")
    f.texte(370, 153.5, "en dérivation, 1 h sur 4", 1.8, c="fin")
    # appoint
    f.texte(300, 32, "depuis H01 (T-002)", 2.0, gras=True)
    f.conduite([(300, 37), (330, 37), (330, 60), (120, 60)], "eau", fleche=False)
    f.vanne(150, 60, "EV-201", ev=True)
    f.vanne(290, 60, "EV-202", ev=True)
    f.conduite([(150, 63), (150, 120)], "eau")
    f.conduite([(290, 63), (290, 120)], "eau")
    # dosage
    for k, (tag, x) in enumerate((("P-201/202", 345), ("P-203/204", 375))):
        f.pompe_doseuse(x, 95, tag)
    f.texte(360, 85, "dosage A/B et acide par bassin", 1.9, "middle", c="fin")
    f.note(25, 215, [
        "Aération permanente (charge prioritaire 0, jamais délestée) ; PSL-201 détecte la perte de débit d'air et démarre SP-202 sur le 24 V secouru.",
        "Bassin frais maintenu ≤ 20,5 °C par CH-201 en journée sur l'énergie solaire (Pythium au-delà de 22 °C). Bassin tempéré ≤ 24-26 °C sans refroidissement.",
        "Appoint par EV-201 / EV-202 quand LT < 4 100 L ; correction CE (A+B) et pH (acide) comme H02. Vidange et désinfection en janvier et juillet.",
        "Sans électricité : les plantes tiennent plusieurs heures grâce au volume d'eau ; quelques jours avec SP-202 sur batterie.",
    ], titre="Logique", taille=2.05)
    f.legende(330, 30, LEG)
    return f


def aquaculture():
    f = Feuille("H04", "P&ID : unité aquacole et couplage aux cultures", "sans",
                lot="Lot aquaculture - module de 32 m³ (tranche 2), doublé en tranche 3")
    # bacs de grossissement
    for k in range(4):
        x = 40 + k * 32
        f.cercle(x, 55, 11, ep=0.6, rempli="#1f6fb222")
        f.texte(x, 54, f"B-40{k + 1}", 2.3, "middle", gras=True)
        f.texte(x, 57.6, "8 m³", 1.9, "middle", c="fin")
        f.instrument(x + 9, 34, "AT", f"40{k + 1}", ligne_vers=(x + 5, 46))
        f.conduite([(x, 66), (x, 80)], "drain", fleche=False)
        f.conduite([(x - 6, 24), (x - 6, 44)], "eau")
    f.texte(85, 18.5, "retour gravitaire depuis T-401", 1.9, "middle", c="fin")
    f.conduite([(278, 60), (278, 24), (34, 24)], "eau", fleche=False)
    f.conduite([(40, 80), (160, 80)], "drain")
    f.texte(100, 84, "collecteur des sorties centrales (eau et matières en suspension)", 1.8, "middle", c="fin")
    # décanteur, biofiltre, air-lift, bassin de reprise
    f.cuve(160, 68, 22, 32, "DR-401", "décanteur", niveau=0.8)
    f.conduite([(182, 78), (195, 78)], "eau")
    f.cuve(195, 68, 30, 32, "BF-401", "biofiltre MBBR", niveau=0.85)
    for k in range(6):
        f.cercle(200 + k * 4.2, 90, 1.1, c="air", ep=0.25)
    f.conduite([(225, 78), (240, 78)], "eau")
    f.rect(240, 46, 9, 54, ep=0.5, rempli="#fff")
    f.texte(244.5, 108, "AL-401", 2.1, "middle", gras=True)
    f.texte(244.5, 111.5, "air-lift et dégazage", 1.8, "middle", c="fin")
    f.conduite([(249, 50), (260, 50), (260, 62)], "eau")
    f.cuve(258, 60, 42, 40, "T-401", "bassin de reprise", niveau=0.7)
    for k in range(5):
        f.ligne(266 + k * 6, 92, 269 + k * 6, 96, "sol", 0.4)
    f.texte(279, 98.5, "échangeur E-401", 1.7, "middle", c="fin")
    for k, (l, n) in enumerate((("pH", "401"), ("TT", "401"), ("LT", "401"))):
        f.instrument(264 + k * 11, 116, l, n, ligne_vers=(264 + k * 11, 100))
    # soufflantes
    f.boite(186, 125, 28, 12, "SB-401", ["soufflante 0,4 kW"])
    f.boite(186, 141, 28, 12, "SB-402", ["secours automatique"])
    f.conduite([(214, 131), (230, 131)], "air", fleche=False)
    f.conduite([(214, 147), (230, 147), (230, 104)], "air", fleche=False)
    f.clapet(222, 131)
    f.clapet(222, 147)
    f.conduite([(230, 104), (244, 104), (244, 100)], "air")
    f.conduite([(230, 104), (210, 104), (210, 100)], "air")
    f.instrument(238, 160, "PSL", "401", ligne_vers=(230, 147))
    f.conduite([(186, 147), (176, 147), (176, 165)], "air")
    # écloserie et quarantaine
    f.rect(30, 108, 110, 48, ep=0.5, rempli="#fff", r=1)
    f.texte(85, 113.5, "ECL-401 : écloserie (28-29 °C)", 2.3, "middle", gras=True)
    for k in range(6):
        f.rect(36 + k * 17, 125, 14, 10, ep=0.35, rempli="#1f6fb222", r=1)
        f.texte(43 + k * 17, 131, f"L{k + 1}", 1.9, "middle")
    f.rect(36, 140, 30, 10, ep=0.35, rempli="#fff")
    f.texte(51, 146.2, "incubateurs", 1.9, "middle")
    f.rect(72, 140, 30, 10, ep=0.35, rempli="#fff")
    f.texte(87, 146.2, "géniteurs (2 bacs)", 1.9, "middle")
    f.instrument(122, 145, "AT", "409", ligne_vers=(110, 140))
    f.texte(85, 120, "6 bacs d'alevinage de 1 m³", 1.8, "middle", c="fin")
    f.rect(30, 164, 50, 20, ep=0.5, rempli="#fff", r=1)
    f.texte(55, 172, "Q-401 : quarantaine", 2.2, "middle", gras=True)
    f.texte(55, 176, "3 m³, circuit isolé", 1.8, "middle", c="fin")
    f.pompe(150, 118, "P-407", sens=180)
    f.conduite([(258, 70), (250, 70)], "eau", fleche=False)
    f.conduite([(156, 104), (156, 118), (154, 118)], "eau", fleche=False)
    f.conduite([(146, 118), (140, 118)], "eau")
    f.conduite([(140, 150), (152, 150), (152, 80)], "drain", fleche=True)
    f.texte(145, 98, "alimentation", 1.7, "middle", c="fin")
    f.texte(145, 101, "depuis T-401", 1.7, "middle", c="fin")
    f.conduite([(258, 96), (252, 96), (252, 104), (156, 104)], "eau", fleche=False)
    # purge et minéralisation des boues
    f.vanne(171, 108, "EV-401", vertical=True, ev=True)
    f.conduite([(171, 100), (171, 104)], "drain", fleche=False)
    f.conduite([(171, 112), (171, 165)], "drain")
    f.cuve(150, 165, 42, 26, "MIN-401", "minéralisateur aéré", niveau=0.75, coul="drain")
    f.conduite([(150, 186), (130, 186), (130, 196)], "drain")
    f.texte(130, 200, "résidus vers le compost", 1.9, "middle", c="fin")
    f.pompe(205, 178, "P-406")
    f.conduite([(192, 178), (201, 178)], "drain", fleche=False)
    f.conduite([(209, 178), (360, 178), (360, 136)], "drain")
    f.texte(270, 182, "surnageant riche en phosphore et azote vers T-402", 1.8, "middle", c="fin")
    # dosage et appoint
    f.pompe_doseuse(318, 72, "P-401")
    f.pompe_doseuse(318, 88, "P-402")
    f.texte(326, 73, "potasse (KOH)", 1.8, c="fin")
    f.texte(326, 89, "chaux / dolomie", 1.8, c="fin")
    f.conduite([(314.5, 72), (300, 72)], "sol")
    f.conduite([(314.5, 88), (300, 88)], "sol")
    f.texte(330, 58.5, "depuis H01 (eau traitée)", 1.9, c="fin")
    f.conduite([(328, 62), (306, 62), (300, 62)], "eau")
    f.vanne(314, 62, "EV-402", ev=True)
    # chauffage
    f.boite(330, 22, 58, 13, "CS-401", ["chauffe-eau solaire 20 m²"])
    f.boite(330, 40, 58, 11, "PAC-401", ["pompe à chaleur d'appoint"])
    f.conduite([(330, 30), (292, 30), (292, 90)], "sol", fleche=True)
    f.conduite([(330, 46), (296, 46), (296, 90)], "sol", fleche=False)
    # prélèvement vers les cultures
    f.pompe(296, 140, "P-403", sens=0)
    f.conduite([(296, 100), (296, 136)], "eau", fleche=False)
    f.conduite([(300, 140), (308, 140)], "eau", fleche=False)
    f.filtre(313, 140, "F-401", "50 µm")
    f.conduite([(318, 140), (322, 140)], "eau", fleche=False)
    f.uv(330, 140, "UV-401")
    f.conduite([(338, 140), (344, 140)], "eau")
    f.cuve(344, 112, 32, 24, "T-402", "tampon 2 m³", niveau=0.6)
    f.instrument(392, 116, "LT", "402", ligne_vers=(376, 122))
    f.pompe(388, 152, "P-404", sens=90)
    f.conduite([(376, 132), (388, 132), (388, 148)], "eau", fleche=False)
    f.conduite([(388, 156), (388, 168), (402, 168)], "eau")
    f.vanne(396, 168, "", ev=True)
    f.texte(386, 171, "EV-403", 2.1, "end", gras=True)
    f.texte(403, 175, "vers H03", 1.9, "end", gras=True)
    f.texte(403, 178.5, "(appoint radeaux)", 1.7, "end", c="fin")
    f.conduite([(388, 168), (388, 192), (402, 192)], "eau")
    f.vanne(396, 192, "", ev=True)
    f.texte(386, 195, "EV-404", 2.1, "end", gras=True)
    f.texte(403, 199, "vers H02", 1.9, "end", gras=True)
    f.texte(403, 202.5, "(cuve des fruits)", 1.7, "end", c="fin")
    f.note(25, 210, [
        "Débit vers les cultures : 5 % du volume des bacs par jour (1,6 m³/j en tranche 2, 3,2 m³/j en tranche 3), réglé sur le nitrate des bacs (cible 50-150 mg/L N-NO3).",
        "P-403 ne démarre que si UV-401 est en service ; EV-403/EV-404 sont commandées par la station de fertirrigation selon le niveau et la CE des circuits de culture.",
        "SB-401 en service permanent (charge prioritaire 0) ; PSL-401 détecte la perte de pression d'air et démarre SB-402. Alarme SMS si AT < 3 mg/L dans un bac.",
        "pH de T-401 tenu entre 7,0 et 7,5 par P-401 (potasse) et P-402 (chaux) : ces dosages apportent aussi le potassium et le calcium qui manquent aux plantes.",
        "EV-401 purge le décanteur deux fois par jour vers MIN-401 (10 à 15 jours, aéré). Écloserie et quarantaine sur circuits séparés ; Q-401 ne rejoint jamais le circuit principal.",
    ], titre="Logique", taille=2.0)
    f.legende(250, 210, [(("eau", None), "eau des bacs / eau traitée"), (("drain", None), "boues et rejets des bacs"),
                         (("sol", None), "dosage et circuit de chauffage"), (("air", None), "air (aération, air-lift)"),
                         (("signal", "1.2,0.8"), "liaison de mesure / commande")])
    return f
