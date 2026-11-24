/* Ampère Académie — visualisations des leçons (partie B) : appareillage (contacteur en coupe, relais
 * thermique), chronogrammes, courants de démarrage, cycle automate, capteurs PNP/NPN, et instruments de
 * mesure : multimètre numérique (fonctions, bornes, calibres, erreurs) et multimètre analogique (échelles,
 * calibres, classe de précision). */
(function () {
  'use strict';
  const { esc } = AA;
  const SIMS = AA.SIMS;
  const css = n => AA.css(n);
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });

  /* ---------- Contacteur en coupe : électroaimant, armature, contacts ---------- */
  SIMS.contactor = el => {
    const st = { U: 0 };
    let closed = false, pos = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('U', 'Tension appliquée à la bobine (en % de Uc)', 0, 120, 1, 0, '%')}<button class="btn sm js-on">100 %</button><button class="btn sm ghost js-off">0 %</button></div>
      <div class="simout"><div><span>État</span><b class="o-s"></b></div><div><span>Pôles de puissance</span><b class="o-p"></b></div></div></div>`;
    bind(el, st, {});
    const setU = v => { const i = el.querySelector('input'); i.value = v; i.dispatchEvent(new Event('input')); };
    el.querySelector('.js-on').onclick = () => setU(100); el.querySelector('.js-off').onclick = () => setU(0);
    const cv = AA.canvas(el.querySelector('.simview'), 260, (g, W, H, t) => {
      // seuils typiques (IEC 60947-4-1 garantit : fermeture entre 85 et 110 % Uc ; retombée entre 20 et 75 % Uc en alternatif)
      if (!closed && st.U >= 80) { closed = true; AA.click(700, 0.05); }
      if (closed && st.U < 55) { closed = false; AA.click(500, 0.04); }
      pos += ((closed ? 1 : 0) - pos) * 0.35;
      el.querySelector('.o-s').innerHTML = closed ? '<span style="color:var(--ok)">collé</span>' : 'au repos';
      el.querySelector('.o-p').textContent = closed ? 'fermés : le moteur est alimenté' : 'ouverts';
      const cx = W / 2, by = H - 40, ink = css('--ink');
      g.lineWidth = 2; g.strokeStyle = ink;
      // circuit magnétique fixe (E)
      g.fillStyle = css('--bezel-2'); g.fillRect(cx - 80, by - 50, 160, 50);
      g.fillStyle = css('--surface'); g.fillRect(cx - 60, by - 50, 30, 36); g.fillRect(cx + 30, by - 50, 30, 36);
      // bobine
      g.fillStyle = st.U > 0 ? `rgba(255,140,0,${0.3 + 0.5 * st.U / 120})` : css('--surface-3');
      g.fillRect(cx - 58, by - 48, 26, 32); g.fillRect(cx + 32, by - 48, 26, 32);
      g.fillStyle = ink; g.font = '600 11px Bahnschrift'; g.fillText('bobine A1-A2', cx - 40, by + 16);
      // armature mobile
      const ay = by - 100 + 46 * pos;
      g.fillStyle = css('--bezel-2'); g.fillRect(cx - 80, ay - 20, 160, 20);
      // ressorts
      g.strokeStyle = css('--ink-3'); g.beginPath(); for (let k = 0; k < 8; k++) { const y = ay + (by - 50 - ay) * k / 8; g.lineTo(cx - 90 + (k % 2 ? 6 : -6), y); } g.stroke();
      // porte-contacts et contacts
      g.fillStyle = css('--surface-3'); g.fillRect(cx - 8, 20, 16, ay - 40);
      const ct = 38 + 46 * pos; g.fillStyle = '#c9a227'; g.fillRect(cx - 70, ct, 140, 8);
      g.fillStyle = '#9c7c18'; g.fillRect(cx - 90, 78, 40, 8); g.fillRect(cx + 50, 78, 40, 8);
      g.strokeStyle = closed ? css('--flow') : css('--ink-3'); g.lineWidth = 3; g.beginPath(); g.moveTo(20, 82); g.lineTo(cx - 90, 82); g.moveTo(cx + 90, 82); g.lineTo(W - 20, 82); g.stroke();
      if (pos > 0.2 && pos < 0.85) { g.strokeStyle = '#8fd3ff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 62, 84); g.lineTo(cx - 56, ct + 4); g.lineTo(cx - 66, ct + 6); g.stroke(); }
      g.fillStyle = ink; g.font = '600 11px Bahnschrift'; g.fillText('pôle de puissance', 24, 72);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Seuils de cette simulation : collage à 80 %, retombée à 55 % (valeurs typiques, dans les plages garanties par la norme).', 14, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Relais thermique : bilame et temps de déclenchement ---------- */
  AA.VIS.thTime = (k, cls) => { if (k <= 1.05) return Infinity; const B = { 10: 406, 20: 811, 30: 1268 }[cls]; return B / (k * k - 1.1025); };
  SIMS.thermal = el => {
    const st = { k: 1, cls: 10 };
    let heat = 0, tripped = false, tt = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('k', 'Courant moteur / réglage I<sub>r</sub>', 0, 8, 0.05, 1, '× Ir')}<div class="seg js-c">${[10, 20, 30].map(c => `<button data-c="${c}" class="${c === 10 ? 'on' : ''}">Classe ${c}</button>`).join('')}</div><button class="btn sm ghost js-r">Réarmer</button></div>
      <div class="simout"><div><span>Temps de déclenchement (à froid, allure)</span><b class="o-t"></b></div><div><span>Chronomètre</span><b class="o-c"></b></div><div><span>Contact 95-96</span><b class="o-s"></b></div></div></div>`;
    bind(el, st, { k: v => AA.fmt(v, 2) });
    el.querySelectorAll('.js-c button').forEach(b => b.onclick = () => { st.cls = +b.dataset.c; el.querySelectorAll('.js-c button').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('.js-r').onclick = () => { if (heat < 0.4) { tripped = false; tt = 0; } else AA.toast('Trop chaud : attends le refroidissement avant de réarmer.'); };
    let last = 0;
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const dt = last ? Math.min(0.1, t - last) : 0; last = t;
      const T = AA.VIS.thTime(st.k, st.cls);
      if (!tripped && isFinite(T)) { heat += dt / T; tt += dt; if (heat >= 1) { tripped = true; AA.click(300, 0.12); } }
      else if (!isFinite(T) || tripped) { heat = Math.max(0, heat - dt / 40); if (!tripped) tt = 0; }
      el.querySelector('.o-t').textContent = isFinite(T) ? (T > 120 ? AA.fmt(T / 60, 1) + ' min' : AA.fmt(T, 1) + ' s') : 'pas de déclenchement';
      el.querySelector('.o-c').textContent = AA.fmt(tt, 1) + ' s';
      el.querySelector('.o-s').innerHTML = tripped ? '<span style="color:var(--bad)">OUVERT (déclenché)</span>' : 'fermé';
      const bend = Math.min(1, heat) * 40;
      for (let p = 0; p < 3; p++) {
        const x = W * 0.2 + p * 60;
        g.lineWidth = 8; g.lineCap = 'round';
        g.strokeStyle = '#b87333'; g.beginPath(); g.moveTo(x, 30); g.quadraticCurveTo(x + bend * 0.4, 100, x + bend, 160); g.stroke();
        g.strokeStyle = '#9aa3ad'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 5, 30); g.quadraticCurveTo(x + 5 + bend * 0.4, 100, x + 5 + bend, 160); g.stroke();
      }
      g.fillStyle = css('--surface-3'); g.fillRect(W * 0.2 - 10, 170, 200, 10);
      g.fillStyle = css('--ink'); g.font = '600 11px Bahnschrift'; g.fillText('3 bilames (un par phase)', W * 0.2 - 10, 20);
      const cx = W * 0.75;
      g.strokeStyle = css('--ink'); g.lineWidth = 2; g.beginPath(); g.moveTo(cx, 60); g.lineTo(cx, 95); g.moveTo(cx, 125); g.lineTo(cx, 160); g.stroke();
      g.save(); g.translate(cx, 125); g.rotate(tripped ? -0.6 : 0.25); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -30); g.stroke(); g.restore();
      g.fillText('95', cx + 8, 70); g.fillText('96', cx + 8, 158);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Classe 10 : déclenchement en 4 à 10 s à 7,2 × Ir (IEC 60947-4-1). Modèle indicatif, à froid.', 12, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Chronogramme TON / TOF / TP ---------- */
  SIMS.chrono = el => {
    const st = { pt: 2, mode: 'TON' };
    let IN = false, buf = [], et = 0, q = false, last = 0, lastIn = false, tpRun = false;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-m">${['TON', 'TOF', 'TP'].map(m => `<button data-m="${m}" class="${m === 'TON' ? 'on' : ''}">${m}</button>`).join('')}</div>${sl('pt', 'Durée PT', 0.5, 5, 0.5, 2, 's')}<button class="btn primary js-in">Maintenir l'entrée IN</button></div></div>`;
    bind(el, st, { pt: v => AA.fmt(v, 1) });
    el.querySelectorAll('.js-m button').forEach(b => b.onclick = () => { st.mode = b.dataset.m; et = 0; q = false; tpRun = false; buf = []; el.querySelectorAll('.js-m button').forEach(x => x.classList.toggle('on', x === b)); });
    const btn = el.querySelector('.js-in');
    btn.addEventListener('pointerdown', () => { IN = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => btn.addEventListener(e, () => { IN = false; }));
    const cv = AA.canvas(el.querySelector('.simview'), 220, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t;
      if (st.mode === 'TON') { if (IN) { et = Math.min(st.pt, et + dt); q = et >= st.pt; } else { et = 0; q = false; } }
      if (st.mode === 'TOF') { if (IN) { et = 0; q = true; } else if (q) { et += dt; if (et >= st.pt) q = false; } }
      if (st.mode === 'TP') { if (IN && !lastIn && !tpRun) { tpRun = true; et = 0; } if (tpRun) { et += dt; q = true; if (et >= st.pt) { tpRun = false; q = false; } } }
      lastIn = IN;
      buf.push([IN, q, et / st.pt]); if (buf.length > 600) buf.shift();
      const rows = [['IN', 0], ['Q', 1], ['ET', 2]], x0 = 40, w = W - 60;
      rows.forEach(([n, k], r) => {
        const y = 30 + r * 64;
        g.fillStyle = css('--ink-2'); g.font = '700 12px Cascadia Mono, Consolas'; g.fillText(n, 6, y + 4);
        g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, y + 22); g.lineTo(x0 + w, y + 22); g.stroke();
        g.strokeStyle = k === 1 ? css('--copper') : k === 2 ? css('--teal') : css('--ink'); g.lineWidth = 2.2; g.beginPath();
        buf.forEach((b, i) => { const x = x0 + w - (buf.length - i) * (w / 600); const v = k === 2 ? b[2] : (b[k] ? 1 : 0); const yy = y + 22 - v * 30; i ? g.lineTo(x, yy) : g.moveTo(x, yy); });
        g.stroke();
      });
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('10 dernières secondes · ' + ({ TON: 'Q monte après PT d\'entrée maintenue', TOF: 'Q retombe PT après la disparition de IN', TP: 'impulsion de durée PT à chaque front montant' })[st.mode], x0, H - 6);
    });
    return cv.stop;
  };

  /* ---------- Courants de démarrage comparés ---------- */
  AA.VIS.startI = (m, t) => {
    if (m === 'dol') return t < 0 ? 0 : (t < 1.6 ? 7 - 1.5 * t : Math.max(1, 4.6 - 3 * (t - 1.6)));
    if (m === 'yd') return t < 0 ? 0 : t < 3 ? 7 / 3 * (t < 2.4 ? 1 : 1 - 0.4 * (t - 2.4)) : (t < 3.15 ? 3.2 : Math.max(1, 3.2 - 6 * (t - 3.15)));
    if (m === 'ss') return t < 0 ? 0 : Math.min(3, 1 + t * 1.2) * (t < 4 ? 1 : 0) + (t >= 4 ? 1 : 0);
    if (m === 'vfd') return t < 0 ? 0 : (t < 4 ? 1.3 : 1);
    return 0;
  };
  SIMS.startcur = el => {
    const on = { dol: true, yd: true, ss: false, vfd: false };
    const N = { dol: ['Direct', '--bad'], yd: ['Étoile-triangle', '--copper'], ss: ['Démarreur progressif', '--teal'], vfd: ['Variateur', '--ok'] };
    el.innerHTML = `<div class="simcard"><div class="simctl">${Object.keys(N).map(k => `<label class="chk"><input type="checkbox" data-k="${k}" ${on[k] ? 'checked' : ''}> ${N[k][0]}</label>`).join('')}</div><div class="simview"></div></div>`;
    el.querySelectorAll('input[type=checkbox]').forEach(c => c.onchange = () => { on[c.dataset.k] = c.checked; });
    const cv = AA.canvas(el.querySelector('.simview'), 240, (g, W, H, tt) => {
      const x0 = 46, x1 = W - 14, y0 = H - 30, y1 = 14, X = t => x0 + t / 6 * (x1 - x0), Y = v => y0 - v / 8 * (y0 - y1);
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.lineWidth = 1;
      for (let v = 0; v <= 8; v += 2) { g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.fillText(v + ' In', 4, Y(v) + 4); }
      for (let t = 0; t <= 6; t++) g.fillText(t + ' s', X(t) - 6, y0 + 14);
      const now = (tt % 7);
      Object.keys(N).forEach(k => {
        if (!on[k]) return;
        g.strokeStyle = css(N[k][1]); g.lineWidth = 2.5; g.beginPath();
        for (let t = 0; t <= Math.min(6, now); t += 0.02) { const y = Y(AA.VIS.startI(k, t)); t ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
        g.stroke();
      });
      g.fillStyle = css('--ink-3'); g.fillText('Allures typiques pour un moteur démarrant à faible charge (les valeurs réelles dépendent du moteur et de la charge).', x0, y1 + 6);
    });
    return cv.stop;
  };

  /* ---------- Cycle automate au ralenti ---------- */
  SIMS.cycle = el => {
    const st = { T: 2 };
    let I = [false, false], img = [false, false], Q = false, Qimg = false, phase = 0, t0 = 0, hold = false;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><button class="btn sm js-i0">I0.0 Marche</button><button class="btn sm js-i1">I0.1 Arrêt (NF)</button>${sl('T', 'Durée d\'un cycle (ralenti)', 0.5, 4, 0.5, 2, 's')}</div>
      <p class="muted" style="padding:0 16px 14px;font-size:13px">Programme : Q0.0 = (I0.0 OU Q0.0) ET I0.1. Appuie très brièvement sur Marche pendant la phase « traitement » : l'automate ne le voit qu'au cycle suivant, s'il est encore enfoncé à la lecture.</p></div>`;
    bind(el, st, {});
    I[1] = true;
    const b0 = el.querySelector('.js-i0');
    b0.addEventListener('pointerdown', () => { I[0] = true; }); ['pointerup', 'pointerleave'].forEach(e => b0.addEventListener(e, () => { I[0] = false; }));
    const b1 = el.querySelector('.js-i1');
    b1.addEventListener('pointerdown', () => { I[1] = false; }); ['pointerup', 'pointerleave'].forEach(e => b1.addEventListener(e, () => { I[1] = true; }));
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const p = ((t - t0) % st.T) / st.T;
      const ph = p < 0.15 ? 0 : p < 0.85 ? 1 : 2;
      if (ph === 0 && phase !== 0) { img = I.slice(); }
      if (ph === 2 && phase !== 2) { Q = Qimg; }
      if (ph === 1) Qimg = (img[0] || Q) && img[1];
      phase = ph;
      const box = (x, y, w, h, title, on) => { g.fillStyle = on ? 'rgba(255,140,0,.18)' : css('--surface-2'); g.fillRect(x, y, w, h); g.strokeStyle = on ? css('--copper') : css('--line-2'); g.lineWidth = 2; g.strokeRect(x, y, w, h); g.fillStyle = css('--ink'); g.font = '700 12px Bahnschrift'; g.fillText(title, x + 8, y + 18); };
      const bw = (W - 80) / 3;
      box(20, 20, bw, 150, '1. Lecture des entrées', ph === 0); box(40 + bw, 20, bw, 150, '2. Traitement', ph === 1); box(60 + 2 * bw, 20, bw, 150, '3. Écriture des sorties', ph === 2);
      g.font = '600 12px Cascadia Mono, Consolas';
      const led = (x, y, on, lbl) => { g.fillStyle = on ? css('--ok') : css('--surface-3'); g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillStyle = css('--ink-2'); g.fillText(lbl, x + 14, y + 4); };
      led(36, 58, I[0], 'I0.0 réel'); led(36, 82, I[1], 'I0.1 réel'); led(36, 120, img[0], 'I0.0 image'); led(36, 144, img[1], 'I0.1 image');
      g.fillStyle = css('--ink-2'); g.fillText('Q0.0 := (I0.0 + Q0.0) · I0.1', 52 + bw, 70);
      if (ph === 1) { g.fillStyle = css('--copper'); g.fillRect(52 + bw, 82, (bw - 24) * ((p - 0.15) / 0.7), 4); }
      led(56 + bw, 120, Qimg, 'Q0.0 image');
      led(76 + 2 * bw, 70, Q, 'Q0.0 réelle (KM1)');
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Un vrai automate fait ce cycle en quelques millisecondes ; ici il est ralenti pour être observé.', 20, H - 10);
    });
    return cv.stop;
  };

  /* ---------- Capteurs PNP / NPN et type d'entrée ---------- */
  SIMS.pnp = el => {
    const st = { s: 'PNP', i: 'sink', obj: false };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">
      <div class="field"><label>Capteur</label><div class="seg js-s"><button data-v="PNP" class="on">PNP</button><button data-v="NPN">NPN</button></div></div>
      <div class="field"><label>Entrée automate</label><div class="seg js-i"><button data-v="sink" class="on">« sink » (commun au 0 V)</button><button data-v="source">« source » (commun au +24 V)</button></div></div>
      <button class="btn sm js-o">Présenter une pièce</button></div><div class="simout"><div><span>Voyant de l'entrée</span><b class="o-l"></b></div></div></div>`;
    ['s', 'i'].forEach(k => el.querySelectorAll('.js-' + k + ' button').forEach(b => b.onclick = () => { st[k] = b.dataset.v; el.querySelectorAll('.js-' + k + ' button').forEach(x => x.classList.toggle('on', x === b)); }));
    el.querySelector('.js-o').onclick = () => { st.obj = !st.obj; el.querySelector('.js-o').textContent = st.obj ? 'Retirer la pièce' : 'Présenter une pièce'; };
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const match = (st.s === 'PNP' && st.i === 'sink') || (st.s === 'NPN' && st.i === 'source');
      const lit = st.obj && match;
      el.querySelector('.o-l').innerHTML = lit ? '<span style="color:var(--ok)">allumé : la pièce est vue</span>' : st.obj ? '<span style="color:var(--bad)">éteint : capteur et entrée incompatibles</span>' : 'éteint';
      const ink = css('--ink');
      g.lineWidth = 3;
      const rail = (y, col, lbl) => { g.strokeStyle = col; g.beginPath(); g.moveTo(20, y); g.lineTo(W - 20, y); g.stroke(); g.fillStyle = col; g.font = '700 12px Bahnschrift'; g.fillText(lbl, 24, y - 6); };
      rail(30, '#c0392b', '+24 V'); rail(H - 40, '#2471a3', '0 V');
      const sx = W * 0.3;
      g.fillStyle = css('--surface-3'); g.fillRect(sx - 30, 80, 60, 70); g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(sx - 30, 80, 60, 70);
      g.fillStyle = ink; g.font = '700 13px Bahnschrift'; g.fillText(st.s, sx - 14, 120);
      g.strokeStyle = '#8b5a2b'; g.beginPath(); g.moveTo(sx - 15, 80); g.lineTo(sx - 15, 30); g.stroke();
      g.strokeStyle = '#2471a3'; g.beginPath(); g.moveTo(sx + 15, 150); g.lineTo(sx + 15, H - 40); g.stroke();
      const ix = W * 0.72;
      g.strokeStyle = '#111'; g.beginPath(); g.moveTo(sx + 30, 115); g.lineTo(ix - 40, 115); g.stroke();
      g.fillStyle = css('--surface-2'); g.fillRect(ix - 40, 85, 80, 60); g.strokeStyle = ink; g.strokeRect(ix - 40, 85, 80, 60);
      g.fillStyle = lit ? css('--ok') : css('--surface-3'); g.beginPath(); g.arc(ix, 100, 7, 0, 7); g.fill();
      g.fillStyle = ink; g.font = '600 11px Bahnschrift'; g.fillText('Entrée I0.0', ix - 32, 135);
      g.strokeStyle = st.i === 'sink' ? '#2471a3' : '#c0392b'; g.beginPath(); g.moveTo(ix, 145); g.lineTo(ix, st.i === 'sink' ? H - 40 : 30); g.stroke();
      g.fillText('commun', ix + 6, st.i === 'sink' ? 170 : 60);
      if (st.obj) { g.fillStyle = '#c8945c'; g.fillRect(sx - 20, 158 + 4 * Math.sin(t * 2), 40, 14); }
      if (lit) { g.strokeStyle = css('--flow'); g.setLineDash([3, 9]); g.lineDashOffset = -t * 30; g.lineWidth = 2; g.beginPath(); if (st.s === 'PNP') { g.moveTo(sx - 15, 30); g.lineTo(sx - 15, 115); g.lineTo(ix, 115); g.lineTo(ix, H - 40); } else { g.moveTo(ix, 30); g.lineTo(ix, 115); g.lineTo(sx + 15, 115); g.lineTo(sx + 15, H - 40); } g.stroke(); g.setLineDash([]); }
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(st.s === 'PNP' ? 'PNP : la sortie (noire) fournit le +24 V à l\'entrée' : 'NPN : la sortie (noire) ramène l\'entrée au 0 V', 20, H - 10);
    });
    return cv.stop;
  };

  /* =====================================================================
   * MULTIMÈTRE NUMÉRIQUE (6 000 points) : fonction, borne, calibre, branchement
   * ===================================================================== */
  const DMM = {
    V: { ranges: [0.6, 6, 60, 600, 1000], unit: 'V' },
    mA: { ranges: [0.06, 0.6], unit: 'A', fuse: 0.63 },
    A: { ranges: [6, 10], unit: 'A', fuse: 11 },
    R: { ranges: [600, 6000, 60000, 600000, 6e6, 60e6], unit: 'Ω' }
  };
  /* Affichage d'un appareil 6 000 points : résolution = calibre / 6 000 arrondie à une décade */
  AA.VIS.dmmFormat = (v, range, unit) => {
    if (Math.abs(v) > range) return 'OL';
    let k = 1, pre = '';
    if ((unit === 'A' || unit === 'V') && range < 1) { k = 1000; pre = 'm'; }
    if (unit === 'Ω' && range >= 6e6) { k = 1e-6; pre = 'M'; } else if (unit === 'Ω' && range >= 6000) { k = 1e-3; pre = 'k'; }
    const r2 = range * k, d = Math.max(0, Math.floor(Math.log10(6000 / r2) + 1e-9));
    return { txt: (v * k).toFixed(d), unit: pre + unit };
  };
  SIMS.dmm = (el, o) => {
    o = o || {};
    const r = AA.rng(Date.now() ^ 99);
    const scen = () => {
      const kind = o.kind || r.pick(['dc', 'dc', 'ac']);
      if (kind === 'dc') { const U = r.pick([4.5, 9, 12, 24, 48]), R = r.pick([22, 47, 100, 220, 470, 1000, 4700]); return { kind, U, R, I: U / R, label: `Pile / alimentation ${U} V continu, résistance ${R >= 1000 ? R / 1000 + ' kΩ' : R + ' Ω'}` }; }
      const P = r.pick([60, 500, 1200, 2000]); return { kind, U: 230, R: 230 * 230 / P, I: P / 230, label: `Prise 230 V alternatif, appareil de ${P} W` };
    };
    let sc = scen(), st = { fn: 'V~', jack: 'V', range: 'auto', conn: 'par', power: true, blown: false, msg: '' };
    el.innerHTML = `<div class="simcard vis-dmm"><div class="dmm-body">
        <div class="dmm-lcd"><small class="js-mode"></small><span class="js-val">0.000</span><em class="js-unit"></em></div>
        <div class="dmm-dial">${['OFF', 'V~', 'V⎓', 'Ω', 'A~', 'A⎓'].map(f => `<button data-f="${f}" class="${f === 'V~' ? 'on' : ''}">${f}</button>`).join('')}</div>
        <div class="dmm-row"><button class="dmm-range js-rng">RANGE : AUTO</button></div>
        <div class="dmm-jacks">${[['A', '10 A MAX\nfusible 11 A'], ['mA', '600 mA MAX\nfusible 630 mA'], ['COM', 'COM'], ['V', 'VΩ\n1000 V MAX']].map(([j, l]) => `<button data-j="${j}" class="${j === 'V' ? 'on' : ''} ${j === 'COM' ? 'com' : ''}"><i></i><span>${l.replace('\n', '<br>')}</span></button>`).join('')}</div>
        <div class="dmm-cat">CAT III 1000 V · CAT IV 600 V</div></div>
      <div class="dmm-side"><p class="eyebrow">Circuit</p><p class="js-sc"></p>
        <div class="field"><label>Branchement des pointes</label><div class="seg js-c"><button data-c="par" class="on">En parallèle (aux bornes)</button><button data-c="ser">En série (circuit ouvert)</button></div></div>
        <label class="chk"><input type="checkbox" class="js-p" checked> circuit sous tension</label>
        <div class="dmm-msg js-msg"></div><button class="btn sm ghost js-new">Autre circuit</button><button class="btn sm ghost js-fuse" hidden>Remplacer le fusible</button></div></div>`;
    const $ = s => el.querySelector(s);
    const compute = () => {
      const f = st.fn;
      st.msg = '';
      if (f === 'OFF') return { txt: '', unit: '', mode: '' };
      const isA = f === 'A~' || f === 'A⎓';
      const live = st.power;
      // Erreurs graves d'abord : borne de courant en parallèle sur une source
      if ((st.jack === 'A' || st.jack === 'mA') && st.conn === 'par' && live) {
        if (!st.blown) { st.blown = true; AA.click(150, 0.25); }
        st.msg = `<b class="bad-t">Court-circuit !</b> La pointe rouge est dans la borne ${st.jack} (shunt de très faible résistance) et les pointes sont en parallèle sur une tension : un courant énorme traverse l'appareil, le fusible HPC fond (dans le meilleur des cas). Pour mesurer une tension, la pointe rouge va dans la borne VΩ.`;
        return { txt: '- - - -', unit: '', mode: 'FUSIBLE ' + st.jack };
      }
      if (st.blown && st.jack !== 'V') { st.msg = 'Le fusible de la borne est coupé : la mesure de courant reste à zéro tant qu\'il n\'est pas remplacé (par un fusible identique, HPC, de même calibre et même tension).'; return { txt: '0.000', unit: 'A', mode: f }; }
      if (f === 'Ω') {
        if (live) { st.msg = '<b class="bad-t">Mesure de résistance sous tension.</b> La valeur affichée n\'a aucun sens et l\'appareil est en danger : coupe d\'abord le circuit (et vérifie l\'absence de tension).'; return { txt: '- - - -', unit: 'Ω', mode: 'Ω' }; }
        if (st.jack !== 'V') { st.msg = 'Pour l\'ohmmètre, la pointe rouge va dans la borne VΩ.'; return { txt: 'OL', unit: 'Ω', mode: 'Ω' }; }
        if (st.conn === 'ser') { st.msg = 'Pointes en série dans un circuit ouvert : l\'ohmmètre mesure la résistance de la boucle… mais on mesure normalement une résistance à ses bornes, isolée du reste du circuit.'; }
        const R = sc.R, rng = st.range === 'auto' ? DMM.R.ranges.find(x => x >= R) || 60e6 : st.range;
        const out = AA.VIS.dmmFormat(R, rng, 'Ω'); return out === 'OL' ? { txt: 'OL', unit: 'Ω', mode: 'Ω' } : Object.assign(out, { mode: 'Ω' });
      }
      if (!isA) {
        if (st.jack !== 'V') { st.msg = 'La pointe rouge n\'est pas dans la borne VΩ.'; return { txt: '0.000', unit: 'V', mode: f }; }
        if (st.conn === 'ser') { st.msg = 'Voltmètre inséré en série : sa résistance interne (≈ 10 MΩ) bloque le courant. Le récepteur s\'arrête et l\'écran affiche presque toute la tension de la source. Un voltmètre se branche en parallèle.'; }
        let v = live ? sc.U : 0;
        if (f === 'V⎓' && sc.kind === 'ac') { v = 0; st.msg = st.msg || 'Calibre continu sur une tension alternative : la valeur moyenne d\'une sinusoïde est nulle, l\'écran affiche ≈ 0. Choisis V~.'; }
        if (f === 'V~' && sc.kind === 'dc') { v = 0; st.msg = st.msg || 'Fonction alternative sur une tension continue : l\'appareil (couplage alternatif) affiche ≈ 0. Choisis V⎓.'; }
        const rng = st.range === 'auto' ? DMM.V.ranges.find(x => x >= v * 1.0001) || 1000 : st.range;
        const out = AA.VIS.dmmFormat(v, rng, 'V');
        if (out === 'OL') st.msg = 'OL (« overload ») : la valeur dépasse le calibre choisi. Passe au calibre supérieur.';
        return out === 'OL' ? { txt: 'OL', unit: 'V', mode: f } : Object.assign(out, { mode: f });
      }
      // ampèremètre
      if (st.jack === 'V') { st.msg = 'Fonction courant mais pointe rouge dans VΩ : l\'appareil affiche 0. Pour un courant, borne A (ou mA pour les petits courants).'; return { txt: '0.000', unit: 'A', mode: f }; }
      if (st.conn !== 'ser') { return { txt: '0.000', unit: 'A', mode: f }; }
      let i = live ? sc.I : 0;
      if ((f === 'A⎓') !== (sc.kind === 'dc')) { i = 0; st.msg = 'Fonction continue/alternative inversée : choisis ' + (sc.kind === 'dc' ? 'A⎓' : 'A~') + '.'; }
      const J = DMM[st.jack];
      if (i > J.fuse) { if (!st.blown) { st.blown = true; AA.click(150, 0.2); } st.msg = `<b class="bad-t">Fusible fondu.</b> ${AA.fmt(i, 2)} A dépasse la limite de la borne ${st.jack} (${J.fuse} A). Commence toujours par la borne 10 A quand tu ne connais pas l'ordre de grandeur.`; return { txt: '0.000', unit: 'A', mode: f }; }
      const rng = st.range === 'auto' ? J.ranges.find(x => x >= i) || J.ranges[J.ranges.length - 1] : st.range;
      const out = AA.VIS.dmmFormat(i, rng, 'A');
      return out === 'OL' ? { txt: 'OL', unit: 'A', mode: f } : Object.assign(out, { mode: f });
    };
    const ranges = () => st.fn === 'Ω' ? DMM.R.ranges : (st.fn === 'A~' || st.fn === 'A⎓') ? DMM[st.jack === 'mA' ? 'mA' : 'A'].ranges : DMM.V.ranges;
    const fmtR = v => st.fn === 'Ω' ? (v >= 1e6 ? v / 1e6 + ' MΩ' : v >= 1000 ? v / 1000 + ' kΩ' : v + ' Ω') : (v < 1 ? v * 1000 + ' m' : v + ' ') + (st.fn.startsWith('A') ? 'A' : 'V');
    const draw = () => {
      const out = compute();
      $('.js-val').textContent = out.txt; $('.js-unit').textContent = out.unit; $('.js-mode').textContent = (st.range === 'auto' ? 'AUTO ' : 'MANU ') + (out.mode || '');
      $('.js-msg').innerHTML = st.msg || (st.fn === 'OFF' ? 'Appareil éteint.' : '<span class="ok-t">Branchement correct.</span>');
      $('.js-sc').textContent = sc.label + (st.power ? '' : ' (hors tension)');
      $('.js-rng').textContent = 'RANGE : ' + (st.range === 'auto' ? 'AUTO' : fmtR(st.range));
      $('.js-fuse').hidden = !st.blown;
      if (o.onRead) o.onRead(st, out, sc);
    };
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { st.fn = b.dataset.f; st.range = 'auto'; el.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); AA.click(900, 0.02); draw(); });
    el.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { if (b.dataset.j === 'COM') return; st.jack = b.dataset.j; st.range = 'auto'; el.querySelectorAll('[data-j]').forEach(x => x.classList.toggle('on', x === b || x.dataset.j === 'COM')); draw(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { st.conn = b.dataset.c; el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    $('.js-p').onchange = e => { st.power = e.target.checked; draw(); };
    $('.js-rng').onclick = () => { const R = ranges(); if (st.range === 'auto') st.range = R[0]; else { const i = R.indexOf(st.range); st.range = i < R.length - 1 ? R[i + 1] : 'auto'; } draw(); };
    $('.js-new').onclick = () => { sc = scen(); draw(); };
    $('.js-fuse').onclick = () => { st.blown = false; draw(); };
    el.querySelector('[data-j="COM"]').classList.add('on');
    draw();
    return () => { };
  };

  /* =====================================================================
   * MULTIMÈTRE ANALOGIQUE : calibres 1,5 / 5 / 15 / 50 / 150 / 500 V, échelles 0-15 et 0-5
   * ===================================================================== */
  const CAL = [1.5, 5, 15, 50, 150, 500];
  AA.VIS.anaScale = cal => (String(cal).startsWith('1') ? 15 : 5);
  SIMS.analog = (el, o) => {
    o = o || {};
    const r = AA.rng(Date.now() ^ 12345);
    const newVal = () => Math.round(r.pick([0.62, 1.12, 2.4, 3.6, 7.3, 11.4, 23, 36, 42, 118, 131, 227, 236, 318, 398]) * (0.97 + r() * 0.06) * 100) / 100;
    let val = newVal(), cal = 500, needle = 0, vel = 0, tries = 0;
    el.innerHTML = `<div class="simcard vis-ana"><div class="ana-wrap"><canvas class="ana-cv"></canvas></div>
      <div class="ana-side"><div class="field"><label>Calibre (commutateur)</label><div class="ana-cal">${CAL.map(c => `<button data-c="${c}" class="${c === 500 ? 'on' : ''}">${AA.fmt(c)} V</button>`).join('')}</div></div>
      <p class="muted" style="font-size:13px">Tension continue inconnue. 1) Choisis le calibre le plus adapté (le plus petit qui ne fait pas dépasser l'aiguille). 2) Lis l'échelle qui correspond au calibre et calcule la valeur. Appareil de classe 1,5.</p>
      <div class="num-in"><input inputmode="decimal" placeholder="valeur lue"><span class="unit">V</span><button class="btn primary sm js-ok">Vérifier</button><button class="btn sm ghost js-new">Nouvelle mesure</button></div><div class="js-fb"></div></div></div>`;
    const cvs = el.querySelector('.ana-cv'), g = cvs.getContext('2d');
    let W = 0, H = 0, alive = true, last = 0;
    const size = () => { const d = window.devicePixelRatio || 1, rc = cvs.getBoundingClientRect(); W = rc.width; H = rc.height; cvs.width = W * d; cvs.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(size); ro.observe(cvs); size();
    const A0 = Math.PI * 1.22, A1 = Math.PI * 1.78;
    const frame = tm => {
      if (!alive || !cvs.isConnected) { ro.disconnect(); return; }
      const dt = last ? Math.min(0.05, (tm - last) / 1000) : 0; last = tm;
      const target = Math.min(1.04, val / cal);
      vel += ((target - needle) * 60 - vel * 9) * dt; needle += vel * dt; if (needle > 1.05) { needle = 1.05; vel = 0; }
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#f6f1e3'; g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.92, R = Math.min(W * 0.46, H * 0.8);
      const at = (f, rr) => [cx + Math.cos(A0 + (A1 - A0) * f) * rr, cy + Math.sin(A0 + (A1 - A0) * f) * rr];
      // miroir anti-parallaxe
      g.strokeStyle = '#b9c3cc'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R * 0.86, A0, A1); g.stroke();
      const scale = (max, rr, minor, major, lbl) => {
        g.strokeStyle = '#1c1c1c'; g.fillStyle = '#1c1c1c'; g.lineWidth = 1;
        for (let v = 0; v <= max + 1e-9; v += minor) {
          const f = v / max, isM = Math.abs(v / major - Math.round(v / major)) < 1e-6, half = !isM && Math.abs((v / (major / 2)) - Math.round(v / (major / 2))) < 1e-6;
          const [x1, y1] = at(f, rr), [x2, y2] = at(f, rr + (isM ? 12 : half ? 8 : 5));
          g.lineWidth = isM ? 1.6 : 1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
          if (isM) { const [tx, ty] = at(f, rr + (lbl ? 22 : -10)); g.font = '600 11px Bahnschrift'; g.textAlign = 'center'; g.fillText(AA.fmt(v), tx, ty + 4); }
        }
      };
      scale(15, R * 0.94, 0.25, 1.5, true); // 0-15 : 60 divisions de 0,25
      scale(5, R * 0.74, 0.1, 0.5, false); // 0-5 : 50 divisions de 0,1
      g.textAlign = 'left'; g.font = '700 12px Bahnschrift'; g.fillStyle = '#1c1c1c';
      g.fillText('V ⎓', 12, 20); g.font = '600 11px Bahnschrift'; g.fillText('1,5  ⊓', W - 60, 20);
      g.fillStyle = '#8a1c1c'; g.fillText('0-15', cx + R * 0.66, cy - R * 0.62); g.fillStyle = '#1c3d8a'; g.fillText('0-5', cx + R * 0.48, cy - R * 0.38);
      const [nx, ny] = at(needle, R * 1.0);
      g.strokeStyle = '#c62828'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(nx, ny); g.stroke();
      g.fillStyle = '#222'; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
      if (needle > 1.0) { g.fillStyle = '#c62828'; g.font = '700 12px Bahnschrift'; g.fillText('BUTÉE : calibre trop petit !', 12, H - 12); }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cal = +b.dataset.c; el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); AA.click(800, 0.03); });
    const fb = el.querySelector('.js-fb');
    el.querySelector('.js-ok').onclick = () => {
      const v = parseFloat(el.querySelector('input').value.replace(',', '.'));
      const best = CAL.find(c => c >= val), sm = AA.VIS.anaScale(cal) === 15 ? 0.25 : 0.1, tolRead = sm / AA.VIS.anaScale(cal) * cal; // une petite division
      const errAbs = 0.015 * cal;
      tries++;
      const okRead = isFinite(v) && Math.abs(v - val) <= Math.max(tolRead, 0.01);
      const okCal = cal === best;
      fb.innerHTML = `<p class="${okRead && okCal ? 'ok-t' : 'bad-t'}">${okRead ? 'Lecture correcte' : 'Lecture inexacte'} ; ${okCal ? 'calibre optimal' : `calibre non optimal (le meilleur était ${AA.fmt(best)} V)`}.</p><p class="muted">Valeur vraie ≈ ${AA.fmt(val, 2)} V. Lecture = (graduation lue / ${AA.VIS.anaScale(cal)}) × ${AA.fmt(cal)} V. Incertitude de l'appareil (classe 1,5 sur le calibre ${AA.fmt(cal)} V) : ± ${AA.fmt(errAbs, 3)} V, soit ± ${AA.fmt(errAbs / val * 100, 1)} % de la valeur lue : c'est pourquoi on lit dans le dernier tiers de l'échelle.</p>`;
      if (o.onResult) o.onResult(okRead && okCal);
    };
    el.querySelector('.js-new').onclick = () => { val = newVal(); fb.innerHTML = ''; el.querySelector('input').value = ''; };
    return () => { alive = false; ro.disconnect(); };
  };
})();
