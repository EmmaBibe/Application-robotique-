/* Niveau 8 « Variation de vitesse & réseaux » : variateurs, servomoteurs, réseaux industriels, supervision.
 * Modèles (AA.N8), vérifiés par les tests :
 *  - bus continu d'un variateur alimenté en 400 V triphasé : ≈ √2 × 400 ≈ 566 V à vide, ≈ 1,35 × 400 = 540 V (valeur moyenne redressée)
 *  - couple d'un moteur asynchrone (formule de Kloss) : C = 2 Cmax / (g/gk + gk/g) ; en U/f constant sous fn, Cmax et la
 *    vitesse de glissement au couple maximal restent constants ; au-dessus de fn (défluxage), Cmax ∝ (fn/f)²
 *  - énergie cinétique E = ½ J ω² ; puissance de freinage moyenne = E / t
 *  - codeur incrémental : f = (impulsions par tour) × n / 60
 *  - erreur de traînage d'une boucle de position proportionnelle : e = v / Kv
 *  - Modbus RTU : CRC-16 (polynôme 0xA001, initialisation 0xFFFF), octet de poids faible transmis en premier
 *  - TRS = disponibilité × performance × qualité */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n), esc = AA.esc;
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const segB = (el, c, cb) => el.querySelectorAll(c + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(c + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
  const N = AA.N8 = {};

  /* ---------- Modèles ---------- */
  N.busPeak = U => Math.SQRT2 * U;
  N.busAvg = U => 3 * Math.SQRT2 / Math.PI * U; // 1,35 U
  N.kloss = (g, gk, Cmax) => g <= 0 ? 0 : 2 * Cmax / (g / gk + gk / g);
  N.motor = { p: 2, fn: 50, Cn: 50, Cmax50: 125, dnk: 225 }; // 4 pôles, couple max 2,5 Cn, glissement au couple max 225 tr/min (gk = 0,15 à 50 Hz)
  N.torque = (n, f) => { const M = N.motor, ns = 60 * f / M.p, Cmax = f <= M.fn ? M.Cmax50 : M.Cmax50 * Math.pow(M.fn / f, 2), gk = M.dnk / ns, g = (ns - n) / ns; return { ns, C: N.kloss(g, gk, Cmax), Cmax }; };
  N.opPoint = (f, load) => { // vitesse où le couple moteur égale le couple résistant (recherche par dichotomie sur la partie stable)
    const ns = 60 * f / N.motor.p; let lo = Math.max(0, ns - N.motor.dnk), hi = ns;
    if (N.torque(lo, f).C < load(lo)) return null;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (N.torque(m, f).C > load(m)) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  N.Uf = (f, Un, fn) => Math.min(Un, Un * f / fn);
  N.kin = (J, n) => 0.5 * J * Math.pow(n * 2 * Math.PI / 60, 2);
  N.encF = (ppr, n) => ppr * n / 60;
  N.crc16 = bytes => { let c = 0xFFFF; for (const b of bytes) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xA001 : c >>> 1; } return c; };
  N.rtu = bytes => { const c = N.crc16(bytes); return bytes.concat([c & 0xFF, c >> 8]); };
  N.hex = arr => arr.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  N.trs = (D, P, Q) => D * P * Q;

  /* ---------- Variateur : redresseur, bus continu, onduleur MLI ---------- */
  SIMS.vfd = el => {
    const st = { f: 35, fc: 8, U: 400 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('f', 'Fréquence de sortie', 1, 50, 1, 35, 'Hz')}${sl('fc', 'Fréquence de découpage', 2, 16, 1, 8, 'kHz')}${sl('U', 'Tension du réseau (entre phases)', 380, 480, 5, 400, 'V')}</div>
      <div class="simout"><div><span>Bus continu à vide ≈ √2 × U</span><b class="o-b"></b></div><div><span>Tension de sortie (fondamental, loi U/f)</span><b class="o-u"></b></div><div><span>Impulsions par période de sortie</span><b class="o-n"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Le dessin ralentit énormément le découpage pour qu'on voie les impulsions. L'onduleur compare une sinusoïde de référence à une porteuse triangulaire : la largeur des impulsions suit la sinusoïde (MLI), et le courant dans le moteur, lissé par son inductance, devient presque sinusoïdal.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const Ub = N.busPeak(st.U), Uo = N.Uf(st.f, st.U, 50), m = Uo / st.U, npp = st.fc * 1000 / st.f;
      el.querySelector('.o-b').textContent = AA.fmt(Ub, 0) + ' V'; el.querySelector('.o-u').textContent = AA.fmt(Uo, 0) + ' V'; el.querySelector('.o-n').textContent = AA.fmt(npp, 0);
      const x0 = 10, x1 = W - 10, yc = H * 0.38, A = H * 0.26, nShow = Math.max(8, Math.min(40, npp / 12));
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, yc); g.lineTo(x1, yc); g.stroke();
      const ph = t * 1.5;
      g.strokeStyle = css('--teal'); g.lineWidth = 2; g.beginPath();
      for (let x = x0; x <= x1; x++) { const a = (x - x0) / (x1 - x0) * 2 * Math.PI + ph, y = yc - A * m * Math.sin(a); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.strokeStyle = css('--line-2'); g.lineWidth = 1; g.beginPath();
      for (let x = x0; x <= x1; x++) { const u = ((x - x0) / (x1 - x0) * nShow) % 1, tri = u < 0.5 ? 4 * u - 1 : 3 - 4 * u, y = yc - A * tri; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      const yp = H * 0.82, hp = H * 0.12; g.strokeStyle = css('--copper'); g.lineWidth = 2; g.beginPath();
      for (let x = x0; x <= x1; x++) { const a = (x - x0) / (x1 - x0) * 2 * Math.PI + ph, u = ((x - x0) / (x1 - x0) * nShow) % 1, tri = u < 0.5 ? 4 * u - 1 : 3 - 4 * u, on = m * Math.sin(a) > tri, y = on ? yp - hp : yp + hp; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('référence sinusoïdale (bleu-vert) et porteuse triangulaire', x0 + 4, 14); g.fillText('sortie de l\'onduleur : + U bus / − U bus (MLI)', x0 + 4, yp - hp - 8);
    });
    return cv.stop;
  };

  /* ---------- Loi U/f : courbes couple-vitesse ---------- */
  SIMS.uf = el => {
    const st = { f: 50, Cr: 40 }; let load = 'const';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('f', 'Fréquence imposée par le variateur', 5, 80, 1, 50, 'Hz')}${sl('Cr', 'Couple résistant (à 1 500 tr/min pour une pompe)', 0, 80, 1, 40, 'N·m')}
      <div class="seg js-l"><button data-v="const" class="on">Couple constant (convoyeur)</button><button data-v="quad">Couple quadratique (pompe, ventilateur)</button></div></div>
      <div class="simout"><div><span>Tension appliquée (U/f, 400 V à 50 Hz)</span><b class="o-u"></b></div><div><span>Vitesse de synchronisme n<sub>s</sub> = 60 f / p</span><b class="o-s"></b></div><div><span>Point de fonctionnement</span><b class="o-n"></b></div><div><span>Couple maximal disponible</span><b class="o-c"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Moteur 4 pôles, couple nominal 50 N·m, couple maximal 2,5 C<sub>n</sub> (formule de Kloss, modèle simplifié sans résistance statorique : à très basse fréquence, un vrai variateur ajoute un « boost » de tension). Au-delà de 50 Hz, la tension ne peut plus augmenter : le flux et le couple maximal diminuent (défluxage).</p></div>`;
    bind(el, st, {});
    segB(el, '.js-l', v => { load = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 250, (g, W, H) => {
      const loadF = n => load === 'const' ? st.Cr : st.Cr * Math.pow(n / 1500, 2);
      const r = N.torque(0, st.f), op = N.opPoint(st.f, loadF);
      el.querySelector('.o-u').textContent = AA.fmt(N.Uf(st.f, 400, 50), 0) + ' V'; el.querySelector('.o-s').textContent = AA.fmt(r.ns, 0) + ' tr/min';
      el.querySelector('.o-n').innerHTML = op == null ? '<span class="bad-t">calage : couple insuffisant</span>' : AA.fmt(op, 0) + ' tr/min, ' + AA.fmt(loadF(op), 1) + ' N·m'; el.querySelector('.o-c').textContent = AA.fmt(r.Cmax, 0) + ' N·m';
      const x0 = 46, x1 = W - 12, y0 = H - 26, y1 = 12, nMax = 2600, X = n => x0 + n / nMax * (x1 - x0), Y = c => y0 - c / 140 * (y0 - y1);
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.lineWidth = 1;
      [0, 500, 1000, 1500, 2000, 2500].forEach(n => { g.beginPath(); g.moveTo(X(n), y0); g.lineTo(X(n), y1); g.stroke(); g.fillText(n, X(n) - 10, y0 + 13); });
      [0, 50, 100].forEach(c => g.fillText(c + ' N·m', 2, Y(c) + 4));
      [10, 25, 50, 70].forEach(f => { if (f === st.f) return; g.strokeStyle = css('--line-2'); g.beginPath(); for (let n = 0; n <= 60 * f / 2; n += 10) { const c = N.torque(n, f).C; n ? g.lineTo(X(n), Y(c)) : g.moveTo(X(n), Y(c)); } g.stroke(); });
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath(); for (let n = 0; n <= r.ns; n += 5) { const c = N.torque(n, st.f).C; n ? g.lineTo(X(n), Y(c)) : g.moveTo(X(n), Y(c)); } g.stroke();
      g.strokeStyle = css('--teal'); g.lineWidth = 2; g.beginPath(); for (let n = 0; n <= nMax; n += 20) { const c = loadF(n); n ? g.lineTo(X(n), Y(c)) : g.moveTo(X(n), Y(c)); } g.stroke();
      if (op != null) { g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(op), Y(loadF(op)), 6, 0, 7); g.fill(); }
      g.fillStyle = css('--copper'); g.fillText('moteur à ' + st.f + ' Hz', X(r.ns) - 60, y1 + 10); g.fillStyle = css('--teal'); g.fillText('charge', x1 - 40, Y(loadF(nMax)) - 6);
    });
    return cv.stop;
  };

  /* ---------- Paramétrage : rampes et surtension du bus en décélération ---------- */
  SIMS.vfdparam = el => {
    const st = { acc: 5, dec: 3, J: 2, fmax: 50, fmin: 0 }; let run = false, f = 0, last = 0, alarm = '', bus = 566, hasR = false;
    el.innerHTML = `<div class="simcard"><div class="simctl"><button class="btn sm primary js-run">Marche</button><button class="btn sm js-stop">Arrêt (rampe)</button><label class="chk"><input type="checkbox" class="js-r"><span>Résistance de freinage raccordée</span></label><button class="btn sm ghost js-ack">Acquitter le défaut</button></div><div class="simview"></div>
      <div class="simctl">${sl('acc', 'Rampe d\'accélération (0 → 50 Hz)', 0.5, 20, 0.5, 5, 's')}${sl('dec', 'Rampe de décélération (50 → 0 Hz)', 0.5, 20, 0.5, 3, 's')}${sl('fmax', 'Fréquence maximale', 20, 60, 1, 50, 'Hz')}${sl('fmin', 'Fréquence minimale', 0, 20, 1, 0, 'Hz')}${sl('J', 'Inertie de la machine entraînée', 0.1, 10, 0.1, 2, 'kg·m²')}</div>
      <div class="simout"><div><span>Fréquence</span><b class="o-f"></b></div><div><span>Tension du bus continu</span><b class="o-b"></b></div><div><span>Puissance renvoyée par la charge en décélération</span><b class="o-p"></b></div></div>
      <p class="js-a" style="padding:0 16px 14px;font-size:14px"></p></div>`;
    bind(el, st, {});
    el.querySelector('.js-run').onclick = () => { if (!alarm) run = true; };
    el.querySelector('.js-stop').onclick = () => { run = false; };
    el.querySelector('.js-r').onchange = e => { hasR = e.target.checked; };
    el.querySelector('.js-ack').onclick = () => { if (f === 0 || alarm) { alarm = ''; bus = 566; } };
    const cv = AA.canvas(el.querySelector('.simview'), 150, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t;
      let Pr = 0;
      if (alarm) { f = Math.max(0, f - dt * 2); } // arrêt en roue libre après défaut
      else if (run) f = Math.min(st.fmax, Math.max(st.fmin, f + 50 / st.acc * dt));
      else if (f > 0) {
        const df = 50 / st.dec * dt, n0 = f * 30, n1 = Math.max(0, f - df) * 30; // 4 pôles : n = 30 f
        Pr = (N.kin(st.J, n0) - N.kin(st.J, n1)) / dt * 0.9; f = Math.max(0, f - df);
      }
      const Pdiss = 300 + (hasR ? 6000 : 0); // pertes internes du variateur + résistance de freinage (exemple)
      if (!alarm) { bus += (Pr - Pdiss) / 2500 * dt * 120; bus = Math.max(566, bus); if (bus > 800) { alarm = 'Défaut « surtension du bus continu » : le moteur, entraîné par l\'inertie, fonctionne en génératrice et renvoie plus d\'énergie que le variateur ne peut en absorber. Le variateur coupe et le moteur s\'arrête en roue libre. Solutions : allonger la rampe de décélération, raccorder une résistance de freinage, ou un module de renvoi au réseau.'; run = false; } }
      el.querySelector('.o-f').textContent = AA.fmt(f, 1) + ' Hz'; el.querySelector('.o-b').textContent = AA.fmt(bus, 0) + ' V'; el.querySelector('.o-p').textContent = AA.fmt(Pr / 1000, 2) + ' kW';
      el.querySelector('.js-a').innerHTML = alarm ? `<span class="bad-t">${alarm}</span>` : '<span class="muted">Essaie une décélération courte avec une forte inertie, sans puis avec résistance de freinage.</span>';
      g.fillStyle = css('--surface-3'); g.fillRect(20, 30, W - 40, 16); g.fillStyle = css('--copper'); g.fillRect(20, 30, (W - 40) * f / 60, 16);
      g.fillStyle = css('--surface-3'); g.fillRect(20, 90, W - 40, 16); g.fillStyle = bus > 750 ? css('--bad') : css('--teal'); g.fillRect(20, 90, (W - 40) * Math.min(1, (bus - 500) / 320), 16);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('fréquence (0 à 60 Hz)', 20, 24); g.fillText('bus continu (seuil de défaut 800 V, valeur d\'exemple)', 20, 84);
    });
    return cv.stop;
  };

  /* ---------- Énergie de freinage ---------- */
  SIMS.brake = el => {
    const st = { J: 5, n: 1500, t: 4, cyc: 60 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('J', 'Inertie totale ramenée au moteur', 0.1, 30, 0.1, 5, 'kg·m²')}${sl('n', 'Vitesse avant freinage', 300, 3000, 50, 1500, 'tr/min')}${sl('t', 'Durée de la décélération', 0.5, 20, 0.5, 4, 's')}${sl('cyc', 'Durée d\'un cycle complet (un freinage par cycle)', 5, 600, 5, 60, 's')}</div>
      <div class="simout"><div><span>Énergie cinétique E = ½ J ω²</span><b class="o-e"></b></div><div><span>Puissance de pointe pendant le freinage ≈ E / t</span><b class="o-p"></b></div><div><span>Puissance moyenne que la résistance doit dissiper</span><b class="o-m"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Hypothèses : décélération linéaire, rendement et pertes du moteur négligés (dimensionnement par excès). La puissance de pointe réelle est maximale au début de la décélération (≈ 2 E / t) : le choix final suit les courbes du fabricant de la résistance.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W, H, tt) => {
      const E = N.kin(st.J, st.n), P = E / st.t, Pm = E / st.cyc;
      el.querySelector('.o-e').textContent = AA.fmt(E / 1000, 2) + ' kJ'; el.querySelector('.o-p').textContent = AA.fmt(P / 1000, 2) + ' kW'; el.querySelector('.o-m').textContent = AA.fmt(Pm, 0) + ' W';
      const heat = Math.min(1, P / 20000); g.fillStyle = `rgb(${120 + 135 * heat},${80 - 40 * heat},${60})`; g.fillRect(W - 170, 40, 140, 40);
      for (let k = 0; k < 6; k++) { g.strokeStyle = css('--ink-3'); g.beginPath(); g.moveTo(W - 160 + k * 22, 40); g.lineTo(W - 160 + k * 22, 80); g.stroke(); }
      g.save(); g.translate(70, 60); g.rotate(tt * st.n / 300); g.fillStyle = css('--surface-3'); g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill(); g.strokeStyle = css('--copper'); g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(34, 0); g.stroke(); g.restore();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('volant d\'inertie', 36, 112); g.fillText('résistance de freinage', W - 170, 100);
    });
    return cv.stop;
  };

  /* ---------- Codeur incrémental ---------- */
  SIMS.encoder = el => {
    const st = { ppr: 1024, n: 30 }; let dir = 1, abs = false, ang = 0, last = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('ppr', 'Impulsions par tour (par voie)', 4, 5000, 4, 1024, '')}${sl('n', 'Vitesse (dessin ralenti)', -60, 60, 1, 30, 'tr/min')}<label class="chk"><input type="checkbox" class="js-abs"><span>Codeur absolu (code Gray, 4 bits)</span></label></div>
      <div class="simout"><div><span>Fréquence des voies A et B, f = PPR × n / 60</span><b class="o-f"></b></div><div><span>Sens détecté</span><b class="o-d"></b></div><div><span>Résolution après comptage des 4 fronts</span><b class="o-r"></b></div></div></div>`;
    bind(el, st, {});
    el.querySelector('.js-abs').onchange = e => { abs = e.target.checked; };
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t; ang += st.n / 60 * 2 * Math.PI * dt;
      el.querySelector('.o-f').textContent = AA.fmt(Math.abs(N.encF(st.ppr, st.n)), 1) + ' Hz'; el.querySelector('.o-d').textContent = st.n === 0 ? '—' : st.n > 0 ? 'A en avance sur B : sens horaire' : 'B en avance sur A : sens antihoraire'; el.querySelector('.o-r').textContent = AA.fmt(360 / (4 * st.ppr), 4) + '°';
      const cx = 90, cy = H / 2, R = 70, nShow = abs ? 16 : 16;
      g.save(); g.translate(cx, cy); g.rotate(ang);
      if (!abs) { for (let k = 0; k < nShow; k++) { g.fillStyle = k % 2 ? css('--surface-3') : css('--ink-2'); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, k / nShow * 2 * Math.PI, (k + 1) / nShow * 2 * Math.PI); g.fill(); } }
      else { for (let k = 0; k < 16; k++) { const gray = k ^ (k >> 1); for (let b = 0; b < 4; b++) { g.fillStyle = (gray >> b) & 1 ? css('--ink-2') : css('--surface-3'); g.beginPath(); g.arc(0, 0, R - b * 14, k / 16 * 2 * Math.PI, (k + 1) / 16 * 2 * Math.PI); g.arc(0, 0, R - (b + 1) * 14, (k + 1) / 16 * 2 * Math.PI, k / 16 * 2 * Math.PI, true); g.fill(); } } }
      g.restore();
      g.fillStyle = css('--bad'); g.fillRect(cx + R - 6, cy - 3, 14, 6);
      const x0 = 190, x1 = W - 14, sig = (yb, off, lbl) => { g.strokeStyle = css('--copper'); g.lineWidth = 2; g.beginPath(); for (let x = x0; x <= x1; x++) { const a = ang * nShow / (2 * Math.PI) * 2 - (x - x0) / 30 + off, v = Math.floor(a) % 2 === 0, y = v ? yb - 16 : yb; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.fillStyle = css('--ink-3'); g.font = '700 11px Segoe UI'; g.fillText(lbl, x0 - 16, yb - 4); };
      if (!abs) { sig(H * 0.42, 0, 'A'); sig(H * 0.72, -0.5, 'B'); }
      else { const pos = ((Math.floor(((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * 16)) % 16), gray = pos ^ (pos >> 1); g.fillStyle = css('--ink'); g.font = '700 22px Cascadia Mono, Consolas'; g.fillText('Gray ' + gray.toString(2).padStart(4, '0'), x0, H / 2); g.font = '500 12px Segoe UI'; g.fillText('position ' + pos + ' / 16 — connue dès la mise sous tension', x0, H / 2 + 24); }
    });
    return cv.stop;
  };

  /* ---------- Boucle de position : erreur de traînage ---------- */
  SIMS.cascade = el => {
    const st = { Kv: 20, Tv: 20, vmax: 200 };
    let x = 0, v = 0, tgtT = 0, last = 0, hist = [], simT = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Kv', 'Gain de la boucle de position K<sub>v</sub>', 1, 60, 1, 20, '1/s')}${sl('Tv', 'Constante de temps de la boucle de vitesse', 2, 100, 1, 20, 'ms')}${sl('vmax', 'Vitesse de la consigne (profil trapézoïdal)', 50, 400, 10, 200, 'mm/s')}</div>
      <div class="simout"><div><span>Erreur de traînage en vitesse constante e = v / K<sub>v</sub></span><b class="o-e"></b></div><div><span>Erreur mesurée</span><b class="o-m"></b></div><div><span>Dépassement à l'arrivée</span><b class="o-o"></b></div></div></div>`;
    bind(el, st, {});
    const target = tt => { const d = 400, ta = 0.4, T = d / st.vmax + ta, u = tt % (2 * T + 1); const prof = s => s < ta ? 0.5 * st.vmax / ta * s * s : s < T - ta ? st.vmax * (s - ta / 2) : s < T ? d - 0.5 * st.vmax / ta * (T - s) * (T - s) : d; return u < T ? prof(u) : u < T + 0.5 ? d : u < 2 * T + 0.5 ? d - prof(u - T - 0.5) : 0; };
    let maxOver = 0;
    const cv = AA.canvas(el.querySelector('.simview'), 210, (g, W, H, t) => {
      const real = last ? Math.min(0.05, t - last) : 0; last = t;
      for (let k = 0; k < Math.round(real / 0.001); k++) { simT += 0.001; const xr = target(simT), vref = st.Kv * (xr - x); v += (vref - v) / (st.Tv / 1000) * 0.001; x += v * 0.001; if (xr === 400) maxOver = Math.max(maxOver, x - 400); hist.push([simT, xr, x]); }
      while (hist.length > 6000) hist.shift();
      const e = st.vmax / st.Kv, cur = hist.length ? hist[hist.length - 1] : [0, 0, 0];
      el.querySelector('.o-e').textContent = AA.fmt(e, 2) + ' mm'; el.querySelector('.o-m').textContent = AA.fmt(cur[1] - cur[2], 2) + ' mm'; el.querySelector('.o-o').textContent = AA.fmt(maxOver, 2) + ' mm';
      const t0 = Math.max(0, simT - 6), X = tt => 40 + (tt - t0) / 6 * (W - 50), Y = p => H - 20 - p / 420 * (H - 34);
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(40, Y(0)); g.lineTo(W - 10, Y(0)); g.moveTo(40, Y(400)); g.lineTo(W - 10, Y(400)); g.stroke();
      const line = (k, col, w, d) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(d || []); g.beginPath(); let f = true; for (let i = 0; i < hist.length; i += 10) { const h = hist[i]; if (h[0] < t0) continue; f ? g.moveTo(X(h[0]), Y(h[k])) : g.lineTo(X(h[0]), Y(h[k])); f = false; } g.stroke(); g.setLineDash([]); };
      line(1, css('--teal'), 1.6, [6, 4]); line(2, css('--copper'), 2.4);
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText('0 mm', 4, Y(0) + 4); g.fillText('400 mm', 2, Y(400) + 4); g.fillStyle = css('--teal'); g.fillText('consigne', W - 120, 14); g.fillStyle = css('--copper'); g.fillText('position réelle', W - 70, 14);
      if (simT > 30) { simT = 0; hist = []; x = 0; v = 0; maxOver = 0; }
      void tgtT;
    });
    return cv.stop;
  };

  /* ---------- Axes coordonnés : interpolation linéaire ---------- */
  SIMS.interp = el => {
    const st = { X: 300, Y: 120, v: 100 }; let mode = 'interp', t0 = null;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-m"><button data-v="free">Axes indépendants (vitesse max chacun)</button><button data-v="interp" class="on">Interpolation linéaire</button></div><button class="btn sm primary js-go">Lancer le mouvement</button>${sl('X', 'Cible X', 50, 400, 10, 300, 'mm')}${sl('Y', 'Cible Y', 20, 200, 10, 120, 'mm')}${sl('v', 'Vitesse (max par axe, ou sur la trajectoire)', 20, 200, 10, 100, 'mm/s')}</div>
      <div class="simout"><div><span>Vitesse de l'axe X</span><b class="o-x"></b></div><div><span>Vitesse de l'axe Y</span><b class="o-y"></b></div><div><span>Durée du mouvement</span><b class="o-t"></b></div></div></div>`;
    bind(el, st, {});
    segB(el, '.js-m', v => { mode = v; t0 = null; });
    let last = 0, T = 0; el.querySelector('.js-go').onclick = () => { t0 = 0; };
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t; if (t0 != null) t0 += dt;
      const L0 = Math.hypot(st.X, st.Y), vx = mode === 'interp' ? st.v * st.X / L0 : st.v, vy = mode === 'interp' ? st.v * st.Y / L0 : st.v;
      T = Math.max(st.X / vx, st.Y / vy);
      el.querySelector('.o-x').textContent = AA.fmt(vx, 1) + ' mm/s'; el.querySelector('.o-y').textContent = AA.fmt(vy, 1) + ' mm/s'; el.querySelector('.o-t').textContent = AA.fmt(T, 2) + ' s';
      const sc = Math.min((W - 60) / 420, (H - 40) / 220), X = x => 30 + x * sc, Y = y => H - 20 - y * sc;
      g.strokeStyle = css('--line'); g.strokeRect(X(0), Y(220), 420 * sc, 220 * sc);
      g.strokeStyle = css('--teal'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(st.X), Y(st.Y)); g.stroke(); g.setLineDash([]);
      const tt = t0 == null ? 0 : Math.min(t0, T), px = Math.min(st.X, vx * tt), py = Math.min(st.Y, vy * tt);
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath(); for (let s = 0; s <= tt; s += 0.02) { const qx = Math.min(st.X, vx * s), qy = Math.min(st.Y, vy * s); s ? g.lineTo(X(qx), Y(qy)) : g.moveTo(X(qx), Y(qy)); } g.stroke();
      g.fillStyle = css('--copper'); g.beginPath(); g.arc(X(px), Y(py), 7, 0, 7); g.fill(); g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(st.X), Y(st.Y), 5, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(mode === 'interp' ? 'Les vitesses sont proportionnées : l\'outil suit la droite (usinage, découpe, dépose de colle).' : 'Chaque axe va à sa vitesse : trajectoire coudée, acceptable seulement pour un déplacement à vide.', X(0), 14);
    });
    return cv.stop;
  };

  /* ---------- Modbus : construire une trame ---------- */
  const FC = { 1: ['01', 'Lire des bits de sortie (coils)'], 3: ['03', 'Lire des registres de maintien'], 4: ['04', 'Lire des registres d\'entrée'], 6: ['06', 'Écrire un registre'], 16: ['10', 'Écrire plusieurs registres'] };
  N.request = (slave, fc, addr, qty, vals) => {
    const b = [slave, fc, addr >> 8, addr & 0xFF];
    if (fc === 6) b.push((vals[0] >> 8) & 0xFF, vals[0] & 0xFF);
    else if (fc === 16) { b.push(qty >> 8, qty & 0xFF, qty * 2); for (let k = 0; k < qty; k++) b.push((vals[k] >> 8) & 0xFF, vals[k] & 0xFF); }
    else b.push(qty >> 8, qty & 0xFF);
    return b;
  };
  SIMS.modbus = el => {
    const st = { slave: 1, addr: 0, qty: 10, val: 1500 }; let fc = 3, tcp = false;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-f">${Object.entries(FC).map(([k, v]) => `<button data-v="${k}" class="${+k === fc ? 'on' : ''}">${v[0]} · ${v[1]}</button>`).join('')}</div><label class="chk"><input type="checkbox" class="js-t"><span>Modbus TCP (au lieu de RTU)</span></label></div>
      <div class="simctl">${sl('slave', 'Numéro d\'esclave (unit id)', 1, 247, 1, 1, '')}${sl('addr', 'Adresse du premier registre (numérotation à partir de 0)', 0, 999, 1, 0, '')}${sl('qty', 'Nombre de registres ou de bits', 1, 20, 1, 10, '')}${sl('val', 'Valeur à écrire (06 / 10)', 0, 65535, 1, 1500, '')}</div>
      <div class="mb-frame js-fr"></div><p class="muted" style="padding:0 16px 14px;font-size:12.5px">Attention aux décalages de numérotation : beaucoup de documentations parlent du registre « 40001 » pour l'adresse 0 transmise dans la trame.</p></div>`;
    bind(el, st, {});
    const draw = () => {
      const b = N.request(st.slave, fc, st.addr, fc === 6 ? 1 : st.qty, Array(st.qty).fill(st.val));
      let parts;
      if (!tcp) { const full = N.rtu(b); parts = [['Esclave', full.slice(0, 1)], ['Fonction', full.slice(1, 2)], ['Données', full.slice(2, -2)], ['CRC (poids faible d\'abord)', full.slice(-2)]]; }
      else { const len = b.length; parts = [['Transaction', [0, 1]], ['Protocole', [0, 0]], ['Longueur', [len >> 8, len & 0xFF]], ['Unit id', b.slice(0, 1)], ['Fonction', b.slice(1, 2)], ['Données', b.slice(2)]]; }
      el.querySelector('.js-fr').innerHTML = `<div class="mb-bytes">${parts.map(([n, arr]) => `<div class="mb-part"><span>${n}</span><b>${N.hex(arr)}</b></div>`).join('')}</div><p style="padding:6px 16px 0;font-size:13px">${tcp ? 'En TCP, pas de CRC : l\'en-tête MBAP (7 octets) indique la longueur ; la vérification d\'intégrité est assurée par TCP/IP.' : 'En RTU, chaque trame se termine par un CRC-16 calculé sur tous les octets précédents ; un silence d\'au moins 3,5 caractères sépare les trames.'}</p>`;
    };
    segB(el, '.js-f', v => { fc = +v; draw(); });
    el.querySelector('.js-t').onchange = e => { tcp = e.target.checked; draw(); };
    el.querySelectorAll('.sl input').forEach(i => i.addEventListener('input', draw));
    draw();
  };

  /* ---------- Réseaux : scrutation maître-esclave ou trame qui traverse ---------- */
  SIMS.netanim = el => {
    const st = { n: 6 }; let mode = 'poll';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-m"><button data-v="poll" class="on">Maître-esclave (Modbus)</button><button data-v="ecat">Trame traversante (EtherCAT)</button><button data-v="pn">Échanges cycliques (Profinet, EtherNet/IP)</button></div>${sl('n', 'Nombre d\'équipements', 2, 12, 1, 6, '')}</div><div class="simview"></div><p class="js-d" style="padding:0 16px 14px;font-size:13.5px"></p></div>`;
    bind(el, st, {}); segB(el, '.js-m', v => { mode = v; });
    const D = { poll: 'Le maître interroge chaque esclave à tour de rôle et attend sa réponse : le temps de cycle augmente avec le nombre d\'esclaves. Simple, universel, peu rapide.', ecat: 'Une seule trame part du maître et traverse tous les équipements : chacun y lit et y écrit ses données au passage, sans l\'arrêter, puis elle revient. Cycles très courts et synchronisés : idéal pour les axes.', pn: 'Chaque équipement échange ses données cycliquement avec l\'automate (producteur / consommateur), sur Ethernet commuté standard, avec une cadence fixée à la configuration ; des variantes temps réel isochrones existent pour le mouvement.' };
    const cv = AA.canvas(el.querySelector('.simview'), 160, (g, W, H, t) => {
      el.querySelector('.js-d').textContent = D[mode];
      const n = st.n, xs = k => 110 + k * (W - 140) / (n - 1 || 1), y = H / 2 + 20;
      g.fillStyle = css('--copper'); g.fillRect(10, y - 50, 70, 34); g.fillStyle = '#fff'; g.font = '700 11px Segoe UI'; g.fillText('Automate', 18, y - 29);
      g.strokeStyle = css('--line-2'); g.lineWidth = 2; g.beginPath(); g.moveTo(80, y - 33); g.lineTo(xs(n - 1), y - 33); g.stroke();
      for (let k = 0; k < n; k++) { g.fillStyle = css('--surface-3'); g.fillRect(xs(k) - 16, y - 20, 32, 30); g.fillStyle = css('--ink'); g.font = '600 10px Segoe UI'; g.fillText(String(k + 1), xs(k) - 4, y - 1); g.strokeStyle = css('--line-2'); g.beginPath(); g.moveTo(xs(k), y - 33); g.lineTo(xs(k), y - 20); g.stroke(); }
      g.fillStyle = css('--warn');
      if (mode === 'poll') { const per = 1.2, k = Math.floor(t / per) % n, ph = (t % per) / per, back = ph > 0.5, u = back ? (1 - ph) * 2 : ph * 2, x = 80 + (xs(k) - 80) * u; g.beginPath(); g.arc(x, y - 33, 6, 0, 7); g.fill(); g.fillStyle = css('--ink-3'); g.fillText(back ? 'réponse de ' + (k + 1) : 'question à ' + (k + 1), 90, y + 38); }
      else if (mode === 'ecat') { const per = 2.4, ph = (t % per) / per, u = ph < 0.5 ? ph * 2 : (1 - ph) * 2, x = 80 + (xs(n - 1) - 80) * u; g.fillRect(x - 10, y - 39, 20, 12); for (let k = 0; k < n; k++) if (Math.abs(x - xs(k)) < 12) { g.fillStyle = css('--ok'); g.fillRect(xs(k) - 16, y + 12, 32, 4); g.fillStyle = css('--warn'); } }
      else { for (let k = 0; k < n; k++) { const ph = ((t + k * 0.13) % 1), x = 80 + (xs(k) - 80) * ph; g.beginPath(); g.arc(x, y - 33 + (k % 2 ? 3 : -3), 3.5, 0, 7); g.fill(); } }
    });
    return cv.stop;
  };

  /* ---------- IO-Link ---------- */
  SIMS.iolink = el => {
    const st = { sp: 120, d: 100 }; let mem = null, swapped = false;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('sp', 'Point de commutation (paramètre écrit à distance)', 20, 300, 5, 120, 'mm')}${sl('d', 'Distance de l\'objet', 10, 350, 5, 100, 'mm')}<button class="btn sm js-save">Sauvegarder les paramètres dans le maître</button><button class="btn sm ghost js-swap">Remplacer le capteur par un neuf</button></div>
      <div class="simout"><div><span>Donnée process (distance mesurée)</span><b class="o-d"></b></div><div><span>Sortie de commutation</span><b class="o-s"></b></div><div><span>Paramètre du capteur</span><b class="o-p"></b></div></div><p class="js-m" style="padding:0 16px 14px;font-size:13.5px"></p></div>`;
    bind(el, st, {});
    let devSp = st.sp;
    el.querySelectorAll('.sl input')[0].addEventListener('input', () => { devSp = st.sp; swapped = false; });
    el.querySelector('.js-save').onclick = () => { mem = devSp; };
    el.querySelector('.js-swap').onclick = () => { swapped = true; devSp = mem != null ? mem : 200; };
    const cv = AA.canvas(el.querySelector('.simview'), 110, (g, W) => {
      el.querySelector('.o-d').textContent = AA.fmt(st.d, 0) + ' mm'; el.querySelector('.o-s').textContent = st.d <= devSp ? '1 (objet détecté)' : '0'; el.querySelector('.o-p').textContent = AA.fmt(devSp, 0) + ' mm';
      el.querySelector('.js-m').innerHTML = swapped ? (mem != null ? '<span class="ok-t">Capteur neuf branché : le maître IO-Link lui a réécrit automatiquement le paramètre sauvegardé. Aucun réglage à refaire.</span>' : '<span class="bad-t">Capteur neuf avec son réglage d\'usine (200 mm) : sans sauvegarde dans le maître, il faut le reparamétrer.</span>') : '<span class="muted">IO-Link (IEC 61131-9) : liaison point à point sur câble standard 3 fils non blindé, 20 m au plus. Données process, paramètres et diagnostic passent sur le même fil.</span>';
      g.fillStyle = css('--copper'); g.fillRect(20, 40, 70, 34); g.fillStyle = '#fff'; g.font = '700 11px Segoe UI'; g.fillText('Maître', 34, 61);
      g.strokeStyle = css('--line-2'); g.lineWidth = 3; g.beginPath(); g.moveTo(90, 57); g.lineTo(200, 57); g.stroke();
      g.fillStyle = css('--surface-3'); g.fillRect(200, 44, 50, 26); g.fillStyle = st.d <= devSp ? css('--warn') : css('--ink-3'); g.beginPath(); g.arc(240, 40, 5, 0, 7); g.fill();
      const sc = (W - 300) / 350; g.fillStyle = 'rgba(80,140,255,.12)'; g.fillRect(250, 47, devSp * sc, 20); g.fillStyle = css('--copper'); g.fillRect(250 + st.d * sc, 40, 12, 34);
    });
    return cv.stop;
  };

  /* ---------- Historisation à bande morte ---------- */
  SIMS.histo = el => {
    const st = { db: 1, per: 1 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('db', 'Bande morte d\'archivage', 0, 5, 0.1, 1, '%')}${sl('per', 'Période d\'échantillonnage', 0.2, 5, 0.2, 1, 's')}</div>
      <div class="simout"><div><span>Points enregistrés sur 10 minutes</span><b class="o-n"></b></div><div><span>Écart maximal de la courbe reconstituée</span><b class="o-e"></b></div><div><span>Économie de stockage</span><b class="o-g"></b></div></div></div>`;
    bind(el, st, { db: v => AA.fmt(v, 1), per: v => AA.fmt(v, 1) });
    const sig = t => 50 + 15 * Math.sin(t / 60) + 6 * Math.sin(t / 7) + (t > 300 && t < 320 ? 12 : 0) + 0.6 * Math.sin(t * 3.1);
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H) => {
      const pts = []; let lastV = null, kept = 0, total = 0, errMax = 0;
      for (let t = 0; t <= 600; t += st.per) { total++; const v = sig(t); if (lastV == null || Math.abs(v - lastV) >= st.db) { pts.push([t, v]); lastV = v; kept++; } }
      for (let t = 0; t <= 600; t += 0.5) { let k = 0; while (k + 1 < pts.length && pts[k + 1][0] <= t) k++; errMax = Math.max(errMax, Math.abs(sig(t) - pts[k][1])); }
      el.querySelector('.o-n').textContent = kept + ' / ' + total; el.querySelector('.o-e').textContent = AA.fmt(errMax, 2) + ' %'; el.querySelector('.o-g').textContent = AA.fmt(100 - kept / total * 100, 0) + ' %';
      const X = t => 10 + t / 600 * (W - 20), Y = v => H - 12 - (v - 20) / 70 * (H - 24);
      g.strokeStyle = css('--line-2'); g.lineWidth = 1; g.beginPath(); for (let t = 0; t <= 600; t += 1) { t ? g.lineTo(X(t), Y(sig(t))) : g.moveTo(X(t), Y(sig(t))); } g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2; g.beginPath(); pts.forEach((p, i) => { if (i) g.lineTo(X(p[0]), Y(pts[i - 1][1])); i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])); }); g.lineTo(X(600), Y(pts[pts.length - 1][1])); g.stroke();
      g.fillStyle = css('--copper'); pts.forEach(p => { g.fillRect(X(p[0]) - 1.5, Y(p[1]) - 1.5, 3, 3); });
    });
    return cv.stop;
  };

  /* ---------- TRS (taux de rendement synthétique) ---------- */
  SIMS.trs = el => {
    const st = { open: 480, stop: 60, cad: 60, prod: 22000, bad: 400 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('open', 'Temps d\'ouverture (poste)', 60, 600, 10, 480, 'min')}${sl('stop', 'Arrêts (pannes, réglages)', 0, 300, 5, 60, 'min')}${sl('cad', 'Cadence nominale', 10, 120, 1, 60, 'pièces/min')}${sl('prod', 'Pièces produites', 0, 40000, 100, 22000, '')}${sl('bad', 'Pièces mauvaises', 0, 5000, 10, 400, '')}</div>
      <div class="simout"><div><span>Disponibilité = temps de fonctionnement / temps d'ouverture</span><b class="o-d"></b></div><div><span>Performance = production / production théorique</span><b class="o-p"></b></div><div><span>Qualité = pièces bonnes / pièces produites</span><b class="o-q"></b></div><div><span>TRS = D × P × Q</span><b class="o-t"></b></div></div></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W) => {
      const tf = Math.max(0, st.open - st.stop), D = tf / st.open, theo = tf * st.cad, P = theo ? Math.min(1, st.prod / theo) : 0, Q = st.prod ? Math.max(0, st.prod - st.bad) / st.prod : 0, T = N.trs(D, P, Q);
      el.querySelector('.o-d').textContent = AA.fmt(D * 100, 1) + ' %'; el.querySelector('.o-p').innerHTML = AA.fmt(P * 100, 1) + ' %' + (theo && st.prod > theo ? ' <small class="bad-t">production > théorique : données incohérentes</small>' : ''); el.querySelector('.o-q').textContent = AA.fmt(Q * 100, 1) + ' %'; el.querySelector('.o-t').textContent = AA.fmt(T * 100, 1) + ' %';
      const bars = [['Temps d\'ouverture', 1, '--line-2'], ['× disponibilité', D, '--blue'], ['× performance', D * P, '--teal'], ['× qualité = TRS', T, '--ok']];
      bars.forEach(([n, v, c], i) => { g.fillStyle = css(c); g.fillRect(150, 10 + i * 26, (W - 170) * v, 18); g.fillStyle = css('--ink-2'); g.font = '500 11px Segoe UI'; g.fillText(n, 10, 23 + i * 26); });
    });
    return cv.stop;
  };

  /* ---------- Choix : cybersécurité, IHM ---------- */
  const CYB = { title: 'Cybersécurité industrielle (IEC 62443) : bonnes pratiques', items: [['seg', 'Segmenter le réseau en zones reliées par des conduits filtrés', ''], ['vpn', 'Accès à distance par passerelle sécurisée et authentification forte', ''], ['cpt', 'Comptes nominatifs, droits minimaux', ''], ['maj', 'Mises à jour gérées et testées', ''], ['svc', 'Désactiver les services et ports inutiles', ''], ['def', 'Garder le mot de passe par défaut de l\'automate', ''], ['web', 'Automate joignable directement depuis Internet', ''], ['usb', 'Brancher une clé USB inconnue sur le poste de supervision', ''], ['save', 'Sauvegardes hors ligne des programmes', '']],
    cases: [
      { q: 'Sélectionne les mesures à appliquer sur une ligne de production.', need: ['seg', 'vpn', 'cpt', 'maj', 'svc', 'save'], no: ['def', 'web', 'usb'], why: 'Défense en profondeur : plusieurs barrières indépendantes. Les niveaux de sécurité SL 1 à SL 4 de l\'IEC 62443 vont de la protection contre les erreurs à la protection contre des attaquants très compétents et dotés de moyens importants.' },
      { q: 'Un sous-traitant doit dépanner l\'automate à distance. Que mettre en place ?', need: ['vpn', 'cpt'], no: ['web', 'def'], why: 'Accès nominatif, limité dans le temps, par une passerelle qui trace les connexions ; jamais d\'automate exposé directement.' }
    ] };
  const IHM = { title: 'Concevoir un écran d\'IHM utile', items: [['gris', 'Fond neutre, couleurs vives réservées aux états anormaux', ''], ['tend', 'Tendances et valeurs avec leurs limites', ''], ['hier', 'Hiérarchie d\'écrans : vue d\'ensemble → détail', ''], ['conf', 'Confirmation des commandes importantes', ''], ['arc', 'Couleurs vives et animations partout', ''], ['3d', 'Images 3D réalistes de chaque machine', ''], ['code', 'Valeurs sans unité ni repère', '']],
    cases: [
      { q: 'Sélectionne les principes d\'une IHM efficace (approche « haute performance », ISA-101).', need: ['gris', 'tend', 'hier', 'conf'], no: ['arc', 'code'], why: 'Un opérateur doit repérer une anomalie en quelques secondes : si tout est coloré et animé, plus rien ne ressort.' }
    ] };
  SIMS.cyber = el => SIMS.choose(el, CYB);
  SIMS.ihm = el => SIMS.choose(el, IHM);
  Object.assign(AA.VISDATA.ORDER, {
    osi: { title: 'Le modèle OSI : remets les couches dans l\'ordre, de l\'application au câble', steps: [['7 · Application (Modbus, OPC UA, HTTP)', 'Le service rendu à l\'utilisateur.'], ['6 · Présentation (codage, chiffrement)', ''], ['5 · Session', ''], ['4 · Transport (TCP, UDP)', 'Découpage et fiabilité des échanges.'], ['3 · Réseau (IP)', 'Adressage et routage entre réseaux.'], ['2 · Liaison (Ethernet, adresses MAC)', 'Trames sur un même réseau.'], ['1 · Physique (câble, RS-485, fibre)', 'Les signaux électriques ou optiques.']] }
  });

  Object.assign(AA.SIMFORM, {
    vfd: ['U<sub>bus</sub> ≈ √2 × U<sub>réseau</sub> (à vide) ; ≈ 1,35 × U<sub>réseau</sub> en valeur moyenne redressée', 'Loi U/f : U = U<sub>n</sub> × f / f<sub>n</sub> jusqu\'à f<sub>n</sub>'],
    uf: ['n<sub>s</sub> = 60 f / p', 'C = 2 C<sub>max</sub> / (g/g<sub>k</sub> + g<sub>k</sub>/g) (formule de Kloss)', 'Au-delà de f<sub>n</sub> : C<sub>max</sub> ≈ C<sub>max n</sub> × (f<sub>n</sub>/f)²'],
    vfdparam: ['Énergie à évacuer : ΔE = ½ J (ω<sub>1</sub>² − ω<sub>2</sub>²)', 'Puissance renvoyée = ΔE / Δt : une rampe deux fois plus courte renvoie deux fois plus de puissance'],
    brake: ['E = ½ J ω², ω = 2π n / 60', 'P<sub>moyenne</sub> = E / durée du cycle ; P<sub>pointe</sub> ≈ 2 E / t<sub>décélération</sub> en décélération linéaire'],
    encoder: ['f = PPR × n / 60', 'Résolution en comptage × 4 : 360° / (4 × PPR)'],
    cascade: ['v<sub>consigne</sub> = K<sub>v</sub> × (x<sub>consigne</sub> − x)', 'Erreur de traînage à vitesse constante : e = v / K<sub>v</sub>'],
    interp: ['Interpolation : v<sub>x</sub> = v × ΔX / L, v<sub>y</sub> = v × ΔY / L, L = √(ΔX² + ΔY²)'],
    histo: ['On n\'enregistre une valeur que si |v − v<sub>dernière enregistrée</sub>| ≥ bande morte', 'Écart maximal de la courbe reconstituée ≈ bande morte (plus les variations entre deux échantillons)'],
    trs: ['TRS = disponibilité × performance × qualité', 'TRS = pièces bonnes / (cadence nominale × temps d\'ouverture)']
  });

  /* ================= Leçons ================= */
  L.n8m1l1 = { min: 11, why: "Le variateur de fréquence est l'appareil qui a le plus changé l'électrotechnique industrielle depuis trente ans.", screens: [[
    { h: 'Principe : redresseur, bus continu, onduleur' },
    { list: ['<b>Redresseur</b> (pont de diodes) : transforme le triphasé en continu.', '<b>Bus continu</b> : condensateurs qui stockent l\'énergie ; environ 540 à 566 V sous un réseau 400 V. Il reste chargé plusieurs minutes après la coupure : attendre le temps indiqué sur l\'appareil et vérifier l\'absence de tension avant d\'intervenir.', '<b>Onduleur</b> (transistors IGBT) : découpe la tension continue à plusieurs kilohertz (MLI) pour recréer une tension de fréquence et d\'amplitude variables.'] },
    { num: { id: 'bus', gen: r => { const U = r.pick([230, 400, 480, 690]); return { q: `Variateur alimenté en triphasé <b>${U} V</b>. Tension du bus continu à vide (≈ √2 × U) ?`, a: N.busPeak(U), unit: 'V', tol: 0.01, sol: `U_bus ≈ √2 × ${U} = ${AA.fmt(N.busPeak(U), 0)} V` }; } } }
  ]] };
  L.n8m1l2 = { min: 12, why: "Comprendre la loi U/f, c'est savoir pourquoi un moteur perd du couple au-dessus de 50 Hz.", screens: [[
    { h: 'Loi U/f et contrôle vectoriel' },
    { p: "Pour garder le flux magnétique constant, le variateur fait varier la tension proportionnellement à la fréquence : 400 V à 50 Hz, 200 V à 25 Hz. La courbe couple-vitesse glisse alors vers la gauche sans changer de forme. Au-delà de 50 Hz, la tension plafonne : c'est le défluxage, le couple disponible diminue." },
    { list: ['<b>U/f</b> : simple, suffisant pour pompes et ventilateurs, plusieurs moteurs sur un variateur.', '<b>Contrôle vectoriel</b> (avec ou sans capteur) : le variateur calcule le flux et le couple en temps réel ; couple élevé à basse vitesse, réponse rapide (levage, enrouleurs).'] },
    { num: { id: 'ns', gen: r => { const f = r.pick([20, 30, 40, 60, 75]), p = r.pick([1, 2, 3]); return { q: `Moteur à <b>${2 * p} pôles</b> alimenté par variateur à <b>${f} Hz</b>. Vitesse de synchronisme ?`, a: 60 * f / p, unit: 'tr/min', tol: 0.001, sol: `n_s = 60 × ${f} / ${p} = ${60 * f / p} tr/min` }; } } }
  ]] };
  L.n8m1l3 = { min: 11, why: "Une rampe de décélération trop courte suffit à mettre un variateur en défaut toutes les dix minutes.", screens: [[
    { h: 'Paramétrage d\'un variateur' },
    { list: ['Données du moteur (plaque) : tension, fréquence, courant, vitesse, puissance, cos φ. Le courant sert à la protection thermique du moteur assurée par le variateur.', 'Fréquences minimale et maximale, rampes d\'accélération et de décélération.', 'Mode de commande (U/f, vectoriel), source de la consigne (bornier 0-10 V, 4-20 mA, réseau), sens de marche.', 'Limitation de courant, réarmements automatiques, comportement en cas de perte de consigne.'] }
  ]] };
  L.n8m1l4 = { min: 9, why: "Un variateur mal câblé perturbe les capteurs, l'automate… et les voisins.", screens: [[
    { h: 'Câblage, CEM, filtres' },
    { list: ['Câble moteur blindé, blindage repris sur 360° aux deux extrémités, aussi court que possible.', 'Filtre CEM d\'entrée (souvent intégré), self de ligne contre les harmoniques, filtre de sortie (dV/dt ou sinus) pour les grandes longueurs de câble.', 'Séparer câbles de puissance et de commande ; masses reliées sur une plaque conductrice.', 'Protection différentielle en amont : choisir un type adapté aux courants de fuite des variateurs (type B pour les variateurs triphasés lorsque le constructeur le demande).'] }
  ]] };
  L.n8m1l5 = { min: 10, why: "Une charge lourde qui ralentit restitue son énergie : il faut savoir où l'envoyer.", screens: [[
    { h: 'Freinage et récupération d\'énergie' },
    { list: ['<b>Résistance de freinage</b> : un transistor (hacheur) envoie l\'énergie excédentaire du bus dans une résistance qui la transforme en chaleur.', '<b>Renvoi au réseau</b> (front-end actif, unité de récupération) : l\'énergie est réinjectée ; rentable pour les freinages fréquents ou longs (levage, centrifugeuses).', '<b>Bus continu partagé</b> : un moteur qui freine alimente un autre qui accélère.', '<b>Freinage par injection de courant continu</b> : arrêt sans récupération, utile pour immobiliser à l\'arrêt (ce n\'est pas un frein de sécurité).'] },
    { num: { id: 'ek', gen: r => { const J = r.pick([0.5, 2, 5, 12]), n = r.pick([1000, 1500, 3000]); return { q: `Inertie <b>${AA.fmt(J)} kg·m²</b> tournant à <b>${n} tr/min</b>. Énergie cinétique ?`, a: N.kin(J, n) / 1000, unit: 'kJ', tol: 0.01, sol: `ω = 2π × ${n} / 60 = ${AA.fmt(n * 2 * Math.PI / 60, 1)} rad/s ; E = ½ × ${AA.fmt(J)} × ω² = ${AA.fmt(N.kin(J, n) / 1000, 2)} kJ` }; } } }
  ]] };
  L.n8m2l1 = { min: 10, why: "Sans capteur de position, pas de servomoteur, pas de robot, pas de machine-outil.", screens: [[
    { h: 'Codeurs et résolveurs' },
    { list: ['<b>Codeur incrémental</b> : deux voies A et B décalées d\'un quart de période (le sens se lit à l\'ordre des fronts) et souvent un top zéro par tour. La position est perdue à la coupure : il faut une prise d\'origine.', '<b>Codeur absolu</b> : chaque position a son code (souvent Gray : un seul bit change à la fois) ; position connue dès la mise sous tension. Multitour : compte aussi les tours.', '<b>Résolveur</b> : transformateur tournant analogique, très robuste (chaleur, vibrations).'] },
    { num: { id: 'enc', gen: r => { const ppr = r.pick([500, 1024, 2048, 2500]), n = r.pick([600, 1500, 3000]); return { q: `Codeur <b>${ppr}</b> impulsions par tour, moteur à <b>${n} tr/min</b>. Fréquence sur la voie A ?`, a: N.encF(ppr, n) / 1000, unit: 'kHz', tol: 0.01, sol: `f = ${ppr} × ${n} / 60 = ${AA.fmt(N.encF(ppr, n), 0)} Hz = ${AA.fmt(N.encF(ppr, n) / 1000, 2)} kHz : l'entrée de comptage doit l'accepter` }; } } }
  ]] };
  L.n8m2l2 = { min: 11, why: "Les trois boucles imbriquées d'un servovariateur expliquent la précision… et les vibrations d'une machine mal réglée.", screens: [[
    { h: 'Boucles de position, vitesse, couple' },
    { p: "Boucles en cascade : la boucle de position calcule une consigne de vitesse, la boucle de vitesse calcule une consigne de couple (courant), la boucle de courant pilote le moteur. Chaque boucle intérieure doit être nettement plus rapide que celle qui l'englobe. Avec une boucle de position proportionnelle, l'axe suit sa consigne avec un retard constant : l'erreur de traînage." },
    { num: { id: 'tr', gen: r => { const v = r.pick([100, 200, 500]), Kv = r.pick([10, 20, 40, 50]); return { q: `Axe à <b>${v} mm/s</b>, gain de position <b>K<sub>v</sub> = ${Kv} s⁻¹</b>. Erreur de traînage ?`, a: v / Kv, unit: 'mm', tol: 0.01, sol: `e = v / K_v = ${v} / ${Kv} = ${AA.fmt(v / Kv, 2)} mm` }; } } }
  ]] };
  L.n8m2l3 = { min: 9, why: "Découper, souder, coller suivant une trajectoire impose que les axes avancent ensemble.", screens: [[
    { h: 'Axes coordonnés' },
    { p: "En interpolation, un contrôleur de mouvement calcule à chaque instant la position de chaque axe pour que l'outil suive la trajectoire voulue (droite, cercle, courbe) à la vitesse programmée. Les axes indépendants, eux, ne conviennent qu'aux déplacements où la trajectoire importe peu." }
  ]] };
  L.n8m3l1 = { min: 9, why: "Le modèle OSI donne un vocabulaire commun pour situer un problème de communication : câble, adresse ou application ?", screens: [[
    { h: 'Modèle OSI appliqué à l\'industrie' },
    { p: "Dépanner un réseau, c'est remonter les couches : le câble est-il bon (1) ? les voyants de liaison sont-ils allumés (2) ? l'adresse IP est-elle correcte et joignable (3) ? le port et le protocole sont-ils les bons (4, 7) ? Beaucoup de réseaux de terrain n'utilisent que les couches 1, 2 et 7." }
  ]] };
  L.n8m3l2 = { min: 12, why: "Modbus est le protocole le plus répandu : compteurs, variateurs, centrales de mesure le parlent presque tous.", screens: [[
    { h: 'Modbus RTU et TCP' },
    { list: ['Principe maître-esclave (client-serveur) : le maître pose une question, un seul esclave répond.', '<b>RTU</b> : liaison série RS-485 (deux fils + référence), jusqu\'à 247 adresses d\'esclaves, résistances de fin de ligne aux deux extrémités, CRC-16 en fin de trame.', '<b>TCP</b> : la même trame sans CRC, encapsulée dans TCP/IP (port 502), précédée de l\'en-tête MBAP.', 'Données : bits (coils, entrées) et registres de 16 bits. Une valeur sur 32 bits occupe deux registres : l\'ordre des mots varie selon les fabricants.'] }
  ]] };
  L.n8m3l3 = { min: 10, why: "Choisir le bon réseau de terrain conditionne la vitesse et la synchronisation de toute la machine.", screens: [[
    { h: 'Profinet, EtherNet/IP, EtherCAT' },
    { table: { head: ['Réseau', 'Principe', 'Points forts'], rows: [['Profinet', 'Échanges cycliques sur Ethernet commuté ; variante IRT isochrone', 'Écosystème Siemens et nombreux fabricants, diagnostic riche'], ['EtherNet/IP', 'Protocole CIP sur Ethernet standard (TCP/UDP)', 'Écosystème Rockwell et nombreux fabricants'], ['EtherCAT', 'Une trame traverse les esclaves, traitée au vol', 'Cycles très courts, synchronisation précise des axes'], ['Modbus TCP', 'Questions-réponses sur TCP/IP', 'Simple, universel, peu déterministe']] } }
  ]] };
  L.n8m3l4 = { min: 9, why: "IO-Link rend les capteurs intelligents sans changer le câblage.", screens: [[
    { h: 'IO-Link' },
    { list: ['Liaison point à point (IEC 61131-9) entre un maître et un capteur ou actionneur, sur câble 3 fils standard non blindé, 20 m au plus.', 'Trois vitesses : COM1 (4,8 kbit/s), COM2 (38,4 kbit/s), COM3 (230,4 kbit/s).', 'Données process, paramètres et diagnostic sur le même fil ; le maître peut sauvegarder les paramètres et les réécrire dans un capteur de remplacement.'] }
  ]] };
  L.n8m3l5 = { min: 10, why: "Une usine connectée est une usine attaquable : la cybersécurité est devenue une compétence de l'électricien automaticien.", screens: [[
    { h: 'Cybersécurité industrielle (IEC 62443)' },
    { p: "La série IEC 62443 organise la sécurité en zones et conduits, définit des niveaux de sécurité (SL 1 à 4) et répartit les responsabilités entre exploitant, intégrateur et fabricant. Le principe central est la défense en profondeur : plusieurs barrières indépendantes, pour qu'une seule faille ne suffise pas." }
  ]] };
  L.n8m4l1 = { min: 9, why: "Un écran bien conçu fait gagner les secondes qui comptent lors d'un incident.", screens: [[
    { h: 'IHM : concevoir un écran utile' },
    { p: "Un écran de conduite présente la situation d'un coup d'œil : valeurs avec unités et limites, tendances, états anormaux mis en évidence, commandes protégées. La norme ISA-101 décrit la démarche de conception des IHM." }
  ]] };
  L.n8m4l2 = { min: 9, why: "Les données historisées permettent d'expliquer une panne, d'optimiser un procédé et de prouver une qualité.", screens: [[
    { h: 'SCADA et historisation' },
    { p: "Un SCADA collecte les données de nombreux automates, affiche les synoptiques, gère les alarmes et historise les mesures. Pour ne pas saturer le stockage, on enregistre souvent une valeur seulement quand elle a changé de plus qu'une bande morte." }
  ]] };
  L.n8m4l3 = { min: 9, why: "Les données ne valent que si elles aident à décider : le TRS en est l'exemple le plus utilisé.", screens: [[
    { h: 'Industrie 4.0 et données' },
    { list: ['Collecte des données au plus près des machines (OPC UA, MQTT), stockage, visualisation, analyse.', 'Indicateur clé : le <b>TRS</b> (taux de rendement synthétique, OEE en anglais) = disponibilité × performance × qualité.', 'Maintenance prédictive : détecter une dérive (vibrations, température, courant) avant la panne.'] },
    { num: { id: 'trs', gen: r => { const D = r.pick([0.85, 0.9, 0.95]), P = r.pick([0.8, 0.88, 0.92]), Q = r.pick([0.97, 0.98, 0.99]); return { q: `Disponibilité <b>${AA.fmt(D * 100)} %</b>, performance <b>${AA.fmt(P * 100)} %</b>, qualité <b>${AA.fmt(Q * 100)} %</b>. TRS ?`, a: N.trs(D, P, Q) * 100, unit: '%', tol: 0.005, sol: `TRS = ${AA.fmt(D)} × ${AA.fmt(P)} × ${AA.fmt(Q)} = ${AA.fmt(N.trs(D, P, Q) * 100, 1)} %` }; } } }
  ]] };

  Object.assign(AA.VISMAP, {
    n8m1l1: [{ sim: 'vfd' }], n8m1l2: [{ sim: 'uf' }], n8m1l3: [{ sim: 'vfdparam' }], n8m1l4: [{ sim: 'cem' }], n8m1l5: [{ sim: 'brake' }],
    n8m2l1: [{ sim: 'encoder' }], n8m2l2: [{ sim: 'cascade' }], n8m2l3: [{ sim: 'interp' }],
    n8m3l1: [{ order: 'osi' }], n8m3l2: [{ sim: 'modbus' }], n8m3l3: [{ sim: 'netanim' }], n8m3l4: [{ sim: 'iolink' }], n8m3l5: [{ sim: 'cyber' }],
    n8m4l1: [{ sim: 'ihm' }], n8m4l2: [{ sim: 'histo' }], n8m4l3: [{ sim: 'trs' }]
  });
})();
