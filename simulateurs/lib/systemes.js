// Simulation détaillée des sous-systèmes de la serre, branchée sur le modèle
// climatique (modele.js). Chaque équipement a un repère identique à celui des
// schémas du dossier (P-101, EV-201, KM2, AUT-F...), un état, et la règle qui
// le commande. L'objectif est de voir qui fait quoi, quand, et pourquoi.

import * as M from "./modele.js";

// ------------------------------------------------------------ cultures (recettes simplifiées)
export const CULTURES = {
  tomate:   { nom: "Tomate", comp: "fruits", t: [8, 15, 27, 33], dpv: [0.5, 1.2], dli: [20, 30], tsol: 25, ec: [2.6, 3.4], ph: [5.5, 6.2] },
  poivron:  { nom: "Poivron", comp: "fruits", t: [10, 17, 28, 33], dpv: [0.5, 1.2], dli: [18, 28], tsol: 25, ec: [2.4, 3.0], ph: [5.5, 6.2] },
  piment:   { nom: "Piment", comp: "fruits", t: [10, 17, 30, 35], dpv: [0.6, 1.4], dli: [18, 30], tsol: 26, ec: [2.2, 2.8], ph: [5.6, 6.3] },
  laitue:   { nom: "Laitue", comp: "feuilles", bassin: "frais", t: [4, 10, 24, 29], dpv: [0.4, 1.0], dli: [12, 17], tsol: 22, ec: [1.4, 2.0], ph: [5.8, 6.4] },
  chou:     { nom: "Chou de Chine", comp: "feuilles", bassin: "frais", t: [4, 10, 23, 28], dpv: [0.4, 1.0], dli: [13, 17], tsol: 22, ec: [1.6, 2.2], ph: [5.8, 6.4] },
  epinard:  { nom: "Épinard", comp: "feuilles", bassin: "frais", t: [2, 8, 21, 26], dpv: [0.4, 0.9], dli: [12, 16], tsol: 21, ec: [1.8, 2.4], ph: [6.0, 6.6] },
  celeri:   { nom: "Céleri", comp: "feuilles", bassin: "tempere", t: [6, 12, 23, 29], dpv: [0.4, 1.0], dli: [12, 17], tsol: 22, ec: [1.8, 2.4], ph: [6.0, 6.6] },
  amarante: { nom: "Amarante", comp: "feuilles", bassin: "tempere", t: [10, 18, 32, 37], dpv: [0.6, 1.5], dli: [15, 25], tsol: 26, ec: [1.6, 2.2], ph: [6.0, 6.6] },
  basilic:  { nom: "Basilic", comp: "feuilles", bassin: "tempere", t: [10, 16, 29, 34], dpv: [0.5, 1.2], dli: [14, 22], tsol: 25, ec: [1.4, 2.0], ph: [5.8, 6.4] },
  poireau:  { nom: "Poireau / oignon vert", comp: "feuilles", bassin: "tempere", t: [2, 8, 25, 31], dpv: [0.5, 1.1], dli: [13, 18], tsol: 24, ec: [1.6, 2.2], ph: [6.0, 6.6] },
};

// ------------------------------------------------------------ pannes injectables
export const PANNES = {
  serveur: "Serveur de supervision arrêté",
  reseau: "Coupure SNEL prolongée",
  sondePh: "Sonde pH fruits qui dérive (+0,8)",
  pompeIrr: "Pompe d'irrigation P-101 bloquée",
  surpresseur: "Surpresseur des bassins en panne",
  vent: "Rafale d'orage (16 m/s)",
  capteurTH: "Capteur T/HR fruits muet",
  uv: "Lampe UV-C UV-101 grillée",
};

