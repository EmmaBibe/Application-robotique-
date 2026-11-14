import { P, H, H3, Tip, Warn, Danger, Future, Real, Info, F, Sim, Pipe, Q, Exo, Code, Defi, Manual, Think, Table, Calc, Dossier } from './b.js';

// ============================================================================
// Phase 5 : les frontières de la robotique
// ============================================================================

export const dynamique = {
  id: 'dynamique', phase: 'frontieres', icon: '🌀', title: 'Dynamique des robots',
  desc: 'Pourquoi un bras qui marche bien à vide se met à trembler en charge : énergie, Lagrange, couple calculé.',
  master: 'Modélisation et commande des robots',
  intro: `La cinématique dit où va le robot. La dynamique dit ce qu'il faut pour l'y emmener : quels couples, quelle énergie, et ce qui se passe quand on porte une charge, qu'on accélère fort ou qu'on change de planète. C'est le passage du dessin animé à la machine réelle.`,
  lessons: [
    {
      id: 'lagrange', title: 'L\'équation du mouvement d\'un robot', sub: 'Énergie cinétique, énergie potentielle et Lagrange', min: 35, level: 3,
      why: `Dimensionner un moteur, régler une commande rapide, simuler un robot avant de le construire : tout passe par le modèle dynamique. Sans lui, on choisit les moteurs au hasard et on découvre les problèmes sur la machine.`,
      objectives: ['Comprendre pourquoi Newton devient pénible pour un robot articulé', 'Écrire le lagrangien L = T − V', 'Lire la forme M(q)·q̈ + C(q, q̇)·q̇ + G(q) = τ', 'Calculer le couple de gravité d\'un bras à deux axes'],
      blocks: [
        P(`<p>Pour un objet seul, Newton suffit : F = m·a. Pour un bras à six articulations, chaque segment pousse et tire sur les autres. Écrire toutes les forces internes devient vite un cauchemar. Le mathématicien Lagrange a proposé un raccourci élégant : <strong>tout calculer à partir de l'énergie</strong>.</p>`),
        F('L = T − V', 'T : énergie cinétique du robot entier, V : énergie potentielle (gravité, ressorts)'),
        F('d/dt (∂L/∂q̇<sub>i</sub>) − ∂L/∂q<sub>i</sub> = τ<sub>i</sub>', 'une équation par articulation ; τ<sub>i</sub> est le couple du moteur i'),
        P(`<p>On n'a besoin que des positions et des vitesses des masses, jamais des forces internes. Le calcul, fastidieux mais mécanique, donne toujours la même structure :</p>`),
        F('M(q) · q̈ + C(q, q̇) · q̇ + G(q) = τ', 'inertie · accélération + effets de vitesse + gravité = couples moteurs'),
        Table(['Terme', 'Ce qu\'il représente', 'Ce que tu ressens en le vivant'], [
          ['M(q)', 'matrice d\'inertie, change avec la posture', 'un bras tendu est plus dur à faire tourner qu\'un bras replié'],
          ['C(q, q̇)·q̇', 'forces centrifuges et de Coriolis', 'quand l\'épaule tourne vite, le coude est « tiré » vers l\'extérieur'],
          ['G(q)', 'couples dus à la gravité', 'tenir un bras tendu à l\'horizontale fatigue, le laisser pendre non'],
          ['τ', 'couples fournis par les moteurs', 'ce que tu peux régler'],
        ]),
        H('Un bras à deux axes, concrètement'),
        P(`<p>Prenons deux segments de longueurs L<sub>1</sub>, L<sub>2</sub>, avec des masses m<sub>1</sub>, m<sub>2</sub> concentrées au bout de chaque segment, angles q<sub>1</sub> (épaule, mesuré depuis l'horizontale) et q<sub>2</sub> (coude, relatif au premier segment). La gravité donne :</p>`),
        F('G<sub>1</sub> = (m<sub>1</sub> + m<sub>2</sub>)·g·L<sub>1</sub>·cos q<sub>1</sub> + m<sub>2</sub>·g·L<sub>2</sub>·cos(q<sub>1</sub> + q<sub>2</sub>)', 'couple de gravité sur l\'épaule'),
        F('G<sub>2</sub> = m<sub>2</sub>·g·L<sub>2</sub>·cos(q<sub>1</sub> + q<sub>2</sub>)', 'couple de gravité sur le coude'),
        Tip(`Vérifie toujours un modèle avec des cas simples. Bras vertical (q<sub>1</sub> = 90°, q<sub>2</sub> = 0) : les cosinus valent 0, aucun couple de gravité, normal. Bras tendu à l'horizontale : le couple est maximal. Si ton modèle dit le contraire, il est faux.`, 'Le réflexe de l\'ingénieur'),
        Exo('e1', 'm<sub>1</sub> = 2 kg, m<sub>2</sub> = 1 kg, L<sub>1</sub> = 0,6 m, L<sub>2</sub> = 0,5 m, bras tendu à l\'horizontale (q<sub>1</sub> = q<sub>2</sub> = 0), sur Terre (g = 9,81). Couple de gravité sur l\'épaule ?', { answer: 22.563, unit: 'N·m', tol: 0.05, sol: 'G<sub>1</sub> = 3 × 9,81 × 0,6 + 1 × 9,81 × 0,5 = 17,66 + 4,91 = <b>22,56 N·m</b>.' }),
        Exo('e2', 'Même bras, même posture, mais sur Mars (g = 3,71 m/s²). Couple sur l\'épaule ?', { answer: 8.533, unit: 'N·m', tol: 0.03, sol: 'Le couple est proportionnel à g : 22,56 × 3,71 / 9,81 = <b>8,53 N·m</b>. Un moteur dimensionné pour Mars serait trop faible sur Terre : les tests au sol doivent en tenir compte.' }),
        Code('c1', 'Écris <code>coupleGravite(m1, m2, L1, L2, q1, q2, g)</code> qui renvoie <code>[G1, G2]</code> pour le bras décrit ci-dessus (angles en radians).', {
          fn: 'coupleGravite',
          starter: 'function coupleGravite(m1, m2, L1, L2, q1, q2, g) {\n  // G1 dépend des deux masses, G2 seulement de m2\n  return [0, 0];\n}',
          tests: [[[2, 1, 0.6, 0.5, 0, 0, 9.81], [22.563, 4.905]], [[2, 1, 0.6, 0.5, Math.PI / 2, 0, 9.81], [0, 0]], [[2, 4, 0.6, 0.5, 0.5, -0.5, 3.71], [19.141, 7.42]], [[1, 1, 1, 1, Math.PI / 3, Math.PI / 3, 1.62], [0.81, -0.81]]],
          sol: 'function coupleGravite(m1, m2, L1, L2, q1, q2, g) {\n  const c12 = Math.cos(q1 + q2);\n  return [(m1 + m2) * g * L1 * Math.cos(q1) + m2 * g * L2 * c12, m2 * g * L2 * c12];\n}',
        }),
        Real(`Les industriels ne choisissent pas un moteur sur le couple moyen mais sur le pire cas : bras tendu, charge maximale, accélération maximale. On ajoute ensuite une marge, souvent 30 à 50 %, car le modèle oublie toujours quelque chose : frottements, câbles, échauffement.`),
        Q('q1', 'Pourquoi la matrice M(q) dépend-elle de la posture du robot ?', ['À cause des frottements', 'Parce que la répartition des masses autour des axes change quand le bras se plie ou se tend', 'Parce que les moteurs chauffent', 'Elle n\'en dépend pas'], 1, 'L\'inertie autour d\'un axe dépend de la distance des masses à cet axe : un bras tendu a plus d\'inertie autour de l\'épaule.'),
        Think('t1', `Un bras de 2 kg doit être utilisé à la fois sur Terre et sur la Lune (g = 1,62 m/s²). Quels problèmes vois-tu si on garde exactement les mêmes réglages de commande ? Pense à la gravité, mais aussi à l'inertie.`, `La gravité est six fois plus faible sur la Lune : un réglage qui compensait la gravité terrestre « pousse » trop vers le haut. Mais l'inertie, elle, ne change pas : il faut toujours le même couple pour accélérer la même masse. Un bras lunaire peut donc porter des charges lourdes à l'arrêt, mais reste lent à les mettre en mouvement. Le régleur doit séparer clairement ce qui dépend de g et ce qui n'en dépend pas.`),
      ],
      cards: [['Forme générale du modèle dynamique d\'un robot ?', 'M(q)·q̈ + C(q, q̇)·q̇ + G(q) = τ.'], ['Lagrangien ?', 'L = T − V (énergie cinétique moins énergie potentielle).'], ['Pourquoi utiliser Lagrange plutôt que Newton pour un bras ?', 'On travaille avec les énergies, sans écrire les forces internes entre segments.'], ['Que vaut le couple de gravité d\'un bras vertical ?', 'Zéro : les cosinus s\'annulent.']],
    },
    {
      id: 'commande-dyn', title: 'Commander avec le modèle', sub: 'Compensation de gravité et couple calculé', min: 30, level: 3,
      why: `Un PID ignore la physique du robot. Dès que la charge change ou que le robot va vite, il devient imprécis ou instable. Les robots rapides et précis utilisent leur modèle dynamique pour anticiper.`,
      objectives: ['Comprendre l\'erreur statique due à la gravité', 'Ajouter une compensation de gravité', 'Comprendre le principe du couple calculé', 'Mesurer la sensibilité à une erreur de modèle'],
      blocks: [
        P(`<p>Avec un régulateur PD, le moteur ne produit un couple que s'il y a une erreur. Or il faut un couple permanent pour tenir une charge contre la gravité. Résultat : le bras s'arrête toujours un peu en dessous de la consigne. C'est l'<strong>erreur statique</strong>.</p>`),
        F('τ = K<sub>p</sub>·(q<sub>d</sub> − q) − K<sub>d</sub>·q̇ + Ĝ(q)', 'PD avec compensation de gravité : Ĝ est la gravité calculée par le modèle'),
        P(`<p>On peut aller plus loin et utiliser tout le modèle. Le <strong>couple calculé</strong> transforme le robot, compliqué et couplé, en une série de systèmes simples et indépendants :</p>`),
        F('τ = M̂(q)·v + Ĉ(q, q̇)·q̇ + Ĝ(q) &nbsp;&nbsp; avec &nbsp;&nbsp; v = K<sub>p</sub>·(q<sub>d</sub> − q) − K<sub>d</sub>·q̇', 'si le modèle est parfait, chaque articulation se comporte comme une masse unité : q̈ = v'),
        Sim('armdyn'),
        Pipe('Ce qui se passe à chaque milliseconde dans le contrôleur', [
          ['Mesure', 'Les codeurs donnent q, la dérivation filtrée donne q̇.', 'q = (0,88 ; −0,58) rad', 'Une vitesse trop bruitée rend le terme K<sub>d</sub> nerveux : on filtre, ou on utilise un observateur.'],
          ['Consigne', 'Le planificateur fournit q<sub>d</sub> (et parfois q̇<sub>d</sub>, q̈<sub>d</sub>).', 'q<sub>d</sub> = (0,9 ; −0,6)', null],
          ['Modèle', 'Le calculateur évalue M̂, Ĉ et Ĝ pour la posture actuelle.', 'Ĝ = (21,4 ; 4,3) N·m', 'Pour six axes, des algorithmes récursifs (Newton-Euler) font ce calcul en quelques microsecondes.'],
          ['Loi de commande', 'τ = M̂·v + Ĉ·q̇ + Ĝ.', 'τ = (22,1 ; 4,0) N·m', null],
          ['Saturation', 'Le couple est limité à ce que le moteur peut donner.', '|τ| ≤ 60 N·m', 'Si le couple sature souvent, le modèle « parfait » ne sert plus : il faut ralentir la trajectoire.'],
          ['Moteur', 'Le variateur transforme le couple voulu en courant.', 'I = τ / (k<sub>t</sub>·N)', 'Boucle de courant à 10–20 kHz dans le variateur.'],
        ]),
        Defi('defi-armdyn', 'Tenir la charge', `Avec 3 kg dans la pince, sur Terre et avec K<sub>p</sub> ≤ 150, obtiens une erreur moyenne en fin de mouvement inférieure à 0,5°. Ensuite, laisse la charge à 3 kg mais dis au contrôleur qu'il n'y en a que 1 : observe ce qui arrive au couple calculé.`, 'armdyn', { goal: true }),
        Warn(`Le couple calculé est spectaculaire avec un modèle juste, et dangereux avec un modèle faux : si la charge réelle est plus lourde que prévu, il peut faire pire qu'un simple PD. En pratique on ajoute une action intégrale, une estimation en ligne de la charge, ou une commande robuste.`, 'Un modèle faux coûte cher'),
        Future(`Les robots humanoïdes et les quadrupèdes récents combinent un modèle dynamique simplifié, une commande prédictive qui regarde une seconde en avant, et des réseaux de neurones entraînés en simulation pour corriger ce que le modèle ignore. La frontière entre modèle physique et apprentissage s'efface.`),
        Q('q1', 'Pourquoi un PD seul laisse-t-il une erreur permanente sur un bras soumis à la gravité ?', ['Parce que le moteur est trop faible', 'Parce que le couple n\'existe que s\'il y a une erreur, et qu\'il faut un couple permanent pour tenir le bras', 'Parce que K<sub>d</sub> est trop grand', 'Parce que le bras est trop rapide'], 1, 'À l\'équilibre, K<sub>p</sub>·erreur = couple de gravité : l\'erreur ne peut pas être nulle.'),
        Q('q2', 'Le couple calculé suppose que le contrôleur connaît la charge. Que se passe-t-il si on se trompe de 2 kg ?', ['Rien, il s\'adapte', 'Le bras compense mal la gravité et l\'inertie : erreur importante, voire pire qu\'un PD', 'Le moteur s\'arrête', 'Le bras devient plus rapide'], 1, 'Toute la commande repose sur le modèle. L\'erreur de modèle devient une perturbation que la petite boucle PD doit rattraper.'),
      ],
      cards: [['Loi PD avec compensation de gravité ?', 'τ = Kp·e − Kd·q̇ + Ĝ(q).'], ['Principe du couple calculé ?', 'Utiliser M̂, Ĉ, Ĝ pour annuler la dynamique : chaque axe devient q̈ = v.'], ['Faiblesse du couple calculé ?', 'Sensible aux erreurs de modèle (charge inconnue, frottements).']],
    },
  ],
};

