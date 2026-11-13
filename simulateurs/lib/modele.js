// Noyau de simulation partagé par les simulateurs (navigateur).
// Mêmes hypothèses que le modèle Python de logiciel/serre_core et que le
// classeur financier : les chiffres affichés concordent avec le dossier.

export const LATITUDE = -11.67;

// t_max, t_min, hr moyenne, rayonnement global kWh/m²/j, durée du jour (h)
export const CLIMAT = {
  1: [27.0, 16.5, 82, 5.0, 12.8], 2: [27.2, 16.5, 82, 5.1, 12.5], 3: [27.3, 16.0, 80, 5.3, 12.2],
  4: [27.5, 14.0, 72, 5.6, 11.8], 5: [26.8, 10.5, 60, 5.6, 11.5], 6: [25.5, 7.5, 52, 5.4, 11.3],
  7: [25.8, 7.0, 47, 5.7, 11.4], 8: [28.5, 9.5, 40, 6.3, 11.7], 9: [31.5, 13.0, 36, 6.6, 12.0],
  10: [32.5, 16.0, 42, 6.4, 12.4], 11: [29.5, 17.0, 68, 5.4, 12.7], 12: [27.2, 16.8, 80, 4.9, 12.9],
};
export const NOMS_MOIS = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
  "septembre", "octobre", "novembre", "décembre"];

export const CONSIGNES = {
  fruits: { tj: 22, tn: 15, ea: 3, hr: 85, nom: "Compartiment fruits" },
  feuilles: { tj: 20, tn: 13, ea: 3, hr: 85, nom: "Compartiment feuilles" },
};

// ------------------------------------------------------------ psychrométrie
export const psat = t => 0.6108 * Math.exp(17.27 * t / (t + 237.3));
export const dpv = (t, hr) => Math.max(0, psat(t) * (1 - hr / 100));
export const w = (t, hr) => 0.622 * psat(t) * hr / 100 / (87.5 - psat(t) * hr / 100);
export const hrDepuisW = (t, wv) => Math.min(100, Math.max(0, 100 * (wv * 87.5 / (0.622 + wv)) / psat(t)));
export function tHumide(t, hr) {
  return t * Math.atan(0.151977 * Math.sqrt(hr + 8.313659)) + Math.atan(t + hr) - Math.atan(hr - 1.676331)
    + 0.00391838 * Math.pow(hr, 1.5) * Math.atan(0.023101 * hr) - 4.686035;
}

// ------------------------------------------------------------ soleil
const jourMilieuMois = m => [0, 17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344][m];
// Direction du soleil dans le repère de la scène : x = est, y = haut, z = sud.
export function soleil(mois, heure) {
  const d = 23.44 * Math.sin(2 * Math.PI * (284 + jourMilieuMois(mois)) / 365) * Math.PI / 180;
  const p = LATITUDE * Math.PI / 180;
  const H = 15 * (heure - 12) * Math.PI / 180;
  const est = -Math.cos(d) * Math.sin(H);
  const nord = Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H);
  const haut = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
  return { x: est, y: haut, z: -nord, elevation: Math.asin(Math.max(-1, Math.min(1, haut))) * 180 / Math.PI };
}

// ------------------------------------------------------------ météo
export function meteo(mois, h) {
  const [tmax, tmin, hrm, ray, dj] = CLIMAT[mois];
  const lever = 12 - dj / 2, coucher = 12 + dj / 2;
  let t;
  if (h >= lever && h <= 14.5) t = tmin + (tmax - tmin) * Math.sin(Math.PI / 2 * (h - lever) / (14.5 - lever));
  else { const duree = 24 - (14.5 - lever); const x = ((h - 14.5 + 24) % 24) / duree; t = tmin + (tmax - tmin) * Math.pow(1 - x, 1.6); }
  const tm = (tmax + tmin) / 2, wa = w(tm, hrm);
  const hr = hrDepuisW(t, wa);
  const g = (h > lever && h < coucher) ? ray * 1000 * Math.PI / (2 * dj) * Math.sin(Math.PI * (h - lever) / dj) : 0;
  const vent = 1.5 + 2 * Math.max(0, Math.sin(Math.PI * (h - 9) / 10));
  const pluie = [1, 2, 3, 11, 12].includes(mois) && h > 15 && h < 16.5;
  return { t, hr, g: Math.max(0, g), vent, pluie };
}

