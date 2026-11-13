"""Planches électriques : unifilaire, commande 24 V, câblage d'armoire, terre et foudre."""

from dessin import Feuille


def unifilaire():
    f = Feuille("E01", "Schéma unifilaire général", "sans", lot="Lot électricité - configuration optimisée (complète entre parenthèses)")
    # ---------------- sources
    # champ PV
    for k in range(6):
        x = 30 + k * 9
        f.rect(x, 30, 7, 10, ep=0.4, rempli="#e8eef8")
        f.ligne(x, 33.5, x + 7, 33.5, "fin", 0.15)
        f.ligne(x, 36.5, x + 7, 36.5, "fin", 0.15)
        if k:
            f.ligne(x - 2, 35, x, 35, ep=0.35)
    f.texte(54, 27, "Champ PV : 6 x 550 Wc en série (12 x 550 Wc)", 2.3, "middle", gras=True)
    f.texte(54, 45, "Voc 300 V (313 V à 5 °C), Vmp 251 V, Isc 14 A - PV1-F 2 x 6 mm²", 1.9, "middle", c="fin")
    f.ligne(30, 35, 26, 35, ep=0.35)
    f.ligne(26, 35, 26, 52, ep=0.35)
    f.ligne(83, 35, 88, 35, ep=0.35)
    f.ligne(88, 35, 88, 52, ep=0.35)
    f.boite(20, 52, 75, 26, "Coffret DC (CDC)", ["sectionneur DC 1000 V 32 A (Q-DC)", "parafoudre DC type 2 600 V (F-DC)", "fusibles gPV 15 A sur + et -"], rempli="#fafafa")
    f.ligne(57, 78, 57, 92, ep=0.5)
    f.texte(59, 87, "PV1-F 2 x 6 mm², 15 m", 1.9, c="fin")
    # SNEL
    f.boite(110, 22, 52, 18, "Réseau SNEL 230 V", ["branchement monophasé, schéma TT"], rempli="#fafafa")
    f.ligne(136, 40, 136, 46, ep=0.4)
    f.disjoncteur(136, 46, "QS", "32 A 2P C, 30 mA (AGCP)", diff=True)
    f.parafoudre(152, 50, "F-AC1", "T1+T2 Iimp 12,5 kA")
    f.ligne(136, 49, 152, 49, ep=0.3)
    f.ligne(152, 49, 152, 50, ep=0.3)
    f.ligne(136, 58, 136, 92, ep=0.5)
    f.texte(138, 72, "U1000R2V 3G6 mm²", 1.9, c="fin")
    # groupe
    f.boite(185, 22, 52, 18, "Groupe électrogène", ["5 kVA essence, démarrage à distance"], rempli="#fafafa")
    f.ligne(211, 40, 211, 46, ep=0.4)
    f.disjoncteur(211, 46, "QGE", "25 A 2P C")
    f.ligne(211, 58, 211, 70, ep=0.5)
    f.ligne(211, 70, 160, 70, ep=0.5)
    f.ligne(160, 70, 160, 92, ep=0.5)
    f.texte(185, 68, "H07RN-F 3G4 mm²", 1.9, "middle", c="fin")
    # onduleur
    f.boite(40, 92, 135, 32, "OND-1 : onduleur hybride 48 V - 5 kW (8 kW)", ["2 MPPT 120-450 V, entrée réseau (AC IN), entrée groupe (GEN),", "sortie secourue (AC OUT), contact sec de démarrage groupe, Modbus RS485 vers AUT-E", "transfert < 10 ms, chargeur 100 A, rendement 97 %"], rempli="#eef6f0", taille=2.6)
    f.texte(57, 98, "PV", 2.0, "middle", gras=True)
    f.texte(136, 98, "AC IN", 2.0, "middle", gras=True)
    f.texte(160, 98, "GEN", 2.0, "middle", gras=True)
    # batterie
    f.ligne(70, 124, 70, 132, ep=0.6)
    f.fusible(70, 132, "F-BAT", "125 A gG NH00")
    f.interrupteur(70, 144, "Q-BAT", "sectionneur 160 A")
    f.ligne(70, 156, 70, 162, ep=0.6)
    for k in range(2):
        x = 52 + k * 22
        f.rect(x, 162, 18, 16, ep=0.45, rempli="#fff7e0")
        f.texte(x + 9, 169, "LiFePO4", 2.0, "middle", gras=True)
        f.texte(x + 9, 172.5, "51,2 V 100 Ah", 1.8, "middle")
        f.texte(x + 9, 175.8, "5,12 kWh", 1.8, "middle")
    f.ligne(61, 162, 83, 162, ep=0.6)
    f.texte(52, 184, "BAT-1 : 2 modules en parallèle = 10,2 kWh (4 = 20,5 kWh)", 2.0, gras=True)
    f.texte(52, 187.5, "BMS communicant (CAN) vers OND-1 - câbles H07V-K 35 mm², < 2 m", 1.9, c="fin")
    # ---------------- TGBT
    f.ligne(150, 124, 150, 134, ep=0.6)
    f.texte(152, 131, "AC OUT - U1000R2V 3G10 mm²", 1.9, c="fin")
    f.interrupteur(150, 134, "QG", "interrupteur général 63 A 2P")
    f.ligne(150, 146, 150, 150, ep=0.6)
    f.ligne(110, 150, 380, 150, ep=0.8)
    f.texte(300, 147.5, "TGBT - local technique (coffret IP65, 4 rangées)", 2.3, gras=True)
    f.parafoudre(118, 150, "F-AC2", "T2 In 5 kA")
    # deux différentiels : vital (P0) et non vital
    groupes = [
        ("ID1", 140, "25 A 30 mA type A", "VITAL (P0)", [("Q1", "2 A C", "Alim. 24 V secourue", "automates, réseau"), ("Q2", "6 A C", "Surpresseur SP-201", "bassins")]),
        ("ID2", 200, "40 A 30 mA type A", "P1 via KM1", [("Q3", "10 A C + GV 2,5-4 A", "P-101 irrigation", "0,37 kW"), ("Q4", "6 A C", "P-102 + UV", "reprise, UV-101/201"),
                                                          ("Q5", "6 A C", "Brassage + AE-101", "VB, aérothermes, P-401"), ("Q6", "10 A C", "Moteurs 24 V + écran", "bloc 24 V 20 A"),
                                                          ("Q12", "10 A C + GV 4-6 A", "P-001 / P-002", "transfert, forage")]),
        ("ID3", 300, "40 A 30 mA type A", "P2 / P3 via KM2, KM3", [("Q7", "10 A C + 2 GV 2,5-4 A", "EX-101 / EX-102", "2 x 0,55 kW"), ("Q8", "10 A C", "P-301 + CH-201", "pad, refroidisseur"),
                                                                    ("Q9", "16 A C", "Chambre froide", "split 900 W"), ("Q10", "6 A C", "LED + tapis", "pépinière"),
                                                                    ("Q11", "10 A C", "RO-001", "osmoseur"), ("Q13", "16 A C", "Prises, éclairage", "")]),
    ]
    for rep, x, cal, titre, departs in groupes:
        f.disjoncteur(x, 150, rep, cal, diff=True)
        f.texte(x, 168, titre, 2.1, "middle", gras=True, c="accent")
        f.ligne(x, 162, x, 172, ep=0.5)
        largeur = 15 * len(departs)
        x0 = x - (len(departs) - 1) * 7.5 if len(departs) > 1 else x
        if len(departs) > 1:
            f.ligne(x0, 172, x0 + 15 * (len(departs) - 1), 172, ep=0.5)
        km = {"ID2": "KM1", "ID3": None}.get(rep)
        for k, (q, c, nom, det) in enumerate(departs):
            xx = x0 + 15 * k
            y = 172
            if rep == "ID2" and k == 0:
                pass
            f.ligne(xx, y, xx, y + 3, ep=0.4)
            contacteur = "KM1" if rep == "ID2" else ("KM2" if q in ("Q7", "Q8", "Q9") else "KM3" if q in ("Q10", "Q11", "Q13") else None)
            yb = y + 3
            if contacteur:
                f.contacteur(xx, yb, contacteur)
                yb += 12
            f.disjoncteur(xx, yb, q, c, moteur="GV" in c)
            yb += 12
            f.ligne(xx, yb, xx, yb + 6, ep=0.4)
            if q in ("Q3", "Q7", "Q12"):
                f.moteur(xx, yb + 10, nom.split(" ")[0])
            else:
                f.charge(xx, yb + 9, "", "")
            dy = 18 + (k % 2) * 6
            if k % 2:
                f.ligne(xx, yb + 13, xx, yb + dy - 2, "doux", 0.15)
            f.texte(xx, yb + dy, nom, 1.6, "middle")
            f.texte(xx, yb + dy + 2.4, det, 1.45, "middle", c="fin")
    f.note(250, 32, [
        "1. Schéma TT ; prise de terre < 10 ohms (boucle à fond de fouille + piquets).",
        "2. Les charges vitales (P0) ont leur propre différentiel ID1 : un défaut",
        "   sur une pompe ne coupe jamais l'aération des bassins ni les automates.",
        "3. KM1, KM2, KM3 : contacteurs 25 A, bobines 24 V DC commandées par",
        "   AUT-E (délestage selon l'état de charge, voir planche E02).",
        "4. Sections : 1,5 mm² sous 10 A, 2,5 mm² sous 16 A ; chute de tension < 3 %.",
        "5. Câbles en serre : H07RN-F ou U1000R2V sous gaine, équipements IP65.",
        "6. Repérage des câbles selon la liste T02, des borniers selon E03.",
    ], titre="Notes")
    f.legende(250, 80, [(("trait", None), "puissance AC"), (("elec", "2,1"), "courant continu"), (("terre", None), "terre / équipotentielle")])
    return f


