// Probabilité de collision avec une personne dont la position future est incertaine (gaussienne),
// portée depuis recherche/planificateur/references.py (_cp_table, collision_prob).
// La fonction de Bessel I0 reprend l'implémentation de numpy (Cephes, polynômes de Tchebychev),
// avec les mêmes coefficients, pour que la table soit identique à celle du banc Python.

const I0A = [-4.4153416464793395e-18, 3.3307945188222384e-17, -2.431279846547955e-16, 1.715391285555133e-15, -1.1685332877993451e-14, 7.676185498604936e-14, -4.856446783111929e-13, 2.95505266312964e-12, -1.726826291441556e-11, 9.675809035373237e-11, -5.189795601635263e-10, 2.6598237246823866e-09, -1.300025009986248e-08, 6.046995022541919e-08, -2.670793853940612e-07, 1.1173875391201037e-06, -4.4167383584587505e-06, 1.6448448070728896e-05, -5.754195010082104e-05, 0.00018850288509584165, -0.0005763755745385824, 0.0016394756169413357, -0.004324309995050576, 0.010546460394594998, -0.02373741480589947, 0.04930528423967071, -0.09490109704804764, 0.17162090152220877, -0.3046826723431984, 0.6767952744094761];
const I0B = [-7.233180487874754e-18, -4.830504485944182e-18, 4.46562142029676e-17, 3.461222867697461e-17, -2.8276239805165836e-16, -3.425485619677219e-16, 1.7725601330565263e-15, 3.8116806693526224e-15, -9.554846698828307e-15, -4.150569347287222e-14, 1.54008621752141e-14, 3.8527783827421426e-13, 7.180124451383666e-13, -1.7941785315068062e-12, -1.3215811840447713e-11, -3.1499165279632416e-11, 1.1889147107846439e-11, 4.94060238822497e-10, 3.3962320257083865e-09, 2.266668990498178e-08, 2.0489185894690638e-07, 2.8913705208347567e-06, 6.889758346916825e-05, 0.0033691164782556943, 0.8044904110141088];

function chbevl(x, vals) {
  let b0 = vals[0], b1 = 0, b2 = 0;
  for (let i = 1; i < vals.length; i++) { b2 = b1; b1 = b0; b0 = x * b1 - b2 + vals[i]; }
  return 0.5 * (b0 - b2);
}

/** I0(x), fonction de Bessel modifiée d'ordre 0 (comme numpy.i0). */
export function i0(x) {
  x = Math.abs(x);
  return x <= 8 ? Math.exp(x) * chbevl(x / 2 - 2, I0A) : Math.exp(x) * chbevl(32 / x - 2, I0B) / Math.sqrt(x);
}

export const CP_STEP = 0.05, CP_AMAX = 60, CP_BMAX = 40, RHO_STEP = 0.005;
export const CP_NA = 1201, CP_NB = 801;        // len(np.arange(0, 60 + 1e-9, 0.05)), idem jusqu'à 40

/** Table P(||X|| <= b) pour X ~ N((a, 0), I) en 2D, sur la même grille que le banc Python (a jusqu'à 60, b jusqu'à 40). */
export function cpTable() {
  const tab = new Float64Array(CP_NA * CP_NB);
  const nrho = 8001;
  const rho = Float64Array.from({ length: nrho }, (_, k) => k * RHO_STEP);
  const f = new Float64Array(nrho), c = new Float64Array(nrho);
  for (let i = 0; i < CP_NA; i++) {
    const a = i * CP_STEP;
    for (let m = 0; m < nrho; m++) {
      const x = a * rho[m];
      const logi0 = x < 50 ? Math.log(i0(Math.min(x, 50)))
        : x - 0.5 * Math.log(2 * Math.PI * Math.max(x, 1e-9)) + Math.log1p(1 / (8 * Math.max(x, 1e-9)) + 9 / (128 * Math.max(x, 1e-9) ** 2));
      f[m] = rho[m] * Math.exp(-(rho[m] ** 2 + a * a) / 2 + logi0);
    }
    c[0] = 0;
    for (let m = 1; m < nrho; m++) c[m] = c[m - 1] + (f[m] + f[m - 1]) / 2 * RHO_STEP;
    for (let k = 0; k < CP_NB; k++) tab[i * CP_NB + k] = Math.min(1, Math.max(0, interpGrid(k * CP_STEP, rho, c)));
  }
  return tab;
}

// np.interp(b, rho, c) pour une grille rho régulière et croissante
function interpGrid(b, rho, c) {
  const n = rho.length;
  if (b <= rho[0]) return c[0];
  if (b >= rho[n - 1]) return c[n - 1];
  let lo = Math.min(n - 2, Math.floor(b / RHO_STEP));
  while (lo > 0 && rho[lo] > b) lo--;
  while (lo < n - 2 && rho[lo + 1] <= b) lo++;
  return (c[lo + 1] - c[lo]) / (rho[lo + 1] - rho[lo]) * (b - rho[lo]) + c[lo];
}

let TAB = null;
export function ensureTable(tab) { if (tab) TAB = tab; else if (!TAB) TAB = cpTable(); return TAB; }

/** Probabilité que le centre d'une personne, de position N(mu, sig² I), tombe à moins de r du robot ; d = ||mu - robot||. */
export function collisionProb(d, r, sig) {
  const a = d / sig, b = r / sig;
  if (a - b > 9) return 0;
  if (b - a > 9) return 1;
  const tab = TAB || ensureTable();
  const am = Math.min(CP_AMAX, Math.max(0, a)), bm = Math.min(CP_BMAX, Math.max(0, b));
  const ia = Math.min(Math.trunc(am / CP_STEP), CP_NA - 2), ib = Math.min(Math.trunc(bm / CP_STEP), CP_NB - 2);
  const fa = am / CP_STEP - ia, fb = bm / CP_STEP - ib;
  return (1 - fa) * (1 - fb) * tab[ia * CP_NB + ib] + fa * (1 - fb) * tab[(ia + 1) * CP_NB + ib]
    + (1 - fa) * fb * tab[ia * CP_NB + ib + 1] + fa * fb * tab[(ia + 1) * CP_NB + ib + 1];
}
