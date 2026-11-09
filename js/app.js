// RoboMaster : point d'entrée. Routeur, navigation, et toutes les pages.
import { store, levelOf, LEVELS, currentStreak, gradeCard, isDue } from './core/store.js';
import { gain, XP, BADGES, checkBadges, setModules, todayXP } from './core/gamify.js';
import { esc, toast, modal, confirmBox, download, icon, fmtDate } from './core/ui.js';
import { renderBlocks } from './views/blocks.js';
import { SIMS, mountSim } from './sims/index.js';
import { PHASES, MODULES, lessonById, moduleOf, allLessons } from './content/index.js';
import { GLOSSARY } from './content/glossary.js';
import { PROJECTS } from './content/projects.js';
import { GUIDE } from './content/guide.js';

setModules(MODULES);
const main = document.getElementById('main');
let cleanup = null;

// ---------------------------------------------------------------- navigation

const NAV = [
  { href: '#/', label: 'Accueil', ico: 'home' },
  { href: '#/parcours', label: 'Parcours', ico: 'map' },
  { href: '#/labo', label: 'Labo', ico: 'flask' },
  { href: '#/defis', label: 'Défis', ico: 'trophy' },
  { href: '#/revision', label: 'Révision', ico: 'cards', pill: () => dueCards().length || '' },
  { sep: 'Devenir ingénieur' },
  { href: '#/projets', label: 'Projets réels', ico: 'tool' },
  { href: '#/master', label: 'Guide du Master', ico: 'grad' },
  { href: '#/carnet', label: 'Carnet d\'ingénieur', ico: 'pen' },
  { href: '#/glossaire', label: 'Glossaire', ico: 'book' },
  { href: '#/profil', label: 'Profil et réglages', ico: 'user' },
];
const TABS = [
  { href: '#/', label: 'Accueil', ico: 'home' },
  { href: '#/parcours', label: 'Parcours', ico: 'map' },
  { href: '#/labo', label: 'Labo', ico: 'flask' },
  { href: '#/revision', label: 'Révision', ico: 'cards' },
  { href: '#menu', label: 'Plus', ico: 'dots' },
];

function renderNav() {
  const route = location.hash || '#/';
  const active = h => (h === '#/' ? route === '#/' || route === '' : route.startsWith(h));
  document.getElementById('nav-desktop').innerHTML = NAV.map(n => n.sep
    ? `<div class="nav-sep">${n.sep}</div>`
    : `<a class="nav-link ${active(n.href) ? 'active' : ''}" href="${n.href}">${icon(n.ico)}<span>${n.label}</span>${n.pill && n.pill() ? `<span class="pill">${n.pill()}</span>` : ''}</a>`).join('');
  document.getElementById('nav-mobile').innerHTML = TABS.map(n => `<a class="${n.href !== '#menu' && active(n.href) ? 'active' : ''}" href="${n.href}">${icon(n.ico)}<span>${n.label}</span></a>`).join('');
  const s = store.get(), lv = levelOf(s.xp);
  document.getElementById('xp-chip').innerHTML = `<span class="lvl">Niv. ${lv.index}</span><span class="xp-txt">${s.xp} XP</span><span class="streak" title="Jours d'affilée">🔥 ${currentStreak()}</span>`;
  const total = allLessons().length, done = allLessons().filter(l => s.lessons[l.id]?.done).length;
  document.getElementById('sidebar-foot').innerHTML = `<div class="row between"><span>Progression</span><b>${Math.round(done / total * 100)} %</b></div><div class="progress" style="margin-top:.4rem"><i style="width:${done / total * 100}%"></i></div>`;
}

function crumbs(parts) {
  document.getElementById('crumbs').innerHTML = parts.map((p, i) => i < parts.length - 1 && p[1] ? `<a href="${p[1]}">${esc(p[0])}</a>` : `<span>${esc(p[0])}</span>`).join('<span class="sep">/</span>');
}

// ---------------------------------------------------------------- routeur

