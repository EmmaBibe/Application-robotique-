/* Niveau 7 « Automates programmables II » : langages IEC 61131-3, analogique, régulation PID, sécurité.
 * Modèles (AA.N7), vérifiés par les tests :
 *  - mise à l'échelle linéaire y = y0 + (x − x0)(y1 − y0)/(x1 − x0)
 *  - boucle 4-20 mA : I = 4 + 16 (x − x0)/(x1 − x0) ; défaut si I < 3,6 mA ou I > 21 mA (NAMUR NE 43)
 *  - Pt100 (IEC 60751) : R = 100 (1 + A t + B t²), A = 3,9083e-3, B = −5,775e-7 (t ≥ 0 °C)
 *  - filtre du premier ordre : y += Te/(τ + Te) × (x − y)
 *  - PID : u = Kp (e + (1/Ti)∫e dt + Td de/dt), dérivée sur la mesure, anti-saturation de l'intégrale. */
(function () {
  'use strict';
  const L = AA.L, SIMS = AA.SIMS, css = n => AA.css(n), esc = AA.esc;
  const sl = (k, label, min, max, step, val, unit) => `<label class="sl" data-k="${k}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><b></b><i>${unit}</i></label>`;
  const bind = (el, st, fmt) => el.querySelectorAll('.sl').forEach(l => { const k = l.dataset.k, i = l.querySelector('input'), o = l.querySelector('b'); const u = () => { st[k] = +i.value; o.textContent = (fmt && fmt[k] ? fmt[k] : v => AA.fmt(v))(st[k]); }; i.addEventListener('input', u); u(); });
  const segB = (el, c, cb) => el.querySelectorAll(c + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(c + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
  const N = AA.N7 = {};

  /* ---------- Modèles ---------- */
  N.scale = (x, x0, x1, y0, y1) => y0 + (x - x0) * (y1 - y0) / (x1 - x0);
  N.ma = (x, x0, x1) => 4 + 16 * (x - x0) / (x1 - x0);
  N.maFault = i => i < 3.6 || i > 21;
  N.PT = { R0: 100, A: 3.9083e-3, B: -5.775e-7 };
  N.ptR = t => N.PT.R0 * (1 + N.PT.A * t + N.PT.B * t * t);
  N.ptT = R => { const { R0, A, B } = N.PT; return (-A + Math.sqrt(A * A - 4 * B * (1 - R / R0))) / (2 * B); };
  N.filt = (y, x, Te, tau) => y + Te / (tau + Te) * (x - y);
  N.pidNew = () => ({ I: 0, pvPrev: null });
  N.pidStep = (s, p, sp, pv, dt) => {
    const e = sp - pv, dpv = s.pvPrev == null ? 0 : (pv - s.pvPrev) / dt; s.pvPrev = pv;
    const P = p.Kp * e, D = -p.Kp * p.Td * dpv;
    let I = s.I + (p.Ti > 0 ? p.Kp * e * dt / p.Ti : 0);
    let u = P + I + D;
    if (u > 100) { u = 100; if (e > 0) I = s.I; } else if (u < 0) { u = 0; if (e < 0) I = s.I; } // anti-saturation : l'intégrale ne croît pas quand la sortie est en butée
    if (p.Ti <= 0) I = 0;
    s.I = I; return { u, P, I, D };
  };
  N.zn = (Ku, Tu) => ({ Kp: 0.6 * Ku, Ti: Tu / 2, Td: Tu / 8 });

  /* ---------- Les quatre langages côte à côte ---------- */
  SIMS.langs = (el, o) => {
    let lang = (o && o.lang) || 'LD', I0 = false, I1 = true, M = false, step = 0;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-l">${['LD', 'FBD', 'ST', 'SFC'].map(k => `<button data-v="${k}" class="${k === lang ? 'on' : ''}">${k}</button>`).join('')}</div>
      <button class="btn sm js-m">Marche (maintenir)</button><button class="btn sm js-a">Arrêt (maintenir)</button><span class="js-q chip"></span></div><div class="js-v lang-view"></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Même fonction dans les quatre langages de l'IEC 61131-3 : marche par impulsion, auto-maintien, priorité à l'arrêt. Le bouton d'arrêt est câblé en contact à ouverture : l'entrée Arret_NF vaut 1 au repos (sécurité positive).</p></div>`;
    segB(el, '.js-l', v => { lang = v; draw(); });
    const hold = (b, on, off) => { b.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, off)); };
    hold(el.querySelector('.js-m'), () => { I0 = true; draw(); }, () => { I0 = false; draw(); });
    hold(el.querySelector('.js-a'), () => { I1 = false; draw(); }, () => { I1 = true; draw(); });
    const c = on => on ? 'var(--copper)' : 'var(--sch-ink)';
    function draw() {
      M = (I0 || M) && I1;
      if (step === 0 && I0 && I1) step = 1; else if (step === 1 && !I1) step = 0;
      const v = el.querySelector('.js-v'); el.querySelector('.js-q').textContent = 'Moteur = ' + (M ? 1 : 0);
      if (lang === 'LD') {
        const a = I0 || M;
        v.innerHTML = `<svg viewBox="0 0 520 170" class="lang-svg"><line x1="20" y1="20" x2="20" y2="150" stroke="var(--sch-ink)" stroke-width="3"/><line x1="500" y1="20" x2="500" y2="150" stroke="var(--sch-ink)" stroke-width="3"/>
          <path d="M20 60 H90" stroke="${c(true)}" stroke-width="2.4"/><path d="M90 45 v30 M110 45 v30" stroke="var(--sch-ink)" stroke-width="2.4"/><text x="100" y="35" text-anchor="middle">Marche</text>
          <path d="M110 60 H160" stroke="${c(I0)}" stroke-width="2.4"/>
          <path d="M60 60 V115 H90" stroke="${c(true)}" stroke-width="2.4" fill="none"/><path d="M90 100 v30 M110 100 v30" stroke="var(--sch-ink)" stroke-width="2.4"/><text x="100" y="148" text-anchor="middle">Moteur</text><path d="M110 115 H150 V60" stroke="${c(M)}" stroke-width="2.4" fill="none"/>
          <path d="M150 60 H230" stroke="${c(a)}" stroke-width="2.4"/><path d="M230 45 v30 M250 45 v30" stroke="var(--sch-ink)" stroke-width="2.4"/><text x="240" y="35" text-anchor="middle">Arret_NF</text>
          <path d="M250 60 H390" stroke="${c(a && I1)}" stroke-width="2.4"/><circle cx="410" cy="60" r="18" fill="${M ? 'color-mix(in srgb, var(--copper) 30%, transparent)' : 'none'}" stroke="var(--sch-ink)" stroke-width="2.4"/><text x="410" y="35" text-anchor="middle">Moteur</text><path d="M428 60 H500" stroke="var(--sch-ink)" stroke-width="2.4"/></svg>`;
      } else if (lang === 'FBD') {
        v.innerHTML = `<svg viewBox="0 0 520 170" class="lang-svg"><text x="20" y="54">Marche</text><path d="M80 50 H150" stroke="${c(I0)}" stroke-width="2.4"/><text x="20" y="104">Moteur</text><path d="M80 100 H150" stroke="${c(M)}" stroke-width="2.4"/>
          <rect x="150" y="30" width="70" height="90" rx="4" fill="none" stroke="var(--sch-ink)" stroke-width="2"/><text x="185" y="80" text-anchor="middle" style="font-size:16px">≥1</text>
          <path d="M220 75 H300" stroke="${c(I0 || M)}" stroke-width="2.4"/><text x="210" y="150">Arret_NF</text><path d="M270 145 H285 V115 H300" stroke="${c(I1)}" stroke-width="2.4" fill="none"/>
          <rect x="300" y="55" width="70" height="80" rx="4" fill="none" stroke="var(--sch-ink)" stroke-width="2"/><text x="335" y="100" text-anchor="middle" style="font-size:16px">&amp;</text><path d="M370 95 H440" stroke="${c(M)}" stroke-width="2.4"/><text x="446" y="99">Moteur</text></svg>`;
      } else if (lang === 'ST') {
        v.innerHTML = `<pre class="lang-st"><span class="cm">(* Texte structuré *)</span>
<b>Moteur</b> := (<i class="${I0 ? 'hi' : ''}">Marche</i> OR <i class="${M ? 'hi' : ''}">Moteur</i>) AND <i class="${I1 ? 'hi' : ''}">Arret_NF</i>;

<span class="cm">(* écriture équivalente *)</span>
IF NOT <i class="${I1 ? 'hi' : ''}">Arret_NF</i> THEN
    <b>Moteur</b> := FALSE;
ELSIF <i class="${I0 ? 'hi' : ''}">Marche</i> THEN
    <b>Moteur</b> := TRUE;
END_IF;</pre>`;
      } else {
        v.innerHTML = `<svg viewBox="0 0 520 190" class="lang-svg"><rect x="60" y="15" width="40" height="40" fill="${step === 0 ? 'color-mix(in srgb, var(--copper) 30%, transparent)' : 'none'}" stroke="var(--sch-ink)" stroke-width="2"/><rect x="65" y="20" width="30" height="30" fill="none" stroke="var(--sch-ink)" stroke-width="1.5"/><text x="80" y="41" text-anchor="middle">0</text>
          <path d="M80 55 V80" stroke="var(--sch-ink)" stroke-width="2"/><path d="M64 80 H96" stroke="${step === 0 && I0 && I1 ? 'var(--warn)' : 'var(--sch-ink)'}" stroke-width="3.5"/><text x="104" y="84">Marche AND Arret_NF</text><path d="M80 80 V110" stroke="var(--sch-ink)" stroke-width="2"/>
          <rect x="60" y="110" width="40" height="40" fill="${step === 1 ? 'color-mix(in srgb, var(--copper) 30%, transparent)' : 'none'}" stroke="var(--sch-ink)" stroke-width="2"/><text x="80" y="136" text-anchor="middle">1</text><path d="M100 130 H130" stroke="var(--sch-ink)" stroke-width="2"/><rect x="130" y="115" width="120" height="30" fill="${step === 1 ? 'color-mix(in srgb, var(--ok) 30%, transparent)' : 'none'}" stroke="var(--sch-ink)" stroke-width="1.6"/><text x="190" y="135" text-anchor="middle">N  Moteur</text>
          <path d="M80 150 V172" stroke="var(--sch-ink)" stroke-width="2"/><path d="M64 172 H96" stroke="var(--sch-ink)" stroke-width="3.5"/><text x="104" y="176">NOT Arret_NF</text><path d="M80 172 V184 H30 V5 H80 V15" stroke="var(--sch-ink)" stroke-width="2" fill="none"/></svg>`;
        M = step === 1; el.querySelector('.js-q').textContent = 'Moteur = ' + (M ? 1 : 0);
      }
    }
    draw();
  };

  /* ---------- Bloc fonctionnel instancié trois fois ---------- */
  SIMS.fbinst = el => {
    const inst = ['Pompe_1', 'Pompe_2', 'Ventilateur'].map(n => ({ n, run: false, def: false, al: false, starts: 0 }));
    const render = () => {
      el.innerHTML = `<div class="simcard"><div class="fb-grid">${inst.map((x, i) => `<div class="fb-card ${x.run ? 'run' : ''} ${x.al ? 'al' : ''}"><p class="eyebrow">Instance ${esc(x.n)} : FB_Moteur</p>
        <div class="row"><button class="btn sm primary" data-a="m" data-i="${i}">Marche</button><button class="btn sm" data-a="a" data-i="${i}">Arrêt</button><button class="btn sm ghost" data-a="d" data-i="${i}">${x.def ? 'Réparer le thermique' : 'Déclencher le thermique'}</button><button class="btn sm ghost" data-a="r" data-i="${i}">Acquitter</button></div>
        <pre class="lang-st">Marche_cmd  : ${x.run ? 'TRUE ' : 'FALSE'}
Défaut_th   : ${x.def ? 'TRUE ' : 'FALSE'}
Alarme      : ${x.al ? 'TRUE ' : 'FALSE'}
Nb_démarrages : ${x.starts}</pre></div>`).join('')}</div>
        <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Un seul bloc FB_Moteur est écrit et testé une fois ; chaque instance garde ses propres données (variables internes, compteur de démarrages). Une alarme reste mémorisée jusqu'à l'acquittement, même si le défaut a disparu, et interdit le redémarrage.</p></div>`;
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const x = inst[+b.dataset.i], a = b.dataset.a;
        if (a === 'm' && !x.al && !x.def) { if (!x.run) x.starts++; x.run = true; }
        if (a === 'a') x.run = false;
        if (a === 'd') { x.def = !x.def; if (x.def) { x.run = false; x.al = true; } }
        if (a === 'r' && !x.def) x.al = false;
        render();
      });
    };
    render();
  };

  /* ---------- Boucle 4-20 mA ---------- */
  SIMS.loop420 = el => {
    const st = { x: 6, Vs: 24, R: 250, Um: 10, L: 100 }; let cut = false, kind = 'ma';
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-k"><button data-v="ma" class="on">4-20 mA</button><button data-v="v">0-10 V</button></div><label class="chk"><input type="checkbox" class="js-c"><span>Couper le fil du capteur</span></label></div><div class="simview"></div>
      <div class="simctl">${sl('x', 'Pression mesurée (capteur 0-10 bar)', 0, 10, 0.1, 6, 'bar')}${sl('Vs', 'Alimentation de la boucle', 12, 30, 0.5, 24, 'V')}${sl('R', 'Résistance de boucle (entrée + câble)', 50, 1200, 10, 250, 'Ω')}${sl('Um', 'Tension minimale du transmetteur (notice)', 8, 16, 0.5, 10, 'V')}${sl('L', 'Longueur de câble (pour le 0-10 V)', 5, 500, 5, 100, 'm')}</div>
      <div class="simout"><div><span>Signal</span><b class="o-s"></b></div><div><span>Valeur lue par l'automate</span><b class="o-v"></b></div><div><span>Résistance de boucle maximale</span><b class="o-r"></b></div></div>
      <p class="js-d" style="padding:0 16px 14px;font-size:14px"></p></div>`;
    bind(el, st, { x: v => AA.fmt(v, 1) });
    segB(el, '.js-k', v => { kind = v; });
    el.querySelector('.js-c').onchange = e => { cut = e.target.checked; };
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W, H, t) => {
      let sig, val, msg, ok = true;
      const Rmax = (st.Vs - st.Um) / 0.02;
      if (kind === 'ma') {
        const need = N.ma(st.x, 0, 10), Imax = Math.max(0, (st.Vs - st.Um) / st.R * 1000), I = cut ? 0 : Math.min(need, Imax);
        sig = AA.fmt(I, 2) + ' mA'; val = (I >= 3.6 && I <= 21) ? AA.fmt(N.scale(I, 4, 20, 0, 10), 2) + ' bar' : 'DÉFAUT';
        msg = cut ? 'Fil coupé : courant nul, très en dessous de 3,6 mA. L\'automate signale la rupture : c\'est le grand avantage du « zéro vivant » à 4 mA.' : I < need - 1e-6 ? `Boucle trop résistante : le transmetteur ne peut pas débiter plus de ${AA.fmt(Imax, 1)} mA, la mesure est fausse en haut d'échelle. Réduire la résistance ou augmenter l'alimentation.` : 'Le courant ne dépend pas de la longueur ni de la résistance du câble (tant que la boucle peut le fournir) : signal robuste sur de longues distances.';
        ok = !cut && I >= need - 1e-6;
      } else {
        const U = cut ? 0 : st.x, Rc = 2 * 0.0178 * st.L / 0.75, drop = U / 10 * 0.001 * Rc; // entrée 10 kΩ → 1 mA à 10 V
        sig = AA.fmt(U - drop, 3) + ' V'; val = AA.fmt(N.scale(U - drop, 0, 10, 0, 10), 2) + ' bar';
        msg = cut ? 'Fil coupé : 0 V, soit 0 bar. L\'automate ne peut pas distinguer une rupture d\'une pression nulle !' : `Chute de tension dans ${st.L} m de câble 0,75 mm² vers une entrée de 10 kΩ : ${AA.fmt(drop * 1000, 1)} mV d'erreur. Faible ici, mais le 0-10 V reste sensible aux parasites et aux longueurs.`;
      }
      el.querySelector('.o-s').textContent = sig; el.querySelector('.o-v').textContent = val; el.querySelector('.o-r').textContent = kind === 'ma' ? AA.fmt(Rmax, 0) + ' Ω' : '—';
      el.querySelector('.js-d').innerHTML = `<span class="${ok ? 'ok-t' : 'bad-t'}">${msg}</span>`;
      g.fillStyle = css('--surface-3'); g.fillRect(20, 35, 80, 50); g.fillStyle = css('--ink'); g.font = '600 11px Segoe UI'; g.fillText('Capteur', 34, 64);
      g.fillRect(W - 110, 35, 90, 50); g.fillStyle = css('--surface'); g.fillText('Automate', W - 92, 64);
      g.strokeStyle = cut ? css('--bad') : css('--copper'); g.lineWidth = 3; g.setLineDash(cut ? [] : [6, 6]); g.lineDashOffset = -t * 40;
      g.beginPath(); g.moveTo(100, 50); g.lineTo(cut ? W / 2 - 10 : W - 110, 50); g.stroke(); if (cut) { g.beginPath(); g.moveTo(W / 2 + 10, 50); g.lineTo(W - 110, 50); g.stroke(); }
      g.setLineDash([]); g.strokeStyle = css('--ink-3'); g.lineWidth = 2; g.beginPath(); g.moveTo(100, 72); g.lineTo(W - 110, 72); g.stroke();
    });
    return cv.stop;
  };

  /* ---------- Mise à l'échelle ---------- */
  SIMS.scaling = el => {
    const st = { raw: 13824, r0: 0, r1: 27648, y0: 0, y1: 150 };
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('raw', 'Valeur brute lue sur la carte', 0, 32000, 16, 13824, 'points')}${sl('r0', 'Brut au bas d\'échelle', 0, 8000, 16, 0, 'points')}${sl('r1', 'Brut au haut d\'échelle', 10000, 32000, 16, 27648, 'points')}${sl('y0', 'Grandeur au bas d\'échelle', -50, 50, 1, 0, '')}${sl('y1', 'Grandeur au haut d\'échelle', 10, 500, 1, 150, '')}</div>
      <div class="simout"><div><span>Grandeur physique</span><b class="o-y"></b></div><div><span>Pente</span><b class="o-p"></b></div></div>
      <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Exemple : une carte d'entrées convertit 0-20 mA ou 0-10 V en un nombre (de 0 à 27 648 sur de nombreux automates Siemens ; d'autres marques utilisent 0-32 000, 0-4 000…). Pour du 4-20 mA sur une échelle 0-20 mA, le brut au bas d'échelle vaut 27 648 × 4/20 = 5 530.</p></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 180, (g, W, H) => {
      const y = N.scale(st.raw, st.r0, st.r1, st.y0, st.y1), p = (st.y1 - st.y0) / (st.r1 - st.r0);
      el.querySelector('.o-y').textContent = AA.fmt(y, 2); el.querySelector('.o-p').textContent = AA.fmt(p, 5) + ' par point';
      const x0 = 50, x1 = W - 20, yb = H - 26, yt = 14, X = r => x0 + r / 32000 * (x1 - x0), ymin = Math.min(st.y0, 0, y), ymax = Math.max(st.y1, y, 1), Y = v => yb - (v - ymin) / (ymax - ymin) * (yb - yt);
      g.strokeStyle = css('--line'); g.beginPath(); g.moveTo(x0, yb); g.lineTo(x1, yb); g.moveTo(x0, yb); g.lineTo(x0, yt); g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(N.scale(0, st.r0, st.r1, st.y0, st.y1))); g.lineTo(X(32000), Y(N.scale(32000, st.r0, st.r1, st.y0, st.y1))); g.stroke();
      g.fillStyle = css('--ok'); g.beginPath(); g.arc(X(st.raw), Y(y), 6, 0, 7); g.fill();
      g.strokeStyle = css('--teal'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(st.r0), yb); g.lineTo(X(st.r0), yt); g.moveTo(X(st.r1), yb); g.lineTo(X(st.r1), yt); g.stroke(); g.setLineDash([]);
      g.fillStyle = css('--ink-3'); g.font = '500 10px Segoe UI'; g.fillText('brut', x1 - 24, yb + 14); g.fillText('grandeur', 4, yt + 4);
    });
    return cv.stop;
  };

  /* ---------- Pt100 : 2, 3 ou 4 fils ---------- */
  SIMS.pt100 = el => {
    const st = { t: 80, L: 20, S: 0.5 }; let w = 2;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><div class="seg js-w"><button data-v="2" class="on">2 fils</button><button data-v="3">3 fils</button><button data-v="4">4 fils</button></div>${sl('t', 'Température réelle', 0, 400, 1, 80, '°C')}${sl('L', 'Longueur du câble', 1, 200, 1, 20, 'm')}${sl('S', 'Section des conducteurs', 0.22, 1.5, 0.01, 0.5, 'mm²')}</div>
      <div class="simout"><div><span>Résistance de la sonde</span><b class="o-r"></b></div><div><span>Résistance vue par l'appareil</span><b class="o-m"></b></div><div><span>Température affichée</span><b class="o-t"></b></div></div></div>`;
    bind(el, st, { S: v => AA.fmt(v, 2) });
    segB(el, '.js-w', v => { w = +v; });
    const cv = AA.canvas(el.querySelector('.simview'), 120, (g, W, H) => {
      const Rt = N.ptR(st.t), Rc = 0.0178 * st.L / st.S, Rm = w === 2 ? Rt + 2 * Rc : Rt, tm = N.ptT(Rm);
      el.querySelector('.o-r').textContent = AA.fmt(Rt, 2) + ' Ω'; el.querySelector('.o-m').textContent = AA.fmt(Rm, 2) + ' Ω'; el.querySelector('.o-t').innerHTML = AA.fmt(tm, 1) + ' °C' + (Math.abs(tm - st.t) > 0.3 ? ` <small class="bad-t">erreur ${AA.fmt(tm - st.t, 1)} °C</small>` : '');
      g.fillStyle = css('--copper'); g.fillRect(20, H / 2 - 10, 60, 20); g.fillStyle = css('--ink'); g.font = '600 11px Segoe UI'; g.fillText('Pt100', 30, H / 2 + 4);
      for (let k = 0; k < w; k++) { g.strokeStyle = [css('--bad'), css('--bad'), css('--ink'), css('--ink')][k]; g.lineWidth = 2; const y = H / 2 - 18 + k * 12; g.beginPath(); g.moveTo(80, y); g.lineTo(W - 120, y); g.stroke(); }
      g.fillStyle = css('--surface-3'); g.fillRect(W - 120, H / 2 - 30, 100, 60); g.fillStyle = css('--ink'); g.fillText('Transmetteur', W - 112, H / 2 + 4);
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText(w === 2 ? 'Les deux conducteurs s\'ajoutent à la sonde : erreur.' : w === 3 ? 'Le 3e fil permet de soustraire la résistance des conducteurs (supposés identiques).' : 'Courant par deux fils, mesure de tension par deux autres : aucune influence des câbles.', 20, H - 8);
    });
    return cv.stop;
  };

  /* ---------- Filtrage et seuil à hystérésis ---------- */
  SIMS.filtre = el => {
    const st = { noise: 4, tau: 1, hy: 2, th: 50 };
    const hist = []; let y = 40, out = false, flips = 0, tlast = 0, ph = 0;
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl">${sl('noise', 'Bruit sur la mesure', 0, 10, 0.5, 4, '%')}${sl('tau', 'Constante de temps du filtre τ', 0, 5, 0.1, 1, 's')}${sl('th', 'Seuil d\'alarme', 30, 70, 1, 50, '%')}${sl('hy', 'Hystérésis', 0, 10, 0.5, 2, '%')}</div>
      <div class="simout"><div><span>Changements d'état de l'alarme (dernières 10 s)</span><b class="o-f"></b></div></div></div>`;
    bind(el, st, {});
    const cv = AA.canvas(el.querySelector('.simview'), 200, (g, W, H, t) => {
      const dt = 0.05; if (t - tlast < dt) { /* rien */ } else {
        tlast = t; ph += dt;
        const x = 50 + 12 * Math.sin(ph * 0.4) + st.noise * (Math.random() * 2 - 1) * 1.7;
        y = st.tau > 0 ? N.filt(y, x, dt, st.tau) : x;
        const on = out ? y > st.th - st.hy : y > st.th; if (on !== out) { out = on; hist.push({ flip: t }); }
        hist.push({ x, y, out }); while (hist.length > 220) hist.shift();
      }
      const flipsNow = hist.filter(h => h.flip && t - h.flip < 10).length; el.querySelector('.o-f').textContent = flipsNow + (flipsNow > 6 ? ' — l\'alarme « bat » : augmenter l\'hystérésis ou filtrer' : '');
      const pts = hist.filter(h => h.x != null), X = i => 10 + i / 220 * (W - 20), Y = v => H - 10 - (v - 25) / 50 * (H - 20);
      g.strokeStyle = css('--line-2'); g.lineWidth = 1; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(i), Y(p.x)) : g.moveTo(X(i), Y(p.x))); g.stroke();
      g.strokeStyle = css('--copper'); g.lineWidth = 2.4; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(i), Y(p.y)) : g.moveTo(X(i), Y(p.y))); g.stroke();
      g.strokeStyle = css('--bad'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(10, Y(st.th)); g.lineTo(W - 10, Y(st.th)); g.stroke(); if (st.hy) { g.strokeStyle = css('--warn'); g.beginPath(); g.moveTo(10, Y(st.th - st.hy)); g.lineTo(W - 10, Y(st.th - st.hy)); g.stroke(); } g.setLineDash([]);
      pts.forEach((p, i) => { if (p.out) { g.fillStyle = 'rgba(220,60,80,.18)'; g.fillRect(X(i), 4, (W - 20) / 220 + 1, 6); } });
      g.fillStyle = css('--ink-3'); g.font = '500 10.5px Segoe UI'; g.fillText('gris : mesure brute — trait plein : mesure filtrée — bande rouge en haut : alarme active', 12, H - 14);
    });
    return cv.stop;
  };

  /* ---------- Régulation : boucle ouverte / PID ---------- */
  SIMS.pid = (el, o) => {
    const st = { sp: 60, Kp: 2, Ti: 15, Td: 0, man: 40, dead: 3 }; let proc = (o && o.proc) || 'thermique', mode = (o && o.mode) || 'auto', dist = 0;
    let pv = 20, u = 0, s = N.pidNew(), buf = [], hist = [], acc = 0, last = 0, simT = 0;
    el.innerHTML = `<div class="simcard"><div class="simctl"><div class="seg js-m"><button data-v="man" class="${mode === 'man' ? 'on' : ''}">Boucle ouverte (manuel)</button><button data-v="auto" class="${mode === 'auto' ? 'on' : ''}">Boucle fermée (PID)</button></div>
      <div class="seg js-p"><button data-v="thermique" class="${proc === 'thermique' ? 'on' : ''}">Four (1er ordre + retard)</button><button data-v="niveau" class="${proc === 'niveau' ? 'on' : ''}">Cuve (intégrateur)</button></div><button class="btn sm js-d">Perturbation</button><button class="btn sm ghost js-r">Recommencer</button></div>
      <div class="simview"></div><div class="simctl">${sl('sp', 'Consigne', 0, 100, 1, 60, '%')}${sl('man', 'Commande manuelle', 0, 100, 1, 40, '%')}${sl('Kp', 'Gain proportionnel K<sub>p</sub>', 0, 10, 0.1, 2, '')}${sl('Ti', 'Temps intégral T<sub>i</sub> (0 = sans I)', 0, 60, 0.5, 15, 's')}${sl('Td', 'Temps dérivé T<sub>d</sub>', 0, 10, 0.1, 0, 's')}${sl('dead', 'Retard pur du procédé', 0, 10, 0.5, 3, 's')}</div>
      <div class="simout"><div><span>Mesure</span><b class="o-pv"></b></div><div><span>Écart consigne − mesure</span><b class="o-e"></b></div><div><span>Commande (P + I + D)</span><b class="o-u"></b></div></div></div>`;
    bind(el, st, { Kp: v => AA.fmt(v, 1), Td: v => AA.fmt(v, 1) });
    segB(el, '.js-m', v => { mode = v; s = N.pidNew(); s.I = u; });
    segB(el, '.js-p', v => { proc = v; reset(); });
    el.querySelector('.js-d').onclick = () => { dist = dist ? 0 : 1; el.querySelector('.js-d').textContent = dist ? 'Retirer la perturbation' : 'Perturbation'; };
    const reset = () => { pv = proc === 'thermique' ? 20 : 30; u = 0; s = N.pidNew(); buf = []; hist = []; simT = 0; };
    el.querySelector('.js-r').onclick = reset;
    reset();
    let parts = { P: 0, I: 0, D: 0 };
    const stepSim = dt => {
      simT += dt;
      if (mode === 'auto') { const r = N.pidStep(s, st, st.sp, pv, dt); u = r.u; parts = r; } else { u = st.man; parts = { P: 0, I: 0, D: 0 }; }
      buf.push(u); const lag = Math.round(st.dead / dt); while (buf.length > lag + 1) buf.shift(); const ud = buf[0];
      if (proc === 'thermique') { const amb = 20, K = 0.8, tau = 20; pv += ((amb + K * ud - dist * 25) - pv) / tau * dt; }
      else { pv += (0.02 * ud - 0.6 - dist * 0.5) * dt * 0.9; pv = Math.max(0, Math.min(100, pv)); }
      hist.push([simT, pv, st.sp, u]); while (hist.length > 1200) hist.shift();
    };
    const cv = AA.canvas(el.querySelector('.simview'), 230, (g, W, H, t) => {
      const real = last ? Math.min(0.1, t - last) : 0; last = t; acc += real * 6; // temps accéléré × 6
      while (acc >= 0.05) { stepSim(0.05); acc -= 0.05; }
      el.querySelector('.o-pv').textContent = AA.fmt(pv, 1) + ' %'; el.querySelector('.o-e').textContent = AA.fmt(st.sp - pv, 1) + ' %'; el.querySelector('.o-u').innerHTML = AA.fmt(u, 1) + ' %' + (mode === 'auto' ? ` <small style="font-size:12px;color:var(--ink-3)">P ${AA.fmt(Math.round(parts.P) || 0, 0)} · I ${AA.fmt(Math.round(parts.I) || 0, 0)} · D ${AA.fmt(Math.round(parts.D) || 0, 0)}</small>` : '');
      const span = 60, t1 = simT, t0 = Math.max(0, t1 - span), X = tt => 40 + (tt - t0) / span * (W - 50), Y = v => H - 22 - v / 110 * (H - 34);
      g.strokeStyle = css('--line'); g.lineWidth = 1; g.font = '500 10px Segoe UI'; g.fillStyle = css('--ink-3'); [0, 50, 100].forEach(v => { g.beginPath(); g.moveTo(40, Y(v)); g.lineTo(W - 10, Y(v)); g.stroke(); g.fillText(v + ' %', 4, Y(v) + 4); });
      const line = (k, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); let f = true; hist.forEach(h => { if (h[0] < t0) return; f ? g.moveTo(X(h[0]), Y(h[k])) : g.lineTo(X(h[0]), Y(h[k])); f = false; }); g.stroke(); g.setLineDash([]); };
      line(3, css('--line-2'), 1.6); line(2, css('--teal'), 1.6, [6, 4]); line(1, css('--copper'), 2.6);
      g.fillStyle = css('--copper'); g.fillText('mesure', W - 120, 14); g.fillStyle = css('--teal'); g.fillText('consigne', W - 74, 14); g.fillStyle = css('--ink-3'); g.fillText('commande', W - 180, 14); g.fillText('60 s (accéléré)', 44, H - 6);
    });
    return cv.stop;
  };

  /* ---------- Relais de sécurité à double canal ---------- */
  SIMS.safety = el => {
    let au = false, stuck2 = false, weld = false, out = false, disc = false, msg = 'Machine arrêtée. Réarme pour autoriser la marche.';
    const render = () => {
      const ch1 = !au, ch2 = !au || stuck2, fb = !weld;
      el.innerHTML = `<div class="simcard"><div class="simview js-sv"></div><div class="simctl"><button class="btn sm js-au" style="border-color:var(--bad);color:var(--bad)">${au ? 'Déverrouiller l\'AU' : 'Appuyer sur l\'AU'}</button><button class="btn sm primary js-r">Réarmer</button>
        <label class="chk"><input type="checkbox" class="js-s" ${stuck2 ? 'checked' : ''}><span>Contact du canal 2 collé</span></label><label class="chk"><input type="checkbox" class="js-w" ${weld ? 'checked' : ''}><span>Contacts de KM1 soudés</span></label></div>
        <p style="padding:0 16px 8px;font-size:14px" class="${out ? 'ok-t' : 'bad-t'}">${msg}</p>
        <p class="muted" style="padding:0 16px 14px;font-size:12.5px">Canal 1 : ${ch1 ? 'fermé' : 'ouvert'} · Canal 2 : ${ch2 ? 'fermé' : 'ouvert'} · Boucle de retour (contacts NF de KM1 et KM2) : ${fb && !out ? 'fermée' : out ? '—' : 'ouverte'}. Comportement typique d'un relais de sécurité à double canal avec contrôle des contacteurs ; le détail dépend du modèle (notice).</p></div>`;
      el.querySelector('.js-au').onclick = () => {
        au = !au;
        if (au) { out = false; disc = stuck2; if (stuck2) { disc = true; msg = 'AU actionné : le canal 1 s\'ouvre et coupe la machine, mais le canal 2 reste fermé. Le relais détecte la discordance et se verrouille.'; } else msg = 'AU actionné : les deux canaux s\'ouvrent, les contacteurs retombent. Arrêt de catégorie 0.'; }
        else msg = disc ? 'AU déverrouillé, mais la discordance est mémorisée : le réarmement sera refusé tant que le défaut n\'est pas réparé et qu\'un nouvel appui n\'a pas ouvert les deux canaux.' : 'AU déverrouillé. La machine ne redémarre pas seule : il faut un réarmement volontaire.';
        render();
      };
      el.querySelector('.js-r').onclick = () => {
        if (au) msg = 'Réarmement refusé : l\'AU est encore enfoncé.';
        else if (disc) msg = 'Réarmement refusé : discordance entre les canaux (contact collé, fil en court-circuit).';
        else if (weld) msg = 'Réarmement refusé : la boucle de retour est ouverte, un contacteur est resté collé (contacts soudés). KM2, en série, a bien coupé le moteur : c\'est la redondance.';
        else { out = true; msg = 'Réarmement accepté : les contacteurs peuvent être commandés.'; }
        render();
      };
      el.querySelector('.js-s').onchange = e => { stuck2 = e.target.checked; render(); }; // réparé : la discordance est levée au prochain appui qui ouvre les deux canaux
      el.querySelector('.js-w').onchange = e => { weld = e.target.checked; render(); };
      const sv = el.querySelector('.js-sv');
      sv.innerHTML = `<svg viewBox="0 0 520 120" class="lang-svg"><rect x="20" y="30" width="70" height="60" rx="8" fill="none" stroke="var(--bad)" stroke-width="2"/><text x="55" y="65" text-anchor="middle">AU</text>
        <path d="M90 45 H200" stroke="${ch1 ? 'var(--copper)' : 'var(--sch-dim)'}" stroke-width="2.6"/><path d="M90 75 H200" stroke="${ch2 ? 'var(--copper)' : 'var(--sch-dim)'}" stroke-width="2.6"/><text x="120" y="38">canal 1</text><text x="120" y="98">canal 2</text>
        <rect x="200" y="25" width="110" height="70" rx="6" fill="${out ? 'color-mix(in srgb, var(--ok) 25%, transparent)' : 'none'}" stroke="var(--sch-ink)" stroke-width="2"/><text x="255" y="58" text-anchor="middle">Relais de</text><text x="255" y="74" text-anchor="middle">sécurité</text>
        <path d="M310 60 H360" stroke="${out ? 'var(--copper)' : 'var(--sch-dim)'}" stroke-width="2.6"/><rect x="360" y="30" width="60" height="26" rx="4" fill="${out || weld ? 'color-mix(in srgb, var(--copper) 25%, transparent)' : 'none'}" stroke="var(--sch-ink)"/><text x="390" y="48" text-anchor="middle">KM1${weld ? ' ⚠' : ''}</text><rect x="360" y="64" width="60" height="26" rx="4" fill="${out ? 'color-mix(in srgb, var(--copper) 25%, transparent)' : 'none'}" stroke="var(--sch-ink)"/><text x="390" y="82" text-anchor="middle">KM2</text>
        <circle cx="470" cy="60" r="22" fill="${out ? 'color-mix(in srgb, var(--ok) 30%, transparent)' : 'none'}" stroke="var(--sch-ink)" stroke-width="2"/><text x="470" y="65" text-anchor="middle">M</text></svg>`;
    };
    render();
  };

  /* ---------- Alarmes (cycle de vie ISA-18.2 / IEC 62682) ---------- */
  SIMS.alarmes = el => {
    let cond = false, ack = true, state = 'Normal';
    const upd = () => { state = cond ? (ack ? 'Active acquittée' : 'Active non acquittée') : (ack ? 'Normal' : 'Revenue à la normale, non acquittée'); };
    const render = () => {
      upd();
      el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><button class="btn sm js-c">${cond ? 'Faire disparaître le défaut' : 'Provoquer le défaut (niveau très haut)'}</button><button class="btn sm primary js-a">Acquitter</button></div>
        <p style="padding:0 16px 14px;font-size:14px"><b>État : ${state}.</b> ${state === 'Normal' ? 'Rien à signaler.' : state === 'Active non acquittée' ? 'Le voyant clignote : l\'opérateur n\'a pas encore pris connaissance de l\'alarme.' : state === 'Active acquittée' ? 'Voyant fixe : l\'opérateur a vu l\'alarme, le défaut est toujours présent.' : 'Le défaut a disparu, mais personne ne l\'a vu : le voyant clignote lentement jusqu\'à l\'acquittement.'}</p></div>`;
      el.querySelector('.js-c').onclick = () => { cond = !cond; if (cond) ack = false; render(); };
      el.querySelector('.js-a').onclick = () => { ack = true; render(); };
      cv = AA.canvas(el.querySelector('.simview'), 110, (g, W, H, t) => {
        const blink = state === 'Active non acquittée' ? Math.floor(t * 3) % 2 === 0 : state.startsWith('Revenue') ? Math.floor(t * 1) % 2 === 0 : state === 'Active acquittée';
        g.fillStyle = blink ? css('--bad') : css('--surface-3'); g.beginPath(); g.arc(60, H / 2, 26, 0, 7); g.fill();
        const S = ['Normal', 'Active non acquittée', 'Active acquittée', 'Revenue à la normale, non acquittée'];
        S.forEach((n, i) => { const x = 120 + i * ((W - 140) / 4); g.fillStyle = n === state ? css('--copper') : css('--surface-3'); g.fillRect(x, H / 2 - 16, (W - 140) / 4 - 8, 32); g.fillStyle = n === state ? '#fff' : css('--ink-2'); g.font = '600 10px Segoe UI'; g.fillText(n.length > 22 ? n.slice(0, 21) + '…' : n, x + 6, H / 2 + 4); });
      });
    };
    let cv = null; render();
    return () => { if (cv) cv.stop(); };
  };

  Object.assign(AA.VISDATA.ORDER, {
    struct: { title: 'Structure courante d\'un programme : remets les blocs dans l\'ordre du cycle', steps: [['Lecture et conditionnement des entrées (filtrage, mise à l\'échelle)', 'On travaille ensuite sur des valeurs propres et cohérentes.'], ['Modes de marche et sécurités logicielles (GEMMA)', 'Ils autorisent ou interdisent les séquences.'], ['Séquences (Grafcet) et régulations', 'Le cœur du fonctionnement.'], ['Écriture des sorties à partir des étapes et des modes', 'Une seule affectation par sortie, à un seul endroit.'], ['Alarmes, diagnostic et données pour la supervision', 'Elles exploitent tout ce qui précède.']] },
    mes: { title: 'Mise en service d\'une installation automatisée : quel ordre ?', steps: [['Contrôles hors tension : câblage, serrage, continuité, isolement', 'Rien ne se met sous tension avant.'], ['Mise sous tension et contrôle des alimentations', 'Tensions de commande, 24 V, protections.'], ['Test des sécurités câblées (arrêts d\'urgence, protecteurs)', 'Les sécurités d\'abord, avant tout mouvement.'], ['Test des entrées puis des sorties, une par une', 'Le forçage se fait machine sécurisée, avec prudence.'], ['Essais à vide, puis en charge, cycle par cycle', 'Montée en puissance progressive.'], ['Sauvegarde du programme et mise à jour du dossier', 'La version installée doit être archivée et documentée.']] }
  });

  Object.assign(AA.SIMFORM, {
    langs: ['Moteur := (Marche OR Moteur) AND Arret_NF', 'Même équation en LD (contacts), FBD (blocs ≥1 et &), ST (texte), SFC (étapes)'],
    loop420: ['I = 4 + 16 × (x − x<sub>min</sub>) / (x<sub>max</sub> − x<sub>min</sub>) mA', 'R<sub>boucle max</sub> = (U<sub>alim</sub> − U<sub>min transmetteur</sub>) / 0,020 A', 'Défaut si I < 3,6 mA ou I > 21 mA (NAMUR NE 43)'],
    scaling: ['y = y<sub>min</sub> + (brut − brut<sub>min</sub>) × (y<sub>max</sub> − y<sub>min</sub>) / (brut<sub>max</sub> − brut<sub>min</sub>)'],
    pt100: ['R(t) = 100 × (1 + A t + B t²), A = 3,9083 × 10⁻³, B = −5,775 × 10⁻⁷ (IEC 60751, t ≥ 0 °C)', 'Sensibilité ≈ 0,385 Ω/°C ; en 2 fils, R<sub>vue</sub> = R(t) + 2 ρ L / S'],
    filtre: ['y<sub>k</sub> = y<sub>k−1</sub> + T<sub>e</sub> / (τ + T<sub>e</sub>) × (x<sub>k</sub> − y<sub>k−1</sub>)', 'Hystérésis : l\'alarme s\'active au-dessus du seuil et ne retombe qu\'en dessous de (seuil − hystérésis)'],
    pid: ['u = K<sub>p</sub> × ( e + (1/T<sub>i</sub>) ∫ e dt + T<sub>d</sub> de/dt ),  e = consigne − mesure', 'Ici : dérivée calculée sur la mesure (pas de « coup » au changement de consigne), intégrale bloquée quand la commande est en butée']
  });

  /* ================= Leçons ================= */
  L.n7m1l1 = { min: 9, why: "Le Ladder reste le langage le plus lu par les électriciens de maintenance : il ressemble à un schéma.", screens: [[
    { h: 'Ladder (LD)' },
    { p: "Deux rails verticaux, des lignes (rungs) parcourues de gauche à droite : contacts à fermeture et à ouverture, bobines, blocs. Idéal pour la logique combinatoire et les verrouillages, plus pénible pour les calculs et les séquences longues." }
  ]] };
  L.n7m1l2 = { min: 9, why: "Les blocs fonctionnels montrent les flux de signaux : parfaits pour l'analogique et la régulation.", screens: [[
    { h: 'Blocs fonctionnels (FBD)' },
    { p: "Des blocs (ET, OU, temporisations, PID, comparateurs) reliés par des fils de signal. Le schéma se lit comme un circuit logique : on voit d'où vient chaque information." }
  ]] };
  L.n7m1l3 = { min: 10, why: "Calculs, boucles, tableaux, recettes : le texte structuré fait en dix lignes ce qui prendrait des pages de Ladder.", screens: [[
    { h: 'Texte structuré (ST)' },
    { p: "Langage proche du Pascal : affectations <code>:=</code>, <code>IF … THEN … ELSIF … END_IF</code>, <code>CASE</code>, <code>FOR</code>, <code>WHILE</code>. Attention : une boucle trop longue allonge le temps de cycle de l'automate, qui peut alors passer en défaut (chien de garde)." }
  ]] };
  L.n7m1l4 = { min: 9, why: "Le SFC est le Grafcet programmé : la séquence que l'on dessine est celle qui s'exécute.", screens: [[
    { h: 'SFC : le Grafcet programmé' },
    { p: "Étapes, transitions et actions, comme le Grafcet de l'IEC 60848, mais exécutables par l'automate. Les réceptivités et actions s'écrivent dans les autres langages (ST, LD). Le SFC de l'IEC 61131-3 et le Grafcet de l'IEC 60848 sont proches mais pas identiques (règles de franchissement simultané, qualificatifs d'actions)." }
  ]] };
  L.n7m1l5 = { min: 10, why: "Écrire une fois, tester une fois, réutiliser partout : c'est ce qui rend un programme fiable et maintenable.", screens: [[
    { h: 'Fonctions et blocs réutilisables' },
    { list: ['<b>Fonction (FC / FUN)</b> : sans mémoire ; mêmes entrées → même résultat (exemple : mise à l\'échelle).', '<b>Bloc fonctionnel (FB)</b> : avec mémoire interne ; chaque <b>instance</b> possède ses propres données (exemple : temporisation, commande de moteur).', 'Un FB « Moteur » bien conçu gère marche, arrêt, défaut thermique, alarme et compteur de démarrages, pour tous les moteurs de l\'usine.'] }
  ]] };
  L.n7m2l1 = { min: 11, why: "Un capteur analogique mal câblé donne une valeur fausse… qui a l'air juste.", screens: [[
    { h: 'Signaux 0-10 V et 4-20 mA' },
    { table: { head: ['', '0-10 V', '4-20 mA'], rows: [['Grandeur transmise', 'Tension', 'Courant (identique en tout point de la boucle)'], ['Longueur de câble', 'Limitée (chutes de tension, parasites)', 'Grandes distances'], ['Rupture de fil', 'Lue comme 0 : indétectable', 'Détectée (I < 3,6 mA)'], ['Capteur 2 fils', 'Non', 'Oui : la boucle alimente le transmetteur']] } },
    { num: { id: 'ma', gen: r => { const max = r.pick([6, 10, 16, 25]), x = Math.round(r.pick([0.2, 0.35, 0.5, 0.65, 0.8]) * max * 10) / 10; return { q: `Transmetteur de pression 0-${max} bar, 4-20 mA. Pression <b>${AA.fmt(x)} bar</b>. Courant ?`, a: N.ma(x, 0, max), unit: 'mA', tol: 0.01, sol: `I = 4 + 16 × ${AA.fmt(x)} / ${max} = ${AA.fmt(N.ma(x, 0, max), 2)} mA` }; } } }
  ]] };
  L.n7m2l2 = { min: 10, why: "L'automate ne voit qu'un nombre : c'est le programme qui le transforme en bars, en degrés ou en litres.", screens: [[
    { h: 'Mise à l\'échelle' },
    { formula: 'y = y<sub>min</sub> + (brut − brut<sub>min</sub>) × (y<sub>max</sub> − y<sub>min</sub>) / (brut<sub>max</sub> − brut<sub>min</sub>)' },
    { num: { id: 'sc', gen: r => { const ym = r.pick([100, 150, 250]), raw = r.pick([6912, 13824, 20736]); return { q: `Carte 0-27 648 points, capteur 0-${ym} °C (0 à 20 mA). Valeur brute <b>${raw}</b>. Température ?`, a: N.scale(raw, 0, 27648, 0, ym), unit: '°C', tol: 0.01, sol: `T = ${raw} × ${ym} / 27 648 = ${AA.fmt(N.scale(raw, 0, 27648, 0, ym), 2)} °C` }; } } }
  ]] };
  L.n7m2l3 = { min: 11, why: "Température, pression, niveau : les trois grandeurs les plus mesurées de l'industrie.", screens: [[
    { h: 'Capteurs de température, pression, niveau' },
    { list: ['<b>Pt100</b> : résistance de platine, 100 Ω à 0 °C, environ 138,5 Ω à 100 °C (IEC 60751). Montage 3 ou 4 fils pour annuler la résistance des câbles.', '<b>Thermocouple</b> : tension de quelques dizaines de µV/°C, pour les hautes températures ; nécessite une compensation de soudure froide.', '<b>Pression</b> : capteur à membrane, transmetteur 4-20 mA.', '<b>Niveau</b> : hydrostatique (h = P / (ρ g)), ultrasons, radar, flotteurs, capacitif.'] },
    { num: { id: 'pt', gen: r => { const t = r.pick([25, 50, 80, 120, 200]); return { q: `Résistance d'une Pt100 à <b>${t} °C</b> ?`, a: N.ptR(t), unit: 'Ω', tol: 0.002, sol: `R = 100 × (1 + 3,9083×10⁻³ × ${t} − 5,775×10⁻⁷ × ${t}²) = ${AA.fmt(N.ptR(t), 2)} Ω` }; } } },
    { num: { id: 'hy', gen: r => { const P = r.pick([0.2, 0.35, 0.5, 0.8]); return { q: `Capteur de pression au fond d'une cuve d'eau (ρ = 1 000 kg/m³, g = 9,81 m/s²) : <b>${AA.fmt(P)} bar</b> relatifs. Hauteur d'eau ?`, a: P * 1e5 / (1000 * 9.81), unit: 'm', tol: 0.01, sol: `h = P / (ρ g) = ${AA.fmt(P * 1e5, 0)} / (1 000 × 9,81) = ${AA.fmt(P * 1e5 / 9810, 2)} m` }; } } }
  ]] };
  L.n7m2l4 = { min: 9, why: "Une mesure qui bruite fait battre les alarmes et s'agiter les régulations.", screens: [[
    { h: 'Filtrage et seuils' },
    { p: "Un filtre du premier ordre lisse la mesure mais la retarde : plus τ est grand, plus le signal est calme… et plus il réagit tard. Pour une alarme, on ajoute une hystérésis : elle s'active au-dessus du seuil et ne retombe qu'en dessous du seuil diminué de l'hystérésis." }
  ]] };
  L.n7m3l1 = { min: 9, why: "Sans mesure du résultat, une commande ne peut pas corriger les perturbations.", screens: [[
    { h: 'Boucle ouverte, boucle fermée' },
    { p: "En boucle ouverte, on applique une commande fixe : la grandeur dérive dès qu'une perturbation apparaît (porte du four ouverte, soutirage dans la cuve). En boucle fermée, le régulateur compare en permanence la mesure à la consigne et corrige la commande. Essaie la perturbation dans les deux modes." }
  ]] };
  L.n7m3l2 = { min: 12, why: "Le PID équipe la grande majorité des boucles de régulation industrielles.", screens: [[
    { h: 'Le PID : P, I, D expliqués' },
    { list: ['<b>P</b> : commande proportionnelle à l\'écart. Seul, il laisse souvent un écart permanent ; trop fort, il fait osciller.', '<b>I</b> : accumule l\'écart dans le temps et l\'annule ; trop d\'intégrale (T<sub>i</sub> trop petit) provoque dépassements et oscillations lentes.', '<b>D</b> : réagit à la vitesse de variation, freine les dépassements ; sensible au bruit, souvent laissé à zéro.'] },
    { formula: 'u = K<sub>p</sub> ( e + (1/T<sub>i</sub>) ∫ e dt + T<sub>d</sub> de/dt )' }
  ]] };
  L.n7m3l3 = { min: 11, why: "Un régulateur mal réglé est pire qu'aucun : il fait osciller toute l'installation.", screens: [[
    { h: 'Réglage d\'une boucle' },
    { list: ['Méthode pratique : partir de P seul (T<sub>i</sub> = 0, T<sub>d</sub> = 0), augmenter K<sub>p</sub> jusqu\'à une réponse vive sans oscillation entretenue, puis ajouter l\'intégrale (diminuer T<sub>i</sub>) jusqu\'à annuler l\'écart sans trop dépasser.', 'Méthode de Ziegler-Nichols (boucle fermée) : on cherche le gain critique K<sub>u</sub> qui donne des oscillations entretenues de période T<sub>u</sub>, puis K<sub>p</sub> = 0,6 K<sub>u</sub>, T<sub>i</sub> = T<sub>u</sub>/2, T<sub>d</sub> = T<sub>u</sub>/8. Ce réglage est assez nerveux : on l\'adoucit souvent ensuite.', 'Plus le retard pur du procédé est grand, plus il faut un réglage prudent.'] },
    { num: { id: 'zn', gen: r => { const Ku = r.pick([2, 3.5, 4, 6]), Tu = r.pick([8, 12, 20, 30]); const z = N.zn(Ku, Tu); return { q: `Ziegler-Nichols : gain critique <b>K<sub>u</sub> = ${AA.fmt(Ku)}</b>, période d'oscillation <b>T<sub>u</sub> = ${Tu} s</b>. Temps intégral T<sub>i</sub> ?`, a: z.Ti, unit: 's', tol: 0.01, sol: `K_p = 0,6 × ${AA.fmt(Ku)} = ${AA.fmt(z.Kp, 2)} ; T_i = ${Tu} / 2 = ${AA.fmt(z.Ti)} s ; T_d = ${Tu} / 8 = ${AA.fmt(z.Td, 2)} s` }; } } }
  ]] };
  L.n7m3l4 = { min: 12, why: "Réguler un niveau de cuve résume tout : capteur 4-20 mA, mise à l'échelle, PID, vanne, alarmes.", screens: [[
    { h: 'Régulation de niveau : projet' },
    { p: "Une cuve est un procédé intégrateur : à débit d'entrée constant différent de la sortie, le niveau monte ou descend sans fin. Un régulateur P seul peut suffire à la stabiliser, mais une perturbation (soutirage) laisse alors un écart : l'action intégrale le corrige. Chaîne complète : capteur de niveau 4-20 mA → mise à l'échelle en % → PID → sortie 4-20 mA vers la vanne → alarmes de niveau très haut / très bas câblées en plus, pour la sécurité." }
  ]] };
  L.n7m4l1 = { min: 11, why: "Une fonction de sécurité doit continuer à protéger même quand un composant tombe en panne.", screens: [[
    { h: 'Automates de sécurité et relais de sécurité' },
    { list: ['<b>Relais de sécurité</b> : surveille une fonction (arrêt d\'urgence, protecteur) à deux canaux, détecte les discordances et contrôle les contacteurs (boucle de retour).', '<b>Automate de sécurité</b> : programmable, certifié (IEC 61508, ISO 13849, IEC 62061), pour de nombreuses fonctions de sécurité.', 'La redondance (deux contacteurs en série) et la surveillance (boucle de retour) permettent de détecter un contact soudé avant qu\'il ne devienne dangereux.'] }
  ]] };
  L.n7m4l2 = { min: 9, why: "Un programme bien rangé se dépanne en minutes ; un programme en vrac, en jours.", screens: [[
    { h: 'Structurer un programme' },
    { list: ['Découper par fonctions de la machine (convoyeur, poste de perçage…) plutôt que par types d\'instructions.', 'Une sortie n\'est écrite qu\'à un seul endroit du programme.', 'Noms de variables explicites et commentés (<code>Conv1_Moteur_Marche</code> plutôt que <code>Q4.3</code>).', 'Blocs réutilisables pour les éléments répétés (moteurs, vannes, alarmes).'] }
  ]] };
  L.n7m4l3 = { min: 9, why: "Une alarme inutile apprend à l'opérateur à ignorer toutes les alarmes.", screens: [[
    { h: 'Gestion des défauts et alarmes' },
    { list: ['Chaque alarme doit demander une action de l\'opérateur ; sinon c\'est une information, pas une alarme.', 'Cycle de vie (ISA-18.2 / IEC 62682) : normale → active non acquittée → active acquittée → retour à la normale.', 'Horodater, classer par priorité, éviter les avalanches (une cause unique ne doit pas déclencher cinquante alarmes).'] }
  ]] };
  L.n7m4l4 = { min: 9, why: "Une mise en service méthodique évite les accidents et les surprises au démarrage.", screens: [[
    { h: 'Mise en service et sauvegarde' },
    { warn: "Forcer une sortie fait bouger la machine : on ne force qu'après avoir vérifié que personne n'est dans la zone et que les sécurités câblées sont opérationnelles." }
  ]] };

  Object.assign(AA.VISMAP, {
    n7m1l1: [{ sim: 'langs', opts: { lang: 'LD' } }], n7m1l2: [{ sim: 'langs', opts: { lang: 'FBD' } }], n7m1l3: [{ sim: 'langs', opts: { lang: 'ST' } }], n7m1l4: [{ sim: 'langs', opts: { lang: 'SFC' } }], n7m1l5: [{ sim: 'fbinst' }],
    n7m2l1: [{ sim: 'loop420' }], n7m2l2: [{ sim: 'scaling' }], n7m2l3: [{ sim: 'pt100' }], n7m2l4: [{ sim: 'filtre' }],
    n7m3l1: [{ sim: 'pid', opts: { mode: 'man' } }], n7m3l2: [{ sim: 'pid' }], n7m3l3: [{ sim: 'pid' }], n7m3l4: [{ sim: 'pid', opts: { proc: 'niveau' } }],
    n7m4l1: [{ sim: 'safety' }], n7m4l2: [{ order: 'struct' }], n7m4l3: [{ sim: 'alarmes' }], n7m4l4: [{ order: 'mes' }]
  });
})();
