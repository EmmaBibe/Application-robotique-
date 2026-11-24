/* Simulation interactive : étapes de montage et rendu final */
(function () {
  'use strict';
  const M = window.MODELE, C = window.CALC, S = window.SCENES, E = window.MOTEUR;
  const $ = (id) => document.getElementById(id);

  // repères de nomenclature (pour l'affichage des fiches)
  Object.values(M.MEUBLES).forEach(m => C.nomenclature(m, M.SECTIONS));

  const ONGLETS = [
    { code: 'A', nom: 'A · Dressing' },
    { code: 'B', nom: 'B · Étagère cuisine' },
    { code: 'C', nom: 'C · Station cuisson' },
    { code: 'K', nom: 'Implantation cuisine' }
  ];
  const ACCENT = [217, 104, 43];

  const etat = {
    code: 'A', etape: 0, lecture: null, couches: {}, rideauxOuverts: true, eclate: 0,
    selection: -1, survol: -1, anim: null, cotes: true
  };
  S.COUCHES.forEach(c => { etat.couches[c.id] = true; });

  const canvas = $('rendu'), calque = $('calque'), vue = $('vue');
  let scene = null, meuble = null, etapes = [];
  let sale = true, interaction = false, timerQualite = null, derniereVue = 'iso';

  /* Moteur : rendu réaliste WebGL si disponible, sinon moteur logiciel */
  const webgl = !!(window.RENDU3D && window.RENDU3D.disponible());
  const tactile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  let V, cam, rendu;
  if (webgl) {
    canvas.style.display = 'none';
    V = window.RENDU3D.creer(vue, { modele: M, qualite: tactile ? 'standard' : 'haute', pixelRatioMax: tactile ? 1.5 : 2 });
    $('qualite').value = tactile ? 'standard' : 'haute';
    $('qualite').onchange = (ev) => V.definirQualite(ev.target.value);
  } else {
    rendu = new E.Rendu(canvas);
    cam = new E.Camera();
    $('ligneQualite').style.display = 'none';
    V = {
      objets: [],
      charger(code) { const sc = S.construireScene(M, code); this.objets = sc.objets; this._sc = sc; return this.objets; },
      synchroniser() { sale = true; },
      demander() { sale = true; },
      vue(l, t, p, marge) { cam.lacet = l; cam.tangage = t; cam.perspective = p; const r = vue.getBoundingClientRect(); S.cadrer(this._sc, cam, r.width, r.height, marge); sale = true; },
      choisir(x, y) { const k = rendu.W / vue.clientWidth; return rendu.objetA(x * k, y * k); },
      projeteur(k) { const pr = new E.Rendu(document.createElement('canvas')); pr.W = vue.clientWidth * k; pr.H = vue.clientHeight * k; return pr.projeteur(cam); },
      fondCouleur() {},
      tic() {
        if (!sale) return false;
        const r = vue.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const q = interaction || etat.anim ? Math.min(dpr, 0.85) : dpr;
        rendu.dimension(Math.max(50, Math.round(r.width * q)), Math.max(50, Math.round(r.height * q)));
        rendu.fond = sombre() ? [27, 30, 34] : [246, 245, 241];
        rendu.dessiner(this._sc, cam);
        return true;
      }
    };
  }

  /* ---------- Thème ---------- */
  let theme = null;
  try { theme = localStorage.getItem('mobilier-theme'); } catch (e) { /* stockage indisponible */ }
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  function sombre() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  $('btnTheme').onclick = () => {
    const t = sombre() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('mobilier-theme', t); } catch (e) { /* rien */ }
    sale = true;
  };
  $('btnPanneau').onclick = () => $('panneauDroit').classList.toggle('ouvert');

  /* ---------- Onglets ---------- */
  ONGLETS.forEach(o => {
    const b = document.createElement('button');
    b.textContent = o.nom; b.dataset.code = o.code;
    b.onclick = () => charger(o.code);
    $('onglets').appendChild(b);
  });

  /* ---------- Couches ---------- */
  const COUL_COUCHE = { structure: M.COUL.acierA, quinc: M.COUL.platine, bois: M.COUL.cp15, toles: M.COUL.inox, equip: '#5b6f8f', rideaux: M.COUL.rideau, mur: M.COUL.sol2 };
  S.COUCHES.forEach(c => {
    const l = document.createElement('label'); l.className = 'case';
    l.innerHTML = '<input type="checkbox" checked data-couche="' + c.id + '"><span class="pastille" style="background:' + COUL_COUCHE[c.id] + '"></span>' + c.nom;
    l.querySelector('input').onchange = (ev) => { etat.couches[c.id] = ev.target.checked; majVisibilite(); };
    $('couches').appendChild(l);
  });
  $('rideauxOuverts').onchange = (ev) => { etat.rideauxOuverts = ev.target.checked; majVisibilite(); };
  $('eclate').oninput = (ev) => { etat.eclate = ev.target.value / 100; majVisibilite(); };
  $('perspective').onchange = () => vueStandard(derniereVue, true);
  $('cotes').onchange = (ev) => { etat.cotes = ev.target.checked; sale = true; V.demander(); };

  /* ---------- Chargement d'un meuble ---------- */
  function charger(code) {
    arreterLecture();
    etat.code = code;
    V.charger(code);
    scene = V;
    if (code === 'K') {
      meuble = null;
      etapes = [{ t: 'Implantation de la cuisine', d: 'L\'étagère murale B est posée à droite de la station C, jamais au-dessus du brûleur gaz : 750 mm minimum entre la flamme et tout élément combustible situé au-dessus. Le dessous de l\'étagère est à 1250 mm du sol.', ctrl: ['Brûleur gaz dégagé vers le haut', 'Prises électriques à plus de 1 m de la bouteille', 'Couverture anti-feu à portée de main'] }];
    } else {
      meuble = M.MEUBLES[code];
      etapes = meuble.etapes.concat([{ t: 'Rendu final', d: meuble.nom + ' : ' + meuble.encombrement + '.', ctrl: [], final: true }]);
    }
    document.querySelectorAll('#onglets button').forEach(b => b.classList.toggle('actif', b.dataset.code === code));
    $('ligneRideaux').style.display = code === 'A' ? '' : 'none';
    $('curseur').max = etapes.length - 1;
    etat.selection = -1;
    afficherInfo(-1);
    remplirListe();
    allerA(etapes.length - 1, false);
    vueStandard('iso');
  }

  function remplirListe() {
    const ol = $('listeEtapes');
    ol.innerHTML = '';
    etapes.forEach((e, i) => {
      const li = document.createElement('li');
      li.textContent = e.t;
      if (e.final) li.classList.add('final');
      li.onclick = () => { arreterLecture(); allerA(i, true); };
      ol.appendChild(li);
    });
  }

  /* ---------- Étapes ---------- */
  function allerA(i, animer) {
    i = Math.max(0, Math.min(etapes.length - 1, i));
    etat.etape = i;
    $('curseur').value = i;
    document.querySelectorAll('#listeEtapes li').forEach((li, k) => {
      li.classList.toggle('courant', k === i);
      li.classList.toggle('fait', k < i);
    });
    const e = etapes[i];
    const n = etapes.length - (meuble ? 1 : 0);
    let html = '<h3>' + (e.final || !meuble ? '' : 'Étape ' + (i + 1) + ' / ' + n + ' · ') + e.t + '</h3><p>' + e.d + '</p>';
    if (e.ctrl && e.ctrl.length) html += '<ul>' + e.ctrl.map(c => '<li>' + c + '</li>').join('') + '</ul>';
    if (meuble && !e.final) {
      const ps = {};
      meuble.parts.forEach(p => {
        if (p.etape !== i || p.cat === 'equip' || p.cat === 'rideau') return;
        const k = (p.rep ? p.rep + ' ' : '') + p.nom;
        ps[k] = (ps[k] || 0) + (p.debit && p.debit.n ? p.debit.n : 1);
      });
      const l = Object.keys(ps);
      if (l.length) html += '<p class="pieces"><b>Pièces de l\'étape :</b> ' + l.map(k => ps[k] + ' × ' + k).join(' ; ') + '</p>';
    }
    $('carteEtape').innerHTML = html;
    $('titreVue').innerHTML = meuble ? '<b>' + meuble.code + '</b> · ' + meuble.nom + ' — ' + (e.final ? 'rendu final' : 'étape ' + (i + 1) + ' : ' + e.t) : '<b>Cuisine</b> · implantation de B et C';
    $('bPrec').disabled = i === 0; $('bDebut').disabled = i === 0;
    $('bSuiv').disabled = i === etapes.length - 1; $('bFin').disabled = i === etapes.length - 1;
    etat.anim = animer ? { t0: performance.now(), duree: 700 } : null;
    majVisibilite();
  }

  function majVisibilite() {
    if (!scene) return;
    const i = etat.etape;
    const final = !meuble || etapes[i].final;
    scene.objets.forEach((o, idx) => {
      let v = etat.couches[o.couche];
      if (o.part) {
        const p = o.part;
        if (!final && p.etape > i) v = false;
        if (p.variante === 'ferme' && etat.rideauxOuverts) v = false;
        if (p.variante === 'ouvert' && !etat.rideauxOuverts) v = false;
        o.teinte = (!final && p.etape === i) ? [ACCENT[0], ACCENT[1], ACCENT[2], 0.5] : null;
        if (idx === etat.selection) o.teinte = [40, 130, 220, 0.6];
        const mod = (meuble && p.module) || 0;
        const m = o.meuble;
        o.decal = [mod * etat.eclate * 420 * (m && m.code === 'B' ? 0.6 : 1), 0, 0];
        if (etat.code === 'K') o.decal = [0, 0, 0];
        o.actuel = !final && p.etape === i;
      }
      o.visible = v;
    });
    V.synchroniser();
    sale = true;
  }

  function suivant(sens) {
    const d = sens || ($('demontage').checked ? -1 : 1);
    const j = etat.etape + d;
    if (j < 0 || j >= etapes.length) { arreterLecture(); return; }
    allerA(j, true);
  }
  function lancerLecture() {
    if (etat.lecture) { arreterLecture(); return; }
    const dem = $('demontage').checked;
    if (!dem && etat.etape >= etapes.length - 1) allerA(0, true);
    if (dem && etat.etape <= 0) allerA(etapes.length - 1, true);
    $('bLecture').textContent = '⏸';
    $('bLecture').classList.add('actif');
    etat.lecture = setInterval(() => suivant(), +$('vitesse').value);
  }
  function arreterLecture() {
    if (etat.lecture) clearInterval(etat.lecture);
    etat.lecture = null;
    $('bLecture').textContent = '▶';
    $('bLecture').classList.remove('actif');
  }
  $('bDebut').onclick = () => { arreterLecture(); allerA(0, true); };
  $('bPrec').onclick = () => { arreterLecture(); allerA(etat.etape - 1, true); };
  $('bSuiv').onclick = () => { arreterLecture(); allerA(etat.etape + 1, true); };
  $('bFin').onclick = () => { arreterLecture(); allerA(etapes.length - 1, true); };
  $('bLecture').onclick = lancerLecture;
  $('vitesse').onchange = () => { if (etat.lecture) { arreterLecture(); lancerLecture(); } };
  $('curseur').oninput = (ev) => { arreterLecture(); allerA(+ev.target.value, true); };
  document.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
    if (ev.key === 'ArrowRight') { arreterLecture(); allerA(etat.etape + 1, true); }
    if (ev.key === 'ArrowLeft') { arreterLecture(); allerA(etat.etape - 1, true); }
    if (ev.key === ' ') { ev.preventDefault(); lancerLecture(); }
  });

  /* ---------- Vues ---------- */
  const VUES = {
    iso: [-0.65, 0.42, true], face: [0, 0, false], dessus: [0, Math.PI / 2 - 0.0001, false],
    gauche: [-Math.PI / 2, 0, false], droite: [Math.PI / 2, 0, false], arriere: [Math.PI, 0.12, false]
  };
  function vueStandard(nom, garderProjection) {
    const v = VUES[nom];
    derniereVue = nom;
    const persp = garderProjection ? $('perspective').checked : v[2];
    $('perspective').checked = persp;
    V.vue(v[0], v[1], persp, nom === 'iso' ? 1.0 : 1.12);
    document.querySelectorAll('[data-vue]').forEach(b => b.classList.toggle('actif', b.dataset.vue === nom));
    sale = true;
  }
  document.querySelectorAll('[data-vue]').forEach(b => { b.onclick = () => vueStandard(b.dataset.vue); });

  /* ---------- Souris et tactile ---------- */
  let glisse = null;
  const pointeurs = new Map();
  vue.addEventListener('contextmenu', ev => ev.preventDefault());
  vue.addEventListener('pointerdown', ev => {
    if (!webgl) vue.setPointerCapture(ev.pointerId);
    pointeurs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    glisse = { x: ev.clientX, y: ev.clientY, bouton: ev.button, maj: ev.shiftKey, bouge: 0 };
  });
  vue.addEventListener('pointermove', ev => {
    const r = vue.getBoundingClientRect();
    if (webgl && glisse) {
      glisse.bouge += Math.abs(ev.clientX - glisse.x) + Math.abs(ev.clientY - glisse.y);
      glisse.x = ev.clientX; glisse.y = ev.clientY;
      $('infobulle').style.display = 'none';
      if (glisse.bouge > 4) document.querySelectorAll('[data-vue]').forEach(b => b.classList.remove('actif'));
      return;
    }
    if (!webgl && pointeurs.has(ev.pointerId) && pointeurs.size === 2) {
      const ancien = Array.from(pointeurs.values());
      const d0 = Math.hypot(ancien[0].x - ancien[1].x, ancien[0].y - ancien[1].y);
      const m0 = [(ancien[0].x + ancien[1].x) / 2, (ancien[0].y + ancien[1].y) / 2];
      pointeurs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      const nv = Array.from(pointeurs.values());
      const d1 = Math.hypot(nv[0].x - nv[1].x, nv[0].y - nv[1].y);
      const m1 = [(nv[0].x + nv[1].x) / 2, (nv[0].y + nv[1].y) / 2];
      if (d1 > 0) cam.distance *= d0 / d1;
      deplacer(m1[0] - m0[0], m1[1] - m0[1], r);
      marquerInteraction();
      return;
    }
    if (!webgl && glisse && pointeurs.has(ev.pointerId)) {
      const dx = ev.clientX - glisse.x, dy = ev.clientY - glisse.y;
      glisse.x = ev.clientX; glisse.y = ev.clientY; glisse.bouge += Math.abs(dx) + Math.abs(dy);
      pointeurs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (glisse.bouton === 2 || glisse.maj || ev.shiftKey) deplacer(dx, dy, r);
      else {
        cam.lacet += dx * 0.008;
        cam.tangage = Math.max(-0.2, Math.min(Math.PI / 2 - 0.001, cam.tangage + dy * 0.006));
        document.querySelectorAll('[data-vue]').forEach(b => b.classList.remove('actif'));
      }
      marquerInteraction();
      $('infobulle').style.display = 'none';
      return;
    }
    survol(ev.clientX - r.left, ev.clientY - r.top);
  });
  const fin = ev => {
    pointeurs.delete(ev.pointerId);
    if (glisse && glisse.bouge < 4 && pointeurs.size === 0) {
      const r = vue.getBoundingClientRect();
      cliquer(ev.clientX - r.left, ev.clientY - r.top);
    }
    if (pointeurs.size === 0) glisse = null;
  };
  vue.addEventListener('pointerup', fin);
  vue.addEventListener('pointercancel', fin);
  vue.addEventListener('pointerleave', () => { $('infobulle').style.display = 'none'; if (etat.survol >= 0) { etat.survol = -1; } });
  vue.addEventListener('wheel', ev => {
    if (webgl) return;
    ev.preventDefault();
    cam.distance *= Math.exp(ev.deltaY * 0.0012);
    cam.distance = Math.max(300, Math.min(30000, cam.distance));
    marquerInteraction();
  }, { passive: false });
  vue.addEventListener('dblclick', () => vueStandard(derniereVue, true));
  function deplacer(dx, dy, r) {
    const R = cam.repere();
    const k = cam.distance * cam.focale * 2 / r.height;
    for (let i = 0; i < 3; i++) cam.cible[i] += (-dx * R.dr[i] + dy * R.ht[i]) * k;
  }
  function marquerInteraction() {
    interaction = true; sale = true;
    clearTimeout(timerQualite);
    timerQualite = setTimeout(() => { interaction = false; sale = true; }, 180);
  }

  function pixel(x, y) { return V.choisir(x, y); }
  let dernierSurvol = 0;
  function survol(x, y) {
    const t = performance.now();
    if (webgl && t - dernierSurvol < 60) return;
    dernierSurvol = t;
    const id = pixel(x, y);
    const ib = $('infobulle');
    if (id >= 0 && scene.objets[id] && scene.objets[id].part) {
      const p = scene.objets[id].part;
      ib.innerHTML = '<b>' + (p.rep ? p.rep + ' · ' : '') + p.nom + '</b>' + (p.debit ? ' — ' + resumeDebit(p) : '');
      ib.style.display = 'block';
      const w = ib.offsetWidth;
      ib.style.left = Math.min(x + 14, vue.clientWidth - w - 6) + 'px';
      ib.style.top = (y + 16) + 'px';
      vue.style.cursor = 'pointer';
    } else { ib.style.display = 'none'; vue.style.cursor = 'grab'; }
  }
  function cliquer(x, y) {
    const id = pixel(x, y);
    etat.selection = (id >= 0 && scene.objets[id] && scene.objets[id].part) ? id : -1;
    afficherInfo(etat.selection);
    majVisibilite();
  }

  function resumeDebit(p) {
    const d = p.debit;
    if (p.cat === 'panneau' || p.cat === 'tole') return d.L + ' × ' + d.l + ' × ' + String(d.ep).replace('.', ',') + ' mm';
    const s = M.SECTIONS[d.sec];
    return (s ? s.nom : d.sec) + ', L = ' + d.L + ' mm';
  }
  function afficherInfo(id) {
    const box = $('info');
    if (id < 0) { box.innerHTML = '<span class="petit">Cliquer sur une pièce pour afficher sa fiche.</span>'; return; }
    const o = scene.objets[id], p = o.part, m = o.meuble;
    const rows = [];
    rows.push(['Meuble', m.code + ' · ' + m.court]);
    if (p.rep) rows.push(['Repère', p.rep]);
    if (p.debit) {
      if (p.cat === 'panneau' || p.cat === 'tole') {
        rows.push(['Matière', p.mat]);
        rows.push(['Débit', p.debit.L + ' × ' + p.debit.l + ' mm']);
      } else {
        rows.push(['Section', (M.SECTIONS[p.debit.sec] || {}).nom || p.debit.sec]);
        rows.push(['Longueur', p.debit.L + ' mm' + (p.debit.n ? ' (× ' + p.debit.n + ')' : '')]);
        if (p.debit.coupe) rows.push(['Coupes', p.debit.coupe]);
      }
      if (p.debit.usin) rows.push(['Usinages', p.debit.usin]);
      const nom = C.nomenclature(m, M.SECTIONS);
      const g = nom.liste.find(x => x.rep === p.rep);
      if (g) rows.push(['Quantité', g.qte + ' dans le meuble' + (g.masseU ? ' · ' + g.masseU.toFixed(2).replace('.', ',') + ' kg pièce' : '')]);
    } else if (p.mat) rows.push(['Matière', p.mat]);
    if (p.sousEns) rows.push(['Sous-ensemble', p.sousEns]);
    if (m.etapes[p.etape]) rows.push(['Montage', 'étape ' + (p.etape + 1) + ' : ' + m.etapes[p.etape].t]);
    if (p.info) rows.push(['Note', p.info]);
    box.innerHTML = '<h3>' + p.nom + '</h3><dl>' + rows.map(r => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl>';
  }

  /* ---------- Cotes ---------- */
  function dessinerCotes(pr, k) {
    const ctx = calque.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, calque.width, calque.height);
    if (!etat.cotes || !scene) return;
    const couleur = getComputedStyle(document.documentElement).getPropertyValue('--cotes').trim() || '#1b5e8c';
    const comps = etat.code === 'K' ? M.IMPLANTATION.composants : [{ m: etat.code, dx: 0, dy: 0, dz: 0 }];
    ctx.strokeStyle = couleur; ctx.fillStyle = couleur; ctx.lineWidth = 1.2 * k;
    ctx.font = (12 * k) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const P = (x, y, z) => pr.p(x, y, z);
    function cote(a, b, decal, texte) {
      const A = P(a[0] + decal[0], a[1] + decal[1], a[2] + decal[2]), B = P(b[0] + decal[0], b[1] + decal[1], b[2] + decal[2]);
      if (pr.persp && (A[3] < 20 || B[3] < 20)) return;
      const a0 = P(a[0], a[1], a[2]), b0 = P(b[0], b[1], b[2]);
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(A[0], A[1]); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      const ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      [[A, 0], [B, Math.PI]].forEach(([Q, s]) => {
        ctx.beginPath();
        ctx.moveTo(Q[0], Q[1]);
        ctx.lineTo(Q[0] + Math.cos(ang + s + 0.35) * 8 * k, Q[1] + Math.sin(ang + s + 0.35) * 8 * k);
        ctx.lineTo(Q[0] + Math.cos(ang + s - 0.35) * 8 * k, Q[1] + Math.sin(ang + s - 0.35) * 8 * k);
        ctx.closePath(); ctx.fill();
      });
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 30 * k) return;
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      const w = ctx.measureText(texte).width + 8 * k;
      ctx.save();
      ctx.fillStyle = sombre() ? 'rgba(23,25,28,.85)' : 'rgba(255,255,255,.85)';
      ctx.fillRect(mx - w / 2, my - 9 * k, w, 18 * k);
      ctx.restore();
      ctx.fillText(texte, mx, my);
    }
    comps.forEach(c => {
      const m = M.MEUBLES[c.m];
      const ox = c.dx, oy = c.dy, oz = c.dz;
      const L = m.dims.L, Pp = m.dims.P, H = m.dims.H;
      const ec = (m.modules.length - 1) * etat.eclate * 420 * (m.code === 'B' ? 0.6 : 1) * (etat.code === 'K' ? 0 : 1);
      const yAv = m.code === 'A' ? -70 : (m.code === 'C' ? -20 : 0);
      const off = 160;
      cote([ox, oy + yAv, oz], [ox + L + ec, oy + yAv, oz], [0, -off, 0], L + ' mm');
      cote([ox, oy + yAv, oz], [ox, oy + yAv, oz + H], [-off, 0, 0], H + ' mm');
      cote([ox + L + ec, oy + yAv, oz], [ox + L + ec, oy + m.murY, oz], [off, 0, 0], (m.murY - yAv) + ' mm');
      if (etat.code === 'K' && m.code === 'B') cote([ox + L, oy + m.murY - 300, 0], [ox + L, oy + m.murY - 300, oz], [off, 0, 0], 'pose à ' + oz + ' mm');
      if (etat.code !== 'K' && m.modules.length > 1) {
        m.modules.forEach((md, i) => {
          const dxm = i * etat.eclate * 420 * (m.code === 'B' ? 0.6 : 1);
          cote([ox + md.x + dxm, oy + yAv, oz + H], [ox + md.x + md.w + dxm, oy + yAv, oz + H], [0, -off * 0.6, off * 0.6], md.code + ' ' + md.w);
        });
      }
    });
  }

  /* ---------- Boucle ---------- */
  function boucle(t) {
    let anime = false;
    if (etat.anim && scene) {
      const u = Math.min(1, (t - etat.anim.t0) / etat.anim.duree);
      const ease = 1 - Math.pow(1 - u, 3);
      scene.objets.forEach(o => {
        if (o.actuel) {
          const base = o.decal[0];
          o.decal = [base, 0, (1 - ease) * 350];
        }
      });
      if (u >= 1) { etat.anim = null; scene.objets.forEach(o => { if (o.actuel) o.decal[2] = 0; }); }
      anime = true; sale = true;
    }
    if (anime) V.synchroniser();
    if (scene) {
      if (webgl) V.fond.set(sombre() ? '#1b1e22' : '#f3f1ec');
      if (sale) V.demander();
      if (V.tic()) {
        const r = vue.getBoundingClientRect();
        const kd = Math.min(window.devicePixelRatio || 1, 2);
        calque.width = Math.round(r.width * kd); calque.height = Math.round(r.height * kd);
        dessinerCotes(V.projeteur(kd), kd);
      }
      sale = false;
    }
    requestAnimationFrame(boucle);
  }
  window.addEventListener('resize', () => { sale = true; });

  charger('A');
  requestAnimationFrame(boucle);
})();
