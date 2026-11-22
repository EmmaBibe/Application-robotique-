// Scène 3D du simulateur « Dans la tête de VIGIE » : une maquette (le monde réel, en matière)
// sur laquelle sont projetées, en lumière, les pensées des deux robots.
// Repère : le banc utilise (x, y) dans une arène de 20 x 20 m ; ici X = x - 10, Z = -(y - 10), Y vers le haut.
// Toutes les tailles sont celles du banc : robot de 0,30 m de rayon, personnes de 0,35 m, zone d'arrivée de 0,50 m.

import * as THREE from '../../vendor/three/three.module.min.js';
import { collisionProb } from '../vigie6/risk.js';

export const R_ROB = 0.3;
const VAR_RATE = 0.3 ** 2 * 0.2;                 // variance de position par seconde, comme DRA-MPPI et VIGIE 6
export const TK = 0.65;                          // vue espace-temps : hauteur par seconde (m)
const toX = x => x - 10, toZ = y => -(y - 10);

export const PAL = {
  dark: { bg: 0x0b1220, fog: 0x0b1220, plate: 0x2a3a5c, plateEdge: 0x16223a, grid: 'rgba(170,195,240,0.16)', grid5: 'rgba(180,205,250,0.32)', concrete: 0xa7afbd, text: '#e7edf8', robot: 0xf2f5fa, shadow: 0.45 },
  light: { bg: 0xeef1f7, fog: 0xeef1f7, plate: 0xfbfbfc, plateEdge: 0xdfe3ec, grid: 'rgba(60,80,120,0.10)', grid5: 'rgba(60,80,120,0.20)', concrete: 0xb7b0a4, text: '#15203a', robot: 0xffffff, shadow: 0.28 },
};
export const COL = {
  vigie: 0x35d0ba, dra: 0xffb547, A: 0x35d0ba, B: 0x2aa7ff, C: 0xa78bfa, st: 0xf472b6, libre: 0xdfe7f5, libreLight: 0x334466,
  danger: 0xff6b6b, phantom: 0x8fb4ff, sense: 0x2aa7ff,
};
const PEOPLE = [0xe07a5f, 0x81b29a, 0xe9c46a, 0x5b8fc7, 0xb5838d, 0x7fb7d6, 0xd4a373, 0x9aa66b, 0xc97b9a, 0x6c9a8b, 0xd98e5f, 0x8e9fc4];

