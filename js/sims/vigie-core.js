// VIGIE : planificateur de trajectoire mis au point dans le laboratoire de recherche de RoboMaster.
// Ce fichier ne touche pas à l'écran : il contient le monde simulé, MPPI (la référence) et VIGIE.
// La version de référence, avec le banc d'essai complet, est dans recherche/planificateur/.

export const DT = 0.1, R_ROB = 0.3, VMAX = 1.5, WMAX = 2.0, AMAX = 2.0, ALPHA = 4.0, SIZE = 20;
const RES = 0.25, NG = 80;

export function makeRand(seed) {
  let a = seed >>> 0 || 1;
  const rand = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  rand.n = () => { let u = 0; while (!u) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };
  rand.u = (a1, b1) => a1 + (b1 - a1) * rand();
  return rand;
}

// ------------------------------------------------------------------ monde
export const SCENES = {
  foule: 'Foule errante', foule_dense: 'Foule dense', carrefour_rapide: 'Carrefour rapide', couloir: 'Couloir étroit', foret: 'Forêt d\'obstacles',
};

export function makeWorld(scene, seed) {
  for (let k = 0; k < 40; k++) {
    const w = build(scene, seed + 7919 * k);
    if (astar(occupancy(w.static, 0.35), w.start, w.goal)) return w;
  }
  return build(scene, seed);
}

function build(scene, seed) {
  const R = makeRand(seed);
  const w = { scene, seed, static: [], dyn: [], start: [1.5, 10, 0], goal: [18.5, 10], keep: [], rand: R };
  const free = (x, y, r, m = 1.6) => Math.hypot(x - w.start[0], y - w.start[1]) > m + r && Math.hypot(x - w.goal[0], y - w.goal[1]) > m + r
    && w.static.every(([a, b, c]) => Math.hypot(x - a, y - b) > r + c + 0.15) && w.keep.every(([a, b]) => Math.hypot(x - a, y - b) > r + 1.4);
  const addStatic = (n, box = [3, 17, 1, 19], rmin = 0.4, rmax = 1.0) => {
    let guard = 0;
    while (n > 0 && guard++ < 5000) { const r = R.u(rmin, rmax), x = R.u(box[0], box[1]), y = R.u(box[2], box[3]); if (free(x, y, r)) { w.static.push([x, y, r]); n--; } }
  };
  const modes = ['tout_droit', 'gauche', 'droite', 'arret', 'accel'], mp = [0.3, 0.2, 0.2, 0.15, 0.15];
  const pick = () => { let u = R(), i = 0; while (u > mp[i] && i < 4) { u -= mp[i]; i++; } return modes[i]; };
  const addDyn = (p, v, r = 0.35, kind = 'intent') => w.dyn.push({ p: [...p], v: [...v], r, kind, mode: pick(), tSwitch: R.u(1, 12), done: false, reactif: R() < 0.7 });
  const crowd = (n, smin, smax) => {
    for (let i = 0; i < n; i++) {
      let x, y, g = 0; do { x = R.u(3, 17); y = R.u(1, 19); } while (!free(x, y, 0.35, 2.5) && g++ < 200);
      const a = R.u(0, 2 * Math.PI), s = R.u(smin, smax); addDyn([x, y], [s * Math.cos(a), s * Math.sin(a)], 0.35, 'errant');
    }
  };
  if (scene === 'foret') addStatic(30);
  else if (scene === 'foule') { addStatic(8); crowd(16, 0.4, 1.1); }
  else if (scene === 'foule_dense') { addStatic(5); crowd(26, 0.6, 1.4); }
  else if (scene === 'carrefour_rapide') {
    addStatic(4);
    for (let i = 0; i < 14; i++) {
      const x = R.u(4, 16), s = R.u(1.0, 1.8);
      if (i % 2) addDyn([x, R.u(0.5, 6)], [R.u(-0.3, 0.3), s]); else addDyn([x, R.u(14, 19.5)], [R.u(-0.3, 0.3), -s]);
    }
  } else if (scene === 'couloir') {
    const gap = R.u(7, 13);
    for (let y = 0.4; y < SIZE; y += 0.8) if (Math.abs(y - gap) > 1.1) w.static.push([10, y, 0.45]);
    w.keep = [[10, gap], [8.5, gap], [11.5, gap]];
    addStatic(8);
    addDyn([14, gap + R.u(-1, 1)], [-R.u(0.5, 0.9), 0], 0.4);
    for (let i = 0; i < 3; i++) addDyn([R.u(4, 16), R.u(1, 19)], [R.u(-0.8, 0.8), R.u(-0.8, 0.8)]);
  }
  return w;
}

