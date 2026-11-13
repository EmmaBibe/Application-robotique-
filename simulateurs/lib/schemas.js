// Schémas animés du simulateur des systèmes. Les repères (P-101, EV-102, KM2...)
// sont ceux des schémas du dossier de plans.

import * as M from "./modele.js";
import * as SYS from "./systemes.js";

const COUL = { eau: "var(--eau)", sol: "var(--sol)", drain: "#8a6a45", air: "var(--bleu)", elec: "var(--jaune)", data: "var(--violet)", chaud: "var(--orange)" };
const $ = s => document.querySelector(s);

// ------------------------------------------------------------ primitives de dessin
const t = (x, y, txt, cls = "val", ancre = "middle", id = "") =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${ancre}"${id ? ` id="${id}"` : ""}>${txt}</text>`;
const tuyau = (id, d, coul = COUL.eau) => `<path id="${id}" class="tuyau" d="${d}" stroke="${coul}"/>`;
const fil = (id, d, coul = COUL.elec) => `<path id="${id}" class="fil" d="${d}" stroke="${coul}"/>`;
function equip(id, x, y, forme, etiquette, sous = "", dy = 34) {
  return `<g class="equip" data-id="${id}" id="e-${id}" transform="translate(${x},${y})">${forme}
    ${t(0, dy, etiquette, "tag")}${t(0, dy + 13, sous, "val", "middle", "v-" + id)}</g>`;
}
const F = {
  pompe: `<circle class="corps" r="16"/><path d="M-7,-9 L10,0 L-7,9 Z" fill="var(--doux)"/>`,
  vanne: `<path class="corps" d="M-14,-9 L14,9 L14,-9 L-14,9 Z"/>`,
  filtre: `<rect class="corps" x="-14" y="-16" width="28" height="32" rx="3"/><path d="M-14,16 L14,-16" stroke="var(--doux)" stroke-width="1.5"/>`,
  uv: `<rect class="corps" x="-22" y="-12" width="44" height="24" rx="12"/><text x="0" y="4" text-anchor="middle" class="tag" fill="var(--violet)">UV-C</text>`,
  capteur: txt => `<circle class="corps" r="13"/><text x="0" y="4" text-anchor="middle" class="tag">${txt}</text>`,
  moteur: `<circle class="corps" r="14"/><text x="0" y="5" text-anchor="middle" class="grand">M</text>`,
  ventilo: id => `<circle class="corps" r="18"/><g id="rot-${id}"><path d="M0,0 L-4,-15 L4,-15 Z M0,0 L13,8 L9,13 Z M0,0 L-13,8 L-9,13 Z" fill="var(--doux)"/></g>`,
  boite: (l, h, txt) => `<rect class="corps" x="${-l / 2}" y="${-h / 2}" width="${l}" height="${h}" rx="6"/><text x="0" y="5" text-anchor="middle" class="grand">${txt}</text>`,
  cuve: (id, l, h) => `<rect class="corps" x="${-l / 2}" y="${-h / 2}" width="${l}" height="${h}" rx="4"/>
    <rect id="niv-${id}" x="${-l / 2 + 3}" y="${-h / 2 + 3}" width="${l - 6}" height="${h - 6}" fill="var(--eau)" opacity=".55"/>`,
  contact: `<rect class="corps" x="-16" y="-12" width="32" height="24" rx="3"/><path id="lame" d="M-8,6 L8,-6" stroke="var(--texte)" stroke-width="2"/>`,
};
function niveau(id, frac) {
  const r = document.getElementById("niv-" + id);
  if (!r) return;
  const corps = r.previousElementSibling;
  const H = +corps.getAttribute("height") - 6, y0 = +corps.getAttribute("y") + 3;
  const f = Math.max(0, Math.min(1, frac));
  r.setAttribute("y", y0 + H * (1 - f));
  r.setAttribute("height", H * f);
}
function etat(id, e) {
  const g = document.getElementById("e-" + id);
  if (!g) return;
  g.classList.toggle("on", e === "on");
  g.classList.toggle("ko", e === "ko");
  g.classList.toggle("att", e === "att");
}
function val(id, txt) { const v = document.getElementById("v-" + id); if (v) v.textContent = txt; }
function flux(id, actif, lent = false) {
  const p = document.getElementById(id);
  if (!p) return;
  p.classList.toggle("flux", !!actif);
  p.classList.toggle("lent", !!lent);
  p.classList.toggle("actif", !!actif);
}
function rot(id, actif) { const g = document.getElementById("rot-" + id); if (g) g.classList.toggle("rot", !!actif); }
const svg = (contenu, h = 620) => `<svg class="schema" viewBox="0 0 1000 ${h}" xmlns="http://www.w3.org/2000/svg">${contenu}</svg>`;

// ------------------------------------------------------------ 1. vue d'ensemble
const ensemble = {
  titre: "Vue d'ensemble : comment les sous-systèmes interagissent",
  svg() {
    const b = (id, x, y, l, h, titre, lignes) => `<g class="equip" data-id="${id}" id="e-${id}"><rect class="corps" x="${x}" y="${y}" width="${l}" height="${h}" rx="10"/>
      ${t(x + 12, y + 22, titre, "grand", "start")}${lignes.map((li, k) => t(x + 12, y + 42 + k * 17, "", "val", "start", `${id}-${k}`)).join("")}</g>`;
    return svg(`
      ${fil("f-pv", "M190,120 L330,120", COUL.elec)}
      ${fil("f-alim1", "M480,120 C560,120 560,250 640,250", COUL.elec)}
      ${fil("f-alim2", "M480,140 C540,140 540,420 640,420", COUL.elec)}
      ${fil("f-alim3", "M405,190 L405,300", COUL.elec)}
      ${tuyau("t-pluie", "M120,520 L120,470", COUL.eau)}
      ${tuyau("t-eau1", "M200,450 L330,450", COUL.eau)}
      ${tuyau("t-eau2", "M480,440 C560,440 560,300 640,300", COUL.eau)}
      ${tuyau("t-eau3", "M480,470 C560,470 560,480 640,480", COUL.eau)}
      ${fil("f-data1", "M830,330 L830,560 L560,560", COUL.data)}
      ${fil("f-data2", "M405,330 L405,520", COUL.data)}
      ${fil("f-air", "M770,210 L770,180", COUL.air)}
      ${b("SOLEIL", 40, 70, 150, 110, "Soleil et météo", [0, 1, 2])}
      ${b("ENERGIE", 330, 70, 150, 120, "Énergie", [0, 1, 2, 3])}
      ${b("CLIMAT-F", 640, 190, 300, 110, "Climat fruits", [0, 1, 2])}
      ${b("CLIMAT-L", 640, 320, 300, 110, "Climat feuilles et bassins", [0, 1, 2])}
      ${b("FERTI", 640, 450, 300, 80, "Fertirrigation fruits", [0, 1])}
      ${b("EAU", 40, 400, 160, 110, "Eau", [0, 1, 2])}
      ${b("STOCK", 330, 400, 150, 100, "Distribution", [0, 1])}
      ${b("SUPERV", 330, 300, 150, 90, "Automates", [0, 1])}
      ${b("SERVEUR", 330, 520, 230, 80, "Serveur et alertes", [0, 1])}
      ${t(500, 30, "jaune : énergie · bleu : eau · violet : données", "val")}
    `);
  },
  maj(E, fmt) {
    const S = E.sys, m = M.meteo(E.mois, E.h), f = E.comp.fruits, l = E.comp.feuilles;
    const lig = (id, arr) => arr.forEach((v, k) => { const e = document.getElementById(`${id}-${k}`); if (e) e.textContent = v; });
    lig("SOLEIL", [`${fmt(m.g, 0)} W/m², ${fmt(m.t)} °C`, `${fmt(m.hr, 0)} % HR, vent ${fmt(S.pannes.vent ? 16 : m.vent)} m/s`, m.pluie ? "pluie" : "sec"]);
    lig("ENERGIE", [`solaire ${fmt(E.pv / 1000, 2)} kW`, `batterie ${fmt(E.soc, 0)} %`, `réseau ${E.reseau ? "présent" : "absent"}`, `conso ${fmt(S.elec.total / 1000, 2)} kW`]);
    lig("CLIMAT-F", [`${fmt(f.t)} °C, ${fmt(M.hrDepuisW(f.t, f.w), 0)} % HR`, `${f.mode === "evaporatif" ? "mode évaporatif" : "ouvrants " + fmt(f.cmd.ouvrant, 0) + " %"}, écran ${fmt(f.cmd.ecran, 0)} %`, `stockage ${fmt(E.tsto)} °C (${f.cmd.sto})`]);
    lig("CLIMAT-L", [`${fmt(l.t)} °C, ${fmt(M.hrDepuisW(l.t, l.w), 0)} % HR`, `bassin frais ${fmt(S.bassins.frais.t)} °C, O2 ${fmt(S.bassins.frais.o2)}`, `refroidisseur ${S.bassins.frais.chiller ? "en marche" : "arrêté"}`]);
    lig("FERTI", [`CE ${fmt(S.fruits.ec, 2)}, pH ${fmt(S.fruits.ph, 2)}, ${S.fruits.arrosages} arrosages`, `drainage ${fmt(S.fruits.drainPct, 0)} %, seuil ${fmt(S.fruits.seuil, 0)} J/cm²`]);
    lig("EAU", [`citerne ${fmt(S.eau.citerne / 1000, 2)} m³`, `tampon ${fmt(S.eau.tampon, 0)} L`, S.eau.forage ? "forage + osmoseur" : S.eau.pTransfert ? "transfert pluie" : "au repos"]);
    lig("STOCK", [`vers fruits, bassins, pad`, `tampon ${fmt(S.eau.tampon / 10, 0)} %`]);
    const auto = Object.values(S.iiot.autonome).some(Boolean);
    lig("SUPERV", [auto ? "MODE AUTONOME" : "consignes reçues", "AUT-F · AUT-L · AUT-E"]);
    lig("SERVEUR", [S.pannes.serveur ? "ARRÊTÉ" : "régulation, base, interface", `${Object.keys(S.alarmes).length} alarme(s)`]);
    flux("f-pv", E.pv > 50); flux("f-alim1", S.elec.total > 0); flux("f-alim2", S.elec.total > 0); flux("f-alim3", true);
    flux("t-pluie", m.pluie); flux("t-eau1", S.eau.pTransfert || S.eau.ro); flux("t-eau2", S.fruits.remplissage); flux("t-eau3", S.bassins.frais.ev || S.bassins.tempere.ev);
    flux("f-data1", !S.pannes.serveur); flux("f-data2", true); flux("f-air", f.cmd.ouvrant > 0 || f.mode === "evaporatif");
    etat("SUPERV", auto ? "att" : "on"); etat("SERVEUR", S.pannes.serveur ? "ko" : Object.keys(S.alarmes).length ? "att" : "on");
    etat("ENERGIE", E.soc < 25 ? "att" : "on"); etat("EAU", S.eau.citerne < 1000 ? "att" : "on");
    etat("CLIMAT-F", f.t > 30 || f.t < 12 ? "att" : "on"); etat("CLIMAT-L", S.bassins.frais.t > 22 || S.bassins.frais.o2 < 5 ? "att" : "on");
    etat("FERTI", S.pannes.pompeIrr ? "ko" : "on"); etat("SOLEIL", m.g > 5 ? "on" : "");
  },
  kpis(E, fmt) {
    const res = Object.values(SYS.CULTURES).map((c, k) => SYS.aptitude(E, Object.keys(SYS.CULTURES)[k]).score);
    return [["Alarmes", Object.keys(E.sys.alarmes).length, "actives"], ["Conditions cultures", Math.round(res.reduce((a, b) => a + b, 0) / res.length) + " / 100", "moyenne"],
      ["Batterie", fmt(E.soc, 0) + " %", E.reseau ? "réseau présent" : "sans réseau"], ["Eau consommée", fmt(E.eau.transp + E.eau.pad, 0) + " L", "depuis minuit"]];
  },
};

