import { P, H, Tip, Warn, Danger, Future, Real, Table, Pipe, Think } from './b.js';

// Projets réels, du premier montage au robot autonome sous ROS 2.

export const PROJECTS = [
  {
    id: 'led-capteur', icon: '💡', title: 'Veilleuse intelligente', level: 1, budget: '≈ 25 €', duration: '1 après-midi',
    desc: 'Ton premier montage : une LED qui s\'allume progressivement quand la lumière baisse. Loi d\'Ohm, pont diviseur, CAN et PWM en un seul projet.',
    skills: ['électronique', 'Arduino'],
    blocks: [
      H('Matériel'),
      Table(['Composant', 'Quantité', 'Rôle'], [
        ['Carte Arduino Uno (ou compatible)', '1', 'le cerveau'], ['Plaque d\'essai et fils', '1 kit', 'câbler sans souder'],
        ['Photorésistance (LDR)', '1', 'capteur de lumière'], ['Résistance 10 kΩ', '1', 'pont diviseur'],
        ['LED + résistance 220 Ω', '1 + 1', 'la veilleuse'], ['Câble USB', '1', 'alimentation et programmation'],
      ]),
      H('Étapes'),
      Pipe('Du montage au programme', [
        ['Pont diviseur', 'LDR entre 5 V et A0, 10 kΩ entre A0 et GND.', 'A0 lit la lumière', 'Revois la leçon sur le pont diviseur.'],
        ['LED', 'Broche 9 → résistance 220 Ω → LED → GND.', 'broche PWM', 'La broche 9 sait faire de la PWM (symbole ~ sur la carte).'],
        ['Lire', 'analogRead(A0) dans loop(), afficher sur le moniteur série.', 'valeurs 0–1023', 'Note les valeurs en plein jour et dans le noir : c\'est ton étalonnage.'],
        ['Décider', 'Convertir la lumière en luminosité de LED avec map() et constrain().', 'plus il fait sombre, plus la LED brille', null],
        ['Agir', 'analogWrite(9, valeur).', 'PWM 0–255', null],
        ['Améliorer', 'Moyenne glissante pour éviter le scintillement, hystérésis pour l\'extinction.', 'filtrage', 'Tu appliques les leçons de filtrage.'],
      ]),
      P('<pre><code>const int CAPTEUR = A0, LED = 9;\nint sombre = 200, clair = 800;   // à étalonner\nfloat lissee = 0;\n\nvoid setup() { Serial.begin(115200); pinMode(LED, OUTPUT); }\n\nvoid loop() {\n  int brut = analogRead(CAPTEUR);\n  lissee = 0.9 * lissee + 0.1 * brut;          // filtre passe-bas\n  int pwm = map((int)lissee, clair, sombre, 0, 255);\n  analogWrite(LED, constrain(pwm, 0, 255));\n  Serial.println(brut);\n  delay(20);\n}</code></pre>'),
      Tip('Si les valeurs varient à l\'envers de ce que tu attends, inverse la LDR et la résistance de 10 kΩ dans le pont, ou inverse les bornes de map().', 'Dépannage'),
    ],
  },
  {
    id: 'suiveur', icon: '🛤️', title: 'Robot suiveur de ligne', level: 2, budget: '≈ 60 €', duration: '1 à 2 week-ends',
    desc: 'Le grand classique : un robot à deux roues qui suit une ligne noire, d\'abord en tout-ou-rien, puis en PID. Le même code que dans le simulateur, sur du vrai matériel.',
    skills: ['moteurs', 'capteurs', 'PID'],
    blocks: [
      H('Matériel'),
      Table(['Composant', 'Remarque'], [
        ['Châssis 2 roues + roue folle', 'kit de châssis acrylique, ou impression 3D'],
        ['2 motoréducteurs 6 V (type TT, ou N20 avec encodeurs)', 'les N20 à encodeurs permettent l\'odométrie'],
        ['Driver de moteurs TB6612FNG', 'plus efficace que le L298N'],
        ['Barrette de 5 capteurs infrarouges (type TCRT5000)', 'les mêmes que dans le simulateur'],
        ['Arduino Nano ou ESP32', 'ESP32 si tu veux du Wi-Fi pour régler les gains depuis ton téléphone'],
        ['Batterie 2S LiPo 7,4 V ou 6 piles AA + interrupteur', 'interrupteur obligatoire'],
        ['Ruban adhésif noir d\'électricien, grande feuille blanche', 'la piste'],
      ]),
      H('Étapes'),
      Pipe('Construction progressive', [
        ['Moteurs seuls', 'Fais tourner chaque roue dans les deux sens via le driver.', 'test unitaire', 'Vérifie que « avant » est bien « avant » pour les deux roues. Sinon, inverse les fils du moteur.'],
        ['Capteurs seuls', 'Affiche les 5 valeurs au-dessus du blanc puis du noir.', 'étalonnage', 'Hauteur idéale : 3 à 8 mm au-dessus du sol.'],
        ['Tout-ou-rien', 'Le code « simple » du simulateur.', 'premier tour', 'Ça zigzague : c\'est normal.'],
        ['Proportionnel', 'Position de ligne par barycentre, correction proportionnelle.', 'plus fluide', null],
        ['PID', 'Ajoute D pour amortir, I si le robot dérive d\'un côté.', 'réglage', 'Règle à vitesse faible, puis augmente progressivement.'],
        ['Mesurer', 'Chronomètre trois tours, compte les sorties.', 'chiffres', 'Compare tes réglages avec des mesures, pas des impressions.'],
      ]),
      Warn('Les batteries LiPo exigent un chargeur adapté et de la vigilance (voir la leçon sur l\'énergie). Pour un premier robot, des piles AA rechargeables sont plus sûres.', 'Batterie'),
      Think('t1', 'Ton robot suit parfaitement la ligne sur ta piste, mais sort systématiquement dans les virages d\'une piste de compétition. Liste trois causes possibles et un test pour chacune.', 'Causes : vitesse trop élevée pour la courbure (test : réduire la vitesse de base et observer), capteurs trop proches de l\'axe des roues donc trop peu d\'anticipation (test : déplacer la barrette vers l\'avant), éclairage différent qui change les valeurs des capteurs (test : afficher les valeurs sur la nouvelle piste et réétalonner).'),
    ],
  },
  {
    id: 'bras-servo', icon: '🦾', title: 'Bras robotique à servos', level: 2, budget: '≈ 70 €', duration: '2 week-ends',
    desc: 'Un petit bras plan à deux ou trois servomoteurs, commandé par modèle géométrique inverse : tu cliques un point, il y va.',
    skills: ['cinématique', 'MGI', 'mécanique'],
    blocks: [
      H('Matériel'),
      Table(['Composant', 'Remarque'], [
        ['3 servomoteurs (type MG996R ou MG90S selon la taille)', 'métal de préférence pour la robustesse'],
        ['Structure', 'impression 3D, découpe laser, ou kit de bras en acrylique'],
        ['Alimentation 5–6 V, au moins 3 A', 'les servos consomment beaucoup au démarrage : pas sur l\'USB'],
        ['Arduino ou ESP32 + carte de pilotage PCA9685 (I²C)', 'pour commander proprement plusieurs servos'],
        ['Petite pince à servo (optionnel)', 'pour saisir des objets légers'],
      ]),
      Pipe('Étapes', [
        ['Mesurer', 'Mesure précisément L₁ et L₂ entre les axes.', 'L₁ = 10,5 cm, L₂ = 9,8 cm', 'Une erreur de longueur se retrouve directement dans la précision.'],
        ['Étalonner les servos', 'Trouve l\'impulsion qui correspond à 0° et à 90° pour chacun.', 'table de correspondance', 'Les servos bon marché ne sont jamais exactement à l\'angle demandé.'],
        ['MGD', 'Vérifie que l\'effecteur arrive où le MGD le prédit.', 'mesure à la règle', null],
        ['MGI', 'Implémente le code de la leçon, choisis coude haut ou bas.', 'cible → angles', null],
        ['Trajectoires', 'Interpolation cubique entre deux points pour un mouvement doux.', 'plus de saccades', null],
        ['Interface', 'Envoie des cibles depuis l\'ordinateur par liaison série.', 'clic → mouvement', 'Un petit script Python avec pyserial suffit.'],
      ]),
      Danger('Même un petit bras peut pincer les doigts. Garde une main sur l\'interrupteur d\'alimentation pendant les premiers essais.', 'Sécurité'),
    ],
  },
  {
    id: 'robot-ros', icon: '🤖', title: 'Robot autonome sous ROS 2', level: 4, budget: '≈ 250 à 400 €', duration: '1 à 3 mois',
    desc: 'Le projet qui te prépare le mieux au Master : un robot différentiel avec lidar, odométrie, SLAM et navigation autonome Nav2.',
    skills: ['ROS 2', 'SLAM', 'Nav2', 'embarqué'],
    blocks: [
      H('Architecture'),
      Table(['Élément', 'Choix possible'], [
        ['Calculateur principal', 'Raspberry Pi 4/5 sous Ubuntu + ROS 2 LTS'],
        ['Microcontrôleur', 'ESP32 ou Raspberry Pi Pico avec micro-ROS, ou communication série'],
        ['Moteurs', '2 motoréducteurs avec encodeurs'],
        ['Driver', 'TB6612FNG ou DRV8833'],
        ['Lidar 2D', 'lidar 360° d\'entrée de gamme (quelques dizaines à une centaine d\'euros)'],
        ['IMU (option)', 'centrale 6 ou 9 axes en I²C'],
        ['Énergie', 'batterie 3S avec régulateur 5 V pour le Pi, interrupteur et arrêt d\'urgence'],
      ]),
      Pipe('Feuille de route', [
        ['Base mobile', 'Moteurs + encodeurs + asservissement de vitesse sur le microcontrôleur.', 'PID de vitesse', 'Teste le suivi d\'une consigne de vitesse avant toute chose.'],
        ['Odométrie', 'Calcul de la pose, publication de /odom et de la transformation odom → base_link.', 'robot visible dans RViz', null],
        ['Description', 'URDF du robot : base, roues, lidar.', 'modèle 3D', null],
        ['Lidar', 'Driver ROS 2 du lidar, topic /scan.', 'scan dans RViz', null],
        ['SLAM', 'slam_toolbox : téléopère le robot et construis la carte.', 'carte de ton logement', 'Enregistre la carte pour la réutiliser.'],
        ['Navigation', 'Nav2 avec AMCL sur la carte enregistrée.', 'clic dans RViz → le robot y va seul', 'Règle les rayons d\'inflation et les vitesses maximales.'],
        ['Mission', 'Arbre de comportement ou script : patrouiller entre plusieurs points.', 'autonomie', null],
        ['Simulation', 'Le même robot dans Gazebo pour tester sans risque.', 'jumeau numérique', 'Indispensable pour itérer vite.'],
      ]),
      Tip('Des plateformes éducatives complètes existent si tu préfères commencer par le logiciel. Construire la tienne apprend davantage, mais demande plus de temps : les deux approches sont valables.', 'Acheter ou construire ?'),
      Future('Prolongement possible : ajouter une caméra et un modèle de détection d\'objets pour que le robot cherche un objet demandé, ou une interface vocale avec un modèle de langage qui traduit une consigne en points de navigation.'),
    ],
  },
  {
    id: 'pendule', icon: '⚖️', title: 'Robot gyropode (pendule inversé)', level: 3, budget: '≈ 80 €', duration: '2 à 4 week-ends',
    desc: 'Un robot sur deux roues qui tient en équilibre tout seul. Centrale inertielle, filtre complémentaire et PID rapide : la meilleure école de l\'automatique.',
    skills: ['IMU', 'filtrage', 'commande'],
    blocks: [
      Table(['Composant', 'Remarque'], [
        ['2 moteurs (pas-à-pas NEMA 17 ou motoréducteurs DC à faible jeu)', 'le jeu des réducteurs est l\'ennemi de l\'équilibre'],
        ['Drivers adaptés (A4988/TMC2209 pour pas-à-pas)', ''],
        ['IMU 6 axes (MPU-6050 ou plus récente)', 'fixée rigidement, près de l\'axe des roues'],
        ['ESP32', 'assez rapide pour une boucle à 200–500 Hz'],
        ['Châssis haut, batterie placée en hauteur', 'un pendule haut est plus lent, donc plus facile à stabiliser'],
      ]),
      Pipe('Étapes', [
        ['Mesurer l\'angle', 'Filtre complémentaire, α ≈ 0,98, boucle à fréquence fixe.', 'angle stable', 'Vérifie que l\'angle ne dérive pas et réagit vite.'],
        ['Point d\'équilibre', 'Trouve l\'angle où le robot tient en équilibre à la main.', 'offset', null],
        ['PID d\'angle', 'Kp d\'abord, puis Kd. Ki très faible.', 'il tient quelques secondes', 'Commence avec le robot tenu par une ficelle.'],
        ['Boucle de vitesse', 'Une seconde boucle, plus lente, corrige la dérive en position.', 'cascade', 'Sinon le robot tient debout mais part en roulant.'],
        ['Télécommande', 'Pencher la consigne d\'angle pour avancer.', 'pilotage', null],
      ]),
      Tip('Si le robot oscille de plus en plus vite : Kp trop grand ou Kd trop petit. S\'il tombe lentement sans réagir : Kp trop faible. S\'il vibre : bruit sur la dérivée, filtre-la ou réduis Kd.', 'Diagnostic rapide'),
    ],
  },
];
