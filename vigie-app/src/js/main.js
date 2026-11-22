// Application VIGIE : navigation et thème.
import { store } from './lib/store.js';

const SCREENS = {
  accueil: { title: '', load: () => import('./screens/accueil.js') },
  simulateur: { title: 'Dans sa tête', full: true, load: () => import('./screens/simulateur.js') },
  atelier: { title: 'Atelier « et si… ? »', load: () => import('./screens/atelier.js') },
  banc: { title: 'Banc de poche', load: () => import('./screens/banc.js') },
  savoir: { title: 'Ce qu\'on sait', load: () => import('./screens/savoir.js') },
  reglages: { title: 'Réglages', load: () => import('./screens/reglages.js') },
};

export function applyTheme() {
  const t = store.get().settings.theme;
  const dark = t === 'dark' || (t === 'auto' && !matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#142039' : '#ffffff');
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);
applyTheme();

const view = document.getElementById('view');
let cleanup = null, token = 0;
async function route() {
  const [path, q] = (location.hash.slice(2) || 'accueil').split('?');
  const name = SCREENS[path] ? path : 'accueil', meta = SCREENS[name], params = Object.fromEntries(new URLSearchParams(q || ''));
  const my = ++token;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.r === name));
  document.getElementById('top-title').textContent = meta.title;
  view.classList.toggle('full', !!meta.full); view.innerHTML = ''; view.scrollTop = 0;
  const mod = await meta.load();
  if (my !== token) return;
  cleanup = mod.default(view, params) || null;
}
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:' && !/RoboMasterApp|VigieApp/.test(navigator.userAgent)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
