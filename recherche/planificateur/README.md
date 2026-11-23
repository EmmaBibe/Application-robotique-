# Laboratoire de planification et de suivi de trajectoire

C'est ici qu'a été mis au point **VIGIE**, un planificateur qui compare plusieurs idées de chemin (itinéraires distincts, route dans l'espace et le temps qui sait attendre, improvisation libre), note chacune avec une probabilité de collision, garde son itinéraire tant qu'un autre n'est pas nettement meilleur, compense le retard de ses mesures et ralentit près des angles morts. Version actuelle : **VIGIE 6**, classe `Vigie6` dans `vigie_risque.py` ; références de l'état de l'art codées d'après leurs publications dans `references.py` (T-MPC++, DRA-MPPI). Dernière évaluation de développement, sur robot réaliste et 40 mondes jamais utilisés (2 640 essais) : VIGIE 6 réussit 86,7 % des trajets contre 81,4 % pour DRA-MPPI réglé, +5,3 points, écart significatif ; l'évaluation finale sur 100 mondes neufs reste à faire. Les comparaisons des séances 1 à 6 se faisaient contre une référence mal attribuée et trop faible : voir `JOURNAL.md`, séance 7. Version JavaScript fidèle (vérifiée par `parite_js.py`) dans `js/sims/vigie6/`, utilisée par le simulateur 3D de l'application.

Banc d'essai pour inventer et évaluer de nouveaux algorithmes de planification et de suivi, en les comparant honnêtement aux méthodes existantes : mêmes mondes, mêmes perturbations, mêmes graines aléatoires.

## Contenu

| Fichier | Rôle |
|---|---|
| `sim.py` | simulateur : robot unicycle (limites de vitesse et d'accélération, bruit d'actionneur et de mesure), obstacles fixes et mobiles qui changent d'intention sans prévenir, 7 scènes, 7 conditions de perturbation |
| `planners.py` | les planificateurs : références classiques, références récentes, nos propositions et un oracle |
| `bench.py` | campagne de tests en parallèle, résultats en CSV |
| `controles.py` | même campagne avec le contrôle des contacts entre deux instants (`marge_balayee`) |
| `analyse.py` | tableaux par scène, comparaisons appariées avec intervalles de confiance (bootstrap) |
| `figures.py` | trajectoires de plusieurs planificateurs sur un même monde |
| `CARTOGRAPHIE.md` | revue des domaines d'inspiration (physique, biologie, finance, navigation maritime…) |
| `robot_reel.py` | chaîne d'actionneurs réaliste (retard, régulateur de roues, masse) et filtre de suivi des personnes (Kalman) |
| `tests_banc.py` | 241 vérifications de cohérence du banc, à lancer avant toute campagne (dont la fidélité du portage JavaScript, test 32) |
| `faisabilite.py` | borne de faisabilité : le meilleur temps possible en connaissant le futur |
| `references.py` | références de l'état de l'art codées d'après leurs publications (T-MPC++, DRA-MPPI), adaptations déclarées, variantes de réglage |
| `vigie_risque.py` | VIGIE 6 et ses briques : probabilité de collision, même marge, cohérence de route, planificateur libre ; variantes testées |
| `analyse_scenes.py`, `resume_reglage.py`, `analyse_echecs.py` | comparaisons appariées par scène, résumé d'une campagne, essais perdus face à la référence |
| `parite_js.py`, `parite_js.mjs` | fidélité du portage JavaScript : mêmes entrées, mêmes sorties, jusqu'aux décisions complètes rejouées |
| `js_validation_simulateur.csv` | campagne bouclée dans le simulateur JavaScript (1 760 essais), même avantage que le banc |
| `PLAN_SEANCE7.md` | plan de la séance 7, écrit avant chaque essai (hypothèses, mondes, règles de décision) |
| `JOURNAL.md` | journal de recherche : hypothèses, essais, résultats, conclusions |

## Scènes

`foret` (30 obstacles fixes), `carrefour` (flux croisés de mobiles), `couloir` (mur percé d'un passage étroit), `piege` (cul-de-sac en U), `foule` (16 mobiles errants), `foule_dense` (26 mobiles plus rapides), `carrefour_rapide` (14 mobiles jusqu'à 1,8 m/s, plus rapides que le robot).

Chaque monde est vérifié faisable : un chemin existe pour le robot avec 5 cm de marge.

## Lancer

```bash
pip install numpy matplotlib
CONDS=nominal,perception,latence,glissement,carte_inconnue,reactifs,enfer \
  python3 bench.py 900:940 final.csv 27,3,28,2,1,0   # évaluation finale de VIGIE 2
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
