/*
 * Génération des trois documents imprimables (dossier de conception, nomenclature et débit, notice).
 * Le contenu est recalculé à partir du modèle à chaque ouverture.
 */
(function () {
  'use strict';
  const M = window.MODELE, C = window.CALC, S = window.SCENES, P = window.PLANS, E = window.MOTEUR;
  const TYPE = window.TYPE_DOC;
  const ME = M.MEUBLES;
  Object.values(ME).forEach(m => C.nomenclature(m, M.SECTIONS));

  /* ---------- Formatage ---------- */
  function nf(x, d) {
    if (x === undefined || x === null || isNaN(x)) return '';
    const s = Number(x).toFixed(d === undefined ? 0 : d);
    const [ent, dec] = s.split('.');
    const e = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return dec ? e + ',' + dec : e;
  }
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function tableau(entetes, lignes, classes) {
    classes = classes || [];
    let h = '<table><thead><tr>' + entetes.map((e, i) => '<th class="' + (classes[i] || '') + '">' + e + '</th>').join('') + '</tr></thead><tbody>';
    lignes.forEach(l => { h += '<tr>' + l.map((c, i) => '<td class="' + (classes[i] || '') + '">' + (c === undefined ? '' : c) + '</td>').join('') + '</tr>'; });
    return h + '</tbody></table>';
  }
  const ok = (b) => b ? '<span class="ok">conforme</span>' : '<span class="ko">à reprendre</span>';

  /* ---------- Rendus 3D ---------- */
  const scenes = {};
  const rendu = new E.Rendu(document.createElement('canvas'));
  let capture = null;      // rendu réaliste WebGL quand il est disponible
  const PHOTOS = {};       // images calculées par lancer de rayons avant la mise en page
  const VUES_PHOTO = {
    couvK: ['K', { W: 1200, H: 720, lacet: -0.5, tangage: 0.3 }],
    couvC: ['C', { W: 1200, H: 720, lacet: -0.45, tangage: 0.32 }],
    persA: ['A', { W: 1000, H: 760, rideauxOuverts: true, lacet: -0.6, tangage: 0.38 }],
    persB: ['B', { W: 1000, H: 760, lacet: -0.6, tangage: 0.38 }],
    persC: ['C', { W: 1000, H: 760, lacet: -0.6, tangage: 0.38 }]
  };
  const PHOTOS_PAR_DOC = { dossier: ['couvK', 'persA', 'persB', 'persC'], notice: ['couvC'], debit: [], devis: [] };
  function imageVue(cle) {
    if (PHOTOS[cle]) return PHOTOS[cle];
    const v = VUES_PHOTO[cle];
    return image(v[0], Object.assign({}, v[1], { W: Math.round(v[1].W * 1.25), H: Math.round(v[1].H * 1.25) }));
  }
  function image(code, opts) {
    opts = opts || {};
    if (capture) {
      try { return capture.image(code, opts); } catch (e) { capture = null; }
    }
    if (!scenes[code]) scenes[code] = S.construireScene(M, code);
    const sc = scenes[code];
    const m = ME[code];
    const W = opts.W || 1200, H = opts.H || 820;
    const cam = new E.Camera();
    cam.lacet = opts.lacet !== undefined ? opts.lacet : -0.62;
    cam.tangage = opts.tangage !== undefined ? opts.tangage : 0.36;
    cam.focale = 0.42;
    sc.objets.forEach(o => { o.visible = o.couche !== 'mur' || opts.mur !== false; o.teinte = null; o.decal = [0, 0, 0]; });
    S.cadrer(sc, cam, W, H, opts.marge || 1.0);
    const etape = opts.etape;
    sc.objets.forEach(o => {
      if (!o.part) return;
      const p = o.part;
      let v = true;
      if (etape !== undefined && p.etape > etape) v = false;
      if (p.variante === 'ouvert' && !opts.rideauxOuverts) v = false;
      if (p.variante === 'ferme' && opts.rideauxOuverts) v = false;
      if (opts.sans && opts.sans.indexOf(o.couche) >= 0) v = false;
      o.visible = v;
      if (etape !== undefined && p.etape === etape) o.teinte = [217, 104, 43, 0.5];
      if (opts.eclate && m) o.decal = [(p.module || 0) * opts.eclate, 0, 0];
    });
    rendu.dimension(W, H);
    rendu.dessiner(sc, cam, { fond: [255, 255, 255] });
    return rendu.canvas.toDataURL('image/png');
  }

  /* ---------- Calculs de dimensionnement ---------- */
  const SIG_ADM = 235 / 1.5;
  function masseMeuble(m) {
    const n = C.nomenclature(m, M.SECTIONS);
    let acier = 0, bois = 0, tole = 0;
    n.liste.forEach(g => {
      const t = g.masseU * g.qte;
      if (g.cat === 'panneau') bois += t; else if (g.cat === 'tole') tole += t; else acier += t;
    });
    return { acier, bois, tole, total: acier + bois + tole + 1.5 };
  }
  const MASSES = { A: masseMeuble(ME.A), B: masseMeuble(ME.B), C: masseMeuble(ME.C) };

  function verifications() {
    const L = [];
    const g = 9.81;
    const T25 = C.propSection(M.SECTIONS.T25), T20 = C.propSection(M.SECTIONS.T20), R25 = C.propSection(M.SECTIONS.R25);
    const plaque = (b, h) => b * Math.pow(h, 3) / 12;
    function ligneFleche(meuble, elt, portee, larg, ep, kg, critere) {
      const I = plaque(larg, ep);
      const d = C.flecheRepartie(kg * g / portee, portee, C.E_CP, I);
      L.push([meuble, elt, 'CP ' + ep + ' mm, portée ' + portee + ', ' + kg + ' kg répartis', nf(d, 2) + ' mm (L/' + nf(portee / d) + ')', 'L/' + critere, ok(portee / d >= critere)]);
    }
    // A
    ligneFleche('A', 'Tablette penderie 698 × 498', 675, 498, 15, 30, 250);
    ligneFleche('A', 'Tablette étagère 448 × 498', 425, 498, 15, 30, 250);
    ligneFleche('A', 'Dessus 700 × 550', 675, 550, 15, 15, 250);
    {
      const q = 35 * g / 642;
      const d = C.flecheRepartie(q, 642, C.E_ACIER, R25.I), s = q * 642 * 642 / 8 / R25.W;
      L.push(['A', 'Tringle Ø25×1,5', 'portée 642, 35 kg de vêtements', nf(d, 2) + ' mm ; σ = ' + nf(s) + ' MPa', 'L/300 ; ' + nf(SIG_ADM) + ' MPa', ok(642 / d >= 300 && s <= SIG_ADM)]);
    }
    {
      const q = 15 * g / 500;
      const d = C.flecheRepartie(q, 500, C.E_ACIER, T25.I), s = q * 500 * 500 / 8 / T25.W;
      L.push(['A', 'Traverse porte-tablette 25×25', 'portée 500, demi-tablette 15 kg', nf(d, 3) + ' mm ; σ = ' + nf(s, 1) + ' MPa', 'L/300 ; ' + nf(SIG_ADM) + ' MPa', ok(500 / d >= 300 && s <= SIG_ADM)]);
    }
    {
      const N = (195 + 25) * g / 4;
      const Ncr = Math.PI * Math.PI * C.E_ACIER * T25.I / (1900 * 1900);
      L.push(['A', 'Montant 25×25 (flambement)', 'module étagères plein, 4 montants, Lf = 1900', 'N = ' + nf(N) + ' N ; Ncr = ' + nf(Ncr) + ' N', 'coefficient ≥ 3', ok(Ncr / N >= 3) + ' (×' + nf(Ncr / N, 0) + ')']);
    }
    // B
    ligneFleche('B', 'Tablette bouteilles 448 × 238', 428, 238, 15, 14, 250);
    ligneFleche('B', 'Tablette verres 448 × 238', 428, 238, 15, 8, 250);
    {
      const Mf = (60 / 4) * g * 140;
      const s = Mf / (2 * T20.W);
      L.push(['B', 'Nœuds soudés traverse / montant 20×20', 'charge par cadre 15 kg, bras de levier 140, repris par 2 traverses', 'σ = ' + nf(s, 1) + ' MPa', nf(SIG_ADM) + ' MPa', ok(s <= SIG_ADM)]);
    }
    // C
    {
      const I = plaque(570, 18), Pp = 1000;
      const d = C.flecheCentree(Pp, 455, C.E_CP, I);
      L.push(['C', 'Plan bois zone induction', 'CP 18, portée 455, appui d\'une personne 100 kg au centre', nf(d, 2) + ' mm', '3 mm', ok(d <= 3)]);
    }
    ligneFleche('C', 'Tablette casseroles 1048 × 498', 1000, 498, 18, 25, 200);
    {
      const I = plaque(300, 1.5);
      const d = C.flecheCentree(100, 190, 193000, I);
      const d2 = C.flecheCentree(100, 545, 193000, I);
      L.push(['C', 'Bac inox 1,5 mm (zone chaude)', 'casserole 10 kg, bande de 300 mm ; portée 190 grâce aux 2 traverses (545 sans)', nf(d, 2) + ' mm (sans traverses : ' + nf(d2, 0) + ' mm)', '1,5 mm', ok(d <= 1.5)]);
    }
    {
      const I = 2 * (2 * Math.pow(20, 3) / 12);
      const d = C.flecheCentree(200, 500, C.E_ACIER, I);
      L.push(['C', 'Plateau bouteille, tôle 2 mm à bords tombés', 'portée 500, bouteille pleine + casserole 20 kg', nf(d, 2) + ' mm', '2 mm', ok(d <= 2)]);
    }
    return L;
  }

  function stabilite() {
    const g = 9.81;
    const r = [];
    // A sans ancrage
    const WA = (MASSES.A.total + 0.4 * 415) * g;
    const FA = WA * 275 / 1935;
    r.push(['A', 'Effort horizontal en haut qui fait basculer le meuble non fixé (charge à 40 %)', nf(FA) + ' N', 'Un adulte qui tire sur une tablette ou s\'y accroche dépasse 300 N : ancrage obligatoire']);
    r.push(['A', 'Effort par équerre si 300 N en haut sont repris par 2 équerres seulement', nf(150) + ' N', 'Brique creuse : 300 à 600 N par cheville, coefficient ≥ 2']);
    // B
    const WB = (MASSES.B.total + 60) * g;
    const T = WB * 140 / 700 / 4, V = WB / 8;
    r.push(['B', 'Traction par cheville haute (4 chevilles hautes, bras de levier 140 mm, entraxe vertical 700 mm)', nf(T) + ' N', 'Très inférieure à la tenue d\'une cheville Ø8, même en brique creuse']);
    r.push(['B', 'Cisaillement par cheville (8 chevilles)', nf(V) + ' N', 'Charge totale admise : 60 kg d\'objets']);
    // C
    const WG = (12 + 6) * g, hG = 870 - 402, rb = 125;
    r.push(['C', 'Poussée latérale qui renverse la bouteille sur son plateau sans collier (casserole pleine)', nf(WG * rb / hG) + ' N', 'Moins de 5 kg de poussée : le collier fermé est indispensable']);
    const WC = (MASSES.C.total + 40) * g;
    r.push(['C', 'Effort horizontal en haut des montants (1420) qui fait basculer la station non fixée', nf(WC * 275 / 1420) + ' N', '4 équerres murales, chacune reprend largement cet effort']);
    return r;
  }

  /* ---------- Morceaux communs ---------- */
  function couverture(titre, sousTitre, img, liste) {
    return '<section class="couverture"><div class="bandeau"><div class="sur">Colocation étudiante · mobilier sur mesure</div>' +
      '<h1>' + titre + '</h1><div class="sous">' + sousTitre + '</div></div>' +
      '<img src="' + img + '" alt="Vue d\'ensemble">' +
      '<div class="pied">' + tableau(['Document', 'Contenu'], liste) +
      tableau(['Indice', 'Date', 'Objet'], [[M.version.replace('Indice ', ''), M.date, 'Première diffusion : conception complète des trois meubles, à affiner après relevé des appareils et de la pièce']]) + '</div></section>';
  }
  const LISTE_DOCS = [
    ['01 · Dossier de conception et plans', 'Hypothèses, choix des tubes et des panneaux, vérifications, assemblages, sécurité, plans 2D cotés et perspectives'],
    ['02 · Nomenclature et fiches de débit', 'Repères, longueurs, usinages, sous-ensembles soudés, quincaillerie, plans de débit des barres et des panneaux, liste d\'achat'],
    ['03 · Notice de montage, pose et démontage', 'Fabrication en atelier, montage pas à pas, pose murale, démontage et transport, entretien'],
    ['simulation_mobilier.html', 'Visualisation 3D interactive : étapes de montage, rendu final, couches, fiches pièces']
  ];
  function cartouche(meuble, titre, echelle, folio) {
    return '<div class="cartouche"><table><tr><td colspan="3" class="t">' + titre + '</td></tr>' +
      '<tr><td>Meuble</td><td colspan="2">' + meuble + '</td></tr>' +
      '<tr><td>Échelle ' + echelle + '</td><td>Cotes en mm</td><td>Format A4</td></tr>' +
      '<tr><td>' + M.version + '</td><td>' + M.date + '</td><td>Folio ' + folio + '</td></tr></table></div>';
  }
  const LEGENDE = '<div class="legende">' + [['#9aa2ab', 'tube acier'], ['#b8bec5', 'plat / platine'], ['#efdcbc', 'contreplaqué'], ['#dfe4e8', 'tôle'], ['#fff', 'équipement (pointillé)']].map(l => '<span style="background:' + l[0] + '"></span>' + l[1]).join('') + '</div>';

  /* Tableau des chevilles */
  const CHEVILLES = tableau(['Support', 'Fixation conseillée', 'Perçage', 'Tenue indicative par point*'], [
    ['Béton plein', 'Cheville nylon universelle Ø8 × 50 + vis Ø5 × 50, ou goujon d\'ancrage M6', 'Ø8, percussion, profondeur 60', '1,5 à 3 kN'],
    ['Brique pleine, pierre', 'Cheville nylon Ø8 × 50 à collerette', 'Ø8, percussion légère', '1 à 2 kN'],
    ['Brique creuse', 'Cheville longue spéciale corps creux Ø8 × 60, ou scellement chimique avec tamis', 'Ø8, rotation seule (sans percussion)', '0,3 à 0,6 kN'],
    ['Parpaing creux', 'Cheville métallique à expansion pour corps creux, ou scellement chimique avec tamis', 'Ø8 à Ø10, rotation seule', '0,4 à 0,8 kN'],
    ['Cloison plaque de plâtre', 'À éviter pour B et C. Pour A : cheville métallique à expansion, en complément d\'au moins une fixation dans un mur porteur', 'Ø8 ou selon cheville', '0,1 à 0,2 kN']
  ]) + '<p class="petit">* Valeurs courantes de catalogue, à confirmer sur la notice de la cheville achetée. On vise au moins 3 fois l\'effort calculé.</p>';

  /* ====================================================================== */
  /*  DOCUMENT 1 : DOSSIER DE CONCEPTION ET PLANS                           */
  /* ====================================================================== */
  function dossier() {
    let h = couverture('Dossier de conception et plans', 'Dressing modulaire à rideaux · Étagère murale de cuisine · Station de cuisson', imageVue('couvK'), LISTE_DOCS);
    h += '<section class="sommaire"><h2>Sommaire</h2><ol><li>Programme et hypothèses</li><li>Choix des tubes : 20×20 ou 25×25</li><li>Panneaux bois et tôles</li><li>Charges et vérifications</li><li>Assemblages démontables et fixations murales</li><li>Sécurité gaz, chaleur, électricité, poussière</li><li>Finitions et protection</li><li>Plans et perspectives</li></ol></section>';

    // 1. Programme
    h += '<h2>1. Programme et hypothèses</h2>';
    h += '<p>Deux étudiants partagent un logement. Le mobilier doit ranger les vêtements et les chaussures des deux occupants, organiser la vaisselle du quotidien et regrouper la cuisson dans un poste compact et sûr. Les trois meubles reposent sur le même principe : des <b>cadres latéraux soudés en échelle</b>, reliés par des <b>lisses boulonnées</b>, garnis de <b>panneaux contreplaqués</b> vissés par dessous. Rien n\'est soudé sur place ; tout se démonte avec une clé Allen de 5 et une clé de 10.</p>';
    h += tableau(['Meuble', 'Fonction', 'Encombrement', 'Modules', 'Masse à vide'], Object.values(ME).map(m => [
      '<b>' + m.code + '</b> · ' + m.nom, m.code === 'A' ? 'Penderie × 2, casiers pliés, chaussures, protection poussière' : m.code === 'B' ? 'Assiettes (égouttoir), verres eau / bière / whisky, tasses, gobelets, bouteilles' : 'Bouteille gaz 5 kg + brûleur, induction BOMA, réchaud, dépose chaude, casseroles et ustensiles',
      m.encombrement, m.modules.map(x => x.code + ' (' + x.w + ')').join(' + '), nf(MASSES[m.code].total, 0) + ' kg'
    ]));
    h += '<h3>1.1 Exigences retenues</h3><ul>' +
      '<li><b>Démontage :</b> chaque module se sépare des autres ; la plus grande pièce mesure 1900 × 550 mm (cadre du dressing) et passe dans un utilitaire ou sur une galerie de toit. Aucune pièce ne dépasse 10 kg.</li>' +
      '<li><b>Économie :</b> deux sections de tube seulement, achetées en barres de 6 m ; contreplaqué en panneaux standard 2440 × 1220 ; quincaillerie courante (M5, M6, M8).</li>' +
      '<li><b>Fabrication :</b> réalisable par un atelier de soudure de quartier (poste à l\'électrode ou semi-automatique), perceuse à colonne et pince à écrous à sertir.</li>' +
      '<li><b>Sécurité :</b> ancrage mural anti-basculement sur les trois meubles, poste gaz ventilé avec collier de maintien, zone chaude entièrement métallique, écran thermique entre gaz et électrique.</li></ul>';
    h += '<h3>1.2 Conventions</h3><p>Cotes en millimètres. Repère : x de gauche à droite vu de face, y de l\'avant vers le mur, z vers le haut depuis le sol (depuis le dessous du meuble pour l\'étagère B). Tolérances de fabrication : débit ±1 mm, entraxe des perçages ±0,5 mm, équerrage des cadres : écart des diagonales ≤ 2 mm.</p>';
    h += '<h3>1.3 Hypothèses sur les appareils et les objets rangés</h3><p>Les dimensions exactes dépendent des modèles achetés. Les valeurs ci-dessous ont servi au dimensionnement ; la colonne de droite indique ce qui change si le modèle réel est différent.</p>';
    h += tableau(['Objet', 'Hypothèse retenue', 'Si le modèle réel diffère'], [
      ['Bouteille gaz 5 kg', M.HYP.bouteille.txt, 'Le plateau se règle sur 3 crans (340 / 400 / 460 mm) ; collier Ø 276 intérieur avec garniture caoutchouc, accepte Ø 230 à 270'],
      ['Brûleur + support alu', M.HYP.bruleur.txt, 'Ajuster le cran du plateau pour amener le support à la hauteur de la plaque induction (≈ 870 mm du sol)'],
      ['Plaque induction BOMA', M.HYP.induction.txt, 'La zone bois de 480 × 570 accepte jusqu\'à 380 × 470 en gardant 50 mm de dégagement'],
      ['Réchaud monoplace', M.HYP.rechaud.txt, 'Bac inox utile 565 × 565 ; si le réchaud est à gaz ou à pétrole, mêmes distances que le brûleur gaz'],
      ['Casseroles, marmites', M.HYP.casserole.txt, 'Tablettes 1048 × 498, hauteur libre 300 mm sous la tablette médiane'],
      ['Assiettes', M.HYP.assiette.txt, 'Le râtelier (pas 36 mm) prend des assiettes de 200 à 280 mm'],
      ['Bouteilles', M.HYP.bouteilles.txt, 'Hauteur libre 345 mm au niveau bas du module M2'],
      ['Verres et tasses', M.HYP.verres.txt, 'Hauteurs libres : 195 mm (niveau 1) et 235 mm (niveau 2)']
    ]);

    // 2. Tubes
    h += '<h2>2. Choix des tubes : 20×20 ou 25×25</h2>';
    const secs = [['20×20×1,2', { type: 'carre', a: 20, t: 1.2 }], ['20×20×1,5', { type: 'carre', a: 20, t: 1.5 }], ['25×25×1,2', { type: 'carre', a: 25, t: 1.2 }], ['25×25×1,5', { type: 'carre', a: 25, t: 1.5 }], ['25×25×2', { type: 'carre', a: 25, t: 2 }]];
    const ref = C.propSection(secs[1][1]);
    h += tableau(['Section', 'Aire (mm²)', 'I (mm⁴)', 'W (mm³)', 'Masse (kg/m)', 'Rigidité / 20×1,5', 'Prix / 20×1,5*', 'Soudure électrode', 'Écrou à sertir'], secs.map(([n, s]) => {
      const p = C.propSection(s);
      return [n, nf(p.A), nf(p.I), nf(p.W), nf(p.kgm, 2), '×' + nf(p.I / ref.I, 2), '×' + nf(p.kgm / ref.kgm, 2), s.t < 1.5 ? 'délicate (risque de percer)' : s.t > 1.5 ? 'facile' : 'bonne', s.a === 20 ? 'M5 (Ø7)' : 'M6 (Ø9)'];
    }), ['', 'n', 'n', 'n', 'n', 'n', 'n', '', '']);
    h += '<p class="petit">* Le prix d\'un tube suit à peu près sa masse ; l\'écart réel dépend du fournisseur. Valeurs de section minorées de 4 à 5 % pour tenir compte des angles arrondis.</p>';
    const syn = C.syntheseAchats(M);
    const t25 = syn.sections.find(s => s.sec === 'T25'), t20 = syn.sections.find(s => s.sec === 'T20');
    const kg20 = C.propSection(M.SECTIONS.T20).kgm;
    h += '<h3>2.1 Décision</h3>';
    h += tableau(['Meuble', 'Section retenue', 'Raisons'], [
      ['A · Dressing', '<b>25×25×1,5</b>', 'Montants de 1,9 m : le 25 est deux fois plus rigide que le 20 pour 27 % de masse en plus, ce qui supprime l\'effet « meuble qui vibre ». Les écrous à sertir M6 tiennent mieux dans une face de 25. Charge totale de calcul 415 kg.'],
      ['B · Étagère murale', '<b>20×20×1,5</b>', 'Charges faibles (60 kg au total) et meuble suspendu : chaque kilo d\'acier économisé est un kilo de moins sur les chevilles. Aspect plus fin au-dessus du plan de travail. Écrous à sertir M5.'],
      ['C · Station cuisson', '<b>25×25×1,5</b>', 'Plan de travail sollicité (appuis, casseroles), bouteille pleine, montants rehaussés à 1,4 m pour l\'ancrage mural et la barre à ustensiles. Même section que A : un seul approvisionnement.']
    ]);
    h += '<p><b>Épaisseur 1,5 mm partout.</b> Le 1,2 mm ne fait gagner que 15 à 20 % de masse, mais il se perce facilement à l\'électrode, s\'écrase sous un boulon serré et donne moins de filets aux vis autoperceuses. Le 2 mm coûterait 30 % de plus sans besoin mécanique. Pour l\'ensemble du projet : ' + nf(t25.Ltot / 1000, 1) + ' m de 25×25×1,5 (' + nf(t25.barres.length) + ' barres de 6 m, ' + nf(t25.kg, 1) + ' kg) et ' + nf(t20.Ltot / 1000, 1) + ' m de 20×20×1,5 (' + nf(t20.barres.length) + ' barres, ' + nf(t20.kg, 1) + ' kg). Tout faire en 20×20 économiserait environ ' + nf(t25.kg - t25.Ltot / 1000 * kg20, 0) + ' kg d\'acier, au prix d\'une rigidité divisée par deux sur les deux grands meubles : ce n\'est pas un bon calcul.</p>';

    // 3. Panneaux
    h += '<h2>3. Panneaux bois et tôles</h2>';
    h += tableau(['Matériau', 'Emploi', 'Justification'], [
      ['Contreplaqué 15 mm (okoumé ou triplex bouleau)', 'Tablettes et dessus de A et B, étagère à épices de C', 'Rigidité suffisante jusqu\'à 700 mm de portée sous 30 kg ; tient les vis 4×30 ; un panneau de 2440 × 1220 pèse environ 22 kg et se manipule seul.'],
      ['Contreplaqué 18 mm (collage extérieur)', 'Plan de travail bois et tablettes de C', 'Portée de 1000 mm sous casseroles, appuis sur le plan, ambiance humide de cuisine. Le collage extérieur (classe 3, « CTB-X » ou « WBP ») évite le décollement des plis.'],
      ['Contreplaqué 5 mm', 'Joues latérales de A', 'Fermeture anti-poussière, sans rôle structurel. Peut être remplacé par un tissu tendu.'],
      ['Tôle inox 304 1,5 mm', 'Bac de la zone chaude de C', 'Pas de bois sous le réchaud ni sous la casserole chaude ; bords relevés de 15 mm qui retiennent les débordements.'],
      ['Tôle inox 304 0,8 mm', 'Bac égouttoir de B', 'Inoxydable, se vide et se lave.'],
      ['Tôle acier 2 mm', 'Plateau porte-bouteille de C', 'Bords tombés de 20 mm qui servent de raidisseurs ; peinte.'],
      ['Tôle galvanisée 1 mm', 'Écran thermique de C', 'Réfléchit la chaleur de la flamme vers le haut, côté gaz.'],
      ['Tôle aluminium 1 mm', 'Crédence murale de C', 'Protège le mur derrière le brûleur et le réchaud ; se nettoie à l\'éponge.']
    ]);
    h += '<p>L\'aggloméré et le MDF sont écartés : ils gonflent à l\'humidité, tiennent mal les vis après deux ou trois démontages et sont plus lourds à rigidité égale.</p>';

    // 4. Vérifications
    h += '<h2>4. Charges et vérifications</h2>';
    h += '<h3>4.1 Charges d\'exploitation retenues</h3>';
    h += tableau(['Meuble', 'Élément', 'Charge de calcul'], [
      ['A', 'Tablette (chaussures, vêtements pliés)', '30 kg par tablette'], ['A', 'Tringle de penderie', '35 kg répartis'], ['A', 'Dessus (bagages légers)', '15 kg'], ['A', 'Total meuble chargé', '415 kg'],
      ['B', 'Bouteilles (niveau bas M2)', '14 kg'], ['B', 'Verres, tasses, assiettes, dessus', '6 à 8 kg par niveau'], ['B', 'Total suspendu au mur', '60 kg + ' + nf(MASSES.B.total) + ' kg de meuble'],
      ['C', 'Bouteille pleine + casserole', '18 kg sur le plateau'], ['C', 'Tablettes casseroles', '25 kg chacune'], ['C', 'Plan de travail', 'appui ponctuel de 100 kg + appareils']
    ]);
    h += '<p>Acier S235 : contrainte admissible retenue 235 / 1,5 = ' + nf(SIG_ADM) + ' MPa ; E = 210 000 MPa. Contreplaqué : E = 6 500 MPa (valeur prudente dans le sens des plis extérieurs).</p>';
    h += '<h3>4.2 Résultats</h3>';
    h += tableau(['', 'Élément', 'Hypothèse', 'Résultat', 'Limite', 'Avis'], verifications());
    h += '<h3>4.3 Stabilité et ancrage</h3>';
    h += tableau(['', 'Situation', 'Valeur', 'Conclusion'], stabilite());
    h += '<div class="note">Les trois meubles doivent être fixés au mur avant d\'être chargés. Le dressing, haut et peu profond, bascule sous un effort qu\'un adulte exerce sans s\'en rendre compte ; la bouteille surélevée bascule sous une poussée de quelques kilos si le collier n\'est pas fermé.</div>';

    // 5. Assemblages
    h += '<h2 class="saut">5. Assemblages démontables et fixations murales</h2>';
    h += '<h3>5.1 Principe</h3><ul>' +
      '<li><b>Cadres latéraux soudés</b> (deux montants + traverses de profondeur) : c\'est la partie rigide, fabriquée en atelier sur gabarit. Les cadres sont plats, ils s\'empilent pour le transport.</li>' +
      '<li><b>Lisses boulonnées</b> : tube de largeur avec une platine 3 mm soudée à chaque bout. Deux vis CHC par platine (une au-dessus, une au-dessous du tube) bloquent la rotation : le module ne se déforme pas en parallélogramme.</li>' +
      '<li><b>Écrous à sertir</b> dans les montants : filetage acier permanent, aucun écrou à tenir derrière le tube, et le filetage ne s\'use pas au fil des démontages, contrairement à une vis autoperceuse.</li>' +
      '<li><b>Cadres réversibles</b> : chaque cadre est percé et serti sur ses deux faces latérales. Un même cadre se monte à gauche ou à droite d\'un module, ce qui évite les erreurs et permet de recomposer les modules dans un autre logement.</li>' +
      '<li><b>Liaison entre modules</b> : boulons traversants M6 (M5 pour B) à travers deux montants accolés.</li>' +
      '<li><b>Panneaux</b> posés sur les traverses avec 1 mm de jeu de chaque côté et vissés par dessous ; ils participent au contreventement.</li></ul>';
    h += '<h3>5.2 Jeux, tolérances et couples de serrage</h3>';
    h += tableau(['Liaison', 'Jeu / tolérance', 'Serrage'], [
      ['Vis M6 dans platine', 'Trou Ø6,5 (jeu 0,5 mm) ; entraxe ±0,5 mm', 'Vis CHC M6×16 classe 8.8 : 8 N·m'],
      ['Vis M5 dans platine (B)', 'Trou Ø5,5', 'Vis CHC M5×16 : 5 N·m'],
      ['Écrou à sertir M6 / M5', 'Perçage Ø9 / Ø7 exact, ébavuré', 'Sertissage à la pince, contrôle à la vis'],
      ['Boulon inter-modules', 'Trou Ø6,5 traversant', '5 N·m seulement (ne pas écraser les tubes)'],
      ['Tablette entre cadres', '1 mm de chaque côté, appui ≥ 22 mm sur la traverse', 'Vis bois 4×30 à la main'],
      ['Tringle de penderie', 'Longueur = entre-traverses − 8 mm', 'Cuvettes vissées M5'],
      ['Rideau', 'Bas à 15 mm du sol, recouvrement central 50 mm', '—'],
      ['Vérins M8', 'Course 15 à 30 mm, réglés à mi-course au montage', 'Contre-écrou à la main']
    ]);
    h += '<h3>5.3 Fixation murale selon le support</h3>' + CHEVILLES;
    h += '<h3>5.4 Détails</h3><div class="details">' + P.details().join('') + '</div>';

    // 6. Sécurité
    h += '<h2 class="saut">6. Sécurité gaz, chaleur, électricité, poussière</h2>';
    h += '<h3>6.1 Poste gaz</h3><ul>' +
      '<li>Bouteille toujours debout, dans un logement ouvert devant et dessous : jamais dans un placard fermé. Le gaz butane ou propane est plus lourd que l\'air ; le local doit avoir une entrée d\'air basse et une sortie haute permanentes.</li>' +
      '<li>Plateau surélevé à 400 mm (réglable) pour cuisiner debout, collier fermé par sangle pendant toute la cuisson.</li>' +
      '<li>Robinet et détendeur accessibles en façade ; robinet fermé après chaque utilisation.</li>' +
      '<li>Étanchéité contrôlée à l\'eau savonneuse à chaque changement de bouteille, jamais à la flamme. Joint du brûleur remplacé au moindre défaut.</li>' +
      '<li>Casserole de Ø 300 mm au plus : une casserole plus large renvoie la chaleur vers le haut de la bouteille.</li>' +
      '<li>Rien au-dessus du brûleur sur 750 mm (l\'étagère B est placée à côté, jamais au-dessus).</li>' +
      '<li>Couverture anti-feu fixée au mur à gauche du poste ; détecteur de monoxyde de carbone conseillé dans la pièce.</li></ul>';
    h += '<h3>6.2 Distances thermiques</h3>';
    h += tableau(['Entre', 'Distance prévue', 'Minimum visé'], [
      ['Bord de casserole Ø 300 et écran galvanisé', '75 mm', '50 mm, avec écran métallique'],
      ['Axe du brûleur et carter de la plaque induction', '345 mm + écran', '300 mm'],
      ['Brûleur et tout élément au-dessus', 'dégagé', '750 mm'],
      ['Réchaud et bois', 'réchaud posé sur inox, plan bois à 20 mm du bac, rien sous la zone chaude', 'jamais de bois sous un réchaud'],
      ['Foyer du réchaud et étagère à épices', '≈ 450 mm', '400 mm'],
      ['Bouteille et bloc de prises', '≈ 1 230 mm', '1 000 mm'],
      ['Plaque induction et parois (ventilation)', '95 mm sur les côtés, 100 mm à l\'arrière', '50 mm']
    ]);
    h += '<h3>6.3 Électricité</h3><p>Plaque induction 2000 W et réchaud 1500 W : 3,5 kW, soit environ 15 A sous 230 V, à la limite d\'une prise 16 A. Les deux appareils ne doivent pas fonctionner en même temps sur la même prise ; jamais de multiprise. Le bloc 2 prises 16 A est vissé sur le montant arrière droit, à plus d\'un mètre de la bouteille, alimenté par un câble 3 × 2,5 mm² (3 × 1,5 mm² au minimum). Les câbles ne passent ni au-dessus du bac inox ni près de la flamme.</p>';
    h += '<h3>6.4 Poussière (dressing)</h3><p>Dessus pleins de 15 mm qui recouvrent toute la surface, joues latérales de 5 mm, et deux rideaux tombant à 15 mm du sol avec 50 mm de recouvrement au centre. La tringle est avancée de 55 mm devant les montants pour que les rideaux ne frottent pas sur les tablettes. Un lambrequin (bande de tissu de 100 mm agrafée sur le chant avant des dessus) peut fermer le jour en haut.</p>';

    // 7. Finitions
    h += '<h2>7. Finitions et protection</h2><ul>' +
      '<li>Acier : dégraissage, brossage des soudures, une couche d\'antirouille, deux couches de laque glycérophtalique ou de peinture époxy. Surface à peindre ≈ ' + nf((t25.Ltot * 0.1 + t20.Ltot * 0.08) / 1000, 1) + ' m² : 1 L d\'antirouille et 1 L de laque suffisent.</li>' +
      '<li>Module gaz : peinture haute température (600 °C) sur la partie haute des cadres ; écran galvanisé laissé brut.</li>' +
      '<li>Contreplaqué : ponçage grain 120, chants arrondis, vernis polyuréthane deux couches (trois sur le plan de travail). Pour l\'étagère B, vernis compatible contact alimentaire.</li>' +
      '<li>Écrous à sertir posés après peinture ou protégés par une vis pendant la peinture.</li></ul>';

    // 8. Plans
    h += plansMeubles();
    return h;
  }

  function plansMeubles() {
    let h = '';
    let folio = 1;
    const cfg = {
      A: { ech: 1 / 15, echT: '1:15', echCadre: 1 / 12.5, echCadreT: '1:12,5' },
      B: { ech: 1 / 7.5, echT: '1:7,5', echCadre: 1 / 6, echCadreT: '1:6' },
      C: { ech: 1 / 12.5, echT: '1:12,5', echCadre: 1 / 10, echCadreT: '1:10' }
    };
    Object.values(ME).forEach(m => {
      const c = cfg[m.code];
      const sol = m.code !== 'B';
      const zMax = m.dims.H;
      const nivFace = m.niveaux.face.slice().sort((u, v) => u - v).filter((v, i, a) => a.indexOf(v) === i);
      const textesE = m.code === 'A' ? m.niveaux.faceE.map(z => ({ u: 925, v: z + 30, t: 'z ' + z, a: 'middle', k: 0.85, c: '#1b4f7a' })) : [];
      // Feuille 1 : face + droite
      const face = P.vue(m, 'face', { ech: c.ech, sol, equip: true, rideaux: false, margeG: 34, margeB: 26,
        cotesH: [{ pos: m.cotesH, v: 0, decal: -12 }, { pos: [m.cotesH[0], m.cotesH[m.cotesH.length - 1]], v: 0, decal: -20 }],
        cotesV: [{ pos: nivFace, u: m.code === 'A' ? -5 : 0, decal: -8, cote: true }, { pos: [0, zMax], u: m.code === 'A' ? -5 : 0, decal: -26 }],
        textes: textesE });
      const yMin = m.code === 'A' ? -70 : (m.code === 'C' ? -20 : -95);
      const droite = P.vue(m, 'droite', { ech: c.ech, sol, equip: true, rideaux: m.code === 'A', mur: m.murY, filtre: p => !/^Joue/.test(p.nom), margeG: 12, margeD: 24, margeB: 26,
        cotesH: [{ pos: [yMin, 0, m.code === 'B' ? 280 : 550, m.murY], v: m.code === 'B' ? -160 : 0, decal: -12 }],
        cotesV: [{ pos: [0, zMax], u: m.murY, decal: 10 }] });
      h += '<section class="paysage"><div class="feuille"><h2>' + m.code + ' · ' + m.nom + ' — vue de face et vue de droite</h2>' +
        '<div class="vues"><figure>' + face + '<figcaption>Vue de face (rideaux non représentés, équipements en pointillé)</figcaption></figure>' +
        '<figure>' + droite + '<figcaption>Vue de droite' + (m.code === 'A' ? ' avec rideau, joue latérale retirée' : '') + ' — mur à droite</figcaption></figure></div>' + LEGENDE +
        cartouche(m.code + ' · ' + m.nom, 'Vues de face et de droite', c.echT, folio++) + '</div>';
      // Feuille 2 : dessus + perspective
      const dessus = P.vue(m, 'dessus', { ech: c.ech, equip: false, rideaux: false, mur: m.murY, margeG: 20, margeB: 22, margeH: 14,
        cotesH: [{ pos: m.cotesH, v: yMin, decal: -10 }],
        cotesV: [{ pos: [yMin, m.murY], u: m.dims.L, decal: 12 }] });
      const iso = imageVue('pers' + m.code);
      h += '<div class="feuille"><h2>' + m.code + ' · ' + m.nom + ' — vue de dessus et perspective</h2>' +
        '<div class="vues" style="align-items:flex-start"><figure>' + dessus + '<figcaption>Vue de dessus, mur en haut</figcaption></figure>' +
        '<figure style="flex:1;min-width:125mm"><img src="' + iso + '" style="width:100%;max-height:158mm;object-fit:contain;border:0.5pt solid #ccc"><figcaption>Perspective, ' + (m.code === 'A' ? 'rideaux ouverts' : 'équipée') + '</figcaption></figure></div>' +
        cartouche(m.code + ' · ' + m.nom, 'Vue de dessus et perspective', c.echT, folio++) + '</div>';
      // Feuille 3 : cadres soudés
      h += '<div class="feuille"><h2>' + m.code + ' · Cadres soudés (vue de la face latérale)</h2><div class="vues" style="gap:8mm">';
      m.typesCadre.forEach(ft => {
        h += '<figure>' + P.cadre(ft, M.SECTIONS, c.echCadre) + '<figcaption><b>' + ft.nom + '</b> — ' + ft.inst + ' exemplaire' + (ft.inst > 1 ? 's' : '') + '<br>Section ' + M.SECTIONS[ft.sec].nom + '</figcaption></figure>';
      });
      h += '</div><p class="legende" style="max-width:170mm">Cercles rouges : écrous à sertir sur les deux faces latérales (cotes cumulées depuis le bas : à gauche montant avant, à droite montant arrière). Cercles bleus barrés : trous traversants de liaison entre modules. Triangles rouges : écrous à sertir sur la face avant. Cotes de droite proches du cadre : niveaux des traverses (dessus de traverse).</p>' +
        cartouche(m.code + ' · ' + m.nom, 'Cadres soudés', c.echCadreT, folio++) + '</div></section>';
    });
    return h;
  }

  /* ====================================================================== */
  /*  DOCUMENT 2 : NOMENCLATURE ET FICHES DE DÉBIT                          */
  /* ====================================================================== */
  function debit() {
    let h = couverture('Nomenclature et fiches de débit', 'Pièces repérées, usinages, sous-ensembles soudés, quincaillerie et liste d\'achat', image('A', { W: 1500, H: 900, eclate: 260, sans: ['equip', 'rideaux'], lacet: -0.55, tangage: 0.3 }), LISTE_DOCS);
    h += '<h2>Lecture des repères</h2><p>Chaque pièce porte un repère <b>meuble-type-numéro</b> : A, B ou C pour le meuble, puis <b>T</b> tube carré, <b>R</b> rond (tube ou plein), <b>F</b> fer plat ou cornière, <b>P</b> panneau bois, <b>S</b> tôle, <b>Q</b> quincaillerie. Les longueurs sont des longueurs de débit, coupes droites sauf mention. Marquer le repère au feutre ou à la pointe à tracer dès la coupe.</p>';
    h += '<div class="note bleu">Contrôler les cotes d\'un premier cadre complet avant de lancer la série : un écart sur la longueur des traverses se retrouve sur toutes les tablettes.</div>';
    Object.values(ME).forEach(m => {
      const n = C.nomenclature(m, M.SECTIONS);
      h += '<h2 class="saut">' + m.code + ' · ' + m.nom + '</h2>';
      const metal = n.liste.filter(g => ['tube', 'rond', 'plat'].indexOf(g.cat) >= 0);
      h += '<h3>Profilés : tubes, ronds, plats</h3>';
      h += tableau(['Rep.', 'Désignation', 'Section', 'L (mm)', 'Qté', 'Coupes', 'Usinages', 'Sous-ensemble', 'kg'], metal.map(g => [
        '<span class="cle">' + g.rep + '</span>', g.noms.join(' / '), M.SECTIONS[g.debit.sec].nom.replace(/ \(.*\)/, ''), nf(g.debit.L), nf(g.qte), g.debit.coupe || '', g.debit.usin || '—', g.sousEns.join(', ') || '—', nf(g.masseU * g.qte, 2)
      ]), ['', '', '', 'n', 'n', '', '', '', 'n']);
      const pan = n.liste.filter(g => g.cat === 'panneau' || g.cat === 'tole');
      h += '<h3>Panneaux et tôles</h3>';
      h += tableau(['Rep.', 'Désignation', 'Matériau', 'L × l (mm)', 'Qté', 'Usinages, finition', 'kg'], pan.map(g => [
        '<span class="cle">' + g.rep + '</span>', g.noms.join(' / '), g.mat, nf(g.debit.L) + ' × ' + nf(g.debit.l), nf(g.qte), g.debit.usin || '', nf(g.masseU * g.qte, 1)
      ]), ['', '', '', 'n', 'n', '', 'n']);
      h += '<h3>Sous-ensembles soudés</h3>';
      h += tableau(['Sous-ensemble', 'Nombre', 'Composition (par exemplaire)', 'Masse unitaire'], n.sousEnsembles.map(se => {
        let kg = 0;
        const comp = Object.keys(se.composition).map(r => {
          const g = n.liste.find(x => x.rep === r);
          kg += g.masseU * se.composition[r];
          return se.composition[r] + ' × ' + r;
        }).join(' + ');
        return [se.nom, nf(se.n), comp, nf(kg, 2) + ' kg'];
      }), ['', 'n', '', 'n']);
      h += '<h3>Quincaillerie</h3>';
      h += tableau(['Rep.', 'Désignation', 'Qté', 'Emploi'], n.quinc.map(q => ['<span class="cle">' + q.rep + '</span>', q.designation, nf(q.qte), q.usages.join(', ')]), ['', '', 'n', '']);
      const ms = MASSES[m.code];
      h += '<p><b>Masse du meuble :</b> acier ' + nf(ms.acier, 1) + ' kg, bois ' + nf(ms.bois, 1) + ' kg, tôles ' + nf(ms.tole, 1) + ' kg, quincaillerie ≈ 1,5 kg ; total ≈ <b>' + nf(ms.total, 0) + ' kg</b>.</p>';
    });

    // synthèse achats
    const syn = C.syntheseAchats(M);
    h += '<h2 class="saut">Synthèse des achats (trois meubles)</h2>';
    h += '<p>Les colonnes de prix sont laissées vides pour être complétées avec les tarifs du fournisseur local.</p>';
    h += '<h3>Acier en barres</h3>';
    h += tableau(['Section', 'Longueur utile', 'Barres', 'Chute', 'Masse', 'Prix unitaire', 'Total'], syn.sections.map(s => {
      const chute = s.barres.length * s.barre - s.Ltot;
      return [s.nom, nf(s.Ltot / 1000, 2) + ' m', s.barres.length + ' × ' + nf(s.barre / 1000, 0) + ' m', nf(chute / 1000, 2) + ' m (' + nf(100 * chute / (s.barres.length * s.barre), 0) + ' %)', nf(s.kg, 1) + ' kg', '', ''];
    }), ['', 'n', 'n', 'n', 'n', 'vide', 'vide']);
    h += '<h3>Plans de débit des barres</h3><p class="petit">Optimisation « plus longue pièce d\'abord », trait de scie 3 mm. Les chutes de plus de 300 mm sont à garder pour les platines et les pattes.</p>';
    syn.sections.forEach(s => {
      if (s.barres.length > 20) return;
      h += '<h4>' + s.nom + '</h4><div class="barres">' + dessinBarres(s) + '</div>';
    });
    h += '<h3>Panneaux bois (format 2440 × 1220)</h3>';
    h += tableau(['Matériau', 'Surface utile', 'Panneaux', 'Taux d\'utilisation', 'Prix unitaire', 'Total'], syn.panneaux.map(p => [p.mat, nf(p.surf / 1e6, 2) + ' m²', nf(p.panneaux.length), nf(100 * p.surf / (p.panneaux.length * 2440 * 1220), 0) + ' %', '', '']), ['', 'n', 'n', 'n', 'vide', 'vide']);
    syn.panneaux.forEach(p => {
      h += '<h4>' + p.mat + '</h4><div class="calepin">' + dessinCalepin(p) + '</div>';
    });
    h += '<h3>Tôles (à faire découper et plier par le fournisseur)</h3>';
    const toles = [];
    Object.values(ME).forEach(m => C.nomenclature(m, M.SECTIONS).liste.filter(g => g.cat === 'tole').forEach(g => toles.push([g.rep, g.noms.join(' / '), g.mat, nf(g.debit.L) + ' × ' + nf(g.debit.l), g.debit.usin, nf(g.qte), ''])));
    h += tableau(['Rep.', 'Pièce', 'Matériau', 'Développé', 'Façonnage', 'Qté', 'Prix'], toles, ['', '', '', 'n', '', 'n', 'vide']);
    h += '<h3>Quincaillerie (total)</h3>';
    h += tableau(['Désignation', 'Qté', 'À acheter (+10 %)', 'Meubles', 'Prix'], syn.quinc.sort((u, v) => u.designation < v.designation ? -1 : 1).map(q => [q.designation, nf(q.qte), nf(Math.ceil(q.qte * 1.1)), q.meubles.join(', '), '']), ['', 'n', 'n', '', 'vide']);
    h += '<h3>Fournitures diverses</h3>';
    h += tableau(['Article', 'Quantité', 'Remarque', 'Prix'], [
      ['Tissu de rideau coton / polyester serré, laize 150 cm', '4,3 m', '2 panneaux de 1460 × 2060 coupés (ourlets compris)', ''],
      ['Antirouille', '1 L', '≈ ' + nf((syn.sections.find(s => s.sec === 'T25').Ltot * 0.1 + syn.sections.find(s => s.sec === 'T20').Ltot * 0.08) / 1000, 1) + ' m² d\'acier', ''],
      ['Laque ou peinture époxy', '1 L', 'Deux couches', ''],
      ['Peinture haute température 600 °C (aérosol)', '1', 'Haut du module gaz', ''],
      ['Vernis polyuréthane (alimentaire pour B)', '1 L', 'Deux à trois couches', ''],
      ['Garniture caoutchouc 3 mm, bande 30 mm', '1 m', 'Intérieur du collier de bouteille', ''],
      ['Câble 3 × 2,5 mm² + fiche 16 A', 'selon distance à la prise', 'Alimentation du bloc de prises', ''],
      ['Couverture anti-feu 1 × 1 m', '1', 'Fixée au mur près du poste gaz', ''],
      ['Détecteur de monoxyde de carbone', '1', 'Conseillé', '']
    ], ['', 'n', '', 'vide']);
    const tot = MASSES.A.total + MASSES.B.total + MASSES.C.total;
    h += '<p><b>Masse totale des trois meubles :</b> ≈ ' + nf(tot, 0) + ' kg (A ' + nf(MASSES.A.total) + ' kg, B ' + nf(MASSES.B.total) + ' kg, C ' + nf(MASSES.C.total) + ' kg).</p>';
    return h;
  }

  const PALETTE = ['#9fb7cf', '#d8b98a', '#a9c79a', '#e0a58a', '#c3a9d6', '#e6d27e', '#8fc7c0', '#d79fb3', '#b5b5b5', '#f0bf7a'];
  function couleurRep(rep) { let x = 0; for (const ch of rep) x = (x * 31 + ch.charCodeAt(0)) % 9973; return PALETTE[x % PALETTE.length]; }
  function dessinBarres(s) {
    const Wmm = 180, k = Wmm / s.barre, hb = 6;
    const H = s.barres.length * (hb + 3) + 2;
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (Wmm + 2) + 'mm" height="' + H + 'mm" viewBox="-1 -1 ' + (Wmm + 2) + ' ' + H + '" font-family="Arial" font-size="2.3">';
    s.barres.forEach((b, i) => {
      const y = i * (hb + 3);
      svg += '<rect x="0" y="' + y + '" width="' + Wmm + '" height="' + hb + '" fill="#f4f4f4" stroke="#999" stroke-width="0.15"/>';
      let x = 0;
      b.pieces.forEach(p => {
        const w = p.L * k;
        svg += '<rect x="' + x.toFixed(2) + '" y="' + y + '" width="' + w.toFixed(2) + '" height="' + hb + '" fill="' + couleurRep(p.rep) + '" stroke="#333" stroke-width="0.15"/>';
        if (w > 7) svg += '<text x="' + (x + w / 2).toFixed(2) + '" y="' + (y + 2.6) + '" text-anchor="middle">' + p.rep.slice(2) + '</text><text x="' + (x + w / 2).toFixed(2) + '" y="' + (y + 5.1) + '" text-anchor="middle" font-size="1.9">' + p.L + '</text>';
        x += w + 3 * k;
      });
      svg += '<text x="' + (Wmm - 0.5) + '" y="' + (y + 3.8) + '" text-anchor="end" font-size="2" fill="#666">chute ' + Math.round(b.reste) + '</text>';
    });
    return svg + '</svg>';
  }
  function dessinCalepin(p) {
    const Wmm = 120, k = Wmm / 2440, Hp = 1220 * k;
    let h = '<div style="display:flex;flex-wrap:wrap;gap:4mm">';
    p.panneaux.forEach((pan, i) => {
      let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (Wmm + 1) + 'mm" height="' + (Hp + 5) + 'mm" viewBox="-0.5 -4 ' + (Wmm + 1) + ' ' + (Hp + 5) + '" font-family="Arial" font-size="2.4">';
      svg += '<text x="0" y="-1" font-size="2.6">Panneau ' + (i + 1) + ' · utilisation ' + nf(100 * pan.surfUtile / (2440 * 1220)) + ' %</text>';
      svg += '<rect x="0" y="0" width="' + Wmm + '" height="' + Hp + '" fill="#faf6ee" stroke="#555" stroke-width="0.25"/>';
      pan.pieces.forEach(q => {
        svg += '<rect x="' + (q.x * k).toFixed(2) + '" y="' + (q.y * k).toFixed(2) + '" width="' + (q.L * k).toFixed(2) + '" height="' + (q.l * k).toFixed(2) + '" fill="' + couleurRep(q.rep) + '" stroke="#333" stroke-width="0.2"/>';
        svg += '<text x="' + ((q.x + q.L / 2) * k).toFixed(2) + '" y="' + ((q.y + q.l / 2) * k - 0.3).toFixed(2) + '" text-anchor="middle">' + q.rep + '</text><text x="' + ((q.x + q.L / 2) * k).toFixed(2) + '" y="' + ((q.y + q.l / 2) * k + 2.5).toFixed(2) + '" text-anchor="middle" font-size="2">' + q.L + '×' + q.l + '</text>';
      });
      h += svg + '</svg>';
    });
    return h + '</div>';
  }

  /* ====================================================================== */
  /*  DOCUMENT 3 : NOTICE                                                   */
  /* ====================================================================== */
  function notice() {
    let h = couverture('Notice de montage, pose et démontage', 'Fabrication en atelier, montage pas à pas, fixation murale, démontage pour déménagement', imageVue('couvC'), LISTE_DOCS);
    h += '<h2>1. Outillage et sécurité</h2><div class="deux"><div><h4>Atelier (fabrication)</h4><ul>' +
      '<li>Scie à ruban ou tronçonneuse à disque, butée de longueur</li><li>Perceuse à colonne, forets Ø4,5 – 5,5 – 6,5 – 7 – 8 – 9</li><li>Pince à écrous à sertir M5 / M6</li><li>Poste de soudure (électrode 2 mm ou semi-automatique), serre-joints, équerre de soudeur</li><li>Gabarit de cadre : planche ou marbre avec butées</li><li>Lime, ébavureur, brosse métallique</li></ul></div>' +
      '<div><h4>Montage et pose (à la maison)</h4><ul><li>Clé Allen 5 (vis M6) et 4 (vis M5), clé plate de 10 et 8</li><li>Tournevis cruciforme PZ2, visseuse</li><li>Niveau à bulle 60 cm, mètre, crayon</li><li>Perceuse à percussion, foret béton Ø8 (et Ø6 pour la crédence)</li><li>Chevilles adaptées au mur (voir § 4)</li><li>Gants, lunettes pour le perçage</li></ul></div></div>';
    h += '<div class="note">Le montage du dressing et la pose de l\'étagère murale se font à deux. Ne jamais monter sur une tablette. Le poste gaz n\'est mis en service qu\'une fois la station complète, mise à niveau et fixée au mur.</div>';

    h += '<h2>2. Fabrication en atelier</h2><ol>' +
      '<li><b>Débit.</b> Couper les tubes et les plats aux longueurs de la fiche de débit (document 02), en suivant les plans de débit des barres. Ébavurer chaque coupe, repérer chaque pièce.</li>' +
      '<li><b>Perçage des montants avant soudure.</b> Tracer depuis le bas du montant (côté vérin) les cotes du plan « cadres soudés ». Percer Ø9 (M6) ou Ø7 (M5) sur les deux faces latérales, Ø6,5 traversant pour les liaisons entre modules. Pointer avant de percer.</li>' +
      '<li><b>Perçage des traverses porte-tablette :</b> Ø4,5 sur la face supérieure, Ø8 en face inférieure dans le même axe, à 60 mm de chaque extrémité.</li>' +
      '<li><b>Soudage des cadres sur gabarit.</b> Poser les deux montants sur le gabarit, traverses entre eux aux niveaux du plan. Pointer les quatre angles, contrôler les diagonales (écart ≤ 2 mm), puis souder en alternant les côtés pour limiter les déformations. Cordons sur les trois faces accessibles.</li>' +
      '<li><b>Soudage des lisses.</b> Souder une platine à chaque extrémité de tube, d\'équerre (contrôler à l\'équerre de soudeur). Respecter la longueur hors tout : longueur de tube + 2 × 3 mm.</li>' +
      '<li><b>Sous-ensembles particuliers :</b> collier de bouteille roulé Ø 276 intérieur, consoles d\'étagère en L, râtelier à assiettes (picots Ø6 soudés sur plats percés).</li>' +
      '<li><b>Préparation et peinture.</b> Brosser les soudures, dégraisser, antirouille, deux couches de laque. Protéger les perçages Ø9 / Ø7 avec un bouchon ou une vis.</li>' +
      '<li><b>Sertissage.</b> Poser les écrous à sertir après peinture : engager l\'écrou sur la pince, l\'insérer à fond, serrer jusqu\'au blocage. Vérifier chaque écrou en vissant une vis à la main.</li>' +
      '<li><b>Bois.</b> Débiter les panneaux suivant le calepinage, poncer, arrondir les chants, vernir. Encoches 26 × 26 du plan de travail de C à la scie sauteuse.</li>' +
      '<li><b>Contrôle avant livraison :</b> présenter à blanc un module complet de chaque meuble en atelier.</li></ol>';

    Object.values(ME).forEach((m, im) => {
      h += '<h2 class="saut">' + (3) + '.' + (im + 1) + ' Montage de ' + m.code + ' · ' + m.nom + '</h2>';
      h += '<p>' + m.encombrement + '. Masse à vide ≈ ' + nf(MASSES[m.code].total) + ' kg. Les pièces de chaque étape sont en orange sur les vues.</p>';
      m.etapes.forEach((e, i) => {
        const ps = {};
        m.parts.forEach(p => {
          if (p.etape !== i || p.cat === 'equip' || p.cat === 'rideau') return;
          const k = (p.rep ? p.rep + ' ' : '') + p.nom;
          ps[k] = (ps[k] || 0) + (p.debit && p.debit.n ? p.debit.n : 1);
        });
        const img = image(m.code, { etape: i, W: 1100, H: 760, rideauxOuverts: m.code === 'A' && i < 10 });
        h += '<div class="etape"><img src="' + img + '" alt=""><div><h4><span class="num">' + (i + 1) + '</span>' + e.t + '</h4><p>' + e.d + '</p>' +
          (e.ctrl && e.ctrl.length ? '<ul class="ctrl">' + e.ctrl.map(c => '<li>' + c + '</li>').join('') + '</ul>' : '') +
          (Object.keys(ps).length ? '<p class="petit"><b>Pièces :</b> ' + Object.keys(ps).map(k => ps[k] + ' × ' + k).join(' ; ') + '</p>' : '') + '</div></div>';
      });
    });

    h += '<h2 class="saut">4. Pose murale</h2><ol>' +
      '<li>Identifier le mur : frapper, percer un avant-trou Ø6 dans une zone qui sera cachée. Poussière rouge et trou qui « tombe dans le vide » : brique creuse ; poussière grise et perçage dur et continu : béton ; grise puis vide : parpaing creux.</li>' +
      '<li>Repérer les conduites : pas de perçage à la verticale d\'une prise ou d\'un interrupteur ni à l\'horizontale d\'un robinet.</li>' +
      '<li>Mettre le meuble en place et de niveau (vérins), marquer le centre des trous oblongs des équerres.</li>' +
      '<li>Écarter le meuble, percer (sans percussion dans la brique creuse et le parpaing), dépoussiérer, cheviller.</li>' +
      '<li>Remettre le meuble, visser les vis Ø5 × 50 avec rondelle. Tirer franchement le haut du meuble vers soi : aucun jeu ne doit apparaître.</li>' +
      '<li>Étagère B : tracer le dessous du meuble à 1250 mm du sol, poser les 4 chevilles hautes d\'abord, contrôler le niveau, puis les 4 basses.</li></ol>' + CHEVILLES;

    h += '<h2>5. Démontage et transport</h2><p>Le démontage suit les étapes de montage à l\'envers : vider, décrocher rideaux et tringles, dévisser les panneaux, retirer les équerres murales, séparer les modules, puis déboulonner les lisses. Les vis restent dans leurs écrous à sertir pendant le transport (revisser chaque vis dans son trou après démontage de la lisse) : rien ne se perd.</p>';
    h += '<h3>Colisage</h3>' + colisage();
    h += '<div class="note bleu">Pour transporter la bouteille de gaz : robinet fermé, brûleur démonté, bouteille debout et calée, jamais dans un coffre fermé en plein soleil.</div>';

    h += '<h2>6. Entretien et contrôles</h2>' + tableau(['Fréquence', 'Contrôle'], [
      ['À chaque changement de bouteille', 'Test à l\'eau savonneuse du raccord du brûleur, état du joint, collier refermé'],
      ['Chaque mois', 'Nettoyage du bac inox et de la crédence ; vérifier qu\'aucun objet n\'a été posé au-dessus du brûleur'],
      ['Tous les 6 mois', 'Resserrer les vis des lisses (8 N·m) et les boulons de liaison ; contrôler les chevilles murales ; recoucher un vernis sur le plan si besoin'],
      ['Après un déménagement', 'Contrôle des diagonales de chaque module, remplacement des chevilles (ne jamais réutiliser une cheville arrachée)'],
      ['Date limite du détendeur ou du joint', 'Remplacer selon la date inscrite par le fabricant']
    ]);
    return h;
  }

  /* ====================================================================== */
  /*  DOCUMENT 4 : DEVIS D'ACHAT                                            */
  /* ====================================================================== */
  function devis() {
    const A = C.listeAchats(M);
    const q = (x) => nf(x, Number.isInteger(x) ? 0 : 1);
    const ligne = (titre, sec) => sec.lignes;
    const tube = A.sections[0].lignes, pan = A.sections[2].lignes, tol = A.sections[3].lignes, qu = A.sections[4].lignes;
    let h = '<section><div class="couverture" style="height:auto;break-after:auto"><div class="bandeau"><div class="sur">Colocation étudiante · mobilier sur mesure</div>' +
      '<h1>Devis d\'achat</h1><div class="sous">Dressing à rideaux (A) · Étagère murale de cuisine (B) · Station de cuisson (C) — ' + M.version + ' du ' + M.date + '</div></div></div>';
    h += '<div class="note bleu"><b>En bref :</b> ' +
      tube.map(l => '<b>' + l.qConseil + ' barres</b> de ' + l.designation.replace(/, acier.*/, '').toLowerCase()).join(' et ') + ' ; ' +
      pan.map(l => '<b>' + l.qConseil + '</b> panneau' + (l.qConseil > 1 ? 'x' : '') + ' de ' + l.designation.replace(', panneau 2440 × 1220', '').replace('Contreplaqué', 'contreplaqué')).join(', ') + ' (format 2440 × 1220) ; ' +
      '<b>' + tol.length + ' tôles</b> à faire découper et plier ; <b>' + nf(qu.reduce((a, l) => a + l.qConseil, 0)) + ' pièces</b> de quincaillerie. ' +
      'Masse totale des trois meubles : environ ' + nf(MASSES.A.total + MASSES.B.total + MASSES.C.total) + ' kg.</div>';
    h += '<p class="petit">« Qté mini » : quantité strictement nécessaire d\'après les plans. « À acheter » : avec une marge (une barre de réserve, environ 10 % de quincaillerie en plus). Prix à compléter avec les tarifs locaux ; la version Excel (04_devis_achats.xlsx) calcule les montants et les totaux.</p>';
    A.sections.forEach((sec, i) => {
      h += '<h3>' + (i + 1) + '. ' + sec.titre + '</h3>';
      h += tableau(['Réf.', 'Désignation', 'Précisions', 'Unité', 'Qté mini', 'À acheter', 'Prix unit.', 'Montant'],
        sec.lignes.map(l => ['<span class="cle">' + l.ref + '</span>', l.designation + (l.note ? '<br><span class="petit">' + esc(l.note) + '</span>' : ''), l.spec, l.unite, q(l.qMin), '<b>' + q(l.qConseil) + '</b>', '', '']),
        ['', '', '', '', 'n', 'n', 'vide', 'vide']);
      h += '<table style="width:60mm;margin-left:auto"><tr><td>Sous-total ' + (i + 1) + '</td><td class="vide" style="width:30mm"></td></tr></table>';
    });
    h += '<table style="width:80mm;margin-left:auto;font-size:9pt"><tr><th>Total hors taxes</th><td class="vide" style="width:35mm"></td></tr><tr><td>TVA (…… %)</td><td class="vide"></td></tr><tr><th>Total TTC</th><td class="vide"></td></tr></table>';
    // annexes : coupes
    h += '<h2 class="saut">Annexe 1 — Coupes des tubes</h2><p class="petit">À remettre à l\'atelier ou au fournisseur qui coupe à la longueur. Le plan de débit répartit les pièces dans les barres (trait de scie 3 mm).</p>';
    A.debitTubes.filter(s => s.sec === 'T25' || s.sec === 'T20').forEach(s => {
      const compte = {};
      s.barres.forEach(b => b.pieces.forEach(p => { compte[p.L] = compte[p.L] || { n: 0, reps: new Set() }; compte[p.L].n++; compte[p.L].reps.add(p.rep); }));
      h += '<h4>' + s.nom + ' — plan de débit sur ' + s.barres.length + ' barres de 6 m</h4>';
      h += tableau(['Longueur (mm)', 'Quantité', 'Repères'], Object.keys(compte).map(Number).sort((a, b) => b - a).map(L => [nf(L), '<b>' + compte[L].n + '</b>', Array.from(compte[L].reps).sort().join(', ')]), ['n', 'n', '']);
      h += '<div class="barres">' + dessinBarres(s) + '</div>';
    });
    h += '<h2 class="saut">Annexe 2 — Coupes des panneaux</h2><p class="petit">Pour un débit sur mesure chez le fournisseur, ou pour découper soi-même dans les panneaux entiers suivant le calepinage.</p>';
    const pieces = [];
    Object.values(ME).forEach(m => C.nomenclature(m, M.SECTIONS).liste.filter(g => g.cat === 'panneau').forEach(g => pieces.push(g)));
    pieces.sort((a, b) => (b.debit.ep - a.debit.ep) || (b.debit.L * b.debit.l - a.debit.L * a.debit.l));
    h += tableau(['Matériau', 'Repère', 'Pièce', 'Longueur × largeur (mm)', 'Qté', 'Usinage, finition'], pieces.map(g => [g.mat, '<span class="cle">' + g.rep + '</span>', g.noms.join(' / '), nf(g.debit.L) + ' × ' + nf(g.debit.l), '<b>' + g.qte + '</b>', g.debit.usin]), ['', '', '', 'n', 'n', '']);
    A.panneaux.forEach(p => { h += '<h4>' + p.mat + '</h4><div class="calepin">' + dessinCalepin(p) + '</div>'; });
    h += '</section>';
    return h;
  }

  function colisage() {
    const lignes = [];
    Object.values(ME).forEach(m => {
      const n = C.nomenclature(m, M.SECTIONS);
      const masseSE = {};
      n.sousEnsembles.forEach(se => {
        let kg = 0;
        Object.keys(se.composition).forEach(r => { const g = n.liste.find(x => x.rep === r); kg += g.masseU * se.composition[r]; });
        masseSE[se.nom] = { kg, n: se.n };
      });
      m.typesCadre.forEach(ft => {
        lignes.push([m.code, ft.nom, nf(ft.inst), nf(Math.max(ft.Hf, ft.Hb)) + ' × ' + nf(ft.D) + ' × ' + M.SECTIONS[ft.sec].a, nf(masseSE[ft.nom].kg, 1) + ' kg l\'un']);
      });
      const lisses = n.sousEnsembles.filter(se => se.nom.indexOf('Lisse') === 0 || se.nom === 'Traverse sous plan');
      if (lisses.length) {
        const nb = lisses.reduce((s, x) => s + x.n, 0), kg = lisses.reduce((s, x) => s + masseSE[x.nom].kg * x.n, 0);
        const Lmax = Math.max.apply(null, lisses.map(x => parseInt(x.nom.replace(/\D+/g, ' ').trim().split(' ')[0], 10) || 494));
        lignes.push([m.code, 'Botte de lisses et traverses (scotchées ensemble)', nf(nb), '≈ ' + nf(Lmax + 6) + ' × 60 × 60', nf(kg, 1) + ' kg']);
      }
      const pans = n.liste.filter(g => g.cat === 'panneau' || g.cat === 'tole');
      const kgp = pans.reduce((s, g) => s + g.masseU * g.qte, 0), nbp = pans.reduce((s, g) => s + g.qte, 0);
      const Lp = Math.max.apply(null, pans.map(g => Math.max(g.debit.L, g.debit.l)));
      lignes.push([m.code, 'Pile de panneaux et tôles (cartons entre panneaux)', nf(nbp), 'jusqu\'à ' + nf(Lp) + ' de long', nf(kgp, 1) + ' kg']);
      lignes.push([m.code, 'Carton de petites pièces (équerres, pattes, vérins, tringles courtes, sachet de vis étiqueté)', '1', '400 × 300 × 150', '≈ 3 kg']);
    });
    return tableau(['Meuble', 'Colis', 'Nombre', 'Dimensions (mm)', 'Masse'], lignes, ['', '', 'n', '', 'n']);
  }

  /* ---------- Assemblage ---------- */
  async function lancer() {
    if (TYPE !== 'devis' && window.RENDU3D && window.RENDU3D.disponible()) {
      try {
        capture = window.RENDU3D.capture(M);
        ['A', 'B', 'C', 'K'].forEach(c => capture.v.charger(c));
        capture.code = 'K';
        await window.RENDU3D.pret();
        const passes = +(new URLSearchParams(location.search).get('passes') || 0);
        if (passes > 0) {
          for (const cle of PHOTOS_PAR_DOC[TYPE] || []) {
            const v = VUES_PHOTO[cle];
            PHOTOS[cle] = await capture.imagePhoto(v[0], v[1], passes);
          }
        }
      } catch (e) { capture = null; }
    }
    let html = '';
    if (TYPE === 'dossier') html = dossier();
    else if (TYPE === 'debit') html = debit();
    else if (TYPE === 'devis') html = devis();
    else html = notice();
    document.getElementById('contenu').innerHTML = html;
    const imgs = Array.from(document.images);
    Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; }))).then(() => { window.DOCUMENT_PRET = true; });
  }
  setTimeout(lancer, 10);
})();
