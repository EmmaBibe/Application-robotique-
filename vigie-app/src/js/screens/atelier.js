// Atelier « et si… ? » : on change un réglage du cerveau de VIGIE et on le fait courir contre le VIGIE officiel.
import { VIGIE_DEFAUTS } from '../sims/vigie6/planners.js';
import { store } from '../lib/store.js';
import { runCampaign } from '../lib/pool.js';
import { renderResults } from '../lib/results.js';
import { SCENES, CONDS, chips, fmt, worldCode, esc } from '../lib/ui.js';

const KNOBS = [
  { k: 'fidelite', type: 'range', label: 'Bonus de fidélité', min: 0.5, max: 1, step: 0.05, show: v => v >= 1 ? 'aucun (× 1,00)' : `× ${fmt(v, 2)}`,
    help: 'La note de l\'itinéraire qu\'il suivait déjà est multipliée par ce nombre. Plus c\'est petit, plus il s\'accroche à sa décision ; à 1, il peut changer d\'avis à chaque instant.' },
  { k: 'poidsDanger', type: 'steps', label: 'Poids du danger', values: [300, 1000, 3000, 9000], show: v => fmt(v, 0),
    help: 'Combien pèse, dans la note, la probabilité de toucher quelqu\'un. Plus c\'est lourd, plus il est prudent, au risque d\'attendre longtemps.' },
  { k: 'seuilDur', type: 'steps', label: 'Pénalité au-delà de 5 % de risque', values: [0, 1000, 3000, 9000], show: v => fmt(v, 0),
    help: 'Pénalité ajoutée à chaque instant où le risque de contact dépasse 5 %. À 0, plus de « ligne rouge » : seul le poids du danger compte.' },
  { k: 'itineraires', type: 'steps', label: 'Itinéraires différents', values: [0, 1, 2, 3], show: v => `${v}`,
    help: 'Nombre de façons différentes de contourner les obstacles qu\'il garde en tête.' },
  { k: 'essais', type: 'steps', label: 'Essais par itinéraire', values: [32, 64, 128, 256], show: v => `${v}`,
    help: 'Combien de variations la méthode MPPI essaie pour améliorer chaque itinéraire, à chaque dixième de seconde. Plus d\'essais : mieux, mais plus lent à calculer.' },
  { k: 'attendre', type: 'switch', label: 'Chemin qui sait attendre', help: 'L\'idée planifiée dans l\'espace et le temps, qui peut prévoir de s\'arrêter pour laisser passer quelqu\'un.' },
  { k: 'improvisation', type: 'switch', label: 'Improvisation', help: 'L\'idée sans itinéraire imposé (la seule qu\'ait la référence). Sans elle, on retrouve la version précédente de VIGIE.' },
  { k: 'prudenceAngles', type: 'switch', label: 'Prudence aux angles morts', help: 'En perception limitée, il ralentit près des obstacles qui cachent une zone, comme si quelqu\'un pouvait en surgir.' },
];
const PRESETS = [
  ['Sans fidélité', { fidelite: 1 }], ['Sans chemin qui attend', { attendre: false }], ['Sans improvisation', { improvisation: false }],
  ['Sans prudence aux angles morts', { prudenceAngles: false }], ['Danger léger', { poidsDanger: 300 }], ['Danger lourd', { poidsDanger: 9000 }],
  ['Un seul itinéraire', { itineraires: 1 }], ['Peu d\'essais', { essais: 32 }],
];

