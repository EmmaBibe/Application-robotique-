import { frame, canvas, theme, text, circle, slider, readout, segmented, button, buttons, checkbox, loop, drag, fmt, note } from '../core/kit.js';

// Piloter un rover martien depuis la Terre, avec le délai de communication.
// Échelle : 1 seconde du simulateur représente 1 minute réelle.
const W_M = 20, H_M = 12, R = 0.4, SPEED = 0.5, TURN = Math.PI / 4;

export function rocks() {
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const list = [];
  while (list.length < 26) {
    const r = { x: 2 + rnd() * 16, y: 1 + rnd() * 10, r: 0.3 + rnd() * 0.6 };
    if (Math.hypot(r.x - 1.5, r.y - 6) < 2 || Math.hypot(r.x - 18, r.y - 3) < 1.6) continue;
    list.push(r);
  }
  // un mur de rochers qui oblige à contourner
  for (let y = 2.5; y <= 9; y += 0.9) list.push({ x: 11, y, r: 0.45 });
  return list;
}

/** Planification à bord (autonomie 2) : A* sur une grille, en ne tenant compte que des rochers déjà vus. */
export function planPath(start, goal, rockList) {
  const C = 0.25, NX = Math.round(W_M / C), NY = Math.round(H_M / C), M = R + 0.12;
  const blocked = new Uint8Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C;
    if (x < M || y < M || x > W_M - M || y > H_M - M || rockList.some(r => Math.hypot(x - r.x, y - r.y) < r.r + M)) blocked[j * NX + i] = 1;
  }
  const cell = p => [Math.max(0, Math.min(NX - 1, Math.floor(p.x / C))), Math.max(0, Math.min(NY - 1, Math.floor(p.y / C)))];
  const [si, sj] = cell(start), [gi, gj] = cell(goal);
  if (blocked[gj * NX + gi]) return null;
  const g = new Float64Array(NX * NY).fill(Infinity), prev = new Int32Array(NX * NY).fill(-1), closed = new Uint8Array(NX * NY);
  const open = [[Math.hypot(gi - si, gj - sj), sj * NX + si]];
  g[sj * NX + si] = 0;
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, u] = open.splice(bi, 1)[0];
    if (closed[u]) continue; closed[u] = 1;
    if (u === gj * NX + gi) break;
    const ui = u % NX, uj = (u - ui) / NX;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const vi = ui + di, vj = uj + dj; if (vi < 0 || vj < 0 || vi >= NX || vj >= NY) continue;
      const v = vj * NX + vi; if (blocked[v] || closed[v]) continue;
      if (di && dj && (blocked[uj * NX + vi] || blocked[vj * NX + ui])) continue;
      const nd = g[u] + Math.hypot(di, dj);
      if (nd < g[v]) { g[v] = nd; prev[v] = u; open.push([nd + Math.hypot(gi - vi, gj - vj), v]); }
    }
  }
  if (!closed[gj * NX + gi]) return null;
  const path = []; for (let u = gj * NX + gi; u !== -1; u = prev[u]) { const i = u % NX; path.unshift({ x: (i + 0.5) * C, y: ((u - i) / NX + 0.5) * C }); }
  path[path.length - 1] = { x: goal.x, y: goal.y };
  return path;
}

