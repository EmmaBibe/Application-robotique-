// Un épisode complet, comme sim.run_episode avec REEL=1 (la configuration de toutes les campagnes de la séance 7) :
// capteurs bruités, suivi des personnes (Kalman, pistes prolongées), une période de retard de mesure,
// robot réaliste (moteurs, régulateurs de roue, inertie), compensation du retard par le prédicteur de Smith.

import { DT, VMAX, WMAX, RealRobot, makeTracker, makeRand } from '../vigie-core.js';
import { World, COND, T_MAX } from './world.js';
import { PLANNERS } from './planners.js';

export function createEpisode(scene, seed, which, condName = 'nominal', params = {}, spec = null, tmax = T_MAX) {
  const C = { ...COND[condName] };
  const world = new World(scene, seed, spec);
  const planner = new PLANNERS[which](seed, params);
  const robot = new RealRobot([...world.start], makeRand(777 + seed));
  const tracker = makeTracker();
  const lat = (C.lat || 0) + 1;                         // chaîne lidar et traitement : une période de retard
  planner.reset(world.static.map(c => [...c]), [...world.goal]);
  planner.setPerception(!!C.occl, C.range || 0);
  planner.setLatency(lat);
  let s = [...world.start], t = 0, outcome = null, minClear = Infinity;
  const queue = [], path = [[s[0], s[1], s[2]]];
  return {
    world, planner, path, cond: C,
    get t() { return t; }, get s() { return s; }, get outcome() { return outcome; }, get minClear() { return minClear; },
    get v() { return robot.v; }, get w() { return robot.w; }, get est() { return robot.est; },
    step() {
      if (outcome) return outcome;
      const meas0 = [...robot.est];
      const raw = world.obstacles(0.05, s, C.range || null, !!C.occl, C.drop || 0);
      const seen = new Set(raw.filter(o => o[5] > 0).map(o => o[6]));
      const tracked = tracker(raw);
      queue.push([meas0, tracked, seen]);
      const [meas, obs, seenUsed] = queue[0];
      if (queue.length > lat) queue.shift();
      const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
      let [vc, wc] = planner.act(t, meas, obs);
      const ms = (typeof performance !== 'undefined' ? performance : Date).now() - t0;
      vc = Math.min(VMAX, Math.max(0, vc)); wc = Math.min(WMAX, Math.max(-WMAX, wc));
      s = [...robot.step(vc, wc)];
      world.step(t, [s[0], s[1]], !!C.react); t += DT; world.t = t;
      path.push([s[0], s[1], s[2]]);
      const clear = world.clearance(s); minClear = Math.min(minClear, clear);
      if (clear < 0) outcome = 'collision';
      else if (Math.hypot(s[0] - world.goal[0], s[1] - world.goal[1]) < 0.5) outcome = 'succes';
      else if (t >= tmax - 1e-9) outcome = 'temps';
      this.last = { cmd: [vc, wc], ms, seen: seenUsed, obsUsed: obs, meas };
      return outcome;
    },
  };
}
