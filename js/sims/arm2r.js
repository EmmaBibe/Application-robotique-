import { frame, canvas, theme, grid, text, circle, slider, readout, segmented, checkbox, drag, onTheme, fmt, rad, deg, note } from '../core/kit.js';

// Bras plan à deux articulations (2R) : modèle géométrique direct et inverse.
export default function arm2r(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Bras robotique 2 axes', tag: 'Cinématique des bras', height: 420 });
  let L1 = 1.0, L2 = 0.7, t1 = 40, t2 = 50, mode = opts.mode || 'direct', elbowUp = true, showWs = true;
  let target = { x: 1.1, y: 0.9 }, solved = false;
  const goalPt = opts.goal === 'fk' ? { x: 0.4, y: 1.3 } : null;
  const trace = [];

  segmented(f.ctrl, { label: 'Modèle', value: mode, options: [{ label: 'Direct (angles → position)', value: 'direct' }, { label: 'Inverse (position → angles)', value: 'inverse' }], onChange: v => { mode = v; syncUI(); draw(); } });
  const s1 = slider(f.ctrl, { label: 'Angle épaule θ1', min: -180, max: 180, step: 1, value: t1, unit: '°', onInput: v => { t1 = v; draw(); } });
  const s2 = slider(f.ctrl, { label: 'Angle coude θ2', min: -170, max: 170, step: 1, value: t2, unit: '°', onInput: v => { t2 = v; draw(); } });
  slider(f.ctrl, { label: 'Longueur bras L1', min: 0.4, max: 1.4, step: 0.05, value: L1, unit: 'm', onInput: v => { L1 = v; draw(); } });
  slider(f.ctrl, { label: 'Longueur avant-bras L2', min: 0.3, max: 1.2, step: 0.05, value: L2, unit: 'm', onInput: v => { L2 = v; draw(); } });
  const elb = checkbox(f.ctrl, { label: 'Coude en haut (2e solution sinon)', value: elbowUp, onChange: v => { elbowUp = v; draw(); } });
  checkbox(f.ctrl, { label: 'Afficher l\'espace de travail', value: showWs, onChange: v => { showWs = v; draw(); } });
  const ro = readout(f.ctrl, [['xy', 'Effecteur (x, y)'], ['ang', 'θ1, θ2'], ['st', 'État']]);
  const hint = note(f.ctrl, '');

  function syncUI() {
    s1.el.style.opacity = s2.el.style.opacity = mode === 'direct' ? 1 : 0.45;
    s1.el.querySelector('input').disabled = s2.el.querySelector('input').disabled = mode !== 'direct';
    elb.set(elbowUp);
    hint.innerHTML = goalPt
      ? 'Défi : en mode direct, avec les seuls curseurs d\'angle, amène la pince sur la cible jaune (à 3 cm près). Tu sentiras pourquoi le modèle inverse est indispensable.'
      : mode === 'direct'
        ? 'x = L1·cos θ1 + L2·cos(θ1+θ2)<br>y = L1·sin θ1 + L2·sin(θ1+θ2)'
        : 'Touche ou fais glisser la cible. cos θ2 = (x² + y² − L1² − L2²) / (2·L1·L2). Deux solutions : coude en haut ou en bas.';
  }
  syncUI();

  const cv = canvas(f.stage, () => draw());
  const S = () => Math.min(cv.w, cv.h) / (2 * (L1 + L2) + 0.6) * 1.0;
  const O = () => ({ x: cv.w / 2, y: cv.h * 0.62 });
  const toW = p => { const o = O(), s = S(); return { x: (p.x - o.x) / s, y: (o.y - p.y) / s }; };

  const off = drag(cv, {
    down: p => { if (mode !== 'inverse') return false; target = toW(p); draw(); },
    move: p => { target = toW(p); draw(); },
  });

  function ik(x, y) {
    const c2 = (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    if (c2 < -1 || c2 > 1) return null;
    const s2v = (elbowUp ? 1 : -1) * Math.sqrt(1 - c2 * c2);
    const q2 = Math.atan2(s2v, c2);
    const q1 = Math.atan2(y, x) - Math.atan2(L2 * s2v, L1 + L2 * c2);
    return [deg(q1), deg(q2)];
  }

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h, o = O(), s = S();
    ctx.clearRect(0, 0, W, H);
    grid(ctx, W, H, s * 0.25, th.line, o.x, o.y);
    ctx.fillStyle = th.faint; ctx.fillRect(0, o.y + 14, W, 2);
    if (showWs) {
      ctx.fillStyle = th.accent + '14';
      ctx.beginPath(); ctx.arc(o.x, o.y, (L1 + L2) * s, 0, 7); ctx.arc(o.x, o.y, Math.abs(L1 - L2) * s, 0, 7, true); ctx.fill('evenodd');
      ctx.strokeStyle = th.accent + '66'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(o.x, o.y, (L1 + L2) * s, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(o.x, o.y, Math.abs(L1 - L2) * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    let reach = true;
    if (mode === 'inverse') {
      const sol = ik(target.x, target.y);
      if (sol) { t1 = sol[0]; t2 = sol[1]; s1.set(Math.round(t1)); s2.set(Math.round(t2)); } else reach = false;
      const tp = { x: o.x + target.x * s, y: o.y - target.y * s };
      circle(ctx, tp.x, tp.y, 12, null, reach ? th.warn : th.danger, 2.5);
      ctx.strokeStyle = reach ? th.warn : th.danger; ctx.beginPath(); ctx.moveTo(tp.x - 16, tp.y); ctx.lineTo(tp.x + 16, tp.y); ctx.moveTo(tp.x, tp.y - 16); ctx.lineTo(tp.x, tp.y + 16); ctx.stroke();
    }
    if (goalPt) {
      const gp = { x: o.x + goalPt.x * s, y: o.y - goalPt.y * s };
      circle(ctx, gp.x, gp.y, 0.03 * s + 6, th.warn + '33', th.warn, 2);
    }
    const a1 = rad(t1), a2 = rad(t1 + t2);
    const ex = L1 * Math.cos(a1), ey = L1 * Math.sin(a1);
    const px = ex + L2 * Math.cos(a2), py = ey + L2 * Math.sin(a2);
    const E = { x: o.x + ex * s, y: o.y - ey * s }, Pp = { x: o.x + px * s, y: o.y - py * s };
    trace.push([Pp.x, Pp.y]); if (trace.length > 120) trace.shift();
    ctx.strokeStyle = th.violet + '55'; ctx.lineWidth = 1.5; ctx.beginPath();
    trace.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    // socle
    ctx.fillStyle = th.panel; ctx.strokeStyle = th.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o.x - 28, o.y + 14); ctx.lineTo(o.x + 28, o.y + 14); ctx.lineTo(o.x + 14, o.y - 4); ctx.lineTo(o.x - 14, o.y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // segments
    ctx.lineCap = 'round';
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(E.x, E.y); ctx.stroke();
    ctx.strokeStyle = th.accent; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(Pp.x, Pp.y); ctx.stroke();
    circle(ctx, o.x, o.y, 9, th.text); circle(ctx, E.x, E.y, 7, th.text);
    // pince
    ctx.save(); ctx.translate(Pp.x, Pp.y); ctx.rotate(-a2);
    ctx.strokeStyle = th.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(12, -8); ctx.moveTo(0, 8); ctx.lineTo(12, 8); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
    ctx.restore();
    // arcs d'angle
    ctx.strokeStyle = th.warn; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(o.x, o.y, 26, 0, -a1, a1 > 0); ctx.stroke();
    text(ctx, 'θ1', o.x + 30, o.y - 8, { color: th.warn, size: 11, weight: 700 });
    text(ctx, 'θ2', E.x + 12, E.y - 10, { color: th.warn, size: 11, weight: 700 });

    ro.set('xy', `(${fmt(px, 3)} ; ${fmt(py, 3)}) m`);
    ro.set('ang', `${fmt(t1, 1)}° ; ${fmt(t2, 1)}°`);
    ro.set('st', reach ? (py < -0.1 ? 'sous le sol : collision' : 'atteignable') : 'hors de portée', reach && py >= -0.1 ? 'var(--ok)' : 'var(--danger)');
    if (goalPt && !solved && mode === 'direct' && Math.hypot(px - goalPt.x, py - goalPt.y) < 0.03) {
      solved = true; f.message('Cible atteinte à la main. Un robot, lui, résout le modèle inverse en quelques microsecondes.'); api.success && api.success();
    }
  }
  const offT = onTheme(draw);
  draw();
  return () => { off(); offT(); cv.destroy(); };
}