// ------------------------------------------------------------ 2. climat (coupe nord-sud)
const climat = {
  titre: "Climat : coupe nord-sud de la serre, en direct",
  svg() {
    return svg(`
      <defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--bleu)"/></marker>
      <marker id="fc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--orange)"/></marker></defs>
      <g id="rayons">${[0, 1, 2, 3, 4].map(k => `<line x1="${380 + k * 60}" y1="40" x2="${330 + k * 60}" y2="150" stroke="var(--jaune)" stroke-width="3" stroke-dasharray="8 6"/>`).join("")}</g>
      ${t(500, 30, "", "grand", "middle", "soleil")}
      <rect x="0" y="540" width="1000" height="80" fill="var(--trait)" opacity=".5"/>
      <path d="M200,540 L200,330 Q225,220 500,205 Q775,220 800,330 L800,540" fill="none" stroke="var(--vert)" stroke-width="4"/>
      <line x1="500" y1="205" x2="500" y2="540" stroke="var(--vert)" stroke-width="2" stroke-dasharray="8 6"/>
      ${t(350, 260, "FEUILLES (sud)", "grand")}${t(650, 260, "FRUITS (nord)", "grand")}
      <line id="ecran-l" x1="202" y1="330" x2="498" y2="330" stroke="var(--doux)" stroke-width="5"/>
      <line id="ecran-f" x1="502" y1="330" x2="798" y2="330" stroke="var(--doux)" stroke-width="5"/>
      <g class="equip" data-id="VO-201"><line id="vo-l" x1="455" y1="212" x2="410" y2="222" stroke="var(--bleu)" stroke-width="6"/></g>
      <g class="equip" data-id="VO-101"><line id="vo-f" x1="545" y1="212" x2="590" y2="222" stroke="var(--bleu)" stroke-width="6"/></g>
      <path id="air-l" d="M420,300 Q430,240 440,170" fill="none" stroke="var(--bleu)" stroke-width="3" marker-end="url(#fl)" opacity="0"/>
      <path id="air-f" d="M580,300 Q570,240 560,170" fill="none" stroke="var(--bleu)" stroke-width="3" marker-end="url(#fl)" opacity="0"/>
      <g class="equip" data-id="VL-101"><rect id="vl-f" x="796" y="380" width="8" height="70" fill="var(--bleu)"/></g>
      <g class="equip" data-id="VL-201"><rect id="vl-l" x="196" y="380" width="8" height="70" fill="var(--bleu)"/></g>
      <path id="lat-f" d="M860,420 L810,420" fill="none" stroke="var(--bleu)" stroke-width="3" marker-end="url(#fl)" opacity="0"/>
      <path id="lat-l" d="M140,420 L190,420" fill="none" stroke="var(--bleu)" stroke-width="3" marker-end="url(#fl)" opacity="0"/>
      <rect x="230" y="505" width="240" height="35" fill="var(--eau)" opacity=".5"/>${t(350, 528, "bassins à radeaux", "val")}
      ${[560, 620, 680, 740].map(x => `<line x1="${x}" y1="535" x2="${x}" y2="345" stroke="#3f8f3a" stroke-width="5"/><circle cx="${x + 6}" cy="450" r="7" fill="#c94a3a"/>`).join("")}
      ${equip("CU-401", 760, 495, F.cuve("CU-401", 40, 70), "", "", 50)}
      <path id="chaleur" d="M740,470 Q700,440 720,400 Q740,360 700,330" fill="none" stroke="var(--orange)" stroke-width="3" marker-end="url(#fc)" opacity="0"/>
      ${equip("AE-101", 700, 300, F.ventilo("AE-101"), "AE-101", "", 32)}
      ${equip("VB-101", 650, 365, F.ventilo("VB-101"), "", "", 28)}
      ${equip("VB-201", 350, 365, F.ventilo("VB-201"), "", "", 28)}
      ${equip("TH-F1", 640, 420, F.capteur("TH"), "TH-F1", "", 28)}
      ${equip("TH-L1", 300, 450, F.capteur("TH"), "TH-L1", "", 28)}
      ${equip("CO2-F1", 600, 300, F.capteur("CO₂"), "", "", 26)}
      ${equip("MET-EXT", 920, 300, F.boite(90, 44, "Météo"), "", "", 40)}
      ${t(920, 365, "", "val", "middle", "met2")}
      <g transform="translate(0,560)">
        ${t(500, 18, "Pignons (vus de face) : murs évaporatifs à l'est, extracteurs à l'ouest", "val")}
        ${equip("P-301", 120, 40, F.boite(120, 34, "Pad est"), "", "", 30)}
        ${equip("EX-101", 330, 40, F.ventilo("EX-101"), "EX-101", "", 30)}
        ${equip("EX-102", 430, 40, F.ventilo("EX-102"), "EX-102", "", 30)}
        <path id="air-pad" d="M190,40 L300,40" fill="none" stroke="var(--bleu)" stroke-width="3" marker-end="url(#fl)" opacity="0"/>
        ${t(700, 45, "", "val", "middle", "mode")}
      </g>
    `, 680);
  },
  maj(E, fmt) {
    const f = E.comp.fruits, l = E.comp.feuilles, m = M.meteo(E.mois, E.h), S = E.sys;
    $("#rayons").setAttribute("opacity", Math.min(1, m.g / 800));
    $("#soleil").textContent = m.g > 5 ? `Soleil ${fmt(m.g, 0)} W/m² (sous serre ≈ ${fmt(m.g * 0.7 * (1 - f.cmd.ecran / 200), 0)} W/m²)` : "Nuit";
    for (const [c, s] of [["f", f], ["l", l]]) {
      const ecr = s.cmd.ecran / 100;
      const el = $("#ecran-" + c);
      const x0 = c === "f" ? 502 : 202;
      el.setAttribute("x2", x0 + 296 * ecr); el.setAttribute("opacity", ecr > 0.01 ? 1 : 0.15);
      const o = s.cmd.ouvrant / 100;
      const vo = $("#vo-" + c);
      if (c === "f") vo.setAttribute("x2", 590 + 10 * o), vo.setAttribute("y2", 222 - 45 * o);
      else vo.setAttribute("x2", 410 - 10 * o), vo.setAttribute("y2", 222 - 45 * o);
      $("#air-" + c).setAttribute("opacity", o > 0.02 ? 0.4 + 0.6 * o : 0);
      $("#lat-" + c).setAttribute("opacity", o > 0.02 ? 0.4 + 0.6 * o : 0);
      $("#vl-" + c).setAttribute("height", 70 * (1 - o));
    }
    $("#chaleur").setAttribute("opacity", f.cmd.sto === "decharge" ? 1 : 0);
    rot("AE-101", f.cmd.sto !== "arret"); etat("AE-101", f.cmd.sto !== "arret" ? "on" : "");
    val("AE-101", f.cmd.sto === "charge" ? "stocke" : f.cmd.sto === "decharge" ? "restitue" : "");
    rot("VB-101", f.cmd.haf); rot("VB-201", l.cmd.haf); etat("VB-101", f.cmd.haf ? "on" : ""); etat("VB-201", l.cmd.haf ? "on" : "");
    niveau("CU-401", (E.tsto - 15) / 20); val("CU-401", `${fmt(E.tsto)} °C`);
    val("TH-F1", S.pannes.capteurTH ? "muet" : `${fmt(f.t)} °C · ${fmt(M.hrDepuisW(f.t, f.w), 0)} %`); etat("TH-F1", S.pannes.capteurTH ? "ko" : "on");
    val("TH-L1", `${fmt(l.t)} °C · ${fmt(M.hrDepuisW(l.t, l.w), 0)} %`); etat("TH-L1", "on");
    val("MET-EXT", `${fmt(m.t)} °C · ${fmt(m.hr, 0)} %`); $("#met2").textContent = `vent ${fmt(S.pannes.vent ? 16 : m.vent)} m/s${m.pluie ? " · pluie" : ""}`;
    const evap = f.mode === "evaporatif" || l.mode === "evaporatif";
    etat("P-301", evap ? "on" : ""); $("#air-pad").setAttribute("opacity", evap ? 1 : 0);
    rot("EX-101", f.cmd.ext > 0); rot("EX-102", l.cmd.ext > 0); etat("EX-101", f.cmd.ext ? "on" : ""); etat("EX-102", l.cmd.ext ? "on" : "");
    val("EX-101", f.cmd.ext ? `vitesse ${f.cmd.ext}` : ""); val("EX-102", l.cmd.ext ? `vitesse ${l.cmd.ext}` : "");
    $("#mode").textContent = evap ? "Mode évaporatif : air entrant refroidi de " + fmt(m.t - (m.t - 0.8 * (m.t - M.tHumide(m.t, m.hr))), 1) + " à " + fmt(m.t - 0.8 * (m.t - M.tHumide(m.t, m.hr))) + " °C" : "Ventilation naturelle à travers les filets 50 mesh";
  },
  kpis(E, fmt) {
    const f = E.comp.fruits, l = E.comp.feuilles, hf = M.hrDepuisW(f.t, f.w);
    return [["Fruits", fmt(f.t) + " °C", `DPV ${fmt(M.dpv(f.t, hf), 2)} kPa`], ["Feuilles", fmt(l.t) + " °C", `${fmt(M.hrDepuisW(l.t, l.w), 0)} % HR`],
      ["Ouvrants", fmt(f.cmd.ouvrant, 0) + " %", "fruits"], ["Écran", fmt(f.cmd.ecran, 0) + " %", "fruits"], ["Stockage", fmt(E.tsto) + " °C", f.cmd.sto]];
  },
};