// ------------------------------------------------------------ état initial
export function initialiser(E) {
  E.sys = {
    t: 0,
    pannes: {},
    eau: { citerne: 6200, tampon: 700, cumulPluie: 0, premierFlot: 0, pTransfert: false, forage: false, ro: false, evPad: false },
    fruits: {
      cuve: 380, ec: 2.9, ph: 5.9, t: 22, drainCuve: 60, somme: 0, seuil: 100, arrosages: 0, vApporte: 0, vDraine: 0,
      drainPct: 25, pIrr: false, irrRestant: 0, pReprise: false, uv: false, dosA: false, dosB: false, dosAcide: false,
      remplissage: false, dernierDosage: -999, absorbe: 0,
    },
    bassins: {
      frais: { v: 4200, ec: 1.8, ph: 6.0, t: 20.5, o2: 7.6, chiller: false, ev: false, dos: false, acide: false, uv: false },
      tempere: { v: 4200, ec: 1.8, ph: 6.1, t: 22.5, o2: 7.2, chiller: false, ev: false, dos: false, acide: false, uv: false },
      surpresseur: true, secours: false,
    },
    elec: { km1: true, km2: true, km3: true, charges: {}, courant: 0, onduleur: true },
    iiot: { messages: [], autonome: { "AUT-F": false, "AUT-L": false, "AUT-E": false }, derniereConsigne: 0, sms: [] },
    journal: [],
    alarmes: {},
  };
  return E;
}

function log(E, domaine, texte) {
  const h = Math.floor(E.h), m = Math.floor((E.h - h) * 60);
  E.sys.journal.unshift({ t: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, domaine, texte });
  if (E.sys.journal.length > 120) E.sys.journal.pop();
}

function msg(E, de, vers, sujet, contenu) {
  E.sys.iiot.messages.unshift({ t: E.h, de, vers, sujet, contenu });
  if (E.sys.iiot.messages.length > 40) E.sys.iiot.messages.pop();
}

