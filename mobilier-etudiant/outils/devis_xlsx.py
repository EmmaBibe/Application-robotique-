#!/usr/bin/env python3
"""
Devis d'achat au format Excel, généré à partir de la liste consolidée (build/achats.json).
Les prix unitaires sont à saisir (cellules jaunes) ; montants, sous-totaux et total se calculent seuls.

Usage : python3 outils/devis_xlsx.py build/achats.json livrables/04_devis_achats.xlsx
"""
import json
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.page import PageMargins

ENCRE = '1D2126'
GRIS = 'F3F1EC'
SAISIE = 'FFF4C2'
ACCENT = 'C4581F'
fin = Side(style='thin', color='C9CCD0')
BORD = Border(left=fin, right=fin, top=fin, bottom=fin)
FMT_PRIX = '#,##0.00;-#,##0.00;""'
FMT_QTE = '#,##0.0##'


def entete(ws, ligne, titres, largeurs):
    for i, (t, w) in enumerate(zip(titres, largeurs), start=1):
        c = ws.cell(row=ligne, column=i, value=t)
        c.font = Font(bold=True, color='FFFFFF')
        c.fill = PatternFill('solid', fgColor=ENCRE)
        c.alignment = Alignment(vertical='center', wrap_text=True)
        c.border = BORD
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[ligne].height = 30


def mise_en_page(ws, paysage=True):
    ws.page_setup.orientation = 'landscape' if paysage else 'portrait'
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins = PageMargins(left=0.4, right=0.4, top=0.5, bottom=0.6)


def feuille_devis(wb, d):
    ws = wb.active
    ws.title = 'Devis'
    ws['A1'] = "Devis d'achat — mobilier étudiant"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A2'] = 'Dressing à rideaux (A) · Étagère murale de cuisine (B) · Station de cuisson (C)'
    ws['A2'].font = Font(color='5B636C')
    ws['A3'] = d['version'] + ' du ' + d['date'] + ' — quantités calculées sur les plans ; saisir les prix unitaires dans les cases jaunes.'
    ws['A3'].font = Font(italic=True, color='5B636C', size=9)
    ws['H2'] = 'Devise (à saisir)'
    ws['I2'] = ''
    ws['H3'] = 'TVA (%)'
    ws['I3'] = 0
    for c in ('I2', 'I3'):
        ws[c].fill = PatternFill('solid', fgColor=SAISIE)
        ws[c].border = BORD
    ws['H2'].font = ws['H3'].font = Font(bold=True)

    titres = ['N°', 'Réf.', 'Désignation', 'Précisions', 'Unité', 'Qté mini', 'Qté à acheter', 'Prix unitaire', 'Montant', 'Remarque']
    largeurs = [5, 11, 46, 38, 9, 9, 11, 13, 14, 44]
    ligne = 5
    entete(ws, ligne, titres, largeurs)
    ws.freeze_panes = ws.cell(row=ligne + 1, column=1)
    ligne += 1
    sous_totaux = []
    n = 0
    for s in d['sections']:
        c = ws.cell(row=ligne, column=1, value=s['titre'])
        ws.merge_cells(start_row=ligne, start_column=1, end_row=ligne, end_column=10)
        c.font = Font(bold=True, color=ACCENT, size=11)
        c.fill = PatternFill('solid', fgColor=GRIS)
        ligne += 1
        debut = ligne
        for l in s['lignes']:
            n += 1
            valeurs = [n, l['ref'], l['designation'], l['spec'], l['unite'], l['qMin'], l['qConseil'], None, None, l['note']]
            for i, v in enumerate(valeurs, start=1):
                cell = ws.cell(row=ligne, column=i, value=v)
                cell.border = BORD
                cell.alignment = Alignment(vertical='top', wrap_text=i in (3, 4, 10))
            ws.cell(row=ligne, column=6).number_format = FMT_QTE
            ws.cell(row=ligne, column=7).number_format = FMT_QTE
            ws.cell(row=ligne, column=7).font = Font(bold=True)
            pu = ws.cell(row=ligne, column=8)
            pu.fill = PatternFill('solid', fgColor=SAISIE)
            pu.number_format = FMT_PRIX
            m = ws.cell(row=ligne, column=9, value=f'=IF(H{ligne}="","",G{ligne}*H{ligne})')
            m.number_format = FMT_PRIX
            ligne += 1
        fin_l = ligne - 1
        ws.cell(row=ligne, column=8, value='Sous-total').font = Font(bold=True)
        st = ws.cell(row=ligne, column=9, value=f'=SUM(I{debut}:I{fin_l})')
        st.number_format = FMT_PRIX
        st.font = Font(bold=True)
        st.border = BORD
        sous_totaux.append(f'I{ligne}')
        ligne += 2

    def total(lib, formule, gras=True):
        nonlocal ligne
        ws.cell(row=ligne, column=7, value=lib).font = Font(bold=gras)
        ws.merge_cells(start_row=ligne, start_column=7, end_row=ligne, end_column=8)
        c = ws.cell(row=ligne, column=9, value=formule)
        c.number_format = FMT_PRIX
        c.font = Font(bold=gras, size=12 if gras else 11)
        c.border = BORD
        ws.cell(row=ligne, column=10, value='=I2').font = Font(color='5B636C')
        ligne += 1
        return ligne - 1

    l_ht = total('Total hors taxes', '=' + '+'.join(sous_totaux))
    l_tva = total('TVA', f'=I{l_ht}*I3/100', gras=False)
    total('Total TTC', f'=I{l_ht}+I{l_tva}')
    ligne += 1
    notes = [
        "Qté mini : quantité strictement nécessaire d'après les plans. Qté à acheter : avec une marge (une barre de réserve, environ 10 % de quincaillerie en plus).",
        'Les petits profilés sont souvent vendus en barres de 3 ou 6 m : les chutes d\'un atelier de soudure suffisent généralement.',
        'Panneaux : achat de panneaux entiers ou débit sur mesure chez le fournisseur (onglet « Coupes panneaux »).',
        "Main d'œuvre : estimation en heures pour un atelier de soudure ; l'assemblage final à la maison n'est pas compté.",
    ]
    for t in notes:
        c = ws.cell(row=ligne, column=1, value='• ' + t)
        ws.merge_cells(start_row=ligne, start_column=1, end_row=ligne, end_column=10)
        c.alignment = Alignment(wrap_text=True)
        c.font = Font(size=9, color='5B636C')
        ws.row_dimensions[ligne].height = 24
        ligne += 1
    mise_en_page(ws)
    ws.print_title_rows = '5:5'


