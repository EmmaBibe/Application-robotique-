import { frame, canvas, theme, text, plot, slider, readout, button, buttons, loop, fmt, roundRect, note } from '../core/kit.js';

// Position, vitesse, accélération : un chariot suit un profil de vitesse trapézoïdal,
// celui qu'utilisent les contrôleurs de moteurs industriels.
export default function motion(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Dérivées en mouvement : profil trapézoïdal', tag: 'Maths · Physique', height: 400 });
  let D = 6, vmax = 1.5, amax = 1;
  let t = 0, running = false, solved = false;
  slider(f.ctrl, { label: 'Distance à parcourir', min: 1, max: 10, step: 0.5, value: D, unit: 'm', onInput: v => { D = v; reset(); } });
  slider(f.ctrl, { label: 'Vitesse maximale', min: 0.2, max: 4, step: 0.1, value: vmax, unit: 'm/s', onInput: v => { vmax = v; reset(); } });
  slider(f.ctrl, { label: 'Accélération maximale', min: 0.2, max: 4, step: 0.1, value: amax, unit: 'm/s²', onInput: v => { amax = v; reset(); } });
  const bb = buttons(f.ctrl);
  button(bb, 'Lancer', () => { if (t >= prof().T) t = 0; running = true; }, 'primary');
  button(bb, 'Remettre à zéro', reset);
  const ro = readout(f.ctrl, [['T', 'Durée totale'], ['vpk', 'Vitesse atteinte'], ['shape', 'Forme'], ['x', 'x(t)'], ['v', 'v(t)'], ['a', 'a(t)']]);
  note(f.ctrl, opts.goal === 'fast' ? 'Défi : fais parcourir 8 m en moins de 4,5 s sans dépasser 2,5 m/s² (les objets posés dessus glisseraient).' : 'La vitesse est la pente de la position. L\'accélération est la pente de la vitesse. Observe les trois courbes en même temps.');

  function prof() {
    const ta = vmax / amax;
    const da = 0.5 * amax * ta * ta;
    if (2 * da >= D) { // triangle : on n'atteint jamais vmax
      const tp = Math.sqrt(D / amax);
      return { tri: true, ta: tp, tc: 0, T: 2 * tp, vp: amax * tp };
    }
    const tc = (D - 2 * da) / vmax;
    return { tri: false, ta, tc, T: 2 * ta + tc, vp: vmax };
  }
  function state(tt) {
    const p = prof();
    const { ta, tc, T, vp } = p;
    if (tt <= 0) return { x: 0, v: 0, a: 0 };
    if (tt < ta) return { x: 0.5 * amax * tt * tt, v: amax * tt, a: amax };
    const xa = 0.5 * amax * ta * ta;
    if (tt < ta + tc) return { x: xa + vp * (tt - ta), v: vp, a: 0 };
    if (tt < T) { const u = tt - ta - tc; return { x: xa + vp * tc + vp * u - 0.5 * amax * u * u, v: vp - amax * u, a: -amax }; }
    return { x: D, v: 0, a: 0 };
  }
  function reset() { t = 0; running = false; solved = false; f.message(''); }

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    const p = prof();
    if (running) { t += dt; if (t >= p.T) { t = p.T; running = false; check(); } }
    draw();
  });
  function check() {
    if (opts.goal !== 'fast' || solved) return;
    const p = prof();
    if (D >= 8 && p.T < 4.5 && amax <= 2.5) { solved = true; f.message(`Réussi : ${fmt(p.T, 2)} s. Tu viens de régler un profil de mouvement comme sur une machine réelle.`); api.success && api.success(); }
    else f.message(`Durée ${fmt(p.T, 2)} s avec D = ${D} m et a = ${amax} m/s². Ajuste encore.`, false);
  }

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const p = prof(), s = state(t);
    // rail
    const rx = 30, rw = W - 60, ry = 46;
    ctx.strokeStyle = th.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rx, ry + 22); ctx.lineTo(rx + rw, ry + 22); ctx.stroke();
    for (let i = 0; i <= D; i++) { const xx = rx + (i / D) * rw; ctx.fillStyle = th.faint; ctx.fillRect(xx, ry + 24, 1, 6); text(ctx, `${i}`, xx, ry + 42, { color: th.faint, size: 10, align: 'center' }); }
    const cx = rx + (s.x / D) * rw;
    roundRect(ctx, cx - 22, ry - 4, 44, 22, 5); ctx.fillStyle = th.accent2; ctx.fill();
    ctx.fillStyle = th.text; ctx.beginPath(); ctx.arc(cx - 12, ry + 20, 5, 0, 7); ctx.arc(cx + 12, ry + 20, 5, 0, 7); ctx.fill();
    ctx.fillStyle = th.warn; ctx.fillRect(rx + rw - 2, ry - 12, 4, 34);
    // courbes
    const N = 160, xs = [], ys = { x: [], v: [], a: [] };
    for (let i = 0; i <= N; i++) { const tt = (i / N) * p.T; const q = state(tt); xs.push(tt); ys.x.push(q.x); ys.v.push(q.v); ys.a.push(q.a); }
    const top = 80, gh = (H - top - 20) / 3 - 8;
    const mk = (k, i, col, lab, unit) => {
      const r = { x: 30, y: top + i * (gh + 8), w: W - 50, h: gh };
      const pl = plot(ctx, r, [{ ys: ys[k], xs, color: col }], { xmin: 0, xmax: p.T, th, ylabel: `${lab} (${unit})`, vlines: [{ v: t, color: th.warn }] });
      return pl;
    };
    mk('x', 0, th.accent, 'position', 'm');
    mk('v', 1, th.accent2, 'vitesse', 'm/s');
    mk('a', 2, th.violet, 'accélération', 'm/s²');
    ro.set('T', `${fmt(p.T, 2)} s`);
    ro.set('vpk', `${fmt(p.vp, 2)} m/s`);
    ro.set('shape', p.tri ? 'triangle (vmax jamais atteinte)' : 'trapèze');
    ro.set('x', `${fmt(s.x, 2)} m`);
    ro.set('v', `${fmt(s.v, 2)} m/s`);
    ro.set('a', `${fmt(s.a, 2)} m/s²`);
  }
  return () => { lp.stop(); cv.destroy(); };
}
