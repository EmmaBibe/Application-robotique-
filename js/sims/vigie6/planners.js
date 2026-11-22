// VIGIE 6 et DRA-MPPI, portés ligne à ligne depuis le banc de recherche (recherche/planificateur) :
//   planners.py (MPPI, MultiModalMPPI, MMST, TubeMixin, PhantomMixin, SmithMixin, SurpriseTracker, Memory,
//   diverse_guides, guide_to_controls, timed_controls, spacetime_plan2, phantoms, phantom_speed),
//   vigie_risque.py (RiskCostMixin, CarteCommuneMixin, ConsistencyMixin, FreeModeMixin, Vigie6),
//   references.py (DRAMPPI réglé 3000 / 3000, TMPC.ideal_cost, same_class, winding).
// En plus de la commande, chaque décision renvoie son explication (options, coûts détaillés, choix),
// utilisée par le simulateur 3D pour montrer ce qui se passe « dans la tête » du robot.

import { DT, R_ROB, VMAX, WMAX, AMAX, SIZE, makeRand } from '../vigie-core.js';
import { RES, NG, XS, LexHeap, occupancy, astar, dijkstra, lookup, roundHalfEven, wrap, interp } from './grid.js';
import { collisionProb } from './risk.js';

export const T = 25;
const SIGV = 0.5, SIGW = 1.0;                  // MPPI.SIG
const ALPHA_SMITH = 4.0;                       // SmithMixin : 4,0 rad/s² pour la rotation
const TW_OBST = Float64Array.from({ length: T }, (_, t) => 0.97 ** t);
const TIMES = Float64Array.from({ length: T }, (_, t) => (t + 1) * DT);

// ------------------------------------------------------------------ outils
/** Trajectoire de commandes U (T x 2) depuis s : T points [x, y, th]. */
export function rollout(s, U, off = 0) {
  let x = s[0], y = s[1], th = s[2]; const out = [];
  for (let t = 0; t < T; t++) {
    const v = U[off + 2 * t], w = U[off + 2 * t + 1];
    x = x + DT * v * Math.cos(th); y = y + DT * v * Math.sin(th); th = th + DT * w;
    out.push([x, y, th]);
  }
  return out;
}

/** np.percentile(J, 10) avec l'interpolation linéaire de numpy (y compris sa forme symétrique pour t >= 0,5). */
function percentile10(J) {
  const a = Float64Array.from(J).sort(), n = a.length, vi = 0.1 * (n - 1), lo = Math.floor(vi), hi = Math.min(n - 1, lo + 1), g = vi - lo;
  const A = a[lo], B = a[hi], diff = B - A;
  return g >= 0.5 ? B - diff * (1 - g) : A + diff * g;
}

const argmin = arr => { let bi = 0; for (let i = 1; i < arr.length; i++) if (arr[i] < arr[bi]) bi = i; return bi; };

// ------------------------------------------------------------------ contexte d'évaluation d'un cycle
/** Prépare ce qui ne dépend pas des tirages : obstacles fixes, personnes et leurs futurs prédits. */
function makeContext(obs, D, risk) {
  const st = obs.filter(o => o[5] === 0), mob = obs.filter(o => o[5] > 0);
  const M = mob.length;
  const mux = new Float64Array(T * M), muy = new Float64Array(T * M), sig = new Float64Array(T * M), rr = new Float64Array(M);
  for (let m = 0; m < M; m++) {
    rr[m] = mob[m][4] + R_ROB;
    const rate = risk.varRate(mob[m]);
    for (let t = 0; t < T; t++) {
      mux[t * M + m] = mob[m][0] + mob[m][2] * TIMES[t]; muy[t * M + m] = mob[m][1] + mob[m][3] * TIMES[t];
      sig[t * M + m] = Math.sqrt(rate * TIMES[t]);
    }
  }
  return { st, mob, M, mux, muy, sig, rr, D };
}

/** Coût d'une séquence de commandes (eval_cost du banc), avec son détail.
 *  risk : { wSoft, wHard, sigma, disc } ; guide : points [x, y] ou null ; gt : route horodatée ou null. */
