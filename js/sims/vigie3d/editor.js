// Éditeur de monde : déplacer le départ et l'arrivée, poser ou retirer des obstacles et des personnes,
// puis faire courir VIGIE 6 et DRA-MPPI dans ce monde. Le monde est décrit par une petite structure
// (normalizeSpec dans vigie6/world.js) que le moteur construit tel quel.

import { World, SCENES, normalizeSpec, pathExists, PERSO_LIMITS } from '../vigie6/world.js';
import { R_ROB, SIZE } from '../vigie-core.js';

const STORE = 'vigie.editeur.v1';
const TOOLS = [
  ['goal', 'Arrivée', 'Touche l\'endroit où le robot doit aller.'],
  ['start', 'Départ', 'Touche l\'endroit d\'où part le robot. Il partira tourné vers l\'arrivée.'],
  ['obst', 'Obstacle', 'Touche pour poser un obstacle de la taille choisie.'],
  ['person', 'Personne', 'Pose le doigt où elle se trouve, puis glisse : la flèche donne sa direction et sa vitesse.'],
  ['move', 'Déplacer', 'Fais glisser un élément pour le déplacer.'],
  ['erase', 'Gomme', 'Touche un obstacle ou une personne pour le retirer.'],
];
export const BEHAVIORS = [
  ['intent', 'Marche, peut changer d\'avis', 'Va tout droit, puis à un moment imprévu tourne, s\'arrête ou accélère (comme dans le banc).'],
  ['errant', 'Flâne', 'Change souvent de direction, un peu au hasard.'],
  ['chasseur', 'Suit le robot', 'Se dirige vers le robot, sans le percuter exprès : il marche vers lui.'],
  ['immobile', 'Immobile', 'Reste sur place.'],
];
const KIND_LABEL = { intent: 'marche', errant: 'flâne', flux: 'traverse en boucle', chasseur: 'suit le robot', porte: 'passe la porte', immobile: 'immobile' };
const KIND_COLOR = { intent: '#2aa7ff', errant: '#a78bfa', flux: '#f472b6', chasseur: '#ff6b6b', porte: '#ffb547', immobile: '#9aa4b2' };
const COND_LIST = [['nominal', 'Vision complète'], ['perception', 'Perception limitée'], ['reactifs', 'Piétons qui réagissent']];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r2 = x => Math.round(x * 100) / 100;

/** Monde vide : départ à gauche, arrivée à droite, comme les scènes du banc. */
export const emptySpec = () => normalizeSpec({ start: [1.5, 10], goal: [18.5, 10], static: [], people: [] });

/** Monde de départ d'une scène du banc (même tirage que le simulateur). */
export const sceneSpec = (scene, seed) => new World(scene, seed).toSpec();