// ------------------------------------------------------------------ petites fabriques
function gridTexture(pal) {
  const n = 1024, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), px = n / 20;
  g.clearRect(0, 0, n, n);
  for (let k = 0; k <= 20; k++) {
    g.strokeStyle = k % 5 === 0 ? pal.grid5 : pal.grid; g.lineWidth = k % 5 === 0 ? 2 : 1;
    g.beginPath(); g.moveTo(k * px, 0); g.lineTo(k * px, n); g.stroke();
    g.beginPath(); g.moveTo(0, k * px); g.lineTo(n, k * px); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function radialTexture() {
  const n = 128, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
  return new THREE.CanvasTexture(c);
}

function ringTexture(dashed) {
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 10;
  if (dashed) g.setLineDash([18, 14]);
  g.beginPath(); g.arc(n / 2, n / 2, n / 2 - 8, 0, Math.PI * 2); g.stroke();
  return new THREE.CanvasTexture(c);
}

/** Ruban plat (plus lisible qu'un trait d'un pixel). pts : [[x, y, h?], ...] en coordonnées du banc. */
function ribbonGeometry(pts, width, h0 = 0.03, heightOf = null) {
  const n = pts.length; if (n < 2) return null;
  const pos = new Float32Array(n * 2 * 3), idx = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    const nx = -ty * width / 2, ny = tx * width / 2, h = heightOf ? heightOf(i) : h0;
    pos.set([toX(pts[i][0] + nx), h, toZ(pts[i][1] + ny), toX(pts[i][0] - nx), h, toZ(pts[i][1] - ny)], i * 6);
    if (i < n - 1) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}

/** Tube conique incliné : la place qu'une personne peut occuper dans le futur (vue espace-temps). */
function futureTubeGeometry(x, y, vx, vy, r, tmax, steps = 12, seg = 20) {
  const pos = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = tmax * i / steps, cx = x + vx * t, cy = y + vy * t, rr = r + 2 * Math.sqrt(VAR_RATE * t);
    for (let j = 0; j < seg; j++) { const a = (j / seg) * Math.PI * 2; pos.push(toX(cx + rr * Math.cos(a)), t * TK, toZ(cy + rr * Math.sin(a))); }
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function disposeGroup(grp) {
  for (let i = grp.children.length - 1; i >= 0; i--) {
    const o = grp.children[i]; grp.remove(o);
    o.traverse(c => { if (c.geometry && !c.geometry.userData.shared) c.geometry.dispose(); if (c.material && !c.material.userData.shared) { (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose()); } });
  }
}

// ------------------------------------------------------------------ robot
function makeRobot(accent, ghost = false) {
  const g = new THREE.Group();
  const op = ghost ? { transparent: true, opacity: 0.5, depthWrite: false } : {};
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R_ROB, R_ROB, 0.2, 48), new THREE.MeshStandardMaterial({ color: 0xf3f6fb, roughness: 0.42, metalness: 0.05, ...op }));
  body.position.y = 0.16; body.castShadow = !ghost;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R_ROB + 0.004, R_ROB + 0.004, 0.035, 48, 1, true), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.55, roughness: 0.5, side: THREE.DoubleSide, ...op }));
  band.position.y = 0.2;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(R_ROB * 0.86, R_ROB * 0.9, 0.04, 48), new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.7, ...op }));
  deck.position.y = 0.28;
  const lidar = new THREE.Group(); lidar.position.y = 0.33;
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.07, 32), new THREE.MeshStandardMaterial({ color: 0x1b2233, roughness: 0.35, metalness: 0.3, ...op }));
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.06), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2, ...op }));
  lens.position.set(0.08, 0, 0); lidar.add(puck, lens);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.22), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4, ...op }));
  eye.position.set(R_ROB - 0.01, 0.17, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 28), wheelMat = new THREE.MeshStandardMaterial({ color: 0x222833, roughness: 0.85, ...op });
  const wl = new THREE.Mesh(wheelGeo, wheelMat), wr = new THREE.Mesh(wheelGeo, wheelMat);
  wl.rotation.x = Math.PI / 2; wr.rotation.x = Math.PI / 2; wl.position.set(0, 0.08, -0.225); wr.position.set(0, 0.08, 0.225);
  wl.castShadow = wr.castShadow = !ghost;
  const halo = new THREE.Mesh(new THREE.RingGeometry(R_ROB + 0.07, R_ROB + 0.16, 48), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: ghost ? 0.35 : 0.55, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.006;
  g.add(body, band, deck, lidar, eye, wl, wr, halo);
  g.userData = { lidar, wheels: [wl, wr] };
  return g;
}

// ------------------------------------------------------------------ personne (figurine)
const PERSON_GEO = { body: new THREE.CapsuleGeometry(0.17, 0.78, 6, 16), head: new THREE.SphereGeometry(0.12, 20, 14), ring: new THREE.RingGeometry(0.33, 0.35, 48) };
Object.values(PERSON_GEO).forEach(g => { g.userData.shared = true; });
// disque unité partagé : les halos et les points sont des copies mises à l'échelle (rien n'est recréé à chaque image)
const UNIT_DISC = new THREE.CircleGeometry(1, 32); UNIT_DISC.userData.shared = true;
function disc(mat, x, y, h, r) { const m = new THREE.Mesh(UNIT_DISC, mat); m.rotation.x = -Math.PI / 2; m.scale.set(r, r, 1); m.position.set(toX(x), h, toZ(y)); return m; }
function makePerson(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.62 });
  const body = new THREE.Mesh(PERSON_GEO.body, mat); body.position.y = 0.56; body.castShadow = true;
  const head = new THREE.Mesh(PERSON_GEO.head, new THREE.MeshStandardMaterial({ color: 0xf1e3d3, roughness: 0.55 })); head.position.y = 1.1; head.castShadow = true;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), head.material); nose.position.set(0.11, 1.1, 0);
  const ring = new THREE.Mesh(PERSON_GEO.ring, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012;
  g.add(body, head, nose, ring);
  g.userData = { body, head, ring, mat, phase: Math.random() * 6 };
  return g;
}

