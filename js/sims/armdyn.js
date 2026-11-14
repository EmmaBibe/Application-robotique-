import { frame, canvas, theme, text, circle, slider, readout, segmented, button, buttons, loop, fmt, plot, note } from '../core/kit.js';

// Dynamique d'un bras à deux axes : la gravité, l'inertie et le couplage entre articulations.
// Masses ponctuelles au bout de chaque segment. Angles mesurés depuis l'horizontale.
const L1 = 0.6, L2 = 0.5, M1 = 2.0, M2 = 1.0, TMAX = 60, FRIC = 0.3;
export const GRAV = { terre: 9.81, mars: 3.71, lune: 1.62 };

export function dyn(q, qd, m2, g) {
  const c2 = Math.cos(q[1]), s2 = Math.sin(q[1]), c1 = Math.cos(q[0]), c12 = Math.cos(q[0] + q[1]);
  const Mm = [[(M1 + m2) * L1 * L1 + m2 * L2 * L2 + 2 * m2 * L1 * L2 * c2, m2 * L2 * L2 + m2 * L1 * L2 * c2], [m2 * L2 * L2 + m2 * L1 * L2 * c2, m2 * L2 * L2]];
  const h = m2 * L1 * L2 * s2;
  const C = [-h * qd[1] * (2 * qd[0] + qd[1]), h * qd[0] * qd[0]];
  const G = [(M1 + m2) * g * L1 * c1 + m2 * g * L2 * c12, m2 * g * L2 * c12];
  return { Mm, C, G };
}

export function simulateArm(ctrl, { payload, est, g, kp, kd }, T = 9) {
  // séquence de 3 consignes, 3 s chacune ; renvoie l'erreur moyenne en fin de chaque mouvement
  const targets = [[0.9, -0.6], [0.2, 0.9], [1.3, 0.3]];
  let q = [0, 0], qd = [0, 0], t = 0, dt = 0.001, errs = [];
  while (t < T) {
    const k = Math.min(2, Math.floor(t / 3)), r = targets[k];
    const tau = ctrl(q, qd, r, { payload, est, g, kp, kd });
    const m2 = M2 + payload, { Mm, C, G } = dyn(q, qd, m2, g);
    const b = [tau[0] - C[0] - G[0] - FRIC * qd[0], tau[1] - C[1] - G[1] - FRIC * qd[1]];
    const det = Mm[0][0] * Mm[1][1] - Mm[0][1] * Mm[1][0];
    const a0 = (Mm[1][1] * b[0] - Mm[0][1] * b[1]) / det, a1 = (-Mm[1][0] * b[0] + Mm[0][0] * b[1]) / det;
    qd = [qd[0] + a0 * dt, qd[1] + a1 * dt]; q = [q[0] + qd[0] * dt, q[1] + qd[1] * dt]; t += dt;
    if ((t % 3) > 2.5) errs.push(Math.hypot(r[0] - q[0], r[1] - q[1]) * 180 / Math.PI);
  }
  return errs.reduce((a, v) => a + v, 0) / errs.length;
}

export const CONTROLLERS = {
  pd: (q, qd, r, p) => [p.kp * (r[0] - q[0]) - p.kd * qd[0], p.kp * (r[1] - q[1]) - p.kd * qd[1]],
  gravite: (q, qd, r, p) => { const { G } = dyn(q, qd, M2 + p.est, p.g); return [p.kp * (r[0] - q[0]) - p.kd * qd[0] + G[0], p.kp * (r[1] - q[1]) - p.kd * qd[1] + G[1]]; },
  couple: (q, qd, r, p) => {
    const { Mm, C, G } = dyn(q, qd, M2 + p.est, p.g);
    const w = 2 * Math.sqrt(p.kp / 3);
    const v = [(p.kp / 3) * (r[0] - q[0]) - w * qd[0], (p.kp / 3) * (r[1] - q[1]) - w * qd[1]];
    return [Mm[0][0] * v[0] + Mm[0][1] * v[1] + C[0] + G[0], Mm[1][0] * v[0] + Mm[1][1] * v[1] + C[1] + G[1]];
  },
};