export const equilibre = {
  id: 'equilibre', phase: 'frontieres', icon: '🦿', title: 'Équilibre et robots à pattes',
  desc: 'Tenir debout, marcher, encaisser une poussée : pendule inversé, LQR, polygone de sustentation, ZMP.',
  master: 'Robotique à pattes et commande optimale',
  intro: `Un robot à pattes est en chute permanente, rattrapée à chaque pas. Comprendre l'équilibre, c'est comprendre les humanoïdes, les quadrupèdes d'inspection et même les exosquelettes.`,
  lessons: [
    {
      id: 'pendule', title: 'Le pendule inversé et le LQR', sub: 'La commande par retour d\'état optimale', min: 35, level: 3,
      why: `Le pendule inversé est le modèle de base de la marche, des gyropodes et des fusées réutilisables qui se posent debout. Le LQR est l'outil qui le stabilise avec des gains calculés et non devinés.`,
      objectives: ['Comprendre pourquoi un système instable ne se règle pas avec un PID sur une seule variable', 'Écrire un état complet x, ẋ, θ, θ̇', 'Comprendre le compromis Q / R du LQR', 'Relier le pendule à la marche et aux fusées'],
      blocks: [
        P(`<p>Mets un balai debout sur ta paume : pour le garder droit, tu déplaces la main <em>sous</em> le balai, du côté où il tombe. C'est un <strong>pendule inversé</strong>. Livré à lui-même, il tombe : le système est <strong>instable</strong>.</p>`),
        P(`<p>On décrit son état par quatre nombres : position du chariot x, sa vitesse ẋ, angle θ de la tige, vitesse angulaire θ̇. Une commande par <strong>retour d'état</strong> calcule la force à partir des quatre à la fois :</p>`),
        F('F = −(k<sub>1</sub>·x + k<sub>2</sub>·ẋ + k<sub>3</sub>·θ + k<sub>4</sub>·θ̇) = −K·x', 'K est un vecteur ligne de quatre gains'),
        P(`<p>Comment choisir K ? Le <strong>LQR</strong> (régulateur linéaire quadratique) le calcule pour minimiser un coût qui additionne les écarts d'état et l'effort :</p>`),
        F('J = ∫ (xᵀ·Q·x + R·F²) dt', 'Q : ce qui t\'importe dans l\'état, R : le prix de l\'effort'),
        Table(['Tu augmentes…', 'Le robot…'], [
          ['le poids sur l\'angle (Q)', 'garde la tige très droite, quitte à bouger beaucoup le chariot'],
          ['le poids sur la position (Q)', 'revient vite au centre du rail'],
          ['le coût de l\'effort (R)', 'utilise moins de force : plus doux, mais plus lent à rattraper'],
        ]),
        Sim('cartpole'),
        Defi('defi-cartpole', 'L\'équilibriste', `Tiens 25 secondes malgré une poussée automatique toutes les 5 secondes, sans sortir du rail. Commence par le PID pour comprendre pourquoi il échoue, puis règle le LQR.`, 'cartpole', { goal: true }),
        Real(`Les premiers étages de fusée qui reviennent se poser debout résolvent un problème de pendule inversé en 3D, avec en plus une masse qui change à chaque seconde puisque le carburant brûle. Leur guidage combine retour d'état et optimisation de trajectoire calculée en temps réel.`),
        Q('q1', 'Pourquoi un PID sur l\'angle seul laisse-t-il le chariot partir au bout du rail ?', ['Parce que le PID est trop lent', 'Parce qu\'il ne voit pas la position du chariot : rien ne le ramène au centre', 'Parce que la tige est trop lourde', 'Parce que le rail est trop court'], 1, 'Une variable non mesurée par la commande peut dériver librement. Le retour d\'état utilise tout l\'état.'),
        Think('t1', `Un gyropode (deux roues côte à côte, une personne debout dessus) est un pendule inversé. La personne se penche en avant pour accélérer. Explique, avec les idées de cette leçon, ce que fait la commande du gyropode à ce moment-là.`, `La personne déplace son centre de masse vers l'avant : l'angle θ devient positif. Pour ne pas la laisser tomber, la commande pousse les roues vers l'avant, sous le centre de masse, comme ta main sous le balai. Tant que la personne reste penchée, les roues doivent continuer d'accélérer : se pencher revient donc à demander de la vitesse. Le poids sur la vitesse dans le coût règle à quel point le gyropode « résiste ».`),
      ],
      cards: [['Pourquoi le pendule inversé est-il instable ?', 'Le moindre écart d\'angle crée un couple de gravité qui l\'augmente.'], ['Que minimise le LQR ?', 'J = ∫(xᵀQx + R·u²)dt : écarts d\'état pondérés plus effort.'], ['Effet d\'un R plus grand ?', 'Commande plus douce, moins d\'effort, réponse plus lente.']],
    },
    {
      id: 'marche', title: 'Marcher sans tomber', sub: 'Polygone de sustentation, ZMP et allures', min: 30, level: 3,
      why: `Les robots à pattes sortent des laboratoires : inspection d'usines, de mines, de chantiers. Leur conception repose sur quelques idées géométriques simples à comprendre et difficiles à appliquer.`,
      objectives: ['Définir le polygone de sustentation', 'Distinguer marche statique et marche dynamique', 'Comprendre le principe du ZMP', 'Tester si un point est dans un polygone convexe'],
      blocks: [
        P(`<p>Le <strong>polygone de sustentation</strong> est la surface délimitée par les points de contact avec le sol. Pour une table à quatre pieds, c'est le rectangle des pieds. Tant que la verticale du centre de masse tombe dedans, un objet <em>immobile</em> ne bascule pas.</p>`),
        Table(['Type de marche', 'Principe', 'Exemples'], [
          ['Statique', 'le centre de masse reste toujours au-dessus du polygone : on peut s\'arrêter à tout instant', 'hexapodes lents, robots qui gardent trois pattes au sol'],
          ['Dynamique', 'le robot est déséquilibré entre deux appuis et se rattrape au pas suivant', 'humains, quadrupèdes rapides, humanoïdes'],
        ]),
        P(`<p>Quand le robot bouge, les accélérations comptent autant que la gravité. On utilise alors le <strong>ZMP</strong> (point de moment nul) : le point du sol où l'effet combiné du poids et des forces d'inertie ne fait pas basculer le pied. Règle de base : le ZMP doit rester dans le polygone de sustentation.</p>`),
        F('x<sub>ZMP</sub> = x<sub>G</sub> − (z<sub>G</sub> / g) · ẍ<sub>G</sub>', 'modèle du pendule inversé linéaire : centre de masse à hauteur constante z<sub>G</sub>'),
        Exo('e1', 'Un robot a son centre de masse à 0,8 m de hauteur, juste au-dessus de x<sub>G</sub> = 0. Il accélère vers l\'avant à 2 m/s². Où est le ZMP (g = 9,81) ?', { answer: -0.163, unit: 'm', tol: 0.003, sol: 'x<sub>ZMP</sub> = 0 − 0,8 / 9,81 × 2 = <b>−0,163 m</b> : le ZMP recule. Si le talon est à moins de 16 cm derrière le centre de masse, le robot bascule en arrière.' }),
        Exo('e2', 'Même robot, mais sur Mars (g = 3,71). Où est le ZMP pour la même accélération ?', { answer: -0.431, unit: 'm', tol: 0.005, sol: '0,8 / 3,71 × 2 = <b>−0,431 m</b>. Avec une gravité faible, la même accélération déplace beaucoup plus le ZMP : un robot martien doit accélérer plus doucement ou avoir de plus grands pieds.' }),
        Code('c1', 'Écris <code>dansPolygone(p, poly)</code> : <code>p = [x, y]</code>, <code>poly</code> une liste de sommets d\'un polygone convexe donnés dans le sens inverse des aiguilles d\'une montre. Renvoie <code>true</code> si p est à l\'intérieur ou sur le bord. Indice : p est à gauche de chaque arête si le produit vectoriel (B − A) × (p − A) est positif ou nul.', {
          fn: 'dansPolygone',
          starter: 'function dansPolygone(p, poly) {\n  for (let i = 0; i < poly.length; i++) {\n    const A = poly[i], B = poly[(i + 1) % poly.length];\n    // produit vectoriel (B - A) x (p - A)\n  }\n  return true;\n}',
          tests: [[[[0.5, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]], true], [[[1.5, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]], false], [[[0.4, 0.7], [[0, 0], [1, 0], [0, 1]]], false], [[[0.2, 0.7], [[0, 0], [1, 0], [0, 1]]], true], [[[1, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]], true], [[[0.1, -0.01], [[0, 0], [1, 0], [0.5, 1]]], false]],
          sol: 'function dansPolygone(p, poly) {\n  for (let i = 0; i < poly.length; i++) {\n    const A = poly[i], B = poly[(i + 1) % poly.length];\n    const c = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]);\n    if (c < 0) return false;\n  }\n  return true;\n}',
        }),
        Info(`Les animaux ne calculent pas de ZMP. Leur moelle épinière contient des réseaux de neurones qui produisent des rythmes de marche tout seuls, les <strong>générateurs centraux de rythme</strong>. Des chercheurs les imitent avec des oscillateurs couplés : la salamandre robot de l'EPFL passe de la nage à la marche en changeant un seul paramètre.`, 'La nature a une autre solution'),
        Future(`Les quadrupèdes actuels apprennent à marcher en simulation, des milliers d'années de marche virtuelle condensées en quelques heures de calcul, puis transfèrent ce savoir au robot réel. La difficulté est le « fossé simulation-réalité » : frottements, retards et souplesses que le simulateur ignore.`),
        Q('q1', 'Pourquoi un hexapode peut-il marcher de façon statique alors qu\'un bipède en est presque incapable ?', ['Parce qu\'il est plus léger', 'Parce qu\'en gardant trois pattes au sol, il a toujours un triangle d\'appui sous son centre de masse', 'Parce qu\'il a plus de moteurs', 'Ce n\'est pas vrai'], 1, 'L\'allure en trépied garde en permanence un polygone de sustentation large. Un bipède sur un pied n\'a qu\'une petite semelle.'),
        Think('t1', `Tu conçois un robot à pattes pour inspecter des galeries de mine inondées et encombrées de blocs. Statique ou dynamique ? Combien de pattes ? Défends ton choix avec au moins trois critères (sécurité, vitesse, énergie, complexité, réparation).`, `Pas de réponse unique. Un hexapode en marche statique est lent mais peut s'arrêter n'importe quand sur un sol instable et continue de marcher avec une patte cassée : précieux loin de tout atelier. Un quadrupède dynamique va plus vite, franchit mieux les blocs, mais demande une commande plus complexe et tombe plus durement. L'important est de justifier le choix par les contraintes réelles du lieu.`),
      ],
      cards: [['Polygone de sustentation ?', 'Surface délimitée par les points de contact au sol.'], ['Condition de non-basculement avec mouvement ?', 'Le ZMP reste dans le polygone de sustentation.'], ['Formule du ZMP (pendule linéaire) ?', 'x_ZMP = x_G − (z_G/g)·ẍ_G.'], ['Marche statique ?', 'Le centre de masse reste au-dessus du polygone à tout instant.']],
    },
  ],
};

