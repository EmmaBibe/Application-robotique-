import { frame, canvas, theme, text, circle, slider, readout, segmented, button, buttons, loop, fmt, plot, note } from '../core/kit.js';

// Pendule inversé sur chariot : PID sur l'angle contre commande LQR par retour d'état.
const M = 1.0, m = 0.2, l = 0.5, g = 9.81, FMAX = 25, TRACK = 2.4;

function mat(A, B) { return A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0))); }
function tr(A) { return A[0].map((_, j) => A.map(r => r[j])); }
function add(A, B) { return A.map((r, i) => r.map((v, j) => v + B[i][j])); }
function sub(A, B) { return A.map((r, i) => r.map((v, j) => v - B[i][j])); }

/** Gain LQR par itération de l'équation de Riccati discrète. */
export function lqrGain(qx, qth, r, dt = 0.01) {
  const A = [[0, 1, 0, 0], [0, 0, -m * g / M, 0], [0, 0, 0, 1], [0, 0, (M + m) * g / (M * l), 0]];
  const B = [[0], [1 / M], [0], [-1 / (M * l)]];
  const Ad = A.map((row, i) => row.map((v, j) => (i === j ? 1 : 0) + v * dt));
  const Bd = B.map(rw => [rw[0] * dt]);
  const Q = [[qx, 0, 0, 0], [0, 0.1, 0, 0], [0, 0, qth, 0], [0, 0, 0, 0.1]].map(rw => rw.map(v => v * dt));
  let P = Q.map(rw => rw.slice());
  let K = [[0, 0, 0, 0]];
  for (let it = 0; it < 6000; it++) {
    const BtP = mat(tr(Bd), P);
    const S = r * dt + mat(BtP, Bd)[0][0];
    K = mat(BtP, Ad).map(rw => rw.map(v => v / S));
    P = add(Q, sub(mat(mat(tr(Ad), P), Ad), mat(mat(mat(tr(Ad), P), Bd), K)));
  }
  return K[0];
}

