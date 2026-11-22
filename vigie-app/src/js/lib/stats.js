// Comparaison appariée de deux méthodes sur les mêmes mondes : écart de taux de succès et intervalle de confiance
// à 95 % par bootstrap (2 000 tirages), comme dans le banc de recherche (analyse_scenes.py).
function rand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** a, b : tableaux de booléens (succès) appariés monde par monde. */
export function paired(a, b, B = 2000) {
  const n = a.length; if (!n) return null;
  const d = a.map((x, i) => (x ? 1 : 0) - (b[i] ? 1 : 0));
  const mean = d.reduce((s, x) => s + x, 0) / n;
  const R = rand(12345), bs = new Float64Array(B);
  for (let k = 0; k < B; k++) { let s = 0; for (let i = 0; i < n; i++) s += d[Math.floor(R() * n)]; bs[k] = s / n; }
  bs.sort();
  const q = p => { const v = p * (B - 1), lo = Math.floor(v), hi = Math.min(B - 1, lo + 1); return bs[lo] + (bs[hi] - bs[lo]) * (v - lo); };
  return { n, pa: a.filter(Boolean).length / n, pb: b.filter(Boolean).length / n, diff: mean, lo: q(0.025), hi: q(0.975), won: d.filter(x => x > 0).length, lost: d.filter(x => x < 0).length };
}

/** Phrase de conclusion, sans exagération. */
export function verdict(r, nameA, nameB) {
  if (!r) return '';
  if (r.won === 0 && r.lost === 0) return `Sur ces ${r.n} mondes, ${nameA} et ${nameB} ont eu exactement les mêmes résultats : impossible de les départager. Essaie plus de mondes, ou des scènes plus difficiles.`;
  const pts = v => (Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}`);
  const ci = `de ${pts(r.lo)} à ${pts(r.hi)} points`;
  if (r.lo > 0) return `${nameA} fait mieux que ${nameB} : ${pts(r.diff)} points, et l'écart est significatif (intervalle de confiance ${ci}).`;
  if (r.hi < 0) return `${nameA} fait moins bien que ${nameB} : ${pts(r.diff)} points, et l'écart est significatif (intervalle de confiance ${ci}).`;
  return `Écart de ${pts(r.diff)} points, mais l'intervalle de confiance (${ci}) contient zéro : avec ${r.n} mondes, on ne peut pas départager ${nameA} et ${nameB}. Il en faudrait plus.`;
}
