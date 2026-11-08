import { frame, canvas, theme, grid, arrow, text, circle, slider, readout, onTheme, fmt, rad, note } from '../core/kit.js';

// Repères et matrices de transformation homogène 2D.
// Le robot a son propre repère ; un capteur voit un obstacle dans ce repère,
// la matrice T donne sa position dans le repère du monde.
export default function transform(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Repères et matrice de transformation', tag: 'Maths', height: 380 });
  const U = 36;
  let th0 = 30, tx = 2, ty = 1, px = 2, py = 0.5;
  let solved = false;
  const target = opts.goal === 'target' ? { x: 4, y: 4 } : null;
  slider(f.ctrl, { label: 'Rotation θ du robot', min: -180, max: 180, step: 5, value: th0, unit: '°', onInput: v => { th0 = v; draw(); } });
  slider(f.ctrl, { label: 'Position x du robot', min: -5, max: 6, step: 0.5, value: tx, onInput: v => { tx = v; draw(); } });
  slider(f.ctrl, { label: 'Position y du robot', min: -4, max: 5, step: 0.5, value: ty, onInput: v => { ty = v; draw(); } });
  slider(f.ctrl, { label: 'Obstacle vu par le robot : x local', min: -3, max: 4, step: 0.5, value: px, onInput: v => { px = v; draw(); } });
  slider(f.ctrl, { label: 'Obstacle vu par le robot : y local', min: -3, max: 3, step: 0.5, value: py, onInput: v => { py = v; draw(); } });
  const matBox = document.createElement('div');
  matBox.className = 'readout';
  matBox.style.display = 'block';
  matBox.style.fontFamily = 'var(--mono)';
  f.ctrl.appendChild(matBox);
  const ro = readout(f.ctrl, [['pw', 'Obstacle dans le monde']]);
  note(f.ctrl, target ? 'Défi : place le robot pour que l\'obstacle, vu à (2 ; 0,5) par son capteur, tombe exactement sur la cible jaune (4 ; 4).' : 'P<sub>monde</sub> = T · P<sub>robot</sub>. Tourne le robot : le point local ne change pas, sa position dans le monde, si.');

  const cv = canvas(f.stage, () => draw());
  const O = () => ({ x: cv.w * 0.42, y: cv.h * 0.62 });
  const P = (x, y) => { const o = O(); return { x: o.x + x * U, y: o.y - y * U }; };

  function draw() {
    const th = theme(), ctx = cv.ctx, o = O();
    ctx.clearRect(0, 0, cv.w, cv.h);
    grid(ctx, cv.w, cv.h, U, th.line, o.x, o.y);
    arrow(ctx, o.x, o.y, o.x + 2 * U, o.y, th.danger, 2.5);
    arrow(ctx, o.x, o.y, o.x, o.y - 2 * U, th.ok, 2.5);
    text(ctx, 'Monde', o.x - 6, o.y + 16, { color: th.muted, align: 'right', size: 11 });
    const c = Math.cos(rad(th0)), s = Math.sin(rad(th0));
    // point dans le monde
    const wx = c * px - s * py + tx, wy = s * px + c * py + ty;
    if (target) {
      const t = P(target.x, target.y);
      circle(ctx, t.x, t.y, 14, null, th.warn, 2.5);
      circle(ctx, t.x, t.y, 4, th.warn);
    }
    // robot
    const r = P(tx, ty);
    ctx.save();
    ctx.translate(r.x, r.y); ctx.rotate(-rad(th0));
    ctx.fillStyle = th.accent2; ctx.globalAlpha = .18; ctx.fillRect(-U * .7, -U * .5, U * 1.4, U); ctx.globalAlpha = 1;
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 2; ctx.strokeRect(-U * .7, -U * .5, U * 1.4, U);
    ctx.fillStyle = th.text; ctx.fillRect(-U * .45, -U * .62, U * .5, U * .14); ctx.fillRect(-U * .45, U * .48, U * .5, U * .14);
    ctx.restore();
    arrow(ctx, r.x, r.y, r.x + c * 1.6 * U, r.y - s * 1.6 * U, th.danger, 2.5);
    arrow(ctx, r.x, r.y, r.x - s * 1.6 * U, r.y - c * 1.6 * U, th.ok, 2.5);
    text(ctx, 'x_r', r.x + c * 1.8 * U, r.y - s * 1.8 * U, { color: th.danger, size: 11, align: 'center' });
    text(ctx, 'y_r', r.x - s * 1.8 * U, r.y - c * 1.8 * U, { color: th.ok, size: 11, align: 'center' });
    // rayon capteur et obstacle
    const w = P(wx, wy);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = th.warn; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(w.x, w.y); ctx.stroke(); ctx.setLineDash([]);
    circle(ctx, w.x, w.y, 8, th.danger);
    text(ctx, `(${fmt(wx, 2)} ; ${fmt(wy, 2)})`, w.x + 10, w.y - 10, { color: th.text, size: 12, weight: 700 });

    matBox.innerHTML = `<div style="color:var(--muted);font-family:var(--font);font-size:.82rem;margin-bottom:.3rem">Matrice homogène T (robot → monde)</div>
      <table style="width:100%;text-align:right;border-collapse:collapse">
      <tr><td>${fmt(c, 3)}</td><td>${fmt(-s, 3)}</td><td style="color:var(--warn)">${fmt(tx, 2)}</td></tr>
      <tr><td>${fmt(s, 3)}</td><td>${fmt(c, 3)}</td><td style="color:var(--warn)">${fmt(ty, 2)}</td></tr>
      <tr style="color:var(--faint)"><td>0</td><td>0</td><td>1</td></tr></table>`;
    ro.set('pw', `(${fmt(wx, 2)} ; ${fmt(wy, 2)})`);
    if (target && !solved && Math.hypot(wx - target.x, wy - target.y) < 0.08) {
      solved = true;
      f.message('Parfait : tu as résolu un problème de changement de repère, exactement ce que fait un robot pour cartographier ce qu\'il voit.');
      api.success && api.success();
    }
  }
  const offT = onTheme(draw);
  draw();
  return () => { offT(); cv.destroy(); };
}
