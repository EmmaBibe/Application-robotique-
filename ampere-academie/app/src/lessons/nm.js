/* Niveau « Les instruments de mesure » : métrologie, multimètres, analogiques, pinces et wattmètres,
 * contrôles d'installation, instruments avancés. Simulations propres à ce niveau incluses ici. */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n);
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });

  /* ---------- Valeur moyenne, efficace, lecture d'un appareil « moyenne » et d'un TRMS ---------- */
  AA.VIS.rms = (shape) => {
    const N = 2000; let s1 = 0, s2 = 0, pk = 0;
    for (let i = 0; i < N; i++) {
      const a = i / N * 2 * Math.PI; let v;
      if (shape === 'sin') v = Math.sin(a); else if (shape === 'sq') v = a < Math.PI ? 1 : -1; else if (shape === 'tri') v = 1 - 2 * Math.abs((a / Math.PI) % 2 - 1); else { const c = Math.cos(a / 2 * 2 - Math.PI / 2); v = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 9); }
      s1 += Math.abs(v); s2 += v * v; pk = Math.max(pk, Math.abs(v));
    }
    const avg = s1 / N, rms = Math.sqrt(s2 / N);
    return { avg, rms, pk, avgMeter: avg * Math.PI / (2 * Math.SQRT2), crest: pk / rms };
  };
  SIMS.rms = el => {
    let shape = 'sin';
    const N = { sin: 'Sinusoïde', sq: 'Créneau', tri: 'Triangle', pulse: 'Courant d\'un redresseur (pointes)' };
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-s">${Object.entries(N).map(([k, n]) => `<button data-s="${k}" class="${k === 'sin' ? 'on' : ''}">${n}</button>`).join('')}</div></div><div class="simview"></div>
      <div class="simout"><div><span>Vraie valeur efficace (crête = 100)</span><b class="o-r"></b></div><div><span>Appareil « valeur moyenne » étalonné sinus</span><b class="o-a"></b></div><div><span>Appareil TRMS</span><b class="o-t"></b></div><div><span>Facteur de crête</span><b class="o-c"></b></div></div></div>`;
    el.querySelectorAll('.js-s button').forEach(b => b.onclick = () => { shape = b.dataset.s; el.querySelectorAll('.js-s button').forEach(x => x.classList.toggle('on', x === b)); });
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H, t) => {
      const r = AA.VIS.rms(shape);
      el.querySelector('.o-r').textContent = AA.fmt(100 * r.rms, 1);
      el.querySelector('.o-a').innerHTML = `${AA.fmt(100 * r.avgMeter, 1)} <small style="color:var(${Math.abs(r.avgMeter / r.rms - 1) > 0.02 ? '--bad' : '--ok'})">(${r.avgMeter >= r.rms ? '+' : ''}${AA.fmt((r.avgMeter / r.rms - 1) * 100, 0)} %)</small>`;
      el.querySelector('.o-t').textContent = AA.fmt(100 * r.rms, 1);
      el.querySelector('.o-c').textContent = AA.fmt(r.crest, 2);
      const mid = H / 2, A = H * 0.38;
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(10, mid); g.lineTo(W - 10, mid); g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath();
      for (let x = 10; x <= W - 10; x += 1.5) {
        const a = ((x - 10) / (W - 20) * 4 * Math.PI) % (2 * Math.PI); let v;
        if (shape === 'sin') v = Math.sin(a); else if (shape === 'sq') v = a < Math.PI ? 1 : -1; else if (shape === 'tri') v = 1 - 2 * Math.abs((a / Math.PI) % 2 - 1); else v = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 9);
        x === 10 ? g.moveTo(x, mid - v * A) : g.lineTo(x, mid - v * A);
      }
      g.stroke();
      g.setLineDash([5, 4]); g.strokeStyle = css('--teal'); g.beginPath(); g.moveTo(10, mid - r.rms * A); g.lineTo(W - 10, mid - r.rms * A); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--teal'); g.font = '600 11px Bahnschrift'; g.fillText('valeur efficace', 14, mid - r.rms * A - 4);
    });
    return cv.stop;
  };

  /* ---------- Catégories de mesure : où suis-je dans le bâtiment ? ---------- */
  AA.VISDATA.HOT.cat = [`<svg viewBox="0 0 440 230" class="hot-svg"><path d="M10 200 H430" class="h-line"/>
    <g data-spot="iv"><path d="M40 200 V60 M25 70 H55 M30 90 H50" class="h-line" style="stroke-width:3"/><rect x="70" y="120" width="44" height="60" rx="3" class="h-dev"/><text x="74" y="154" class="h-txt">kWh</text></g>
    <path d="M40 70 Q80 60 92 120" class="h-line"/><path d="M114 150 H160" class="h-line"/>
    <path d="M160 200 V40 L300 10 L440 40 V200" class="h-line"/>
    <g data-spot="iii"><rect x="170" y="90" width="60" height="90" rx="3" class="h-dev"/><path d="M180 105 h40 M180 120 h40 M180 135 h40 M180 150 h40" class="h-line"/></g>
    <g data-spot="iii2"><circle cx="270" cy="160" r="20" class="h-dev"/><text x="262" y="165" class="h-txt">M</text></g>
    <g data-spot="ii"><rect x="330" y="140" width="34" height="40" rx="5" class="h-dev"/><circle cx="341" cy="160" r="3" class="h-knob"/><circle cx="353" cy="160" r="3" class="h-knob"/></g>
    <g data-spot="i"><rect x="378" y="110" width="44" height="30" rx="3" class="h-win"/><text x="381" y="130" class="h-txt">PC</text></g>
    <path d="M230 135 H250 M290 160 H330 M364 160 H378 V140" class="h-line"/></svg>`,
  { iv: ['CAT IV — origine de l\'installation', 'Réseau aérien ou souterrain, branchement, compteur, protection générale. Les surtensions de foudre y sont les plus fortes : l\'appareil et ses cordons doivent être marqués CAT IV.'],
    iii: ['CAT III — installation du bâtiment', 'Tableaux de distribution, canalisations fixes, jeux de barres. Exemple : mesurer dans une armoire industrielle impose au minimum CAT III pour la tension concernée.'],
    iii2: ['CAT III — équipements fixes', 'Moteurs et machines raccordés à demeure sur l\'installation fixe.'],
    ii: ['CAT II — appareils sur prise', 'Circuits raccordés à l\'installation par une prise de courant : électroménager, outils portatifs.'],
    i: ['Hors catégorie de réseau', 'Circuits électroniques non raccordés directement au réseau (alimentés par un transformateur ou des piles). L\'édition 2010 de l\'IEC 61010 ne nomme plus « CAT I » ; on parle de circuits non reliés au réseau.'] }, 'Catégories de mesure (IEC 61010)'];

  /* ---------- Oscilloscope : régler et lire ---------- */
  SIMS.oscillo = el => {
    const VD = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50], TD = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02];
    const r = AA.rng(Date.now() ^ 4242);
    let sig, vi = 6, ti = 5, probe = 1;
    const gen = () => { const f = r.pick([50, 100, 250, 400, 1000, 2000]), A = r.pick([0.3, 0.8, 1.5, 3, 6, 12]); sig = { f, A }; };
    gen();
    el.innerHTML = `<div class="simcard vis-osc"><div class="simview scope-screen"></div><div class="simctl">
      <div class="field"><label>VOLTS/DIV</label><div class="row"><button class="btn sm icon js-vm">−</button><b class="mono js-vd"></b><button class="btn sm icon js-vp">+</button></div></div>
      <div class="field"><label>TIME/DIV</label><div class="row"><button class="btn sm icon js-tm">−</button><b class="mono js-td"></b><button class="btn sm icon js-tp">+</button></div></div>
      <div class="field"><label>Sonde</label><div class="seg js-p"><button data-p="1" class="on">×1</button><button data-p="10">×10</button></div></div></div>
      <div class="num-in" style="padding:0 16px 8px"><span>Fréquence</span><input class="js-f" inputmode="decimal" placeholder="Hz"><span>Amplitude crête</span><input class="js-a" inputmode="decimal" placeholder="V"><button class="btn primary sm js-ok">Vérifier</button><button class="btn sm ghost js-n">Autre signal</button></div><div class="js-fb" style="padding:0 16px 14px"></div></div>`;
    const upd = () => { el.querySelector('.js-vd').textContent = AA.fmt(VD[vi]) + ' V'; el.querySelector('.js-td').textContent = TD[ti] >= 0.001 ? AA.fmt(TD[ti] * 1000) + ' ms' : AA.fmt(TD[ti] * 1e6) + ' µs'; };
    el.querySelector('.js-vm').onclick = () => { vi = Math.max(0, vi - 1); upd(); }; el.querySelector('.js-vp').onclick = () => { vi = Math.min(VD.length - 1, vi + 1); upd(); };
    el.querySelector('.js-tm').onclick = () => { ti = Math.max(0, ti - 1); upd(); }; el.querySelector('.js-tp').onclick = () => { ti = Math.min(TD.length - 1, ti + 1); upd(); };
    el.querySelectorAll('.js-p button').forEach(b => b.onclick = () => { probe = +b.dataset.p; el.querySelectorAll('.js-p button').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('.js-n').onclick = () => { gen(); el.querySelector('.js-fb').innerHTML = ''; };
    el.querySelector('.js-ok').onclick = () => {
      const f = parseFloat(el.querySelector('.js-f').value.replace(',', '.')), a = parseFloat(el.querySelector('.js-a').value.replace(',', '.'));
      const okF = Math.abs(f - sig.f) / sig.f <= 0.05, okA = Math.abs(a - sig.A) / sig.A <= 0.08;
      el.querySelector('.js-fb').innerHTML = `<p class="${okF && okA ? 'ok-t' : 'bad-t'}">Fréquence ${okF ? 'juste' : 'inexacte'}, amplitude ${okA ? 'juste' : 'inexacte'}. Signal réel : ${sig.f} Hz, ${AA.fmt(sig.A)} V crête (T = ${AA.fmt(1000 / sig.f, 3)} ms). Méthode : T = nombre de divisions d'une période × TIME/DIV ; Û = divisions crête × VOLTS/DIV${probe === 10 ? ' (la sonde ×10 est prise en compte par l\'oscilloscope quand elle est déclarée)' : ''}.</p>`;
    };
    upd();
    const cv = AA.canvas(el.querySelector('.simview'), 240, (g, W, H, t) => {
      g.fillStyle = '#071410'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(80,255,170,.12)'; g.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * W / 10, 0); g.lineTo(i * W / 10, H); g.stroke(); }
      for (let j = 0; j <= 8; j++) { g.beginPath(); g.moveTo(0, j * H / 8); g.lineTo(W, j * H / 8); g.stroke(); }
      g.strokeStyle = 'rgba(80,255,170,.3)'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
      const span = TD[ti] * 10, dv = H / 8 / VD[vi];
      g.strokeStyle = '#5dffb0'; g.lineWidth = 2.2; g.shadowColor = '#5dffb0'; g.shadowBlur = 8; g.beginPath();
      for (let x = 0; x <= W; x += 1) { const tt = x / W * span; let y = H / 2 - sig.A * Math.sin(2 * Math.PI * sig.f * tt) * dv; y = Math.max(-2, Math.min(H + 2, y)); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.shadowBlur = 0;
      g.fillStyle = '#9fffd0'; g.font = '600 11px Cascadia Mono, Consolas'; g.fillText(`CH1 ${AA.fmt(VD[vi])} V/div   ${el.querySelector('.js-td').textContent}/div   sonde ×${probe}`, 8, 14);
    });
    return cv.stop;
  };

  /* ---------- Méthode des deux wattmètres ---------- */
  AA.VIS.twoW = (U, I, phiDeg) => { const p = phiDeg * Math.PI / 180, r = Math.PI / 6; return { W1: U * I * Math.cos(r - p), W2: U * I * Math.cos(r + p) }; };
  SIMS.wattm = el => {
    const st = { I: 10, phi: 30 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('I', 'Courant de ligne', 1, 40, 1, 10, 'A')}${sl('phi', 'Déphasage φ (charge équilibrée, 400 V)', 0, 85, 1, 30, '°')}</div>
      <div class="simout"><div><span>W1 = U I cos(30° − φ)</span><b class="o-1"></b></div><div><span>W2 = U I cos(30° + φ)</span><b class="o-2"></b></div><div><span>P = W1 + W2</span><b class="o-p"></b></div><div><span>Q = √3 (W1 − W2)</span><b class="o-q"></b></div></div></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 160, (g, W, H) => {
      const r = AA.VIS.twoW(400, st.I, st.phi), P = r.W1 + r.W2, Q = Math.sqrt(3) * (r.W1 - r.W2);
      el.querySelector('.o-1').textContent = AA.fmt(r.W1, 0) + ' W'; el.querySelector('.o-2').innerHTML = AA.fmt(r.W2, 0) + ' W' + (r.W2 < 0 ? ' <small style="color:var(--warn)">négatif : inverser le circuit tension de W2 et soustraire</small>' : '');
      el.querySelector('.o-p').textContent = AA.fmt(P, 0) + ' W (√3·U·I·cos φ = ' + AA.fmt(Math.sqrt(3) * 400 * st.I * Math.cos(st.phi * Math.PI / 180), 0) + ' W)';
      el.querySelector('.o-q').textContent = AA.fmt(Q, 0) + ' var';
      const meter = (x, v, lbl) => { const cx = x, cy = H - 20, R = 60; g.strokeStyle = css('--line-2'); g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R, Math.PI, 2 * Math.PI); g.stroke(); const max = 400 * 40, f = 0.5 + v / max / 2 * 1.6; const a = Math.PI + Math.max(0, Math.min(1, f)) * Math.PI; g.strokeStyle = css('--bad'); g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); g.fillStyle = css('--ink'); g.font = '700 13px Bahnschrift'; g.fillText(lbl, cx - 10, cy - R - 8); };
      meter(W * 0.3, r.W1, 'W1'); meter(W * 0.7, r.W2, 'W2');
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Aiguille au centre = 0 ; W2 s\'annule pour φ = 60° (cos φ = 0,5) puis devient négatif.', 10, 14);
    });
    return cv.stop;
  };

  /* ---------- Mégohmmètre : tension d'essai et interprétation ---------- */
  SIMS.megger = el => {
    const C = [
      { n: 'Circuit TBTS 24 V (commande)', u: 250, min: 0.5 }, { n: 'Circuit de prises 230 V', u: 500, min: 1 }, { n: 'Moteur 400 V', u: 500, min: 1 }, { n: 'Câble 690 V d\'un variateur', u: 1000, min: 1 }
    ];
    const r = AA.rng(Date.now() ^ 77);
    let c = r.pick(C), R = r.pick([0.2, 0.7, 1.8, 12, 150, 800]), u = 500;
    const draw = () => {
      el.innerHTML = `<div class="simcard"><div class="vo-head"><b>Contrôle d'isolement</b><span>${c.n} — hors tension, consigné, équipements électroniques déconnectés.</span></div>
        <div class="simctl"><div class="field"><label>Tension d'essai</label><div class="seg js-u">${[250, 500, 1000].map(v => `<button data-u="${v}" class="${v === u ? 'on' : ''}">${v} V ⎓</button>`).join('')}</div></div><button class="btn primary sm js-t">TEST (maintenir 60 s simulées)</button></div>
        <div class="dmm-msg js-m" style="margin:0 16px 14px"></div><div class="row" style="padding:0 16px 14px"><button class="btn sm ghost js-n">Autre circuit</button></div></div>`;
      el.querySelectorAll('.js-u button').forEach(b => b.onclick = () => { u = +b.dataset.u; draw(); });
      el.querySelector('.js-n').onclick = () => { c = r.pick(C); R = r.pick([0.2, 0.7, 1.8, 12, 150, 800]); draw(); };
      el.querySelector('.js-t').onclick = () => {
        const m = el.querySelector('.js-m');
        if (u !== c.u) { m.innerHTML = `<span class="bad-t">Tension d'essai inadaptée.</span> Pour « ${c.n} », l'IEC 60364-6 prévoit ${c.u} V continu. ${u > c.u ? 'Trop élevée : risque d\'endommager l\'isolant ou les composants.' : 'Trop faible : le défaut pourrait ne pas apparaître.'}`; return; }
        const ok = R >= c.min;
        m.innerHTML = `Résultat : <b>${R >= 1 ? AA.fmt(R) + ' MΩ' : AA.fmt(R * 1000) + ' kΩ'}</b> — ${ok ? `<span class="ok-t">conforme</span> (minimum ${c.min} MΩ sous ${c.u} V). ${R < 10 ? 'Conforme mais faible : à surveiller (humidité, vieillissement).' : ''}` : `<span class="bad-t">non conforme</span> (minimum ${c.min} MΩ). Rechercher le défaut en isolant les tronçons un à un.`} Après l'essai, décharger le circuit (l'appareil le fait automatiquement).`;
      };
    };
    draw();
  };

  /* ---------- Mesure de terre : méthode des 62 % ---------- */
  AA.VIS.earthR = (x, D, Ra) => {
    // électrode réelle Ra ; résistance apparente selon la position x du piquet de tension (0..D), modèle hémisphérique
    const a = 0.3; // rayon équivalent (m)
    const k = Ra * a; // résistivité équivalente (ρ/2π)
    // potentiel créé par +I en E et −I en C : R = k (1/a − 1/D − 1/x + 1/(D − x)) ; égal à k/a pour x = 0,618 D
    return k * (1 / a - 1 / D - 1 / Math.max(a, x) + 1 / Math.max(a, D - x));
  };
  SIMS.earth = el => {
    const st = { x: 62, D: 40, Ra: 30 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('x', 'Position du piquet de tension P (en % de la distance au piquet de courant)', 5, 95, 1, 62, '%')}</div>
      <div class="simout"><div><span>Résistance mesurée</span><b class="o-r"></b></div><div><span>Valeur vraie de la prise de terre</span><b>30 Ω</b></div></div></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 210, (g, W, H) => {
      const D = st.D, X = x => 40 + x / D * (W - 80);
      const Rm = AA.VIS.earthR(st.x / 100 * D, D, st.Ra);
      el.querySelector('.o-r').textContent = AA.fmt(Rm, 1) + ' Ω';
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI';
      const y0 = H - 50, Y = R => y0 - R / 60 * (y0 - 20);
      g.beginPath(); g.moveTo(40, y0); g.lineTo(W - 40, y0); g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath();
      for (let p = 3; p <= 97; p += 1) { const R = AA.VIS.earthR(p / 100 * D, D, st.Ra); p === 3 ? g.moveTo(X(p / 100 * D), Y(R)) : g.lineTo(X(p / 100 * D), Y(R)); }
      g.stroke();
      g.strokeStyle = css('--teal'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(40, Y(st.Ra)); g.lineTo(W - 40, Y(st.Ra)); g.stroke(); g.setLineDash([]);
      const xp = X(st.x / 100 * D);
      g.fillStyle = css('--ok'); g.beginPath(); g.arc(xp, Y(Rm), 6, 0, 7); g.fill();
      [[0, 'E (prise à mesurer)'], [st.x / 100 * D, 'P'], [D, 'C (piquet de courant)']].forEach(([x, n]) => { g.fillStyle = css('--ink'); g.fillRect(X(x) - 2, y0, 4, 22); g.fillText(n, X(x) - 12, y0 + 36); });
      g.fillStyle = css('--ink-3'); g.fillText('Modèle de terrain homogène : la mesure est juste vers 62 % ; près des piquets, les zones d\'influence faussent le résultat.', 40, 14);
    });
    return cv.stop;
  };

  /* ---------- Test d'un dispositif différentiel ---------- */
  SIMS.rcdtest = el => {
    const r = AA.rng(Date.now() ^ 5);
    let dev, res = [];
    const newDev = () => { const S = r() < 0.25; dev = { S, In: 30, t1: S ? r.pick([180, 260, 420, 620]) : r.pick([22, 35, 60, 340]), half: r() < 0.12 }; res = []; };
    newDev();
    const draw = () => {
      el.innerHTML = `<div class="simcard"><div class="vo-head"><b>Contrôleur de différentiel</b><span>Interrupteur différentiel 30 mA ${dev.S ? 'type S (retardé)' : 'général'} — injecte un courant de fuite et mesure le temps.</span></div>
        <div class="simctl"><button class="btn sm" data-k="0.5">½ IΔn (15 mA)</button><button class="btn sm" data-k="1">IΔn (30 mA)</button><button class="btn sm" data-k="5">5 IΔn (150 mA)</button><button class="btn sm ghost js-n">Autre appareil</button></div>
        <div class="log js-l" style="margin:0 16px">${res.join('<br>') || 'Aucun essai.'}</div>
        <div class="simctl"><span class="muted">Ton verdict :</span><button class="btn sm" data-v="ok">Conforme</button><button class="btn sm" data-v="ko">Non conforme</button></div><div class="js-fb" style="padding:0 16px 14px"></div></div>`;
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        const k = +b.dataset.k;
        let line;
        if (k === 0.5) line = dev.half ? '½ IΔn : DÉCLENCHE (trop sensible)' : '½ IΔn : ne déclenche pas';
        else if (k === 1) line = `IΔn : déclenche en ${dev.t1} ms`;
        else line = `5 IΔn : déclenche en ${Math.round(dev.S ? Math.min(dev.t1, 120) * 0.6 : Math.max(12, dev.t1 / 6))} ms`;
        res.push(line); draw();
      });
      el.querySelector('.js-n').onclick = () => { newDev(); draw(); };
      el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
        const lim = dev.S ? [130, 500] : [0, 300];
        const conform = !dev.half && dev.t1 >= lim[0] && dev.t1 <= lim[1];
        const good = (b.dataset.v === 'ok') === conform;
        el.querySelector('.js-fb').innerHTML = `<p class="${good ? 'ok-t' : 'bad-t'}">${good ? 'Bon diagnostic.' : 'Diagnostic erroné.'} Exigences (IEC 61008) : pas de déclenchement à ½ IΔn ; à IΔn, ${dev.S ? 'entre 130 et 500 ms pour un type S' : '≤ 300 ms pour un type général'} ; à 5 IΔn, ${dev.S ? 'entre 50 et 150 ms (type S)' : '≤ 40 ms'}. Cet appareil était ${conform ? 'conforme' : 'non conforme'}.</p>`;
      });
    };
    draw();
  };

  /* ---------- Caméra thermique : point chaud et émissivité ---------- */
  SIMS.thermocam = el => {
    const st = { e: 0.95, load: 80 };
    const r = AA.rng(Date.now() ^ 31); let hot = r.int(0, 5);
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('e', 'Émissivité réglée sur la caméra', 0.1, 1, 0.01, 0.95, '')}${sl('load', 'Charge du circuit', 0, 100, 5, 80, '%')}<button class="btn sm ghost js-n">Autre tableau</button></div>
      <p class="muted" style="padding:0 16px 14px;font-size:13px">Bornier de six départs, ambiance 25 °C. Une connexion est desserrée. Les bornes sont en cuivre étamé peint (émissivité réelle ≈ 0,9) sauf la plaque de cuivre poli (≈ 0,1).</p></div>`;
    bind(el, st, { e: v => v.toFixed(2) });
    el.querySelector('.js-n').onclick = () => { hot = r.int(0, 5); };
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H) => {
      const pal = T => { const f = Math.max(0, Math.min(1, (T - 20) / 60)); return `hsl(${260 - 260 * f},90%,${30 + 30 * f}%)`; };
      for (let i = 0; i < 6; i++) {
        const trueT = 25 + st.load / 100 * (i === hot ? 55 : 9) * Math.pow(st.load / 100, 1);
        const shown = 25 + (trueT - 25) * 0.9 / st.e; // la caméra corrige avec l'émissivité réglée
        const x = 30 + i * (W - 60) / 6;
        g.fillStyle = pal(shown); g.fillRect(x, 40, (W - 60) / 6 - 12, 110);
        g.fillStyle = '#fff'; g.font = '700 12px Cascadia Mono, Consolas'; g.fillText(AA.fmt(shown, 1) + '°', x + 6, 64);
      }
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('Mesurer en charge (idéalement plus de 40 % de la charge nominale) et comparer les phases entre elles : l\'écart compte plus que la valeur absolue.', 20, H - 14);
      g.fillText(st.e < 0.85 ? 'Émissivité trop basse pour ces surfaces : la caméra surestime les températures.' : st.e > 0.97 ? 'Émissivité légèrement trop haute : températures sous-estimées.' : 'Émissivité cohérente avec des surfaces peintes ou oxydées.', 20, 24);
    });
    return cv.stop;
  };

  /* ---------- Ordre des phases ---------- */
  SIMS.phaseorder = el => {
    let order = [1, 2, 3];
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><button class="btn sm js-s">Croiser deux cordons</button></div><p class="muted js-d" style="padding:0 16px 14px"></p></div>`;
    el.querySelector('.js-s').onclick = () => { order = [order[0], order[2], order[1]]; };
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H, t) => {
      const direct = (order[1] - order[0] + 3) % 3 === 1;
      el.querySelector('.js-d').textContent = direct ? 'Ordre direct (L1-L2-L3) : le disque tourne dans le sens horaire, un moteur raccordé tournera dans son sens prévu.' : 'Ordre inverse : le disque tourne dans le sens antihoraire. Un moteur raccordé tournerait à l\'envers (pompe désamorcée, convoyeur en marche arrière).';
      const cx = W / 2, cy = H / 2;
      g.strokeStyle = css('--ink'); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 52, 0, 7); g.stroke();
      const a = (direct ? 1 : -1) * t * 2.5;
      for (let k = 0; k < 3; k++) { g.strokeStyle = [css('--pot-L1'), css('--pot-L2'), css('--pot-L3')][k]; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 40, a + k * 2.094, a + k * 2.094 + 1.2); g.stroke(); }
      ['L1', 'L2', 'L3'].forEach((n, k) => { g.fillStyle = css('--ink'); g.font = '700 12px Bahnschrift'; g.fillText(`${n} → borne ${order[k]}`, 20, 30 + k * 22); });
    });
    return cv.stop;
  };

  /* ================= LEÇONS ================= */
  L.nmm1l1 = { min: 7, why: "Une mesure sans unité ou avec un mauvais préfixe est une mesure fausse : 1 mA et 1 A, c'est mille fois d'écart.", screens: [[
    { h: 'Grandeurs et unités du Système international' },
    { table: { head: ['Grandeur', 'Symbole', 'Unité', 'Instrument'], rows: [['Courant', 'I', 'ampère (A)', 'ampèremètre, pince'], ['Tension', 'U', 'volt (V)', 'voltmètre'], ['Résistance', 'R', 'ohm (Ω)', 'ohmmètre, mégohmmètre'], ['Puissance active', 'P', 'watt (W)', 'wattmètre'], ['Énergie', 'E', 'joule (J) ; en pratique wattheure (Wh)', 'compteur'], ['Fréquence', 'f', 'hertz (Hz)', 'fréquencemètre, oscilloscope']] } },
    { table: { head: ['Préfixe', 'Symbole', 'Facteur', 'Exemple'], rows: [['micro', 'µ', '10⁻⁶', '50 µA (courant de fuite)'], ['milli', 'm', '10⁻³', '30 mA (différentiel)'], ['kilo', 'k', '10³', '4,7 kΩ'], ['méga', 'M', '10⁶', '500 MΩ (isolement)'], ['giga', 'G', '10⁹', '2 GΩ']] } },
    { num: { id: 'pref', gen: r => { const v = r.pick([0.035, 0.0047, 4700, 1500000, 0.25]); const t = v < 1 ? { q: `Convertis <b>${AA.fmt(v, 4)} A</b> en milliampères.`, a: v * 1000, unit: 'mA' } : { q: `Convertis <b>${AA.fmt(v)} Ω</b> en kilo-ohms.`, a: v / 1000, unit: 'kΩ' }; return Object.assign(t, { tol: 0.001, sol: `${AA.fmt(t.a, 3)} ${t.unit}` }); } } }
  ]] };
  L.nmm1l2 = { min: 9, why: "Lire 230,0 V ne veut pas dire que la tension vaut exactement 230,0 V : savoir ce que garantit l'appareil évite des diagnostics faux.", screens: [[
    { h: 'Erreur, précision, résolution' },
    { list: ['<b>Résolution</b> : le plus petit écart affichable (1 chiffre sur le dernier rang). Un 6 000 points sur le calibre 6 V affiche au millivolt.', '<b>Précision</b> (exactitude) : l\'écart possible entre la valeur affichée et la vraie valeur. Pour un numérique, elle s\'exprime en « ± (% de la lecture + nombre de digits) ».', '<b>Une bonne résolution ne garantit pas une bonne précision</b> : un afficheur peut montrer trois décimales fausses.'] },
    { num: { id: 'prec', gen: r => { const v = r.pick([4.85, 12.32, 5.6]), p = r.pick([0.5, 0.8, 1]), d = r.pick([2, 3, 5]); const err = v * p / 100 + d * 0.001 * (v < 6 ? 1 : 10); return { q: `Un multimètre affiche <b>${AA.fmt(v, 3)} V</b> sur le calibre ${v < 6 ? '6 V (résolution 0,001 V)' : '60 V (résolution 0,01 V)'}. Précision annoncée : ± (${AA.fmt(p)} % + ${d} digits). Quelle est l'incertitude maximale en volts ?`, a: err, unit: 'V', tol: 0.02, sol: `${AA.fmt(p)} % de ${AA.fmt(v, 3)} = ${AA.fmt(v * p / 100, 4)} V ; ${d} digits = ${AA.fmt(d * (v < 6 ? 0.001 : 0.01), 3)} V ; total ± ${AA.fmt(err, 4)} V.` }; } } },
    { recap: ['Résolution = finesse d\'affichage ; précision = confiance dans la valeur.', 'Numérique : ± (% lecture + digits). Analogique : classe × calibre.'] }
  ]] };
  L.nmm1l3 = { min: 6, why: "Chaque technologie a ses atouts : l'aiguille montre une tendance, l'afficheur donne une valeur précise.", screens: [[
    { h: 'Aiguille ou chiffres ?' },
    { photos: ['analogique', 'multimetre'] },
    { table: { head: ['', 'Analogique', 'Numérique'], rows: [['Lecture', 'Interprétation de l\'échelle, risque de parallaxe', 'Directe, sans ambiguïté'], ['Variations', 'Excellente : on voit la tendance, les fluctuations', 'Moins lisible (sauf bargraphe)'], ['Précision typique', 'Classe 1,5 à 2,5 (en % du calibre)', '0,05 à 1 % de la lecture'], ['Impédance d\'entrée', 'Souvent 20 kΩ/V : charge le circuit', '10 MΩ typiquement'], ['Alimentation', 'Pas de pile pour les tensions et courants', 'Pile nécessaire']] } }
  ]] };
  L.nmm1l4 = { min: 9, why: "Les charges électroniques déforment le courant : un appareil non TRMS peut se tromper de 40 % et plus.", screens: [[
    { h: 'Moyenne, efficace, TRMS' },
    { p: "La <b>valeur efficace</b> (RMS) est celle qui produit le même échauffement qu'une tension continue. Les appareils économiques mesurent en réalité la <b>valeur moyenne</b> du signal redressé, puis la multiplient par 1,11 : c'est juste <b>uniquement pour une sinusoïde parfaite</b>. Les appareils <b>TRMS</b> (« True RMS ») calculent la vraie valeur efficace quelle que soit la forme." },
    { formula: 'Facteur de crête = Û / U<sub>eff</sub>', small: '√2 ≈ 1,41 pour une sinusoïde ; 3 ou plus pour le courant d\'une alimentation électronique' },
    { recap: ['Signaux déformés (variateurs, alimentations, LED) : exiger un TRMS.', 'Vérifier aussi le facteur de crête admissible indiqué par le fabricant.'] }
  ]] };
  L.nmm1l5 = { min: 9, why: "Un appareil de mesure inadapté au point de mesure peut exploser lors d'une surtension : c'est un risque d'accident grave.", screens: [[
    { h: 'Catégories de mesure' },
    { p: "Les surtensions transitoires (foudre, manœuvres) sont d'autant plus fortes qu'on se rapproche de l'origine de l'installation. La norme <b>IEC 61010</b> classe les points de mesure en catégories ; l'appareil <b>et ses cordons</b> doivent porter une catégorie au moins égale, pour une tension au moins égale à celle du circuit." },
    { warn: "<b>Le maillon faible</b>Un multimètre CAT IV 600 V utilisé avec des cordons CAT II 1 000 V ne vaut que CAT II pour la mesure : c'est la plus faible des deux qui compte." },
    { quiz: { q: 'Tu dois mesurer la tension sur le jeu de barres d\'un tableau divisionnaire 400 V. Quelle catégorie minimale ?', opts: ['CAT II 300 V', 'CAT III 600 V', 'CAT III 300 V', 'Aucune'], a: 1, why: 'Tableau de distribution : CAT III, et une tension assignée au moins égale à la tension entre phases (400 V), donc 600 V.' } }
  ]] };

  L.nmm2l1 = { min: 7, why: "Connaître chaque borne et chaque position évite les deux erreurs les plus fréquentes : mauvaise borne, mauvaise fonction.", screens: [[
    { h: 'Anatomie d\'un multimètre' },
    { photos: ['multimetre'] },
    { list: ['<b>COM</b> : borne commune, toujours la pointe noire.', '<b>VΩ</b> (souvent marquée aussi diode, continuité) : tensions, résistances, continuité.', '<b>mA</b> (ou µA mA) : petits courants, protégée par un fusible rapide de faible calibre.', '<b>A</b> (10 A ou 20 A) : forts courants, fusible HPC (haut pouvoir de coupure) ; durée de mesure souvent limitée (par exemple 30 s toutes les 15 min au-delà de 10 A).', '<b>Commutateur</b> : choix de la grandeur (V~, V⎓, Ω, A…).', '<b>RANGE / AUTO</b> : calibre automatique ou manuel.'] }
  ]] };
  L.nmm2l2 = { min: 8, why: "Choisir le bon calibre, c'est obtenir la meilleure résolution sans saturer l'affichage.", screens: [[
    { h: 'Fonction et calibre' },
    { p: "En calibre automatique, l'appareil choisit seul. En calibre manuel, on part du <b>plus grand calibre</b> puis on descend jusqu'au plus petit qui n'affiche pas <b>OL</b> (dépassement). Sur un 6 000 points, les calibres de tension sont typiquement 600 mV, 6 V, 60 V, 600 V et 1 000 V." },
    { tip: "<b>Essaie dans le simulateur</b>Choisis V⎓, appuie plusieurs fois sur RANGE et observe comment la résolution change avec le calibre, jusqu'à OL." }
  ]] };
  L.nmm2l3 = { min: 7, why: "La mesure de tension est la mesure de base du dépanneur : elle se fait sous tension, donc elle doit être irréprochable.", screens: [[
    { h: 'Mesurer une tension' },
    { list: ['Vérifier l\'appareil, les cordons (isolant intact, catégorie adaptée) et porter les EPI requis.', 'Pointe noire dans COM, rouge dans VΩ ; fonction V~ ou V⎓ selon le circuit.', 'Brancher <b>en parallèle</b> sur les deux points à comparer : noire d\'abord sur le point le moins dangereux (neutre, 0 V), rouge ensuite.', 'Lire, puis retirer la rouge en premier.'] },
    { quiz: { q: 'Le multimètre affiche ≈ 0 V entre phase et neutre d\'une prise alors que la lampe branchée dessus fonctionne. Cause la plus probable ?', opts: ['La prise est hors tension', 'La fonction V⎓ est choisie sur une tension alternative (ou la pointe rouge n\'est pas dans VΩ)', 'Le neutre est coupé', 'Le multimètre est en TRMS'], a: 1, why: 'Une lampe allumée prouve la présence de tension : l\'appareil est mal réglé ou mal branché.' } }
  ]] };
  L.nmm2l4 = { min: 9, why: "La mesure de courant est celle qui détruit le plus de multimètres : elle impose d'ouvrir le circuit et de choisir la bonne borne.", screens: [[
    { h: 'Mesurer un courant' },
    { list: ['Couper l\'alimentation, <b>ouvrir le circuit</b> et insérer l\'appareil <b>en série</b>.', 'Si l\'ordre de grandeur est inconnu : borne <b>A</b> d\'abord, puis mA si le courant est faible.', 'Remettre sous tension, lire, couper, retirer l\'appareil, refermer le circuit.', 'Pour éviter tout cela : la <b>pince ampèremétrique</b>.'] },
    { warn: "<b>Après une mesure de courant</b>Remettre la pointe rouge dans VΩ. La plupart des multimètres détruits le sont parce que la pointe est restée dans la borne A lors de la mesure de tension suivante." }
  ]] };
  L.nmm2l5 = { min: 8, why: "Continuité et résistance se mesurent hors tension : ce sont les mesures de dépannage après consignation.", screens: [[
    { h: 'Résistance, continuité, diode' },
    { list: ['<b>Ω</b> : l\'appareil injecte un petit courant et mesure la tension. Circuit hors tension, élément isolé du reste du circuit (sinon on mesure les branches parallèles).', '<b>Continuité</b> (bip) : signal sonore sous une résistance de quelques dizaines d\'ohms selon le modèle. Idéal pour suivre un fil, tester un fusible ou un contact.', '<b>Diode</b> : affiche la tension de seuil (≈ 0,5 à 0,7 V pour une diode au silicium) dans le sens passant, OL dans le sens bloqué.'] },
    { quiz: { q: 'Un fusible retiré de son socle indique OL en continuité. Conclusion ?', opts: ['Le fusible est bon', 'Le fusible est fondu', 'Le multimètre est en panne', 'Il faut le mesurer sous tension'], a: 1, why: 'OL = circuit ouvert : l\'élément fusible est coupé.' } }
  ]] };
  L.nmm2l6 = { min: 8, why: "Connaître les erreurs graves, c'est ne jamais les commettre — même fatigué, même pressé.", screens: [[
    { h: 'Les erreurs qui détruisent l\'appareil' },
    { table: { head: ['Erreur', 'Conséquence'], rows: [['Pointe rouge dans A ou mA, mesure de tension', 'Court-circuit à travers le shunt : fusible fondu, arc possible si le fusible n\'est pas HPC'], ['Fonction Ω sous tension', 'Mesure fausse ; appareil endommagé si sa protection est insuffisante'], ['Calibre manuel trop petit sur une forte tension', 'Affichage OL (les appareils modernes sont protégés)'], ['Fusible remplacé par un modèle quelconque', 'Perte du pouvoir de coupure : risque d\'explosion lors d\'une erreur'], ['Catégorie inadaptée au point de mesure', 'Destruction lors d\'une surtension transitoire']] } },
    { tip: "<b>Fais toutes ces erreurs… dans le simulateur</b>Le multimètre virtuel réagit comme un vrai : c'est le seul endroit où se tromper ne coûte rien." }
  ]] };

  L.nmm3l1 = { min: 7, why: "Comprendre le principe d'un appareil analogique explique ce qu'il mesure vraiment : moyenne ou valeur efficace.", screens: [[
    { h: 'Les deux grandes familles' },
    { list: ['<b>Magnétoélectrique (cadre mobile)</b> : une bobine mobile tourne dans le champ d\'un aimant. Il mesure la valeur moyenne : idéal en continu ; en alternatif, il est associé à un redresseur et étalonné pour une sinusoïde.', '<b>Ferromagnétique</b> : une palette de fer est attirée par le champ d\'une bobine fixe. Il mesure la valeur efficace, en continu comme en alternatif ; échelle non linéaire (resserrée au début).'] },
    { photos: ['analogique', 'wattmetre'] }
  ]] };
  L.nmm3l2 = { min: 10, why: "Lire une échelle est un savoir-faire qui demande de la méthode : c'est une source d'erreur fréquente en examen comme sur le terrain.", screens: [[
    { h: 'Lire une échelle, choisir le calibre' },
    { formula: 'Valeur = (graduation lue / nombre de graduations de l\'échelle) × calibre' },
    { list: ['Choisir le <b>plus petit calibre</b> qui ne met pas l\'aiguille en butée.', 'Lire sur l\'échelle dont le maximum correspond au calibre (échelle 0-15 pour les calibres 1,5 / 15 / 150, échelle 0-5 pour 5 / 50 / 500).', 'Compter précisément la valeur d\'une petite division sur l\'échelle utilisée.'] },
    { tip: "<b>Exercice</b>Le multimètre analogique ci-dessous affiche une tension inconnue : choisis le calibre, lis, calcule. Recommence avec « Nouvelle mesure » : les valeurs changent." }
  ]] };
  L.nmm3l3 = { min: 9, why: "La classe de précision explique pourquoi on lit toujours dans le dernier tiers de l'échelle.", screens: [[
    { h: 'Classe et incertitude' },
    { formula: 'ΔU = (classe / 100) × calibre', small: 'L\'incertitude absolue est la même partout sur l\'échelle : en début d\'échelle elle devient énorme en valeur relative' },
    { num: { id: 'cls', gen: r => { const c = r.pick([1, 1.5, 2.5]), cal = r.pick([15, 50, 150, 500]), v = Math.round(cal * r.pick([0.2, 0.5, 0.8]) * 10) / 10; return { q: `Appareil de classe <b>${AA.fmt(c)}</b>, calibre <b>${cal} V</b>, lecture <b>${AA.fmt(v)} V</b>. Incertitude relative en % de la lecture ?`, a: c / 100 * cal / v * 100, unit: '%', tol: 0.03, sol: `ΔU = ${AA.fmt(c / 100)} × ${cal} = ${AA.fmt(c / 100 * cal, 2)} V ; relative : ${AA.fmt(c / 100 * cal, 2)} / ${AA.fmt(v)} = ${AA.fmt(c / 100 * cal / v * 100, 1)} %.` }; } } }
  ]] };
  L.nmm3l4 = { min: 6, why: "Les symboles du cadran disent comment utiliser l'appareil ; la parallaxe est la première source d'erreur de lecture.", screens: [[
    { h: 'Symboles du cadran et parallaxe' },
    { table: { head: ['Symbole', 'Signification'], rows: [['⎓ / ∿', 'Continu / alternatif'], ['1,5', 'Classe de précision'], ['⊥', 'Utilisation cadran vertical'], ['⊓', 'Utilisation cadran horizontal'], ['∠ 60°', 'Utilisation cadran incliné à 60°'], ['★ avec un chiffre', 'Tension d\'essai d\'isolement de l\'appareil (en kV)']] } },
    { p: "La <b>parallaxe</b> : si l'œil n'est pas dans l'axe de l'aiguille, on lit une valeur décalée. Le <b>miroir</b> de l'échelle aide : on lit quand l'aiguille masque son propre reflet." }
  ]] };

  L.nmm4l1 = { min: 7, why: "La pince mesure un courant sans ouvrir le circuit : c'est l'outil le plus utilisé en dépannage industriel.", screens: [[
    { h: 'La pince ampèremétrique' },
    { photos: ['pince'] },
    { list: ['Les mâchoires enserrent <b>un seul conducteur</b> : le courant crée un champ magnétique que la pince mesure.', 'Pince <b>AC</b> : principe du transformateur de courant. Pince <b>AC/DC</b> : capteur à effet Hall, mesure aussi le continu (penser au zéro avant la mesure).', 'Enserrer un câble complet (phase + neutre) donne ≈ 0 : les champs s\'annulent.'] },
    { quiz: { q: 'Tu pinces un câble 3G2,5 entier alimentant un radiateur de 2 kW. Que lis-tu ?', opts: ['≈ 8,7 A', '≈ 0 A (aller et retour s\'annulent)', '≈ 17,4 A', 'OL'], a: 1, why: 'Phase et neutre portent le même courant en sens opposés : il faut pincer un seul conducteur.' } }
  ]] };
  L.nmm4l2 = { min: 7, why: "Le courant de fuite trahit un défaut d'isolement avant qu'il ne fasse déclencher le différentiel.", screens: [[
    { h: 'Mesurer un courant de fuite' },
    { p: "Une <b>pince de fuite</b> (résolution au microampère ou au milliampère) enserre <b>tous les conducteurs actifs</b> (phase et neutre, ou les trois phases et le neutre). En l'absence de fuite, la somme est nulle ; sinon elle affiche le courant qui part à la terre. On peut aussi pincer le seul conducteur de protection." },
    { real: "<b>Exemple</b>Un différentiel 30 mA déclenche de temps en temps. La somme des fuites permanentes des appareils (filtres d'ordinateurs, variateurs…) atteint 12 mA : ajoutée à une fuite passagère, elle dépasse le seuil. Solution : répartir les circuits sur plusieurs différentiels." }
  ]] };
  L.nmm4l3 = { min: 8, why: "Le wattmètre mesure directement la puissance active, celle qui est facturée et qui chauffe.", screens: [[
    { h: 'Le wattmètre' },
    { photos: ['wattmetre'] },
    { list: ['<b>Circuit courant</b> en série (comme un ampèremètre), <b>circuit tension</b> en parallèle (comme un voltmètre).', 'Les bornes repérées (± ou point) se relient côté source pour que l\'aiguille dévie dans le bon sens.', 'Il mesure P = U × I × cos φ : la puissance active, et non le produit U × I.', 'Calibres : on choisit le calibre courant ET le calibre tension ; ne jamais dépasser l\'un d\'eux, même si l\'aiguille reste dans l\'échelle.'] }
  ]] };
  L.nmm4l4 = { min: 10, why: "En triphasé sans neutre, deux wattmètres suffisent à mesurer la puissance de n'importe quel récepteur.", screens: [[
    { h: 'Puissance en triphasé' },
    { list: ['<b>Réseau équilibré avec neutre</b> : un seul wattmètre entre une phase et le neutre, P = 3 × W.', '<b>Méthode des deux wattmètres</b> (réseau trois fils, équilibré ou non) : P = W1 + W2.', 'Si la charge est équilibrée, on obtient aussi Q = √3 × (W1 − W2).'] },
    { num: { id: 'aron', gen: r => { const I = r.pick([8, 12, 20]), phi = r.pick([20, 30, 45, 70]); const w = AA.VIS.twoW(400, I, phi); return { q: `Charge triphasée équilibrée, 400 V, ${I} A, φ = ${phi}°. Que lit le wattmètre W2 = U I cos(30° + φ) ?`, a: w.W2, unit: 'W', tol: 0.02, sol: `W2 = 400 × ${I} × cos(${30 + phi}°) = ${AA.fmt(w.W2, 0)} W ${w.W2 < 0 ? '(négatif : φ > 60°)' : ''}` }; } } }
  ]] };
  L.nmm4l5 = { min: 8, why: "Au-delà de quelques dizaines d'ampères, on mesure à travers des transformateurs de courant — dont l'ouverture du secondaire est mortelle.", screens: [[
    { h: 'Transformateurs de courant et compteurs' },
    { p: "Un transformateur de courant (TC) donne au secondaire un courant image réduit, généralement <b>5 A</b> ou <b>1 A</b> pour le courant nominal du primaire (exemple : TC 400/5 A). Les compteurs et centrales de mesure lisent ce secondaire." },
    { warn: "<b>Jamais de secondaire ouvert</b>Un TC dont le secondaire est ouvert alors que le primaire est parcouru par un courant développe une tension très élevée (plusieurs kilovolts possibles) : danger de mort et destruction du TC. On court-circuite le secondaire (bornier de court-circuitage) avant de débrancher l'appareil de mesure." },
    { num: { id: 'tc', gen: r => { const n = r.pick([100, 200, 400, 600]), i2 = r.pick([2.1, 3.4, 4.2]); return { q: `TC <b>${n}/5 A</b>. L'ampèremètre au secondaire indique <b>${AA.fmt(i2)} A</b>. Courant primaire ?`, a: i2 * n / 5, unit: 'A', tol: 0.01, sol: `I1 = ${AA.fmt(i2)} × ${n} / 5 = ${AA.fmt(i2 * n / 5)} A` }; } } }
  ]] };

  L.nmm5l1 = { min: 9, why: "La mesure d'isolement révèle les défauts invisibles qui provoqueront demain un déclenchement ou une électrisation.", screens: [[
    { h: 'Le mégohmmètre' },
    { photos: ['megohm'] },
    { table: { head: ['Circuit', 'Tension d\'essai (continu)', 'Résistance minimale'], rows: [['TBTS, TBTP', '250 V', '0,5 MΩ'], ['Jusqu\'à 500 V (230/400 V)', '500 V', '1 MΩ'], ['Au-delà de 500 V', '1 000 V', '1 MΩ']] } },
    { p: "Valeurs de l'IEC 60364-6 pour les installations. Hors tension, consigné, équipements électroniques déconnectés ; on mesure entre conducteurs actifs reliés ensemble et la terre, puis entre conducteurs actifs." }
  ]] };
  L.nmm5l2 = { min: 9, why: "Sans une prise de terre de valeur connue, la protection des personnes contre les contacts indirects n'est pas garantie.", screens: [[
    { h: 'Mesurer la prise de terre' },
    { p: "<b>Méthode des trois piquets</b> : le terremètre injecte un courant entre la prise de terre E et un piquet de courant C placé loin (plusieurs fois la dimension de la prise, souvent 20 à 40 m). Un piquet de tension P mesure la tension ; on le place à <b>62 %</b> de la distance E-C, hors des zones d'influence." },
    { tip: "<b>Vérification</b>On déplace P de ± 10 % : si la valeur change peu, la mesure est fiable. En pratique, un contrôleur multifonction mesure aussi l'impédance de boucle phase-terre, qui permet d'estimer la terre en schéma TT." }
  ]] };
  L.nmm5l3 = { min: 8, why: "Un différentiel qui ne déclenche pas assez vite ne protège personne : il se teste, pas seulement avec le bouton.", screens: [[
    { h: 'Tester un différentiel' },
    { list: ['Le <b>bouton test</b> vérifie la mécanique, pas la sensibilité ni le temps.', 'Le <b>contrôleur</b> injecte ½ IΔn (ne doit pas déclencher), IΔn et 5 IΔn (doit déclencher, avec un temps maximal).', 'Temps maximaux (IEC 61008, type général) : 300 ms à IΔn, 40 ms à 5 IΔn. Type S (retardé) : entre 130 et 500 ms à IΔn.'] }
  ]] };
  L.nmm5l4 = { min: 7, why: "Le contrôleur multifonction réunit tous les essais de la vérification d'une installation dans un seul appareil.", screens: [[
    { h: 'Le contrôleur multifonction' },
    { photos: ['multifonction'] },
    { table: { head: ['Fonction', 'Norme IEC 61557'], rows: [['Isolement', 'partie 2'], ['Impédance de boucle', 'partie 3'], ['Continuité des conducteurs de protection (≥ 200 mA)', 'partie 4'], ['Résistance de terre', 'partie 5'], ['Dispositifs différentiels', 'partie 6'], ['Ordre des phases', 'partie 7']] } }
  ]] };
  L.nmm5l5 = { min: 7, why: "Un moteur raccordé dans le mauvais ordre des phases tourne à l'envers : une pompe se désamorce, un convoyeur recule.", screens: [[
    { h: 'Ordre des phases et VAT' },
    { photos: ['vat'] },
    { p: "Un <b>indicateur d'ordre des phases</b> se branche sur L1, L2, L3 et indique l'ordre direct ou inverse. Avant de raccorder un moteur dont le sens compte, on vérifie l'ordre du réseau. Le <b>VAT</b>, lui, ne sert qu'à vérifier l'absence de tension (voir la consignation)." }
  ]] };

  L.nmm6l1 = { min: 10, why: "L'oscilloscope montre ce qu'aucun multimètre ne voit : forme d'onde, parasites, découpage des variateurs.", screens: [[
    { h: 'L\'oscilloscope' },
    { photos: ['oscillo'] },
    { list: ['Axe vertical : <b>VOLTS/DIV</b> ; axe horizontal : <b>TIME/DIV</b>.', 'Période = nombre de divisions × TIME/DIV ; f = 1 / T.', 'Sonde ×10 : divise le signal par 10 et augmente l\'impédance d\'entrée (≈ 10 MΩ) ; l\'oscilloscope doit savoir qu\'elle est ×10.'] },
    { warn: "<b>La masse de l'oscilloscope est reliée à la terre</b>Sur un oscilloscope de table non isolé, la pince de masse de la sonde est reliée à la terre : la poser sur une phase provoque un court-circuit. Sur le réseau, on utilise une sonde différentielle ou un oscilloscope à voies isolées, de catégorie adaptée." }
  ]] };
  L.nmm6l2 = { min: 8, why: "Les charges électroniques polluent le réseau : l'analyseur mesure cette pollution pour la corriger.", screens: [[
    { h: 'Analyseur de réseau et harmoniques' },
    { p: "Un analyseur de réseau enregistre tensions, courants, puissances, facteur de puissance, énergie et <b>harmoniques</b> (courants de fréquences multiples de 50 Hz créés par les variateurs, alimentations, LED). Le <b>taux de distorsion harmonique</b> (THD) résume la déformation." },
    { real: "<b>Repère</b>La norme EN 50160 fixe la qualité de la tension fournie par le réseau public ; par exemple un THD de tension au plus égal à 8 %." }
  ]] };
  L.nmm6l3 = { min: 8, why: "La thermographie trouve les connexions qui chauffent avant qu'elles ne provoquent un incendie.", screens: [[
    { h: 'La caméra thermique' },
    { list: ['Mesurer <b>en charge</b> (idéalement plus de 40 % de la charge nominale) : sans courant, pas d\'échauffement.', 'Régler l\'<b>émissivité</b> : surfaces peintes ou oxydées ≈ 0,9 ; métal poli très faible (≈ 0,1), mesure peu fiable.', 'Comparer les trois phases d\'un même départ : un écart de quelques degrés à quelques dizaines de degrés signale une connexion défaillante.'] }
  ]] };
  L.nmm6l4 = { min: 6, why: "Vitesse, éclairement, température : d'autres grandeurs se mesurent pour régler et vérifier une installation.", screens: [[
    { h: 'Autres instruments' },
    { table: { head: ['Instrument', 'Mesure', 'Exemple d\'usage'], rows: [['Tachymètre (optique ou à contact)', 'Vitesse de rotation (tr/min)', 'Vérifier le glissement d\'un moteur'], ['Luxmètre', 'Éclairement (lux)', 'Contrôler un éclairage de bureau (500 lx recommandés par l\'EN 12464-1 pour l\'écriture et la lecture)'], ['Thermomètre à sonde', 'Température', 'Échauffement d\'un moteur, d\'une armoire'], ['Détecteur de tension sans contact', 'Présence de tension (indication)', 'Repérage rapide ; ne remplace jamais un VAT']] } }
  ]] };

  Object.assign(AA.VISMAP, {
    nmm1l1: [{ sim: 'dmm' }], nmm1l2: [{ sim: 'analog' }], nmm1l3: [{ sim: 'analog' }], nmm1l4: [{ sim: 'rms' }], nmm1l5: [{ hot: 'cat' }],
    nmm2l1: [{ sim: 'dmm' }], nmm2l2: [{ sim: 'dmm' }], nmm2l3: [{ sim: 'dmm', opts: { kind: 'ac' } }], nmm2l4: [{ sim: 'dmm', opts: { kind: 'dc' } }], nmm2l5: [{ sim: 'dmm', opts: { kind: 'dc' } }], nmm2l6: [{ sim: 'dmm' }],
    nmm3l1: [{ sim: 'rms' }], nmm3l2: [{ sim: 'analog' }], nmm3l3: [{ sim: 'analog' }], nmm3l4: [{ sim: 'analog' }],
    nmm4l1: [{ sim: 'rcd' }], nmm4l2: [{ sim: 'rcd' }], nmm4l3: [{ sim: 'wattm' }], nmm4l4: [{ sim: 'wattm' }], nmm4l5: [{ sim: 'wattm' }],
    nmm5l1: [{ sim: 'megger' }], nmm5l2: [{ sim: 'earth' }], nmm5l3: [{ sim: 'rcdtest' }], nmm5l4: [{ sim: 'rcdtest' }], nmm5l5: [{ sim: 'phaseorder' }],
    nmm6l1: [{ sim: 'oscillo' }], nmm6l2: [{ sim: 'rms' }], nmm6l3: [{ sim: 'thermocam' }], nmm6l4: [{ sim: 'phaseorder' }]
  });
})();