export default function roverdelay(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Piloter un rover depuis la Terre', tag: 'Autonomie · espace', height: 440 });
  let delay = 8, level = 1, showTruth = false, solved = false;
  const ROCKS = rocks(), SAMPLE = { x: 18, y: 3 };
  let rover, cmds, packets, hist, clock, collisions, seen, done;

  slider(f.ctrl, { label: 'Délai Terre → Mars (1 s = 1 min réelle)', min: 0, max: 22, step: 1, value: delay, unit: 'min', onInput: v => { delay = v; } });
  segmented(f.ctrl, { label: 'Autonomie à bord', value: level, options: [{ label: '0 : ordres simples', value: 0 }, { label: '1 : aller à un point', value: 1 }, { label: '2 : planifie seul', value: 2 }], onChange: v => { level = v; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Avancer 1 m', () => send({ type: 'fwd', d: 1 }));
  button(bb, '↺ 30°', () => send({ type: 'turn', a: Math.PI / 6 }));
  button(bb, '↻ 30°', () => send({ type: 'turn', a: -Math.PI / 6 }));
  button(bb, 'Stop', () => send({ type: 'stop' }));
  const bb2 = buttons(f.ctrl);
  button(bb2, 'Nouvelle mission', reset, 'primary');
  checkbox(f.ctrl, { label: 'Voir la réalité (triche : on ne la voit jamais en vrai)', value: false, onChange: v => { showTruth = v; } });
  const ro = readout(f.ctrl, [['clk', 'Temps de mission'], ['q', 'Ordres en vol / en attente'], ['col', 'Collisions'], ['dist', 'Distance à l\'échantillon (vue Terre)']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : avec un délai de 15 minutes, atteins l\'échantillon (losange) en moins de 240 minutes de mission, sans aucune collision. Touche la carte pour envoyer un point de passage (autonomie 1 ou 2).'
    : 'Tu vois le rover tel qu\'il était il y a « délai » minutes, et tes ordres mettent le même temps pour arriver. Touche la carte pour envoyer un point de passage. Les rochers n\'apparaissent qu\'une fois photographiés par le rover.');

  function reset() {
    rover = { x: 1.5, y: 6, th: 0 };
    cmds = []; packets = []; hist = [{ t: 0, ...rover }]; clock = 0; collisions = 0; done = false;
    seen = new Set();
    f.message('');
  }
  reset();
  function send(c) { if (!done) packets.push({ t: clock, c }); }

  const cv = canvas(f.stage);
  let S = 30, ox = 0, oy = 0;
  const toW = p => ({ x: (p.x - ox) / S, y: (oy - p.y) / S });
  const off = drag(cv, {
    down: p => {
      const w = toW(p);
      if (w.x < 0 || w.y < 0 || w.x > W_M || w.y > H_M) return false;
      if (level === 0) { f.message('Avec l\'autonomie 0, le rover ne sait pas aller seul à un point : utilise les ordres simples, ou augmente son autonomie.', false); return false; }
      send({ type: 'goto', x: w.x, y: w.y });
    },
  });

  function step(h) {
    clock += h;
    // arrivée des paquets sur Mars
    for (const p of packets) if (!p.arrived && clock - p.t >= delay) { p.arrived = true; if (p.c.type === 'stop') cmds = []; else cmds.push({ ...p.c, lvl: level }); }
    packets = packets.filter(p => !p.arrived || clock - p.t < delay + 0.01);
    const c = cmds[0];
    if (c && !done) {
      if (c.type === 'turn') {
        c.left = c.left ?? c.a;
        const dA = Math.sign(c.left) * Math.min(Math.abs(c.left), TURN * h);
        rover.th += dA; c.left -= dA;
        if (Math.abs(c.left) < 1e-4) cmds.shift();
      } else if (c.type === 'fwd') {
        c.left = c.left ?? c.d;
        const dd = Math.min(c.left, SPEED * h);
        move(dd); c.left -= dd;
        if (c.left < 1e-4) cmds.shift();
      } else if (c.type === 'goto') {
        const dx = c.x - rover.x, dy = c.y - rover.y, dist = Math.hypot(dx, dy);
        if (dist < 0.25) { cmds.shift(); }
        else {
          let gx = dx / dist, gy = dy / dist;
          if (c.lvl === 2) {
            // planification à bord : on recalcule le chemin dès que la caméra découvre un nouveau rocher
            if (!c.path || c.seenN !== seen.size) {
              c.seenN = seen.size;
              c.path = planPath(rover, c, ROCKS.filter((_, i) => seen.has(i)));
              if (!c.path) { cmds.shift(); c.path = [{ x: rover.x, y: rover.y }]; }
            }
            while (c.path.length > 1 && Math.hypot(c.path[0].x - rover.x, c.path[0].y - rover.y) < 0.45) c.path.shift();
            const w = c.path[0], wd = Math.hypot(w.x - rover.x, w.y - rover.y) || 1;
            gx = (w.x - rover.x) / wd; gy = (w.y - rover.y) / wd;
          } else if (c.lvl === 1) {
            // autonomie 1 : s'arrête devant un danger au lieu de le contourner
            const ahead = ROCKS.some(r => Math.hypot(rover.x + Math.cos(rover.th) * 0.5 - r.x, rover.y + Math.sin(rover.th) * 0.5 - r.y) < r.r + R + 0.1);
            if (ahead) { cmds.shift(); }
          }
          const want = Math.atan2(gy, gx);
          const err = Math.atan2(Math.sin(want - rover.th), Math.cos(want - rover.th));
          rover.th += Math.sign(err) * Math.min(Math.abs(err), TURN * h);
          if (Math.abs(err) < (c.lvl === 2 ? 0.3 : 0.6)) move(SPEED * h);
        }
      }
    }
    // la caméra de bord découvre les rochers proches
    ROCKS.forEach((r, i) => { if (Math.hypot(r.x - rover.x, r.y - rover.y) < 3) seen.add(i); });
    hist.push({ t: clock, x: rover.x, y: rover.y, th: rover.th, seen: seen.size });
    if (hist.length > 20000) hist.splice(0, 5000);
    if (!done && Math.hypot(rover.x - SAMPLE.x, rover.y - SAMPLE.y) < 0.6) {
      done = true;
      const ok = collisions === 0;
      f.message(`Échantillon atteint après ${Math.round(clock)} minutes de mission, avec ${collisions} collision${collisions > 1 ? 's' : ''}. La Terre l'apprendra dans ${delay} minutes.`, ok);
      if (opts.goal && !solved && ok && delay >= 15 && clock < 240) { solved = true; api.success && api.success(); }
    }
  }
  function move(dd) {
    const nx = rover.x + Math.cos(rover.th) * dd, ny = rover.y + Math.sin(rover.th) * dd;
    const hit = ROCKS.find(r => Math.hypot(nx - r.x, ny - r.y) < r.r + R);
    if (hit || nx < R || ny < R || nx > W_M - R || ny > H_M - R) {
      if (hit) { collisions++; f.message(`Collision avec un rocher à ${Math.round(clock)} min ! En vrai, la roue pourrait être endommagée.`, false); }
      cmds = [];
      return;
    }
    rover.x = nx; rover.y = ny;
  }
  function delayed() {
    const target = clock - delay;
    let best = hist[0];
    for (let i = hist.length - 1; i >= 0; i--) if (hist[i].t <= target) { best = hist[i]; break; }
    return best;
  }

  const lp = loop(root, dt => {
    const n = 4; for (let i = 0; i < n; i++) step(Math.min(dt, 0.05) / n);
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const top = 46;
    S = Math.min((W - 20) / W_M, (H - top - 10) / H_M); ox = (W - S * W_M) / 2; oy = top + S * H_M;
    const P = (x, y) => [ox + x * S, oy - y * S];
    // bandeau des communications
    ctx.fillStyle = th.panel; ctx.fillRect(0, 0, W, top - 6);
    text(ctx, '🌍 Terre', 10, 26, { color: th.text, size: 12, weight: 700 });
    text(ctx, 'Mars 🔴', W - 10, 26, { color: th.text, size: 12, weight: 700, align: 'right' });
    const x0 = 80, x1 = W - 80;
    ctx.strokeStyle = th.line; ctx.beginPath(); ctx.moveTo(x0, 20); ctx.lineTo(x1, 20); ctx.stroke();
    for (const p of packets) if (!p.arrived) { const k = delay ? (clock - p.t) / delay : 1; circle(ctx, x0 + (x1 - x0) * Math.min(1, k), 20, 5, th.warn); }
    // terrain
    ctx.fillStyle = '#b5683f'; ctx.fillRect(ox, oy - H_M * S, W_M * S, H_M * S);
    const view = delayed();
    const seenAtView = view.seen ?? 0;
    ROCKS.forEach((r, i) => {
      const knownOnEarth = [...seen].indexOf(i) > -1 && [...seen].indexOf(i) < seenAtView;
      if (!(showTruth || knownOnEarth)) return;
      const [x, y] = P(r.x, r.y);
      circle(ctx, x, y, r.r * S, knownOnEarth ? '#5b3524' : 'rgba(91,53,36,.45)');
    });
    const [sx, sy] = P(SAMPLE.x, SAMPLE.y);
    ctx.fillStyle = '#7ef0ff'; ctx.beginPath(); ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 7, sy); ctx.lineTo(sx, sy + 9); ctx.lineTo(sx - 7, sy); ctx.closePath(); ctx.fill();
    // ordres de point de passage en attente
    for (const c of cmds) if (c.type === 'goto') { const [x, y] = P(c.x, c.y); circle(ctx, x, y, 5, null, th.warn, 2); }
    for (const p of packets) if (p.c.type === 'goto') { const [x, y] = P(p.c.x, p.c.y); circle(ctx, x, y, 4, null, '#fff', 1); }
    const drawRover = (s, col, a) => {
      const [x, y] = P(s.x, s.y);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-s.th);
      ctx.fillStyle = col; ctx.fillRect(-R * S, -R * S * 0.8, 2 * R * S, 1.6 * R * S);
      ctx.fillStyle = '#222'; ctx.fillRect(R * S * 0.4, -3, R * S * 0.7, 6);
      ctx.restore();
    };
    if (showTruth) drawRover(rover, '#ffffff', 0.45);
    drawRover(view, '#e8e8e8', 1);
    text(ctx, showTruth ? 'opaque : ce que voit la Terre · transparent : la réalité' : 'Ce que la Terre voit (avec le retard)', ox + 6, oy - H_M * S + 16, { color: '#fff', size: 11, weight: 600 });
    ro.set('clk', `${Math.round(clock)} min`);
    ro.set('q', `${packets.filter(p => !p.arrived).length} / ${cmds.length}`);
    ro.set('col', `${collisions}`, collisions ? 'var(--danger)' : 'var(--ok)');
    ro.set('dist', `${fmt(Math.hypot(view.x - SAMPLE.x, view.y - SAMPLE.y), 1)} m`);
  }
  return () => { off(); lp.stop(); cv.destroy(); };
}
