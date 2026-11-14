import { frame, canvas, theme, text, slider, readout, segmented, button, buttons, loop, fmt, plot, note } from '../core/kit.js';

// Essaim d'exploration : plusieurs robots cartographient une grotte inconnue.
const CW = 48, CH = 30;

export function makeCave(seed = 11) {
  let sd = seed; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  let g = Array.from({ length: CH }, (_, y) => Array.from({ length: CW }, (_, x) => (x === 0 || y === 0 || x === CW - 1 || y === CH - 1) ? 1 : (rnd() < 0.45 ? 1 : 0)));
  for (let it = 0; it < 5; it++) {
    g = g.map((row, y) => row.map((v, x) => {
      if (x === 0 || y === 0 || x === CW - 1 || y === CH - 1) return 1;
      let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) n += g[y + j][x + i];
      return n >= 5 ? 1 : 0;
    }));
  }
  for (let y = 13; y <= 16; y++) for (let x = 1; x <= 4; x++) g[y][x] = 0; // entrée
  // ne garder que la zone connectée à l'entrée
  const seen = new Set(['2,14']); const q = [[2, 14]];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!g[ny][nx] && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } } }
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (!seen.has(x + ',' + y)) g[y][x] = 1;
  return g;
}

export function createSwarm(cave, { n, range, strategy }) {
  // simulation pas à pas, sans dessin : utilisée par le simulateur et par les tests
  const known = cave.map(r => r.map(() => 0));
  const free = cave.flat().filter(v => !v).length;
  let seenN = 0, sd = 3;
  const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const robots = Array.from({ length: n }, (_, i) => ({ x: 2 + (i % 2), y: 13 + (i % 4), path: [], target: null }));
  const look = r => {
    for (let j = -range; j <= range; j++) for (let i = -range; i <= range; i++) {
      const x = r.x + i, y = r.y + j;
      if (x < 0 || y < 0 || x >= CW || y >= CH || i * i + j * j > range * range) continue;
      if (!known[y][x]) { known[y][x] = cave[y][x] ? 2 : 1; if (!cave[y][x]) seenN++; }
    }
  };
  robots.forEach(look);
  const curve = [];
  const isFrontier = (x, y) => known[y][x] === 1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => known[y + dy]?.[x + dx] === 0);
  function plan(r) {
    const prev = new Map([[r.x + ',' + r.y, null]]); const q = [[r.x, r.y, 0]]; let best = null, bestCost = Infinity;
    for (let h = 0; h < q.length; h++) {
      const [x, y, d] = q[h];
      if (d > 0 && isFrontier(x, y)) {
        let cost = d;
        if (strategy === 'coord') for (const o of robots) if (o !== r && o.target) { const dd = Math.abs(o.target[0] - x) + Math.abs(o.target[1] - y); if (dd < 8) cost += (8 - dd) * 3; }
        if (cost < bestCost) { bestCost = cost; best = [x, y]; }
        if (strategy === 'glouton') break;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (known[ny]?.[nx] === 1 && !prev.has(k)) { prev.set(k, x + ',' + y); q.push([nx, ny, d + 1]); }
      }
    }
    if (!best) return [];
    const path = []; let k = best[0] + ',' + best[1];
    while (k && k !== r.x + ',' + r.y) { const [x, y] = k.split(',').map(Number); path.unshift([x, y]); k = prev.get(k); }
    r.target = best;
    return path;
  }
  function step() {
    for (const r of robots) {
      if (strategy === 'aleatoire') {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !cave[r.y + dy][r.x + dx]);
        const [dx, dy] = opts[Math.floor(rnd() * opts.length)]; r.x += dx; r.y += dy;
      } else {
        if (!r.path.length || (r.target && !isFrontier(r.target[0], r.target[1]))) r.path = plan(r);
        const nx = r.path.shift(); if (nx) { r.x = nx[0]; r.y = nx[1]; }
      }
      look(r);
    }
    curve.push(seenN / free * 100);
  }
  return { known, robots, curve, step, get pct() { return seenN / free * 100; }, free };
}

export function runSwarm(cave, params, steps) {
  const sw = createSwarm(cave, params);
  for (let t = 0; t < steps; t++) sw.step();
  return sw;
}

