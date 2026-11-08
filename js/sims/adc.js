import { frame, canvas, theme, text, slider, readout, checkbox, onTheme, fmt, note } from '../core/kit.js';

// Du monde analogique au nombre : échantillonnage et quantification (CAN / ADC).
export default function adc(root, opts = {}) {
  const f = frame(root, { title: opts.title || 'Convertisseur analogique-numérique', tag: 'Électronique · Signal', height: 360 });
  let fsig = 2, fs = 20, bits = 3, showRec = true;
  slider(f.ctrl, { label: 'Fréquence du signal', min: 0.5, max: 12, step: 0.5, value: fsig, unit: 'Hz', onInput: v => { fsig = v; draw(); } });
  slider(f.ctrl, { label: 'Fréquence d\'échantillonnage', min: 2, max: 60, step: 1, value: fs, unit: 'Hz', onInput: v => { fs = v; draw(); } });
  slider(f.ctrl, { label: 'Résolution', min: 1, max: 10, step: 1, value: bits, unit: 'bits', onInput: v => { bits = v; draw(); } });
  checkbox(f.ctrl, { label: 'Afficher le signal reconstruit', value: true, onChange: v => { showRec = v; draw(); } });
  const ro = readout(f.ctrl, [['lv', 'Niveaux possibles'], ['q', 'Pas de quantification (0–5 V)'], ['ny', 'Limite de Nyquist'], ['st', 'Diagnostic']]);
  note(f.ctrl, 'Un Arduino Uno lit ses entrées sur 10 bits (1024 niveaux). Si tu échantillonnes moins de deux fois plus vite que le signal, tu vois apparaître un signal fantôme : le repliement (aliasing).');

  const cv = canvas(f.stage, () => draw());
  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const pad = 36, gw = W - pad - 12, gh = H - 50, y0 = 16;
    const dur = 1; // 1 seconde affichée
    const X = t => pad + (t / dur) * gw;
    const Y = v => y0 + gh - (v / 5) * gh;
    const sig = t => 2.5 + 2.2 * Math.sin(2 * Math.PI * fsig * t);
    const levels = 2 ** bits, q = 5 / levels;
    // grille de niveaux
    if (levels <= 64) {
      ctx.strokeStyle = th.line; ctx.lineWidth = 1;
      for (let k = 0; k <= levels; k++) { const y = Y(k * q); ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + gw, y); ctx.stroke(); }
    }
    ctx.strokeStyle = th.faint; ctx.strokeRect(pad, y0, gw, gh);
    text(ctx, '5 V', pad - 4, y0 + 10, { color: th.faint, size: 10, align: 'right' });
    text(ctx, '0 V', pad - 4, y0 + gh, { color: th.faint, size: 10, align: 'right' });
    text(ctx, 'temps (1 s)', pad + gw, y0 + gh + 16, { color: th.faint, size: 10, align: 'right' });
    // signal analogique
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 600; i++) { const t = (i / 600) * dur; i ? ctx.lineTo(X(t), Y(sig(t))) : ctx.moveTo(X(t), Y(sig(t))); }
    ctx.stroke();
    // échantillons quantifiés
    const samples = [];
    for (let t = 0; t <= dur + 1e-9; t += 1 / fs) {
      const v = sig(t);
      const code = Math.min(levels - 1, Math.floor(v / q));
      samples.push({ t, v, qv: (code + 0.5) * q, code });
    }
    if (showRec) {
      ctx.strokeStyle = th.warn; ctx.lineWidth = 2; ctx.beginPath();
      samples.forEach((s, i) => {
        const x = X(s.t), y = Y(s.qv);
        if (i === 0) ctx.moveTo(x, y); else { ctx.lineTo(x, Y(samples[i - 1].qv)); ctx.lineTo(x, y); }
      });
      ctx.lineTo(X(dur), Y(samples[samples.length - 1].qv));
      ctx.stroke();
    }
    for (const s of samples) {
      ctx.strokeStyle = th.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(s.t), Y(0)); ctx.lineTo(X(s.t), Y(s.v)); ctx.stroke();
      ctx.fillStyle = th.warn; ctx.beginPath(); ctx.arc(X(s.t), Y(s.qv), 3.5, 0, 7); ctx.fill();
    }
    if (samples.length < 40 && bits <= 6) {
      samples.forEach(s => text(ctx, s.code.toString(2).padStart(bits, '0'), X(s.t), Y(s.qv) - 8, { color: th.muted, size: 9, align: 'center', font: th.mono }));
    }
    const alias = fs < 2 * fsig;
    ro.set('lv', `${levels}`);
    ro.set('q', `${fmt(q * 1000, 1)} mV`);
    ro.set('ny', `${fmt(fs / 2, 1)} Hz`);
    ro.set('st', alias ? 'Repliement ! fs < 2 × f' : fs < 5 * fsig ? 'Juste suffisant' : 'Confortable', alias ? 'var(--danger)' : 'var(--ok)');
    if (alias) text(ctx, 'Repliement : le signal reconstruit n\'a plus la bonne fréquence', pad + 8, y0 + 18, { color: th.danger, size: 12, weight: 700 });
  }
  const offT = onTheme(draw);
  draw();
  return () => { offT(); cv.destroy(); };
}
