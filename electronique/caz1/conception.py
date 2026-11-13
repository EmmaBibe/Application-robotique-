"""Définition unique de la carte CAZ-1 (Carte Automate de Zone), révision 1.0.

Ce fichier est la source de vérité : le schéma (.kicad_sch), le circuit
imprimé (.kicad_pcb), la nomenclature et la documentation en sont générés.

Rôle de la carte : automate de zone de la serre (compartiment fruits,
compartiment feuilles, ou eau-énergie). Elle remplace l'association
« ESP32 du commerce + module relais Modbus » par une carte unique, robuste,
réparable, dimensionnée pour l'armoire de zone.

Fonctions :
  - alimentation 24 V protégée (fusible réarmable, inversion de polarité,
    surtensions), convertisseur 24 V -> 3,3 V à découpage ;
  - microcontrôleur ESP32-WROOM-32E ;
  - Ethernet par module W5500 enfiché (liaison SPI) ;
  - bus RS485 (Modbus RTU) protégé, terminaison et polarisation ;
  - 8 entrées 24 V isolées par optocoupleurs, avec voyant par entrée ;
  - 6 sorties relais 10 A / 250 V (contacts inverseurs), voyant par sortie ;
  - 2 entrées analogiques 4-20 mA avec alimentation de boucle protégée ;
  - extension I2C (connecteur JST XH 4 points) ;
  - voyants d'état, buzzer d'alarme 24 V, boutons RESET et BOOT,
    connecteur de programmation.

Unités : mm. Origine de la carte en haut à gauche ; x vers la droite, y vers le bas.
"""

from __future__ import annotations

from dataclasses import dataclass, field

LARGEUR, HAUTEUR = 150.0, 110.0
REVISION = "1.0"
TITRE = "CAZ-1 Carte automate de zone"


@dataclass
class Composant:
    ref: str
    valeur: str
    symbole: str          # bibliothèque:nom (KiCad)
    empreinte: str        # bibliothèque:nom (KiCad)
    broches: dict         # numéro de broche -> nom de net (None = non connectée)
    x: float
    y: float
    rot: float = 0.0
    bloc: str = ""
    description: str = ""
    reference_fabricant: str = ""
    champs: dict = field(default_factory=dict)


COMPOSANTS: list[Composant] = []


def ajouter(*args, **kw) -> Composant:
    c = Composant(*args, **kw)
    COMPOSANTS.append(c)
    return c


# Empreintes usuelles
R0805 = "Resistor_SMD:R_0805_2012Metric"
R1206 = "Resistor_SMD:R_1206_3216Metric"
C0603 = "Capacitor_SMD:C_0603_1608Metric"
C0805 = "Capacitor_SMD:C_0805_2012Metric"
C1206 = "Capacitor_SMD:C_1206_3216Metric"
LED0805 = "LED_SMD:LED_0805_2012Metric"
BORNIER = "TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-{n}-5.08_1x0{n}_P5.08mm_Horizontal"


def r(ref, val, a, b, x, y, rot=0, bloc="", desc="", fp=R0805, mpn=""):
    return ajouter(ref, val, "Device:R", fp, {"1": a, "2": b}, x, y, rot, bloc, desc, mpn)


def c(ref, val, a, b, x, y, rot=0, bloc="", desc="", fp=C0805, mpn=""):
    return ajouter(ref, val, "Device:C", fp, {"1": a, "2": b}, x, y, rot, bloc, desc, mpn)


def led(ref, couleur, anode, cathode, x, y, rot=0, bloc="", desc=""):
    return ajouter(ref, couleur, "Device:LED", LED0805, {"1": cathode, "2": anode}, x, y, rot, bloc, desc,
                   {"verte": "Würth 150080GS75000", "rouge": "Würth 150080RS75000",
                    "jaune": "Würth 150080YS75000", "bleue": "Würth 150080BS75000"}.get(couleur, ""))


# ---------------------------------------------------------------- 1. Alimentation
B = "Alimentation 24 V"
ajouter("J1", "24V DC", "Connector:Screw_Terminal_01x02", BORNIER.format(n=2),
        {"1": "+24V_IN", "2": "GND"}, 11, 104, 0, B, "Entrée 24 V DC (alimentation secourue de l'armoire)",
        "Phoenix Contact MKDS 1,5/2-5,08 (1715721)")