// ------------------------------------------------------------ 3. fertirrigation fruits (P&ID)
const fertirrigation = {
  titre: "Fertirrigation du compartiment fruits (P&ID simplifié)",
  svg() {
    return svg(`
      ${tuyau("t-app", "M60,120 L160,120 L160,230", COUL.eau)}
      ${equip("EV-102", 110, 120, F.vanne, "EV-102", "", 26)}
      ${equip("CU-101", 200, 300, F.cuve("CU-101", 110, 130), "CU-101 cuve 500 L", "", 85)}
      ${tuyau("t-a", "M110,80 L170,80 L170,236", COUL.sol)}${tuyau("t-b", "M230,80 L230,236", COUL.sol)}${tuyau("t-c", "M330,80 L260,80 L260,236", "var(--rouge)")}
      ${equip("P-103", 140, 50, F.pompe, "P-103 (A)", "", -24)}${equip("P-104", 230, 40, F.pompe, "P-104 (B)", "", -24)}${equip("P-105", 330, 50, F.pompe, "P-105 (acide)", "", -24)}
      ${t(40, 125, "eau traitée", "val", "start")}
      ${equip("CE-101", 300, 245, F.capteur("CE"), "", "", 22)}${equip("PH-101", 300, 300, F.capteur("pH"), "", "", 22)}${equip("TT-101", 300, 355, F.capteur("T"), "", "", 22)}
      ${tuyau("t-irr", "M255,350 L380,350 L380,250 L860,250", COUL.sol)}
      ${equip("P-101", 380, 350, F.pompe, "P-101", "", 30)}
      ${equip("FI-101", 470, 250, F.filtre, "FI-101", "120 mesh", 30)}
      ${equip("EV-101", 560, 250, F.vanne, "EV-101", "", 26)}
      ${[0, 1, 2].map(k => `<line x1="${650 + k * 80}" y1="250" x2="${650 + k * 80}" y2="330" stroke="var(--sol)" stroke-width="2"/>
        <rect x="${635 + k * 80}" y="330" width="30" height="34" rx="4" fill="#222"/><line x1="${650 + k * 80}" y1="330" x2="${650 + k * 80}" y2="230" stroke="#3f8f3a" stroke-width="5"/>
        <circle cx="${656 + k * 80}" cy="270" r="6" fill="#c94a3a"/>`).join("")}
      ${t(730, 225, "seaux hollandais, goutteurs 2 L/h", "val")}
      ${tuyau("t-drain", "M650,380 L900,380 L900,470", COUL.drain)}
      ${equip("BD-101", 790, 380, F.capteur("BD"), "BD-101", "", 28)}
      ${equip("CU-102", 900, 510, F.cuve("CU-102", 80, 70), "CU-102 drainage", "", 52)}
      ${tuyau("t-rep", "M860,540 L560,540 L560,450 L255,450 L255,365", COUL.drain)}
      ${equip("P-102", 760, 540, F.pompe, "P-102", "", 30)}
      ${equip("FL-102", 640, 540, F.filtre, "FL-102", "50 µm", 30)}
      ${equip("UV-101", 450, 450, F.uv, "UV-101", "", 30)}
      ${t(70, 600, "", "val", "start", "bilan")}
    `);
  },
  maj(E, fmt) {
    const F_ = E.sys.fruits, P = E.sys.pannes;
    niveau("CU-101", F_.cuve / 500); val("CU-101", `${fmt(F_.cuve, 0)} L`);
    niveau("CU-102", F_.drainCuve / 200); val("CU-102", `${fmt(F_.drainCuve, 0)} L`);
    etat("EV-102", F_.remplissage ? "on" : ""); flux("t-app", F_.remplissage);
    for (const [id, on, tid] of [["P-103", F_.dosA, "t-a"], ["P-104", F_.dosB, "t-b"], ["P-105", F_.dosAcide, "t-c"]]) { etat(id, on ? "on" : ""); flux(tid, on); }
    val("CE-101", `CE ${fmt(F_.ec, 2)}`); val("PH-101", `pH ${fmt(F_.ph + (P.sondePh ? 0.8 : 0), 2)}${P.sondePh ? " (dérive)" : ""}`); val("TT-101", `${fmt(F_.t)} °C`);
    etat("CE-101", "on"); etat("PH-101", P.sondePh ? "ko" : "on"); etat("TT-101", "on");
    const arrose = F_.irrRestant > 0;
    etat("P-101", P.pompeIrr ? "ko" : arrose ? "on" : ""); etat("EV-101", arrose ? "on" : ""); etat("FI-101", arrose ? "on" : "");
    flux("t-irr", arrose && !P.pompeIrr); flux("t-drain", arrose && !P.pompeIrr, true);
    val("P-101", P.pompeIrr ? "BLOQUÉE" : arrose ? "arrose" : `prochain : ${fmt(F_.seuil - F_.somme, 0)} J/cm²`);
    etat("P-102", F_.pReprise ? "on" : ""); etat("FL-102", F_.pReprise ? "on" : ""); etat("UV-101", P.uv ? "ko" : F_.uv ? "on" : ""); flux("t-rep", F_.pReprise);
    val("BD-101", `drainage ${fmt(F_.drainPct, 0)} %`); etat("BD-101", "on");
    $("#bilan").textContent = `Arrosages du jour : ${F_.arrosages} · apporté ${fmt(F_.vApporte, 0)} L · drainé ${fmt(F_.vDraine, 0)} L · seuil ${fmt(F_.seuil, 0)} J/cm² (ajusté sur le drainage)`;
  },
  kpis(E, fmt) {
    const F_ = E.sys.fruits;
    return [["CE", fmt(F_.ec, 2), "cible 3,0 mS/cm"], ["pH", fmt(F_.ph, 2), "cible 5,8"], ["Drainage", fmt(F_.drainPct, 0) + " %", "cible 20-30 %"], ["Arrosages", F_.arrosages, "aujourd'hui"]];
  },
};

