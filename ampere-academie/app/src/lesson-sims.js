/* Ampère Académie — petits simulateurs intégrés aux leçons. AA.SIMS[nom](el) -> fonction de nettoyage. */
(function () {
  'use strict';
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
  /* Canevas net sur écrans haute densité, redimensionné avec son conteneur */
  AA.canvas = function (el, h, draw) {
    const c = document.createElement('canvas');
    c.style.width = '100%'; c.style.height = h + 'px'; c.style.display = 'block';
    el.appendChild(c);
    const ctx = c.getContext('2d');
    let W = 0, H = h, raf = 0, t0 = performance.now(), alive = true;
    const size = () => { const r = c.getBoundingClientRect(); const d = window.devicePixelRatio || 1; W = r.width; c.width = Math.max(1, W * d); c.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size();
    const ro = new ResizeObserver(size); ro.observe(c);
    const loop = t => {
      if (!alive) return;
      if (!c.isConnected) { stop(); return; }
      ctx.clearRect(0, 0, W, H);
      draw(ctx, W, H, (t - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    function stop() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); }
    return { c, ctx, stop };
  };
  AA.css = css;
  const slider = (label, min, max, step, val, unit) => `<label class="sl"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bindSlider = (root, i, fmt, cb) => {
    const lab = root.querySelectorAll('.sl')[i], inp = lab.querySelector('input'), out = lab.querySelector('b');
    const upd = () => { out.textContent = fmt(+inp.value); cb(+inp.value); };
    inp.addEventListener('input', upd); upd();
    return inp;
  };

  const SIMS = AA.SIMS = {};

  /* Électrons dans un conducteur : débit réglable */
  SIMS.electrons = el => {
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${slider('Courant', 0, 5, 0.1, 1.5, 'A')}</div></div>`;
    let I = 1.5;
    const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), j: Math.random() }));
    bindSlider(el, 0, v => AA.fmt(v, 1), v => { I = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 170, (g, W, H, t) => {
      const y0 = 50, y1 = 120;
      const grd = g.createLinearGradient(0, y0, 0, y1);
      grd.addColorStop(0, '#b8673a'); grd.addColorStop(.5, '#e7a06b'); grd.addColorStop(1, '#8a4521');
      g.fillStyle = grd; g.beginPath(); g.roundRect(20, y0, W - 40, y1 - y0, 18); g.fill();
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(30, y0 + 6, W - 60, 6);
      parts.forEach(p => {
        p.x += (I * 0.0016 + 0.0002 * Math.sin(t * 9 + p.j * 30)) * (1 + p.j * 0.3);
        if (p.x > 1) p.x -= 1;
        const x = 30 + p.x * (W - 60), y = y0 + 10 + p.y * (y1 - y0 - 20) + Math.sin(t * 13 + p.j * 50) * 2;
        g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill();
        g.fillStyle = 'rgba(159,216,255,.25)'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
      });
      // compteur de section
      const xs = W / 2;
      g.strokeStyle = css('--amber'); g.setLineDash([5, 4]); g.lineWidth = 2;
      g.beginPath(); g.moveTo(xs, y0 - 14); g.lineTo(xs, y1 + 14); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--ink'); g.font = '600 13px Bahnschrift, sans-serif'; g.textAlign = 'center';
      g.fillText(`${AA.fmt(I * 6.24, 2)} × 10¹⁸ électrons/s traversent cette section`, xs, y1 + 36);
      g.fillStyle = css('--ink-3'); g.textAlign = 'left'; g.fillText('électrons libres (sens réel →)', 24, y0 - 18);
      g.textAlign = 'right'; g.fillStyle = css('--copper-2'); g.fillText('← sens conventionnel du courant', W - 24, y0 - 18);
    });
    return cv.stop;
  };

  /* Loi d'Ohm : générateur, résistance, lampe dont l'éclat suit la puissance */
  SIMS.ohm = el => {
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${slider('Tension U', 0, 48, 1, 24, 'V')}${slider('Résistance R', 2, 100, 1, 12, 'Ω')}</div>
      <div class="simout"><div><span>Courant I = U / R</span><b class="o-i"></b></div><div><span>Puissance P = U × I</span><b class="o-p"></b></div></div></div>`;
    let U = 24, R = 12, ph = 0;
    bindSlider(el, 0, v => v, v => { U = v; });
    bindSlider(el, 1, v => v, v => { R = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 210, (g, W, H, t) => {
      const I = U / R, P = U * I;
      el.querySelector('.o-i').textContent = AA.fmt(I, 2) + ' A';
      el.querySelector('.o-p').textContent = AA.fmt(P, 1) + ' W';
      const x0 = Math.max(40, W / 2 - 220), x1 = Math.min(W - 40, W / 2 + 220), y0 = 40, y1 = 170;
      ph += I * 0.012;
      g.lineWidth = 4; g.strokeStyle = css('--wire'); g.lineJoin = 'round';
      g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.stroke();
      // flux
      g.strokeStyle = '#ffe2a8'; g.lineWidth = 3; g.setLineDash([3, 13]); g.lineDashOffset = -ph * 60;
      g.shadowColor = css('--amber'); g.shadowBlur = 8; g.globalAlpha = Math.min(1, I / 2 + 0.15);
      g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x0, y1); g.stroke();
      g.setLineDash([]); g.shadowBlur = 0; g.globalAlpha = 1;
      // générateur
      g.fillStyle = css('--surface-2'); g.strokeStyle = css('--ink'); g.lineWidth = 2;
      g.beginPath(); g.arc(x0, (y0 + y1) / 2, 24, 0, 7); g.fill(); g.stroke();
      g.fillStyle = css('--ink'); g.font = '700 14px Bahnschrift'; g.textAlign = 'center'; g.fillText(U + ' V', x0, (y0 + y1) / 2 + 5);
      // résistance
      const rx = (x0 + x1) / 2;
      g.fillStyle = css('--surface-2'); g.fillRect(rx - 40, y0 - 13, 80, 26); g.strokeRect(rx - 40, y0 - 13, 80, 26);
      g.fillStyle = css('--ink'); g.fillText(R + ' Ω', rx, y0 + 5);
      // lampe
      const lx = x1, ly = (y0 + y1) / 2, glow = Math.min(1, P / 120);
      const rg = g.createRadialGradient(lx, ly, 2, lx, ly, 70);
      rg.addColorStop(0, `rgba(255,214,120,${glow})`); rg.addColorStop(1, 'rgba(255,180,60,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(lx, ly, 70, 0, 7); g.fill();
      g.fillStyle = `rgba(255,${200 + 55 * glow},${120 + 100 * glow},${0.25 + glow * 0.75})`; g.beginPath(); g.arc(lx, ly, 18, 0, 7); g.fill();
      g.strokeStyle = css('--ink'); g.beginPath(); g.arc(lx, ly, 18, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(lx - 12, ly - 12); g.lineTo(lx + 12, ly + 12); g.moveTo(lx + 12, ly - 12); g.lineTo(lx - 12, ly + 12); g.stroke();
      // ampèremètre
      g.fillStyle = css('--bg-2'); g.beginPath(); g.arc(rx, y1, 20, 0, 7); g.fill(); g.strokeStyle = css('--teal'); g.stroke();
      g.fillStyle = css('--teal'); g.font = '700 12px Bahnschrift'; g.fillText('A', rx, y1 + 4);
      g.fillStyle = css('--ink-2'); g.font = '600 12px Bahnschrift'; g.fillText(AA.fmt(I, 2) + ' A', rx, y1 + 38);
    });
    return cv.stop;
  };

  /* Oscilloscope : continu, alternatif, valeur efficace et crête */
  SIMS.scope = el => {
    el.innerHTML = `<div class="simcard"><div class="simview scope-screen"></div><div class="simctl">
      <div class="seg"><button class="on" data-w="ac">Alternatif</button><button data-w="dc">Continu</button></div>
      ${slider('Fréquence', 10, 100, 1, 50, 'Hz')}${slider('U efficace', 12, 400, 1, 230, 'V')}</div></div>`;
    let f = 50, U = 230, wave = 'ac';
    bindSlider(el, 0, v => v, v => { f = v; });
    bindSlider(el, 1, v => v, v => { U = v; });
    el.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => { wave = b.dataset.w; el.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); }));
    const cv = AA.canvas(el.querySelector('.simview'), 240, (g, W, H, t) => {
      g.fillStyle = '#071410'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(80,255,170,.10)'; g.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * W / 10, 0); g.lineTo(i * W / 10, H); g.stroke(); }
      for (let j = 0; j <= 8; j++) { g.beginPath(); g.moveTo(0, j * H / 8); g.lineTo(W, j * H / 8); g.stroke(); }
      const mid = H / 2, peak = U * Math.SQRT2, scale = (H / 2 - 16) / (Math.max(peak, 30) * 1.05);
      const span = 0.04; // 40 ms à l'écran
      g.strokeStyle = '#5dffb0'; g.lineWidth = 2.4; g.shadowColor = '#5dffb0'; g.shadowBlur = 10;
      g.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const tt = x / W * span + t * 0.002;
        const v = wave === 'ac' ? peak * Math.sin(2 * Math.PI * f * tt) : U;
        const y = mid - v * scale;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke(); g.shadowBlur = 0;
      g.setLineDash([6, 5]); g.lineWidth = 1.4;
      g.strokeStyle = '#ffb43a'; g.beginPath(); g.moveTo(0, mid - U * scale); g.lineTo(W, mid - U * scale); g.stroke();
      if (wave === 'ac') { g.strokeStyle = '#ff6b8b'; g.beginPath(); g.moveTo(0, mid - peak * scale); g.lineTo(W, mid - peak * scale); g.stroke(); }
      g.setLineDash([]);
      g.font = '600 12px Cascadia Mono, Consolas, monospace'; g.textAlign = 'left';
      g.fillStyle = '#ffb43a'; g.fillText(`U eff = ${U} V`, 10, mid - U * scale - 6);
      if (wave === 'ac') {
        g.fillStyle = '#ff6b8b'; g.fillText(`Û = ${AA.fmt(peak, 0)} V`, 10, mid - peak * scale + 14);
        g.fillStyle = '#9fffd0'; g.textAlign = 'right'; g.fillText(`T = ${AA.fmt(1000 / f, 1)} ms   ·   4 ms/div   ·   écran = 40 ms`, W - 10, H - 10);
      }
    });
    return cv.stop;
  };

  /* Effets du courant sur le corps humain (courant alternatif 50 Hz, trajet main-pieds, ordres de grandeur) */
  SIMS.body = el => {
    const Z = [
      [0.5, 'Seuil de perception', 'Picotement à peine perceptible.', '--ok'],
      [10, 'Seuil de non-lâcher', 'Contraction des muscles : impossible de lâcher le conducteur.', '--warn'],
      [30, 'Paralysie respiratoire', 'Les muscles respiratoires se bloquent : asphyxie si le contact dure.', '--live'],
      [75, 'Fibrillation ventriculaire', 'Le cœur bat de manière désordonnée : arrêt circulatoire, souvent irréversible.', '--bad'],
      [1000, 'Arrêt cardiaque, brûlures graves', 'Brûlures internes profondes, arrêt du cœur.', '--bad']
    ];
    el.innerHTML = `<div class="simcard body-sim"><div class="simview"></div><div class="simctl">${slider('Courant dans le corps', 0, 1000, 1, 12, 'mA')}</div><div class="body-zone card"></div></div>`;
    let I = 12;
    const inp = el.querySelector('input');
    // échelle logarithmique pour bien voir les petits courants
    const toI = v => v <= 0 ? 0 : Math.round(Math.pow(10, v / 1000 * 3) * 10) / 10;
    inp.min = 0; inp.max = 1000; inp.value = 1000 * Math.log10(12) / 3;
    const out = el.querySelector('.sl b');
    const zoneBox = el.querySelector('.body-zone');
    const upd = () => {
      I = toI(+inp.value); out.textContent = AA.fmt(I, I < 10 ? 1 : 0);
      let z = null; Z.forEach(q => { if (I >= q[0]) z = q; });
      zoneBox.innerHTML = z ? `<b style="color:var(${z[3]})">${z[1]}</b><p>${z[2]}</p>` : `<b style="color:var(--ink-3)">Imperceptible</b><p>Le courant est trop faible pour être ressenti.</p>`;
    };
    inp.addEventListener('input', upd); upd();
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W, H, t) => {
      const x0 = 30, x1 = W - 30, y = 56;
      const pos = i => x0 + (Math.log10(Math.max(0.1, i)) + 1) / 4 * (x1 - x0); // 0,1 mA → 1 000 mA
      const grd = g.createLinearGradient(x0, 0, x1, 0);
      grd.addColorStop(0, css('--ok')); grd.addColorStop(0.45, css('--warn')); grd.addColorStop(0.62, css('--live')); grd.addColorStop(0.72, css('--bad')); grd.addColorStop(1, '#7a0010');
      g.fillStyle = grd; g.beginPath(); g.roundRect(x0, y - 8, x1 - x0, 16, 8); g.fill();
      g.font = '600 11px Bahnschrift'; g.textAlign = 'center';
      Z.forEach(([v, n]) => { const x = pos(v); g.fillStyle = css('--ink'); g.fillRect(x - 1, y - 14, 2, 28); g.fillStyle = css('--ink-2'); g.fillText(v + ' mA', x, y + 30); });
      const xi = pos(I);
      g.fillStyle = css('--ink'); g.beginPath(); g.moveTo(xi, y - 12); g.lineTo(xi - 8, y - 26); g.lineTo(xi + 8, y - 26); g.fill();
      g.fillStyle = css('--copper-2'); g.font = '700 13px Bahnschrift'; g.fillText(AA.fmt(I, I < 10 ? 1 : 0) + ' mA', xi, y - 32);
      g.fillStyle = css('--ink-3'); g.font = '500 11px Segoe UI'; g.fillText('Ordres de grandeur, courant alternatif 50 Hz, contact de plusieurs secondes', W / 2, H - 6);
    });
    return cv.stop;
  };

  /* Plaque signalétique interactive d'un moteur asynchrone (valeurs cohérentes entre elles) */
  SIMS.nameplate = el => {
    const F = [
      ['type', 'Mot. 3~  112M-4', 'Moteur triphasé, hauteur d\'axe 112 mm, carcasse M, 4 pôles (vitesse de synchronisme 1 500 tr/min à 50 Hz).'],
      ['u', '230 V Δ / 400 V Y', 'Tensions d\'alimentation selon le couplage. Chaque enroulement supporte 230 V : sur un réseau 3 × 400 V, on couple en étoile (Y).'],
      ['i', '14,2 A / 8,2 A', 'Courants nominaux en ligne : 14,2 A sous 230 V (Δ), 8,2 A sous 400 V (Y). C\'est la valeur de réglage du relais thermique.'],
      ['p', '4 kW', 'Puissance mécanique UTILE disponible sur l\'arbre (pas la puissance absorbée). Absorbée : P / η ≈ 4,65 kW.'],
      ['n', '1 440 tr/min', 'Vitesse nominale en charge. Glissement g = (1 500 − 1 440) / 1 500 = 4 %.'],
      ['cos', 'cos φ 0,82', 'Facteur de puissance : part de la puissance apparente réellement transformée en puissance active.'],
      ['eta', 'η 86 %', 'Rendement : les 14 % restants sont perdus en chaleur (cuivre, fer, frottements).'],
      ['f', '50 Hz', 'Fréquence du réseau. Sur 60 Hz, la vitesse augmente d\'environ 20 %.'],
      ['ip', 'IP55', 'Protection : 5 = poussières (protégé), 5 = jets d\'eau. Adapté à un atelier.'],
      ['cl', 'Isol. cl. F', 'Classe d\'isolation F : enroulements supportant 155 °C.'],
      ['s', 'S1', 'Service continu : peut fonctionner en permanence à puissance nominale.']
    ];
    el.innerHTML = `<div class="nameplate"><div class="np-plate plate"><i class="rv"></i>
      <div class="np-head"><b>AMPÈRE MOTEURS</b><span>IEC 60034-1</span></div>
      <div class="np-grid">${F.map(f => `<button data-k="${f[0]}">${f[1]}</button>`).join('')}</div>
      <div class="np-foot">N° 24-118 734 · 38 kg · Roulements 6206-2Z / 6206-2Z</div></div>
      <div class="np-info card"><p class="muted">Clique sur une inscription de la plaque.</p></div></div>`;
    const info = el.querySelector('.np-info'), seen = new Set();
    el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      const f = F.find(x => x[0] === b.dataset.k);
      el.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b));
      seen.add(f[0]); b.classList.add('seen');
      info.innerHTML = `<p class="eyebrow">${AA.esc(f[1])}</p><p>${f[2]}</p><p class="muted">${seen.size} / ${F.length} inscriptions découvertes</p>`;
    }));
    return () => { };
  };
})();
