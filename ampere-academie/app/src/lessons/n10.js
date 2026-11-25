/* Niveau 10 « Ingénierie électrique » : sécurité des machines, réseaux HTA, énergie, conduite de projet.
 * Modèles (AA.N10), vérifiés par les tests :
 *  - graphe de risque ISO 13849-1 (annexe A) : S1F1P1 → a, S1F1P2 / S1F2P1 → b, S1F2P2 / S2F1P1 → c, S2F1P2 / S2F2P1 → d, S2F2P2 → e
 *  - plages de PFHD : PL a [1e-5 ; 1e-4[, b [3e-6 ; 1e-5[, c [1e-6 ; 3e-6[, d [1e-7 ; 1e-6[, e [1e-8 ; 1e-7[ ;
 *    SIL 1 [1e-6 ; 1e-5[, SIL 2 [1e-7 ; 1e-6[, SIL 3 [1e-8 ; 1e-7[ ; PFH d'une fonction ≈ somme des PFH des sous-systèmes
 *  - relais à maximum de courant à temps inverse (IEC 60255-151) : t = TMS × k / ((I/Is)^α − 1)
 *    normalement inverse k = 0,14, α = 0,02 ; très inverse 13,5 ; 1 ; extrêmement inverse 80 ; 2
 *  - lois de similitude d'une pompe centrifuge (sans hauteur statique) : P ∝ n³
 *  - méthode du chemin critique (dates au plus tôt / au plus tard, marge totale) */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n), esc = AA.esc;
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const segB = (el, c, cb) => el.querySelectorAll(c + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(c + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
  const sci = x => { const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return AA.fmt(m, 2) + ' × 10' + String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); };
  const N = AA.N10 = {};

  /* ---------- Modèles ---------- */
  N.plr = (S, F, P) => 'abcde'[(S - 1) * 2 + (F - 1) + (P - 1)];
  N.plFromPFH = p => p < 1e-8 ? 'au-delà de e' : p < 1e-7 ? 'e' : p < 1e-6 ? 'd' : p < 3e-6 ? 'c' : p < 1e-5 ? 'b' : p < 1e-4 ? 'a' : 'aucun';
  N.silFromPFH = p => p < 1e-8 ? 'au-delà de SIL 3' : p < 1e-7 ? 'SIL 3' : p < 1e-6 ? 'SIL 2' : p < 1e-5 ? 'SIL 1' : 'aucun SIL';
  N.IDMT = { SI: [0.14, 0.02, 'Normalement inverse'], VI: [13.5, 1, 'Très inverse'], EI: [80, 2, 'Extrêmement inverse'] };
  N.idmt = (curve, I, Is, tms) => { const [k, a] = N.IDMT[curve], M = I / Is; return M <= 1 ? Infinity : tms * k / (Math.pow(M, a) - 1); };
  N.cpm = tasks => { // tasks : [{id, d, dep: [ids]}] dans un ordre compatible
    const es = {}, ef = {}, ls = {}, lf = {}, by = {}; tasks.forEach(t => { by[t.id] = t; });
    tasks.forEach(t => { es[t.id] = t.dep.length ? Math.max(...t.dep.map(d => ef[d])) : 0; ef[t.id] = es[t.id] + t.d; });
    const end = Math.max(...tasks.map(t => ef[t.id]));
    [...tasks].reverse().forEach(t => { const succ = tasks.filter(s => s.dep.includes(t.id)); lf[t.id] = succ.length ? Math.min(...succ.map(s => ls[s.id])) : end; ls[t.id] = lf[t.id] - t.d; });
    return { end, es, ef, ls, lf, crit: tasks.filter(t => ls[t.id] - es[t.id] < 1e-9).map(t => t.id), slack: Object.fromEntries(tasks.map(t => [t.id, ls[t.id] - es[t.id]])) };
  };
  N.pumpP = (Pn, ratio) => Pn * Math.pow(ratio, 3);
  N.saving = (P, h, e1, e2, price) => P * h * (1 / e1 - 1 / e2) * price; // P : puissance utile en kW

  /* ---------- Graphe de risque ISO 13849-1 ---------- */
  SIMS.riskgraph = el => {
    let S = 2, F = 1, P = 2;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div><p class="eyebrow">S · gravité de la blessure</p><div class="seg js-s"><button data-v="1">S1 légère (réversible)</button><button data-v="2" class="on">S2 grave (irréversible, décès)</button></div></div>
      <div><p class="eyebrow">F · fréquence ou durée d'exposition</p><div class="seg js-f"><button data-v="1" class="on">F1 rare ou courte</button><button data-v="2">F2 fréquente ou longue</button></div></div>
      <div><p class="eyebrow">P · possibilité d'éviter le dommage</p><div class="seg js-p"><button data-v="1">P1 possible sous conditions</button><button data-v="2" class="on">P2 à peine possible</button></div></div></div>
      <div class="simview"></div><p class="muted" style="padding:0 16px 14px;font-size:12.5px">Le graphe donne le niveau de performance requis PL<sub>r</sub> de la fonction de sécurité, de a (le plus faible) à e (le plus exigeant). Les critères précis (par exemple la durée d'exposition qui distingue F1 de F2, ou la prise en compte de la probabilité d'occurrence) sont détaillés dans l'ISO 13849-1 ; la décision appartient à l'équipe qui fait l'appréciation du risque.</p></div>`;
    const draw = () => {
      const pl = N.plr(S, F, P);
      el.querySelector('.simview').innerHTML = `<svg viewBox="0 0 560 230" class="lang-svg">${(() => {
        let o = '<circle cx="30" cy="115" r="8" fill="var(--sch-ink)"/>';
        const node = (x, y, on) => `<circle cx="${x}" cy="${y}" r="5" fill="${on ? 'var(--copper)' : 'var(--sch-dim)'}"/>`;
        const ln = (x1, y1, x2, y2, on) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${on ? 'var(--copper)' : 'var(--sch-dim)'}" stroke-width="${on ? 3 : 1.4}"/>`;
        const ys = { 1: 60, 2: 170 };
        [1, 2].forEach(s => { o += ln(30, 115, 130, ys[s], S === s) + node(130, ys[s], S === s) + `<text x="96" y="${ys[s] - 8}">S${s}</text>`;
          [1, 2].forEach(f => { const yf = ys[s] + (f === 1 ? -27 : 27); o += ln(130, ys[s], 250, yf, S === s && F === f) + node(250, yf, S === s && F === f) + `<text x="214" y="${yf - 6}">F${f}</text>`;
            [1, 2].forEach(p => { const yp = yf + (p === 1 ? -12 : 12), on = S === s && F === f && P === p, lv = N.plr(s, f, p); o += ln(250, yf, 380, yp, on) + `<text x="340" y="${yp - 3}" style="font-size:10px">P${p}</text><text x="${400 + 'abcde'.indexOf(lv) * 30}" y="${yp + 4}" style="font-size:${on ? 15 : 11}px;fill:${on ? 'var(--copper)' : 'var(--sch-dim)'}">${lv}</text>`; }); }); });
        return o + `<text x="400" y="18">PL<tspan baseline-shift="sub" style="font-size:9px">r</tspan> : a  b  c  d  e</text><text x="20" y="222" style="font-size:15px;fill:var(--copper)">PL requis : ${pl}</text>`;
      })()}</svg>`;
    };
    segB(el, '.js-s', v => { S = +v; draw(); }); segB(el, '.js-f', v => { F = +v; draw(); }); segB(el, '.js-p', v => { P = +v; draw(); });
    draw();
  };

  /* ---------- PFH d'une fonction de sécurité ---------- */
  SIMS.pfh = el => {
    const st = { s: -7, l: -8.5, a: -7.3 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('s', 'Sous-système « détection » (capteur, interrupteur de porte) : log₁₀ PFH', -9, -4, 0.1, -7, '')}${sl('l', 'Sous-système « traitement » (relais ou automate de sécurité)', -9, -4, 0.1, -8.5, '')}${sl('a', 'Sous-système « action » (contacteurs, vanne)', -9, -4, 0.1, -7.3, '')}</div>
      <div class="simout"><div><span>PFH de la fonction ≈ somme</span><b class="o-p"></b></div><div><span>Niveau de performance atteint (selon PFH)</span><b class="o-l"></b></div><div><span>SIL correspondant (IEC 62061)</span><b class="o-s"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">PFH : probabilité de défaillance dangereuse par heure. La valeur de chaque sous-système vient des fiches des fabricants (ou de calculs). Le PL atteint dépend aussi de la catégorie (architecture), de la couverture du diagnostic et des défaillances de cause commune : la PFH seule ne suffit pas à valider une fonction.</p></div>`;
    bind(el, st, { s: v => sci(Math.pow(10, v)), l: v => sci(Math.pow(10, v)), a: v => sci(Math.pow(10, v)) });
    const cv = AA.canvas(el.querySelector('.simview'), 130, (g, W) => {
      const ps = [st.s, st.l, st.a].map(v => Math.pow(10, v)), tot = ps.reduce((a, b) => a + b, 0);
      el.querySelector('.o-p').textContent = sci(tot) + ' /h'; el.querySelector('.o-l').textContent = 'PL ' + N.plFromPFH(tot); el.querySelector('.o-s').textContent = N.silFromPFH(tot);
      const names = ['Détection', 'Traitement', 'Action'], w = (W - 80) / 3;
      ps.forEach((p, k) => { const x = 20 + k * (w + 20); g.fillStyle = css('--surface-3'); g.fillRect(x, 30, w, 50); g.fillStyle = css('--ink'); g.font = '600 12px Segoe UI'; g.fillText(names[k], x + 10, 52); g.font = '500 11px Segoe UI'; g.fillStyle = css('--ink-3'); g.fillText(sci(p) + ' /h', x + 10, 70); g.fillStyle = css('--copper'); g.fillRect(x, 86, w * (p / tot), 8); });
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('barre : part de chaque sous-système dans le total — on améliore d\'abord le maillon le plus faible', 20, 116);
    });
    return cv.stop;
  };

  /* ---------- Poste HTA/BT ---------- */
  const SVG_POSTE = `<svg viewBox="0 0 440 210" class="hot-svg"><rect x="8" y="8" width="424" height="194" rx="8" class="h-box"/>
    <g data-spot="arr"><rect x="22" y="30" width="62" height="120" rx="4" class="h-dev"/><text x="30" y="170" class="h-txt" style="font-size:10px">Arrivée</text><circle cx="53" cy="70" r="10" class="h-knob"/></g>
    <g data-spot="prot"><rect x="94" y="30" width="62" height="120" rx="4" class="h-dev"/><text x="98" y="170" class="h-txt" style="font-size:10px">Protection</text><rect x="114" y="60" width="22" height="40" rx="3" class="h-win"/></g>
    <g data-spot="tr"><rect x="176" y="40" width="96" height="110" rx="10" class="h-dev"/><circle cx="210" cy="95" r="22" class="h-line"/><circle cx="238" cy="95" r="22" class="h-line"/><text x="192" y="170" class="h-txt" style="font-size:10px">Transformateur</text></g>
    <g data-spot="tgbt"><rect x="292" y="30" width="80" height="120" rx="4" class="h-dev"/><rect x="302" y="44" width="60" height="16" class="h-win"/><rect x="302" y="70" width="60" height="16" class="h-win"/><rect x="302" y="96" width="60" height="16" class="h-win"/><text x="310" y="170" class="h-txt" style="font-size:10px">TGBT</text></g>
    <g data-spot="cpt"><rect x="384" y="40" width="38" height="50" rx="4" class="h-dev"/><text x="388" y="110" class="h-txt" style="font-size:9px">Comptage</text></g>
    <g data-spot="terre"><path d="M30 190 h380" class="h-line" style="stroke:#2e7d32;stroke-width:3"/><text x="160" y="186" class="h-txt" style="font-size:9px">terres et liaisons équipotentielles</text></g></svg>`;
  const SPOTS_POSTE = {
    arr: ['Cellule d\'arrivée', 'Interrupteur raccordant le poste au réseau HTA du distributeur (souvent en coupure d\'artère : deux cellules d\'arrivée, l\'une alimentant, l\'autre permettant de reprendre l\'alimentation par l\'autre côté de la boucle).'],
    prot: ['Cellule de protection du transformateur', 'Interrupteur-fusibles ou disjoncteur HTA avec relais de protection. Il élimine les défauts du transformateur et sépare celui-ci pour les interventions.'],
    tr: ['Transformateur HTA/BT', 'Par exemple 20 kV / 410 V à vide, couplage Dyn11. Immergé dans l\'huile ou de type sec enrobé. Ses protections propres (température, pression, gaz) agissent sur la cellule de protection.'],
    tgbt: ['Tableau général basse tension', 'Disjoncteur général, puis départs vers les tableaux divisionnaires. Son pouvoir de coupure doit couvrir le courant de court-circuit aux bornes du transformateur.'],
    cpt: ['Comptage', 'Comptage de l\'énergie (en BT pour les petits postes, en HTA pour les plus gros), raccordé par transformateurs de courant.'],
    terre: ['Mises à la terre', 'Masses du poste, neutre BT (selon le schéma de liaison à la terre) : les prises de terre et leurs interconnexions sont définies par la réglementation et le distributeur.']
  };
  AA.VISDATA.HOT.poste = [SVG_POSTE, SPOTS_POSTE, 'Poste de livraison HTA/BT'];

  /* ---------- Coordination de relais à temps inverse ---------- */
  SIMS.idmt = el => {
    const st = { Is1: 100, t1: 0.1, Is2: 300, t2: 0.3, If: 2000 }; let c1 = 'SI', c2 = 'SI';
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div><span class="muted" style="font-size:12px">Relais aval (départ) </span><div class="seg js-c1">${Object.entries(N.IDMT).map(([k, v]) => `<button data-v="${k}" class="${k === 'SI' ? 'on' : ''}">${v[2]}</button>`).join('')}</div></div>${sl('Is1', 'Seuil aval I<sub>s</sub>', 20, 400, 5, 100, 'A')}${sl('t1', 'Multiplicateur de temps aval TMS', 0.05, 1, 0.01, 0.1, '')}
      <div><span class="muted" style="font-size:12px">Relais amont (arrivée) </span><div class="seg js-c2">${Object.entries(N.IDMT).map(([k, v]) => `<button data-v="${k}" class="${k === 'SI' ? 'on' : ''}">${v[2]}</button>`).join('')}</div></div>${sl('Is2', 'Seuil amont I<sub>s</sub>', 50, 1000, 10, 300, 'A')}${sl('t2', 'Multiplicateur de temps amont TMS', 0.05, 1, 0.01, 0.3, '')}${sl('If', 'Courant de défaut sur le départ', 200, 10000, 50, 2000, 'A')}</div>
      <div class="simout"><div><span>Temps aval</span><b class="o-1"></b></div><div><span>Temps amont</span><b class="o-2"></b></div><div><span>Intervalle de sélectivité</span><b class="o-m"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Courbes IEC 60255-151. Un intervalle de 0,3 à 0,4 s est couramment retenu entre relais électromécaniques ou anciens disjoncteurs ; il peut être réduit avec des relais numériques. Les courants sont ramenés au même niveau de tension.</p></div>`;
    bind(el, st, { t1: v => AA.fmt(v, 2), t2: v => AA.fmt(v, 2) });
    segB(el, '.js-c1', v => { c1 = v; }); segB(el, '.js-c2', v => { c2 = v; });
    const cv = AA.canvas(el.querySelector('.simview'), 260, (g, W, H) => {
      const a = N.idmt(c1, st.If, st.Is1, st.t1), b = N.idmt(c2, st.If, st.Is2, st.t2), m = b - a;
      el.querySelector('.o-1').textContent = isFinite(a) ? AA.fmt(a, 2) + ' s' : 'pas de déclenchement'; el.querySelector('.o-2').textContent = isFinite(b) ? AA.fmt(b, 2) + ' s' : 'pas de déclenchement';
      el.querySelector('.o-m').innerHTML = isFinite(a) && isFinite(b) ? (m >= 0.3 ? `<span class="ok-t">${AA.fmt(m, 2)} s : sélectif</span>` : `<span class="bad-t">${AA.fmt(m, 2)} s : insuffisant</span>`) : '—';
      const x0 = 50, x1 = W - 14, y0 = H - 26, y1 = 12, X = i => x0 + Math.log10(i / 20) / Math.log10(10000 / 20) * (x1 - x0), Y = t => y0 - (Math.log10(Math.min(100, Math.max(0.01, t))) + 2) / 4 * (y0 - y1);
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.lineWidth = 1;
      [20, 100, 1000, 10000].forEach(i => { g.beginPath(); g.moveTo(X(i), y0); g.lineTo(X(i), y1); g.stroke(); g.fillText(i >= 1000 ? i / 1000 + ' kA' : i + ' A', X(i) - 10, y0 + 13); });
      [0.01, 0.1, 1, 10, 100].forEach(t => { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); g.fillText(t + ' s', 4, Y(t) + 4); });
      const curve = (c, Is, tms, col) => { g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); let f = true; for (let i = Is * 1.05; i <= 10000; i *= 1.03) { const t = N.idmt(c, i, Is, tms); if (t > 100) continue; f ? g.moveTo(X(i), Y(t)) : g.lineTo(X(i), Y(t)); f = false; } g.stroke(); };
      curve(c1, st.Is1, st.t1, css('--copper')); curve(c2, st.Is2, st.t2, css('--blue'));
      g.strokeStyle = css('--bad'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(st.If), y0); g.lineTo(X(st.If), y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--copper'); g.fillText('aval', x1 - 70, y1 + 12); g.fillStyle = css('--blue'); g.fillText('amont', x1 - 36, y1 + 12);
    });
    return cv.stop;
  };

  /* ---------- Qualité de l'énergie : creux de tension ---------- */
  SIMS.creux = el => {
    const st = { depth: 60, dur: 150 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('depth', 'Tension résiduelle pendant l\'événement', 0, 100, 1, 60, '% de U')}${sl('dur', 'Durée', 10, 2000, 10, 150, 'ms')}</div>
      <div class="simout"><div><span>Classement (EN 50160)</span><b class="o-c"></b></div><div><span>Équipement conforme SEMI F47</span><b class="o-s"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">EN 50160 : creux quand la tension descend sous 90 % de la tension de référence, coupure sous 5 %. SEMI F47 (équipements de fabrication de semi-conducteurs, souvent pris comme référence de robustesse) : tenue à 50 % pendant 200 ms, 70 % pendant 500 ms, 80 % pendant 1 s. En dessous, l'équipement peut s'arrêter : un variateur peut se mettre en défaut de sous-tension, un contacteur retomber.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H, t) => {
      const cls = st.depth < 5 ? 'coupure' : st.depth < 90 ? 'creux de tension' : 'variation normale (≥ 90 %)';
      const ok = st.depth >= 90 || (st.dur <= 200 && st.depth >= 50) || (st.dur <= 500 && st.depth >= 70) || (st.dur <= 1000 && st.depth >= 80);
      el.querySelector('.o-c').textContent = cls; el.querySelector('.o-s').innerHTML = ok ? '<span class="ok-t">tient l\'événement</span>' : '<span class="bad-t">risque d\'arrêt</span>';
      const x0 = 10, x1 = W - 10, yc = H / 2, A = H * 0.38, total = 2400, ds = 600, de = ds + st.dur;
      g.strokeStyle = css('--copper'); g.lineWidth = 1.6; g.beginPath();
      for (let x = x0; x <= x1; x++) { const tm = (x - x0) / (x1 - x0) * total, amp = tm >= ds && tm <= de ? st.depth / 100 : 1, y = yc - A * amp * Math.sin(2 * Math.PI * tm / 20 * 0.15); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
      g.fillStyle = 'rgba(220,60,80,.08)'; g.fillRect(x0 + ds / total * (x1 - x0), 8, st.dur / total * (x1 - x0), H - 16);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('sinusoïde ralentie pour la lisibilité ; échelle de temps : 2,4 s', 12, H - 6);
    });
    return cv.stop;
  };

  /* ---------- Efficacité énergétique des moteurs ---------- */
  SIMS.moteurie = el => {
    const st = { P: 22, h: 6000, e1: 89, e2: 93.5, price: 0.18, q: 100, cost: 1800 };
    el.innerHTML = `<div class="simcard"><div class="simctl">${sl('P', 'Puissance utile moyenne', 1, 200, 1, 22, 'kW')}${sl('h', 'Heures de fonctionnement par an', 500, 8760, 100, 6000, 'h')}${sl('e1', 'Rendement du moteur actuel', 80, 97, 0.1, 89, '%')}${sl('e2', 'Rendement du moteur neuf (IE3 / IE4)', 80, 97.5, 0.1, 93.5, '%')}${sl('price', 'Prix de l\'énergie', 0.05, 0.4, 0.01, 0.18, '€/kWh')}${sl('cost', 'Surcoût du moteur performant', 0, 20000, 100, 1800, '€')}${sl('q', 'Pompe : débit réduit par variateur (au lieu de tout-ou-rien)', 50, 100, 1, 100, '%')}</div>
      <div class="simview"></div><div class="simout"><div><span>Économie liée au rendement</span><b class="o-e"></b></div><div><span>Temps de retour du surcoût</span><b class="o-r"></b></div><div><span>Puissance de la pompe au débit réduit (P ∝ n³)</span><b class="o-p"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Les rendements réels figurent sur la plaque et la fiche du moteur (IEC 60034-30-1). La loi en n³ vaut pour une pompe centrifuge sans hauteur géométrique à vaincre ; en présence de hauteur statique, le gain est plus faible.</p></div>`;
    bind(el, st, { e1: v => AA.fmt(v, 1), e2: v => AA.fmt(v, 1), price: v => AA.fmt(v, 2) });
    const cv = AA.canvas(el.querySelector('.simview'), 110, (g, W) => {
      const sav = N.saving(st.P, st.h, st.e1 / 100, st.e2 / 100, st.price), pq = N.pumpP(st.P, st.q / 100);
      el.querySelector('.o-e').textContent = sav > 0 ? AA.fmt(sav, 0) + ' €/an (' + AA.fmt(sav / st.price, 0) + ' kWh)' : 'aucune'; el.querySelector('.o-r').textContent = sav > 0 ? AA.fmt(st.cost / sav, 1) + ' an(s)' : '—'; el.querySelector('.o-p').textContent = AA.fmt(pq, 1) + ' kW (' + AA.fmt(st.q ** 3 / 1e4, 0) + ' %)';
      const a = st.P / (st.e1 / 100), b = st.P / (st.e2 / 100), sc = (W - 200) / Math.max(a, 1);
      [['moteur actuel', a, '--line-2'], ['moteur neuf', b, '--ok'], ['pompe au débit réduit', pq / (st.e2 / 100), '--teal']].forEach(([n, v, c], i) => { g.fillStyle = css(c); g.fillRect(170, 12 + i * 30, v * sc, 20); g.fillStyle = css('--ink-2'); g.font = '500 11px Segoe UI'; g.fillText(n + ' : ' + AA.fmt(v, 1) + ' kW absorbés', 10, 26 + i * 30); });
    });
    return cv.stop;
  };

  /* ---------- Audit énergétique : répartition des consommations ---------- */
  const USES = [['Air comprimé', 180], ['Moteurs de process', 420], ['Éclairage', 90], ['Chauffage et climatisation', 260], ['Fours', 300], ['Veilles hors production', 60]];
  SIMS.audit = el => {
    const st = {}; USES.forEach((u, i) => { st['u' + i] = u[1]; });
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${USES.map((u, i) => sl('u' + i, u[0], 0, 800, 10, u[1], 'MWh/an')).join('')}</div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Un audit commence par mesurer et répartir les consommations : on concentre ensuite les efforts sur les quelques usages qui pèsent le plus (diagramme de Pareto). Les fuites d'air comprimé et les consommations hors production sont souvent des gisements rapides.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H) => {
      const arr = USES.map((u, i) => [u[0], st['u' + i]]).sort((a, b) => b[1] - a[1]), tot = arr.reduce((a, x) => a + x[1], 0) || 1;
      const bw = (W - 60) / arr.length; let cum = 0;
      g.strokeStyle = css('--teal'); g.lineWidth = 2; g.beginPath();
      arr.forEach(([n, v], i) => { const h = v / arr[0][1] * (H - 60), x = 30 + i * bw; g.fillStyle = css('--copper'); g.fillRect(x + 4, H - 30 - h, bw - 8, h); g.fillStyle = css('--ink-3'); g.font = '500 9.5px Segoe UI'; g.fillText(n.split(' ')[0], x + 4, H - 16); cum += v; const y = H - 30 - cum / tot * (H - 60); i ? g.lineTo(x + bw / 2, y) : g.moveTo(x + bw / 2, y); });
      g.stroke(); g.fillStyle = css('--teal'); g.font = '600 10.5px Segoe UI'; g.fillText('cumul : les 2 premiers usages = ' + AA.fmt((arr[0][1] + arr[1][1]) / tot * 100, 0) + ' % du total (' + AA.fmt(tot, 0) + ' MWh/an)', 30, 14);
    });
    return cv.stop;
  };

  /* ---------- Planning : chemin critique ---------- */
  const TASKS = [['A', 'Étude et cahier des charges', 3, []], ['B', 'Commande du matériel', 6, ['A']], ['C', 'Schémas électriques', 4, ['A']], ['D', 'Programme automate', 5, ['C']], ['E', 'Câblage des armoires', 4, ['B', 'C']], ['F', 'Essais en usine (FAT)', 1, ['D', 'E']], ['G', 'Installation sur site', 3, ['F']], ['H', 'Mise en service et réception', 2, ['G']]];
  SIMS.gantt = el => {
    const st = {}; TASKS.forEach(t => { st[t[0]] = t[2]; });
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${TASKS.map(t => sl(t[0], t[0] + ' · ' + t[1], 1, 12, 1, t[2], 'sem.')).join('')}</div>
      <div class="simout"><div><span>Durée totale du projet</span><b class="o-d"></b></div><div><span>Chemin critique</span><b class="o-c"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Allonger une tâche critique (en couleur) retarde tout le projet ; une tâche non critique dispose d'une marge (en gris clair). Essaie d'allonger le délai de commande du matériel.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H) => {
      const tasks = TASKS.map(t => ({ id: t[0], d: st[t[0]], dep: t[3] })), r = N.cpm(tasks);
      el.querySelector('.o-d').textContent = r.end + ' semaines'; el.querySelector('.o-c').textContent = r.crit.join(' → ');
      const x0 = 190, sc = (W - x0 - 14) / Math.max(r.end, 1), rh = (H - 24) / tasks.length;
      g.strokeStyle = css('--line'); g.fillStyle = css('--ink-3'); g.font = '500 9.5px Segoe UI';
      for (let w = 0; w <= r.end; w += Math.max(1, Math.round(r.end / 12))) { g.beginPath(); g.moveTo(x0 + w * sc, 4); g.lineTo(x0 + w * sc, H - 18); g.stroke(); g.fillText(w, x0 + w * sc - 3, H - 6); }
      tasks.forEach((t, i) => { const y = 6 + i * rh, crit = r.crit.includes(t.id); g.fillStyle = css('--ink-2'); g.font = '500 11px Segoe UI'; g.fillText(TASKS[i][0] + ' · ' + TASKS[i][1].slice(0, 24), 8, y + rh * 0.6);
        g.fillStyle = crit ? css('--copper') : css('--teal'); g.fillRect(x0 + r.es[t.id] * sc, y + 3, t.d * sc, rh - 8);
        if (r.slack[t.id] > 0) { g.fillStyle = css('--line'); g.fillRect(x0 + r.ef[t.id] * sc, y + rh / 2 - 2, r.slack[t.id] * sc, 4); } });
    });
    return cv.stop;
  };

  /* ---------- Choix et ordres ---------- */
  const CDC = { title: 'Rédiger un cahier des charges : quelles formulations retenir ?', items: [['mes', 'Cadence : 1 200 pièces/h au minimum', 'exigence mesurable'], ['dispo', 'Disponibilité ≥ 98 % sur 3 mois', ''], ['norme', 'Conformité IEC 60204-1 et règlement Machines', ''], ['env', 'Ambiance 5 à 40 °C, poussières de bois', ''], ['rapide', 'La machine doit être rapide', ''], ['robuste', 'Matériel robuste et de qualité', ''], ['sol', 'Utiliser l\'automate X référence Y pour tout', 'solution imposée sans justification']],
    cases: [{ q: 'Sélectionne les exigences bien formulées pour un cahier des charges fonctionnel.', need: ['mes', 'dispo', 'norme', 'env'], no: ['rapide', 'robuste'], why: 'Une exigence doit être vérifiable à la réception : chiffrée, avec ses conditions. Le cahier des charges fonctionnel décrit le besoin et les contraintes, pas la solution (sauf contrainte justifiée, comme un standard de l\'usine).' }] };
  SIMS.cdcq = el => SIMS.choose(el, CDC);
  Object.assign(AA.VISDATA.ORDER, {
    recep: { title: 'De la fin de la fabrication à la garantie : quel ordre ?', steps: [['Essais de réception en usine (FAT) chez l\'intégrateur', 'On corrige les défauts avant l\'expédition, là où c\'est le moins cher.'], ['Livraison et installation sur site', ''], ['Essais sur site (SAT) et mise en service', 'Avec les vraies utilités, les vrais produits, les vrais opérateurs.'], ['Formation des opérateurs et de la maintenance', 'Avant la production autonome.'], ['Réception : procès-verbal, avec ou sans réserves', 'Elle transfère la garde de l\'installation au client et fait courir la garantie.'], ['Levée des réserves et remise du dossier conforme à l\'exécution', 'Le dossier doit décrire ce qui est réellement installé.']] },
    fsec: { title: 'Concevoir une fonction de sécurité : remets les étapes dans l\'ordre', steps: [['Apprécier le risque et décider des fonctions de sécurité nécessaires', 'ISO 12100.'], ['Spécifier chaque fonction : ce qu\'elle doit faire, en combien de temps, dans quels modes', ''], ['Déterminer le niveau requis (PLr ou SIL)', 'Graphe de risque ou méthode équivalente.'], ['Choisir l\'architecture et les composants, calculer le niveau atteint', 'Catégorie, MTTFD, DC, CCF ou PFH des sous-systèmes.'], ['Vérifier que le niveau atteint ≥ niveau requis', ''], ['Valider par analyse et par essais, puis documenter', 'Y compris les essais de défauts (fil coupé, contact collé).']] }
  });

  Object.assign(AA.SIMFORM, {
    riskgraph: ['PL<sub>r</sub> = f(S, F, P) — graphe de risque de l\'ISO 13849-1, annexe A'],
    pfh: ['PFH<sub>fonction</sub> ≈ PFH<sub>détection</sub> + PFH<sub>traitement</sub> + PFH<sub>action</sub>', 'PL d : 10⁻⁷ ≤ PFH < 10⁻⁶ ; PL e : 10⁻⁸ ≤ PFH < 10⁻⁷ ; SIL 2 : 10⁻⁷ à 10⁻⁶ ; SIL 3 : 10⁻⁸ à 10⁻⁷'],
    idmt: ['t = TMS × k / ((I/I<sub>s</sub>)<sup>α</sup> − 1)', 'Normalement inverse : k = 0,14 ; α = 0,02 — très inverse : 13,5 ; 1 — extrêmement inverse : 80 ; 2'],
    creux: ['Creux : 5 % ≤ U résiduelle < 90 % ; coupure : U < 5 % (EN 50160)'],
    moteurie: ['Économie (€/an) = P × h × (1/η₁ − 1/η₂) × prix', 'Pompe centrifuge : Q ∝ n, H ∝ n², P ∝ n³'],
    gantt: ['Date au plus tôt = max des fins des prédécesseurs ; marge totale = date au plus tard − date au plus tôt', 'Chemin critique : tâches de marge nulle']
  });

  /* ================= Leçons ================= */
  L.n10m1l1 = { min: 11, why: "Concevoir une machine, c'est d'abord en connaître les dangers : l'analyse de risques est le socle de toute la sécurité.", screens: [[
    { h: 'Directive machines et analyse de risques' },
    { list: ['Directive 2006/42/CE, remplacée par le règlement (UE) 2023/1230 applicable à partir du 20 janvier 2027.', 'Appréciation du risque selon l\'ISO 12100 : déterminer les limites de la machine, identifier les phénomènes dangereux, estimer et évaluer les risques.', 'Réduction du risque en trois étapes, dans cet ordre : prévention intrinsèque, protections, information.'] }
  ]] };
  L.n10m1l2 = { min: 12, why: "Le niveau de performance requis fixe la qualité exigée du capteur, de la logique et des actionneurs d'une fonction de sécurité.", screens: [[
    { h: 'ISO 13849 : catégories et niveaux PL' },
    { list: ['Niveau de performance (PL a à e) : capacité d\'une fonction de sécurité à remplir sa mission dans des conditions prévisibles.', 'PL<sub>r</sub> (requis) se détermine par le graphe de risque ; le PL atteint se calcule à partir de la <b>catégorie</b> (architecture B, 1, 2, 3, 4), du <b>MTTF<sub>D</sub></b> des composants, de la <b>couverture du diagnostic</b> (DC) et des mesures contre les défaillances de cause commune.', 'Catégorie 3 : un défaut unique n\'entraîne pas la perte de la fonction ; catégorie 4 : en plus, l\'accumulation de défauts non détectés est maîtrisée.'] }
  ]] };
  L.n10m1l3 = { min: 11, why: "L'IEC 62061 et l'ISO 13849 parlent le même langage chiffré : la probabilité de défaillance dangereuse par heure.", screens: [[
    { h: 'IEC 62061 : SIL' },
    { table: { head: ['Niveau', 'PFH (défaillances dangereuses par heure)'], rows: [['SIL 1', '10⁻⁶ ≤ PFH < 10⁻⁵'], ['SIL 2 (≈ PL d)', '10⁻⁷ ≤ PFH < 10⁻⁶'], ['SIL 3 (≈ PL e)', '10⁻⁸ ≤ PFH < 10⁻⁷']] } },
    { num: { id: 'pfh', gen: r => { const a = r.pick([2, 5, 8]), b = r.pick([1, 2, 4]), c = r.pick([3, 6, 9]); const s = a * 1e-8 + b * 1e-9 + c * 1e-8; return { q: `Fonction de sécurité : capteur <b>${a} × 10⁻⁸ /h</b>, relais de sécurité <b>${b} × 10⁻⁹ /h</b>, contacteurs <b>${c} × 10⁻⁸ /h</b>. PFH totale, en 10⁻⁸ /h ?`, a: s * 1e8, unit: '× 10⁻⁸ /h', tol: 0.01, sol: `PFH ≈ ${a} + ${AA.fmt(b / 10, 1)} + ${c} = ${AA.fmt(s * 1e8, 1)} × 10⁻⁸ /h → ${N.silFromPFH(s)}, PL ${N.plFromPFH(s)}` }; } } }
  ]] };
  L.n10m1l4 = { min: 11, why: "Une fonction de sécurité se conçoit, se calcule, se teste et se documente : rien n'est laissé à l'intuition.", screens: [[
    { h: 'Concevoir une fonction de sécurité' },
    { p: "Exemple : « l'ouverture du protecteur arrête la broche en moins de 0,5 s et empêche son redémarrage tant qu'il est ouvert ». On détermine le PL<sub>r</sub>, on choisit une architecture (interrupteur de porte à deux canaux, relais de sécurité, deux contacteurs en série surveillés), on calcule le niveau atteint, puis on valide par des essais, défauts compris." },
    { sim: 'safety' }
  ]] };
  L.n10m2l1 = { min: 10, why: "Le poste de livraison est le cœur électrique d'une usine : tout part de lui.", screens: [[
    { h: 'Postes HTA/BT' },
    { p: "Un poste de livraison reçoit la haute tension du distributeur (en France, le plus souvent 20 kV), la transforme en basse tension et alimente le tableau général. Ses manœuvres et interventions sont réservées à du personnel habilité pour la HTA, selon des procédures écrites." }
  ]] };
  L.n10m2l2 = { min: 12, why: "La sélectivité des protections HTA décide si un défaut coupe un atelier… ou toute l'usine.", screens: [[
    { h: 'Protection des réseaux HTA' },
    { list: ['Relais à maximum de courant (phases, terre), à temps constant ou à temps inverse.', 'Sélectivité chronométrique : le relais amont attend un intervalle de sécurité de plus que l\'aval.', 'Sélectivité logique : le relais aval envoie un ordre d\'attente à l\'amont, qui peut alors être rapide.', 'Protections différentielles (transformateurs, câbles), directionnelles (boucles, sources multiples).'] },
    { num: { id: 'id', gen: r => { const Is = r.pick([100, 200, 400]), M = r.pick([5, 10, 20]), tms = r.pick([0.1, 0.2, 0.3]); const t = N.idmt('SI', M * Is, Is, tms); return { q: `Relais « normalement inverse », I<sub>s</sub> = <b>${Is} A</b>, TMS = <b>${AA.fmt(tms)}</b>, défaut de <b>${M * Is} A</b>. Temps de déclenchement ?`, a: t, unit: 's', tol: 0.01, sol: `t = ${AA.fmt(tms)} × 0,14 / (${M}^0,02 − 1) = ${AA.fmt(t, 3)} s` }; } } }
  ]] };
  L.n10m2l3 = { min: 9, why: "Hôpitaux, data centers, process continus : la continuité d'alimentation se conçoit comme une chaîne sans maillon faible.", screens: [[
    { h: 'Groupes électrogènes et ASI' },
    { list: ['L\'ASI alimente immédiatement la charge sensible ; le groupe démarre, se stabilise, puis l\'inverseur de sources bascule.', 'Dimensionnement du groupe : puissance des charges secourues, appels de courant au démarrage des moteurs, charges non linéaires (ASI, variateurs).', 'Essais périodiques en charge réelle : un groupe jamais essayé ne démarre pas le jour où on en a besoin.'] }
  ]] };
  L.n10m2l4 = { min: 9, why: "La production photovoltaïque raccordée transforme le site en producteur : protections et contrat changent.", screens: [[
    { h: 'Production photovoltaïque raccordée' },
    { list: ['Autoconsommation (avec ou sans injection du surplus) ou vente totale : le schéma de raccordement et le contrat diffèrent.', 'Protection de découplage : l\'installation se sépare automatiquement du réseau en cas de défaut ou d\'absence du réseau, pour ne jamais alimenter une ligne sur laquelle on intervient.', 'Les règles de raccordement sont fixées par le gestionnaire de réseau (en France, référentiel technique d\'Enedis et NF C 15-100 / guide UTE C 15-712-1).'] }
  ]] };
  L.n10m3l1 = { min: 10, why: "Une coupure de 100 ms peut arrêter toute une ligne : la qualité de l'énergie se mesure et se prend en compte.", screens: [[
    { h: 'Qualité de l\'énergie' },
    { list: ['EN 50160 : caractéristiques de la tension fournie par les réseaux publics (par exemple, en BT, valeurs efficaces moyennées sur 10 min dans 230 V ± 10 % pendant 95 % du temps sur une semaine).', 'Phénomènes : creux et coupures, surtensions, harmoniques, déséquilibre, papillotement (flicker).', 'Remèdes : ASI, compensateurs, relais de contacteurs temporisés, réglages de « reprise au vol » des variateurs.'] }
  ]] };
  L.n10m3l2 = { min: 11, why: "Sur sa durée de vie, un moteur coûte en énergie bien plus que son prix d'achat.", screens: [[
    { h: 'Efficacité énergétique des moteurs' },
    { list: ['Classes de rendement IE1 à IE5 (IEC 60034-30-1) ; IE3 minimum réglementaire pour la plupart des moteurs dans l\'Union européenne.', 'Le plus gros gisement est souvent la régulation : une pompe ou un ventilateur à vitesse variable consomme beaucoup moins qu\'avec une vanne ou un registre (P ∝ n³).', 'Dimensionner juste : un moteur très surdimensionné fonctionne avec un rendement et un cos φ dégradés.'] },
    { num: { id: 'aff', gen: r => { const Pn = r.pick([15, 30, 55]), q = r.pick([0.6, 0.7, 0.8, 0.9]); return { q: `Pompe centrifuge (sans hauteur statique) : <b>${Pn} kW</b> à plein débit. Puissance à <b>${q * 100} %</b> du débit, par réduction de vitesse ?`, a: N.pumpP(Pn, q), unit: 'kW', tol: 0.01, sol: `P = ${Pn} × ${AA.fmt(q)}³ = ${AA.fmt(N.pumpP(Pn, q), 2)} kW` }; } } }
  ]] };
  L.n10m3l3 = { min: 9, why: "On ne réduit bien que ce que l'on a mesuré.", screens: [[
    { h: 'Audit énergétique' },
    { list: ['Collecter les factures et les courbes de charge, mesurer les usages principaux (compteurs divisionnaires, analyseurs).', 'Répartir les consommations par usage, repérer les consommations hors production.', 'Proposer des actions chiffrées : économie, coût, temps de retour ; les classer.', 'Cadre : en France, audit énergétique réglementaire pour les grandes entreprises ; ISO 50001 pour un système de management de l\'énergie.'] }
  ]] };
  L.n10m3l4 = { min: 9, why: "Stocker l'énergie permet de lisser les pointes, de secourir et de valoriser la production locale.", screens: [[
    { h: 'Stockage et micro-réseaux' },
    { p: "Un micro-réseau associe production locale (photovoltaïque, cogénération), stockage (batteries), charges pilotables et parfois un groupe, avec un système de gestion qui décide en permanence qui produit, qui stocke, qui consomme. Il peut fonctionner raccordé au réseau ou en îlotage, en sécurité." }
  ]] };
  L.n10m4l1 = { min: 9, why: "Un projet mal défini au départ coûte cher à la fin : le cahier des charges est le contrat de tous.", screens: [[
    { h: 'Du besoin au cahier des charges' },
    { p: "Le cahier des charges fonctionnel exprime le besoin du client : fonctions attendues, performances chiffrées, contraintes (normes, environnement, standards de l'usine), conditions de réception. L'intégrateur y répond par des spécifications techniques qui décrivent la solution." }
  ]] };
  L.n10m4l2 = { min: 10, why: "Le chemin critique dit quelles tâches surveiller de près : celles dont le moindre retard décale la date de fin.", screens: [[
    { h: 'Planification et budget' },
    { list: ['Découper le projet en tâches, estimer leurs durées, identifier les dépendances.', 'Chemin critique : suite de tâches sans marge ; toute dérive repousse la fin du projet.', 'Budget : études, matériel, câblage, programmation, mise en service, déplacements, aléas (provision pour risques).', 'Suivi : avancement réel contre prévu, chaque semaine.'] }
  ]] };
  L.n10m4l3 = { min: 9, why: "La réception transfère la responsabilité de l'installation : elle se prépare dès le début du projet.", screens: [[
    { h: 'Réception, documentation, formation' },
    { list: ['Essais en usine (FAT) puis sur site (SAT), selon des procédures écrites et acceptées par le client.', 'Dossier conforme à l\'exécution : schémas à jour, programmes commentés, nomenclatures, notices, certificats, résultats d\'essais.', 'Formation des opérateurs et de la maintenance, adaptée à chaque public.'] }
  ]] };
  L.n10m4l4 = { min: 10, why: "Tout ce que tu as appris se rejoint dans un projet : c'est là qu'on devient ingénieur.", screens: [[
    { h: 'Projet final : ligne de production complète' },
    { p: "Le défi « Grand projet » génère une ligne de production complète, différente à chaque fois : bilan de puissance, choix du transformateur, sections et protections, schémas de commande, automate, sécurité, réception. Chaque étape réutilise les compétences des dix niveaux. Lance-le depuis la page des défis." }
  ]] };

  SIMS.projfinal = el => { el.innerHTML = `<div class="simcard"><div style="padding:22px"><p class="eyebrow">Ton projet de fin de parcours</p><h3 style="margin:4px 0 10px">Une usine différente à chaque lancement</h3><p class="muted">Bilan de puissance, transformateur, canalisations, protections, sélectivité, schémas, automate, sécurité des machines, mise en service.</p><a class="btn primary" href="#/defis">Aller aux défis</a></div></div>`; };

  Object.assign(AA.VISMAP, {
    n10m1l1: [{ order: 'ce' }], n10m1l2: [{ sim: 'riskgraph' }], n10m1l3: [{ sim: 'pfh' }], n10m1l4: [{ order: 'fsec' }],
    n10m2l1: [{ hot: 'poste' }], n10m2l2: [{ sim: 'idmt' }], n10m2l3: [{ sim: 'ats' }], n10m2l4: [{ sim: 'lab', opts: { id: 'pv' } }],
    n10m3l1: [{ sim: 'creux' }], n10m3l2: [{ sim: 'moteurie' }], n10m3l3: [{ sim: 'audit' }], n10m3l4: [{ sim: 'battery' }],
    n10m4l1: [{ sim: 'cdcq' }], n10m4l2: [{ sim: 'gantt' }], n10m4l3: [{ order: 'recep' }], n10m4l4: [{ sim: 'projfinal' }]
  });
})();
