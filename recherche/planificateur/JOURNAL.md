# Journal de recherche : un nouvel algorithme de planification et de suivi

## Séance 1 · 15 novembre 2026

### Point de départ

Objectif fixé : trouver un concept de planification et de suivi de trajectoire plus performant que ce qui existe, en allant chercher des idées dans tous les domaines, puis le tester, le vérifier et le comparer honnêtement aux meilleures méthodes.

### 1. Ce que dit la littérature

La revue complète est dans `CARTOGRAPHIE.md`. À retenir :

- Le domaine est très actif et encombré. Beaucoup d'idées « venues d'ailleurs » ont déjà été essayées : champs de potentiel (électrostatique), fourmis, Physarum, intégrale de chemin (physique statistique, à l'origine de MPPI), bandes élastiques, diffusion.
- La référence récente la plus proche de nos idées est le **MPPI multimodal** (2025) : plusieurs MPPI en parallèle, un par route topologiquement différente.
- L'idée de « garder un début de trajectoire commun tant que le futur est incertain » existe déjà sous les noms de commande **contingente** ou **en branches**, y compris dans une version MPPI (2024).
- Aucune publication repérée n'utilise la règle du τ̇ de la psychologie écologique comme filtre de sécurité d'un MPPI, ni l'accumulation de preuves (modèle de dérive-diffusion) pour choisir entre routes. Absence de résultat ne veut pas dire absence de travaux : une revue plus poussée sera nécessaire avant de revendiquer une nouveauté.

### 2. Le laboratoire

Construit avant toute invention, parce que sans banc d'essai fiable, on ne peut rien affirmer :

- robot unicycle avec limites réalistes d'accélération, bruit d'actionneur et de mesure ;
- 7 scènes, dont des obstacles mobiles qui **changent d'intention sans prévenir** (tourner, s'arrêter, accélérer) et des mobiles plus rapides que le robot ;
- références : A* + poursuite pure, DWA, MPPI, MPPI multimodal ;
- un **oracle** (MPPI qui connaît le futur exact des obstacles) pour mesurer la marge réellement disponible ;
- comparaisons appariées avec intervalles de confiance, et graines d'évaluation jamais utilisées pour régler.

### 3. Les essais

| Version | Idée | Inspiration | Résultat |
|---|---|---|---|
| v1 | routes topologiques + choix par valeur d'option sur 5 futurs + gouverneur τ̇ | topologie, finance (options réelles), météorologie (ensembles), psychologie écologique | **échec** : 81 % de succès contre 96 % pour le MPPI multimodal. Noter chaque échantillon sur tous les futurs rend le robot trop prudent : il hésite, perd du temps, finit par se faire percuter. |
| v2 | futurs qui divergent progressivement, ensemble utilisé seulement pour choisir le mode, hystérésis | idem, plus le modèle de dérive-diffusion | **égalité** avec les références (91 % contre 92 %), mais plus lent |
| v3 | coût en temps avant collision (loi des piétons de Karamouzas) et garde d'atteignabilité | physique des foules, sûreté passive | **pas de gain** significatif ; la garde seule dégrade |
| v4 | feux d'alignement avant les goulets et attention (exploration resserrée près des obstacles) | navigation maritime, attention visuelle | gain apparent qui venait d'un **défaut du banc** (couloirs parfois infranchissables). Après correction, **dégradation** de 10 points |

Le gouverneur τ̇ ne s'est presque jamais déclenché : MPPI garde déjà assez de marge pour que la règle de freinage ne serve pas dans ces scènes.

### 4. Défauts du banc découverts et corrigés en cours de route