ajouter("F1", "1,5 A", "Device:Polyfuse", "Fuse:Fuse_1812_4532Metric", {"1": "+24V_IN", "2": "+24V_F"},
        7, 93, 90, B, "Fusible réarmable 1,5 A / 33 V", "Littelfuse 1812L150/33DR")
ajouter("D1", "SS54", "Device:D_Schottky", "Diode_SMD:D_SMA", {"1": "+24V", "2": "+24V_F"},
        16, 93, 0, B, "Protection contre l'inversion de polarité (Schottky 5 A / 40 V)", "Vishay SS54-E3/61T")
ajouter("D2", "SMBJ33A", "Device:D_TVS", "Diode_SMD:D_SMB", {"1": "+24V", "2": "GND"},
        16, 88, 0, B, "Écrêteur de surtensions 33 V / 600 W", "Littelfuse SMBJ33A")
ajouter("C1", "47µF 50V", "Device:C_Polarized", "Capacitor_SMD:CP_Elec_8x10", {"1": "+24V", "2": "GND"},
        20, 74, 0, B, "Réservoir d'entrée, électrolytique aluminium faible ESR", "Panasonic EEE-FK1H470P")
c("C2", "100nF 50V", "+24V", "GND", 6, 82, 90, B, "Découplage 24 V (X7R)", mpn="Murata GRM21BR71H104KA01L")
ajouter("U1", "R-78E3.3-1.0", "Regulator_Switching:R-78E3.3-1.0", "Converter_DCDC:Converter_DCDC_RECOM_R-78E-0.5_THT",
        {"1": "+24V", "2": "GND", "3": "+3V3"}, 22, 90, 90, B, "Convertisseur à découpage 24 V -> 3,3 V / 1 A (rendement 90 %)",
        "RECOM R-78E3.3-1.0")
c("C3", "22µF 10V", "+3V3", "GND", 16, 74, 90, B, "Sortie 3,3 V (X5R)", fp=C1206, mpn="Murata GRM31CR61A226KE19L")
c("C4", "100nF", "+3V3", "GND", 19, 74, 90, B, "Découplage 3,3 V", fp=C0603, mpn="Yageo CC0603KRX7R9BB104")

# ---------------------------------------------------------------- 2. Microcontrôleur
B = "Microcontrôleur ESP32"
esp = {"1": "GND", "15": "GND", "38": "GND", "39": "GND", "2": "+3V3", "3": "EN",
       "4": "DI1", "5": "DI2", "6": "DI3", "7": "ETH_INT", "8": "AI1", "9": "AI2",
       "10": "DI4", "11": "DI5", "12": "DI6", "13": "ETH_RST", "14": None, "16": "DI7",
       "17": None, "18": None, "19": None, "20": None, "21": None, "22": None,
       "23": "DI8", "24": "LED_RUN", "25": "IO0", "26": "RS485_DE", "27": "RS485_RX", "28": "RS485_TX",
       "29": "ETH_CS", "30": "SCK", "31": "MISO", "32": None, "33": "SDA", "34": "RXD0", "35": "TXD0",
       "36": "SCL", "37": "MOSI"}
ajouter("U2", "ESP32-WROOM-32E", "RF_Module:ESP32-WROOM-32E", "RF_Module:ESP32-WROOM-32D", esp,
        24, 58, 90, B, "Module Wi-Fi/Bluetooth ESP32, 4 Mo de flash, antenne intégrée", "Espressif ESP32-WROOM-32E-N4")
c("C5", "10µF", "+3V3", "GND", 36, 50, 0, B, "Découplage ESP32 (X5R)", mpn="Murata GRM21BR61A106KE19L")
c("C6", "100nF", "+3V3", "GND", 36, 53, 0, B, "Découplage ESP32", fp=C0603)
r("R1", "10k", "+3V3", "EN", 36, 66, 0, B, "Rappel de la broche EN")
c("C7", "1µF", "EN", "GND", 36, 69, 0, B, "Retard de démarrage (EN)", fp=C0603)
r("R2", "10k", "+3V3", "IO0", 36, 72, 0, B, "Rappel de la broche BOOT (IO0)")
ajouter("SW1", "RESET", "Switch:SW_Push", "Button_Switch_THT:SW_PUSH_6mm", {"1": "EN", "2": "GND"},
        2, 81, 0, B, "Bouton de redémarrage", "TE 1-1825910-0")
ajouter("SW2", "BOOT", "Switch:SW_Push", "Button_Switch_THT:SW_PUSH_6mm", {"1": "IO0", "2": "GND"},
        24, 80, 0, B, "Bouton de mise en programmation", "TE 1-1825910-0")