export default function atelier(view) {
  let P = { ...VIGIE_DEFAUTS, ...(store.get().atelierParams || {}) };
  view.innerHTML = `<div class="page">
    <h1>Atelier « et si… ? »</h1>
    <p class="lead">Chaque brique de VIGIE a été ajoutée pour une raison. Ici, tu peux en retirer une, ou en changer le dosage, puis faire courir ton VIGIE modifié contre le VIGIE officiel sur les mêmes mondes. C'est ce qu'on appelle une <b>ablation</b> : la meilleure façon de savoir à quoi sert vraiment une pièce.</p>
    <h2>Expériences toutes prêtes</h2><div class="chips" data-k="presets">${PRESETS.map(([l], i) => `<button class="chip" data-i="${i}">${l}</button>`).join('')}</div>
    <h2>Les réglages de son cerveau</h2><div class="card" data-k="knobs"></div>
    <div class="row"><button class="btn ghost" data-a="reset">Revenir à VIGIE 6</button><span class="small muted" data-k="diff"></span></div>
    <div class="note warn">Un VIGIE modifié n'est plus VIGIE 6 : ses résultats ne doivent pas être confondus avec ceux de la recherche. Dans le simulateur, il apparaît en rose.</div>
    <h2>Le mettre à l'épreuve</h2>
    <div class="card">
      <h3>Scènes</h3><div class="chips" data-k="scenes"></div>
      <h3 style="margin-top:.9rem">Condition</h3><div class="chips" data-k="cond"></div>
      <h3 style="margin-top:.9rem">Mondes par scène</h3><div class="chips" data-k="n"></div>
      <div class="row" style="margin-top:.8rem"><button class="btn primary" data-a="run">Lancer la course à trois</button><button class="btn" data-a="stop" hidden>Arrêter</button><button class="btn" data-a="see">Voir en 3D</button></div>
      <div class="progress" hidden><i></i></div><p class="small muted" data-k="prog"></p>
    </div>
    <div data-k="out"></div>
  </div>`;
  const $ = k => view.querySelector(`[data-k="${k}"]`);

  function drawKnobs() {
    $('knobs').innerHTML = KNOBS.map(o => {
      const v = P[o.k], changed = v !== VIGIE_DEFAUTS[o.k];
      if (o.type === 'switch') return `<div class="knob"><div class="knob-h"><b>${o.label}</b><label class="switch"><input type="checkbox" data-k2="${o.k}" ${v ? 'checked' : ''} aria-label="${esc(o.label)}"><i></i></label></div><p>${o.help}${changed ? ' <b style="color:var(--pink)">Modifié.</b>' : ''}</p></div>`;
      const idx = o.type === 'steps' ? o.values.indexOf(v) : null;
      const input = o.type === 'steps' ? `<input type="range" min="0" max="${o.values.length - 1}" step="1" value="${idx}" data-k2="${o.k}" aria-label="${esc(o.label)}">`
        : `<input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${v}" data-k2="${o.k}" aria-label="${esc(o.label)}">`;
      return `<div class="knob"><div class="knob-h"><b>${o.label}</b><span class="val ${changed ? 'changed' : ''}">${o.show(v)}${changed ? '' : ' · officiel'}</span></div><p>${o.help}</p>${input}</div>`;
    }).join('');
    const n = Object.keys(VIGIE_DEFAUTS).filter(k => P[k] !== VIGIE_DEFAUTS[k]).length;
    $('diff').textContent = n ? `${n} réglage${n > 1 ? 's' : ''} modifié${n > 1 ? 's' : ''}` : 'Réglages officiels de VIGIE 6';
    store.update(s => { s.atelierParams = n ? diffParams() : null; });
  }
  const diffParams = () => Object.fromEntries(Object.keys(VIGIE_DEFAUTS).filter(k => P[k] !== VIGIE_DEFAUTS[k]).map(k => [k, P[k]]));
  $('knobs').addEventListener('input', e => {
    const k = e.target.dataset.k2; if (!k) return; const o = KNOBS.find(q => q.k === k);
    P[k] = o.type === 'switch' ? e.target.checked : o.type === 'steps' ? o.values[+e.target.value] : Math.round(+e.target.value * 100) / 100;
    drawKnobs();
  });
  $('presets').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; P = { ...VIGIE_DEFAUTS, ...PRESETS[+b.dataset.i][1] }; drawKnobs(); });
  view.querySelector('[data-a="reset"]').onclick = () => { P = { ...VIGIE_DEFAUTS }; drawKnobs(); };
  drawKnobs();

  const scenes = chips($('scenes'), Object.entries(SCENES), ['goulot', 'coin_aveugle'], { multi: true });
  const cond = chips($('cond'), Object.entries(CONDS), 'nominal');
  const nper = chips($('n'), [['3', '3'], ['6', '6'], ['10', '10']], '6');
  view.querySelector('[data-a="see"]').onclick = () => { const sc = scenes.get()[0]; location.hash = `#/simulateur?code=${worldCode({ scene: sc, seed: 1, cond: cond.get() })}&atelier=1`; };

  let camp = null;
  view.querySelector('[data-a="run"]').onclick = () => {
    const params = diffParams();
    if (!Object.keys(params).length) { $('prog').textContent = 'Change au moins un réglage (ou choisis une expérience toute prête) : sinon les deux VIGIE sont identiques.'; return; }
    const first = 200 + Math.floor(Math.random() * 800), jobs = []; let id = 0;
    for (const s of scenes.get()) for (let k = 0; k < +nper.get(); k++) jobs.push({ id: id++, scene: s, seed: first + k, cond: cond.get(), contenders: [{ key: 'v', which: 'vigie' }, { key: 'm', which: 'vigie', params }, { key: 'd', which: 'dra' }] });
    const C = [{ key: 'v', label: 'VIGIE 6', cls: 'vigie' }, { key: 'm', label: 'VIGIE modifié', cls: 'modifie' }, { key: 'd', label: 'Référence', cls: 'dra' }];
    const rows = [], t0 = performance.now();
    view.querySelector('[data-a="run"]').disabled = true; view.querySelector('[data-a="stop"]').hidden = false; view.querySelector('.progress').hidden = false;
    camp = runCampaign(jobs, {
      onResult: m => {
        rows.push(m);
        renderResults($('out'), rows, C, [['m', 'v'], ['m', 'd']], { total: jobs.length, onOpen: code => { location.hash = `#/simulateur?code=${code}&atelier=1`; } });
        const done = rows.length, left = (performance.now() - t0) / 1000 / done * (jobs.length - done);
        view.querySelector('.progress i').style.width = `${done / jobs.length * 100}%`;
        $('prog').textContent = `${done} mondes sur ${jobs.length}${done < jobs.length ? ` · encore environ ${left < 60 ? `${Math.ceil(left)} s` : `${Math.ceil(left / 60)} min`}` : ' · terminé'}`;
      },
      onDone: stop,
    });
    $('prog').textContent = `Trois robots par monde, sur ${camp.workers} fil${camp.workers > 1 ? 's' : ''} de calcul…`;
  };
  function stop() { if (camp) camp.stop(); camp = null; view.querySelector('[data-a="run"]').disabled = false; view.querySelector('[data-a="stop"]').hidden = true; }
  view.querySelector('[data-a="stop"]').onclick = stop;
  return () => { if (camp) camp.stop(); };
}
