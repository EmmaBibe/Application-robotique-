import { frame, canvas, theme, text, slider, readout, loop, fmt, circle, note } from '../core/kit.js';

// Réducteur à engrenages : on échange de la vitesse contre du couple.
export default function gears(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Engrenages : vitesse contre couple', tag: 'Mécanique', height: 330 });
  let z1 = 12, z2 = 36, wm = 3000, Tm = 0.05, eta = 0.9, load = 0.5;
  let a1 = 0, solved = false;
  slider(f.ctrl, { label: 'Dents du pignon moteur Z1', min: 8, max: 40, step: 1, value: z1, onInput: v => { z1 = v; upd(); } });
  slider(f.ctrl, { label: 'Dents de la roue de sortie Z2', min: 8, max: 80, step: 1, value: z2, onInput: v => { z2 = v; upd(); } });
  slider(f.ctrl, { label: 'Couple moteur', min: 0.01, max: 0.2, step: 0.01, value: Tm, unit: 'N·m', onInput: v => { Tm = v; upd(); } });
  slider(f.ctrl, { label: 'Couple demandé par la charge', min: 0.05, max: 2, step: 0.05, value: load, unit: 'N·m', onInput: v => { load = v; upd(); } });
  const ro = readout(f.ctrl, [['r', 'Rapport de réduction'], ['wo', 'Vitesse de sortie'], ['to', 'Couple de sortie'], ['p', 'Puissance (in → out)'], ['ok', 'La charge bouge ?']]);
  note(f.ctrl, opts.goal === 'lift' ? 'Défi : règle la charge sur 0,4 N·m. Avec un moteur de 0,05 N·m, trouve un rapport (un seul étage) qui la fait tourner en gardant au moins 60 tr/min en sortie.' : 'Rendement 90 % : un peu d\'énergie part en chaleur dans les dents. La puissance ne se crée jamais, elle se transforme.');

  function vals() {
    const r = z2 / z1;
    return { r, wo: wm / r, to: Tm * r * eta, pin: Tm * wm * 2 * Math.PI / 60, pout: Tm * r * eta * (wm / r) * 2 * Math.PI / 60 };
  }
  function upd() {
    const v = vals(), moves = v.to >= load;
    ro.set('r', `${fmt(v.r, 2)} : 1`);
    ro.set('wo', `${fmt(v.wo, 0)} tr/min`);
    ro.set('to', `${fmt(v.to, 3)} N·m`);
    ro.set('p', `${fmt(v.pin, 1)} W → ${fmt(v.pout, 1)} W`);
    ro.set('ok', moves ? 'oui' : 'non, couple insuffisant', moves ? 'var(--ok)' : 'var(--danger)');
    if (opts.goal === 'lift' && !solved && Math.abs(Tm - 0.05) < 0.001 && load >= 0.4 && moves && v.wo >= 60) {
      solved = true; f.message(`Réussi avec un rapport ${fmt(v.r, 1)} : ${fmt(v.wo, 0)} tr/min et ${fmt(v.to, 2)} N·m.`); api.success && api.success();
    }
  }
  upd();
  const cv = canvas(f.stage);
  const lp = loop(root, dt => { const v = vals(); if (v.to >= load) a1 += (wm / 60) * 2 * Math.PI * dt * 0.02; draw(); });

  function gear(ctx, cx, cy, r, z, a, col, th) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.beginPath();
    const tooth = Math.min(10, r * 0.22);
    for (let i = 0; i < z; i++) {
      const a0 = (i / z) * Math.PI * 2, a1_ = ((i + 0.5) / z) * Math.PI * 2, a2 = ((i + 1) / z) * Math.PI * 2;
      ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
      ctx.lineTo(Math.cos(a0 + 0.1 / z * 6) * (r + tooth), Math.sin(a0 + 0.1 / z * 6) * (r + tooth));
      ctx.lineTo(Math.cos(a1_ - 0.1 / z * 6) * (r + tooth), Math.sin(a1_ - 0.1 / z * 6) * (r + tooth));
      ctx.lineTo(Math.cos(a1_) * r, Math.sin(a1_) * r);
      ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.globalAlpha = .9; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = th.bg; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = th.bg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * .7, 0); ctx.stroke();
    ctx.restore();
    circle(ctx, cx, cy, Math.max(4, r * 0.12), th.bg);
  }
  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const unit = Math.min((W - 60) / (z1 + z2) / 1.15, (H - 60) / (z2) / 1.15) * 1;
    const r1 = z1 * unit / 2 * 1.0, r2 = z2 * unit / 2;
    const cy = H / 2, cx1 = 30 + r1 + 6, cx2 = cx1 + r1 + r2 + 4;
    const r = z2 / z1;
    gear(ctx, cx1, cy, r1, z1, a1, th.accent2, th);
    gear(ctx, cx2, cy, r2, z2, -a1 / r + Math.PI / z2, th.accent, th);
    text(ctx, 'moteur', cx1, cy + r1 + 26, { color: th.accent2, align: 'center', size: 12, weight: 700 });
    text(ctx, 'sortie', cx2, cy + r2 + 26, { color: th.accent, align: 'center', size: 12, weight: 700 });
  }
  return () => { lp.stop(); cv.destroy(); };
}
