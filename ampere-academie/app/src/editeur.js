/* Ampère Académie — défi « Éditeur de schéma » : à partir d'un cahier des charges, l'apprenant compose
 * les branches d'un circuit de commande (contacts en série et en parallèle, puis une charge).
 * Le folio est généré automatiquement (format de circuits.js), simulé par le moteur électrique et manœuvrable.
 * La correction rejoue les essais du cahier des charges sur la simulation : toute solution qui se comporte
 * correctement est acceptée (il existe souvent plusieurs schémas valides). */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const E = AA.EDITOR = {};

  /* Catalogue des éléments (contacts et charges) */
  E.EL = {
    S1: { type: 'pb_nc', t: ['1', '2'], info: 'Bouton Arrêt (contact à ouverture)', color: 'red' },
    S3: { type: 'pb_nc', t: ['1', '2'], info: 'Bouton Arrêt du poste 2 (contact à ouverture)', color: 'red' },
    S2: { type: 'pb_no', t: ['3', '4'], info: 'Bouton Marche (contact à fermeture)', color: 'green' },
    S4: { type: 'pb_no', t: ['3', '4'], info: 'Bouton Marche du poste 2 (contact à fermeture)', color: 'green' },
    S5: { type: 'pb_no', t: ['3', '4'], info: 'Bouton Marche arrière (contact à fermeture)', color: 'white' },
    SA1: { type: 'sw1', t: ['1', '2'], info: 'Sélecteur (fermé = position 1)' },
    'KM1.13': { type: 'no', of: 'KM1', tag: 'KM1', t: ['13', '14'], info: 'Contact à fermeture de KM1' },
    'KM1.23': { type: 'no', of: 'KM1', tag: 'KM1', t: ['23', '24'], info: 'Contact à fermeture de KM1' },
    'KM1.21': { type: 'nc', of: 'KM1', tag: 'KM1', t: ['21', '22'], info: 'Contact à ouverture de KM1' },
    'KM2.13': { type: 'no', of: 'KM2', tag: 'KM2', t: ['13', '14'], info: 'Contact à fermeture de KM2' },
    'KM2.21': { type: 'nc', of: 'KM2', tag: 'KM2', t: ['21', '22'], info: 'Contact à ouverture de KM2' },
    KM1: { type: 'coil', t: ['A1', 'A2'], u: 230, info: 'Bobine du contacteur KM1', load: true },
    KM2: { type: 'coil', t: ['A1', 'A2'], u: 230, info: 'Bobine du contacteur KM2', load: true },
    H1: { type: 'lamp', color: 'green', info: 'Voyant', load: true }
  };

  /* Cahiers des charges : éléments disponibles et essais de recette */
  E.SPECS = [
    { id: 'dol', lvl: 1, title: 'Démarrage direct avec auto-maintien', text: 'Un appui bref sur S2 met KM1 sous tension et il le reste après relâchement. S1 arrête KM1. Si S1 et S2 sont appuyés ensemble, KM1 doit rester à l\'arrêt (priorité à l\'arrêt).',
      els: ['S1', 'S2', 'KM1.13', 'KM1.21', 'KM1'],
      tests: [['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true }, 'Après un appui bref sur S2, KM1 reste collé'], ['press', 'S1'], ['expect', { KM1: false }, 'S1 arrête KM1'], ['press', 'S2'], ['expect', { KM1: false }, 'S1 et S2 appuyés ensemble : KM1 reste à l\'arrêt'], ['release', 'S2'], ['release', 'S1'], ['expect', { KM1: false }, 'Au repos, KM1 ne redémarre pas seul']] },
    { id: 'voyant', lvl: 2, title: 'Démarrage direct et voyant de marche', text: 'Comme le démarrage direct (S2 marche, S1 arrêt, auto-maintien, priorité à l\'arrêt), avec en plus un voyant H1 allumé seulement quand KM1 est collé.',
      els: ['S1', 'S2', 'KM1.13', 'KM1.23', 'KM1', 'H1'],
      tests: [['expect', { KM1: false, H1: false }, 'Au repos : tout est éteint'], ['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true, H1: true }, 'En marche : KM1 collé et H1 allumé'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, H1: false }, 'Après l\'arrêt : KM1 et H1 éteints']] },
    { id: 'postes', lvl: 2, title: 'Commande depuis deux postes', text: 'KM1 doit pouvoir démarrer depuis S2 (poste 1) ou S4 (poste 2), et s\'arrêter depuis S1 (poste 1) ou S3 (poste 2). Auto-maintien obligatoire ; un appui sur n\'importe quel arrêt doit être prioritaire.',
      els: ['S1', 'S3', 'S2', 'S4', 'KM1.13', 'KM1'],
      tests: [['press', 'S4'], ['release', 'S4'], ['expect', { KM1: true }, 'Marche depuis le poste 2'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false }, 'Arrêt depuis le poste 1'], ['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true }, 'Marche depuis le poste 1'], ['press', 'S3'], ['release', 'S3'], ['expect', { KM1: false }, 'Arrêt depuis le poste 2'], ['press', 'S3'], ['press', 'S4'], ['expect', { KM1: false }, 'Arrêt du poste 2 prioritaire sur la marche du poste 2'], ['release', 'S3'], ['release', 'S4']] },
    { id: 'acoups', lvl: 3, title: 'Marche continue ou à-coups', text: 'Sélecteur SA1 fermé : marche continue (S2 marche, S1 arrêt, auto-maintien). SA1 ouvert : KM1 ne doit être collé que pendant l\'appui sur S2.',
      els: ['S1', 'S2', 'SA1', 'KM1.13', 'KM1'],
      tests: [['press', 'S2'], ['expect', { KM1: true }, 'SA1 ouvert : KM1 collé pendant l\'appui'], ['release', 'S2'], ['expect', { KM1: false }, 'SA1 ouvert : KM1 retombe au relâchement'], ['toggle', 'SA1'], ['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true }, 'SA1 fermé : auto-maintien'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false }, 'S1 arrête']] },
    { id: 'inversion', lvl: 4, title: 'Deux sens de marche avec verrouillage', text: 'S2 commande la marche avant (KM1), S5 la marche arrière (KM2), S1 arrête tout. Chaque contacteur s\'auto-maintient. KM1 et KM2 ne doivent jamais être collés ensemble (court-circuit entre phases) : il faut passer par l\'arrêt pour changer de sens.',
      els: ['S1', 'S2', 'S5', 'KM1.13', 'KM2.13', 'KM1.21', 'KM2.21', 'KM1', 'KM2'],
      tests: [['press', 'S2'], ['release', 'S2'], ['expect', { KM1: true, KM2: false }, 'Marche avant'], ['press', 'S5'], ['release', 'S5'], ['expect', { KM1: true, KM2: false }, 'Pendant la marche avant, S5 est sans effet (verrouillage)'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, KM2: false }, 'S1 arrête'], ['press', 'S5'], ['release', 'S5'], ['expect', { KM1: false, KM2: true }, 'Marche arrière'], ['press', 'S2'], ['release', 'S2'], ['expect', { KM1: false, KM2: true }, 'Pendant la marche arrière, S2 est sans effet'], ['press', 'S1'], ['release', 'S1'], ['expect', { KM1: false, KM2: false }, 'S1 arrête la marche arrière'], ['press', 'S2'], ['press', 'S5'], ['expect', { KM1: true, KM2: false }, 'S2 puis S5 appuyés ensemble : un seul contacteur'], ['release', 'S2'], ['release', 'S5'], ['press', 'S1'], ['release', 'S1']] }
  ];

  /* Génération du folio à partir du modèle :
   * { common: [cases…] (tronc commun en série après F1),
   *   branches: [{ groups: [cases…], load: id, src: 'top' | (absent) }] }
   * src 'top' : la branche part directement après F1, en amont du tronc commun (ex. voyant de défaut thermique).
   * Une case = [chemin, chemin…] en parallèle ; un chemin = [id, id…] en série. */
  E.layout = (model, cat) => {
    cat = cat || E.EL;
    const parts = [], wires = [], dots = [];
    const P = (id, x, y, a, b) => { const d = cat[id]; const p = { type: d.type, id, x, y, n: { a, b } }; ['t', 'of', 'tag', 'u', 'color', 'info', 'delay', 'mech'].forEach(k => { if (d[k] != null) p[k] = d[k]; }); parts.push(p); };
    const W = (n, ...p) => wires.push({ n, p });
    const gh = g => 6 * Math.max(1, ...g.map(pa => pa.length));
    const hOf = groups => groups.reduce((h, g) => h + gh(g), 0);
    const wOf = groups => 5 * Math.max(1, ...groups.map(g => g.length));
    const drawGroups = (groups, x, net, y, top, pre, lastNet) => {
      groups.forEach((grp, i) => {
        const h = gh(grp), bot = top + h - 2, out = i === groups.length - 1 && lastNet ? lastNet : `${pre}g${i}`;
        W(net, [x, y], [x, top]);
        grp.forEach((path, j) => {
          const xj = x + 5 * j;
          if (j > 0) { W(net, [x + 5 * (j - 1), top - 1], [xj, top - 1], [xj, top]); dots.push([x + 5 * (j - 1), top - 1]); }
          let pn = net;
          path.forEach((id, e) => { const mid = top + 2 + 6 * e, nn = e === path.length - 1 ? out : `${pre}g${i}p${j}e${e}`; if (e > 0) W(pn, [xj, mid - 4], [xj, mid - 2]); P(id, xj, mid, pn, nn); pn = nn; });
          const last = top + 6 * path.length - 2;
          if (last < bot) W(out, [xj, last], [xj, bot]);
          if (j > 0) { W(out, [xj, bot], [xj, bot + 1], [x + 5 * (j - 1), bot + 1]); dots.push([x + 5 * (j - 1), bot + 1]); }
        });
        net = out; y = bot; top += h;
      });
      return { net, y, top };
    };
    const common = (model.common || []).filter(g => g.length);
    const all = model.branches.filter(b => b.load);
    const tops = all.filter(b => b.src === 'top' || !common.length), subs = common.length ? all.filter(b => b.src !== 'top') : [];
    parts.push({ type: 'fuse', id: 'F1', x: 4, y: 5, n: { a: 'L', b: 'cf' }, rating: 2, t: ['1', '2'], info: 'Fusible du circuit de commande' });
    W('L', [4, 1], [4, 3]); W('cf', [4, 7], [4, 8]);
    // branches directes (après F1) à gauche, puis le tronc commun et ses branches
    let bx = 4; const xsTop = [];
    tops.forEach(b => { xsTop.push(bx); bx += wOf(b.groups) + 3; });
    const xC = common.length ? bx : null;
    let yb = 8, xsSub = [];
    const rC = common.length ? drawGroups(common, xC, 'cf', 8, 11, 'cc', 'c0') : null;
    if (rC) { yb = rC.top + 1; W('c0', [xC, rC.y], [xC, yb]); bx = xC; subs.forEach(b => { xsSub.push(bx); bx += wOf(b.groups) + 3; }); }
    const xTopEnd = Math.max(4, xC != null ? xC : (xsTop.length ? xsTop[xsTop.length - 1] : 4));
    if (xTopEnd > 4) W('cf', [4, 8], [xTopEnd, 8]);
    if (rC && xsSub.length && xsSub[xsSub.length - 1] > xC) W('c0', [xC, yb], [xsSub[xsSub.length - 1], yb]);
    const hTop = Math.max(0, ...tops.map(b => 11 + hOf(b.groups))), hSub = Math.max(0, ...subs.map(b => yb + 3 + hOf(b.groups)));
    const yN = Math.max(hTop, hSub, 17) + 8;
    const drawBranch = (b, x, net, y, top, pre) => { dots.push([x, y]); const r = drawGroups(b.groups, x, net, y, top, pre, null), lmid = r.top + 2; W(r.net, [x, r.y], [x, r.top]); P(b.load, x, lmid, r.net, 'N'); W('N', [x, lmid + 2], [x, yN]); };
    tops.forEach((b, k) => drawBranch(b, xsTop[k], 'cf', 8, 11, `t${k}`));
    subs.forEach((b, k) => drawBranch(b, xsSub[k], 'c0', yb, yb + 3, `b${k}`));
    const xEnd = Math.max(4, ...xsTop, ...xsSub, xC || 4);
    W('N', [2, yN], [xEnd, yN]);
    const nets = {}; parts.forEach(p => Object.values(p.n).forEach(v => { nets[v] = 1; })); wires.forEach(w => { nets[w.n] = 1; }); nets.L = 1; nets.N = 1;
    const wMax = Math.max(xEnd + 10, ...(xsSub.length ? subs.map((b, k) => xsSub[k] + wOf(b.groups) + 4) : [0]), ...(xsTop.length ? tops.map((b, k) => xsTop[k] + wOf(b.groups) + 4) : [0]), xC ? xC + wOf(common) + 4 : 0);
    return { id: '_editor', title: 'Ton schéma', folio: 'Circuit de commande — ta solution', level: 'Défi', w: wMax, h: yN + 3, intro: '', sources: [{ net: 'L', pot: 'L1', x: 4, y: 1, label: 'L' }, { net: 'N', pot: 'N', x: 2, y: yN, label: 'N' }], parts, wires, dots: dots.filter((d, i, a) => a.findIndex(e => e[0] === d[0] && e[1] === d[1]) === i), sections: [{ x: 1.5, y: 0.2, t: 'Commande 230 V' }], nets };
  };

  /* Exécution d'essais sur une simulation.
   * Actions : press / release / toggle / latch (arrêt d'urgence à accrochage) / wait (s) / fault (surcharge d'un moteur)
   * / clear (fin de surcharge) / reset (réarmement d'un relais thermique) / expect.
   * Attendus : bobine ou voyant → booléen ; moteur → 'stop', 'run', 'run+', 'run-', 'Y', 'D'. */
  E.run = (circ, tests, cat) => {
    const Sim = window.AASim.Sim, s = new Sim(circ), res = [];
    s.parts.forEach(p => { if ((p.type === 'breaker3' || p.type === 'cb') && !p.st.on) s.toggle(p.id); });
    const motorOk = (m, v) => { if (!m) return v === 'stop'; if (v === 'stop') return m.state === 'stop'; if (m.state !== 'run') return false; if (v === 'run') return true; if (v === 'run+') return m.dir > 0; if (v === 'run-') return m.dir < 0; return m.coupling === v; };
    for (const [a, x, lbl] of tests) {
      if (a === 'press' || a === 'release') { if (s.byId[x]) s.press(x, a === 'press'); }
      else if (a === 'toggle') { if (s.byId[x]) s.toggle(x); }
      else if (a === 'latch') { if (s.byId[x]) s.latch(x); }
      else if (a === 'wait') { for (let t = 0; t < x - 1e-9; t += 0.1) s.step(Math.min(0.1, x - t)); }
      else if (a === 'fault') { if (s.byId[x]) s.setFault(x, 'overload'); }
      else if (a === 'clear') { if (s.byId[x]) s.setFault(x, null); }
      else if (a === 'reset') { if (s.byId[x]) s.toggle(x); }
      else if (a === 'expect') {
        const blown = s.byId.F1 && s.byId.F1.st.blown;
        const ok = !blown && Object.entries(x).every(([k, v]) => { const d = cat[k] || {}; if (s.motor && k in s.motor) return motorOk(s.motor[k], v); if (/^M\d/.test(k)) return motorOk(null, v); return (d.type === 'lamp' ? !!(s.lamp && s.lamp[k]) : !!s.coil[k]) === v; });
        res.push({ lbl: blown ? lbl + ' — court-circuit : le fusible F1 a fondu' : lbl, ok });
      }
    }
    return res;
  };

  /* Recette d'un cahier des charges de l'éditeur (commande seule) */
  E.grade = (model, spec) => {
    const cat = spec.defs || E.EL, circ = E.layout(model, cat), res = E.run(circ, spec.tests, cat);
    const missingLoads = spec.els.filter(k => cat[k] && cat[k].load).filter(k => !circ.parts.find(p => p.id === k));
    const score = res.length ? Math.round(100 * res.filter(r => r.ok).length / res.length) : 0;
    return { res, score: missingLoads.length ? Math.min(score, 50) : score, missingLoads, nParts: circ.parts.length - 1 };
  };

  /* Constructeur de branches réutilisable : host, modèle, éléments disponibles, catalogue, rappel à chaque modification */
  E.builder = (host, model, els, cat, onChange) => {
    host.innerHTML = '<div class="js-br"></div><button class="btn sm js-addb">+ Nouvelle branche</button><p class="muted" style="font-size:12.5px;margin-top:10px">Dans une branche, les cases se succèdent en série de haut en bas. Une case peut contenir plusieurs chemins en parallèle, et chaque chemin plusieurs éléments en série. Chaque branche se termine par une charge et part soit après le tronc commun, soit directement après le fusible F1.</p>';
    const used = () => new Set(model.common.flat(2).concat(model.branches.flatMap(b => b.groups.flat(2).concat(b.load ? [b.load] : []))));
    const opts = (load, cur) => els.filter(id => !!cat[id].load === load && (!used().has(id) || id === cur)).map(id => `<option value="${id}" ${id === cur ? 'selected' : ''}>${id} — ${esc(cat[id].info)}</option>`).join('');
    const chip = (id, i, j, e) => `<span class="ed-el ${/nc$/.test(cat[id].type) ? 'nc' : ''}" title="${esc(cat[id].info)}">${id}<button data-a="del" data-i="${i}" data-j="${j}" data-e="${e}" title="Retirer">×</button></span>`;
    const groupsHtml = groups => groups.map((g, i) => `<div class="ed-group">${g.map((path, j) => `<div class="ed-path">${path.map((id, e) => chip(id, i, j, e)).join('<i class="ed-ser">—</i>')}<select class="sel ed-sel" data-a="pser" data-i="${i}" data-j="${j}"><option value="">+ en série dans ce chemin…</option>${opts(false)}</select></div>`).join('<i class="ed-par">∥</i>')}
      <select class="sel ed-sel" data-a="par" data-i="${i}"><option value="">+ nouveau chemin en parallèle…</option>${opts(false)}</select></div><div class="ed-link"></div>`).join('');
    const render = () => {
      host.querySelector('.js-br').innerHTML = `<div class="ed-branch ed-common" data-k="c"><div class="ed-bh"><b>Tronc commun</b><span class="muted" style="font-size:12px">en série après F1, avant les branches (facultatif)</span></div>${groupsHtml(model.common)}<select class="sel ed-sel" data-a="ser"><option value="">+ élément en série dans le tronc commun…</option>${opts(false)}</select></div>`
        + model.branches.map((b, k) => `<div class="ed-branch" data-k="${k}"><div class="ed-bh"><b>Branche ${k + 1}</b><button class="btn sm ghost" data-a="delb">Supprimer</button></div>
        <div class="ed-load"><span>Départ :</span><select class="sel" data-a="src"><option value="">après le tronc commun</option><option value="top" ${b.src === 'top' ? 'selected' : ''}>directement après F1</option></select></div>
        ${groupsHtml(b.groups)}
        <select class="sel ed-sel" data-a="ser"><option value="">+ élément en série dans la branche…</option>${opts(false)}</select>
        <div class="ed-load"><span>Charge :</span><select class="sel" data-a="load"><option value="">— choisir —</option>${opts(true, b.load)}</select></div></div>`).join('');
      host.querySelectorAll('.ed-branch').forEach(div => {
        const isC = div.dataset.k === 'c', b = isC ? { groups: model.common } : model.branches[+div.dataset.k];
        div.querySelectorAll('[data-a]').forEach(c => {
          const a = c.dataset.a, i = +c.dataset.i, j = +c.dataset.j, ch = () => { render(); onChange(); };
          if (a === 'delb') c.onclick = () => { model.branches.splice(+div.dataset.k, 1); if (!model.branches.length) model.branches.push({ groups: [], load: null }); ch(); };
          if (a === 'del') c.onclick = () => { const g = b.groups[i], pa = g[j]; pa.splice(+c.dataset.e, 1); if (!pa.length) g.splice(j, 1); if (!g.length) b.groups.splice(i, 1); ch(); };
          if (a === 'pser') c.onchange = () => { if (c.value) { b.groups[i][j].push(c.value); ch(); } };
          if (a === 'par') c.onchange = () => { if (c.value) { b.groups[i].push([c.value]); ch(); } };
          if (a === 'ser') c.onchange = () => { if (c.value) { b.groups.push([[c.value]]); ch(); } };
          if (a === 'load') c.onchange = () => { b.load = c.value || null; ch(); };
          if (a === 'src') c.onchange = () => { b.src = c.value || undefined; ch(); };
        });
      });
    };
    host.querySelector('.js-addb').onclick = () => { model.branches.push({ groups: [], load: null }); render(); };
    render();
    return { render };
  };

  /* Interface du défi « Éditeur de schéma » */
  const register = () => {
    const D = AA.Defis; if (!D || !D.TYPES) return;
    D.TYPES.schema = {
      name: 'Éditeur de schéma', icon: 'schema', min: 1,
      desc: 'Un cahier des charges, des boutons, des contacts et des bobines : compose toi-même le circuit de commande, essaie-le sur le folio vivant, puis lance la recette. Toute solution qui fonctionne est acceptée.',
      gen(r, lvl) { const pool = E.SPECS.filter(s => s.lvl <= Math.max(1, lvl)); const sp = r.pick(pool.length ? pool : E.SPECS); return { spec: sp.id, lvl, sig: sp.id + lvl }; },
      play(main, inst, done) {
        const spec = E.SPECS.find(s => s.id === inst.spec), cat = spec.defs || E.EL;
        const model = { common: [], branches: [{ groups: [], load: null }] };
        let bench = null, finished = false;
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Éditeur de schéma</p><h1>${esc(spec.title)}</h1></div></div>
          <div class="brief">${esc(spec.text)}</div>
          <div class="ed-grid"><div class="card ed-build"><p class="eyebrow">Ton circuit, branche par branche (de L vers N)</p><div class="js-b"></div></div>
            <div class="ed-folio"><div class="js-fo"></div></div></div>
          <div class="row" style="margin-top:14px"><button class="btn primary js-ok">${ic.check}Lancer la recette</button></div><div class="js-fb"></div>`;
        const rebuild = () => {
          if (bench) { bench.destroy(); bench = null; }
          const fo = main.querySelector('.js-fo');
          if (!model.branches.some(b => b.load)) { fo.innerHTML = '<div class="card plain" style="padding:30px;text-align:center">Choisis au moins une charge (bobine ou voyant) pour voir le folio.</div>'; return; }
          window.AACircuits.C._editor = E.layout(model, cat);
          bench = AA.bench(fo, '_editor', { height: '480px' });
        };
        E.builder(main.querySelector('.js-b'), model, spec.els, cat, rebuild);
        main.querySelector('.js-ok').onclick = () => {
          const g = E.grade(model, spec);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${g.score >= 70 ? 'win' : 'lose'}"><div class="score-big">${g.score}</div>
            <ol class="nice">${g.res.map(r => `<li class="${r.ok ? 'ok-t' : 'bad-t'}">${r.ok ? '✔' : '✘'} ${esc(r.lbl)}</li>`).join('')}</ol>
            ${g.missingLoads.length ? `<p class="bad-t">Charge(s) absente(s) du schéma : ${g.missingLoads.join(', ')}.</p>` : ''}
            <p class="muted">Ton schéma utilise ${g.nParts} élément(s). Plusieurs solutions sont possibles ; un schéma plus simple qui passe tous les essais est souvent le meilleur. Tu peux corriger et relancer la recette.</p></div>`;
          if (!finished && g.score === 100) { finished = true; done(100); }
        };
        rebuild();
        return () => { if (bench) bench.destroy(); };
      }
    };
  };
  register();
})();
