/* Ampère Académie — défi « Installation complète d'un logement ou d'un immeuble ».
 * L'apprenant conçoit le tableau de chaque type de logement (socles par pièce, circuits, sections, protections,
 * interrupteurs différentiels et répartition), puis, pour un immeuble, le tableau des services généraux.
 * Règles vérifiées (NF C 15-100, valeurs usuelles de l'édition 2015 et de ses amendements) :
 *  - socles 16 A : séjour 1 par tranche de 4 m², au moins 5 (7 exigés au plus) ; chambre 3 ; cuisine 6 ;
 *    salle de bains 1 ; entrée ou dégagement de 4 m² ou plus 1 ;
 *  - circuits de prises : 1,5 mm² + 16 A → 8 socles au plus ; 2,5 mm² + 20 A → 12 socles au plus ;
 *  - éclairage : 1 point par pièce, 8 points au plus par circuit, 1,5 mm², disjoncteur 10 A ou 16 A ;
 *  - circuits spécialisés : plaque 6 mm² / 32 A ; four, lave-linge, lave-vaisselle, sèche-linge, chauffe-eau
 *    2,5 mm² / 20 A, un circuit par appareil ; VMC 1,5 mm² / 2 A ; volets roulants 1,5 mm² / 16 A ;
 *  - interrupteurs différentiels 30 mA : ≤ 35 m² : 1 × 25 A type AC + 1 × 40 A type A ; 35 à 100 m² : 2 × 40 A type AC
 *    + 1 × 40 A type A ; > 100 m² : 3 × 40 A type AC + 1 × 40 A type A ; plaque et lave-linge sur l'interrupteur de type A.
 * Toute répartition qui respecte ces règles est acceptée. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const B = AA.BATIMENT = {};

  B.USES = {
    ecl: ['Éclairage', [[1.5, 10], [1.5, 16]]], pc: ['Prises 16 A', [[1.5, 16], [2.5, 20]]], plaque: ['Plaque de cuisson', [[6, 32]]], four: ['Four', [[2.5, 20]]],
    ll: ['Lave-linge', [[2.5, 20]]], lv: ['Lave-vaisselle', [[2.5, 20]]], sl: ['Sèche-linge', [[2.5, 20]]], ce: ['Chauffe-eau', [[2.5, 20]]], vmc: ['VMC', [[1.5, 2]]], vr: ['Volets roulants', [[1.5, 16]]]
  };
  B.SECTIONS = [1.5, 2.5, 4, 6, 10]; B.CALS = [2, 10, 16, 20, 25, 32, 40];
  B.minSocles = (kind, s) => kind === 'sejour' ? Math.min(7, Math.max(5, Math.ceil(s / 4))) : kind === 'chambre' ? 3 : kind === 'cuisine' ? (s > 4 ? 6 : 3) : kind === 'sdb' ? 1 : kind === 'entree' ? (s >= 4 ? 1 : 0) : 0;
  B.idRule = S => S <= 35 ? { AC: [25], A: [40] } : S <= 100 ? { AC: [40, 40], A: [40] } : { AC: [40, 40, 40], A: [40] };
  B.pcMax = (sec, cal) => sec === 1.5 && cal === 16 ? 8 : sec === 2.5 && cal === 20 ? 12 : 0;

  /* Logements types */
  B.TYPES = {
    studio: r => ({ n: 'Studio', rooms: [['Pièce principale', 'sejour', r.pick([18, 20, 22])], ['Coin cuisine', 'cuisine', r.pick([5, 6])], ['Salle d\'eau', 'sdb', 4], ['Entrée', 'entree', 3]], eq: ['plaque', 'll', 'ce', 'vmc'] }),
    t2: r => ({ n: 'T2', rooms: [['Séjour', 'sejour', r.pick([20, 22, 24])], ['Cuisine', 'cuisine', r.pick([7, 8, 9])], ['Chambre', 'chambre', r.pick([10, 11, 12])], ['Salle de bains', 'sdb', 5], ['WC', 'wc', 2], ['Entrée', 'entree', 4]], eq: ['plaque', 'four', 'll', 'ce', 'vmc'] }),
    t3: r => ({ n: 'T3', rooms: [['Séjour', 'sejour', r.pick([25, 27, 29])], ['Cuisine', 'cuisine', r.pick([9, 10, 11])], ['Chambre 1', 'chambre', r.pick([11, 12, 13])], ['Chambre 2', 'chambre', r.pick([9, 10])], ['Salle de bains', 'sdb', 6], ['WC', 'wc', 2], ['Dégagement', 'entree', r.pick([4, 5])]], eq: ['plaque', 'four', 'll', 'lv', 'ce', 'vmc'] }),
    t4: r => ({ n: 'T4', rooms: [['Séjour', 'sejour', r.pick([31, 33, 35])], ['Cuisine', 'cuisine', r.pick([11, 12])], ['Chambre 1', 'chambre', r.pick([12, 13, 14])], ['Chambre 2', 'chambre', r.pick([10, 11])], ['Chambre 3', 'chambre', r.pick([9, 10])], ['Salle de bains', 'sdb', 7], ['WC', 'wc', 2], ['Dégagement', 'entree', r.pick([5, 6])]], eq: ['plaque', 'four', 'll', 'lv', 'sl', 'ce', 'vmc', 'vr'] })
  };
  B.SERVICES = { n: 'Services généraux', rooms: [['Hall et escaliers', 'commun', 0], ['Local poubelles', 'commun', 0], ['Caves', 'commun', 0]], need: [['ecl', 'Éclairage des parties communes (commandé par minuterie)', 3], ['pc', 'Prises du local d\'entretien', 2]] };

  B.gen = (r, lvl) => {
    const keys = lvl <= 1 ? ['t2'] : lvl === 2 ? ['t3'] : lvl === 3 ? ['t4'] : lvl === 4 ? ['studio', 't3'] : ['studio', 't2', 't4'];
    const units = keys.map(k => B.TYPES[k](r));
    const nb = lvl <= 3 ? [1] : keys.map(() => r.pick([2, 3, 4]));
    return { lvl, building: lvl >= 4, units, nb, sig: units.map(u => u.n + u.rooms.map(x => x[2]).join('.')).join('|') };
  };
  B.surface = u => u.rooms.reduce((a, x) => a + x[2], 0);

  /* Vérification d'un tableau de logement. d = { socles: [n par pièce], circuits: [{u, pts, sec, cal, id}], ids: [{cal, type}] } */
  B.checkUnit = (u, d) => {
    const L = [], ok = (c, t) => L.push({ ok: !!c, t });
    u.rooms.forEach((rm, i) => { const m = B.minSocles(rm[1], rm[2]); if (m) ok((d.socles[i] || 0) >= m, `${rm[0]} (${rm[2]} m²) : au moins ${m} socle${m > 1 ? 's' : ''} — prévu : ${d.socles[i] || 0}`); });
    const totS = d.socles.reduce((a, b) => a + (+b || 0), 0), pcs = d.circuits.filter(c => c.u === 'pc'), ecls = d.circuits.filter(c => c.u === 'ecl');
    ok(pcs.reduce((a, c) => a + (+c.pts || 0), 0) === totS, `Les circuits de prises desservent exactement les ${totS} socles prévus`);
    pcs.forEach((c, k) => { const mx = B.pcMax(c.sec, c.cal); ok(mx && c.pts <= mx && c.pts > 0, `Circuit de prises ${k + 1} : ${AA.fmt(c.sec)} mm² / ${c.cal} A, ${c.pts} socles ${mx ? '(au plus ' + mx + ')' : '(association section / calibre non admise)'}`); });
    const nRooms = u.rooms.length;
    ok(ecls.reduce((a, c) => a + (+c.pts || 0), 0) === nRooms, `Éclairage : un point par pièce, soit ${nRooms} points au total`);
    ecls.forEach((c, k) => ok(c.sec === 1.5 && (c.cal === 10 || c.cal === 16) && c.pts >= 1 && c.pts <= 8, `Circuit d'éclairage ${k + 1} : 1,5 mm² protégé à 10 ou 16 A, 8 points au plus`));
    u.eq.forEach(e => { const cs = d.circuits.filter(c => c.u === e), ref = B.USES[e][1][0]; ok(cs.length === 1 && cs[0].sec === ref[0] && cs[0].cal === ref[1], `${B.USES[e][0]} : un circuit dédié ${AA.fmt(ref[0])} mm² / ${ref[1]} A`); });
    d.circuits.filter(c => !['pc', 'ecl'].includes(c.u) && !u.eq.includes(c.u)).forEach(c => ok(false, `${B.USES[c.u][0]} : circuit prévu pour un appareil absent du programme`));
    const rule = B.idRule(B.surface(u)), have = { AC: d.ids.filter(x => x.type === 'AC').map(x => x.cal).sort(), A: d.ids.filter(x => x.type === 'A').map(x => x.cal).sort() };
    const fmtR = rr => Object.entries(rr).map(([t, cs]) => cs.map(c => `${c} A type ${t}`).join(' + ')).join(' + ');
    ok(JSON.stringify(have.AC) === JSON.stringify(rule.AC.slice().sort()) && JSON.stringify(have.A) === JSON.stringify(rule.A) && d.ids.every(x => x.type === 'AC' || x.type === 'A'), `Interrupteurs différentiels 30 mA pour ${B.surface(u)} m² : ${fmtR(rule)}`);
    ok(d.circuits.every(c => c.id != null && d.ids[c.id]), 'Chaque circuit est raccordé à un interrupteur différentiel');
    ['plaque', 'll'].filter(e => u.eq.includes(e)).forEach(e => { const c = d.circuits.find(x => x.u === e); ok(c && d.ids[c.id] && d.ids[c.id].type === 'A', `${B.USES[e][0]} raccordé à l'interrupteur différentiel de type A`); });
    return L;
  };
  /* Une solution conforme (sert de correction et de contrôle) */
  B.reference = u => {
    const socles = u.rooms.map(rm => B.minSocles(rm[1], rm[2])), circuits = [], tot = socles.reduce((a, b) => a + b, 0);
    for (let k = tot; k > 0; k -= 12) circuits.push({ u: 'pc', pts: Math.min(12, k), sec: 2.5, cal: 20 });
    for (let k = u.rooms.length; k > 0; k -= 8) circuits.push({ u: 'ecl', pts: Math.min(8, k), sec: 1.5, cal: 16 });
    u.eq.forEach(e => { const r = B.USES[e][1][0]; circuits.push({ u: e, pts: 1, sec: r[0], cal: r[1] }); });
    const rule = B.idRule(B.surface(u)), ids = rule.AC.map(c => ({ cal: c, type: 'AC' })).concat(rule.A.map(c => ({ cal: c, type: 'A' }))), iA = ids.length - 1;
    let rr = 0; circuits.forEach(c => { c.id = ['plaque', 'll', 'lv', 'sl'].includes(c.u) ? iA : (rr++ % rule.AC.length); });
    return { socles, circuits, ids };
  };
  B.refServices = () => ({ socles: [], circuits: [{ u: 'ecl', pts: 3, sec: 1.5, cal: 10, id: 0 }, { u: 'pc', pts: 2, sec: 2.5, cal: 20, id: 0 }], ids: [{ cal: 40, type: 'AC' }] });
  B.checkServices = d => {
    const L = [], ok = (c, t) => L.push({ ok: !!c, t });
    B.SERVICES.need.forEach(([u, t, pts]) => { const cs = d.circuits.filter(c => c.u === u); const good = u === 'ecl' ? cs.some(c => c.sec === 1.5 && (c.cal === 10 || c.cal === 16)) : cs.some(c => B.pcMax(c.sec, c.cal) >= pts); ok(good, `${t} : circuit présent, section et protection adaptées`); });
    ok(d.circuits.length && d.circuits.every(c => c.id != null && d.ids[c.id]), 'Chaque circuit des services généraux est protégé par un interrupteur différentiel 30 mA');
    return L;
  };
  B.grade = (inst, designs, svc) => {
    const lines = [];
    inst.units.forEach((u, i) => B.checkUnit(u, designs[i]).forEach(l => lines.push({ ok: l.ok, t: `${u.n} — ${l.t}` })));
    if (inst.building) B.checkServices(svc).forEach(l => lines.push({ ok: l.ok, t: `Services généraux — ${l.t}` }));
    return { lines, score: Math.round(100 * lines.filter(l => l.ok).length / lines.length) };
  };

  /* Interface */
  const register = () => {
    const D = AA.Defis; if (!D || !D.TYPES) return;
    D.TYPES.batiment = {
      name: 'Installation d\'un logement ou d\'un immeuble', icon: 'path', min: 1,
      desc: 'Un programme de construction : place les socles pièce par pièce, crée les circuits, choisis sections et protections, répartis-les sur les interrupteurs différentiels. Aux niveaux élevés, tout un immeuble avec plusieurs types de logements et les services généraux.',
      gen: (r, lvl) => B.gen(r, lvl),
      play(main, inst, done) {
        const designs = inst.units.map(u => ({ socles: u.rooms.map(() => 0), circuits: [], ids: [] })), svc = { socles: [], circuits: [], ids: [] };
        let cur = 0, finished = false;
        const tabs = inst.units.map((u, i) => `${u.n}${inst.building ? ' (×' + inst.nb[i] + ')' : ''}`).concat(inst.building ? ['Services généraux'] : []);
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Installation ${inst.building ? 'd\'un immeuble' : 'd\'un logement'}</p><h1>${inst.building ? 'Petit immeuble de ' + inst.nb.reduce((a, b) => a + b, 0) + ' logements' : 'Logement ' + inst.units[0].n + ' de ' + B.surface(inst.units[0]) + ' m²'}</h1></div></div>
          <div class="brief">${inst.building ? 'Les logements d\'un même type sont identiques : conçois le tableau de chaque type, puis celui des services généraux.' : 'Conçois le tableau de répartition complet du logement.'} Toutes les règles appliquées sont celles de la NF C 15-100 pour les logements neufs. Toute solution conforme est acceptée.</div>
          <div class="seg js-tabs" style="margin:14px 0">${tabs.map((t, i) => `<button data-i="${i}" class="${i ? '' : 'on'}">${esc(t)}</button>`).join('')}</div><div class="js-body"></div>
          <div class="row" style="margin-top:14px"><button class="btn primary js-ok">${ic.check}Faire contrôler l'installation</button></div><div class="js-fb"></div>`;
        const sel = (k, opts, v) => `<select class="sel" data-k="${k}">${opts.map(([a, b]) => `<option value="${a}" ${String(a) === String(v) ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
        const body = main.querySelector('.js-body');
        const render = () => {
          const isSvc = inst.building && cur === inst.units.length, u = isSvc ? B.SERVICES : inst.units[cur], d = isSvc ? svc : designs[cur];
          const uses = isSvc ? ['ecl', 'pc'] : ['ecl', 'pc'].concat(u.eq);
          body.innerHTML = `<div class="grid g2">
            <div class="card"><p class="eyebrow">${isSvc ? 'Besoins' : 'Pièces et socles 16 A'}</p>${isSvc ? `<ul class="nice">${B.SERVICES.need.map(n => `<li>${esc(n[1])}${n[0] === 'pc' ? ' (' + n[2] + ' socles)' : ''}</li>`).join('')}</ul>` : `<table class="amdec"><thead><tr><th>Pièce</th><th>Surface</th><th>Socles</th></tr></thead><tbody>${u.rooms.map((rm, i) => `<tr><td>${esc(rm[0])}</td><td>${rm[2]} m²</td><td><input type="number" min="0" max="20" value="${d.socles[i]}" data-s="${i}" style="width:64px"></td></tr>`).join('')}</tbody></table>
              <p class="muted" style="font-size:12.5px">Surface habitable : ${B.surface(u)} m². Appareils prévus : ${u.eq.map(e => B.USES[e][0]).join(', ')}.</p>`}</div>
            <div class="card"><p class="eyebrow">Interrupteurs différentiels 30 mA</p>${d.ids.map((x, i) => `<div class="row" data-id="${i}"><b>ID${i + 1}</b>${sel('cal', [[25, '25 A'], [40, '40 A'], [63, '63 A']], x.cal)}${sel('type', [['AC', 'type AC'], ['A', 'type A'], ['F', 'type F'], ['B', 'type B']], x.type)}<button class="btn sm ghost" data-del="${i}">Retirer</button></div>`).join('')}<button class="btn sm js-addid">+ Interrupteur différentiel</button></div></div>
            <div class="card" style="margin-top:14px"><p class="eyebrow">Circuits</p><div class="amdec-wrap"><table class="amdec"><thead><tr><th>Usage</th><th>Points</th><th>Section</th><th>Disjoncteur</th><th>Différentiel</th><th></th></tr></thead><tbody>
              ${d.circuits.map((c, i) => `<tr data-c="${i}"><td>${sel('u', uses.map(k => [k, B.USES[k][0]]), c.u)}</td><td>${['ecl', 'pc'].includes(c.u) ? `<input type="number" min="1" max="20" value="${c.pts}" data-k="pts" style="width:60px">` : '—'}</td><td>${sel('sec', B.SECTIONS.map(v => [v, AA.fmt(v) + ' mm²']), c.sec)}</td><td>${sel('cal', B.CALS.map(v => [v, v + ' A']), c.cal)}</td><td>${sel('id', [['', '—']].concat(d.ids.map((x, k) => [k, 'ID' + (k + 1)])), c.id == null ? '' : c.id)}</td><td><button class="btn sm ghost" data-delc="${i}">×</button></td></tr>`).join('')}</tbody></table></div><button class="btn sm js-addc">+ Circuit</button></div>`;
          body.querySelectorAll('[data-s]').forEach(i => i.onchange = () => { d.socles[+i.dataset.s] = Math.max(0, +i.value || 0); });
          body.querySelectorAll('[data-id]').forEach(row => row.querySelectorAll('select').forEach(s => s.onchange = () => { d.ids[+row.dataset.id][s.dataset.k] = s.dataset.k === 'cal' ? +s.value : s.value; }));
          body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const k = +b.dataset.del; d.ids.splice(k, 1); d.circuits.forEach(c => { if (c.id === k) c.id = null; else if (c.id > k) c.id--; }); render(); });
          body.querySelector('.js-addid').onclick = () => { d.ids.push({ cal: 40, type: 'AC' }); render(); };
          body.querySelectorAll('[data-c]').forEach(row => { const c = d.circuits[+row.dataset.c]; row.querySelectorAll('[data-k]').forEach(s => s.onchange = () => { const k = s.dataset.k; c[k] = k === 'u' ? s.value : k === 'id' ? (s.value === '' ? null : +s.value) : +s.value; if (k === 'u') render(); }); });
          body.querySelectorAll('[data-delc]').forEach(b => b.onclick = () => { d.circuits.splice(+b.dataset.delc, 1); render(); });
          body.querySelector('.js-addc').onclick = () => { d.circuits.push({ u: 'pc', pts: 1, sec: 2.5, cal: 20, id: null }); render(); };
        };
        main.querySelectorAll('.js-tabs button').forEach(b => b.onclick = () => { cur = +b.dataset.i; main.querySelectorAll('.js-tabs button').forEach(x => x.classList.toggle('on', x === b)); render(); });
        main.querySelector('.js-ok').onclick = () => {
          const g = B.grade(inst, designs, svc);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${g.score >= 70 ? 'win' : 'lose'}"><div class="score-big">${g.score}</div><ol class="nice">${g.lines.map(l => `<li class="${l.ok ? 'ok-t' : 'bad-t'}">${l.ok ? '✔' : '✘'} ${esc(l.t)}</li>`).join('')}</ol>
            ${g.score < 100 ? `<details><summary>Voir une solution possible</summary>${inst.units.map(u => { const r = B.reference(u); return `<p><b>${u.n}</b> — socles : ${u.rooms.map((rm, i) => rm[0] + ' ' + r.socles[i]).join(', ')}.<br>Interrupteurs : ${r.ids.map((x, i) => 'ID' + (i + 1) + ' ' + x.cal + ' A type ' + x.type).join(', ')}.<br>Circuits : ${r.circuits.map(c => B.USES[c.u][0] + (['ecl', 'pc'].includes(c.u) ? ' (' + c.pts + ')' : '') + ' ' + AA.fmt(c.sec) + ' mm² / ' + c.cal + ' A sur ID' + (c.id + 1)).join(' ; ')}.</p>`; }).join('')}</details>` : ''}
            <p class="muted">Bonne pratique (non notée) : répartir les circuits d'éclairage et de prises d'une même zone sur des interrupteurs différentiels différents, pour qu'un déclenchement ne plonge pas tout le logement dans le noir. Le score est enregistré à la première vérification parfaite.</p></div>`;
          if (!finished && g.score === 100) { finished = true; done(100); }
        };
        render();
      }
    };
  };
  register();
})();
