/*
 * Modèle paramétrique des trois meubles.
 * Toutes les cotes sont en millimètres.
 * Repère : x = largeur (gauche -> droite vu de face), y = profondeur (0 = face avant, vers le mur),
 *          z = hauteur (0 = sol, ou dessous du meuble pour l'étagère murale).
 *
 * Ce fichier est la seule source des dimensions : la simulation 3D, les plans, la liste de débit
 * et la notice sont tous recalculés à partir de lui. Pour modifier une cote, on la modifie ici
 * puis on relance  node outils/construire.js
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Sections et matières                                               */
  /* ------------------------------------------------------------------ */
  const SECTIONS = {
    T20: { nom: 'Tube carré 20×20×1,5', type: 'carre', a: 20, t: 1.5, barre: 6000 },
    T25: { nom: 'Tube carré 25×25×1,5', type: 'carre', a: 25, t: 1.5, barre: 6000 },
    R25: { nom: 'Tube rond Ø25×1,5 (inox ou chromé)', type: 'rond', d: 25, t: 1.5, barre: 3000 },
    R20: { nom: 'Tube rond Ø20×1,2 (tringle à rideau)', type: 'rond', d: 20, t: 1.2, barre: 3000 },
    RP6: { nom: 'Rond plein Ø6', type: 'plein', d: 6, barre: 3000 },
    P20x3: { nom: 'Plat 20×3', type: 'plat', b: 20, e: 3, barre: 6000 },
    P25x3: { nom: 'Plat 25×3', type: 'plat', b: 25, e: 3, barre: 6000 },
    P25x4: { nom: 'Plat 25×4', type: 'plat', b: 25, e: 4, barre: 6000 },
    P30x3: { nom: 'Plat 30×3', type: 'plat', b: 30, e: 3, barre: 6000 },
    P30x4: { nom: 'Plat 30×4', type: 'plat', b: 30, e: 4, barre: 6000 },
    P40x4: { nom: 'Cornière 40×40×4', type: 'corniere', b: 40, e: 4, barre: 6000 }
  };

  const COUL = {
    acierA: '#3c434b', acierB: '#2b2e33', acierC: '#3c434b',
    platine: '#8d959e', cp15: '#dcbc8c', cp18: '#d2a873', cp5: '#e3c9a0',
    inox: '#c3cad0', galva: '#aeb6bd', alu: '#d5d9dd',
    rideau: '#7d9a8c', mur: '#ece8e1', sol1: '#d9d4cb', sol2: '#cfc9be',
    verin: '#222222', noir: '#1d1f22'
  };

  /* Hypothèses sur les appareils et objets rangés (à vérifier sur les modèles réels) */
  const HYP = {
    bouteille: { d: 250, hCorps: 310, hCol: 60, masse: 12, txt: 'Bouteille de gaz 5 kg : Ø 250 mm, hauteur 370 mm col compris, environ 12 kg pleine' },
    bruleur: { h: 85, dSupport: 330, txt: 'Brûleur sur bouteille + support de casserole aluminium : +85 mm au-dessus du col, support Ø 330 mm' },
    induction: { L: 290, P: 360, H: 65, w: 2000, txt: 'Plaque induction BOMA monoplace : 290 × 360 × 65 mm, 2000 W' },
    rechaud: { L: 270, P: 260, H: 85, foyer: 185, w: 1500, txt: 'Réchaud électrique monoplace : 270 × 260 × 85 mm, foyer fonte Ø 185, 1000 à 1500 W' },
    casserole: { d: 280, txt: 'Casserole / marmite maximale : Ø 280 × 180 mm' },
    assiette: { d: 265, txt: 'Assiettes plates : Ø 265 mm maximum' },
    bouteilles: { d: 90, h: 330, txt: 'Bouteilles 1,5 L : Ø 90 × 330 mm ; huile 1 L : Ø 80 × 300 mm' },
    verres: { txt: 'Verre à eau Ø 75 × 120 ; verre à bière Ø 80 × 200 ; verre à whisky Ø 82 × 95 ; tasse Ø 85 × 95 ; gobelet Ø 75 × 110 (mm)' }
  };

  /* ------------------------------------------------------------------ */
  /*  Outils de construction                                             */
  /* ------------------------------------------------------------------ */
  function box(x, y, z, dx, dy, dz) { return { t: 'box', x, y, z, dx, dy, dz }; }
  function cyl(ax, x, y, z, r, h, n) { return { t: 'cyl', ax, x, y, z, r, h, n: n || 20 }; }

  function Constructeur(code, opts) {
    this.code = code;
    this.parts = [];
    this.cur = { etape: 0, module: 0 };
    this.typesCadre = [];
    this.quinc = {};
    this.coulAcier = opts.coulAcier;
    this.notesUsinage = [];
  }
  Constructeur.prototype.set = function (o) { Object.assign(this.cur, o); return this; };
  Constructeur.prototype.add = function (p) {
    if (p.etape === undefined) p.etape = this.cur.etape;
    if (p.module === undefined) p.module = this.cur.module;
    if (!p.formes) p.formes = [p.forme];
    delete p.forme;
    this.parts.push(p);
    return p;
  };
  Constructeur.prototype.q = function (cle, n, designation, usage) {
    if (!this.quinc[cle]) this.quinc[cle] = { cle, designation, qte: 0, usages: [] };
    this.quinc[cle].qte += n;
    if (usage && this.quinc[cle].usages.indexOf(usage) < 0) this.quinc[cle].usages.push(usage);
  };

  /* Type de cadre soudé (échelle) : deux montants + traverses de profondeur.
     Les cadres sont percés et sertis sur leurs DEUX faces latérales : un même cadre se monte
     indifféremment à gauche ou à droite d'un module. */
  Constructeur.prototype.typeCadre = function (code, d) {
    const ft = Object.assign({ code, inst: 0, trous: { av: {}, ar: {} }, traversants: {}, faceAvant: {} }, d);
    this.typesCadre.push(ft);
    return ft;
  };
  function ajTrou(ft, cote, z, filet, usage) {
    const k = String(Math.round(z * 10) / 10);
    ft.trous[cote][k] = { z, filet, usage };
  }

  Constructeur.prototype.cadre = function (ft, x, z0, mod) {
    const S = SECTIONS[ft.sec], a = S.a, D = ft.D;
    ft.inst++;
    const sousEns = ft.nom;
    const inst = { ft, x, z0, a, D, mod };
    // montants
    inst.mAv = this.add({
      nom: 'Montant avant', cat: 'tube', sousEns, couleur: this.coulAcier,
      debit: { sec: ft.sec, L: ft.Hf, coupe: '90° / 90°', _ft: ft, _cote: 'av' },
      forme: box(x, 0, z0, a, a, ft.Hf), module: mod
    });
    inst.mAr = this.add({
      nom: ft.Hb > ft.Hf ? 'Montant arrière (rehaussé)' : 'Montant arrière', cat: 'tube', sousEns, couleur: this.coulAcier,
      debit: { sec: ft.sec, L: ft.Hb, coupe: '90° / 90°', _ft: ft, _cote: 'ar' },
      forme: box(x, D - a, z0, a, a, ft.Hb), module: mod
    });
    // traverses de profondeur (soudées entre montants)
    ft.traverses.forEach(tr => {
      let us = '';
      if (tr.us === 'tab') us = '2 × (Ø4,5 dessus / Ø8 dessous) pour vis de tablette';
      if (tr.us === 'tringle') us = '2 × écrou à sertir M5 sur chaque face latérale (support de tringle)';
      this.add({
        nom: tr.nom || 'Traverse de profondeur', cat: 'tube', sousEns, couleur: this.coulAcier,
        debit: { sec: ft.sec, L: D - 2 * a, coupe: '90° / 90° (à souder entre montants)', usin: us },
        forme: box(x, a, z0 + tr.z - a, a, D - 2 * a, a), module: mod
      });
    });
    // vérins ou bouchons
    if (ft.verins) {
      [inst.mAv, inst.mAr].forEach((m, i) => {
        this.add({ nom: 'Vérin de nivellement M8', cat: 'quinc', couleur: COUL.verin, info: 'Embout taraudé M8 enfoncé dans le tube, patin Ø30 réglable de 15 à 30 mm',
          forme: cyl('z', x + a / 2, (i === 0 ? a / 2 : D - a / 2), 0, 15, z0, 14), module: mod });
      });
      this.q('verin', 2, 'Vérin de nivellement M8, patin Ø30 + embout taraudé carré ' + a + '×' + a, 'pieds');
    }
    this.q('bouchon' + a, ft.verins ? 2 : 4, 'Bouchon plastique à ailettes ' + a + '×' + a, 'extrémités des montants');
    return inst;
  };

  /* Lisse (traverse de largeur) boulonnée entre deux cadres d'un même module, platines soudées aux extrémités */
  Constructeur.prototype.lisse = function (cG, cD, cote, zc, nb, nom, extraUsin) {
    const ft = cG.ft, a = cG.a, D = cG.D;
    const S = SECTIONS[ft.sec];
    const e = 3;                                 // épaisseur platine
    const filet = a === 25 ? 'M6' : 'M5';
    const xa = cG.x + a + e, xb = cD.x - e;
    const y = cote === 'av' ? 0 : D - a;
    const z0 = cG.z0;
    // nb = 2 : deux boulons de part et d'autre du tube ; 1 : un boulon au-dessus ; 'b' : un boulon au-dessous
    // (lisse affleurant le haut du cadre)
    let hp, trous, zp0;
    if (nb === 2) { hp = a === 25 ? 60 : 50; const ec = a === 25 ? 21 : 18; trous = [zc - ec, zc + ec]; zp0 = zc - hp / 2; }
    else if (nb === 1) { hp = 40; trous = [zc + 20]; zp0 = zc - a / 2; }
    else { hp = a === 25 ? 50 : 40; trous = [zc + a / 2 - hp + 11]; zp0 = zc + a / 2 - hp; }
    const nbB = nb === 2 ? 2 : 1;
    const L = Math.round(xb - xa);
    const sousEns = 'Lisse ' + L + ' (' + nbB + ' boulon' + (nbB > 1 ? 's' : '') + ' par extrémité)';
    const p = this.add({
      nom: nom, cat: 'tube', sousEns, couleur: this.coulAcier,
      debit: { sec: ft.sec, L, coupe: '90° / 90°', usin: extraUsin || '' },
      forme: box(xa, y, z0 + zc - a / 2, L, a, a)
    });
    const secP = a === 25 ? 'P25x3' : 'P20x3';
    [cG.x + a, xb].forEach(xp => {
      this.add({
        nom: 'Platine d\'about', cat: 'plat', sousEns, couleur: COUL.platine,
        debit: { sec: secP, L: hp, coupe: '90° / 90°', usin: nbB + ' trou' + (nbB > 1 ? 's' : '') + ' Ø' + (a === 25 ? '6,5' : '5,5') + (nb === 2 ? ' entraxe ' + (trous[1] - trous[0]) : (nb === 1 ? ' à 20 mm au-dessus de l\'axe du tube' : ' à 11 mm du bas de la platine')) },
        forme: box(xp, y, z0 + zp0, e, a, hp)
      });
    });
    trous.forEach(z => { ajTrou(ft, cote, z, filet, nom); ajTrou(cD.ft, cote, z, filet, nom); });
    this.q('vis' + filet, 2 * nbB, 'Vis CHC ' + filet + '×16 zinguée + rondelle plate ' + filet, 'lisses boulonnées');
    return p;
  };

  /* Équerre d'ancrage mural 40×40×4 vissée sur la face intérieure d'un montant arrière */
  Constructeur.prototype.equerre = function (c, faceX, z, murY) {
    const a = c.a, D = c.D;
    const filet = a === 25 ? 'M6' : 'M5';
    const xf = faceX === 'g' ? c.x + a : c.x;          // face intérieure côté module
    const sens = faceX === 'g' ? 1 : -1;
    const ep = 4, larg = 30;
    const y1 = murY - 40;
    const f1 = box(sens > 0 ? xf : xf - ep, y1, c.z0 + z - larg / 2, ep, murY - ep - y1, larg);
    const f2 = box(sens > 0 ? xf : xf - 40, murY - ep, c.z0 + z - larg / 2, 40, ep, larg);
    this.add({
      nom: 'Équerre d\'ancrage mural', cat: 'plat', couleur: COUL.platine, sousEns: null,
      debit: { sec: 'P40x4', L: larg, coupe: '90° / 90°', usin: 'aile meuble : 1 trou Ø' + (a === 25 ? '6,5' : '5,5') + ' ; aile mur : 1 trou oblong 8,5 × 20' },
      info: 'Fixation au mur par cheville Ø8 (voir tableau des chevilles selon le support)',
      formes: [f1, f2]
    });
    ajTrou(c.ft, 'ar', z, filet, 'équerre murale');
    this.q('vis' + filet, 1, 'Vis CHC ' + filet + '×16 zinguée + rondelle plate ' + filet, 'équerres murales');
    this.q('cheville', 1, 'Cheville Ø8 adaptée au mur + vis Ø5×50 tête hexagonale + rondelle', 'ancrage mural');
  };

  /* Liaison entre deux modules voisins : boulons traversants */
  Constructeur.prototype.liaison = function (cD, cG2, zs) {
    const a = cD.a;
    const filet = a === 25 ? 'M6' : 'M5';
    [['av', 0], ['ar', cD.D - a]].forEach(([cote, y]) => {
      zs.forEach(z => {
        if ((cote === 'av' ? cD.ft.Hf : cD.ft.Hb) < z || (cote === 'av' ? cG2.ft.Hf : cG2.ft.Hb) < z) return;
        cD.ft.traversants[cote + z] = { cote, z };
        cG2.ft.traversants[cote + z] = { cote, z };
        this.add({ nom: 'Boulon de liaison inter-modules', cat: 'quinc', couleur: COUL.platine,
          info: 'Boulon ' + filet + ' traversant les deux montants accolés, serrage modéré (5 N·m) pour ne pas écraser les tubes',
          formes: [cyl('x', cD.x - 4, y + a / 2, cD.z0 + z, 5, 4, 8), cyl('x', cG2.x + a, y + a / 2, cG2.z0 + z, 5, 5, 6)] });
        this.q('liaison' + filet, 1, 'Boulon TH ' + filet + '×' + (2 * a + 10) + ' + 2 rondelles larges + écrou frein (Nylstop)', 'liaison entre modules');
      });
    });
  };

  /* Calcul final des usinages des montants à partir des trous enregistrés */
  Constructeur.prototype.finaliser = function () {
    this.parts.forEach(p => {
      if (p.debit && p.debit._ft) {
        const ft = p.debit._ft, cote = p.debit._cote;
        const tr = Object.values(ft.trous[cote]).sort((u, v) => u.z - v.z);
        const tv = Object.values(ft.traversants).filter(t => t.cote === cote).sort((u, v) => u.z - v.z);
        const fa = cote === 'av' ? Object.values(ft.faceAvant).sort((u, v) => u.z - v.z) : [];
        const morceaux = [];
        if (tr.length) {
          const filet = tr[0].filet;
          morceaux.push(tr.length * 2 + ' écrous à sertir ' + filet + ' (Ø' + (filet === 'M6' ? 9 : 7) + ', ' + tr.length + ' par face latérale) à z = ' + tr.map(t => Math.round(t.z)).join(' / '));
        }
        if (tv.length) morceaux.push(tv.length + ' trou' + (tv.length > 1 ? 's' : '') + ' traversant' + (tv.length > 1 ? 's' : '') + ' Ø' + (p.debit.sec === 'T25' ? '6,5' : '5,5') + ' à z = ' + tv.map(t => t.z).join(' / '));
        if (fa.length) morceaux.push(fa.length + ' écrou' + (fa.length > 1 ? 's' : '') + ' à sertir M6 face avant à z = ' + fa.map(t => t.z).join(' / ') + ' (' + fa[0].usage + ')');
        p.debit.usin = morceaux.join(' ; ');
        delete p.debit._ft; delete p.debit._cote;
      }
    });
    // écrous à sertir des cadres
    this.typesCadre.forEach(ft => {
      ['av', 'ar'].forEach(cote => {
        const tr = Object.values(ft.trous[cote]);
        if (!tr.length) return;
        const filet = tr[0].filet;
        this.q('sertir' + filet, tr.length * 2 * ft.inst, 'Écrou à sertir ' + filet + ' acier zingué tête plate (perçage Ø' + (filet === 'M6' ? 9 : 7) + ')', 'cadres percés sur les deux faces');
      });
      const fa = Object.values(ft.faceAvant);
      if (fa.length) this.q('sertirM6', fa.length * ft.inst, 'Écrou à sertir M6 acier zingué tête plate (perçage Ø9)', 'pattes de tringle à rideau');
    });
  };

  /* ------------------------------------------------------------------ */
  /*  A. DRESSING MODULAIRE                                              */
  /* ------------------------------------------------------------------ */
  function dressing() {
    const b = new Constructeur('A', { coulAcier: COUL.acierA });
    const a = 25, D = 550, H = 1900, zb = 20, murY = 565;
    const tab = (z) => ({ z, us: 'tab', nom: 'Traverse porte-tablette' });
    const Fp = b.typeCadre('Fp', { nom: 'Cadre soudé Fp (penderie)', sec: 'T25', D, Hf: H, Hb: H, verins: true,
      traverses: [tab(80), tab(330), { z: 1100, nom: 'Traverse de raidissage' }, { z: 1760, us: 'tringle', nom: 'Traverse porte-tringle' }, tab(1900)] });
    const Fe = b.typeCadre('Fe', { nom: 'Cadre soudé Fe (étagères)', sec: 'T25', D, Hf: H, Hb: H, verins: true,
      traverses: [tab(80), tab(330), tab(650), tab(950), tab(1250), tab(1550), tab(1900)] });

    const mods = [
      { code: 'P1', nom: 'Module penderie 1', x: 0, w: 700, ft: Fp },
      { code: 'E', nom: 'Module étagères', x: 700, w: 450, ft: Fe },
      { code: 'P2', nom: 'Module penderie 2', x: 1150, w: 700, ft: Fp }
    ];
    const etapeMod = [[0, 1], [2, 2], [3, 3]];
    mods.forEach((m, i) => {
      b.set({ module: i, etape: etapeMod[i][0] });
      m.cG = b.cadre(m.ft, m.x, zb, i);
      m.cD = b.cadre(m.ft, m.x + m.w - a, zb, i);
      b.set({ etape: etapeMod[i][1] });
      b.lisse(m.cG, m.cD, 'ar', 1852.5, 2, 'Lisse arrière haute');
      b.lisse(m.cG, m.cD, 'av', 1852.5, 2, 'Lisse avant haute');
      b.lisse(m.cG, m.cD, 'ar', 162.5, 2, 'Lisse arrière basse');
    });
    // liaison inter-modules
    b.set({ etape: 4, module: 0 });
    b.liaison(mods[0].cD, mods[1].cG, [300, 1600]);
    b.set({ module: 1 });
    b.liaison(mods[1].cD, mods[2].cG, [300, 1600]);
    // ancrage mural
    b.set({ etape: 5 });
    mods.forEach((m, i) => { b.set({ module: i }); b.equerre(m.cG, 'g', 1780, murY); b.equerre(m.cD, 'd', 1780, murY); });
    // tablettes et dessus
    b.set({ etape: 6 });
    mods.forEach((m, i) => {
      b.set({ module: i });
      const niveaux = m.ft === Fp ? [80, 330] : [80, 330, 650, 950, 1250, 1550];
      niveaux.forEach(z => {
        b.add({ nom: 'Tablette', cat: 'panneau', couleur: COUL.cp15, mat: 'Contreplaqué 15 mm',
          debit: { ep: 15, L: m.w - 2, l: D - 2 * a - 2, usin: 'chants poncés + vernis ; 4 avant-trous Ø3' },
          forme: box(m.x + 1, a + 1, zb + z, m.w - 2, D - 2 * a - 2, 15) });
        b.q('visbois', 4, 'Vis à bois tête fraisée 4×30', 'fixation des tablettes');
      });
      b.add({ nom: 'Dessus (couvercle anti-poussière)', cat: 'panneau', couleur: COUL.cp15, mat: 'Contreplaqué 15 mm',
        debit: { ep: 15, L: m.w, l: D, usin: 'chants arrondis R2 + vernis ; 4 avant-trous Ø3' },
        forme: box(m.x, 0, zb + H, m.w, D, 15) });
      b.q('visbois', 4, 'Vis à bois tête fraisée 4×30', 'fixation des dessus');
    });
    // tringles de penderie
    b.set({ etape: 7 });
    [0, 2].forEach(i => {
      const m = mods[i];
      b.set({ module: i });
      const L = m.w - 2 * a - 8;
      b.add({ nom: 'Tringle de penderie Ø25', cat: 'rond', couleur: COUL.inox,
        debit: { sec: 'R25', L, coupe: '90° / 90° ébavurée', usin: '' },
        info: 'Charge admissible environ 35 kg répartis (flèche < 1 mm)',
        forme: cyl('x', m.x + a + 4, D / 2, zb + 1760 - a / 2, 12.5, L, 18) });
      [m.x + a, m.x + m.w - a - 4].forEach(xs => b.add({ nom: 'Support de tringle (cuvette)', cat: 'quinc', couleur: COUL.inox,
        forme: box(xs, D / 2 - 15, zb + 1760 - a - 8, 4, 30, 33) }));
      b.q('supporttringle', 2, 'Support de tringle Ø25 (cuvette fermée) + 2 vis M5×10', 'tringles de penderie');
    });
    // joues latérales anti-poussière
    b.set({ etape: 8 });
    [[0, -5, 0], [2, 1850, 2]].forEach(([i, x]) => {
      b.set({ module: i });
      b.add({ nom: 'Joue latérale anti-poussière', cat: 'panneau', couleur: COUL.cp5, mat: 'Contreplaqué 5 mm',
        debit: { ep: 5, L: H, l: D, usin: '8 avant-trous Ø4 fraisés' },
        forme: box(x, 0, zb, 5, D, H) });
      b.q('visauto', 8, 'Vis autoperceuse tête bombée 4,2×19', 'joues latérales');
    });
    // tringle à rideau
    b.set({ etape: 9 });
    const zr = zb + H + 10;
    const xsP = [{ x: 0, m: 0 }, { x: 700 - a, m: 0 }, { x: 1150, m: 2 }, { x: 1850 - a, m: 2 }];
    xsP.forEach(o => {
      b.set({ module: o.m });
      b.add({ nom: 'Patte de tringle à rideau', cat: 'plat', couleur: COUL.platine,
        debit: { sec: 'P30x4', L: 215, coupe: '90° / 90°, pliée à 90° à 145 mm', usin: '2 trous Ø6,5 entraxe 25 côté meuble ; encoche Ø21 côté tringle' },
        formes: [box(o.x - 2.5, -4, zb + 1775, 30, 4, zr - 11 - zb - 1775), box(o.x - 2.5, -70, zr - 15, 30, 70, 4)] });
      Fp.faceAvant['1790'] = { z: 1790, usage: 'patte de tringle à rideau' };
      Fp.faceAvant['1815'] = { z: 1815, usage: 'patte de tringle à rideau' };
      b.q('visM6', 2, 'Vis CHC M6×16 zinguée + rondelle plate M6', 'pattes de tringle');
    });
    b.set({ module: 0 });
    b.add({ nom: 'Tringle à rideau Ø20', cat: 'rond', couleur: COUL.inox,
      debit: { sec: 'R20', L: 1930, coupe: '90° / 90°', usin: '2 embouts décoratifs' },
      forme: cyl('x', -40, -55, zr, 10, 1930, 14) });
    b.q('embout', 2, 'Embout de tringle Ø20', 'tringle à rideau');
    b.q('anneaux', 24, 'Anneau de rideau Ø32 avec pince', 'rideaux');
    // rideaux (fermés / ouverts)
    const plis = (x0, larg, nPlis, variante, nom) => {
      const pas = larg / nPlis;
      const formes = [];
      for (let k = 0; k < nPlis; k++) formes.push(box(x0 + k * pas, -66 + (k % 2) * 16, 15, pas + 0.5, 6, zr - 22));
      b.add({ nom, cat: 'rideau', couleur: COUL.rideau, variante, mat: 'Tissu coton/polyester serré, lavable 40 °C',
        info: 'Largeur finie ' + Math.round(larg) + ' mm (tissu coupé ×1,5 pour l\'ampleur), hauteur 1915 mm, ourlet bas à 15 mm du sol', formes });
    };
    plis(-25, 975, 16, 'ferme', 'Rideau gauche');
    plis(900, 975, 16, 'ferme', 'Rideau droit');
    plis(-25, 260, 10, 'ouvert', 'Rideau gauche (ouvert)');
    plis(1615, 260, 10, 'ouvert', 'Rideau droit (ouvert)');
    // rangement (illustration)
    b.set({ etape: 10 });
    const couleursHabits = ['#5b6f8f', '#c9c3b6', '#8c3b3b', '#2f3e4e', '#a7b59a', '#e2ddd3', '#6b5745', '#40566b', '#b48a5a', '#1f2a36'];
    [0, 2].forEach(i => {
      const m = mods[i];
      b.set({ module: i });
      for (let k = 0; k < 10; k++) {
        const hh = [950, 1000, 720, 1050, 900, 760, 980, 1100, 820, 940][k];
        b.add({ nom: 'Vêtement sur cintre', cat: 'equip', couleur: couleursHabits[(k + i) % 10],
          forme: box(m.x + 60 + k * 58, D / 2 - 210, zb + 1740 - hh, 22, 420, hh) });
      }
      [80, 330].forEach(z => {
        for (let k = 0; k < 3; k++) b.add({ nom: 'Paire de chaussures', cat: 'equip', couleur: ['#3a2c22', '#e9e6df', '#6d4b35'][(k + i) % 3],
          forme: box(m.x + 50 + k * 210, 110, zb + z + 15, 190, 290, z === 80 ? 110 : 140) });
      });
    });
    b.set({ module: 1 });
    [650, 950, 1250, 1550].forEach((z, j) => {
      [0, 1].forEach(k => b.add({ nom: 'Pile de vêtements pliés', cat: 'equip', couleur: couleursHabits[(j * 2 + k + 3) % 10],
        forme: box(700 + 45 + k * 185, 90, zb + z + 15, 170, 330, 140 + 40 * ((j + k) % 2)) }));
    });
    [80, 330].forEach(z => b.add({ nom: 'Paire de chaussures', cat: 'equip', couleur: '#4a4f57', forme: box(700 + 120, 110, zb + z + 15, 190, 290, 110) }));

    b.finaliser();
    return {
      code: 'A', nom: 'Dressing modulaire avec rideaux', court: 'Dressing',
      dims: { L: 1850, P: 550, H: zb + H + 15 }, encombrement: '1850 × 620 × 1945 mm (tringle et rideaux compris)',
      tube: 'T25', murY, sol: { x0: -400, x1: 2250, y0: -500, y1: murY }, murH: 2400,
      modules: mods.map(m => ({ code: m.code, nom: m.nom, x: m.x, w: m.w })),
      typesCadre: b.typesCadre, parts: b.parts, quinc: b.quinc,
      niveaux: { face: [0, zb, zb + 80, zb + 330, zb + 1100, zb + 1760, zb + H, zb + H + 15], faceE: [zb + 650, zb + 950, zb + 1250, zb + 1550] },
      cotesH: [0, 700, 1150, 1850],
      etapes: [
        { t: 'Module penderie 1 : cadres et vérins', d: 'Visser les 4 vérins M8 sous les deux cadres Fp. Poser les cadres debout, face avant vers soi, à environ 650 mm l\'un de l\'autre. Les écrous à sertir sont présents sur les deux faces : le sens gauche/droite est indifférent.', ctrl: ['Embouts taraudés bien enfoncés', 'Vérins vissés à mi-course (≈ 20 mm)'] },
        { t: 'Module penderie 1 : lisses boulonnées', d: 'Présenter la lisse arrière basse puis la lisse arrière haute, enfin la lisse avant haute. Engager les vis CHC M6×16 à la main, sans serrer. Mesurer les diagonales de la face arrière (écart toléré 3 mm) puis serrer à 8 N·m.', ctrl: ['Diagonales égales à ±3 mm', 'Platines bien à plat contre les montants'] },
        { t: 'Module étagères : cadres Fe et lisses', d: 'Même procédure avec les deux cadres Fe (traverses tous les 300 mm) et trois lisses de 394 mm.', ctrl: ['Équerrage vérifié', 'Serrage 8 N·m'] },
        { t: 'Module penderie 2', d: 'Monter le second module penderie exactement comme le premier.', ctrl: ['Identique au module 1'] },
        { t: 'Liaison des trois modules', d: 'Accoler les modules face avant alignée. Passer les 8 boulons M6×60 dans les trous traversants (2 hauteurs, avant et arrière). Serrer modérément (5 N·m) pour ne pas écraser les tubes. Régler les vérins : niveau à bulle sur les traverses porte-tablette, de gauche à droite puis d\'avant en arrière.', ctrl: ['Faces avant alignées', 'Niveau dans les deux sens', 'Le meuble ne bascule pas lorsqu\'on appuie sur un coin'] },
        { t: 'Ancrage mural anti-basculement', d: 'Visser une équerre 40×40×4 sur la face intérieure de chaque montant arrière à z = 1800. Pousser le meuble contre le mur (jeu de 15 mm prévu pour la plinthe). Marquer les trous oblongs, écarter le meuble, percer Ø8, cheviller, remettre le meuble et visser les 6 vis Ø5×50.', ctrl: ['Chevilles adaptées au mur (voir tableau)', 'Aucun jeu en tirant le haut du meuble vers soi'] },
        { t: 'Tablettes et dessus', d: 'Poser les tablettes 15 mm sur leurs traverses, puis les trois dessus. Fixer chaque panneau par 4 vis à bois 4×30 passées par dessous à travers les traverses (trous Ø8 dessous / Ø4,5 dessus).', ctrl: ['Appui d\'au moins 22 mm sur chaque traverse', 'Vis non débouchantes'] },
        { t: 'Tringles de penderie', d: 'Visser les cuvettes de tringle sur les traverses porte-tringle (écrous à sertir M5), puis engager les tringles Ø25.', ctrl: ['Tringle bloquée en translation', 'Charge maxi conseillée : 35 kg par tringle'] },
        { t: 'Joues latérales anti-poussière', d: 'Visser les joues en contreplaqué 5 mm sur les faces extérieures des deux cadres d\'extrémité (8 vis autoperceuses 4,2×19 chacune).', ctrl: ['Joues affleurantes devant et dessus'] },
        { t: 'Tringle à rideau et rideaux', d: 'Boulonner les 4 pattes en L sur la face avant des montants (écrous à sertir M6 à z = 1790 et 1815 au-dessus du dessous des cadres). Enfiler les anneaux et les deux rideaux sur la tringle Ø20, poser la tringle dans les encoches et mettre les embouts.', ctrl: ['Rideau à 15 mm du sol', 'Recouvrement central de 50 mm', 'Les rideaux glissent sans accrocher les tablettes'] },
        { t: 'Mise en service', d: 'Ranger vêtements et chaussures. Répartir les charges : objets lourds en bas, 30 kg maximum par tablette, 35 kg par tringle.', ctrl: ['Charges réparties', 'Rideaux fermés pour la protection contre la poussière'] }
      ]
    };
  }

  /* ------------------------------------------------------------------ */
  /*  B. ÉTAGÈRE MURALE DE CUISINE                                       */
  /* ------------------------------------------------------------------ */
  function etagere() {
    const b = new Constructeur('B', { coulAcier: COUL.acierB });
    const a = 20, D = 280, H = 900, zb = 0, murY = 284;
    const tab = (z) => ({ z, us: 'tab', nom: 'Traverse porte-tablette' });
    const Fb = b.typeCadre('Fb', { nom: 'Cadre soudé Fb (étagère murale)', sec: 'T20', D, Hf: H, Hb: H, verins: false,
      traverses: [tab(20), tab(400), tab(630), tab(900)] });
    const mods = [
      { code: 'M1', nom: 'Module assiettes / verres', x: 0, w: 450 },
      { code: 'M2', nom: 'Module bouteilles / verres', x: 450, w: 450 }
    ];
    mods.forEach((m, i) => {
      b.set({ module: i, etape: i });
      m.cG = b.cadre(Fb, m.x, zb, i);
      m.cD = b.cadre(Fb, m.x + m.w - a, zb, i);
      b.lisse(m.cG, m.cD, 'ar', 50, 2, 'Lisse arrière basse');
      b.lisse(m.cG, m.cD, 'ar', 860, 2, 'Lisse arrière haute');
      b.lisse(m.cG, m.cD, 'av', 860, 2, 'Lisse avant haute');
      b.lisse(m.cG, m.cD, 'av', 40, 2, 'Lisse avant basse (barre à tasses)');
      b.lisse(m.cG, m.cD, 'av', 435, 1, 'Rebord anti-chute niveau 1');
      b.lisse(m.cG, m.cD, 'av', 665, 1, 'Rebord anti-chute niveau 2');
      if (i === 1) b.lisse(m.cG, m.cD, 'av', 110, 1, 'Barre de retenue des bouteilles');
    });
    // la barre de retenue est prévue sur les deux modules (trous présents partout) : seul M2 la reçoit
    b.set({ etape: 2, module: 0 });
    b.liaison(mods[0].cD, mods[1].cG, [250, 750]);
    b.set({ etape: 3 });
    mods.forEach((m, i) => {
      b.set({ module: i });
      b.equerre(m.cG, 'g', 100, murY); b.equerre(m.cG, 'g', 800, murY);
      b.equerre(m.cD, 'd', 100, murY); b.equerre(m.cD, 'd', 800, murY);
    });
    // étape 4 : pose murale (pas de nouvelle pièce, mur mis en évidence)
    b.set({ etape: 5 });
    mods.forEach((m, i) => {
      b.set({ module: i });
      const niveaux = i === 0 ? [400, 630] : [20, 400, 630];
      niveaux.forEach(z => {
        b.add({ nom: 'Tablette', cat: 'panneau', couleur: COUL.cp15, mat: 'Contreplaqué 15 mm',
          debit: { ep: 15, L: m.w - 2, l: D - 2 * a - 2, usin: 'vernis alimentaire 2 couches ; 4 avant-trous Ø3' },
          forme: box(m.x + 1, a + 1, zb + z, m.w - 2, D - 2 * a - 2, 15) });
        b.q('visbois', 4, 'Vis à bois tête fraisée 4×30', 'fixation des tablettes');
      });
      b.add({ nom: 'Dessus', cat: 'panneau', couleur: COUL.cp15, mat: 'Contreplaqué 15 mm',
        debit: { ep: 15, L: m.w, l: D, usin: 'vernis alimentaire 2 couches ; 4 avant-trous Ø3' },
        forme: box(m.x, 0, zb + H, m.w, D, 15) });
      b.q('visbois', 4, 'Vis à bois tête fraisée 4×30', 'fixation des dessus');
    });
    b.set({ module: 0 });
    b.add({ nom: 'Bac égouttoir', cat: 'tole', couleur: COUL.inox, mat: 'Tôle inox 304 0,8 mm',
      debit: { ep: 0.8, L: 446 + 50, l: 238 + 50, usin: 'développé ; 4 bords relevés de 25 mm, angles pliés-soudés ou rivetés étanches' },
      info: 'Amovible pour le vidage et le lavage', formes: [box(2, 21, 20, 446, 238, 1), box(2, 21, 20, 446, 1, 25), box(2, 258, 20, 446, 1, 25), box(2, 21, 20, 1, 238, 25), box(447, 21, 20, 1, 238, 25)] });
    // râtelier à assiettes
    b.set({ etape: 6 });
    const pins = [];
    for (let k = 0; k < 11; k++) {
      const x = 45 + k * 36;
      pins.push(cyl('z', x, 70, 24, 3, 110, 6));
      pins.push(cyl('z', x, 200, 24, 3, 70, 6));
    }
    b.add({ nom: 'Râtelier à assiettes (soudé)', cat: 'rond', couleur: COUL.inox, sousEns: 'Râtelier à assiettes',
      debit: { sec: 'RP6', L: 110, n: 11, coupe: 'droite, bout arrondi', usin: 'picots avant (11 par râtelier)' },
      info: 'Sous-ensemble soudé : 2 plats 400×20×3 + 22 picots Ø6 (11 de 110 mm à l\'avant, 11 de 70 mm à l\'arrière), pas 36 mm : 10 assiettes',
      formes: pins.filter((_, k) => k % 2 === 0).concat([box(30, 60, 21, 400, 20, 3)]) });
    b.add({ nom: 'Râtelier à assiettes (soudé)', cat: 'rond', couleur: COUL.inox, sousEns: 'Râtelier à assiettes',
      debit: { sec: 'RP6', L: 70, n: 11, coupe: 'droite, bout arrondi', usin: 'picots arrière (11 par râtelier)' },
      formes: pins.filter((_, k) => k % 2 === 1).concat([box(30, 190, 21, 400, 20, 3)]) });
    b.add({ nom: 'Plat support de râtelier', cat: 'plat', couleur: COUL.inox, sousEns: 'Râtelier à assiettes',
      debit: { sec: 'P20x3', L: 400, coupe: '90° / 90°', usin: '11 trous Ø6 au pas de 36' }, formes: [] });
    b.add({ nom: 'Plat support de râtelier', cat: 'plat', couleur: COUL.inox, sousEns: 'Râtelier à assiettes',
      debit: { sec: 'P20x3', L: 400, coupe: '90° / 90°', usin: '11 trous Ø6 au pas de 36' }, formes: [] });
    // crochets à tasses
    mods.forEach((m, i) => {
      b.set({ module: i });
      for (let k = 0; k < 4; k++) {
        const x = m.x + 75 + k * 95;
        b.add({ nom: 'Crochet S + tasse suspendue', cat: 'equip', couleur: ['#c46b4e', '#e8e3d6', '#3f6e8c', '#d9a441'][(k + i) % 4],
          formes: [box(x - 1, -8, -30, 2, 4, 80), cyl('z', x, -50, -140, 42, 95, 14)] });
      }
      b.q('crochetS', 4, 'Crochet en S inox 60 mm', 'barre à tasses');
    });
    // contenu
    b.set({ etape: 7, module: 0 });
    for (let k = 0; k < 10; k++) b.add({ nom: 'Assiette Ø265', cat: 'equip', couleur: '#f2efe8', forme: cyl('x', 50 + k * 36 + 4, 135, 27 + 132, 132, 8, 22) });
    b.set({ module: 1 });
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
      const x = 450 + 75 + k * 98, y = 75 + r * 115;
      b.add({ nom: 'Bouteille 1,5 L', cat: 'equip', couleur: r === 0 ? '#9cc6d9' : '#d9c46a',
        formes: [cyl('z', x, y, 35, 45, 240, 14), cyl('z', x, y, 275, 18, 60, 10), cyl('z', x, y, 335, 14, 15, 10)] });
    }
    // verres niveau 1 (usage quotidien) et niveau 2
    const verre = (x, y, z, r, h, coul, nom) => b.add({ nom, cat: 'equip', couleur: coul, forme: cyl('z', x, y, z, r, h, 14) });
    for (let k = 0; k < 10; k++) {
      const x = 50 + k * 85, mod = x < 450 ? 0 : 1;
      b.set({ module: mod });
      if (k < 5) { verre(x, 80, 415, 37, 120, '#bfe0ea', 'Verre à eau'); verre(x, 185, 415, 37, 120, '#bfe0ea', 'Verre à eau'); }
      else { verre(x, 80, 415, 42, 95, '#e9e4d8', 'Tasse à thé'); verre(x, 185, 415, 37, 110, '#d36b4b', 'Gobelet'); }
    }
    for (let k = 0; k < 9; k++) {
      const x = 55 + k * 95, mod = x < 450 ? 0 : 1;
      b.set({ module: mod });
      if (k < 6) verre(x, 120, 645, 40, 200, '#e6c66a', 'Verre à bière');
      else { verre(x, 80, 645, 41, 95, '#c6b9a0', 'Verre à whisky'); verre(x, 190, 645, 41, 95, '#c6b9a0', 'Verre à whisky'); }
    }
    b.set({ module: 0 });
    [[60, '#b33a2e'], [180, '#2e6b4f'], [300, '#d9a441']].forEach(([x, c]) => b.add({ nom: 'Boîte à thé / sucre', cat: 'equip', couleur: c, forme: box(x, 70, 915, 100, 120, 140) }));

    b.finaliser();
    return {
      code: 'B', nom: 'Étagère murale de cuisine', court: 'Étagère cuisine',
      dims: { L: 900, P: 280, H: 915 }, encombrement: '900 × 290 × 915 mm (tasses suspendues : 160 mm sous le meuble)',
      tube: 'T20', murY, poseZ: 1250, sol: null, murH: 1200, murZ0: -350,
      modules: mods.map(m => ({ code: m.code, nom: m.nom, x: m.x, w: m.w })),
      typesCadre: b.typesCadre, parts: b.parts, quinc: b.quinc,
      niveaux: { face: [0, 20, 400, 630, 900, 915] },
      cotesH: [0, 450, 900],
      etapes: [
        { t: 'Module M1 : cadres et lisses', d: 'Assembler les deux cadres Fb avec les six lisses (vis CHC M5×16). Serrer à 5 N·m après contrôle des diagonales de la face arrière.', ctrl: ['Diagonales égales à ±2 mm'] },
        { t: 'Module M2 : cadres et lisses', d: 'Même montage, avec en plus la barre de retenue des bouteilles à 110 mm.', ctrl: ['Barre de retenue côté avant'] },
        { t: 'Liaison M1 + M2', d: 'Accoler les deux modules et passer les 4 boulons M5×50 traversants (z = 250 et 750, avant et arrière).', ctrl: ['Dessus alignés', 'Serrage modéré 4 N·m'] },
        { t: 'Équerres murales', d: 'Visser les 8 équerres 40×40×4 sur les faces intérieures des montants arrière, à z = 100 et z = 800 (vis M5×16).', ctrl: ['Ailes murales bien dans le plan arrière'] },
        { t: 'Traçage, perçage et pose au mur', d: 'Tracer au niveau le trait du dessous du meuble à 1250 mm du sol. Présenter le meuble (à deux), marquer les 8 trous, percer Ø8, cheviller. Visser d\'abord les 4 chevilles hautes, contrôler le niveau, puis les 4 basses.', ctrl: ['Jamais au-dessus du poste gaz', 'Niveau à ±1 mm', 'Charge totale admise 60 kg'] },
        { t: 'Tablettes, dessus et bac égouttoir', d: 'Poser et visser les tablettes et les deux dessus (vis 4×30 par dessous). Glisser le bac égouttoir inox sur les traverses basses du module M1.', ctrl: ['Bac amovible sans forcer'] },
        { t: 'Râtelier et crochets', d: 'Poser le râtelier à assiettes dans le bac, accrocher les crochets en S sur les lisses avant basses.', ctrl: ['Râtelier stable dans le bac'] },
        { t: 'Rangement', d: 'Bouteilles derrière la barre de retenue, verres du quotidien au niveau 1, verres à bière et à whisky au niveau 2, tasses suspendues sous le meuble.', ctrl: ['Objets lourds en bas'] }
      ]
    };
  }

  /* ------------------------------------------------------------------ */
  /*  C. STATION DE CUISSON                                              */
  /* ------------------------------------------------------------------ */
  function station() {
    const b = new Constructeur('C', { coulAcier: COUL.acierC });
    const a = 25, D = 550, zb = 20, murY = 565;
    const tab = (z) => ({ z, us: 'tab', nom: 'Traverse porte-tablette' });
    const FgG = b.typeCadre('FgG', { nom: 'Cadre soudé FgG (gaz, gauche)', sec: 'T25', D, Hf: 770, Hb: 770, verins: true,
      traverses: [tab(80), { z: 770, nom: 'Traverse haute' }] });
    const FgD = b.typeCadre('FgD', { nom: 'Cadre soudé FgD (gaz, droit, porte-écran)', sec: 'T25', D, Hf: 770, Hb: 1130, verins: true,
      traverses: [tab(80), { z: 770, nom: 'Traverse haute' }] });
    const Fc = b.typeCadre('Fc', { nom: 'Cadre soudé Fc (cuisson électrique)', sec: 'T25', D, Hf: 770, Hb: 1400, verins: true,
      traverses: [tab(80), tab(420), tab(770)] });

    // Module G
    b.set({ module: 0, etape: 0 });
    const gG = b.cadre(FgG, 0, zb, 0), gD = b.cadre(FgD, 475, zb, 0);
    b.lisse(gG, gD, 'ar', 162.5, 2, 'Lisse arrière basse');
    b.lisse(gG, gD, 'ar', 720, 2, 'Lisse arrière haute');
    b.set({ etape: 1 });
    b.lisse(gG, gD, 'av', 367.5, 2, 'Traverse porte-plateau avant (réglable)');
    b.lisse(gG, gD, 'ar', 367.5, 2, 'Traverse porte-plateau arrière (réglable)');
    [307.5, 427.5].forEach(zc => [-21, 21].forEach(e => { ajTrou(FgG, 'av', zc + e, 'M6', 'réglage plateau'); ajTrou(FgG, 'ar', zc + e, 'M6', 'réglage plateau'); ajTrou(FgD, 'av', zc + e, 'M6', 'réglage plateau'); ajTrou(FgD, 'ar', zc + e, 'M6', 'réglage plateau'); }));
    b.add({ nom: 'Plateau porte-bouteille', cat: 'tole', couleur: COUL.galva, mat: 'Tôle acier 2 mm peinte',
      debit: { ep: 2, L: 446 + 40, l: 546, usin: 'développé ; 2 bords tombés de 20 mm sur les grands côtés' },
      info: 'Hauteur réglable sur 3 crans : 340 / 400 / 460 mm du sol (dessus de plateau)',
      formes: [box(27, 2, zb + 380, 446, 546, 2), box(27, 2, zb + 360, 2, 546, 20), box(471, 2, zb + 360, 2, 546, 20)] });
    b.lisse(gG, gD, 'ar', 580, 2, 'Lisse porte-collier');
    // collier de maintien bouteille
    const cx = 250, cy = 275, R = 138;
    b.add({ nom: 'Collier de maintien de bouteille', cat: 'plat', couleur: '#c4532f', sousEns: 'Collier de bouteille',
      debit: { sec: 'P30x3', L: 900, coupe: 'roulé Ø 276 int.', usin: 'ouvert à l\'avant, fermeture par sangle à boucle ; garniture caoutchouc 3 mm' },
      info: 'Empêche le basculement de la bouteille ; s\'ouvre à l\'avant pour l\'échange',
      forme: { t: 'anneau', x: cx, y: cy, z: zb + 575, r1: R - 3, r2: R, h: 30, n: 28 } });
    b.add({ nom: 'Bras de collier', cat: 'plat', couleur: COUL.platine, sousEns: 'Collier de bouteille',
      debit: { sec: 'P30x4', L: 150, coupe: '90° / 90°, pliée à 90° à 30 mm', usin: '2 trous Ø6,5 côté lisse' },
      formes: [box(235, cy + R, zb + 575, 30, 521 - cy - R, 4), box(235, 521, zb + 565, 30, 4, 40)] });
    b.q('visM6', 2, 'Vis CHC M6×16 zinguée + rondelle plate M6', 'bras de collier');
    b.q('sangle', 1, 'Sangle à boucle à came 25 mm, longueur 400 mm', 'fermeture du collier');

    // Module E
    b.set({ module: 1, etape: 2 });
    const eG = b.cadre(Fc, 500, zb, 1), eD = b.cadre(Fc, 1525, zb, 1);
    const usinPlan = '6 écrous à sertir M6 face intérieure à 452 / 494, 642 / 684 et 832 / 874 mm de l\'extrémité gauche (traverses sous plan)';
    b.lisse(eG, eD, 'av', 757.5, 'b', 'Lisse avant haute (porte-plan)', usinPlan);
    b.lisse(eG, eD, 'ar', 757.5, 'b', 'Lisse arrière haute (porte-plan)', usinPlan);
    b.lisse(eG, eD, 'ar', 162.5, 2, 'Lisse arrière basse');
    b.q('sertirM6', 12, 'Écrou à sertir M6 acier zingué tête plate (perçage Ø9)', 'lisses porte-plan (traverses sous plan)');
    // traverse médiane (jonction bois / inox) + deux traverses sous le bac inox (portée de la tôle ≤ 190 mm)
    [[980, 'Traverse médiane sous plan'], [1170, 'Traverse sous bac inox'], [1360, 'Traverse sous bac inox']].forEach(([xm, nom]) => {
      b.add({ nom, cat: 'tube', couleur: COUL.acierC, sousEns: 'Traverse sous plan',
        debit: { sec: 'T25', L: 494, coupe: '90° / 90°', usin: 'platines soudées aux 2 extrémités' },
        forme: box(xm - 12.5, a + 3, zb + 745, 25, 494, 25) });
      [a, D - a - 3].forEach(y => b.add({ nom: 'Platine de traverse sous plan', cat: 'plat', couleur: COUL.platine, sousEns: 'Traverse sous plan',
        debit: { sec: 'P25x3', L: 60, coupe: '90° / 90°', usin: '2 trous Ø6,5 entraxe 42 (horizontal)' },
        forme: box(xm - 30, y, zb + 745, 60, 3, 25) }));
      b.q('visM6', 4, 'Vis CHC M6×16 zinguée + rondelle plate M6', 'traverses sous plan');
    });
    b.set({ etape: 3 });
    b.lisse(eG, eD, 'ar', 1150, 2, 'Barre à ustensiles');
    b.lisse(eG, eD, 'ar', 1360, 2, 'Lisse haute arrière');

    // liaison + ancrage + crédence
    b.set({ etape: 4, module: 0 });
    b.liaison(gD, eG, [200, 650]);
    b.equerre(gG, 'g', 640, murY); b.equerre(gD, 'd', 640, murY);
    b.set({ module: 1 });
    b.equerre(eG, 'g', 1000, murY); b.equerre(eD, 'd', 1000, murY);
    b.add({ nom: 'Crédence de protection murale', cat: 'tole', couleur: COUL.alu, mat: 'Tôle aluminium 1 mm (ou inox 0,6 mm)',
      debit: { ep: 1, L: 1550, l: 650, usin: '6 trous Ø5 fraisés ; collée ou chevillée au mur' },
      info: 'Protège le mur derrière le brûleur et le réchaud',
      forme: box(0, murY - 1, zb + 788, 1550, 1, 650) });
    b.q('chevillecred', 6, 'Cheville Ø6 + vis tête fraisée Ø4×40', 'crédence');

    // plans de travail et tablettes
    b.set({ etape: 5, module: 0 });
    b.add({ nom: 'Tablette basse (marmites)', cat: 'panneau', couleur: COUL.cp18, mat: 'Contreplaqué 18 mm',
      debit: { ep: 18, L: 498, l: 498, usin: 'vernis PU 2 couches ; 4 avant-trous Ø3' },
      forme: box(1, a + 1, zb + 80, 498, 498, 18) });
    b.q('visbois', 4, 'Vis à bois tête fraisée 4×30', 'fixation des tablettes');
    b.set({ module: 1 });
    [80, 420].forEach(z => {
      b.add({ nom: 'Tablette (casseroles)', cat: 'panneau', couleur: COUL.cp18, mat: 'Contreplaqué 18 mm',
        debit: { ep: 18, L: 1048, l: 498, usin: 'vernis PU 2 couches ; 4 avant-trous Ø3' },
        forme: box(501, a + 1, zb + z, 1048, 498, 18) });
      b.q('visbois', 4, 'Vis à bois tête fraisée 4×30', 'fixation des tablettes');
    });
    b.add({ nom: 'Plan de travail bois (zone induction)', cat: 'panneau', couleur: COUL.cp18, mat: 'Contreplaqué 18 mm',
      debit: { ep: 18, L: 480, l: 570, usin: 'encoche 26 × 26 angle arrière gauche ; débord avant 20 ; chants arrondis R3 ; vernis PU 3 couches' },
      info: 'Supporte la plaque induction BOMA ; 50 mm libres autour de la plaque',
      forme: box(500, -20, zb + 770, 480, 570, 18) });
    b.q('visbois', 6, 'Vis à bois tête fraisée 4×30', 'plan de travail');
    b.add({ nom: 'Bac zone chaude (réchaud + dépose)', cat: 'tole', couleur: COUL.inox, mat: 'Tôle inox 304 1,5 mm',
      debit: { ep: 1.5, L: 568 + 30, l: 570 + 30, usin: 'développé ; 4 bords relevés de 15 mm ; encoche 26 × 26 angle arrière droit' },
      info: 'Zone entièrement métallique, sans bois dessous : supporte le réchaud et la casserole chaude',
      formes: [box(981, -20, zb + 770, 568, 570, 1.5), box(981, -20, zb + 770, 568, 1.5, 16), box(981, 548.5, zb + 770, 543, 1.5, 16), box(981, -20, zb + 770, 1.5, 570, 16), box(1547.5, -20, zb + 770, 1.5, 544, 16)] });

    // écran thermique, étagère, barre, prises
    b.set({ etape: 6, module: 0 });
    b.add({ nom: 'Écran thermique gaz / électrique', cat: 'tole', couleur: COUL.galva, mat: 'Tôle acier galvanisé 1 mm',
      debit: { ep: 1, L: 550 + 15, l: 390, usin: 'ourlet avant 15 mm ; 4 trous Ø6,5' },
      info: 'Sépare la flamme de la plaque induction ; laisser 60 mm minimum entre le bord de casserole et l\'écran',
      forme: box(474, 0, zb + 740, 1, 550, 390) });
    [800, 950, 1100].forEach(z => ajTrou(FgD, 'ar', z, 'M6', 'écran thermique'));
    ajTrou(FgD, 'av', 755, 'M6', 'écran thermique');
    b.q('visM6', 4, 'Vis CHC M6×16 zinguée + rondelle plate M6', 'écran thermique');
    b.set({ module: 1 });
    [[525, 1], [1525 - 4, -1]].forEach(([x]) => {
      b.add({ nom: 'Console d\'étagère', cat: 'plat', couleur: COUL.platine, sousEns: 'Console d\'étagère',
        debit: { sec: 'P25x4', L: 260, coupe: '90° / 90°, soudée en L (100 + 150)', usin: '2 trous Ø6,5 entraxe 30' },
        formes: [box(x, D - a, zb + 1240, 4, 25, 60), box(x, 375, zb + 1275, 4, 150, 25)] });
      ajTrou(Fc, 'ar', 1255, 'M6', 'console'); ajTrou(Fc, 'ar', 1285, 'M6', 'console');
      b.q('visM6', 2, 'Vis CHC M6×16 zinguée + rondelle plate M6', 'consoles');
    });
    b.add({ nom: 'Étagère à épices et huiles', cat: 'panneau', couleur: COUL.cp15, mat: 'Contreplaqué 15 mm',
      debit: { ep: 15, L: 992, l: 150, usin: 'baguette de rebord 20 mm collée devant ; vernis PU' },
      info: 'Huiles à gauche, au-dessus de la zone induction, pas au-dessus du réchaud',
      forme: box(529, 375, zb + 1300, 992, 150, 15) });
    b.add({ nom: 'Barre aimantée à couteaux', cat: 'equip', couleur: '#555b62', forme: box(1180, 512, zb + 1170, 300, 13, 40) });
    b.add({ nom: 'Bloc 2 prises 16 A avec interrupteur', cat: 'equip', couleur: '#f1f1ee', info: 'À plus de 1 m de la bouteille ; ne jamais brancher induction et réchaud sur une multiprise',
      forme: box(1480, 505, zb + 860, 45, 40, 140) });

    // équipements
    b.set({ etape: 7, module: 0 });
    const zp = zb + 382, B_ = HYP.bouteille;
    b.add({ nom: 'Bouteille de gaz 5 kg', cat: 'equip', couleur: '#1f5aa6', info: HYP.bouteille.txt,
      formes: [cyl('z', cx, cy, zp, B_.d / 2, B_.hCorps, 24), cyl('z', cx, cy, zp + B_.hCorps, 95, 20, 20), cyl('z', cx, cy, zp + B_.hCorps + 20, 80, 40, 18)] });
    b.add({ nom: 'Brûleur + support casserole alu (type Pro Gaz)', cat: 'equip', couleur: '#b8bec5', info: HYP.bruleur.txt,
      formes: [cyl('z', cx, cy, zp + 370, 14, 20, 10), cyl('z', cx, cy, zp + 390, 45, 40, 16), box(cx - 165, cy - 9, zp + 440, 330, 18, 12), box(cx - 9, cy - 165, zp + 440, 18, 330, 12), { t: 'anneau', x: cx, y: cy, z: zp + 446, r1: 98, r2: 110, h: 8, n: 24 }] });
    b.add({ nom: 'Plaque induction BOMA monoplace', cat: 'equip', couleur: '#17191c', info: HYP.induction.txt,
      formes: [box(500 + 95, 90, zb + 788, 290, 360, 60), cyl('z', 500 + 240, 250, zb + 848, 85, 2, 24)] });
    b.add({ nom: 'Réchaud électrique monoplace', cat: 'equip', couleur: '#e7e4dc', info: HYP.rechaud.txt,
      formes: [box(1000, 260, zb + 771.5, 270, 260, 75), cyl('z', 1135, 390, zb + 846.5, 92, 10, 24)] });
    b.add({ nom: 'Zone de dépose casserole chaude', cat: 'equip', couleur: '#9aa3ab', info: 'Fond du bac inox : 280 × 270 mm libres à l\'avant droit',
      forme: box(1255, -10, zb + 771.6, 280, 255, 0.6) });
    b.add({ nom: 'Couverture anti-feu (au mur)', cat: 'equip', couleur: '#b3261e', forme: box(-270, murY - 45, 900, 220, 45, 300) });

    // rangement
    b.set({ etape: 8, module: 0 });
    b.add({ nom: 'Casserole en cours de cuisson', cat: 'equip', couleur: '#8f969d', formes: [cyl('z', cx, cy, zp + 454, 110, 130, 22), box(cx + 105, cy - 10, zp + 540, 120, 20, 14)] });
    b.add({ nom: 'Marmite', cat: 'equip', couleur: '#7d848b', forme: cyl('z', 250, 275, zb + 98, 140, 180, 22) });
    b.set({ module: 1 });
    [[650, 260, 120, 160], [900, 260, 110, 120], [1150, 260, 100, 110], [1380, 260, 95, 150]].forEach(([x, y, r, h]) => b.add({ nom: 'Casserole', cat: 'equip', couleur: '#8f969d', forme: cyl('z', x, y, zb + 98, r, h, 20) }));
    b.add({ nom: 'Poêle', cat: 'equip', couleur: '#2e3135', formes: [cyl('z', 650, 260, zb + 438, 125, 45, 22), box(770, 248, zb + 465, 170, 24, 14)] });
    b.add({ nom: 'Pile de couvercles', cat: 'equip', couleur: '#aab1b8', forme: cyl('z', 1020, 260, zb + 438, 115, 60, 22) });
    b.add({ nom: 'Saladier / passoire', cat: 'equip', couleur: '#cfd5da', forme: cyl('z', 1300, 260, zb + 438, 120, 110, 20) });
    for (let k = 0; k < 7; k++) {
      const x = 560 + k * 85;
      b.add({ nom: ['Louche', 'Spatule', 'Écumoire', 'Fouet', 'Pince', 'Cuillère en bois', 'Spatule souple'][k], cat: 'equip', couleur: k === 5 ? '#b78a55' : '#9aa1a8',
        formes: [box(x - 1, 520, zb + 1110, 2, 3, 30), box(x - 6, 512, zb + 840, 12, 6, 270), box(x - 22, 505, zb + 815, 44, 10, 50)] });
    }
    b.q('crochetS', 7, 'Crochet en S inox 60 mm', 'barre à ustensiles');
    [[560, '#d9a441'], [640, '#6b8f3a'], [720, '#a33b2b'], [800, '#e8dfc5'], [880, '#d9a441']].forEach(([x, c], k) => b.add({ nom: k < 2 ? 'Bouteille d\'huile' : 'Pot à épices', cat: 'equip', couleur: c, forme: cyl('z', x, 450, zb + 1315, k < 2 ? 38 : 30, k < 2 ? 280 : 100, 14) }));

    b.finaliser();
    return {
      code: 'C', nom: 'Station de cuisson et rangement', court: 'Station cuisson',
      dims: { L: 1550, P: 570, H: zb + 1400 }, encombrement: '1550 × 570 × 1420 mm ; plan de travail à 808 mm du sol',
      tube: 'T25', murY, sol: { x0: -400, x1: 1950, y0: -500, y1: murY }, murH: 2200,
      modules: [{ code: 'G', nom: 'Module gaz', x: 0, w: 500 }, { code: 'E', nom: 'Module cuisson électrique', x: 500, w: 1050 }],
      typesCadre: b.typesCadre, parts: b.parts, quinc: b.quinc,
      niveaux: { face: [0, zb, zb + 80, zb + 382, zb + 420, zb + 770, zb + 788, zb + 1150, zb + 1300, zb + 1400] },
      cotesH: [0, 500, 980, 1550],
      etapes: [
        { t: 'Module gaz : cadres et lisses arrière', d: 'Visser les vérins sous les cadres FgG et FgD (FgD porte le montant arrière rehaussé à 1130 mm, il se place à droite). Boulonner la lisse arrière basse et la lisse arrière haute.', ctrl: ['FgD à droite, montant haut à l\'arrière', 'Diagonales contrôlées'] },
        { t: 'Module gaz : plateau réglable et collier', d: 'Choisir la hauteur du plateau (3 crans : 340 / 400 / 460 mm du sol) pour que le support de casserole arrive à 870 mm environ, à la hauteur de la plaque induction. Boulonner les deux traverses porte-plateau, poser le plateau tôle, puis la lisse porte-collier et le collier.', ctrl: ['Support de casserole à ±20 mm du dessus de la plaque induction', 'Collier à mi-hauteur du corps de bouteille'] },
        { t: 'Module électrique : cadres, lisses et traverses sous plan', d: 'Assembler les deux cadres Fc avec les lisses avant haute, arrière haute et arrière basse, puis les trois traverses sous plan : la traverse médiane (jonction bois / inox) et les deux traverses qui portent le bac inox (4 vis M6 chacune, dans les écrous à sertir des lisses).', ctrl: ['Dessus des lisses et des traverses dans le même plan (règle de 1 m)'] },
        { t: 'Module électrique : barre à ustensiles et lisse haute', d: 'Boulonner la barre à ustensiles (z = 1170 du sol) et la lisse haute arrière entre les montants rehaussés.', ctrl: ['Serrage 8 N·m'] },
        { t: 'Liaison, niveau, ancrage et crédence', d: 'Accoler les modules, passer les 4 boulons M6×60, régler les vérins pour un plan parfaitement horizontal. Fixer la crédence aluminium au mur, puis visser les 4 équerres murales et les cheviller.', ctrl: ['Niveau du plan à ±1 mm/m', 'Aucun mouvement en poussant le haut des montants'] },
        { t: 'Tablettes, plan bois et bac inox', d: 'Poser les tablettes 18 mm, le plan contreplaqué verni (zone induction) et le bac inox de la zone chaude. Visser le plan par dessous.', ctrl: ['Bac inox posé sans bois dessous', 'Plan bien appuyé sur la traverse médiane'] },
        { t: 'Écran thermique, étagère, barre aimantée, prises', d: 'Boulonner l\'écran galvanisé sur le cadre FgD. Poser les consoles et l\'étagère à épices. Fixer la barre aimantée et le bloc 2 prises sur le montant arrière droit, le plus loin possible de la bouteille.', ctrl: ['Prises à plus de 1 m de la bouteille', 'Câbles hors de portée des flammes'] },
        { t: 'Mise en place des appareils', d: 'Placer la bouteille sur le plateau, fermer le collier (sangle). Monter le brûleur et son support alu. Poser la plaque BOMA sur le plan bois (50 mm libres autour, ne rien glisser dessous) et le réchaud sur le bac inox, en arrière. Contrôler l\'étanchéité du brûleur à l\'eau savonneuse.', ctrl: ['Pas de bulles au test à l\'eau savonneuse', 'Aucune étagère à moins de 750 mm au-dessus du brûleur', 'Couverture anti-feu accessible'] },
        { t: 'Rangement et mise en service', d: 'Marmites sous la bouteille, casseroles et poêles sur les tablettes, ustensiles sur la barre à crochets, huiles à gauche de l\'étagère.', ctrl: ['Rien de combustible à moins de 300 mm de la flamme', 'Robinet de bouteille fermé après chaque usage'] }
      ]
    };
  }

  /* ------------------------------------------------------------------ */
  const MEUBLES = { A: dressing(), B: etagere(), C: station() };

  /* Scène combinée : implantation cuisine (B à droite de C) */
  const IMPLANTATION = {
    code: 'K', nom: 'Implantation cuisine (B + C)', court: 'Cuisine B + C',
    composants: [{ m: 'C', dx: 0, dy: 0, dz: 0 }, { m: 'B', dx: 1800, dy: 565 - 284, dz: 1250 }],
    murY: 565, sol: { x0: -500, x1: 3000, y0: -600, y1: 565 }, murH: 2400
  };

  const MODELE = { SECTIONS, COUL, HYP, MEUBLES, IMPLANTATION, version: 'Indice A', date: '24/11/2026' };
  if (typeof module !== 'undefined' && module.exports) module.exports = MODELE;
  root.MODELE = MODELE;
})(typeof window !== 'undefined' ? window : globalThis);
