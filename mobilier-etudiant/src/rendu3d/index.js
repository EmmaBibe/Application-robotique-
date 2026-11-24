/*
 * Rendu 3D réaliste (WebGL, three.js) : matières physiques, textures photographiques,
 * éclairage d'ambiance, ombres portées et occlusion ambiante.
 * Interface volontairement proche de l'ancien moteur logiciel (objets, visibilité, teinte, décalage).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { MATIERES } from './matieres.js';
import { construirePiece, bornes } from './pieces.js';

const MM = 0.001;   // la scène est construite en millimètres puis ramenée en mètres

function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (e) { return false; }
}

function coucheDe(p) {
  if (p.cat === 'tube' || p.cat === 'rond') return 'structure';
  if (p.cat === 'plat' || p.cat === 'quinc') return 'quinc';
  if (p.cat === 'panneau') return 'bois';
  if (p.cat === 'tole') return 'toles';
  if (p.cat === 'rideau') return 'rideaux';
  return 'equip';
}

/* ---------- Construction d'une scène ---------- */
function construireScene(MODELE, code, mat) {
  const racine = new THREE.Group();
  racine.scale.setScalar(MM);
  const objets = [];
  const K = code === 'K';
  const cfg = K ? MODELE.IMPLANTATION : MODELE.MEUBLES[code];
  const comps = K ? cfg.composants : [{ m: code, dx: 0, dy: 0, dz: 0 }];
  comps.forEach(c => {
    const m = MODELE.MEUBLES[c.m];
    const gm = new THREE.Group();
    gm.position.set(c.dx, c.dy, c.dz);
    racine.add(gm);
    m.parts.forEach(p => {
      if (!p.formes || !p.formes.length) return;
      const piece = construirePiece(p, m, mat);
      if (!piece) return;
      const g = new THREE.Group();     // enveloppe : sa position sert au décalage (animation, éclaté)
      g.add(piece);
      const o = { part: p, meuble: m, couche: coucheDe(p), groupe: g, visible: true, teinte: null, decal: [0, 0, 0], pick: true };
      g.traverse(n => { if (n.isMesh) { n.userData.idx = objets.length; n.castShadow = p.cat !== 'rideau' || true; n.receiveShadow = true; n.userData.matBase = n.material; } });
      gm.add(g);
      objets.push(o);
    });
  });
  // emprise
  const b = new THREE.Box3().setFromObject(racine);
  const bmm = [b.min.x / MM, b.min.y / MM, b.min.z / MM, b.max.x / MM, b.max.y / MM, b.max.z / MM];
  let x0, x1, y0, y1;
  if (cfg.sol) { x0 = cfg.sol.x0; x1 = cfg.sol.x1; y0 = cfg.sol.y0; y1 = cfg.sol.y1; }
  else { x0 = bmm[0] - 500; x1 = bmm[3] + 500; y0 = bmm[1] - 400; y1 = cfg.murY; }
  const z0m = cfg.murZ0 !== undefined ? cfg.murZ0 : 0, zh = cfg.murH;
  const decor = new THREE.Group();
  if (cfg.sol) {
    const gs = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
    uvMonde(gs, x1 - x0, y1 - y0, 900);
    const sol = new THREE.Mesh(gs, mat.get('carrelage'));
    sol.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    sol.receiveShadow = true;
    decor.add(sol);
    // plinthe
    const pl = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 12, 70), mat.get('plinthe'));
    pl.position.set((x0 + x1) / 2, cfg.murY - 6, 35);
    pl.receiveShadow = true; pl.castShadow = true;
    decor.add(pl);
  }
  const gw = new THREE.PlaneGeometry(x1 - x0, zh - z0m);
  uvMonde(gw, x1 - x0, zh - z0m, 1400);
  const mur = new THREE.Mesh(gw, mat.get('enduit'));
  mur.rotation.x = Math.PI / 2;           // plan XZ, normale vers -y
  mur.position.set((x0 + x1) / 2, cfg.murY, (z0m + zh) / 2);
  mur.receiveShadow = true;
  decor.add(mur);
  decor.traverse(n => { if (n.isMesh) n.userData.idx = -2; });
  racine.add(decor);
  objets.push({ part: null, couche: 'mur', groupe: decor, visible: true, teinte: null, decal: [0, 0, 0], pick: false });
  return { racine, objets, cfg };
}

