// Côté JavaScript des tests de fidélité : lit les vecteurs du banc Python sur l'entrée standard,
// refait chaque calcul avec js/sims/vigie6/ et écrit la liste des vérifications.
import { readFileSync } from 'node:fs';
const J = '../../js/sims/vigie6/';
const G = await import(new URL(J + 'grid.js', import.meta.url));
const Rk = await import(new URL(J + 'risk.js', import.meta.url));
const Pl = await import(new URL(J + 'planners.js', import.meta.url));
const W = await import(new URL(J + 'world.js', import.meta.url));
const Core = await import(new URL('../../js/sims/vigie-core.js', import.meta.url));
const V = JSON.parse(readFileSync(0, 'utf8'));
Rk.ensureTable();
const out = [];
const check = (name, ok, detail = '') => out.push([name, !!ok, detail]);
const maxAbs = (a, b) => { let m = 0; for (let k = 0; k < a.length; k++) m = Math.max(m, Math.abs(a[k] - b[k])); return m; };
const flat = a => a.flat(Infinity);
const rel = (a, b) => { let m = 0; for (let k = 0; k < a.length; k++) m = Math.max(m, Math.abs(a[k] - b[k]) / Math.max(1, Math.abs(b[k]))); return m; };
const sameShape = (a, b) => (a === null) === (b === null) && (a === null || a.length === b.length);
const GOAL = [18.5, 10.0];

