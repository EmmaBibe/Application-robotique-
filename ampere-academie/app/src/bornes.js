/* Ampère Académie — reconnaître et tester les bornes des appareils.
 * Chaque appareil : photo réelle, dessin de face avec ses bornes repérées, manœuvres (actionner, déclencher,
 * impulsion…) et ohmmètre entre deux bornes, appareil hors tension. Repères normalisés (EN 50005, EN 50012) :
 * pôles 1-2, 3-4, 5-6 ; contacts auxiliaires à fermeture 13-14 (…3-…4), à ouverture 21-22 (…1-…2) ;
 * bobine A1-A2 ; relais thermique 95-96 (NC) et 97-98 (NO).
 * Les résistances de bobine sont des valeurs d'exemple : elles dépendent du modèle et de la tension de bobine. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const SIMS = AA.SIMS;
  const BO = AA.BORNES = {};

  /* Appareils : bornes (id, x, y sur un dessin 300 × 230), état initial, actions, liaisons internes selon l'état */
  BO.DEV = {
    contacteur: { s: 'Contacteur', n: 'Contacteur tripolaire + contact auxiliaire', photo: 'contacteur',
      t: [['1', 50, 40], ['3', 100, 40], ['5', 150, 40], ['13', 210, 40], ['A1', 260, 40], ['2', 50, 190], ['4', 100, 190], ['6', 150, 190], ['14', 210, 190], ['A2', 260, 190]],
      st: { on: false }, acts: [['on', 'Enfoncer le porte-contacts à la main (essai hors tension)', 'hold']],
      links: s => [['A1', 'A2', 560]].concat(s.on ? [['1', '2', 0], ['3', '4', 0], ['5', '6', 0], ['13', '14', 0]] : []),
      note: 'Bobine A1-A2 : environ 560 Ω (exemple pour une bobine 230 V~ ; voir la notice). Pôles de puissance et contact 13-14 : ouverts au repos, fermés quand le contacteur est actionné.' },
    thermique: { s: 'Relais thermique', n: 'Relais thermique de protection moteur', photo: 'thermique',
      t: [['1', 50, 40], ['3', 100, 40], ['5', 150, 40], ['95', 220, 40], ['97', 270, 40], ['2', 50, 190], ['4', 100, 190], ['6', 150, 190], ['96', 220, 190], ['98', 270, 190]],
      st: { trip: false }, acts: [['trip', 'Simuler un déclenchement (bouton d\'essai)', 'toggle']],
      links: s => [['1', '2', 0.02], ['3', '4', 0.02], ['5', '6', 0.02]].concat(s.trip ? [['97', '98', 0]] : [['95', '96', 0]]),
      note: 'Les pôles 1-2, 3-4, 5-6 sont toujours passants (bilames chauffantes). Au repos : 95-96 fermé, 97-98 ouvert ; déclenché : 95-96 s\'ouvre, 97-98 se ferme.' },
    telerupteur: { s: 'Télérupteur', n: 'Télérupteur unipolaire', photo: 'telerupteur',
      t: [['A1', 70, 40], ['1', 220, 40], ['A2', 70, 190], ['2', 220, 190]],
      st: { c: false }, acts: [['imp', 'Envoyer une impulsion sur la bobine (banc d\'essai)', 'pulse']],
      links: s => [['A1', 'A2', 1200]].concat(s.c ? [['1', '2', 0]] : []),
      note: 'Bobine A1-A2 : environ 1 200 Ω (exemple). Chaque impulsion inverse l\'état du contact 1-2 : il reste dans sa position jusqu\'à l\'impulsion suivante.' },
    interrupteur: { s: 'Interrupteur va-et-vient', n: 'Interrupteur va-et-vient', photo: 'interrupteur',
      t: [['L', 150, 40], ['1', 80, 190], ['2', 220, 190]],
      st: { p: 1 }, acts: [['p', 'Basculer la touche', 'flip']],
      links: s => [['L', s.p === 1 ? '1' : '2', 0]],
      note: 'Le commun L est relié soit à la borne 1, soit à la borne 2 (les navettes) : il n\'y a jamais de position « tout ouvert ».' },
    disjoncteur: { s: 'Disjoncteur', n: 'Disjoncteur bipolaire', photo: 'disjoncteur',
      t: [['1', 100, 40], ['3', 200, 40], ['2', 100, 190], ['4', 200, 190]],
      st: { on: false }, acts: [['on', 'Fermer / ouvrir le disjoncteur (manette)', 'toggle']],
      links: s => s.on ? [['1', '2', 0], ['3', '4', 0]] : [],
      note: 'Manette levée : les deux pôles 1-2 et 3-4 sont fermés ensemble ; manette baissée ou déclenchée : ouverts.' }
  };

  /* Résistance mesurée entre deux bornes (OL si aucun chemin) — on suit les liaisons, en série si besoin */
  BO.measure = (links, a, b) => {
    if (a === b) return 0;
    const best = { [a]: 0 }, todo = [a];
    while (todo.length) { const x = todo.shift(); links.forEach(([p, q, r]) => { [[p, q], [q, p]].forEach(([u, v]) => { if (u === x && (best[v] == null || best[x] + r < best[v])) { best[v] = best[x] + r; todo.push(v); } }); }); }
    return best[b] == null ? Infinity : best[b];
  };
  BO.fmt = r => r === Infinity ? 'OL' : r < 1 ? AA.fmt(r, 2) + ' Ω' : r < 1000 ? AA.fmt(r, 0) + ' Ω' : AA.fmt(r / 1000, 2) + ' kΩ';

  /* Relais « inconnu » : 8 bornes repérées de a à h, rôles tirés au hasard */
  BO.mystery = r => {
    const pins = r.shuffle(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    return { coil: [pins[0], pins[1]], s1: { com: pins[2], no: pins[3], nc: pins[4] }, s2: { com: pins[5], no: pins[6], nc: pins[7] }, R: r.pick([1800, 3300, 4700, 6800]) };
  };
  BO.mysteryLinks = (m, on) => [[m.coil[0], m.coil[1], m.R]].concat([m.s1, m.s2].map(s => [s.com, on ? s.no : s.nc, 0]));

  /* Rendu d'un appareil manœuvrable avec ohmmètre */
  const deviceView = (host, dev, opts) => {
    const st = Object.assign({}, dev.st), sel = [], log = [];
    let pulseOn = false;
    const draw = () => {
      const links = dev.links(st), live = dev.coil && dev.powered && dev.powered(st) && sel.some(x => dev.coil.includes(x)), r = sel.length === 2 && !live ? BO.measure(links, sel[0], sel[1]) : null;
      host.querySelector('.bo-svg').innerHTML = `<svg viewBox="0 0 300 230"><rect x="20" y="15" width="260" height="200" rx="10" class="bo-body"/>
        ${dev.t.map(([id, x, y]) => `<g class="bo-t ${sel.includes(id) ? 'on' : ''}" data-t="${id}"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y + (y < 100 ? -18 : 30)}">${id}</text><path d="M${x - 6} ${y} h12 M${x} ${y - 6} v12" class="bo-screw"/></g>`).join('')}
        <text x="150" y="118" class="bo-name">${esc(opts.title || dev.n)}</text></svg>`;
      host.querySelectorAll('.bo-t').forEach(gp => gp.onclick = () => { const id = gp.dataset.t; if (sel.length === 2) sel.length = 0; if (!sel.includes(id)) sel.push(id); draw(); if (sel.length === 2 && !(dev.coil && dev.powered && dev.powered(st) && sel.some(x => dev.coil.includes(x)))) { const v = BO.measure(dev.links(st), sel[0], sel[1]); log.unshift(`${sel[0]} – ${sel[1]} (${opts.stateText ? opts.stateText(st) : stText(st)}) : ${BO.fmt(v)}`); if (log.length > 8) log.pop(); host.querySelector('.bo-log').innerHTML = log.map(l => `<div>${esc(l)}</div>`).join(''); } });
      host.querySelector('.bo-lcd').textContent = live && sel.length === 2 ? '⚠ sous tension' : r == null ? (sel.length ? 'pointe COM sur ' + sel[0] : '- - - Ω') : BO.fmt(r);
      host.querySelector('.bo-warn').textContent = live && sel.length === 2 ? "Une broche mesurée est sous tension : on ne mesure jamais une résistance sur un circuit alimenté (risque pour l'appareil et fausse mesure). Coupe l'alimentation de la bobine." : '';
    };
    const stText = s => Object.entries(s).map(([k, v]) => k === 'on' ? (v ? 'actionné' : 'au repos') : k === 'trip' ? (v ? 'déclenché' : 'non déclenché') : k === 'c' ? (v ? 'contact fermé' : 'contact ouvert') : k === 'p' ? 'touche en position ' + v : '').join(', ');
    host.innerHTML = `<div class="bo-grid"><div class="bo-svg"></div><div><div class="bo-meter"><small>Ω — hors tension</small><b class="bo-lcd">- - - Ω</b></div>
      <div class="bo-acts">${dev.acts.map(([k, t, kind]) => `<button class="btn sm" data-a="${k}" data-kind="${kind}">${esc(t)}</button>`).join('')}</div>
      <p class="bad-t bo-warn" style="font-size:12.5px"></p><p class="muted" style="font-size:12.5px">Clique deux bornes : la première reçoit la pointe COM, la seconde la pointe Ω.</p><div class="log bo-log"></div></div></div>`;
    host.querySelectorAll('[data-a]').forEach(b => {
      const k = b.dataset.a, kind = b.dataset.kind;
      if (kind === 'hold') { b.addEventListener('pointerdown', () => { st[k] = true; draw(); }); ['pointerup', 'pointerleave'].forEach(e => b.addEventListener(e, () => { st[k] = false; draw(); })); b.textContent += ' (maintenir)'; }
      else if (kind === 'toggle') b.onclick = () => { st[k] = !st[k]; draw(); };
      else if (kind === 'pulse') b.onclick = () => { if (pulseOn) return; pulseOn = true; st.c = !st.c; draw(); setTimeout(() => { pulseOn = false; }, 300); };
      else if (kind === 'flip') b.onclick = () => { st.p = st.p === 1 ? 2 : 1; draw(); };
    });
    draw();
    return { st, draw };
  };

  SIMS.bornes = (el, o) => {
    let key = (o && o.dev) || 'contacteur';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-d">${Object.entries(BO.DEV).map(([k, d]) => `<button data-k="${k}" class="${k === key ? 'on' : ''}">${esc(d.s)}</button>`).join('')}</div></div>
      <div class="bo-wrap"><figure class="photo bo-photo"><img alt=""><figcaption></figcaption></figure><div class="js-dev"></div></div><p class="muted js-note" style="padding:0 16px 14px;font-size:13px"></p></div>`;
    const show = () => {
      const d = BO.DEV[key], ph = AA.PHOTOS[d.photo];
      el.querySelector('.bo-photo img').src = ph.src; el.querySelector('.bo-photo img').alt = ph.cap;
      el.querySelector('.bo-photo figcaption').innerHTML = `${esc(ph.cap)}<br><small>Photo : ${esc(ph.author)}, ${esc(ph.license)}, Wikimedia Commons</small>`;
      el.querySelector('.js-note').textContent = d.note;
      deviceView(el.querySelector('.js-dev'), d, {});
    };
    el.querySelectorAll('.js-d button').forEach(b => b.onclick = () => { key = b.dataset.k; el.querySelectorAll('.js-d button').forEach(x => x.classList.toggle('on', x === b)); show(); });
    show();
  };

  /* Relais inconnu : trouver le brochage à l'ohmmètre */
  SIMS.relaisinconnu = (el, o) => {
    const r = AA.rng((o && o.seed) || Date.now()), m = BO.mystery(r);
    const dev = { n: 'Relais à deux inverseurs — brochage inconnu', t: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((p, i) => [p, 45 + (i % 4) * 70, i < 4 ? 40 : 190]), st: { on: false },
      acts: [['on', 'Alimenter la bobine au banc (230 V~)', 'toggle']], links: s => BO.mysteryLinks(m, s.on), coil: m.coil, powered: s => s.on };
    const pins = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], sel = (k) => `<select class="sel" data-q="${k}"><option value="">—</option>${pins.map(p => `<option>${p}</option>`).join('')}</select>`;
    el.innerHTML = `<div class="simcard"><div class="bo-wrap"><figure class="photo bo-photo"><img src="${AA.PHOTOS.relaisbase.src}" alt=""><figcaption>${esc(AA.PHOTOS.relaisbase.cap)}<br><small>Photo : ${esc(AA.PHOTOS.relaisbase.author)}, ${esc(AA.PHOTOS.relaisbase.license)}</small></figcaption></figure><div class="js-dev"></div></div>
      <div style="padding:0 16px 14px"><p>Le marquage de ce relais est effacé. À l'ohmmètre (hors tension), puis en alimentant la bobine au banc d'essai, retrouve le rôle de chaque broche. Indice : la bobine est la seule liaison qui présente une résistance de plusieurs centaines d'ohms ou plus ; un commun est relié à une broche au repos et à une autre quand le relais est alimenté.</p>
      <div class="bo-quiz"><div>Bobine : ${sel('c1')} – ${sel('c2')}</div><div>Inverseur 1 : commun ${sel('a1')} · repos (NC) ${sel('a2')} · travail (NO) ${sel('a3')}</div><div>Inverseur 2 : commun ${sel('b1')} · repos (NC) ${sel('b2')} · travail (NO) ${sel('b3')}</div></div>
      <button class="btn primary sm js-ok">${ic.check}Vérifier mon brochage</button><div class="js-fb"></div></div></div>`;
    let powered = false;
    const view = deviceView(el.querySelector('.js-dev'), dev, { stateText: s => s.on ? 'bobine alimentée' : 'au repos' });
    el.querySelector('[data-a="on"]').addEventListener('click', () => { powered = view.st.on; });
    el.querySelector('.js-ok').onclick = () => {
      const v = k => el.querySelector(`[data-q="${k}"]`).value;
      const coilOk = [v('c1'), v('c2')].sort().join() === m.coil.slice().sort().join();
      const setOk = (a, b, c) => [m.s1, m.s2].some(s => s.com === v(a) && s.nc === v(b) && s.no === v(c));
      const ok1 = setOk('a1', 'a2', 'a3'), ok2 = setOk('b1', 'b2', 'b3') && v('a1') !== v('b1');
      const score = Math.round(100 * ((coilOk ? 1 : 0) + (ok1 ? 1 : 0) + (ok2 ? 1 : 0)) / 3);
      el.querySelector('.js-fb').innerHTML = `<div class="result ${score === 100 ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>Bobine ${coilOk ? '✔' : '✘'} · inverseur 1 ${ok1 ? '✔' : '✘'} · inverseur 2 ${ok2 ? '✔' : '✘'}.</p>
        <p class="muted">Brochage réel : bobine ${m.coil.join('-')} (${BO.fmt(m.R)}) ; inverseur ${m.s1.com} (commun), ${m.s1.nc} (repos), ${m.s1.no} (travail) ; inverseur ${m.s2.com} (commun), ${m.s2.nc} (repos), ${m.s2.no} (travail).</p></div>`;
      if (o && o.onDone) o.onDone(score);
      void powered;
    };
  };

  Object.assign(AA.SIMFORM, { bornes: ['Ohmmètre hors tension : contact fermé ≈ 0 Ω ; contact ouvert : OL ; bobine : résistance de quelques dizaines d\'ohms à quelques kilo-ohms selon le modèle', 'Repères : pôles 1-2, 3-4, 5-6 ; auxiliaires …3-…4 (fermeture), …1-…2 (ouverture) ; bobine A1-A2 ; relais thermique 95-96 (NC), 97-98 (NO)'] });

  /* Défi : relais inconnu */
  const register = () => {
    const D = AA.Defis; if (!D || !D.TYPES) return;
    D.TYPES.bornes = {
      name: 'Brochage d\'un relais inconnu', icon: 'meter', min: 1,
      desc: 'Un relais dont le marquage est effacé : à l\'ohmmètre et au banc d\'essai, retrouve la bobine et les deux inverseurs (commun, repos, travail).',
      gen: (r, lvl) => ({ seed: Math.floor(r() * 1e9), lvl, sig: String(Math.floor(r() * 1e6)) }),
      play(main, inst, done) {
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Bornes des appareils</p><h1>Brochage d'un relais inconnu</h1></div></div><div class="js-s"></div>`;
        let finished = false;
        SIMS.relaisinconnu(main.querySelector('.js-s'), { seed: inst.seed, onDone: s => { if (!finished) { finished = true; done(s); } } });
      }
    };
  };
  register();
  Object.assign(AA.VISMAP, { n1m3l2: [{ sim: 'bornes' }, { sim: 'relaisinconnu' }] });
})();