def commande():
    f = Feuille("E02", "Commande 24 V : délestage et automatismes", "sans", lot="Lot électricité / automatisme - armoire du local technique")
    # alimentation 24 V secourue
    f.boite(25, 25, 60, 22, "Alimentation 24 V secourue", ["230 V AC / 24 V DC 10 A (Q1)", "module DC-UPS + 2 x 12 V 7 Ah", "autonomie automates + réseau : > 6 h"], rempli="#eef6f0")
    f.ligne(55, 47, 55, 55, "elec", 0.6)
    f.ligne(30, 55, 395, 55, "elec", 0.8)
    f.texte(395, 53, "+24 V", 2.2, "end", gras=True, c="elec")
    f.ligne(30, 240, 395, 240, "trait", 0.8)
    f.texte(395, 245, "0 V", 2.2, "end", gras=True)
    fus = [("F11", "2 A", "AUT-E (CAZ-1)"), ("F12", "2 A", "AUT-F (CAZ-1)"), ("F13", "2 A", "AUT-L (CAZ-1)"), ("F14", "4 A", "Switch PoE + routeur 4G"),
           ("F15", "2 A", "Bobines KM1-KM3"), ("F16", "1 A", "Surpresseur secours SP-202"), ("F17", "2 A", "Capteurs Modbus (3 bus)")]
    for k, (rep, cal, nom) in enumerate(fus):
        x = 40 + k * 50
        f.fusible(x, 55, rep, cal)
        f.texte(x, 72, nom, 1.9, "middle")
        f.ligne(x, 67, x, 75, "elec", 0.4)
    # AUT-E et contacteurs
    f.boite(25, 80, 120, 50, "AUT-E : carte CAZ-1 (eau et énergie)", [], rempli="#f7f3fb")
    rel = [("K1", "KM1"), ("K2", "KM2"), ("K3", "KM3"), ("K4", "Démarrage groupe"), ("K5", "P-001 transfert"), ("K6", "Alarme sirène")]
    for k, (kk, cible) in enumerate(rel):
        x = 35 + k * 18
        f.contact_no(x, 92, kk)
        f.texte(x, 110, cible, 1.7, "middle", c="fin")
    for k, (kk, cible) in enumerate(rel[:3]):
        x = 35 + k * 18
        f.ligne(x, 92, x, 88, "elec", 0.35)
        f.ligne(x, 104, x, 150, ep=0.35)
        f.bobine(x, 150, cible, "25 A AC-3")
        f.ligne(x, 154, x, 240, ep=0.35)
    f.ligne(35, 88, 125, 88, "elec", 0.35)
    f.ligne(80, 88, 80, 75, "elec", 0.35)
    f.note(25, 168, [
        "Logique de délestage (AUT-E, voir aussi le code serre_core/energie.py) :",
        "  KM1 fermé si SOC ≥ 20 % ou réseau présent  (priorité 1)",
        "  KM2 fermé si SOC ≥ 35 % ou réseau présent  (priorité 2)",
        "  KM3 fermé si SOC ≥ 55 % ou réseau présent  (priorité 3)",
        "  seuils relevés de 15 points si production PV > 3 kW",
        "  K4 : démarrage groupe si pas de réseau, SOC < 15 %, PV < 500 W",
        "Bobines au repos = contacteurs ouverts : sans automate, seules",
        "les charges P0 (automates, aération) restent alimentées.",
    ], titre="Fonctionnement", taille=2.0)
    # entrées AUT-E
    ent = [("DI1", "KA-SNEL : présence réseau"), ("DI2", "Défaut onduleur (contact sec)"), ("DI3", "Porte du sas 1"), ("DI4", "Porte du sas 2"),
           ("DI5", "Détecteur de fuite local tech."), ("DI6", "Niveau très bas citerne"), ("DI7", "Groupe en marche"), ("DI8", "Arrêt d'urgence")]
    f.boite(160, 80, 110, 50, "Entrées isolées AUT-E (24 V)", [], rempli="#fafafa")
    for k, (d, nom) in enumerate(ent):
        f.texte(165, 92 + k * 4.6, f"{d}", 2.1, gras=True)
        f.texte(176, 92 + k * 4.6, nom, 2.0)
    # AUT-F sorties
    f.boite(285, 80, 110, 70, "AUT-F : sorties (CAZ-1 + module 16 relais)", [], rempli="#f7f3fb")
    sf = [("K1/K2", "Ouvrant toit fruits : ouvrir / fermer (verrouillage croisé)"), ("K3/K4", "Ouvrant latéral nord : ouvrir / fermer"),
          ("K5", "Extracteur EX-101 vitesse 1"), ("K6", "Extracteur EX-101 vitesse 2"),
          ("R1/R2", "Écran fruits : ouvrir / fermer (moteur 230 V)"), ("R3", "Pompe du pad P-301"), ("R4", "Brassage VB-101/102"),
          ("R5", "Aérotherme AE-101 + P-401"), ("R6", "P-101 irrigation + EV-101"), ("R7", "EV-102 remplissage"),
          ("R8-R10", "Pompes doseuses P-103, P-104, P-105"), ("R11", "P-102 reprise + UV-101"), ("R12", "EV CO2 (complète)")]
    for k, (r, nom) in enumerate(sf):
        f.texte(289, 91 + k * 4.4, r, 2.0, gras=True)
        f.texte(303, 91 + k * 4.4, nom, 1.9)
    f.note(160, 168, [
        "Verrouillages câblés (en plus du logiciel) :",
        "  - ouvrir et fermer d'un même moteur : contacts croisés NC (K1/K2, K3/K4, R1/R2) ;",
        "  - fins de course câblées en série dans la commande moteur ;",
        "  - anémomètre (contact > 14 m/s) : coupe la commande « ouvrir » ;",
        "  - arrêt d'urgence : coupe KM1, KM2, KM3 et les sorties AUT-F / AUT-L,",
        "    jamais l'aération des bassins ni les automates.",
        "Le surpresseur des bassins est câblé sur un contact NC de AUT-L :",
        "relais au repos = surpresseur en marche.",
    ], titre="Sécurités", taille=2.0)
    return f


