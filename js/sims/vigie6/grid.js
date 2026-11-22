// Grille d'occupation, Dijkstra et A*, portés ligne à ligne depuis recherche/planificateur/planners.py.
// Deux détails comptent pour retrouver exactement les mêmes chemins que le banc Python :
//  - la file de priorité départage les égalités comme les tuples Python (coût, puis coordonnées) ;
//  - les conversions en indice tronquent vers zéro, comme int() en Python.

import { SIZE } from '../vigie-core.js';

export const RES = 0.25;
export const NG = Math.trunc(SIZE / RES);
export const XS = Float64Array.from({ length: NG }, (_, k) => (k + 0.5) * RES);

/** File de priorité dont les éléments sont des tableaux comparés dans l'ordre lexicographique. */
export class LexHeap {
  constructor() { this.a = []; }
  static less(x, y) {
    for (let k = 0; k < x.length; k++) { if (x[k] < y[k]) return true; if (x[k] > y[k]) return false; }
    return false;
  }
  push(e) {
    const a = this.a; a.push(e); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (!LexHeap.less(a[i], a[p])) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && LexHeap.less(a[l], a[m])) m = l;
        if (r < a.length && LexHeap.less(a[r], a[m])) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

/** circles : liste de [x, y, r]. Renvoie un Uint8Array NG*NG, indice i*NG + j (i selon x, j selon y). */
export function occupancy(circles, margin) {
  const occ = new Uint8Array(NG * NG);
  for (const [x, y, r] of circles) {
    const R = r + margin, R2 = R * R;
    for (let i = 0; i < NG; i++) {
      const dx = XS[i] - x, dx2 = dx * dx; if (dx2 >= R2) continue;
      for (let j = 0; j < NG; j++) { const dy = XS[j] - y; if (dx2 + dy * dy < R2) occ[i * NG + j] = 1; }
    }
  }
  const m = Math.max(1, Math.ceil(margin / RES));
  for (let k = 0; k < m; k++) for (let q = 0; q < NG; q++) {
    occ[k * NG + q] = occ[(NG - 1 - k) * NG + q] = occ[q * NG + k] = occ[q * NG + NG - 1 - k] = 1;
  }
  return occ;
}

export const cell = p => [Math.trunc(Math.min(NG - 1, Math.max(0, p[0] / RES))), Math.trunc(Math.min(NG - 1, Math.max(0, p[1] / RES)))];
const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];

/** Champ de distance au but (en mètres), prolongé de façon continue dans les cases occupées. */
export function dijkstra(occ, goal) {
  const D = new Float64Array(NG * NG).fill(Infinity), [gi, gj] = cell(goal), h = new LexHeap();
  D[gi * NG + gj] = 0; h.push([0, gi, gj]);
  while (h.size) {
    const [d, i, j] = h.pop(); if (d > D[i * NG + j]) continue;
    for (const [di, dj, c] of NB) {
      const a = i + di, b = j + dj;
      if (a >= 0 && a < NG && b >= 0 && b < NG && !occ[a * NG + b] && d + c < D[a * NG + b]) { D[a * NG + b] = d + c; h.push([d + c, a, b]); }
    }
  }
  const E = D.slice(), h2 = new LexHeap();
  for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) if (isFinite(D[i * NG + j])) h2.push([D[i * NG + j], i, j]);
  while (h2.size) {
    const [d, i, j] = h2.pop(); if (d > E[i * NG + j]) continue;
    for (const [di, dj, c] of NB) {
      const a = i + di, b = j + dj;
      if (a >= 0 && a < NG && b >= 0 && b < NG && !isFinite(D[a * NG + b]) && d + 2 * c < E[a * NG + b]) { E[a * NG + b] = d + 2 * c; h2.push([d + 2 * c, a, b]); }
    }
  }
  let mx = -Infinity; for (const v of E) if (isFinite(v) && v > mx) mx = v;
  for (let k = 0; k < E.length; k++) E[k] = (isFinite(E[k]) ? E[k] : mx + 10) * RES;
  return E;
}

/** A* sur la grille ; extra : coût ajouté par case (Float64Array) ou null. Renvoie une liste de [x, y] ou null. */
export function astar(occ0, start, goal, extra = null) {
  const [si, sj] = cell(start), [gi, gj] = cell(goal);
  const occ = occ0.slice();
  for (let a = Math.max(0, si - 1); a < Math.min(NG, si + 2); a++) for (let b = Math.max(0, sj - 1); b < Math.min(NG, sj + 2); b++) occ[a * NG + b] = 0;
  const G = new Float64Array(NG * NG).fill(Infinity), prev = new Int32Array(NG * NG).fill(-1), closed = new Uint8Array(NG * NG), h = new LexHeap();
  G[si * NG + sj] = 0; h.push([0, si, sj]);
  let found = false;
  while (h.size) {
    const [, i, j] = h.pop(), u = i * NG + j;
    if (closed[u]) continue; closed[u] = 1;
    if (i === gi && j === gj) { found = true; break; }
    for (const [di, dj, c] of NB) {
      const a = i + di, b = j + dj;
      if (!(a >= 0 && a < NG && b >= 0 && b < NG) || occ[a * NG + b]) continue;
      const v = a * NG + b, nd = G[u] + c + (extra ? extra[v] : 0);
      if (nd < G[v]) { G[v] = nd; prev[v] = u; h.push([nd + Math.hypot(a - gi, b - gj), a, b]); }
    }
  }
  if (!found) return null;
  const path = []; let u = gi * NG + gj;
  while (u !== si * NG + sj) { path.push(u); u = prev[u]; }
  path.push(si * NG + sj); path.reverse();
  const pts = path.map(q => [(Math.trunc(q / NG) + 0.5) * RES, (q % NG + 0.5) * RES]);
  pts[pts.length - 1] = [goal[0], goal[1]];
  return pts;
}

export const lookup = (D, x, y) => D[Math.min(NG - 1, Math.max(0, Math.trunc(x / RES))) * NG + Math.min(NG - 1, Math.max(0, Math.trunc(y / RES)))];

/** Arrondi au pair le plus proche, comme round() en Python 3. */
export function roundHalfEven(x) {
  const f = Math.floor(x), d = x - f;
  if (d < 0.5) return f; if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

/** Modulo au sens de Python (résultat du signe du diviseur). */
export const pmod = (a, n) => ((a % n) + n) % n;
export const wrap = a => pmod(a + Math.PI, 2 * Math.PI) - Math.PI;

/** np.interp : interpolation linéaire, valeurs extrêmes au-delà des bornes. */
export function interp(x, xp, fp) {
  const n = xp.length;
  if (x <= xp[0]) return fp[0];
  if (x >= xp[n - 1]) return fp[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xp[m] <= x) lo = m; else hi = m; }
  const slope = (fp[lo + 1] - fp[lo]) / (xp[lo + 1] - xp[lo]);
  return slope * (x - xp[lo]) + fp[lo];
}
