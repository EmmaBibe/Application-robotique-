"""Planches automatisme et IIoT : architecture réseau, logique de régulation, listes d'E/S et de câbles."""

from dessin import Feuille


def architecture():
    f = Feuille("I01", "Architecture réseau, bus de terrain et plan d'adressage", "sans", lot="Lot automatisme / IIoT")
    # niveau supervision
    f.rect(25, 25, 370, 45, ep=0.4, rempli="#eef4fb", r=2)
    f.texte(30, 31, "NIVEAU SUPERVISION - local technique", 2.5, gras=True, c="eau")
    f.boite(35, 36, 80, 28, "SRV-01 serveur local", ["mini-PC industriel, SSD 256 Go", "192.168.10.2", "Mosquitto, régulation, InfluxDB,", "Grafana, interface web"], rempli="#fff")
    f.boite(130, 36, 60, 28, "NET-02 routeur 4G", ["double SIM (2 opérateurs)", "192.168.10.1 (passerelle)", "VPN WireGuard sortant", "SMS d'alarme"], rempli="#fff")
    f.boite(205, 36, 60, 28, "NET-01 switch PoE", ["8 ports, rail DIN", "VLAN 10 : automates", "VLAN 20 : caméras", "VLAN 30 : Wi-Fi"], rempli="#fff")
    f.boite(280, 36, 50, 28, "NET-03 point d'accès", ["Wi-Fi IP65", "192.168.30.0/24", "tablettes, téléphones"], rempli="#fff")
    f.boite(340, 36, 50, 28, "Caméras IP", ["CAM-F1 .20.11", "CAM-L1 .20.12", "(CAM-PIEGE, CAM-EXT)"], rempli="#fff")
    for x1, x2 in ((115, 130), (190, 205), (265, 280), (330, 340)):
        f.ligne(x1, 50, x2, 50, "sol", 0.7)
    # niveau zone
    f.rect(25, 85, 370, 55, ep=0.4, rempli="#eef7f0", r=2)
    f.texte(30, 91, "NIVEAU ZONE - armoires de zone (cartes CAZ-1), Ethernet 100 Mbit/s, MQTT", 2.5, gras=True, c="accent")
    for k, (nom, ip, zone, fonctions) in enumerate([
            ("AUT-F", "192.168.10.11", "compartiment fruits", ["climat, stockage thermique", "irrigation, dosage fruits", "module 16 relais @10"]),
            ("AUT-L", "192.168.10.12", "compartiment feuilles", ["climat, bassins, chiller", "pépinière, LED", "module 16 relais @10"]),
            ("AUT-E", "192.168.10.13", "local technique", ["eau, osmoseur, citerne", "onduleur, délestage, groupe", "sas, météo, arrêt d'urgence"])]):
        x = 40 + k * 120
        f.boite(x, 97, 100, 36, f"{nom} - {ip}", [zone] + fonctions, rempli="#fff")
        f.ligne(x + 50, 97, x + 50, 70, "sol", 0.7)
    # niveau terrain : bus RS485
    f.rect(25, 150, 370, 75, ep=0.4, rempli="#fbf6ec", r=2)
    f.texte(30, 156, "NIVEAU TERRAIN - un bus RS485 Modbus RTU par automate (9600 bauds, 8N1, câble LiYCY 2x2x0,5 blindé)", 2.5, gras=True, c="drain")
    bus = [
        ("AUT-F", [("1", "TH-F1 T/HR"), ("2", "CO2-F1"), ("3", "EC-F1"), ("4", "PH-F1"), ("5", "TS-F1"), ("7", "TS-STO"), ("8", "SUB-F1"), ("10", "relais 16 E/S")]),
        ("AUT-L", [("1", "TH-L1 T/HR"), ("2", "TH-P1 pépinière"), ("3", "EC-B1"), ("4", "PH-B1"), ("5", "EC-B2"), ("6", "DO-B1 O2"), ("7", "PH-B2"), ("10", "relais 16 E/S")]),
        ("AUT-E", [("1", "MET-EXT météo"), ("2", "PYR-EXT"), ("3", "OND-1 onduleur"), ("4", "ENE-02 compteur"), ("5", "ENE-03 compteur"), ("6", "NIV citerne"), ("7", "NIV tampon"), ("10", "relais 16 E/S")]),
    ]
    for k, (aut, capteurs) in enumerate(bus):
        y = 165 + k * 19
        f.texte(30, y + 2, aut, 2.3, gras=True)
        f.ligne(48, y, 390, y, "drain", 0.6)
        for j, (adr, nom) in enumerate(capteurs):
            x = 58 + j * 42
            f.ligne(x, y, x, y + 4, "drain", 0.35)
            f.rect(x - 3, y + 4, 38, 7, ep=0.35, rempli="#fff", r=1)
            f.texte(x - 1.5, y + 9, f"@{adr}  {nom}", 1.9)
        f.texte(390, y - 1.5, "120 ohms", 1.7, "end", c="fin")
    f.note(25, 236, [
        "Sujets MQTT : serre/lub1/<zone>/mesure/<grandeur>, /etat/actionneurs, /consigne (avec validite_s = 120), /alarme, /disponibilite (dernière volonté).",
        "Comptes MQTT distincts par automate (listes d'accès), aucun port ouvert depuis internet, accès distant uniquement par VPN initié depuis le site.",
        "Si un automate ne reçoit plus de consigne pendant 120 s, il applique sa régulation de repli et allume son voyant AUTO (voir I02).",
    ], titre="Règles", taille=2.05)
    return f