function costOne(s, U, off, ctx, risk, guide, gt, detail) {
  let x = s[0], y = s[1], th = s[2];
  let obst = 0, navSum = 0, navLast = 0, wSum = 0, gSum = 0, rSum = 0, track = 0;
  const { st, M, mux, muy, sig, rr, D } = ctx;
  const ngt = gt ? Math.min(T, gt.length) : 0;
  for (let t = 0; t < T; t++) {
    const v = U[off + 2 * t], w = U[off + 2 * t + 1];
    x = x + DT * v * Math.cos(th); y = y + DT * v * Math.sin(th); th = th + DT * w;
    // obstacles fixes et murs : coût déterministe (obstacle_cost)
    let d = st.length ? Infinity : 10.0;
    for (let k = 0; k < st.length; k++) { const dx = x - st[k][0], dy = y - st[k][1], q = Math.sqrt(dx * dx + dy * dy) - st[k][4] - R_ROB; if (q < d) d = q; }
    const dw = Math.min(Math.min(x, y), Math.min(SIZE - x, SIZE - y)) - R_ROB; if (dw < d) d = dw;
    const cl = Math.max(0.6 - d, 0);
    obst += (3000.0 * (d < 0 ? 1 : 0) + 60.0 * cl * cl) * TW_OBST[t];
    // progression vers le but
    navLast = lookup(D, x, y); navSum += navLast;
    wSum += w * w;
    // suivi de la route guide
    if (guide) {
      let best = Infinity;
      for (let k = 0; k < guide.length; k++) { const ex = x - guide[k][0], ey = y - guide[k][1], e = Math.sqrt(ex * ex + ey * ey); if (e < best) best = e; }
      gSum += best * best;
    }
    // risque : probabilité de collision jointe avec les personnes
    if (M) {
      let keep = 1;
      for (let m = 0; m < M; m++) {
        const dx = x - mux[t * M + m], dy = y - muy[t * M + m];
        const p = collisionProb(Math.sqrt(dx * dx + dy * dy), rr[m], sig[t * M + m]);
        keep *= 1 - p;
        if (detail && p > detail.pAgent[m]) detail.pAgent[m] = p;
      }
      const pj = 1 - keep;
      rSum += (risk.wSoft * pj + risk.wHard * (pj > risk.sigma ? 1 : 0)) * risk.tw[t];
      if (detail) detail.pj[t] = pj;
    }
    if (t < ngt) { const ex = x - gt[t][0], ey = y - gt[t][1]; track += ex * ex + ey * ey; }
  }
  let c = obst;
  c = c + 8.0 * navLast + 0.4 * navSum + 0.05 * wSum;
  if (guide) c = c + 1.5 * gSum;
  c = c + rSum;
  if (gt) c = c + 2.0 * track;
  if (detail) Object.assign(detail, { obstacles: obst, progression: 8.0 * navLast + 0.4 * navSum, virage: 0.05 * wSum, guide: guide ? 1.5 * gSum : 0, risque: rSum, suivi: gt ? 2.0 * track : 0, total: c });
  return c;
}

// ------------------------------------------------------------------ MPPI : un pas d'optimisation par échantillonnage
/** noise(N) : Float64Array de N*T*2 tirages normaux centrés réduits (ordre [n][t][v, w], comme numpy). */
function mppiStep(s, Unom, N, noise, evalFn, keep) {
  const eps = noise(N), U = new Float64Array(N * T * 2);
  for (let n = 0; n < N; n++) for (let t = 0; t < T; t++) {
    const k = (n * T + t) * 2;
    let v = Unom[2 * t] + eps[k] * SIGV, w = Unom[2 * t + 1] + eps[k + 1] * SIGW;
    if (n === 0) { v = Unom[2 * t]; w = Unom[2 * t + 1]; } else if (n === 1) { v = 0; w = 0; }
    U[k] = Math.min(VMAX, Math.max(0, v)); U[k + 1] = Math.min(WMAX, Math.max(-WMAX, w));
  }
  const J = new Float64Array(N);
  for (let n = 0; n < N; n++) J[n] = evalFn(U, n * T * 2);
  let mn = Infinity; for (const j of J) if (j < mn) mn = j;
  const lam = Math.max(1e-6, (percentile10(J) - mn) / 2.0);
  const wgt = new Float64Array(N); let ws = 0;
  for (let n = 0; n < N; n++) { wgt[n] = Math.exp(-(J[n] - mn) / lam); ws += wgt[n]; }
  const out = new Float64Array(T * 2);
  for (let n = 0; n < N; n++) { const a = wgt[n] / ws; for (let k = 0; k < T * 2; k++) out[k] += a * U[n * T * 2 + k]; }
  if (keep) { keep.U = U; keep.J = J; keep.wgt = wgt; keep.ws = ws; }
  return out;
}

const shiftU = U => { const o = new Float64Array(U.length); o.set(U.subarray(2)); o[2 * T - 2] = o[2 * T - 4]; o[2 * T - 1] = o[2 * T - 3]; return o; };

