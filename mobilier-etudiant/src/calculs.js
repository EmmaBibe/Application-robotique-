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

  const CALC = { propSection, nomenclature, debitBarres, calepinage, syntheseAchats, flecheRepartie, flecheCentree, E_ACIER, E_CP, RHO_CP, RHO_ACIER };
  if (typeof module !== 'undefined' && module.exports) module.exports = CALC;
  root.CALC = CALC;
})(typeof window !== 'undefined' ? window : globalThis);