def logique():
    f = Feuille("I02", "Logique de régulation climatique (organigramme)", "sans", lot="Lot automatisme - code : logiciel/serre_core/climat.py")

    def etape(x, y, l, h, txt, forme="rect", rempli="#fff"):
        if forme == "losange":
            f.poly([(x, y - h / 2), (x + l / 2, y), (x, y + h / 2), (x - l / 2, y)], ferme=True, ep=0.45, rempli=rempli)
        else:
            f.rect(x - l / 2, y - h / 2, l, h, ep=0.45, rempli=rempli, r=2 if forme == "arrondi" else 0)
        lignes = txt.split("\n")
        for k, li in enumerate(lignes):
            f.texte(x, y + 0.8 + (k - (len(lignes) - 1) / 2) * 2.9, li, 2.0, "middle")

    def fleche(pts, txt=""):
        f.poly(pts, ep=0.35, fleche=True)
        if txt:
            f.texte(pts[0][0] + 1.5, pts[0][1] + 3.2, txt, 1.8, c="fin")

    x = 90
    etape(x, 32, 70, 9, "Toutes les 5 min : lire mesures, météo,\nconsignes de la recette (culture, stade)", "arrondi", "#eef6f0")
    fleche([(x, 36.5), (x, 44)])
    etape(x, 52, 60, 14, "Vent ≥ 14 m/s ?", "losange")
    fleche([(x + 30, 52), (150, 52)], "oui")
    etape(175, 52, 50, 9, "Ouvrants fermés", rempli="#fdeceb")
    fleche([(x, 59), (x, 66)], "non")
    etape(x, 74, 60, 14, "Pluie ou vent ≥ 10 ?", "losange")
    fleche([(x + 30, 74), (150, 74)], "oui")
    etape(175, 74, 50, 9, "Ouvrants ≤ 20 / 30 %", rempli="#fdf3e0")
    fleche([(x, 81), (x, 88)], "non")
    etape(x, 98, 70, 16, "T > consigne aération + 3 °C\net HR ext. < 65 % et jour ?", "losange")
    fleche([(x + 35, 98), (150, 98)], "oui")
    etape(180, 98, 60, 12, "MODE ÉVAPORATIF : ouvrants\nfermés, pad + extracteurs", rempli="#e3eef8")
    fleche([(x, 106), (x, 114)], "non")
    etape(x, 122, 70, 10, "Ouverture = (T - consigne) / 4 °C\nx 100 %, bornée par la météo")
    fleche([(x, 127), (x, 134)])
    etape(x, 142, 60, 14, "HR > HR max ?", "losange")
    fleche([(x + 30, 142), (150, 142)], "oui")
    etape(175, 142, 50, 9, "Ouvrants ≥ 10 %")
    fleche([(x, 149), (x, 156)], "non")
    etape(x, 165, 70, 16, "Jour et soleil > 650 W/m²\net serre chaude ?", "losange")
    fleche([(x + 35, 165), (150, 165)], "oui")
    etape(175, 165, 50, 9, "Écran 70 % (ombrage)")
    fleche([(x, 173), (x, 180)], "non")
    etape(x, 189, 70, 16, "Nuit et T ext. < consigne\nchauffage + 5 °C ?", "losange")
    fleche([(x + 35, 189), (150, 189)], "oui")
    etape(175, 189, 50, 9, "Écran 100 % (95 % si HR > 92)")
    fleche([(x, 197), (x, 204)], "non")
    etape(x, 212, 70, 10, "Stockage, brassage, CO2 (colonne de droite)")
    fleche([(x, 217), (x, 224)])
    etape(x, 230, 70, 9, "Publier consigne + raisons (validité 120 s)", "arrondi", "#eef6f0")
    # colonne de droite : stockage
    X = 300
    etape(X, 40, 80, 14, "T < consigne chauffage et\ncuve > T + 2 °C ?", "losange")
    fleche([(X + 40, 40), (360, 40), (360, 52)], "oui")
    etape(372, 58, 46, 9, "Restitution AE-101", rempli="#fdf3e0")
    fleche([(X, 47), (X, 56)], "non")
    etape(X, 66, 80, 16, "Nuit, HR > max, cuve > T + 3 °C\net T < consigne + 4 ?", "losange")
    fleche([(X + 40, 66), (360, 66), (360, 76)], "oui")
    etape(372, 82, 46, 10, "Déshumidification :\nrestitution + 5 %", rempli="#fdf3e0")
    fleche([(X, 74), (X, 84)], "non")
    etape(X, 94, 80, 16, "Jour et T > consigne jour + 3\net cuve < T - 3 ?", "losange")
    fleche([(X + 40, 94), (360, 94), (360, 104)], "oui")
    etape(372, 110, 46, 9, "Charge du stock", rempli="#fdf3e0")
    fleche([(X, 102), (X, 124)], "non")
    etape(X, 132, 80, 14, "HR > max - 5, écran fermé,\nDPV bas ou stockage actif ?", "losange")
    fleche([(X + 40, 132), (360, 132), (360, 142)], "oui")
    etape(372, 148, 46, 9, "Brassage VB en marche")
    fleche([(X, 139), (X, 158)], "non")
    etape(X, 168, 80, 16, "Ouvrants ≤ 10 %, soleil > 150\net CO2 < consigne ?", "losange")
    fleche([(X + 40, 168), (360, 168), (360, 178)], "oui")
    etape(372, 184, 46, 9, "Injection CO2 (option)")
    f.note(250, 205, [
        "Intégration de température (nuit) : la consigne de chauffage baisse",
        "jusqu'à 1,5 °C si la moyenne des dernières 24 h dépasse la cible.",
        "Énergie : si KM2 est délesté, le mode évaporatif est suspendu",
        "et les ouvrants s'ouvrent au maximum (serre_core/service.py).",
        "Repli automate (sans serveur) : aération par seuils, fermeture",
        "vent/pluie, écran et restitution la nuit, aération des bassins.",
    ], titre="Compléments", taille=2.0)
    return f