// ------------------------------------------------------------------ routes topologiques
/** Routes guides distinctes : A* répété, en pénalisant autour de chaque route trouvée (diverse_guides). */
export function diverseGuides(s, goal, obs, K = 3) {
  const occ = occupancy(obs.map(o => [o[0], o[1], o[4] + (o[5] ? 0.2 : 0)]), R_ROB + 0.1);
  const guides = [], extra = new Float64Array(NG * NG);
  for (let it = 0; it < K + 2; it++) {
    const p = astar(occ, s, goal, extra);
    if (!p) break;
    const far = guides.every(g => {
      let tot = 0;
      for (const a of p) { let b = Infinity; for (const q of g) { const d = Math.sqrt((a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2); if (d < b) b = d; } tot += b; }
      return tot / p.length > 0.8;
    });
    if (far) guides.push(p);
    if (guides.length === K) break;
    for (let k = 0; k < p.length; k += 2) {
      const q = p[k];
      const ok = Math.hypot(q[0] - s[0], q[1] - s[1]) > 1.2 && Math.hypot(q[0] - goal[0], q[1] - goal[1]) > 1.2;
      if (!ok) continue;
      for (let i = 0; i < NG; i++) { const dx = XS[i] - q[0]; for (let j = 0; j < NG; j++) { const dy = XS[j] - q[1]; extra[i * NG + j] += 6.0 * Math.exp(-(dx * dx + dy * dy) / (2 * 0.6 ** 2)); } }
    }
  }
  return guides;
}

/** Commande initiale qui suit grossièrement une route (guide_to_controls). */
export function guideToControls(s, g) {
  const U = new Float64Array(2 * T); let x = s[0], y = s[1], th = s[2];
  for (let t = 0; t < T; t++) {
    let i = 0, bd = Infinity; for (let k = 0; k < g.length; k++) { const d = Math.hypot(g[k][0] - x, g[k][1] - y); if (d < bd) { bd = d; i = k; } }
    const j = Math.min(g.length - 1, i + 4);
    let a = Math.atan2(g[j][1] - y, g[j][0] - x) - th; a = Math.atan2(Math.sin(a), Math.cos(a));
    U[2 * t] = VMAX * 0.8 * Math.max(0.1, Math.cos(a)); U[2 * t + 1] = Math.min(WMAX, Math.max(-WMAX, 2.5 * a));
    x = x + DT * U[2 * t] * Math.cos(th); y = y + DT * U[2 * t] * Math.sin(th); th = th + DT * U[2 * t + 1];
  }
  return U;
}

/** Commande initiale qui suit une route horodatée (timed_controls). */
export function timedControls(s, gt) {
  const U = new Float64Array(2 * T); let x = s[0], y = s[1], th = s[2];
  for (let t = 0; t < T; t++) {
    const q = gt[Math.min(gt.length - 1, t + 3)], d = Math.hypot(q[0] - x, q[1] - y);
    let a = Math.atan2(q[1] - y, q[0] - x) - th; a = Math.atan2(Math.sin(a), Math.cos(a));
    U[2 * t] = Math.min(VMAX, Math.max(0, d / 0.4)) * Math.max(0.0, Math.cos(a)); U[2 * t + 1] = Math.min(WMAX, Math.max(-WMAX, 2.5 * a));
    x = x + DT * U[2 * t] * Math.cos(th); y = y + DT * U[2 * t] * Math.sin(th); th = th + DT * U[2 * t + 1];
  }
  return U;
}

// ------------------------------------------------------------------ route espace-temps (spacetime_plan2)
export const ST_RES = 0.35, ST_DT = 1.0 / 3.0, ST_K = 24, ST_SUB = 4, ST_N = Math.round(SIZE / ST_RES);

/** A* dans (x, y, t) : peut attendre sur place ; les personnes occupent une place qui grandit avec le temps.
 *  Renvoie les positions voulues à chaque pas de 0,1 s, ou null. */
export function spacetimePlan(s, goal, obs, D, uncAgent, marginStatic = null, margin = 0.3) {
  const N = ST_N, xs = Float64Array.from({ length: N }, (_, k) => (k + 0.5) * ST_RES);
  const stat = new Uint8Array(N * N), ms = marginStatic === null ? margin : marginStatic;
  for (const o of obs) {
    if (o[5] !== 0) continue;
    const R = o[4] + R_ROB + ms, R2 = R * R;
    for (let i = 0; i < N; i++) { const dx = xs[i] - o[0]; for (let j = 0; j < N; j++) { const dy = xs[j] - o[1]; if (dx * dx + dy * dy < R2) stat[i * N + j] = 1; } }
  }
  for (let q = 0; q < N; q++) stat[q] = stat[(N - 1) * N + q] = stat[q * N] = stat[q * N + N - 1] = 1;
  const mob = [], ua = [];
  obs.forEach((o, k) => { if (o[5] > 0) { mob.push(o); ua.push(uncAgent ? uncAgent[k] : 0.05); } });
  const nf = ST_K * ST_SUB + 1, dtf = ST_DT / ST_SUB, occ = new Uint8Array(nf * N * N);
  for (let q = 0; q < nf; q++) {
    const t = q * dtf, base = q * N * N; occ.set(stat, base);
    for (let m = 0; m < mob.length; m++) {
      const a = mob[m], px = a[0] + a[2] * t, py = a[1] + a[3] * t, rr = a[4] + R_ROB + margin + ua[m] * t;
      const i0 = Math.max(0, Math.trunc((px - rr) / ST_RES)), i1 = Math.min(N - 1, Math.trunc((px + rr) / ST_RES) + 1);
      const j0 = Math.max(0, Math.trunc((py - rr) / ST_RES)), j1 = Math.min(N - 1, Math.trunc((py + rr) / ST_RES) + 1);
      if (i0 > i1 || j0 > j1) continue;
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const dx = xs[i] - px, dy = xs[j] - py; if (dx * dx + dy * dy < rr * rr) occ[base + i * N + j] = 1; }
    }
  }
  const cellST = p => [Math.min(N - 1, Math.max(0, Math.trunc(p[0] / ST_RES))), Math.min(N - 1, Math.max(0, Math.trunc(p[1] / ST_RES)))];
  const [si, sj] = cellST(s), [gi, gj] = cellST(goal);
  const Dst = (i, j) => lookup(D, xs[i], xs[j]) / ST_RES;
  const moves = [[0, 0, 0.25]]; for (const di of [-1, 0, 1]) for (const dj of [-1, 0, 1]) if (di || dj) moves.push([di, dj, Math.hypot(di, dj)]);
  const key = (i, j, k) => (k * N + i) * N + j;
  const G = new Map(), prev = new Map(), closed = new Set(), h = new LexHeap();
  G.set(key(si, sj, 0), 0.0); h.push([Dst(si, sj), si, sj, 0]);
  let best = null, bestc = Infinity, n = 0;
  while (h.size && n < 80000) {
    const [, i, j, k] = h.pop(), u = key(i, j, k);
    if (closed.has(u)) continue;
    closed.add(u); n++;
    if ((i === gi && j === gj) || k === ST_K) {
      const c = G.get(u) + (i === gi && j === gj ? 0 : Dst(i, j));
      if (c < bestc) { bestc = c; best = [i, j, k]; }
      if (i === gi && j === gj) break;
      continue;
    }
    for (const [di, dj, c] of moves) {
      const a = i + di, b = j + dj;
      if (!(a >= 0 && a < N && b >= 0 && b < N)) continue;
      let ok = true;
      for (let q = 1; q <= ST_SUB; q++) {
        const ci = roundHalfEven(i + di * q / ST_SUB), cj = roundHalfEven(j + dj * q / ST_SUB);
        if (occ[(k * ST_SUB + q) * N * N + ci * N + cj] && !(k === 0 && q < 2)) { ok = false; break; }
      }
      if (!ok) continue;
      const v = key(a, b, k + 1), nd = G.get(u) + c + 0.2;
      if (nd < (G.has(v) ? G.get(v) : Infinity)) { G.set(v, nd); prev.set(v, [i, j, k]); h.push([nd + Dst(a, b), a, b, k + 1]); }
    }
  }
  if (!best) return null;
  const path = [best];
  for (;;) { const last = path[path.length - 1], p = prev.get(key(last[0], last[1], last[2])); if (!p) break; path.push(p); }
  path.reverse();
  const pts = path.map(([i, j]) => [(i + 0.5) * ST_RES, (j + 0.5) * ST_RES]); pts[0] = [s[0], s[1]];
  const nq = Math.trunc(pts.length * ST_DT / DT), tk = pts.map((_, k) => k * ST_DT);
  const px = pts.map(p => p[0]), py = pts.map(p => p[1]), out = [];
  for (let q = 1; q <= nq; q++) { const tq = q * DT; out.push([interp(tq, tk, px), interp(tq, tk, py)]); }
  return out;
}

