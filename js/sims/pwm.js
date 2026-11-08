import { frame, canvas, theme, text, plot, slider, readout, segmented, loop, fmt, circle, note } from '../core/kit.js';

// PWM et pont en H : comment un microcontrôleur qui ne sait sortir que 0 V ou 5 V
// arrive à faire tourner un moteur à n'importe quelle vitesse, dans les deux sens.
export default function pwm(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'PWM et pont en H', tag: 'Électronique', height: 380 });
  let duty = 50, freq = 20, dir = 1, Vbat = 12;
  let w = 0, ang = 0, tsim = 0, solved = false;
  const hist = [];
  slider(f.ctrl, { label: 'Rapport cyclique', min: 0, max: 100, step: 1, value: duty, unit: '%', onInput: v => { duty = v; } });
  slider(f.ctrl, { label: 'Fréquence PWM (ralentie pour la voir)', min: 2, max: 60, step: 1, value: freq, unit: 'Hz', onInput: v => { freq = v; } });
  slider(f.ctrl, { label: 'Tension batterie', min: 3, max: 24, step: 1, value: Vbat, unit: 'V', onInput: v => { Vbat = v; } });
  segmented(f.ctrl, { label: 'Pont en H', value: 1, options: [{ label: 'Avant', value: 1 }, { label: 'Arrière', value: -1 }, { label: 'Frein', value: 0 }], onChange: v => { dir = v; } });
  const ro = readout(f.ctrl, [['avg', 'Tension moyenne'], ['w', 'Vitesse moteur'], ['sw', 'Interrupteurs fermés']]);
  note(f.ctrl, opts.goal === 'half' ? 'Défi : avec une batterie de 12 V, fais tourner le moteur en arrière avec une tension moyenne de 6 V.' : 'Le moteur, grâce à son inertie, « lisse » les créneaux : il ne voit que la moyenne. Ce lissage est un filtre passe-bas mécanique.');

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    const sub = 8;
    for (let i = 0; i < sub; i++) {
      const h = dt / sub;
      tsim += h;
      const on = ((tsim * freq) % 1) < duty / 100;
      const u = dir === 0 ? 0 : (on ? dir * Vbat : 0);
      // moteur du premier ordre : tau = 0,25 s, gain 25 rad/s par volt / 12
      const target = u * (300 / 12);
      const tau = dir === 0 ? 0.08 : 0.25;
      w += (target - w) * (h / tau);
      ang += w * h;
      hist.push({ u, w });
      if (hist.length > 900) hist.shift();
    }
    draw();
    const avg = dir * Vbat * duty / 100;
    if (opts.goal === 'half' && !solved && Vbat === 12 && dir === -1 && Math.abs(avg + 6) < 0.13) {
      solved = true; f.message('Exactement : 50 % de 12 V en marche arrière. Tu pilotes un moteur comme un vrai contrôleur.'); api.success && api.success();
    }
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const avg = dir * Vbat * duty / 100;
    // pont en H (schéma)
    const hx = 20, hy = 16, hw = Math.min(230, W * 0.42), hh = H * 0.48;
    const L = hx + 30, Rr = hx + hw - 30, T = hy + 20, B = hy + hh - 10, M = (T + B) / 2;
    ctx.strokeStyle = th.muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(Rr, T); ctx.moveTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
    text(ctx, `+${Vbat} V`, (L + Rr) / 2, T - 6, { color: th.danger, align: 'center', size: 11, weight: 700 });
    text(ctx, '0 V', (L + Rr) / 2, B + 14, { color: th.muted, align: 'center', size: 11 });
    const on = ((tsim * freq) % 1) < duty / 100;
    const sw = { S1: dir === 1 && on, S4: dir === 1 && on, S2: dir === -1 && on, S3: dir === -1 && on };
    if (dir === 0) { sw.S3 = true; sw.S4 = true; }
    const drawSw = (x, y1, y2, closed, name) => {
      ctx.strokeStyle = closed ? th.ok : th.faint; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + 8);
      if (closed) ctx.lineTo(x, y2 - 8); else ctx.lineTo(x + 12, y2 - 12);
      ctx.moveTo(x, y2 - 8); ctx.lineTo(x, y2); ctx.stroke();
      text(ctx, name, x - 8, (y1 + y2) / 2 + 4, { color: closed ? th.ok : th.faint, size: 11, align: 'right', weight: 700 });
    };
    drawSw(L, T, M - 14, sw.S1, 'S1'); drawSw(L, M + 14, B, sw.S3, 'S3');
    drawSw(Rr, T, M - 14, sw.S2, 'S2'); drawSw(Rr, M + 14, B, sw.S4, 'S4');
    ctx.strokeStyle = th.muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L, M - 14); ctx.lineTo(L, M + 14); ctx.moveTo(Rr, M - 14); ctx.lineTo(Rr, M + 14);
    ctx.moveTo(L, M); ctx.lineTo((L + Rr) / 2 - 18, M); ctx.moveTo((L + Rr) / 2 + 18, M); ctx.lineTo(Rr, M); ctx.stroke();
    circle(ctx, (L + Rr) / 2, M, 18, th.bg, th.accent2, 2.5);
    text(ctx, 'M', (L + Rr) / 2, M + 5, { color: th.accent2, align: 'center', size: 14, weight: 800 });
    // moteur qui tourne
    const mx = hx + hw + (W - hx - hw) / 2, my = hy + hh / 2, mr = Math.min(60, hh * 0.42);
    circle(ctx, mx, my, mr, th.panel, th.line, 2);
    for (let k = 0; k < 3; k++) {
      const a = ang * 0.05 + k * 2.094;
      ctx.strokeStyle = th.accent; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a) * mr * 0.8, my + Math.sin(a) * mr * 0.8); ctx.stroke();
    }
    circle(ctx, mx, my, 7, th.text);
    text(ctx, `${fmt(w * 60 / (2 * Math.PI), 0)} tr/min`, mx, my + mr + 18, { color: th.text, align: 'center', size: 12, weight: 700 });
    // graphe
    const r = { x: 20, y: hy + hh + 14, w: W - 40, h: H - hy - hh - 24 };
    plot(ctx, r, [
      { ys: hist.map(p => p.u), color: th.warn, width: 1.5, label: 'tension appliquée (V)' },
      { ys: hist.map(p => p.w / 25), color: th.accent, width: 2.5, label: 'vitesse (échelle V)' },
    ], { ymin: -Vbat * 1.1, ymax: Vbat * 1.1, th, hlines: [{ v: avg, color: th.violet, label: `moyenne ${fmt(avg, 1)} V` }] });

    ro.set('avg', `${fmt(avg, 2)} V`);
    ro.set('w', `${fmt(w * 60 / (2 * Math.PI), 0)} tr/min`);
    ro.set('sw', dir === 0 ? 'S3 + S4 (frein)' : dir === 1 ? 'S1 + S4' : 'S2 + S3');
  }
  return () => { lp.stop(); cv.destroy(); };
}