export default function armdyn(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Dynamique d\'un bras : gravité, inertie, couplage', tag: 'Dynamique · commande', height: 420 });
  let ctrlName = 'pd', planet = 'terre', payload = 3, est = 0, kp = 80, kd = 12, solved = false;
  let q, qd, t, hist, tau = [0, 0];
  const targets = [[0.9, -0.6], [0.2, 0.9], [1.3, 0.3]];

  segmented(f.ctrl, { label: 'Commande', value: ctrlName, options: [{ label: 'PD seul', value: 'pd' }, { label: 'PD + compensation de gravité', value: 'gravite' }, { label: 'Couple calculé', value: 'couple' }], onChange: v => { ctrlName = v; reset(); } });
  segmented(f.ctrl, { label: 'Lieu', value: planet, options: [{ label: 'Terre', value: 'terre' }, { label: 'Mars', value: 'mars' }, { label: 'Lune', value: 'lune' }], onChange: v => { planet = v; reset(); } });
  slider(f.ctrl, { label: 'Charge réellement portée', min: 0, max: 5, step: 0.1, value: payload, unit: 'kg', onInput: v => { payload = v; } });
  slider(f.ctrl, { label: 'Charge que croit porter le contrôleur', min: 0, max: 5, step: 0.1, value: est, unit: 'kg', onInput: v => { est = v; } });
  slider(f.ctrl, { label: 'Kp', min: 5, max: 300, step: 1, value: kp, onInput: v => { kp = v; } });
  slider(f.ctrl, { label: 'Kd', min: 0, max: 60, step: 0.5, value: kd, onInput: v => { kd = v; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Rejouer la séquence', reset, 'primary');
  const ro = readout(f.ctrl, [['err', 'Erreur actuelle'], ['fin', 'Erreur moyenne en fin de mouvement'], ['tau', 'Couples (épaule ; coude)']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : sur Terre, avec 3 kg de charge et Kp ≤ 150, obtiens une erreur moyenne en fin de mouvement inférieure à 0,5°. Le PD seul n\'y arrive pas : pourquoi ? Que faut-il savoir sur la charge ?'
    : 'Le bras enchaîne trois positions. Avec un PD seul, la gravité laisse une erreur permanente : le moteur doit « sentir » une erreur pour produire le couple qui tient la charge. La compensation de gravité et le couple calculé utilisent le modèle du bras pour supprimer cette erreur, à condition que le modèle soit juste.');

  function reset() { q = [0, 0]; qd = [0, 0]; t = 0; hist = []; f.message(''); evaluate(); }
  function evaluate() {
    const e = simulateArm(CONTROLLERS[ctrlName], { payload, est, g: GRAV[planet], kp, kd });
    ro.set('fin', `${fmt(e, 2)}°`, e < 0.5 ? 'var(--ok)' : 'var(--warn)');
    if (opts.goal && !solved && planet === 'terre' && Math.abs(payload - 3) < 0.05 && kp <= 150 && e < 0.5) {
      solved = true; f.message(`Erreur moyenne de ${fmt(e, 2)}° : en connaissant la charge, le contrôleur compense la gravité au lieu de la subir.`); api.success && api.success();
    }
  }
  reset();

  const cv = canvas(f.stage);
  let evalTimer = 0;
  const lp = loop(root, dt => {
    const g = GRAV[planet];
    const n = 20, h = Math.min(dt, 0.04) / n;
    for (let i = 0; i < n; i++) {
      const r = targets[Math.min(2, Math.floor((t % 9) / 3))];
      tau = CONTROLLERS[ctrlName](q, qd, r, { payload, est, g, kp, kd }).map(v => Math.max(-TMAX, Math.min(TMAX, v)));
      const { Mm, C, G } = dyn(q, qd, M2 + payload, g);
      const b = [tau[0] - C[0] - G[0] - FRIC * qd[0], tau[1] - C[1] - G[1] - FRIC * qd[1]];
      const det = Mm[0][0] * Mm[1][1] - Mm[0][1] * Mm[1][0];
      const a0 = (Mm[1][1] * b[0] - Mm[0][1] * b[1]) / det, a1 = (-Mm[1][0] * b[0] + Mm[0][0] * b[1]) / det;
      qd = [qd[0] + a0 * h, qd[1] + a1 * h]; q = [q[0] + qd[0] * h, q[1] + qd[1] * h]; t += h;
    }
    const r = targets[Math.min(2, Math.floor((t % 9) / 3))];
    const err = Math.hypot(r[0] - q[0], r[1] - q[1]) * 180 / Math.PI;
    hist.push(err); if (hist.length > 540) hist.shift();
    evalTimer += dt; if (evalTimer > 0.4) { evalTimer = 0; evaluate(); }
    draw(r, err);
  });

  function draw(r, err) {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const S = Math.min(W * 0.5, H * 0.95) / 2.4, ox = W * 0.27, oy = H * 0.62;
    const P = (a, b) => [ox + a * S, oy - b * S];
    const fk = qq => { const e = [L1 * Math.cos(qq[0]), L1 * Math.sin(qq[0])]; return [e, [e[0] + L2 * Math.cos(qq[0] + qq[1]), e[1] + L2 * Math.sin(qq[0] + qq[1])]]; };
    const [te, tp] = fk(r);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = th.faint; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(...P(...te)); ctx.lineTo(...P(...tp)); ctx.stroke(); ctx.setLineDash([]);
    const [e, p] = fk(q);
    ctx.lineCap = 'round';
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(...P(...e)); ctx.stroke();
    ctx.strokeStyle = th.accent; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(...P(...e)); ctx.lineTo(...P(...p)); ctx.stroke();
    circle(ctx, ox, oy, 8, th.text); circle(ctx, ...P(...e), 6, th.text);
    const [px, py] = P(...p);
    ctx.fillStyle = th.warn; ctx.fillRect(px - 4 - payload * 2, py + 2, 8 + payload * 4, 6 + payload * 3);
    ctx.fillStyle = th.faint; ctx.fillRect(ox - 30, oy + 10, 60, 6);
    text(ctx, `g = ${String(GRAV[planet]).replace('.', ',')} m/s²`, 10, 18, { color: th.muted, size: 11 });
    plot(ctx, { x: W * 0.56, y: 12, w: W * 0.44 - 14, h: H - 24 }, [{ ys: hist, color: th.danger, label: 'erreur (°)' }], { ymin: 0, ymax: 20, th, hlines: [{ v: 0.5, color: th.ok, label: '0,5°' }] });
    ro.set('err', `${fmt(err, 2)}°`);
    ro.set('tau', `${fmt(tau[0], 1)} ; ${fmt(tau[1], 1)} N·m`);
  }
  return () => { lp.stop(); cv.destroy(); };
}