// ------------------------------------------------------------ 4. bassins
const bassins = {
  titre: "Bassins à radeaux du compartiment feuilles",
  svg() {
    const bassin = (id, x, nom) => `
      <rect x="${x}" y="300" width="300" height="140" rx="6" fill="none" stroke="var(--doux)" stroke-width="2"/>
      <rect id="eau-${id}" x="${x + 3}" y="320" width="294" height="117" fill="var(--eau)" opacity=".45"/>
      ${[0, 1, 2, 3, 4].map(k => `<rect x="${x + 10 + k * 57}" y="312" width="52" height="10" fill="#f2f2ee" stroke="#bbb"/><circle cx="${x + 36 + k * 57}" cy="305" r="9" fill="#7fc25a"/>`).join("")}
      <g id="bulles-${id}">${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${x + 30 + k * 48}" cy="425" r="4" fill="#fff" opacity=".8"><animate attributeName="cy" from="430" to="330" dur="${1.4 + (k % 3) * 0.3}s" repeatCount="indefinite"/></circle>`).join("")}</g>
      ${t(x + 150, 470, nom, "grand")}
      ${equip(`OX-${id}`, x + 40, 520, F.capteur("O₂"), "", "", 26)}${equip(`TT-${id}`, x + 110, 520, F.capteur("T"), "", "", 26)}
      ${equip(`CE-${id}`, x + 180, 520, F.capteur("CE"), "", "", 26)}${equip(`PH-${id}`, x + 250, 520, F.capteur("pH"), "", "", 26)}`;
    return svg(`
      ${tuyau("t-air", "M120,140 L120,250 L250,250 L250,430 M120,250 L650,250 L650,430", COUL.air)}
      ${equip("SP-201", 120, 110, F.ventilo("SP-201"), "SP-201 surpresseur", "", -28)}
      ${equip("SP-202", 260, 110, F.ventilo("SP-202"), "SP-202 secours 24 V", "", -28)}
      ${tuyau("t-air2", "M260,140 L260,250", COUL.air)}
      ${bassin("frais", 100, "Bassin frais (laitue, chou, épinard)")}
      ${bassin("tempere", 520, "Bassin tempéré (céleri, aromatiques, amarante)")}
      ${tuyau("t-ch", "M420,330 L460,330 L460,190 L380,190 L380,330", "var(--bleu)")}
      ${equip("CH-201", 420, 190, F.boite(70, 36, "Froid"), "CH-201", "", 34)}
      ${tuyau("t-app", "M900,90 L900,160 L460,160 M760,160 L760,300 M300,160 L300,300", COUL.eau)}
      ${equip("EV-201", 360, 160, F.vanne, "EV-201", "", -16)}${equip("EV-202", 800, 160, F.vanne, "EV-202", "", -16)}
      ${t(905, 80, "eau traitée", "val", "middle")}
    `);
  },
  maj(E, fmt) {
    const B = E.sys.bassins;
    rot("SP-201", B.surpresseur); etat("SP-201", B.surpresseur ? "on" : "ko"); val("SP-201", B.surpresseur ? "80 W" : "EN PANNE");
    rot("SP-202", B.secours); etat("SP-202", B.secours ? "on" : ""); flux("t-air", B.surpresseur || B.secours); flux("t-air2", B.secours);
    for (const n of ["frais", "tempere"]) {
      const b = B[n];
      $("#bulles-" + n).setAttribute("opacity", B.surpresseur ? 1 : B.secours ? 0.5 : 0);
      val(`OX-${n}`, `${fmt(b.o2)} mg/L`); etat(`OX-${n}`, b.o2 < 5 ? "ko" : b.o2 < 6 ? "att" : "on");
      val(`TT-${n}`, `${fmt(b.t)} °C`); etat(`TT-${n}`, n === "frais" && b.t > 22 ? "att" : "on");
      val(`CE-${n}`, `${fmt(b.ec, 2)}`); etat(`CE-${n}`, "on"); val(`PH-${n}`, `${fmt(b.ph, 2)}`); etat(`PH-${n}`, "on");
      const h = 117 * Math.min(1, b.v / 4200);
      $("#eau-" + n).setAttribute("y", 437 - h); $("#eau-" + n).setAttribute("height", h);
    }
    etat("CH-201", B.frais.chiller ? "on" : ""); flux("t-ch", B.frais.chiller); val("CH-201", B.frais.chiller ? "500 W" : "");
    etat("EV-201", B.frais.ev ? "on" : ""); etat("EV-202", B.tempere.ev ? "on" : ""); flux("t-app", B.frais.ev || B.tempere.ev);
  },
  kpis(E, fmt) {
    const B = E.sys.bassins;
    return [["O₂ frais", fmt(B.frais.o2) + " mg/L", "min 6"], ["T frais", fmt(B.frais.t) + " °C", "max 21-22"], ["O₂ tempéré", fmt(B.tempere.o2) + " mg/L", ""], ["CE frais", fmt(B.frais.ec, 2), "cible 1,8"]];
  },
};

// ------------------------------------------------------------ 5. eau
const eau = {
  titre: "Eau : collecte, traitement et distribution",
  svg() {
    return svg(`
      <path d="M40,90 Q160,30 280,90" fill="none" stroke="var(--vert)" stroke-width="4"/>${t(160, 60, "toiture 100 m²", "val")}
      ${tuyau("t-pl", "M280,95 L330,95 L330,180", COUL.eau)}
      ${equip("FF-001", 330, 200, F.filtre, "FF-001", "premier flot", 30)}
      ${tuyau("t-pl2", "M330,220 L330,280", COUL.eau)}
      ${equip("CI-001", 330, 360, F.cuve("CI-001", 130, 140), "CI-001 citerne 10 m³", "", 92)}
      ${tuyau("t-tr", "M395,400 L640,400 L640,330", COUL.eau)}
      ${equip("P-001", 470, 400, F.pompe, "P-001", "", 30)}
      ${equip("F-001", 560, 400, F.filtre, "F-001", "50 µm + charbon", 30)}
      ${equip("T-002", 680, 270, F.cuve("T-002", 90, 100), "T-002 tampon 1 m³", "", 70)}
      ${tuyau("t-fo", "M520,560 L760,560 L760,330", COUL.eau)}
      ${equip("P-002", 520, 560, F.pompe, "P-002 forage", "", 30)}
      ${equip("RO-001", 650, 560, F.boite(80, 36, "Osmose"), "RO-001", "100 L/h", 34)}
      ${tuyau("t-d1", "M725,240 L900,240", COUL.eau)}${t(905, 244, "fruits (EV-102)", "val", "start")}
      ${tuyau("t-d2", "M725,270 L900,270", COUL.eau)}${t(905, 274, "bassins (EV-201/202)", "val", "start")}
      ${tuyau("t-d3", "M725,300 L900,300", COUL.eau)}${t(905, 304, "pad (bac 300 L)", "val", "start")}
      ${t(60, 610, "", "val", "start", "bilan-eau")}
    `);
  },
  maj(E, fmt) {
    const W = E.sys.eau, m = M.meteo(E.mois, E.h), S = E.sys;
    flux("t-pl", m.pluie); flux("t-pl2", m.pluie && W.premierFlot >= 50); etat("FF-001", m.pluie ? "on" : "");
    val("FF-001", m.pluie ? (W.premierFlot < 50 ? "rejette les 50 premiers L" : "laisse passer") : "premier flot");
    niveau("CI-001", W.citerne / 10000); val("CI-001", `${fmt(W.citerne / 1000, 2)} m³`);
    niveau("T-002", W.tampon / 1000); val("T-002", `${fmt(W.tampon, 0)} L`);
    etat("P-001", W.pTransfert ? "on" : ""); etat("F-001", W.pTransfert ? "on" : ""); flux("t-tr", W.pTransfert);
    etat("P-002", W.forage ? "on" : ""); etat("RO-001", W.ro ? "on" : ""); flux("t-fo", W.forage);
    flux("t-d1", S.fruits.remplissage); flux("t-d2", S.bassins.frais.ev || S.bassins.tempere.ev);
    flux("t-d3", E.comp.fruits.mode === "evaporatif" || E.comp.feuilles.mode === "evaporatif");
    $("#bilan-eau").textContent = `Pluie récupérée : ${fmt(W.cumulPluie, 0)} L · transpiration du jour ${fmt(E.eau.transp, 0)} L · pad ${fmt(E.eau.pad, 0)} L`;
  },
  kpis(E, fmt) {
    const W = E.sys.eau;
    return [["Citerne", fmt(W.citerne / 1000, 2) + " m³", "sur 10"], ["Tampon", fmt(W.tampon, 0) + " L", "sur 1 000"], ["Source", W.forage ? "forage" : W.pTransfert ? "pluie" : "repos", ""]];
  },
};

// ------------------------------------------------------------ 6. électricité (unifilaire)
const LIGNES_ELEC = [
  ["Automates, réseau, capteurs (P0)", "Q1", 0], ["Surpresseur bassins (P0)", "Q2", 0], ["Surpresseur secours 24 V (P0)", "Q2b", 0],
  ["Pompe irrigation P-101 (P1)", "Q3", 1], ["Reprise drainage + UV (P1)", "Q4", 1], ["Brassage (P1)", "Q5", 1], ["Aérothermes stockage (P1)", "Q5b", 1], ["Pompe de transfert P-001 (P1)", "Q6", 1],
  ["Extracteurs (P2)", "Q7", 2], ["Pompe du pad (P2)", "Q8", 2], ["Refroidisseur CH-201 (P2)", "Q8b", 2], ["Chambre froide (P2)", "Q9", 2],
  ["LED de germination (P3)", "Q10", 3], ["Osmoseur RO-001 (P3)", "Q11", 3],
];
const electricite = {
  titre: "Électricité : schéma unifilaire animé",
  svg() {
    let lignes = "";
    LIGNES_ELEC.forEach(([nom, q, prio], k) => {
      const y = 60 + k * 38, xBus = [600, 640, 680, 720][prio];
      lignes += `${fil("w-" + q, `M${xBus},${y} L960,${y}`)}<rect x="770" y="${y - 9}" width="18" height="18" rx="3" fill="var(--carte)" stroke="var(--doux)"/>
        ${t(779, y + 4, q.replace("b", ""), "val")}${t(800, y - 4, nom.replace(/ \(P\d\)/, ""), "val", "start")}${t(800, y + 11, "", "tag", "start", "p-" + q)}`;
    });
    return svg(`
      ${equip("PV", 90, 70, F.boite(120, 40, "6 x 550 Wc"), "Champ solaire", "", 36)}
      ${fil("w-pv", "M150,70 L230,70 L230,200 L290,200")}
      ${equip("Q-DC", 230, 130, F.contact, "Q-DC", "", 26)}
      ${equip("SNEL", 90, 230, F.boite(120, 40, "SNEL"), "Réseau 230 V", "", 36)}
      ${fil("w-snel", "M150,230 L290,230")}
      ${equip("GE", 90, 330, F.boite(120, 40, "Groupe"), "Groupe 5 kVA", "", 36)}
      ${fil("w-ge", "M150,330 L250,330 L250,250 L290,250")}
      ${equip("OND", 360, 230, F.boite(140, 100, "Onduleur"), "OND-1 hybride 5 kW", "", 66)}
      ${equip("BAT", 360, 440, F.cuve("BAT", 120, 70), "BAT-1 LiFePO4 10,2 kWh", "", 52)}
      ${fil("w-bat", "M360,280 L360,405")}
      ${fil("w-ac", "M430,230 L560,230")}
      ${equip("QG", 520, 230, F.contact, "QG + ID 30 mA", "", 28)}
      <line x1="600" y1="40" x2="600" y2="${60 + 13 * 38 + 10}" stroke="var(--jaune)" stroke-width="4"/>
      ${fil("w-k1", "M560,230 L640,230")}${fil("w-k2", "M600,300 L680,300")}${fil("w-k3", "M600,360 L720,360")}
      ${equip("KM1", 620, 205, F.contact, "KM1", "", -18)}${equip("KM2", 660, 282, F.contact, "KM2", "", -18)}${equip("KM3", 700, 340, F.contact, "KM3", "", -18)}
      <line id="bus1" x1="640" y1="170" x2="640" y2="340" stroke="var(--jaune)" stroke-width="3"/>
      <line id="bus2" x1="680" y1="360" x2="680" y2="500" stroke="var(--jaune)" stroke-width="3"/>
      <line id="bus3" x1="720" y1="500" x2="720" y2="580" stroke="var(--jaune)" stroke-width="3"/>
      ${lignes}
      ${t(40, 600, "", "val", "start", "bilan-elec")}
    `, 620);
  },
  maj(E, fmt) {
    const S = E.sys, ch = S.elec.charges;
    flux("w-pv", E.pv > 50); val("PV", `${fmt(E.pv, 0)} W`); etat("PV", E.pv > 50 ? "on" : "");
    flux("w-snel", E.reseau); etat("SNEL", E.reseau ? "on" : "ko"); val("SNEL", E.reseau ? "présent" : "coupé");
    flux("w-ge", E.groupe); etat("GE", E.groupe ? "on" : ""); val("GE", E.groupe ? "en marche" : "arrêté");
    etat("OND", "on"); val("OND", `${fmt(S.elec.total, 0)} W · ${fmt(S.elec.courant, 1)} A`);
    niveau("BAT", E.soc / 100); val("BAT", `${fmt(E.soc, 0)} %`); flux("w-bat", true);
    flux("w-ac", S.elec.total > 0); etat("QG", "on");
    for (const [k, b] of [["km1", "bus1"], ["km2", "bus2"], ["km3", "bus3"]]) {
      etat(k.toUpperCase(), S.elec[k] ? "on" : "ko");
      document.getElementById(b).setAttribute("opacity", S.elec[k] ? 1 : 0.2);
      flux("w-" + k.replace("km", "k"), S.elec[k]);
      const g = document.querySelector(`#e-${k.toUpperCase()} #lame`);
      if (g) g.setAttribute("d", S.elec[k] ? "M-8,0 L8,0" : "M-8,6 L8,-6");
    }
    LIGNES_ELEC.forEach(([nom, q]) => {
      const p = ch[nom] || 0;
      flux("w-" + q, p > 0);
      const e = document.getElementById("p-" + q);
      if (e) e.textContent = p > 0 ? `${fmt(p, 0)} W · ${fmt(p / 230, 2)} A` : "arrêt";
    });
    $("#bilan-elec").textContent = `Production ${fmt(E.pv, 0)} W · consommation ${fmt(S.elec.total, 0)} W · ${E.reseau ? "réseau en appoint" : "sans réseau"}${E.groupe ? " · groupe en marche" : ""}`;
  },
  kpis(E, fmt) {
    const S = E.sys;
    return [["Solaire", fmt(E.pv / 1000, 2) + " kW", ""], ["Charge", fmt(S.elec.total / 1000, 2) + " kW", fmt(S.elec.courant, 1) + " A sous 230 V"], ["Batterie", fmt(E.soc, 0) + " %", ""],
      ["Délestage", [S.elec.km1, S.elec.km2, S.elec.km3].filter(x => !x).length + " groupe(s)", ""]];
  },
};

