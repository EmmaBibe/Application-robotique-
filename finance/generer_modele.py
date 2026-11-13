"""Génère le modèle financier Excel (formules actives, modifiables).

Usage : python3 finance/generer_modele.py
Le classeur produit peut ensuite être modifié directement dans Excel ou
LibreOffice : toutes les cellules de résultat sont des formules.
"""

from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

SORTIE = Path(__file__).resolve().parent / "modele_financier_serre_lubumbashi.xlsx"

BLEU = PatternFill("solid", fgColor="DDEBF7")
JAUNE = PatternFill("solid", fgColor="FFF2CC")
VERT = PatternFill("solid", fgColor="E2EFDA")
GRIS = PatternFill("solid", fgColor="EDEDED")
TITRE = Font(bold=True, size=14, color="1F4E78")
GRAS = Font(bold=True)
FIN = Side(style="thin", color="BFBFBF")
BORD = Border(left=FIN, right=FIN, top=FIN, bottom=FIN)
USD = '#,##0 "$";[Red]-#,##0 "$"'
PCT = "0%"

# ---------------------------------------------------------------------------
# Données
# ---------------------------------------------------------------------------
# culture, compartiment, unité, surf. pilote, surf. extension,
# rendements (prudent, médian, optimiste) par m² et par an, prix (idem) par unité
CULTURES = [
    # culture, compartiment, unité, surface pilote, tranche 2 (+900 m²), tranche 3 (+1 000 m²), rdt (P, M, O), prix (P, M, O)
    ("Tomate ronde / grappe", "Fruits", "kg", 15, 100, 250, (18, 25, 32), (1.3, 1.8, 2.4)),
    ("Tomate cerise", "Fruits", "kg", 10, 80, 100, (10, 14, 18), (3.0, 4.0, 5.0)),
    ("Poivron de couleur", "Fruits", "kg", 15, 110, 200, (8, 12, 16), (3.0, 4.0, 5.5)),
    ("Piment fort", "Fruits", "kg", 10, 60, 100, (3, 5, 7), (3.5, 5.0, 7.0)),
    ("Laitue (têtes)", "Feuilles", "tête", 8, 110, 60, (150, 200, 240), (0.7, 1.0, 1.3)),
    ("Chou de Chine / pak-choï", "Feuilles", "kg", 5, 50, 40, (30, 40, 50), (2.0, 2.5, 3.0)),
    ("Épinard", "Feuilles", "kg", 4, 35, 20, (18, 25, 30), (2.5, 3.5, 4.5)),
    ("Céleri", "Feuilles", "kg", 4, 35, 20, (22, 30, 36), (2.5, 3.5, 4.5)),
    ("Aromatiques (basilic, coriandre, persil)", "Feuilles", "kg", 3, 50, 30, (10, 15, 20), (6.0, 8.0, 10.0)),
    ("Oignon vert (cébette)", "Feuilles", "kg", 3, 30, 25, (20, 28, 34), (2.0, 3.0, 4.0)),
    ("Poireau", "Feuilles", "kg", 3, 30, 20, (18, 25, 30), (2.0, 3.0, 4.0)),
    ("Amarante", "Feuilles", "kg", 3.6, 40, 25, (22, 30, 36), (0.8, 1.2, 1.6)),
    ("Chou pommé (essai)", "Essai", "kg", 0, 0, 0, (6, 8, 10), (0.8, 1.0, 1.3)),
    ("Oignon bulbe (essai)", "Essai", "kg", 0, 0, 0, (3, 4, 5), (1.0, 1.4, 1.8)),
    ("Ail (essai)", "Essai", "kg", 0, 0, 0, (0.8, 1.2, 1.5), (4.0, 6.0, 8.0)),
]

