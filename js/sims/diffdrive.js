import { frame, canvas, theme, grid, text, circle, slider, readout, button, buttons, checkbox, loop, fmt, randn, note, arrow } from '../core/kit.js';

// Robot à roues différentielles : deux roues motrices, une roue folle.
// Cinématique, centre instantané de rotation, odométrie et sa dérive.
export default function diffdrive(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Robot différentiel et odométrie', tag: 'Cinématique mobile', height: 420 });
  const L = 0.3, rw = 0.05;  // entraxe et rayon de roue (m)
  let vl = 0.3, vr = 0.4, run = false, noise = true, showICR = true;
  let truth, odo, trail, otrail, targets, solved;
  const keys = {};

  const sl = slider(f.ctrl, { label: 'Vitesse roue gauche', min: -0.6, max: 0.6, step: 0.01, value: vl, unit: 'm/s', onInput: v => { vl = v; } });
  const sr = slider(f.ctrl, { label: 'Vitesse roue droite', min: -0.6, max: 0.6, step: 0.01, value: vr, unit: 'm/s', onInput: v => { vr = v; } });
  const bb = buttons(f.ctrl);
  const go = button(bb, 'Démarrer', () => { run = !run; go.textContent = run ? 'Pause' : 'Démarrer'; }, 'primary');
  button(bb, 'Replacer', reset);
  const bb2 = buttons(f.ctrl);
  button(bb2, 'Tout droit', () => { sl.set(0.4, true); sr.set(0.4, true); });
  button(bb2, 'Pivot', () => { sl.set(-0.3, true); sr.set(0.3, true); });
  button(bb2, 'Cercle', () => { sl.set(0.2, true); sr.set(0.4, true); });
  checkbox(f.ctrl, { label: 'Bruit sur les encodeurs (réaliste)', value: noise, onChange: v => { noise = v; } });
  checkbox(f.ctrl, { label: 'Montrer le centre de rotation', value: showICR, onChange: v => { showICR = v; } });
  const ro = readout(f.ctrl, [['v', 'Vitesse v'], ['w', 'Vitesse angulaire ω'], ['R', 'Rayon de courbure'], ['err', 'Erreur d\'odométrie']]);
  note(f.ctrl, opts.goal === 'targets'
    ? 'Défi : passe sur les trois cibles. Clavier : flèches (ou Z Q S D). Sur mobile : les curseurs.'
    : 'v = (v<sub>d</sub> + v<sub>g</sub>) / 2 et ω = (v<sub>d</sub> − v<sub>g</sub>) / L. Le fantôme orange est ce que le robot <em>croit</em> en comptant ses tours de roue.');

  function reset() {
    truth = { x: 0, y: 0, th: 0 };
    odo = { x: 0, y: 0, th: 0 };
    trail = []; otrail = [];
    targets = opts.goal === 'targets' ? [{ x: 1.5, y: 0.8, ok: false }, { x: -1.2, y: 1.4, ok: false }, { x: 0.3, y: -1.3, ok: false }] : [];
    solved = false; f.message('');
  }
  reset();

  const onKey = e => {
    if (!root.isConnected) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'z', 'q', 's', 'd'].includes(k)) {
      const r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      keys[k] = e.type === 'keydown';
      if (e.type === 'keydown') { e.preventDefault(); if (!run) { run = true; go.textContent = 'Pause'; } }
    }
  };
  addEventListener('keydown', onKey);
  addEventListener('keyup', onKey);

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    let L_ = vl, R_ = vr;
    const up = keys.arrowup || keys.z, dn = keys.arrowdown || keys.s, lf = keys.arrowleft || keys.q, rt = keys.arrowright || keys.d;
    if (up || dn || lf || rt) {
      const fwd = (up ? 0.4 : 0) - (dn ? 0.4 : 0), turn = (lf ? 0.25 : 0) - (rt ? 0.25 : 0);
      L_ = fwd - turn; R_ = fwd + turn;
    }
    if (run) {
      const n = 4, h = dt / n;
      for (let i = 0; i < n; i++) {
        const v = (L_ + R_) / 2, w = (R_ - L_) / L;
        truth.x += v * Math.cos(truth.th) * h; truth.y += v * Math.sin(truth.th) * h; truth.th += w * h;
        // l'odométrie mesure les roues avec un peu d'erreur (glissement, résolution, diamètre approximatif)
        const el = L_ * (noise ? 1 + 0.05 * randn() + 0.015 : 1), er = R_ * (noise ? 1 + 0.05 * randn() : 1);
        const vo = (el + er) / 2, wo = (er - el) / L;
        odo.x += vo * Math.cos(odo.th) * h; odo.y += vo * Math.sin(odo.th) * h; odo.th += wo * h;
      }
      trail.push([truth.x, truth.y]); otrail.push([odo.x, odo.y]);
      if (trail.length > 1500) { trail.shift(); otrail.shift(); }
      for (const t of targets) if (!t.ok && Math.hypot(t.x - truth.x, t.y - truth.y) < 0.18) t.ok = true;
      if (targets.length && !solved && targets.every(t => t.ok)) { solved = true; f.message('Les trois cibles sont validées. Tu sais piloter un robot différentiel.'); api.success && api.success(); }
    }
    const v = (L_ + R_) / 2, w = (R_ - L_) / L;
    ro.set('v', `${fmt(v, 2)} m/s`);
    ro.set('w', `${fmt(w, 2)} rad/s`);
    ro.set('R', Math.abs(w) < 1e-3 ? '∞ (ligne droite)' : `${fmt(v / w, 2)} m`);
    ro.set('err', `${fmt(Math.hypot(truth.x - odo.x, truth.y - odo.y) * 100, 1)} cm`);
    draw(L_, R_);
  });

  function draw(L_, R_) {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const S = Math.min(W, H) / 4.6;
    const cx = W / 2, cy = H / 2;
    const P = (x, y) => [cx + x * S, cy - y * S];
    grid(ctx, W, H, S / 2, th.line, cx, cy);
    for (const t of targets) {
      const [tx, ty] = P(t.x, t.y);
      circle(ctx, tx, ty, 0.18 * S, t.ok ? th.ok + '33' : null, t.ok ? th.ok : th.warn, 2.5);
      circle(ctx, tx, ty, 4, t.ok ? th.ok : th.warn);
    }
    const line = (pts, col, dash) => {
      if (pts.length < 2) return;
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash || []);
      ctx.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); ctx.setLineDash([]);
    };
    line(trail, th.accent);
    line(otrail, th.warn, [5, 5]);
    // centre instantané de rotation
    const w = (R_ - L_) / L, v = (L_ + R_) / 2;
    if (showICR && Math.abs(w) > 1e-3) {
      const R = v / w;
      const ix = truth.x - R * Math.sin(truth.th), iy = truth.y + R * Math.cos(truth.th);
      const [px, py] = P(ix, iy);
      if (Math.abs(R) < 6) {
        ctx.strokeStyle = th.violet; ctx.setLineDash([3, 5]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px, py, Math.abs(R) * S, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        circle(ctx, px, py, 4, th.violet);
        text(ctx, 'CIR', px + 6, py - 6, { color: th.violet, size: 11, weight: 700 });
      }
    }
    const robot = (st, col, alpha) => {
      const [px, py] = P(st.x, st.y);
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(px, py); ctx.rotate(-st.th);
      const b = 0.17 * S;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, b, 0, 7); ctx.fill();
      ctx.fillStyle = th.text; ctx.fillRect(-0.06 * S, -L / 2 * S - 4, 0.12 * S, 7); ctx.fillRect(-0.06 * S, L / 2 * S - 3, 0.12 * S, 7);
      ctx.restore();
      arrow(ctx, px, py, px + Math.cos(st.th) * 0.3 * S, py - Math.sin(st.th) * 0.3 * S, th.bg, 2.5, 8);
    };
    robot(odo, th.warn, 0.35);
    robot(truth, th.accent2, 1);
    text(ctx, '— trajectoire réelle', 10, 18, { color: th.accent, size: 11, weight: 600 });
    text(ctx, '- - ce que calcule l\'odométrie', 10, 34, { color: th.warn, size: 11, weight: 600 });
    text(ctx, '1 carreau = 0,5 m', W - 10, H - 10, { color: th.faint, size: 10, align: 'right' });
  }
  return () => { lp.stop(); cv.destroy(); removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); };
}