1. La graine du bruit de mesure dépendait de `hash()` de Python, qui change à chaque processus : résultats non reproductibles. Corrigé.
2. Quelques couloirs étaient infranchissables (obstacle aléatoire dans l'ouverture). Le générateur vérifie maintenant la faisabilité.
3. Le bruit de mesure consommait le même générateur aléatoire que l'évolution du monde, donc l'oracle ne voyait pas le vrai futur. Corrigé.

Les résultats v1 à v3 ont été obtenus avant ces corrections. Seule la campagne finale ci-dessous fait foi.

### 5. Campagne finale (graines 300 à 329, 7 scènes, 1 680 épisodes)

| Méthode | Succès | Collisions | Temps moyen | Calcul |
|---|---|---|---|---|
| Oracle (connaît le futur) | 99 % | 1 % | 17,5 s | 8 ms |
| MPPI | 94 % | 6 % | 17,8 s | 2 ms |
| Options topologiques v2 | 94 % | 5 % | 21,4 s | 19 ms |
| MPPI multimodal | 93 % | 5 % | 18,7 s | 17 ms |
| MPPI + coût τ (Karamouzas) | 91 % | 8 % | 19,2 s | 11 ms |
| MPPI + feux d'alignement | 84 % | 6 % | 19,6 s | 4 ms |
| DWA | 80 % | 3 % | 14,8 s | 1 ms |
| A* + poursuite pure | 55 % | 45 % | 12,8 s | 1 ms |

Détails par scène dans `resultats_final.md`, graphique dans `succes_final.png`.

### 6. Ce qu'on a appris

**Aucune de nos variantes ne bat MPPI sur l'ensemble des scènes.** C'est le résultat honnête de cette séance.

Mais deux constats orientent la suite :

1. **La marge restante est petite dans ce banc** : l'oracle fait 99 %, MPPI 94 %. Un algorithme parfait en prédiction ne gagnerait que 5 points. Pour qu'une invention puisse montrer sa valeur, il faut des conditions où les méthodes actuelles échouent vraiment.

2. **La valeur d'option dépend du type d'incertitude**, et c'est le résultat le plus intéressant de la séance :
   - dans la **foule errante** (obstacles qui changent souvent de direction au hasard), les options topologiques v2 font **97 % contre 77 %** pour MPPI : +20 points, intervalle de confiance à 95 % [+3 ; +37], 7 mondes gagnés pour 1 perdu ;
   - dans le **carrefour rapide** (obstacles rapides mais prévisibles), elles font **80 % contre 97 %** : −17 points, intervalle [−30 ; −3], 0 gagné pour 5 perdus.

   Garder ses options paie quand le futur est vraiment imprévisible, et coûte cher quand il faut décider vite face à des mobiles prévisibles. La figure `trajectoires_foule_301.png` montre aussi le défaut à corriger : des boucles d'hésitation (41 s au lieu de 16 s).

### 7. Prochaine séance

**Hypothèse à tester (v5) : une valeur d'option qui s'adapte à la prévisibilité mesurée.** Les météorologues vérifient en permanence si l'éventail de leurs prévisions d'ensemble correspond aux erreurs réellement observées. On fera de même : pour chaque obstacle, on mesure en ligne l'erreur entre sa position prédite il y a une seconde et sa position réelle. Si l'obstacle est prévisible, on resserre l'éventail des futurs et le robot décide vite. S'il est erratique, on l'ouvre et le robot garde ses options. Ajouter aussi un coût d'hésitation pour supprimer les boucles.

Critère de réussite fixé à l'avance : faire au moins aussi bien que MPPI dans chaque scène (pas de perte significative) et mieux dans la foule errante, sur des graines neuves.

**Durcir le banc**, pour mesurer là où les méthodes actuelles échouent vraiment :
- perception limitée (portée de 5 m, obstacles masqués derrière d'autres) ;
- carte inconnue au départ ;
- obstacles qui réagissent au robot (évitement réciproque) ;
- latence de 100 à 200 ms entre mesure et commande ;
- glissement des roues, robot plus lent que les obstacles.

**Pistes encore non testées** de la cartographie : paysage de la peur (carte de risque apprise des quasi-collisions), lignes de désir (routes qui se renforcent avec l'usage).

## Séance 2 · 15 novembre 2026 : VIGIE

### Consigne

Aller au-delà des algorithmes existants : mettre au point un planificateur nouveau, fonctionnel, qui résiste à des tests de robustesse sévères, et le montrer dans l'application Windows et mobile.

### Le banc d'essai durci

Sept conditions, appliquées à chacune des sept scènes :

| Condition | Ce qu'elle simule |
|---|---|
| nominal | bruits de mesure et d'actionneur seulement |
| perception | portée de 5 m, masquage par les autres obstacles, 10 % de détections perdues |
| latence | 200 ms entre la mesure et la commande |
| glissement | modèle faux : gain des roues de 0,75 à 1,2, dérive en rotation |
| carte_inconnue | obstacles fixes découverts en roulant (portée 6 m) |
| reactifs | 70 % des agents s'écartent du robot quand il approche |
| enfer | toutes les perturbations à la fois |

Tous les planificateurs passent par la même mémoire de carte (les obstacles fixes vus restent connus).

### L'idée

Le résultat clé de la séance 1 : garder ses options ouvertes aide face aux agents erratiques, nuit face aux agents prévisibles. D'où **VIGIE** :

- **V**aleur d'option : on choisit le début de trajectoire qui minimise la moyenne, sur les futurs possibles, de la meilleure suite disponible ;
- **I**mprévisibilité mesurée en ligne pour chaque agent : erreur de prédiction à 1 s, lissée, qui règle l'ouverture de l'éventail des futurs de cet agent seulement ;
- **G**estes réflexes (freiner, esquiver) mis en concurrence avec les plans, mais autorisés seulement quand tous les plans sont menacés ;
- **I**nertie d'engagement : changer de route a un coût ;
- **E**nsemble de routes qui contient toujours le plan MPPI de base.

### Itérations sur les graines de développement (500 à 507)

| Étape | Problème observé | Correction |
|---|---|---|
| VIGIE 1 | le réflexe « freiner » gagnait presque toujours dans les couloirs : robot figé (jusqu'à 383 pas sur 450) | réflexes autorisés seulement si le risque attendu de tous les plans dépasse 25 % |
| ablation | le tube d'incertitude élargi dans l'échantillonnage dégradait les résultats | brique retirée |
| VIGIE 2 | échecs sous perception dégradée | diagnostic : la mesure d'imprévisibilité comparait des positions séparées de plus d'1 s après une disparition, d'où des agents jugés erratiques à tort ; mesure corrigée pour utiliser le temps réel écoulé |
| permanence de l'objet | garder en mémoire les agents masqués (idée de Piaget) | pas de gain mesurable : retirée du cœur, gardée comme variante |
| 4 routes | une route de plus | pas de gain : on garde 3 routes, moins coûteuses |

L'algorithme a ensuite été figé avant l'évaluation finale.

### Évaluation finale (graines 600 à 619, jamais utilisées pour régler)

7 scènes × 7 conditions × 20 mondes = 980 épisodes par méthode, 4 900 au total. Résultats complets : `resultats_final2_cond.md` (par condition) et `resultats_final2_scene.md` (par scène).

| Méthode | Succès | Collisions | Temps moyen | À-coups | Calcul |
|---|---|---|---|---|---|
| MPPI multimodal (2025) | 97 % | 2 % | 19,2 s | 16,3 | 16,6 ms |
| **VIGIE** | **96 %** | **3 %** | **18,5 s** | **15,2** | **15,4 ms** |
| MPPI | 94 % | 6 % | 17,8 s | 11,4 | 2,3 ms |
| DWA | 81 % | 3 % | 14,9 s | 4,7 | 0,9 ms |
| A* + poursuite pure | 61 % | 39 % | 13,4 s | 4,0 | 0,9 ms |

Comparaisons appariées (mêmes mondes) :
- VIGIE contre MPPI : **+2,2 points**, IC 95 % [+0,8 ; +3,8], 38 mondes gagnés, 16 perdus. **Significatif.**
- VIGIE contre MPPI multimodal : **−1,0 point**, IC 95 % [−2,3 ; +0,3], 17 gagnés, 27 perdus. **Pas de différence significative.**

Par condition, VIGIE fait mieux que le MPPI multimodal avec roues qui patinent (96 contre 94) et termine plus vite dans « enfer » (20,3 s contre 22,0 s, même succès de 99 %). Il fait moins bien en nominal et avec latence (94 contre 98).

Contre-vérification par une seconde implémentation indépendante (JavaScript, celle de l'application), graines 700 à 711 : VIGIE 92,9 %, MPPI 90,2 %, VIGIE devant dans 6 conditions sur 7 (`js_contre_verif.csv`).

### Ce qu'on peut affirmer, et ce qu'on ne peut pas

- VIGIE est un planificateur **nouveau dans sa combinaison**. Après recherche bibliographique, nous n'avons trouvé aucune publication qui règle l'ouverture d'un éventail de futurs par une imprévisibilité mesurée agent par agent et qui choisit entre routes topologiques et réflexes par valeur d'option. Chaque brique isolée a des parents connus (MPPI, commande contingente, prédiction conforme adaptative). Une revue plus poussée reste nécessaire avant de publier.
- Il **fonctionne** et il est **robuste** : il bat significativement MPPI sous toutes les perturbations réunies et ne s'effondre dans aucune condition.
- Il **ne bat pas** la meilleure méthode récente sur l'ensemble des tests : il fait jeu égal avec elle, plus rapide et plus doux, mais un peu moins sûr en conditions nominales.
- Les tests sont en simulation. Rien ne garantit le même comportement sur un robot réel.

### Prochaines étapes

1. Comprendre les pertes en nominal et en latence face au MPPI multimodal : piste d'un éventail qui tienne compte du retard des mesures.
2. Publier le banc d'essai et ses résultats pour que d'autres puissent reproduire.
3. Prototype réel : robot différentiel avec lidar 2D, suivi des personnes, VIGIE comme module de ROS 2 Nav2, essais progressifs avec des mannequins mobiles avant des personnes.

### Ablation sur les graines d'évaluation (600 à 605, 294 épisodes par variante)

| Variante | Succès | Apport de la brique | IC 95 % |
|---|---|---|---|
| VIGIE complet | 96,6 % | – | – |
| sans valeur d'option | 95,6 % | +1,0 | [−0,7 ; +2,7] |
| sans mesure d'imprévisibilité | 95,6 % | +1,0 | [−1,0 ; +3,1] |
| sans gestes réflexes | 95,9 % | +0,7 | [−1,0 ; +2,4] |
| sans inertie d'engagement | 96,6 % | 0,0 | [−1,7 ; +1,7] |

Sur les mondes de test, chaque brique apporte au plus un point, et aucun de ces apports n'est significatif pris isolément. Les effets plus marqués observés en développement (jusqu'à 9 points) ne se confirment pas : ils dépendaient en partie des mondes utilisés pour régler. C'est la raison même de séparer développement et évaluation.

## Séance 3 · VIGIE 2

### Objectif

Combler l'écart avec le MPPI multimodal dans toutes les conditions, sans régler sur les mondes de test : analyse sur de nouvelles graines de développement (800 à 811), évaluation finale sur des graines jamais vues (900 à 939, deux fois plus de mondes qu'avant).

### Diagnostic

Sur les graines 800 à 811, VIGIE et le MPPI multimodal sont à égalité parfaite (16 mondes gagnés chacun). Un cas ressort : le couloir 807, où VIGIE reste bloqué dans 5 conditions sur 7. L'enquête trouve deux causes.

1. **Défaut partagé par tous les MPPI** : la carte des distances au but donnait une valeur « infranchissable » en escalier aux cases proches des murs. Un plan qui frôlait le bord d'un passage était jugé catastrophique. Corrigé pour tous les planificateurs : le champ est maintenant prolongé de façon continue dans les zones occupées, les obstacles restant punis par le coût de collision.
2. **Faiblesse connue de MPPI** : avec un bruit indépendant à chaque pas, les tirages se compensent et le robot n'« imagine » presque jamais un virage franc. Après avoir évité un passant en remontant le long du mur, il ne revient jamais vers le passage.

### VIGIE 2

| Brique ajoutée | Rôle |
|---|---|
| quatre routes au lieu de trois | même budget de calcul que le MPPI multimodal (384 trajectoires par cycle) |
| arcs de virage injectés | 9 arcs francs parmi les tirages, pour pouvoir vraiment tourner |
| réensemencement | à chaque mise à jour des routes, on compare le plan hérité et un plan neuf tracé vers la route, on garde le meilleur |
| prédicteur de Smith | avec un retard connu, on rejoue les commandes déjà envoyées pour estimer l'état présent, et on avance les agents d'autant |

Pour une comparaison équitable, la référence est aussi évaluée **avec** le même prédicteur de Smith.

Sur les graines de développement : VIGIE 2 à 98 %, MPPI multimodal à 96 % (+1,9 point, IC 95 % [+0,2 ; +3,6]), MPPI multimodal avec prédicteur de Smith à 97 % (+1,2 point, IC [−0,3 ; +2,7]).

### Évaluation finale de VIGIE 2 (graines 900 à 939, jamais vues)

7 scènes × 7 conditions × 40 mondes = 1 960 épisodes par méthode, 11 760 au total. Détails : `resultats_final3_cond.md` et `resultats_final3_scene.md`.

| Méthode | Succès | Collisions | Temps moyen | Calcul |
|---|---|---|---|---|
| **VIGIE 2** | **95 %** | 4 % | **19,0 s** | 18,0 ms |
| MPPI multimodal + prédicteur de Smith | 95 % | 4 % | 19,3 s | 17,4 ms |
| MPPI multimodal (2025) | 94 % | 5 % | 19,7 s | 17,2 ms |
| MPPI | 94 % | 5 % | 18,5 s | 2,8 ms |
| DWA | 74 % | 4 % | 15,3 s | 1,4 ms |
| A* + poursuite pure | 61 % | 39 % | 13,5 s | 0,9 ms |

Comparaisons appariées sur le taux de succès (VIGIE 2 − autre) :
- contre MPPI multimodal + Smith : +0,3 point, IC 95 % [−0,8 ; +1,3] ;
- contre MPPI multimodal : +0,8 point, IC [−0,3 ; +1,9] ;
- contre MPPI : +1,0 point, IC [−0,3 ; +2,2].

Aucun de ces écarts n'est significatif. **L'avance observée en développement (+1,9 point) ne se confirme pas.**

Temps de trajet, sur les mondes réussis par les deux méthodes :
- contre MPPI multimodal + Smith : **−0,38 s**, IC [−0,52 ; −0,24] (1 800 paires), **significatif** ;
- contre MPPI multimodal : **−0,79 s**, IC [−0,93 ; −0,64], **significatif** ;
- contre MPPI : +0,49 s (MPPI plus rapide, mais avec 1 point de succès en moins, non significatif).

Point faible : perception dégradée, 91 % contre 95 % (−3,2 points, IC [−6,4 ; 0,0], à la limite de la significativité).

### Bilan honnête

- **Ce qui est acquis.** VIGIE 2 est un planificateur nouveau dans sa combinaison, fonctionnel, robuste aux sept conditions de perturbation. Il est au niveau de la meilleure référence récente pour la sécurité, et **plus rapide qu'elle de façon significative**, à sécurité égale.
- **Ce qui n'est pas acquis.** Il n'est pas significativement plus sûr que la meilleure référence. Sous perception dégradée, il fait un peu moins bien.
- **Le plafond du banc d'essai.** Toutes les variantes de MPPI sont entre 94 et 95 %. Les échecs restants semblent en grande partie inévitables (l'oracle de la séance 1 plafonnait à 99 %). Pour départager davantage, il faudrait des scènes où les méthodes actuelles s'effondrent vraiment, ou passer au réel.
- **La leçon de méthode.** Deux fois de suite, une avance mesurée sur les graines de développement a disparu sur les graines de test. Sans cette séparation, nous aurions annoncé une supériorité fausse.

### Ablation de VIGIE 2 (graines 900 à 907, 392 épisodes par variante)

| Variante | Succès | Apport de la brique | IC 95 % |
|---|---|---|---|
| VIGIE 2 complet | 97,7 % | – | – |
| sans prédicteur de Smith | 96,9 % | +0,8 | [−0,8 ; +2,3] |
| sans réensemencement | 98,7 % | −1,0 | [−2,3 ; 0,0] |
| sans arcs de virage | 98,7 % | −1,0 | [−2,6 ; +0,5] |

Aucun apport n'est significatif. Le réensemencement et les arcs, qui débloquaient le couloir 807 en développement, ne montrent pas de bénéfice global sur les mondes de test, et une légère tendance (non significative) à coûter un point. À réexaminer sur un échantillon plus grand avant de les garder ou de les retirer.

### Contre-vérification par l'implémentation JavaScript (graines 700 à 711)

VIGIE 2 (JavaScript) contre le MPPI de l'application : 95,5 % contre 90,7 %, +4,8 points, IC 95 % [+1,7 ; +7,9], 31 mondes gagnés et 11 perdus, VIGIE devant dans les 7 conditions. Attention : la référence est ici le MPPI simple de l'application, pas le MPPI multimodal, et les deux implémentations diffèrent par le nombre de tirages ; l'écart plus grand qu'en Python (+1,0) vient en partie de là.

## Séance 4 · Scènes dures, robot réaliste, VIGIE 3

### Scènes dures

Quatre scènes ajoutées pour trouver où la meilleure méthode échoue vraiment : `traversee` (34 personnes plus rapides que le robot, en flux continu dans les deux sens), `goulot` (porte de 1,6 m franchie à contre-sens par 14 personnes), `coin_aveugle` (couloir étroit percé d'ouvertures d'où surgissent des personnes pressées), `poursuite` (7 agents qui visent le robot).

Sur les graines 1000 à 1019, sans chaîne réaliste : traversée 55 % pour le MPPI multimodal, 65 % avec deux fois plus de calcul, 75 % pour l'oracle. L'optimiseur est le facteur limitant, pas la prédiction.

### Nouvelles briques

- **Route espace-temps** : A* dans (x, y, t), avec contrôle continu entre deux instants (sinon des agents rapides « traversent » le plan entre deux couches de temps). Le plan peut attendre sur place. Ajoutée au MPPI multimodal : traversée 55 % → 80 %, goulot 90 % → 100 % (graines 1000 à 1019, sans chaîne réaliste).
- **Tubes calibrés** : la place réservée autour de chaque agent dans l'espace-temps grandit selon son imprévisibilité mesurée.
- **Vitesse prudente aux angles morts** : derrière chaque bord d'obstacle qui cache une zone libre, on imagine une personne qui pourrait surgir à 1,5 m/s, et on roule assez lentement pour pouvoir s'arrêter. Les traiter comme de vrais obstacles figeait le robot.
- **Modèle interne appris en ligne** (inspiration : le cervelet) : chaque seconde, le planificateur cherche la constante de temps et l'accélération qui expliquent le mieux les vitesses mesurées à partir des commandes envoyées, et ses prédictions respectent cette réactivité.

### Robot réaliste (`robot_reel.py`)

Chaîne complète : retard de 50 ms de la commande, saturation des roues, régulateur PI par roue sur codeur de 1 024 points, couple limité par la vitesse et la batterie, frottements, masse de 25 kg et inertie, odométrie recalée par le lidar, vitesses des personnes estimées par filtre alpha-bêta, une période de retard supplémentaire de la chaîne lidar. Activé par `REEL=1`.

**Erreur trouvée et corrigée.** La première version du régulateur de roue était mal réglée : dépassement de plus de 200 % en rotation, et action intégrale qui s'emballait en saturation. Avec ce robot défectueux, toutes les méthodes s'effondraient (31 % pour le MPPI multimodal) et VIGIE 3 avec modèle interne faisait +18 points. **Ce résultat est annulé** : le modèle interne compensait en partie un robot mal réglé, pas un robot réaliste. Régulateur corrigé (gains 1,0 et 1,0, anti-emballement) : 90 % de la consigne de rotation en 0,2 s, dépassement inférieur à 2 %. La référence retrouve alors 100 % en forêt, foule et carrefour.

### Audit externe de la valeur d'option

Un audit réalisé par une autre IA à partir du code de l'application a relevé quatre points, tous justes :
1. E[min] est une borne optimiste : elle suppose que le robot saura quel futur se produit avant de choisir sa suite.
2. Le début de trajectoire évalué dure 0,8 s, alors qu'une seule commande de 0,1 s est exécutée avant de replanifier.
3. Un scénario s'appliquait à tous les agents à la fois, alors que chaque personne a son propre comportement (plus de 4 scénarios distincts nécessaires en moyenne par monde).
4. Recoller le début d'un plan à la suite d'un autre crée des sauts de commande irréalistes (environ 80 % des combinaisons dépassent les limites d'accélération).

Réponse : VIGIE 3 n'utilise plus la valeur d'option, et ses tubes sont calculés agent par agent. Une version corrigée de la valeur d'option est testée : `Vigie2C`, avec futurs tirés agent par agent, branchement au prochain cycle, prédictions qui respectent l'inertie, et critère mixte ½ E[min] + ½ min E pour ne pas surestimer les routes alternatives.

### Comparaison sur robot réaliste corrigé (graines 1100 à 1109, 11 scènes × 3 conditions, 330 épisodes par méthode)

| Méthode | Succès | Collisions | Temps |
|---|---|---|---|
| VIGIE 3 | 68 % | 30 % | 20,6 s |
| MPPI multimodal + prédicteur de Smith | 67 % | 31 % | 21,9 s |
| VIGIE 3 + modèle interne | 66 % | 31 % | 21,5 s |
| VIGIE 2 | 62 % | 25 % | 22,3 s |
| VIGIE 2 corrigé (audit) | 55 % | 38 % | 25,5 s |

Écarts appariés par rapport à la référence : VIGIE 3 +0,6 point (IC [−3,0 ; +4,2]), VIGIE 3 + modèle interne −0,6 (IC [−4,8 ; +3,6]), VIGIE 2 −5,5 (IC [−10,6 ; −0,3]), VIGIE 2 corrigé −11,8 (IC [−16,7 ; −7,0]).

Par scène, VIGIE 3 et sa variante font mieux dans le goulot (67 % contre 60 %) et les angles morts (80 % avec modèle interne contre 67 %), moins bien dans la forêt et la foule. La traversée et la poursuite tombent sous 10 % pour toutes les méthodes : avec un robot qui met plus d'une seconde à atteindre sa vitesse de croisière, face à des agents allant jusqu'à 2,4 m/s, ces scènes deviennent presque infaisables.

### Ce qu'on en retire

1. **Le réalisme change tout**, comme le craignait l'utilisateur : la route espace-temps qui apportait +25 points dans la traversée en simulation idéale n'apporte plus rien avec un robot réaliste, parce qu'elle suppose un horaire que le robot ne peut pas tenir.
2. **Aucune version de VIGIE ne bat significativement la meilleure référence** sur robot réaliste. VIGIE 3 fait jeu égal.
3. **La valeur d'option fait perdre des points** sur robot réaliste, et la version corrigée de l'audit encore plus : elle rend le robot plus hésitant, ce qui coûte cher quand le robot réagit lentement.
4. **Les gains les plus prometteurs** se trouvent dans les situations à visibilité réduite (angles morts) et dans les passages étroits à contre-courant, mais les échantillons sont encore trop petits pour conclure (30 mondes par scène).

### Prochaines pistes

- Rendre la route espace-temps compatible avec la dynamique réelle : la planifier avec le modèle interne identifié (accélérations atteignables), et non avec des déplacements d'une case par pas.
- Recalibrer les scènes dures pour un robot réaliste (agents moins rapides que le robot), sinon elles ne départagent personne.
- Évaluer les briques prometteuses (angles morts, goulot) sur des échantillons plus grands avant toute conclusion.

## Séance 5 · Audit du banc d'essai et VIGIE 4

### Tests de cohérence permanents (`tests_banc.py`)

À la demande de l'utilisateur (« la moindre erreur pourrait fausser les résultats »), un fichier de tests vérifie avant chaque campagne : catalogue sans doublon, reproductibilité, indépendance du monde vis-à-vis du bruit de mesure, détection de collision (instant du contact calculé à la main), latence exacte, portée et masquage des capteurs, exactitude de l'oracle, caractéristiques du robot réaliste, qualité de l'estimation des vitesses, mémoire de carte, faisabilité des mondes, intégrité des fichiers de résultats (mêmes mondes pour chaque méthode, sans doublon), séparation développement / évaluation, exactitude du prédicteur de Smith, latence communiquée, épisodes complets de chaque candidat sous robot réaliste, exécution effective de chaque brique, calcul statistique, respect des limites par le profil de vitesse.

État : **96 vérifications réussies, 0 échec.**

### Erreurs trouvées grâce à ces tests

| Erreur | Portée | Correction |
|---|---|---|
| attendu faux dans un test de collision (rayon du robot oublié) | le test seulement, le simulateur était juste | attendu recalculé : contact à 2,95 s |
| l'oracle simulait les poursuivants sans le robot (écart 2,3 m) | résultats de l'oracle en scène « poursuite » de la séance 4, qui ne servaient à aucune conclusion | futur simulé face au plan du robot ; exact quand le robot suit son plan |
| profil de vitesse : positions arrondies à la grille, d'où des vitesses de 2 m/s et des accélérations de 10 m/s² | code nouveau, avant toute campagne | positions continues et interpolation à accélération constante ; limites vérifiées (1,5 m/s, 1,2 et 1,6 m/s²) |
| constante non importée dans VIGIE 4 | campagne arrêtée au premier épisode, aucun résultat produit | corrigée |
| **VIGIE 4 court-circuitait ses briques héritées** (modèle interne, Smith, angles morts ne s'exécutaient pas) | code nouveau, avant toute campagne | architecture corrigée ; test qui vérifie l'exécution effective de chaque brique |
| deux classes portaient le même nom | risque de tester la mauvaise version | doublon supprimé ; test permanent d'unicité |

Vérification rétroactive : VIGIE 2, VIGIE 3, VIGIE 3 avec modèle interne et la référence avec prédicteur de Smith exécutaient bien toutes leurs briques ; leurs résultats antérieurs restent valables.

### Scènes recalibrées pour le robot réaliste

`traversee` : 26 personnes à 0,8 à 1,4 m/s (au lieu de 34 à 1,5 à 2,4) ; `poursuite` : 6 poursuivants à 0,75 à 1,05 m/s. Sur robot réaliste (graines 1200 à 1209) : référence 40 % dans le goulot contre 90 % pour l'oracle, 80 % contre 100 % dans la traversée, 60 % contre 80 % aux angles morts.

### VIGIE 4

Profil de vitesse espace-temps compatible avec la dynamique : pour chaque route topologique, programmation dynamique dans (temps, abscisse le long de la route, vitesse) avec les accélérations identifiées en ligne (avec 20 % de marge), la vitesse limitée dans les virages, et des tubes calibrés sur l'imprévisibilité de chaque agent. Plus prédicteur de Smith, vitesse prudente aux angles morts et modèle interne.

### Erreurs trouvées en examinant les échecs de VIGIE 4

Sur les graines 1200 à 1209 (robot réaliste), VIGIE 4 faisait 63 % contre 72 % pour la référence (−9,4 points, significatif). Examen d'un épisode raté dans la traversée :

1. **Le modèle interne v1 se trompait lourdement** : il estimait une constante de temps de 1,2 s en rotation. Cause : il associait chaque commande à la mesure suivante sans tenir compte du retard des mesures, et « expliquait » ce retard par un robot très lent. Ce défaut touchait aussi VIGIE 3 avec modèle interne (séance 4).
2. **Un premier ordre séparé pour la vitesse et la rotation ne peut pas représenter le robot** : quand il accélère et tourne à la fois, les deux roues se partagent le couple et le virage ralentit. Même ajusté sur les vraies vitesses, ce modèle garde 0,32 rad/s d'erreur en rotation.
3. **Décalage d'horaire d'un pas** dans les routes horodatées de VIGIE 3 et VIGIE 4 au cycle de leur création.

Corrections :
- **Modèle interne v2, par roue** (`WheelModelMixin`) : chaque roue a sa constante de temps et son accélération, réduite à haute vitesse (force contre-électromotrice). Erreur sur les vraies vitesses : 0,03 à 0,05 m/s et 0,12 à 0,17 rad/s.
- **Retard pris en compte** : identification et estimation de la vitesse présente alignées sur le retard des mesures + 1 pas. Règle établie en comparant aux vraies vitesses : l'erreur sur la vitesse présente passe de 0,16 à 0,05 m/s et de 0,39 à 0,17 rad/s (retard de 1 pas), de 0,24 à 0,05 m/s et de 0,64 à 0,17 rad/s (3 pas).
- Décalage d'horaire corrigé, avec un test dédié.

Tests de cohérence : **112 vérifications réussies, 0 échec.**

## Séance 6 · Trois étapes : confirmer scène par scène, chercher la cause réelle des échecs, évaluer sur des mondes neufs

### Erreur trouvée pendant l'étape 1 : routes horodatées empilées

Un essai de VIGIE 4 (porte, graine 1426) tournait depuis plus de vingt minutes. Le temps de calcul par cycle doublait tous les dix cycles. Cause : quand la recherche de routes ne trouvait aucun passage (porte bouchée), `MultiModalMPPI.refresh_modes` gardait les anciens modes tels quels, routes horodatées comprises. VIGIE 3 en ajoutait une à chaque rafraîchissement (croissance linéaire), VIGIE 4 en recalculait une pour chaque mode existant (croissance exponentielle : 6 puis 532 routes en 8 rafraîchissements).

| Portée | Correction |
|---|---|
| VIGIE 3, VIGIE 3W, VIGIE 4, VIGIE 4W dans les épisodes où la porte était bouchée, y compris en séance 5 (43 épisodes de VIGIE 4W avec un pic de calcul anormal dans l'étape 1 interrompue, 9 dans `reel_dev4.csv`) | les routes horodatées périmées sont retirées quand aucun passage n'est trouvé ; test 23, qui échoue sur l'ancien code |

L'étape 1 a été relancée entièrement. L'ancien fichier est gardé (`etape1_avant_correctif.csv`). La référence, qui n'a pas de route horodatée, donne exactement les mêmes 360 résultats avant et après : le correctif ne touche qu'aux méthodes visées.

### Étape 1 : porte, angles morts, poursuite (graines 1400 à 1459, robot réaliste, vision complète et perception limitée, 1 440 essais)

| Scène | Référence (MPPI multimodal + Smith) | VIGIE 3 | VIGIE 3W | VIGIE 4W |
|---|---|---|---|---|
| porte | 62 % | 68 % (+6,7 ; IC [−2,5 ; +15,8]) | 62 % | 53 % (−8,3 ; IC [−17,5 ; +0,8]) |
| angles morts | 45 % | 50 % | 52 % | 48 % |
| poursuite | 74 % | 72 % | 68 % | 75 % |

Aucun écart significatif. Détail : `etape1_analyse.md`.

### Étape 2 : la cause réelle des échecs

**Les mondes sont-ils franchissables ?** L'oracle (MPPI qui connaît le futur) ne fait que 50 % aux angles morts, moins que les méthodes testées : il est mal adapté à un couloir étroit et ne donne pas de borne fiable. Comme les personnes y vont tout droit à vitesse constante sans réagir au robot, on peut calculer une borne exacte : existe-t-il un profil de vitesse le long du couloir qui évite tout le monde ? Programmation dynamique dans (temps, abscisse, vitesse) sur le vrai futur (`faisabilite.py`). Vérifiée sur trois cas connus : couloir vide 11,5 s (11,47 s à la main), personne immobile au milieu : impossible, traversée au mauvais moment : 12,3 s. Une première version arrondissait la position à chaque pas et rendait le robot 7 % trop rapide ; grille rendue exacte avant tout calcul. Résultat : **60 mondes sur 60 franchissables**, même avec les accélérations réelles du robot (1,0 m/s² et freinage 1,6 m/s²). Les échecs viennent donc des méthodes.

**Comment échouent-elles ?** Les 37 collisions en vision complète (référence et VIGIE 3W) rejouées à l'identique : toujours contre une personne, presque toujours avec le robot dans la voie de passage d'une ouverture, lent ou arrêté. Il hésite au milieu de la voie.

**Ablation de la chaîne réaliste** (référence, vision complète, graines 1400 à 1429) :

| Configuration | Succès |
|---|---|
| robot idéal | 29 / 30 |
| robot réaliste, vitesses des personnes exactes | 27 / 30 |
| robot réaliste, vitesses estimées par le filtre alpha-bêta | 22 / 30 |

L'estimation des vitesses expliquait la plus grande part des pertes. Le filtre alpha-bêta avait des gains très forts (0,6 et 0,3) et aucune gestion des pistes : une détection manquée, une réapparition après masquage ou une sortie d'arène produisaient des vitesses aberrantes. En perception limitée, aux angles morts, 28 % des estimations près du robot étaient fausses de plus de 1 m/s (95e centile : 7,6 m/s).

**Nouveau filtre** (`TrackerKF`) : Kalman à vitesse constante, bruit de mesure celui du capteur (5 cm), prédiction sur le temps réellement écoulé, porte de validation, pistes effacées après 1 s.

| Scène, perception limitée | alpha-bêta | Kalman |
|---|---|---|
| angles morts | 1,82 m/s d'erreur moyenne, 28 % > 1 m/s | 0,27 m/s, 4,9 % |
| porte | 1,16 m/s, 16 % | 0,20 m/s, 2 % |
| traversée | 0,98 m/s, 15 % | 0,19 m/s, 0,9 % |

En vision complète l'erreur passe de 0,21 à 0,15 m/s, et elle baisse aussi dans les scènes où les personnes changent de direction. Les pics restants sont des personnes qui viennent d'apparaître : une seule mesure ne donne pas leur vitesse. Ce filtre fait partie de la chaîne de perception du robot, commune à toutes les méthodes : c'est une correction du réalisme du banc, pas un apport de VIGIE. Il est utilisé par défaut (`TRACKER=naif` pour l'ancien). L'application utilise le même, avec des sorties identiques à 1e-14 près (test 25).

**Règle du carrefour** (code de la route, R415-2 : ne pas s'engager dans une intersection si l'on risque d'y être immobilisé). Composant qui ne touche qu'à la vitesse : le long de la route choisie, on repère les tronçons que les agents prédits vont balayer dans les 4 s ; on n'y entre que si un démarrage franc les traverse sans conflit, sinon on garde de quoi s'arrêter avant ; déjà dans la zone, on s'arrête si cela évite le conflit. Versions essayées sur les graines 1400 à 1429 :

1. avec obligation de dégager la zone dès qu'on y est : 24 collisions sur 30 pour la référence, contre 8 sans la règle. La zone, élargie par l'incertitude, couvrait presque toujours le robot, qui était poussé en avant, y compris contre les murs (7 collisions contre un mur). Abandonnée.
2. filtre qui ne fait que ralentir : se déclenche trop rarement (le robot est souvent déjà dans une zone, où cette version ne fait rien).
3. plus arrêt dans la zone quand cela évite le conflit.
4. plus « dégager » seulement si s'arrêter mène au conflit, que passer n'y mène pas et que le robot est aligné avec sa route.

Sur 30 mondes les écarts entre versions restaient dans le bruit. Pour ne pas régler la méthode sur ces mondes, la conception a été figée et départagée par une campagne plus large.

**Campagne de développement** (graines 1400 à 1459, porte, angles morts, poursuite, traversée, vision complète et perception limitée, 2 400 essais, nouveau filtre pour tous) :

| Méthode | Toutes scènes | Porte | Écart global / référence |
|---|---|---|---|
| référence | 74 % | 78 % | – |
| VIGIE 3 | 76 % | 88 % (+10,8, significatif) | +2,5 ; IC [−1,9 ; +6,9] |
| référence + règle | 76 % | 82 % | +1,9 ; IC [−1,2 ; +5,2] |
| VIGIE 3 + règle (version 4) | 78 % | 91 % (+13,3, significatif) | +3,8 ; IC [−0,6 ; +7,9] |
| VIGIE 3 + règle, sans dégager | 78 % | 90 % (+12,5, significatif) | +4,4 ; IC [+0,2 ; +8,8] |

Avec le nouveau filtre, la référence passe de 62 à 78 % à la porte. « Dégager » n'apporte rien : abandonné. Version retenue : **VIGIE 5** = VIGIE 3 + règle du carrefour sans dégager. Elle a été choisie parce qu'elle arrive en tête sur ces mondes : son avance y est donc optimiste, d'où l'évaluation sur des mondes neufs. Détail : `etape2_dev_analyse.md`.

En perception limitée, aux angles morts, les collisions restent autour de 60 à 70 % pour toutes les méthodes, même avec des vitesses fiables. La personne heurtée était visible depuis 1,4 s en médiane, et le robot presque arrêté dans 17 cas sur 40.

Tests de cohérence à la fin de l'étape 2 : 148 vérifications réussies, 0 échec.

### Étape 3 : évaluation finale sur des mondes neufs (graines 3000 à 3059, 11 scènes, vision complète et perception limitée, 5 280 essais)

Graines jamais utilisées pendant la mise au point ; le test 12 vérifie qu'elles ne recoupent aucune campagne de développement. Quatre méthodes, toutes avec le même robot réaliste et le même filtre de suivi : la référence (MPPI multimodal + prédicteur de Smith), la référence + règle du carrefour, VIGIE 3, VIGIE 5. 1 320 essais par méthode, aucun doublon, aucune ligne manquante. Détail par scène : `final_etape3_analyse.md`.

| Méthode | Succès | Collisions | Écart / référence | IC 95 % | Gagnés / perdus |
|---|---|---|---|---|---|
| référence | 81 % | 18 % | – | – | – |
| référence + règle | 81 % | 18 % | −0,3 | [−2,0 ; +1,4] | 64 / 68 |
| VIGIE 3 | 83 % | 16 % | +1,9 | [−0,4 ; +4,1] | 127 / 102 |
| VIGIE 5 | 83 % | 16 % | +2,1 | [−0,2 ; +4,4] | 131 / 103 |

Face à face, VIGIE 5 contre VIGIE 3 : +0,2 point, IC [−1,3 ; +1,8].

**Par condition**

| Condition | Référence | VIGIE 3 | VIGIE 5 |
|---|---|---|---|
| vision complète | 83,9 % | 89,5 % (+5,6 ; IC [+2,6 ; +8,5]) | 88,6 % (+4,7 ; IC [+1,8 ; +7,6]) |
| perception limitée | 78,3 % | 76,5 % (−1,8 ; IC [−5,2 ; +1,5]) | 77,9 % (−0,5 ; IC [−3,9 ; +3,0]) |

**Par scène** (écarts par rapport à la référence, significatifs en gras)

| Scène | Référence | VIGIE 3 | VIGIE 5 | Référence + règle |
|---|---|---|---|---|
| porte (goulot) | 71 % | 82 % (**+10,8**) | 86 % (**+15,0**) | 76 % (+5,0) |
| angles morts | 57 % | 69 % (**+11,7**) | 68 % (+10,8 ; IC [+0,0 ; +21,7]) | 56 % (−1,7) |
| couloir | 92 % | 96 % (+3,3) | 97 % (+4,2 ; IC [+0,0 ; +9,2]) | 95 % (+2,5) |
| foule | 84 % | 89 % (+5,0) | 88 % (+3,3) | 88 % (+3,3) |
| traversée | 78 % | 81 % (+2,5) | 84 % (+5,8) | 76 % (−2,5) |
| foule dense | 72 % | 68 % (−5,0) | 65 % (−7,5) | 64 % (**−8,3**) |
| poursuite | 79 % | 74 % (−5,0) | 75 % (−4,2) | 79 % (+0,0) |
| forêt, piège, carrefours | 77 à 98 % | à moins de 3 points | à moins de 4 points | à moins de 2 points |

### Ce que l'étape 3 confirme et ce qu'elle infirme

1. **La porte est confirmée.** L'avance de VIGIE à la porte, vue en développement (+10,8 puis +12,5), se retrouve sur les mondes neufs : +10,8 pour VIGIE 3, +15,0 pour VIGIE 5, toutes deux significatives. C'est le résultat le plus solide de tout le projet.
2. **Les angles morts aussi, en partie.** VIGIE 3 y fait +11,7, significatif ; VIGIE 5 +10,8, à la limite. En développement, l'écart n'était pas significatif : il faut le lire avec prudence, car c'est la seule scène où la conclusion change entre les deux campagnes.
3. **La règle du carrefour n'apporte rien.** Seule, elle laisse la référence au même niveau (−0,3) et la dégrade nettement en foule dense (−8,3, significatif) : quand les zones balayées se recouvrent, le robot attend des créneaux qui ne viennent pas. Ajoutée à VIGIE 3, elle ne change rien (+0,2). Le gain de 2 points vu en développement (VIGIE 3 + règle contre VIGIE 3) venait du choix de la meilleure version sur ces mêmes mondes. C'est la troisième fois que les mondes neufs corrigent une conclusion de développement.
4. **VIGIE 3 est retenu, VIGIE 5 n'est pas adopté.** À performance égale, on garde le plus simple. La règle reste dans le code (`Vigie5`, `MMSmithCarrefour`) pour la traçabilité, mais elle n'est pas portée dans l'application.
5. **En vision complète, VIGIE bat la référence**, et l'écart est significatif : +5,6 points. C'est la première fois sur le robot réaliste.
6. **En perception limitée, l'avance disparaît.** Les briques de VIGIE (routes dans l'espace-temps, tubes par agent, fantômes aux angles morts) supposent de bien voir ce qui bouge ; quand la vue est coupée, elles n'ont rien de plus que la référence pour décider. Pour progresser ici, il faudra travailler la perception, pas le planificateur.
7. **Écart global sur les onze scènes : +1,9 point, non significatif.** Les gains à la porte, aux angles morts, au couloir et dans la foule sont compensés par des pertes en foule dense et en poursuite. On ne peut pas affirmer que VIGIE est meilleur partout, seulement là où il l'est.

### Pistes pour la suite

- Foule dense : VIGIE y perd 5 à 7,5 points (non significatif). Cette scène ne faisait pas partie des campagnes de développement : à examiner essai par essai, comme les angles morts à l'étape 2. En poursuite, le signe change d'une campagne à l'autre (−2 à l'étape 1, +5 en développement, −5 ici) : rien ne distingue ces écarts du bruit.
- Perception limitée : mesurer combien on gagnerait avec une vue complète des zones masquées (borne haute), avant de chercher un remède.
- Prototype : l'avance de VIGIE se concentre sur les passages étroits avec des personnes. C'est le scénario à reproduire en premier sur le robot réel.

Tests de cohérence à la fin de l'étape 3 : **149 vérifications réussies, 0 échec.**

## Séance 7 · Correction d'attribution et mise à niveau des références

En relisant les publications citées, une erreur est apparue : la référence « MPPI multimodal (2025) » était attribuée à Bertipaglia et al. (arXiv 2508.21364), qui décrit en fait quatre modes d'échantillonnage pour une voiture, sans routes topologiques. Notre code imite T-MPC (de Groot et al., T-RO 2024), mais en plus faible : routes guides tracées sur une carte figée au lieu de l'espace libre dynamique, et pas de préférence de cohérence. Les résultats des séances 1 à 6 restent valables pour la méthode réellement codée, mais pas comme comparaison à T-MPC. L'avance de VIGIE 3 est probablement surestimée. Plan de correction et nouvelles références : `PLAN_SEANCE7.md`.

### Références codées d'après leurs publications (`references.py`)

- **T-MPC++** (de Groot et al., T-RO 2024) : guidage Visibility-PRM dans l'espace-temps (30 tirages, 4 routes, cibles en grille 5 × 5), classes distinguées par nombres d'enroulement, contraintes d'homotopie de l'équation 8, remise de 0,75 sur la classe suivie au cycle précédent (équation 12), planificateur supplémentaire non guidé. Planificateurs locaux MPPI avec le coût commun du banc.
- **DRA-MPPI** (Trevisan et al., IROS 2025) : prédiction à vitesse constante avec bruit gaussien (variance 0,018 m² par seconde, comme la publication), probabilité de collision jointe sur les personnes à chaque instant, coût w_soft P + w_hard 1(P > 0,05), 400 trajectoires tirées.
- Toutes les adaptations au banc sont listées dans `references.py` (ADAPTATIONS). La probabilité de collision est calculée exactement (table vérifiée contre la formule fermée et contre un tirage de 10⁶ points, écart maximal 0,0006) au lieu de l'estimation de Monte-Carlo de la publication.

**Deux erreurs trouvées en testant T-MPC++ avant toute campagne :**
1. Dès qu'une personne était à moins de la marge du robot, aucune arête du guidage ne pouvait partir du robot : le guidage devenait aveugle au moment où il servait le plus (une seule route ou aucune, collision à 4,1 s à la porte). Corrigé : une arête qui part du robot doit seulement ne pas le rapprocher davantage des personnes.
2. La publication place ses cibles le long d'une seule route de référence. Dans nos scènes, toutes les cibles tombaient alors du même côté des obstacles fixes et le guidage ne voyait qu'une classe. On ajoute la même grille le long de deux routes globales de plus. C'est une extension, qui ne peut que renforcer la référence.

Après correction : 1 à 3 routes distinctes par cycle selon la scène, contre 0 ou 1 avant. Onze vérifications ajoutées (test 26), 160 au total, toutes réussies.

**Réglage à budget égal** (graines 1400 à 1419, 11 scènes, vision complète et perception limitée) : trois variantes de poids pour DRA-MPPI, trois pour T-MPC++ (poids des contraintes d'homotopie, marge du guidage), en plus des réglages par défaut.

### Résultat du réglage (4 400 essais)

| Méthode | Succès | Vision complète | Perception limitée | Collisions en mouvement | Temps (essais réussis par tous) | Calcul (ms) |
|---|---|---|---|---|---|---|
| DRA-MPPI réglé (3000 / 3000) | **83,6 %** | 87,7 % | 79,5 % | 14,8 % | 18,8 s | 7 |
| DRA-MPPI (1000 / 3000) | 83,0 % | 86,4 % | 79,5 % | 15,7 % | 18,4 s | 7 |
| VIGIE 3 | 82,5 % | 85,9 % | 79,1 % | 14,5 % | 19,8 s | 34 |
| T-MPC++ (par défaut, meilleur réglage) | 82,3 % | 87,7 % | 76,8 % | 17,3 % | 17,3 s | 77 |
| ancienne référence | 81,1 % | 84,1 % | 78,2 % | 16,6 % | 20,4 s | 22 |

Détail par scène et intervalles de confiance : `dev7_reglage_scenes_dra.md`, résumé : `dev7_reglage_resume.md`.

**Ce qu'il faut en retenir :**
- **Référence officielle : DRA-MPPI réglé (3000 / 3000).** Les écarts entre configurations tiennent en quelques essais sur 440 ; on applique la règle fixée à l'avance sans y voir une différence réelle.
- **VIGIE 3 n'a pas d'avance mesurable sur les références fidèles** : −0,5 point face à DRA-MPPI, IC à 95 % [−4,5 ; +3,4]. Sur ces mêmes mondes, il ne fait que +1,4 point face à l'ancienne référence. L'avance publiée aux séances précédentes tenait à une référence trop faible, comme l'audit le laissait craindre.
- Les familles sont **complémentaires**. DRA-MPPI gagne nettement en forêt (+10 points, significatif) et au carrefour (+12,5, significatif), un peu au piège et en poursuite. VIGIE 3 gagne au goulot (+17,5) et en foule dense (+10). DRA-MPPI échoue au goulot surtout par blocage (12 % des essais au temps limite).
- T-MPC++ va le plus vite (17,3 s) mais heurte davantage (17,3 % de collisions en mouvement) et perd 11 points entre vision complète et perception limitée.

### Piste : VIGIE 3 + risque calibré (`vigie_risque.py`)

D'après la complémentarité observée : tout VIGIE 3 est gardé (routes topologiques et espace-temps, tubes, compensation du retard, prudence aux angles morts), et seule la pénalité de distance aux personnes est remplacée par le coût de risque de DRA-MPPI. Une variante tire en plus l'incertitude de chaque personne de l'erreur de prédiction réellement observée sur elle (écart moyen d'une erreur gaussienne 2D = s·√(π/2), plancher : la valeur publiée).

Six vérifications ajoutées (test 27, 167 au total, toutes réussies) : risque identique à DRA-MPPI à poids égaux, coût des obstacles fixes et du suivi de route inchangé, plancher respecté, relation de Rayleigh vérifiée par tirage. Une vérification trop faible (elle appelait la méthode sur le mauvais objet) a été corrigée avant la campagne.

Premier essai : au goulot, les poids de DRA-MPPI figent le robot devant la porte (3 essais sur 10 au temps limite, aucun pour VIGIE 3). Un risque de quelques dixièmes de pour cent pèse plus qu'un mètre de progrès, et dans un contre-flux continu l'instant sans risque n'arrive jamais. Avec des poids plus faibles, 1 seul blocage sur 10 et aucune collision. D'où un réglage à budget égal (4 configurations) sur les graines 1400 à 1419.

**Résultat du réglage** (2 200 essais, mêmes mondes que les références) :

| Configuration | Succès | Vision complète | Perception limitée | Collisions en mouvement |
|---|---|---|---|---|
| DRA-MPPI réglé (rappel) | 83,6 % | 87,7 % | 79,5 % | 14,8 % |
| VIGIE 3 + risque, escompte 0,97 | 83,2 % | 85,5 % | 80,9 % | **13,4 %** |
| VIGIE 3 + risque, 3000 / 3000 | 83,2 % | 86,4 % | 80,0 % | 13,9 % |
| VIGIE 3 + risque, 1000 / 3000 | 83,0 % | 88,6 % | 77,3 % | 15,0 % |
| VIGIE 3 (rappel) | 82,5 % | 85,9 % | 79,1 % | 14,5 % |
| VIGIE 3 + risque, 300 / 3000 | 80,0 % | 85,5 % | 74,5 % | 17,5 % |
| VIGIE 3 + risque adaptatif | 66,1 % | 61,8 % | 70,5 % | 16,4 % |

- Le risque calibré rapproche VIGIE de DRA-MPPI (+0,7 point) sans le dépasser. Égalité entre 3000/3000 et l'escompte 0,97, départagée par les collisions en mouvement : **escompte retenu**.
- **L'incertitude adaptative échoue nettement** (−17,5 points, significatif). Les personnes qui changent de direction gonflent l'erreur mesurée, l'incertitude explose et le robot se fige (26 temps limites sur 40 à la traversée). Rejetée.
- Par scène, la complémentarité demeure : le mélange gagne au goulot (+20, significatif) et au couloir (+10, significatif), mais **perd toujours 10 points en forêt**.

### Angles morts : fantômes dans le risque

Aux angles morts, l'écart vient presque entièrement de la perception limitée : DRA-MPPI réussit 18 essais sur 20 en vision complète et 7 en perception limitée, VIGIE 3 16 puis 9. Quatre des onze collisions de VIGIE 3 ont lieu robot arrêté : le plafond de vitesse le fait freiner et une personne qui ne le voit pas le heurte.

Idée : faire entrer les fantômes (personnes hypothétiques derrière chaque bord masquant) dans le calcul du risque, avec une probabilité d'exister. Ramper dans la voie coûte alors cher, la traverser vite ou la prendre large coûte peu.

**Deux erreurs de modélisation trouvées par les tests avant tout essai :**
1. Un fantôme ne représentait qu'une personne qui sort *maintenant* : elle croisait la ligne du robot bien avant son arrivée et ne comptait pas. Une personne peut sortir à tout moment : on modélise un flux d'arrivées (Poisson), chaque fantôme répété avec un délai de sortie de 0 ; 0,5 ; 1 et 1,5 s.
2. Avant son instant de sortie, chaque copie attendait sur place : les copies s'empilaient au même point. Une arrivée n'existe qu'à partir de son instant ; corrigé.

**Borne sur la probabilité.** Un fantôme seul ne doit jamais déclencher le seuil dur de 5 %, sinon chaque ouverture devient un mur. Les copies étant espacées de 0,75 m, le robot (0,65 m de rayon cumulé) peut en recouvrir deux : il faut 1 − (1 − p)² < 0,05, soit p < 2,53 %. Une première affirmation (« p < 5 % suffit ») était fausse ; elle est maintenant vérifiée sur une grille dense à tous les instants, avec un cas témoin à 4 % qui dépasse bien la borne.

Diagnostic (angles morts, perception limitée, graines 1400 à 1419) :

| Variante | Succès |
|---|---|
| VIGIE 3 | 9 / 20 |
| VIGIE 3 + risque, sans fantômes | 6 / 20 |
| + fantômes 1 % | 6 / 20 |
| **+ fantômes 2 %** | **10 / 20** |
| fantômes 1 %, sans plafond de vitesse | 9 / 20 |
| fantômes 2 %, sans plafond de vitesse | 3 / 20 |
| DRA-MPPI réglé | 7 / 20 |

Le risque seul fait moins bien que VIGIE 3 aux angles morts : le coût de DRA-MPPI ignore tout ce qui est masqué. Les fantômes à 2 % donnent le meilleur score, mais sur 20 essais un écart de 3 ou 4 reste dans le bruit. Retirer le plafond est instable : il est gardé. La variante à 2 % entre dans la comparaison de développement, sans être adoptée d'avance.

### Foule dense : un plancher commun

Rejoué essai par essai : près de la moitié des échecs (4 sur 9 pour VIGIE 3, 5 sur 11 pour DRA-MPPI) sont des collisions dans les 3 premières secondes. Exemple (graine 1417) : une personne à 3,1 m vient droit sur le point de départ à 1,1 m/s. Le robot la voit bien (vitesse estimée à 0,1 ou 0,2 m/s près dès 0,8 s) et tente de l'éviter, mais son cap ne tourne que de 30° en 1 s alors qu'il commande 1,8 rad/s : à l'arrêt, un robot de 25 kg dont les roues partagent leur vitesse entre avance et rotation tourne bien plus lentement que ne le croit le modèle du planificateur. Le modèle par roue (VIGIE 3W, séance 5) n'apprend ses paramètres qu'après 3 s et n'avait rien apporté. Ces collisions frappent toutes les méthodes : on ne lance pas de piste dessus.

### Forêt : deux défauts structurels de VIGIE 3

En forêt, les seuls échecs de VIGIE sont des temps limites, toujours sur les deux mêmes mondes (1412 et 1419), en vision complète comme en perception limitée, avec ou sans risque calibré. **Ces mondes ne contiennent aucune personne** : la cause est dans VIGIE lui-même.

**Mesure manquante.** La colonne « changements de route » valait 0 pour VIGIE dans tous les essais : la méthode de choix de VIGIE 3 ne la mettait jamais à jour. Aucune conclusion sur VIGIE ne s'appuyait sur cette colonne. Mesure refaite directement : **133 changements de route en 450 cycles** sur le monde 1412, et un cycle sur trois ou quatre même dans les essais réussis.

**Première hypothèse : l'hésitation entre routes.** VIGIE choisit à chaque cycle la route la moins chère, sans préférence pour celle qu'il suit. On reprend la règle de cohérence de T-MPC (éq. 12, facteur 0,75), avec le code de notre T-MPC++. Premier essai : aucun effet, à l'identique. Vérification : la remise s'appliquait à toutes les routes à la fois. Jugées sur la trajectoire de 2,5 s, les routes de VIGIE tombent toutes dans la même classe, car elles ne se séparent qu'au-delà de l'horizon. La classe est désormais jugée sur la route guide restante jusqu'au but, par rapport aux obstacles fixes. Les changements de route sont divisés par deux (133 → 63)… mais le robot reste bloqué. L'hésitation n'était pas la seule cause.

**Cause trouvée par élimination** (trois hypothèses testées séparément sur les deux mondes) : 400 tirages au lieu de 128 corrigent un monde sur deux, retirer le suivi de route aussi, et **retirer la route espace-temps corrige les deux**. La route espace-temps voyait les obstacles fixes avec 0,3 m de marge, les routes topologiques avec 0,1 m. Le passage de 0,98 m était fermé pour elle : sur ce passage, son plan reste figé (0,17 m d'avance en 3 s contre 1,22 m avec la marge commune), et elle proposait un détour vers l'arrière pendant que les autres traversaient. Correction : même marge pour les obstacles fixes, 0,3 m gardés autour des personnes (« carte commune »). Le monde 1412 est alors réussi en 25,1 s, plus vite que DRA-MPPI (26,1 s).

Le monde 1419 reste bloqué : un passage de 0,82 m, 11 cm de chaque côté, que DRA-MPPI franchit et où VIGIE dérive. On s'arrête là, pour ne pas régler la méthode monde par monde.

Refactorisation préalable (choix du mode dans une méthode à part) vérifiée sans effet : trajectoires identiques au bit près sur six épisodes. VIGIE 3 lui-même n'est pas modifié. Tests ajoutés : cohérence (seuil exact de 0,75, classes de routes), carte commune (le passage de 1412). **185 vérifications réussies, 0 échec.**

### Comparaison de développement (graines 1420 à 1459, jamais utilisées pour régler, 11 scènes, deux conditions, 6 160 essais)

| Méthode | Succès | Vision complète | Perception limitée | Écart / DRA-MPPI (IC 95 %) | Gagnés / perdus | Collisions en mouvement | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| **VIGIE 3 + risque + carte commune + cohérence** | **83,1 %** | 85,9 % | 80,2 % | +1,6 [−1,2 ; +4,3] | 83 / 69 | **14,2 %** | 40 |
| VIGIE 3 + risque calibré | 82,6 % | 86,6 % | 78,6 % | +1,1 [−1,5 ; +4,0] | 78 / 68 | 14,4 % | 39 |
| la première + fantômes 2 % | 82,0 % | 85,9 % | 78,2 % | +0,6 [−2,2 ; +3,3] | 78 / 73 | 15,0 % | 43 |
| T-MPC++ | 81,7 % | 86,8 % | 76,6 % | +0,2 [−2,6 ; +3,2] | 87 / 85 | 17,4 % | 81 |
| VIGIE 3 | 81,7 % | 85,2 % | 78,2 % | +0,2 [−2,8 ; +3,3] | 93 / 91 | 15,5 % | 34 |
| DRA-MPPI réglé (référence) | 81,5 % | 83,2 % | 79,8 % | – | – | 16,9 % | 7 |
| VIGIE 3 + carte commune + cohérence | 81,0 % | 84,3 % | 77,7 % | −0,5 [−3,4 ; +2,5] | 87 / 91 | 17,2 % | 36 |

Détail : `dev7_comparaison_scenes.md`, `dev7_comparaison_resume.md`, pertes : `dev7_comparaison_echecs.md`.

- **Version retenue pour l'évaluation finale, selon la règle fixée** : VIGIE 3 + risque calibré + carte commune + cohérence (meilleur succès, avance de plus de 3 essais sur la suivante).
- Elle passe devant les deux références et heurte le moins en roulant, mais **l'avance n'est pas significative**. Par scène, elle gagne au goulot (+11,2, significatif) et au couloir (+6,2, significatif) ; elle **perd dans la foule (−11,2, significatif)**.
- Les briques se combinent : le risque calibré est indispensable (sans lui, −0,5), la carte commune et la cohérence ajoutent un demi-point par-dessus. **Les fantômes n'apportent rien** sur 880 essais (−1,1) : le 10 sur 20 du diagnostic était du hasard. Brique écartée.
- **Analyse des pertes face à DRA-MPPI** (`analyse_echecs.py`) : 69 essais perdus, dont 54 collisions en mouvement, concentrées dans la foule (12), la foule dense (12), les carrefours (14) et la poursuite (9). Ce sont les scènes où des personnes croisent la route du robot. Prochain chantier.

## Audit indépendant de l'application (17 novembre 2026)

Un audit externe de l'APK a été reçu. Il ne portait que sur l'application : le banc de recherche (ce dossier) n'y est pas embarqué, d'où plusieurs constats d'absence. Chaque point a été vérifié sur le code avant d'être accepté ou nuancé.

| Point de l'audit | Vérification | Suite donnée |
|---|---|---|
| Compensation du retard (Smith) appliquée à VIGIE seul dans l'application | **Exact** : `createEpisode` ne l'appliquait qu'à VIGIE, alors que le robot réaliste est activé par défaut. Le banc de recherche, lui, l'applique à toutes les méthodes. | Corrigé : appliquée à toutes les méthodes ; texte de l'interface mis en accord. |
| Pistes non détectées effacées de la sortie du suivi | **Exact, dans l'application et dans le banc de recherche.** Avec 10 % de détections manquées par cycle en perception limitée, une personne visible clignotait pour le planificateur. | Corrigé des deux côtés (sorties identiques à 1e-14 près) ; quatre vérifications ajoutées (test 30). Ancien comportement : `TRACKER=sans_prolongation`. Toutes les méthodes seront réévaluées. |
| « Tubes calibrés » : marge heuristique, pas de calibration | **Exact.** La marge croît selon une règle choisie à la main, sans mesure de couverture. | Vocabulaire corrigé dans le code et la leçon. Les noms des méthodes restent, car ils servent de clés aux fichiers de résultats publiés. « Risque calibré » est tout aussi impropre (variance publiée par DRA-MPPI, non mesurée sur nos données) : corrigé dans la leçon. |
| « Carte commune » : résolution et inflation différentes | **Exact en partie.** Depuis la séance 7, la marge des obstacles fixes est la même ; la résolution des grilles diffère (0,35 m contre la grille de navigation). | Leçon précisée : « même marge ». Harmoniser la résolution reste à faire. |
| A* espace-temps holonome, non cinématique | **Exact.** | Déclaré dans le code et la leçon : guide géométrique, sans garantie de faisabilité. |
| VIGIE 3 sans cohérence de route | **Exact pour VIGIE 3** (constaté aussi ici en forêt : 133 changements de route en 450 cycles). | Règle de cohérence de T-MPC ajoutée et vérifiée en séance 7, absente de VIGIE 3 lui-même. |
| Modèle interne de VIGIE 3 sans retard | Exact pour l'application ; le modèle par roue du banc (séance 5) tient compte du retard, mais n'est pas utilisé par les versions retenues. | Pas de changement. |
| Plafond de vitesse aux angles morts avec un plancher de 0,15 m/s, sans budget d'arrêt | **Exact.** | À traiter : l'arrêt doit rester possible ; ablation prévue (s'arrêter dans la voie d'une personne qui ne voit pas le robot n'est pas forcément plus sûr dans ce banc). |
| Références T-MPC++ et DRA-MPPI absentes | Absentes de l'APK, présentes ici (`references.py`, adaptations déclarées, tests 26 et 27). | La leçon indique désormais d'où viennent les chiffres. |
| Données brutes et scripts absents | Absents de l'APK, présents ici : une ligne par essai, graines, scripts d'analyse. | Idem. |
| Avance de +1,6 point non significative | **Exact**, et déjà écrit comme tel dans le journal et la leçon. | – |

L'audit relève aussi, à juste titre, que plusieurs briques de VIGIE sont proches de travaux existants (T-MPC pour les routes et la cohérence, DRA-MPPI pour le risque, OA-MPC pour les zones masquées). Aucune n'est présentée comme une invention : l'enjeu ici est la combinaison et sa mesure honnête.

### Validation de VIGIE 6 sur le banc corrigé (graines 1460 à 1499, jamais utilisées, 2 640 essais)

| Méthode | Succès | Vision complète | Perception limitée | Écart / DRA-MPPI (IC 95 %) | Gagnés / perdus | Collisions en mouvement | Calcul (ms) |
|---|---|---|---|---|---|---|---|
| **VIGIE 6** (VIGIE 3 + risque + même marge + cohérence + planificateur libre) | **86,7 %** | 89,3 % | 84,1 % | **+5,3 [+2,8 ; +8,0]** | 95 / 48 | **10,7 %** | 51 |
| version précédente (sans planificateur libre) | 86,1 % | 88,2 % | 84,1 % | +4,8 [+1,9 ; +7,6] | 104 / 62 | 10,7 % | 40 |
| DRA-MPPI réglé (référence) | 81,4 % | 84,3 % | 78,4 % | – | – | 15,9 % | 7 |

Par scène, face à DRA-MPPI : goulot +22,5 (significatif), angles morts +13,8 (significatif), traversée +11,2, couloir +7,5, poursuite +5,0 ; foule −3,8 (non significatif, contre −11,2 significatif sur les graines 1420 à 1459). Détail : `dev7_validation_scenes.md`, pertes : `dev7_validation_echecs.md`.

- **Pour la première fois, l'avance sur la référence fidèle est significative.**
- **Planificateur libre : adopté selon la règle fixée** (5 essais de mieux, seuil 3), mais son apport propre (+0,6 point, IC [−1,8 ; +3,1]) n'est pas distinguable du bruit. L'essentiel de l'avance vient des briques précédentes.
- **Prudence sur l'ampleur.** Sur les graines 1420 à 1459 (ancien suivi), la même famille ne faisait que +1,6 (non significatif). La correction du suivi n'explique pas l'écart : en vision complète, où elle ne change rien, VIGIE 6 fait exactement les mêmes 393 succès avec l'ancien et le nouveau suivi, et en perception limitée 370 contre 366. L'écart entre les deux séries de mondes relève donc surtout de la variabilité des mondes tirés. Seule l'évaluation finale (100 mondes jamais vus, trois conditions) dira l'ampleur réelle.

Erreur évitée : une seconde analyse avait écrasé le fichier de la première (comparaison à la version précédente prise pour une comparaison à DRA-MPPI) ; repéré à la lecture des chiffres, les deux fichiers sont désormais séparés.

### Incertitude du suivi dans le risque : rejetée (880 essais, graines 1460 à 1499)

| Méthode | Succès | Vision complète | Perception limitée | Temps (essais communs) |
|---|---|---|---|---|
| VIGIE 6 | **86,7 %** | 89,3 % | 84,1 % | 19,2 s |
| VIGIE 6 + incertitude du suivi | 71,5 % | 73,2 % | 69,8 % | 24,0 s |

−15,2 points, IC [−18,5 ; −11,9], significatif ; effondrement à la traversée (−57,5) et à la porte (−48,8). C'est le risque annoncé avant l'essai : une personne qui vient d'apparaître a une vitesse très incertaine (écart-type initial de 2 m/s), donc une position future floue sur plusieurs mètres ; le robot se croit menacé partout et attend. La règle fixée (au moins 3 essais de mieux, aucune scène en recul significatif) écarte la variante. Bonne idée sur le papier (elle venait d'un avis extérieur), mauvaise telle quelle : il faudrait au minimum borner l'incertitude de vitesse d'une piste neuve, ce qui serait un nouveau réglage à juger sur d'autres mondes. Détail : `dev7_validation_cov_scenes.md`.

## Simulateur 3D « Dans la tête de VIGIE » (application, version 2.0)

But : montrer, à quelqu'un qui débute, comment VIGIE 6 perçoit, imagine et décide, face à DRA-MPPI. Condition posée : que ce soit **le vrai VIGIE 6**, pas une imitation.

**Portage fidèle** (`js/sims/vigie6/`). L'ancien cœur JavaScript de l'application ne contenait que VIGIE 2 et une ébauche de VIGIE 3, avec 5 scènes simplifiées. VIGIE 6, DRA-MPPI réglé et les 11 scènes du banc ont été portés ligne à ligne depuis le Python. Pièges rencontrés et traités pendant le portage :
- `round()` de Python arrondit au pair (2,5 → 2) quand `Math.round` arrondit au-dessus : l'ancien portage de la route espace-temps était faux sur ce point ;
- les files de priorité doivent départager les égalités comme les tuples Python (coût, puis coordonnées), sans quoi A* et Dijkstra prennent d'autres chemins ;
- le modulo Python garde le signe du diviseur (calcul des nombres d'enroulement de la règle de cohérence) ;
- la table des probabilités de collision reprend la fonction de Bessel I0 de numpy (Cephes) avec ses coefficients exacts ; table entière identique à 4×10⁻¹⁶ près ;
- l'ancien portage différait aussi sur le prolongement du champ de distance dans les obstacles, la pénalité autour des routes trouvées et le percentile de MPPI.

**Vérification en deux temps.**
1. *Mêmes entrées, mêmes sorties* (`parite_js.py`, test 32, 27 vérifications) : grille, Dijkstra, A*, routes, route espace-temps, coûts, probabilité de collision, cohérence, fantômes, robot réaliste, personnes, capteurs, et **décisions complètes rejouées pas à pas** sur 4 épisodes du banc (240 décisions, écart maximal 4×10⁻¹³). Les tirages aléatoires y sont remplacés des deux côtés par un même générateur à arithmétique entière. Chaque mécanisme a été exercé (trois types d'options choisis, changements de route, plafond aux angles morts actif 23 fois). Deux erreurs de test corrigées en route : fantômes comparés dans l'ordre alors que deux fantômes à égale distance peuvent s'échanger au dernier chiffre (sans effet sur la vitesse imposée) ; et une boucle d'imports Python qui n'apparaît que si `references` est importé avant `planners` (le banc fait toujours l'inverse).
2. *Épisodes bouclés* : une première série de 84 mondes donnait VIGIE légèrement derrière (62 contre 65), ce qui pouvait trahir une différence dans la boucle complète. Campagne JavaScript aux dimensions de la validation (graines 1460 à 1499, 11 scènes, deux conditions, 1 760 essais, `js_validation_simulateur.csv`) :

| | VIGIE 6 | DRA-MPPI | Écart (IC 95 %) |
|---|---|---|---|
| Simulateur JavaScript | 89,0 % | 84,7 % | +4,3 [+1,9 ; +6,8] |
| Banc Python | 86,7 % | 81,4 % | +5,3 [+2,8 ; +8,0] |

Même avantage, significatif dans les deux cas, même répartition par scène (porte, traversée, angles morts en tête ; égalité en forêt et au piège). Les mondes tirés en JavaScript sont un peu plus faciles pour les deux méthodes (générateur aléatoire différent de numpy). La première série était du hasard.

**Ce que montre le simulateur** (`js/sims/vigie3d.js`, `js/sims/vigie3d/`) : une maquette (le monde réel) sur laquelle les pensées sont projetées en lumière, turquoise pour VIGIE, ambre pour la référence ; calques « ce qu'il voit » (vu, mémorisé, inconnu, portée, silhouettes imaginées), « ce qu'il imagine » (futurs et incertitude), carte du danger, options et choix, essais de MPPI ; vue espace-temps (le temps devient la hauteur) ; panneau « Sa décision » avec la note détaillée de chaque option et une phrase « pourquoi » construite uniquement à partir des valeurs calculées ; comparaison en direct ; chronologie avec moments clés et retour image par image ; visite guidée en 11 étapes ; affichage côte à côte quand les personnes réagissent différemment aux deux robots (poursuite, piétons réactifs). Les mondes de départ ne sont pas choisis selon le vainqueur.

Observation faite en construisant l'affichage : la route espace-temps propose parfois de **reculer** (porte étroite, flux venant vers le robot sur 8 s). Vérifié identique en Python : c'est le comportement réel de l'algorithme, montré tel quel.

Tests de cohérence : **228 vérifications réussies, 0 échec.**

## Application mobile dédiée : VIGIE 1.0

Une application séparée (`vigie-app/`, identifiant Android `fr.robomaster.vigie`) reprend le simulateur 3D et y ajoute : un mode pronostic, un Atelier « et si… ? » qui modifie les réglages de VIGIE et le fait courir contre le VIGIE officiel et la référence, un banc de poche (comparaison appariée avec intervalle de confiance bootstrap, comme `analyse_scenes.py`), et un écran « Savoir » (histoire, résultats, idées abandonnées, références, limites), dont chaque chiffre a été relu contre ce journal. Une affirmation erronée a été retirée avant livraison : T-MPC++ n'a pas couru dans la validation de VIGIE 6, on ne peut donc pas dire que VIGIE 6 le bat sur ces mondes.

Pas de copie du planificateur : le script d'assemblage reprend le cœur partagé avec RoboMaster, celui que vérifie le test 32. Les réglages de l'Atelier ont des valeurs par défaut identiques au VIGIE officiel ; six vérifications ajoutées (même trajet au bit près avec les valeurs par défaut, et chaque interrupteur qui agit réellement : sans chemin qui sait attendre, plus d'option espace-temps ; sans improvisation, plus d'option libre ; sans itinéraires, plus de route ; fidélité à 1, plus de bonus ; sans prudence, plafond de vitesse jamais actif). Statistiques de l'application recoupées avec numpy sur les 880 paires de la campagne JavaScript : +4,3 points, intervalle [+2,0 ; +6,7] contre [+1,9 ; +6,8] (différence due au seul tirage du bootstrap).

## Évaluation finale (graines 5000 à 5099, 23 novembre 2026)

Protocole fixé avant le lancement (PLAN_SEANCE7.md §12) : 100 mondes jamais utilisés, 11 scènes, trois conditions (vision complète, perception limitée, piétons qui réagissent au robot), quatre méthodes, 13 200 essais (`final_seance7.csv`, détail par scène dans `final_seance7_scenes.md`). Le serveur s'est mis en veille une fois, 5 minutes après le départ ; reprise sans perte (221 essais déjà écrits, ligne finale complète), puis calcul par tranches de 2 heures. Aucun doublon, 3 300 essais par méthode.

| Méthode | Succès | Collisions en mouvement | Écart / DRA-MPPI réglé (IC 95 %) | Mondes gagnés / perdus |
|---|---|---|---|---|
| **VIGIE 6** | **88,9 %** | **9,2 %** | **+3,8 [+2,6 ; +5,1]** | 271 / 145 |
| T-MPC++ | 88,5 % | 10,9 % | +3,4 [+2,0 ; +4,8] | 330 / 219 |
| VIGIE 3 | 87,6 % | 10,6 % | +2,5 [+1,2 ; +3,9] | 307 / 223 |
| DRA-MPPI réglé | 85,1 % | 12,6 % | – | – |

Par condition, VIGIE 6 contre DRA-MPPI réglé : vision complète +4,1 [+2,1 ; +6,1], perception limitée +2,1 [−0,5 ; +4,5] (non significatif), piétons réactifs +5,3 [+3,5 ; +7,0]. Aucune condition en recul.

**Critère principal (§12) : atteint.** VIGIE 6 fait significativement mieux que la référence officielle, sans s'effondrer dans aucune condition, avec moins de collisions en mouvement.

**Ce que la campagne ne permet pas de dire** : que VIGIE 6 dépasse l'état de l'art dans son ensemble. Face à T-MPC++, l'écart est de +0,5 [−0,8 ; +1,7], non significatif, dans chacune des trois conditions ; T-MPC++ arrive en moyenne 1,9 s plus tôt. Sur la série de mondes précédente, T-MPC++ faisait jeu égal avec DRA-MPPI ; ici il le dépasse : le classement entre les deux références dépend des mondes tirés. VIGIE 6 fait aussi mieux que VIGIE 3 (+1,3 [+0,1 ; +2,4]).

Par scène, face à DRA-MPPI réglé : couloir +13,3, porte étroite +10,0, angles morts +9,3, traversée +6,3 (significatifs) ; forêt −1,7 (significatif, 98 % contre 100 %). Face à T-MPC++ : carrefour +6,0 et carrefour rapide +6,3 (significatifs), porte étroite −8,0 (significatif), foule dense −5,3 (limite). Les deux méthodes ont des forces différentes.

Temps de calcul médian par décision : DRA-MPPI 6,8 ms, VIGIE 6 51 ms, T-MPC++ 87 ms. L'avance sur DRA-MPPI s'obtient avec bien plus de calcul : c'est l'objet du contrôle A ci-dessous.

## Seconde relecture extérieure (23 novembre 2026)

Relecture de l'application reçue pendant l'évaluation finale ; chaque point vérifié dans le code du banc (détail et plan des contrôles : PLAN_SEANCE7.md §13).

- **Confirmé** : budget de calcul inégal (912 tirages par cycle contre 400 ; recalcul des routes à 200–280 ms, au-delà de la période de 100 ms) ; indice d'imprévisibilité nourri par les pistes prolongées pendant un masquage (erreur lissée 0,79 → 0,34 en 0,8 s, test 33) ; contacts contrôlés seulement toutes les 0,1 s.
- **Exact mais sans effet sur la comparaison** : chevauchement initial de piétons (ils ne se gênent pas entre eux dans le simulateur) ; tirage des piétons réactifs fixé par leur rang (23 sur 26 en foule dense, pas 70 % par monde), identique pour toutes les méthodes ; plancher de vitesse de 0,15 m/s de la prudence aux angles morts.
- **Déjà traité** : variance propre à chaque piste (§11, écartée) ; escompte 0,97 (comparé sans escompte) ; modèle moteur dans la prédiction (VIGIE 4) ; comportement des piétons (condition réactive).

Correction préparée : la colonne « mobile » vaut 2 pour une piste prolongée (même comportement pour tout le code, vérifié au bit près sur des épisodes de référence), et l'indice d'imprévisibilité de `VIGIE 6.1` ignore ces pistes. Tests : 241 vérifications réussies, aucun échec, une fois le fichier de l’évaluation complet.

## Résultats des contrôles A, B et C (23 novembre 2026)

Lecture fixée d'avance dans PLAN_SEANCE7.md §13, appliquée telle quelle.

**A, budget de calcul égal** (graines 1460 à 1499, vision complète et perception limitée, 880 situations appariées avec la validation) :

| Méthode | Tirages par cycle | Succès | Calcul médian |
|---|---|---|---|
| VIGIE 6 | 912 | 86,7 % | 48 ms |
| VIGIE 6 [400 tirages] | 400 | 86,0 % | 37 ms |
| DRA-MPPI réglé | 400 | 81,4 % | 6 ms |
| DRA-MPPI [912 tirages] | 912 | 81,1 % | 14 ms |
| DRA-MPPI [2800 tirages] | 2800 | 81,0 % | 55 ms |

- VIGIE 6 [400] contre DRA-MPPI [400] : +4,7 points [+2,0 ; +7,4].
- VIGIE 6 contre DRA-MPPI [912] : +5,6 [+3,0 ; +8,3] ; contre DRA-MPPI [2800], à temps de calcul comparable : +5,7 [+3,1 ; +8,2].
- Plus de tirages n'aident pas DRA-MPPI (−0,2 et −0,3, non significatif) ; moins de tirages coûtent peu à VIGIE 6 (−0,7, non significatif).
- **Verdict : l'avance est architecturale.** Conséquence pratique : la version à 400 tirages suffit pour un calculateur embarqué.

**B, VIGIE 6.1** (graines neuves 1500 à 1539, trois conditions, 1 320 situations) :

- Succès : VIGIE 6.1 90,2 %, VIGIE 6 90,0 %, DRA-MPPI 86,4 %.
- VIGIE 6.1 contre VIGIE 6 : +0,2 [−0,4 ; +0,8]. Résultats identiques au bit près en vision complète et avec piétons réactifs (aucune piste prolongée sans masquage, ce qui confirme que la correction ne touche rien d'autre) ; en perception limitée +0,7 [−1,1 ; +2,7], 11 essais gagnés pour 8 perdus.
- **Verdict : non adoptée** (seuil fixé à +1 point). La correction est juste sur le principe et ne fait rien régresser, mais son effet est trop faible pour être démontré ; VIGIE 6 reste la référence et le défaut reste documenté (test 33).
- Réplication au passage sur graines neuves : VIGIE 6 contre DRA-MPPI +3,6 [+1,7 ; +5,5], cohérent avec l'évaluation finale (+3,8).

**C, contacts entre deux instants** (diagnostic `BALAYAGE=1` sur les 6 600 essais de A et B) :

- Aucun essai réussi ne cache un contact, pour aucune méthode. Entre deux instants de décision, la marge ne descend au plus que de 1,2 cm sous celle mesurée aux instants (0,09 cm en moyenne).
- Vérification de la mesure : toujours au moins aussi sévère que le contrôle aux instants, et négative pour les 774 collisions enregistrées. Le pas de contrôle de 0,1 s ne fausse donc pas les résultats.

**Calcul, mesuré sur un cœur (Xeon 2,1 GHz, Python)** : VIGIE 6 55 ms en moyenne par cycle, pire cas 381 ms ; DRA-MPPI 10 ms, pire cas 22 ms. Les pics viennent du planificateur espace-temps (`spacetime_plan2`), écrit en Python pur et appelé environ un cycle sur dix ; il devra être réécrit en C++ ou tourner en parallèle de la boucle de commande avant tout essai sur robot.

## Applications : éditeur de monde et relecture complète (VIGIE 1.2.0, RoboMaster 2.3)

- **Éditeur de monde** (simulateur 3D, commun aux deux applications) : déplacer l'arrivée et le départ, poser ou retirer des obstacles, poser des personnes (marche avec changement d'avis, flâne, suit le robot, immobile) avec leur direction et leur vitesse, partir d'une scène du banc, annuler, code de partage. Le monde dessiné (`scene = 'perso'`) est construit tel quel par `World` à partir d'une description bornée (`normalizeSpec` : positions dans l'arène, rayons, vitesses et nombre d'éléments limités) ; les planificateurs ne changent pas. Vérifié : arrivée derrière le robot, en haut, en bas ; mur complet (indicateur « aucun passage », VIGIE attend, la référence heurte) ; chaque type de personne dans les trois conditions ; codes invalides ; parcours complet à la souris dans les deux applications, téléphone et grand écran, sans erreur.
- **Relecture** : fidélité JavaScript/Python toujours exacte (33 vérifications). Corrigé : nombre de tests et écart de validation périmés dans le simulateur 3D ; DRA-MPPI présenté comme « la meilleure référence » alors que T-MPC++ fait mieux que lui à l'évaluation finale ; « personnes qui ne le voient pas » sans mentionner la condition réactive ; avance de VIGIE 3 face aux références fidèles « nulle » alors que l'évaluation finale lui trouve +2,5 ; phrase de RoboMaster qui disait que seule la course VIGIE 2 contre MPPI était interactive ; barre du simulateur coupée sur ordinateur (boutons hors de vue) ; éditeur mal placé sous le menu latéral de RoboMaster sur grand écran.

## Séance 8, chantier 1 : toutes les difficultés à la fois

Plan écrit avant les essais : PLAN_SEANCE8.md §1. Graines neuves 6000 à 6059, 11 scènes, 4 méthodes, 2 conditions, 5 280 essais (`seance8_tout.csv`, analyse complète dans `seance8_tout_analyse.txt`).

**Condition `tout`** (les sept perturbations ensemble, reproductible) :

| Méthode | Succès | Collisions en roulant | Temps dépassé |
|---|---|---|---|
| T-MPC++ | 85,5 % | 14,1 % | 0,3 % |
| VIGIE 6 | 84,5 % | 14,1 % | 1,2 % |
| VIGIE 6 [400] | 83,5 % | 14,4 % | 1,8 % |
| DRA-MPPI | 81,2 % | 17,0 % | 1,8 % |

- VIGIE 6 contre DRA-MPPI : +3,3 [+0,3 ; +6,5], significatif. L'avance tient quand tout se cumule, un peu réduite (+3,8 à l'évaluation finale).
- VIGIE 6 contre T-MPC++ : −0,9 [−3,8 ; +2,1], jeu égal. T-MPC++ reste 1,35 s plus rapide par trajet.
- VIGIE 6 [400] contre VIGIE 6 : −1,1 [−3,8 ; +1,8], non significatif.
- À noter pour le chantier 2 : en poursuite, VIGIE perd nettement face à T-MPC++ (−16,7 points sur 60 mondes) ; il gagne largement à la porte étroite et au piège face à DRA-MPPI (+18,3 et +15,0).

**Condition `tout_calcul`** (la même chose, le temps de calcul Python compte) :

| Méthode | Succès | Calcul médian | Pire cas médian | Cycles sautés par trajet |
|---|---|---|---|---|
| VIGIE 6 | 82,1 % | 51 ms | 453 ms | 33,5 |
| DRA-MPPI | 81,8 % | 8 ms | 127 ms | 2,6 |
| VIGIE 6 [400] | 81,4 % | 37 ms | 437 ms | 31,9 |
| T-MPC++ | 76,5 % | 96 ms | 254 ms | 50,7 |

- VIGIE 6 contre DRA-MPPI : +0,3 [−2,7 ; +3,3]. **L'avance disparaît** quand le calcul Python ralentit les décisions.
- VIGIE 6 contre T-MPC++ : +5,6 [+2,1 ; +9,1], significatif. Mais T-MPC++ est le plus lent des quatre en Python ; cet écart mesure surtout la lenteur des programmes, pas les méthodes. Il ne permet pas de dire que VIGIE bat T-MPC++.
- Effet du calcul (`tout_calcul` − `tout`, mêmes mondes) : T-MPC++ −8,9 [−12,1 ; −5,9], significatif ; VIGIE 6 −2,4 [−5,5 ; +0,6] ; VIGIE 6 [400] −2,1 ; DRA-MPPI +0,6.

**Lecture selon le plan :**

- VIGIE 6 [400] ne fait pas mieux que VIGIE 6 dans `tout_calcul` (−0,8, non significatif) : la règle fixée d'avance garde VIGIE 6 comme version de référence. La version à 400 tirages reste un repli valable sur un calculateur faible (aucun écart démontré).
- Le message principal est pratique : en Python, VIGIE réfléchit trop lentement pour garder son avance sur la méthode la plus simple quand toutes les difficultés s'additionnent. Les pics à 450 ms, qui font sauter des cycles, viennent du planificateur espace-temps. Le portage C++ (chantier 3) n'est donc pas une option mais une condition pour un robot réel, et il faudra rejouer `tout_calcul` avec les temps C++.
- Limite déclarée : temps mesurés sur nos programmes Python ; T-MPC++ et DRA-MPPI n'ont pas été portés en C++, le classement « en C++ » reste inconnu.
