import { frame, canvas, theme, text, circle, slider, readout, button, buttons, loop, fmt, note } from '../core/kit.js';

// Transfert de Hohmann Terre → Mars : trouver la fenêtre de tir.
// Orbites supposées circulaires et coplanaires (approximation classique).
const TE = 365.25, TM = 686.98, RM = 1.524;
const A = (1 + RM) / 2, ECC = (RM - 1) / (RM + 1);
const TT = 0.5 * Math.pow(A, 1.5) * TE; // durée du transfert en jours (≈ 259)
const deg = r => r * 180 / Math.PI;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export default function hohmann(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Fenêtre de tir vers Mars', tag: 'Mécanique spatiale', height: 440 });
  let L = 120, t = 0, playing = false, solved = false;
  const thE0 = 0, thM0 = 183 * Math.PI / 180;
  const thE = d => thE0 + 2 * Math.PI * d / TE;
  const thM = d => thM0 + 2 * Math.PI * d / TM;

  const sl = slider(f.ctrl, { label: 'Jour du lancement', min: 0, max: 1200, step: 1, value: L, unit: 'j', onInput: v => { L = v; t = 0; playing = false; f.message(''); } });
  const bb = buttons(f.ctrl);
  const pb = button(bb, 'Lancer', () => { t = 0; playing = true; pb.textContent = 'Relancer'; }, 'primary');
  button(bb, 'Remise à zéro', () => { t = 0; playing = false; });
  const ro = readout(f.ctrl, [['phase', 'Avance de Mars au lancement'], ['miss', 'Écart à l\'arrivée'], ['dur', 'Durée du voyage'], ['dv1', 'Δv au départ (héliocentrique)'], ['dv2', 'Δv à l\'arrivée']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : trouve un jour de lancement pour que la sonde arrive à moins de 2° de Mars. Puis cherche la fenêtre suivante : combien de jours plus tard revient-elle ?'
    : 'La sonde part tangentiellement à l\'orbite terrestre et arrive tangentiellement à l\'orbite martienne, à l\'opposé du Soleil. Il faut que Mars soit au rendez-vous : c\'est la fenêtre de tir.');

  function craftPos(tau) {
    // résolution de l'équation de Kepler par Newton
    const n = 2 * Math.PI / (Math.pow(A, 1.5) * TE);
    const M = n * tau;
    let E = M;
    for (let i = 0; i < 12; i++) E -= (E - ECC * Math.sin(E) - M) / (1 - ECC * Math.cos(E));
    const nu = 2 * Math.atan(Math.sqrt((1 + ECC) / (1 - ECC)) * Math.tan(E / 2));
    const r = A * (1 - ECC * Math.cos(E));
    return { r, a: thE(L) + nu };
  }
  const vp = 29.78 * Math.sqrt(2 - 1 / A), va = 29.78 * Math.sqrt(2 / RM - 1 / A);

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    if (playing) { t += dt * 90; if (t >= TT) { t = TT; playing = false; check(); } }
    draw();
  });
  function missAngle() { return wrap(thM(L + TT) - (thE(L) + Math.PI)); }
  function check() {
    const m = Math.abs(deg(missAngle()));
    if (m < 2) {
      f.message(`Rendez-vous réussi : la sonde arrive à ${fmt(m, 1)}° de Mars après ${Math.round(TT)} jours.`);
      if (opts.goal && !solved) { solved = true; api.success && api.success(); }
    } else f.message(`Mars n'était pas au rendez-vous : écart de ${fmt(m, 0)}°. Change le jour du lancement.`, false);
  }

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % H; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, 1, 1); }
    const S = Math.min(W, H) / (2 * RM + 0.5), cx = W / 2, cy = H / 2;
    const P = (r, a) => [cx + r * S * Math.cos(a), cy - r * S * Math.sin(a)];
    circle(ctx, cx, cy, 1 * S, null, 'rgba(42,167,255,.4)', 1);
    circle(ctx, cx, cy, RM * S, null, 'rgba(224,122,79,.45)', 1);
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill();
    // ellipse de transfert
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([4, 5]); ctx.beginPath();
    for (let k = 0; k <= 60; k++) { const p = craftPos(TT * k / 60); const [x, y] = P(p.r, p.a); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    const day = L + t;
    const [ex, ey] = P(1, thE(day)), [mx, my] = P(RM, thM(day));
    circle(ctx, ex, ey, 7, '#2aa7ff');
    circle(ctx, mx, my, 6, '#e07a4f');
    text(ctx, 'Terre', ex + 10, ey - 8, { color: '#9cd3ff', size: 11 });
    text(ctx, 'Mars', mx + 10, my - 8, { color: '#ffb393', size: 11 });
    // point d'arrivée prévu
    const [ax, ay] = P(RM, thE(L) + Math.PI);
    circle(ctx, ax, ay, 9, null, th.warn, 1.5);
    const p = craftPos(t);
    const [sx, sy] = P(p.r, p.a);
    if (t > 0) { circle(ctx, sx, sy, 4, '#ffffff'); text(ctx, 'sonde', sx + 7, sy + 12, { color: '#fff', size: 10 }); }
    text(ctx, `Jour ${Math.round(day)}`, 12, 20, { color: '#fff', size: 13, weight: 700 });
    text(ctx, 'Cercle jaune : point d\'arrivée prévu', 12, H - 12, { color: th.warn, size: 11 });

    const phase = deg(wrap(thM(L) - thE(L)));
    ro.set('phase', `${fmt(phase, 1)}° (idéal ≈ 44°)`, Math.abs(phase - 44.3) < 2 ? 'var(--ok)' : '');
    const m = deg(missAngle());
    ro.set('miss', `${fmt(Math.abs(m), 1)}° (≈ ${fmt(Math.abs(m) * Math.PI / 180 * RM * 149.6, 0)} millions de km)`, Math.abs(m) < 2 ? 'var(--ok)' : 'var(--warn)');
    ro.set('dur', `${Math.round(TT)} jours (≈ 8,5 mois)`);
    ro.set('dv1', `${fmt(vp - 29.78, 2)} km/s`);
    ro.set('dv2', `${fmt(24.13 - va, 2)} km/s`);
  }
  void sl;
  return () => { lp.stop(); cv.destroy(); };
}