// ------------------------------------------------------------ 7. électronique et IIoT
// positions sur la carte CAZ-1 (mm, origine en haut à gauche, carte 150 x 110)
const LED_SORTIES = [0, 1, 2, 3, 4, 5].map(i => [18 + 22 * i + 0.5, 46]);
const LED_ENTREES = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [54 + 6 * i + 2.6, 96]);
const LED_ETAT = [[122, 67], [125, 67], [128, 67], [131, 67]];
const iiot = {
  titre: "Électronique et IIoT : bus, automates, serveur et carte CAZ-1 en direct",
  svg() {
    const capteurs = [["TH-F1", "@1"], ["CO2-F1", "@2"], ["EC-F1", "@3"], ["PH-F1", "@4"], ["TS-F1", "@5"]];
    return svg(`
      ${fil("bus-f", "M60,90 L430,90", COUL.data)}
      ${capteurs.map(([c, a], k) => `${equip(c, 80 + k * 72, 60, F.capteur(a), c, "", -22)}<line x1="${80 + k * 72}" y1="73" x2="${80 + k * 72}" y2="90" stroke="var(--violet)"/>`).join("")}
      ${t(240, 115, "bus RS485 Modbus RTU 9600 bauds (compartiment fruits)", "val")}
      ${equip("AUT-F", 480, 90, F.boite(90, 44, "AUT-F"), "", "", 38)}
      ${equip("AUT-L", 480, 190, F.boite(90, 44, "AUT-L"), "", "", 38)}
      ${equip("AUT-E", 480, 290, F.boite(90, 44, "AUT-E"), "", "", 38)}
      ${fil("eth", "M525,90 L600,90 L600,290 L525,290 M525,190 L600,190 M600,190 L680,190", COUL.data)}
      ${equip("SW-1", 680, 190, F.boite(70, 34, "Switch"), "", "", 30)}
      ${fil("eth2", "M715,190 L790,190", COUL.data)}
      ${equip("SRV", 860, 190, F.boite(130, 60, "Serveur"), "MQTT · régulation · base", "", 46)}
      ${fil("g4", "M860,160 L860,95", COUL.data)}
      ${equip("4G", 860, 70, F.boite(90, 34, "Routeur 4G"), "", "", -24)}
      <foreignObject x="40" y="340" width="420" height="270"><div xmlns="http://www.w3.org/1999/xhtml" id="mqtt" style="font:11px ui-monospace,monospace;overflow:hidden;height:270px"></div></foreignObject>
      <g transform="translate(480,345)">
        <image href="lib/caz1_dessus.png" x="0" y="0" width="490" height="${490 * 110 / 150}" preserveAspectRatio="none"/>
        ${LED_SORTIES.map(([x, y], k) => `<circle id="ls${k}" cx="${x * 490 / 150}" cy="${y * 490 / 150}" r="6" fill="#ffd200" opacity="0"/>`).join("")}
        ${LED_ENTREES.map(([x, y], k) => `<circle id="le${k}" cx="${x * 490 / 150}" cy="${y * 490 / 150}" r="5" fill="#39e66b" opacity="0"/>`).join("")}
        ${LED_ETAT.map(([x, y], k) => `<circle id="lt${k}" cx="${x * 490 / 150}" cy="${y * 490 / 150}" r="5" fill="${["#39e66b", "#3d8bff", "#ffd200", "#ff4a3d"][k]}" opacity="0"/>`).join("")}
        ${t(245, 375, "Carte CAZ-1 de l'automate AUT-F : voyants des 6 relais, des 8 entrées et d'état", "val")}
      </g>
    `, 740);
  },
  maj(E, fmt) {
    const S = E.sys, f = E.comp.fruits;
    flux("bus-f", true); flux("eth", true); flux("eth2", !S.pannes.serveur); flux("g4", true);
    for (const a of ["AUT-F", "AUT-L", "AUT-E"]) { etat(a, S.iiot.autonome[a] ? "att" : "on"); val(a, S.iiot.autonome[a] ? "MODE AUTONOME" : "mode normal"); }
    etat("SRV", S.pannes.serveur ? "ko" : "on"); val("SRV", S.pannes.serveur ? "ARRÊTÉ" : "en service");
    etat("SW-1", "on"); etat("4G", "on"); val("4G", S.iiot.sms.length ? `SMS : ${S.iiot.sms[0].slice(0, 28)}…` : "");
    for (const c of ["TH-F1", "CO2-F1", "EC-F1", "PH-F1", "TS-F1"]) etat(c, (c === "TH-F1" && S.pannes.capteurTH) || (c === "PH-F1" && S.pannes.sondePh) ? "ko" : "on");
    // relais de la carte AUT-F : K1 ouvrir, K2 fermer, K3 écran, K4 pompe du pad, K5 extracteur V1, K6 extracteur V2
    const ouv = f.cmd.ouvrant, rel = [ouv > (E._ouvPrec ?? 0) + 0.5, ouv < (E._ouvPrec ?? 0) - 0.5, f.cmd.ecran > 0, f.cmd.pad, f.cmd.ext >= 1, f.cmd.ext >= 2];
    E._ouvPrec = ouv;
    rel.forEach((on, k) => document.getElementById("ls" + k)?.setAttribute("opacity", on ? 1 : 0));
    // entrées : fins de course ouvert/fermé, écran ouvert/fermé, anémomètre, porte du sas, défaut extracteur, niveau bas du pad
    const m = M.meteo(E.mois, E.h);
    const ent = [ouv >= 99, ouv <= 1, f.cmd.ecran <= 1, f.cmd.ecran >= 99, (S.pannes.vent ? 16 : m.vent) >= 14, Math.sin(S.t / 900) > 0.97, false, false];
    ent.forEach((on, k) => document.getElementById("le" + k)?.setAttribute("opacity", on ? 1 : 0));
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    [true, blink, S.iiot.autonome["AUT-F"], Object.keys(S.alarmes).length > 0].forEach((on, k) => document.getElementById("lt" + k)?.setAttribute("opacity", on ? 1 : 0));
    const box = document.getElementById("mqtt");
    if (box) box.innerHTML = `<b style="font-family:system-ui">Messages MQTT récents</b><br>` + S.iiot.messages.slice(0, 14).map(mm => {
      const h = Math.floor(mm.t), mi = Math.floor((mm.t - h) * 60);
      return `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="opacity:.6">${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")} ${mm.de}→${mm.vers}</span> ${mm.sujet.replace("serre/lub1/", "")} <span style="color:var(--violet)">${mm.contenu}</span></div>`;
    }).join("");
  },
  kpis(E) {
    const S = E.sys;
    return [["Serveur", S.pannes.serveur ? "arrêté" : "en service", ""], ["Automates", Object.values(S.iiot.autonome).filter(Boolean).length ? "autonomes" : "normaux", ""], ["Messages", S.iiot.messages.length, "récents"], ["SMS envoyés", S.iiot.sms.length, ""]];
  },
};

