/*
 * Calculs partagés : propriétés de section, nomenclature, débit en barres, calepinage des panneaux.
 */
(function (root) {
  'use strict';
  const RHO_ACIER = 7.85e-6;     // kg/mm³
  const RHO_CP = 0.55e-6;        // kg/mm³ (contreplaqué okoumé / peuplier)
  const E_ACIER = 210000;        // MPa
  const E_CP = 6500;             // MPa, sens fil des plis extérieurs (valeur prudente)

  function propSection(S) {
    let A = 0, I = 0, v = 0;
    if (S.type === 'carre') {
      const a = S.a, b = S.a - 2 * S.t;
      // rayon d'angle extérieur ≈ 1,5 t : on retire environ 4 % (valeur prudente)
      A = (a * a - b * b) * 0.96; I = (Math.pow(a, 4) - Math.pow(b, 4)) / 12 * 0.95; v = a / 2;
    } else if (S.type === 'rond') {
      const d = S.d, di = S.d - 2 * S.t;
      A = Math.PI / 4 * (d * d - di * di); I = Math.PI / 64 * (Math.pow(d, 4) - Math.pow(di, 4)); v = d / 2;
    } else if (S.type === 'plein') {
      A = Math.PI / 4 * S.d * S.d; I = Math.PI / 64 * Math.pow(S.d, 4); v = S.d / 2;
    } else if (S.type === 'plat') {
      A = S.b * S.e; I = S.b * Math.pow(S.e, 3) / 12; v = S.e / 2;
    } else if (S.type === 'corniere') {
      A = (2 * S.b - S.e) * S.e; I = 0; v = 0;
    }
    return { A, I, W: v ? I / v : 0, i: A ? Math.sqrt(I / A) : 0, kgm: A * RHO_ACIER * 1000 };
  }

  const CAT_PREFIXE = { tube: 'T', rond: 'R', plat: 'F', panneau: 'P', tole: 'S' };

  /* Nomenclature d'un meuble : regroupe les pièces identiques et attribue les repères */
  function nomenclature(meuble, SECTIONS) {
    if (meuble._nomenclature) return meuble._nomenclature;
    const groupes = {};
    meuble.parts.forEach((p, idx) => {
      if (!p.debit) return;
      const d = p.debit;
      let cle;
      if (p.cat === 'panneau' || p.cat === 'tole') cle = [p.cat, p.mat, d.ep, Math.max(d.L, d.l), Math.min(d.L, d.l), d.usin].join('|');
      else cle = [p.cat, d.sec, d.L, d.coupe, d.usin].join('|');
      if (!groupes[cle]) groupes[cle] = { cat: p.cat, debit: d, mat: p.mat, noms: [], sousEns: [], qte: 0, parts: [] };
      const g = groupes[cle];
      g.qte += (d.n || 1);
      g.parts.push(idx);
      if (g.noms.indexOf(p.nom) < 0) g.noms.push(p.nom);
      if (p.sousEns && g.sousEns.indexOf(p.sousEns) < 0) g.sousEns.push(p.sousEns);
    });
    const liste = Object.values(groupes);
    const ordreCat = ['tube', 'rond', 'plat', 'panneau', 'tole'];
    liste.sort((u, v) => {
      const c = ordreCat.indexOf(u.cat) - ordreCat.indexOf(v.cat);
      if (c) return c;
      if (u.cat === 'panneau' || u.cat === 'tole') return (v.debit.ep - u.debit.ep) || (v.debit.L * v.debit.l - u.debit.L * u.debit.l);
      return (u.debit.sec < v.debit.sec ? -1 : u.debit.sec > v.debit.sec ? 1 : 0) || (v.debit.L - u.debit.L);
    });
    const compteurs = {};
    liste.forEach(g => {
      const pre = CAT_PREFIXE[g.cat];
      compteurs[pre] = (compteurs[pre] || 0) + 1;
      g.rep = meuble.code + '-' + pre + String(compteurs[pre]).padStart(2, '0');
      g.parts.forEach(i => { meuble.parts[i].rep = g.rep; });
      // masse unitaire
      if (g.cat === 'panneau') g.masseU = g.debit.ep * g.debit.L * g.debit.l * RHO_CP;
      else if (g.cat === 'tole') g.masseU = g.debit.ep * g.debit.L * g.debit.l * (/alu/i.test(g.mat) ? 2.7e-6 : RHO_ACIER);
      else {
        const S = SECTIONS[g.debit.sec];
        g.masseU = propSection(S).kgm * g.debit.L / 1000;
      }
    });
    // sous-ensembles soudés
    const se = {};
    meuble.parts.forEach(p => {
      if (!p.sousEns || !p.debit) return;
      se[p.sousEns] = se[p.sousEns] || {};
      se[p.sousEns][p.rep] = (se[p.sousEns][p.rep] || 0) + (p.debit.n || 1);
    });
    const typesCadre = {};
    meuble.typesCadre.forEach(ft => { typesCadre[ft.nom] = ft.inst; });
    // nombre d'exemplaires de chaque sous-ensemble
    const sousEnsembles = Object.keys(se).map(nom => {
      let n = typesCadre[nom];
      const comp = se[nom];
      if (!n) {
        // lisses : quantité = nombre de tubes de la lisse
        const repTube = Object.keys(comp).find(r => /-T|-R/.test(r) && !/Platine/.test(r));
        n = nom.indexOf('Lisse') === 0 ? comp[repTube] : 1;
        if (nom === 'Collier de bouteille' || nom === 'Râtelier à assiettes') n = 1;
        if (nom === 'Traverse sous plan') n = comp[repTube];
        if (nom === 'Console d\'étagère') n = 2;
      }
      const parEx = {};
      Object.keys(comp).forEach(r => { parEx[r] = comp[r] / n; });
      return { nom, n, composition: parEx };
    });
    const quinc = Object.values(meuble.quinc).sort((u, v) => u.designation < v.designation ? -1 : 1);
    quinc.forEach((q, k) => { q.rep = meuble.code + '-Q' + String(k + 1).padStart(2, '0'); });
    meuble._nomenclature = { liste, sousEnsembles, quinc };
    return meuble._nomenclature;
  }

  /* Débit en barres : premier ajustement décroissant, trait de scie compris */
  function debitBarres(longueurs, Lbarre, trait) {
    const tri = longueurs.slice().sort((u, v) => v.L - u.L);
    const barres = [];
    tri.forEach(piece => {
      let b = barres.find(br => br.reste >= piece.L + trait);
      if (!b) { b = { pieces: [], reste: Lbarre }; barres.push(b); }
      b.pieces.push(piece);
      b.reste -= piece.L + trait;
    });
    return barres;
  }

  /* Calepinage par bandes (guillotine) sur panneaux standard */
  function calepinage(pieces, Lp, lp, trait) {
    const tri = pieces.map(p => {
      const L = Math.max(p.L, p.l), l = Math.min(p.L, p.l);
      return Object.assign({}, p, { L, l });
    }).sort((u, v) => (v.l - u.l) || (v.L - u.L));
    const panneaux = [];
    tri.forEach(pc => {
      if (pc.L > Lp || pc.l > lp) { pc.horsFormat = true; }
      let place = false;
      for (const pan of panneaux) {
        for (const bd of pan.bandes) {
          if (bd.h >= pc.l && bd.x + pc.L <= Lp) {
            pan.pieces.push({ x: bd.x, y: bd.y, L: pc.L, l: pc.l, rep: pc.rep });
            bd.x += pc.L + trait; place = true; break;
          }
        }
        if (place) break;
        if (pan.yLibre + pc.l <= lp) {
          const bd = { y: pan.yLibre, h: pc.l, x: 0 };
          pan.bandes.push(bd); pan.yLibre += pc.l + trait;
          pan.pieces.push({ x: 0, y: bd.y, L: pc.L, l: pc.l, rep: pc.rep });
          bd.x = pc.L + trait; place = true; break;
        }
      }
      if (!place) {
        const pan = { bandes: [], pieces: [], yLibre: 0 };
        panneaux.push(pan);
        const bd = { y: 0, h: pc.l, x: pc.L + trait };
        pan.bandes.push(bd); pan.yLibre = pc.l + trait;
        pan.pieces.push({ x: 0, y: 0, L: pc.L, l: pc.l, rep: pc.rep, horsFormat: pc.horsFormat });
      }
    });
    panneaux.forEach(p => { p.surfUtile = p.pieces.reduce((s, q) => s + q.L * q.l, 0); });
    return panneaux;
  }

  /* Synthèse achats tous meubles */
  function syntheseAchats(MODELE) {
    const S = MODELE.SECTIONS;
    const parSection = {}, parPanneau = {}, quinc = {};
    Object.values(MODELE.MEUBLES).forEach(m => {
      const nom = nomenclature(m, S);
      nom.liste.forEach(g => {
        if (g.cat === 'panneau') {
          const k = g.mat;
          parPanneau[k] = parPanneau[k] || { mat: k, ep: g.debit.ep, pieces: [] };
          for (let i = 0; i < g.qte; i++) parPanneau[k].pieces.push({ L: g.debit.L, l: g.debit.l, rep: g.rep });
        } else if (g.cat !== 'tole') {
          const k = g.debit.sec;
          parSection[k] = parSection[k] || { sec: k, pieces: [] };
          for (let i = 0; i < g.qte; i++) parSection[k].pieces.push({ L: g.debit.L, rep: g.rep });
        }
      });
      nom.quinc.forEach(q => {
        quinc[q.designation] = quinc[q.designation] || { designation: q.designation, qte: 0, meubles: [] };
        quinc[q.designation].qte += q.qte;
        if (quinc[q.designation].meubles.indexOf(m.code) < 0) quinc[q.designation].meubles.push(m.code);
      });
    });
    const sections = Object.values(parSection).map(o => {
      const Sx = S[o.sec];
      const barres = debitBarres(o.pieces, Sx.barre, 3);
      const Ltot = o.pieces.reduce((s, p) => s + p.L, 0);
      return { sec: o.sec, nom: Sx.nom, barre: Sx.barre, Ltot, barres, kg: propSection(Sx).kgm * Ltot / 1000 };
    }).sort((u, v) => v.Ltot - u.Ltot);
    const panneaux = Object.values(parPanneau).map(o => {
      const pl = calepinage(o.pieces, 2440, 1220, 4);
      const surf = o.pieces.reduce((s, p) => s + p.L * p.l, 0);
      return { mat: o.mat, ep: o.ep, panneaux: pl, surf };
    }).sort((u, v) => v.ep - u.ep);
    return { sections, panneaux, quinc: Object.values(quinc) };
  }

  /* Vérifications de flèche et de contrainte (poutre sur 2 appuis, charge répartie) */
  function flecheRepartie(qNmm, L, E, I) { return 5 * qNmm * Math.pow(L, 4) / (384 * E * I); }
  function flecheCentree(P, L, E, I) { return P * Math.pow(L, 3) / (48 * E * I); }

  /* Liste d'achat consolidée (base du devis) : quantités minimales et conseillées avec marge */
  function listeAchats(MODELE) {
    const S = MODELE.SECTIONS;
    const meubles = Object.values(MODELE.MEUBLES);
    const arr = (x, pas) => Math.round(Math.ceil(x / pas - 1e-9) * pas * 10) / 10;
    const sections = [];
    const L = (ref, designation, spec, unite, qMin, qConseil, note) => ({ ref, designation, spec, unite, qMin, qConseil, note: note || '' });

    // --- profilés : regroupement par section (le râtelier est en inox) ---
    const prof = {};
    meubles.forEach(m => {
      const n = nomenclature(m, S);
      n.liste.forEach(g => {
        if (g.cat === 'panneau' || g.cat === 'tole') return;
        const inox = g.sousEns.indexOf('Râtelier à assiettes') >= 0;
        const cle = g.debit.sec + (inox ? '_inox' : '');
        prof[cle] = prof[cle] || { sec: g.debit.sec, inox, pieces: [], meubles: [] };
        for (let i = 0; i < g.qte; i++) prof[cle].pieces.push({ L: g.debit.L, rep: g.rep });
        if (prof[cle].meubles.indexOf(m.code) < 0) prof[cle].meubles.push(m.code);
      });
    });
    const grosTubes = [], petits = [];
    Object.values(prof).forEach(o => {
      const Sx = S[o.sec];
      const Ltot = o.pieces.reduce((a, p) => a + p.L, 0);
      const kg = propSection(Sx).kgm * Ltot / 1000;
      const nom = Sx.type === 'rond' ? Sx.nom : Sx.nom.replace(/ \(.*\)/, '') + (o.inox ? ' inox' : '');
      if (Sx.type === 'carre') {
        const barres = debitBarres(o.pieces, Sx.barre, 3).length;
        const conseil = Math.max(barres, Math.ceil(Ltot * 1.1 / Sx.barre));
        grosTubes.push(L(o.sec, nom + ', acier S235, barre de ' + Sx.barre / 1000 + ' m', 'meubles ' + o.meubles.join(', '), 'barre', barres, conseil,
          (Ltot / 1000).toFixed(1).replace('.', ',') + ' m de pièces, ' + kg.toFixed(0) + ' kg' + (conseil > barres ? ' ; 1 barre de réserve pour les erreurs de coupe' : '')));
      } else {
        const m = Ltot / 1000;
        petits.push(L(o.sec + (o.inox ? '-INOX' : ''), nom, (o.inox ? 'râtelier à assiettes (B)' : 'meubles ' + o.meubles.join(', ')) + ', ' + o.pieces.length + ' pièces', 'm',
          arr(m, 0.1), arr(m * 1.15 + 0.1, 0.5), 'souvent vendu en barre de ' + (Sx.barre / 1000) + ' m ; les chutes d\'atelier suffisent'));
      }
    });
    grosTubes.sort((a, b) => b.qMin - a.qMin);
    sections.push({ titre: 'Tubes acier (barres)', lignes: grosTubes });
    sections.push({ titre: 'Petits profilés : plats, cornière, ronds', lignes: petits.sort((a, b) => b.qMin - a.qMin) });

    // --- panneaux ---
    const syn = syntheseAchats(MODELE);
    sections.push({ titre: 'Panneaux bois (format 2440 × 1220)', lignes: syn.panneaux.map(p => {
      const spec = p.ep === 18 ? 'okoumé ou bouleau, collage extérieur (CTB-X / WBP)' : p.ep === 15 ? 'okoumé ou peuplier (bouleau pour la cuisine)' : 'peuplier, ou isorel 3 mm';
      return L('CP' + p.ep, 'Contreplaqué ' + p.ep + ' mm, panneau 2440 × 1220', spec, 'panneau', p.panneaux.length, p.panneaux.length,
        (p.surf / 1e6).toFixed(2).replace('.', ',') + ' m² utiles, ' + p.panneaux.reduce((a, x) => a + x.pieces.length, 0) + ' pièces ; ou débit sur mesure (liste des coupes)');
    }) });

    // --- tôles ---
    const toles = [];
    meubles.forEach(m => nomenclature(m, S).liste.filter(g => g.cat === 'tole').forEach(g => {
      toles.push(L(g.rep, g.noms.join(' / '), g.mat + ', développé ' + g.debit.L + ' × ' + g.debit.l + ' mm', 'pièce', g.qte, g.qte, g.debit.usin));
    }));
    sections.push({ titre: 'Tôles découpées et pliées (sous-traitance)', lignes: toles });

    // --- quincaillerie ---
    const q = syn.quinc.slice().sort((a, b) => a.designation < b.designation ? -1 : 1);
    sections.push({ titre: 'Quincaillerie', lignes: q.map((x, i) => L('Q' + String(i + 1).padStart(2, '0'), x.designation, 'meubles ' + x.meubles.join(', '), 'pièce', x.qte, Math.ceil(x.qte * 1.1), '')) });

    // --- fournitures ---
    const acierM2 = syn.sections.reduce((a, s) => a + s.Ltot * (S[s.sec].a ? 4 * S[s.sec].a : 80) / 1e6, 0);
    sections.push({ titre: 'Finitions, électricité, sécurité', lignes: [
      L('F01', 'Tissu de rideau coton / polyester serré, laize 150 cm', '2 panneaux 1460 × 2060 coupés', 'm', 4.3, 4.5, 'ourlets compris'),
      L('F02', 'Antirouille (primaire)', 'surface acier ≈ ' + acierM2.toFixed(1).replace('.', ',') + ' m²', 'L', 1, 1, ''),
      L('F03', 'Laque glycéro ou époxy, anthracite satiné', '2 couches', 'L', 1, 1.5, ''),
      L('F04', 'Peinture haute température 600 °C, aérosol', 'haut du module gaz', 'aérosol', 1, 1, ''),
      L('F05', 'Vernis polyuréthane (compatible contact alimentaire pour B)', '2 à 3 couches', 'L', 1, 1, ''),
      L('F06', 'Diluant, papier abrasif grains 80 / 120 / 240, chiffons', '', 'lot', 1, 1, ''),
      L('F07', 'Garniture caoutchouc 3 mm, bande 30 mm', 'intérieur du collier de bouteille', 'm', 1, 1, ''),
      L('F08', 'Bloc 2 prises 16 A avec interrupteur, à visser', 'station C', 'pièce', 1, 1, ''),
      L('F09', 'Câble 3 × 2,5 mm² + fiche 16 A', 'alimentation du bloc de prises', 'm', 3, 3, 'selon distance à la prise murale'),
      L('F10', 'Barre aimantée à couteaux 300 mm', 'station C', 'pièce', 1, 1, ''),
      L('F11', 'Couverture anti-feu 1 × 1 m', 'au mur, près du gaz', 'pièce', 1, 1, ''),
      L('F12', 'Détecteur de monoxyde de carbone', 'conseillé', 'pièce', 1, 1, '')
    ] });

    // --- main d'œuvre (indicative) ---
    let cadres = 0, lisses = 0, sertir = 0, panneaux = 0;
    meubles.forEach(m => {
      const n = nomenclature(m, S);
      m.typesCadre.forEach(ft => { cadres += ft.inst; });
      n.sousEnsembles.forEach(se => { if (se.nom.indexOf('Lisse') === 0 || se.nom === 'Traverse sous plan') lisses += se.n; });
      n.quinc.forEach(x => { if (/sertir/.test(x.designation)) sertir += x.qte; });
      n.liste.forEach(g => { if (g.cat === 'panneau') panneaux += g.qte; });
    });
    const h = (x) => Math.round(x * 2) / 2;
    sections.push({ titre: 'Main d\'œuvre atelier (estimation)', lignes: [
      L('M01', 'Débit, ébavurage et perçage des tubes', cadres + ' cadres, ' + lisses + ' lisses', 'heure', h(cadres * 0.5 + lisses * 0.15), h(cadres * 0.5 + lisses * 0.15), ''),
      L('M02', 'Soudage des cadres sur gabarit et des lisses (platines)', cadres + ' cadres, ' + lisses + ' lisses', 'heure', h(cadres * 0.8 + lisses * 0.2), h(cadres * 0.8 + lisses * 0.2), 'électrodes ou fil compris'),
      L('M03', 'Pose des écrous à sertir', sertir + ' écrous', 'heure', h(sertir * 1.5 / 60), h(sertir * 1.5 / 60), ''),
      L('M04', 'Petits sous-ensembles (collier, consoles, râtelier, pattes)', '', 'heure', 3, 3, ''),
      L('M05', 'Préparation et peinture de l\'acier', '', 'heure', h(cadres * 0.4 + 4), h(cadres * 0.4 + 4), ''),
      L('M06', 'Débit, ponçage et vernis des panneaux', panneaux + ' pièces', 'heure', h(panneaux * 0.25), h(panneaux * 0.25), 'à faire soi-même si besoin')
    ] });
    return { sections, debitTubes: syn.sections, panneaux: syn.panneaux };
  }

  const CALC = { propSection, nomenclature, debitBarres, calepinage, syntheseAchats, listeAchats, flecheRepartie, flecheCentree, E_ACIER, E_CP, RHO_CP, RHO_ACIER };
  if (typeof module !== 'undefined' && module.exports) module.exports = CALC;
  root.CALC = CALC;
})(typeof window !== 'undefined' ? window : globalThis);
