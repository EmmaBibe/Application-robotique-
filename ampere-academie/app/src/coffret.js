/* Ampère Académie — coffret de démarrage direct en 3D, piloté par la MÊME simulation que le folio.
 * Plaque de montage, rails DIN, goulottes, disjoncteur-moteur Q1, fusible F1, contacteur KM1, relais thermique F2,
 * bornier X1, porte avec boutons Ø 22 mm et voyants, moteur à l'extérieur. Les conducteurs (couleurs IEC 60204-1 :
 * puissance noir, commande alternative rouge, neutre bleu clair, PE vert-jaune) s'illuminent quand un courant les parcourt. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const RAL7035 = [0.84, 0.85, 0.83], GALVA = [0.66, 0.69, 0.71], DUCT = [0.55, 0.57, 0.58], DARK = [0.2, 0.21, 0.23], BODY = [0.36, 0.38, 0.4];
  const WIRE = { power: [0.08, 0.08, 0.09], ctrl: [0.78, 0.1, 0.1], n: [0.35, 0.62, 0.9], pe: [0.3, 0.7, 0.2] };
  const INFO = {
    Q1: ['Disjoncteur-moteur Q1', 'Sectionne et protège le départ moteur : déclencheur magnétique (courts-circuits) et thermique réglable. Clique pour l\'ouvrir ou le fermer.', 'Bornes 1-3-5 en haut (arrivée L1-L2-L3), 2-4-6 en bas.'],
    F1: ['Fusible F1 (commande)', 'Protège le circuit de commande 230 V. S\'il fond, plus rien ne fonctionne côté commande. Clique pour le remplacer s\'il a fondu.', 'Cartouche 10 × 38, calibre 2 A.'],
    KM1: ['Contacteur KM1', 'Bobine A1-A2 alimentée par la commande ; ses 3 pôles de puissance alimentent le moteur ; contacts auxiliaires 13-14 (auto-maintien) et 23-24 (voyant). Le témoin orange visible en façade indique qu\'il est collé.', 'Pôles 1-2, 3-4, 5-6 ; bobine A1-A2.'],
    F2: ['Relais thermique F2', 'Monté directement sous KM1. Mesure le courant du moteur ; en surcharge il ouvre 95-96 et ferme 97-98. Bouton bleu : réarmement (clique).', 'Plage de réglage 7-10 A pour un moteur de 8,2 A.'],
    X1: ['Bornier X1', 'Toutes les liaisons avec l\'extérieur passent par le bornier : arrivée réseau, départ moteur, porte. Borne bleue = neutre, vert-jaune = terre (PE).', 'Repérage des bornes identique au schéma.'],
    S1: ['Bouton Arrêt S1', 'Bouton-poussoir rouge à ouverture (NF), Ø 22 mm. Maintiens le clic pour appuyer.', 'Contact 1-2.'],
    S2: ['Bouton Marche S2', 'Bouton-poussoir vert à fermeture (NO), Ø 22 mm. Maintiens le clic pour appuyer.', 'Contact 3-4.'],
    H1: ['Voyant Marche H1', 'Voyant vert, alimenté par le contact KM1 23-24.', 'Bornes X1-X2.'],
    H2: ['Voyant Défaut H2', 'Voyant orange, alimenté par le contact F2 97-98.', 'Bornes X1-X2.'],
    M1: ['Moteur M1', 'Moteur asynchrone triphasé 4 kW, 1 440 tr/min. Observe le sens de rotation sur le manchon d\'accouplement.', 'Bornes U1-V1-W1, couplage étoile sur 400 V.'],
    door: ['Porte du coffret', 'Clique sur la poignée pour ouvrir ou fermer. Dans la réalité, la porte ne s\'ouvre qu\'une fois Q1 ouvert (verrouillage de porte) ou par une personne habilitée.', '']
  };

  function buildScene(sc) {
    const root = sc.root, N = (n, parent) => (parent || root).add(n);
    const refs = { wires: [] };
    // sol et mur
    N(sc.box(6, 0.02, 6, { pos: [0, -0.76, 0.5], color: [0.18, 0.19, 0.2], shine: 1 }));
    N(sc.box(6, 3, 0.02, { pos: [0, 0.5, -0.06], color: [0.24, 0.25, 0.27], shine: 1 }));
    // enveloppe
    const enc = N(new AA.GL.Node({ pos: [0, 0, 0] }));
    const T = 0.012;
    enc.add(sc.box(0.8, 1.0, T, { pos: [0, 0, -0.03], color: RAL7035 }));
    enc.add(sc.box(0.8, T, 0.26, { pos: [0, 0.5, 0.1], color: RAL7035 }));
    enc.add(sc.box(0.8, T, 0.26, { pos: [0, -0.5, 0.1], color: RAL7035 }));
    enc.add(sc.box(T, 1.0, 0.26, { pos: [-0.4, 0, 0.1], color: RAL7035 }));
    enc.add(sc.box(T, 1.0, 0.26, { pos: [0.4, 0, 0.1], color: RAL7035 }));
    enc.add(sc.box(0.74, 0.94, 0.004, { pos: [0, 0, -0.02], color: GALVA, shine: 40 }));
    // presse-étoupes
    [-0.25, 0.25].forEach(x => enc.add(sc.cyl(0.018, 0.03, { pos: [x, -0.515, 0.1], color: DARK })));
    // goulottes (avec dents suggérées)
    const duct = (x, y, w, h) => {
      enc.add(sc.box(w, h, 0.06, { pos: [x, y, 0.012], color: DUCT, shine: 4 }));
      enc.add(sc.box(w + 0.004, h + 0.004, 0.004, { pos: [x, y, 0.044], color: [0.62, 0.64, 0.65], shine: 4 }));
      const horiz = w > h, n = Math.floor((horiz ? w : h) / 0.012);
      for (let i = 0; i < n; i++) {
        const o = -((horiz ? w : h) / 2) + 0.006 + i * 0.012;
        [-1, 1].forEach(s => enc.add(sc.box(horiz ? 0.003 : 0.004, horiz ? 0.004 : 0.003, 0.058, { pos: horiz ? [x + o, y + s * (h / 2 - 0.002), 0.012] : [x + s * (w / 2 - 0.002), y + o, 0.012], color: [0.47, 0.49, 0.5], shine: 1 })));
      }
    };
    duct(0, 0.40, 0.66, 0.06); duct(0, 0.08, 0.66, 0.06); duct(0, -0.30, 0.66, 0.06);
    duct(-0.33, 0.05, 0.06, 0.64); duct(0.33, 0.05, 0.06, 0.64);
    // rails DIN
    [0.25, -0.05, -0.41].forEach(y => enc.add(sc.box(0.6, 0.035, 0.0075, { pos: [0, y, -0.012], color: [0.78, 0.8, 0.82], shine: 60 })));
    const pick = (n, id) => { n.pick = id; return n; };
    // --- Q1 disjoncteur-moteur (rail 1) ---
    const q1 = enc.add(pick(new AA.GL.Node({ pos: [-0.2, 0.25, 0] }), 'Q1'));
    q1.add(pick(sc.box(0.045, 0.09, 0.075, { pos: [0, 0, 0.03], color: BODY }), 'Q1'));
    q1.add(pick(sc.box(0.043, 0.05, 0.012, { pos: [0, 0, 0.072], color: DARK }), 'Q1'));
    refs.q1Knob = q1.add(pick(new AA.GL.Node({ pos: [0, 0, 0.08] }), 'Q1'));
    refs.q1Knob.add(pick(sc.cyl(0.014, 0.01, { rot: [Math.PI / 2, 0, 0], color: [0.12, 0.12, 0.13] }), 'Q1'));
    refs.q1Knob.add(pick(sc.box(0.006, 0.026, 0.01, { pos: [0, 0, 0.008], color: [0.9, 0.9, 0.9] }), 'Q1'));
    [-0.015, 0, 0.015].forEach(dx => { q1.add(sc.box(0.008, 0.006, 0.01, { pos: [dx, 0.047, 0.05], color: [0.7, 0.6, 0.3], shine: 60 })); q1.add(sc.box(0.008, 0.006, 0.01, { pos: [dx, -0.047, 0.05], color: [0.7, 0.6, 0.3], shine: 60 })); });
    // --- F1 porte-fusible ---
    const f1 = enc.add(pick(new AA.GL.Node({ pos: [-0.1, 0.25, 0] }), 'F1'));
    f1.add(pick(sc.box(0.018, 0.085, 0.065, { pos: [0, 0, 0.026], color: [0.92, 0.92, 0.9] }), 'F1'));
    f1.add(pick(sc.box(0.016, 0.04, 0.012, { pos: [0, 0, 0.062], color: [0.25, 0.27, 0.3] }), 'F1'));
    refs.f1Ind = f1.add(sc.box(0.008, 0.008, 0.004, { pos: [0, 0.026, 0.07], color: [0.2, 0.2, 0.2] }));
    // --- KM1 contacteur (rail 2) ---
    const km = enc.add(pick(new AA.GL.Node({ pos: [-0.2, -0.05, 0] }), 'KM1'));
    km.add(pick(sc.box(0.045, 0.08, 0.085, { pos: [0, 0, 0.034], color: [0.62, 0.64, 0.66] }), 'KM1'));
    km.add(pick(sc.box(0.045, 0.036, 0.03, { pos: [0, 0.006, 0.09], color: [0.55, 0.57, 0.59] }), 'KM1'));
    km.add(sc.box(0.016, 0.012, 0.002, { pos: [0, 0.006, 0.106], color: [0.1, 0.1, 0.1] }));
    refs.kmFlag = km.add(sc.box(0.012, 0.008, 0.002, { pos: [0, 0.009, 0.1075], color: [1, 0.55, 0.1] }));
    [-0.015, 0, 0.015].forEach(dx => { km.add(sc.box(0.008, 0.006, 0.01, { pos: [dx, 0.042, 0.05], color: [0.7, 0.6, 0.3], shine: 60 })); });
    km.add(sc.box(0.008, 0.006, 0.01, { pos: [-0.02, 0.027, 0.106], color: [0.7, 0.6, 0.3] }));
    km.add(sc.box(0.008, 0.006, 0.01, { pos: [0.02, 0.027, 0.106], color: [0.7, 0.6, 0.3] }));
    // --- F2 relais thermique monté sous KM1 ---
    const f2 = enc.add(pick(new AA.GL.Node({ pos: [-0.2, -0.14, 0] }), 'F2'));
    f2.add(pick(sc.box(0.045, 0.07, 0.08, { pos: [0, 0, 0.034], color: [0.6, 0.62, 0.64] }), 'F2'));
    refs.f2Reset = f2.add(pick(sc.cyl(0.006, 0.012, { pos: [0.012, 0.01, 0.08], rot: [Math.PI / 2, 0, 0], color: [0.15, 0.35, 0.85] }), 'F2'));
    f2.add(sc.cyl(0.008, 0.006, { pos: [-0.01, 0.01, 0.077], rot: [Math.PI / 2, 0, 0], color: [0.85, 0.85, 0.85] }));
    refs.f2Flag = f2.add(sc.box(0.01, 0.006, 0.003, { pos: [-0.01, -0.016, 0.076], color: [0.2, 0.2, 0.2] }));
    // --- Bornier X1 (rail 3) ---
    const x1 = enc.add(new AA.GL.Node({ pos: [0, -0.41, 0] }));
    const terms = ['L1', 'L2', 'L3', 'N', 'PE', ' ', 'U1', 'V1', 'W1', 'PE', ' ', '1', '2', '3', '4', 'X1', 'X2'];
    refs.term = {};
    terms.forEach((t, i) => {
      if (t === ' ') return;
      const col = t === 'N' ? [0.3, 0.55, 0.85] : t === 'PE' ? [0.35, 0.65, 0.2] : [0.6, 0.62, 0.62];
      const x = -0.2 + i * 0.022;
      x1.add(pick(sc.box(0.006, 0.05, 0.045, { pos: [x, 0, 0.018], color: col }), 'X1'));
      if (t === 'PE') x1.add(sc.box(0.0062, 0.012, 0.002, { pos: [x, 0, 0.041], color: [0.95, 0.85, 0.1] }));
      refs.term[t + i] = [x, -0.41 + 0.025, 0.03];
    });
    // --- Conducteurs : chaque tube est rattaché à un net du folio ---
    const wire = (pts, kind, net) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const n = sc.tube(pts[i], pts[i + 1], 0.0018, { color: WIRE[kind], shine: 30 });
        enc.add(n); refs.wires.push({ n, net, kind });
      }
    };
    const z = 0.03;
    // Puissance : X1 → goulotte gauche → Q1 (haut) ; Q1 (bas) → KM1 (haut) ; F2 (bas) → X1 U V W
    ['L1', 'L2', 'L3'].forEach((p, k) => {
      const tx = -0.2 + k * 0.022, qx = -0.215 + k * 0.015;
      wire([[tx, -0.385, z], [tx, -0.30, z], [-0.33, -0.30, z], [-0.33, 0.40, z], [qx, 0.40, z], [qx, 0.295, 0.05]], 'power', p);
      wire([[qx, 0.205, 0.05], [qx, 0.08, z], [qx, 0.08, z], [qx, -0.008, 0.05]], 'power', 'pa' + (k + 1));
      const ux = -0.2 + (6 + k) * 0.022;
      wire([[qx, -0.175, 0.05], [qx, -0.30, z], [ux, -0.30, z], [ux, -0.385, z]], 'power', 'pc' + (k + 1));
    });
    // Neutre et commande : X1 N → goulotte → F1 ; F1 → F2 95 → porte (S1, S2) → KM1 A1 ; KM1 A2 → N
    const nx = -0.2 + 3 * 0.022;
    wire([[nx, -0.385, z], [nx, -0.30, z], [0.33, -0.30, z], [0.33, 0.40, z], [0.02, 0.40, z], [0.02, 0.08, z], [-0.18, 0.08, z], [-0.18, 0.025, 0.1]], 'n', 'N');
    wire([[-0.1, 0.2925, 0.05], [-0.1, 0.40, z], [-0.33, 0.40, z]], 'ctrl', 'L');
    wire([[-0.1, 0.2075, 0.05], [-0.1, 0.08, z], [-0.33, 0.08, z], [-0.33, -0.30, z], [-0.188, -0.30, z], [-0.188, -0.175, 0.07]], 'ctrl', 'c1');
    wire([[-0.212, -0.175, 0.07], [-0.212, -0.30, z], [0.1 - 0.044, -0.30, z], [0.1 - 0.044 + 0.0, -0.385, z]], 'ctrl', 'c2');
    wire([[-0.22, 0.021, 0.1], [-0.22, 0.08, z], [-0.33, 0.08, z], [-0.33, -0.30, z], [0.1, -0.30, z], [0.1, -0.385, z]], 'ctrl', 'c4');
    wire([[-0.33, 0.20, z], [-0.37, 0.20, 0.12]], 'ctrl', 'c3');
    // PE
    const pex = -0.2 + 4 * 0.022;
    wire([[pex, -0.385, z], [pex, -0.47, 0.0], [-0.36, -0.47, 0.0]], 'pe', 'PE');
    refs.root = enc;
    return refs;
  }

  function buildDoor(sc, refs) {
    const hinge = sc.root.add(new AA.GL.Node({ pos: [-0.405, 0, 0.235] }));
    refs.door = hinge;
    const panel = hinge.add(new AA.GL.Node({ pos: [0.405, 0, 0] }));
    panel.add(Object.assign(sc.box(0.81, 1.01, 0.016, { color: RAL7035 }), { pick: 'door' }));
    panel.add(sc.box(0.7, 0.9, 0.004, { pos: [0, 0, -0.01], color: [0.78, 0.79, 0.77] }));
    panel.add(sc.box(0.22, 0.05, 0.003, { pos: [0, 0.38, 0.0095], color: [0.15, 0.16, 0.18] }));
    panel.add(sc.box(0.2, 0.012, 0.004, { pos: [0, 0.38, 0.011], color: [0.95, 0.65, 0.2] }));
    const handle = panel.add(Object.assign(sc.box(0.022, 0.12, 0.03, { pos: [0.355, 0, 0.022], color: DARK }), { pick: 'door' }));
    void handle;
    // Boîte à boutons murale près de la machine (poste de commande local)
    const box = sc.root.add(new AA.GL.Node({ pos: [0.6, 0.02, 0.0] }));
    box.add(sc.box(0.13, 0.36, 0.08, { pos: [0, 0, 0.0], color: [0.84, 0.85, 0.83] }));
    box.add(sc.box(0.1, 0.03, 0.002, { pos: [0, 0.15, 0.041], color: [0.95, 0.75, 0.1] }));
    sc.root.add(sc.tube([0.6, -0.16, 0.0], [0.6, -0.3, 0.0], 0.007, { color: [0.12, 0.12, 0.13] }));
    sc.root.add(sc.tube([0.6, -0.3, 0.0], [0.4, -0.3, 0.05], 0.007, { color: [0.12, 0.12, 0.13] }));
    const btn = (id, y, col, kind) => {
      const g = box.add(new AA.GL.Node({ pos: [0, y, 0.04], pick: id }));
      g.add(Object.assign(sc.cyl(0.02, 0.008, { rot: [Math.PI / 2, 0, 0], pos: [0, 0, 0.004], color: [0.75, 0.76, 0.78], shine: 60 }), { pick: id }));
      const cap = g.add(Object.assign(sc.cyl(kind === 'lamp' ? 0.0125 : 0.014, kind === 'lamp' ? 0.012 : 0.014, { rot: [Math.PI / 2, 0, 0], pos: [0, 0, 0.012], color: col, shine: 80 }), { pick: id }));
      g.add(sc.box(0.05, 0.012, 0.002, { pos: [0, -0.033, 0.001], color: [0.12, 0.12, 0.12] }));
      refs[id] = cap;
      return g;
    };
    btn('H1', 0.095, [0.12, 0.45, 0.2], 'lamp');
    btn('H2', 0.02, [0.6, 0.35, 0.1], 'lamp');
    btn('S2', -0.055, [0.1, 0.62, 0.25], 'pb');
    btn('S1', -0.13, [0.8, 0.12, 0.1], 'pb');
    refs.doorPanel = panel;
  }

  function buildMotor(sc, refs) {
    const m = sc.root.add(new AA.GL.Node({ pos: [0.82, -0.66, 0.18], pick: 'M1' }));
    const blue = [0.16, 0.3, 0.52];
    m.add(Object.assign(sc.cyl(0.075, 0.22, { rot: [0, 0, Math.PI / 2], color: blue, shine: 30 }, 32), { pick: 'M1' }));
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; m.add(sc.box(0.2, 0.012, 0.004, { pos: [0, Math.cos(a) * 0.078, Math.sin(a) * 0.078], rot: [a, 0, 0], color: blue })); }
    m.add(sc.cyl(0.07, 0.07, { rot: [0, 0, Math.PI / 2], pos: [-0.14, 0, 0], color: [0.2, 0.22, 0.25] }, 32));
    m.add(Object.assign(sc.box(0.08, 0.05, 0.08, { pos: [0, 0.09, 0], color: blue }), { pick: 'M1' }));
    m.add(sc.box(0.22, 0.02, 0.16, { pos: [0, -0.085, 0], color: [0.14, 0.24, 0.42] }));
    m.add(sc.cyl(0.012, 0.06, { rot: [0, 0, Math.PI / 2], pos: [0.14, 0, 0], color: [0.75, 0.76, 0.78], shine: 90 }));
    const rotor = m.add(new AA.GL.Node({ pos: [0.18, 0, 0] }));
    rotor.add(sc.cyl(0.04, 0.03, { rot: [0, 0, Math.PI / 2], color: [0.85, 0.5, 0.15], shine: 40 }));
    [0, 2.094, 4.189].forEach((a, k) => rotor.add(sc.box(0.032, 0.012, 0.03, { pos: [0.004, Math.cos(a) * 0.028, Math.sin(a) * 0.028], rot: [a, 0, 0], color: k ? [0.12, 0.12, 0.12] : [0.95, 0.95, 0.95] })));
    refs.rotor = rotor; refs.motor = m;
    // câble moteur
    const pts = [[0.25, -0.515, 0.1], [0.25, -0.62, 0.12], [0.5, -0.7, 0.16], [0.78, -0.62, 0.18]];
    for (let i = 0; i < pts.length - 1; i++) sc.root.add(sc.tube(pts[i], pts[i + 1], 0.008, { color: [0.1, 0.1, 0.11] }));
    const sup = [[-0.25, -0.515, 0.1], [-0.25, -0.75, 0.1]];
    sc.root.add(sc.tube(sup[0], sup[1], 0.009, { color: [0.1, 0.1, 0.11] }));
  }

  AA.Coffret = {
    mount(host, sim, opts) {
      opts = opts || {};
      host.innerHTML = `<div class="stage3d"><canvas></canvas>
        <div class="hud"><span class="chip copper">Démarrage direct · même simulation que le folio</span></div>
        <div class="info3d card js-info"><p class="eyebrow">Coffret de démarrage</p><p class="muted">Clique un appareil pour l'identifier. Sur la boîte à boutons à droite : maintiens le clic sur S2 (vert) pour démarrer, sur S1 (rouge) pour arrêter.</p></div>
        <div class="ctrl3d"><button class="btn sm js-door">${ic.door}Porte</button><button class="btn sm js-tags on">${ic.eye}Repères</button><button class="btn sm js-ov">${ic.flame}Surcharge</button><button class="btn sm js-view">${ic.fit}Vue</button></div>
        <div class="help3d">Glisser : tourner · Clic droit ou Maj : déplacer · Molette / pincer : zoom</div><div class="tags"></div></div>`;
      const cv = host.querySelector('canvas');
      let sc;
      try { sc = new AA.GL.Scene3D(cv, { cam: { target: [0.2, -0.1, 0.1], yaw: 0.38, pitch: 0.17, dist: 1.85, minD: 0.35, maxD: 4.5 } }); }
      catch (e) { host.querySelector('.stage3d').innerHTML = `<div class="card" style="margin:20px"><h3>3D indisponible</h3><p>Ton appareil ne prend pas en charge WebGL (${esc(e.message)}).</p></div>`; return { destroy() { } }; }
      const refs = buildScene(sc);
      buildDoor(sc, refs); buildMotor(sc, refs);
      let doorTarget = -1.9, doorAng = -1.9, shake = 0;
      refs.door.rot = [0, doorAng, 0];
      const tagsBox = host.querySelector('.tags');
      const TAGS = [['Q1', [-0.2, 0.31, 0.09]], ['F1', [-0.1, 0.31, 0.08]], ['KM1', [-0.2, -0.0, 0.12]], ['F2', [-0.2, -0.19, 0.1]], ['X1', [0.0, -0.45, 0.06]], ['M1', [0.82, -0.53, 0.18]], ['S2', [0.66, -0.055, 0.06]], ['S1', [0.66, -0.13, 0.06]], ['H1', [0.66, 0.095, 0.06]], ['H2', [0.66, 0.02, 0.06]]];
      tagsBox.innerHTML = TAGS.map(([t]) => `<span class="tag3d" data-t="${t}">${t}</span>`).join('');
      const info = host.querySelector('.js-info');
      const showInfo = id => {
        const d = INFO[id]; if (!d) return;
        info.innerHTML = `<p class="eyebrow">${esc(id)}</p><h3>${esc(d[0])}</h3><p>${esc(d[1])}</p>${d[2] ? `<p class="muted mono" style="font-size:12px">${esc(d[2])}</p>` : ''}`;
        if (opts.onPick) opts.onPick(id);
      };
      let held = null;
      sc.on('down', (id, e) => {
        if (id === 'S1' || id === 'S2') { held = id; sim.press(id, true); showInfo(id); }
      });
      sc.on('holding', id => id === 'S1' || id === 'S2');
      sc.on('up', (id, moved) => {
        if (held) { sim.press(held, false); held = null; return; }
        if (moved || !id) return;
        showInfo(id);
        if (id === 'door') doorTarget = doorTarget < -0.5 ? 0 : -1.9;
        if (id === 'Q1' || id === 'F1' || id === 'F2') sim.toggle(id);
      });
      host.querySelector('.js-door').onclick = () => { doorTarget = doorTarget < -0.5 ? 0 : -1.9; };
      host.querySelector('.js-tags').onclick = e => { e.currentTarget.classList.toggle('on'); tagsBox.hidden = !e.currentTarget.classList.contains('on'); };
      const ov = host.querySelector('.js-ov');
      ov.onclick = () => { const on = sim.byId.F2.fault === 'overload'; sim.setFault('F2', on ? null : 'overload'); ov.classList.toggle('on', !on); };
      host.querySelector('.js-view').onclick = () => Object.assign(sc.cam, { target: [0.2, -0.1, 0.1], yaw: 0.38, pitch: 0.17, dist: 1.85 });
      const glowCol = { L1: [1, 0.45, 0.1], L2: [1, 0.3, 0.6], L3: [0.6, 0.45, 1], L: [1, 0.45, 0.1], N: [0.2, 0.5, 1], PE: [0, 0, 0] };
      sc.onFrame = (dt, t) => {
        if (!opts.external) sim.step(dt);
        doorAng += (doorTarget - doorAng) * Math.min(1, dt * 4);
        refs.door.rot = [0, doorAng, 0];
        const km = !!sim.coil.KM1;
        refs.kmFlag.pos = [0, km ? 0.003 : 0.009, km ? 0.1075 : 0.1075];
        refs.kmFlag.color = km ? [1, 0.55, 0.1] : [0.35, 0.3, 0.25];
        refs.q1Knob.rot = [0, 0, sim.byId.Q1.st.on ? 0 : -Math.PI / 2];
        refs.f1Ind.color = sim.byId.F1.st.blown ? [1, 0.15, 0.1] : [0.2, 0.2, 0.2];
        refs.f1Ind.em = sim.byId.F1.st.blown ? [0.6, 0.05, 0] : [0, 0, 0];
        refs.f2Flag.color = sim.byId.F2.st.tripped ? [1, 0.6, 0.1] : [0.2, 0.2, 0.2];
        refs.H1.em = sim.lamp.H1 ? [0.2, 1.1, 0.4] : [0, 0, 0];
        refs.H2.em = sim.lamp.H2 ? [1.2, 0.55, 0.1] : [0, 0, 0];
        refs.S1.pos = [0, 0, sim.byId.S1.st.pressed ? 0.007 : 0.012];
        refs.S2.pos = [0, 0, sim.byId.S2.st.pressed ? 0.007 : 0.012];
        const M = sim.byId.M1;
        refs.rotor.rot = [M.st.angle * Math.PI / 180, 0, 0];
        const mono = sim.motor.M1 && sim.motor.M1.state === 'mono';
        shake = mono ? Math.sin(t * 90) * 0.0015 : 0;
        refs.motor.pos = [0.82, -0.66 + shake, 0.18];
        const pulse = 0.55 + 0.45 * Math.sin(t * 8);
        refs.wires.forEach(w => {
          const fl = sim.flow.has(w.net), pot = sim.netPot(w.net);
          const g = fl && pot ? (glowCol[pot] || [1, 0.5, 0.1]) : null;
          w.n.em = g ? g.map(c => c * 0.55 * pulse) : [0, 0, 0];
        });
        // repères
        if (!tagsBox.hidden) TAGS.forEach(([t, p], i) => { const s = sc.project(p), el = tagsBox.children[i]; el.style.transform = `translate(${s.x}px,${s.y}px)`; el.style.opacity = s.vis ? 1 : 0; });
      };
      return { sc, destroy() { sc.destroy(); } };
    }
  };

  AA.route('coffret', main => {
    const { Sim } = window.AASim;
    const sim = new Sim(window.AACircuits.C.dol);
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Coffret 3D</p><h1>Le coffret de démarrage direct</h1><p>Le même circuit que le folio « Démarrage direct », câblé dans un vrai coffret : rails DIN, goulottes, bornier, couleurs normalisées des conducteurs. Les fils s'illuminent quand le courant les parcourt. Affiche le folio à côté pour suivre en même temps le schéma et le câblage.</p></div>
      <div class="seg js-mode"><button data-m="3d" class="on">3D</button><button data-m="split">3D + folio</button></div></div>
      <div class="js-area"></div>`;
    let co = null, sv = null;
    const area = main.querySelector('.js-area');
    const show = mode => {
      if (co) co.destroy(); if (sv) sv.destroy();
      area.innerHTML = mode === 'split' ? '<div class="split"><div class="js-3d"></div><div class="wb-host js-2d" style="height:calc(100vh - 150px);min-height:520px"></div></div>' : '<div class="js-3d"></div>';
      co = AA.Coffret.mount(area.querySelector('.js-3d'), sim, { external: mode === 'split', onPick: id => { if (sv) sv.highlight(id); } });
      if (mode === 'split') {
        const h = area.querySelector('.js-2d');
        h.innerHTML = '<div class="wb-main" style="flex:1"><div class="wb-canvas"></div></div>';
        sv = new window.AASchema.SchemaView(h.querySelector('.wb-canvas'), sim, {});
      } else sv = null;
    };
    show('3d');
    main.querySelectorAll('.js-mode button').forEach(b => b.onclick = () => { main.querySelectorAll('.js-mode button').forEach(x => x.classList.toggle('on', x === b)); show(b.dataset.m); });
    return { leave: () => { if (co) co.destroy(); if (sv) sv.destroy(); } };
  });
})();
