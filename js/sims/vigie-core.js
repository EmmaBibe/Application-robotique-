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
  // cases occupées : on prolonge le champ de façon continue (pas de falaise artificielle près des murs)
  const E = D.slice(), h2 = new Heap();
  for (let k = 0; k < E.length; k++) if (isFinite(D[k])) h2.push(D[k], k);
  while (h2.size) {
    const [d, u] = h2.pop(); if (d > E[u]) continue;
    const i = (u / NG) | 0, j = u % NG;
    for (const [di, dj, c] of NB) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NG || b >= NG) continue;
      const v = a * NG + b; if (isFinite(D[v]) || d + 2 * c >= E[v]) continue;
      E[v] = d + 2 * c; h2.push(d + 2 * c, v);
    }
  }
  let mx = 0; for (const x of E) if (isFinite(x) && x > mx) mx = x;
  for (let k = 0; k < E.length; k++) E[k] = isFinite(E[k]) ? E[k] * RES : mx * RES + 10;
  return E;
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

/** Coût d'une séquence de commandes. md (facultatif) : modèle interne de la réponse du robot ;
    gt (facultatif) : route horodatée, position voulue à chaque instant. */
function cost(s, U, P, obs, D, guide, md, gt) {
  let x = s[0], y = s[1], th = s[2], c = 0, tw = 1, nav = 0;
  let vv = md ? md.v0 : 0, ww = md ? md.w0 : 0;
  for (let t = 0; t < T; t++) {
    let v = U[2 * t], w = U[2 * t + 1];
    if (md) {
      vv += Math.max(-md.av * DT, Math.min(md.av * DT, (v - vv) * md.kv)); ww += Math.max(-md.aw * DT, Math.min(md.aw * DT, (w - ww) * md.kw));
      v = vv; w = ww;
    }
    x += DT * v * Math.cos(th); y += DT * v * Math.sin(th); th += DT * w;
    let d = Math.min(x, y, SIZE - x, SIZE - y) - R_ROB;
    const Pt = P[t];
    for (let m = 0; m < obs.length; m++) { const dx = x - Pt[m][0], dy = y - Pt[m][1], q = Math.sqrt(dx * dx + dy * dy) - obs[m][4] - R_ROB; if (q < d) d = q; }
    if (d < 0) c += 3000 * tw; else if (d < 0.6) c += 60 * (0.6 - d) * (0.6 - d) * tw;
    tw *= 0.97;
    nav = look(D, x, y); c += 0.4 * nav + 0.05 * w * w;
    if (guide) { let gd = 1e9; for (let k = 0; k < guide.length; k += 2) { const ex = x - guide[k][0], ey = y - guide[k][1], e = ex * ex + ey * ey; if (e < gd) gd = e; } c += 1.5 * gd; }
    if (gt && t < gt.length) { const ex = x - gt[t][0], ey = y - gt[t][1]; c += 2 * (ex * ex + ey * ey); }
  }
  return c + 8 * nav;
}

