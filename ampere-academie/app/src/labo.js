/* Ampère Académie — le Labo : l'électricité dans ses applications réelles.
 * Chaque labo = un modèle physique animé + des réglages + un défi tiré au hasard, vérifié sur l'état du modèle.
 * Modèles : réseau triphasé, puissances et compensation, transformateur, moteur asynchrone + variateur (Kloss, U/f),
 * module photovoltaïque (modèle à une diode), régulation thermique tout-ou-rien, chute de tension en ligne. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const S = AA.state;
  const css = n => AA.css(n);
  S.labo = S.labo || {};
  const LAB = AA.Labo = { list: [] };
  const add = o => LAB.list.push(o);
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  function bindAll(root, st, fmt, onChange) {
    root.querySelectorAll('.sl').forEach(lab => {
      const k = lab.dataset.k, inp = lab.querySelector('input'), out = lab.querySelector('b');
      const upd = () => { st[k] = +inp.value; out.textContent = (fmt[k] || (v => AA.fmt(v)))(st[k]); if (onChange) onChange(k); };
      inp.addEventListener('input', upd); upd();
    });
  }
  const setSlider = (root, k, v) => { const i = root.querySelector(`.sl[data-k="${k}"] input`); if (i) { i.value = v; i.dispatchEvent(new Event('input')); } };

  /* ---------------- 1. Réseau triphasé ---------------- */
  add({
    id: 'triphase', t: 'Réseau triphasé', icon: 'sigma', tag: 'Électrotechnique',
    d: 'Trois tensions décalées de 120° : vecteurs de Fresnel, tensions simples et composées, couplage étoile ou triangle d\'un récepteur.',
    build(el, st) {
      st.V = 230; st.R = 46; st.coupl = 'Y';
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div>
        <div class="lab-ctl">${sl('V', 'Tension simple V', 100, 400, 1, 230, 'V')}${sl('R', 'Résistance par branche', 10, 200, 1, 46, 'Ω')}
        <div class="seg js-c"><button data-c="Y" class="on">Étoile (Y)</button><button data-c="D">Triangle (Δ)</button></div>
        <div class="simout"><div><span>Tension composée U = V√3</span><b class="o-u"></b></div><div><span>Courant dans une branche</span><b class="o-j"></b></div><div><span>Courant en ligne</span><b class="o-i"></b></div><div><span>Puissance totale</span><b class="o-p"></b></div></div></div></div>`;
      bindAll(el, st, {}, null);
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { st.coupl = b.dataset.c; el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); });
      const calc = () => { const U = st.V * Math.sqrt(3); const J = st.coupl === 'Y' ? st.V / st.R : U / st.R; const I = st.coupl === 'Y' ? J : J * Math.sqrt(3); return { U, J, I, P: 3 * (st.coupl === 'Y' ? st.V : U) * J }; };
      st.calc = calc;
      const cv = AA.canvas(el.querySelector('.cv'), 330, (g, W, H, t) => {
        const r = calc();
        el.querySelector('.o-u').textContent = AA.fmt(r.U, 0) + ' V'; el.querySelector('.o-j').textContent = AA.fmt(r.J, 2) + ' A';
        el.querySelector('.o-i').textContent = AA.fmt(r.I, 2) + ' A'; el.querySelector('.o-p').textContent = AA.fmt(r.P / 1000, 2) + ' kW';
        const cols = [css('--pot-L1'), css('--pot-L2'), css('--pot-L3')];
        const cx = Math.min(170, W * 0.28), cy = H / 2, R = Math.min(120, cy - 30) * Math.min(1, st.V / 400 + 0.35);
        const w = 2 * Math.PI * 0.25 * t; // ralenti : 0,25 tour par seconde
        g.strokeStyle = css('--line-2'); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
        const ph = [0, -2.0944, 2.0944].map(a => [cx + R * Math.cos(w + a), cy - R * Math.sin(w + a)]);
        ph.forEach(([x, y], k) => { arrow(g, cx, cy, x, y, cols[k], 3); g.fillStyle = cols[k]; g.font = '700 13px Bahnschrift'; g.fillText('V' + (k + 1), x + 6, y - 6); });
        // U12 = V1 - V2
        arrow(g, ph[1][0], ph[1][1], ph[0][0], ph[0][1], css('--teal'), 2, true);
        g.fillStyle = css('--teal'); g.fillText('U12', (ph[0][0] + ph[1][0]) / 2 + 8, (ph[0][1] + ph[1][1]) / 2);
        // courbes
        const x0 = cx + R + 40, x1 = W - 16; if (x1 - x0 < 80) return;
        g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, cy); g.lineTo(x1, cy); g.stroke();
        for (let k = 0; k < 3; k++) {
          g.strokeStyle = cols[k]; g.lineWidth = 2.2; g.beginPath();
          for (let x = x0; x <= x1; x += 2) { const a = w - (x - x0) / (x1 - x0) * 4 * Math.PI + [0, -2.0944, 2.0944][k]; const y = cy - R * Math.sin(a); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
          g.stroke();
        }
        g.fillStyle = css('--ink-3'); g.font = '500 12px Segoe UI'; g.fillText('Les vecteurs tournent à 50 tr/s (ici fortement ralentis). La projection verticale donne la tension instantanée.', 14, H - 12);
      });
      return cv.stop;
    },
    challenge(r) {
      const R = r.pick([23, 46, 69, 92, 115]), coupl = r.pick(['Y', 'D']);
      const I = coupl === 'Y' ? 230 / R : 400 * Math.sqrt(3) / R;
      return { text: `Un four triphasé possède trois résistances de <b>${R} Ω</b> couplées en <b>${coupl === 'Y' ? 'étoile' : 'triangle'}</b> sur un réseau 230/400 V. Quel est le <b>courant en ligne</b> ? (vérifie ensuite avec le labo)`, num: { a: I, unit: 'A', tol: 0.03, sol: coupl === 'Y' ? `Étoile : chaque résistance reçoit V = 230 V, I = 230 / ${R} = ${AA.fmt(I, 2)} A.` : `Triangle : chaque résistance reçoit U = 400 V, J = 400 / ${R} = ${AA.fmt(400 / R, 2)} A, et I = J × √3 = ${AA.fmt(I, 2)} A.` } };
    }
  });
  function arrow(g, x0, y0, x1, y1, col, w, dash) {
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; if (dash) g.setLineDash([6, 4]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    const a = Math.atan2(y1 - y0, x1 - x0);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 11 * Math.cos(a - 0.4), y1 - 11 * Math.sin(a - 0.4)); g.lineTo(x1 - 11 * Math.cos(a + 0.4), y1 - 11 * Math.sin(a + 0.4)); g.fill();
  }

  /* ---------------- 2. Puissances et compensation ---------------- */
  add({
    id: 'cosphi', t: 'Puissances et cos φ', icon: 'bolt', tag: 'Énergie',
    d: 'Triangle des puissances, énergie réactive facturée, batterie de condensateurs : relève le facteur de puissance d\'un atelier.',
    build(el, st) {
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div><div class="lab-ctl">
        ${sl('P', 'Puissance active P', 10, 400, 5, 120, 'kW')}${sl('cos', 'cos φ de l\'installation', 0.5, 0.99, 0.01, 0.72, '')}${sl('Qc', 'Batterie de condensateurs Qc', 0, 400, 5, 0, 'kvar')}
        <div class="simout"><div><span>Q (réactive) restante</span><b class="o-q"></b></div><div><span>S (apparente)</span><b class="o-s"></b></div><div><span>cos φ obtenu</span><b class="o-c"></b></div><div><span>Courant en ligne (400 V)</span><b class="o-i"></b></div></div></div></div>`;
      bindAll(el, st, { cos: v => v.toFixed(2) });
      st.res = () => { const Q = st.P * Math.tan(Math.acos(st.cos)); const Qr = Q - st.Qc; const Sa = Math.hypot(st.P, Qr); return { Q, Qr, S: Sa, c: st.P / Sa, I: Sa * 1000 / (Math.sqrt(3) * 400) }; };
      const cv = AA.canvas(el.querySelector('.cv'), 330, (g, W, H) => {
        const r = st.res();
        el.querySelector('.o-q').textContent = AA.fmt(r.Qr, 1) + ' kvar'; el.querySelector('.o-s').textContent = AA.fmt(r.S, 1) + ' kVA';
        el.querySelector('.o-c').textContent = r.c.toFixed(3) + (r.Qr < 0 ? ' (capacitif !)' : ''); el.querySelector('.o-i').textContent = AA.fmt(r.I, 0) + ' A';
        const sc = Math.min((W - 120) / Math.max(st.P, 1), (H - 70) / Math.max(r.Q, Math.abs(r.Qr), 1) / 1.05) * 0.95;
        const x0 = 50, y0 = H - 40, xp = x0 + st.P * sc;
        g.lineWidth = 4;
        arrow(g, x0, y0, xp, y0, css('--ok'), 4); g.fillStyle = css('--ok'); g.font = '700 13px Bahnschrift'; g.fillText('P = ' + AA.fmt(st.P) + ' kW', x0 + 10, y0 + 22);
        arrow(g, xp, y0, xp, y0 - r.Q * sc, css('--live'), 3, true);
        g.fillStyle = css('--live'); g.fillText('Q = ' + AA.fmt(r.Q, 0) + ' kvar', xp + 8, y0 - r.Q * sc / 2);
        if (st.Qc > 0) { arrow(g, xp + 0, y0 - r.Q * sc, xp, y0 - r.Qr * sc, css('--blue'), 4); g.fillStyle = css('--blue'); g.fillText('− Qc', xp - 46, y0 - (r.Q + r.Qr) / 2 * sc); }
        arrow(g, x0, y0, xp, y0 - r.Qr * sc, css('--amber'), 3);
        g.fillStyle = css('--amber'); g.fillText('S = ' + AA.fmt(r.S, 0) + ' kVA', (x0 + xp) / 2 - 40, y0 - r.Qr * sc / 2 - 12);
        g.fillStyle = css('--ink-3'); g.font = '500 12px Segoe UI'; g.fillText('Le distributeur facture l\'énergie réactive au-delà de tan φ = 0,4 (cos φ ≈ 0,93) : on compense.', 14, 20);
      });
      return cv.stop;
    },
    challenge(r, el, st) {
      const P = r.pick([80, 120, 150, 200, 250]), c1 = r.pick([0.65, 0.7, 0.75, 0.8]), c2 = r.pick([0.93, 0.95, 0.97]);
      const Qc = P * (Math.tan(Math.acos(c1)) - Math.tan(Math.acos(c2)));
      setSlider(el, 'P', P); setSlider(el, 'cos', c1); setSlider(el, 'Qc', 0);
      return { text: `Atelier de <b>${P} kW</b>, cos φ = <b>${c1}</b>. Règle la batterie de condensateurs pour atteindre <b>cos φ ≥ ${c2}</b> sans surcompenser (rester inductif), avec la plus petite batterie possible (pas de 5 kvar).`, check: () => { const x = st.res(); return x.c >= c2 && x.Qr >= 0 && st.Qc <= Math.ceil(Qc / 5) * 5 + 5 && st.P === P && Math.abs(st.cos - c1) < 1e-9; }, sol: `Qc = P (tan φ1 − tan φ2) = ${P} × (${AA.fmt(Math.tan(Math.acos(c1)), 3)} − ${AA.fmt(Math.tan(Math.acos(c2)), 3)}) = ${AA.fmt(Qc, 1)} kvar → ${Math.ceil(Qc / 5) * 5} kvar.` };
    }
  });

  /* ---------------- 3. Transformateur ---------------- */
  add({
    id: 'transfo', t: 'Transformateur', icon: 'gear', tag: 'Machines',
    d: 'Rapport des nombres de spires, tension et courant au secondaire, puissance conservée : le transformateur de commande expliqué.',
    build(el, st) {
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div><div class="lab-ctl">
        ${sl('U1', 'Tension primaire U1', 100, 400, 5, 400, 'V')}${sl('N1', 'Spires primaire N1', 100, 2000, 10, 1000, '')}${sl('N2', 'Spires secondaire N2', 10, 2000, 5, 60, '')}${sl('R', 'Charge au secondaire', 1, 200, 1, 12, 'Ω')}
        <div class="simout"><div><span>Rapport m = N2/N1</span><b class="o-m"></b></div><div><span>U2 = m × U1</span><b class="o-u2"></b></div><div><span>I2 = U2 / R</span><b class="o-i2"></b></div><div><span>I1 = m × I2</span><b class="o-i1"></b></div></div></div></div>`;
      bindAll(el, st, {});
      st.res = () => { const m = st.N2 / st.N1, U2 = st.U1 * m, I2 = U2 / st.R; return { m, U2, I2, I1: I2 * m, S: U2 * I2 }; };
      const cv = AA.canvas(el.querySelector('.cv'), 330, (g, W, H, t) => {
        const x = st.res();
        el.querySelector('.o-m').textContent = x.m.toFixed(4); el.querySelector('.o-u2').textContent = AA.fmt(x.U2, 1) + ' V';
        el.querySelector('.o-i2').textContent = AA.fmt(x.I2, 2) + ' A'; el.querySelector('.o-i1').textContent = AA.fmt(x.I1, 3) + ' A';
        const cx = W / 2, cy = H / 2 - 10;
        g.fillStyle = css('--surface-3'); g.strokeStyle = css('--line-2'); g.lineWidth = 2;
        g.beginPath(); g.rect(cx - 110, cy - 90, 220, 180); g.rect(cx - 70, cy - 50, 140, 100); g.fill('evenodd'); g.stroke();
        const coil = (x0, n, col, ph) => {
          const turns = Math.max(3, Math.min(22, Math.round(n / 70)));
          g.strokeStyle = col; g.lineWidth = 3;
          for (let i = 0; i < turns; i++) { const y = cy - 80 + i * (160 / turns) + 4; g.beginPath(); g.ellipse(x0, y, 26, 5, 0, Math.PI * (ph ? 1 : 0), Math.PI * (ph ? 2 : 1)); g.stroke(); }
        };
        coil(cx - 90, st.N1, css('--pot-L1'), 0); coil(cx + 90, st.N2, css('--teal'), 1);
        // flux magnétique animé
        g.strokeStyle = css('--amber'); g.globalAlpha = 0.6; g.setLineDash([8, 10]); g.lineDashOffset = -t * 40; g.lineWidth = 2.5;
        g.beginPath(); g.rect(cx - 90, cy - 70, 180, 140); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
        g.fillStyle = css('--ink'); g.font = '700 14px Bahnschrift'; g.textAlign = 'center';
        g.fillText(`U1 = ${st.U1} V`, cx - 170, cy); g.fillText(`U2 = ${AA.fmt(x.U2, 1)} V`, cx + 175, cy);
        g.fillStyle = css('--ink-3'); g.font = '500 12px Segoe UI'; g.fillText(`N1 = ${st.N1} spires · N2 = ${st.N2} spires · S = ${AA.fmt(x.S, 0)} VA`, cx, H - 14); g.textAlign = 'left';
      });
      return cv.stop;
    },
    challenge(r, el, st) {
      const U1 = r.pick([230, 400]), U2 = r.pick([12, 24, 48, 110]), N1 = r.pick([800, 1000, 1200, 1500]);
      setSlider(el, 'U1', U1); setSlider(el, 'N1', N1); setSlider(el, 'N2', 2000);
      const N2 = Math.round(U2 / U1 * N1 / 5) * 5;
      return { text: `Fabrique un transformateur de commande <b>${U1} V / ${U2} V</b> : le primaire compte <b>${N1} spires</b>. Règle le nombre de spires du secondaire (tolérance ±2 %).`, check: () => st.U1 === U1 && st.N1 === N1 && Math.abs(st.res().U2 - U2) / U2 <= 0.02, sol: `N2 = N1 × U2 / U1 = ${N1} × ${U2} / ${U1} ≈ ${N2} spires.` };
    }
  });

  /* ---------------- 4. Moteur asynchrone et variateur ---------------- */
  const MOT = { Pn: 4000, nn: 1440, p: 2, In: 8.2 };
  MOT.Tn = MOT.Pn / (MOT.nn * 2 * Math.PI / 60);
  MOT.Tmax = 2.5 * MOT.Tn;
  MOT.sk = (() => { const sn = 1 - MOT.nn / 1500, k = MOT.Tmax / MOT.Tn; const x = k - Math.sqrt(k * k - 1); return sn / x; })();
  LAB.torque = (n, f) => { const ns = 60 * f / MOT.p, dnk = MOT.sk * 1500, dn = ns - n; if (Math.abs(dn) < 1e-9) return 0; const tmax = MOT.Tmax * (f > 50 ? Math.pow(50 / f, 2) : 1); return 2 * tmax / (dn / dnk + dnk / dn); };
  LAB.opPoint = (f, load, Tc) => {
    const ns = 60 * f / MOT.p, dnk = MOT.sk * 1500;
    const Tl = n => load === 'quad' ? Tc * Math.pow(Math.max(0, n) / 1500, 2) : Tc;
    let lo = Math.max(0, ns - dnk), hi = ns;
    if (LAB.torque(lo, f) < Tl(lo)) return null; // décroche : couple de charge > couple maximal
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (LAB.torque(m, f) > Tl(m)) lo = m; else hi = m; }
    const n = (lo + hi) / 2, T = LAB.torque(n, f);
    return { n, T, P: T * n * 2 * Math.PI / 60, s: (ns - n) / ns, I: MOT.In * Math.sqrt(0.16 + 0.84 * Math.pow(T / MOT.Tn, 2)) };
  };
  add({
    id: 'moteur', t: 'Moteur et variateur', icon: 'gear', tag: 'Machines',
    d: 'Courbe couple-vitesse réelle d\'un moteur 4 kW, point de fonctionnement avec la charge, glissement, et variation de fréquence U/f.',
    build(el, st) {
      st.load = 'const';
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div><div class="lab-ctl">
        ${sl('f', 'Fréquence du variateur', 5, 70, 0.5, 50, 'Hz')}${sl('Tc', 'Couple de charge (à 1 500 tr/min)', 0, 70, 0.5, 26.5, 'N·m')}
        <div class="seg js-l"><button data-l="const" class="on">Convoyeur (couple constant)</button><button data-l="quad">Pompe / ventilateur (quadratique)</button></div>
        <div class="simout"><div><span>Vitesse</span><b class="o-n"></b></div><div><span>Glissement</span><b class="o-s"></b></div><div><span>Puissance utile</span><b class="o-p"></b></div><div><span>Courant (estimé)</span><b class="o-i"></b></div></div></div></div>`;
      bindAll(el, st, {});
      el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { st.load = b.dataset.l; el.querySelectorAll('[data-l]').forEach(x => x.classList.toggle('on', x === b)); });
      let ang = 0;
      const cv = AA.canvas(el.querySelector('.cv'), 340, (g, W, H, t) => {
        const op = LAB.opPoint(st.f, st.load, st.Tc);
        st.op = op;
        el.querySelector('.o-n').textContent = op ? AA.fmt(op.n, 0) + ' tr/min' : 'CALÉ';
        el.querySelector('.o-s').textContent = op ? AA.fmt(op.s * 100, 1) + ' %' : '—';
        el.querySelector('.o-p').textContent = op ? AA.fmt(op.P / 1000, 2) + ' kW' : '0';
        el.querySelector('.o-i').textContent = op ? AA.fmt(op.I, 1) + ' A' : '≈ 6 × In !';
        const x0 = 56, x1 = W - 120, y0 = H - 36, y1 = 20, nmax = 2200, tmax = 75;
        const X = n => x0 + n / nmax * (x1 - x0), Y = T => y0 - T / tmax * (y0 - y1);
        g.strokeStyle = css('--line'); g.lineWidth = 1; g.font = '500 11px Segoe UI'; g.fillStyle = css('--ink-3');
        for (let n = 0; n <= nmax; n += 500) { g.beginPath(); g.moveTo(X(n), y0); g.lineTo(X(n), y1); g.stroke(); g.fillText(n, X(n) - 10, y0 + 16); }
        for (let T = 0; T <= tmax; T += 25) { g.beginPath(); g.moveTo(x0, Y(T)); g.lineTo(x1, Y(T)); g.stroke(); g.fillText(T + ' N·m', 6, Y(T) + 4); }
        // courbes moteur (50 Hz en pâle)
        [[50, 0.25], [st.f, 1]].forEach(([f, a]) => {
          g.globalAlpha = a; g.strokeStyle = css('--copper-2'); g.lineWidth = 2.5; g.beginPath();
          const ns = 60 * f / MOT.p;
          for (let n = 0; n <= ns; n += 5) { const y = Y(LAB.torque(n, f)); n ? g.lineTo(X(n), y) : g.moveTo(X(n), y); }
          g.stroke(); g.globalAlpha = 1;
        });
        g.strokeStyle = css('--blue'); g.lineWidth = 2.5; g.beginPath();
        for (let n = 0; n <= nmax; n += 10) { const T = st.load === 'quad' ? st.Tc * Math.pow(n / 1500, 2) : st.Tc; const y = Y(Math.min(tmax, T)); n ? g.lineTo(X(n), y) : g.moveTo(X(n), y); }
        g.stroke();
        if (op) { g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(op.n), Y(op.T), 7, 0, 7); g.fill(); g.strokeStyle = css('--ink'); g.lineWidth = 2; g.stroke(); }
        g.fillStyle = css('--copper-2'); g.font = '600 12px Bahnschrift'; g.fillText('Couple moteur', x0 + 8, y1 + 14);
        g.fillStyle = css('--blue'); g.fillText('Couple résistant', x0 + 110, y1 + 14);
        // rotor qui tourne
        if (op) ang += op.n / 60 * 2 * Math.PI * 0.02;
        const rx = W - 58, ry = H / 2;
        g.fillStyle = css('--surface-3'); g.beginPath(); g.arc(rx, ry, 40, 0, 7); g.fill();
        g.strokeStyle = op ? css('--ok') : css('--bad'); g.lineWidth = 3; g.beginPath(); g.arc(rx, ry, 40, 0, 7); g.stroke();
        for (let k = 0; k < 6; k++) { const a = ang * 0.2 + k * Math.PI / 3; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + 34 * Math.cos(a), ry + 34 * Math.sin(a)); g.stroke(); }
        g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI'; g.textAlign = 'center'; g.fillText(op ? AA.fmt(op.n, 0) + ' tr/min' : 'calé', rx, ry + 58); g.textAlign = 'left';
      });
      return cv.stop;
    },
    challenge(r, el, st) {
      const load = r.pick(['const', 'quad']), Tc = r.pick([12, 18, 22, 26]), target = r.pick([600, 750, 900, 1100, 1250]);
      el.querySelector(`[data-l="${load}"]`).click(); setSlider(el, 'Tc', Tc); setSlider(el, 'f', 50);
      return { text: `${load === 'quad' ? 'Une pompe' : 'Un convoyeur'} impose <b>${Tc} N·m</b>${load === 'quad' ? ' à 1 500 tr/min (couple quadratique)' : ' (couple constant)'}. Règle le variateur pour que l'arbre tourne à <b>${target} tr/min ± 15</b>. Attention : la vitesse n'est pas exactement 30 × f, il y a le glissement.`, check: () => st.op && Math.abs(st.op.n - target) <= 15 && st.Tc === Tc && st.load === load, sol: 'Vitesse de synchronisme = 60 f / p = 30 f (p = 2 paires de pôles). En U/f constant, le glissement en tr/min reste à peu près constant pour un couple donné : f ≈ (n + glissement) / 30.' };
    }
  });

  /* ---------------- 5. Photovoltaïque ---------------- */
  const PV = { Voc: 37.5, Isc: 9.5, Ns: 60, n: 1.2, aI: 0.0005, bV: -0.0031 };
  LAB.pvI = (V, G, Tc) => {
    const Vt = 1.380649e-23 * (Tc + 273.15) / 1.602176634e-19 * PV.n * PV.Ns;
    const Isc = PV.Isc * G / 1000 * (1 + PV.aI * (Tc - 25));
    const Voc = Math.max(1, PV.Voc * (1 + PV.bV * (Tc - 25)) + Vt * Math.log(Math.max(G, 1) / 1000));
    const I0 = Isc / (Math.exp(Voc / Vt) - 1);
    return Math.max(0, Isc - I0 * (Math.exp(V / Vt) - 1));
  };
  LAB.pvMpp = (G, Tc) => { let best = { V: 0, P: 0 }; for (let V = 0; V < 45; V += 0.02) { const P = V * LAB.pvI(V, G, Tc); if (P > best.P) best = { V, P, I: P / V }; } return best; };
  LAB.pvAt = (R, G, Tc) => { let lo = 0, hi = 45; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (LAB.pvI(m, G, Tc) > m / R) lo = m; else hi = m; } const V = (lo + hi) / 2; return { V, I: V / R, P: V * V / R }; };
  add({
    id: 'pv', t: 'Module photovoltaïque', icon: 'star', tag: 'Énergies renouvelables',
    d: 'Courbes I-V et P-V réelles selon l\'ensoleillement et la température, point de puissance maximale (MPPT), influence de la charge.',
    build(el, st) {
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div><div class="lab-ctl">
        ${sl('G', 'Ensoleillement', 100, 1100, 10, 1000, 'W/m²')}${sl('T', 'Température des cellules', -10, 75, 1, 25, '°C')}${sl('R', 'Résistance de charge', 0.5, 20, 0.05, 6, 'Ω')}
        <div class="simout"><div><span>Point de fonctionnement</span><b class="o-op"></b></div><div><span>Puissance extraite</span><b class="o-p"></b></div><div><span>Puissance maximale possible</span><b class="o-m"></b></div><div><span>Rendement du suivi</span><b class="o-e"></b></div></div></div></div>`;
      bindAll(el, st, { R: v => v.toFixed(2) });
      let cache = '', mpp;
      const cv = AA.canvas(el.querySelector('.cv'), 340, (g, W, H) => {
        const key = st.G + '|' + st.T; if (key !== cache) { cache = key; mpp = LAB.pvMpp(st.G, st.T); }
        const op = LAB.pvAt(st.R, st.G, st.T); st.op = op; st.mpp = mpp;
        el.querySelector('.o-op').textContent = `${AA.fmt(op.V, 1)} V · ${AA.fmt(op.I, 2)} A`;
        el.querySelector('.o-p').textContent = AA.fmt(op.P, 0) + ' W'; el.querySelector('.o-m').textContent = AA.fmt(mpp.P, 0) + ' W';
        el.querySelector('.o-e').textContent = AA.fmt(op.P / mpp.P * 100, 1) + ' %';
        const x0 = 50, x1 = W - 50, y0 = H - 34, y1 = 18, X = V => x0 + V / 45 * (x1 - x0), Yi = I => y0 - I / 11 * (y0 - y1), Yp = P => y0 - P / 360 * (y0 - y1);
        g.strokeStyle = css('--line'); g.lineWidth = 1; g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI';
        for (let V = 0; V <= 45; V += 5) { g.beginPath(); g.moveTo(X(V), y0); g.lineTo(X(V), y1); g.stroke(); g.fillText(V + ' V', X(V) - 10, y0 + 16); }
        g.strokeStyle = css('--teal'); g.lineWidth = 2.5; g.beginPath();
        for (let V = 0; V <= 45; V += 0.25) { const y = Yi(LAB.pvI(V, st.G, st.T)); V ? g.lineTo(X(V), y) : g.moveTo(X(V), y); } g.stroke();
        g.strokeStyle = css('--amber'); g.beginPath();
        for (let V = 0; V <= 45; V += 0.25) { const y = Yp(V * LAB.pvI(V, st.G, st.T)); V ? g.lineTo(X(V), y) : g.moveTo(X(V), y); } g.stroke();
        g.strokeStyle = css('--ink-3'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(0), Yi(0)); g.lineTo(X(45), Yi(45 / st.R)); g.stroke(); g.setLineDash([]);
        g.fillStyle = css('--amber'); g.beginPath(); g.arc(X(mpp.V), Yp(mpp.P), 5, 0, 7); g.fill();
        g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(op.V), Yi(op.I), 7, 0, 7); g.fill();
        g.font = '600 12px Bahnschrift'; g.fillStyle = css('--teal'); g.fillText('I(V)', x0 + 6, y1 + 12); g.fillStyle = css('--amber'); g.fillText('P(V) — point MPP', x0 + 50, y1 + 12);
        g.fillStyle = css('--ink-3'); g.fillText('droite de charge I = V / R', x0 + 190, y1 + 12);
      });
      return cv.stop;
    },
    challenge(r, el, st) {
      const G = r.pick([300, 450, 600, 800, 950]), T = r.pick([5, 20, 35, 50, 65]);
      setSlider(el, 'G', G); setSlider(el, 'T', T); setSlider(el, 'R', 19);
      const m = LAB.pvMpp(G, T);
      return { text: `Ciel ${G < 500 ? 'voilé' : 'dégagé'}, <b>${G} W/m²</b>, cellules à <b>${T} °C</b>. Tu es le régulateur MPPT : règle la charge pour extraire au moins <b>98 %</b> de la puissance maximale.`, check: () => st.op && st.mpp && st.G === G && st.T === T && st.op.P >= 0.98 * st.mpp.P, sol: `Au point de puissance maximale : V ≈ ${AA.fmt(m.V, 1)} V, I ≈ ${AA.fmt(m.I, 2)} A, donc R = V / I ≈ ${AA.fmt(m.V / m.I, 2)} Ω.` };
    }
  });

  /* ---------------- 6. Régulation thermique tout-ou-rien ---------------- */
  LAB.thermo = (o, hours) => {
    // pièce : C dT/dt = Ph - (T - Text)/Rth ; résistance de chauffage avec inertie (constante tau_h)
    const Rth = 20 / 1500, Cth = 6e5, tauh = 240, dt = 10;
    let T = o.T0 != null ? o.T0 : o.sp - 3, Ph = 0, on = false, sw = 0;
    const out = [];
    for (let t = 0; t <= hours * 3600; t += dt) {
      if (T < o.sp - o.hy / 2 && !on) { on = true; sw++; }
      if (T > o.sp + o.hy / 2 && on) { on = false; }
      Ph += ((on ? o.P : 0) - Ph) * dt / tauh;
      T += (Ph - (T - o.Text) / Rth) * dt / Cth;
      if (t % 60 === 0) out.push([t, T, on]);
    }
    return { out, sw };
  };
  LAB.thermoEval = (o) => {
    const r = LAB.thermo(o, 8), tail = r.out.filter(p => p[0] >= 4 * 3600);
    const min = Math.min(...tail.map(p => p[1])), max = Math.max(...tail.map(p => p[1]));
    let cyc = 0; for (let i = 1; i < tail.length; i++) if (tail[i][2] && !tail[i - 1][2]) cyc++;
    return { min, max, cph: cyc / 4, reach: max > o.sp - 1 };
  };
  add({
    id: 'thermo', t: 'Régulation de chauffage', icon: 'flame', tag: 'Régulation',
    d: 'Un thermostat tout-ou-rien pilote un chauffage par contacteur : hystérésis, inertie, nombre de cycles et confort.',
    build(el, st) {
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div><div class="lab-ctl">
        ${sl('Text', 'Température extérieure', -15, 15, 1, 0, '°C')}${sl('sp', 'Consigne', 16, 24, 0.5, 20, '°C')}${sl('hy', 'Hystérésis (différentiel)', 0.2, 4, 0.1, 1, 'K')}${sl('P', 'Puissance de chauffage', 500, 4000, 100, 2000, 'W')}
        <div class="simout"><div><span>Plage atteinte (après 4 h)</span><b class="o-r"></b></div><div><span>Cycles du contacteur</span><b class="o-c"></b></div><div><span>Puissance nécessaire en régime</span><b class="o-n"></b></div></div></div></div>`;
      bindAll(el, st, { hy: v => v.toFixed(1) });
      let key = '', sim, ev;
      const cv = AA.canvas(el.querySelector('.cv'), 340, (g, W, H) => {
        const k = [st.Text, st.sp, st.hy, st.P].join('|');
        if (k !== key) { key = k; sim = LAB.thermo(st, 8); ev = LAB.thermoEval(st); st.ev = ev; }
        el.querySelector('.o-r').textContent = ev.reach ? `${AA.fmt(ev.min, 1)} → ${AA.fmt(ev.max, 1)} °C` : 'consigne jamais atteinte';
        el.querySelector('.o-c').textContent = AA.fmt(ev.cph, 1) + ' / h';
        el.querySelector('.o-n').textContent = AA.fmt((st.sp - st.Text) * 1500 / 20, 0) + ' W';
        const x0 = 46, x1 = W - 16, y0 = H - 50, y1 = 16;
        const tmin = Math.min(st.Text, st.sp - 4), tmax = st.sp + 4;
        const X = t => x0 + t / (8 * 3600) * (x1 - x0), Y = T => y0 - (T - tmin) / (tmax - tmin) * (y0 - y1);
        g.fillStyle = 'rgba(63,214,142,.08)'; g.fillRect(x0, Y(st.sp + 0.5), x1 - x0, Y(st.sp - 0.5) - Y(st.sp + 0.5));
        g.strokeStyle = css('--line'); g.lineWidth = 1; g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI';
        for (let h = 0; h <= 8; h++) { g.beginPath(); g.moveTo(X(h * 3600), y0); g.lineTo(X(h * 3600), y1); g.stroke(); g.fillText(h + ' h', X(h * 3600) - 6, y0 + 14); }
        g.strokeStyle = css('--ink-3'); g.setLineDash([5, 4]);
        [st.sp - st.hy / 2, st.sp + st.hy / 2].forEach(T => { g.beginPath(); g.moveTo(x0, Y(T)); g.lineTo(x1, Y(T)); g.stroke(); });
        g.setLineDash([]);
        g.strokeStyle = css('--live'); g.lineWidth = 2.2; g.beginPath();
        sim.out.forEach(([t, T], i) => i ? g.lineTo(X(t), Y(T)) : g.moveTo(X(t), Y(T))); g.stroke();
        g.fillStyle = css('--amber');
        sim.out.forEach(([t, , on]) => { if (on) g.fillRect(X(t), H - 28, Math.max(1, (x1 - x0) / sim.out.length + 0.5), 10); });
        g.fillStyle = css('--ink-3'); g.fillText('Contacteur de chauffage (ambre = fermé)', x0, H - 6);
      });
      return cv.stop;
    },
    challenge(r, el, st) {
      // on tire des conditions pour lesquelles une solution existe vraiment
      for (let k = 0; k < 40; k++) {
        const Text = r.pick([-10, -7, -5, -2, 0, 3, 6]), sp = r.pick([19, 20, 21]), maxC = r.pick([3, 4, 6]), band = r.pick([1.2, 1.5, 2]);
        let feasible = false;
        for (const P of [1000, 1500, 2000, 2500, 3000, 3500]) for (const hy of [0.4, 0.6, 0.8, 1, 1.2, 1.5]) {
          const e = LAB.thermoEval({ Text, sp, hy, P });
          if (e.reach && e.max - e.min <= band && e.cph <= maxC && e.min >= sp - band / 2 - 0.2) feasible = true;
        }
        if (!feasible) continue;
        setSlider(el, 'Text', Text); setSlider(el, 'sp', sp); setSlider(el, 'hy', 3); setSlider(el, 'P', 500);
        return { text: `Bureau à <b>${sp} °C</b> par <b>${Text} °C</b> dehors. Exigences : variation totale de température ≤ <b>${band} K</b>, contacteur ≤ <b>${maxC} cycles par heure</b> (usure), et le chauffage doit tenir la consigne. Choisis la puissance et l'hystérésis.`, check: () => st.ev && st.Text === Text && st.sp === sp && st.ev.reach && st.ev.max - st.ev.min <= band && st.ev.cph <= maxC, sol: 'Trop de puissance : dépassements et grosse amplitude (inertie). Trop peu : consigne jamais atteinte. Une hystérésis plus large réduit les cycles mais élargit la plage : il faut trouver le compromis.' };
      }
      return { text: 'Règle la régulation pour rester dans la bande verte.', check: () => st.ev && st.ev.max - st.ev.min < 1.5 };
    }
  });

  /* ---------------- 7. Chute de tension en ligne ---------------- */
  add({
    id: 'ligne', t: 'Chute de tension', icon: 'path', tag: 'Installation',
    d: 'Un câble a une résistance : plus il est long et fin, plus la tension baisse au bout et plus il chauffe. Visualise et dimensionne.',
    build(el, st) {
      el.innerHTML = `<div class="lab-grid"><div class="lab-view"><div class="cv"></div></div><div class="lab-ctl">
        ${sl('P', 'Puissance du récepteur', 500, 9000, 100, 3500, 'W')}${sl('L', 'Longueur du câble', 5, 200, 1, 40, 'm')}
        <div class="field"><label>Section</label><div class="seg js-s">${AA.TECH.SECTIONS.slice(0, 8).map(s => `<button data-s="${s}" class="${s === 2.5 ? 'on' : ''}">${AA.fmt(s)}</button>`).join('')}</div></div>
        <div class="simout"><div><span>Courant</span><b class="o-i"></b></div><div><span>Chute de tension</span><b class="o-d"></b></div><div><span>Tension au récepteur</span><b class="o-u"></b></div><div><span>Pertes dans le câble</span><b class="o-p"></b></div></div></div></div>`;
      st.S = 2.5;
      bindAll(el, st, {});
      el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { st.S = +b.dataset.s; el.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === b)); });
      st.res = () => { const I = st.P / 230, dU = AA.TECH.dU(false, st.L, st.S, 1, I); return { I, dU, U: 230 * (1 - dU / 100), Pj: 2 * 0.0225 * st.L / st.S * I * I }; };
      const cv = AA.canvas(el.querySelector('.cv'), 300, (g, W, H, t) => {
        const r = st.res();
        el.querySelector('.o-i').textContent = AA.fmt(r.I, 1) + ' A'; el.querySelector('.o-d').textContent = AA.fmt(r.dU, 2) + ' %';
        el.querySelector('.o-u').textContent = AA.fmt(r.U, 1) + ' V'; el.querySelector('.o-p').textContent = AA.fmt(r.Pj, 0) + ' W';
        const x0 = 70, x1 = W - 90, y = H / 2;
        const heat = Math.min(1, r.Pj / Math.max(1, st.L) / 4);
        const thick = 3 + st.S * 1.2;
        g.lineCap = 'round';
        g.strokeStyle = `rgb(${120 + 135 * heat},${100 - 40 * heat},${60 - 40 * heat})`; g.lineWidth = thick;
        g.beginPath(); g.moveTo(x0, y - 30); g.lineTo(x1, y - 30); g.moveTo(x0, y + 30); g.lineTo(x1, y + 30); g.stroke();
        g.strokeStyle = '#ffe2a8'; g.lineWidth = 2; g.setLineDash([3, 12]); g.lineDashOffset = -t * r.I * 4;
        g.beginPath(); g.moveTo(x0, y - 30); g.lineTo(x1, y - 30); g.stroke(); g.lineDashOffset = t * r.I * 4; g.beginPath(); g.moveTo(x1, y + 30); g.lineTo(x0, y + 30); g.stroke(); g.setLineDash([]);
        // dégradé de tension le long de la ligne
        for (let k = 0; k <= 10; k++) { const x = x0 + (x1 - x0) * k / 10; const u = 230 - (230 - r.U) * k / 10; g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; if (k % 5 === 0) g.fillText(AA.fmt(u, 1) + ' V', x - 16, y + 4); }
        g.fillStyle = css('--surface-3'); g.fillRect(14, y - 44, 50, 88); g.fillStyle = css('--ink'); g.font = '700 13px Bahnschrift'; g.fillText('230 V', 18, y + 4);
        const lum = Math.max(0, Math.min(1, (r.U - 190) / 40));
        g.fillStyle = `rgba(255,200,90,${0.2 + 0.8 * lum})`; g.beginPath(); g.arc(x1 + 40, y, 28, 0, 7); g.fill();
        g.fillStyle = css('--ink-3'); g.font = '500 12px Segoe UI'; g.fillText(`${st.L} m de câble · ${AA.fmt(st.S)} mm² · aller + retour`, x0, H - 14);
      });
      return cv.stop;
    },
    challenge(r, el, st) {
      const P = r.pick([2000, 3000, 3500, 4500, 6000, 7400]), L = r.pick([30, 45, 60, 80, 110, 140]), lim = r.pick([3, 5]);
      setSlider(el, 'P', P); setSlider(el, 'L', L);
      const I = P / 230, best = AA.TECH.SECTIONS.find(s => AA.TECH.dU(false, L, s, 1, I) <= lim);
      return { text: `Un ${P >= 7000 ? 'chargeur de véhicule' : 'récepteur résistif'} de <b>${P} W</b> en 230 V est situé à <b>${L} m</b> du tableau. Choisis la <b>plus petite section</b> qui garde la chute de tension ≤ <b>${lim} %</b> (on ignore ici l'échauffement).`, check: () => st.P === P && st.L === L && st.S === best, sol: `I = ${AA.fmt(I, 1)} A ; ΔU % = 2 × 0,0225 × L / S × I / 230 × 100 → ${AA.fmt(best)} mm² donne ${AA.fmt(AA.TECH.dU(false, L, best, 1, I), 2)} %.` };
    }
  });

  /* ---------------- Vues ---------------- */
  AA.route('labo', (main, [id]) => {
    const lab = LAB.list.find(l => l.id === id);
    if (!lab) {
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Labo</p><h1>L'électricité au travail</h1><p>Des modèles physiques réels, animés, que tu règles toi-même. Chaque labo a son défi tiré au hasard : les conditions changent à chaque essai.</p></div></div>
        <div class="grid g3">${LAB.list.map(l => `<a class="card tile lab-tile" href="#/labo/${l.id}"><span class="chip copper">${esc(l.tag)}</span><h3 class="row">${ic[l.icon] || ''}${esc(l.t)}</h3><p>${esc(l.d)}</p>${S.labo[l.id] ? `<span class="chip ok">${S.labo[l.id]} défi${S.labo[l.id] > 1 ? 's' : ''} réussi${S.labo[l.id] > 1 ? 's' : ''}</span>` : ''}<span class="go">Expérimenter ${ic.arrow}</span></a>`).join('')}</div>`;
      return;
    }
    const st = {};
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Labo · ${esc(lab.tag)}</p><h1>${esc(lab.t)}</h1><p>${esc(lab.d)}</p></div><a class="btn ghost" href="#/labo">${ic.back}Tous les labos</a></div>
      <div class="lab-host"></div>
      <div class="card lab-chal"><div class="row"><p class="eyebrow" style="margin:0">Défi du labo</p><span class="spacer"></span><button class="btn sm js-new">${ic.reset}Nouveau défi</button></div><div class="js-c"><p class="muted">Clique sur « Nouveau défi » quand tu as exploré le modèle.</p></div></div>`;
    const stop = lab.build(main.querySelector('.lab-host'), st);
    let poll = 0;
    const newChal = () => {
      clearInterval(poll);
      const c = lab.challenge(AA.rng(Date.now() ^ (Math.random() * 1e9)), main.querySelector('.lab-host'), st);
      const box = main.querySelector('.js-c');
      box.innerHTML = `<div class="brief">${c.text}</div><div class="js-r" style="margin-top:10px"></div>`;
      const win = () => {
        clearInterval(poll);
        S.labo[lab.id] = (S.labo[lab.id] || 0) + 1; AA.save();
        box.querySelector('.js-r').innerHTML = `<p class="ok-t">${ic.check} Défi réussi ! ${c.sol || ''}</p>`;
        AA.addXP(40, 'Labo : ' + lab.t);
      };
      if (c.num) {
        box.querySelector('.js-r').innerHTML = `<div class="num-in"><input inputmode="decimal" placeholder="ta réponse"><span class="unit">${c.num.unit}</span><button class="btn primary sm">Vérifier</button></div><div class="fb"></div>`;
        let tries = 0;
        box.querySelector('.js-r button').onclick = () => {
          const v = parseFloat(box.querySelector('input').value.replace(',', '.'));
          if (Math.abs(v - c.num.a) <= c.num.a * c.num.tol) { c.sol = c.num.sol; win(); }
          else if (++tries >= 3) box.querySelector('.fb').innerHTML = `<p class="bad-t">Solution : ${c.num.sol}</p>`;
          else box.querySelector('.fb').innerHTML = `<p class="bad-t">Pas encore (essai ${tries}/3). Utilise le labo pour vérifier ton raisonnement.</p>`;
        };
      } else {
        let hold = 0;
        poll = setInterval(() => {
          if (!box.isConnected) { clearInterval(poll); return; }
          let ok = false; try { ok = c.check(); } catch (e) { ok = false; }
          hold = ok ? hold + 1 : 0;
          if (hold >= 4) win(); // condition maintenue ~1 s
        }, 250);
        box.querySelector('.js-r').innerHTML = `<p class="muted">Règle le modèle : la validation est automatique dès que l'objectif est atteint et maintenu.</p><button class="btn sm ghost js-sol">Voir la méthode</button>`;
        box.querySelector('.js-sol').onclick = e => { e.currentTarget.outerHTML = `<p class="muted">${c.sol || ''}</p>`; };
      }
    };
    main.querySelector('.js-new').onclick = newChal;
    return { leave: () => { clearInterval(poll); if (stop) stop(); } };
  });

  LAB.selfTest = (log, eq) => {
    const op = LAB.opPoint(50, 'const', MOT.Tn);
    log(Math.abs(op.n - 1440) < 2, `Labo moteur : au couple nominal (${AA.fmt(MOT.Tn, 1)} N·m) le moteur tourne à ${AA.fmt(op.n, 1)} tr/min (plaque : 1 440)`);
    log(Math.abs(LAB.torque(1500 - MOT.sk * 1500, 50) - MOT.Tmax) < 0.01, 'Labo moteur : couple maximal 2,5 × Tn au glissement critique');
    log(LAB.opPoint(50, 'const', 80) === null, 'Labo moteur : couple de charge > couple maximal → décrochage');
    const m = LAB.pvMpp(1000, 25);
    log(m.P > 270 && m.P < 310 && m.V > 29 && m.V < 33, `Labo PV : MPP aux conditions STC = ${AA.fmt(m.P, 0)} W à ${AA.fmt(m.V, 1)} V (module 60 cellules réaliste)`);
    log(Math.abs(LAB.pvI(0, 1000, 25) - 9.5) < 0.01, 'Labo PV : Isc = 9,5 A à 1 000 W/m², 25 °C');
    const hot = LAB.pvMpp(1000, 65);
    log(hot.P < m.P * 0.9, `Labo PV : à 65 °C la puissance chute (${AA.fmt(hot.P, 0)} W)`);
    const e = LAB.thermoEval({ Text: 0, sp: 20, hy: 1, P: 2500 });
    log(e.reach && e.cph > 0, `Labo thermique : 2,5 kW par 0 °C tient 20 °C (${AA.fmt(e.min, 1)}–${AA.fmt(e.max, 1)} °C, ${e.cph} cycles/h)`);
    const e2 = LAB.thermoEval({ Text: -10, sp: 21, hy: 1, P: 1000 });
    log(!e2.reach, 'Labo thermique : 1 kW par −10 °C ne peut pas atteindre 21 °C (besoin 2,3 kW)');
  };
})();
