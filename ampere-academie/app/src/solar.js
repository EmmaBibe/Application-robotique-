/* Ampère Académie — solaire photovoltaïque, stockage et ASI : modèles, simulations et défis.
 * Modèles volontairement simples mais physiquement cohérents ; chaque hypothèse est affichée à l'écran.
 *  - Site isolé : production horaire = Pc × profil solaire (journée en cloche) × météo du jour × PR ;
 *    batterie avec profondeur de décharge (DoD) et rendement ; consommation horaire selon les appareils.
 *  - Chaînes : Voc(Tmin), Vmp(Tmax), Isc ; règles de compatibilité avec l'entrée MPPT de l'onduleur.
 *  - ASI : topologies IEC 62040-3 (VFD, VI, VFI), temps de transfert typiques, autonomie batterie. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const SIMS = AA.SIMS, css = n => AA.css(n);
  const SOL = AA.SOLAR = {};
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });

  /* Profil solaire horaire (somme = PSH) : cloche entre lever (6 h) et coucher (18 h) */
  SOL.sunProfile = (psh) => { const p = []; let s = 0; for (let h = 0; h < 24; h++) { const v = h >= 6 && h < 18 ? Math.sin((h + 0.5 - 6) / 12 * Math.PI) : 0; p.push(v); s += v; } return p.map(v => v / s * psh); };
  /* Appareils types : puissance (W), heures par jour, répartition (jour / soir / nuit) */
  SOL.APPL = [
    ['Éclairage LED (6 × 7 W)', 42, 5, 'soir'], ['Réfrigérateur A++', 80, 10, 'continu'], ['Télévision LED', 60, 4, 'soir'], ['Ordinateur portable', 45, 5, 'jour'],
    ['Box internet', 10, 24, 'continu'], ['Pompe de forage', 750, 2, 'jour'], ['Ventilateur', 50, 8, 'jour'], ['Machine à laver (cycle 40 °C)', 500, 1, 'jour'],
    ['Congélateur', 100, 9, 'continu'], ['Recharges téléphones', 15, 3, 'soir'], ['Climatiseur inverter 9000 BTU', 800, 4, 'jour'], ['Moulin électrique', 600, 0.5, 'jour']
  ];
  SOL.loadProfile = (loads) => {
    const p = new Array(24).fill(0);
    loads.forEach(([n, P, hrs, when]) => {
      const hours = when === 'jour' ? [9, 10, 11, 12, 13, 14, 15, 16] : when === 'soir' ? [18, 19, 20, 21, 22, 23, 6, 7] : [...Array(24).keys()];
      const e = P * hrs; hours.forEach(h => { p[h] += e / hours.length; });
    });
    return p;
  };
  /* Simulation horaire sur N jours. weather[d] ∈ [0..1] multiplie la production. */
  SOL.simulate = ({ loads, kWp, kWh, psh, days, weather, tech }) => {
    const B = tech === 'plomb' ? { dod: 0.5, eff: 0.85 } : { dod: 0.9, eff: 0.95 };
    const PR = 0.8, invEff = 0.93; // pertes câbles/température/poussière (PR) et rendement onduleur
    const sun = SOL.sunProfile(psh), load = SOL.loadProfile(loads).map(w => w / invEff);
    const cap = kWh * 1000, minSoc = cap * (1 - B.dod);
    let soc = cap, unserved = 0, curtailed = 0, need = 0, prod = 0, outageH = 0, daysOut = new Set();
    const trace = [];
    for (let d = 0; d < days; d++) for (let h = 0; h < 24; h++) {
      const pv = kWp * 1000 * sun[h] * PR * weather[d], c = load[h];
      prod += pv; need += c;
      let net = pv - c;
      if (net >= 0) { const room = cap - soc, inn = Math.min(room, net * Math.sqrt(B.eff)); soc += inn; curtailed += net - inn / Math.sqrt(B.eff); }
      else { const avail = (soc - minSoc) * Math.sqrt(B.eff), out = Math.min(avail, -net); soc -= out / Math.sqrt(B.eff); if (-net - out > 1e-6) { unserved += -net - out; outageH++; daysOut.add(d); } }
      trace.push({ pv, c, soc: soc / cap });
    }
    return { unserved, curtailed, need, prod, outageH, daysOut: daysOut.size, trace, minSocFrac: 1 - B.dod };
  };
  SOL.dailyNeed = loads => loads.reduce((a, l) => a + l[1] * l[2], 0);
  /* Dimensionnement de référence (méthode classique) */
  SOL.sizeRef = ({ E, psh, aut, tech }) => {
    const B = tech === 'plomb' ? { dod: 0.5, eff: 0.85 } : { dod: 0.9, eff: 0.95 };
    const Eac = E / 0.93;
    return { kWp: Eac / (psh * 0.8) / 1000 * 1.0 / 1, kWh: Eac * aut / (B.dod * B.eff) / 1000 };
  };

  /* ---------- Simulateur de site isolé ---------- */
  SIMS.offgrid = (el, o) => {
    o = o || {};
    const r = AA.rng(Date.now() ^ 2024);
    const st = { kWp: 1.6, kWh: 5, psh: 4.5 };
    let tech = 'lfp', sel = new Set([0, 1, 2, 3, 4, 9]);
    let weather = Array.from({ length: 14 }, () => r() < 0.25 ? 0.25 + 0.3 * r() : 0.8 + 0.2 * r());
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('kWp', 'Champ photovoltaïque', 0.2, 8, 0.1, 1.6, 'kWc')}${sl('kWh', 'Batterie (capacité nominale)', 1, 40, 0.5, 5, 'kWh')}${sl('psh', 'Ensoleillement du site (mois le plus défavorable)', 2, 7, 0.1, 4.5, 'kWh/m²/j')}
      <div class="seg js-t"><button data-t="lfp" class="on">LiFePO4 (DoD 90 %)</button><button data-t="plomb">Plomb (DoD 50 %)</button></div><button class="btn sm ghost js-w">Autre météo</button></div>
      <div class="og-loads">${SOL.APPL.map((a, i) => `<label class="chk"><input type="checkbox" data-i="${i}" ${sel.has(i) ? 'checked' : ''}> ${esc(a[0])} <small>${a[1]} W × ${a[2]} h</small></label>`).join('')}</div>
      <div class="simout"><div><span>Besoin journalier</span><b class="o-e"></b></div><div><span>Énergie non fournie (14 jours)</span><b class="o-u"></b></div><div><span>Jours avec coupure</span><b class="o-d"></b></div><div><span>Production perdue (batterie pleine)</span><b class="o-c"></b></div></div></div>`;
    bind(el, st, { kWp: v => AA.fmt(v, 1), psh: v => AA.fmt(v, 1), kWh: v => AA.fmt(v, 1) });
    el.querySelectorAll('.js-t button').forEach(b => b.onclick = () => { tech = b.dataset.t; el.querySelectorAll('.js-t button').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('.js-w').onclick = () => { weather = Array.from({ length: 14 }, () => r() < 0.25 ? 0.25 + 0.3 * r() : 0.8 + 0.2 * r()); };
    el.querySelectorAll('.og-loads input').forEach(c => c.onchange = () => { c.checked ? sel.add(+c.dataset.i) : sel.delete(+c.dataset.i); });
    let key = '', res;
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H) => {
      const loads = [...sel].map(i => SOL.APPL[i]);
      const k = JSON.stringify([st, tech, [...sel], weather]);
      if (k !== key) { key = k; res = SOL.simulate({ loads, kWp: st.kWp, kWh: st.kWh, psh: st.psh, days: 14, weather, tech }); if (o.onSim) o.onSim(res, st, tech, loads); }
      el.querySelector('.o-e').textContent = AA.fmt(SOL.dailyNeed(loads) / 1000, 2) + ' kWh/j';
      el.querySelector('.o-u').innerHTML = res.unserved > 1 ? `<span style="color:var(--bad)">${AA.fmt(res.unserved / 1000, 1)} kWh</span>` : '<span style="color:var(--ok)">0</span>';
      el.querySelector('.o-d').textContent = res.daysOut + ' / 14';
      el.querySelector('.o-c').textContent = AA.fmt(res.curtailed / 1000, 1) + ' kWh';
      const n = res.trace.length, x0 = 34, x1 = W - 8, y0 = H - 24, y1 = 14, X = i => x0 + i / n * (x1 - x0);
      const maxP = Math.max(500, ...res.trace.map(t => Math.max(t.pv, t.c)));
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI';
      for (let d = 0; d <= 14; d += 2) g.fillText('J' + d, X(d * 24) - 6, y0 + 14);
      // météo
      weather.forEach((w, d) => { g.fillStyle = w < 0.6 ? 'rgba(120,130,150,.18)' : 'rgba(255,200,60,.08)'; g.fillRect(X(d * 24), y1, X(24) - X(0), y0 - y1); });
      g.strokeStyle = css('--amber'); g.lineWidth = 1.2; g.beginPath(); res.trace.forEach((t, i) => { const y = y0 - t.pv / maxP * (y0 - y1) * 0.6; i ? g.lineTo(X(i), y) : g.moveTo(X(i), y); }); g.stroke();
      g.strokeStyle = css('--bad'); g.beginPath(); res.trace.forEach((t, i) => { const y = y0 - t.c / maxP * (y0 - y1) * 0.6; i ? g.lineTo(X(i), y) : g.moveTo(X(i), y); }); g.stroke();
      g.strokeStyle = css('--teal'); g.lineWidth = 2.4; g.beginPath(); res.trace.forEach((t, i) => { const y = y0 - t.soc * (y0 - y1); i ? g.lineTo(X(i), y) : g.moveTo(X(i), y); }); g.stroke();
      g.setLineDash([4, 4]); g.strokeStyle = css('--teal'); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0 - res.minSocFrac * (y0 - y1)); g.lineTo(x1, y0 - res.minSocFrac * (y0 - y1)); g.stroke(); g.setLineDash([]);
      g.font = '600 11px Bahnschrift'; g.fillStyle = css('--teal'); g.fillText('état de charge batterie', x0 + 4, y1 + 12); g.fillStyle = css('--amber'); g.fillText('production', x0 + 150, y1 + 12); g.fillStyle = css('--bad'); g.fillText('consommation', x0 + 230, y1 + 12);
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText('Hypothèses : PR 0,8 ; onduleur 93 % ; journées grises = 25 à 55 % de production. Pointillé : décharge maximale autorisée.', x0, H - 2);
    });
    return cv.stop;
  };

  /* ---------- Conception d'une chaîne de modules ---------- */
  SOL.module = { n: 'Module 425 Wc (108 demi-cellules, type n)', Pmp: 425, Voc: 38.9, Vmp: 32.4, Isc: 13.9, Imp: 13.12, bVoc: -0.0025, bVmp: -0.0029 };
  SOL.inverter = { n: 'Onduleur 5 kW, 2 MPPT', Vmax: 600, mpMin: 120, mpMax: 550, Iscmax: 20, mppt: 2 };
  SOL.checkString = (m, inv, Ns, Np, Tmin, Tmax) => {
    const Voc = Ns * m.Voc * (1 + m.bVoc * (Tmin - 25));
    const VmpHot = Ns * m.Vmp * (1 + m.bVmp * (Tmax - 25)), VmpCold = Ns * m.Vmp * (1 + m.bVmp * (Tmin - 25));
    const Isc = Np * m.Isc;
    return { Voc, VmpHot, VmpCold, Isc, okV: Voc <= inv.Vmax, okLow: VmpHot >= inv.mpMin, okHigh: VmpCold <= inv.mpMax, okI: Isc <= inv.Iscmax, P: Ns * Np * m.Pmp };
  };
  SIMS.strings = (el, o) => {
    o = o || {};
    const m = o.module || SOL.module, inv = o.inverter || SOL.inverter;
    const st = { Ns: 10, Np: 1, Tmin: o.Tmin != null ? o.Tmin : -10, Tmax: o.Tmax != null ? o.Tmax : 70 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Ns', 'Modules en série (par chaîne)', 1, 20, 1, 10, '')}${sl('Np', 'Chaînes en parallèle sur l\'entrée MPPT', 1, 3, 1, 1, '')}${sl('Tmin', 'Température minimale du site', -25, 15, 1, st.Tmin, '°C')}${sl('Tmax', 'Température maximale des cellules', 50, 85, 1, st.Tmax, '°C')}</div>
      <div class="simout js-o"></div><p class="muted" style="padding:0 16px 14px;font-size:12.5px">${esc(m.n)} : Voc ${m.Voc} V, Vmp ${m.Vmp} V, Isc ${m.Isc} A, coefficient Voc ${(m.bVoc * 100).toFixed(2)} %/°C. ${esc(inv.n)} : tension maximale ${inv.Vmax} V, plage MPPT ${inv.mpMin}-${inv.mpMax} V, Isc max ${inv.Iscmax} A par entrée.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W, H, t) => {
      const c = SOL.checkString(m, inv, st.Ns, st.Np, st.Tmin, st.Tmax);
      const row = (ok, n, v) => `<div><span>${n}</span><b style="color:var(${ok ? '--ok' : '--bad'})">${v} ${ok ? '✔' : '✘'}</b></div>`;
      el.querySelector('.js-o').innerHTML = row(c.okV, `Voc à ${st.Tmin} °C ≤ ${inv.Vmax} V`, AA.fmt(c.Voc, 0) + ' V') + row(c.okLow, `Vmp à ${st.Tmax} °C ≥ ${inv.mpMin} V`, AA.fmt(c.VmpHot, 0) + ' V') + row(c.okHigh, `Vmp à ${st.Tmin} °C ≤ ${inv.mpMax} V`, AA.fmt(c.VmpCold, 0) + ' V') + row(c.okI, `Isc ≤ ${inv.Iscmax} A`, AA.fmt(c.Isc, 1) + ' A') + `<div><span>Puissance crête de l'entrée</span><b>${AA.fmt(c.P / 1000, 2)} kWc</b></div>`;
      if (o.onCheck) o.onCheck(c, st);
      const w = Math.min(36, (W - 40) / Math.max(1, st.Ns)), h = 24;
      for (let p = 0; p < st.Np; p++) for (let s = 0; s < st.Ns; s++) {
        const x = 20 + s * w, y = 18 + p * (h + 12);
        g.fillStyle = '#1b2a4a'; g.fillRect(x, y, w - 4, h); g.strokeStyle = '#8fa8d6'; g.strokeRect(x, y, w - 4, h);
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(x + (w - 4) / 2, y); g.lineTo(x + (w - 4) / 2, y + h); g.stroke();
      }
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(`${st.Np} chaîne(s) de ${st.Ns} modules → entrée MPPT`, 20, H - 6);
    });
    return cv.stop;
  };

  /* ---------- PWM ou MPPT ---------- */
  SIMS.mppt = el => {
    const st = { G: 1000, T: 25, cells: 36 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('G', 'Ensoleillement', 200, 1100, 50, 1000, 'W/m²')}${sl('T', 'Température des cellules', -10, 70, 1, 25, '°C')}<div class="seg js-c"><button data-c="36" class="on">Module 36 cellules</button><button data-c="60">Module 60 cellules</button></div></div>
      <div class="simout"><div><span>Batterie</span><b>12,8 V (LiFePO4 4S)</b></div><div><span>Régulateur PWM : le module travaille à la tension de la batterie</span><b class="o-p"></b></div><div><span>Régulateur MPPT (rendement 97 %)</span><b class="o-m"></b></div></div></div>`;
    bind(el, st, {});
    el.querySelectorAll('.js-c button').forEach(b => b.onclick = () => { st.cells = +b.dataset.c; el.querySelectorAll('.js-c button').forEach(x => x.classList.toggle('on', x === b)); });
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H) => {
      const k = 60 / st.cells, I = V => (AA.Labo && AA.Labo.pvI) ? AA.Labo.pvI(V * k, st.G, st.T) : 0; // mêmes cellules, tension proportionnelle au nombre de cellules
      let best = { V: 0, P: 0 }; for (let V = 0; V < 50 / k; V += 0.05) { const P = V * I(V); if (P > best.P) best = { V, P }; }
      const Pp = 13.6 * I(13.6); // tension de charge ≈ 13,6 V
      el.querySelector('.o-p').textContent = AA.fmt(Pp, 0) + ' W';
      el.querySelector('.o-m').textContent = AA.fmt(best.P * 0.97, 0) + ' W (MPP ' + AA.fmt(best.V, 1) + ' V)';
      const x0 = 40, x1 = W - 14, y0 = H - 24, y1 = 14, Vmax = 50 / k, X = V => x0 + V / Vmax * (x1 - x0), Pm = Math.max(50, best.P * 1.15), Y = P => y0 - P / Pm * (y0 - y1);
      g.strokeStyle = css('--amber'); g.lineWidth = 2.4; g.beginPath(); for (let V = 0; V <= Vmax; V += Vmax / 200) { const y = Y(V * I(V)); V ? g.lineTo(X(V), y) : g.moveTo(X(V), y); } g.stroke();
      g.fillStyle = css('--bad'); g.beginPath(); g.arc(X(13.6), Y(Pp), 6, 0, 7); g.fill(); g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(best.V), Y(best.P), 6, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Courbe P(V) du module ; rouge : point imposé par un PWM, vert : point de puissance maximale (MPPT)', x0, y1 + 4);
    });
    return cv.stop;
  };

  /* ---------- Ombrage et diodes de dérivation ---------- */
  SIMS.shade = el => {
    const st = { s: 60 }; let bypass = true;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('s', 'Ombrage d\'une rangée de cellules sur 1 module (chaîne de 10)', 0, 100, 5, 60, '%')}<label class="chk"><input type="checkbox" class="js-b" checked> diodes de dérivation (3 par module)</label></div>
      <div class="simout"><div><span>Puissance de la chaîne</span><b class="o-p"></b></div></div></div>`;
    bind(el, st, {});
    el.querySelector('.js-b').onchange = e => { bypass = e.target.checked; };
    const cv = AA.canvas(el.querySelector('.simview'), 140, (g, W) => {
      const s = st.s / 100;
      // sans diode : le courant de toute la chaîne est limité par la cellule ombrée ; avec : le tiers ombré est contourné si c'est plus favorable
      const noBy = 1 - s, withBy = Math.max(1 - s, (10 - 1 / 3) / 10);
      const frac = bypass ? withBy : noBy;
      el.querySelector('.o-p').innerHTML = `${AA.fmt(frac * 100, 0)} % de la puissance nominale ${!bypass && s > 0.3 ? '<small style="color:var(--bad)">(et la cellule ombrée chauffe : point chaud)</small>' : ''}`;
      for (let i = 0; i < 10; i++) {
        const x = 16 + i * (W - 32) / 10, w = (W - 32) / 10 - 6;
        for (let k = 0; k < 3; k++) { const shaded = i === 3 && k === 1 && s > 0; const by = bypass && shaded && withBy > noBy; g.fillStyle = shaded ? `rgba(30,40,70,${1 - 0.6 * s})` : '#1b2a4a'; g.fillRect(x, 20 + k * 26, w, 22); if (by) { g.strokeStyle = css('--ok'); g.lineWidth = 2; g.strokeRect(x, 20 + k * 26, w, 22); } }
        if (i === 3 && s > 0) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 46, w * s, 22); }
      }
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Modèle simplifié : un tiers de module contourné par sa diode quand l\'ombrage est important.', 16, 128);
    });
    return cv.stop;
  };

  /* ---------- Orientation et inclinaison ---------- */
  SOL.orient = (tilt, az, lat) => { const b0 = Math.max(10, 0.87 * Math.abs(lat)); const a = 9.2e-5, b = 0.34; return Math.max(0.3, 1 - a * Math.pow(tilt - b0, 2) - b * (1 - Math.cos(az * Math.PI / 180)) * Math.sin(tilt * Math.PI / 180)); };
  SIMS.orient = el => {
    const st = { tilt: 30, az: 0, lat: 45 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('tilt', 'Inclinaison', 0, 90, 1, 30, '°')}${sl('az', 'Écart d\'orientation par rapport à l\'équateur (sud dans l\'hémisphère nord)', 0, 180, 5, 0, '°')}${sl('lat', 'Latitude du site', 0, 60, 1, 45, '°')}</div>
      <div class="simout"><div><span>Production relative à l'optimum</span><b class="o-y"></b></div><div><span>Inclinaison optimale (règle simple)</span><b class="o-o"></b></div></div></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 170, (g, W, H) => {
      const y = SOL.orient(st.tilt, st.az, st.lat);
      el.querySelector('.o-y').textContent = AA.fmt(y * 100, 0) + ' %';
      el.querySelector('.o-o').textContent = AA.fmt(Math.max(10, 0.87 * st.lat), 0) + '° plein ' + (st.lat >= 0 ? 'sud (nord dans l\'hémisphère sud)' : '');
      const cx = W * 0.3, cy = H - 30;
      g.strokeStyle = css('--ink'); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 70, cy); g.lineTo(cx + 70, cy); g.stroke();
      g.save(); g.translate(cx, cy); g.rotate(-st.tilt * Math.PI / 180); g.fillStyle = '#1b2a4a'; g.fillRect(0, -6, 110, 8); g.restore();
      const sx = cx + 120 * Math.cos(-(90 - Math.max(10, 0.87 * st.lat)) * Math.PI / 180 + Math.PI), sy = cy - 110;
      g.fillStyle = css('--amber'); g.beginPath(); g.arc(W * 0.12, 30, 14, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Ordre de grandeur (modèle simplifié) ; pour un projet réel, utiliser les données d\'ensoleillement du site (par exemple PVGIS).', 10, H - 6);
      // rose d'orientation
      const rx = W * 0.75, ry = H / 2 - 8;
      g.strokeStyle = css('--line-2'); g.lineWidth = 1; g.beginPath(); g.arc(rx, ry, 52, 0, 7); g.stroke();
      g.fillStyle = css('--ink-3'); g.fillText('équateur', rx - 20, ry + 68); g.fillText('pôle', rx - 10, ry - 58);
      const a = st.az * Math.PI / 180; g.strokeStyle = css('--copper'); g.lineWidth = 3; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + Math.sin(a) * 46, ry + Math.cos(a) * 46); g.stroke();
      void sx; void sy;
    });
    return cv.stop;
  };

  /* ---------- ASI : trois technologies ---------- */
  SOL.UPS = { VFD: { n: 'Off-line / attente passive (VFD)', gap: 8, filt: false }, VI: { n: 'Interactive / line-interactive (VI)', gap: 4, filt: 'partiel' }, VFI: { n: 'Double conversion / on-line (VFI)', gap: 0, filt: true } };
  SIMS.ups = el => {
    let topo = 'VFI', ev = null, t0 = 0, load = 60, tol = 10;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-t">${Object.entries(SOL.UPS).map(([k, u]) => `<button data-t="${k}" class="${k === topo ? 'on' : ''}">${k}</button>`).join('')}</div>
      <button class="btn sm" data-e="cut">Coupure réseau</button><button class="btn sm" data-e="sag">Creux de tension (60 %)</button><button class="btn sm" data-e="spike">Surtension</button><button class="btn sm ghost" data-e="none">Réseau normal</button></div>
      <div class="simout"><div><span>Technologie</span><b class="o-n"></b></div><div><span>Temps de transfert typique</span><b class="o-g"></b></div><div><span>Charge sensible (tient ${tol} ms)</span><b class="o-r"></b></div></div></div>`;
    el.querySelectorAll('.js-t button').forEach(b => b.onclick = () => { topo = b.dataset.t; el.querySelectorAll('.js-t button').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { ev = b.dataset.e === 'none' ? null : b.dataset.e; t0 = performance.now() / 1000; });
    const cv = AA.canvas(el.querySelector('.simview'), 250, (g, W, H, t) => {
      const u = SOL.UPS[topo];
      el.querySelector('.o-n').textContent = u.n;
      el.querySelector('.o-g').textContent = u.gap ? 'environ ' + u.gap + ' ms (2 à 10 ms selon les modèles)' : 'aucun : l\'onduleur alimente en permanence';
      const surv = !ev || (ev === 'cut' ? u.gap <= tol : ev === 'sag' ? (topo !== 'VFD' || u.gap <= tol) : true);
      el.querySelector('.o-r').innerHTML = !ev ? 'alimentée' : surv ? '<span style="color:var(--ok)">alimentée sans interruption perçue</span>' : '<span style="color:var(--bad)">redémarre (coupure trop longue)</span>';
      // schéma
      const box = (x, y, w, h, lbl, on) => { g.fillStyle = on ? 'rgba(255,140,0,.15)' : css('--surface-2'); g.fillRect(x, y, w, h); g.strokeStyle = on ? css('--copper') : css('--line-2'); g.lineWidth = 2; g.strokeRect(x, y, w, h); g.fillStyle = css('--ink'); g.font = '600 11px Bahnschrift'; g.fillText(lbl, x + 6, y + h / 2 + 4); };
      const mains = !ev || ev === 'spike' || ev === 'sag';
      box(10, 30, 70, 34, 'Réseau', mains); box(W - 90, 30, 80, 34, 'Charge', surv);
      if (topo === 'VFI') { box(110, 20, 80, 26, 'Redresseur', mains); box(110, 76, 80, 26, 'Batterie', !mains || ev === 'sag'); box(220, 20, 80, 26, 'Onduleur', true); box(220, 76, 80, 26, 'Bypass statique', false); }
      else if (topo === 'VI') { box(140, 20, 120, 26, 'Régulateur (autotransfo)', mains && ev !== 'sag'); box(140, 76, 120, 26, 'Onduleur + batterie', !mains || ev === 'sag'); }
      else { box(140, 20, 120, 26, 'Ligne directe (filtre)', mains); box(140, 76, 120, 26, 'Onduleur + batterie', !mains || ev === 'sag'); }
      // forme d'onde en sortie
      const y0 = H - 60, A = 34, x0 = 20, x1 = W - 20, span = 0.12, te = ev ? (t - t0) % 2 : 9;
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      g.strokeStyle = surv ? css('--ok') : css('--bad'); g.lineWidth = 2; g.beginPath();
      for (let x = x0; x <= x1; x++) {
        const tt = (x - x0) / (x1 - x0) * span; let v = Math.sin(2 * Math.PI * 50 * tt);
        const tev = 0.04; // événement à 40 ms sur l'écran
        if (ev && tt >= tev) {
          if (ev === 'cut') { if (topo !== 'VFI' && tt < tev + u.gap / 1000) v = 0; }
          if (ev === 'sag') { if (topo === 'VFD') v *= tt < tev + u.gap / 1000 ? 0.6 : 1; }
          if (ev === 'spike' && topo === 'VFD' && Math.abs(tt - tev - 0.002) < 0.0015) v = 2.2;
        }
        const y = y0 - v * A; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Tension de sortie (120 ms affichées, événement à 40 ms). Valeurs de transfert typiques : se référer à la fiche de l\'appareil (IEC 62040-3).', x0, H - 10);
    });
    return cv.stop;
  };

  /* ---------- ASI + groupe électrogène + inverseur de sources ---------- */
  SIMS.ats = el => {
    const st = { aut: 10, start: 12 };
    let t0 = null;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('aut', 'Autonomie de l\'ASI', 1, 30, 1, 10, 'min')}${sl('start', 'Démarrage + stabilisation du groupe', 5, 40, 1, 12, 's')}<button class="btn sm js-go">Simuler une coupure réseau de 2 min</button></div>
      <p class="muted js-d" style="padding:0 16px 14px;font-size:13px"></p></div>`;
    bind(el, st, {});
    el.querySelector('.js-go').onclick = () => { t0 = performance.now() / 1000; };
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const T = t0 === null ? -1 : (performance.now() / 1000 - t0) * 10; // ×10 : 1 s réelle = 10 s simulées
      const x0 = 120, x1 = W - 14, X = s => x0 + s / 150 * (x1 - x0);
      const rows = [['Réseau', s => s < 0 || s >= 120], ['Groupe électrogène', s => s >= st.start && s < 125], ['Inverseur de sources', s => s >= st.start + 2 && s < 122], ['ASI sur batterie', s => s >= 0 && s < st.start + 2 || (s >= 120 && s < 122)], ['Serveurs (via ASI)', s => true], ['Éclairage (non secouru par l\'ASI)', s => s < 0 || s >= st.start + 2]];
      rows.forEach(([n, f], k) => {
        const y = 24 + k * 28;
        g.fillStyle = css('--ink-2'); g.font = '600 11px Bahnschrift'; g.fillText(n, 8, y + 12);
        for (let s = 0; s < 150; s += 0.5) { g.fillStyle = f(s) ? (k === 3 ? css('--warn') : css('--ok')) : css('--surface-3'); g.fillRect(X(s), y, X(0.5) - X(0) + 0.5, 16); }
      });
      if (T >= 0) { g.strokeStyle = css('--copper'); g.lineWidth = 2; g.beginPath(); g.moveTo(X(Math.min(150, T)), 16); g.lineTo(X(Math.min(150, T)), H - 22); g.stroke(); }
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; [0, 30, 60, 90, 120, 150].forEach(s => g.fillText(s + ' s', X(s) - 6, H - 8));
      el.querySelector('.js-d').textContent = `L'ASI couvre le trou de ${st.start + 2} s entre la coupure et la reprise par le groupe, puis le retour au réseau. Son autonomie (${st.aut} min) n'a pas besoin d'être longue : elle doit couvrir le démarrage du groupe, plus une marge en cas d'échec de démarrage. Les charges non secourues (éclairage) subissent la coupure.`;
    });
    return cv.stop;
  };

  /* ---------- Batteries : plomb ou LiFePO4 ---------- */
  SIMS.battery = el => {
    const st = { kWh: 10, dod: 50 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('kWh', 'Capacité nominale', 2, 30, 1, 10, 'kWh')}${sl('dod', 'Profondeur de décharge quotidienne', 20, 100, 5, 50, '%')}</div>
      <div class="simout"><div><span>Énergie utilisable par jour</span><b class="o-e"></b></div><div><span>Durée de vie estimée — plomb (AGM / gel)</span><b class="o-p"></b></div><div><span>Durée de vie estimée — LiFePO4</span><b class="o-l"></b></div></div></div>`;
    bind(el, st, {});
    const lifePb = d => 1200 * Math.pow(50 / d, 1.4), lifeLfp = d => 6000 * Math.pow(80 / Math.max(d, 20), 0.8);
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H) => {
      const d = st.dod;
      el.querySelector('.o-e').textContent = AA.fmt(st.kWh * d / 100, 1) + ' kWh';
      el.querySelector('.o-p').innerHTML = `≈ ${AA.fmt(lifePb(d), 0)} cycles ${d > 50 ? '<small style="color:var(--bad)">(au-delà de 50 % le plomb s\'use très vite)</small>' : ''}`;
      el.querySelector('.o-l').textContent = `≈ ${AA.fmt(Math.min(10000, lifeLfp(d)), 0)} cycles`;
      const x0 = 46, x1 = W - 14, y0 = H - 26, y1 = 12, X = v => x0 + (v - 20) / 80 * (x1 - x0), Y = c => y0 - Math.min(1, c / 10000) * (y0 - y1);
      [['plomb', lifePb, css('--warn')], ['LiFePO4', lifeLfp, css('--teal')]].forEach(([n, f, col]) => { g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); for (let v = 20; v <= 100; v++) { const y = Y(Math.min(10000, f(v))); v === 20 ? g.moveTo(X(v), y) : g.lineTo(X(v), y); } g.stroke(); g.fillStyle = col; g.font = '600 11px Bahnschrift'; g.fillText(n, X(70), Y(Math.min(10000, f(70))) - 6); });
      g.strokeStyle = css('--copper'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(d), y0); g.lineTo(X(d), y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText('Courbes indicatives (ordres de grandeur des fiches techniques) : se référer au fabricant.', x0, y1 + 8);
      [20, 50, 80, 100].forEach(v => g.fillText(v + ' %', X(v) - 8, y0 + 14));
    });
    return cv.stop;
  };

  /* Bloc générique : intégrer un labo existant dans une leçon */
  SIMS.lab = (el, o) => { const lab = AA.Labo && AA.Labo.list.find(l => l.id === o.id); if (!lab) return; return lab.build(el, {}); };

  /* ================= DÉFIS ================= */
  const SITES = [['Kinshasa', 4.1], ['Lubumbashi', 5.2], ['Dakar', 5.4], ['Abidjan', 4.0], ['Marseille (décembre)', 1.9], ['Lyon (décembre)', 1.2], ['Douala', 3.6], ['Bamako', 5.6], ['Antananarivo', 4.8], ['Marrakech', 4.6]];
  AA.Defis.TYPES.solaire = {
    name: 'Site isolé photovoltaïque', icon: 'star', min: 2,
    desc: 'Un client sans réseau, une liste d\'appareils, un climat : dimensionne champ et batterie. La simulation sur 14 jours tranche ; la meilleure solution est la moins chère qui ne coupe jamais.',
    gen(r, lvl) {
      const site = r.pick(SITES.filter(s => s[1] >= 2.5 || lvl >= 4));
      const n = 3 + lvl + r.int(0, 2);
      const loads = r.shuffle(SOL.APPL).slice(0, n);
      const tech = lvl >= 3 ? r.pick(['lfp', 'plomb']) : 'lfp';
      const weather = Array.from({ length: 14 }, () => r() < (lvl >= 4 ? 0.3 : 0.2) ? 0.25 + 0.3 * r() : 0.8 + 0.2 * r());
      return { site, loads, tech, weather, lvl, sig: site[0] + loads.map(l => l[0]).join('') + tech };
    },
    cost: (kWp, kWh, tech) => kWp * 600 + kWh * (tech === 'plomb' ? 160 : 320),
    best(inst) {
      // pour chaque puissance de champ, plus petite batterie qui ne coupe jamais (recherche dichotomique : la coupure diminue quand la batterie grandit)
      const ok = (kWp, kWh) => SOL.simulate({ loads: inst.loads, kWp, kWh, psh: inst.site[1], days: 14, weather: inst.weather, tech: inst.tech }).unserved < 1;
      let best = null;
      for (let i = 2; i <= 200; i++) {
        const kWp = i / 10;
        if (!ok(kWp, 100)) continue;
        let lo = 1, hi = 100;
        if (ok(kWp, lo)) hi = lo; else { while (hi - lo > 0.5) { const m = Math.round((lo + hi) / 2 * 2) / 2; if (ok(kWp, m)) hi = m; else lo = m; } }
        const c = this.cost(kWp, hi, inst.tech);
        if (!best || c < best.c) best = { kWp, kWh: hi, c };
      }
      return best;
    },
    play(main, inst, done) {
      const E = SOL.dailyNeed(inst.loads);
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Site isolé · ${['', 'Initiation', 'Confirmé', 'Avancé', 'Expert', 'Maître'][inst.lvl]}</p><h1>Électrifier un site à ${esc(inst.site[0])}</h1></div></div>
        <div class="brief">Un client, sans raccordement au réseau, veut alimenter : ${inst.loads.map(l => `<b>${esc(l[0])}</b> (${l[1]} W, ${l[2]} h/j)`).join(', ')}. Ensoleillement du mois le plus défavorable : <b>${AA.fmt(inst.site[1])} kWh/m²/j</b>. Batterie imposée : <b>${inst.tech === 'plomb' ? 'plomb (DoD 50 %)' : 'LiFePO4 (DoD 90 %)'}</b>. Exigence : <b>aucune coupure</b> sur les 14 jours simulés (météo variable). Coût indicatif : 600 € par kWc, ${inst.tech === 'plomb' ? 160 : 320} € par kWh de batterie.</div>
        <div class="grid g2" style="margin-top:14px"><div class="card"><p class="eyebrow">Ta solution</p>
          <div class="field"><label>Puissance du champ (kWc)</label><input type="text" class="js-p" inputmode="decimal" placeholder="ex. 2,4"></div>
          <div class="field"><label>Capacité batterie (kWh)</label><input type="text" class="js-b" inputmode="decimal" placeholder="ex. 10"></div>
          <button class="btn primary js-ok">${ic.check}Simuler 14 jours</button><div class="js-fb"></div></div>
          <div class="card"><p class="eyebrow">Aide</p><p class="muted" style="font-size:13.5px">Besoin journalier : <b>${AA.fmt(E / 1000, 2)} kWh</b>. Méthode classique : P<sub>c</sub> = E / (onduleur 0,93 × ensoleillement × PR 0,8) ; C = E × jours d'autonomie / (DoD × rendement). La simulation horaire montre si la batterie tient les soirées et les jours gris.</p><div class="js-chart"></div></div></div>`;
      let finished = false;
      main.querySelector('.js-ok').onclick = () => {
        const kWp = parseFloat(main.querySelector('.js-p').value.replace(',', '.')), kWh = parseFloat(main.querySelector('.js-b').value.replace(',', '.'));
        if (!(kWp > 0 && kWh > 0)) return;
        const res = SOL.simulate({ loads: inst.loads, kWp, kWh, psh: inst.site[1], days: 14, weather: inst.weather, tech: inst.tech });
        const best = this.best(inst) || { kWp: 20, kWh: 100, c: this.cost(20, 100, inst.tech) }, cost = this.cost(kWp, kWh, inst.tech);
        const ok = res.unserved < 1;
        const score = ok ? Math.max(40, Math.round(100 - Math.max(0, (cost / best.c - 1)) * 120)) : 0;
        main.querySelector('.js-fb').innerHTML = `<div class="result ${ok ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>${ok ? 'Aucune coupure.' : `Coupures : ${AA.fmt(res.unserved / 1000, 1)} kWh non fournis, ${res.daysOut} jour(s) touché(s).`} Coût : ${AA.fmt(cost, 0)} €.</p><p class="muted">Meilleure solution trouvée par recherche exhaustive : ${AA.fmt(best.kWp, 1)} kWc et ${AA.fmt(best.kWh, 1)} kWh (${AA.fmt(best.c, 0)} €). D'autres combinaisons fonctionnent : plus de panneaux et moins de batterie, ou l'inverse.</p>${ok && !finished ? `<div class="row"><a class="btn primary" href="#/defi/solaire/${Date.now()}/${inst.lvl}">Nouveau site</a></div>` : ''}</div>`;
        if (ok && !finished) { finished = true; done(score); }
      };
    }
  };
  AA.Defis.TYPES.chaines = {
    name: 'Chaînes de modules', icon: 'sigma', min: 3,
    desc: 'Un module, un onduleur, un climat extrême : combien de modules en série et de chaînes en parallèle ? Les températures changent tout.',
    gen(r, lvl) {
      const Voc = r.pick([37.2, 38.9, 41.5, 45.6, 49.5]), ratio = 0.835, Isc = r.pick([11.2, 13.9, 14.4, 18.4]);
      const m = { n: `Module ${Math.round(Voc * ratio * Isc * 0.94 / 5) * 5} Wc`, Pmp: Math.round(Voc * ratio * Isc * 0.94 / 5) * 5, Voc, Vmp: Math.round(Voc * ratio * 10) / 10, Isc, bVoc: r.pick([-0.0024, -0.0025, -0.0027, -0.0029]), bVmp: -0.0030 };
      const inv = r.pick([{ n: 'Onduleur 3,6 kW', Vmax: 600, mpMin: 100, mpMax: 550, Iscmax: 20 }, { n: 'Onduleur 8 kW', Vmax: 1000, mpMin: 200, mpMax: 850, Iscmax: 32 }, { n: 'Onduleur 5 kW', Vmax: 600, mpMin: 120, mpMax: 550, Iscmax: 20 }]);
      const Tmin = r.pick([-20, -15, -10, -5, 0, 5]), Tmax = r.pick([60, 65, 70, 75]);
      return { m, inv, Tmin, Tmax, lvl, sig: Voc + '' + Isc + inv.n + Tmin + Tmax };
    },
    play(main, inst, done) {
      const allOk = []; for (let Ns = 1; Ns <= 30; Ns++) for (let Np = 1; Np <= 3; Np++) { const c = SOL.checkString(inst.m, inst.inv, Ns, Np, inst.Tmin, inst.Tmax); if (c.okV && c.okLow && c.okHigh && c.okI) allOk.push({ Ns, Np, P: c.P }); }
      const best = allOk.sort((a, b) => b.P - a.P)[0];
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Chaînes de modules</p><h1>Câbler l'entrée MPPT</h1></div></div>
        <div class="brief">Site : <b>${inst.Tmin} °C</b> au plus froid (au lever du soleil), cellules jusqu'à <b>${inst.Tmax} °C</b> en été. Trouve une configuration valide qui donne la <b>plus grande puissance crête</b> possible sur cette entrée.</div>
        <div class="js-s" style="margin-top:14px"></div><button class="btn primary js-ok">${ic.check}Valider ma configuration</button><div class="js-fb"></div>`;
      let cur = null, finished = false;
      SIMS.strings(main.querySelector('.js-s'), { module: inst.m, inverter: inst.inv, Tmin: inst.Tmin, Tmax: inst.Tmax, onCheck: (c, st) => { cur = { c, st }; } });
      main.querySelector('.js-ok').onclick = () => {
        if (!cur) return;
        const c = cur.c, valid = c.okV && c.okLow && c.okHigh && c.okI;
        const score = !valid ? 0 : Math.round(100 * c.P / best.P);
        main.querySelector('.js-fb').innerHTML = `<div class="result ${valid ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>${valid ? 'Configuration valide.' : 'Configuration non valide : une limite de l\'onduleur est dépassée (un ✘ ci-dessus).'} Meilleure configuration : ${best.Np} × ${best.Ns} modules (${AA.fmt(best.P / 1000, 2)} kWc). ${allOk.length} configurations sont valides.</p><p class="muted">Rappel : la tension à vide augmente quand il fait froid (coefficient négatif) — c'est elle qui détruit les onduleurs ; la tension MPP baisse quand les cellules chauffent.</p></div>`;
        if (valid && !finished) { finished = true; done(score); }
      };
    }
  };
  AA.Defis.TYPES.asi = {
    name: 'Choisir une ASI', icon: 'bolt', min: 2,
    desc: 'Des équipements sensibles, une puissance, un facteur de puissance, une autonomie : choisis la technologie et la puissance de l\'ASI.',
    gen(r, lvl) {
      const sc = r.pick([
        { n: 'baie informatique d\'une PME', sens: 'élevée', P: [1.8, 2.6, 3.4], pf: 0.95, aut: 10, gen: false },
        { n: 'automate et pupitre de supervision d\'une station de pompage', sens: 'moyenne', P: [0.4, 0.6, 0.9], pf: 0.8, aut: 30, gen: false },
        { n: 'salle de serveurs avec groupe électrogène', sens: 'élevée', P: [12, 18, 24], pf: 0.95, aut: 8, gen: true },
        { n: 'caisse enregistreuse d\'un commerce', sens: 'faible', P: [0.25, 0.35], pf: 0.7, aut: 10, gen: false },
        { n: 'laboratoire d\'analyses médicales', sens: 'élevée', P: [4, 6, 8], pf: 0.9, aut: 15, gen: true }
      ]);
      return { sc, P: r.pick(sc.P), lvl, sig: sc.n + sc.P };
    },
    RATINGS: [0.6, 1, 1.5, 2, 3, 5, 6, 10, 15, 20, 30, 40],
    play(main, inst, done) {
      const kW = inst.P, kVA = kW / inst.sc.pf;
      const need = kVA * 1.25; // marge 25 % (extensions, vieillissement)
      const best = this.RATINGS.find(v => v * 0.9 >= kW * 1.25 && v >= need); // ASI à facteur de puissance de sortie 0,9 : kW = 0,9 × kVA
      const bestTopo = inst.sc.sens === 'faible' ? 'VI' : 'VFI';
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · ASI</p><h1>Secourir ${esc(inst.sc.n)}</h1></div></div>
        <div class="brief">Charge : <b>${AA.fmt(kW)} kW</b>, facteur de puissance <b>${inst.sc.pf}</b> (soit ${AA.fmt(kVA, 2)} kVA). Sensibilité des équipements aux micro-coupures : <b>${inst.sc.sens}</b>. Autonomie demandée : <b>${inst.sc.aut} min</b>${inst.sc.gen ? ', un groupe électrogène prend ensuite le relais' : ''}. Les ASI proposées ont un facteur de puissance de sortie de 0,9 (puissance active = 0,9 × puissance apparente). Prévois 25 % de marge.</div>
        <div class="grid g2" style="margin-top:14px"><div class="card dec"><p class="eyebrow">Technologie</p><div class="opts">${Object.entries(SOL.UPS).map(([k, u]) => `<button class="opt" data-t="${k}">${u.n}</button>`).join('')}</div></div>
        <div class="card dec"><p class="eyebrow">Puissance apparente de l'ASI</p><div class="opts" style="grid-template-columns:repeat(4,1fr)">${this.RATINGS.map(v => `<button class="opt" data-v="${v}">${AA.fmt(v)} kVA</button>`).join('')}</div></div></div>
        <button class="btn primary js-ok" style="margin-top:12px">${ic.check}Valider</button><div class="js-fb"></div>`;
      let t = null, v = null, finished = false;
      main.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { t = b.dataset.t; main.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); });
      main.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { v = +b.dataset.v; main.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); });
      main.querySelector('.js-ok').onclick = () => {
        if (!t || !v) return;
        const topoOk = t === bestTopo || (t === 'VFI'), topoBest = t === bestTopo;
        const powOk = v * 0.9 >= kW && v >= kVA, powBest = v === best;
        const score = Math.round((topoBest ? 50 : topoOk ? 35 : 0) + (powBest ? 50 : powOk ? 30 : 0));
        main.querySelector('.js-fb').innerHTML = `<div class="result"><div class="score-big">${score}</div>
          <p>Technologie : ${topoBest ? 'optimale' : topoOk ? 'acceptable (plus coûteuse que nécessaire)' : 'inadaptée'}. ${inst.sc.sens === 'faible' ? 'Pour un équipement peu sensible, une ASI interactive (VI) suffit ; le double conversion fonctionne aussi mais coûte plus cher.' : 'Pour des équipements sensibles, seule la double conversion (VFI) garantit une tension sans aucune interruption ni perturbation.'}</p>
          <p>Puissance : ${powBest ? 'optimale' : powOk ? 'suffisante mais sans la marge ou surdimensionnée' : 'insuffisante'}. Besoin avec marge : ${AA.fmt(kW * 1.25, 2)} kW et ${AA.fmt(need, 2)} kVA → ${AA.fmt(best)} kVA (soit ${AA.fmt(best * 0.9, 2)} kW).</p></div>`;
        if (!finished) { finished = true; done(score); }
      };
    }
  };

  SOL.selfTest = (log, eq) => {
    const m = SOL.module, inv = SOL.inverter;
    const c = SOL.checkString(m, inv, 14, 1, -10, 70);
    log(Math.abs(c.Voc - 14 * 38.9 * (1 + 0.0025 * 35)) < 0.01, `Chaînes : Voc à −10 °C de 14 modules = ${AA.fmt(c.Voc, 1)} V (Voc augmente au froid)`);
    log(!SOL.checkString(m, inv, 15, 1, -10, 70).okV && SOL.checkString(m, inv, 13, 1, -10, 70).okV, 'Chaînes : 15 modules dépassent 600 V à −10 °C, 13 modules passent');
    log(!SOL.checkString(m, inv, 3, 1, -10, 70).okLow, 'Chaînes : 3 modules ne suffisent pas pour la plage MPPT à 70 °C');
    log(!SOL.checkString(m, inv, 10, 2, -10, 70).okI, 'Chaînes : 2 chaînes de 13,9 A dépassent 20 A');
    const E = 2000, ref = SOL.sizeRef({ E, psh: 5, aut: 1, tech: 'lfp' });
    log(Math.abs(ref.kWp - 2000 / 0.93 / 5 / 0.8 / 1000) < 1e-9 && Math.abs(ref.kWh - 2000 / 0.93 / 0.855 / 1000) < 1e-9, `Site isolé : méthode classique pour 2 kWh/j à 5 kWh/m²/j → ${AA.fmt(ref.kWp, 2)} kWc et ${AA.fmt(ref.kWh, 2)} kWh (1 jour, LiFePO4)`);
    const loads = [SOL.APPL[0], SOL.APPL[1]], sun = SOL.sunProfile(4.5);
    log(Math.abs(sun.reduce((a, b) => a + b, 0) - 4.5) < 1e-9, 'Site isolé : le profil solaire horaire totalise bien l\'ensoleillement journalier');
    const big = SOL.simulate({ loads, kWp: 2, kWh: 10, psh: 4.5, days: 14, weather: new Array(14).fill(1), tech: 'lfp' });
    const small = SOL.simulate({ loads, kWp: 0.1, kWh: 1, psh: 4.5, days: 14, weather: new Array(14).fill(1), tech: 'lfp' });
    log(big.unserved === 0 && small.unserved > 0, 'Site isolé : une installation largement dimensionnée ne coupe pas, une installation minuscule coupe');
    const w = AA.VIS && AA.VIS.twoW ? AA.VIS.twoW(400, 10, 60) : { W2: 0 };
    log(Math.abs(w.W2) < 1e-6, 'Deux wattmètres : W2 = 0 pour φ = 60°');
    log(Math.abs(SOL.orient(Math.max(10, 0.87 * 45), 0, 45) - 1) < 1e-9 && SOL.orient(90, 0, 45) < 0.8, 'Orientation : 100 % à l\'optimum, moins de 80 % en façade verticale');
  };
})();
