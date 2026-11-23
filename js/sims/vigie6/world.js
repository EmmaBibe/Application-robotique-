// Le monde du banc d'essai, porté depuis recherche/planificateur/sim.py : arène de 20 x 20 m, onze scènes,
// comportement des personnes, capteurs (portée, masquage, détections perdues).
// Le générateur aléatoire diffère de numpy : les mondes sont du même type que ceux du banc (mêmes règles,
// mêmes lois), mais pas les mêmes tirages.

import { DT, R_ROB, SIZE, makeRand } from '../vigie-core.js';
import { occupancy, astar } from './grid.js';

export const T_MAX = 45;

export const SCENES = {
  foret: 'Forêt d\'obstacles', carrefour: 'Carrefour', couloir: 'Couloir', piege: 'Piège en U', foule: 'Foule',
  foule_dense: 'Foule dense', carrefour_rapide: 'Carrefour rapide', traversee: 'Traversée', goulot: 'Porte étroite',
  coin_aveugle: 'Angles morts', poursuite: 'Poursuite',
};

// Conditions de l'évaluation finale (sim.COND)
export const COND = {
  nominal: {},
  perception: { range: 5.0, occl: true, drop: 0.1 },
  reactifs: { react: true },
};

// np.random.default_rng(31 j + 7).random() < 0.7 : quelles personnes réagissent au robot (condition « réactifs »)
const REACTIF = [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0];

const MODES = ['tout_droit', 'gauche', 'droite', 'arret', 'accel'], MODE_P = [0.3, 0.2, 0.2, 0.15, 0.15];

// ---------------------------------------------------------------- mondes dessinés dans l'éditeur
export const KINDS = ['intent', 'errant', 'flux', 'chasseur', 'porte', 'immobile'];
export const PERSO_LIMITS = { static: 200, people: 40, rMin: 0.2, rMax: 2.0, vMax: 2.0 };
const clamp = (x, a, b) => Math.min(b, Math.max(a, Number.isFinite(+x) ? +x : a));

/** Nettoie une description de monde venue de l'éditeur ou d'un code partagé : bornes, types, nombre d'éléments. */
export function pathExists(spec) {
  const S = normalizeSpec(spec);
  return astar(occupancy(S.static, 0.35), S.start, S.goal) !== null;
}

export function normalizeSpec(spec) {
  const S = spec && typeof spec === 'object' ? spec : {};
  const L = PERSO_LIMITS, pt = (q, d) => (Array.isArray(q) && q.length >= 2 ? [clamp(q[0], 0.5, SIZE - 0.5), clamp(q[1], 0.5, SIZE - 0.5)] : d);
  const out = { start: pt(S.start, [1.5, 10]), goal: pt(S.goal, [18.5, 10]), door: Array.isArray(S.door) ? pt(S.door, null) : null, static: [], people: [] };
  for (const c of (Array.isArray(S.static) ? S.static : []).slice(0, L.static)) {
    if (!Array.isArray(c) || c.length < 3) continue;
    out.static.push([clamp(c[0], 0, SIZE), clamp(c[1], 0, SIZE), clamp(c[2], L.rMin, L.rMax)]);
  }
  for (const q of (Array.isArray(S.people) ? S.people : []).slice(0, L.people)) {
    if (!q || typeof q !== 'object') continue;
    const k = KINDS.includes(q.k) ? q.k : 'immobile';
    if (k === 'porte' && !out.door) continue;
    const p = pt(q.p, null); if (!p) continue;
    let v = Array.isArray(q.v) ? [clamp(q.v[0], -L.vMax, L.vMax), clamp(q.v[1], -L.vMax, L.vMax)] : [0, 0];
    const n = Math.hypot(v[0], v[1]); if (n > L.vMax) v = [v[0] / n * L.vMax, v[1] / n * L.vMax];
    const e = { k, p, v, r: clamp(q.r || 0.35, 0.25, 0.5) };
    if (q.sp != null) e.sp = clamp(q.sp, 0.1, L.vMax);
    if (k === 'intent' && MODES.includes(q.mode)) { e.mode = q.mode; e.tSwitch = clamp(q.tSwitch, 0, 1e9); }
    out.people.push(e);
  }
  return out;
}

