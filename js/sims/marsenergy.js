import { frame, canvas, theme, text, slider, readout, segmented, checkbox, onTheme, fmt, plot, note } from '../core/kit.js';

// Budget énergétique d'un rover sur Mars pendant 30 sols, avec ou sans tempête de poussière.
// Modèle volontairement simplifié, mais avec des ordres de grandeur réalistes.
export const SOL = 24.66; // heures
const I0 = 590;           // éclairement solaire moyen au niveau de Mars, W/m²

export function simulateEnergy(p) {
  const dt = 0.25, sols = 30;
  const cap = p.battery;              // Wh
  let soc = cap, cold = 0, drive = 0, lost = false, minSoc = 1;
  const out = [], tauS = [];
  for (let t = 0; t < sols * SOL; t += dt) {
    const sol = t / SOL, fday = (t % SOL) / SOL;
    let tau = 0.5;
    if (p.storm) {
      if (sol > 8 && sol <= 12) tau = 0.5 + (sol - 8) / 4 * 2.5;
      else if (sol > 12 && sol <= 22) tau = 3;
      else if (sol > 22) tau = Math.max(0.8, 3 - (sol - 22) / 8 * 2.2);
    }
    const sun = fday > 0.25 && fday < 0.75 ? Math.sin(Math.PI * (fday - 0.25) / 0.5) : 0;
    const dustPanel = Math.min(0.5, 0.0025 * sol);
    let gen = p.source === 'rtg' ? 110 : p.area * 0.28 * I0 * sun * Math.exp(-0.6 * tau) * (1 - dustPanel);
    // consommation
    const night = sun === 0;
    let load = soc < 0.2 * cap ? 8 : 15;                       // électronique de base, réduite en mode survie
    const heaterNeed = p.source === 'rtg' ? 0 : (night ? 45 / p.insulation : 0); // la chaleur perdue du RTG suffit à chauffer
    load += heaterNeed;
    const survival = soc < 0.2 * cap;
    const hourOfDay = fday * SOL;
    const driving = !survival && !night && hourOfDay >= 11 && hourOfDay < 11 + p.drive;
    if (driving) { load += 100; drive += dt; }
    if (!survival && hourOfDay >= 14 && hourOfDay < 15) load += 25; // communication
    soc += (gen - load) * dt;
    if (soc > cap) soc = cap;
    if (soc <= 0) { soc = 0; if (heaterNeed > 0) cold += dt; }
    if (cold > 30) lost = true;
    minSoc = Math.min(minSoc, soc / cap);
    if ((t / dt) % 4 === 0) { out.push(soc / cap * 100); tauS.push(tau); }
    if (lost) break;
  }
  const mass = p.source === 'rtg' ? 45 + p.battery * 0.01 : p.area * 3 + p.battery * 0.01;
  return { out, tauS, lost, cold, drive, minSoc, mass };
}

export default function marsenergy(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Survivre sur Mars : le budget énergétique', tag: 'Énergie · espace', height: 400 });
  const p = { source: 'solaire', area: 1.3, battery: 1000, insulation: 1.5, drive: 2, storm: !!opts.goal };
  let solved = false;
  segmented(f.ctrl, { label: 'Source d\'énergie', value: p.source, options: [{ label: 'Panneaux solaires', value: 'solaire' }, { label: 'Générateur nucléaire (RTG)', value: 'rtg' }], onChange: v => { p.source = v; run(); } });
  slider(f.ctrl, { label: 'Surface de panneaux', min: 0.5, max: 6, step: 0.1, value: p.area, unit: 'm²', onInput: v => { p.area = v; run(); } });
  slider(f.ctrl, { label: 'Capacité de la batterie', min: 200, max: 4000, step: 50, value: p.battery, unit: 'Wh', onInput: v => { p.battery = v; run(); } });
  slider(f.ctrl, { label: 'Qualité de l\'isolation thermique', min: 1, max: 4, step: 0.1, value: p.insulation, onInput: v => { p.insulation = v; run(); } });
  slider(f.ctrl, { label: 'Heures de conduite par sol', min: 0, max: 5, step: 0.25, value: p.drive, unit: 'h', onInput: v => { p.drive = v; run(); } });
  checkbox(f.ctrl, { label: 'Tempête de poussière (sols 8 à 30)', value: p.storm, onChange: v => { p.storm = v; run(); } });
  const ro = readout(f.ctrl, [['st', 'Sort du rover'], ['drv', 'Heures de conduite (30 sols)'], ['min', 'Batterie au plus bas'], ['mass', 'Masse du système d\'énergie']]);
  note(f.ctrl, opts.goal
    ? '<b>Défi</b> : en panneaux solaires, avec la tempête, survis aux 30 sols et réalise au moins 50 heures de conduite, avec un système d\'énergie de 20 kg maximum.'
    : 'La nuit, le rover doit se chauffer pour ne pas geler. Pendant une tempête, la poussière bloque une grande partie du soleil. Le rover passe en mode survie sous 20 % de batterie : il arrête de rouler et de communiquer.');

  let r;
  const cv = canvas(f.stage, () => draw());
  function run() {
    r = simulateEnergy(p);
    ro.set('st', r.lost ? 'électronique gelée : mission perdue' : r.minSoc === 0 ? 'a survécu de justesse' : 'en bonne santé', r.lost ? 'var(--danger)' : 'var(--ok)');
    ro.set('drv', `${fmt(r.drive, 1)} h`);
    ro.set('min', `${fmt(r.minSoc * 100, 0)} %`);
    ro.set('mass', `${fmt(r.mass, 1)} kg`, r.mass <= 20 ? '' : 'var(--warn)');
    if (opts.goal && !solved && p.storm && p.source === 'solaire' && !r.lost && r.drive >= 50 && r.mass <= 20) {
      solved = true; f.message('Défi relevé : ton rover traverse la tempête et poursuit sa mission. C\'est exactement le compromis que font les ingénieurs des missions martiennes.'); api.success && api.success();
    }
    draw();
  }
  function draw() {
    if (!r) return;
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const n = r.out.length;
    plot(ctx, { x: 12, y: 12, w: W - 24, h: (H - 36) * 0.68 }, [{ ys: r.out, color: th.accent, label: 'batterie (%)' }], { xmin: 0, xmax: Math.max(n - 1, 1), ymin: 0, ymax: 100, th, hlines: [{ v: 20, color: th.warn, label: 'mode survie' }] });
    plot(ctx, { x: 12, y: 24 + (H - 36) * 0.68, w: W - 24, h: (H - 36) * 0.32 }, [{ ys: r.tauS, color: '#e07a4f', label: 'opacité de l\'atmosphère τ' }], { xmin: 0, xmax: Math.max(n - 1, 1), ymin: 0, ymax: 6, th });
    text(ctx, '30 sols →', W - 16, H - 6, { color: th.faint, size: 10, align: 'right' });
  }
  const offT = onTheme(draw);
  run();
  return () => { offT(); cv.destroy(); };
}