export function stepWorld(w, t, robot, react) {
  const R = w.rand;
  for (const o of w.dyn) {
    if (react && o.reactif) {
      const dx = o.p[0] - robot[0], dy = o.p[1] - robot[1], n = Math.hypot(dx, dy);
      if (n > 1e-6 && n < 2) { o.v[0] += DT * 1.5 * dx / n * (2 - n); o.v[1] += DT * 1.5 * dy / n * (2 - n); const s = Math.hypot(...o.v); if (s > 1.8) { o.v[0] *= 1.8 / s; o.v[1] *= 1.8 / s; } }
    }
    if (o.kind === 'errant') {
      if (R() < 0.03) { const a = Math.atan2(o.v[1], o.v[0]) + R.n() * 1.2, s = Math.min(1.2, Math.max(0.2, Math.hypot(...o.v) + R.n() * 0.2)); o.v = [s * Math.cos(a), s * Math.sin(a)]; }
    } else if (!o.done && t >= o.tSwitch) {
      o.done = true; const [vx, vy] = o.v;
      if (o.mode === 'gauche') o.v = [-vy, vx]; else if (o.mode === 'droite') o.v = [vy, -vx];
      else if (o.mode === 'arret') o.v = [0, 0]; else if (o.mode === 'accel') o.v = [vx * 1.6, vy * 1.6];
    }
    o.p[0] += o.v[0] * DT; o.p[1] += o.v[1] * DT;
    for (const k of [0, 1]) if (o.p[k] < o.r || o.p[k] > SIZE - o.r) { o.v[k] *= -1; o.p[k] = Math.min(SIZE - o.r, Math.max(o.r, o.p[k])); }
  }
}

/** Ce que voient les capteurs : [x, y, vx, vy, r, mobile, id]. */
export function observe(w, robot, cond, R) {
  const A = w.static.map(([x, y, r], i) => [x, y, 0, 0, r, 0, i]);
  w.dyn.forEach((o, j) => A.push([o.p[0] + R.n() * 0.05, o.p[1] + R.n() * 0.05, o.v[0] + R.n() * 0.05, o.v[1] + R.n() * 0.05, o.r, 1, 1000 + j]));
  if (!cond.perception) return A;
  return A.filter((o, i) => {
    const dx = o[0] - robot[0], dy = o[1] - robot[1], L = Math.hypot(dx, dy);
    if (L - o[4] > 5) return false;
    if (o[5] && R() < 0.1) return false;
    const ux = dx / L, uy = dy / L;
    return !A.some((b, k) => {
      if (k === i) return false;
      const rx = b[0] - robot[0], ry = b[1] - robot[1], pr = rx * ux + ry * uy;
      return pr > 0 && pr < L - o[4] - b[4] && Math.abs(rx * uy - ry * ux) < 0.85 * b[4];
    });
  });
}

/** Distance libre entre le robot et l'obstacle le plus proche (négative = collision). */
export function clearance(w, s) {
  let c = Math.min(s[0], s[1], SIZE - s[0], SIZE - s[1]) - R_ROB;
  for (const [x, y, r] of w.static) c = Math.min(c, Math.hypot(s[0] - x, s[1] - y) - r - R_ROB);
  for (const o of w.dyn) c = Math.min(c, Math.hypot(s[0] - o.p[0], s[1] - o.p[1]) - o.r - R_ROB);
  return c;
}

