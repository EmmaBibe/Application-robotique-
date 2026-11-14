import { frame, canvas, theme, text, slider, readout, segmented, button, buttons, loop, fmt, plot, note } from '../core/kit.js';

// Descente propulsée sur Mars : poser l'atterrisseur en douceur sans gaspiller le carburant.
const G = 3.71, G0 = 9.81, ISP = 225, TMAX = 10000, DRY = 1100, FUEL0 = 400;

export function simulateLanding(policy, dt = 0.02) {
  // utilisé aussi par les tests : renvoie l'état final
  let h = 1500, v = -75, fuel = FUEL0, tt = 0;
  while (h > 0 && tt < 400) {
    const m = DRY + fuel;
    let thr = Math.max(0, Math.min(1, policy({ h, v, m, fuel })));
    if (fuel <= 0) thr = 0;
    const T = thr * TMAX;
    fuel = Math.max(0, fuel - T / (ISP * G0) * dt);
    v += (T / m - G) * dt;
    h += v * dt;
    tt += dt;
  }
  return { v, fuel, t: tt };
}

export default function lander(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Atterrissage propulsé sur Mars', tag: 'Commande · espace', height: 440 });
  let mode = 'auto', aRef = 2.5, kp = 1.2, manualThr = 0, holding = false;
  let st, hist, running = false, solved = false;

  segmented(f.ctrl, { label: 'Pilotage', value: mode, options: [{ label: 'Autopilote', value: 'auto' }, { label: 'Manuel', value: 'manuel' }], onChange: v => { mode = v; reset(); } });
  slider(f.ctrl, { label: 'Autopilote : décélération visée', min: 0.5, max: 6, step: 0.1, value: aRef, unit: 'm/s²', onInput: v => { aRef = v; } });
  slider(f.ctrl, { label: 'Autopilote : gain Kp sur la vitesse', min: 0.1, max: 5, step: 0.1, value: kp, onInput: v => { kp = v; } });
  slider(f.ctrl, { label: 'Manuel : poussée', min: 0, max: 100, step: 1, value: 0, unit: '%', onInput: v => { manualThr = v / 100; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Commencer la descente', () => { reset(); running = true; }, 'primary');
  const boost = button(bb, 'Pleine poussée (maintenir)', () => {});
  ['pointerdown', 'pointerup', 'pointerleave'].forEach(ev => boost.addEventListener(ev, () => { holding = ev === 'pointerdown'; }));
  const ro = readout(f.ctrl, [['h', 'Altitude'], ['v', 'Vitesse verticale'], ['fuel', 'Carburant restant'], ['thr', 'Poussée'], ['tw', 'Rapport poussée / poids']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : posé à moins de 2 m/s, avec au moins 60 % de carburant restant. Indice : freiner tard et fort gaspille moins que freiner tôt et doucement, car chaque seconde de vol, la gravité « coûte » du carburant.'
    : 'L\'autopilote suit une vitesse de consigne qui diminue avec l\'altitude, v = −√(2·a·h), et corrige l\'écart avec un gain proportionnel. Sur Mars, g = 3,71 m/s².');

  function policyAuto(s) {
    const vRef = -Math.sqrt(2 * aRef * Math.max(s.h, 0)) - 0.8;
    const aCmd = G + kp * (vRef - s.v);
    return aCmd * s.m / TMAX;
  }
  function reset() { st = { h: 1500, v: -75, fuel: FUEL0, thr: 0, t: 0, over: false }; hist = []; running = false; f.message(''); }
  reset();

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    if (running && !st.over) {
      const n = 4, h = Math.min(dt, 0.05) / n;
      for (let i = 0; i < n; i++) {
        const m = DRY + st.fuel;
        let thr = holding ? 1 : mode === 'auto' ? policyAuto({ ...st, m }) : manualThr;
        thr = Math.max(0, Math.min(1, thr));
        if (st.fuel <= 0) thr = 0;
        const T = thr * TMAX;
        st.fuel = Math.max(0, st.fuel - T / (ISP * G0) * h);
        st.v += (T / m - G) * h; st.h += st.v * h; st.t += h; st.thr = thr;
        if (st.h <= 0) { st.h = 0; st.over = true; finish(); break; }
      }
      hist.push(st.v); if (hist.length > 600) hist.shift();
    }
    draw();
  });
  function finish() {
    const v = Math.abs(st.v), pct = st.fuel / FUEL0 * 100;
    if (v <= 2) {
      f.message(`Posé à ${fmt(v, 2)} m/s avec ${fmt(pct, 0)} % de carburant. Bienvenue sur Mars.`);
      if (opts.goal && !solved && pct >= 60) { solved = true; api.success && api.success(); }
    } else if (v <= 5) f.message(`Atterrissage dur à ${fmt(v, 1)} m/s : les jambes ont plié, les instruments ont souffert.`, false);
    else f.message(`Impact à ${fmt(v, 0)} m/s : mission perdue. Analyse la courbe de vitesse et recommence.`, false);
  }

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a1a1a'); sky.addColorStop(1, '#c98a5e');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W * 0.55, H);
    const gy = H - 30, sc = (gy - 30) / 1600;
    ctx.fillStyle = '#8a4a2a'; ctx.fillRect(0, gy, W * 0.55, 30);
    const lx = W * 0.275, ly = gy - st.h * sc;
    // flamme
    if (st.thr > 0.02 && !st.over) {
      ctx.fillStyle = `rgba(255,${150 + 80 * Math.random()},60,.9)`;
      ctx.beginPath(); ctx.moveTo(lx - 7, ly + 6); ctx.lineTo(lx + 7, ly + 6); ctx.lineTo(lx, ly + 6 + 40 * st.thr * (0.8 + 0.4 * Math.random())); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#d9dde6'; ctx.fillRect(lx - 14, ly - 18, 28, 20);
    ctx.strokeStyle = '#d9dde6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx - 12, ly + 2); ctx.lineTo(lx - 20, ly + 8); ctx.moveTo(lx + 12, ly + 2); ctx.lineTo(lx + 20, ly + 8); ctx.stroke();
    text(ctx, `${Math.round(st.h)} m`, lx + 26, ly - 4, { color: '#fff', size: 12, weight: 700 });
    // jauge carburant
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(12, 12, 14, 120);
    ctx.fillStyle = st.fuel / FUEL0 > 0.3 ? th.ok : th.warn; const fh = 120 * st.fuel / FUEL0; ctx.fillRect(12, 132 - fh, 14, fh);
    text(ctx, 'carburant', 32, 24, { color: '#fff', size: 10 });
    plot(ctx, { x: W * 0.58, y: 14, w: W * 0.42 - 14, h: H - 28 }, [{ ys: hist, color: th.accent, label: 'vitesse verticale (m/s)' }], { ymin: -100, ymax: 10, th, hlines: [{ v: -2, color: th.ok, label: 'limite −2 m/s' }] });
    ro.set('h', `${fmt(st.h, 0)} m`);
    ro.set('v', `${fmt(st.v, 1)} m/s`, Math.abs(st.v) <= 2 ? 'var(--ok)' : '');
    ro.set('fuel', `${fmt(st.fuel, 0)} kg (${fmt(st.fuel / FUEL0 * 100, 0)} %)`);
    ro.set('thr', `${fmt(st.thr * 100, 0)} %`);
    ro.set('tw', fmt(TMAX / ((DRY + st.fuel) * G), 2));
  }
  return () => { lp.stop(); cv.destroy(); };
}