export const drones = {
  id: 'drones', phase: 'frontieres', icon: '🚁', title: 'Drones et robots volants',
  desc: 'Poussée, commande en cascade, autonomie : de la livraison de médicaments à l\'hélicoptère martien.',
  master: 'Robotique aérienne',
  intro: `Un drone est un robot qui ne peut jamais s'arrêter de travailler : s'il cesse de se commander, il tombe. C'est un concentré de mécanique, d'électronique de puissance, de capteurs et d'automatique.`,
  lessons: [
    {
      id: 'vol', title: 'Comment tient un multirotor', sub: 'Poussée, attitude et commande en cascade', min: 30, level: 2,
      why: `Les drones transportent déjà des poches de sang, inspectent des lignes électriques et cartographient des mines. Comprendre leur physique permet de les dimensionner et de les réparer, pas seulement de les piloter.`,
      objectives: ['Relier poussée, densité de l\'air, vitesse et diamètre des hélices', 'Comprendre le rapport poussée/poids', 'Comprendre la commande en cascade position → attitude → moteurs', 'Calculer la vitesse de rotation pour le vol stationnaire'],
      blocks: [
        P(`<p>Une hélice accélère de l'air vers le bas : par réaction, l'air la pousse vers le haut. Un modèle simple et très utilisé :</p>`),
        F('T = C<sub>T</sub> · ρ · n² · D⁴', 'T : poussée (N), ρ : densité de l\'air, n : tours par seconde, D : diamètre (m), C<sub>T</sub> : coefficient de l\'hélice (≈ 0,1)'),
        Tip(`Le diamètre est à la puissance 4 : doubler la taille de l'hélice multiplie la poussée par 16 à la même vitesse. C'est pourquoi les drones lourds ont de grandes hélices qui tournent lentement, et les petits drones de course de petites hélices qui tournent très vite.`, 'Lire la formule'),
        P(`<p>Un drone n'a pas de gouvernail. Pour avancer, il <strong>s'incline</strong> : la poussée, penchée, a une composante horizontale. D'où une commande en <strong>cascade</strong>, trois boucles imbriquées, de la plus lente à la plus rapide :</p>`),
        Pipe('La cascade de commande d\'un drone', [
          ['Position (≈ 10–50 Hz)', 'L\'écart de position devient une accélération voulue, donc une inclinaison voulue.', 'cible 1 m à droite → pencher de 8°', 'Le GPS, la vision ou un système de capture de mouvement fournissent la position.'],
          ['Attitude (≈ 100–500 Hz)', 'L\'écart d\'inclinaison devient une vitesse de rotation voulue.', 'pencher de 8° → tourner à 40°/s', 'L\'IMU (gyroscopes et accéléromètres) fusionnés par un filtre donnent l\'attitude.'],
          ['Vitesse angulaire (≈ 1–8 kHz)', 'L\'écart de vitesse de rotation devient une différence de poussée entre moteurs.', 'moteur droit −6 %, gauche +6 %', 'C\'est la boucle la plus rapide : le gyroscope est lu des milliers de fois par seconde.'],
          ['Mixage et moteurs', 'Les commandes sont réparties sur les quatre moteurs via leurs variateurs.', 'PWM ou protocole numérique vers chaque variateur', 'Un moteur qui tourne dans un sens produit un couple de réaction : les hélices tournent en sens alternés pour l\'annuler.'],
        ]),
        Sim('quadrotor'),
        Code('c1', 'Écris <code>tpmStationnaire(m, g, rho, D, nRotors, CT)</code> qui renvoie la vitesse de rotation (en tours par minute) pour que les nRotors hélices compensent juste le poids m·g.', {
          fn: 'tpmStationnaire',
          starter: 'function tpmStationnaire(m, g, rho, D, nRotors, CT) {\n  // poussée par rotor = m*g / nRotors = CT * rho * n^2 * D^4, avec n en tours par seconde\n  return 0;\n}',
          tests: [[[1.5, 9.81, 1.225, 0.25, 4, 0.1], 5260.82], [[1.8, 3.71, 0.017, 1.2, 2, 0.1], 1846.6], [[25, 9.81, 1.225, 0.8, 8, 0.1], 1483.07]],
          sol: 'function tpmStationnaire(m, g, rho, D, nRotors, CT) {\n  const T = m * g / nRotors;\n  return 60 * Math.sqrt(T / (CT * rho * Math.pow(D, 4)));\n}',
        }),
        Exo('e1', 'Un drone de 1,5 kg a quatre moteurs qui peuvent chacun pousser 7 N au maximum. Rapport poussée/poids sur Terre ?', { answer: 1.903, tol: 0.01, sol: '4 × 7 / (1,5 × 9,81) = 28 / 14,7 = <b>1,90</b>. En dessous de 1,5 environ, le drone manque de réserve pour manœuvrer et résister au vent.' }),
        Real(`Au Rwanda puis au Ghana, des drones à voilure fixe livrent depuis 2016 du sang et des médicaments à des centres de santé isolés, en larguant un colis sous parachute. Le choix de l'aile plutôt que des rotors n'est pas esthétique : une aile vole bien plus loin avec la même batterie.`),
        Q('q1', 'Pourquoi un multirotor doit-il s\'incliner pour avancer ?', ['Pour réduire la traînée', 'Parce que la poussée est toujours perpendiculaire aux hélices : l\'incliner crée une composante horizontale', 'Pour économiser la batterie', 'Pour voir devant lui'], 1, 'Sans gouvernail ni hélice horizontale, la seule façon de produire une force horizontale est d\'incliner la poussée.'),
      ],
      cards: [['Poussée d\'une hélice ?', 'T = C_T·ρ·n²·D⁴.'], ['Ordre des boucles d\'un drone ?', 'Position (lente) → attitude → vitesse angulaire (rapide) → moteurs.'], ['Pourquoi les hélices tournent-elles en sens alternés ?', 'Pour annuler les couples de réaction et contrôler le lacet.']],
    },
    {
      id: 'autonomie-vol', title: 'Voler loin', sub: 'Énergie, aile ou rotors, et choix de conception', min: 25, level: 2,
      why: `La batterie est la limite numéro un d'un drone. Savoir estimer une autonomie avant de construire évite des mois de travail sur un appareil qui ne peut pas faire la mission.`,
      objectives: ['Estimer la puissance de vol d\'une aile', 'Calculer une autonomie et une portée', 'Comparer voilure fixe et multirotor', 'Mener un compromis de conception chiffré'],
      blocks: [
        P(`<p>Une aile porte grâce à sa vitesse. Sa qualité se mesure par la <strong>finesse</strong> L/D, le rapport portance sur traînée : un planeur dépasse 40, un petit drone à aile tourne autour de 10 à 15. Puissance nécessaire en croisière :</p>`),
        F('P = m · g · v / (f · η)', 'f : finesse, η : rendement hélice + moteur (≈ 0,5 à 0,7), v : vitesse de croisière'),
        F('portée ≈ E<sub>utile</sub> / P × v', 'E<sub>utile</sub> : énergie de batterie réellement utilisable (on garde une réserve)'),
        Calc('calc-drone', 'Livrer un centre de santé à 60 km', `Tu dois concevoir un drone à aile qui livre 1,8 kg de médicaments à 60 km et revient, avec 20 % d'énergie de réserve à l'arrivée. Hypothèses : finesse 10, rendement 0,6, vitesse 25 m/s, batteries à 200 Wh/kg dont 80 % utilisables, masse totale au décollage limitée à 25 kg.`, [
          { k: 'struct', label: 'Masse de la cellule (ailes, moteur, électronique)', min: 3, max: 15, step: 0.5, value: 6, unit: 'kg' },
          { k: 'bat', label: 'Énergie embarquée', min: 100, max: 2500, step: 50, value: 400, unit: 'Wh' },
          { k: 'v', label: 'Vitesse de croisière', min: 15, max: 40, step: 1, value: 25, unit: 'm/s' },
        ], ({ struct, bat, v }) => {
          const mb = bat / 200, m = struct + mb + 1.8;
          const drag = v / 25; // la finesse se dégrade loin de la vitesse optimale
          const f = 10 / (0.5 * (drag + 1 / drag));
          const P = m * 9.81 * v / (f * 0.6);
          const range = bat * 0.8 * 0.8 * 3600 / P * v / 1000;
          const minStruct = 3 + bat / 400;
          return {
            outputs: [['Masse au décollage', m, 'kg'], ['Masse de batterie', mb, 'kg'], ['Finesse à cette vitesse', f, ''], ['Puissance en croisière', P, 'W'], ['Portée avec réserve de 20 %', range, 'km'], ['Durée aller-retour', 120000 / v / 60, 'min']],
            checks: [['Aller-retour de 120 km avec réserve', range >= 120], ['Masse au décollage ≤ 25 kg', m <= 25], [`Cellule assez solide pour porter la batterie (≥ ${(3 + bat / 400).toFixed(1).replace('.', ',')} kg)`, struct >= minStruct]],
          };
        }, { okText: 'Ton drone tient la mission. Remarque : la meilleure portée n\'est pas à la vitesse maximale, mais près de la vitesse de finesse maximale.' }),
        Think('t1', `Pour la même mission, un collègue propose un quadrirotor « parce que c'est plus simple ». Donne deux arguments pour et deux contre, puis propose une solution qui combine les avantages des deux.`, `Pour le multirotor : décollage et atterrissage vertical sans piste, vol stationnaire pour déposer le colis précisément, mécanique simple. Contre : il dépense de l'énergie juste pour se porter, d'où une portée souvent trois à cinq fois plus faible, et il est plus sensible au vent en croisière. Solution hybride : un appareil à décollage vertical qui bascule en vol d'avion (rotors de sustentation plus hélice de propulsion), ou une aile avec largage du colis sous parachute.`),
        Q('q1', 'Pourquoi la portée maximale ne s\'obtient-elle pas à la vitesse maximale ?', ['Parce que le moteur chauffe', 'Parce que la traînée augmente fortement avec la vitesse : la finesse se dégrade', 'Parce que la batterie se vide plus lentement', 'Elle s\'obtient à la vitesse maximale'], 1, 'Trop lent, l\'aile porte mal ; trop vite, la traînée explose. Le meilleur compromis est près de la finesse maximale.'),
      ],
      cards: [['Finesse ?', 'Rapport portance / traînée d\'un appareil (L/D).'], ['Puissance de croisière d\'une aile ?', 'P = m·g·v / (f·η).'], ['Avantage principal de la voilure fixe ?', 'Portée bien plus grande à énergie égale.']],
    },
  ],
};

