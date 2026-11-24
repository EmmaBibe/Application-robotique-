/* Ampère Académie — moteur de simulation électrique (logique à relais + puissance triphasée).
 * Modèle : des « nets » (équipotentielles) reliés par des organes de coupure (contacts, fusibles,
 * disjoncteurs) et des récepteurs (bobines, voyants, moteurs). Chaque pas de calcul :
 *  1. union des nets reliés par des organes fermés,
 *  2. détection des courts-circuits (deux potentiels différents dans un même groupe) -> déclenchement
 *     de la protection la plus petite qui l'élimine,
 *  3. mise à jour séquentielle des bobines jusqu'à stabilité (comme de vrais relais),
 *  4. calcul des moteurs, voyants, conducteurs parcourus par un courant, potentiels « vus » au multimètre.
 */
(function () {
  'use strict';
  const PH = (m, d) => ({ re: m * Math.cos(d * Math.PI / 180), im: m * Math.sin(d * Math.PI / 180) });
  const POTV = {
    L1: PH(400 / Math.sqrt(3), 0), L2: PH(400 / Math.sqrt(3), -120), L3: PH(400 / Math.sqrt(3), 120), N: PH(0, 0), PE: PH(0, 0),
    '+24': { re: 24, im: 0 }, '0V': { re: 0, im: 0 }, '+12': { re: 12, im: 0 }
  };
  const DC = { '+24': 1, '0V': 1, '+12': 1 };
  const canon = p => (p === 'L' ? 'L1' : p);
  function volt(a, b) {
    const A = POTV[a], B = POTV[b];
    if (!A || !B) return 0;
    return Math.hypot(A.re - B.re, A.im - B.im);
  }

  class UF {
    constructor() { this.p = new Map(); }
    f(x) {
      let p = this.p.get(x);
      if (p === undefined) { this.p.set(x, x); return x; }
      if (p === x) return x;
      const r = this.f(p); this.p.set(x, r); return r;
    }
    u(a, b) { a = this.f(a); b = this.f(b); if (a !== b) this.p.set(a, b); }
  }

  /* --- Types d'organes : bornes (en unités de grille, orientation verticale) --- */
  const T2 = [['a', 0, -2], ['b', 0, 2]];
  const TYPES = {
    no: { terms: T2, kind: 'contact', nc: false },
    nc: { terms: T2, kind: 'contact', nc: true },
    pb_no: { terms: T2, kind: 'contact', nc: false, manual: 'push' },
    pb_nc: { terms: T2, kind: 'contact', nc: true, manual: 'push' },
    pbm_no: { terms: T2, kind: 'contact', nc: false, manual: 'push', mush: true },
    pbm_nc: { terms: T2, kind: 'contact', nc: true, manual: 'push', mush: true }, // arrêt d'urgence (accrochage)
    sw1: { terms: T2, kind: 'contact', nc: false, manual: 'toggle' },
    th_nc: { terms: T2, kind: 'contact', nc: true },
    th_no: { terms: T2, kind: 'contact', nc: false },
    ton_no: { terms: T2, kind: 'contact', nc: false },
    ton_nc: { terms: T2, kind: 'contact', nc: true },
    ls_no: { terms: T2, kind: 'contact', nc: false, manual: 'push' }, // fin de course
    ls_nc: { terms: T2, kind: 'contact', nc: true, manual: 'push' },
    fuse: { terms: T2, kind: 'fuse' },
    cb: { terms: T2, kind: 'cb' },
    sw2: { terms: [['c', 0, -2], ['t1', -1, 2], ['t2', 1, 2]], kind: 'sw2' },
    coil: { terms: [['a', 0, -2], ['b', 0, 2]], kind: 'load', R: 480 },
    coil_ton: { terms: [['a', 0, -2], ['b', 0, 2]], kind: 'load', R: 620 },
    telerupt: { terms: [['a', 0, -2], ['b', 0, 2]], kind: 'load', R: 420 },
    minut: { terms: [['a', 0, -2], ['b', 0, 2]], kind: 'load', R: 900 },
    lamp: { terms: T2, kind: 'load', R: 530 },
    km3: { terms: [['a1', 0, -2], ['b1', 0, 2], ['a2', 2, -2], ['b2', 2, 2], ['a3', 4, -2], ['b3', 4, 2]], kind: 'pole3' },
    breaker3: { terms: [['a1', 0, -2], ['b1', 0, 2], ['a2', 2, -2], ['b2', 2, 2], ['a3', 4, -2], ['b3', 4, 2]], kind: 'pole3' },
    thermal3: { terms: [['a1', 0, -2], ['b1', 0, 2], ['a2', 2, -2], ['b2', 2, 2], ['a3', 4, -2], ['b3', 4, 2]], kind: 'pole3' },
    motor3: { terms: [['U', -2, -3], ['V', 0, -3], ['W', 2, -3]], kind: 'motor', R: 6 },
    /* Moteur à 6 bornes (étoile-triangle) : enroulements U1-U2, V1-V2, W1-W2 */
    motor6: { terms: [['U1', -2, -3], ['V1', 0, -3], ['W1', 2, -3], ['U2', -2, 3], ['V2', 0, 3], ['W2', 2, 3]], kind: 'motor', R: 4 }
  };
  const PROT = { fuse: 1, cb: 1, breaker3: 1 };

  function termsOf(p) {
    const t = TYPES[p.type].terms, flip = p.r === 180 ? -1 : 1;
    return t.map(([k, dx, dy]) => ({ k, x: p.x + dx * flip, y: p.y + dy * flip, net: p.n[k] }));
  }

  class Sim {
    constructor(circ) {
      this.c = circ;
      this.parts = circ.parts.map(p => Object.assign({}, p, { st: Object.assign({}, p.st || {}), fault: null }));
      this.byId = {};
      this.parts.forEach(p => { this.byId[p.id] = p; });
      this.coils = this.parts.filter(p => p.type === 'coil' || p.type === 'coil_ton' || p.type === 'telerupt' || p.type === 'minut');
      this.coil = {};
      this.timer = {};
      this.coils.forEach(p => { this.coil[p.id] = false; if (p.type === 'coil_ton') this.timer[p.id] = { acc: 0, done: false }; });
      this.parts.forEach(p => {
        if (p.type === 'cb' || p.type === 'breaker3') { if (p.st.on === undefined) p.st.on = true; p.st.tripped = false; }
        if (p.type === 'fuse') p.st.blown = false;
        if (p.type === 'thermal3') { p.st.tripped = false; p.st.heat = 0; }
        if (p.type === 'motor3' || p.type === 'motor6') { p.st.speed = 0; p.st.angle = 0; }
        if (p.type === 'sw2' && !p.st.pos) p.st.pos = 1;
      });
      this.events = [];
      this.time = 0;
      this.listeners = [];
      this.solve();
    }

    on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(f => f !== fn); }; }
    emit(type, data) { this.events.push({ t: this.time, type, data }); this.listeners.forEach(f => f(type, data)); }

    /* Une commande de contact est-elle actionnée ? */
    actuated(p) {
      const t = p.type;
      if (t === 'pb_no' || t === 'pb_nc' || t === 'ls_no' || t === 'ls_nc') return !!(p.st.pressed || p.st.latched);
      if (t === 'pbm_no' || t === 'pbm_nc') return !!(p.st.pressed || p.st.latched);
      if (t === 'sw1') return !!p.st.on;
      if (t === 'no' || t === 'nc') {
        const c = this.byId[p.of];
        if (c && c.type === 'telerupt') return !!c.st.toggled;
        if (c && c.type === 'minut') return this.time < (c.st.until || 0);
        return !!this.coil[p.of];
      }
      if (t === 'ton_no' || t === 'ton_nc') return !!(this.timer[p.of] && this.timer[p.of].done);
      if (t === 'th_nc' || t === 'th_no') return !!(this.byId[p.of] && this.byId[p.of].st.tripped);
      return false;
    }

    /* Paires de nets reliées par l'organe (état courant). */
    pairs(p) {
      const k = TYPES[p.type].kind, n = p.n;
      if (k === 'contact') {
        if (p.fault === 'open') return [];
        if (p.fault === 'stuck') return [[n.a, n.b]];
        const act = this.actuated(p);
        return (TYPES[p.type].nc ? !act : act) ? [[n.a, n.b]] : [];
      }
      if (k === 'fuse') return (p.st.blown || p.fault === 'open' || p.fault === 'blown') ? [] : [[n.a, n.b]];
      if (k === 'cb') return (p.st.on && !p.st.tripped && p.fault !== 'open') ? [[n.a, n.b]] : [];
      if (k === 'sw2') return p.fault === 'open' ? [] : [[n.c, p.st.pos === 2 ? n.t2 : n.t1]];
      if (k === 'pole3') {
        let closed;
        if (p.type === 'km3') closed = p.fault === 'stuck' ? true : (p.fault === 'open' ? false : !!this.coil[p.of]);
        else if (p.type === 'breaker3') closed = p.st.on && !p.st.tripped;
        else closed = true;
        if (!closed) return [];
        const out = [[n.a1, n.b1], [n.a2, n.b2], [n.a3, n.b3]];
        if (p.type === 'thermal3' && p.fault === 'open') out.splice(1, 1); // une phase coupée
        if (p.type === 'km3' && p.fault === 'pole') out.splice(2, 1); // pôle usé
        return out;
      }
      return [];
    }

    groups(excludeId) {
      const uf = new UF();
      Object.keys(this.c.nets).forEach(n => uf.f(n));
      for (const p of this.parts) {
        if (p.id === excludeId) continue;
        for (const [a, b] of this.pairs(p)) uf.u(a, b);
      }
      const pots = new Map();
      for (const s of this.c.sources) {
        const r = uf.f(s.net);
        if (!pots.has(r)) pots.set(r, new Set());
        pots.get(r).add(canon(s.pot));
      }
      return { uf, pots };
    }

    shortIn(g) {
      for (const [r, set] of g.pots) {
        const a = [...set];
        for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (volt(a[i], a[j]) > 1) return r;
      }
      return null;
    }

    potOf(g, net) {
      const s = g.pots.get(g.uf.f(net));
      if (!s || s.size !== 1) return null;
      return [...s][0];
    }

    tripForShort() {
      const prot = this.parts.filter(p => PROT[p.type] && this.pairs(p).length)
        .sort((a, b) => (a.rating || 99) - (b.rating || 99));
      for (const p of prot) {
        if (this.shortIn(this.groups(p.id)) === null) { this.trip(p, 'court-circuit'); return true; }
      }
      if (prot.length) { this.trip(prot[prot.length - 1], 'court-circuit'); return true; }
      return false;
    }

    trip(p, why) {
      if (p.type === 'fuse') p.st.blown = true;
      else { p.st.tripped = true; p.st.on = false; }
      this.emit('trip', { id: p.id, why });
    }

    loadOn(p, g) {
      if (p.fault === 'open' || p.fault === 'burnt') return false;
      const a = this.potOf(g, p.n.a), b = this.potOf(g, p.n.b);
      if (!a || !b) return false;
      const v = volt(a, b);
      if (p.u && Math.abs(v - p.u) / p.u > 0.35) return false; // bobine sous-alimentée : ne colle pas
      return v > 1;
    }

    solve() {
      let guard = 0;
      this.osc = false;
      this.shortStuck = false;
      for (; guard < 60; guard++) {
        const g = this.groups(null);
        if (this.shortIn(g) !== null) {
          if (!this.tripForShort()) { this.shortStuck = true; break; }
          continue;
        }
        let changed = false;
        for (const p of this.coils) {
          const e = this.loadOn(p, g);
          if (e !== this.coil[p.id]) {
            this.coil[p.id] = e;
            if (p.type === 'telerupt' && e) p.st.toggled = !p.st.toggled;
            if (p.type === 'minut' && e) p.st.until = this.time + (p.delay || 60);
            if (p.type === 'coil_ton' && !e) { this.timer[p.id].acc = 0; this.timer[p.id].done = false; }
            changed = true;
            break; // séquentiel : une bobine à la fois, comme des relais réels
          }
        }
        if (!changed) break;
      }
      if (guard >= 60) this.osc = true;
      this.g = this.groups(null);
      this.post();
    }

    post() {
      const g = this.g;
      this.lamp = {};
      this.motor = {};
      const anchors = new Set();
      for (const p of this.parts) {
        if (p.type === 'lamp') {
          const on = this.loadOn(p, g);
          this.lamp[p.id] = on;
          if (on) { anchors.add(p.n.a); anchors.add(p.n.b); }
        } else if (p.type === 'coil' || p.type === 'coil_ton' || p.type === 'telerupt' || p.type === 'minut') {
          if (this.coil[p.id]) { anchors.add(p.n.a); anchors.add(p.n.b); }
        } else if (p.type === 'motor3') {
          const ph = ['U', 'V', 'W'].map(k => this.potOf(g, p.n[k]));
          const idx = ph.map(x => ({ L1: 0, L2: 1, L3: 2 })[x]);
          const live = idx.filter(i => i !== undefined);
          const distinct = new Set(live).size;
          let state = 'stop', dir = 0;
          if (p.fault === 'open' && distinct === 3) state = 'mono';
          else if (distinct === 3) { state = 'run'; dir = ((idx[1] - idx[0] + 3) % 3 === 1) ? 1 : -1; }
          else if (distinct === 2) state = 'mono';
          this.motor[p.id] = { state, dir };
          if (state !== 'stop') ['U', 'V', 'W'].forEach(k => { if (this.potOf(g, p.n[k])) anchors.add(p.n[k]); });
        } else if (p.type === 'motor6') {
          // chaque enroulement : 'D' = deux phases différentes (400 V), 'Y' = une phase + point étoile commun isolé
          const W = [['U1', 'U2'], ['V1', 'V2'], ['W1', 'W2']];
          const P = k => this.potOf(g, p.n[k]), R = k => g.uf.f(p.n[k]);
          const star = !P('U2') && !P('V2') && !P('W2') && R('U2') === R('V2') && R('V2') === R('W2');
          const wst = W.map(([a, b]) => { const pa = P(a), pb = P(b); if (pa && pb && pa !== pb) return 'D'; if (pa && !pb && star) return 'Y'; if (!pa && pb && star) return 'Y'; return pa || pb ? 'x' : '0'; });
          const first = ['U1', 'V1', 'W1'].map(k => ({ L1: 0, L2: 1, L3: 2 })[P(k)]);
          let state = 'stop', dir = 0, coupling = '';
          const allD = wst.every(x => x === 'D'), allY = wst.every(x => x === 'Y');
          if ((allD || allY) && new Set(first).size === 3 && !first.includes(undefined) && p.fault !== 'open') { state = 'run'; coupling = allD ? 'D' : 'Y'; dir = ((first[1] - first[0] + 3) % 3 === 1) ? 1 : -1; }
          else if (wst.some(x => x === 'D' || x === 'Y' || x === 'x') && wst.some(x => x !== '0')) state = (wst.filter(x => x === 'D' || x === 'Y').length ? 'mono' : 'stop');
          this.motor[p.id] = { state, dir, coupling };
          if (state !== 'stop') ['U1', 'V1', 'W1', 'U2', 'V2', 'W2'].forEach(k => { if (P(k)) anchors.add(p.n[k]); });
        }
      }
      this.c.sources.forEach(s => anchors.add(s.net));
      // Conducteurs parcourus par un courant : élagage des branches mortes
      const adj = new Map();
      const add = (a, b) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push(b); };
      for (const p of this.parts) for (const [a, b] of this.pairs(p)) if (a !== b) { add(a, b); add(b, a); }
      const alive = new Set(Object.keys(this.c.nets));
      const deg = n => (adj.get(n) || []).filter(m => alive.has(m)).length;
      let pruned = true;
      while (pruned) {
        pruned = false;
        for (const n of [...alive]) {
          if (anchors.has(n) && !this.c.sources.some(s => s.net === n)) continue;
          const isSrc = this.c.sources.some(s => s.net === n);
          if (isSrc) continue;
          if (deg(n) <= 1) { alive.delete(n); pruned = true; }
        }
      }
      const loadRoots = new Set();
      for (const p of this.parts) {
        const k = TYPES[p.type].kind;
        const on = (k === 'load' && (this.coil[p.id] || this.lamp[p.id])) || (k === 'motor' && this.motor[p.id].state !== 'stop');
        if (on) termsOf(p).forEach(t => loadRoots.add(g.uf.f(t.net)));
      }
      this.flow = new Set([...alive].filter(n => loadRoots.has(g.uf.f(n)) && this.potOf(g, n)));
      // Potentiels vus par un voltmètre (à travers les récepteurs non coupés)
      this.weak = this.weakPots();
    }

    weakPots() {
      const g = this.g, res = new Map(), edges = new Map();
      const link = (a, b) => {
        a = g.uf.f(a); b = g.uf.f(b);
        if (a === b) return;
        if (!edges.has(a)) edges.set(a, []);
        if (!edges.has(b)) edges.set(b, []);
        edges.get(a).push(b); edges.get(b).push(a);
      };
      for (const p of this.parts) {
        const k = TYPES[p.type].kind;
        if (p.fault === 'open' || p.fault === 'burnt') continue;
        if (k === 'load') link(p.n.a, p.n.b);
        if (p.type === 'motor3') { link(p.n.U, p.n.V); link(p.n.V, p.n.W); }
        if (p.type === 'motor6') { link(p.n.U1, p.n.U2); link(p.n.V1, p.n.V2); link(p.n.W1, p.n.W2); }
      }
      const roots = new Set(Object.keys(this.c.nets).map(n => g.uf.f(n)));
      for (const r of roots) {
        const own = g.pots.get(r);
        if (own && own.size === 1) { res.set(r, [...own][0]); continue; }
        // parcours en largeur vers le potentiel le plus proche
        // Parcours en largeur ; si le nœud isolé est relié de façon symétrique aux trois phases
        // (point étoile d'un récepteur équilibré), son potentiel est celui du neutre.
        const seen = new Set([r]); let frontier = [r], found = [];
        while (frontier.length && !found.length) {
          const next = [];
          for (const x of frontier) for (const y of (edges.get(x) || [])) {
            const s = g.pots.get(y);
            if (s && s.size === 1) { found.push([...s][0]); continue; }
            if (seen.has(y)) continue; seen.add(y);
            next.push(y);
          }
          frontier = next;
        }
        if (found.length) {
          const set = new Set(found);
          res.set(r, set.has('L1') && set.has('L2') && set.has('L3') ? 'N' : found[0]);
        }
      }
      return res;
    }

    /* Mesure au multimètre entre deux nets. mode 'V' ou 'R'. */
    measure(na, nb, mode) {
      const g = this.g;
      if (mode === 'R') {
        if (this.potOf(g, na) || this.potOf(g, nb) || this.weak.get(g.uf.f(na)) || this.weak.get(g.uf.f(nb))) {
          const va = this.weak.get(g.uf.f(na)), vb = this.weak.get(g.uf.f(nb));
          if ((va && va !== 'N' && va !== '0V') || (vb && vb !== 'N' && vb !== '0V')) return { danger: true, text: 'SOUS TENSION' };
        }
        const ra = g.uf.f(na), rb = g.uf.f(nb);
        if (ra === rb) return { value: 0.2, unit: 'Ω', text: '0.2', beep: true };
        // plus court chemin en résistance à travers les récepteurs
        const edges = new Map();
        const link = (a, b, R) => {
          a = g.uf.f(a); b = g.uf.f(b); if (a === b) return;
          (edges.get(a) || edges.set(a, []).get(a)).push([b, R]);
          (edges.get(b) || edges.set(b, []).get(b)).push([a, R]);
        };
        for (const p of this.parts) {
          const k = TYPES[p.type].kind;
          if (p.fault === 'open' || p.fault === 'burnt') continue;
          if (k === 'load') link(p.n.a, p.n.b, TYPES[p.type].R);
          if (p.type === 'motor3') { link(p.n.U, p.n.V, 2 * TYPES.motor3.R); link(p.n.V, p.n.W, 2 * TYPES.motor3.R); link(p.n.U, p.n.W, 2 * TYPES.motor3.R); }
          if (p.type === 'motor6') { link(p.n.U1, p.n.U2, TYPES.motor6.R); link(p.n.V1, p.n.V2, TYPES.motor6.R); link(p.n.W1, p.n.W2, TYPES.motor6.R); }
        }
        const dist = new Map([[ra, 0]]), todo = [ra];
        while (todo.length) {
          todo.sort((x, y) => dist.get(x) - dist.get(y));
          const x = todo.shift();
          for (const [y, R] of (edges.get(x) || [])) {
            const d = dist.get(x) + R;
            if (!dist.has(y) || d < dist.get(y)) { dist.set(y, d); todo.push(y); }
          }
        }
        if (dist.has(rb)) { const v = dist.get(rb); return { value: v, unit: 'Ω', text: v >= 1000 ? (v / 1000).toFixed(2) + 'k' : v.toFixed(1) }; }
        return { value: Infinity, unit: 'Ω', text: 'OL' };
      }
      const pa = this.weak.get(g.uf.f(na)), pb = this.weak.get(g.uf.f(nb));
      if (!pa || !pb) return { value: 0, unit: 'V', text: '0.0', ac: !this.isDC() };
      const v = volt(pa, pb);
      return { value: v, unit: 'V', text: v < 10 ? v.toFixed(1) : String(Math.round(v)), ac: !(DC[pa] || DC[pb]) };
    }

    isDC() { return this.c.sources.some(s => DC[s.pot]); }

    /* Potentiel d'un net pour l'affichage : 'L1' 'N'... ou null (isolé). */
    netPot(net) { return this.potOf(this.g, net); }

    step(dt) {
      const before = this.time;
      this.time += dt;
      let dirty = false;
      for (const p of this.coils) if (p.type === 'minut' && p.st.until && before < p.st.until && this.time >= p.st.until) dirty = true;
      for (const p of this.coils) if (p.type === 'minut' && this.coil[p.id] && p.st.until) p.st.until = Math.max(p.st.until, this.time + (p.delay || 60));
      for (const id in this.timer) {
        const tm = this.timer[id], p = this.byId[id];
        if (this.coil[id]) {
          tm.acc += dt;
          if (!tm.done && tm.acc >= (p.delay || 3)) { tm.done = true; dirty = true; this.emit('timer', { id }); }
        }
      }
      for (const p of this.parts) {
        if (p.type === 'thermal3') {
          const m = this.motor[p.motor];
          let rate = -0.6;
          if (m && m.state === 'run' && (p.fault === 'overload' || (this.byId[p.motor] && this.byId[p.motor].fault === 'overload'))) rate = 1;
          if (m && m.state === 'mono') rate = 1.4;
          p.st.heat = Math.max(0, Math.min(5, p.st.heat + rate * dt));
          if (!p.st.tripped && p.st.heat >= 3.2) { p.st.tripped = true; dirty = true; this.emit('trip', { id: p.id, why: 'surcharge' }); }
        }
        if (p.type === 'motor3' || p.type === 'motor6') {
          const m = this.motor[p.id];
          const target = m.state === 'run' ? m.dir : 0;
          const k = target === 0 ? 0.9 : 1.6;
          p.st.speed += (target - p.st.speed) * Math.min(1, k * dt);
          if (Math.abs(p.st.speed) < 0.002) p.st.speed = 0;
          p.st.angle = (p.st.angle + p.st.speed * dt * 360 * 1.5) % 360;
        }
      }
      if (dirty) this.solve();
    }

    /* Commandes de l'opérateur */
    press(id, down) { const p = this.byId[id]; if (!p) return; p.st.pressed = down; this.solve(); this.emit('act', { id, down }); }
    latch(id) { const p = this.byId[id]; if (!p) return; p.st.latched = !p.st.latched; this.solve(); this.emit('act', { id, latched: p.st.latched }); }
    toggle(id) {
      const p = this.byId[id]; if (!p) return;
      if (p.type === 'sw1') p.st.on = !p.st.on;
      else if (p.type === 'sw2') p.st.pos = p.st.pos === 2 ? 1 : 2;
      else if (p.type === 'cb' || p.type === 'breaker3') { p.st.on = !p.st.on; if (p.st.on) p.st.tripped = false; }
      else if (p.type === 'fuse') { if (p.st.blown) { p.st.blown = false; this.emit('replace', { id }); } }
      else if (p.type === 'thermal3') { if (p.st.tripped && p.st.heat < 1.5) { p.st.tripped = false; this.emit('reset', { id }); } else if (p.st.tripped) this.emit('hot', { id }); }
      this.solve();
      this.emit('act', { id });
    }
    setFault(id, f) { const p = this.byId[id]; if (p) { p.fault = f || null; this.solve(); } }
    clearFaults() { this.parts.forEach(p => { p.fault = null; }); this.solve(); }
    resetAll() {
      this.parts.forEach(p => {
        p.st.pressed = false; p.st.latched = false;
        if (p.type === 'fuse') p.st.blown = false;
        if (p.type === 'cb' || p.type === 'breaker3') { p.st.tripped = false; p.st.on = true; }
        if (p.type === 'thermal3') { p.st.tripped = false; p.st.heat = 0; }
        if (p.type === 'telerupt') p.st.toggled = false;
      });
      for (const id in this.coil) this.coil[id] = false;
      for (const id in this.timer) { this.timer[id].acc = 0; this.timer[id].done = false; }
      this.solve();
    }

    /* Photographie de l'état observable (pour les défis et les tests). */
    snapshot() {
      const o = { coils: Object.assign({}, this.coil), lamps: Object.assign({}, this.lamp), motors: {} };
      for (const id in this.motor) o.motors[id] = this.motor[id].state + (this.motor[id].dir ? (this.motor[id].dir > 0 ? '+' : '-') : '') + (this.motor[id].coupling || '');
      o.trips = this.parts.filter(p => p.st.tripped || p.st.blown).map(p => p.id);
      return o;
    }
  }

  window.AASim = { Sim, TYPES, termsOf, volt, canon, POTV };
})();
