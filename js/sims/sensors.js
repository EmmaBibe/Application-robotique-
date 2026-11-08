import { frame, canvas, theme, text, circle, slider, readout, segmented, checkbox, loop, drag, fmt, randn, note } from '../core/kit.js';

// Capteurs de distance : lidar, ultrason, infrarouge. Lancer de rayons dans une pièce.
export default function sensors(root, opts = {}) {
  const f = frame(root, { title: opts.title || 'Ce que « voit » un robot : capteurs de distance', tag: 'Perception', height: 420 });
  let type = 'lidar', nRays = 90, range = 4, sigma = 0.02, spin = true, showCloud = true;
  const robot = { x: 2.2, y: 1.6, th: 0 };
  const walls = [
    [0, 0, 6, 0], [6, 0, 6, 4], [6, 4, 0, 4], [0, 4, 0, 0],
    [1.5, 2.6, 2.6, 2.6], [2.6, 2.6, 2.6, 3.3],
    [4, 0.8, 4.8, 0.8], [4.8, 0.8, 4.8, 1.8], [4.8, 1.8, 4, 1.8], [4, 1.8, 4, 0.8],
    [3.6, 3.2, 5.2, 2.6],
  ];
  const circles = [{ x: 1, y: 1, r: 0.25 }, { x: 5.2, y: 3.4, r: 0.2 }];

  segmented(f.ctrl, { label: 'Capteur', value: type, options: [{ label: 'Lidar 2D', value: 'lidar' }, { label: 'Ultrason', value: 'us' }, { label: 'Infrarouge', value: 'ir' }], onChange: v => { type = v; } });
  slider(f.ctrl, { label: 'Nombre de rayons (lidar)', min: 8, max: 360, step: 1, value: nRays, onInput: v => { nRays = v; } });
  slider(f.ctrl, { label: 'Portée maximale', min: 0.5, max: 8, step: 0.1, value: range, unit: 'm', onInput: v => { range = v; } });
  slider(f.ctrl, { label: 'Bruit de mesure σ', min: 0, max: 0.2, step: 0.005, value: sigma, unit: 'm', onInput: v => { sigma = v; } });
  checkbox(f.ctrl, { label: 'Le robot tourne sur lui-même', value: spin, onChange: v => { spin = v; } });
  checkbox(f.ctrl, { label: 'Nuage de points (vue du robot)', value: showCloud, onChange: v => { showCloud = v; } });
  const ro = readout(f.ctrl, [['min', 'Obstacle le plus proche'], ['spec', 'Caractéristiques']]);
  note(f.ctrl, 'Déplace le robot en le faisant glisser. Chaque capteur a ses angles morts : un ultrason a un cône large et flou, un infrarouge est précis mais court, un lidar voit tout autour mais coûte cher.');

  function cast(ox, oy, a, maxR) {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = maxR;
    for (const [x1, y1, x2, y2] of walls) {
      const ex = x2 - x1, ey = y2 - y1;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((x1 - ox) * ey - (y1 - oy) * ex) / den;
      const u = ((x1 - ox) * dy - (y1 - oy) * dx) / den;
      if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
    }
    for (const c of circles) {
      const fx = ox - c.x, fy = oy - c.y;
      const b = fx * dx + fy * dy, cc = fx * fx + fy * fy - c.r * c.r;
      const disc = b * b - cc;
      if (disc >= 0) { const t = -b - Math.sqrt(disc); if (t > 0 && t < best) best = t; }
    }
    return best;
  }

  const cv = canvas(f.stage);
  let S = 60, ox = 0, oy = 0;
  const toW = p => ({ x: (p.x - ox) / S, y: (oy - p.y) / S });
  const off = drag(cv, {
    down: p => { const w = toW(p); if (Math.hypot(w.x - robot.x, w.y - robot.y) > 0.4) return false; },
    move: p => { const w = toW(p); robot.x = Math.max(0.2, Math.min(5.8, w.x)); robot.y = Math.max(0.2, Math.min(3.8, w.y)); },
  });

  const lp = loop(root, dt => { if (spin) robot.th += 0.5 * dt; draw(); });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const cloudW = showCloud && W > 560 ? W * 0.34 : 0;
    S = Math.min((W - cloudW - 30) / 6, (H - 30) / 4);
    ox = 15; oy = 15 + 4 * S;
    const P = (x, y) => [ox + x * S, oy - y * S];
    ctx.fillStyle = th.panel; ctx.fillRect(ox, oy - 4 * S, 6 * S, 4 * S);
    ctx.strokeStyle = th.text; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [x1, y1, x2, y2] of walls) { const a = P(x1, y1), b = P(x2, y2); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    for (const c of circles) { const [cx, cy] = P(c.x, c.y); circle(ctx, cx, cy, c.r * S, th.faint, th.text, 2); }
    const [rx, ry] = P(robot.x, robot.y);
    const hits = [];
    let minD = Infinity;
    if (type === 'lidar') {
      for (let i = 0; i < nRays; i++) {
        const a = robot.th + (i / nRays) * Math.PI * 2;
        const d0 = cast(robot.x, robot.y, a, range);
        const hit = d0 < range;
        const d = hit ? Math.max(0, d0 + sigma * randn()) : range;
        if (hit) { minD = Math.min(minD, d); hits.push([a - robot.th, d]); }
        const [hx, hy] = P(robot.x + Math.cos(a) * d, robot.y + Math.sin(a) * d);
        ctx.strokeStyle = th.danger + '40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(hx, hy); ctx.stroke();
        if (hit) circle(ctx, hx, hy, 2.4, th.danger);
      }
    } else {
      const cone = type === 'us' ? 0.26 : 0.03;           // demi-angle du faisceau
      const maxR = type === 'us' ? Math.min(range, 4) : Math.min(range, 0.8);
      const minR = type === 'us' ? 0.02 : 0.1;
      let d = maxR;
      for (let k = -6; k <= 6; k++) d = Math.min(d, cast(robot.x, robot.y, robot.th + (k / 6) * cone, maxR));
      const real = d;
      d = d < maxR ? Math.max(minR, d + sigma * randn()) : maxR;
      if (real < maxR) minD = d;
      ctx.fillStyle = (type === 'us' ? th.accent2 : th.danger) + '30';
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.arc(rx, ry, d * S, -robot.th - cone, -robot.th + cone); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = type === 'us' ? th.accent2 : th.danger; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rx, ry, d * S, -robot.th - cone, -robot.th + cone); ctx.stroke();
      if (type === 'us') {
        ctx.strokeStyle = th.accent2 + '55'; ctx.lineWidth = 1;
        for (let k = 1; k < 4; k++) { const rr = ((performance.now() / 600 + k / 4) % 1) * d * S; ctx.beginPath(); ctx.arc(rx, ry, rr, -robot.th - cone, -robot.th + cone); ctx.stroke(); }
      }
    }
    circle(ctx, rx, ry, 0.18 * S, th.accent2, th.bg, 2);
    ctx.strokeStyle = th.bg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(robot.th) * 0.18 * S, ry - Math.sin(robot.th) * 0.18 * S); ctx.stroke();
    text(ctx, '1 m', ox + S / 2, oy + 12, { color: th.faint, size: 10, align: 'center' });
    ctx.fillStyle = th.faint; ctx.fillRect(ox, oy + 2, S, 2);

    if (cloudW && type === 'lidar') {
      const cx = W - cloudW / 2 - 6, cy = H / 2, sc = Math.min(cloudW, H) / (2 * range + 0.4);
      ctx.fillStyle = th.bg; ctx.strokeStyle = th.line; ctx.lineWidth = 1;
      ctx.fillRect(W - cloudW - 6, 10, cloudW, H - 20); ctx.strokeRect(W - cloudW - 6, 10, cloudW, H - 20);
      for (let r = 1; r <= range; r++) circle(ctx, cx, cy, r * sc, null, th.line, 1);
      for (const [a, d] of hits) circle(ctx, cx + Math.cos(a) * d * sc, cy - Math.sin(a) * d * sc, 2, th.danger);
      circle(ctx, cx, cy, 5, th.accent2);
      text(ctx, 'repère du robot (devant = vers la droite)', W - cloudW / 2 - 6, 26, { color: th.muted, size: 10, align: 'center' });
    }
    ro.set('min', isFinite(minD) ? `${fmt(minD, 2)} m` : 'rien dans la portée');
    ro.set('spec', type === 'lidar' ? `${nRays} pts/tour, 360°` : type === 'us' ? 'cône ±15°, 2 cm – 4 m' : 'faisceau fin, 10 – 80 cm');
  }
  return () => { off(); lp.stop(); cv.destroy(); };
}
