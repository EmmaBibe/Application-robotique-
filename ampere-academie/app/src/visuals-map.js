/* Ampère Académie — une visualisation pour chaque leçon.
 * AA.VISMAP[idLeçon] = liste de blocs insérés automatiquement dans le premier écran de la leçon
 * (sous le titre « Visualiser »). Les données des exercices ordonner / choisir / zones cliquables sont ici. */
(function () {
  'use strict';
  const SIMS = AA.SIMS;

  /* Échelle des domaines de tension */
  SIMS.domaines = el => {
    const D = [[0, 50, 'TBT', '--ok', 'Commande 24 V, éclairage de piscine 12 V'], [50, 1000, 'BT', '--warn', 'Logements 230 V, usines 400 V'], [1000, 50000, 'HTA', '--live', 'Réseau de distribution 20 kV'], [50000, 1e6, 'HTB', '--bad', 'Transport 63 à 400 kV']];
    el.innerHTML = `<div class="simcard"><div class="simview"></div><div class="simctl"><label class="sl"><span>Tension alternative</span><input type="range" min="0" max="1000" value="380"><b></b><i></i></label></div><div class="body-zone card plain js-z"></div></div>`;
    const inp = el.querySelector('input'), out = el.querySelector('b'), z = el.querySelector('.js-z');
    const val = () => Math.round(Math.pow(10, +inp.value / 1000 * 6));
    const upd = () => { const v = val(); out.textContent = v >= 1000 ? AA.fmt(v / 1000, v >= 1e4 ? 0 : 1) + ' kV' : v + ' V'; const d = D.find(x => v <= x[1]) || D[3]; z.innerHTML = `<b style="color:var(${d[3]})">${d[2]}</b><p>${d[4]}. Domaine ${d[2]} en courant alternatif : ${d[0] ? 'plus de ' + AA.fmt(d[0]) + ' V' : ''}${d[0] && d[1] < 1e6 ? ' et ' : ''}${d[1] < 1e6 ? 'jusqu\'à ' + AA.fmt(d[1]) + ' V' : ''}.</p>`; };
    inp.addEventListener('input', upd); upd();
    const cv = AA.canvas(el.querySelector('.simview'), 110, (g, W, H) => {
      const x0 = 20, x1 = W - 20, X = v => x0 + Math.log10(Math.max(1, v)) / 6 * (x1 - x0);
      D.forEach(d => { g.fillStyle = AA.css(d[3]); g.globalAlpha = 0.85; g.fillRect(X(Math.max(1, d[0])), 40, X(d[1]) - X(Math.max(1, d[0])), 22); g.globalAlpha = 1; g.fillStyle = '#111'; g.font = '700 12px Bahnschrift'; g.fillText(d[2], X(Math.max(1, d[0])) + 6, 56); });
      g.fillStyle = AA.css('--ink-3'); g.font = '500 10.5px Segoe UI';
      [1, 10, 50, 230, 1000, 20000, 400000].forEach(v => { g.fillText(v >= 1000 ? v / 1000 + ' kV' : v + ' V', X(v) - 10, 80); });
      const x = X(val()); g.fillStyle = AA.css('--ink'); g.beginPath(); g.moveTo(x, 38); g.lineTo(x - 7, 24); g.lineTo(x + 7, 24); g.fill();
    });
    return cv.stop;
  };

  /* Dessins pour les zones cliquables */
  const SVG_ARMOIRE = `<svg viewBox="0 0 420 260" class="hot-svg"><rect x="10" y="10" width="400" height="240" rx="6" class="h-box"/>
    <g data-spot="Q"><rect x="30" y="30" width="60" height="70" rx="4" class="h-dev"/><circle cx="60" cy="65" r="12" class="h-knob"/></g>
    <g data-spot="K"><rect x="110" y="30" width="50" height="70" rx="4" class="h-dev"/><rect x="122" y="55" width="26" height="12" class="h-win"/></g>
    <g data-spot="F"><rect x="180" y="30" width="30" height="70" rx="4" class="h-dev"/><rect x="186" y="44" width="18" height="40" rx="2" class="h-win"/></g>
    <g data-spot="KA"><rect x="230" y="30" width="30" height="70" rx="4" class="h-dev"/><circle cx="245" cy="60" r="8" class="h-knob"/></g>
    <g data-spot="T"><rect x="280" y="30" width="110" height="70" rx="4" class="h-dev"/><path d="M300 50 h70 M300 65 h70 M300 80 h70" class="h-line"/></g>
    <g data-spot="X"><rect x="30" y="200" width="200" height="30" rx="2" class="h-dev"/><path d="M45 205 v20 M60 205 v20 M75 205 v20 M90 205 v20 M105 205 v20 M120 205 v20 M135 205 v20 M150 205 v20" class="h-line"/></g>
    <g data-spot="S"><circle cx="300" cy="170" r="16" class="h-btn-g"/></g><g data-spot="S2"><circle cx="345" cy="170" r="16" class="h-btn-r"/></g>
    <g data-spot="H"><circle cx="300" cy="215" r="11" class="h-lamp"/></g><g data-spot="P"><rect x="330" y="200" width="60" height="34" rx="3" class="h-dev"/><text x="342" y="222" class="h-txt">230V</text></g>
    <g data-spot="W"><path d="M250 250 q10 -40 40 -40" class="h-cable"/></g></svg>`;
  const SPOTS_ARMOIRE = {
    Q: ['Q — disjoncteur ou sectionneur', 'Commute un circuit d\'énergie (IEC 81346-2 : lettre Q). Ici, le disjoncteur-moteur Q1.'],
    K: ['KM — contacteur', 'Selon l\'IEC 81346-2, un contacteur de puissance commute de l\'énergie (Q) ; l\'usage français le repère KM.'],
    F: ['F — protection', 'Fusible, relais thermique, dispositif différentiel : lettre F.'],
    KA: ['K (KA) — relais', 'Relais auxiliaire ou temporisé : il traite des signaux, lettre K.'],
    T: ['T — transformateur', 'Convertit l\'énergie électrique en conservant sa nature (tension de commande, par exemple).'],
    X: ['X — bornier', 'Relie l\'armoire à l\'extérieur. Chaque borne est numérotée.'],
    S: ['S — bouton Marche', 'Convertit une action manuelle en signal.'], S2: ['S — bouton Arrêt', 'Même lettre S ; on les distingue par leur numéro (S1, S2).'],
    H: ['H (P) — voyant', 'Présente une information : P selon l\'IEC 81346-2, H dans l\'usage courant.'],
    P: ['P — appareil de mesure', 'Voltmètre de tableau, compteur : présente une information, lettre P.'],
    W: ['W — câble', 'Guide l\'énergie ou les signaux : W.']
  };
  const SVG_KM = `<svg viewBox="0 0 300 260" class="hot-svg"><rect x="80" y="40" width="140" height="180" rx="8" class="h-dev"/>
    <g data-spot="p1"><circle cx="105" cy="58" r="9" class="h-screw"/><circle cx="150" cy="58" r="9" class="h-screw"/><circle cx="195" cy="58" r="9" class="h-screw"/><text x="96" y="34" class="h-txt">1   3   5</text></g>
    <g data-spot="p2"><circle cx="105" cy="202" r="9" class="h-screw"/><circle cx="150" cy="202" r="9" class="h-screw"/><circle cx="195" cy="202" r="9" class="h-screw"/><text x="96" y="236" class="h-txt">2   4   6</text></g>
    <g data-spot="a"><circle cx="100" cy="100" r="7" class="h-screw"/><circle cx="200" cy="100" r="7" class="h-screw"/><text x="88" y="122" class="h-txt">A1</text><text x="192" y="122" class="h-txt">A2</text></g>
    <g data-spot="aux"><rect x="115" y="128" width="70" height="40" rx="3" class="h-win"/><text x="122" y="152" class="h-txt">13 NO 14</text></g></svg>`;
  const SPOTS_KM = {
    p1: ['Bornes 1-3-5', 'Entrée des pôles de puissance, côté réseau (bornes impaires).'], p2: ['Bornes 2-4-6', 'Sortie des pôles de puissance, côté récepteur (bornes paires).'],
    a: ['A1-A2', 'Bornes de la bobine. La tension de bobine (24 V, 230 V…) est marquée sur l\'appareil : vérifier qu\'elle correspond à la tension de commande.'],
    aux: ['Contact auxiliaire 13-14', 'Contact à fermeture (unités 3-4), premier contact (dizaine 1). Sert à l\'auto-maintien.']
  };
  const SVG_CART = `<svg viewBox="0 0 420 150" class="hot-svg"><rect x="10" y="10" width="400" height="130" class="h-dev"/>
    <g data-spot="t"><rect x="10" y="10" width="270" height="60" class="h-win"/><text x="20" y="45" class="h-txt">Moteur M1 — démarrage direct</text></g>
    <g data-spot="n"><rect x="280" y="10" width="130" height="60" class="h-win"/><text x="300" y="45" class="h-txt">Folio 4 / 18</text></g>
    <g data-spot="r"><rect x="10" y="70" width="130" height="70" class="h-win"/><text x="22" y="110" class="h-txt">Rév. C 12/03</text></g>
    <g data-spot="a"><rect x="140" y="70" width="140" height="70" class="h-win"/><text x="150" y="110" class="h-txt">Dessiné / Vérifié</text></g>
    <g data-spot="p"><rect x="280" y="70" width="130" height="70" class="h-win"/><text x="292" y="110" class="h-txt">Ligne 2 — Usine</text></g></svg>`;
  const SPOTS_CART = { t: ['Titre du folio', 'Ce que représente la feuille.'], n: ['Numéro de folio', 'Position dans le dossier et nombre total de folios : on vérifie qu\'il ne manque rien.'], r: ['Indice de révision', 'On travaille toujours sur la dernière révision, après avoir vérifié qu\'elle correspond à l\'installation.'], a: ['Auteur et vérificateur', 'Traçabilité : qui a dessiné, qui a contrôlé.'], p: ['Projet / installation', 'À quelle machine ou quel bâtiment le dossier se rapporte.'] };
  const SVG_BORN = `<svg viewBox="0 0 420 160" class="hot-svg">${Array.from({ length: 10 }, (_, i) => `<g data-spot="${i === 3 ? 'n' : i === 4 ? 'pe' : i === 9 ? 'rep' : 'b'}"><rect x="${20 + i * 38}" y="40" width="30" height="80" rx="3" class="${i === 3 ? 'h-blue' : i === 4 ? 'h-pe' : 'h-dev'}"/><circle cx="${35 + i * 38}" cy="56" r="6" class="h-screw"/><circle cx="${35 + i * 38}" cy="104" r="6" class="h-screw"/><text x="${28 + i * 38}" y="140" class="h-txt">${['L1', 'L2', 'L3', 'N', 'PE', 'U', 'V', 'W', '1', '2'][i]}</text></g>`).join('')}</svg>`;
  const SPOTS_BORN = { b: ['Borne de passage', 'Une entrée, une sortie, même repère des deux côtés. Repère identique à celui du schéma.'], n: ['Borne bleue', 'Réservée au neutre.'], pe: ['Borne vert-jaune', 'Borne de protection, reliée mécaniquement et électriquement au rail : le PE.'], rep: ['Repérage', 'Chaque borne porte un numéro ; le plan de bornier indique ce qui arrive et repart.'] };

  const ORDER = {
    secours: { title: 'Électrisation : remets les gestes dans l\'ordre', steps: [['Ne pas toucher la victime', 'Toucher la victime encore en contact avec la source ferait une seconde victime.'], ['Couper le courant (arrêt d\'urgence, disjoncteur)', 'Supprimer la cause avant tout.'], ['Alerter les secours (15, 18 ou 112)', 'Dès que la source est coupée.'], ['Vérifier la respiration ; masser et utiliser le défibrillateur si besoin', 'Les gestes de secours viennent après la mise en sécurité.']] },
    consign: { title: 'Consignation : remets les étapes dans l\'ordre', steps: [['Pré-identifier l\'ouvrage sur les schémas', 'On sait d\'abord sur quoi on va intervenir.'], ['Séparer de toutes les sources d\'énergie', 'Ouvrir l\'organe de séparation, y compris secours et retours.'], ['Condamner (cadenas, pancarte)', 'Empêche une remise sous tension.'], ['Identifier l\'ouvrage sur le lieu de travail', 'S\'assurer qu\'on travaille bien sur l\'ouvrage consigné.'], ['Vérifier l\'absence de tension (VAT)', 'Au plus près du point de travail.'], ['Mettre à la terre et en court-circuit si nécessaire', 'En dernier, une fois l\'absence de tension vérifiée.']] },
    vat: { title: 'VAT : remets la procédure dans l\'ordre', steps: [['Mettre ses EPI (gants, écran facial)', 'Pendant la VAT, on suppose que la tension peut être présente.'], ['Tester le VAT sur une source connue', 'Prouver qu\'il fonctionne avant.'], ['Vérifier entre tous les conducteurs pris deux à deux', 'Phases entre elles, avec le neutre, avec la terre.'], ['Tester à nouveau le VAT sur la source connue', 'Prouver qu\'il fonctionnait encore pendant la vérification.']] },
    autoc: { title: 'Autocontrôle d\'une installation : remets les essais dans l\'ordre', steps: [['Hors tension : continuité des conducteurs de protection', 'Les mesures hors tension d\'abord.'], ['Hors tension : résistance d\'isolement au mégohmmètre', 'Avant toute mise sous tension.'], ['Mesure de la prise de terre', 'Valide la protection contre les contacts indirects.'], ['Mise sous tension et test des différentiels', 'Seulement une fois les essais hors tension réussis.'], ['Contrôle de polarité et de fonctionnement', 'Les vérifications de fonctionnement en dernier.']] },
    sect: { title: 'Ouverture d\'un sectionneur porte-fusibles : quel ordre ?', steps: [['Le contact de précoupure s\'ouvre', 'Il coupe le circuit de commande en premier.'], ['La bobine du contacteur n\'est plus alimentée', 'Conséquence de la précoupure.'], ['Le contacteur coupe le courant de charge', 'C\'est lui qui a le pouvoir de coupure.'], ['Les pôles du sectionneur s\'ouvrent à vide', 'Sans arc : le sectionneur n\'a pas de pouvoir de coupure en charge.'], ['On condamne le sectionneur en position ouverte', 'Cadenas : l\'installation est séparée et verrouillée.']] },
    lire: { title: 'Lire un schéma : remets les 5 questions dans l\'ordre', steps: [['Que fait la machine ?', ''], ['D\'où vient l\'énergie ?', ''], ['Quels sont les récepteurs ?', ''], ['Qu\'est-ce qui commande chaque récepteur ?', ''], ['Quelles sont les sécurités ?', '']] }
  };
  const EPI = {
    title: 'Quels équipements de protection ?', items: [['gants', 'Gants isolants classe 0', '1 000 V'], ['ecran', 'Écran facial anti-UV', 'arc électrique'], ['vet', 'Vêtements non propagateurs', 'manches longues'], ['vat', 'VAT', 'vérificateur d\'absence de tension'], ['outils', 'Outils isolés 1 000 V', 'double triangle'], ['bijoux', 'Bague, montre métallique', ''], ['tapis', 'Tapis isolant', 'manœuvre']],
    cases: [
      { q: 'Vérifier l\'absence de tension dans un tableau 400 V avant intervention.', need: ['gants', 'ecran', 'vet', 'vat'], no: ['bijoux'], why: 'Pendant la VAT, la tension peut encore être présente : gants, écran, vêtements et VAT. Aucun objet métallique porté.' },
      { q: 'Manœuvrer un interrupteur-sectionneur de tableau de puissance.', need: ['gants', 'ecran', 'vet'], no: ['bijoux'], why: 'Une manœuvre peut provoquer un arc en cas de défaut : protection du visage et des mains.' },
      { q: 'Raccorder des conducteurs dans une armoire consignée (absence de tension vérifiée).', need: ['outils'], no: ['bijoux'], why: 'L\'installation est consignée : outillage isolé par précaution, toujours sans bijoux.' }
    ]
  };
  const IHM = {
    title: 'Pupitre : choisis les boutons et voyants rouges (IEC 60204-1)', items: [['au', 'Arrêt d\'urgence', 'coup de poing'], ['marche', 'Marche', 'poussoir'], ['arret', 'Arrêt normal', 'poussoir'], ['rearm', 'Réarmement', 'action obligatoire'], ['vmarche', 'Voyant « en marche »', 'normal'], ['vdef', 'Voyant « danger / urgence »', ''], ['vatt', 'Voyant « anomalie »', '']],
    cases: [
      { q: 'Sélectionne les éléments qui doivent être ROUGES.', need: ['au', 'vdef'], no: ['marche', 'rearm', 'vmarche', 'vatt'], why: 'Rouge : arrêt d\'urgence (sur fond jaune) et voyant d\'urgence. L\'arrêt normal peut être rouge, noir, gris ou blanc. Marche : vert ou blanc ; réarmement : bleu ; anomalie : jaune.' },
      { q: 'Sélectionne les éléments qui doivent être VERTS ou BLANCS.', need: ['marche'], no: ['au', 'rearm', 'vdef', 'vatt'], why: 'Marche : blanc de préférence, ou gris, noir, vert (jamais rouge). Le voyant de fonctionnement normal est vert ; ici il est facultatif.' },
      { q: 'Pour quel élément la couleur BLEUE est-elle autorisée ?', need: ['rearm'], no: ['au', 'marche', 'arret', 'vdef'], why: 'Le bleu signale une action obligatoire : il est admis pour un bouton de réarmement (qui peut aussi être blanc, gris ou noir). Il n\'est prévu ni pour la marche, ni pour l\'arrêt, ni pour l\'urgence.' }
    ]
  };

  AA.VISMAP = {
    n0m1l2: [{ sim: 'dmm', opts: { kind: 'dc' } }], n0m1l4: [{ sim: 'ohm' }],
    n0m2l2: [{ sim: 'tt' }], n0m2l3: [{ sim: 'domaines' }], n0m2l4: [{ sim: 'tt' }], n0m2l5: [{ order: 'secours' }],
    n0m3l1: [{ sim: 'habil' }], n0m3l2: [{ sim: 'habil' }], n0m3l3: [{ order: 'consign' }], n0m3l4: [{ order: 'vat' }], n0m3l5: [{ choose: 'epi' }],
    n0m4l1: [{ sim: 'dmm' }],
    n1m1l1: [{ sim: 'views' }], n1m2l1: [{ sim: 'views' }], n1m2l2: [{ sim: 'tableau' }], n1m2l3: [{ sim: 'views' }], n1m2l5: [{ hot: 'armoire' }], n1m2l6: [{ order: 'lire' }],
    n1m3l1: [{ hot: 'armoire' }], n1m3l2: [{ hot: 'km' }], n1m3l4: [{ hot: 'cart' }], n1m3l5: [{ hot: 'born' }],
    n1m4l1: [{ sim: 'cable' }], n1m4l2: [{ sim: 'cable' }], n1m4l3: [{ sim: 'joule' }], n1m4l4: [{ sim: 'joule' }], n1m4l5: [{ sim: 'cable' }],
    n2m1l2: [{ circuit: 'double', tasks: [{ t: 'Allume les deux groupes de lampes', ok: s => s.lamp.E1 && s.lamp.E2 }, { t: 'Éteins seulement le groupe 1', ok: s => !s.lamp.E1 && s.lamp.E2 }] }],
    n2m1l5: [{ circuit: 'minuterie', tasks: [{ t: 'Allume l\'éclairage par un poussoir', ok: s => s.lamp.E1 }, { t: 'Attends l\'extinction automatique, sans toucher aux poussoirs', ok: s => !s.lamp.E1 }] }],
    n2m3l1: [{ sim: 'breaker' }], n2m3l2: [{ sim: 'breaker' }], n2m3l3: [{ sim: 'breaker' }], n2m3l4: [{ sim: 'rcd' }], n2m3l6: [{ sim: 'surge' }],
    n2m4l1: [{ sim: 'tableau' }], n2m4l2: [{ sim: 'tableau' }], n2m4l4: [{ sim: 'tt' }], n2m4l5: [{ order: 'autoc' }],
    n3m1l1: [{ sim: 'contactor' }], n3m1l2: [{ sim: 'thermal' }], n3m1l3: [{ order: 'sect' }], n3m1l4: [{ sim: 'chrono' }], n3m1l5: [{ choose: 'ihm' }],
    n3m3l1: [{ sim: 'startcur' }], n3m3l5: [{ sim: 'startcur' }],
    n6m1l1: [{ sim: 'cycle' }], n6m1l2: [{ sim: 'cycle' }], n6m1l3: [{ sim: 'cycle' }], n6m1l4: [{ sim: 'cycle' }], n6m2l1: [{ sim: 'pnp' }], n6m3l5: [{ sim: 'chrono' }]
  };
  AA.VISDATA = { ORDER, EPI, IHM, HOT: { armoire: [SVG_ARMOIRE, SPOTS_ARMOIRE, 'Repère des appareils'], km: [SVG_KM, SPOTS_KM, 'Bornes d\'un contacteur'], cart: [SVG_CART, SPOTS_CART, 'Le cartouche'], born: [SVG_BORN, SPOTS_BORN, 'Le bornier'] } };

  /* Rendu d'un bloc de visualisation (appelé par le lecteur de leçon) */
  AA.renderVis = (b, d, ctx) => {
    let stop = null;
    if (b.sim) stop = AA.SIMS[b.sim](d, b.opts);
    else if (b.order) AA.SIMS.order(d, ORDER[b.order]);
    else if (b.choose) AA.SIMS.choose(d, b.choose === 'epi' ? EPI : IHM);
    else if (b.hot) { const h = AA.VISDATA.HOT[b.hot]; AA.SIMS.hotspots(d, { svg: h[0], spots: h[1], title: h[2] }); }
    if (stop && ctx) ctx.cleanups.push(stop);
  };
})();
