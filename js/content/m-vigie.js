import { P, H, Tip, Warn, Danger, Future, Real, Info, F, Sim, Pipe, Q, Exo, Code, Defi, Manual, Think, Table, Dossier, Brief } from './b.js';

// ============================================================================
// Le laboratoire : VIGIE, un planificateur mis au point ici
// ============================================================================

export const labo = {
  id: 'labo-vigie', phase: 'frontieres', icon: '🛰', title: 'Laboratoire : l\'invention de VIGIE',
  desc: 'Comment on invente un algorithme en robotique, et le planificateur VIGIE mis au point dans ce laboratoire.',
  master: 'Projet de recherche',
  intro: `Ce module raconte un vrai projet de recherche, mené pour cette application : partir de l'état de l'art en planification de trajectoire, chercher des idées dans d'autres domaines, construire un banc d'essai, échouer, comprendre pourquoi, recommencer, et aboutir à un planificateur nouveau, VIGIE, testé sous des perturbations sévères. Tout le code est fourni dans le dossier recherche/planificateur du projet.`,
  lessons: [
    {
      id: 'vigie-demarche', title: 'Inventer en robotique : la démarche', sub: 'État de l\'art, banc d\'essai, oracle et échecs utiles', min: 30, level: 3,
      why: `Une idée n'a de valeur que si on peut montrer qu'elle fait mieux, dans des conditions précises, que ce qui existe. Cette leçon montre comment on s'y prend, avec les erreurs réellement commises en chemin.`,
      objectives: ['Comprendre les étapes d\'une démarche de recherche', 'Savoir pourquoi un banc d\'essai reproductible passe avant l\'invention', 'Comprendre le rôle d\'un oracle et des comparaisons appariées', 'Tirer des leçons d\'un échec'],
      blocks: [
        Brief('Le projet', `<p>Objectif : mettre au point un planificateur de trajectoire nouveau, plus robuste que les méthodes actuelles quand le monde est imprévisible : foules, croisements rapides, capteurs limités, latence, roues qui patinent.</p>`, ['Recherche', 'Planification', 'Statistiques']),
        Pipe('Les étapes réellement suivies', [
          ['État de l\'art', 'Lire ce qui existe pour ne pas réinventer.', 'MPPI, MPPI multimodal (2025), commande contingente', 'On a découvert que plusieurs de nos premières idées existaient déjà : c\'est normal, et c\'est pour ça qu\'on cherche d\'abord.'],
          ['Cartographie des inspirations', 'Passer en revue une trentaine de domaines.', 'finance, météorologie, psychologie, navigation maritime…', 'Le tableau complet est dans recherche/planificateur/CARTOGRAPHIE.md.'],
          ['Banc d\'essai', 'Construire un simulateur reproductible et des scènes difficiles.', '7 scènes, 7 conditions de perturbation', 'Sans banc d\'essai fiable, on ne peut rien affirmer.'],
          ['Références et oracle', 'Comparer à ce qui marche le mieux aujourd\'hui, et à un planificateur qui connaît le futur.', 'oracle : 99 % de succès', 'L\'oracle dit combien il reste réellement à gagner.'],
          ['Essais et échecs', 'Proposer, mesurer, comprendre l\'échec, corriger.', '4 versions ratées avant VIGIE', 'Chaque échec a appris quelque chose de précis.'],
          ['Évaluation finale', 'Tester sur des mondes jamais utilisés pour régler.', 'graines 900 à 939, 11 760 épisodes', 'Sinon on mesure seulement sa capacité à régler l\'algorithme sur ses propres tests.'],
        ]),
        Table(['Version', 'Idée', 'Ce qui s\'est passé'], [
          ['v1', 'garder ses options ouvertes face à plusieurs futurs possibles', 'robot trop prudent : il hésite et finit percuté (81 % contre 96 %)'],
          ['v2', 'futurs qui s\'écartent progressivement', 'égalité avec les références, mais plus lent'],
          ['v3', 'coût en temps avant collision (loi des foules de piétons)', 'pas de gain'],
          ['v4', 'feux d\'alignement avant les passages étroits', 'gain apparent dû à un défaut du banc d\'essai, puis perte une fois le défaut corrigé'],
          ['VIGIE 1', 'imprévisibilité mesurée par agent, valeur d\'option, réflexes, engagement', 'meilleur que MPPI, au niveau de la référence 2025'],
          ['VIGIE 2', 'arcs de virage, réensemencement, prédicteur de Smith', 'aussi sûr que la meilleure référence, et plus rapide qu\'elle'],
        ]),
        Danger(`Le gain spectaculaire de la v4 venait d'un défaut du simulateur : certains couloirs étaient infranchissables pour tout le monde. Sans vérification, on aurait annoncé une fausse découverte. Toujours se demander : « et si c'était mon banc d'essai qui se trompait ? »`, 'Le piège le plus dangereux'),
        H('Le résultat qui a tout débloqué'),
        P(`<p>En regardant les résultats scène par scène, un motif est apparu : garder ses options ouvertes aidait beaucoup dans une foule qui change de direction au hasard (+20 points), et nuisait face à des obstacles rapides mais prévisibles (−17 points). L'idée de VIGIE est née de là : <strong>mesurer, pour chaque agent, à quel point il est prévisible</strong>, et n'ouvrir l'éventail des futurs possibles que pour ceux qui le méritent.</p>`),
        Q('q1', 'Pourquoi évalue-t-on l\'algorithme final sur des mondes jamais utilisés pendant sa mise au point ?', ['Pour gagner du temps', 'Parce qu\'un algorithme réglé sur ses propres tests paraît meilleur qu\'il n\'est', 'Parce que les anciens mondes sont faux', 'Ce n\'est pas nécessaire'], 1, 'C\'est le même principe que séparer données d\'entraînement et de test en apprentissage automatique.'),
        Q('q2', 'À quoi sert l\'oracle, un planificateur qui connaît le futur exact des obstacles ?', ['À remplacer le robot', 'À donner une borne haute : la marge qu\'aucun planificateur réel ne peut dépasser', 'À accélérer les calculs', 'À rien en pratique'], 1, 'Si l\'oracle échoue aussi, l\'échec est inévitable. S\'il réussit, il reste quelque chose à gagner.'),
        Think('t1', `Pense à un projet que tu as mené (école, bricolage, travail). Quelle aurait été son « oracle » ? Et son « banc d'essai reproductible » ?`, `Exemple : pour un robot suiveur de ligne, l'oracle serait un robot qui connaît parfaitement la piste ; le banc d'essai, une piste imprimée toujours identique, avec le même éclairage et la même batterie chargée. Sans cela, on attribue au code des progrès qui viennent de la batterie ou de la lumière.`),
      ],
      cards: [['Pourquoi construire le banc d\'essai avant d\'inventer ?', 'Sans mesure reproductible, on ne peut pas savoir si une idée aide.'], ['Rôle d\'un oracle ?', 'Donner la borne haute de performance atteignable.'], ['Comparaison appariée ?', 'Chaque méthode affronte exactement les mêmes mondes et perturbations.']],
    },
    {
      id: 'vigie-principe', title: 'Comment fonctionne VIGIE', sub: 'Imprévisibilité mesurée, valeur d\'option, réflexes, engagement', min: 40, level: 3,
      why: `VIGIE combine des idées venues de la météorologie, de la finance, de la physiologie et des neurosciences au-dessus d'une base solide, MPPI. Comprendre chaque brique, c'est comprendre comment on assemble une invention.`,
      objectives: ['Décrire les cinq mécanismes de VIGIE', 'Calculer un indice d\'imprévisibilité', 'Calculer une valeur d\'option', 'Observer VIGIE en course contre MPPI'],
      blocks: [
        Table(['Lettre', 'Mécanisme', 'Inspiration'], [
          ['V', 'Valeur d\'option : choisir le début de trajectoire qui garde les meilleures suites possibles', 'finance (options réelles)'],
          ['I', 'Imprévisibilité mesurée en ligne pour chaque agent', 'météorologie (vérifier ses prévisions d\'ensemble)'],
          ['G', 'Gestes réflexes (freiner, esquiver) déclenchés seulement si tous les plans sont menacés', 'physiologie (réflexe de retrait)'],
          ['I', 'Inertie d\'engagement : changer de route a un coût', 'neurosciences (accumulation de preuves avant de décider)'],
          ['E', 'Ensemble de routes qui contient toujours le plan de base', 'gestion de portefeuille : garder une valeur sûre'],
        ]),
        P(`<p>La version 2 ajoute trois briques, chacune née d'un échec observé :</p>`),
        Table(['Brique de VIGIE 2', 'Problème qu\'elle corrige', 'Inspiration'], [
          ['Arcs de virage injectés parmi les tirages', 'MPPI tire un bruit indépendant à chaque pas : les tirages se compensent et il n\'imagine presque jamais un vrai virage', 'primitives de mouvement'],
          ['Réensemencement des routes', 'un plan hérité, optimisé dans une mauvaise direction, ne revient jamais vers le bon passage', 'jardinage : on ressème quand la pousse part de travers'],
          ['Prédicteur de Smith', 'avec 200 ms de retard, le robot réagit à un monde déjà passé', 'commande des procédés chimiques (O. J. M. Smith, 1957)'],
        ]),
        H('I : mesurer l\'imprévisibilité de chaque agent'),
        P(`<p>Chaque seconde, VIGIE compare la position d'un agent avec celle qu'il avait prédite une seconde plus tôt en supposant une vitesse constante. L'erreur, lissée dans le temps, donne un indice entre 0 (parfaitement prévisible) et 1 (erratique) :</p>`),
        F('ē<sub>j</sub> ← 0,85·ē<sub>j</sub> + 0,15·‖p<sub>j</sub>(t) − (p<sub>j</sub>(t−1) + v<sub>j</sub>(t−1)·1 s)‖ &nbsp;&nbsp;&nbsp; u<sub>j</sub> = clip((ē<sub>j</sub> − 0,08) / 0,45 ; 0 ; 1)', 'un agent jamais observé assez longtemps reçoit u = 0,3'),
        P(`<p>Pour chaque futur envisagé (tout droit, virage à gauche, à droite, arrêt, accélération), l'écart à la trajectoire rectiligne est <strong>multiplié par u<sub>j</sub></strong> : un piéton prévisible garde un seul futur probable, un piéton erratique ouvre tout l'éventail.</p>`),
        Exo('e1', 'Un agent a une erreur moyenne lissée de 0,35 m. Quel est son indice d\'imprévisibilité u ?', { answer: 0.6, tol: 0.01, sol: 'u = (0,35 − 0,08) / 0,45 = 0,27 / 0,45 = <b>0,6</b>.' }),
        Code('c1', 'Écris <code>imprevisibilite(e)</code> qui renvoie u = (e − 0,08) / 0,45, borné entre 0 et 1.', {
          fn: 'imprevisibilite',
          starter: 'function imprevisibilite(e) {\n  return 0;\n}',
          tests: [[[0.35], 0.6], [[0.02], 0], [[2], 1], [[0.08], 0]],
          sol: 'function imprevisibilite(e) {\n  return Math.min(1, Math.max(0, (e - 0.08) / 0.45));\n}',
        }),
        H('V : la valeur d\'option'),
        P(`<p>VIGIE 2 entretient quatre plans en parallèle (le plan de base de MPPI et trois routes topologiquement différentes), plus trois réflexes. Pour chaque <em>début</em> de trajectoire candidat (0,8 s), il regarde, dans chaque futur possible, quelle est la meilleure <em>suite</em> encore disponible, puis fait la moyenne pondérée :</p>`),
        F('V(début<sub>i</sub>) = Σ<sub>s</sub> w<sub>s</sub> · min<sub>k</sub> J(début<sub>i</sub> + suite<sub>k</sub> | futur s)', 'on exécute le début de plus faible V'),
        Tip(`Comparer avec la règle habituelle, min<sub>k</sub> Σ<sub>s</sub> w<sub>s</sub>·J : celle-ci choisit le plan le meilleur en moyenne et s'y tient. La valeur d'option préfère un début qui laisse plusieurs bonnes portes de sortie, quel que soit le futur. C'est exactement ce qu'on paie quand on achète une option en finance : le droit de choisir plus tard.`, 'La différence qui compte'),
        Warn(`Un audit indépendant du code a relevé que ce critère est <b>optimiste</b> : E[min] ≤ min E, et l'égalité n'est atteinte que si le robot sait quel futur se produit avant de choisir sa suite, ce qui n'est pas garanti. Il a aussi montré trois faiblesses de la version 1 : un même scénario était appliqué à toutes les personnes à la fois, le début évalué durait 0,8 s alors qu'une seule commande de 0,1 s est exécutée avant de replanifier, et recoller le début d'un plan à la suite d'un autre créait des sauts de commande irréalistes. Ces remarques sont justes. La version corrigée tire un futur par personne, branche au cycle suivant, respecte l'inertie du robot et mélange E[min] et min E. La commande « en branches » elle-même n'est pas une invention : elle existe dans la littérature.`, 'Les limites de ce critère'),
        Code('c2', 'Écris <code>valeurOption(C, w)</code> : <code>C[k][s]</code> est le coût de la suite k dans le futur s, <code>w[s]</code> le poids du futur s. Renvoie Σ<sub>s</sub> w[s] · min<sub>k</sub> C[k][s].', {
          fn: 'valeurOption',
          starter: 'function valeurOption(C, w) {\n  let v = 0;\n  for (let s = 0; s < w.length; s++) {\n    // meilleur coût parmi les suites dans le futur s\n  }\n  return v;\n}',
          tests: [[[[[10, 50], [40, 20]], [0.5, 0.5]], 15], [[[[5, 5, 5]], [0.2, 0.3, 0.5]], 5], [[[[100, 1], [1, 100], [30, 30]], [0.4, 0.6]], 1]],
          sol: 'function valeurOption(C, w) {\n  let v = 0;\n  for (let s = 0; s < w.length; s++) v += w[s] * Math.min(...C.map(r => r[s]));\n  return v;\n}',
        }),
        Exo('e2', 'Deux suites, deux futurs équiprobables. Coûts : suite A = (10 ; 50), suite B = (40 ; 20). Quelle est la meilleure valeur « en moyenne » (min des moyennes) ? Compare avec la valeur d\'option (15).', { answer: 30, tol: 0.01, sol: 'Moyenne de A = 30, de B = 30 : min = <b>30</b>. La valeur d\'option vaut 0,5 × 10 + 0,5 × 20 = 15 : garder les deux portes ouvertes vaut deux fois mieux que parier sur l\'une d\'elles.' }),
        H('G et I : réflexes et engagement'),
        P(`<p>Les réflexes (freiner, esquiver à gauche ou à droite) ne sont autorisés que si le risque de collision attendu de tous les plans dépasse 25 %. Sans cette règle, le robot se fige : la première version de VIGIE freinait à plus de 80 % du temps dans les couloirs. L'inertie d'engagement ajoute un petit coût à tout changement de route, pour éviter les boucles d'hésitation observées dans la v2.</p>`),
        Pipe('Un cycle de VIGIE, dix fois par seconde', [
          ['Perception', 'Positions et vitesses des agents visibles, carte des obstacles fixes déjà vus.', '23 agents visibles', null],
          ['Imprévisibilité', 'Mise à jour de u pour chaque agent.', 'u = 0,1 (prévisible) à 0,9 (erratique)', null],
          ['Anticipation du retard', 'Les commandes envoyées pendant le retard des mesures sont rejouées pour estimer l\'état présent.', 'retard de 200 ms compensé', 'Prédicteur de Smith : il suffit de connaître le retard, mesurable par horodatage.'],
          ['Plans', 'Quatre optimisations MPPI de 96 trajectoires, une par route, avec des arcs de virage francs parmi les tirages.', 'plan de base + 3 routes', 'Les routes sont recalculées chaque seconde par A* avec pénalité de diversité, et chaque plan est réensemencé si un plan neuf fait mieux.'],
          ['Options', '4 débuts de plan + 3 réflexes, évalués dans 5 futurs.', '140 évaluations', null],
          ['Décision', 'Valeur d\'option + inertie, réflexes seulement si danger.', 'suivre la route 1', null],
          ['Action', 'Première commande (vitesse, rotation) envoyée aux moteurs.', 'v = 1,1 m/s ; ω = 0,3 rad/s', null],
        ]),
        Sim('vigie'),
        Defi('defi-vigie', 'Juge impartial', `Lance la course sur au moins 10 mondes avec au moins deux perturbations cochées. Note dans ton carnet les conditions où VIGIE fait mieux que MPPI, et celles où il ne fait pas mieux. Un bon ingénieur rapporte les deux.`, 'vigie', { goal: true }),
        Q('q1', 'Pourquoi VIGIE n\'ouvre-t-il l\'éventail des futurs que pour certains agents ?', ['Pour gagner du temps de calcul', 'Parce qu\'ouvrir l\'éventail pour tous rend le robot trop prudent face aux agents prévisibles', 'Parce que les agents prévisibles sont immobiles', 'Par hasard'], 1, 'C\'est exactement l\'échec de la v1 : traiter tous les agents comme imprévisibles fige le robot.'),
      ],
      cards: [['Indice d\'imprévisibilité de VIGIE ?', 'u = clip((ē − 0,08)/0,45), ē : erreur lissée de prédiction à 1 s.'], ['Valeur d\'option ?', 'Σ_s w_s · min_k J(début + suite_k | futur s).'], ['Quand VIGIE déclenche-t-il un réflexe ?', 'Seulement si tous ses plans ont un risque de collision attendu supérieur à 25 %.'], ['Rôle de l\'inertie d\'engagement ?', 'Éviter de changer de route sans arrêt (boucles d\'hésitation).']],
    },
    {
      id: 'vigie-resultats', title: 'Résultats, limites et prototype', sub: 'Ce que VIGIE fait mieux, ce qu\'il ne fait pas, et la suite', min: 30, level: 3,
      why: `Une invention se juge sur des chiffres honnêtes, avec leurs incertitudes et leurs limites. Et elle n'est vraiment validée qu'une fois testée sur une machine réelle.`,
      objectives: ['Lire un tableau de résultats avec intervalles de confiance', 'Comprendre une étude d\'ablation', 'Distinguer ce qui est nouveau de ce qui est emprunté', 'Préparer un essai sur prototype'],
      blocks: [
        P(`<p>L'évaluation finale de VIGIE 2 porte sur des mondes jamais utilisés pendant la mise au point : 7 scènes × 7 conditions de perturbation × 40 mondes, soit 1 960 épisodes par méthode et 11 760 en tout.</p>
<table><thead><tr><th>Méthode</th><th>Succès</th><th>Collisions</th><th>Temps moyen</th><th>Calcul par cycle</th></tr></thead><tbody>
<tr><td><b>VIGIE 2</b></td><td><b>95 %</b></td><td>4 %</td><td><b>19,0 s</b></td><td>18,0 ms</td></tr>
<tr><td>MPPI multimodal + prédicteur de Smith</td><td>95 %</td><td>4 %</td><td>19,3 s</td><td>17,4 ms</td></tr>
<tr><td>MPPI multimodal (référence récente, 2025)</td><td>94 %</td><td>5 %</td><td>19,7 s</td><td>17,2 ms</td></tr>
<tr><td>MPPI</td><td>94 %</td><td>5 %</td><td>18,5 s</td><td>2,8 ms</td></tr>
<tr><td>DWA</td><td>74 %</td><td>4 %</td><td>15,3 s</td><td>1,4 ms</td></tr>
<tr><td>A* + poursuite pure</td><td>61 %</td><td>39 %</td><td>13,5 s</td><td>0,9 ms</td></tr>
</tbody></table>
<p><b>Sécurité.</b> Sur les mêmes mondes, VIGIE 2 fait +0,3 point face à la meilleure référence équipée du même prédicteur de Smith (intervalle de confiance à 95 % : −0,8 à +1,3), +0,8 face au MPPI multimodal et +1,0 face à MPPI. Aucun de ces écarts n'est significatif : <b>VIGIE 2 est aussi sûr que le meilleur, pas plus</b>. Sous perception dégradée, il fait un peu moins bien (91 % contre 95 %).</p>
<p><b>Efficacité.</b> Sur les trajets réussis par les deux, VIGIE 2 arrive <b>0,38 s plus tôt</b> que la meilleure référence (intervalle −0,52 à −0,24 s, sur 1 800 paires) et 0,79 s plus tôt que le MPPI multimodal : un avantage <b>significatif</b>, à sécurité égale.</p>
<h3>Ablation et contre-vérification</h3>
<p>En retirant une à une les briques ajoutées dans VIGIE 2 (prédicteur de Smith, réensemencement, arcs de virage), aucun écart n'est significatif sur les mondes de test. Le réensemencement et les arcs, qui débloquaient un couloir en développement, n'apportent pas de gain global mesurable : ils seront réexaminés sur un échantillon plus grand. La version JavaScript de ce simulateur, écrite indépendamment, bat le MPPI de l'application de 4,8 points (intervalle +1,7 à +7,9), devant dans les 7 conditions.</p>
<h3>Deux leçons de méthode</h3>
<ul><li>En développement, VIGIE 2 avait 1,9 point d'avance, un écart significatif. Sur les mondes neufs, cette avance a disparu. C'est la deuxième fois : sans mondes de test séparés, on aurait annoncé une supériorité fausse.</li>
<li>Toutes les variantes de MPPI plafonnent entre 94 et 95 %, et un planificateur qui connaît le futur atteint 99 %. Une bonne partie des échecs restants est inévitable dans ce banc d'essai. Pour départager davantage, il faudra des scènes plus dures, ou le réel.</li></ul>
<h3>Ce qu'on peut affirmer</h3>
<ul><li><b>VIGIE est nouveau dans sa combinaison.</b> Nous n'avons trouvé aucune publication qui règle l'éventail des futurs de chaque agent par son imprévisibilité mesurée en ligne, et qui choisit entre routes topologiques et réflexes par valeur d'option. Chaque brique a des parents connus.</li>
<li><b>VIGIE 2 fonctionne et résiste</b> aux sept conditions de perturbation, au niveau de la meilleure méthode récente, et il arrive plus vite qu'elle.</li>
<li><b>Il ne la surpasse pas en sécurité.</b> L'écart n'est pas significatif.</li>
<li><b>Tout cela est en simulation.</b> Le vrai juge sera un robot réel.</li></ul>
<h3>Vers un prototype</h3>
<p>Plateforme envisagée : robot à deux roues motrices (vitesse maximale 1,5 m/s), lidar 2D pour détecter et suivre les personnes, ordinateur embarqué de type Raspberry Pi 5 ou Jetson, VIGIE intégré comme module de commande de ROS 2 (Nav2). Les essais iront du plus sûr au plus exigeant : mannequins sur chariots poussés, puis personnes qui marchent selon un scénario connu, puis circulation libre, toujours avec arrêt d'urgence et vitesse limitée.</p>`),
        Dossier('dos-vigie', 'Mon plan d\'essai sur un vrai robot', `Prépare le passage de la simulation au réel. Tes réponses sont gardées dans ton carnet.`, [
          'Quel robot (roues, taille, vitesse maximale) et quels capteurs (lidar 2D, caméra de profondeur) choisirais-tu pour tester VIGIE ? Justifie avec les besoins de l\'algorithme : positions et vitesses des personnes autour.',
          'Quel ordinateur embarqué, et comment vérifies-tu que VIGIE tient ses 10 cycles par seconde dessus ?',
          'Décris trois scénarios d\'essai avec des personnes, du plus sûr au plus exigeant, et les mesures de sécurité de chacun.',
          'Quels résultats de la simulation risquent de ne pas se retrouver dans le réel ? Pourquoi ?',
        ], ['J\'ai relié mes choix matériels aux besoins de l\'algorithme', 'Mes essais commencent sans danger pour personne', 'J\'ai prévu de mesurer les mêmes indicateurs qu\'en simulation', 'J\'ai identifié au moins deux écarts possibles entre simulation et réel']),
      ],
      cards: [['Étude d\'ablation ?', 'Retirer une brique à la fois pour mesurer sa contribution.'], ['Pourquoi des intervalles de confiance ?', 'Pour savoir si un écart est réel ou dû au hasard des mondes tirés.']],
    },
  ],
};
