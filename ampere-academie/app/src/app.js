/* Ampère Académie — application : navigation, accueil, parcours, leçons, atelier, profil. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const S = AA.state;

  const NAV = [
    ['accueil', 'Accueil', 'home'], ['parcours', 'Parcours', 'path'], ['atelier', 'Atelier', 'schema'], ['labo', 'Labo', 'bolt'],
    ['coffret', 'Coffret 3D', 'cube'], ['automate', 'Automate', 'plc'], ['defis', 'Défis', 'trophy'], ['profil', 'Profil', 'user']
  ];
  AA.$('#nav').innerHTML = NAV.map(([v, t, i], k) => (k === 4 || k === 6 ? '<div class="sep"></div>' : '') + `<a href="#/${v}" data-v="${v}" data-alt="${v === 'parcours' ? 'lecon' : v === 'defis' ? 'defi projet' : ''}">${ic[i]}<span>${t}</span></a>`).join('');
  AA.$('#tabbar').innerHTML = [['accueil', 'Accueil', 'home'], ['parcours', 'Parcours', 'path'], ['atelier', 'Atelier', 'schema'], ['defis', 'Défis', 'trophy'], ['plus', 'Plus', 'more']]
    .map(([v, t, i]) => `<a href="#/${v}" data-v="${v}" data-alt="${v === 'parcours' ? 'lecon' : v === 'defis' ? 'defi projet' : v === 'plus' ? 'labo coffret automate profil' : ''}">${ic[i]}<span>${t}</span></a>`).join('');

  /* ---------- Outils de progression ---------- */
  const lessonsAll = () => AA.allLessons();
  const written = () => lessonsAll().filter(l => AA.L[l.id]);
  const nextLesson = () => written().find(l => !S.lessons[l.id]) || written()[0];
  AA.levelStats = lv => {
    let tot = 0, wr = 0, dn = 0;
    lv.modules.forEach(m => m.lessons.forEach(l => { tot++; if (AA.L[l.id]) wr++; if (S.lessons[l.id]) dn++; }));
    return { tot, wr, dn };
  };

  /* ---------- Oscilloscope décoratif (trois phases) ---------- */
  function heroScope(el) {
    return AA.canvas(el, el.clientHeight || 300, (g, W, H, t) => {
      const cols = [AA.css('--pot-L1'), AA.css('--pot-L2'), AA.css('--pot-L3')];
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = cols[k]; g.globalAlpha = 0.55; g.lineWidth = 2;
        g.shadowColor = cols[k]; g.shadowBlur = 12;
        g.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = H * 0.72 + Math.sin(x / W * Math.PI * 4 - t * 1.2 - k * 2.0944) * H * 0.12;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.globalAlpha = 1; g.shadowBlur = 0;
    }).stop;
  }

  function gauge(frac, label) {
    const a0 = -220, a1 = 40, R = 100, cx = 130, cy = 130;
    const ang = a => a * Math.PI / 180;
    const pt = (a, r) => [cx + Math.cos(ang(a)) * r, cy + Math.sin(ang(a)) * r];
    let ticks = '';
    for (let i = 0; i <= 50; i++) {
      const a = a0 + (a1 - a0) * i / 50, maj = i % 10 === 0;
      const [x1, y1] = pt(a, R - (maj ? 14 : 8)), [x2, y2] = pt(a, R);
      ticks += `<line class="tick${maj ? ' major' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      if (maj) { const [tx, ty] = pt(a, R - 26); ticks += `<text x="${tx}" y="${ty + 3}" text-anchor="middle">${i * 2}</text>`; }
    }
    const [sx, sy] = pt(a0, R + 12), [ex, ey] = pt(a0 + (a1 - a0) * Math.max(0.001, frac), R + 12), [bx, by] = pt(a1, R + 12);
    const large = (a1 - a0) * frac > 180 ? 1 : 0;
    const needle = a0 + (a1 - a0) * frac;
    return `<svg class="gauge" viewBox="0 0 260 262"><defs><linearGradient id="gArc" x1="0" x2="1"><stop offset="0" stop-color="#a8521f"/><stop offset=".6" stop-color="#e8894a"/><stop offset="1" stop-color="#ffb43a"/></linearGradient></defs>
      <circle class="face" cx="${cx}" cy="${cy}" r="${R + 22}"/>
      <path class="arc-bg" d="M${sx} ${sy} A${R + 12} ${R + 12} 0 1 1 ${bx} ${by}"/>
      <path class="arc" d="M${sx} ${sy} A${R + 12} ${R + 12} 0 ${large} 1 ${ex} ${ey}"/>
      ${ticks}
      <g class="needle" style="transform-origin:${cx}px ${cy}px;transform:rotate(${a0 + 90}deg)" data-to="${needle + 90}"><path d="M${cx - 4} ${cy} L${cx} ${cy - R + 6} L${cx + 4} ${cy} Z"/></g>
      <circle class="hub" cx="${cx}" cy="${cy}" r="9"/>
      <text class="g-val" x="${cx}" y="${cy + 46}" text-anchor="middle">${Math.round(frac * 100)}</text>
      <text class="g-unit" x="${cx}" y="${cy + 62}" text-anchor="middle">${esc(label)}</text></svg>`;
  }

  /* ---------- Accueil ---------- */
  AA.route('accueil', main => {
    const p = AA.rankProgress(S.xp), nl = nextLesson();
    const done = Object.keys(S.lessons).length, defisDone = Object.values(S.defis).reduce((a, d) => a + (d.n || 0), 0);
    const hour = new Date().getHours();
    const hello = hour < 6 ? 'Bonne nuit' : hour < 18 ? 'Bonjour' : 'Bonsoir';
    main.innerHTML = `
      <section class="hero">
        <div class="scope"></div>
        <div class="hero-text">
          <p class="eyebrow">${hello}${S.name ? ', ' + esc(S.name) : ''} · Jour ${S.streak.n || 1} de série</p>
          <h1>Du premier fil à l'<em>usine entière</em>.</h1>
          <p>Schémas qui s'animent, multimètre en main, coffrets en 3D, automates et défis qui ne se répètent jamais. Avance à ton rythme : tes galons suivront.</p>
          <div class="row">
            ${nl ? `<a class="btn primary" href="#/lecon/${nl.id}">${ic.play}${S.lessons[nl.id] ? 'Revoir' : done ? 'Continuer' : 'Commencer'} : ${esc(nl.t)}</a>` : ''}
            <a class="btn" href="#/defis">${ic.trophy}Défi du jour</a>
          </div>
          <div class="rank-line">${AA.insignia(p.i, 52)}<div><b>${esc(p.r.n)}</b><span>${esc(p.r.s)}</span></div></div>
        </div>
        <div class="hero-gauge">${gauge(p.frac, p.next ? 'VERS ' + p.next.n.toUpperCase() : 'GRADE MAXIMAL')}</div>
      </section>
      <div class="tiles">
        ${tile('atelier', 'Atelier de schémas', 'Folios vivants : manœuvre, mesure, dépanne.', artSchema())}
        ${tile('labo', 'Labo', "L'électricité dans le monde réel : réseau, moteurs, solaire, régulation.", artLabo())}
        ${tile('coffret', 'Coffret 3D', 'Ouvre l\'armoire, suis les fils, actionne les boutons.', artCube())}
        ${tile('automate', 'Automate', 'Programme en Ladder, teste sur le procédé.', artPlc())}
      </div>
      <div class="section-title"><h2>Ta progression</h2></div>
      <div class="grid g3">
        <div class="card plate"><i class="rv"></i><p class="eyebrow">Expérience</p><div class="statline"><div class="stat"><b>${AA.fmt(S.xp, 0)}</b><span>XP</span></div><div class="stat"><b>${done}</b><span>leçons</span></div><div class="stat"><b>${defisDone}</b><span>défis</span></div></div>
          <p class="muted" style="margin:12px 0 0">${p.next ? `Encore <b>${AA.fmt(p.need, 0)} XP</b> pour devenir <b>${esc(p.next.n)}</b>.` : 'Tu as atteint le grade le plus élevé.'}</p></div>
        <div class="card plate daily"><i class="rv"></i><p class="eyebrow">Défi du jour · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p><div class="js-daily"></div></div>
        <div class="card plate"><i class="rv"></i><p class="eyebrow">Parcours</p>${AA.CURRICULUM.slice(0, 5).map(lv => { const s = AA.levelStats(lv); return `<div class="lvl-mini"><span>${lv.n}. ${esc(lv.t)}</span><i class="bar"><i style="width:${s.tot ? Math.round(s.dn / s.tot * 100) : 0}%"></i></i></div>`; }).join('')}<a href="#/parcours" class="go-link">Tout le parcours ${ic.arrow}</a></div>
      </div>`;
    const stop = heroScope(main.querySelector('.scope'));
    requestAnimationFrame(() => setTimeout(() => { const n = main.querySelector('.needle'); if (n) n.style.transform = `rotate(${n.dataset.to}deg)`; }, 120));
    if (AA.Defis && AA.Defis.dailyCard) AA.Defis.dailyCard(main.querySelector('.js-daily'));
    else main.querySelector('.js-daily').innerHTML = '<p class="muted">Bientôt disponible.</p>';
    return { leave: stop };
  });
  function tile(v, t, d, art) { return `<a class="card tile" href="#/${v}"><div class="tile-art">${art}</div><h3>${t}</h3><p>${d}</p><span class="go">Ouvrir ${ic.arrow}</span></a>`; }
  const artSchema = () => `<svg viewBox="0 0 200 70" class="art"><path d="M20 5v18M20 47v18M20 23l-9-14" class="a-ink"/><path d="M20 35h40" class="a-live"/><rect x="60" y="23" width="30" height="24" rx="2" class="a-ink a-on"/><path d="M90 35h50" class="a-live"/><circle cx="160" cy="35" r="14" class="a-ink a-lamp"/><path d="M150 25l20 20M170 25l-20 20" class="a-ink"/></svg>`;
  const artLabo = () => `<svg viewBox="0 0 200 70" class="art"><path d="M10 35 Q35 5 60 35 T110 35 T160 35 T210 35" class="a-l1"/><path d="M10 35 Q35 65 60 35 T110 35 T160 35" class="a-l2" transform="translate(-17 0)"/><path d="M10 35 Q35 5 60 35 T110 35 T160 35" class="a-l3" transform="translate(17 0)"/></svg>`;
  const artCube = () => `<svg viewBox="0 0 200 70" class="art"><path d="M70 12l40-8 40 8v46l-40 8-40-8z" class="a-ink"/><path d="M70 12l40 8 40-8M110 20v46" class="a-ink"/><rect x="80" y="28" width="10" height="16" class="a-on"/><rect x="94" y="28" width="10" height="16" class="a-ink"/><circle cx="130" cy="32" r="4" class="a-lamp"/></svg>`;
  const artPlc = () => `<svg viewBox="0 0 200 70" class="art"><path d="M15 8v54M185 8v54" class="a-ink"/><path d="M15 25h30M55 25h40M105 25h50M170 25h15" class="a-live"/><path d="M45 15v20M55 15v20M95 15v20M105 15v20" class="a-ink"/><path d="M155 25a8 8 0 0 1 15 0a8 8 0 0 1-15 0" class="a-on"/><path d="M15 50h30M55 50h130" class="a-ink"/><path d="M45 40v20M55 40v20" class="a-ink"/></svg>`;

  /* ---------- Parcours ---------- */
  AA.route('parcours', main => {
    const open = S.openLevel || 'n0';
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Programme complet</p><h1>Le parcours</h1>
      <p>${AA.CURRICULUM.length} niveaux, ${AA.CURRICULUM.reduce((a, l) => a + l.modules.length, 0)} modules, ${lessonsAll().length} leçons — de « qu'est-ce qu'un courant » jusqu'à la conception d'une usine. Les leçons s'ouvrent dans l'ordre que tu veux ; les galons récompensent la régularité.</p></div>
      <div class="chip copper">${written().length} leçons disponibles</div></div>
      <div class="levels">${AA.CURRICULUM.map(lv => {
        const s = AA.levelStats(lv);
        return `<div class="level ${s.dn ? 'started' : ''} ${lv.id === open ? 'open' : ''}" data-l="${lv.id}">
          <div class="level-node">${lv.n}</div>
          <div class="card level-body">
            <div class="level-head"><h3>${esc(lv.t)}</h3><span class="chip">${esc(lv.sub)}</span><span class="chip ${s.dn ? 'ok' : ''}">${s.dn}/${s.tot}</span><span class="spacer"></span>${s.wr ? `<span class="chip copper">${s.wr} disponibles</span>` : '<span class="chip">en préparation</span>'}<p>${esc(lv.d)}</p></div>
            <div class="modules">${lv.modules.map(m => `<div class="module"><h4>${esc(m.t)}</h4><ol>${m.lessons.map(l => {
              const has = !!AA.L[l.id], dn = S.lessons[l.id];
              const tag = l.tag === 'sim' ? 'SIMULATION' : l.tag === '3d' ? '3D' : l.tag === 'plc' ? 'AUTOMATE' : '';
              return `<li class="${dn ? 'done' : has ? 'avail' : 'soon'}">${has ? `<a href="#/lecon/${l.id}">` : '<span>'}<i class="st">${dn ? ic.check : ''}</i>${esc(l.t)}${tag ? `<em class="sim-tag">${tag}</em>` : ''}${has ? '</a>' : '</span>'}</li>`;
            }).join('')}</ol></div>`).join('')}</div>
          </div></div>`;
      }).join('')}</div>`;
    main.querySelectorAll('.level-head').forEach(h => h.addEventListener('click', () => {
      const lv = h.closest('.level'); lv.classList.toggle('open');
      S.openLevel = lv.classList.contains('open') ? lv.dataset.l : ''; AA.save();
    }));
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
      scr.forEach(b => box.appendChild(renderBlock(b, ctx)));
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
      <div class="grid g2" style="margin-top:24px">
        <div class="card"><p class="eyebrow">Réglages</p>
          <div class="field"><label>Prénom</label><input type="text" class="js-name" value="${esc(S.name)}" maxlength="30"></div>
          <div class="field"><label>Thème</label><div class="seg js-theme">${[['auto', 'Auto'], ['dark', 'Atelier de nuit'], ['light', 'Papier calque']].map(([v, t]) => `<button data-t="${v}" class="${S.settings.theme === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
          <div class="field"><label>Sons des manœuvres</label><div class="seg js-sound"><button data-v="1" class="${S.settings.sound !== false ? 'on' : ''}">Activés</button><button data-v="0" class="${S.settings.sound === false ? 'on' : ''}">Coupés</button></div></div>
          <div class="field"><label>Animations</label><div class="seg js-motion"><button data-v="1" class="${S.settings.motion !== false ? 'on' : ''}">Complètes</button><button data-v="0" class="${S.settings.motion === false ? 'on' : ''}">Réduites</button></div></div>
        </div>
        <div class="card"><p class="eyebrow">Sauvegarde</p><p class="muted">Ta progression reste sur cet appareil. Exporte-la pour la transférer.</p>
          <div class="row"><button class="btn js-exp">Exporter</button><label class="btn">Importer<input type="file" accept=".json,application/json" hidden class="js-imp"></label><button class="btn ghost js-rst">Tout effacer</button></div>
          <p class="eyebrow" style="margin-top:20px">Dernières activités</p><div class="log">${last.map(h => `${new Date(h.t).toLocaleDateString('fr-FR')} · +${h.xp} XP · ${esc(h.why)}`).join('<br>') || 'Aucune activité pour le moment.'}</div></div>
      </div>`;
    main.querySelector('.js-name').addEventListener('change', e => { S.name = e.target.value.trim(); AA.save(); });
    const seg = (sel, fn) => main.querySelectorAll(sel + ' button').forEach(b => b.addEventListener('click', () => { main.querySelectorAll(sel + ' button').forEach(x => x.classList.toggle('on', x === b)); fn(b); AA.save(); }));
    seg('.js-theme', b => { S.settings.theme = b.dataset.t; AA.applyTheme(); });
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
