import { frame, canvas, theme, text, segmented, slider, checkbox, onTheme, note } from '../core/kit.js';

// Vision : une image n'est qu'un tableau de nombres. On lui applique des noyaux de convolution
// (flou, contours de Sobel, netteté) puis un seuillage, comme dans un vrai pipeline.
export default function vision(root, opts = {}) {
  const f = frame(root, { title: opts.title || 'Vision par ordinateur : convolution', tag: 'Vision', height: 380 });
  const N = 64;
  let kernel = 'sobel', thr = 0, showGrid = false, scene = 'pieces';
  const K = {
    id: { m: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], d: 1, name: 'Identité' },
    blur: { m: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], d: 16, name: 'Flou gaussien' },
    sharp: { m: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], d: 1, name: 'Netteté' },
    sobelx: { m: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], d: 1, name: 'Sobel X (bords verticaux)' },
    sobel: { m: null, d: 1, name: 'Sobel (amplitude du gradient)' },
    lap: { m: [[0, 1, 0], [1, -4, 1], [0, 1, 0]], d: 1, name: 'Laplacien' },
  };
  segmented(f.ctrl, { label: 'Image', value: scene, options: [{ label: 'Pièces', value: 'pieces' }, { label: 'Ligne au sol', value: 'line' }, { label: 'Bruitée', value: 'noise' }], onChange: v => { scene = v; makeImg(); draw(); } });
  segmented(f.ctrl, { label: 'Noyau', value: kernel, options: Object.entries(K).map(([k, v]) => ({ label: v.name.split(' (')[0], value: k })), onChange: v => { kernel = v; draw(); } });
  slider(f.ctrl, { label: 'Seuil (0 = désactivé)', min: 0, max: 255, step: 1, value: thr, onInput: v => { thr = v; draw(); } });
  checkbox(f.ctrl, { label: 'Afficher les valeurs des pixels (zoom)', value: showGrid, onChange: v => { showGrid = v; draw(); } });
  const kbox = document.createElement('div');
  kbox.className = 'readout';
  kbox.style.display = 'block';
  f.ctrl.appendChild(kbox);
  note(f.ctrl, 'Le noyau 3×3 glisse sur chaque pixel : on multiplie les 9 voisins par les coefficients et on additionne. Les réseaux de neurones convolutifs apprennent eux-mêmes des milliers de noyaux comme ceux-ci.');

  let img;
  function makeImg() {
    img = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = 40;
      if (scene === 'pieces') {
        if (Math.hypot(x - 20, y - 22) < 11) v = 210;
        if (x > 36 && x < 56 && y > 10 && y < 30) v = 150;
        if (Math.abs((x - 14) - (y - 40)) < 6 && y > 38 && y < 58 && x < 40) v = 120;
        if (Math.hypot(x - 46, y - 46) < 9) v = 240;
      } else if (scene === 'line') {
        v = 200 - 10 * Math.sin(x * 0.4) * Math.cos(y * 0.3);
        const cx = 32 + 14 * Math.sin(y / 12);
        if (Math.abs(x - cx) < 4) v = 25;
      } else {
        if (Math.hypot(x - 32, y - 32) < 16) v = 190;
        v += 50 * (Math.random() - 0.5) * 2;
      }
      img[y * N + x] = Math.max(0, Math.min(255, v));
    }
  }
  makeImg();

  function apply() {
    const out = new Float32Array(N * N);
    const at = (x, y) => img[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
    const conv = (m, d, x, y) => { let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += m[j + 1][i + 1] * at(x + i, y + j); return s / d; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v;
      if (kernel === 'sobel') {
        const gx = conv(K.sobelx.m, 1, x, y);
        const gy = conv([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], 1, x, y);
        v = Math.hypot(gx, gy) / 4;
      } else {
        v = conv(K[kernel].m, K[kernel].d, x, y);
        if (kernel === 'sobelx' || kernel === 'lap') v = Math.abs(v) / (kernel === 'lap' ? 2 : 4);
      }
      v = Math.max(0, Math.min(255, v));
      if (thr > 0) v = v >= thr ? 255 : 0;
      out[y * N + x] = v;
    }
    return out;
  }

  const cv = canvas(f.stage, () => draw());
  function blit(ctx, data, x0, y0, size) {
    const id = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { const v = data[i]; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = N;
    tmp.getContext('2d').putImageData(id, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, x0, y0, size, size);
  }
  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const out = apply();
    const size = Math.min((W - 50) / 2, H - 50);
    const x1 = (W - 2 * size - 20) / 2, y0 = 30;
    blit(ctx, img, x1, y0, size);
    blit(ctx, out, x1 + size + 20, y0, size);
    text(ctx, 'Image d\'entrée (64 × 64 pixels)', x1, y0 - 10, { color: th.muted, size: 11 });
    text(ctx, `Sortie : ${K[kernel].name}${thr ? ' + seuil' : ''}`, x1 + size + 20, y0 - 10, { color: th.muted, size: 11 });
    if (showGrid) {
      const z = 8, cell = size / z;
      ctx.fillStyle = th.bg + 'dd'; ctx.fillRect(x1, y0, size, size);
      for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) {
        const v = img[(16 + j) * N + 12 + i];
        ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x1 + i * cell + 1, y0 + j * cell + 1, cell - 2, cell - 2);
        text(ctx, Math.round(v), x1 + i * cell + cell / 2, y0 + j * cell + cell / 2 + 4, { color: v > 128 ? '#000' : '#fff', size: Math.max(8, cell * 0.28), align: 'center', font: th.mono });
      }
      text(ctx, 'zoom sur un coin de l\'image : chaque case est un nombre de 0 (noir) à 255 (blanc)', x1, y0 + size + 16, { color: th.muted, size: 10 });
    }
    const m = kernel === 'sobel' ? [['√(Gx² + Gy²)']] : K[kernel].m;
    kbox.innerHTML = `<div style="color:var(--muted);font-size:.82rem;margin-bottom:.3rem">Noyau appliqué ${K[kernel].d > 1 ? `(÷ ${K[kernel].d})` : ''}</div>` +
      `<table style="width:100%;text-align:center;font-family:var(--mono)">${m.map(r => `<tr>${r.map(c => `<td style="padding:.15rem;color:${typeof c === 'number' && c < 0 ? 'var(--danger)' : c > 0 ? 'var(--accent)' : 'var(--muted)'}">${c}</td>`).join('')}</tr>`).join('')}</table>`;
  }
  const offT = onTheme(draw);
  draw();
  return () => { offT(); cv.destroy(); };
}