ajouter("J2", "PROG", "Connector_Generic:Conn_01x06", "Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical",
        {"1": "GND", "2": "+3V3", "3": "TXD0", "4": "RXD0", "5": "EN", "6": "IO0"}, 46, 50, 0, B,
        "Programmation (adaptateur USB-série 3,3 V)", "Samtec TSW-106-07-G-S")

# ---------------------------------------------------------------- 3. Ethernet
B = "Ethernet (module W5500)"
ajouter("J3", "W5500", "Connector_Generic:Conn_02x05_Odd_Even", "Connector_PinSocket_2.54mm:PinSocket_2x05_P2.54mm_Vertical",
        {"1": "+3V3", "2": "GND", "3": "MOSI", "4": "MISO", "5": "SCK", "6": "ETH_CS", "7": "ETH_INT",
         "8": "ETH_RST", "9": "GND", "10": "+3V3"}, 144, 46, 0, B,
        "Embase du module Ethernet W5500 (SPI, RJ45 intégré)", "Samtec SSW-105-01-G-D")
c("C8", "10µF", "+3V3", "GND", 136, 46, 90, B, "Réservoir 3,3 V du module Ethernet")

# ---------------------------------------------------------------- 4. RS485
B = "Bus RS485 (Modbus RTU)"
ajouter("U3", "MAX3485", "Interface_UART:MAX3485", "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
        {"1": "RS485_RX", "2": "RS485_DE", "3": "RS485_DE", "4": "RS485_TX", "5": "GND",
         "6": "RS485_A", "7": "RS485_B", "8": "+3V3"}, 38, 86, 0, B, "Émetteur-récepteur RS485 3,3 V, 10 Mbit/s",
        "Analog Devices MAX3485ESA+")
c("C9", "100nF", "+3V3", "GND", 44, 82, 90, B, "Découplage du transceiver", fp=C0603)
r("R6", "10k", "RS485_DE", "GND", 32, 82, 90, B, "Récepteur actif au démarrage")
r("R4", "680", "+3V3", "RS485_A", 44, 90, 90, B, "Polarisation de repos (ligne A)")
r("R5", "680", "RS485_B", "GND", 47, 90, 90, B, "Polarisation de repos (ligne B)")
r("R3", "120", "RS485_A", "TERM_A", 34, 96, 0, B, "Terminaison de ligne 120 ohms", fp=R1206)
ajouter("JP1", "TERM", "Connector_Generic:Conn_01x02", "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical",
        {"1": "TERM_A", "2": "RS485_B"}, 32, 96, 0, B, "Cavalier de terminaison (fermé en bout de ligne)", "Samtec TSW-102-07-G-S")
ajouter("D3", "SM712", "Diode:SM712_SOT23", "Package_TO_SOT_SMD:SOT-23", {"1": "RS485_A", "2": "RS485_B", "3": "GND"},
        45.5, 95.5, 0, B, "Protection asymétrique RS485 (-7/+12 V)", "Semtech SM712.TCT")
ajouter("J4", "RS485", "Connector:Screw_Terminal_01x03", BORNIER.format(n=3),
        {"1": "RS485_A", "2": "RS485_B", "3": "GND"}, 24, 104, 0, B, "Bus Modbus vers les capteurs", "Phoenix Contact MKDS 1,5/3-5,08 (1715734)")

# ---------------------------------------------------------------- 5. Entrées isolées
B = "Entrées 24 V isolées"
for i in range(8):
    n = i + 1
    x = 54 + 6.0 * i
    com = "COM_A" if n <= 4 else "COM_B"
    r(f"R{10 + n}", "4,7k", f"IN{n}", f"INL{n}", x, 92, 90, B, f"Limitation de courant entrée {n} (≈ 4,5 mA sous 24 V)", fp=R1206)
    led(f"D{10 + n}", "verte", f"INL{n}", f"INK{n}", x + 2.6, 96, 90, B, f"Voyant entrée {n}")
    ajouter(f"U{10 + n}", "PC817", "Isolator:PC817", "Package_DIP:DIP-4_W7.62mm",
            {"1": f"INK{n}", "2": com, "3": "GND", "4": f"DI{n}"}, x, 85, 90, B,
            f"Optocoupleur entrée {n} (isolement 5 kV)", "Sharp PC817X2NSZ9F")
    ajouter(f"D{20 + n}", "1N4148W", "Device:D", "Diode_SMD:D_SOD-123", {"1": f"INL{n}", "2": com},
            x + 2.6, 90, 90, B, f"Protection contre l'inversion de l'entrée {n} (courant limité par la résistance)", "Diodes Inc. 1N4148W-7-F")
    r(f"R{20 + n}", "10k", "+3V3", f"DI{n}", x, 73, 90, B, f"Rappel au 3,3 V de l'entrée {n}")
    c(f"C{20 + n}", "10nF", f"DI{n}", "GND", x + 2.6, 73, 90, B, f"Filtre anti-rebond entrée {n}", fp=C0603)
