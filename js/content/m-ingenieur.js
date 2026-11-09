import { P, H, Tip, Warn, Danger, Future, Real, Info, F, Sim, Pipe, Q, Exo, Code, Defi, Manual, Think, Table } from './b.js';

// ============================================================================
// Ingénierie système et sécurité
// ============================================================================

export const systemes = {
  id: 'systemes', phase: 'ingenieur', icon: '🏗️', title: 'Ingénierie système et sécurité',
  desc: 'Cahier des charges, cycle en V, gestion de projet, sûreté de fonctionnement et normes de sécurité des robots.',
  master: 'Ingénierie système, projet',
  intro: 'Savoir faire un algorithme ne suffit pas : il faut livrer un robot qui répond au besoin, dans les délais, et qui ne blesse personne. C\'est ce qui distingue un ingénieur d\'un bricoleur talentueux.',
  lessons: [
    {
      id: 'projet', title: 'Du besoin au robot : mener un projet', sub: 'Cahier des charges, cycle en V, agilité', min: 22, level: 2,
      why: 'En Master comme en entreprise, tu travailleras en projet, en équipe, avec un client. Les méthodes d\'ingénierie système évitent les catastrophes classiques : mauvais besoin, intégration ratée, retard.',
      objectives: ['Rédiger des exigences mesurables', 'Comprendre le cycle en V et les méthodes agiles', 'Faire une analyse fonctionnelle', 'Organiser le travail d\'équipe'],
      blocks: [
        H('Des exigences mesurables'),
        Table(['Mauvaise exigence', 'Bonne exigence'], [
          ['Le robot doit être rapide.', 'Le robot doit se déplacer à 1,2 m/s minimum sur sol plat.'],
          ['Le robot doit avoir une bonne autonomie.', 'Le robot doit fonctionner 4 h en mission type avant recharge.'],
          ['Le bras doit être précis.', 'Répétabilité de positionnement de ±0,1 mm sur tout l\'espace de travail.'],
          ['Le robot doit être sûr.', 'Arrêt complet en moins de 0,5 s si une personne entre à moins de 1 m (valeurs issues de l\'analyse de risques et des calculs de distance de sécurité des normes ISO 13855 et ISO 10218).'],
        ]),
        Tip('On résume souvent une bonne exigence par l\'acronyme SMART : Spécifique, Mesurable, Atteignable, Réaliste, et Temporellement défini. Pour une exigence technique, on remplace volontiers le T par « Testable » : si tu ne sais pas comment la tester, elle n\'est pas finie.', 'Le test SMART'),
        H('Le cycle en V'),
        Pipe('Le cycle en V : chaque étape de conception a son étape de vérification en miroir', [
          ['Besoin', 'Qu\'attend le client ?', 'cahier des charges', 'En miroir : la recette par le client.'],
          ['Spécification système', 'Que doit faire le robot, chiffré ?', 'exigences', 'En miroir : la validation du système complet.'],
          ['Architecture', 'Quels sous-systèmes, quelles interfaces ?', 'schéma d\'architecture', 'En miroir : les tests d\'intégration.'],
          ['Conception détaillée', 'Chaque composant, chaque module logiciel.', 'plans, code', 'En miroir : les tests unitaires.'],
          ['Réalisation', 'Fabriquer, coder.', 'prototype', 'Le bas du V.'],
          ['Remontée', 'Tests unitaires → intégration → validation → recette.', 'preuves', 'On vérifie à chaque niveau ce qu\'on a défini en descendant.'],
        ]),
        P('<p>Les <strong>méthodes agiles</strong> (Scrum, Kanban) découpent le projet en courtes itérations (sprints de 1 à 4 semaines) qui livrent chacune quelque chose de fonctionnel. En robotique, on combine souvent : agile pour le logiciel, V pour le matériel et la sécurité, qui supportent mal les changements tardifs.</p>'),
        H('L\'analyse fonctionnelle'),
        P('<p>Avant de penser solution, on liste les <strong>fonctions</strong> que le robot doit remplir et les <strong>contraintes</strong> qu\'il doit respecter, vis-à-vis de tout ce qui l\'entoure (utilisateur, environnement, énergie, normes, maintenance). Les outils classiques : diagramme « bête à cornes » (à qui rend-il service, sur quoi agit-il, dans quel but ?), diagramme pieuvre, et en ingénierie système moderne, SysML.</p>'),
        Think('t1', 'Rédige trois exigences SMART pour un robot qui livre des médicaments dans les couloirs d\'un hôpital.', 'Exemples : (1) transporter jusqu\'à 20 kg de charge ; (2) naviguer à 0,8 m/s maximum dans les couloirs et 0,3 m/s à moins de 2 m d\'une personne ; (3) n\'ouvrir le compartiment qu\'après authentification par badge, avec journal horodaté des ouvertures. Toutes vérifiables par un test.'),
        Q('q1', 'Laquelle de ces exigences est testable ?', ['Le robot doit être facile à utiliser', 'Un nouvel utilisateur doit réussir à lancer une mission en moins de 2 minutes sans aide, dans 9 cas sur 10', 'Le robot doit plaire', 'Le robot doit être moderne'], 1, 'Elle précise un critère, une mesure et un seuil.'),
      ],
      cards: [['Qu\'est-ce qu\'une exigence SMART ?', 'Spécifique, Mesurable, Atteignable, Réaliste, Temporellement définie (ou Testable pour une exigence technique).'], ['Principe du cycle en V ?', 'Chaque étape de conception a une étape de vérification correspondante.'], ['Méthode agile en robotique ?', 'Itérations courtes livrant du fonctionnel, souvent pour le logiciel.']],
    },
    {
      id: 'surete', title: 'Sûreté de fonctionnement et sécurité des robots', sub: 'Normes, analyse de risques, cobotique', min: 25, level: 2,
      why: 'Un robot industriel peut tuer. Un robot de service évolue parmi des enfants et des personnes âgées. La sécurité n\'est pas une option : c\'est une obligation légale et morale, et une compétence très recherchée.',
      objectives: ['Connaître les grandes normes de sécurité robotique', 'Conduire une analyse de risques (AMDEC)', 'Comprendre les modes de collaboration homme-robot', 'Concevoir une chaîne de sécurité'],
      blocks: [
        Table(['Norme / texte', 'Objet'], [
          ['ISO 10218-1 et -2', 'sécurité des robots industriels et de leur intégration'],
          ['ISO/TS 15066', 'robots collaboratifs : forces et pressions maximales tolérables par zone du corps'],
          ['ISO 13849 / IEC 62061', 'fiabilité des fonctions de sécurité des machines (niveaux PL, SIL)'],
          ['ISO 13482', 'robots de soins personnels (service, assistance)'],
          ['ISO 3691-4', 'chariots autonomes et robots mobiles industriels'],
          ['Règlement européen Machines 2023/1230', 'remplace la directive Machines ; s\'applique à partir de 2027, intègre logiciel, IA et cybersécurité'],
          ['Règlement européen sur l\'IA', 'exigences pour les systèmes d\'IA à haut risque, dont certains composants de sécurité'],
        ]),
        H('Les quatre modes de collaboration'),
        P('<p>Ils ont été définis par l\'ISO 10218 et l\'ISO/TS 15066 ; la révision de 2025 de l\'ISO 10218 a réorganisé ces notions, mais les quatre principes restent la base de toute conception collaborative.</p>'),
        Table(['Mode', 'Principe'], [
          ['Arrêt nominal de sécurité surveillé', 'le robot s\'arrête quand l\'humain entre dans la zone'],
          ['Guidage manuel', 'l\'opérateur guide le robot à la main'],
          ['Contrôle de vitesse et de séparation', 'le robot ralentit et s\'arrête selon la distance à l\'humain (scanners laser)'],
          ['Limitation de puissance et de force', 'le contact est permis mais les forces restent sous les seuils de l\'ISO/TS 15066'],
        ]),
        H('L\'AMDEC'),
        P('<p>L\'<strong>Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité</strong> passe chaque composant en revue : comment peut-il tomber en panne ? Quel effet ? Avec quelle gravité (G), quelle fréquence (F), quelle probabilité de non-détection (D) ? La criticité C = G × F × D permet de prioriser les actions.</p>'),
        Code('c1', 'Écris <code>prioriser(defaillances)</code> : chaque défaillance est <code>{ nom, G, F, D }</code>. Renvoie la liste des noms triée par criticité décroissante (G × F × D).', {
          fn: 'prioriser',
          starter: 'function prioriser(defaillances) {\n  // copier, trier par G*F*D décroissant, renvoyer les noms\n  return [];\n}',
          tests: [[[[{ nom: 'codeur', G: 8, F: 3, D: 4 }, { nom: 'câble', G: 6, F: 6, D: 2 }, { nom: 'frein', G: 10, F: 2, D: 5 }]], ['frein', 'codeur', 'câble']]],
          sol: 'function prioriser(d) {\n  return [...d].sort((a, b) => b.G * b.F * b.D - a.G * a.F * a.D).map(x => x.nom);\n}',
        }),
        H('La chaîne de sécurité'),
        Pipe('Arrêt d\'urgence : du bouton au moteur', [
          ['Détection', 'Bouton d\'arrêt d\'urgence, scanner laser de sécurité, tapis sensible.', 'contact à ouverture forcée', 'Les composants de sécurité sont certifiés et redondés.'],
          ['Logique de sécurité', 'Automate de sécurité ou relais de sécurité, double canal.', 'redondance + surveillance croisée', 'Une seule panne ne doit jamais empêcher l\'arrêt.'],
          ['Coupure', 'Fonction STO (Safe Torque Off) des variateurs.', 'plus de couple moteur', 'On coupe l\'énergie des moteurs de façon sûre, indépendamment du logiciel principal.'],
          ['Freins', 'Freins à manque de courant sur les axes soumis à la gravité.', 'le bras ne tombe pas', 'Ils se serrent quand l\'alimentation disparaît.'],
          ['Vérification', 'Tests périodiques de la chaîne.', 'journal de maintenance', 'Une fonction de sécurité jamais testée est une fonction dont on ne sait pas si elle marche.'],
        ]),
        Danger('Ne mets jamais la sécurité des personnes uniquement dans un programme qui tourne sur le même ordinateur que le reste du logiciel. La sécurité passe par des composants dédiés, redondants et certifiés. Et sur tes propres prototypes : un arrêt d\'urgence physique accessible, toujours.', 'Règle absolue'),
        Q('q1', 'Pourquoi les chaînes de sécurité sont-elles à double canal ?', ['Pour aller deux fois plus vite', 'Pour qu\'une seule défaillance ne puisse pas empêcher l\'arrêt', 'Pour économiser du câble', 'Par tradition'], 1, 'La redondance avec surveillance croisée détecte une panne d\'un canal et garantit l\'arrêt par l\'autre.'),
      ],
      cards: [['Norme des robots collaboratifs ?', 'ISO/TS 15066 (avec ISO 10218).'], ['Criticité en AMDEC ?', 'C = Gravité × Fréquence × Non-détection.'], ['Qu\'est-ce que la fonction STO ?', 'Safe Torque Off : coupure sûre du couple moteur dans le variateur.'], ['Les 4 modes collaboratifs ?', 'Arrêt surveillé, guidage manuel, contrôle vitesse/séparation, limitation puissance/force.']],
    },
  ],
};