// ------------------------------------------------------------------ grille, Dijkstra, A*
function occupancy(circles, margin) {
  const occ = new Uint8Array(NG * NG);
  for (const [x, y, r] of circles) {
    const R2 = (r + margin) ** 2, i0 = Math.max(0, Math.floor((x - r - margin) / RES)), i1 = Math.min(NG - 1, Math.ceil((x + r + margin) / RES));
    const j0 = Math.max(0, Math.floor((y - r - margin) / RES)), j1 = Math.min(NG - 1, Math.ceil((y + r + margin) / RES));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const cx = (i + 0.5) * RES - x, cy = (j + 0.5) * RES - y; if (cx * cx + cy * cy < R2) occ[i * NG + j] = 1; }
  }
  const m = Math.max(1, Math.ceil(margin / RES));
  for (let i = 0; i < NG; i++) for (let k = 0; k < m; k++) { occ[i * NG + k] = occ[i * NG + NG - 1 - k] = occ[k * NG + i] = occ[(NG - 1 - k) * NG + i] = 1; }
  return occ;
}
const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
const cellOf = p => [Math.min(NG - 1, Math.max(0, Math.floor(p[0] / RES))), Math.min(NG - 1, Math.max(0, Math.floor(p[1] / RES)))];

class Heap {
  constructor() { this.a = []; }
  push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top;
  }
  get size() { return this.a.length; }
}

function dijkstra(occ, goal) {
  const D = new Float64Array(NG * NG).fill(Infinity), [gi, gj] = cellOf(goal), h = new Heap();
  D[gi * NG + gj] = 0; h.push(0, gi * NG + gj);
  while (h.size) {
    const [d, u] = h.pop(); if (d > D[u]) continue;
    const i = (u / NG) | 0, j = u % NG;
    for (const [di, dj, c] of NB) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NG || b >= NG) continue;
      const v = a * NG + b; if (occ[v] || d + c >= D[v]) continue;
      D[v] = d + c; h.push(d + c, v);
    }
  }
  let mx = 0; for (const x of D) if (isFinite(x) && x > mx) mx = x;
  for (let k = 0; k < D.length; k++) D[k] = isFinite(D[k]) ? D[k] * RES : mx * RES + 10;
  return D;
}

function astar(occ, start, goal, extra) {
  const [si, sj] = cellOf(start), [gi, gj] = cellOf(goal), s = si * NG + sj, g = gi * NG + gj;
  const occ2 = occ.slice();
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const a = si + di, b = sj + dj; if (a >= 0 && b >= 0 && a < NG && b < NG) occ2[a * NG + b] = 0; }
  const G = new Float64Array(NG * NG).fill(Infinity), prev = new Int32Array(NG * NG).fill(-1), closed = new Uint8Array(NG * NG), h = new Heap();
  G[s] = 0; h.push(0, s);
  while (h.size) {
    const [, u] = h.pop(); if (closed[u]) continue; closed[u] = 1; if (u === g) break;
    const i = (u / NG) | 0, j = u % NG;
    for (const [di, dj, c] of NB) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NG || b >= NG) continue;
      const v = a * NG + b; if (occ2[v]) continue;
      const nd = G[u] + c + (extra ? extra[v] : 0);
      if (nd < G[v]) { G[v] = nd; prev[v] = u; h.push(nd + Math.hypot(a - gi, b - gj), v); }
    }
  }
  if (!closed[g]) return null;
  const path = []; for (let u = g; u !== -1; u = prev[u]) path.push([((u / NG | 0) + 0.5) * RES, (u % NG + 0.5) * RES]);
  path.reverse(); path[path.length - 1] = [goal[0], goal[1]];
  return path;
}

const look = (D, x, y) => D[Math.min(NG - 1, Math.max(0, (x / RES) | 0)) * NG + Math.min(NG - 1, Math.max(0, (y / RES) | 0))];

// ------------------------------------------------------------------ MPPI (référence)
const T = 25;
const SCEN = [[0, 1], [Math.PI / 2, 1], [-Math.PI / 2, 1], [0, 0], [0, 1.6]], SW = [0.4, 0.15, 0.15, 0.15, 0.15];