// ------------------------------------------------------------------ imprévisibilité mesurée (SurpriseTracker)
export class SurpriseTracker {
  constructor(horizon = 1.0, dflt = 0.3) { this.h = new Map(); this.e = new Map(); this.H = horizon; this.dflt = dflt; }
  update(obs, t) {
    for (const o of obs) {
      if (!(o[5] > 0)) continue;
      const i = Math.trunc(o[6]);
      if (!this.h.has(i)) this.h.set(i, []);
      const q = this.h.get(i); q.push([t, o.slice(0, 4)]); if (q.length > 40) q.shift();
      while (q.length && t - q[0][0] > this.H + 0.15) q.shift();
      const [t0, old] = q[0];
      if (Math.abs((t - t0) - this.H) <= 0.15) {
        const err = Math.hypot(o[0] - (old[0] + old[2] * (t - t0)), o[1] - (old[1] + old[3] * (t - t0)));
        this.e.set(i, 0.85 * (this.e.has(i) ? this.e.get(i) : err) + 0.15 * err);
      }
    }
  }
  u(obs) {
    return obs.map(o => {
      if (!(o[5] > 0)) return 0;
      const i = Math.trunc(o[6]);
      return this.e.has(i) ? Math.min(1, Math.max(0, (this.e.get(i) - 0.08) / 0.45)) : this.dflt;
    });
  }
}