export class MPPI {
  constructor(seed = 0) { this.N = 160; this.rand = makeRand(seed + 99); this.name = 'MPPI'; }
  reset(stat, goal) { this.goal = goal; this.updateStatic(stat); this.U = new Float64Array(2 * T); for (let t = 0; t < T; t++) this.U[2 * t] = 0.5; }
  updateStatic(stat) { this.static = stat; this.D = dijkstra(occupancy(stat, R_ROB + 0.1), this.goal); }
  optimize(s, Unom, obs, P, guide, N, gt) {
    const R = this.rand, samples = [], J = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const U = new Float64Array(2 * T);
      for (let t = 0; t < T; t++) {
        const noise = n > 1, arc = this.arcs && n >= 2 && n < 2 + this.arcs.length ? this.arcs[n - 2] : null;
        if (arc) { U[2 * t] = arc[0]; U[2 * t + 1] = arc[1]; continue; }
        U[2 * t] = n === 1 ? 0 : Math.min(VMAX, Math.max(0, Unom[2 * t] + (noise ? R.n() * 0.5 : 0)));
        U[2 * t + 1] = n === 1 ? 0 : Math.min(WMAX, Math.max(-WMAX, Unom[2 * t + 1] + (noise ? R.n() : 0)));
      }
      samples.push(U); J[n] = cost(s, U, P, obs, this.D, guide, this.md, gt);
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
  constructor(seed = 0) {
    super(seed); this.name = 'VIGIE'; this.N = 96; this.K = 4; this.P = 8;
    // arcs de virage francs injectés parmi les tirages : MPPI seul « n'imagine » presque jamais un vrai virage
    this.arcs = [-1.6, -1.07, -0.53, 0, 0.53, 1.07, 1.6].map(w => [0.8, w]).concat([[0.3, -2], [0.3, 2]]);
  }
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
    // réensemencement : plan hérité ou plan neuf tracé vers la route, on garde le meilleur
    const Pcv = predict(obs);
    for (const m of this.modes.slice(1)) {
      const fresh = guideControls(s, m.g);
      if (cost(s, fresh, Pcv, obs, this.D, m.g) < cost(s, m.U, Pcv, obs, this.D, m.g)) m.U = fresh;
    }
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


// ------------------------------------------------------------------ VIGIE 3 : espace-temps, tubes calibrés, modèle interne
const STR = 0.35, STDT = 1 / 3, STK = 24, STS = 4, STN = Math.round(SIZE / STR);

/** A* dans l'espace-temps (x, y, t) avec contrôle continu entre deux instants ; la place réservée
    autour de chaque agent grandit avec le temps selon son imprévisibilité ua. Peut attendre sur place. */
function spacetimePlan(s, goal, obs, D, ua) {
  const nf = STK * STS + 1, dtf = STDT / STS, occ = new Uint8Array(nf * STN * STN), base = new Uint8Array(STN * STN);
  const mark = (o, px, py, rr) => {
    const i0 = Math.max(0, ((px - rr) / STR) | 0), i1 = Math.min(STN - 1, ((px + rr) / STR) | 0), j0 = Math.max(0, ((py - rr) / STR) | 0), j1 = Math.min(STN - 1, ((py + rr) / STR) | 0);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const dx = (i + 0.5) * STR - px, dy = (j + 0.5) * STR - py; if (dx * dx + dy * dy < rr * rr) o[i * STN + j] = 1; }
  };
  obs.forEach(o => { if (!o[5]) mark(base, o[0], o[1], o[4] + R_ROB + 0.3); });
  for (let i = 0; i < STN; i++) base[i] = base[(STN - 1) * STN + i] = base[i * STN] = base[i * STN + STN - 1] = 1;
  for (let q = 0; q < nf; q++) {
    const t = q * dtf, layer = occ.subarray(q * STN * STN, (q + 1) * STN * STN); layer.set(base);
    obs.forEach((o, m) => { if (o[5]) mark(layer, o[0] + o[2] * t, o[1] + o[3] * t, o[4] + R_ROB + 0.3 + (ua ? ua[m] : 0.05) * t); });
  }
  const cell = p => [Math.min(STN - 1, Math.max(0, (p[0] / STR) | 0)), Math.min(STN - 1, Math.max(0, (p[1] / STR) | 0))];
  const [si, sj] = cell(s), [gi, gj] = cell(goal);
  const H = (i, j) => look(D, (i + 0.5) * STR, (j + 0.5) * STR) / STR;
  const key = (i, j, k) => (k * STN + i) * STN + j;
  const G = new Map(), prev = new Map(), closed = new Set(), h = new Heap();
  const k0 = key(si, sj, 0); G.set(k0, 0); h.push(H(si, sj), k0);
  let best = -1, bestc = Infinity, n = 0;
  const moves = [[0, 0, 0.25]]; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (a || b) moves.push([a, b, Math.hypot(a, b)]);
  while (h.size && n < 80000) {
    const [, u] = h.pop(); if (closed.has(u)) continue; closed.add(u); n++;
    const j = u % STN, i = ((u / STN) | 0) % STN, k = (u / (STN * STN)) | 0;
    if ((i === gi && j === gj) || k === STK) {
      const c = G.get(u) + (i === gi && j === gj ? 0 : H(i, j)); if (c < bestc) { bestc = c; best = u; }
      if (i === gi && j === gj) break; continue;
    }
    for (const [di, dj, c] of moves) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= STN || b >= STN) continue;
      let ok = true;
      for (let q = 1; q <= STS && ok; q++) {
        const ci = Math.round(i + di * q / STS), cj = Math.round(j + dj * q / STS);
        if (occ[(k * STS + q) * STN * STN + ci * STN + cj] && !(k === 0 && q < 2)) ok = false;
      }
      if (!ok) continue;
      const v = key(a, b, k + 1), nd = G.get(u) + c + 0.2;
      if (nd < (G.has(v) ? G.get(v) : Infinity)) { G.set(v, nd); prev.set(v, u); h.push(nd + H(a, b), v); }
    }
  }
  if (best < 0) return null;
  const nodes = []; for (let u = best; u !== undefined; u = prev.get(u)) nodes.push(u);
  nodes.reverse();
  const pts = nodes.map(u => [(((u / STN) | 0) % STN + 0.5) * STR, (u % STN + 0.5) * STR]); pts[0] = [s[0], s[1]];
  const out = [];
  for (let q = 1; q <= Math.floor(pts.length * STDT / DT); q++) {
    const tt = q * DT / STDT, a = Math.min(pts.length - 1, Math.floor(tt)), b = Math.min(pts.length - 1, a + 1), f = tt - a;
    out.push([pts[a][0] + (pts[b][0] - pts[a][0]) * f, pts[a][1] + (pts[b][1] - pts[a][1]) * f]);
  }
  return out;
}

