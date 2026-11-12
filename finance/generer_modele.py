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
    ("Tomate ronde / grappe", "Fruits", "kg", 15, 100, (18, 25, 32), (1.3, 1.8, 2.4)),
    ("Tomate cerise", "Fruits", "kg", 10, 80, (10, 14, 18), (3.0, 4.0, 5.0)),
    ("Poivron de couleur", "Fruits", "kg", 15, 110, (8, 12, 16), (3.0, 4.0, 5.5)),
    ("Piment fort", "Fruits", "kg", 10, 60, (3, 5, 7), (3.5, 5.0, 7.0)),
    ("Laitue (têtes)", "Feuilles", "tête", 8, 110, (150, 200, 240), (0.7, 1.0, 1.3)),
    ("Chou de Chine / pak-choï", "Feuilles", "kg", 5, 50, (30, 40, 50), (2.0, 2.5, 3.0)),
    ("Épinard", "Feuilles", "kg", 4, 35, (18, 25, 30), (2.5, 3.5, 4.5)),
    ("Céleri", "Feuilles", "kg", 4, 35, (22, 30, 36), (2.5, 3.5, 4.5)),
    ("Aromatiques (basilic, coriandre, persil)", "Feuilles", "kg", 3, 50, (10, 15, 20), (6.0, 8.0, 10.0)),
    ("Oignon vert (cébette)", "Feuilles", "kg", 3, 30, (20, 28, 34), (2.0, 3.0, 4.0)),
    ("Poireau", "Feuilles", "kg", 3, 30, (18, 25, 30), (2.0, 3.0, 4.0)),
    ("Amarante", "Feuilles", "kg", 3.6, 40, (22, 30, 36), (0.8, 1.2, 1.6)),
    ("Chou pommé (essai)", "Essai", "kg", 0, 0, (6, 8, 10), (0.8, 1.0, 1.3)),
    ("Oignon bulbe (essai)", "Essai", "kg", 0, 0, (3, 4, 5), (1.0, 1.4, 1.8)),
    ("Ail (essai)", "Essai", "kg", 0, 0, (0.8, 1.2, 1.5), (4.0, 6.0, 8.0)),
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
]

# libellé, pilote seul (USD/an), ferme complète 1 000 m² (USD/an)
OPEX = [
    ("Personnel (salaires bruts, hors charges)", 2760, 14640),
    ("Charges sociales employeur", "=B4*Hypotheses!$B$8", "=C4*Hypotheses!$B$8"),
    ("Semences et jeunes plants", 300, 2800),
    ("Engrais hydroponiques et acide", 350, 3200),
    ("Substrat, éponges, godets", 250, 1800),
    ("Protection biologique, pièges, phéromones", 150, 1200),
    ("Emballages", 300, 4500),
    ("Analyses de laboratoire (eau, solution, métaux)", 300, 800),
    ("Énergie d'appoint (SNEL, carburant)", 250, 2500),
    ("Eau d'appoint et entretien forage", 100, 400),
    ("Maintenance et pièces de rechange", 900, 3500),
    ("Livraison (carburant, entretien véhicule)", 480, 3000),
    ("Télécom et abonnements", 240, 500),
    ("Gardiennage et assurance", 600, 2400),
    ("Administration, comptabilité, taxes locales", 300, 1500),
    ("Commercialisation", 100, 800),
]

