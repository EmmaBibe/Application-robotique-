/*
 * Géométrie réaliste de chaque pièce du modèle.
 * Les pièces de structure reprennent exactement les boîtes du modèle (angles arrondis, matières réelles) ;
 * les équipements (bouteille, plaques, verres, vêtements…) sont remodelés dans l'emprise prévue par le modèle.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function bornes(formes) {
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

/* ---------- Outils géométriques ---------- */
function M(geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); if (x !== undefined) m.position.set(x, y, z); return m; }
function rboite(dx, dy, dz, r, seg) {
  const rr = Math.max(0.01, Math.min(r, dx / 2 - 0.01, dy / 2 - 0.01, dz / 2 - 0.01));
  return new RoundedBoxGeometry(dx, dy, dz, seg || 2, rr);
}
function boiteForme(f, mat, r) {
  return M(rboite(f.dx, f.dy, f.dz, r === undefined ? 1 : r), mat, f.x + f.dx / 2, f.y + f.dy / 2, f.z + f.dz / 2);
}
function cylindre(r, h, seg, ax) {
  const g = new THREE.CylinderGeometry(r, r, h, seg || 24);
  if (ax === 'z') g.rotateX(Math.PI / 2);
  else if (ax === 'x') g.rotateZ(Math.PI / 2);
  return g;
}
function cylForme(f, mat, seg) {
  if (f.t === 'anneau') return M(tour([[f.r1, 0], [f.r2, 0], [f.r2, f.h], [f.r1, f.h]], seg || 32), mat, f.x, f.y, f.z);
  const g = cylindre(f.r, f.h, seg || Math.max(12, f.n * 2), f.ax);
  const c = f.ax === 'z' ? [f.x, f.y, f.z + f.h / 2] : f.ax === 'x' ? [f.x + f.h / 2, f.y, f.z] : [f.x, f.y + f.h / 2, f.z];
  return M(g, mat, c[0], c[1], c[2]);
}
/* Révolution d'un profil (r, z) autour de l'axe z */
function tour(pts, seg) {
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])), seg || 40);
  g.rotateX(Math.PI / 2);
  return g;
}
/* Profil creux à paroi d'épaisseur e (verre, tasse, casserole) */
function profilCreux(rb, rt, h, fond, e, arrondi) {
  const a = arrondi || Math.min(4, rb * 0.15);
  return [[0, 0], [rb - a, 0], [rb, a], [rt, h], [rt - e, h], [rb - e, fond + a * 0.5], [rb - e - a, fond], [0, fond]];
}
function tore(R, r, arc, seg) { return new THREE.TorusGeometry(R, r, 10, seg || 24, arc || Math.PI * 2); }

/* UV « monde » sur une boîte : u le long de la plus grande dimension du plan de la face */
function uvPanneau(g, dims) {
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const t = dims.indexOf(Math.min.apply(null, dims));
  for (let i = 0; i < pos.count; i++) {
    const n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    const ax = n.indexOf(Math.max.apply(null, n));
    const p = [pos.getX(i) + dims[0] / 2, pos.getY(i) + dims[1] / 2, pos.getZ(i) + dims[2] / 2];
    const autres = [0, 1, 2].filter(k => k !== ax);
    if (ax === t) {
      const lg = dims[autres[0]] >= dims[autres[1]] ? autres[0] : autres[1];
      const ct = lg === autres[0] ? autres[1] : autres[0];
      uv.setXY(i, p[ct] / 650, p[lg] / 650);
    } else {
      const lg = autres[0] === t ? autres[1] : autres[0];
      uv.setXY(i, p[lg] / 200, p[t] / dims[t]);
    }
  }
  g.groups.forEach((gr, k) => { gr.materialIndex = Math.floor(k / 2) === t ? 0 : 1; });
}
function panneau(f, mat) {
  const g = new THREE.BoxGeometry(f.dx, f.dy, f.dz);
  uvPanneau(g, [f.dx, f.dy, f.dz]);
  return M(g, [mat.get('bois'), mat.get('chant')], f.x + f.dx / 2, f.y + f.dy / 2, f.z + f.dz / 2);
}