function uvMonde(g, w, h, tuile) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tuile, uv.getY(i) * h / tuile);
}

/* ---------- Visionneuse ---------- */
function Visionneuse(conteneur, options) {
  options = options || {};
  this.conteneur = conteneur;
  this.MODELE = options.modele;
  const rendu = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!options.capture, alpha: false });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.pixelRatioMax || 2));
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 1.05;
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = THREE.PCFSoftShadowMap;
  this.rendu = rendu;
  if (conteneur) {
    rendu.domElement.style.position = 'absolute';
    rendu.domElement.style.inset = '0';
    rendu.domElement.style.width = '100%';
    rendu.domElement.style.height = '100%';
    conteneur.insertBefore(rendu.domElement, conteneur.firstChild);
  }
  this.scene = new THREE.Scene();
  this.fond = new THREE.Color('#f3f1ec');
  this.scene.background = this.fond;
  const pmrem = new THREE.PMREMGenerator(rendu);
  this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  this.scene.environmentIntensity = 0.75;
  // lumières
  this.hemi = new THREE.HemisphereLight(0xfff6ea, 0xb8b2a8, 0.35);
  this.scene.add(this.hemi);
  this.soleil = new THREE.DirectionalLight(0xfff3e2, 2.3);
  this.soleil.castShadow = true;
  this.soleil.shadow.mapSize.set(options.ombre || 2048, options.ombre || 2048);
  this.soleil.shadow.bias = -0.0009;
  this.soleil.shadow.normalBias = 0.02;
  this.soleil.shadow.radius = 3;
  this.scene.add(this.soleil);
  this.scene.add(this.soleil.target);
  // caméras
  this.camP = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  this.camP.up.set(0, 0, 1);
  this.camO = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
  this.camO.up.set(0, 0, 1);
  this.cam = this.camP;
  this.mat = MATIERES(THREE, () => this.demander(), options.textures || window.TEXTURES_3D || {});
  this.objets = [];
  this.sale = true;
  this.qualite = options.qualite || 'haute';
  this.cible = new THREE.Vector3();
  if (conteneur && !options.capture) {
    this.controles = new OrbitControls(this.camP, rendu.domElement);
    this.controles.enableDamping = true;
    this.controles.dampingFactor = 0.12;
    this.controles.screenSpacePanning = true;
    this.controles.addEventListener('change', () => this.demander());
  }
  this._composer();
  this.ray = new THREE.Raycaster();
}

Visionneuse.prototype._composer = function () {
  if (this.qualite !== 'haute') { this.composer = null; return; }
  const cible = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  this.composer = new EffectComposer(this.rendu, cible);
  this.passeRendu = new RenderPass(this.scene, this.cam);
  this.composer.addPass(this.passeRendu);
  this.gtao = new GTAOPass(this.scene, this.cam, 1, 1);
  this.gtao.output = GTAOPass.OUTPUT.Default;
  this.gtao.blendIntensity = 0.85;
  this.gtao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.6, thickness: 1.2, scale: 1, samples: 12 });
  this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  this.composer.addPass(this.gtao);
  this.composer.addPass(new OutputPass());
};

Visionneuse.prototype.definirQualite = function (q) {
  this.qualite = q;
  this._composer();
  this.redimensionner(true);
  this.demander();
};

Visionneuse.prototype.demander = function () { this.sale = true; };

Visionneuse.prototype.charger = function (code) {
  if (this.racine) {
    this.scene.remove(this.racine);
    this.racine.traverse(n => { if (n.isMesh) n.geometry.dispose(); });
  }
  const s = construireScene(this.MODELE, code, this.mat);
  this.racine = s.racine;
  this.objets = s.objets;
  this.scene.add(this.racine);
  this._variantes = new Map();
  this.demander();
  return this.objets;
};

Visionneuse.prototype.fondCouleur = function (c) { this.fond.set(c); this.demander(); };

Visionneuse.prototype._variante = function (m, t) {
  const cle = m.uuid + t.join(',');
  let v = this._variantes.get(cle);
  if (!v) {
    v = m.clone();
    if (v.emissive) { v.emissive = new THREE.Color(t[0] / 255, t[1] / 255, t[2] / 255); v.emissiveIntensity = t[3] * 0.9; }
    if (v.map && t[3] > 0) v.color = v.color.clone().lerp(new THREE.Color(t[0] / 255, t[1] / 255, t[2] / 255), t[3] * 0.6);
    this._variantes.set(cle, v);
  }
  return v;
};