// ------------------------------------------------------------------ angles morts (phantoms, phantom_speed)
export function phantoms(s, obs, range = 5.0, speed = 1.5) {
  const st = obs.filter(o => o[5] === 0); if (!st.length) return [];
  const rel = st.map(o => [o[0] - s[0], o[1] - s[1]]), d = rel.map(r => Math.hypot(r[0], r[1]));
  const hd = [Math.cos(s[2]), Math.sin(s[2])], out = [];
  for (let k = 0; k < st.length; k++) {
    if (!(d[k] < range + 1.5 && d[k] > st[k][4] + 0.2)) continue;
    const c = st[k], r = c[4];
    if ((rel[k][0] * hd[0] + rel[k][1] * hd[1]) / d[k] < -0.2) continue;
    const base = Math.atan2(rel[k][1], rel[k][0]), half = Math.asin(Math.min(1.0, r / d[k]));
    for (const sg of [-1, 1]) {
      const a = base + sg * (half + 0.02), L = Math.sqrt(Math.max(d[k] ** 2 - r ** 2, 0));
      const E = [s[0] + L * Math.cos(a), s[1] + L * Math.sin(a)];
      // normes calculées comme np.linalg.norm (racine du produit scalaire), pour retrouver le même ordre de tri
      let nx = E[0] - c[0], ny = E[1] - c[1]; const nn = Math.sqrt(nx * nx + ny * ny) + 1e-9; nx /= nn; ny /= nn;
      let ax = E[0] - s[0], ay = E[1] - s[1]; const an = Math.sqrt(ax * ax + ay * ay) + 1e-9; ax /= an; ay /= an;
      const P = [E[0] + 1.0 * ax - 0.25 * nx, E[1] + 1.0 * ay - 0.25 * ny];
      if (st.some(b => Math.hypot(b[0] - P[0], b[1] - P[1]) < b[4] + 0.35)) continue;
      if (!(0.5 < P[0] && P[0] < SIZE - 0.5 && 0.5 < P[1] && P[1] < SIZE - 0.5)) continue;
      const segx = E[0] - s[0], segy = E[1] - s[1], Ls = Math.sqrt(segx * segx + segy * segy), ux = segx / (Ls + 1e-9), uy = segy / (Ls + 1e-9);
      let blocked = false;
      for (let q = 0; q < st.length && !blocked; q++) {
        if (q === k) continue;
        const pr = rel[q][0] * ux + rel[q][1] * uy, perp = Math.abs(rel[q][0] * uy - rel[q][1] * ux);
        if (pr > 0 && pr < Ls - 0.05 && perp < st[q][4] - 0.05) blocked = true;
      }
      if (blocked) continue;
      const rpx = P[0] - s[0], rpy = P[1] - s[1], LP = Math.sqrt(rpx * rpx + rpy * rpy), upx = rpx / (LP + 1e-9), upy = rpy / (LP + 1e-9);
      let hidden = false;
      for (let q = 0; q < st.length && !hidden; q++) {
        const pr = rel[q][0] * upx + rel[q][1] * upy, perp = Math.abs(rel[q][0] * upy - rel[q][1] * upx);
        if (pr > 0 && pr < LP && perp < st[q][4]) hidden = true;
      }
      if (!hidden) continue;
      let v = [-uy * sg * speed, ux * sg * speed];
      if (v[0] * (s[0] - P[0]) + v[1] * (s[1] - P[1]) < 0) v = [-v[0], -v[1]];
      out.push([Ls, [P[0], P[1], v[0], v[1], 0.35, 1, -1 - out.length]]);
    }
  }
  out.sort((a, b) => a[0] - b[0]);
  return out.slice(0, 6).map(e => e[1]);
}

export function phantomSpeed(s, ph, a = 0.8 * AMAX, cone = 1.3, margin = 0.25) {
  if (!ph.length) return VMAX;
  const hd = [Math.cos(s[2]), Math.sin(s[2])]; let best = Infinity;
  for (const p of ph) {
    const rx = p[0] - s[0], ry = p[1] - s[1], d = Math.hypot(rx, ry) - p[4] - R_ROB - margin;
    const ang = Math.abs(Math.atan2(rx * hd[1] * -1 + ry * hd[0], rx * hd[0] + ry * hd[1]));
    if (!(ang < cone)) continue;
    const vf = Math.hypot(p[2], p[3]), dd = Math.max(d, 0.0);
    best = Math.min(best, -vf + Math.sqrt(vf * vf + 2 * a * dd));
  }
  if (best === Infinity) return VMAX;
  return Math.min(VMAX, Math.max(0.15, best));
}

