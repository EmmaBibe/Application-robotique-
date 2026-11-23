// Banc de poche : VIGIE 6 contre la référence sur une série de mondes, jugé comme dans le banc de recherche.
import { store } from '../lib/store.js';
import { runCampaign } from '../lib/pool.js';
import { renderResults } from '../lib/results.js';
import { paired } from '../lib/stats.js';
import { SCENES, CONDS, chips, fmt, esc } from '../lib/ui.js';

const ALL = Object.keys(SCENES);
const QUICK = ['goulot', 'coin_aveugle', 'traversee', 'foule_dense'];

export default function banc(view) {
  view.innerHTML = `<div class="page">
    <h1>Banc de poche</h1>
    <p class="lead">Un seul monde ne prouve rien : un robot peut avoir de la chance. Pour savoir si VIGIE fait vraiment mieux que la référence, on les fait courir sur <b>les mêmes mondes</b>, puis on calcule l'écart et sa marge d'incertitude. Exactement comme dans la recherche, mais dans ta poche.</p>
    <div class="card">
      <h3>Scènes</h3><div class="chips" data-k="scenes"></div>
      <div class="row" style="margin-top:.5rem"><button class="btn ghost" data-a="all">Toutes les scènes</button><button class="btn ghost" data-a="quick">Les plus disputées</button></div>
      <h3 style="margin-top:.9rem">Condition</h3><div class="chips" data-k="cond"></div>
      <h3 style="margin-top:.9rem">Mondes par scène</h3><div class="chips" data-k="n"></div>
      <p class="small muted" data-k="eta"></p>
      <div class="row"><button class="btn primary" data-a="run">Lancer la comparaison</button><button class="btn" data-a="stop" hidden>Arrêter</button></div>
      <div class="progress" hidden><i></i></div><p class="small muted" data-k="prog"></p>
    </div>
    <div data-k="out"></div>
    <h2>Comment lire le résultat</h2>
    <div class="card"><p><b>Écart</b> : différence de taux de réussite, en points, sur les mêmes mondes.</p>
      <p><b>Intervalle de confiance à 95 %</b> : la plage où se trouve probablement le vrai écart, compte tenu du hasard des mondes tirés. On le calcule en rejouant 2 000 fois l'expérience sur un tirage au sort des mondes (bootstrap).</p>
      <p><b>Significatif</b> : quand l'intervalle ne contient pas zéro. Sinon, il faut plus de mondes avant de conclure. Avec quelques dizaines de mondes, c'est souvent le cas : c'est normal, et c'est honnête.</p></div>
    <div class="note">Pour comparer : l'évaluation finale du banc de recherche, sur 13 200 essais et 100 mondes jamais utilisés, trouve +3,8 points pour VIGIE 6 face à DRA-MPPI (intervalle de +2,6 à +5,1). Les mondes de l'application sont tirés au hasard selon les mêmes règles, mais pas les mêmes : attends-toi à des chiffres voisins, pas identiques.</div>
    <h2>Tes comparaisons précédentes</h2><div data-k="hist"></div>
  </div>`;
  const $ = k => view.querySelector(`[data-k="${k}"]`);
  let scenes = chips($('scenes'), ALL.map(s => [s, SCENES[s]]), QUICK, { multi: true, onChange: eta });
  const cond = chips($('cond'), Object.entries(CONDS), 'nominal', { onChange: eta });
  const nper = chips($('n'), [['3', '3'], ['6', '6'], ['12', '12']], '6', { onChange: eta });
  view.querySelector('[data-a="all"]').onclick = () => { $('scenes').innerHTML = ''; scenes = chips(fresh('scenes'), ALL.map(s => [s, SCENES[s]]), ALL, { multi: true, onChange: eta }); eta(); };
  view.querySelector('[data-a="quick"]').onclick = () => { scenes = chips(fresh('scenes'), ALL.map(s => [s, SCENES[s]]), QUICK, { multi: true, onChange: eta }); eta(); };
  function fresh(k) { const old = $(k), n = old.cloneNode(false); old.replaceWith(n); return n; }
  function eta() {
    const n = scenes.get().length * +nper.get(), w = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
    $('eta').textContent = `${n} mondes, deux robots par monde. Durée estimée : ${n * 7 / w < 60 ? 'moins d\'une minute' : `environ ${Math.round(n * 7 / w / 60)} min`} sur un téléphone récent.`;
  }
  eta(); drawHistory();

  let camp = null;
  view.querySelector('[data-a="run"]').onclick = () => {
    const sc = scenes.get(), cd = cond.get(), N = +nper.get(), first = 200 + Math.floor(Math.random() * 800);
    const jobs = []; let id = 0;
    for (const s of sc) for (let k = 0; k < N; k++) jobs.push({ id: id++, scene: s, seed: first + k, cond: cd, contenders: [{ key: 'v', which: 'vigie' }, { key: 'd', which: 'dra' }] });
    const rows = [], t0 = performance.now();
    view.querySelector('[data-a="run"]').disabled = true; view.querySelector('[data-a="stop"]').hidden = false; view.querySelector('.progress').hidden = false;
    const C = [{ key: 'v', label: 'VIGIE 6', cls: 'vigie' }, { key: 'd', label: 'Référence (DRA-MPPI)', cls: 'dra' }];
    const draw = () => renderResults($('out'), rows, C, [['v', 'd']], { total: jobs.length, onOpen: code => { location.hash = `#/simulateur?code=${code}`; } });
    camp = runCampaign(jobs, {
      onResult: m => {
        rows.push(m); draw();
        const done = rows.length, el = (performance.now() - t0) / 1000, left = el / done * (jobs.length - done);
        view.querySelector('.progress i').style.width = `${done / jobs.length * 100}%`;
        $('prog').textContent = `${done} mondes sur ${jobs.length}${done < jobs.length ? ` · encore environ ${left < 60 ? `${Math.ceil(left)} s` : `${Math.ceil(left / 60)} min`}` : ''}`;
      },
      onDone: () => finish(rows, sc, cd),
    });
    $('prog').textContent = `Calcul sur ${camp.workers} fil${camp.workers > 1 ? 's' : ''} en parallèle…`;
  };
  view.querySelector('[data-a="stop"]').onclick = () => { if (camp) camp.stop(); finish(null); };

  function finish(rows, sc, cd) {
    camp = null;
    view.querySelector('[data-a="run"]').disabled = false; view.querySelector('[data-a="stop"]').hidden = true;
    if (!rows || !rows.length) return;
    const r = paired(rows.map(x => x.res.v.out === 'succes'), rows.map(x => x.res.d.out === 'succes'));
    store.update(s => { s.campaigns = [{ date: new Date().toISOString().slice(0, 10), scenes: sc, cond: cd, n: r.n, pa: r.pa, pb: r.pb, diff: r.diff, lo: r.lo, hi: r.hi }, ...s.campaigns].slice(0, 6); });
    drawHistory();
  }
  function drawHistory() {
    const H = store.get().campaigns;
    $('hist').innerHTML = H.length ? H.map(c => `<div class="card"><p class="small muted" style="margin:0">${c.date} · ${esc(CONDS[c.cond])} · ${c.n} mondes · ${c.scenes.map(s => SCENES[s]).join(', ')}</p>
      <p style="margin:.2rem 0 0">VIGIE ${fmt(c.pa * 100, 0)} % · référence ${fmt(c.pb * 100, 0)} % · écart ${c.diff >= 0 ? '+' : '−'}${fmt(Math.abs(c.diff * 100))} (de ${fmt(c.lo * 100)} à ${fmt(c.hi * 100)})${c.lo > 0 || c.hi < 0 ? ' · <b>significatif</b>' : ''}</p></div>`).join('') : '<p class="muted small">Aucune pour l\'instant.</p>';
  }
  return () => { if (camp) camp.stop(); };
}
