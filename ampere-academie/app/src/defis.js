/* Ampère Académie — moteur de défis aléatoires.
 * Chaque générateur reçoit (rng, niveau 1..5) et produit une instance unique ; une signature est mémorisée
 * pour ne jamais reproposer le même défi. Types : panne (diagnostic au multimètre), logique (prédire l'état),
 * calcul (dimensionner une canalisation), cdc (cahier des charges à plusieurs solutions).
 * Les grands projets industriels sont dans projets.js, les cahiers des charges d'automatisme dans ladder.js. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const S = AA.state;
  const { Sim } = window.AASim;
  const C = window.AACircuits.C;
  const T = AA.TECH;
  S.defis = S.defis || {};
  S.defisSig = S.defisSig || [];

  const D = AA.Defis = { TYPES: {} };
  D.levelFor = () => Math.min(5, 1 + Math.floor(AA.rankIndex(S.xp) / 2.2));
  const LVL = ['', 'Initiation', 'Confirmé', 'Avancé', 'Expert', 'Maître'];

  /* Génère une instance inédite (signature jamais vue parmi les 150 dernières) */
  D.make = (type, seed, lvl) => {
    const g = D.TYPES[type];
    let inst = null;
    for (let k = 0; k < 25; k++) {
      inst = g.gen(AA.rng(seed + '#' + k), lvl);
      if (!S.defisSig.includes(type + ':' + inst.sig)) break;
    }
    return inst;
  };
  D.remember = (type, inst) => { S.defisSig.push(type + ':' + inst.sig); if (S.defisSig.length > 150) S.defisSig.splice(0, S.defisSig.length - 150); AA.save(); };
  D.record = (type, score, lvl) => {
    const d = S.defis[type] = S.defis[type] || { n: 0, best: 0, total: 0 };
    d.n++; d.best = Math.max(d.best, score); d.total += score; AA.save();
    const xp = Math.round(score / 100 * (25 + 20 * lvl));
    if (xp) AA.addXP(xp, 'Défi ' + D.TYPES[type].name);
  };

  /* =====================================================================
   * 1. PANNE — diagnostic sur un schéma vivant
   * ===================================================================== */
  const FAULTS_BY_TYPE = {
    pb_no: ['open', 'stuck'], pb_nc: ['open', 'stuck'], no: ['open', 'stuck'], nc: ['open', 'stuck'],
    th_nc: ['open', 'stuck'], th_no: ['open', 'stuck'], sw1: ['open', 'stuck'], fuse: ['open'], cb: ['open'],
    sw2: ['open'], coil: ['open'], telerupt: ['open'], lamp: ['burnt'], km3: ['pole', 'stuck'], thermal3: ['open'], motor3: ['open']
  };
  const FAULT_TXT = { open: 'coupé / ouvert (contact, fil ou bobine interrompu)', stuck: 'soudé / collé (reste fermé)', burnt: 'lampe grillée', pole: 'un pôle de puissance usé (ne ferme plus)' };
  /* Séquences d'essai : ce que fait un opérateur pour constater le fonctionnement */
  const SEQ = {
    simple: [['init', 'au repos'], ['toggle:S1', 'quand on bascule l\'interrupteur S1'], ['toggle:S1', 'quand on rebascule S1']],
    vaetvient: [['init', 'au repos'], ['toggle:SA1', 'quand on manœuvre SA1'], ['toggle:SA2', 'quand on manœuvre ensuite SA2'], ['toggle:SA1', 'quand on manœuvre de nouveau SA1']],
    telerupteur: [['init', 'au repos'], ['pulse:S1', 'après un appui sur S1'], ['pulse:S2', 'après un appui sur S2'], ['pulse:S3', 'après un appui sur S3']],
    dol: [['init', 'à la mise sous tension'], ['hold:S2', 'pendant l\'appui sur Marche (S2)'], ['release:S2', 'quand on relâche Marche'], ['wait', 'après quelques secondes de marche'], ['pulse:S1', 'après un appui sur Arrêt (S1)']],
    etoile: [['init', 'à la mise sous tension'], ['pulse:S2', 'juste après un appui sur Marche (S2)'], ['wait', 'au bout de quelques secondes'], ['pulse:S1', 'après un appui sur Arrêt (S1)']],
    inversion: [['init', 'à la mise sous tension'], ['pulse:S2', 'après un appui sur Avant (S2)'], ['wait', 'après quelques secondes'], ['pulse:S3', 'quand on appuie sur Arrière (S3) sans arrêter'], ['pulse:S1', 'après un appui sur Arrêt (S1)'], ['pulse:S3', 'après un appui sur Arrière (S3)'], ['wait', 'après quelques secondes'], ['pulse:S1', 'après un nouvel arrêt']]
  };
  function runSeq(cid, faults) {
    const s = new Sim(C[cid]);
    faults.forEach(f => s.setFault(f.id, f.f));
    const out = [];
    const adv = t => { for (let i = 0; i < t * 25; i++) s.step(0.04); };
    for (const [a, lab] of SEQ[cid]) {
      const [op, id] = a.split(':');
      if (op === 'toggle') s.toggle(id);
      if (op === 'hold') s.press(id, true);
      if (op === 'release') s.press(id, false);
      if (op === 'pulse') { s.press(id, true); adv(0.3); s.press(id, false); }
      adv(op === 'wait' ? 4.5 : 0.3);
      out.push({ lab, snap: s.snapshot() });
    }
    return out;
  }
  const nameOf = id => ({ E1: 'la lampe', H1: 'le voyant Marche H1', H2: 'le voyant Défaut H2', M1: 'le moteur' })[id] || id;
  function symptoms(ref, bad) {
    const out = [];
    for (let i = 0; i < ref.length && out.length < 2; i++) {
      const r = ref[i].snap, b = bad[i].snap, lab = ref[i].lab, parts = [];
      for (const m in r.motors) {
        if (r.motors[m] === b.motors[m]) continue;
        if (b.motors[m] === 'mono') parts.push('le moteur grogne et vibre sans démarrer franchement');
        else if (r.motors[m] === 'run+D' && b.motors[m] === 'run+Y') parts.push('le moteur reste en étoile : il ne passe jamais en triangle et peine en charge');
        else if (r.motors[m] === 'run+Y' && b.motors[m] === 'run+D') parts.push('le moteur démarre directement en triangle avec un fort appel de courant');
        else if (r.motors[m].startsWith('run') && b.motors[m] === 'stop') parts.push('le moteur ne tourne pas');
        else if (r.motors[m] === 'stop' && b.motors[m].startsWith('run')) parts.push('le moteur tourne alors qu\'il devrait être arrêté');
        else if (r.motors[m] !== b.motors[m]) parts.push('le moteur tourne dans le mauvais sens');
      }
      for (const l in r.lamps) if (r.lamps[l] !== b.lamps[l]) parts.push(nameOf(l) + (b.lamps[l] ? ' est allumé' + (l === 'E1' ? 'e' : '') + ' alors qu\'' + (l === 'E1' ? 'elle' : 'il') + ' devrait être éteint' + (l === 'E1' ? 'e' : '') : ' reste éteint' + (l === 'E1' ? 'e' : '')));
      const newTrips = b.trips.filter(t => !r.trips.includes(t));
      newTrips.forEach(t => parts.push(t === 'Q1' ? 'le disjoncteur Q1 déclenche' : t === 'F2' ? 'le relais thermique F2 déclenche' : t + ' déclenche'));
      if (!parts.length) for (const c in r.coils) if (r.coils[c] !== b.coils[c]) parts.push(`le contacteur ${c} ${b.coils[c] ? 'est collé' : 'ne colle pas'}`);
      if (parts.length) out.push(lab.charAt(0).toUpperCase() + lab.slice(1) + ', ' + parts.slice(0, 2).join(' et ') + '.');
    }
    return out;
  }
  const differs = (a, b) => JSON.stringify(a.map(x => x.snap)) !== JSON.stringify(b.map(x => x.snap));

  D.TYPES.panne = {
    name: 'Diagnostic de panne', icon: 'bug', min: 1,
    desc: 'Une installation ne fonctionne plus. Reproduis le symptôme, mesure, raisonne sur le schéma et désigne l\'appareil défaillant.',
    gen(r, lvl) {
      const pool = lvl <= 1 ? ['simple', 'vaetvient', 'telerupteur'] : lvl === 2 ? ['telerupteur', 'dol', 'vaetvient'] : lvl === 3 ? ['dol', 'inversion'] : ['dol', 'inversion', 'etoile', 'etoile'];
      const cid = r.pick(pool);
      const parts = C[cid].parts.filter(p => FAULTS_BY_TYPE[p.type] && !(p.type === 'breaker3'));
      const ref = runSeq(cid, []);
      const nf = lvl >= 5 ? 2 : (lvl >= 4 && r() < 0.5 ? 2 : 1);
      let faults = [];
      for (let k = 0; k < 60 && faults.length < nf; k++) {
        const p = r.pick(parts), f = r.pick(FAULTS_BY_TYPE[p.type]);
        if (faults.some(x => x.id === p.id)) continue;
        const cand = faults.concat([{ id: p.id, f }]);
        const alone = runSeq(cid, [{ id: p.id, f }]);
        if (!differs(ref, alone)) continue; // panne invisible : on n'en veut pas
        if (cand.length > 1 && !differs(runSeq(cid, faults), runSeq(cid, cand))) continue; // la 2e panne doit changer quelque chose
        faults = cand;
      }
      const bad = runSeq(cid, faults);
      const sy = symptoms(ref, bad);
      const site = r.pick(T.SITES), who = r.pick(T.WHO), when = r.pick(T.WHEN);
      const budget = lvl >= 5 ? 10 : lvl >= 4 ? 14 : null;
      const time = lvl >= 4 ? (lvl >= 5 ? 360 : 480) : null;
      return { cid, faults, sy, site, who, when, budget, time, lvl, sig: cid + faults.map(f => f.id + f.f).join('') + site.length };
    },
    play(main, inst, done) {
      const c = C[inst.cid];
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Diagnostic de panne · ${LVL[inst.lvl]}</p><h1>Panne sur « ${esc(c.title)} »</h1></div>
        <div class="row">${inst.time ? `<span class="timer js-timer"></span>` : ''}${inst.budget ? `<span class="chip copper js-budget"></span>` : ''}</div></div>
        <div class="brief"><b>${esc(inst.who)}</b> ${esc(AA.de(inst.site))} signale, ${esc(inst.when)} : « ${inst.sy.join(' ')} »
        ${inst.faults.length > 1 ? '<br><b>Attention :</b> le dossier d\'intervention précise que <b>deux défauts</b> peuvent coexister.' : ''}
        ${inst.budget ? `<br>Le client facture l'immobilisation : tu disposes d'au plus <b>${inst.budget} mesures</b>.` : ''}</div>
        <div class="workbench" style="margin-top:14px"><div class="wb-host"></div><aside class="wb-side">
          <div class="card"><p class="eyebrow">Méthode conseillée</p><ol class="steps"><li>Reproduis le symptôme en manœuvrant.</li><li>Passe en <b>Multimètre</b> : pointe noire sur N, remonte la tension.</li><li>Un contact fermé : 0 V à ses bornes. Ouvert sous tension : toute la tension.</li><li>Hors tension seulement : contrôle de continuité (Ω).</li></ol></div>
          <div class="card"><p class="eyebrow">Ton diagnostic</p><div class="js-ans"></div><button class="btn primary js-submit" style="margin-top:10px">${ic.check}Valider le diagnostic</button><div class="js-fb"></div></div>
          <div class="card"><p class="eyebrow">Journal d'intervention</p><div class="log js-log">Intervention démarrée.</div></div>
        </aside></div>`;
      const bench = AA.bench(main.querySelector('.wb-host'), inst.cid, { faults: inst.faults, overload: false,
        onProbe: st => {
          const r = bench.sim.measure(st.lastPair[0], st.lastPair[1], bench.view.svg.classList.contains('meter') ? 'V' : 'V');
          logLine(`Mesure ${st.measures} : ${st.lastPair[0]} ↔ ${st.lastPair[1]} = ${r.text} ${r.unit}`);
          if (inst.budget) upd();
        },
        onAct: (type, d) => { if (type === 'act' && d.down !== false && d.latched === undefined) logLine('Manœuvre ' + d.id); if (type === 'trip') logLine('⚠ ' + d.id + ' déclenche (' + d.why + ')'); }
      });
      const logEl = main.querySelector('.js-log');
      function logLine(s) { logEl.innerHTML += '<br>' + esc(s); logEl.scrollTop = 1e6; }
      const nAns = inst.faults.length;
      const ansBox = main.querySelector('.js-ans');
      const opts = c.parts.filter(p => FAULTS_BY_TYPE[p.type]).map(p => `<option value="${esc(p.id)}">${esc(p.id)} — ${esc(p.info || window.AASim.TYPES[p.type].kind)}</option>`).join('');
      const fopts = Object.entries(FAULT_TXT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
      ansBox.innerHTML = Array.from({ length: nAns }, (_, i) => `<div class="field"><label>Défaut ${nAns > 1 ? i + 1 : ''}</label><select class="sel js-p">${opts}</select><select class="sel js-f" style="margin-top:6px">${fopts}</select></div>`).join('');
      let wrong = 0, t0 = Date.now(), finished = false;
      const tEl = main.querySelector('.js-timer'), bEl = main.querySelector('.js-budget');
      function upd() {
        if (bEl) { const left = inst.budget - bench.st.measures; bEl.textContent = `${Math.max(0, left)} mesures restantes`; if (left < 0 && !finished) end(false, 'Budget de mesures dépassé.'); }
      }
      upd();
      const tick = setInterval(() => {
        if (!main.isConnected) { clearInterval(tick); return; }
        if (tEl && !finished) { const left = inst.time - (Date.now() - t0) / 1000; tEl.textContent = `${Math.floor(Math.max(0, left) / 60)}:${String(Math.floor(Math.max(0, left) % 60)).padStart(2, '0')}`; if (left <= 0) end(false, 'Temps écoulé.'); }
      }, 500);
      main.querySelector('.js-submit').onclick = () => {
        if (finished) return;
        const ps = [...ansBox.querySelectorAll('.js-p')].map(x => x.value), fs = [...ansBox.querySelectorAll('.js-f')].map(x => x.value);
        const ok = inst.faults.every(f => ps.some((p, i) => p === f.id && fs[i] === f.f));
        const partOk = inst.faults.every(f => ps.includes(f.id));
        if (ok) end(true);
        else { wrong++; main.querySelector('.js-fb').innerHTML = `<p class="bad-t">${partOk ? 'Bon appareil, mais la nature du défaut est inexacte.' : 'Ce n\'est pas ça. Mesure encore.'} (${wrong} erreur${wrong > 1 ? 's' : ''})</p>`; logLine('Diagnostic refusé'); if (wrong >= 3) end(false, 'Trois diagnostics erronés.'); }
      };
      function end(win, why) {
        finished = true; clearInterval(tick);
        const sec = (Date.now() - t0) / 1000, m = bench.st.measures;
        let score = win ? Math.max(10, Math.round(100 - wrong * 20 - Math.max(0, m - 5) * 4 - bench.st.rDanger * 15 - Math.max(0, sec - 120) / 12)) : 0;
        const sol = inst.faults.map(f => `<b>${esc(f.id)}</b> : ${FAULT_TXT[f.f]}`).join('<br>');
        main.querySelector('.js-fb').innerHTML = `<div class="result ${win ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>${win ? 'Panne localisée !' : esc(why)}</p><p class="muted">${m} mesure(s), ${Math.round(sec)} s${bench.st.rDanger ? `, ${bench.st.rDanger} mesure(s) d'ohmmètre sous tension` : ''}.</p><p>Défaut réel :<br>${sol}</p>
          <div class="row"><a class="btn primary" href="#/defi/panne/${Date.now()}">Nouvelle panne</a><a class="btn" href="#/defis">Défis</a></div></div>`;
        bench.sim.parts.forEach(p => { if (inst.faults.some(f => f.id === p.id)) bench.view.highlight(p.id); });
        done(score);
      }
      return { leave: () => { clearInterval(tick); bench.destroy(); } };
    }
  };

  /* =====================================================================
   * 2. LOGIQUE — prédire l'état final après une suite de manœuvres
   * ===================================================================== */
  D.TYPES.logique = {
    name: 'Logique à relais', icon: 'schema', min: 1,
    desc: 'Une suite de manœuvres est imposée. Sans simuler, prévois l\'état final des voyants, contacteurs et moteurs. Ensuite, la simulation tranche.',
    gen(r, lvl) {
      const cid = r.pick(lvl <= 1 ? ['vaetvient', 'telerupteur', 'simple'] : lvl <= 2 ? ['telerupteur', 'dol', 'vaetvient'] : lvl === 3 ? ['dol', 'inversion'] : ['dol', 'inversion', 'etoile']);
      const acts = {
        simple: [['toggle', 'S1', 'bascule S1'], ['toggle', 'Q1', 'manœuvre Q1']],
        vaetvient: [['toggle', 'SA1', 'manœuvre SA1'], ['toggle', 'SA2', 'manœuvre SA2'], ['toggle', 'Q1', 'manœuvre Q1']],
        telerupteur: [['pulse', 'S1', 'appui bref sur S1'], ['pulse', 'S2', 'appui bref sur S2'], ['pulse', 'S3', 'appui bref sur S3'], ['toggle', 'Q1', 'manœuvre Q1']],
        dol: [['pulse', 'S2', 'appui bref sur Marche S2'], ['pulse', 'S1', 'appui bref sur Arrêt S1'], ['both', 'S1+S2', 'appui simultané sur S1 et S2, puis relâchement'], ['toggle', 'Q1', 'manœuvre Q1'], ['overload', 'F2', 'surcharge du moteur pendant 5 s'], ['toggle', 'F2', 'tentative de réarmement de F2']],
        etoile: [['pulse', 'S2', 'appui bref sur Marche S2'], ['pulse', 'S1', 'appui bref sur Arrêt S1'], ['wait', '', 'attente de 5 secondes'], ['toggle', 'Q1', 'manœuvre Q1'], ['overload', 'F2', 'surcharge du moteur pendant 5 s']],
        inversion: [['pulse', 'S2', 'appui bref sur Avant S2'], ['pulse', 'S3', 'appui bref sur Arrière S3'], ['pulse', 'S1', 'appui bref sur Arrêt S1'], ['toggle', 'Q1', 'manœuvre Q1'], ['overload', 'F2', 'surcharge du moteur pendant 5 s']]
      }[cid];
      const n = 2 + lvl + r.int(0, 1);
      const seq = Array.from({ length: n }, () => r.pick(acts));
      let pre = null;
      if (lvl >= 4) {
        const cands = C[cid].parts.filter(p => ['no', 'nc', 'pb_nc', 'th_nc'].includes(p.type));
        if (cands.length) { const p = r.pick(cands); pre = { id: p.id, f: r.pick(['stuck', 'open']) }; }
      }
      return { cid, seq, pre, lvl, sig: cid + seq.map(s => s[1]).join('') + (pre ? pre.id + pre.f : '') };
    },
    simulate(inst) {
      const s = new Sim(C[inst.cid]);
      if (inst.pre) s.setFault(inst.pre.id, inst.pre.f);
      const adv = t => { for (let i = 0; i < t * 25; i++) s.step(0.04); };
      for (const [op, id] of inst.seq) {
        if (op === 'toggle') s.toggle(id);
        if (op === 'pulse') { s.press(id, true); adv(0.3); s.press(id, false); }
        if (op === 'both') { s.press('S1', true); s.press('S2', true); adv(0.3); s.press('S2', false); s.press('S1', false); }
        if (op === 'wait') adv(5);
        if (op === 'overload') { s.setFault('F2', 'overload'); adv(5); s.setFault('F2', null); if (inst.pre) s.setFault(inst.pre.id, inst.pre.f); }
        adv(0.4);
      }
      return s;
    },
    play(main, inst, done) {
      const s = this.simulate(inst);
      const snap = s.snapshot();
      const items = [];
      Object.keys(snap.lamps).forEach(k => items.push({ k, t: 'Voyant / lampe ' + k, opts: ['éteint', 'allumé'], a: snap.lamps[k] ? 1 : 0 }));
      Object.keys(snap.coils).forEach(k => items.push({ k, t: 'Contacteur / relais ' + k, opts: ['repos', 'collé'], a: snap.coils[k] ? 1 : 0 }));
      Object.keys(snap.motors).forEach(k => {
        const six = inst.cid === 'etoile';
        const opts = six ? ['arrêt', 'marche en étoile', 'marche en triangle', 'monophasé'] : ['arrêt', 'marche avant', 'marche arrière', 'monophasé'];
        const vals = six ? ['stop', 'run+Y', 'run+D', 'mono'] : ['stop', 'run+', 'run-', 'mono'];
        items.push({ k, t: 'Moteur ' + k, opts, a: vals.indexOf(snap.motors[k]) });
      });
      const prot = s.parts.filter(p => ['cb', 'breaker3', 'fuse', 'thermal3'].includes(p.type));
      prot.forEach(p => items.push({ k: p.id, t: 'Protection ' + p.id, opts: ['enclenchée / intacte', 'déclenchée / fondue / ouverte'], a: (p.st.tripped || p.st.blown || (p.st.on === false)) ? 1 : 0 }));
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Logique à relais · ${LVL[inst.lvl]}</p><h1>Que se passe-t-il ?</h1><p>Lis le schéma « ${esc(C[inst.cid].title)} » ci-dessous (au repos, sans le manœuvrer), puis prévois l'état final.</p></div></div>
        <div class="grid g2"><div><div class="brief"><b>Séquence imposée</b>${inst.pre ? `<br><b>Donnée cachée découverte :</b> le contact <b>${esc(inst.pre.id)}</b> est ${inst.pre.f === 'stuck' ? 'soudé (toujours fermé)' : 'coupé (toujours ouvert)'}.` : ''}<ol class="steps">${inst.seq.map(s => `<li>${esc(s[2])}</li>`).join('')}</ol></div>
        <div class="card" style="margin-top:12px"><p class="eyebrow">Ta prévision</p><div class="pred">${items.map((it, i) => `<div class="pred-row"><span>${esc(it.t)}</span><div class="seg" data-i="${i}">${it.opts.map((o, j) => `<button data-j="${j}">${o}</button>`).join('')}</div></div>`).join('')}</div>
        <button class="btn primary js-ok" style="margin-top:12px">${ic.check}Vérifier par la simulation</button><div class="js-fb"></div></div></div>
        <div class="wb-host" style="height:560px"></div></div>`;
      const bench = AA.bench(main.querySelector('.wb-host'), inst.cid, { height: '560px' });
      const ans = {};
      main.querySelectorAll('.pred .seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); ans[sg.dataset.i] = +b.dataset.j; }));
      let finished = false;
      main.querySelector('.js-ok').onclick = () => {
        if (finished) return;
        if (Object.keys(ans).length < items.length) { main.querySelector('.js-fb').innerHTML = '<p class="muted">Réponds à toutes les lignes.</p>'; return; }
        finished = true;
        let good = 0;
        items.forEach((it, i) => { const row = main.querySelectorAll('.pred-row')[i]; const ok = ans[i] === it.a; if (ok) good++; row.classList.add(ok ? 'ok' : 'ko'); if (!ok) row.querySelector(`[data-j="${it.a}"]`).classList.add('truth'); });
        const score = Math.round(good / items.length * 100);
        main.querySelector('.js-fb').innerHTML = `<div class="result"><div class="score-big">${score}</div><p>${good}/${items.length} états corrects. Rejoue la séquence sur le schéma pour comprendre chaque écart.</p><div class="row"><a class="btn primary" href="#/defi/logique/${Date.now()}">Nouvelle séquence</a><a class="btn" href="#/defis">Défis</a></div></div>`;
        if (inst.pre) bench.sim.setFault(inst.pre.id, inst.pre.f);
        done(score);
      };
      return { leave: () => bench.destroy() };
    }
  };

  /* =====================================================================
   * 3. CALCUL — dimensionner une canalisation (NF C 15-100 / IEC 60364-5-52)
   * ===================================================================== */
  const LOADS = [
    { n: 'un chauffe-eau', P: [2000, 2400, 3000], tri: false, cos: 1, light: false },
    { n: 'une batterie de radiateurs', P: [3000, 4500, 6000], tri: false, cos: 1, light: false },
    { n: 'une borne de recharge 7,4 kW', P: [7400], tri: false, cos: 1, light: false },
    { n: 'un four de cuisson', P: [3500, 5000, 6000], tri: false, cos: 1, light: false },
    { n: 'une rampe d\'éclairage LED d\'atelier', P: [1200, 1800, 2400], tri: false, cos: 0.95, light: true },
    { n: 'un four industriel triphasé', P: [9000, 12000, 18000, 24000], tri: true, cos: 1, light: false },
    { n: 'une borne de recharge 22 kW', P: [22000], tri: true, cos: 1, light: false },
    { n: 'un moteur de compresseur', motor: [4, 5.5, 7.5, 11, 15], tri: true, light: false },
    { n: 'un moteur de pompe', motor: [2.2, 3, 4, 5.5, 7.5, 11], tri: true, light: false },
    { n: 'un moteur de ventilateur d\'extraction', motor: [1.5, 2.2, 3, 4, 7.5], tri: true, light: false }
  ];
  D.TYPES.calcul = {
    name: 'Dimensionnement', icon: 'sigma', min: 1,
    desc: 'Courant d\'emploi, calibre de protection, section du câble, chute de tension : les vraies étapes du bureau d\'études, avec des conditions toujours différentes.',
    gen(r, lvl) {
      const pool = LOADS.filter(l => lvl >= 3 || !l.motor).filter(l => lvl >= 2 || !l.tri);
      const ld = r.pick(pool);
      let P, cos, eta = 1, Ib, motor = null;
      if (ld.motor) {
        const kw = r.pick(ld.motor); eta = r.pick([0.84, 0.86, 0.88, 0.9]); cos = r.pick([0.8, 0.82, 0.84, 0.86]);
        P = kw * 1000; Ib = P / (eta * Math.sqrt(3) * 400 * cos); motor = kw;
      } else { P = r.pick(ld.P); cos = ld.cos; Ib = ld.tri ? P / (Math.sqrt(3) * 400 * cos) : P / (230 * cos); }
      const pose = lvl >= 3 ? r.pick(['B', 'C']) : 'C';
      const Tamb = lvl >= 3 ? r.pick([25, 30, 35, 40, 45]) : 30;
      const n = lvl >= 3 ? r.pick([1, 2, 3, 4, 6]) : 1;
      const L = lvl >= 4 ? r.pick([35, 48, 60, 75, 90, 120, 150]) : r.pick([12, 18, 25, 30]);
      const limit = ld.light ? 3 : 5;
      const res = T.size({ Ib, tri: ld.tri, pose, T: Tamb, n, L, cos, limit, Ir: motor ? Math.ceil(Ib * 10) / 10 : null });
      return { ld: ld.n, light: ld.light, P, cos, eta, Ib, motor, tri: ld.tri, pose, Tamb, n, L, limit, res, lvl, site: r.pick(T.SITES), sig: ld.n + P + pose + Tamb + n + L };
    },
    play(main, inst, done) {
      const R = inst.res, tri = inst.tri;
      const steps = [
        { k: 'ib', q: `Courant d'emploi I<sub>B</sub>`, unit: 'A', a: inst.Ib, tol: 0.03, sol: inst.motor ? `I<sub>B</sub> = P / (η × √3 × U × cos φ) = ${inst.P} / (${inst.eta} × 1,732 × 400 × ${inst.cos}) = <b>${AA.fmt(inst.Ib, 2)} A</b>` : tri ? `I<sub>B</sub> = P / (√3 × 400 × cos φ) = ${inst.P} / (692,8 × ${inst.cos}) = <b>${AA.fmt(inst.Ib, 2)} A</b>` : `I<sub>B</sub> = P / (230 × cos φ) = ${inst.P} / (230 × ${inst.cos}) = <b>${AA.fmt(inst.Ib, 2)} A</b>` },
        inst.motor
          ? { k: 'in', q: 'Réglage du déclencheur thermique du disjoncteur-moteur I<sub>r</sub>', unit: 'A', a: R.In, tol: 0.04, sol: `Un disjoncteur-moteur se règle sur le courant nominal du moteur : I<sub>r</sub> ≈ <b>${AA.fmt(R.In, 1)} A</b>.` }
          : { k: 'in', q: 'Calibre du disjoncteur I<sub>n</sub>', choice: T.CALIBRES, unit: 'A', a: R.In, sol: `Plus petit calibre normalisé ≥ I<sub>B</sub> : <b>${R.In} A</b>.` }
      ];
      if (inst.lvl >= 2) steps.push({ k: 's', q: 'Section des conducteurs (cuivre, PVC)', choice: T.SECTIONS, unit: 'mm²', a: R.S, sol: `Facteur de correction k = k<sub>T</sub> × k<sub>G</sub> = ${T.KT[inst.Tamb]} × ${T.KG[inst.n]} = ${AA.fmt(R.k, 3)}. I<sub>z</sub> requis = ${AA.fmt(R.In, 1)} / ${AA.fmt(R.k, 3)} = ${AA.fmt(R.izReq, 1)} A → section thermique <b>${R.Sth} mm²</b>.${R.upsized ? ` Mais la chute de tension y vaudrait ${AA.fmt(R.dUth, 2)} % > ${inst.limit} % : on passe à <b>${R.S} mm²</b>.` : ''}` });
      if (inst.lvl >= 3) steps.push({ k: 'du', q: `Chute de tension avec la section retenue (${R.S} mm²)`, unit: '%', a: R.dU, tol: 0.06, sol: `u = ${tri ? 1 : 2} × (0,0225 × ${inst.L} / ${R.S} × ${inst.cos} + 0,00008 × ${inst.L} × ${AA.fmt(Math.sqrt(1 - inst.cos * inst.cos), 2)}) × ${AA.fmt(inst.Ib, 2)} ; ΔU = u / 230 = <b>${AA.fmt(R.dU, 2)} %</b> (limite ${inst.limit} %).` });
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Dimensionnement · ${LVL[inst.lvl]}</p><h1>Alimenter ${esc(inst.ld)}</h1></div></div>
        <div class="grid g2"><div class="brief">Dans ${esc(inst.site)}, on doit alimenter <b>${esc(inst.ld)}</b> ${inst.motor ? `de <b>${AA.fmt(inst.motor)} kW</b> (rendement ${AA.fmt(inst.eta)}, cos φ ${AA.fmt(inst.cos)})` : `de <b>${AA.fmt(inst.P / 1000)} kW</b>${inst.cos < 1 ? ` (cos φ ${AA.fmt(inst.cos)})` : ''}`}
          en <b>${tri ? 'triphasé 400 V' : 'monophasé 230 V'}</b> depuis le tableau, à <b>${inst.L} m</b>.<br>
          Câble cuivre isolé PVC ${esc(T.POSE[inst.pose])}, température ambiante <b>${inst.Tamb} °C</b>, ${inst.n > 1 ? `<b>${inst.n} circuits</b> jointifs` : 'circuit seul'}.<br>
          Alimentation par le réseau public : chute de tension maximale <b>${inst.limit} %</b> (${inst.light ? 'éclairage' : 'autres usages'}).
          <details class="memo"><summary>Aide-mémoire (tableaux)</summary>${memo(inst)}</details></div>
        <div class="card"><p class="eyebrow">Note de calcul</p><div class="calc">${steps.map((s, i) => `<div class="calc-row" data-i="${i}"><label>${s.q}</label><div class="num-in">${s.choice ? `<select class="sel">${['<option value="">—</option>'].concat(s.choice.map(v => `<option value="${v}">${AA.fmt(v)}</option>`)).join('')}</select>` : '<input inputmode="decimal" placeholder="valeur">'}<span class="unit">${s.unit}</span></div><div class="sol" hidden></div></div>`).join('')}</div>
          <button class="btn primary js-ok" style="margin-top:12px">${ic.check}Valider la note de calcul</button><div class="js-fb"></div></div></div>`;
      let finished = false;
      main.querySelector('.js-ok').onclick = () => {
        if (finished) return; finished = true;
        let good = 0;
        steps.forEach((s, i) => {
          const row = main.querySelector(`.calc-row[data-i="${i}"]`), el = row.querySelector('input,select');
          const v = parseFloat(String(el.value).replace(',', '.'));
          const ok = s.choice ? v === s.a : Math.abs(v - s.a) <= Math.abs(s.a) * s.tol;
          if (ok) good++;
          row.classList.add(ok ? 'ok' : 'ko');
          const sol = row.querySelector('.sol'); sol.hidden = false; sol.innerHTML = s.sol;
        });
        const score = Math.round(good / steps.length * 100);
        main.querySelector('.js-fb').innerHTML = `<div class="result"><div class="score-big">${score}</div><p>${good}/${steps.length} étapes justes.</p><div class="row"><a class="btn primary" href="#/defi/calcul/${Date.now()}">Nouveau cas</a><a class="btn" href="#/defis">Défis</a></div></div>`;
        done(score);
      };
    }
  };
  function memo(inst) {
    const tab = T.IZ[inst.pose + (inst.tri ? '3' : '2')];
    return `<table class="t mini"><tr><th>S (mm²)</th>${T.SECTIONS.slice(0, 9).map(s => `<td>${AA.fmt(s)}</td>`).join('')}</tr><tr><th>I<sub>z</sub> (A)</th>${tab.slice(0, 9).map(s => `<td>${AA.fmt(s)}</td>`).join('')}</tr></table>
      <p class="muted">${inst.tri ? '3' : '2'} conducteurs chargés, ${esc(T.POSE[inst.pose])}, 30 °C.</p>
      <table class="t mini"><tr><th>θ (°C)</th>${Object.keys(T.KT).map(k => `<td>${k}</td>`).join('')}</tr><tr><th>k<sub>T</sub></th>${Object.values(T.KT).map(v => `<td>${AA.fmt(v)}</td>`).join('')}</tr></table>
      <table class="t mini"><tr><th>Circuits</th>${Object.keys(T.KG).map(k => `<td>${k}</td>`).join('')}</tr><tr><th>k<sub>G</sub></th>${Object.values(T.KG).map(v => `<td>${AA.fmt(v)}</td>`).join('')}</tr></table>
      <p class="muted">Calibres : ${T.CALIBRES.join(', ')} A. Condition : I<sub>B</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub> × k.</p>`;
  }

  /* =====================================================================
   * 4. CAHIER DES CHARGES — plusieurs solutions possibles, une meilleure
   * ===================================================================== */
  const MACHINES = [
    { n: 'pompe centrifuge de relevage', load: 'light', hammer: true, inertia: false },
    { n: 'ventilateur d\'extraction d\'air', load: 'light', hammer: false, inertia: true },
    { n: 'convoyeur à bande chargé', load: 'heavy', hammer: false, inertia: false },
    { n: 'broyeur à marteaux', load: 'heavy', hammer: false, inertia: true },
    { n: 'compresseur à vis', load: 'medium', hammer: false, inertia: false },
    { n: 'agitateur de cuve', load: 'medium', hammer: false, inertia: false },
    { n: 'scie circulaire à format', load: 'light', hammer: false, inertia: true }
  ];
  D.TYPES.cdc = {
    name: 'Cahier des charges', icon: 'book', min: 2,
    desc: 'Un besoin décrit en texte libre. Plusieurs choix techniques sont possibles : choisis les tiens, l\'évaluation explique ce qui est faux, acceptable ou optimal.',
    gen(r, lvl) {
      const m = r.pick(MACHINES);
      const kw = r.pick(lvl <= 2 ? [2.2, 3, 4, 5.5] : [4, 7.5, 11, 15, 22, 30, 45]);
      const plate = r.pick(['230/400', '400/690']);
      const speed = r() < (lvl >= 3 ? 0.35 : 0.2);
      const weak = kw >= 7.5 && r() < 0.5;
      const starts = r.pick([2, 4, 10, 30]);
      const wet = r() < 0.4;
      const devices = r.pick([2, 4, 6]);
      const it = lvl >= 4 && r() < 0.55;
      const plc = lvl >= 3 && r() < 0.5;
      return { m, kw, plate, speed, weak, starts, wet, devices, it, plc, lvl, site: r.pick(T.SITES), sig: m.n + kw + plate + speed + weak + starts + wet + devices + it + plc };
    },
    /* Évaluation experte de chaque option : 2 = optimal, 1 = acceptable, 0 = faux */
    decisions(x) {
      const d = [];
      const etOk = x.plate === '400/690';
      const In = x.kw * 1000 / (0.87 * Math.sqrt(3) * 400 * 0.84);
      d.push({
        q: 'Mode de démarrage',
        o: [
          ['Démarrage direct', x.speed ? 0 : (x.weak || x.kw > 11) ? 0 : (x.m.hammer ? 1 : 2),
            x.speed ? 'Ne permet pas de faire varier la vitesse exigée.' : (x.weak || x.kw > 11) ? `Pointe de courant de 6 à 8 × I<sub>n</sub> (≈ ${Math.round(In * 7)} A) : inacceptable ${x.weak ? 'sur ce réseau limité' : 'à cette puissance'}.` : x.m.hammer ? 'Fonctionne, mais l\'arrêt brutal provoque des coups de bélier dans la tuyauterie.' : 'Simple, robuste, le moins cher à cette puissance.'],
          ['Étoile-triangle', x.speed ? 0 : !etOk ? 0 : x.m.load === 'heavy' ? 0 : (x.m.hammer ? 1 : ((x.weak || x.kw > 11) ? 2 : 1)),
            x.speed ? 'Pas de variation de vitesse.' : !etOk ? 'Impossible : la plaque indique 230/400 V. Sur un réseau 400 V le moteur est couplé en étoile en permanence ; le passer en triangle appliquerait 400 V à des enroulements prévus pour 230 V.' : x.m.load === 'heavy' ? 'Le couple est divisé par 3 au démarrage : la machine démarre en charge et risque de caler.' : x.m.hammer ? 'Réduit le courant mais ne supprime pas le coup de bélier à l\'arrêt, et la commutation crée une pointe.' : (x.weak || x.kw > 11) ? 'Courant de démarrage divisé par 3 pour une charge qui démarre à faible couple : solution économique et adaptée.' : 'Possible mais superflu à cette puissance.'],
          ['Démarreur progressif', x.speed ? 0 : (x.m.hammer ? 2 : x.m.load === 'heavy' ? 1 : (x.weak || x.kw > 11) ? 2 : 1),
            x.speed ? 'Ne fait varier la tension qu\'au démarrage : pas de réglage de vitesse en régime établi.' : x.m.hammer ? 'Rampe d\'accélération et surtout de décélération : supprime les coups de bélier. Le meilleur choix pour une pompe.' : x.m.load === 'heavy' ? 'Limite le courant mais aussi le couple : acceptable si bien paramétré, un variateur serait plus sûr pour un démarrage en charge.' : 'Démarrage doux et réglable, sans les à-coups de l\'étoile-triangle.'],
          ['Variateur de fréquence', x.speed ? 2 : (x.m.load === 'heavy' && (x.weak || x.kw > 11) ? 2 : 1),
            x.speed ? 'Seule solution qui permet de régler la vitesse en continu, avec en plus un démarrage à courant maîtrisé.' : x.m.load === 'heavy' && (x.weak || x.kw > 11) ? 'Couple nominal disponible dès l\'arrêt avec un courant limité : idéal pour démarrer une machine chargée sur un réseau contraint.' : 'Fonctionne, mais coûteux et source d\'harmoniques sans besoin de variation de vitesse.']
        ]
      });
      d.push({
        q: 'Protection du départ moteur',
        o: [
          ['Disjoncteur-moteur magnéto-thermique', In <= 65 ? 2 : 1, In <= 65 ? `Protège contre courts-circuits et surcharges en un seul appareil réglé à I<sub>n</sub> ≈ ${AA.fmt(In, 1)} A. Le choix courant jusqu\'à ~65 A.` : 'Possible mais au-delà de ~65 A on emploie plutôt un disjoncteur à déclencheur électronique ou des fusibles aM.'],
          ['Sectionneur porte-fusibles aM + relais thermique', In > 65 ? 2 : 1, 'Solution valable (coordination type 2 facile), mais les fusibles sont à remplacer après défaut et le sectionneur est plus encombrant.'],
          ['Disjoncteur modulaire courbe C seul', 0, 'Ne protège pas le moteur contre les surcharges (réglage non ajustable) et peut déclencher au démarrage. À proscrire seul.'],
          ['Fusibles gG seuls', 0, 'Pas de protection fine contre la surcharge moteur ni contre la marche en monophasé : le moteur grillera.']
        ]
      });
      const ctrl = [
        ['230 V AC prélevé directement entre phase et neutre', x.devices > 2 || x.wet ? 0 : 1, x.devices > 2 ? `Avec ${x.devices} organes de commande, l\'IEC 60204-1 impose un transformateur d\'isolement pour le circuit de commande.` : x.wet ? 'Environnement humide : une tension de commande réduite est préférable pour la sécurité.' : 'Toléré pour un démarreur simple avec au plus deux organes de commande.'],
        ['24 V AC par transformateur de commande', x.plc ? 1 : 2, x.plc ? 'Correct, mais avec un automate on préfère une alimentation 24 V DC commune aux entrées.' : 'Circuit isolé, tension réduite : conforme IEC 60204-1 et plus sûr.'],
        ['24 V DC par alimentation à découpage', x.plc ? 2 : 1, x.plc ? 'Cohérent avec les entrées-sorties de l\'automate : une seule tension de commande.' : 'Valable, un peu plus cher qu\'un transformateur pour une logique à relais simple.']
      ];
      d.push({ q: 'Tension du circuit de commande', o: ctrl });
      d.push({
        q: 'Arrêt d\'urgence',
        o: [
          ['Bouton relié à une entrée de l\'automate qui coupe les sorties', 0, 'Interdit : la fonction d\'arrêt d\'urgence ne doit pas dépendre d\'un logiciel standard. Câblage direct ou relais de sécurité.'],
          ['Catégorie 0 : coupure immédiate de l\'énergie par contacteur', x.m.inertia && x.speed ? 1 : 2, x.m.inertia && x.speed ? 'Correct mais la machine s\'arrêtera en roue libre longtemps à cause de son inertie.' : 'Arrêt non contrôlé par coupure immédiate : la règle générale, câblée, simple et sûre.'],
          ['Catégorie 1 : freinage contrôlé puis coupure (relais de sécurité temporisé)', x.m.inertia && x.speed ? 2 : 1, x.m.inertia && x.speed ? 'Le variateur freine la masse en rotation, puis l\'énergie est coupée : arrêt rapide et sûr pour une machine à forte inertie.' : 'Possible, plus complexe ; justifié surtout pour les fortes inerties avec variateur.']
        ]
      });
      if (x.it) d.push({
        q: 'Particularité : le site est en régime IT (neutre isolé)',
        o: [
          ['Rien de particulier', x.speed || d[0].o[3][1] ? 0 : 1, 'Avec un variateur, les condensateurs du filtre CEM sont reliés à la terre : en IT, ils créent un défaut d\'isolement permanent et peuvent être détruits au premier défaut.'],
          ['Déconnecter le filtre CEM interne du variateur (cavalier IT) et prévoir un contrôleur d\'isolement', 2, 'Bonne pratique en régime IT : filtre CEM déconnecté, CPI qui signale le premier défaut, recherche de défaut organisée.'],
          ['Ajouter un différentiel 30 mA en tête', 0, 'Ne répond pas au problème : en IT, le premier défaut ne fait pas déclencher, il doit être signalé par le contrôleur permanent d\'isolement.']
        ]
      });
      return d;
    },
    text(x) {
      return `Le service maintenance ${esc(AA.de(x.site))} doit installer un <b>${esc(x.m.n)}</b> entraîné par un moteur asynchrone de <b>${AA.fmt(x.kw)} kW</b>, plaque <b>${x.plate} V</b>, alimenté par un réseau <b>3 × 400 V</b>.
        ${x.speed ? 'Le procédé exige de <b>régler la vitesse</b> en continu selon la demande. ' : 'La machine tourne à vitesse fixe. '}
        ${x.weak ? 'Le poste de transformation est déjà très chargé : le distributeur interdit les <b>pointes de courant importantes</b>. ' : ''}
        La machine démarre environ <b>${x.starts} fois par heure</b>${x.m.load === 'heavy' ? ' et toujours <b>en charge</b>' : ''}.
        ${x.wet ? 'Le local est <b>humide</b> et régulièrement lavé au jet. ' : 'Le local est sec. '}
        Le pupitre comporte <b>${x.devices} organes de commande</b>${x.plc ? ' et la machine est pilotée par un <b>automate programmable</b>' : ''}.
        ${x.it ? 'Le site est exploité en <b>régime IT</b> pour garantir la continuité de service. ' : ''}
        Propose une solution complète, sûre, conforme et économiquement raisonnable.`;
    },
    play(main, inst, done) {
      const dec = this.decisions(inst);
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Cahier des charges · ${LVL[inst.lvl]}</p><h1>Concevoir le départ moteur</h1></div></div>
        <div class="brief cdc-text">${this.text(inst)}</div>
        <div class="grid g2" style="margin-top:14px">${dec.map((d, i) => `<div class="card dec" data-i="${i}"><p class="eyebrow">Choix ${i + 1}</p><h3>${d.q}</h3><div class="opts">${d.o.map((o, j) => `<button class="opt" data-j="${j}">${o[0]}</button>`).join('')}</div><div class="why"></div></div>`).join('')}</div>
        <div class="row" style="margin-top:14px"><button class="btn primary js-ok">${ic.check}Soumettre ma solution</button></div><div class="js-fb"></div>`;
      const sel = {};
      main.querySelectorAll('.dec').forEach(c => c.querySelectorAll('.opt').forEach(b => b.onclick = () => { if (c.classList.contains('answered')) return; c.querySelectorAll('.opt').forEach(x => x.classList.toggle('on', x === b)); sel[c.dataset.i] = +b.dataset.j; }));
      let finished = false;
      main.querySelector('.js-ok').onclick = () => {
        if (finished) return;
        if (Object.keys(sel).length < dec.length) { main.querySelector('.js-fb').innerHTML = '<p class="muted">Fais un choix pour chaque point.</p>'; return; }
        finished = true;
        let pts = 0;
        dec.forEach((d, i) => {
          const c = main.querySelector(`.dec[data-i="${i}"]`); c.classList.add('answered');
          const best = Math.max(...d.o.map(o => o[1]));
          pts += d.o[sel[i]][1] / best;
          c.querySelectorAll('.opt').forEach((b, j) => { const v = d.o[j][1]; b.classList.add(v === best ? 'good' : v ? 'meh' : 'badc'); if (j === sel[i]) b.classList.add('mine'); });
          c.querySelector('.why').innerHTML = d.o.map(o => `<p><span class="verdict v${o[1] === best ? 2 : o[1]}">${o[1] === best ? 'Optimal' : o[1] ? 'Acceptable' : 'Faux'}</span> <b>${o[0]}</b> — ${o[2]}</p>`).join('');
          c.querySelector('.why').style.display = 'block';
        });
        const score = Math.round(pts / dec.length * 100);
        main.querySelector('.js-fb').innerHTML = `<div class="result"><div class="score-big">${score}</div><p>Une installation peut fonctionner avec plusieurs choix « acceptables » ; la solution optimale combine sécurité, conformité et coût. Relis chaque justification.</p><div class="row"><a class="btn primary" href="#/defi/cdc/${Date.now()}">Nouveau cahier des charges</a><a class="btn" href="#/defis">Défis</a></div></div>`;
        done(score);
      };
    }
  };

  /* =====================================================================
   * Hub des défis, défi du jour, lecteur
   * ===================================================================== */
  D.external = []; // types ajoutés par d'autres modules (automate, grands projets)
  D.dailyPlan = () => {
    const day = AA.today(), r = AA.rng('jour:' + day);
    const types = Object.keys(D.TYPES).concat(D.external.map(e => e.id)).filter(t => (D.TYPES[t] ? D.TYPES[t].min : 1) <= D.levelFor() + 1);
    const t = r.pick(types);
    return { day, type: t, seed: 'jour:' + day + ':' + t, lvl: Math.min(5, D.levelFor() + (r() < 0.3 ? 1 : 0)) };
  };
  D.dailyCard = el => {
    const p = D.dailyPlan(), done = S.daily && S.daily[p.day];
    const info = D.TYPES[p.type] || D.external.find(e => e.id === p.type);
    el.innerHTML = `<h3 class="row">${ic[info.icon] || ic.trophy}${esc(info.name)}</h3><p class="muted" style="font-size:13.5px">${esc(info.desc)}</p>
      <div class="row"><span class="chip copper">${LVL[p.lvl]}</span>${done ? `<span class="chip ok">Relevé · ${done} pts</span>` : ''}</div>
      <a class="btn ${done ? '' : 'primary'} sm" style="margin-top:12px" href="${info.href ? info.href(p.seed, p.lvl) : `#/defi/${p.type}/${encodeURIComponent(p.seed)}/${p.lvl}/jour`}">${done ? 'Rejouer' : 'Relever le défi'}${ic.arrow}</a>`;
  };

  AA.route('defis', main => {
    const lv = D.levelFor();
    const cards = Object.entries(D.TYPES).map(([k, t]) => ({ k, t, href: `#/defi/${k}/${Date.now()}` })).concat(D.external.map(e => ({ k: e.id, t: e, href: e.href(String(Date.now()), lv) })));
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Mise à l'épreuve</p><h1>Défis</h1><p>Chaque défi est généré à la volée : conditions, pannes, valeurs et contextes changent à chaque partie et ne se répètent pas. Ton niveau actuel : <b>${LVL[lv]}</b> — plus tu gagnes de galons, plus ils se corsent.</p></div>
      <div class="field" style="margin:0"><label>Difficulté</label><div class="seg js-lvl">${[1, 2, 3, 4, 5].map(i => `<button data-l="${i}" class="${i === lv ? 'on' : ''}" ${i > lv + 1 ? 'disabled title="Gagne des galons pour débloquer"' : ''}>${LVL[i]}</button>`).join('')}</div></div></div>
      <div class="card daily-wide plate"><i class="rv"></i><p class="eyebrow">Défi du jour — identique pour tous aujourd'hui, différent demain</p><div class="js-daily"></div></div>
      <div class="grid g3" style="margin-top:16px">${cards.map(c => { const st = S.defis[c.k]; return `<div class="card defi-card"><h3 class="row">${ic[c.t.icon] || ic.trophy}${esc(c.t.name)}</h3><p class="muted">${esc(c.t.desc)}</p>
        <div class="row">${st ? `<span class="chip">${st.n} joué${st.n > 1 ? 's' : ''}</span><span class="chip ok">record ${st.best}</span>` : '<span class="chip">jamais joué</span>'}</div>
        <a class="btn primary go js-go" data-k="${c.k}" href="${c.href}">${ic.play}Lancer</a></div>`; }).join('')}</div>`;
    D.dailyCard(main.querySelector('.js-daily'));
    let chosen = lv;
    main.querySelectorAll('.js-lvl button').forEach(b => b.onclick = () => { chosen = +b.dataset.l; main.querySelectorAll('.js-lvl button').forEach(x => x.classList.toggle('on', x === b)); });
    main.querySelectorAll('.js-go').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const ext = D.external.find(x => x.id === a.dataset.k);
      location.hash = ext ? ext.href(String(Date.now()), chosen) : `#/defi/${a.dataset.k}/${Date.now()}/${chosen}`;
    }));
  });

  AA.route('defi', (main, [type, seed, lvl, jour]) => {
    const g = D.TYPES[type];
    if (!g) { location.hash = '#/defis'; return; }
    const L = Math.max(1, Math.min(5, +lvl || D.levelFor()));
    const inst = D.make(type, decodeURIComponent(seed || String(Date.now())), L);
    D.remember(type, inst);
    let recorded = false;
    const ctrl = g.play(main, inst, score => {
      if (recorded) return; recorded = true;
      D.record(type, score, L);
      if (jour) { S.daily = S.daily || {}; S.daily[AA.today()] = Math.max(score, S.daily[AA.today()] || 0); AA.save(); }
    });
    return ctrl;
  });

  /* ---------- Autotests (appelés par tests.html) ---------- */
  D.selfTest = (log, eq) => {
    let okP = true, msg = '';
    for (let i = 0; i < 40; i++) {
      const lvl = 1 + (i % 5);
      const inst = D.TYPES.panne.gen(AA.rng('t' + i), lvl);
      if (!inst.faults.length || !inst.sy.length) { okP = false; msg = `seed t${i} : panne sans symptôme`; break; }
    }
    log(okP, 'Défis panne : 40 instances, chaque panne a un symptôme observable ' + msg);
    const sigs = new Set();
    for (let i = 0; i < 30; i++) sigs.add(D.TYPES.panne.gen(AA.rng('u' + i), 3).sig);
    log(sigs.size >= 12, `Défis panne : variété (${sigs.size} pannes distinctes sur 30 tirages niveau 3)`);
    // calcul : la solution de référence respecte IB ≤ In ≤ Iz et ΔU ≤ limite
    let okC = true;
    for (let i = 0; i < 200; i++) {
      const x = D.TYPES.calcul.gen(AA.rng('c' + i), 1 + (i % 5)), R = x.res;
      if (!(x.Ib <= R.In + 1e-9 && R.In <= R.Iz + 1e-9 && (R.dU <= x.limit + 1e-9 || R.S === 120))) { okC = false; msg = JSON.stringify({ Ib: x.Ib, R }); break; }
    }
    log(okC, 'Défis calcul : 200 cas, la solution de référence vérifie IB ≤ In ≤ Iz·k et ΔU ≤ limite ' + (okC ? '' : msg));
    // exemple vérifiable à la main : 3 kW mono, 30 °C, seul, méthode C, 25 m
    const R = T.size({ Ib: 3000 / 230, tri: false, pose: 'C', T: 30, n: 1, L: 25, cos: 1, limit: 5 });
    eq([R.In, R.S], [16, 1.5], 'Calcul : chauffe-eau 3 kW → 16 A, 1,5 mm² (Iz 19,5 A, méthode C)');
    eq(Math.round(T.dU(false, 25, 1.5, 1, 3000 / 230) * 100) / 100, 4.25, 'Calcul : ΔU = 2 × 0,0225 × 25 / 1,5 × 13,04 A / 230 V = 4,25 %');
    // cdc : chaque décision a au moins une option optimale non nulle
    let okD = true;
    for (let i = 0; i < 100; i++) { const x = D.TYPES.cdc.gen(AA.rng('d' + i), 1 + (i % 5)); D.TYPES.cdc.decisions(x).forEach(d => { if (Math.max(...d.o.map(o => o[1])) < 1) okD = false; }); }
    log(okD, 'Cahier des charges : 100 cas, toujours au moins une solution valable par décision');
    const x = { m: MACHINES[0], kw: 15, plate: '230/400', speed: false, weak: true, starts: 4, wet: false, devices: 4, it: false, plc: false, lvl: 3 };
    const dd = D.TYPES.cdc.decisions(x);
    eq(dd[0].o[1][1], 0, 'Cahier des charges : étoile-triangle refusé avec une plaque 230/400 V sur réseau 400 V');
    eq(dd[0].o[2][1], 2, 'Cahier des charges : démarreur progressif optimal pour une pompe (coup de bélier)');
    // logique : la simulation est déterministe
    const li = D.TYPES.logique.gen(AA.rng('l1'), 3);
    eq(JSON.stringify(D.TYPES.logique.simulate(li).snapshot()), JSON.stringify(D.TYPES.logique.simulate(li).snapshot()), 'Logique : simulation reproductible');
  };
})();
