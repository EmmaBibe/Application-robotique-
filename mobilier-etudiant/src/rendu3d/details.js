/*
 * Détails de fabrication visibles : cordons de soudure, collerettes des écrous à sertir,
 * bouchons, têtes de vis CHC, boulons de liaison, câbles électriques.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

function cyl(r, h, seg, ax) {
  const g = new THREE.CylinderGeometry(r, r, h, seg || 16);
  if (ax === 'x') g.rotateZ(Math.PI / 2);
  else if (ax === 'z') g.rotateX(Math.PI / 2);
  return g;
}
function placer(g, x, y, z) { g.translate(x, y, z); return g; }
function fusion(liste) { return liste.length ? mergeGeometries(liste.map(g => g.index ? g.toNonIndexed() : g), false) : null; }

/* Pièces « virtuelles » rattachées à chaque cadre soudé */
export function detailsCadres(meuble, mat) {
  const sorties = [];
  const peinture = mat.get('peinture', meuble.code === 'B' ? '#2b2e33' : '#3a4048');
  (meuble.cadres || []).forEach(c => {
    const a = c.a, D = c.D, soud = [], coll = [], bouch = [];
    const r = a === 25 ? 1.9 : 1.6;
    // cordons de soudure aux deux extrémités de chaque traverse
    c.traverses.forEach(zt => {
      const z1 = c.z0 + zt, z0 = z1 - a;
      [a, D - a].forEach(y => {
        soud.push(placer(cyl(r, a, 6, 'x'), c.x + a / 2, y, z1));
        soud.push(placer(cyl(r, a, 6, 'x'), c.x + a / 2, y, z0));
        soud.push(placer(cyl(r, a, 6, 'z'), c.x, y, (z0 + z1) / 2));
        soud.push(placer(cyl(r, a, 6, 'z'), c.x + a, y, (z0 + z1) / 2));
      });
    });
    // collerettes des écrous à sertir, sur les deux faces latérales
    const dc = a === 25 ? 6.5 : 5.5;
    [[c.trousAv, a / 2], [c.trousAr, D - a / 2]].forEach(([trous, y]) => {
      trous.forEach(z => {
        coll.push(placer(cyl(dc, 0.9, 18, 'x'), c.x - 0.45, y, c.z0 + z));
        coll.push(placer(cyl(dc, 0.9, 18, 'x'), c.x + a + 0.45, y, c.z0 + z));
      });
    });
    // bouchons plastiques en haut des montants (et en bas sans vérin)
    [[a / 2, c.Hf], [D - a / 2, c.Hb]].forEach(([y, H]) => {
      bouch.push(placer(new RoundedBoxGeometry(a + 1.2, a + 1.2, 3, 2, 1), c.x + a / 2, y, c.z0 + H + 1.5));
      if (!c.verins) bouch.push(placer(new RoundedBoxGeometry(a + 1.2, a + 1.2, 3, 2, 1), c.x + a / 2, y, c.z0 - 1.5));
    });
    const g = new THREE.Group();
    const gs = fusion(soud), gc = fusion(coll), gb = fusion(bouch);
    if (gs) g.add(new THREE.Mesh(gs, peinture));
    if (gc) g.add(new THREE.Mesh(gc, mat.get('zinc')));
    if (gb) g.add(new THREE.Mesh(gb, mat.get('caoutchouc', '#141516')));
    sorties.push({ part: { nom: 'Détails du cadre soudé', cat: 'tube', etape: c.etape, module: c.module }, groupe: g });
  });
  return sorties;
}