def cablage_armoire():
    f = Feuille("E03", "Câblage de l'armoire de zone AUT-F", "sans", lot="Lot automatisme - armoire IP65 600 x 400 x 200 mm, compartiment fruits")
    # vue de face armoire
    f.rect(25, 25, 150, 210, ep=0.7, rempli="#fafafa")
    f.texte(100, 22, "Vue de face, porte ouverte", 2.3, "middle", gras=True)
    rails = [45, 95, 145, 195]
    for y in rails:
        f.rect(30, y, 140, 7, ep=0.3, rempli="#e0e0e0")
    f.texte(32, 43, "Rail 1 : protections", 1.9, c="fin")
    for k, (rep, l) in enumerate([("Q-F", 18), ("F-24", 9), ("F-B1", 9), ("F-B2", 9), ("PS1 24 V 5 A", 36), ("KA-ANE", 18)]):
        x = 32 + sum([18, 9, 9, 9, 36, 18][:k]) + k * 2
        f.rect(x, 39, l, 18, ep=0.35, rempli="#fff")
        f.texte(x + l / 2, 49, rep, 1.8, "middle", gras=True)
    f.texte(32, 93, "Rail 2 : automate et extension", 1.9, c="fin")
    f.rect(32, 85, 75, 26, ep=0.4, rempli="#eef6f0")
    f.texte(69.5, 97, "CAZ-1 (carte automate)", 2.1, "middle", gras=True)
    f.texte(69.5, 101, "150 x 110 mm sur support rail", 1.7, "middle")
    f.rect(110, 85, 58, 26, ep=0.4, rempli="#f7f3fb")
    f.texte(139, 97, "Module 16 relais Modbus", 2.0, "middle", gras=True)
    f.texte(139, 101, "adresse 10", 1.7, "middle")
    f.texte(32, 143, "Rail 3 : relais d'interface moteurs", 1.9, c="fin")
    for k in range(8):
        x = 32 + k * 17
        f.rect(x, 136, 14, 22, ep=0.35, rempli="#fff")
        f.texte(x + 7, 148, f"KA{k + 1}", 1.8, "middle", gras=True)
    f.texte(32, 193, "Rail 4 : borniers X1 (puissance) et X2 (signaux)", 1.9, c="fin")
    for k in range(34):
        x = 31 + k * 4.1
        f.rect(x, 186, 3.6, 18, ep=0.25, rempli="#cfe3f5" if k < 14 else "#f5e6c8" if k < 22 else "#e3e3e3")
    f.texte(100, 212, "goulottes 40 x 60 mm verticales et horizontales", 1.9, "middle", c="fin")
    f.texte(100, 228, "presse-étoupes M20 / M25 en partie basse, aération filtrée", 1.9, "middle", c="fin")
    # bornier X2
    lignes = [
        ("X2:1-2", "+24 V / 0 V", "Alimentation CAZ-1", "F-24 2 A"),
        ("X2:3-5", "A / B / 0V", "Bus RS485 capteurs", "câble LiYCY 2x2x0,5 blindé"),
        ("X2:6", "DI1", "Fin de course ouvrant toit ouvert", "24 V, NO"),
        ("X2:7", "DI2", "Fin de course ouvrant toit fermé", "24 V, NO"),
        ("X2:8", "DI3", "Fin de course écran ouvert", "24 V, NO"),
        ("X2:9", "DI4", "Fin de course écran fermé", "24 V, NO"),
        ("X2:10", "DI5", "Anémomètre > 14 m/s (KA-ANE)", "24 V, NO"),
        ("X2:11", "DI6", "Défaut thermique extracteur", "24 V, NC"),
        ("X2:12", "DI7", "Niveau bas bac du pad", "24 V, NO"),
        ("X2:13", "DI8", "Débit irrigation (impulsions)", "24 V, 10 Hz max"),
        ("X2:14-15", "AI1", "Pression réseau irrigation", "4-20 mA, 0-6 bar"),
        ("X2:16-17", "AI2", "Niveau cuve CU-101", "4-20 mA, 0-1,5 m"),
        ("X1:1-3", "K1 NO/C/NC", "Ouvrant toit : ouvrir (KA1)", "230 V / 24 V"),
        ("X1:4-6", "K2 NO/C/NC", "Ouvrant toit : fermer (KA2)", ""),
        ("X1:7-9", "K3 NO/C/NC", "Ouvrant latéral : ouvrir (KA3)", ""),
        ("X1:10-12", "K4 NO/C/NC", "Ouvrant latéral : fermer (KA4)", ""),
        ("X1:13-15", "K5 NO/C/NC", "Extracteur vitesse 1", ""),
        ("X1:16-18", "K6 NO/C/NC", "Extracteur vitesse 2", ""),
    ]
    f.tableau(190, 25, [("Borne", 22), ("Signal", 26), ("Fonction", 70), ("Caractéristiques", 50)], lignes, taille=2.0, h=5.6)
    f.note(190, 140, [
        "Règles de câblage :",
        "- séparer physiquement 230 V et 24 V (goulottes distinctes) ;",
        "- blindage RS485 relié à la terre d'un seul côté (armoire) ;",
        "- résistance de fin de ligne 120 ohms au dernier capteur (cavalier JP1) ;",
        "- couleurs : 24 V bleu foncé, 0 V bleu clair, 230 V marron/bleu/vert-jaune ;",
        "- chaque fil repéré aux deux bouts (bague) selon la borne X1/X2 ;",
        "- mise à la terre de la porte et du fond de l'armoire (tresse 6 mm²).",
        "",
        "Les armoires AUT-L (feuilles) et AUT-E (eau-énergie) suivent le même",
        "modèle ; leurs affectations d'entrées/sorties sont dans la liste T01.",
    ], titre="Notes", taille=2.0)
    return f


