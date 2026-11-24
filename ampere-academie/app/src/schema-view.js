/* Ampère Académie — rendu des folios (symboles IEC 60617) et interaction.
 * SchemaView(el, sim, opts) : dessine le folio, anime les états (contacts, bobines, flux de courant),
 * gère les manœuvres (poussoirs, interrupteurs, disjoncteurs), le multimètre, le zoom et le déplacement. */
(function () {
  'use strict';
  const G = 20;
  const { TYPES, termsOf } = window.AASim;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tagOf = p => p.tag || p.id.split(/[.:]/)[0];

  /* ---------- Symboles (repère local, bornes à y = ±40) ---------- */
  const L = (x1, y1, x2, y2, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${c ? ` class="${c}"` : ''}/>`;
  const leads = (gap) => L(0, -40, 0, -gap) + L(0, gap, 0, 40);

  // Contact : lame pivotant en bas (0,12). angle en degrés (négatif = vers la gauche).
  function blade(angle) { return `<line class="blade" x1="0" y1="12" x2="0" y2="-15" transform="rotate(${angle} 0 12)"/>`; }
  function contactNO(closed) { return leads(12) + blade(closed ? -1 : -26); }
  function contactNC(closed) { return L(0, -40, 0, -12) + L(0, -12, 9, -12) + L(0, 12, 0, 40) + blade(closed ? 22 : -8); }
  const actuator = (y, kind, closedNO) => {
    const x0 = closedNO === undefined ? -6 : (closedNO ? -1 : -7);
    let s = `<line class="dash" x1="${x0}" y1="${y}" x2="-24" y2="${y}"/>`;
    if (kind === 'push') s += `<path d="M-22 ${y - 7} H-27 V${y + 7} H-22"/>`;
    if (kind === 'mush') s += `<path d="M-24 ${y - 9} A9 9 0 0 0 -24 ${y + 9} Z" class="fill-ink"/>`;
    if (kind === 'toggle') s += `<path d="M-24 ${y} L-29 ${y - 7}"/>`;
    if (kind === 'thermal') s += `<path d="M-24 ${y} h-3 v-6 h-5 v12 h-5 v-6"/>`;
    if (kind === 'timer') s += `<path d="M-15 ${y - 7} A7 7 0 0 0 -15 ${y + 7}"/>`;
    if (kind === 'limit') s += `<path d="M-24 ${y - 6} L-31 ${y} L-24 ${y + 6}"/>`;
    return s;
  };

  const SYM = {
    no: (p, a) => contactNO(a.closed) + `<path class="arc" d="M-3 -12 a3 3 0 0 1 6 0"/>`,
    nc: (p, a) => contactNC(a.closed),
    pb_no: (p, a) => contactNO(a.closed) + actuator(a.closed ? -1 : -3, 'push', a.closed),
    pb_nc: (p, a) => contactNC(a.closed) + actuator(-1, 'push'),
    pbm_nc: (p, a) => contactNC(a.closed) + actuator(-1, 'mush'),
    pbm_no: (p, a) => contactNO(a.closed) + actuator(-3, 'mush', a.closed),
    sw1: (p, a) => contactNO(a.closed) + actuator(a.closed ? -1 : -3, 'toggle', a.closed),
    ls_no: (p, a) => contactNO(a.closed) + actuator(-3, 'limit', a.closed),
    ls_nc: (p, a) => contactNC(a.closed) + actuator(-1, 'limit'),
    th_nc: (p, a) => contactNC(a.closed) + actuator(-1, 'thermal'),
    th_no: (p, a) => contactNO(a.closed) + actuator(-3, 'thermal', a.closed),
    ton_no: (p, a) => contactNO(a.closed) + actuator(-3, 'timer', a.closed),
    ton_nc: (p, a) => contactNC(a.closed) + actuator(-1, 'timer'),
    fuse: (p, a) => (a.blown
      ? L(0, -40, 0, -5) + L(0, 5, 0, 40) + `<path class="spark" d="M-4 -5 l8 4 l-8 2 l8 4"/>`
      : L(0, -40, 0, 40)) + `<rect x="-7" y="-17" width="14" height="34" rx="1.5" class="body"/>`,
    cb: (p, a) => contactNO(a.closed) + `<path d="M-4 -16 l8 8 M4 -16 l-8 8"/>` + actuator(a.closed ? -1 : -3, 'toggle', a.closed),
    sw2: (p, a) => L(0, -40, 0, -12) + L(-20, 40, -20, 14) + L(20, 40, 20, 14) +
      `<line class="blade" x1="0" y1="-12" x2="0" y2="19" transform="rotate(${a.pos === 2 ? -40 : 40} 0 -12)"/>` +
      `<circle cx="0" cy="-12" r="2.4" class="fill-ink"/>`,
    coil: (p, a) => leads(12) + `<rect x="-15" y="-12" width="30" height="24" rx="1" class="body coilbox${a.on ? ' on' : ''}"/>`,
    telerupt: (p, a) => leads(12) + `<rect x="-15" y="-12" width="30" height="24" rx="1" class="body coilbox${a.on ? ' on' : ''}"/>` +
      `<path d="M-9 6 L-3 -5 L3 6 L9 -5" class="thin"/>`,
    coil_ton: (p, a) => leads(12) + `<rect x="-15" y="-12" width="30" height="24" rx="1" class="body coilbox${a.on ? ' on' : ''}"/>` +
      `<rect x="-15" y="-12" width="11" height="24" class="thin"/>` + L(-15, -12, -4, 12, 'thin') + L(-4, -12, -15, 12, 'thin') +
      (a.on ? `<rect x="-3" y="8" width="${Math.min(1, a.prog) * 17}" height="3" class="progress"/>` : ''),
    lamp: (p, a) => leads(13) + `<circle r="13" class="body lampbulb ${a.on ? 'on lamp-' + (p.color || 'warm') : ''}"/>` +
      L(-9.2, -9.2, 9.2, 9.2) + L(9.2, -9.2, -9.2, 9.2),
    km3: (p, a) => [0, 40, 80].map(dx => `<g transform="translate(${dx},0)">${contactNO(a.closed)}<path class="arc" d="M-3 -12 a3 3 0 0 1 6 0"/></g>`).join('') +
      `<line class="dash" x1="${a.closed ? -1 : -7}" y1="${a.closed ? -1 : -2}" x2="${a.closed ? 79 : 73}" y2="${a.closed ? -1 : -2}"/>`,
    breaker3: (p, a) => [0, 40, 80].map(dx => `<g transform="translate(${dx},0)">${contactNO(a.closed)}<path d="M-4 -16 l8 8 M4 -16 l-8 8"/></g>`).join('') +
      `<line class="dash" x1="${a.closed ? -1 : -7}" y1="-2" x2="${a.closed ? 79 : 73}" y2="-2"/>` + actuator(-2, 'toggle', a.closed) +
      [0, 40, 80].map(dx => `<rect x="${dx + 5}" y="16" width="8" height="10" class="thin"/>`).join(''),
    thermal3: (p, a) => [0, 40, 80].map(dx => `<g transform="translate(${dx},0)">${L(0, -40, 0, -10)}<path d="M0 -10 h-6 v8 h12 v8 h-6"/>${L(0, 6, 0, 40)}</g>`).join('') +
      `<rect x="-14" y="-16" width="108" height="28" rx="2" class="dash nofill${a.tripped ? ' tripbox' : ''}"/>` +
      `<g transform="translate(-22,0)">${a.tripped ? '<path class="trip-flag" d="M-6 -8 h12 v16 h-12z"/>' : ''}</g>`,
    motor3: (p, a) => `<path d="M-40 -60 V-40 L-24 -16 M0 -60 V-28 M40 -60 V-40 L24 -16"/>` +
      `<circle cy="6" r="34" class="body motorbody ${a.state}"/>` +
      `<text class="mtxt" y="8" text-anchor="middle">M</text><text class="mtxt2" y="26" text-anchor="middle">3~</text>` +
      `<g class="rotor" transform="translate(0,6) rotate(${a.angle || 0})"><path class="rotarr" d="M0 -41 A41 41 0 0 1 35.5 -20.5"/><path class="rotarr" d="M0 41 A41 41 0 0 1 -35.5 20.5"/>` +
      `<circle cx="0" cy="-41" r="2.5" class="fill-live"/><circle cx="0" cy="41" r="2.5" class="fill-live"/></g>`,
    motor6: (p, a) => `<path d="M-40 -60 V-40 L-24 -18 M0 -60 V-34 M40 -60 V-40 L24 -18 M-40 60 V40 L-24 18 M0 60 V34 M40 60 V40 L24 18"/>` +
      `<circle r="34" class="body motorbody ${a.state}"/>` +
      `<text class="mtxt" y="2" text-anchor="middle">M</text><text class="mtxt2" y="20" text-anchor="middle">3~ ${a.coupling === 'D' ? 'Δ' : a.coupling === 'Y' ? 'Y' : ''}</text>` +
      `<g class="rotor" transform="rotate(${a.angle || 0})"><path class="rotarr" d="M0 -41 A41 41 0 0 1 35.5 -20.5"/><path class="rotarr" d="M0 41 A41 41 0 0 1 -35.5 20.5"/>` +
      `<circle cx="0" cy="-41" r="2.5" class="fill-live"/><circle cx="0" cy="41" r="2.5" class="fill-live"/></g>`
  };

  function partState(sim, p) {
    const k = TYPES[p.type].kind;
    const a = {};
    if (k === 'contact') { const pr = sim.pairs(p); a.closed = pr.length > 0; a.act = sim.actuated(p); }
    else if (k === 'fuse') a.blown = p.st.blown;
    else if (k === 'cb') a.closed = sim.pairs(p).length > 0;
    else if (k === 'sw2') a.pos = p.st.pos;
    else if (p.type === 'coil' || p.type === 'telerupt') a.on = sim.coil[p.id];
    else if (p.type === 'coil_ton') { a.on = sim.coil[p.id]; const tm = sim.timer[p.id]; a.prog = tm ? Math.round(tm.acc / (p.delay || 3) * 20) / 20 : 0; }
    else if (p.type === 'lamp') a.on = sim.lamp[p.id];
    else if (p.type === 'km3' || p.type === 'breaker3') a.closed = sim.pairs(p).length > 0;
    else if (p.type === 'thermal3') a.tripped = p.st.tripped;
    else if (p.type === 'motor3') { a.state = sim.motor[p.id].state; }
    else if (p.type === 'motor6') { a.state = sim.motor[p.id].state; a.coupling = sim.motor[p.id].coupling; }
    a.pressed = !!(p.st.pressed || p.st.latched);
    return a;
  }

  function labelFor(p) {
    const t = TYPES[p.type];
    let s = '';
    const tag = tagOf(p);
    if (t.kind === 'pole3') {
      s += `<text class="tag" x="-34" y="4" text-anchor="end">${esc(tag)}</text>`;
      if (p.t) [0, 1, 2].forEach(i => { s += `<text class="tn" x="${i * 40 + 4}" y="-28">${p.t[i * 2]}</text><text class="tn" x="${i * 40 + 4}" y="36">${p.t[i * 2 + 1]}</text>`; });
    } else if (p.type === 'motor6') {
      s += `<text class="tag" x="-46" y="4" text-anchor="end">${esc(tag)}</text>`;
      s += `<text class="tn" x="-37" y="-48">U1</text><text class="tn" x="3" y="-48">V1</text><text class="tn" x="43" y="-48">W1</text><text class="tn" x="-37" y="54">U2</text><text class="tn" x="3" y="54">V2</text><text class="tn" x="43" y="54">W2</text>`;
    } else if (t.kind === 'motor') {
      s += `<text class="tag" x="-46" y="10" text-anchor="end">${esc(tag)}</text>`;
      s += `<text class="tn" x="-37" y="-48">U</text><text class="tn" x="3" y="-48">V</text><text class="tn" x="43" y="-48">W</text>`;
    } else if (t.kind === 'sw2') {
      s += `<text class="tag" x="-28" y="4" text-anchor="end">${esc(tag)}</text>`;
    } else {
      const left = t.manual || p.type.startsWith('th_') || p.type.startsWith('ton') || p.type === 'cb';
      s += `<text class="tag" x="${left ? -34 : -20}" y="${t.kind === 'load' ? 5 : 4}" text-anchor="end">${esc(tag)}</text>`;
      if (p.t) s += `<text class="tn" x="5" y="-26">${p.t[0]}</text><text class="tn" x="5" y="34">${p.t[1]}</text>`;
    }
    return s;
  }

  function colOf(x) { return Math.floor(x / 5) + 1; }

  /* Renvois sous les bobines : liste des contacts et colonne du folio (comme un vrai dossier). */
  function crossRef(circ, coil) {
    const rows = circ.parts.filter(p => p.of === coil.id);
    if (!rows.length) return '';
    let s = `<g class="xref" transform="translate(${coil.x * G + 22},${coil.y * G + 22})">`;
    rows.forEach((p, i) => {
      const lbl = p.type === 'km3' ? '1-2 3-4 5-6' : (p.t ? p.t.join('-') : '');
      const typ = (TYPES[p.type].nc ? 'NF' : 'NO');
      s += `<text y="${i * 11}">${lbl}<tspan class="xcol"> ${p.type === 'km3' ? '' : typ} /${colOf(p.x)}</tspan></text>`;
    });
    return s + '</g>';
  }

  function staticSVG(circ) {
    const W = circ.w, H = circ.h;
    let s = '';
    // Cadre du folio
    s += `<rect class="sheet" x="${-0.5 * G}" y="${-1.6 * G}" width="${(W + 0.5) * G}" height="${(H + 1.4) * G}"/>`;
    s += `<g class="colband">`;
    for (let c = 0; c * 5 < W; c++) {
      const x0 = c * 5 * G, x1 = Math.min(W, (c + 1) * 5) * G;
      s += `<line x1="${x1}" y1="${-1.6 * G}" x2="${x1}" y2="${-0.8 * G}"/><text x="${(x0 + x1) / 2}" y="${-1.0 * G}" text-anchor="middle">${c + 1}</text>`;
    }
    s += `<line x1="${-0.5 * G}" y1="${-0.8 * G}" x2="${W * G}" y2="${-0.8 * G}"/></g>`;
    // Cartouche
    const cw = 15 * G, ch = 3.2 * G, cx = W * G - cw, cy = (H - 0.2) * G - ch;
    s += `<g class="cartouche" transform="translate(${cx},${cy})"><rect width="${cw}" height="${ch}"/>` +
      `<line x1="0" y1="${ch * 0.55}" x2="${cw}" y2="${ch * 0.55}"/><line x1="${cw * 0.72}" y1="0" x2="${cw * 0.72}" y2="${ch}"/>` +
      `<text class="ct-title" x="8" y="${ch * 0.38}">${esc(circ.folio)}</text>` +
      `<text class="ct-sub" x="8" y="${ch * 0.85}">AMPÈRE ACADÉMIE · Atelier</text>` +
      `<text class="ct-sub" x="${cw * 0.72 + 8}" y="${ch * 0.38}">Folio</text><text class="ct-num" x="${cw - 8}" y="${ch * 0.42}" text-anchor="end">${(LISTIDX(circ.id))}</text>` +
      `<text class="ct-sub" x="${cw * 0.72 + 8}" y="${ch * 0.85}">Rév. A</text></g>`;
    (circ.sections || []).forEach(z => { s += `<text class="section" x="${z.x * G}" y="${z.y * G}">${esc(z.t)}</text>`; });
    // Conducteurs
    s += '<g class="wires">';
    circ.wires.forEach((w, i) => {
      const pts = w.p.map(([x, y]) => `${x * G},${y * G}`).join(' ');
      s += `<polyline class="w" data-net="${esc(w.n)}" points="${pts}"/><polyline class="fl" data-net="${esc(w.n)}" points="${pts}"/>`;
    });
    s += '</g>';
    (circ.dots || []).forEach(([x, y]) => { s += `<circle class="dot" cx="${x * G}" cy="${y * G}" r="3.2"/>`; });
    // Bornes d'alimentation
    circ.sources.forEach(src => {
      s += `<g class="src" transform="translate(${src.x * G},${src.y * G})"><circle r="4.5"/><text y="-9" text-anchor="middle">${esc(src.label)}</text></g>`;
    });
    // Renvois
    circ.parts.filter(p => p.type === 'coil' || p.type === 'coil_ton' || p.type === 'telerupt').forEach(c => { s += crossRef(circ, c); });
    s += '<g class="parts"></g><g class="tps"></g><g class="hl"></g><g class="probes"></g>';
    return s;
  }
  let LISTIDX = id => { const i = window.AACircuits.LIST.indexOf(id); return String(i + 1).padStart(2, '0'); };

  class SchemaView {
    constructor(el, sim, opts) {
      this.el = el; this.sim = sim; this.o = Object.assign({ interactive: true, potentials: true }, opts || {});
      this.mode = 'operate';
      this.keys = {};
      this.probe = [];
      el.classList.add('schema-host');
      const c = sim.c;
      this.vb = { x: -1 * G, y: -2.2 * G, w: (c.w + 2) * G, h: (c.h + 2.6) * G };
      el.innerHTML = `<svg class="schema${this.o.potentials ? ' show-pot' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="${this.vb.x} ${this.vb.y} ${this.vb.w} ${this.vb.h}" preserveAspectRatio="xMidYMid meet">` +
        `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
        `<radialGradient id="lampWarm"><stop offset="0" stop-color="#fff6d8"/><stop offset=".55" stop-color="#ffd166"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>` +
        `<radialGradient id="lampGreen"><stop offset="0" stop-color="#eafff3"/><stop offset=".5" stop-color="#5ef0a6"/><stop offset="1" stop-color="#11a865"/></radialGradient>` +
        `<radialGradient id="lampOrange"><stop offset="0" stop-color="#fff0dc"/><stop offset=".5" stop-color="#ffab4c"/><stop offset="1" stop-color="#e2601a"/></radialGradient>` +
        `<radialGradient id="lampRed"><stop offset="0" stop-color="#ffe3e3"/><stop offset=".5" stop-color="#ff6b6b"/><stop offset="1" stop-color="#c92a2a"/></radialGradient>` +
        `</defs><g class="vp">${staticSVG(c)}</g></svg>`;
      this.svg = el.querySelector('svg');
      this.gParts = this.svg.querySelector('.parts');
      this.gTps = this.svg.querySelector('.tps');
      this.gHl = this.svg.querySelector('.hl');
      this.gProbes = this.svg.querySelector('.probes');
      this.wires = [...this.svg.querySelectorAll('.w')];
      this.flows = [...this.svg.querySelectorAll('.fl')];
      this.partEls = {};
      sim.parts.forEach(p => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'part t-' + p.type);
        g.setAttribute('data-id', p.id);
        g.setAttribute('transform', `translate(${p.x * G},${p.y * G})`);
        this.gParts.appendChild(g);
        this.partEls[p.id] = g;
      });
      this.bind();
      this.render(true);
      this.off = sim.on(() => this.render());
      this.raf = 0;
      const loop = (t) => {
        if (!this.el.isConnected) { this.destroy(); return; }
        const dt = this.last ? Math.min(0.1, (t - this.last) / 1000) : 0;
        this.last = t;
        if (!this.o.external) this.sim.step(dt);
        this.render();
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    destroy() { cancelAnimationFrame(this.raf); if (this.off) this.off(); }

    hitBox(p) {
      const k = TYPES[p.type].kind;
      if (k === 'pole3') return `<rect class="hit" x="-30" y="-36" width="124" height="72"/>`;
      if (p.type === 'motor6') return `<rect class="hit" x="-46" y="-40" width="92" height="80"/>`;
      if (k === 'motor') return `<rect class="hit" x="-46" y="-30" width="92" height="76"/>`;
      if (k === 'sw2') return `<rect class="hit" x="-30" y="-34" width="60" height="68"/>`;
      return `<rect class="hit" x="-36" y="-30" width="58" height="60"/>`;
    }

    render(force) {
      const sim = this.sim;
      for (const p of sim.parts) {
        const a = partState(sim, p);
        if (p.type === 'motor3' || p.type === 'motor6') {
          const rot = this.partEls[p.id].querySelector('.rotor');
          if (rot && !force) {
            rot.setAttribute('transform', `${p.type === 'motor3' ? 'translate(0,6) ' : ''}rotate(${p.st.angle.toFixed(1)})`);
            rot.style.opacity = Math.min(1, Math.abs(p.st.speed) * 1.4);
          }
        }
        const key = JSON.stringify(a) + (p.fault && this.o.showFaults ? p.fault : '');
        if (!force && this.keys[p.id] === key) continue;
        this.keys[p.id] = key;
        if (p.type === 'motor3' || p.type === 'motor6') a.angle = p.st.angle;
        const flip = p.r === 180 ? ' transform="rotate(180)"' : '';
        const g = this.partEls[p.id];
        g.innerHTML = `<g class="sym"${flip}>${SYM[p.type](p, a)}</g>${labelFor(p)}${this.o.interactive ? this.hitBox(p) : ''}`;
        g.classList.toggle('pressed', a.pressed);
        g.classList.toggle('energized', !!a.on || a.state === 'run');
        g.classList.toggle('tripped', !!(a.blown || a.tripped || p.st.tripped));
        g.classList.toggle('manual', !!(TYPES[p.type].manual || ['cb', 'breaker3', 'sw2', 'fuse', 'thermal3'].includes(p.type)));
      }
      // Couleurs de potentiel + flux
      const sig = sim.parts.map(p => this.keys[p.id]).join('|');
      if (force || sig !== this.wsig) {
        this.wsig = sig;
        this.wires.forEach((w, i) => {
          const n = w.dataset.net, pot = sim.netPot(n);
          w.setAttribute('class', 'w' + (pot ? ' p-' + pot.replace('+', 'P') : ''));
          this.flows[i].setAttribute('class', 'fl' + (sim.flow.has(n) ? ' on p-' + (pot || '').replace('+', 'P') : ''));
        });
        this.svg.querySelectorAll('.dot').forEach(d => d.classList.remove('live'));
      }
    }

    /* ---------- Interaction ---------- */
    bind() {
      const svg = this.svg;
      const pt = (e) => {
        const r = svg.getBoundingClientRect();
        const s = Math.max(this.vb.w / r.width, this.vb.h / r.height);
        const ox = (r.width * s - this.vb.w) / 2, oy = (r.height * s - this.vb.h) / 2;
        return { x: this.vb.x + (e.clientX - r.left) * s - ox, y: this.vb.y + (e.clientY - r.top) * s - oy, s };
      };
      this.pt = pt;
      const pointers = new Map();
      let drag = null, pinch = null, pressedId = null;
      svg.addEventListener('pointerdown', e => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const hit = e.target.closest && e.target.closest('.part');
        const tp = e.target.closest && e.target.closest('.tp');
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), vb: Object.assign({}, this.vb), c: pt({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }) };
          drag = null; return;
        }
        if (tp && this.mode === 'meter') { this.addProbe(tp.dataset.net, +tp.dataset.x, +tp.dataset.y); e.preventDefault(); return; }
        if (hit && this.o.interactive && this.mode === 'operate') {
          const id = hit.dataset.id, p = this.sim.byId[id];
          if (this.o.onPick) this.o.onPick(id);
          if (TYPES[p.type].manual === 'push') {
            if (e.shiftKey || e.button === 2) { this.sim.latch(id); }
            else { pressedId = id; this.sim.press(id, true); svg.setPointerCapture(e.pointerId); }
            e.preventDefault(); return;
          }
          if (['sw1', 'sw2', 'cb', 'breaker3', 'fuse', 'thermal3'].includes(p.type)) { this.sim.toggle(id); e.preventDefault(); return; }
          return;
        }
        if (hit && this.mode !== 'operate' && this.o.onPick) this.o.onPick(hit.dataset.id);
        drag = { x: e.clientX, y: e.clientY, vb: Object.assign({}, this.vb), moved: false };
        svg.setPointerCapture(e.pointerId);
      });
      svg.addEventListener('pointermove', e => {
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          this.zoomAt(pinch.c, pinch.d / d, pinch.vb);
          return;
        }
        if (drag) {
          const r = svg.getBoundingClientRect();
          const s = Math.max(drag.vb.w / r.width, drag.vb.h / r.height);
          const dx = (e.clientX - drag.x) * s, dy = (e.clientY - drag.y) * s;
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
          this.vb.x = drag.vb.x - dx; this.vb.y = drag.vb.y - dy; this.applyVB();
        }
      });
      const up = e => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        if (pressedId) { this.sim.press(pressedId, false); pressedId = null; }
        drag = null;
      };
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
      svg.addEventListener('contextmenu', e => e.preventDefault());
      svg.addEventListener('dblclick', e => {
        const hit = e.target.closest && e.target.closest('.part');
        if (hit && this.mode === 'operate') { const p = this.sim.byId[hit.dataset.id]; if (TYPES[p.type].manual === 'push') this.sim.latch(p.id); }
      });
      svg.addEventListener('wheel', e => {
        e.preventDefault();
        this.zoomAt(pt(e), e.deltaY > 0 ? 1.12 : 1 / 1.12);
      }, { passive: false });
    }

    zoomAt(c, f, base) {
      const vb = base || this.vb;
      const c0 = this.sim.c;
      const maxW = (c0.w + 8) * G, minW = 8 * G;
      let nw = Math.max(minW, Math.min(maxW, vb.w * f));
      const k = nw / vb.w;
      this.vb = { x: c.x - (c.x - vb.x) * k, y: c.y - (c.y - vb.y) * k, w: nw, h: vb.h * k };
      this.applyVB();
    }
    applyVB() { this.svg.setAttribute('viewBox', `${this.vb.x} ${this.vb.y} ${this.vb.w} ${this.vb.h}`); }
    fit() { const c = this.sim.c; this.vb = { x: -1 * G, y: -2.2 * G, w: (c.w + 2) * G, h: (c.h + 2.6) * G }; this.applyVB(); }

    setMode(m) {
      this.mode = m;
      this.svg.classList.toggle('meter', m === 'meter');
      this.gTps.innerHTML = '';
      if (m === 'meter') {
        const seen = new Set();
        let s = '';
        this.sim.parts.forEach(p => termsOf(p).forEach(t => {
          const k = t.x + ',' + t.y; if (seen.has(k)) return; seen.add(k);
          s += `<g class="tp" data-net="${esc(t.net)}" data-x="${t.x}" data-y="${t.y}" transform="translate(${t.x * G},${t.y * G})"><circle r="9" class="tphit"/><circle r="3.4" class="tpdot"/></g>`;
        }));
        this.sim.c.sources.forEach(src => {
          const k = src.x + ',' + src.y; if (seen.has(k)) return; seen.add(k);
          s += `<g class="tp" data-net="${esc(src.net)}" data-x="${src.x}" data-y="${src.y}" transform="translate(${src.x * G},${src.y * G})"><circle r="9" class="tphit"/><circle r="3.4" class="tpdot"/></g>`;
        });
        this.gTps.innerHTML = s;
      } else { this.probe = []; this.drawProbes(); }
    }
    addProbe(net, x, y) {
      if (this.probe.length >= 2) this.probe = [];
      this.probe.push({ net, x, y });
      this.drawProbes();
      if (this.o.onProbe) this.o.onProbe(this.probe.slice());
    }
    drawProbes() {
      this.gProbes.innerHTML = this.probe.map((p, i) =>
        `<g transform="translate(${p.x * G},${p.y * G})" class="probe ${i ? 'red' : 'black'}"><path d="M0 0 L-6 -22 L6 -22 Z"/><rect x="-5" y="-48" width="10" height="27" rx="3"/><text y="-52" text-anchor="middle">${i ? 'V' : 'COM'}</text></g>`).join('');
    }

    highlight(id) {
      this.gHl.innerHTML = '';
      if (!id) return;
      const p = this.sim.byId[id]; if (!p) return;
      const k = TYPES[p.type].kind;
      const w = k === 'pole3' ? 130 : (k === 'motor' ? 100 : 70), h = k === 'motor' ? 110 : 90;
      const x = p.x * G + (k === 'pole3' ? -26 : -w / 2 - 6), y = p.y * G - (k === 'motor' ? 66 : h / 2);
      this.gHl.innerHTML = `<rect class="hlbox" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    }
  }

  window.AASchema = { SchemaView, SYM, partState, tagOf };
})();