/* ---------- Équipements ---------- */
const EQUIP = {
  'Bouteille de gaz 5 kg'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    const peint = mat.get('peintureBouteille', p.couleur);
    g.add(M(tour([[0, 0], [104, 0], [118, 4], [124, 14], [125, 30], [125, 262], [121, 286], [108, 303], [86, 316], [46, 323], [0, 325]], 56), peint));
    g.add(M(tour([[100, -2], [112, -2], [113, 20], [101, 20]], 48), peint));          // pied
    g.add(M(tour([[67, 318], [76, 318], [77, 360], [73, 368], [67, 362]], 48), peint)); // collerette
    g.add(M(cylindre(13, 30, 20, 'z'), mat.get('laiton'), 0, 0, 337));
    const et = new THREE.CylinderGeometry(125.6, 125.6, 95, 32, 1, true, -0.55, 1.1);
    et.rotateX(Math.PI / 2);
    g.add(M(et, mat.get('plastique', '#f3efe2'), 0, 0, 175));
    g.position.set(f.x, f.y, f.z);
    return g;
  },
  'Brûleur + support casserole alu (type Pro Gaz)'(p, b, mat) {
    const f0 = p.formes[0], g = new THREE.Group();
    const cx = f0.x, cy = f0.y, z = f0.z;
    const alu = mat.get('alu');
    g.add(M(cylindre(14, 22, 20, 'z'), mat.get('laiton'), cx, cy, z + 11));
    g.add(M(tour([[0, 0], [30, 0], [44, 14], [45, 26], [0, 26]], 40), alu, cx, cy, z + 22));
    g.add(M(tour([[0, 0], [38, 0], [38, 9], [30, 13], [0, 13]], 40), mat.get('fonte'), cx, cy, z + 48));
    g.add(M(cylindre(9, 26, 16, 'y'), mat.get('plastique', '#1d1e20'), cx, cy - 34, z + 14));
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4;
      const bras = rboite(132, 16, 10, 3);
      const mb = M(bras, alu, cx + Math.cos(a) * 100, cy + Math.sin(a) * 100, z + 76);
      mb.rotation.z = a;
      g.add(mb);
      g.add(M(cylindre(6, 60, 12, 'z'), alu, cx + Math.cos(a) * 78, cy + Math.sin(a) * 78, z + 42));
    }
    g.add(M(tore(104, 6, Math.PI * 2, 48), alu, cx, cy, z + 81));
    return g;
  },
  'Plaque induction BOMA monoplace'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    const cx = f.x + f.dx / 2, cy = f.y + f.dy / 2;
    g.add(M(rboite(f.dx, f.dy, f.dz - 12, 8), mat.get('plastique', '#2a2c30'), cx, cy, f.z + 6 + (f.dz - 12) / 2));
    g.add(M(rboite(f.dx - 2, f.dy - 2, 6, 3), mat.get('verreNoir'), cx, cy, f.z + f.dz - 3));
    const r2 = p.formes[1];
    [85, 60].forEach(r => { const t = M(tore(r, 0.9, Math.PI * 2, 64), mat.get('mat', '#8a8f96'), r2.x, r2.y, f.z + f.dz + 0.2); t.scale.z = 0.3; g.add(t); });
    for (let k = 0; k < 4; k++) { const t = M(tore(5, 0.8, Math.PI * 2, 20), mat.get('mat', '#c9ccd0'), f.x + 70 + k * 40, f.y + 30, f.z + f.dz + 0.2); t.scale.z = 0.3; g.add(t); }
    g.add(M(new THREE.BoxGeometry(34, 12, 0.6), mat.get('emissif', '#ff3a1c'), f.x + 240, f.y + 30, f.z + f.dz + 0.3));
    [[18, 18], [f.dx - 18, 18], [18, f.dy - 18], [f.dx - 18, f.dy - 18]].forEach(q => g.add(M(cylindre(9, 6, 14, 'z'), mat.get('caoutchouc'), f.x + q[0], f.y + q[1], f.z + 3)));
    return g;
  },
  'Réchaud électrique monoplace'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    const cx = f.x + f.dx / 2, cy = f.y + f.dy / 2;
    g.add(M(rboite(f.dx, f.dy, f.dz - 6, 12, 3), mat.get('email', '#efece5'), cx, cy, f.z + 6 + (f.dz - 6) / 2));
    const pl = p.formes[1];
    g.add(M(tore(100, 4, Math.PI * 2, 48), mat.get('chrome'), pl.x, pl.y, f.z + f.dz));
    g.add(M(cylindre(92, 9, 48, 'z'), mat.get('fonte'), pl.x, pl.y, f.z + f.dz + 4));
    [28, 52, 74].forEach(r => g.add(M(tore(r, 1.4, Math.PI * 2, 48), mat.get('mat', '#1a1b1c'), pl.x, pl.y, f.z + f.dz + 8.6)));
    g.add(M(cylindre(17, 16, 24, 'y'), mat.get('plastique', '#1c1d1f'), f.x + 50, f.y - 6, f.z + 38));
    g.add(M(new THREE.SphereGeometry(4, 12, 8), mat.get('emissif', '#ff4a20'), f.x + 95, f.y - 1, f.z + 40));
    [[20, 20], [f.dx - 20, 20], [20, f.dy - 20], [f.dx - 20, f.dy - 20]].forEach(q => g.add(M(cylindre(10, 6, 14, 'z'), mat.get('caoutchouc'), f.x + q[0], f.y + q[1], f.z + 3)));
    return g;
  },
  'Zone de dépose casserole chaude'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    const m = mat.get('mat', '#6d747b');
    g.add(M(new THREE.BoxGeometry(f.dx, 3, 0.4), m, f.x + f.dx / 2, f.y + 1.5, f.z + 0.2));
    g.add(M(new THREE.BoxGeometry(f.dx, 3, 0.4), m, f.x + f.dx / 2, f.y + f.dy - 1.5, f.z + 0.2));
    g.add(M(new THREE.BoxGeometry(3, f.dy, 0.4), m, f.x + 1.5, f.y + f.dy / 2, f.z + 0.2));
    g.add(M(new THREE.BoxGeometry(3, f.dy, 0.4), m, f.x + f.dx - 1.5, f.y + f.dy / 2, f.z + 0.2));
    return g;
  },
  'Couverture anti-feu (au mur)'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    g.add(boiteForme(f, mat.get('plastique', '#b3261e'), 14));
    g.add(M(new THREE.BoxGeometry(140, 1, 90), mat.get('plastique', '#f6f3ea'), f.x + f.dx / 2, f.y - 0.4, f.z + f.dz * 0.62));
    [-35, 35].forEach(d => g.add(M(rboite(22, 8, 50, 3), mat.get('plastique', '#151515'), f.x + f.dx / 2 + d, f.y + 6, f.z - 22)));
    return g;
  },
  'Bloc 2 prises 16 A avec interrupteur'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    g.add(boiteForme(f, mat.get('plastique', '#f2f2ef'), 6));
    [40, 92].forEach(dz => {
      g.add(M(cylindre(15, 4, 24, 'x'), mat.get('plastique', '#d8d8d3'), f.x - 1, f.y + f.dy / 2, f.z + dz));
      [-5, 5].forEach(d => g.add(M(cylindre(2, 5, 8, 'x'), mat.get('caoutchouc'), f.x - 2, f.y + f.dy / 2 + d, f.z + dz)));
    });
    g.add(M(rboite(4, 14, 10, 1.5), mat.get('emissif', '#ff3b1f'), f.x - 1, f.y + f.dy / 2, f.z + 125));
    return g;
  },
  'Barre aimantée à couteaux'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    g.add(boiteForme(f, mat.get('antiadhesif'), 5));
    [60, 140, 220].forEach((dx, k) => {
      const lame = 120 + k * 30;
      g.add(M(rboite(24 - k * 3, 2, lame, 1), mat.get('inox'), f.x + dx, f.y - 1.5, f.z + f.dz - lame / 2 - 5));
      g.add(M(rboite(18, 16, 95, 6), mat.get('plastique', '#141414'), f.x + dx, f.y - 8, f.z + f.dz + 40));
    });
    return g;
  },
  'Bouteille 1,5 L'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    g.add(M(tour([[0, 0], [36, 0], [43, 5], [45, 16], [45, 92], [42, 102], [45, 112], [45, 210], [40, 245], [24, 284], [15, 296], [15, 312], [0, 312]], 36), mat.get('pet')));
    g.add(M(new THREE.CylinderGeometry(45.8, 45.8, 70, 32, 1, true).rotateX(Math.PI / 2), mat.get('plastiqueBrillant', p.couleur), 0, 0, 150));
    g.add(M(cylindre(16, 17, 20, 'z'), mat.get('plastiqueBrillant', p.couleur === '#9cc6d9' ? '#2c6fb3' : '#e6e1d0'), 0, 0, 318));
    g.position.set(f.x, f.y, f.z);
    return g;
  },
  'Bouteille d\'huile'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group(), R = f.r;
    g.add(M(tour([[0, 0], [R - 4, 0], [R, 5], [R, f.h * 0.62], [R * 0.45, f.h * 0.86], [R * 0.32, f.h * 0.92], [R * 0.32, f.h], [0, f.h]], 36), mat.get('verreTeinte', p.couleur)));
    g.add(M(cylindre(R * 0.36, 22, 20, 'z'), mat.get('plastiqueBrillant', '#7a1f1a'), 0, 0, f.h + 8));
    g.add(M(new THREE.CylinderGeometry(R + 0.6, R + 0.6, 70, 32, 1, true).rotateX(Math.PI / 2), mat.get('plastique', '#f2ead2'), 0, 0, f.h * 0.35));
    g.position.set(f.x, f.y, f.z);
    return g;
  },
  'Pot à épices'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group(), R = f.r;
    g.add(M(tour([[0, 0], [R - 3, 0], [R, 3], [R, f.h - 18], [R - 4, f.h - 14], [0, f.h - 14]], 32), mat.get('verre')));
    g.add(M(cylindre(R - 3, f.h - 26, 24, 'z'), mat.get('mat', p.couleur), 0, 0, (f.h - 26) / 2 + 4));
    g.add(M(cylindre(R - 1, 16, 28, 'z'), mat.get('inox'), 0, 0, f.h - 8));
    g.position.set(f.x, f.y, f.z);
    return g;
  },
  'Assiette Ø265'(p, b, mat) {
    const f = p.formes[0], R = f.r;
    const geo = tour([[0, 0], [0.58 * R, 0], [0.62 * R, 3], [R - 2, 15], [R, 18], [R - 3, 18.5], [0.6 * R, 6.5], [0, 6]], 56);
    geo.translate(0, 0, -9);
    geo.rotateY(Math.PI / 2);
    return M(geo, mat.get('ceramique', '#f4f1ea'), f.x + f.h / 2, f.y, f.z);
  },
  'Crochet S + tasse suspendue'(p, b, mat) {
    const h = p.formes[0], c = p.formes[1], g = new THREE.Group();
    const x = h.x + 1, ch = mat.get('chrome');
    const s1 = M(tore(15, 1.6, Math.PI * 1.4, 18), ch, x, 10, 40); s1.rotation.set(-Math.PI * 0.2, Math.PI / 2, 0, 'YXZ'); g.add(s1);
    g.add(M(cylindre(1.6, 62, 8, 'z'), ch, x, -5, 9));
    const s2 = M(tore(12.5, 1.6, Math.PI * 1.2, 16), ch, x, -17.5, -22); s2.rotation.set(Math.PI * 0.9, Math.PI / 2, 0, 'YXZ'); g.add(s2);
    const cer = mat.get('ceramique', p.couleur);
    const corps = tour(profilCreux(c.r * 0.92, c.r, c.h, 7, 4), 36);
    corps.rotateX(Math.PI / 2);
    g.add(M(corps, cer, x, -4, -95));
    const anse = tore(20, 5, Math.PI, 20);
    anse.rotateZ(-Math.PI / 2); anse.rotateY(-Math.PI / 2);
    g.add(M(anse, cer, x, -30, -95 + c.r * 0.92));
    return g;
  },
  'Vêtement sur cintre'(p, b, mat) {
    const g = new THREE.Group();
    const x0 = b[0], W = b[4] - b[1], cy = (b[1] + b[4]) / 2, top = b[5], H = b[5] - b[2] - 45;
    const rod = top + 7.5;
    const s = new THREE.Shape();
    const pts = [[-0.38, 0], [0.38, 0], [0.40, -260], [0.52, -200], [0.50, -90], [0.40, -40], [0.13, -8], [0, -28], [-0.13, -8], [-0.40, -40], [-0.50, -90], [-0.52, -200], [-0.40, -260]];
    pts.forEach((q, i) => {
      const u = q[0] * W, v = i < 2 ? 0 : H + q[1];
      if (i === 0) s.moveTo(u, v); else s.lineTo(u, v);
    });
    const geo = new THREE.ExtrudeGeometry(s, { depth: 14, bevelEnabled: true, bevelThickness: 5, bevelSize: 5, bevelSegments: 2, curveSegments: 4 });
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 220, uv.getY(i) / 220);
    geo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    const denim = ['#5b6f8f', '#40566b', '#2f3e4e'].indexOf(p.couleur) >= 0;
    g.add(M(geo, denim ? mat.get('denim', '#d9e2f0') : mat.get('tissuJersey', p.couleur), x0 + 4, cy, b[2]));
    // cintre bois
    const bois = mat.get('boisFonce');
    const yE = W * 0.44;
    [-1, 1].forEach(sg => {
      const l = Math.hypot(yE, 34);
      const br = M(cylindre(5, l, 10, 'y'), bois, x0 + 11, cy + sg * yE / 2, rod - 40 - 17);
      br.rotation.x = -sg * Math.atan2(34, yE);
      g.add(br);
    });
    g.add(M(cylindre(1.8, 30, 8, 'z'), mat.get('chrome'), x0 + 11, cy, rod - 25));
    const cr = M(tore(15, 1.8, Math.PI * 1.3, 16), mat.get('chrome'), x0 + 11, cy, rod);
    cr.rotation.set(0, Math.PI / 2, -Math.PI * 0.15);
    g.add(cr);
    return g;
  },
  'Paire de chaussures'(p, b, mat) {
    const g = new THREE.Group();
    const h = Math.min(b[5] - b[2], 110);
    const cuir = mat.get('cuir', p.couleur), semelle = mat.get('caoutchouc', p.couleur === '#e9e6df' ? '#f4f4f2' : '#262422');
    [b[0] + 48, b[0] + 142].forEach(cx => {
      g.add(M(rboite(84, 280, 22, 9), semelle, cx, (b[1] + b[4]) / 2, b[2] + 11));
      g.add(M(rboite(80, 190, h - 30, 28, 3), cuir, cx, b[4] - 110, b[2] + 22 + (h - 30) / 2));
      const pointe = M(new THREE.SphereGeometry(1, 20, 14), cuir, cx, b[1] + 70, b[2] + 30);
      pointe.scale.set(40, 62, 30);
      g.add(pointe);
    });
    return g;
  },
  'Pile de vêtements pliés'(p, b, mat) {
    const g = new THREE.Group();
    const n = Math.max(2, Math.floor((b[5] - b[2]) / 36));
    const base = new THREE.Color(p.couleur);
    for (let k = 0; k < n; k++) {
      const c = base.clone().offsetHSL((k % 3 - 1) * 0.04, 0, (k % 2) * 0.06 - 0.03).getStyle();
      const m = k % 3 === 2 ? mat.get('denim', '#e6ecf5') : mat.get('tissuJersey', '#' + new THREE.Color(c).getHexString());
      const pl = M(rboite(b[3] - b[0] - 8, b[4] - b[1] - 10, 32, 12, 3), m, (b[0] + b[3]) / 2 + (k % 2 ? 3 : -3), (b[1] + b[4]) / 2 + (k % 3 - 1) * 4, b[2] + 17 + k * 35);
      g.add(pl);
    }
    return g;
  },
  'Boîte à thé / sucre'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    g.add(boiteForme(f, mat.get('plastiqueBrillant', p.couleur), 10));
    g.add(M(rboite(f.dx + 2, f.dy + 2, 22, 6), mat.get('chrome'), f.x + f.dx / 2, f.y + f.dy / 2, f.z + f.dz - 11));
    return g;
  },
  'Pile de couvercles'(p, b, mat) {
    const f = p.formes[0], g = new THREE.Group();
    [0, 1, 2].forEach(k => g.add(couvercle(f.r - k * 12, mat, f.x, f.y, f.z + k * 16)));
    return g;
  },
  'Saladier / passoire'(p, b, mat) {
    const f = p.formes[0];
    return M(tour(profilCreux(f.r * 0.5, f.r, f.h, 2, 1.5, 8), 48), mat.get('inox'), f.x, f.y, f.z);
  },
  'Poêle'(p, b, mat) {
    const f = p.formes[0], h = p.formes[1], g = new THREE.Group();
    g.add(M(tour(profilCreux(f.r - 28, f.r, f.h, 4, 3, 10), 48), mat.get('antiadhesif'), f.x, f.y, f.z));
    g.add(boiteForme(h, mat.get('plastique', '#151515'), 6));
    return g;
  }
};
function casserole(p, b, mat, avecManche) {
  const f = p.formes[0], g = new THREE.Group(), R = f.r, H = f.h;
  const inox = mat.get('inox');
  g.add(M(tour([[0, 0], [R - 8, 0], [R, 7], [R, H], [R + 2, H + 1], [R - 3, H + 1], [R - 3, 8], [R - 9, 4], [0, 4]], 48), inox, f.x, f.y, f.z));
  if (avecManche) {
    const h = p.formes[1];
    g.add(boiteForme(h, mat.get('plastique', '#161616'), 6));
  } else {
    [-1, 1].forEach(sg => {
      const a = M(tore(22, 4, Math.PI, 16), inox, f.x + sg * (R + 6), f.y, f.z + H - 18);
      a.rotation.set(Math.PI / 2, 0, sg > 0 ? -Math.PI / 2 : Math.PI / 2);
      g.add(a);
    });
  }
  if (avecManche || R >= 110) g.add(couvercle(R + 1, mat, f.x, f.y, f.z + H + 1));
  return g;
}
function couvercle(R, mat, x, y, z) {
  const g = new THREE.Group();
  g.add(M(tour([[0, 0], [R + 2, 0], [R + 2, 3], [R * 0.85, 9], [R * 0.4, 17], [0, 19]], 48), mat.get('inox'), x, y, z));
  g.add(M(cylindre(14, 16, 20, 'z'), mat.get('plastique', '#161616'), x, y, z + 26));
  return g;
}
EQUIP['Casserole'] = (p, b, mat) => casserole(p, b, mat, false);
EQUIP['Marmite'] = (p, b, mat) => casserole(p, b, mat, false);
EQUIP['Casserole en cours de cuisson'] = (p, b, mat) => casserole(p, b, mat, true);

