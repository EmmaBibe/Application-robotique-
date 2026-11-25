/* Ampère Académie — défis d'automatisme avancé :
 *  - « Grafcet » : une suite d'événements tirée au hasard ; prédire la situation finale (étapes et sorties actives).
 *    La correction est calculée par le moteur AA.GRAFCET (règles de l'IEC 60848) et détaillée pas à pas.
 *  - « Réglage PID » : un procédé (gain, constante de temps, retard) tiré au hasard ; régler Kp et Ti pour tenir
 *    un cahier des charges (dépassement, temps de réponse à 5 %, écart final). Un réglage valide existe toujours :
 *    les exigences sont calculées à partir du meilleur réglage trouvé par recherche systématique. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const X = AA.DEFAUTO = {};

  /* ---------- Grafcet ---------- */
  X.GF = {
    perceuse: { init: { a: true, b: false, dcy: false }, pool: [['dcy', 'pulse'], ['a', 'tog'], ['b', 'tog']] },
    cuve: { init: { bas: true, haut: false, dcy: false }, pool: [['dcy', 'pulse'], ['bas', 'tog'], ['haut', 'tog'], ['wait', 2], ['wait', 4], ['wait', 7]] },
    tri: { init: { p: false, G: false, fa: false, fb: false }, pool: [['p', 'tog'], ['G', 'tog'], ['fa', 'tog'], ['fb', 'tog']] },
    et: { init: { dcy: false, fp: false, fm: false }, pool: [['dcy', 'pulse'], ['fp', 'tog'], ['fm', 'tog']] }
  };
  X.gfLabel = (ev, I) => ev[0] === 'wait' ? `on attend ${ev[1]} s` : ev[1] === 'pulse' ? `appui bref sur ${ev[0]}` : `${ev[0]} passe à ${I[ev[0]] ? 1 : 0}`;
  X.gfRun = (key, events) => {
    const G = AA.GRAFCET, def = G.EX[key], g = G.create(def), I = Object.assign({}, X.GF[key].init), trace = [];
    g.tick(0.01, I);
    events.forEach(ev => {
      if (ev[0] === 'wait') g.tick(ev[1], I);
      else if (ev[1] === 'pulse') { I[ev[0]] = true; g.tick(0.01, I); I[ev[0]] = false; g.tick(0.01, I); }
      else { I[ev[0]] = !I[ev[0]]; g.tick(0.01, I); }
      trace.push({ lbl: X.gfLabel(ev, I), steps: [...g.active].sort((a, b) => a - b), outs: [...g.outputs()].sort() });
    });
    return { steps: [...g.active].sort((a, b) => a - b), outs: [...g.outputs()].sort(), trace };
  };
  X.gfGen = (r, lvl) => {
    const keys = lvl <= 1 ? ['perceuse', 'tri'] : ['perceuse', 'cuve', 'tri', 'et'], key = r.pick(keys), pool = X.GF[key].pool, n = 3 + Math.min(4, lvl);
    const events = []; for (let k = 0; k < n; k++) events.push(r.pick(pool));
    return { key, events, sig: key + events.map(e => e.join('')).join('-') };
  };

  /* ---------- PID ---------- */
  X.simLoop = (P, Kp, Ti, T, dt) => {
    const N7 = AA.N7, s = N7.pidNew(), buf = [], out = []; let pv = 0;
    dt = dt || 0.1;
    for (let t = 0; t <= T; t += dt) {
      const u = N7.pidStep(s, { Kp, Ti, Td: 0 }, 50, pv, dt).u;
      buf.push(u); const lag = Math.round(P.L / dt); while (buf.length > lag + 1) buf.shift();
      pv += (P.K * buf[0] - pv) / P.tau * dt; out.push([t, pv]);
    }
    let max = 0, settle = 0; out.forEach(([t, v]) => { max = Math.max(max, v); if (Math.abs(v - 50) > 2.5) settle = t; });
    return { curve: out, over: Math.max(0, (max - 50) / 50 * 100), settle, err: Math.abs(50 - out[out.length - 1][1]) };
  };
  X.pidGen = (r, lvl) => {
    const P = { K: r.pick([0.8, 1, 1.5, 2]), tau: r.pick([10, 15, 20, 30]), L: r.pick([1, 2, 3, 4]) };
    const T = Math.round(8 * (P.tau + P.L)), over = [25, 20, 12, 8, 5][lvl - 1] || 10;
    let best = null;
    for (let i = 1; i <= 30; i++) for (let Ti = 2; Ti <= 60; Ti += 2) { const Kp = Math.round(i * 0.2 * 10) / 10, m = X.simLoop(P, Kp, Ti, T, 0.2); if (m.over <= over && m.err < 1 && (!best || m.settle < best.settle)) best = { Kp, Ti, settle: m.settle }; }
    if (!best) best = { Kp: 0.2, Ti: 60, settle: T }; // ne se produit pas avec les procédés proposés (vérifié par les tests)
    const margin = [2.2, 1.8, 1.5, 1.3, 1.15][lvl - 1] || 1.5;
    return { P, T, over, settleMax: Math.ceil(best.settle * margin), best, sig: '' + P.K + P.tau + P.L + lvl };
  };

  /* ---------- Modbus : décoder une trame de réponse ---------- */
  X.EXC = { 1: 'fonction non prise en charge', 2: 'adresse de données invalide', 3: 'valeur de données invalide', 4: 'défaillance de l\'esclave' };
  X.mbGen = (r, lvl) => {
    const N8 = AA.N8, slave = r.int(1, 247), qty = Math.min(4, 1 + lvl), big = lvl >= 3;
    if (lvl >= 3 && r() < 0.25) {
      const fc = r.pick([3, 4, 6, 16]), code = r.pick([1, 2, 3, 4]), fr = N8.rtu([slave, fc | 0x80, code]);
      return { kind: 'exc', frame: fr, sig: 'e' + slave + fc + code, steps: [
        { q: 'Numéro de l\'esclave qui répond (en décimal)', a: slave, u: '', tol: 0, sol: `Premier octet : ${N8.hex([slave])} hexadécimal = ${slave}.` },
        { q: 'Code de la fonction demandée à l\'origine (en décimal)', a: fc, u: '', tol: 0, sol: `Le 2e octet ${N8.hex([fc | 0x80])} = fonction + 80 hexadécimal : c'est une réponse d'exception à la fonction ${fc}.` },
        { q: 'Code d\'exception (en décimal)', a: code, u: '', tol: 0, sol: `3e octet : ${code} = ${X.EXC[code]}.` }
      ] };
    }
    const vals = []; for (let k = 0; k < qty; k++) vals.push(lvl <= 1 ? r.int(0, 999) : r.int(0, 65535));
    const data = []; vals.forEach(v => data.push(v >> 8, v & 0xFF));
    const fr = N8.rtu([slave, 3, qty * 2].concat(data));
    const steps = [
      { q: 'Numéro de l\'esclave qui répond (en décimal)', a: slave, u: '', tol: 0, sol: `Premier octet : ${N8.hex([slave])} hexadécimal = ${slave}.` },
      { q: 'Nombre d\'octets de données annoncé', a: qty * 2, u: 'octets', tol: 0, sol: `3e octet : ${N8.hex([qty * 2])} = ${qty * 2} octets, soit ${qty} registre(s) de 16 bits.` }
    ];
    vals.forEach((v, k) => steps.push({ q: `Valeur du registre n° ${k + 1} (en décimal)`, a: v, u: '', tol: 0, sol: `Octets ${N8.hex([v >> 8, v & 0xFF])} : ${v >> 8} × 256 + ${v & 0xFF} = ${v} (poids fort en premier).` }));
    if (big && qty >= 2) { const v32 = vals[0] * 65536 + vals[1]; steps.push({ q: 'Les registres 1 et 2 forment un entier de 32 bits, mot de poids fort en premier. Sa valeur ?', a: v32, u: '', tol: 0, sol: `${vals[0]} × 65 536 + ${vals[1]} = ${v32}. Attention : certains appareils envoient le mot de poids faible en premier.` }); }
    return { kind: 'read', frame: fr, sig: 'r' + slave + vals.join('.'), steps };
  };

  /* ---------- Niveau de performance requis (graphe de risque ISO 13849-1) ---------- */
  X.PLR = [
    { t: 'Un opérateur charge à la main une presse rapide plusieurs fois par minute. Ses mains peuvent être écrasées (blessure irréversible) et le coulisseau descend trop vite pour qu\'il puisse retirer la main.', S: 2, F: 2, P: 2 },
    { t: 'Une fois par semaine, un technicien règle un convoyeur très lent. Le risque est un pincement léger (ecchymose) ; le mouvement est lent et visible, il peut retirer la main.', S: 1, F: 1, P: 1 },
    { t: 'Une fois par mois, un technicien entre dans la cellule d\'un robot rapide pour la maintenance. Un choc peut provoquer une fracture ; le robot est trop rapide pour être évité.', S: 2, F: 1, P: 2 },
    { t: 'Chaque jour, pendant plusieurs heures, un agent nettoie un tapis lent. Il risque une coupure superficielle ; le mouvement est lent et il peut s\'écarter.', S: 1, F: 2, P: 1 },
    { t: 'Rarement, un régleur intervient sur une scie en vitesse lente de réglage. Une amputation est possible, mais la vitesse réduite et la bonne visibilité lui permettent en général d\'éviter le contact.', S: 2, F: 1, P: 1 },
    { t: 'Un opérateur alimente une plieuse rapide toute la journée. Le risque est un pincement superficiel des doigts, sans séquelle ; le mouvement est trop rapide pour réagir.', S: 1, F: 2, P: 2 },
    { t: 'Toute la journée, un opérateur travaille près d\'un chariot automatique lent qui peut écraser un pied (fracture). Le chariot est lent et signalé : il peut s\'écarter.', S: 2, F: 2, P: 1 },
    { t: 'Une fois par trimestre, on change l\'outil d\'une machine dont la broche rapide peut happer un gant et blesser gravement la main ; impossible de réagir à temps.', S: 2, F: 1, P: 2 }
  ];
  X.plrGen = (r, lvl) => { const k = r.int(0, X.PLR.length - 1), k2 = (k + 1 + r.int(0, X.PLR.length - 2)) % X.PLR.length; const cases = lvl >= 3 ? [k, k2] : [k]; return { cases, sig: cases.join('-') }; };

  const register = () => {
    const D = AA.Defis; if (!D || !D.TYPES || !AA.GRAFCET || !AA.N7) return;
    if (AA.N10) D.TYPES.plr = {
      name: 'Niveau de performance requis', icon: 'trophy', min: 3,
      desc: 'Une situation dangereuse décrite en quelques lignes : estime la gravité, l\'exposition, la possibilité d\'évitement, et déduis le PLr de la fonction de sécurité.',
      gen: (r, lvl) => Object.assign(X.plrGen(r, lvl), { lvl }),
      play(main, inst, done) {
        const sel = (k, opts) => `<select class="sel" data-k="${k}"><option value="">—</option>${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`;
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Sécurité des machines</p><h1>Quel PL<sub>r</sub> ?</h1></div></div>
          <div class="brief">Pour chaque situation, choisis S, F et P selon l'énoncé, puis le niveau de performance requis par le graphe de risque de l'ISO 13849-1.</div>
          <div class="grid" style="margin-top:14px">${inst.cases.map((c, i) => `<div class="card" data-i="${i}"><p class="eyebrow">Situation ${i + 1}</p><p>${esc(X.PLR[c].t)}</p>
            <div class="row">${sel('S', [[1, 'S1 légère'], [2, 'S2 grave']])}${sel('F', [[1, 'F1 rare / courte'], [2, 'F2 fréquente / longue']])}${sel('P', [[1, 'P1 possible'], [2, 'P2 à peine possible']])}${sel('L', [...'abcde'].map(x => [x, 'PLr ' + x]))}</div><div class="js-c"></div></div>`).join('')}</div>
          <button class="btn primary js-ok" style="margin-top:14px">${ic.check}Valider</button><div class="js-fb"></div>`;
        let finished = false;
        main.querySelector('.js-ok').onclick = () => {
          let pts = 0, tot = 0;
          inst.cases.forEach((c, i) => {
            const card = main.querySelector(`[data-i="${i}"]`), v = k => card.querySelector(`[data-k="${k}"]`).value, s = X.PLR[c], pl = AA.N10.plr(s.S, s.F, s.P);
            const ok = { S: +v('S') === s.S, F: +v('F') === s.F, P: +v('P') === s.P, L: v('L') === pl };
            pts += Object.values(ok).filter(Boolean).length; tot += 4;
            card.querySelector('.js-c').innerHTML = `<p class="${ok.L ? 'ok-t' : 'bad-t'}" style="margin:10px 0 0">Réponse : S${s.S}, F${s.F}, P${s.P} → PL<sub>r</sub> ${pl}. ${ok.S && ok.F && ok.P ? '' : 'Relis l\'énoncé : la gravité se juge sur la blessure possible, F sur la fréquence et la durée d\'exposition, P sur la vitesse du mouvement et la possibilité de s\'écarter.'}</p>`;
          });
          const score = Math.round(100 * pts / tot);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${score >= 50 ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>Dans une vraie appréciation du risque, ces choix se discutent en équipe et se justifient par écrit ; un doute sur un critère conduit à retenir l'option la plus défavorable.</p></div>`;
          if (!finished) { finished = true; done(score); }
        };
      }
    };
    if (AA.N8) D.TYPES.modbus = {
      name: 'Trame Modbus', icon: 'plc', min: 3,
      desc: 'Une trame de réponse Modbus RTU, en hexadécimal, captée sur la ligne : décode-la octet par octet, comme avec un analyseur de bus.',
      gen: (r, lvl) => Object.assign(X.mbGen(r, lvl), { lvl }),
      play(main, inst, done) {
        const N8 = AA.N8;
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Trame Modbus</p><h1>Décoder la réponse</h1></div></div>
          <div class="brief">Le maître a envoyé une requête ; voici la réponse reçue sur la ligne RS-485 (Modbus RTU, octets en hexadécimal, CRC à la fin) :</div>
          <div class="mb-frame"><div class="mb-bytes"><div class="mb-part"><span>Trame reçue</span><b>${N8.hex(inst.frame)}</b></div></div></div>
          <div class="grid" style="margin-top:16px">${inst.steps.map((s, i) => `<div class="card numq" data-i="${i}"><p class="eyebrow">Question ${i + 1}</p><p class="q">${s.q}</p><div class="num-in"><input inputmode="decimal" placeholder="Ta réponse"><span class="unit">${esc(s.u)}</span></div><div class="js-c"></div></div>`).join('')}</div>
          <button class="btn primary js-ok" style="margin-top:14px">${ic.check}Valider</button><div class="js-fb"></div>`;
        let finished = false;
        main.querySelector('.js-ok').onclick = () => {
          let good = 0;
          inst.steps.forEach((s, i) => { const c = main.querySelector(`[data-i="${i}"]`), v = Number(String(c.querySelector('input').value).replace(/\s/g, '').replace(',', '.')), ok = v === s.a; if (ok) good++; c.querySelector('.js-c').innerHTML = `<p class="${ok ? 'ok-t' : 'bad-t'}" style="margin:10px 0 0">${ok ? '✔' : '✘'} ${esc(s.sol)}</p>`; });
          const score = Math.round(100 * good / inst.steps.length);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${score >= 50 ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>${good} / ${inst.steps.length} réponses justes. Les deux derniers octets (${N8.hex(inst.frame.slice(-2))}) sont le CRC : l'esclave le calcule sur tous les octets précédents, le maître refait le calcul et rejette la trame s'il diffère.</p></div>`;
          if (!finished) { finished = true; done(score); }
        };
      }
    };
    D.TYPES.grafcet = {
      name: 'Grafcet', icon: 'plc', min: 2,
      desc: 'Une suite d\'événements, un Grafcet : prédis exactement quelles étapes et quelles sorties sont actives à la fin. Les règles d\'évolution ne pardonnent pas.',
      gen: (r, lvl) => Object.assign(X.gfGen(r, lvl), { lvl }),
      play(main, inst, done) {
        const G = AA.GRAFCET, def = G.EX[inst.key], res = X.gfRun(inst.key, inst.events), I = Object.assign({}, X.GF[inst.key].init);
        const labels = inst.events.map(ev => { if (ev[0] !== 'wait' && ev[1] === 'tog') I[ev[0]] = !I[ev[0]]; return X.gfLabel(ev, I); });
        const outsAll = [...new Set(Object.values(def.steps).flatMap(s => (s.acts || []).map(a => a.o)))];
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Grafcet</p><h1>${esc(def.title)}</h1></div></div>
          <div class="grid g2"><div class="card plain" style="padding:10px">${G.svg(def, null)}</div>
          <div><div class="brief">Situation de départ : étape(s) initiale(s) active(s). Entrées au départ : ${Object.entries(X.GF[inst.key].init).map(([k, v]) => `${k} = ${v ? 1 : 0}`).join(', ')}. Puis, dans l'ordre :</div>
          <ol class="nice">${labels.map(l => `<li>${esc(l)}</li>`).join('')}</ol>
          <p class="eyebrow" style="margin-top:12px">Étapes actives à la fin</p><div class="row js-st">${Object.keys(def.steps).map(k => `<label class="chk"><input type="checkbox" value="${k}"><span>Étape ${k}</span></label>`).join('')}</div>
          <p class="eyebrow" style="margin-top:12px">Sorties actives à la fin</p><div class="row js-o">${outsAll.map(k => `<label class="chk"><input type="checkbox" value="${k}"><span>${k}</span></label>`).join('')}</div>
          <button class="btn primary js-ok" style="margin-top:14px">${ic.check}Valider</button></div></div><div class="js-fb"></div>`;
        let finished = false;
        main.querySelector('.js-ok').onclick = () => {
          const pick = c => [...main.querySelectorAll(c + ' input:checked')].map(i => i.value);
          const st = pick('.js-st').map(Number).sort((a, b) => a - b), os = pick('.js-o').sort();
          const okS = JSON.stringify(st) === JSON.stringify(res.steps), okO = JSON.stringify(os) === JSON.stringify(res.outs);
          const score = (okS ? 50 : 0) + (okO ? 50 : 0);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${score >= 50 ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>Étapes : ${okS ? '✔' : '✘'} réponse ${res.steps.join(', ') || 'aucune'} · Sorties : ${okO ? '✔' : '✘'} réponse ${res.outs.join(', ') || 'aucune'}.</p>
            <p class="eyebrow">Évolution pas à pas</p><ol class="nice">${res.trace.map(t => `<li>${esc(t.lbl)} → étapes ${t.steps.join(', ')}${t.outs.length ? ' ; sorties ' + t.outs.join(', ') : ''}</li>`).join('')}</ol>
            <p class="muted">Rappel : une transition n'est franchie que si TOUTES ses étapes amont sont actives et sa réceptivité vraie ; un appui bref n'a d'effet que s'il arrive quand la transition est validée.</p></div>`;
          if (!finished) { finished = true; done(score); }
        };
      }
    };
    D.TYPES.pid = {
      name: 'Réglage PID', icon: 'sigma', min: 3,
      desc: 'Un procédé inconnu, un cahier des charges : dépassement maximal, temps de réponse, écart nul. Règle Kp et Ti, essaie autant que tu veux, puis valide.',
      gen: (r, lvl) => Object.assign(X.pidGen(r, lvl), { lvl }),
      play(main, inst, done) {
        const P = inst.P;
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Réglage PID</p><h1>Tenir le cahier des charges</h1></div></div>
          <div class="brief">Procédé : gain statique <b>${AA.fmt(P.K)}</b>, constante de temps <b>${P.tau} s</b>, retard pur <b>${P.L} s</b>. Échelon de consigne de 0 à 50 %. Exigences : dépassement <b>≤ ${inst.over} %</b>, temps de réponse à 5 % <b>≤ ${inst.settleMax} s</b>, écart final <b>< 1 %</b>.</div>
          <div class="simcard" style="margin-top:14px"><div class="simview js-v"></div><div class="simctl"><label class="sl" data-k="Kp"><span>K<sub>p</sub></span><input type="range" min="0.1" max="6" step="0.1" value="1"><b>1</b><i></i></label><label class="sl" data-k="Ti"><span>T<sub>i</sub></span><input type="range" min="1" max="60" step="1" value="20"><b>20</b><i>s</i></label><button class="btn sm js-try">Essayer</button></div>
          <div class="simout"><div><span>Dépassement</span><b class="o-o">—</b></div><div><span>Temps de réponse à 5 %</span><b class="o-s">—</b></div><div><span>Écart final</span><b class="o-e">—</b></div></div></div>
          <button class="btn primary js-ok" style="margin-top:14px">${ic.check}Valider ce réglage</button><div class="js-fb"></div>`;
        const st = { Kp: 1, Ti: 20 }; let m = null, tries = 0, finished = false;
        main.querySelectorAll('.sl').forEach(l => { const i = l.querySelector('input'), o = l.querySelector('b'); i.oninput = () => { st[l.dataset.k] = +i.value; o.textContent = AA.fmt(+i.value, 1); }; });
        const v = main.querySelector('.js-v');
        const plot = () => { v.innerHTML = '<canvas style="width:100%;height:220px;display:block"></canvas>'; const c = v.firstChild, d = window.devicePixelRatio || 1, W = c.clientWidth, H = 220; c.width = W * d; c.height = H * d; const g = c.getContext('2d'); g.scale(d, d);
          const X0 = 40, X1 = W - 10, Y = y => H - 20 - y / 80 * (H - 30), Xt = t => X0 + t / inst.T * (X1 - X0);
          g.strokeStyle = AA.css('--line'); g.fillStyle = AA.css('--ink-3'); g.font = '500 10px Segoe UI'; [0, 25, 50, 75].forEach(y => { g.beginPath(); g.moveTo(X0, Y(y)); g.lineTo(X1, Y(y)); g.stroke(); g.fillText(y + ' %', 4, Y(y) + 4); });
          g.fillStyle = 'rgba(30,160,100,.12)'; g.fillRect(X0, Y(52.5), X1 - X0, Y(47.5) - Y(52.5)); g.strokeStyle = AA.css('--bad'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X0, Y(50 * (1 + inst.over / 100))); g.lineTo(X1, Y(50 * (1 + inst.over / 100))); g.moveTo(Xt(inst.settleMax), Y(0)); g.lineTo(Xt(inst.settleMax), Y(80)); g.stroke(); g.setLineDash([]);
          if (m) { g.strokeStyle = AA.css('--copper'); g.lineWidth = 2.4; g.beginPath(); m.curve.forEach(([t, y], k) => k ? g.lineTo(Xt(t), Y(y)) : g.moveTo(Xt(t), Y(y))); g.stroke(); } };
        plot();
        main.querySelector('.js-try').onclick = () => { m = X.simLoop(P, st.Kp, st.Ti, inst.T, 0.2); tries++; main.querySelector('.o-o').textContent = AA.fmt(m.over, 1) + ' %'; main.querySelector('.o-s').textContent = AA.fmt(m.settle, 1) + ' s'; main.querySelector('.o-e').textContent = AA.fmt(m.err, 2) + ' %'; plot(); };
        main.querySelector('.js-ok').onclick = () => {
          m = X.simLoop(P, st.Kp, st.Ti, inst.T, 0.2); plot();
          const okO = m.over <= inst.over, okS = m.settle <= inst.settleMax, okE = m.err < 1;
          const score = okO && okS && okE ? 100 : Math.round(((okO ? 1 : 0) + (okS ? 1 : 0) + (okE ? 1 : 0)) / 3 * 70);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${score >= 70 ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>Dépassement ${okO ? '✔' : '✘'} ${AA.fmt(m.over, 1)} % · Temps de réponse ${okS ? '✔' : '✘'} ${AA.fmt(m.settle, 1)} s · Écart ${okE ? '✔' : '✘'} ${AA.fmt(m.err, 2)} %. ${tries} essai(s).</p><p class="muted">Un réglage de référence : K<sub>p</sub> = ${AA.fmt(inst.best.Kp, 1)}, T<sub>i</sub> = ${inst.best.Ti} s (temps de réponse ${AA.fmt(inst.best.settle, 1)} s). Plus le retard est grand par rapport à la constante de temps, plus le gain doit rester modéré.</p></div>`;
          if (!finished) { finished = true; done(score); }
        };
      }
    };
  };
  register();
})();
