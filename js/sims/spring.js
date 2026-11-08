import { frame, canvas, theme, text, plot, slider, readout, button, buttons, loop, fmt, roundRect, note } from '../core/kit.js';

// Système masse-ressort-amortisseur : le modèle du second ordre que l'on retrouve
// partout (suspension, bras flexible, asservissement).
export default function spring(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Masse, ressort, amortisseur', tag: 'Physique · Dynamique', height: 360 });
  let m = 1, k = 20, c = 1.5;
  let x = 1, v = 0, t = 0, solved = false;
  const hist = [];
  slider(f.ctrl, { label: 'Masse m', min: 0.2, max: 5, step: 0.1, value: m, unit: 'kg', onInput: val => { m = val; info(); } });
  slider(f.ctrl, { label: 'Raideur k', min: 2, max: 80, step: 1, value: k, unit: 'N/m', onInput: val => { k = val; info(); } });
  slider(f.ctrl, { label: 'Amortissement c', min: 0, max: 30, step: 0.1, value: c, unit: 'N·s/m', onInput: val => { c = val; info(); } });
  const bb = buttons(f.ctrl);
  button(bb, 'Lâcher depuis 1 m', () => { x = 1; v = 0; t = 0; hist.length = 0; }, 'primary');
  button(bb, 'Pichenette', () => { v += 3; });
  const ro = readout(f.ctrl, [['wn', 'Pulsation propre ωₙ'], ['z', 'Amortissement ζ'], ['type', 'Régime'], ['x', 'Position']]);
  note(f.ctrl, opts.goal === 'critical' ? 'Défi : trouve le réglage d\'amortissement critique (ζ entre 0,95 et 1,05) pour m = 1 kg et k = 25 N/m. C\'est le retour le plus rapide sans dépassement.' : 'm·ẍ + c·ẋ + k·x = 0. Une seule équation, et trois comportements très différents selon ζ.');

  function info() {
    const wn = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
    ro.set('wn', `${fmt(wn, 2)} rad/s`);
    ro.set('z', fmt(z, 3), Math.abs(z - 1) < 0.05 ? 'var(--ok)' : '');
    ro.set('type', z === 0 ? 'non amorti (oscille sans fin)' : z < 1 ? 'sous-amorti (oscille)' : Math.abs(z - 1) < 0.05 ? 'critique' : 'sur-amorti (lent)');
    if (opts.goal === 'critical' && !solved && Math.abs(m - 1) < 0.01 && Math.abs(k - 25) < 0.5 && Math.abs(z - 1) < 0.05) {
      solved = true; f.message('Amortissement critique trouvé : c = 2·√(k·m) = 10 N·s/m. Les suspensions et les asservissements visent souvent ce réglage, ou juste en dessous.'); api.success && api.success();
    }
  }
  info();

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    const n = 10, h = dt / n;
    for (let i = 0; i < n; i++) { // intégration semi-implicite d'Euler
      const a = (-k * x - c * v) / m;
      v += a * h; x += v * h; t += h;
    }
    hist.push(x); if (hist.length > 500) hist.shift();
    ro.set('x', `${fmt(x, 3)} m`);
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const wallX = 20, midY = 70, scale = Math.min(110, W * 0.18);
    const rest = wallX + Math.min(240, W * 0.45);
    const bx = rest + x * scale;
    ctx.fillStyle = th.line; ctx.fillRect(wallX - 10, midY - 40, 10, 80);
    // ressort
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 2.5; ctx.beginPath();
    const coils = 12, sy = midY - 14, len = bx - 30 - wallX;
    ctx.moveTo(wallX, sy);
    for (let i = 0; i <= coils; i++) ctx.lineTo(wallX + 10 + (i / coils) * (len - 20), sy + (i % 2 ? -10 : 10));
    ctx.lineTo(bx - 30, sy); ctx.stroke();
    // amortisseur
    const dy = midY + 16;
    ctx.strokeStyle = th.violet; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(wallX, dy); ctx.lineTo(wallX + 40, dy); ctx.stroke();
    ctx.strokeRect(wallX + 40, dy - 8, 50, 16);
    ctx.beginPath(); ctx.moveTo(Math.max(wallX + 55, bx - 70), dy - 6); ctx.lineTo(Math.max(wallX + 55, bx - 70), dy + 6); ctx.moveTo(Math.max(wallX + 55, bx - 70), dy); ctx.lineTo(bx - 30, dy); ctx.stroke();
    // masse
    roundRect(ctx, bx - 30, midY - 30, 60, 60, 8); ctx.fillStyle = th.accent; ctx.fill();
    text(ctx, `${fmt(m, 1)} kg`, bx, midY + 5, { color: '#04221d', align: 'center', size: 12, weight: 800 });
    ctx.strokeStyle = th.faint; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(rest, midY - 44); ctx.lineTo(rest, midY + 44); ctx.stroke(); ctx.setLineDash([]);
    text(ctx, 'repos', rest, midY + 56, { color: th.faint, size: 10, align: 'center' });
    plot(ctx, { x: 20, y: 140, w: W - 40, h: H - 155 }, [{ ys: hist, color: th.accent, label: 'position x(t)' }], { ymin: -1.6, ymax: 1.6, th });
  }
  return () => { lp.stop(); cv.destroy(); };
}
