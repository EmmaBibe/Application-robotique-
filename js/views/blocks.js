// Rendu des blocs de contenu d'une leçon : texte, formules, pipelines, quiz,
// exercices numériques, exercices de code, défis et simulateurs.
import { store } from '../core/store.js';
import { gain, XP } from '../core/gamify.js';
import { mountSim } from '../sims/index.js';
import { esc } from '../core/ui.js';

const LETTERS = 'ABCDEFGH';

export function renderBlocks(container, blocks, ctx = {}) {
  const cleanups = [];
  for (const b of blocks) {
    const el = renderOne(b, ctx, cleanups);
    if (el) container.appendChild(el);
  }
  return () => cleanups.forEach(fn => { try { fn(); } catch { /* déjà détruit */ } });
}

function div(cls, html = '') {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = html;
  return d;
}

function renderOne(b, ctx, cleanups) {
  if (typeof b === 'string') return div('prose', b);
  switch (b.t) {
    case 'p': return div('prose', b.html);
    case 'h': { const h = document.createElement(b.level === 3 ? 'h3' : 'h2'); h.textContent = b.text; if (b.anchor) h.id = b.anchor; return h; }
    case 'callout': {
      const labels = { tip: 'Astuce', warn: 'Attention', danger: 'Sécurité', future: 'Demain', real: 'Dans la vraie vie', info: 'À retenir' };
      const icons = { tip: '💡', warn: '⚠️', danger: '⛑️', future: '🔭', real: '🏭', info: '📌' };
      return div(`callout ${b.kind || 'info'}`, `<div class="ttl">${icons[b.kind || 'info']} ${esc(b.title || labels[b.kind || 'info'])}</div><div class="prose">${b.html}</div>`);
    }
    case 'formula': return div('formula', `${b.html}${b.label ? `<span class="lbl">${b.label}</span>` : ''}`);
    case 'svg': return div('card', b.html);
    case 'table': {
      const d = div('prose');
      d.innerHTML = `<table><thead><tr>${b.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      return d;
    }
    case 'pipeline': return pipeline(b);
    case 'sim': return sim(b, cleanups, ctx);
    case 'quiz': return quiz(b, ctx);
    case 'exo': return exo(b, ctx);
    case 'code': return code(b, ctx);
    case 'defi': return defi(b, cleanups, ctx);
    case 'think': {
      const d = div('exo');
      d.innerHTML = `<div class="head"><span class="tag violet">À toi de réfléchir</span></div><div class="prose">${b.q}</div>
        <textarea placeholder="Écris ta réponse ici avant de regarder. Elle sera gardée dans ton carnet."></textarea>
        <details><summary>Voir une piste de réponse</summary><div class="sol prose">${b.a}</div></details>`;
      const ta = d.querySelector('textarea');
      const key = `think:${b.id || b.q.slice(0, 40)}`;
      const saved = (store.get().notes.find(n => n.key === key) || {}).body;
      if (saved) ta.value = saved;
      ta.addEventListener('change', () => {
        store.update(s => {
          const n = s.notes.find(x => x.key === key);
          if (n) { n.body = ta.value; n.at = new Date().toISOString(); }
          else if (ta.value.trim()) s.notes.unshift({ id: Date.now().toString(36), key, title: `Réflexion : ${ctx.lessonTitle || ''}`, body: ta.value, tag: 'réflexion', at: new Date().toISOString() });
        });
      });
      return d;
    }
    case 'calc': return calc(b, ctx);
    case 'dossier': return dossier(b, ctx);
    case 'brief': return div('brief', `<div class="brief-k">${esc(b.kicker || 'Briefing de mission')}</div><div class="prose">${b.html}</div>${b.tags ? `<div class="brief-tags">${b.tags.map(t => `<span class="tag accent">${esc(t)}</span>`).join('')}</div>` : ''}`);
    case 'twist': return div('callout twist', `<div class="ttl">🚨 ${esc(b.title || 'Imprévu')}</div><div class="prose">${b.html}</div>`);
    default: return null;
  }
}

function pipeline(b) {
  const wrap = div('');
  if (b.title) wrap.appendChild(div('eyebrow', esc(b.title)));
  const p = div('pipeline');
  const detail = div('callout tip');
  detail.hidden = true;
  b.steps.forEach((s, i) => {
    const step = div('pipe-step', `<div class="pipe-box" tabindex="0" role="button"><div class="n">ÉTAPE ${i + 1}</div><div class="t">${s.t}</div><div class="d">${s.d}</div>${s.ex ? `<div class="ex">${s.ex}</div>` : ''}</div>`);
    const open = () => {
      p.querySelectorAll('.pipe-step').forEach(x => x.classList.toggle('on', x === step));
      if (s.more) { detail.hidden = false; detail.innerHTML = `<div class="ttl">Étape ${i + 1} : ${s.t}</div><div class="prose">${s.more}</div>`; }
    };
    step.querySelector('.pipe-box').addEventListener('click', open);
    step.querySelector('.pipe-box').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    p.appendChild(step);
  });
  wrap.appendChild(p);
  if (b.steps.some(s => s.more)) {
    wrap.appendChild(div('small faint', 'Touche une étape pour voir ce qui s\'y passe en détail.'));
    wrap.appendChild(detail);
  }
  return wrap;
}

function sim(b, cleanups, ctx) {
  const el = div('');
  el.innerHTML = '<div class="card small muted">Chargement du simulateur…</div>';
  store.update(s => { s.sims[b.id] = (s.sims[b.id] || 0) + 1; });
  const holder = div('');
  el.replaceChildren(holder);
  let destroy = null, alive = true;
  mountSim(b.id, holder, b.opts || {}, ctx.simApi || {}).then(fn => { if (alive) destroy = fn; else fn(); });
  cleanups.push(() => { alive = false; destroy && destroy(); });
  if (b.caption) el.appendChild(div('small muted', b.caption));
  return el;
}

function quiz(b, ctx) {
  const id = `${ctx.lessonId || 'x'}:${b.id}`;
  const d = div('quiz');
  const prev = store.get().quiz[id];
  d.innerHTML = `<div class="head"><span class="tag accent">Quiz</span>${prev?.ok ? '<span class="tag ok">déjà réussi</span>' : ''}</div><div class="q">${b.q}</div><div class="opts"></div><div class="explain" hidden></div>`;
  const opts = d.querySelector('.opts');
  const exp = d.querySelector('.explain');
  let tries = 0, done = false;
  b.opts.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt';
    btn.innerHTML = `<span class="k">${LETTERS[i]}</span><span>${o}</span>`;
    btn.addEventListener('click', () => {
      if (done) return;
      tries++;
      if (i === b.a) {
        done = true;
        btn.classList.add('good');
        opts.querySelectorAll('.opt').forEach(x => x.disabled = true);
        exp.hidden = false;
        exp.innerHTML = `<b>${tries === 1 ? 'Exact.' : 'Oui, c\'est ça.'}</b> ${b.why || ''}`;
        const first = !store.get().quiz[id]?.ok;
        store.update(s => { s.quiz[id] = { ok: true, tries: s.quiz[id]?.tries || tries }; });
        if (first) gain(tries === 1 ? XP.quiz : Math.round(XP.quiz / 2));
      } else {
        btn.classList.add('bad');
        btn.disabled = true;
        exp.hidden = false;
        exp.innerHTML = b.wrong?.[i] ? `Pas tout à fait : ${b.wrong[i]}` : 'Pas tout à fait. Relis la question et réessaie, c\'est en se trompant qu\'on retient.';
        store.update(s => { if (!s.quiz[id]) s.quiz[id] = { ok: false, tries: 0 }; s.quiz[id].tries = (s.quiz[id].tries || 0) + 1; });
      }
    });
    opts.appendChild(btn);
  });
  return d;
}

function normalize(s) {
  return String(s).trim().toLowerCase().replace(',', '.').replace(/\s+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function exo(b, ctx) {
  const id = `${ctx.lessonId || 'x'}:${b.id}`;
  const d = div('exo');
  const done = store.get().exos[id]?.ok;
  d.innerHTML = `<div class="head"><span class="tag warn">Exercice</span>${b.level ? `<span class="tag">${'★'.repeat(b.level)}</span>` : ''}${done ? '<span class="tag ok">réussi</span>' : ''}</div>
    <div class="prose">${b.q}</div>
    ${b.answer !== undefined ? `<div class="answer"><input type="text" inputmode="decimal" placeholder="Ta réponse${b.unit ? ' (en ' + esc(b.unit) + ')' : ''}" aria-label="Ta réponse"><button class="btn primary" type="button">Vérifier</button></div><div class="fb" hidden></div>` : ''}
    ${b.hint ? `<details><summary>Un indice</summary><div class="sol prose">${b.hint}</div></details>` : ''}
    <details class="soldet"><summary>Voir la solution détaillée</summary><div class="sol prose">${b.sol || ''}</div></details>`;
  if (b.answer !== undefined) {
    const input = d.querySelector('input'), fb = d.querySelector('.fb');
    const check = () => {
      const v = input.value;
      let ok;
      if (typeof b.answer === 'number') {
        const n = parseFloat(normalize(v));
        const tol = b.tol ?? Math.max(Math.abs(b.answer) * 0.02, 1e-6);
        ok = Number.isFinite(n) && Math.abs(n - b.answer) <= tol;
      } else {
        const accepted = [].concat(b.answer).map(normalize);
        ok = accepted.includes(normalize(v));
      }
      fb.hidden = false;
      fb.className = 'fb ' + (ok ? 'ok' : 'ko');
      fb.textContent = ok ? 'Juste. Bien joué.' : 'Pas encore. Vérifie tes unités et ton calcul, ou prends l\'indice.';
      if (ok && !store.get().exos[id]?.ok) {
        store.update(s => { s.exos[id] = { ok: true }; });
        gain(XP.exo, 'Exercice réussi');
      }
    };
    d.querySelector('.answer button').addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  }
  return d;
}

function code(b, ctx) {
  const id = `code:${ctx.lessonId || 'x'}:${b.id}`;
  const d = div('exo');
  const done = store.get().exos[id]?.ok;
  const savedKey = `robomaster.code.${id}`;
  let saved = null;
  try { saved = localStorage.getItem(savedKey); } catch { /* stockage indisponible */ }
  d.innerHTML = `<div class="head"><span class="tag violet">Code</span>${done ? '<span class="tag ok">réussi</span>' : ''}</div>
    <div class="prose">${b.q}</div>
    <textarea class="code-area" spellcheck="false" aria-label="Ton code"></textarea>
    <div class="row" style="margin-top:.6rem"><button class="btn primary" type="button" data-k="run">Exécuter les tests</button><button class="btn ghost small" type="button" data-k="reset">Repartir du modèle</button><span class="kbd-hint">Ctrl + Entrée</span></div>
    <div class="console" style="margin-top:.6rem" hidden></div>
    ${b.hint ? `<details><summary>Un indice</summary><div class="sol prose">${b.hint}</div></details>` : ''}
    ${b.sol ? `<details><summary>Voir une solution</summary><div class="sol"><pre><code>${esc(b.sol)}</code></pre></div></details>` : ''}`;
  const ta = d.querySelector('textarea'), con = d.querySelector('.console');
  ta.value = saved || b.starter;
  ta.rows = Math.min(22, Math.max(8, ta.value.split('\n').length + 1));
  ta.addEventListener('input', () => { try { localStorage.setItem(savedKey, ta.value); } catch { /* ignoré */ } });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  d.querySelector('[data-k=reset]').addEventListener('click', () => { ta.value = b.starter; try { localStorage.removeItem(savedKey); } catch { /* ignoré */ } });
  const line = (txt, cls) => { const l = document.createElement('div'); if (cls) l.className = cls; l.textContent = txt; con.appendChild(l); };
  function run() {
    con.hidden = false; con.textContent = '';
    const logs = [];
    let fn;
    try {
      const guarded = ta.value.replace(/\b(for|while)\s*\(([^)]*)\)\s*\{/g, m => `${m} if (++__g > 2e6) throw new Error("Boucle infinie ?");`);
      fn = new Function('console', `"use strict"; let __g = 0;\n${guarded}\n;return typeof ${b.fn} === 'function' ? ${b.fn} : null;`)({ log: (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')) });
      if (!fn) throw new Error(`La fonction ${b.fn} n'existe pas.`);
    } catch (e) { line('Erreur de syntaxe : ' + e.message, 'err'); return; }
    let pass = 0;
    for (const [args, expected] of b.tests) {
      let got, err = null;
      try { got = fn(...structuredClone(args)); } catch (e) { err = e.message; }
      const ok = !err && same(got, expected);
      if (ok) pass++;
      line(`${ok ? '✔' : '✘'} ${b.fn}(${args.map(a => JSON.stringify(a)).join(', ')}) → ${err ? 'erreur : ' + err : show(round(got))}${ok ? '' : `   (attendu : ${show(expected)})`}`, ok ? 'ok' : 'err');
    }
    logs.slice(0, 20).forEach(l => line('log : ' + l));
    line(`${pass} / ${b.tests.length} tests réussis`, pass === b.tests.length ? 'ok' : 'err');
    if (pass === b.tests.length && !store.get().exos[id]?.ok) {
      store.update(s => { s.exos[id] = { ok: true }; });
      gain(XP.code, 'Exercice de code réussi');
    }
  }
  d.querySelector('[data-k=run]').addEventListener('click', run);
  return d;
}
const show = v => (v === Infinity ? 'Infinity' : v === -Infinity ? '-Infinity' : JSON.stringify(v));
const round = v => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : Array.isArray(v) ? v.map(round) : v;
function same(a, b) {
  if (a === b) return true;
  if (typeof b === 'number') return typeof a === 'number' && Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(b));
  if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (b && typeof b === 'object') return a && typeof a === 'object' && Object.keys(b).every(k => same(a[k], b[k]));
  return a === b;
}

