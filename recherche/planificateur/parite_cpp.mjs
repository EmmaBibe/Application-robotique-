// Enregistre des épisodes du portage JavaScript (entrées et commande de chaque décision) pour les rejouer en C++.
// Usage : node parite_cpp.mjs sortie.txt [pas_max] [large]
// « large » : VIGIE 6 sur les 11 scènes et les 3 conditions (33 épisodes, graines 1700 et suivantes), pour mesurer le pire cas.
import { writeFileSync } from 'node:fs';
import { createEpisode } from '../../js/sims/vigie6/episode.js';
import { SCENES, COND } from '../../js/sims/vigie6/world.js';
import { ensureTable } from '../../js/sims/vigie6/risk.js';

const out = process.argv[2] || 'rejeu.txt', maxSteps = +(process.argv[3] || 450);
ensureTable();
const LARGE = process.argv[4] === 'large';
const CASES = LARGE ? Object.keys(SCENES).flatMap((sc, i) => Object.keys(COND).map((c, j) => ['vigie', sc, 1700 + 3 * i + j, c])) : [
  ['vigie', 'goulot', 1601, 'nominal'], ['vigie', 'coin_aveugle', 1602, 'perception'], ['vigie', 'foule_dense', 1603, 'reactifs'],
  ['vigie', 'carrefour', 1604, 'nominal'], ['vigie', 'traversee', 1605, 'perception'], ['vigie', 'piege', 1606, 'nominal'],
  ['vigie', 'carrefour_rapide', 1607, 'reactifs'], ['vigie', 'poursuite', 1608, 'perception'],
  ['dra', 'foule', 1609, 'perception'], ['dra', 'carrefour', 1610, 'nominal'],
];
const L = [], f = x => String(x);
for (const [which, scene, seed, cond] of CASES) {
  const ep = createEpisode(scene, seed, which, cond);
  const pl = ep.planner, steps = [];
  const act = pl.act.bind(pl);
  pl.act = (t, s, obs) => { const u = act(t, s, obs); steps.push([t, [...s], obs.map(o => [...o]), [u[0], u[1]]]); return u; };
  let n = 0;
  while (!ep.outcome && n < maxSteps) { ep.step(); n++; }
  const w = ep.world;
  L.push(`EP ${which} ${seed} ${which === 'vigie' ? pl.N : pl.N} ${which === 'vigie' ? pl.NFREE : 0} ${pl.lat} ${pl.occl ? 1 : 0} ${f(pl.sense)} ${w.static.length} ${f(w.goal[0])} ${f(w.goal[1])}`);
  for (const [x, y, r] of w.static) L.push(`S ${f(x)} ${f(y)} ${f(r)}`);
  for (const [t, s, obs, u] of steps) {
    L.push(`STEP ${f(t)} ${f(s[0])} ${f(s[1])} ${f(s[2])} ${obs.length} ${f(u[0])} ${f(u[1])}`);
    for (const o of obs) L.push(`O ${o.map(f).join(' ')}`);
  }
  L.push('END');
  console.log(`${which} ${scene} ${cond} : ${steps.length} décisions, issue ${ep.outcome || 'en cours'}`);
}
writeFileSync(out, L.join('\n') + '\n');
