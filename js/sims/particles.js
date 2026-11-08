import { frame, canvas, theme, text, slider, readout, button, buttons, checkbox, loop, fmt, randn, roundRect, note } from '../core/kit.js';

// Filtre particulaire : un robot dans un couloir circulaire avec des portes.
// Il ne sait pas où il est ; il sait seulement s'il voit une porte ou un mur.
export default function particles(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Localisation par filtre particulaire', tag: 'Localisation', height: 360 });
  const LEN = 100;
  const doors = [[12, 18], [30, 36], [62, 68], [74, 80]];
  let N = 400, motionNoise = 0.8, sensorOk = 0.85, auto = false, solvedSteps = 0, solved = false;
  let robot = 0, P = [];
  let lastZ = null, steps = 0;

  slider(f.ctrl, { label: 'Nombre de particules', min: 20, max: 2000, step: 10, value: N, onInput: v => { N = v; init(); } });
  slider(f.ctrl, { label: 'Bruit de déplacement', min: 0, max: 4, step: 0.1, value: motionNoise, onInput: v => { motionNoise = v; } });
  slider(f.ctrl, { label: 'Fiabilité du capteur de porte', min: 0.5, max: 0.99, step: 0.01, value: sensorOk, onInput: v => { sensorOk = v; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Avancer d\'un pas', () => step(), 'primary');
  const ab = button(bb, 'Auto', () => { auto = !auto; ab.textContent = auto ? 'Stop' : 'Auto'; });
  const bb2 = buttons(f.ctrl);
  button(bb2, 'Réinitialiser', init);
  button(bb2, 'Kidnapper le robot', () => { robot = Math.random() * LEN; });
  const ro = readout(f.ctrl, [['z', 'Capteur'], ['est', 'Position estimée'], ['real', 'Position réelle'], ['err', 'Erreur'], ['neff', 'Particules efficaces']]);
  note(f.ctrl, 'Au départ, les particules (hypothèses) sont partout. À chaque pas : on les déplace comme le robot (prédiction), on les pondère selon ce que voit le capteur (correction), puis on tire au sort les plus probables (rééchantillonnage).');

  const isDoor = x => { x = ((x % LEN) + LEN) % LEN; return doors.some(([a, b]) => x >= a && x <= b); };
  function init() {
    P = Array.from({ length: N }, () => ({ x: Math.random() * LEN, w: 1 / N }));
    steps = 0; lastZ = null; solvedSteps = 0;
  }
  init();
  robot = 5;

  function step() {
    const u = 2;
    robot = (robot + u + 0.3 * randn() + LEN) % LEN;
    const z = Math.random() < sensorOk ? isDoor(robot) : !isDoor(robot);
    lastZ = z;
    let sum = 0;
    for (const p of P) {
      p.x = (p.x + u + motionNoise * randn() + LEN) % LEN;
      p.w = (isDoor(p.x) === z) ? sensorOk : 1 - sensorOk;
      sum += p.w;
    }
    for (const p of P) p.w /= sum;
    // rééchantillonnage systématique (basse variance)
    const out = [], step_ = 1 / N;
    let r = Math.random() * step_, c = P[0].w, i = 0;
    for (let m = 0; m < N; m++) {
      const U = r + m * step_;
      while (U > c && i < N - 1) { i++; c += P[i].w; }
      out.push({ x: P[i].x, w: 1 / N });
    }
    // un peu de particules aléatoires pour pouvoir se remettre d'un kidnapping
    for (let k = 0; k < Math.max(1, N * 0.01); k++) out[Math.floor(Math.random() * N)].x = Math.random() * LEN;
    P = out;
    steps++;
  }

  function estimate() {
    // moyenne circulaire
    let sx = 0, sy = 0;
    for (const p of P) { const a = p.x / LEN * 2 * Math.PI; sx += Math.cos(a); sy += Math.sin(a); }
    const a = Math.atan2(sy, sx);
    const conc = Math.hypot(sx, sy) / P.length;
    return { x: ((a / (2 * Math.PI)) * LEN + LEN) % LEN, conc };
  }

  const cv = canvas(f.stage);
  let acc = 0;
  const lp = loop(root, dt => {
    if (auto) { acc += dt; if (acc > 0.18) { acc = 0; step(); } }
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const x0 = 20, w = W - 40, X = x => x0 + (x / LEN) * w;
    const cy = 70;
    // couloir
    roundRect(ctx, x0, cy - 22, w, 44, 8); ctx.fillStyle = th.panel; ctx.fill();
    ctx.fillStyle = th.text; ctx.fillRect(x0, cy - 26, w, 4);
    for (const [a, b] of doors) {
      ctx.fillStyle = th.bg; ctx.fillRect(X(a), cy - 28, X(b) - X(a), 8);
      ctx.fillStyle = '#9b6b3c'; ctx.fillRect(X(a) + 2, cy - 50, X(b) - X(a) - 4, 26);
      text(ctx, 'porte', (X(a) + X(b)) / 2, cy - 56, { color: th.muted, size: 10, align: 'center' });
    }
    // robot
    ctx.fillStyle = th.accent2; roundRect(ctx, X(robot) - 9, cy - 10, 18, 20, 4); ctx.fill();
    ctx.fillStyle = lastZ ? th.ok : th.faint; ctx.beginPath(); ctx.arc(X(robot), cy - 14, 4, 0, 7); ctx.fill();
    // histogramme des particules
    const bins = 100, hist = new Array(bins).fill(0);
    for (const p of P) hist[Math.min(bins - 1, Math.floor(p.x / LEN * bins))]++;
    const maxH = Math.max(...hist, 1);
    const gy = H - 30, gh = gy - cy - 50;
    ctx.fillStyle = th.accent;
    for (let i = 0; i < bins; i++) {
      const hh = (hist[i] / maxH) * gh;
      ctx.fillRect(x0 + (i / bins) * w + 0.5, gy - hh, w / bins - 1, hh);
    }
    ctx.strokeStyle = th.line; ctx.beginPath(); ctx.moveTo(x0, gy + 0.5); ctx.lineTo(x0 + w, gy + 0.5); ctx.stroke();
    const e = estimate();
    ctx.strokeStyle = th.warn; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(X(e.x), cy + 26); ctx.lineTo(X(e.x), gy); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = th.accent2; ctx.beginPath(); ctx.moveTo(X(robot), cy + 12); ctx.lineTo(X(robot), gy); ctx.stroke();
    text(ctx, 'densité des particules = croyance du robot', x0, gy + 18, { color: th.muted, size: 11 });
    text(ctx, `pas ${steps}`, x0 + w, gy + 18, { color: th.faint, size: 11, align: 'right' });
    let d = Math.abs(e.x - robot); d = Math.min(d, LEN - d);
    const neff = 1 / P.reduce((s, p) => s + p.w * p.w, 0);
    ro.set('z', lastZ === null ? '—' : lastZ ? 'porte' : 'mur');
    ro.set('est', `${fmt(e.x, 1)} (certitude ${fmt(e.conc * 100, 0)} %)`);
    ro.set('real', fmt(robot, 1));
    ro.set('err', fmt(d, 1), d < 3 && e.conc > 0.9 ? 'var(--ok)' : '');
    ro.set('neff', fmt(neff, 0));
    if (opts.goal && !solved) {
      if (d < 3 && e.conc > 0.9) solvedSteps++; else solvedSteps = 0;
      if (solvedSteps > 40 && N <= 150) { solved = true; f.message('Localisé avec 150 particules ou moins : efficace comme un robot embarqué qui doit économiser son processeur.'); api.success && api.success(); }
    }
  }
  return () => { lp.stop(); cv.destroy(); };
}
