/* Ampère Académie — mini moteur 3D WebGL (sans dépendance, fonctionne hors ligne).
 * Maillages : pavé, cylindre, tube entre deux points. Éclairage Blinn-Phong + hémisphère, émission,
 * transparence, hiérarchie de nœuds, caméra orbitale (souris et tactile), sélection par couleur d'identifiant. */
(function () {
  'use strict';
  const M = {
    id: () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / a; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; },
    look(e, c, u) {
      let z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x);
      const o = M.id();
      o[0] = x[0]; o[4] = x[1]; o[8] = x[2]; o[1] = y[0]; o[5] = y[1]; o[9] = y[2]; o[2] = z[0]; o[6] = z[1]; o[10] = z[2];
      o[12] = -dot(x, e); o[13] = -dot(y, e); o[14] = -dot(z, e); return o;
    },
    trs(t, r, s) {
      const [x, y, z] = r || [0, 0, 0], cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
      const k = s || 1, o = M.id();
      // R = Ry * Rx * Rz
      o[0] = (cy * cz + sy * sx * sz) * k; o[1] = (cx * sz) * k; o[2] = (-sy * cz + cy * sx * sz) * k;
      o[4] = (-cy * sz + sy * sx * cz) * k; o[5] = (cx * cz) * k; o[6] = (sy * sz + cy * sx * cz) * k;
      o[8] = (sy * cx) * k; o[9] = (-sx) * k; o[10] = (cy * cx) * k;
      o[12] = t[0]; o[13] = t[1]; o[14] = t[2]; return o;
    },
    xform(m, p) { const x = p[0], y = p[1], z = p[2], w = m[3] * x + m[7] * y + m[11] * z + m[15]; return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w]; }
  };
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  /* ---------- Géométries (sommets, normales) ---------- */
  const G = {
    box(w, h, d) {
      const x = w / 2, y = h / 2, z = d / 2, P = [], N = [];
      const f = (a, b, c, e, n) => { [a, b, c, a, c, e].forEach(v => { P.push(...v); N.push(...n); }); };
      f([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], [0, 0, 1]);
      f([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], [0, 0, -1]);
      f([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], [0, 1, 0]);
      f([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], [0, -1, 0]);
      f([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], [1, 0, 0]);
      f([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], [-1, 0, 0]);
      return { P, N };
    },
    cyl(r, h, seg, r2) {
      seg = seg || 24; r2 = r2 == null ? r : r2;
      const P = [], N = [], y = h / 2;
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * 2 * Math.PI, a1 = (i + 1) / seg * 2 * Math.PI;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const q = [[r2 * c0, -y, r2 * s0], [r2 * c1, -y, r2 * s1], [r * c1, y, r * s1], [r * c0, y, r * s0]];
        [0, 1, 2, 0, 2, 3].forEach(k => { P.push(...q[k]); const c = k === 1 || k === 2 ? [c1, s1] : [c0, s0]; N.push(c[0], 0, c[1]); });
        P.push(0, y, 0, r * c1, y, r * s1, r * c0, y, r * s0); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
        P.push(0, -y, 0, r2 * c0, -y, r2 * s0, r2 * c1, -y, r2 * s1); N.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
      }
      return { P, N };
    }
  };

  const VS = `attribute vec3 aP; attribute vec3 aN; uniform mat4 uVP, uM; varying vec3 vN, vW;
    void main(){ vec4 w = uM * vec4(aP,1.0); vW = w.xyz; vN = mat3(uM) * aN; gl_Position = uVP * w; }`;
  const FS = `precision mediump float; varying vec3 vN, vW; uniform vec3 uC, uE, uEye, uSky, uGround, uK, uKd, uF, uFd; uniform float uA, uSh;
    void main(){ vec3 n = normalize(vN); vec3 v = normalize(uEye - vW);
      if (dot(n, v) < 0.0) n = -n;
      vec3 amb = mix(uGround, uSky, n.y * 0.5 + 0.5) * uC;
      float d1 = max(dot(n, -uKd), 0.0), d2 = max(dot(n, -uFd), 0.0);
      vec3 h = normalize(-uKd + v); float sp = pow(max(dot(n, h), 0.0), uSh) * (uSh > 1.0 ? 0.55 : 0.0);
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.18;
      vec3 c = amb + uC * (uK * d1 + uF * d2) + uK * sp + rim * uSky + uE;
      gl_FragColor = vec4(pow(c, vec3(1.0/2.2)), uA); }`;
  const FSP = `precision mediump float; uniform vec3 uId; void main(){ gl_FragColor = vec4(uId, 1.0); }`;

  function compile(gl, vs, fs) {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([t, src]) => {
      const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u, aP: gl.getAttribLocation(p, 'aP'), aN: gl.getAttribLocation(p, 'aN') };
  }
  const lin = c => c.map(x => Math.pow(x, 2.2)); // couleurs données en sRGB

  class Node {
    constructor(o) { Object.assign(this, { pos: [0, 0, 0], rot: [0, 0, 0], s: 1, color: [0.8, 0.8, 0.8], em: [0, 0, 0], alpha: 1, shine: 24, visible: true, children: [] }, o || {}); }
    add(n) { n.parent = this; this.children.push(n); return n; }
  }

  class Scene3D {
    constructor(canvas, opts) {
      this.c = canvas; this.o = opts || {};
      const gl = this.gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL indisponible');
      this.pr = compile(gl, VS, FS); this.pp = compile(gl, VS, FSP);
      this.root = new Node();
      this.meshes = new Map();
      this.cam = Object.assign({ target: [0, 0, 0], yaw: 0.5, pitch: 0.25, dist: 2, fov: 0.75, minD: 0.4, maxD: 6 }, this.o.cam || {});
      this.picks = []; this.fb = null;
      this.listeners = {};
      this.bindControls();
      this.resize();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas);
      this.alive = true;
      const loop = t => { if (!this.alive) return; if (!canvas.isConnected) { this.destroy(); return; } const dt = this.last ? Math.min(0.1, (t - this.last) / 1000) : 0; this.last = t; if (this.onFrame) this.onFrame(dt, t / 1000); this.draw(); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    destroy() { this.alive = false; this.ro.disconnect(); }
    mesh(key, geo) {
      if (this.meshes.has(key)) return this.meshes.get(key);
      const gl = this.gl, bp = gl.createBuffer(), bn = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.P), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bn); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.N), gl.STATIC_DRAW);
      const m = { bp, bn, n: geo.P.length / 3 }; this.meshes.set(key, m); return m;
    }
    box(w, h, d, o) { const k = `b${w}|${h}|${d}`; return new Node(Object.assign({ mesh: this.mesh(k, G.box(w, h, d)) }, o)); }
    cyl(r, h, o, seg, r2) { const k = `c${r}|${h}|${seg}|${r2}`; return new Node(Object.assign({ mesh: this.mesh(k, G.cyl(r, h, seg || 24, r2)) }, o)); }
    /* Tube (conducteur) entre deux points */
    tube(a, b, r, o) {
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const n = this.cyl(r, L, o, 8);
      n.pos = mid;
      // orienter l'axe Y du cylindre selon d
      const yaw = Math.atan2(d[0], d[2]), pitch = Math.acos(Math.max(-1, Math.min(1, d[1] / (L || 1))));
      n.rot = [pitch, yaw, 0];
      return n;
    }
    resize() {
      const r = this.c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
      this.c.width = this.W * dpr; this.c.height = this.H * dpr; this.dpr = dpr;
      this.fb = null;
    }
    eye() { const c = this.cam; return [c.target[0] + c.dist * Math.cos(c.pitch) * Math.sin(c.yaw), c.target[1] + c.dist * Math.sin(c.pitch), c.target[2] + c.dist * Math.cos(c.pitch) * Math.cos(c.yaw)]; }
    vp() { return M.mul(M.persp(this.cam.fov, this.W / this.H, 0.02, 40), M.look(this.eye(), this.cam.target, [0, 1, 0])); }
    walk(fn) {
      const rec = (n, parentM) => {
        if (!n.visible) return;
        const m = M.mul(parentM, M.trs(n.pos, n.rot, n.s));
        n.world = m;
        if (n.mesh) fn(n, m);
        n.children.forEach(ch => rec(ch, m));
      };
      rec(this.root, M.id());
    }
    draw() {
      const gl = this.gl, p = this.pr, u = p.u;
      gl.viewport(0, 0, this.c.width, this.c.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.useProgram(p.p);
      const VP = this.vp(), e = this.eye(), L = this.o.light || {};
      gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uEye, e);
      gl.uniform3fv(u.uSky, L.sky || [0.42, 0.45, 0.52]); gl.uniform3fv(u.uGround, L.ground || [0.12, 0.1, 0.09]);
      gl.uniform3fv(u.uK, L.key || [1.05, 1.0, 0.92]); gl.uniform3fv(u.uKd, norm(L.keyDir || [-0.5, -0.8, -0.6]));
      gl.uniform3fv(u.uF, L.fill || [0.25, 0.3, 0.4]); gl.uniform3fv(u.uFd, norm(L.fillDir || [0.7, -0.2, -0.4]));
      const trans = [];
      gl.enableVertexAttribArray(p.aP); gl.enableVertexAttribArray(p.aN);
      const draw1 = (n, m) => {
        gl.uniformMatrix4fv(u.uM, false, m);
        gl.uniform3fv(u.uC, lin(n.color)); gl.uniform3fv(u.uE, lin(n.em)); gl.uniform1f(u.uA, n.alpha); gl.uniform1f(u.uSh, n.shine);
        gl.bindBuffer(gl.ARRAY_BUFFER, n.mesh.bp); gl.vertexAttribPointer(p.aP, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, n.mesh.bn); gl.vertexAttribPointer(p.aN, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, n.mesh.n);
      };
      gl.disable(gl.BLEND);
      this.walk((n, m) => { if (n.alpha < 1) trans.push([n, m]); else draw1(n, m); });
      if (trans.length) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); trans.forEach(([n, m]) => draw1(n, m)); gl.depthMask(true); gl.disable(gl.BLEND); }
    }
    /* Sélection : rendu des identifiants hors écran puis lecture du pixel */
    pick(x, y) {
      const gl = this.gl, p = this.pp;
      const w = this.c.width, h = this.c.height;
      if (!this.fb) {
        this.fb = gl.createFramebuffer(); const tex = gl.createTexture(), rb = gl.createRenderbuffer();
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.uVP, false, this.vp());
      gl.enableVertexAttribArray(p.aP);
      const ids = [];
      this.walk((n, m) => {
        if (n.alpha < 1 && !n.pick) return;
        let k = 0;
        if (n.pick) { k = ids.indexOf(n.pick); if (k < 0) { ids.push(n.pick); k = ids.length - 1; } k++; }
        gl.uniformMatrix4fv(p.u.uM, false, m);
        gl.uniform3fv(p.u.uId, [(k & 255) / 255, ((k >> 8) & 255) / 255, 0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, n.mesh.bp); gl.vertexAttribPointer(p.aP, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, n.mesh.n);
      });
      const px = new Uint8Array(4);
      gl.readPixels(Math.round(x * this.dpr), Math.round(h - y * this.dpr), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const k = px[0] + px[1] * 256;
      return k ? ids[k - 1] : null;
    }
    project(p) { const v = M.xform(this.vp(), p); return { x: (v[0] * 0.5 + 0.5) * this.W, y: (-v[1] * 0.5 + 0.5) * this.H, vis: v[2] < 1 && v[2] > -1 }; }
    on(ev, fn) { this.listeners[ev] = fn; }
    bindControls() {
      const c = this.c, ptrs = new Map();
      let drag = null, pinch = null;
      c.addEventListener('contextmenu', e => e.preventDefault());
      c.addEventListener('pointerdown', e => {
        try { c.setPointerCapture(e.pointerId); } catch (err) { /* pointeur synthétique */ }
        ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
        if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: this.cam.dist, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, t: this.cam.target.slice() }; drag = null; return; }
        const hit = this.pick(e.offsetX, e.offsetY);
        drag = { x: e.offsetX, y: e.offsetY, yaw: this.cam.yaw, pitch: this.cam.pitch, t: this.cam.target.slice(), pan: e.button === 2 || e.shiftKey, moved: false, hit };
        if (this.listeners.down && hit) this.listeners.down(hit, e);
      });
      c.addEventListener('pointermove', e => {
        if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
        if (pinch && ptrs.size === 2) {
          const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
          this.cam.dist = Math.max(this.cam.minD, Math.min(this.cam.maxD, pinch.dist * pinch.d / d));
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; this.panBy(mx - pinch.mx, my - pinch.my, pinch.t);
          return;
        }
        if (!drag) {
          if (this.listeners.hover) { const h = this.pick(e.offsetX, e.offsetY); if (h !== this._hov) { this._hov = h; this.listeners.hover(h, e); c.style.cursor = h ? 'pointer' : 'grab'; } }
          return;
        }
        const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (!drag.moved) return;
        if (drag.hit && this.listeners.holding && this.listeners.holding(drag.hit)) return;
        if (drag.pan) this.panBy(dx, dy, drag.t);
        else { this.cam.yaw = drag.yaw - dx * 0.008; this.cam.pitch = Math.max(-0.2, Math.min(1.35, drag.pitch + dy * 0.006)); }
      });
      const up = e => {
        ptrs.delete(e.pointerId);
        if (ptrs.size < 2) pinch = null;
        if (drag && this.listeners.up) this.listeners.up(drag.hit, drag.moved, e);
        drag = null;
      };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      c.addEventListener('wheel', e => { e.preventDefault(); this.cam.dist = Math.max(this.cam.minD, Math.min(this.cam.maxD, this.cam.dist * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); }, { passive: false });
    }
    panBy(dx, dy, t0) {
      const c = this.cam, k = c.dist * 0.0018;
      const right = [Math.cos(c.yaw), 0, -Math.sin(c.yaw)], upv = [-Math.sin(c.pitch) * Math.sin(c.yaw), Math.cos(c.pitch), -Math.sin(c.pitch) * Math.cos(c.yaw)];
      c.target = [t0[0] - right[0] * dx * k + upv[0] * dy * k, t0[1] + upv[1] * dy * k, t0[2] - right[2] * dx * k + upv[2] * dy * k];
    }
  }
  AA.GL = { Scene3D, Node, M };
})();
