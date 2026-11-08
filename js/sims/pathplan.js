import { frame, canvas, theme, text, slider, readout, segmented, checkbox, button, buttons, loop, drag, fmt, note } from '../core/kit.js';

// Planification de chemin sur grille : BFS, Dijkstra, A*, glouton.
// On dessine les murs et la boue au doigt, on déplace départ et arrivée.
export default function pathplan(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Planificateur de chemin', tag: 'Planification', height: 430 });
  const C = 30, R = 18;
  let algo = 'astar', brush = 'wall', diag = false, speed = 20, heurW = 1;
  let cells, start = { c: 3, r: 9 }, goal = { c: 26, r: 8 };
  let run = null, solved = false;

  segmented(f.ctrl, { label: 'Algorithme', value: algo, options: [{ label: 'BFS', value: 'bfs' }, { label: 'Dijkstra', value: 'dijkstra' }, { label: 'A*', value: 'astar' }, { label: 'Glouton', value: 'greedy' }], onChange: v => { algo = v; startRun(); } });
  segmented(f.ctrl, { label: 'Pinceau', value: brush, options: [{ label: 'Mur', value: 'wall' }, { label: 'Boue (coût 5)', value: 'mud' }, { label: 'Gomme', value: 'erase' }], onChange: v => { brush = v; } });
  checkbox(f.ctrl, { label: 'Déplacements en diagonale', value: diag, onChange: v => { diag = v; startRun(); } });
  slider(f.ctrl, { label: 'Vitesse d\'animation', min: 1, max: 200, step: 1, value: speed, unit: 'cases/img', onInput: v => { speed = v; } });
  slider(f.ctrl, { label: 'Poids de l\'heuristique (A*)', min: 0, max: 5, step: 0.1, value: heurW, onInput: v => { heurW = v; startRun(); } });
  const bb = buttons(f.ctrl);
  button(bb, 'Chercher', startRun, 'primary');
  button(bb, 'Vider', () => { clear(); startRun(); });
  if (!opts.goal) button(bb, 'Labyrinthe', () => { maze(); startRun(); });
  const ro = readout(f.ctrl, [['exp', 'Cases explorées'], ['len', 'Longueur du chemin'], ['cost', 'Coût total'], ['opt', 'Optimal garanti ?']]);
  note(f.ctrl, opts.goal === 'maze'
    ? '<b>Défi créatif</b> : dessine des murs qui obligent A* à explorer au moins 300 cases, tout en laissant un chemin possible. On part d\'une carte vide.'
    : 'Dessine au doigt. Fais glisser le point vert (départ) et le drapeau (arrivée). Compare le nombre de cases explorées par chaque algorithme.');

  function clear() { cells = Array.from({ length: R }, () => Array(C).fill(0)); }
  function maze() {
    clear();
    for (let c = 6; c < C - 3; c += 4) {
      const gap = 1 + Math.floor(Math.random() * (R - 2));
      for (let r = 0; r < R; r++) if (Math.abs(r - gap) > 1) cells[r][c] = 1;
    }
    for (let i = 0; i < 40; i++) { const r = Math.floor(Math.random() * R), c = Math.floor(Math.random() * C); if (!cells[r][c]) cells[r][c] = 2; }
    cells[start.r][start.c] = cells[goal.r][goal.c] = 0;
  }
  clear();
  if (!opts.goal) {
    for (let r = 3; r < 15; r++) cells[r][14] = 1;
    for (let c = 18; c < 23; c++) for (let r = 6; r < 12; r++) cells[r][c] = 2;
  }

  const key = (c, r) => r * C + c;
  function* search() {
    const H = (c, r) => {
      const dx = Math.abs(c - goal.c), dy = Math.abs(r - goal.r);
      return diag ? (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)) : dx + dy;
    };
    const g = new Map(), came = new Map(), closed = new Set();
    const open = [{ c: start.c, r: start.r, f: 0, g: 0 }];
    g.set(key(start.c, start.r), 0);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (diag) dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    while (open.length) {
      let bi = 0;
      if (algo !== 'bfs') for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      const k = key(cur.c, cur.r);
      if (closed.has(k)) continue;
      closed.add(k);
      yield { closed, open, came };
      if (cur.c === goal.c && cur.r === goal.r) {
        const path = [[cur.c, cur.r]]; let kk = k;
        while (came.has(kk)) { kk = came.get(kk); path.push([kk % C, Math.floor(kk / C)]); }
        return { closed, open, came, path: path.reverse(), cost: g.get(k) };
      }
      for (const [dc, dr] of dirs) {
        const nc = cur.c + dc, nr = cur.r + dr;
        if (nc < 0 || nr < 0 || nc >= C || nr >= R || cells[nr][nc] === 1) continue;
        if (dc && dr && (cells[cur.r][nc] === 1 || cells[nr][cur.c] === 1)) continue; // pas de coin coupé
        const nk = key(nc, nr);
        if (closed.has(nk)) continue;
        const step = (dc && dr ? Math.SQRT2 : 1) * (cells[nr][nc] === 2 ? 5 : 1);
        const ng = cur.g + (algo === 'bfs' ? 1 : step);
        if (algo === 'bfs') { if (g.has(nk)) continue; }
        else if (g.has(nk) && g.get(nk) <= ng) continue;
        g.set(nk, ng); came.set(nk, k);
        const fv = algo === 'dijkstra' ? ng : algo === 'astar' ? ng + heurW * H(nc, nr) : algo === 'greedy' ? H(nc, nr) : 0;
        open.push({ c: nc, r: nr, g: ng, f: fv });
      }
    }
    return { closed, open, came, path: null };
  }
  function startRun() { run = { it: search(), st: null, done: false }; }
  startRun();

  const cv = canvas(f.stage);
  let cs = 20, ox = 0, oy = 0, grab = null;
  const cellAt = p => ({ c: Math.floor((p.x - ox) / cs), r: Math.floor((p.y - oy) / cs) });
  const paint = p => {
    const { c, r } = cellAt(p);
    if (c < 0 || r < 0 || c >= C || r >= R) return;
    if ((c === start.c && r === start.r) || (c === goal.c && r === goal.r)) return;
    const v = brush === 'wall' ? 1 : brush === 'mud' ? 2 : 0;
    if (cells[r][c] !== v) { cells[r][c] = v; startRun(); }
  };
  const off = drag(cv, {
    down: p => {
      const { c, r } = cellAt(p);
      if (c === start.c && r === start.r) grab = 'start';
      else if (c === goal.c && r === goal.r) grab = 'goal';
      else { grab = 'paint'; paint(p); }
    },
    move: p => {
      if (grab === 'paint') return paint(p);
      const { c, r } = cellAt(p);
      if (c < 0 || r < 0 || c >= C || r >= R || cells[r][c] === 1) return;
      const o = grab === 'start' ? start : goal;
      if (o.c !== c || o.r !== r) { o.c = c; o.r = r; startRun(); }
    },
    up: () => { grab = null; },
  });

  const lp = loop(root, () => {
    if (run && !run.done) {
      for (let i = 0; i < speed; i++) {
        const n = run.it.next();
        run.st = n.value;
        if (n.done) { run.done = true; onDone(); break; }
      }
    }
    draw();
  });
  function onDone() {
    const st = run.st;
    const len = st.path ? st.path.length - 1 : 0;
    ro.set('exp', `${st.closed.size}`);
    ro.set('len', st.path ? `${len} pas` : 'aucun chemin', st.path ? '' : 'var(--danger)');
    ro.set('cost', st.path ? fmt(st.cost, 1) : '—');
    ro.set('opt', algo === 'dijkstra' || (algo === 'astar' && heurW <= 1) ? 'oui' : algo === 'bfs' ? 'oui si tous les coûts sont égaux' : 'non', algo === 'greedy' || heurW > 1 ? 'var(--warn)' : 'var(--ok)');
    if (opts.goal === 'maze' && !solved && algo === 'astar' && heurW <= 1 && st.path && st.closed.size >= 300) {
      solved = true; f.message(`${st.closed.size} cases explorées et un chemin trouvé : ton labyrinthe piège bien l'heuristique.`); api.success && api.success();
    }
  }

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, Hh = cv.h;
    ctx.clearRect(0, 0, W, Hh);
    cs = Math.floor(Math.min(W / C, Hh / R));
    ox = Math.floor((W - cs * C) / 2); oy = Math.floor((Hh - cs * R) / 2);
    const st = run && run.st;
    const closed = st ? st.closed : new Set();
    const openSet = new Set(st ? st.open.map(o => key(o.c, o.r)) : []);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const k = key(c, r), v = cells[r][c];
      let col = th.panel;
      if (v === 1) col = th.text;
      else if (v === 2) col = '#8a6a3a';
      if (v !== 1 && closed.has(k)) col = v === 2 ? '#6d5a8a' : th.accent2 + '55';
      if (v !== 1 && openSet.has(k)) col = th.warn + '88';
      ctx.fillStyle = col;
      ctx.fillRect(ox + c * cs + 0.5, oy + r * cs + 0.5, cs - 1, cs - 1);
    }
    if (st && st.path) {
      ctx.strokeStyle = th.accent; ctx.lineWidth = Math.max(3, cs * 0.3); ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath();
      st.path.forEach(([c, r], i) => { const x = ox + c * cs + cs / 2, y = oy + r * cs + cs / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    const dot = (o, col, lab) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ox + o.c * cs + cs / 2, oy + o.r * cs + cs / 2, cs * 0.42, 0, 7); ctx.fill();
      text(ctx, lab, ox + o.c * cs + cs / 2, oy + o.r * cs + cs / 2 + 4, { color: '#0b1220', size: Math.max(9, cs * 0.45), align: 'center', weight: 800 });
    };
    dot(start, th.ok, 'D');
    dot(goal, th.danger, 'A');
    if (run && !run.done) ro.set('exp', `${closed.size}…`);
  }
  return () => { off(); lp.stop(); cv.destroy(); };
}
