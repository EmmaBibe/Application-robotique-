/* Ampère Académie — automate programmable : moteur Ladder (IEC 61131-3), éditeur, procédé animé,
 * et cahiers des charges textuels notés automatiquement par comparaison avec un modèle de référence.
 *
 * Programme = liste de réseaux. Réseau = { rows, cells[r][c] (c = 0..5 contacts, 6 = bobine), v: ['r,c'] }.
 * Lien vertical 'r,c' : relie les lignes r et r+1 sur le bord gauche de la colonne c (branche parallèle).
 * Contacts : NO, NC, P (front montant), N (front descendant), H (fil). Bobines : C, S, R, TON, TOF, CTU.
 * Mémoire : I0.0-I0.7, Q0.0-Q0.7, M0.0-M0.7, T0-T3 (bit Q), C0-C3 (bit Q). Cycle : 20 ms. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const S = AA.state;
  const COLS = 7, CW = 92, RH = 66, X0 = 34;
  const LAD = AA.Ladder = {};
  const ADDR = [].concat(...['I', 'Q', 'M'].map(p => Array.from({ length: 8 }, (_, i) => `${p}0.${i}`)), ['T0', 'T1', 'T2', 'T3', 'C0', 'C1', 'C2', 'C3']);

  /* ---------------- Moteur d'exécution ---------------- */
  LAD.newMem = () => ({ b: {}, prev: {}, T: {}, C: {} });
  LAD.bit = (m, a) => {
    if (!a) return false;
    if (a[0] === 'T') return !!(m.T[a] && m.T[a].q);
    if (a[0] === 'C') return !!(m.C[a] && m.C[a].q);
    return !!m.b[a];
  };
  LAD.scan = (prog, m, dt) => {
    const flows = [];
    for (const net of prog) {
      const R = net.rows, out = [], inb = [];
      for (let r = 0; r < R; r++) { out.push(new Array(COLS).fill(false)); inb.push(new Array(COLS).fill(false)); }
      for (let c = 0; c < COLS; c++) {
        const cur = [];
        for (let r = 0; r < R; r++) cur.push(c === 0 ? true : out[r][c - 1]);
        // regroupement par liens verticaux
        let r = 0;
        while (r < R) {
          let e = r; while (e < R - 1 && net.v.includes(e + ',' + c)) e++;
          if (c > 0 || e > r) { const any = cur.slice(r, e + 1).some(Boolean); for (let k = r; k <= e; k++) cur[k] = c === 0 ? true : any; }
          r = e + 1;
        }
        for (let rr = 0; rr < R; rr++) {
          inb[rr][c] = cur[rr];
          const cell = net.cells[rr][c];
          if (c < COLS - 1) {
            let o = false;
            if (cell && cell.t) {
              const v = LAD.bit(m, cell.a);
              if (cell.t === 'H') o = cur[rr];
              else if (cell.t === 'NO') o = cur[rr] && v;
              else if (cell.t === 'NC') o = cur[rr] && !v;
              else if (cell.t === 'P') o = cur[rr] && v && !m.prev[cell.a];
              else if (cell.t === 'N') o = cur[rr] && !v && !!m.prev[cell.a];
            }
            out[rr][c] = o;
          } else if (cell && cell.t) {
            const p = cur[rr];
            out[rr][c] = p;
            const a = cell.a;
            if (cell.t === 'C') m.b[a] = p;
            else if (cell.t === 'S') { if (p) setBit(m, a, true); }
            else if (cell.t === 'R') { if (p) setBit(m, a, false); }
            else if (cell.t === 'TON') { const t = m.T[a] = m.T[a] || { et: 0, q: false }; if (p) { t.et = Math.min(cell.p, t.et + dt); t.q = t.et >= cell.p - 1e-9; } else { t.et = 0; t.q = false; } }
            else if (cell.t === 'TOF') { const t = m.T[a] = m.T[a] || { et: 0, q: false }; if (p) { t.et = 0; t.q = true; } else if (t.q) { t.et += dt; if (t.et >= cell.p - 1e-9) t.q = false; } }
            else if (cell.t === 'CTU') { const k = m.C[a] = m.C[a] || { cv: 0, q: false, last: false }; if (p && !k.last) k.cv++; k.last = p; k.q = k.cv >= cell.p; }
          }
        }
      }
      flows.push({ out, inb });
    }
    // mémoire des fronts : valeur des bits à la fin du cycle
    const snap = {};
    ADDR.forEach(a => { snap[a] = LAD.bit(m, a); });
    m.prev = snap;
    return flows;
  };
  function setBit(m, a, v) {
    if (a[0] === 'C') { const k = m.C[a] = m.C[a] || { cv: 0, q: false, last: false }; if (!v) { k.cv = 0; k.q = false; } return; }
    if (a[0] === 'T') { const t = m.T[a] = m.T[a] || { et: 0, q: false }; if (!v) { t.et = 0; t.q = false; } return; }
    m.b[a] = v;
  }

  /* ---------------- Cahiers des charges : convoyeur paramétrable ---------------- */
  const FEATS = ['au', 'th', 'pre', 'tim', 'cnt'];
  LAD.genSpec = (r, lvl) => {
    const nf = Math.min(FEATS.length, lvl - 1 + (lvl >= 4 && r() < 0.5 ? 1 : 0));
    const feats = r.shuffle(FEATS).slice(0, nf);
    const has = f => feats.includes(f);
    const stopNC = r() < (lvl >= 2 ? 0.7 : 0.3);
    const ins = ['start', 'stop'].concat(has('au') ? ['au'] : [], has('th') ? ['th'] : [], has('cnt') ? ['sensor'] : [], (has('th') || has('cnt')) ? ['reset'] : []);
    const outs = ['km'].concat(has('pre') ? ['horn'] : [], has('tim') ? ['lamp'] : [], has('th') ? ['fault'] : [], has('cnt') ? ['done'] : []);
    const iA = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7]), qA = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
    const io = {};
    ins.forEach((k, i) => { io[k] = 'I0.' + iA[i]; });
    outs.forEach((k, i) => { io[k] = 'Q0.' + qA[i]; });
    const p = { feats, stopNC, io, Tp: r.pick([2, 3, 4, 5]), Td: r.pick([2, 3, 5, 6]), N: r.pick([3, 4, 5, 6, 8]), lvl, machine: r.pick(['tapis d\'évacuation des cartons', 'convoyeur de sacs de ciment', 'bande de tri de bouteilles', 'convoyeur à rouleaux de palettes', 'tapis d\'alimentation d\'une ensacheuse']), site: r.pick(AA.TECH.SITES) };
    p.sig = feats.join('') + stopNC + JSON.stringify(io) + p.Tp + p.Td + p.N;
    return p;
  };
  LAD.NAMES = { start: 'S2 Marche (poussoir NO)', stop: 'S1 Arrêt', au: 'Retour du relais d\'arrêt d\'urgence (1 = AU déverrouillé)', th: 'Relais thermique F2, contact 95-96 (NF)', sensor: 'B1 Capteur de fin de tapis', reset: 'S3 Réarmement', km: 'KM1 Contacteur du moteur', horn: 'HA1 Klaxon de préavis', lamp: 'H1 Voyant « En production »', fault: 'H2 Voyant défaut thermique', done: 'H3 Voyant « Lot terminé »' };
  LAD.specText = p => {
    const h = f => p.feats.includes(f), io = p.io;
    let t = `<p>Dans ${esc(p.site)}, on automatise un <b>${esc(p.machine)}</b> entraîné par un moteur commandé par le contacteur KM1 (sortie <b>${io.km}</b>).</p><ul class="nice">`;
    t += `<li>Un appui sur <b>Marche</b> (${io.start}) démarre le tapis${h('pre') ? ' après un préavis' : ''} ; un appui sur <b>Arrêt</b> (${io.stop}) l'arrête. L'arrêt est <b>prioritaire</b> sur la marche. Le bouton Arrêt est câblé en contact <b>${p.stopNC ? 'à ouverture (NF) : l\'entrée vaut 1 au repos' : 'à fermeture (NO) : l\'entrée vaut 1 quand on appuie'}</b>.</li>`;
    if (h('au')) t += `<li>L'arrêt d'urgence est traité par un relais de sécurité câblé. Son contact de retour arrive sur <b>${io.au}</b> (1 = AU déverrouillé). Si l'AU est actionné, le tapis s'arrête, et il <b>ne doit pas redémarrer seul</b> au déverrouillage : il faut un nouvel appui sur Marche.</li>`;
    if (h('th')) t += `<li>Le contact 95-96 du relais thermique est câblé sur <b>${io.th}</b> (1 = normal). Au déclenchement, le tapis s'arrête et le voyant défaut (<b>${io.fault}</b>) s'allume et <b>reste allumé</b>, même si le thermique est réarmé, jusqu'à un appui sur Réarmement (<b>${io.reset}</b>). Le réarmement n'efface le défaut que si le thermique est revenu à la normale. Tant que le défaut est mémorisé, le démarrage est impossible.</li>`;
    if (h('pre')) t += `<li>Sécurité du personnel : avant chaque démarrage, le klaxon (<b>${io.horn}</b>) retentit pendant <b>${p.Tp} s</b>, puis le moteur démarre et le klaxon se tait. Un arrêt (ou tout défaut) pendant le préavis annule le démarrage.</li>`;
    if (h('tim')) t += `<li>Le voyant « En production » (<b>${io.lamp}</b>) s'allume <b>${p.Td} s</b> après le démarrage effectif du moteur (le temps que le tapis soit lancé) et s'éteint dès l'arrêt.</li>`;
    if (h('cnt')) t += `<li>Le capteur de fin de tapis (<b>${io.sensor}</b>) passe à 1 à chaque objet. Seuls les objets détectés <b>pendant que le moteur tourne</b> comptent. Au <b>${p.N}<sup>e</sup></b> objet, le tapis s'arrête et le voyant « Lot terminé » (<b>${io.done}</b>) s'allume. Un appui sur Réarmement (<b>${io.reset}</b>) remet le compteur à zéro et éteint le voyant ; il faut ensuite appuyer sur Marche.</li>`;
    t += `</ul><p class="muted">Tu peux utiliser librement les mémoires M0.0-M0.7, temporisations T0-T3 et compteurs C0-C3. Toute solution qui respecte exactement ce fonctionnement est acceptée.</p>`;
    return t;
  };

  /* Modèle de référence (fonctionnement attendu), évalué avec le même pas que l'automate */
  LAD.refModel = p => {
    const h = f => p.feats.includes(f), io = p.io;
    const st = { run: false, pre: false, preT: 0, runT: 0, fault: false, cnt: 0, done: false, lastSensor: false };
    return (I, dt) => {
      const startP = I[io.start], stopP = p.stopNC ? !I[io.stop] : I[io.stop];
      const auOK = h('au') ? I[io.au] : true, thOK = h('th') ? I[io.th] : true, reset = (h('th') || h('cnt')) ? I[io.reset] : false;
      if (h('th')) { if (!thOK) st.fault = true; if (reset && thOK) st.fault = false; }
      if (h('cnt')) {
        const s = I[io.sensor];
        if (s && !st.lastSensor && st.run) { st.cnt++; if (st.cnt >= p.N) st.done = true; }
        st.lastSensor = s;
        if (reset) { st.cnt = 0; st.done = false; }
      }
      const permit = !stopP && auOK && thOK && !st.fault && !st.done;
      if (h('pre')) {
        if (st.pre) { if (!permit) st.pre = false; else { st.preT += dt; if (st.preT >= p.Tp - 1e-9) { st.pre = false; st.run = true; } } }
        else if (startP && permit && !st.run) { st.pre = true; st.preT = 0; }
      } else if (startP && permit) st.run = true;
      if (!permit) st.run = false;
      st.runT = st.run ? st.runT + dt : 0;
      const O = {};
      O[io.km] = st.run;
      if (h('pre')) O[io.horn] = st.pre;
      if (h('tim')) O[io.lamp] = st.run && st.runT >= p.Td - 1e-9;
      if (h('th')) O[io.fault] = st.fault;
      if (h('cnt')) O[io.done] = st.done;
      return O;
    };
  };

  /* Scénarios d'essai : déterministes (un par fonction) + séquences aléatoires */
  LAD.scenarios = (p, seed) => {
    const h = f => p.feats.includes(f), io = p.io, r = AA.rng(seed || p.sig);
    const L = []; // [temps, entrée logique, appui/défaut]
    const sc = [];
    const pulse = (arr, t, k, d) => { arr.push([t, k, 1], [t + (d || 0.3), k, 0]); };
    const T0 = (h('pre') ? p.Tp : 0) + (h('tim') ? p.Td : 0) + 1.5;
    let a = []; pulse(a, 0.3, 'start'); pulse(a, 0.9 + T0, 'stop'); sc.push({ n: 'Marche puis arrêt', ev: a, dur: 2 + T0 });
    a = []; a.push([0.3, 'stop', 1], [0.5, 'start', 1], [0.9, 'start', 0], [1.1, 'stop', 0]); sc.push({ n: 'Arrêt prioritaire (Marche et Arrêt ensemble)', ev: a, dur: 2 + (h('pre') ? p.Tp : 0) });
    a = []; pulse(a, 0.3, 'start'); pulse(a, 0.9 + T0, 'start'); sc.push({ n: 'Deuxième appui sur Marche pendant la marche', ev: a, dur: 2 + 2 * T0 });
    if (h('au')) { a = []; pulse(a, 0.3, 'start'); a.push([1 + T0, 'au', 1], [2 + T0, 'au', 0]); pulse(a, 3 + T0, 'start'); sc.push({ n: 'Arrêt d\'urgence puis déverrouillage', ev: a, dur: 5 + 2 * T0 }); }
    if (h('th')) { a = []; pulse(a, 0.3, 'start'); a.push([1 + T0, 'th', 1]); pulse(a, 2 + T0, 'reset'); pulse(a, 2.6 + T0, 'start'); a.push([3.4 + T0, 'th', 0]); pulse(a, 4 + T0, 'start'); pulse(a, 4.8 + T0, 'reset'); pulse(a, 5.6 + T0, 'start'); sc.push({ n: 'Défaut thermique, réarmements', ev: a, dur: 7 + 2 * T0 }); }
    if (h('pre')) { a = []; pulse(a, 0.3, 'start'); pulse(a, 0.3 + p.Tp / 2, 'stop'); pulse(a, 1 + p.Tp, 'start'); sc.push({ n: 'Arrêt pendant le préavis', ev: a, dur: 2.5 + 2 * p.Tp + (h('tim') ? p.Td : 0) }); }
    if (h('cnt')) {
      a = []; pulse(a, 0.2, 'sensor', 0.2); pulse(a, 0.5, 'start'); let t = 1 + (h('pre') ? p.Tp : 0);
      for (let k = 0; k < p.N + 1; k++) { pulse(a, t, 'sensor', 0.2); t += 0.6; }
      pulse(a, t + 0.3, 'start'); pulse(a, t + 1, 'reset'); pulse(a, t + 1.6, 'start');
      sc.push({ n: 'Comptage du lot', ev: a, dur: t + 3 + (h('pre') ? p.Tp : 0) });
    }
    const keys = ['start', 'stop'].concat(h('au') ? ['au'] : [], h('th') ? ['th'] : [], h('cnt') ? ['sensor'] : [], (h('th') || h('cnt')) ? ['reset'] : []);
    for (let s = 0; s < 6; s++) {
      a = []; let t = 0.3; const lvl = {};
      for (let k = 0; k < 12; k++) {
        const key = r.pick(keys);
        if (key === 'au' || key === 'th') { lvl[key] = lvl[key] ? 0 : 1; a.push([t, key, lvl[key]]); }
        else pulse(a, t, key, key === 'sensor' ? 0.2 : 0.3);
        t += r.pick([0.6, 0.9, 1.3, 1.8, 2.6]) + (h('pre') && r() < 0.3 ? p.Tp : 0);
      }
      sc.push({ n: 'Séquence aléatoire ' + (s + 1), ev: a, dur: t + 2 + (h('tim') ? p.Td : 0) });
    }
    return sc;
  };
  /* Bits physiques d'entrée à partir de l'état logique (câblage NF, AU, thermique) */
  LAD.physical = (p, logic) => {
    const I = {}, io = p.io;
    I[io.start] = !!logic.start;
    I[io.stop] = p.stopNC ? !logic.stop : !!logic.stop;
    if (io.au) I[io.au] = !logic.au;
    if (io.th) I[io.th] = !logic.th;
    if (io.sensor) I[io.sensor] = !!logic.sensor;
    if (io.reset) I[io.reset] = !!logic.reset;
    return I;
  };
  LAD.grade = (prog, p) => {
    const dt = 0.02, res = [];
    for (const s of LAD.scenarios(p)) {
      const mem = LAD.newMem(), ref = LAD.refModel(p);
      const evs = s.ev.slice().sort((x, y) => x[0] - y[0]);
      const logic = {}; let ei = 0;
      const n = Math.round(s.dur / dt), R = [], U = [];
      for (let k = 0; k < n; k++) {
        const t = k * dt;
        while (ei < evs.length && evs[ei][0] <= t + 1e-9) { logic[evs[ei][1]] = evs[ei][2]; ei++; }
        const I = LAD.physical(p, logic);
        Object.keys(mem.b).forEach(a => { if (a[0] === 'I') delete mem.b[a]; });
        Object.assign(mem.b, I);
        LAD.scan(prog, mem, dt);
        R.push(ref(I, dt));
        const o = {}; Object.keys(R[k]).forEach(a => { o[a] = !!mem.b[a]; }); U.push(o);
      }
      // comparaison tolérante à ±5 cycles (100 ms) pour les décalages de temporisation
      let fail = null;
      for (let k = 0; k < n && !fail; k += 5) {
        const want = R[k], got = U[k];
        if (JSON.stringify(want) === JSON.stringify(got)) continue;
        let near = false;
        for (let j = Math.max(0, k - 5); j <= Math.min(n - 1, k + 5) && !near; j++) if (JSON.stringify(R[j]) === JSON.stringify(got)) near = true;
        if (!near) { const bad = Object.keys(want).find(a => want[a] !== got[a]); fail = { t: k * dt, a: bad, want: want[bad], got: got[bad] }; }
      }
      res.push({ n: s.n, ok: !fail, fail });
    }
    return res;
  };

  /* Vérification d'un exercice de leçon.
   * test = { table: [[entrées, sorties attendues], ...] }  (logique combinatoire, état stabilisé)
   *      | { seq: [[t, entrées], ...], at: [[t, sorties attendues], ...], dur }  (chronogramme) */
  LAD.check = (prog, test) => {
    const fmt = o => Object.entries(o).map(([a, v]) => `${a}=${v ? 1 : 0}`).join(', ');
    if (test.table) {
      for (const [I, O] of test.table) {
        const m = LAD.newMem(); Object.assign(m.b, I);
        for (let k = 0; k < 5; k++) LAD.scan(prog, m, 0.02);
        for (const a in O) if (!!m.b[a] !== !!O[a]) return { ok: false, msg: `Avec ${fmt(I)}, ${a} devrait valoir ${O[a] ? 1 : 0}.` };
      }
      return { ok: true };
    }
    const m = LAD.newMem(), dt = 0.02, evs = test.seq.slice(), at = test.at.slice();
    const n = Math.round((test.dur || 10) / dt);
    for (let k = 0; k <= n; k++) {
      const t = k * dt;
      while (evs.length && evs[0][0] <= t + 1e-9) Object.assign(m.b, evs.shift()[1]);
      LAD.scan(prog, m, dt);
      while (at.length && at[0][0] <= t + 1e-9) {
        const [tt, O] = at.shift();
        for (const a in O) if (LAD.bit(m, a) !== !!O[a]) return { ok: false, msg: `À t = ${AA.fmt(tt, 1)} s, ${a} devrait valoir ${O[a] ? 1 : 0}.` };
      }
    }
    return { ok: true };
  };

  /* Solution de référence en Ladder (montrée après la correction ; vérifiée par l'autotest) */
  LAD.refProgram = p => {
    const h = f => p.feats.includes(f), io = p.io, nets = [];
    const net = (rows) => ({ rows, cells: Array.from({ length: rows }, () => new Array(COLS).fill(null)), v: [], cmt: '' });
    const put = (n, r, c, t, a, pr) => { n.cells[r][c] = { t, a }; if (pr != null) n.cells[r][c].p = pr; };
    const wire = (n, r, from, to) => { for (let c = from; c <= to; c++) if (!n.cells[r][c]) put(n, r, c, 'H'); };
    let n;
    if (h('th')) {
      n = net(1); put(n, 0, 0, 'NC', io.th); wire(n, 0, 1, 5); put(n, 0, 6, 'S', 'M0.0'); n.cmt = 'Mémorisation du défaut thermique'; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', io.reset); put(n, 0, 1, 'NO', io.th); wire(n, 0, 2, 5); put(n, 0, 6, 'R', 'M0.0'); n.cmt = 'Réarmement (seulement si le thermique est revenu)'; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', 'M0.0'); wire(n, 0, 1, 5); put(n, 0, 6, 'C', io.fault); n.cmt = 'Voyant défaut'; nets.push(n);
    }
    if (h('cnt')) {
      n = net(1); put(n, 0, 0, 'NO', io.km); put(n, 0, 1, 'P', io.sensor); wire(n, 0, 2, 5); put(n, 0, 6, 'CTU', 'C0', p.N); n.cmt = `Comptage des objets pendant la marche (${p.N})`; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', io.reset); wire(n, 0, 1, 5); put(n, 0, 6, 'R', 'C0'); n.cmt = 'Remise à zéro du compteur'; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', 'C0'); wire(n, 0, 1, 5); put(n, 0, 6, 'C', io.done); n.cmt = 'Voyant lot terminé'; nets.push(n);
    }
    n = net(1); let c = 0;
    put(n, 0, c++, p.stopNC ? 'NO' : 'NC', io.stop);
    if (h('au')) put(n, 0, c++, 'NO', io.au);
    if (h('th')) { put(n, 0, c++, 'NO', io.th); put(n, 0, c++, 'NC', 'M0.0'); }
    if (h('cnt')) put(n, 0, c++, 'NC', 'C0');
    wire(n, 0, c, 5); put(n, 0, 6, 'C', 'M0.3'); n.cmt = 'Autorisation de marche (arrêt prioritaire, sécurités)'; nets.push(n);
    if (h('pre')) {
      n = net(2); put(n, 0, 0, 'NO', io.start); put(n, 1, 0, 'NO', 'M0.2'); n.v.push('0,1'); put(n, 0, 1, 'NC', io.km); put(n, 0, 2, 'NC', 'T0'); put(n, 0, 3, 'NO', 'M0.3'); wire(n, 0, 4, 5); put(n, 0, 6, 'C', 'M0.2'); n.cmt = 'Préavis en cours'; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', 'M0.2'); wire(n, 0, 1, 5); put(n, 0, 6, 'TON', 'T0', p.Tp); n.cmt = `Durée du préavis (${p.Tp} s)`; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', 'M0.2'); wire(n, 0, 1, 5); put(n, 0, 6, 'C', io.horn); n.cmt = 'Klaxon'; nets.push(n);
      n = net(2); put(n, 0, 0, 'NO', 'T0'); put(n, 1, 0, 'NO', io.km); n.v.push('0,1'); put(n, 0, 1, 'NO', 'M0.3'); wire(n, 0, 2, 5); put(n, 0, 6, 'C', io.km); n.cmt = 'Moteur : démarrage en fin de préavis, auto-maintien'; nets.push(n);
    } else {
      n = net(2); put(n, 0, 0, 'NO', io.start); put(n, 1, 0, 'NO', io.km); n.v.push('0,1'); put(n, 0, 1, 'NO', 'M0.3'); wire(n, 0, 2, 5); put(n, 0, 6, 'C', io.km); n.cmt = 'Moteur : marche et auto-maintien'; nets.push(n);
    }
    if (h('tim')) {
      n = net(1); put(n, 0, 0, 'NO', io.km); wire(n, 0, 1, 5); put(n, 0, 6, 'TON', 'T1', p.Td); n.cmt = `Temporisation du voyant (${p.Td} s)`; nets.push(n);
      n = net(1); put(n, 0, 0, 'NO', 'T1'); wire(n, 0, 1, 5); put(n, 0, 6, 'C', io.lamp); n.cmt = 'Voyant en production'; nets.push(n);
    }
    return nets;
  };

  /* ---------------- Rendu SVG d'un programme ---------------- */
  const sym = (cell) => {
    const t = cell.t;
    if (t === 'H') return `<line x1="0" y1="0" x2="${CW}" y2="0"/>`;
    if (['NO', 'NC', 'P', 'N'].includes(t)) return `<line x1="0" y1="0" x2="${CW / 2 - 9}" y2="0"/><line x1="${CW / 2 + 9}" y1="0" x2="${CW}" y2="0"/><line x1="${CW / 2 - 9}" y1="-13" x2="${CW / 2 - 9}" y2="13"/><line x1="${CW / 2 + 9}" y1="-13" x2="${CW / 2 + 9}" y2="13"/>` +
      (t === 'NC' ? `<line x1="${CW / 2 - 12}" y1="12" x2="${CW / 2 + 12}" y2="-12"/>` : '') + (t === 'P' || t === 'N' ? `<text class="lbl" x="${CW / 2}" y="4" text-anchor="middle">${t}</text>` : '');
    if (['C', 'S', 'R'].includes(t)) return `<line x1="0" y1="0" x2="${CW / 2 - 13}" y2="0"/><path d="M${CW / 2 - 6} -13 A16 16 0 0 0 ${CW / 2 - 6} 13 M${CW / 2 + 6} -13 A16 16 0 0 1 ${CW / 2 + 6} 13"/>` + (t !== 'C' ? `<text class="lbl" x="${CW / 2}" y="4" text-anchor="middle">${t}</text>` : '');
    return `<line x1="0" y1="0" x2="14" y2="0"/><rect x="14" y="-20" width="${CW - 22}" height="40" rx="4"/><text class="lbl" x="${CW / 2 + 4}" y="-4" text-anchor="middle">${t}</text><text class="cmt" x="${CW / 2 + 4}" y="12" text-anchor="middle">${t === 'CTU' ? 'PV=' + cell.p : 'PT=' + cell.p + ' s'}</text>`;
  };
  LAD.render = (prog, opts) => {
    opts = opts || {};
    const names = opts.names || {};
    let y = 10, s = '';
    prog.forEach((net, ni) => {
      const top = y + 18, H = net.rows * RH;
      s += `<text class="rn" x="4" y="${y + 12}">R${ni + 1}</text><text class="cmt" x="${X0 + 6}" y="${y + 12}">${esc(net.cmt || '')}</text>`;
      s += `<line class="rail" x1="${X0}" y1="${top}" x2="${X0}" y2="${top + H}"/><line class="rail" x1="${X0 + COLS * CW}" y1="${top}" x2="${X0 + COLS * CW}" y2="${top + H}"/>`;
      const fl = opts.flows && opts.flows[ni];
      for (let r = 0; r < net.rows; r++) for (let c = 0; c < COLS; c++) {
        const x = X0 + c * CW, ym = top + r * RH + RH / 2, cell = net.cells[r][c];
        if (cell && cell.t) {
          const pw = fl && (c === COLS - 1 ? fl.inb[r][c] : fl.out[r][c]) ? ' pw' : '';
          s += `<g class="el${pw}" transform="translate(${x},${ym})">${sym(cell)}</g>`;
          if (cell.a && cell.t !== 'H') {
            s += `<text class="lbl" x="${x + CW / 2}" y="${ym - 22}" text-anchor="middle">${esc(cell.a)}</text>`;
            const nm = names[cell.a]; if (nm) s += `<text class="cmt" x="${x + CW / 2}" y="${ym + 28}" text-anchor="middle">${esc(nm.length > 16 ? nm.slice(0, 15) + '…' : nm)}</text>`;
          }
          if (c === COLS - 1) s += `<line class="vl" x1="${x + CW / 2 + 22}" y1="${ym}" x2="${X0 + COLS * CW}" y2="${ym}"/>`;
        }
        if (opts.edit) s += `<rect class="cell" data-n="${ni}" data-r="${r}" data-c="${c}" x="${x + 2}" y="${top + r * RH + 2}" width="${CW - 4}" height="${RH - 4}" rx="6"/>`;
      }
      net.v.forEach(k => {
        const [r, c] = k.split(',').map(Number); if (r >= net.rows - 1) return;
        const x = X0 + c * CW; const pw = fl && fl.inb[r][c] ? ' pw' : '';
        s += `<line class="vl${pw}" x1="${x}" y1="${top + r * RH + RH / 2}" x2="${x}" y2="${top + (r + 1) * RH + RH / 2}"/>`;
      });
      y = top + H + 14;
    });
    return { svg: `<svg class="ladder" width="${X0 + COLS * CW + 20}" height="${y + 6}" viewBox="0 0 ${X0 + COLS * CW + 20} ${y + 6}">${s}</svg>`, h: y };
  };

  /* ---------------- Éditeur + simulateur ---------------- */
  const TOOLS = [['NO', 'Contact NO'], ['NC', 'Contact NF'], ['P', 'Front montant'], ['N', 'Front descendant'], ['H', 'Fil'], ['V', 'Lien vertical'], ['C', 'Bobine'], ['S', 'Bobine SET'], ['R', 'Bobine RESET'], ['TON', 'Tempo travail'], ['TOF', 'Tempo repos'], ['CTU', 'Compteur'], ['X', 'Gomme']];
  const toolIcon = t => ({ NO: '<svg viewBox="0 0 34 22"><path d="M0 11h12M22 11h12M12 3v16M22 3v16"/></svg>', NC: '<svg viewBox="0 0 34 22"><path d="M0 11h12M22 11h12M12 3v16M22 3v16M10 18l14-14"/></svg>', V: '<svg viewBox="0 0 34 22"><path d="M17 1v20M8 1h9M17 21h9"/></svg>', H: '<svg viewBox="0 0 34 22"><path d="M0 11h34"/></svg>', C: '<svg viewBox="0 0 34 22"><path d="M13 3a9 9 0 0 0 0 16M21 3a9 9 0 0 1 0 16"/></svg>', X: AA.ic.trash })[t] || `<span>${t}</span>`;

  LAD.editor = (host, o) => {
    o = o || {};
    let prog = o.prog || [{ rows: 2, cells: [new Array(COLS).fill(null), new Array(COLS).fill(null)], v: [], cmt: '' }];
    let tool = 'NO', addr = 'I0.0', preset = 3, running = false, mem = LAD.newMem(), flows = null, tick = 0;
    const names = o.names || {};
    const inputs = o.inputs || ADDR.filter(a => a[0] === 'I').map(a => ({ a, n: names[a] || a, kind: 'pb' }));
    const logic = {};
    host.innerHTML = `<div class="plc"><div><div class="ladder-wrap"><div class="palette">${TOOLS.map(([t, n]) => `<button data-t="${t}" title="${n}" class="${t === tool ? 'on' : ''}">${toolIcon(t)}</button>`).join('')}
        <select class="sel js-addr">${ADDR.map(a => `<option value="${a}">${a}${names[a] ? ' — ' + esc(names[a]) : ''}</option>`).join('')}</select>
        <label class="pre">PT/PV <input class="js-pre" type="number" min="0.1" step="0.1" value="3"></label>
        <span class="spacer"></span><button class="btn sm js-addnet">${ic.plus}Réseau</button><button class="btn sm js-addrow">${ic.plus}Ligne</button></div>
        <div class="js-lad"></div></div></div>
      <aside class="wb-side"><div class="card"><div class="row"><button class="btn primary js-run">${ic.play}RUN</button><span class="scan js-scan">STOP</span></div>
        <p class="eyebrow" style="margin-top:14px">Entrées</p><div class="io-panel js-in"></div>
        <p class="eyebrow" style="margin-top:14px">Sorties</p><div class="io-panel js-out"></div></div>
        ${o.process ? '<div class="card proc"><p class="eyebrow">Procédé</p><div class="js-proc"></div></div>' : ''}
        ${o.side || ''}</aside></div>`;
    const lad = host.querySelector('.js-lad');
    const draw = () => { lad.innerHTML = LAD.render(prog, { edit: true, flows: running ? flows : null, names }).svg; };
    draw();
    host.querySelectorAll('.palette [data-t]').forEach(b => b.onclick = () => {
      tool = b.dataset.t; host.querySelectorAll('.palette [data-t]').forEach(x => x.classList.toggle('on', x === b));
      if (['TON', 'TOF'].includes(tool) && addr[0] !== 'T') { addr = 'T0'; host.querySelector('.js-addr').value = 'T0'; }
      if (tool === 'CTU' && addr[0] !== 'C') { addr = 'C0'; host.querySelector('.js-addr').value = 'C0'; }
    });
    host.querySelector('.js-addr').onchange = e => { addr = e.target.value; };
    host.querySelector('.js-pre').onchange = e => { preset = Math.max(0.1, +e.target.value || 1); };
    host.querySelector('.js-addnet').onclick = () => { prog.push({ rows: 1, cells: [new Array(COLS).fill(null)], v: [], cmt: '' }); draw(); };
    host.querySelector('.js-addrow').onclick = () => { const n = prog[prog.length - 1]; if (n.rows < 4) { n.rows++; n.cells.push(new Array(COLS).fill(null)); draw(); } };
    lad.addEventListener('click', e => {
      const c = e.target.closest('.cell'); if (!c) return;
      const net = prog[+c.dataset.n], r = +c.dataset.r, col = +c.dataset.c;
      if (tool === 'V') { const k = r + ',' + col; if (r >= net.rows - 1 || col === 0) { AA.toast('Un lien vertical relie une ligne à la ligne du dessous, à gauche d\'une case (pas sur la colonne 1).'); return; } const i = net.v.indexOf(k); i >= 0 ? net.v.splice(i, 1) : net.v.push(k); draw(); return; }
      if (tool === 'X') { net.cells[r][col] = null; if (net.cells.every(row => row.every(x => !x)) && prog.length > 1 && net.rows === 1) prog.splice(+c.dataset.n, 1); draw(); return; }
      const isCoil = ['C', 'S', 'R', 'TON', 'TOF', 'CTU'].includes(tool);
      if (isCoil !== (col === COLS - 1)) { AA.toast(isCoil ? 'Les bobines et blocs se placent dans la dernière colonne (à droite).' : 'Les contacts se placent dans les colonnes 1 à 6, pas dans celle des bobines.'); return; }
      if (['TON', 'TOF'].includes(tool) && addr[0] !== 'T') { AA.toast('Une temporisation utilise une adresse T0 à T3.'); return; }
      if (tool === 'CTU' && addr[0] !== 'C') { AA.toast('Un compteur utilise une adresse C0 à C3.'); return; }
      if (tool === 'C' && addr[0] === 'I') { AA.toast('On n\'écrit pas dans une entrée : choisis une sortie Q ou une mémoire M.'); return; }
      net.cells[r][col] = tool === 'H' ? { t: 'H' } : Object.assign({ t: tool, a: addr }, ['TON', 'TOF', 'CTU'].includes(tool) ? { p: tool === 'CTU' ? Math.max(1, Math.round(preset)) : preset } : {});
      draw();
    });
    // entrées
    const inBox = host.querySelector('.js-in');
    inBox.innerHTML = inputs.map(x => `<div class="io" data-a="${x.a}" data-k="${x.kind}"><i class="led"></i>${x.a}<small>${esc(x.n)}</small></div>`).join('');
    inBox.querySelectorAll('.io').forEach(el => {
      const x = inputs.find(i => i.a === el.dataset.a);
      if (x.kind === 'sw') el.onclick = () => { logic[x.a] = !logic[x.a]; };
      else { el.addEventListener('pointerdown', e => { logic[x.a] = true; try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignorer */ } }); el.addEventListener('pointerup', () => { logic[x.a] = false; }); el.addEventListener('pointercancel', () => { logic[x.a] = false; }); }
    });
    const outs = o.outputs || ADDR.filter(a => a[0] === 'Q').map(a => ({ a, n: names[a] || a }));
    host.querySelector('.js-out').innerHTML = outs.map(x => `<div class="io out" data-a="${x.a}"><i class="led"></i>${x.a}<small>${esc(x.n)}</small></div>`).join('');
    const proc = o.process ? o.process(host.querySelector('.js-proc')) : null;
    const physical = () => {
      const I = {};
      inputs.forEach(x => { const v = !!logic[x.a] || (proc && proc.inputs && proc.inputs()[x.a]); I[x.a] = x.nc ? !v : v; });
      return I;
    };
    let scans = 0;
    const loop = () => {
      if (!host.isConnected) { clearInterval(tick); return; }
      const I = physical();
      Object.keys(mem.b).forEach(a => { if (a[0] === 'I') delete mem.b[a]; });
      Object.assign(mem.b, I);
      flows = LAD.scan(prog, mem, 0.02);
      scans++;
      if (proc) proc.step(mem, 0.02);
      if (scans % 3 === 0) {
        draw();
        inBox.querySelectorAll('.io').forEach(el => { const on = !!mem.b[el.dataset.a]; el.classList.toggle('on', on); el.querySelector('.led').classList.toggle('on', on); });
        host.querySelectorAll('.js-out .io').forEach(el => { const on = !!mem.b[el.dataset.a]; el.classList.toggle('on', on); el.querySelector('.led').classList.toggle('warn', on); });
        host.querySelector('.js-scan').textContent = `RUN · cycle 20 ms · ${scans} cycles`;
      }
    };
    host.querySelector('.js-run').onclick = e => {
      running = !running;
      e.currentTarget.innerHTML = running ? `${ic.stop}STOP` : `${ic.play}RUN`;
      if (running) { mem = LAD.newMem(); scans = 0; if (proc && proc.reset) proc.reset(); tick = setInterval(loop, 20); }
      else { clearInterval(tick); host.querySelector('.js-scan').textContent = 'STOP'; host.querySelectorAll('.io .led').forEach(l => l.classList.remove('on', 'warn')); draw(); }
    };
    return { get prog() { return prog; }, set prog(p) { prog = p; draw(); }, stop() { clearInterval(tick); } };
  };

  /* Procédé animé : convoyeur avec cartons, capteur de fin, klaxon, voyants */
  LAD.conveyor = (p) => el => {
    const io = p.io;
    let boxes = [], tAcc = 0, sensor = false, phase = 0;
    const c = AA.canvas(el, 170, (g, W, H, t) => {
      g.fillStyle = AA.css('--surface-3'); g.fillRect(16, 100, W - 32, 16);
      g.fillStyle = AA.css('--line-2'); for (let x = 16 - (phase % 24); x < W - 16; x += 24) g.fillRect(Math.max(16, x), 100, 3, 16);
      boxes.forEach(b => { g.fillStyle = '#c8945c'; g.fillRect(b.x, 72, 28, 28); g.strokeStyle = '#8a5f33'; g.strokeRect(b.x, 72, 28, 28); });
      const sx = W - 60;
      g.fillStyle = sensor ? AA.css('--ok') : AA.css('--ink-3'); g.fillRect(sx, 50, 10, 16); g.strokeStyle = sensor ? AA.css('--ok') : 'rgba(255,255,255,.15)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(sx + 5, 66); g.lineTo(sx + 5, 100); g.stroke(); g.setLineDash([]);
      const m = window.__plcMem || { b: {} };
      const km = !!m.b[io.km];
      g.fillStyle = km ? AA.css('--ok') : AA.css('--surface-3'); g.beginPath(); g.arc(30, 140, 14, 0, 7); g.fill(); g.fillStyle = AA.css('--ink'); g.font = '700 11px Bahnschrift'; g.fillText('M', 26, 144);
      const lamps = [['horn', 'HA1', '#ffb43a'], ['lamp', 'H1', '#3fd68e'], ['fault', 'H2', '#ff5d6c'], ['done', 'H3', '#5aa6ff']];
      let x = 70;
      lamps.forEach(([k, n, col]) => { if (!io[k]) return; const on = !!m.b[io[k]]; g.fillStyle = on ? col : AA.css('--surface-3'); g.shadowColor = col; g.shadowBlur = on ? 14 : 0; g.beginPath(); g.arc(x, 140, 10, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = AA.css('--ink-3'); g.font = '600 10px Bahnschrift'; g.fillText(n, x - 8, 164); x += 46; });
      if (io.horn && m.b[io.horn]) { g.strokeStyle = '#ffb43a'; for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(70, 140, 12 + k * 6 + (t * 20 % 6), -0.7, 0.7); g.stroke(); } }
      g.fillStyle = AA.css('--ink-3'); g.font = '500 11px Segoe UI'; g.fillText('B1', sx - 2, 44);
    });
    return {
      inputs: () => (io.sensor ? { [io.sensor]: sensor } : {}),
      reset: () => { boxes = []; tAcc = 0; },
      step: (mem, dt) => {
        window.__plcMem = mem;
        const km = !!mem.b[io.km];
        const W = el.clientWidth || 300, sx = W - 60;
        if (km) { phase += 60 * dt; tAcc += dt; if (tAcc > 1.4) { tAcc = 0; boxes.push({ x: 20 }); } boxes.forEach(b => { b.x += 60 * dt; }); }
        sensor = boxes.some(b => b.x + 28 > sx && b.x < sx + 10);
        boxes = boxes.filter(b => b.x < W - 20);
      },
      stop: c.stop
    };
  };

  /* ---------------- Vues ---------------- */
  AA.route('automate', main => {
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Automate programmable</p><h1>Programmer en Ladder</h1><p>Place des contacts et des bobines, relie les branches, passe en RUN : le cycle de l'automate (lecture des entrées, traitement, écriture des sorties) s'exécute toutes les 20 ms, le courant logique apparaît en vert.</p></div>
      <a class="btn primary" href="#/defi/automate/${Date.now()}">${ic.trophy}Cahier des charges</a></div>
      <div class="js-ed"></div>`;
    const names = { 'I0.0': 'S1 Arrêt (NF)', 'I0.1': 'S2 Marche', 'Q0.0': 'KM1 moteur' };
    const ex = [{ rows: 2, cells: [[{ t: 'NO', a: 'I0.1' }, { t: 'NO', a: 'I0.0' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'C', a: 'Q0.0' }], [{ t: 'NO', a: 'Q0.0' }, null, null, null, null, null, null]], v: ['0,1'], cmt: 'Exemple : marche/arrêt avec auto-maintien (S1 câblé NF)' }];
    const ed = LAD.editor(main.querySelector('.js-ed'), { prog: ex, names, inputs: [{ a: 'I0.0', n: 'S1 Arrêt (NF)', kind: 'pb', nc: true }, { a: 'I0.1', n: 'S2 Marche', kind: 'pb' }].concat(['I0.2', 'I0.3', 'I0.4', 'I0.5'].map(a => ({ a, n: 'interrupteur', kind: 'sw' }))) });
    return { leave: () => ed.stop() };
  });

  AA.Defis.TYPES.automate = {
    name: 'Automatisme sur cahier des charges', icon: 'plc', min: 1,
    desc: 'Un fonctionnement décrit en texte, des entrées-sorties attribuées au hasard : écris le programme Ladder. Il est testé sur une douzaine de scénarios, dont des séquences aléatoires.',
    gen(r, lvl) { return LAD.genSpec(r, lvl); },
    play(main, p, done) {
      const io = p.io, names = {};
      Object.entries(io).forEach(([k, a]) => { names[a] = LAD.NAMES[k].split(' (')[0]; });
      const inputs = Object.entries(io).filter(([, a]) => a[0] === 'I').map(([k, a]) => ({ a, n: LAD.NAMES[k], kind: k === 'au' || k === 'th' ? 'sw' : 'pb', nc: (k === 'stop' && p.stopNC) || k === 'au' || k === 'th' })).filter(x => !(x.a === io.sensor));
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Automatisme · ${['', 'Initiation', 'Confirmé', 'Avancé', 'Expert', 'Maître'][p.lvl]}</p><h1>Cahier des charges</h1></div></div>
        <div class="grid g2"><div class="brief cdc-text">${LAD.specText(p)}</div>
        <div class="card"><p class="eyebrow">Table des entrées-sorties</p><table class="t iot">${Object.entries(io).sort((a, b) => a[1].localeCompare(b[1])).map(([k, a]) => `<tr><td class="mono">${a}</td><td>${esc(LAD.NAMES[k])}</td></tr>`).join('')}</table>
          <p class="muted" style="font-size:13px">Dans le simulateur : AU et thermique sont des interrupteurs (clic = actionné). Le capteur est piloté par le procédé (les cartons du tapis).</p>
          <div class="row"><button class="btn primary js-grade">${ic.check}Soumettre au banc d'essai</button><button class="btn ghost js-sol">Solution de référence</button></div><div class="js-fb"></div></div></div>
        <div class="js-ed" style="margin-top:14px"></div>`;
      const ed = LAD.editor(main.querySelector('.js-ed'), { names, inputs, outputs: Object.entries(io).filter(([, a]) => a[0] === 'Q').map(([k, a]) => ({ a, n: LAD.NAMES[k] })), process: LAD.conveyor(p) });
      let solShown = false, finished = false;
      main.querySelector('.js-grade').onclick = () => {
        const res = LAD.grade(ed.prog, p);
        const good = res.filter(x => x.ok).length, score = Math.round(good / res.length * 100) - (solShown ? 50 : 0);
        const f = res.find(x => !x.ok);
        main.querySelector('.js-fb').innerHTML = `<div class="result ${good === res.length ? 'win' : ''}"><div class="score-big">${Math.max(0, score)}</div><p>${good}/${res.length} scénarios réussis.</p>
          <div class="log" style="text-align:left">${res.map(x => `${x.ok ? '✔' : '✘'} ${esc(x.n)}${x.fail ? ` — à t = ${AA.fmt(x.fail.t, 1)} s, ${x.fail.a} (${esc(names[x.fail.a] || '')}) devrait être à ${x.fail.want ? 1 : 0}` : ''}`).join('<br>')}</div>
          ${f ? '<p class="muted">Corrige ton programme et soumets de nouveau.</p>' : `<div class="row"><a class="btn primary" href="#/defi/automate/${Date.now()}/${p.lvl}">Nouveau cahier des charges</a></div>`}</div>`;
        if (!f && !finished) { finished = true; done(Math.max(0, score)); }
      };
      main.querySelector('.js-sol').onclick = () => {
        solShown = true;
        const m = AA.modal(`<h2>Solution de référence</h2><p class="muted">Une solution possible parmi d'autres (une solution différente qui passe tous les scénarios est tout aussi juste). Voir la solution divise par deux le score.</p><div class="ladder-wrap" style="max-height:60vh">${LAD.render(LAD.refProgram(p), { names }).svg}</div><div class="row" style="margin-top:12px"><button class="btn js-load">Charger dans l'éditeur</button><button class="btn primary" data-close>Fermer</button></div>`, { cls: 'wide' });
        m.el.querySelector('.js-load').onclick = () => { ed.prog = JSON.parse(JSON.stringify(LAD.refProgram(p))); m.close(); };
      };
      return { leave: () => ed.stop() };
    }
  };

  LAD.selfTest = (log, eq) => {
    // 1. auto-maintien élémentaire
    const prog = [{ rows: 2, cells: [[{ t: 'NO', a: 'I0.1' }, { t: 'NO', a: 'I0.0' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'C', a: 'Q0.0' }], [{ t: 'NO', a: 'Q0.0' }, null, null, null, null, null, null]], v: ['0,1'] }];
    const m = LAD.newMem();
    const run = (I) => { Object.assign(m.b, I); LAD.scan(prog, m, 0.02); return !!m.b['Q0.0']; };
    const seq = [run({ 'I0.0': 1, 'I0.1': 0 }), run({ 'I0.0': 1, 'I0.1': 1 }), run({ 'I0.0': 1, 'I0.1': 0 }), run({ 'I0.0': 0, 'I0.1': 0 }), run({ 'I0.0': 1, 'I0.1': 0 })];
    eq(seq, [false, true, true, false, false], 'Automate : auto-maintien, arrêt NF câblé');
    // 2. TON
    const p2 = [{ rows: 1, cells: [[{ t: 'NO', a: 'I0.0' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'H' }, { t: 'TON', a: 'T0', p: 1 }]], v: [] }];
    const m2 = LAD.newMem(); m2.b['I0.0'] = true; let k = 0; while (!LAD.bit(m2, 'T0') && k < 200) { LAD.scan(p2, m2, 0.02); k++; }
    eq(k, 50, 'Automate : TON de 1 s → 50 cycles de 20 ms');
    // 3. Solutions de référence : elles doivent réussir tous les scénarios, pour toutes les combinaisons
    let allOk = true, why = '';
    for (let i = 0; i < 60 && allOk; i++) {
      const p = LAD.genSpec(AA.rng('lad' + i), 1 + (i % 5));
      const res = LAD.grade(LAD.refProgram(p), p);
      const f = res.find(x => !x.ok);
      if (f) { allOk = false; why = `${p.feats.join('+')} stopNC=${p.stopNC} : ${f.n} t=${f.fail.t} ${f.fail.a}`; }
    }
    log(allOk, 'Automate : 60 cahiers des charges, la solution de référence passe tous les scénarios ' + why);
    // 4. un programme faux est bien détecté (marche sans auto-maintien)
    const p = LAD.genSpec(AA.rng('ladbad'), 1);
    const bad = LAD.refProgram(p); bad[bad.length - 1].v = [];
    log(LAD.grade(bad, p).some(x => !x.ok), 'Automate : un programme sans auto-maintien est refusé par le banc d\'essai');
  };
})();
