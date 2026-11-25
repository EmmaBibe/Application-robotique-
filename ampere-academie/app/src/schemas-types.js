/* Ampère Académie — les types de schémas et le schéma de répartition.
 *  - SIMS.vues2 : un même départ moteur représenté en synoptique, unifilaire, multifilaire et développé.
 *  - SIMS.repartition : schéma unifilaire du tableau de répartition d'un logement (généré à partir d'une
 *    installation conforme), circuits cliquables avec leur représentation multifilaire, questions de lecture.
 * Conventions IEC 60617 : en unifilaire, le nombre de conducteurs est indiqué par des traits obliques (ou un trait et un nombre). */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const SIMS = AA.SIMS;

  /* ---------- Un départ moteur sous quatre formes ---------- */
  const st = 'stroke="var(--sch-ink)" stroke-width="2" fill="none"', tx = (x, y, t, a) => `<text x="${x}" y="${y}" ${a ? 'text-anchor="' + a + '"' : ''}>${t}</text>`;
  const contact = (x, y) => `<path d="M${x} ${y - 14} V${y - 6} M${x} ${y + 6} V${y + 14} M${x} ${y + 6} L${x - 9} ${y - 7}" ${st}/>`;
  const V = {
    syno: ['Synoptique', () => `<rect x="30" y="70" width="120" height="60" rx="8" ${st}/>${tx(90, 105, 'TGBT', 'middle')}<path d="M150 100 H230" ${st}/><path d="M222 94 l8 6 -8 6" ${st}/>
      <rect x="230" y="70" width="150" height="60" rx="8" ${st}/>${tx(305, 96, 'Départ moteur M1', 'middle')}${tx(305, 114, 'Q1 · KM1 · F2', 'middle')}<path d="M380 100 H460" ${st}/><path d="M452 94 l8 6 -8 6" ${st}/>
      <circle cx="500" cy="100" r="34" ${st}/>${tx(500, 98, 'M1', 'middle')}${tx(500, 114, 'pompe', 'middle')}`,
      "Vue d'ensemble : quels ensembles, reliés comment. Aucun détail de raccordement : on l'utilise pour comprendre une installation et en parler."],
    uni: ['Unifilaire', () => `${tx(250, 22, '3 × 400 V + PE', 'middle')}<path d="M250 30 V330" ${st}/><path d="M238 52 l24 -10 M238 60 l24 -10 M238 68 l24 -10" ${st}/>${tx(270, 62, '3 phases')}
      <path d="M244 96 L256 108 M256 96 L244 108" ${st}/>${tx(270, 106, 'Q1 disjoncteur magnétique 16 A')}
      <path d="M250 136 V146 M250 158 V170 M250 158 L241 145" stroke="var(--sch-ink)" stroke-width="2" fill="none"/><path d="M250 146 a4 4 0 0 1 0 8" ${st}/>${tx(270, 160, 'KM1 contacteur')}
      <rect x="236" y="196" width="28" height="28" ${st}/><path d="M243 216 l7 -10 l7 10" ${st}/>${tx(270, 214, 'F2 relais thermique réglé à 15,5 A')}
      ${tx(270, 268, 'câble 4G2,5 (3 phases + PE)')}<path d="M238 262 l24 -10 M238 270 l24 -10 M238 278 l24 -10 M238 286 l24 -10" ${st}/>
      <circle cx="250" cy="340" r="26" ${st}/>${tx(250, 338, 'M', 'middle')}${tx(250, 352, '3~', 'middle')}${tx(290, 344, 'M1 · 7,5 kW · 400 V · 15,5 A')}`,
      'Un seul trait représente tous les conducteurs d\'une canalisation ; des traits obliques en indiquent le nombre. Il montre les appareils et leurs caractéristiques (calibres, sections) : c\'est le schéma des tableaux et des études.'],
    multi: ['Multifilaire', () => { let o = ''; ['L1', 'L2', 'L3'].forEach((n, i) => { const x = 160 + i * 50; o += tx(x, 22, n, 'middle') + `<path d="M${x} 30 V250" ${st}/>`; });
      o += tx(320, 22, 'PE', 'middle') + `<path d="M320 30 V340 H242" stroke="#2e7d32" stroke-width="3" stroke-dasharray="10 4" fill="none"/>`;
      [160, 210, 260].forEach(x => { o += `<rect x="${x - 8}" y="70" width="16" height="44" fill="var(--sch-bg)"/><path d="M${x - 6} 86 L${x + 6} 98 M${x + 6} 86 L${x - 6} 98" ${st}/>` + `<rect x="${x - 10}" y="140" width="20" height="40" fill="var(--sch-bg)"/>` + contact(x, 160) + `<rect x="${x - 11}" y="200" width="22" height="34" fill="var(--sch-bg)" ${st}/><path d="M${x - 5} 226 l5 -12 l5 12" ${st}/>`; });
      o += `<path d="M160 250 L194 300 M210 250 V296 M260 250 L226 300" ${st}/><path d="M150 92 H270 M150 160 H270" stroke="var(--sch-ink)" stroke-dasharray="4 4" fill="none"/>${tx(345, 96, 'Q1')}${tx(345, 164, 'KM1')}${tx(345, 222, 'F2')}<circle cx="210" cy="326" r="30" ${st}/>${tx(210, 324, 'M', 'middle')}${tx(210, 338, '3~', 'middle')}${tx(176, 292, 'U', 'end')}${tx(218, 286, 'V')}${tx(246, 292, 'W')}`;
      return o; }, 'Chaque conducteur est dessiné : trois phases jusqu\'aux bornes U, V, W du moteur et le conducteur de protection jusqu\'à sa carcasse, chaque pôle d\'appareil (les pointillés relient les pôles d\'un même appareil). C\'est le schéma de câblage et de dépannage.'],
    dev: ['Développé', () => `${tx(30, 24, 'L')}<path d="M50 20 H450" ${st}/>${tx(30, 344, 'N')}<path d="M50 340 H450" ${st}/>
      <rect x="140" y="34" width="20" height="28" ${st}/>${tx(170, 54, 'F1')}<path d="M150 20 V34 M150 62 V80" ${st}/>${contact(150, 96)}<path d="M141 90 h18" stroke="var(--sch-ink)"/>${tx(170, 100, 'F2 95-96')}
      <path d="M150 110 V126" ${st}/>${contact(150, 140)}<path d="M141 134 h18" stroke="var(--sch-ink)"/>${tx(170, 144, 'S1 arrêt')}<path d="M150 154 V180 M150 180 H230 M150 180 V190" ${st}/>
      ${contact(150, 204)}${tx(118, 208, 'S2')}<path d="M230 180 V190" ${st}/>${contact(230, 204)}${tx(244, 208, 'KM1 13-14')}<path d="M150 218 V232 H230 V218 M150 232 V270" ${st}/>
      <rect x="132" y="270" width="36" height="22" ${st}/>${tx(178, 286, 'KM1 bobine')}<path d="M150 292 V340" ${st}/>`,
      'Les circuits sont dessinés entre deux lignes d\'alimentation, en colonnes, sans tenir compte de la position des appareils : on lit la logique de fonctionnement (ici la commande du contacteur, avec auto-maintien).']
  };
  SIMS.vues2 = (el, o) => {
    let k = (o && o.v) || 'syno';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-v">${Object.entries(V).map(([id, v]) => `<button data-v="${id}" class="${id === k ? 'on' : ''}">${v[0]}</button>`).join('')}</div></div><div class="simview" style="padding:10px"><svg class="lang-svg" viewBox="0 0 560 380" style="max-height:380px"></svg></div><p class="js-d" style="padding:0 16px 14px;font-size:14px"></p></div>`;
    const draw = () => { el.querySelector('svg').innerHTML = V[k][1](); el.querySelector('.js-d').textContent = 'Le même départ moteur (pompe de 7,5 kW). ' + V[k][2]; };
    el.querySelectorAll('.js-v button').forEach(b => b.onclick = () => { k = b.dataset.v; el.querySelectorAll('.js-v button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    draw();
  };

  /* ---------- Schéma de répartition d'un tableau de logement ---------- */
  const COLS = { '1.5': '3G1,5', '2.5': '3G2,5', '6': '3G6' };
  SIMS.repartition = (el, o) => {
    const B = AA.BATIMENT, rng = AA.rng(Date.now() ^ 4711);
    let typ = (o && o.typ) || 't3', u, d, sel = null, q = null;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-t">${['studio', 't2', 't3', 't4'].map(k => `<button data-k="${k}" class="${k === typ ? 'on' : ''}">${k === 'studio' ? 'Studio' : k.toUpperCase()}</button>`).join('')}</div><span class="muted js-s"></span></div>
      <div class="simview" style="overflow-x:auto;padding:10px"><svg class="rep-svg"></svg></div><div class="rep-detail js-det"></div>
      <div style="padding:0 16px 14px"><p class="eyebrow">Lire le schéma</p><p class="js-q"></p><div class="row"><select class="sel js-a"></select><button class="btn primary sm js-ok">${ic.check}Vérifier</button><button class="btn sm ghost js-nq">Autre question</button></div><div class="js-fb"></div></div></div>`;
    const lbl = c => B.USES[c.u][0] + (['ecl', 'pc'].includes(c.u) ? ' (' + c.pts + ')' : '');
    const draw = () => {
      const ids = d.ids.map((x, i) => ({ x, i, cs: d.circuits.map((c, k) => ({ c, k })).filter(z => z.c.id === i) }));
      let x = 150; const pos = ids.map(g => { const w = Math.max(1, g.cs.length) * 76 + 30, p = { x0: x, w }; x += w + 16; return p; }), W = x + 10;
      let s = `<text x="20" y="34" class="rep-t">Réseau</text><path d="M60 30 H100" class="rep-l"/><rect x="100" y="14" width="34" height="34" class="rep-b"/><text x="117" y="36" text-anchor="middle" class="rep-s">AGCP</text><text x="100" y="66" class="rep-s">500 mA S</text><path d="M134 30 H${W - 10}" class="rep-bus"/>`;
      ids.forEach((g, gi) => {
        const p = pos[gi], cx = p.x0 + 20;
        s += `<path d="M${cx} 30 V70" class="rep-l"/><rect x="${cx - 18}" y="70" width="36" height="44" rx="4" class="rep-b ${g.x.type === 'A' ? 'ta' : ''}"/><text x="${cx}" y="90" text-anchor="middle" class="rep-s">ID${g.i + 1}</text><text x="${cx}" y="104" text-anchor="middle" class="rep-s">${g.x.cal} A</text>
          <text x="${cx + 24}" y="86" class="rep-s">30 mA</text><text x="${cx + 24}" y="100" class="rep-s">type ${g.x.type}</text><path d="M${cx} 114 V140 H${p.x0 + p.w - 20}" class="rep-bus2"/>`;
        g.cs.forEach((z, j) => {
          const xx = p.x0 + 40 + j * 76, on = sel === z.k;
          s += `<g class="rep-c ${on ? 'on' : ''}" data-k="${z.k}"><path d="M${xx} 140 V164" class="rep-l"/><rect x="${xx - 13}" y="164" width="26" height="34" rx="3" class="rep-b"/><path d="M${xx - 6} 176 L${xx + 6} 188 M${xx + 6} 176 L${xx - 6} 188" class="rep-l"/><path d="M${xx} 198 V236" class="rep-l"/><path d="M${xx - 7} 222 l14 -6 M${xx - 7} 228 l14 -6 M${xx - 7} 234 l14 -6" class="rep-l"/>
            <text x="${xx}" y="256" text-anchor="middle" class="rep-s">${z.c.cal} A</text><text x="${xx}" y="270" text-anchor="middle" class="rep-s">${COLS[String(z.c.sec)] || AA.fmt(z.c.sec) + ' mm²'}</text><text x="${xx}" y="286" text-anchor="middle" class="rep-u">${esc(lbl(z.c))}</text></g>`;
        });
      });
      const svg = el.querySelector('.rep-svg'); svg.setAttribute('viewBox', `0 0 ${W} 300`); svg.style.width = Math.max(560, W) + 'px'; svg.innerHTML = s;
      svg.querySelectorAll('.rep-c').forEach(gp => gp.onclick = () => { sel = +gp.dataset.k; draw(); detail(); });
    };
    const detail = () => {
      const c = d.circuits[sel], det = el.querySelector('.js-det'); if (!c) { det.innerHTML = ''; return; }
      det.innerHTML = `<div class="grid g2" style="padding:0 16px 10px"><svg viewBox="0 0 260 150" class="lang-svg" style="max-height:170px"><text x="10" y="16">Ph</text><text x="10" y="56">N</text><text x="10" y="96">PE</text>
        <path d="M40 12 H220" stroke="#8d4a1e" stroke-width="3"/><path d="M40 52 H220" stroke="#1565c0" stroke-width="3"/><path d="M40 92 H220" stroke="#2e7d32" stroke-width="3" stroke-dasharray="10 4"/>
        <rect x="70" y="2" width="26" height="62" rx="3" fill="var(--sch-bg)" stroke="var(--sch-ink)"/><text x="83" y="78" text-anchor="middle">ID${c.id + 1}</text><rect x="130" y="2" width="26" height="62" rx="3" fill="var(--sch-bg)" stroke="var(--sch-ink)"/><text x="143" y="78" text-anchor="middle">${c.cal} A</text>
        <text x="250" y="130" text-anchor="end">vers le circuit →</text></svg>
        <div><p><b>${esc(lbl(c))}</b> — disjoncteur phase + neutre ${c.cal} A, câble ${COLS[String(c.sec)] || AA.fmt(c.sec) + ' mm²'} (une phase, le neutre et le conducteur de protection), protégé par l'interrupteur différentiel ID${c.id + 1} (${d.ids[c.id].cal} A, 30 mA, type ${d.ids[c.id].type}).</p>
        <p class="muted">En multifilaire, les trois conducteurs apparaissent : phase (marron, noir ou rouge), neutre (bleu), conducteur de protection (vert-jaune), qui ne passe par aucun appareil de coupure.</p></div></div>`;
    };
    const QS = [
      () => { const e = d.circuits.find(c => c.u === 'll') || d.circuits.find(c => c.u === 'plaque'); return { t: `Sur quel interrupteur différentiel est raccordé le circuit « ${B.USES[e.u][0]} » ?`, opts: d.ids.map((x, i) => [i, 'ID' + (i + 1)]), a: e.id, why: `Il est sur ID${e.id + 1}, de type ${d.ids[e.id].type} : la NF C 15-100 impose le type A pour la plaque de cuisson et le lave-linge.` }; },
      () => { const e = d.circuits.find(c => c.u === 'plaque'); return { t: 'Quel est le calibre du disjoncteur de la plaque de cuisson ?', opts: [[10, '10 A'], [16, '16 A'], [20, '20 A'], [32, '32 A']], a: e.cal, why: 'Plaque de cuisson en monophasé : disjoncteur 32 A et câble de 6 mm².' }; },
      () => { const e = d.circuits.find(c => c.u === 'pc'); return { t: 'Quelle est la section des conducteurs du premier circuit de prises ?', opts: [[1.5, '1,5 mm²'], [2.5, '2,5 mm²'], [6, '6 mm²']], a: e.sec, why: `Ici ${AA.fmt(e.sec)} mm² avec un disjoncteur de ${e.cal} A (au plus ${B.pcMax(e.sec, e.cal)} socles).` }; },
      () => { const n = d.circuits.filter(c => c.id === 0).length; return { t: 'Combien de circuits sont raccordés à ID1 ?', opts: [1, 2, 3, 4, 5, 6, 7, 8].map(v => [v, String(v)]), a: n, why: `ID1 alimente ${n} circuit(s) : compte les disjoncteurs dessinés sous lui.` }; }
    ];
    const newQ = () => { q = rng.pick(QS)(); el.querySelector('.js-q').textContent = q.t; el.querySelector('.js-a').innerHTML = q.opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join(''); el.querySelector('.js-fb').innerHTML = ''; };
    const load = () => { u = B.TYPES[typ](rng); d = B.reference(u); sel = null; el.querySelector('.js-s').textContent = `${u.n} de ${B.surface(u)} m² — clique un circuit pour le détailler`; draw(); detail(); newQ(); };
    el.querySelectorAll('.js-t button').forEach(b => b.onclick = () => { typ = b.dataset.k; el.querySelectorAll('.js-t button').forEach(x => x.classList.toggle('on', x === b)); load(); });
    el.querySelector('.js-nq').onclick = newQ;
    el.querySelector('.js-ok').onclick = () => { const v = el.querySelector('.js-a').value, ok = String(v) === String(q.a); el.querySelector('.js-fb').innerHTML = `<p class="${ok ? 'ok-t' : 'bad-t'}">${ok ? '✔ ' : '✘ '}${esc(q.why)}</p>`; };
    load();
  };

  /* Leçon complémentaire et associations */
  AA.L.n1m2l7 = { min: 10, why: "Le schéma de répartition est le document que l'on consulte en premier devant un tableau : il dit quel appareil protège quoi.", screens: [[
    { h: 'Le schéma de répartition d\'un tableau' },
    { p: "C'est un schéma unifilaire du tableau : en tête, l'appareil général (dans un logement, le disjoncteur de branchement AGCP) ; puis les interrupteurs différentiels, et sous chacun d'eux les disjoncteurs des circuits, avec pour chaque circuit son usage, son calibre et la section du câble. On y vérifie la répartition des circuits et leur protection, on s'en sert pour dépanner et pour faire évoluer l'installation." },
    { list: ['Un trait représente toute une canalisation (phase, neutre et conducteur de protection).', 'Chaque disjoncteur porte son calibre ; chaque circuit, sa section et son usage.', 'Le schéma doit correspondre exactement au tableau réel et à ses étiquettes : il est mis à jour à chaque modification.'] }
  ]] };
  const lv = AA.CURRICULUM && AA.CURRICULUM.find(l => l.id === 'n1');
  const md = lv && lv.modules.find(m => m.id === 'n1m2');
  if (md && !md.lessons.find(l => l.id === 'n1m2l7')) md.lessons.push({ id: 'n1m2l7', t: 'Le schéma de répartition d\'un tableau' });
  Object.assign(AA.VISMAP, { n1m2l1: [{ sim: 'vues2', opts: { v: 'syno' } }], n1m2l2: [{ sim: 'vues2', opts: { v: 'uni' } }, { sim: 'repartition' }], n1m2l3: [{ sim: 'vues2', opts: { v: 'multi' } }], n1m2l4: [{ sim: 'vues2', opts: { v: 'dev' } }], n1m2l7: [{ sim: 'repartition', opts: { typ: 't3' } }] });
})();