// ------------------------------------------------------------ 8. cultures
const cultures = {
  titre: "Conditions vécues par chaque culture, en direct",
  svg() {
    return `<div id="tab-cultures"></div>`;
  },
  maj(E, fmt) {
    const lignes = Object.keys(SYS.CULTURES).map(k => SYS.aptitude(E, k));
    const coul = s => s >= 80 ? "var(--vert)" : s >= 50 ? "var(--orange)" : "var(--rouge)";
    document.getElementById("tab-cultures").innerHTML = `<table><thead><tr><th>Culture</th><th style="width:30%">Conditions</th><th>Facteur limitant</th><th>Détail</th></tr></thead><tbody>${lignes.map(r => `
      <tr><td><b>${r.nom}</b></td><td><div class="jauge"><span style="width:${r.score}%;background:${coul(r.score)}"></span></div><span class="sous">${r.score} / 100</span></td>
      <td>${r.limitant ? `${r.limitant[0]} : ${r.limitant[2]}` : "aucun : conditions favorables"}</td>
      <td class="sous">${r.facteurs.map(f => `${f[0]} ${Math.round(f[1] * 100)}`).join(" · ")}</td></tr>`).join("")}</tbody></table>
      <p class="sous">Score = facteur le plus défavorable (loi du minimum) parmi température, DPV, température et CE de la solution, pH et oxygène. 100 = toutes les conditions dans la plage optimale de la recette.</p>`;
  },
  kpis(E) {
    const lignes = Object.keys(SYS.CULTURES).map(k => SYS.aptitude(E, k));
    const fav = lignes.filter(r => r.score >= 80).length;
    return [["Favorables", `${fav} / ${lignes.length}`, "score ≥ 80"], ["Plus faible", lignes.reduce((a, b) => (b.score < a.score ? b : a)).nom, ""]];
  },
};