// ------------------------------------------------------------ un pas (dt secondes)
export function pas(E, dt) {
  const S = E.sys, P = S.pannes;
  S.t += dt;
  const m = M.meteo(E.mois, E.h);
  if (P.vent) m.vent = 16;
  const jour = m.g > 5;

  // ---------------- IIoT : supervision, mode autonome
  const serveurOk = !P.serveur;
  if (serveurOk) S.iiot.derniereConsigne = S.t;
  const silence = S.t - S.iiot.derniereConsigne;
  for (const a of ["AUT-F", "AUT-L", "AUT-E"]) {
    const auto = silence > 120;
    if (auto !== S.iiot.autonome[a]) log(E, "iiot", auto ? `${a} : plus de consigne depuis 2 min, passage en mode autonome (régulation de repli)` : `${a} : consignes reçues, retour au mode normal`);
    S.iiot.autonome[a] = auto;
  }
  if (Math.floor(S.t / 30) !== Math.floor((S.t - dt) / 30)) {
    const f = E.comp.fruits;
    msg(E, "AUT-F", "serveur", "serre/lub1/fruits/mesure/air", P.capteurTH ? "(aucune réponse Modbus de TH-F1)" : `{"t":${f.t.toFixed(1)},"hr":${M.hrDepuisW(f.t, f.w).toFixed(0)}}`);
    msg(E, "AUT-L", "serveur", "serre/lub1/feuilles/mesure/bassin1", `{"t":${S.bassins.frais.t.toFixed(1)},"o2":${S.bassins.frais.o2.toFixed(1)}}`);
    msg(E, "AUT-E", "serveur", "serre/lub1/energie/mesure", `{"soc":${E.soc.toFixed(0)},"pv_w":${E.pv.toFixed(0)}}`);
    if (serveurOk) msg(E, "serveur", "AUT-F", "serre/lub1/fruits/consigne", `{"ouvrant_pct":${E.comp.fruits.cmd.ouvrant.toFixed(0)},"validite_s":120}`);
  }

  // ---------------- énergie : panne réseau imposée
  if (P.reseau) E.reseau = false;

  // ---------------- eau
  const W = S.eau;
  if (m.pluie) {
    const lps = 100 * (20 / 3600) * 0.85; // 20 mm/h sur 100 m², rendement 0,85, L/s
    const v = lps * dt;
    if (W.premierFlot < 50) W.premierFlot += v;
    else { W.citerne = Math.min(10000, W.citerne + v); W.cumulPluie += v; }
  } else W.premierFlot = Math.max(0, W.premierFlot - dt * 0.01);
  const besoinTampon = W.tampon < 500;
  if (besoinTampon && !W.pTransfert && !W.forage) {
    if (W.citerne > 1000) { W.pTransfert = true; log(E, "eau", "Tampon sous 50 % : P-001 transfère l'eau de pluie (citerne > 10 %)"); }
    else { W.forage = true; W.ro = true; log(E, "eau", "Citerne presque vide : pompe du forage P-002 et osmoseur RO-001 en marche"); }
  }
  if (W.tampon > 900) {
    if (W.pTransfert || W.forage) log(E, "eau", "Tampon plein (90 %) : arrêt du remplissage");
    W.pTransfert = false; W.forage = false; W.ro = false;
  }
  if (W.pTransfert) { const v = Math.min(W.citerne, 0.42 * dt); W.citerne -= v; W.tampon += v; } // 1,5 m³/h
  if (W.ro) W.tampon += 0.028 * dt; // 100 L/h d'eau osmosée

  // ---------------- fertirrigation fruits
  const F = S.fruits;
  const transpFruits = 1.7 * (0.45 * 0.7 * m.g * (1 - E.comp.fruits.cmd.ecran / 200) + 25 * M.dpv(E.comp.fruits.t, M.hrDepuisW(E.comp.fruits.t, E.comp.fruits.w))) / 2.45e6 * 50 * dt; // L sur 50 m²
  F.absorbe += transpFruits;
  if (m.g > 50) F.somme += m.g * dt / 1e4;
  if (F.somme >= F.seuil && F.irrRestant <= 0 && F.cuve > 40) {
    F.somme = 0; F.irrRestant = 20.7; F.arrosages++;
    log(E, "fertirrigation", `Somme de rayonnement atteinte (${F.seuil.toFixed(0)} J/cm²) : arrosage n° ${F.arrosages} de 150 mL par goutteur (P-101 + EV-101)`);
  }
  F.pIrr = F.irrRestant > 0 && !P.pompeIrr;
  if (F.irrRestant > 0) {
    const v = Math.min(F.irrRestant, 0.6 * dt);
    F.irrRestant -= v;
    if (!P.pompeIrr) {
      F.cuve -= v; F.vApporte += v;
      const absorbe = Math.min(v * 0.85, F.absorbe);
      F.absorbe -= absorbe;
      const draine = v - absorbe;
      F.vDraine += draine; F.drainCuve += draine;
      F.ec += (v / Math.max(F.cuve, 50)) * 0.01;
    }
    if (F.irrRestant <= 0 && !P.pompeIrr) {
      F.drainPct = 100 * F.vDraine / Math.max(1, F.vApporte);
      const ancien = F.seuil;
      if (F.drainPct < 20) F.seuil = Math.max(40, F.seuil * 0.9);
      else if (F.drainPct > 30) F.seuil = Math.min(200, F.seuil * 1.1);
      if (F.seuil !== ancien) log(E, "fertirrigation", `Drainage ${F.drainPct.toFixed(0)} % (cible 20-30 %) : seuil d'arrosage ajusté à ${F.seuil.toFixed(0)} J/cm²`);
    }
  }
  // reprise du drainage : filtre 50 µm + UV puis retour en cuve
  F.pReprise = F.drainCuve > 120 || (F.pReprise && F.drainCuve > 20);
  F.uv = F.pReprise && !P.uv;
  if (F.pReprise) { const v = Math.min(F.drainCuve, 0.28 * dt); F.drainCuve -= v; if (F.uv) { F.cuve += v; F.ec += 0.0006 * v; } }
  // remplissage et dosage
  if (F.cuve < 200 && !F.remplissage && W.tampon > 100) { F.remplissage = true; log(E, "fertirrigation", "Cuve de solution fruits sous 40 % : remplissage en eau traitée (EV-102)"); }
  if (F.remplissage) {
    const v = Math.min(0.5 * dt, W.tampon - 50, 450 - F.cuve);
    // injection proportionnelle de A et B pendant le remplissage : l'eau entre déjà à la CE visée
    if (v > 0) { F.ec = (F.ec * F.cuve + 3.0 * v) / (F.cuve + v); F.ph = (F.ph * F.cuve + 6.2 * v) / (F.cuve + v); F.cuve += v; W.tampon -= v; }
    if (F.cuve >= 449 || W.tampon < 60) F.remplissage = false;
  }
  const ecCible = 3.0, phCible = 5.8;
  const phMesure = F.ph + (P.sondePh ? 0.8 : 0);
  F.dosA = F.dosB = F.dosAcide = false;
  if (S.t - F.dernierDosage > 300 && !F.remplissage && serveurOk) {
    const tourPh = Math.floor(S.t / 300) % 2 === 1;
    if (F.ec < ecCible - 0.1 && !(tourPh && phMesure > phCible + 0.2)) {
      F.dosA = F.dosB = true; F.dernierDosage = S.t;
      const doses = Math.min(5, Math.round((ecCible - F.ec) / 0.1));
      F.ec += doses * 0.02 * 450 / Math.max(F.cuve, 100) * 0.5;
      log(E, "fertirrigation", `CE ${F.ec.toFixed(2)} < 2,90 mS/cm : ${doses} doses de 20 mL de A et de B (P-103, P-104)`);
    } else if (phMesure > phCible + 0.2) {
      F.dosAcide = true; F.dernierDosage = S.t;
      F.ph -= Math.min(0.4, (phMesure - phCible) * 0.6);
      log(E, "fertirrigation", `pH mesuré ${phMesure.toFixed(2)} > 6,0 : 5 mL d'acide (P-105)${P.sondePh ? " — attention : la sonde dérive, le pH réel baisse trop" : ""}`);
    }
  }
  F.ph += 0.000012 * dt; // l'absorption des nitrates fait remonter le pH
  F.t += ((E.comp.fruits.t - 1) - F.t) * dt / 20000;

  // ---------------- bassins feuilles
  const Bs = S.bassins;
  Bs.surpresseur = !P.surpresseur;
  if (P.surpresseur && !Bs.secours) { Bs.secours = true; log(E, "bassins", "Surpresseur principal arrêté : bascule automatique sur le surpresseur de secours 24 V"); }
  if (!P.surpresseur) Bs.secours = false;
  for (const nom of ["frais", "tempere"]) {
    const b = Bs[nom];
    const air = Bs.surpresseur ? 1 : Bs.secours ? 0.55 : 0;
    const sat = 14.6 - 0.33 * b.t;
    b.o2 += ((sat * (0.6 + 0.35 * air)) - b.o2) * dt / 1800 - (air ? 0 : 0.0006 * dt);
    b.o2 = Math.max(0.5, b.o2);
    const tAir = E.comp.feuilles.t;
    b.t += ((nom === "frais" ? tAir - 1.5 : tAir + 0.5) - b.t) * dt / 30000;
    const chiller = nom === "frais" && E.pv > 600 && (b.chiller ? b.t > 20.0 : b.t > 20.6);
    if (chiller !== b.chiller) log(E, "bassins", chiller ? "Bassin frais au-dessus de 20,5 °C : refroidisseur CH-201 en marche (sur le solaire)" : "Bassin frais revenu à la consigne : arrêt du refroidisseur");
    b.chiller = chiller;
    if (chiller) b.t -= 0.00022 * dt;
    const transp = (0.4 * 0.7 * m.g + 20 * M.dpv(tAir, M.hrDepuisW(tAir, E.comp.feuilles.w))) / 2.45e6 * 16.8 * dt;
    b.v -= transp;
    b.ec += transp / b.v * b.ec * 0.3 - 0.0000012 * dt;
    b.ev = b.v < 4100 && W.tampon > 60;
    if (b.ev) { const v = Math.min(0.2 * dt, W.tampon - 50); b.v += v; W.tampon -= v; b.ec = (b.ec * (b.v - v) + 1.6 * v) / b.v; }
    b.dos = b.ec < 1.7;
    if (b.dos && Math.random() < dt / 300) { b.ec += 0.08; log(E, "bassins", `Bassin ${nom} : CE ${b.ec.toFixed(2)} < 1,8 mS/cm, dose de A et B`); }
    b.ph += 0.00003 * dt;
    b.acide = b.ph > 6.3;
    if (b.acide && Math.random() < dt / 300) b.ph -= 0.15;
    b.uv = (E.h % 4) < 1 && !P.uv;
  }

  // ---------------- électricité : charges et contacteurs
  const f = E.comp.fruits.cmd, l = E.comp.feuilles.cmd;
  const socOk = s => E.reseau || E.soc + (E.pv > 3000 ? 15 : 0) >= s;
  const km1 = socOk(20), km2 = socOk(35), km3 = socOk(55);
  for (const [k, v, txt] of [["km1", km1, "KM1 (priorité 1 : irrigation, UV, brassage, stockage, moteurs)"], ["km2", km2, "KM2 (priorité 2 : froid, extracteurs, pad, refroidisseur)"], ["km3", km3, "KM3 (priorité 3 : LED, osmoseur, divers)"]]) {
    if (S.elec[k] !== v) log(E, "electricite", `${v ? "Réenclenchement" : "Délestage"} de ${txt}, batterie ${E.soc.toFixed(0)} %`);
    S.elec[k] = v;
  }
  const ch = S.elec.charges = {
    "Automates, réseau, capteurs (P0)": 60,
    "Surpresseur bassins (P0)": Bs.surpresseur ? 80 : 0,
    "Surpresseur secours 24 V (P0)": Bs.secours ? 45 : 0,
    "Pompe irrigation P-101 (P1)": km1 && F.pIrr ? 370 : 0,
    "Reprise drainage + UV (P1)": km1 && F.pReprise ? 160 : 0,
    "Brassage (P1)": km1 ? ((f.haf ? 2 : 0) + (l.haf ? 2 : 0)) * 45 : 0,
    "Aérothermes stockage (P1)": km1 && f.sto !== "arret" ? 380 : 0,
    "Moteurs ouvrants/écran (P1)": km1 ? 0 : 0,
    "Pompe de transfert P-001 (P1)": km1 && W.pTransfert ? 550 : 0,
    "Extracteurs (P2)": km2 ? ((f.ext || 0) + (l.ext || 0)) * 550 : 0,
    "Pompe du pad (P2)": km2 && (f.pad || l.pad) ? 100 : 0,
    "Refroidisseur CH-201 (P2)": km2 && Bs.frais.chiller ? 500 : 0,
    "Chambre froide (P2)": km2 ? (Math.sin(S.t / 600) > 0.2 ? 900 : 0) : 0,
    "LED de germination (P3)": km3 && E.h > 6 && E.h < 20 ? 200 : 0,
    "Osmoseur RO-001 (P3)": km3 && W.ro ? 400 : 0,
  };
  const total = Object.values(ch).reduce((a, b) => a + b, 0);
  S.elec.total = total;
  S.elec.courant = total / 230;

  // ---------------- alarmes
  const al = S.alarmes;
  const regle = (code, cond, niveau, texte) => {
    if (cond && !al[code]) { al[code] = { niveau, texte }; log(E, "alarme", `${niveau === "critique" ? "ALARME CRITIQUE" : "Alarme"} : ${texte}`); if (niveau === "critique") S.iiot.sms.unshift(`${texte}`); }
    if (!cond && al[code]) { delete al[code]; log(E, "alarme", `Fin d'alarme : ${texte}`); }
  };
  regle("O2", Math.min(Bs.frais.o2, Bs.tempere.o2) < 5, "critique", "oxygène dissous bas dans les bassins");
  regle("TSOL", Bs.frais.t > 22, "attention", "bassin frais au-dessus de 22 °C (risque Pythium)");
  regle("IRR", P.pompeIrr && F.irrRestant > 0, "critique", "arrosage commandé sans débit (pompe P-101 ?)");
  regle("PH", phMesure < 5.2 || phMesure > 6.8 || (P.sondePh && Math.abs(F.ph - phMesure) > 0.5), "attention", "pH fruits incohérent : contrôler la sonde au pH-mètre de poche");
  regle("SOC", E.soc < 25, "attention", "batterie sous 25 %");
  regle("SRV", silence > 120, "attention", "automates en mode autonome (serveur muet)");
  regle("UV", P.uv && F.pReprise, "attention", "lampe UV-C hors service : drainage non désinfecté renvoyé en cuve");
  regle("TH", P.capteurTH, "attention", "capteur T/HR fruits muet : régulation sur valeurs de secours");
  regle("CHAUD", E.comp.fruits.t > 35, "critique", "température fruits au-dessus de 35 °C");
}