/** Positions prédites : tableau [T][M] de [x, y]. u : imprévisibilité de chaque agent (ou null). */
function predict(obs, scen, u) {
  const P = []; const [ang, k] = scen || [0, 1];
  const pos = obs.map(o => [o[0], o[1]]);
  for (let t = 1; t <= T; t++) {
    const tt = t * DT, row = [];
    for (let m = 0; m < obs.length; m++) {
      const o = obs[m];
      if (o[5] && scen && (ang || k !== 1)) {
        const um = u ? u[m] : 1, a = ang * um * Math.min(1, tt / 2), f = 1 + (k - 1) * um * Math.min(1, tt);
        const c = Math.cos(a), s = Math.sin(a);
        pos[m][0] += DT * f * (c * o[2] - s * o[3]); pos[m][1] += DT * f * (s * o[2] + c * o[3]);
      } else if (o[5]) { pos[m][0] += DT * o[2]; pos[m][1] += DT * o[3]; }
      row.push([pos[m][0], pos[m][1]]);
    }
    P.push(row);
  }
  return P;
}

function cost(s, U, P, obs, D, guide) {
  let x = s[0], y = s[1], th = s[2], c = 0, tw = 1, nav = 0;
  for (let t = 0; t < T; t++) {
    const v = U[2 * t], w = U[2 * t + 1];
    x += DT * v * Math.cos(th); y += DT * v * Math.sin(th); th += DT * w;
    let d = Math.min(x, y, SIZE - x, SIZE - y) - R_ROB;
    const Pt = P[t];
    for (let m = 0; m < obs.length; m++) { const dx = x - Pt[m][0], dy = y - Pt[m][1], q = Math.sqrt(dx * dx + dy * dy) - obs[m][4] - R_ROB; if (q < d) d = q; }
    if (d < 0) c += 3000 * tw; else if (d < 0.6) c += 60 * (0.6 - d) * (0.6 - d) * tw;
    tw *= 0.97;
    nav = look(D, x, y); c += 0.4 * nav + 0.05 * w * w;
    if (guide) { let gd = 1e9; for (let k = 0; k < guide.length; k += 2) { const ex = x - guide[k][0], ey = y - guide[k][1], e = ex * ex + ey * ey; if (e < gd) gd = e; } c += 1.5 * gd; }
  }
  return c + 8 * nav;
}

export class MPPI {
  constructor(seed = 0) { this.N = 160; this.rand = makeRand(seed + 99); this.name = 'MPPI'; }
  reset(stat, goal) { this.goal = goal; this.updateStatic(stat); this.U = new Float64Array(2 * T); for (let t = 0; t < T; t++) this.U[2 * t] = 0.5; }
  updateStatic(stat) { this.static = stat; this.D = dijkstra(occupancy(stat, R_ROB + 0.1), this.goal); }
  optimize(s, Unom, obs, P, guide, N) {
    const R = this.rand, samples = [], J = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const U = new Float64Array(2 * T);
      for (let t = 0; t < T; t++) {
        const noise = n > 1;
        U[2 * t] = n === 1 ? 0 : Math.min(VMAX, Math.max(0, Unom[2 * t] + (noise ? R.n() * 0.5 : 0)));
        U[2 * t + 1] = n === 1 ? 0 : Math.min(WMAX, Math.max(-WMAX, Unom[2 * t + 1] + (noise ? R.n() : 0)));
      }
      samples.push(U); J[n] = cost(s, U, P, obs, this.D, guide);
    }
    let mn = Infinity; for (const j of J) mn = Math.min(mn, j);
    const sorted = Float64Array.from(J).sort(), lam = Math.max(1e-6, (sorted[Math.floor(N * 0.1)] - mn) / 2);
    const out = new Float64Array(2 * T); let ws = 0;
    for (let n = 0; n < N; n++) { const wgt = Math.exp(-(J[n] - mn) / lam); ws += wgt; for (let k = 0; k < 2 * T; k++) out[k] += wgt * samples[n][k]; }
    for (let k = 0; k < 2 * T; k++) out[k] /= ws;
    return out;
  }
  shift(U) { U.copyWithin(0, 2); U[2 * T - 2] = U[2 * T - 4]; U[2 * T - 1] = U[2 * T - 3]; }
  act(t, s, obs) {
    this.U = this.optimize(s, this.U, obs, predict(obs), null, this.N);
    const u = [this.U[0], this.U[1]]; this.shift(this.U); this.viz = { plan: rollPts(s, this.U) };
    return u;
  }
}

