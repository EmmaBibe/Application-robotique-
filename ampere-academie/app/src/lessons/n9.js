/* Niveau 9 « Maintenance & diagnostic » : méthode de dépannage sur folios en panne, mesures avancées
 * (index de polarisation, impédance de boucle, harmoniques), organisation de la maintenance
 * (types, AMDEC, MTBF / MTTR / disponibilité, stock de pièces).
 * Modèles (AA.N9), vérifiés par les tests :
 *  - IP (index de polarisation) = R10 min / R1 min ; DAR = R60 s / R30 s
 *  - boucle de défaut : Ik = U0 / Zs ; règle de mesure Zs(mesurée) ≤ 2/3 × U0 / Ia (IEC 60364-6, annexe C)
 *  - THD = √(Σ Vh², h ≥ 2) / V1
 *  - disponibilité A = MTBF / (MTBF + MTTR) ; série : A1 × A2 ; redondance : 1 − (1 − A1)(1 − A2)
 *  - criticité AMDEC C = G × O × D
 *  - point de commande = consommation × délai + stock de sécurité */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n), esc = AA.esc;
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const segB = (el, c, cb) => el.querySelectorAll(c + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(c + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
  const N = AA.N9 = {};

  /* ---------- Modèles ---------- */
  N.pi = (r1, r10) => r10 / r1;
  N.piVerdict = p => p < 1 ? 'dangereux' : p < 2 ? 'douteux' : p < 4 ? 'bon' : 'très bon';
  N.dar = (r30, r60) => r60 / r30;
  N.ik = (U0, Zs) => U0 / Zs;
  N.zsMax = (U0, Ia) => 2 / 3 * U0 / Ia;
  N.thd = hs => Math.sqrt(hs.slice(1).reduce((a, v) => a + v * v, 0)) / hs[0];
  N.avail = (mtbf, mttr) => mtbf / (mtbf + mttr);
  N.series = (a, b) => a * b;
  N.redund = (a, b) => 1 - (1 - a) * (1 - b);
  N.reorder = (conso, delai, secu) => conso * delai + secu;
  N.Rins = (t, R, q) => R * (1 - (1 - q) * Math.exp(-t / 240)); // modèle simple : absorption diélectrique, q = part « immédiate » (0 → isolant sain qui monte beaucoup, 1 → isolant humide qui ne monte pas)

  /* ---------- Index de polarisation ---------- */
  SIMS.pindex = el => {
    const st = { R: 2000, hum: 20 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('R', 'Résistance d\'isolement « finale » du bobinage', 5, 5000, 5, 2000, 'MΩ')}${sl('hum', 'Humidité / encrassement du bobinage', 0, 100, 1, 20, '%')}</div>
      <div class="simout"><div><span>R à 30 s / 60 s</span><b class="o-a"></b></div><div><span>DAR = R60 s / R30 s</span><b class="o-d"></b></div><div><span>R à 1 min / 10 min</span><b class="o-b"></b></div><div><span>IP = R10 min / R1 min</span><b class="o-p"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Essai sous tension continue (500 à 5 000 V selon la tension du moteur) pendant 10 minutes. Un isolant sain et sec se « polarise » : sa résistance apparente monte nettement avec le temps. Un isolant humide ou sale laisse passer un courant de fuite qui masque cet effet. Repères usuels (IEEE 43, guides des fabricants d'appareils) : IP < 1 dangereux, 1 à 2 douteux, 2 à 4 bon, > 4 très bon. Modèle d'absorption simplifié.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 190, (g, W, H) => {
      const q = 0.02 + 0.98 * st.hum / 100, Rf = st.R * (1 - 0.7 * st.hum / 100), R = t => N.Rins(t, Rf, q);
      const p = N.pi(R(60), R(600)), d = N.dar(R(30), R(60));
      el.querySelector('.o-a').textContent = AA.fmt(R(30), 0) + ' / ' + AA.fmt(R(60), 0) + ' MΩ'; el.querySelector('.o-d').textContent = AA.fmt(d, 2);
      el.querySelector('.o-b').textContent = AA.fmt(R(60), 0) + ' / ' + AA.fmt(R(600), 0) + ' MΩ'; el.querySelector('.o-p').textContent = AA.fmt(p, 2) + ' — ' + N.piVerdict(p);
      const x0 = 50, x1 = W - 14, y0 = H - 24, y1 = 14, X = t => x0 + t / 600 * (x1 - x0), Y = r => y0 - r / 5000 * (y0 - y1);
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI';
      [0, 1, 2, 4, 6, 8, 10].forEach(m => { g.beginPath(); g.moveTo(X(m * 60), y0); g.lineTo(X(m * 60), y1); g.stroke(); g.fillText(m + ' min', X(m * 60) - 10, y0 + 13); });
      [0, 2500, 5000].forEach(r => g.fillText(r + ' MΩ', 2, Y(r) + 4));
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath(); for (let t = 0; t <= 600; t += 5) { t ? g.lineTo(X(t), Y(R(t))) : g.moveTo(X(t), Y(R(t))); } g.stroke();
      [[60, '1 min'], [600, '10 min']].forEach(([t]) => { g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(t), Y(R(t)), 5, 0, 7); g.fill(); });
    });
    return cv.stop;
  };

  /* ---------- Impédance de boucle de défaut (TN) ---------- */
  SIMS.zloop = el => {
    const st = { Zs: 0.9, In: 16 }; let curve = 'C';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('Zs', 'Impédance de boucle mesurée Z<sub>s</sub>', 0.1, 5, 0.05, 0.9, 'Ω')}${sl('In', 'Calibre du disjoncteur', 6, 63, 1, 16, 'A')}<div class="seg js-c"><button data-v="B">Courbe B</button><button data-v="C" class="on">Courbe C</button><button data-v="D">Courbe D</button></div></div>
      <div class="simout"><div><span>Courant de défaut présumé I<sub>k</sub> = U<sub>0</sub> / Z<sub>s</sub></span><b class="o-k"></b></div><div><span>Déclenchement magnétique garanti à I<sub>a</sub></span><b class="o-a"></b></div><div><span>Z<sub>s</sub> maximale mesurable = 2/3 × U<sub>0</sub> / I<sub>a</sub></span><b class="o-z"></b></div></div>
      <p class="js-v" style="padding:0 16px 8px;font-size:14px"></p><p class="muted" style="padding:0 16px 14px;font-size:12.5px">Réseau TN 230 V. Le coefficient 2/3 (IEC 60364-6, annexe C) tient compte de l'échauffement des conducteurs pendant un défaut réel : la mesure est faite à froid, avec un faible courant.</p></div>`;
    bind(el, st, { Zs: v => AA.fmt(v, 2) });
    segB(el, '.js-c', v => { curve = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W, H, t) => {
      const k = { B: 5, C: 10, D: 20 }[curve], Ia = k * st.In, Ik = N.ik(230, st.Zs), zmax = N.zsMax(230, Ia), ok = st.Zs <= zmax;
      el.querySelector('.o-k').textContent = AA.fmt(Ik, 0) + ' A'; el.querySelector('.o-a').textContent = AA.fmt(Ia, 0) + ' A (' + k + ' × I_n)'; el.querySelector('.o-z').textContent = AA.fmt(zmax, 2) + ' Ω';
      el.querySelector('.js-v').innerHTML = ok ? '<span class="ok-t">Conforme : le disjoncteur coupera le défaut en magnétique, en moins de 0,4 s.</span>' : '<span class="bad-t">Non conforme : la boucle est trop impédante, le défaut ne serait pas coupé à temps. Causes : section trop faible, longueur excessive, mauvaise connexion du PE. Solutions : réduire Z<sub>s</sub>, courbe B, ou différentiel.</span>';
      g.strokeStyle = ok ? css('--ok') : css('--bad'); g.lineWidth = 3; g.setLineDash([8, 6]); g.lineDashOffset = -t * 40; g.strokeRect(40, 30, W - 80, H - 60); g.setLineDash([]);
      g.fillStyle = css('--ink-3'); g.font = '600 11px Segoe UI'; g.fillText('transformateur → phase → défaut → PE → retour au neutre du transformateur', 50, 24);
    });
    return cv.stop;
  };

  /* ---------- Harmoniques ---------- */
  SIMS.harm = el => {
    const st = { h3: 30, h5: 20, h7: 10 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('h3', 'Harmonique 3 (150 Hz)', 0, 90, 1, 30, '%')}${sl('h5', 'Harmonique 5 (250 Hz)', 0, 60, 1, 20, '%')}${sl('h7', 'Harmonique 7 (350 Hz)', 0, 40, 1, 10, '%')}</div>
      <div class="simout"><div><span>THD du courant de phase</span><b class="o-t"></b></div><div><span>Valeur efficace / fondamental</span><b class="o-r"></b></div><div><span>Courant de neutre (charges équilibrées) / courant de phase</span><b class="o-n"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Les charges électroniques (alimentations à découpage, éclairage LED, variateurs) absorbent un courant déformé. Les harmoniques de rang 3 (et multiples de 3) des trois phases sont en phase entre eux : ils s'additionnent dans le neutre au lieu de s'annuler. Le neutre peut alors être plus chargé que les phases.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const hs = [1, 0, st.h3 / 100, 0, st.h5 / 100, 0, st.h7 / 100], thd = N.thd([1, st.h3 / 100, st.h5 / 100, st.h7 / 100]), rms = Math.sqrt(1 + thd * thd), In = 3 * st.h3 / 100 / rms;
      el.querySelector('.o-t').textContent = AA.fmt(thd * 100, 1) + ' %'; el.querySelector('.o-r').textContent = AA.fmt(rms, 3); el.querySelector('.o-n').textContent = AA.fmt(In * 100, 0) + ' %';
      const x0 = 10, x1 = W - 10, yc = H / 2, A = H * 0.26;
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, yc); g.lineTo(x1, yc); g.stroke();
      g.strokeStyle = css('--line-2'); g.lineWidth = 1.4; g.beginPath(); for (let x = x0; x <= x1; x++) { const a = (x - x0) / (x1 - x0) * 4 * Math.PI, y = yc - A * Math.sin(a); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.6; g.beginPath(); for (let x = x0; x <= x1; x++) { const a = (x - x0) / (x1 - x0) * 4 * Math.PI; let v = 0; hs.forEach((h, k) => { if (h) v += h * Math.sin((k + 1) * a); }); const y = yc - A * v; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      const bx = W - 150; [1, st.h3 / 100, st.h5 / 100, st.h7 / 100].forEach((v, k) => { g.fillStyle = k ? css('--warn') : css('--teal'); g.fillRect(bx + k * 32, H - 14 - v * 60, 22, v * 60); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText(['1', '3', '5', '7'][k], bx + 8 + k * 32, H - 2); });
    });
    return cv.stop;
  };

  /* ---------- AMDEC ---------- */
  const MODES = [['Roulement du moteur de convoyeur', 'Usure, manque de graisse', 7, 5, 4], ['Contacteur KM1', 'Contacts soudés', 8, 3, 6], ['Capteur de présence B3', 'Encrassement', 4, 7, 3], ['Ventilateur d\'armoire', 'Arrêt, colmatage du filtre', 6, 4, 7], ['Câble du codeur', 'Rupture par flexion', 7, 4, 5]];
  SIMS.amdec = el => {
    const rows = MODES.map(m => ({ n: m[0], f: m[1], G: m[2], O: m[3], D: m[4] })); const st = { seuil: 150 };
    const render = () => {
      const sorted = rows.map((r, i) => ({ r, i, C: r.G * r.O * r.D })).sort((a, b) => b.C - a.C);
      el.innerHTML = `<div class="simcard"><div class="amdec-wrap"><table class="amdec"><thead><tr><th>Élément</th><th>Mode de défaillance</th><th>G</th><th>O</th><th>D</th><th>C = G × O × D</th></tr></thead><tbody>${sorted.map(({ r, i, C }) => `<tr class="${C >= st.seuil ? 'crit' : ''}"><td>${esc(r.n)}</td><td>${esc(r.f)}</td>${['G', 'O', 'D'].map(k => `<td><input type="number" min="1" max="10" value="${r[k]}" data-i="${i}" data-k="${k}"></td>`).join('')}<td><b>${C}</b></td></tr>`).join('')}</tbody></table></div>
        <div class="simctl">${sl('seuil', 'Seuil de criticité (actions obligatoires au-delà)', 20, 400, 10, st.seuil, '')}</div>
        <p class="muted" style="padding:0 16px 14px;font-size:12.5px">G : gravité, O : occurrence (fréquence), D : non-détection (10 = la défaillance n'est pas détectée avant qu'elle produise ses effets). Échelles de 1 à 10 définies par l'entreprise. Les lignes au-dessus du seuil (en rouge) appellent une action : maintenance préventive, surveillance, modification. Change une note : le classement se met à jour.</p></div>`;
      el.querySelectorAll('input[type=number]').forEach(inp => inp.onchange = () => { const v = Math.max(1, Math.min(10, Math.round(+inp.value || 1))); rows[+inp.dataset.i][inp.dataset.k] = v; render(); });
      const r = el.querySelector('.sl input'); r.oninput = () => { st.seuil = +r.value; render(); };
      el.querySelector('.sl b').textContent = st.seuil;
    };
    render();
  };

  /* ---------- Disponibilité ---------- */
  SIMS.dispo = el => {
    const st = { mtbf: 800, mttr: 4 }; let arch = 'single';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('mtbf', 'MTBF (temps moyen entre pannes)', 10, 5000, 10, 800, 'h')}${sl('mttr', 'MTTR (temps moyen de réparation)', 0.5, 48, 0.5, 4, 'h')}<div class="seg js-a"><button data-v="single" class="on">Une pompe</button><button data-v="series">Deux équipements en série</button><button data-v="red">Deux pompes en redondance</button></div></div>
      <div class="simout"><div><span>Disponibilité d'un équipement A = MTBF / (MTBF + MTTR)</span><b class="o-a"></b></div><div><span>Disponibilité du système</span><b class="o-s"></b></div><div><span>Indisponibilité sur une année (8 760 h)</span><b class="o-h"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Hypothèse : pannes indépendantes, équipements identiques, redondance où une seule pompe suffit et chacune peut être réparée pendant que l'autre fonctionne.</p></div>`;
    bind(el, st, { mttr: v => AA.fmt(v, 1) });
    segB(el, '.js-a', v => { arch = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 110, (g, W, H, t) => {
      const A = N.avail(st.mtbf, st.mttr), S = arch === 'single' ? A : arch === 'series' ? N.series(A, A) : N.redund(A, A), hrs = (1 - S) * 8760;
      el.querySelector('.o-a').textContent = AA.fmt(A * 100, 3) + ' %'; el.querySelector('.o-s').textContent = AA.fmt(S * 100, arch === 'red' ? 5 : 3) + ' %'; el.querySelector('.o-h').textContent = hrs >= 1 ? AA.fmt(hrs, 1) + ' h' : AA.fmt(hrs * 60, 1) + ' min';
      const box = (x, y, lbl) => { g.fillStyle = css('--surface-3'); g.strokeStyle = css('--line-2'); g.fillRect(x, y, 70, 30); g.strokeRect(x, y, 70, 30); g.fillStyle = css('--ink'); g.font = '600 11px Segoe UI'; g.fillText(lbl, x + 10, y + 19); };
      g.strokeStyle = css('--copper'); g.lineWidth = 2;
      if (arch === 'single') { g.beginPath(); g.moveTo(20, H / 2); g.lineTo(W - 20, H / 2); g.stroke(); box(W / 2 - 35, H / 2 - 15, 'Pompe'); }
      else if (arch === 'series') { g.beginPath(); g.moveTo(20, H / 2); g.lineTo(W - 20, H / 2); g.stroke(); box(W / 3 - 35, H / 2 - 15, 'Pompe'); box(2 * W / 3 - 35, H / 2 - 15, 'Vanne'); }
      else { g.beginPath(); g.moveTo(20, H / 2); g.lineTo(W / 2 - 80, H / 2); g.moveTo(W / 2 - 80, 25); g.lineTo(W / 2 - 80, H - 25); g.moveTo(W / 2 + 80, 25); g.lineTo(W / 2 + 80, H - 25); g.moveTo(W / 2 + 80, H / 2); g.lineTo(W - 20, H / 2); g.moveTo(W / 2 - 80, 25); g.lineTo(W / 2 + 80, 25); g.moveTo(W / 2 - 80, H - 25); g.lineTo(W / 2 + 80, H - 25); g.stroke(); box(W / 2 - 35, 10, 'Pompe A'); box(W / 2 - 35, H - 40, 'Pompe B'); }
    });
    return cv.stop;
  };

  /* ---------- Stock de pièces de rechange ---------- */
  SIMS.stock = el => {
    const st = { c: 4, d: 3, s: 5, q: 20 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('c', 'Consommation moyenne', 0.5, 20, 0.5, 4, 'pièces / semaine')}${sl('d', 'Délai de livraison du fournisseur', 0.5, 12, 0.5, 3, 'semaines')}${sl('s', 'Stock de sécurité', 0, 40, 1, 5, 'pièces')}${sl('q', 'Quantité commandée à chaque fois', 2, 80, 1, 20, 'pièces')}</div>
      <div class="simout"><div><span>Point de commande = consommation × délai + sécurité</span><b class="o-p"></b></div><div><span>Commandes par an</span><b class="o-n"></b></div><div><span>Stock moyen ≈ sécurité + quantité / 2</span><b class="o-m"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Quand le stock atteint le point de commande, on commande ; la livraison arrive après le délai. Le stock de sécurité couvre les consommations plus fortes que prévu ou les retards. Les pièces critiques et longues à obtenir (cartes électroniques, moteurs spéciaux) justifient un stock même sans consommation régulière.</p></div>`;
    bind(el, st, { c: v => AA.fmt(v, 1), d: v => AA.fmt(v, 1) });
    const cv = AA.canvas(el.querySelector('.simview'), 170, (g, W, H) => {
      const rp = N.reorder(st.c, st.d, st.s);
      el.querySelector('.o-p').textContent = AA.fmt(rp, 1) + ' pièces'; el.querySelector('.o-n').textContent = AA.fmt(52 * st.c / st.q, 1); el.querySelector('.o-m').textContent = AA.fmt(st.s + st.q / 2, 1) + ' pièces';
      const max = st.s + st.q + rp + 5, X = w => 30 + w / 26 * (W - 40), Y = v => H - 16 - v / max * (H - 30);
      let s = st.s + st.q, pend = null, pts = [[0, s]];
      for (let w = 0; w <= 26; w += 0.05) { s -= st.c * 0.05; if (pend != null && w >= pend) { s += st.q; pend = null; } if (pend == null && s <= rp) pend = w + st.d; pts.push([w, s]); }
      g.strokeStyle = css('--bad'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(30, Y(rp)); g.lineTo(W - 10, Y(rp)); g.stroke(); g.strokeStyle = css('--warn'); g.beginPath(); g.moveTo(30, Y(st.s)); g.lineTo(W - 10, Y(st.s)); g.stroke(); g.setLineDash([]);
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(30, Y(0)); g.lineTo(W - 10, Y(0)); g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath(); pts.forEach(([w, v], i) => i ? g.lineTo(X(w), Y(v)) : g.moveTo(X(w), Y(v))); g.stroke();
      const rupt = pts.some(p => p[1] < 0); g.fillStyle = rupt ? css('--bad') : css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(rupt ? 'RUPTURE DE STOCK : augmenter le point de commande ou la quantité' : 'stock sur 26 semaines — rouge : point de commande, orange : sécurité', 34, 14);
    });
    return cv.stop;
  };

  /* ---------- Choix et ordres ---------- */
  const SYMP = { title: 'Recueillir les symptômes : quelles questions poser ?', items: [['quand', 'Depuis quand ? À quel moment du cycle ?', ''], ['chg', 'Qu\'est-ce qui a changé récemment (intervention, réglage, météo) ?', ''], ['freq', 'Permanent, intermittent, aléatoire ?', ''], ['voir', 'Voyants, messages d\'erreur, bruits, odeurs observés ?', ''], ['tout', 'Remplacer d\'emblée les pièces les plus probables', ''], ['dem', 'Démonter pour voir', ''], ['qui', 'Qui a constaté, dans quelles conditions ?', '']],
    cases: [{ q: 'Un opérateur appelle : « la machine s\'arrête toute seule ». Que fais-tu avant de prendre un outil ?', need: ['quand', 'chg', 'freq', 'voir', 'qui'], no: ['tout', 'dem'], why: 'Les symptômes précis orientent le diagnostic : un défaut qui apparaît à chaud, après un nettoyage ou à un moment précis du cycle désigne déjà quelques suspects.' }] };
  const TYPES = { title: 'Quel type de maintenance ?', items: [['corr', 'Corrective', 'après la panne'], ['syst', 'Préventive systématique', 'à intervalles fixes'], ['cond', 'Préventive conditionnelle', 'selon une mesure'], ['pred', 'Prévisionnelle (prédictive)', 'selon une tendance']],
    cases: [
      { q: 'On remplace les filtres des ventilateurs d\'armoire tous les 6 mois.', need: ['syst'], no: ['corr', 'cond', 'pred'], why: 'Intervalle fixe, quel que soit l\'état : préventive systématique.' },
      { q: 'On graisse un roulement quand la mesure de vibration dépasse un seuil.', need: ['cond'], no: ['corr', 'syst', 'pred'], why: 'L\'intervention est déclenchée par l\'état mesuré : préventive conditionnelle.' },
      { q: 'L\'analyse de l\'évolution de la température d\'un moteur prévoit sa défaillance dans 3 semaines : on planifie l\'intervention.', need: ['pred'], no: ['corr', 'syst'], why: 'On extrapole une tendance pour estimer la date de défaillance : maintenance prévisionnelle.' },
      { q: 'Une ampoule de voyant non critique est changée quand elle grille.', need: ['corr'], no: ['syst', 'pred'], why: 'Corrective, acceptable quand la défaillance est sans gravité et peu coûteuse.' }
    ] };
  SIMS.symptomes = el => SIMS.choose(el, SYMP);
  SIMS.mtypes = el => SIMS.choose(el, TYPES);
  Object.assign(AA.VISDATA.ORDER, {
    remise: { title: 'Après la réparation : remets les étapes dans l\'ordre', steps: [['Vérifier la réparation hors tension (serrages, continuité, isolement)', 'On ne remet pas sous tension une installation non contrôlée.'], ['Retirer le matériel, les outils et les dispositifs de mise à la terre', 'Rien ne doit rester dans l\'armoire.'], ['Déconsigner selon la procédure et prévenir les personnes concernées', 'La personne qui a consigné ou le chargé de consignation déconsigne.'], ['Essais de fonctionnement avec l\'opérateur', 'On vérifie que le symptôme initial a disparu.'], ['Rédiger le compte rendu : symptôme, cause, action, pièces, temps', 'Il alimente l\'historique et la GMAO.'], ['Rechercher la cause profonde pour éviter la récidive', 'Pourquoi le composant a-t-il lâché ? Échauffement, vibration, sous-dimensionnement…']] }
  });

  Object.assign(AA.SIMFORM, {
    pindex: ['IP = R<sub>10 min</sub> / R<sub>1 min</sub>', 'DAR = R<sub>60 s</sub> / R<sub>30 s</sub>'],
    zloop: ['I<sub>k</sub> = U<sub>0</sub> / Z<sub>s</sub>', 'Condition : Z<sub>s mesurée</sub> ≤ 2/3 × U<sub>0</sub> / I<sub>a</sub>'],
    harm: ['THD = √(I<sub>3</sub>² + I<sub>5</sub>² + I<sub>7</sub>² + …) / I<sub>1</sub>', 'I<sub>eff</sub> = I<sub>1</sub> × √(1 + THD²)', 'Neutre (charges équilibrées) : I<sub>N</sub> = 3 × I<sub>3</sub> (et multiples de 3)'],
    amdec: ['Criticité C = G × O × D'],
    dispo: ['A = MTBF / (MTBF + MTTR)', 'Série : A = A<sub>1</sub> × A<sub>2</sub>', 'Redondance : A = 1 − (1 − A<sub>1</sub>)(1 − A<sub>2</sub>)'],
    stock: ['Point de commande = consommation × délai + stock de sécurité']
  });

  /* ================= Leçons ================= */
  L.n9m1l1 = { min: 9, why: "Un bon diagnostic commence avant d'ouvrir l'armoire : la moitié de la panne est dans les symptômes.", screens: [[
    { h: 'Recueillir les symptômes' },
    { list: ['Écouter l\'opérateur, faire reproduire le défaut si c\'est sans danger.', 'Noter : quoi, quand, depuis quand, à quelle fréquence, ce qui a changé.', 'Lire les voyants, l\'IHM, l\'historique des alarmes, le diagnostic de l\'automate et du variateur.', 'Ne rien modifier avant d\'avoir compris : un réglage changé « pour voir » efface les indices.'] }
  ]] };
  L.n9m1l2 = { min: 12, why: "Le schéma réduit les suspects : on raisonne avant de mesurer.", screens: [[
    { h: 'Raisonner sur le schéma' },
    { p: "Symptôme : le moteur tourne tant qu'on appuie sur Marche, et s'arrête dès qu'on relâche. Sur le schéma, quels éléments interviennent seulement après le relâchement du bouton ? Essaie, observe, puis conclus." },
    { circuit: 'dol', fault: { id: 'KM1.13', f: 'open' }, meter: true, tasks: [
      { t: 'Ferme le disjoncteur Q1 et appuie sur Marche (S2) : observe', ok: (s, v) => v.lastAct === 'S2' },
      { t: 'Fais une mesure de tension dans le circuit de commande', ok: (s, v) => v.measures >= 1 }
    ] },
    { quiz: { q: 'Quel élément est le plus probablement défaillant ?', opts: ['Le bouton Arrêt S1', 'Le contact d\'auto-maintien KM1 13-14', 'Le relais thermique F2', 'La bobine de KM1'], a: 1, why: 'Le moteur démarre : la bobine, S1 et F2 fonctionnent. Il s\'arrête au relâchement de S2 : l\'auto-maintien (13-14, en parallèle sur S2) ne ferme pas.' } }
  ]] };
  L.n9m1l3 = { min: 12, why: "La méthode du voltmètre localise un contact ouvert en quelques mesures, sous tension, en sécurité.", screens: [[
    { h: 'Mesures sous tension : méthode du voltmètre' },
    { p: "Aux bornes d'un contact fermé, on mesure environ 0 V ; aux bornes d'un contact ouvert dans un circuit alimenté, on retrouve presque toute la tension. On suit le circuit de commande élément par élément : la tension « saute » sur l'élément ouvert. Habilitation et équipements de protection obligatoires." },
    { circuit: 'dol', fault: { id: 'F2.95', f: 'open' }, meter: true, tasks: [
      { t: 'Ferme Q1 et appuie sur Marche : rien ne se passe', ok: (s, v) => v.lastAct === 'S2' },
      { t: 'Trouve, au multimètre, un élément aux bornes duquel tu mesures presque toute la tension (plus de 200 V)', ok: (s, v) => v.lastV && v.lastV.value > 200 }
    ] },
    { quiz: { q: 'La tension se retrouve aux bornes du contact 95-96 du relais thermique F2. Que fais-tu ?', opts: ['Je remplace le contacteur', 'Je ponte le contact pour redémarrer', 'Je vérifie si le relais a déclenché (surcharge) avant tout, puis l\'état du contact', 'Je change le bouton Marche'], a: 2, why: 'Un 95-96 ouvert signifie souvent un déclenchement thermique : il faut en chercher la cause (surcharge, blocage, réglage). Ponter une protection est interdit.' } }
  ]] };
  L.n9m1l4 = { min: 11, why: "Hors tension, l'ohmmètre et le mégohmmètre confirment le diagnostic sans risque.", screens: [[
    { h: 'Mesures hors tension : continuité et isolement' },
    { list: ['Consigner, vérifier l\'absence de tension, puis mesurer.', 'Continuité : un contact fermé ou un fil sain ≈ 0 Ω ; une bobine de contacteur : de quelques ohms à quelques centaines d\'ohms selon le modèle ; « OL » = circuit ouvert.', 'Isolement au mégohmmètre : déconnecter l\'électronique (variateurs, automates, cartes) qui serait détruite par la tension d\'essai.'] },
    { circuit: 'dol', fault: { id: 'KM1', f: 'open' }, meter: true, tasks: [
      { t: 'Constate le symptôme sous tension (appuie sur Marche)', ok: (s, v) => v.lastAct === 'S2' },
      { t: 'Ouvre Q1, puis mesure la résistance d\'un élément (multimètre en Ω)', ok: (s, v) => !s.byId.Q1.st.on && v.measures >= 1 }
    ] },
    { quiz: { q: 'Hors tension, l\'ohmmètre affiche « OL » aux bornes A1-A2 de la bobine de KM1. Conclusion ?', opts: ['La bobine est en bon état', 'La bobine est coupée : elle ne peut plus attirer le contacteur', 'Le multimètre est mal réglé', 'Le contacteur est soudé'], a: 1, why: '« OL » signifie une résistance infinie : l\'enroulement est interrompu.' } }
  ]] };
  L.n9m1l5 = { min: 9, why: "Une panne réparée sans compte rendu reviendra, et le prochain dépanneur repartira de zéro.", screens: [[
    { h: 'Remettre en service et rendre compte' },
    { p: "La réparation n'est finie que lorsque l'installation est remise en service en sécurité, que l'opérateur a validé le fonctionnement et que le compte rendu est rédigé. La recherche de la cause profonde (méthode des « 5 pourquoi », analyse de l'historique) évite la récidive." }
  ]] };
  L.n9m2l1 = { min: 11, why: "L'évolution de l'isolement d'un moteur annonce sa panne des mois à l'avance.", screens: [[
    { h: 'Mesure d\'isolement (mégohmmètre)' },
    { p: "Une mesure ponctuelle de résistance d'isolement dépend de la température et de l'humidité. Pour les machines tournantes, on la complète par des rapports qui annulent en partie ces effets : l'index de polarisation (IP) et le rapport d'absorption diélectrique (DAR). C'est surtout leur évolution d'une année sur l'autre qui compte." },
    { num: { id: 'ip', gen: r => { const r1 = r.pick([150, 400, 800, 1200]), k = r.pick([1.3, 2.5, 3.2, 4.5]); const r10 = Math.round(r1 * k); return { q: `Moteur : <b>${r1} MΩ</b> après 1 minute, <b>${r10} MΩ</b> après 10 minutes. Index de polarisation ?`, a: r10 / r1, unit: '', tol: 0.01, sol: `IP = ${r10} / ${r1} = ${AA.fmt(r10 / r1, 2)} → ${N.piVerdict(r10 / r1)}` }; } } }
  ]] };
  L.n9m2l2 = { min: 11, why: "Mesurer la boucle de défaut, c'est vérifier en vrai que la protection des personnes fonctionnera.", screens: [[
    { h: 'Mesure de terre et de boucle' },
    { list: ['<b>TT</b> : mesure de la prise de terre (méthode des piquets ou boucle phase-terre) ; condition R<sub>A</sub> × I<sub>Δn</sub> ≤ 50 V.', '<b>TN</b> : mesure de l\'impédance de boucle de défaut Z<sub>s</sub> (phase-PE) avec un contrôleur d\'installation ; on vérifie que le courant de défaut fera déclencher la protection à temps.'] },
    { num: { id: 'zs', gen: r => { const In = r.pick([10, 16, 20, 32]), k = r.pick([5, 10]); const z = N.zsMax(230, k * In); return { q: `Disjoncteur courbe <b>${k === 5 ? 'B' : 'C'}</b>, <b>${In} A</b> (déclenchement garanti à ${k} I<sub>n</sub>), réseau TN 230 V. Impédance de boucle maximale mesurée admissible ?`, a: z, unit: 'Ω', tol: 0.01, sol: `Z_s ≤ 2/3 × 230 / (${k} × ${In}) = ${AA.fmt(z, 3)} Ω` }; } } }
  ]] };
  L.n9m2l3 = { min: 11, why: "Les harmoniques échauffent les neutres, les transformateurs et font déclencher des protections sans raison apparente.", screens: [[
    { h: 'Analyse de réseau et harmoniques' },
    { list: ['Un analyseur de réseau mesure tensions, courants, puissances, facteur de puissance, harmoniques (rang par rang), creux et coupures, sur plusieurs jours.', 'Indicateur principal : le taux de distorsion harmonique (THD).', 'Effets : neutre surchargé (harmoniques de rang 3), échauffement des transformateurs et moteurs, condensateurs de compensation en résonance.', 'Remèdes : neutre de section suffisante, selfs, filtres passifs ou actifs, variateurs à faible taux d\'harmoniques.'] },
    { num: { id: 'thd', gen: r => { const a = r.pick([20, 30, 40]), b = r.pick([10, 15, 25]), c = r.pick([5, 8, 10]); const t = N.thd([1, a / 100, b / 100, c / 100]) * 100; return { q: `Courant : harmonique 3 = <b>${a} %</b>, harmonique 5 = <b>${b} %</b>, harmonique 7 = <b>${c} %</b> du fondamental (les autres négligeables). THD ?`, a: t, unit: '%', tol: 0.01, sol: `THD = √(${a}² + ${b}² + ${c}²) = ${AA.fmt(t, 1)} %` }; } } }
  ]] };
  L.n9m2l4 = { min: 9, why: "La caméra thermique voit une connexion desserrée avant qu'elle ne brûle.", screens: [[
    { h: 'Thermographie infrarouge' },
    { list: ['Inspection en charge (idéalement au moins 40 % de la charge nominale), armoire ouverte par une personne habilitée, avec les protections adaptées.', 'On compare des éléments semblables (trois phases d\'un même départ) : un écart de température signale un défaut.', 'Les surfaces métalliques brillantes réfléchissent : régler l\'émissivité, viser une partie peinte ou un ruban adhésif mat.'] }
  ]] };
  L.n9m3l1 = { min: 9, why: "Choisir le bon type de maintenance pour chaque équipement, c'est éviter à la fois les pannes et les interventions inutiles.", screens: [[
    { h: 'Corrective, préventive, conditionnelle, prédictive' },
    { table: { head: ['Type', 'Déclenchement', 'Exemple'], rows: [['Corrective', 'Après la défaillance', 'Changer un voyant grillé'], ['Préventive systématique', 'Échéance fixe (temps, nombre de cycles)', 'Filtres tous les 6 mois'], ['Préventive conditionnelle', 'Dépassement d\'un seuil mesuré', 'Vibrations, température, isolement'], ['Prévisionnelle', 'Extrapolation d\'une tendance', 'Prévoir la date de défaillance d\'un roulement']] } }
  ]] };
  L.n9m3l2 = { min: 11, why: "L'AMDEC fait la liste de ce qui peut casser avant que ça casse, et dit où agir en premier.", screens: [[
    { h: 'AMDEC' },
    { p: "Analyse des modes de défaillance, de leurs effets et de leur criticité : pour chaque élément, on liste les façons dont il peut défaillir, leurs causes et effets, puis on note gravité, occurrence et non-détection. Le produit des trois notes classe les risques ; on agit d'abord sur les plus critiques, puis on refait la cotation après action." }
  ]] };
  L.n9m3l3 = { min: 11, why: "Disponibilité, MTBF, MTTR : les chiffres qui permettent de justifier une redondance ou un stock.", screens: [[
    { h: 'Indicateurs : MTBF, MTTR, disponibilité' },
    { list: ['<b>MTBF</b> : temps moyen de bon fonctionnement entre deux défaillances.', '<b>MTTR</b> : temps moyen de remise en service (diagnostic + attente des pièces + réparation + essais).', '<b>Disponibilité</b> = MTBF / (MTBF + MTTR). Pour l\'améliorer : moins de pannes (MTBF ↑) ou réparations plus rapides (MTTR ↓ : pièces en stock, documentation, formation).'] },
    { num: { id: 'av', gen: r => { const m = r.pick([200, 500, 1000, 2000]), t = r.pick([2, 4, 8, 12]); return { q: `MTBF = <b>${m} h</b>, MTTR = <b>${t} h</b>. Disponibilité ?`, a: N.avail(m, t) * 100, unit: '%', tol: 0.0005, sol: `A = ${m} / (${m} + ${t}) = ${AA.fmt(N.avail(m, t) * 100, 3)} %` }; } } }
  ]] };
  L.n9m3l4 = { min: 9, why: "Une pièce manquante transforme une panne d'une heure en arrêt d'une semaine.", screens: [[
    { h: 'GMAO et pièces de rechange' },
    { list: ['La GMAO (gestion de maintenance assistée par ordinateur) centralise les équipements, l\'historique des interventions, le préventif planifié, les stocks et les coûts.', 'Chaque intervention est saisie : c\'est la source des MTBF, MTTR et des analyses de pannes répétitives.', 'Stock : point de commande, stock de sécurité, pièces critiques identifiées grâce à l\'AMDEC.'] },
    { num: { id: 'pc', gen: r => { const c = r.pick([2, 3, 5, 8]), d = r.pick([2, 4, 6]), s = r.pick([2, 4, 6]); return { q: `Consommation <b>${c} pièces/semaine</b>, délai de livraison <b>${d} semaines</b>, stock de sécurité <b>${s} pièces</b>. Point de commande ?`, a: N.reorder(c, d, s), unit: 'pièces', tol: 0.001, sol: `${c} × ${d} + ${s} = ${N.reorder(c, d, s)} pièces` }; } } }
  ]] };

  Object.assign(AA.VISMAP, {
    n9m1l1: [{ sim: 'symptomes' }], n9m1l5: [{ order: 'remise' }],
    n9m2l1: [{ sim: 'pindex' }], n9m2l2: [{ sim: 'zloop' }], n9m2l3: [{ sim: 'harm' }], n9m2l4: [{ sim: 'thermocam' }],
    n9m3l1: [{ sim: 'mtypes' }], n9m3l2: [{ sim: 'amdec' }], n9m3l3: [{ sim: 'dispo' }], n9m3l4: [{ sim: 'stock' }]
  });
})();
