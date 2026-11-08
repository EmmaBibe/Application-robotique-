import { P, H, Tip, Warn, Danger, Future, Real, Info, F, Sim, Pipe, Q, Exo, Code, Defi, Manual, Think, Table } from './b.js';

// ============================================================================
// Perception et capteurs
// ============================================================================

export const perception = {
  id: 'perception', phase: 'intelligence', icon: '👁️', title: 'Perception et capteurs',
  desc: 'Ce que mesurent vraiment les capteurs, leurs défauts, et comment filtrer et fusionner leurs mesures.',
  master: 'Capteurs et traitement du signal',
  intro: 'Un robot ne connaît le monde qu\'à travers ses capteurs, et ses capteurs mentent toujours un peu. Ce module t\'apprend à les choisir, à comprendre leurs défauts, et à extraire la vérité de mesures imparfaites.',
  lessons: [
    {
      id: 'capteurs', title: 'Panorama des capteurs', sub: 'Proprioceptifs et extéroceptifs', min: 22, level: 1,
      why: 'Choisir un capteur, c\'est arbitrer entre précision, portée, fréquence, robustesse, prix et consommation. Savoir lire une fiche technique t\'évitera des mois de galère.',
      objectives: ['Distinguer capteurs proprioceptifs et extéroceptifs', 'Comprendre précision, justesse, résolution, fréquence, latence', 'Connaître les capteurs les plus utilisés en robotique', 'Savoir étalonner un capteur'],
      blocks: [
        P('<p>Les capteurs <strong>proprioceptifs</strong> mesurent l\'état interne du robot (angles des articulations, vitesse des roues, courant des moteurs, accélérations). Les capteurs <strong>extéroceptifs</strong> mesurent l\'environnement (distances, images, sons, contacts).</p>'),
        Table(['Capteur', 'Mesure', 'Type', 'Remarques'], [
          ['Codeur (encodeur)', 'angle, vitesse de rotation', 'proprio', 'incrémental (compte des pas) ou absolu (connaît l\'angle dès l\'allumage)'],
          ['Centrale inertielle (IMU)', 'accélérations, vitesses angulaires, champ magnétique', 'proprio', 'dérive, sensible aux vibrations, indispensable pour drones et humanoïdes'],
          ['Capteur de courant', 'courant moteur, donc couple', 'proprio', 'détection de collision, commande en effort'],
          ['Capteur d\'effort 6 axes', 'forces et couples au poignet', 'proprio/extéro', 'assemblage, polissage, interaction humaine'],
          ['Ultrason', 'distance', 'extéro', 'pas cher, cône large, problèmes avec surfaces obliques ou molles'],
          ['Infrarouge, temps de vol (ToF)', 'distance', 'extéro', 'précis, courte portée, sensible au soleil'],
          ['Lidar', 'distances sur 360° (2D) ou en 3D', 'extéro', 'précis, cher, aveugle au verre et parfois au noir mat'],
          ['Caméra', 'images couleur', 'extéro', 'très riche, sensible à l\'éclairage, demande beaucoup de calcul'],
          ['Caméra de profondeur (stéréo, lumière structurée, ToF)', 'image + distance par pixel', 'extéro', 'excellente en intérieur, portée limitée'],
          ['Radar', 'distance et vitesse', 'extéro', 'traverse pluie, brouillard, poussière'],
          ['GNSS (GPS, Galileo)', 'position absolue', 'extéro', 'précision métrique, centimétrique en RTK, ne marche pas en intérieur'],
          ['Capteur tactile, peau artificielle', 'contact, pression', 'extéro', 'préhension délicate, sécurité'],
        ]),
        H('Lire une fiche technique'),
        Table(['Caractéristique', 'Définition'], [
          ['Étendue de mesure', 'valeurs min et max mesurables (ex. 2 cm à 4 m)'],
          ['Résolution', 'plus petite variation détectable'],
          ['Justesse (exactitude)', 'écart moyen entre la mesure et la vraie valeur (erreur systématique, biais)'],
          ['Fidélité (répétabilité)', 'dispersion des mesures répétées (erreur aléatoire, bruit)'],
          ['Fréquence', 'nombre de mesures par seconde'],
          ['Latence', 'délai entre l\'événement et la mesure disponible'],
        ]),
        Tip('Imagine des fléchettes. Toutes groupées mais loin du centre : fidèle mais pas juste (un biais, corrigeable par étalonnage). Éparpillées autour du centre : juste mais pas fidèle (du bruit, à filtrer). Groupées au centre : précis. Un biais se corrige par étalonnage ; le bruit se réduit par filtrage.', 'Justesse et fidélité'),
        Sim('sensors'),
        Exo('e1', 'Un capteur indique 1,05 m pour une distance vraie de 1,00 m, et 2,10 m pour 2,00 m. L\'erreur est proportionnelle. Quel facteur de correction appliquer à la mesure ?', { answer: 0.952, tol: 0.003, sol: 'Vrai = mesure / 1,05, soit un facteur <b>0,952</b>. C\'est un étalonnage linéaire simple : on mesure des distances connues et on ajuste.' }),
        Code('c1', 'Étalonnage linéaire : à partir de deux points de référence (brut₁, vrai₁) et (brut₂, vrai₂), écris <code>etalonner(b1, v1, b2, v2, brut)</code> qui convertit une valeur brute en valeur vraie par interpolation linéaire.', {
          fn: 'etalonner',
          starter: 'function etalonner(b1, v1, b2, v2, brut) {\n  // pente a = (v2 - v1) / (b2 - b1), puis v = v1 + a * (brut - b1)\n  return 0;\n}',
          tests: [[[100, 0.1, 900, 0.9, 500], 0.5], [[200, 10, 600, 30, 400], 20], [[0, 0, 1023, 5, 512], 2.502444]],
          sol: 'function etalonner(b1, v1, b2, v2, brut) {\n  return v1 + (v2 - v1) / (b2 - b1) * (brut - b1);\n}',
        }),
        Q('q1', 'Le robot doit naviguer dans un entrepôt plein de poussière. Quel capteur est le plus robuste ?', ['Caméra', 'Lidar', 'Radar', 'Infrarouge'], 2, 'Les ondes radar traversent poussière, fumée et brouillard.'),
        Q('q2', 'Un capteur donne toujours 3 cm de trop, avec très peu de variation. C\'est :', ['un bruit à filtrer', 'un biais à corriger par étalonnage', 'une panne', 'normal, on ne fait rien'], 1, 'Erreur systématique : on la mesure une fois et on la soustrait.'),
      ],
      cards: [['Proprioceptif ou extéroceptif : un codeur ?', 'Proprioceptif (état interne).'], ['Justesse vs fidélité ?', 'Justesse : absence de biais. Fidélité : faible dispersion (peu de bruit).'], ['Avantage du radar ?', 'Fonctionne à travers pluie, brouillard, poussière, et mesure la vitesse.'], ['Comment corriger un biais ?', 'Par étalonnage.']],
    },
    {
      id: 'imu', title: 'Centrale inertielle et filtre complémentaire', sub: 'Savoir dans quel sens on penche', min: 25, level: 2,
      why: 'Un drone, un robot qui tient en équilibre, un humanoïde : tous doivent connaître leur inclinaison des centaines de fois par seconde. Ni l\'accéléromètre seul ni le gyroscope seul n\'y arrivent. Leur combinaison, si.',
      objectives: ['Comprendre ce que mesurent accéléromètre, gyroscope et magnétomètre', 'Calculer un angle d\'inclinaison à partir de l\'accéléromètre', 'Comprendre la dérive du gyroscope', 'Implémenter un filtre complémentaire'],
      blocks: [
        Table(['Capteur', 'Mesure', 'Qualité', 'Défaut'], [
          ['Accéléromètre', 'accélérations, y compris la gravité', 'donne l\'inclinaison absolue au repos', 'très bruité, perturbé par les mouvements et vibrations'],
          ['Gyroscope', 'vitesses angulaires', 'précis et réactif à court terme', 'dérive : en intégrant, une petite erreur grandit sans cesse'],
          ['Magnétomètre', 'champ magnétique (boussole)', 'donne le cap absolu', 'perturbé par les moteurs, les métaux, les câbles'],
        ]),
        F('angle<sub>accéléro</sub> = atan2(a<sub>y</sub>, a<sub>z</sub>) &nbsp;&nbsp;&nbsp;&nbsp; angle<sub>gyro</sub> = angle<sub>précédent</sub> + ω · Δt'),
        H('Le filtre complémentaire'),
        P('<p>L\'idée est simple et géniale : faire confiance au gyroscope pour les variations rapides (il est précis à court terme) et à l\'accéléromètre pour la tendance de fond (il ne dérive pas). Concrètement :</p>'),
        F('angle = α · (angle + ω·Δt) + (1 − α) · angle<sub>accéléro</sub>', 'α typiquement entre 0,95 et 0,99'),
        P('<p>Le gyroscope fait le gros du travail ; l\'accéléromètre, avec un petit poids, ramène doucement l\'estimation vers la vérité et empêche la dérive. C\'est un filtre passe-haut sur le gyroscope plus un filtre passe-bas sur l\'accéléromètre, qui se complètent exactement : d\'où son nom.</p>'),
        Sim('filter', { title: 'Rappel : le filtrage d\'un signal bruité' }),
        Code('c1', 'Écris <code>complementaire(angle, gyro, accY, accZ, dt, alpha)</code> qui renvoie le nouvel angle estimé (en radians).', {
          fn: 'complementaire',
          starter: 'function complementaire(angle, gyro, accY, accZ, dt, alpha) {\n  const angleAcc = Math.atan2(accY, accZ);\n  // à compléter\n  return angle;\n}',
          tests: [[[0, 0, 0, 1, 0.01, 0.98], 0], [[0, 1, 0, 1, 0.01, 1], 0.01], [[0, 0, 1, 1, 0.01, 0.98], 0.015708], [[0.1, 0.5, 0.1, 0.99, 0.01, 0.98], 0.104914]],
          sol: 'function complementaire(angle, gyro, accY, accZ, dt, alpha) {\n  const angleAcc = Math.atan2(accY, accZ);\n  return alpha * (angle + gyro * dt) + (1 - alpha) * angleAcc;\n}',
        }),
        Real('Les centrales inertielles des smartphones coûtent quelques euros et contiennent accéléromètre, gyroscope et souvent magnétomètre dans une puce de 3 mm. Elles exécutent parfois la fusion elles-mêmes. Les centrales de navigation des avions, elles, coûtent des centaines de milliers d\'euros et dérivent de moins d\'un mille nautique par heure.'),
        Future('Les filtres modernes (Madgwick, Mahony, filtre de Kalman étendu) estiment l\'orientation complète en 3D avec des quaternions, et la fusion visuelle-inertielle (caméra + IMU) permet aux casques de réalité virtuelle et aux drones de se localiser sans GPS.'),
        Q('q1', 'Pourquoi ne pas utiliser seulement le gyroscope pour connaître l\'angle ?', ['Il est trop lent', 'Son intégration dérive avec le temps', 'Il ne mesure pas les rotations', 'Il est trop cher'], 1, 'Un petit biais de 0,1°/s devient 6° d\'erreur en une minute.'),
        Q('q2', 'Dans le filtre complémentaire avec α = 0,98, quel capteur a le plus de poids à chaque pas ?', ['L\'accéléromètre', 'Le gyroscope', 'Ils sont égaux', 'Le magnétomètre'], 1, '98 % pour l\'estimation propagée par le gyroscope, 2 % pour la correction de l\'accéléromètre.'),
      ],
      cards: [['Défaut principal du gyroscope ?', 'La dérive par intégration.'], ['Défaut principal de l\'accéléromètre ?', 'Bruit et perturbation par les mouvements.'], ['Formule du filtre complémentaire ?', 'angle = α(angle + ω·Δt) + (1 − α)·angle_acc.'], ['Inclinaison par l\'accéléromètre au repos ?', 'atan2(a_y, a_z).']],
    },
    {
      id: 'kalman', title: 'Le filtre de Kalman', sub: 'La meilleure estimation possible', min: 35, level: 3,
      why: 'Inventé pour le programme Apollo, le filtre de Kalman est l\'algorithme d\'estimation le plus utilisé au monde : GPS, avions, drones, voitures autonomes, robots. Le comprendre est un passage obligé du Master.',
      objectives: ['Comprendre les deux étapes prédiction et correction', 'Interpréter le gain de Kalman', 'Régler Q et R', 'Implémenter un Kalman 1D'],
      blocks: [
        P('<p>Le filtre de Kalman maintient deux choses : une <strong>estimation</strong> x̂ et son <strong>incertitude</strong> P (une variance). À chaque pas :</p>'),
        Pipe('Le cycle du filtre de Kalman', [
          ['Prédiction', 'J\'utilise mon modèle pour prévoir le nouvel état.', 'x̂⁻ = A·x̂ + B·u', 'Par exemple : la position avance de v·Δt. Sans mesure, c\'est tout ce qu\'on peut faire.'],
          ['L\'incertitude grandit', 'Mon modèle n\'est pas parfait : j\'ajoute le bruit de processus Q.', 'P⁻ = A·P·Aᵀ + Q', 'Q représente ce que le modèle ignore : glissements, vent, perturbations.'],
          ['Mesure', 'Le capteur donne z, avec un bruit de variance R.', 'z = 2,31 m, R = 0,04', 'R se déduit de la fiche technique ou d\'une série de mesures.'],
          ['Gain de Kalman', 'À qui faire confiance ?', 'K = P⁻ / (P⁻ + R)', 'Si le modèle est incertain (P⁻ grand) et le capteur précis (R petit), K est proche de 1 : on suit la mesure. Sinon, K est petit : on suit la prédiction.'],
          ['Correction', 'On ajuste l\'estimation vers la mesure.', 'x̂ = x̂⁻ + K·(z − x̂⁻)', 'z − x̂⁻ s\'appelle l\'innovation : la surprise apportée par la mesure.'],
          ['L\'incertitude diminue', 'La mesure nous a appris quelque chose.', 'P = (1 − K)·P⁻', 'Et on recommence au pas suivant.'],
        ]),
        Sim('filter'),
        Table(['Si tu augmentes...', 'Le filtre...'], [
          ['Q (je fais moins confiance au modèle)', 'suit davantage les mesures : réactif mais plus bruité'],
          ['R (je fais moins confiance au capteur)', 'lisse davantage : moins bruité mais plus lent à réagir'],
        ]),
        Defi('defi-kalman', 'Dompter le bruit', 'Avec un bruit de capteur σ = 0,4, règle Q et R pour que l\'erreur du filtre de Kalman passe sous 0,21 (environ deux fois moins que le bruit brut), malgré les marches de la vraie valeur.', 'filter', { goal: 'kalman' }, 80),
        Code('c1', 'Implémente un pas de Kalman 1D sans commande (modèle « la valeur reste constante »). <code>kalman1D(x, P, z, Q, R)</code> renvoie <code>[xNouveau, PNouveau]</code>.', {
          fn: 'kalman1D',
          starter: 'function kalman1D(x, P, z, Q, R) {\n  // 1. prédiction : x reste x, P devient P + Q\n  // 2. gain K = P / (P + R)\n  // 3. correction de x et de P\n  return [x, P];\n}',
          tests: [[[0, 1, 1, 0, 1], [0.5, 0.5]], [[2, 0.5, 3, 0.5, 1], [2.5, 0.5]], [[10, 0.01, 20, 0, 1], [10.09901, 0.009901]]],
          sol: 'function kalman1D(x, P, z, Q, R) {\n  P = P + Q;\n  const K = P / (P + R);\n  return [x + K * (z - x), (1 - K) * P];\n}',
        }),
        H('Au-delà du cas linéaire'),
        P('<p>Le filtre de Kalman suppose un système linéaire et des bruits gaussiens. Pour un robot qui tourne (sin, cos...), on utilise le <strong>filtre de Kalman étendu</strong> (EKF), qui linéarise le modèle à chaque pas avec une jacobienne, ou le <strong>filtre de Kalman sans parfum</strong> (UKF). Quand la distribution n\'est plus du tout gaussienne (plusieurs hypothèses possibles), on passe au <strong>filtre particulaire</strong>, dans le module de localisation.</p>'),
        Real('Dans ROS 2, le paquet <code>robot_localization</code> fusionne odométrie, IMU et GPS avec un EKF ou un UKF. C\'est souvent la première brique de localisation installée sur un robot mobile réel.'),
        Exo('e1', 'P⁻ = 0,09 et R = 0,01. Que vaut le gain de Kalman K ?', { answer: 0.9, sol: 'K = 0,09 / (0,09 + 0,01) = <b>0,9</b>. Le capteur est bien plus fiable que la prédiction : on suit presque la mesure.' }),
        Q('q1', 'Que représente l\'innovation z − x̂⁻ ?', ['Le bruit du capteur', 'La différence entre ce qu\'on mesure et ce qu\'on avait prévu', 'L\'incertitude', 'Le gain'], 1, 'C\'est la « surprise » : si elle est systématiquement grande, le modèle ou les réglages sont faux.'),
      ],
      cards: [['Les deux étapes du filtre de Kalman ?', 'Prédiction (modèle, incertitude augmente) et correction (mesure, incertitude diminue).'], ['Gain de Kalman 1D ?', 'K = P⁻ / (P⁻ + R).'], ['Effet d\'augmenter R ?', 'Plus de lissage, réaction plus lente.'], ['Version non linéaire du Kalman ?', 'Filtre de Kalman étendu (EKF) ou sans parfum (UKF).']],
    },
  ],
};