// ------------------------------------------------------------------ une arène (plateau, obstacles, personnes, robot, pensées)
class Arena {
  constructor(scene, pal, offsetX) {
    this.root = new THREE.Group(); this.root.position.x = offsetX; scene.add(this.root);
    this.pal = pal; this.people = []; this.ghosts = [];
    this.thought = new THREE.Group(); this.root.add(this.thought);
    this.tex = { grid: gridTexture(pal), radial: radialTexture(), ring: ringTexture(false), dashed: ringTexture(true) };
    // plateau
    const plate = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.24, 20.6), [
      new THREE.MeshStandardMaterial({ color: pal.plateEdge, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: pal.plateEdge, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: pal.plate, roughness: 0.92 }), new THREE.MeshStandardMaterial({ color: pal.plateEdge, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: pal.plateEdge, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: pal.plateEdge, roughness: 0.9 })]);
    plate.position.y = -0.12; plate.receiveShadow = true; this.root.add(plate);
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ map: this.tex.grid, transparent: true, depthWrite: false }));
    grid.rotation.x = -Math.PI / 2; grid.position.y = 0.002; this.root.add(grid);
    this.plate = plate; this.grid = grid;
    // carte du danger
    this.heatData = new Uint8Array(100 * 100 * 4);
    this.heatTex = new THREE.DataTexture(this.heatData, 100, 100, THREE.RGBAFormat); this.heatTex.magFilter = THREE.LinearFilter; this.heatTex.minFilter = THREE.LinearFilter; this.heatTex.colorSpace = THREE.SRGBColorSpace;
    this.heat = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ map: this.heatTex, transparent: true, depthWrite: false }));
    this.heat.rotation.x = -Math.PI / 2; this.heat.position.y = 0.006; this.heat.visible = false; this.root.add(this.heat);
    // départ et arrivée
    this.goal = new THREE.Group(); this.root.add(this.goal);
    this.trail = { vigie: null, dra: null };
    this.robots = {};
  }
  setWorld(info) {
    disposeGroup(this.goal); this.goal.position.set(toX(info.goal[0]), 0, toZ(info.goal[1]));
    const zone = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshBasicMaterial({ color: COL.vigie, transparent: true, opacity: 0.16, depthWrite: false }));
    zone.rotation.x = -Math.PI / 2; zone.position.y = 0.004;
    const edge = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.5, 64), new THREE.MeshBasicMaterial({ color: COL.vigie, transparent: true, opacity: 0.7, depthWrite: false }));
    edge.rotation.x = -Math.PI / 2; edge.position.y = 0.005;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 10), new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.4, metalness: 0.4 }));
    pole.position.y = 0.75; pole.castShadow = true;
    const flagShape = new THREE.Shape(); flagShape.moveTo(0, 0); flagShape.lineTo(0.42, -0.13); flagShape.lineTo(0, -0.26);
    const flag = new THREE.Mesh(new THREE.ShapeGeometry(flagShape), new THREE.MeshStandardMaterial({ color: COL.vigie, emissive: COL.vigie, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
    flag.position.set(0, 1.48, 0);
    this.goal.add(zone, edge, pole, flag); this.flag = flag;
    // obstacles fixes : des poteaux de béton
    if (this.obst) { this.root.remove(this.obst); this.obst.geometry.dispose(); }
    const geo = new THREE.CylinderGeometry(1, 1, 1, 40);
    this.obst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: this.pal.concrete, roughness: 0.88 }), info.static.length);
    const m = new THREE.Matrix4();
    info.static.forEach(([x, y, r], i) => { const h = 0.9 + (r > 0.6 ? 0.25 : 0); m.makeScale(r, h, r); m.setPosition(toX(x), h / 2, toZ(y)); this.obst.setMatrixAt(i, m); });
    this.obst.castShadow = true; this.obst.receiveShadow = true; this.root.add(this.obst);
    // personnes
    this.people.forEach(p => this.root.remove(p)); this.people = [];
    for (let j = 0; j < info.nPeople; j++) { const p = makePerson(PEOPLE[j % PEOPLE.length]); p.userData.id = 1000 + j; this.root.add(p); this.people.push(p); }
  }
  addRobot(key, accent, ghost) {
    if (this.robots[key]) this.root.remove(this.robots[key]);
    const r = makeRobot(accent, ghost); this.root.add(r); this.robots[key] = r; return r;
  }
  setTrail(key, pts, color) {
    if (this.trail[key]) { this.root.remove(this.trail[key]); this.trail[key].geometry.dispose(); }
    const g = ribbonGeometry(pts, 0.05, 0.008); if (!g) { this.trail[key] = null; return; }
    this.trail[key] = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false }));
    this.root.add(this.trail[key]);
  }
}

