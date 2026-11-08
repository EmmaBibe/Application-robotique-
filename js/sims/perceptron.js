import { frame, canvas, theme, text, circle, slider, readout, segmented, button, buttons, loop, drag, fmt, note } from '../core/kit.js';

// Un neurone artificiel apprend à séparer deux classes de points.
// On clique pour ajouter des exemples ; on regarde la frontière bouger à chaque correction.
export default function perceptron(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Apprentissage : un neurone qui apprend', tag: 'IA', height: 400 });
  let pts = [], cls = 1, lr = 0.1, w = [0.2, -0.3, 0.1], training = false, epoch = 0, solved = false, idx = 0;
  const lossHist = [];

  segmented(f.ctrl, { label: 'Classe des points que tu ajoutes', value: cls, options: [{ label: '● Objet à saisir', value: 1 }, { label: '✕ Obstacle', value: -1 }], onChange: v => { cls = v; } });
  slider(f.ctrl, { label: 'Taux d\'apprentissage', min: 0.001, max: 1, step: 0.001, value: lr, digits: 3, onInput: v => { lr = v; } });
  const bb = buttons(f.ctrl);
  const tb = button(bb, 'Entraîner', () => { training = !training; tb.textContent = training ? 'Pause' : 'Entraîner'; }, 'primary');
  button(bb, 'Un pas', () => trainStep());
  const bb2 = buttons(f.ctrl);
  button(bb2, 'Exemple séparable', () => preset(false));
  button(bb2, 'Exemple impossible (XOR)', () => preset(true));
  button(bb2, 'Effacer', () => { pts = []; resetW(); });
  const ro = readout(f.ctrl, [['w', 'Poids w₁, w₂'], ['b', 'Biais b'], ['acc', 'Précision'], ['ep', 'Époques']]);
  note(f.ctrl, 'Sortie = signe(w₁·x + w₂·y + b). À chaque erreur : w ← w + taux × (cible − sortie) × entrée. Un seul neurone ne sait tracer qu\'une droite : essaie l\'exemple XOR pour voir sa limite, et comprendre pourquoi on empile des couches.');

  function resetW() { w = [Math.random() - 0.5, Math.random() - 0.5, 0]; epoch = 0; lossHist.length = 0; idx = 0; }
  function preset(xor) {
    pts = [];
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
      const c = xor ? (x * y > 0 ? 1 : -1) : (y > 0.6 * x - 0.1 ? 1 : -1);
      if (!xor && Math.abs(y - (0.6 * x - 0.1)) < 0.12) continue;
      pts.push({ x, y, c });
    }
    resetW();
  }
  preset(false);

  const out = p => Math.sign(w[0] * p.x + w[1] * p.y + w[2]) || 1;
  function trainStep() {
    if (!pts.length) return;
    const p = pts[idx % pts.length];
    const e = p.c - out(p);
    if (e) { w[0] += lr * e * p.x; w[1] += lr * e * p.y; w[2] += lr * e; }
    idx++;
    if (idx % pts.length === 0) { epoch++; lossHist.push(1 - accuracy()); if (lossHist.length > 200) lossHist.shift(); }
  }
  function accuracy() { return pts.length ? pts.filter(p => out(p) === p.c).length / pts.length : 0; }

  const cv = canvas(f.stage);
  let S = 100, cx = 0, cy = 0;
  const off = drag(cv, {
    down: p => {
      const x = (p.x - cx) / S, y = (cy - p.y) / S;
      if (Math.abs(x) > 1.05 || Math.abs(y) > 1.05) return false;
      pts.push({ x, y, c: cls });
    },
  });
  const lp = loop(root, () => {
    if (training) for (let i = 0; i < 4; i++) trainStep();
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    S = Math.min(W * 0.62, H - 30) / 2.2;
    cx = 15 + S * 1.1; cy = H / 2;
    // fond coloré selon la prédiction
    const step = 8;
    for (let px = cx - S * 1.1; px < cx + S * 1.1; px += step) for (let py = cy - S * 1.1; py < cy + S * 1.1; py += step) {
      const o = out({ x: (px - cx) / S, y: (cy - py) / S });
      ctx.fillStyle = o > 0 ? th.accent + '22' : th.danger + '22';
      ctx.fillRect(px, py, step, step);
    }
    ctx.strokeStyle = th.line; ctx.strokeRect(cx - S * 1.1, cy - S * 1.1, S * 2.2, S * 2.2);
    // frontière w1 x + w2 y + b = 0
    if (Math.abs(w[1]) > 1e-6 || Math.abs(w[0]) > 1e-6) {
      ctx.strokeStyle = th.warn; ctx.lineWidth = 2.5; ctx.beginPath();
      if (Math.abs(w[1]) > Math.abs(w[0])) {
        const y = x => -(w[0] * x + w[2]) / w[1];
        ctx.moveTo(cx - 1.1 * S, cy - y(-1.1) * S); ctx.lineTo(cx + 1.1 * S, cy - y(1.1) * S);
      } else {
        const x = y => -(w[1] * y + w[2]) / w[0];
        ctx.moveTo(cx + x(-1.1) * S, cy + 1.1 * S); ctx.lineTo(cx + x(1.1) * S, cy - 1.1 * S);
      }
      ctx.save(); ctx.beginPath(); ctx.rect(cx - S * 1.1, cy - S * 1.1, S * 2.2, S * 2.2); ctx.restore();
      ctx.stroke();
    }
    for (const p of pts) {
      const x = cx + p.x * S, y = cy - p.y * S, ok = out(p) === p.c;
      if (p.c > 0) circle(ctx, x, y, 6, th.accent, ok ? null : th.danger, 2.5);
      else { ctx.strokeStyle = th.danger; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); if (!ok) circle(ctx, x, y, 9, null, th.warn, 2); }
    }
    // schéma du neurone + courbe d'erreur
    const rx = cx + S * 1.1 + 24, rw = W - rx - 12;
    if (rw > 120) {
      const ny = 60;
      const ins = [['x', w[0]], ['y', w[1]], ['1', w[2]]];
      ins.forEach(([lab, wi], i) => {
        const iy = ny - 30 + i * 30;
        circle(ctx, rx + 12, iy, 10, th.panel, th.line, 1.5);
        text(ctx, lab, rx + 12, iy + 4, { color: th.text, size: 11, align: 'center' });
        ctx.strokeStyle = wi >= 0 ? th.accent : th.danger; ctx.lineWidth = Math.min(6, 1 + Math.abs(wi) * 2);
        ctx.beginPath(); ctx.moveTo(rx + 22, iy); ctx.lineTo(rx + rw * 0.55 - 16, ny); ctx.stroke();
      });
      circle(ctx, rx + rw * 0.55, ny, 16, th.panel, th.warn, 2);
      text(ctx, 'Σ', rx + rw * 0.55, ny + 5, { color: th.warn, size: 15, align: 'center', weight: 700 });
      ctx.strokeStyle = th.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx + rw * 0.55 + 16, ny); ctx.lineTo(rx + rw - 8, ny); ctx.stroke();
      text(ctx, 'sortie', rx + rw - 8, ny - 8, { color: th.muted, size: 10, align: 'right' });
      const gy = 120, gh = H - gy - 20;
      ctx.strokeStyle = th.line; ctx.strokeRect(rx, gy, rw, gh);
      text(ctx, 'taux d\'erreur par époque', rx + 4, gy + 12, { color: th.muted, size: 10 });
      ctx.strokeStyle = th.danger; ctx.lineWidth = 2; ctx.beginPath();
      lossHist.forEach((l, i) => { const x = rx + (i / Math.max(1, lossHist.length - 1)) * rw, y = gy + gh - l * gh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    const acc = accuracy();
    ro.set('w', `${fmt(w[0], 2)} ; ${fmt(w[1], 2)}`);
    ro.set('b', fmt(w[2], 2));
    ro.set('acc', `${fmt(acc * 100, 0)} %`, acc === 1 ? 'var(--ok)' : '');
    ro.set('ep', `${epoch}`);
    if (opts.goal && !solved && pts.length >= 20 && acc === 1 && pts.filter(p => p.c > 0).length >= 8 && pts.filter(p => p.c < 0).length >= 8) {
      solved = true; f.message('100 % de bonnes réponses : ton neurone a appris une règle qu\'on ne lui a jamais écrite.'); api.success && api.success();
    }
  }
  return () => { off(); lp.stop(); cv.destroy(); };
}
