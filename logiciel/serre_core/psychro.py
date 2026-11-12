"""Fonctions psychrométriques utilisées par la régulation climatique.

Formules de Magnus-Tetens (Tetens 1930, coefficients FAO-56), suffisantes
entre 0 et 50 °C pour la conduite d'une serre. Pression atmosphérique par
défaut : 87,5 kPa, valeur moyenne à Lubumbashi (environ 1 230 m d'altitude).
"""

from __future__ import annotations

import math

P_ATM_LUBUMBASHI_KPA = 87.5


def pression_vapeur_saturante(t_c: float) -> float:
    """Pression de vapeur saturante en kPa."""
    return 0.6108 * math.exp(17.27 * t_c / (t_c + 237.3))


def pression_vapeur(t_c: float, hr_pct: float) -> float:
    return pression_vapeur_saturante(t_c) * hr_pct / 100.0


def dpv(t_air_c: float, hr_pct: float, t_feuille_c: float | None = None) -> float:
    """Déficit de pression de vapeur (kPa).

    Si la température de feuille est connue (capteur infrarouge), on calcule
    le DPV feuille-air, plus représentatif de la transpiration réelle.
    """
    ea = pression_vapeur(t_air_c, hr_pct)
    t_ref = t_air_c if t_feuille_c is None else t_feuille_c
    return max(0.0, pression_vapeur_saturante(t_ref) - ea)


def point_de_rosee(t_c: float, hr_pct: float) -> float:
    a, b = 17.27, 237.3
    hr = max(hr_pct, 0.1)
    gamma = math.log(hr / 100.0) + a * t_c / (b + t_c)
    return b * gamma / (a - gamma)


def humidite_absolue(t_c: float, hr_pct: float) -> float:
    """Humidité absolue en g/m³."""
    e_pa = pression_vapeur(t_c, hr_pct) * 1000.0
    return 2.1674 * e_pa / (t_c + 273.15)


def rapport_melange(t_c: float, hr_pct: float, p_kpa: float = P_ATM_LUBUMBASHI_KPA) -> float:
    """Rapport de mélange en kg d'eau par kg d'air sec."""
    e = pression_vapeur(t_c, hr_pct)
    return 0.622 * e / (p_kpa - e)


def hr_depuis_rapport_melange(t_c: float, w: float, p_kpa: float = P_ATM_LUBUMBASHI_KPA) -> float:
    e = w * p_kpa / (0.622 + w)
    return min(100.0, max(0.0, 100.0 * e / pression_vapeur_saturante(t_c)))


def enthalpie(t_c: float, hr_pct: float, p_kpa: float = P_ATM_LUBUMBASHI_KPA) -> float:
    """Enthalpie de l'air humide en kJ/kg d'air sec."""
    w = rapport_melange(t_c, hr_pct, p_kpa)
    return 1.006 * t_c + w * (2501.0 + 1.86 * t_c)


def temperature_humide(t_c: float, hr_pct: float) -> float:
    """Température de bulbe humide, formule empirique de Stull (2011).

    Précision de l'ordre de 0,3 °C entre 5 et 99 % d'HR, ce qui suffit pour
    estimer le potentiel d'un refroidissement par évaporation.
    """
    hr = hr_pct
    return (
        t_c * math.atan(0.151977 * math.sqrt(hr + 8.313659))
        + math.atan(t_c + hr)
        - math.atan(hr - 1.676331)
        + 0.00391838 * hr ** 1.5 * math.atan(0.023101 * hr)
        - 4.686035
    )


def sortie_pad(t_ext_c: float, hr_ext_pct: float, efficacite: float = 0.8) -> tuple[float, float]:
    """Température et HR de l'air en sortie d'un mur de refroidissement (pad).

    Le rapport de mélange augmente de façon à conserver l'enthalpie
    (transformation adiabatique).
    """
    t_h = temperature_humide(t_ext_c, hr_ext_pct)
    t_sortie = t_ext_c - efficacite * (t_ext_c - t_h)
    h = enthalpie(t_ext_c, hr_ext_pct)
    w = (h - 1.006 * t_sortie) / (2501.0 + 1.86 * t_sortie)
    return t_sortie, hr_depuis_rapport_melange(t_sortie, w)


def dli_depuis_ppfd(ppfd_moyen: float, heures: float) -> float:
    """Intégrale lumineuse journalière (mol/m²/j) depuis un PPFD moyen (µmol/m²/s)."""
    return ppfd_moyen * heures * 3600.0 / 1e6


def ppfd_depuis_global(rayonnement_w_m2: float, transmission: float = 0.65) -> float:
    """Conversion approchée rayonnement global extérieur -> PPFD sous serre.

    Environ 2,1 µmol/J de PAR dans le rayonnement solaire global ; la
    transmission tient compte de la couverture, de la structure et des écrans.
    """
    return rayonnement_w_m2 * 2.1 * transmission