// ------------------------------------------------------------ aptitude des cultures
export function aptitude(E, cle) {
  const c = CULTURES[cle], S = E.sys, s = E.comp[c.comp];
  const hr = M.hrDepuisW(s.t, s.w), deficit = M.dpv(s.t, hr);
  const m = M.meteo(E.mois, E.h);
  const facteurs = [];
  const [tmin, topt1, topt2, tmax] = c.t;
  let ft = 1;
  if (s.t < topt1) ft = Math.max(0, (s.t - tmin) / (topt1 - tmin));
  else if (s.t > topt2) ft = Math.max(0, (tmax - s.t) / (tmax - topt2));
  facteurs.push(["température", ft, `${s.t.toFixed(1)} °C (optimum ${topt1}-${topt2})`]);
  let fd = 1;
  if (m.g > 5) {
    if (deficit < c.dpv[0]) fd = Math.max(0.3, deficit / c.dpv[0]);
    else if (deficit > c.dpv[1]) fd = Math.max(0, 1 - (deficit - c.dpv[1]) / 1.0);
  }
  facteurs.push(["DPV", fd, `${deficit.toFixed(2)} kPa (cible ${c.dpv[0]}-${c.dpv[1]})`]);
  let tsol, ec, ph;
  if (c.comp === "fruits") { tsol = S.fruits.t; ec = S.fruits.ec; ph = S.fruits.ph; }
  else { const b = S.bassins[c.bassin]; tsol = b.t; ec = b.ec; ph = b.ph; }
  const fs = tsol <= c.tsol ? 1 : Math.max(0, 1 - (tsol - c.tsol) / 4);
  facteurs.push(["solution", fs, `${tsol.toFixed(1)} °C (max ${c.tsol})`]);
  const fe = ec >= c.ec[0] && ec <= c.ec[1] ? 1 : Math.max(0, 1 - Math.min(Math.abs(ec - c.ec[0]), Math.abs(ec - c.ec[1])) / 1.0);
  facteurs.push(["CE", fe, `${ec.toFixed(2)} mS/cm (cible ${c.ec[0]}-${c.ec[1]})`]);
  const fp = ph >= c.ph[0] && ph <= c.ph[1] ? 1 : Math.max(0, 1 - Math.min(Math.abs(ph - c.ph[0]), Math.abs(ph - c.ph[1])) / 0.8);
  facteurs.push(["pH", fp, `${ph.toFixed(2)} (cible ${c.ph[0]}-${c.ph[1]})`]);
  if (c.comp === "feuilles") {
    const o2 = S.bassins[c.bassin].o2;
    facteurs.push(["oxygène", Math.min(1, Math.max(0, (o2 - 3) / 3)), `${o2.toFixed(1)} mg/L (min 6)`]);
  }
  const score = Math.round(100 * facteurs.reduce((a, f) => Math.min(a, f[1]), 1));
  const limitant = facteurs.reduce((a, f) => (f[1] < a[1] ? f : a), facteurs[0]);
  return { nom: c.nom, score, limitant: score >= 95 ? null : limitant, facteurs };
}

