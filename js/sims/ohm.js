import { frame, canvas, theme, text, circle, slider, readout, segmented, loop, fmt, roundRect, note } from '../core/kit.js';

// Loi d'Ohm en vrai : une pile, une résistance, une LED. Le courant circule
// sous forme de particules dont la vitesse suit l'intensité.
const COLORS = ['#000000', '#8b4513', '#e02020', '#ff8c00', '#f2d600', '#1fa43a', '#1f5fd6', '#8a2be2', '#808080', '#ffffff'];
function resistorBands(R) {
  // R = abc × 10^m, avec abc entre 100 et 999
  let m = Math.floor(Math.log10(R)) - 2;
  let abc = Math.round(R / 10 ** m);
  if (abc >= 1000) { abc = Math.round(abc / 10); m++; }
  const d = String(abc).split('').map(Number);
  const mult = m === -1 ? '#d4af37' : m === -2 ? '#c0c0c0' : COLORS[m];
  return [COLORS[d[0]], COLORS[d[1]], COLORS[d[2]], mult, '#8b4513'];
}

export default function ohm(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Circuit : pile, résistance, LED', tag: 'Électronique', height: 340 });
  let mode = opts.mode || 'led';
  let V = 5, R = 330, R2 = 1000, burnt = false, solved = false, phase = 0;
  const VF = 2.0, IMAX = 0.025;

  segmented(f.ctrl, { label: 'Montage', value: mode, options: [{ label: 'LED + résistance', value: 'led' }, { label: 'Pont diviseur', value: 'div' }], onChange: v => { mode = v; burnt = false; update(); } });
  slider(f.ctrl, { label: 'Tension de la source U', min: 0, max: 12, step: 0.1, value: V, unit: 'V', onInput: v => { V = v; update(); } });
  const sR = slider(f.ctrl, { label: 'Résistance R (ou R1)', min: 10, max: 2000, step: 10, value: R, unit: 'Ω', onInput: v => { R = v; burnt = false; update(); } });
  const sR2 = slider(f.ctrl, { label: 'Résistance R2 (pont)', min: 10, max: 5000, step: 10, value: R2, unit: 'Ω', onInput: v => { R2 = v; update(); } });
  const ro = readout(f.ctrl, [['I', 'Intensité I'], ['UR', 'Tension sur R'], ['P', 'Puissance dans R'], ['x', '—']]);
  const hint = note(f.ctrl, '');

  function calc() {
    if (mode === 'led') {
      const I = V > VF ? (V - VF) / R : 0;
      return { I, UR: I * R, P: I * I * R };
    }
    const I = V / (R + R2);
    return { I, UR: I * R, P: I * I * R, Vout: V * R2 / (R + R2) };
  }
  function update() {
    sR2.el.style.display = mode === 'div' ? '' : 'none';
    const c = calc();
    if (mode === 'led' && c.I > IMAX * 1.4) burnt = true;
    ro.set('I', `${fmt(c.I * 1000, 1)} mA`, burnt ? 'var(--danger)' : '');
    ro.set('UR', `${fmt(c.UR, 2)} V`);
    ro.set('P', `${fmt(c.P * 1000, 1)} mW`, c.P > 0.25 ? 'var(--danger)' : '');
    ro.set('x', mode === 'led' ? (burnt ? 'LED grillée' : c.I > 0 ? 'LED allumée' : 'LED éteinte (U < 2 V)') : `U_sortie = ${fmt(c.Vout, 2)} V`, burnt ? 'var(--danger)' : 'var(--accent)');
    hint.innerHTML = mode === 'led'
      ? 'La LED « consomme » environ 2 V. Le reste tombe dans la résistance : I = (U − 2) / R. Au-delà de 25 mA, la LED souffre ; au-delà de 35 mA, elle grille.'
      : 'Deux résistances en série partagent la tension. U<sub>sortie</sub> = U × R2 / (R1 + R2). C\'est ainsi qu\'un microcontrôleur lit une photorésistance ou une thermistance.';
    if (opts.goal === 'led15' && !solved && mode === 'led' && Math.abs(V - 5) < 0.05 && Math.abs(c.I - 0.015) < 0.0012) {
      solved = true; f.message(`Exact : R = ${R} Ω donne ${fmt(c.I * 1000, 1)} mA. C'est le calcul que tu feras sur chaque carte électronique.`); api.success && api.success();
    }
  }
  if (opts.goal === 'led15') { hint.after(Object.assign(document.createElement('div'), { className: 'small', innerHTML: '<b>Défi</b> : avec U = 5 V, règle R pour faire passer 15 mA (± 1 mA) dans la LED.' })); }

  const cv = canvas(f.stage);
  const lp = loop(root, dt => { phase += dt * Math.min(calc().I * 2500, 80); draw(); });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const x0 = W * 0.15, x1 = W * 0.85, y0 = H * 0.2, y1 = H * 0.8;
    const c = calc();
    // fils
    ctx.strokeStyle = th.muted; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.stroke();
    // particules le long du circuit (sens conventionnel : + vers −)
    const per = 2 * (x1 - x0) + 2 * (y1 - y0);
    const ptAt = d => {
      d = ((d % per) + per) % per;
      const L1 = x1 - x0, L2 = y1 - y0;
      if (d < L1) return [x0 + d, y0];
      d -= L1; if (d < L2) return [x1, y0 + d];
      d -= L2; if (d < L1) return [x1 - d, y1];
      d -= L1; return [x0, y1 - d];
    };
    if (c.I > 0 && !burnt) {
      ctx.fillStyle = th.warn;
      for (let d = 0; d < per; d += 26) { const [px, py] = ptAt(d + phase); ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill(); }
    }
    // pile à gauche
    const by = (y0 + y1) / 2;
    ctx.fillStyle = th.bg; ctx.fillRect(x0 - 22, by - 30, 44, 60);
    ctx.strokeStyle = th.text; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 - 18, by - 8); ctx.lineTo(x0 + 18, by - 8); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0 - 9, by + 8); ctx.lineTo(x0 + 9, by + 8); ctx.stroke();
    text(ctx, '+', x0 + 24, by - 12, { color: th.danger, size: 16, weight: 700 });
    text(ctx, `${fmt(V, 1)} V`, x0, by + 50, { color: th.text, align: 'center', size: 13, weight: 700 });
    // résistance en haut
    const rx = (x0 + x1) / 2 - 40;
    ctx.fillStyle = th.bg; ctx.fillRect(rx - 4, y0 - 14, 88, 28);
    roundRect(ctx, rx, y0 - 11, 80, 22, 6); ctx.fillStyle = '#c9a36b'; ctx.fill();
    // code couleur à 5 anneaux : 3 chiffres significatifs, multiplicateur, tolérance (1 %)
    resistorBands(R).forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(rx + 12 + i * 12 + (i === 4 ? 8 : 0), y0 - 11, 6, 22); });
    text(ctx, `R${mode === 'div' ? '1' : ''} = ${R} Ω`, rx + 40, y0 - 20, { color: th.text, align: 'center', size: 12, weight: 700 });
    // composant à droite
    const cy = (y0 + y1) / 2;
    if (mode === 'led') {
      const glow = burnt ? 0 : Math.min(1, c.I / 0.02);
      if (glow > 0) {
        const g = ctx.createRadialGradient(x1, cy, 2, x1, cy, 70 * glow + 10);
        g.addColorStop(0, `rgba(255,70,70,${0.75 * glow})`); g.addColorStop(1, 'rgba(255,70,70,0)');
        ctx.fillStyle = g; ctx.fillRect(x1 - 90, cy - 90, 180, 180);
      }
      ctx.fillStyle = th.bg; ctx.fillRect(x1 - 18, cy - 22, 36, 44);
      ctx.beginPath(); ctx.moveTo(x1 - 14, cy - 14); ctx.lineTo(x1 + 14, cy - 14); ctx.lineTo(x1, cy + 10); ctx.closePath();
      ctx.fillStyle = burnt ? '#444' : `rgb(${120 + 135 * glow},${40 + 20 * glow},${40 + 20 * glow})`; ctx.fill();
      ctx.strokeStyle = th.text; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 - 14, cy + 12); ctx.lineTo(x1 + 14, cy + 12); ctx.stroke();
      text(ctx, burnt ? 'grillée' : 'LED', x1 + 22, cy + 4, { color: burnt ? th.danger : th.text, size: 12, weight: 700 });
      if (burnt) { text(ctx, 'Trop de courant ! Augmente R.', W / 2, H / 2, { color: th.danger, size: 15, align: 'center', weight: 700 }); }
    } else {
      ctx.fillStyle = th.bg; ctx.fillRect(x1 - 14, cy - 44, 28, 88);
      roundRect(ctx, x1 - 11, cy - 40, 22, 80, 6); ctx.fillStyle = '#c9a36b'; ctx.fill();
      text(ctx, `R2 = ${R2} Ω`, x1 + 20, cy + 4, { color: th.text, size: 12, weight: 700 });
      // point de mesure
      circle(ctx, x1, y0 + 2, 6, th.accent);
      text(ctx, `U_sortie = ${fmt(c.Vout, 2)} V (mesurée entre ce point et la masse)`, W / 2, y0 + 36, { color: th.accent, align: 'center', size: 12, weight: 700 });
      const barW = W * 0.4, bx = W / 2 - barW / 2, byy = H / 2;
      ctx.fillStyle = th.panel; ctx.fillRect(bx, byy, barW, 14);
      ctx.fillStyle = th.accent; ctx.fillRect(bx, byy, barW * (c.Vout / Math.max(V, 0.01)), 14);
      text(ctx, '0 V', bx - 6, byy + 11, { color: th.faint, size: 10, align: 'right' });
      text(ctx, `${fmt(V, 1)} V`, bx + barW + 6, byy + 11, { color: th.faint, size: 10 });
    }
    text(ctx, `I = ${fmt(c.I * 1000, 1)} mA`, W / 2, y1 + 22, { color: th.warn, align: 'center', size: 13, weight: 700 });
  }
  update();
  return () => { lp.stop(); cv.destroy(); };
}