function defi(b, cleanups, ctx) {
  const id = b.id;
  const d = div('defi' + (store.get().defis[id]?.done ? ' done' : ''));
  const isDone = () => store.get().defis[id]?.done;
  d.innerHTML = `<div class="head"><span class="tag warn">Défi</span><h4>${esc(b.title)}</h4>${isDone() ? '<span class="tag ok">relevé</span>' : `<span class="tag">+${b.xp || XP.defi} XP</span>`}</div><div class="prose">${b.text}</div>`;
  if (b.sim) {
    const holder = div('');
    d.appendChild(holder);
    const api = {
      success() {
        if (isDone()) return;
        store.update(s => { s.defis[id] = { done: true, at: new Date().toISOString() }; });
        d.classList.add('done');
        gain(b.xp || XP.defi, `Défi relevé : ${b.title}`);
      },
    };
    const inner = sim({ id: b.sim, opts: { ...(b.opts || {}) } }, cleanups, { ...ctx, simApi: api });
    holder.appendChild(inner);
  } else if (b.manual) {
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.type = 'button';
    btn.textContent = isDone() ? 'Défi relevé' : 'J\'ai relevé ce défi';
    btn.disabled = isDone();
    btn.addEventListener('click', () => {
      store.update(s => { s.defis[id] = { done: true, at: new Date().toISOString() }; });
      gain(b.xp || XP.defi, `Défi relevé : ${b.title}`);
      btn.disabled = true; btn.textContent = 'Défi relevé'; d.classList.add('done');
    });
    d.appendChild(btn);
  }
  return d;
}


