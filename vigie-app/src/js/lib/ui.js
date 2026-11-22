// Petits outils partagés par les écrans.
import { SCENES } from '../sims/vigie6/world.js';
export { SCENES };
export const APP_VERSION = '1.0';
export const CONDS = { nominal: 'Vision complète', perception: 'Perception limitée', reactifs: 'Piétons qui réagissent' };
export const OUT = { succes: 'arrivé', collision: 'collision', temps: 'temps dépassé' };
export const OUT_SHORT = { succes: 'OK', collision: 'choc', temps: 'lent' };
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = (x, d = 1) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (x, d = 1) => `${fmt(x * 100, d)} %`;

/** Code d'un monde, à recopier ou partager : scène-graine-condition (ex. goulot-3-perception). */
export const worldCode = w => `${w.scene}-${w.seed}-${w.cond}`;
export function parseCode(code) {
  const m = String(code).trim().toLowerCase().match(/^([a-z_]+)-(\d{1,6})-([a-z]+)$/);
  if (!m || !SCENES[m[1]] || !CONDS[m[3]]) return null;
  return { scene: m[1], seed: +m[2], cond: m[3] };
}

let toastT = 0;
export function toast(text) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = text; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600);
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; } t.remove(); return ok; }
}

/** Puces à sélection (simple ou multiple). */
export function chips(el, items, selected, { multi = false, onChange } = {}) {
  let sel = multi ? new Set(selected) : selected;
  const draw = () => { el.innerHTML = items.map(([v, l]) => `<button class="chip ${(multi ? sel.has(v) : sel === v) ? 'on' : ''}" data-v="${v}" aria-pressed="${multi ? sel.has(v) : sel === v}">${l}</button>`).join(''); };
  el.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    if (multi) { if (sel.has(b.dataset.v)) { if (sel.size > 1) sel.delete(b.dataset.v); } else sel.add(b.dataset.v); } else sel = b.dataset.v;
    draw(); onChange && onChange(multi ? [...sel] : sel);
  });
  draw();
  return { get: () => (multi ? [...sel] : sel) };
}