export const essaims = {
  id: 'essaims', phase: 'frontieres', icon: '🐝', title: 'Essaims et multi-robots',
  desc: 'Plusieurs robots valent mieux qu\'un, à condition de savoir les coordonner : consensus, enchères, exploration.',
  master: 'Systèmes multi-agents',
  intro: `Une colonie de fourmis n'a pas de chef, et pourtant elle construit, cherche et transporte. Les essaims de robots s'en inspirent pour explorer des zones dangereuses, surveiller de grandes surfaces ou construire ensemble.`,
  lessons: [
    {
      id: 'multi', title: 'Coordonner une équipe de robots', sub: 'Centralisé ou distribué, consensus et enchères', min: 35, level: 3,
      why: `Entrepôts, agriculture, exploration souterraine ou spatiale : de plus en plus de missions sont confiées à des flottes. Leur efficacité dépend moins de chaque robot que de la façon dont ils se répartissent le travail.`,
      objectives: ['Comparer architectures centralisée et distribuée', 'Comprendre l\'algorithme de consensus', 'Répartir des tâches par enchères', 'Mesurer l\'effet de la coordination sur une exploration'],
      blocks: [
        Table(['Architecture', 'Principe', 'Forces', 'Faiblesses'], [
          ['Centralisée', 'un ordinateur central voit tout et décide pour tous', 'solutions optimales, simple à raisonner', 'point unique de panne, communication permanente nécessaire'],
          ['Distribuée', 'chaque robot décide avec ce que ses voisins lui disent', 'robuste, passe à l\'échelle, tolère les pertes', 'solutions moins optimales, comportement global plus dur à prévoir'],
          ['Hybride', 'un plan global grossier, des décisions locales fines', 'le meilleur des deux', 'plus complexe à concevoir'],
        ]),
        H('Se mettre d\'accord sans chef : le consensus'),
        P(`<p>Chaque robot a une valeur (une estimation de température, un cap, une position de rendez-vous). À chaque étape, il se rapproche un peu de la moyenne de ses voisins. Si le réseau de communication est connexe, tous convergent vers la même valeur, sans aucun chef.</p>`),
        F('x<sub>i</sub> ← x<sub>i</sub> + ε · Σ<sub>j voisin de i</sub> (x<sub>j</sub> − x<sub>i</sub>)', 'ε petit (plus petit que 1 / nombre max de voisins) pour rester stable'),
        Code('c1', 'Écris <code>consensus(x, voisins, eps)</code> qui fait <b>une</b> itération. <code>x</code> est le tableau des valeurs, <code>voisins[i]</code> la liste des indices voisins du robot i. Toutes les mises à jour utilisent les anciennes valeurs. Renvoie le nouveau tableau.', {
          fn: 'consensus',
          starter: 'function consensus(x, voisins, eps) {\n  // attention : calcule toutes les nouvelles valeurs à partir de l\'ancien x\n  return x.slice();\n}',
          tests: [[[[0, 10], [[1], [0]], 0.25], [2.5, 7.5]], [[[0, 3, 6], [[1], [0, 2], [1]], 0.3], [0.9, 3, 5.1]], [[[4, 4, 4], [[1, 2], [0, 2], [0, 1]], 0.2], [4, 4, 4]], [[[1, 2, 3, 10], [[1], [0, 2], [1, 3], [2]], 0.1], [1.1, 2, 3.6, 9.3]]],
          sol: 'function consensus(x, voisins, eps) {\n  return x.map((xi, i) => xi + eps * voisins[i].reduce((s, j) => s + x[j] - xi, 0));\n}',
        }),
        H('Se répartir les tâches : les enchères'),
        P(`<p>Chaque tâche est « mise aux enchères » : les robots proposent un coût (la distance à parcourir, l'énergie nécessaire), le moins cher l'emporte. Les enchères donnent des résultats proches de l'optimum avec très peu de communication, ce qui les rend populaires dans les entrepôts et pour les essaims de drones.</p>`),
        Code('c2', 'Écris <code>encheres(robots, taches)</code> : version simple en un tour. Pour chaque tâche, dans l\'ordre, le robot <b>libre</b> le plus proche (distance euclidienne) la remporte et n\'est plus libre. Renvoie le tableau des indices de robots, un par tâche (−1 s\'il ne reste aucun robot libre).', {
          fn: 'encheres',
          starter: 'function encheres(robots, taches) {\n  const libre = robots.map(() => true);\n  return taches.map(t => {\n    let best = -1, bestD = Infinity;\n    // parcourir les robots libres\n    return best;\n  });\n}',
          tests: [[[[[0, 0], [10, 0]], [[9, 1], [1, 1]]], [1, 0]], [[[[0, 0], [10, 0]], [[1, 0], [2, 0], [3, 0]]], [0, 1, -1]], [[[[0, 0], [5, 5], [9, 9]], [[8, 8], [6, 6], [0, 1]]], [2, 1, 0]]],
          sol: 'function encheres(robots, taches) {\n  const libre = robots.map(() => true);\n  return taches.map(t => {\n    let best = -1, bestD = Infinity;\n    robots.forEach((r, i) => {\n      if (!libre[i]) return;\n      const d = Math.hypot(r[0] - t[0], r[1] - t[1]);\n      if (d < bestD) { bestD = d; best = i; }\n    });\n    if (best >= 0) libre[best] = false;\n    return best;\n  });\n}',
        }),
        Warn(`Cette version « au premier qui demande » n'est pas optimale : la première tâche prend le robot le plus proche, même si ce robot aurait été bien plus utile pour la suivante. Les vraies méthodes refont des tours d'enchères ou utilisent l'algorithme hongrois quand un ordinateur central est disponible.`),
        Sim('swarm'),
        Defi('defi-swarm', 'Cartographes des profondeurs', `Cartographie 90 % de la grotte en moins de 120 pas, avec 5 robots au plus et des capteurs de portée 2. Compare les trois stratégies et note ce que tu observes.`, 'swarm', { goal: true }),
        Future(`Des projets de recherche étudient des essaims de petits robots pour explorer les tubes de lave de la Lune et de Mars, où aucune liaison radio directe avec la surface n'est possible : les robots eux-mêmes forment une chaîne de relais.`),
        Q('q1', 'Pourquoi ajouter des robots n\'accélère-t-il pas toujours l\'exploration ?', ['Parce qu\'ils consomment trop', 'Parce que sans coordination, ils visent les mêmes zones et se gênent', 'Parce que les capteurs interfèrent toujours', 'Ça l\'accélère toujours'], 1, 'Le gain dépend de la répartition du travail. Sans coordination, des robots supplémentaires refont le même chemin.'),
      ],
      cards: [['Mise à jour de consensus ?', 'x_i ← x_i + ε·Σ(x_j − x_i) sur les voisins.'], ['Condition pour que le consensus converge ?', 'Graphe de communication connexe et ε assez petit.'], ['Principe d\'une enchère de tâches ?', 'Chaque robot propose un coût, le moins cher remporte la tâche.'], ['Point faible d\'une architecture centralisée ?', 'Point unique de panne et besoin de communication permanente.']],
    },
  ],
};

