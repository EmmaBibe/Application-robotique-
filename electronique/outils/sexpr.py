"""Lecture et écriture minimales des S-expressions KiCad."""

from __future__ import annotations

import re

_JETON = re.compile(r'\s*(\(|\)|"(?:[^"\\]|\\.)*"|[^\s()]+)')


def lire(texte: str):
    pile, courant = [], []
    for m in _JETON.finditer(texte):
        t = m.group(1)
        if t == "(":
            pile.append(courant)
            courant = []
        elif t == ")":
            fini = courant
            courant = pile.pop()
            courant.append(fini)
        else:
            if t.startswith('"'):
                t = Chaine(bytes(t[1:-1], "utf-8").decode("unicode_escape") if "\\" in t else t[1:-1])
            courant.append(t)
    return courant[0] if len(courant) == 1 else courant


class Chaine(str):
    """Chaîne entre guillemets (à distinguer des symboles nus)."""


def ecrire(expr, niveau: int = 0) -> str:
    if isinstance(expr, list):
        if not expr:
            return "()"
        simple = all(not isinstance(e, list) for e in expr)
        if simple or niveau > 6:
            return "(" + " ".join(ecrire(e, niveau + 1) for e in expr) + ")"
        tete = []
        reste = []
        for e in expr:
            (reste if isinstance(e, list) or reste else tete).append(e)
        txt = "(" + " ".join(ecrire(e, niveau + 1) for e in tete)
        for e in reste:
            txt += "\n" + "  " * (niveau + 1) + ecrire(e, niveau + 1)
        return txt + ")"
    if isinstance(expr, Chaine):
        return '"' + expr.replace("\\", "\\\\").replace('"', '\\"') + '"'
    if isinstance(expr, float):
        s = f"{expr:.4f}".rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s
    return str(expr)


def enfants(expr, nom):
    return [e for e in expr if isinstance(e, list) and e and e[0] == nom]


def enfant(expr, nom):
    r = enfants(expr, nom)
    return r[0] if r else None