def liste_es():
    f = Feuille("T01", "Liste des entrées et sorties (AUT-F, AUT-L, AUT-E)", "sans", lot="Lot automatisme")
    lignes = [
        ("AUT-F", "DI1-DI4", "TOR 24 V", "Fins de course ouvrant toit et écran (ouvert / fermé)", "CAZ-1"),
        ("AUT-F", "DI5", "TOR 24 V", "Anémomètre > 14 m/s (relais KA-ANE)", "CAZ-1"),
        ("AUT-F", "DI6-DI8", "TOR / impulsions", "Défaut extracteur, niveau bac pad, débit irrigation", "CAZ-1"),
        ("AUT-F", "AI1-AI2", "4-20 mA", "Pression irrigation PT-101, niveau CU-101 LT-101", "CAZ-1"),
        ("AUT-F", "K1-K4", "relais 5 A", "Ouvrants toit et latéral nord : ouvrir / fermer (via KA1-KA4)", "CAZ-1"),
        ("AUT-F", "K5-K6", "relais 5 A", "Extracteur EX-101 vitesses 1 et 2", "CAZ-1"),
        ("AUT-F", "R1-R2", "relais", "Écran fruits ouvrir / fermer (moteur 230 V)", "module @10"),
        ("AUT-F", "R3-R7", "relais", "P-301 pad, VB brassage, AE-101 + P-401, P-101 + EV-101, EV-102", "module @10"),
        ("AUT-F", "R8-R11", "relais", "P-103, P-104, P-105 doseuses, P-102 + UV-101", "module @10"),
        ("AUT-F", "Modbus", "RS485", "TH-F1, CO2-F1, EC-F1, PH-F1, TS-F1, TS-STO, SUB-F1", "bus F"),
        ("AUT-L", "DI1-DI4", "TOR 24 V", "Fins de course ouvrant toit sud et écran feuilles", "CAZ-1"),
        ("AUT-L", "DI5-DI6", "TOR 24 V", "Pressostat air PSL-201, défaut chiller CH-201", "CAZ-1"),
        ("AUT-L", "AI1-AI2", "4-20 mA", "Niveaux bassins LT-201 et LT-202", "CAZ-1"),
        ("AUT-L", "K1-K4", "relais 5 A", "Ouvrants toit et latéral sud : ouvrir / fermer", "CAZ-1"),
        ("AUT-L", "K5", "relais NC", "Surpresseur SP-201 (au repos = en marche)", "CAZ-1"),
        ("AUT-L", "K6", "relais 5 A", "Extracteur EX-102", "CAZ-1"),
        ("AUT-L", "R1-R10", "relais", "Écran, pad, brassage, CH-201, EV-201/202, P-201..205, UV-201, LED, tapis", "module @10"),
        ("AUT-E", "DI1-DI8", "TOR 24 V", "SNEL présent, défaut onduleur, portes sas, fuite, citerne basse, groupe, AU", "CAZ-1"),
        ("AUT-E", "AI1-AI2", "4-20 mA", "Niveau citerne LT-001, niveau tampon LT-002", "CAZ-1"),
        ("AUT-E", "K1-K3", "relais", "Bobines KM1, KM2, KM3 (délestage)", "CAZ-1"),
        ("AUT-E", "K4-K6", "relais", "Démarrage groupe, P-001 transfert, sirène", "CAZ-1"),
        ("AUT-E", "R1-R4", "relais", "P-002 forage, RO-001, EV-301 pad, éclairage extérieur", "module @10"),
        ("AUT-E", "Modbus", "RS485", "Météo, pyranomètre, onduleur, compteurs, niveaux", "bus E"),
    ]
    f.tableau(25, 25, [("Automate", 22), ("Repère", 24), ("Type", 26), ("Fonction", 175), ("Support", 28)], lignes, taille=2.05, h=5.6)
    f.note(25, 170, [
        "Réserve : 2 entrées et 4 relais libres par automate au minimum (extensions).",
        "Chaque mouvement de moteur est protégé par fins de course câblées ET temporisation logicielle (180 s ouvrants, 240 s écran).",
        "Le module 16 relais Modbus (adresse 10) porte les sorties non critiques ; une panne du module laisse les sécurités sur la carte CAZ-1.",
    ], titre="Notes", taille=2.1)
    return f