function timedControls(s, gt) {
  const U = new Float64Array(2 * T); let [x, y, th] = s;
  for (let t = 0; t < T; t++) {
    const q = gt[Math.min(gt.length - 1, t + 3)], d = Math.hypot(q[0] - x, q[1] - y);
    let a = Math.atan2(q[1] - y, q[0] - x) - th; a = Math.atan2(Math.sin(a), Math.cos(a));
    U[2 * t] = Math.min(VMAX, d / 0.4) * Math.max(0, Math.cos(a)); U[2 * t + 1] = Math.max(-WMAX, Math.min(WMAX, 2.5 * a));
    x += DT * U[2 * t] * Math.cos(th); y += DT * U[2 * t] * Math.sin(th); th += DT * U[2 * t + 1];
  }
  return U;
}

/** Vitesse prudente aux angles morts : derrière chaque bord d'obstacle qui cache une zone libre, on imagine
    une personne qui pourrait surgir à 1,5 m/s, et on roule assez lentement pour pouvoir s'arrêter. */
function phantomSpeed(s, obs, sense = 5) {
  const st = obs.filter(o => !o[5]); let vmax = VMAX;
  const hd = [Math.cos(s[2]), Math.sin(s[2])];
  for (const o of st) {
    const rx = o[0] - s[0], ry = o[1] - s[1], d = Math.hypot(rx, ry);
    if (d > sense + 1.5 || d < o[4] + 0.2 || (rx * hd[0] + ry * hd[1]) / d < -0.2) continue;
    const base = Math.atan2(ry, rx), half = Math.asin(Math.min(1, o[4] / d)), L = Math.sqrt(Math.max(0, d * d - o[4] * o[4]));
    for (const sg of [-1, 1]) {
      const a = base + sg * (half + 0.02), E = [s[0] + L * Math.cos(a), s[1] + L * Math.sin(a)];
      let nx = E[0] - o[0], ny = E[1] - o[1]; const nn = Math.hypot(nx, ny); nx /= nn; ny /= nn;
      const P = [E[0] + Math.cos(a) - 0.25 * nx, E[1] + Math.sin(a) - 0.25 * ny];
      if (st.some(b => Math.hypot(b[0] - P[0], b[1] - P[1]) < b[4] + 0.35)) continue;
      const blk = (Q, skip) => { const qx = Q[0] - s[0], qy = Q[1] - s[1], LQ = Math.hypot(qx, qy), ux = qx / LQ, uy = qy / LQ;
        return st.some(b => { if (b === skip) return false; const bx = b[0] - s[0], by = b[1] - s[1], pr = bx * ux + by * uy; return pr > 0 && pr < LQ - 0.05 && Math.abs(bx * uy - by * ux) < b[4] - 0.05; }); };
      if (blk(E, o) || !blk(P, null)) continue;
      const ang = Math.abs(Math.atan2((P[1] - s[1]) * hd[0] - (P[0] - s[0]) * hd[1], (P[0] - s[0]) * hd[0] + (P[1] - s[1]) * hd[1]));
      if (ang > 1.3) continue;
      const dd = Math.max(0, Math.hypot(P[0] - s[0], P[1] - s[1]) - 0.35 - R_ROB - 0.25), a2 = 0.8 * AMAX;
      vmax = Math.min(vmax, Math.max(0.15, -1.5 + Math.sqrt(2.25 + 2 * a2 * dd)));
    }
  }
  return vmax;
}

