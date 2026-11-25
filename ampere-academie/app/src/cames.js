/* Ampère Académie — commutateurs à cames.
 * Modèle (AA.CAMES) : une fonction attendue = des bornes, des positions et, pour chaque position, les groupes de bornes
 * à relier. Un commutateur = des éléments de contact (deux bornes chacun) et un diagramme de fermeture (contact fermé
 * ou non dans chaque position). On vérifie chaque position (partition exacte des bornes, aucun court-circuit) et les
 * passages d'une position à l'autre selon la forme des cames (largeur des creux).
 * Convention retenue (la plus répandue sur les commutateurs industriels) : le contact est fermé quand le poussoir est
 * dans un creux de la came, ouvert de force par le bossage. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const SIMS = AA.SIMS;
  const C = AA.CAMES = {};

  /* ---------- Fonctions attendues ---------- */
  const VOLT = [['L1-N', 'L1', 'N'], ['L2-N', 'L2', 'N'], ['L3-N', 'L3', 'N'], ['L1-L2', 'L1', 'L2'], ['L2-L3', 'L2', 'L3'], ['L3-L1', 'L3', 'L1']];
  C.FUNCS = {
    deux: {
      name: 'Deux circuits', build: () => ({
        key: 'deux', t: "Commutateur de deux circuits d'éclairage", terms: ['Ph', 'A', 'B'], srcs: ['Ph'], pos: ['0', '1', '2', '1+2'], step: 60,
        cdc: "Un seul commutateur commande deux circuits d'éclairage A et B, alimentés par la phase Ph (le neutre va directement aux lampes). Position 0 : tout éteint ; 1 : A seul ; 2 : B seul ; 1+2 : les deux.",
        exp: [[], [['Ph', 'A']], [['Ph', 'B']], [['Ph', 'A', 'B']]],
        read: G => ['A', 'B'].map(l => 'Circuit ' + l + ' ' + (G.same(l, 'Ph') ? 'allumé' : 'éteint')).join(' · ')
      })
    },
    volt: {
      name: 'Voltmètre', build: r => {
        let L = VOLT;
        if (r) { const k = r.int(3, 6); L = VOLT.filter((v, i) => r.shuffle([0, 1, 2, 3, 4, 5]).slice(0, k).includes(i)); }
        const terms = ['L1', 'L2', 'L3'].concat(L.some(v => v[2] === 'N') ? ['N'] : []).concat(['A', 'B']);
        return {
          key: 'volt', t: 'Commutateur de voltmètre', terms, srcs: terms.filter(t => t !== 'A' && t !== 'B'), pos: ['0'].concat(L.map(v => v[0])), step: 45,
          cdc: `Un voltmètre unique, raccordé aux bornes A et B du commutateur, doit lire successivement : ${L.map(v => v[0]).join(', ')}. En position 0, le voltmètre est isolé du réseau.`,
          exp: [[]].concat(L.map(v => [['A', v[1]], ['B', v[2]]])),
          read: G => {
            const sa = G.srcOf('A'), sb = G.srcOf('B');
            if (sa.length !== 1 || sb.length !== 1 || sa[0] === sb[0]) return 'Voltmètre : 0 V (non raccordé entre deux conducteurs différents)';
            return `Voltmètre : ${sa[0] === 'N' || sb[0] === 'N' ? '230' : '400'} V (entre ${sa[0]} et ${sb[0]})`;
          }
        };
      }
    },
    inv: {
      name: 'Inverseur de sens', build: r => {
        const pairs = [['L1', 'L2'], ['L2', 'L3'], ['L1', 'L3']], sw = r ? r.pick(pairs) : pairs[0];
        const m = { L1: 'U', L2: 'V', L3: 'W' }, s2 = Object.assign({}, m); s2[sw[0]] = m[sw[1]]; s2[sw[1]] = m[sw[0]];
        return {
          key: 'inv', t: 'Inverseur de sens de marche 1-0-2', terms: ['L1', 'L2', 'L3', 'U', 'V', 'W'], srcs: ['L1', 'L2', 'L3'], pos: ['1', '0', '2'], step: 60,
          cdc: `Un moteur triphasé (bornes U, V, W) est commandé par un commutateur 1-0-2. Position 1 : L1 sur U, L2 sur V, L3 sur W. Position 0 : arrêt, moteur isolé. Position 2 : sens inverse, obtenu en croisant ${sw[0]} et ${sw[1]}.`,
          exp: [['L1', 'L2', 'L3'].map(l => [l, m[l]]), [], ['L1', 'L2', 'L3'].map(l => [l, s2[l]])],
          read: G => motorRead(G)
        };
      }
    },
    yd: {
      name: 'Étoile-triangle', build: () => ({
        key: 'yd', t: 'Commutateur étoile-triangle 0-Y-Δ', terms: ['L1', 'L2', 'L3', 'U1', 'V1', 'W1', 'U2', 'V2', 'W2'], srcs: ['L1', 'L2', 'L3'], pos: ['0', 'Y', 'Δ'], step: 60,
        cdc: "Démarrage manuel d'un moteur 400 V Δ. Les six bornes de la plaque (U1, V1, W1, U2, V2, W2), barrettes retirées, vont au commutateur. Position 0 : arrêt. Position Y : L1-U1, L2-V1, L3-W1 et U2, V2, W2 reliées entre elles (point étoile). Position Δ : L1-U1-W2, L2-V1-U2, L3-W1-V2.",
        exp: [[], [['L1', 'U1'], ['L2', 'V1'], ['L3', 'W1'], ['U2', 'V2', 'W2']], [['L1', 'U1', 'W2'], ['L2', 'V1', 'U2'], ['L3', 'W1', 'V2']]],
        read: G => {
          if (G.shorts.length) return 'Court-circuit';
          const line = [['U1', 'L1'], ['V1', 'L2'], ['W1', 'L3']].every(([a, b]) => G.same(a, b));
          if (!['U1', 'V1', 'W1', 'U2', 'V2', 'W2'].some(t => G.srcOf(t).length)) return 'Moteur arrêté, isolé du réseau';
          if (line && G.same('U2', 'V2') && G.same('V2', 'W2') && !G.srcOf('U2').length) return 'Moteur couplé en étoile : 230 V par enroulement, courant de démarrage divisé par 3';
          if (line && G.same('W2', 'L1') && G.same('U2', 'L2') && G.same('V2', 'L3')) return 'Moteur couplé en triangle : 400 V par enroulement, marche normale';
          return 'Couplage incorrect : enroulements mal alimentés';
        }
      })
    }
  };
  const motorRead = G => {
    if (G.shorts.length) return 'Court-circuit';
    const p = ['U', 'V', 'W'].map(t => G.srcOf(t));
    if (p.every(s => !s.length)) return 'Moteur arrêté, isolé du réseau';
    if (p.every(s => s.length === 1) && new Set(p.map(s => s[0])).size === 3) {
      const o = p.map(s => +s[0][1]), inv = (o[0] > o[1]) + (o[0] > o[2]) + (o[1] > o[2]);
      return 'Moteur en marche, sens ' + (inv % 2 ? '2 (inverse)' : '1') + ' — ordre des phases sur U, V, W : ' + p.map(s => s[0]).join(', ');
    }
    return 'Moteur mal alimenté (une ou deux phases seulement) : danger de marche en monophasé';
  };

  /* ---------- Connexions ---------- */
  // contacts : [[a, b], …] ; closed : tableau de booléens (un par contact)
  C.groups = (spec, contacts, closed) => {
    const par = {}; spec.terms.forEach(t => par[t] = t);
    const f = t => par[t] === t ? t : (par[t] = f(par[t]));
    contacts.forEach((c, i) => { if (closed[i] && c[0] && c[1] && par[c[0]] != null && par[c[1]] != null) par[f(c[0])] = f(c[1]); });
    const of = {}; spec.terms.forEach(t => (of[f(t)] = of[f(t)] || []).push(t));
    const list = Object.values(of), gi = {}; list.forEach((g, i) => g.forEach(t => gi[t] = i));
    const G = { list, same: (a, b) => gi[a] === gi[b], srcOf: t => list[gi[t]].filter(x => spec.srcs.includes(x)) };
    G.shorts = list.map(g => g.filter(x => spec.srcs.includes(x))).filter(s => s.length > 1);
    return G;
  };
  C.checkPos = (spec, contacts, closed, p) => {
    const G = C.groups(spec, contacts, closed), exp = spec.exp[p], eg = {}, msgs = [];
    spec.terms.forEach(t => eg[t] = -1 - spec.terms.indexOf(t)); exp.forEach((g, i) => g.forEach(t => eg[t] = i));
    G.shorts.forEach(s => msgs.push('court-circuit entre ' + s.join(', ').replace(/, ([^,]*)$/, ' et $1')));
    exp.forEach(g => g.slice(1).forEach(t => { if (!G.same(g[0], t)) msgs.push(`il manque la liaison ${g[0]}–${t}`); }));
    G.list.forEach(g => { for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (eg[g[i]] !== eg[g[j]] && !(spec.srcs.includes(g[i]) && spec.srcs.includes(g[j]))) msgs.push(`${g[i]} ne doit pas être relié à ${g[j]}`); });
    return { ok: !msgs.length, msgs: [...new Set(msgs)], G };
  };
  C.check = (spec, contacts, grid) => spec.pos.map((x, p) => C.checkPos(spec, contacts, grid.map(row => !!row[p]), p));

  /* ---------- Solution de référence : une liaison = un contact, en étoile depuis le premier terme de chaque groupe ---------- */
  C.reference = spec => {
    const contacts = [], grid = [];
    spec.exp.forEach((gs, p) => gs.forEach(g => g.slice(1).forEach(t => {
      let k = contacts.findIndex(c => (c[0] === g[0] && c[1] === t) || (c[0] === t && c[1] === g[0]));
      if (k < 0) { k = contacts.length; contacts.push([g[0], t]); grid.push(spec.pos.map(() => false)); }
      grid[k][p] = true;
    })));
    return { contacts, grid };
  };

  /* ---------- Cames : angle de l'arbre -> contact fermé ? ---------- */
  const md = x => ((x % 360) + 360) % 360, adiff = (a, b) => { const d = md(a - b); return d > 180 ? 360 - d : d; };
  // row : fermetures par position ; width : largeur d'un creux en fraction du pas (0,2 à 1,4)
  C.closedAt = (row, step, width, phi) => {
    const w = width * step / 2;
    for (let p = 0; p < row.length; p++) {
      if (!row[p]) continue;
      if (adiff(phi, p * step) < w) return true;
      if (p + 1 < row.length && row[p + 1] && md(phi - p * step) <= step) return true;
    }
    return false;
  };
  // passages : pour chaque passage p -> p+1, courts-circuits rencontrés en tournant l'arbre degré par degré
  C.transitions = (spec, contacts, grid, width) => {
    const out = [];
    for (let p = 0; p + 1 < spec.pos.length; p++) {
      let bad = null;
      for (let a = p * spec.step; a <= (p + 1) * spec.step; a += 1) {
        const G = C.groups(spec, contacts, grid.map(row => C.closedAt(row, spec.step, width, a)));
        if (G.shorts.length) { bad = G.shorts[0]; break; }
      }
      out.push({ from: spec.pos[p], to: spec.pos[p + 1], short: bad });
    }
    return out;
  };
  C.spec = (key, r) => C.FUNCS[key].build(r);

  /* ---------- Dessins ---------- */
  const camSvg = (row, step, width, phi, on, n) => {
    const cx = 36, cy = 46, R = 25, r0 = 17; let d = '';
    for (let b = 0; b <= 360; b += 3) { const rad = C.closedAt(row, step, width, phi - b) ? r0 : R, a = (b - 90) * Math.PI / 180; d += (b ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1); }
    const fy = on ? cy - r0 : cy - R;
    return `<svg viewBox="0 0 72 96" class="cam-svg ${on ? 'on' : ''}"><path d="${d}Z" class="cam-disc"/><circle cx="${cx}" cy="${cy}" r="3" class="cam-axe"/>
      <path d="M${cx} ${fy} V${fy - 9}" class="cam-pl"/><path d="M${cx - 14} ${fy - 9} H${cx + 14}" class="cam-bar"/><path d="M${cx - 18} 6 V12 M${cx + 18} 6 V12" class="cam-fix"/>
      <text x="${cx}" y="92" text-anchor="middle">${n}</text></svg>`;
  };
  const knobSvg = (spec, phi) => {
    const n = spec.pos.length, off = (n - 1) * spec.step / 2, cx = 90, cy = 88;
    const lab = spec.pos.map((t, p) => { const a = (p * spec.step - off - 90) * Math.PI / 180; return `<text x="${(cx + 68 * Math.cos(a)).toFixed(1)}" y="${(cy + 68 * Math.sin(a) + 4).toFixed(1)}" text-anchor="middle" class="cam-pos" data-p="${p}">${esc(t)}</text>`; }).join('');
    return `<svg viewBox="0 0 180 170" class="cam-knob">${lab}<circle cx="${cx}" cy="${cy}" r="48" class="cam-k1"/><g transform="rotate(${(phi - off).toFixed(1)} ${cx} ${cy})"><rect x="${cx - 9}" y="${cy - 46}" width="18" height="92" rx="9" class="cam-k2"/><path d="M${cx} ${cy - 40} V${cy - 24}" class="cam-k3"/></g></svg>`;
  };
  const wireSvg = (spec, contacts, closed) => {
    const T = spec.terms, X = t => 34 + T.indexOf(t) * 54, W = 34 + T.length * 54, H = 52 + contacts.length * 20;
    let s = T.map(t => `<text x="${X(t)}" y="16" text-anchor="middle" class="${spec.srcs.includes(t) ? 'src' : ''}">${t}</text><circle cx="${X(t)}" cy="26" r="4" class="cam-t"/>`).join('');
    contacts.forEach((c, i) => {
      if (!c[0] || !c[1] || c[0] === c[1]) return;
      const y = 44 + i * 20, a = Math.min(X(c[0]), X(c[1])), b = Math.max(X(c[0]), X(c[1])), m = (a + b) / 2, on = closed[i];
      s += `<path d="M${X(c[0])} 30 V${y} M${X(c[1])} 30 V${y}" class="cam-drop ${on ? 'on' : ''}"/><path d="M${a} ${y} H${m - 9} M${m + 9} ${y} H${b}" class="cam-w ${on ? 'on' : ''}"/>
        <path d="${on ? `M${m - 9} ${y} H${m + 9}` : `M${m - 9} ${y} L${m + 7} ${y - 8}`}" class="cam-w ${on ? 'on' : ''}"/><text x="${b + 6}" y="${y + 4}" class="cam-n">${2 * i + 1}-${2 * i + 2}</text>`;
    });
    return `<svg viewBox="0 0 ${W + 30} ${H}" class="cam-wire" style="max-width:${(W + 30) * 1.25}px">${s}</svg>`;
  };

  /* ---------- Simulation ---------- */
  // opts : f (fonction), mode : 'demo' (diagramme rempli), 'grid' (contacts donnés, diagramme à remplir), 'free' (tout à concevoir),
  //        width (largeur des creux), spec (fonction imposée, défi), onDone(score)
  SIMS.cames = (el, o) => {
    o = o || {};
    let key = o.f || 'deux', mode = o.mode || 'demo', spec, contacts, grid, pos = 0, phi = 0, width = o.width || 0.5, anim = null, warn = '';
    const challenge = !!o.spec, maxC = () => C.reference(spec).contacts.length + 3;
    el.innerHTML = `<div class="simcard"><div class="simctl">${challenge ? '' : `<div class="seg js-f">${Object.keys(C.FUNCS).map(k => `<button data-k="${k}">${C.FUNCS[k].name}</button>`).join('')}</div>`}<span class="muted js-m"></span></div>
      <div style="padding:12px 16px 0"><p class="eyebrow">Fonction attendue</p><p class="js-cdc"></p></div>
      <div class="grid g2" style="padding:6px 16px;align-items:start"><div><div class="js-knob"></div><div class="seg js-pos" style="margin:4px 0 8px"></div><p class="js-read cam-read"></p><p class="js-warn bad-t"></p></div>
        <div><p class="eyebrow">Les cames, vues de face (creux = contact fermé)</p><div class="cam-row js-cams"></div><label class="cam-wl">Largeur des creux : <b class="js-wv"></b> du pas<input type="range" class="js-w" min="20" max="140" step="5"></label></div></div>
      <div style="padding:0 16px;overflow-x:auto"><p class="eyebrow">Câblage des contacts (position courante)</p><div class="js-wire"></div></div>
      <div style="padding:6px 16px 0;overflow-x:auto"><p class="eyebrow">Diagramme de fermeture (clique les cases : ✕ = fermé)</p><table class="cam-tab js-tab"></table>
        <div class="row js-tools" style="margin-top:8px"></div></div>
      <div class="js-fb" style="padding:8px 16px 14px"></div>
      <div class="simf"><span class="eyebrow">Les repères</span><ul><li>angle de la position p = p × pas (<span class="js-step"></span>°)</li><li>contact fermé dans deux positions voisines ⇒ creux continu, il reste fermé pendant le passage</li><li>largeur des creux &gt; 100 % du pas ⇒ fermeture avant coupure (chevauchement) ; &lt; 100 % ⇒ coupure avant fermeture</li></ul></div></div>`;
    const $ = s => el.querySelector(s);
    const closedNow = () => grid.map(row => C.closedAt(row, spec.step, width, phi));
    const render = () => {
      const cl = closedNow();
      $('.js-knob').innerHTML = knobSvg(spec, phi);
      $('.js-cams').innerHTML = grid.map((row, i) => camSvg(row, spec.step, width, phi, cl[i], (2 * i + 1) + '-' + (2 * i + 2))).join('');
      $('.js-wire').innerHTML = wireSvg(spec, contacts, cl);
      const atPos = Math.abs(phi - pos * spec.step) < 0.01;
      const G = C.groups(spec, contacts, cl);
      $('.js-read').innerHTML = atPos ? `<b>Position ${esc(spec.pos[pos])}</b> — ${esc(G.shorts.length ? 'Court-circuit entre ' + G.shorts[0].join(', ').replace(/, ([^,]*)$/, ' et $1') + ' !' : spec.read(G))}` : 'Manœuvre en cours…';
      $('.js-warn').textContent = warn;
      $('.js-wv').textContent = Math.round(width * 100) + ' %'; $('.js-step').textContent = spec.step;
      el.querySelectorAll('.js-pos button').forEach((b, p) => b.classList.toggle('on', p === pos));
    };
    const table = () => {
      const T = spec.terms, editT = mode === 'free';
      $('.js-tab').innerHTML = `<tr><th>Contact</th>${editT ? '<th>Bornes reliées</th>' : '<th>Relie</th>'}${spec.pos.map(p => `<th>${esc(p)}</th>`).join('')}${editT ? '<th></th>' : ''}</tr>` +
        contacts.map((c, i) => `<tr><td class="cam-n">${2 * i + 1}-${2 * i + 2}</td><td>${editT ? [0, 1].map(j => `<select class="sel sm" data-i="${i}" data-j="${j}"><option value="">—</option>${T.map(t => `<option ${c[j] === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`).join(' – ') : c.join(' – ')}</td>
          ${spec.pos.map((p, k) => `<td><button class="cam-x ${grid[i][k] ? 'on' : ''}" data-i="${i}" data-k="${k}" aria-label="Contact ${2 * i + 1}-${2 * i + 2}, position ${esc(p)}">${grid[i][k] ? '✕' : ''}</button></td>`).join('')}${editT ? `<td><button class="btn sm ghost js-del" data-i="${i}" aria-label="Retirer">✕</button></td>` : ''}</tr>`).join('');
      el.querySelectorAll('.cam-x').forEach(b => b.onclick = () => { grid[+b.dataset.i][+b.dataset.k] = !grid[+b.dataset.i][+b.dataset.k]; warn = ''; table(); render(); });
      el.querySelectorAll('.js-tab select').forEach(s => s.onchange = () => { contacts[+s.dataset.i][+s.dataset.j] = s.value; render(); });
      el.querySelectorAll('.js-del').forEach(b => b.onclick = () => { contacts.splice(+b.dataset.i, 1); grid.splice(+b.dataset.i, 1); table(); render(); });
      const tools = [];
      if (editT) tools.push(`<button class="btn sm js-add" ${contacts.length >= maxC() ? 'disabled' : ''}>${ic.plus || '+'} Élément de contact</button>`);
      if (mode !== 'demo') tools.push(`<button class="btn primary sm js-chk">${ic.check}${challenge ? 'Valider le commutateur' : 'Vérifier toutes les positions'}</button>`);
      if (!challenge && mode !== 'demo') tools.push(`<button class="btn sm ghost js-sol">Solution de référence</button>`);
      $('.js-tools').innerHTML = tools.join('');
      const a = $('.js-add'); if (a) a.onclick = () => { contacts.push(['', '']); grid.push(spec.pos.map(() => false)); table(); render(); };
      const c = $('.js-chk'); if (c) c.onclick = verify;
      const s = $('.js-sol'); if (s) s.onclick = () => { const R = C.reference(spec); contacts = R.contacts.map(x => x.slice()); grid = R.grid.map(x => x.slice()); table(); render(); $('.js-fb').innerHTML = `<p class="muted">Solution de référence : ${R.contacts.length} éléments de contact, chacun établit une liaison ; un contact fermé dans plusieurs positions évite d'en ajouter un autre.</p>`; };
    };
    const verify = () => {
      const res = C.check(spec, contacts, grid), tr = C.transitions(spec, contacts, grid, width), good = res.filter(x => x.ok).length, trBad = tr.filter(t => t.short);
      const ref = C.reference(spec).contacts.length, used = contacts.filter((c, i) => grid[i].some(Boolean)).length;
      let score = Math.round(100 * good / res.length); if (trBad.length) score = Math.max(0, score - 25);
      $('.js-fb').innerHTML = `${challenge ? `<div class="result"><div class="score-big">${score}</div>` : ''}<ul class="cam-res">${res.map((x, p) => `<li class="${x.ok ? 'ok-t' : 'bad-t'}">${x.ok ? '✔' : '✘'} Position ${esc(spec.pos[p])} : ${x.ok ? esc(spec.read(x.G)) : esc(x.msgs.slice(0, 3).join(' ; '))}</li>`).join('')}
        ${tr.map(t => `<li class="${t.short ? 'bad-t' : 'ok-t'}">${t.short ? '✘' : '✔'} Passage ${esc(t.from)} → ${esc(t.to)} : ${t.short ? 'court-circuit transitoire entre ' + t.short.join(', ').replace(/, ([^,]*)$/, ' et $1') + ' (creux trop larges : réduis-les pour couper avant de fermer)' : 'aucun court-circuit pendant la manœuvre'}</li>`).join('')}</ul>
        <p class="muted">${used} élément(s) de contact utilisé(s) ; la solution de référence en utilise ${ref}. ${used > ref ? 'Une même liaison présente dans plusieurs positions peut être assurée par un seul contact.' : ''}</p>${challenge ? '</div>' : ''}`;
      if (challenge && o.onDone) { o.onDone(score); $('.js-tools').innerHTML = ''; const R = C.reference(spec); $('.js-fb').insertAdjacentHTML('beforeend', `<details style="margin-top:8px"><summary>Voir la solution de référence</summary><table class="cam-tab"><tr><th>Contact</th><th>Relie</th>${spec.pos.map(p => `<th>${esc(p)}</th>`).join('')}</tr>${R.contacts.map((c, i) => `<tr><td>${2 * i + 1}-${2 * i + 2}</td><td>${c.join(' – ')}</td>${R.grid[i].map(v => `<td>${v ? '✕' : ''}</td>`).join('')}</tr>`).join('')}</table></details>`); }
    };
    const goTo = p => {
      if (anim) cancelAnimationFrame(anim);
      const a0 = phi, a1 = p * spec.step, t0 = performance.now(), dur = 260 * Math.max(1, Math.abs(a1 - a0) / spec.step);
      warn = ''; pos = p;
      const stepF = now => {
        const k = Math.min(1, (now - t0) / dur); phi = a0 + (a1 - a0) * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
        const G = C.groups(spec, contacts, closedNow());
        if (G.shorts.length && k < 1 && !warn) warn = 'Court-circuit pendant la manœuvre entre ' + G.shorts[0].join(', ').replace(/, ([^,]*)$/, ' et $1') + ' !';
        render(); if (k < 1) anim = requestAnimationFrame(stepF); else anim = null;
      };
      anim = requestAnimationFrame(stepF);
    };
    const load = () => {
      spec = o.spec || C.spec(key);
      const R = C.reference(spec);
      contacts = mode === 'free' ? [['', ''], ['', '']] : R.contacts.map(x => x.slice());
      grid = mode === 'demo' ? R.grid.map(x => x.slice()) : contacts.map(() => spec.pos.map(() => false));
      pos = Math.max(0, spec.pos.indexOf('0')); phi = pos * spec.step; warn = '';
      $('.js-cdc').textContent = spec.cdc;
      $('.js-m').textContent = mode === 'demo' ? 'Tourne la manette et observe les cames' : mode === 'grid' ? 'Remplis le diagramme de fermeture' : 'Choisis les bornes de chaque contact, puis le diagramme';
      $('.js-pos').innerHTML = spec.pos.map((p, i) => `<button data-p="${i}">${esc(p)}</button>`).join('');
      el.querySelectorAll('.js-pos button').forEach(b => b.onclick = () => goTo(+b.dataset.p));
      el.querySelectorAll('.js-f button').forEach(b => b.classList.toggle('on', b.dataset.k === key));
      $('.js-fb').innerHTML = ''; $('.js-w').value = Math.round(width * 100);
      table(); render();
    };
    el.querySelectorAll('.js-f button').forEach(b => b.onclick = () => { key = b.dataset.k; load(); });
    $('.js-w').oninput = e => { width = +e.target.value / 100; render(); };
    load();
  };

  /* ---------- Leçons ---------- */
  Object.assign(AA.L, {
    n3m6l1: { min: 10, why: "Inverseur de sens, étoile-triangle manuel, commutateur de voltmètre, sélecteur Manu-0-Auto : le commutateur à cames est partout en armoire et sur les pupitres.", screens: [[
      { h: 'Un arbre, des cames, des contacts' },
      { p: "La manette entraîne un arbre sur lequel sont empilés des <b>étages</b>. Chaque étage porte une <b>came</b> (un disque profilé) et un ou deux <b>éléments de contact</b>, numérotés 1-2, 3-4, 5-6… Un mécanisme à crans fixe les positions, avec un pas angulaire de 30°, 45°, 60° ou 90° selon le modèle." },
      { p: "Le profil de la came commande le contact. Sur la plupart des commutateurs industriels, le contact est <b>fermé quand le poussoir est dans un creux</b> de la came (un ressort le ferme) et <b>ouvert de force par le bossage</b> : c'est la manœuvre positive d'ouverture. Certains modèles fonctionnent à l'inverse ; c'est le diagramme de fermeture du fabricant qui fait foi." },
      { list: ['Plus d\'étages = plus de contacts : on empile autant d\'étages que la fonction le demande.', 'Usages : interrupteur-sectionneur de petite puissance, inverseur de sens, étoile-triangle manuel, commutateur de mesure (voltmètre, ampèremètre), sélecteur de mode.', 'Repère d\'un commutateur sur le schéma : S (ou SA en usage courant).'] },
      { tip: "Dans la simulation, tourne la manette de position en position : chaque came tourne avec l'arbre ; le contact se ferme quand son poussoir tombe dans un creux." }
    ]] },
    n3m6l2: { min: 12, why: "Le diagramme de fermeture est la seule description fiable d'un commutateur à cames : on le lit pour câbler, on l'écrit pour commander un commutateur sur mesure.", screens: [[
      { h: 'Le diagramme de fermeture' },
      { p: "C'est un tableau : en colonnes les positions, en lignes les contacts (1-2, 3-4…). Une croix signifie « contact fermé dans cette position ». Les fabricants l'appellent aussi programme de commutation." },
      { p: "Exemple : le commutateur de voltmètre. Un seul appareil, raccordé aux bornes A et B du commutateur, lit les tensions simples (L1-N, L2-N, L3-N) puis composées (L1-L2, L2-L3, L3-L1). La borne A doit être reliée à L1, L2 ou L3 ; la borne B à N, L2, L3 ou L1 : sept contacts suffisent." },
      { warn: "Dans aucune position deux contacts fermés ne doivent relier deux conducteurs différents du réseau (par exemple L1 et L2 sur la même borne A) : ce serait un court-circuit franc à travers le commutateur." },
      { tip: "Remplis le diagramme dans la simulation, puis clique « Vérifier toutes les positions » : chaque position est contrôlée, ainsi que les passages d'une position à l'autre." }
    ]] },
    n3m6l3: { min: 15, why: "Un commutateur à cames se commande sur mesure : il faut savoir passer de la fonction attendue au nombre de contacts et à leur diagramme.", screens: [[
      { h: 'Concevoir un commutateur à partir de la fonction' },
      { list: ['1. Lister les bornes à raccorder (arrivées, départs, appareil).', '2. Pour chaque position, écrire les liaisons à établir (qui doit être relié à qui).', '3. Une liaison = un contact. Une borne reliée à plusieurs autres : des contacts « en étoile » depuis une borne commune.', '4. Une liaison présente dans plusieurs positions : un seul contact, fermé dans chacune de ces positions.', '5. Vérifier chaque position : rien de plus, rien de moins que les liaisons demandées, et jamais deux conducteurs du réseau reliés entre eux.', '6. Vérifier les passages entre positions (forme des cames, leçon suivante).'] },
      { p: "Exemple de l'inverseur 1-0-2 : en position 1, L1-U, L2-V, L3-W ; en position 2, L1-V, L2-U, L3-W. La liaison L3-W existe dans les deux positions : un seul contact fermé en 1 et en 2. Il faut donc 5 contacts : L1-U, L2-V, L3-W, L1-V, L2-U." },
      { p: "Le commutateur étoile-triangle manuel demande 8 contacts : 3 pour les lignes (L1-U1, L2-V1, L3-W1, fermés en Y et en Δ), 2 pour le point étoile (par exemple U2-V2 et U2-W2) et 3 pour le triangle (L1-W2, L2-U2, L3-V2)." },
      { tip: "Dans la simulation, mode conception : choisis toi-même les bornes de chaque contact. Plusieurs solutions sont justes ; la vérification ne regarde que le fonctionnement." }
    ]] },
    n3m6l4: { min: 12, why: "Deux commutateurs au même diagramme peuvent se comporter très différemment pendant la manœuvre : tout se joue dans la forme des cames.", screens: [[
      { h: 'La forme des cames' },
      { p: "Le creux d'une came s'étend sur un angle. Fermé dans une position isolée : un creux centré sur cette position. Fermé dans deux positions voisines : un creux continu de l'une à l'autre, le contact reste fermé pendant le passage (contacts de ligne de l'étoile-triangle)." },
      { p: "La largeur des creux règle ce qui se passe entre deux positions :" },
      { list: ['<b>Coupure avant fermeture</b> : creux étroits, le contact de la position quittée s\'ouvre avant que celui de la position suivante se ferme. Indispensable pour l\'étoile-triangle (sinon le point étoile, encore fermé, court-circuite les phases quand le triangle se ferme) et pour l\'inverseur.', '<b>Fermeture avant coupure</b> (chevauchement) : creux plus larges que le pas, le contact suivant se ferme avant que le précédent s\'ouvre. Indispensable pour un commutateur d\'ampèremètre sur transformateurs de courant : le secondaire d\'un TC ne doit jamais être ouvert en charge (surtension dangereuse), le commutateur court-circuite les TC non mesurés et ne doit jamais ouvrir leur circuit pendant le passage.'] },
      { warn: "Le même diagramme de fermeture peut donc être réalisé avec des cames à coupure avant fermeture ou à chevauchement : il faut le préciser à la commande." },
      { tip: "Dans la simulation (étoile-triangle), élargis les creux au-delà de 100 % du pas puis passe de Y à Δ : le court-circuit transitoire apparaît. Reviens à 50 % : la manœuvre est sûre." }
    ]] }
  });
  const lv = AA.CURRICULUM && AA.CURRICULUM.find(l => l.id === 'n3');
  if (lv && !lv.modules.find(m => m.id === 'n3m6')) {
    const L = ['Principe : arbre, cames, éléments de contact|sim', 'Le diagramme de fermeture|sim', 'Concevoir un commutateur à partir de la fonction|sim', 'La forme des cames : coupure avant fermeture, chevauchement|sim'];
    lv.modules.splice(lv.modules.findIndex(m => m.id === 'n3m2') + 1, 0, { id: 'n3m6', t: 'Les commutateurs à cames', lessons: L.map((s, i) => { const [a, b] = s.split('|'); return { id: 'n3m6l' + (i + 1), t: a, tag: b }; }) });
  }
  Object.assign(AA.VISMAP, {
    n3m6l1: [{ sim: 'cames', opts: { f: 'deux', mode: 'demo' } }],
    n3m6l2: [{ sim: 'cames', opts: { f: 'volt', mode: 'grid' } }],
    n3m6l3: [{ sim: 'cames', opts: { f: 'inv', mode: 'free' } }],
    n3m6l4: [{ sim: 'cames', opts: { f: 'yd', mode: 'demo' } }]
  });

  /* ---------- Défi ---------- */
  const register = () => {
    const D = AA.Defis; if (!D || !D.TYPES) return;
    D.TYPES.cames = {
      name: 'Commutateur à cames sur mesure', icon: 'bolt', min: 1,
      desc: 'Une fonction à réaliser : choisis les contacts, écris le diagramme de fermeture et règle les cames. Toute solution qui fonctionne dans chaque position et pendant les manœuvres est acceptée.',
      gen: (r, lvl) => { const keys = lvl < 2 ? ['deux', 'volt'] : lvl < 4 ? ['volt', 'inv'] : ['inv', 'yd', 'volt']; const k = r.pick ? r.pick(keys) : keys[Math.floor(r() * keys.length)]; return { k, seed: Math.floor(r() * 1e9), lvl, sig: k + Math.floor(r() * 1e4) }; },
      play(main, inst, done) {
        const spec = C.spec(inst.k, AA.rng(inst.seed));
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Commutateurs à cames</p><h1>${esc(spec.t)}</h1></div></div><div class="js-s"></div>`;
        let finished = false;
        SIMS.cames(main.querySelector('.js-s'), { spec, mode: 'free', onDone: s => { if (!finished) { finished = true; done(s); } } });
      }
    };
  };
  register();
})();
