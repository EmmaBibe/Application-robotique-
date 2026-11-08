import { P, H, Tip, Warn, Future, Real, Table, Pipe, Think, Manual, Info } from './b.js';

// Guide du Master : ce qui t'attend et comment t'y préparer.

export const GUIDE = [
  H('Ce qu\'on étudie dans un Master de robotique'),
  P('<p>Les intitulés varient d\'une université à l\'autre, mais on retrouve presque partout le même socle. Le tableau indique où chaque matière est préparée dans l\'application.</p>'),
  Table(['Matière du Master', 'Contenu typique', 'Préparé dans'], [
    ['Modélisation des robots', 'MGD, MGI, Denavit-Hartenberg, jacobienne, dynamique (Lagrange, Newton-Euler)', '<a href="#/m/bras">Bras manipulateurs</a>, <a href="#/m/maths">Maths</a>, <a href="#/m/physique">Physique</a>'],
    ['Automatique', 'fonctions de transfert, stabilité, PID, espace d\'état, commande optimale, commande non linéaire', '<a href="#/m/commande">Commande</a>'],
    ['Robotique mobile', 'cinématique, localisation, SLAM, planification, navigation', '<a href="#/m/mobile">Robots mobiles</a>, <a href="#/m/localisation">Localisation</a>, <a href="#/m/planification">Planification</a>'],
    ['Perception et vision', 'traitement d\'images, vision 3D, fusion de capteurs, filtrage de Kalman', '<a href="#/m/perception">Perception</a>, <a href="#/m/vision">Vision</a>'],
    ['Apprentissage automatique', 'apprentissage supervisé, réseaux profonds, renforcement', '<a href="#/m/ia">IA</a>'],
    ['Systèmes embarqués et temps réel', 'microcontrôleurs, RTOS, bus, architecture', '<a href="#/m/embarque">Systèmes embarqués</a>, <a href="#/m/electronique">Électronique</a>'],
    ['Logiciel robotique', 'ROS 2, C++, Python, simulation, génie logiciel', '<a href="#/m/ros">ROS 2</a>, <a href="#/m/programmation">Programmation</a>'],
    ['Mécatronique', 'actionneurs, transmissions, conception', '<a href="#/m/meca">Mécanique et actionneurs</a>'],
    ['Projets et stage', 'projet en équipe, stage de 4 à 6 mois en entreprise ou laboratoire', '<a href="#/projets">Projets réels</a>, <a href="#/m/systemes">Ingénierie système</a>, <a href="#/m/creativite">Créativité</a>'],
  ]),
  H('Les mathématiques à consolider en priorité'),
  P('<p>Ce sont elles qui font la différence dans les premiers mois. Si tu ne devais travailler que trois choses avant la rentrée :</p><ol><li><strong>Algèbre linéaire</strong> : matrices, produit matriciel, inverse, déterminant, valeurs propres. Tout y passe : repères, jacobienne, Kalman, espace d\'état, apprentissage.</li><li><strong>Équations différentielles</strong> : premier et second ordre, et leur résolution. C\'est le langage de l\'automatique.</li><li><strong>Probabilités</strong> : gaussiennes, Bayes, espérance, covariance. C\'est le langage de l\'estimation et de l\'apprentissage.</li></ol><p>Viennent ensuite l\'optimisation (gradient, moindres carrés) et la transformée de Laplace.</p>'),
  Tip('Ressources libres de qualité pour approfondir : les cours vidéo d\'algèbre linéaire des grandes universités en accès libre, la documentation officielle de ROS 2, et des livres de référence comme « Probabilistic Robotics » (Thrun, Burgard, Fox), « Modern Robotics » (Lynch et Park, avec vidéos gratuites), « Robotics, Vision and Control » (Corke). Lis-les avec un crayon et refais les calculs.', 'Pour aller plus loin'),
  H('Les outils à maîtriser avant la rentrée'),
  Table(['Outil', 'Niveau visé', 'Comment'], [
    ['Linux et terminal', 'à l\'aise au quotidien', 'installe Ubuntu (double démarrage ou WSL) et utilise-le pour tout'],
    ['Git', 'commit, branches, fusion, GitHub', 'versionne tous tes projets, même les exercices'],
    ['Python + NumPy + Matplotlib', 'écrire et tracer un calcul scientifique', 'refais les exercices de code de l\'application en Python'],
    ['C++ moderne', 'classes, vecteurs, compilation', 'réécris un simulateur simple (odométrie, PID) en C++'],
    ['ROS 2', 'lancer, inspecter, écrire un nœud', 'tutoriels officiels, puis le projet robot autonome'],
    ['Un outil de calcul (Python, MATLAB ou Octave)', 'simuler un système, tracer une réponse', 'refais les simulateurs PID et masse-ressort'],
    ['CAO (FreeCAD, Onshape)', 'modéliser une pièce simple', 'dessine une pièce de ton futur robot'],
  ]),
  H('Le calendrier conseillé'),
  Pipe('De maintenant à la fin du premier semestre', [
    ['Mois 1–2', 'Phase 1 du parcours : fondations. Installe Linux, Python, Git.', '20–30 min par jour', 'Ne saute pas les maths, même si tu es pressé d\'arriver aux robots.'],
    ['Mois 3–4', 'Phase 2 : mécanique, embarqué, mobile, bras, commande. Premier projet réel (veilleuse puis suiveur de ligne).', 'premier robot', 'Les difficultés du matériel réel valent mille exercices.'],
    ['Mois 5–6', 'Phase 3 : perception, localisation, planification, IA, ROS 2. Projet bras ou gyropode.', 'premier nœud ROS', null],
    ['Été', 'Phase 4 et projet robot autonome ROS 2. Portfolio GitHub. Révision des cartes.', 'arriver avec un projet', 'Un projet abouti à montrer change la façon dont on te regarde dès la rentrée.'],
    ['Premier semestre', 'Suis les cours en reliant chaque notion à ce que tu as déjà manipulé. Rejoins une association de robotique. Cherche ton stage tôt.', 'prendre de l\'avance', 'Tu auras le temps d\'approfondir là où les autres découvrent.'],
  ]),
  H('Réussir le Master au quotidien'),
  P('<ul><li><strong>Travaille en continu</strong> : une heure par jour vaut mieux que des nuits blanches avant les examens. La répétition espacée fait le gros du travail.</li><li><strong>Refais les démonstrations</strong> à la main : c\'est ce qui fait comprendre, et c\'est souvent ce qui est demandé.</li><li><strong>Relie théorie et pratique</strong> : pour chaque équation, demande-toi sur quel robot tu l\'as vue à l\'œuvre.</li><li><strong>Forme un groupe de travail</strong> de 3 ou 4 personnes : expliquer aux autres est la meilleure façon d\'apprendre.</li><li><strong>Va voir les enseignants</strong> : poser une question précise après avoir cherché seul est toujours bien reçu.</li><li><strong>Prends soin de toi</strong> : sommeil, sport, pauses. Ce ne sont pas des luxes, ce sont des conditions de la performance intellectuelle.</li></ul>'),
  H('Trouver un stage et préparer la suite'),
  P('<p>Le stage de fin d\'études (4 à 6 mois) est souvent la porte d\'entrée vers le premier emploi ou la thèse. Commence à chercher 6 à 9 mois avant. Ce qui fait la différence : un portfolio de projets concrets, une lettre qui montre que tu as compris les enjeux de l\'entreprise ou du laboratoire, et la capacité à parler de ce que tu as construit avec des chiffres.</p><p>Trois grandes voies après le Master : <strong>ingénieur en entreprise</strong> (industrie, startups, intégrateurs, automobile, aéronautique, santé, logistique), <strong>doctorat</strong> (3 ans de recherche, vers la recherche publique ou la R&D de pointe), <strong>entrepreneuriat</strong> (créer sa startup, souvent après quelques années d\'expérience).</p>'),
  Future('Les domaines qui recrutent et recruteront : robotique logistique et industrielle, robotique médicale et d\'assistance, véhicules et drones autonomes, robotique agricole, robots humanoïdes et généralistes, outils de simulation et d\'entraînement de robots, sécurité et certification des systèmes autonomes. Les profils qui combinent automatique classique, logiciel solide et apprentissage automatique sont particulièrement recherchés.', 'Ce qui se prépare'),
  Think('guide-t1', 'Écris en trois phrases pourquoi tu veux faire de la robotique et ce que tu aimerais avoir construit dans dix ans. Relis-le les jours où la motivation baisse.', 'Ce texte t\'appartient. Il servira aussi de base à tes lettres de motivation : les jurys et les recruteurs retiennent les candidats qui savent pourquoi ils sont là.'),
  Manual('guide-defi', 'Le dossier de candidature', 'Prépare un document d\'une page qui résume : ton parcours, trois projets (avec un lien vers ton dépôt Git), les compétences acquises dans ce parcours, et ce que tu cherches. Mets-le à jour à chaque nouveau projet.', 80),
];