// ------------------------------------------------------------------ cohérence de route (ConsistencyMixin)
export function routeAhead(g, s, n = 60) {
  let k = 0, bd = Infinity;
  for (let q = 0; q < g.length; q++) { const d = Math.hypot(g[q][0] - s[0], g[q][1] - s[1]); if (d < bd) { bd = d; k = q; } }
  const p = [[s[0], s[1]], ...g.slice(k).map(q => [q[0], q[1]])];
  const L = [0]; for (let q = 1; q < p.length; q++) L.push(L[q - 1] + Math.hypot(p[q][0] - p[q - 1][0], p[q][1] - p[q - 1][1]));
  const Lt = L[L.length - 1];
  if (Lt < 1e-6) return Array.from({ length: n }, () => [p[0][0], p[0][1]]);
  const px = p.map(q => q[0]), py = p.map(q => q[1]), step = Lt / (n - 1), out = [];
  for (let i = 0; i < n; i++) { const u = i === n - 1 ? Lt : i * step; out.push([interp(u, L, px), interp(u, L, py)]); }
  return out;
}

/** Vrai si deux trajectoires passent chaque obstacle fixe du même côté (nombres d'enroulement < 0,5). */
export function sameClass(pa, pb, st) {
  for (const o of st) {
    let sa = 0, sb = 0;
    const tha = pa.map(p => Math.atan2(p[1] - o[1], p[0] - o[0])), thb = pb.map(p => Math.atan2(p[1] - o[1], p[0] - o[0]));
    for (let k = 1; k < tha.length; k++) { sa += wrap(tha[k] - tha[k - 1]); sb += wrap(thb[k] - thb[k - 1]); }
    const close = wrap(thb[thb.length - 1] - tha[tha.length - 1]);
    if (!(Math.abs((sa + close - sb) / (2 * Math.PI)) < 0.5)) return false;
  }
  return true;
}

// ------------------------------------------------------------------ socle commun : mémoire de carte, retard, bruit
class Base {
  constructor(seed = 0) { this.seedNoise = seed; this.noiseFn = null; }
  /** Tirages normaux ; remplaçables par une source imposée (tests de fidélité au banc Python). */
  noise(N) {
    if (this.noiseFn) return this.noiseFn(N);
    const a = new Float64Array(N * T * 2); for (let k = 0; k < a.length; k++) a[k] = this.rand.n(); return a;
  }
  reset(stat, goal) {
    // Memory : les obstacles fixes connus restent fournis au planificateur, dans l'ordre de départ
    this.known = stat.map(([x, y, r], i) => [x, y, 0, 0, r, 0, i]);
    this.goal = [goal[0], goal[1]];
    this.rand = makeRand(1 + this.seedNoise * 7919);
    this.D = dijkstra(occupancy(stat.map(c => [c[0], c[1], c[2]]), R_ROB + 0.1), this.goal);
    this.U = new Float64Array(2 * T); for (let t = 0; t < T; t++) this.U[2 * t] = 0.5;
    this.lat = 0; this.cmds = []; this.vwMeas = [0, 0];
    this.occl = false; this.sense = 5.0;
  }
  setLatency(L) { this.lat = Math.trunc(L); this.cmds = []; this.vwMeas = [0, 0]; }
  setPerception(occl, range) { this.occl = !!occl; this.sense = range || 5.0; }
  /** Appel depuis l'épisode : mémoire de carte puis prédicteur de Smith, comme dans le banc. */
  act(t, s, obs) {
    const keys = new Set(this.known.map(o => `${o[0].toFixed(1)},${o[1].toFixed(1)}`));
    for (const o of obs) if (o[5] === 0 && !keys.has(`${o[0].toFixed(1)},${o[1].toFixed(1)}`)) { this.known.push([o[0], o[1], 0, 0, o[4], 0, o[6]]); keys.add(`${o[0].toFixed(1)},${o[1].toFixed(1)}`); }
    const full = [...this.known, ...obs.filter(o => o[5] > 0)];
    return this.outer(t, s, full);
  }
  outer(t, s, obs) { return this.smith(t, s, obs); }
  /** Prédicteur de Smith (SmithMixin) : état présent estimé en rejouant les commandes envoyées pendant le retard. */
  smith(t, s, obs) {
    if (this.lat <= 0) { this.smithInfo = { pred: [s[0], s[1], s[2]], meas: [s[0], s[1], s[2]], n: 0 }; return this.core(t, s, obs); }
    let x = [s[0], s[1], s[2]], vv = this.vwMeas[0], ww = this.vwMeas[1];
    const vs = this.cmds.slice();
    for (const [vc, wc] of vs) {
      vv = vv + Math.min(AMAX * DT, Math.max(-AMAX * DT, vc - vv)); ww = ww + Math.min(ALPHA_SMITH * DT, Math.max(-ALPHA_SMITH * DT, wc - ww));
      x = [x[0] + DT * vv * Math.cos(x[2]), x[1] + DT * vv * Math.sin(x[2]), x[2] + DT * ww];
    }
    const o = obs.map(r => r[5] > 0 ? [r[0] + r[2] * vs.length * DT, r[1] + r[3] * vs.length * DT, ...r.slice(2)] : r);
    this.smithInfo = { pred: x, meas: [s[0], s[1], s[2]], n: vs.length };
    const u = this.core(t + vs.length * DT, x, o);
    const maxlen = Math.max(1, this.lat);
    if (this.cmds.length === maxlen && vs.length) {
      const [vc, wc] = vs[0], [v0, w0] = this.vwMeas;
      this.vwMeas = [v0 + Math.min(AMAX * DT, Math.max(-AMAX * DT, vc - v0)), w0 + Math.min(ALPHA_SMITH * DT, Math.max(-ALPHA_SMITH * DT, wc - w0))];
    }
    this.cmds.push([Math.min(VMAX, Math.max(0, u[0])), Math.min(WMAX, Math.max(-WMAX, u[1]))]);
    if (this.cmds.length > maxlen) this.cmds.shift();
    return u;
  }
}

