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

**Précision ajoutée le 24 novembre, avant tout essai sur ces graines :** la troisième relecture a montré que, dans les mondes d'origine, les piétons traversent les obstacles fixes de quatre scènes. Développement et validation de ce chantier se feront donc sur les mondes corrigés (version 2, piétons au modèle simple), avec le robot réaliste, comme la campagne de la section 6. Les graines, la règle d'adoption et le critère « bat » ne changent pas. La comparaison de référence pour la variante sera VIGIE 6 et T-MPC++ sur ces mêmes mondes corrigés.

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

## 6. Mondes corrigés (version 2), après la troisième relecture extérieure (écrit avant les essais)

La relecture de l'application 1.3.0 a mis au jour un défaut du simulateur, confirmé dans le banc : les piétons ignorent les obstacles fixes (ils traversent les murs du carrefour, du couloir et du piège) et leur placement initial n'est pas vérifié.

**Correction** (`sim.World(..., version=2)` ou `MONDE=2`, la version 1 reste celle par défaut, inchangée au bit près) :

- placement : toute personne qui empiète sur un obstacle (marge 10 cm), sur une personne déjà placée (marge 5 cm), sur le départ (1,6 m) ou sur la zone d'arrivée est déplacée le moins possible, par une recherche autour de sa position d'origine avec un générateur séparé ; la densité et la disposition de la scène sont conservées ;
- mouvement : un piéton qui heurte un obstacle fixe glisse le long de lui à sa vitesse puis reprend sa direction ; coincé dans un passage trop étroit, il tourne d'un quart de tour.

Contrôle sur les graines 8000 à 8039 : plus aucun chevauchement au départ (aucun échec de placement) ; pendant le trajet, il reste des contacts rares (moins de 0,2 % des pas) et peu profonds (10 cm au plus, contre des murs entièrement traversés avant). Les piétons ne s'évitent toujours pas entre eux (déclaré ; ce sera l'objet du test d'un second modèle de piétons).

**Campagne** : graines neuves 8000 à 8059, 11 scènes, les trois conditions de l'évaluation finale (vision complète, perception limitée, piétons réactifs), robot réaliste, méthodes VIGIE 6 (71), T-MPC++ (49), DRA-MPPI réglé (54) : 5 940 essais.

**Lecture fixée d'avance** : VIGIE 6 contre DRA-MPPI et contre T-MPC++, globalement et par condition, avec le même bootstrap apparié (et sa version par grappes et par scène). L'avance de VIGIE sur DRA-MPPI est dite **robuste à la correction** si elle reste significative sur ces mondes. Les quatre scènes touchées (carrefour, carrefour rapide, couloir, piège) sont aussi lues à part. Aucune méthode n'est modifiée ou réglée sur ces mondes.

## 7. Un second modèle de piétons (écrit avant les essais)

Idée reprise de PEDS (IEEE RA-L 2026) : la réussite d'un même robot peut varier de 14 points, et jusqu'à 30 en foule dense, selon le modèle qui fait marcher les piétons. Nos piétons « simples » suivent leur vitesse voulue sans s'éviter entre eux. On ajoute un second modèle, les forces sociales de Helbing et Molnár (1995), avec les paramètres de Helbing et al. (2000) ramenés à l'unité de masse : chacun tend vers sa vitesse voulue (temps de relaxation 0,5 s), s'écarte des autres (A = 2,1 m/s², B = 0,3 m, champ de vision anisotrope λ = 0,35) et des obstacles fixes (A = 3, B = 0,2 m). Les intentions (changements de direction, arrêts, accélérations, poursuite, passage de la porte) et la réaction au robot (condition « piétons réactifs ») restent celles du modèle simple ; seul le mouvement entre les personnes change. Mondes version 2 seulement (`PIETONS=sfm`).

Contrôle sur les graines 8000 à 8019 : contacts entre piétons divisés par 3 à 50 selon la scène (foule dense 0,057 → 0,017 contact par piéton et par pas ; porte étroite 0,54 → 0,010), vitesse moyenne réduite de 5 à 12 %. Il reste des contacts quand une personne qui sort d'un côté de l'arène réapparaît de l'autre sur quelqu'un (traversée, porte étroite).

**Campagne** : mêmes graines (8000 à 8059), mêmes 11 scènes, mêmes trois conditions et mêmes trois méthodes que la campagne §6 : 5 940 essais.

**Lecture fixée d'avance** : VIGIE 6 contre DRA-MPPI et contre T-MPC++ avec ce modèle de piétons. L'avance de VIGIE est dite **robuste au modèle de piétons** si elle reste significative contre DRA-MPPI. Pour chaque méthode, on donne aussi l'écart de réussite entre les deux modèles de piétons sur les mêmes mondes de départ (ce n'est pas une comparaison de méthodes, c'est la sensibilité de chacune au modèle).

## 8. Des idées propres à VIGIE (écrit le 24 novembre, avant tout essai)

