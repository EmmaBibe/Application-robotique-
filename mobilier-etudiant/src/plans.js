/*
 * Plans 2D en SVG : vues orthogonales cotées, cadres soudés, détails d'assemblage.
 * Les vues sont calculées à partir du modèle (projection des boîtes et cylindres).
 */
(function (root) {
  'use strict';

  const STYLE = {
    tube: { f: '#9aa2ab', s: '#1d2126' }, rond: { f: '#c9cfd4', s: '#1d2126' }, plat: { f: '#b8bec5', s: '#1d2126' },
    quinc: { f: '#7d858e', s: '#1d2126' }, panneau: { f: '#efdcbc', s: '#5c4526' }, tole: { f: '#dfe4e8', s: '#3d4650' },
    equip: { f: 'none', s: '#8a9097', d: '6 4' }, rideau: { f: 'none', s: '#6f8f80', d: '2 3' }
  };
  const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

  function bornesFormes(formes) {
    const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    formes.forEach(f => {
      let x0, y0, z0, x1, y1, z1;
      if (f.t === 'box') { x0 = f.x; y0 = f.y; z0 = f.z; x1 = f.x + f.dx; y1 = f.y + f.dy; z1 = f.z + f.dz; }
      else {
        const r = f.t === 'cyl' ? f.r : f.r2;
        if (f.ax === 'z') { x0 = f.x - r; x1 = f.x + r; y0 = f.y - r; y1 = f.y + r; z0 = f.z; z1 = f.z + f.h; }
        else if (f.ax === 'x') { x0 = f.x; x1 = f.x + f.h; y0 = f.y - r; y1 = f.y + r; z0 = f.z - r; z1 = f.z + r; }
        else { x0 = f.x - r; x1 = f.x + r; y0 = f.y; y1 = f.y + f.h; z0 = f.z - r; z1 = f.z + r; }
      }
      b[0] = Math.min(b[0], x0); b[1] = Math.min(b[1], y0); b[2] = Math.min(b[2], z0);
      b[3] = Math.max(b[3], x1); b[4] = Math.max(b[4], y1); b[5] = Math.max(b[5], z1);
    });
    return b;
  }

  /* Projection d'une forme dans une vue. Renvoie {prim, prof} ; prof croissante = plus proche */
  function projeter(f, vue) {
    const b = bornesFormes([f]);
    // axes (u horizontal, v vertical vers le haut) et profondeur
    let u0, u1, v0, v1, prof;
    if (vue === 'face') { u0 = b[0]; u1 = b[3]; v0 = b[2]; v1 = b[5]; prof = -b[1]; }
    else if (vue === 'droite') { u0 = b[1]; u1 = b[4]; v0 = b[2]; v1 = b[5]; prof = b[3]; }
    else { u0 = b[0]; u1 = b[3]; v0 = b[1]; v1 = b[4]; prof = b[5]; }
    const axeVue = vue === 'face' ? 'y' : vue === 'droite' ? 'x' : 'z';
    if ((f.t === 'cyl' || f.t === 'anneau') && f.ax === axeVue) {
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
      return { prim: { t: 'cercle', cu, cv, r: f.t === 'cyl' ? f.r : f.r2, ri: f.t === 'anneau' ? f.r1 : 0 }, prof };
    }
    return { prim: { t: 'rect', u0, v0, u1, v1 }, prof };
  }

  /* Vue orthogonale d'un meuble */
  function vue(meuble, nomVue, opt) {
    opt = opt || {};
    const prims = [];
    meuble.parts.forEach(p => {
      if (opt.filtre && !opt.filtre(p)) return;
      if (p.cat === 'rideau' && !opt.rideaux) return;
      if (p.variante === 'ouvert') return;
      if (p.cat === 'equip' && !opt.equip) return;
      p.formes.forEach(f => {
        const pr = projeter(f, nomVue);
        pr.st = STYLE[p.cat] || STYLE.tube;
        pr.p = p;
        prims.push(pr);
      });
    });
    prims.sort((u, v) => u.prof - v.prof);
    // emprise
    let U0 = Infinity, U1 = -Infinity, V0 = Infinity, V1 = -Infinity;
    prims.forEach(({ prim }) => {
      if (prim.t === 'rect') { U0 = Math.min(U0, prim.u0); U1 = Math.max(U1, prim.u1); V0 = Math.min(V0, prim.v0); V1 = Math.max(V1, prim.v1); }
      else { U0 = Math.min(U0, prim.cu - prim.r); U1 = Math.max(U1, prim.cu + prim.r); V0 = Math.min(V0, prim.cv - prim.r); V1 = Math.max(V1, prim.cv + prim.r); }
    });
    if (opt.emprise) { U0 = opt.emprise[0]; U1 = opt.emprise[1]; V0 = opt.emprise[2]; V1 = opt.emprise[3]; }
    const ech = opt.ech;                 // mm papier par mm réel
    const tx = 2.3 / ech;                // hauteur de texte
    const lw = 0.18 / ech;
    const mG = (opt.margeG || 26) / ech, mD = (opt.margeD || 14) / ech, mH = (opt.margeH || 10) / ech, mB = (opt.margeB || 22) / ech;
    const X0 = U0 - mG, Y0 = -(V1 + mH), Wd = (U1 - U0) + mG + mD, Hd = (V1 - V0) + mH + mB;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [X0, Y0, Wd, Hd].map(fmt).join(' ').replace(/,/g, '.') + '" width="' + (Wd * ech).toFixed(1) + 'mm" height="' + (Hd * ech).toFixed(1) + 'mm" font-family="Arial, Helvetica, sans-serif">';
    s += '<g stroke-linejoin="round">';
    prims.forEach(({ prim, st }) => {
      const att = ' fill="' + st.f + '" stroke="' + st.s + '" stroke-width="' + (lw * (st.d ? 0.8 : 1)).toFixed(3) + '"' + (st.d ? ' stroke-dasharray="' + st.d.split(' ').map(k => (k * lw * 3).toFixed(2)).join(' ') + '"' : '');
      if (prim.t === 'rect') s += '<rect x="' + prim.u0.toFixed(1) + '" y="' + (-prim.v1).toFixed(1) + '" width="' + Math.max(0.3, prim.u1 - prim.u0).toFixed(1) + '" height="' + Math.max(0.3, prim.v1 - prim.v0).toFixed(1) + '"' + att + '/>';
      else {
        s += '<circle cx="' + prim.cu.toFixed(1) + '" cy="' + (-prim.cv).toFixed(1) + '" r="' + prim.r.toFixed(1) + '"' + att + '/>';
        if (prim.ri) s += '<circle cx="' + prim.cu.toFixed(1) + '" cy="' + (-prim.cv).toFixed(1) + '" r="' + prim.ri.toFixed(1) + '" fill="#fff" stroke="' + st.s + '" stroke-width="' + lw.toFixed(3) + '"/>';
      }
    });
    s += '</g>';
    // sol / mur
    if (opt.sol) s += '<line x1="' + (U0 - 8 / ech) + '" y1="0" x2="' + (U1 + 8 / ech) + '" y2="0" stroke="#000" stroke-width="' + (lw * 2.2) + '"/>' + hachures(U0 - 8 / ech, U1 + 8 / ech, 0, 4 / ech, lw);
    if (opt.mur !== undefined) {
      if (nomVue === 'droite') s += '<line x1="' + opt.mur + '" y1="' + (-(V1 + 4 / ech)) + '" x2="' + opt.mur + '" y2="' + (-(V0 - 2 / ech)) + '" stroke="#000" stroke-width="' + (lw * 2.2) + '"/>';
      if (nomVue === 'dessus') s += '<line x1="' + (U0 - 6 / ech) + '" y1="' + (-opt.mur) + '" x2="' + (U1 + 6 / ech) + '" y2="' + (-opt.mur) + '" stroke="#000" stroke-width="' + (lw * 2.2) + '"/>';
    }
    // cotes
    const C = cotation(ech);
    (opt.cotesH || []).forEach(ch => { s += C.chaineH(ch.pos, ch.v, ch.decal); });
    (opt.cotesV || []).forEach(ch => { s += C.chaineV(ch.pos, ch.u, ch.decal, ch.cote); });
    (opt.textes || []).forEach(t => { s += '<text x="' + t.u + '" y="' + (-t.v) + '" font-size="' + (tx * (t.k || 1)).toFixed(1) + '" fill="' + (t.c || '#1d2126') + '" text-anchor="' + (t.a || 'start') + '">' + t.t + '</text>'; });
    s += '</svg>';
    return s;
  }

  function hachures(u0, u1, v, h, lw) {
    let s = '';
    for (let u = u0; u < u1; u += h * 1.2) s += '<line x1="' + u.toFixed(1) + '" y1="' + (h * 0.1).toFixed(1) + '" x2="' + (u - h).toFixed(1) + '" y2="' + h.toFixed(1) + '" stroke="#555" stroke-width="' + (lw * 0.7).toFixed(3) + '"/>';
    return s;
  }

  /* Outils de cotation (coordonnées réelles, v vers le haut) */
  function cotation(ech) {
    const tx = 2.2 / ech, lw = 0.13 / ech, fl = 1.6 / ech, coul = '#1b4f7a';
    function fleche(x, y, ang) {
      const a1 = ang + 0.3, a2 = ang - 0.3;
      return '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' L' + (x + Math.cos(a1) * fl).toFixed(1) + ' ' + (y + Math.sin(a1) * fl).toFixed(1) + ' L' + (x + Math.cos(a2) * fl).toFixed(1) + ' ' + (y + Math.sin(a2) * fl).toFixed(1) + 'Z" fill="' + coul + '"/>';
    }
    function ligne(x1, y1, x2, y2, w) { return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + coul + '" stroke-width="' + (w || lw).toFixed(3) + '"/>'; }
    function texte(x, y, t, rot) {
      return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + tx.toFixed(1) + '" fill="' + coul + '" text-anchor="middle"' + (rot ? ' transform="rotate(-90 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"' : '') + '>' + t + '</text>';
    }
    return {
      // cote horizontale : pos = abscisses, v = ordonnée de la ligne d'attache (bord de l'objet), decal = distance de la ligne de cote (mm papier, négatif = vers le bas)
      chaineH(pos, v, decal) {
        const y = -(v + decal / ech), yA = -v;
        let s = '';
        pos.forEach(u => { s += ligne(u, yA - Math.sign(decal) * 1 / ech, u, y - Math.sign(decal) * 1.2 / ech); });
        for (let i = 0; i < pos.length - 1; i++) {
          const a = pos[i], b = pos[i + 1], L = b - a;
          s += ligne(a, y, b, y);
          s += fleche(a, y, 0) + fleche(b, y, Math.PI);
          const petit = L * ech < 7;
          s += texte(petit ? (a + b) / 2 : (a + b) / 2, y - 0.8 / ech - (petit && i % 2 ? tx * 1.1 : 0), fmt(L));
        }
        return s;
      },
      chaineV(pos, u, decal, cumul) {
        const x = u + decal / ech;
        let s = '';
        pos.forEach(v => { s += ligne(u + Math.sign(decal) * 1 / ech, -v, x + Math.sign(decal) * 1.2 / ech, -v); });
        if (cumul) {
          // cotation cumulée depuis le premier point
          s += ligne(x, -pos[0], x, -pos[pos.length - 1]);
          s += fleche(x, -pos[0], -Math.PI / 2);
          for (let i = 1; i < pos.length; i++) {
            s += fleche(x, -pos[i], Math.PI / 2);
            s += '<text x="' + (x + (decal < 0 ? -0.8 : 0.8) / ech).toFixed(1) + '" y="' + (-pos[i] + tx * 0.35).toFixed(1) + '" font-size="' + (tx * 0.92).toFixed(1) + '" fill="' + coul + '" text-anchor="' + (decal < 0 ? 'end' : 'start') + '">' + fmt(pos[i] - pos[0]) + '</text>';
          }
          return s;
        }
        for (let i = 0; i < pos.length - 1; i++) {
          const a = pos[i], b = pos[i + 1], L = b - a;
          s += ligne(x, -a, x, -b);
          s += fleche(x, -a, -Math.PI / 2) + fleche(x, -b, Math.PI / 2);
          s += texte(x - 0.8 / ech, -(a + b) / 2, fmt(L), true);
        }
        return s;
      }
    };
  }

  /* Plan d'un cadre soudé, vu de côté (face latérale visible) */
  function cadre(ft, SECTIONS, ech) {
    const a = SECTIONS[ft.sec].a, D = ft.D, Hf = ft.Hf, Hb = ft.Hb, H = Math.max(Hf, Hb);
    const lw = 0.2 / ech, tx = 2.2 / ech;
    const mG = 34 / ech, mD = 34 / ech, mH = 8 / ech, mB = 18 / ech;
    const X0 = -mG, Y0 = -(H + mH), W = D + mG + mD, Hd = H + mH + mB;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [X0, Y0, W, Hd].map(v => v.toFixed(1)).join(' ') + '" width="' + (W * ech).toFixed(1) + 'mm" height="' + (Hd * ech).toFixed(1) + 'mm" font-family="Arial, Helvetica, sans-serif">';
    const R = (x, y, w, h, f) => '<rect x="' + x.toFixed(1) + '" y="' + (-(y + h)).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + (f || '#b9c0c7') + '" stroke="#1d2126" stroke-width="' + lw.toFixed(3) + '"/>';
    s += R(0, 0, a, Hf) + R(D - a, 0, a, Hb);
    ft.traverses.forEach(t => {
      s += R(a, t.z - a, D - 2 * a, a, t.us === 'tab' ? '#d9c39d' : (t.us === 'tringle' ? '#c9cfd4' : '#b9c0c7'));
      // cordons de soudure (triangles)
      [[a, 1], [D - a, -1]].forEach(([x, sg]) => {
        s += '<path d="M' + x + ' ' + (-(t.z - a)) + ' l' + (sg * 3 / ech) + ' 0 l' + (-sg * 3 / ech) + ' ' + (-3 / ech) + 'Z" fill="#1d2126"/>';
      });
    });
    // trous
    const trous = (cote, x) => Object.values(ft.trous[cote]).forEach(t => {
      s += '<circle cx="' + (x + a / 2) + '" cy="' + (-t.z).toFixed(1) + '" r="' + (t.filet === 'M6' ? 4.5 : 3.5) + '" fill="#fff" stroke="#c0392b" stroke-width="' + (lw * 0.9).toFixed(3) + '"/>';
    });
    trous('av', 0); trous('ar', D - a);
    Object.values(ft.traversants).forEach(t => {
      const x = t.cote === 'av' ? a / 2 : D - a / 2;
      s += '<circle cx="' + x + '" cy="' + (-t.z) + '" r="3.25" fill="#fff" stroke="#1b4f7a" stroke-width="' + lw.toFixed(3) + '"/><path d="M' + (x - 5) + ' ' + (-t.z) + 'h10M' + x + ' ' + (-t.z - 5) + 'v10" stroke="#1b4f7a" stroke-width="' + (lw * 0.7).toFixed(3) + '"/>';
    });
    Object.values(ft.faceAvant).forEach(t => { s += '<path d="M0 ' + (-t.z) + ' l' + (-4 / ech) + ' ' + (-1.5 / ech) + ' v' + (3 / ech) + 'Z" fill="#c0392b"/>'; });
    // vérins
    if (ft.verins) [a / 2, D - a / 2].forEach(x => { s += '<rect x="' + (x - 15) + '" y="0" width="30" height="' + (4 / ech).toFixed(1) + '" fill="#333"/>'; });
    // cotes
    const C = cotation(ech);
    s += C.chaineH([0, a, D - a, D], 0, -9);
    const zt = ft.traverses.map(t => t.z).sort((u, v) => u - v);
    s += C.chaineV([0].concat(zt.filter(z => z < Hb)).concat([Hb]).filter((v, i, arr) => arr.indexOf(v) === i), D, 12, true);
    if (Hb !== Hf) s += C.chaineV([0, Hf], 0, -6);
    const zf = Object.values(ft.trous.av).map(t => t.z).concat(Object.values(ft.traversants).filter(t => t.cote === 'av').map(t => t.z)).concat(Object.values(ft.faceAvant).map(t => t.z)).sort((u, v) => u - v);
    if (zf.length) s += C.chaineV([0].concat(zf), 0, Hb !== Hf ? -16 : -10, true);
    const zb = Object.values(ft.trous.ar).map(t => t.z).concat(Object.values(ft.traversants).filter(t => t.cote === 'ar').map(t => t.z)).sort((u, v) => u - v);
    if (zb.length) s += C.chaineV([0].concat(zb), D, 26, true);
    s += '</svg>';
    return s;
  }

  /* ---------- Détails d'assemblage (dessins à l'échelle 1:1 ou 1:2, en mm) ---------- */
  function cadreDetail(vb, contenu, titre, largeurMm) {
    const p = vb.split(' ').map(Number);
    const ech = largeurMm / p[2];
    return '<figure class="detail"><svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + largeurMm + 'mm" height="' + (p[3] * ech).toFixed(1) + 'mm" font-family="Arial, Helvetica, sans-serif" font-size="' + (2.4 / ech).toFixed(2) + '">' + contenu + '</svg><figcaption>' + titre + '</figcaption></figure>';
  }
  function rep(x1, y1, x2, y2, t, anc) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#1b4f7a" stroke-width="0.35"/><circle cx="' + x1 + '" cy="' + y1 + '" r="0.9" fill="#1b4f7a"/><text x="' + (x2 + (anc === 'end' ? -1 : 1)) + '" y="' + (y2 + 1.2) + '" fill="#1b4f7a" text-anchor="' + (anc || 'start') + '">' + t + '</text>';
  }
  const HACH = '<defs><pattern id="hach" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#555" stroke-width="0.35"/></pattern><pattern id="hachB" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#8a6a3a" stroke-width="0.35"/></pattern><pattern id="hachM" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#999" stroke-width="0.5"/><line x1="2.5" y1="0" x2="2.5" y2="5" stroke="#bbb" stroke-width="0.3"/></pattern></defs>';
  function tubeCoupe(x, y, a, t) {
    return '<rect x="' + x + '" y="' + y + '" width="' + a + '" height="' + a + '" rx="' + (1.5 * t) + '" fill="url(#hach)" stroke="#111" stroke-width="0.35"/><rect x="' + (x + t) + '" y="' + (y + t) + '" width="' + (a - 2 * t) + '" height="' + (a - 2 * t) + '" rx="' + (0.5 * t) + '" fill="#fff" stroke="#111" stroke-width="0.35"/>';
  }

  function details() {
    const L = [];
    // D1 : platine d'about boulonnée sur écrous à sertir (coupe horizontale)
    let c = HACH;
    c += tubeCoupe(10, 20, 25, 1.5);                                         // montant en coupe
    c += '<rect x="35" y="20" width="3" height="25" fill="#b8bec5" stroke="#111" stroke-width="0.35"/>';   // platine
    c += '<rect x="38" y="20" width="50" height="25" fill="#d6dade" stroke="#111" stroke-width="0.35"/><line x1="38" y1="21.5" x2="88" y2="21.5" stroke="#111" stroke-width="0.25" stroke-dasharray="1.5 1"/><line x1="38" y1="43.5" x2="88" y2="43.5" stroke="#111" stroke-width="0.25" stroke-dasharray="1.5 1"/>';
    c += '<path d="M38 20 l3 -3 v3z M38 45 l3 3 v-3z" fill="#111"/>';        // soudures
    c += '<rect x="26.5" y="28" width="7" height="9" fill="#e0b84a" stroke="#111" stroke-width="0.3"/><rect x="33.5" y="26.5" width="1.5" height="12" fill="#e0b84a" stroke="#111" stroke-width="0.3"/>';  // écrou à sertir
    c += '<line x1="20" y1="32.5" x2="48" y2="32.5" stroke="#111" stroke-width="0.25" stroke-dasharray="4 1 1 1"/>';
    c += '<text x="8" y="12" font-weight="bold">Coupe horizontale au droit d\'un boulon</text>';
    c += rep(30, 30, 20, 58, 'Écrou à sertir M6 (perçage Ø9)', 'start') + rep(36.5, 40, 50, 58, 'Platine 25×3, trous Ø6,5') + rep(70, 25, 80, 10, 'Lisse 25×25×1,5') + rep(16, 22, 6, 8, 'Montant 25×25×1,5', 'start');
    L.push(cadreDetail('0 0 110 64', c, 'D1 · Lisse sur platine d\'about : 2 vis CHC M6×16 + rondelles, serrage 8 N·m. La vis traverse la platine au-dessus et au-dessous de la lisse.', 80));
    // D2 : liaison inter-modules
    c = HACH;
    c += tubeCoupe(20, 20, 25, 1.5) + tubeCoupe(45, 20, 25, 1.5);
    c += '<rect x="10" y="30" width="70" height="5" fill="#d0d4d8" stroke="#111" stroke-width="0.3"/>';
    c += '<rect x="7" y="27" width="3" height="11" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/><rect x="17" y="26" width="3" height="13" fill="#bbb" stroke="#111" stroke-width="0.3"/><rect x="70" y="26" width="3" height="13" fill="#bbb" stroke="#111" stroke-width="0.3"/><rect x="73" y="27.5" width="6" height="10" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/>';
    c += '<text x="8" y="12" font-weight="bold">Coupe horizontale, montants accolés</text>';
    c += rep(8.5, 32.5, 4, 52, 'Tête de vis M6×60', 'start') + rep(18.5, 37, 26, 54, 'Rondelle large M6×18') + rep(76, 34, 84, 50, 'Écrou frein Nylstop') + rep(57, 22, 66, 10, 'Trou traversant Ø6,5');
    L.push(cadreDetail('0 0 100 60', c, 'D2 · Liaison entre deux modules : boulons traversants, 2 hauteurs × avant et arrière. Serrage limité à 5 N·m pour ne pas écraser les tubes.', 72));
    // D3 : ancrage mural
    c = HACH;
    c += '<rect x="70" y="5" width="22" height="70" fill="url(#hachM)" stroke="#111" stroke-width="0.35"/>';
    c += tubeCoupe(20, 30, 25, 1.5);
    c += '<rect x="45" y="30" width="4" height="25" fill="#b8bec5" stroke="#111" stroke-width="0.3"/>';
    c += '<path d="M45 30 h21 v-24 h4 v28 h-25z" fill="#b8bec5" stroke="#111" stroke-width="0.35"/>';
    c += '<rect x="70" y="16" width="16" height="7" fill="#f2f2f2" stroke="#111" stroke-width="0.3"/><rect x="58" y="17.5" width="28" height="4" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/><rect x="62" y="15" width="4" height="9" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/>';
    c += '<line x1="45" y1="70" x2="70" y2="70" stroke="#1b4f7a" stroke-width="0.3"/><text x="57.5" y="68.5" text-anchor="middle" fill="#1b4f7a">jeu 15–20</text>';
    c += '<text x="8" y="10" font-weight="bold">Vue de dessus</text>';
    c += rep(32, 42, 10, 64, 'Montant arrière', 'start') + rep(47, 44, 52, 62, 'Vis CHC M6×16') + rep(67, 8, 40, 8, 'Équerre 40×40×4, trou oblong 8,5×20', 'end') + rep(78, 19.5, 96, 36, 'Cheville Ø8') + rep(80, 60, 96, 52, 'Mur');
    L.push(cadreDetail('0 0 120 78', c, 'D3 · Équerre d\'ancrage mural : le trou oblong rattrape la plinthe et les défauts du mur. Cheville choisie selon le support (tableau des chevilles).', 80));
    // D4 : vérin
    c = HACH;
    c += '<rect x="30" y="5" width="25" height="40" fill="none" stroke="#111" stroke-width="0.35"/><rect x="31.5" y="5" width="22" height="40" fill="#fff" stroke="none"/><path d="M30 5 v40 h1.5 v-40z M53.5 5 v40 h1.5 v-40z" fill="url(#hach)" stroke="#111" stroke-width="0.3"/>';
    c += '<rect x="31.5" y="27" width="22" height="18" fill="#444" stroke="#111" stroke-width="0.3"/><rect x="38.5" y="38" width="8" height="18" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/>';
    c += '<rect x="27.5" y="56" width="30" height="5" rx="1.5" fill="#222"/><line x1="10" y1="61" x2="75" y2="61" stroke="#111" stroke-width="0.6"/>';
    c += rep(32, 35, 8, 30, 'Embout taraudé M8', 'start') + rep(46, 50, 64, 47, 'Tige M8, course 15–30') + rep(55, 58, 64, 60, 'Patin Ø30');
    L.push(cadreDetail('0 0 90 66', c, 'D4 · Vérin de nivellement sous chaque montant (A et C). Régler à mi-course au montage, puis ajuster au niveau.', 62));
    // D5 : tablette vissée par dessous
    c = HACH;
    c += '<rect x="5" y="18" width="80" height="15" fill="url(#hachB)" stroke="#5c4526" stroke-width="0.35"/>';
    c += tubeCoupe(30, 33, 25, 1.5);
    c += '<rect x="41" y="20" width="3" height="21" fill="#9aa1a8" stroke="#111" stroke-width="0.25"/><path d="M38.5 58 h8 l-2 -2.5 h-4z" fill="#9aa1a8" stroke="#111" stroke-width="0.25"/><rect x="41" y="41" width="3" height="15" fill="#9aa1a8" stroke="#111" stroke-width="0.25"/>';
    c += rep(60, 25, 70, 10, 'Tablette CP 15 ou 18') + rep(31, 45, 6, 52, 'Traverse 25×25', 'start') + rep(42.5, 34, 64, 46, 'Ø4,5 dessus') + rep(45, 57, 64, 62, 'Ø8 dessous (passage tournevis)') + rep(42.5, 24, 20, 10, 'Vis bois 4×30', 'end');
    L.push(cadreDetail('0 0 100 66', c, 'D5 · Fixation des tablettes : 2 vis à bois par extrémité, passées par dessous. La vis ne doit pas déboucher (longueur 30 pour 15 mm de bois + 1,5 mm de paroi).', 70));
    // D6 : poste gaz
    c = HACH;
    c += '<rect x="5" y="10" width="6" height="110" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/><rect x="129" y="10" width="6" height="110" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/>';
    c += '<rect x="11" y="88" width="118" height="6" fill="#9aa1a8" stroke="#111" stroke-width="0.3"/><rect x="11" y="85.5" width="118" height="2.5" fill="#cfd5da" stroke="#111" stroke-width="0.3"/>';
    [74, 88, 102].forEach((y, i) => { c += '<circle cx="8" cy="' + y + '" r="1.6" fill="' + (i === 1 ? '#c0392b' : '#fff') + '" stroke="#111" stroke-width="0.25"/>'; });
    c += '<rect x="40" y="40" width="60" height="45.5" rx="6" fill="#2a63a8" stroke="#111" stroke-width="0.35"/><rect x="50" y="30" width="40" height="10" fill="#2a63a8" stroke="#111" stroke-width="0.3"/><rect x="62" y="22" width="16" height="8" fill="#bbb" stroke="#111" stroke-width="0.3"/><rect x="30" y="19" width="80" height="3" fill="#ccc" stroke="#111" stroke-width="0.3"/>';
    c += '<rect x="37" y="52" width="66" height="5" fill="none" stroke="#c4532f" stroke-width="1.2"/>';
    c += '<rect x="134" y="5" width="2" height="60" fill="#aeb6bd" stroke="#111" stroke-width="0.2"/>';
    c += rep(70, 20, 120, 4, 'Support casserole ≈ 870 du sol') + rep(100, 54.5, 112, 50, 'Collier + sangle') + rep(8, 88, 20, 112, 'Crans de réglage : 340 / 400 / 460', 'start') + rep(70, 86, 92, 112, 'Plateau tôle 2 mm sur 2 traverses');
    L.push(cadreDetail('0 0 150 122', c, 'D6 · Poste gaz (vue de face simplifiée, 1:10) : plateau réglable en hauteur, collier anti-basculement, écran galvanisé côté plaque induction.', 72));
    return L;
  }

  const PLANS = { vue, cadre, details, cotation, bornesFormes };
  root.PLANS = PLANS;
})(typeof window !== 'undefined' ? window : globalThis);
