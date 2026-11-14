// Récompenses : XP, badges, objectif quotidien.
import { store, addXP, levelOf, currentStreak } from './store.js';
import { toast } from './ui.js';

export const XP = { lesson: 40, quiz: 10, exo: 15, defi: 60, code: 25, card: 2, focus: 15, idea: 10 };

export const BADGES = [
  { id: 'first', icon: '🚀', name: 'Premier pas', desc: 'Terminer ta première leçon' },
  { id: 'l5', icon: '📘', name: 'Lancé', desc: 'Terminer 5 leçons' },
  { id: 'l20', icon: '📚', name: 'Assidu', desc: 'Terminer 20 leçons' },
  { id: 'l40', icon: '🎓', name: 'Érudit', desc: 'Terminer 40 leçons' },
  { id: 'all', icon: '🏛️', name: 'Parcours complet', desc: 'Terminer toutes les leçons' },
  { id: 'found', icon: '🧱', name: 'Fondations solides', desc: 'Finir tous les modules de la phase Fondations' },
  { id: 's3', icon: '🔥', name: 'Trois jours', desc: 'Apprendre 3 jours de suite' },
  { id: 's7', icon: '🔥', name: 'Une semaine', desc: 'Apprendre 7 jours de suite' },
  { id: 's30', icon: '🌋', name: 'Un mois', desc: 'Apprendre 30 jours de suite' },
  { id: 'd1', icon: '🎯', name: 'Premier défi', desc: 'Réussir un défi' },
  { id: 'd5', icon: '🏆', name: 'Compétiteur', desc: 'Réussir 5 défis' },
  { id: 'd12', icon: '👑', name: 'Maître des défis', desc: 'Réussir 12 défis' },
  { id: 'q25', icon: '🧠', name: 'Esprit vif', desc: '25 bonnes réponses du premier coup' },
  { id: 'code3', icon: '💻', name: 'Codeur', desc: 'Réussir 3 exercices de code' },
  { id: 'lab8', icon: '🧪', name: 'Expérimentateur', desc: 'Ouvrir 8 simulateurs différents' },
  { id: 'idea3', icon: '💡', name: 'Inventeur', desc: 'Noter 3 idées dans ton carnet' },
  { id: 'cards50', icon: '🗂️', name: 'Mémoire d\'acier', desc: 'Réviser 50 cartes' },
  { id: 'focus5', icon: '⏱️', name: 'Concentré', desc: 'Terminer 5 sessions de concentration' },
  { id: 'lvl5', icon: '⚙️', name: 'Mécatronicien', desc: 'Atteindre le niveau 5' },
  { id: 'lvl8', icon: '🤖', name: 'Architecte', desc: 'Atteindre le niveau 8' },
  { id: 'front', icon: '🧭', name: 'Explorateur des frontières', desc: 'Finir tous les modules de la phase Frontières' },
  { id: 'mars5', icon: '🛰️', name: 'En route', desc: 'Accomplir 5 missions de la campagne Objectif Mars' },
  { id: 'mars', icon: '🔴', name: 'Pionnier martien', desc: 'Accomplir toute la campagne Objectif Mars' },
  { id: 'dos3', icon: '📁', name: 'Ingénieur rigoureux', desc: 'Rendre 3 dossiers d\'ingénieur' },
];

let modulesRef = [];
export function setModules(m) { modulesRef = m; }

export function gain(amount, reason) {
  addXP(amount, lvl => toast(`Niveau ${lvl.index} atteint : ${lvl.name}`, 'Continue comme ça, chaque niveau t\'ouvre de nouveaux horizons.', 'badge'));
  if (reason) toast(`+${amount} XP`, reason);
  checkBadges();
}

export function checkBadges() {
  const s = store.get();
  const doneL = Object.values(s.lessons).filter(l => l.done).length;
  const total = modulesRef.reduce((n, m) => n + m.lessons.length, 0);
  const defis = Object.values(s.defis).filter(d => d.done).length;
  const quizOk = Object.values(s.quiz).filter(q => q.ok && q.tries === 1).length;
  const codeOk = Object.entries(s.exos).filter(([k, v]) => k.startsWith('code:') && v.ok).length;
  const reviewed = s.cardReviews || 0;
  const found = modulesRef.filter(m => m.phase === 'fondations');
  const foundDone = found.length && found.every(m => m.lessons.every(l => s.lessons[l.id]?.done));
  const phaseDone = ph => { const ms = modulesRef.filter(m => m.phase === ph); return ms.length && ms.every(m => m.lessons.every(l => s.lessons[l.id]?.done)); };
  const marsMod = modulesRef.find(m => m.id === 'mars');
  const marsN = marsMod ? marsMod.lessons.filter(l => s.lessons[l.id]?.done).length : 0;
  const dosIds = new Set(modulesRef.flatMap(m => m.lessons.flatMap(l => l.blocks.filter(b => b && b.t === 'dossier').map(b => b.id))));
  const dosN = [...dosIds].filter(id => s.defis[id]?.done).length;
  const lvl = levelOf(s.xp).index;
  const st = Math.max(currentStreak(), 0);
  const rules = {
    first: doneL >= 1, l5: doneL >= 5, l20: doneL >= 20, l40: doneL >= 40, all: total > 0 && doneL >= total,
    found: foundDone, s3: st >= 3, s7: st >= 7, s30: st >= 30,
    d1: defis >= 1, d5: defis >= 5, d12: defis >= 12, q25: quizOk >= 25, code3: codeOk >= 3,
    lab8: Object.keys(s.sims).length >= 8, idea3: s.ideas.length >= 3, cards50: reviewed >= 50,
    focus5: s.focus.sessions >= 5, lvl5: lvl >= 5, lvl8: lvl >= 8,
    front: phaseDone('frontieres'), mars5: marsN >= 5, mars: !!marsMod && marsN >= marsMod.lessons.length, dos3: dosN >= 3,
  };
  const fresh = BADGES.filter(b => rules[b.id] && !s.badges[b.id]);
  if (!fresh.length) return;
  store.update(st2 => { for (const b of fresh) st2.badges[b.id] = store.today(); });
  fresh.forEach((b, i) => setTimeout(() => toast(`Badge débloqué ${b.icon}`, `${b.name} : ${b.desc}`, 'badge'), 400 + i * 600));
}

export function todayXP() { return store.get().activity[store.today()] || 0; }
