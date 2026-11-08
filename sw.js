// Service worker : mise en cache pour l'usage hors ligne. Fichier généré par tools/build-sw.mjs.
const CACHE = 'robomaster-e25c9a969f';
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/app.js",
  "js/content/b.js",
  "js/content/glossary.js",
  "js/content/guide.js",
  "js/content/index.js",
  "js/content/m-coeur.js",
  "js/content/m-fondations.js",
  "js/content/m-ia-ros.js",
  "js/content/m-ingenieur.js",
  "js/content/m-perception.js",
  "js/content/m-physique.js",
  "js/content/m-prog.js",
  "js/content/m-robots.js",
  "js/content/projects.js",
  "js/core/gamify.js",
  "js/core/kit.js",
  "js/core/store.js",
  "js/core/ui.js",
  "js/sims/adc.js",
  "js/sims/arm2r.js",
  "js/sims/diffdrive.js",
  "js/sims/filter.js",
  "js/sims/gears.js",
  "js/sims/index.js",
  "js/sims/linecode.js",
  "js/sims/motion.js",
  "js/sims/ohm.js",
  "js/sims/particles.js",
  "js/sims/pathplan.js",
  "js/sims/perceptron.js",
  "js/sims/pid.js",
  "js/sims/pwm.js",
  "js/sims/qlearning.js",
  "js/sims/rosgraph.js",
  "js/sims/sensors.js",
  "js/sims/spring.js",
  "js/sims/transform.js",
  "js/sims/trig.js",
  "js/sims/vectors.js",
  "js/sims/vision.js",
  "js/views/blocks.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/icons/icon.svg"
];

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