/* Applique visibilité, teinte et décalage des objets */
Visionneuse.prototype.synchroniser = function () {
  this.objets.forEach(o => {
    const g = o.groupe;
    g.visible = o.visible;
    g.position.set(o.decal[0], o.decal[1], o.decal[2]);
    const cle = o.teinte ? o.teinte.join(',') : '';
    if (g.userData.teinte !== cle) {
      g.userData.teinte = cle;
      g.traverse(n => {
        if (!n.isMesh) return;
        if (!n.userData.matBase) n.userData.matBase = n.material;
        const base = n.userData.matBase;
        if (!o.teinte) n.material = base;
        else n.material = Array.isArray(base) ? base.map(m => this._variante(m, o.teinte)) : this._variante(base, o.teinte);
      });
    }
  });
  this.demander();
};

Visionneuse.prototype.bornes = function () {
  const b = new THREE.Box3();
  this.objets.forEach(o => { if (o.couche !== 'mur' && o.visible) b.expandByObject(o.groupe); });
  return b;
};

/* Positionne la caméra (lacet / tangage, comme l'ancien moteur) et cadre la scène */
Visionneuse.prototype.vue = function (lacet, tangage, perspective, marge) {
  const b = this.bornes();
  if (b.isEmpty()) return;
  const c = b.getCenter(new THREE.Vector3());
  const r = b.getSize(new THREE.Vector3()).length() / 2;
  const dir = new THREE.Vector3(Math.cos(tangage) * Math.sin(lacet), -Math.cos(tangage) * Math.cos(lacet), Math.sin(tangage));
  const w = this.largeur || 800, h = this.hauteur || 600;
  const asp = w / h;
  const fov = this.camP.fov * Math.PI / 180;
  const d = r * (marge || 1.05) / Math.tan(fov / 2) / Math.min(1, asp);
  this.cam = perspective ? this.camP : this.camO;
  this.cam.position.copy(c).addScaledVector(dir, d);
  if (Math.abs(tangage) > 1.5) this.cam.up.set(0, 1, 0); else this.cam.up.set(0, 0, 1);
  this.cam.lookAt(c);
  if (!perspective) {
    const hh = r * (marge || 1.05) / Math.min(1, asp);
    this.camO.left = -hh * asp; this.camO.right = hh * asp; this.camO.top = hh; this.camO.bottom = -hh;
    this.camO.zoom = 1;
    this.camO.updateProjectionMatrix();
  }
  this.cible.copy(c);
  this._installerControles();
  this._placerSoleil(b);
  this.demander();
};

Visionneuse.prototype._installerControles = function () {
  if (!this.controles) return;
  if (this.controles.object !== this.cam) {
    this.controles.dispose();
    this.controles = new OrbitControls(this.cam, this.rendu.domElement);
    this.controles.enableDamping = true;
    this.controles.dampingFactor = 0.12;
    this.controles.screenSpacePanning = true;
    this.controles.addEventListener('change', () => this.demander());
  }
  this.controles.target.copy(this.cible);
  this.controles.update();
  if (this.passeRendu) { this.passeRendu.camera = this.cam; this.gtao.camera = this.cam; }
};

Visionneuse.prototype._placerSoleil = function (b) {
  const c = b.getCenter(new THREE.Vector3());
  const r = Math.max(1, b.getSize(new THREE.Vector3()).length());
  this.soleil.position.set(c.x - 0.45 * r, c.y - 1.1 * r, c.z + 1.6 * r);
  this.soleil.target.position.copy(c);
  const sc = this.soleil.shadow.camera;
  sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 0.1; sc.far = 4 * r;
  sc.updateProjectionMatrix();
};

Visionneuse.prototype.redimensionner = function (force) {
  const w = this.conteneur ? this.conteneur.clientWidth : this.largeur, h = this.conteneur ? this.conteneur.clientHeight : this.hauteur;
  if (!force && w === this.largeur && h === this.hauteur) return;
  this.largeur = w; this.hauteur = h;
  this.rendu.setSize(w, h, false);
  this.camP.aspect = w / h; this.camP.updateProjectionMatrix();
  const asp = w / h, hh = (this.camO.top - this.camO.bottom) / 2;
  this.camO.left = -hh * asp; this.camO.right = hh * asp; this.camO.updateProjectionMatrix();
  if (this.composer) {
    const pr = this.rendu.getPixelRatio();
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
  }
  this.demander();
};