// ---------------------------------------------------------------------------
// Calculateur de conception : l'étudiant règle des paramètres, le calcul montre
// les conséquences et vérifie les contraintes. Toutes respectées = défi relevé.
function calc(b, ctx) {
  const id = b.id;
  const d = div('calc');
  const done = () => store.get().defis[id]?.done;
  d.innerHTML = `<div class="head"><span class="tag warn">Atelier de conception</span><h4>${esc(b.title)}</h4>${b.xp !== 0 ? `<span class="tag" data-k="st">${done() ? 'réussi' : `+${b.xp || XP.defi} XP`}</span>` : ''}</div>
    ${b.text ? `<div class="prose">${b.text}</div>` : ''}
    <div class="calc-grid"><div class="calc-in"></div><div class="calc-out"><div class="readout calc-res"></div><ul class="calc-checks"></ul></div></div>
    <div class="fb" hidden></div>`;
  const inBox = d.querySelector('.calc-in'), res = d.querySelector('.calc-res'), checks = d.querySelector('.calc-checks'), fb = d.querySelector('.fb');
  const vals = {};
  const savedKey = `robomaster.calc.${id}`;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(savedKey) || '{}'); } catch { saved = {}; }
  for (const inp of b.inputs) {
    vals[inp.k] = saved[inp.k] ?? inp.value;
    const w = document.createElement('label');
    w.className = 'ctl';
    if (inp.options) {
      w.innerHTML = `<span class="lab"><span>${esc(inp.label)}</span></span><select></select>`;
      const sel = w.querySelector('select');
      inp.options.forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; if (String(v) === String(vals[inp.k])) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', () => { vals[inp.k] = isNaN(+sel.value) ? sel.value : +sel.value; update(); });
    } else {
      const dg = inp.digits ?? (String(inp.step).split('.')[1]?.length || 0);
      w.innerHTML = `<span class="lab"><span>${esc(inp.label)}</span><b></b></span><input type="range">`;
      const r = w.querySelector('input'), out = w.querySelector('b');
      Object.assign(r, { min: inp.min, max: inp.max, step: inp.step, value: vals[inp.k] });
      const show = () => { out.textContent = `${Number(r.value).toFixed(dg)}${inp.unit ? ' ' + inp.unit : ''}`; };
      r.addEventListener('input', () => { vals[inp.k] = Number(r.value); show(); update(); });
      show();
    }
    inBox.appendChild(w);
  }
  function update() {
    let r;
    try { r = b.compute({ ...vals }); } catch (e) { r = { outputs: [['Erreur', e.message, '']], checks: [] }; }
    res.innerHTML = r.outputs.map(([l, v, u]) => `<span>${esc(l)}</span><b>${typeof v === 'number' ? fmtNum(v) : esc(v)}${u ? ' ' + esc(u) : ''}</b>`).join('');
    checks.innerHTML = (r.checks || []).map(([l, ok]) => `<li class="${ok ? 'ok' : 'ko'}">${ok ? '✔' : '✘'} ${esc(l)}</li>`).join('');
    try { localStorage.setItem(savedKey, JSON.stringify(vals)); } catch { /* ignoré */ }
    const all = (r.checks || []).length && r.checks.every(c => c[1]);
    fb.hidden = !all;
    if (all) {
      fb.className = 'fb ok';
      fb.textContent = b.okText || 'Toutes les contraintes sont respectées. Note dans ton carnet pourquoi ce compromis est le bon.';
      if (!done() && b.xp !== 0) {
        store.update(s => { s.defis[id] = { done: true, at: new Date().toISOString() }; });
        gain(b.xp || XP.defi, `Conception validée : ${b.title}`);
        const st = d.querySelector('[data-k=st]'); if (st) st.textContent = 'réussi';
      }
    }
  }
  update();
  return d;
}
function fmtNum(v) {
  if (!isFinite(v)) return '∞';
  const a = Math.abs(v);
  const s = a >= 1000 ? Math.round(v).toLocaleString('fr-FR') : a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : a >= 1 ? v.toFixed(2) : v.toFixed(3);
  return s.replace('.', ',');
}

