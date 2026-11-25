/* Ampère Académie — défi « Projet de schéma complet » (de A à Z).
 * À partir d'un long cahier des charges, l'apprenant :
 *  1. choisit pour chaque moteur le mode de démarrage, le réglage du relais thermique et le calibre du disjoncteur ;
 *  2. compose tout le circuit de commande (arrêt d'urgence, protections, marches, verrouillages, temporisations, voyants).
 * Le folio complet (puissance + commande) est généré et simulé ; la recette rejoue les essais du cahier des charges
 * sur la simulation (plusieurs solutions valides possibles). Note : 30 % choix de puissance, 70 % essais. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const E = AA.EDITOR, X = AA.PROJSCHEMA = {};
  X.CAL = [1, 1.6, 2.5, 4, 6.3, 10, 16, 25, 32, 40, 63];
  X.MODES = { dol: 'Démarrage direct (un sens)', inv: 'Deux sens de marche', yd: 'Étoile-triangle' };

  /* ---------- Cahiers des charges ---------- */
  X.SPECS = [
    { id: 'tapis', lvl: 2, title: 'Tapis d\'évacuation et ventilateur d\'extraction',
      text: ['Un atelier de menuiserie veut automatiser l\'évacuation des copeaux : un tapis d\'évacuation M1 (3 kW, 400 V, 6,5 A) et un ventilateur d\'extraction M2 (1,5 kW, 400 V, 3,4 A). Les deux moteurs tournent dans un seul sens. Le circuit de commande est en 230 V, protégé par le fusible F1.',
        '1. Un arrêt d\'urgence S0 (coup de poing à accrochage) arrête les deux moteurs. Son déverrouillage ne doit rien redémarrer.',
        '2. S2 met le tapis en marche (contacteur KM1), S1 l\'arrête. Le tapis reste en marche après le relâchement de S2.',
        '3. S4 met le ventilateur en marche (KM2), S3 l\'arrête. Le ventilateur ne peut fonctionner que si le tapis tourne, et il s\'arrête avec lui.',
        '4. Une surcharge du tapis (relais thermique F2) arrête le tapis, donc aussi le ventilateur, et allume le voyant H1. Une surcharge du ventilateur (relais F3) n\'arrête que le ventilateur.'],
      motors: [{ id: 'M1', name: 'Tapis d\'évacuation', P: 3, In: 6.5, plate: '230/400 V', need: 'dol', roles: { L: 'KM1' }, th: 'F2' }, { id: 'M2', name: 'Ventilateur d\'extraction', P: 1.5, In: 3.4, plate: '230/400 V', need: 'dol', roles: { L: 'KM2' }, th: 'F3' }],
      btns: { S0: ['pbm_nc', 'Arrêt d\'urgence (coup de poing à accrochage)'], S1: ['pb_nc', 'Arrêt du tapis'], S2: ['pb_no', 'Marche du tapis'], S3: ['pb_nc', 'Arrêt du ventilateur'], S4: ['pb_no', 'Marche du ventilateur'] },
      lamps: { H1: ['Voyant de défaut thermique du tapis', 'orange'] },
      contacts: ['KM1.13', 'KM1.23', 'KM2.13', 'F2.95', 'F3.95', 'F2.97'],
      tests: [['press', 'S4'], ['release', 'S4'], ['expect', { KM2: false, M2: 'stop' }, 'Le ventilateur ne démarre pas tant que le tapis est arrêté'],
        ['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true, M1: 'run' }, 'S2 démarre le tapis, qui reste en marche'],
        ['press', 'S4'], ['release', 'S4'], ['expect', { KM2: true, M2: 'run' }, 'Tapis en marche : S4 démarre le ventilateur'],
        ['press', 'S3'], ['release', 'S3'], ['expect', { KM2: false, KM1: true }, 'S3 arrête le ventilateur seul'],
        ['press', 'S4'], ['release', 'S4'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, KM2: false }, 'S1 arrête le tapis, et le ventilateur avec lui'],
        ['press', 'S2'], ['release', 'S2'], ['press', 'S4'], ['release', 'S4'], ['latch', 'S0'], ['expect', { KM1: false, KM2: false }, 'L\'arrêt d\'urgence arrête les deux moteurs'],
        ['latch', 'S0'], ['expect', { KM1: false, KM2: false }, 'Le déverrouillage de l\'arrêt d\'urgence ne redémarre rien'],
        ['press', 'S2'], ['release', 'S2'], ['press', 'S4'], ['release', 'S4'], ['fault', 'M2'], ['wait', 4], ['expect', { KM2: false, KM1: true, H1: false }, 'Surcharge du ventilateur : seul le ventilateur s\'arrête'],
        ['clear', 'M2'], ['wait', 4], ['reset', 'F3'],
        ['fault', 'M1'], ['wait', 4], ['expect', { KM1: false, KM2: false, H1: true }, 'Surcharge du tapis : arrêt et voyant H1 allumé']] },
    { id: 'porte', lvl: 3, title: 'Porte sectionnelle de hangar',
      text: ['Une porte de hangar est manœuvrée par un moteur M1 (0,75 kW, 400 V, 1,9 A) qui doit tourner dans les deux sens : KM1 pour l\'ouverture, KM2 pour la fermeture (deux phases croisées). Commande en 230 V protégée par F1.',
        '1. Un arrêt d\'urgence S0 arrête la porte ; son déverrouillage ne la remet pas en mouvement.',
        '2. S2 commande l\'ouverture, S3 la fermeture, S1 l\'arrêt. Une impulsion suffit : le mouvement continue après le relâchement.',
        '3. La fin de course SQ1 (porte ouverte) arrête l\'ouverture ; la fin de course SQ2 (porte fermée) arrête la fermeture. Porte ouverte, S2 est sans effet.',
        '4. KM1 et KM2 ne doivent jamais être alimentés ensemble ; pour changer de sens, il faut passer par l\'arrêt.',
        '5. Le relais thermique F2 arrête la porte en cas de surcharge.',
        '6. Le voyant H1 est allumé pendant tout mouvement de la porte (ouverture ou fermeture).'],
      motors: [{ id: 'M1', name: 'Moteur de porte', P: 0.75, In: 1.9, plate: '230/400 V', need: 'inv', roles: { L: 'KM1', AR: 'KM2' }, th: 'F2' }],
      btns: { S0: ['pbm_nc', 'Arrêt d\'urgence (coup de poing à accrochage)'], S1: ['pb_nc', 'Arrêt'], S2: ['pb_no', 'Ouverture'], S3: ['pb_no', 'Fermeture'], SQ1: ['ls_nc', 'Fin de course « porte ouverte » (contact à ouverture)'], SQ2: ['ls_nc', 'Fin de course « porte fermée » (contact à ouverture)'] },
      lamps: { H1: ['Voyant « porte en mouvement »', 'orange'] },
      contacts: ['KM1.13', 'KM2.13', 'KM1.21', 'KM2.21', 'KM1.23', 'KM2.23', 'F2.95'],
      tests: [['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true, M1: 'run+', H1: true }, 'S2 : ouverture, voyant H1 allumé'],
        ['press', 'S3'], ['release', 'S3'], ['expect', { KM1: true, KM2: false }, 'Pendant l\'ouverture, S3 est sans effet (verrouillage)'],
        ['press', 'SQ1'], ['expect', { KM1: false, M1: 'stop', H1: false }, 'Porte ouverte (SQ1) : arrêt automatique'],
        ['press', 'S2'], ['release', 'S2'], ['expect', { KM1: false }, 'Porte ouverte : S2 ne relance pas l\'ouverture'],
        ['press', 'S3'], ['release', 'S3'], ['expect', { KM2: true, M1: 'run-', H1: true }, 'S3 : fermeture, le moteur tourne en sens inverse'],
        ['release', 'SQ1'], ['expect', { KM2: true }, 'La porte quitte la position ouverte : la fermeture continue'],
        ['press', 'SQ2'], ['expect', { KM2: false, M1: 'stop' }, 'Porte fermée (SQ2) : arrêt automatique'], ['release', 'SQ2'],
        ['press', 'S2'], ['release', 'S2'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, KM2: false }, 'S1 arrête la porte'],
        ['press', 'S3'], ['release', 'S3'], ['latch', 'S0'], ['expect', { KM1: false, KM2: false }, 'L\'arrêt d\'urgence arrête la porte'], ['latch', 'S0'], ['expect', { KM1: false, KM2: false }, 'Déverrouillage : la porte ne repart pas'],
        ['press', 'S2'], ['release', 'S2'], ['fault', 'M1'], ['wait', 4], ['expect', { KM1: false, M1: 'stop' }, 'Surcharge : F2 arrête la porte']] },
    { id: 'pompe', lvl: 4, title: 'Pompe de forage en étoile-triangle',
      text: ['Une pompe de forage est entraînée par un moteur M1 de 11 kW dont la plaque indique 400/690 V et 21 A en couplage triangle sous 400 V. Pour limiter l\'appel de courant, elle démarre en étoile-triangle : KM1 (ligne), KM2 (étoile), KM3 (triangle) et un relais temporisé au travail KA1 réglé à 3 s. Le relais thermique F2 est placé entre KM1 et le moteur, en amont du couplage. Commande en 230 V protégée par F1.',
        '1. Un arrêt d\'urgence S0 arrête la pompe ; son déverrouillage ne la redémarre pas.',
        '2. Une impulsion sur S2 démarre la pompe en étoile ; après 3 s, elle passe automatiquement en triangle. S1 l\'arrête.',
        '3. KM2 et KM3 ne doivent jamais être alimentés ensemble.',
        '4. Le voyant H1 indique la marche ; le voyant H2 signale le déclenchement du relais thermique F2 et doit rester allumé tant que F2 n\'est pas réarmé.'],
      motors: [{ id: 'M1', name: 'Pompe de forage', P: 11, In: 21, plate: '400/690 V', need: 'yd', roles: { L: 'KM1', Y: 'KM2', D: 'KM3', T: 'KA1' }, th: 'F2', delay: 3 }],
      btns: { S0: ['pbm_nc', 'Arrêt d\'urgence (coup de poing à accrochage)'], S1: ['pb_nc', 'Arrêt'], S2: ['pb_no', 'Marche'] },
      lamps: { H1: ['Voyant de marche', 'green'], H2: ['Voyant de défaut thermique', 'orange'] },
      contacts: ['KM1.13', 'KM1.23', 'KA1.55', 'KA1.67', 'KM2.21', 'KM3.21', 'F2.95', 'F2.97'],
      tests: [['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true, KM2: true, KM3: false, M1: 'Y', H1: true }, 'Une impulsion sur S2 : démarrage en étoile, H1 allumé'],
        ['wait', 1], ['expect', { KM2: true, KM3: false }, 'Toujours en étoile après 1 s'],
        ['wait', 2.5], ['expect', { KM2: false, KM3: true, M1: 'D' }, 'Après 3 s : passage automatique en triangle'],
        ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, KM2: false, KM3: false, M1: 'stop', H1: false }, 'S1 arrête la pompe'],
        ['press', 'S2'], ['release', 'S2'], ['latch', 'S0'], ['expect', { KM1: false, KM2: false, KM3: false }, 'Arrêt d\'urgence pendant le démarrage'], ['latch', 'S0'], ['expect', { KM1: false }, 'Pas de redémarrage au déverrouillage'],
        ['press', 'S2'], ['release', 'S2'], ['wait', 3.5], ['expect', { M1: 'D' }, 'Nouveau démarrage complet jusqu\'au triangle'],
        ['fault', 'M1'], ['wait', 4], ['expect', { KM1: false, KM3: false, H2: true, H1: false }, 'Surcharge : arrêt, H2 allumé, H1 éteint']] },
    { id: 'concassage', lvl: 5, title: 'Ligne de concassage',
      text: ['Une carrière installe une ligne de concassage : un concasseur M1 (15 kW, plaque 400/690 V, 28,5 A en triangle sous 400 V) démarré en étoile-triangle (KM1 ligne, KM2 étoile, KM3 triangle, KA1 temporisé au travail réglé à 3 s, relais thermique F2 en amont du couplage) et un convoyeur d\'alimentation M2 (4 kW, 400 V, 8,2 A) en démarrage direct (KM4, relais thermique F3). Commande en 230 V protégée par F1.',
        '1. Un arrêt d\'urgence S0 arrête toute la ligne ; son déverrouillage ne redémarre rien.',
        '2. S2 démarre le concasseur (étoile, puis triangle après 3 s) ; S1 l\'arrête. Arrêter le concasseur arrête aussi le convoyeur.',
        '3. S4 démarre le convoyeur, S3 l\'arrête. Pour ne pas bourrer le concasseur, le convoyeur ne peut démarrer et fonctionner que lorsque le concasseur tourne en triangle.',
        '4. Une surcharge du concasseur (F2) arrête toute la ligne ; une surcharge du convoyeur (F3) n\'arrête que le convoyeur.',
        '5. Un seul voyant H1 signale un défaut thermique, du concasseur ou du convoyeur, et reste allumé tant que le relais n\'est pas réarmé.'],
      motors: [{ id: 'M1', name: 'Concasseur', P: 15, In: 28.5, plate: '400/690 V', need: 'yd', roles: { L: 'KM1', Y: 'KM2', D: 'KM3', T: 'KA1' }, th: 'F2', delay: 3 }, { id: 'M2', name: 'Convoyeur d\'alimentation', P: 4, In: 8.2, plate: '230/400 V', need: 'dol', roles: { L: 'KM4' }, th: 'F3' }],
      btns: { S0: ['pbm_nc', 'Arrêt d\'urgence (coup de poing à accrochage)'], S1: ['pb_nc', 'Arrêt du concasseur'], S2: ['pb_no', 'Marche du concasseur'], S3: ['pb_nc', 'Arrêt du convoyeur'], S4: ['pb_no', 'Marche du convoyeur'] },
      lamps: { H1: ['Voyant de défaut thermique (F2 ou F3)', 'orange'] },
      contacts: ['KM1.13', 'KA1.55', 'KA1.67', 'KM2.21', 'KM3.21', 'KM3.13', 'KM4.13', 'F2.95', 'F3.95', 'F2.97', 'F3.97'],
      tests: [['press', 'S4'], ['release', 'S4'], ['expect', { KM4: false }, 'Convoyeur interdit tant que le concasseur n\'est pas lancé'],
        ['press', 'S2'], ['release', 'S2'], ['expect', { M1: 'Y' }, 'S2 : démarrage du concasseur en étoile'],
        ['press', 'S4'], ['release', 'S4'], ['expect', { KM4: false }, 'Convoyeur interdit pendant le démarrage en étoile'],
        ['wait', 3.5], ['expect', { M1: 'D' }, 'Passage du concasseur en triangle après 3 s'],
        ['press', 'S4'], ['release', 'S4'], ['expect', { KM4: true, M2: 'run' }, 'Concasseur en triangle : S4 lance le convoyeur'],
        ['press', 'S3'], ['release', 'S3'], ['expect', { KM4: false, M1: 'D' }, 'S3 arrête le convoyeur seul'],
        ['press', 'S4'], ['release', 'S4'], ['fault', 'M2'], ['wait', 4], ['expect', { KM4: false, M1: 'D', H1: true }, 'Surcharge du convoyeur : il s\'arrête, H1 s\'allume, le concasseur continue'],
        ['clear', 'M2'], ['wait', 4], ['reset', 'F3'], ['expect', { H1: false }, 'F3 réarmé : H1 s\'éteint'],
        ['press', 'S4'], ['release', 'S4'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, KM4: false }, 'S1 arrête le concasseur et le convoyeur'],
        ['press', 'S2'], ['release', 'S2'], ['wait', 3.5], ['press', 'S4'], ['release', 'S4'], ['latch', 'S0'], ['expect', { KM1: false, KM3: false, KM4: false }, 'Arrêt d\'urgence : toute la ligne s\'arrête'], ['latch', 'S0'], ['expect', { KM1: false, KM4: false }, 'Déverrouillage : rien ne redémarre'],
        ['press', 'S2'], ['release', 'S2'], ['wait', 3.5], ['press', 'S4'], ['release', 'S4'], ['fault', 'M1'], ['wait', 4], ['expect', { KM1: false, KM4: false, H1: true }, 'Surcharge du concasseur : toute la ligne s\'arrête, H1 allumé']] }
  ];

  /* ---------- Catalogue des éléments d'un cahier des charges ---------- */
  X.catalog = spec => {
    const cat = {}, coils = [], timers = [];
    spec.motors.forEach(m => Object.entries(m.roles).forEach(([r, id]) => { if (r === 'T') timers.push([id, m.delay || 3]); else coils.push([id, { L: 'contacteur de ligne', AR: 'contacteur du sens inverse', Y: 'contacteur étoile', D: 'contacteur triangle' }[r] + ' de ' + m.id]); }));
    coils.forEach(([id, t]) => { cat[id] = { type: 'coil', t: ['A1', 'A2'], u: 230, info: 'Bobine de ' + id + ' (' + t + ')', load: true }; });
    timers.forEach(([id, d]) => { cat[id] = { type: 'coil_ton', t: ['A1', 'A2'], u: 230, delay: d, info: 'Relais temporisé au travail ' + id + ' (' + AA.fmt(d) + ' s)', load: true }; });
    Object.entries(spec.btns).forEach(([id, [type, info]]) => { cat[id] = { type, info, t: /nc$/.test(type) ? ['1', '2'] : ['3', '4'], color: type === 'pbm_nc' ? 'red' : /nc$/.test(type) ? 'red' : 'green' }; });
    Object.entries(spec.lamps).forEach(([id, [info, color]]) => { cat[id] = { type: 'lamp', info, color, load: true }; });
    spec.contacts.forEach(id => {
      const [b, n] = id.split('.'), th = /^F\d/.test(b), tm = timers.some(t => t[0] === b);
      const type = th ? (n === '95' ? 'th_nc' : 'th_no') : tm ? (n === '55' ? 'ton_nc' : 'ton_no') : (n === '21' || n === '31' ? 'nc' : 'no');
      const t2 = { '13': '14', '23': '24', '33': '34', '21': '22', '31': '32', '55': '56', '67': '68', '95': '96', '97': '98' }[n];
      cat[id] = { type, of: b, tag: b, t: [n, t2], info: th ? (n === '95' ? 'Contact à ouverture du relais thermique ' + b : 'Contact à fermeture du relais thermique ' + b + ' (signalisation)') : tm ? (n === '55' ? 'Contact temporisé à ouverture de ' + b : 'Contact temporisé à fermeture de ' + b) : ('Contact à ' + (type === 'nc' ? 'ouverture' : 'fermeture') + ' de ' + b) };
    });
    return cat;
  };
  X.els = spec => { const c = X.catalog(spec); return Object.keys(c); };

  /* ---------- Circuit de puissance ---------- */
  const P = (type, id, x, y, n, extra) => Object.assign({ type, id, x, y, n }, extra || {});
  X.power = (spec, cfg) => {
    const parts = [], wires = [], dots = [];
    let x0 = 4, lastX = 4;
    spec.motors.forEach((m, i) => {
      lastX = x0;
      const mode = cfg[i].mode, R = m.roles, k = `p${i}`, n = s => k + s, W = (net, ...pts) => wires.push({ n: net, p: pts.map(([x, y]) => [x + x0, y]) });
      const L = R.L, Q = 'Q' + (i + 1);
      parts.push(P('breaker3', Q, x0, 8, { a1: 'L1', a2: 'L2', a3: 'L3', b1: n('a1'), b2: n('a2'), b3: n('a3') }, { rating: cfg[i].cal || 16, t: ['1', '2', '3', '4', '5', '6'], info: 'Disjoncteur magnétique de ' + m.id + ' (protection contre les courts-circuits)' }));
      W('L1', [0, 2.5], [0, 6]); W('L2', [2, 3.25], [2, 6]); W('L3', [4, 4], [4, 6]); dots.push([x0, 2.5], [x0 + 2, 3.25], [x0 + 4, 4]);
      [0, 2, 4].forEach((c, j) => { W(n('a' + (j + 1)), [c, 10], [c, 14]); W(n('b' + (j + 1)), [c, 18], [c, 20]); });
      parts.push(P('km3', L + ':P', x0, 16, { a1: n('a1'), a2: n('a2'), a3: n('a3'), b1: n('b1'), b2: n('b2'), b3: n('b3') }, { of: L, t: ['1', '2', '3', '4', '5', '6'] }));
      parts.push(P('thermal3', m.th, x0, 22, { a1: n('b1'), a2: n('b2'), a3: n('b3'), b1: n('c1'), b2: n('c2'), b3: n('c3') }, { motor: m.id, t: ['1', '2', '3', '4', '5', '6'], info: 'Relais thermique de ' + m.id + ' réglé à ' + AA.fmt(cfg[i].ir || 0) + ' A' }));
      let w = 10;
      if (mode === 'inv' && R.AR) {
        parts.push(P('km3', R.AR + ':P', x0 + 7, 16, { a1: n('a1'), a2: n('a2'), a3: n('a3'), b1: n('b3'), b2: n('b2'), b3: n('b1') }, { of: R.AR, t: ['1', '2', '3', '4', '5', '6'], info: 'Contacteur du sens inverse : deux phases croisées' }));
        W(n('a1'), [0, 12], [7, 12], [7, 14]); W(n('a2'), [2, 11], [9, 11], [9, 14]); W(n('a3'), [4, 10.5], [11, 10.5], [11, 14]);
        W(n('b3'), [7, 18], [7, 18.5], [4, 18.5]); W(n('b2'), [9, 18], [9, 19], [2, 19]); W(n('b1'), [11, 18], [11, 19.5], [0, 19.5]);
        [[0, 12], [2, 11], [4, 10.5], [4, 18.5], [2, 19], [0, 19.5]].forEach(([x, y]) => dots.push([x + x0, y]));
        w = 16;
      }
      if (mode === 'yd' && R.Y && R.D) {
        parts.push(P('motor6', m.id, x0 + 2, 30, { U1: n('c1'), V1: n('c2'), W1: n('c3'), U2: n('m4'), V2: n('m5'), W2: n('m6') }, { info: m.name + ' — ' + m.P + ' kW, ' + m.plate }));
        [0, 2, 4].forEach((c, j) => { W(n('c' + (j + 1)), [c, 24], [c, 27]); W(n('m' + (j + 4)), [c, 33], [c, 36]); });
        parts.push(P('km3', R.Y + ':P', x0, 38, { a1: n('m4'), a2: n('m5'), a3: n('m6'), b1: n('ys'), b2: n('ys'), b3: n('ys') }, { of: R.Y, t: ['1', '2', '3', '4', '5', '6'], info: 'Contacteur étoile' }));
        parts.push(P('km3', R.D + ':P', x0 + 8, 38, { a1: n('m6'), a2: n('m4'), a3: n('m5'), b1: n('c1'), b2: n('c2'), b3: n('c3') }, { of: R.D, t: ['1', '2', '3', '4', '5', '6'], info: 'Contacteur triangle' }));
        W(n('m6'), [4, 34], [8, 34], [8, 36]); W(n('m4'), [0, 34.5], [10, 34.5], [10, 36]); W(n('m5'), [2, 35], [12, 35], [12, 36]);
        W(n('ys'), [0, 40], [0, 41], [4, 41], [4, 40]); W(n('ys'), [2, 40], [2, 41]);
        W(n('c1'), [0, 25], [16, 25], [16, 43], [8, 43], [8, 40]); W(n('c2'), [2, 25.5], [15, 25.5], [15, 42.5], [10, 42.5], [10, 40]); W(n('c3'), [4, 26], [14, 26], [14, 42], [12, 42], [12, 40]);
        [[0, 25], [2, 25.5], [4, 26], [4, 34], [0, 34.5], [2, 35], [2, 41]].forEach(([x, y]) => dots.push([x + x0, y]));
        w = 19;
      } else {
        parts.push(P('motor3', m.id, x0 + 2, 29, { U: n('c1'), V: n('c2'), W: n('c3') }, { info: m.name + ' — ' + m.P + ' kW, ' + m.plate }));
        [0, 2, 4].forEach((c, j) => W(n('c' + (j + 1)), [c, 24], [c, 26]));
      }
      x0 += w + 2;
    });
    wires.push({ n: 'L1', p: [[1, 2.5], [lastX, 2.5]] }, { n: 'L2', p: [[1, 3.25], [lastX + 2, 3.25]] }, { n: 'L3', p: [[1, 4], [lastX + 4, 4]] });
    return { parts, wires, dots, w: x0 + 2, sources: [{ net: 'L1', pot: 'L1', x: 1, y: 2.5, label: 'L1' }, { net: 'L2', pot: 'L2', x: 1, y: 3.25, label: 'L2' }, { net: 'L3', pot: 'L3', x: 1, y: 4, label: 'L3' }] };
  };

  /* ---------- Folio complet ---------- */
  X.folio = (spec, cfg, model) => {
    const cat = X.catalog(spec), pw = X.power(spec, cfg), ctl = E.layout(model, cat), OX = pw.w + 2;
    const sh = o => Object.assign({}, o, { x: o.x + OX });
    const parts = pw.parts.concat(ctl.parts.map(sh)), wires = pw.wires.concat(ctl.wires.map(w => ({ n: w.n, p: w.p.map(([x, y]) => [x + OX, y]) })));
    const nets = {}; parts.forEach(p => Object.values(p.n).forEach(v => { nets[v] = 1; })); wires.forEach(w => { nets[w.n] = 1; }); ['L', 'N', 'L1', 'L2', 'L3'].forEach(k => { nets[k] = 1; });
    return { id: '_projet', title: spec.title, folio: spec.title + ' — ta solution', level: 'Projet', w: OX + ctl.w, h: Math.max(48, ctl.h), intro: '', sources: pw.sources.concat(ctl.sources.map(sh)), parts, wires, dots: pw.dots.concat(ctl.dots.map(([x, y]) => [x + OX, y])), sections: [{ x: 1.5, y: 0.2, t: 'Puissance 3 × 400 V' }, { x: OX + 1.5, y: 0.2, t: 'Commande 230 V' }], nets };
  };

  /* ---------- Recette ---------- */
  X.grade = (spec, cfg, model) => {
    const cat = X.catalog(spec), circ = X.folio(spec, cfg, model), res = E.run(circ, spec.tests, cat);
    const pw = spec.motors.map((m, i) => {
      const c = cfg[i], calOk = X.CAL.find(v => v >= m.In - 1e-9);
      return { m, mode: c.mode === m.need, ir: Math.abs((c.ir || 0) - m.In) <= 0.05 * m.In, cal: c.cal === calOk, calOk };
    });
    const pPts = pw.reduce((a, p) => a + (p.mode ? 1 : 0) + (p.ir ? 1 : 0) + (p.cal ? 1 : 0), 0) / (3 * pw.length);
    const tPts = res.length ? res.filter(r => r.ok).length / res.length : 0;
    return { res, pw, score: Math.round(30 * pPts + 70 * tPts) };
  };

  /* ---------- Interface ---------- */
  const register = () => {
    const D = AA.Defis; if (!D || !D.TYPES) return;
    D.TYPES.projetschema = {
      name: 'Projet de schéma complet', icon: 'schema', min: 2,
      desc: 'Un long cahier des charges : choisis les démarrages et les protections de chaque moteur, puis réalise tout le circuit de commande. Le folio complet est simulé et la recette rejoue chaque exigence.',
      gen(r, lvl) { const pool = X.SPECS.filter(s => s.lvl <= Math.max(2, lvl)); const sp = r.pick(pool.length ? pool : X.SPECS); return { spec: sp.id, lvl, sig: sp.id + lvl }; },
      play(main, inst, done) {
        const spec = X.SPECS.find(s => s.id === inst.spec), cat = X.catalog(spec), els = Object.keys(cat);
        const cfg = spec.motors.map(() => ({ mode: 'dol', ir: 0, cal: 0 })), model = { common: [], branches: [{ groups: [], load: null }] };
        let bench = null, finished = false;
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Projet de schéma complet</p><h1>${esc(spec.title)}</h1></div></div>
          <div class="brief">${spec.text.map(t => `<p style="margin:0 0 6px">${esc(t)}</p>`).join('')}</div>
          <div class="card" style="margin-top:14px"><p class="eyebrow">1 · Circuit de puissance</p><div class="amdec-wrap"><table class="amdec"><thead><tr><th>Moteur</th><th>Plaque</th><th>Mode de démarrage</th><th>Réglage du relais thermique (A)</th><th>Calibre du disjoncteur magnétique (A)</th></tr></thead><tbody>
            ${spec.motors.map((m, i) => `<tr><td><b>${m.id}</b> ${esc(m.name)}</td><td>${AA.fmt(m.P)} kW · ${esc(m.plate)} · ${AA.fmt(m.In)} A</td><td><select class="sel" data-i="${i}" data-k="mode">${Object.entries(X.MODES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></td><td><input type="number" step="0.1" min="0" data-i="${i}" data-k="ir" style="width:90px"></td><td><select class="sel" data-i="${i}" data-k="cal"><option value="0">—</option>${X.CAL.map(v => `<option value="${v}">${AA.fmt(v)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>
            <p class="muted" style="font-size:12.5px;padding:0 4px">Les relais thermiques sont placés entre le contacteur de ligne et le moteur (en amont du couplage étoile-triangle) : ils voient le courant de ligne. Le disjoncteur magnétique assure la protection contre les courts-circuits ; choisis le plus petit calibre normalisé au moins égal au courant nominal.</p></div>
          <div class="ed-grid"><div class="card ed-build"><p class="eyebrow">2 · Circuit de commande, branche par branche</p><div class="js-b"></div></div><div class="ed-folio"><div class="js-fo"></div></div></div>
          <div class="row" style="margin-top:14px"><button class="btn primary js-ok">${ic.check}Lancer la recette complète</button></div><div class="js-fb"></div>`;
        const rebuild = () => {
          if (bench) { bench.destroy(); bench = null; }
          window.AACircuits.C._projet = X.folio(spec, cfg, model);
          bench = AA.bench(main.querySelector('.js-fo'), '_projet', { height: '540px', overload: true });
        };
        main.querySelectorAll('[data-k]').forEach(c => c.addEventListener('change', () => { const i = +c.dataset.i, k = c.dataset.k; cfg[i][k] = k === 'mode' ? c.value : +c.value; rebuild(); }));
        E.builder(main.querySelector('.js-b'), model, els, cat, rebuild);
        main.querySelector('.js-ok').onclick = () => {
          const g = X.grade(spec, cfg, model);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${g.score >= 70 ? 'win' : 'lose'}"><div class="score-big">${g.score}</div>
            <p class="eyebrow">Choix de puissance (30 %)</p><ul class="nice">${g.pw.map(p => `<li>${p.m.id} : mode <span class="${p.mode ? 'ok-t' : 'bad-t'}">${p.mode ? '✔' : '✘ attendu : ' + X.MODES[p.m.need]}</span> · relais thermique <span class="${p.ir ? 'ok-t' : 'bad-t'}">${p.ir ? '✔' : '✘ attendu : ' + AA.fmt(p.m.In) + ' A (courant nominal de plaque)'}</span> · disjoncteur <span class="${p.cal ? 'ok-t' : 'bad-t'}">${p.cal ? '✔' : '✘ attendu : ' + AA.fmt(p.calOk) + ' A'}</span></li>`).join('')}</ul>
            <p class="eyebrow">Essais du cahier des charges (70 %)</p><ol class="nice">${g.res.map(r => `<li class="${r.ok ? 'ok-t' : 'bad-t'}">${r.ok ? '✔' : '✘'} ${esc(r.lbl)}</li>`).join('')}</ol>
            <p class="muted">Corrige et relance autant de fois que nécessaire : le score est enregistré à la première recette parfaite.</p></div>`;
          if (!finished && g.score === 100) { finished = true; done(100); }
        };
        rebuild();
        return () => { if (bench) bench.destroy(); };
      }
    };
  };
  register();
})();
