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

  // Automate
  if (window.AA && AA.Ladder) AA.Ladder.selfTest(log, eq);
  // Défis
  if (window.AA && AA.Defis) AA.Defis.selfTest(log, eq);
  if (window.AA && AA.Projets) AA.Projets.selfTest(log, eq);
  if (window.AA && AA.Labo) AA.Labo.selfTest(log, eq);

  const h = document.createElement('h2');
  h.textContent = `${pass} réussis, ${fail} échoués`;
  h.className = fail ? 'ko' : 'ok';
  document.title = fail ? 'ECHEC ' + fail : 'OK ' + pass;
  out.prepend(h);
})();
