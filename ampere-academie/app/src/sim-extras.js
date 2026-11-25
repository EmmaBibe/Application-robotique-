/* Ampère Académie — panneaux « Explorer les valeurs » ajoutés aux simulations qui n'avaient que des boutons.
 * Chaque panneau complète la simulation d'origine (enveloppe) sans la modifier.
 * Valeurs : ρ = 0,0225 Ω·mm²/m (NF C 15-100, chute de tension) ; différentiels IEC 61008-1 (type général) ;
 * isolement IEC 60364-6 (≥ 0,5 MΩ sous 250 V pour TBTS/TBTP, ≥ 1 MΩ sous 500 V jusqu'à 500 V, ≥ 1 MΩ sous 1 000 V au-delà). */
(function () {
  'use strict';
  const SIMS = AA.SIMS;
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const X = AA.EXTRAS = {};
  X.cableCalc = (S, tri, L, I) => { const rho = 0.0225, R = rho * L / S, n = tri ? 3 : 2; return { R, dU: AA.TECH.dU(tri, L, S, 1, I), P: n * R * I * I, J: I / S }; };
  X.rcdMax = k => k >= 5 ? 40 : k >= 2 ? 150 : k >= 1 ? 300 : null;
  X.isoMin = U => U <= 250 ? 0.5 : 1;

  const wrap = (key, build) => {
    const orig = SIMS[key]; if (!orig) return;
    SIMS[key] = (el, o) => {
      // la simulation d'origine dessine dans son propre conteneur (certaines se redessinent entièrement) ; le panneau reste à côté
      el.innerHTML = ''; const inner = document.createElement('div'); el.appendChild(inner);
      const stop = orig(inner, o);
      const box = document.createElement('div'); box.className = 'xp-panel simcard';
      box.innerHTML = '<p class="eyebrow">Explorer les valeurs</p>';
      el.appendChild(box);
      const st = {}, done = build(box, st, el) || (() => {});
      return () => { if (typeof stop === 'function') stop(); done(); };
    };
  };
  const bindAll = (box, st, fmt, cb) => box.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); cb(); }; i.addEventListener('input', u); st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); });

  /* Câbles : résistance, chute de tension, pertes */
  wrap('cable', (box, st, el) => {
    const SEC = [[2.5, false], [6, true], [1.5, false], [1.5, false]];
    box.insertAdjacentHTML('beforeend', `<div class="simctl">${sl('I', 'Courant transporté', 1, 40, 1, 16, 'A')}${sl('L', 'Longueur du câble', 1, 150, 1, 25, 'm')}</div>
      <div class="simout"><div><span>Résistance d'un conducteur R = ρ L / S</span><b class="o-r"></b></div><div><span>Chute de tension</span><b class="o-u"></b></div><div><span>Pertes dans le câble</span><b class="o-p"></b></div><div><span>Densité de courant</span><b class="o-j"></b></div></div>`);
    const upd = () => {
      const on = el.querySelector('.js-c button.on'), k = on ? +on.dataset.k : 0, [S, tri] = SEC[k], r = X.cableCalc(S, tri, st.L, st.I);
      box.querySelector('.o-r').textContent = AA.fmt(r.R * 1000, 1) + ' mΩ (' + AA.fmt(S) + ' mm²)'; box.querySelector('.o-u').innerHTML = AA.fmt(r.dU, 2) + ' %' + (r.dU > 5 ? ' <small class="bad-t">> 5 %</small>' : '');
      box.querySelector('.o-p').textContent = AA.fmt(r.P, 1) + ' W'; box.querySelector('.o-j').textContent = AA.fmt(r.J, 1) + ' A/mm²';
    };
    bindAll(box, st, {}, upd);
    el.querySelectorAll('.js-c button').forEach(b => b.addEventListener('click', () => setTimeout(upd, 0)));
    upd();
  });

  /* Tableau : temps de déclenchement et seuils différentiels */
  wrap('tableau', (box, st) => {
    box.insertAdjacentHTML('beforeend', `<div class="simctl">${sl('k', 'Courant dans un circuit (multiple du calibre du disjoncteur, courbe C)', 1, 15, 0.05, 1.5, '× In')}${sl('f', 'Courant de fuite à la terre', 0, 600, 1, 20, 'mA')}</div>
      <div class="simout"><div><span>Disjoncteur divisionnaire</span><b class="o-d"></b></div><div><span>Interrupteur différentiel 30 mA</span><b class="o-i"></b></div><div><span>AGCP 500 mA type S</span><b class="o-a"></b></div></div>`);
    const upd = () => {
      const c = AA.VIS.cbTime(st.k, 'C');
      box.querySelector('.o-d').textContent = c.zone === 'none' ? 'ne déclenche pas' : c.zone === 'mag' ? 'magnétique : < 10 ms' : c.zone === 'maybe' ? 'zone magnétique incertaine (5 à 10 In)' : 'thermique : ≈ ' + (c.t >= 60 ? AA.fmt(c.t / 60, 1) + ' min' : AA.fmt(c.t, 1) + ' s') + ' (allure)';
      box.querySelector('.o-i').textContent = st.f < 15 ? 'ne doit pas déclencher (< ½ IΔn)' : st.f < 30 ? 'peut déclencher (entre ½ IΔn et IΔn)' : 'déclenche (≤ ' + X.rcdMax(st.f / 30) + ' ms au plus)';
      box.querySelector('.o-a').textContent = st.f < 250 ? 'ne déclenche pas' : st.f < 500 ? 'peut déclencher (temporisé)' : 'déclenche, temporisé : l\'interrupteur 30 mA, plus rapide, a déjà coupé';
    };
    bindAll(box, st, { k: v => AA.fmt(v, 2) }, upd); upd();
  });

  /* Mégohmmètre : loi d'Ohm de l'isolement */
  wrap('megger', (box, st) => {
    box.insertAdjacentHTML('beforeend', `<div class="simctl">${sl('U', 'Tension d\'essai', 250, 1000, 250, 500, 'V ⎓')}${sl('lr', 'Résistance d\'isolement (échelle logarithmique)', -2, 3, 0.05, 1, '')}</div>
      <div class="simout"><div><span>Résistance</span><b class="o-r"></b></div><div><span>Courant de fuite I = U / R</span><b class="o-i"></b></div><div><span>Seuil minimal IEC 60364-6</span><b class="o-m"></b></div></div>`);
    const upd = () => {
      const R = Math.pow(10, st.lr), I = st.U / (R * 1e6), min = X.isoMin(st.U);
      box.querySelector('.o-r').textContent = R >= 1 ? AA.fmt(R, R < 10 ? 2 : 0) + ' MΩ' : AA.fmt(R * 1000, 0) + ' kΩ';
      box.querySelector('.o-i').textContent = I >= 1e-3 ? AA.fmt(I * 1000, 2) + ' mA' : AA.fmt(I * 1e6, 1) + ' µA';
      box.querySelector('.o-m').innerHTML = AA.fmt(min, 1) + ' MΩ — ' + (R >= min ? '<span class="ok-t">conforme</span>' : '<span class="bad-t">non conforme</span>');
    };
    bindAll(box, st, { lr: v => AA.fmt(Math.pow(10, v), v < 0 ? 2 : 0) + ' MΩ' }, upd); upd();
  });

  /* Test de différentiel : injection libre et temps maximaux normalisés */
  wrap('rcdtest', (box, st) => {
    box.insertAdjacentHTML('beforeend', `<div class="simctl">${sl('i', 'Courant de fuite injecté', 0, 200, 1, 30, 'mA')}${sl('n', 'Sensibilité I<sub>Δn</sub> de l\'appareil', 10, 300, 10, 30, 'mA')}</div>
      <div class="simout"><div><span>Rapport I / I<sub>Δn</sub></span><b class="o-k"></b></div><div><span>Comportement exigé (type général, IEC 61008-1)</span><b class="o-e"></b></div></div>`);
    const upd = () => {
      const k = st.i / st.n, m = X.rcdMax(k);
      box.querySelector('.o-k').textContent = AA.fmt(k, 2);
      box.querySelector('.o-e').textContent = k < 0.5 ? 'ne doit pas déclencher' : k < 1 ? 'peut déclencher ou non' : 'doit déclencher en ' + m + ' ms au plus';
    };
    bindAll(box, st, {}, upd); upd();
  });

  /* Valeur efficace : amplitude réglable */
  wrap('rms', (box, st, el) => {
    box.insertAdjacentHTML('beforeend', `<div class="simctl">${sl('A', 'Valeur crête du signal', 1, 400, 1, 325, 'V')}</div>
      <div class="simout"><div><span>Vraie valeur efficace</span><b class="o-r"></b></div><div><span>Affiché par un appareil « valeur moyenne »</span><b class="o-a"></b></div></div>`);
    const upd = () => {
      const on = el.querySelector('.js-s button.on'), r = AA.VIS.rms(on ? on.dataset.s : 'sin');
      box.querySelector('.o-r').textContent = AA.fmt(st.A * r.rms, 1) + ' V'; box.querySelector('.o-a').textContent = AA.fmt(st.A * r.avgMeter, 1) + ' V';
    };
    bindAll(box, st, {}, upd);
    el.querySelectorAll('.js-s button').forEach(b => b.addEventListener('click', () => setTimeout(upd, 0)));
    upd();
  });

  Object.assign(AA.SIMFORM, {
    cable: ['R = ρ L / S, ρ = 0,0225 Ω·mm²/m (valeur de calcul de la chute de tension)', 'Pertes = n × R × I² (n conducteurs actifs parcourus)'],
    tableau: ['Différentiel : pas de déclenchement sous ½ I<sub>Δn</sub>, déclenchement assuré à I<sub>Δn</sub>', 'Disjoncteur courbe C : magnétique entre 5 et 10 I<sub>n</sub>']
  });
})();