/* Têtes de vis CHC (six pans creux) */
export function tetesVis(vis, mat) {
  const g = new THREE.Group();
  const tetes = [], creux = [];
  const d = vis.d, h = d * 0.6;
  vis.zs.forEach(z => {
    tetes.push(placer(cyl(d / 2, h, 20, 'x'), vis.x + vis.sens * h / 2, vis.y, z));
    creux.push(placer(cyl(d * 0.26, 1.2, 6, 'x'), vis.x + vis.sens * (h + 0.2), vis.y, z));
  });
  g.add(new THREE.Mesh(fusion(tetes), mat.get('noirOxyde')));
  g.add(new THREE.Mesh(fusion(creux), mat.get('caoutchouc', '#050505')));
  if (vis.ymur !== undefined) {
    // vis + rondelle de la cheville, sur l'aile murale
    const z = vis.zs[0];
    const t = cyl(4.5, 3.5, 6, 'z');
    t.rotateX(Math.PI / 2);
    g.add(new THREE.Mesh(placer(t, vis.xmur, vis.ymur - 5.8, z), mat.get('zinc')));
    const r = cyl(8, 1.2, 20, 'z');
    r.rotateX(Math.PI / 2);
    g.add(new THREE.Mesh(placer(r, vis.xmur, vis.ymur - 4.6, z), mat.get('zinc')));
  }
  return g;
}

/* Boulon de liaison : tête hexagonale + rondelle d'un côté, écrou frein de l'autre */
export function boulonLiaison(p, mat) {
  const g = new THREE.Group();
  const [f1, f2] = p.formes;
  const z = f1.z, y = f1.y;
  const zinc = mat.get('zinc');
  g.add(new THREE.Mesh(placer(cyl(9, 1.4, 24, 'x'), f1.x + f1.h - 0.7, y, z), zinc));
  g.add(new THREE.Mesh(placer(cyl(5.8, 4, 6, 'x'), f1.x + f1.h - 3.4, y, z), zinc));
  g.add(new THREE.Mesh(placer(cyl(9, 1.4, 24, 'x'), f2.x + 0.7, y, z), zinc));
  g.add(new THREE.Mesh(placer(cyl(5.8, 5, 6, 'x'), f2.x + 3.9, y, z), zinc));
  g.add(new THREE.Mesh(placer(cyl(5.2, 2.2, 16, 'x'), f2.x + 7.4, y, z), mat.get('plastique', '#e8e2c8')));
  g.add(new THREE.Mesh(placer(cyl(3, 4, 12, 'x'), f2.x + 9.8, y, z), zinc));
  return g;
}

/* Câbles des appareils électriques et cordon d'alimentation du bloc de prises (station C) */
export function cablesStation(f, mat) {
  const g = new THREE.Group();
  const cable = (pts, couleur, r) => {
    const courbe = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    g.add(new THREE.Mesh(new THREE.TubeGeometry(courbe, 120, r || 3, 8, false), mat.get('plastique', couleur)));
  };
  const xs = f.x, zs1 = f.z + 40, zs2 = f.z + 92, yc = f.y + f.dy / 2;
  // fiches
  [[zs1, '#1c1d1f'], [zs2, '#f1f0ec']].forEach(([z, c]) => {
    g.add(new THREE.Mesh(placer(new RoundedBoxGeometry(26, 30, 34, 2, 6), xs - 14, yc, z), mat.get('plastique', c)));
  });
  cable([[740, 452, 840], [742, 468, 818], [760, 515, 812], [900, 538, 812], [1200, 540, 812], [1380, 540, 822], [1420, yc + 6, 860], [xs - 40, yc, zs1 - 6], [xs - 27, yc, zs1]], '#1c1d1f', 3);
  cable([[1135, 521, 840], [1140, 532, 818], [1180, 543, 812], [1350, 545, 813], [1415, 541, 880], [1430, yc + 4, zs2 - 20], [xs - 40, yc, zs2 - 4], [xs - 27, yc, zs2]], '#f1f0ec', 3);
  cable([[f.x + f.dx / 2, f.y + f.dy - 6, f.z + 2], [f.x + f.dx / 2 + 6, 548, f.z - 60], [1512, 553, 500], [1520, 556, 120], [1545, 557, 14], [1650, 556, 4], [1900, 556, 4]], '#f1f0ec', 3.6);
  return g;
}
