"""Régulation climatique d'un compartiment de serre.

Le régulateur est volontairement lisible : des bandes proportionnelles avec
hystérésis, organisées par priorités. Ce choix est fait pour que le
technicien sur place comprenne pourquoi un actionneur bouge, ce qui compte
plus qu'une optimisation de quelques pourcents.

Ordre de priorité :
  1. sécurité structure (vent fort, pluie) ;
  2. température (chauffage par déstockage, aération, refroidissement) ;
  3. humidité / DPV ;
  4. CO2, uniquement quand la serre est fermée ;
  5. économie d'énergie (intégration de température sur 24 h).
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

from .psychro import dpv
from .recettes import Consignes


@dataclass
class Mesures:
    t_int: float
    hr_int: float
    co2_ppm: float
    t_ext: float
    hr_ext: float
    rayonnement_ext: float  # W/m²
    vent_m_s: float
    pluie: bool
    t_stockage: float  # température de la cuve de stockage thermique
    jour: bool
    t_feuille: float | None = None


@dataclass
class Commandes:
    ouvrant_pct: float = 0.0          # ouvrants faîtage et latéraux (filet insectes)
    ecran_pct: float = 0.0            # 0 = ouvert, 100 = fermé
    ventilateurs_extraction: int = 0  # 0, 1 ou 2 étages
    pad: bool = False
    brassage: bool = False            # ventilateurs de brassage horizontaux (HAF)
    stockage_mode: str = "arret"      # "charge", "decharge", "arret"
    co2: bool = False
    mode: str = "naturel"             # "naturel" ou "evaporatif"
    raisons: list[str] = field(default_factory=list)


@dataclass
class ParametresRegulation:
    bande_aeration_k: float = 4.0
    vent_limite_m_s: float = 10.0
    vent_fermeture_m_s: float = 14.0
    ouvrant_max_pluie: float = 20.0
    ecart_mode_evaporatif_k: float = 3.0
    hr_ext_max_evaporatif: float = 65.0
    seuil_ombrage_w_m2: float = 650.0
    ecran_ombrage_pct: float = 70.0
    ecran_nuit_t_ext_ecart_k: float = 5.0
    entrebaillement_ecran_humidite: float = 92.0
    ouvrant_mini_humidite: float = 10.0
    co2_ouvrant_max: float = 10.0
    co2_rayonnement_min: float = 150.0
    integration_amplitude_k: float = 1.5
    integration_fenetre_pas: int = 288  # 24 h au pas de 5 min


class RegulateurClimat:
    def __init__(self, params: ParametresRegulation | None = None):
        self.p = params or ParametresRegulation()
        self._mode = "naturel"
        self._historique_t = deque(maxlen=self.p.integration_fenetre_pas)
        self._t_moy_cible: float | None = None

    # -- intégration de température ------------------------------------
    def correction_integration(self, c: Consignes) -> float:
        """Décalage de consigne de chauffage (K) selon la moyenne glissante 24 h.

        Principe du "temperature integration" (Körner et Challa) : la plante
        réagit surtout à la moyenne journalière. Si les heures chaudes de la
        journée ont déjà apporté la somme de température, on laisse la nuit
        descendre un peu plus bas, ce qui économise le stock de chaleur.
        """
        cible = (c.t_jour * 12 + c.t_nuit * 12) / 24
        if len(self._historique_t) < self._historique_t.maxlen // 4:
            return 0.0
        moyenne = sum(self._historique_t) / len(self._historique_t)
        ecart = moyenne - cible
        a = self.p.integration_amplitude_k
        return -max(-a, min(a, ecart))

    def calculer(self, m: Mesures, c: Consignes) -> Commandes:
        p = self.p
        cmd = Commandes()
        self._historique_t.append(m.t_int)

        t_chauffe = c.t_chauffage(m.jour)
        if not m.jour:
            t_chauffe += self.correction_integration(c)
        t_aere = c.t_ventilation(m.jour)
        deficit = dpv(m.t_int, m.hr_int, m.t_feuille)

        # 1. limite d'ouverture imposée par la météo
        ouvrant_max = 100.0
        if m.vent_m_s >= p.vent_fermeture_m_s:
            ouvrant_max = 0.0
            cmd.raisons.append("vent violent : ouvrants fermés")
        elif m.vent_m_s >= p.vent_limite_m_s:
            ouvrant_max = 30.0
            cmd.raisons.append("vent fort : ouvrants limités à 30 %")
        if m.pluie:
            ouvrant_max = min(ouvrant_max, p.ouvrant_max_pluie)
            cmd.raisons.append("pluie : ouvrants limités")

        # 2. choix du mode de refroidissement, avec hystérésis
        if self._mode == "naturel":
            if (m.t_int > t_aere + p.ecart_mode_evaporatif_k and m.hr_ext < p.hr_ext_max_evaporatif
                    and m.jour):
                self._mode = "evaporatif"
        else:
            if m.t_int < t_aere or m.hr_ext > p.hr_ext_max_evaporatif + 5 or not m.jour:
                self._mode = "naturel"
        cmd.mode = self._mode

        if self._mode == "evaporatif":
            # Le pad ne fonctionne que serre fermée : l'air entre par le pad
            # (protégé par filet) et sort par les extracteurs.
            cmd.ouvrant_pct = 0.0
            cmd.pad = True
            cmd.ventilateurs_extraction = 2 if m.t_int > t_aere + p.ecart_mode_evaporatif_k + 2 else 1
            cmd.raisons.append("refroidissement évaporatif actif")
        else:
            erreur = m.t_int - t_aere
            ouverture = max(0.0, min(100.0, erreur / p.bande_aeration_k * 100.0))
            if m.hr_int > c.hr_max and m.t_int > t_chauffe:
                ouverture = max(ouverture, p.ouvrant_mini_humidite)
                cmd.raisons.append("humidité haute : aération minimale")
            cmd.ouvrant_pct = min(ouverture, ouvrant_max)

        # 3. écran : ombrage le jour, isolation la nuit
        if m.jour:
            if m.rayonnement_ext > p.seuil_ombrage_w_m2 and m.t_int > t_aere - 1:
                cmd.ecran_pct = p.ecran_ombrage_pct
                cmd.raisons.append("rayonnement fort : écran d'ombrage")
        else:
            if m.t_ext < t_chauffe + p.ecran_nuit_t_ext_ecart_k:
                cmd.ecran_pct = 100.0
                if m.hr_int > p.entrebaillement_ecran_humidite:
                    cmd.ecran_pct = 95.0
                    cmd.raisons.append("écran entrouvert pour évacuer l'humidité")

        # 4. stockage thermique (cuve d'eau isolée + aérotherme)
        if m.t_int < t_chauffe and m.t_stockage > m.t_int + 2:
            cmd.stockage_mode = "decharge"
            cmd.raisons.append("chauffage par déstockage")
        elif (not m.jour and m.hr_int > c.hr_max and m.t_stockage > m.t_int + 3
              and m.t_int < t_chauffe + 4):
            # Nuits de saison des pluies : l'air extérieur est saturé, seule une
            # légère élévation de température fait baisser l'HR.
            cmd.stockage_mode = "decharge"
            cmd.ouvrant_pct = max(cmd.ouvrant_pct, min(5.0, ouvrant_max))
            cmd.raisons.append("déshumidification par déstockage")
        elif m.jour and m.t_int > c.t_jour + 3 and m.t_stockage < m.t_int - 3:
            cmd.stockage_mode = "charge"
            cmd.raisons.append("excès de chaleur stocké")

        # 5. brassage d'air : homogénéise et limite la condensation sur feuilles
        cmd.brassage = (
            m.hr_int > c.hr_max - 5
            or cmd.ecran_pct >= 95
            or deficit < c.dpv_min
            or cmd.stockage_mode != "arret"
        )

        # 6. CO2 : seulement serre quasi fermée et lumière suffisante
        if (cmd.ouvrant_pct <= p.co2_ouvrant_max and self._mode == "naturel"
                and m.rayonnement_ext > p.co2_rayonnement_min and m.co2_ppm < c.co2_ppm):
            cmd.co2 = True

        return cmd
