/*
 * Moteur de rendu 3D logiciel (aucune bibliothèque externe).
 * Rastérisation par lignes de balayage avec tampon de profondeur, tampon d'identifiants
 * (sélection au clic) et détection d'arêtes en post-traitement.
 */
(function (root) {
  'use strict';

  function hexRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ---------- Maillage ---------- */
  // Chaque triangle : 9 coordonnées, normale (3), indice de face (pour les arêtes)
  function maillageForme(f, out, faceBase) {
    let face = faceBase;
    const tri = (a, b, c, n, fid) => { out.push({ v: [a, b, c], n, f: fid }); };
    const quad = (a, b, c, d, n, fid) => { tri(a, b, c, n, fid); tri(a, c, d, n, fid); };
    if (f.t === 'box') {
      const x0 = f.x, y0 = f.y, z0 = f.z, x1 = f.x + f.dx, y1 = f.y + f.dy, z1 = f.z + f.dz;
      const P = (x, y, z) => [x, y, z];
      quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1), [0, -1, 0], face++); // avant
      quad(P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), [0, 1, 0], face++);  // arrière
      quad(P(x0, y1, z0), P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), [-1, 0, 0], face++); // gauche
      quad(P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1), [1, 0, 0], face++);  // droite
      quad(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), [0, 0, 1], face++);  // dessus
      quad(P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0), P(x0, y0, z0), [0, 0, -1], face++); // dessous
    } else if (f.t === 'cyl' || f.t === 'anneau') {
      const n = f.n || 20;
      const r2 = f.t === 'cyl' ? f.r : f.r2, r1 = f.t === 'anneau' ? f.r1 : 0;
      // repère local : axe w, base u,v
      const map = (u, v, w) => {
        if (f.ax === 'z') return [f.x + u, f.y + v, f.z + w];
        if (f.ax === 'x') return [f.x + w, f.y + u, f.z + v];
        return [f.x + u, f.y + w, f.z + v];      // axe y
      };
      const nmap = (u, v, w) => {
        if (f.ax === 'z') return [u, v, w];
        if (f.ax === 'x') return [w, u, v];
        return [u, w, v];
      };
      // pour l'axe y, l'orientation (u,w,v) inverse le sens : on corrige l'ordre
      const inv = f.ax === 'y';
      const T = (a, b, c, nn, fid) => inv ? tri(a, c, b, nn, fid) : tri(a, b, c, nn, fid);
      const Q = (a, b, c, d, nn, fid) => { T(a, b, c, nn, fid); T(a, c, d, nn, fid); };
      const fCote = face++, fHaut = face++, fBas = face++, fInt = face++;
      for (let k = 0; k < n; k++) {
        const t0 = k / n * Math.PI * 2, t1 = (k + 1) / n * Math.PI * 2;
        const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const cm = Math.cos((t0 + t1) / 2), sm = Math.sin((t0 + t1) / 2);
        Q(map(r2 * c0, r2 * s0, 0), map(r2 * c1, r2 * s1, 0), map(r2 * c1, r2 * s1, f.h), map(r2 * c0, r2 * s0, f.h), nmap(cm, sm, 0), fCote);
        if (r1 > 0) {
          Q(map(r1 * c1, r1 * s1, 0), map(r1 * c0, r1 * s0, 0), map(r1 * c0, r1 * s0, f.h), map(r1 * c1, r1 * s1, f.h), nmap(-cm, -sm, 0), fInt);
          Q(map(r1 * c0, r1 * s0, f.h), map(r2 * c0, r2 * s0, f.h), map(r2 * c1, r2 * s1, f.h), map(r1 * c1, r1 * s1, f.h), nmap(0, 0, 1), fHaut);
          Q(map(r1 * c1, r1 * s1, 0), map(r2 * c1, r2 * s1, 0), map(r2 * c0, r2 * s0, 0), map(r1 * c0, r1 * s0, 0), nmap(0, 0, -1), fBas);
        } else {
          T(map(0, 0, f.h), map(r2 * c0, r2 * s0, f.h), map(r2 * c1, r2 * s1, f.h), nmap(0, 0, 1), fHaut);
          T(map(0, 0, 0), map(r2 * c1, r2 * s1, 0), map(r2 * c0, r2 * s0, 0), nmap(0, 0, -1), fBas);
        }
      }
    }
    return face;
  }

  /* ---------- Scène ---------- */
  function Scene() {
    this.objets = [];      // {part, tris, rgb, alpha, pick, decal:[dx,dy,dz], visible, teinte}
    this.nbFaces = 0;
  }
  Scene.prototype.ajouter = function (o) {
    const tris = [];
    (o.formes || []).forEach(f => { this.nbFaces = maillageForme(f, tris, this.nbFaces); });
    o.tris = tris;
    o.rgb = hexRgb(o.couleur || '#888888');
    if (o.alpha === undefined) o.alpha = 1;
    if (o.visible === undefined) o.visible = true;
    o.decal = o.decal || [0, 0, 0];
    this.objets.push(o);
    return o;
  };
  Scene.prototype.bornes = function (filtre) {
    const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    this.objets.forEach(o => {
      if (filtre && !filtre(o)) return;
      o.tris.forEach(t => t.v.forEach(p => {
        for (let i = 0; i < 3; i++) {
          const v = p[i] + o.decal[i];
          if (v < b[i]) b[i] = v;
          if (v > b[i + 3]) b[i + 3] = v;
        }
      }));
    });
    return b;
  };

  /* ---------- Caméra ---------- */
  function Camera() {
    this.cible = [0, 0, 0];
    this.lacet = -0.65;     // rotation autour de z (0 = vue de face)
    this.tangage = 0.42;    // élévation
    this.distance = 4000;
    this.focale = 0.48;     // tan(fov/2)
    this.perspective = true;
  }
  Camera.prototype.repere = function () {
    const cp = Math.cos(this.tangage), sp = Math.sin(this.tangage), cl = Math.cos(this.lacet), sl = Math.sin(this.lacet);
    const dir = [cp * sl, -cp * cl, sp];                       // de la cible vers l'œil
    const oeil = [this.cible[0] + dir[0] * this.distance, this.cible[1] + dir[1] * this.distance, this.cible[2] + dir[2] * this.distance];
    const av = [-dir[0], -dir[1], -dir[2]];
    let dr = [av[1] * 1 - av[2] * 0, av[2] * 0 - av[0] * 1, 0];  // av × z
    const ld = Math.hypot(dr[0], dr[1], dr[2]) || 1;
    dr = [dr[0] / ld, dr[1] / ld, dr[2] / ld];
    const ht = [dr[1] * av[2] - dr[2] * av[1], dr[2] * av[0] - dr[0] * av[2], dr[0] * av[1] - dr[1] * av[0]];
    return { oeil, av, dr, ht, dir };
  };

  /* ---------- Rendu ---------- */
  function Rendu(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.fond = [246, 245, 241];
    this.lumiere = 0.62;
  }
  Rendu.prototype.dimension = function (W, H) {
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    this.canvas.width = W; this.canvas.height = H;
    this.img = this.ctx.createImageData(W, H);
    this.buf32 = new Uint32Array(this.img.data.buffer);
    this.z = new Float32Array(W * H);
    this.fid = new Int32Array(W * H);
    this.pid = new Int32Array(W * H);
    this.ombre = new Uint8Array(W * H);
  };

  Rendu.prototype.projeteur = function (cam) {
    const R = cam.repere(), W = this.W, H = this.H;
    const F = (H / 2) / cam.focale;
    const ech = F / cam.distance;
    const cx = W / 2, cy = H / 2;
    const persp = cam.perspective;
    return {
      R, F, ech, persp,
      p(x, y, z) {
        const qx = x - R.oeil[0], qy = y - R.oeil[1], qz = z - R.oeil[2];
        const X = qx * R.dr[0] + qy * R.dr[1] + qz * R.dr[2];
        const Y = qx * R.ht[0] + qy * R.ht[1] + qz * R.ht[2];
        const Z = qx * R.av[0] + qy * R.av[1] + qz * R.av[2];
        if (persp) return [cx + F * X / Z, cy - F * Y / Z, 1 / Z, Z];
        return [cx + X * ech, cy - Y * ech, -Z, Z];
      }
    };
  };

  Rendu.prototype.dessiner = function (scene, cam, opts) {
    opts = opts || {};
    const W = this.W, H = this.H, z = this.z, fid = this.fid, pid = this.pid, buf = this.buf32;
    const fond = opts.fond || this.fond;
    const fondPix = (255 << 24) | (fond[2] << 16) | (fond[1] << 8) | fond[0];
    buf.fill(fondPix);
    z.fill(-Infinity);
    fid.fill(-1);
    pid.fill(-1);
    const pr = this.projeteur(cam);
    const R = pr.R;
    // lumière liée à la caméra (en haut à gauche, légèrement devant)
    const L = [
      -R.av[0] * 0.55 + R.ht[0] * 0.65 - R.dr[0] * 0.35,
      -R.av[1] * 0.55 + R.ht[1] * 0.65 - R.dr[1] * 0.35,
      -R.av[2] * 0.55 + R.ht[2] * 0.65 - R.dr[2] * 0.35
    ];
    const lL = Math.hypot(L[0], L[1], L[2]); L[0] /= lL; L[1] /= lL; L[2] /= lL;
    const transparents = [];
    const self = this;

    function rasterTri(a, b, c, couleur, f, p, alpha) {
      // tri par y
      let t;
      if (b[1] < a[1]) { t = a; a = b; b = t; }
      if (c[1] < a[1]) { t = a; a = c; c = t; }
      if (c[1] < b[1]) { t = b; b = c; c = t; }
      const x0 = a[0], y0 = a[1], d0 = a[2], x1 = b[0], y1 = b[1], d1 = b[2], x2 = c[0], y2 = c[1], d2 = c[2];
      if (y2 - y0 < 1e-6) return;
      const yS = Math.max(0, Math.ceil(y0 - 0.5)), yE = Math.min(H - 1, Math.ceil(y2 - 0.5) - 1);
      const r = couleur & 255, g = (couleur >> 8) & 255, bl = (couleur >> 16) & 255;
      for (let y = yS; y <= yE; y++) {
        const py = y + 0.5;
        const tl = (py - y0) / (y2 - y0);
        let xa = x0 + (x2 - x0) * tl, da = d0 + (d2 - d0) * tl, xb, db;
        if (py < y1) { const u = (py - y0) / (y1 - y0); xb = x0 + (x1 - x0) * u; db = d0 + (d1 - d0) * u; }
        else { const u = (py - y1) / (y2 - y1); xb = x1 + (x2 - x1) * u; db = d1 + (d2 - d1) * u; }
        if (xa > xb) { t = xa; xa = xb; xb = t; t = da; da = db; db = t; }
        const xs = Math.max(0, Math.ceil(xa - 0.5)), xe = Math.min(W - 1, Math.ceil(xb - 0.5) - 1);
        if (xe < xs) continue;
        const dd = (db - da) / ((xb - xa) || 1e-9);
        let d = da + (xs + 0.5 - xa) * dd;
        let i = y * W + xs;
        if (alpha >= 1) {
          for (let x = xs; x <= xe; x++, i++, d += dd) {
            if (d > z[i]) { z[i] = d; buf[i] = couleur; fid[i] = f; pid[i] = p; }
          }
        } else {
          const ia = 1 - alpha;
          for (let x = xs; x <= xe; x++, i++, d += dd) {
            if (d > z[i]) {
              const o = buf[i];
              const nr = (r * alpha + (o & 255) * ia) | 0, ng = (g * alpha + ((o >> 8) & 255) * ia) | 0, nb = (bl * alpha + ((o >> 16) & 255) * ia) | 0;
              buf[i] = (255 << 24) | (nb << 16) | (ng << 8) | nr;
              if (p >= 0) pid[i] = p;
            }
          }
        }
      }
    }

    const near = 20;
    for (let oi = 0; oi < scene.objets.length; oi++) {
      const o = scene.objets[oi];
      if (!o.visible) continue;
      const dx = o.decal[0], dy = o.decal[1], dz = o.decal[2];
      let rgb = o.rgb;
      if (o.teinte) {
        const tt = o.teinte, k = tt[3];
        rgb = [rgb[0] * (1 - k) + tt[0] * k, rgb[1] * (1 - k) + tt[1] * k, rgb[2] * (1 - k) + tt[2] * k];
      }
      const alpha = o.alpha;
      const pickId = o.pick === false ? -2 : oi;
      for (let ti = 0; ti < o.tris.length; ti++) {
        const T = o.tris[ti];
        const n = T.n;
        // élimination des faces arrière
        const v0 = T.v[0];
        const ex = v0[0] + dx - R.oeil[0], ey = v0[1] + dy - R.oeil[1], ez = v0[2] + dz - R.oeil[2];
        let vis;
        if (pr.persp) vis = ex * n[0] + ey * n[1] + ez * n[2] < 0;
        else vis = R.av[0] * n[0] + R.av[1] * n[1] + R.av[2] * n[2] < 0;
        if (!vis) continue;
        const A = pr.p(v0[0] + dx, v0[1] + dy, v0[2] + dz);
        const B = pr.p(T.v[1][0] + dx, T.v[1][1] + dy, T.v[1][2] + dz);
        const C = pr.p(T.v[2][0] + dx, T.v[2][1] + dy, T.v[2][2] + dz);
        if (pr.persp && (A[3] < near || B[3] < near || C[3] < near)) continue;
        let lum = n[0] * L[0] + n[1] * L[1] + n[2] * L[2];
        lum = lum > 0 ? 0.66 + 0.42 * lum : 0.66 + 0.2 * lum;
        if (o.pick === false) lum = 0.9 + 0.1 * lum;
        // légère différenciation des faces selon l'axe, pour la lisibilité
        if (n[2] > 0.5) lum += 0.06;
        lum = Math.min(1.12, lum);
        const cr = Math.min(255, rgb[0] * lum) | 0, cg = Math.min(255, rgb[1] * lum) | 0, cb = Math.min(255, rgb[2] * lum) | 0;
        const col = (255 << 24) | (cb << 16) | (cg << 8) | cr;
        if (alpha < 1) { transparents.push([A, B, C, col, T.f, pickId, alpha]); continue; }
        rasterTri(A, B, C, col, T.f, pickId, 1);
      }
    }
    // arêtes
    const fort = opts.aretes === undefined ? 0.42 : opts.aretes;
    if (fort > 0) {
      for (let y = 0; y < H - 1; y++) {
        let i = y * W;
        for (let x = 0; x < W - 1; x++, i++) {
          const f = fid[i];
          const fr = fid[i + 1], fb = fid[i + W];
          if (f !== fr || f !== fb) {
            // l'arête est dessinée sur le pixel le plus proche
            let j = i;
            if (f !== fr && z[i + 1] > z[j]) j = i + 1;
            if (f !== fb && z[i + W] > z[j]) j = i + W;
            if (fid[j] < 0) continue;
            const k = pid[j] === -2 ? 0.93 : fort;
            const o = buf[j];
            buf[j] = (255 << 24) | ((((o >> 16) & 255) * k | 0) << 16) | ((((o >> 8) & 255) * k | 0) << 8) | (((o & 255) * k) | 0);
          }
        }
      }
    }
    // transparents, du plus loin au plus proche
    transparents.sort((u, v) => (u[0][3] + u[1][3] + u[2][3]) < (v[0][3] + v[1][3] + v[2][3]) ? 1 : -1);
    transparents.forEach(t => rasterTri(t[0], t[1], t[2], t[3], t[4], t[5], t[6]));
    this.ctx.putImageData(this.img, 0, 0);
    this.dernierProjeteur = pr;
    return pr;
  };

  Rendu.prototype.objetA = function (x, y) {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return -1;
    return this.pid[(y | 0) * this.W + (x | 0)];
  };

  const MOTEUR = { Scene, Camera, Rendu, hexRgb };
  root.MOTEUR = MOTEUR;
})(typeof window !== 'undefined' ? window : globalThis);
