/* Tests automatiques : comportement électrique des schémas, automate, générateurs de défis. */
(function () {
  const out = document.getElementById('out');
  let pass = 0, fail = 0;
  const log = (ok, msg) => { const s = document.createElement('span'); s.className = ok ? 'ok' : 'ko'; s.textContent = (ok ? '✔ ' : '✘ ') + msg + '\n'; out.appendChild(s); ok ? pass++ : fail++; };
  const eq = (a, b, msg) => log(JSON.stringify(a) === JSON.stringify(b), msg + (JSON.stringify(a) === JSON.stringify(b) ? '' : `  (obtenu ${JSON.stringify(a)}, attendu ${JSON.stringify(b)})`));
  const { Sim } = window.AASim, C = window.AACircuits.C;
  const run = (s, t) => { for (let i = 0; i < t * 50; i++) s.step(0.02); };

  // Intégrité de tous les schémas : chaque borne d'organe est touchée par un conducteur ou une source
  for (const id of window.AACircuits.LIST) {
    const c = C[id];
    const pts = new Set();
    c.wires.forEach(w => w.p.forEach(([x, y]) => pts.add(x + ',' + y + ',' + w.n)));
    c.wires.forEach(w => { for (let i = 0; i < w.p.length - 1; i++) { const [x1, y1] = w.p[i], [x2, y2] = w.p[i + 1]; if (x1 !== x2 && y1 !== y2) log(false, id + ' : segment non orthogonal ' + w.n); } });
    let missing = [];
    const onWire = (x, y, n) => c.wires.some(w => w.n === n && w.p.some((q, i) => {
      if (i === 0) return false; const [x1, y1] = w.p[i - 1], [x2, y2] = q;
      return (x1 === x2 && x === x1 && y >= Math.min(y1, y2) && y <= Math.max(y1, y2)) || (y1 === y2 && y === y1 && x >= Math.min(x1, x2) && x <= Math.max(x1, x2));
    }));
    c.parts.forEach(p => window.AASim.termsOf(p).forEach(t => { if (!onWire(t.x, t.y, t.net)) missing.push(p.id + '.' + t.k + '(' + t.net + ')'); }));
    c.sources.forEach(s => { if (!onWire(s.x, s.y, s.net)) missing.push('source ' + s.label); });
    log(!missing.length, id + ' : toutes les bornes sont raccordées' + (missing.length ? ' — manquantes : ' + missing.join(', ') : ''));
    // Les points de jonction doivent être sur un conducteur
    (c.dots || []).forEach(([x, y]) => { if (!c.wires.some(w => onWire.call(null, x, y, w.n))) log(false, id + ' : point ' + x + ',' + y + ' hors conducteur'); });
  }

  // Simple allumage
  let s = new Sim(C.simple);
  eq(s.lamp.E1, false, 'simple : lampe éteinte au repos');
  s.toggle('S1'); eq(s.lamp.E1, true, 'simple : S1 fermé -> lampe allumée');
  s.toggle('Q1'); eq(s.lamp.E1, false, 'simple : Q1 ouvert -> lampe éteinte');
  eq(s.measure('l2', 'N', 'V').text, '0.0', 'simple : 0 V en aval de Q1 ouvert');
  s.toggle('Q1');
  eq(s.measure('l1', 'N', 'V').text, '231', 'simple : 230 V entre l1 et N');

  // Va-et-vient : table de vérité
  s = new Sim(C.vaetvient);
  const vv = [];
  for (const a of [1, 2]) for (const b of [1, 2]) { s.byId.SA1.st.pos = a; s.byId.SA2.st.pos = b; s.solve(); vv.push(s.lamp.E1 ? 1 : 0); }
  eq(vv, [0, 1, 1, 0], 'va-et-vient : allumée quand les commutateurs sont en positions différentes (navettes croisées)');
  // une commutation change toujours l'état
  s.byId.SA1.st.pos = 1; s.byId.SA2.st.pos = 1; s.solve(); const before = s.lamp.E1; s.toggle('SA2'); log(before !== s.lamp.E1, 'va-et-vient : basculer SA2 change l\'état');

  // Télérupteur
  s = new Sim(C.telerupteur);
  s.press('S2', true); s.press('S2', false); eq(s.lamp.E1, true, 'télérupteur : 1re impulsion allume');
  s.press('S3', true); s.press('S3', false); eq(s.lamp.E1, false, 'télérupteur : 2e impulsion éteint');

  // Démarrage direct
  s = new Sim(C.dol);
  eq(s.snapshot().motors.M1, 'stop', 'DOL : moteur arrêté au repos');
  s.press('S2', true); eq(s.coil.KM1, true, 'DOL : S2 -> KM1 collé');
  s.press('S2', false); eq(s.coil.KM1, true, 'DOL : auto-maintien après relâchement de S2');
  eq(s.snapshot().motors.M1, 'run+', 'DOL : moteur en marche sens horaire');
  eq(s.lamp.H1, true, 'DOL : voyant marche H1 allumé');
  log(s.flow.has('c4') && s.flow.has('c3') && !s.flow.has('c6'), 'DOL : flux de courant dans la branche de KM1, pas dans celle de H2');
  eq(s.measure('pa1', 'pa2', 'V').text, '400', 'DOL : 400 V entre phases');
  eq(s.measure('L', 'N', 'V').text, '231', 'DOL : 230 V (231) phase-neutre');
  s.press('S1', true); s.press('S1', false); eq(s.coil.KM1, false, 'DOL : S1 arrête');
  // surcharge
  s.press('S2', true); s.press('S2', false); s.setFault('F2', 'overload'); run(s, 5);
  eq(s.byId.F2.st.tripped, true, 'DOL : surcharge -> F2 déclenche');
  eq(s.coil.KM1, false, 'DOL : F2 95-96 coupe KM1');
  eq(s.lamp.H2, true, 'DOL : voyant défaut H2');
  s.clearFaults(); s.toggle('F2'); eq(s.byId.F2.st.tripped, true, 'DOL : F2 encore chaud, réarmement refusé');
  run(s, 4); s.toggle('F2'); eq(s.byId.F2.st.tripped, false, 'DOL : réarmement après refroidissement');
  // panne bobine coupée : tension aux bornes mais pas de collage
  s.setFault('KM1', 'open'); s.press('S2', true);
  eq(s.coil.KM1, false, 'DOL : bobine coupée ne colle pas');
  eq(s.measure('c4', 'N', 'V').text, '231', 'DOL : bobine coupée -> 230 V à ses bornes (diagnostic)');
  s.press('S2', false); s.clearFaults();
  // contact 13-14 coupé : pas d'auto-maintien
  s.setFault('KM1.13', 'open'); s.press('S2', true); s.press('S2', false);
  eq(s.coil.KM1, false, 'DOL : 13-14 coupé -> pas d\'auto-maintien');
  s.clearFaults();
  // mesure de résistance sous tension
  eq(!!s.measure('c1', 'N', 'R').danger, true, 'DOL : ohmmètre sous tension -> danger signalé');
  s.toggle('F1'); s.resetAll(); s.byId.F1.st.blown = true; s.solve();
  eq(s.measure('c4', 'N', 'R').text, '480.0', 'DOL : F1 retiré, résistance bobine KM1 = 480 Ω');
  // Monophasé : un pôle KM usé
  s = new Sim(C.dol); s.setFault('KM1:P', 'pole'); s.press('S2', true); s.press('S2', false);
  eq(s.snapshot().motors.M1, 'mono', 'DOL : pôle usé -> marche en monophasé');
  run(s, 4); eq(s.byId.F2.st.tripped, true, 'DOL : monophasé -> F2 déclenche');

  // Inversion
  s = new Sim(C.inversion);
  s.press('S2', true); s.press('S2', false); eq(s.snapshot().motors.M1, 'run+', 'Inversion : marche avant');
  s.press('S3', true); eq(s.coil.KM2, false, 'Inversion : verrouillage empêche KM2'); s.press('S3', false);
  s.press('S1', true); s.press('S1', false); s.press('S3', true); s.press('S3', false);
  eq(s.snapshot().motors.M1, 'run-', 'Inversion : marche arrière (sens inversé)');
  // verrouillage supprimé (contacts 21-22 shuntés) -> court-circuit -> Q1 déclenche
  s = new Sim(C.inversion); s.setFault('KM1.21', 'stuck'); s.setFault('KM2.21', 'stuck');
  s.press('S2', true); s.press('S2', false); s.press('S3', true); s.press('S3', false);
  eq(s.byId.Q1.st.tripped, true, 'Inversion : sans verrouillage, les deux contacteurs collés -> court-circuit, Q1 déclenche');
  eq(s.byId.F1.st.blown, false, 'Inversion : le fusible de commande F1 reste intact (sélectivité de la bonne protection)');

  // Étoile-triangle
  s = new Sim(C.etoile);
  s.press('S2', true); s.press('S2', false); run(s, 1);
  eq(s.snapshot().motors.M1, 'run+Y', 'Étoile-triangle : démarrage en étoile');
  eq([s.coil.KM1, s.coil.KM2, s.coil.KM3], [true, true, false], 'Étoile-triangle : KM1 + KM2 collés, KM3 au repos');
  eq(Math.round(s.measure('pc1', 'm4', 'V').value), 231, 'Étoile-triangle : 230 V par enroulement en étoile');
  let both = false; for (let i = 0; i < 250; i++) { s.step(0.02); if (s.coil.KM2 && s.coil.KM3) both = true; }
  eq(s.snapshot().motors.M1, 'run+D', 'Étoile-triangle : passage en triangle après la temporisation');
  log(!both, 'Étoile-triangle : KM2 et KM3 jamais fermés ensemble pendant la transition');
  eq(Math.round(s.measure('pc1', 'm4', 'V').value), 400, 'Étoile-triangle : 400 V par enroulement en triangle');
  s.press('S1', true); s.press('S1', false); run(s, 1);
  eq([s.coil.KM1, s.coil.KM2, s.coil.KM3, s.timer.KA1.done], [false, false, false, false], 'Étoile-triangle : arrêt complet et temporisation réinitialisée');
  s = new Sim(C.etoile); s.setFault('KA1.55', 'stuck'); s.press('S2', true); s.press('S2', false); run(s, 6);
  eq(s.snapshot().motors.M1, 'run+Y', 'Étoile-triangle : contact 55-56 soudé → le moteur reste en étoile (verrouillage KM2.21 bloque KM3)');
  s = new Sim(C.etoile); s.setFault('KA1.55', 'stuck'); s.setFault('KM2.21', 'stuck'); s.press('S2', true); s.press('S2', false); run(s, 6);
  eq(s.byId.Q1.st.tripped, true, 'Étoile-triangle : sans verrouillage, étoile + triangle ensemble → court-circuit, Q1 déclenche');

  // Leçons d'automate : les solutions annoncées passent bien les tests de la leçon
  if (window.AA && AA.Ladder && AA.L && AA.L.n6m3l1) {
    const H = { t: 'H' }, c = (t, a, p) => (p != null ? { t, a, p } : { t, a }), E = null;
    const net = (rows, v) => ({ rows: rows.length, cells: rows, v: v || [] });
    const SOL = {
      n6m1l3: [net([[c('NO', 'I0.0'), H, H, H, H, H, c('C', 'Q0.0')]])],
      n6m3l1: [net([[c('NO', 'I0.0'), c('NO', 'I0.1'), H, H, H, H, c('C', 'Q0.0')]]), net([[c('NO', 'I0.0'), H, H, H, H, H, c('C', 'Q0.1')], [c('NO', 'I0.1'), E, E, E, E, E, E]], ['0,1'])],
      n6m3l2: [net([[c('NO', 'I0.1'), c('NO', 'I0.0'), H, H, H, H, c('C', 'Q0.0')], [c('NO', 'Q0.0'), E, E, E, E, E, E]], ['0,1'])],
      n6m3l3: [net([[c('NO', 'I0.2'), H, H, H, H, H, c('S', 'Q0.1')]]), net([[c('NO', 'I0.3'), c('NC', 'I0.2'), H, H, H, H, c('R', 'Q0.1')]])],
      n6m3l4: [net([[c('P', 'I0.0'), H, H, H, H, H, c('C', 'M0.0')]]), net([[c('NO', 'M0.0'), c('NC', 'Q0.0'), H, H, H, H, c('C', 'Q0.0')], [c('NC', 'M0.0'), c('NO', 'Q0.0'), E, E, E, E, E]], ['0,2'])],
      n6m3l5: [net([[c('NO', 'I0.0'), H, H, H, H, H, c('TON', 'T0', 2)]]), net([[c('NO', 'T0'), H, H, H, H, H, c('C', 'Q0.0')]])],
      n6m3l6: [net([[c('NO', 'I0.0'), H, H, H, H, H, c('CTU', 'C0', 4)]]), net([[c('NO', 'I0.1'), H, H, H, H, H, c('R', 'C0')]]), net([[c('NO', 'C0'), H, H, H, H, H, c('C', 'Q0.0')]])]
    };
    Object.keys(SOL).forEach(id => {
      const blk = AA.L[id].screens.flat().find(b => b.plc);
      const r = AA.Ladder.check(SOL[id], blk.plc.test);
      log(r.ok, `Leçon ${id} : la solution annoncée réussit le test ${r.ok ? '' : '— ' + r.msg}`);
      const empty = [net([[E, E, E, E, E, E, E]])];
      log(!AA.Ladder.check(empty, blk.plc.test).ok, `Leçon ${id} : un programme vide est refusé`);
    });
  }

  // Double allumage et minuterie
  s = new Sim(C.double);
  s.toggle('S1'); eq([s.lamp.E1, s.lamp.E2], [true, false], 'Double allumage : S1 allume seulement le groupe 1');
  s.toggle('S1.2'); eq([s.lamp.E1, s.lamp.E2], [true, true], 'Double allumage : les deux groupes indépendants');
  s = new Sim(C.minuterie);
  s.press('S2', true); run(s, 0.2); s.press('S2', false);
  eq(s.lamp.E1, true, 'Minuterie : une impulsion allume');
  run(s, 5); eq(s.lamp.E1, true, 'Minuterie : toujours allumé à 5 s (durée 8 s)');
  s.press('S3', true); run(s, 0.2); s.press('S3', false); run(s, 5);
  eq(s.lamp.E1, true, 'Minuterie : un nouvel appui relance la durée');
  run(s, 4); eq(s.lamp.E1, false, 'Minuterie : extinction automatique après la durée');

  // Instruments et courbes (visualisations)
  if (AA.VIS && AA.VIS.dmmFormat) {
    const F = (v, r, u) => { const o = AA.VIS.dmmFormat(v, r, u); return o === 'OL' ? 'OL' : o.txt + ' ' + o.unit; };
    eq([F(12, 60, 'V'), F(230, 600, 'V'), F(5.5, 6, 'V'), F(0.2345, 0.6, 'V'), F(400, 1000, 'V'), F(7, 6, 'V')], ['12.00 V', '230.0 V', '5.500 V', '234.5 mV', '400 V', 'OL'], 'Multimètre 6 000 points : résolution selon le calibre, OL au-delà');
    eq([F(0.0255, 0.06, 'A'), F(8.7, 10, 'A'), F(470, 600, 'Ω'), F(4700, 6000, 'Ω')], ['25.50 mA', '8.70 A', '470.0 Ω', '4.700 kΩ'], 'Multimètre : courant et résistance avec les bons préfixes');
    const cb = AA.VIS.cbTime;
    log(cb(1.1, 'C').zone === 'none' && cb(1.5, 'C').zone === 'th' && cb(12, 'C').zone === 'mag' && cb(7, 'C').zone === 'maybe', 'Disjoncteur C : rien à 1,1 In, thermique à 1,5 In, incertain à 7 In, magnétique à 12 In');
    const t255 = cb(2.55, 'C').t;
    log(t255 > 1 && t255 < 60, `Disjoncteur : à 2,55 In le temps (${AA.fmt(t255, 1)} s) est dans la plage normalisée 1-60 s`);
    log(cb(4, 'B').zone === 'maybe' && cb(6, 'B').zone === 'mag' && cb(6, 'D').zone === 'th', 'Courbes B et D : seuils magnétiques 3-5 In et 10-20 In');
    const th = AA.VIS.thTime;
    log(th(7.2, 10) >= 4 && th(7.2, 10) <= 10 && th(7.2, 20) <= 20 && th(7.2, 30) <= 30 && th(1.05, 10) === Infinity, 'Relais thermique : classes 10/20/30 respectées à 7,2 Ir, pas de déclenchement à 1,05 Ir');
  }

  // Électrotechnique (n4) et conception (n5) : valeurs recalculées à la main
  if (window.AA && AA.ELEC && AA.DESIGN) {
    const E = AA.ELEC, DS = AA.DESIGN, near = (a, b, rel) => Math.abs(a - b) <= Math.abs(b) * (rel || 0.005);
    const z = E.rlc(40, 0.1, 0, 50, 230);
    log(near(z.XL, 31.416) && near(z.Z, 50.87) && near(z.phi * 180 / Math.PI, 38.15), `R-L série 40 Ω / 100 mH : X_L = ${AA.fmt(z.XL, 2)} Ω, Z = ${AA.fmt(z.Z, 2)} Ω, φ = ${AA.fmt(z.phi * 180 / Math.PI, 1)}°`);
    const zc = E.rlc(10, 0.1, 101.32, 50, 230);
    log(Math.abs(zc.phi) < 0.01 && near(zc.Z, 10, 0.01), 'R-L-C à la résonance (L = 100 mH, C = 101,3 µF, 50 Hz) : Z = R, courant en phase');
    const xo = Math.sqrt(600 / 6500), eo = E.transfo(630000, 600, 6500, xo, 0.9).eta;
    log(eo > E.transfo(630000, 600, 6500, xo - 0.05, 0.9).eta && eo > E.transfo(630000, 600, 6500, xo + 0.05, 0.9).eta, `Transformateur : rendement maximal à x = √(P0/Pk) = ${AA.fmt(xo * 100, 1)} %`);
    eq([E.clock('Dyn11'), E.clock('Yy0'), E.clock('Dyn5'), E.clock('Yd11')], [11, 0, 5, 11], 'Indices horaires des couplages courants');
    const as = E.async({ Pabs: 1000, Pfs: 30, Pjs: 40, g: 0.04, Pm: 15 });
    log(near(as.Ptr, 930) && near(as.Pjr, 37.2) && near(as.Pu, 877.8), 'Bilan moteur asynchrone : Ptr = 930 W, Pjr = 37,2 W, Pu = 877,8 W');
    const dc = E.dc({ U: 220, R: 1.2, k: 1.3, T: 10 });
    log(near(dc.I, 7.692) && near(dc.E, 210.77) && near(dc.n, 1548.2), `Moteur à courant continu : I = ${AA.fmt(dc.I, 2)} A, E = ${AA.fmt(dc.E, 1)} V, n = ${AA.fmt(dc.n, 0)} tr/min`);
    const it = DS.iccTransfo(630, 4), ic0 = DS.icc({ kva: 630, ucc: 4, L: 0, S: 95 }), ic50 = DS.icc({ kva: 630, ucc: 4, L: 50, S: 95 });
    log(near(it, 22180, 0.003) && ic0 < it && ic0 > 20500 && ic50 < ic0, `Icc 630 kVA 4 % : ${AA.fmt(it / 1000, 1)} kA aux bornes (${AA.fmt(ic0 / 1000, 1)} kA avec le réseau amont, ${AA.fmt(ic50 / 1000, 1)} kA à 50 m)`);
    log(near(DS.lMax({ S: 2.5, m: 1, Im: 160 }), 62.5) && near(DS.iMin({ S: 2.5, m: 1, L: 62.5 }), 160), 'TN : longueur maximale 62,5 m pour C16 en 2,5 mm² (méthode conventionnelle)');
    log(near(DS.sMin(6000, 0.1, 115), 16.5, 0.003), 'Contrainte thermique : 6 kA pendant 0,1 s, PVC → 16,5 mm²');
    eq([DS.ks(1), DS.ks(3), DS.ks(4), DS.ks(7), DS.ks(12)], [1, 0.9, 0.8, 0.7, 0.6], 'Facteurs de simultanéité IEC 61439-2');
    const b = DS.bilan([true, false, false, false, false, false, false, false], false);
    log(near(b.P, 22.5) && near(b.S, 22.5 / 0.85) && b.tr === 100, `Bilan : compresseur seul 30 kW × 0,75 → S = ${AA.fmt(b.S, 1)} kVA, transformateur ${b.tr} kVA`);
    const sI = AA.VIS.startI;
    log(sI('dol', 0) === 7 && near(sI('dol', 0, { r: 5.6 }), 5.6) && near(sI('yd', 0, { r: 6 }), 2) && sI('ss', 10, { lim: 4 }) === 1, 'Démarrages : direct = Id/In, étoile-triangle = 1/3, progressif limité puis In');
  }
  if (window.AA && AA.ELECDEFI && AA.Defis && AA.Defis.TYPES.electrotech) {
    const T = AA.Defis.TYPES.electrotech, X = AA.ELECDEFI; let allOk = true, kinds = new Set(), sigs = new Set();
    for (let i = 0; i < 90; i++) {
      const lvl = 1 + (i % 5), inst = T.gen(AA.rng('e' + i), lvl); kinds.add(inst.k); sigs.add(inst.sig);
      if (inst.steps.length !== Math.min(X.count(lvl), X.scenarios[inst.k](AA.rng('e' + i)).steps.length)) allOk = false;
      inst.steps.forEach(s => { if (!(isFinite(s.a) && s.a > 0 && X.ok(s.a, s.a, s.tol) && !X.ok(s.a * 1.05, s.a, s.tol))) allOk = false; });
    }
    log(allOk && kinds.size === 5 && sigs.size > 40, `Défi électrotechnique : 90 études, 5 types, ${sigs.size} énoncés distincts, réponses exactes acceptées et ± 5 % refusées`);
    eq([X.parse('12,5'), X.parse(' 1 250 '), isNaN(X.parse(''))], [12.5, 1250, true], 'Défi électrotechnique : saisie avec virgule ou espaces');
  }

  // Grafcet (IEC 60848)
  if (window.AA && AA.GRAFCET) {
    const G = AA.GRAFCET, A = g => [...g.active].sort().join(',');
    let g = G.create(G.EX.perceuse);
    g.tick(0.02, { dcy: false, a: true }); const s0 = A(g);
    g.tick(0.02, { dcy: true, a: true }); const s1 = A(g), o1 = [...g.outputs()].sort().join();
    g.tick(0.02, { b: true }); const s2 = A(g);
    g.tick(0.02, { a: true }); const s3 = A(g);
    eq([s0, s1, o1, s2, s3], ['0', '1', 'DESC,ROT', '2', '0'], 'Grafcet perçage : étape initiale, franchissements successifs, actions continues');
    g = G.create(G.EX.cuve);
    g.tick(0.02, { dcy: true, bas: true }); const k0 = g.outputs().has('KLAX'), ag0 = g.outputs().has('AGIT');
    g.tick(1.0, {}); const k1 = g.outputs().has('KLAX');
    g.tick(0.02, { haut: true }); const ag2 = g.outputs().has('AGIT'), v2 = g.outputs().has('V1');
    g.tick(2.9, {}); const d1 = g.outputs().has('PRET'); g.tick(0.2, {}); const d2 = g.outputs().has('PRET');
    g.tick(2.8, {}); const st5 = A(g); g.tick(0.2, {}); const st6 = A(g), ag3 = g.outputs().has('AGIT');
    eq([k0, ag0, k1, ag2, v2, d1, d2, st5, st6, ag3], [true, true, false, true, false, false, true, '2', '3', false], 'Grafcet cuve : actions L (limitée), S/R (mémorisées), D (retardée), réceptivité t/X2/6 s');
    g = G.create(G.EX.et);
    g.tick(0.02, { dcy: true }); const e1 = A(g);
    g.tick(0.02, { fp: true }); const e2 = A(g);
    g.tick(0.02, { fm: true }); const e3 = A(g);
    eq([e1, e2, e3], ['1,3', '2,3', '0'], 'Grafcet divergence ET : branches parallèles, attente, convergence (= 1) franchie dès la synchronisation');
    g = G.create(G.EX.tri); g.tick(0.02, { p: true, G: true });
    eq(A(g), '1', 'Grafcet divergence OU : réceptivités exclusives, une seule branche active');
    const q = G.equations(G.EX.perceuse).find(x => x.k === 1);
    eq([q.set, q.rst], ['X0 · (dcy · a)', 'X2'], 'Grafcet → Ladder : SET X1 si X0·dcy·a, RESET X1 si X2');
  }

  // Niveau 7 : analogique et régulation
  if (window.AA && AA.N7) {
    const N = AA.N7, nr = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
    log(nr(N.ptR(0), 100) && nr(N.ptR(100), 138.5055, 0.001) && nr(N.ptT(N.ptR(237.4)), 237.4, 1e-6), `Pt100 (IEC 60751) : 100 Ω à 0 °C, ${AA.fmt(N.ptR(100), 4)} Ω à 100 °C, conversion inverse exacte`);
    log(nr(N.ma(6, 0, 10), 13.6) && nr(N.ma(0, 0, 10), 4) && nr(N.ma(10, 0, 10), 20) && N.maFault(3.5) && N.maFault(21.5) && !N.maFault(4), '4-20 mA : 6 bar sur 0-10 bar → 13,6 mA ; défaut sous 3,6 mA et au-dessus de 21 mA');
    log(nr(N.scale(13824, 0, 27648, 0, 150), 75) && nr(N.scale(5530.6, 5530.6, 27648, 0, 100), 0, 1e-9), 'Mise à l\'échelle : mi-échelle 13 824 → 75 °C ; 4 mA (5 530,6 points) → 0 %');
    const z = N.zn(4, 20); eq([z.Kp, z.Ti, z.Td], [2.4, 10, 2.5], 'Ziegler-Nichols : Kp = 0,6 Ku, Ti = Tu/2, Td = Tu/8');
    const run = (p, sp, T) => { const s = N.pidNew(); let pv = 0; for (let t = 0; t < T; t += 0.05) { const u = N.pidStep(s, p, sp, pv, 0.05).u; pv += (u - pv) / 10 * 0.05; } return { pv, s }; };
    const rP = run({ Kp: 2, Ti: 0, Td: 0 }, 60, 300), rPI = run({ Kp: 2, Ti: 10, Td: 0 }, 60, 300), rW = run({ Kp: 2, Ti: 10, Td: 0 }, 150, 300);
    log(nr(rP.pv, 40, 0.05) && nr(rPI.pv, 60, 0.05) && rW.s.I <= 100 + 1e-9 && nr(rW.pv, 100, 0.05), `PID sur un 1er ordre : P seul laisse un écart (mesure ${AA.fmt(rP.pv, 2)} pour 60), PI l'annule (${AA.fmt(rPI.pv, 2)}), intégrale bornée en butée`);
    let y = 0; for (let k = 0; k < 20; k++) y = N.filt(y, 1, 0.1, 0.9); log(nr(y, 1 - Math.pow(0.9, 20), 1e-9), 'Filtre du 1er ordre : réponse indicielle conforme');
  }

  // Défis Grafcet et réglage PID
  if (window.AA && AA.DEFAUTO && AA.Defis.TYPES.grafcet) {
    const X = AA.DEFAUTO;
    const r1 = X.gfRun('perceuse', [['dcy', 'pulse'], ['a', 'tog'], ['b', 'tog'], ['b', 'tog'], ['a', 'tog']]);
    eq(r1.trace.map(t => t.steps.join(',')), ['1', '1', '2', '2', '0'], 'Défi Grafcet : évolution pas à pas du poste de perçage (cycle réaliste)');
    const r1b = X.gfRun('perceuse', [['dcy', 'pulse'], ['b', 'tog']]);
    eq(r1b.steps.join(','), '0', "Défi Grafcet : si a est encore vrai quand b arrive, l'étape 2 est fugace (retour direct à 0)");
    const r2 = X.gfRun('et', [['fp', 'tog'], ['dcy', 'pulse']]);
    eq([r2.steps.join(','), r2.outs.join(',')], ['2,3', 'MARQ'], 'Défi Grafcet : évolution fugace (fp déjà vrai) franchie dans la même évolution');
    const r3 = X.gfRun('perceuse', [['a', 'tog'], ['dcy', 'pulse'], ['a', 'tog']]);
    eq(r3.steps.join(','), '0', 'Défi Grafcet : appui sur dcy sans effet si la réceptivité (dcy · a) est fausse à cet instant');
    const sigs = new Set(); for (let i = 0; i < 60; i++) sigs.add(X.gfGen(AA.rng('g' + i), 1 + (i % 5)).sig);
    log(sigs.size > 50, `Défi Grafcet : ${sigs.size} énoncés différents sur 60`);
    let ok = true; const t0 = performance.now();
    for (let i = 0; i < 5; i++) { const inst = X.pidGen(AA.rng('p' + i), 1 + i), m = X.simLoop(inst.P, inst.best.Kp, inst.best.Ti, inst.T, 0.2); if (!(m.over <= inst.over && m.settle <= inst.settleMax && m.err < 1 && inst.best.settle < inst.T)) ok = false; }
    log(ok, `Défi PID : le réglage de référence respecte toujours le cahier des charges (5 procédés, ${AA.fmt((performance.now() - t0) / 5, 0)} ms par génération)`);
  }

  // Niveau 8 : variateurs, mouvement, réseaux
  if (window.AA && AA.N8) {
    const N = AA.N8, nr = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
    log(nr(N.busPeak(400), 565.69, 0.01) && nr(N.busAvg(400), 540.19, 0.01), 'Bus continu sous 400 V : 566 V à vide (√2 U), 540 V en moyenne redressée (1,35 U)');
    eq([N.hex(N.rtu([1, 3, 0, 0, 0, 10])), N.hex(N.rtu([0x11, 3, 0, 0x6B, 0, 3]))], ['01 03 00 00 00 0A C5 CD', '11 03 00 6B 00 03 76 87'], 'Modbus RTU : CRC-16 conforme aux exemples de référence');
    eq(N.hex(N.request(1, 16, 1, 2, [10, 258])), '01 10 00 01 00 02 04 00 0A 01 02', 'Modbus : trame d\'écriture de plusieurs registres (fonction 16)');
    const op50 = N.opPoint(50, () => 50), op25 = N.opPoint(25, () => 50);
    log(op50 > 1440 && op50 < 1465 && nr(1500 - op50, 750 - op25, 0.5), `Loi U/f : couple nominal à ${AA.fmt(op50, 0)} tr/min (50 Hz), même glissement en tr/min à 25 Hz (${AA.fmt(op25, 0)} tr/min)`);
    log(nr(N.torque(0, 100).Cmax, 125 / 4) && N.opPoint(80, () => 120) === null, 'Défluxage : couple maximal divisé par 4 à 100 Hz ; calage si la charge dépasse le couple disponible');
    log(nr(N.kin(2, 1500), 24674, 1) && nr(N.encF(1024, 1500), 25600) && nr(N.trs(0.9, 0.8, 0.95), 0.684), 'Énergie cinétique, fréquence codeur, TRS');
  }

  if (window.AA && AA.DEFAUTO && AA.DEFAUTO.mbGen && AA.N8) {
    const X = AA.DEFAUTO, N = AA.N8; let ok = true, exc = 0, sigs = new Set();
    for (let i = 0; i < 120; i++) {
      const inst = X.mbGen(AA.rng('mb' + i), 1 + (i % 5)), f = inst.frame; sigs.add(inst.sig);
      if (N.crc16(f) !== 0) ok = false; // propriété du CRC Modbus : recalculé sur la trame complète, il vaut 0
      if (inst.kind === 'exc') { exc++; if (!(f[1] & 0x80) || f[1] - 0x80 !== inst.steps[1].a || f[2] !== inst.steps[2].a) ok = false; }
      else { if (f[1] !== 3 || f[2] !== (f.length - 5)) ok = false; inst.steps.slice(2).forEach((s, k) => { if (k < f[2] / 2 && s.a !== f[3 + 2 * k] * 256 + f[4 + 2 * k]) ok = false; }); }
    }
    log(ok && exc > 5 && sigs.size > 110, `Défi Modbus : 120 trames (${exc} exceptions), CRC valides, réponses cohérentes avec les octets`);
  }

  // Niveau 9 : maintenance
  if (window.AA && AA.N9) {
    const N = AA.N9, nr = (x, y, e) => Math.abs(x - y) <= (e || 1e-9);
    log(nr(N.pi(500, 1500), 3) && N.piVerdict(0.9) === 'dangereux' && N.piVerdict(1.5) === 'douteux' && N.piVerdict(3) === 'bon' && N.piVerdict(5) === 'très bon', 'Index de polarisation et repères usuels');
    log(nr(N.zsMax(230, 160), 0.9583, 1e-4) && nr(N.ik(230, 0.5), 460), 'Boucle TN : Zs max = 2/3 × 230 / 160 A = 0,958 Ω ; Ik = 460 A pour 0,5 Ω');
    log(nr(N.thd([1, 0.3, 0.4]), 0.5, 1e-12), 'THD : √(0,3² + 0,4²) = 50 %');
    log(nr(N.avail(990, 10), 0.99) && nr(N.series(0.99, 0.99), 0.9801) && nr(N.redund(0.99, 0.99), 0.9999), 'Disponibilité : 99 % → 98,01 % en série, 99,99 % en redondance');
    eq(N.reorder(4, 3, 5), 17, 'Point de commande : 4 × 3 + 5 = 17 pièces');
    const q0 = 0.02, R = t => N.Rins(t, 1000, q0); log(N.pi(R(60), R(600)) > 3 && N.pi(N.Rins(60, 1000, 0.8), N.Rins(600, 1000, 0.8)) < 1.3, "Modèle d'isolement : bobinage sec IP > 3, bobinage humide IP < 1,3");
  }

  // Automate
  if (window.AA && AA.Ladder) AA.Ladder.selfTest(log, eq);
  // Défis
  if (window.AA && AA.Defis) AA.Defis.selfTest(log, eq);
  if (window.AA && AA.Projets) AA.Projets.selfTest(log, eq);
  if (window.AA && AA.Labo) AA.Labo.selfTest(log, eq);
  if (window.AA && AA.SOLAR) AA.SOLAR.selfTest(log, eq);

  // Syntaxe de TOUS les scripts de l'application (une erreur dans un seul fichier casse l'appli)
  (async () => {
    const html = await (await fetch('../index.html', { cache: 'no-store' })).text();
    const srcs = [...html.matchAll(/src="(src\/[^"]+)"/g)].map(m => m[1]);
    const bad = [];
    for (const u of srcs) { const t = await (await fetch('../' + u, { cache: 'no-store' })).text(); try { new Function(t); } catch (e) { bad.push(u + ' : ' + e.message); } }
    log(!bad.length, `Syntaxe : ${srcs.length} scripts de l'application analysés ${bad.length ? '— ' + bad.join(' ; ') : ''}`);
    const hh = document.querySelector('h2'); hh.textContent = `${pass} réussis, ${fail} échoués`; hh.className = fail ? 'ko' : 'ok'; document.title = fail ? 'ECHEC ' + fail : 'OK ' + pass;
  })();

  const h = document.createElement('h2');
  h.textContent = `${pass} réussis, ${fail} échoués`;
  h.className = fail ? 'ko' : 'ok';
  document.title = fail ? 'ECHEC ' + fail : 'OK ' + pass;
  out.prepend(h);
})();