// ---------------------------------------------------------------------------
// Dossier d'ingénieur : questions ouvertes, réponses gardées dans le carnet,
// grille d'auto-évaluation. Validé quand tout est rempli et la grille cochée.
function dossier(b, ctx) {
  const id = b.id;
  const d = div('exo dossier-box');
  const s0 = store.get();
  const isDone = () => store.get().defis[id]?.done;
  d.innerHTML = `<div class="head"><span class="tag violet">Dossier d'ingénieur</span><h4 style="margin:0">${esc(b.title)}</h4><span class="tag" data-k="st">${isDone() ? 'rendu' : `+${b.xp || 80} XP`}</span></div>
    ${b.text ? `<div class="prose">${b.text}</div>` : ''}
    <ol class="dos-q"></ol>
    ${b.rubric ? `<div class="rubric"><b>Grille d'auto-évaluation</b> <span class="small muted">(sois honnête : c'est toi que tu formes)</span><ul></ul></div>` : ''}
    <div class="row" style="margin-top:.7rem"><button class="btn primary" type="button" data-k="go">Rendre mon dossier</button><span class="small muted" data-k="msg"></span></div>`;
  const ol = d.querySelector('.dos-q');
  const notes = s0.notes;
  const areas = b.questions.map((q, i) => {
    const key = `dossier:${id}:${i}`;
    const li = document.createElement('li');
    li.innerHTML = `<div class="prose">${q}</div><textarea placeholder="Ta réponse, même provisoire. Elle est gardée dans ton carnet."></textarea>`;
    const ta = li.querySelector('textarea');
    ta.value = (notes.find(n => n.key === key) || {}).body || '';
    ta.addEventListener('change', () => {
      store.update(s => {
        const n = s.notes.find(x => x.key === key);
        if (n) { n.body = ta.value; n.at = new Date().toISOString(); }
        else if (ta.value.trim()) s.notes.unshift({ id: Date.now().toString(36) + i, key, title: `${b.title} · question ${i + 1}`, body: ta.value, tag: 'dossier', at: new Date().toISOString() });
      });
    });
    ol.appendChild(li);
    return ta;
  });
  const boxes = (b.rubric || []).map((r, i) => {
    const key = `robomaster.rubric.${id}.${i}`;
    const li = document.createElement('li');
    li.innerHTML = `<label class="check"><input type="checkbox"><span></span></label>`;
    li.querySelector('span').textContent = r;
    const c = li.querySelector('input');
    try { c.checked = localStorage.getItem(key) === '1'; } catch { /* ignoré */ }
    c.addEventListener('change', () => { try { localStorage.setItem(key, c.checked ? '1' : '0'); } catch { /* ignoré */ } });
    d.querySelector('.rubric ul').appendChild(li);
    return c;
  });
  const msg = d.querySelector('[data-k=msg]');
  d.querySelector('[data-k=go]').addEventListener('click', () => {
    const empty = areas.filter(a => a.value.trim().length < 40).length;
    const unchecked = boxes.filter(c => !c.checked).length;
    if (empty) { msg.textContent = `${empty} réponse${empty > 1 ? 's' : ''} trop courte${empty > 1 ? 's' : ''} : développe un peu (au moins quelques phrases).`; return; }
    if (unchecked) { msg.textContent = `Il reste ${unchecked} critère${unchecked > 1 ? 's' : ''} de la grille non validé${unchecked > 1 ? 's' : ''}. Améliore ton dossier, puis coche honnêtement.`; return; }
    areas.forEach(a => a.dispatchEvent(new Event('change')));
    if (!isDone()) {
      store.update(s => { s.defis[id] = { done: true, at: new Date().toISOString() }; });
      gain(b.xp || 80, `Dossier rendu : ${b.title}`);
    }
    d.querySelector('[data-k=st]').textContent = 'rendu';
    msg.textContent = 'Dossier rendu. Tes réponses sont dans ton carnet d\'ingénieur ; relis-les dans quelques semaines, tu verras ton chemin.';
  });
  return d;
}
