import { frame, canvas, theme, text, circle, arrow, slider, readout, checkbox, loop, fmt, rad, note } from '../core/kit.js';

// Cercle trigonométrique relié aux courbes sinus et cosinus.
export default function trig(root, opts = {}) {
  const f = frame(root, { title: opts.title || 'Cercle trigonométrique', tag: 'Maths', height: 340 });
  let angle = 40, spin = false;
  const s = slider(f.ctrl, { label: 'Angle θ', min: 0, max: 360, step: 1, value: angle, unit: '°', onInput: v => { angle = v; } });
  checkbox(f.ctrl, { label: 'Faire tourner (moteur)', value: false, onChange: v => { spin = v; } });
  const ro = readout(f.ctrl, [['deg', 'θ en degrés'], ['rad', 'θ en radians'], ['cos', 'cos θ'], ['sin', 'sin θ'], ['tan', 'tan θ']]);
  note(f.ctrl, 'Le point sur le cercle, c\'est la pointe d\'un bras de longueur 1 qui tourne. Sa position horizontale vaut cos θ, sa hauteur vaut sin θ. Une grande partie de la robotique s\'appuie dessus.');

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    if (spin) { angle = (angle + 60 * dt) % 360; s.set(Math.round(angle)); }
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const R = Math.min(H * 0.36, W * 0.2);
    const cx = R + 30, cy = H / 2;
    const t = rad(angle);
    const px = cx + R * Math.cos(t), py = cy - R * Math.sin(t);
    // axes
    ctx.strokeStyle = th.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - R - 15, cy); ctx.lineTo(W - 10, cy); ctx.moveTo(cx, cy - R - 15); ctx.lineTo(cx, cy + R + 15); ctx.stroke();
    circle(ctx, cx, cy, R, null, th.faint, 1.5);
    // arc d'angle
    ctx.strokeStyle = th.warn; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.25, 0, -t, true); ctx.stroke();
    // projections
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.strokeStyle = th.accent; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
    ctx.strokeStyle = th.accent2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 4; ctx.strokeStyle = th.accent2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
    ctx.strokeStyle = th.accent; ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();
    arrow(ctx, cx, cy, px, py, th.text, 2.5);
    circle(ctx, px, py, 6, th.warn);
    text(ctx, 'cos θ', (cx + px) / 2, cy + 18, { color: th.accent2, align: 'center', weight: 700 });
    text(ctx, 'sin θ', px + 8, (cy + py) / 2, { color: th.accent, weight: 700 });

    // courbes à droite
    const gx = cx + R + 40, gw = W - gx - 15;
    if (gw > 80) {
      ctx.strokeStyle = th.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, cy - R); ctx.lineTo(gx, cy + R); ctx.stroke();
      const X = a => gx + (a / 360) * gw;
      const draw1 = (fn, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
        for (let a = 0; a <= 360; a += 3) { const y = cy - R * fn(rad(a)); a ? ctx.lineTo(X(a), y) : ctx.moveTo(X(a), y); }
        ctx.stroke();
      };
      draw1(Math.sin, th.accent);
      draw1(Math.cos, th.accent2);
      ctx.strokeStyle = th.faint; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(angle), cy - R); ctx.lineTo(X(angle), cy + R); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(X(angle), py); ctx.strokeStyle = th.accent; ctx.globalAlpha = .35; ctx.stroke(); ctx.globalAlpha = 1;
      circle(ctx, X(angle), cy - R * Math.sin(t), 5, th.accent);
      circle(ctx, X(angle), cy - R * Math.cos(t), 5, th.accent2);
      [0, 90, 180, 270, 360].forEach(a => text(ctx, `${a}°`, X(a), cy + R + 16, { color: th.faint, size: 10, align: 'center' }));
      text(ctx, 'sin', gx + gw, cy - R - 4, { color: th.accent, align: 'right', size: 11 });
      text(ctx, 'cos', gx + gw - 30, cy - R - 4, { color: th.accent2, align: 'right', size: 11 });
    }
    ro.set('deg', `${Math.round(angle)}°`);
    ro.set('rad', `${fmt(t, 3)} rad`);
    ro.set('cos', fmt(Math.cos(t), 3));
    ro.set('sin', fmt(Math.sin(t), 3));
    const tn = Math.tan(t);
    ro.set('tan', Math.abs(tn) > 50 ? '∞ (non défini)' : fmt(tn, 3));
  }
  return () => { lp.stop(); cv.destroy(); };
}
