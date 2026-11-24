/*
 * Construction des scènes 3D à partir du modèle (partagé entre la simulation et les documents).
 */
(function (root) {
  'use strict';

  const COUCHES = [
    { id: 'structure', nom: 'Structure métallique' },
    { id: 'quinc', nom: 'Platines, pattes, quincaillerie' },
    { id: 'bois', nom: 'Panneaux bois / triplex' },
    { id: 'toles', nom: 'Tôles (inox, galva, alu)' },
    { id: 'equip', nom: 'Équipements et objets rangés' },
    { id: 'rideaux', nom: 'Rideaux' },
    { id: 'mur', nom: 'Mur et sol' }
  ];

  function coucheDe(p) {
    if (p.cat === 'tube' || p.cat === 'rond') return 'structure';
    if (p.cat === 'plat' || p.cat === 'quinc') return 'quinc';
    if (p.cat === 'panneau') return 'bois';
    if (p.cat === 'tole') return 'toles';
    if (p.cat === 'rideau') return 'rideaux';
    return 'equip';
  }

  function decaler(f, dx, dy, dz) {
    return Object.assign({}, f, { x: f.x + dx, y: f.y + dy, z: f.z + dz });
  }

  function construireScene(MODELE, code) {
    const sc = new root.MOTEUR.Scene();
    const K = code === 'K';
    const cfg = K ? MODELE.IMPLANTATION : MODELE.MEUBLES[code];
    const comps = K ? cfg.composants : [{ m: code, dx: 0, dy: 0, dz: 0 }];
    comps.forEach(c => {
      const m = MODELE.MEUBLES[c.m];
      m.parts.forEach(p => {
        if (!p.formes || !p.formes.length) return;
        sc.ajouter({
          formes: p.formes.map(f => decaler(f, c.dx, c.dy, c.dz)),
          couleur: p.couleur, alpha: p.cat === 'rideau' ? 0.6 : 1,
          part: p, meuble: m, couche: coucheDe(p)
        });
      });
    });
    // emprise pour le sol et le mur
    const b = sc.bornes();
    const C = MODELE.COUL;
    const tuile = 500;
    let x0, x1, y0, y1;
    if (cfg.sol) { x0 = cfg.sol.x0; x1 = cfg.sol.x1; y0 = cfg.sol.y0; y1 = cfg.sol.y1; }
    else { x0 = b[0] - 400; x1 = b[3] + 400; y0 = b[1] - 300; y1 = cfg.murY; }
    x0 = Math.floor(x0 / tuile) * tuile; x1 = Math.ceil(x1 / tuile) * tuile;
    if (cfg.sol) {
      for (let x = x0; x < x1; x += tuile) {
        for (let y = Math.floor(y0 / tuile) * tuile; y < y1; y += tuile) {
          const yy1 = Math.min(y + tuile, y1);
          const k = ((x / tuile) + Math.floor(y / tuile)) & 1;
          sc.ajouter({ formes: [{ t: 'box', x, y, z: -4, dx: tuile, dy: yy1 - y, dz: 4 }], couleur: k ? C.sol1 : C.sol2, couche: 'mur', pick: false });
        }
      }
    }
    const z0m = cfg.murZ0 !== undefined ? cfg.murZ0 : 0;
    const zh = cfg.murH;
    for (let x = x0; x < x1; x += tuile) {
      for (let z = z0m; z < zh; z += tuile) {
        const k = ((x / tuile) + Math.floor(z / tuile)) & 1;
        sc.ajouter({ formes: [{ t: 'box', x, y: cfg.murY, z, dx: tuile, dy: 30, dz: Math.min(tuile, zh - z) }], couleur: k ? C.mur : '#e4dfd6', couche: 'mur', pick: false });
      }
    }
    return sc;
  }

  function cadrer(scene, cam, W, H, marge) {
    const b = scene.bornes(o => o.couche !== 'mur' && o.visible);
    if (!isFinite(b[0])) return;
    cam.cible = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2];
    const r = Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) / 2;
    const asp = Math.min(1, W / H);
    cam.distance = r * (marge || 1.08) / (cam.focale * asp);
  }

  const SCENES = { COUCHES, coucheDe, construireScene, cadrer };
  root.SCENES = SCENES;
})(typeof window !== 'undefined' ? window : globalThis);