// Version expérimentale non utilisée par l'application : son modèle interne est la v1 (sans prise en compte du retard),
// dont un défaut a été mis en évidence dans le laboratoire. Voir recherche/planificateur/JOURNAL.md, séance 5.
export class Vigie3 extends Vigie {
  constructor(seed = 0) { super(seed); this.name = 'VIGIE 3'; this.K = 3; this.N = 96; this.occl = false; }
  reset(stat, goal) {
    super.reset(stat, goal);
    this.mh = []; this.md = { v0: 0, w0: 0, kv: 1, kw: 1, av: AMAX, aw: ALPHA }; this.par = [0.1, 0.1, AMAX, ALPHA]; this.last = null;
  }
  // modèle interne : on retrouve, chaque seconde, la constante de temps et l'accélération qui expliquent le mieux
  // les vitesses mesurées à partir des commandes envoyées (inspiration : le cervelet)
  identify() {
    if (this.mh.length < 25) return;
    const taus = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.55, 0.7, 0.9, 1.2], accs = [0.8, 1.2, 1.6, 2, 3];
    const best = [0, 1].map(j => {
      let bc = null, be = Infinity;
      for (const tau of taus) for (const a0 of accs) {
        const a = j ? 2 * a0 : a0; let v = this.mh[0][1][j], e = 0;
        for (let k = 0; k < this.mh.length - 1; k++) { v += Math.max(-a * DT, Math.min(a * DT, (this.mh[k][0][j] - v) * Math.min(1, DT / tau))); e += (v - this.mh[k + 1][1][j]) ** 2; }
        if (e < be) { be = e; bc = [tau, a]; }
      }
      return bc;
    });
    this.par = [best[0][0], best[1][0], best[0][1], best[1][1]];
  }
  act(t, s, obs) {
    let vm = 0, wm = 0;
    if (this.last) { const dx = s[0] - this.last[0], dy = s[1] - this.last[1]; vm = (dx * Math.cos(s[2]) + dy * Math.sin(s[2])) / DT; wm = Math.atan2(Math.sin(s[2] - this.last[2]), Math.cos(s[2] - this.last[2])) / DT; }
    this.last = [...s];
    this.md.v0 += 0.25 * (vm - this.md.v0); this.md.w0 += 0.25 * (wm - this.md.w0);
    if (this.k % 10 === 0) this.identify();
    const [tv, tw, av, aw] = this.par; Object.assign(this.md, { kv: Math.min(1, DT / tv), kw: Math.min(1, DT / tw), av, aw });
    const u = this.track(t, obs); this.u = u;
    if (this.k % 10 === 0 || !this.modes.length) {
      const guides = diverseGuides(s, this.goal, obs, this.K), old = this.modes.filter(m => !m.st && m.g);
      this.modes = guides.map(g => { let best = null, bd = 1e9; for (const m of old) { const d = guideDist(m.g, g); if (d < bd) { bd = d; best = m; } } return { g, U: best && bd < 1 ? best.U : guideControls(s, g) }; });
      if (!this.modes.length) this.modes = [{ g: null, U: this.U }];
      const gt = spacetimePlan(s, this.goal, obs, this.D, u.map(x => 0.02 + 0.3 * x));
      if (gt && gt.length > 3) this.modes.push({ g: null, gt, U: timedControls(s, gt), st: true });
    }
    this.k++;
    const Pcv = predict(obs);
    for (const m of this.modes) { if (m.st && m.gt.length > 1) m.gt = m.gt.slice(1); m.U = this.optimize(s, m.U, obs, Pcv, m.g, this.N, m.st ? m.gt : null); }
    let bi = 0, bc = Infinity;
    this.modes.forEach((m, i) => { const c = cost(s, m.U, Pcv, obs, this.D, null, this.md); if (c < bc) { bc = c; bi = i; } });
    const out = [this.modes[bi].U[0], this.modes[bi].U[1]];
    if (this.occl) out[0] = Math.min(out[0], phantomSpeed(s, obs));
    this.viz = { plans: this.modes.map(m => rollPts(s, m.U)), chosen: bi, commit: bi, reflex: 0, u, st: this.modes[bi].st };
    for (const m of this.modes) this.shift(m.U);
    this.U = this.modes[0].U;
    this.mh.push([[Math.max(0, Math.min(VMAX, out[0])), out[1]], [vm, wm]]); if (this.mh.length > 60) this.mh.shift();
    const md = this.md; md.v0 += Math.max(-md.av * DT, Math.min(md.av * DT, (out[0] - md.v0) * md.kv)); md.w0 += Math.max(-md.aw * DT, Math.min(md.aw * DT, (out[1] - md.w0) * md.kw));
    return out;
  }
}

