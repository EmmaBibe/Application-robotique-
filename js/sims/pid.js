import { frame, canvas, theme, text, plot, slider, readout, checkbox, segmented, button, buttons, loop, fmt, randn, circle, note } from '../core/kit.js';

// Asservissement PID de la position angulaire d'un moteur.
// La réponse indicielle complète est recalculée à chaque réglage, puis rejouée.
export default function pid(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Régulateur PID : asservir un moteur', tag: 'Commande', height: 420 });
  let Kp = opts.Kp ?? 2, Ki = opts.Ki ?? 0, Kd = opts.Kd ?? 0;
  let dist = false, noisy = false, sat = true, mode = 'closed';
  let resp = null, play = 0, solved = false;
  const T = 5, dt = 0.002, target = 1; // consigne : 1 rad

  segmented(f.ctrl, { label: 'Boucle', value: mode, options: [{ label: 'Fermée (PID)', value: 'closed' }, { label: 'Ouverte', value: 'open' }], onChange: v => { mode = v; recompute(); } });
  const sp = slider(f.ctrl, { label: 'Kp (proportionnel)', min: 0, max: 30, step: 0.1, value: Kp, onInput: v => { Kp = v; recompute(); } });
  const si = slider(f.ctrl, { label: 'Ki (intégral)', min: 0, max: 30, step: 0.1, value: Ki, onInput: v => { Ki = v; recompute(); } });
  const sd = slider(f.ctrl, { label: 'Kd (dérivé)', min: 0, max: 5, step: 0.01, value: Kd, onInput: v => { Kd = v; recompute(); } });
  checkbox(f.ctrl, { label: 'Perturbation (charge ajoutée à t = 2,5 s)', value: dist, onChange: v => { dist = v; recompute(); } });
  checkbox(f.ctrl, { label: 'Bruit de mesure du capteur', value: noisy, onChange: v => { noisy = v; recompute(); } });
  checkbox(f.ctrl, { label: 'Saturation de la tension (±12 V)', value: sat, onChange: v => { sat = v; recompute(); } });
  const bb = buttons(f.ctrl);
  button(bb, 'Rejouer', () => { play = 0; }, 'primary');
  button(bb, 'Tout à zéro', () => { sp.set(0, true); si.set(0, true); sd.set(0, true); });
  const ro = readout(f.ctrl, [['os', 'Dépassement'], ['tr', 'Temps de montée'], ['ts', 'Temps d\'établissement (2 %)'], ['ess', 'Erreur finale'], ['umax', 'Tension max demandée']]);
  note(f.ctrl, opts.goal === 'tune'
    ? '<b>Défi</b> : dépassement &lt; 5 %, établissement &lt; 1 s, erreur finale &lt; 1 %, perturbation activée. Méthode : monte Kp, calme avec Kd, efface l\'erreur avec Ki.'
    : 'Moteur avec inertie et frottements. P réagit à l\'erreur présente, I à l\'erreur accumulée (le passé), D à la vitesse de l\'erreur (le futur proche).');

  function simulate() {
    const J = 0.02, b = 0.12, Kt = 0.6; // inertie, frottement visqueux, constante de couple
    let th = 0, w = 0, I = 0, prevE = target, umax = 0;
    const ys = [], us = [], n = Math.round(T / dt);
    // Boucle ouverte : on calcule à l'avance combien de temps alimenter le moteur,
    // à partir d'un modèle un peu faux (frottement estimé 0,10 au lieu de 0,12).
    let tOn = 0;
    if (mode === 'open') {
      let a = 0, v = 0; const bN = 0.10;
      while (a + v * J / bN < target && tOn < T) { v += ((Kt * 3 - bN * v) / J) * dt; a += v * dt; tOn += dt; }
    }
    let seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * 2 - 1; };
    for (let i = 0; i <= n; i++) {
      const t = i * dt;
      const meas = th + (noisy ? 0.02 * rnd() : 0);
      let u;
      if (mode === 'open') u = t < tOn ? 3 : 0;
      else {
        const e = target - meas;
        I += e * dt;
        const D = (e - prevE) / dt;
        prevE = e;
        u = Kp * e + Ki * I + Kd * D;
      }
      if (sat) {
        const uc = Math.max(-12, Math.min(12, u));
        if (uc !== u && mode === 'closed') I -= (target - meas) * dt; // anti-emballement de l'intégrale
        u = uc;
      }
      umax = Math.max(umax, Math.abs(u));
      const load = dist && t > 2.5 ? -0.25 : 0;
      const acc = (Kt * u - b * w + load) / J;
      w += acc * dt; th += w * dt;
      if (i % 5 === 0) { ys.push(th); us.push(u); }
    }
    return { ys, us, umax };
  }
  function metrics(ys) {
    const h = dt * 5, n = ys.length;
    const peak = Math.max(...ys);
    const os = Math.max(0, (peak - target) / target * 100);
    let tr = NaN;
    const i10 = ys.findIndex(v => v >= 0.1 * target), i90 = ys.findIndex(v => v >= 0.9 * target);
    if (i10 >= 0 && i90 >= 0) tr = (i90 - i10) * h;
    const limit = dist ? Math.round(2.5 / h) : n;
    let ts = NaN;
    for (let i = limit - 1; i >= 0; i--) { if (Math.abs(ys[i] - target) > 0.02 * target) { ts = (i + 1) * h; break; } }
    if (Number.isNaN(ts)) ts = 0;
    if (ts >= (limit - 1) * h) ts = NaN;
    const ess = Math.abs(target - ys[n - 1]) / target * 100;
    return { os, tr, ts, ess };
  }
  function recompute() {
    resp = simulate();
    resp.m = metrics(resp.ys);
    play = 0;
    const m = resp.m;
    ro.set('os', `${fmt(m.os, 1)} %`, m.os < 5 ? 'var(--ok)' : 'var(--warn)');
    ro.set('tr', Number.isNaN(m.tr) ? 'jamais' : `${fmt(m.tr, 2)} s`);
    ro.set('ts', Number.isNaN(m.ts) ? 'jamais' : `${fmt(m.ts, 2)} s`, !Number.isNaN(m.ts) && m.ts < 1 ? 'var(--ok)' : 'var(--warn)');
    ro.set('ess', `${fmt(m.ess, 2)} %`, m.ess < 1 ? 'var(--ok)' : 'var(--warn)');
    ro.set('umax', `${fmt(resp.umax, 1)} V`, resp.umax >= 11.99 ? 'var(--warn)' : '');
    if (opts.goal === 'tune' && !solved && mode === 'closed' && dist && m.os < 5 && !Number.isNaN(m.ts) && m.ts < 1 && m.ess < 1) {
      solved = true; f.message(`Réglage validé : ${fmt(m.os, 1)} % de dépassement, établi en ${fmt(m.ts, 2)} s. C'est le métier d'automaticien.`); api.success && api.success();
    }
  }
  recompute();

  const cv = canvas(f.stage);
  const lp = loop(root, dtf => { play = Math.min(T, play + dtf); draw(); });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const n = resp.ys.length, k = Math.min(n - 1, Math.floor(play / T * (n - 1)));
    // cadran moteur
    const R = Math.min(64, H * 0.17), cx = R + 24, cy = R + 20;
    circle(ctx, cx, cy, R, th.panel, th.line, 2);
    for (let a = 0; a < 12; a++) { const q = a / 12 * Math.PI * 2; ctx.strokeStyle = th.faint; ctx.beginPath(); ctx.moveTo(cx + Math.cos(q) * R * .85, cy - Math.sin(q) * R * .85); ctx.lineTo(cx + Math.cos(q) * R, cy - Math.sin(q) * R); ctx.stroke(); }
    ctx.strokeStyle = th.warn; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(target) * R, cy - Math.sin(target) * R); ctx.stroke(); ctx.setLineDash([]);
    const a = resp.ys[k];
    ctx.strokeStyle = th.accent; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * .9, cy - Math.sin(a) * R * .9); ctx.stroke();
    circle(ctx, cx, cy, 6, th.text);
    text(ctx, `t = ${fmt(play, 2)} s`, cx, cy + R + 18, { color: th.muted, size: 11, align: 'center' });
    text(ctx, 'consigne', cx + Math.cos(target) * R + 6, cy - Math.sin(target) * R - 6, { color: th.warn, size: 10 });
    // bloc-diagramme
    const bx = cx + R + 30;
    if (W - bx > 260) {
      const y = cy - 10, bw = (W - bx - 20) / 5;
      const box = (i, label, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.strokeRect(bx + i * bw + 6, y - 14, bw - 12, 28);
        text(ctx, label, bx + i * bw + bw / 2, y + 4, { color: col, size: 11, align: 'center', weight: 700 });
      };
      box(0, 'consigne', th.warn); box(1, '⊕ erreur', th.text); box(2, mode === 'open' ? 'calcul fixe' : 'PID', th.accent); box(3, 'moteur', th.accent2); box(4, 'angle', th.accent);
      if (mode === 'closed') {
        ctx.strokeStyle = th.faint; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(bx + 4.5 * bw, y + 14); ctx.lineTo(bx + 4.5 * bw, y + 34); ctx.lineTo(bx + 1.5 * bw, y + 34); ctx.lineTo(bx + 1.5 * bw, y + 14); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, 'capteur (retour)', bx + 3 * bw, y + 46, { color: th.faint, size: 10, align: 'center' });
      }
    }
    const top = cy + R + 30;
    const gh = H - top - 10;
    const pl = plot(ctx, { x: 16, y: top, w: W - 32, h: gh * 0.68 }, [
      { ys: resp.ys.slice(0, k + 1), color: th.accent, width: 2.5, label: 'angle mesuré (rad)' },
    ], { xmin: 0, xmax: n - 1, ymin: -0.2, ymax: Math.max(1.6, Math.min(3, Math.max(...resp.ys) * 1.1)), th, hlines: [{ v: target, color: th.warn, label: 'consigne' }, { v: 1.02, color: th.faint }, { v: 0.98, color: th.faint }], vlines: dist ? [{ v: 2.5 / T * (n - 1), color: th.danger }] : [] });
    void pl;
    plot(ctx, { x: 16, y: top + gh * 0.72, w: W - 32, h: gh * 0.28 }, [{ ys: resp.us.slice(0, k + 1), color: th.violet, width: 1.5, label: 'tension moteur (V)' }], { xmin: 0, xmax: n - 1, ymin: -13, ymax: 13, th });
  }
  return () => { lp.stop(); cv.destroy(); };
}
