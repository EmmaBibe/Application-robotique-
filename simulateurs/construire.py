"""Construit la version autonome de la maquette 3D (un seul fichier HTML).

Les navigateurs refusent de charger des modules JavaScript depuis un fichier
local (file://). Ce script embarque Three.js, ses extensions et le noyau de
simulation dans la page, pour qu'elle s'ouvre d'un double-clic, sans serveur
ni internet.

Usage : python3 construire.py
"""

import base64
import json
import re
from pathlib import Path

ICI = Path(__file__).resolve().parent
LIB = ICI / "lib"

MODULES = {
    "three": LIB / "three" / "three.module.min.js",
    "three/addons/OrbitControls.js": LIB / "three" / "addons" / "OrbitControls.js",
    "three/addons/PointerLockControls.js": LIB / "three" / "addons" / "PointerLockControls.js",
    "three/addons/Sky.js": LIB / "three" / "addons" / "Sky.js",
    "three/addons/CSS2DRenderer.js": LIB / "three" / "addons" / "CSS2DRenderer.js",
    "three/addons/GLTFExporter.js": LIB / "three" / "addons" / "GLTFExporter.js",
    "textureutils": LIB / "three" / "utils" / "TextureUtils.js",
    "modele": LIB / "modele.js",
}


def b64(texte: str) -> str:
    return base64.b64encode(texte.encode("utf-8")).decode("ascii")


def construire(source: str, sortie: str) -> None:
    html = (ICI / source).read_text(encoding="utf-8")
    sources = {}
    for nom, chemin in MODULES.items():
        code = chemin.read_text(encoding="utf-8")
        code = code.replace("'./../utils/TextureUtils.js'", "'textureutils'")
        sources[nom] = b64(code)

    m = re.search(r'<script type="module">(.*?)</script>', html, re.S)
    principal = m.group(1).replace('"./lib/modele.js"', '"modele"')
    sources["__principal__"] = b64(principal)

    chargeur = (
        "<script>\n"
        "const SOURCES = " + json.dumps(sources) + ";\n"
        "const versUrl = s => URL.createObjectURL(new Blob([new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)))], {type: 'text/javascript'}));\n"
        "const imports = {};\n"
        "for (const [nom, s] of Object.entries(SOURCES)) if (nom !== '__principal__') imports[nom] = versUrl(s);\n"
        "const carte = document.createElement('script'); carte.type = 'importmap'; carte.textContent = JSON.stringify({imports});\n"
        "document.head.appendChild(carte);\n"
        "const principal = document.createElement('script'); principal.type = 'module'; principal.src = versUrl(SOURCES.__principal__);\n"
        "document.body.appendChild(principal);\n"
        "</script>"
    )
    html = re.sub(r'<script type="importmap">.*?</script>\s*', "", html, flags=re.S)
    html = html.replace(m.group(0), chargeur)
    (ICI / sortie).write_text(html, encoding="utf-8")
    print(f"{sortie} : {len(html) / 1e6:.1f} Mo")


if __name__ == "__main__":
    construire("serre_3d.html", "serre_3d_autonome.html")
