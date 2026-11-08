// Boîte à outils partagée par tous les simulateurs : canvas haute définition,
// boucle d'animation, contrôles (curseurs, boutons), couleurs du thème.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rad = d => d * Math.PI / 180;
export const deg = r => r * 180 / Math.PI;
export const fmt = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
export const randn = () => {
  // Box-Muller : bruit gaussien centré réduit
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export function theme() {
  const cs = getComputedStyle(document.documentElement);
  const g = n => cs.getPropertyValue(n).trim();
  return {
    bg: g('--bg-2'), panel: g('--panel'), line: g('--line'), text: g('--text'), muted: g('--muted'),
    faint: g('--faint'), accent: g('--accent'), accent2: g('--accent-2'), warn: g('--warn'),
    danger: g('--danger'), ok: g('--ok'), violet: g('--violet'), pink: g('--pink'),
    mono: g('--mono') || 'monospace', font: g('--font') || 'sans-serif',
  };
}

/** Construit la carcasse d'un simulateur : titre, scène, panneau de contrôle. */
export function frame(root, { title, tag, stacked = false, height = 340, foot } = {}) {
  root.classList.add('sim');
  root.innerHTML = `
    <div class="sim-head"><h4></h4>${tag ? `<span class="tag accent"></span>` : ''}</div>
    <div class="sim-body ${stacked ? 'stacked' : ''}">
      <div class="sim-stage"></div>
      <div class="sim-ctrl"></div>
    </div>
    <div class="sim-msg" hidden></div>
    ${foot ? `<div class="sim-foot"></div>` : ''}`;
  root.querySelector('h4').textContent = title || 'Simulation';
  if (tag) root.querySelector('.sim-head .tag').textContent = tag;
  if (foot) root.querySelector('.sim-foot').innerHTML = foot;
  const stage = root.querySelector('.sim-stage');
  stage.style.minHeight = typeof height === 'number' ? `min(${height}px, 70vh)` : height;
  const msg = root.querySelector('.sim-msg');
  return {
    stage,
    ctrl: root.querySelector('.sim-ctrl'),
    message(text, ok = true) {
      if (!text) { msg.hidden = true; return; }
      msg.hidden = false;
      msg.className = 'sim-msg ' + (ok ? 'ok' : 'ko');
      msg.textContent = text;
    },
  };
}

/** Canvas qui suit la taille de son conteneur et la densité de pixels. */
export function canvas(container, onResize) {
  const c = document.createElement('canvas');
  container.appendChild(c);
  const ctx = c.getContext('2d');
  const state = { c, ctx, w: 0, h: 0, dpr: 1 };
  let ready = false; // le premier dessin attend que l'appelant ait fini de s'initialiser
  const fit = () => {
    const r = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    state.w = Math.max(10, r.width);
    state.h = Math.max(10, r.height);
    state.dpr = dpr;
    c.width = Math.round(state.w * dpr);
    c.height = Math.round(state.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ready && onResize) onResize(state);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(container);
  fit();
  queueMicrotask(() => { ready = true; if (onResize && c.isConnected) onResize(state); });
  state.destroy = () => ro.disconnect();
  /** Position du pointeur en coordonnées CSS du canvas. */
  state.pos = e => {
    const r = c.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  return state;
}

/** Boucle d'animation qui se met en pause quand le simulateur n'est pas visible. */
export function loop(el, step) {
  let raf = 0, last = 0, visible = true, alive = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 });
  io.observe(el);
  const tick = t => {
    raf = 0;
    if (!alive || !visible || !el.isConnected) { last = 0; return; }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
    last = t;
    step(dt, t / 1000);
    kick();
  };
  function kick() { if (!raf && alive) raf = requestAnimationFrame(tick); }
  kick();
  return { stop() { alive = false; cancelAnimationFrame(raf); io.disconnect(); }, kick };
}

// ---------- Contrôles ----------

export function slider(parent, { label, min, max, step = 1, value, unit = '', digits, onInput }) {
  const wrap = document.createElement('label');
  wrap.className = 'ctl';
  const d = digits ?? (String(step).split('.')[1]?.length || 0);
  wrap.innerHTML = `<span class="lab"><span></span><b></b></span><input type="range">`;
  wrap.querySelector('.lab span').textContent = label;
  const out = wrap.querySelector('b');
  const input = wrap.querySelector('input');
  Object.assign(input, { min, max, step, value });
  const show = () => { out.textContent = `${Number(input.value).toFixed(d)}${unit ? ' ' + unit : ''}`; };
  input.addEventListener('input', () => { show(); onInput && onInput(Number(input.value)); });
  show();
  parent.appendChild(wrap);
  return {
    el: wrap,
    get value() { return Number(input.value); },
    set(v, fire = false) { input.value = v; show(); if (fire && onInput) onInput(Number(input.value)); },
  };
}

export function button(parent, text, onClick, cls = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn small ' + cls;
  b.textContent = text;
  b.addEventListener('click', onClick);
  parent.appendChild(b);
  return b;
}

export function buttons(parent) {
  const d = document.createElement('div');
  d.className = 'row';
  d.style.gap = '.4rem';
  parent.appendChild(d);
  return d;
}

export function segmented(parent, { label, options, value, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'ctl';
  if (label) {
    const l = document.createElement('span');
    l.className = 'lab';
    l.textContent = label;
    wrap.appendChild(l);
  }
  const seg = document.createElement('div');
  seg.className = 'seg';
  let cur = value;
  const btns = options.map(o => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = o.label;
    b.className = o.value === cur ? 'on' : '';
    b.addEventListener('click', () => {
      cur = o.value;
      btns.forEach(x => x.classList.toggle('on', x === b));
      onChange && onChange(cur);
    });
    seg.appendChild(b);
    return b;
  });
  wrap.appendChild(seg);
  parent.appendChild(wrap);
  return { get value() { return cur; } };
}

export function checkbox(parent, { label, value, onChange }) {
  const l = document.createElement('label');
  l.className = 'check';
  l.innerHTML = `<input type="checkbox"><span></span>`;
  l.querySelector('span').textContent = label;
  const i = l.querySelector('input');
  i.checked = !!value;
  i.addEventListener('change', () => onChange && onChange(i.checked));
  parent.appendChild(l);
  return { get value() { return i.checked; }, set(v) { i.checked = v; } };
}

/** Tableau de valeurs en direct. rows: [[clé, libellé]] */
export function readout(parent, rows) {
  const d = document.createElement('div');
  d.className = 'readout';
  const cells = {};
  for (const [k, l] of rows) {
    const s = document.createElement('span');
    s.textContent = l;
    const b = document.createElement('b');
    b.textContent = '—';
    d.append(s, b);
    cells[k] = b;
  }
  parent.appendChild(d);
  return {
    set(k, v, color) {
      if (!cells[k]) return;
      cells[k].textContent = v;
      cells[k].style.color = color || '';
    },
  };
}

export function note(parent, html) {
  const p = document.createElement('div');
  p.className = 'small muted';
  p.innerHTML = html;
  parent.appendChild(p);
  return p;
}

// ---------- Dessin ----------

export function grid(ctx, w, h, step, color, ox = 0, oy = 0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = ((ox % step) + step) % step; x < w; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
  for (let y = ((oy % step) + step) % step; y < h; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
  ctx.stroke();
  ctx.restore();
}

export function arrow(ctx, x1, y1, x2, y2, color, width = 2.5, head = 10) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (len < 1) { ctx.restore(); return; }
  const hh = Math.min(head, len * .45);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * hh * .7, y2 - Math.sin(a) * hh * .7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hh * Math.cos(a - .42), y2 - hh * Math.sin(a - .42));
  ctx.lineTo(x2 - hh * Math.cos(a + .42), y2 - hh * Math.sin(a + .42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function text(ctx, str, x, y, { color, size = 12, align = 'left', base = 'alphabetic', weight = 500, font } = {}) {
  ctx.save();
  ctx.fillStyle = color || '#fff';
  ctx.font = `${weight} ${size}px ${font || 'system-ui, sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function circle(ctx, x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Trace une courbe dans un rectangle avec axes. data: [{ys, color, label}] */
export function plot(ctx, rect, series, { xmin = 0, xmax, ymin, ymax, th, xlabel, ylabel, hlines = [], vlines = [], fill = false } = {}) {
  const { x, y, w, h } = rect;
  th = th || theme();
  ctx.save();
  ctx.lineWidth = 1; ctx.lineCap = 'butt'; ctx.setLineDash([]);
  ctx.fillStyle = th.panel;
  ctx.globalAlpha = .55;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = th.line;
  ctx.strokeRect(x + .5, y + .5, w, h);
  let lo = ymin, hi = ymax;
  if (lo === undefined || hi === undefined) {
    let a = Infinity, b = -Infinity;
    for (const s of series) for (const v of s.ys) { if (isFinite(v)) { a = Math.min(a, v); b = Math.max(b, v); } }
    if (!isFinite(a)) { a = 0; b = 1; }
    if (a === b) { a -= 1; b += 1; }
    const pad = (b - a) * .1;
    lo = lo ?? a - pad; hi = hi ?? b + pad;
  }
  const n = Math.max(...series.map(s => s.ys.length), 2);
  const xm = xmax ?? n - 1;
  const X = i => x + ((i - xmin) / (xm - xmin)) * w;
  const Y = v => y + h - ((v - lo) / (hi - lo)) * h;
  // zéro
  if (lo < 0 && hi > 0) {
    ctx.strokeStyle = th.faint; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x, Y(0)); ctx.lineTo(x + w, Y(0)); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const hl of hlines) {
    ctx.strokeStyle = hl.color || th.warn; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, Y(hl.v)); ctx.lineTo(x + w, Y(hl.v)); ctx.stroke(); ctx.setLineDash([]);
    if (hl.label) text(ctx, hl.label, x + w - 4, Y(hl.v) - 4, { color: hl.color || th.warn, size: 10, align: 'right' });
  }
  for (const vl of vlines) {
    ctx.strokeStyle = vl.color || th.faint; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(vl.v), y); ctx.lineTo(X(vl.v), y + h); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (const s of series) {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.lineJoin = 'round';
    if (s.dash) ctx.setLineDash(s.dash);
    ctx.beginPath();
    let started = false;
    s.ys.forEach((v, i) => {
      if (!isFinite(v)) return;
      const xi = s.xs ? X(s.xs[i]) : X(i);
      if (!started) { ctx.moveTo(xi, Y(v)); started = true; } else ctx.lineTo(xi, Y(v));
    });
    ctx.stroke();
    ctx.setLineDash([]);
    if (fill && s.fill) {
      ctx.lineTo(X(s.ys.length - 1), Y(Math.max(lo, 0)));
      ctx.lineTo(X(0), Y(Math.max(lo, 0)));
      ctx.globalAlpha = .15; ctx.fillStyle = s.color; ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  text(ctx, fmt(hi, Math.abs(hi) < 10 ? 2 : 0), x + 4, y + 12, { color: th.faint, size: 10 });
  text(ctx, fmt(lo, Math.abs(lo) < 10 ? 2 : 0), x + 4, y + h - 4, { color: th.faint, size: 10 });
  if (ylabel) text(ctx, ylabel, x + w - 4, y + 12, { color: th.muted, size: 10, align: 'right' });
  if (xlabel) text(ctx, xlabel, x + w - 4, y + h - 4, { color: th.muted, size: 10, align: 'right' });
  let lx = x + 40;
  for (const s of series) {
    if (!s.label) continue;
    ctx.fillStyle = s.color; ctx.fillRect(lx, y + 6, 10, 3);
    text(ctx, s.label, lx + 14, y + 11, { color: th.muted, size: 10 });
    lx += 22 + ctx.measureText(s.label).width * 1.1;
  }
  return { X, Y, lo, hi };
}

/** Appelle cb quand le thème change (pour redessiner les scènes statiques). */
export function onTheme(cb) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}

/** Glisser-déposer simplifié (souris + tactile) sur un canvas. */
export function drag(cv, { down, move, up }) {
  const el = cv.c;
  let active = false;
  const d = e => {
    const p = cv.pos(e);
    active = down ? down(p, e) !== false : true;
    if (active) { el.setPointerCapture?.(e.pointerId); e.preventDefault(); }
  };
  const m = e => { if (active && move) { move(cv.pos(e), e); e.preventDefault(); } };
  const u = e => { if (active) { active = false; up && up(cv.pos(e), e); } };
  el.addEventListener('pointerdown', d);
  el.addEventListener('pointermove', m);
  el.addEventListener('pointerup', u);
  el.addEventListener('pointercancel', u);
  return () => {
    el.removeEventListener('pointerdown', d);
    el.removeEventListener('pointermove', m);
    el.removeEventListener('pointerup', u);
    el.removeEventListener('pointercancel', u);
  };
}
