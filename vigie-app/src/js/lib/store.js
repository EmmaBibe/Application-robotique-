// Mémoire locale de l'application (rien ne quitte l'appareil) : réglages, pronostics, campagnes.
const KEY = 'vigie.app.v1';
const BASE = {
  onboarded: false,
  settings: { theme: 'auto', quality: 'auto' },
  pronostic: { n: 0, ok: 0, streak: 0, best: 0, last: [] },
  worlds: 0,
  campaigns: [],
};
let state;
try { state = { ...structuredClone(BASE), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { state = structuredClone(BASE); }
state.settings = { ...BASE.settings, ...state.settings };
state.pronostic = { ...BASE.pronostic, ...state.pronostic };
export const store = {
  get: () => state,
  update(fn) { fn(state); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage plein ou bloqué */ } },
  reset(part) { this.update(s => { s[part] = structuredClone(BASE[part]); }); },
};