def liste_cables():
    f = Feuille("T02", "Liste des câbles", "sans", lot="Lot électricité / automatisme")
    lignes = [
        ("C01", "SNEL -> QS", "U1000R2V 3G6", "25 m", "sous fourreau TPC Ø 63"),
        ("C02", "QS -> OND-1 AC IN", "U1000R2V 3G6", "4 m", "local technique"),
        ("C03", "Groupe -> QGE -> OND-1 GEN", "H07RN-F 3G4", "8 m", "prise industrielle 32 A"),
        ("C04", "PV -> CDC", "PV1-F 2 x 6", "15 m", "chemin de câble toiture"),
        ("C05", "CDC -> OND-1 PV", "PV1-F 2 x 6", "3 m", ""),
        ("C06", "BAT-1 -> F-BAT -> OND-1", "H07V-K 2 x 35", "2 m", "cosses serties"),
        ("C07", "OND-1 AC OUT -> TGBT", "U1000R2V 3G10", "2 m", ""),
        ("C10-C13", "TGBT -> pompes P-101, P-102, P-001, P-002", "H07RN-F 3G1,5", "10-25 m", "IP68 en serre"),
        ("C14-C15", "TGBT -> extracteurs EX-101, EX-102", "H07RN-F 4G2,5", "18 m", "2 vitesses"),
        ("C16", "TGBT -> chambre froide", "U1000R2V 3G2,5", "8 m", ""),
        ("C17", "TGBT -> écran (moteur 230 V)", "H07RN-F 4G1,5", "15 m", "ouvrir / fermer"),
        ("C20-C23", "Alim 24 V -> armoires AUT-F, AUT-L", "H07RN-F 3G2,5", "15 m", "24 V secouru"),
        ("C24-C27", "Armoires -> moteurs ouvrants 24 V", "H07RN-F 3G2,5", "8-15 m", "chute < 5 %"),
        ("C30-C32", "Bus RS485 F, L, E", "LiYCY 2 x 2 x 0,5", "20-40 m", "blindé, terminaison 120 ohms"),
        ("C33-C35", "Ethernet automates -> switch", "Cat. 6 FTP extérieur", "15-30 m", "parafoudre si sortie"),
        ("C36-C38", "Fins de course, contacts", "H05RN-F 3G0,75", "5-15 m", ""),
        ("C40", "Boucle de terre", "Cu nu 35 mm²", "60 m", "fond de fouille"),
        ("C41-C48", "Liaisons équipotentielles", "H07V-K 16 V/J", "40 m", "structure, cuves, PV"),
        ("C50", "Paratonnerre -> terre", "Cu 50 mm²", "12 m", "descente dédiée"),
    ]
    f.tableau(25, 25, [("Repère", 22), ("Liaison", 100), ("Type", 52), ("Longueur", 24), ("Observations", 70)], lignes, taille=2.05, h=5.6)
    return f