/** Mémoire de carte commune aux deux planificateurs : les obstacles fixes vus restent connus. */
/** Prédicteur de Smith : avec un retard connu de L pas, on rejoue les commandes déjà envoyées
    pour estimer l'état présent du robot, et on avance les agents d'autant. */
export function withSmith(inner, L) {
  const cmds = []; let vm = 0, wm = 0;
  return {
    planner: inner.planner,
    reset: (a, b) => inner.reset(a, b),
    act(t, s, obs) {
      let [x, y, th] = s, vv = vm, ww = wm;
      for (const [vc, wc] of cmds) {
        vv += Math.max(-AMAX * DT, Math.min(AMAX * DT, vc - vv)); ww += Math.max(-ALPHA * DT, Math.min(ALPHA * DT, wc - ww));
        x += DT * vv * Math.cos(th); y += DT * vv * Math.sin(th); th += DT * ww;
      }
      const o = obs.map(r => r[5] ? [r[0] + r[2] * cmds.length * DT, r[1] + r[3] * cmds.length * DT, ...r.slice(2)] : r);
      const u = inner.act(t + cmds.length * DT, [x, y, th], o);
      if (cmds.length === L) { const [vc, wc] = cmds.shift(); vm += Math.max(-AMAX * DT, Math.min(AMAX * DT, vc - vm)); wm += Math.max(-ALPHA * DT, Math.min(ALPHA * DT, wc - wm)); }
      cmds.push([Math.min(VMAX, Math.max(0, u[0])), Math.min(WMAX, Math.max(-WMAX, u[1]))]);
      return u;
    },
  };
}

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


// ------------------------------------------------------------------ robot réaliste (chaîne de commande complète)
// Même modèle que recherche/planificateur/robot_reel.py : retard de la chaîne, saturation des roues,
// régulateur PI par roue sur codeur, couple limité par la vitesse et la batterie, frottements,
// masse et inertie, odométrie qui dérive recalée par le lidar, vitesses des personnes estimées.
const RW = 0.08, BW = 0.45, MASS = 25, IZ = 1.4, TMAXW = 2.3, WNL = 1.9 / 0.08, CC = 0.12, CV = 0.02, TICKS = 1024;