export class World {
  constructor(name, seed, spec = null) {
    this.name = name; this.seed = seed;
    this.nrng = makeRand(10000 + seed);
    this.start = [1.5, 10.0, 0.0]; this.goal = [18.5, 10.0];
    if (name === 'perso') {
      // monde dessiné dans l'éditeur : construit tel quel, une seule fois (pas de nouveau tirage s'il est bloqué)
      const S = normalizeSpec(spec);
      this.rng = makeRand(seed); this.static = S.static.map(c => [...c]); this.dyn = []; this.keepout = []; this.door = S.door ? [...S.door] : null;
      this.start = [S.start[0], S.start[1], Math.atan2(S.goal[1] - S.start[1], S.goal[0] - S.start[0])]; this.goal = [...S.goal];
      for (const q of S.people) this._fromSpec(q);
      this.t = 0;
      return;
    }
    for (let k = 0; k < 50; k++) {
      this.rng = makeRand(seed + 100000 * k);
      this.static = []; this.dyn = []; this.keepout = []; this.door = null;
      this['build_' + name]();
      if (this.feasible()) break;
    }
    this.t = 0;
  }
  feasible() { return astar(occupancy(this.static, 0.35), this.start, this.goal) !== null; }

  u(a, b) { return a + (b - a) * this.rng(); }
  choiceMode() {
    let cdf = 0; const r = this.rng();
    for (let i = 0; i < MODES.length; i++) { cdf += MODE_P[i]; if (r < cdf) return MODES[i]; }
    return MODES[MODES.length - 1];
  }
  _free(x, y, r, margin = 1.6) {
    if (Math.hypot(x - this.start[0], y - this.start[1]) < margin + r) return false;
    if (Math.hypot(x - this.goal[0], y - this.goal[1]) < margin + r) return false;
    if (this.keepout.some(([a, b]) => Math.hypot(x - a, y - b) < r + 1.4)) return false;
    return this.static.every(([a, b, c]) => Math.hypot(x - a, y - b) > r + c + 0.15);
  }
  _rand_static(n, rmin = 0.4, rmax = 1.0, box = [3, 17, 1, 19]) {
    while (n > 0) {
      const r = this.u(rmin, rmax), x = this.u(box[0], box[1]), y = this.u(box[2], box[3]);
      if (this._free(x, y, r)) { this.static.push([x, y, r]); n--; }
    }
  }
  _person(p, v, r, kind, extra = {}) {
    const j = this.dyn.length;
    this.dyn.push({ p: [p[0], p[1]], v: [v[0], v[1]], r, kind, mode: 'tout_droit', tSwitch: 1e9, done: true, reactif: !!REACTIF[j % REACTIF.length], ...extra });
  }
  _add_dyn(p, v, r = 0.35, kind = 'intent') {
    const tSwitch = this.u(1.0, 12.0), mode = this.choiceMode();
    this._person(p, v, r, kind, { tSwitch, mode, done: false });
  }

  /** Une personne décrite dans l'éditeur. Les comportements sont ceux du banc ; « immobile » est une personne arrêtée. */
  _fromSpec(q) {
    const p = q.p, v = q.v || [0, 0], r = q.r || 0.35;
    if (q.k === 'intent') {
      if (q.mode) this._person(p, v, r, 'intent', { tSwitch: q.tSwitch, mode: q.mode, done: false });
      else this._add_dyn(p, v, r, 'intent');
    } else if (q.k === 'errant' || q.k === 'flux') this._person(p, v, r, q.k);
    else if (q.k === 'chasseur') this._person(p, [0, 0], r, 'chasseur', { sp: q.sp || 0.9, reactif: false });
    else if (q.k === 'porte' && this.door) this._person(p, v, r, 'porte', { sp: q.sp || 1.2 });
    else this._person(p, [0, 0], r, 'intent');                     // immobile
  }