export const optimisation = {
  id: 'optimisation', phase: 'frontieres', icon: '📉', title: 'Optimisation et commande prédictive',
  desc: 'Trouver le meilleur et non seulement le correct : descente de gradient, contraintes, MPC.',
  master: 'Optimisation pour la robotique',
  intro: `Derrière l'apprentissage des réseaux de neurones, la planification de trajectoires, l'étalonnage des caméras et la commande des robots à pattes, il y a le même outil : l'optimisation. C'est le langage commun de la robotique moderne.`,
  lessons: [
    {
      id: 'optim', title: 'Chercher le meilleur', sub: 'Coût, gradient, contraintes', min: 30, level: 3,
      why: `Dès qu'il y a un compromis (énergie contre vitesse, précision contre douceur), il faut un critère et une méthode pour le minimiser. C'est la façon d'écrire « je veux le meilleur » en mathématiques.`,
      objectives: ['Écrire un problème d\'optimisation : variables, coût, contraintes', 'Appliquer la descente de gradient', 'Comprendre l\'effet du pas', 'Reconnaître les minimums locaux'],
      blocks: [
        P(`<p>Un problème d'optimisation a trois ingrédients : des <strong>variables</strong> que l'on peut choisir, un <strong>coût</strong> à minimiser, des <strong>contraintes</strong> à respecter.</p>`),
        Table(['Problème robotique', 'Variables', 'Coût', 'Contraintes'], [
          ['Trajectoire d\'un bras', 'positions à chaque instant', 'durée + effort', 'limites des moteurs, obstacles'],
          ['Étalonnage d\'une caméra', 'focale, centre, distorsion', 'erreur de reprojection', 'aucune ou presque'],
          ['Apprentissage d\'un réseau', 'poids', 'erreur sur les exemples', 'aucune'],
          ['Dimensionnement d\'un rover', 'tailles, batterie, moteurs', 'masse ou coût', 'mission réalisable'],
        ]),
        H('La descente de gradient'),
        P(`<p>Imagine que tu es dans le brouillard sur une colline et que tu veux descendre. Tu sens la pente sous tes pieds et tu fais un pas dans la direction qui descend le plus. Le <strong>gradient</strong> ∇f indique la direction de plus forte montée ; on va dans le sens opposé :</p>`),
        F('x ← x − α · ∇f(x)', 'α : le pas (ou taux d\'apprentissage)'),
        Table(['Pas α', 'Comportement'], [['trop petit', 'converge, mais très lentement'], ['bien choisi', 'converge vite'], ['trop grand', 'oscille, voire diverge']]),
        Code('c1', 'On minimise f(x) = Σ a<sub>i</sub>·(x<sub>i</sub> − b<sub>i</sub>)², dont le gradient est 2·a<sub>i</sub>·(x<sub>i</sub> − b<sub>i</sub>). Écris <code>descente(a, b, x0, pas, n)</code> qui fait n pas de descente de gradient à partir de x0 (tableaux de même longueur) et renvoie le point final.', {
          fn: 'descente',
          starter: 'function descente(a, b, x0, pas, n) {\n  let x = x0.slice();\n  for (let k = 0; k < n; k++) {\n    // gradient : g[i] = 2 * a[i] * (x[i] - b[i])\n    // puis x[i] = x[i] - pas * g[i]\n  }\n  return x;\n}',
          tests: [[[[1], [3], [0], 0.25, 1], [1.5]], [[[1], [3], [0], 0.25, 20], [3]], [[[1, 4], [1, -2], [0, 0], 0.1, 1], [0.2, -1.6]], [[[1], [0], [1], 1.1, 3], [-1.728]]],
          sol: 'function descente(a, b, x0, pas, n) {\n  let x = x0.slice();\n  for (let k = 0; k < n; k++) {\n    x = x.map((v, i) => v - pas * 2 * a[i] * (v - b[i]));\n  }\n  return x;\n}',
        }),
        Exo('e1', 'Dans le dernier test ci-dessus (a = 1, b = 0, x<sub>0</sub> = 1, pas = 1,1), chaque pas multiplie x par un même facteur. Lequel ?', { answer: -1.2, tol: 0.001, sol: 'x ← x − 1,1 × 2x = −1,2·x. |−1,2| > 1 : à chaque pas on s\'éloigne davantage du minimum, en oscillant. Le pas est trop grand : il faut α < 1/a pour converger ici.' }),
        Warn(`La descente de gradient trouve un minimum <em>local</em> : le fond de la vallée où elle a commencé, pas forcément la vallée la plus profonde. On lance souvent plusieurs essais depuis des points différents, ou on choisit des formulations « convexes » qui n'ont qu'une seule vallée.`, 'Le piège des minimums locaux'),
        H('La commande prédictive (MPC)'),
        P(`<p>La commande prédictive résout un petit problème d'optimisation <strong>à chaque cycle</strong> : « quelle suite de commandes, sur les deux prochaines secondes, minimise mon coût tout en respectant les limites ? ». Elle applique seulement la première commande, puis recommence au cycle suivant avec les nouvelles mesures. C'est comme un joueur d'échecs qui recalcule à chaque coup.</p>`),
        Real(`Les quadrupèdes et humanoïdes récents, de nombreuses voitures autonomes et les premiers étages de fusée qui reviennent se poser utilisent des variantes de la commande prédictive. Elle est devenue possible en temps réel grâce aux processeurs embarqués et à des solveurs très optimisés.`),
        Q('q1', 'Pendant une descente de gradient, la valeur du coût oscille de plus en plus. Que faire en premier ?', ['Augmenter le pas', 'Diminuer le pas', 'Changer de coût', 'Ajouter des variables'], 1, 'Un pas trop grand fait sauter par-dessus le fond de la vallée, de plus en plus loin.'),
        Think('t1', `Un robot livreur doit choisir sa vitesse sur un trajet de 2 km. Écris un coût qui équilibre trois choses : arriver vite, économiser la batterie, rester sûr près des piétons. Quelles variables, quelles contraintes ?`, `Exemple : variables = vitesse sur chaque tronçon. Coût = a·(durée totale) + b·(énergie, qui croît avec le carré de la vitesse et les accélérations) + c·(somme des vitesses sur les tronçons proches de piétons). Contraintes : vitesse maximale légale, vitesse réduite dans les zones piétonnes, batterie suffisante à l'arrivée. Les poids a, b, c traduisent les priorités : les choisir est une décision d'ingénieur, pas un calcul.`),
      ],
      cards: [['Trois ingrédients d\'un problème d\'optimisation ?', 'Variables, coût, contraintes.'], ['Mise à jour de la descente de gradient ?', 'x ← x − α·∇f(x).'], ['Principe de la commande prédictive ?', 'Optimiser une suite de commandes sur un horizon, appliquer la première, recommencer.']],
    },
  ],
};