Visionneuse.prototype.image = function () {
  if (this.composer) this.composer.render(); else this.rendu.render(this.scene, this.cam);
};

/* À appeler à chaque image d'animation ; renvoie vrai si un rendu a eu lieu */
Visionneuse.prototype.tic = function () {
  this.redimensionner();
  if (this.controles && this.controles.update()) this.sale = true;
  if (!this.sale) return false;
  this.sale = false;
  this.image();
  return true;
};

Visionneuse.prototype.choisir = function (x, y) {
  const v = new THREE.Vector2((x / this.largeur) * 2 - 1, -(y / this.hauteur) * 2 + 1);
  this.ray.setFromCamera(v, this.cam);
  const cibles = [];
  this.objets.forEach(o => { if (o.visible && o.pick) o.groupe.traverse(n => { if (n.isMesh) cibles.push(n); }); });
  const t = this.ray.intersectObjects(cibles, false);
  for (const i of t) { if (i.object.visible && i.object.userData.idx >= 0) return i.object.userData.idx; }
  return -1;
};

/* Projection écran d'un point en mm (repère du modèle) */
Visionneuse.prototype.projeteur = function (k) {
  const cam = this.cam, w = this.largeur * k, h = this.hauteur * k;
  const v = new THREE.Vector3();
  const persp = cam.isPerspectiveCamera;
  return {
    persp,
    p(x, y, z) {
      v.set(x * MM, y * MM, z * MM);
      const dz = v.clone().applyMatrix4(cam.matrixWorldInverse).z;
      v.project(cam);
      return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h, 0, persp ? -dz * 1000 : 1000];
    }
  };
};

/* Rendu hors écran pour les documents */
function Capture(MODELE, textures) {
  const div = null;
  this.v = new Visionneuse(div, { modele: MODELE, capture: true, textures, pixelRatioMax: 1, qualite: 'haute', ombre: 2048 });
  this.code = null;
}
Capture.prototype.image = function (code, opts) {
  opts = opts || {};
  const v = this.v;
  if (this.code !== code) { v.charger(code); this.code = code; }
  v.largeur = opts.W || 1200; v.hauteur = opts.H || 820;
  v.rendu.setPixelRatio(1);
  v.rendu.setSize(v.largeur, v.hauteur, false);
  v.camP.aspect = v.largeur / v.hauteur; v.camP.updateProjectionMatrix();
  if (v.composer) { v.composer.setPixelRatio(1); v.composer.setSize(v.largeur, v.hauteur); }
  v.fondCouleur(opts.fond || '#ffffff');
  const m = MODELE_REF.M.MEUBLES[code];
  // cadrage sur le meuble complet pour que toutes les étapes aient le même point de vue
  v.objets.forEach(o => { o.visible = true; o.teinte = null; o.decal = [0, 0, 0]; if (o.part && o.part.variante === 'ouvert') o.visible = false; });
  v.synchroniser();
  v.vue(opts.lacet !== undefined ? opts.lacet : -0.62, opts.tangage !== undefined ? opts.tangage : 0.36, true, opts.marge || 1.0);
  v.objets.forEach(o => {
    if (!o.part) { o.visible = opts.mur !== false; return; }
    const p = o.part;
    let vis = true;
    if (opts.etape !== undefined && p.etape > opts.etape) vis = false;
    if (p.variante === 'ouvert' && !opts.rideauxOuverts) vis = false;
    if (p.variante === 'ferme' && opts.rideauxOuverts) vis = false;
    if (opts.sans && opts.sans.indexOf(o.couche) >= 0) vis = false;
    o.visible = vis;
    o.teinte = (opts.etape !== undefined && p.etape === opts.etape) ? [217, 104, 43, 0.55] : null;
    o.decal = (opts.eclate && m) ? [(p.module || 0) * opts.eclate, 0, 0] : [0, 0, 0];
  });
  v.synchroniser();
  v.image();
  return v.rendu.domElement.toDataURL('image/jpeg', 0.9);
};
const MODELE_REF = { M: null };

window.RENDU3D = {
  disponible: webglDisponible,
  creer(conteneur, options) { return new Visionneuse(conteneur, options); },
  capture(MODELE, textures) { MODELE_REF.M = MODELE; return new Capture(MODELE, textures); },
  pret() { return MATIERES.pret(); },
  bornes
};
