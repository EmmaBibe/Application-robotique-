// Assemble l'application VIGIE dans dist/www : ses propres fichiers (src/) et le cœur partagé avec RoboMaster,
// copié depuis le dépôt (une seule version de VIGIE, celle que vérifient les tests du banc), puis le service worker.
// Usage : node vigie-app/build.mjs
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const app = dirname(new URL(import.meta.url).pathname), repo = join(app, '..'), out = join(app, 'dist', 'www');
rmSync(join(app, 'dist'), { recursive: true, force: true }); mkdirSync(out, { recursive: true });
cpSync(join(app, 'src'), out, { recursive: true });
const shared = ['js/sims/vigie-core.js', 'js/sims/vigie6', 'js/sims/vigie3d.js', 'js/sims/vigie3d', 'js/vendor/three', 'css/vigie3d.css'];
for (const p of shared) cpSync(join(repo, p), join(out, p), { recursive: true });
const files = [];
const walk = p => { if (statSync(p).isDirectory()) readdirSync(p).sort().forEach(f => walk(join(p, f))); else files.push(relative(out, p).split('\\').join('/')); };
walk(out);
const hash = createHash('sha256'); files.forEach(f => hash.update(f).update(readFileSync(join(out, f))));
const version = hash.digest('hex').slice(0, 10);
writeFileSync(join(out, 'sw.js'), `// Service worker de l'application VIGIE (généré par vigie-app/build.mjs) : tout fonctionne hors ligne.
const CACHE = 'vigie-${version}';
const ASSETS = ${JSON.stringify(['./', ...files], null, 2)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)).catch(() => caches.match('./index.html')));
});
`);
console.log(`dist/www : ${files.length + 1} fichiers, version ${version}`);