// ============================================================================
// Vision
// ============================================================================

export const vision = {
  id: 'vision', phase: 'intelligence', icon: '📷', title: 'Vision par ordinateur',
  desc: 'De l\'image comme tableau de nombres jusqu\'à la détection d\'objets par réseaux de neurones et la vision 3D.',
  master: 'Vision et traitement d\'images',
  intro: 'La caméra est le capteur le plus riche et le moins cher. Mais une image n\'est qu\'une grille de nombres : tout l\'enjeu est d\'en extraire du sens. Tu vas voir comment on passe des pixels aux objets.',
  lessons: [
    {
      id: 'image', title: 'L\'image numérique et la caméra', sub: 'Pixels, couleurs, modèle sténopé', min: 22, level: 1,
      why: 'Avant de détecter quoi que ce soit, il faut comprendre ce qu\'est une image et comment une caméra projette le monde 3D sur un capteur 2D. C\'est la base de toute la vision robotique.',
      objectives: ['Comprendre la représentation d\'une image (pixels, canaux)', 'Comparer les espaces de couleur RGB et HSV', 'Utiliser le modèle de caméra sténopé', 'Savoir pourquoi on étalonne une caméra'],
      blocks: [
        P('<p>Une image en niveaux de gris est un tableau de nombres de 0 (noir) à 255 (blanc). Une image couleur en a trois superposés : rouge, vert, bleu (RGB). Une image HD de 1920 × 1080 contient ainsi plus de 6 millions de nombres, 30 fois par seconde.</p>'),
        Sim('vision'),
        H('RGB ou HSV ?'),
        P('<p>En <strong>RGB</strong>, une balle rouge à l\'ombre et au soleil a des valeurs très différentes sur les trois canaux. En <strong>HSV</strong> (teinte, saturation, valeur), la teinte reste à peu près la même, seule la valeur (luminosité) change. Pour détecter un objet par sa couleur, on travaille donc en HSV.</p>'),
        H('Le modèle sténopé'),
        P('<p>Une caméra projette un point 3D (X, Y, Z), exprimé dans son repère, sur le pixel (u, v) :</p>'),
        F('u = f<sub>x</sub> · X / Z + c<sub>x</sub> &nbsp;&nbsp;&nbsp;&nbsp; v = f<sub>y</sub> · Y / Z + c<sub>y</sub>', 'f : focale en pixels ; (cₓ, c<sub>y</sub>) : centre optique'),
        P('<p>On divise par Z, la profondeur : un objet deux fois plus loin apparaît deux fois plus petit. Et on perd l\'information de profondeur : avec une seule image, on ne sait pas si on voit un petit objet proche ou un grand objet lointain.</p>'),
        Tip('L\'étalonnage (calibration) d\'une caméra consiste à filmer un damier sous plusieurs angles pour estimer f, c et les distorsions de l\'objectif. OpenCV et ROS le font en quelques minutes. Sans étalonnage, toutes les mesures géométriques sont fausses, surtout au bord de l\'image.', 'Étalonner, toujours'),
        Exo('e1', 'Une caméra a fₓ = 600 px et cₓ = 320 px. Un point est à X = 0,5 m, Z = 2 m. Quelle coordonnée u ?', { answer: 470, unit: 'px', sol: 'u = 600 × 0,5 / 2 + 320 = 150 + 320 = <b>470 px</b>.' }),
        Exo('e2', 'Une personne de 1,80 m se trouve à 6 m. Avec f<sub>y</sub> = 600 px, quelle hauteur fait-elle dans l\'image, en pixels ?', { answer: 180, unit: 'px', sol: '600 × 1,8 / 6 = <b>180 px</b>.' }),
        Code('c1', 'Écris <code>projeter(f, cx, cy, X, Y, Z)</code> qui renvoie <code>[u, v]</code>, ou <code>null</code> si le point est derrière la caméra (Z ≤ 0).', {
          fn: 'projeter',
          starter: 'function projeter(f, cx, cy, X, Y, Z) {\n  return [0, 0];\n}',
          tests: [[[600, 320, 240, 0.5, 0, 2], [470, 240]], [[600, 320, 240, 0, -0.3, 1.5], [320, 120]], [[600, 320, 240, 1, 1, -1], null]],
          sol: 'function projeter(f, cx, cy, X, Y, Z) {\n  if (Z <= 0) return null;\n  return [f * X / Z + cx, f * Y / Z + cy];\n}',
        }),
        Q('q1', 'Pourquoi préférer HSV à RGB pour détecter un objet par sa couleur ?', ['HSV a plus de couleurs', 'La teinte varie peu avec la luminosité', 'RGB est plus lent', 'HSV est en noir et blanc'], 1, 'Ombre ou soleil changent surtout la valeur V, pas la teinte H.'),
      ],
      cards: [['Combien de canaux dans une image RGB ?', 'Trois : rouge, vert, bleu.'], ['Modèle sténopé pour u ?', 'u = fₓ·X/Z + cₓ.'], ['Ce qu\'une seule image ne donne pas ?', 'La profondeur.'], ['Pourquoi étalonner une caméra ?', 'Pour connaître focale, centre et distorsions, et faire des mesures géométriques justes.']],
    },
    {
      id: 'traitement', title: 'Filtres, contours et segmentation', sub: 'Extraire l\'information utile', min: 25, level: 2,
      why: 'Repérer une ligne au sol, une pièce sur un tapis roulant, un code QR : la vision classique, par filtres et seuils, reste rapide, explicable et suffisante pour de nombreuses tâches industrielles.',
      objectives: ['Comprendre la convolution', 'Détecter des contours avec Sobel', 'Segmenter une image par seuillage', 'Construire un pipeline de vision complet'],
      blocks: [
        P('<p>Une <strong>convolution</strong> fait glisser un petit noyau (souvent 3×3) sur l\'image. En chaque pixel, on multiplie les voisins par les coefficients du noyau et on additionne. Selon les coefficients : flou, netteté, détection de contours.</p>'),
        Sim('vision', { title: 'Convolution, contours et seuillage' }),
        Pipe('Pipeline : trouver une pièce sur un tapis roulant', [
          ['Acquisition', 'La caméra capture l\'image.', '640 × 480, couleur', 'Éclairage contrôlé : en industrie, la moitié du travail de vision, c\'est l\'éclairage.'],
          ['Prétraitement', 'Conversion en gris et flou léger.', 'flou gaussien 5×5', 'Le flou supprime le bruit qui créerait de faux contours.'],
          ['Segmentation', 'Seuillage : pièce claire sur fond sombre.', 'pixels > 120 → blanc', 'Le seuil d\'Otsu le choisit automatiquement à partir de l\'histogramme.'],
          ['Morphologie', 'Érosion puis dilatation pour nettoyer.', 'suppression des petits points', 'Opérations qui « grignotent » puis « regonflent » les formes.'],
          ['Contours', 'Extraction du contour de chaque objet.', '3 objets trouvés', 'OpenCV : findContours.'],
          ['Mesures', 'Aire, centre, orientation de chaque objet.', 'centre (312, 188), angle 23°', 'Les moments de l\'image donnent centre et orientation.'],
          ['Vers le robot', 'Conversion pixels → repère robot grâce à l\'étalonnage.', 'prise en (0,42 ; −0,11) m', 'Le bras vient saisir la pièce.'],
        ]),
        Code('c1', 'Applique un noyau 3×3 au pixel central d\'une image 3×3 : <code>convoluer(patch, noyau)</code> renvoie la somme des produits terme à terme.', {
          fn: 'convoluer',
          starter: 'function convoluer(patch, noyau) {\n  let s = 0;\n  // deux boucles imbriquées sur les lignes et colonnes\n  return s;\n}',
          tests: [[[[[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]]], 5], [[[[10, 10, 50], [10, 10, 50], [10, 10, 50]], [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]], 160], [[[[1, 1, 1], [1, 1, 1], [1, 1, 1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1]]], 9]],
          sol: 'function convoluer(p, k) {\n  let s = 0;\n  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += p[i][j] * k[i][j];\n  return s;\n}',
        }),
        Tip('OpenCV est la bibliothèque de référence, en Python comme en C++. Exemple : <code>gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)</code>, <code>bords = cv2.Canny(gris, 50, 150)</code>. Attention : OpenCV range les couleurs en BGR et non en RGB, source d\'innombrables bugs.', 'Dans la vraie vie'),
        Q('q1', 'Le noyau de Sobel horizontal [−1 0 1 ; −2 0 2 ; −1 0 1] détecte :', ['les zones uniformes', 'les variations horizontales d\'intensité, donc les bords verticaux', 'les couleurs', 'le flou'], 1, 'Il compare la colonne de droite à celle de gauche : fort résultat là où l\'intensité change horizontalement.'),
      ],
      cards: [['Qu\'est-ce qu\'une convolution ?', 'Glisser un noyau sur l\'image et sommer les produits pixel × coefficient.'], ['Pourquoi flouter avant de détecter les contours ?', 'Pour éviter que le bruit crée de faux contours.'], ['Ordre des couleurs dans OpenCV ?', 'BGR.']],
    },
    {
      id: 'deep-vision', title: 'Vision par apprentissage et vision 3D', sub: 'CNN, détection d\'objets, profondeur', min: 25, level: 2,
      why: 'Reconnaître une personne, un carton abîmé, une mauvaise herbe : la vision classique atteint vite ses limites. Les réseaux de neurones convolutifs ont révolutionné la perception robotique depuis 2012.',
      objectives: ['Comprendre le principe d\'un réseau convolutif', 'Connaître les tâches : classification, détection, segmentation', 'Comprendre les limites et les biais', 'Découvrir la vision stéréo et les nuages de points'],
      blocks: [
        P('<p>Un réseau de neurones convolutif (CNN) empile des couches de convolution, comme celles que tu as manipulées, mais <strong>les noyaux ne sont pas choisis à la main : ils sont appris</strong> à partir de milliers d\'exemples annotés. Les premières couches apprennent des contours, les suivantes des textures, puis des parties d\'objets, puis des objets.</p>'),
        Table(['Tâche', 'Sortie', 'Exemple de modèle', 'Usage robotique'], [
          ['Classification', 'une étiquette par image', 'ResNet, EfficientNet', 'trier des pièces bonnes / défectueuses'],
          ['Détection', 'boîtes + étiquettes', 'YOLO, DETR', 'repérer personnes et obstacles'],
          ['Segmentation sémantique', 'une classe par pixel', 'U-Net, DeepLab', 'route praticable, zone cultivée'],
          ['Segmentation d\'instances', 'un masque par objet', 'Mask R-CNN, SAM', 'saisir des objets en vrac'],
          ['Estimation de pose', 'points clés', 'OpenPose, RTMPose', 'comprendre les gestes humains'],
          ['Profondeur monoculaire', 'carte de distance', 'Depth Anything', 'estimer la 3D avec une seule caméra'],
        ]),
        Warn('Un réseau ne « comprend » pas : il reconnaît des motifs statistiques vus pendant l\'entraînement. Hors de ces conditions (nuit, pluie, objet jamais vu), il peut se tromper avec une grande confiance. En robotique, on ne confie jamais la sécurité à un seul réseau de neurones sans redondance.', 'Limites'),
        H('La vision 3D'),
        P('<p>Avec <strong>deux caméras</strong> séparées d\'une distance b (la base), un même point apparaît décalé d\'une disparité d entre les deux images. La profondeur s\'en déduit :</p>'),
        F('Z = f · b / d', 'plus le point est proche, plus la disparité est grande'),
        P('<p>Les caméras de profondeur et les lidars 3D produisent des <strong>nuages de points</strong> : des millions de points (x, y, z). La bibliothèque PCL et Open3D permettent de les filtrer, de détecter des plans (sol, tables), de segmenter des objets et de les recaler entre eux (algorithme ICP).</p>'),
        Exo('e1', 'Caméra stéréo : f = 700 px, base b = 0,12 m, disparité mesurée d = 21 px. Profondeur ?', { answer: 4, unit: 'm', sol: 'Z = 700 × 0,12 / 21 = <b>4 m</b>.' }),
        Future('Les modèles de fondation pour la vision (segmentation universelle, modèles vision-langage) permettent de détecter un objet décrit en langage naturel (« la tasse bleue ébréchée ») sans entraînement spécifique. Ils commencent à remplacer les détecteurs entraînés pour une seule tâche.'),
        Q('q1', 'En vision stéréo, que se passe-t-il pour un point très lointain ?', ['La disparité devient très grande', 'La disparité tend vers zéro et la mesure de profondeur devient imprécise', 'Rien ne change', 'Il disparaît'], 1, 'Z = f·b/d : pour Z grand, d est petit, et une erreur d\'un pixel change énormément Z. Pour voir loin, on écarte les caméras.'),
      ],
      cards: [['Qu\'apprend un CNN ?', 'Les coefficients de ses noyaux de convolution, à partir d\'exemples annotés.'], ['Profondeur en stéréo ?', 'Z = f·b/d.'], ['Détection vs segmentation ?', 'Détection : des boîtes. Segmentation : une étiquette par pixel.'], ['Bibliothèques de nuages de points ?', 'PCL et Open3D.']],
    },
  ],
};

