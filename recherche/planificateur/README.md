# Laboratoire de planification et de suivi de trajectoire

Banc d'essai pour inventer et évaluer de nouveaux algorithmes de planification et de suivi, en les comparant honnêtement aux méthodes existantes : mêmes mondes, mêmes perturbations, mêmes graines aléatoires.

## Contenu

| Fichier | Rôle |
|---|---|
| `sim.py` | simulateur : robot unicycle (limites de vitesse et d'accélération, bruit d'actionneur et de mesure), obstacles fixes et mobiles qui changent d'intention sans prévenir, 7 scènes |
| `planners.py` | les planificateurs : références classiques, références récentes, nos propositions et un oracle |
| `bench.py` | campagne de tests en parallèle, résultats en CSV |
| `analyse.py` | tableaux par scène, comparaisons appariées avec intervalles de confiance (bootstrap) |
| `figures.py` | trajectoires de plusieurs planificateurs sur un même monde |
| `CARTOGRAPHIE.md` | revue des domaines d'inspiration (physique, biologie, finance, navigation maritime…) |
| `JOURNAL.md` | journal de recherche : hypothèses, essais, résultats, conclusions |

## Scènes

`foret` (30 obstacles fixes), `carrefour` (flux croisés de mobiles), `couloir` (mur percé d'un passage étroit), `piege` (cul-de-sac en U), `foule` (16 mobiles errants), `foule_dense` (26 mobiles plus rapides), `carrefour_rapide` (14 mobiles jusqu'à 1,8 m/s, plus rapides que le robot).

Chaque monde est vérifié faisable : un chemin existe pour le robot avec 5 cm de marge.

## Lancer

```bash
pip install numpy matplotlib
python3 bench.py 300:330 resultats.csv          # graines 300 à 329, tous les planificateurs
python3 bench.py 300:330 r.csv 2,3,15           # seulement certains (indices de planners.ALL)
SCENES=couloir,foule python3 bench.py 20 r.csv  # seulement certaines scènes
python3 analyse.py resultats.csv final          # tableaux dans resultats_final.md
REF="MPPI" python3 analyse.py resultats.csv x   # comparaisons appariées par rapport à MPPI
python3 figures.py carrefour 4                  # figure des trajectoires
```

## Règles de rigueur adoptées

- On développe et on règle sur certaines graines, on évalue sur des graines jamais utilisées pour régler.
- Comparaisons appariées : chaque méthode affronte exactement les mêmes mondes.
- On publie les échecs autant que les réussites.
- Un oracle qui connaît le futur donne la borne haute : il montre combien il reste réellement à gagner.