ajouter("J5", "IN1-4", "Connector:Screw_Terminal_01x05", BORNIER.format(n=5),
        {"1": "IN1", "2": "IN2", "3": "IN3", "4": "IN4", "5": "COM_A"}, 56, 104, 0, B,
        "Entrées 1 à 4 et commun", "Phoenix Contact MKDS 1,5/5-5,08 (1715750)")
ajouter("J6", "IN5-8", "Connector:Screw_Terminal_01x05", BORNIER.format(n=5),
        {"1": "IN5", "2": "IN6", "3": "IN7", "4": "IN8", "5": "COM_B"}, 84, 104, 0, B,
        "Entrées 5 à 8 et commun", "Phoenix Contact MKDS 1,5/5-5,08 (1715750)")

# ---------------------------------------------------------------- 6. Extension d'E/S et pilotage des relais
B = "Extension d'E/S et pilotage"
mcp = {"9": "+3V3", "10": "GND", "12": "SCL", "13": "SDA", "15": "GND", "16": "GND", "17": "GND",
       "18": "MCP_RST", "19": None, "20": None, "11": None, "14": None,
       "21": "REL1_DRV", "22": "REL2_DRV", "23": "REL3_DRV", "24": "REL4_DRV", "25": "REL5_DRV", "26": "REL6_DRV",
       "27": "BUZ_DRV", "28": None, "1": "LED_AUTO", "2": "LED_ERR",
       "3": None, "4": None, "5": None, "6": None, "7": None, "8": None}
ajouter("U4", "MCP23017", "Interface_Expansion:MCP23017_SO", "Package_SO:SOIC-28W_7.5x17.9mm_P1.27mm", mcp,
        112, 62, 0, B, "Extension 16 E/S I2C (adresse 0x20)", "Microchip MCP23017-E/SO")
c("C10", "100nF", "+3V3", "GND", 120, 52, 90, B, "Découplage MCP23017", fp=C0603)
r("R7", "10k", "+3V3", "MCP_RST", 104, 52, 90, B, "Rappel RESET du MCP23017")
r("R8", "4,7k", "+3V3", "SDA", 100, 52, 90, B, "Rappel I2C SDA")
r("R9", "4,7k", "+3V3", "SCL", 97, 52, 90, B, "Rappel I2C SCL")
uln = {"1": "REL1_DRV", "2": "REL2_DRV", "3": "REL3_DRV", "4": "REL4_DRV", "5": "REL5_DRV", "6": "REL6_DRV",
       "7": "BUZ_DRV", "8": "GND", "9": "+24V", "16": "K1_COIL", "15": "K2_COIL", "14": "K3_COIL",
       "13": "K4_COIL", "12": "K5_COIL", "11": "K6_COIL", "10": "BUZ_OUT"}
ajouter("U5", "ULN2003A", "Transistor_Array:ULN2003A", "Package_SO:SOIC-16_3.9x9.9mm_P1.27mm", uln,
        84, 56, 90, B, "Réseau de 7 Darlington 500 mA, diodes de roue libre intégrées", "TI ULN2003ADR")
c("C11", "100nF 50V", "+24V", "GND", 92, 52, 90, B, "Découplage 24 V des bobines")

