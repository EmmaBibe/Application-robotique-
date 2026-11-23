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

  const LIST = ['simple', 'vaetvient', 'telerupteur', 'dol', 'inversion'];
  window.AACircuits = { C, LIST, finish, P, W };
})();