export default function cartpole(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Pendule inversé : l\'art de l\'équilibre', tag: 'Commande avancée', height: 420 });
  let mode = 'lqr', kp = 40, kd = 6, qx = 10, qth = 100, rr = 0.1, K = lqrGain(qx, qth, rr);
  let s, hist, t, fallen, pushes, solved = false;

  segmented(f.ctrl, { label: 'Commande', value: mode, options: [{ label: 'PID sur l\'angle seul', value: 'pid' }, { label: 'LQR (tout l\'état)', value: 'lqr' }], onChange: v => { mode = v; reset(); } });
  slider(f.ctrl, { label: 'PID : Kp', min: 0, max: 120, step: 1, value: kp, onInput: v => { kp = v; } });
  slider(f.ctrl, { label: 'PID : Kd', min: 0, max: 20, step: 0.5, value: kd, onInput: v => { kd = v; } });
  slider(f.ctrl, { label: 'LQR : poids sur la position du chariot', min: 0.1, max: 100, step: 0.1, value: qx, onInput: v => { qx = v; recompute(); } });
  slider(f.ctrl, { label: 'LQR : poids sur l\'angle', min: 1, max: 1000, step: 1, value: qth, onInput: v => { qth = v; recompute(); } });
  slider(f.ctrl, { label: 'LQR : coût de l\'effort (R)', min: 0.01, max: 5, step: 0.01, value: rr, onInput: v => { rr = v; recompute(); } });
  const bb = buttons(f.ctrl);
  button(bb, 'Pousser !', () => { s.td += 1.5; }, 'primary');
  button(bb, 'Recommencer', reset);
  const ro = readout(f.ctrl, [['k', 'Gains K (LQR)'], ['th', 'Angle'], ['x', 'Position du chariot'], ['F', 'Force appliquée'], ['t', 'Temps debout']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : reste en équilibre 25 secondes malgré une poussée automatique toutes les 5 secondes, sans sortir du rail. Essaie d\'abord le PID : comprends pourquoi le chariot finit par partir.'
    : 'Le PID ne regarde que l\'angle : il garde la tige droite mais laisse le chariot dériver jusqu\'au bout du rail. Le LQR utilise les quatre variables d\'état et trouve automatiquement les meilleurs gains pour le compromis que tu choisis.');

  function recompute() { K = lqrGain(qx, qth, rr); }
  function reset() { s = { x: 0, xd: 0, th: 0.08, td: 0 }; hist = []; t = 0; fallen = false; pushes = 0; f.message(''); }
  reset();

  function force() {
    let F = mode === 'pid' ? kp * s.th + kd * s.td : -(K[0] * s.x + K[1] * s.xd + K[2] * s.th + K[3] * s.td);
    return Math.max(-FMAX, Math.min(FMAX, F));
  }

  const cv = canvas(f.stage);
  let F = 0;
  const lp = loop(root, dt => {
    if (!fallen) {
      const n = 10, h = Math.min(dt, 0.05) / n;
      for (let i = 0; i < n; i++) {
        F = force();
        const sn = Math.sin(s.th), cs = Math.cos(s.th);
        const xdd = (F - m * g * sn * cs + m * l * sn * s.td * s.td) / (M + m * sn * sn);
        const tdd = (g * sn - cs * xdd) / l;
        s.xd += xdd * h; s.x += s.xd * h; s.td += tdd * h; s.th += s.td * h; t += h;
        if (opts.goal && t > (pushes + 1) * 5 && pushes < 5) { pushes++; s.td += (pushes % 2 ? 1 : -1) * 1.2; }
        if (Math.abs(s.th) > 1.0 || Math.abs(s.x) > TRACK) {
          fallen = true;
          f.message(Math.abs(s.x) > TRACK ? `Le chariot a atteint le bout du rail après ${fmt(t, 1)} s : la tige est tombée.` : `La tige est tombée après ${fmt(t, 1)} s.`, false);
          break;
        }
      }
      hist.push(s.th * 180 / Math.PI); if (hist.length > 500) hist.shift();
      if (opts.goal && !solved && !fallen && t >= 25) { solved = true; f.message('25 secondes d\'équilibre malgré les poussées : tu maîtrises la commande par retour d\'état, la base des robots qui marchent.'); api.success && api.success(); }
    }
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const S = (W - 40) / (2 * TRACK + 0.6), cx = W / 2, gy = H * 0.55;
    ctx.fillStyle = th.line; ctx.fillRect(cx - TRACK * S, gy + 14, 2 * TRACK * S, 4);
    ctx.fillStyle = th.danger; ctx.fillRect(cx - TRACK * S - 4, gy - 6, 4, 24); ctx.fillRect(cx + TRACK * S, gy - 6, 4, 24);
    const px = cx + s.x * S;
    ctx.fillStyle = th.accent2; ctx.fillRect(px - 28, gy - 12, 56, 26);
    circle(ctx, px - 16, gy + 16, 6, th.text); circle(ctx, px + 16, gy + 16, 6, th.text);
    const L = Math.min(H * 0.42, 1.0 * S);
    const tx = px + Math.sin(s.th) * L, ty = gy - Math.cos(s.th) * L;
    ctx.strokeStyle = fallen ? th.danger : th.warn; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, gy - 6); ctx.lineTo(tx, ty); ctx.stroke();
    circle(ctx, tx, ty, 10, fallen ? th.danger : th.warn);
    // flèche de force
    ctx.strokeStyle = th.ok; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, gy + 1); ctx.lineTo(px + F * 3, gy + 1); ctx.stroke();
    plot(ctx, { x: 12, y: H * 0.68, w: W - 24, h: H * 0.3 }, [{ ys: hist, color: th.warn, label: 'angle de la tige (°)' }], { ymin: -30, ymax: 30, th });
    ro.set('k', mode === 'lqr' ? K.map(v => fmt(v, 1)).join(' ; ') : '—');
    ro.set('th', `${fmt(s.th * 180 / Math.PI, 1)}°`);
    ro.set('x', `${fmt(s.x, 2)} m`, Math.abs(s.x) > TRACK * 0.8 ? 'var(--warn)' : '');
    ro.set('F', `${fmt(F, 1)} N`);
    ro.set('t', `${fmt(t, 1)} s`);
    void text;
  }
  return () => { lp.stop(); cv.destroy(); };
}
