/* Ampère Académie — application : navigation, accueil, parcours, leçons, atelier, profil. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const S = AA.state;

  const NAV = [
    ['accueil', 'Accueil', 'home', 'Q1', ''], ['parcours', 'Parcours', 'path', 'Q2', 'lecon'], ['atelier', 'Atelier', 'schema', 'Q3', ''],
    ['labo', 'Labo', 'bolt', 'Q4', ''], ['coffret', 'Coffret 3D', 'cube', 'Q5', ''], ['automate', 'Automate', 'plc', 'Q6', ''],
    ['defis', 'Défis', 'trophy', 'Q7', 'defi projet'], ['profil', 'Profil', 'user', 'Q8', '']
  ];
  AA.$('#din').innerHTML = NAV.map(([v, t, i, ref, alt]) => `<a class="mod" href="#/${v}" data-v="${v}" data-alt="${alt}" title="${t}"><span class="mod-led"></span><span class="mod-ref">${ref}</span><span class="mod-lever"><i></i></span><span class="mod-name">${t}</span></a>`).join('');

  /* ---------- Outils de progression ---------- */
  const lessonsAll = () => AA.allLessons();
  const written = () => lessonsAll().filter(l => AA.L[l.id]);
  const nextLesson = () => written().find(l => !S.lessons[l.id]) || written()[0];
  AA.levelStats = lv => {
    let tot = 0, wr = 0, dn = 0;
    lv.modules.forEach(m => m.lessons.forEach(l => { tot++; if (AA.L[l.id]) wr++; if (S.lessons[l.id]) dn++; }));
    return { tot, wr, dn };
  };

  /* ---------- Accueil : synoptique de la formation ---------- */
  function synoptic() {
    const L = AA.CURRICULUM, RH = 46, y0 = 36, H = y0 + L.length * RH + 10;
    let g = `<svg viewBox="0 0 760 ${H}" role="img" aria-label="Synoptique de ta formation">`;
    g += `<circle class="src" cx="38" cy="${y0 - 8}" r="13"/><circle class="src" cx="38" cy="${y0 + 12}" r="13"/>`;
    g += `<text class="srct" x="38" y="${y0 + 44}" text-anchor="middle">${esc((S.name || 'TOI').toUpperCase().slice(0, 10))}</text>`;
    g += `<line class="feed" x1="51" y1="${y0 + 2}" x2="88" y2="${y0 + 2}"/>`;
    g += `<line class="bus" x1="92" y1="${y0 - 10}" x2="92" y2="${y0 + (L.length - 1) * RH + 12}"/>`;
    L.forEach((lv, i) => {
      const st = AA.levelStats(lv), y = y0 + i * RH, frac = st.tot ? st.dn / st.tot : 0, done = st.tot && st.dn === st.tot;
      g += `<g class="row" data-l="${lv.id}" tabindex="0" role="link" aria-label="${esc(lv.t)}">`;
      g += `<line class="feed" x1="92" y1="${y}" x2="168" y2="${y}"/>`;
      if (st.dn) g += `<line class="feed-on" x1="92" y1="${y}" x2="168" y2="${y}"/>`;
      g += `<path class="brk" d="M120 ${y} L136 ${y - 9} M136 ${y} L150 ${y} M117 ${y - 3} l6 6 M123 ${y - 3} l-6 6"/>`;
      g += `<rect class="load" x="170" y="${y - 18}" width="520" height="36" rx="4"/>`;
      g += `<text class="num" x="182" y="${y + 4}">${String(lv.n).padStart(2, '0')}</text>`;
      g += `<text class="lt" x="212" y="${y - 2}">${esc(lv.t)}</text><text class="ls" x="212" y="${y + 12}">${esc(lv.sub)} · ${st.dn}/${st.tot} leçons${st.wr ? '' : ' · en préparation'}</text>`;
      g += `<rect class="pct-bg" x="566" y="${y - 3}" width="110" height="6" rx="3"/><rect class="pct" x="566" y="${y - 3}" width="${Math.max(0, Math.round(110 * frac))}" height="6" rx="3"/>`;
      g += `<line class="feed" x1="690" y1="${y}" x2="712" y2="${y}"/><circle class="${done ? 'lamp-on' : 'lamp-off'}" cx="726" cy="${y}" r="10"/>`;
      g += `<path class="brk" d="M719 ${y - 7} l14 14 M733 ${y - 7} l-14 14" style="stroke-width:1.4;opacity:${done ? .5 : 1}"/></g>`;
    });
    return g + '</svg>';
  }
  AA.route('accueil', main => {
    const p = AA.rankProgress(S.xp), nl = nextLesson();
    const done = Object.keys(S.lessons).length, defisDone = Object.values(S.defis).reduce((a, d) => a + (d.n || 0), 0);
    const hour = new Date().getHours(), hello = hour < 6 ? 'Bonne nuit' : hour < 18 ? 'Bonjour' : 'Bonsoir';
    const seg = (v, lbl) => `<div class="seg7"><b data-ghost="${'8'.repeat(String(v).length)}">${v}</b><span>${lbl}</span></div>`;
    main.innerHTML = `
      <div class="home-head"><div><p class="eyebrow">${hello}${S.name ? ', ' + esc(S.name) : ''} · folio F-01 · ton installation</p>
        <h1>Chaque leçon <span>met sous tension</span> une nouvelle partie de ton savoir.</h1></div>
        <div class="counters" style="min-width:min(100%,420px)">${seg(AA.fmt(S.xp, 0).replace(/\s/g, ''), 'XP')}${seg(done, 'leçons')}${seg(defisDone, 'défis')}${seg(S.streak.n || 0, 'jours de suite')}</div></div>
      <div class="home-grid">
        <section class="card syno plate"><i class="rv"></i><p class="eyebrow">Synoptique de ta formation — clique un départ</p>${synoptic()}</section>
        <aside class="pupitre">
          <div class="card start-panel plate"><i class="rv"></i>
            <button class="big-push js-go" aria-label="Démarrer la prochaine leçon"><i></i><b>MARCHE</b></button>
            <div><p class="eyebrow">${nl && S.lessons[nl.id] ? 'Révision' : 'Prochaine leçon'}</p><h3>${nl ? esc(nl.t) : '—'}</h3><p>${nl ? `Niveau ${nl.level.n} · ${esc(nl.module.t)}` : ''}</p></div></div>
          <div class="ticket"><span class="stamp">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span><p class="eyebrow">Bon d'intervention du jour</p><div class="js-daily"></div></div>
          <div class="devices">
            <a class="device" href="#/atelier">${artSchema()}<span>Atelier</span></a>
            <a class="device" href="#/labo">${artLabo()}<span>Labo</span></a>
            <a class="device" href="#/coffret">${artCube()}<span>Coffret 3D</span></a>
            <a class="device" href="#/automate">${artPlc()}<span>Automate</span></a>
          </div>
          <div class="card plain" style="padding:14px 16px"><div class="row">${AA.insignia(p.i, 46)}<div style="flex:1"><b style="font-family:var(--f-display)">${esc(p.r.n)}</b><div class="muted" style="font-size:13px">${p.next ? `encore ${AA.fmt(p.need, 0)} XP pour « ${esc(p.next.n)} »` : 'grade maximal atteint'}</div><i class="bar"><i style="width:${Math.round(p.frac * 100)}%"></i></i></div></div></div>
        </aside>
      </div>`;
    main.querySelector('.js-go').onclick = () => { if (nl) setTimeout(() => { location.hash = '#/lecon/' + nl.id; }, 180); };
    main.querySelectorAll('.syno .row').forEach(r => {
      const go = () => { location.hash = '#/parcours/' + r.dataset.l; };
      r.addEventListener('click', go); r.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    });
    if (AA.Defis && AA.Defis.dailyCard) AA.Defis.dailyCard(main.querySelector('.js-daily'));
    if (!S.settings.themeChosen) setTimeout(() => AA.themePicker(true), 500);
  });
  const artSchema = () => `<svg viewBox="0 0 200 70" class="art"><path d="M20 5v18M20 47v18M20 23l-9-14" class="a-ink"/><path d="M20 35h40" class="a-live"/><rect x="60" y="23" width="30" height="24" rx="2" class="a-ink a-on"/><path d="M90 35h50" class="a-live"/><circle cx="160" cy="35" r="14" class="a-ink a-lamp"/><path d="M150 25l20 20M170 25l-20 20" class="a-ink"/></svg>`;
  const artLabo = () => `<svg viewBox="0 0 200 70" class="art"><path d="M10 35 Q35 5 60 35 T110 35 T160 35 T210 35" class="a-l1"/><path d="M10 35 Q35 65 60 35 T110 35 T160 35" class="a-l2" transform="translate(-17 0)"/><path d="M10 35 Q35 5 60 35 T110 35 T160 35" class="a-l3" transform="translate(17 0)"/></svg>`;
  const artCube = () => `<svg viewBox="0 0 200 70" class="art"><path d="M70 12l40-8 40 8v46l-40 8-40-8z" class="a-ink"/><path d="M70 12l40 8 40-8M110 20v46" class="a-ink"/><rect x="80" y="28" width="10" height="16" class="a-on"/><rect x="94" y="28" width="10" height="16" class="a-ink"/><circle cx="130" cy="32" r="4" class="a-lamp"/></svg>`;
  const artPlc = () => `<svg viewBox="0 0 200 70" class="art"><path d="M15 8v54M185 8v54" class="a-ink"/><path d="M15 25h30M55 25h40M105 25h50M170 25h15" class="a-live"/><path d="M45 15v20M55 15v20M95 15v20M105 15v20" class="a-ink"/><path d="M155 25a8 8 0 0 1 15 0a8 8 0 0 1-15 0" class="a-on"/><path d="M15 50h30M55 50h130" class="a-ink"/><path d="M45 40v20M55 40v20" class="a-ink"/></svg>`;

  /* Choix du thème : petites armoires peintes, révélation circulaire */
  AA.themePicker = (first) => {
    const cur = AA.resolvedTheme();
    const m = AA.modal(`<p class="eyebrow">${first ? 'Bienvenue' : 'Apparence'}</p><h2>${first ? 'Choisis ton atelier' : 'Changer de thème'}</h2>
      <p class="muted">Tu pourras en changer à tout moment dans ton profil.</p>
      <div class="themes">${AA.THEMES.map(t => `<button class="theme-card ${t.id === cur ? 'on' : ''}" data-t="${t.id}"><div class="sw" style="background:${t.sw[0]}">${t.sw.slice(1).map(c => `<i style="background:${c}"></i>`).join('')}</div><b>${t.n}</b><span>${t.d}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn primary" data-close>C'est parti</button></div>`, { cls: 'wide' });
    m.el.querySelectorAll('.theme-card').forEach(b => b.onclick = e => {
      m.el.querySelectorAll('.theme-card').forEach(x => x.classList.toggle('on', x === b));
      AA.setTheme(b.dataset.t, e);
    });
    S.settings.themeChosen = true; AA.save();
  };

  /* ---------- Parcours : armoires, lignes de commande, voyants ---------- */
  AA.route('parcours', (main, [lid]) => {
    const open = lid || S.openLevel || 'n0';
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Programme complet</p><h1>Le parcours</h1>
      <p>${AA.CURRICULUM.length} niveaux, ${AA.CURRICULUM.reduce((a, l) => a + l.modules.length, 0)} modules, ${lessonsAll().length} leçons. Chaque module est une ligne de commande : chaque leçon terminée allume son voyant et le courant descend jusqu'à elle.</p></div>
      <span class="chip copper">${written().length} leçons disponibles</span></div>
      ${AA.CURRICULUM.map(lv => {
        const s2 = AA.levelStats(lv), pct = s2.tot ? Math.round(s2.dn / s2.tot * 100) : 0;
        return `<section class="cab ${lv.id === open ? 'open' : ''}" id="lv-${lv.id}" data-l="${lv.id}">
          <div class="cab-head" tabindex="0"><div class="cab-num">${String(lv.n).padStart(2, '0')}</div>
            <div><h3>${esc(lv.t)}</h3><p>${esc(lv.sub)} — ${esc(lv.d)}</p></div>
            <div class="cab-gauge"><i><b style="width:${pct}%"></b></i><span>${s2.dn}/${s2.tot} · ${s2.wr ? s2.wr + ' dispo.' : 'en préparation'}</span></div></div>
          <div class="cab-body">${lv.modules.map(m => {
            const idx = m.lessons.map(l => !!S.lessons[l.id]);
            const last = idx.lastIndexOf(true);
            return `<div class="rung"><h4>${esc(m.t)}</h4><ol style="--lit:${last < 0 ? 0 : Math.round((last + 1) / m.lessons.length * 100)}%">${m.lessons.map(l => {
              const has = !!AA.L[l.id], dn = S.lessons[l.id];
              return `<li class="${dn ? 'done' : has ? 'avail' : 'soon'}">${has ? `<a href="#/lecon/${l.id}">` : '<span>'}<i class="lampx"></i>${esc(l.t)}${has ? '<em class="vis-tag">◉</em>' : ''}${has ? '</a>' : '</span>'}</li>`;
            }).join('')}</ol></div>`;
          }).join('')}</div></section>`;
      }).join('')}`;
    main.querySelectorAll('.cab-head').forEach(h => {
      const tog = () => { const c = h.closest('.cab'); c.classList.toggle('open'); S.openLevel = c.classList.contains('open') ? c.dataset.l : ''; AA.save(); };
      h.addEventListener('click', tog); h.addEventListener('keydown', e => { if (e.key === 'Enter') tog(); });
    });
    if (lid) setTimeout(() => { const el = main.querySelector('#lv-' + lid); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  /* ---------- Blocs de leçon ---------- */
  function renderBlock(b, ctx) {
    const d = document.createElement('div');
    d.className = 'block';
    if (b.h) { d.innerHTML = `<h2>${b.h}</h2>`; return d; }
    if (b.p) { d.innerHTML = `<p>${b.p}</p>`; return d; }
    for (const k of ['analogy', 'tip', 'warn', 'real']) if (b[k]) { d.innerHTML = `<div class="${k}">${b[k]}</div>`; return d; }
    if (b.list) { d.innerHTML = `<ul class="nice">${b.list.map(x => `<li>${x}</li>`).join('')}</ul>`; return d; }
    if (b.formula) { d.innerHTML = `<div class="formula">${b.formula}${b.small ? `<small>${b.small}</small>` : ''}</div>`; return d; }
    if (b.table) { d.innerHTML = `<div class="card tablecard"><table class="t"><thead><tr>${b.table.head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${b.table.rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; return d; }
    if (b.recap) { d.innerHTML = `<div class="card recap"><p class="eyebrow">À retenir</p><ul class="nice">${b.recap.map(x => `<li>${x}</li>`).join('')}</ul></div>`; return d; }
    if (b.sim) { const st = AA.SIMS[b.sim](d); if (st) ctx.cleanups.push(st); return d; }
    if (b.think) {
      d.innerHTML = `<div class="card think"><p class="eyebrow">Réfléchis avant de lire</p><p class="q">${b.think.q}</p><button class="btn sm">${ic.eye}Voir la réponse</button><div class="ans" hidden><p>${b.think.a}</p></div></div>`;
      d.querySelector('button').onclick = e => { d.querySelector('.ans').hidden = false; e.currentTarget.remove(); };
      return d;
    }
    if (b.quiz) {
      const q = b.quiz, item = { kind: 'quiz', ok: null };
      ctx.items.push(item);
      const order = AA.rng(Date.now() + ctx.items.length).shuffle(q.opts.map((o, i) => i));
      d.innerHTML = `<div class="card quiz"><p class="eyebrow">Question</p><div class="q">${q.q}</div><div class="opts">${order.map(i => `<button class="opt" data-i="${i}">${q.opts[i]}</button>`).join('')}</div><div class="why">${q.why || ''}</div></div>`;
      d.querySelectorAll('.opt').forEach(btn => btn.addEventListener('click', () => {
        const card = d.querySelector('.quiz'); if (card.classList.contains('answered')) return;
        const good = +btn.dataset.i === q.a;
        card.classList.add('answered');
        btn.classList.add(good ? 'good' : 'badc');
        if (!good) d.querySelector(`.opt[data-i="${q.a}"]`).classList.add('good');
        item.ok = good; AA.click(good ? 1800 : 300, good ? 0.07 : 0.15);
      }));
      return d;
    }
    if (b.num) {
      const item = { kind: 'num', ok: null };
      ctx.items.push(item);
      let tries = 0, ex;
      const gen = () => {
        ex = b.num.gen(AA.rng(Date.now() ^ (Math.random() * 1e9)));
        tries = 0;
        d.innerHTML = `<div class="card numq"><p class="eyebrow">Calcul · valeurs tirées au hasard</p><p class="q">${ex.q}</p>
          <div class="num-in"><input inputmode="decimal" placeholder="Ta réponse"><span class="unit">${esc(ex.unit)}</span><button class="btn primary sm" data-a="check">Vérifier</button><button class="btn sm ghost" data-a="new" title="Autres valeurs">${ic.reset}</button></div>
          <div class="fb"></div></div>`;
        const inp = d.querySelector('input'), fb = d.querySelector('.fb');
        const check = () => {
          const v = parseFloat(inp.value.replace(/\s/g, '').replace(',', '.'));
          if (!isFinite(v)) { fb.innerHTML = '<p class="muted">Entre un nombre (virgule ou point acceptés).</p>'; return; }
          tries++;
          const okv = Math.abs(v - ex.a) <= Math.max(Math.abs(ex.a) * (ex.tol || 0.02), 1e-9 + (ex.abs || 0));
          if (okv) { fb.innerHTML = `<p class="ok-t">${ic.check} Exact. ${ex.sol || ''}</p>`; if (item.ok === null) item.ok = tries === 1; AA.click(1800, 0.07); inp.disabled = true; }
          else if (tries >= 3) { fb.innerHTML = `<p class="bad-t">Pas encore. Solution : ${ex.sol || AA.fmt(ex.a, 3) + ' ' + ex.unit}</p>`; if (item.ok === null) item.ok = false; inp.disabled = true; }
          else fb.innerHTML = `<p class="bad-t">${v > ex.a ? 'Trop grand' : 'Trop petit'}. Vérifie la formule et les unités (essai ${tries}/3).</p>`;
        };
        d.querySelector('[data-a=check]').onclick = check;
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
        d.querySelector('[data-a=new]').onclick = gen;
      };
      gen();
      return d;
    }
    if (b.symbols) {
      // Galerie de symboles IEC dessinés par le moteur des folios (état repos / actionné)
      const SYM = window.AASchema.SYM;
      d.innerHTML = `<div class="symgal">${b.symbols.map(([type, name, desc, extra]) => {
        const p = Object.assign({ type, id: 'X', n: {}, st: {} }, extra || {});
        const rest = SYM[type](p, { closed: window.AASim.TYPES[type] && window.AASim.TYPES[type].nc ? true : false, on: false, pos: 1, state: 'stop' });
        const act = SYM[type](p, { closed: window.AASim.TYPES[type] && window.AASim.TYPES[type].nc ? false : true, on: true, pos: 2, state: 'run', blown: true, tripped: true });
        return `<figure class="sym-card"><svg class="schema mini" viewBox="${type.startsWith('motor') ? '-70 -70 140 140' : type.endsWith('3') ? '-50 -50 190 100' : '-50 -50 100 100'}"><g class="sym">${rest}</g></svg>
          <svg class="schema mini act" viewBox="${type.startsWith('motor') ? '-70 -70 140 140' : type.endsWith('3') ? '-50 -50 190 100' : '-50 -50 100 100'}"><g class="sym">${act}</g></svg>
          <figcaption><b>${name}</b><span>${desc}</span></figcaption></figure>`;
      }).join('')}</div><p class="muted" style="font-size:12.5px">Survole un symbole : à gauche au repos, à droite actionné.</p>`;
      return d;
    }
    if (b.plc) {
      // Automate intégré : éditeur + vérification automatique (table de vérité ou chronogramme)
      const item = { kind: 'plc', ok: null };
      ctx.items.push(item);
      d.innerHTML = `<div class="card plc-task"><p class="eyebrow">Programme l'automate</p><p>${b.plc.task}</p><button class="btn primary sm js-chk">${ic.check}Vérifier mon programme</button><div class="js-fb"></div></div><div class="js-ed" style="margin-top:12px"></div>`;
      const ed = AA.Ladder.editor(d.querySelector('.js-ed'), { prog: b.plc.prog ? JSON.parse(JSON.stringify(b.plc.prog)) : undefined, names: b.plc.names || {}, inputs: b.plc.inputs, outputs: b.plc.outputs });
      ctx.cleanups.push(() => ed.stop());
      d.querySelector('.js-chk').onclick = () => {
        const r = AA.Ladder.check(ed.prog, b.plc.test);
        d.querySelector('.js-fb').innerHTML = r.ok ? `<p class="ok-t">${ic.check} Programme correct. ${b.plc.sol || ''}</p>` : `<p class="bad-t">${AA.esc(r.msg)}</p>`;
        if (item.ok === null || r.ok) item.ok = item.ok === null ? r.ok : item.ok;
        if (r.ok) AA.click(1800, 0.07);
      };
      return d;
    }
    if (b.circuit) {
      const item = { kind: 'tasks', ok: null };
      if (b.tasks) ctx.items.push(item);
      d.innerHTML = `<div class="lesson-bench"><div class="lb-main"></div><div class="lb-tasks"></div></div>`;
      const bench = AA.bench(d.querySelector('.lb-main'), b.circuit, { meter: b.meter, overload: b.overload, fault: b.fault, noInterlock: b.noInterlock, height: '460px' });
      if (b.guide) {
        const c = window.AACircuits.C[b.circuit];
        const g = document.createElement('div');
        g.className = 'card guide';
        g.innerHTML = `<p class="eyebrow">Visite guidée — clique une étape</p>${c.guide.map((s, i) => `<div class="guide-step" data-id="${s.id}"><i>${i + 1}</i><span>${s.t}</span></div>`).join('')}`;
        g.querySelectorAll('.guide-step').forEach(el => el.addEventListener('click', () => {
          g.querySelectorAll('.guide-step').forEach(x => x.classList.toggle('on', x === el)); bench.view.highlight(el.dataset.id);
        }));
        d.querySelector('.lb-tasks').appendChild(g);
      }
      if (b.tasks) {
        const tw = document.createElement('div');
        d.querySelector('.lb-tasks').prepend(tw);
        AA.taskList(tw, bench, b.tasks, () => { item.ok = true; AA.toast('<b>Missions accomplies</b> Bien joué !', 'xp'); });
      }
      ctx.cleanups.push(() => bench.destroy());
      return d;
    }
    d.textContent = '';
    return d;
  }
  AA.renderBlock = renderBlock;

  /* ---------- Lecteur de leçon ---------- */
  AA.route('lecon', (main, [id]) => {
    const meta = AA.findLesson(id), L = AA.L[id];
    if (!meta || !L) { main.innerHTML = `<div class="card"><h2>Leçon en préparation</h2><p>Cette leçon arrive bientôt.</p><a class="btn" href="#/parcours">${ic.back}Parcours</a></div>`; return; }
    let idx = 0;
    const ctx = { items: [], cleanups: [] };
    const all = written(), pos = all.findIndex(l => l.id === id), next = all[pos + 1];
    function show() {
      ctx.cleanups.forEach(f => { try { f(); } catch (e) { /* ignorer */ } }); ctx.cleanups = [];
      const scr = L.screens[idx];
      main.innerHTML = `<div class="lesson">
        <div class="lesson-top"><a class="btn sm ghost icon" href="#/parcours" title="Parcours">${ic.back}</a><div class="lesson-progress"><i style="width:${(idx + 1) / L.screens.length * 100}%"></i></div><span class="muted mono">${idx + 1}/${L.screens.length}</span></div>
        ${idx === 0 ? `<p class="eyebrow">Niveau ${meta.level.n} · ${esc(meta.module.t)}</p><h1>${esc(meta.t)}</h1><div class="why-box"><b>Pourquoi c'est important</b><span>${L.why}</span><em>${ic.clock} ${L.min} min</em></div>` : ''}
        <div class="screen"></div>
        <div class="lesson-nav">${idx > 0 ? `<button class="btn" data-a="prev">${ic.back}Précédent</button>` : ''}<span class="spacer"></span>
          <button class="btn primary" data-a="next">${idx < L.screens.length - 1 ? 'Suivant' : 'Terminer la leçon'}${ic.arrow}</button></div></div>`;
      const box = main.querySelector('.screen');
      const vis = idx === 0 && AA.VISMAP ? (AA.VISMAP[id] || []) : [];
      scr.forEach((b, k) => {
        box.appendChild(renderBlock(b, ctx));
        if (vis.length && k === Math.min(1, scr.length - 1)) {
          const head = document.createElement('div'); head.className = 'block vis-head'; head.innerHTML = '<p class="eyebrow">Visualiser</p>'; box.appendChild(head);
          vis.forEach(v => { if (v.circuit) box.appendChild(renderBlock(v, ctx)); else { const d = document.createElement('div'); d.className = 'block'; AA.renderVis(v, d, ctx); box.appendChild(d); } });
        }
      });
      main.querySelector('[data-a=next]').onclick = () => { if (idx < L.screens.length - 1) { idx++; show(); window.scrollTo(0, 0); } else finish(); };
      const pv = main.querySelector('[data-a=prev]'); if (pv) pv.onclick = () => { idx--; show(); window.scrollTo(0, 0); };
    }
    function finish() {
      ctx.cleanups.forEach(f => { try { f(); } catch (e) { /* ignorer */ } }); ctx.cleanups = [];
      const n = ctx.items.length, good = ctx.items.filter(i => i.ok).length;
      const score = n ? good / n : 1;
      const first = !S.lessons[id];
      const xp = first ? Math.round(30 + 50 * score) : Math.round(10 * score);
      S.lessons[id] = { t: Date.now(), score: Math.max(score, (S.lessons[id] || {}).score || 0) };
      AA.save();
      main.innerHTML = `<div class="lesson done-screen"><div class="card center plate"><i class="rv"></i>
        <p class="eyebrow">Leçon terminée</p><h1>${esc(meta.t)}</h1>
        <div class="score-big">${Math.round(score * 100)}<small>%</small></div>
        <p class="muted">${n ? `${good} réussite${good > 1 ? 's' : ''} du premier coup sur ${n} exercice${n > 1 ? 's' : ''}.` : ''} ${score < 0.6 ? 'Refais les exercices : les valeurs changent à chaque fois.' : 'Solide.'}</p>
        <div class="row" style="justify-content:center;margin-top:16px"><a class="btn" href="#/lecon/${id}">${ic.reset}Refaire</a>${next ? `<a class="btn primary" href="#/lecon/${next.id}">Leçon suivante : ${esc(next.t)}${ic.arrow}</a>` : `<a class="btn primary" href="#/defis">${ic.trophy}Passer aux défis</a>`}</div></div></div>`;
      AA.addXP(xp, 'Leçon : ' + meta.t);
    }
    show();
    return { leave: () => ctx.cleanups.forEach(f => { try { f(); } catch (e) { /* ignorer */ } }) };
  });

  /* ---------- Atelier ---------- */
  AA.route('atelier', (main, [cid]) => {
    const list = window.AACircuits.LIST;
    cid = list.includes(cid) ? cid : (S.lastCircuit || 'dol');
    S.lastCircuit = cid; AA.save();
    const c = window.AACircuits.C[cid];
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Atelier · folios vivants</p><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p></div></div>
      <div class="circuit-list">${list.map(k => `<a class="circuit-pill ${k === cid ? 'on' : ''}" href="#/atelier/${k}">${esc(window.AACircuits.C[k].title)}<small>${esc(window.AACircuits.C[k].level)}</small></a>`).join('')}</div>
      <div class="workbench"><div class="wb-host"></div><aside class="wb-side">
        <div class="card"><p class="eyebrow">Visite guidée</p>${c.guide.map((s, i) => `<div class="guide-step" data-id="${s.id}"><i>${i + 1}</i><span>${s.t}</span></div>`).join('')}</div>
        <div class="card"><p class="eyebrow">États en direct</p><div class="state-table js-state"></div></div>
        <div class="card part-info js-info"><p class="eyebrow">Appareil</p><p class="muted">Clique un appareil (en mode Multimètre, sans le manœuvrer) pour voir son rôle.</p></div>
        <div class="card"><p class="eyebrow">Labo des pannes</p><p class="muted" style="font-size:13px">Injecte une panne et observe ses symptômes. En défi, elle sera cachée : à toi de la trouver.</p>
          <div class="row"><select class="sel js-fpart">${c.parts.map(p => `<option>${esc(p.id)}</option>`).join('')}</select><select class="sel js-ftype"><option value="open">coupé / ouvert</option><option value="stuck">soudé / collé</option><option value="overload">surcharge (F2)</option><option value="pole">pôle usé (KM)</option></select></div>
          <div class="row" style="margin-top:8px"><button class="btn sm js-finj">${ic.bug}Injecter</button><button class="btn sm ghost js-fclr">Tout réparer</button></div></div>
      </aside></div>`;
    const bench = AA.bench(main.querySelector('.wb-host'), cid, {
      overload: true, showFaults: true,
      onPick: id => {
        const p = bench.sim.byId[id];
        const T = window.AASim.TYPES[p.type];
        const kinds = { contact: T.nc ? 'Contact à ouverture (NF)' : 'Contact à fermeture (NO)', load: 'Récepteur', fuse: 'Protection', cb: 'Protection', pole3: 'Appareil tripolaire', motor: 'Moteur', sw2: 'Commutateur' };
        main.querySelector('.js-info').innerHTML = `<p class="eyebrow">Appareil</p><h3>${esc(window.AASchema.tagOf(p))} <span class="chip">${esc(kinds[T.kind] || '')}</span></h3>
          <p>${esc(p.info || (p.of ? 'Contact commandé par ' + p.of : ''))}</p>${p.t ? `<p class="muted mono">Bornes : ${p.t.join(' · ')}</p>` : ''}`;
        bench.view.highlight(id);
      }
    });
    main.querySelectorAll('.guide-step').forEach(el => el.addEventListener('click', () => {
      main.querySelectorAll('.guide-step').forEach(x => x.classList.toggle('on', x === el)); bench.view.highlight(el.dataset.id);
    }));
    main.querySelector('.js-finj').onclick = () => { bench.sim.setFault(main.querySelector('.js-fpart').value, main.querySelector('.js-ftype').value); AA.toast('Panne injectée : observe les symptômes.'); };
    main.querySelector('.js-fclr').onclick = () => { bench.sim.clearFaults(); AA.toast('Toutes les pannes sont réparées.'); };
    const stbox = main.querySelector('.js-state');
    const t = setInterval(() => {
      if (!stbox.isConnected) { clearInterval(t); return; }
      const s = bench.sim; let h = '';
      Object.keys(s.coil).forEach(k => { h += `<span class="k">${k}</span><span><i class="led ${s.coil[k] ? 'on' : ''}"></i> ${s.coil[k] ? 'collé' : 'repos'}</span>`; });
      Object.keys(s.lamp).forEach(k => { h += `<span class="k">${k}</span><span><i class="led ${s.lamp[k] ? 'warn' : ''}"></i> ${s.lamp[k] ? 'allumé' : 'éteint'}</span>`; });
      Object.keys(s.motor).forEach(k => { const m = s.motor[k]; h += `<span class="k">${k}</span><span><i class="led ${m.state === 'run' ? 'on' : m.state === 'mono' ? 'bad' : ''}"></i> ${m.state === 'run' ? (m.dir > 0 ? 'marche ↻' : 'marche ↺') : m.state === 'mono' ? 'MONOPHASÉ !' : 'arrêt'}</span>`; });
      s.parts.filter(p => p.type === 'thermal3').forEach(p => { h += `<span class="k">${p.id} échauffement</span><span>${p.st.tripped ? '<b style="color:var(--bad)">déclenché</b>' : Math.round(p.st.heat / 3.2 * 100) + ' %'}</span>`; });
      s.parts.filter(p => p.st.tripped || p.st.blown).forEach(p => { if (p.type !== 'thermal3') h += `<span class="k">${p.id}</span><span><i class="led bad"></i> ${p.type === 'fuse' ? 'fondu (cliquer pour remplacer)' : 'déclenché'}</span>`; });
      stbox.innerHTML = h;
    }, 150);
    return { leave: () => { clearInterval(t); bench.destroy(); } };
  });

  /* ---------- Plus (téléphone) ---------- */
  AA.route('plus', main => {
    main.innerHTML = `<div class="page-head"><div><h1>Plus</h1></div></div><div class="grid g2">
      ${[['labo', 'Labo', 'bolt', "Applications réelles de l'électricité"], ['coffret', 'Coffret 3D', 'cube', 'Armoire électrique en 3D'], ['automate', 'Automate', 'plc', 'Programmation Ladder'], ['profil', 'Profil', 'user', 'Galons, réglages, sauvegarde']]
        .map(([v, t, i, d]) => `<a class="card tile" href="#/${v}"><h3 class="row">${ic[i]}${t}</h3><p>${d}</p></a>`).join('')}</div>`;
  });

  /* ---------- Profil ---------- */
  AA.route('profil', main => {
    const p = AA.rankProgress(S.xp);
    const last = S.history.slice(-12).reverse();
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Profil</p><h1>${S.name ? esc(S.name) : 'Ton profil'}</h1><p>${esc(p.r.n)} · ${AA.fmt(S.xp, 0)} XP · ${Object.keys(S.lessons).length} leçons · série de ${S.streak.n || 0} jour(s)</p></div></div>
      <div class="section-title"><h2>Les galons</h2></div>
      <div class="ranks-list">${AA.RANKS.map((r, i) => `<div class="rank-item ${S.xp >= r.xp ? 'got' : ''} ${i === p.i ? 'cur' : ''}">${AA.insignia(i, 56)}<b>${esc(r.n)}</b><span>${AA.fmt(r.xp, 0)} XP</span></div>`).join('')}</div>
      <div class="grid" style="margin-top:24px;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)">
        <div class="card"><p class="eyebrow">Réglages</p>
          <div class="field"><label>Prénom</label><input type="text" class="js-name" value="${esc(S.name)}" maxlength="30"></div>
          <div class="field"><label>Thème</label><div class="themes js-themes">${[{ id: 'auto', n: 'Automatique', d: 'Suit le réglage clair / sombre de l\'appareil', sw: ['#f2efe8', '#0a0a0f', '#ff6b1a', '#39ff88'] }].concat(AA.THEMES).map(t => `<button class="theme-card ${(S.settings.theme || 'auto') === t.id ? 'on' : ''}" data-t="${t.id}"><div class="sw" style="background:${t.sw[0]}">${t.sw.slice(1).map(c => `<i style="background:${c}"></i>`).join('')}</div><b>${t.n}</b><span>${t.d}</span></button>`).join('')}</div></div>
          <div class="field"><label>Sons des manœuvres</label><div class="seg js-sound"><button data-v="1" class="${S.settings.sound !== false ? 'on' : ''}">Activés</button><button data-v="0" class="${S.settings.sound === false ? 'on' : ''}">Coupés</button></div></div>
          <div class="field"><label>Animations</label><div class="seg js-motion"><button data-v="1" class="${S.settings.motion !== false ? 'on' : ''}">Complètes</button><button data-v="0" class="${S.settings.motion === false ? 'on' : ''}">Réduites</button></div></div>
        </div>
        <div class="card"><p class="eyebrow">Sauvegarde</p><p class="muted">Ta progression reste sur cet appareil. Exporte-la pour la transférer.</p>
          <div class="row"><button class="btn js-exp">Exporter</button><label class="btn">Importer<input type="file" accept=".json,application/json" hidden class="js-imp"></label><button class="btn ghost js-rst">Tout effacer</button></div>
          <p class="eyebrow" style="margin-top:20px">Dernières activités</p><div class="log">${last.map(h => `${new Date(h.t).toLocaleDateString('fr-FR')} · +${h.xp} XP · ${esc(h.why)}`).join('<br>') || 'Aucune activité pour le moment.'}</div></div>
      </div>`;
    main.querySelector('.js-name').addEventListener('change', e => { S.name = e.target.value.trim(); AA.save(); });
    const seg = (sel, fn) => main.querySelectorAll(sel + ' button').forEach(b => b.addEventListener('click', () => { main.querySelectorAll(sel + ' button').forEach(x => x.classList.toggle('on', x === b)); fn(b); AA.save(); }));
    main.querySelectorAll('.js-themes .theme-card').forEach(b => b.onclick = e => { main.querySelectorAll('.js-themes .theme-card').forEach(x => x.classList.toggle('on', x === b)); AA.setTheme(b.dataset.t, e); });
    seg('.js-sound', b => { S.settings.sound = b.dataset.v === '1'; });
    seg('.js-motion', b => { S.settings.motion = b.dataset.v === '1'; AA.applyTheme(); });
    main.querySelector('.js-exp').onclick = () => AA.download(`ampere-academie-progression-${AA.today()}.json`, JSON.stringify(S, null, 1));
    main.querySelector('.js-imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { AA.importState(JSON.parse(t)); AA.toast('Progression importée.'); AA.render(); }).catch(err => AA.toast('Import impossible : ' + esc(err.message), 'bad'));
    };
    main.querySelector('.js-rst').onclick = () => {
      const m = AA.modal(`<h2>Tout effacer ?</h2><p>Ta progression, tes XP et tes galons seront supprimés de cet appareil. Exporte-les d'abord si tu veux les garder.</p><div class="row"><button class="btn" data-close>Annuler</button><button class="btn primary js-yes">Effacer</button></div>`);
      m.el.querySelector('.js-yes').onclick = () => { AA.reset(); m.close(); location.hash = '#/accueil'; location.reload(); };
    };
  });

  /* ---------- Démarrage ---------- */
  AA.applyTheme();
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (S.settings.theme === 'auto') AA.render(); });
  window.addEventListener('DOMContentLoaded', () => { });
  AA.render();
})();