// ------------------------------------------------------------ régulation
export function nouvelEtat(mois) {
  const [tmax, tmin] = CLIMAT[mois];
  const tm = (tmax + tmin) / 2;
  return {
    mois, h: 6, jour: 1,
    comp: {
      fruits: { t: tm + 2, w: w(tm, 70), mode: "naturel", cmd: vide() },
      feuilles: { t: tm + 1, w: w(tm, 72), mode: "naturel", cmd: vide() },
    },
    tsto: 22, soc: 70, reseau: true, groupe: false, prochainDelestage: 9, pv: 0, charge: 0,
    tsol: { frais: 20.5, tempere: 22.5 }, eau: { transp: 0, pad: 0 },
    manuel: null, // {ouvrant, ecran, pad, ext, sto} imposés par l'utilisateur
    equip: { stockage: true, ecran: true, pad: true },
  };
}
const vide = () => ({ ouvrant: 0, ecran: 0, ext: 0, pad: false, haf: false, sto: "arret", raisons: [] });

export function reguler(E, nom, m) {
  const c = CONSIGNES[nom], s = E.comp[nom], jour = m.g > 5;
  const tChauffe = jour ? c.tj : c.tn, tAere = c.tj + c.ea;
  const hr = hrDepuisW(s.t, s.w);
  const cmd = vide();
  if (E.manuel) {
    Object.assign(cmd, E.manuel);
    cmd.raisons = ["mode manuel : les actionneurs suivent vos réglages"];
    s.mode = cmd.pad ? "evaporatif" : "naturel";
    s.cmd = cmd;
    return;
  }
  let max = 100;
  if (m.vent >= 14) { max = 0; cmd.raisons.push("vent violent : ouvrants fermés"); }
  else if (m.vent >= 10) { max = 30; cmd.raisons.push("vent fort : ouvrants limités à 30 %"); }
  if (m.pluie) { max = Math.min(max, 20); cmd.raisons.push("pluie : ouvrants limités à 20 %"); }
  if (s.mode === "naturel") { if (E.equip.pad && s.t > tAere + 3 && m.hr < 65 && jour) s.mode = "evaporatif"; }
  else if (s.t < tAere || m.hr > 70 || !jour || !E.equip.pad) s.mode = "naturel";
  if (s.mode === "evaporatif") {
    cmd.pad = true; cmd.ext = s.t > tAere + 5 ? 2 : 1;
    cmd.raisons.push("air extérieur sec : mur évaporatif en marche, serre fermée");
  } else {
    let o = Math.max(0, Math.min(100, (s.t - tAere) / 4 * 100));
    if (o > 0) cmd.raisons.push(`aération : ${s.t.toFixed(1)} °C pour une consigne de ${tAere} °C`);
    if (hr > c.hr && s.t > tChauffe) { o = Math.max(o, 10); cmd.raisons.push("humidité haute : aération minimale"); }
    cmd.ouvrant = Math.min(o, max);
  }
  if (E.equip.ecran) {
    if (jour && m.g > 650 && s.t > tAere - 1) { cmd.ecran = 70; cmd.raisons.push("soleil fort : écran d'ombrage à 70 %"); }
    if (!jour && m.t < tChauffe + 5) { cmd.ecran = hr > 92 ? 95 : 100; cmd.raisons.push("nuit fraîche : écran thermique fermé"); }
  }
  if (E.equip.stockage) {
    if (s.t < tChauffe && E.tsto > s.t + 2) { cmd.sto = "decharge"; cmd.raisons.push("trop froid : la chaleur stockée dans l'eau est restituée"); }
    else if (!jour && hr > c.hr && E.tsto > s.t + 3 && s.t < tChauffe + 4) { cmd.sto = "decharge"; cmd.ouvrant = Math.max(cmd.ouvrant, 5); cmd.raisons.push("nuit humide : léger réchauffage pour faire baisser l'HR"); }
    else if (jour && s.t > c.tj + 3 && E.tsto < s.t - 3 && nom === "fruits") { cmd.sto = "charge"; cmd.raisons.push("excès de chaleur : stocké dans la cuve d'eau pour la nuit"); }
  }
  cmd.haf = hr > c.hr - 5 || cmd.ecran >= 95 || cmd.sto !== "arret";
  if (!cmd.raisons.length) cmd.raisons.push("conditions dans la consigne : rien à corriger");
  s.cmd = cmd;
}

