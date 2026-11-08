// Catalogue des simulateurs. Chacun est chargé à la demande.

export const SIMS = {
  vectors: { title: 'Laboratoire des vecteurs', domain: 'Maths', icon: '↗', desc: 'Somme, produit scalaire, projection : manipule les vecteurs au doigt.', load: () => import('./vectors.js') },
  trig: { title: 'Cercle trigonométrique', domain: 'Maths', icon: '◷', desc: 'Sinus, cosinus et radians reliés à un bras qui tourne.', load: () => import('./trig.js') },
  transform: { title: 'Repères et matrices', domain: 'Maths', icon: '⊞', desc: 'Matrice homogène : passer du repère du robot à celui du monde.', load: () => import('./transform.js') },
  motion: { title: 'Profil de mouvement', domain: 'Physique', icon: '⇢', desc: 'Position, vitesse, accélération et profil trapézoïdal.', load: () => import('./motion.js') },
  spring: { title: 'Masse-ressort-amortisseur', domain: 'Physique', icon: '≋', desc: 'Le système du second ordre et ses trois régimes.', load: () => import('./spring.js') },
  gears: { title: 'Engrenages', domain: 'Mécanique', icon: '⚙', desc: 'Rapport de réduction, couple, vitesse et rendement.', load: () => import('./gears.js') },
  ohm: { title: 'Loi d\'Ohm et LED', domain: 'Électronique', icon: 'Ω', desc: 'Pile, résistance, LED et pont diviseur avec courant visible.', load: () => import('./ohm.js') },
  pwm: { title: 'PWM et pont en H', domain: 'Électronique', icon: '⎍', desc: 'Faire varier la vitesse et le sens d\'un moteur à courant continu.', load: () => import('./pwm.js') },
  adc: { title: 'Conversion analogique-numérique', domain: 'Électronique', icon: '⌇', desc: 'Échantillonnage, quantification, Nyquist et repliement.', load: () => import('./adc.js') },
  diffdrive: { title: 'Robot différentiel', domain: 'Cinématique', icon: '◉', desc: 'Pilote un robot à deux roues et observe la dérive de l\'odométrie.', load: () => import('./diffdrive.js') },
  arm2r: { title: 'Bras 2 axes', domain: 'Cinématique', icon: '⟋', desc: 'Modèles géométriques direct et inverse, espace de travail.', load: () => import('./arm2r.js') },
  pid: { title: 'Régulateur PID', domain: 'Commande', icon: '∿', desc: 'Asservis un moteur : dépassement, temps de réponse, erreur.', load: () => import('./pid.js') },
  sensors: { title: 'Capteurs de distance', domain: 'Perception', icon: '◎', desc: 'Lidar, ultrason, infrarouge : ce que voit vraiment le robot.', load: () => import('./sensors.js') },
  filter: { title: 'Filtrage et Kalman', domain: 'Perception', icon: '〰', desc: 'Moyenne glissante, passe-bas et filtre de Kalman face au bruit.', load: () => import('./filter.js') },
  particles: { title: 'Filtre particulaire', domain: 'Localisation', icon: '⁘', desc: 'Un robot perdu retrouve sa position grâce aux probabilités.', load: () => import('./particles.js') },
  pathplan: { title: 'Planificateur de chemin', domain: 'Planification', icon: '⌖', desc: 'BFS, Dijkstra, A* et glouton sur une carte que tu dessines.', load: () => import('./pathplan.js') },
  vision: { title: 'Vision : convolution', domain: 'Vision', icon: '▦', desc: 'Flou, contours, seuillage : l\'image vue comme des nombres.', load: () => import('./vision.js') },
  perceptron: { title: 'Neurone artificiel', domain: 'IA', icon: '⦿', desc: 'Un perceptron apprend à classer des points en direct.', load: () => import('./perceptron.js') },
  qlearning: { title: 'Q-learning', domain: 'IA', icon: '⚡', desc: 'Un robot apprend seul, par essais et erreurs, à rejoindre sa base.', load: () => import('./qlearning.js') },
  linecode: { title: 'Code ton suiveur de ligne', domain: 'Programmation', icon: '⌨', desc: 'Écris le programme du robot en JavaScript et lance-le sur la piste.', load: () => import('./linecode.js') },
  rosgraph: { title: 'Graphe ROS 2', domain: 'Logiciel robot', icon: '⧉', desc: 'Nœuds, topics, messages : l\'architecture logicielle d\'un robot.', load: () => import('./rosgraph.js') },
};

export async function mountSim(id, el, opts = {}, api = {}) {
  const meta = SIMS[id];
  if (!meta) { el.textContent = `Simulateur inconnu : ${id}`; return () => {}; }
  try {
    const mod = await meta.load();
    return mod.default(el, opts, api) || (() => {});
  } catch (e) {
    console.error(e);
    el.innerHTML = '<div class="card">Impossible de charger ce simulateur. Vérifie ta connexion puis recharge la page.</div>';
    return () => {};
  }
}