// ============================================================================
// Localisation et cartographie
// ============================================================================

export const localisation = {
  id: 'localisation', phase: 'intelligence', icon: '🗺️', title: 'Localisation et cartographie',
  desc: 'Robotique probabiliste : savoir où l\'on est, construire une carte, et faire les deux à la fois (SLAM).',
  master: 'Robotique mobile et estimation',
  intro: '« Où suis-je ? » est la question la plus difficile pour un robot mobile. Ce module rassemble tout ce que tu as vu (probabilités, capteurs, filtres) pour y répondre.',
  lessons: [
    {
      id: 'particulaire', title: 'Localisation probabiliste et filtre particulaire', sub: 'Mille hypothèses valent mieux qu\'une', min: 30, level: 3,
      why: 'Quand un robot est perdu, il peut être à plusieurs endroits à la fois. Le filtre particulaire maintient toutes ces hypothèses et les fait converger. C\'est l\'algorithme de localisation le plus utilisé en intérieur (AMCL dans ROS).',
      objectives: ['Formuler la localisation comme un problème d\'estimation', 'Comprendre les étapes du filtre particulaire', 'Comprendre le rééchantillonnage', 'Savoir pourquoi on ajoute des particules aléatoires'],
      blocks: [
        P('<p>Au lieu d\'une seule estimation, on maintient un nuage de <strong>particules</strong> : chacune est une hypothèse de position. Là où il y a beaucoup de particules, le robot a de bonnes chances d\'être.</p>'),
        Pipe('Un cycle du filtre particulaire', [
          ['Prédiction', 'Chaque particule bouge comme le robot, avec un peu de bruit.', 'x += u + bruit', 'Le bruit représente l\'incertitude du mouvement. Le nuage s\'étale.'],
          ['Mesure', 'Le robot observe son environnement.', '« je vois une porte »', null],
          ['Pondération', 'Chaque particule reçoit un poids : la probabilité de faire cette observation si le robot était là.', 'poids = P(z | x)', 'Une particule devant une porte reçoit un poids fort, une particule devant un mur un poids faible.'],
          ['Rééchantillonnage', 'On tire au sort un nouveau nuage, proportionnellement aux poids.', 'les bonnes survivent et se multiplient', 'Comme une sélection naturelle : les hypothèses incompatibles avec les mesures disparaissent.'],
          ['Estimation', 'La moyenne (ou le mode) du nuage donne la position.', 'x̂ = 62,4', 'On peut aussi mesurer la dispersion pour connaître la certitude.'],
        ]),
        Sim('particles'),
        P('<p>Observe : au départ, les particules sont partout. Après quelques portes, plusieurs groupes subsistent (le couloir a des portes à des endroits similaires). Puis un seul groupe survit. Clique sur « Kidnapper » : le robot est téléporté, les particules ne correspondent plus... et le petit pourcentage de particules aléatoires permet de se remettre.</p>'),
        Defi('defi-particules', 'Localisation économe', 'Réduis le nombre de particules à 150 ou moins, et fais en sorte que le robot se localise (erreur < 3, certitude > 90 %) de façon stable. Un robot embarqué n\'a pas de puissance de calcul illimitée.', 'particles', { goal: true }),
        Code('c1', 'Écris <code>normaliser(poids)</code> qui divise chaque poids par la somme totale (pour que la somme fasse 1), puis <code>neff</code> n\'est pas demandé. Les tests vérifient la normalisation.', {
          fn: 'normaliser',
          starter: 'function normaliser(poids) {\n  const somme = 0; // à calculer\n  return poids.map(w => w / somme);\n}',
          tests: [[[[1, 1, 2]], [0.25, 0.25, 0.5]], [[[0.2, 0.8]], [0.2, 0.8]], [[[5]], [1]]],
          sol: 'function normaliser(poids) {\n  const s = poids.reduce((a, b) => a + b, 0);\n  return poids.map(w => w / s);\n}',
        }),
        Real('Dans ROS 2, AMCL (Adaptive Monte Carlo Localization) localise un robot sur une carte connue avec un lidar 2D. « Adaptatif » : il ajuste le nombre de particules, beaucoup quand le robot est perdu, peu quand il est sûr de lui.'),
        Q('q1', 'Pourquoi le filtre particulaire gère-t-il mieux qu\'un Kalman le robot complètement perdu ?', ['Il est plus rapide', 'Il peut représenter plusieurs hypothèses à la fois, pas une seule gaussienne', 'Il n\'a pas besoin de capteur', 'Il est plus précis dans tous les cas'], 1, 'Un Kalman représente une seule bosse gaussienne. Le nuage de particules peut avoir plusieurs groupes.'),
      ],
      cards: [['Que représente une particule ?', 'Une hypothèse de position du robot.'], ['Les étapes du filtre particulaire ?', 'Prédiction, pondération par la mesure, rééchantillonnage, estimation.'], ['Pourquoi ajouter quelques particules aléatoires ?', 'Pour pouvoir se remettre d\'un kidnapping ou d\'une erreur.'], ['Nom du filtre particulaire de ROS ?', 'AMCL.']],
    },
    {
      id: 'cartes', title: 'Représenter le monde : les cartes', sub: 'Grilles d\'occupation et alternatives', min: 20, level: 2,
      why: 'Sans carte, pas de planification. Le choix de la représentation conditionne ce que le robot peut faire et la mémoire qu\'il consomme.',
      objectives: ['Comprendre la grille d\'occupation', 'Mettre à jour une cellule avec une mesure de lidar', 'Connaître les autres représentations (topologique, à base de points, 3D)'],
      blocks: [
        P('<p>La <strong>grille d\'occupation</strong> découpe le monde en cellules (par exemple 5 cm × 5 cm) contenant chacune la probabilité d\'être occupée. Quand un rayon lidar touche un obstacle à 2 m, les cellules traversées par le rayon deviennent plus probablement libres, et la cellule d\'arrivée plus probablement occupée.</p>'),
        F('l = log( p / (1 − p) ) &nbsp;&nbsp;&nbsp; l<sub>nouveau</sub> = l + l<sub>mesure</sub>', 'en « log-odds », la mise à jour bayésienne devient une simple addition'),
        Table(['Représentation', 'Principe', 'Usage'], [
          ['Grille d\'occupation 2D', 'cellules libres / occupées / inconnues', 'robots d\'intérieur, Nav2'],
          ['Carte topologique', 'graphe de lieux reliés (couloir, salle, porte)', 'navigation à grande échelle, raisonnement'],
          ['Carte d\'amers (landmarks)', 'positions de points remarquables', 'SLAM visuel, extérieur'],
          ['Octree / voxels 3D', 'grille 3D hiérarchique (OctoMap)', 'drones, bras en environnement encombré'],
          ['Carte sémantique', 'objets et leur sens (« table », « porte »)', 'robots domestiques, interaction'],
          ['Représentations neuronales (NeRF, Gaussian splatting)', 'scène 3D encodée par un réseau ou des gaussiennes', 'recherche, jumeaux numériques'],
        ]),
        Code('c1', 'Mise à jour en log-odds : écris <code>majCellule(l, occupe, lOcc, lLibre)</code> qui ajoute lOcc si la mesure dit « occupé », lLibre (négatif) sinon, et borne le résultat entre −5 et 5. Puis <code>versProba</code> n\'est pas demandé.', {
          fn: 'majCellule',
          starter: 'function majCellule(l, occupe, lOcc, lLibre) {\n  return l;\n}',
          tests: [[[0, true, 0.85, -0.4], 0.85], [[0, false, 0.85, -0.4], -0.4], [[4.8, true, 0.85, -0.4], 5], [[-4.9, false, 0.85, -0.4], -5]],
          sol: 'function majCellule(l, occ, lo, ll) {\n  return Math.max(-5, Math.min(5, l + (occ ? lo : ll)));\n}',
        }),
        Tip('Le bornage des log-odds est important : sans lui, une cellule vue occupée des milliers de fois ne pourrait plus jamais redevenir libre si l\'obstacle (une personne, une chaise) se déplace.', 'Pourquoi borner'),
        Q('q1', 'Quel est l\'intérêt des log-odds pour une grille d\'occupation ?', ['Ils prennent moins de place', 'La mise à jour bayésienne devient une addition, rapide et numériquement stable', 'Ils sont plus précis', 'Ils évitent les capteurs'], 1, 'Multiplier des probabilités proches de 0 ou 1 est instable ; additionner des log-odds ne l\'est pas.'),
      ],
      cards: [['Qu\'est-ce qu\'une grille d\'occupation ?', 'Une carte en cellules contenant chacune la probabilité d\'être occupée.'], ['Avantage des log-odds ?', 'La mise à jour bayésienne devient une addition.'], ['Carte 3D hiérarchique classique ?', 'OctoMap (octree).']],
    },
    {
      id: 'slam', title: 'Le SLAM', sub: 'Se localiser et cartographier en même temps', min: 25, level: 3,
      why: 'Pour se localiser il faut une carte, pour faire une carte il faut savoir où l\'on est. Le SLAM résout ce problème de l\'œuf et de la poule. C\'est l\'un des grands succès de la robotique des 30 dernières années.',
      objectives: ['Comprendre pourquoi le SLAM est difficile', 'Connaître les grandes familles (filtre, graphe)', 'Comprendre la fermeture de boucle', 'Connaître les outils (slam_toolbox, Cartographer, ORB-SLAM)'],
      blocks: [
        P('<p>Le robot avance dans un lieu inconnu. Il estime son déplacement (odométrie) et observe des éléments. Mais l\'odométrie dérive, donc la carte se déforme. Le SLAM (Simultaneous Localization And Mapping) estime conjointement la trajectoire et la carte.</p>'),
        Pipe('Le SLAM par graphe, étape par étape', [
          ['Nœuds', 'À intervalles réguliers, on enregistre une pose du robot.', 'pose 1, 2, 3, ...', 'Chaque nœud est une position où le robot a pris un scan lidar ou une image.'],
          ['Arêtes d\'odométrie', 'Entre deux poses successives, une contrainte : « je me suis déplacé d\'environ 1 m ».', 'contrainte souple', 'Chaque contrainte a une incertitude.'],
          ['Mise en correspondance', 'On compare le scan actuel au précédent pour affiner le déplacement.', 'scan matching (ICP)', 'Bien plus précis que l\'odométrie des roues.'],
          ['Fermeture de boucle', 'Le robot reconnaît un endroit déjà visité !', 'pose 87 ≈ pose 3', 'C\'est l\'information la plus précieuse : elle révèle toute la dérive accumulée.'],
          ['Optimisation', 'On ajuste toutes les poses pour satisfaire au mieux toutes les contraintes.', 'moindres carrés', 'Des bibliothèques comme g2o, GTSAM ou Ceres le font en quelques millisecondes.'],
          ['Carte', 'On reconstruit la carte avec les poses corrigées.', 'carte cohérente', 'La carte « se redresse » d\'un coup après une fermeture de boucle.'],
        ]),
        Table(['Famille', 'Outils', 'Capteurs'], [
          ['SLAM lidar 2D', 'slam_toolbox (ROS 2), Cartographer, GMapping (historique)', 'lidar 2D + odométrie'],
          ['SLAM lidar 3D', 'LIO-SAM, FAST-LIO, KISS-ICP', 'lidar 3D + IMU'],
          ['SLAM visuel', 'ORB-SLAM3, RTAB-Map, VINS-Fusion', 'caméra mono, stéréo, RGB-D, + IMU'],
        ]),
        Real('Les robots aspirateurs haut de gamme font du SLAM lidar ou visuel en temps réel avec un processeur de quelques watts. Les casques de réalité mixte aussi. Les voitures autonomes utilisent des cartes construites à l\'avance par SLAM, puis se localisent dessus.'),
        Future('Le SLAM sémantique ajoute du sens à la carte (« ceci est une cuisine, ceci une porte ouverte »), et les approches à base de champs neuronaux reconstruisent des scènes 3D photoréalistes. L\'objectif : des robots qui comprennent leur environnement comme nous, pas seulement sa géométrie.'),
        Q('q1', 'Qu\'est-ce que la fermeture de boucle en SLAM ?', ['Quand le robot s\'arrête', 'Quand le robot reconnaît un lieu déjà visité, ce qui permet de corriger la dérive accumulée', 'Une boucle infinie dans le code', 'Quand la batterie est vide'], 1, 'Reconnaître un lieu connu fournit une contrainte qui relie deux moments éloignés de la trajectoire.'),
        Think('t1', 'Ton robot fait du SLAM dans un long couloir parfaitement identique sur 50 m (murs lisses, aucune porte). Quels problèmes vois-tu ? Comment les résoudre ?', 'Le lidar voit toujours la même chose : impossible d\'estimer le déplacement le long du couloir par mise en correspondance (dégénérescence). Solutions : faire confiance à l\'odométrie et à l\'IMU dans ce cas, ajouter une caméra qui voit des textures, des amers artificiels (marqueurs, balises), ou des capteurs d\'une autre nature (Wi-Fi, UWB).'),
      ],
      cards: [['Que signifie SLAM ?', 'Simultaneous Localization And Mapping : localisation et cartographie simultanées.'], ['Rôle de la fermeture de boucle ?', 'Corriger la dérive accumulée en reconnaissant un lieu déjà visité.'], ['Outil SLAM 2D standard sous ROS 2 ?', 'slam_toolbox.']],
    },
  ],
};