// ============================================================================
// Créativité et invention
// ============================================================================

export const creativite = {
  id: 'creativite', phase: 'ingenieur', icon: '💡', title: 'Créativité et invention',
  desc: 'Méthodes pour inventer, prototyper vite, et communiquer ses idées : ce qui fait un ingénieur qui crée.',
  master: 'Innovation, projets',
  intro: 'La créativité n\'est pas un don réservé à quelques-uns : c\'est un ensemble de méthodes qui s\'apprennent et s\'entraînent. Ce module te donne des outils concrets pour produire des idées nouvelles et les transformer en prototypes.',
  lessons: [
    {
      id: 'methodes-creatives', title: 'Méthodes de créativité', sub: 'SCAMPER, TRIZ, biomimétisme, design thinking', min: 25, level: 1,
      why: 'Face à un problème nouveau, la plupart des gens s\'arrêtent à la première idée. Les méthodes de créativité permettent d\'en produire des dizaines, puis de choisir la meilleure. C\'est ce qu\'on attend d\'un ingénieur.',
      objectives: ['Utiliser SCAMPER pour transformer une idée existante', 'Comprendre le principe des contradictions de TRIZ', 'S\'inspirer du vivant (biomimétisme)', 'Appliquer le design thinking'],
      blocks: [
        H('SCAMPER : sept questions pour transformer'),
        Table(['Lettre', 'Question', 'Exemple sur un robot aspirateur'], [
          ['S – Substituer', 'Que peut-on remplacer ?', 'remplacer les roues par des chenilles pour les tapis épais'],
          ['C – Combiner', 'Que peut-on associer ?', 'aspirateur + serpillière + surveillance de la maison'],
          ['A – Adapter', 'Qu\'emprunter à un autre domaine ?', 'reprendre le principe de l\'aspiration centralisée pour vider le bac automatiquement à la base'],
          ['M – Modifier', 'Agrandir, réduire, changer la forme ?', 'forme en D pour mieux nettoyer les coins'],
          ['P – Proposer d\'autres usages', 'À quoi d\'autre peut-il servir ?', 'détecter des fuites d\'eau, surveiller un animal'],
          ['E – Éliminer', 'Que peut-on supprimer ?', 'supprimer la brosse latérale qui emmêle les cheveux'],
          ['R – Renverser', 'Et si on inversait ?', 'et si le robot poussait la poussière vers une bouche d\'aspiration fixe au lieu de l\'aspirer lui-même ?'],
        ]),
        H('TRIZ : résoudre les contradictions'),
        P('<p>TRIZ, développée par Genrich Altshuller à partir de l\'analyse de dizaines de milliers de brevets, part d\'un constat : les problèmes difficiles cachent une <strong>contradiction</strong>. « Je veux un bras rigide pour être précis, mais souple pour être sûr. » Plutôt qu\'un compromis tiède, TRIZ propose de résoudre la contradiction avec des principes inventifs : séparer dans le temps (rigide en mouvement, souple au contact), dans l\'espace (rigide à la base, souple au bout), par changement de paramètre (raideur variable), etc.</p>'),
        Real('Résolution réelle de cette contradiction : les actionneurs à raideur variable et les articulations à élasticité série, qui donnent des bras rigides quand il faut de la précision et souples quand un choc survient.'),
        H('Biomimétisme : 3,8 milliards d\'années de R&D'),
        Table(['Modèle vivant', 'Inspiration robotique'], [
          ['Pattes de gecko', 'pinces adhésives sèches qui saisissent avec très peu de force de serrage'],
          ['Trompe d\'éléphant, tentacule de pieuvre', 'bras souples continus, robotique molle'],
          ['Colonies de fourmis', 'essaims de robots, algorithmes d\'optimisation'],
          ['Vol des insectes', 'micro-drones à ailes battantes'],
          ['Chat qui retombe sur ses pattes', 'robots qui se réorientent en l\'air'],
          ['Poisson, anguille', 'robots sous-marins à nage ondulante, discrets'],
          ['Peau humaine', 'peaux tactiles pour mains robotiques'],
        ]),
        H('Le design thinking'),
        Pipe('Les cinq étapes du design thinking', [
          ['Empathie', 'Observer et écouter les vrais utilisateurs, sur le terrain.', 'interviews, observation', 'Les utilisateurs disent rarement ce dont ils ont besoin : on observe ce qu\'ils font.'],
          ['Définir', 'Formuler le vrai problème.', '« Comment pourrions-nous... ? »', null],
          ['Idéer', 'Produire beaucoup d\'idées sans juger.', '50 idées en 30 min', 'La quantité mène à la qualité. On juge après.'],
          ['Prototyper', 'Fabriquer vite pour tester une idée.', 'carton, maquette, simulation', null],
          ['Tester', 'Confronter aux utilisateurs, apprendre, recommencer.', 'retours', 'On boucle autant de fois que nécessaire.'],
        ]),
        Manual('defi-scamper', 'Cinq idées en quinze minutes', 'Prends un robot qui existe (bras industriel, drone, robot tondeuse...). Applique les sept questions SCAMPER et note au moins cinq idées nouvelles dans ton carnet d\'ingénieur (bouton « Nouvelle idée »). Garde la plus folle : c\'est souvent elle qui contient le germe de la meilleure.', 60),
        Q('q1', 'Selon TRIZ, que faire face à une contradiction « rigide ET souple » ?', ['Choisir un compromis moyen', 'Chercher à séparer les deux exigences (dans le temps, l\'espace, les conditions)', 'Abandonner le projet', 'Choisir l\'un des deux'], 1, 'TRIZ cherche à satisfaire les deux exigences, pas à les moyenner.'),
      ],
      cards: [['Que signifie SCAMPER ?', 'Substituer, Combiner, Adapter, Modifier, Proposer d\'autres usages, Éliminer, Renverser.'], ['Idée centrale de TRIZ ?', 'Résoudre les contradictions techniques avec des principes inventifs plutôt que par compromis.'], ['Étapes du design thinking ?', 'Empathie, définir, idéer, prototyper, tester.']],
    },
    {
      id: 'prototypage', title: 'Prototyper vite et bien', sub: 'CAO, impression 3D, électronique rapide', min: 22, level: 1,
      why: 'Une idée qui reste sur papier ne vaut rien. Savoir fabriquer un prototype en quelques jours, avec des moyens modestes, est un superpouvoir d\'ingénieur.',
      objectives: ['Connaître les outils de CAO et de fabrication numérique', 'Choisir la bonne fidélité de prototype', 'Organiser des itérations rapides', 'Utiliser les fablabs et l\'open source'],
      blocks: [
        Table(['Outil', 'Pour quoi', 'Logiciels / exemples'], [
          ['CAO mécanique', 'dessiner les pièces en 3D', 'FreeCAD (libre), Onshape, Fusion, SolidWorks, CATIA'],
          ['Impression 3D (FDM)', 'pièces en plastique en quelques heures', 'PLA pour prototyper, PETG ou nylon pour la résistance'],
          ['Découpe laser', 'plaques de bois, acrylique, carton', 'châssis plats, montages rapides'],
          ['CAO électronique', 'concevoir des circuits imprimés', 'KiCad (libre)'],
          ['Simulation', 'tester avant de fabriquer', 'Gazebo, Webots, MuJoCo'],
          ['Plateformes électroniques', 'prototyper le cerveau', 'Arduino, ESP32, Raspberry Pi, cartes de développement STM32'],
        ]),
        H('Choisir la fidélité'),
        P('<ul><li><strong>Basse fidélité</strong> (carton, LEGO, pâte à modeler, scotch) : tester une idée de forme ou de cinématique en une heure.</li><li><strong>Fidélité moyenne</strong> (impression 3D, Arduino, moteurs bon marché) : tester le fonctionnement.</li><li><strong>Haute fidélité</strong> (pièces usinées, électronique dédiée) : tester les performances réelles et la fiabilité.</li></ul><p>Ne passe au niveau suivant que quand le précédent a répondu à ses questions.</p>'),
        Tip('Avant chaque prototype, écris la question à laquelle il doit répondre : « le bras peut-il soulever 500 g ? », « le robot passe-t-il sous un lit ? ». Un prototype sans question est un objet, pas une expérience.', 'Un prototype = une question'),
        Real('Les fablabs (laboratoires de fabrication) ouverts au public existent dans la plupart des villes et des universités : imprimantes 3D, découpeuses laser, fraiseuses, électronique, et surtout des gens qui savent s\'en servir. C\'est l\'endroit idéal pour tes premiers projets.'),
        Think('t1', 'Tu veux tester l\'idée d\'une pince à trois doigts souples. Décris un prototype que tu pourrais fabriquer en moins de deux heures, avec ce que tu as chez toi.', 'Exemple : trois doigts en ballons de baudruche remplis de café moulu (principe du « jamming » : souple à pression normale, rigide quand on aspire l\'air avec une seringue), ou des doigts en carton actionnés par des fils comme des tendons. L\'important : tester rapidement si la forme saisit des objets variés.'),
        Manual('defi-proto', 'Prototype express', 'Choisis une idée de ton carnet et fabriques-en un prototype basse fidélité (carton, LEGO, matériel de récupération) en moins de deux heures. Photographie-le, note dans ton carnet ce qu\'il t\'a appris et ce que tu changerais.', 80),
      ],
      cards: [['Logiciel libre de CAO mécanique ?', 'FreeCAD.'], ['Logiciel libre de CAO électronique ?', 'KiCad.'], ['Règle d\'or du prototypage ?', 'Chaque prototype doit répondre à une question précise.']],
    },
    {
      id: 'communiquer', title: 'Communiquer, documenter, se faire connaître', sub: 'Rapports, présentations, portfolio, open source', min: 18, level: 1,
      why: 'Une invention que personne ne comprend n\'existe pas. Savoir expliquer, documenter et montrer son travail ouvre les portes des stages, des thèses et des emplois.',
      objectives: ['Structurer un rapport technique et une présentation', 'Documenter un projet pour qu\'il soit reproductible', 'Construire un portfolio', 'Contribuer à l\'open source et à la communauté'],
      blocks: [
        Table(['Support', 'Structure efficace'], [
          ['Rapport technique', 'résumé (une page) → contexte et besoin → état de l\'art → solution → résultats chiffrés → limites → perspectives'],
          ['Présentation orale', 'un message principal → le problème (pourquoi ça compte) → la solution (une image vaut mille mots) → la preuve (démo, mesures) → la suite'],
          ['README de projet', 'ce que c\'est → une image ou une vidéo → comment l\'installer → comment l\'utiliser → comment contribuer'],
          ['Vidéo de démonstration', '30 à 90 secondes, sans musique envahissante, le robot qui fonctionne, des chiffres à l\'écran'],
        ]),
        Tip('Pour toute présentation : si ton auditoire ne devait retenir qu\'une phrase, laquelle ? Écris-la d\'abord. Tout le reste doit servir cette phrase.', 'Le message unique'),
        H('Le portfolio d\'ingénieur'),
        P('<p>Un dépôt GitHub propre avec trois projets bien documentés (photos, vidéos, schémas, code commenté, ce que tu as appris) vaut souvent plus qu\'une ligne de plus sur un CV. Les recruteurs et les directeurs de laboratoire regardent ce que tu as <em>fait</em>.</p>'),
        P('<ul><li>Participe à des compétitions : Coupe de France de robotique, Eurobot, RoboCup, compétitions de drones, hackathons.</li><li>Contribue à l\'open source : corriger une documentation de ROS 2 est un excellent premier pas.</li><li>Écris : un article de blog qui explique comment tu as résolu un problème aide les autres et prouve ta compréhension.</li><li>Rejoins les associations de robotique de ton école ou de ta ville.</li></ul>'),
        Manual('defi-portfolio', 'Ta vitrine', 'Dans le dépôt Git créé plus tôt, écris un README qui présente un de tes projets (même un exercice de cette application) avec : une phrase de résumé, une image, ce que tu as appris, et ce que tu améliorerais. Montre-le à quelqu\'un et demande-lui ce qu\'il a compris.', 60),
        Q('q1', 'Quel élément est le plus important dans un rapport lu par un décideur pressé ?', ['La bibliographie', 'Le résumé en début de document', 'Les annexes', 'La police d\'écriture'], 1, 'Beaucoup ne liront que le résumé : il doit contenir le problème, la solution et les résultats chiffrés.'),
      ],
      cards: [['Structure d\'une présentation efficace ?', 'Message, problème, solution, preuve, suite.'], ['Que contient un bon README ?', 'Description, visuel, installation, utilisation, contribution.'], ['Compétitions de robotique accessibles ?', 'Coupe de France de robotique, Eurobot, RoboCup, hackathons.']],
    },
  ],
};