Jusqu'ici, VIGIE assemble surtout des briques publiées : la probabilité de collision de DRA-MPPI, la règle de cohérence et l'option libre de T-MPC++. Ses apports à lui sont la route espace-temps (le chemin qui sait attendre), la marge qui s'ouvre avec le temps et la prudence aux angles morts. Les deux campagnes sur les mondes corrigés montrent un défaut précis : devant un flux continu (porte étroite, piétons à forces sociales), VIGIE attend une ouverture et dépasse le temps (103 échecs sur 180, dont la plupart en temps dépassé). On essaie deux idées à nous, chacune seule puis ensemble.

**Idée A : un seul budget d'échec.** Le banc compte comme échec aussi bien un choc qu'un temps dépassé ; VIGIE, lui, ne pèse que le risque de choc, et l'attente ne lui coûte qu'un petit coût de lenteur. Variante : VIGIE estime à chaque décision la probabilité d'arriver hors délai à son rythme actuel (distance restante sur la route, vitesse moyenne récente, temps restant), et le risque de choc qu'il accepte augmente avec ce risque de retard, de façon à minimiser la somme des deux. Le principe de planifier sous un risque d'échec borné est connu (Blackmore et al. 2011 ; Ono et al. 2013) ; ce qui serait propre à VIGIE, c'est de l'appliquer en ligne, dans un planificateur par tirages en foule, avec un risque de retard estimé sur sa propre progression. Nous ne l'avons pas trouvé tel quel dans la littérature consultée.

**Idée B : prévoir les créneaux d'un flux.** L'horizon de VIGIE (2,5 s) est trop court pour voir arriver une ouverture. Variante : VIGIE mémorise, pour chaque passage étroit de sa carte, les instants de passage des personnes qu'il a suivies, en déduit le débit et la loi des intervalles entre deux personnes, et sa route espace-temps réserve le prochain créneau assez long au lieu d'attendre qu'il apparaisse dans l'horizon. Les travaux trouvés sur l'insertion d'un robot dans un flux (Shigemoto et al. 2024 et 2025) suivent le flux ; aucun, à notre connaissance, ne prédit ainsi les créneaux pour planifier dans l'espace et le temps.

**Méthode** (les règles de la section 2 s'appliquent) :
- Développement : graines 7000 à 7039, mondes corrigés, trois conditions (essais de référence de la section 2 réutilisés), plus les mêmes graines avec les piétons à forces sociales pour la porte étroite. On ne règle rien sur les graines 8000 à 8059.
- Validation : graines neuves 7100 à 7159, 11 scènes, trois conditions, mondes corrigés, piétons simples, puis les mêmes avec les forces sociales ; VIGIE 6, la variante retenue, T-MPC++ et DRA-MPPI.
- Adoption : au moins 1 point de mieux que VIGIE 6 en validation (piétons simples), sans recul significatif dans aucune condition ni avec les forces sociales. Une idée qui échoue est publiée comme abandonnée, avec ses chiffres.

## 9. Deux idées de plus, et un critère de robustesse (écrit le 24 novembre, avant la campagne de mise au point)

Demande : un algorithme qui ne gagne pas ici pour perdre là, avec des pertes réduites au maximum. Diagnostic sur deux graines de développement (porte étroite, forces sociales, 7001 et 7003) : VIGIE 6 s'arrête à 1,4 m du mur et attend 35 s ; T-MPC++ passe en 10 à 20 s en longeant le bord de l'ouverture.

**Idée C : prédiction multi-modèles.** Chaque personne est prédite par trois modèles, vitesse constante, ralentissement et forces sociales entre personnes, pondérés en ligne par leur justesse sur elle durant la dernière seconde (plancher de 10 % par modèle). Vise la sensibilité au modèle de piétons (VIGIE 6 perd 10 points quand les piétons s'évitent). Les filtres à modèles multiples (IMM) existent pour le suivi ; les appliquer ainsi dans le coût de risque d'un planificateur par tirages est notre choix.

**Idée D : engagement réversible.** Chaque option est prolongée par sa première seconde puis un freinage franc jusqu'à l'arrêt ; le risque de cette manœuvre de secours s'ajoute à son coût. On préfère les options après lesquelles on peut encore renoncer sans heurter personne. Parent connu : les commandes prédictives « à secours » (contingency MPC) ; l'appliquer comme critère de choix entre les options de VIGIE est notre choix.

**Précision sur l'idée A**, après les deux graines de diagnostic : sous forme de poids du risque réduit, elle ne changeait rien (le seuil dur dominait). Version retenue pour la mise au point : chaque trajectoire essayée reçoit le P(retard) où elle laisserait le robot au bout de l'horizon, pondéré comme un choc certain sur tout l'horizon. Choc et retard sont comptés dans la même unité.

**Mise au point** : graines 7000 à 7019, 11 scènes, trois conditions, mondes corrigés ; variantes A, B, C, D et les quatre ensemble (indices 77 à 81) ; et avec les forces sociales pour la porte étroite, la foule, la foule dense et les angles morts (VIGIE 6 et T-MPC++ compris). On retient au plus deux variantes pour la validation.

**Critère de robustesse ajouté à la règle d'adoption** (en plus de la section 8) : en validation, aucune scène où la variante est significativement en dessous de VIGIE 6, et on publie pour chaque scène l'écart à la meilleure des deux références. On dira que l'algorithme « ne perd nulle part » seulement si aucune scène n'est significativement en dessous de la meilleure référence, avec les deux modèles de piétons.