def feuille_tubes(wb, d):
    ws = wb.create_sheet('Coupes tubes')
    ws['A1'] = 'Coupes des tubes et profilés (trait de scie 3 mm compris dans le plan de débit)'
    ws['A1'].font = Font(bold=True, size=13)
    ligne = 3
    entete(ws, ligne, ['Section', 'Longueur (mm)', 'Quantité', 'Repères', 'Barre', 'Pièces coupées dans la barre', 'Chute (mm)'], [30, 13, 10, 30, 8, 70, 11])
    ligne += 1
    for s in d['debitTubes']:
        c = ws.cell(row=ligne, column=1, value=s['nom'])
        c.font = Font(bold=True, color=ACCENT)
        ws.merge_cells(start_row=ligne, start_column=1, end_row=ligne, end_column=7)
        c.fill = PatternFill('solid', fgColor=GRIS)
        ligne += 1
        compte = {}
        for b in s['barres']:
            for p in b['pieces']:
                k = p['L']
                compte.setdefault(k, {'n': 0, 'reps': set()})
                compte[k]['n'] += 1
                compte[k]['reps'].add(p['rep'])
        lignes_long = sorted(compte.items(), key=lambda kv: -kv[0])
        lignes_barres = s['barres']
        for i in range(max(len(lignes_long), len(lignes_barres))):
            if i < len(lignes_long):
                L, v = lignes_long[i]
                ws.cell(row=ligne, column=2, value=L)
                ws.cell(row=ligne, column=3, value=v['n']).font = Font(bold=True)
                ws.cell(row=ligne, column=4, value=', '.join(sorted(v['reps'])))
            if i < len(lignes_barres):
                b = lignes_barres[i]
                ws.cell(row=ligne, column=5, value=i + 1)
                ws.cell(row=ligne, column=6, value=' + '.join(str(p['L']) for p in b['pieces']))
                ws.cell(row=ligne, column=7, value=round(b['reste']))
            for col in range(1, 8):
                ws.cell(row=ligne, column=col).border = BORD
            ligne += 1
        ligne += 1
    mise_en_page(ws)


def feuille_panneaux(wb, d):
    ws = wb.create_sheet('Coupes panneaux')
    ws['A1'] = 'Liste des coupes de panneaux (à remettre au fournisseur pour un débit sur mesure)'
    ws['A1'].font = Font(bold=True, size=13)
    ligne = 3
    entete(ws, ligne, ['Matériau', 'Repère', 'Pièce', 'Longueur (mm)', 'Largeur (mm)', 'Quantité', 'Usinage, finition'], [22, 9, 36, 13, 13, 10, 60])
    ligne += 1
    for mat in sorted({p['mat'] for p in d['pieces']}, key=lambda m: -int(''.join(ch for ch in m if ch.isdigit()) or 0)):
        c = ws.cell(row=ligne, column=1, value=mat)
        c.font = Font(bold=True, color=ACCENT)
        ws.merge_cells(start_row=ligne, start_column=1, end_row=ligne, end_column=7)
        c.fill = PatternFill('solid', fgColor=GRIS)
        ligne += 1
        for p in [x for x in d['pieces'] if x['mat'] == mat]:
            vals = [mat, p['rep'], p['nom'], p['L'], p['l'], p['qte'], p['usin']]
            for i, v in enumerate(vals, start=1):
                cell = ws.cell(row=ligne, column=i, value=v)
                cell.border = BORD
                cell.alignment = Alignment(wrap_text=i in (3, 7), vertical='top')
            ws.cell(row=ligne, column=6).font = Font(bold=True)
            ligne += 1
        ligne += 1
    mise_en_page(ws)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    with open(src, encoding='utf-8') as f:
        d = json.load(f)
    wb = Workbook()
    feuille_devis(wb, d)
    feuille_tubes(wb, d)
    feuille_panneaux(wb, d)
    wb.properties.title = "Devis d'achat — mobilier étudiant"
    wb.properties.creator = ''
    wb.save(dst)


if __name__ == '__main__':
    main()