export const hri = {
  id: 'hri', phase: 'frontieres', icon: '🤝', title: 'Humains et robots',
  desc: 'Cobots, sécurité, confiance, acceptabilité : concevoir des robots qui travaillent avec les gens.',
  master: 'Interaction humain-robot',
  intro: `Un robot réussi techniquement peut échouer complètement s'il fait peur, s'il blesse ou si personne ne comprend ce qu'il va faire. L'interaction humain-robot est aussi une discipline d'ingénieur.`,
  lessons: [
    {
      id: 'cobots', title: 'Travailler côte à côte', sub: 'Cobots, distance de sécurité et lisibilité', min: 30, level: 2,
      why: `Les robots sortent des cages : ils travaillent avec des opérateurs, dans les hôpitaux, chez les gens. La sécurité n'y est plus une barrière physique mais une propriété de la conception et de la commande.`,
      objectives: ['Connaître les modes de collaboration des cobots', 'Calculer une distance de séparation simplifiée', 'Rendre les intentions d\'un robot lisibles', 'Identifier les enjeux éthiques'],
      blocks: [
        Table(['Mode de collaboration', 'Principe'], [
          ['Arrêt de sécurité surveillé', 'le robot s\'arrête quand l\'humain entre dans la zone, repart quand il sort'],
          ['Guidage à la main', 'l\'opérateur déplace le robot en le tenant, pour lui apprendre un geste'],
          ['Surveillance de vitesse et de séparation', 'le robot ralentit quand l\'humain s\'approche et s\'arrête avant le contact'],
          ['Limitation de puissance et de force', 'le robot est conçu pour qu\'un contact reste sous des seuils de douleur et de blessure'],
        ]),
        P(`<p>Pour la surveillance de vitesse et de séparation, la distance minimale à garder doit couvrir tout ce qui se passe entre la détection de l'humain et l'arrêt complet du robot. Version simplifiée :</p>`),
        F('S = v<sub>h</sub>·(T<sub>r</sub> + T<sub>s</sub>) + v<sub>r</sub>·T<sub>r</sub> + d<sub>f</sub> + C', 'v<sub>h</sub> : vitesse de l\'humain, v<sub>r</sub> : du robot, T<sub>r</sub> : temps de réaction du système, T<sub>s</sub> : temps d\'arrêt, d<sub>f</sub> : distance de freinage du robot, C : marge d\'incertitude des capteurs'),
        Code('c1', 'Écris <code>distanceSecurite(vh, vr, tr, ts, df, c)</code> qui renvoie S en mètres selon la formule simplifiée ci-dessus.', {
          fn: 'distanceSecurite',
          starter: 'function distanceSecurite(vh, vr, tr, ts, df, c) {\n  return 0;\n}',
          tests: [[[1.6, 1, 0.1, 0.3, 0.15, 0.1], 0.99], [[1.6, 0.25, 0.1, 0.1, 0.02, 0.1], 0.465], [[0, 0, 1, 1, 0, 0.2], 0.2]],
          sol: 'function distanceSecurite(vh, vr, tr, ts, df, c) {\n  return vh * (tr + ts) + vr * tr + df + c;\n}',
        }),
        Exo('e1', 'Un humain marche à 1,6 m/s. Le robot va à 1 m/s, réagit en 0,1 s, s\'arrête en 0,3 s sur 0,15 m. Marge capteurs : 0,1 m. Distance de séparation minimale ?', { answer: 0.99, unit: 'm', tol: 0.01, sol: 'S = 1,6 × 0,4 + 1 × 0,1 + 0,15 + 0,1 = <b>0,99 m</b>. En ralentissant le robot, on réduit T<sub>s</sub> et d<sub>f</sub> : le robot peut travailler plus près.' }),
        Info(`Les normes de sécurité des robots industriels (ISO 10218) et la spécification technique sur les cobots (ISO/TS 15066) donnent les méthodes officielles et les seuils de force et de pression par zone du corps. La formule de cette leçon en est une simplification pédagogique : un projet réel suit le texte de la norme.`, 'Ce que disent les normes'),
        H('Un robot lisible'),
        P(`<p>Les gens font confiance à un robot dont ils devinent les intentions. Un bras qui regarde (oriente sa « tête » ou sa pince) vers l'objet avant de le saisir, un robot mobile qui projette au sol la flèche de son trajet, une lumière qui change de couleur avant un mouvement : ces détails réduisent les accidents et le stress plus que bien des capteurs.</p>`),
        Danger(`Une erreur fréquente des concepteurs : tester uniquement avec des collègues qui connaissent le robot. Les vrais utilisateurs font des choses inattendues : un enfant qui court, une personne âgée qui s'appuie sur le robot, un opérateur fatigué en fin de nuit. Teste avec eux, tôt.`, 'Ne teste pas qu\'avec des ingénieurs'),
        Think('t1', `Un hôpital de Lubumbashi veut un robot qui livre les médicaments entre la pharmacie et les services, dans des couloirs fréquentés par des patients, des visiteurs et des enfants. Liste cinq choix de conception (vitesse, forme, signaux, comportement en cas de blocage, communication avec le personnel) et justifie chacun.`, `Exemples : vitesse limitée à celle d'une marche lente dans les couloirs ; forme arrondie, sans arête vive, hauteur visible ; signal lumineux et sonore doux avant de démarrer ou tourner ; en cas de blocage, s'arrêter, prévenir verbalement et attendre plutôt que forcer le passage ; tiroirs verrouillés ouverts seulement par un badge du personnel pour les médicaments sensibles. Bonus : penser aux coupures de courant et à la langue des messages (français, swahili).`),
        Q('q1', 'Pourquoi ralentir un cobot permet-il de travailler plus près d\'un humain ?', ['Parce qu\'il fait moins de bruit', 'Parce que le temps et la distance d\'arrêt diminuent, donc la distance de séparation aussi', 'Parce que les capteurs voient mieux', 'Ce n\'est pas vrai'], 1, 'Les termes v<sub>r</sub>·T<sub>r</sub>, T<sub>s</sub> et d<sub>f</sub> diminuent tous avec la vitesse du robot.'),
      ],
      cards: [['Quatre modes de collaboration d\'un cobot ?', 'Arrêt surveillé, guidage manuel, surveillance vitesse/séparation, limitation de puissance et force.'], ['Normes de référence pour les cobots ?', 'ISO 10218 et ISO/TS 15066.'], ['Qu\'est-ce qu\'un robot lisible ?', 'Un robot dont les intentions sont devinables avant qu\'il agisse.']],
    },
  ],
};