const routes = [
  [/^#?\/?$/, home],
  [/^#\/parcours$/, parcours],
  [/^#\/m\/([\w-]+)$/, moduleView],
  [/^#\/l\/([\w-]+)$/, lessonView],
  [/^#\/labo$/, labo],
  [/^#\/labo\/([\w-]+)$/, simView],
  [/^#\/defis$/, defis],
  [/^#\/revision$/, revision],
  [/^#\/projets$/, projets],
  [/^#\/projets\/([\w-]+)$/, projetView],
  [/^#\/master$/, master],
  [/^#\/carnet$/, carnet],
  [/^#\/glossaire$/, glossaire],
  [/^#\/profil$/, profil],
];

function router() {
  const h = location.hash || '#/';
  if (h === '#menu') { openMenu(); history.replaceState(null, '', document.body.dataset.prev || '#/'); return; }
  document.body.classList.remove('menu-open');
  document.body.dataset.prev = h;
  if (cleanup) { cleanup(); cleanup = null; }
  main.className = '';
  main.innerHTML = '';
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) {
      const r = fn(...m.slice(1));
      if (typeof r === 'function') cleanup = r;
      renderNav();
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
      return;
    }
  }
  main.innerHTML = '<div class="empty"><div class="big">🧭</div><p>Cette page n\'existe pas.</p><a class="btn" href="#/">Retour à l\'accueil</a></div>';
  renderNav();
}

function openMenu() { document.body.classList.add('menu-open'); }

// ---------------------------------------------------------------- utilitaires

function lessonProgress(m) {
  const s = store.get();
  const done = m.lessons.filter(l => s.lessons[l.id]?.done).length;
  return { done, total: m.lessons.length, pct: m.lessons.length ? done / m.lessons.length : 0 };
}
function nextLesson() {
  const s = store.get();
  if (s.last && lessonById(s.last) && !s.lessons[s.last]?.done) return lessonById(s.last);
  return allLessons().find(l => !s.lessons[l.id]?.done) || null;
}
function allCards() {
  const out = [];
  for (const l of allLessons()) (l.cards || []).forEach(([q, a], i) => out.push({ id: `${l.id}#${i}`, q, a, lesson: l }));
  return out;
}
function dueCards() {
  const s = store.get();
  return allCards().filter(c => (s.lessons[c.lesson.id]?.visits || s.lessons[c.lesson.id]?.done) && isDue(c.id));
}
function allDefis() {
  const out = [];
  for (const m of MODULES) for (const l of m.lessons) for (const b of l.blocks) if (b && b.t === 'defi') out.push({ ...b, lesson: l, module: m });
  return out;
}
const greet = () => { const h = new Date().getHours(); return h < 6 ? 'Encore debout' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; };
const QUOTES = [
  ['Un ingénieur, c\'est quelqu\'un qui résout un problème qu\'il ne savait pas résoudre la veille.', ''],
  ['Ce n\'est pas parce que c\'est difficile que nous n\'osons pas, c\'est parce que nous n\'osons pas que c\'est difficile.', 'Sénèque'],
  ['La théorie, c\'est quand on sait tout et que rien ne fonctionne. La pratique, c\'est quand tout fonctionne et que personne ne sait pourquoi. Ici, on réunit les deux.', 'adage d\'atelier'],
  ['Le meilleur moyen de prédire l\'avenir, c\'est de l\'inventer.', 'Alan Kay'],
  ['Rien ne se perd, rien ne se crée, tout se transforme.', 'd\'après Lavoisier'],
  ['Tout ce qui peut mal tourner tournera mal. Alors prévois-le.', 'loi de Murphy, version ingénieur'],
  ['L\'imagination est plus importante que le savoir.', 'Albert Einstein'],
  ['Un expert est quelqu\'un qui a commis toutes les erreurs possibles dans un domaine très restreint.', 'attribuée à Niels Bohr'],
  ['Fais simple, mais pas plus simple.', 'principe attribué à Einstein'],
  ['Le succès, c\'est d\'aller d\'échec en échec sans perdre son enthousiasme.', 'souvent attribuée à Winston Churchill'],
];
const dayIndex = () => Math.floor(Date.now() / 864e5);

// ---------------------------------------------------------------- accueil

function home() {
  crumbs([['Accueil']]);
  const s = store.get();
  const lv = levelOf(s.xp);
  const nxt = nextLesson();
  const tx = todayXP(), goal = s.profile.dailyGoal;
  const total = allLessons().length, done = allLessons().filter(l => s.lessons[l.id]?.done).length;
  const dfs = allDefis();
  const daily = dfs[dayIndex() % dfs.length];
  const q = QUOTES[dayIndex() % QUOTES.length];
  const due = dueCards().length;
  const name = s.profile.name ? `, ${esc(s.profile.name)}` : '';
  const nm = nxt ? moduleOf(nxt.id) : null;

  main.innerHTML = `
  <section class="hero">
    <div class="card pad-l hero-main">
      <div class="eyebrow">${greet()}${name}</div>
      <h1>${done === 0 ? 'Bienvenue dans ton atelier de robotique.' : done === total ? 'Parcours terminé. Place à tes inventions.' : 'On reprend là où tu t\'es arrêté.'}</h1>
      <p class="lead">${done === 0 ? 'Tu pars de zéro, c\'est parfait : tout est construit pour toi, étape par étape, de la loi d\'Ohm jusqu\'aux robots qui apprennent seuls.' : `Tu as terminé ${done} leçon${done > 1 ? 's' : ''} sur ${total}. Chaque leçon te rapproche du niveau attendu en Master, et au-delà.`}</p>
      ${nxt ? `<a class="btn primary" href="#/l/${nxt.id}">${icon('play')} ${done === 0 ? 'Commencer la première leçon' : 'Continuer'} : ${esc(nxt.title)}</a>
      <p class="small muted" style="margin:.6rem 0 0">${esc(nm.title)} · environ ${nxt.min} min</p>` : `<a class="btn primary" href="#/projets">${icon('tool')} Voir les projets réels</a>`}
    </div>
    <div class="card pad-l">
      <div class="row" style="gap:1.2rem;align-items:center">
        <div class="ring" style="--p:${Math.min(100, tx / goal * 100)}"><div><b>${tx}</b>/ ${goal} XP</div></div>
        <div class="stack" style="flex:1;min-width:150px">
          <div><b>Objectif du jour</b><div class="small muted">${tx >= goal ? 'Atteint. Tout ce que tu fais en plus, c\'est de l\'avance.' : `Encore ${goal - tx} XP. Une leçon suffit.`}</div></div>
          <div><b>Niveau ${lv.index} · ${lv.name}</b><div class="progress" style="margin:.35rem 0"><i style="width:${lv.pct * 100}%"></i></div><div class="small muted">${lv.next ? `${lv.toNext} XP avant « ${lv.next.name} »` : 'Niveau maximal'}</div></div>
        </div>
      </div>
      <div class="grid c3" style="margin-top:1.2rem;grid-template-columns:repeat(3,1fr)">
        <div class="stat"><span class="v">🔥 ${currentStreak()}</span><span class="l">jours d'affilée</span></div>
        <div class="stat"><span class="v">${Object.values(s.defis).filter(d => d.done).length}</span><span class="l">défis relevés</span></div>
        <div class="stat"><span class="v">${Object.keys(s.badges).length}</span><span class="l">badges</span></div>
      </div>
    </div>
  </section>

  <div class="grid c3">
    <a class="card link" href="#/l/${daily.lesson.id}">
      <div class="eyebrow">Défi du jour</div>
      <h3 style="margin:0 0 .3rem">${esc(daily.title)}</h3>
      <p class="small muted" style="margin:0">${esc(daily.module.title)} · ${s.defis[daily.id]?.done ? 'déjà relevé, refais-le plus vite' : `+${daily.xp || XP.defi} XP`}</p>
    </a>
    <a class="card link" href="#/revision">
      <div class="eyebrow">Révision espacée</div>
      <h3 style="margin:0 0 .3rem">${due ? `${due} carte${due > 1 ? 's' : ''} à revoir` : 'Rien à réviser'}</h3>
      <p class="small muted" style="margin:0">${due ? 'Cinq minutes maintenant valent une heure de bachotage plus tard.' : 'Les cartes des leçons que tu ouvres arriveront ici au bon moment.'}</p>
    </a>
    <a class="card link" href="#/carnet">
      <div class="eyebrow">Carnet d'ingénieur</div>
      <h3 style="margin:0 0 .3rem">${s.ideas.length ? `${s.ideas.length} idée${s.ideas.length > 1 ? 's' : ''} en cours` : 'Note ta première idée'}</h3>
      <p class="small muted" style="margin:0">Problème, idée, prototype, test. Les inventeurs écrivent tout.</p>
    </a>
  </div>

  <h2>Ton parcours</h2>
  <div class="grid c4" id="phase-mini"></div>

  <div class="callout tip" style="margin-top:2rem">
    <div class="ttl">💬 Pensée du jour</div>
    <p style="margin:0">« ${esc(q[0])} »${q[1] ? ` <span class="muted">— ${esc(q[1])}</span>` : ''}</p>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="row between"><b>Ton activité sur 20 semaines</b><span class="small muted">record : ${s.streak.best} jours</span></div>
    <div class="heat" style="margin-top:.7rem" id="heat"></div>
  </div>`;

  const pm = document.getElementById('phase-mini');
  pm.innerHTML = PHASES.map(ph => {
    const mods = MODULES.filter(m => m.phase === ph.id);
    const t = mods.reduce((n, m) => n + m.lessons.length, 0);
    const d = mods.reduce((n, m) => n + lessonProgress(m).done, 0);
    return `<a class="card link" href="#/parcours#${ph.id}"><div class="eyebrow">${esc(ph.short)}</div><b>${esc(ph.title)}</b><div class="progress" style="margin:.6rem 0 .3rem"><i style="width:${t ? d / t * 100 : 0}%"></i></div><span class="small muted">${d} / ${t} leçons</span></a>`;
  }).join('');
  heatmap(document.getElementById('heat'));
}

function heatmap(el) {
  const s = store.get();
  const days = 140, cells = [];
  const start = new Date(Date.now() - (days - 1) * 864e5);
  const pad = (start.getDay() + 6) % 7;
  for (let i = 0; i < pad; i++) cells.push('<i style="visibility:hidden"></i>');
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 864e5).toISOString().slice(0, 10);
    const v = s.activity[d] || 0;
    const l = v === 0 ? 0 : v < 20 ? 1 : v < 50 ? 2 : v < 100 ? 3 : 4;
    cells.push(`<i class="l${l}" title="${d} : ${v} XP"></i>`);
  }
  el.innerHTML = cells.join('');
}

// ---------------------------------------------------------------- parcours

function parcours() {
  crumbs([['Accueil', '#/'], ['Parcours']]);
  const s = store.get();
  main.innerHTML = `
    <div class="eyebrow">De zéro au Master</div>
    <h1>Le parcours complet</h1>
    <p class="lead">${MODULES.length} modules, ${allLessons().length} leçons. L'ordre proposé est pensé pour que chaque notion s'appuie sur la précédente, mais tout est ouvert : un ingénieur autonome choisit aussi son chemin.</p>
    ${PHASES.map(ph => {
      const mods = MODULES.filter(m => m.phase === ph.id);
      return `<section class="phase" id="${ph.id}">
        <div class="phase-head"><span class="tag accent">${esc(ph.short)}</span><h2>${esc(ph.title)}</h2></div>
        <p class="muted" style="max-width:75ch">${ph.desc}</p>
        <div class="grid c3">${mods.map(m => {
          const p = lessonProgress(m);
          return `<a class="card link mod-card" href="#/m/${m.id}">
            <div class="top"><div class="mod-icon">${m.icon}</div><div><h3>${esc(m.title)}</h3><span class="small muted">${p.total} leçons · ${m.lessons.reduce((n, l) => n + l.min, 0)} min</span></div></div>
            <p>${esc(m.desc)}</p>
            <div class="progress"><i style="width:${p.pct * 100}%"></i></div>
            <div class="meta">${p.done === p.total ? '<span class="tag ok">terminé</span>' : p.done ? `<span class="tag accent">${p.done}/${p.total}</span>` : ''}${m.master ? `<span class="tag">${esc(m.master)}</span>` : ''}</div>
          </a>`;
        }).join('')}</div>
      </section>`;
    }).join('')}`;
  const anchor = location.hash.split('#')[2];
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 50);
  void s;
}

function moduleView(id) {
  const m = MODULES.find(x => x.id === id);
  if (!m) return notFound();
  crumbs([['Parcours', '#/parcours'], [m.title]]);
  const s = store.get(), p = lessonProgress(m);
  const ph = PHASES.find(x => x.id === m.phase);
  main.innerHTML = `
    <div class="row" style="gap:1rem;align-items:flex-start">
      <div class="mod-icon" style="width:64px;height:64px;font-size:2rem">${m.icon}</div>
      <div style="flex:1;min-width:240px">
        <div class="eyebrow">${esc(ph.title)}</div>
        <h1>${esc(m.title)}</h1>
        <p class="lead">${esc(m.desc)}</p>
      </div>
    </div>
    ${m.intro ? `<div class="callout tip"><div class="ttl">🧭 Pourquoi ce module</div><div class="prose">${m.intro}</div></div>` : ''}
    <div class="row between" style="margin:1.4rem 0 .7rem"><b>${p.done} / ${p.total} leçons terminées</b>${m.master ? `<span class="tag">En Master : ${esc(m.master)}</span>` : ''}</div>
    <div class="progress" style="margin-bottom:1.2rem"><i style="width:${p.pct * 100}%"></i></div>
    <div class="lesson-list">${m.lessons.map((l, i) => `
      <a class="lesson-item ${s.lessons[l.id]?.done ? 'done' : ''}" href="#/l/${l.id}">
        <span class="num">${s.lessons[l.id]?.done ? '✓' : i + 1}</span>
        <span class="info"><b>${esc(l.title)}</b><small>${esc(l.sub || '')}</small></span>
        <span class="tag">${l.min} min</span>
      </a>`).join('')}</div>`;
}

// ---------------------------------------------------------------- leçon

function lessonView(id) {
  const l = lessonById(id);
  if (!l) return notFound();
  const m = moduleOf(id);
  const idx = m.lessons.indexOf(l);
  const flat = allLessons();
  const gi = flat.indexOf(l);
  const prev = flat[gi - 1], next = flat[gi + 1];
  crumbs([['Parcours', '#/parcours'], [m.title, `#/m/${m.id}`], [l.title]]);
  store.update(s => {
    s.last = id;
    s.lessons[id] = s.lessons[id] || { done: false, visits: 0 };
    s.lessons[id].visits++;
  });
  const done = () => store.get().lessons[id]?.done;
  main.innerHTML = `
    <article class="lesson-body">
      <header class="lesson-head">
        <div class="eyebrow">${esc(m.title)} · leçon ${idx + 1} / ${m.lessons.length}</div>
        <h1>${esc(l.title)}</h1>
        <div class="meta"><span class="tag">⏱ ${l.min} min</span><span class="tag">${'●'.repeat(l.level || 1)}${'○'.repeat(3 - (l.level || 1))} difficulté</span>${(l.cards || []).length ? `<span class="tag">${l.cards.length} cartes de révision</span>` : ''}</div>
        ${l.why ? `<div class="callout tip"><div class="ttl">🎯 À quoi ça sert</div><div class="prose">${l.why}</div></div>` : ''}
        ${l.objectives ? `<div class="objectives"><b>À la fin de cette leçon, tu sauras :</b><ul>${l.objectives.map(o => `<li>${o}</li>`).join('')}</ul></div>` : ''}
      </header>
      <div id="blocks"></div>
      ${(l.cards || []).length ? `<h2>Fiche mémo</h2><div class="card"><ul class="prose" style="margin:0;padding-left:1.2rem">${l.cards.map(([q, a]) => `<li><b>${q}</b><br><span class="muted">${a}</span></li>`).join('')}</ul></div>` : ''}
      <div id="done-zone"></div>
      <nav class="lesson-nav">
        ${prev ? `<a class="btn ghost" href="#/l/${prev.id}">${icon('arrowL')}<span>${esc(prev.title)}</span></a>` : '<span></span>'}
        ${next ? `<a class="btn" href="#/l/${next.id}"><span>${esc(next.title)}</span>${icon('arrowR')}</a>` : ''}
      </nav>
    </article>`;
  const stop = renderBlocks(document.getElementById('blocks'), l.blocks, { lessonId: id, lessonTitle: l.title });
  const dz = document.getElementById('done-zone');
  const drawDone = () => {
    if (done()) {
      dz.innerHTML = `<div class="done-banner"><span style="font-size:1.8rem">✅</span><div style="flex:1;min-width:200px"><b>Leçon terminée.</b><div class="small muted">Les cartes de cette leçon reviendront dans ta révision au bon moment.</div></div>${next ? `<a class="btn primary" href="#/l/${next.id}">Leçon suivante</a>` : ''}</div>`;
    } else {
      dz.innerHTML = `<div class="done-banner"><span style="font-size:1.8rem">🏁</span><div style="flex:1;min-width:200px"><b>Tu as tout parcouru ?</b><div class="small muted">Valide quand tu as joué avec les simulateurs et tenté les exercices. Honnêtement : c'est toi que tu formes.</div></div><button class="btn primary" type="button" id="btn-done">${icon('check')} J'ai terminé cette leçon</button></div>`;
      dz.querySelector('#btn-done').onclick = () => {
        store.update(s => { s.lessons[id].done = true; s.lessons[id].doneAt = new Date().toISOString(); });
        gain(XP.lesson, 'Leçon terminée');
        drawDone();
        renderNav();
      };
    }
  };
  drawDone();
  return stop;
}

// ---------------------------------------------------------------- labo

function labo() {
  crumbs([['Accueil', '#/'], ['Laboratoire']]);
  main.className = 'wide';
  const s = store.get();
  const domains = [...new Set(Object.values(SIMS).map(x => x.domain))];
  main.innerHTML = `
    <div class="eyebrow">Bac à sable</div>
    <h1>Le laboratoire</h1>
    <p class="lead">Tous les simulateurs, en accès libre. Pas de consigne, pas de note : tu bidouilles, tu casses, tu comprends. C'est comme ça qu'on développe l'intuition d'un ingénieur.</p>
    ${domains.map(d => `<h2>${esc(d)}</h2><div class="grid c3">${Object.entries(SIMS).filter(([, x]) => x.domain === d).map(([k, x]) => `
      <a class="card link mod-card" href="#/labo/${k}">
        <div class="top"><div class="mod-icon">${x.icon}</div><div><h3>${esc(x.title)}</h3>${s.sims[k] ? `<span class="small muted">ouvert ${s.sims[k]} fois</span>` : '<span class="tag accent">nouveau</span>'}</div></div>
        <p>${esc(x.desc)}</p>
      </a>`).join('')}</div>`).join('')}`;
}

function simView(id) {
  const meta = SIMS[id];
  if (!meta) return notFound();
  crumbs([['Labo', '#/labo'], [meta.title]]);
  main.className = 'wide';
  store.update(s => { s.sims[id] = (s.sims[id] || 0) + 1; });
  checkBadges();
  const uses = allLessons().filter(l => l.blocks.some(b => b && (b.t === 'sim' || b.t === 'defi') && (b.id === id || b.sim === id)));
  main.innerHTML = `<h1>${meta.icon} ${esc(meta.title)}</h1><p class="lead">${esc(meta.desc)}</p><div id="simhost"></div>
    ${uses.length ? `<h3>Leçons qui utilisent ce simulateur</h3><div class="lesson-list">${uses.map(l => `<a class="lesson-item" href="#/l/${l.id}"><span class="info"><b>${esc(l.title)}</b><small>${esc(moduleOf(l.id).title)}</small></span></a>`).join('')}</div>` : ''}`;
  let destroy = null, alive = true;
  mountSim(id, document.getElementById('simhost'), {}).then(fn => { if (alive) destroy = fn; else fn(); });
  return () => { alive = false; destroy && destroy(); };
}

// ---------------------------------------------------------------- défis

function defis() {
  crumbs([['Accueil', '#/'], ['Défis']]);
  const s = store.get();
  const list = allDefis();
  const doneN = list.filter(d => s.defis[d.id]?.done).length;
  main.innerHTML = `
    <div class="eyebrow">Mets-toi à l'épreuve</div>
    <h1>Les défis</h1>
    <p class="lead">${doneN} / ${list.length} relevés. Chaque défi est un vrai problème d'ingénieur, en miniature. Tu peux les tenter dans l'ordre que tu veux.</p>
    <div class="grid c2">${list.map(d => `
      <a class="card link" href="#/l/${d.lesson.id}">
        <div class="row between"><span class="tag ${s.defis[d.id]?.done ? 'ok' : 'warn'}">${s.defis[d.id]?.done ? 'relevé' : `+${d.xp || XP.defi} XP`}</span><span class="small muted">${esc(d.module.title)}</span></div>
        <h3 style="margin:.6rem 0 .3rem">${esc(d.title)}</h3>
        <p class="small muted" style="margin:0">${esc(d.lesson.title)}</p>
      </a>`).join('')}</div>`;
}

// ---------------------------------------------------------------- révision

function revision() {
  crumbs([['Accueil', '#/'], ['Révision']]);
  let queue = dueCards().sort(() => Math.random() - 0.5);
  let mode = 'due';
  const draw = () => {
    if (!queue.length) {
      const seen = allCards().filter(c => store.get().lessons[c.lesson.id]?.visits).length;
      main.innerHTML = `<div class="eyebrow">Répétition espacée</div><h1>Révision</h1>
        <div class="empty"><div class="big">🗂️</div><h3>${mode === 'due' ? 'Tout est à jour.' : 'Session terminée.'}</h3>
        <p>${seen ? 'Les cartes reviendront quand ta mémoire commencera à les oublier : c\'est le moment où réviser est le plus efficace.' : 'Ouvre une leçon : ses cartes de révision arriveront ici.'}</p>
        ${seen ? '<button class="btn" id="btn-all">Réviser quand même toutes les cartes vues</button>' : '<a class="btn primary" href="#/parcours">Aller au parcours</a>'}</div>
        <div class="callout info"><div class="ttl">📌 Comment ça marche</div><p>Chaque carte vit dans une boîte. Si tu la connais, elle monte d'une boîte et reviendra plus tard (1, 3, 7, 16, 35 puis 90 jours). Si tu l'as oubliée, elle redescend en boîte 1. C'est la méthode de Leitner, la plus simple et l'une des plus efficaces pour retenir à long terme.</p></div>`;
      const b = document.getElementById('btn-all');
      if (b) b.onclick = () => { mode = 'all'; queue = allCards().filter(c => store.get().lessons[c.lesson.id]?.visits).sort(() => Math.random() - 0.5); draw(); };
      return;
    }
    const c = queue[0];
    main.innerHTML = `<div class="eyebrow">Répétition espacée</div><h1>Révision</h1>
      <p class="muted">${queue.length} carte${queue.length > 1 ? 's' : ''} restante${queue.length > 1 ? 's' : ''} · ${esc(moduleOf(c.lesson.id).title)}</p>
      <div class="flash-wrap"><div class="flash" id="flash" tabindex="0" role="button" aria-label="Retourner la carte">
        <div class="face front"><span class="lbl">Question</span><div class="txt">${c.q}</div><p class="small faint" style="margin-top:1.2rem">Réponds dans ta tête, puis touche la carte.</p></div>
        <div class="face back"><span class="lbl">Réponse</span><div class="txt">${c.a}</div><a class="small" style="margin-top:1rem" href="#/l/${c.lesson.id}">Revoir la leçon</a></div>
      </div></div>
      <div class="grade" id="grade" hidden>
        <button class="btn danger" data-g="0">Oublié</button><button class="btn" data-g="1">Difficile</button><button class="btn" data-g="2">Bien</button><button class="btn primary" data-g="3">Facile</button>
      </div>
      <p class="center kbd-hint only-desktop">Espace pour retourner, puis 1 2 3 4 pour noter.</p>`;
    const fl = document.getElementById('flash'), gr = document.getElementById('grade');
    const flip = () => { fl.classList.add('flip'); gr.hidden = false; };
    fl.onclick = flip;
    const grade = g => {
      gradeCard(c.id, g);
      store.update(s => { s.cardReviews = (s.cardReviews || 0) + 1; });
      gain(XP.card);
      queue.shift();
      if (g === 0) queue.push(c);
      draw();
      renderNav();
    };
    gr.querySelectorAll('button').forEach(b => b.onclick = () => grade(Number(b.dataset.g)));
    keyHandler = e => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === ' ') { e.preventDefault(); flip(); }
      if (!gr.hidden && ['1', '2', '3', '4'].includes(e.key)) grade(Number(e.key) - 1);
    };
  };
  let keyHandler = null;
  const onKey = e => keyHandler && keyHandler(e);
  document.addEventListener('keydown', onKey);
  draw();
  return () => document.removeEventListener('keydown', onKey);
}

// ---------------------------------------------------------------- projets

function projets() {
  crumbs([['Accueil', '#/'], ['Projets réels']]);
  const s = store.get();
  main.innerHTML = `
    <div class="eyebrow">Passer au concret</div>
    <h1>Projets réels</h1>
    <p class="lead">Les simulateurs entraînent l'intuition. Les projets te mettent face à ce qu'aucun simulateur ne montre : un fil mal serré, un capteur qui ment, une batterie qui faiblit. Chaque projet liste le matériel, le budget, les étapes et les pièges.</p>
    <div class="grid c2">${PROJECTS.map(p => `
      <a class="card link mod-card" href="#/projets/${p.id}">
        <div class="top"><div class="mod-icon">${p.icon}</div><div><h3>${esc(p.title)}</h3><span class="small muted">${esc(p.budget)} · ${esc(p.duration)}</span></div></div>
        <p>${esc(p.desc)}</p>
        <div class="meta"><span class="tag">${'●'.repeat(p.level)}${'○'.repeat(4 - p.level)}</span>${s.defis['projet-' + p.id]?.done ? '<span class="tag ok">réalisé</span>' : ''}${p.skills.map(k => `<span class="tag">${esc(k)}</span>`).join('')}</div>
      </a>`).join('')}</div>`;
}

function projetView(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) return notFound();
  crumbs([['Projets', '#/projets'], [p.title]]);
  main.innerHTML = `<article class="lesson-body"><div class="eyebrow">Projet · ${esc(p.budget)} · ${esc(p.duration)}</div><h1>${p.icon} ${esc(p.title)}</h1><p class="lead">${esc(p.desc)}</p><div id="blocks"></div></article>`;
  const blocks = [...p.blocks, { t: 'defi', id: 'projet-' + p.id, title: `Réaliser : ${p.title}`, text: 'Quand ton robot fonctionne pour de vrai, filme-le, note dans ton carnet ce qui a résisté et comment tu l\'as résolu, puis valide.', manual: true, xp: 150 }];
  return renderBlocks(document.getElementById('blocks'), blocks, { lessonId: 'projet-' + p.id, lessonTitle: p.title });
}

// ---------------------------------------------------------------- guide du master

function master() {
  crumbs([['Accueil', '#/'], ['Guide du Master']]);
  main.innerHTML = `<article class="lesson-body"><div class="eyebrow">Préparer la suite</div><h1>Guide du Master Robotique</h1><p class="lead">Ce qui t'attend, comment t'y préparer, et comment prendre de l'avance sur ce qui arrive.</p><div id="blocks"></div></article>`;
  return renderBlocks(document.getElementById('blocks'), GUIDE, { lessonId: 'guide' });
}

// ---------------------------------------------------------------- carnet

function carnet() {
  crumbs([['Accueil', '#/'], ['Carnet d\'ingénieur']]);
  const draw = () => {
    const s = store.get();
    main.innerHTML = `
      <div class="eyebrow">Ta mémoire externe</div>
      <h1>Carnet d'ingénieur</h1>
      <p class="lead">Les grands inventeurs tenaient tous un carnet. Note tes idées, même farfelues, et fais-les avancer : problème, idée, prototype, test. C'est ici que tu deviens créatif, pas seulement savant.</p>
      <div class="row" style="margin-bottom:1rem">
        <button class="btn primary" id="new-idea">💡 Nouvelle idée</button>
        <button class="btn" id="new-note">📝 Nouvelle note</button>
        <button class="btn ghost" id="exp">Exporter le carnet</button>
      </div>
      <div class="callout future"><div class="ttl">🔭 Besoin d'inspiration ?</div><p style="margin:0" id="spark"></p><button class="btn small" style="margin-top:.6rem" id="spark-btn">Une autre piste</button></div>
      <h2>Idées (${s.ideas.length})</h2>
      <div class="grid c2">${s.ideas.length ? s.ideas.map(i => `
        <div class="note">
          <div class="row between"><h4>${esc(i.problem || 'Sans titre')}</h4><span class="tag ${i.status === 'testé' ? 'ok' : i.status === 'prototype' ? 'accent' : 'warn'}">${esc(i.status || 'idée')}</span></div>
          <div class="body"><b>Idée :</b> ${esc(i.idea)}\n${i.proto ? `<b>Prototype :</b> ${esc(i.proto)}\n` : ''}${i.test ? `<b>Test :</b> ${esc(i.test)}` : ''}</div>
          <div class="row" style="margin-top:.6rem"><button class="btn small" data-edit-idea="${i.id}">Modifier</button><button class="btn small ghost" data-del-idea="${i.id}">Supprimer</button><span class="small faint">${fmtDate(i.at)}</span></div>
        </div>`).join('') : '<p class="muted">Aucune idée pour l\'instant. La première est toujours la plus dure à écrire.</p>'}</div>
      <h2>Notes et réflexions (${s.notes.length})</h2>
      <div class="grid c2">${s.notes.length ? s.notes.map(n => `
        <div class="note"><div class="row between"><h4>${esc(n.title)}</h4>${n.tag ? `<span class="tag">${esc(n.tag)}</span>` : ''}</div><div class="body">${esc(n.body)}</div>
        <div class="row" style="margin-top:.6rem"><button class="btn small" data-edit-note="${n.id}">Modifier</button><button class="btn small ghost" data-del-note="${n.id}">Supprimer</button><span class="small faint">${fmtDate(n.at)}</span></div></div>`).join('') : '<p class="muted">Tes réponses aux questions « À toi de réfléchir » des leçons s\'enregistrent aussi ici.</p>'}</div>`;
    const sparks = [
      'Un robot qui aide une personne âgée à se relever : quels capteurs ? quelle sécurité ?',
      'Comment trier automatiquement les déchets d\'une cantine avec une caméra et un bras ?',
      'Un robot de 10 cm qui inspecte l\'intérieur des canalisations : comment avance-t-il ? comment communique-t-il ?',
      'Une main robotique à 30 € imprimée en 3D : quels actionneurs, quelle commande ?',
      'Un drone qui replante des arbres après un incendie : quelle autonomie énergétique ?',
      'Un robot jardinier qui reconnaît les mauvaises herbes sans pesticide.',
      'Un exosquelette léger pour les travailleurs qui portent des charges : comment détecter l\'intention du geste ?',
      'Un essaim de petits robots qui cartographie un bâtiment effondré.',
      'Un robot sous-marin qui surveille les récifs coralliens : comment se localise-t-il sans GPS ?',
      'Un chariot qui suit une personne dans un supermarché sans la confondre avec les autres.',
      'Un robot qui apprend une tâche en regardant un humain une seule fois.',
      'Comment rendre un robot réparable par son utilisateur, sans outil spécial ?',
    ];
    const sp = document.getElementById('spark');
    let k = Math.floor(Math.random() * sparks.length);
    sp.textContent = sparks[k];
    document.getElementById('spark-btn').onclick = () => { k = (k + 1) % sparks.length; sp.textContent = sparks[k]; };
    document.getElementById('new-idea').onclick = () => ideaForm();
    document.getElementById('new-note').onclick = () => noteForm();
    document.getElementById('exp').onclick = () => {
      const st = store.get();
      const txt = ['# Carnet d\'ingénieur', '', '## Idées', ...st.ideas.map(i => `### ${i.problem}\n- Idée : ${i.idea}\n- Prototype : ${i.proto || ''}\n- Test : ${i.test || ''}\n- Statut : ${i.status}\n`), '## Notes', ...st.notes.map(n => `### ${n.title}\n${n.body}\n`)].join('\n');
      download('carnet-ingenieur.md', txt, 'text/markdown');
    };
    main.querySelectorAll('[data-edit-idea]').forEach(b => b.onclick = () => ideaForm(store.get().ideas.find(i => i.id === b.dataset.editIdea)));
    main.querySelectorAll('[data-del-idea]').forEach(b => b.onclick = async () => { if (await confirmBox('Supprimer cette idée ?', 'Supprimer')) { store.update(s2 => { s2.ideas = s2.ideas.filter(i => i.id !== b.dataset.delIdea); }); draw(); } });
    main.querySelectorAll('[data-edit-note]').forEach(b => b.onclick = () => noteForm(store.get().notes.find(n => n.id === b.dataset.editNote)));
    main.querySelectorAll('[data-del-note]').forEach(b => b.onclick = async () => { if (await confirmBox('Supprimer cette note ?', 'Supprimer')) { store.update(s2 => { s2.notes = s2.notes.filter(n => n.id !== b.dataset.delNote); }); draw(); } });
  };
  function ideaForm(it) {
    const i = it || { problem: '', idea: '', proto: '', test: '', status: 'idée' };
    const { el, close } = modal(`<div class="row between"><h3 style="margin:0">${it ? 'Modifier l\'idée' : 'Nouvelle idée'}</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <label class="field"><span>Quel problème veux-tu résoudre ?</span><input type="text" name="problem" value="${esc(i.problem)}" placeholder="ex. les robots aspirateurs se coincent sous le canapé"></label>
      <label class="field"><span>Ton idée de solution</span><textarea name="idea" placeholder="Même incomplète, même un peu folle.">${esc(i.idea)}</textarea></label>
      <label class="field"><span>Comment la prototyper avec peu de moyens ?</span><textarea name="proto" style="min-height:80px">${esc(i.proto)}</textarea></label>
      <label class="field"><span>Comment saurais-tu que ça marche ? (critère mesurable)</span><textarea name="test" style="min-height:80px">${esc(i.test)}</textarea></label>
      <label class="field"><span>Où en es-tu ?</span><select name="status">${['idée', 'en réflexion', 'prototype', 'testé', 'abandonnée (et c\'est instructif)'].map(o => `<option ${o === i.status ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="save">Enregistrer</button></div>`);
    el.querySelector('#save').onclick = () => {
      const v = n => el.querySelector(`[name=${n}]`).value.trim();
      if (!v('problem') && !v('idea')) { close(); return; }
      const isNew = !it;
      store.update(s => {
        const obj = { id: i.id || Date.now().toString(36), problem: v('problem'), idea: v('idea'), proto: v('proto'), test: v('test'), status: v('status'), at: new Date().toISOString() };
        if (isNew) s.ideas.unshift(obj); else s.ideas = s.ideas.map(x => x.id === obj.id ? obj : x);
      });
      close();
      if (isNew) gain(XP.idea, 'Idée notée');
      draw();
    };
  }
  function noteForm(it) {
    const n = it || { title: '', body: '', tag: '' };
    const { el, close } = modal(`<div class="row between"><h3 style="margin:0">${it ? 'Modifier la note' : 'Nouvelle note'}</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <label class="field"><span>Titre</span><input type="text" name="title" value="${esc(n.title)}"></label>
      <label class="field"><span>Contenu</span><textarea name="body" style="min-height:180px">${esc(n.body)}</textarea></label>
      <label class="field"><span>Étiquette</span><input type="text" name="tag" value="${esc(n.tag)}" placeholder="ex. électronique, à revoir, question prof"></label>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="save">Enregistrer</button></div>`);
    el.querySelector('#save').onclick = () => {
      const v = k => el.querySelector(`[name=${k}]`).value.trim();
      if (!v('title') && !v('body')) { close(); return; }
      store.update(s => {
        const obj = { ...n, id: n.id || Date.now().toString(36), title: v('title') || 'Note', body: v('body'), tag: v('tag'), at: new Date().toISOString() };
        if (!it) s.notes.unshift(obj); else s.notes = s.notes.map(x => x.id === obj.id ? obj : x);
      });
      close(); draw();
    };
  }
  draw();
}

// ---------------------------------------------------------------- glossaire

function glossaire() {
  crumbs([['Accueil', '#/'], ['Glossaire']]);
  const terms = [...GLOSSARY].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  main.innerHTML = `<div class="eyebrow">${terms.length} termes</div><h1>Glossaire</h1>
    <p class="lead">Le vocabulaire du métier. Les mots anglais sont indiqués : en Master et en entreprise, une bonne partie de la documentation est en anglais.</p>
    <input type="search" id="gq" placeholder="Chercher un terme…" aria-label="Chercher dans le glossaire" style="max-width:420px;margin-bottom:1rem">
    <div id="gl" class="grid c2"></div>`;
  const gl = document.getElementById('gl'), gq = document.getElementById('gq');
  const draw = () => {
    const q = gq.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const norm = x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const list = terms.filter(([t, en, d]) => !q || norm(t + ' ' + (en || '') + ' ' + d).includes(q));
    gl.innerHTML = list.map(([t, en, d]) => `<div class="note"><h4>${esc(t)}${en ? ` <span class="small faint">· ${esc(en)}</span>` : ''}</h4><div class="body">${esc(d)}</div></div>`).join('') || '<p class="muted">Aucun terme trouvé.</p>';
  };
  gq.oninput = draw;
  draw();
}

// ---------------------------------------------------------------- profil

function profil() {
  crumbs([['Accueil', '#/'], ['Profil et réglages']]);
  const s = store.get(), lv = levelOf(s.xp);
  const doneL = allLessons().filter(l => s.lessons[l.id]?.done).length;
  main.innerHTML = `
    <h1>Profil et réglages</h1>
    <div class="grid c2">
      <div class="card pad-l">
        <h3>Toi</h3>
        <label class="field"><span>Prénom ou pseudo</span><input type="text" id="pname" value="${esc(s.profile.name)}"></label>
        <label class="field"><span>Objectif quotidien</span><select id="pgoal">${[[30, 'Tranquille : 30 XP (~10 min)'], [60, 'Régulier : 60 XP (~20 min)'], [120, 'Sérieux : 120 XP (~40 min)'], [200, 'Intensif : 200 XP (~1 h)']].map(([v, l]) => `<option value="${v}" ${s.profile.dailyGoal === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <p class="small muted">Inscrit depuis le ${fmtDate(s.profile.created)}. Niveau ${lv.index} (${lv.name}), ${s.xp} XP, ${doneL} leçons terminées, record de ${s.streak.best} jours d'affilée, ${s.focus.minutes} minutes de concentration.</p>
      </div>
      <div class="card pad-l">
        <h3>Confort</h3>
        <label class="field"><span>Thème</span><select id="ptheme">${[['auto', 'Automatique (suit l\'appareil)'], ['dark', 'Sombre'], ['light', 'Clair']].map(([v, l]) => `<option value="${v}" ${s.settings.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Taille du texte : <b id="fsv">${s.settings.fontSize}px</b></span><input type="range" id="pfs" min="14" max="20" step="1" value="${s.settings.fontSize}"></label>
        <label class="check"><input type="checkbox" id="prm" ${s.settings.reduceMotion ? 'checked' : ''}> Réduire les animations de l'interface</label>
      </div>
    </div>
    <h2>Niveaux</h2>
    <div class="grid c4">${LEVELS.map((l, i) => `<div class="card ${lv.index === i + 1 ? 'link' : ''}" style="${lv.index === i + 1 ? 'border-color:var(--accent)' : ''}"><b>${i + 1}. ${esc(l.name)}</b><div class="small muted">${l.xp} XP</div></div>`).join('')}</div>
    <h2>Badges (${Object.keys(s.badges).length} / ${BADGES.length})</h2>
    <div class="badge-grid">${BADGES.map(b => `<div class="badge-item ${s.badges[b.id] ? 'got' : ''}"><div class="ico">${b.icon}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small>${s.badges[b.id] ? `<small class="faint">${fmtDate(s.badges[b.id])}</small>` : ''}</div>`).join('')}</div>
    <h2>Sauvegarde</h2>
    <div class="card">
      <p class="muted">Ta progression est enregistrée uniquement sur cet appareil, dans le navigateur. Pour passer du téléphone à l'ordinateur, exporte le fichier ici et importe-le de l'autre côté. Fais-le aussi de temps en temps par sécurité.</p>
      <div class="row"><button class="btn" id="bexp">Exporter ma progression</button><label class="btn">Importer un fichier<input type="file" id="bimp" accept="application/json,.json" hidden></label><button class="btn danger" id="breset">Tout effacer</button></div>
    </div>
    <h2>Installer l'application</h2>
    <div class="card"><p class="muted" style="margin:0">Sur téléphone : menu du navigateur, puis « Ajouter à l'écran d'accueil ». Sur ordinateur (Chrome, Edge) : icône d'installation dans la barre d'adresse. Une fois installée, l'application fonctionne même sans connexion.</p><div id="install-zone" style="margin-top:.7rem"></div></div>
    <p class="small faint" style="margin-top:2rem">Raccourcis : <kbd>/</kbd> recherche · <kbd>F</kbd> minuteur de concentration · <kbd>T</kbd> thème.</p>`;
  const $ = id => document.getElementById(id);
  $('pname').onchange = e => { store.update(st => { st.profile.name = e.target.value.trim(); }); };
  $('pgoal').onchange = e => { store.update(st => { st.profile.dailyGoal = Number(e.target.value); }); };
  $('ptheme').onchange = e => { store.update(st => { st.settings.theme = e.target.value; }); applySettings(); };
  $('pfs').oninput = e => { $('fsv').textContent = e.target.value + 'px'; store.update(st => { st.settings.fontSize = Number(e.target.value); }); applySettings(); };
  $('prm').onchange = e => { store.update(st => { st.settings.reduceMotion = e.target.checked; }); applySettings(); };
  $('bexp').onclick = () => download(`robomaster-sauvegarde-${store.today()}.json`, store.export());
  $('bimp').onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try { store.import(await file.text()); toast('Progression importée', 'Bon retour parmi nous.'); applySettings(); router(); }
    catch (err) { toast('Import impossible', err.message); }
  };
  $('breset').onclick = async () => { if (await confirmBox('Effacer toute ta progression, tes notes et tes idées ? Exporte d\'abord si tu veux les garder.', 'Tout effacer')) { store.reset(); applySettings(); location.hash = '#/'; router(); } };
  if (installPrompt) {
    const b = document.createElement('button');
    b.className = 'btn primary'; b.textContent = 'Installer RoboMaster';
    b.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; b.remove(); };
    $('install-zone').appendChild(b);
  }
}

function notFound() {
  main.innerHTML = '<div class="empty"><div class="big">🧭</div><p>Contenu introuvable.</p><a class="btn" href="#/parcours">Retour au parcours</a></div>';
}

// ---------------------------------------------------------------- recherche

function openSearch() {
  const items = [
    ...allLessons().map(l => ({ title: l.title, sub: moduleOf(l.id).title, href: `#/l/${l.id}`, text: [l.title, l.sub, ...(l.objectives || []), ...(l.cards || []).flat()].join(' ') })),
    ...MODULES.map(m => ({ title: m.title, sub: 'Module', href: `#/m/${m.id}`, text: m.title + ' ' + m.desc })),
    ...Object.entries(SIMS).map(([k, x]) => ({ title: x.title, sub: 'Simulateur · ' + x.domain, href: `#/labo/${k}`, text: x.title + ' ' + x.desc })),
    ...PROJECTS.map(p => ({ title: p.title, sub: 'Projet réel', href: `#/projets/${p.id}`, text: p.title + ' ' + p.desc })),
    ...GLOSSARY.map(([t, en, d]) => ({ title: t, sub: 'Glossaire' + (en ? ' · ' + en : ''), href: '#/glossaire', text: t + ' ' + (en || '') + ' ' + d })),
  ];
  const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const { el, close } = modal(`<div class="row between"><h3 style="margin:0">Rechercher</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
    <input type="search" id="sq" placeholder="PID, Kalman, loi d'Ohm, ROS, matrice…" aria-label="Rechercher">
    <div class="search-results" id="sr"></div>`);
  const sq = el.querySelector('#sq'), sr = el.querySelector('#sr');
  let sel = 0, res = [];
  const draw = () => {
    const words = norm(sq.value).split(/\s+/).filter(Boolean);
    res = words.length ? items.filter(it => { const t = norm(it.title + ' ' + it.text); return words.every(w => t.includes(w)); })
      .sort((a, b) => (norm(b.title).includes(words[0]) ? 1 : 0) - (norm(a.title).includes(words[0]) ? 1 : 0)).slice(0, 12) : [];
    sel = 0;
    sr.innerHTML = res.map((r, i) => `<a href="${r.href}" class="${i === sel ? 'sel' : ''}">${esc(r.title)}<small>${esc(r.sub)}</small></a>`).join('') || (words.length ? '<p class="muted">Rien trouvé. Essaie un autre mot.</p>' : '<p class="small muted">Tape un mot-clé.</p>');
    sr.querySelectorAll('a').forEach(a => a.onclick = () => close());
  };
  sq.oninput = draw;
  sq.onkeydown = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % Math.max(1, res.length);
      sr.querySelectorAll('a').forEach((a, i) => a.classList.toggle('sel', i === sel));
    }
    if (e.key === 'Enter' && res[sel]) { location.hash = res[sel].href; close(); }
  };
  draw();
}

// ---------------------------------------------------------------- minuteur de concentration

const focus = { running: false, phase: 'work', left: 25 * 60, timer: null };
function openFocus() {
  if (focus.running || focus.left !== 25 * 60 || focus.phase !== 'work') { renderFocus(); return; }
  const { el, close } = modal(`<div class="row between"><h3 style="margin:0">Session de concentration</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
    <p class="muted">Le cerveau apprend mieux par blocs courts et sans interruption. Range ton téléphone (sauf si c'est lui qui affiche l'appli), coupe les notifications, garde de l'eau à portée de main.</p>
    <div class="grid c3" style="grid-template-columns:repeat(3,1fr)">
      <button class="btn" data-m="15">15 min</button><button class="btn primary" data-m="25">25 min</button><button class="btn" data-m="45">45 min</button>
    </div>
    <p class="small faint" style="margin-top:1rem">À la fin : 5 minutes de vraie pause. Lève-toi, regarde au loin, étire-toi. C'est pendant les pauses que la mémoire consolide.</p>`);
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { focus.left = Number(b.dataset.m) * 60; focus.total = focus.left; focus.phase = 'work'; startFocus(); close(); });
}
function startFocus() {
  focus.running = true;
  clearInterval(focus.timer);
  focus.timer = setInterval(() => {
    focus.left--;
    if (focus.left <= 0) {
      if (focus.phase === 'work') {
        const mins = Math.round((focus.total || 1500) / 60);
        store.update(s => { s.focus.sessions++; s.focus.minutes += mins; });
        gain(XP.focus, 'Session de concentration terminée');
        toast('Pause !', 'Lève-toi, bois un verre d\'eau, regarde par la fenêtre. Cinq minutes.');
        focus.phase = 'pause'; focus.left = 5 * 60;
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { /* non supporté */ }
      } else {
        toast('On reprend ?', 'Ta pause est terminée. Une nouvelle session quand tu veux.');
        stopFocus();
        return;
      }
    }
    renderFocus();
  }, 1000);
  renderFocus();
}
function stopFocus() { clearInterval(focus.timer); focus.running = false; focus.phase = 'work'; focus.left = 25 * 60; renderFocus(); }
function renderFocus() {
  const w = document.getElementById('focus-widget');
  if (!focus.running && focus.left === 25 * 60 && focus.phase === 'work') { w.hidden = true; return; }
  w.hidden = false;
  w.className = 'focus-widget' + (focus.phase === 'pause' ? ' pause' : '');
  const m = Math.floor(focus.left / 60), s = focus.left % 60;
  w.innerHTML = `<span>${focus.phase === 'pause' ? '☕ Pause' : '🎯 Focus'}</span><span class="time">${m}:${String(s).padStart(2, '0')}</span>
    <button class="btn small ghost" id="fp">${focus.running ? 'Pause' : 'Reprendre'}</button><button class="btn small ghost" id="fs" aria-label="Arrêter">✕</button>`;
  w.querySelector('#fp').onclick = () => { if (focus.running) { clearInterval(focus.timer); focus.running = false; renderFocus(); } else startFocus(); };
  w.querySelector('#fs').onclick = stopFocus;
}

// ---------------------------------------------------------------- réglages, thème, accueil du premier lancement

function applySettings() {
  const s = store.get().settings;
  const dark = s.theme === 'dark' || (s.theme === 'auto' && !matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--fs', s.fontSize + 'px');
  document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
  document.getElementById('btn-theme').innerHTML = icon(dark ? 'sun' : 'moon');
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', applySettings);

function onboarding() {
  const s = store.get();
  if (s.profile.onboarded) return;
  const { el, close } = modal(`
    <div class="eyebrow">Bienvenue</div>
    <h2 style="margin-top:0">Tu vas apprendre la robotique de A à Z.</h2>
    <p>Aucun prérequis. Si tu sais faire une règle de trois, tu as tout ce qu'il faut pour commencer. Le reste, on le construit ensemble.</p>
    <ul class="prose">
      <li><b>Tu manipules avant de mémoriser</b> : chaque notion a son simulateur.</li>
      <li><b>Tu vois tout de la source au résultat</b> : du courant dans un fil jusqu'au robot qui se déplace.</li>
      <li><b>Tu te testes</b> : quiz, exercices, code, défis.</li>
      <li><b>Tu inventes</b> : un carnet d'ingénieur et des projets réels pour passer du savoir à la création.</li>
    </ul>
    <label class="field"><span>Comment veux-tu qu'on t'appelle ?</span><input type="text" id="ob-name" placeholder="Prénom ou pseudo"></label>
    <label class="field"><span>Combien de temps par jour ?</span><select id="ob-goal"><option value="30">10 minutes, pour commencer doucement</option><option value="60" selected>20 minutes, le bon rythme</option><option value="120">40 minutes, je suis motivé</option><option value="200">1 heure et plus</option></select></label>
    <p class="small muted">Tout reste sur ton appareil. Pas de compte, pas de publicité, et l'appli fonctionne hors connexion une fois installée.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ob-go">C'est parti</button></div>`, { onClose: () => store.update(st => { st.profile.onboarded = true; }) });
  el.querySelector('#ob-go').onclick = () => {
    store.update(st => {
      st.profile.name = el.querySelector('#ob-name').value.trim();
      st.profile.dailyGoal = Number(el.querySelector('#ob-goal').value);
      st.profile.onboarded = true;
    });
    close();
    router();
  };
}

// ---------------------------------------------------------------- démarrage

let installPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

document.getElementById('btn-search').onclick = openSearch;
document.getElementById('btn-focus').onclick = openFocus;
document.getElementById('btn-menu').onclick = openMenu;
document.getElementById('btn-theme').onclick = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  store.update(s => { s.settings.theme = dark ? 'light' : 'dark'; });
  applySettings();
};
document.getElementById('xp-chip').onclick = () => { location.hash = '#/profil'; };
document.getElementById('sidebar').addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('menu-open'); });
document.addEventListener('click', e => { if (document.body.classList.contains('menu-open') && !e.target.closest('#sidebar') && !e.target.closest('#btn-menu') && !e.target.closest('.tabbar')) document.body.classList.remove('menu-open'); });
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!document.getElementById('modal').hidden) return;
  if (e.key === '/') { e.preventDefault(); openSearch(); }
  else if (e.key === 'f' || e.key === 'F') openFocus();
  else if (e.key === 't' || e.key === 'T') document.getElementById('btn-theme').click();
});

addEventListener('hashchange', router);
store.subscribe(() => { /* la barre latérale est rafraîchie à chaque navigation */ });
applySettings();
router();
onboarding();
checkBadges();

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !navigator.userAgent.includes('RoboMasterApp')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne indisponible */ }));
}