for _ph in (1, 2):
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
        ("Modèle financier : serre pilote de Lubumbashi puis extension à 1 000 m²", TITRE),
        ("", None),
        ("Cellules jaunes : hypothèses à modifier. Cellules bleues : résultats calculés.", None),
        ("Tous les montants sont en dollars américains constants (hors inflation), rendu Lubumbashi.", None),
        ("Choisir le scénario dans Hypotheses!B4 : 1 = prudent, 2 = médian, 3 = optimiste.", None),
        ("", None),
        ("Structure :", GRAS),
        ("  Hypotheses : paramètres généraux, montée en charge, fiscalité", None),
        ("  Cultures : surfaces, rendements et prix par culture et par scénario", None),
        ("  CAPEX : investissements par phase et amortissements", None),
        ("  OPEX : charges d'exploitation, pilote seul et ferme complète", None),
        ("  Resultats : compte de résultat et trésorerie sur 10 ans, VAN, TRI", None),
        ("  Pilote_seul : ce que donne la serre de 100 m² si l'on s'arrête là", None),
        ("  Sensibilite : EBE de croisière selon les écarts de prix et de rendement", None),
        ("", None),
        ("Les prix sont des prix de vente départ ferme aux clients professionnels (supermarchés,", None),
        ("hôtels, restaurants, cantines minières). Ils doivent être confirmés par l'enquête de prix", None),
        ("prévue en phase 0 (voir docs/14_feuille_de_route.md).", None),
    ]
    for i, (txt, f) in enumerate(lignes, start=1):
        c = ws.cell(row=i, column=1, value=txt)
        if f:
            c.font = f
    ws.column_dimensions["A"].width = 100

    # ------------------------------------------------------------------ Hypothèses
    h = wb.create_sheet("Hypotheses")
    h["A1"] = "Hypothèses générales"
    h["A1"].font = TITRE
    params = [
        ("Taux de change indicatif (CDF pour 1 USD, BCC fin oct. 2026)", 2265, "0"),
        ("Scénario actif (1 prudent, 2 médian, 3 optimiste)", 2, "0"),
        ("Pertes et invendus - prudent", 0.12, PCT),
        ("Pertes et invendus - médian", 0.08, PCT),
        ("Pertes et invendus - optimiste", 0.05, PCT),
        ("Charges sociales employeur (CNSS, INPP, ONEM)", 0.15, PCT),
        ("Taux d'actualisation", 0.12, PCT),
        ("Impôt sur les bénéfices", 0.30, PCT),
        ("Impôt minimum (% du chiffre d'affaires)", 0.01, PCT),
        ("Montée en charge pilote année 1", 0.55, PCT),
        ("Montée en charge pilote année 2 et suivantes", 0.90, PCT),
        ("Année de construction de l'extension", 2, "0"),
        ("Montée en charge extension 1re année", 0.70, PCT),
        ("Montée en charge extension 2e année", 0.90, PCT),
        ("Montée en charge extension croisière", 1.00, PCT),
        ("Part des ventes en direct (paniers, particuliers)", 0.0, PCT),
        ("Majoration de prix des ventes directes", 0.35, PCT),
        ("Valeur résiduelle des équipements en fin d'année 10 (% CAPEX)", 0.20, PCT),
    ]
    for i, (lib, val, fmt) in enumerate(params, start=3):
        h.cell(row=i, column=1, value=lib)
        c = h.cell(row=i, column=2, value=val)
        c.fill = JAUNE
        c.number_format = fmt
        c.border = BORD
    # B3 change, B4 scénario, B5-7 pertes, B8 charges sociales... on recale :
    # lignes : 3 change, 4 scénario, 5 pertes P, 6 pertes M, 7 pertes O, 8 charges, 9 actualisation...
    # => on décale pour garder des références lisibles
    h["A22"] = "Pertes du scénario actif"
    h["B22"] = "=CHOOSE($B$4,B5,B6,B7)"
    h["B22"].number_format = PCT
    h["B22"].fill = BLEU
    h["A23"] = "Coefficient de prix moyen (ventes directes incluses)"
    h["B23"] = "=1+B18*B19"
    h["B23"].number_format = "0.00"
    h["B23"].fill = BLEU
    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="3")
    h.add_data_validation(dv)
    dv.add("B4")
    largeurs(h, [70, 14])

    # Correspondances utilisées dans les formules
    H_SCEN = "Hypotheses!$B$4"
    H_CHARGES = "Hypotheses!$B$8"
    H_ACTU = "Hypotheses!$B$9"
    H_IMPOT = "Hypotheses!$B$10"
    H_IMPMIN = "Hypotheses!$B$11"
    H_RAMP1 = "Hypotheses!$B$12"
    H_RAMP2 = "Hypotheses!$B$13"
    H_AN_EXT = "Hypotheses!$B$14"
    H_EXT1, H_EXT2, H_EXT3 = "Hypotheses!$B$15", "Hypotheses!$B$16", "Hypotheses!$B$17"
    H_RESID = "Hypotheses!$B$20"
    H_PERTES = "Hypotheses!$B$22"
    H_COEF = "Hypotheses!$B$23"

    # ------------------------------------------------------------------ Cultures
    cu = wb.create_sheet("Cultures")
    cu["A1"] = "Surfaces, rendements et prix"
    cu["A1"].font = TITRE
    ent = ["Culture", "Compartiment", "Unité", "Surface pilote (m²)", "Surface extension (m²)",
           "Rdt prudent /m²/an", "Rdt médian /m²/an", "Rdt optimiste /m²/an",
           "Prix prudent $/u", "Prix médian $/u", "Prix optimiste $/u",
           "Rdt actif", "Prix actif", "Volume pilote", "CA brut pilote", "Volume extension", "CA brut extension"]
    for j, e in enumerate(ent, start=1):
        cu.cell(row=3, column=j, value=e)
    style_entete(cu, 3, len(ent))
    r0 = 4
    for i, (nom, comp, unite, sp, se, rdt, prix) in enumerate(CULTURES):
        r = r0 + i
        vals = [nom, comp, unite, sp, se, *rdt, *prix]
        for j, v in enumerate(vals, start=1):
            c = cu.cell(row=r, column=j, value=v)
            if j >= 4:
                c.fill = JAUNE
            c.border = BORD
        cu.cell(row=r, column=12, value=f"=CHOOSE({H_SCEN},F{r},G{r},H{r})")
        cu.cell(row=r, column=13, value=f"=CHOOSE({H_SCEN},I{r},J{r},K{r})")
        cu.cell(row=r, column=14, value=f"=D{r}*L{r}")
        cu.cell(row=r, column=15, value=f"=N{r}*M{r}*{H_COEF}")
        cu.cell(row=r, column=16, value=f"=E{r}*L{r}")
        cu.cell(row=r, column=17, value=f"=P{r}*M{r}*{H_COEF}")
        for j in range(12, 18):
            c = cu.cell(row=r, column=j)
            c.fill = BLEU
            c.border = BORD
            c.number_format = USD if j in (15, 17) else "#,##0.0"
    rf = r0 + len(CULTURES)
    cu.cell(row=rf, column=1, value="TOTAL").font = GRAS
    for col in ("D", "E", "O", "Q"):
        c = cu[f"{col}{rf}"]
        c.value = f"=SUM({col}{r0}:{col}{rf - 1})"
        c.font = GRAS
        c.fill = BLEU
        c.number_format = USD if col in ("O", "Q") else "#,##0.0"
    cu.cell(row=rf + 2, column=1, value="CA brut par m² cultivé - pilote")
    cu.cell(row=rf + 2, column=4, value=f"=O{rf}/100").number_format = USD
    cu.cell(row=rf + 3, column=1, value="CA brut par m² de serre - extension (900 m²)")
    cu.cell(row=rf + 3, column=4, value=f"=Q{rf}/900").number_format = USD
    cu.cell(row=rf + 5, column=1, value="Remarque : surfaces feuilles = surfaces de radeaux (environ 67 % du compartiment). "
                                         "Les lignes 'essai' n'ont pas de surface commerciale.")
    largeurs(cu, [38, 12, 7, 11, 11, 10, 10, 10, 10, 10, 10, 9, 9, 11, 13, 11, 13])
    CA_PILOTE = f"Cultures!$O${rf}"
    CA_EXT = f"Cultures!$Q${rf}"

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
    rng = f"{r0c}:{rfc - 1}"
    cp.cell(row=rfc + 1, column=1, value="Total phase 1 (pilote 100 m² + annexe)").font = GRAS
    cp.cell(row=rfc + 1, column=3, value=f"=SUMIF(B{r0c}:B{rfc - 1},1,C{r0c}:C{rfc - 1})").number_format = USD
    cp.cell(row=rfc + 1, column=5, value=f"=SUMIF(B{r0c}:B{rfc - 1},1,E{r0c}:E{rfc - 1})").number_format = USD
    cp.cell(row=rfc + 2, column=1, value="Total phase 2 (extension 900 m²)").font = GRAS
    cp.cell(row=rfc + 2, column=3, value=f"=SUMIF(B{r0c}:B{rfc - 1},2,C{r0c}:C{rfc - 1})").number_format = USD
    cp.cell(row=rfc + 2, column=5, value=f"=SUMIF(B{r0c}:B{rfc - 1},2,E{r0c}:E{rfc - 1})").number_format = USD
    cp.cell(row=rfc + 3, column=1, value="Total projet").font = GRAS
    cp.cell(row=rfc + 3, column=3, value=f"=C{rfc + 1}+C{rfc + 2}").number_format = USD
    cp.cell(row=rfc + 4, column=1, value="Coût par m² de serre, phase 1")
    cp.cell(row=rfc + 4, column=3, value=f"=C{rfc + 1}/100").number_format = USD
    cp.cell(row=rfc + 5, column=1, value="Coût par m² de serre, phase 2")
    cp.cell(row=rfc + 5, column=3, value=f"=C{rfc + 2}/900").number_format = USD
    for rr in range(rfc + 1, rfc + 6):
        cp.cell(row=rr, column=3).fill = BLEU
        cp.cell(row=rr, column=5).fill = BLEU
    cp.cell(row=rfc + 7, column=1, value="Variante 'vitrine R&D' (configuration complète décrite dans les documents techniques) : "
                                          "environ 105 000 $ pour la phase 1. Non retenue dans ce plan de financement.")
    largeurs(cp, [70, 8, 14, 12, 14])
    CAPEX1 = f"CAPEX!$C${rfc + 1}"
    CAPEX2 = f"CAPEX!$C${rfc + 2}"
    AMORT1 = f"CAPEX!$E${rfc + 1}"
    AMORT2 = f"CAPEX!$E${rfc + 2}"

    # ------------------------------------------------------------------ OPEX
    op = wb.create_sheet("OPEX")
    op["A1"] = "Charges d'exploitation annuelles en régime de croisière (USD)"
    op["A1"].font = TITRE
    for j, e in enumerate(["Poste", "Pilote seul (100 m²)", "Ferme complète (1 000 m²)"], start=1):
        op.cell(row=3, column=j, value=e)
    style_entete(op, 3, 3)
    r0o = 4
    for i, (lib, vp, vf) in enumerate(OPEX):
        r = r0o + i
        op.cell(row=r, column=1, value=lib).border = BORD
        for j, v in ((2, vp), (3, vf)):
            if isinstance(v, str):
                c = op.cell(row=r, column=j, value=v)
                c.fill = BLEU
            else:
                c = op.cell(row=r, column=j, value=v)
                c.fill = JAUNE
            c.number_format, c.border = USD, BORD
    rfo = r0o + len(OPEX)
    op.cell(row=rfo, column=1, value="TOTAL").font = GRAS
    for col in ("B", "C"):
        c = op[f"{col}{rfo}"]
        c.value = f"=SUM({col}{r0o}:{col}{rfo - 1})"
        c.font, c.fill, c.number_format = GRAS, BLEU, USD
    op.cell(row=rfo + 2, column=1, value="Effectif pilote : 1 ouvrier-technicien à 230 $/mois ; le porteur de projet assure la gestion sans salaire.")
    op.cell(row=rfo + 3, column=1, value="Effectif ferme complète : 1 chef de culture (500 $/mois), 3 ouvriers (180 $/mois), 1 gardien (180 $/mois) inclus au poste personnel.")
    largeurs(op, [60, 18, 22])
    OPEX_P = f"OPEX!$B${rfo}"
    OPEX_F = f"OPEX!$C${rfo}"

    # ------------------------------------------------------------------ Résultats
    rs = wb.create_sheet("Resultats")
    rs["A1"] = "Compte de résultat et trésorerie du projet (pilote puis extension)"
    rs["A1"].font = TITRE
    rs.cell(row=3, column=1, value="Année")
    for a in range(ANNEES + 1):
        rs.cell(row=3, column=2 + a, value=a)
    style_entete(rs, 3, ANNEES + 2)
    libelles = [
        "Montée en charge pilote", "Montée en charge extension", "CA brut", "Pertes et invendus", "CA net",
        "Charges d'exploitation", "EBE (excédent brut d'exploitation)", "Amortissements", "Résultat avant impôt",
        "Impôt", "Résultat net", "Investissements", "Valeur résiduelle", "Flux de trésorerie", "Trésorerie cumulée",
    ]
    L = {lib: 4 + i for i, lib in enumerate(libelles)}
    for lib, r in L.items():
        rs.cell(row=r, column=1, value=lib).border = BORD
    for a in range(ANNEES + 1):
        col = get_column_letter(2 + a)
        def f(lib):
            return f"{col}{L[lib]}"
        if a == 0:
            formules = {
                "Montée en charge pilote": 0, "Montée en charge extension": 0, "CA brut": 0,
                "Pertes et invendus": 0, "CA net": 0, "Charges d'exploitation": 0,
                "EBE (excédent brut d'exploitation)": 0, "Amortissements": 0, "Résultat avant impôt": 0,
                "Impôt": 0, "Résultat net": 0, "Investissements": f"={CAPEX1}", "Valeur résiduelle": 0,
                "Flux de trésorerie": f"=-{f('Investissements')}", "Trésorerie cumulée": f"={f('Flux de trésorerie')}",
            }
        else:
            prev = get_column_letter(1 + a)
            ext_age = f"({a}-{H_AN_EXT})"
            formules = {
                "Montée en charge pilote": f"=IF({a}=1,{H_RAMP1},{H_RAMP2})",
                "Montée en charge extension": f"=IF({ext_age}<=0,0,IF({ext_age}=1,{H_EXT1},IF({ext_age}=2,{H_EXT2},{H_EXT3})))",
                "CA brut": f"={CA_PILOTE}*{f('Montée en charge pilote')}+{CA_EXT}*{f('Montée en charge extension')}",
                "Pertes et invendus": f"=-{f('CA brut')}*{H_PERTES}",
                "CA net": f"={f('CA brut')}+{f('Pertes et invendus')}",
                # Les charges passent du niveau pilote au niveau ferme complète à la mise en route de l'extension,
                # avec une part variable liée au chiffre d'affaires réalisé.
                "Charges d'exploitation": f"=-IF({ext_age}<=0,{OPEX_P},{OPEX_P}+({OPEX_F}-{OPEX_P})*(0.6+0.4*{f('Montée en charge extension')}))",
                "EBE (excédent brut d'exploitation)": f"={f('CA net')}+{f('Charges d\'exploitation')}",
                "Amortissements": f"=-({AMORT1}+IF({a}>{H_AN_EXT},{AMORT2},0))",
                "Résultat avant impôt": f"={f('EBE (excédent brut d\'exploitation)')}+{f('Amortissements')}",
                "Impôt": f"=-MAX({f('Résultat avant impôt')}*{H_IMPOT},{f('CA net')}*{H_IMPMIN})",
                "Résultat net": f"={f('Résultat avant impôt')}+{f('Impôt')}",
                "Investissements": f"=IF({a}={H_AN_EXT},{CAPEX2},0)",
                "Valeur résiduelle": f"=IF({a}={ANNEES},({CAPEX1}+{CAPEX2})*{H_RESID},0)",
                "Flux de trésorerie": f"={f('EBE (excédent brut d\'exploitation)')}+{f('Impôt')}-{f('Investissements')}+{f('Valeur résiduelle')}",
                "Trésorerie cumulée": f"={prev}{L['Trésorerie cumulée']}+{f('Flux de trésorerie')}",
            }
        for lib, val in formules.items():
            c = rs[f"{col}{L[lib]}"]
            c.value = val
            c.border = BORD
            c.fill = BLEU
            c.number_format = PCT if "Montée" in lib else USD
    last = get_column_letter(2 + ANNEES)
    rb = L["Trésorerie cumulée"] + 2
    rs.cell(row=rb, column=1, value="VAN au taux d'actualisation").font = GRAS
    rs.cell(row=rb, column=2, value=f"=B{L['Flux de trésorerie']}+NPV({H_ACTU},C{L['Flux de trésorerie']}:{last}{L['Flux de trésorerie']})")
    rs.cell(row=rb + 1, column=1, value="TRI sur 10 ans").font = GRAS
    rs.cell(row=rb + 1, column=2, value=f"=IFERROR(IRR(B{L['Flux de trésorerie']}:{last}{L['Flux de trésorerie']}),\"négatif\")")
    rs.cell(row=rb + 2, column=1, value="Année de retour à une trésorerie cumulée positive").font = GRAS
    tc = L["Trésorerie cumulée"]
    rs.cell(row=rb + 2, column=2, value=f"=IFERROR(INDEX(B3:{last}3,MATCH(TRUE,INDEX(B{tc}:{last}{tc}>0,0),0)),\"au-delà de 10 ans\")")
    rs.cell(row=rb + 3, column=1, value="EBE de croisière (année 6)").font = GRAS
    rs.cell(row=rb + 3, column=2, value=f"=H{L['EBE (excédent brut d\'exploitation)']}")
    rs.cell(row=rb + 4, column=1, value="Besoin de financement maximal (creux de trésorerie)").font = GRAS
    rs.cell(row=rb + 4, column=2, value=f"=-MIN(B{tc}:{last}{tc})")
    for rr, fmt in ((rb, USD), (rb + 1, "0.0%"), (rb + 2, "0"), (rb + 3, USD), (rb + 4, USD)):
        c = rs.cell(row=rr, column=2)
        c.number_format, c.fill, c.font = fmt, VERT, GRAS
    largeurs(rs, [48] + [12] * (ANNEES + 1))

    # ------------------------------------------------------------------ Pilote seul
    ps = wb.create_sheet("Pilote_seul")
    ps["A1"] = "Si l'on s'arrête au pilote de 100 m²"
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
            vals = [0, 0, 0, f"=-{CAPEX1}", f"={col}7"]
        else:
            ramp = H_RAMP1 if a == 1 else H_RAMP2
            vals = [f"={CA_PILOTE}*{ramp}*(1-{H_PERTES})", f"=-{OPEX_P}", f"={col}4+{col}5",
                    f"={col}6" + (f"+{CAPEX1}*{H_RESID}" if a == 5 else ""), f"={prev}8+{col}7"]
        for i, v in enumerate(vals):
            c = ps.cell(row=4 + i, column=2 + a, value=v)
            c.number_format, c.fill, c.border = USD, BLEU, BORD
    ps["A10"] = "Perte maximale si abandon après 2 ans (revente du matériel à 35 %)"
    ps["A10"].font = GRAS
    ps["B10"] = f"=-(D8+{CAPEX1}*0.35)"
    ps["B10"].number_format, ps["B10"].fill = USD, VERT
    ps["A11"] = "EBE du pilote si le porteur assure lui-même le travail (sans salarié)"
    ps["B11"] = f"=D6+OPEX!B4+OPEX!B5"
    ps["B11"].number_format, ps["B11"].fill = USD, VERT
    ps["A13"] = ("Lecture : à 100 m², le chiffre d'affaires ne peut pas porter à la fois un salaire et les frais fixes. "
                 "Le pilote est un outil d'apprentissage et de preuve commerciale ; sa rentabilité se juge au niveau de la ferme complète.")
    largeurs(ps, [60, 12, 12, 12, 12, 12, 12])

    # ------------------------------------------------------------------ Sensibilité
    se = wb.create_sheet("Sensibilite")
    se["A1"] = "EBE de croisière de la ferme complète selon les écarts de prix (lignes) et de rendement (colonnes)"
    se["A1"].font = TITRE
    se["A2"] = "Base : scénario actif, année 6. Charges : la part emballages/livraison/intrants suit le volume (environ 30 %)."
    ecarts = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]
    se.cell(row=4, column=1, value="Prix \\ Rendement")
    for j, e in enumerate(ecarts):
        c = se.cell(row=4, column=2 + j, value=e)
        c.number_format, c.font, c.fill = "+0%;-0%;0%", GRAS, GRIS
    for i, ep in enumerate(ecarts):
        r = 5 + i
        c = se.cell(row=r, column=1, value=ep)
        c.number_format, c.font, c.fill = "+0%;-0%;0%", GRAS, GRIS
        for j in range(len(ecarts)):
            col = get_column_letter(2 + j)
            ca = f"(({CA_PILOTE}*{H_RAMP2}+{CA_EXT})*(1-{H_PERTES}))"
            formule = f"={ca}*(1+$A{r})*(1+{col}$4)-{OPEX_F}*(0.7+0.3*(1+{col}$4))"
            c = se.cell(row=r, column=2 + j, value=formule)
            c.number_format, c.border = USD, BORD
    se["A13"] = "Prix moyen minimal pour un EBE nul (en % des prix du scénario actif)"
    se["B13"] = f"={OPEX_F}/(({CA_PILOTE}*{H_RAMP2}+{CA_EXT})*(1-{H_PERTES}))"
    se["B13"].number_format, se["B13"].fill = PCT, VERT
    largeurs(se, [26] + [12] * 7)

    return wb


if __name__ == "__main__":
    wb = construire()
    wb.calculation.fullCalcOnLoad = True
    wb.properties.creator = "Projet serre Lubumbashi"
    wb.properties.title = "Modèle financier de la serre pilote de Lubumbashi"
    wb.save(SORTIE)
    print(f"Classeur écrit : {SORTIE}")