// ------------------------------------------------------------ règles « qui fait quoi, quand »
export function regles(E) {
  const S = E.sys, f = E.comp.fruits, m = M.meteo(E.mois, E.h), cons = M.CONSIGNES.fruits;
  const hr = M.hrDepuisW(f.t, f.w), jour = m.g > 5, tAere = cons.tj + cons.ea;
  return {
    climat: [
      ["Vent ≥ 14 m/s", (S.pannes.vent ? 16 : m.vent) >= 14, "ouvrants fermés (sécurité structure)", "AUT-F / AUT-L, anémomètre"],
      ["Pluie détectée", m.pluie, "ouvrants limités à 20 %", "station météo"],
      [`T intérieure > ${tAere} °C`, f.t > tAere, "ouverture proportionnelle des ouvrants (bande 4 °C)", "moteurs M-101 à M-104"],
      [`T > ${tAere + 3} °C et HR extérieure < 65 % et jour`, f.mode === "evaporatif", "serre fermée, pad humidifié, extracteurs", "P-301, EX-101, EX-102"],
      ["Soleil > 650 W/m² et serre chaude", f.cmd.ecran > 0 && f.cmd.ecran < 95, "écran d'ombrage fermé à 70 %", "M-105"],
      [`Nuit et T extérieure < ${cons.tn + 5} °C`, f.cmd.ecran >= 95, "écran thermique fermé", "M-105"],
      [`T < ${jour ? cons.tj : cons.tn} °C et cuve plus chaude`, f.cmd.sto === "decharge", "restitution de la chaleur stockée", "AE-101, P-401"],
      [`Jour et T > ${cons.tj + 3} °C et cuve plus froide`, f.cmd.sto === "charge", "stockage de l'excès de chaleur", "AE-101, P-401"],
      [`HR > ${cons.hr - 5} % ou écran fermé`, f.cmd.haf, "brassage de l'air", "VB-101 à VB-104"],
    ],
    fertirrigation: [
      [`Somme de rayonnement ≥ ${S.fruits.seuil.toFixed(0)} J/cm²`, S.fruits.irrRestant > 0, "arrosage de 150 mL par goutteur", "P-101, EV-101"],
      ["Drainage < 20 %", S.fruits.drainPct < 20, "seuil d'arrosage abaissé de 10 %", "serveur (régulation)"],
      ["Drainage > 30 %", S.fruits.drainPct > 30, "seuil d'arrosage relevé de 10 %", "serveur (régulation)"],
      ["Cuve de drainage > 120 L", S.fruits.pReprise, "reprise du drainage, filtre 50 µm, UV-C", "P-102, UV-101"],
      ["Cuve de solution < 40 %", S.fruits.remplissage, "remplissage en eau traitée", "EV-102"],
      ["CE < 2,90 mS/cm (après 5 min de mélange)", S.fruits.dosA, "doses de solutions A et B", "P-103, P-104"],
      ["pH > 6,0 (après 5 min de mélange)", S.fruits.dosAcide, "dose d'acide", "P-105"],
    ],
    bassins: [
      ["Toujours", S.bassins.surpresseur, "aération des bassins (jamais délestée)", "SP-201"],
      ["Surpresseur principal arrêté", S.bassins.secours, "surpresseur de secours 24 V", "SP-202"],
      ["Bassin frais > 20,5 °C et solaire > 600 W", S.bassins.frais.chiller, "refroidisseur de solution", "CH-201"],
      ["Volume < 4 100 L", S.bassins.frais.ev || S.bassins.tempere.ev, "appoint en eau traitée", "EV-201, EV-202"],
      ["CE < 1,7 mS/cm", S.bassins.frais.dos || S.bassins.tempere.dos, "dose de A et B", "P-201 à P-204"],
      ["Une heure sur quatre", S.bassins.frais.uv, "filtration et UV en dérivation", "P-205, UV-201"],
    ],
    eau: [
      ["Pluie et premier flot évacué", E.sys.eau.premierFlot >= 50 && M.meteo(E.mois, E.h).pluie, "remplissage de la citerne", "FF-001"],
      ["Tampon < 50 % et citerne > 10 %", S.eau.pTransfert, "transfert de l'eau de pluie", "P-001"],
      ["Tampon < 50 % et citerne ≤ 10 %", S.eau.forage, "forage et osmoseur", "P-002, RO-001"],
      ["Tampon > 90 %", S.eau.tampon > 900, "arrêt du remplissage", "AUT-E"],
    ],
    electricite: [
      ["Réseau SNEL présent", E.reseau, "recharge de la batterie si SOC < 60 %", "onduleur OND-1"],
      ["SOC ≥ 20 % ou réseau", S.elec.km1, "KM1 fermé : charges priorité 1", "AUT-E"],
      ["SOC ≥ 35 % ou réseau", S.elec.km2, "KM2 fermé : charges priorité 2", "AUT-E"],
      ["SOC ≥ 55 % ou réseau", S.elec.km3, "KM3 fermé : charges priorité 3", "AUT-E"],
      ["Pas de réseau et SOC < 15 %", E.groupe, "démarrage du groupe électrogène", "OND-1 (contact sec)"],
    ],
    iiot: [
      ["Consigne reçue il y a moins de 2 min", !S.iiot.autonome["AUT-F"], "l'automate applique la consigne du serveur", "AUT-F, AUT-L, AUT-E"],
      ["Plus de consigne depuis 2 min", S.iiot.autonome["AUT-F"], "régulation de repli locale + voyant AUTO", "AUT-F, AUT-L, AUT-E"],
      ["Toutes les 30 s", true, "publication MQTT des mesures", "automates → serveur"],
      ["Alarme critique", Object.values(S.alarmes).some(a => a.niveau === "critique"), "SMS au technicien, relance toutes les 15 min", "routeur 4G"],
    ],
  };
}
