/* Niveau « Électrotechnique » : régime alternatif, transformateur, moteur asynchrone, autres machines.
 * Simulations propres : Fresnel R-L-C, champ tournant, pertes du transformateur, indice horaire,
 * bilan des puissances du moteur, moteur à courant continu, moteur pas-à-pas, machine synchrone. */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n);
  const E = AA.ELEC = {};
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const arrow = (g, x0, y0, x1, y1, col, w) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w || 2.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 10 * Math.cos(a - 0.4), y1 - 10 * Math.sin(a - 0.4)); g.lineTo(x1 - 10 * Math.cos(a + 0.4), y1 - 10 * Math.sin(a + 0.4)); g.fill(); };

  /* ---------- Modèles ---------- */
  E.rlc = (R, Lh, Cuf, f, U) => { const w = 2 * Math.PI * f, XL = Lh * w, XC = Cuf > 0 ? 1 / (Cuf * 1e-6 * w) : 0, X = XL - XC, Z = Math.hypot(R, X), I = U / Z, phi = Math.atan2(X, R); return { XL, XC, Z, I, phi, P: U * I * Math.cos(phi), Q: U * I * Math.sin(phi), S: U * I }; };
  E.transfo = (Sn, Pfe, Pcc, x, cos) => { const P2 = x * Sn * cos, Pcu = Pcc * x * x; return { P2, Pcu, eta: P2 / (P2 + Pfe + Pcu) }; };
  E.clock = c => ({ Yy0: 0, Dyn11: 11, Yd11: 11, Dyn5: 5, Yzn11: 11, Dd0: 0 })[c];
  E.async = ({ Pabs, Pfs, Pjs, g, Pm }) => { const Ptr = Pabs - Pfs - Pjs, Pjr = g * Ptr, Pmec = Ptr - Pjr, Pu = Pmec - Pm; return { Ptr, Pjr, Pmec, Pu, eta: Pu / Pabs }; };
  E.dc = ({ U, R, k, T }) => { const I = T / k, Ecemf = U - R * I, w = Ecemf / k; return { I, E: Ecemf, n: w * 60 / (2 * Math.PI) }; };

  /* ---------- Fresnel : circuit R, L, C ---------- */
  SIMS.fresnel = el => {
    const st = { R: 40, L: 100, C: 0 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('R', 'Résistance R', 1, 200, 1, 40, 'Ω')}${sl('L', 'Inductance L', 0, 500, 5, 100, 'mH')}${sl('C', 'Capacité C', 0, 200, 1, 0, 'µF')}</div>
      <div class="simout"><div><span>Impédance Z</span><b class="o-z"></b></div><div><span>Déphasage φ (tension / courant)</span><b class="o-p"></b></div><div><span>Courant sous 230 V, 50 Hz</span><b class="o-i"></b></div><div><span>cos φ</span><b class="o-c"></b></div></div></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 240, (g, W, H, t) => {
      const r = E.rlc(st.R, st.L / 1000, st.C, 50, 230), phD = r.phi * 180 / Math.PI;
      el.querySelector('.o-z').textContent = AA.fmt(r.Z, 1) + ' Ω'; el.querySelector('.o-i').textContent = AA.fmt(r.I, 2) + ' A'; el.querySelector('.o-c').textContent = Math.cos(r.phi).toFixed(3);
      el.querySelector('.o-p').textContent = (phD >= 0 ? '+' : '') + AA.fmt(phD, 1) + '° ' + (Math.abs(phD) < 0.5 ? '(en phase)' : phD > 0 ? '(courant en retard : inductif)' : '(courant en avance : capacitif)');
      const cx = W * 0.24, cy = H / 2, R0 = Math.min(90, H / 2 - 20), w = t * 1.2;
      g.strokeStyle = css('--line'); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.stroke();
      arrow(g, cx, cy, cx + R0 * Math.cos(w), cy - R0 * Math.sin(w), css('--copper'), 3);
      const ri = R0 * Math.min(1, r.I / 5) * 0.9 + 12;
      arrow(g, cx, cy, cx + ri * Math.cos(w - r.phi), cy - ri * Math.sin(w - r.phi), css('--teal'), 3);
      g.fillStyle = css('--copper'); g.font = '700 12px Bahnschrift'; g.fillText('U', cx + R0 * Math.cos(w) + 6, cy - R0 * Math.sin(w));
      g.fillStyle = css('--teal'); g.fillText('I', cx + ri * Math.cos(w - r.phi) + 6, cy - ri * Math.sin(w - r.phi));
      const x0 = W * 0.48, x1 = W - 12, A = H * 0.36;
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, cy); g.lineTo(x1, cy); g.stroke();
      [[0, css('--copper'), A], [r.phi, css('--teal'), A * Math.min(1, r.I / 5) * 0.9 + 6]].forEach(([p, col, amp]) => { g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath(); for (let x = x0; x <= x1; x += 2) { const a = w - (x - x0) / (x1 - x0) * 4 * Math.PI - p; const y = cy - amp * Math.sin(a); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); });
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(`X_L = Lω = ${AA.fmt(r.XL, 1)} Ω   X_C = 1/(Cω) = ${st.C ? AA.fmt(r.XC, 1) + ' Ω' : '—'}`, x0, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Champ tournant (et rotor à cage ou à aimants) ---------- */
  SIMS.champ = el => {
    const st = { f: 1 }; let inv = false, rotor = 'cage', ang = 0, rot = 0, ph = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('f', 'Fréquence (ralentie)', 0.2, 2, 0.1, 1, 'tr/s affichés')}<button class="btn sm js-i">Croiser deux phases</button><div class="seg js-r"><button data-r="cage" class="on">Rotor à cage (asynchrone)</button><button data-r="pm">Rotor à aimants (synchrone)</button></div></div><p class="muted js-d" style="padding:0 16px 14px;font-size:13px"></p></div>`;
    bind(el, st, { f: v => AA.fmt(v, 1) });
    el.querySelector('.js-i').onclick = () => { inv = !inv; };
    el.querySelectorAll('.js-r button').forEach(b => b.onclick = () => { rotor = b.dataset.r; el.querySelectorAll('.js-r button').forEach(x => x.classList.toggle('on', x === b)); });
    let last = 0;
    const cv = AA.canvas(el.querySelector('.simview'), 250, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t;
      // ph : phase électrique des courants ; bobine k placée à k × 120°, courant i_k = cos(ph ∓ k × 120°).
      // Somme des trois champs = 3/2 × vecteur unitaire d'angle ±ph : le champ tourne, en sens inverse si deux phases sont croisées.
      const dir = inv ? -1 : 1; ph += st.f * 2 * Math.PI * dt; const prev = ang; ang = dir * ph;
      const dAng = Math.abs(ang - prev) < 1 ? ang - prev : 0;
      if (rotor === 'pm') rot = ang - 0.35 * dir; else rot += dAng * 0.95;
      const cx = W / 2, cy = H / 2, R0 = Math.min(W, H) * 0.36;
      const cols = [css('--pot-L1'), css('--pot-L2'), css('--pot-L3')];
      for (let k = 0; k < 3; k++) {
        const a = k * 2 * Math.PI / 3, i = Math.cos(ph - dir * k * 2 * Math.PI / 3);
        for (const s of [0, Math.PI]) { const x = cx + Math.cos(a + s) * (R0 + 18), y = cy - Math.sin(a + s) * (R0 + 18); g.fillStyle = cols[k]; g.globalAlpha = 0.2 + 0.8 * Math.abs(i); g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
        g.globalAlpha = 1;
      }
      g.strokeStyle = css('--line-2'); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.stroke();
      // rotor
      g.save(); g.translate(cx, cy); g.rotate(-rot);
      if (rotor === 'pm') { g.fillStyle = '#c62828'; g.fillRect(-R0 * 0.55, -14, R0 * 0.55, 28); g.fillStyle = '#1565c0'; g.fillRect(0, -14, R0 * 0.55, 28); g.fillStyle = '#fff'; g.font = '700 12px Bahnschrift'; g.fillText('S', -R0 * 0.32, 5); g.fillText('N', R0 * 0.25, 5); }
      else { g.strokeStyle = css('--ink-3'); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(a) * R0 * 0.3, Math.sin(a) * R0 * 0.3); g.lineTo(Math.cos(a) * R0 * 0.62, Math.sin(a) * R0 * 0.62); g.stroke(); } }
      g.restore();
      arrow(g, cx, cy, cx + Math.cos(ang) * R0 * 0.85, cy - Math.sin(ang) * R0 * 0.85, css('--copper'), 4);
      el.querySelector('.js-d').textContent = `Trois bobines décalées de 120°, alimentées par trois courants décalés de 120°, créent un champ magnétique (flèche) qui tourne ${inv ? 'dans le sens horaire : deux phases ont été croisées, le sens de rotation s\'inverse' : 'dans le sens antihoraire'}. ${rotor === 'cage' ? 'Le rotor à cage tourne un peu moins vite que le champ : c\'est le glissement, sans lequel aucun courant ne serait induit dans le rotor.' : 'Le rotor à aimants suit le champ exactement à la même vitesse, avec un léger retard angulaire qui dépend de la charge : moteur synchrone.'}`;
    });
    return cv.stop;
  };

  /* ---------- Pertes et rendement du transformateur ---------- */
  SIMS.transfoloss = el => {
    const st = { x: 75, cos: 0.9, Pfe: 600, Pcc: 6500 }; let Sn = 630000;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-sn">${[250, 400, 630, 1000].map(k => `<button data-v="${k}" class="${k === 630 ? 'on' : ''}">${k} kVA</button>`).join('')}</div>
      ${sl('x', 'Charge (en % de la puissance nominale)', 0, 120, 1, 75, '%')}${sl('cos', 'cos φ de la charge', 0.6, 1, 0.01, 0.9, '')}${sl('Pfe', 'Pertes à vide (fer) P<sub>0</sub>', 100, 2500, 10, 600, 'W')}${sl('Pcc', 'Pertes en charge nominale (cuivre) P<sub>k</sub>', 1000, 15000, 50, 6500, 'W')}</div>
      <div class="simout"><div><span>Pertes cuivre P<sub>cu</sub> = P<sub>k</sub> × x²</span><b class="o-cu"></b></div><div><span>Rendement η = P<sub>2</sub> / (P<sub>2</sub> + P<sub>0</sub> + P<sub>cu</sub>)</span><b class="o-e"></b></div><div><span>Charge du rendement maximal x = √(P<sub>0</sub> / P<sub>k</sub>)</span><b class="o-x"></b></div><div><span>Énergie perdue sur un an à cette charge</span><b class="o-y"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Valeurs de départ : exemple de transformateur immergé 630 kVA. Les pertes réelles figurent sur la fiche du constructeur ; le règlement européen 548/2014 (écoconception) fixe des maxima. P<sub>2</sub> = x × S<sub>n</sub> × cos φ.</p></div>`;
    bind(el, st, { cos: v => v.toFixed(2), Pfe: v => AA.fmt(v, 0), Pcc: v => AA.fmt(v, 0) });
    el.querySelectorAll('.js-sn button').forEach(bt => bt.onclick = () => { Sn = +bt.dataset.v * 1000; el.querySelectorAll('.js-sn button').forEach(z => z.classList.toggle('on', z === bt)); });
    const cv = AA.canvas(el.querySelector('.simview'), 210, (g, W, H) => {
      const Pfe = st.Pfe, Pcc = st.Pcc, r = E.transfo(Sn, Pfe, Pcc, st.x / 100, st.cos), xo = Math.sqrt(Pfe / Pcc);
      el.querySelector('.o-cu').textContent = AA.fmt(r.Pcu, 0) + ' W'; el.querySelector('.o-e').textContent = st.x > 0 ? AA.fmt(r.eta * 100, 2) + ' %' : '— (aucune puissance fournie)';
      el.querySelector('.o-x').textContent = AA.fmt(xo * 100, 0) + ' %'; el.querySelector('.o-y').textContent = AA.fmt((Pfe + r.Pcu) * 8760 / 1000, 0) + ' kWh';
      let emin = 1; for (let x = 0.05; x <= 1.2; x += 0.01) emin = Math.min(emin, E.transfo(Sn, Pfe, Pcc, x, st.cos).eta);
      const lo = Math.max(0.9, Math.floor((emin - 0.002) * 200) / 200);
      const x0 = 46, x1 = W - 12, y0 = H - 26, y1 = 14, X = x => x0 + x / 1.2 * (x1 - x0), Y = e => y0 - (Math.max(lo, e) - lo) / (1 - lo) * (y0 - y1);
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI';
      for (let k = 0; k <= 4; k++) { const v = lo + (1 - lo) * k / 4; g.fillText(AA.fmt(v * 100, 1) + ' %', 2, Y(v) + 4); }
      [0, 25, 50, 75, 100, 120].forEach(v => g.fillText(v + ' %', X(v / 100) - 8, y0 + 14));
      g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath(); for (let x = 0.02; x <= 1.2; x += 0.01) { const e = E.transfo(Sn, Pfe, Pcc, x, st.cos).eta; x < 0.025 ? g.moveTo(X(x), Y(e)) : g.lineTo(X(x), Y(e)); } g.stroke();
      g.strokeStyle = css('--teal'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(xo), y0); g.lineTo(X(xo), y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--teal'); g.fillText('maximum : pertes cuivre = pertes fer', Math.min(X(xo) + 4, W - 200), y1 + 10);
      if (st.x > 0) { g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(st.x / 100), Y(r.eta), 6, 0, 7); g.fill(); }
    });
    return cv.stop;
  };

  /* ---------- Indice horaire ---------- */
  SIMS.clock = el => {
    let c = 'Dyn11';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-c">${['Yy0', 'Dyn11', 'Yd11', 'Dyn5', 'Yzn11', 'Dd0'].map(k => `<button data-c="${k}" class="${k === c ? 'on' : ''}">${k}</button>`).join('')}</div></div><div class="simview"></div><p class="muted js-d" style="padding:0 16px 14px;font-size:13px"></p></div>`;
    el.querySelectorAll('.js-c button').forEach(b => b.onclick = () => { c = b.dataset.c; el.querySelectorAll('.js-c button').forEach(x => x.classList.toggle('on', x === b)); });
    const cv = AA.canvas(el.querySelector('.simview'), 220, (g, W, H) => {
      const h = E.clock(c), cx = W / 2, cy = H / 2 + 4, R = Math.min(W, H) * 0.4;
      g.strokeStyle = css('--line-2'); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * Math.PI - Math.PI / 2; g.fillStyle = css('--ink-3'); g.font = '600 11px Bahnschrift'; g.fillText(k === 0 ? '12' : String(k), cx + Math.cos(a) * (R + 12) - 6, cy + Math.sin(a) * (R + 12) + 4); }
      arrow(g, cx, cy, cx, cy - R * 0.9, css('--copper'), 4);
      const a = h / 12 * 2 * Math.PI - Math.PI / 2; arrow(g, cx, cy, cx + Math.cos(a) * R * 0.65, cy + Math.sin(a) * R * 0.65, css('--teal'), 3);
      g.fillStyle = css('--copper'); g.font = '700 12px Bahnschrift'; g.fillText('HT', cx + 6, cy - R * 0.75); g.fillStyle = css('--teal'); g.fillText('BT', cx + Math.cos(a) * R * 0.65 + 6, cy + Math.sin(a) * R * 0.65);
      el.querySelector('.js-d').textContent = `${c} : première lettre (majuscule) = couplage haute tension (Y étoile, D triangle) ; lettre minuscule = couplage basse tension (y, d, z zigzag) ; « n » = neutre sorti ; le nombre est l'indice horaire : la tension BT est décalée de ${h} × 30° = ${h * 30}° en retard sur la HT. ${c === 'Dyn11' ? 'C\'est le couplage le plus courant des transformateurs de distribution : neutre BT disponible et bon comportement en charge déséquilibrée.' : ''}`;
    });
    return cv.stop;
  };

  /* ---------- Bilan des puissances du moteur asynchrone ---------- */
  SIMS.powerflow = el => {
    const st = { Pabs: 4650, g: 4 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Pabs', 'Puissance absorbée', 1000, 8000, 50, 4650, 'W')}${sl('g', 'Glissement', 1, 10, 0.5, 4, '%')}</div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Pertes supposées : fer stator 3 %, Joule stator 4 % de la puissance absorbée, pertes mécaniques 1,5 % (ordres de grandeur pour un moteur de quelques kW).</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H) => {
      const r = E.async({ Pabs: st.Pabs, Pfs: 0.03 * st.Pabs, Pjs: 0.04 * st.Pabs, g: st.g / 100, Pm: 0.015 * st.Pabs });
      const steps = [['P absorbée', st.Pabs, '--blue'], ['− pertes fer stator', -0.03 * st.Pabs, '--bad'], ['− Joule stator', -0.04 * st.Pabs, '--bad'], ['= P transmise au rotor', r.Ptr, '--teal'], ['− Joule rotor (g × Ptr)', -r.Pjr, '--bad'], ['− pertes mécaniques', -0.015 * st.Pabs, '--bad'], ['= P utile', r.Pu, '--ok']];
      const bw = (W - 40) / steps.length, max = st.Pabs;
      steps.forEach(([n, v, col], k) => {
        const h = Math.abs(v) / max * (H - 70), x = 20 + k * bw;
        g.fillStyle = css(col); g.fillRect(x + 6, H - 40 - h, bw - 12, h);
        g.fillStyle = css('--ink'); g.font = '700 11px Cascadia Mono, Consolas'; g.fillText(AA.fmt(Math.abs(v), 0) + ' W', x + 6, H - 46 - h);
        g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; const words = n.split(' '); words.reduce((y, wd, i) => { g.fillText(wd, x + 4, H - 26 + i * 11); return y; }, 0);
      });
      g.fillStyle = css('--ink'); g.font = '700 13px Bahnschrift'; g.fillText(`Rendement η = Pu / Pabs = ${AA.fmt(r.eta * 100, 1)} %`, 20, 16);
    });
    return cv.stop;
  };

  /* ---------- Moteur à courant continu ---------- */
  SIMS.dcmotor = el => {
    const st = { U: 220, T: 10 }; const R = 1.2, k = 1.3; let ang = 0, last = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('U', 'Tension d\'induit U', 0, 240, 1, 220, 'V')}${sl('T', 'Couple de charge', 0, 30, 0.5, 10, 'N·m')}</div>
      <div class="simout"><div><span>Courant d'induit I = T / kΦ</span><b class="o-i"></b></div><div><span>Force contre-électromotrice E = U − R I</span><b class="o-e"></b></div><div><span>Vitesse n = E / kΦ</span><b class="o-n"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Moteur à excitation constante : kΦ = ${k} V·s/rad, résistance d'induit ${R} Ω.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 160, (g, W, H, t) => {
      const r = E.dc({ U: st.U, R, k, T: st.T }), n = Math.max(0, r.n);
      el.querySelector('.o-i').textContent = AA.fmt(r.I, 1) + ' A'; el.querySelector('.o-e').textContent = AA.fmt(r.E, 1) + ' V'; el.querySelector('.o-n').textContent = r.n > 0 ? AA.fmt(r.n, 0) + ' tr/min' : 'calé (U trop faible pour ce couple)';
      const dt = last ? Math.min(0.05, t - last) : 0; last = t; ang += n / 60 * 2 * Math.PI * dt * 0.05;
      const cx = W / 2, cy = H / 2;
      g.fillStyle = '#c62828'; g.fillRect(cx - 110, cy - 40, 30, 80); g.fillStyle = '#1565c0'; g.fillRect(cx + 80, cy - 40, 30, 80);
      g.fillStyle = '#fff'; g.font = '700 13px Bahnschrift'; g.fillText('N', cx - 100, cy + 5); g.fillText('S', cx + 90, cy + 5);
      g.save(); g.translate(cx, cy); g.rotate(ang); g.strokeStyle = css('--copper'); g.lineWidth = 6; g.strokeRect(-50, -26, 100, 52); g.restore();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('La vitesse se règle par la tension d\'induit ; le couple fixe le courant.', 12, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Moteur pas-à-pas ---------- */
  SIMS.stepper = el => {
    let pos = 0, half = false, run = false, acc = 0, last = 0;
    const st = { f: 200, N: 200 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><button class="btn sm js-s">Une impulsion</button><button class="btn sm js-10">10 impulsions</button><button class="btn sm js-run">Train d'impulsions</button>
      <div class="seg js-m"><button data-m="full" class="on">Pas entier</button><button data-m="half">Demi-pas</button></div>${sl('N', 'Pas entiers par tour du moteur', 24, 400, 1, 200, 'pas')}${sl('f', "Fréquence des impulsions", 10, 2000, 10, 200, 'Hz')}</div>
      <div class="simout"><div><span>Angle d'un pas = 360° / N (÷ 2 en demi-pas)</span><b class="o-a"></b></div><div><span>Position</span><b class="o-p"></b></div><div><span>Vitesse n = 60 f / N (÷ 2 en demi-pas)</span><b class="o-n"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Moteurs courants : 200 pas par tour (1,8°) ou 400 (0,9°). Le dessin est ralenti pour rester lisible ; en réalité, au-delà d'une certaine fréquence, le couple chute et le moteur peut perdre des pas.</p></div>`;
    bind(el, st, {});
    const stepA = () => 360 / st.N / (half ? 2 : 1);
    const step = n => { pos += n * stepA(); };
    el.querySelector('.js-s').onclick = () => step(1); el.querySelector('.js-10').onclick = () => step(10);
    el.querySelector('.js-run').onclick = e => { run = !run; e.target.textContent = run ? 'Arrêter le train' : "Train d'impulsions"; };
    el.querySelectorAll('.js-m button').forEach(bt => bt.onclick = () => { half = bt.dataset.m === 'half'; el.querySelectorAll('.js-m button').forEach(x => x.classList.toggle('on', x === bt)); });
    let shown = 0;
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t;
      if (run) { acc += dt * Math.min(st.f, 40); while (acc >= 1) { step(1); acc -= 1; } } // affichage limité à 40 impulsions/s
      shown += (pos - shown) * 0.3;
      el.querySelector('.o-a').textContent = AA.fmt(stepA(), 2) + '°';
      el.querySelector('.o-p').textContent = AA.fmt(pos, 1) + '° (' + AA.fmt(pos / 360, 2) + ' tour)';
      el.querySelector('.o-n').textContent = AA.fmt(60 * st.f / st.N / (half ? 2 : 1), 1) + ' tr/min';
      const cx = W / 2, cy = H / 2, R = 70, nt = Math.min(100, st.N / 4);
      g.strokeStyle = css('--line-2'); g.lineWidth = 1; for (let k = 0; k < nt; k++) { const a = k / nt * 2 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6)); g.lineTo(cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14)); g.stroke(); }
      g.save(); g.translate(cx, cy); g.rotate(shown * Math.PI / 180); g.fillStyle = css('--surface-3'); g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill(); g.strokeStyle = css('--copper'); g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(R, 0); g.stroke(); g.restore();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText("Chaque impulsion fait tourner le rotor d'un angle fixe, sans capteur (boucle ouverte).", 12, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Vitesse de synchronisme ---------- */
  SIMS.sync = el => {
    const st = { f: 50, p: 2 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('f', 'Fréquence', 10, 100, 1, 50, 'Hz')}${sl('p', 'Nombre de paires de pôles p', 1, 6, 1, 2, '')}</div><div class="simout"><div><span>n<sub>s</sub> = 60 f / p</span><b class="o-n"></b></div></div></div>`;
    bind(el, st, {});
    let ang = 0, last = 0;
    const cv = AA.canvas(el.querySelector('.simview'), 160, (g, W, H, t) => {
      const ns = 60 * st.f / st.p; el.querySelector('.o-n').textContent = AA.fmt(ns, 0) + ' tr/min';
      const dt = last ? Math.min(0.05, t - last) : 0; last = t; ang += ns / 60 * 2 * Math.PI * dt * 0.02;
      const cx = W / 2, cy = H / 2, R = 60;
      g.save(); g.translate(cx, cy); g.rotate(ang);
      for (let k = 0; k < 2 * st.p; k++) { const a = k / (2 * st.p) * 2 * Math.PI; g.fillStyle = k % 2 ? '#1565c0' : '#c62828'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a, a + 2 * Math.PI / (2 * st.p)); g.fill(); }
      g.restore();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(`${2 * st.p} pôles (${st.p} paire${st.p > 1 ? 's' : ''}) : plus il y a de pôles, plus la machine tourne lentement à fréquence donnée.`, 12, H - 8);
    });
    return cv.stop;
  };

  /* ================= LEÇONS ================= */
  L.n4m1l1 = { min: 8, why: "Toute l'électrotechnique repose sur la sinusoïde : il faut manier ses grandeurs sans hésiter.", screens: [[
    { h: 'La sinusoïde et ses grandeurs' },
    { formula: 'u(t) = Û sin(ωt)   ω = 2πf   T = 1/f   U<sub>eff</sub> = Û / √2' },
    { num: { id: 'w', gen: r => { const f = r.pick([50, 60, 400]); return { q: `Quelle est la pulsation ω d'une tension de <b>${f} Hz</b> ?`, a: 2 * Math.PI * f, unit: 'rad/s', tol: 0.01, sol: `ω = 2π × ${f} = ${AA.fmt(2 * Math.PI * f, 1)} rad/s` }; } } },
    { recap: ['ω (rad/s) = 2πf ; T = 1/f.', 'Ueff = Û/√2 pour une sinusoïde seulement.'] }
  ]] };
  L.n4m1l2 = { min: 11, why: "Le déphasage entre tension et courant explique l'énergie réactive, la compensation et le cos φ.", screens: [[
    { h: 'Déphasage et vecteurs de Fresnel' },
    { p: "Une grandeur sinusoïdale se représente par un vecteur tournant (vecteur de Fresnel) : sa longueur est la valeur efficace, son angle la phase. Dans une résistance, courant et tension sont en phase ; dans une bobine parfaite, le courant est en retard de 90° ; dans un condensateur, en avance de 90°." },
    { table: { head: ['Récepteur', 'Réactance', 'Déphasage du courant'], rows: [['Résistance R', '—', '0°'], ['Bobine L', 'X<sub>L</sub> = Lω', 'retard de 90°'], ['Condensateur C', 'X<sub>C</sub> = 1/(Cω)', 'avance de 90°'], ['Circuit R-L-C série', 'Z = √(R² + (X<sub>L</sub> − X<sub>C</sub>)²)', 'tan φ = (X<sub>L</sub> − X<sub>C</sub>)/R']] } },
    { num: { id: 'z', gen: r => { const R = r.pick([20, 30, 40]), Lm = r.pick([50, 100, 150]); const x = E.rlc(R, Lm / 1000, 0, 50, 230); return { q: `R = <b>${R} Ω</b> en série avec L = <b>${Lm} mH</b>, à 50 Hz. Impédance Z ?`, a: x.Z, unit: 'Ω', tol: 0.01, sol: `X_L = ${Lm / 1000} × 314,16 = ${AA.fmt(x.XL, 2)} Ω ; Z = √(${R}² + ${AA.fmt(x.XL, 2)}²) = ${AA.fmt(x.Z, 2)} Ω` }; } } }
  ]] };
  L.n4m1l3 = { min: 10, why: "Le distributeur facture l'énergie active, mais les câbles transportent la puissance apparente.", screens: [[
    { h: 'Puissances active, réactive, apparente' },
    { table: { head: ['Puissance', 'Monophasé', 'Triphasé équilibré', 'Unité'], rows: [['Active P', 'U I cos φ', '√3 U I cos φ', 'W'], ['Réactive Q', 'U I sin φ', '√3 U I sin φ', 'var'], ['Apparente S', 'U I', '√3 U I', 'VA'], ['Relation', 'S² = P² + Q²', 'S² = P² + Q²', '']] } },
    { num: { id: 'pqs', gen: r => { const I = r.pick([12, 20, 32]), c = r.pick([0.75, 0.8, 0.85]); const S = Math.sqrt(3) * 400 * I; return { q: `Moteur triphasé 400 V, <b>${I} A</b>, cos φ = <b>${c}</b>. Puissance réactive Q ?`, a: S * Math.sqrt(1 - c * c), unit: 'var', tol: 0.02, sol: `S = √3 × 400 × ${I} = ${AA.fmt(S, 0)} VA ; sin φ = ${AA.fmt(Math.sqrt(1 - c * c), 3)} ; Q = ${AA.fmt(S * Math.sqrt(1 - c * c), 0)} var` }; } } }
  ]] };
  L.n4m1l4 = { min: 10, why: "Un mauvais cos φ surcharge les câbles et coûte des pénalités : on le corrige par des condensateurs.", screens: [[
    { h: 'Facteur de puissance et compensation' },
    { formula: 'Q<sub>c</sub> = P (tan φ<sub>1</sub> − tan φ<sub>2</sub>)', small: 'Capacité par phase d\'une batterie en triangle : C = Q_c / (3 U² ω), U tension entre phases' },
    { num: { id: 'cc', gen: r => { const Qc = r.pick([10000, 25000, 50000]); const C = Qc / (3 * 400 * 400 * 2 * Math.PI * 50) * 1e6; return { q: `Batterie de <b>${Qc / 1000} kvar</b> couplée en triangle sur 400 V, 50 Hz. Capacité de chaque condensateur ?`, a: C, unit: 'µF', tol: 0.02, sol: `C = ${Qc} / (3 × 400² × 314,16) = ${AA.fmt(C, 1)} µF` }; } } }
  ]] };
  L.n4m1l5 = { min: 9, why: "Le réseau triphasé est la norme de l'industrie : 230 V et 400 V sont la même installation vue sous deux angles.", screens: [[
    { h: 'Tensions simples et composées' },
    { formula: 'U = V × √3', small: 'V : tension simple (phase-neutre) ; U : tension composée (entre phases). 230 × √3 ≈ 400 V' },
    { p: "Trois tensions de même valeur, décalées de 120°. Leur somme instantanée est nulle : c'est pourquoi un récepteur triphasé équilibré n'a pas besoin de neutre." }
  ]] };
  L.n4m1l6 = { min: 10, why: "Coupler un récepteur en étoile ou en triangle change sa puissance d'un facteur trois.", screens: [[
    { h: 'Étoile ou triangle' },
    { table: { head: ['', 'Étoile (Y)', 'Triangle (Δ)'], rows: [['Tension sur chaque élément', 'V = U/√3', 'U'], ['Courant en ligne', 'I = courant dans l\'élément', 'I = J × √3'], ['Puissance (mêmes éléments)', 'P', '3 × P']] } },
    { quiz: { q: 'Trois résistances couplées en triangle puis en étoile sur le même réseau : la puissance en étoile est…', opts: ['identique', 'divisée par 3', 'divisée par √3', 'multipliée par 3'], a: 1, why: 'Chaque résistance reçoit U/√3 au lieu de U : sa puissance (U²/R) est divisée par 3.' } }
  ]] };
  L.n4m2l1 = { min: 9, why: "Le transformateur rend possible le transport de l'électricité et la tension de commande de chaque armoire.", screens: [[
    { h: 'Principe du transformateur' },
    { formula: 'm = N<sub>2</sub> / N<sub>1</sub> = U<sub>2</sub> / U<sub>1</sub> ≈ I<sub>1</sub> / I<sub>2</sub>', small: 'Transformateur parfait : la puissance se conserve, S1 = S2' },
    { p: "Une tension alternative au primaire crée un flux alternatif dans le circuit magnétique, qui induit une tension au secondaire proportionnelle au nombre de spires. Il ne fonctionne pas en continu." }
  ]] };
  L.n4m2l2 = { min: 8, why: "Les transformateurs de commande et de sécurité protègent les personnes et isolent les circuits.", screens: [[
    { h: 'Transformateurs de commande et de sécurité' },
    { list: ['<b>Transformateur de sécurité</b> (EN 61558-2-6) : enroulements séparés par une isolation renforcée, secondaire en TBTS (≤ 50 V alternatif). Exemple : éclairage de piscine, baladeuse.', '<b>Transformateur de commande</b> : alimente les circuits de commande d\'une machine (souvent 24 V ou 230 V), isolés du réseau.', 'Le secondaire est protégé (fusible ou disjoncteur) ; en TBTP, le secondaire peut être relié à la terre (souvent un côté au PE), ce qui est interdit en TBTS.'] }
  ]] };
  L.n4m2l3 = { min: 9, why: "Un transformateur fonctionne jour et nuit : quelques centaines de watts de pertes représentent des milliers de kWh par an.", screens: [[
    { h: 'Pertes et rendement' },
    { list: ['<b>Pertes fer</b> (à vide) : hystérésis et courants de Foucault, constantes dès que le transformateur est sous tension.', '<b>Pertes cuivre</b> (en charge) : effet Joule dans les enroulements, proportionnelles au carré de la charge.', 'Le rendement est maximal quand les pertes cuivre égalent les pertes fer.'] },
    { num: { id: 'eta', gen: r => { const x = r.pick([0.25, 0.5, 0.75, 1]); const t = E.transfo(630000, 600, 6500, x, 0.9); return { q: `Transformateur 630 kVA (pertes à vide 600 W, en charge 6 500 W) à <b>${x * 100} %</b> de charge, cos φ 0,9. Rendement ?`, a: t.eta * 100, unit: '%', tol: 0.001, sol: `P2 = ${AA.fmt(t.P2, 0)} W ; Pcu = 6 500 × ${x}² = ${AA.fmt(t.Pcu, 0)} W ; η = ${AA.fmt(t.eta * 100, 2)} %` }; } } }
  ]] };
  L.n4m2l4 = { min: 9, why: "Le couplage d'un transformateur de distribution détermine la disponibilité du neutre et la possibilité de mise en parallèle.", screens: [[
    { h: 'Transformateurs triphasés et couplages' },
    { p: "Le couplage s'écrit par exemple <b>Dyn11</b> : triangle côté haute tension, étoile avec neutre sorti côté basse tension, indice horaire 11. Deux transformateurs ne peuvent être couplés en parallèle que s'ils ont le même indice horaire, le même rapport et des tensions de court-circuit voisines." }
  ]] };
  L.n4m3l1 = { min: 9, why: "Le champ tournant est l'idée géniale qui fait tourner 90 % des moteurs du monde.", screens: [[
    { h: 'Le champ tournant' },
    { p: "Trois bobines décalées de 120° et parcourues par trois courants décalés de 120° créent un champ magnétique d'amplitude constante qui tourne. Croiser deux phases inverse son sens : c'est l'inversion de sens de marche." }
  ]] };
  L.n4m3l2 = { min: 9, why: "La vitesse d'un moteur asynchrone dépend de la fréquence, du nombre de pôles et de la charge.", screens: [[
    { h: 'Glissement et vitesse' },
    { formula: 'n<sub>s</sub> = 60 f / p      g = (n<sub>s</sub> − n) / n<sub>s</sub>' },
    { num: { id: 'g', gen: r => { const p = r.pick([1, 2, 3]), ns = 3000 / p, n = Math.round(ns * (1 - r.pick([0.02, 0.03, 0.04, 0.05]))); return { q: `Moteur à <b>${2 * p} pôles</b>, 50 Hz, tournant à <b>${n} tr/min</b>. Glissement en % ?`, a: (ns - n) / ns * 100, unit: '%', tol: 0.02, sol: `n_s = 3 000 / ${p} = ${ns} tr/min ; g = (${ns} − ${n}) / ${ns} = ${AA.fmt((ns - n) / ns * 100, 2)} %` }; } } }
  ]] };
  L.n4m3l3 = { min: 9, why: "La plaque signalétique contient tout ce qu'il faut pour raccorder, protéger et régler un moteur.", screens: [[
    { h: 'La plaque signalétique, en détail' },
    { sim: 'nameplate' },
    { p: "Le courant de plaque sert à régler le relais thermique ; la tension et le couplage à raccorder ; la puissance utile, la vitesse et le cos φ à vérifier l'adéquation à la machine." }
  ]] };
  L.n4m3l4 = { min: 10, why: "La courbe couple-vitesse explique le démarrage, le calage et le fonctionnement sur variateur.", screens: [[
    { h: 'Couple, courant, caractéristiques' },
    { list: ['Au démarrage : courant de 6 à 8 I<sub>n</sub>, couple de 1,5 à 2,5 C<sub>n</sub> (selon le moteur).', 'Le couple est proportionnel au <b>carré de la tension</b> : une chute de tension de 10 % fait perdre environ 19 % de couple.', 'Le point de fonctionnement est l\'intersection des courbes de couple moteur et de couple résistant.'] },
    { num: { id: 'tu', gen: r => { const P = r.pick([4, 7.5, 11]), n = r.pick([1440, 1455, 2900]); return { q: `Moteur de <b>${AA.fmt(P)} kW</b> utiles à <b>${n} tr/min</b>. Couple utile ?`, a: P * 1000 / (n * 2 * Math.PI / 60), unit: 'N·m', tol: 0.01, sol: `C = P / Ω = ${P * 1000} / (${n} × 2π / 60) = ${AA.fmt(P * 1000 / (n * 2 * Math.PI / 60), 1)} N·m` }; } } }
  ]] };
  L.n4m3l5 = { min: 10, why: "Le bilan des puissances explique où part l'énergie… et pourquoi un moteur chauffe.", screens: [[
    { h: 'Bilan des puissances et rendement' },
    { list: ['P<sub>absorbée</sub> − pertes fer stator − pertes Joule stator = P<sub>transmise</sub> (au rotor).', 'Pertes Joule rotor = g × P<sub>transmise</sub>.', 'P<sub>mécanique</sub> = (1 − g) × P<sub>transmise</sub> ; P<sub>utile</sub> = P<sub>mécanique</sub> − pertes mécaniques.', 'η = P<sub>utile</sub> / P<sub>absorbée</sub>.'] }
  ]] };
  L.n4m3l6 = { min: 9, why: "Un moteur bien choisi dure des décennies ; mal choisi, il chauffe, consomme et casse.", screens: [[
    { h: 'Choisir un moteur' },
    { list: ['<b>Puissance et vitesse</b> d\'après la charge (couple et vitesse nécessaires), avec une marge raisonnable : un moteur très surdimensionné a un mauvais cos φ.', '<b>Service</b> (IEC 60034-1) : S1 continu, S3 intermittent périodique, etc.', '<b>Indice de protection</b> (IP55 en atelier), <b>classe d\'isolation</b> (F) et d\'échauffement.', '<b>Rendement</b> (IEC 60034-30-1) : dans l\'Union européenne, la classe IE3 est le minimum pour la plupart des moteurs de 0,75 à 1 000 kW depuis juillet 2021, et IE4 pour 75 à 200 kW depuis juillet 2023 (règlement (UE) 2019/1781).', '<b>Fixation</b> (pattes B3, bride B5…) et hauteur d\'axe.'] }
  ]] };
  L.n4m4l1 = { min: 9, why: "Le moteur à courant continu reste la référence pour comprendre la variation de vitesse.", screens: [[
    { h: 'Le moteur à courant continu' },
    { formula: 'E = kΦΩ    U = E + R I    C = kΦ I' },
    { p: "À flux constant, la vitesse est proportionnelle à la force contre-électromotrice, donc pratiquement à la tension d'induit ; le couple est proportionnel au courant. Le collecteur et les balais s'usent : c'est la principale contrainte de maintenance." }
  ]] };
  L.n4m4l2 = { min: 8, why: "Les alternateurs produisent presque toute l'électricité mondiale ; les moteurs synchrones entraînent les grosses machines.", screens: [[
    { h: 'Machine synchrone et alternateur' },
    { p: "Le rotor porte un champ (électroaimant excité ou aimants permanents) qui tourne exactement à la vitesse du champ statorique : n = 60 f / p. En alternateur, l'excitation règle la tension et la puissance réactive ; en moteur, la vitesse ne dépend que de la fréquence." }
  ]] };
  L.n4m4l3 = { min: 8, why: "Imprimantes 3D, machines-outils, robots : le positionnement repose sur les pas-à-pas et les servomoteurs.", screens: [[
    { h: 'Moteurs pas-à-pas et servomoteurs' },
    { list: ['<b>Pas-à-pas</b> : avance d\'un angle fixe par impulsion (souvent 1,8°, soit 200 pas par tour) ; commande en boucle ouverte, risque de perte de pas en surcharge.', '<b>Servomoteur</b> : moteur (souvent synchrone à aimants) équipé d\'un codeur ; le variateur asservit position, vitesse et couple en boucle fermée.'] }
  ]] };
  L.n4m4l4 = { min: 8, why: "Les moteurs à aimants permanents atteignent les meilleurs rendements : on les trouve dans les pompes, ventilateurs et véhicules électriques.", screens: [[
    { h: 'Moteurs à aimants permanents' },
    { p: "Moteur synchrone dont le rotor porte des aimants : pas de courant rotorique, donc pas de pertes Joule au rotor. Il atteint des classes de rendement élevées (IE4, IE5) mais <b>nécessite un variateur</b> pour démarrer et fonctionner." }
  ]] };

  Object.assign(AA.VISMAP, {
    n4m1l1: [{ sim: 'scope' }], n4m1l2: [{ sim: 'fresnel' }], n4m1l3: [{ sim: 'lab', opts: { id: 'cosphi' } }], n4m1l4: [{ sim: 'lab', opts: { id: 'cosphi' } }], n4m1l5: [{ sim: 'lab', opts: { id: 'triphase' } }], n4m1l6: [{ sim: 'lab', opts: { id: 'triphase' } }],
    n4m2l1: [{ sim: 'lab', opts: { id: 'transfo' } }], n4m2l2: [{ sim: 'lab', opts: { id: 'transfo' } }], n4m2l3: [{ sim: 'transfoloss' }], n4m2l4: [{ sim: 'clock' }],
    n4m3l1: [{ sim: 'champ' }], n4m3l2: [{ sim: 'sync' }], n4m3l3: [{ sim: 'lab', opts: { id: 'moteur' } }], n4m3l4: [{ sim: 'lab', opts: { id: 'moteur' } }], n4m3l5: [{ sim: 'powerflow' }], n4m3l6: [{ sim: 'lab', opts: { id: 'moteur' } }],
    n4m4l1: [{ sim: 'dcmotor' }], n4m4l2: [{ sim: 'sync' }], n4m4l3: [{ sim: 'stepper' }], n4m4l4: [{ sim: 'champ' }]
  });
})();