// ------------------------------------------------------------ 8 bis. aquaculture (pilote)
const aquaculture = {
  titre: "Aquaculture : pilote de 2 bacs de Clarias couplé au bassin tempéré (planche H04)",
  svg() {
    const bac = (id, x) => `
      <circle cx="${x}" cy="170" r="78" fill="none" stroke="var(--doux)" stroke-width="2"/>
      <circle id="eau-${id}" cx="${x}" cy="170" r="74" fill="var(--eau)" opacity=".45"/>
      <g id="poissons-${id}">${[0, 1, 2, 3, 4].map(k => `<g transform="translate(${x - 40 + k * 20},${150 + (k % 2) * 30})"><path d="M-12,0 Q0,-7 12,0 Q0,7 -12,0 Z M12,0 L18,-5 L18,5 Z" fill="#6b6b5a" opacity=".85"><animateTransform attributeName="transform" type="translate" values="0,0;${k % 2 ? 6 : -6},${k % 2 ? -3 : 3};0,0" dur="${2 + k * 0.4}s" repeatCount="indefinite"/></path></g>`).join("")}</g>
      <g id="bulles-${id}">${[0, 1, 2, 3].map(k => `<circle cx="${x - 30 + k * 20}" cy="230" r="3.5" fill="#fff" opacity=".8"><animate attributeName="cy" from="235" to="110" dur="${1.3 + k * 0.25}s" repeatCount="indefinite"/></circle>`).join("")}</g>
      ${t(x, 268, id === "b1" ? "B-401 · 3 m³" : "B-402 · 3 m³", "tag")}`;
    return svg(`
      ${bac("b1", 120)}${bac("b2", 300)}
      ${tuyau("t-sortie", "M120,248 L120,300 L300,300 L300,248 M300,300 L430,300", COUL.drain)}
      ${equip("DR-401", 470, 300, F.cuve("dr", 60, 80), "DR-401", "décanteur", 58)}
      ${tuyau("t-bf", "M500,300 L560,300", COUL.eau)}
      ${equip("BF-401", 600, 300, F.cuve("bf", 70, 90), "BF-401", "biofiltre", 62)}
      ${tuyau("t-rep", "M635,300 L700,300", COUL.eau)}
      ${equip("T-401", 740, 300, F.cuve("rep", 70, 80), "T-401", "reprise", 58)}
      ${tuyau("t-retour", "M740,260 L740,60 L120,60 L120,95 M300,60 L300,95", COUL.eau)}
      ${t(430, 52, "retour gravitaire vers les bacs (air-lift)", "val")}
      ${tuyau("t-air", "M120,470 L120,420 L300,420 L300,250 M120,420 L120,250 M300,420 L600,420 L600,345", COUL.air)}
      ${equip("SB-401", 120, 500, F.ventilo("SB-401"), "SB-401 soufflante", "", 34)}
      ${tuyau("t-transf", "M775,320 L830,320 L830,430", COUL.eau)}
      ${equip("P-403", 830, 450, F.pompe, "P-403", "", 34)}
      ${tuyau("t-transf2", "M846,450 L900,450 L900,520 L960,520", COUL.eau)}
      ${equip("UV-401", 900, 490, F.uv, "UV-401", "", -20)}
      ${t(960, 545, "vers le bassin", "val", "end")}${t(960, 559, "tempéré (H03)", "val", "end")}
      ${tuyau("t-app", "M950,250 L800,250 L800,280", COUL.eau)}
      ${equip("EV-402", 880, 250, F.vanne, "EV-402", "", -16)}
      ${t(955, 272, "eau traitée", "val", "end")}
      ${equip("P-401", 690, 410, F.boite(56, 30, "KOH"), "P-401 potasse", "", 32)}
      ${tuyau("t-k", "M690,395 L690,340 L705,340", COUL.sol)}
      ${equip("RC-401", 210, 360, F.boite(76, 30, "1 kW"), "RC-401 chauffage", "", 32)}
      ${equip("OX-aq", 420, 160, F.capteur("O₂"), "", "", 26)}${equip("TT-aq", 480, 160, F.capteur("T"), "", "", 26)}
      ${equip("NO-aq", 540, 160, F.capteur("NO₃"), "", "", 26)}${equip("PH-aq", 600, 160, F.capteur("pH"), "", "", 26)}
      ${t(510, 120, "Mesures des bacs", "grand")}
      ${t(400, 590, "Nitrate et ammoniaque : trousse deux fois par semaine sur site ; ici, valeurs calculées par le simulateur.", "val", "start")}
    `);
  },
  maj(E, fmt) {
    const A = E.sys.aqua;
    rot("SB-401", A.souffl); etat("SB-401", A.souffl ? "on" : "ko"); val("SB-401", A.souffl ? "60 W" : "ARRÊTÉE");
    flux("t-air", A.souffl); flux("t-retour", A.souffl, true); flux("t-sortie", A.souffl, true); flux("t-bf", A.souffl, true); flux("t-rep", A.souffl, true);
    for (const b of ["b1", "b2"]) {
      document.getElementById("bulles-" + b).setAttribute("opacity", A.souffl ? 1 : 0);
      document.getElementById("poissons-" + b).setAttribute("transform", A.surface ? "translate(0,-55)" : "");
    }
    etat("OX-aq", A.o2 < 3 ? "ko" : A.o2 < 5 ? "att" : "on"); val("OX-aq", `${fmt(A.o2)} mg/L`);
    etat("TT-aq", A.t < 24 || A.t > 31 ? "att" : "on"); val("TT-aq", `${fmt(A.t)} °C`);
    etat("NO-aq", A.no3 > 150 ? "att" : "on"); val("NO-aq", `${fmt(A.no3, 0)} mg/L`);
    etat("PH-aq", "on"); val("PH-aq", fmt(A.ph, 2));
    etat("P-403", A.transfert ? "on" : "ko"); flux("t-transf", A.transfert, true); flux("t-transf2", A.transfert, true);
    etat("UV-401", A.uv ? "on" : "ko"); val("UV-401", A.uv ? "" : "HORS SERVICE");
    etat("EV-402", A.appoint ? "on" : ""); flux("t-app", A.appoint);
    etat("P-401", A.dosK ? "on" : ""); flux("t-k", A.dosK);
    etat("RC-401", A.chauffe ? "on" : ""); val("RC-401", A.chauffe ? "en marche" : "");
    etat("DR-401", "on"); etat("BF-401", A.tan > 1 ? "att" : "on"); etat("T-401", "on");
    niveau("rep", A.v / 6000); niveau("dr", 0.85); niveau("bf", 0.9);
  },
  kpis(E, fmt) {
    const A = E.sys.aqua;
    return [["Oxygène", fmt(A.o2) + " mg/L", "> 5 ; alarme < 3"], ["Eau", fmt(A.t) + " °C", "26-28"],
      ["Clarias", `${A.effectif} x ${fmt(1000 * A.biomasse / A.effectif, 0)} g`, `${fmt(A.biomasse, 0)} kg, lot ${A.lot}`],
      ["Nitrate", fmt(A.no3, 0) + " mg/L", "cible 50-150"], ["Envoyé aux cultures", fmt(A.vEnvoye, 0) + " L", `${fmt(A.nEnvoye * 1000, 0)} g d'azote`],
      ["Aliment distribué", fmt(A.nourri, 1) + " kg", "depuis le départ"]];
  },
};

export const SCHEMAS = { ensemble, climat, fertirrigation, bassins, eau, electricite, iiot, aquaculture, cultures };