// --- grille, champ de distance, A*, routes, route espace-temps
{
  let occ = 0, D = 0, path = 0, guides = 0, gt = 0, gt3 = 0, gtc = 0, tc = 0, n = 0; const notes = [];
  V.worlds.forEach((w, i) => {
    const g = V.grid[i], st = w.static;
    const o = G.occupancy(st, 0.3 + 0.1); occ += o.reduce((a, b) => a + b, 0) === g.occ_sum ? 0 : 1;
    const Dj = G.dijkstra(o, GOAL); D = Math.max(D, maxAbs(Dj, g.D));
    const p = G.astar(G.occupancy(st, 0.35), [1.5, 10.0], GOAL);
    if (!sameShape(p, g.path) || (p && maxAbs(flat(p), flat(g.path)) > 1e-12)) { path++; notes.push(`A* ${w.scene}`); }
    const gs = Pl.diverseGuides(g.s, GOAL, w.obs, 3);
    if (gs.length !== g.guides.length || gs.some((q, k) => q.length !== g.guides[k].length || maxAbs(flat(q), flat(g.guides[k])) > 1e-12)) { guides++; notes.push(`routes ${w.scene} (${gs.length}/${g.guides.length})`); }
    const a = Pl.spacetimePlan(g.s, GOAL, w.obs, g.D, g.ua, 0.1), b = Pl.spacetimePlan(g.s, GOAL, w.obs, g.D, g.ua);
    if (!sameShape(a, g.gt) || (a && maxAbs(flat(a), flat(g.gt)) > 1e-12)) { gt++; notes.push(`espace-temps ${w.scene}`); }
    if (!sameShape(b, g.gt3) || (b && maxAbs(flat(b), flat(g.gt3)) > 1e-12)) { gt3++; notes.push(`espace-temps 0,3 ${w.scene}`); }
    if (g.gtc && maxAbs(Pl.guideToControls(g.s, g.guides[0]), g.gtc) > 1e-12) gtc++;
    if (g.tc && maxAbs(Pl.timedControls(g.s, g.gt), g.tc) > 1e-12) tc++;
    n++;
  });
  check(`grille d'occupation identique (${n} mondes)`, occ === 0);
  check('champ de distance au but identique', D < 1e-12, `écart max ${D.toExponential(1)}`);
  check('chemin A* identique', path === 0, notes.filter(x => x.startsWith('A*')).join(', '));
  check('routes topologiques identiques', guides === 0, notes.filter(x => x.startsWith('routes')).join(', '));
  check('route espace-temps identique (marge commune 0,1 m)', gt === 0, notes.filter(x => x.startsWith('espace-temps ')).join(', '));
  check('route espace-temps identique (marge 0,3 m)', gt3 === 0, notes.filter(x => x.startsWith('espace-temps 0,3')).join(', '));
  check('commandes initiales identiques (suivi de route, route horodatée)', gtc === 0 && tc === 0);
}
// --- probabilité de collision
{
  const c = V.cp, p = c.d.map((d, k) => Rk.collisionProb(d, c.r[k], c.sig[k]));
  check('probabilité de collision identique (4 000 cas)', maxAbs(p, c.p) < 1e-12, `écart max ${maxAbs(p, c.p).toExponential(1)}`);
}
// --- coûts
{
  let e = 0, eg = 0, et = 0, ed = 0, ei = 0;
  V.costs.forEach((c, wi) => {
    const w = V.worlds[wi], U = Float64Array.from(c.U), N = U.length / 50;
    const v6 = new Pl.Vigie6(0); v6.reset(w.static, GOAL);
    const dr = new Pl.DRAMPPI(0); dr.reset(w.static, GOAL);
    const ctx6 = Pl._test.makeContext(w.obs, v6.D, v6.risk), ctxd = Pl._test.makeContext(w.obs, dr.D, dr.risk);
    const g = V.grid[wi], guide = g.guides.length ? g.guides[0] : null, gt = g.gt;
    const f = (inst, ctx, gd, gtt) => Array.from({ length: N }, (_, n) => Pl._test.costOne(c.s, U, n * 50, ctx, inst.risk, gd, gtt, null));
    e = Math.max(e, rel(f(v6, ctx6, null, null), c.vigie));
    if (c.vigie_guide) eg = Math.max(eg, rel(f(v6, ctx6, guide, null), c.vigie_guide));
    if (c.vigie_gt) et = Math.max(et, rel(f(v6, ctx6, null, gt), c.vigie_gt));
    ed = Math.max(ed, rel(f(dr, ctxd, null, null), c.dra));
    ei = Math.max(ei, Math.abs(v6.idealCost(c.s) - c.ideal));
  });
  check('coût de VIGIE 6 identique', e < 1e-9, `écart relatif ${e.toExponential(1)}`);
  check('coût de VIGIE 6 avec suivi de route identique', eg < 1e-9, `${eg.toExponential(1)}`);
  check('coût de VIGIE 6 avec route horodatée identique', et < 1e-9, `${et.toExponential(1)}`);
  check('coût de DRA-MPPI identique', ed < 1e-9, `${ed.toExponential(1)}`);
  check('coût idéal (cohérence) identique', ei < 1e-12);
}
// --- cohérence de route
{
  let ra = 0, sc = 0, n = 0;
  for (const h of V.homotopy) {
    const w = V.worlds[h.wi], s = V.grid[h.wi].s, st = w.static.map(([x, y, r]) => [x, y, 0, 0, r, 0, 0]);
    const r = V.grid[h.wi].guides.map(q => Pl.routeAhead(q, s));
    r.forEach((q, k) => { if (maxAbs(flat(q), flat(h.ra[k])) > 1e-9) ra++; });
    for (let a = 0; a < r.length; a++) for (let b = 0; b < r.length; b++) { n++; if (Pl.sameClass(h.ra[a], h.ra[b], st) !== h.same[a][b]) sc++; }
  }
  check('route restante (cohérence) identique', ra === 0);
  check(`classes d'homotopie identiques (${n} paires)`, sc === 0, sc ? `${sc} désaccords` : '');
}
// --- fantômes
{
  // l'ensemble des fantômes et la vitesse imposée doivent être identiques ; l'ordre de deux fantômes à égale distance
  // (les deux bords d'un même obstacle) peut se jouer au dernier chiffre près et n'a pas d'effet sur la vitesse imposée
  let bad = 0, order = 0, n = 0;
  const key = r => r.map(x => x.toFixed(9)).join(',');
  for (const p of V.phantoms) {
    const obs = V.worlds[p.wi].obs, ph = Pl.phantoms(p.s, obs, 5.0), v = Pl.phantomSpeed(p.s, ph); n++;
    const a = ph.map(key).sort().join(';'), b = p.ph.map(key).sort().join(';');
    if (a !== b || Math.abs(v - p.v) > 1e-12) bad++;
    else if (ph.map(key).join(';') !== p.ph.map(key).join(';')) order++;
  }
  check(`fantômes d'angle mort et vitesse prudente identiques (${n} cas)`, bad === 0, bad ? `${bad} écarts` : (order ? `${order} différences d'ordre seulement, à égale distance` : ''));
}
// --- robot réaliste (bruit nul des deux côtés)
{
  const R = Object.assign(() => 0, { n: () => 0 });
  const rb = new Core.RealRobot([1.5, 10.0, 0.0], R); let m = 0;
  V.robot.cmds.forEach(([vc, wc], k) => { rb.step(vc, wc); m = Math.max(m, maxAbs([...rb.p, ...rb.est, rb.v, rb.w], V.robot.traj[k])); });
  check('robot réaliste identique (60 pas, moteurs, régulateurs, odométrie)', m < 1e-9, `écart max ${m.toExponential(1)}`);
}
// --- évolution des personnes et capteurs
{
  for (const d of V.dynamics) {
    const w = Object.create(W.World.prototype);
    Object.assign(w, { name: d.scene, static: d.static, door: d.door, keepout: [], start: [1.5, 10, 0], goal: GOAL, rng: Core.makeRand(1), nrng: Core.makeRand(2) });
    w.dyn = d.init.map(o => ({ p: [...o.p], v: [...o.v], r: o.r, kind: o.kind, mode: o.mode, tSwitch: o.t_switch, done: o.done, reactif: o.reactif, sp: o.sp }));
    let m = 0, kb = 0; const robot = k => [1.5 + 0.12 * k, 10.0 + 0.6 * Math.sin(0.05 * k)];
    for (let k = 0; k < 120; k++) {
      w.step(k * 0.1, robot(k), d.react);
      m = Math.max(m, maxAbs(flat(w.dyn.map(o => [...o.p, ...o.v])), flat(d.states[k])));
      if (k % 10 === 0) { const A = w.obstacles(0.0, robot(k), 5.0, true, 0.0).map(o => o[6]).sort((a, b) => a - b); if (A.join() !== d.keeps[k / 10].join()) kb++; }
    }
    check(`personnes et capteurs identiques : ${d.scene} (120 pas)`, m < 1e-9 && kb === 0, `écart ${m.toExponential(1)}, capteurs ${kb} écarts`);
  }
}
// --- décisions complètes rejouées pas à pas
function Gen(seed) {
  let s = Math.imul(seed, 2654435761) >>> 0 || 1;
  const u = () => { let x = s; x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; s = x; return s / 4294967296.0; };
  return N => { const a = new Float64Array(N * 25 * 2); for (let k = 0; k < a.length; k++) { let acc = 0.0; for (let q = 0; q < 12; q++) acc += u(); a[k] = acc - 6.0; } return a; };
}
for (const ep of V.episodes) {
  const p = new Pl.PLANNERS[ep.which](0); p.reset(ep.static, GOAL); p.noiseFn = Gen(ep.gen_seed);
  p.setPerception(ep.occl, ep.sense); p.setLatency(ep.lat);
  let m = 0, ch = 0, first = -1; const used = {}; let caps = 0, sw = 0;
  ep.steps.forEach((st, k) => {
    const u = p.act(st.t, st.s, st.obs), d = Math.max(Math.abs(u[0] - st.u[0]), Math.abs(u[1] - st.u[1]));
    if (ep.which === 'vigie' && p.brain && p.brain.cands && p.brain.chosen >= 0) { const ty = p.brain.cands[p.brain.chosen].type; used[ty] = (used[ty] || 0) + 1; if (p.brain.switched) sw++; }
    if (p.cap && p.cap.active) caps++;
    if (d > 1e-6 && first < 0) first = k;
    m = Math.max(m, d);
    if (ep.which === 'vigie' && st.chosen !== null && p.brain && p.brain.chosen !== st.chosen) ch++;
  });
  check(`décisions de ${ep.which === 'vigie' ? 'VIGIE 6' : 'DRA-MPPI'} identiques au banc : ${ep.scene}, ${ep.cond} (${ep.steps.length} pas)`, m < 1e-6 && ch === 0,
    `écart max ${m.toExponential(1)}${first >= 0 ? `, premier écart au pas ${first}` : ''}${ch ? `, ${ch} choix d'option différents` : ''}` +
    (ep.which === 'vigie' ? ` ; options choisies ${JSON.stringify(used)}, ${sw} changements de route, plafond actif ${caps} fois` : ''));
}
// --- réglages de l'Atelier (application VIGIE) : défauts identiques, chaque interrupteur agit vraiment
{
  const Ep = await import(new URL(J + 'episode.js', import.meta.url));
  const run = (params, scene = 'goulot', seed = 4, cond = 'nominal', n = 90) => {
    const e = Ep.createEpisode(scene, seed, 'vigie', cond, params); const types = new Set(); let caps = 0, wNot1 = 0;
    for (let k = 0; k < n && !e.outcome; k++) { e.step(); const b = e.planner.brain; if (b && b.cands) { b.cands.forEach(c => { types.add(c.type); if (c.w !== 1) wNot1++; }); } if (e.planner.cap && e.planner.cap.active) caps++; }
    return { path: e.path.map(p => p.join(',')).join(';'), types, caps, wNot1, modified: e.planner.modified };
  };
  const base = run(undefined), same = run({ ...Pl.VIGIE_DEFAUTS });
  check('Atelier : VIGIE réglé sur ses valeurs par défaut refait exactement le même trajet', base.path === same.path && !same.modified);
  const a = run({ attendre: false }), b = run({ improvisation: false }), c = run({ itineraires: 0 }), f = run({ fidelite: 1.0 });
  check('Atelier : sans « chemin qui sait attendre », aucune option espace-temps', !a.types.has('espace-temps') && base.types.has('espace-temps') && a.modified);
  check('Atelier : sans improvisation, aucune option libre', !b.types.has('libre') && base.types.has('libre'));
  check('Atelier : sans itinéraires, aucune route topologique', !c.types.has('route'));
  check('Atelier : fidélité à 1, plus aucun bonus', f.wNot1 === 0 && base.wNot1 > 0);
  const pc = run(undefined, 'coin_aveugle', 2, 'perception', 120), pn = run({ prudenceAngles: false }, 'coin_aveugle', 2, 'perception', 120);
  check('Atelier : sans prudence aux angles morts, le plafond de vitesse ne joue plus', pc.caps > 0 && pn.caps === 0, `plafond actif ${pc.caps} fois avec, ${pn.caps} sans`);
}
process.stdout.write(JSON.stringify(out));