function pasCompartiment(E, nom, m, dt) {
  const s = E.comp[nom], cmd = s.cmd, jour = m.g > 5;
  let tau = 0.7; if (cmd.ecran > 0 && jour) tau *= 1 - 0.5 * cmd.ecran / 100;
  const qsol = tau * m.g, hr = hrDepuisW(s.t, s.w), def = dpv(s.t, hr);
  const lat = 0.45 * qsol + 25 * def, e = lat / 2.45e6;
  let u = 4; if (cmd.ecran >= 95 && !jour) u *= 0.6;
  const qparoi = u * 3.14 * (s.t - m.t), qciel = jour ? 0 : 10 * (cmd.ecran >= 95 ? 0.4 : 1);
  let debit, tin, win; const wext = w(m.t, m.hr);
  if (cmd.pad) {
    debit = 0.023 * Math.max(1, cmd.ext);
    tin = m.t - 0.8 * (m.t - tHumide(m.t, m.hr));
    const h = 1.006 * m.t + wext * (2501 + 1.86 * m.t); win = (h - 1.006 * tin) / (2501 + 1.86 * tin);
    E.eau.pad += debit * 1.02 * (win - wext) * 50 * dt;
  } else { debit = cmd.ouvrant / 100 * (0.012 + 0.004 * m.vent) * 0.6 + (cmd.ext ? 0.023 * cmd.ext : 0); tin = m.t; win = wext; }
  debit += 0.0008;
  const qvent = debit * 1.02 * 1006 * (s.t - tin);
  let qsto = 0;
  if (cmd.sto === "decharge") qsto = 1200 * (E.tsto - s.t) / 100; else if (cmd.sto === "charge") qsto = -1200 * (s.t - E.tsto) / 100;
  if (nom === "fruits") E.tsto -= (qsto * 100 + 10 * (E.tsto - 20)) * dt / (6 * 1000 * 4186);
  const inertie = nom === "feuilles" ? 95e3 : 60e3;
  const qsolNet = 3 * ((CLIMAT[E.mois][0] + CLIMAT[E.mois][1]) / 2 + 2 - s.t);
  s.t += (qsol - lat + qsolNet + qsto - qparoi - qciel - qvent) * dt / inertie;
  s.w += (e * dt - debit * 1.02 * (s.w - win) * dt) / (5.83 * 1.02);
  const wsp = w((s.t + m.t) / 2, 100); if (s.w > wsp * 1.02) s.w -= (s.w - wsp * 1.02) * 0.05;
  s.w = Math.min(s.w, w(s.t, 100));
  E.eau.transp += e * 50 * dt;
}

function charges(E) {
  const f = E.comp.fruits.cmd, l = E.comp.feuilles.cmd;
  let p = 140 + ((f.haf ? 1 : 0) + (l.haf ? 1 : 0)) * 90;
  p += ((f.ext || 0) + (l.ext || 0)) * 275 + (f.pad || l.pad ? 100 : 0);
  p += f.sto !== "arret" ? 380 : 0;
  p += (E.h > 8 && E.h < 17) ? 260 : 0;
  p += (E.h > 10 && E.h < 15 && E.tsol.frais > 21) ? 500 : 0;
  p += 80 + ((E.h > 6 && E.h < 20) ? 200 : 0);
  return p;
}

export function avancer(E, secondes, kwc = 3.3, batterieKwh = 10.24) {
  const pas = 60;
  for (let s = 0; s < secondes; s += pas) {
    const m = meteo(E.mois, E.h);
    if (Math.round(E.h * 60) % 5 === 0) { reguler(E, "fruits", m); reguler(E, "feuilles", m); }
    pasCompartiment(E, "fruits", m, pas); pasCompartiment(E, "feuilles", m, pas);
    // énergie
    E.pv = kwc * 1000 * m.g / 1000 * 0.8;
    let ch = charges(E);
    if (E.soc < 35 && !E.reseau) ch = Math.max(140, ch - 450);
    if (!E.reseau && E.soc < 15) E.groupe = true;
    if (E.reseau || E.soc > 40) E.groupe = false;
    const bilan = E.pv - ch + (E.reseau && E.soc < 60 ? 2000 : 0) + (E.groupe ? 2500 : 0);
    E.soc = Math.max(5, Math.min(100, E.soc + bilan * pas / 3600 / (batterieKwh * 1000) * 100));
    E.charge = ch;
    if (E.h >= E.prochainDelestage && Math.abs(E.h - E.prochainDelestage) < 0.05) {
      E.reseau = !E.reseau; E.prochainDelestage = (E.h + (E.reseau ? 6 : 7)) % 24;
    }
    // solution des bassins
    E.tsol.frais += ((E.comp.feuilles.t - 1.5) - E.tsol.frais) * pas / 36000 - (E.tsol.frais > 20.5 && m.g > 100 ? 0.0004 * pas : 0);
    E.tsol.tempere += ((E.comp.feuilles.t + 0.5) - E.tsol.tempere) * pas / 30000;
    E.h += pas / 3600;
    if (E.h >= 24) { E.h -= 24; E.jour++; E.eau = { transp: 0, pad: 0 }; }
  }
}

