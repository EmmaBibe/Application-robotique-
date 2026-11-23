// « Dans la tête de VIGIE » : simulateur 3D qui montre comment VIGIE 6 décide, face à DRA-MPPI.
// Les deux robots tournent avec le portage JavaScript fidèle du banc de recherche (js/sims/vigie6/,
// vérifié par recherche/planificateur/parite_js.py), dans un fil de calcul séparé.

import { Stage, COL } from './vigie3d/scene.js';
import { nameOptions, noteParts, headline, outcomeWord, fmt, pct, TOUR, GLOSSAIRE } from './vigie3d/explain.js';
import { ensureTable } from './vigie6/risk.js';
import { SCENES } from './vigie6/world.js';
import { openEditor, sceneSpec } from './vigie3d/editor.js';

const PRESETS = [
  { id: 'goulot', label: 'Porte étroite', cond: 'nominal', seed: 2 },
  { id: 'coin_aveugle', label: 'Angles morts', cond: 'perception', seed: 3 },
  { id: 'traversee', label: 'Traversée', cond: 'nominal', seed: 1 },
  { id: 'foule_dense', label: 'Foule dense', cond: 'nominal', seed: 1 },
  { id: 'foret', label: 'Forêt', cond: 'nominal', seed: 1 },
  { id: 'poursuite', label: 'Poursuite', cond: 'nominal', seed: 1 },
];
const CONDS = [['nominal', 'Vision complète', 'Vision'], ['perception', 'Perception limitée', 'Perception'], ['reactifs', 'Piétons qui réagissent', 'Réactifs']];
const LAYERS = [
  ['voit', 'Ce qu\'il voit', 'Personnes vues, mémorisées ou inconnues ; portée des capteurs ; silhouettes imaginées aux angles morts.'],
  ['imagine', 'Ce qu\'il imagine', 'La marche prévue de chaque personne sur 2,5 s, avec son incertitude.'],
  ['danger', 'Carte du danger', 'Probabilité de toucher quelqu\'un à l\'instant choisi.'],
  ['options', 'Ses options', 'Ses idées de chemin et son choix.'],
  ['essais', 'Les essais', 'Une partie des variations essayées par la méthode MPPI.'],
  ['dra', 'La référence', 'DRA-MPPI, en ambre.'],
];
const VIEWS = [['maquette', 'Maquette'], ['suivre', 'Suivre'], ['plan', 'Vue du dessus'], ['espace', 'Espace-temps']];
const SPEEDS = [0.25, 0.5, 1, 2, 4];
// durée maximale d'une course : 45 s comme dans le banc de recherche, ou plus pour ses propres mondes
const DUREES = [[45, '45 s'], [90, '90 s'], [180, '3 min']];
const DUREE_KEY = 'vigie.duree.v1';
let NFR = 451;                                      // images de la chronologie : 10 par seconde, plus l'instant 0
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default function vigie3d(root, opts = {}) {
  root.classList.add('v3d');
  if (opts.fill) root.classList.add('v3d-fill');
  root.innerHTML = `
  <div class="v3d-bar">
    <div class="v3d-brand"><span class="v3d-mark" aria-hidden="true"></span><div><b>Dans la tête de VIGIE</b><small>VIGIE 6 face à DRA-MPPI, la référence</small></div></div>
    <div class="v3d-scenes" role="tablist" aria-label="Scène"></div>
    <div class="v3d-row">
      <label class="v3d-select"><span>Autre scène</span><select class="v3d-other"></select></label>
      <div class="v3d-seg v3d-cond" role="radiogroup" aria-label="Condition"></div>
      <button class="v3d-btn v3d-new" title="Tirer un autre monde de la même scène"><span class="lg">Nouveau monde</span><span class="sm">Autre monde</span> <span class="v3d-seed"></span></button>
      <label class="v3d-select" title="Au-delà, la course s'arrête et compte « temps dépassé ». 45 s : la règle du banc de recherche."><span>Durée max</span><select class="v3d-duree">${DUREES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      <button class="v3d-btn v3d-editbtn" title="Déplacer l'arrivée et le départ, ajouter ou retirer des obstacles et des personnes"><span class="lg">Modifier ce monde</span><span class="sm">Modifier</span></button>
      <button class="v3d-btn v3d-tourbtn"><span class="lg">Visite guidée</span><span class="sm">Visite</span></button>
      <button class="v3d-btn v3d-fullbtn" aria-pressed="false">Plein écran</button>
    </div>
  </div>
  <div class="v3d-main">
    <div class="v3d-stage">
      <div class="v3d-gl"></div>
      <div class="v3d-labels" aria-hidden="true"></div>
      <div class="v3d-hud v3d-layers" aria-label="Calques"></div>
      <div class="v3d-hud v3d-views" role="radiogroup" aria-label="Point de vue"></div>
      <div class="v3d-heat" hidden><span>Danger dans</span><input type="range" min="0.1" max="2.5" step="0.1" value="1"><b>1,0 s</b></div>
      <div class="v3d-score" aria-live="polite"></div>
      <div class="v3d-tour" hidden></div>
      <div class="v3d-toast" hidden></div>
      <div class="v3d-person" hidden></div>
      <div class="v3d-loading"><span class="v3d-spin"></span><span class="v3d-loadtxt">VIGIE prépare son calcul de probabilités…</span></div>
      <div class="v3d-time">
        <button class="v3d-play" aria-label="Lecture">▶</button>
        <button class="v3d-stepb" aria-label="Image précédente">‹</button>
        <button class="v3d-stepf" aria-label="Image suivante">›</button>
        <div class="v3d-track"><div class="v3d-buf"></div><div class="v3d-marks"></div><input class="v3d-scrub" type="range" min="0" max="${NFR - 1}" step="1" value="0" aria-label="Temps"></div>
        <span class="v3d-clock">0,0 s</span>
        <select class="v3d-speed" aria-label="Vitesse">${SPEEDS.map(s => `<option value="${s}" ${s === 1 ? 'selected' : ''}>${String(s).replace('.', ',')}×</option>`).join('')}</select>
      </div>
    </div>
    <aside class="v3d-side">
      <div class="v3d-tabs" role="tablist">
        <button role="tab" data-tab="decision" class="on">Sa décision</button>
        <button role="tab" data-tab="compare">Face à la référence</button>
        <button role="tab" data-tab="how">Comment ça marche</button>
      </div>
      <div class="v3d-pane" data-pane="decision"></div>
      <div class="v3d-pane" data-pane="compare" hidden></div>
      <div class="v3d-pane" data-pane="how" hidden></div>
    </aside>
  </div>`;
  const $ = s => root.querySelector(s);
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const lowPower = opts.quality === 'eco' ? true : opts.quality === 'high' ? false : Math.min(window.screen.width, window.screen.height) < 700;
  if (opts.fill) $('.v3d-fullbtn').hidden = true;
  let stage = new Stage($('.v3d-gl'), { theme: light ? 'light' : 'dark', lowPower });
  // si le thème de l'application change pendant que le simulateur est ouvert, la maquette suit
  const themeObs = new MutationObserver(() => {
    const th = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    if (th === stage.theme) return;
    const cam = { ...stage.cam, target: stage.cam.target.clone() }, split = stage.split, showDra = stage.showDra;
    stage.dispose(); stage = new Stage($('.v3d-gl'), { theme: th, lowPower });
    Object.assign(stage.cam, cam); stage.showDra = showDra; bindGestures();
    if (st.info) { stage.setWorld(st.info, split); applyDra(); }
    st.trailK = -1; st.dirty = true;
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------------------------------------------------------------- état
  const st = {
    scene: (opts.start && opts.start.scene) || PRESETS[0].id, cond: (opts.start && opts.start.cond) || PRESETS[0].cond, seed: (opts.start && opts.start.seed) || PRESETS[0].seed,
    spec: (opts.start && opts.start.spec) || null,
    tmax: (() => { try { const v = +localStorage.getItem(DUREE_KEY); return DUREES.some(d => d[0] === v) ? v : 45; } catch { return 45; } })(),
    params: opts.params || {}, hideOut: false, endSent: false,
    F: [], info: null, done: false, tr: 0, playing: false, speed: 1,
    layers: { voit: false, imagine: false, danger: false, options: true, essais: false, dra: true },
    view: 'maquette', hover: null, heatT: 1.0, person: null, tab: 'decision', tour: -1,
    shownK: -1, trailK: -1, dirty: true, marks: [], tally: { vigie: {}, dra: {}, n: 0 }, counted: new Set(),
  };

  // ---------------------------------------------------------------- calcul (fil séparé, ou page à défaut)
  let worker = null, fallback = null;
  function start() {
    stopCalc();
    st.F = []; st.info = null; st.done = false; st.tr = 0; st.shownK = -1; st.trailK = -1; st.marks = []; st.hover = null; st.person = null;
    $('.v3d-loading').hidden = false; $('.v3d-person').hidden = true; st.endSent = false; renderMarks(); $('.v3d-seed').textContent = st.scene === 'perso' ? `ton monde, n° ${st.seed}` : `n° ${st.seed}`;
    if (st.scene !== 'perso') st.spec = null;
    NFR = st.tmax * 10 + 1; $('.v3d-scrub').max = String(NFR - 1);
    const msg = { type: 'start', scene: st.scene, seed: st.seed, cond: st.cond, params: st.params, spec: st.spec, tmax: st.tmax };
    if (opts.onWorld) opts.onWorld({ scene: st.scene, seed: st.seed, cond: st.cond, params: st.params, spec: st.spec });
    try {
      worker = new Worker(new URL('./vigie6/worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = e => onMsg(e.data);
      worker.onerror = () => { worker && worker.terminate(); worker = null; runHere(msg); };
      worker.postMessage(msg);
    } catch (err) { runHere(msg); }
  }
  async function runHere(msg) {
    const { createRun } = await import('./vigie6/runner.js');
    ensureTable();
    const run = createRun(msg.scene, msg.seed, msg.cond, msg.params || {}, msg.spec || null, msg.tmax), my = {};
    fallback = my;
    onMsg({ type: 'info', info: run.info, initial: run.initial });
    const pump = () => {
      if (fallback !== my) return;
      const batch = [], t0 = performance.now();
      while (!run.done && performance.now() - t0 < 12) { const f = run.step(); if (f) batch.push(f); }
      if (batch.length) onMsg({ type: 'frames', frames: batch });
      if (run.done) onMsg({ type: 'done' }); else setTimeout(pump, 0);
    };
    pump();
  }
  function stopCalc() { if (worker) { worker.terminate(); worker = null; } fallback = null; }
  function onMsg(m) {
    if (m.type === 'table') ensureTable(m.tab);
    else if (m.type === 'info') {
      st.info = m.info; st.F = [m.initial];
      lv.textContent = m.info.modified ? 'VIGIE modifié' : 'VIGIE';
      root.classList.toggle('v3d-modified', !!m.info.modified);
      stage.setWorld(m.info, false); applyDra(); stage.setView(st.view);
      $('.v3d-loadtxt').textContent = 'Les deux robots réfléchissent…';
      st.dirty = true;
    } else if (m.type === 'frames') {
      for (const f of m.frames) { st.F.push(f); scanEvents(f); }
      $('.v3d-loading').hidden = true;
      if (!stage.split && st.F.some(f => f.diverged)) { /* l'affichage côte à côte s'active à l'image concernée */ }
      $('.v3d-buf').style.width = `${(st.F.length - 1) / (NFR - 1) * 100}%`;
    } else if (m.type === 'done') { st.done = true; countResult(); }
  }

  // ---------------------------------------------------------------- moments clés de la chronologie
  function scanEvents(f) {
    const prev = st.F[f.k - 1], add = (cls, label) => st.marks.push({ k: f.k, cls, label });
    const vb = f.vigie.brain;
    if (vb && vb.switched) add('switch', 'VIGIE change d\'itinéraire');
    if (vb && vb.cap && vb.cap.active && !(prev && prev.vigie.brain && prev.vigie.brain.cap && prev.vigie.brain.cap.active)) add('cap', 'Prudence d\'angle mort');
    if (f.diverged && prev && !prev.diverged) add('div', 'Les deux mondes se séparent');
    for (const key of ['vigie', 'dra']) {
      const r = f[key];
      if (r.out && !(prev && prev[key].out)) add(`out-${key} ${r.out}`, `${key === 'vigie' ? 'VIGIE' : 'DRA-MPPI'} : ${outcomeWord(r.out)}`);
    }
    if (f.k % 5 === 0) renderMarks();
  }
  function renderMarks() {
    $('.v3d-marks').innerHTML = st.marks.filter(m => !(st.hideOut && m.cls.startsWith('out-'))).map(m => `<button class="v3d-mk ${m.cls}" style="left:${m.k / (NFR - 1) * 100}%" data-k="${m.k}" title="${esc(m.label)} (${fmt(m.k * 0.1)} s)" aria-label="${esc(m.label)}"></button>`).join('');
  }
  $('.v3d-marks').addEventListener('click', e => { const b = e.target.closest('.v3d-mk'); if (b) { st.tr = Math.max(0, +b.dataset.k - 3); st.playing = false; syncPlay(); toast(b.title); } });

  function countResult() {
    const last = st.F[st.F.length - 1], key = `${st.scene}|${st.cond}|${st.seed}|${st.tmax}|${st.spec ? JSON.stringify(st.spec) : ''}`;
    if (st.counted.has(key)) return; st.counted.add(key);
    for (const r of ['vigie', 'dra']) st.tally[r][last[r].out] = (st.tally[r][last[r].out] || 0) + 1;
    st.tally.n++;
  }

  // ---------------------------------------------------------------- barre du haut
  const scenes = $('.v3d-scenes');
  scenes.innerHTML = PRESETS.map(p => `<button role="tab" class="v3d-chip" data-id="${p.id}">${p.label}</button>`).join('');
  scenes.addEventListener('click', e => { const b = e.target.closest('.v3d-chip'); if (!b) return; const p = PRESETS.find(q => q.id === b.dataset.id); Object.assign(st, { scene: p.id, cond: p.cond, seed: p.seed }); syncTop(); start(); });
  const other = $('.v3d-other');
  other.innerHTML = Object.entries(SCENES).map(([id, l]) => `<option value="${id}">${l}</option>`).join('') + '<option value="perso" hidden>Mon monde</option>';
  other.addEventListener('change', () => { if (other.value === 'perso') return; st.scene = other.value; st.seed = 1; syncTop(); start(); });
  const duree = $('.v3d-duree'); duree.value = String(st.tmax);
  duree.addEventListener('change', () => { st.tmax = +duree.value; try { localStorage.setItem(DUREE_KEY, String(st.tmax)); } catch { /* stockage indisponible */ } start(); toast(st.tmax === 45 ? 'Durée maximale : 45 s, comme dans le banc de recherche.' : `Durée maximale : ${duree.selectedOptions[0].textContent}. Les résultats du banc de recherche, eux, sont comptés sur 45 s.`); });
  let editor = null;
  $('.v3d-editbtn').addEventListener('click', () => {
    if (editor) return;
    st.playing = false; syncPlay();
    const spec = st.scene === 'perso' && st.spec ? st.spec : sceneSpec(st.scene, st.seed);
    editor = openEditor(document.body, {
      spec, cond: st.cond, seed: st.seed,
      onRun: (s, c) => { Object.assign(st, { scene: 'perso', spec: s, cond: c, seed: 1 }); syncTop(); start(); toast('Ton monde est lancé : VIGIE et la référence partent du même endroit.'); },
      onClose: () => { editor = null; },
    });
  });
  $('.v3d-cond').innerHTML = CONDS.map(([v, l, sh]) => `<button role="radio" data-v="${v}" aria-label="${l}"><span class="lg">${l}</span><span class="sm">${sh}</span></button>`).join('');
  $('.v3d-cond').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.cond = b.dataset.v; syncTop(); start(); });
  $('.v3d-new').addEventListener('click', () => { st.seed++; syncTop(); start(); });
  function syncTop() {
    scenes.querySelectorAll('.v3d-chip').forEach(b => b.classList.toggle('on', b.dataset.id === st.scene));
    other.value = st.scene;
    $('.v3d-cond').querySelectorAll('button').forEach(b => { const on = b.dataset.v === st.cond; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  }

  // ---------------------------------------------------------------- calques et points de vue
  $('.v3d-layers').innerHTML = `<div class="v3d-hudt">Ses pensées</div>` + LAYERS.map(([k, l, d]) => `<button class="v3d-lay" data-k="${k}" title="${esc(d)}" aria-pressed="false"><i class="ico-${k}"></i>${l}</button>`).join('');
  $('.v3d-layers').addEventListener('click', e => { const b = e.target.closest('.v3d-lay'); if (!b) return; st.layers[b.dataset.k] = !st.layers[b.dataset.k]; syncLayers(); });
  function syncLayers() {
    root.querySelectorAll('.v3d-lay').forEach(b => { const on = !!st.layers[b.dataset.k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('.v3d-heat').hidden = !st.layers.danger; applyDra(); st.dirty = true;
  }
  function applyDra() { stage.showDra = st.layers.dra; if (stage.arenas[0].robots.dra) stage.arenas[0].robots.dra.visible = st.layers.dra && !stage.split; stage.trailDirty = true; st.trailK = -1; }
  $('.v3d-heat input').addEventListener('input', e => { st.heatT = +e.target.value; $('.v3d-heat b').textContent = `${fmt(st.heatT)} s`; st.dirty = true; });
  $('.v3d-views').innerHTML = VIEWS.map(([v, l]) => `<button role="radio" data-v="${v}">${l}</button>`).join('');
  $('.v3d-views').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.v); });
  function setView(v) {
    st.view = v;
    root.querySelectorAll('.v3d-views button').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    stage.setView(v, stage.arenas[0].robots.vigie ? stage.arenas[0].robots.vigie.position : null); st.dirty = true;
  }

  // ---------------------------------------------------------------- chronologie
  const playBtn = $('.v3d-play');
  function syncPlay() { playBtn.textContent = st.playing ? '❚❚' : '▶'; playBtn.setAttribute('aria-label', st.playing ? 'Pause' : 'Lecture'); }
  playBtn.addEventListener('click', () => { if (st.tr >= st.F.length - 1 && st.done) st.tr = 0; st.playing = !st.playing; syncPlay(); });
  $('.v3d-stepb').addEventListener('click', () => { st.playing = false; syncPlay(); st.tr = Math.max(0, Math.ceil(st.tr) - 1); });
  $('.v3d-stepf').addEventListener('click', () => { st.playing = false; syncPlay(); st.tr = Math.min(st.F.length - 1, Math.floor(st.tr) + 1); });
  $('.v3d-scrub').addEventListener('input', e => { st.playing = false; syncPlay(); st.tr = Math.min(+e.target.value, Math.max(0, st.F.length - 1)); });
  $('.v3d-speed').addEventListener('change', e => { st.speed = +e.target.value; });

  // ---------------------------------------------------------------- panneau latéral
  root.querySelectorAll('.v3d-tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  function setTab(t) {
    st.tab = t;
    root.querySelectorAll('.v3d-tabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    root.querySelectorAll('.v3d-pane').forEach(p => { p.hidden = p.dataset.pane !== t; });
    st.shownK = -1;
  }
  $('.v3d-pane[data-pane="decision"]').addEventListener('pointerover', e => { const c = e.target.closest('.v3d-opt'); const i = c ? +c.dataset.i : null; if (i !== st.hover) { st.hover = i; st.dirty = true; } });
  $('.v3d-pane[data-pane="decision"]').addEventListener('pointerleave', () => { st.hover = null; st.dirty = true; });
  $('.v3d-pane[data-pane="decision"]').addEventListener('click', e => { const c = e.target.closest('.v3d-opt'); if (!c) return; const i = +c.dataset.i; st.hover = st.hover === i ? null : i; st.dirty = true; });
  $('.v3d-pane[data-pane="how"]').innerHTML = `
    <h5>D'où viennent ces calculs ?</h5>
    <p>Ce simulateur fait tourner <b>exactement les mêmes algorithmes</b> que le banc de recherche : VIGIE 6 et DRA-MPPI, avec le même robot réaliste (moteurs, inertie, mesures en retard) et le même suivi des personnes. Ils ont été réécrits pour ton téléphone puis vérifiés de deux façons : 33 tests qui exigent, pour les mêmes entrées, les mêmes décisions au millionième près ; et une campagne de 1 760 essais dans ce simulateur, qui retrouve le même avantage que le banc sur le même type de mondes (+4,3 points ici, +5,3 dans le banc, deux écarts significatifs). Les mondes sont tirés au hasard selon les règles du banc. Avec « Modifier ce monde », tu peux aussi déplacer l'arrivée et le départ, poser ou retirer des obstacles et des personnes : ton monde est construit tel quel, et les deux robots y roulent avec exactement les mêmes programmes.</p>
    <h5>Les mots à connaître</h5>
    <dl class="v3d-gloss">${GLOSSAIRE.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
    <h5>Ce que dit la recherche</h5>
    <p>Sur 100 mondes jamais vus (13 200 essais), VIGIE 6 a réussi <b>88,9 %</b> des trajets contre <b>85,1 %</b> pour DRA-MPPI, avec un quart de collisions en moins. C'est un écart significatif. T-MPC++, l'autre référence, fait jeu égal avec VIGIE. Son avance fond quand la vue est limitée : tu peux le voir ici, aux angles morts.</p>`;

  function decisionPane(f) {
    const vb = f.vigie.brain, el = $('.v3d-pane[data-pane="decision"]');
    if (!f.k) { el.innerHTML = `<div class="v3d-head"><b>Prêt à partir.</b><p>Lance la lecture (▶) ou avance image par image (›) : à chaque dixième de seconde, ce panneau montre ce que VIGIE envisage et pourquoi il choisit.</p></div>`; return; }
    if (!vb) { el.innerHTML = `<div class="v3d-head"><b>VIGIE : ${outcomeWord(f.vigie.out)}.</b><p>${f.vigie.out === 'succes' ? `Drapeau atteint en ${fmt(f.vigie.t)} s.` : f.vigie.out === 'collision' ? 'Recule la chronologie pour voir ce qu\'il avait prévu juste avant.' : 'Il n\'a pas atteint le drapeau en 45 s.'}</p></div>`; return; }
    const names = st.names, h = headline(vb, names, f.vigie.s);
    if (vb.empty) { el.innerHTML = `<div class="v3d-head"><b>${h.title}</b><p>${h.text}</p></div>`; return; }
    const P = vb.cands.map(c => noteParts(c, vb.ideal)), maxS = Math.max(...vb.cands.map(c => c.J), 1);
    const col = (c, i) => c.type === 'libre' ? 'libre' : c.type === 'espace-temps' ? 'st' : ['A', 'B', 'C'][Math.max(0, names[i].k)];
    const opts = vb.cands.map((c, i) => {
      const p = P[i], seg = (k, cls) => `<i class="${cls}" style="width:${Math.max(0, p[k]) / maxS * 100}%"></i>`;
      return `<div class="v3d-opt ${i === vb.chosen ? 'chosen' : ''} ${st.hover === i ? 'hot' : ''}" data-i="${i}" tabindex="0">
        <div class="v3d-optt"><span class="sw ${col(c, i)}"></span><b>${names[i].short}</b>${i === vb.chosen ? '<em class="tag-ch">choisi</em>' : ''}${p.fidelite ? '<em class="tag-fi" title="Continue l\'itinéraire déjà suivi : note × 0,75">fidélité × 0,75</em>' : ''}<span class="sc">${fmt(c.score, 0)}</span></div>
        <div class="v3d-bar2">${seg('danger', 'd')}${seg('obstacles', 'o')}${seg('lenteur', 'l')}${seg('virages', 'v')}</div>
        <div class="v3d-optn">risque max ${pct(c.pmax)} · danger ${fmt(p.danger, 0)} · lenteur ${fmt(p.lenteur, 0)} · murs ${fmt(p.obstacles, 0)} · virages ${fmt(p.virages, 1)}</div></div>`;
    }).join('');
    const sm = vb.smith, lag = sm ? Math.hypot(sm.pred[0] - sm.meas[0], sm.pred[1] - sm.meas[1]) : 0;
    el.innerHTML = `
      <div class="v3d-head"><b>${h.title}</b><p>${h.text}</p></div>
      <div class="v3d-legend"><span><i class="d"></i>danger</span><span><i class="o"></i>murs et poteaux</span><span><i class="l"></i>lenteur</span><span><i class="v"></i>virages</span></div>
      <div class="v3d-opts">${opts}</div>
      <p class="v3d-small">Note = pénalités (plus c'est petit, mieux c'est) ; la lenteur se compte par rapport au trajet idéal. Touche une option pour la voir seule.</p>
      <div class="v3d-facts">
        <span><b>${fmt(vb.final ? vb.final[0] : f.vigie.cmd[0], 2)}</b> m/s commandés</span>
        <span><b>${fmt(f.vigie.ms, 0)}</b> ms de réflexion</span>
        <span>retard compensé : <b>${fmt(lag * 100, 0)}</b> cm</span>
        ${vb.refreshed ? '<span class="hl">itinéraires recalculés</span>' : ''}
      </div>`;
  }

  function comparePane(f) {
    const el = $('.v3d-pane[data-pane="compare"]'), r = k => f[k], g = st.info.goal;
    const col = (k, label) => {
      const x = r(k), b = x.brain, dist = Math.hypot(x.s[0] - g[0], x.s[1] - g[1]);
      const risk = k === 'vigie' ? (b && !b.empty ? b.cands[b.chosen].pmax : null) : (b ? b.pmax : null);
      return `<div class="v3d-cmp ${k}"><div class="v3d-cmph"><span class="sw ${k}"></span><b>${label}</b><em class="${x.out || 'route'}">${outcomeWord(x.out)}</em></div>
        <dl><dt>Temps</dt><dd>${fmt(x.t)} s</dd><dt>Vitesse</dt><dd>${fmt(x.v, 2)} m/s</dd><dt>Distance au drapeau</dt><dd>${fmt(dist)} m</dd>
        <dt>Marge actuelle</dt><dd>${fmt(Math.max(0, x.clear), 2)} m</dd><dt>Risque max sur son plan</dt><dd>${risk === null ? '—' : pct(risk)}</dd>
        <dt>Idées envisagées</dt><dd>${k === 'vigie' ? (b && !b.empty ? b.cands.length : '—') : '1'}</dd></dl></div>`;
    };
    const T = st.tally, line = k => ['succes', 'collision', 'temps'].map(o => `${T[k][o] || 0} ${outcomeWord(o)}`).join(' · ');
    el.innerHTML = `<div class="v3d-cmps">${col('vigie', 'VIGIE 6')}${col('dra', 'DRA-MPPI')}</div>
      ${f.diverged ? '<p class="v3d-note">Les personnes réagissent différemment aux deux robots : chacun a désormais son propre monde, côte à côte.</p>' : '<p class="v3d-small">Même monde, mêmes personnes : les deux robots ne se voient pas l\'un l\'autre.</p>'}
      <div class="v3d-stat"><b>Sur 100 mondes jamais vus du banc de recherche</b>
        <div class="v3d-sbar"><span style="width:88.9%" class="vigie">VIGIE 6 · 88,9 %</span></div>
        <div class="v3d-sbar"><span style="width:85.1%" class="dra">DRA-MPPI · 85,1 %</span></div>
        <p class="v3d-small">Trajets réussis, 13 200 essais. Écart de +3,8 points (intervalle de confiance à 95 % : +2,6 à +5,1). VIGIE gagne 271 situations et en perd 145 : une victoire globale, pas dans chaque monde.</p></div>
      <div class="v3d-stat"><b>Dans ce simulateur (${T.n} monde${T.n > 1 ? 's' : ''} joué${T.n > 1 ? 's' : ''} jusqu'au bout)</b>
        <p class="v3d-small">VIGIE : ${line('vigie')}<br>DRA-MPPI : ${line('dra')}</p></div>`;
  }

  function personCard(f) {
    const el = $('.v3d-person'), id = st.person;
    if (id == null) { el.hidden = true; return; }
    const vb = f.vigie.brain, j = id - 1000, P = (f.people || [])[j];
    if (!P) { el.hidden = true; return; }
    const idx = vb && vb.obs ? vb.obs.findIndex(o => o[5] === id) : -1, seen = f.vigie.seen.includes(id);
    const state = seen ? 'il la voit en ce moment' : idx >= 0 ? 'il ne la voit plus, mais s\'en souvient et devine où elle est' : 'il ne sait pas qu\'elle est là';
    let extra = '';
    if (idx >= 0 && vb && !vb.empty) {
      const u = vb.u[idx], ch = vb.cands[vb.chosen], p = ch.pAgent[idx];
      extra = `<dt>Imprévisibilité mesurée</dt><dd>${u < 0.2 ? 'faible' : u < 0.6 ? 'moyenne' : 'forte'} (${fmt(u * 100, 0)} %)</dd><dt>Risque de contact sur le plan choisi</dt><dd>${pct(p)}</dd>`;
    }
    el.innerHTML = `<button class="v3d-x" aria-label="Fermer">×</button><b>Personne n° ${j + 1}</b><dl><dt>Vitesse</dt><dd>${fmt(Math.hypot(P[2], P[3]), 2)} m/s</dd><dt>Pour VIGIE</dt><dd>${state}</dd>${extra}</dl>`;
    el.hidden = false;
  }
  $('.v3d-person').addEventListener('click', e => { if (e.target.closest('.v3d-x')) { st.person = null; personCard(st.F[0]); } });

  function scoreBox(f) {
    const b = k => `<span class="${k}"><i></i>${k === 'vigie' ? 'VIGIE' : 'DRA-MPPI'} · ${outcomeWord(f[k].out)}</span>`;
    $('.v3d-score').innerHTML = `${b('vigie')}${st.layers.dra ? b('dra') : ''}`;
  }

  // ---------------------------------------------------------------- étiquettes flottantes
  const labels = $('.v3d-labels');
  labels.innerHTML = `<span class="v3d-lbl vigie">VIGIE</span><span class="v3d-lbl dra">DRA-MPPI</span><span class="v3d-lbl goal">Drapeau</span>`;
  const [lv, ld, lg] = labels.children;
  function placeLabels(fa, fb, a) {
    if (!st.info) return;
    const L = (p, q) => p + (q - p) * a;
    const put = (el, x, y, h, arena, show) => { const p = stage.project(x, y, h, arena); el.style.transform = `translate(${p.x}px, ${p.y}px)`; el.style.opacity = show && p.visible ? 1 : 0; };
    const vx = L(fa.vigie.s[0], fb.vigie.s[0]), vy = L(fa.vigie.s[1], fb.vigie.s[1]), dx = L(fa.dra.s[0], fb.dra.s[0]), dy = L(fa.dra.s[1], fb.dra.s[1]);
    const close = !stage.split && Math.hypot(vx - dx, vy - dy) < 1.2;
    put(lv, vx, vy, 0.75, 0, true); lv.classList.toggle('up', close);
    put(ld, dx, dy, 0.75, stage.split ? 1 : 0, st.layers.dra || stage.split);
    put(lg, st.info.goal[0], st.info.goal[1], 1.85, 0, true);
  }

  // ---------------------------------------------------------------- visite guidée
  const tourEl = $('.v3d-tour');
  // sur petit écran, la visite guidée se lit sous la maquette, pour ne pas la cacher
  const narrow = window.matchMedia('(max-width: 600px)');
  const placeTour = () => { if (narrow.matches) { $('.v3d-side').prepend(tourEl); tourEl.classList.add('inline'); } else { $('.v3d-stage').appendChild(tourEl); tourEl.classList.remove('inline'); } };
  placeTour(); narrow.addEventListener('change', placeTour);
  $('.v3d-tourbtn').addEventListener('click', () => showTour(0));
  function showTour(i) {
    st.tour = i;
    if (i < 0 || i >= TOUR.length) { tourEl.hidden = true; st.tour = -1; return; }
    const s = TOUR[i];
    st.layers = { voit: false, imagine: false, danger: false, options: false, essais: false, dra: !!s.showDra, ...s.layers };
    if (s.showDra === undefined) st.layers.dra = false;
    syncLayers(); setView(s.view); stage.spaceTimeOn = !!s.spaceTime;
    if (s.panel) setTab(s.panel);
    if (s.play) { st.playing = true; syncPlay(); } else if (i === 0) { st.playing = false; syncPlay(); }
    if (!s.play && st.tr < 15 && i > 0 && st.F.length > 25) st.tr = 20;
    tourEl.innerHTML = `<div class="v3d-tourk">Étape ${i + 1} sur ${TOUR.length}</div><h5>${s.title}</h5><p>${s.text}</p>
      <div class="v3d-tourb"><button class="v3d-btn ghost" data-a="prev" ${i === 0 ? 'disabled' : ''}>Précédent</button><button class="v3d-btn ghost" data-a="end">Fermer</button><button class="v3d-btn primary" data-a="next">${i === TOUR.length - 1 ? 'Terminer' : 'Suivant'}</button></div>`;
    tourEl.hidden = false; st.dirty = true;
    if (tourEl.classList.contains('inline')) $('.v3d-stage').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  tourEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a; if (a === 'next') showTour(st.tour + 1); else if (a === 'prev') showTour(st.tour - 1); else showTour(-1); if (a !== 'next' || st.tour < 0) stage.spaceTimeOn = st.view === 'espace'; });

  // ---------------------------------------------------------------- messages courts
  let toastT = 0;
  function toast(t) { const el = $('.v3d-toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600); }

  // ---------------------------------------------------------------- gestes : tourner, zoomer, déplacer, toucher une personne
  const ptrs = new Map(); let gesture = null;
  function bindGestures() {
  const gl = stage.renderer.domElement;
  gl.addEventListener('pointerdown', e => { gl.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), btn: e.button, shift: e.shiftKey }); gesture = null; });
  gl.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (ptrs.size === 1) { if (p.btn === 2 || p.shift) stage.pan(dx, dy); else stage.orbit(dx, dy); }
    else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d0 = Math.hypot(a.x - b.x, a.y - b.y);
      p.x = e.clientX; p.y = e.clientY;
      const d1 = Math.hypot(a.x - b.x, a.y - b.y);
      if (d0 > 0 && d1 > 0) stage.zoom(d0 / d1);
      stage.pan(dx / 2, dy / 2);
      if (st.view !== 'libre') unsetView();
      return;
    }
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 6) unsetView();
  });
  const up = e => {
    const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
    if (p && ptrs.size === 0 && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 6 && performance.now() - p.t0 < 400) {
      const id = stage.pick(e.clientX, e.clientY); st.person = id; personCard(frameAt(Math.round(st.tr)));
    }
  };
  gl.addEventListener('pointerup', up); gl.addEventListener('pointercancel', up);
  gl.addEventListener('wheel', e => { e.preventDefault(); stage.zoom(Math.exp(e.deltaY * 0.0012)); unsetView(); }, { passive: false });
  gl.addEventListener('contextmenu', e => e.preventDefault());
  }
  bindGestures();
  function unsetView() { if (st.view === 'suivre' || st.view === 'plan' || st.view === 'maquette') { st.view = 'libre'; root.querySelectorAll('.v3d-views button').forEach(b => b.classList.remove('on')); } }

  // ---------------------------------------------------------------- plein écran (dans la page, fiable aussi dans l'application Android)
  const fullBtn = $('.v3d-fullbtn');
  function setFull(on) { root.classList.toggle('v3d-full', on); document.body.classList.toggle('v3d-noscroll', on); fullBtn.textContent = on ? 'Quitter le plein écran' : 'Plein écran'; fullBtn.setAttribute('aria-pressed', on); setTimeout(() => stage.resize(), 50); }
  fullBtn.addEventListener('click', () => setFull(!root.classList.contains('v3d-full')));
  const onKey = e => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (e.key === 'Escape' && root.classList.contains('v3d-full')) setFull(false);
    else if (e.key === ' ' && root.contains(document.activeElement || root)) { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'ArrowRight') $('.v3d-stepf').click(); else if (e.key === 'ArrowLeft') $('.v3d-stepb').click();
  };
  document.addEventListener('keydown', onKey);

  // ---------------------------------------------------------------- boucle d'affichage
  const frameAt = k => st.F[Math.max(0, Math.min(st.F.length - 1, k))];
  let last = performance.now(), raf = 0, lastThought = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!st.info || st.F.length === 0) { stage.render(); return; }
    const maxK = st.F.length - 1;
    if (st.playing) {
      st.tr += dt * 10 * st.speed;
      if (st.tr >= maxK) { st.tr = maxK; if (st.done) { st.playing = false; syncPlay(); } }
    }
    if (st.done && st.tr >= maxK && !st.endSent) {
      st.endSent = true; const L = st.F[maxK];
      if (opts.onEnd) opts.onEnd({ vigie: L.vigie.out, dra: L.dra.out, tVigie: L.vigie.t, tDra: L.dra.t, scene: st.scene, seed: st.seed, cond: st.cond, spec: st.spec });
    }
    const i = Math.floor(st.tr), a = st.tr - i, fa = frameAt(i), fb = frameAt(i + 1);
    const tk = Math.min(maxK, i + 1);                          // décision en cours d'exécution
    const fk = frameAt(tk), split = !!fk.diverged;
    if (split !== stage.split) { stage.setSplit(split); applyDra(); if (split) { toast('Les personnes réagissent différemment aux deux robots : chacun a maintenant son propre monde.'); if (st.view === 'maquette' || st.view === 'plan') stage.setView(st.view); } st.dirty = true; }
    stage.pose(fa, fb, a);
    if (i !== st.trailK) { stage.setTrails(st.F, i); st.trailK = i; }
    const fastEnough = !st.playing || now - lastThought > (st.speed > 1.5 ? 70 : 0);
    if ((tk !== st.shownK || st.dirty) && fastEnough) {
      lastThought = now; st.shownK = tk; st.dirty = false;
      const vb = fk.vigie.brain;
      st.names = vb && !vb.empty ? nameOptions(vb.cands, fk.vigie.brain.smith ? fk.vigie.brain.smith.pred : fk.vigie.s, st.info.goal) : [];
      stage.drawThoughts(fk, { layers: st.layers, hover: st.hover, names: st.names, showDra: st.layers.dra || stage.split, heatT: st.heatT, spaceTime: st.view === 'espace' || stage.spaceTimeOn });
      if (st.tab === 'decision') decisionPane(fk); else if (st.tab === 'compare') comparePane(fk);
      scoreBox(fk); personCard(fk);
    }
    $('.v3d-scrub').value = String(Math.round(st.tr));
    $('.v3d-clock').textContent = `${fmt(st.tr * 0.1)} s`;
    stage.stepCamera(dt, stage.arenas[0].robots.vigie);
    placeLabels(fa, fb, a);
    stage.render();
  }
  raf = requestAnimationFrame(loop);

  // ---------------------------------------------------------------- démarrage
  syncTop(); syncLayers(); setView('maquette'); setTab('decision'); syncPlay();
  start();
  const destroy = () => { if (editor) editor.close(); cancelAnimationFrame(raf); stopCalc(); themeObs.disconnect(); document.removeEventListener('keydown', onKey); document.body.classList.remove('v3d-noscroll'); stage.dispose(); };
  // commandes pour une application hôte (application VIGIE) ; RoboMaster n'utilise que la fonction de nettoyage
  destroy.load = (w = {}) => { Object.assign(st, { scene: w.scene || st.scene, seed: w.seed || st.seed, cond: w.cond || st.cond, params: w.params || st.params, spec: w.spec || (w.scene === 'perso' ? st.spec : null) }); syncTop(); start(); };
  destroy.edit = () => $('.v3d-editbtn').click();
  destroy.play = () => { st.playing = true; syncPlay(); };
  destroy.pause = () => { st.playing = false; syncPlay(); };
  destroy.setHideOutcomes = b => { st.hideOut = !!b; renderMarks(); };
  destroy.world = () => ({ scene: st.scene, seed: st.seed, cond: st.cond, params: st.params, spec: st.spec });
  destroy.stage = root.querySelector('.v3d-stage');
  return destroy;
}
