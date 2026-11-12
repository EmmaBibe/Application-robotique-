"""Gestion de l'énergie : délestage par priorités selon l'état de charge.

Le site fonctionne sur solaire + batteries LiFePO4, le réseau SNEL servant
d'appoint quand il est présent et un groupe électrogène de secours en
dernier recours. Les coupures réseau étant fréquentes, le système doit
pouvoir garder les plantes en vie plusieurs jours sans réseau.
"""

from __future__ import annotations

from dataclasses import dataclass

# Priorité 0 : jamais délestée. Plus le chiffre est grand, plus tôt on coupe.
CHARGES = {
    "automates_reseau_capteurs": {"priorite": 0, "puissance_w": 60},
    "aeration_bassins": {"priorite": 0, "puissance_w": 80},
    "pompe_irrigation_fruits": {"priorite": 1, "puissance_w": 370},
    "brassage_air": {"priorite": 1, "puissance_w": 200},
    "recirculation_uv": {"priorite": 1, "puissance_w": 300},
    "stockage_thermique_aerotherme": {"priorite": 1, "puissance_w": 300},
    "moteurs_ouvrants_ecran": {"priorite": 1, "puissance_w": 250},
    "chambre_froide": {"priorite": 2, "puissance_w": 900},
    "extracteurs_pad": {"priorite": 2, "puissance_w": 1200},
    "refroidisseur_solution": {"priorite": 2, "puissance_w": 500},
    "eclairage_pepiniere": {"priorite": 3, "puissance_w": 350},
    "osmoseur_transfert": {"priorite": 3, "puissance_w": 400},
}

SEUILS_SOC = {1: 20.0, 2: 35.0, 3: 55.0}


@dataclass
class DecisionEnergie:
    charges_autorisees: list[str]
    charges_delestees: list[str]
    charger_depuis_reseau: bool
    demarrer_groupe: bool
    message: str


def decider(soc_pct: float, reseau_present: bool, production_pv_w: float,
            groupe_disponible: bool = True) -> DecisionEnergie:
    autorisees, delestees = [], []
    # Quand le soleil couvre largement la demande, on relâche les seuils.
    bonus = 15.0 if production_pv_w > 3000 else 0.0
    for nom, ch in CHARGES.items():
        prio = ch["priorite"]
        if prio == 0 or reseau_present or soc_pct + bonus >= SEUILS_SOC[prio]:
            autorisees.append(nom)
        else:
            delestees.append(nom)

    charger_reseau = reseau_present and soc_pct < 60.0
    demarrer_groupe = (not reseau_present) and groupe_disponible and soc_pct < 15.0 and production_pv_w < 500
    if demarrer_groupe:
        msg = "batterie critique sans réseau : démarrage du groupe de secours"
    elif delestees:
        msg = f"délestage de {len(delestees)} charge(s), SOC {soc_pct:.0f} %"
    else:
        msg = "alimentation normale"
    return DecisionEnergie(autorisees, delestees, charger_reseau, demarrer_groupe, msg)


def puissance_autorisee_w(decision: DecisionEnergie) -> float:
    return sum(CHARGES[n]["puissance_w"] for n in decision.charges_autorisees)
