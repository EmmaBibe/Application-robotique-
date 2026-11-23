// Fait tourner VIGIE 6 et DRA-MPPI dans deux copies du même monde et enregistre, à chaque pas de 0,1 s,
// ce que chacun voit, imagine et décide. Utilisé par le fil de calcul (worker.js) ou, à défaut, par la page.

import { createEpisode } from './episode.js';
import { T } from './planners.js';

const r3 = x => Math.round(x * 1000) / 1000;
const pt = p => [r3(p[0]), r3(p[1])];
const sub = (a, k) => { const o = []; for (let i = 0; i < a.length; i += k) o.push(pt(a[i])); if (a.length && (a.length - 1) % k) o.push(pt(a[a.length - 1])); return o; };

const people = world => world.dyn.map(o => [r3(o.p[0]), r3(o.p[1]), r3(o.v[0]), r3(o.v[1]), o.r]);
const obsRows = rows => rows.map(o => [r3(o[0]), r3(o[1]), r3(o[2]), r3(o[3]), o[4], o[6]]);
const fan = samples => (samples || []).filter((_, i) => i % 2 === 0 || i === samples.length - 1).map(f => ({ pts: sub(f.pts, 2), rank: r3(f.rank) }));
const peak = d => { let m = 0, tm = 0; for (let t = 0; t < T; t++) if (d.pj[t] > m) { m = d.pj[t]; tm = t; } return [r3(m), tm]; };
const breakdown = (d, total) => ({ obstacles: r3(d.obstacles), progression: r3(d.progression), virage: r3(d.virage), risque: r3(d.risque), total: r3(total) });

function brainVigie(b) {
  if (!b || b.empty) return { empty: true };
  return {
    chosen: b.chosen, switched: b.switched, refreshed: !!b.refreshed, ideal: r3(b.ideal),
    final: b.final ? [r3(b.final[0]), r3(b.final[1])] : null,
    cap: b.cap ? { vmax: r3(b.cap.vmax), raw: r3(b.cap.raw), active: b.cap.active, ph: b.cap.phantoms.map(p => [r3(p[0]), r3(p[1]), r3(p[2]), r3(p[3])]) } : null,
    smith: b.smith ? { pred: b.smith.pred.map(r3), meas: b.smith.meas.map(r3), n: b.smith.n } : null,
    obs: obsRows(b.obs), u: b.u.map(r3),
    cands: b.cands.map(c => {
      const [pm, tm] = peak(c.detail);
      return {
        type: c.type, plan: c.plan.map(pt),
        guide: c.guide ? sub(c.guide, c.type === 'espace-temps' ? 1 : 2).slice(0, 90) : null,
        br: breakdown(c.detail, c.raw), J: r3(c.J), w: c.w, score: r3(c.score), pmax: pm, tmax: tm, pAgent: Array.from(c.detail.pAgent, r3),
      };
    }),
    fan: fan(b.samples),
  };
}

function brainDra(b) {
  if (!b) return null;
  const [pm, tm] = peak(b.detail);
  return { plan: b.plan.map(pt), obs: obsRows(b.obs), pmax: pm, tmax: tm, pAgent: Array.from(b.detail.pAgent, r3), br: breakdown(b.detail, b.detail.total), fan: fan(b.samples) };
}

function robotFrame(ep, brain, idle) {
  return {
    s: ep.s.map(r3), v: r3(ep.v), w: r3(ep.w), out: ep.outcome, t: r3(ep.t), clear: r3(ep.world.clearance(ep.s)),
    cmd: ep.last ? ep.last.cmd.map(r3) : [0, 0], ms: ep.last ? r3(ep.last.ms) : 0,
    seen: ep.last ? [...ep.last.seen] : [], brain, idle,
  };
}

/** Prépare une course : info (monde), initial (instant 0), step() -> image suivante ou null quand tout est fini. */
export function createRun(scene, seed, cond, params = {}, spec = null) {
  const eps = { vigie: createEpisode(scene, seed, 'vigie', cond, params, spec), dra: createEpisode(scene, seed, 'dra', cond, {}, spec) };
  const w = eps.vigie.world;
  const info = {
    scene, seed, cond, start: w.start, goal: w.goal, static: w.static.map(c => c.map(r3)), door: w.door,
    nPeople: w.dyn.length, kinds: w.dyn.map(o => o.kind), reactif: w.dyn.map(o => o.reactif), sense: eps.vigie.cond.range || null,
    modified: eps.vigie.planner.modified, params: eps.vigie.planner.params,
  };
  const still = () => ({ s: [...w.start], v: 0, w: 0, out: null, t: 0, clear: r3(w.clearance(w.start)), cmd: [0, 0], ms: 0, seen: [], brain: null, idle: false });
  const initial = { k: 0, t: 0, people: people(w), people2: null, diverged: false, vigie: still(), dra: still() };
  let k = 0, diverged = false;
  return {
    info, initial,
    get done() { return !!(eps.vigie.outcome && eps.dra.outcome); },
    step() {
      if (this.done) return null;
      const stepped = {};
      for (const key of ['vigie', 'dra']) if (!eps[key].outcome) { eps[key].step(); stepped[key] = true; }
      k++;
      // les deux mondes restent identiques tant que les personnes ne réagissent pas différemment aux deux robots ;
      // on ne compare que si les deux robots roulent encore (le monde d'un robot arrivé ne bouge plus)
      if (!diverged && stepped.vigie && stepped.dra && eps.vigie.world.signature() !== eps.dra.world.signature()) diverged = true;
      const live = stepped.vigie ? eps.vigie.world : eps.dra.world;
      return {
        k, t: r3(k * 0.1), diverged,
        people: people(diverged ? eps.vigie.world : live), people2: diverged ? people(eps.dra.world) : null,
        vigie: robotFrame(eps.vigie, stepped.vigie ? brainVigie(eps.vigie.planner.brain) : null, !stepped.vigie),
        dra: robotFrame(eps.dra, stepped.dra ? brainDra(eps.dra.planner.brain) : null, !stepped.dra),
      };
    },
  };
}