// ------------------------------------------------------------------ la scène complète
export class Stage {
  constructor(container, { theme = 'dark', lowPower = false } = {}) {
    this.container = container; this.theme = theme; this.pal = PAL[theme]; this.lowPower = lowPower;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = theme === 'dark' ? 1.05 : 1.0;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.pal.bg);
    this.scene.fog = new THREE.Fog(this.pal.fog, 34, 80);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    // lumière : ciel doux et soleil rasant pour des ombres lisibles
    const hemi = new THREE.HemisphereLight(theme === 'dark' ? 0xc8d8ff : 0xffffff, theme === 'dark' ? 0x26304a : 0xc9ccd6, theme === 'dark' ? 1.35 : 1.35);
    const sun = new THREE.DirectionalLight(0xfff3e0, theme === 'dark' ? 2.1 : 2.0);
    sun.position.set(-9, 16, 8); sun.castShadow = true;
    const S = lowPower ? 1024 : 2048; sun.shadow.mapSize.set(S, S);
    Object.assign(sun.shadow.camera, { left: -16, right: 40, top: 16, bottom: -16, near: 1, far: 60 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
    sun.target.position.set(6, 0, 0); this.scene.add(sun.target);
    this.scene.add(hemi, sun); this.sun = sun;
    // sol au loin (la table)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: this.pal.bg, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.245; floor.receiveShadow = true; this.scene.add(floor);
    this.arenas = [new Arena(this.scene, this.pal, 0), new Arena(this.scene, this.pal, 23)];
    this.arenas[1].root.visible = false;
    this.spaceTime = new THREE.Group(); this.scene.add(this.spaceTime);
    this.tex = this.arenas[0].tex;
    this.mats = {};
    this.layers = {};
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    this.cam = { target: new THREE.Vector3(1, 0, 0), radius: 25, theta: -0.62, phi: 0.95, goal: null, follow: false };
    this.applyCamera();
    this.resize(); this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container);
  }
  resize() {
    const r = this.container.getBoundingClientRect(), w = Math.max(10, r.width), h = Math.max(10, r.height);
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.w = w; this.h = h;
  }
  dispose() { this.ro.disconnect(); this.renderer.dispose(); this.renderer.domElement.remove(); }