# ---------------------------------------------------------------- 7. Sorties relais
B = "Sorties relais 230 V"
for i in range(6):
    n = i + 1
    xc = 18 + 22 * i
    ajouter(f"K{n}", "SRD-24VDC-SL-C", "Relay:SANYOU_SRD_Form_C", "Relay_THT:Relay_SPDT_SANYOU_SRD_Series_Form_C",
            {"1": f"K{n}_COM", "2": "+24V", "3": f"K{n}_NO", "4": f"K{n}_NC", "5": f"K{n}_COIL"},
            xc, 34, 90, B, f"Relais de sortie {n}, bobine 24 V, contact inverseur 10 A / 250 V AC", "Songle SRD-24VDC-SL-C")
    ajouter(f"J{6 + n}", f"OUT{n}", "Connector:Screw_Terminal_01x03", BORNIER.format(n=3),
            {"1": f"K{n}_NO", "2": f"K{n}_COM", "3": f"K{n}_NC"}, xc + 5.08, 7, 180, B,
            f"Contacts du relais {n} (NO / COM / NC)", "Phoenix Contact MKDS 1,5/3-5,08 (1715734)")
    r(f"R{30 + n}", "4,7k", "+24V", f"KL{n}", xc - 4, 46, 90, B, f"Limitation du voyant de sortie {n}")
    led(f"D{30 + n}", "jaune", f"KL{n}", f"K{n}_COIL", xc + 0.5, 46, 90, B, f"Voyant de sortie {n} (allumé = relais collé)")
ajouter("BZ1", "24V", "Device:Buzzer", "Buzzer_Beeper:Buzzer_12x9.5RM7.6", {"1": "+24V", "2": "BUZ_OUT"},
        124, 84, 0, B, "Buzzer d'alarme locale 24 V, 85 dB", "CUI CEM-1224S")

# ---------------------------------------------------------------- 8. Entrées analogiques 4-20 mA
B = "Entrées 4-20 mA"
ajouter("F2", "100 mA", "Device:Polyfuse", "Fuse:Fuse_1206_3216Metric", {"1": "+24V", "2": "+24V_AUX"},
        110, 88, 0, B, "Protection de l'alimentation des boucles", "Bourns MF-NSMF010-2")
for j, x0 in ((1, 112), (2, 124)):
    ajouter(f"J{12 + j}", f"AI{j}", "Connector:Screw_Terminal_01x02", BORNIER.format(n=2),
            {"1": "+24V_AUX", "2": f"AI{j}_IN"}, x0, 104, 0, B, f"Boucle 4-20 mA n° {j} (capteur deux fils)",
            "Phoenix Contact MKDS 1,5/2-5,08 (1715721)")
    r(f"R{40 + j}", "120 0,1%", f"AI{j}_IN", "GND", x0 + 6, 94, 90, B, f"Shunt de mesure (20 mA -> 2,4 V)", fp=R1206,
      mpn="Panasonic ERA-8AEB121V")
    r(f"R{42 + j}", "1k", f"AI{j}_IN", f"AI{j}", x0 + 2, 94, 90, B, "Limitation vers l'ADC")
    c(f"C{40 + j}", "100nF", f"AI{j}", "GND", x0 + 4, 96.5, 90, B, "Filtre passe-bas (≈ 1,6 kHz)", fp=C0603)
    ajouter(f"D{40 + j}", "PESD3V3", "Device:D_TVS", "Diode_SMD:D_SOD-323", {"1": f"AI{j}_IN", "2": "GND"},
            x0 + 9, 94, 90, B, "Protection ESD de l'entrée analogique", "Nexperia PESD3V3S1UB")

# ---------------------------------------------------------------- 9. Voyants, extension, fixation
B = "Voyants et extension"
for k, (n, net, couleur, nom, role) in enumerate((
        (51, "+3V3", "verte", "LP", "Voyant ALIM"),
        (52, "LED_RUN", "bleue", "LR", "Voyant MARCHE (clignote : programme actif)"),
        (53, "LED_AUTO", "jaune", "LA", "Voyant AUTONOME (serveur absent)"),
        (54, "LED_ERR", "rouge", "LE", "Voyant DÉFAUT"))):
    r(f"R{n}", "1k", net, nom, 122 + 3 * k, 63, 90, B, f"Limitation du {role.split(' (')[0].lower()}")
    led(f"D{n}", couleur, nom, "GND", 122 + 3 * k, 67, 90, B, role)
ajouter("J15", "I2C", "Connector_Generic:Conn_01x04", "Connector_JST:JST_XH_B4B-XH-A_1x04_P2.50mm_Vertical",
        {"1": "+3V3", "2": "SDA", "3": "SCL", "4": "GND"}, 145, 80, 90, B, "Extension I2C (afficheur, capteur local)", "JST B4B-XH-A")