  /** Description complète du monde à l'instant 0, reprise par l'éditeur (« partir d'une scène »). */
  toSpec() {
    const r3 = x => Math.round(x * 1000) / 1000;
    return normalizeSpec({
      start: [this.start[0], this.start[1]], goal: [...this.goal], door: this.door,
      static: this.static.map(c => c.map(r3)),
      people: this.dyn.map(o => ({ k: o.kind, p: o.p.map(r3), v: o.v.map(r3), r: o.r, ...(o.sp ? { sp: r3(o.sp) } : {}), ...(o.kind === 'intent' && !o.done ? { tSwitch: r3(o.tSwitch), mode: o.mode } : {}) })),
    });
  }

  build_foret() { this._rand_static(30); }
  build_carrefour() {
    this._rand_static(6);
    for (let i = 0; i < 10; i++) {
      const x = this.u(5, 15), s = this.u(0.6, 1.3);
      if (i % 2) this._add_dyn([x, this.u(0.5, 4)], [this.u(-0.2, 0.2), s]);
      else this._add_dyn([x, this.u(16, 19.5)], [this.u(-0.2, 0.2), -s]);
    }
  }
  build_couloir() {
    const gap = this.u(7, 13);
    for (let y = 0.4; y < SIZE; y += 0.8) if (Math.abs(y - gap) > 1.1) this.static.push([10.0, y, 0.45]);
    this.keepout = [[10.0, gap], [8.5, gap], [11.5, gap]];
    this._rand_static(8);
    this._add_dyn([14, gap + this.u(-1, 1)], [-this.u(0.5, 0.9), 0], 0.4);
    for (let i = 0; i < 3; i++) { const p = [this.u(4, 16), this.u(1, 19)], v = [this.u(-0.8, 0.8), this.u(-0.8, 0.8)]; this._add_dyn(p, v); }
  }
  build_piege() {
    const cx = 9.0;
    for (let k = 0; k < 15; k++) { const a = -Math.PI / 2 + k * Math.PI / 14; this.static.push([cx + 2.6 * Math.cos(a), 10 + 2.6 * Math.sin(a), 0.42]); }
    for (let k = 0; k < 4; k++) { const x = cx - 2.4 + k * 2.4 / 3; this.static.push([x, 7.4, 0.42]); this.static.push([x, 12.6, 0.42]); }
    this._rand_static(10, 0.4, 1.0, [12, 17, 1, 19]);
    for (let i = 0; i < 2; i++) { const p = [this.u(12, 17), this.u(2, 18)], v = [this.u(-0.7, 0.7), this.u(-0.7, 0.7)]; this._add_dyn(p, v); }
  }
  _crowd(n, smin, smax) {
    for (let i = 0; i < n; i++) {
      let x, y;
      for (;;) { x = this.u(3, 17); y = this.u(1, 19); if (this._free(x, y, 0.35, 2.5)) break; }
      const ang = this.u(0, 2 * Math.PI), s = this.u(smin, smax);
      this._add_dyn([x, y], [s * Math.cos(ang), s * Math.sin(ang)], 0.35, 'errant');
    }
  }
  build_foule() { this._rand_static(8); this._crowd(16, 0.4, 1.1); }
  build_foule_dense() { this._rand_static(5); this._crowd(26, 0.6, 1.4); }
  build_carrefour_rapide() {
    this._rand_static(4);
    for (let i = 0; i < 14; i++) {
      const x = this.u(4, 16), s = this.u(1.0, 1.8);
      if (i % 2) this._add_dyn([x, this.u(0.5, 6)], [this.u(-0.3, 0.3), s]);
      else this._add_dyn([x, this.u(14, 19.5)], [this.u(-0.3, 0.3), -s]);
    }
  }
  _flux(p, v, r = 0.35) { this._person(p, v, r, 'flux'); }
  build_traversee() {
    for (let i = 0; i < 26; i++) {
      const x = this.u(6.3, 13.7), s = this.u(0.8, 1.4) * (i % 2 ? 1 : -1);
      this._flux([x, this.u(0.5, 19.5)], [0.0, s]);
    }
  }
  build_goulot() {
    const gap = this.u(8, 12); this.door = [10.0, gap];
    for (let y = 0.4; y < SIZE; y += 0.8) if (Math.abs(y - gap) > 1.25) this.static.push([10.0, y, 0.45]);
    this.keepout = [[10.0, gap], [8.5, gap], [11.5, gap]];
    for (let i = 0; i < 14; i++) {
      const x = this.u(10.8, 19.5), yy = gap + this.u(-3, 3), sp = this.u(1.0, 1.5);
      this._person([x, yy], [-1.0, 0.0], 0.35, 'porte', { sp });
    }
  }
  build_coin_aveugle() {
    const gaps = [6.5, 10.5, 14.5];
    for (const yw of [8.9, 11.1]) for (let x = 3.0; x < 17.5; x += 0.7) if (gaps.every(g => Math.abs(x - g) > 1.0)) this.static.push([x, yw, 0.4]);
    for (const g of gaps) for (let k = 0; k < 4; k++) {
      const s = this.u(1.6, 2.2) * (this.rng() < 0.5 ? 1 : -1);
      this._flux([g + this.u(-0.3, 0.3), this.u(0.5, 19.5)], [0.0, s]);
    }
  }
  build_poursuite() {
    this._rand_static(10);
    for (let i = 0; i < 6; i++) {
      let x, y;
      for (;;) { x = this.u(6, 19); y = this.u(1, 19); if (this._free(x, y, 0.35, 4.0)) break; }
      this._person([x, y], [0, 0], 0.35, 'chasseur', { sp: this.u(0.75, 1.05), reactif: false });
    }
  }

