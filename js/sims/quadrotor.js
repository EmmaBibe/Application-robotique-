import { frame, canvas, theme, text, slider, readout, segmented, checkbox, loop, drag, fmt, randn, note } from '../core/kit.js';

// Drone vu de face (modèle plan) : deux groupes de rotors, commande en cascade.
// Sur Terre ou sur Mars, où l'air est environ 70 fois moins dense.
const PLANETS = {
  terre: { g: 9.81, rho: 1.225, sound: 340, name: 'Terre' },
  mars: { g: 3.71, rho: 0.017, sound: 240, name: 'Mars' },
};
const CT = 0.1, ARM = 0.25;

export function rotorThrust(rho, rpm, D) { return CT * rho * Math.pow(rpm / 60, 2) * Math.pow(D, 4); }

export default function quadrotor(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Faire voler un drone, sur Terre ou sur Mars', tag: 'Drones · commande', height: 430 });
  let planet = opts.planet || 'terre', mass = 1.8, D = 0.4, rpm = 4000, kpa = 60, kpx = 1.5, wind = false, solved = false;
  let s, target, holdT;

  segmented(f.ctrl, { label: 'Planète', value: planet, options: [{ label: 'Terre', value: 'terre' }, { label: 'Mars', value: 'mars' }], onChange: v => { planet = v; reset(); } });
  slider(f.ctrl, { label: 'Masse du drone', min: 0.5, max: 3, step: 0.1, value: mass, unit: 'kg', onInput: v => { mass = v; } });
  slider(f.ctrl, { label: 'Diamètre des rotors', min: 0.2, max: 1.4, step: 0.01, value: D, unit: 'm', onInput: v => { D = v; } });
  slider(f.ctrl, { label: 'Vitesse maximale des rotors', min: 1000, max: 6000, step: 50, value: rpm, unit: 'tr/min', onInput: v => { rpm = v; } });
  slider(f.ctrl, { label: 'Gain d\'attitude (boucle interne)', min: 5, max: 150, step: 1, value: kpa, onInput: v => { kpa = v; } });
  slider(f.ctrl, { label: 'Gain de position (boucle externe)', min: 0.2, max: 5, step: 0.1, value: kpx, onInput: v => { kpx = v; } });
  checkbox(f.ctrl, { label: 'Rafales de vent', value: wind, onChange: v => { wind = v; } });
  const ro = readout(f.ctrl, [['tw', 'Rapport poussée / poids'], ['tip', 'Vitesse en bout de pale'], ['err', 'Écart à la cible'], ['phi', 'Inclinaison']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi Ingenuity</b> : sur Mars, avec un drone de 1,8 kg, obtiens un rapport poussée/poids d\'au moins 1,5 avec des bouts de pale sous 0,7 fois la vitesse du son (168 m/s), puis tiens la cible à moins de 30 cm pendant 10 s avec le vent.'
    : 'Touche la scène pour déplacer la cible. La boucle externe transforme l\'écart de position en inclinaison voulue ; la boucle interne règle l\'inclinaison en jouant sur la différence de poussée entre les rotors.');

  function reset() { s = { x: 0, y: 0.5, vx: 0, vy: 0, phi: 0, w: 0, T1: 0, T2: 0 }; target = { x: 1, y: 2 }; holdT = 0; f.message(''); }
  reset();

  const cv = canvas(f.stage);
  let S = 60, gx = 0, gy = 0;
  const off = drag(cv, { down: p => { target = { x: (p.x - gx) / S, y: Math.max(0.3, (gy - p.y) / S) }; holdT = 0; }, move: p => { target = { x: (p.x - gx) / S, y: Math.max(0.3, (gy - p.y) / S) }; } });

  let gust = 0;
  const lp = loop(root, dt => {
    const P = PLANETS[planet];
    const Tmax = rotorThrust(P.rho, rpm, D) * 2; // deux rotors par côté
    const I = mass * ARM * ARM * 0.5;
    const n = 10, h = Math.min(dt, 0.04) / n;
    for (let i = 0; i < n; i++) {
      if (wind) gust += (-gust * 0.5 + randn() * 2.5) * h * 3; else gust *= 0.98;
      // boucle externe
      const axd = kpx * (target.x - s.x) - 1.8 * s.vx;
      const phid = Math.max(-0.45, Math.min(0.45, -axd / P.g));
      const azd = 4 * (target.y - s.y) - 3 * s.vy;
      const F = mass * (P.g + azd) / Math.max(0.5, Math.cos(s.phi));
      // boucle interne
      const tau = I * (kpa * (phid - s.phi) - 2 * Math.sqrt(kpa) * s.w);
      let T1c = F / 2 - tau / (2 * ARM), T2c = F / 2 + tau / (2 * ARM);
      T1c = Math.max(0, Math.min(Tmax, T1c)); T2c = Math.max(0, Math.min(Tmax, T2c));
      s.T1 += (T1c - s.T1) * h / 0.05; s.T2 += (T2c - s.T2) * h / 0.05;
      const Ft = s.T1 + s.T2, drag = 0.15 + 0.4 * P.rho;
      const ax = (-Ft * Math.sin(s.phi) + gust * P.rho * 3 - drag * s.vx) / mass;
      const ay = (Ft * Math.cos(s.phi) - drag * s.vy) / mass - P.g;
      s.vx += ax * h; s.vy += ay * h; s.x += s.vx * h; s.y += s.vy * h;
      s.w += (s.T2 - s.T1) * ARM / I * h; s.phi += s.w * h;
      if (s.y < 0) { s.y = 0; s.vy = Math.max(0, s.vy); s.vx *= 0.8; }
    }
    const err = Math.hypot(target.x - s.x, target.y - s.y);
    const tw = Tmax * 2 / (mass * P.g);
    const tip = Math.PI * D * rpm / 60;
    holdT = err < 0.3 ? holdT + dt : 0;
    if (opts.goal && !solved && planet === 'mars' && Math.abs(mass - 1.8) < 0.05 && tw >= 1.5 && tip <= 0.7 * P.sound && wind && holdT > 10) {
      solved = true; f.message('Défi relevé : ton hélicoptère tient sur Mars. Ingenuity a fait exactement ce compromis : grands rotors, rotation rapide, mais bouts de pale sous la vitesse du son.'); api.success && api.success();
    }
    draw(P, tw, tip, err);
  });

  function draw(P, tw, tip, err) {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = planet === 'mars' ? '#3a2018' : th.bg; ctx.fillRect(0, 0, W, H);
    S = Math.min(W / 6, H / 4); gx = W / 2; gy = H - 24;
    ctx.fillStyle = planet === 'mars' ? '#a5552f' : th.line; ctx.fillRect(0, gy, W, 24);
    const tx = gx + target.x * S, ty = gy - target.y * S;
    ctx.strokeStyle = th.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty, 0.3 * S, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx - 8, ty); ctx.lineTo(tx + 8, ty); ctx.moveTo(tx, ty - 8); ctx.lineTo(tx, ty + 8); ctx.stroke();
    const dx = gx + s.x * S, dy = gy - s.y * S;
    ctx.save(); ctx.translate(dx, dy); ctx.rotate(-s.phi);
    const a = ARM * S;
    ctx.strokeStyle = th.text; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-a, 0); ctx.lineTo(a, 0); ctx.stroke();
    ctx.fillStyle = th.accent2; ctx.fillRect(-12, -6, 24, 12);
    const rotor = (x, T) => {
      const rw = Math.min(D * S * 0.5, a * 0.9);
      ctx.strokeStyle = th.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - rw, -10); ctx.lineTo(x + rw, -10); ctx.stroke();
      ctx.strokeStyle = th.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, 4 + 30 * T / (mass * P.g)); ctx.stroke();
    };
    rotor(-a, s.T1); rotor(a, s.T2);
    ctx.restore();
    text(ctx, `${P.name} · g = ${String(P.g).replace('.', ',')} m/s² · densité de l'air ${String(P.rho).replace('.', ',')} kg/m³`, 10, 18, { color: '#fff', size: 11 });
    ro.set('tw', fmt(tw, 2), tw >= 1.5 ? 'var(--ok)' : tw < 1 ? 'var(--danger)' : 'var(--warn)');
    ro.set('tip', `${fmt(tip, 0)} m/s (${fmt(tip / P.sound, 2)} × son)`, tip <= 0.7 * P.sound ? '' : 'var(--danger)');
    ro.set('err', `${fmt(err, 2)} m`, err < 0.3 ? 'var(--ok)' : '');
    ro.set('phi', `${fmt(s.phi * 180 / Math.PI, 1)}°`);
  }
  return () => { off(); lp.stop(); cv.destroy(); };
}