export class RealRobot {
  constructor(pose, R) {
    this.p = [...pose]; this.v = 0; this.w = 0; this.R = R; this.t = 0;
    this.cmd = [0, 0]; this.prev = [0, 0]; this.integ = [0, 0]; this.encAcc = [0, 0]; this.encPrev = [0, 0];
    this.est = [...pose]; this.rErr = [1 + R.n() * 0.01, 1 + R.n() * 0.01]; this.kMot = [1 + R.n() * 0.05, 1 + R.n() * 0.05];
  }
  step(vc0, wc0) {
    this.prev = this.cmd; this.cmd = [Math.min(VMAX, Math.max(0, vc0)), Math.min(WMAX, Math.max(-WMAX, wc0))];
    for (let k = 0; k < 10; k++) {
      const [vc, wc] = k < 5 ? this.prev : this.cmd;
      let wl = (vc - wc * BW / 2) / RW, wr = (vc + wc * BW / 2) / RW; const lim = VMAX / RW, kk = Math.max(1, Math.abs(wl) / lim, Math.abs(wr) / lim);
      const ref = [wl / kk, wr / kk], om = [(this.v - this.w * BW / 2) / RW, (this.v + this.w * BW / 2) / RW], F = [0, 0], omm = [0, 0];
      const batt = 1 - 0.12 * Math.min(1, this.t / 45);
      for (const j of [0, 1]) {
        this.encAcc[j] += om[j] * 0.01 * TICKS / (2 * Math.PI);
        const ticks = Math.floor(this.encAcc[j]); omm[j] = (ticks - this.encPrev[j]) * 2 * Math.PI / TICKS / 0.01; this.encPrev[j] = ticks;
        const e = ref[j] - omm[j];
        const av = TMAXW * batt * Math.max(0, Math.min(1, 1 - Math.abs(om[j]) / WNL)) * this.kMot[j];
        const tc = 1.0 * e + 1.0 * this.integ[j];             // régulateur de roue bien réglé
        let tau = Math.max(-av - 0.3, Math.min(av, tc));
        if (!(tau !== tc && Math.sign(e) === Math.sign(tc))) this.integ[j] += e * 0.01;   // anti-emballement
        tau -= CV * om[j] + CC * Math.tanh(om[j] / 0.5); F[j] = tau / RW;
      }
      this.v += (F[0] + F[1]) / MASS * 0.01; this.w += (F[1] - F[0]) * BW / 2 / IZ * 0.01;
      if (this.v < 0 && vc >= 0) this.v *= 0.5;
      const vr = this.v * (this.rErr[0] + this.rErr[1]) / 2, wr2 = this.w + (this.rErr[1] - this.rErr[0]) * this.v / BW;
      this.p = [this.p[0] + 0.01 * vr * Math.cos(this.p[2]), this.p[1] + 0.01 * vr * Math.sin(this.p[2]), this.p[2] + 0.01 * wr2];
      const dl = omm[0] * 0.01 * RW, dr = omm[1] * 0.01 * RW, vo = (dl + dr) / 2 / 0.01, wo = (dr - dl) / BW / 0.01;
      this.est = [this.est[0] + 0.01 * vo * Math.cos(this.est[2]), this.est[1] + 0.01 * vo * Math.sin(this.est[2]), this.est[2] + 0.01 * wo];
      this.t += 0.01;
    }
    this.p[2] = Math.atan2(Math.sin(this.p[2]), Math.cos(this.p[2]));
    const R = this.R, z = [this.p[0] + R.n() * 0.03, this.p[1] + R.n() * 0.03, this.p[2] + R.n() * 0.012];
    const d2 = Math.atan2(Math.sin(z[2] - this.est[2]), Math.cos(z[2] - this.est[2]));
    this.est = [this.est[0] + 0.35 * (z[0] - this.est[0]), this.est[1] + 0.35 * (z[1] - this.est[1]), Math.atan2(Math.sin(this.est[2] + 0.35 * d2), Math.cos(this.est[2] + 0.35 * d2))];
    return this.p;
  }
}

/** Suivi des personnes : filtre de Kalman à vitesse constante avec gestion des pistes. La prédiction couvre
 *  le temps réellement écoulé depuis la dernière détection (une détection manquée ne crée pas de pic de vitesse),
 *  un saut impossible relance la piste, une piste non revue depuis 1 s est effacée. Même réglage que le banc Python. */
export function makeTracker() {
  const RM = 0.05, Q = 1.5 * 1.5, V0 = 2.0, OUBLI = 1.0, PORTE = 3.5;
  const st = new Map(); let t = 0;
  const fresh = (z) => ({ x: [z[0], z[1], 0, 0], P: [[RM * RM, 0, 0, 0], [0, RM * RM, 0, 0], [0, 0, V0 * V0, 0], [0, 0, 0, V0 * V0]], t });
  return obs => {
    t += DT;
    const out = obs.map(o => {
      if (!o[5]) return o;
      let k = st.get(o[6]); const z = [o[0], o[1]];
      if (!k) k = fresh(z);
      else {
        const d = t - k.t, x = k.x, P = k.P;
        // prédiction : x = F x, P = F P Fᵀ + Q G Gᵀ (axes x et y indépendants : état (p, v) par axe)
        const xp = [x[0] + d * x[2], x[1] + d * x[3], x[2], x[3]];
        const Pp = P.map(r => r.slice());
        for (const [a, b] of [[0, 2], [1, 3]]) {
          const paa = P[a][a] + 2 * d * P[a][b] + d * d * P[b][b] + Q * d ** 4 / 4;
          const pab = P[a][b] + d * P[b][b] + Q * d ** 3 / 2, pbb = P[b][b] + Q * d * d;
          Pp[a][a] = paa; Pp[a][b] = Pp[b][a] = pab; Pp[b][b] = pbb;
        }
        const r = [z[0] - xp[0], z[1] - xp[1]];
        const sx = Pp[0][0] + RM * RM, sy = Pp[1][1] + RM * RM;
        if ((r[0] * r[0] / sx + r[1] * r[1] / sy > PORTE * PORTE) && Math.hypot(r[0], r[1]) > 0.5) k = fresh(z);
        else {
          for (const [a, b, sa, ra] of [[0, 2, sx, r[0]], [1, 3, sy, r[1]]]) {
            const ka = Pp[a][a] / sa, kb = Pp[b][a] / sa;
            xp[a] += ka * ra; xp[b] += kb * ra;
            const paa = (1 - ka) * Pp[a][a], pab = (1 - ka) * Pp[a][b], pbb = Pp[b][b] - kb * Pp[a][b];
            Pp[a][a] = paa; Pp[a][b] = Pp[b][a] = pab; Pp[b][b] = pbb;
          }
          k = { x: xp, P: Pp, t };
        }
      }
      k.t = t; st.set(o[6], k);
      return [k.x[0], k.x[1], k.x[2], k.x[3], o[4], o[5], o[6]];
    });
    for (const [id, k] of st) if (t - k.t > OUBLI) st.delete(id);
    return out;
  };
}