// ------------------------------------------------------------ fiches des équipements
export const FICHES = {
  "EV-102": ["Électrovanne de remplissage", "24 V DC, normalement fermée. S'ouvre quand la cuve de solution descend sous 40 %, se ferme à 90 %."],
  "CU-101": ["Cuve de solution fruits", "500 L, PE opaque couverte. Sondes CE, pH, température et niveau. Mélange par recirculation."],
  "P-103": ["Pompe doseuse A", "Péristaltique 24 V, 0-10 L/h. Doses de 20 mL, au plus 5 par cycle, 5 min de mélange entre deux corrections."],
  "P-104": ["Pompe doseuse B", "Idem, solution mère B (sulfates, phosphate, oligoéléments)."],
  "P-105": ["Pompe doseuse acide", "Doses de 5 mL. Suspendue si la mesure de pH est incohérente."],
  "CE-101": ["Sonde de conductivité", "4 électrodes, compensée en température, Modbus. Contrôle hebdomadaire au conductimètre de poche."],
  "PH-101": ["Sonde de pH", "Électrode industrielle gel, étalonnage toutes les 2 semaines, remplacement 12 à 18 mois."],
  "TT-101": ["Température de solution", "PT1000 inox."],
  "P-101": ["Pompe d'irrigation", "0,37 kW, 2 m³/h sous 2,5 bar. Démarre à chaque somme de rayonnement atteinte ; 150 mL par goutteur."],
  "FI-101": ["Filtre à disques", "120 mesh, protège les goutteurs. Nettoyage hebdomadaire."],
  "EV-101": ["Électrovanne d'arrosage", "Ouvre la rampe pendant l'arrosage."],
  "BD-101": ["Balance de drainage", "Auget basculeur de 5 mL sur une gouttière témoin : mesure du drainage, indicateur clé de l'irrigation."],
  "CU-102": ["Cuve de drainage", "200 L. Reprise automatique au-dessus de 120 L."],
  "P-102": ["Pompe de reprise", "0,12 kW. Renvoie le drainage vers la cuve de solution à travers le filtre et l'UV."],
  "FL-102": ["Préfiltre 50 µm", "Indispensable avant l'UV : une eau trouble arrête les rayons."],
  "UV-101": ["Stérilisateur UV-C", "1 m³/h, dose ≥ 250 mJ/cm² : Pythium, Fusarium, bactéries. Lampe à remplacer chaque année."],
  "SP-201": ["Surpresseur d'aération", "80 W, charge prioritaire 0 : jamais délestée. Diffuseurs poreux au fond des bassins."],
  "SP-202": ["Surpresseur de secours", "24 V DC sur l'alimentation secourue. Démarre seul si le principal s'arrête."],
  "CH-201": ["Refroidisseur de solution", "Pompe à chaleur eau 500 W. Bassin frais maintenu sous 20,5 °C, de jour, sur l'énergie solaire."],
  "EV-201": ["Appoint bassin frais", "Compense l'eau transpirée par les plantes."],
  "EV-202": ["Appoint bassin tempéré", "Idem."],
  "FF-001": ["Dispositif de premier flot", "Rejette les 50 premiers litres de chaque pluie, qui lavent la poussière du toit."],
  "CI-001": ["Citerne d'eau de pluie", "10 m³, opaque. Couvre 35 à 45 % des besoins annuels."],
  "P-001": ["Pompe de transfert", "1,5 m³/h. Remplit le tampon depuis la citerne."],
  "F-001": ["Filtration", "Sédiments 50 µm puis charbon actif."],
  "T-002": ["Réservoir tampon", "1 m³ d'eau traitée qui alimente les deux circuits et le pad."],
  "P-002": ["Pompe du forage", "Complément de saison sèche."],
  "RO-001": ["Osmoseur", "100 L/h, si l'analyse révèle des métaux, du sodium ou une eau trop dure."],
  "PV": ["Champ photovoltaïque", "6 modules de 550 Wc en série, Voc ≈ 300 V, orientés au nord à 12°."],
  "Q-DC": ["Sectionneur DC", "Interrupteur-sectionneur 600 V + parafoudre type 2."],
  "SNEL": ["Réseau SNEL", "Appoint : recharge les batteries quand il est présent."],
  "GE": ["Groupe électrogène", "Démarre automatiquement si la batterie descend sous 15 % sans réseau ni soleil."],
  "OND": ["Onduleur hybride", "5 kW (8 kW en configuration complète), deux MPPT, entrées réseau et groupe, Modbus vers AUT-E."],
  "BAT": ["Batterie LiFePO4", "2 x 5,12 kWh en 48 V, 6 000 cycles, BMS communicant."],
  "QG": ["Disjoncteur général et différentiel", "32 A, différentiel 30 mA type A sur tous les départs."],
  "KM1": ["Contacteur de délestage priorité 1", "Fermé si batterie ≥ 20 % ou réseau présent."],
  "KM2": ["Contacteur de délestage priorité 2", "Fermé si batterie ≥ 35 % ou réseau présent."],
  "KM3": ["Contacteur de délestage priorité 3", "Fermé si batterie ≥ 55 % ou réseau présent."],
  "AUT-F": ["Automate de zone fruits", "Carte CAZ-1 : ESP32, Ethernet, RS485, 8 entrées isolées, 6 relais. Mode autonome si le serveur se tait 2 min."],
  "AUT-L": ["Automate de zone feuilles", "Carte CAZ-1. Le surpresseur est câblé sur contact à ouverture : il tourne même si la carte s'arrête."],
  "AUT-E": ["Automate eau et énergie", "Carte CAZ-1 : citerne, tampon, osmoseur, onduleur, délestage, groupe, sas, station météo."],
  "SRV": ["Serveur local", "Mosquitto, régulation Python, InfluxDB, Grafana, interface. Fonctionne sans internet."],
  "SW-1": ["Commutateur PoE", "Relie automates, serveur, caméras."],
  "4G": ["Routeur 4G double SIM", "SMS d'alarme, synchronisation distante quand le réseau le permet."],
  "TH-F1": ["Température et humidité", "Capteur capacitif sous abri ventilé, adresse Modbus 1."],
  "CO2-F1": ["CO₂", "NDIR double faisceau, adresse 2."],
  "EC-F1": ["Conductivité", "Adresse 3."],
  "PH-F1": ["pH", "Adresse 4."],
  "TS-F1": ["Température de solution", "Adresse 5."],
  "CU-401": ["Stockage thermique", "3 cuves de 2 m³ : chaleur du jour restituée la nuit."],
  "AE-101": ["Aérotherme", "Batterie eau/air + ventilateur : charge le jour, restitue la nuit."],
  "VB-101": ["Brassage fruits", "45 W, homogénéise l'air."],
  "VB-201": ["Brassage feuilles", "45 W."],
  "TH-L1": ["T/HR feuilles", "Capteur sous abri ventilé."],
  "MET-EXT": ["Station météo", "Vent, pluie, T/HR, rayonnement : commande les sécurités."],
  "P-301": ["Murs évaporatifs", "Cellulose 100 mm, 2 x 7,5 m² ; air refroidi de 8 à 10 °C par temps sec."],
  "EX-101": ["Extracteur fruits", "Ø 1,25 m, 0,55 kW, deux vitesses."],
  "EX-102": ["Extracteur feuilles", "Ø 1,25 m, 0,55 kW, deux vitesses."],
  "VO-101": ["Ouvrant de toiture fruits", "10 x 1 m, motorisé, filet 50 mesh."],
  "VO-201": ["Ouvrant de toiture feuilles", "Idem."],
  "VL-101": ["Ouvrant latéral nord", "10 x 1,5 m, enrouleur motorisé."],
  "VL-201": ["Ouvrant latéral sud", "Idem."],
  "SB-401": ["Soufflante des bacs à poissons", "Aération et relevage de l'eau par air-lift. Charge prioritaire 0 : jamais délestée. En tranche 2, une seconde soufflante démarre seule en secours."],
  "DR-401": ["Décanteur", "Retire les matières en suspension (fèces, restes d'aliment) ; purge vers le minéralisateur deux fois par jour."],
  "BF-401": ["Biofiltre à lit mobile", "Les bactéries fixées sur le média transforment l'ammoniaque, toxique, en nitrate, que les plantes absorbent."],
  "T-401": ["Bassin de reprise", "Point de prélèvement de l'eau envoyée aux cultures, de l'appoint et du dosage de potasse."],
  "P-403": ["Pompe vers les cultures", "Envoie 5 % du volume des bacs par jour (10 % si le nitrate dépasse 120 mg/L). Ne démarre que si l'UV est en service."],
  "UV-401": ["Stérilisateur UV de l'eau des poissons", "Désinfecte l'eau avant qu'elle rejoigne les cultures ; en défaut, l'envoi s'arrête."],
  "EV-402": ["Appoint des bacs", "Eau traitée depuis le réservoir tampon, quand le volume baisse."],
  "P-401": ["Dosage de potasse", "Remonte le pH des bacs (la nitrification l'acidifie) et apporte le potassium qui manque aux plantes."],
  "RC-401": ["Chauffage des bacs", "Thermoplongeur de 1 kW sur thermostat 26-27 °C, bacs couverts et isolés. En tranche 2 : chauffe-eau solaire et pompe à chaleur."],
};