# libellé, phase, montant USD rendu Lubumbashi, durée d'amortissement (ans)
CAPEX = [
    ("Études, topographie, analyses sol et eau, autorisations", 1, 800, 5),
    ("Terrassement, plateforme, drainage pluvial", 1, 1500, 20),
    ("Fondations (plots béton + longrines)", 1, 1500, 20),
    ("Structure acier galvanisé, chapelle gothique 10 x 10 m, chéneau 4 m", 1, 5000, 20),
    ("Film diffusant 200 µm toiture (simple paroi)", 1, 900, 5),
    ("Pignons (polycarbonate 8 mm en partie basse) et cloison en film sur cadre", 1, 1400, 10),
    ("Ouvrants latéraux + faîtage motorisés avec filets anti-insectes", 1, 1800, 10),
    ("Écran d'ombrage / thermique motorisé", 1, 1200, 8),
    ("Murs évaporatifs (2 sections de 5 x 1,5 m) + 2 extracteurs", 1, 2500, 10),
    ("Stockage thermique 6 m³ (cuves noires) + aérotherme", 1, 1600, 15),
    ("Ventilateurs de brassage (4)", 1, 400, 8),
    ("Culture sur substrat fruits (gouttières, sacs, goutte-à-goutte, palissage)", 1, 1800, 8),
    ("Bassins à radeaux flottants (2 bassins, liner, plaques, aération)", 1, 1800, 10),
    ("Station de fertirrigation 2 circuits + UV-C", 1, 2500, 8),
    ("Récupération d'eau de pluie + citerne 10 m³ + filtration", 1, 2500, 15),
    ("Énergie : 6 x 550 Wc + structure", 1, 1800, 20),
    ("Énergie : onduleur hybride 5 kW", 1, 1100, 10),
    ("Énergie : batterie LiFePO4 10 kWh", 1, 3000, 10),
    ("Énergie : câblage, protections, terre, parafoudres", 1, 1000, 20),
    ("Électricité intérieure et armoires", 1, 1200, 15),
    ("Supervision IIoT (capteurs, sondes, automates, serveur local, 4G, caméras)", 1, 6100, 6),
    ("Pépinière et chambre de germination", 1, 800, 6),
    ("Annexe 10 x 3 m (sas, local technique, conditionnement)", 1, 3500, 20),
    ("Chambre froide 3 m³ (split inverter + contrôleur)", 1, 1500, 10),
    ("Matériel de récolte et conditionnement", 1, 700, 5),
    ("Clôture et éclairage de sécurité", 1, 1500, 15),
    ("Mise en service et formation", 1, 800, 5),
    ("Pilote aquacole : abri isolé 4 x 3 m, 2 bacs de 3 m³, décanteur, biofiltre, aération, thermoplongeur 1 kW, couplage aux radeaux", 1, 5200, 8),
    ("Essais de reproduction du Clarias (incubateur, auges, géniteurs, hormones) et formation aquacole", 1, 1800, 5),
    ("Extension : structures multi-tunnels 900 m² (fabrication locale)", 2, 22500, 15),
    ("Extension : film, filets, ouvrants", 2, 10800, 6),
    ("Extension : filets d'ombrage", 2, 3600, 5),
    ("Extension : pad + extracteurs bloc fruits", 2, 4000, 10),
    ("Extension : substrat fruits 350 m²", 2, 7000, 8),
    ("Extension : bassins radeaux 380 m²", 2, 8400, 10),
    ("Extension : fertirrigation", 2, 4000, 8),
    ("Extension : stockage eau 50 m³ (ferrociment) + pompes", 2, 6000, 15),
    ("Extension : énergie (groupe 15 kVA, +8 kWc, +15 kWh)", 2, 13000, 10),
    ("Extension : électricité", 2, 5000, 15),
    ("Extension : capteurs et automates supplémentaires", 2, 3000, 6),
    ("Extension : génie civil (plateforme, allées, drainage)", 2, 8000, 20),
    ("Extension : salle de conditionnement + chambre froide 12 m³", 2, 7000, 15),
    ("Extension : clôture", 2, 2000, 15),
    ("Aquaculture : bâtiment 15 x 10 m isolé, toiture translucide, dalle et caniveaux", 2, 10500, 20),
    ("Aquaculture : écloserie Clarias (incubateurs, 6 bacs d'alevinage, géniteurs, chauffage)", 2, 9000, 8),
    ("Aquaculture : grossissement module 1 (4 bacs de 8 m³, décanteur, biofiltre MBBR, dégazage)", 2, 14000, 10),
    ("Aquaculture : aération et relevage par air-lift (2 soufflantes dont 1 de secours)", 2, 2200, 8),
    ("Aquaculture : chauffe-eau solaire 20 m², échangeur, pompe à chaleur d'appoint", 2, 6500, 12),
    ("Aquaculture : énergie (+4 kWc, +15 kWh de batterie)", 2, 8000, 10),
    ("Aquaculture : couplage hydroponique (minéralisation des boues, bassin tampon, UV, vannes)", 2, 3500, 10),
    ("Aquaculture : capteurs (O2, pH, température, niveaux) et automate CAZ-1", 2, 3000, 6),
    ("Aquaculture : salle de préparation du poisson (inox, balance, machine à glace)", 2, 3500, 10),
    ("Tranche 3 : structures multi-tunnels 1 000 m² (fabrication locale)", 3, 25000, 15),
    ("Tranche 3 : film, filets, ouvrants", 3, 12000, 6),
    ("Tranche 3 : filets d'ombrage", 3, 4000, 5),
    ("Tranche 3 : pad + extracteurs", 3, 4500, 10),
    ("Tranche 3 : substrat fruits 650 m²", 3, 13000, 8),
    ("Tranche 3 : bassins radeaux 240 m²", 3, 5300, 10),
    ("Tranche 3 : fertirrigation", 3, 3500, 8),
    ("Tranche 3 : stockage d'eau 30 m³ + pompes", 3, 3500, 15),
    ("Tranche 3 : énergie (+6 kWc, +15 kWh)", 3, 9000, 10),
    ("Tranche 3 : électricité", 3, 4500, 15),
    ("Tranche 3 : capteurs et automates", 3, 2500, 6),
    ("Tranche 3 : génie civil (plateforme, allées, drainage)", 3, 8000, 20),
    ("Tranche 3 : agrandissement chambre froide et conditionnement", 3, 4000, 15),
    ("Tranche 3 : clôture", 3, 1000, 15),
    ("Tranche 3 : grossissement module 2 (4 bacs de 8 m³, filtration, soufflante)", 3, 13000, 10),
]

# libellé, pilote seul, ferme 1 000 m² + aquaculture, ferme 2 000 m² + aquaculture (USD/an)
OPEX = [
    ("Personnel serres et commun (salaires bruts, hors charges)", 2760, 14640, 27480),
    ("Aquaculture : personnel (technicien aquacole, ouvriers)", 0, 7560, 9720),
    ("Charges sociales employeur", "=(B4+B5)*Hypotheses!$B$8", "=(C4+C5)*Hypotheses!$B$8", "=(D4+D5)*Hypotheses!$B$8"),
    ("Semences et jeunes plants", 300, 2800, 5600),
    ("Engrais hydroponiques et acide", 350, 3200, 6400),
    ("Aquaculture : économie d'engrais apportée par l'eau des poissons", "=-B8*Poissons!$E$16*0.5", "=-C8*Poissons!$E$16", "=-D8*Poissons!$E$16"),
    ("Substrat, éponges, godets", 250, 1800, 3900),
    ("Protection biologique, pièges, phéromones", 150, 1200, 2400),
    ("Emballages", 300, 4500, 8600),
    ("Analyses de laboratoire (eau, solution, métaux)", 300, 800, 1200),
    ("Énergie d'appoint (SNEL, carburant)", 250, 2500, 4800),
    ("Eau d'appoint et entretien forage", 100, 400, 800),
    ("Maintenance et pièces de rechange", 900, 3500, 6500),
    ("Livraison (carburant, entretien véhicule)", 480, 3000, 5600),
    ("Télécom et abonnements", 240, 500, 600),
    ("Gardiennage et assurance", 600, 2400, 3400),
    ("Administration, comptabilité, taxes locales", 300, 1500, 2200),
    ("Commercialisation", 100, 800, 1500),
    ("Aquaculture : aliment poisson (grossissement et géniteurs)", 200, "=Poissons!$F$30", "=Poissons!$G$30"),
    ("Aquaculture : écloserie (aliments larvaires, artémia, hormones)", 100, "=Poissons!$F$31", "=Poissons!$G$31"),
    ("Aquaculture : glace, caisses, transport, sel, chaux, potasse, vétérinaire", 50, "=Poissons!$F$32", "=Poissons!$G$32"),
    ("Aquaculture : énergie d'appoint, entretien des bacs et pompes, commercialisation des alevins", 250, 3100, 4200),
]


