/* Ampère Académie — noyau : stockage, routeur, utilitaires, galons et points d'expérience. */
(function () {
  'use strict';
  const AA = window.AA = {};
  const KEY = 'ampere-academie-v1';

  /* ---------- Stockage local (aucune donnée envoyée) ---------- */
  const blank = () => ({ v: 1, xp: 0, lessons: {}, defis: {}, ladder: {}, history: [], streak: { day: '', n: 0 }, settings: { theme: 'auto', motion: true, sound: true }, created: Date.now(), name: '' });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
  AA.state = S;
  AA.save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } };
  AA.reset = () => { S = AA.state = blank(); AA.save(); };
  AA.importState = (obj) => { if (!obj || typeof obj.xp !== 'number') throw new Error('Fichier de progression invalide'); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, blank(), obj); AA.save(); };

  /* ---------- Utilitaires ---------- */
  AA.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  AA.$ = (sel, root) => (root || document).querySelector(sel);
  AA.$$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  AA.el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  AA.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  AA.fmt = (x, d) => { const v = Number(x); if (!isFinite(v)) return String(x); return v.toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 2 : d }); };
  /* Générateur pseudo-aléatoire reproductible (défis du jour, variantes) */
  AA.rng = seed => {
    let a = typeof seed === 'string' ? [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703) : (seed >>> 0);
    const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    return r;
  };
  AA.download = (name, text, mime) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime || 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  /* ---------- Galons ---------- */
  AA.RANKS = [
    { n: 'Apprenti', xp: 0, s: 'Premiers pas : courant, tension, sécurité' },
    { n: 'Aide-électricien', xp: 300, s: 'Lit un schéma simple, mesure sans danger' },
    { n: 'Électricien', xp: 900, s: 'Réalise les circuits domestiques' },
    { n: 'Électricien qualifié', xp: 2000, s: 'Protections, tableau, normes' },
    { n: "Câbleur d'armoire", xp: 3600, s: 'Commande de moteurs, coffrets industriels' },
    { n: 'Technicien', xp: 5800, s: 'Électrotechnique, dépannage méthodique' },
    { n: 'Technicien automaticien', xp: 8600, s: 'Automates, Grafcet, capteurs' },
    { n: 'Technicien supérieur', xp: 12000, s: 'Variateurs, réseaux, régulation' },
    { n: "Chargé d'affaires", xp: 16500, s: 'Conçoit et chiffre un dossier électrique' },
    { n: 'Ingénieur junior', xp: 22000, s: 'Dimensionne et valide une installation' },
    { n: 'Ingénieur', xp: 29000, s: 'Sûreté de fonctionnement, sécurité machines' },
    { n: 'Ingénieur expert', xp: 38000, s: 'Référence technique, audit, innovation' }
  ];
  AA.rankIndex = xp => { let i = 0; AA.RANKS.forEach((r, k) => { if (xp >= r.xp) i = k; }); return i; };
  AA.rankProgress = xp => {
    const i = AA.rankIndex(xp), r = AA.RANKS[i], nx = AA.RANKS[i + 1];
    return { i, r, next: nx, frac: nx ? (xp - r.xp) / (nx.xp - r.xp) : 1, need: nx ? nx.xp - xp : 0 };
  };

  /* Insigne de galons : chevrons, barrettes et étoiles selon le grade */
  AA.insignia = (i, size) => {
    size = size || 64;
    // 3 paliers de métal (cuivre, argent, or) × 4 grades (1, 2, 3 chevrons, puis 3 chevrons + étoile)
    const tier = Math.floor(i / 4);
    const metal = ['url(#gCopper)', 'url(#gSilver)', 'url(#gGold)'][Math.min(2, tier)];
    let body = '';
    const n = (i % 4) + 1;
    for (let k = 0; k < Math.min(n, 3); k++) {
      const y = n === 4 ? 50 - k * 9 : 44 - k * 10;
      body += `<path d="M14 ${y} L32 ${y - 11} L50 ${y} L50 ${y + 6} L32 ${y - 5} L14 ${y + 6} Z" fill="${metal}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>`;
    }
    if (n === 4) body += `<path transform="translate(9.6 2) scale(.7)" d="M32 9 l2.6 5.3 5.8.8-4.2 4.1 1 5.8L32 22.3 26.8 25l1-5.8-4.2-4.1 5.8-.8z" fill="${metal}"/>`;
    const bars = '';
    return `<svg class="insignia" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs>
      <linearGradient id="gCopper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc79a"/><stop offset=".5" stop-color="#e0844a"/><stop offset="1" stop-color="#9c4a1f"/></linearGradient>
      <linearGradient id="gSilver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b9c3cf"/><stop offset="1" stop-color="#6b7684"/></linearGradient>
      <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#f2b83a"/><stop offset="1" stop-color="#a86b0c"/></linearGradient>
      </defs><path d="M32 2 L58 12 V34 C58 48 46 58 32 62 C18 58 6 48 6 34 V12 Z" class="ins-shield"/>${body}${bars}
</svg>`;
  };

  /* ---------- Points d'expérience ---------- */
  AA.addXP = (n, why) => {
    if (!n) return;
    const before = AA.rankIndex(S.xp);
    S.xp += n;
    const d = AA.today();
    if (S.streak.day !== d) {
      const y = new Date(Date.now() - 864e5); const yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
      S.streak.n = S.streak.day === yd ? S.streak.n + 1 : 1; S.streak.day = d;
    }
    S.history.push({ t: Date.now(), xp: n, why });
    if (S.history.length > 400) S.history.splice(0, S.history.length - 400);
    AA.save();
    AA.toast(`<b>+${n} XP</b> ${AA.esc(why || '')}`, 'xp');
    const after = AA.rankIndex(S.xp);
    if (after > before) setTimeout(() => AA.rankUp(after), 700);
    AA.refreshStats();
  };

  AA.toast = (html, kind) => {
    let box = AA.$('#toasts');
    if (!box) { box = AA.el('<div id="toasts" aria-live="polite"></div>'); document.body.appendChild(box); }
    const t = AA.el(`<div class="toast ${kind || ''}">${html}</div>`);
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  };

  AA.modal = (html, opts) => {
    const m = AA.el(`<div class="modal-back"><div class="modal ${opts && opts.cls || ''}" role="dialog" aria-modal="true">${html}</div></div>`);
    document.body.appendChild(m);
    const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 220); };
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    requestAnimationFrame(() => m.classList.add('in'));
    return { el: m, close };
  };

  AA.rankUp = i => {
    const r = AA.RANKS[i];
    AA.modal(`<div class="rankup"><div class="rankup-rays"></div>${AA.insignia(i, 128)}
      <p class="eyebrow">Nouveau galon</p><h2>${AA.esc(r.n)}</h2><p>${AA.esc(r.s)}</p>
      <button class="btn primary" data-close>Continuer</button></div>`, { cls: 'center' });
  };

  AA.refreshStats = () => {
    const p = AA.rankProgress(S.xp);
    AA.$$('.js-stats').forEach(el => {
      el.innerHTML = `<div class="mini-rank">${AA.insignia(p.i, 34)}<div><b>${AA.esc(p.r.n)}</b><span>${AA.fmt(S.xp, 0)} XP${p.next ? ' · encore ' + AA.fmt(p.need, 0) : ''}</span>
        <i class="bar"><i style="width:${Math.round(p.frac * 100)}%"></i></i></div></div>`;
    });
  };

  /* ---------- Thème ---------- */
  AA.applyTheme = () => {
    const t = S.settings.theme;
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    document.documentElement.classList.toggle('reduce-motion', S.settings.motion === false);
  };

  /* ---------- Son (retour discret des manœuvres) ---------- */
  let actx = null;
  AA.click = (f, d) => {
    if (S.settings.sound === false) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = f || 1400;
      g.gain.setValueAtTime(0.04, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (d || 0.04));
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (d || 0.05));
    } catch (e) { /* audio indisponible */ }
  };

  /* ---------- Routeur ---------- */
  const routes = {};
  AA.route = (name, fn) => { routes[name] = fn; };
  AA.go = h => { location.hash = h; };
  let current = null;
  AA.render = () => {
    const h = (location.hash || '#/accueil').slice(2).split('/');
    const name = routes[h[0]] ? h[0] : 'accueil';
    const main = AA.$('#main');
    if (current && current.leave) try { current.leave(); } catch (e) { /* ignorer */ }
    main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter');
    main.innerHTML = '';
    main.scrollTop = 0; window.scrollTo(0, 0);
    current = routes[name](main, h.slice(1)) || null;
    AA.$$('[data-v]').forEach(a => a.classList.toggle('on', a.dataset.v === name || (a.dataset.alt || '').split(' ').includes(name)));
    document.body.dataset.view = name;
    AA.refreshStats();
  };
  window.addEventListener('hashchange', AA.render);

  /* ---------- Icônes (traits 1.8) ---------- */
  const I = (d) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  AA.ic = {
    home: I('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    path: I('<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h7a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7"/>'),
    schema: I('<path d="M4 3v6M4 15v6M4 9l4-3M20 3v4M20 17v4"/><rect x="16" y="7" width="8" height="10" rx="1" transform="translate(-2 0)"/><path d="M4 12h3M17 12h-3"/>'),
    cube: I('<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>'),
    plc: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8v3M10 8v3M13 8v3M7 15h10"/><circle cx="17" cy="9.5" r="1.3"/>'),
    trophy: I('<path d="M8 4h8v5a4 4 0 0 1-8 0zM12 13v4M8 21h8M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
    more: I('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    bolt: I('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    play: I('<path d="M7 4l13 8-13 8z"/>'),
    check: I('<path d="M4 12l5 5L20 6"/>'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    meter: I('<rect x="5" y="2" width="14" height="20" rx="3"/><rect x="8" y="5" width="8" height="5" rx="1"/><circle cx="12" cy="15.5" r="3"/>'),
    hand: I('<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 13"/>'),
    bug: I('<rect x="7" y="7" width="10" height="13" rx="5"/><path d="M12 7V4M9 4l1.5 3M15 4l-1.5 3M3 11h4M17 11h4M3 17h4M17 17h4"/>'),
    reset: I('<path d="M4 4v6h6"/><path d="M5.5 15a7 7 0 1 0 1.6-7.4L4 10"/>'),
    fit: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    eye: I('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h7"/>'),
    star: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    flame: I('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z"/>'),
    door: I('<path d="M5 3h11v18H5zM16 6l3 1v13l-3 1"/><circle cx="13" cy="12" r="1"/>'),
    arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    stop: I('<rect x="6" y="6" width="12" height="12" rx="1.5"/>'),
    sigma: I('<path d="M18 5H6l6 7-6 7h12"/>')
  };
})();