function rollPts(s, U, n = T) {
  let [x, y, th] = s; const pts = [];
  for (let t = 0; t < n; t++) { x += DT * U[2 * t] * Math.cos(th); y += DT * U[2 * t] * Math.sin(th); th += DT * U[2 * t + 1]; pts.push([x, y]); }
  return pts;
}

// ------------------------------------------------------------------ VIGIE
function diverseGuides(s, goal, obs, K) {
  const occ = occupancy(obs.map(o => [o[0], o[1], o[4] + (o[5] ? 0.2 : 0)]), R_ROB + 0.1);
  const extra = new Float64Array(NG * NG), guides = [];
  for (let it = 0; it < K + 2 && guides.length < K; it++) {
    const p = astar(occ, s, goal, extra); if (!p) break;
    const far = guides.every(g => { let tot = 0; for (const a of p) { let b = 1e9; for (const q of g) b = Math.min(b, Math.hypot(a[0] - q[0], a[1] - q[1])); tot += b; } return tot / p.length > 0.8; });
    if (far) guides.push(p);
    for (let k = 0; k < p.length; k += 2) {
      const q = p[k];
      if (Math.hypot(q[0] - s[0], q[1] - s[1]) < 1.2 || Math.hypot(q[0] - goal[0], q[1] - goal[1]) < 1.2) continue;
      const i0 = Math.max(0, ((q[0] - 1.8) / RES) | 0), i1 = Math.min(NG - 1, ((q[0] + 1.8) / RES) | 0), j0 = Math.max(0, ((q[1] - 1.8) / RES) | 0), j1 = Math.min(NG - 1, ((q[1] + 1.8) / RES) | 0);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const dx = (i + 0.5) * RES - q[0], dy = (j + 0.5) * RES - q[1]; extra[i * NG + j] += 6 * Math.exp(-(dx * dx + dy * dy) / 0.72); }
    }
  }
  return guides;
}

function guideControls(s, g) {
  const U = new Float64Array(2 * T); let [x, y, th] = s;
  for (let t = 0; t < T; t++) {
    let bi = 0, bd = 1e9; g.forEach((q, i) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; bi = i; } });
    const q = g[Math.min(g.length - 1, bi + 4)];
    let a = Math.atan2(q[1] - y, q[0] - x) - th; a = Math.atan2(Math.sin(a), Math.cos(a));
    U[2 * t] = VMAX * 0.8 * Math.max(0.1, Math.cos(a)); U[2 * t + 1] = Math.max(-WMAX, Math.min(WMAX, 2.5 * a));
    x += DT * U[2 * t] * Math.cos(th); y += DT * U[2 * t] * Math.sin(th); th += DT * U[2 * t + 1];
  }
  return U;
}

const guideDist = (a, b) => { let tot = 0; for (const p of a) { let m = 1e9; for (const q of b) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])); tot += m; } return tot / a.length; };

export class Vigie extends MPPI {
  constructor(seed = 0) { super(seed); this.name = 'VIGIE'; this.N = 96; this.K = 3; this.P = 8; }
  reset(stat, goal) { super.reset(stat, goal); this.hist = new Map(); this.err = new Map(); this.modes = []; this.k = 0; this.commit = 0; this.vlast = 0; this.wlast = 0; this.switches = 0; this.reflexes = 0; }

