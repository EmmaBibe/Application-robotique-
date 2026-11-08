// Régénère sw.js avec la liste de tous les fichiers à mettre en cache pour le mode hors ligne.
// À lancer après chaque modification : node tools/build-sw.mjs
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const include = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
const files = [];
const walk = p => {
  const s = statSync(p);
  if (s.isDirectory()) readdirSync(p).sort().forEach(f => walk(join(p, f)));
  else files.push(relative(root, p).split('\\').join('/'));
};
include.forEach(f => walk(join(root, f)));

const hash = createHash('sha256');
files.forEach(f => hash.update(f).update(readFileSync(join(root, f))));
const version = hash.digest('hex').slice(0, 10);

const sw = `// Service worker : mise en cache pour l'usage hors ligne. Fichier généré par tools/build-sw.mjs.
const CACHE = 'robomaster-${version}';
const ASSETS = ${JSON.stringify(['./', ...files], null, 2)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
`;
writeFileSync(join(root, 'sw.js'), sw);
console.log(`sw.js : ${files.length} fichiers, version ${version}`);
