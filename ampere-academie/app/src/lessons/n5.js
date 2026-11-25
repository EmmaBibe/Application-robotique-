/* Niveau « Concevoir une installation » : canalisations, court-circuit, protections, schémas de liaison
 * à la terre, équipement des machines (IEC 60204-1), dossier électrique.
 * Modèles (AA.DESIGN) :
 *  - Icc triphasé maximal par la méthode des impédances, tension à vide U20 = 410 V, réseau amont 500 MVA,
 *    transformateur et réseau assimilés à des réactances, câble ρ = 0,0185 Ω·mm²/m (cuivre à 20 °C), λ = 0,08 mΩ/m.
 *  - Courant de défaut minimal (méthode conventionnelle) : I = 0,8 U0 S / (ρ (1 + m) L), ρ = 0,023 Ω·mm²/m
 *    (cuivre chaud, environ 1,25 × la valeur à 20 °C), m = S_phase / S_PE.
 *  - Contrainte thermique : S ≥ √(I² t) / k, k = 115 (cuivre isolé PVC), 143 (cuivre isolé PR/EPR), IEC 60364-4-43. */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, T = AA.TECH, css = n => AA.css(n);
  const DS = AA.DESIGN = {};
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const seg = (cls, list, on) => `<div class="seg ${cls}">${list.map(([v, t]) => `<button data-v="${v}" class="${String(v) === String(on) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const segBind = (el, cls, cb) => el.querySelectorAll('.' + cls + ' button').forEach(b => b.onclick = () => { el.querySelectorAll('.' + cls + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });

  /* ---------- Modèles ---------- */
  DS.U20 = 410; DS.SCC_UP = 500e6; DS.RHO_MAX = 0.0185; DS.RHO_MIN = 0.023; DS.LAMBDA = 0.00008;
  DS.ib = (PkW, eta, cos) => PkW * 1000 / (eta * Math.sqrt(3) * 400 * cos);
  DS.iccTransfo = (kva, ucc) => kva * 1000 / (Math.sqrt(3) * DS.U20 * ucc / 100);
  DS.icc = ({ kva, ucc, L, S }) => {
    const U2 = DS.U20 * DS.U20, Xa = U2 / DS.SCC_UP, Xt = ucc / 100 * U2 / (kva * 1000);
    const R = L ? DS.RHO_MAX * L / S : 0, X = Xa + Xt + DS.LAMBDA * (L || 0);
    return DS.U20 / (Math.sqrt(3) * Math.hypot(R, X));
  };
  DS.iMin = ({ U0, S, m, L }) => 0.8 * (U0 || 230) * S / (DS.RHO_MIN * (1 + m) * L);
  DS.lMax = ({ U0, S, m, Im }) => 0.8 * (U0 || 230) * S / (DS.RHO_MIN * (1 + m) * Im);
  DS.sMin = (I, t, k) => Math.sqrt(I * I * t) / k;
  DS.ks = n => (n <= 1 ? 1 : n <= 3 ? 0.9 : n <= 5 ? 0.8 : n <= 9 ? 0.7 : 0.6);
  DS.ICU = [3, 4.5, 6, 10, 15, 25, 36, 50, 70, 100];
  DS.MAG = { B: [3, 5], C: [5, 10], D: [10, 20] };

  /* ---------- Section : courant admissible et facteurs de correction ---------- */
  SIMS.izcalc = el => {
    const st = { Ib: 38, T: 35, n: 3, L: 40 }; let pose = 'C';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Ib', "Courant d'emploi I<sub>b</sub>", 5, 110, 1, 38, 'A')}${sl('T', 'Température ambiante', 10, 50, 5, 35, '°C')}${sl('n', 'Circuits jointifs (groupement)', 1, 6, 1, 3, '')}${sl('L', 'Longueur', 5, 200, 5, 40, 'm')}
      ${seg('js-p', [['C', 'Fixé aux parois (C)'], ['B', 'Sous conduit (B1)']], 'C')}</div>
      <div class="simout"><div><span>Calibre I<sub>n</sub> ≥ I<sub>b</sub></span><b class="o-in"></b></div><div><span>I<sub>z</sub> requis = I<sub>n</sub> / (k<sub>T</sub> × k<sub>G</sub>)</span><b class="o-iz"></b></div><div><span>Section (échauffement puis chute de tension ≤ 5 %)</span><b class="o-s"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Câble cuivre isolé PVC, circuit triphasé, cos φ 0,85, protection par disjoncteur. Valeurs IEC 60364-5-52 (tableaux B.52.4, B.52.14, B.52.17).</p></div>`;
    bind(el, st, {});
    segBind(el, 'js-p', v => { pose = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 210, (g, W, H) => {
      const r = T.size({ Ib: st.Ib, tri: true, pose, T: st.T, n: st.n, L: st.L, cos: 0.85, limit: 5 });
      el.querySelector('.o-in').textContent = r.In + ' A';
      el.querySelector('.o-iz').textContent = AA.fmt(r.izReq, 1) + ' A (k = ' + AA.fmt(T.KT[st.T], 2) + ' × ' + AA.fmt(T.KG[st.n], 2) + ')';
      el.querySelector('.o-s').textContent = r.S + ' mm²' + (r.upsized ? ' (augmentée pour la chute de tension, ' + r.Sth + ' mm² suffisaient pour l\'échauffement)' : '') + ' — ΔU = ' + AA.fmt(r.dU, 2) + ' %';
      const tab = T.IZ[pose + '3'], max = 300, x0 = 20, bw = (W - 40) / T.SECTIONS.length, y0 = H - 34, sc = (H - 70) / max;
      T.SECTIONS.forEach((s, i) => {
        const iz = tab[i] * r.k, x = x0 + i * bw, sel = s === r.S, ok = iz >= r.In;
        g.fillStyle = sel ? css('--ok') : ok ? css('--line-2') : css('--surface-3'); g.fillRect(x + 4, y0 - iz * sc, bw - 8, iz * sc);
        g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText(String(s).replace('.', ','), x + 6, y0 + 13);
        if (sel) { g.fillStyle = css('--ink'); g.font = '700 10.5px Cascadia Mono, Consolas'; g.fillText(AA.fmt(iz, 0) + ' A', x + 2, y0 - iz * sc - 5); }
      });
      const yIn = y0 - r.In * sc; g.strokeStyle = css('--copper'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(x0, yIn); g.lineTo(W - 20, yIn); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--copper'); g.font = '700 11px Bahnschrift'; g.fillText('I_n = ' + r.In + ' A : chaque barre (I_z corrigé) doit dépasser cette ligne', x0 + 4, Math.max(14, yIn - 6));
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText('section (mm²)', W - 90, H - 6);
    });
    return cv.stop;
  };

  /* ---------- Courant de court-circuit le long d'une canalisation ---------- */
  SIMS.icc = el => {
    const st = { kva: 630, L: 30, S: 95 };
    const SEC = [16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${seg('js-k', T.TRANSFOS.slice(2, 10).map(k => [k, k + ' kVA']), 630)}${sl('L', 'Longueur du câble', 0, 300, 5, 30, 'm')}${sl('S', 'Section par phase', 0, SEC.length - 1, 1, 5, '')}</div>
      <div class="simout"><div><span>I<sub>cc</sub> aux bornes du transformateur</span><b class="o-a"></b></div><div><span>I<sub>cc</sub> au bout du câble</span><b class="o-b"></b></div><div><span>Pouvoir de coupure minimal (gamme courante)</span><b class="o-c"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Méthode des impédances simplifiée : tension à vide 410 V, réseau amont 500 MVA, transformateur u<sub>cc</sub> 4 % jusqu'à 630 kVA, 6 % au-delà, câble cuivre (ρ à 20 °C, I<sub>cc</sub> maximal). Les études réelles utilisent les données du constructeur et un logiciel conforme à l'IEC 60909 ou au guide UTE C 15-105.</p></div>`;
    bind(el, st, { S: v => SEC[v] + ' mm²' });
    segBind(el, 'js-k', v => { st.kva = +v; });
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H) => {
      const ucc = T.ucc(st.kva), S = SEC[st.S];
      const a = DS.icc({ kva: st.kva, ucc, L: 0, S }), b = DS.icc({ kva: st.kva, ucc, L: st.L, S });
      const pdc = DS.ICU.find(x => x * 1000 >= b);
      el.querySelector('.o-a').textContent = AA.fmt(a / 1000, 1) + ' kA'; el.querySelector('.o-b').textContent = AA.fmt(b / 1000, 1) + ' kA';
      el.querySelector('.o-c').textContent = pdc ? pdc + ' kA (≥ I_cc au point d\'installation)' : '> 100 kA';
      const x0 = 30, x1 = W - 30, y0 = H - 40, y1 = 20, maxI = DS.icc({ kva: 2000, ucc: 6, L: 0, S: 240 });
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath();
      for (let x = 0; x <= 300; x += 3) { const v = DS.icc({ kva: st.kva, ucc, L: x, S }); const X = x0 + x / 300 * (x1 - x0), Y = y0 - v / maxI * (y0 - y1); x ? g.lineTo(X, Y) : g.moveTo(X, Y); }
      g.stroke();
      const Xb = x0 + st.L / 300 * (x1 - x0), Yb = y0 - b / maxI * (y0 - y1);
      g.fillStyle = css('--teal'); g.beginPath(); g.arc(Xb, Yb, 6, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; ['0 m', '100 m', '200 m', '300 m'].forEach((t, i) => g.fillText(t, x0 + i / 3 * (x1 - x0) - 8, y0 + 14));
      g.fillText("L'impédance du câble s'ajoute : le courant de court-circuit diminue en s'éloignant de la source.", x0, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Contrainte thermique I²t ---------- */
  SIMS.i2t = el => {
    const st = { I: 6, t: 100 }; let k = 115;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('I', 'Courant de court-circuit', 1, 25, 0.5, 6, 'kA')}${sl('t', "Durée jusqu'à la coupure", 5, 5000, 5, 100, 'ms')}${seg('js-k', [[115, 'Cuivre PVC (k = 115)'], [143, 'Cuivre PR/EPR (k = 143)']], 115)}</div>
      <div class="simout"><div><span>Énergie I²t</span><b class="o-e"></b></div><div><span>Section minimale S = √(I²t) / k</span><b class="o-s"></b></div><div><span>Section normalisée retenue</span><b class="o-n"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Formule valable pour des durées jusqu'à 5 s (IEC 60364-4-43). Pour les coupures très rapides (disjoncteurs limiteurs, fusibles), on utilise l'I²t limité donné par le constructeur, bien plus faible que I² × t.</p></div>`;
    bind(el, st, { I: v => AA.fmt(v, 1), t: v => AA.fmt(v, 0) });
    segBind(el, 'js-k', v => { k = +v; });
    const SEC = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    const cv = AA.canvas(el.querySelector('.simview'), 150, (g, W, H, tm) => {
      const I = st.I * 1000, t = st.t / 1000, s = DS.sMin(I, t, k), n = SEC.find(x => x >= s);
      el.querySelector('.o-e').textContent = AA.fmt(I * I * t / 1e6, 2) + ' × 10⁶ A²s'; el.querySelector('.o-s').textContent = AA.fmt(s, 1) + ' mm²'; el.querySelector('.o-n').textContent = n ? n + ' mm²' : '> 240 mm²';
      const heat = Math.min(1, s / 240), cx = W / 2, cy = H / 2 - 6, R = 18 + Math.sqrt(n || 240) * 2.6;
      g.fillStyle = css('--surface-3'); g.beginPath(); g.arc(cx, cy, R + 10, 0, 7); g.fill();
      const pulse = 0.85 + 0.15 * Math.sin(tm * 6);
      g.fillStyle = `rgba(${200 + 55 * heat},${120 - 80 * heat},40,${pulse})`; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText("Plus le défaut dure, plus l'âme doit être grosse pour ne pas dépasser la température limite de l'isolant.", 12, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Sélectivité ampèremétrique entre deux disjoncteurs ---------- */
  SIMS.selec = el => {
    const st = { Id: 16, Iu: 63, Icc: 800 }; let cd = 'C', cu = 'C';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Id', 'Disjoncteur aval (calibre)', 6, 63, 1, 16, 'A')}<div><span class="muted" style="font-size:12px">Courbe aval </span>${seg('js-cd', [['B', 'B'], ['C', 'C'], ['D', 'D']], 'C')}</div>${sl('Iu', 'Disjoncteur amont (calibre)', 10, 250, 1, 63, 'A')}<div><span class="muted" style="font-size:12px">Courbe amont </span>${seg('js-cu', [['B', 'B'], ['C', 'C'], ['D', 'D']], 'C')}</div>${sl('Icc', 'Défaut en aval du petit disjoncteur', 20, 5000, 10, 800, 'A')}</div>
      <div class="simout"><div><span>Limite de sélectivité (seuil magnétique bas de l'amont)</span><b class="o-l"></b></div></div><p class="o-v" style="padding:2px 16px 8px;font-size:14px;line-height:1.5"></p>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Allure indicative (bandes magnétiques IEC 60898 : B 3 à 5 I<sub>n</sub>, C 5 à 10 I<sub>n</sub>, D 10 à 20 I<sub>n</sub>). Règle pratique courante pour la zone thermique : calibre amont ≥ 1,6 × calibre aval. Au-delà de la limite magnétique, seules les tables de sélectivité du constructeur permettent de conclure.</p></div>`;
    bind(el, st, {});
    segBind(el, 'js-cd', v => { cd = v; }); segBind(el, 'js-cu', v => { cu = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 280, (g, W, H) => {
      const x0 = 50, x1 = W - 16, y0 = H - 30, y1 = 14, Imin = 5, Imax = 20000;
      const X = i => x0 + Math.log10(i / Imin) / Math.log10(Imax / Imin) * (x1 - x0), Y = t => y0 - (Math.log10(t) + 2) / 6 * (y0 - y1);
      g.font = '500 10px Segoe UI'; g.fillStyle = css('--ink-3'); g.strokeStyle = css('--line'); g.lineWidth = 1;
      [10, 100, 1000, 10000].forEach(i => { g.beginPath(); g.moveTo(X(i), y0); g.lineTo(X(i), y1); g.stroke(); g.fillText(i >= 1000 ? i / 1000 + ' kA' : i + ' A', X(i) - 10, y0 + 13); });
      [0.01, 1, 100, 10000].forEach(t => { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); g.fillText(t < 1 ? '10 ms' : t >= 1000 ? AA.fmt(t / 3600, 1) + ' h' : t + ' s', 4, Y(t) + 4); });
      const curve = (In, c, col) => {
        const [lo, hi] = DS.MAG[c];
        g.fillStyle = col; g.globalAlpha = 0.18; g.fillRect(X(lo * In), y1, X(hi * In) - X(lo * In), Y(0.01) - y1); g.globalAlpha = 1;
        g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); let first = true;
        for (let k = 1.14; k <= lo; k *= 1.03) { const t = Math.min(1e4, 52 / (k * k - 1.2769)); const px = X(k * In), py = Y(t); first ? g.moveTo(px, py) : g.lineTo(px, py); first = false; }
        g.lineTo(X(lo * In), Y(0.01)); g.lineTo(X(Imax), Y(0.01)); g.stroke();
      };
      curve(st.Iu, cu, css('--blue')); curve(st.Id, cd, css('--copper'));
      g.strokeStyle = css('--bad'); g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(st.Icc), y0); g.lineTo(X(st.Icc), y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--copper'); g.font = '700 11px Bahnschrift'; g.fillText('aval ' + cd + st.Id, x1 - 160, y1 + 14); g.fillStyle = css('--blue'); g.fillText('amont ' + cu + st.Iu, x1 - 80, y1 + 14);
      const lim = DS.MAG[cu][0] * st.Iu, therm = st.Iu >= 1.6 * st.Id;
      const downMag = st.Icc >= DS.MAG[cd][1] * st.Id, downMaybe = st.Icc >= DS.MAG[cd][0] * st.Id, upMaybe = st.Icc >= lim;
      el.querySelector('.o-l').textContent = therm ? '≈ ' + AA.fmt(lim, 0) + ' A' : 'calibres trop proches (amont < 1,6 × aval)';
      el.querySelector('.o-v').innerHTML = !therm ? '<span class="bad-t">Pas de sélectivité assurée : rapprocher les calibres fait déclencher les deux.</span>'
        : !upMaybe ? `<span class="ok-t">Sélectif : seul le disjoncteur aval déclenche (${downMag ? 'magnétique, instantané' : downMaybe ? 'zone magnétique incertaine ou thermique' : 'thermique'}).</span>`
        : '<span class="bad-t">Non sélectif pour ce défaut : il atteint la zone magnétique de l\'amont, les deux peuvent déclencher. Sélectivité partielle.</span>';
    });
    return cv.stop;
  };

  /* ---------- Filiation (exemple de table constructeur) ---------- */
  SIMS.filiation = el => {
    const st = { Icc: 18 }; let up = 'on';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Icc', "I<sub>cc</sub> présumé au tableau divisionnaire", 3, 40, 0.5, 18, 'kA')}${seg('js-u', [['on', 'Amont limiteur 50 kA présent'], ['off', 'Sans filiation']], 'on')}</div>
      <div class="simout"><div><span>Pouvoir de coupure propre de l'aval</span><b>10 kA</b></div><div><span>Pouvoir de coupure en filiation (exemple)</span><b class="o-f"></b></div></div><p class="o-v" style="padding:2px 16px 8px;font-size:14px;line-height:1.5"></p>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Valeurs fictives pour la démonstration. Une filiation n'est valable que pour les associations d'appareils testées et publiées par le constructeur (IEC 60947-2 annexe A, IEC 60898-1).</p></div>`;
    bind(el, st, { Icc: v => AA.fmt(v, 1) });
    segBind(el, 'js-u', v => { up = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 160, (g, W, H) => {
      const cap = up === 'on' ? 25 : 10, ok = st.Icc <= cap;
      el.querySelector('.o-f').textContent = up === 'on' ? '25 kA' : '—';
      el.querySelector('.o-v').innerHTML = ok ? '<span class="ok-t">Le disjoncteur aval peut être installé ici.</span>' : '<span class="bad-t">Pouvoir de coupure insuffisant : risque de destruction de l\'appareil.</span>';
      const bx = (x, y, w, h, t, col) => { g.fillStyle = css('--surface-3'); g.strokeStyle = col; g.lineWidth = 2; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); g.fillStyle = css('--ink'); g.font = '600 11px Bahnschrift'; g.fillText(t, x + 8, y + h / 2 + 4); };
      bx(30, 20, 150, 40, up === 'on' ? 'Amont : PdC 50 kA' : 'Amont (non limiteur)', css('--blue'));
      bx(30, 100, 150, 40, 'Aval : PdC 10 kA', ok ? css('--ok') : css('--bad'));
      g.strokeStyle = css('--ink-3'); g.beginPath(); g.moveTo(105, 60); g.lineTo(105, 100); g.stroke();
      const bw = (W - 230) * Math.min(1, st.Icc / 40); g.fillStyle = ok ? css('--ok') : css('--bad'); g.fillRect(210, 110, bw, 20);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Icc = ' + AA.fmt(st.Icc, 1) + ' kA', 210, 102);
      g.fillText("L'amont limiteur s'ouvre aussi et réduit l'énergie que voit l'aval.", 210, 40);
    });
    return cv.stop;
  };

  /* ---------- Schémas de liaison à la terre : défaut d'isolement ---------- */
  SIMS.slt = (el, o) => {
    const st = { L: 50, S: 1, In: 16, RA: 30 }; let reg = (o && o.reg) || 'TN', second = false;
    const SEC = [1.5, 2.5, 4, 6, 10, 16];
    el.innerHTML = `<div class="simcard"><div class="simctl">${seg('js-r', [['TT', 'TT'], ['TN', 'TN-S'], ['IT', 'IT']], reg)}</div><div class="simview"></div><div class="simctl">${sl('L', 'Longueur du circuit', 5, 300, 5, 50, 'm')}${sl('S', 'Section (PE de même section)', 0, 5, 1, 1, '')}${sl('In', 'Disjoncteur courbe C', 6, 63, 1, 16, 'A')}${sl('RA', 'Prise de terre des masses R<sub>A</sub>', 1, 200, 1, 30, 'Ω')}<button class="btn sm js-2">Ajouter un second défaut</button></div>
      <div class="simout"><div><span>Courant de défaut</span><b class="o-i"></b></div><div><span>Tension de contact présumée</span><b class="o-u"></b></div></div><p class="js-msg" style="padding:2px 16px 8px;font-size:14px;line-height:1.5"></p>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Réseau 230/400 V. TN et second défaut IT : méthode conventionnelle (0,8 U, ρ = 0,023 Ω·mm²/m, m = 1, neutre non distribué en IT). TT : terre du neutre R<sub>B</sub> = 10 Ω, différentiel 300 mA. IT premier défaut : courant capacitif d'exemple 0,3 A. Temps de coupure maximaux pour les circuits terminaux ≤ 32 A (IEC 60364-4-41) : 0,4 s en TN, 0,2 s en TT.</p></div>`;
    bind(el, st, { S: v => SEC[v] + ' mm²' });
    segBind(el, 'js-r', v => { reg = v; second = false; });
    el.querySelector('.js-2').onclick = () => { if (reg === 'IT') second = !second; };
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const S = SEC[st.S], Im = 10 * st.In; let Id, Uc, msg, ok;
      if (reg === 'TT') { Id = 230 / (st.RA + 10); Uc = st.RA * Id; ok = st.RA * 0.3 <= 50; msg = `Le disjoncteur ${st.In} A ne voit qu'un courant de ${AA.fmt(Id, 1)} A${Id < Im ? ' : il ne déclenche pas rapidement' : ''} ; le différentiel 300 mA coupe. Condition R<sub>A</sub> × I<sub>Δn</sub> ≤ 50 V : ${AA.fmt(st.RA * 0.3, 1)} V ${ok ? '✔' : '✘ prise de terre trop résistante'}.`; }
      else if (reg === 'TN') { Id = DS.iMin({ S, m: 1, L: st.L }); Uc = 0.8 * 230 / 2; ok = Id >= Im; msg = ok ? `I<sub>d</sub> ≥ 10 I<sub>n</sub> = ${Im} A : déclenchement magnétique instantané (< 0,4 s) ✔.` : `I<sub>d</sub> < 10 I<sub>n</sub> = ${Im} A : coupure par le thermique, trop lente ✘. Longueur maximale ${AA.fmt(DS.lMax({ S, m: 1, Im }), 0)} m : raccourcir, augmenter la section ou ajouter un différentiel.`; }
      else if (!second) { Id = 0.3; Uc = st.RA * Id; ok = true; msg = `Premier défaut : courant très faible, tension de contact ${AA.fmt(Uc, 1)} V, pas de coupure. Le contrôleur permanent d'isolement donne l'alarme : il faut rechercher et éliminer le défaut avant qu'un second n'apparaisse.`; }
      else { Id = 0.8 * 400 * S / (2 * DS.RHO_MIN * 2 * st.L); Uc = 0.8 * 400 / 4; ok = Id >= Im; msg = `Second défaut sur une autre phase (deux circuits identiques) : c'est un court-circuit entre phases par les masses, I<sub>d</sub> = 0,8 U S / (2 ρ (1 + m) L). ${ok ? 'Déclenchement magnétique ✔' : 'Courant insuffisant pour le magnétique ✘ : la longueur maximale est réduite de moitié par rapport au TN.'}`; }
      el.querySelector('.o-i').textContent = Id >= 10 ? AA.fmt(Id, 0) + ' A' : AA.fmt(Id, 2) + ' A';
      el.querySelector('.o-u').innerHTML = AA.fmt(Uc, 0) + ' V ' + (Uc > 50 ? '<small class="bad-t">> 50 V : à couper à temps</small>' : '<small class="ok-t">≤ 50 V</small>');
      el.querySelector('.js-msg').innerHTML = msg;
      el.querySelector('[data-k="RA"]').style.display = reg === 'TN' ? 'none' : ''; el.querySelector('.js-2').style.display = reg === 'IT' ? '' : 'none';
      el.querySelector('.js-2').textContent = second ? 'Retirer le second défaut' : 'Ajouter un second défaut';
      // dessin
      const ax = 60, bx = W - 140, ty = 40, ny = 80, py = 120, gy = H - 30;
      const col = (a) => css(a), flow = (x0, y0, x1, y1, on) => { g.strokeStyle = on ? css('--bad') : css('--ink-3'); g.lineWidth = on ? 3 : 1.6; g.setLineDash(on ? [8, 6] : []); g.lineDashOffset = -t * 30; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]); };
      g.fillStyle = col('--surface-3'); g.fillRect(ax - 34, ty - 12, 50, ny - ty + 24); g.fillStyle = col('--ink'); g.font = '700 11px Bahnschrift'; g.fillText('Poste', ax - 30, ty - 18);
      const fault = reg !== 'IT' || true;
      flow(ax + 16, ty, bx, ty, fault); g.fillStyle = col('--ink-3'); g.font = '600 10px Bahnschrift'; g.fillText('L1', ax + 22, ty - 4);
      flow(ax + 16, ny, bx, ny, false); g.fillText('N', ax + 22, ny - 4);
      g.fillStyle = col('--surface-2'); g.strokeStyle = col('--line-2'); g.lineWidth = 2; g.fillRect(bx, ty - 14, 90, py - ty + 30); g.strokeRect(bx, ty - 14, 90, py - ty + 30);
      g.fillStyle = col('--ink'); g.fillText('Masse du récepteur', bx + 4, ty - 20);
      g.strokeStyle = css('--bad'); g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx + 30, ty); g.lineTo(bx + 42, ty + 22); g.lineTo(bx + 34, ty + 22); g.lineTo(bx + 46, ty + 46); g.stroke();
      const earth = (x, y, lbl) => { g.strokeStyle = col('--ink-3'); g.lineWidth = 2; [18, 12, 6].forEach((w, i) => { g.beginPath(); g.moveTo(x - w, y + i * 5); g.lineTo(x + w, y + i * 5); g.stroke(); }); g.fillStyle = col('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText(lbl, x + 22, y + 8); };
      if (reg === 'TT') { flow(bx + 45, py + 16, bx + 45, gy, true); earth(bx + 45, gy, 'R_A'); flow(ax, ny + 12, ax, gy, true); earth(ax, gy, 'R_B'); flow(bx + 45, gy - 4, ax, gy - 4, true); g.fillStyle = css('--bad'); g.fillText('retour par la terre', (ax + bx) / 2 - 40, gy - 10); }
      else if (reg === 'TN') { flow(bx + 45, py + 16, bx + 45, py + 40, true); flow(bx + 45, py + 40, ax, py + 40, true); g.fillStyle = col('--ok'); g.fillText('PE', ax + 22, py + 36); flow(ax, py + 40, ax, ny + 12, true); flow(ax, py + 40, ax, gy, false); earth(ax, gy, 'neutre à la terre'); }
      else { g.fillStyle = col('--surface-3'); g.fillRect(ax - 20, py + 30, 44, 22); g.fillStyle = col('--ink'); g.fillText('CPI', ax - 10, py + 45); flow(ax, ny + 12, ax, py + 30, false); flow(ax, py + 52, ax, gy, false); earth(ax, gy, 'neutre isolé (ou impédant)'); flow(bx + 45, py + 16, bx + 45, gy, second); earth(bx + 45, gy, 'masses à la terre'); if (second) { g.fillStyle = css('--bad'); g.fillText('second défaut sur L2 d\'un autre départ : court-circuit par les masses', ax + 40, gy - 10); } }
      void fault;
    });
    el.querySelector('.js-r button[data-v="' + reg + '"]').click();
    return cv.stop;
  };

  /* ---------- Indices IP et IK ---------- */
  const IP1 = ['Non protégé', 'Corps ≥ 50 mm (dos de la main)', 'Corps ≥ 12,5 mm (doigt)', 'Corps ≥ 2,5 mm (outil)', 'Corps ≥ 1 mm (fil)', 'Protégé contre les poussières (pas de dépôt nuisible)', 'Étanche aux poussières'];
  const IP2 = ['Non protégé', "Chutes verticales de gouttes d'eau", 'Chutes de gouttes jusqu\'à 15° de la verticale', "Pluie (aspersion jusqu'à 60°)", "Projections d'eau de toutes directions", "Jets d'eau à la lance", "Jets d'eau puissants", 'Immersion temporaire (1 m, 30 min)', 'Immersion prolongée (conditions fixées par le fabricant)', 'Jets haute pression et haute température'];
  const IK = [['00', '—'], ['01', '0,14 J'], ['02', '0,2 J'], ['03', '0,35 J'], ['04', '0,5 J'], ['05', '0,7 J'], ['06', '1 J'], ['07', '2 J'], ['08', '5 J'], ['09', '10 J'], ['10', '20 J']];
  const IPCASES = [
    { q: "Armoire électrique d'une machine dans un atelier propre (exigence minimale de l'IEC 60204-1).", a: [2, 3, 4, 5, 6], b: [2, 3, 4, 5, 6], why: 'IEC 60204-1 : enveloppes au moins IP22.' },
    { q: 'Coffret extérieur exposé aux projections de pluie battante.', a: [2, 3, 4, 5, 6], b: [4, 5, 6], why: "Projections d'eau (influence AD4) : deuxième chiffre au moins 4." },
    { q: 'Coffret dans une menuiserie (poussières de bois, risque d\'incendie).', a: [5, 6], b: [0, 1, 2, 3, 4, 5, 6], why: 'Poussières combustibles : premier chiffre au moins 5.' },
    { q: "Boîtier dans une laiterie nettoyée au jet d'eau à la lance.", a: [2, 3, 4, 5, 6], b: [5, 6], why: "Jets d'eau (AD5) : IPX5 ou IPX6. IPX7 ou IPX8 ne suffisent pas : ils ne garantissent pas la tenue aux jets sauf double marquage (ex. IPX6/IPX7)." },
    { q: 'Pompe de relevage immergée en permanence dans une fosse.', a: [0, 1, 2, 3, 4, 5, 6], b: [8], why: 'Immersion prolongée : IPX8, avec la profondeur et la durée indiquées par le fabricant.' }
  ];
  SIMS.ipik = el => {
    let a = 2, b = 2, ik = 7, cur = 0;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div><p class="eyebrow">Premier chiffre : corps solides</p>${seg('js-a', IP1.map((_, i) => [i, i]), a)}</div><div><p class="eyebrow">Deuxième chiffre : eau</p>${seg('js-b', IP2.map((_, i) => [i, i]), b)}</div><div><p class="eyebrow">Choc mécanique IK (IEC 62262)</p>${seg('js-k', IK.map((x, i) => [i, x[0]]), ik)}</div></div>
      <div class="simview"></div><div class="row" style="padding:4px 16px 14px;gap:10px;flex-wrap:wrap"><span class="js-q" style="flex:1 1 260px"></span><button class="btn primary sm js-chk">Vérifier pour ce cas</button><button class="btn sm ghost js-new">Autre cas</button><span class="js-fb"></span></div></div>`;
    const showQ = () => { el.querySelector('.js-q').innerHTML = '<b>Cas :</b> ' + IPCASES[cur].q; el.querySelector('.js-fb').innerHTML = ''; };
    cur = AA.rng(Date.now()).int(0, IPCASES.length - 1); showQ();
    segBind(el, 'js-a', v => { a = +v; }); segBind(el, 'js-b', v => { b = +v; }); segBind(el, 'js-k', v => { ik = +v; });
    el.querySelector('.js-new').onclick = () => { cur = (cur + 1) % IPCASES.length; showQ(); };
    el.querySelector('.js-chk').onclick = () => { const c = IPCASES[cur], ok = c.a.includes(a) && c.b.includes(b); el.querySelector('.js-fb').innerHTML = ok ? `<span class="ok-t">✔ IP${a}${b} convient. ${c.why}</span>` : `<span class="bad-t">IP${a}${b} ne convient pas. ${c.why}</span>`; };
    const cv = AA.canvas(el.querySelector('.simview'), 170, (g, W, H, t) => {
      g.fillStyle = css('--ink'); g.font = '700 34px Cascadia Mono, Consolas'; g.fillText(`IP${a}${b}`, 20, 50); g.font = '700 22px Cascadia Mono, Consolas'; g.fillText('IK' + IK[ik][0], 20, 86);
      g.font = '500 12px Segoe UI'; g.fillStyle = css('--ink-2'); g.fillText(a + ' : ' + IP1[a], 150, 30); g.fillText(b + ' : ' + IP2[b], 150, 52); g.fillText('IK' + IK[ik][0] + ' : énergie de choc ' + IK[ik][1], 150, 80);
      const bx = W - 150, by = 100; g.fillStyle = css('--surface-3'); g.strokeStyle = css('--line-2'); g.lineWidth = 2; g.fillRect(bx, by, 110, 56); g.strokeRect(bx, by, 110, 56);
      g.fillStyle = css('--blue');
      if (b >= 1) for (let k = 0; k < 7; k++) { const ang = b === 1 ? 0 : b === 2 ? 15 : b === 3 ? 60 : 180, ph = (t * 1.2 + k / 7) % 1; const dir = (k % 2 ? 1 : -1) * ang * Math.PI / 180 * ((k % 3) / 2); const x = bx + 55 + Math.sin(dir) * (1 - ph) * 80, y = by - (1 - ph) * 70 * Math.cos(Math.min(dir, 1.4)); g.globalAlpha = b >= 7 ? 0.25 : 0.8; g.beginPath(); g.arc(x, y, b >= 5 ? 4 : 2.6, 0, 7); g.fill(); }
      g.globalAlpha = 1; if (b >= 7) { g.fillStyle = 'rgba(30,120,220,.25)'; g.fillRect(bx - 20, by + 20, 150, 46); }
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Au-delà de 6, les chiffres ne sont pas cumulatifs : IPX7 ne garantit pas la tenue aux jets.', 20, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Bilan de puissance et choix du transformateur ---------- */
  const LOADS = [['Compresseur', 30, 0.85, 0.75], ['Pompe de process', 15, 0.85, 0.75], ['Convoyeurs', 5.5, 0.82, 0.75], ['Ventilation', 11, 0.86, 0.75], ['Four électrique', 40, 1, 1], ['Chauffage des locaux', 12, 1, 1], ['Éclairage LED', 6, 0.95, 1], ['Prises de l\'atelier', 10, 0.9, 0.5]];
  DS.bilan = (on, ksAuto) => {
    let P = 0, Q = 0, n = 0;
    LOADS.forEach((l, i) => { if (!on[i]) return; n++; const p = l[1] * l[3]; P += p; Q += p * Math.tan(Math.acos(l[2])); });
    const ks = ksAuto ? DS.ks(n) : 1, S = Math.hypot(P, Q) * ks;
    return { P: P * ks, Q: Q * ks, S, ks, n, tr: T.TRANSFOS.find(k => k >= S * 1.2) };
  };
  SIMS.bilan = el => {
    const on = LOADS.map(() => true); let ksAuto = true;
    el.innerHTML = `<div class="simcard"><div class="simctl" style="flex-wrap:wrap">${LOADS.map((l, i) => `<label class="chk"><input type="checkbox" data-i="${i}" checked><span>${l[0]} — ${AA.fmt(l[1])} kW, cos φ ${l[2]}, k<sub>u</sub> ${l[3]}</span></label>`).join('')}<label class="chk"><input type="checkbox" class="js-ks" checked><span>Appliquer le facteur de simultanéité k<sub>s</sub></span></label></div>
      <div class="simview"></div><div class="simout"><div><span>Puissance active</span><b class="o-p"></b></div><div><span>Puissance apparente S</span><b class="o-s"></b></div><div><span>Transformateur (S + 20 % de réserve)</span><b class="o-t"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Facteurs indicatifs : k<sub>u</sub> (utilisation) 0,75 pour les moteurs, 1 pour le chauffage et l'éclairage ; k<sub>s</sub> selon le nombre de départs (0,9 pour 2-3, 0,8 pour 4-5, 0,7 pour 6-9, 0,6 au-delà, valeurs de l'IEC 61439-2 pour un tableau). La réserve de 20 % est un choix de conception, à justifier selon le projet.</p></div>`;
    el.querySelectorAll('input[data-i]').forEach(c => c.onchange = () => { on[+c.dataset.i] = c.checked; });
    el.querySelector('.js-ks').onchange = e => { ksAuto = e.target.checked; };
    const cv = AA.canvas(el.querySelector('.simview'), 140, (g, W, H) => {
      const r = DS.bilan(on, ksAuto);
      el.querySelector('.o-p').textContent = AA.fmt(r.P, 1) + ' kW (k_s = ' + AA.fmt(r.ks, 1) + ')'; el.querySelector('.o-s').textContent = AA.fmt(r.S, 1) + ' kVA'; el.querySelector('.o-t').textContent = r.tr ? r.tr + ' kVA' : 'plus de 2 500 kVA';
      const sc = (W - 60) / 200; g.fillStyle = css('--blue'); g.fillRect(20, 30, r.P * sc, 22); g.fillStyle = css('--copper'); g.fillRect(20, 62, r.S * sc, 22);
      if (r.tr) { g.strokeStyle = css('--ok'); g.lineWidth = 3; g.strokeRect(20, 94, r.tr * sc, 22); }
      g.fillStyle = css('--ink'); g.font = '600 11px Bahnschrift'; g.fillText('P ' + AA.fmt(r.P, 0) + ' kW', 24 + r.P * sc, 46); g.fillText('S ' + AA.fmt(r.S, 0) + ' kVA', 24 + r.S * sc, 78); if (r.tr) g.fillText('transformateur ' + r.tr + ' kVA', 24 + Math.min(r.tr * sc, W - 200), 110);
    });
    return cv.stop;
  };

  /* ---------- Folio vivant réutilisé ---------- */
  SIMS.folio = (el, o) => { const b = AA.bench(el, (o && o.cid) || 'etoile', {}); return () => { if (b && b.destroy) b.destroy(); }; };

  /* ---------- Choix, ordres et zones cliquables ---------- */
  const CEM = { title: 'Compatibilité électromagnétique : bonnes pratiques', items: [['sep', 'Séparer puissance et signaux', 'croisement à 90°'], ['blind', 'Câble moteur blindé', 'blindage repris sur 360° aux deux bouts'], ['queue', 'Blindage raccordé par une longue « queue de cochon »', ''], ['plaque', 'Plaque de fond métallique non peinte', 'masses reliées au plus court'], ['mixte', 'Câbles moteur et capteurs dans la même goulotte', ''], ['filtre', 'Filtre CEM au plus près du variateur', ''], ['blsig', 'Paire torsadée blindée pour le signal', ''], ['boucle', 'Grandes boucles entre conducteur aller et retour', ''], ['tresse', 'Tresses de masse courtes et larges', '']],
    cases: [
      { q: 'Installer un variateur de vitesse dans une armoire, câble moteur de 30 m.', need: ['blind', 'plaque', 'filtre', 'sep'], no: ['queue', 'mixte', 'boucle'], why: "Le variateur produit des fronts de tension très raides : blindage repris sur 360°, filtre au plus près, plaque conductrice et séparation des câbles." },
      { q: 'Câbler un capteur analogique 4-20 mA à côté de départs moteurs.', need: ['sep', 'blsig'], no: ['mixte', 'boucle', 'queue'], why: 'Un signal analogique faible doit être éloigné des câbles de puissance et transporté par une paire torsadée blindée.' },
      { q: "Relier les masses d'une armoire et d'une machine pour les hautes fréquences.", need: ['tresse', 'plaque'], no: ['queue', 'boucle'], why: "En haute fréquence, c'est la surface et la faible longueur de la liaison qui comptent : tresses courtes et larges, contacts métal sur métal." }
    ] };
  const COORD = { title: 'Coordination des départs moteurs (IEC 60947-4-1)', items: [['t1', 'Type 1', ''], ['t2', 'Type 2', '']],
    cases: [
      { q: "Après un court-circuit, le démarreur peut être endommagé et doit être réparé ou remplacé, mais sans danger pour les personnes ni l'installation.", need: ['t1'], no: ['t2'], why: 'Définition de la coordination de type 1.' },
      { q: 'Après un court-circuit, le démarreur doit rester apte à fonctionner ; une légère soudure des contacts, facilement séparable, est admise.', need: ['t2'], no: ['t1'], why: 'Définition de la coordination de type 2 : à privilégier quand la continuité de service compte.' },
      { q: "Ligne de production où un arrêt prolongé coûte cher : quelle coordination viser ?", need: ['t2'], no: ['t1'], why: 'Le type 2 permet de remettre en service rapidement après élimination du défaut, sans remplacer le démarreur.' }
    ] };
  const REVUE = { title: 'Revue de conception : que vérifier ?', items: [['ib', 'I<sub>b</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub>', 'échauffement'], ['du', 'Chute de tension ≤ limite', ''], ['pdc', 'Pouvoir de coupure ≥ I<sub>cc</sub> maximal', ''], ['lmax', 'I<sub>cc</sub> minimal ou longueur maximale', 'protection des personnes'], ['slt', 'Cohérence avec le schéma de liaison à la terre', ''], ['rep', 'Repères identiques schéma / bornier / fils', ''], ['nom', 'Nomenclature à jour', 'références, quantités'], ['gros', 'Calibres pris « au plus gros » pour éviter les déclenchements', ''], ['arbi', 'Couleurs de fils choisies au hasard', '']],
    cases: [
      { q: "Revue d'un départ moteur de 22 kW situé à 80 m du tableau général.", need: ['ib', 'du', 'pdc', 'lmax'], no: ['gros'], why: "Un long départ : l'échauffement, la chute de tension, le court-circuit maximal (pouvoir de coupure) et minimal (protection des personnes) se vérifient tous." },
      { q: "Revue avant d'envoyer les plans à l'atelier de câblage.", need: ['rep', 'nom'], no: ['arbi'], why: 'Le câbleur doit pouvoir réaliser et contrôler sans interpréter : repères cohérents et nomenclature exacte.' },
      { q: "Revue de la protection des personnes d'un atelier en TN-S.", need: ['lmax', 'slt'], no: ['gros'], why: 'En TN, un défaut est un court-circuit : il faut que le courant minimal fasse déclencher la protection à temps.' }
    ] };
  SIMS.cem = el => SIMS.choose(el, CEM);
  SIMS.coord = el => SIMS.choose(el, COORD);
  SIMS.revue = el => SIMS.choose(el, REVUE);

  Object.assign(AA.VISDATA.ORDER, {
    ce: { title: 'Mise sur le marché d\'une machine : remets les étapes dans l\'ordre', steps: [
      ['Identifier la réglementation et les normes harmonisées applicables', "Directive Machines 2006/42/CE, remplacée par le règlement (UE) 2023/1230 à partir du 20 janvier 2027."],
      ['Apprécier les risques (ISO 12100)', 'On ne peut réduire que des risques identifiés.'],
      ['Réduire les risques : prévention intrinsèque, puis protections, puis information', "C'est la méthode en trois étapes, dans cet ordre de priorité."],
      ["Vérifier l'équipement électrique (IEC 60204-1, chapitre 18)", 'Continuité du circuit de protection, isolement, essais de tension et fonctionnels.'],
      ['Constituer le dossier technique et la notice d\'instructions', 'Ils prouvent la conformité et accompagnent la machine.'],
      ['Établir et signer la déclaration UE de conformité', 'Le fabricant engage sa responsabilité.'],
      ['Apposer le marquage CE', 'En dernier : il atteste que tout ce qui précède a été fait.']] },
    reduc: { title: 'Réduire un risque : dans quel ordre de priorité ?', steps: [
      ['Supprimer ou réduire le danger dès la conception', 'Prévention intrinsèque : la meilleure mesure est celle qui ne dépend de personne.'],
      ['Ajouter des protecteurs et dispositifs de protection', 'Carters, barrières immatérielles, verrouillages.'],
      ["Informer : signalisation, notice, formation", "En dernier recours, pour le risque résiduel."]] }
  });
  const SVG_MACH = `<svg viewBox="0 0 420 230" class="hot-svg"><rect x="10" y="10" width="250" height="210" rx="6" class="h-box"/>
    <g data-spot="sect"><rect x="230" y="60" width="44" height="80" rx="6" class="h-dev"/><rect x="240" y="80" width="24" height="40" rx="4" style="fill:#d7263d;stroke:#f3c623;stroke-width:5"/></g>
    <g data-spot="trafo"><rect x="30" y="30" width="70" height="56" rx="4" class="h-dev"/><text x="44" y="64" class="h-txt">T1</text></g>
    <g data-spot="pe"><rect x="30" y="180" width="110" height="18" rx="3" class="h-pe"/><text x="150" y="194" class="h-txt">PE</text></g>
    <g data-spot="fils"><path d="M120 40 C 150 60, 150 120, 120 150" class="h-line" style="stroke:#d7263d;stroke-width:3"/><path d="M135 40 C 165 60, 165 120, 135 150" class="h-line" style="stroke:#1565c0;stroke-width:3"/><path d="M150 40 C 180 60, 180 120, 150 150" class="h-line" style="stroke:#f08c00;stroke-width:3"/></g>
    <g data-spot="ip"><rect x="10" y="10" width="250" height="14" class="h-win"/><text x="20" y="21" class="h-txt" style="font-size:10px">enveloppe</text></g>
    <g data-spot="au"><rect x="290" y="40" width="120" height="110" rx="6" class="h-box"/><circle cx="350" cy="80" r="26" style="fill:#f3c623"/><circle cx="350" cy="80" r="16" class="h-btn-r"/><circle cx="320" cy="128" r="9" class="h-btn-g"/><circle cx="380" cy="128" r="9" style="fill:#1565c0;stroke:var(--bezel-3);stroke-width:3"/></g>
    <g data-spot="plaque"><rect x="290" y="170" width="120" height="50" rx="4" class="h-dev"/><text x="300" y="200" class="h-txt" style="font-size:10px">Plaque signalétique</text></g></svg>`;
  const SPOTS_MACH = {
    sect: ["Dispositif de sectionnement de l'alimentation", 'Un par source, manœuvrable de l\'extérieur et condamnable en position ouverte (cadenas). Poignée rouge sur fond jaune s\'il sert aussi à la coupure d\'urgence ; sinon noire ou grise.'],
    trafo: ['Transformateur de commande', "Les circuits de commande en alternatif sont alimentés par un transformateur à enroulements séparés (exceptions limitées pour les machines très simples). Le secondaire est protégé contre les surintensités."],
    pe: ['Circuit de protection', "Borne PE repérée près du raccordement réseau ; toutes les masses y sont reliées. Sa continuité est vérifiée par un essai avant la mise en service."],
    fils: ['Couleurs des conducteurs', 'Obligatoire : vert-jaune pour le PE, bleu clair pour le neutre. Recommandé : noir pour la puissance, rouge pour la commande en alternatif, bleu pour la commande en continu, orange pour les circuits d\'asservissement restant sous tension quand le sectionneur est ouvert.'],
    ip: ['Degré de protection', "Les enveloppes de l'équipement électrique offrent au moins IP22 ; davantage selon l'environnement (poussières, lavage)."],
    au: ["Arrêt d'urgence et pupitre", "Arrêt d'urgence rouge sur fond jaune, à accrochage, provoquant un arrêt de catégorie 0 ou 1 (IEC 60204-1, ISO 13850). Son déverrouillage ne doit pas redémarrer la machine. Bleu : réarmement (action obligatoire)."],
    plaque: ["Marquage de l'équipement", 'Nom du fournisseur, tension, nombre de phases, fréquence, courant à pleine charge, courant de court-circuit assigné, numéro des documents.']
  };
  AA.VISDATA.HOT.machine = [SVG_MACH, SPOTS_MACH, "L'équipement électrique d'une machine (IEC 60204-1)"];

  /* ================= LEÇONS ================= */
  const TS = [30, 35, 40, 45], NS = [1, 2, 3, 4];
  L.n5m1l1 = { min: 10, why: "Tout dimensionnement commence par le courant que le circuit transportera réellement, et par les conditions qui gênent son refroidissement.", screens: [[
    { h: "Courant d'emploi et facteurs de correction" },
    { formula: 'I<sub>b</sub> = P<sub>u</sub> / (η √3 U cos φ)      I<sub>z requis</sub> = I<sub>n</sub> / (k<sub>T</sub> × k<sub>G</sub> × …)' },
    { p: "Le courant admissible d'un câble est donné pour des conditions de référence (30 °C dans l'air, circuit seul). Une ambiance plus chaude ou des câbles groupés évacuent moins bien la chaleur : on divise le calibre par les facteurs de correction pour trouver le courant admissible que doit offrir la section." },
    { num: { id: 'ib', gen: r => { const P = r.pick([7.5, 11, 15, 22]), eta = r.pick([0.88, 0.9, 0.92]), c = r.pick([0.82, 0.85, 0.86]); const v = DS.ib(P, eta, c); return { q: `Moteur triphasé 400 V : <b>${AA.fmt(P)} kW</b> utiles, rendement <b>${AA.fmt(eta)}</b>, cos φ <b>${AA.fmt(c)}</b>. Courant d'emploi ?`, a: v, unit: 'A', tol: 0.02, sol: `I_b = ${P * 1000} / (${AA.fmt(eta)} × √3 × 400 × ${AA.fmt(c)}) = ${AA.fmt(v, 1)} A` }; } } },
    { num: { id: 'izr', gen: r => { const In = r.pick([25, 32, 40, 63]), t = r.pick(TS), n = r.pick(NS); const v = In / (T.KT[t] * T.KG[n]); return { q: `Disjoncteur <b>${In} A</b>, ambiance <b>${t} °C</b> (k<sub>T</sub> = ${AA.fmt(T.KT[t])}), <b>${n}</b> circuit(s) jointif(s) (k<sub>G</sub> = ${AA.fmt(T.KG[n])}). Courant admissible requis ?`, a: v, unit: 'A', tol: 0.02, sol: `I_z ≥ ${In} / (${AA.fmt(T.KT[t])} × ${AA.fmt(T.KG[n])}) = ${AA.fmt(v, 1)} A` }; } } }
  ]] };
  L.n5m1l2 = { min: 11, why: "Une section trop faible chauffe et vieillit l'isolant ; trop forte, elle coûte et encombre.", screens: [[
    { h: 'Choisir la section' },
    { formula: 'I<sub>b</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub>', small: 'Avec un disjoncteur, I2 ≤ 1,45 Iz est alors automatiquement respecté (I2 = 1,45 In au plus pour un disjoncteur IEC 60898).' },
    { p: "On lit, dans le tableau du mode de pose, la plus petite section dont le courant admissible atteint le courant requis. Puis on vérifie la chute de tension, qui peut imposer une section supérieure sur les grandes longueurs." },
    { num: { id: 'sec', gen: r => { const Ib = r.pick([20, 28, 36, 45, 58]), t = r.pick(TS), n = r.pick(NS); const s = T.size({ Ib, tri: true, pose: 'C', T: t, n, L: 10, cos: 0.85, limit: 99 }); return { q: `Circuit triphasé, cuivre PVC fixé aux parois (méthode C), I<sub>b</sub> = <b>${Ib} A</b>, ${t} °C, ${n} circuit(s) jointif(s). Section minimale pour l'échauffement (mm²) ?`, a: s.Sth, unit: 'mm²', tol: 0.001, sol: `I_n = ${s.In} A ; I_z requis = ${AA.fmt(s.izReq, 1)} A ; tableau C, 3 conducteurs chargés : ${s.Sth} mm²` }; } } }
  ]] };
  L.n5m1l3 = { min: 9, why: "Un moteur qui démarre sous une tension trop basse peine, chauffe ou ne démarre pas.", screens: [[
    { h: 'Chute de tension' },
    { formula: 'u = b (ρ<sub>1</sub> L cos φ / S + λ L sin φ) I<sub>b</sub>      Δu % = 100 u / U<sub>0</sub>', small: 'b = 1 en triphasé, 2 en monophasé ; ρ1 = 0,0225 Ω·mm²/m (cuivre) ; λ = 0,08 mΩ/m ; U0 = 230 V' },
    { table: { head: ['Installation', 'Éclairage', 'Autres usages'], rows: [['Alimentée par le réseau public BT', '3 %', '5 %'], ['Alimentée par un poste privé HT/BT', '6 %', '8 %']] } },
    { p: "Limites de la NF C 15-100 (§ 525) entre l'origine de l'installation et le récepteur. Pour un moteur, on vérifie aussi la chute au démarrage (souvent limitée à 15 %)." },
    { num: { id: 'du', gen: r => { const L = r.pick([40, 60, 80, 120]), S = r.pick([4, 6, 10, 16]), Ib = r.pick([18, 25, 32]); const v = T.dU(true, L, S, 0.85, Ib); return { q: `Triphasé, <b>${L} m</b> de câble cuivre <b>${S} mm²</b>, I<sub>b</sub> = <b>${Ib} A</b>, cos φ 0,85. Chute de tension en % ?`, a: v, unit: '%', tol: 0.02, sol: `u = (0,0225 × ${L} × 0,85 / ${S} + 0,00008 × ${L} × 0,527) × ${Ib} = ${AA.fmt(v * 2.3, 2)} V ; Δu = ${AA.fmt(v, 2)} %` }; } } }
  ]] };
  L.n5m1l4 = { min: 11, why: "Le courant de court-circuit fixe le pouvoir de coupure des appareils ; le courant minimal, la protection des personnes.", screens: [[
    { h: 'Courants de court-circuit' },
    { list: ["<b>I<sub>cc</sub> maximal</b> (triphasé, au point d'installation) : choisit le pouvoir de coupure et vérifie la tenue des jeux de barres.", "<b>I<sub>cc</sub> minimal</b> (en bout de circuit, conducteurs chauds) : doit faire fonctionner la protection assez vite.", "Aux bornes d'un transformateur : I<sub>cc</sub> ≈ S<sub>n</sub> / (√3 U<sub>20</sub> u<sub>cc</sub>), en négligeant le réseau amont."] },
    { num: { id: 'icc', gen: r => { const k = r.pick([250, 400, 630, 1000, 1600]), u = T.ucc(k); const v = DS.iccTransfo(k, u) / 1000; return { q: `Transformateur <b>${k} kVA</b>, u<sub>cc</sub> = <b>${u} %</b>, tension à vide 410 V. Courant de court-circuit à ses bornes (réseau amont négligé), en kA ?`, a: v, unit: 'kA', tol: 0.02, sol: `I_cc = ${k * 1000} / (√3 × 410 × ${u / 100}) = ${AA.fmt(v, 1)} kA` }; } } }
  ]] };
  L.n5m1l5 = { min: 9, why: "Pendant un court-circuit, le câble doit survivre jusqu'à la coupure sans que son isolant ne soit détruit.", screens: [[
    { h: 'Contraintes thermiques' },
    { formula: 'S ≥ √(I² t) / k', small: 'k = 115 (cuivre isolé PVC), 143 (cuivre isolé PR ou EPR) ; t ≤ 5 s (IEC 60364-4-43)' },
    { num: { id: 'i2t', gen: r => { const I = r.pick([4, 6, 8, 10]), t = r.pick([0.1, 0.2, 0.4]), k = r.pick([115, 143]); const v = DS.sMin(I * 1000, t, k); return { q: `Court-circuit de <b>${I} kA</b> coupé en <b>${AA.fmt(t)} s</b>, câble cuivre ${k === 115 ? 'PVC' : 'PR'} (k = ${k}). Section minimale théorique (mm²) ?`, a: v, unit: 'mm²', tol: 0.02, sol: `S = √(${I * 1000}² × ${AA.fmt(t)}) / ${k} = ${AA.fmt(v, 1)} mm² → section normalisée immédiatement supérieure` }; } } }
  ]] };
  L.n5m2l1 = { min: 8, why: "Un disjoncteur incapable de couper le courant de court-circuit peut exploser.", screens: [[
    { h: 'Pouvoir de coupure' },
    { p: "Le pouvoir de coupure (I<sub>cu</sub> pour les disjoncteurs industriels IEC 60947-2, I<sub>cn</sub> pour les disjoncteurs domestiques IEC 60898-1) doit être au moins égal au courant de court-circuit maximal présumé à l'endroit où l'appareil est installé." },
    { quiz: { q: "Au tableau général, I<sub>cc</sub> maximal = 18 kA. Quel disjoncteur peut y être installé (sans filiation) ?", opts: ['PdC 10 kA', 'PdC 15 kA', 'PdC 25 kA', 'Tous : le pouvoir de coupure ne compte qu\'en surcharge'], a: 2, why: 'Il faut I_cu ≥ 18 kA : seul le 25 kA convient.' } }
  ]] };
  L.n5m2l2 = { min: 11, why: "La sélectivité évite qu'un défaut sur une prise ne plonge toute l'usine dans le noir.", screens: [[
    { h: 'Sélectivité' },
    { list: ['<b>Ampèremétrique</b> : seuils de déclenchement différents ; le seuil magnétique de l\'amont doit dépasser le courant de défaut vu par l\'aval.', '<b>Chronométrique</b> : l\'amont est temporisé (de quelques dizaines à quelques centaines de ms) pour laisser l\'aval couper.', '<b>Énergétique</b> : l\'aval, limiteur, coupe si vite que l\'énergie ne suffit pas à faire déclencher l\'amont (données constructeur).', 'La sélectivité est <b>totale</b> si elle est assurée jusqu\'au courant de court-circuit maximal, sinon <b>partielle</b>.'] },
    { quiz: { q: 'Amont C63 (seuil magnétique 315 à 630 A), aval C16. Défaut franc de 1,2 kA en aval du C16. La sélectivité est…', opts: ['totale', 'partielle : assurée seulement jusqu\'à environ 315 A', 'impossible à cause du thermique', 'garantie car 63 > 1,6 × 16'], a: 1, why: '1,2 kA dépasse le seuil magnétique bas de l\'amont : les deux peuvent déclencher. Sans table constructeur, la sélectivité est limitée à environ 315 A.' } }
  ]] };
  L.n5m2l3 = { min: 8, why: "La filiation permet d'installer des appareils moins chers en aval, à condition de respecter les associations testées.", screens: [[
    { h: 'Filiation' },
    { p: "Un disjoncteur amont limiteur aide l'appareil aval à couper un court-circuit supérieur à son propre pouvoir de coupure. Ce pouvoir de coupure renforcé n'existe que pour des associations testées et publiées par le constructeur." },
    { warn: "La filiation se fait au détriment de la sélectivité : sur un fort court-circuit, les deux appareils s'ouvrent. On ne l'emploie qu'en connaissance de cause, et jamais en mélangeant des marques sans table d'essais." }
  ]] };
  L.n5m2l4 = { min: 8, why: "Un départ moteur associe plusieurs appareils : leur coordination décide de l'état du démarreur après un court-circuit.", screens: [[
    { h: 'Coordination type 1 et type 2' },
    { p: "Disjoncteur (ou fusibles), contacteur et relais thermique forment un départ moteur. L'IEC 60947-4-1 définit deux niveaux de coordination, garantis par les tables du constructeur." }
  ]] };
  L.n5m3l1 = { min: 10, why: "Le TT est le schéma des logements raccordés au réseau public : la protection repose entièrement sur les différentiels.", screens: [[
    { h: 'Régime TT' },
    { p: "Neutre du transformateur relié à la terre, masses de l'installation reliées à une prise de terre locale. Le courant de défaut, limité par les deux prises de terre, est trop faible pour un disjoncteur : un dispositif différentiel coupe." },
    { formula: 'R<sub>A</sub> × I<sub>Δn</sub> ≤ 50 V' },
    { num: { id: 'ra', gen: r => { const d = r.pick([30, 100, 300, 500]); return { q: `Différentiel <b>${d} mA</b> en tête d'installation. Résistance maximale de la prise de terre des masses ?`, a: 50 / (d / 1000), unit: 'Ω', tol: 0.01, sol: `R_A ≤ 50 / ${AA.fmt(d / 1000)} = ${AA.fmt(50 / (d / 1000), 0)} Ω` }; } } }
  ]] };
  L.n5m3l2 = { min: 11, why: "En TN, un défaut d'isolement est un court-circuit : c'est le disjoncteur qui protège les personnes, à condition que le circuit ne soit pas trop long.", screens: [[
    { h: 'Régime TN-C et TN-S' },
    { list: ['Neutre relié à la terre, masses reliées au neutre par le conducteur de protection.', '<b>TN-C</b> : neutre et PE confondus (PEN). Interdit pour les sections inférieures à 10 mm² cuivre (16 mm² aluminium) et dans les locaux à risque d\'incendie ou d\'explosion ; aucun différentiel possible sur un PEN.', '<b>TN-S</b> : neutre et PE séparés.', 'Condition : le courant de défaut minimal doit faire déclencher la protection dans le temps imparti (0,4 s pour un circuit terminal ≤ 32 A en 230 V).'] },
    { formula: 'L<sub>max</sub> = 0,8 U<sub>0</sub> S<sub>ph</sub> / (ρ (1 + m) I<sub>m</sub>)', small: 'ρ = 0,023 Ω·mm²/m (cuivre chaud), m = Sph/SPE, Im : seuil de déclenchement magnétique (10 In pour la courbe C)' },
    { num: { id: 'lmax', gen: r => { const In = r.pick([10, 16, 20, 32]), S = r.pick([1.5, 2.5, 4, 6]); const v = DS.lMax({ S, m: 1, Im: 10 * In }); return { q: `Circuit TN-S 230 V, cuivre <b>${AA.fmt(S)} mm²</b> (PE de même section), disjoncteur <b>C${In}</b>. Longueur maximale protégée ?`, a: v, unit: 'm', tol: 0.02, sol: `L_max = 0,8 × 230 × ${AA.fmt(S)} / (0,023 × 2 × ${10 * In}) = ${AA.fmt(v, 0)} m` }; } } }
  ]] };
  L.n5m3l3 = { min: 9, why: "Le régime IT garde l'installation en service au premier défaut : bloc opératoire, process continu, navire.", screens: [[
    { h: 'Régime IT et contrôleur d\'isolement' },
    { list: ['Neutre isolé de la terre (ou relié par une forte impédance), masses à la terre.', 'Premier défaut : courant très faible, pas de danger, <b>pas de coupure</b>. Le contrôleur permanent d\'isolement (CPI) le signale.', 'Le premier défaut doit être recherché et éliminé rapidement.', 'Second défaut sur une autre phase : court-circuit par les masses, la protection doit couper comme en TN.'] },
    { quiz: { q: 'En IT, le CPI signale un défaut. Que fait-on ?', opts: ['Rien, le régime IT est conçu pour ça', 'On recherche et on élimine le défaut sans tarder', 'On met le neutre à la terre', 'On remplace le CPI'], a: 1, why: "Un second défaut provoquerait une coupure, voire un danger si la protection est mal coordonnée : le premier doit être éliminé." } }
  ]] };
  L.n5m3l4 = { min: 9, why: "Le choix du régime de neutre engage la sécurité, la continuité de service et le coût de toute l'installation.", screens: [[
    { h: 'Choisir un régime de neutre' },
    { table: { head: ['', 'TT', 'TN-S', 'IT'], rows: [['Où ?', 'Réseau public BT (logements, petits tertiaires)', 'Installations avec poste HT/BT privé', 'Continuité exigée (hôpital, process)'], ['Protection des personnes', 'Différentiels', 'Disjoncteurs (+ vérification de L<sub>max</sub>)', 'CPI + coupure au second défaut'], ['Au premier défaut', 'Coupure', 'Coupure', 'Alarme seulement'], ['Points de vigilance', 'Valeur de la prise de terre', 'Longueurs, PE, courants de défaut élevés', 'Personnel qualifié pour la recherche de défaut']] } }
  ]] };
  L.n5m4l1 = { min: 10, why: "L'IEC 60204-1 est la norme de référence de l'équipement électrique des machines.", screens: [[
    { h: 'IEC 60204-1 : les exigences essentielles' },
    { p: "Sectionnement de l'alimentation, protection contre les chocs électriques, protection des équipements, fonctions d'arrêt et d'arrêt d'urgence, circuits de commande, repérage des conducteurs, documentation et vérifications : chaque point de la machine ci-dessous correspond à une exigence." }
  ]] };
  L.n5m4l2 = { min: 8, why: "Un coffret mal choisi pour son environnement laisse entrer l'eau, la poussière… et la panne.", screens: [[
    { h: 'Indices IP et IK' },
    { p: "IP (IEC 60529) : premier chiffre pour les corps solides (0 à 6), deuxième pour l'eau (0 à 9). IK (IEC 62262) : résistance aux chocs, de IK01 (0,14 J) à IK10 (20 J). Un X remplace un chiffre non spécifié (IPX4)." }
  ]] };
  L.n5m4l3 = { min: 9, why: "Les variateurs et l'électronique perturbent et sont perturbés : la CEM se règle à la conception, pas après.", screens: [[
    { h: 'Compatibilité électromagnétique' },
    { list: ["Un appareil ne doit pas émettre de perturbations excessives et doit supporter celles de son environnement (directive 2014/30/UE).", 'Équipotentialité haute fréquence : plaque métallique, liaisons courtes et larges.', 'Séparation des familles de câbles (puissance, commande, signaux faibles).', 'Blindages repris sur 360° ; filtres au plus près des sources.'] }
  ]] };
  L.n5m4l4 = { min: 9, why: "Sans dossier technique ni marquage CE, une machine ne peut pas être mise sur le marché européen.", screens: [[
    { h: 'Dossier technique et marquage CE' },
    { p: "Le fabricant apprécie les risques, les réduit, vérifie, documente, puis signe la déclaration UE de conformité avant d'apposer le marquage CE. Le règlement (UE) 2023/1230 remplacera la directive 2006/42/CE à partir du 20 janvier 2027." }
  ]] };
  L.n5m5l1 = { min: 10, why: "Le bilan de puissance dimensionne le transformateur, le tableau général et l'abonnement.", screens: [[
    { h: 'Synoptique et bilan de puissance' },
    { list: ["Recenser les récepteurs et leurs puissances absorbées.", "Appliquer le facteur d'utilisation k<sub>u</sub> (un moteur fonctionne rarement à pleine charge) et le facteur de simultanéité k<sub>s</sub> (tous ne fonctionnent pas en même temps).", 'Additionner séparément les puissances actives et réactives, puis calculer S = √(P² + Q²).', "Prévoir une réserve d'extension raisonnable et choisir le transformateur normalisé."] }
  ]] };
  L.n5m5l2 = { min: 9, why: "Les folios traduisent toutes les décisions de conception en un document que le câbleur peut suivre.", screens: [[
    { h: 'Folios de puissance et de commande' },
    { p: "Un folio de puissance par départ (protection, contacteurs, récepteur, sections et repères), des folios de commande (logique, sécurités), des renvois croisés entre bobines et contacts. Manipule le folio vivant du démarrage étoile-triangle : chaque organe porte son repère et ses renvois." }
  ]] };
  L.n5m5l3 = { min: 8, why: "Bornier, nomenclature et plan d'implantation permettent de câbler, commander le matériel et dépanner.", screens: [[
    { h: 'Borniers, nomenclature, implantation' },
    { list: ['<b>Plan de bornier</b> : chaque borne, son repère, ce qui arrive de l\'armoire et ce qui part vers le terrain.', '<b>Nomenclature</b> : repère, désignation, référence constructeur, quantité.', "<b>Implantation</b> : position des appareils dans l'armoire, goulottes, réserve (souvent 20 à 30 % de place libre pour les évolutions)."] }
  ]] };
  L.n5m5l4 = { min: 9, why: "Une revue de conception trouve sur le papier les erreurs qui coûteraient cher sur le chantier.", screens: [[
    { h: 'Revue de conception' },
    { p: "Avant de diffuser les plans, on vérifie point par point les calculs (échauffement, chute de tension, court-circuit maximal et minimal, sélectivité), la cohérence avec le schéma de liaison à la terre, et la qualité du dossier (repères, nomenclature, révisions)." }
  ]] };

  Object.assign(AA.VISMAP, {
    n5m1l1: [{ sim: 'izcalc' }], n5m1l2: [{ sim: 'izcalc' }], n5m1l3: [{ sim: 'lab', opts: { id: 'ligne' } }], n5m1l4: [{ sim: 'icc' }], n5m1l5: [{ sim: 'i2t' }],
    n5m2l1: [{ sim: 'icc' }], n5m2l2: [{ sim: 'selec' }], n5m2l3: [{ sim: 'filiation' }], n5m2l4: [{ sim: 'coord' }],
    n5m3l1: [{ sim: 'slt', opts: { reg: 'TT' } }], n5m3l2: [{ sim: 'slt', opts: { reg: 'TN' } }], n5m3l3: [{ sim: 'slt', opts: { reg: 'IT' } }], n5m3l4: [{ sim: 'slt', opts: { reg: 'TT' } }],
    n5m4l1: [{ hot: 'machine' }], n5m4l2: [{ sim: 'ipik' }], n5m4l3: [{ sim: 'cem' }], n5m4l4: [{ order: 'ce' }, { order: 'reduc' }],
    n5m5l1: [{ sim: 'bilan' }], n5m5l2: [{ sim: 'folio', opts: { cid: 'etoile' } }], n5m5l3: [{ hot: 'born' }], n5m5l4: [{ sim: 'revue' }]
  });
})();