def terre_foudre():
    f = Feuille("E04", "Mise à la terre et protection contre la foudre", "1:200", lot="Lot électricité - densité de foudroiement élevée (Katanga)")
    s = 4.0  # 1 m = 4 mm (1:250 environ, échelle indicative)
    ox, oy = 70, 50
    f.rect(ox, oy, 10 * s * 2, 10 * s * 2, ep=0.6, rempli="#f2f7f2")
    f.texte(ox + 40, oy + 40, "SERRE 10 x 10 m", 2.6, "middle", gras=True)
    f.rect(ox, oy + 80 + 2 * s * 2, 80, 12, ep=0.6, rempli="#f7f1e6")
    f.texte(ox + 40, oy + 80 + 2 * s * 2 + 7, "ANNEXE", 2.4, "middle", gras=True)
    # boucle de terre
    f.rect(ox - 6, oy - 6, 92, 92 + 16 + 12 + 4, c="terre", ep=0.9, tirets="3,1.5")
    for (x, y) in ((ox - 6, oy - 6), (ox + 86, oy - 6), (ox - 6, oy + 118), (ox + 86, oy + 118)):
        f.cercle(x, y, 2.2, c="terre", ep=0.5, rempli="#fff")
        f.texte(x, y + 0.8, "P", 1.8, "middle", gras=True, c="terre")
    f.cercle(ox + 110, oy + 100, 3, c="elec", ep=0.6, rempli="#fff")
    f.texte(ox + 110, oy + 108, "Mât paratonnerre 9 m", 2.0, "middle", gras=True)
    f.ligne(ox + 110, oy + 103, ox + 86, oy + 118, "terre", 0.8)
    f.texte(ox + 104, oy + 116, "descente dédiée", 1.8, c="terre")
    f.note(200, 45, [
        "Prise de terre :",
        "- boucle en câble cuivre nu 35 mm² en fond de fouille, à 0,6 m de profondeur,",
        "  autour de la serre et de l'annexe ; 4 piquets de 2 m en acier cuivré (P) ;",
        "- résistance visée < 10 ohms, mesurée à la réception (méthode des 62 %) ;",
        "- barrette de coupure dans le local technique pour les mesures.",
        "",
        "Liaisons équipotentielles (cuivre 16 mm² vert-jaune) :",
        "- structure acier de la serre (aux 4 angles), structure des panneaux PV,",
        "- cuves et canalisations métalliques, armoires, onduleur (borne PE),",
        "- station météo et mât des antennes 4G.",
        "",
        "Protection foudre :",
        "- paratonnerre à tige simple sur mât de 9 m, rayon de protection selon",
        "  la méthode de la sphère fictive (niveau III, R = 45 m) : serre et annexe couvertes ;",
        "- descente séparée, raccordée à la boucle par une liaison équipotentielle",
        "  via éclateur au droit de l'onduleur ;",
        "- parafoudres : T1+T2 en tête SNEL, T2 en tête TGBT, T2 DC 600 V côté PV,",
        "  protections de ligne sur RS485 extérieur, Ethernet et antennes.",
        "",
        "Contrôles : mesure de terre annuelle (avant la saison des pluies),",
        "inspection des parafoudres après chaque orage violent (voyant d'état).",
    ], titre="Prescriptions", taille=2.1)
    return f
