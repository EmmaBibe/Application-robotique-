// Organisation du parcours : phases, modules, leçons.
import { demarrer, maths } from './m-fondations.js';
import { physique, electronique } from './m-physique.js';
import { programmation } from './m-prog.js';
import { meca, embarque } from './m-coeur.js';
import { mobile, bras, commande } from './m-robots.js';
import { perception, vision, localisation, planification } from './m-perception.js';
import { ia, ros } from './m-ia-ros.js';
import { systemes, creativite, futur } from './m-ingenieur.js';

export const PHASES = [
  { id: 'fondations', short: 'Phase 1', title: 'Fondations', desc: 'Les bases indispensables : comprendre ce qu\'est un robot, et acquérir les outils mathématiques, physiques, électroniques et informatiques. Rien n\'est supposé connu.' },
  { id: 'coeur', short: 'Phase 2', title: 'Le cœur de la robotique', desc: 'Construire et faire bouger un robot : mécanique, actionneurs, systèmes embarqués, robots mobiles, bras manipulateurs et automatique.' },
  { id: 'intelligence', short: 'Phase 3', title: 'Le robot intelligent', desc: 'Percevoir, se localiser, planifier, apprendre : tout ce qui rend un robot autonome, jusqu\'à l\'IA et ROS 2.' },
  { id: 'ingenieur', short: 'Phase 4', title: 'L\'ingénieur de demain', desc: 'Mener un projet, garantir la sécurité, inventer, communiquer et anticiper l\'avenir de la robotique.' },
];

export const MODULES = [
  demarrer, maths, physique, electronique, programmation,
  meca, embarque, mobile, bras, commande,
  perception, vision, localisation, planification, ia, ros,
  systemes, creativite, futur,
];

const byId = new Map();
const modOf = new Map();
const flat = [];
for (const m of MODULES) for (const l of m.lessons) { byId.set(l.id, l); modOf.set(l.id, m); flat.push(l); }

export const lessonById = id => byId.get(id);
export const moduleOf = id => modOf.get(id);
export const allLessons = () => flat;