// ============================================================================
// La robotique de demain
// ============================================================================

export const futur = {
  id: 'futur', phase: 'ingenieur', icon: '🔭', title: 'La robotique de demain',
  desc: 'Humanoïdes, robots généralistes, robotique molle, essaims, éthique, réglementation : anticiper pour avoir une longueur d\'avance.',
  master: 'Veille et ouverture',
  intro: 'Tu commences ta carrière au moment où la robotique change d\'échelle. Ce module dresse la carte des tendances, des débats et des compétences de demain, et te donne une méthode pour continuer à anticiper par toi-même.',
  lessons: [
    {
      id: 'tendances', title: 'Les grandes tendances', sub: 'Où va la robotique', min: 22, level: 1,
      why: 'Les technologies qui seront mûres pendant ta carrière sont en train d\'émerger aujourd\'hui dans les laboratoires. Les repérer tôt, c\'est choisir ses spécialités, ses stages et ses projets en connaissance de cause.',
      objectives: ['Connaître les grandes tendances technologiques en robotique', 'Identifier les verrous qui restent à lever', 'Relier chaque tendance aux compétences à développer'],
      blocks: [
        Table(['Tendance', 'Ce qui change', 'Verrous', 'Compétences clés'], [
          ['Robots humanoïdes', 'des humanoïdes passent de la démonstration aux premiers essais en usine et en logistique', 'coût, autonomie énergétique, fiabilité, dextérité des mains', 'actionneurs, commande du corps entier, apprentissage'],
          ['Robots généralistes pilotés par IA', 'une même politique sait faire de nombreuses tâches à partir de consignes', 'données, généralisation, sécurité, évaluation', 'apprentissage par imitation, modèles VLA, intégration sûre'],
          ['Cobotique et robotique de service', 'robots à côté des humains : usines, hôpitaux, commerces, foyers', 'interaction sûre et naturelle, acceptabilité', 'sécurité, interaction humain-robot, perception'],
          ['Robotique molle (soft robotics)', 'robots en matériaux souples, intrinsèquement sûrs', 'modélisation, commande, durabilité des matériaux', 'mécanique des matériaux, commande non linéaire'],
          ['Essaims et multi-robots', 'des dizaines de robots coordonnés', 'communication, passage à l\'échelle, robustesse', 'systèmes distribués, algorithmes collectifs'],
          ['Micro et nano-robotique', 'robots dans le corps humain, chirurgie mini-invasive', 'actionnement, localisation, biocompatibilité', 'physique à petite échelle, biomédical'],
          ['Robots d\'exploration', 'océans, espace, zones sinistrées', 'autonomie totale sans communication', 'autonomie, robustesse, énergie'],
          ['Jumeaux numériques et simulation', 'concevoir, tester et entraîner en virtuel', 'écart simulation-réalité', 'simulation physique, rendu, apprentissage'],
          ['Robotique durable', 'robots réparables, économes, recyclables, au service de la transition écologique', 'conception, matériaux, énergie', 'écoconception, analyse de cycle de vie'],
        ]),
        Future('Une manière de lire ce tableau : la robotique converge vers des systèmes qui <b>apprennent</b> (au lieu d\'être entièrement programmés), qui <b>côtoient</b> les humains (au lieu d\'être enfermés dans des cages) et qui sont <b>polyvalents</b> (au lieu d\'être spécialisés). Chacune de ces évolutions crée un besoin d\'ingénieurs capables de garantir la sécurité et la fiabilité de systèmes moins prévisibles.', 'Une lecture d\'ensemble'),
        H('Ce qui reste difficile'),
        P('<ul><li><strong>La manipulation dextre</strong> : saisir un objet inconnu, mou, glissant, et le manipuler avec finesse, reste bien plus difficile pour un robot que de jouer aux échecs (paradoxe de Moravec).</li><li><strong>L\'énergie</strong> : les batteries limitent l\'autonomie des robots mobiles, surtout des humanoïdes et des drones.</li><li><strong>La fiabilité sur le long terme</strong> : fonctionner des milliers d\'heures sans intervention dans un environnement réel et changeant.</li><li><strong>L\'évaluation</strong> : comment prouver qu\'un robot qui apprend est sûr dans toutes les situations ?</li><li><strong>Le coût</strong> : pour que les robots se diffusent, ils doivent devenir beaucoup moins chers à fabriquer, à installer et à maintenir.</li></ul>'),
        Think('t1', 'Choisis une tendance du tableau. Imagine le robot de cette famille en 2035 : que sait-il faire ? Quel problème technique a dû être résolu pour y arriver ? Quelle compétence aimerais-tu apporter ?', 'Pas de réponse unique : l\'important est de relier une vision à un verrou technique précis et à une compétence. C\'est exactement l\'exercice d\'un projet de thèse ou d\'une lettre de motivation de Master.'),
        Q('q1', 'Que dit le paradoxe de Moravec ?', ['Les robots seront plus intelligents que les humains', 'Ce qui est facile pour un humain (percevoir, manipuler) est souvent très difficile pour un robot, et inversement', 'Les robots coûtent toujours plus cher', 'L\'IA ne progressera plus'], 1, 'Calculer est facile pour une machine ; marcher dans une pièce encombrée et ramasser un verre ne l\'est pas.'),
      ],
      cards: [['Qu\'est-ce que le paradoxe de Moravec ?', 'Les capacités sensorimotrices simples pour un humain sont très difficiles pour un robot, et inversement.'], ['Trois grandes évolutions de la robotique ?', 'Robots qui apprennent, qui côtoient les humains, qui sont polyvalents.'], ['Principaux verrous des humanoïdes ?', 'Coût, énergie, fiabilité et dextérité des mains.']],
    },
    {
      id: 'ethique', title: 'Éthique, société et réglementation', sub: 'Pour qui et pour quoi construit-on des robots ?', min: 20, level: 1,
      why: 'Les ingénieurs façonnent la société autant que les lois. Responsabilité en cas d\'accident, impact sur l\'emploi, vie privée, usages militaires : tu devras prendre position et faire des choix de conception qui ont des conséquences.',
      objectives: ['Identifier les grandes questions éthiques de la robotique', 'Connaître le cadre réglementaire européen', 'Intégrer l\'éthique dans les choix de conception'],
      blocks: [
        Table(['Question', 'Enjeux'], [
          ['Responsabilité', 'si un robot autonome blesse quelqu\'un, qui est responsable : fabricant, intégrateur, utilisateur, développeur de l\'IA ?'],
          ['Emploi', 'les robots suppriment certaines tâches, en créent d\'autres ; comment accompagner les transitions ?'],
          ['Vie privée', 'un robot domestique avec caméras et micros collecte des données intimes'],
          ['Biais', 'une IA entraînée sur des données biaisées peut mal percevoir certaines personnes'],
          ['Dépendance et lien social', 'robots de compagnie pour personnes âgées : aide précieuse ou substitut à la présence humaine ?'],
          ['Usages militaires', 'systèmes d\'armes autonomes : débat international sur le contrôle humain'],
          ['Environnement', 'extraction de métaux rares, consommation énergétique, fin de vie des robots'],
        ]),
        H('Le cadre européen'),
        P('<ul><li><strong>Règlement Machines (UE) 2023/1230</strong> : exigences de sécurité des machines, dont les robots, applicable à partir de janvier 2027 ; il traite explicitement des comportements évolutifs (logiciel, IA) et de la cybersécurité.</li><li><strong>Règlement sur l\'IA</strong> : approche par niveaux de risque ; les systèmes d\'IA qui sont des composants de sécurité de produits réglementés sont considérés à haut risque, avec des obligations de gestion des risques, de qualité des données, de traçabilité et de supervision humaine.</li><li><strong>RGPD</strong> : protection des données personnelles collectées par les robots.</li><li><strong>Responsabilité du fait des produits</strong> : le cadre européen a été modernisé pour couvrir les logiciels.</li></ul>'),
        Tip('« Privacy by design », « safety by design » : intégrer la protection des données et la sécurité dès la conception, pas en fin de projet. Exemples : traiter les images directement sur le robot sans les envoyer dans le cloud, flouter les visages par défaut, journaliser les décisions du robot pour pouvoir les expliquer.', 'L\'éthique dans le code'),
        Think('t1', 'Un client te demande d\'ajouter la reconnaissance faciale à un robot d\'accueil de supermarché « pour personnaliser l\'accueil ». Quelles questions te poses-tu avant d\'accepter ? Quelle alternative pourrais-tu proposer ?', 'Questions : base légale au regard du RGPD (données biométriques, donc sensibles), consentement réel, durée de conservation, risque de détournement (surveillance), biais de reconnaissance. Alternative : personnalisation sur demande (carte de fidélité présentée volontairement), traitement local sans stockage, détection de présence sans identification.'),
        Q('q1', 'Que signifie « privacy by design » ?', ['Cacher le code source', 'Intégrer la protection des données dès la conception du système', 'Ajouter une politique de confidentialité à la fin', 'Interdire les caméras'], 1, 'C\'est un principe inscrit dans le RGPD.'),
      ],
      cards: [['Règlement européen sur la sécurité des machines ?', 'Règlement Machines (UE) 2023/1230, applicable à partir de 2027.'], ['Qu\'est-ce que le « safety by design » ?', 'Intégrer la sécurité dès la conception.'], ['Une image de visage traitée pour identifier une personne, au sens du RGPD ?', 'Une donnée biométrique, catégorie sensible, très encadrée.']],
    },
    {
      id: 'competences', title: 'Les compétences de l\'ingénieur de 2035', sub: 'Se préparer à ce qui arrive', min: 18, level: 1,
      why: 'Les outils changeront plusieurs fois pendant ta carrière. Certaines compétences, elles, gardent leur valeur. Savoir lesquelles cultiver dès maintenant, c\'est investir intelligemment ton temps.',
      objectives: ['Distinguer compétences durables et outils éphémères', 'Construire ton profil en T', 'Planifier ta progression'],
      blocks: [
        Table(['Durable (investis à fond)', 'Éphémère (apprends quand tu en as besoin)'], [
          ['mathématiques : algèbre linéaire, probabilités, optimisation', 'la version exacte d\'un logiciel'],
          ['physique et modélisation', 'la syntaxe d\'une bibliothèque précise'],
          ['automatique et estimation', 'le modèle d\'IA à la mode cette année'],
          ['programmation, algorithmique, conception logicielle', 'un framework particulier'],
          ['méthode expérimentale, mesure, esprit critique', 'une carte électronique précise'],
          ['communication, travail d\'équipe, anglais technique', 'les raccourcis d\'un outil'],
          ['éthique et sens des responsabilités', ''],
        ]),
        H('Le profil en T'),
        P('<p>La barre horizontale du T : une culture large sur toute la robotique (c\'est ce que te donne ce parcours). La barre verticale : une expertise profonde dans un ou deux domaines (commande, vision, IA, mécatronique, logiciel...). Les équipes recherchent ce profil : quelqu\'un qui comprend tout le système et qui excelle sur une partie.</p>'),
        Future('Avec des assistants d\'IA capables d\'écrire du code et de proposer des calculs, la valeur se déplace vers : formuler le bon problème, vérifier que la solution est juste et sûre, intégrer des systèmes physiques réels, et assumer les décisions. Utilise ces assistants comme des collègues rapides mais faillibles : vérifie toujours, et assure-toi de comprendre ce que tu livres.', 'Travailler avec l\'IA'),
        Manual('defi-plan', 'Ton plan sur un an', 'Dans ton carnet, écris : (1) le domaine qui t\'attire le plus pour ta barre verticale du T, (2) trois compétences durables que tu veux renforcer cette année, (3) un projet concret que tu veux avoir réalisé dans un an, (4) une compétition, une association ou un événement auquel tu participeras.', 60),
        Q('q1', 'Quelle compétence garde le plus sa valeur sur 20 ans ?', ['La maîtrise d\'une version précise d\'un logiciel', 'L\'algèbre linéaire et la modélisation', 'Les raccourcis clavier d\'un éditeur', 'Un framework web'], 1, 'Les fondamentaux mathématiques et physiques ne se périment pas.'),
      ],
      cards: [['Qu\'est-ce qu\'un profil en T ?', 'Une culture large (barre horizontale) et une expertise profonde dans un domaine (barre verticale).'], ['Compétences durables de l\'ingénieur ?', 'Maths, physique, automatique, programmation, méthode expérimentale, communication, éthique.']],
    },
    {
      id: 'veille', title: 'Faire sa veille et anticiper', sub: 'Une méthode pour ne jamais être dépassé', min: 18, level: 1,
      why: 'Ce parcours sera un jour dépassé. Ta capacité à suivre et à anticiper les évolutions, elle, ne le sera pas. C\'est la compétence qui te rend autonome pour toute ta carrière.',
      objectives: ['Mettre en place une veille technologique efficace', 'Lire un article scientifique', 'Distinguer effet d\'annonce et vraie avancée', 'Anticiper un problème avant qu\'il ne se pose'],
      blocks: [
        H('Les sources'),
        Table(['Source', 'Pour quoi', 'Exemples'], [
          ['Articles scientifiques', 'les avancées réelles, avec preuves', 'arXiv (catégorie cs.RO), conférences ICRA, IROS, RSS, CoRL'],
          ['Revues', 'travaux validés par les pairs', 'IEEE Transactions on Robotics, Science Robotics, IJRR'],
          ['Code et données', 'reproduire, tester', 'GitHub, pages de projets des laboratoires'],
          ['Industrie', 'ce qui se déploie vraiment', 'salons professionnels, rapports de l\'IFR sur le parc de robots'],
          ['Communauté', 'retours d\'expérience', 'ROS Discourse, forums, associations'],
          ['Vulgarisation de qualité', 'vue d\'ensemble', 'chaînes vidéo de laboratoires, podcasts spécialisés'],
        ]),
        H('Lire un article en 15 minutes'),
        P('<ol><li>Titre et résumé : quel problème, quelle idée, quel résultat ?</li><li>Figures et légendes : souvent tout l\'article en images.</li><li>Conclusion et limites : ce que les auteurs reconnaissent ne pas avoir résolu.</li><li>Expériences : sur un vrai robot ou seulement en simulation ? Combien d\'essais ? Comparé à quoi ?</li><li>Seulement si c\'est utile : la méthode en détail.</li></ol>'),
        Warn('Une vidéo impressionnante n\'est pas une preuve. Pose toujours ces questions : le robot est-il autonome ou téléopéré ? Combien d\'essais ratés avant celui-ci ? La vidéo est-elle accélérée ? L\'environnement a-t-il été préparé ? Les résultats sont-ils reproduits par d\'autres équipes ?', 'Garder son esprit critique'),
        H('Anticiper'),
        P('<p>Anticiper, c\'est se demander systématiquement : <em>qu\'est-ce qui pourrait mal tourner, et que ferai-je alors ?</em> Pour un projet : liste des risques, plan B pour chaque risque majeur. Pour ta carrière : quelles compétences seront demandées dans 5 ans, et comment les acquérir dès maintenant ? Pour la société : quels usages, quels abus, quelles règles ?</p>'),
        Manual('defi-veille', 'Ta première revue de presse', 'Trouve un article récent sur arXiv (catégorie cs.RO) ou dans une conférence de robotique. Lis-le avec la méthode en 5 étapes, puis écris dans ton carnet un résumé de 5 lignes : problème, idée, résultat, limite, et ce que tu en retiens pour toi.', 70),
        Think('t1', 'Selon toi, quel problème posé par la robotique n\'a pas encore de solution satisfaisante, et que personne autour de toi ne semble anticiper ? Propose une première piste de solution.', 'C\'est l\'exercice le plus important de l\'application. Exemples de directions : réparabilité des robots domestiques, recyclage des batteries de flottes de robots, formation des travailleurs qui cohabitent avec des robots, robustesse des robots face aux cyberattaques, robots dans les pays à faibles ressources. Note ton idée dans le carnet et reviens-y dans six mois.'),
      ],
      cards: [['Principales conférences de robotique ?', 'ICRA, IROS, RSS, CoRL.'], ['Catégorie arXiv de la robotique ?', 'cs.RO.'], ['Questions face à une vidéo de robot impressionnante ?', 'Autonome ou téléopéré ? Accélérée ? Combien d\'échecs ? Reproduite ailleurs ?']],
    },
  ],
};
