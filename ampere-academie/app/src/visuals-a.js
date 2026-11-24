/* Ampère Académie — visualisations des leçons (partie A) : composants génériques (ordonner, choisir,
 * zones cliquables) et simulations sécurité / protection : défaut en schéma TT, courbes de disjoncteur,
 * différentiel, parafoudre, échauffement des câbles, coupes de câbles, tableau de logement.
 * Toutes les valeurs sont typiques et signalées comme telles quand elles dépendent du matériel. */
(function () {
  'use strict';
  const { esc } = AA;
  const SIMS = AA.SIMS;
  const css = n => AA.css(n);
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt, cb) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); if (cb) cb(k); }; i.addEventListener('input', u); u(); });
  AA.VIS = AA.VIS || {};

  /* ---------- Générique : remettre des étapes dans le bon ordre ---------- */
  SIMS.order = (el, o) => {
    const r = AA.rng(Date.now());
    let items = r.shuffle(o.steps.map((s, i) => ({ s, i })));
    if (items.every((x, k) => x.i === k)) items.reverse();
    el.innerHTML = `<div class="simcard vis-order"><div class="vo-head"><b>${o.title}</b><span class="muted">Clique deux étapes pour les échanger, puis vérifie.</span></div><ol class="vo-list"></ol><div class="row" style="padding:0 16px 14px"><button class="btn primary sm js-chk">Vérifier l'ordre</button><span class="js-fb"></span></div></div>`;
    const list = el.querySelector('.vo-list');
    let sel = null;
    const draw = () => { list.innerHTML = items.map((x, k) => `<li data-k="${k}" class="${sel === k ? 'sel' : ''}"><i>${k + 1}</i><span>${x.s[0]}</span></li>`).join(''); };
    draw();
    list.addEventListener('click', e => {
      const li = e.target.closest('li'); if (!li) return;
      const k = +li.dataset.k;
      if (sel === null) sel = k; else { [items[sel], items[k]] = [items[k], items[sel]]; sel = null; AA.click(1200, 0.03); }
      draw();
    });
    el.querySelector('.js-chk').onclick = () => {
      const bad = items.findIndex((x, k) => x.i !== k);
      const fb = el.querySelector('.js-fb');
      if (bad < 0) { fb.innerHTML = `<span class="ok-t">✔ Ordre correct. ${o.ok || ''}</span>`; list.querySelectorAll('li').forEach(l => l.classList.add('good')); }
      else { const x = items[bad]; fb.innerHTML = `<span class="bad-t">L'étape ${bad + 1} n'est pas à sa place. ${x.s[1] ? esc(x.s[1]) : ''}</span>`; }
    };
  };

  /* ---------- Générique : choisir les bons éléments (EPI, couleurs, équipements) ---------- */
  SIMS.choose = (el, o) => {
    const r = AA.rng(Date.now() ^ 7);
    let cur = r.pick(o.cases);
    const draw = () => {
      el.innerHTML = `<div class="simcard vis-choose"><div class="vo-head"><b>${o.title}</b><span>${cur.q}</span></div>
        <div class="vc-grid">${o.items.map(([k, n, d]) => `<button class="vc-item" data-k="${k}"><b>${n}</b><span>${d || ''}</span></button>`).join('')}</div>
        <div class="row" style="padding:0 16px 14px"><button class="btn primary sm js-chk">Vérifier</button><button class="btn sm ghost js-new">Autre situation</button><span class="js-fb"></span></div></div>`;
      el.querySelectorAll('.vc-item').forEach(b => b.onclick = () => b.classList.toggle('on'));
      el.querySelector('.js-new').onclick = () => { cur = r.pick(o.cases.filter(c => c !== cur)) || cur; draw(); };
      el.querySelector('.js-chk').onclick = () => {
        const on = [...el.querySelectorAll('.vc-item.on')].map(b => b.dataset.k);
        const miss = cur.need.filter(k => !on.includes(k)), extra = on.filter(k => (cur.no || []).includes(k));
        el.querySelectorAll('.vc-item').forEach(b => { const k = b.dataset.k; b.classList.toggle('good', cur.need.includes(k)); b.classList.toggle('bad', (cur.no || []).includes(k) && on.includes(k)); });
        const name = k => (o.items.find(i => i[0] === k) || [k, k])[1];
        el.querySelector('.js-fb').innerHTML = !miss.length && !extra.length ? `<span class="ok-t">✔ ${cur.why || 'Correct.'}</span>` : `<span class="bad-t">${miss.length ? 'Manque : ' + miss.map(name).join(', ') + '. ' : ''}${extra.length ? 'Inadapté : ' + extra.map(name).join(', ') + '. ' : ''}${cur.why || ''}</span>`;
      };
    };
    draw();
  };

  /* ---------- Générique : dessin avec zones cliquables ---------- */
  SIMS.hotspots = (el, o) => {
    el.innerHTML = `<div class="simcard vis-hot"><div class="vh-art">${o.svg}</div><div class="vh-info card plain"><p class="eyebrow">${o.title}</p><p class="muted">${o.hint || 'Clique une zone du dessin.'}</p></div></div>`;
    const info = el.querySelector('.vh-info'), seen = new Set();
    el.querySelectorAll('[data-spot]').forEach(z => {
      z.classList.add('spot');
      z.addEventListener('click', () => {
        const s = o.spots[z.dataset.spot]; if (!s) return;
        seen.add(z.dataset.spot); z.classList.add('seen');
        el.querySelectorAll('[data-spot]').forEach(x => x.classList.toggle('on', x === z));
        info.innerHTML = `<p class="eyebrow">${o.title}</p><h3>${s[0]}</h3><p>${s[1]}</p><p class="muted">${seen.size} / ${Object.keys(o.spots).length} découverts</p>`;
      });
    });
  };

  /* ---------- Défaut d'isolement en schéma TT ---------- */
  SIMS.tt = el => {
    const st = { RA: 60, RB: 10, ddr: 30, fault: 0, touch: 0 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('RA', 'Prise de terre de l\'installation R<sub>A</sub>', 2, 500, 1, 60, 'Ω')}${sl('RB', 'Terre du neutre du poste R<sub>B</sub>', 1, 50, 1, 10, 'Ω')}
      <div class="seg js-ddr">${[[0, 'Sans différentiel'], [30, '30 mA'], [300, '300 mA'], [500, '500 mA S']].map(([v, t]) => `<button data-v="${v}" class="${v === 30 ? 'on' : ''}">${t}</button>`).join('')}</div>
      <button class="btn sm js-fault">Provoquer un défaut d'isolement</button><button class="btn sm ghost js-reset">Réarmer</button></div>
      <div class="simout"><div><span>Courant de défaut I<sub>d</sub> = U<sub>0</sub> / (R<sub>A</sub> + R<sub>B</sub>)</span><b class="o-id"></b></div><div><span>Tension de contact U<sub>c</sub> = R<sub>A</sub> × I<sub>d</sub></span><b class="o-uc"></b></div><div><span>Protection</span><b class="o-p"></b></div></div></div>`;
    bind(el, st, {});
    let tripped = false;
    el.querySelectorAll('.js-ddr button').forEach(b => b.onclick = () => { st.ddr = +b.dataset.v; tripped = false; el.querySelectorAll('.js-ddr button').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('.js-fault').onclick = () => { st.fault = 1; tripped = false; };
    el.querySelector('.js-reset').onclick = () => { st.fault = 0; tripped = false; };
    const cv = AA.canvas(el.querySelector('.simview'), 280, (g, W, H, t) => {
      const Id = st.fault && !tripped ? 230 / (st.RA + st.RB) : 0, Uc = st.RA * Id;
      if (st.fault && st.ddr && !tripped && 230 / (st.RA + st.RB) * 1000 >= st.ddr) tripped = true;
      el.querySelector('.o-id').textContent = st.fault ? AA.fmt(230 / (st.RA + st.RB), 2) + ' A' : '0 A';
      el.querySelector('.o-uc').textContent = st.fault ? AA.fmt(st.RA * 230 / (st.RA + st.RB), 0) + ' V' : '0 V';
      el.querySelector('.o-p').innerHTML = !st.fault ? 'en attente' : tripped ? '<span style="color:var(--ok)">DDR déclenché</span>' : st.ddr ? '…' : `<span style="color:var(--bad)">${Uc > 50 ? 'DANGER : masse sous ' + AA.fmt(Uc, 0) + ' V' : 'défaut non coupé'}</span>`;
      const ink = css('--ink'), flow = css('--flow'), bad = css('--bad');
      g.lineWidth = 2; g.strokeStyle = ink; g.fillStyle = ink; g.font = '600 12px Bahnschrift';
      // transformateur du poste
      g.beginPath(); g.arc(50, 60, 16, 0, 7); g.stroke(); g.beginPath(); g.arc(50, 84, 16, 0, 7); g.stroke();
      g.fillText('Poste', 30, 30);
      // phase et neutre
      g.beginPath(); g.moveTo(66, 70); g.lineTo(W - 140, 70); g.stroke(); g.fillText('Phase', 90, 64);
      g.beginPath(); g.moveTo(50, 100); g.lineTo(50, 130); g.lineTo(W - 140, 130); g.stroke(); g.fillText('Neutre', 90, 124);
      // terre RB
      const earth = (x, y, lbl) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 30); g.moveTo(x - 14, y + 30); g.lineTo(x + 14, y + 30); g.moveTo(x - 9, y + 36); g.lineTo(x + 9, y + 36); g.moveTo(x - 4, y + 42); g.lineTo(x + 4, y + 42); g.stroke(); g.fillText(lbl, x + 18, y + 34); };
      earth(50, 130, 'R_B = ' + st.RB + ' Ω');
      // DDR
      const xd = W * 0.42;
      g.strokeStyle = st.ddr ? (tripped ? css('--ok') : ink) : css('--ink-3'); g.strokeRect(xd - 26, 54, 52, 92); g.fillText(st.ddr ? 'DDR ' + st.ddr + ' mA' : '(aucun)', xd - 26, 48);
      if (tripped) { g.fillStyle = css('--ok'); g.fillText('OUVERT', xd - 22, 104); g.fillStyle = ink; }
      // appareil (masse)
      const xa = W - 140;
      g.strokeStyle = ink; g.fillStyle = css('--surface-2'); g.fillRect(xa, 50, 90, 100); g.strokeRect(xa, 50, 90, 100); g.fillStyle = ink; g.fillText('Lave-linge', xa + 12, 104);
      // PE vers RA
      g.beginPath(); g.moveTo(xa + 45, 150); g.lineTo(xa + 45, 190); g.lineTo(xa - 60, 190); g.lineTo(xa - 60, 200); g.stroke(); earth(xa - 60, 200, 'R_A = ' + st.RA + ' Ω');
      g.fillText('PE (vert-jaune)', xa - 50, 184);
      // défaut et circulation
      if (st.fault) {
        g.strokeStyle = bad; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(xa + 20, 70); g.lineTo(xa + 20, 120); g.lineTo(xa + 45, 140); g.stroke(); g.setLineDash([]);
        g.fillStyle = bad; g.fillText('⚡ défaut', xa + 26, 126);
        if (Id) {
          g.strokeStyle = flow; g.lineWidth = 3; g.setLineDash([3, 10]); g.lineDashOffset = -t * 40;
          g.beginPath(); g.moveTo(66, 70); g.lineTo(xa + 20, 70); g.lineTo(xa + 20, 120); g.lineTo(xa + 45, 150); g.lineTo(xa + 45, 190); g.lineTo(xa - 60, 190); g.lineTo(xa - 60, 240); g.lineTo(50, 240); g.lineTo(50, 160); g.stroke(); g.setLineDash([]);
          g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI'; g.fillText('le courant revient par la terre, pas par le neutre : le DDR voit la différence', 70, H - 10);
        }
      }
    });
    return cv.stop;
  };

  /* ---------- Courbes de déclenchement d'un disjoncteur (IEC 60898, allure indicative) ---------- */
  AA.VIS.cbTime = (k, curve) => {
    const lo = { B: 3, C: 5, D: 10 }[curve], hi = { B: 5, C: 10, D: 20 }[curve];
    if (k >= hi) return { t: 0.01, zone: 'mag' };
    const th = k > 1.13 ? 52 / (k * k - 1.2769) : Infinity;
    if (k >= lo) return { t: Math.min(th, 0.01 + th), zone: 'maybe', th };
    return { t: th, zone: k > 1.13 ? 'th' : 'none' };
  };
  SIMS.breaker = el => {
    const st = { In: 16, k: 1.5, curve: 'C' };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-c">${['B', 'C', 'D'].map(c => `<button data-c="${c}" class="${c === 'C' ? 'on' : ''}">Courbe ${c}</button>`).join('')}</div>
      ${sl('In', 'Calibre I<sub>n</sub>', 6, 63, 1, 16, 'A')}${sl('k', 'Courant / I<sub>n</sub>', 1, 30, 0.05, 1.5, '× In')}</div>
      <div class="simout"><div><span>Courant</span><b class="o-i"></b></div><div><span>Temps de déclenchement (allure)</span><b class="o-t"></b></div><div><span>Déclencheur</span><b class="o-z"></b></div></div></div>`;
    bind(el, st, { k: v => AA.fmt(v, 2) });
    el.querySelectorAll('.js-c button').forEach(b => b.onclick = () => { st.curve = b.dataset.c; el.querySelectorAll('.js-c button').forEach(x => x.classList.toggle('on', x === b)); });
    const cv = AA.canvas(el.querySelector('.simview'), 300, (g, W, H) => {
      const x0 = 56, x1 = W - 20, y0 = H - 34, y1 = 14;
      const X = k => x0 + (Math.log10(k) - 0) / Math.log10(30) * (x1 - x0), Y = t => y0 - (Math.log10(t) + 2) / 6 * (y0 - y1); // 0,01 s → 10 000 s
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.lineWidth = 1;
      [1, 2, 3, 5, 10, 20, 30].forEach(k => { g.beginPath(); g.moveTo(X(k), y0); g.lineTo(X(k), y1); g.stroke(); g.fillText(k + '×', X(k) - 8, y0 + 14); });
      [0.01, 0.1, 1, 10, 100, 1000, 10000].forEach(t => { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); g.fillText(t >= 1 ? (t >= 60 ? (t >= 3600 ? Math.round(t / 3600) + ' h' : Math.round(t / 60) + ' min') : t + ' s') : t + ' s', 4, Y(t) + 4); });
      const lo = { B: 3, C: 5, D: 10 }[st.curve], hi = { B: 5, C: 10, D: 20 }[st.curve];
      // bande thermique
      g.fillStyle = 'rgba(255,140,0,.18)'; g.beginPath();
      for (let k = 1.14; k <= hi; k += 0.02) { const t = Math.min(1e4, 52 / (k * k - 1.2769) * 3); g.lineTo(X(k), Y(t)); }
      for (let k = hi; k >= 1.14; k -= 0.02) { const t = Math.max(0.01, 52 / (k * k - 1.2769) / 3); g.lineTo(X(k), Y(Math.min(1e4, t))); }
      g.fill();
      g.fillStyle = 'rgba(220,40,60,.16)'; g.fillRect(X(lo), Y(1e4), X(hi) - X(lo), Y(0.01) - Y(1e4));
      g.fillStyle = css('--ink-2'); g.fillText('zone thermique', X(1.6), Y(300));
      g.fillText('zone magnétique', X(lo) + 4, Y(2000));
      const r = AA.VIS.cbTime(st.k, st.curve);
      const I = st.k * st.In;
      el.querySelector('.o-i').textContent = AA.fmt(I, 1) + ' A';
      el.querySelector('.o-t').textContent = r.zone === 'none' ? 'pas de déclenchement' : r.zone === 'mag' ? '< 0,1 s (instantané)' : r.zone === 'maybe' ? 'instantané possible, sinon ' + fmtT(r.th) : '≈ ' + fmtT(r.t);
      el.querySelector('.o-z').textContent = r.zone === 'none' ? 'aucun (≤ 1,13 In)' : r.zone === 'th' ? 'thermique (surcharge)' : r.zone === 'mag' ? 'magnétique (court-circuit)' : 'zone d\'incertitude magnétique';
      const yt = r.zone === 'none' ? Y(1e4) : Y(Math.max(0.01, Math.min(1e4, r.t)));
      g.strokeStyle = css('--copper'); g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(st.k), y0); g.lineTo(X(st.k), yt); g.lineTo(x0, yt); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--copper'); g.beginPath(); g.arc(X(st.k), yt, 6, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Allure indicative (référence : IEC 60898-1 ; consulter les courbes du fabricant)', x0, y1 + 10);
    });
    return cv.stop;
  };
  function fmtT(t) { return t >= 3600 ? AA.fmt(t / 3600, 1) + ' h' : t >= 60 ? AA.fmt(t / 60, 1) + ' min' : AA.fmt(t, t < 1 ? 2 : 1) + ' s'; }

  /* ---------- Dispositif différentiel : tore, courants aller et retour ---------- */
  SIMS.rcd = el => {
    const st = { I: 8, f: 0, s: 30 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('I', 'Courant consommé', 0, 20, 0.5, 8, 'A')}${sl('f', 'Courant de fuite à la terre', 0, 60, 1, 0, 'mA')}<div class="seg js-s">${[30, 300].map(v => `<button data-v="${v}" class="${v === 30 ? 'on' : ''}">${v} mA</button>`).join('')}</div></div>
      <div class="simout"><div><span>Phase (aller)</span><b class="o-a"></b></div><div><span>Neutre (retour)</span><b class="o-r"></b></div><div><span>Différence vue par le tore</span><b class="o-d"></b></div></div></div>`;
    bind(el, st, {});
    el.querySelectorAll('.js-s button').forEach(b => b.onclick = () => { st.s = +b.dataset.v; el.querySelectorAll('.js-s button').forEach(x => x.classList.toggle('on', x === b)); });
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const ret = Math.max(0, st.I - st.f / 1000), d = st.f, trip = d >= st.s;
      el.querySelector('.o-a').textContent = AA.fmt(st.I, 3) + ' A'; el.querySelector('.o-r').textContent = AA.fmt(ret, 3) + ' A';
      el.querySelector('.o-d').innerHTML = `${d} mA ${trip ? '<span style="color:var(--bad)">→ DÉCLENCHEMENT</span>' : d >= st.s / 2 ? '<span style="color:var(--warn)">(zone de déclenchement possible : entre ' + st.s / 2 + ' et ' + st.s + ' mA)</span>' : ''}`;
      const cx = W / 2, cy = H / 2 - 6;
      g.lineWidth = 16; g.strokeStyle = css('--surface-3'); g.beginPath(); g.arc(cx, cy, 58, 0, 7); g.stroke();
      const imb = Math.min(1, d / st.s);
      g.strokeStyle = `rgba(255,${Math.round(180 - 140 * imb)},40,${0.15 + 0.85 * imb})`; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, 58, 0, 7); g.stroke();
      const wire = (y, col, dir, amp) => { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(20, y); g.lineTo(W - 20, y); g.stroke(); if (amp > 0) { g.strokeStyle = css('--flow'); g.lineWidth = 2; g.setLineDash([3, 10]); g.lineDashOffset = dir * t * 30; g.beginPath(); g.moveTo(20, y); g.lineTo(W - 20, y); g.stroke(); g.setLineDash([]); } };
      wire(cy - 14, css('--pot-L1'), -1, st.I); wire(cy + 14, css('--pot-N'), 1, ret);
      g.fillStyle = css('--ink'); g.font = '600 12px Bahnschrift'; g.fillText('Phase →', 24, cy - 22); g.fillText('← Neutre', W - 90, cy + 32);
      g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI'; g.textAlign = 'center';
      g.fillText(d ? 'Le flux magnétique ne s\'annule plus : la bobine de détection fait déclencher le relais' : 'Aller = retour : les champs magnétiques s\'annulent dans le tore', cx, H - 10); g.textAlign = 'left';
      g.fillText('Norme : un 30 mA ne doit pas déclencher sous 15 mA et doit déclencher à 30 mA.', 20, 16);
    });
    return cv.stop;
  };

  /* ---------- Parafoudre : onde de choc, écrêtage, longueur de liaison ---------- */
  SIMS.surge = el => {
    const st = { L: 0.5, Up: 1.5, on: 1 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('L', 'Longueur totale des liaisons du parafoudre', 0.1, 3, 0.1, 0.5, 'm')}${sl('Up', 'Niveau de protection U<sub>p</sub>', 1, 2.5, 0.1, 1.5, 'kV')}<label class="chk"><input type="checkbox" class="js-on" checked> parafoudre installé</label></div>
      <div class="simout"><div><span>Tension vue par l'appareil (pic)</span><b class="o-u"></b></div><div><span>Tenue d'un appareil (catégorie II)</span><b>2,5 kV</b></div></div></div>`;
    bind(el, st, { L: v => AA.fmt(v, 1), Up: v => AA.fmt(v, 1) });
    el.querySelector('.js-on').onchange = e => { st.on = e.target.checked ? 1 : 0; };
    const cv = AA.canvas(el.querySelector('.simview'), 220, (g, W, H) => {
      const peak = st.on ? st.Up + 1.0 * st.L : 6; // ≈ 1 kV par mètre de liaison (L·di/dt)
      el.querySelector('.o-u').innerHTML = `${AA.fmt(peak, 1)} kV ${peak > 2.5 ? '<span style="color:var(--bad)">→ appareil détruit</span>' : '<span style="color:var(--ok)">→ protégé</span>'}`;
      const x0 = 40, x1 = W - 20, y0 = H - 30, sc = (y0 - 20) / 7;
      g.strokeStyle = css('--line'); g.lineWidth = 1; g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI';
      for (let k = 0; k <= 7; k++) { g.beginPath(); g.moveTo(x0, y0 - k * sc); g.lineTo(x1, y0 - k * sc); g.stroke(); g.fillText(k + ' kV', 4, y0 - k * sc + 4); }
      g.strokeStyle = css('--bad'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(x0, y0 - 2.5 * sc); g.lineTo(x1, y0 - 2.5 * sc); g.stroke(); g.setLineDash([]);
      const wave = (amp, col) => { g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); for (let x = x0; x <= x1; x += 2) { const tt = (x - x0) / (x1 - x0) * 100; const v = tt < 8 ? amp * tt / 8 : amp * Math.exp(-(tt - 8) / 14); x === x0 ? g.moveTo(x, y0 - v * sc) : g.lineTo(x, y0 - v * sc); } g.stroke(); };
      wave(6, css('--ink-3')); wave(Math.min(6, peak), css('--copper'));
      g.fillStyle = css('--ink-2'); g.fillText('onde de foudre sans protection', x1 - 190, 30); g.fillStyle = css('--copper'); g.fillText('tension au niveau de l\'appareil', x1 - 190, 46);
      g.fillStyle = css('--ink-3'); g.fillText('Ordre de grandeur : chaque mètre de liaison ajoute environ 1 kV (inductance ≈ 1 µH/m, front ≈ 1 kA/µs).', x0, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Échauffement d'un câble et d'une connexion ---------- */
  SIMS.joule = el => {
    const st = { I: 16, S: 2.5, Rc: 0 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('I', 'Courant', 0, 45, 0.5, 16, 'A')}<div class="seg js-s">${[1.5, 2.5, 4, 6].map(s => `<button data-s="${s}" class="${s === 2.5 ? 'on' : ''}">${AA.fmt(s)} mm²</button>`).join('')}</div>${sl('Rc', 'Résistance de la connexion (serrage)', 0, 200, 1, 0, 'mΩ')}</div>
      <div class="simout"><div><span>Température du conducteur (régime établi, 30 °C ambiant)</span><b class="o-t"></b></div><div><span>Puissance perdue dans la connexion</span><b class="o-p"></b></div></div></div>`;
    bind(el, st, {});
    el.querySelectorAll('.js-s button').forEach(b => b.onclick = () => { st.S = +b.dataset.s; el.querySelectorAll('.js-s button').forEach(x => x.classList.toggle('on', x === b)); });
    const Iz = { 1.5: 19.5, 2.5: 27, 4: 36, 6: 46 };
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const T = 30 + 40 * Math.pow(st.I / Iz[st.S], 2), Pc = st.Rc / 1000 * st.I * st.I;
      el.querySelector('.o-t').innerHTML = `${AA.fmt(T, 0)} °C ${T > 70 ? '<span style="color:var(--bad)">> 70 °C : l\'isolant PVC vieillit vite</span>' : ''}`;
      el.querySelector('.o-p').innerHTML = `${AA.fmt(Pc, 1)} W ${Pc > 3 ? '<span style="color:var(--bad)">point chaud, risque d\'incendie</span>' : ''}`;
      const heat = Math.min(1, (T - 30) / 90), y = H / 2;
      g.lineCap = 'round';
      g.strokeStyle = `rgb(${120 + 135 * heat},${110 - 60 * heat},${70 - 50 * heat})`; g.lineWidth = 6 + st.S * 3;
      g.beginPath(); g.moveTo(30, y); g.lineTo(W / 2 - 30, y); g.moveTo(W / 2 + 30, y); g.lineTo(W - 30, y); g.stroke();
      const hc = Math.min(1, Pc / 10);
      g.fillStyle = `rgb(${150 + 105 * hc},${150 - 100 * hc},${150 - 120 * hc})`; g.fillRect(W / 2 - 30, y - 22, 60, 44);
      if (hc > 0.3) { g.fillStyle = `rgba(255,120,30,${hc * 0.5})`; g.beginPath(); g.arc(W / 2, y, 50 + 6 * Math.sin(t * 6), 0, 7); g.fill(); }
      g.fillStyle = css('--ink'); g.font = '600 12px Bahnschrift'; g.fillText('borne', W / 2 - 16, y + 40);
      g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI'; g.fillText(`I_z (PVC, méthode C, 2 conducteurs chargés) = ${AA.fmt(Iz[st.S])} A — modèle simplifié : la température suit I²`, 20, H - 10);
    });
    return cv.stop;
  };

  /* ---------- Coupes de câbles et couleurs ---------- */
  SIMS.cable = el => {
    const C = [
      ['U-1000 R2V 3G2,5', ['#7b4a2a', '#4a8fd6', 'pe'], 'Rigide, isolant PR, gaine PVC noire, 0,6/1 kV. Installation fixe, enterré sous fourreau.'],
      ['U-1000 R2V 5G6', ['#7b4a2a', '#1a1a1a', '#8c8c8c', '#4a8fd6', 'pe'], 'Triphasé + neutre + PE : marron, noir, gris (phases), bleu (neutre), vert-jaune (PE).'],
      ['H07V-K 1,5 (×3)', ['#c62828', '#c62828', '#c62828'], 'Conducteurs isolés souples, sans gaine : câblage d\'armoire (ici en rouge : commande alternative).'],
      ['H07RN-F 3G1,5', ['#7b4a2a', '#4a8fd6', 'pe'], 'Souple, caoutchouc, gaine néoprène : appareils mobiles, chantiers.']
    ];
    let i = 0;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-c">${C.map((c, k) => `<button data-k="${k}" class="${k ? '' : 'on'}">${c[0]}</button>`).join('')}</div></div><div class="simview"></div><p class="vc-desc" style="padding:0 16px 14px"></p></div>`;
    const cv = AA.canvas(el.querySelector('.simview'), 210, (g, W, H) => {
      const c = C[i], cx = W / 2, cy = H / 2, n = c[1].length, R = 70;
      el.querySelector('.vc-desc').textContent = c[2];
      const sheath = !c[0].startsWith('H07V');
      if (sheath) { g.fillStyle = c[0].startsWith('H07RN') ? '#2b2b2b' : '#111'; g.beginPath(); g.arc(cx, cy, R + 14, 0, 7); g.fill(); g.fillStyle = '#d9d4c7'; g.beginPath(); g.arc(cx, cy, R + 4, 0, 7); g.fill(); }
      c[1].forEach((col, k) => {
        const a = k / n * Math.PI * 2 - Math.PI / 2, rr = n === 1 ? 0 : R * 0.52, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr, r = n > 3 ? 22 : 28;
        if (col === 'pe') { const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); for (let s = 0; s < 8; s++) { gr.addColorStop(s / 8, s % 2 ? '#2e7d32' : '#fbc02d'); gr.addColorStop((s + 0.99) / 8, s % 2 ? '#2e7d32' : '#fbc02d'); } g.fillStyle = gr; } else g.fillStyle = col;
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.fillStyle = '#c47b3a'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill();
        if (c[0].includes('K') || c[0].includes('-F')) { g.fillStyle = '#e5a46a'; for (let s = 0; s < 7; s++) { const b = s / 7 * 7; g.beginPath(); g.arc(x + Math.cos(b) * r * 0.3, y + Math.sin(b) * r * 0.3, r * 0.14, 0, 7); g.fill(); } }
      });
      g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI'; g.fillText('Âme cuivre ' + (c[0].includes('K') || c[0].includes('-F') ? 'souple (multibrins)' : 'rigide'), 12, H - 10);
    });
    el.querySelectorAll('.js-c button').forEach(b => b.onclick = () => { i = +b.dataset.k; el.querySelectorAll('.js-c button').forEach(x => x.classList.toggle('on', x === b)); });
    return cv.stop;
  };

  /* ---------- Tableau de logement : quel appareil coupe quoi ---------- */
  SIMS.tableau = el => {
    const T = [
      { id: 'ID1', t: 'Interrupteur différentiel 30 mA type AC — 40 A', c: [['Éclairage séjour', 10], ['Prises séjour', 20], ['Volets roulants', 16]] },
      { id: 'ID2', t: 'Interrupteur différentiel 30 mA type A — 40 A', c: [['Plaque de cuisson', 32], ['Lave-linge', 20], ['Prises cuisine', 20]] },
      { id: 'ID3', t: 'Interrupteur différentiel 30 mA type AC — 40 A', c: [['Éclairage chambres', 10], ['Prises chambres', 16], ['Chauffe-eau', 20]] }
    ];
    let off = new Set();
    el.innerHTML = `<div class="simcard vis-tab"><div class="vt-agcp"><b>AGCP</b><span>Disjoncteur de branchement différentiel 500 mA type S</span></div><div class="vt-rows"></div>
      <div class="simctl"><span class="muted">Choisis un circuit puis un défaut :</span><select class="sel js-c"></select><button class="btn sm" data-f="sur">Surcharge</button><button class="btn sm" data-f="cc">Court-circuit</button><button class="btn sm" data-f="iso">Défaut d'isolement</button><button class="btn sm ghost js-r">Tout réarmer</button></div><p class="vt-fb" style="padding:0 16px 14px"></p></div>`;
    const sel = el.querySelector('.js-c');
    sel.innerHTML = T.flatMap(g => g.c.map(c => `<option value="${g.id}|${c[0]}">${c[0]}</option>`)).join('');
    const draw = () => {
      el.querySelector('.vt-rows').innerHTML = T.map(g => `<div class="vt-id ${off.has(g.id) ? 'off' : ''}"><div class="vt-head"><i class="led ${off.has(g.id) ? 'bad' : 'on'}"></i><b>${g.id}</b><span>${g.t}</span></div><div class="vt-circ">${g.c.map(c => { const k = g.id + '|' + c[0], o = off.has(k) || off.has(g.id); return `<div class="vt-c ${o ? 'off' : ''}"><i class="lampx"></i><b>${c[1]} A</b><span>${c[0]}</span></div>`; }).join('')}</div></div>`).join('');
    };
    draw();
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
      const [g, c] = sel.value.split('|'), f = b.dataset.f;
      const fb = el.querySelector('.vt-fb');
      if (f === 'iso') { off.add(g); fb.innerHTML = `Défaut d'isolement sur « ${esc(c)} » : c'est <b>${g}</b> (30 mA) qui déclenche, pas l'AGCP (500 mA retardé type S : sélectivité). Les ${T.find(x => x.id === g).c.length} circuits de ce groupe sont privés de courant : d'où l'intérêt de répartir éclairage et prises sur plusieurs différentiels.`; }
      else { off.add(g + '|' + c); fb.innerHTML = f === 'sur' ? `Surcharge : seul le disjoncteur divisionnaire de « ${esc(c)} » déclenche (déclencheur thermique, après un certain temps). Un différentiel ne réagit pas à une surcharge.` : `Court-circuit : le déclencheur magnétique du disjoncteur de « ${esc(c)} » coupe en quelques millisecondes. Le différentiel ne voit rien : le courant aller égale le courant retour.`; }
      draw(); AA.click(260, 0.12);
    });
    el.querySelector('.js-r').onclick = () => { off = new Set(); el.querySelector('.vt-fb').textContent = ''; draw(); };
  };

  /* ---------- Les quatre représentations d'un même circuit ---------- */
  SIMS.views = el => {
    const V = {
      syno: ['Synoptique', '<rect x="20" y="40" width="90" height="50" rx="6"/><text x="65" y="70">Tableau</text><path d="M110 65 H190"/><path d="M182 59 l8 6 -8 6"/><rect x="190" y="40" width="90" height="50" rx="6"/><text x="235" y="70">Éclairage</text><path d="M280 65 H360"/><path d="M352 59 l8 6 -8 6"/><rect x="360" y="40" width="90" height="50" rx="6"/><text x="405" y="70">Séjour</text>', 'Des blocs et des flux : l\'organisation, sans fils ni bornes.'],
      uni: ['Unifilaire', '<path d="M30 65 H120"/><path d="M60 58 l8 14 M66 58 l8 14 M72 58 l8 14"/><text x="60" y="50" class="sm">3G1,5</text><rect x="120" y="45" width="40" height="40"/><path d="M128 77 l24 -24"/><text x="140" y="104" class="sm">16 A</text><path d="M160 65 H300"/><circle cx="320" cy="65" r="18"/><path d="M307 52 l26 26 M333 52 l-26 26"/>', 'Un seul trait pour tout le circuit ; les barres obliques indiquent le nombre de conducteurs.'],
      multi: ['Multifilaire', '<path d="M30 45 H300 V60"/><path d="M30 65 H200"/><path d="M200 65 l20 -10"/><path d="M226 65 H330 V75"/><path d="M30 85 H340 V90"/><circle cx="320" cy="98" r="0"/><circle cx="335" cy="90" r="14"/><path d="M325 80 l20 20 M345 80 l-20 20"/><text x="10" y="49" class="sm">N</text><text x="10" y="69" class="sm">L</text><text x="6" y="89" class="sm">PE</text>', 'Chaque conducteur est dessiné : on voit la phase passer par l\'interrupteur.'],
      dev: ['Développé', '<path d="M60 20 H400"/><path d="M60 120 H400"/><text x="30" y="24" class="sm">L</text><text x="30" y="124" class="sm">N</text><path d="M230 20 V48"/><path d="M230 72 V82"/><path d="M230 72 l-10 -22"/><path d="M230 82 V96"/><circle cx="230" cy="106" r="0"/><circle cx="230" cy="100" r="10"/><path d="M223 93 l14 14 M237 93 l-14 14"/><path d="M230 110 V120"/><text x="244" y="66" class="sm">S1</text><text x="246" y="104" class="sm">E1</text>', 'La logique de fonctionnement entre deux traits (phase en haut, neutre en bas).']
    };
    let k = 'syno';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-v">${Object.entries(V).map(([id, v]) => `<button data-v="${id}" class="${id === k ? 'on' : ''}">${v[0]}</button>`).join('')}</div></div><div class="vis-views"><svg viewBox="0 0 470 140"></svg></div><p class="muted js-d" style="padding:0 16px 14px"></p></div>`;
    const draw = () => { el.querySelector('svg').innerHTML = V[k][1]; el.querySelector('.js-d').textContent = 'Le même circuit (un point lumineux commandé par un interrupteur). ' + V[k][2]; };
    draw();
    el.querySelectorAll('.js-v button').forEach(b => b.onclick = () => { k = b.dataset.v; el.querySelectorAll('.js-v button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  };

  /* ---------- Décodeur de titre d'habilitation ---------- */
  SIMS.habil = el => {
    const D = { B: 'basse et très basse tension', H: 'haute tension (HTA, HTB)' };
    const R = { 0: 'non électricien : travaux non électriques', 1: 'exécutant électricien', 2: 'chargé de travaux', '': '' };
    const A = { V: 'travaux au voisinage', T: 'travaux sous tension', R: 'intervention générale BT (dépannage, mesures, raccordements)', S: 'intervention élémentaire BT (remplacer un fusible, réarmer, raccorder sur circuit protégé)', C: 'consignation', E: 'opérations spécifiques : essai, mesurage, vérification, manœuvre', P: 'opérations sur installations photovoltaïques', '': '' };
    const OK = ['B0', 'H0', 'H0V', 'B1', 'B1V', 'B2', 'B2V', 'B2V Essai', 'BR', 'BS', 'BC', 'BE Manœuvre', 'BE Mesurage', 'BE Essai', 'BE Vérification', 'BP', 'H1', 'H1V', 'H2', 'H2V', 'HC', 'HE Manœuvre', 'HE Mesurage', 'B1T', 'B2T', 'H1T', 'H2T'];
    const st = { d: 'B', r: '', a: 'R' };
    el.innerHTML = `<div class="simcard vis-habil"><div class="vh-sym js-s"></div><div class="simctl">
      <div class="field"><label>Domaine</label><div class="seg js-d">${Object.keys(D).map(k => `<button data-v="${k}" class="${k === 'B' ? 'on' : ''}">${k}</button>`).join('')}</div></div>
      <div class="field"><label>Rôle</label><div class="seg js-r">${['', '0', '1', '2'].map(k => `<button data-v="${k}" class="${k === '' ? 'on' : ''}">${k || '—'}</button>`).join('')}</div></div>
      <div class="field"><label>Nature</label><div class="seg js-a">${['', 'V', 'T', 'R', 'S', 'C', 'E', 'P'].map(k => `<button data-v="${k}" class="${k === 'R' ? 'on' : ''}">${k || '—'}</button>`).join('')}</div></div></div>
      <p class="js-m" style="padding:0 16px 16px"></p></div>`;
    const draw = () => {
      let sym = st.d + st.r + st.a; if (st.a === 'E') sym += ' (Manœuvre, Mesurage, Essai ou Vérification)';
      const base = st.d + st.r + st.a;
      const valid = OK.some(o => o === base || o.startsWith(base + ' '));
      el.querySelector('.js-s').innerHTML = `<b>${esc(base || '?')}</b><span class="${valid ? 'ok-t' : 'bad-t'}">${valid ? 'symbole existant' : 'combinaison inexistante'}</span>`;
      el.querySelector('.js-m').innerHTML = `<b>${D[st.d]}</b>${st.r ? ' · ' + R[st.r] : ''}${st.a ? ' · ' + A[st.a] : ''}.${!valid ? ' Par exemple, R et S n\'existent qu\'en basse tension et sans chiffre (BR, BS) ; avec le chiffre 0, seuls B0, H0 et H0V existent.' : ''}`;
    };
    ['d', 'r', 'a'].forEach(k => el.querySelectorAll('.js-' + k + ' button').forEach(b => b.onclick = () => { st[k] = b.dataset.v; el.querySelectorAll('.js-' + k + ' button').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
    draw();
  };
})();