// ---------------------------------------------------------------- code à partager
const toB64 = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = s => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
export function encodeWorld(spec, cond = 'nominal') {
  const S = normalizeSpec(spec);
  const o = { c: cond, s: S.start.map(r2), g: S.goal.map(r2), o: S.static.map(c => c.map(r2)), p: S.people.map(q => [q.k, ...q.p.map(r2), ...q.v.map(r2), r2(q.r), q.sp != null ? r2(q.sp) : 0, q.mode || '', q.tSwitch != null ? r2(q.tSwitch) : 0]) };
  if (S.door) o.d = S.door.map(r2);
  return 'monde.' + toB64(JSON.stringify(o));
}
export function decodeWorld(code) {
  const m = String(code || '').trim().match(/^monde\.([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  try {
    const o = JSON.parse(fromB64(m[1]));
    const people = (o.p || []).map(a => ({ k: a[0], p: [a[1], a[2]], v: [a[3], a[4]], r: a[5], ...(a[6] ? { sp: a[6] } : {}), ...(a[7] ? { mode: a[7], tSwitch: a[8] } : {}) }));
    const cond = COND_LIST.some(c => c[0] === o.c) ? o.c : 'nominal';
    return { spec: normalizeSpec({ start: o.s, goal: o.g, door: o.d || null, static: o.o, people }), cond };
  } catch { return null; }
}

export function savedSpec() { try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); return s ? normalizeSpec(s) : null; } catch { return null; } }
function save(spec) { try { localStorage.setItem(STORE, JSON.stringify(spec)); } catch { /* stockage indisponible */ } }

// ---------------------------------------------------------------- l'éditeur
/**
 * Ouvre l'éditeur par-dessus le simulateur.
 * opts : spec (monde de départ), cond, onRun(spec, cond), onClose().
 */
export function openEditor(host, opts = {}) {
  let spec = normalizeSpec(opts.spec || savedSpec() || emptySpec());
  let cond = opts.cond || 'nominal', tool = 'goal', behavior = 'intent', size = 0.6;
  const undo = [];
  const el = document.createElement('div');
  el.className = 'v3d-ed'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Modifier le monde');
  el.innerHTML = `
    <div class="v3d-ed-card">
      <div class="v3d-ed-head"><b>Modifier le monde</b><button class="v3d-btn ghost" data-a="close" aria-label="Fermer">Fermer</button></div>
      <div class="v3d-ed-tools" role="radiogroup" aria-label="Outil">${TOOLS.map(([k, l]) => `<button role="radio" data-t="${k}">${l}</button>`).join('')}</div>
      <div class="v3d-ed-opts"></div>
      <div class="v3d-ed-canvas"><canvas aria-label="Plan du monde, vu du dessus"></canvas></div>
      <p class="v3d-ed-legend"><span><i style="background:#35d0ba"></i>robot et arrivée</span><span><i style="background:#8c96a6"></i>obstacle</span>${BEHAVIORS.map(([k, l]) => `<span><i style="background:${KIND_COLOR[k]}"></i>${esc(l.toLowerCase())}</span>`).join('')}<span><i style="background:${KIND_COLOR.flux}"></i>traverse en boucle</span><span><i style="background:${KIND_COLOR.porte}"></i>passe la porte</span></p>
      <p class="v3d-ed-hint"></p>
      <p class="v3d-ed-status" aria-live="polite"></p>
      <div class="v3d-ed-row">
        <label class="v3d-select"><select data-a="base" aria-label="Partir d'une scène"><option value="">Partir d'une scène…</option><option value="vide">Monde vide</option>${Object.entries(SCENES).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></label>
        <button class="v3d-btn" data-a="undo">Annuler</button>
        <button class="v3d-btn" data-a="clear">Tout retirer</button>
        <button class="v3d-btn" data-a="code">Code</button>
      </div>
      <div class="v3d-ed-row">
        <div class="v3d-seg" role="radiogroup" aria-label="Condition">${COND_LIST.map(([v, l]) => `<button role="radio" data-c="${v}">${l}</button>`).join('')}</div>
        <button class="v3d-btn primary" data-a="run">Lancer la course</button>
      </div>
      <div class="v3d-ed-code" hidden>
        <p class="v3d-small">Ce code contient tout le monde dessiné et la condition choisie. Recopie-le pour le garder ou le partager ; colle un code reçu pour l'ouvrir.</p>
        <textarea spellcheck="false" autocapitalize="off" rows="3" aria-label="Code du monde"></textarea>
        <div class="v3d-ed-row"><button class="v3d-btn" data-a="copy">Copier</button><button class="v3d-btn" data-a="paste">Ouvrir ce code</button></div>
      </div>
    </div>`;
  host.appendChild(el);
  const $ = s => el.querySelector(s);
  const cv = $('canvas'), ctx = cv.getContext('2d');
  let px = 1, drag = null, msgT = 0;

  // ------------------------------------------------------------ dessin
  const light = () => document.documentElement.getAttribute('data-theme') === 'light';
  function fit() {
    const box = $('.v3d-ed-canvas'), w = Math.max(240, Math.min(box.clientWidth, 560, window.innerHeight - 300));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = cv.style.height = `${w}px`; cv.width = cv.height = Math.round(w * dpr);
    px = cv.width / SIZE; draw();
  }
  const X = x => x * px, Y = y => (SIZE - y) * px;           // y vers le haut, comme dans le banc
  function draw() {
    const L = light();
    ctx.fillStyle = L ? '#f4f6fa' : '#0f1828'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = L ? '#dfe4ec' : '#1d2a40'; ctx.lineWidth = 1;
    for (let i = 1; i < SIZE; i++) { ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), cv.height); ctx.moveTo(0, Y(i)); ctx.lineTo(cv.width, Y(i)); ctx.stroke(); }
    ctx.strokeStyle = L ? '#9aa4b2' : '#3b4a63'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, cv.width - 2, cv.height - 2);
    // arrivée
    const [gx, gy] = spec.goal;
    ctx.fillStyle = 'rgba(53,208,186,.22)'; ctx.beginPath(); ctx.arc(X(gx), Y(gy), 0.5 * px, 0, 7); ctx.fill();
    ctx.strokeStyle = '#35d0ba'; ctx.lineWidth = Math.max(1.5, px * 0.06); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(gx), Y(gy)); ctx.lineTo(X(gx), Y(gy + 1.1)); ctx.stroke();
    ctx.fillStyle = '#35d0ba'; ctx.beginPath(); ctx.moveTo(X(gx), Y(gy + 1.1)); ctx.lineTo(X(gx + 0.7), Y(gy + 0.9)); ctx.lineTo(X(gx), Y(gy + 0.7)); ctx.fill();
    // obstacles
    ctx.fillStyle = L ? '#8c96a6' : '#4a5873';
    for (const [x, y, r] of spec.static) { ctx.beginPath(); ctx.arc(X(x), Y(y), r * px, 0, 7); ctx.fill(); }
    if (spec.door) { ctx.strokeStyle = '#ffb547'; ctx.setLineDash([px * 0.3, px * 0.2]); ctx.beginPath(); ctx.arc(X(spec.door[0]), Y(spec.door[1]), 0.6 * px, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    // personnes
    for (const q of spec.people) {
      const c = KIND_COLOR[q.k] || '#9aa4b2', [x, y] = q.p;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(x), Y(y), q.r * px, 0, 7); ctx.fill();
      if (q.k !== 'chasseur' && q.k !== 'immobile' && Math.hypot(q.v[0], q.v[1]) > 0.05) arrow(x, y, x + q.v[0], y + q.v[1], c);
      if (q.k === 'chasseur') { ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(spec.start[0]), Y(spec.start[1])); ctx.stroke(); ctx.setLineDash([]); }
    }
    // robot au départ, tourné vers l'arrivée
    const [sx, sy] = spec.start, h = Math.atan2(gy - sy, gx - sx);
    ctx.fillStyle = L ? '#0f9e8a' : '#35d0ba'; ctx.beginPath(); ctx.arc(X(sx), Y(sy), R_ROB * px, 0, 7); ctx.fill();
    ctx.strokeStyle = L ? '#04121a' : '#04121a'; ctx.lineWidth = Math.max(1.5, px * 0.08);
    ctx.beginPath(); ctx.moveTo(X(sx), Y(sy)); ctx.lineTo(X(sx + 0.3 * Math.cos(h)), Y(sy + 0.3 * Math.sin(h))); ctx.stroke();
    if (drag && drag.kind === 'new-person') arrow(drag.p[0], drag.p[1], drag.cur[0], drag.cur[1], KIND_COLOR[behavior]);
    status();
  }
  function arrow(x0, y0, x1, y1, c) {
    const a = Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0)), hl = Math.max(6, px * 0.3);
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = Math.max(1.5, px * 0.07);
    ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x1) - hl * Math.cos(a - 0.4), Y(y1) - hl * Math.sin(a - 0.4)); ctx.lineTo(X(x1) - hl * Math.cos(a + 0.4), Y(y1) - hl * Math.sin(a + 0.4)); ctx.fill();
  }
  function status() {
    const ok = pathExists(spec), d = Math.hypot(spec.goal[0] - spec.start[0], spec.goal[1] - spec.start[1]);
    $('.v3d-ed-status').innerHTML = `${ok ? '<span class="ok">Un passage existe entre le départ et l\'arrivée.</span>' : '<span class="ko">Aucun passage assez large entre le départ et l\'arrivée : le robot ne pourra pas arriver (tu peux quand même lancer la course).</span>'}
      <span class="v3d-small">${spec.static.length} obstacle${spec.static.length > 1 ? 's' : ''} · ${spec.people.length} personne${spec.people.length > 1 ? 's' : ''} · trajet à vol d'oiseau ${d.toFixed(1).replace('.', ',')} m</span>`;
  }

  // ------------------------------------------------------------ outils
  function syncTools() {
    el.querySelectorAll('[data-t]').forEach(b => { const on = b.dataset.t === tool; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    el.querySelectorAll('[data-c]').forEach(b => { const on = b.dataset.c === cond; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $('.v3d-ed-hint').textContent = TOOLS.find(t => t[0] === tool)[2];
    const o = $('.v3d-ed-opts');
    if (tool === 'obst') o.innerHTML = `<label class="v3d-select"><span>Rayon</span><input type="range" min="${PERSO_LIMITS.rMin}" max="1.5" step="0.05" value="${size}" data-o="size"><b>${size.toFixed(2).replace('.', ',')} m</b></label>`;
    else if (tool === 'person') o.innerHTML = `<div class="v3d-ed-beh" role="radiogroup" aria-label="Comportement">${BEHAVIORS.map(([k, l, d]) => `<button role="radio" data-b="${k}" title="${esc(d)}" class="${k === behavior ? 'on' : ''}" aria-checked="${k === behavior}"><i style="background:${KIND_COLOR[k]}"></i>${l}</button>`).join('')}</div><p class="v3d-small">${esc(BEHAVIORS.find(b => b[0] === behavior)[2])}</p>`;
    else o.innerHTML = '';
  }
  function say(t) { const h = $('.v3d-ed-hint'); h.textContent = t; h.classList.add('warn'); clearTimeout(msgT); msgT = setTimeout(() => { h.classList.remove('warn'); syncTools(); }, 2800); }
  const snapshot = () => { undo.push(JSON.stringify(spec)); if (undo.length > 60) undo.shift(); };
  const commit = () => { spec = normalizeSpec(spec); save(spec); draw(); };
  const toWorld = e => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * SIZE, y = SIZE - (e.clientY - r.top) / r.height * SIZE; return [Math.min(SIZE - 0.5, Math.max(0.5, x)), Math.min(SIZE - 0.5, Math.max(0.5, y))]; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  // place libre pour le robot (départ) ou la zone d'arrivée
  const freeFor = (p, rad, skip = null) => spec.static.every((c, i) => i === skip || dist(p, c) > c[2] + rad);
  function pick(p) {
    let best = null, bd = 0.9;
    const consider = (kind, i, q, r) => { const d = dist(p, q) - r; if (d < bd) { bd = d; best = { kind, i }; } };
    spec.people.forEach((q, i) => consider('person', i, q.p, q.r));
    spec.static.forEach((c, i) => consider('obst', i, c, c[2]));
    consider('start', -1, spec.start, R_ROB); consider('goal', -1, spec.goal, 0.5);
    return best;
  }
  function placeRobotPoint(which, p) {
    const other = which === 'start' ? spec.goal : spec.start;
    if (!freeFor(p, which === 'start' ? R_ROB + 0.15 : 0.6)) { say(which === 'start' ? 'Le robot ne tient pas là : un obstacle le touche.' : 'L\'arrivée ne peut pas être dans un obstacle.'); return false; }
    if (dist(p, other) < 1.5) { say('Le départ et l\'arrivée doivent être à au moins 1,5 m l\'un de l\'autre.'); return false; }
    spec[which] = p; return true;
  }
  function addObstacle(p) {
    if (spec.static.length >= PERSO_LIMITS.static) { say(`Au plus ${PERSO_LIMITS.static} obstacles.`); return; }
    if (dist(p, spec.start) < size + R_ROB + 0.2) { say('Trop près du robot : il serait déjà dans l\'obstacle.'); return; }
    if (dist(p, spec.goal) < size + 0.5) { say('Trop près de l\'arrivée : elle doit rester atteignable.'); return; }
    snapshot(); spec.static.push([p[0], p[1], size]); commit();
  }

  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const p = toWorld(e);
    if (tool === 'goal' || tool === 'start') { snapshot(); if (placeRobotPoint(tool, p)) { commit(); drag = { kind: tool }; } else undo.pop(); }
    else if (tool === 'obst') addObstacle(p);
    else if (tool === 'person') {
      if (spec.people.length >= PERSO_LIMITS.people) { say(`Au plus ${PERSO_LIMITS.people} personnes.`); return; }
      if (dist(p, spec.start) < 0.35 + R_ROB + 0.8) { say('Trop près du robot au départ : laisse-lui au moins 80 cm.'); return; }
      drag = { kind: 'new-person', p, cur: p }; draw();
    } else if (tool === 'move') { const h = pick(p); if (h) { snapshot(); drag = { kind: 'move', h, moved: false }; } }
    else if (tool === 'erase') {
      const h = pick(p);
      if (!h) return;
      if (h.kind === 'start' || h.kind === 'goal') { say('Le départ et l\'arrivée ne s\'effacent pas : déplace-les.'); return; }
      snapshot(); (h.kind === 'person' ? spec.people : spec.static).splice(h.i, 1); commit();
    }
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toWorld(e);
    if (drag.kind === 'goal' || drag.kind === 'start') { if (placeRobotPoint(drag.kind, p)) draw(); }
    else if (drag.kind === 'new-person') { drag.cur = p; draw(); }
    else if (drag.kind === 'move') {
      const { kind, i } = drag.h; drag.moved = true;
      if (kind === 'start' || kind === 'goal') { if (placeRobotPoint(kind, p)) draw(); }
      else if (kind === 'obst') {
        const r = spec.static[i][2];
        if (dist(p, spec.start) > r + R_ROB + 0.2 && dist(p, spec.goal) > r + 0.5) { spec.static[i] = [p[0], p[1], r]; draw(); }
      } else if (dist(p, spec.start) > 0.35 + R_ROB + 0.8) { spec.people[i].p = p; draw(); }
    }
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.kind === 'new-person') {
      let v = [d.cur[0] - d.p[0], d.cur[1] - d.p[1]];
      const n = Math.hypot(v[0], v[1]);
      if (n > PERSO_LIMITS.vMax) v = [v[0] / n * PERSO_LIMITS.vMax, v[1] / n * PERSO_LIMITS.vMax];
      if (behavior === 'immobile' || behavior === 'chasseur') v = [0, 0];
      if ((behavior === 'intent' || behavior === 'errant') && n < 0.15) say('Personne posée sans vitesse : elle reste sur place. Glisse en la posant pour la faire marcher.');
      snapshot();
      spec.people.push({ k: behavior, p: d.p, v, r: 0.35, ...(behavior === 'chasseur' ? { sp: 0.9 } : {}) });
    } else if (d.kind === 'move' && !d.moved) undo.pop();
    commit();
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  el.addEventListener('input', e => {
    if (e.target.dataset.o === 'size') { size = +e.target.value; e.target.nextElementSibling.textContent = `${size.toFixed(2).replace('.', ',')} m`; }
  });
  el.addEventListener('change', e => {
    if (e.target.dataset.a !== 'base' || !e.target.value) return;
    const v = e.target.value; e.target.value = '';
    snapshot(); spec = v === 'vide' ? emptySpec() : sceneSpec(v, opts.seed || 1); commit();
  });
  el.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]'), c = e.target.closest('[data-c]'), b = e.target.closest('[data-b]'), a = e.target.closest('[data-a]');
    if (t) { tool = t.dataset.t; syncTools(); return; }
    if (c) { cond = c.dataset.c; syncTools(); return; }
    if (b) { behavior = b.dataset.b; syncTools(); return; }
    if (!a || a.tagName === 'SELECT') return;
    const act = a.dataset.a;
    if (act === 'close') close();
    else if (act === 'undo') { if (undo.length) { spec = JSON.parse(undo.pop()); commit(); } else say('Rien à annuler.'); }
    else if (act === 'clear') { snapshot(); spec = normalizeSpec({ start: spec.start, goal: spec.goal }); commit(); }
    else if (act === 'code') { const box = $('.v3d-ed-code'); box.hidden = !box.hidden; if (!box.hidden) $('textarea').value = encodeWorld(spec, cond); }
    else if (act === 'copy') {
      const v = $('textarea').value; let ok = false;
      try { await navigator.clipboard.writeText(v); ok = true; } catch { $('textarea').select(); try { ok = document.execCommand('copy'); } catch { ok = false; } }
      say(ok ? 'Code copié.' : 'Copie impossible : sélectionne le code et recopie-le.');
    } else if (act === 'paste') {
      const w = decodeWorld($('textarea').value);
      if (!w) { say('Code illisible : il doit commencer par « monde. ».'); return; }
      snapshot(); spec = w.spec; cond = w.cond; commit(); syncTools(); say('Monde ouvert.');
    } else if (act === 'run') { save(spec); const s = normalizeSpec(spec); close(); opts.onRun && opts.onRun(s, cond); }
  });
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => fit()); ro.observe($('.v3d-ed-canvas'));
  let closed = false;
  function close() { if (closed) return; closed = true; ro.disconnect(); document.removeEventListener('keydown', onKey); el.remove(); opts.onClose && opts.onClose(); }
  syncTools(); fit();
  return { close, get spec() { return spec; } };
}

export { KIND_LABEL };
