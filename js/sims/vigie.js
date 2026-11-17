import { frame, canvas, theme, text, slider, readout, segmented, checkbox, button, buttons, loop, fmt, note } from '../core/kit.js';
import { createEpisode, MPPI, Vigie, SCENES, SIZE } from './vigie-core.js';

// Course côte à côte : MPPI (référence actuelle) contre VIGIE, dans le même monde et les mêmes perturbations.
export default function vigie(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'VIGIE contre MPPI : la course', tag: 'Planification · invention', height: 470 });
  let scene = opts.scene || 'foule_dense', seed = 1, speed = 3, race = false, solved = false;
  const cond = { reel: true, perception: false, latence: false, glissement: false, reactifs: false, carte: false };
  const tally = { MPPI: { succes: 0, collision: 0, temps: 0, t: 0 }, VIGIE: { succes: 0, collision: 0, temps: 0, t: 0 } };
  let eps, pause = 0;

  segmented(f.ctrl, { label: 'Scène', value: scene, options: Object.entries(SCENES).map(([value, label]) => ({ value, label })), onChange: v => { scene = v; restart(); } });
  checkbox(f.ctrl, { label: 'Robot réaliste : moteurs, inertie, retard de 100 ms, odométrie, vitesses estimées', value: true, onChange: v => { cond.reel = v; restart(); } });
  checkbox(f.ctrl, { label: 'Perception limitée (5 m, masquage, détections perdues)', value: false, onChange: v => { cond.perception = v; restart(); } });
  checkbox(f.ctrl, { label: 'Latence de 200 ms', value: false, onChange: v => { cond.latence = v; restart(); } });
  checkbox(f.ctrl, { label: 'Roues qui patinent (modèle faux)', value: false, onChange: v => { cond.glissement = v; restart(); } });
  checkbox(f.ctrl, { label: 'Agents qui réagissent au robot', value: false, onChange: v => { cond.reactifs = v; restart(); } });
  checkbox(f.ctrl, { label: 'Carte inconnue au départ', value: false, onChange: v => { cond.carte = v; restart(); } });
  slider(f.ctrl, { label: 'Vitesse de simulation', min: 1, max: 10, step: 1, value: speed, unit: '×', onInput: v => { speed = v; } });
  const bb = buttons(f.ctrl);
  button(bb, 'Nouveau monde', () => { seed++; restart(); });
  const raceBtn = button(bb, 'Lancer la course (mondes en série)', () => { race = !race; raceBtn.textContent = race ? 'Arrêter la course' : 'Lancer la course (mondes en série)'; if (race) { reset(); restart(); } }, 'primary');
  const ro = readout(f.ctrl, [['m', 'MPPI : succès / collisions / temps dépassé'], ['v', 'VIGIE : succès / collisions / temps dépassé'], ['n', 'Mondes joués'], ['st', 'VIGIE en ce moment']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : lance la course sur au moins 10 mondes avec au moins deux perturbations cochées, puis compare les deux colonnes. Note dans ton carnet dans quelles conditions VIGIE fait mieux, et dans lesquelles il ne fait pas mieux.'
    : 'À droite, VIGIE colore chaque agent selon l\'imprévisibilité qu\'il a mesurée (vert : prévisible, rouge : erratique). Les traits fins sont ses routes candidates, le trait épais celle qu\'il a choisie. Quand tous ses plans sont menacés, il déclenche un réflexe : freinage ou esquive. Dès qu'il y a du retard (robot réaliste ou latence cochée), les deux méthodes le compensent de la même façon (prédicteur de Smith) : la comparaison est équitable. Cette simulation oppose VIGIE 2 à MPPI ; les résultats de VIGIE 3 et de ses successeurs face à l'état de l'art viennent du banc de recherche (dossier recherche/planificateur du dépôt), décrit dans la leçon des résultats.');

  function reset() { for (const k of ['MPPI', 'VIGIE']) tally[k] = { succes: 0, collision: 0, temps: 0, t: 0 }; }
  function restart() { eps = { MPPI: createEpisode(scene, seed, MPPI, cond), VIGIE: createEpisode(scene, seed, Vigie, cond) }; pause = 0; f.message(''); }
  restart();

  const cv = canvas(f.stage);
  const lp = loop(root, dt => {
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0 && race) { seed++; restart(); }
    } else {
      for (let i = 0; i < speed; i++) {
        let done = true;
        for (const k of ['MPPI', 'VIGIE']) { if (!eps[k].outcome) eps[k].step(); if (!eps[k].outcome) done = false; }
        if (done) {
          for (const k of ['MPPI', 'VIGIE']) { tally[k][eps[k].outcome]++; tally[k].t += eps[k].t; }
          const n = tally.MPPI.succes + tally.MPPI.collision + tally.MPPI.temps;
          f.message(`Monde ${seed} : MPPI ${label(eps.MPPI.outcome)}, VIGIE ${label(eps.VIGIE.outcome)}.`, eps.VIGIE.outcome === 'succes');
          if (opts.goal && !solved && n >= 10 && Object.values(cond).filter(Boolean).length >= 2) { solved = true; api.success && api.success(); }
          pause = race ? 1.2 : 1e9;
          break;
        }
      }
    }
    draw();
  });
  const label = o => ({ succes: 'arrivé', collision: 'collision', temps: 'temps dépassé' }[o] || 'en route');

  function pane(ctx, x0, y0, S, ep, title, isV) {
    const th = theme(), w = ep.world, P = (x, y) => [x0 + x * S, y0 + (SIZE - y) * S];
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, SIZE * S, SIZE * S); ctx.clip();
    ctx.fillStyle = th.panel; ctx.fillRect(x0, y0, SIZE * S, SIZE * S);
    ctx.strokeStyle = th.line; ctx.strokeRect(x0, y0, SIZE * S, SIZE * S);
    if (cond.perception) { const [cx, cy] = P(ep.s[0], ep.s[1]); ctx.fillStyle = 'rgba(42,167,255,.07)'; ctx.beginPath(); ctx.arc(cx, cy, 5 * S, 0, 7); ctx.fill(); }
    for (const [x, y, r] of w.static) { const [a, b] = P(x, y); ctx.fillStyle = th.faint; ctx.beginPath(); ctx.arc(a, b, r * S, 0, 7); ctx.fill(); }
    const pl = ep.planner, vz = pl.viz || {};
    w.dyn.forEach((o, j) => {
      const [a, b] = P(o.p[0], o.p[1]);
      let col = '#e0883a';
      if (isV && pl.err) {
        const e = pl.err.get(1000 + j);
        if (e !== undefined) { const u = Math.min(1, Math.max(0, (e - 0.08) / 0.45)); col = `hsl(${120 - 120 * u}, 75%, 48%)`; }
        else col = '#9aa3b2';
      }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(a, b, o.r * S, 0, 7); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + o.v[0] * S * 0.6, b - o.v[1] * S * 0.6); ctx.stroke();
    });
    const [gx, gy] = P(w.goal[0], w.goal[1]);
    ctx.fillStyle = th.ok; ctx.beginPath(); ctx.arc(gx, gy, 0.5 * S, 0, 7); ctx.fill();
    if (isV && vz.plans) vz.plans.forEach((pts, i) => {
      ctx.strokeStyle = i === vz.commit ? th.accent : 'rgba(150,150,170,.6)'; ctx.lineWidth = i === vz.commit ? 2.5 : 1;
      ctx.beginPath(); pts.forEach((q, k) => { const [a, b] = P(q[0], q[1]); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke();
    });
    if (!isV && vz.plan) { ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.beginPath(); vz.plan.forEach((q, k) => { const [a, b] = P(q[0], q[1]); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke(); }
    ctx.strokeStyle = th.accent2; ctx.lineWidth = 1.5; ctx.beginPath(); ep.path.forEach((q, k) => { const [a, b] = P(q[0], q[1]); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke();
    const [rx, ry] = P(ep.s[0], ep.s[1]), h = ep.s[2];
    const out = ep.outcome;
    ctx.fillStyle = out === 'collision' ? th.danger : out === 'succes' ? th.ok : th.text;
    ctx.beginPath(); ctx.moveTo(rx + Math.cos(h) * 0.55 * S, ry - Math.sin(h) * 0.55 * S);
    ctx.lineTo(rx + Math.cos(h + 2.4) * 0.4 * S, ry - Math.sin(h + 2.4) * 0.4 * S); ctx.lineTo(rx + Math.cos(h - 2.4) * 0.4 * S, ry - Math.sin(h - 2.4) * 0.4 * S); ctx.closePath(); ctx.fill();
    ctx.restore();
    text(ctx, `${title} · ${fmt(ep.t, 1)} s${out ? ' · ' + label(out) : ''}`, x0 + 6, y0 + 15, { color: th.text, size: 12, weight: 700 });
    if (isV && vz.reflex) text(ctx, { [-1]: 'Réflexe : freinage', [-2]: 'Réflexe : esquive à gauche', [-3]: 'Réflexe : esquive à droite' }[vz.reflex], x0 + 6, y0 + 31, { color: th.danger, size: 11, weight: 700 });
  }

  function draw() {
    const ctx = cv.ctx, W = cv.w, H = cv.h; ctx.clearRect(0, 0, W, H);
    const wide = W > H * 1.3;
    const S = wide ? Math.min((W - 30) / 2, H - 20) / SIZE : Math.min(W - 20, (H - 30) / 2) / SIZE;
    const L = SIZE * S;
    if (wide) { pane(ctx, (W - 2 * L - 10) / 2, (H - L) / 2, S, eps.MPPI, 'MPPI', false); pane(ctx, (W - 2 * L - 10) / 2 + L + 10, (H - L) / 2, S, eps.VIGIE, 'VIGIE', true); }
    else { pane(ctx, (W - L) / 2, 8, S, eps.MPPI, 'MPPI', false); pane(ctx, (W - L) / 2, 18 + L, S, eps.VIGIE, 'VIGIE', true); }
    const n = tally.MPPI.succes + tally.MPPI.collision + tally.MPPI.temps;
    for (const [k, key] of [['MPPI', 'm'], ['VIGIE', 'v']]) { const T = tally[k]; ro.set(key, `${T.succes} / ${T.collision} / ${T.temps}`); }
    ro.set('n', `${n}`);
    const vz = eps.VIGIE.planner.viz;
    ro.set('st', vz ? (vz.reflex ? 'réflexe' : vz.commit === 0 ? 'suit le plan de base' : `suit la route ${vz.commit}`) : '…');
  }
  return () => { lp.stop(); cv.destroy(); };
}