export const molle = {
  id: 'molle', phase: 'frontieres', icon: '🐙', title: 'Robotique molle et bio-inspirée',
  desc: 'Des robots souples comme une pieuvre, qui s\'adaptent par leur forme plutôt que par le calcul.',
  master: 'Robotique bio-inspirée',
  intro: `Les robots classiques sont rigides et précis. La nature, elle, est souple, tolérante et économe. La robotique molle et bio-inspirée ouvre des usages impossibles aux machines rigides : saisir un fruit mûr, se glisser dans un éboulement, accompagner un muscle.`,
  lessons: [
    {
      id: 'souple', title: 'Quand la forme fait le calcul', sub: 'Actionneurs souples, préhension et bio-inspiration', min: 25, level: 2,
      why: `Beaucoup de problèmes difficiles pour un robot rigide deviennent faciles avec des matériaux souples bien conçus. Savoir quand choisir le souple est une compétence d'ingénieur rare et recherchée.`,
      objectives: ['Comprendre le principe d\'un actionneur pneumatique souple', 'Connaître l\'idée de calcul morphologique', 'Choisir entre préhenseur rigide et souple', 'Imaginer une solution bio-inspirée'],
      blocks: [
        P(`<p>Un <strong>actionneur pneumatique souple</strong> est un boudin de silicone avec des chambres d'air, plus rigide d'un côté que de l'autre. Quand on le gonfle, le côté souple s'allonge davantage : le boudin se courbe, comme un doigt. Pas de moteur, pas d'engrenage, pas de capteur de position, et pourtant il saisit des objets de forme inconnue.</p>`),
        P(`<p>On parle de <strong>calcul morphologique</strong> : une partie du « travail de commande » est faite par la forme et les matériaux. Un doigt souple qui épouse un objet résout sans calcul le problème de placement précis des points de contact.</p>`),
        Table(['Critère', 'Préhenseur rigide', 'Préhenseur souple'], [
          ['Précision de position', 'excellente', 'faible'],
          ['Objets fragiles ou de forme variable', 'difficile, demande capteurs et commande fine', 'naturel'],
          ['Force de serrage', 'élevée', 'limitée'],
          ['Sécurité au contact humain', 'à concevoir', 'intrinsèque'],
          ['Durée de vie', 'longue', 'usure et crevaison du matériau'],
        ]),
        Table(['Animal', 'Ce qu\'il a inspiré'], [
          ['Pieuvre', 'bras souples à préhension par enroulement et ventouses'],
          ['Gecko', 'adhésifs secs à micro-poils, pour grimper sur des parois lisses'],
          ['Serpent', 'robots qui se faufilent dans les tuyaux et les décombres'],
          ['Salamandre', 'générateurs de rythme pour passer de la nage à la marche'],
          ['Abeille', 'micro-drones à ailes battantes et essaims'],
          ['Cafard', 'pattes souples qui encaissent les chocs sans calcul'],
        ]),
        Real(`Des préhenseurs souples sont déjà utilisés dans l'agroalimentaire pour manipuler pâtisseries, fruits et poissons, des objets qui changent de forme d'un exemplaire à l'autre et s'abîment au moindre excès de force.`),
        Future(`Les chercheurs développent des muscles artificiels électriques, des robots qui se réparent eux-mêmes et des machines biodégradables pour l'exploration de milieux naturels. Certains robots ne pèsent que quelques grammes et marchent grâce à des matériaux qui se déforment sous la lumière.`),
        Manual('manuel-doigt', 'Fabrique un doigt souple', `Avec un ballon de baudruche long, du ruban adhésif renforcé et une paille : colle une bande de ruban sur toute la longueur d'un côté du ballon (le côté « rigide »), puis gonfle par la paille. Observe la courbure. Essaie ensuite de saisir un œuf ou une tomate avec deux doigts face à face. Note ce qui change si tu mets le ruban en spirale.`, 60),
        Think('t1', `La récolte de certains fruits fragiles abîme une partie de la production et demande beaucoup de main-d'œuvre. Imagine un robot de récolte bio-inspiré : quel animal, quel principe, quel matériau ? Dessine-le dans ton carnet et liste trois risques d'échec.`, `Par exemple : une « trompe » souple inspirée de l'éléphant ou de la pieuvre, en silicone, qui entoure le fruit et le détache par torsion douce, avec une caméra pour repérer la maturité à la couleur. Risques : feuillage qui cache les fruits, matériau qui s'use au soleil et à la poussière, cadence trop lente pour être rentable. L'important est de relier chaque choix à un problème réel.`),
        Q('q1', 'Qu\'appelle-t-on calcul morphologique ?', ['Un algorithme de vision', 'Le fait qu\'une partie de la commande soit réalisée par la forme et les matériaux du robot', 'Un calcul de masse', 'Une méthode de simulation'], 1, 'Le corps lui-même résout une partie du problème, sans calcul électronique.'),
      ],
      cards: [['Principe d\'un actionneur pneumatique souple ?', 'Une structure élastique asymétrique qui se courbe quand on la gonfle.'], ['Calcul morphologique ?', 'La forme et les matériaux font une partie du travail de commande.'], ['Inspiration du gecko en robotique ?', 'Adhésifs secs à micro-poils pour grimper sur des surfaces lisses.']],
    },
  ],
};