  /** Un pas de 0,1 s pour toutes les personnes (sim.World.step_obstacles). */
  step(t, robot = null, react = false) {
    const c90 = Math.cos(Math.PI / 2), s90 = Math.sin(Math.PI / 2);
    for (const o of this.dyn) {
      if (react && robot && o.reactif) {
        const dx = o.p[0] - robot[0], dy = o.p[1] - robot[1], n = Math.hypot(dx, dy);
        if (n > 1e-6 && n < 2.0) {
          o.v = [o.v[0] + DT * 1.5 * dx / n * (2.0 - n), o.v[1] + DT * 1.5 * dy / n * (2.0 - n)];
          const sp = Math.hypot(o.v[0], o.v[1]); if (sp > 1.8) o.v = [o.v[0] / sp * 1.8, o.v[1] / sp * 1.8];
        }
      }
      if (o.kind === 'chasseur' && robot) {
        const dx = robot[0] - o.p[0], dy = robot[1] - o.p[1], n = Math.hypot(dx, dy);
        if (n > 1e-6) o.v = [0.85 * o.v[0] + 0.15 * o.sp * dx / n, 0.85 * o.v[1] + 0.15 * o.sp * dy / n];
      } else if (o.kind === 'porte') {
        const door = this.door;
        if (o.p[0] > door[0] + 0.3) { const dx = door[0] - o.p[0], dy = door[1] - o.p[1], n = Math.hypot(dx, dy); o.v = [o.sp * dx / Math.max(n, 1e-6), o.sp * dy / Math.max(n, 1e-6)]; }
        else o.v = [-o.sp, 0.0];
        if (o.p[0] < 0.8) {
          const yIn = door[1] + this.u(-3, 3);
          if (!robot || Math.hypot(19.5 - robot[0], yIn - robot[1]) > 3.5) o.p = [19.5, yIn];
          else { o.p = [-5.0, -5.0]; o.v = [0, 0]; continue; }
        }
      }
      if (o.kind === 'flux') {
        o.p = [o.p[0] + o.v[0] * DT, o.p[1] + o.v[1] * DT];
        if (o.p[1] > SIZE + 0.4) o.p[1] -= SIZE + 0.8;
        if (o.p[1] < -0.4) o.p[1] += SIZE + 0.8;
        continue;
      }
      if (o.kind === 'chasseur' || o.kind === 'porte') { o.p = [o.p[0] + o.v[0] * DT, o.p[1] + o.v[1] * DT]; continue; }
      if (o.kind === 'errant') {
        if (this.rng() < 0.03) {
          const ang = Math.atan2(o.v[1], o.v[0]) + 1.2 * this.rng.n();
          const s = Math.min(1.2, Math.max(0.2, Math.hypot(o.v[0], o.v[1]) + 0.2 * this.rng.n()));
          o.v = [s * Math.cos(ang), s * Math.sin(ang)];
        }
      } else if (!o.done && t >= o.tSwitch) {
        o.done = true; const [vx, vy] = o.v;
        if (o.mode === 'gauche') o.v = [c90 * vx - s90 * vy, s90 * vx + c90 * vy];
        else if (o.mode === 'droite') o.v = [c90 * vx + s90 * vy, -s90 * vx + c90 * vy];
        else if (o.mode === 'arret') o.v = [vx * 0.0, vy * 0.0];
        else if (o.mode === 'accel') o.v = [vx * 1.6, vy * 1.6];
      }
      o.p = [o.p[0] + o.v[0] * DT, o.p[1] + o.v[1] * DT];
      for (const k of [0, 1]) if (o.p[k] < o.r || o.p[k] > SIZE - o.r) { o.v[k] *= -1; o.p[k] = Math.min(SIZE - o.r, Math.max(o.r, o.p[k])); }
    }
  }