// ------------------------------------------------------------------ DRA-MPPI (Trevisan et al., IROS 2025), réglé 3000 / 3000
export class DRAMPPI extends Base {
  constructor(seed = 0) { super(seed); this.name = 'DRA-MPPI'; this.N = 400; }
  reset(stat, goal) {
    super.reset(stat, goal);
    this.risk = { wSoft: 3000.0, wHard: 3000.0, sigma: 0.05, tw: new Float64Array(T).fill(1), varRate: () => 0.3 ** 2 * 0.2 };
  }
  core(t, s, obs) {
    const ctx = makeContext(obs, this.D, this.risk), keep = {};
    this.U = mppiStep(s, this.U, this.N, n => this.noise(n), (U, off) => costOne(s, U, off, ctx, this.risk, null, null, null), keep);
    const detail = { pAgent: new Float64Array(ctx.M), pj: new Float64Array(T) };
    costOne(s, this.U, 0, ctx, this.risk, null, null, detail);
    const u = [this.U[0], this.U[1]];
    this.brain = { kind: 'dra', s: [s[0], s[1], s[2]], obs: ctx.mob, plan: rollout(s, this.U), detail, samples: sampleFan(s, keep, 36), smith: this.smithInfo };
    this.U = shiftU(this.U);
    return u;
  }
}

/** Quelques essais du MPPI, choisis à intervalles réguliers dans l'ordre des coûts, pour les montrer. */
function sampleFan(s, keep, k) {
  const N = keep.J.length, order = Array.from({ length: N }, (_, i) => i).sort((a, b) => keep.J[a] - keep.J[b]);
  const out = [];
  for (let q = 0; q < k; q++) { const n = order[Math.floor(q * (N - 1) / (k - 1))]; out.push({ pts: rollout(s, keep.U, n * T * 2).map(p => [p[0], p[1]]), rank: q / (k - 1), w: keep.wgt[n] / keep.ws }); }
  return out;
}

