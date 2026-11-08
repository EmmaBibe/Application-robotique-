// Persistance locale de la progression. Tout reste sur l'appareil de l'étudiant.

const KEY = 'robomaster.v1';

const today = () => new Date().toISOString().slice(0, 10);

const blank = () => ({
  version: 1,
  profile: { name: '', created: today(), dailyGoal: 60, onboarded: false },
  lessons: {},          // id -> { done, doneAt, visits }
  quiz: {},             // questionId -> { ok, tries }
  exos: {},             // exoId -> { ok }
  defis: {},            // defiId -> { done, at }
  xp: 0,
  activity: {},         // 'YYYY-MM-DD' -> xp gagnés ce jour
  streak: { count: 0, best: 0, last: null },
  badges: {},           // badgeId -> date
  cards: {},            // cardId -> { box, due }
  notes: [],            // { id, title, body, tag, at }
  ideas: [],            // { id, problem, idea, proto, test, status, at }
  focus: { sessions: 0, minutes: 0 },
  sims: {},             // simId -> nb d'ouvertures
  last: null,           // dernière leçon ouverte
  settings: { theme: 'auto', reduceMotion: false, fontSize: 16, sound: false },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const data = JSON.parse(raw);
    return deepMerge(blank(), data);
  } catch {
    return blank();
  }
}

function deepMerge(base, extra) {
  for (const k of Object.keys(extra || {})) {
    const v = extra[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      base[k] = deepMerge(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage plein ou bloqué */ }
  }, 120);
}

export const store = {
  get: () => state,
  update(fn) {
    fn(state);
    persist();
    listeners.forEach(l => l(state));
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  export() { return JSON.stringify(state, null, 2); },
  import(json) {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object' || !('xp' in data)) throw new Error('Fichier non reconnu');
    state = deepMerge(blank(), data);
    persist();
    listeners.forEach(l => l(state));
  },
  reset() {
    state = blank();
    persist();
    listeners.forEach(l => l(state));
  },
  today,
};

// ---------- XP, niveaux, série ----------

export const LEVELS = [
  { xp: 0, name: 'Curieux' },
  { xp: 150, name: 'Apprenti' },
  { xp: 400, name: 'Bricoleur' },
  { xp: 800, name: 'Technicien' },
  { xp: 1400, name: 'Mécatronicien' },
  { xp: 2200, name: 'Concepteur' },
  { xp: 3200, name: 'Ingénieur' },
  { xp: 4500, name: 'Architecte robot' },
  { xp: 6200, name: 'Chercheur' },
  { xp: 8500, name: 'Pionnier' },
];

export function levelOf(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i + 1, name: cur.name, next, pct, toNext: next ? next.xp - xp : 0 };
}

export function addXP(amount, onLevelUp) {
  const before = levelOf(state.xp).index;
  store.update(s => {
    s.xp += amount;
    const d = today();
    s.activity[d] = (s.activity[d] || 0) + amount;
    touchStreak(s);
  });
  const after = levelOf(state.xp);
  if (after.index > before && onLevelUp) onLevelUp(after);
}

function touchStreak(s) {
  const d = today();
  if (s.streak.last === d) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  s.streak.count = s.streak.last === y ? s.streak.count + 1 : 1;
  s.streak.best = Math.max(s.streak.best, s.streak.count);
  s.streak.last = d;
}

export function currentStreak() {
  const s = state.streak;
  if (!s.last) return 0;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return (s.last === today() || s.last === y) ? s.count : 0;
}

// ---------- Répétition espacée (boîtes de Leitner) ----------

const BOX_DAYS = [0, 1, 3, 7, 16, 35, 90];

export function gradeCard(id, grade) {
  // grade : 0 = raté, 1 = difficile, 2 = bien, 3 = facile
  store.update(s => {
    const c = s.cards[id] || { box: 0, due: today() };
    if (grade === 0) c.box = 1;
    else if (grade === 1) c.box = Math.max(1, c.box);
    else if (grade === 2) c.box = Math.min(BOX_DAYS.length - 1, c.box + 1);
    else c.box = Math.min(BOX_DAYS.length - 1, c.box + 2);
    const days = grade === 0 ? 0 : BOX_DAYS[c.box];
    c.due = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
    s.cards[id] = c;
  });
}

export function isDue(id) {
  const c = state.cards[id];
  return !c || c.due <= today();
}
