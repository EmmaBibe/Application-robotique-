// Affichage d'une campagne : taux de succès, écart apparié avec intervalle de confiance, verdict, mondes un par un.
import { paired, verdict } from './stats.js';
import { SCENES, OUT_SHORT, OUT, fmt, pct, worldCode, esc } from './ui.js';

/** Dessin de l'intervalle de confiance d'un écart (en points), avec zéro marqué. */
export function ciPlot(r) {
  const span = Math.max(0.15, Math.abs(r.lo), Math.abs(r.hi)) * 1.15, X = v => 50 + v / span * 50;
  return `<div class="ci" role="img" aria-label="Écart ${fmt(r.diff * 100)} points, intervalle de ${fmt(r.lo * 100)} à ${fmt(r.hi * 100)}">
    <div class="axis"></div><div class="zero" style="left:${X(0)}%"></div>
    <div class="rng" style="left:${X(r.lo)}%;width:${X(r.hi) - X(r.lo)}%"></div><div class="pt" style="left:${X(r.diff)}%"></div>
    <div class="lbl" style="left:${X(0)}%">0</div><div class="lbl" style="left:${X(r.diff)}%;top:0">${r.diff >= 0 ? '+' : '−'}${fmt(Math.abs(r.diff * 100))}</div></div>`;
}

/** rows : [{ job, res }] ; contenders : [{ key, label, cls }] ; pairs : [[keyA, keyB]] à comparer. */
export function renderResults(el, rows, contenders, pairs, { total, onOpen } = {}) {
  if (!rows.length) { el.innerHTML = ''; return; }
  const succ = k => rows.map(r => r.res[k].out === 'succes');
  const bars = contenders.map(c => { const s = succ(c.key), p = s.filter(Boolean).length / s.length; return `<div class="bar ${c.cls}"><i style="width:${p * 100}%"></i><span><span>${esc(c.label)}</span><span class="mono">${pct(p)}</span></span></div>`; }).join('');
  const lab = Object.fromEntries(contenders.map(c => [c.key, c.label]));
  const cmp = pairs.map(([a, b]) => {
    const r = paired(succ(a), succ(b));
    return `<div class="card"><h3>${esc(lab[a])} face à ${esc(lab[b])}</h3>${ciPlot(r)}<p class="verdict">${verdict(r, lab[a], lab[b])}</p>
      <p class="small muted">Mondes gagnés : ${r.won} · perdus : ${r.lost} · égalité : ${r.n - r.won - r.lost}.</p></div>`;
  }).join('');
  // détail par scène
  const scenes = [...new Set(rows.map(r => r.job.scene))];
  const perScene = scenes.length > 1 ? `<table class="worlds"><thead><tr><th>Scène</th>${contenders.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${scenes.map(sc => {
    const R = rows.filter(r => r.job.scene === sc);
    return `<tr><td>${esc(SCENES[sc])}</td>${contenders.map(c => `<td class="mono">${R.filter(r => r.res[c.key].out === 'succes').length}/${R.length}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table>` : '';
  const sorted = rows.slice().sort((a, b) => a.job.scene.localeCompare(b.job.scene) || a.job.seed - b.job.seed);
  const list = `<table class="worlds"><thead><tr><th>Monde</th>${contenders.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${sorted.map(r => `
    <tr class="tap" data-code="${worldCode(r.job)}" title="Ouvrir ce monde en 3D"><td>${esc(SCENES[r.job.scene])} n° ${r.job.seed}</td>${contenders.map(c => `<td><span class="res ${r.res[c.key].out}" title="${OUT[r.res[c.key].out]}">${OUT_SHORT[r.res[c.key].out]}</span></td>`).join('')}</tr>`).join('')}</tbody></table>`;
  el.innerHTML = `<div class="card"><h3>Trajets réussis${total ? ` (${rows.length} mondes sur ${total})` : ` (${rows.length} mondes)`}</h3><div class="bars">${bars}</div></div>
    ${cmp}${perScene ? `<h2>Par scène</h2><div class="card">${perScene}</div>` : ''}
    <h2>Monde par monde</h2><p class="small muted">Touche un monde pour le revoir en 3D et comprendre ce qui s'est passé.</p><div class="card">${list}</div>`;
  el.querySelectorAll('tr.tap').forEach(tr => tr.addEventListener('click', () => onOpen && onOpen(tr.dataset.code)));
}
