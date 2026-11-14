import { P, H, Tip, Warn, Danger, Future, Real, Info, F, Sim, Pipe, Q, Exo, Code, Defi, Manual, Think, Table, Calc, Dossier, Brief, Twist } from './b.js';

// ============================================================================
// Phase 6 : Objectif Mars, une campagne qui mélange tous les domaines
// ============================================================================

export const mars = {
  id: 'mars', phase: 'mars', icon: '🔴', title: 'Campagne Objectif Mars',
  desc: 'Treize missions pour préparer une base martienne : fusée, trajectoire, atterrissage, énergie, rovers, drones, essaims, construction.',
  master: 'Projet intégrateur',
  intro: `Le pari est simple, et un peu fou : tu fais partie de l'équipe qui prépare l'installation d'une première base sur Mars. Avant que le moindre humain pose le pied là-bas, ce sont des robots qui partiront, atterriront, exploreront, produiront de l'énergie et construiront. Chaque mission te fait utiliser plusieurs domaines à la fois, comme dans un vrai projet. Prends ton temps : ce qui compte ici, ce n'est pas d'aller vite, c'est de raisonner comme un ingénieur.`,
  lessons: [
    {
      id: 'mars-pourquoi', title: 'Mission 1 · Pourquoi Mars, et pourquoi des robots d\'abord', sub: 'Connaître le terrain avant de concevoir', min: 30, level: 2,
      why: `Un ingénieur commence toujours par l'environnement et les besoins, jamais par la solution. Sur Mars, chaque chiffre de l'environnement (gravité, froid, poussière, délai radio) va devenir une contrainte de conception dans les missions suivantes.`,
      objectives: ['Connaître les grandeurs physiques de Mars qui comptent pour un robot', 'Retracer l\'histoire des robots martiens', 'Comprendre pourquoi les robots précèdent les humains', 'Rédiger un premier cahier des charges'],
      blocks: [
        Brief('Mission 1 · Briefing', `<p>Le comité de direction veut une réponse claire avant d'engager le moindre budget : <strong>qu'est-ce qui rend Mars si difficile pour une machine, et dans quel ordre faut-il envoyer les robots ?</strong> Ton rôle : rassembler les faits et en tirer les premières exigences.</p>`, ['Physique', 'Systèmes', 'Gestion de projet']),
        Table(['Grandeur', 'Mars', 'Terre', 'Conséquence pour un robot'], [
          ['Gravité', '3,71 m/s²', '9,81 m/s²', 'moteurs moins sollicités à l\'arrêt, mais adhérence et équilibre plus délicats'],
          ['Durée du jour (sol)', '24 h 39 min', '24 h', 'un cycle jour-nuit presque terrestre : pratique pour l\'énergie solaire'],
          ['Durée de l\'année', '687 jours terrestres', '365 jours', 'saisons deux fois plus longues'],
          ['Pression au sol', 'environ 0,6 kPa (moins de 1 % de la Terre)', '101 kPa', 'les hélices et les ailes portent très mal, le refroidissement par l\'air est faible'],
          ['Atmosphère', 'environ 95 % de CO₂', 'azote et oxygène', 'pas d\'oxygène à respirer, mais du CO₂ à transformer'],
          ['Température moyenne', 'environ −60 °C, de −125 °C à +20 °C', '+15 °C', 'il faut chauffer l\'électronique et les batteries la nuit'],
          ['Distance Terre-Mars', 'de 55 à 400 millions de km', '–', 'délai radio de 3 à 22 minutes dans chaque sens'],
          ['Rayonnement', 'pas de champ magnétique global, atmosphère mince', 'protégée', 'composants électroniques durcis, protection des humains'],
          ['Poussière', 'fine, électrostatique, tempêtes globales', '–', 'panneaux qui s\'encrassent, joints et mécanismes qui s\'usent'],
        ]),
        H('Un demi-siècle de robots martiens'),
        Table(['Année', 'Mission', 'Ce qu\'elle a apporté'], [
          ['1976', 'Viking 1 et 2 (États-Unis)', 'premiers atterrissages réussis et durables, premières analyses du sol'],
          ['1997', 'Sojourner (Mars Pathfinder)', 'premier rover sur Mars : quelques mètres par jour, piloté pas à pas'],
          ['2004', 'Spirit et Opportunity', 'rovers solaires prévus pour 90 sols ; Opportunity a roulé plus de 45 km jusqu\'en 2018'],
          ['2012', 'Curiosity', 'rover de 900 kg à générateur nucléaire, posé par une « grue volante »'],
          ['2021', 'Perseverance et Ingenuity', 'navigation autonome avancée, prélèvement d\'échantillons, premier vol motorisé sur une autre planète'],
          ['2021', 'Zhurong (Chine)', 'premier rover chinois sur Mars, posé dans Utopia Planitia'],
        ]),
        Real(`Opportunity devait vivre trois mois. Il a fonctionné près de quinze ans, parce que le vent nettoyait parfois ses panneaux et que l'équipe a appris à gérer son énergie au plus juste. Une marge bien pensée vaut souvent plus qu'une performance maximale.`),
        Q('q1', 'Pourquoi envoie-t-on des robots avant des humains ?', ['Parce qu\'ils sont plus intelligents', 'Pour réduire les risques : reconnaissance du terrain, production d\'énergie et de ressources, construction, sans mettre de vies en jeu', 'Parce que les humains ne peuvent pas aller sur Mars', 'Par habitude'], 1, 'Chaque tâche faite d\'avance par un robot, c\'est un risque et une masse en moins pour l\'équipage.'),
        Q('q2', 'La pression au sol de Mars est inférieure à 1 % de celle de la Terre. Quel système de robot en souffre le plus ?', ['Les roues', 'Les hélices et les ailes, car elles s\'appuient sur l\'air', 'Les caméras', 'Les batteries'], 1, 'Moins d\'air, c\'est moins de poussée et de portance à vitesse égale : voir la mission 9.'),
        Dossier('dos-mars-1', 'Mon premier cahier des charges martien', `Pas de bonne réponse unique ici : on attend un raisonnement. Tes réponses sont gardées dans ton carnet, tu pourras les améliorer au fil de la campagne.`, [
          'Classe ces cinq tâches dans l\'ordre où tu enverrais des robots pour les faire, et justifie : cartographier le site, produire de l\'énergie, produire de l\'oxygène, construire un abri, trouver de la glace d\'eau.',
          'Choisis trois grandeurs du tableau et transforme chacune en exigence chiffrée pour un rover (exemple : « l\'électronique doit survivre à −90 °C »).',
          'Quel est, selon toi, le risque numéro un de toute la campagne ? Comment le réduirais-tu ?',
        ], ['J\'ai justifié chaque choix par un fait, pas par une impression', 'Mes exigences sont chiffrées et vérifiables', 'J\'ai identifié au moins un risque et une parade concrète']),
      ],
      cards: [['Gravité de Mars ?', '3,71 m/s², environ 38 % de celle de la Terre.'], ['Durée d\'un sol ?', '24 h 39 min.'], ['Délai radio Terre-Mars ?', 'De 3 à 22 minutes dans chaque sens selon les positions.'], ['Gaz principal de l\'atmosphère martienne ?', 'Le CO₂ (environ 95 %).']],
    },
    {
      id: 'mars-lanceur', title: 'Mission 2 · Quitter la Terre', sub: 'L\'équation de la fusée et le dimensionnement des étages', min: 40, level: 3,
      why: `Tout ce qui part vers Mars doit d'abord quitter la Terre. L'équation de la fusée explique pourquoi chaque kilogramme compte, pourquoi on fait des étages et pourquoi le choix du carburant pèse jusque sur le voyage retour.`,
      objectives: ['Utiliser l\'équation de Tsiolkovski', 'Comprendre l\'intérêt des étages', 'Comparer les ergols', 'Faire un compromis de conception chiffré'],
      blocks: [
        Brief('Mission 2 · Briefing', `<p>Il faut placer en orbite basse au moins <strong>100 tonnes</strong> d'équipements par lancement : robots, panneaux, réservoirs. Ta fusée à deux étages ne doit pas dépasser <strong>5 000 tonnes</strong> au décollage. Et un détail que le comité a glissé en fin de réunion : le carburant choisi devra pouvoir être fabriqué sur Mars, pour le retour.</p>`, ['Physique', 'Chimie', 'Optimisation']),
        P(`<p>Une fusée avance en éjectant de la matière vers l'arrière, très vite. Plus elle éjecte vite, et plus la part de carburant dans sa masse est grande, plus elle gagne de vitesse. Konstantin Tsiolkovski l'a écrit en 1903 :</p>`),
        F('Δv = I<sub>sp</sub> · g<sub>0</sub> · ln(m<sub>0</sub> / m<sub>f</sub>)', 'I<sub>sp</sub> : impulsion spécifique (s), g<sub>0</sub> = 9,81 m/s², m<sub>0</sub> : masse pleine, m<sub>f</sub> : masse vide'),
        Tip(`Le logarithme est cruel : pour doubler le Δv, il ne suffit pas de doubler le carburant, il faut <em>élever au carré</em> le rapport des masses. C'est pour cela qu'on largue les réservoirs vides en route : c'est le principe des étages.`, 'Lire la formule'),
        Table(['Ergols', 'I<sub>sp</sub> typique (vide)', 'Avantages', 'Inconvénients'], [
          ['Kérosène + oxygène', 'environ 340–350 s', 'dense, facile à stocker', 'impossible à fabriquer simplement sur Mars, encrasse les moteurs'],
          ['Méthane + oxygène', 'environ 360–380 s', 'bon compromis, moteur propre, fabricable sur Mars à partir de CO₂ et d\'eau', 'cryogénique (−162 °C)'],
          ['Hydrogène + oxygène', 'environ 450 s', 'le plus efficace', 'très peu dense : réservoirs énormes et lourds ; fuit et s\'évapore, difficile à garder des mois'],
        ]),
        Exo('e1', 'Un étage a une impulsion spécifique de 350 s. Il pèse 400 t plein et 100 t vide. Quel Δv peut-il donner (g<sub>0</sub> = 9,81) ?', { answer: 4760, unit: 'm/s', tol: 10, sol: 'Δv = 350 × 9,81 × ln(4) = 3 433,5 × 1,386 = <b>4 760 m/s</b>. Il en faut environ 9 400 pour atteindre l\'orbite basse en comptant les pertes : un seul étage de ce type ne suffit pas.' }),
        Code('c1', 'Écris <code>tsiolkovski(isp, m0, mf)</code> qui renvoie le Δv en m/s, avec g<sub>0</sub> = 9,81.', {
          fn: 'tsiolkovski',
          starter: 'function tsiolkovski(isp, m0, mf) {\n  const g0 = 9.81;\n  return 0;\n}',
          tests: [[[350, 400, 100], 4760.47], [[450, 1000, 1000], 0], [[380, 1300, 250], 6146.04]],
          sol: 'function tsiolkovski(isp, m0, mf) {\n  return isp * 9.81 * Math.log(m0 / mf);\n}',
        }),
        Calc('calc-fusee', 'Dimensionne ta fusée à deux étages', `Hypothèses : la masse de structure de chaque étage (réservoirs, moteurs) vaut une fraction de son carburant, qui dépend des ergols. Il faut 9,4 km/s pour l'orbite basse, pertes comprises.`, [
          { k: 'erg', label: 'Ergols', options: [['kero', 'Kérosène + oxygène'], ['metha', 'Méthane + oxygène'], ['hydro', 'Hydrogène + oxygène']], value: 'kero' },
          { k: 'p1', label: 'Carburant du premier étage', min: 200, max: 4000, step: 50, value: 1500, unit: 't' },
          { k: 'p2', label: 'Carburant du second étage', min: 50, max: 1500, step: 25, value: 300, unit: 't' },
          { k: 'pay', label: 'Charge utile', min: 10, max: 150, step: 5, value: 50, unit: 't' },
        ], ({ erg, p1, p2, pay }) => {
          const E = { kero: [300, 345, 0.06], metha: [327, 375, 0.07], hydro: [380, 450, 0.12] }[erg];
          const s1 = p1 * E[2], s2 = p2 * E[2];
          const m2 = s2 + p2 + pay, m0 = s1 + p1 + m2;
          const dv2 = E[1] * 9.81 * Math.log(m2 / (s2 + pay));
          const dv1 = E[0] * 9.81 * Math.log(m0 / (s1 + m2));
          const dv = (dv1 + dv2) / 1000;
          return {
            outputs: [['Masse au décollage', m0, 't'], ['Δv du premier étage', dv1 / 1000, 'km/s'], ['Δv du second étage', dv2 / 1000, 'km/s'], ['Δv total', dv, 'km/s'], ['Part de charge utile', pay / m0 * 100, '%']],
            checks: [['Δv total ≥ 9,4 km/s', dv >= 9.4], ['Charge utile ≥ 100 t', pay >= 100], ['Masse au décollage ≤ 5 000 t', m0 <= 5000], ['Ergols fabricables et stockables sur Mars', erg === 'metha']],
          };
        }, { okText: 'Ta fusée tient le cahier des charges. Remarque la part de charge utile : quelques pour cent seulement. C\'est le prix de la sortie du puits de gravité terrestre.' }),
        Twist('Imprévu : le réservoir s\'alourdit', `<p>L'équipe structure annonce que les réservoirs du second étage pèseront 20 % de plus que prévu. Avant de toucher aux curseurs, prédis : faut-il plutôt ajouter du carburant au premier ou au second étage pour compenser ? Puis vérifie. Pourquoi chaque kilogramme du second étage « coûte »-t-il plus cher qu'un kilogramme du premier ?</p>`),
        Future(`Réutiliser les étages change l'économie de l'espace : un premier étage qui revient se poser peut voler de nombreuses fois. Les projets de grands vaisseaux réutilisables visent même le ravitaillement en orbite : plusieurs lancements remplissent les réservoirs d'un vaisseau avant son départ vers Mars.`),
        Q('q1', 'Pourquoi le méthane est-il intéressant pour une mission vers Mars ?', ['Il est le plus efficace', 'Il peut être fabriqué sur place à partir du CO₂ de l\'atmosphère et de l\'eau du sous-sol', 'Il ne gèle jamais', 'Il est plus léger que l\'hydrogène'], 1, 'Fabriquer le carburant du retour sur Mars évite de l\'emporter depuis la Terre : c\'est la mission 12.'),
      ],
      cards: [['Équation de Tsiolkovski ?', 'Δv = Isp·g0·ln(m0/mf).'], ['Pourquoi des étages ?', 'Larguer les masses vides améliore le rapport m0/mf des étages suivants.'], ['Δv pour l\'orbite basse terrestre, pertes comprises ?', 'Environ 9,4 km/s.']],
    },
    {
      id: 'mars-trajet', title: 'Mission 3 · La route vers Mars', sub: 'Orbite de transfert, fenêtre de tir et mécanique céleste', min: 35, level: 3,
      why: `On ne vise pas Mars, on vise l'endroit où Mars sera dans huit mois. Comprendre les fenêtres de tir explique le calendrier de toutes les missions martiennes, et c'est un bel exemple de planification sous contraintes physiques.`,
      objectives: ['Comprendre l\'orbite de transfert de Hohmann', 'Calculer les Δv et la durée du transfert', 'Comprendre la période synodique', 'Trouver une fenêtre de tir en simulation'],
      blocks: [
        Brief('Mission 3 · Briefing', `<p>Ta fusée est prête. Il reste une question qui semble simple : <strong>quel jour partir ?</strong> Partir au mauvais moment, c'est arriver dans le vide, ou dépenser un carburant que tu n'as pas.</p>`, ['Mécanique', 'Maths', 'Planification']),
        P(`<p>La trajectoire la plus économique entre deux orbites circulaires est l'<strong>orbite de Hohmann</strong> : une demi-ellipse qui touche l'orbite de la Terre au départ et celle de Mars à l'arrivée. Deux poussées suffisent : une pour quitter l'orbite terrestre autour du Soleil, une pour s'aligner sur celle de Mars.</p>`),
        F('a = (r<sub>1</sub> + r<sub>2</sub>) / 2 &nbsp;&nbsp;&nbsp; T<sub>transfert</sub> = π · √(a³ / μ)', 'μ = 1,327 × 10²⁰ m³/s² pour le Soleil'),
        F('Δv<sub>1</sub> = √(μ/r<sub>1</sub>) · (√(2r<sub>2</sub>/(r<sub>1</sub>+r<sub>2</sub>)) − 1) &nbsp;&nbsp;&nbsp; Δv<sub>2</sub> = √(μ/r<sub>2</sub>) · (1 − √(2r<sub>1</sub>/(r<sub>1</sub>+r<sub>2</sub>)))', 'les deux poussées, en supposant des orbites circulaires'),
        Code('c1', 'Écris <code>hohmann(mu, r1, r2)</code> qui renvoie <code>[dv1, dv2, jours]</code> : les deux Δv en m/s et la durée du transfert en jours (1 jour = 86 400 s).', {
          fn: 'hohmann',
          starter: 'function hohmann(mu, r1, r2) {\n  const a = (r1 + r2) / 2;\n  // dv1, dv2 avec les formules de la leçon, T = PI * sqrt(a^3 / mu)\n  return [0, 0, 0];\n}',
          tests: [[[1.327e20, 1.496e11, 2.279e11], [2943.32, 2647.79, 258.84]], [[3.986e14, 6.678e6, 4.2164e7], [2425.77, 1466.84, 0.21979]], [[1.327e20, 1.496e11, 7.785e11], [8792.86, 5642.96, 997.81]]],
          sol: 'function hohmann(mu, r1, r2) {\n  const a = (r1 + r2) / 2;\n  const dv1 = Math.sqrt(mu / r1) * (Math.sqrt(2 * r2 / (r1 + r2)) - 1);\n  const dv2 = Math.sqrt(mu / r2) * (1 - Math.sqrt(2 * r1 / (r1 + r2)));\n  return [dv1, dv2, Math.PI * Math.sqrt(a ** 3 / mu) / 86400];\n}',
        }),
        P(`<p>Pendant les 259 jours du voyage, Mars avance sur son orbite. Il faut donc partir quand Mars a environ 44° d'avance sur la Terre. Cette configuration revient tous les… c'est la <strong>période synodique</strong> :</p>`),
        F('1 / S = 1 / T<sub>Terre</sub> − 1 / T<sub>Mars</sub>', 'T<sub>Terre</sub> = 365,25 jours, T<sub>Mars</sub> = 687 jours'),
        Exo('e1', 'Calcule la période synodique Terre-Mars, en jours.', { answer: 780, unit: 'jours', tol: 2, sol: '1/S = 1/365,25 − 1/687 = 0,002738 − 0,001456 = 0,001282 → S ≈ <b>780 jours</b>, soit environ 26 mois. C\'est pourquoi les missions martiennes partent par vagues, tous les deux ans et deux mois.' }),
        Sim('hohmann'),
        Defi('defi-hohmann', 'Fenêtre de tir', `Trouve un jour de départ qui amène la sonde à moins de 2° de Mars. Puis cherche la fenêtre suivante et compare l'écart avec la période synodique calculée plus haut.`, 'hohmann', { goal: true }),
        Info(`Les orbites réelles sont légèrement elliptiques et inclinées : les ingénieurs tracent des cartes appelées « porkchop plots », qui donnent l'énergie nécessaire pour chaque couple date de départ et date d'arrivée. Le principe reste celui que tu viens de manipuler.`, 'Dans la réalité'),
        Twist('Imprévu : le lancement glisse de trois semaines', `<p>Un problème de vanne retarde le lancement de 21 jours. La sonde peut-elle encore partir ? Utilise le simulateur pour voir l'erreur d'arrivée, puis réfléchis : que faudrait-il changer à la trajectoire (et donc au Δv) pour rattraper ? Pourquoi les fenêtres réelles durent-elles quelques semaines et pas un seul jour ?</p>`),
        Q('q1', 'Pourquoi ne peut-on pas partir vers Mars n\'importe quand avec une orbite de Hohmann ?', ['Parce que la fusée doit refroidir', 'Parce que Mars doit se trouver au bon endroit à l\'arrivée : il faut un angle de départ précis entre les deux planètes', 'Parce que le Soleil gêne', 'On peut partir n\'importe quand'], 1, 'L\'orbite de transfert a une durée fixe : la position relative des planètes au départ doit être la bonne.'),
      ],
      cards: [['Orbite de Hohmann ?', 'Demi-ellipse tangente aux deux orbites, la plus économique en Δv entre orbites circulaires.'], ['Durée d\'un transfert de Hohmann Terre-Mars ?', 'Environ 259 jours (8,5 mois).'], ['Période synodique Terre-Mars ?', 'Environ 780 jours (26 mois).']],
    },
    {
      id: 'mars-edl', title: 'Mission 4 · Sept minutes de terreur', sub: 'Entrée, descente et atterrissage', min: 35, level: 3,
      why: `L'atterrissage concentre tout : aérodynamique, propulsion, capteurs, fusion de données, logiciel temps réel, autonomie totale. Plusieurs sondes se sont écrasées pour une seule erreur. C'est l'école de la rigueur.`,
      objectives: ['Décrire les phases d\'un atterrissage martien', 'Piloter une descente propulsée économe', 'Comprendre le rôle de la fusion de capteurs', 'Analyser une défaillance réelle'],
      blocks: [
        Brief('Mission 4 · Briefing', `<p>Ta sonde arrive à environ <strong>20 000 km/h</strong>. Sept minutes plus tard, elle doit être immobile au sol. Avec 3 à 22 minutes de délai radio, personne sur Terre ne peut intervenir : quand le premier signal d'entrée atteint la Terre, la sonde est déjà posée… ou détruite.</p>`, ['Mécanique', 'Commande', 'Capteurs', 'Logiciel']),
        Pipe('Les phases d\'un atterrissage de rover lourd', [
          ['Entrée atmosphérique', 'Le bouclier thermique encaisse le freinage par l\'atmosphère, le plus gros de la vitesse disparaît.', 'de 20 000 km/h à environ 1 500 km/h', 'La capsule peut se piloter un peu en déplaçant son centre de masse pour corriger sa trajectoire.'],
          ['Parachute', 'Ouvert à vitesse supersonique, il réduit encore la vitesse.', 'jusqu\'à environ 300 km/h', 'L\'air est si mince que le parachute ne suffit jamais à se poser.'],
          ['Navigation par le terrain', 'Une caméra compare le sol à une carte embarquée pour connaître la position exacte.', 'erreur réduite à quelques dizaines de mètres', 'Perseverance l\'a utilisée en 2021 pour éviter les zones dangereuses de son cratère.'],
          ['Descente propulsée', 'Des moteurs-fusées freinent jusqu\'à la vitesse de pose.', 'quelques m/s', 'C\'est le moment que tu vas piloter dans le simulateur.'],
          ['Pose', 'Sur pieds, coussins gonflables ou suspendu à une « grue volante ».', 'moins de 1 m/s pour les plus délicats', 'La grue volante dépose le rover au bout de câbles puis s\'éloigne pour s\'écraser plus loin.'],
        ]),
        Sim('lander'),
        Defi('defi-lander', 'Poser sans casser', `Pose l'atterrisseur à moins de 2 m/s en gardant au moins 60 % du carburant. Essaie d'abord de freiner doucement dès le début, puis de freiner tard et fort : compare le carburant restant.`, 'lander', { goal: true }),
        P(`<p>Pourquoi freiner tard est-il plus économe ? Chaque seconde passée à flotter coûte une poussée juste pour compenser la gravité : c'est la <strong>perte par gravité</strong>. Une descente lente et prudente gaspille du carburant à ne rien faire d'autre que lutter contre g.</p>`),
        Exo('e1', 'Un atterrisseur reste 10 s en vol stationnaire juste au-dessus du sol martien. Quelle vitesse (Δv) a-t-il « dépensée » uniquement pour compenser la gravité (g = 3,71) ?', { answer: 37.1, unit: 'm/s', tol: 0.1, sol: 'Δv = g × t = 3,71 × 10 = <b>37,1 m/s</b>. Sur une sonde où chaque m/s coûte du carburant, hésiter coûte cher.' }),
        Twist('Imprévu : l\'altimètre ment', `<p>En 2016, l'atterrisseur européen Schiaparelli a vu sa centrale inertielle saturer pendant environ une seconde après l'ouverture du parachute. Le logiciel a intégré cette valeur aberrante et a conclu que la sonde était… sous le sol. Il a largué le parachute et coupé les moteurs bien trop tôt. La sonde s'est écrasée.</p><p>Toi, comment aurais-tu protégé le logiciel ? Pense à ce que tu sais du filtrage, de la fusion de capteurs et des tests de vraisemblance.</p>`),
        Think('t1', `Propose trois protections logicielles qui auraient pu éviter la perte de Schiaparelli. Pour chacune, dis quel coût ou quel risque elle ajoute.`, `1) Vérifier la vraisemblance : une altitude négative ou une variation physiquement impossible doit être rejetée, pas utilisée. Risque : rejeter à tort une vraie mesure surprenante. 2) Fusionner plusieurs sources (radar altimétrique, centrale inertielle) avec un filtre qui pondère chaque capteur selon sa fiabilité, et signaler une saturation. Coût : complexité et tests. 3) Exiger une confirmation pendant un certain temps avant une action irréversible comme larguer le parachute. Risque : réagir trop tard si la situation est réellement urgente. Le vrai rapport d'enquête insiste aussi sur les tests en simulation de scénarios extrêmes.`),
        Q('q1', 'Pourquoi un atterrissage martien doit-il être entièrement autonome ?', ['Pour économiser de l\'argent', 'Parce que le délai radio dépasse la durée de l\'atterrissage : personne ne peut réagir à temps depuis la Terre', 'Parce que les antennes sont rangées', 'Par tradition'], 1, 'Sept minutes d\'atterrissage, 3 à 22 minutes de délai : la Terre ne voit que le passé.'),
      ],
      cards: [['Pourquoi « sept minutes de terreur » ?', 'Durée de l\'atterrissage, plus courte que le délai radio : tout doit être autonome.'], ['Perte par gravité ?', 'Δv dépensé à compenser g pendant la descente : g × durée.'], ['Cause de la perte de Schiaparelli (2016) ?', 'Une saturation de la centrale inertielle mal gérée a fait croire au logiciel que la sonde était sous le sol.']],
    },
    {
      id: 'mars-energie', title: 'Mission 5 · Survivre à la nuit et aux tempêtes', sub: 'Budget énergétique d\'un rover', min: 30, level: 2,
      why: `Un rover sans énergie gèle en quelques nuits. Le budget énergétique relie électricité, thermique, météo et planification des activités : c'est un problème système par excellence.`,
      objectives: ['Établir un bilan production / consommation sur un cycle jour-nuit', 'Comprendre l\'effet d\'une tempête de poussière', 'Comparer solaire et générateur nucléaire', 'Dimensionner sous contrainte de masse'],
      blocks: [
        Brief('Mission 5 · Briefing', `<p>Ton rover d'exploration est posé. La météo martienne annonce une tempête de poussière régionale dans huit sols. Elle peut durer des semaines. <strong>Ton rover doit survivre, et continuer à travailler autant que possible.</strong></p>`, ['Électricité', 'Thermique', 'Systèmes']),
        P(`<p>La nuit, rien ne recharge les batteries, et il faut chauffer l'électronique pour qu'elle ne descende pas sous sa température minimale. Pendant une tempête, la poussière en suspension peut bloquer la plus grande partie de la lumière du soleil pendant des semaines.</p>`),
        F('E<sub>stockée</sub>(t + Δt) = E<sub>stockée</sub>(t) + (P<sub>produite</sub> − P<sub>consommée</sub>) · Δt', 'le bilan, heure par heure, plafonné à la capacité de la batterie'),
        Sim('marsenergy'),
        Defi('defi-energie', 'Traverser la tempête', `En panneaux solaires, avec la tempête, survis aux 30 sols et réalise au moins 50 heures de conduite, avec un système d'énergie de 20 kg au plus. Quelle variable a le plus d'effet ? Laquelle as-tu sous-estimée au départ ?`, 'marsenergy', { goal: true }),
        Real(`En juin 2018, une tempête de poussière a enveloppé presque toute la planète. Opportunity, alimenté par des panneaux solaires, s'est mis en sommeil et n'a plus jamais répondu. Curiosity, alimenté par un générateur à radio-isotope, a continué à travailler à quelques milliers de kilomètres de là.`),
        Table(['Critère', 'Panneaux solaires', 'Générateur à radio-isotope (RTG)'], [
          ['Puissance', 'variable : jour, saison, poussière', 'constante, environ 100 W pour celui de Curiosity et Perseverance'],
          ['Chaleur', 'aucune : il faut des radiateurs électriques', 'beaucoup de chaleur perdue, qui chauffe le rover gratuitement'],
          ['Masse et coût', 'légers, bon marché', 'lourds, très coûteux, plutonium rare'],
          ['Contraintes', 'poussière, latitude, saisons', 'sûreté nucléaire au lancement, autorisation'],
        ]),
        Think('t1', `Ton modèle dit que le rover survit de justesse, avec 0 % de batterie pendant quelques heures. Le présentes-tu comme une réussite au comité ? Que proposes-tu ?`, `Non. « De justesse » dans un modèle simplifié veut dire « probablement pas » dans la réalité : vieillissement des batteries, poussière plus épaisse que prévu, panne d'un chauffage. Un ingénieur présente aussi la marge : par exemple garder au moins 30 % de batterie au pire moment, ou prévoir un mode de survie plus sobre. On peut aussi tester la sensibilité : que se passe-t-il si la tempête dure 5 sols de plus ?`),
        Q('q1', 'Pourquoi un rover à générateur nucléaire n\'a-t-il presque pas besoin de chauffage électrique ?', ['Parce qu\'il est mieux isolé', 'Parce que le générateur produit beaucoup de chaleur perdue, qu\'on fait circuler dans le rover', 'Parce qu\'il roule moins', 'Parce que le plutonium est chaud au toucher seulement'], 1, 'Un RTG convertit seulement quelques pour cent de sa chaleur en électricité : le reste chauffe le rover.'),
      ],
      cards: [['Pourquoi un rover doit-il chauffer la nuit ?', 'Pour garder électronique et batteries au-dessus de leur température minimale.'], ['Avantage majeur d\'un RTG sur Mars ?', 'Puissance constante et chaleur gratuite, indépendante de la poussière et des saisons.'], ['Qu\'est-il arrivé à Opportunity en 2018 ?', 'Une tempête globale a coupé son énergie solaire ; il n\'a plus répondu.']],
    },
    {
      id: 'mars-rover', title: 'Mission 6 · Concevoir le rover', sub: 'Roues, suspension, masse et terrain', min: 35, level: 3,
      why: `Le rover est un compromis permanent entre franchissement, masse, consommation et place dans la capsule. Le dimensionner, c'est faire dialoguer mécanique, mécanique des sols et systèmes.`,
      objectives: ['Comprendre la suspension à balanciers (rocker-bogie)', 'Calculer une pression au sol', 'Mener un compromis de dimensionnement', 'Relier choix mécaniques et risques de mission'],
      blocks: [
        Brief('Mission 6 · Briefing', `<p>Le site d'atterrissage est un ancien delta, avec du sable meuble et des blocs rocheux. Le comité veut un rover de <strong>1 100 kg au plus</strong>, capable de franchir des blocs de <strong>50 cm</strong>, qui ne s'enlise pas, et qui garde au moins <strong>300 kg</strong> pour les instruments.</p>`, ['Mécanique', 'Matériaux', 'Systèmes']),
        P(`<p>Les rovers martiens américains utilisent une suspension <strong>rocker-bogie</strong> : de chaque côté, un grand balancier porte une roue et un petit balancier qui porte deux roues. Les deux côtés sont reliés par un différentiel. Sans aucun ressort, les six roues restent au sol même sur des rochers, et le rover peut franchir des obstacles de l'ordre du diamètre de ses roues.</p>`),
        F('p = m · g<sub>Mars</sub> / (n · b · ℓ<sub>c</sub>)', 'pression au sol : n roues de largeur b, longueur de contact ℓ<sub>c</sub> ≈ 0,25 × diamètre (hypothèse pour un sol meuble)'),
        Warn(`Spirit s'est enlisé en 2009 dans un sable très meuble, sous une croûte qui semblait solide. Malgré des mois de manœuvres depuis la Terre, il n'en est jamais ressorti et a terminé sa mission comme station fixe. La pression au sol n'est pas un détail.`, 'Le souvenir de Spirit'),
        Calc('calc-rover', 'Dimensionne la mobilité du rover', `Hypothèses : l'obstacle franchissable vaut environ 1,25 × le diamètre des roues avec six roues en rocker-bogie, 0,6 × le diamètre avec quatre roues sans balancier. Masse de mobilité = n × (6 + 30·D·b) kg + 8 % de la masse totale (suspension). Structure, énergie et avionique : 45 % de la masse totale. Pour ne pas s'enliser sur ce sable, on vise une pression au sol de 10 kPa au plus.`, [
          { k: 'm', label: 'Masse totale du rover', min: 300, max: 1500, step: 25, value: 900, unit: 'kg' },
          { k: 'n', label: 'Nombre de roues', options: [[4, '4 roues, sans balancier'], [6, '6 roues, rocker-bogie'], [8, '8 roues, rocker-bogie double']], value: 6 },
          { k: 'D', label: 'Diamètre des roues', min: 0.2, max: 0.8, step: 0.01, value: 0.4, unit: 'm' },
          { k: 'b', label: 'Largeur des roues', min: 0.1, max: 0.5, step: 0.01, value: 0.3, unit: 'm' },
        ], ({ m, n, D, b }) => {
          const p = m * 3.71 / (n * b * 0.25 * D) / 1000;
          const obst = D * (n >= 6 ? 1.25 : 0.6);
          const mob = n * (6 + 30 * D * b) + 0.08 * m;
          const utile = m - mob - 0.45 * m;
          return {
            outputs: [['Poids sur Mars', m * 3.71, 'N'], ['Pression au sol', p, 'kPa'], ['Obstacle franchissable', obst, 'm'], ['Masse de la mobilité', mob, 'kg'], ['Masse disponible pour les instruments', utile, 'kg']],
            checks: [['Pression au sol ≤ 10 kPa', p <= 10], ['Franchit des blocs de 50 cm', obst >= 0.5], ['Au moins 300 kg d\'instruments', utile >= 300], ['Masse totale ≤ 1 100 kg', m <= 1100], ['Roues de 60 cm au plus (place dans la capsule)', D <= 0.6]],
          };
        }, { okText: 'Ton rover est viable. Compare tes dimensions avec celles de Curiosity et Perseverance, dont les roues mesurent environ 50 cm de diamètre.' }),
        Twist('Imprévu : les roues se déchirent', `<p>Après quelques kilomètres sur des roches pointues, des trous apparaissent dans les roues en aluminium (c'est arrivé à Curiosity dès 2013). L'équipe propose trois options : des roues plus épaisses (plus lourdes), un logiciel qui choisit des trajets moins agressifs, ou un contrôle de traction qui adapte la vitesse de chaque roue pour réduire les efforts sur les rochers. Laquelle choisis-tu pour un rover déjà sur Mars ? Et pour le suivant ?</p>`),
        Think('t1', `Pour le rover déjà posé, seule une solution logicielle est possible. Pour le suivant, tout est ouvert. Explique ce que cette différence t'apprend sur l'importance de la conception initiale et des mises à jour à distance.`, `Une fois le robot loin, le matériel est figé : seuls le logiciel et les procédures peuvent évoluer. Pour Curiosity, l'équipe a choisi des trajets plus doux puis a envoyé un algorithme de contrôle de traction qui a réduit les efforts sur les roues. Pour le rover suivant, on peut changer la géométrie des roues et leur épaisseur. Leçon : prévoir dès la conception la possibilité de mettre à jour le logiciel, et des capteurs qui permettent de diagnostiquer à distance (ici, des caméras qui photographient les roues).`),
        Q('q1', 'Quel est l\'intérêt principal de la suspension rocker-bogie ?', ['Aller plus vite', 'Garder les six roues au contact du sol sur terrain accidenté, sans ressort, et franchir des obstacles de la taille des roues', 'Économiser des moteurs', 'Faciliter le décollage'], 1, 'Les balanciers et le différentiel répartissent la charge et suivent le relief.'),
      ],
      cards: [['Principe de la suspension rocker-bogie ?', 'Deux balanciers par côté reliés par un différentiel : les six roues suivent le terrain sans ressort.'], ['Formule de la pression au sol ?', 'p = poids / surface de contact totale.'], ['Pourquoi Spirit s\'est-il arrêté de rouler ?', 'Il s\'est enlisé dans un sable très meuble en 2009.']],
    },
    {
      id: 'mars-delai', title: 'Mission 7 · Piloter à 20 minutes de distance', sub: 'Délai de communication et niveaux d\'autonomie', min: 30, level: 3,
      why: `Le délai de communication oblige à déléguer des décisions au robot. C'est la meilleure illustration de ce que signifie concrètement « l'autonomie », un sujet central de la robotique moderne, sur Mars comme dans une mine ou un océan.`,
      objectives: ['Calculer un délai de communication', 'Comprendre les niveaux d\'autonomie', 'Expérimenter la téléopération retardée', 'Concevoir une stratégie de commande adaptée'],
      blocks: [
        Brief('Mission 7 · Briefing', `<p>Le rover doit rejoindre un affleurement prometteur, au milieu d'un champ de rochers. Aujourd'hui, Mars est loin : <strong>15 minutes</strong> de délai dans chaque sens. Chaque ordre que tu envoies sera exécuté un quart d'heure plus tard, et tu verras le résultat un quart d'heure après.</p>`, ['Communication', 'Planification', 'IA']),
        F('délai = distance / c', 'c = 299 792 km/s, vitesse de la lumière et des ondes radio'),
        Code('c1', 'Écris <code>delaiMinutes(distanceKm)</code> qui renvoie le délai de communication aller simple en minutes.', {
          fn: 'delaiMinutes',
          starter: 'function delaiMinutes(distanceKm) {\n  const c = 299792.458; // km/s\n  return 0;\n}',
          tests: [[[54.6e6], 3.0354], [[401e6], 22.293], [[384400], 0.02137]],
          sol: 'function delaiMinutes(distanceKm) {\n  return distanceKm / 299792.458 / 60;\n}',
        }),
        Table(['Niveau', 'Ce que fait le robot', 'Ce que fait la Terre'], [
          ['0 · Commande directe', 'exécute chaque mouvement envoyé', 'tout : chaque pas, chaque virage'],
          ['1 · Points de passage', 'va seul vers un point en ligne droite, s\'arrête s\'il voit un danger', 'choisit les points à l\'avance'],
          ['2 · Navigation autonome', 'perçoit les obstacles et planifie son propre chemin', 'fixe l\'objectif et vérifie le résultat'],
          ['3 · Autonomie scientifique', 'choisit lui-même les cibles intéressantes à analyser', 'fixe les priorités de la mission'],
        ]),
        Sim('roverdelay'),
        Defi('defi-delai', 'Le pilote patient', `Avec 15 minutes de délai, atteins l'échantillon en moins de 240 minutes de mission, sans collision. Essaie d'abord en commande directe pour sentir le problème.`, 'roverdelay', { goal: true }),
        Real(`Perseverance dispose d'un système de navigation autonome qui calcule son chemin en roulant, alors que ses prédécesseurs devaient souvent s'arrêter pour réfléchir. Les équipes au sol préparent chaque matin martien un plan pour toute la journée, que le rover exécute seul.`),
        Think('t1', `Les mêmes problèmes existent sur Terre : robots dans une mine profonde sans liaison radio, sous-marins autonomes, robots d'intervention dans un bâtiment effondré. Choisis un de ces cas et décris le niveau d'autonomie nécessaire et ce que le robot doit faire s'il perd tout contact.`, `Exemple : un robot dans une galerie de mine perd la liaison radio après un virage. Il lui faut au moins le niveau 2 (percevoir et contourner les obstacles) et une règle claire en cas de perte de contact : revenir sur ses pas jusqu'au dernier point où la liaison existait, ou déposer un relais radio, ou continuer sa mission et revenir à heure fixe. On décide cette règle à la conception, pas pendant la panne.`),
        Q('q1', 'Pourquoi la commande directe est-elle presque inutilisable avec 15 minutes de délai ?', ['Parce que le rover est trop lent', 'Parce que chaque correction arrive 30 minutes après l\'observation : le robot avance dans le passé', 'Parce que les ondes s\'affaiblissent', 'Parce que les caméras sont floues'], 1, 'Boucle de commande = délai aller + délai retour : une boucle de 30 minutes ne peut corriger que des mouvements très lents.'),
      ],
      cards: [['Délai radio minimal et maximal Terre-Mars ?', 'Environ 3 et 22 minutes aller simple.'], ['Niveau 1 d\'autonomie d\'un rover ?', 'Il rejoint seul des points de passage et s\'arrête face au danger.'], ['Pourquoi l\'autonomie est-elle nécessaire sur Mars ?', 'Le délai aller-retour rend la commande directe trop lente et risquée.']],
    },
    {
      id: 'mars-terrain', title: 'Mission 8 · Lire le terrain', sub: 'Pentes, cartes de coût et planification', min: 30, level: 3,
      why: `Avant de planifier un chemin, il faut savoir où l'on peut rouler. Transformer des mesures de relief en carte de coût est un passage obligé de toute navigation tout-terrain, sur Mars, en agriculture ou en exploitation minière.`,
      objectives: ['Calculer une pente à partir d\'une carte de hauteurs', 'Construire une carte de coût de traversée', 'Relier perception et planification', 'Arbitrer entre chemin court et chemin sûr'],
      blocks: [
        Brief('Mission 8 · Briefing', `<p>Les caméras stéréo du rover ont produit une carte de hauteurs du terrain devant lui. À toi de la transformer en décision : <strong>où peut-il passer, et à quel prix ?</strong></p>`, ['Vision', 'Maths', 'Planification']),
        P(`<p>Une caméra stéréo donne, pour chaque point, sa hauteur z. Sur une grille de pas d, la pente se calcule par différences finies, comme une dérivée :</p>`),
        F('∂z/∂x ≈ (z<sub>droite</sub> − z<sub>gauche</sub>) / (2d) &nbsp;&nbsp; ∂z/∂y ≈ (z<sub>bas</sub> − z<sub>haut</sub>) / (2d) &nbsp;&nbsp; pente = atan(√((∂z/∂x)² + (∂z/∂y)²))', 'différences centrées sur les voisins de la cellule'),
        Code('c1', 'Écris <code>pente(z, d)</code> : z est une grille 3 × 3 de hauteurs (z[ligne][colonne], la ligne 0 en haut), d le pas en mètres. Renvoie la pente au centre en degrés.', {
          fn: 'pente',
          starter: 'function pente(z, d) {\n  const gx = (z[1][2] - z[1][0]) / (2 * d);\n  // gy avec la ligne du bas moins la ligne du haut\n  return 0;\n}',
          tests: [[[[[0, 0, 0], [0, 0, 0], [0, 0, 0]], 0.1], 0], [[[[0, 0.1, 0.2], [0, 0.1, 0.2], [0, 0.1, 0.2]], 0.1], 45], [[[[0, 0, 0], [0, 0, 0], [0.1, 0.1, 0.1]], 0.5], 5.7106], [[[[0, 0, 0], [0, 0.5, 0.2], [0, 0.4, 0]], 0.2], 48.1897]],
          sol: 'function pente(z, d) {\n  const gx = (z[1][2] - z[1][0]) / (2 * d);\n  const gy = (z[2][1] - z[0][1]) / (2 * d);\n  return Math.atan(Math.hypot(gx, gy)) * 180 / Math.PI;\n}',
        }),
        Table(['Terrain', 'Coût de traversée proposé'], [
          ['pente < 10°, sol ferme', '1 (idéal)'],
          ['pente de 10 à 20°', '3 (plus lent, plus d\'énergie)'],
          ['sable meuble repéré par la texture de l\'image', '8 (risque d\'enlisement)'],
          ['pente > 25° ou rocher plus haut que la garde au sol', 'infranchissable'],
        ]),
        Sim('pathplan'),
        P(`<p>Dans le planificateur, dessine un « champ de rochers » et compare le chemin le plus court au chemin que tu jugerais le plus sûr. Un A* qui utilise la carte de coût au lieu de la seule distance trouve automatiquement ce compromis.</p>`),
        Future(`Les rovers récents classent aussi le terrain par apprentissage : un réseau de neurones entraîné sur des images martiennes annotées reconnaît sable, roche et gravier. Le défi est la confiance : un robot qui se trompe de classe peut s'enliser pour toujours.`),
        Think('t1', `Ton chemin le plus sûr est 3 fois plus long que le plus court, et la batterie est à 40 %. Que décides-tu, et sur quels critères ? Comment l'écrirais-tu dans une fonction de coût ?`, `On ajoute au coût un terme d'énergie qui pèse de plus en plus quand la batterie baisse : coût = distance pondérée par le terrain + k(batterie) × énergie, avec k grand quand la batterie est faible. Si aucun chemin ne passe avec une marge suffisante, la bonne décision peut être d'attendre une recharge plutôt que de prendre un risque. Décider de ne pas bouger est aussi une décision d'ingénieur.`),
        Q('q1', 'Pourquoi utiliser des différences centrées (voisin de droite moins voisin de gauche) plutôt qu\'une différence avec un seul voisin ?', ['C\'est plus rapide', 'C\'est plus précis : l\'erreur est plus petite, et la pente est évaluée au centre exact de la cellule', 'Ça évite les nombres négatifs', 'Il n\'y a aucune différence'], 1, 'La différence centrée est précise au second ordre, la différence avant seulement au premier.'),
      ],
      cards: [['Pente à partir d\'une carte de hauteurs ?', 'atan de la norme du gradient, estimé par différences finies.'], ['Carte de coût ?', 'Grille où chaque cellule a un coût de traversée selon le terrain.'], ['Pourquoi A* sur une carte de coût plutôt que de distance ?', 'Pour trouver un compromis entre longueur du chemin et risque ou énergie.']],
    },
    {
      id: 'mars-helico', title: 'Mission 9 · Voler dans un air presque vide', sub: 'L\'hélicoptère éclaireur', min: 30, level: 3,
      why: `Voler sur Mars semblait impossible jusqu'en 2021. Comprendre comment Ingenuity y est parvenu fait travailler ensemble aérodynamique, motorisation, masse et commande, avec une contrainte physique dure : la vitesse du son.`,
      objectives: ['Comprendre l\'effet de la densité de l\'air sur la poussée', 'Identifier la limite de vitesse en bout de pale', 'Dimensionner un rotor martien', 'Stabiliser un drone dans le vent'],
      blocks: [
        Brief('Mission 9 · Briefing', `<p>Un éclaireur volant pourrait repérer les chemins du rover et explorer les falaises. Masse imposée : <strong>1,8 kg</strong>. L'air de Mars est environ 70 fois moins dense que celui de la Terre au niveau de la mer.</p>`, ['Aérodynamique', 'Commande', 'Mécanique']),
        P(`<p>Avec T = C<sub>T</sub>·ρ·n²·D⁴, diviser ρ par 70 demande de compenser ailleurs. Deux leviers : tourner plus vite (n²) ou agrandir les pales (D⁴). Mais le bout de pale ne doit pas approcher la vitesse du son, qui est plus faible sur Mars (environ 240 m/s) : au-delà de 0,7 fois cette vitesse environ, des ondes de choc dégradent fortement la portance.</p>`),
        F('v<sub>bout</sub> = π · D · n', 'vitesse en bout de pale, n en tours par seconde'),
        Exo('e1', 'Un rotor de 1,2 m tourne à 2 500 tr/min. Vitesse en bout de pale ?', { answer: 157.08, unit: 'm/s', tol: 0.5, sol: 'n = 2 500 / 60 = 41,7 tr/s. v = π × 1,2 × 41,7 = <b>157 m/s</b>, soit 0,65 fois la vitesse du son martienne. Juste sous la limite.' }),
        Sim('quadrotor', { planet: 'mars' }),
        Defi('defi-ingenuity', 'L\'éclaireur martien', `Sur Mars, avec 1,8 kg, obtiens un rapport poussée/poids d'au moins 1,5 avec des bouts de pale sous 0,7 fois la vitesse du son, puis tiens la cible à moins de 30 cm pendant 10 s avec le vent.`, 'quadrotor', { goal: true, planet: 'mars' }),
        Real(`Ingenuity, l'hélicoptère de 1,8 kg arrivé avec Perseverance, a volé pour la première fois le 19 avril 2021 : premier vol motorisé sur une autre planète. Prévu pour cinq vols de démonstration, il en a réalisé 72 jusqu'en janvier 2024. Ses deux rotors contrarotatifs de 1,2 m tournaient à environ 2 500 tr/min.`),
        Twist('Imprévu : un capteur perd ses repères', `<p>Ingenuity se repérait en suivant les détails du sol avec une caméra. Lors d'un vol au-dessus d'un terrain sableux, très uniforme, le système de navigation a manqué de repères visuels. Que se passe-t-il pour un drone dont l'estimation de vitesse devient fausse ? Quels capteurs ou quelles stratégies ajouterais-tu ?</p>`),
        Think('t1', `Propose deux usages d'un drone martien, au-delà de l'éclairage du chemin du rover, qui seraient utiles à la future base. Pour chacun, dis ce qui limite le plus sa faisabilité : énergie, poussée, navigation ou communication.`, `Exemples : inspection des panneaux solaires et des antennes de la base (limite : précision de navigation près des structures) ; exploration de l'entrée des grottes et des falaises inaccessibles aux rovers (limite : communication dès qu'on descend, et poussée pour remonter avec une charge) ; transport de petits échantillons entre deux sites (limite : énergie et poussée). L'essentiel est de relier l'usage aux contraintes physiques vues dans la mission.`),
      ],
      cards: [['Pourquoi voler sur Mars est-il difficile ?', 'L\'air est environ 70 fois moins dense : la poussée chute d\'autant à vitesse et taille égales.'], ['Limite en bout de pale ?', 'Rester sous environ 0,7 fois la vitesse du son (≈ 240 m/s sur Mars).'], ['Premier vol motorisé sur une autre planète ?', 'Ingenuity, le 19 avril 2021.']],
    },
    {
      id: 'mars-grottes', title: 'Mission 10 · Explorer les tubes de lave', sub: 'Essaims, relais et communication souterraine', min: 35, level: 3,
      why: `Les grottes protègent du rayonnement et des écarts de température : ce sont des abris naturels possibles pour une base. Mais aucune onde radio ne les traverse. Les explorer combine essaims, réseaux et autonomie.`,
      objectives: ['Comprendre l\'intérêt des tubes de lave', 'Concevoir une chaîne de relais radio', 'Planifier une exploration multi-robots', 'Gérer la perte de communication'],
      blocks: [
        Brief('Mission 10 · Briefing', `<p>Des images orbitales montrent des orifices sur les flancs de volcans martiens comme Arsia Mons : peut-être les entrées de tunnels laissés par d'anciennes coulées de lave. <strong>Si l'un d'eux est stable, il pourrait abriter la base.</strong> Il faut l'explorer avec une équipe de petits robots.</p>`, ['Multi-robots', 'Réseaux', 'Énergie']),
        P(`<p>Dans un tunnel, la radio ne passe qu'en vue directe, à quelques centaines de mètres au mieux. Une solution : des robots qui déposent des relais derrière eux, ou qui s'arrêtent eux-mêmes pour servir de relais quand le signal faiblit. L'exploration devient un problème de coordination : qui avance, qui reste, qui revient recharger ?</p>`),
        Sim('swarm'),
        Exo('e1', 'Le tunnel fait 1,8 km de long et chaque relais porte à 250 m dans les virages. Combien de relais faut-il au minimum, en plus de la station à l\'entrée, pour couvrir tout le tunnel en ligne droite ?', { answer: 7, tol: 0, sol: '1 800 / 250 = 7,2. La station couvre les 250 premiers mètres, il reste 1 550 m, soit 1 550 / 250 = 6,2, donc <b>7 relais</b>. En pratique on en prévoit plus : les virages et les roches coupent la portée.' }),
        Twist('Imprévu : un relais tombe en panne au milieu du tunnel', `<p>Le relais numéro 3 ne répond plus. Les quatre robots qui sont au-delà sont coupés du monde. Que doivent-ils faire ? Écris une règle simple, décidée à l'avance, que chaque robot applique seul. Pense à l'énergie restante, aux données collectées et au risque de perdre un robot de plus.</p>`),
        Dossier('dos-grottes', 'Plan d\'exploration d\'un tube de lave', `Tu disposes de six petits robots à roues (autonomie 3 heures, portée radio 250 m), d'un stock de huit relais à déposer, et d'un rover de surface comme station. Rédige ton plan.`, [
          'Comment répartis-tu les rôles entre les six robots (éclaireurs, porteurs de relais, cartographes) ? Pourquoi ?',
          'Quelle règle appliquent les robots en cas de perte de communication ? Décris-la comme un algorithme en quelques lignes.',
          'Comment les robots rechargent-ils ou reviennent-ils avant d\'épuiser leur batterie ? Donne un critère chiffré de retour.',
          'Quelles données remontes-tu en priorité si le débit est très faible : images, carte 3D, mesures de rayonnement, température ? Classe-les.',
        ], ['Mon plan fonctionne même si un robot tombe en panne', 'Ma règle de perte de contact est claire et applicable par un robot seul', 'J\'ai chiffré l\'énergie ou les distances', 'J\'ai justifié les priorités de données par l\'objectif de la mission']),
        Real(`Sur Terre, des équipes de robots explorent déjà des réseaux souterrains complexes : lors de compétitions internationales de robotique souterraine, des équipes mêlant robots à roues, à pattes et drones ont dû cartographier des mines, des grottes et des tunnels sans liaison permanente, en déposant des relais et en décidant seuls quand rentrer.`),
      ],
      cards: [['Intérêt d\'un tube de lave pour une base ?', 'Protection naturelle contre le rayonnement, les micrométéorites et les écarts de température.'], ['Problème principal de l\'exploration souterraine ?', 'La radio ne passe qu\'en vue directe : il faut des relais et de l\'autonomie.'], ['Règle de perte de contact ?', 'Comportement décidé à la conception et appliqué par le robot seul quand la liaison disparaît.']],
    },
    {
      id: 'mars-base', title: 'Mission 11 · Construire avec des bras robotisés', sub: 'Manipulation en gravité réduite et construction avec le sol martien', min: 35, level: 3,
      why: `Emporter des briques depuis la Terre coûterait des fortunes. Construire avec le sol martien demande des robots qui manipulent des charges variables sous une gravité différente : dynamique, commande et matériaux se rencontrent.`,
      objectives: ['Adapter une commande de bras à une autre gravité', 'Comprendre l\'importance d\'estimer la charge', 'Connaître les pistes de construction avec le régolithe', 'Raisonner sur la fiabilité d\'un chantier robotisé'],
      blocks: [
        Brief('Mission 11 · Briefing', `<p>Les robots doivent empiler des blocs de régolithe compacté pour protéger les modules d'habitation. Les blocs n'ont pas tous la même masse, et les bras ont été réglés… sur Terre.</p>`, ['Dynamique', 'Commande', 'Matériaux']),
        Sim('armdyn'),
        P(`<p>Passe le simulateur sur « Mars » : à réglages égaux, l'erreur d'un PD seul diminue, puisque la gravité est plus faible. Mais si la commande compense une gravité terrestre alors que le bras est sur Mars, elle surcompense. Et une charge inconnue fausse toute commande fondée sur le modèle. D'où l'intérêt d'<strong>estimer la charge</strong> : le bras soulève le bloc, mesure le couple nécessaire pour le tenir, et en déduit la masse.</p>`),
        F('m<sub>charge</sub> ≈ (τ<sub>mesuré</sub> − τ<sub>bras à vide</sub>) / (g · L<sub>horizontale</sub>)', 'estimation statique à partir du couple de l\'épaule, bras immobile'),
        Exo('e1', 'Bras immobile, la charge est à 0,9 m horizontalement de l\'épaule. Le couple mesuré est 41,2 N·m, le bras à vide demande 30,1 N·m. Masse de la charge sur Mars (g = 3,71) ?', { answer: 3.324, unit: 'kg', tol: 0.02, sol: 'm = (41,2 − 30,1) / (3,71 × 0,9) = 11,1 / 3,339 = <b>3,32 kg</b>.' }),
        Table(['Technique de construction', 'Principe', 'Défis'], [
          ['Impression 3D au régolithe', 'un bras ou un portique dépose couche par couche un mélange de sol et de liant', 'liant à apporter ou produire, qualité variable du sol'],
          ['Frittage', 'chauffer le régolithe (micro-ondes, soleil concentré) pour souder les grains', 'beaucoup d\'énergie'],
          ['Sacs de régolithe', 'remplir des sacs et les empiler sur les modules', 'simple, mais beaucoup de manipulations'],
          ['Briques compactées', 'presser le sol à haute pression', 'mécanique robuste, usure par la poussière abrasive'],
        ]),
        Twist('Imprévu : la poussière grippe les articulations', `<p>Après deux semaines, les couples nécessaires augmentent de 15 % : la poussière fine s'infiltre dans les réducteurs. Ton estimation de masse se met à mentir. Comment le système peut-il s'en rendre compte tout seul ? Pense à une mesure de référence, faite régulièrement, dont on connaît le résultat attendu.</p>`),
        Think('t1', `Un chantier de 20 robots doit fonctionner deux ans sans réparation humaine. Propose une stratégie de fiabilité : redondance, pièces de rechange, robots qui en réparent d'autres, modularité. Laquelle te semble la plus réaliste, et pourquoi ?`, `La modularité est souvent la plus efficace : des bras identiques, aux articulations interchangeables, qu'un autre robot peut démonter et remplacer avec un outil simple. Avec des pièces de rechange standardisées, un robot en panne devient une réserve de pièces. La redondance pure (doubler chaque robot) coûte cher en masse. L'auto-réparation complète reste du domaine de la recherche. Il faut aussi des diagnostics : savoir ce qui s'use avant que ça casse.`),
        Q('q1', 'Pourquoi un bras réglé sur Terre peut-il mal fonctionner sur Mars même si la gravité y est plus faible ?', ['Parce que les moteurs sont plus faibles', 'Parce que sa compensation de gravité et ses gains sont calibrés pour 9,81 m/s² : il surcompense, et l\'inertie, elle, n\'a pas changé', 'Parce qu\'il fait froid', 'Il fonctionne forcément mieux'], 1, 'Tout ce qui dépend de g doit être recalibré ; ce qui dépend de la masse (inertie) ne change pas.'),
      ],
      cards: [['Estimation statique de la charge ?', 'm ≈ (τ mesuré − τ à vide) / (g · bras de levier).'], ['Régolithe ?', 'Couche de sol meuble, poussière et roches fragmentées, à la surface d\'une planète.'], ['Pourquoi construire avec le sol martien ?', 'Transporter des matériaux depuis la Terre coûte énormément.']],
    },
    {
      id: 'mars-isru', title: 'Mission 12 · Fabriquer sur place', sub: 'Énergie, oxygène et carburant à partir de Mars', min: 35, level: 3,
      why: `Utiliser les ressources locales est la condition pour rester durablement et pour revenir. C'est un problème d'ingénierie de procédés, d'énergie et de robotique : il faut extraire, transporter, transformer, et tout cela sans opérateur.`,
      objectives: ['Comprendre les réactions de production d\'oxygène et de méthane', 'Établir le bilan énergétique d\'une base', 'Comparer solaire et nucléaire pour une base', 'Faire un choix argumenté sous contrainte de masse'],
      blocks: [
        Brief('Mission 12 · Briefing', `<p>La base doit fournir l'oxygène et l'énergie d'un équipage de <strong>six personnes</strong>, et survivre à une tempête de poussière sans rationner l'air. Budget de masse pour tout le système d'énergie : <strong>12 tonnes</strong>.</p>`, ['Chimie', 'Énergie', 'Systèmes']),
        F('CO₂ + 4 H₂ → CH₄ + 2 H₂O', 'réaction de Sabatier : méthane à partir du CO₂ de l\'air et d\'hydrogène'),
        F('2 H₂O → 2 H₂ + O₂', 'électrolyse de l\'eau extraite de la glace du sous-sol : hydrogène et oxygène'),
        Real(`MOXIE, une expérience embarquée sur Perseverance, a produit de l'oxygène sur Mars en décomposant le CO₂ de l'atmosphère, jusqu'à une douzaine de grammes par heure. Une démonstration minuscule, mais la première preuve qu'on peut fabriquer de l'oxygène sur une autre planète.`),
        Calc('calc-isru', 'Le système d\'énergie de la base', `Hypothèses de l'exercice : chaque personne demande 30 kWh par sol (chauffage, support de vie, production d'oxygène comprise). En mode tempête, on peut descendre à 60 % de ce besoin. Panneaux : 0,6 kWh électrique par m² et par sol par beau temps, 25 % de cela en pleine tempête, 1,5 kg/m² avec la structure, plus des batteries pour la nuit (la moitié de la production du sol, à 5 kg par kWh). Réacteur à fission : 10 kW électriques en continu, 1,5 tonne chacun.`, [
          { k: 'crew', label: 'Équipage', min: 2, max: 12, step: 1, value: 4, unit: 'personnes' },
          { k: 'area', label: 'Surface de panneaux', min: 0, max: 3000, step: 50, value: 200, unit: 'm²' },
          { k: 'reac', label: 'Réacteurs à fission de 10 kW', min: 0, max: 6, step: 1, value: 0, unit: '' },
        ], ({ crew, area, reac }) => {
          const need = crew * 30;
          const sun = area * 0.6, storm = sun * 0.25, nuc = reac * 10 * 24.66;
          const mass = area * 1.5 + sun * 0.5 * 5 + reac * 1500;
          return {
            outputs: [['Besoin par sol', need, 'kWh'], ['Production par beau temps', sun + nuc, 'kWh/sol'], ['Production en tempête', storm + nuc, 'kWh/sol'], ['Marge par beau temps', (sun + nuc) / need, '×'], ['Masse du système', mass / 1000, 't']],
            checks: [['Équipage de 6 personnes au moins', crew >= 6], ['Marge d\'au moins 1,5 par beau temps', sun + nuc >= 1.5 * need], ['Survie en tempête (≥ 60 % du besoin)', storm + nuc >= 0.6 * need], ['Masse ≤ 12 t', mass <= 12000]],
          };
        }, { okText: 'Ta base tient. Essaie maintenant une solution très différente (tout solaire, tout nucléaire, mixte) et compare masse, risques et dépendance à la météo : il n\'y a pas qu\'une seule bonne réponse.' }),
        Twist('Imprévu : un réacteur s\'arrête', `<p>Si ta solution repose sur un ou deux réacteurs, que se passe-t-il quand l'un d'eux s'arrête en pleine tempête ? Vérifie avec l'atelier en retirant un réacteur. Combien de pannes simultanées ta base supporte-t-elle ? C'est la notion de <strong>tolérance aux pannes</strong>, souvent notée N−1.</p>`),
        Think('t1', `Quels robots faut-il pour faire tourner cette usine d'oxygène et de méthane sans humain ? Liste les tâches (extraire la glace, la transporter, nettoyer les panneaux, entretenir…) et propose pour chacune un type de robot vu dans le parcours.`, `Exemples : excavatrice robotisée à godets pour extraire le sol glacé, avec un faible poids sur Mars donc une adhérence limitée, d'où des systèmes de creusage qui s'équilibrent eux-mêmes ; rovers de transport en convoi avec suivi de chemin ; robots nettoyeurs de panneaux sur rails ; bras d'inspection avec caméras pour les fuites ; drone d'inspection pour la vue d'ensemble. La supervision peut être un système multi-agents qui répartit les tâches par enchères.`),
      ],
      cards: [['Réaction de Sabatier ?', 'CO₂ + 4 H₂ → CH₄ + 2 H₂O.'], ['ISRU ?', 'Utilisation des ressources locales (in situ resource utilization).'], ['MOXIE ?', 'Expérience de Perseverance qui a produit de l\'oxygène à partir du CO₂ martien.'], ['Tolérance N−1 ?', 'Le système continue de fonctionner avec un équipement en panne.']],
    },
    {
      id: 'mars-equipage', title: 'Mission 13 · Le grand dossier', sub: 'Robots et humains : le plan de la première base', min: 60, level: 3,
      why: `Un ingénieur ne se juge pas à la quantité de formules qu'il connaît, mais à sa capacité à assembler des domaines différents en un système cohérent, à en voir les risques et à le défendre devant d'autres. C'est le but de ce dernier dossier.`,
      objectives: ['Assembler les résultats des missions précédentes', 'Faire des choix d\'architecture argumentés', 'Identifier et traiter les risques', 'Présenter un projet de façon claire et honnête'],
      blocks: [
        Brief('Mission 13 · Briefing final', `<p>Le comité attend ta proposition complète : <strong>la séquence robotique qui prépare l'arrivée du premier équipage</strong>, de l'atterrissage des premiers robots jusqu'au jour où les humains ouvrent la porte d'un habitat déjà protégé, alimenté et approvisionné en oxygène.</p>`, ['Systèmes', 'Gestion de projet', 'Communication', 'Éthique']),
        P(`<p>Quand l'équipage sera là, les robots ne disparaîtront pas. Ils feront les tâches dangereuses, répétitives ou longues, et les humains feront ce que les robots font mal : improviser face à l'imprévu, juger, découvrir. Le rayonnement reçu pendant le voyage et le séjour (de l'ordre de 0,7 mSv par jour en surface et davantage pendant le trajet, selon les mesures de Curiosity) impose de limiter les sorties : chaque tâche confiée à un robot protège la santé de l'équipage.</p>`),
        Table(['Ce que les robots font mieux', 'Ce que les humains font mieux'], [
          ['travailler sans pause, au froid, sous rayonnement', 'improviser face à une situation jamais vue'],
          ['répéter un geste mille fois à l\'identique', 'juger de l\'intérêt scientifique d\'un caillou d\'un coup d\'œil'],
          ['porter lourd sans fatigue', 'réparer avec ce qu\'on a sous la main'],
          ['prendre des risques sans mettre de vie en jeu', 'décider quand les règles ne prévoient pas le cas'],
        ]),
        Danger(`Un plan qui ne prévoit que le cas nominal n'est pas un plan. Pour chaque étape critique, demande-toi : que se passe-t-il si ça échoue ? Peut-on recommencer, contourner, ou faut-il tout arrêter ?`, 'La règle d\'or des missions spatiales'),
        Dossier('dos-mars-final', 'Plan robotique de la première base martienne', `Appuie-toi sur les missions 1 à 12. Les chiffres que tu as obtenus dans les ateliers et les simulateurs sont tes arguments. Prends le temps qu'il faut : c'est un vrai travail d'ingénieur, qui peut s'étaler sur plusieurs séances.`, [
          'Séquence : dans quel ordre arrivent les robots (cartographie, énergie, construction, ISRU, logistique), avec combien de fenêtres de tir de 26 mois d\'écart ? Fais une frise.',
          'Architecture : quels types de robots (rovers, bras, drones, essaims, excavateurs) et combien ? Comment communiquent-ils entre eux et avec la Terre ?',
          'Énergie : quelle solution as-tu retenue dans la mission 12, avec quelle marge et quelle tolérance aux pannes ?',
          'Risques : liste les cinq risques principaux, avec pour chacun la probabilité, la gravité et la parade.',
          'Humains et robots : quelles tâches restent aux humains, lesquelles aux robots, et comment garantis-tu la sécurité de l\'équipage près des machines ?',
          'Retour sur Terre : quelle technologie de ton plan serait utile dès aujourd\'hui en RDC ou ailleurs en Afrique ? Décris une application concrète.',
        ], ['Mon plan suit une logique chronologique claire', 'Chaque choix est justifié par un chiffre ou un résultat des missions', 'J\'ai traité les pannes et pas seulement le cas nominal', 'J\'ai pensé à la sécurité des humains', 'Mon idée de retour sur Terre est concrète et réaliste', 'Quelqu\'un qui n\'a pas suivi le parcours pourrait comprendre mon dossier']),
        Future(`Personne ne sait encore quand les premiers humains marcheront sur Mars, ni qui les y emmènera. Ce qui est certain, c'est que les compétences de cette campagne (autonomie, énergie, robots qui travaillent loin de tout atelier) sont exactement celles dont ont besoin les mines, l'agriculture, la santé et les villes d'aujourd'hui. Viser Mars est une excellente façon d'apprendre à résoudre les problèmes de la Terre.`),
        Manual('manuel-pitch', 'Présente ton plan en 5 minutes', `Prépare une présentation de 5 minutes de ton plan (quelques diapositives ou un tableau) et présente-la à au moins deux personnes. Demande-leur la question qui les a le plus gênés et note-la dans ton carnet : c'est là que ton plan doit progresser.`, 120),
      ],
      cards: [['Pourquoi limiter les sorties des astronautes ?', 'Pour limiter la dose de rayonnement et les risques ; les robots font les tâches longues et dangereuses.'], ['Que faut-il prévoir pour chaque étape critique ?', 'Le cas d\'échec : recommencer, contourner ou arrêter.']],
    },
  ],
};