const VERRES = {
  'Verre à eau': (R, h) => profilCreux(R * 0.84, R, h, 8, 1.8),
  'Verre à bière': (R, h) => profilCreux(R * 0.72, R, h, 12, 2.2),
  'Verre à whisky': (R, h) => profilCreux(R, R, h, 15, 3, 3)
};
const USTENSILES = ['Louche', 'Spatule', 'Écumoire', 'Fouet', 'Pince', 'Cuillère en bois', 'Spatule souple'];

function equipement(p, meuble, mat) {
  const b = bornes(p.formes);
  if (EQUIP[p.nom]) return EQUIP[p.nom](p, b, mat);
  if (VERRES[p.nom]) {
    const f = p.formes[0];
    return M(tour(VERRES[p.nom](f.r, f.h), 40), mat.get('verre'), f.x, f.y, f.z);
  }
  if (p.nom === 'Tasse à thé' || p.nom === 'Gobelet') {
    const f = p.formes[0], g = new THREE.Group();
    const m = p.nom === 'Gobelet' ? mat.get('plastiqueBrillant', p.couleur) : mat.get('ceramique', p.couleur);
    g.add(M(tour(profilCreux(f.r * (p.nom === 'Gobelet' ? 0.75 : 0.9), f.r, f.h, 6, p.nom === 'Gobelet' ? 1.5 : 3.5), 36), m, f.x, f.y, f.z));
    if (p.nom === 'Tasse à thé') {
      const a = tore(18, 4.5, Math.PI, 16);
      a.rotateZ(-Math.PI / 2); a.rotateX(Math.PI / 2);
      g.add(M(a, m, f.x + f.r - 2, f.y, f.z + f.h * 0.55));
    }
    return g;
  }
  if (USTENSILES.indexOf(p.nom) >= 0) {
    const [fc, fm, ft] = p.formes, g = new THREE.Group();
    const bois = p.nom === 'Cuillère en bois';
    const mm = bois ? mat.get('boisFonce') : mat.get('inox');
    const x = fm.x + fm.dx / 2, y = fm.y + fm.dy / 2;
    const cr = M(tore(9, 1.6, Math.PI * 1.3, 14), mat.get('chrome'), x, y + 4, fc.z + fc.dz - 6); cr.rotation.set(0, Math.PI / 2, 0); g.add(cr);
    g.add(M(rboite(bois ? 14 : 12, 5, fm.dz, 2.4), mm, x, y, fm.z + fm.dz / 2));
    const zt = ft.z + ft.dz / 2;
    if (p.nom === 'Louche') { const mi = mat.get('inox').clone(); mi.side = THREE.DoubleSide; g.add(M(new THREE.SphereGeometry(34, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mi, x, y - 20, zt + 10)); }
    else if (p.nom === 'Écumoire') g.add(M(cylindre(36, 2, 32, 'y'), mat.get('inox'), x, y, zt));
    else if (p.nom === 'Fouet') { for (let k = 0; k < 4; k++) { const t = M(tore(20, 1, Math.PI * 2, 24), mat.get('inox'), x, y, zt); t.scale.set(1, 1, 2.2); t.rotation.z = k * Math.PI / 4; t.rotation.x = Math.PI / 2; g.add(t); } }
    else if (p.nom === 'Pince') { [-1, 1].forEach(sg => { const m = M(rboite(10, 4, 230, 2), mat.get('inox'), x + sg * 9, y, fm.z + 115); m.rotation.y = sg * 0.06; g.add(m); }); }
    else g.add(M(rboite(ft.dx + 14, 4, ft.dz + 20, 6), p.nom === 'Spatule souple' ? mat.get('plastiqueBrillant', '#c8362b') : mm, x, y, zt));
    return g;
  }
  // par défaut : boîtes et cylindres arrondis de la couleur de la pièce
  const g = new THREE.Group();
  p.formes.forEach(f => g.add(f.t === 'box' ? boiteForme(f, mat.get('mat', p.couleur), 3) : cylForme(f, mat.get('mat', p.couleur))));
  return g;
}

/* Rideau plissé, calculé dans l'emprise du modèle */
function rideau(p, mat) {
  const b = bornes(p.formes);
  const W = b[3] - b[0], H = b[5] - b[2];
  const n = p.formes.length;
  const ouvert = p.variante === 'ouvert';
  const geo = new THREE.PlaneGeometry(W, H, n * 8, 6);
  geo.rotateX(Math.PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const A = ouvert ? 22 : 13;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + W / 2) / W, v = (pos.getZ(i) + H / 2) / H;
    const vague = Math.sin(u * Math.PI * n) * A * (0.85 + 0.15 * v) + Math.sin(u * 37.0) * 1.5;
    pos.setY(i, vague);
    uv.setXY(i, u * W / 320, v * H / 320);
  }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  const decalY = p.nom.indexOf('droit') >= 0 ? 7 : 0;
  g.add(M(geo, mat.get('tissuLin', p.couleur), b[0] + W / 2, (b[1] + b[4]) / 2 + decalY, b[2] + H / 2));
  const nb = Math.round(n * 0.75);
  for (let k = 0; k <= nb; k++) {
    const an = M(tore(15, 1.6, Math.PI * 2, 18), mat.get('chrome'), b[0] + k * W / nb, -55, b[5] + 7);
    an.rotation.y = Math.PI / 2;
    g.add(an);
  }
  return g;
}