  // -------------------------------------------------------------- caméra
  applyCamera() {
    const c = this.cam, sp = new THREE.Vector3().setFromSphericalCoords(c.radius, c.phi, c.theta);
    this.camera.position.copy(c.target).add(sp); this.camera.lookAt(c.target);
  }
  /** Distance de caméra pour qu'une largeur donnée tienne à l'écran, quelle que soit sa forme. */
  fitRadius(width, phi) {
    const vf = this.camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * this.camera.aspect);
    return (width / 2) / Math.tan(Math.min(vf, hf) / 2) * (0.82 + 0.25 * Math.sin(phi));
  }
  setView(mode, robotPos) {
    const split = this.arenas[1].root.visible;
    const cx = split ? 11.5 : 0;
    const views = {
      maquette: { target: [cx + 0.5, 0, split ? 2 : 0.6], radius: Math.max(split ? 46 : 25, this.fitRadius(split ? 46 : 21, 0.92)), theta: split ? -0.32 : -0.55, phi: split ? 0.86 : 0.92 },
      plan: { target: [cx, 0, 0], radius: Math.max(split ? 44 : 29, this.fitRadius(split ? 44 : 21.5, 0.03)), theta: 0, phi: 0.03 },
      espace: { target: [robotPos ? robotPos.x : 0, 1.6, robotPos ? robotPos.z : 0], radius: 15, theta: -0.95, phi: 1.12 },
      suivre: null,
    };
    this.cam.follow = mode === 'suivre';
    if (views[mode]) { const v = views[mode]; this.cam.goal = { target: new THREE.Vector3(...v.target), radius: v.radius, theta: v.theta, phi: v.phi }; }
  }
  stepCamera(dt, robotObj) {
    const c = this.cam, k = 1 - Math.pow(0.0025, dt);
    if (c.follow && robotObj) {
      const p = robotObj.getWorldPosition(new THREE.Vector3()), heading = robotObj.rotation.y;
      // caméra derrière le robot, dans l'axe : direction avant (cos h, 0, -sin h), donc θ = h - π/2
      c.goal = { target: new THREE.Vector3(p.x + 2.2 * Math.cos(heading), 0.4, p.z - 2.2 * Math.sin(heading)), radius: 9.5, theta: heading - Math.PI / 2, phi: 1.02 };
    }
    if (c.goal) {
      c.target.lerp(c.goal.target, k); c.radius += (c.goal.radius - c.radius) * k; c.phi += (c.goal.phi - c.phi) * k;
      let d = c.goal.theta - c.theta; d = Math.atan2(Math.sin(d), Math.cos(d)); c.theta += d * k;
      if (!c.follow && Math.abs(c.goal.radius - c.radius) < 0.01 && c.target.distanceTo(c.goal.target) < 0.01 && Math.abs(d) < 0.001) c.goal = null;
    }
    this.applyCamera();
  }
  orbit(dx, dy) { const c = this.cam; c.goal = null; c.follow = false; c.theta -= dx * 0.006; c.phi = Math.min(1.45, Math.max(0.03, c.phi - dy * 0.005)); }
  zoom(f) { const c = this.cam; c.goal = null; c.radius = Math.min(70, Math.max(4, c.radius * f)); }
  pan(dx, dy) {
    const c = this.cam; c.goal = null; c.follow = false;
    const s = c.radius * 0.0016, right = new THREE.Vector3(Math.cos(c.theta), 0, -Math.sin(c.theta)), fwd = new THREE.Vector3(Math.sin(c.theta), 0, Math.cos(c.theta));
    c.target.addScaledVector(right, -dx * s).addScaledVector(fwd, -dy * s);
  }

  // -------------------------------------------------------------- monde
  setWorld(info, split) {
    this.info = info;
    this.arenas.forEach(a => a.setWorld(info));
    this.arenas[0].addRobot('vigie', COL.vigie, false);
    this.arenas[0].addRobot('dra', COL.dra, true);
    this.arenas[1].addRobot('dra', COL.dra, false);
    this.setSplit(split);
  }
  setSplit(split) {
    this.split = split;
    this.arenas[1].root.visible = split;
    this.scene.fog.near = split ? 60 : 34; this.scene.fog.far = split ? 150 : 80;
    this.arenas[0].robots.dra.visible = !split && this.showDra !== false;
  }
  /** Pose des robots et des personnes à un instant (interpolé entre deux images). */
  pose(fa, fb, a, opts) {
    const L = (p, q) => p + (q - p) * a, ang = (p, q) => { let d = q - p; d = Math.atan2(Math.sin(d), Math.cos(d)); return p + d * a; };
    const putRobot = (obj, ra, rb) => {
      if (!obj) return;
      obj.position.set(toX(L(ra.s[0], rb.s[0])), 0, toZ(L(ra.s[1], rb.s[1]))); obj.rotation.y = ang(ra.s[2], rb.s[2]);
      const v = L(ra.v, rb.v); obj.userData.lidar.rotation.y += 0.25;
      obj.userData.wheels.forEach(wh => { wh.rotation.y -= v * 0.35; });
    };
    putRobot(this.arenas[0].robots.vigie, fa.vigie, fb.vigie);
    putRobot(this.arenas[0].robots.dra, fa.dra, fb.dra);
    putRobot(this.arenas[1].robots.dra, fa.dra, fb.dra);
    const putPeople = (arena, pa, pb) => {
      if (!pa || !pb) return;
      arena.people.forEach((g, j) => {
        const A = pa[j], B = pb[j]; if (!A || !B) return;
        const jump = Math.hypot(B[0] - A[0], B[1] - A[1]) > 1.5;       // réapparition (flux, porte) : pas d'interpolation
        const x = jump ? B[0] : L(A[0], B[0]), y = jump ? B[1] : L(A[1], B[1]);
        const inside = x > -0.6 && x < 20.6 && y > -0.6 && y < 20.6;
        g.visible = inside; if (!inside) return;
        g.position.set(toX(x), 0, toZ(y));
        const vx = L(A[2], B[2]), vy = L(A[3], B[3]), sp = Math.hypot(vx, vy);
        if (sp > 0.05) g.rotation.y = Math.atan2(vy, vx);
        const ph = (g.userData.phase += sp * 0.16);
        g.userData.body.position.y = 0.56 + Math.abs(Math.sin(ph)) * 0.035 * Math.min(1, sp);
        g.userData.body.rotation.z = Math.sin(ph) * 0.05 * Math.min(1, sp);
      });
    };
    putPeople(this.arenas[0], fa.people, fb.people);
    if (this.split) putPeople(this.arenas[1], fa.people2 || fa.people, fb.people2 || fb.people);
    this.flagWave = (this.flagWave || 0) + 0.05;
    this.arenas.forEach(ar => { if (ar.flag) ar.flag.rotation.y = Math.sin(this.flagWave) * 0.25; });
  }
  setTrails(frames, upto) {
    const pv = [], pd = [];
    for (let i = 0; i <= upto && i < frames.length; i++) { pv.push(frames[i].vigie.s); pd.push(frames[i].dra.s); }
    this.arenas[0].setTrail('vigie', pv, COL.vigie);
    if (this.split) { this.arenas[0].setTrail('dra', [], COL.dra); this.arenas[1].setTrail('dra', pd, COL.dra); }
    else { this.arenas[0].setTrail('dra', this.showDra === false ? [] : pd, COL.dra); this.arenas[1].setTrail('dra', [], COL.dra); }
  }

  // -------------------------------------------------------------- pensées (projections de lumière)
  mat(key, color, opacity, extra = {}) {
    const k = `${key}|${color}|${opacity}`;
    if (!this.mats[k]) { this.mats[k] = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, ...extra }); this.mats[k].userData.shared = true; }
    return this.mats[k];
  }
  ribbon(grp, pts, width, color, opacity, h = 0.03, heightOf = null) {
    const g = ribbonGeometry(pts, width, h, heightOf); if (!g) return null;
    const m = new THREE.Mesh(g, this.mat('rib', color, opacity)); m.renderOrder = 3; grp.add(m); return m;
  }
  /** Dessine ce que pense chaque robot pour l'image f. opts : calques visibles, option survolée, etc. */
  drawThoughts(f, opts) {
    const A0 = this.arenas[0], A1 = this.arenas[1];
    disposeGroup(A0.thought); disposeGroup(A1.thought); disposeGroup(this.spaceTime);
    this.spaceTime.visible = !!opts.spaceTime;
    A0.people.forEach(p => { p.userData.ring.material.opacity = 0; });
    const vb = f.vigie.brain, db = f.dra.brain, L = opts.layers;
    const light = this.theme === 'light';
    // personnes vues, mémorisées, cachées
    if (vb && !vb.empty && L.voit) this.drawPerception(A0, f, vb, opts);
    // ce qu'il imagine : futurs des personnes
    if (vb && !vb.empty && L.imagine) this.drawFutures(A0, vb, opts);
    // carte du danger
    A0.heat.visible = !!(L.danger && vb && !vb.empty);
    if (A0.heat.visible) this.paintHeat(A0, vb.obs, opts.heatT || 1.0);
    // options de VIGIE
    if (vb && !vb.empty && L.options) {
      const names = opts.names || [];
      vb.cands.forEach((c, i) => {
        const col = c.type === 'libre' ? (light ? COL.libreLight : COL.libre) : c.type === 'espace-temps' ? COL.st : [COL.A, COL.B, COL.C][Math.min(2, names[i] ? names[i].k : i)];
        const chosen = i === vb.chosen, hot = opts.hover === i;
        const op = chosen || hot ? 0.95 : opts.hover != null ? 0.12 : 0.38;
        if (c.guide && c.type === 'route') this.ribbon(A0.thought, c.guide, 0.07, col, op * 0.6, 0.012);
        if (c.guide && c.type === 'espace-temps') this.dotted(A0.thought, c.guide, col, op * 0.85);
        this.ribbon(A0.thought, c.plan, chosen ? 0.16 : 0.09, col, op, chosen ? 0.04 : 0.03);
        const end = c.plan[c.plan.length - 1];
        A0.thought.add(disc(this.mat('dot', col, op), end[0], end[1], 0.045, chosen ? 0.12 : 0.08));
      });
      if (L.essais && vb.fan) this.drawFan(A0.thought, vb.fan, light ? 0x22304a : 0xffffff);
    }
    // vitesse prudente aux angles morts
    if (vb && vb.cap && vb.cap.active && L.voit) this.drawPhantoms(A0, vb.cap);
    // la référence
    if (db && opts.showDra) {
      const arena = this.split ? A1 : A0;
      this.ribbon(arena.thought, db.plan, 0.13, COL.dra, this.split ? 0.9 : 0.75, 0.035);
      if (L.essais && this.split) this.drawFan(arena.thought, db.fan, COL.dra);
      if (this.split && L.imagine) this.drawFutures(A1, db, opts);
    }
    if (opts.spaceTime && vb && !vb.empty) this.drawSpaceTime(f, vb, opts);
  }
  dotted(grp, pts, color, opacity) {
    for (let i = 0; i < pts.length; i += 2) grp.add(disc(this.mat('st', color, opacity), pts[i][0], pts[i][1], 0.02, 0.05));
  }
  drawFan(grp, fan, color) {
    const pos = [], col = [];
    const c = new THREE.Color(color), bg = new THREE.Color(this.pal.bg);
    fan.forEach(f => {
      const k = 0.15 + 0.85 * (1 - f.rank), cc = bg.clone().lerp(c, k * 0.9);
      for (let i = 0; i < f.pts.length - 1; i++) { pos.push(toX(f.pts[i][0]), 0.05, toZ(f.pts[i][1]), toX(f.pts[i + 1][0]), 0.05, toZ(f.pts[i + 1][1])); col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })); m.renderOrder = 2; grp.add(m);
  }
  drawPerception(A, f, vb, opts) {
    const seen = new Set(f.vigie.seen), robot = f.vigie.s;
    // portée des capteurs (perception limitée)
    if (this.info.sense) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(this.info.sense - 0.03, this.info.sense, 96), this.mat('sense', COL.sense, 0.5)); ring.rotation.x = -Math.PI / 2; ring.position.set(toX(robot[0]), 0.01, toZ(robot[1])); A.thought.add(ring);
      A.thought.add(disc(this.mat('senseD', COL.sense, 0.045), robot[0], robot[1], 0.01, this.info.sense));
    }
    const known = new Map(vb.obs.map((o, m) => [o[5], { o, u: vb.u[m] }]));
    A.people.forEach(p => {
      const id = p.userData.id, ring = p.userData.ring;
      if (!p.visible) return;
      if (seen.has(id)) { ring.material.color.setHex(COL.sense); ring.material.opacity = 0.75; }
      else if (known.has(id)) { ring.material.color.setHex(0xffb547); ring.material.opacity = 0.55; }
      else { ring.material.color.setHex(0x8792a8); ring.material.opacity = 0.25; }
    });
    // personnes mémorisées : là où VIGIE croit qu'elles sont (pistes prolongées)
    vb.obs.forEach(o => {
      if (seen.has(o[5])) return;
      const ring = new THREE.Mesh(PERSON_GEO.ring, this.mat('mem', 0xffb547, 0.85)); ring.rotation.x = -Math.PI / 2; ring.position.set(toX(o[0]), 0.014, toZ(o[1])); A.thought.add(ring);
      const ghost = new THREE.Mesh(PERSON_GEO.body, this.mat('memB', 0xffb547, 0.18)); ghost.position.set(toX(o[0]), 0.56, toZ(o[1])); A.thought.add(ghost);
    });
  }
  drawFutures(A, brain, opts) {
    const steps = [0.5, 1.0, 1.5, 2.0, 2.5];
    brain.obs.forEach((o, m) => {
      const u = Math.round(Math.min(1, brain.u ? brain.u[m] : 0) * 10) / 10;   // 11 nuances : le cache de matériaux reste borné
      const col = new THREE.Color().setHSL((1 - Math.min(1, u)) * 0.33, 0.65, 0.55).getHex();
      steps.forEach((t, k) => {
        const x = o[0] + o[2] * t, y = o[1] + o[3] * t, s = Math.sqrt(VAR_RATE * t), R = o[4] + 2 * s;
        A.thought.add(disc(this.mat('fut', col, 0.2 * (1 - k / 6)), x, y, 0.008 + k * 0.001, R));
      });
      const end = [o[0] + o[2] * 2.5, o[1] + o[3] * 2.5];
      this.ribbon(A.thought, [[o[0], o[1]], end], 0.03, col, 0.45, 0.01);
      // anneau d'imprévisibilité sur la personne elle-même
      const p = A.people.find(q => q.userData.id === o[5]);
      if (p && p.visible && !(opts.layers && opts.layers.voit)) { p.userData.ring.material.color.setHex(col); p.userData.ring.material.opacity = 0.7; }
    });
  }
  drawPhantoms(A, cap) {
    cap.ph.forEach(p => {
      const g = new THREE.Mesh(PERSON_GEO.body, this.mat('ph', COL.phantom, 0.22)); g.position.set(toX(p[0]), 0.56, toZ(p[1])); A.thought.add(g);
      const head = new THREE.Mesh(PERSON_GEO.head, this.mat('phh', COL.phantom, 0.22)); head.position.set(toX(p[0]), 1.1, toZ(p[1])); A.thought.add(head);
      this.ribbon(A.thought, [[p[0], p[1]], [p[0] + p[2] * 0.8, p[1] + p[3] * 0.8]], 0.05, COL.phantom, 0.6, 0.02);
    });
  }
  paintHeat(A, obs, tq) {
    const d = A.heatData, s = Math.sqrt(VAR_RATE * tq);
    const mu = obs.map(o => [o[0] + o[2] * tq, o[1] + o[3] * tq, o[4] + R_ROB]);
    for (let j = 0; j < 100; j++) for (let i = 0; i < 100; i++) {
      const x = (i + 0.5) * 0.2, y = (j + 0.5) * 0.2; let keep = 1;
      for (const [mx, my, rr] of mu) { const dd = Math.hypot(x - mx, y - my); if (dd - rr > 9 * s) continue; keep *= 1 - collisionProb(dd, rr, s); }
      const p = 1 - keep, k = (j * 100 + i) * 4;
      // du transparent à l'ambre puis au rouge
      const a = Math.min(1, p * 1.6);
      d[k] = 255; d[k + 1] = Math.round(181 - 74 * Math.min(1, p * 1.3)); d[k + 2] = Math.round(71 + 36 * Math.min(1, p)); d[k + 3] = Math.round(a * 200);
    }
    A.heatTex.needsUpdate = true;
  }
  drawSpaceTime(f, vb, opts) {
    const g = this.spaceTime, tmax = 4.0, light = this.theme === 'light';
    vb.obs.forEach(o => {
      const tube = new THREE.Mesh(futureTubeGeometry(o[0], o[1], o[2], o[3], o[4], tmax), new THREE.MeshStandardMaterial({ color: 0xff8a6b, transparent: true, opacity: 0.22, roughness: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      g.add(tube);
    });
    // options de VIGIE dans (x, y, t)
    const names = opts.names || [];
    vb.cands.forEach((c, i) => {
      const col = c.type === 'libre' ? (light ? COL.libreLight : COL.libre) : c.type === 'espace-temps' ? COL.st : [COL.A, COL.B, COL.C][Math.min(2, names[i] ? names[i].k : i)];
      const chosen = i === vb.chosen;
      this.ribbon(g, c.plan, chosen ? 0.12 : 0.07, col, chosen ? 1 : 0.45, 0, k => (k + 1) * 0.1 * TK);
      if (c.type === 'espace-temps' && c.guide) {
        const pts = c.guide.slice(0, Math.round(tmax / 0.1));
        this.ribbon(g, pts, 0.05, COL.st, 0.7, 0, k => (k + 1) * 0.1 * TK);
      }
    });
    // axe du temps
    const r = f.vigie.s;
    for (let t = 0; t <= tmax; t += 1) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.37, 40), this.mat('tax', light ? 0x334466 : 0xcfd8ea, 0.6)); ring.rotation.x = -Math.PI / 2; ring.position.set(toX(r[0]), t * TK, toZ(r[1])); g.add(ring);
    }
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, tmax * TK, 8), this.mat('ax', light ? 0x334466 : 0xcfd8ea, 0.6)); axis.position.set(toX(r[0]), tmax * TK / 2, toZ(r[1])); g.add(axis);
  }

  /** Projette un point du banc (x, y, h) à l'écran. */
  project(x, y, h = 0, arena = 0) {
    const v = new THREE.Vector3(toX(x) + (arena ? 23 : 0), h, toZ(y)).project(this.camera);
    return { x: (v.x + 1) / 2 * this.w, y: (1 - v.y) / 2 * this.h, visible: v.z < 1 && v.z > -1 };
  }
  /** Personne sous le doigt ou la souris (identifiant) ou null. */
  pick(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objs = this.arenas[0].people.filter(p => p.visible).map(p => p.userData.body);
    const hit = this.raycaster.intersectObjects(objs, false)[0];
    if (!hit) return null;
    return this.arenas[0].people.find(p => p.userData.body === hit.object).userData.id;
  }
  render() { this.renderer.render(this.scene, this.camera); }
}
