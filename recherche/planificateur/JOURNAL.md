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