// ============================================================================
// Retour sur Terre : les mêmes compétences, ici et maintenant
// ============================================================================

export const terre = {
  id: 'terre', phase: 'mars', icon: '🌍', title: 'Retour sur Terre : ateliers d\'ingénieur',
  desc: 'Les technologies de la campagne martienne appliquées à des défis réels en RDC et en Afrique.',
  master: 'Projet de terrain',
  intro: `Autonomie, énergie solaire, robots qui travaillent loin de tout atelier, essaims qui explorent des galeries : tout ce qui sert sur Mars sert déjà ici. Ces ateliers partent de besoins réels et te demandent d'appliquer, d'adapter et d'inventer.`,
  lessons: [
    {
      id: 'atelier-mines', title: 'Atelier 1 · Inspecter une galerie de mine', sub: 'Autonomie souterraine et sécurité', min: 45, level: 3,
      why: `Le Katanga est l'une des grandes régions minières du monde. L'inspection des galeries après un tir ou un éboulement expose des personnes à des risques graves. C'est le terrain idéal pour les compétences de la mission 10.`,
      objectives: ['Transposer une solution martienne à un besoin terrestre', 'Identifier les contraintes spécifiques (poussière, gaz, absence de GPS et de radio)', 'Choisir des capteurs adaptés', 'Rédiger un cahier des charges'],
      blocks: [
        Brief('Atelier 1 · Le besoin', `<p>Une exploitation souterraine veut vérifier l'état d'une galerie (gaz, stabilité du toit, obstacles) <strong>avant</strong> d'y renvoyer des équipes après un tir. Aucune liaison radio ne passe au-delà de quelques dizaines de mètres, il n'y a pas de GPS, l'air est chargé de poussière.</p>`, ['Capteurs', 'Autonomie', 'Sécurité']),
        Table(['Contrainte', 'Équivalent martien', 'Piste de solution'], [
          ['Pas de GPS', 'pas de GPS sur Mars', 'odométrie + lidar + SLAM'],
          ['Radio coupée', 'tubes de lave', 'relais déposés, retour automatique au dernier point de contact'],
          ['Poussière', 'poussière martienne', 'lidar et radar plutôt que caméras seules, protections étanches'],
          ['Gaz explosifs possibles', 'aucun', 'électronique certifiée pour atmosphères explosives, ou robot qui reste à distance'],
          ['Sol encombré de blocs', 'champ de rochers', 'chenilles ou pattes, carte de coût de traversée'],
        ]),
        Warn(`Dans une mine où des gaz inflammables peuvent être présents, tout équipement électrique doit respecter des règles strictes de protection contre les explosions. Un prototype de laboratoire n'a pas le droit d'y entrer : il faut prévoir la certification dès la conception.`, 'Sécurité avant tout'),
        Dossier('dos-mines', 'Cahier des charges du robot d\'inspection', `Rédige-le comme si tu devais le présenter à une entreprise minière.`, [
          'Quelles mesures le robot doit-il faire (gaz, fissures, déformation du toit, température) et avec quels capteurs ?',
          'Quelle locomotion et pourquoi ? Comment franchit-il des blocs de 30 cm ?',
          'Comment revient-il si la communication est perdue ou si la batterie baisse ? Donne une règle chiffrée.',
          'Qu\'est-ce qui pourrait rendre ce robot inutile ou dangereux ? Comment l\'éviter ?',
          'Comment le testerais-tu progressivement, d\'abord sans danger, puis sur site ?',
        ], ['Mes capteurs correspondent aux mesures demandées', 'J\'ai traité la perte de communication', 'J\'ai pensé à la certification et à la sécurité', 'Mon plan de test est progressif']),
      ],
      cards: [['Pourquoi pas de GPS en galerie ?', 'Les signaux satellites ne traversent pas la roche.'], ['Capteurs adaptés à la poussière ?', 'Lidar, radar, en complément des caméras.']],
    },
    {
      id: 'atelier-solaire', title: 'Atelier 2 · Un robot qui vit du soleil', sub: 'Dimensionner l\'énergie d\'un robot autonome à Lubumbashi', min: 40, level: 2,
      why: `Le réseau électrique n'est pas toujours disponible ni stable. Un robot autonome sur le terrain doit souvent vivre de l'énergie solaire, exactement comme un rover martien, avec une saison des pluies à la place des tempêtes de poussière.`,
      objectives: ['Faire un bilan énergétique journalier', 'Tenir compte de la saison la plus défavorable', 'Dimensionner panneaux et batterie', 'Respecter un budget'],
      blocks: [
        Brief('Atelier 2 · Le besoin', `<p>Un robot de curage des caniveaux travaille la nuit, quand les rues sont vides. Il doit se recharger le jour avec ses propres panneaux, tenir <strong>deux jours sans soleil</strong> pendant la saison des pluies, et l'ensemble énergie ne doit pas coûter plus de <strong>900 dollars</strong>.</p>`, ['Électricité', 'Économie', 'Systèmes']),
        F('E<sub>produite</sub> = P<sub>crête</sub> × h<sub>plein soleil</sub> × 0,75', 'les 25 % de pertes couvrent la chaleur, la poussière, le régulateur et les câbles'),
        Calc('calc-solaire', 'Panneaux et batterie du robot', `Hypothèses de l'exercice, à vérifier pour un vrai projet : 4 heures équivalentes de plein soleil par jour en saison des pluies, veille de 10 W en permanence, batterie lithium fer phosphate utilisable à 80 %. Prix indicatifs : 0,35 $ par watt-crête de panneau, 0,25 $ par Wh de batterie.`, [
          { k: 'P', label: 'Puissance moyenne du robot au travail', min: 50, max: 400, step: 10, value: 200, unit: 'W' },
          { k: 'h', label: 'Heures de travail par nuit', min: 1, max: 10, step: 0.5, value: 6, unit: 'h' },
          { k: 'wc', label: 'Panneaux', min: 50, max: 1500, step: 10, value: 300, unit: 'Wc' },
          { k: 'wh', label: 'Batterie', min: 200, max: 6000, step: 50, value: 1500, unit: 'Wh' },
        ], ({ P, h, wc, wh }) => {
          const need = P * h + 10 * 24;
          const prod = wc * 4 * 0.75;
          const cost = wc * 0.35 + wh * 0.25;
          return {
            outputs: [['Besoin par jour', need, 'Wh'], ['Production en saison des pluies', prod, 'Wh/jour'], ['Énergie utilisable de la batterie', wh * 0.8, 'Wh'], ['Coût de l\'ensemble', cost, '$']],
            checks: [['Puissance suffisante pour la brosse et la pompe (≥ 150 W)', P >= 150], ['La production couvre le besoin en saison des pluies', prod >= need], ['La batterie tient deux jours sans soleil', wh * 0.8 >= 2 * need], ['Coût ≤ 900 $', cost <= 900], ['Au moins 4 heures de curage par nuit', h >= 4]],
          };
        }, { okText: 'Ton robot tient l\'année. Remarque que le levier le plus puissant n\'était pas le matériel mais la consommation : chaque watt économisé sur le robot économise panneaux et batterie.' }),
        Think('t1', `Pour réduire la consommation du robot, propose trois idées qui touchent à des domaines différents : mécanique, électronique, logiciel ou organisation du travail.`, `Exemples : mécanique, réduire la masse et les frottements, choisir des réducteurs à bon rendement ; électronique, des moteurs à aimants permanents et des variateurs efficaces, couper les capteurs inutilisés ; logiciel, planifier un trajet qui évite les allers-retours, adapter la vitesse ; organisation, curer en priorité les tronçons les plus encombrés avant les pluies, plutôt que tout curer chaque nuit.`),
      ],
      cards: [['Énergie produite par un panneau en une journée ?', 'P crête × heures de plein soleil × rendement global (≈ 0,75).'], ['Pourquoi dimensionner sur la saison des pluies ?', 'C\'est le cas le plus défavorable : le système doit tenir le pire mois.']],
    },
    {
      id: 'atelier-recup', title: 'Atelier 3 · Robotique de récupération', sub: 'Construire avec ce qu\'on trouve', min: 40, level: 1,
      why: `Sur Mars, il n'y a pas de magasin de pièces : on répare et on construit avec ce qu'on a. Dans bien des endroits, c'est aussi vrai sur Terre. Savoir récupérer moteurs, capteurs et batteries dans des appareils usagés est une compétence précieuse et créative.`,
      objectives: ['Identifier les composants utiles dans des appareils usagés', 'Tester un composant inconnu en sécurité', 'Concevoir un petit robot à partir de pièces récupérées', 'Documenter son travail'],
      blocks: [
        Brief('Atelier 3 · Le défi', `<p>Construire un petit robot mobile qui évite les obstacles, en utilisant au moins <strong>trois pièces récupérées</strong> dans des appareils hors d'usage.</p>`, ['Électronique', 'Mécanique', 'Créativité']),
        Table(['Appareil usagé', 'Ce qu\'on peut y récupérer'], [
          ['Imprimante, scanner', 'moteurs pas à pas, rails, courroies, capteurs de fin de course'],
          ['Lecteur CD ou DVD', 'petit moteur pas à pas avec vis, moteur continu, laser (à manipuler avec prudence)'],
          ['Jouet électrique', 'moteurs avec réducteur, roues, boîtier de piles'],
          ['Ventilateur d\'ordinateur', 'moteur sans balais, capteur de rotation'],
          ['Ordinateur portable', 'cellules de batterie (attention), haut-parleurs, webcam'],
          ['Téléphone ancien', 'vibreur (petit moteur), écran, parfois capteurs'],
        ]),
        Danger(`Les cellules lithium récupérées peuvent prendre feu si elles sont percées, court-circuitées ou mal chargées. Ne les démonte pas sans encadrement, utilise un chargeur adapté avec protection, et stocke-les dans un récipient non inflammable. Les condensateurs des alimentations peuvent garder une charge dangereuse même débranchés.`, 'Sécurité'),
        Manual('manuel-recup', 'Construis ton robot de récupération', `Réalise le robot, puis documente-le dans ton carnet : photo, liste des pièces et de leur origine, schéma électrique, ce qui n'a pas marché du premier coup et comment tu l'as résolu. La documentation compte autant que le robot.`, 150),
        Think('t1', `Tu as récupéré un moteur sans aucune référence. Comment détermines-tu, sans le griller, sa tension de fonctionnement, son courant et son type (continu, pas à pas, sans balais) ?`, `Compter les fils donne un premier indice : 2 fils, moteur continu ; 4, 5 ou 6 fils, souvent pas à pas ; 3 fils épais, sans balais. Mesurer la résistance des bobines à l'ohmmètre. Puis alimenter progressivement avec une alimentation limitée en courant, en partant de basse tension, et observer vitesse et échauffement. L'appareil d'origine donne souvent la tension de service : si l'imprimante était alimentée en 24 V, le moteur l'était probablement aussi.`),
      ],
      cards: [['Indice du type de moteur par le nombre de fils ?', '2 : continu ; 4 à 6 : pas à pas ; 3 fils épais : sans balais.'], ['Danger principal des batteries récupérées ?', 'Incendie en cas de perforation, court-circuit ou mauvaise charge.']],
    },
  ],
};