for _ph in (1, 2, 3):
    _base = sum(m for _, ph, m, _ in CAPEX if ph == _ph)
    CAPEX.append((f"Imprévus phase {_ph} (10 %)", _ph, round(_base * 0.10, -1), 10))

ANNEES = 10


def style_entete(ws, ligne, n_col):
    for c in range(1, n_col + 1):
        cell = ws.cell(row=ligne, column=c)
        cell.font = GRAS
        cell.fill = GRIS
        cell.border = BORD
        cell.alignment = Alignment(wrap_text=True, vertical="center")


def largeurs(ws, valeurs):
    for i, w in enumerate(valeurs, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def construire() -> Workbook:
    wb = Workbook()

    # ------------------------------------------------------------------ Lisez-moi
    ws = wb.active
    ws.title = "Lisez-moi"
    lignes = [
        ("Modèle financier : ferme intégrée serres + aquaculture de Lubumbashi", TITRE),
        ("Pilote de 100 m², puis 1 000 m² avec écloserie et grossissement de poisson, puis 2 000 m²", GRAS),
        ("", None),
        ("Cellules jaunes : hypothèses à modifier. Cellules bleues : résultats calculés.", None),
        ("Tous les montants sont en dollars américains constants (hors inflation), rendu Lubumbashi.", None),
        ("Choisir le scénario dans Hypotheses!B4 : 1 = prudent, 2 = médian, 3 = optimiste.", None),
        ("Pour étudier la ferme sans poissons : mettre à 0 les productions et les ventes d'alevins (Poissons!B5:D7)", None),
        ("et retirer les lignes Aquaculture de l'onglet CAPEX (montant à 0).", None),
        ("", None),
        ("Structure :", GRAS),
        ("  Hypotheses : paramètres généraux, calendrier des tranches, montée en charge, fiscalité", None),
        ("  Cultures : surfaces par tranche, rendements et prix par culture et par scénario", None),
        ("  Poissons : écloserie de Clarias, grossissement, aliment, prix, bilan par tranche", None),
        ("  CAPEX : investissements par phase et amortissements", None),
        ("  OPEX : charges d'exploitation, pilote seul, ferme de 1 000 m² et ferme de 2 000 m²", None),
        ("  Resultats : compte de résultat et trésorerie sur 10 ans, VAN, TRI", None),
        ("  Pilote_seul : ce que donne le pilote (100 m² de serre + 6 m³ de bacs) si l'on s'arrête là", None),
        ("  Sensibilite : EBE de croisière selon les écarts de prix et de rendement des légumes, et selon le prix du poisson", None),
        ("", None),
        ("Les prix sont des prix de vente départ ferme aux clients professionnels (supermarchés,", None),
        ("hôtels, restaurants, cantines minières) et, pour les alevins, aux pisciculteurs de la région.", None),
        ("Ils doivent être confirmés par l'enquête de la phase 0 (voir docs/16_feuille_de_route.md).", None),
    ]
    for i, (txt, f) in enumerate(lignes, start=1):
        c = ws.cell(row=i, column=1, value=txt)
        if f:
            c.font = f
    ws.column_dimensions["A"].width = 110

    # ------------------------------------------------------------------ Hypothèses
    h = wb.create_sheet("Hypotheses")
    h["A1"] = "Hypothèses générales"
    h["A1"].font = TITRE
    params = [
        ("Taux de change indicatif (CDF pour 1 USD, BCC fin oct. 2026)", 2265, "0"),            # 3
        ("Scénario actif (1 prudent, 2 médian, 3 optimiste)", 2, "0"),                            # 4
        ("Pertes et invendus légumes - prudent", 0.12, PCT),                                      # 5
        ("Pertes et invendus légumes - médian", 0.08, PCT),                                       # 6
        ("Pertes et invendus légumes - optimiste", 0.05, PCT),                                    # 7
        ("Charges sociales employeur (CNSS, INPP, ONEM)", 0.15, PCT),                             # 8
        ("Taux d'actualisation", 0.12, PCT),                                                      # 9
        ("Impôt sur les bénéfices", 0.30, PCT),                                                   # 10
        ("Impôt minimum (% du chiffre d'affaires)", 0.01, PCT),                                   # 11
        ("Montée en charge pilote année 1", 0.55, PCT),                                           # 12
        ("Montée en charge pilote année 2 et suivantes", 0.90, PCT),                              # 13
        ("Année de construction de la tranche 2 (1 000 m² + aquaculture)", 2, "0"),               # 14
        ("Montée en charge d'une tranche, 1re année", 0.70, PCT),                                 # 15
        ("Montée en charge d'une tranche, 2e année", 0.90, PCT),                                  # 16
        ("Montée en charge d'une tranche, croisière", 1.00, PCT),                                 # 17
        ("Part des ventes en direct (paniers, particuliers)", 0.0, PCT),                          # 18
        ("Majoration de prix des ventes directes", 0.35, PCT),                                    # 19
        ("Valeur résiduelle des équipements en fin d'année 10 (% CAPEX)", 0.20, PCT),             # 20
        ("Année de construction de la tranche 3 (2 000 m²)", 4, "0"),                             # 21
    ]
    for i, (lib, val, fmt) in enumerate(params, start=3):
        h.cell(row=i, column=1, value=lib)
        c = h.cell(row=i, column=2, value=val)
        c.fill = JAUNE
        c.number_format = fmt
        c.border = BORD
    h["A23"] = "Pertes du scénario actif (légumes)"
    h["B23"] = "=CHOOSE($B$4,B5,B6,B7)"
    h["B23"].number_format = PCT
    h["B23"].fill = BLEU
    h["A24"] = "Coefficient de prix moyen des légumes (ventes directes incluses)"
    h["B24"] = "=1+B18*B19"
    h["B24"].number_format = "0.00"
    h["B24"].fill = BLEU
    h["A26"] = "Pour une ferme arrêtée à 1 000 m², mettre l'année de la tranche 3 au-delà de 10 (par exemple 99)."
    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="3")
    h.add_data_validation(dv)
    dv.add("B4")
    largeurs(h, [72, 14])

    H_SCEN = "Hypotheses!$B$4"
    H_ACTU = "Hypotheses!$B$9"
    H_IMPOT = "Hypotheses!$B$10"
    H_IMPMIN = "Hypotheses!$B$11"
    H_RAMP1 = "Hypotheses!$B$12"
    H_RAMP2 = "Hypotheses!$B$13"
    H_AN2 = "Hypotheses!$B$14"
    H_AN3 = "Hypotheses!$B$21"
    H_EXT1, H_EXT2, H_EXT3 = "Hypotheses!$B$15", "Hypotheses!$B$16", "Hypotheses!$B$17"
    H_RESID = "Hypotheses!$B$20"
    H_PERTES = "Hypotheses!$B$23"
    H_COEF = "Hypotheses!$B$24"

    # ------------------------------------------------------------------ Cultures
    cu = wb.create_sheet("Cultures")
    cu["A1"] = "Surfaces, rendements et prix"
    cu["A1"].font = TITRE
    ent = ["Culture", "Compartiment", "Unité", "Surface pilote (m²)", "Surface tranche 2 (m²)", "Surface tranche 3 (m²)",
           "Rdt prudent /m²/an", "Rdt médian /m²/an", "Rdt optimiste /m²/an",
           "Prix prudent $/u", "Prix médian $/u", "Prix optimiste $/u",
           "Rdt actif", "Prix actif", "CA brut pilote", "CA brut tranche 2", "CA brut tranche 3"]
    for j, e in enumerate(ent, start=1):
        cu.cell(row=3, column=j, value=e)
    style_entete(cu, 3, len(ent))
    r0 = 4
    for i, (nom, comp, unite, sp, s2, s3, rdt, prix) in enumerate(CULTURES):
        r = r0 + i
        vals = [nom, comp, unite, sp, s2, s3, *rdt, *prix]
        for j, v in enumerate(vals, start=1):
            c = cu.cell(row=r, column=j, value=v)
            if j >= 4:
                c.fill = JAUNE
            c.border = BORD
        cu.cell(row=r, column=13, value=f"=CHOOSE({H_SCEN},G{r},H{r},I{r})")
        cu.cell(row=r, column=14, value=f"=CHOOSE({H_SCEN},J{r},K{r},L{r})")
        cu.cell(row=r, column=15, value=f"=D{r}*M{r}*N{r}*{H_COEF}")
        cu.cell(row=r, column=16, value=f"=E{r}*M{r}*N{r}*{H_COEF}")
        cu.cell(row=r, column=17, value=f"=F{r}*M{r}*N{r}*{H_COEF}")
        for j in range(13, 18):
            c = cu.cell(row=r, column=j)
            c.fill = BLEU
            c.border = BORD
            c.number_format = USD if j >= 15 else "#,##0.0"
    rf = r0 + len(CULTURES)
    cu.cell(row=rf, column=1, value="TOTAL").font = GRAS
    for col in ("D", "E", "F", "O", "P", "Q"):
        c = cu[f"{col}{rf}"]
        c.value = f"=SUM({col}{r0}:{col}{rf - 1})"
        c.font = GRAS
        c.fill = BLEU
        c.number_format = USD if col in ("O", "P", "Q") else "#,##0.0"
    cu.cell(row=rf + 2, column=1, value="CA brut par m² de serre - pilote (100 m²)")
    cu.cell(row=rf + 2, column=4, value=f"=O{rf}/100").number_format = USD
    cu.cell(row=rf + 3, column=1, value="CA brut par m² de serre - tranche 2 (900 m²)")
    cu.cell(row=rf + 3, column=4, value=f"=P{rf}/900").number_format = USD
    cu.cell(row=rf + 4, column=1, value="CA brut par m² de serre - tranche 3 (1 000 m²)")
    cu.cell(row=rf + 4, column=4, value=f"=Q{rf}/1000").number_format = USD
    cu.cell(row=rf + 6, column=1, value="Surfaces feuilles = surfaces de radeaux (environ 69 % du compartiment). La tranche 3 "
                                         "est orientée fruits (650 m² de fruits pour 350 m² de feuilles) : le marché des tomates "
                                         "et poivrons est plus profond que celui des laitues.")
    largeurs(cu, [38, 12, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 13, 13, 13])
    CA_PIL = f"Cultures!$O${rf}"
    CA_T2 = f"Cultures!$P${rf}"
    CA_T3 = f"Cultures!$Q${rf}"

    # ------------------------------------------------------------------ Poissons
    po = wb.create_sheet("Poissons")
    po["A1"] = "Aquaculture découplée : écloserie de Clarias et grossissement en circuit recirculé"
    po["A1"].font = TITRE
    po["A2"] = ("Espèce de base : poisson-chat africain (Clarias gariepinus). Respiration aérienne : survit à une panne d'aération, "
                "ce qui compte avec les coupures du réseau. Le tilapia du Nil est une option si l'enquête de marché le préfère.")
    for j, e in enumerate(["Paramètre", "Prudent", "Médian", "Optimiste", "Actif", "Unité"], start=1):
        po.cell(row=4, column=j, value=e)
    style_entete(po, 4, 6)
    pp = [
        ("Poisson de table produit, tranche 2", (5, 5, 5), "t/an"),                       # 5
        ("Poisson de table produit, total après tranche 3", (10, 10, 10), "t/an"),         # 6
        ("Alevins vendus à d'autres pisciculteurs", (40000, 90000, 150000), "alevins/an"),  # 7
        ("Prix de vente du poisson de table, départ ferme", (2.6, 3.3, 4.0), "$/kg"),        # 8
        ("Prix de l'alevin vendu (5 à 10 g)", (0.18, 0.25, 0.32), "$/alevin"),              # 9
        ("Indice de conversion de l'aliment", (1.4, 1.15, 1.0), "kg aliment/kg"),           # 10
        ("Prix de l'aliment extrudé 35-40 % de protéines, rendu ferme", (1.45, 1.20, 1.00), "$/kg"),  # 11
        ("Survie en grossissement", (0.80, 0.88, 0.93), ""),                               # 12
        ("Poids de récolte", (0.8, 0.8, 0.8), "kg"),                                        # 13
        ("Coût variable d'un alevin produit (aliment larvaire, artémia, hormones)", (0.08, 0.06, 0.05), "$/alevin"),  # 14
        ("Pertes et invendus poisson", (0.08, 0.05, 0.03), ""),                            # 15
        ("Économie d'engrais sur la serre (part de la facture d'engrais)", (0.25, 0.35, 0.45), ""),  # 16
        ("Glace, caisses, transport, sel, chaux, potasse, vétérinaire", (0.20, 0.16, 0.13), "$/kg de poisson"),  # 17
    ]
    for i, (lib, vals, unite) in enumerate(pp, start=5):
        po.cell(row=i, column=1, value=lib).border = BORD
        for j, v in enumerate(vals, start=2):
            c = po.cell(row=i, column=j, value=v)
            c.fill, c.border = JAUNE, BORD
        c = po.cell(row=i, column=5, value=f"=CHOOSE({H_SCEN},B{i},C{i},D{i})")
        c.fill, c.border = BLEU, BORD
        po.cell(row=i, column=6, value=unite)
        for j in range(2, 6):
            po.cell(row=i, column=j).number_format = PCT if i in (12, 15, 16) else ("#,##0" if i in (5, 6, 7) else "0.00")
    # bilans en régime de croisière : pilote (colonne E), ferme 1 000 m² (F), ferme 2 000 m² (G)
    po["A20"] = "Bilan annuel en régime de croisière"
    po["A20"].font = GRAS
    for j, e in enumerate(["Poste", "", "", "", "Pilote (6 m³)", "Ferme 1 000 m²", "Ferme 2 000 m²"], start=1):
        po.cell(row=21, column=j, value=e)
    style_entete(po, 21, 7)
    bil = [
        ("Poisson de table produit (t)", "0.3", "=E5", "=E6"),                                                   # 22
        ("Alevins pour l'élevage interne", "=E22*1000/E13/E12", "=F22*1000/E13/E12", "=G22*1000/E13/E12"),      # 23
        ("Alevins vendus", 0, "=E7", "=E7"),                                                                     # 24
        ("Aliment consommé (t)", "=E22*E10", "=F22*E10", "=G22*E10"),                                            # 25
        ("CA poisson de table net de pertes", "=E22*1000*E8*(1-E15)", "=F22*1000*E8*(1-E15)", "=G22*1000*E8*(1-E15)"),  # 26
        ("CA alevins", "=E24*E9", "=F24*E9", "=G24*E9"),                                                          # 27
        ("CA aquacole total", "=E26+E27", "=F26+F27", "=G26+G27"),                                               # 28
        ("", None, None, None),                                                                                  # 29
        ("Aliment", "=E25*1000*E11", "=F25*1000*E11", "=G25*1000*E11"),                                          # 30
        ("Écloserie : coût variable des alevins produits", "=(E23+E24)*E14", "=(F23+F24)*E14", "=(G23+G24)*E14"),  # 31
        ("Glace, caisses, transport, intrants", "=E22*1000*E17", "=F22*1000*E17", "=G22*1000*E17"),             # 32
        ("Marge sur coûts variables (hors personnel, énergie et entretien)", "=E28-E30-E31-E32", "=F28-F30-F31-F32", "=G28-G30-G31-G32"),  # 33
        ("Coût variable par kg de poisson de table", "=(E30+E23*E14+E32)/MAX(1,E22*1000)",
         "=(F30+F23*E14+F32)/MAX(1,F22*1000)", "=(G30+G23*E14+G32)/MAX(1,G22*1000)"),                            # 34
    ]
    for i, (lib, a, b, c_) in enumerate(bil, start=22):
        po.cell(row=i, column=1, value=lib).border = BORD
        if a is None:
            continue
        for j, v in ((5, a), (6, b), (7, c_)):
            c = po.cell(row=i, column=j, value=(f"={v}" if isinstance(v, str) and not v.startswith("=") else v))
            c.fill, c.border = BLEU, BORD
            c.number_format = "#,##0.0" if i in (22, 25) else ("#,##0" if i in (23, 24) else ("0.00" if i == 34 else USD))
    po["A36"] = ("Le personnel aquacole (1 technicien et 1 à 2 ouvriers), l'énergie et l'entretien sont comptés dans l'onglet OPEX. "
                 "Le pilote ne vend pas d'alevins : il apprend la reproduction.")
    po["A37"] = ("Équilibre des nutriments (logiciel/outils/bilan_aquaponie.py) : 10 t/an de poisson consomment 11,5 t d'aliment ; "
                 "l'azote rendu disponible couvre environ 140 % des besoins de 2 000 m² de cultures (100 % si les pertes "
                 "par dénitrification atteignent 50 %), le phosphore 170 %, le potassium 23 % seulement : la potasse reste à acheter.")
    largeurs(po, [64, 11, 11, 11, 13, 15, 15])
    FISH = {"pil": "Poissons!$E$28", "t2": "Poissons!$F$28", "t3": "Poissons!$G$28"}

    # ------------------------------------------------------------------ CAPEX
    cp = wb.create_sheet("CAPEX")
    cp["A1"] = "Investissements (USD, rendu Lubumbashi, installation comprise)"
    cp["A1"].font = TITRE
    for j, e in enumerate(["Poste", "Phase", "Montant", "Durée amort. (ans)", "Amortissement annuel"], start=1):
        cp.cell(row=3, column=j, value=e)
    style_entete(cp, 3, 5)
    r0c = 4
    for i, (lib, ph, mt, du) in enumerate(CAPEX):
        r = r0c + i
        cp.cell(row=r, column=1, value=lib).border = BORD
        cp.cell(row=r, column=2, value=ph).border = BORD
        c = cp.cell(row=r, column=3, value=mt)
        c.fill, c.number_format, c.border = JAUNE, USD, BORD
        c = cp.cell(row=r, column=4, value=du)
        c.fill, c.border = JAUNE, BORD
        c = cp.cell(row=r, column=5, value=f"=C{r}/D{r}")
        c.fill, c.number_format, c.border = BLEU, USD, BORD
    rfc = r0c + len(CAPEX)
    tot = {}
    for k, (ph, lib) in enumerate(((1, "Total phase 1 (pilote 100 m² + pilote aquacole + infrastructures communes)"),
                                    (2, "Total phase 2 (tranche 2 : +900 m² et unité aquacole)"),
                                    (3, "Total phase 3 (tranche 3 : +1 000 m² et 2e module de grossissement)"))):
        r = rfc + 1 + k
        cp.cell(row=r, column=1, value=lib).font = GRAS
        cp.cell(row=r, column=3, value=f"=SUMIF(B{r0c}:B{rfc - 1},{ph},C{r0c}:C{rfc - 1})").number_format = USD
        cp.cell(row=r, column=5, value=f"=SUMIF(B{r0c}:B{rfc - 1},{ph},E{r0c}:E{rfc - 1})").number_format = USD
        tot[ph] = r
    r = rfc + 4
    cp.cell(row=r, column=1, value="Total projet").font = GRAS
    cp.cell(row=r, column=3, value=f"=C{tot[1]}+C{tot[2]}+C{tot[3]}").number_format = USD
    cp.cell(row=rfc + 5, column=1, value="dont aquaculture (pilote, écloserie, grossissement, bâtiment, énergie)")
    cp.cell(row=rfc + 5, column=3, value=f'=SUMIF(A{r0c}:A{rfc - 1},"*aquacole*",C{r0c}:C{rfc - 1})'
                                          f'+SUMIF(A{r0c}:A{rfc - 1},"Aquaculture*",C{r0c}:C{rfc - 1})'
                                          f'+SUMIF(A{r0c}:A{rfc - 1},"*grossissement module 2*",C{r0c}:C{rfc - 1})').number_format = USD
    for rr in range(rfc + 1, rfc + 6):
        cp.cell(row=rr, column=3).fill = BLEU
        cp.cell(row=rr, column=5).fill = BLEU
    cp.cell(row=rfc + 7, column=1, value="Les imprévus (10 %) sont calculés sur chaque phase. Les montants sont à confirmer par trois devis par lot.")
    largeurs(cp, [80, 8, 14, 12, 14])
    CAPX = {ph: f"CAPEX!$C${tot[ph]}" for ph in tot}
    AMORT = {ph: f"CAPEX!$E${tot[ph]}" for ph in tot}

    # ------------------------------------------------------------------ OPEX
    op = wb.create_sheet("OPEX")
    op["A1"] = "Charges d'exploitation annuelles en régime de croisière (USD)"
    op["A1"].font = TITRE
    for j, e in enumerate(["Poste", "Pilote seul", "Ferme 1 000 m² + aquaculture", "Ferme 2 000 m² + aquaculture"], start=1):
        op.cell(row=3, column=j, value=e)
    style_entete(op, 3, 4)
    r0o = 4
    for i, lig in enumerate(OPEX):
        r = r0o + i
        op.cell(row=r, column=1, value=lig[0]).border = BORD
        for j, v in ((2, lig[1]), (3, lig[2]), (4, lig[3])):
            c = op.cell(row=r, column=j, value=v)
            c.fill = BLEU if isinstance(v, str) else JAUNE
            c.number_format, c.border = USD, BORD
    rfo = r0o + len(OPEX)
    op.cell(row=rfo, column=1, value="TOTAL").font = GRAS
    for col in ("B", "C", "D"):
        c = op[f"{col}{rfo}"]
        c.value = f"=SUM({col}{r0o}:{col}{rfo - 1})"
        c.font, c.fill, c.number_format = GRAS, BLEU, USD
    op.cell(row=rfo + 2, column=1, value="Pilote : 1 ouvrier-technicien à 230 $/mois ; le porteur de projet assure la gestion et l'aquaculture sans salaire.")
    op.cell(row=rfo + 3, column=1, value="Ferme 1 000 m² : chef de culture 500 $, 3 ouvriers 180 $, gardien 180 $ ; aquaculture : technicien 450 $, ouvrier 180 $ (par mois).")
    op.cell(row=rfo + 4, column=1, value="Ferme 2 000 m² : chef de culture 600 $, 6 ouvriers, assistant commercial-livreur 250 $, 2 gardiens ; aquaculture : technicien 450 $, 2 ouvriers.")
    op.cell(row=rfo + 5, column=1, value="Les lignes « Aquaculture » sont toutes les charges propres aux poissons : les mettre à 0 donne la ferme sans aquaculture.")
    largeurs(op, [66, 14, 20, 20])
    OPX = {"pil": f"OPEX!$B${rfo}", "t2": f"OPEX!$C${rfo}", "t3": f"OPEX!$D${rfo}"}

    # ------------------------------------------------------------------ Résultats
    rs = wb.create_sheet("Resultats")
    rs["A1"] = "Compte de résultat et trésorerie du projet (pilote, puis 1 000 m², puis 2 000 m²)"
    rs["A1"].font = TITRE
    rs.cell(row=3, column=1, value="Année")
    for a in range(ANNEES + 1):
        rs.cell(row=3, column=2 + a, value=a)
    style_entete(rs, 3, ANNEES + 2)
    libelles = [
        "Montée en charge pilote", "Montée en charge tranche 2", "Montée en charge tranche 3",
        "CA brut légumes", "Pertes et invendus légumes", "CA aquacole net", "CA net total",
        "Charges d'exploitation", "EBE (excédent brut d'exploitation)", "Amortissements", "Résultat avant impôt",
        "Impôt", "Résultat net", "Investissements", "Valeur résiduelle", "Flux de trésorerie", "Trésorerie cumulée",
    ]
    L = {lib: 4 + i for i, lib in enumerate(libelles)}
    for lib, r in L.items():
        rs.cell(row=r, column=1, value=lib).border = BORD
    EBE = "EBE (excédent brut d'exploitation)"

    def rampe(age):
        return f"IF({age}<=0,0,IF({age}=1,{H_EXT1},IF({age}=2,{H_EXT2},{H_EXT3})))"
    for a in range(ANNEES + 1):
        col = get_column_letter(2 + a)

        def f(lib):
            return f"{col}{L[lib]}"
        if a == 0:
            formules = {lib: 0 for lib in libelles}
            formules["Investissements"] = f"={CAPX[1]}"
            formules["Flux de trésorerie"] = f"=-{f('Investissements')}"
            formules["Trésorerie cumulée"] = f"={f('Flux de trésorerie')}"
        else:
            prev = get_column_letter(1 + a)
            age2, age3 = f"({a}-{H_AN2})", f"({a}-{H_AN3})"
            r2, r3 = f("Montée en charge tranche 2"), f("Montée en charge tranche 3")
            formules = {
                "Montée en charge pilote": f"=IF({a}=1,{H_RAMP1},{H_RAMP2})",
                "Montée en charge tranche 2": f"={rampe(age2)}",
                "Montée en charge tranche 3": f"={rampe(age3)}",
                "CA brut légumes": f"={CA_PIL}*{f('Montée en charge pilote')}+{CA_T2}*{r2}+{CA_T3}*{r3}",
                "Pertes et invendus légumes": f"=-{f('CA brut légumes')}*{H_PERTES}",
                # aquaculture : le pilote produit à partir de l'année 1 ; chaque tranche ajoute sa part en montant en charge
                "CA aquacole net": f"=IF({age2}<=0,{FISH['pil']}*{f('Montée en charge pilote')},"
                                   f"{FISH['t2']}*{r2}+({FISH['t3']}-{FISH['t2']})*{r3})",
                "CA net total": f"={f('CA brut légumes')}+{f('Pertes et invendus légumes')}+{f('CA aquacole net')}",
                # charges : niveau pilote, puis niveau 1 000 m², puis niveau 2 000 m², avec une part variable (40 %) qui suit la montée en charge
                "Charges d'exploitation": f"=-IF({age2}<=0,{OPX['pil']},"
                                          f"IF({age3}<=0,{OPX['pil']}+({OPX['t2']}-{OPX['pil']})*(0.6+0.4*{r2}),"
                                          f"{OPX['t2']}+({OPX['t3']}-{OPX['t2']})*(0.6+0.4*{r3})))",
                EBE: f"={f('CA net total')}+{f('Charges d\'exploitation')}",
                "Amortissements": f"=-({AMORT[1]}+IF({a}>{H_AN2},{AMORT[2]},0)+IF({a}>{H_AN3},{AMORT[3]},0))",
                "Résultat avant impôt": f"={f(EBE)}+{f('Amortissements')}",
                "Impôt": f"=-MAX({f('Résultat avant impôt')}*{H_IMPOT},{f('CA net total')}*{H_IMPMIN})",
                "Résultat net": f"={f('Résultat avant impôt')}+{f('Impôt')}",
                "Investissements": f"=IF({a}={H_AN2},{CAPX[2]},0)+IF({a}={H_AN3},{CAPX[3]},0)",
                "Valeur résiduelle": f"=IF({a}={ANNEES},({CAPX[1]}+IF({H_AN2}<={ANNEES},{CAPX[2]},0)+IF({H_AN3}<={ANNEES},{CAPX[3]},0))*{H_RESID},0)",
                "Flux de trésorerie": f"={f(EBE)}+{f('Impôt')}-{f('Investissements')}+{f('Valeur résiduelle')}",
                "Trésorerie cumulée": f"={prev}{L['Trésorerie cumulée']}+{f('Flux de trésorerie')}",
            }
        for lib, val in formules.items():
            c = rs[f"{col}{L[lib]}"]
            c.value = val
            c.border = BORD
            c.fill = BLEU
            c.number_format = PCT if "Montée" in lib else USD
    last = get_column_letter(2 + ANNEES)
    fl, tc = L["Flux de trésorerie"], L["Trésorerie cumulée"]
    rb = tc + 2
    sorties = [
        ("VAN au taux d'actualisation", f"=B{fl}+NPV({H_ACTU},C{fl}:{last}{fl})", USD),
        ("TRI sur 10 ans", f"=IFERROR(IRR(B{fl}:{last}{fl}),\"négatif\")", "0.0%"),
        ("Année de retour à une trésorerie cumulée positive",
         f"=IFERROR(INDEX(B3:{last}3,MATCH(TRUE,INDEX(B{tc}:{last}{tc}>0,0),0)),\"au-delà de 10 ans\")", "0"),
        ("EBE de croisière (année 8)", f"=J{L[EBE]}", USD),
        ("Besoin de financement maximal (creux de trésorerie)", f"=-MIN(B{tc}:{last}{tc})", USD),
        ("CA net de croisière (année 8)", f"=J{L['CA net total']}", USD),
        ("dont aquaculture", f"=J{L['CA aquacole net']}", USD),
        ("EBE à 1 000 m² (année 4, tranche 2 en croisière si construite en année 2)", f"=F{L[EBE]}", USD),
    ]
    for k, (lib, form, fmt) in enumerate(sorties):
        rs.cell(row=rb + k, column=1, value=lib).font = GRAS
        c = rs.cell(row=rb + k, column=2, value=form)
        c.number_format, c.fill, c.font = fmt, VERT, GRAS
    largeurs(rs, [52] + [12] * (ANNEES + 1))

    # ------------------------------------------------------------------ Pilote seul
    ps = wb.create_sheet("Pilote_seul")
    ps["A1"] = "Si l'on s'arrête au pilote (100 m² de serre et 6 m³ de bacs)"
    ps["A1"].font = TITRE
    ps.cell(row=3, column=1, value="Année")
    for a in range(6):
        ps.cell(row=3, column=2 + a, value=a)
    style_entete(ps, 3, 7)
    lp = ["CA net", "Charges d'exploitation", "EBE", "Flux de trésorerie (avant impôt)", "Trésorerie cumulée"]
    for i, lib in enumerate(lp):
        ps.cell(row=4 + i, column=1, value=lib).border = BORD
    for a in range(6):
        col = get_column_letter(2 + a)
        prev = get_column_letter(1 + a)
        if a == 0:
            vals = [0, 0, 0, f"=-{CAPX[1]}", f"={col}7"]
        else:
            ramp = H_RAMP1 if a == 1 else H_RAMP2
            vals = [f"={CA_PIL}*{ramp}*(1-{H_PERTES})+{FISH['pil']}*{ramp}", f"=-{OPX['pil']}", f"={col}4+{col}5",
                    f"={col}6" + (f"+{CAPX[1]}*{H_RESID}" if a == 5 else ""), f"={prev}8+{col}7"]
        for i, v in enumerate(vals):
            c = ps.cell(row=4 + i, column=2 + a, value=v)
            c.number_format, c.fill, c.border = USD, BLEU, BORD
    ps["A10"] = "Perte maximale si abandon après 2 ans (revente du matériel à 35 %)"
    ps["A10"].font = GRAS
    ps["B10"] = f"=-(D8+{CAPX[1]}*0.35)"
    ps["B10"].number_format, ps["B10"].fill = USD, VERT
    ps["A11"] = "EBE du pilote si le porteur assure lui-même le travail (sans salarié)"
    ps["B11"] = "=D6+OPEX!B4+OPEX!B5"
    ps["B11"].number_format, ps["B11"].fill = USD, VERT
    ps["A13"] = ("Lecture : le pilote est un outil d'apprentissage (culture, reproduction et grossissement du Clarias, couplage) "
                 "et de preuve commerciale ; sa rentabilité se juge au niveau de la ferme complète.")
    largeurs(ps, [62, 12, 12, 12, 12, 12, 12])

    # ------------------------------------------------------------------ Sensibilité
    se = wb.create_sheet("Sensibilite")
    se["A1"] = "EBE de croisière de la ferme de 2 000 m² selon les écarts de prix (lignes) et de rendement (colonnes) des légumes"
    se["A1"].font = TITRE
    se["A2"] = ("Base : scénario actif. L'aquaculture est comptée à son niveau du scénario actif. "
                "Charges : la part emballages, livraison et intrants suit le volume de légumes (environ 30 % des charges hors aquaculture).")
    ecarts = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]
    se.cell(row=4, column=1, value="Prix \\ Rendement")
    for j, e in enumerate(ecarts):
        c = se.cell(row=4, column=2 + j, value=e)
        c.number_format, c.font, c.fill = "+0%;-0%;0%", GRAS, GRIS
    ca_leg = f"(({CA_PIL}*{H_RAMP2}+{CA_T2}+{CA_T3})*(1-{H_PERTES}))"
    opx_aq = "(OPEX!$D$5+OPEX!$D$5*Hypotheses!$B$8+OPEX!$D$9+OPEX!$D$22+OPEX!$D$23+OPEX!$D$24+OPEX!$D$25)"
    for i, ep in enumerate(ecarts):
        r = 5 + i
        c = se.cell(row=r, column=1, value=ep)
        c.number_format, c.font, c.fill = "+0%;-0%;0%", GRAS, GRIS
        for j in range(len(ecarts)):
            col = get_column_letter(2 + j)
            formule = (f"={ca_leg}*(1+$A{r})*(1+{col}$4)+{FISH['t3']}-{opx_aq}"
                       f"-({OPX['t3']}-{opx_aq})*(0.7+0.3*(1+{col}$4))")
            c = se.cell(row=r, column=2 + j, value=formule)
            c.number_format, c.border = USD, BORD
    se["A13"] = "Prix moyen minimal des légumes pour un EBE nul (en % des prix du scénario actif)"
    se["B13"] = f"=({OPX['t3']}-{FISH['t3']})/{ca_leg}"
    se["B13"].number_format, se["B13"].fill = PCT, VERT
    se["A15"] = "EBE de croisière selon le prix du poisson de table (lignes) et le nombre d'alevins vendus (colonnes)"
    se["A15"].font = GRAS
    alev = [0, 30000, 60000, 90000, 120000, 150000]
    prixp = [2.4, 2.8, 3.3, 3.8, 4.3]
    se.cell(row=16, column=1, value="Prix $/kg \\ alevins vendus")
    for j, v in enumerate(alev):
        c = se.cell(row=16, column=2 + j, value=v)
        c.number_format, c.font, c.fill = "#,##0", GRAS, GRIS
    base_ebe = f"({ca_leg}+{FISH['t3']}-{OPX['t3']})"
    for i, pv in enumerate(prixp):
        r = 17 + i
        c = se.cell(row=r, column=1, value=pv)
        c.number_format, c.font, c.fill = "0.00", GRAS, GRIS
        for j in range(len(alev)):
            col = get_column_letter(2 + j)
            formule = (f"={base_ebe}+Poissons!$G$22*1000*(1-Poissons!$E$15)*($A{r}-Poissons!$E$8)"
                       f"+({col}$16-Poissons!$E$7)*(Poissons!$E$9-Poissons!$E$14)")
            c = se.cell(row=r, column=2 + j, value=formule)
            c.number_format, c.border = USD, BORD
    largeurs(se, [34] + [12] * 7)

    return wb


if __name__ == "__main__":
    wb = construire()
    wb.calculation.fullCalcOnLoad = True
    wb.properties.creator = "Projet serre Lubumbashi"
    wb.properties.title = "Modèle financier de la ferme intégrée serres et aquaculture de Lubumbashi"
    wb.save(SORTIE)
    print(f"Classeur écrit : {SORTIE}")
