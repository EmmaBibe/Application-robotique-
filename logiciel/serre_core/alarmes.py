"""Règles d'alarme avec temporisation, pour éviter les alertes à répétition.

Niveaux :
  info      : journal uniquement ;
  attention : notification sur l'interface et le téléphone du technicien ;
  critique  : SMS + appel au responsable, relance toutes les 15 min tant que
              l'alarme n'est pas acquittée.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Regle:
    code: str
    grandeur: str
    seuil_bas: float | None
    seuil_haut: float | None
    delai_s: int
    niveau: str
    message: str


REGLES_DEFAUT = [
    Regle("T_HAUTE", "t_int", None, 35.0, 300, "critique", "Température serre au-dessus de 35 °C"),
    Regle("T_BASSE", "t_int", 8.0, None, 600, "critique", "Température serre sous 8 °C, risque de dégâts de froid"),
    Regle("HR_HAUTE", "hr_int", None, 92.0, 3600, "attention", "HR > 92 % depuis 1 h : risque Botrytis/mildiou"),
    Regle("CO2_HAUT", "co2_ppm", None, 1500.0, 300, "critique", "CO2 > 1 500 ppm : vérifier l'injection"),
    Regle("O2_BAS", "o2_bassin", 5.0, None, 600, "critique", "Oxygène dissous bas dans les bassins"),
    Regle("T_SOL_HAUTE", "t_solution", None, 24.0, 1800, "attention", "Solution nutritive trop chaude"),
    Regle("PH_HORS", "ph", 5.2, 6.8, 1800, "attention", "pH hors plage"),
    Regle("EC_HORS", "ec", 0.8, 4.0, 1800, "attention", "EC hors plage"),
    Regle("SOC_BAS", "soc", 25.0, None, 60, "attention", "Batterie sous 25 %"),
    Regle("SOC_CRIT", "soc", 12.0, None, 60, "critique", "Batterie critique"),
    Regle("NIVEAU_EAU", "niveau_citerne_pct", 15.0, None, 600, "attention", "Citerne d'eau presque vide"),
    Regle("PORTE_SAS", "porte_sas_ouverte_s", None, 120.0, 0, "attention", "Porte du sas restée ouverte"),
]


@dataclass
class EtatAlarme:
    debut_s: float | None = None
    active: bool = False
    acquittee: bool = False


@dataclass
class GestionnaireAlarmes:
    regles: list[Regle] = field(default_factory=lambda: list(REGLES_DEFAUT))
    etats: dict[str, EtatAlarme] = field(default_factory=dict)

    def evaluer(self, t_s: float, valeurs: dict[str, float]) -> list[tuple[Regle, str]]:
        """Renvoie la liste des événements (règle, 'leve' ou 'retombe')."""
        evenements = []
        for r in self.regles:
            if r.grandeur not in valeurs:
                continue
            v = valeurs[r.grandeur]
            hors = (r.seuil_bas is not None and v < r.seuil_bas) or (r.seuil_haut is not None and v > r.seuil_haut)
            e = self.etats.setdefault(r.code, EtatAlarme())
            if hors:
                if e.debut_s is None:
                    e.debut_s = t_s
                if not e.active and t_s - e.debut_s >= r.delai_s:
                    e.active, e.acquittee = True, False
                    evenements.append((r, "leve"))
            else:
                if e.active:
                    evenements.append((r, "retombe"))
                e.debut_s, e.active = None, False
        return evenements

    def acquitter(self, code: str) -> None:
        if code in self.etats:
            self.etats[code].acquittee = True

    def actives(self) -> list[str]:
        return [c for c, e in self.etats.items() if e.active]