// ============================================================================
// Planification
// ============================================================================

export const planification = {
  id: 'planification', phase: 'intelligence', icon: '🧭', title: 'Planification et navigation',
  desc: 'Trouver un chemin, l\'optimiser, éviter les obstacles imprévus : les algorithmes qui donnent un but au robot.',
  master: 'Planification de mouvement',
  intro: 'Le robot sait où il est et connaît sa carte. Comment aller d\'un point à un autre ? Ce module couvre les algorithmes de recherche de chemin, des grands classiques aux méthodes par échantillonnage.',
  lessons: [
    {
      id: 'astar', title: 'Recherche de chemin : BFS, Dijkstra, A*', sub: 'Les algorithmes de graphe', min: 30, level: 2,
      why: 'Ces algorithmes sont partout : GPS, jeux vidéo, robots d\'entrepôt, réseaux. A* est probablement l\'algorithme le plus utilisé en planification robotique.',
      objectives: ['Modéliser une carte comme un graphe', 'Comprendre BFS, Dijkstra et A*', 'Choisir une heuristique admissible', 'Comparer leurs performances'],
      blocks: [
        P('<p>Une grille devient un <strong>graphe</strong> : chaque case libre est un nœud, relié à ses voisines par des arêtes qui ont un coût (1 pour un pas, √2 en diagonale, plus si le terrain est difficile).</p>'),
        Table(['Algorithme', 'Explore en priorité', 'Optimal ?', 'Remarque'], [
          ['BFS (largeur d\'abord)', 'les nœuds les plus proches en nombre de pas', 'oui si tous les coûts sont égaux', 'ignore les coûts'],
          ['Dijkstra', 'les nœuds de plus faible coût cumulé g', 'oui', 'explore en cercle dans toutes les directions'],
          ['A*', 'les nœuds de plus faible f = g + h', 'oui si h est admissible', 'h estime le coût restant : il fonce vers le but'],
          ['Glouton (best-first)', 'les nœuds de plus faible h', 'non', 'très rapide, mais peut faire de grands détours'],
        ]),
        F('f(n) = g(n) + h(n)', 'g : coût depuis le départ ; h : estimation du coût jusqu\'à l\'arrivée'),
        Sim('pathplan'),
        Tip('Une heuristique est <b>admissible</b> si elle ne surestime jamais le vrai coût. La distance à vol d\'oiseau l\'est toujours. Avec une heuristique admissible, A* trouve le chemin optimal. Si tu la multiplies par un poids > 1 (essaie le curseur), A* va plus vite mais le chemin peut être plus long : c\'est le « weighted A* », un compromis très utilisé.', 'L\'heuristique'),
        Defi('defi-labyrinthe', 'Piéger l\'heuristique', 'Dessine des murs qui obligent A* (poids d\'heuristique ≤ 1) à explorer au moins 300 cases avant de trouver l\'arrivée, en partant d\'une carte vide, tout en laissant un chemin possible. Un vrai défi de créativité : comprends comment A* pense pour le tromper.', 'pathplan', { goal: 'maze' }, 80),
        Code('c1', 'Implémente un BFS sur grille. <code>bfs(grille, depart, arrivee)</code> : grille = tableau de chaînes ("." libre, "#" mur), depart et arrivee = [ligne, colonne]. Renvoie le nombre minimal de pas (4-connexité), ou -1 s\'il n\'y a pas de chemin.', {
          fn: 'bfs',
          starter: 'function bfs(grille, depart, arrivee) {\n  const H = grille.length, W = grille[0].length;\n  const dist = Array.from({ length: H }, () => Array(W).fill(-1));\n  const file = [depart];\n  dist[depart[0]][depart[1]] = 0;\n  while (file.length) {\n    const [r, c] = file.shift();\n    // pour chaque voisin (haut, bas, gauche, droite) libre et non visité :\n    //   dist = dist actuelle + 1, l\'ajouter à la file\n  }\n  return dist[arrivee[0]][arrivee[1]];\n}',
          tests: [[[['...', '...', '...'], [0, 0], [2, 2]], 4], [[['.#.', '.#.', '...'], [0, 0], [0, 2]], 6], [[['.#.', '##.', '...'], [0, 0], [2, 2]], -1]],
          sol: 'function bfs(g, d, a) {\n  const H = g.length, W = g[0].length;\n  const dist = Array.from({ length: H }, () => Array(W).fill(-1));\n  const file = [d];\n  dist[d[0]][d[1]] = 0;\n  while (file.length) {\n    const [r, c] = file.shift();\n    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {\n      const nr = r + dr, nc = c + dc;\n      if (nr < 0 || nc < 0 || nr >= H || nc >= W) continue;\n      if (g[nr][nc] === "#" || dist[nr][nc] !== -1) continue;\n      dist[nr][nc] = dist[r][c] + 1;\n      file.push([nr, nc]);\n    }\n  }\n  return dist[a[0]][a[1]];\n}',
        }),
        Q('q1', 'Pourquoi A* explore-t-il généralement moins de cases que Dijkstra ?', ['Il est codé en C++', 'Son heuristique le guide vers l\'arrivée', 'Il ignore les murs', 'Il ne cherche pas le chemin optimal'], 1, 'h oriente l\'exploration ; Dijkstra s\'étend uniformément dans toutes les directions.'),
        Q('q2', 'Avec des zones de boue (coût 5), quel algorithme peut renvoyer un chemin non optimal en coût ?', ['Dijkstra', 'A* avec heuristique admissible', 'BFS', 'Aucun'], 2, 'BFS compte les pas, pas le coût : il traversera la boue sans hésiter.'),
      ],
      cards: [['Formule de A* ?', 'f = g + h.'], ['Heuristique admissible ?', 'Une estimation qui ne surestime jamais le coût réel restant.'], ['Différence BFS / Dijkstra ?', 'BFS ignore les coûts ; Dijkstra minimise le coût cumulé.'], ['Effet d\'un poids > 1 sur h ?', 'Recherche plus rapide, chemin possiblement sous-optimal.']],
    },
    {
      id: 'echantillonnage', title: 'Espace des configurations et planification par échantillonnage', sub: 'RRT, PRM', min: 25, level: 3,
      why: 'Pour un bras à 6 axes, une grille serait gigantesque (6 dimensions !). Les méthodes par échantillonnage contournent ce problème et sont au cœur des planificateurs de bras comme MoveIt.',
      objectives: ['Comprendre l\'espace des configurations (C-space)', 'Comprendre le principe de RRT et de PRM', 'Savoir pourquoi ces méthodes passent à l\'échelle en grande dimension'],
      blocks: [
        P('<p>L\'<strong>espace des configurations</strong> d\'un robot est l\'espace de toutes ses configurations possibles : (x, y, θ) pour un robot mobile, les 6 angles pour un bras 6 axes. Un obstacle dans le monde réel devient une région interdite dans cet espace. Planifier, c\'est trouver un chemin dans le C-space qui évite ces régions.</p>'),
        Warn('Discrétiser 6 angles avec 100 valeurs chacun donne 10¹² cases : impossible à stocker ou parcourir. C\'est la « malédiction de la dimension ». D\'où les méthodes qui échantillonnent au hasard.', 'Pourquoi pas une grille ?'),
        Pipe('RRT : Rapidly-exploring Random Tree', [
          ['Racine', 'L\'arbre commence à la configuration de départ.', 'q_départ', null],
          ['Tirage', 'On tire une configuration au hasard dans tout l\'espace.', 'q_rand', 'Parfois on tire directement le but pour accélérer (biais vers le but).'],
          ['Plus proche', 'On cherche le nœud de l\'arbre le plus proche de q_rand.', 'q_near', null],
          ['Extension', 'On fait un petit pas de q_near vers q_rand.', 'q_new', 'Le pas est limité pour pouvoir vérifier les collisions.'],
          ['Collision ?', 'Si le segment q_near → q_new est libre, on ajoute q_new à l\'arbre.', 'vérification de collision', 'C\'est l\'opération la plus coûteuse, déléguée à des bibliothèques comme FCL.'],
          ['But atteint ?', 'Si q_new est assez proche du but : chemin trouvé.', 'chemin', 'On le lisse ensuite, car il est souvent tortueux.'],
        ]),
        Table(['Méthode', 'Principe', 'Atout'], [
          ['RRT', 'arbre qui pousse aléatoirement depuis le départ', 'simple, rapide pour une requête unique'],
          ['RRT*', 'RRT qui recâble l\'arbre pour raccourcir', 'converge vers le chemin optimal'],
          ['PRM', 'réseau de configurations aléatoires reliées, construit une fois', 'réutilisable pour de nombreuses requêtes'],
          ['Optimisation de trajectoire (CHOMP, TrajOpt)', 'déformer une trajectoire initiale pour l\'éloigner des obstacles', 'trajectoires lisses'],
        ]),
        Real('MoveIt, le cadre de manipulation de ROS, utilise la bibliothèque OMPL qui contient des dizaines de planificateurs par échantillonnage. Quand tu cliques « planifier » pour un bras dans RViz, c\'est souvent un RRT-Connect (deux arbres qui poussent l\'un vers l\'autre) qui trouve le chemin.'),
        Q('q1', 'Pourquoi les méthodes par échantillonnage fonctionnent-elles pour un bras à 7 axes ?', ['Elles discrétisent finement chaque axe', 'Elles n\'explorent qu\'une petite partie de l\'espace, au hasard, sans le stocker en entier', 'Elles ignorent les collisions', 'Elles utilisent un GPU'], 1, 'On ne construit jamais la grille complète : on tire des échantillons et on teste les collisions localement.'),
      ],
      cards: [['Qu\'est-ce que l\'espace des configurations ?', 'L\'espace de toutes les configurations possibles du robot (ses variables articulaires ou sa pose).'], ['Principe de RRT ?', 'Faire pousser un arbre vers des configurations tirées au hasard en évitant les collisions.'], ['Différence RRT / PRM ?', 'RRT : une requête, arbre. PRM : réseau réutilisable pour plusieurs requêtes.']],
    },
    {
      id: 'navigation', title: 'Éviter les obstacles et naviguer', sub: 'Planification locale et pile de navigation', min: 22, level: 2,
      why: 'La carte ne contient pas la personne qui traverse le couloir. Le robot doit combiner un plan global (A*) et une réaction locale rapide. C\'est l\'architecture de toutes les piles de navigation modernes.',
      objectives: ['Distinguer planification globale et locale', 'Comprendre les champs de potentiel et la fenêtre dynamique (DWA)', 'Connaître l\'architecture de Nav2'],
      blocks: [
        Table(['Niveau', 'Rôle', 'Fréquence', 'Exemples'], [
          ['Planificateur global', 'chemin complet sur la carte connue', '0,1 à 1 Hz', 'A*, Dijkstra, Theta*, Hybrid-A*'],
          ['Contrôleur local', 'suivre le chemin en évitant ce qui bouge', '10 à 50 Hz', 'DWA, TEB, MPPI, pure pursuit régulé'],
          ['Carte de coûts (costmap)', 'fusion carte statique + obstacles détectés + marge de sécurité', 'en continu', 'couches statique, obstacles, inflation'],
          ['Comportements de récupération', 'que faire si on est bloqué', 'à la demande', 'reculer, tourner sur place, attendre, replanifier'],
        ]),
        H('Champs de potentiel'),
        P('<p>Le but attire le robot comme un aimant, les obstacles le repoussent. Le robot suit la force résultante. Simple et élégant, mais il peut rester coincé dans un minimum local (un obstacle en U), d\'où son usage limité en pratique.</p>'),
        H('Fenêtre dynamique (DWA)'),
        P('<p>À chaque cycle : on liste les vitesses (v, ω) atteignables compte tenu des accélérations maximales, on simule chacune sur une seconde, on écarte celles qui mènent à une collision, et on note les autres (proximité du chemin, vitesse, distance aux obstacles). On applique la meilleure.</p>'),
        Sim('sensors', { title: 'Rappel : ce que voit le capteur pour éviter les obstacles' }),
        Code('c1', 'Mini-DWA : écris <code>meilleureCommande(candidats)</code>. Chaque candidat est <code>{ v, w, distObstacle, ecartChemin }</code>. Écarte ceux dont distObstacle < 0,2. Score = 1,0·v + 0,5·distObstacle − 2,0·ecartChemin. Renvoie <code>[v, w]</code> du meilleur, ou <code>[0, 0]</code> s\'il n\'y en a aucun.', {
          fn: 'meilleureCommande',
          starter: 'function meilleureCommande(candidats) {\n  let best = null, bestScore = -Infinity;\n  for (const c of candidats) {\n    // filtrer, calculer le score, garder le meilleur\n  }\n  return best ? [best.v, best.w] : [0, 0];\n}',
          tests: [[[[{ v: 0.5, w: 0, distObstacle: 0.1, ecartChemin: 0 }, { v: 0.3, w: 0.5, distObstacle: 1, ecartChemin: 0.1 }]], [0.3, 0.5]], [[[{ v: 0.1, w: 0, distObstacle: 0.05, ecartChemin: 0 }]], [0, 0]], [[[{ v: 0.5, w: 0, distObstacle: 2, ecartChemin: 0.4 }, { v: 0.4, w: 0.2, distObstacle: 1.5, ecartChemin: 0 }]], [0.4, 0.2]]],
          sol: 'function meilleureCommande(cs) {\n  let best = null, bs = -Infinity;\n  for (const c of cs) {\n    if (c.distObstacle < 0.2) continue;\n    const s = c.v + 0.5 * c.distObstacle - 2 * c.ecartChemin;\n    if (s > bs) { bs = s; best = c; }\n  }\n  return best ? [best.v, best.w] : [0, 0];\n}',
        }),
        Real('Nav2, la pile de navigation de ROS 2, orchestre tout cela avec un arbre de comportement : calculer le chemin global, le suivre avec un contrôleur local, et si le robot est bloqué, déclencher des comportements de récupération. Elle tourne sur des milliers de robots en entrepôt, hôpital et service.'),
        Q('q1', 'Pourquoi séparer planificateur global et contrôleur local ?', ['Pour économiser de la mémoire', 'Le global est lent mais voit loin ; le local est rapide et réagit aux obstacles imprévus', 'C\'est une obligation légale', 'Pour utiliser deux processeurs'], 1, 'Chacun fait ce qu\'il fait bien, à la fréquence adaptée.'),
      ],
      cards: [['Global vs local en navigation ?', 'Global : chemin complet, lent. Local : suivi et évitement réactif, rapide.'], ['Principe du DWA ?', 'Simuler les vitesses atteignables, écarter les collisions, choisir la mieux notée.'], ['Défaut des champs de potentiel ?', 'Les minima locaux.'], ['Pile de navigation de ROS 2 ?', 'Nav2.']],
    },
  ],
};