export default function swarm(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Essaim d\'exploration d\'une grotte de lave', tag: 'Multi-robots', height: 420 });
  const cave = makeCave();
  let n = 4, range = 2, strategy = 'glouton', speed = 8, t = 0, res = null, solved = false;
  const LIMIT = 120;
  segmented(f.ctrl, { label: 'Stratégie', value: strategy, options: [{ label: 'Au hasard', value: 'aleatoire' }, { label: 'Frontière la plus proche', value: 'glouton' }, { label: 'Frontières coordonnées', value: 'coord' }], onChange: v => { strategy = v; restart(); } });
  slider(f.ctrl, { label: 'Nombre de robots', min: 1, max: 12, step: 1, value: n, onInput: v => { n = v; restart(); } });
  slider(f.ctrl, { label: 'Portée des capteurs', min: 1, max: 4, step: 1, value: range, unit: 'cases', onInput: v => { range = v; restart(); } });
  slider(f.ctrl, { label: 'Vitesse d\'animation', min: 1, max: 40, step: 1, value: speed, onInput: v => { speed = v; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Relancer', restart, 'primary');
  const ro = readout(f.ctrl, [['t', 'Pas de temps'], ['cov', 'Grotte cartographiée'], ['t90', 'Temps pour 90 %']]);
  note(f.ctrl, opts.goal
    ? `<b>Défi</b> : cartographier 90 % de la grotte en moins de ${LIMIT} pas, avec 5 robots au plus et une portée de 2 cases.`
    : 'Une frontière, c\'est la limite entre le connu et l\'inconnu. Aller à la frontière la plus proche est efficace pour un robot seul, mais plusieurs robots risquent alors de viser le même endroit. La coordination répartit le travail.');

  let t90 = null;
  function restart() { t = 0; t90 = null; res = createSwarm(cave, { n, range, strategy }); f.message(''); }
  restart();

  const cv = canvas(f.stage);
  let acc = 0;
  const lp = loop(root, dt => {
    acc += dt * speed * 6;
    const k = Math.floor(acc); acc -= k;
    if (k > 0 && t < 600 && res.pct < 99.5) {
      for (let i = 0; i < k && t < 600; i++) { res.step(); t++; }
      if (t90 === null && res.pct >= 90) {
        t90 = t;
        const ok = t90 <= LIMIT && n <= 5 && range <= 2;
        f.message(`90 % atteints en ${t90} pas avec ${n} robot${n > 1 ? 's' : ''}.`, ok || !opts.goal);
        if (opts.goal && !solved && ok) { solved = true; api.success && api.success(); }
      }
    }
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const gw = W * 0.64, cs = Math.min(gw / CW, (H - 20) / CH), ox = 8, oy = (H - cs * CH) / 2;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const k = res.known[y][x];
      ctx.fillStyle = k === 0 ? '#14100e' : k === 2 ? '#7a4a33' : '#e9c9a8';
      ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs);
    }
    const cols = ['#2aa7ff', '#35d0ba', '#ffb547', '#f472b6', '#a78bfa', '#4ade80', '#ff6b6b', '#ffffff', '#00e5ff', '#ffd54f', '#9ccc65', '#ff8a65'];
    res.robots.forEach((r, i) => {
      ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(ox + (r.x + 0.5) * cs, oy + (r.y + 0.5) * cs, cs * 0.45, 0, 7); ctx.fill();
      if (r.target) { ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 1; ctx.strokeRect(ox + r.target[0] * cs, oy + r.target[1] * cs, cs, cs); }
    });
    text(ctx, 'entrée', ox + 2, oy + 12.5 * cs, { color: '#fff', size: 10 });
    plot(ctx, { x: ox + gw + 14, y: oy, w: W - gw - 30, h: cs * CH }, [{ ys: res.curve, color: th.accent, label: '% cartographié' }], { xmin: 0, xmax: Math.max(LIMIT, t), ymin: 0, ymax: 100, th, hlines: [{ v: 90, color: th.warn, label: '90 %' }] });
    ro.set('t', `${t}`);
    ro.set('cov', `${fmt(res.pct, 1)} %`);
    ro.set('t90', t90 === null ? '…' : `${t90} pas`, t90 !== null && t90 <= LIMIT ? 'var(--ok)' : '');
  }
  return () => { lp.stop(); cv.destroy(); };
}
