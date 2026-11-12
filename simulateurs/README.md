# Simulateurs

Ouvrir `index.html` (double-clic), puis choisir un simulateur. Aucun serveur ni internet n'est nécessaire.

| Fichier | Rôle |
|---|---|
| `serre_3d_autonome.html` | Maquette 3D vivante, en un seul fichier (à ouvrir directement) |
| `serre_3d.html` | Source de la maquette ; ne s'ouvre que via un petit serveur local (`python3 -m http.server` dans ce dossier, puis http://localhost:8000/serre_3d.html) |
| `lib/modele.js` | Noyau de simulation : climat, régulation, soleil, énergie, finance. Mêmes hypothèses que le dossier et le classeur Excel |
| `lib/three/` | Three.js 0.160 (licence MIT) et les extensions utilisées |
| `construire.py` | Régénère `serre_3d_autonome.html` après une modification de `serre_3d.html` ou de `lib/modele.js` |

## Ce que l'on peut faire dans la maquette 3D

- **Regarder** : survol à la souris (clic gauche pour tourner, molette pour zoomer, clic droit pour se déplacer), vue de dessus, marche dans les allées (Z Q S D ou flèches).
- **Comprendre** : cliquer sur n'importe quel élément pour sa fiche (rôle, caractéristiques, coût).
- **Isoler un domaine** : agronomie, génie civil, climat, eau, électricité, capteurs, ou tout ensemble ; masquer le film pour voir l'intérieur.
- **Faire passer le temps** : mois et heure, soleil à sa vraie position pour Lubumbashi (11,7° sud), ombres réelles, lecture accélérée jusqu'à 2 h par seconde.
- **Voir pousser** : tomates du repiquage à la pleine production (fruits verts puis rouges), radeaux de feuilles à tous les stades.
- **Tester une idée** : retirer le stockage thermique, l'écran ou le mur évaporatif et regarder ce que devient la température ; passer en mode manuel et piloter vous-même les ouvrants, l'écran, les extracteurs, le pad et le stockage.
- **Chiffrer** : onglet Finance, curseurs prix, rendements et coût de l'extension ; EBE, VAN, TRI et trésorerie se recalculent avec les formules du classeur.
- **Aller plus loin en rendu** : le bouton « Exporter en glTF » produit un fichier `.glb` qui s'ouvre dans Blender (gratuit) pour des images ou une vidéo photoréalistes.

## Limites

Le climat est calculé par un modèle simplifié (voir `docs/08_climat_thermique.md`) : il est fait pour comparer des choix et sentir les ordres de grandeur, pas pour garantir une température au dixième de degré. Les plantes sont stylisées. Sur un ordinateur ancien, décocher « Film et parois » rend l'affichage plus fluide.
