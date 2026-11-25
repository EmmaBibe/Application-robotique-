/* Niveau 6 (suite) : capteurs, sorties d'automate, arrêt d'urgence câblé, Grafcet (IEC 60848) et GEMMA.
 * Moteur Grafcet (AA.GRAFCET) : règles d'évolution de l'IEC 60848 —
 *  1) situation initiale = étapes initiales actives ;
 *  2) une transition est validée quand toutes ses étapes amont sont actives ;
 *  3) elle est franchie si elle est validée ET que sa réceptivité est vraie ;
 *  4) le franchissement désactive les étapes amont et active les étapes aval ;
 *  5) toutes les transitions franchissables le sont simultanément ;
 *  6) si une étape doit être à la fois activée et désactivée, elle reste active.
 *  Les évolutions fugaces sont enchaînées jusqu'à une situation stable avant d'appliquer les actions continues.
 * Actions : N (continue), S / R (mémorisée à l'activation), D (retardée), L (limitée dans le temps). */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n), esc = AA.esc;
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });

  /* ================= Moteur Grafcet ================= */
  const G = AA.GRAFCET = {};
  G.create = def => {
    const g = { def, t: 0, active: new Set(), since: {}, mem: new Set(), fired: 0 };
    Object.entries(def.steps).forEach(([id, s]) => { if (s.init) { g.active.add(+id); g.since[id] = 0; } });
    g.X = i => g.active.has(i);
    g.T = (i, sec) => g.active.has(i) && g.t - g.since[i] >= sec - 1e-9;
    g.evolve = I => {
      for (let pass = 0; pass < 10; pass++) {
        const fire = def.trans.filter(tr => tr.up.every(u => g.active.has(u)) && tr.f(I, g));
        if (!fire.length) return;
        const off = new Set(), on = new Set();
        fire.forEach(tr => { tr.up.forEach(u => off.add(u)); tr.down.forEach(d => on.add(d)); });
        off.forEach(u => { if (!on.has(u)) g.active.delete(u); });
        on.forEach(d => { if (!g.active.has(d) || off.has(d)) { g.active.add(d); g.since[d] = g.t; (def.steps[d].acts || []).forEach(a => { if (a.k === 'S') g.mem.add(a.o); if (a.k === 'R') g.mem.delete(a.o); }); } });
        g.fired += fire.length;
      }
    };
    g.outputs = () => {
      const o = new Set(g.mem);
      g.active.forEach(i => (def.steps[i].acts || []).forEach(a => {
        const dt = g.t - g.since[i];
        if (a.k === 'N' || (a.k === 'D' && dt >= a.d) || (a.k === 'L' && dt < a.d)) o.add(a.o);
      }));
      return o;
    };
    g.tick = (dt, I) => { g.t += dt; g.evolve(I); };
    return g;
  };
  /* Traduction en Ladder (méthode SET / RESET par étape) */
  G.equations = def => Object.keys(def.steps).map(Number).map(k => {
    const ins = def.trans.filter(tr => tr.down.includes(k)), outs = def.trans.filter(tr => tr.up.includes(k));
    const set = ins.map(tr => tr.up.map(u => 'X' + u).join('·') + ' · (' + tr.r + ')').join('  +  ');
    const rst = outs.map(tr => tr.down.map(d => 'X' + d).join('·')).join('  +  ');
    return { k, set, rst };
  });

  /* ================= Exemples ================= */
  const momentary = (I, k, dur) => { I[k] = true; I['_' + k] = dur || 0.35; };
  G.EX = {
    perceuse: {
      title: 'Poste de perçage',
      steps: { 0: { x: 140, y: 40, init: true }, 1: { x: 140, y: 150, acts: [{ k: 'N', o: 'DESC', t: 'Descendre' }, { k: 'N', o: 'ROT', t: 'Rotation broche' }] }, 2: { x: 140, y: 260, acts: [{ k: 'N', o: 'MONT', t: 'Monter' }, { k: 'N', o: 'ROT', t: 'Rotation broche' }] } },
      trans: [{ up: [0], down: [1], x: 140, y: 100, r: 'dcy · a', f: I => I.dcy && I.a }, { up: [1], down: [2], x: 140, y: 210, r: 'b', f: I => I.b }, { up: [2], down: [0], x: 140, y: 320, r: 'a', f: I => I.a }],
      inputs: [['dcy', 'Départ cycle (dcy)', 'push']], sensors: ['a', 'b'],
      init: () => ({ z: 0 }),
      proc: (P, O, dt) => { P.z = Math.max(0, Math.min(1, P.z + ((O.has('DESC') ? 0.45 : 0) - (O.has('MONT') ? 0.7 : 0)) * dt)); return { a: P.z <= 0.001, b: P.z >= 0.999 }; },
      draw: (g, W, H, P, O) => { const x = W / 2, y0 = 30, y = y0 + P.z * (H - 90); g.fillStyle = css('--surface-3'); g.fillRect(x - 70, H - 40, 140, 24); g.fillStyle = css('--ink-3'); g.fillRect(x - 6, 10, 12, y - 10); g.fillStyle = O.has('ROT') ? css('--copper') : css('--ink-2'); g.fillRect(x - 16, y, 32, 26); g.beginPath(); g.moveTo(x - 4, y + 26); g.lineTo(x + 4, y + 26); g.lineTo(x, y + 44); g.fill(); g.font = '600 11px Segoe UI'; g.fillStyle = css('--ink-3'); g.fillText('a (haut)', 8, y0 + 4); g.fillText('b (bas)', 8, H - 50); }
    },
    cuve: {
      title: 'Cuve de mélange : les types d\'actions',
      steps: { 0: { x: 140, y: 40, init: true }, 1: { x: 140, y: 150, acts: [{ k: 'N', o: 'V1', t: 'Ouvrir V1' }, { k: 'S', o: 'AGIT', t: 'Agitateur' }, { k: 'L', o: 'KLAX', t: 'Klaxon', d: 1 }] }, 2: { x: 140, y: 260, acts: [{ k: 'N', o: 'CHAUF', t: 'Chauffer' }, { k: 'D', o: 'PRET', t: 'Voyant « prêt »', d: 3 }] }, 3: { x: 140, y: 370, acts: [{ k: 'R', o: 'AGIT', t: 'Agitateur' }, { k: 'N', o: 'VID', t: 'Vidanger' }] } },
      trans: [{ up: [0], down: [1], x: 140, y: 100, r: 'dcy · bas', f: I => I.dcy && I.bas }, { up: [1], down: [2], x: 140, y: 210, r: 'haut', f: I => I.haut }, { up: [2], down: [3], x: 140, y: 320, r: 't/X2/6 s', f: (I, g) => g.T(2, 6) }, { up: [3], down: [0], x: 140, y: 430, r: 'bas', f: I => I.bas }],
      inputs: [['dcy', 'Départ cycle (dcy)', 'push']], sensors: ['haut', 'bas'],
      init: () => ({ lvl: 0, temp: 20, rot: 0 }),
      proc: (P, O, dt) => { P.lvl = Math.max(0, Math.min(1, P.lvl + ((O.has('V1') ? 0.22 : 0) - (O.has('VID') ? 0.3 : 0)) * dt)); P.temp += ((O.has('CHAUF') ? 60 : 20) - P.temp) * 0.08 * dt * 3; if (O.has('AGIT')) P.rot += dt * 6; return { haut: P.lvl >= 0.95, bas: P.lvl <= 0.02 }; },
      draw: (g, W, H, P, O) => { const x = W / 2 - 60, y = 30, w = 120, h = H - 70; g.strokeStyle = css('--ink-3'); g.lineWidth = 2; g.strokeRect(x, y, w, h); g.fillStyle = O.has('CHAUF') ? 'rgba(240,120,60,.55)' : 'rgba(60,140,230,.5)'; g.fillRect(x + 2, y + h - P.lvl * (h - 4) - 2, w - 4, P.lvl * (h - 4)); g.save(); g.translate(x + w / 2, y + h - 30); g.rotate(P.rot); g.fillStyle = O.has('AGIT') ? css('--copper') : css('--ink-3'); g.fillRect(-24, -3, 48, 6); g.restore(); g.fillStyle = css('--ink-3'); g.font = '600 11px Segoe UI'; g.fillText(AA.fmt(P.temp, 0) + ' °C', x + w + 10, y + h / 2); g.fillText('haut', x - 34, y + 10); g.fillText('bas', x - 30, y + h - 2); if (O.has('KLAX')) { g.fillStyle = css('--warn'); g.fillText('♪ klaxon', x + w + 10, y + 16); } if (O.has('PRET')) { g.fillStyle = css('--ok'); g.beginPath(); g.arc(x + w + 22, y + h - 20, 9, 0, 7); g.fill(); g.fillText('prêt', x + w + 36, y + h - 16); } }
    },
    tri: {
      title: 'Tri de pièces : divergence en OU',
      steps: { 0: { x: 170, y: 40, init: true }, 1: { x: 90, y: 160, acts: [{ k: 'N', o: 'PA', t: 'Pousser vers A' }] }, 2: { x: 250, y: 160, acts: [{ k: 'N', o: 'PB', t: 'Pousser vers B' }] } },
      trans: [{ up: [0], down: [1], x: 90, y: 110, r: 'p · G', f: I => I.p && I.G }, { up: [0], down: [2], x: 250, y: 110, r: 'p · /G', f: I => I.p && !I.G }, { up: [1], down: [0], x: 90, y: 220, r: 'fa', f: I => I.fa }, { up: [2], down: [0], x: 250, y: 220, r: 'fb', f: I => I.fb }],
      inputs: [['big', 'Poser une grande pièce', 'act'], ['small', 'Poser une petite pièce', 'act']], sensors: ['p', 'G', 'fa', 'fb'],
      init: () => ({ p: false, G: false, pos: 0 }),
      act: (P, k) => { if (!P.p) { P.p = true; P.G = k === 'big'; P.pos = 0; } },
      proc: (P, O, dt) => { if (O.has('PA')) P.pos = Math.max(-1, P.pos - dt * 1.2); else if (O.has('PB')) P.pos = Math.min(1, P.pos + dt * 1.2); else if (!P.p) P.pos = 0; if (P.pos <= -1 || P.pos >= 1) P.p = false; return { p: P.p, G: P.p && P.G, fa: P.pos <= -1, fb: P.pos >= 1 }; },
      draw: (g, W, H, P) => { const cx = W / 2, y = H / 2; g.fillStyle = css('--surface-3'); g.fillRect(cx - 150, y + 20, 300, 10); g.fillStyle = css('--ink-3'); g.font = '600 11px Segoe UI'; g.fillText('bac A (grandes)', cx - 150, y + 50); g.fillText('bac B (petites)', cx + 60, y + 50); if (P.p) { const s = P.G ? 34 : 20; g.fillStyle = css('--copper'); g.fillRect(cx + P.pos * 120 - s / 2, y + 20 - s, s, s); } }
    },
    et: {
      title: 'Deux postes simultanés : divergence en ET',
      steps: { 0: { x: 170, y: 40, init: true }, 1: { x: 90, y: 170, acts: [{ k: 'N', o: 'PERC', t: 'Percer' }] }, 2: { x: 90, y: 280 }, 3: { x: 250, y: 170, acts: [{ k: 'N', o: 'MARQ', t: 'Marquer' }] }, 4: { x: 250, y: 280 } },
      trans: [{ up: [0], down: [1, 3], x: 170, y: 100, r: 'dcy', f: I => I.dcy }, { up: [1], down: [2], x: 90, y: 225, r: 'fp', f: I => I.fp }, { up: [3], down: [4], x: 250, y: 225, r: 'fm', f: I => I.fm }, { up: [2, 4], down: [0], x: 170, y: 345, r: '= 1', f: () => true }],
      inputs: [['dcy', 'Départ cycle (dcy)', 'push']], sensors: ['fp', 'fm'],
      init: () => ({ p: 0, m: 0 }),
      proc: (P, O, dt) => { P.p = O.has('PERC') ? Math.min(1, P.p + dt / 2) : (O.size ? P.p : 0); P.m = O.has('MARQ') ? Math.min(1, P.m + dt / 3.5) : (O.size ? P.m : 0); return { fp: P.p >= 1, fm: P.m >= 1 }; },
      draw: (g, W, H, P, O) => { const bar = (y, v, lbl, on) => { g.fillStyle = css('--surface-3'); g.fillRect(30, y, W - 60, 16); g.fillStyle = on ? css('--copper') : css('--ink-3'); g.fillRect(30, y, (W - 60) * v, 16); g.fillStyle = css('--ink-2'); g.font = '600 11px Segoe UI'; g.fillText(lbl + ' ' + Math.round(v * 100) + ' %', 30, y - 5); }; bar(H / 2 - 30, P.p, 'Perçage (2 s)', O.has('PERC')); bar(H / 2 + 26, P.m, 'Marquage (3,5 s)', O.has('MARQ')); }
    }
  };

  /* ================= Rendu SVG d'un Grafcet ================= */
  G.svg = (def, g) => {
    const S = 36, h = S / 2;
    let out = '', maxX = 0, maxY = 0;
    Object.values(def.steps).forEach(s => { maxX = Math.max(maxX, s.x + 60 + (s.acts || []).length * 104); maxY = Math.max(maxY, s.y + 40); });
    def.trans.forEach(tr => { maxY = Math.max(maxY, tr.y + 40); });
    const line = (pts, cls) => `<polyline class="${cls || 'gl'}" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
    def.trans.forEach((tr, i) => {
      const ups = tr.up.map(u => def.steps[u]), downs = tr.down.map(d => def.steps[d]);
      const enabled = g && tr.up.every(u => g.active.has(u));
      // amont
      if (ups.length > 1) { const xs = ups.map(s => s.x), yb = tr.y - 16; ups.forEach(s => { out += line([[s.x, s.y + h], [s.x, yb - 3]]); }); out += `<line class="gl" x1="${Math.min(...xs) - 10}" y1="${yb - 3}" x2="${Math.max(...xs) + 10}" y2="${yb - 3}"/><line class="gl" x1="${Math.min(...xs) - 10}" y1="${yb}" x2="${Math.max(...xs) + 10}" y2="${yb}"/>` + line([[tr.x, yb], [tr.x, tr.y]]); }
      else { const s = ups[0]; out += s.x === tr.x ? line([[s.x, s.y + h], [tr.x, tr.y]]) : line([[s.x, s.y + h], [s.x, s.y + h + 14], [tr.x, s.y + h + 14], [tr.x, tr.y]]); }
      // aval
      if (downs.length > 1) { const xs = downs.map(s => s.x), yb = tr.y + 16; out += line([[tr.x, tr.y], [tr.x, yb]]) + `<line class="gl" x1="${Math.min(...xs) - 10}" y1="${yb}" x2="${Math.max(...xs) + 10}" y2="${yb}"/><line class="gl" x1="${Math.min(...xs) - 10}" y1="${yb + 3}" x2="${Math.max(...xs) + 10}" y2="${yb + 3}"/>`; downs.forEach(s => { out += line([[s.x, yb + 3], [s.x, s.y - h]]); }); }
      else {
        const s = downs[0];
        if (s.y > tr.y) out += s.x === tr.x ? line([[tr.x, tr.y], [s.x, s.y - h]]) : line([[tr.x, tr.y], [tr.x, s.y - h - 14], [s.x, s.y - h - 14], [s.x, s.y - h]]);
        else { const xl = 24 + i * 0; out += line([[tr.x, tr.y], [tr.x, tr.y + 14], [xl, tr.y + 14], [xl, s.y - h - 16], [s.x, s.y - h - 16], [s.x, s.y - h]]) + `<path class="ga" d="M${xl - 5} ${(tr.y + s.y) / 2 + 6} l5 -10 l5 10"/>`; }
      }
      out += `<line class="gt ${enabled ? 'en' : ''}" x1="${tr.x - 16}" y1="${tr.y}" x2="${tr.x + 16}" y2="${tr.y}"/><text class="gr" x="${tr.x + 22}" y="${tr.y + 4}">${esc(tr.r)}</text>`;
    });
    Object.entries(def.steps).forEach(([id, s]) => {
      const on = g && g.active.has(+id);
      out += `<g class="gs ${on ? 'on' : ''}"><rect x="${s.x - h}" y="${s.y - h}" width="${S}" height="${S}"/>${s.init ? `<rect x="${s.x - h + 4}" y="${s.y - h + 4}" width="${S - 8}" height="${S - 8}"/>` : ''}<text x="${s.x}" y="${s.y + 5}">${id}</text>${on ? `<circle cx="${s.x}" cy="${s.y + 11}" r="3"/>` : ''}</g>`;
      (s.acts || []).forEach((a, k) => {
        const x = s.x + h + 14 + k * 104, lbl = a.k === 'N' ? '' : a.k === 'D' ? `D ${a.d} s` : a.k === 'L' ? `L ${a.d} s` : a.k;
        out += `<line class="gl" x1="${k ? x - 14 : s.x + h}" y1="${s.y}" x2="${x}" y2="${s.y}"/><g class="gact ${g && g.outputs().has(a.o) ? 'on' : ''}"><rect x="${x}" y="${s.y - 15}" width="96" height="30" rx="3"/>${lbl ? `<rect class="gq" x="${x}" y="${s.y - 15}" width="24" height="30" rx="3"/><text class="gqt" x="${x + 12}" y="${s.y + 4}">${lbl.split(' ')[0]}</text>` : ''}<text x="${x + (lbl ? 60 : 48)}" y="${s.y + (a.d ? 0 : 4)}">${esc(a.t)}</text>${a.d ? `<text class="gqt" x="${x + 60}" y="${s.y + 12}">${a.d} s</text>` : ''}</g>`;
      });
    });
    return `<svg class="grafcet" viewBox="0 0 ${Math.max(maxX, 380)} ${maxY}" preserveAspectRatio="xMidYMin meet">${out}</svg>`;
  };

  /* ================= Simulation interactive ================= */
  SIMS.grafcet = (el, o) => {
    let key = (o && o.ex) || 'perceuse', def, g, P, I;
    const tabs = (o && o.list) || ['perceuse', 'cuve', 'tri', 'et'];
    const reset = () => { def = G.EX[key]; g = G.create(def); P = def.init(); I = {}; build(); };
    const build = () => {
      el.innerHTML = `<div class="simcard grafsim">${tabs.length > 1 ? `<div class="simctl"><div class="seg js-ex">${tabs.map(k => `<button data-k="${k}" class="${k === key ? 'on' : ''}">${G.EX[k].title}</button>`).join('')}</div></div>` : ''}
        <div class="gf-grid"><div class="gf-chart js-chart"></div><div class="gf-proc"><div class="js-pv"></div><div class="gf-io js-io"></div></div></div>
        <div class="simctl">${def.inputs.map(([k, t]) => `<button class="btn sm primary js-in" data-k="${k}">${t}</button>`).join('')}<button class="btn sm ghost js-rst">Réinitialiser</button><label class="chk"><input type="checkbox" class="js-eq"${o && o.eq ? ' checked' : ''}><span>Voir la traduction en Ladder</span></label></div>
        <div class="gf-eq js-eqs" ${o && o.eq ? '' : 'hidden'}></div></div>`;
      el.querySelectorAll('.js-ex button').forEach(b => b.onclick = () => { key = b.dataset.k; stopCv(); reset(); });
      el.querySelectorAll('.js-in').forEach(b => b.onclick = () => { const k = b.dataset.k; if (def.act) def.act(P, k); else momentary(I, k); });
      el.querySelector('.js-rst').onclick = () => { stopCv(); reset(); };
      el.querySelector('.js-eq').onchange = e => { el.querySelector('.js-eqs').hidden = !e.target.checked; };
      el.querySelector('.js-eqs').innerHTML = '<p class="eyebrow">Une ligne Ladder par étape (méthode SET / RESET)</p>' + G.equations(def).map(q => `<div><b>X${q.k}</b> : SET si ${esc(q.set || '—')}${def.steps[q.k].init ? ' + (initialisation)' : ''} ; RESET si ${esc(q.rst || '—')}</div>`).join('');
      cv = AA.canvas(el.querySelector('.js-pv'), 190, draw);
    };
    let cv = null, last = 0, chartSig = '';
    const stopCv = () => { if (cv) cv.stop(); cv = null; last = 0; chartSig = ''; };
    const draw = (gg, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t;
      ['dcy'].forEach(k => { if (I['_' + k] > 0) { I['_' + k] -= dt; if (I['_' + k] <= 0) I[k] = false; } });
      const O0 = g.outputs(); Object.assign(I, def.proc(P, O0, dt)); g.tick(dt, I);
      const O = g.outputs();
      def.draw(gg, W, H, P, O);
      const sig = [...g.active].join() + '|' + [...O].join() + '|' + def.trans.map(tr => tr.up.every(u => g.active.has(u)) ? 1 : 0).join('');
      if (sig !== chartSig) { chartSig = sig; el.querySelector('.js-chart').innerHTML = G.svg(def, g); }
      el.querySelector('.js-io').innerHTML = def.sensors.map(k => `<span class="gio ${I[k] ? 'on' : ''}">${k}</span>`).join('') + [...new Set(Object.values(def.steps).flatMap(s => (s.acts || []).map(a => a.o)))].map(k => `<span class="gio out ${O.has(k) ? 'on' : ''}">${k}</span>`).join('');
    };
    reset();
    return () => stopCv();
  };

  /* ================= GEMMA simplifié ================= */
  const GEM = {
    A1: ['Arrêt dans l\'état initial', 'A', 'La machine est à l\'arrêt, prête à démarrer.'],
    F1: ['Production normale', 'F', 'Le Grafcet de production tourne en cycles.'],
    A2: ['Arrêt demandé en fin de cycle', 'A', 'Le cycle en cours se termine, puis la machine s\'arrête dans l\'état initial.'],
    D1: ['Marche ou arrêt en vue d\'assurer la sécurité', 'D', 'Arrêt d\'urgence actionné : les énergies dangereuses sont coupées par le circuit de sécurité câblé.'],
    A5: ['Préparation pour remise en route après défaillance', 'A', 'L\'arrêt d\'urgence est déverrouillé et réarmé : on contrôle, on nettoie, on dégage les pièces.'],
    A6: ['Mise de la partie opérative dans l\'état initial', 'A', 'Les mouvements de dégagement ramènent la machine en position de départ.']
  };
  SIMS.gemma = el => {
    let s = 'A1', cyc = 0, last = 0, endReq = false;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><button class="btn sm primary js-m">Marche</button><button class="btn sm js-a">Arrêt</button><button class="btn sm js-au" style="border-color:var(--bad);color:var(--bad)">Arrêt d'urgence</button><button class="btn sm js-r">Réarmer</button><button class="btn sm js-i">Initialiser</button></div><p class="js-d" style="padding:0 16px 14px;font-size:14px"></p></div>`;
    const go = n => { s = n; };
    el.querySelector('.js-m').onclick = () => { if (s === 'A1') { go('F1'); cyc = 0; endReq = false; } };
    el.querySelector('.js-a').onclick = () => { if (s === 'F1') { go('A2'); endReq = true; } };
    el.querySelector('.js-au').onclick = () => { if (s !== 'D1') go('D1'); };
    el.querySelector('.js-r').onclick = () => { if (s === 'D1') go('A5'); };
    el.querySelector('.js-i').onclick = () => { if (s === 'A5') { go('A6'); cyc = 0.6; } };
    const pos = { A6: [0.17, 0.2], A1: [0.17, 0.42], A5: [0.17, 0.64], A2: [0.38, 0.42], F1: [0.74, 0.42], D1: [0.5, 0.88] };
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t;
      if (s === 'F1' || s === 'A2') { cyc += dt / 3; if (cyc >= 1) { cyc = 0; if (s === 'A2') go('A1'); } }
      if (s === 'A6') { cyc -= dt / 2; if (cyc <= 0) { cyc = 0; go('A1'); } }
      const col = { A: css('--blue'), F: css('--ok'), D: css('--bad') };
      [['A', 'Procédures d\'arrêt', 0.02, 0.5, 0.02, 0.74], ['F', 'Procédures de fonctionnement', 0.54, 0.44, 0.02, 0.74], ['D', 'Procédures de défaillance', 0.02, 0.96, 0.77, 0.21]].forEach(([k, n, x, w, y, h]) => { g.fillStyle = col[k]; g.globalAlpha = 0.09; g.fillRect(W * x, H * y, W * w, H * h); g.globalAlpha = 1; g.fillStyle = col[k]; g.font = '700 10px Segoe UI'; g.fillText(n.toUpperCase(), W * x + 6, H * y + 14); });
      Object.entries(pos).forEach(([k, [px, py]]) => { const x = W * px, y = H * py, on = k === s; g.fillStyle = on ? col[GEM[k][1]] : css('--surface'); g.strokeStyle = col[GEM[k][1]]; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(x - 52, y - 15, 104, 30, 8) : g.rect(x - 52, y - 15, 104, 30); g.fill(); g.stroke(); g.fillStyle = on ? '#fff' : css('--ink'); g.font = '700 12px Segoe UI'; g.fillText(k, x - 46, y + 4); g.font = '500 9.5px Segoe UI'; g.fillText(GEM[k][0].slice(0, 18) + (GEM[k][0].length > 18 ? '…' : ''), x - 26, y + 4); });
      if (s === 'F1' || s === 'A2' || s === 'A6') { const x = W * 0.74, y = H * 0.6; g.fillStyle = css('--surface-3'); g.fillRect(x - 60, y, 120, 8); g.fillStyle = css('--copper'); g.fillRect(x - 60, y, 120 * cyc, 8); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText(s === 'A6' ? 'retour en position initiale' : 'avancement du cycle', x - 60, y + 22); }
      el.querySelector('.js-d').innerHTML = `<b>${s} — ${GEM[s][0]}.</b> ${GEM[s][2]}${endReq && s === 'A2' ? ' (l\'arrêt n\'interrompt pas le cycle en cours)' : ''}`;
    });
    return cv.stop;
  };

  /* ================= Capteurs de proximité ================= */
  const MAT = { acier: ['Acier', 1, 1, 1], inox: ['Inox', 0.7, 1, 0.8], alu: ['Aluminium', 0.4, 1, 0.9], cuivre: ['Cuivre', 0.3, 1, 0.9], plast: ['Plastique', 0, 0.3, 0.7], bois: ['Bois sec', 0, 0.4, 0.6], eau: ['Eau', 0, 1, 0.5], noir: ['Carton noir', 0, 0.3, 0.2] };
  SIMS.capteurs = el => {
    const st = { sn: 8, d: 4 }; let type = 'ind', mat = 'acier';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-t"><button data-v="ind" class="on">Inductif</button><button data-v="cap">Capacitif</button><button data-v="opt">Photoélectrique (proximité)</button></div>
      <div class="seg js-m">${Object.entries(MAT).map(([k, m]) => `<button data-v="${k}" class="${k === mat ? 'on' : ''}">${m[0]}</button>`).join('')}</div>${sl('sn', 'Portée nominale s<sub>n</sub> (catalogue)', 1, 40, 1, 8, 'mm')}${sl('d', 'Distance de la cible', 0, 40, 0.5, 4, 'mm')}</div>
      <div class="simout"><div><span>Facteur de correction de la matière</span><b class="o-f"></b></div><div><span>Portée réelle sur cette cible</span><b class="o-r"></b></div><div><span>Distance assurée s<sub>a</sub> ≤ 0,81 × portée réelle</span><b class="o-a"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Facteurs indicatifs : ils varient selon les modèles (voir la notice). Inductif : métaux seulement, s<sub>n</sub> défini sur acier doux. Capacitif : presque toutes les matières, réglable par potentiomètre. Photoélectrique en proximité (diffus) : portée annoncée sur papier blanc ; une cible sombre renvoie moins de lumière (sur un vrai capteur, la portée se compte plutôt en centimètres ou en mètres).</p></div>`;
    bind(el, st, { d: v => AA.fmt(v, 1) });
    el.querySelectorAll('.js-t button').forEach(b => b.onclick = () => { type = b.dataset.v; el.querySelectorAll('.js-t button').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelectorAll('.js-m button').forEach(b => b.onclick = () => { mat = b.dataset.v; el.querySelectorAll('.js-m button').forEach(x => x.classList.toggle('on', x === b)); });
    const cv = AA.canvas(el.querySelector('.simview'), 170, (g, W, H, t) => {
      const f = MAT[mat][type === 'ind' ? 1 : type === 'cap' ? 2 : 3], rng = st.sn * f, sa = 0.81 * rng, det = f > 0 && st.d <= rng;
      el.querySelector('.o-f').textContent = AA.fmt(f, 2); el.querySelector('.o-r').textContent = AA.fmt(rng, 1) + ' mm'; el.querySelector('.o-a').textContent = AA.fmt(sa, 1) + ' mm' + (det && st.d > sa ? ' — cible au-delà : détection instable' : '');
      const x0 = 70, sc = (W - 160) / 40, y = H / 2;
      g.fillStyle = css('--ink-3'); g.fillRect(10, y - 18, x0 - 10, 36); g.fillStyle = det ? css('--warn') : css('--surface-3'); g.beginPath(); g.arc(24, y - 26, 6, 0, 7); g.fill();
      g.fillStyle = 'rgba(80,140,255,.12)'; g.fillRect(x0, y - 24, rng * sc, 48); g.strokeStyle = css('--ok'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x0 + sa * sc, y - 30); g.lineTo(x0 + sa * sc, y + 30); g.stroke(); g.setLineDash([]);
      g.fillStyle = MAT[mat][0] === 'Eau' ? 'rgba(60,140,230,.6)' : css('--copper'); g.fillRect(x0 + st.d * sc, y - 22, 26, 44);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(det ? 'DÉTECTÉ — la LED du capteur s\'allume' : 'non détecté', 10, H - 10); g.fillText('s_a', x0 + sa * sc - 6, y - 34);
    });
    return cv.stop;
  };

  /* ================= Sorties relais ou transistor ================= */
  SIMS.sorties = el => {
    const st = { ops: 6, h: 16, N: 100 }; let out = 'rel', load = 'ev';
    const LOADS = { lampe: ['Voyant 24 V CC 2 W', 'dc', 0.08, false], ev: ['Électrovanne 24 V CC 8 W', 'dc', 0.33, true], km: ['Bobine de contacteur 230 V CA', 'ac', 0.05, true], moteur: ['Petit moteur 230 V CA 1 A', 'ac', 1, true] };
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-o"><button data-v="rel" class="on">Sortie relais</button><button data-v="tr">Sortie transistor (PNP 24 V)</button></div><div class="seg js-l">${Object.entries(LOADS).map(([k, l]) => `<button data-v="${k}" class="${k === load ? 'on' : ''}">${l[0]}</button>`).join('')}</div></div>
      <div class="simview"></div><div class="simctl">${sl('ops', 'Manœuvres par minute', 1, 120, 1, 6, '/min')}${sl('h', 'Heures de fonctionnement par jour', 1, 24, 1, 16, 'h')}${sl('N', 'Durée de vie électrique du relais (notice, à cette charge)', 50, 1000, 10, 100, '× 1 000')}</div>
      <p class="js-v" style="padding:0 16px 8px;font-size:14px"></p>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Ordres de grandeur courants : relais 2 A environ, alternatif ou continu, quelques centaines de milliers de manœuvres en charge ; transistor 0,5 A environ, continu seulement, sans usure mécanique. Toujours vérifier la notice de la carte de sorties.</p></div>`;
    bind(el, st, {});
    const seg = (c, cb) => el.querySelectorAll(c + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(c + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
    seg('.js-o', v => { out = v; }); seg('.js-l', v => { load = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 130, (g, W, H, t) => {
      const L0 = LOADS[load], perYear = st.ops * 60 * st.h * 365, years = st.N * 1000 / perYear;
      let msg;
      if (out === 'tr' && L0[1] === 'ac') msg = '<span class="bad-t">Impossible : une sortie transistor ne commande que du courant continu. Utiliser une sortie relais ou un relais d\'interface.</span>';
      else if (out === 'tr' && L0[2] > 0.5) msg = '<span class="bad-t">Courant trop élevé pour une sortie transistor de 0,5 A : passer par un relais d\'interface.</span>';
      else if (out === 'rel') msg = `${years < 1 ? '<span class="bad-t">' : '<span class="ok-t">'}Durée de vie du relais ≈ ${AA.fmt(st.N * 1000, 0)} / ${AA.fmt(perYear, 0)} manœuvres par an = <b>${years < 1 ? AA.fmt(years * 12, 1) + ' mois' : AA.fmt(years, 1) + ' an(s)'}</b>${years < 1 ? ' : bien trop court, choisir une sortie transistor (en continu) ou un relais statique.' : '.'}</span>`;
      else msg = '<span class="ok-t">Sortie transistor adaptée : commutation rapide, pas d\'usure mécanique.</span>';
      if (L0[3] && !(out === 'tr' && L0[1] === 'ac')) msg += ` <span class="muted">Charge inductive : ${L0[1] === 'dc' ? 'diode de roue libre aux bornes de la bobine' : 'circuit RC ou varistance aux bornes de la bobine'} pour limiter la surtension à la coupure.</span>`;
      el.querySelector('.js-v').innerHTML = msg;
      const on = Math.floor(t * st.ops / 60 * 2) % 2 === 0;
      g.fillStyle = css('--surface-3'); g.fillRect(20, 30, 90, 70); g.fillStyle = css('--ink'); g.font = '700 11px Segoe UI'; g.fillText(out === 'rel' ? 'Relais' : 'Transistor', 32, 70);
      g.strokeStyle = on ? css('--copper') : css('--ink-3'); g.lineWidth = 3; g.beginPath(); g.moveTo(110, 65); g.lineTo(W - 120, 65); g.stroke();
      g.fillStyle = on ? css('--amber') : css('--surface-3'); g.beginPath(); g.arc(W - 90, 65, 22, 0, 7); g.fill(); g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(L0[0], W - 200, 112);
    });
    return cv.stop;
  };

  /* ================= Choix : arrêt d'urgence ================= */
  const AU = { title: "Arrêt d'urgence : quel câblage est correct ?", items: [['serie', 'Contacts NF de l\'AU en série dans le circuit qui alimente les contacteurs', ''], ['relais', 'Relais (ou module) de sécurité surveillant l\'AU à double canal', ''], ['image', 'Un contact image de l\'AU lu par l\'automate pour l\'information', ''], ['prog', 'L\'automate seul coupe les sorties quand il lit l\'AU', ''], ['no', 'AU câblé avec un contact NO (à fermeture)', ''], ['rearm', 'Réarmement volontaire séparé, qui ne redémarre pas la machine', '']],
    cases: [
      { q: 'Choisis les bonnes pratiques pour câbler l\'arrêt d\'urgence d\'une machine pilotée par un automate standard.', need: ['serie', 'image', 'rearm'], no: ['prog', 'no'], why: "La coupure d'urgence ne doit pas dépendre d'un programme ni d'un automate standard : les contacts NF (à manœuvre positive d'ouverture) agissent directement sur les contacteurs. L'automate est seulement informé. Un fil coupé sur un contact NF provoque l'arrêt : c'est la sécurité positive." },
      { q: 'Machine dangereuse (analyse de risques exigeante) : quels éléments retenir ?', need: ['relais', 'image', 'rearm'], no: ['prog', 'no'], why: 'Un relais ou un automate de sécurité surveille les deux canaux de l\'AU et détecte un court-circuit entre eux ou un contacteur collé.' }
    ] };
  SIMS.aucab = el => SIMS.choose(el, AU);

  Object.assign(AA.SIMFORM, {
    capteurs: ['Portée réelle = s<sub>n</sub> × facteur de correction de la matière', 'Distance de travail assurée : 0 ≤ s<sub>a</sub> ≤ 0,81 s<sub>n</sub> (IEC 60947-5-2)'],
    sorties: ['Durée de vie (années) = N manœuvres / (manœuvres par minute × 60 × heures par jour × 365)'],
    grafcet: ['Transition franchie ⇔ toutes ses étapes amont actives ET réceptivité vraie', 'Franchissement : désactivation des étapes amont, activation des étapes aval, simultanément', 't/X2/6 s : vraie quand l\'étape 2 est active depuis 6 s']
  });

  /* ================= Leçons ================= */
  L.n6m2l2 = { min: 10, why: "Un capteur mal choisi ne voit pas la pièce… ou la voit quand elle n'est pas là : la moitié des pannes d'automatisme viennent des capteurs.", screens: [[
    { h: 'Capteurs inductifs, capacitifs, photoélectriques' },
    { table: { head: ['Type', 'Détecte', 'Portée typique', 'Usage'], rows: [['Inductif', 'Métaux uniquement', 'Quelques millimètres', 'Position de vérins, cames, pièces métalliques'], ['Capacitif', 'Presque tout : métal, plastique, bois, liquides', 'Quelques millimètres à ~2 cm', 'Niveau à travers une paroi, granulés'], ['Photoélectrique', 'Tout objet qui coupe ou renvoie la lumière', 'Centimètres (proximité) à dizaines de mètres (barrage)', 'Passage de cartons, convoyeurs']] } },
    { p: "La portée nominale s<sub>n</sub> d'un inductif est donnée sur de l'acier doux. Sur un autre métal, elle diminue : on multiplie par un facteur de correction donné par le fabricant. Pour une détection fiable, on place la cible dans la distance assurée s<sub>a</sub> ≤ 0,81 s<sub>n</sub>." },
    { num: { id: 'sa', gen: r => { const sn = r.pick([2, 4, 5, 8, 10, 15]), f = r.pick([[1, 'acier'], [0.7, 'inox'], [0.4, 'aluminium']]); return { q: `Capteur inductif s<sub>n</sub> = <b>${sn} mm</b>, cible en <b>${f[1]}</b> (facteur ${AA.fmt(f[0])}). Distance maximale assurée ?`, a: 0.81 * sn * f[0], unit: 'mm', tol: 0.02, sol: `s_a = 0,81 × ${sn} × ${AA.fmt(f[0])} = ${AA.fmt(0.81 * sn * f[0], 2)} mm` }; } } }
  ]] };
  L.n6m2l3 = { min: 9, why: "Une sortie relais qui commute toutes les secondes est usée en quelques semaines ; une sortie transistor ne commande pas du 230 V.", screens: [[
    { h: 'Sorties relais et sorties transistor' },
    { table: { head: ['', 'Relais', 'Transistor'], rows: [['Tension commandée', 'Alternatif ou continu', 'Continu seulement (24 V)'], ['Courant typique', '≈ 2 A', '≈ 0,5 A'], ['Vitesse', 'Lente (≈ 10 ms)', 'Rapide (impulsions, comptage)'], ['Usure', 'Mécanique : nombre de manœuvres limité', 'Aucune usure mécanique'], ['Isolement', 'Contact sec, isolé', 'Partage le 0 V de la carte']] } },
    { tip: "Bobine de contacteur, électrovanne : charges inductives. Une diode de roue libre (en continu) ou un circuit RC / varistance (en alternatif) protège la sortie de la surtension à la coupure." }
  ]] };
  L.n6m2l4 = { min: 9, why: "L'arrêt d'urgence doit fonctionner même si l'automate est en panne, mal programmé ou déconnecté.", screens: [[
    { h: "Câbler l'arrêt d'urgence (hors automate)" },
    { list: ["Contacts NF à manœuvre positive d'ouverture : un fil coupé arrête la machine (sécurité positive).", "La coupure agit directement sur les contacteurs de puissance, ou par un relais / automate de sécurité.", "L'automate standard reçoit seulement une information (contact image) pour arrêter proprement le cycle et afficher le défaut.", "Après déverrouillage de l'AU, un réarmement volontaire est nécessaire ; il ne doit pas redémarrer la machine (IEC 60204-1, ISO 13850)."] },
    { warn: "Un automate standard n'est pas un équipement de sécurité : on ne lui confie jamais seul la fonction d'arrêt d'urgence." }
  ]] };
  L.n6m4l1 = { min: 11, why: "Le Grafcet décrit un fonctionnement séquentiel sans ambiguïté : c'est le langage commun du concepteur, du programmeur et du dépanneur.", screens: [[
    { h: 'Étapes, transitions, réceptivités' },
    { list: ['<b>Étape</b> (carré) : une situation stable du système ; double carré = étape initiale. Une étape active porte un jeton.', '<b>Transition</b> (trait horizontal) : passage possible d\'une étape à la suivante.', '<b>Réceptivité</b> : la condition écrite à côté de la transition (capteurs, boutons, temps).', '<b>Liaisons</b> : de haut en bas par défaut ; une flèche indique un retour vers le haut.'] },
    { p: "Règles d'évolution (IEC 60848) : une transition est <b>validée</b> quand toutes ses étapes précédentes sont actives ; elle est <b>franchie</b> si sa réceptivité est vraie ; le franchissement active les étapes suivantes et désactive les précédentes, simultanément. Appuie sur « Départ cycle » et suis le jeton." }
  ]] };
  L.n6m4l2 = { min: 11, why: "Une action mal qualifiée (continue au lieu de mémorisée) suffit à arrêter un agitateur au mauvais moment.", screens: [[
    { h: 'Actions continues, mémorisées, temporisées' },
    { table: { head: ['Qualificatif', 'Signification'], rows: [['(aucun)', 'Action continue : vraie tant que l\'étape est active'], ['S / R', 'Mise à 1 / remise à 0 mémorisée à l\'activation de l\'étape (l\'action dure au-delà de l\'étape)'], ['D', 'Action retardée : commence après une durée d\'activité de l\'étape'], ['L', 'Action limitée : dure au plus une durée donnée'], ['t/X2/6 s', 'Réceptivité temporisée : vraie quand l\'étape 2 est active depuis 6 s']] } },
    { p: "Dans la cuve : l'agitateur est mis en marche (S) à l'étape 1 et ne s'arrête qu'à l'étape 3 (R) ; le klaxon (L 1 s) ne sonne qu'une seconde ; le voyant « prêt » (D 3 s) s'allume après 3 s de chauffe." }
  ]] };
  L.n6m4l3 = { min: 11, why: "Les machines réelles choisissent entre plusieurs chemins ou font plusieurs choses à la fois.", screens: [[
    { h: 'Divergences en OU et en ET' },
    { list: ['<b>OU</b> (trait simple) : un seul chemin est suivi. Les réceptivités doivent être <b>exclusives</b> (ici p·G et p·/G), sinon les deux branches pourraient s\'activer.', '<b>ET</b> (double trait) : un franchissement active plusieurs étapes en parallèle ; la convergence en ET attend que toutes les branches soient terminées (étapes d\'attente 2 et 4, réceptivité « = 1 »).'] }
  ]] };
  L.n6m4l4 = { min: 12, why: "Savoir traduire un Grafcet en Ladder permet de programmer n'importe quel automate, même sans langage SFC.", screens: [[
    { h: 'Du Grafcet au Ladder' },
    { p: "Méthode courante : une mémoire X<sub>i</sub> par étape. On la met à 1 (SET) quand l'étape précédente est active et la réceptivité vraie ; on la remet à 0 (RESET) quand l'étape suivante devient active. Les sorties sont ensuite écrites à partir des étapes : DESC = X1, ROT = X1 + X2." },
    { formula: 'SET X1 si X0 · dcy · a      RESET X1 si X2', small: 'Initialisation : au démarrage de l\'automate, X0 = 1 et toutes les autres étapes à 0' },
    { warn: 'Programmer les sorties dans les étapes elles-mêmes (et non dans un bloc séparé) mène vite à des doubles affectations : une même bobine écrite deux fois, dont seule la dernière compte.' }
  ]] };
  L.n6m4l5 = { min: 10, why: "Une machine ne fait pas que produire : elle s'arrête, tombe en défaut, se réarme, se remet en position. Le GEMMA organise tout cela.", screens: [[
    { h: 'Mode marche / arrêt et GEMMA' },
    { p: "Le GEMMA (Guide d'étude des modes de marche et d'arrêt) range les états d'une machine en trois familles : procédures d'<b>arrêt</b> (A), de <b>fonctionnement</b> (F) et de <b>défaillance</b> (D). Il impose de prévoir, dès la conception, comment on passe de l'un à l'autre." },
    { list: ['A1 → F1 : marche ; F1 → A2 : arrêt demandé, le cycle se termine ; A2 → A1.', 'Arrêt d\'urgence → D1 ; réarmement → A5 (préparation) ; initialisation → A6 (mise en position initiale) → A1.'] }
  ]] };

  Object.assign(AA.VISMAP, {
    n6m2l2: [{ sim: 'capteurs' }], n6m2l3: [{ sim: 'sorties' }], n6m2l4: [{ sim: 'aucab' }],
    n6m4l1: [{ sim: 'grafcet', opts: { ex: 'perceuse', list: ['perceuse'] } }], n6m4l2: [{ sim: 'grafcet', opts: { ex: 'cuve', list: ['cuve'] } }],
    n6m4l3: [{ sim: 'grafcet', opts: { ex: 'tri', list: ['tri', 'et'] } }], n6m4l4: [{ sim: 'grafcet', opts: { ex: 'perceuse', eq: true } }], n6m4l5: [{ sim: 'gemma' }]
  });
})();