// ------------------------------------------------------------ finance
// Base médiane du classeur financier (finance/modele_financier_serre_lubumbashi.xlsx) :
// pilote (année 0), tranche 2 à 1 000 m² avec aquaculture (année 2), tranche 3 à 2 000 m² (année 4).
export const FIN = {
  ca: { pil: 6042, t2: 61708, t3: 56900 }, pertes: 0.08,
  aqua: { pil: 940.5, t2: 38175, t3: 53850, prodT2: 5, prodT3: 10, prix: 3.3, alevins: 90000, prixAlevin: 0.25, coutAlevin: 0.06, pertes: 0.05 },
  avec: { opex: { pil: 8333, t2: 69936, t3: 119892 }, capex: [62920, 180950, 124080], amort: [6588, 17680, 12520] },
  sans: { opex: { pil: 7794, t2: 45736, t3: 85102 }, capex: [55220, 114730, 109780], amort: [5508, 11211, 11090] },
  rampPilote: [0.55, 0.9], ramp: [0.7, 0.9, 1.0], an2: 2, an3: 4, residuel: 0.2, taux: 0.12,
};

export function finance({ prix = 1, rendement = 1, capex2Facteur = 1, aquaculture = true, tranche3 = true,
                          prixPoisson = FIN.aqua.prix, alevins = FIN.aqua.alevins } = {}) {
  const f = FIN, idx = prix * rendement, c = aquaculture ? f.avec : f.sans, A = f.aqua;
  const capex = [c.capex[0], c.capex[1] * capex2Facteur, c.capex[2] * capex2Facteur];
  const ramp = age => (age <= 0 ? 0 : f.ramp[Math.min(age, 3) - 1]);
  // écart à la base médiane de l'aquaculture (prix du poisson, alevins vendus), en régime établi
  const dAqua = prod => prod * 1000 * (1 - A.pertes) * (prixPoisson - A.prix) + (alevins - A.alevins) * (A.prixAlevin - A.coutAlevin);
  const flux = [-capex[0]], ebe = [0], cumul = [-capex[0]];
  for (let a = 1; a <= 10; a++) {
    const rp = a === 1 ? f.rampPilote[0] : f.rampPilote[1];
    const age2 = a - f.an2, age3 = tranche3 ? a - f.an3 : -1;
    const r2 = ramp(age2), r3 = ramp(age3);
    const caLeg = (f.ca.pil * rp + f.ca.t2 * r2 + f.ca.t3 * r3) * idx * (1 - f.pertes);
    let caAqua = 0;
    if (aquaculture) caAqua = age2 <= 0 ? A.pil * rp : (A.t2 + dAqua(A.prodT2)) * r2 + (A.t3 - A.t2 + dAqua(A.prodT3) - dAqua(A.prodT2)) * r3;
    const o = c.opex;
    const opexBase = age2 <= 0 ? o.pil : age3 <= 0 ? o.pil + (o.t2 - o.pil) * (0.6 + 0.4 * r2) : o.t2 + (o.t3 - o.t2) * (0.6 + 0.4 * r3);
    const opex = opexBase * (0.7 + 0.3 * rendement);
    const e = caLeg + caAqua - opex;
    const amort = c.amort[0] + (a > f.an2 ? c.amort[1] * capex2Facteur : 0) + (tranche3 && a > f.an3 ? c.amort[2] * capex2Facteur : 0);
    const impot = Math.max((e - amort) * 0.3, (caLeg + caAqua) * 0.01);
    const inv = (a === f.an2 ? capex[1] : 0) + (tranche3 && a === f.an3 ? capex[2] : 0);
    const resid = a === 10 ? (capex[0] + capex[1] + (tranche3 ? capex[2] : 0)) * f.residuel : 0;
    const fl = e - impot - inv + resid;
    flux.push(fl); ebe.push(e); cumul.push(cumul[a - 1] + fl);
  }
  const van = flux.reduce((s, x, i) => s + x / Math.pow(1 + f.taux, i), 0);
  let tri = null, lo = -0.5, hi = 1;
  const v = r => flux.reduce((s, x, i) => s + x / Math.pow(1 + r, i), 0);
  if (v(lo) * v(hi) < 0) { for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (v(lo) * v(mid) <= 0) hi = mid; else lo = mid; } tri = (lo + hi) / 2; }
  const retour = cumul.findIndex(x => x > 0);
  return { flux, ebe, cumul, van, tri, retour: retour < 0 ? null : retour, ebeCroisiere: ebe[8], creux: -Math.min(...cumul) };
}
