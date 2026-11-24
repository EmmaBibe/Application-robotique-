// Rejoue en JavaScript les cas écrits par parite_monde2.py et donne l'écart maximal de position et de vitesse.
import { readFileSync } from 'node:fs';
import { World } from '../../js/sims/vigie6/world.js';

const cas = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let pire = 0, ou = '', pirePas = 0, ouPas = '';
for (const c of cas) {
  const w = new World('perso', 0, { static: [], people: [] }, { version: 2 });
  w.static = c.depart.static.map(x => [...x]);
  w.dyn = c.depart.dyn.map(o => ({ ...o, p: [...o.p], v: [...o.v], reactif: false }));
  for (let i = 0; i < c.traj.length; i++) {
    w.step(i * 0.1, [6.0, 10.0], false);
    w.dyn.forEach((o, k) => {
      const e = Math.max(...[o.p[0], o.p[1], o.v[0], o.v[1]].map((x, q) => Math.abs(x - c.traj[i][k][q])));
      if (e > pire) { pire = e; ou = `${c.scene} ${c.seed} pas ${i} personne ${k}`; }
    });
  }
}
// Pas à pas : avant chaque pas, on remet positions et vitesses à l'état Python. Isole la logique de l'arrondi accumulé
// (la poursuite amplifie des écarts de 1e-12 : le poursuivant vise le robot, la moindre différence se propage).
for (const c of cas) {
  const w = new World('perso', 0, { static: [], people: [] }, { version: 2 });
  w.static = c.depart.static.map(x => [...x]);
  w.dyn = c.depart.dyn.map(o => ({ ...o, p: [...o.p], v: [...o.v], reactif: false }));
  for (let i = 0; i < c.traj.length; i++) {
    if (i > 0) w.dyn.forEach((o, k) => { const s = c.traj[i - 1][k]; o.p = [s[0], s[1]]; o.v = [s[2], s[3]]; });
    w.step(i * 0.1, [6.0, 10.0], false);
    w.dyn.forEach((o, k) => {
      const e = Math.max(...[o.p[0], o.p[1], o.v[0], o.v[1]].map((x, q) => Math.abs(x - c.traj[i][k][q])));
      if (e > pirePas) { pirePas = e; ouPas = `${c.scene} ${c.seed} pas ${i} personne ${k}`; }
    });
  }
}
console.log(`pas à pas : écart maximal ${pirePas.toExponential(2)}${pirePas ? ` (${ouPas})` : ''}`);
console.log(`${cas.length} cas, trajectoires entières : écart maximal ${pire.toExponential(2)}${pire ? ` (${ou})` : ''}`);
process.exit(pirePas < 1e-12 ? 0 : 1);
