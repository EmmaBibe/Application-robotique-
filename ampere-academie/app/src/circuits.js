/* Ampère Académie — bibliothèque de schémas (folios). Coordonnées en unités de grille (20 px).
 * Convention : les organes sont dessinés verticalement, borne amont en haut.
 * Chaque circuit : sources (bornes d'alimentation), parts (organes), wires (conducteurs repérés par net),
 * dots (points de jonction), sections (titres de zones), w/h (taille du folio). */
(function () {
  'use strict';
  const P = (type, id, x, y, n, extra) => Object.assign({ type, id, x, y, n }, extra || {});
  const W = (n, ...p) => ({ n, p });
  function shift(list, ox) { return list.map(o => { const c = Object.assign({}, o); if ('x' in c) c.x += ox; if (c.p) c.p = c.p.map(([x, y]) => [x + ox, y]); return c; }); }
  const shiftPts = (pts, ox) => pts.map(([x, y]) => [x + ox, y]);

  function finish(c) {
    const nets = {};
    c.parts.forEach(p => Object.values(p.n).forEach(n => { nets[n] = 1; }));
    c.wires.forEach(w => { nets[w.n] = 1; });
    c.sources.forEach(s => { nets[s.net] = 1; });
    c.nets = nets;
    return c;
  }

  const C = {};

  /* ---------- 1. Simple allumage ---------- */
  C.simple = finish({
    id: 'simple', title: 'Simple allumage', folio: 'Éclairage — simple allumage', level: 'Domestique',
    w: 22, h: 30,
    intro: "Un interrupteur commande un point lumineux. Le disjoncteur Q1 protège le circuit, l'interrupteur coupe la phase, jamais le neutre.",
    sources: [{ net: 'L', pot: 'L1', x: 6, y: 2, label: 'L' }, { net: 'N', pot: 'N', x: 13, y: 2, label: 'N' }],
    parts: [
      P('cb', 'Q1', 6, 6, { a: 'L', b: 'l1' }, { rating: 10, t: ['1', '2'], info: 'Disjoncteur 10 A courbe C' }),
      P('sw1', 'S1', 6, 13, { a: 'l1', b: 'l2' }, { t: ['1', '2'], info: 'Interrupteur simple allumage' }),
      P('lamp', 'E1', 6, 20, { a: 'l2', b: 'N' }, { color: 'warm', t: ['X1', 'X2'], info: 'Point lumineux 230 V' })
    ],
    wires: [W('L', [6, 2], [6, 4]), W('l1', [6, 8], [6, 11]), W('l2', [6, 15], [6, 18]), W('N', [6, 22], [6, 25], [13, 25], [13, 2])],
    dots: [], sections: [{ x: 2, y: 0.9, t: 'Circuit éclairage 230 V' }],
    guide: [
      { id: 'Q1', t: "Q1 protège les conducteurs contre les surcharges et les courts-circuits. Il doit être fermé (enclenché)." },
      { id: 'S1', t: "Clique sur S1 : l'interrupteur ferme le circuit de la phase." },
      { id: 'E1', t: "Le courant traverse la lampe et revient par le neutre : elle s'allume." }
    ]
  });

  /* ---------- 2. Va-et-vient ---------- */
  C.vaetvient = finish({
    id: 'vaetvient', title: 'Va-et-vient', folio: 'Éclairage — va-et-vient', level: 'Domestique',
    w: 22, h: 34,
    intro: "Deux commutateurs commandent la même lampe depuis deux endroits (couloir, escalier). Les deux fils entre SA1 et SA2 s'appellent les navettes.",
    sources: [{ net: 'L', pot: 'L1', x: 6, y: 2, label: 'L' }, { net: 'N', pot: 'N', x: 14, y: 2, label: 'N' }],
    parts: [
      P('cb', 'Q1', 6, 6, { a: 'L', b: 'l1' }, { rating: 10, t: ['1', '2'], info: 'Disjoncteur 10 A' }),
      P('sw2', 'SA1', 6, 12, { c: 'l1', t1: 'n1', t2: 'n2' }, { info: 'Commutateur va-et-vient (haut d\'escalier)' }),
      P('sw2', 'SA2', 6, 20, { c: 'l2', t1: 'n2', t2: 'n1' }, { r: 180, info: 'Commutateur va-et-vient (bas d\'escalier)' }),
      P('lamp', 'E1', 6, 26, { a: 'l2', b: 'N' }, { color: 'warm', info: 'Point lumineux' })
    ],
    wires: [W('L', [6, 2], [6, 4]), W('l1', [6, 8], [6, 10]), W('n1', [5, 14], [5, 18]), W('n2', [7, 14], [7, 18]),
      W('l2', [6, 22], [6, 24]), W('N', [6, 28], [6, 30], [14, 30], [14, 2])],
    dots: [], sections: [{ x: 2, y: 0.9, t: 'Circuit éclairage — commande de deux endroits' }],
    guide: [
      { id: 'SA1', t: "SA1 envoie la phase sur l'une ou l'autre navette." },
      { id: 'SA2', t: "SA2 récupère l'une ou l'autre navette. La lampe s'allume si les deux commutateurs choisissent la même navette." },
      { id: 'E1', t: "Essaie toutes les combinaisons : c'est une fonction logique « OU exclusif inversé »." }
    ]
  });

  /* ---------- 3. Télérupteur ---------- */
  C.telerupteur = finish({
    id: 'telerupteur', title: 'Télérupteur', folio: 'Éclairage — télérupteur', level: 'Domestique',
    w: 30, h: 34,
    intro: "Plusieurs boutons-poussoirs en parallèle commandent un télérupteur KL1. Chaque impulsion inverse l'état de son contact : idéal pour 3 points de commande et plus.",
    sources: [{ net: 'L', pot: 'L1', x: 4, y: 2, label: 'L' }, { net: 'N', pot: 'N', x: 2, y: 30, label: 'N' }],
    parts: [
      P('cb', 'Q1', 4, 6, { a: 'L', b: 'c1' }, { rating: 10, t: ['1', '2'] }),
      P('pb_no', 'S1', 4, 14, { a: 'c1', b: 'c2' }, { t: ['3', '4'], info: 'Poussoir entrée' }),
      P('pb_no', 'S2', 9, 14, { a: 'c1', b: 'c2' }, { t: ['3', '4'], info: 'Poussoir chambre' }),
      P('pb_no', 'S3', 14, 14, { a: 'c1', b: 'c2' }, { t: ['3', '4'], info: 'Poussoir salon' }),
      P('telerupt', 'KL1', 4, 22, { a: 'c2', b: 'N' }, { t: ['A1', 'A2'], info: 'Télérupteur 230 V' }),
      P('no', 'KL1.1', 21, 14, { a: 'c1', b: 'c3' }, { of: 'KL1', t: ['1', '2'] }),
      P('lamp', 'E1', 21, 22, { a: 'c3', b: 'N' }, { color: 'warm' }),
    ],
    wires: [W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 12]), W('c1', [4, 10], [21, 10], [21, 12]), W('c1', [9, 10], [9, 12]), W('c1', [14, 10], [14, 12]),
      W('c2', [4, 16], [4, 20]), W('c2', [9, 16], [9, 18], [4, 18]), W('c2', [14, 16], [14, 18], [9, 18]),
      W('c3', [21, 16], [21, 20]), W('N', [4, 24], [4, 30], [2, 30]), W('N', [21, 24], [21, 30], [4, 30])],
    dots: [[4, 10], [9, 10], [14, 10], [4, 18], [9, 18], [4, 30]],
    sections: [{ x: 2, y: 0.9, t: 'Commande' }, { x: 18, y: 0.9, t: 'Éclairage' }],
    guide: [
      { id: 'S1', t: "Appuie brièvement sur n'importe quel poussoir : la bobine KL1 reçoit une impulsion." },
      { id: 'KL1', t: "À chaque impulsion, le mécanisme bascule le contact KL1.1." },
      { id: 'E1', t: "La lampe change d'état à chaque appui, quel que soit le poussoir utilisé." }
    ]
  });

  /* ---------- 4. Démarrage direct (DOL) ---------- */
  const OX = 16;
  const dolPower = [
    P('breaker3', 'Q1', 3, 6, { a1: 'L1', a2: 'L2', a3: 'L3', b1: 'pa1', b2: 'pa2', b3: 'pa3' }, { rating: 16, t: ['1', '2', '3', '4', '5', '6'], info: 'Disjoncteur-moteur magnéto-thermique' }),
    P('km3', 'KM1:P', 3, 14, { a1: 'pa1', a2: 'pa2', a3: 'pa3', b1: 'pb1', b2: 'pb2', b3: 'pb3' }, { of: 'KM1', t: ['1', '2', '3', '4', '5', '6'] }),
    P('thermal3', 'F2', 3, 20, { a1: 'pb1', a2: 'pb2', a3: 'pb3', b1: 'pc1', b2: 'pc2', b3: 'pc3' }, { motor: 'M1', t: ['1', '2', '3', '4', '5', '6'], info: 'Relais thermique de protection moteur' }),
    P('motor3', 'M1', 5, 27, { U: 'pc1', V: 'pc2', W: 'pc3' }, { info: 'Moteur asynchrone triphasé 400 V' })
  ];
  const dolPowerWires = [W('L1', [3, 2], [3, 4]), W('L2', [5, 2], [5, 4]), W('L3', [7, 2], [7, 4]),
    W('pa1', [3, 8], [3, 12]), W('pa2', [5, 8], [5, 12]), W('pa3', [7, 8], [7, 12]),
    W('pb1', [3, 16], [3, 18]), W('pb2', [5, 16], [5, 18]), W('pb3', [7, 16], [7, 18]),
    W('pc1', [3, 22], [3, 24]), W('pc2', [5, 22], [5, 24]), W('pc3', [7, 22], [7, 24])];
  const powerSources = [{ net: 'L1', pot: 'L1', x: 3, y: 2, label: 'L1' }, { net: 'L2', pot: 'L2', x: 5, y: 2, label: 'L2' }, { net: 'L3', pot: 'L3', x: 7, y: 2, label: 'L3' }];

  C.dol = finish({
    id: 'dol', title: 'Démarrage direct', folio: 'Moteur M1 — démarrage direct', level: 'Industriel',
    w: 40, h: 46,
    intro: "Le schéma de base de toute l'industrie : un bouton Marche (S2), un bouton Arrêt (S1), un contacteur KM1 qui s'auto-maintient grâce à son contact 13-14, un relais thermique F2 qui protège le moteur.",
    sources: powerSources.concat([{ net: 'L', pot: 'L1', x: 4 + OX, y: 2, label: 'L1' }, { net: 'N', pot: 'N', x: 2 + OX, y: 40, label: 'N' }]),
    parts: dolPower.concat(shift([
      P('fuse', 'F1', 4, 6, { a: 'L', b: 'c1' }, { rating: 2, t: ['1', '2'], info: 'Fusible du circuit de commande 2 A' }),
      P('th_nc', 'F2.95', 4, 12, { a: 'c1', b: 'c2' }, { of: 'F2', tag: 'F2', t: ['95', '96'] }),
      P('pb_nc', 'S1', 4, 18, { a: 'c2', b: 'c3' }, { t: ['1', '2'], info: 'Bouton Arrêt (rouge)', color: 'red' }),
      P('pb_no', 'S2', 4, 26, { a: 'c3', b: 'c4' }, { t: ['3', '4'], info: 'Bouton Marche (vert)', color: 'green' }),
      P('no', 'KM1.13', 9, 26, { a: 'c3', b: 'c4' }, { of: 'KM1', tag: 'KM1', t: ['13', '14'], info: "Contact d'auto-maintien" }),
      P('coil', 'KM1', 4, 34, { a: 'c4', b: 'N' }, { t: ['A1', 'A2'], u: 230, info: 'Bobine du contacteur 230 V' }),
      P('no', 'KM1.23', 14, 14, { a: 'c1', b: 'c5' }, { of: 'KM1', tag: 'KM1', t: ['23', '24'] }),
      P('lamp', 'H1', 14, 20, { a: 'c5', b: 'N' }, { color: 'green', info: 'Voyant Marche' }),
      P('th_no', 'F2.97', 19, 14, { a: 'c1', b: 'c6' }, { of: 'F2', tag: 'F2', t: ['97', '98'] }),
      P('lamp', 'H2', 19, 20, { a: 'c6', b: 'N' }, { color: 'orange', info: 'Voyant Défaut thermique' })
    ], OX)),
    wires: dolPowerWires.concat(shift([
      W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 10]), W('c1', [4, 9], [19, 9], [19, 12]), W('c1', [14, 9], [14, 12]),
      W('c2', [4, 14], [4, 16]), W('c3', [4, 20], [4, 24]), W('c3', [4, 22], [9, 22], [9, 24]),
      W('c4', [4, 28], [4, 32]), W('c4', [9, 28], [9, 30], [4, 30]),
      W('c5', [14, 16], [14, 18]), W('c6', [19, 16], [19, 18]),
      W('N', [4, 36], [4, 40]), W('N', [14, 22], [14, 40]), W('N', [19, 22], [19, 40], [2, 40])
    ], OX)),
    dots: shiftPts([[4, 9], [14, 9], [4, 22], [4, 30], [4, 40], [14, 40]], OX),
    sections: [{ x: 1.5, y: 0.9, t: 'Puissance 3 × 400 V' }, { x: 1.5 + OX, y: 0.9, t: 'Commande 230 V' }],
    guide: [
      { id: 'Q1', t: "Q1 isole et protège le circuit de puissance (court-circuit et surcharge)." },
      { id: 'S2', t: "Appuie sur S2 (Marche) : la bobine KM1 est alimentée." },
      { id: 'KM1', t: "KM1 colle : ses pôles de puissance alimentent le moteur, son contact 13-14 se ferme." },
      { id: 'KM1.13', t: "Relâche S2 : le courant passe désormais par 13-14. C'est l'auto-maintien (la « mémoire » du circuit)." },
      { id: 'S1', t: "S1 (Arrêt) est un contact à ouverture placé en série : il coupe tout, il est prioritaire." },
      { id: 'F2.95', t: "En cas de surcharge, F2 ouvre 95-96 (arrêt) et ferme 97-98 (voyant défaut H2)." }
    ]
  });

  /* ---------- 5. Inversion du sens de marche ---------- */
  const OI = 18;
  C.inversion = finish({
    id: 'inversion', title: 'Inversion de sens', folio: 'Moteur M1 — deux sens de marche', level: 'Industriel',
    w: 42, h: 52,
    intro: "Deux contacteurs : KM1 (avant) et KM2 (arrière). KM2 croise deux phases, ce qui inverse le champ tournant. Les verrouillages électriques 21-22 empêchent de coller les deux en même temps (sinon : court-circuit entre phases !).",
    sources: powerSources.concat([{ net: 'L', pot: 'L1', x: 4 + OI, y: 2, label: 'L1' }, { net: 'N', pot: 'N', x: 2 + OI, y: 46, label: 'N' }]),
    parts: [
      P('breaker3', 'Q1', 3, 6, { a1: 'L1', a2: 'L2', a3: 'L3', b1: 'pa1', b2: 'pa2', b3: 'pa3' }, { rating: 16, t: ['1', '2', '3', '4', '5', '6'] }),
      P('km3', 'KM1:P', 3, 14, { a1: 'pa1', a2: 'pa2', a3: 'pa3', b1: 'pb1', b2: 'pb2', b3: 'pb3' }, { of: 'KM1', t: ['1', '2', '3', '4', '5', '6'] }),
      P('km3', 'KM2:P', 10, 14, { a1: 'pa1', a2: 'pa2', a3: 'pa3', b1: 'pb3', b2: 'pb2', b3: 'pb1' }, { of: 'KM2', t: ['1', '2', '3', '4', '5', '6'] }),
      P('thermal3', 'F2', 3, 20, { a1: 'pb1', a2: 'pb2', a3: 'pb3', b1: 'pc1', b2: 'pc2', b3: 'pc3' }, { motor: 'M1', t: ['1', '2', '3', '4', '5', '6'] }),
      P('motor3', 'M1', 5, 27, { U: 'pc1', V: 'pc2', W: 'pc3' })
    ].concat(shift([
      P('fuse', 'F1', 4, 6, { a: 'L', b: 'c1' }, { rating: 2, t: ['1', '2'] }),
      P('th_nc', 'F2.95', 4, 12, { a: 'c1', b: 'c2' }, { of: 'F2', tag: 'F2', t: ['95', '96'] }),
      P('pb_nc', 'S1', 4, 18, { a: 'c2', b: 'c3' }, { t: ['1', '2'], color: 'red', info: 'Arrêt' }),
      P('pb_no', 'S2', 4, 26, { a: 'c3', b: 'c4' }, { t: ['3', '4'], color: 'green', info: 'Marche avant' }),
      P('no', 'KM1.13', 9, 26, { a: 'c3', b: 'c4' }, { of: 'KM1', tag: 'KM1', t: ['13', '14'] }),
      P('nc', 'KM2.21', 4, 34, { a: 'c4', b: 'c5' }, { of: 'KM2', tag: 'KM2', t: ['21', '22'], info: 'Verrouillage électrique' }),
      P('coil', 'KM1', 4, 40, { a: 'c5', b: 'N' }, { t: ['A1', 'A2'], u: 230 }),
      P('pb_no', 'S3', 14, 26, { a: 'c3', b: 'c6' }, { t: ['3', '4'], color: 'white', info: 'Marche arrière' }),
      P('no', 'KM2.13', 19, 26, { a: 'c3', b: 'c6' }, { of: 'KM2', tag: 'KM2', t: ['13', '14'] }),
      P('nc', 'KM1.21', 14, 34, { a: 'c6', b: 'c7' }, { of: 'KM1', tag: 'KM1', t: ['21', '22'], info: 'Verrouillage électrique' }),
      P('coil', 'KM2', 14, 40, { a: 'c7', b: 'N' }, { t: ['A1', 'A2'], u: 230 })
    ], OI)),
    wires: [W('L1', [3, 2], [3, 4]), W('L2', [5, 2], [5, 4]), W('L3', [7, 2], [7, 4]),
      W('pa1', [3, 8], [3, 12]), W('pa2', [5, 8], [5, 12]), W('pa3', [7, 8], [7, 12]),
      W('pa1', [3, 10], [10, 10], [10, 12]), W('pa2', [5, 9], [12, 9], [12, 12]), W('pa3', [7, 8.5], [14, 8.5], [14, 12]),
      W('pb1', [3, 16], [3, 18]), W('pb2', [5, 16], [5, 18]), W('pb3', [7, 16], [7, 18]),
      W('pb3', [10, 16], [10, 16.5], [7, 16.5]), W('pb2', [12, 16], [12, 17], [5, 17]), W('pb1', [14, 16], [14, 17.5], [3, 17.5]),
      W('pc1', [3, 22], [3, 24]), W('pc2', [5, 22], [5, 24]), W('pc3', [7, 22], [7, 24])].concat(shift([
      W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 10]), W('c2', [4, 14], [4, 16]),
      W('c3', [4, 20], [4, 24]), W('c3', [4, 22], [19, 22], [19, 24]), W('c3', [9, 22], [9, 24]), W('c3', [14, 22], [14, 24]),
      W('c4', [4, 28], [4, 32]), W('c4', [9, 28], [9, 30], [4, 30]), W('c5', [4, 36], [4, 38]),
      W('c6', [14, 28], [14, 32]), W('c6', [19, 28], [19, 30], [14, 30]), W('c7', [14, 36], [14, 38]),
      W('N', [14, 42], [14, 46], [2, 46]), W('N', [4, 42], [4, 46])
    ], OI)),
    dots: [[3, 10], [5, 9], [7, 8.5], [7, 16.5], [5, 17], [3, 17.5]].concat(shiftPts([[4, 22], [9, 22], [14, 22], [4, 30], [14, 30], [4, 46]], OI)),
    sections: [{ x: 1.5, y: 0.9, t: 'Puissance 3 × 400 V' }, { x: 1.5 + OI, y: 0.9, t: 'Commande 230 V' }],
    guide: [
      { id: 'S2', t: "S2 : marche avant. KM1 colle et s'auto-maintient par KM1 13-14." },
      { id: 'KM1.21', t: "KM1 ouvre son contact 21-22 dans la branche de KM2 : KM2 ne peut plus coller." },
      { id: 'S3', t: "Essaie S3 pendant la marche avant : rien ne se passe, c'est le verrouillage." },
      { id: 'S1', t: "Pour changer de sens : Arrêt (S1), puis S3. Le moteur repart dans l'autre sens." },
      { id: 'KM2:P', t: "KM2 croise L1 et L3 : le champ tournant change de sens, donc le moteur aussi." }
    ]
  });

  /* ---------- 6. Démarrage étoile-triangle ---------- */
  const OE = 22;
  C.etoile = finish({
    id: 'etoile', title: 'Étoile-triangle', folio: 'Moteur M1 — démarrage étoile-triangle', level: 'Industriel',
    w: 46, h: 54,
    intro: "Pour réduire le courant de démarrage d'un moteur prévu pour fonctionner en triangle (plaque 400/690 V sur un réseau 400 V) : on démarre en étoile (KM2), chaque enroulement ne reçoit que 230 V ; après la temporisation de KA1, on passe en triangle (KM3). KM1 est le contacteur de ligne. KM2 et KM3 ne doivent jamais être fermés ensemble.",
    sources: powerSources.concat([{ net: 'L', pot: 'L1', x: 4 + OE, y: 2, label: 'L1' }, { net: 'N', pot: 'N', x: 2 + OE, y: 50, label: 'N' }]),
    parts: [
      P('breaker3', 'Q1', 3, 6, { a1: 'L1', a2: 'L2', a3: 'L3', b1: 'pa1', b2: 'pa2', b3: 'pa3' }, { rating: 32, t: ['1', '2', '3', '4', '5', '6'], info: 'Disjoncteur-moteur' }),
      P('km3', 'KM1:P', 3, 14, { a1: 'pa1', a2: 'pa2', a3: 'pa3', b1: 'pb1', b2: 'pb2', b3: 'pb3' }, { of: 'KM1', t: ['1', '2', '3', '4', '5', '6'], info: 'Contacteur de ligne' }),
      P('thermal3', 'F2', 3, 20, { a1: 'pb1', a2: 'pb2', a3: 'pb3', b1: 'pc1', b2: 'pc2', b3: 'pc3' }, { motor: 'M1', t: ['1', '2', '3', '4', '5', '6'], info: 'Relais thermique réglé à I/√3 (courant dans les enroulements)' }),
      P('motor6', 'M1', 5, 28, { U1: 'pc1', V1: 'pc2', W1: 'pc3', U2: 'm4', V2: 'm5', W2: 'm6' }, { info: 'Moteur 400/690 V : couplé en triangle sur le réseau 400 V' }),
      P('km3', 'KM2:P', 3, 36, { a1: 'm4', a2: 'm5', a3: 'm6', b1: 'ys', b2: 'ys', b3: 'ys' }, { of: 'KM2', t: ['1', '2', '3', '4', '5', '6'], info: 'Contacteur étoile : relie U2, V2, W2' }),
      P('km3', 'KM3:P', 11, 36, { a1: 'm6', a2: 'm4', a3: 'm5', b1: 'pc1', b2: 'pc2', b3: 'pc3' }, { of: 'KM3', t: ['1', '2', '3', '4', '5', '6'], info: 'Contacteur triangle : W2-U1, U2-V1, V2-W1' })
    ].concat(shift([
      P('fuse', 'F1', 4, 6, { a: 'L', b: 'c1' }, { rating: 2, t: ['1', '2'] }),
      P('th_nc', 'F2.95', 4, 12, { a: 'c1', b: 'c2' }, { of: 'F2', tag: 'F2', t: ['95', '96'] }),
      P('pb_nc', 'S1', 4, 18, { a: 'c2', b: 'c3' }, { t: ['1', '2'], color: 'red', info: 'Arrêt' }),
      P('pb_no', 'S2', 4, 26, { a: 'c3', b: 'c4' }, { t: ['3', '4'], color: 'green', info: 'Marche' }),
      P('no', 'KM1.13', 9, 26, { a: 'c3', b: 'c4' }, { of: 'KM1', tag: 'KM1', t: ['13', '14'], info: 'Auto-maintien' }),
      P('ton_nc', 'KA1.55', 4, 34, { a: 'c4', b: 'c5' }, { of: 'KA1', tag: 'KA1', t: ['55', '56'], info: 'Contact temporisé à ouverture : fin de l\'étoile' }),
      P('nc', 'KM3.21', 4, 40, { a: 'c5', b: 'c6' }, { of: 'KM3', tag: 'KM3', t: ['21', '22'], info: 'Verrouillage : pas d\'étoile si triangle' }),
      P('coil', 'KM2', 4, 46, { a: 'c6', b: 'N' }, { t: ['A1', 'A2'], u: 230, info: 'Bobine du contacteur étoile' }),
      P('coil', 'KM1', 10, 46, { a: 'c4', b: 'N' }, { t: ['A1', 'A2'], u: 230, info: 'Bobine du contacteur de ligne' }),
      P('coil_ton', 'KA1', 15, 46, { a: 'c4', b: 'N' }, { t: ['A1', 'A2'], u: 230, delay: 4, info: 'Relais temporisé au travail : 4 s' }),
      P('ton_no', 'KA1.67', 20, 34, { a: 'c4', b: 'c7' }, { of: 'KA1', tag: 'KA1', t: ['67', '68'], info: 'Contact temporisé à fermeture : passage en triangle' }),
      P('nc', 'KM2.21', 20, 40, { a: 'c7', b: 'c8' }, { of: 'KM2', tag: 'KM2', t: ['21', '22'], info: 'Verrouillage : pas de triangle si étoile' }),
      P('coil', 'KM3', 20, 46, { a: 'c8', b: 'N' }, { t: ['A1', 'A2'], u: 230, info: 'Bobine du contacteur triangle' })
    ], OE)),
    wires: dolPowerWires.slice(0, 9).concat([
      W('pc1', [3, 22], [3, 25]), W('pc2', [5, 22], [5, 25]), W('pc3', [7, 22], [7, 25]),
      W('m4', [3, 31], [3, 34]), W('m5', [5, 31], [5, 34]), W('m6', [7, 31], [7, 34]),
      W('m6', [7, 32], [11, 32], [11, 34]), W('m4', [3, 32.5], [13, 32.5], [13, 34]), W('m5', [5, 33], [15, 33], [15, 34]),
      W('ys', [3, 38], [3, 39], [7, 39], [7, 38]), W('ys', [5, 38], [5, 39]),
      W('pc1', [3, 23], [19, 23], [19, 41], [11, 41], [11, 38]), W('pc2', [5, 23.5], [18, 23.5], [18, 40.5], [13, 40.5], [13, 38]), W('pc3', [7, 24], [17, 24], [17, 40], [15, 40], [15, 38])
    ]).concat(shift([
      W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 10]), W('c2', [4, 14], [4, 16]),
      W('c3', [4, 20], [4, 24]), W('c3', [4, 22], [9, 22], [9, 24]),
      W('c4', [4, 28], [4, 32]), W('c4', [9, 28], [9, 30]), W('c4', [4, 30], [20, 30], [20, 32]), W('c4', [10, 30], [10, 44]), W('c4', [15, 30], [15, 44]),
      W('c5', [4, 36], [4, 38]), W('c6', [4, 42], [4, 44]), W('c7', [20, 36], [20, 38]), W('c8', [20, 42], [20, 44]),
      W('N', [4, 48], [4, 50]), W('N', [10, 48], [10, 50]), W('N', [15, 48], [15, 50]), W('N', [20, 48], [20, 50], [2, 50])
    ], OE)),
    dots: [[3, 23], [5, 23.5], [7, 24], [7, 32], [3, 32.5], [5, 33], [5, 39]].concat(shiftPts([[4, 22], [4, 30], [9, 30], [10, 30], [15, 30], [4, 50], [10, 50], [15, 50]], OE)),
    sections: [{ x: 1.5, y: 0.9, t: 'Puissance 3 × 400 V' }, { x: 1.5 + OE, y: 0.9, t: 'Commande 230 V' }],
    guide: [
      { id: 'S2', t: "Appui sur Marche : KM1 (ligne), KM2 (étoile) et le relais temporisé KA1 sont alimentés." },
      { id: 'KM2:P', t: "KM2 relie U2, V2 et W2 : couplage étoile, chaque enroulement reçoit 400/√3 ≈ 230 V. Courant et couple de démarrage divisés par 3." },
      { id: 'KA1', t: "KA1 compte 4 s. Pendant ce temps le moteur accélère en étoile." },
      { id: 'KA1.55', t: "À la fin de la temporisation, KA1 55-56 s'ouvre : KM2 retombe." },
      { id: 'KA1.67', t: "KA1 67-68 se ferme et, dès que KM2 est retombé (KM2 21-22 refermé), KM3 colle : couplage triangle, 400 V par enroulement." },
      { id: 'KM3.21', t: "Les contacts 21-22 croisés interdisent KM2 et KM3 ensemble : sinon, court-circuit franc entre phases." }
    ]
  });

  /* ---------- Double allumage ---------- */
  C.double = finish({
    id: 'double', title: 'Double allumage', folio: 'Éclairage — double allumage', level: 'Domestique',
    w: 26, h: 32,
    intro: "Un interrupteur double (deux mécanismes dans un même boîtier) commande deux groupes de lampes. La phase arrive sur le commun, un retour part vers chaque groupe ; le neutre va directement aux lampes.",
    sources: [{ net: 'L', pot: 'L1', x: 6, y: 2, label: 'L' }, { net: 'N', pot: 'N', x: 20, y: 2, label: 'N' }],
    parts: [
      P('cb', 'Q1', 6, 6, { a: 'L', b: 'l1' }, { rating: 10, t: ['1', '2'], info: 'Disjoncteur 10 A' }),
      P('sw1', 'S1', 6, 14, { a: 'l1', b: 'r1' }, { t: ['1', '2'], info: 'Interrupteur double, mécanisme 1' }),
      P('sw1', 'S1.2', 12, 14, { a: 'l1', b: 'r2' }, { tag: 'S1', t: ['3', '4'], info: 'Interrupteur double, mécanisme 2' }),
      P('lamp', 'E1', 6, 22, { a: 'r1', b: 'N' }, { color: 'warm', info: 'Groupe de lampes 1' }),
      P('lamp', 'E2', 12, 22, { a: 'r2', b: 'N' }, { color: 'warm', info: 'Groupe de lampes 2' })
    ],
    wires: [W('L', [6, 2], [6, 4]), W('l1', [6, 8], [6, 12]), W('l1', [6, 10], [12, 10], [12, 12]),
      W('r1', [6, 16], [6, 20]), W('r2', [12, 16], [12, 20]),
      W('N', [6, 24], [6, 27], [20, 27], [20, 2]), W('N', [12, 24], [12, 27])],
    dots: [[6, 10], [12, 27]], sections: [{ x: 2, y: 0.9, t: 'Éclairage — deux groupes' }],
    guide: [{ id: 'S1', t: "Chaque mécanisme commande un groupe de lampes indépendamment." }, { id: 'E1', t: "Le neutre est commun aux deux groupes ; seule la phase est coupée." }]
  });

  /* ---------- Minuterie d'escalier ---------- */
  C.minuterie = finish({
    id: 'minuterie', title: 'Minuterie', folio: 'Éclairage — minuterie d\'escalier', level: 'Domestique',
    w: 30, h: 34,
    intro: "Une impulsion sur n'importe quel poussoir alimente la minuterie KT1 : son contact reste fermé pendant la durée réglée (ici 8 s pour la démonstration, quelques minutes en réalité), puis l'éclairage s'éteint seul. Un nouvel appui relance la durée.",
    sources: [{ net: 'L', pot: 'L1', x: 4, y: 2, label: 'L' }, { net: 'N', pot: 'N', x: 2, y: 30, label: 'N' }],
    parts: [
      P('cb', 'Q1', 4, 6, { a: 'L', b: 'c1' }, { rating: 10, t: ['1', '2'] }),
      P('pb_no', 'S1', 4, 14, { a: 'c1', b: 'c2' }, { t: ['3', '4'], info: 'Poussoir rez-de-chaussée' }),
      P('pb_no', 'S2', 9, 14, { a: 'c1', b: 'c2' }, { t: ['3', '4'], info: 'Poussoir 1er étage' }),
      P('pb_no', 'S3', 14, 14, { a: 'c1', b: 'c2' }, { t: ['3', '4'], info: 'Poussoir 2e étage' }),
      P('minut', 'KT1', 4, 22, { a: 'c2', b: 'N' }, { t: ['A1', 'A2'], delay: 8, info: 'Minuterie (durée réglée à 8 s pour la démonstration)' }),
      P('no', 'KT1.1', 21, 14, { a: 'c1', b: 'c3' }, { of: 'KT1', t: ['1', '2'] }),
      P('lamp', 'E1', 21, 22, { a: 'c3', b: 'N' }, { color: 'warm' })
    ],
    wires: [W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 12]), W('c1', [4, 10], [21, 10], [21, 12]), W('c1', [9, 10], [9, 12]), W('c1', [14, 10], [14, 12]),
      W('c2', [4, 16], [4, 20]), W('c2', [9, 16], [9, 18], [4, 18]), W('c2', [14, 16], [14, 18], [9, 18]),
      W('c3', [21, 16], [21, 20]), W('N', [4, 24], [4, 30], [2, 30]), W('N', [21, 24], [21, 30], [4, 30])],
    dots: [[4, 10], [9, 10], [14, 10], [4, 18], [9, 18], [4, 30]],
    sections: [{ x: 2, y: 0.9, t: 'Commande' }, { x: 18, y: 0.9, t: 'Éclairage' }],
    guide: [{ id: 'S2', t: "Une impulsion brève suffit." }, { id: 'KT1', t: "La minuterie garde son contact fermé pendant la durée réglée, puis le rouvre seule." }]
  });

  /* ---------- 9. Commande depuis deux postes ---------- */
  const NW = 'N';
  C.multipostes = finish({
    id: 'multipostes', title: 'Commande depuis deux postes', folio: 'Moteur M1 — deux postes de commande', level: 'Industriel',
    w: 40, h: 50,
    intro: "Le moteur se commande depuis deux pupitres. Règle : les boutons d'arrêt (contacts à ouverture) se placent en série, les boutons de marche (contacts à fermeture) en parallèle, avec le contact d'auto-maintien.",
    sources: powerSources.concat([{ net: 'L', pot: 'L1', x: 4 + OX, y: 2, label: 'L1' }, { net: NW, pot: 'N', x: 2 + OX, y: 44, label: 'N' }]),
    parts: dolPower.concat(shift([
      P('fuse', 'F1', 4, 6, { a: 'L', b: 'c1' }, { rating: 2, t: ['1', '2'], info: 'Fusible du circuit de commande 2 A' }),
      P('th_nc', 'F2.95', 4, 12, { a: 'c1', b: 'c2' }, { of: 'F2', tag: 'F2', t: ['95', '96'] }),
      P('pb_nc', 'S1', 4, 18, { a: 'c2', b: 'c3' }, { t: ['1', '2'], color: 'red', info: 'Arrêt — poste 1' }),
      P('pb_nc', 'S3', 4, 24, { a: 'c3', b: 'c4' }, { t: ['1', '2'], color: 'red', info: 'Arrêt — poste 2' }),
      P('pb_no', 'S2', 4, 30, { a: 'c4', b: 'c5' }, { t: ['3', '4'], color: 'green', info: 'Marche — poste 1' }),
      P('pb_no', 'S4', 9, 30, { a: 'c4', b: 'c5' }, { t: ['3', '4'], color: 'green', info: 'Marche — poste 2' }),
      P('no', 'KM1.13', 14, 30, { a: 'c4', b: 'c5' }, { of: 'KM1', tag: 'KM1', t: ['13', '14'], info: "Contact d'auto-maintien" }),
      P('coil', 'KM1', 4, 38, { a: 'c5', b: NW }, { t: ['A1', 'A2'], u: 230 })
    ], OX)),
    wires: dolPowerWires.concat(shift([
      W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 10]), W('c2', [4, 14], [4, 16]), W('c3', [4, 20], [4, 22]),
      W('c4', [4, 26], [4, 28]), W('c4', [4, 27], [14, 27], [14, 28]), W('c4', [9, 27], [9, 28]),
      W('c5', [4, 32], [4, 36]), W('c5', [14, 32], [14, 34], [4, 34]), W('c5', [9, 32], [9, 34]),
      W(NW, [4, 40], [4, 44], [2, 44])
    ], OX)),
    dots: shiftPts([[4, 27], [9, 27], [4, 34], [9, 34]], OX),
    sections: [{ x: 1.5, y: 0.9, t: 'Puissance 3 × 400 V' }, { x: 1.5 + OX, y: 0.9, t: 'Commande 230 V' }],
    guide: [
      { id: 'S2', t: 'Marche depuis le poste 1 (S2) ou le poste 2 (S4) : les deux sont en parallèle, un seul suffit.' },
      { id: 'KM1.13', t: "L'auto-maintien est en parallèle avec toutes les marches." },
      { id: 'S3', t: "Arrêt depuis n'importe quel poste : S1 et S3 sont en série, chacun coupe le circuit." }
    ]
  });

  /* ---------- 10. Marche par à-coups (sélecteur) ---------- */
  C.acoups = finish({
    id: 'acoups', title: 'Marche par à-coups', folio: 'Moteur M1 — marche continue ou à-coups', level: 'Industriel',
    w: 40, h: 50,
    intro: "Pour positionner une machine (réglage, changement d'outil), le moteur ne doit tourner que tant que l'on appuie. Le sélecteur SA1 ouvert supprime l'auto-maintien : le bouton Marche devient un bouton d'à-coups.",
    sources: powerSources.concat([{ net: 'L', pot: 'L1', x: 4 + OX, y: 2, label: 'L1' }, { net: NW, pot: 'N', x: 2 + OX, y: 44, label: 'N' }]),
    parts: dolPower.concat(shift([
      P('fuse', 'F1', 4, 6, { a: 'L', b: 'c1' }, { rating: 2, t: ['1', '2'] }),
      P('th_nc', 'F2.95', 4, 12, { a: 'c1', b: 'c2' }, { of: 'F2', tag: 'F2', t: ['95', '96'] }),
      P('pb_nc', 'S1', 4, 18, { a: 'c2', b: 'c3' }, { t: ['1', '2'], color: 'red', info: 'Arrêt' }),
      P('pb_no', 'S2', 4, 26, { a: 'c3', b: 'c4' }, { t: ['3', '4'], color: 'green', info: 'Marche (ou à-coups si SA1 ouvert)' }),
      P('sw1', 'SA1', 9, 24, { a: 'c3', b: 'c6' }, { t: ['1', '2'], info: 'Sélecteur : fermé = marche continue, ouvert = à-coups' }),
      P('no', 'KM1.13', 9, 30, { a: 'c6', b: 'c4' }, { of: 'KM1', tag: 'KM1', t: ['13', '14'], info: "Contact d'auto-maintien" }),
      P('coil', 'KM1', 4, 38, { a: 'c4', b: NW }, { t: ['A1', 'A2'], u: 230 })
    ], OX)),
    wires: dolPowerWires.concat(shift([
      W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 10]), W('c2', [4, 14], [4, 16]),
      W('c3', [4, 20], [4, 24]), W('c3', [4, 21], [9, 21], [9, 22]),
      W('c6', [9, 26], [9, 28]), W('c4', [4, 28], [4, 36]), W('c4', [9, 32], [9, 33], [4, 33]),
      W(NW, [4, 40], [4, 44], [2, 44])
    ], OX)),
    dots: shiftPts([[4, 21], [4, 33]], OX),
    sections: [{ x: 1.5, y: 0.9, t: 'Puissance 3 × 400 V' }, { x: 1.5 + OX, y: 0.9, t: 'Commande 230 V' }],
    guide: [
      { id: 'SA1', t: "SA1 fermé : marche normale, l'auto-maintien fonctionne." },
      { id: 'S2', t: 'SA1 ouvert : le moteur tourne seulement pendant l\'appui sur S2 (à-coups).' },
      { id: 'KM1.13', t: "Le contact d'auto-maintien est en série avec SA1 : sélecteur ouvert, il ne sert plus." }
    ]
  });

  /* ---------- 11. Va-et-vient automatique par fins de course ---------- */
  const OF = 18;
  C.fdc = finish({
    id: 'fdc', title: 'Va-et-vient par fins de course', folio: 'Chariot — va-et-vient automatique', level: 'Industriel',
    w: 50, h: 54,
    intro: "Un chariot fait des allers-retours. Chaque fin de course porte deux contacts actionnés ensemble : un contact à ouverture arrête le sens en cours, un contact à fermeture lance le sens opposé. Clique SQ1 (fin de course avant) ou SQ2 (arrière) pour simuler l'arrivée du chariot.",
    sources: powerSources.concat([{ net: 'L', pot: 'L1', x: 4 + OF, y: 2, label: 'L1' }, { net: NW, pot: 'N', x: 2 + OF, y: 48, label: 'N' }]),
    parts: [
      P('breaker3', 'Q1', 3, 6, { a1: 'L1', a2: 'L2', a3: 'L3', b1: 'pa1', b2: 'pa2', b3: 'pa3' }, { rating: 16, t: ['1', '2', '3', '4', '5', '6'] }),
      P('km3', 'KM1:P', 3, 14, { a1: 'pa1', a2: 'pa2', a3: 'pa3', b1: 'pb1', b2: 'pb2', b3: 'pb3' }, { of: 'KM1', t: ['1', '2', '3', '4', '5', '6'] }),
      P('km3', 'KM2:P', 10, 14, { a1: 'pa1', a2: 'pa2', a3: 'pa3', b1: 'pb3', b2: 'pb2', b3: 'pb1' }, { of: 'KM2', t: ['1', '2', '3', '4', '5', '6'] }),
      P('thermal3', 'F2', 3, 20, { a1: 'pb1', a2: 'pb2', a3: 'pb3', b1: 'pc1', b2: 'pc2', b3: 'pc3' }, { motor: 'M1', t: ['1', '2', '3', '4', '5', '6'] }),
      P('motor3', 'M1', 5, 27, { U: 'pc1', V: 'pc2', W: 'pc3' }, { info: 'Moteur du chariot' })
    ].concat(shift([
      P('fuse', 'F1', 4, 6, { a: 'L', b: 'c1' }, { rating: 2, t: ['1', '2'] }),
      P('th_nc', 'F2.95', 4, 12, { a: 'c1', b: 'c2' }, { of: 'F2', tag: 'F2', t: ['95', '96'] }),
      P('pb_nc', 'S1', 4, 18, { a: 'c2', b: 'c3' }, { t: ['1', '2'], color: 'red', info: 'Arrêt' }),
      P('pb_no', 'S2', 4, 26, { a: 'c3', b: 'c4' }, { t: ['3', '4'], color: 'green', info: 'Départ vers l\'avant' }),
      P('no', 'KM1.13', 8, 26, { a: 'c3', b: 'c4' }, { of: 'KM1', tag: 'KM1', t: ['13', '14'] }),
      P('ls_no', 'SQ2:2', 12, 26, { a: 'c3', b: 'c4' }, { t: ['13', '14'], mech: ['SQ2'], info: 'Fin de course arrière, contact à fermeture : relance vers l\'avant' }),
      P('ls_nc', 'SQ1', 4, 32, { a: 'c4', b: 'c5' }, { t: ['11', '12'], mech: ['SQ1:2'], info: 'Fin de course avant, contact à ouverture : arrête la marche avant' }),
      P('nc', 'KM2.21', 4, 38, { a: 'c5', b: 'c8' }, { of: 'KM2', tag: 'KM2', t: ['21', '22'], info: 'Verrouillage électrique' }),
      P('coil', 'KM1', 4, 44, { a: 'c8', b: NW }, { t: ['A1', 'A2'], u: 230, info: 'Marche avant' }),
      P('pb_no', 'S3', 18, 26, { a: 'c3', b: 'c6' }, { t: ['3', '4'], color: 'white', info: 'Départ vers l\'arrière' }),
      P('no', 'KM2.13', 22, 26, { a: 'c3', b: 'c6' }, { of: 'KM2', tag: 'KM2', t: ['13', '14'] }),
      P('ls_no', 'SQ1:2', 26, 26, { a: 'c3', b: 'c6' }, { t: ['13', '14'], mech: ['SQ1'], info: 'Fin de course avant, contact à fermeture : lance le retour' }),
      P('ls_nc', 'SQ2', 18, 32, { a: 'c6', b: 'c7' }, { t: ['11', '12'], mech: ['SQ2:2'], info: 'Fin de course arrière, contact à ouverture : arrête le retour' }),
      P('nc', 'KM1.21', 18, 38, { a: 'c7', b: 'c9' }, { of: 'KM1', tag: 'KM1', t: ['21', '22'], info: 'Verrouillage électrique' }),
      P('coil', 'KM2', 18, 44, { a: 'c9', b: NW }, { t: ['A1', 'A2'], u: 230, info: 'Marche arrière' })
    ], OF)),
    wires: [W('L1', [3, 2], [3, 4]), W('L2', [5, 2], [5, 4]), W('L3', [7, 2], [7, 4]),
      W('pa1', [3, 8], [3, 12]), W('pa2', [5, 8], [5, 12]), W('pa3', [7, 8], [7, 12]),
      W('pa1', [3, 10], [10, 10], [10, 12]), W('pa2', [5, 9], [12, 9], [12, 12]), W('pa3', [7, 8.5], [14, 8.5], [14, 12]),
      W('pb1', [3, 16], [3, 18]), W('pb2', [5, 16], [5, 18]), W('pb3', [7, 16], [7, 18]),
      W('pb3', [10, 16], [10, 16.5], [7, 16.5]), W('pb2', [12, 16], [12, 17], [5, 17]), W('pb1', [14, 16], [14, 17.5], [3, 17.5]),
      W('pc1', [3, 22], [3, 24]), W('pc2', [5, 22], [5, 24]), W('pc3', [7, 22], [7, 24])].concat(shift([
      W('L', [4, 2], [4, 4]), W('c1', [4, 8], [4, 10]), W('c2', [4, 14], [4, 16]),
      W('c3', [4, 20], [4, 24]), W('c3', [4, 22], [26, 22], [26, 24]), W('c3', [8, 22], [8, 24]), W('c3', [12, 22], [12, 24]), W('c3', [18, 22], [18, 24]), W('c3', [22, 22], [22, 24]),
      W('c4', [4, 28], [4, 30]), W('c4', [12, 28], [12, 29], [4, 29]), W('c4', [8, 28], [8, 29]),
      W('c5', [4, 34], [4, 36]), W('c8', [4, 40], [4, 42]),
      W('c6', [18, 28], [18, 30]), W('c6', [26, 28], [26, 29], [18, 29]), W('c6', [22, 28], [22, 29]),
      W('c7', [18, 34], [18, 36]), W('c9', [18, 40], [18, 42]),
      W(NW, [4, 46], [4, 48]), W(NW, [18, 46], [18, 48], [2, 48])
    ], OF)),
    dots: [[3, 10], [5, 9], [7, 8.5], [7, 16.5], [5, 17], [3, 17.5]].concat(shiftPts([[4, 22], [8, 22], [12, 22], [18, 22], [22, 22], [4, 29], [8, 29], [18, 29], [22, 29], [4, 48]], OF)),
    sections: [{ x: 1.5, y: 0.9, t: 'Puissance 3 × 400 V' }, { x: 1.5 + OF, y: 0.9, t: 'Commande 230 V' }],
    guide: [
      { id: 'S2', t: 'S2 lance le chariot vers l\'avant (KM1).' },
      { id: 'SQ1', t: 'En fin de course avant, SQ1 ouvre la branche de KM1 et SQ1 13-14 ferme celle de KM2 : le chariot repart en arrière.' },
      { id: 'SQ2', t: 'En fin de course arrière, SQ2 fait l\'inverse : le cycle continue jusqu\'à l\'arrêt (S1).' },
      { id: 'KM1.21', t: 'Les verrouillages électriques interdisent toujours KM1 et KM2 ensemble.' }
    ]
  });

  const LIST = ['simple', 'vaetvient', 'double', 'telerupteur', 'minuterie', 'dol', 'inversion', 'etoile', 'multipostes', 'acoups', 'fdc'];
  window.AACircuits = { C, LIST, finish, P, W };
})();
