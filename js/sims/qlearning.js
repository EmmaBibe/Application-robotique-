import { frame, canvas, theme, text, slider, readout, button, buttons, checkbox, loop, fmt, plot, note } from '../core/kit.js';

// Apprentissage par renforcement (Q-learning) : un robot apprend seul à rejoindre
// sa base de recharge en évitant les trous, sans qu'on lui donne la carte.
export default function qlearning(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Apprentissage par renforcement', tag: 'IA', height: 400 });
  const C = 8, R = 6;
  const map = [
    '........',
    '.##..X..',
    '.#...#..',
    '...X.#..',
    '.X...#.G',
    'S....X..',
  ];
  const start = { c: 0, r: 5 };
  let alpha = 0.3, gamma = 0.95, eps = 0.2, speed = 30, showQ = true, train = false;
  let Q, agent, ep, steps, rewards, curR, solved = false;
  const A = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche

  slider(f.ctrl, { label: 'α : vitesse d\'apprentissage', min: 0.01, max: 1, step: 0.01, value: alpha, onInput: v => { alpha = v; } });
  slider(f.ctrl, { label: 'γ : importance du futur', min: 0, max: 0.99, step: 0.01, value: gamma, onInput: v => { gamma = v; } });
  slider(f.ctrl, { label: 'ε : curiosité (exploration)', min: 0, max: 1, step: 0.01, value: eps, onInput: v => { eps = v; } });
  slider(f.ctrl, { label: 'Vitesse', min: 1, max: 500, step: 1, value: speed, unit: 'pas/img', onInput: v => { speed = v; } });
  const bb = buttons(f.ctrl);
  const tb = button(bb, 'Apprendre', () => { train = !train; tb.textContent = train ? 'Pause' : 'Apprendre'; }, 'primary');
  button(bb, 'Oublier tout', reset);
  checkbox(f.ctrl, { label: 'Afficher la politique apprise (flèches)', value: showQ, onChange: v => { showQ = v; } });
  const ro = readout(f.ctrl, [['ep', 'Épisodes'], ['last', 'Récompense du dernier épisode'], ['pol', 'La politique atteint la base ?']]);
  note(f.ctrl, 'Récompenses : +10 sur la base, −10 dans un trou, −0,1 par déplacement (le temps, c\'est de la batterie). Q(s,a) ← Q + α [r + γ·max Q(s\') − Q]. Personne ne dit au robot quoi faire : il essaie, se trompe, retient.');

  function reset() {
    Q = Array.from({ length: R * C }, () => [0, 0, 0, 0]);
    agent = { ...start }; ep = 0; steps = 0; rewards = []; curR = 0; solved = false;
  }
  reset();
  const cell = (c, r) => map[r][c];

  function stepAgent() {
    const s = agent.r * C + agent.c;
    let a;
    if (Math.random() < eps) a = Math.floor(Math.random() * 4);
    else { const q = Q[s], m = Math.max(...q); const best = [0, 1, 2, 3].filter(i => q[i] === m); a = best[Math.floor(Math.random() * best.length)]; }
    let nc = agent.c + A[a][0], nr = agent.r + A[a][1];
    let r = -0.1;
    if (nc < 0 || nr < 0 || nc >= C || nr >= R || cell(nc, nr) === '#') { nc = agent.c; nr = agent.r; r = -0.5; }
    const t = cell(nc, nr);
    let done = false;
    if (t === 'G') { r = 10; done = true; }
    if (t === 'X') { r = -10; done = true; }
    const s2 = nr * C + nc;
    const target = r + (done ? 0 : gamma * Math.max(...Q[s2]));
    Q[s][a] += alpha * (target - Q[s][a]);
    curR += r; steps++;
    agent = { c: nc, r: nr };
    if (done || steps > 200) {
      rewards.push(curR); if (rewards.length > 300) rewards.shift();
      ep++; curR = 0; steps = 0; agent = { ...start };
    }
  }
  function greedyPath() {
    let c = start.c, r = start.r; const path = [[c, r]];
    for (let i = 0; i < 60; i++) {
      const q = Q[r * C + c], a = q.indexOf(Math.max(...q));
      const nc = c + A[a][0], nr = r + A[a][1];
      if (nc < 0 || nr < 0 || nc >= C || nr >= R || cell(nc, nr) === '#') return { path, ok: false };
      c = nc; r = nr; path.push([c, r]);
      if (cell(c, r) === 'G') return { path, ok: true };
      if (cell(c, r) === 'X') return { path, ok: false };
    }
    return { path, ok: false };
  }

  const cv = canvas(f.stage);
  const lp = loop(root, () => {
    if (train) for (let i = 0; i < speed; i++) stepAgent();
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const gw = Math.min(W * 0.62, (H - 20) * C / R);
    const cs = gw / C, ox = 10, oy = (H - cs * R) / 2;
    let vmax = 0.01; for (const q of Q) vmax = Math.max(vmax, Math.abs(Math.max(...q)));
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const t = cell(c, r), x = ox + c * cs, y = oy + r * cs;
      const v = Math.max(...Q[r * C + c]);
      let col = th.panel;
      if (t === '#') col = th.text;
      else if (t === 'X') col = th.danger + 'aa';
      else if (t === 'G') col = th.ok + 'aa';
      ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      if (t === '.' || t === 'S') {
        ctx.fillStyle = v >= 0 ? th.accent : th.danger;
        ctx.globalAlpha = Math.min(0.55, Math.abs(v) / vmax * 0.55);
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2); ctx.globalAlpha = 1;
        if (showQ && Q[r * C + c].some(q => q !== 0)) {
          const a = Q[r * C + c].indexOf(v), d = A[a];
          ctx.strokeStyle = th.text; ctx.fillStyle = th.text; ctx.lineWidth = 2;
          const mx = x + cs / 2, my = y + cs / 2;
          ctx.beginPath(); ctx.moveTo(mx - d[0] * cs * 0.22, my - d[1] * cs * 0.22); ctx.lineTo(mx + d[0] * cs * 0.22, my + d[1] * cs * 0.22); ctx.stroke();
          ctx.beginPath(); ctx.arc(mx + d[0] * cs * 0.22, my + d[1] * cs * 0.22, 3, 0, 7); ctx.fill();
        }
      }
      if (t === 'G') text(ctx, '⚡', x + cs / 2, y + cs / 2 + 7, { size: cs * 0.45, align: 'center', color: th.text });
      if (t === 'X') text(ctx, 'trou', x + cs / 2, y + cs / 2 + 4, { size: 10, align: 'center', color: '#fff', weight: 700 });
      if (t === 'S') text(ctx, 'départ', x + cs / 2, y + cs - 5, { size: 9, align: 'center', color: th.muted });
    }
    const gp = greedyPath();
    if (gp.ok) {
      ctx.strokeStyle = th.warn; ctx.lineWidth = 3; ctx.beginPath();
      gp.path.forEach(([c, r], i) => { const x = ox + c * cs + cs / 2, y = oy + r * cs + cs / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    ctx.fillStyle = th.accent2; ctx.beginPath(); ctx.arc(ox + agent.c * cs + cs / 2, oy + agent.r * cs + cs / 2, cs * 0.28, 0, 7); ctx.fill();
    const rx = ox + gw + 16, rw = W - rx - 10;
    if (rw > 100) plot(ctx, { x: rx, y: oy, w: rw, h: cs * R }, [{ ys: rewards, color: th.accent, label: 'récompense / épisode' }], { th, ymin: -25, ymax: 12 });
    ro.set('ep', `${ep}`);
    ro.set('last', rewards.length ? fmt(rewards[rewards.length - 1], 1) : '—');
    ro.set('pol', gp.ok ? `oui, en ${gp.path.length - 1} pas` : 'pas encore', gp.ok ? 'var(--ok)' : '');
    if (opts.goal && !solved && gp.ok && gp.path.length - 1 <= 16) { solved = true; f.message(`Politique optimale trouvée : ${gp.path.length - 1} déplacements. Le robot a appris seul.`); api.success && api.success(); }
  }
  return () => { lp.stop(); cv.destroy(); };
}