  // I : imprévisibilité mesurée en ligne pour chaque agent. On compare seulement des mesures séparées
  // d'environ une seconde : un agent qui disparaît puis réapparaît ne doit pas paraître imprévisible.
  track(t, obs) {
    for (const o of obs) {
      if (!o[5]) continue;
      const h = this.hist.get(o[6]) || []; h.push([t, o[0], o[1], o[2], o[3]]);
      while (h.length && t - h[0][0] > 1.15) h.shift();
      this.hist.set(o[6], h);
      const q = h[0];
      if (Math.abs(t - q[0] - 1) <= 0.15) {
        const dt = t - q[0], e = Math.hypot(o[0] - (q[1] + q[3] * dt), o[1] - (q[2] + q[4] * dt)), pe = this.err.get(o[6]);
        this.err.set(o[6], pe === undefined ? e : 0.85 * pe + 0.15 * e);
      }
    }
    return obs.map(o => !o[5] ? 0 : this.err.has(o[6]) ? Math.min(1, Math.max(0, (this.err.get(o[6]) - 0.08) / 0.45)) : 0.3);
  }

  updateStatic(stat) { super.updateStatic(stat); this.commit = 0; this.k = 0; }

  refresh(s, obs) {
    const guides = diverseGuides(s, this.goal, obs, this.K);
    const base = this.modes[0] || { g: null, U: this.U };
    const old = this.modes.slice(1), cg = this.commit > 0 && this.modes[this.commit] ? this.modes[this.commit].g : null;
    const nm = [base]; let nc = 0;
    for (const g of guides.slice(0, this.K - 1)) {
      let best = null, bd = 1e9; for (const m of old) { const d = guideDist(m.g, g); if (d < bd) { bd = d; best = m; } }
      nm.push({ g, U: best && bd < 1 ? best.U : guideControls(s, g) });
      if (cg && guideDist(cg, g) < 1) nc = nm.length - 1;
    }
    this.modes = nm; this.commit = nc;
  }

  act(t, s, obs) {
    const u = this.track(t, obs); this.u = u;
    if (this.k % 10 === 0 || !this.modes.length) this.refresh(s, obs);
    this.k++;
    const Pcv = predict(obs);
    for (const m of this.modes) m.U = this.optimize(s, m.U, obs, Pcv, m.g, this.N);
    const K = this.modes.length, P = this.P;
    // G : options = début de chaque plan + gestes réflexes (freiner, esquiver à gauche, à droite)
    const pref = this.modes.map(m => m.U.slice(0, 2 * P)), kinds = this.modes.map((_, i) => i);
    const reflex = (v, w) => { const a = new Float64Array(2 * P); for (let k = 0; k < P; k++) { a[2 * k] = v; a[2 * k + 1] = w; } return a; };
    pref.push(reflex(0, this.wlast), reflex(0.6 * this.vlast, 1.6), reflex(0.6 * this.vlast, -1.6)); kinds.push(-1, -2, -3);
    // V : valeur d'option = moyenne, sur les futurs possibles, du meilleur plan qui reste disponible
    const Ps = SCEN.map(sc => predict(obs, sc, u));
    const V = pref.map(pr => {
      let val = 0;
      SCEN.forEach((_, si) => {
        let best = Infinity;
        for (let k = 0; k < K; k++) {
          const seq = new Float64Array(2 * T); seq.set(pr); seq.set(this.modes[k].U.subarray(2 * P), 2 * P);
          best = Math.min(best, cost(s, seq, Ps[si], obs, this.D, null));
        }
        val += SW[si] * best;
      });
      return val;
    });
    // un réflexe n'est permis que si tous les plans sont menacés
    if (Math.min(...V.slice(0, K)) < 0.25 * 3000) for (let i = K; i < V.length; i++) V[i] = Infinity;
    // I : inertie d'engagement, changer de route a un prix
    for (let i = 0; i < K; i++) if (i !== this.commit) V[i] += 0.04 * Math.abs(V[this.commit]) + 2;
    let bi = 0; V.forEach((v, i) => { if (v < V[bi]) bi = i; });
    if (kinds[bi] >= 0) { if (kinds[bi] !== this.commit) this.switches++; this.commit = kinds[bi]; } else this.reflexes++;
    const out = [pref[bi][0], pref[bi][1]];
    this.viz = { plans: this.modes.map(m => rollPts(s, m.U)), chosen: bi, commit: this.commit, reflex: kinds[bi] < 0 ? kinds[bi] : 0, u, options: pref.map(pr => rollPts(s, pr, P)) };
    for (const m of this.modes) this.shift(m.U);
    this.U = this.modes[0].U;
    this.vlast = Math.max(0, Math.min(VMAX, out[0])); this.wlast = out[1];
    return out;
  }
}