/** Un épisode complet, sans dessin (utilisé par les tests et par le mode « course »). */
export function createEpisode(scene, seed, Planner, cond = {}) {
  const w = makeWorld(scene, seed), R = makeRand(seed * 31 + 5);
  const lat = (cond.latence ? 2 : 0) + (cond.reel ? 1 : 0);
  const mem = withMemory(new Planner(seed));
  if (cond.perception && mem.planner) mem.planner.occl = true;
  const pl = lat && (Planner === Vigie || Planner === Vigie3) ? withSmith(mem, lat) : mem;
  let s = [...w.start], v = 0, om = 0, t = 0, outcome = null, minc = Infinity; const path = [[s[0], s[1]]], queue = [];
  const gv = cond.glissement ? R.u(0.75, 1.15) : 1, gw = cond.glissement ? R.u(0.75, 1.2) : 1, bw = cond.glissement ? R.u(-0.12, 0.12) : 0;
  const known = cond.carte ? w.static.filter(([x, y, r]) => Math.hypot(x - s[0], y - s[1]) - r < 6) : w.static;
  const robot = cond.reel ? new RealRobot(s, makeRand(seed * 7 + 777)) : null, track = cond.reel ? makeTracker() : null;
  pl.reset(known, w.goal);
  return {
    world: w, planner: pl.planner, path,
    get t() { return t; }, get s() { return s; }, get outcome() { return outcome; }, get minClear() { return minc; },
    step() {
      if (outcome) return outcome;
      let meas, obs = observe(w, s, cond, R);
      if (robot) { meas = [...robot.est]; obs = track(obs); } else meas = [s[0] + R.n() * 0.03, s[1] + R.n() * 0.03, s[2] + R.n() * 0.02];
      if (lat) { queue.push([meas, obs]); [meas, obs] = queue[0]; if (queue.length > lat) queue.shift(); }
      let [vc, wc] = pl.act(t, meas, obs);
      vc = Math.min(VMAX, Math.max(0, vc)); wc = Math.min(WMAX, Math.max(-WMAX, wc));
      if (robot) {
        if (cond.glissement) { vc *= gv; wc = wc * gw + (vc > 0.05 ? bw : 0); }
        s = [...robot.step(vc, wc)]; v = robot.v; om = robot.w;
      } else {
        v += Math.max(-AMAX * DT, Math.min(AMAX * DT, vc - v)); om += Math.max(-ALPHA * DT, Math.min(ALPHA * DT, wc - om));
        const va = v * (1 + R.n() * 0.05) * gv, wa = (om + R.n() * 0.05) * gw + (Math.abs(v) > 0.05 ? bw : 0);
        s = [s[0] + DT * va * Math.cos(s[2]), s[1] + DT * va * Math.sin(s[2]), Math.atan2(Math.sin(s[2] + DT * wa), Math.cos(s[2] + DT * wa))];
      }
      stepWorld(w, t, s, cond.reactifs); t += DT; path.push([s[0], s[1]]);
      const c = clearance(w, s); minc = Math.min(minc, c);
      if (c < 0) outcome = 'collision'; else if (Math.hypot(s[0] - w.goal[0], s[1] - w.goal[1]) < 0.5) outcome = 'succes'; else if (t >= 45) outcome = 'temps';
      return outcome;
    },
  };
}