// ------------------------------------------------------------------ VIGIE 6
export class Vigie6 extends Base {
  constructor(seed = 0) { super(seed); this.name = 'VIGIE 6'; this.N = 128; this.NFREE = 400; this.K = 3; this.C_CONS = 0.75; this.MARGE_FIXE = 0.1; }
  reset(stat, goal) {
    super.reset(stat, goal);
    this.risk = { wSoft: 3000.0, wHard: 3000.0, sigma: 0.05, tw: Float64Array.from({ length: T }, (_, t) => 0.97 ** t), varRate: () => 0.3 ** 2 * 0.2 };
    this.modes = []; this.k = 0; this.switches = 0; this.prevG = null; this.tr = null;
    const U = new Float64Array(2 * T); for (let t = 0; t < T; t++) U[2 * t] = 0.5;
    this.free = { U, g: null, libre: true };
  }
  // PhantomMixin : vitesse plafonnée près des angles morts (perception limitée seulement)
  outer(t, s, obs) {
    const u = this.smith(t, s, obs).slice();
    this.cap = null;
    if (this.occl) {
      const ph = phantoms(s, obs, this.sense), vmax = phantomSpeed(s, ph);
      this.cap = { phantoms: ph, vmax, raw: u[0], active: u[0] > vmax };
      u[0] = Math.min(u[0], vmax);
    }
    if (this.brain) { this.brain.cap = this.cap; this.brain.final = [u[0], u[1]]; }
    return u;
  }
  // TubeMixin + MMST + carte commune + cohérence + planificateur libre
  core(t, s, obs) {
    if (!this.tr) this.tr = new SurpriseTracker();
    this.tr.update(obs, t);
    let refreshed = false;
    if (this.k % 10 === 0 || !this.modes.length) { this.refresh(s, obs); refreshed = true; }
    this.k++;
    if (!this.modes.length) { this.brain = { kind: 'vigie', s: [s[0], s[1], s[2]], obs: obs.filter(o => o[5] > 0), cands: [], chosen: -1, smith: this.smithInfo, empty: true }; return [0.0, 0.0]; }
    const ctx = makeContext(obs, this.D, this.risk);
    for (const m of this.modes) {
      if (m.st) {
        if (m.g.length > 1 && !m.neuf) m.g = m.g.slice(1);
        m.neuf = false;
        m.U = mppiStep(s, m.U, this.N, n => this.noise(n), (U, off) => costOne(s, U, off, ctx, this.risk, null, m.g, null));
      } else {
        m.U = mppiStep(s, m.U, this.N, n => this.noise(n), (U, off) => costOne(s, U, off, ctx, this.risk, m.g, null, null));
      }
    }
    // planificateur libre : comme DRA-MPPI, sans route imposée
    const keep = {};
    this.free.U = mppiStep(s, this.free.U, this.NFREE, n => this.noise(n), (U, off) => costOne(s, U, off, ctx, this.risk, null, null, null), keep);
    this.free.g = [...rollout(s, this.free.U).map(p => [p[0], p[1]]), [this.goal[0], this.goal[1]]];
    const cands = [...this.modes, this.free];
    const i = this.select(s, cands, ctx, obs);
    const u = [cands[i].U[0], cands[i].U[1]];
    this.brain.refreshed = refreshed; this.brain.samples = sampleFan(s, keep, 36); this.brain.t = t;
    for (const m of cands) m.U = shiftU(m.U);
    return u;
  }
  refresh(s, obs) {
    const guides = diverseGuides(s, this.goal, obs, this.K), neu = [];
    for (const g of guides) {
      let best = null, bd = Infinity;
      for (const m of this.modes) {
        let tot = 0; for (const a of m.g) { let b = Infinity; for (const q of g) { const d = Math.sqrt((a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2); if (d < b) b = d; } tot += b; }
        const d = tot / m.g.length; if (d < bd) { bd = d; best = m; }
      }
      neu.push({ g, U: best && bd < 1.0 ? best.U : guideToControls(s, g) });
    }
    this.modes = neu.length ? neu : this.modes.filter(m => !m.st);
    const u = this.tr.u(obs), ua = u.map(x => 0.02 + 0.30 * x);
    const gt = spacetimePlan(s, this.goal, obs, this.D, ua, this.MARGE_FIXE);
    if (gt && gt.length > 3) this.modes.push({ g: gt, U: timedControls(s, gt), st: true, neuf: true });
  }
  idealCost(s) {
    const n0 = lookup(this.D, s[0], s[1]); let sum = 0, last = 0;
    for (let t = 0; t < T; t++) { last = Math.max(0.0, n0 - VMAX * TIMES[t]); sum += last; }
    return 8.0 * last + 0.4 * sum;
  }
  // ConsistencyMixin.select, avec le détail de chaque option pour l'explication
  select(s, cands, ctx, obs) {
    const ideal = this.idealCost(s), st = obs.filter(o => o[5] === 0);
    const info = cands.map(m => {
      const detail = { pAgent: new Float64Array(ctx.M), pj: new Float64Array(T) };
      const raw = costOne(s, m.U, 0, ctx, this.risk, null, null, detail);
      return { m, raw, J: Math.max(raw - ideal, 0.0), w: 1, detail };
    });
    if (this.prevG && st.length) {
      const pg = routeAhead(this.prevG, s);
      for (const c of info) if (sameClass(routeAhead(c.m.g, s), pg, st)) c.w = this.C_CONS;
    }
    const score = info.map(c => c.w * c.J), i = argmin(score);
    const switched = this.prevG !== null && info[i].w === 1.0;
    if (switched) this.switches++;
    this.prevG = cands[i].g.map(p => [p[0], p[1]]);
    this.brain = {
      kind: 'vigie', s: [s[0], s[1], s[2]], obs: ctx.mob, ideal, chosen: i, switched, smith: this.smithInfo,
      u: this.tr.u(ctx.mob),
      cands: info.map((c, k) => ({
        type: c.m.libre ? 'libre' : c.m.st ? 'espace-temps' : 'route', index: k,
        guide: c.m.libre ? null : c.m.g.map(p => [p[0], p[1]]),
        plan: rollout(s, c.m.U).map(p => [p[0], p[1], p[2]]),
        detail: c.detail, raw: c.raw, J: c.J, w: c.w, score: score[k],
      })),
    };
    return i;
  }
}

export const PLANNERS = { vigie: Vigie6, dra: DRAMPPI };

// accès réservé aux tests de fidélité (recherche/planificateur/parite_js.py)
export const _test = { makeContext, costOne, percentile10 };