/** Mémoire de carte commune aux deux planificateurs : les obstacles fixes vus restent connus. */
export function withMemory(planner) {
  const known = new Map(); let dirty = 0, k = 0;
  return {
    planner,
    reset(stat, goal) { known.clear(); stat.forEach(([x, y, r], i) => known.set(`${x.toFixed(1)},${y.toFixed(1)}`, [x, y, 0, 0, r, 0, i])); planner.reset(stat, goal); dirty = 0; k = 0; },
    act(t, s, obs) {
      k++;
      for (const o of obs) if (!o[5]) { const key = `${o[0].toFixed(1)},${o[1].toFixed(1)}`; if (!known.has(key)) { known.set(key, o); dirty++; } }
      if (dirty && k % 5 === 0) { planner.updateStatic([...known.values()].map(o => [o[0], o[1], o[4]])); dirty = 0; }
      return planner.act(t, s, [...known.values(), ...obs.filter(o => o[5])]);
    },
  };
}

/** Un épisode complet, sans dessin (utilisé par les tests et par le mode « course »). */
export function createEpisode(scene, seed, Planner, cond = {}) {
  const w = makeWorld(scene, seed), R = makeRand(seed * 31 + 5), pl = withMemory(new Planner(seed));
  let s = [...w.start], v = 0, om = 0, t = 0, outcome = null, minc = Infinity; const path = [[s[0], s[1]]], queue = [];
  const gv = cond.glissement ? R.u(0.75, 1.15) : 1, gw = cond.glissement ? R.u(0.75, 1.2) : 1, bw = cond.glissement ? R.u(-0.12, 0.12) : 0;
  const known = cond.carte ? w.static.filter(([x, y, r]) => Math.hypot(x - s[0], y - s[1]) - r < 6) : w.static;
  pl.reset(known, w.goal);
  return {
    world: w, planner: pl.planner, path,
    get t() { return t; }, get s() { return s; }, get outcome() { return outcome; }, get minClear() { return minc; },
    step() {
      if (outcome) return outcome;
      let meas = [s[0] + R.n() * 0.03, s[1] + R.n() * 0.03, s[2] + R.n() * 0.02], obs = observe(w, s, cond, R);
      if (cond.latence) { queue.push([meas, obs]); [meas, obs] = queue[0]; if (queue.length > 2) queue.shift(); }
      let [vc, wc] = pl.act(t, meas, obs);
      vc = Math.min(VMAX, Math.max(0, vc)); wc = Math.min(WMAX, Math.max(-WMAX, wc));
      v += Math.max(-AMAX * DT, Math.min(AMAX * DT, vc - v)); om += Math.max(-ALPHA * DT, Math.min(ALPHA * DT, wc - om));
      const va = v * (1 + R.n() * 0.05) * gv, wa = (om + R.n() * 0.05) * gw + (Math.abs(v) > 0.05 ? bw : 0);
      s = [s[0] + DT * va * Math.cos(s[2]), s[1] + DT * va * Math.sin(s[2]), Math.atan2(Math.sin(s[2] + DT * wa), Math.cos(s[2] + DT * wa))];
      stepWorld(w, t, s, cond.reactifs); t += DT; path.push([s[0], s[1]]);
      const c = clearance(w, s); minc = Math.min(minc, c);
      if (c < 0) outcome = 'collision'; else if (Math.hypot(s[0] - w.goal[0], s[1] - w.goal[1]) < 0.5) outcome = 'succes'; else if (t >= 45) outcome = 'temps';
      return outcome;
    },
  };
}
