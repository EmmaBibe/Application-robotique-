"""Graphiques du dossier d'étude (matplotlib, SVG), à partir des données du projet."""

import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

R = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "figures"
OUT.mkdir(exist_ok=True)
VERT, ORANGE, BLEU, GRIS, ROUGE = "#2f7d4f", "#d08a1e", "#2c6ea3", "#8a948e", "#b83a2e"
plt.rcParams.update({"font.family": "Inter", "font.size": 9, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.edgecolor": "#9aa49e", "axes.labelcolor": "#33403a", "xtick.color": "#55625b", "ytick.color": "#55625b",
                     "axes.grid": True, "grid.color": "#e3e8e5", "grid.linewidth": 0.6, "figure.dpi": 100})
MOIS = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"]


def lire(n):
    with open(R / "donnees" / n, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def climat():
    c, s = lire("climat_lubumbashi_mensuel.csv"), lire("simulation_climat_mensuelle.csv")
    x = range(12)
    fig, ax = plt.subplots(figsize=(6.6, 3.0))
    ax.fill_between(x, [float(r["t_min_moy_C"]) for r in c], [float(r["t_max_moy_C"]) for r in c], color=GRIS, alpha=.18, label="extérieur (min - max)")
    ax.fill_between(x, [float(r["t_min_int"]) for r in s], [float(r["t_max_int"]) for r in s], color=VERT, alpha=.25, label="serre retenue (min - max)")
    ax.plot(x, [float(r["t_min_int"]) for r in s], color=VERT, lw=1.6)
    ax.plot(x, [float(r["t_max_int"]) for r in s], color=VERT, lw=1.6)
    ax.axhspan(12, 30, color=BLEU, alpha=.05)
    ax.axhline(12, color=BLEU, lw=.8, ls="--"); ax.axhline(30, color=ORANGE, lw=.8, ls="--")
    ax.text(11.2, 12.4, "12 °C", color=BLEU, fontsize=8, ha="right"); ax.text(11.2, 30.4, "30 °C", color=ORANGE, fontsize=8, ha="right")
    ax.set_xticks(list(x), MOIS); ax.set_ylabel("°C"); ax.set_ylim(4, 36)
    ax.legend(frameon=False, loc="lower left", fontsize=8)
    fig.tight_layout(); fig.savefig(OUT / "climat_serre.svg"); plt.close(fig)


def variantes():
    v = lire("simulation_variantes.csv")
    noms = {"retenue": "Retenue", "sans_stockage": "Sans stockage", "sans_ecran": "Sans écran", "sans_pad": "Sans pad", "serre_simple": "Serre simple"}
    fig, axs = plt.subplots(1, 2, figsize=(6.6, 2.6))
    for ax, mois, cle, titre, coul in ((axs[0], "7", "t_min_int", "Minimale intérieure en juillet (°C)", BLEU), (axs[1], "10", "t_max_int", "Maximale intérieure en octobre (°C)", ORANGE)):
        rows = [r for r in v if r["mois"] == mois]
        vals = [float(r[cle]) for r in rows]
        ax.barh([noms[r["variante"]] for r in rows], vals, color=[VERT if r["variante"] == "retenue" else coul for r in rows], alpha=.85)
        for k, val in enumerate(vals):
            ax.text(val + .2, k, f"{val:.1f}".replace(".", ","), va="center", fontsize=8)
        ax.set_title(titre, fontsize=9, loc="left"); ax.invert_yaxis(); ax.grid(axis="y", visible=False)
        ax.set_xlim(0, max(vals) * 1.18)
    fig.tight_layout(); fig.savefig(OUT / "variantes.svg"); plt.close(fig)


def energie():
    e = lire("bilan_energie_mensuel.csv")
    x = range(12)
    fixes = [float(r["charges_fixes_kWh"]) for r in e]
    ext = [float(r["extracteurs_pad_kWh"]) for r in e]
    sto = [float(r["stockage_thermique_kWh"]) for r in e]
    autres = [float(r["total_kWh_j"]) - a - b - c for a, b, c, r in zip(fixes, ext, sto, e)]
    fig, ax = plt.subplots(figsize=(6.6, 2.8))
    ax.bar(x, fixes, color=GRIS, label="charges permanentes")
    ax.bar(x, ext, bottom=fixes, color=BLEU, label="extracteurs et pad")
    b2 = [a + b for a, b in zip(fixes, ext)]
    ax.bar(x, sto, bottom=b2, color=ORANGE, label="stockage thermique")
    b3 = [a + b for a, b in zip(b2, sto)]
    ax.bar(x, autres, bottom=b3, color=VERT, label="refroidissement solution, germination")
    pv = [6 * 0.55 * float(r["irradiation_plan_kWh_m2_j"]) * 0.75 for r in e]
    ax.plot(x, pv, color="#1a1a1a", lw=1.4, marker="o", ms=3, label="production 3,3 kWc")
    ax.set_xticks(list(x), MOIS); ax.set_ylabel("kWh / jour"); ax.legend(frameon=False, fontsize=7.5, ncol=2, loc="upper left"); ax.set_ylim(0, 30)
    fig.tight_layout(); fig.savefig(OUT / "energie.svg"); plt.close(fig)


def tresorerie():
    import importlib.util, sys
    # mêmes formules que le classeur (simulateurs/lib/modele.js : finance())
    cap1, cap2 = 55220, 114730
    def flux(idx):
        ca_p, ca_e, op_p, op_f = 6042, 61707, 7794, 45736
        cum, out = -cap1, [-cap1]
        for a in range(1, 11):
            rp = .55 if a == 1 else .9
            age = a - 2
            re = 0 if age <= 0 else [.7, .9, 1][min(age, 3) - 1]
            ca = (ca_p * rp + ca_e * re) * idx * .92
            op = op_p if age <= 0 else op_p + (op_f - op_p) * (.6 + .4 * re)
            ebe = ca - op
            am = 5508 + (11211 if a > 2 else 0)
            imp = max((ebe - am) * .3, ca * .01)
            cum += ebe - imp - (cap2 if a == 2 else 0) + ((cap1 + cap2) * .2 if a == 10 else 0)
            out.append(cum)
        return out
    fig, ax = plt.subplots(figsize=(6.6, 2.9))
    for idx, coul, nom in ((0.8, ROUGE, "prudent (indice 0,8)"), (1.0, ORANGE, "médian (1,0)"), (1.2, BLEU, "seuil « go » (1,2)"), (1.6, VERT, "optimiste (≈ 1,6)")):
        ax.plot(range(11), [v / 1000 for v in flux(idx)], color=coul, lw=1.8, label=nom)
    ax.axhline(0, color="#1a1a1a", lw=.8)
    ax.set_xlabel("année"); ax.set_ylabel("trésorerie cumulée (k$)"); ax.legend(frameon=False, fontsize=8, loc="lower left")
    fig.tight_layout(); fig.savefig(OUT / "tresorerie.svg"); plt.close(fig)


def chiffre_affaires():
    cultures = [("Laitue", 1600), ("Poivron", 720), ("Tomate ronde", 675), ("Tomate cerise", 560), ("Chou de Chine", 500), ("Céleri", 420),
                ("Aromatiques", 360), ("Épinard", 350), ("Piment", 250), ("Oignon vert", 252), ("Poireau", 225), ("Amarante", 130)]
    cultures.sort(key=lambda c: c[1])
    fig, ax = plt.subplots(figsize=(6.6, 3.0))
    feuilles = {"Laitue", "Chou de Chine", "Céleri", "Aromatiques", "Épinard", "Oignon vert", "Poireau", "Amarante"}
    ax.barh([c[0] for c in cultures], [c[1] for c in cultures], color=[VERT if c[0] in feuilles else ORANGE for c in cultures])
    for k, c in enumerate(cultures):
        ax.text(c[1] + 15, k, f"{c[1]} $", va="center", fontsize=8)
    ax.set_xlabel("chiffre d'affaires brut annuel du pilote, scénario médian ($)"); ax.grid(axis="y", visible=False)
    ax.text(1300, 1, "vert : feuilles   orange : fruits", fontsize=8, color="#55625b")
    fig.tight_layout(); fig.savefig(OUT / "chiffre_affaires.svg"); plt.close(fig)


if __name__ == "__main__":
    climat(); variantes(); energie(); tresorerie(); chiffre_affaires()
    print("figures écrites")
