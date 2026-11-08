import { frame, canvas, theme, grid, arrow, text, circle, readout, segmented, drag, onTheme, fmt, deg, note } from '../core/kit.js';

// Vecteurs 2D : somme, produit scalaire, projection. Les extrémités se déplacent au doigt ou à la souris.
export default function vectors(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Laboratoire des vecteurs', tag: 'Maths', height: 360 });
  const U = 40; // pixels par unité
  let a = { x: 3, y: 1 }, b = { x: 1, y: 2.5 };
  let mode = opts.mode || 'somme';
  let solved = false;

  segmented(f.ctrl, {
    label: 'Ce que tu veux voir', value: mode,
    options: [{ label: 'Somme', value: 'somme' }, { label: 'Produit scalaire', value: 'dot' }, { label: 'Projection', value: 'proj' }],
    onChange: v => { mode = v; draw(); },
  });
  const ro = readout(f.ctrl, [['a', 'a'], ['b', 'b'], ['na', '‖a‖'], ['nb', '‖b‖'], ['s', 'a + b'], ['dot', 'a · b'], ['ang', 'angle (a, b)']]);
  note(f.ctrl, 'Attrape la pointe d\'un vecteur et déplace-la. Les valeurs sont arrondies à 0,5 près pour que tu puisses refaire les calculs à la main.');

  const cv = canvas(f.stage, () => draw());
  const origin = () => ({ x: cv.w / 2 - 40, y: cv.h / 2 + 60 });
  const toPx = v => { const o = origin(); return { x: o.x + v.x * U, y: o.y - v.y * U }; };
  const toU = p => { const o = origin(); return { x: Math.round(((p.x - o.x) / U) * 2) / 2, y: Math.round(((o.y - p.y) / U) * 2) / 2 }; };

  let grab = null;
  const off = drag(cv, {
    down: p => {
      const pa = toPx(a), pb = toPx(b);
      if (Math.hypot(p.x - pa.x, p.y - pa.y) < 24) grab = 'a';
      else if (Math.hypot(p.x - pb.x, p.y - pb.y) < 24) grab = 'b';
      else return false;
    },
    move: p => { const v = toU(p); if (grab === 'a') a = v; else b = v; draw(); },
    up: () => { grab = null; },
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, o = origin();
    ctx.clearRect(0, 0, cv.w, cv.h);
    grid(ctx, cv.w, cv.h, U, th.line, o.x, o.y);
    ctx.strokeStyle = th.faint; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(cv.w, o.y); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, cv.h); ctx.stroke();
    text(ctx, 'x', cv.w - 12, o.y - 6, { color: th.muted });
    text(ctx, 'y', o.x + 6, 14, { color: th.muted });

    const pa = toPx(a), pb = toPx(b);
    const dot = a.x * b.x + a.y * b.y;
    const na = Math.hypot(a.x, a.y), nb = Math.hypot(b.x, b.y);
    const ang = na && nb ? Math.acos(Math.max(-1, Math.min(1, dot / (na * nb)))) : 0;

    if (mode === 'somme') {
      const s = { x: a.x + b.x, y: a.y + b.y }, ps = toPx(s);
      ctx.setLineDash([5, 5]); ctx.strokeStyle = th.faint; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(ps.x, ps.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.setLineDash([]);
      arrow(ctx, o.x, o.y, ps.x, ps.y, th.warn, 3);
      text(ctx, 'a + b', ps.x + 8, ps.y - 6, { color: th.warn, weight: 700 });
    }
    if (mode === 'proj' && nb > 0) {
      const k = dot / (nb * nb), pr = toPx({ x: b.x * k, y: b.y * k });
      ctx.setLineDash([4, 4]); ctx.strokeStyle = th.violet; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pr.x, pr.y); ctx.stroke(); ctx.setLineDash([]);
      arrow(ctx, o.x, o.y, pr.x, pr.y, th.violet, 4);
      text(ctx, `proj de a sur b = ${fmt(k * nb, 2)}`, pr.x + 8, pr.y + 16, { color: th.violet, weight: 700 });
    }
    if (mode === 'dot') {
      const a0 = Math.atan2(a.y, a.x), b0 = Math.atan2(b.y, b.x);
      ctx.strokeStyle = th.violet; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, o.y, 34, -Math.max(a0, b0), -Math.min(a0, b0)); ctx.stroke();
      const c = Math.abs(dot) < 0.01 ? th.ok : dot > 0 ? th.accent : th.danger;
      text(ctx, `a · b = ${fmt(dot, 2)}`, 12, 22, { color: c, size: 15, weight: 700 });
      text(ctx, dot > 0.01 ? 'positif : ils pointent plutôt dans le même sens' : dot < -0.01 ? 'négatif : ils s\'opposent' : 'nul : ils sont perpendiculaires', 12, 42, { color: th.muted, size: 12 });
    }
    arrow(ctx, o.x, o.y, pa.x, pa.y, th.accent, 3.5);
    arrow(ctx, o.x, o.y, pb.x, pb.y, th.accent2, 3.5);
    circle(ctx, pa.x, pa.y, 9, null, th.accent, 2);
    circle(ctx, pb.x, pb.y, 9, null, th.accent2, 2);
    text(ctx, 'a', pa.x + 10, pa.y - 10, { color: th.accent, size: 15, weight: 700 });
    text(ctx, 'b', pb.x + 10, pb.y - 10, { color: th.accent2, size: 15, weight: 700 });

    ro.set('a', `(${a.x}, ${a.y})`);
    ro.set('b', `(${b.x}, ${b.y})`);
    ro.set('na', fmt(na, 2));
    ro.set('nb', fmt(nb, 2));
    ro.set('s', `(${a.x + b.x}, ${a.y + b.y})`);
    ro.set('dot', fmt(dot, 2));
    ro.set('ang', `${fmt(deg(ang), 1)}°`);

    if (opts.goal === 'perp' && !solved && Math.abs(dot) < 1e-9 && na >= 2 && nb >= 2 && a.x !== 0 && b.x !== 0) {
      solved = true;
      f.message('Bravo : a et b sont perpendiculaires, leur produit scalaire est nul.');
      api.success && api.success();
    }
  }
  const offT = onTheme(draw);
  draw();
  return () => { off(); offT(); cv.destroy(); };
}