for k, (hx, hy) in enumerate(((4, 4), (146, 4), (4, 106), (146, 106)), start=1):
    if hy < 50:
        # trous du haut dans la bande 230 V : sans cuivre, pour ne rien relier à la masse dans cette zone
        ajouter(f"H{k}", "M3", "Mechanical:MountingHole", "MountingHole:MountingHole_3.2mm_M3",
                {}, hx, hy, 0, B, "Trou de fixation M3 non métallisé (bande 230 V)", "")
    else:
        ajouter(f"H{k}", "M3", "Mechanical:MountingHole_Pad", "MountingHole:MountingHole_3.2mm_M3_Pad_Via",
                {"1": "GND"}, hx, hy, 0, B, "Trou de fixation M3 relié à la masse", "")


def nets() -> list[str]:
    out = []
    for comp in COMPOSANTS:
        for n in comp.broches.values():
            if n and n not in out:
                out.append(n)
    return out


# Classes de pistes
NETS_PUISSANCE_230 = [f"K{n}_{s}" for n in range(1, 7) for s in ("COM", "NO", "NC")]
NETS_ALIM = ["+24V_IN", "+24V_F", "+24V", "GND", "+3V3", "+24V_AUX"]

# Repères de sérigraphie au droit des borniers
SERIGRAPHIE = [
    ("24V   0V", 13.5, 98.5), ("A   B   0V", 29, 98.5),
    ("IN1  IN2  IN3  IN4  COM", 66, 98.5), ("IN5  IN6  IN7  IN8  COM", 94, 98.5),
    ("+24V AI1", 114.5, 98.5), ("+24V AI2", 126.5, 98.5), ("I2C", 138, 98.5),
] + [(f"OUT{n}  NC C NO", 18 + 22 * (n - 1), 14.5) for n in range(1, 7)]


# ---------------------------------------------------------------- Positions définitives (après revue de placement)
POSITIONS = {
    "U2": (10.1, 58, 90),   # antenne en débord du bord gauche (recommandation Espressif)
    # alimentation regroupée sous le couloir de signaux (y 68-76 laissé libre)
    "U1": (5.5, 84, 0), "C1": (21, 83, 0), "C3": (28.5, 82, 90), "C4": (31.5, 82, 90),
    "F1": (7, 93, 90), "D1": (18, 95, 0), "D2": (18, 90.5, 0), "C2": (25, 91.5, 90),
    # boutons et programmation à droite du module
    "SW2": (39, 61, 0), "SW1": (50, 61, 0), "J2": (46, 44.5, 0),
    "R4": (48.5, 90, 90), "R5": (51, 90, 90),
    "R1": (33, 64, 90), "C7": (30, 64, 90), "R2": (33, 69, 90),
    "U3": (40, 86, 0), "R6": (35, 81, 0), "C9": (46, 82, 90),
    "R3": (32, 96, 0), "JP1": (38, 95, 90), "D3": (45.5, 95.5, 0),
    "J15": (145, 80, 90),
    "U4": (112, 62, 180),   # sorties GPA tournées vers le ULN2003
}
for _c in COMPOSANTS:
    if _c.ref in POSITIONS:
        _c.x, _c.y, _c.rot = POSITIONS[_c.ref]

# Références fabricant des passifs courants (laissées vides plus haut) : séries standard,
# remplaçables par tout équivalent de même valeur, boîtier, tolérance et tension.
PASSIFS = {
    ("10k", "R_0805"): "Yageo RC0805FR-0710KL", ("680", "R_0805"): "Yageo RC0805FR-07680RL",
    ("4,7k", "R_0805"): "Yageo RC0805FR-074K7L", ("1k", "R_0805"): "Yageo RC0805FR-071KL",
    ("120", "R_1206"): "Yageo RC1206FR-07120RL", ("4,7k", "R_1206"): "Yageo RC1206FR-074K7L",
    ("100nF", "C_0603"): "Yageo CC0603KRX7R9BB104", ("10nF", "C_0603"): "Yageo CC0603KRX7R9BB103",
    ("1µF", "C_0603"): "Murata GRM188R61E105KA12D", ("10µF", "C_0805"): "Murata GRM21BR61A106KE19L",
    ("100nF 50V", "C_0805"): "Murata GRM21BR71H104KA01L",
}
for _c in COMPOSANTS:
    if not _c.reference_fabricant:
        boitier = _c.empreinte.split(":")[1][:6]
        _c.reference_fabricant = PASSIFS.get((_c.valeur, boitier), "")
        if _c.ref.startswith("H"):
            _c.reference_fabricant = "Sans objet (trou de fixation)"
