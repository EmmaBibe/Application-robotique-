/* Leçons complémentaires des niveaux 0, 2 et 3 : sécurité de mesure, installations domestiques
 * (variateurs LED, prises, circuits spécialisés, volets/VMC, recharge VE, types de différentiels, projet)
 * et schémas industriels (multi-postes, à-coups, fins de course, démarrages, deux vitesses, freinages,
 * moteur monophasé, câblage d'armoire).
 * Modèles (AA.N023), vérifiés par les tests :
 *  - gradateur à découpage de phase : début de phase (conduction de α à π) U = Û √((π − α + sin 2α / 2) / (2π)) ;
 *    fin de phase (conduction de 0 à β) U = Û √((β − sin 2β / 2) / (2π))
 *  - démarrage sous tension réduite : I ∝ U, C ∝ U²
 *  - moteur à rotor bobiné : le glissement du couple maximal est proportionnel à la résistance rotorique, le couple maximal ne change pas
 *  - recharge : P = U I (monophasé), √3 U I (triphasé) ; durée ≈ énergie / (P × rendement) */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n);
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const segB = (el, c, cb) => el.querySelectorAll(c + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(c + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
  const N = AA.N023 = {};
  N.leading = (Um, a) => Um * Math.sqrt((Math.PI - a + Math.sin(2 * a) / 2) / (2 * Math.PI));
  N.trailing = (Um, b) => Um * Math.sqrt((b - Math.sin(2 * b) / 2) / (2 * Math.PI));
  N.reduced = (k, Id, Cd) => ({ I: k * Id, C: k * k * Cd });
  N.kloss = (g, gk, Cm) => g <= 0 ? 0 : 2 * Cm / (g / gk + gk / g);
  N.charge = (tri, U, I) => (tri ? Math.sqrt(3) : 1) * U * I;

  /* ---------- Variateur (gradateur) et LED ---------- */
  SIMS.dimmer = el => {
    const st = { pos: 60 }; let mode = 'trail';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-m"><button data-v="lead">Coupure en début de phase</button><button data-v="trail" class="on">Coupure en fin de phase</button></div>${sl('pos', 'Position du variateur', 5, 100, 1, 60, '%')}</div>
      <div class="simout"><div><span>Tension efficace appliquée à la lampe</span><b class="o-u"></b></div><div><span>Angle de coupure</span><b class="o-a"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Le variateur ne laisse passer qu'une partie de chaque alternance. Les lampes LED « dimmables » ont une électronique interne : elles fonctionnent en général mieux avec un variateur à coupure en fin de phase (ou universel), et une charge minimale est souvent exigée. Toujours vérifier la compatibilité indiquée par les fabricants de la lampe et du variateur, sinon : scintillement, bourdonnement, extinction à bas niveau.</p></div>`;
    bind(el, st, {});
    segB(el, '.js-m', v => { mode = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 190, (g, W, H) => {
      const Um = 230 * Math.SQRT2, cond = st.pos / 100 * Math.PI, a = Math.PI - cond, U = mode === 'lead' ? N.leading(Um, a) : N.trailing(Um, cond);
      el.querySelector('.o-u').textContent = AA.fmt(U, 0) + ' V'; el.querySelector('.o-a').textContent = AA.fmt((mode === 'lead' ? a : cond) * 180 / Math.PI, 0) + '°';
      const x0 = 10, x1 = W - 10, yc = H / 2, A = H * 0.4;
      g.strokeStyle = css('--line-2'); g.lineWidth = 1; g.beginPath(); for (let x = x0; x <= x1; x++) { const th = (x - x0) / (x1 - x0) * 4 * Math.PI, y = yc - A * Math.sin(th); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = 'rgba(240,160,40,.35)'; g.strokeStyle = css('--copper'); g.lineWidth = 2;
      g.beginPath(); for (let x = x0; x <= x1; x++) { const th = (x - x0) / (x1 - x0) * 4 * Math.PI, ph = th % Math.PI, on = mode === 'lead' ? ph >= a : ph <= cond, y = yc - (on ? A * Math.sin(th) : 0); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('gris : tension du réseau — couleur : tension transmise à la lampe', 12, H - 6);
    });
    return cv.stop;
  };

  /* ---------- Nombre de points sur un circuit de prises ---------- */
  SIMS.prises = el => {
    const st = { n: 6 }; let sec = '2.5';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-s"><button data-v="1.5">1,5 mm² – disjoncteur 16 A</button><button data-v="2.5" class="on">2,5 mm² – disjoncteur 20 A</button></div>${sl('n', 'Nombre de socles sur le circuit', 1, 16, 1, 6, '')}</div><p class="js-v" style="padding:0 16px 14px;font-size:14px"></p></div>`;
    bind(el, st, {});
    segB(el, '.js-s', v => { sec = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 110, (g, W) => {
      const max = sec === '1.5' ? 8 : 12, ok = st.n <= max;
      el.querySelector('.js-v').innerHTML = ok ? `<span class="ok-t">Conforme : au plus ${max} socles sur ce circuit.</span>` : `<span class="bad-t">Trop de socles : au plus ${max} sur un circuit ${sec.replace('.', ',')} mm². Créer un second circuit.</span>`;
      for (let k = 0; k < st.n; k++) { const x = 24 + k * Math.min(48, (W - 40) / st.n); g.fillStyle = k < max ? css('--surface-3') : css('--bad'); g.beginPath(); g.arc(x + 14, 55, 16, 0, 7); g.fill(); g.fillStyle = css('--ink-3'); g.beginPath(); g.arc(x + 9, 55, 2.5, 0, 7); g.arc(x + 19, 55, 2.5, 0, 7); g.fill(); }
    });
    return cv.stop;
  };

  /* ---------- Volet roulant ---------- */
  SIMS.volet = el => {
    let pos = 0.5, cmd = 0, last = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><button class="btn sm js-u">▲ Montée (maintenir)</button><button class="btn sm js-d">▼ Descente (maintenir)</button></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Le moteur tubulaire a deux enroulements (montée, descente) et un condensateur : la phase est envoyée sur l'un ou l'autre par l'inverseur. Ses fins de course internes coupent automatiquement en haut et en bas. L'inverseur ne doit jamais alimenter les deux sens à la fois : il est verrouillé mécaniquement (ou électriquement pour une commande centralisée).</p></div>`;
    const hold = (b, v) => { b.addEventListener('pointerdown', () => { cmd = v; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, () => { cmd = 0; })); };
    hold(el.querySelector('.js-u'), -1); hold(el.querySelector('.js-d'), 1);
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H, t) => {
      const dt = last ? Math.min(0.05, t - last) : 0; last = t; pos = Math.max(0, Math.min(1, pos + cmd * dt * 0.25));
      const atEnd = (cmd < 0 && pos <= 0) || (cmd > 0 && pos >= 1), x = W / 2 - 90, w = 180, top = 20, h = H - 40;
      g.fillStyle = 'rgba(120,180,255,.18)'; g.fillRect(x, top, w, h); g.strokeStyle = css('--ink-3'); g.strokeRect(x, top, w, h);
      g.fillStyle = css('--surface-3'); for (let k = 0; k < pos * h / 8; k++) { g.fillRect(x + 2, top + k * 8, w - 4, 6); }
      g.fillStyle = css('--ink-2'); g.font = '600 11px Segoe UI'; g.fillText(cmd === 0 ? 'moteur à l\'arrêt' : atEnd ? 'fin de course atteinte : moteur coupé' : cmd < 0 ? 'enroulement « montée » alimenté' : 'enroulement « descente » alimenté', x + w + 12, H / 2);
    });
    return cv.stop;
  };

  /* ---------- Recharge de véhicule électrique ---------- */
  SIMS.ve = el => {
    const st = { I: 32, E: 50, eta: 90 }; let tri = false;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-t"><button data-v="mono" class="on">Monophasé 230 V</button><button data-v="tri">Triphasé 400 V</button></div>${sl('I', 'Courant de charge', 6, 32, 1, 32, 'A')}${sl('E', 'Énergie à recharger', 5, 100, 1, 50, 'kWh')}${sl('eta', 'Rendement de la charge', 80, 95, 1, 90, '%')}</div>
      <div class="simout"><div><span>Puissance de charge</span><b class="o-p"></b></div><div><span>Durée de recharge</span><b class="o-t"></b></div><div><span>Section indicative</span><b class="o-s"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Exemples : 16 A mono ≈ 3,7 kW, 32 A mono ≈ 7,4 kW, 16 A tri ≈ 11 kW, 32 A tri ≈ 22 kW (le véhicule doit accepter ces puissances). Circuit dédié, section selon le courant, la longueur et le mode de pose (souvent 6 mm² pour 32 A, à vérifier par le calcul), protection différentielle 30 mA de type A associée à une détection des courants de défaut continus (6 mA) — souvent intégrée à la borne — ou type B (IEC 60364-7-722 / NF C 15-100). En France, l'installation d'un point de charge de plus de 3,7 kW doit être réalisée par un installateur qualifié IRVE.</p></div>`;
    bind(el, st, {});
    segB(el, '.js-t', v => { tri = v === 'tri'; });
    const cv = AA.canvas(el.querySelector('.simview'), 110, (g, W, H, t) => {
      const P = N.charge(tri, tri ? 400 : 230, st.I), h = st.E / (P / 1000 * st.eta / 100);
      el.querySelector('.o-p').textContent = AA.fmt(P / 1000, 1) + ' kW'; el.querySelector('.o-t').textContent = Math.floor(h) + ' h ' + String(Math.round((h % 1) * 60)).padStart(2, '0'); el.querySelector('.o-s').textContent = st.I <= 16 ? '2,5 mm² (courtes longueurs)' : st.I <= 25 ? '4 à 6 mm²' : '6 mm² ou plus';
      const lvl = (t * 0.1) % 1; g.strokeStyle = css('--ink-3'); g.lineWidth = 2; g.strokeRect(W / 2 - 80, 30, 160, 50); g.fillRect(W / 2 + 80, 45, 8, 20);
      g.fillStyle = css('--ok'); g.fillRect(W / 2 - 76, 34, 152 * lvl, 42);
    });
    return cv.stop;
  };

  /* ---------- Démarrage sous tension réduite (résistances statoriques) ---------- */
  SIMS.statorique = el => {
    const st = { k: 70, Id: 6, Cd: 2 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('k', 'Tension au démarrage (résistances en série)', 40, 100, 1, 70, '% de U')}${sl('Id', 'Courant de démarrage direct (plaque)', 4, 8, 0.1, 6, '× In')}${sl('Cd', 'Couple de démarrage direct (plaque)', 1, 3, 0.1, 2, '× Cn')}</div>
      <div class="simout"><div><span>Courant au démarrage I = k × I<sub>d</sub></span><b class="o-i"></b></div><div><span>Couple au démarrage C = k² × C<sub>d</sub></span><b class="o-c"></b></div></div>
      <p class="js-v" style="padding:0 16px 14px;font-size:14px"></p></div>`;
    bind(el, st, { Id: v => AA.fmt(v, 1), Cd: v => AA.fmt(v, 1) });
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W) => {
      const r = N.reduced(st.k / 100, st.Id, st.Cd);
      el.querySelector('.o-i').textContent = AA.fmt(r.I, 2) + ' × In'; el.querySelector('.o-c').textContent = AA.fmt(r.C, 2) + ' × Cn';
      el.querySelector('.js-v').innerHTML = r.C < 0.5 ? '<span class="bad-t">Couple très faible : le moteur ne démarre qu\'à vide ou presque. On réserve ce procédé aux machines à faible couple résistant au démarrage (ventilateurs, pompes centrifuges).</span>' : '<span class="muted">Le courant baisse comme la tension, mais le couple baisse comme son carré : c\'est le prix à payer. Après quelques secondes, un contacteur court-circuite les résistances.</span>';
      const bar = (y, v, max, lbl, col) => { g.fillStyle = css('--surface-3'); g.fillRect(150, y, W - 170, 18); g.fillStyle = css(col); g.fillRect(150, y, (W - 170) * Math.min(1, v / max), 18); g.fillStyle = css('--ink-2'); g.font = '500 11px Segoe UI'; g.fillText(lbl, 10, y + 13); };
      bar(20, st.Id, 8, 'courant direct', '--line-2'); bar(44, r.I, 8, 'courant réduit', '--copper'); bar(72, st.Cd, 3, 'couple direct', '--line-2'); bar(96, r.C, 3, 'couple réduit', '--teal');
    });
    return cv.stop;
  };

  /* ---------- Démarrage rotorique : résistance du rotor ---------- */
  SIMS.rotorique = el => {
    const st = { r: 1, load: 1 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('r', 'Résistance rotorique (multiple de la résistance propre du rotor)', 1, 12, 0.5, 1, '×')}${sl('load', 'Couple résistant', 0.2, 2, 0.1, 1, '× Cn')}</div>
      <div class="simout"><div><span>Couple au démarrage</span><b class="o-c"></b></div><div><span>Glissement du couple maximal</span><b class="o-g"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Moteur à rotor bobiné (bagues et balais) : des résistances extérieures en série avec le rotor déplacent la courbe vers les basses vitesses. Le couple maximal reste le même, mais il apparaît plus tôt : fort couple au démarrage avec un courant réduit. On élimine ensuite les résistances par crans. Modèle de Kloss, couple maximal 2,5 C<sub>n</sub>, g<sub>k</sub> = 0,12 sans résistance.</p></div>`;
    bind(el, st, { r: v => AA.fmt(v, 1), load: v => AA.fmt(v, 1) });
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H) => {
      const Cm = 2.5, gk = Math.min(1.5, 0.12 * st.r), C0 = N.kloss(1, gk, Cm);
      el.querySelector('.o-c').textContent = AA.fmt(C0, 2) + ' × Cn' + (C0 < st.load ? ' — ne démarre pas' : ''); el.querySelector('.o-g').textContent = AA.fmt(gk, 2);
      const x0 = 40, x1 = W - 12, y0 = H - 24, y1 = 12, X = s => x0 + (1 - s) * (x1 - x0), Y = c => y0 - c / 3 * (y0 - y1);
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; [0, 1, 2, 3].forEach(c => { g.beginPath(); g.moveTo(x0, Y(c)); g.lineTo(x1, Y(c)); g.stroke(); g.fillText(c + ' Cn', 4, Y(c) + 4); }); g.fillText('arrêt', x0, y0 + 13); g.fillText('vitesse de synchronisme', x1 - 120, y0 + 13);
      g.strokeStyle = css('--line-2'); g.lineWidth = 1.4; g.beginPath(); for (let s = 1; s >= 0.002; s -= 0.005) { const c = N.kloss(s, 0.12, Cm); s === 1 ? g.moveTo(X(s), Y(c)) : g.lineTo(X(s), Y(c)); } g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath(); for (let s = 1; s >= 0.002; s -= 0.005) { const c = N.kloss(s, gk, Cm); s === 1 ? g.moveTo(X(s), Y(c)) : g.lineTo(X(s), Y(c)); } g.stroke();
      g.strokeStyle = css('--teal'); g.beginPath(); g.moveTo(x0, Y(st.load)); g.lineTo(x1, Y(st.load)); g.stroke();
    });
    return cv.stop;
  };

  /* ---------- Moteurs à deux vitesses ---------- */
  SIMS.deuxv = (el, o) => {
    let kind = (o && o.kind) || 'dahl', sp = 'pv';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-k"><button data-v="dahl" class="${kind === 'dahl' ? 'on' : ''}">Dahlander (un enroulement)</button><button data-v="sep" class="${kind === 'sep' ? 'on' : ''}">Deux enroulements séparés</button></div><div class="seg js-s"><button data-v="pv" class="on">Petite vitesse</button><button data-v="gv">Grande vitesse</button></div></div><div class="simview"></div><p class="js-d" style="padding:0 16px 14px;font-size:13.5px"></p></div>`;
    segB(el, '.js-k', v => { kind = v; }); segB(el, '.js-s', v => { sp = v; });
    let ang = 0, last = 0;
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const p = kind === 'dahl' ? (sp === 'pv' ? 2 : 1) : (sp === 'pv' ? 3 : 2), ns = 3000 / p;
      const dt = last ? Math.min(0.05, t - last) : 0; last = t; ang += ns / 60 * dt * 0.3;
      el.querySelector('.js-d').innerHTML = kind === 'dahl'
        ? `Couplage <b>${sp === 'pv' ? 'triangle série' : 'double étoile parallèle'}</b> : ${2 * p} pôles, n<sub>s</sub> = ${ns} tr/min. Le Dahlander donne toujours un rapport de vitesses de 2 (ici 1 500 / 3 000 tr/min). Couplage triangle / double étoile : couple à peu près constant. Trois contacteurs : KM1 en petite vitesse ; KM2 et KM3 (qui réalise le point étoile) en grande vitesse, verrouillés avec KM1.`
        : `Enroulement <b>${sp === 'pv' ? 'petite vitesse (6 pôles)' : 'grande vitesse (4 pôles)'}</b> : n<sub>s</sub> = ${ns} tr/min. Deux enroulements indépendants permettent n'importe quel rapport (ici 1 000 / 1 500 tr/min) ; deux contacteurs verrouillés, un relais thermique par enroulement.`;
      const cx = 110, cy = H / 2, R = 70; g.save(); g.translate(cx, cy); g.rotate(ang * 2 * Math.PI);
      for (let k = 0; k < 2 * p; k++) { const a = k / (2 * p) * 2 * Math.PI; g.fillStyle = k % 2 ? '#1565c0' : '#c62828'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a, a + 2 * Math.PI / (2 * p)); g.fill(); }
      g.restore();
      g.fillStyle = css('--ink'); g.font = '700 26px Bahnschrift'; g.fillText(ns + ' tr/min', 220, cy - 4); g.font = '500 13px Segoe UI'; g.fillStyle = css('--ink-3'); g.fillText('vitesse de synchronisme, ' + (2 * p) + ' pôles', 220, cy + 20);
    });
    return cv.stop;
  };

  /* ---------- Freinage : roue libre, contre-courant, injection de courant continu ---------- */
  SIMS.freins = el => {
    const st = { cut: 5 }; let mode = 'cc';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-m"><button data-v="libre">Roue libre</button><button data-v="contre">Contre-courant</button><button data-v="cc" class="on">Injection de courant continu</button></div>${sl('cut', 'Coupure du freinage à cette vitesse (relais de vitesse ou temporisation)', -30, 30, 1, 5, '%')}</div><div class="simview"></div><p class="js-d" style="padding:0 16px 14px;font-size:13.5px"></p></div>`;
    bind(el, st, {});
    segB(el, '.js-m', v => { mode = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H) => {
      const x0 = 40, x1 = W - 12, yz = H / 2 + 20, A = H / 2 - 30, X = t => x0 + t / 10 * (x1 - x0), Y = v => yz - v / 100 * A;
      const curve = []; let v = 100, braking = mode !== 'libre';
      for (let t = 0; t <= 10; t += 0.02) {
        if (mode === 'libre') v = 100 * Math.exp(-t / 4);
        else if (mode === 'contre') { if (braking) { v -= 60 * 0.02; if (v <= st.cut) braking = false; } else v = v > 0 ? Math.max(0, v - 0.5) : Math.min(0, v + 0.5); } // après la coupure : roue libre vers l'arrêt
        else { if (v > 0) v = Math.max(0, v - 45 * 0.02 * (0.4 + 0.6 * v / 100)); }
        curve.push([t, v]);
      }
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, yz); g.lineTo(x1, yz); g.stroke(); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText('vitesse 0', 2, yz + 4); g.fillText('100 %', 6, Y(100) + 4); g.fillText('temps (s)', x1 - 50, yz + 14);
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath(); curve.forEach(([t, vv], i) => i ? g.lineTo(X(t), Y(vv)) : g.moveTo(X(t), Y(vv))); g.stroke();
      const D = { libre: 'Sans freinage, le moteur s\'arrête lentement, entraîné par l\'inertie et freiné seulement par les frottements.', contre: `On inverse deux phases à pleine vitesse : le champ tourne en sens inverse et freine très énergiquement (courant très élevé, échauffement). Il faut couper au voisinage de l'arrêt, avec un relais de vitesse (contact « tachymétrique »)${st.cut < 0 ? ' : ici la coupure est réglée trop tard, le moteur repart en sens inverse !' : '.'}`, cc: 'On coupe le réseau puis on injecte un courant continu dans deux phases du stator : le champ fixe freine le rotor jusqu\'à l\'arrêt, sans risque de redémarrage en sens inverse. L\'injection est limitée dans le temps (temporisation). Ce n\'est pas un frein de maintien : à l\'arrêt, rien ne retient la charge.' };
      el.querySelector('.js-d').textContent = D[mode];
    });
    return cv.stop;
  };

  /* ---------- Moteur monophasé à condensateur ---------- */
  SIMS.mono = el => {
    const st = { C: 25 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('C', 'Condensateur en série avec l\'enroulement auxiliaire', 0, 100, 1, 25, 'µF')}</div>
      <div class="simout"><div><span>Déphasage entre les courants des deux enroulements</span><b class="o-a"></b></div><div><span>Champ créé</span><b class="o-f"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Exemple d'enroulements à 50 Hz : principal R = 10 Ω, X = 15 Ω ; auxiliaire R = 18 Ω, X = 14 Ω (valeurs d'illustration). Un seul enroulement ne crée qu'un champ alternatif : le moteur ne démarre pas seul. Le condensateur décale le courant de l'auxiliaire : proche de 90°, les deux champs composent un champ tournant. La valeur réelle du condensateur est indiquée par le fabricant du moteur.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H, t) => {
      const w = 2 * Math.PI * 50, pm = Math.atan2(15, 10), Xc = st.C > 0 ? 1 / (w * st.C * 1e-6) : Infinity, pa = st.C > 0 ? Math.atan2(14 - Xc, 18) : null;
      const d = pa == null ? null : (pm - pa) * 180 / Math.PI;
      el.querySelector('.o-a').textContent = d == null ? 'enroulement auxiliaire ouvert' : AA.fmt(d, 0) + '°'; el.querySelector('.o-f').textContent = d == null ? 'alternatif : pas de démarrage' : Math.abs(d - 90) < 20 ? 'presque circulaire : bon démarrage' : d < 40 ? 'très elliptique : couple faible' : 'elliptique';
      const cx = 100, cy = H / 2, R = 60; g.strokeStyle = css('--line'); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      const dd = (d || 0) * Math.PI / 180; g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath();
      for (let k = 0; k <= 100; k++) { const th = k / 100 * 2 * Math.PI, bx = Math.cos(th), by = d == null ? 0 : Math.cos(th - dd); k ? g.lineTo(cx + bx * R, cy - by * R) : g.moveTo(cx + bx * R, cy - by * R); } g.stroke();
      const th = t * 3, bx = Math.cos(th), by = d == null ? 0 : Math.cos(th - dd); g.fillStyle = css('--teal'); g.beginPath(); g.arc(cx + bx * R, cy - by * R, 6, 0, 7); g.fill();
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('trajectoire de l\'extrémité du champ résultant', 190, cy);
    });
    return cv.stop;
  };

  /* ---------- Devis d'un petit logement ---------- */
  const ITEMS = [['Tableau 2 rangées équipé (disjoncteurs, interrupteurs différentiels)', 1, 420], ['Disjoncteurs supplémentaires', 4, 14], ['Prises 16 A', 18, 9], ['Points lumineux (DCL) et interrupteurs', 9, 16], ['Câble 3G1,5 mm² (mètres)', 120, 0.8], ['Câble 3G2,5 mm² (mètres)', 140, 1.2], ['Conduits ICTA (mètres)', 200, 0.6], ['Boîtes d\'encastrement', 30, 1.1]];
  SIMS.devis = el => {
    const st = { h: 32, rate: 45, marge: 15 };
    el.innerHTML = `<div class="simcard"><div class="amdec-wrap"><table class="amdec"><thead><tr><th>Désignation</th><th>Quantité</th><th>Prix unitaire (€ HT)</th><th>Total</th></tr></thead><tbody class="js-b"></tbody></table></div>
      <div class="simctl">${sl('h', 'Main-d\'œuvre', 4, 120, 1, 32, 'h')}${sl('rate', 'Taux horaire', 25, 90, 1, 45, '€/h')}${sl('marge', 'Marge sur le matériel', 0, 40, 1, 15, '%')}</div>
      <div class="simout"><div><span>Matériel (avec marge)</span><b class="o-m"></b></div><div><span>Main-d'œuvre</span><b class="o-w"></b></div><div><span>Total HT</span><b class="o-t"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Prix d'exemple, sans valeur commerciale : ils varient selon les fournisseurs, les gammes et les années. Change les quantités pour voir l'effet sur le devis.</p></div>`;
    const qty = ITEMS.map(i => i[1]);
    const upd = () => {
      let mat = 0; el.querySelector('.js-b').innerHTML = ITEMS.map((it, k) => { const tot = qty[k] * it[2]; mat += tot; return `<tr><td>${it[0]}</td><td><input type="number" min="0" value="${qty[k]}" data-k="${k}"></td><td>${AA.fmt(it[2], 2)}</td><td>${AA.fmt(tot, 2)} €</td></tr>`; }).join('');
      el.querySelectorAll('.js-b input').forEach(i => i.onchange = () => { qty[+i.dataset.k] = Math.max(0, +i.value || 0); upd(); });
      const m = mat * (1 + st.marge / 100), w = st.h * st.rate;
      el.querySelector('.o-m').textContent = AA.fmt(m, 0) + ' €'; el.querySelector('.o-w').textContent = AA.fmt(w, 0) + ' €'; el.querySelector('.o-t').textContent = AA.fmt(m + w, 0) + ' €';
    };
    el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = AA.fmt(st[k]); upd(); }; i.addEventListener('input', u); u(); });
  };

  /* ---------- Choix ---------- */
  const OUT = { title: 'Outillage isolé (IEC 60900)', items: [['iso', 'Tournevis isolé marqué du double triangle et « 1000 V »', ''], ['vat', 'Vérificateur d\'absence de tension (VAT) adapté', ''], ['ruban', 'Tournevis ordinaire entouré de ruban adhésif', ''], ['abime', 'Pince isolée dont la gaine est fendue', ''], ['gants', 'Gants isolants de la classe adaptée, vérifiés avant usage', ''], ['test', 'Tournevis testeur (« tournevis à néon ») pour vérifier l\'absence de tension', '']],
    cases: [{ q: 'Sélectionne le matériel acceptable pour un travail au voisinage de pièces nues sous tension en basse tension (par une personne habilitée).', need: ['iso', 'vat', 'gants'], no: ['ruban', 'abime', 'test'], why: 'Seul l\'outillage conforme à l\'IEC 60900 (double triangle, 1000 V) en bon état protège. Un tournevis testeur n\'est pas un VAT : il ne prouve jamais l\'absence de tension. Un outil abîmé est retiré immédiatement.' }] };
  const DDR = { title: 'Quel type de dispositif différentiel ?', items: [['AC', 'Type AC', 'courants alternatifs'], ['A', 'Type A', '+ courants redressés'], ['F', 'Type F', '+ fréquences mixtes'], ['B', 'Type B', '+ courants continus lisses']],
    cases: [
      { q: 'Circuits d\'éclairage et de prises d\'un logement (sans appareil électronique particulier) : quel type minimum ?', need: ['AC'], no: ['B'], why: 'Le type AC détecte les courants de défaut alternatifs sinusoïdaux. La NF C 15-100 impose cependant un type A pour certains circuits (plaque de cuisson, lave-linge, recharge de véhicule).' },
      { q: 'Circuit de la plaque de cuisson à induction ou du lave-linge : quel type au minimum la NF C 15-100 impose-t-elle ?', need: ['A'], no: ['AC'], why: 'Leur électronique peut produire des courants de défaut redressés (composante continue pulsée) : le type A les détecte, pas le type AC.' },
      { q: 'Appareil monophasé avec variateur de vitesse intégré (pompe à chaleur, machine à laver à moteur à variation électronique) recommandé par le fabricant :', need: ['F'], no: ['AC'], why: 'Le type F détecte en plus les courants de défaut à fréquences mixtes produits par les variateurs monophasés.' },
      { q: 'Variateur de vitesse triphasé, ou borne de recharge sans détection intégrée des courants continus :', need: ['B'], no: ['AC'], why: 'Un variateur triphasé peut produire des courants de défaut continus lisses qui « aveuglent » les types AC et A : seul le type B les détecte.' }
    ] };
  const CAB = { title: 'Règles de câblage d\'armoire : bonnes pratiques', items: [['emb', 'Embouts sertis sur les conducteurs souples', ''], ['rep', 'Repère à chaque extrémité, identique au schéma', ''], ['coul', 'Couleurs selon l\'IEC 60204-1 (PE vert-jaune, neutre bleu clair…)', ''], ['cpl', 'Serrage au couple indiqué par le fabricant', ''], ['res', 'Réserve de place et de bornes pour les évolutions', ''], ['deux', 'Deux conducteurs de sections différentes sous la même borne', ''], ['tend', 'Fils tendus d\'une borne à l\'autre en travers de l\'armoire', ''], ['pe', 'PE en boucle d\'un appareil à l\'autre, en série', '']],
    cases: [{ q: 'Sélectionne les règles d\'un câblage propre et maintenable.', need: ['emb', 'rep', 'coul', 'cpl', 'res'], no: ['deux', 'tend', 'pe'], why: 'Le câblage se lit et se dépanne : chemins dans les goulottes, repères, couleurs normalisées, serrages corrects. Chaque masse est reliée individuellement au circuit de protection : la déconnexion d\'un appareil ne doit jamais interrompre le PE des autres.' }] };
  SIMS.outils = el => SIMS.choose(el, OUT);
  SIMS.ddrtype = el => SIMS.choose(el, DDR);
  SIMS.cabrules = el => SIMS.choose(el, CAB);
  Object.assign(AA.VISDATA.ORDER, {
    cablage: { title: 'Du schéma au câblage : remets les étapes dans l\'ordre', steps: [['Lire le dossier : folios, nomenclature, plan d\'implantation', 'On ne câble pas ce qu\'on n\'a pas compris.'], ['Monter les rails, goulottes et appareils selon l\'implantation', 'La mécanique d\'abord.'], ['Câbler la puissance, puis la commande, folio par folio', 'Une méthode constante évite les oublis.'], ['Pointer chaque fil sur le schéma au fur et à mesure (surligneur)', 'Le schéma pointé prouve que tout est câblé.'], ['Contrôler : serrages, continuité, isolement, repères', 'Hors tension, avant tout essai.'], ['Essais à vide, puis en charge', 'Mise sous tension progressive, sécurités d\'abord.']] },
    essais: { title: 'Essais d\'un coffret de démarrage : quel ordre ?', steps: [['Hors tension : contrôle visuel, serrages, continuité du PE, isolement', ''], ['Moteur déconnecté : mise sous tension du circuit de commande seul', 'On vérifie la logique sans risque mécanique.'], ['Essai de chaque fonction : marche, arrêt, arrêt d\'urgence, verrouillages, défaut thermique', 'Sécurités en premier.'], ['Raccordement du moteur, essai à vide : sens de rotation, courant à vide', 'Inverser deux phases si le sens est faux.'], ['Essai en charge : courant mesuré, réglage du relais thermique au courant nominal du moteur', ''], ['Compte rendu d\'essais et dossier à jour', '']] },
    projlog: { title: 'Projet de logement : quel ordre de travail ?', steps: [['Recueillir le besoin et le plan du logement', 'Pièces, usages, équipements prévus.'], ['Placer les points (prises, éclairages, circuits spécialisés) selon la NF C 15-100', ''], ['Répartir en circuits et choisir sections et protections', ''], ['Dessiner le schéma unifilaire du tableau', ''], ['Établir la liste du matériel et le devis', ''], ['Réaliser, puis autocontrôle avant mise sous tension', '']] }
  });

  Object.assign(AA.SIMFORM, {
    dimmer: ['Début de phase : U = Û √((π − α + sin 2α / 2) / 2π)', 'Fin de phase : U = Û √((β − sin 2β / 2) / 2π)'],
    ve: ['Monophasé : P = U × I ; triphasé : P = √3 × U × I', 'Durée ≈ énergie à recharger / (P × rendement)'],
    statorique: ['I<sub>démarrage</sub> = k × I<sub>d</sub>', 'C<sub>démarrage</sub> = k² × C<sub>d</sub>  (k = tension réduite / tension nominale)'],
    rotorique: ['C = 2 C<sub>max</sub> / (g/g<sub>k</sub> + g<sub>k</sub>/g)', 'g<sub>k</sub> ∝ résistance rotorique ; C<sub>max</sub> inchangé'],
    deuxv: ['n<sub>s</sub> = 60 f / p', 'Dahlander : rapport des vitesses = 2'],
    mono: ['X<sub>C</sub> = 1 / (C ω)', 'Déphasage auxiliaire : φ<sub>a</sub> = arctan((X<sub>a</sub> − X<sub>C</sub>) / R<sub>a</sub>)'],
    devis: ['Total HT = Σ quantité × prix × (1 + marge) + heures × taux horaire']
  });

  /* ================= Leçons ================= */
  L.n0m4l2 = { min: 9, why: "Une tension se vérifie toujours avec la bonne méthode : c'est la dernière barrière avant le contact.", screens: [[
    { h: 'Mesurer une tension sans risque' },
    { list: ['Utiliser un appareil adapté et en bon état : catégorie de mesure (CAT II, III, IV) et tension adaptées au lieu de mesure, cordons protégés.', 'Pour vérifier l\'absence de tension avant d\'intervenir : un <b>VAT</b> (vérificateur d\'absence de tension), utilisé selon la procédure complète, jamais un multimètre réglé à la hâte ni un tournevis testeur.', 'Les mesures sous tension et les vérifications d\'absence de tension sont réservées aux personnes habilitées, avec leurs équipements de protection.'] },
    { warn: "Tant que l'absence de tension n'a pas été vérifiée, on considère que l'installation est sous tension." }
  ]] };
  L.n0m4l3 = { min: 8, why: "Un outil isolé conforme et en bon état protège ; un outil bricolé donne une fausse sécurité.", screens: [[
    { h: 'Outillage isolé 1000 V' },
    { list: ['Norme IEC 60900 : outils à main pour travaux sous tension jusqu\'à 1 000 V en alternatif et 1 500 V en continu, marqués du symbole du double triangle.', '<b>Outil isolé</b> : en métal recouvert d\'isolant. <b>Outil isolant</b> : fait principalement de matière isolante.', 'Contrôle visuel avant chaque usage : une gaine fendue, brûlée ou décollée rend l\'outil inutilisable.', 'L\'outillage isolé complète la consignation, il ne la remplace pas.'] }
  ]] };
  L.n2m1l6 = { min: 9, why: "Un variateur mal assorti à des LED les fait clignoter, bourdonner ou s'éteindre.", screens: [[
    { h: 'Variateur et éclairage LED' },
    { p: "Un variateur (gradateur) découpe chaque alternance de la tension. En début de phase, il bloque le début de chaque alternance ; en fin de phase, il en coupe la fin. Les lampes LED intègrent une alimentation électronique : il faut des lampes « dimmables » et un variateur compatible, en respectant la charge minimale et maximale indiquées." }
  ]] };
  L.n2m2l1 = { min: 10, why: "Les prises sont les circuits les plus utilisés : bien les répartir évite les surcharges et les déclenchements.", screens: [[
    { h: 'Prises 16 A : nombre, section, protection' },
    { table: { head: ['Section', 'Protection', 'Nombre maximal de socles par circuit'], rows: [['1,5 mm²', 'Disjoncteur 16 A', '8'], ['2,5 mm²', 'Disjoncteur 20 A', '12']] } },
    { p: "La NF C 15-100 fixe aussi un nombre minimal de socles par pièce (par exemple, dans la cuisine, des socles au-dessus du plan de travail) et des hauteurs de pose. Les règles évoluent avec les amendements : on travaille toujours avec l'édition en vigueur." }
  ]] };
  L.n2m2l2 = { min: 10, why: "Un gros appareil sur un circuit de prises partagé, c'est la garantie de déclenchements et d'échauffements.", screens: [[
    { h: 'Circuits spécialisés : four, lave-linge, plaque' },
    { table: { head: ['Appareil', 'Circuit', 'Section (cuivre)', 'Protection'], rows: [['Plaque de cuisson (monophasé)', 'Dédié', '6 mm²', 'Disjoncteur 32 A'], ['Four', 'Dédié', '2,5 mm²', 'Disjoncteur 20 A'], ['Lave-linge, lave-vaisselle, sèche-linge', 'Un circuit dédié par appareil', '2,5 mm²', 'Disjoncteur 20 A'], ['Chauffe-eau électrique', 'Dédié', '2,5 mm²', 'Disjoncteur 20 A']] } },
    { p: "Valeurs courantes de la NF C 15-100 pour un logement. Les circuits du lave-linge et de la plaque de cuisson sont protégés par un dispositif différentiel 30 mA de type A." }
  ]] };
  L.n2m2l3 = { min: 9, why: "Volets roulants et ventilation sont des moteurs : leur commande et leur protection suivent des règles précises.", screens: [[
    { h: 'Volets roulants et VMC' },
    { list: ['<b>Volets roulants</b> : circuit dédié 1,5 mm² protégé par disjoncteur 16 A ; inverseur montée / descente à verrouillage ; fins de course réglées dans le moteur.', '<b>VMC</b> : circuit dédié 1,5 mm² protégé par un disjoncteur 2 A ; commande de grande vitesse en cuisine si le modèle le prévoit.'] }
  ]] };
  L.n2m2l4 = { min: 11, why: "La recharge d'un véhicule électrique est une charge forte et longue : l'installation doit être pensée pour.", screens: [[
    { h: 'Borne de recharge de véhicule électrique' },
    { list: ['Circuit dédié, protection adaptée au courant de charge, section calculée (longueur, pose).', 'Protection différentielle 30 mA avec détection des courants de défaut continus (type A + détection 6 mA, ou type B).', 'Une borne (mode 3) dialogue avec le véhicule et peut moduler le courant ; une prise domestique n\'est pas faite pour des charges longues à fort courant.', 'En France, au-delà de 3,7 kW, l\'installation doit être réalisée par un installateur qualifié IRVE.'] },
    { num: { id: 've', gen: r => { const I = r.pick([16, 20, 32]), E = r.pick([30, 40, 60]); const P = 230 * I; return { q: `Recharge en monophasé 230 V à <b>${I} A</b> d'une batterie qui a besoin de <b>${E} kWh</b> (rendement 90 %). Durée en heures ?`, a: E / (P / 1000 * 0.9), unit: 'h', tol: 0.02, sol: `P = 230 × ${I} = ${AA.fmt(P / 1000, 2)} kW ; t = ${E} / (${AA.fmt(P / 1000, 2)} × 0,9) = ${AA.fmt(E / (P / 1000 * 0.9), 1)} h` }; } } }
  ]] };
  L.n2m3l5 = { min: 10, why: "Un différentiel du mauvais type peut ne pas voir le défaut qu'il est censé détecter.", screens: [[
    { h: 'Types AC, A, F, B' },
    { table: { head: ['Type', 'Détecte', 'Usages typiques'], rows: [['AC', 'Courants de défaut alternatifs sinusoïdaux', 'Circuits courants d\'éclairage et de prises'], ['A', 'AC + courants redressés (continus pulsés)', 'Plaque de cuisson, lave-linge, recharge VE (avec détection 6 mA)'], ['F', 'A + courants à fréquences mixtes', 'Appareils monophasés à variateur intégré'], ['B', 'F + courants continus lisses', 'Variateurs triphasés, bornes sans détection continue intégrée']] } }
  ]] };
  L.n2m4l3 = { min: 8, why: "Un tableau bien raccordé et repéré se contrôle et se dépanne en quelques minutes.", screens: [[
    { h: 'Peigne, bornier, repérage' },
    { list: ['Le <b>peigne</b> d\'alimentation relie les appareils d\'une rangée sans multiplier les fils ; on ne coupe pas ses dents à la pince, on utilise la bonne longueur.', 'Le <b>bornier</b> de terre et les borniers de neutre reçoivent chaque conducteur dans sa propre borne.', 'Chaque disjoncteur porte une étiquette indiquant le circuit qu\'il protège (« prises chambre 1 », « lave-linge »…).'] }
  ]] };
  L.n2m5l1 = { min: 9, why: "Un projet de logement commence par le besoin du client, pas par le catalogue.", screens: [[
    { h: 'Cahier des charges et plan' },
    { p: "Avec le client et le plan : usage de chaque pièce, appareils prévus (cuisson, électroménager, chauffage, recharge), confort souhaité (volets, commandes, éclairage). On place ensuite les points sur le plan en respectant les minima et les volumes (salle de bains) de la NF C 15-100." }
  ]] };
  L.n2m5l2 = { min: 10, why: "Le schéma unifilaire est la carte d'identité du tableau.", screens: [[
    { h: 'Schéma unifilaire complet' },
    { p: "Chaque circuit apparaît avec sa protection, sa section, son interrupteur différentiel de rattachement et son usage. Les circuits sont répartis entre les interrupteurs différentiels pour qu'un déclenchement ne prive pas tout le logement (éclairage et prises d'une même pièce sur des différentiels différents)." }
  ]] };
  L.n2m5l3 = { min: 9, why: "Un devis juste protège à la fois le client et l'entreprise.", screens: [[
    { h: 'Liste du matériel et chiffrage' },
    { p: "À partir du plan et du schéma : tableau et appareils, appareillage (prises, interrupteurs), câbles et conduits (longueurs mesurées sur le plan, avec une marge), petites fournitures, puis main-d'œuvre. Le devis précise les quantités, les prix unitaires, les totaux, la TVA applicable et la durée de validité." }
  ]] };
  L.n2m5l4 = { min: 9, why: "L'autocontrôle trouve les erreurs avant qu'elles ne deviennent dangereuses.", screens: [[
    { h: 'Autocontrôle avant mise sous tension' },
    { p: "Hors tension : continuité des conducteurs de protection, résistance d'isolement, mesure de la prise de terre. Sous tension : essai des différentiels, polarité, fonctionnement de chaque circuit. En France, une installation neuve fait l'objet d'une attestation de conformité visée par le Consuel avant la mise en service par le distributeur." }
  ]] };
  L.n3m2l2 = { min: 10, why: "Une grande machine se commande souvent depuis plusieurs endroits : la règle série/parallèle est universelle.", screens: [[
    { h: 'Commande depuis plusieurs postes' },
    { p: "Arrêts (contacts à ouverture) en série : n'importe lequel coupe. Marches (contacts à fermeture) en parallèle : n'importe laquelle démarre." },
    { circuit: 'multipostes', guide: true, tasks: [
      { t: 'Ferme Q1 puis démarre le moteur depuis le poste 2 (S4)', ok: (s, v) => s.coil.KM1 && v.lastAct === 'S4' },
      { t: 'Arrête-le depuis le poste 2 (S3)', ok: (s, v) => !s.coil.KM1 && v.lastAct === 'S3' },
      { t: 'Redémarre depuis le poste 1 (S2), arrête depuis le poste 1 (S1)', ok: (s, v) => !s.coil.KM1 && v.lastAct === 'S1' }
    ] }
  ]] };
  L.n3m2l3 = { min: 10, why: "Positionner une machine au millimètre demande un moteur qui s'arrête dès qu'on lâche le bouton.", screens: [[
    { h: 'Marche par à-coups' },
    { p: "Le sélecteur SA1, en série avec le contact d'auto-maintien, choisit le mode : fermé, marche continue ; ouvert, à-coups." },
    { circuit: 'acoups', guide: true, tasks: [
      { t: 'Ferme Q1, laisse SA1 ouvert et appuie sur S2 : le moteur tourne seulement pendant l\'appui', ok: (s, v) => v.lastAct === 'S2' && s.byId.Q1.st.on && !s.coil.KM1 && !s.byId.SA1.st.on },
      { t: 'Ferme SA1, puis appuie brièvement sur S2 : le moteur reste en marche', ok: (s) => s.coil.KM1 && s.byId.SA1.st.on },
      { t: 'Arrête avec S1', ok: (s, v) => !s.coil.KM1 && v.lastAct === 'S1' }
    ] }
  ]] };
  L.n3m2l6 = { min: 12, why: "Les fins de course font travailler une machine seule : un chariot, une table, une porte.", screens: [[
    { h: 'Fins de course et va-et-vient automatique' },
    { p: "Chaque fin de course porte deux contacts actionnés par le même galet : l'un arrête le sens en cours, l'autre lance le sens opposé. Les verrouillages électriques KM1 / KM2 restent indispensables." },
    { circuit: 'fdc', guide: true, tasks: [
      { t: 'Ferme Q1 et lance le chariot vers l\'avant (S2)', ok: (s) => s.coil.KM1 },
      { t: 'Simule l\'arrivée en fin de course avant (clique SQ1) : le chariot repart en arrière', ok: (s) => s.coil.KM2 && !s.coil.KM1 },
      { t: 'Simule l\'arrivée en fin de course arrière (SQ2), puis arrête le cycle avec S1', ok: (s, v) => !s.coil.KM1 && !s.coil.KM2 && v.lastAct === 'S1' }
    ] }
  ]] };
  L.n3m3l3 = { min: 9, why: "Réduire la tension au démarrage limite l'appel de courant… au prix du couple.", screens: [[
    { h: 'Démarrage statorique par résistances' },
    { p: "Des résistances en série avec le stator réduisent la tension aux bornes du moteur au démarrage, puis un contacteur les court-circuite. Procédé ancien, aujourd'hui remplacé par les démarreurs progressifs, mais le principe (courant ∝ U, couple ∝ U²) reste fondamental." }
  ]] };
  L.n3m3l4 = { min: 9, why: "Les moteurs à rotor bobiné démarrent des charges très lourdes avec un courant modéré.", screens: [[
    { h: 'Démarrage rotorique' },
    { p: "Le rotor bobiné est relié à des résistances extérieures par des bagues et des balais. En augmentant la résistance rotorique, on obtient un fort couple au démarrage avec un courant réduit ; les résistances sont éliminées par crans pendant l'accélération. Utilisé pour les concasseurs, les broyeurs, les engins de levage anciens ; souvent remplacé par un variateur." }
  ]] };
  L.n3m4l1 = { min: 10, why: "Deux vitesses sans variateur : le Dahlander équipe encore de nombreux ventilateurs, perceuses et machines-outils.", screens: [[
    { h: 'Moteur deux vitesses Dahlander' },
    { p: "Un seul enroulement, six bornes. En petite vitesse, couplage triangle série (2p pôles) ; en grande vitesse, double étoile parallèle (p pôles) : la vitesse double. Les contacteurs sont verrouillés entre eux et le passage d'une vitesse à l'autre se fait en général par l'arrêt, ou de petite à grande vitesse directement si le schéma le prévoit." }
  ]] };
  L.n3m4l2 = { min: 9, why: "Quand le rapport de vitesses n'est pas 2, on utilise deux enroulements indépendants.", screens: [[
    { h: 'Moteur à deux enroulements séparés' },
    { p: "Deux enroulements statoriques indépendants, de nombres de pôles différents (par exemple 6 et 4 pôles : 1 000 et 1 500 tr/min). Chaque enroulement a son contacteur et sa protection thermique ; les contacteurs sont verrouillés mécaniquement et électriquement." }
  ]] };
  L.n3m4l3 = { min: 10, why: "Arrêter vite une machine lourde demande un freinage électrique maîtrisé.", screens: [[
    { h: 'Freinage par contre-courant' },
    { warn: "Le freinage par contre-courant provoque un courant et un échauffement très importants, et doit être coupé au voisinage de la vitesse nulle par un relais de vitesse : sinon, le moteur repart en sens inverse." }
  ]] };
  L.n3m4l4 = { min: 9, why: "L'injection de courant continu freine sans risque de redémarrage en sens inverse.", screens: [[
    { h: 'Freinage par injection de courant continu' },
    { p: "Après la coupure du réseau, un redresseur alimente deux phases du stator en courant continu pendant quelques secondes. Le champ fixe crée un couple de freinage jusqu'à l'arrêt. Un verrouillage interdit d'alimenter en même temps le réseau et le redresseur. Les variateurs de vitesse réalisent cette fonction par paramétrage." }
  ]] };
  L.n3m4l5 = { min: 10, why: "Pompes, compresseurs, ventilateurs domestiques : les moteurs monophasés sont partout.", screens: [[
    { h: 'Moteur monophasé à condensateur' },
    { p: "Un enroulement principal et un enroulement auxiliaire en série avec un condensateur, qui décale son courant. Les deux champs, décalés dans l'espace et dans le temps, composent un champ tournant. Condensateur permanent (de marche), ou condensateur de démarrage déconnecté ensuite par un interrupteur centrifuge ou un relais. Pour inverser le sens, on inverse l'enroulement auxiliaire par rapport au principal." }
  ]] };
  L.n3m5l1 = { min: 9, why: "Une armoire bien implantée se câble vite, se dépanne facilement et évolue sans tout refaire.", screens: [[
    { h: 'Implantation : rails DIN, goulottes, borniers' },
    { list: ['Appareils de puissance en haut, commande au milieu, borniers en bas (arrivées des câbles), selon les usages de l\'entreprise.', 'Goulottes horizontales et verticales dimensionnées avec de la réserve.', 'Séparer les zones de puissance et de signaux faibles ; respecter les distances de dissipation thermique des variateurs.', 'Garder 20 à 30 % de place libre pour les évolutions.'] }
  ]] };
  L.n3m5l2 = { min: 9, why: "Un câblage repéré, serré au couple et rangé, c'est une armoire fiable pendant vingt ans.", screens: [[
    { h: 'Règles de câblage propre et repéré' },
    { p: "Conducteurs dans les goulottes, sans tension mécanique ; embouts sur les conducteurs souples ; repères aux deux extrémités ; couleurs selon l'IEC 60204-1 ; serrage au couple indiqué ; un seul conducteur par borne sauf si la borne est prévue pour deux de même section." }
  ]] };
  L.n3m5l3 = { min: 9, why: "Câbler avec méthode, c'est câbler sans erreur du premier coup.", screens: [[
    { h: 'Du schéma au câblage pas à pas' },
    { tip: "Pointer chaque fil au surligneur sur le schéma dès qu'il est posé : à la fin, un fil non surligné est un fil oublié." }
  ]] };
  L.n3m5l4 = { min: 9, why: "Les essais méthodiques révèlent les erreurs sans risque pour les personnes ni la machine.", screens: [[
    { h: 'Essais à vide, essais en charge' },
    { p: "On essaie d'abord le circuit de commande seul, moteur déconnecté, puis à vide, puis en charge. On vérifie en particulier le sens de rotation, le fonctionnement de chaque sécurité, et on règle le relais thermique sur le courant nominal du moteur (plaque), pas sur le courant mesuré à vide." }
  ]] };
  L.n3m5l5 = { min: 12, why: "Réaliser un coffret complet, c'est réunir lecture de schéma, câblage, essais et sécurité.", screens: [[
    { h: 'Projet : coffret de démarrage direct complet' },
    { p: "Vérifie sur le folio vivant toutes les fonctions du coffret avant de le réaliser : démarrage, auto-maintien, arrêt, voyants, et réaction au défaut thermique. Le coffret 3D de l'application montre le même schéma câblé dans une vraie armoire." },
    { circuit: 'dol', overload: true, tasks: [
      { t: 'Ferme Q1 et démarre le moteur : le voyant de marche H1 s\'allume', ok: (s) => s.coil.KM1 && s.lamp.H1 },
      { t: 'Arrête le moteur avec S1', ok: (s, v) => !s.coil.KM1 && v.lastAct === 'S1' },
      { t: 'Redémarre puis provoque une surcharge : F2 déclenche, le voyant défaut H2 s\'allume', ok: (s) => !s.coil.KM1 && s.lamp.H2 }
    ] }
  ]] };

  Object.assign(AA.VISMAP, {
    n0m4l2: [{ order: 'vat' }], n0m4l3: [{ sim: 'outils' }],
    n2m1l6: [{ sim: 'dimmer' }], n2m2l1: [{ sim: 'prises' }], n2m2l2: [{ sim: 'tableau' }], n2m2l3: [{ sim: 'volet' }], n2m2l4: [{ sim: 've' }], n2m3l5: [{ sim: 'ddrtype' }], n2m4l3: [{ hot: 'born' }],
    n2m5l1: [{ order: 'projlog' }], n2m5l2: [{ sim: 'tableau' }], n2m5l3: [{ sim: 'devis' }], n2m5l4: [{ order: 'autoc' }],
    n3m3l3: [{ sim: 'statorique' }], n3m3l4: [{ sim: 'rotorique' }], n3m4l1: [{ sim: 'deuxv', opts: { kind: 'dahl' } }], n3m4l2: [{ sim: 'deuxv', opts: { kind: 'sep' } }],
    n3m4l3: [{ sim: 'freins' }], n3m4l4: [{ sim: 'freins' }], n3m4l5: [{ sim: 'mono' }],
    n3m5l1: [{ hot: 'armoire' }], n3m5l2: [{ sim: 'cabrules' }], n3m5l3: [{ order: 'cablage' }], n3m5l4: [{ order: 'essais' }]
  });
})();
