# Plan de la séance 8 (écrit avant les essais, 23 novembre 2026)

Trois chantiers demandés après l'évaluation finale, dans cet ordre : toutes les difficultés à la fois, battre T-MPC++, porter VIGIE en C++. Puis les pistes restantes. Les règles de la séance 7 restent en vigueur : mondes neufs pour juger, lecture fixée avant l'essai, comparaisons appariées avec intervalle de confiance à 95 % (bootstrap, 4 000 tirages), résultats rapportés même quand ils déplaisent.

## 1. Toutes les difficultés à la fois

Dans la vraie vie, un robot cumule les ennuis : il voit mal, ses mesures arrivent en retard, ses roues patinent, il découvre la carte en roulant, les gens réagissent à lui, et son ordinateur met du temps à réfléchir. Jusqu'ici, l'évaluation finale testait ces difficultés séparément (vision complète, perception limitée, piétons réactifs).

**Conditions** (sim.py) :

- `tout` : les sept perturbations du banc ensemble. Vue limitée à 5 m, masquage par les obstacles, 10 % de détections perdues ; deux périodes de retard de mesure en plus de celle de la chaîne lidar ; roues qui patinent (erreur de gain et dérive tirées par monde) ; carte inconnue au départ (seuls les obstacles à moins de 5 m sont connus, les autres sont découverts en roulant, mémoire de carte identique pour toutes les méthodes) ; piétons qui réagissent au robot. Reproductible au bit près.
- `tout_calcul` : la même chose, et le temps de calcul compte. Le planificateur est appelé quand il a fini le calcul précédent ; s'il est encore occupé, le cycle passe sans nouvelle commande (le robot garde la dernière) ; sa commande prend effet après la chaîne de 50 ms plus son propre temps de calcul mesuré. Temps mesurés à l'horloge pendant l'essai : programmes Python, un processus par cœur (4 processus, 4 cœurs Xeon 2,1 GHz), rien d'autre de lourd en même temps. Cette condition n'est donc pas reproductible au bit près ; on enregistre le temps moyen, le pire cas et le nombre de cycles sautés de chaque essai.

Vérifications avant de lancer (tests_banc.py, test 34) : sans retard de calcul, la file de commandes refait exactement la trajectoire d'origine ; une commande calculée en 120 ms agit au 17e pas interne ; épisodes de référence de la séance 7 identiques au bit près.

**Méthodes** : VIGIE 6 (71), VIGIE 6 à 400 tirages (74, aussi bonne à budget égal d'après le contrôle A et plus rapide), T-MPC++ (49), DRA-MPPI réglé (54).

**Mondes** : graines neuves 6000 à 6059, les 11 scènes, deux conditions : 60 × 11 × 2 × 4 = 5 280 essais.

**Lecture fixée d'avance** (évaluation seulement, aucune méthode n'est adoptée ou rejetée ici) :

- par condition : VIGIE 6 contre DRA-MPPI, VIGIE 6 contre T-MPC++, VIGIE 6 à 400 tirages contre VIGIE 6 ; succès, collisions en roulant, temps de trajet ;
- effet du calcul : pour chaque méthode, `tout_calcul` contre `tout` sur les mêmes mondes ;
- si VIGIE 6 à 400 tirages fait significativement mieux que VIGIE 6 dans `tout_calcul`, c'est elle qu'on retient pour un robot réel et pour le portage C++.

Limite déclarée : les temps de calcul sont ceux de nos programmes Python. Un portage C++ les divise (chantier 3) ; T-MPC++ et DRA-MPPI n'en ont pas, ce qui interdit de conclure sur le classement « en C++ ».

## 2. Battre T-MPC++

À l'évaluation finale, VIGIE 6 et T-MPC++ font jeu égal (+0,5 point, de −0,8 à +1,7). T-MPC++ gagne à la porte étroite (−8,0 pour VIGIE) et peut-être en foule dense (−5,3, limite), et il va 1,9 s plus vite par trajet ; VIGIE gagne aux carrefours (+6,0 et +6,3).

- **Développement** : graines 7000 à 7039 (jamais utilisées), trois conditions de l'évaluation finale. On étudie les essais perdus face à T-MPC++, monde par monde, avant de proposer quoi que ce soit.
- **Validation** : graines neuves 7100 à 7159, 11 scènes, trois conditions, contre VIGIE 6 et T-MPC++.
- **Règle d'adoption** : une variante remplace VIGIE 6 si elle fait au moins 1 point de mieux que VIGIE 6 en validation, sans recul significatif dans aucune condition. On dira que VIGIE **bat** T-MPC++ seulement si l'écart à T-MPC++ en validation est significatif (intervalle entièrement au-dessus de zéro).

## 3. Portage C++ de VIGIE

- **But** : un VIGIE qui tienne ses dix décisions par seconde même dans le pire cas, sur un ordinateur embarqué.
- **Fidélité** : mêmes entrées, mêmes décisions que le Python (écart maximal 1e-9 sur la commande), vérifiée sur des états enregistrés pendant de vrais épisodes de plusieurs scènes et conditions, comme pour le portage JavaScript.
- **Mesure** : temps moyen et pire cas par décision, sur un cœur, avec 912 et 400 tirages. Critère : pire cas sous 100 ms.

## 4. Pistes restantes

Plancher de 0,15 m/s de la prudence aux angles morts ; séparation initiale des piétons ; ce que les chantiers 1 à 3 feront apparaître. Chacune jugée avec la même règle que le chantier 2.

## 5. Ajout après le chantier 3 (écrit avant les essais) : le calcul au rythme du C++

Le chantier 1 a montré qu'avec les temps de calcul Python, VIGIE perd son avance sur DRA-MPPI (+0,3, non significatif). Le portage C++ donne les mêmes commandes (écart maximal 7e-10) avec un pire cas mesuré de 40 ms sur ce PC. On rejoue donc les mêmes mondes avec un délai de calcul fixe, reproductible :

- `tout_c50` : toutes les difficultés, chaque commande prend effet 50 ms après la chaîne (borne du C++ sur PC) ;
- `tout_c100` : la même chose avec 100 ms (calculateur embarqué environ deux fois et demie plus lent ; c'est la limite au-delà de laquelle des cycles sautent).

Mêmes graines (6000 à 6059), 11 scènes, mêmes 4 méthodes : 5 280 essais. Lecture fixée d'avance : VIGIE 6 contre DRA-MPPI et contre T-MPC++ dans chaque condition, et pour chaque méthode l'écart à `tout`. T-MPC++ reçoit le même délai par hypothèse : il n'est pas porté en C++, on ne sait pas s'il tiendrait ce rythme. La conclusion portera sur VIGIE contre DRA-MPPI, les deux seules méthodes mesurées en C++.
