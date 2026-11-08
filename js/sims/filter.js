import { frame, canvas, theme, plot, slider, readout, checkbox, button, buttons, loop, fmt, randn, note } from '../core/kit.js';

// Filtrer un capteur bruité : moyenne glissante, passe-bas exponentiel, filtre de Kalman 1D.
export default function filter(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Filtrer le bruit d\'un capteur', tag: 'Perception · Estimation', height: 380 });
  let sigma = 0.4, N = 8, alpha = 0.2, Q = 0.002, R = 0.16;
  let show = { ma: true, lp: true, kf: true }, solved = false;
  const H = 400;
  let data = [];
  let t = 0;
  const st = { buf: [], lp: 0, x: 0, P: 1 };

  slider(f.ctrl, { label: 'Bruit du capteur σ', min: 0, max: 1, step: 0.01, value: sigma, onInput: v => { sigma = v; } });
  slider(f.ctrl, { label: 'Moyenne glissante : N échantillons', min: 1, max: 40, step: 1, value: N, onInput: v => { N = v; } });
  slider(f.ctrl, { label: 'Passe-bas : α', min: 0.01, max: 1, step: 0.01, value: alpha, onInput: v => { alpha = v; } });
  slider(f.ctrl, { label: 'Kalman : bruit de processus Q', min: 0.0001, max: 0.1, step: 0.0001, value: Q, digits: 4, onInput: v => { Q = v; } });
  slider(f.ctrl, { label: 'Kalman : bruit de mesure R', min: 0.001, max: 1, step: 0.001, value: R, digits: 3, onInput: v => { R = v; } });
  checkbox(f.ctrl, { label: 'Moyenne glissante', value: true, onChange: v => { show.ma = v; } });
  checkbox(f.ctrl, { label: 'Passe-bas exponentiel', value: true, onChange: v => { show.lp = v; } });
  checkbox(f.ctrl, { label: 'Filtre de Kalman', value: true, onChange: v => { show.kf = v; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Effacer', () => { data = []; });
  const ro = readout(f.ctrl, [['raw', 'Erreur brute (RMS)'], ['ma', 'Moyenne glissante'], ['lp', 'Passe-bas'], ['kf', 'Kalman'], ['K', 'Gain de Kalman K']]);
  note(f.ctrl, opts.goal === 'kalman' ? '<b>Défi</b> : avec σ = 0,4, règle Q et R pour que l\'erreur du Kalman passe sous 0,21 (environ deux fois moins que le bruit brut) malgré les marches.' : 'Plus on lisse, plus on prend du retard. Tout l\'art est dans ce compromis. Le Kalman l\'ajuste tout seul à partir de ce qu\'il sait du bruit.');

  const truth = tt => (Math.floor(tt / 4) % 2 ? 2 : 0.5) + 0.25 * Math.sin(tt * 0.9);

  const cv = canvas(f.stage);
  let acc = 0;
  const lp = loop(root, dt => {
    acc += dt;
    while (acc > 1 / 50) {
      acc -= 1 / 50; t += 1 / 50;
      const y = truth(t), z = y + sigma * randn();
      st.buf.push(z); if (st.buf.length > N) st.buf.splice(0, st.buf.length - N);
      const ma = st.buf.reduce((a, b) => a + b, 0) / st.buf.length;
      st.lp = st.lp + alpha * (z - st.lp);
      // Kalman 1D à état constant : prédiction puis correction
      st.P += Q;
      const K = st.P / (st.P + R);
      st.x += K * (z - st.x);
      st.P *= (1 - K);
      data.push({ y, z, ma, lp: st.lp, kf: st.x, K });
      if (data.length > H) data.shift();
    }
    draw();
  });

  function rms(k) {
    if (data.length < 50) return NaN;
    let s = 0; for (const d of data) s += (d[k] - d.y) ** 2;
    return Math.sqrt(s / data.length);
  }
  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, Hh = cv.h;
    ctx.clearRect(0, 0, W, Hh);
    const series = [
      { ys: data.map(d => d.z), color: th.faint, width: 1, label: 'mesure brute' },
      { ys: data.map(d => d.y), color: th.text, width: 1.5, dash: [5, 4], label: 'vraie valeur' },
    ];
    if (show.ma) series.push({ ys: data.map(d => d.ma), color: th.accent2, label: 'moy. glissante' });
    if (show.lp) series.push({ ys: data.map(d => d.lp), color: th.violet, label: 'passe-bas' });
    if (show.kf) series.push({ ys: data.map(d => d.kf), color: th.accent, width: 2.5, label: 'Kalman' });
    plot(ctx, { x: 10, y: 10, w: W - 20, h: Hh - 20 }, series, { xmin: 0, xmax: H - 1, ymin: -1, ymax: 3.5, th });
    const r = { raw: rms('z'), ma: rms('ma'), lp: rms('lp'), kf: rms('kf') };
    for (const k in r) ro.set(k, Number.isNaN(r[k]) ? '…' : fmt(r[k], 3));
    ro.set('K', data.length ? fmt(data[data.length - 1].K, 3) : '—');
    if (opts.goal === 'kalman' && !solved && data.length >= H - 1 && Math.abs(sigma - 0.4) < 0.011 && r.kf < 0.21) {
      solved = true; f.message(`Erreur Kalman ${fmt(r.kf, 3)} contre ${fmt(r.raw, 3)} en brut : tu as divisé le bruit par ${fmt(r.raw / r.kf, 1)}.`); api.success && api.success();
    }
  }
  return () => { lp.stop(); cv.destroy(); };
}