  /** Ce que mesurent les capteurs : lignes [x, y, vx, vy, r, mobile, id] (sim.World.obstacles). */
  obstacles(noise = 0.0, robot = null, range = null, occl = false, drop = 0.0) {
    const R = this.nrng;
    const A = this.static.map(([x, y, r], i) => [x, y, 0, 0, r, 0, i]);
    this.dyn.forEach((o, j) => {
      const p = [o.p[0] + noise * R.n(), o.p[1] + noise * R.n()], v = [o.v[0] + noise * R.n(), o.v[1] + noise * R.n()];
      A.push([p[0], p[1], v[0], v[1], o.r, 1, 1000 + j]);
    });
    if (!robot || !A.length) return A;
    const keep = A.map(() => true);
    if (range) A.forEach((o, i) => { if (!(Math.hypot(o[0] - robot[0], o[1] - robot[1]) - o[4] < range)) keep[i] = false; });
    if (occl) {
      for (let i = 0; i < A.length; i++) {
        if (!keep[i]) continue;
        const ux0 = A[i][0] - robot[0], uy0 = A[i][1] - robot[1], L = Math.hypot(ux0, uy0);
        if (L < 1e-6) continue;
        const ux = ux0 / L, uy = uy0 / L;
        for (let k = 0; k < A.length; k++) {
          if (k === i) continue;
          const rx = A[k][0] - robot[0], ry = A[k][1] - robot[1], proj = rx * ux + ry * uy, perp = Math.abs(rx * uy - ry * ux);
          if (proj > 0 && proj < L - A[i][4] - A[k][4] && perp < 0.85 * A[k][4]) { keep[i] = false; break; }
        }
      }
    }
    if (drop) A.forEach((o, i) => { const r = R(); if (o[5] > 0 && r < drop) keep[i] = false; });
    return A.filter((_, i) => keep[i]);
  }

  /** Positions et rayons vrais de tout ce qui peut heurter le robot. */
  trueObstacles() { return [...this.static.map(([x, y, r]) => [x, y, r]), ...this.dyn.map(o => [o.p[0], o.p[1], o.r])]; }

  /** Distance libre entre le robot et l'obstacle le plus proche (négative : collision), murs compris. */
  clearance(s) {
    let c = Infinity;
    for (const [x, y, r] of this.trueObstacles()) c = Math.min(c, Math.hypot(x - s[0], y - s[1]) - r);
    c = c - R_ROB;
    return Math.min(c, s[0] - R_ROB, s[1] - R_ROB, SIZE - R_ROB - s[0], SIZE - R_ROB - s[1]);
  }

  /** État complet des personnes, pour comparer deux copies d'un même monde. */
  signature() { return this.dyn.map(o => `${o.p[0]},${o.p[1]}`).join(';'); }
}