/* ---------- Point d'entrée ---------- */
export function construirePiece(p, meuble, mat) {
  if (p.cat === 'equip') return equipement(p, meuble, mat);
  if (p.cat === 'rideau') return rideau(p, mat);
  const g = new THREE.Group();
  const acier = mat.get('peinture', meuble.code === 'B' ? '#2b2e33' : '#3a4048');
  p.formes.forEach(f => {
    let m;
    if (p.cat === 'panneau') { g.add(panneau(f, mat)); return; }
    if (p.cat === 'tole') m = /inox/i.test(p.mat) ? mat.get('inox') : /galva/i.test(p.mat) ? mat.get('galva') : /alu/i.test(p.mat) ? mat.get('alu') : mat.get('peinture', '#7b838c');
    else if (p.cat === 'rond') m = /Râtelier/.test(p.nom) ? mat.get('inox') : mat.get('chrome');
    else if (p.cat === 'quinc') {
      if (/Vérin/.test(p.nom)) {
        g.add(M(cylindre(15, 9, 24, 'z'), mat.get('caoutchouc'), f.x, f.y, 4.5));
        g.add(M(cylindre(4, f.h - 9, 12, 'z'), mat.get('zinc'), f.x, f.y, 9 + (f.h - 9) / 2));
        return;
      }
      m = /tringle/i.test(p.nom) ? mat.get('chrome') : mat.get('zinc');
    } else if (/Collier/.test(p.nom)) {
      g.add(cylForme(f, mat.get('peinture', '#c4532f'), 48));
      g.add(M(tour([[f.r1 - 3, 0], [f.r1, 0], [f.r1, f.h], [f.r1 - 3, f.h]], 48), mat.get('caoutchouc'), f.x, f.y, f.z));
      return;
    } else m = acier;
    if (f.t === 'box') {
      const petit = Math.min(f.dx, f.dy, f.dz);
      g.add(boiteForme(f, m, p.cat === 'tube' ? 2.2 : (p.cat === 'tole' ? Math.min(0.5, petit / 2) : Math.min(1, petit / 3))));
    } else g.add(cylForme(f, m));
  });
  return g;
}
