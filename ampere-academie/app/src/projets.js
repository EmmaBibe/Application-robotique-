/* Ampère Académie — grands projets industriels interconnectés.
 * Un site complet est généré au hasard (jusqu'à 8 ateliers, des dizaines de récepteurs). L'apprenant mène le projet
 * étape par étape : bilan de puissance (ku, ks), compensation, transformateur(s), Icc et pouvoir de coupure,
 * départ d'atelier, groupe électrogène de secours, harmoniques, schéma de liaison à la terre, sélectivité.
 * Chaque étape s'appuie sur les valeurs de référence des précédentes (pas d'erreur en cascade). */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const T = AA.TECH;
  const D = AA.Defis;
  const IZC3 = T.IZ.C3.concat([299, 341, 403, 464]);
  const SECT = T.SECTIONS.concat([150, 185, 240, 300]);
  const CAL = T.CALIBRES.concat([160, 200, 250, 315, 400, 500, 630]);
  const GE = [60, 100, 150, 200, 250, 300, 400, 500, 630, 800, 1000, 1250, 1500, 2000];
  const PDC = [25, 36, 50, 70, 100, 150];
  const ksAt = n => (n <= 3 ? 0.9 : n <= 5 ? 0.8 : n <= 9 ? 0.7 : 0.6);

  /* Catalogue de sites : ateliers types et récepteurs réalistes [nom, kW, ku, cos φ, η, variateur?, prioritaire?] */
  const SITES = [
    { n: 'Station de traitement d\'eau potable', crit: 'continuity', ateliers: [
      ['Pompage eau brute', [['Pompe eau brute', [55, 75, 90], 0.85, 0.86, 0.94, true, true], ['Pompe de lavage', [15, 22], 0.6, 0.84, 0.91, false, false], ['Dégrilleur', [1.5, 2.2], 0.5, 0.78, 0.82, false, true]]],
      ['Décantation', [['Agitateur floculation', [5.5, 7.5], 0.8, 0.83, 0.88, true, false], ['Pont racleur', [1.1, 1.5], 0.8, 0.76, 0.8, false, false], ['Pompe à boues', [11, 15], 0.6, 0.84, 0.9, false, false]]],
      ['Filtration', [['Surpresseur d\'air de lavage', [37, 45], 0.4, 0.86, 0.93, false, false], ['Pompe de lavage filtres', [30, 37], 0.4, 0.86, 0.92, false, false], ['Vannes motorisées', [0.37, 0.55], 0.3, 0.7, 0.75, false, true]]],
      ['Réactifs et désinfection', [['Pompes doseuses', [0.55, 0.75], 0.9, 0.75, 0.78, false, true], ['Électrolyseur de chlore', [12, 18], 0.9, 0.95, 1, false, true], ['Agitateurs réactifs', [2.2, 3], 0.7, 0.8, 0.85, false, false]]],
      ['Pompage eau traitée', [['Pompe de refoulement', [110, 132, 160], 0.85, 0.87, 0.95, true, true], ['Pompe d\'appoint', [30, 37], 0.4, 0.86, 0.92, true, false]]],
      ['Bâtiment exploitation', [['Chauffage et climatisation', [20, 30], 0.6, 0.9, 1, false, false], ['Éclairage', [6, 10], 0.9, 0.95, 1, false, true], ['Informatique et supervision', [4, 6], 0.9, 0.95, 1, false, true]]]
    ] },
    { n: 'Usine agroalimentaire (biscuiterie)', crit: 'process', ateliers: [
      ['Pétrissage', [['Pétrin spirale', [22, 30], 0.7, 0.85, 0.92, true, false], ['Doseur farine', [3, 4], 0.6, 0.8, 0.86, false, false], ['Transport pneumatique', [18.5, 22], 0.6, 0.85, 0.91, false, false]]],
      ['Façonnage', [['Laminoir', [7.5, 11], 0.7, 0.83, 0.89, true, false], ['Découpeuse rotative', [4, 5.5], 0.7, 0.82, 0.87, true, false], ['Convoyeurs', [1.5, 2.2], 0.8, 0.78, 0.82, true, false]]],
      ['Cuisson', [['Four tunnel (résistances)', [180, 240, 320], 0.8, 1, 1, false, false], ['Ventilateurs de four', [11, 15], 0.9, 0.85, 0.9, true, false], ['Extracteur de buées', [7.5, 11], 0.9, 0.85, 0.89, false, false]]],
      ['Refroidissement et emballage', [['Tour de refroidissement', [15, 18.5], 0.8, 0.85, 0.9, true, false], ['Ensacheuses', [5, 7], 0.6, 0.8, 0.85, false, false], ['Palettiseur robotisé', [12, 15], 0.5, 0.85, 0.9, true, false]]],
      ['Froid industriel', [['Compresseur frigorifique', [75, 90, 110], 0.8, 0.86, 0.94, true, true], ['Condenseurs', [7.5, 11], 0.8, 0.84, 0.88, true, true]]],
      ['Utilités', [['Compresseur d\'air', [37, 45, 55], 0.7, 0.86, 0.93, false, false], ['Chaufferie (brûleurs, pompes)', [15, 22], 0.6, 0.85, 0.9, false, true], ['Éclairage usine', [25, 35], 0.9, 0.95, 1, false, true]]]
    ] },
    { n: 'Data center régional', crit: 'it', ateliers: [
      ['Salle serveurs A', [['Baies informatiques (via ASI)', [120, 160, 200], 0.9, 0.95, 0.96, false, true], ['Climatiseurs de précision', [30, 37], 0.8, 0.88, 0.93, true, true]]],
      ['Salle serveurs B', [['Baies informatiques (via ASI)', [120, 160, 200], 0.9, 0.95, 0.96, false, true], ['Climatiseurs de précision', [30, 37], 0.8, 0.88, 0.93, true, true]]],
      ['Production de froid', [['Groupe froid à eau glacée', [180, 220, 260], 0.8, 0.88, 0.95, true, true], ['Pompes eau glacée', [22, 30], 0.9, 0.86, 0.92, true, true], ['Aéroréfrigérants', [7.5, 11], 0.8, 0.85, 0.89, true, true]]],
      ['Bureaux et sécurité', [['Climatisation bureaux', [20, 30], 0.6, 0.9, 1, false, false], ['Éclairage', [10, 15], 0.8, 0.95, 1, false, true], ['Contrôle d\'accès et vidéo', [3, 5], 1, 0.95, 1, false, true]]]
    ] },
    { n: 'Cimenterie — atelier de broyage', crit: 'continuity', ateliers: [
      ['Concassage', [['Concasseur à mâchoires', [160, 200], 0.7, 0.86, 0.95, false, false], ['Alimentateur vibrant', [11, 15], 0.7, 0.82, 0.89, true, false], ['Convoyeur à bande', [30, 37], 0.8, 0.85, 0.92, false, false]]],
      ['Broyage cru', [['Broyeur vertical', [400, 500, 630], 0.85, 0.88, 0.96, true, false], ['Ventilateur de tirage', [160, 200], 0.85, 0.87, 0.95, true, false], ['Séparateur dynamique', [55, 75], 0.8, 0.86, 0.93, true, false]]],
      ['Homogénéisation', [['Élévateur à godets', [45, 55], 0.8, 0.86, 0.93, false, false], ['Aéroglissières (soufflantes)', [7.5, 11], 0.8, 0.84, 0.88, false, false], ['Extracteur de silo', [22, 30], 0.6, 0.85, 0.91, true, false]]],
      ['Dépoussiérage', [['Ventilateur de filtre à manches', [90, 110, 132], 0.9, 0.87, 0.94, true, true], ['Vis d\'extraction', [3, 4], 0.7, 0.8, 0.85, false, false]]],
      ['Utilités', [['Compresseurs d\'air', [75, 90], 0.7, 0.86, 0.94, false, false], ['Éclairage', [15, 25], 0.9, 0.95, 1, false, true], ['Salle de contrôle', [10, 15], 0.9, 0.95, 1, false, true]]]
    ] },
    { n: 'Plateforme logistique automatisée', crit: 'process', ateliers: [
      ['Réception', [['Convoyeurs à rouleaux', [1.5, 2.2], 0.6, 0.8, 0.84, true, false], ['Quais niveleurs', [0.75, 1.1], 0.3, 0.76, 0.8, false, false], ['Portes rapides', [1.5, 2.2], 0.3, 0.78, 0.82, true, false]]],
      ['Stockage automatique', [['Transstockeurs (translation)', [30, 37], 0.5, 0.86, 0.92, true, false], ['Transstockeurs (levage)', [37, 45], 0.4, 0.86, 0.93, true, false], ['Navettes', [4, 5.5], 0.6, 0.82, 0.87, true, false]]],
      ['Préparation de commandes', [['Trieur à bandes croisées', [45, 55], 0.7, 0.86, 0.93, true, false], ['Convoyeurs', [2.2, 3], 0.7, 0.8, 0.85, true, false], ['Postes de préparation', [3, 5], 0.6, 0.9, 1, false, false]]],
      ['Expédition', [['Banderoleuses', [2.2, 3], 0.4, 0.8, 0.85, false, false], ['Convoyeurs', [1.5, 2.2], 0.7, 0.8, 0.84, true, false]]],
      ['Recharge et utilités', [['Chargeurs de chariots', [8, 12], 0.7, 0.95, 0.93, false, false], ['Bornes véhicules électriques', [22], 0.5, 0.98, 1, false, false], ['Éclairage LED', [30, 45], 0.9, 0.95, 1, false, true], ['Désenfumage', [11, 15], 0.1, 0.85, 0.9, false, true]]]
    ] }
  ];

  function build(r, lvl) {
    const site = r.pick(SITES);
    const nAt = Math.min(site.ateliers.length, 2 + lvl);
    const chosen = r.shuffle(site.ateliers).slice(0, nAt);
    const ateliers = chosen.map(([an, loads], ai) => {
      const L = loads.map(([n, Ps, ku, cos, eta, vfd, prio]) => ({ n, P: r.pick(Ps), qty: r.int(1, lvl >= 3 ? 4 : 2), ku, cos, eta, vfd, prio }));
      L.forEach(l => { l.Pu = l.qty * l.P / l.eta * l.ku; l.Qu = l.Pu * Math.tan(Math.acos(l.cos)); });
      const nCirc = L.reduce((a, l) => a + l.qty, 0), ks = ksAt(nCirc);
      const P = L.reduce((a, l) => a + l.Pu, 0) * ks, Q = L.reduce((a, l) => a + l.Qu, 0) * ks;
      return { n: an, loads: L, nCirc, ks, P, Q, S: Math.hypot(P, Q), dist: r.pick([45, 70, 95, 120, 160, 210]) + ai * 5 };
    });
    const ksSite = 0.9;
    const P = ateliers.reduce((a, x) => a + x.P, 0) * ksSite, Q = ateliers.reduce((a, x) => a + x.Q, 0) * ksSite, S0 = Math.hypot(P, Q);
    const tan2 = lvl >= 3 ? 0.4 : 0.33, cos2 = Math.cos(Math.atan(tan2));
    const Qc = Math.max(0, P * (Q / P - tan2));
    const S1 = P / cos2, ext = r.pick([0.15, 0.2, 0.25, 0.3]);
    const prio = ateliers.flatMap(a => a.loads.filter(l => l.prio));
    const Pp = prio.reduce((a, l) => a + l.Pu, 0), Qp = prio.reduce((a, l) => a + l.Qu, 0), Sp = Math.hypot(Pp, Qp);
    const twin = lvl >= 5 || S1 * (1 + ext) > 2500;
    const need = twin ? Math.max(S1 * (1 + ext) / 2, Sp * 1.0) : S1 * (1 + ext);
    const kva = T.TRANSFOS.find(k => k >= need) || 2500;
    const nT = twin ? 2 : 1;
    const InT = kva * 1000 / (Math.sqrt(3) * 400), ucc = T.ucc(kva), Icc = nT * InT * 100 / ucc / 1000;
    const pdc = PDC.find(p => p >= Icc);
    const geKva = GE.find(g => g >= 1.25 * Sp) || 2000;
    // départ : atelier le plus éloigné dont le courant reste raisonnable pour un câble unique
    const cands = ateliers.filter(a => a.S * 1000 / (Math.sqrt(3) * 400) <= 330).sort((a, b) => b.dist - a.dist);
    const fa = cands[0] || ateliers.slice().sort((a, b) => a.S - b.S)[0];
    const Ib = fa.S * 1000 / (Math.sqrt(3) * 400), cosF = fa.P / fa.S;
    const In = CAL.find(c => c >= Ib);
    const kT = T.KT[35], kG = T.KG[3], izReq = In / (kT * kG);
    let si = IZC3.findIndex(v => v >= izReq); if (si < 0) si = IZC3.length - 1;
    const sTh = si;
    while (si < SECT.length - 1 && T.dU(true, fa.dist, SECT[si], cosF, Ib) > 3) si++;
    const feeder = { at: fa.n, Ib, In, S: SECT[si], Sth: SECT[sTh], izReq, dU: T.dU(true, fa.dist, SECT[si], cosF, Ib), L: fa.dist, cos: cosF };
    const vfdP = ateliers.reduce((a, x) => a + x.loads.filter(l => l.vfd).reduce((b, l) => b + l.Pu, 0) * x.ks, 0) * ksSite;
    const vfdShare = vfdP / (kva * nT * 0.9);
    return { site: site.n, crit: site.crit, ateliers, ksSite, P, Q, S0, tan2, cos2, Qc, S1, ext, Sp, Pp, Qp, prio, twin, nT, kva, InT, ucc, Icc, pdc, geKva, feeder, vfdShare, lvl, sig: site.n + ateliers.map(a => a.n + a.loads.map(l => l.P + 'x' + l.qty).join()).join('|') };
  }

  const kv = (x, d) => AA.fmt(x, d == null ? 0 : d);
  function stages(p) {
    const s = [];
    const f = p.feeder;
    s.push({ t: 'Bilan de puissance', intro: `Pour chaque récepteur : P absorbée = P<sub>n</sub> / η, puis × k<sub>u</sub> (utilisation) × quantité, Q = P × tan φ. Chaque atelier : × k<sub>s</sub> (simultanéité selon le nombre de circuits : 2-3 → 0,9 ; 4-5 → 0,8 ; 6-9 → 0,7 ; 10 et plus → 0,6). Site : × k<sub>s</sub> = ${p.ksSite}.`,
      q: [{ k: 'P', l: 'Puissance active totale P', u: 'kW', a: p.P, tol: 0.03 }, { k: 'Q', l: 'Puissance réactive totale Q', u: 'kvar', a: p.Q, tol: 0.04 }, { k: 'S', l: 'Puissance apparente S', u: 'kVA', a: p.S0, tol: 0.03 }],
      sol: `${p.ateliers.map(a => `${esc(a.n)} : P = ${kv(a.P, 1)} kW, Q = ${kv(a.Q, 1)} kvar (k<sub>s</sub> ${a.ks})`).join('<br>')}<br><b>Site : P = ${kv(p.P, 1)} kW, Q = ${kv(p.Q, 1)} kvar, S = ${kv(p.S0, 1)} kVA, cos φ = ${(p.P / p.S0).toFixed(3)}</b>` });
    s.push({ t: 'Compensation de l\'énergie réactive', intro: `Le contrat impose tan φ ≤ ${p.tan2} (cos φ ≈ ${p.cos2.toFixed(3)}). Calcule la puissance de la batterie de condensateurs au TGBT.`,
      q: [{ k: 'Qc', l: 'Batterie de condensateurs Qc', u: 'kvar', a: p.Qc, tol: 0.05 }],
      sol: `Qc = P × (tan φ1 − tan φ2) = ${kv(p.P, 1)} × (${(p.Q / p.P).toFixed(3)} − ${p.tan2}) = <b>${kv(p.Qc, 1)} kvar</b>. Après compensation S = P / cos φ2 = ${kv(p.S1, 1)} kVA.` });
    s.push({ t: 'Poste de transformation', intro: `Prévois ${Math.round(p.ext * 100)} % de réserve pour les extensions.${p.twin ? ` Le poste comporte <b>deux transformateurs identiques</b> : en marche normale ils se partagent la charge, et chacun doit pouvoir alimenter seul toutes les charges prioritaires (secours N-1, S<sub>prio</sub> = ${kv(p.Sp, 1)} kVA).` : ''} Puissances normalisées : ${T.TRANSFOS.join(', ')} kVA.`,
      q: [{ k: 'kva', l: p.twin ? 'Puissance de chaque transformateur' : 'Puissance du transformateur', u: 'kVA', choice: T.TRANSFOS, a: p.kva }],
      sol: p.twin ? `Besoin : max(${kv(p.S1, 1)} × ${1 + p.ext} / 2 ; ${kv(p.Sp, 1)}) = ${kv(Math.max(p.S1 * (1 + p.ext) / 2, p.Sp), 1)} kVA → <b>2 × ${p.kva} kVA</b>.` : `Besoin : ${kv(p.S1, 1)} × ${1 + p.ext} = ${kv(p.S1 * (1 + p.ext), 1)} kVA → <b>${p.kva} kVA</b>.` });
    s.push({ t: 'Courant de court-circuit au TGBT', intro: `Réseau amont de puissance infinie (hypothèse majorante). Tension de court-circuit u<sub>cc</sub> = ${p.ucc} % pour un ${p.kva} kVA.${p.nT > 1 ? ' Les deux transformateurs sont couplés en parallèle sur le même jeu de barres.' : ''}`,
      q: [{ k: 'In', l: 'Courant nominal d\'un transformateur', u: 'A', a: p.InT, tol: 0.03 }, { k: 'Icc', l: 'Icc maximal au TGBT', u: 'kA', a: p.Icc, tol: 0.05 }, { k: 'pdc', l: 'Pouvoir de coupure minimal des disjoncteurs du TGBT', u: 'kA', choice: PDC, a: p.pdc }],
      sol: `I<sub>n</sub> = S / (√3 × 400) = ${p.kva} 000 / 692,8 = ${kv(p.InT, 0)} A. I<sub>cc</sub> = ${p.nT > 1 ? '2 × ' : ''}I<sub>n</sub> × 100 / u<sub>cc</sub> = <b>${kv(p.Icc, 1)} kA</b> → pouvoir de coupure ≥ <b>${p.pdc} kA</b>.` });
    s.push({ t: `Départ vers « ${f.at} »`, intro: `Câble cuivre PVC multiconducteur sur chemin de câbles (méthode C, 3 conducteurs chargés), <b>${f.L} m</b>, ambiance <b>35 °C</b>, <b>3 circuits jointifs</b>. Chute de tension admise sur ce départ : 3 %. Calibres : ${CAL.join(', ')} A.`,
      q: [{ k: 'Ib', l: 'Courant d\'emploi I<sub>B</sub>', u: 'A', a: f.Ib, tol: 0.03 }, { k: 'In', l: 'Calibre du disjoncteur', u: 'A', choice: CAL, a: f.In }, { k: 'S', l: 'Section des phases', u: 'mm²', choice: SECT, a: f.S }],
      sol: `I<sub>B</sub> = S<sub>atelier</sub> / (√3 × 400) = ${kv(f.Ib, 1)} A → I<sub>n</sub> = ${f.In} A. k = 0,94 × 0,70 = 0,658 ; I<sub>z</sub> requis = ${kv(f.izReq, 1)} A → ${f.Sth} mm²${f.S !== f.Sth ? `, porté à <b>${f.S} mm²</b> pour la chute de tension` : ''} ; ΔU = ${kv(f.dU, 2)} %.` });
    if (p.lvl >= 2) s.push({ t: 'Groupe électrogène de secours', intro: `Les récepteurs prioritaires (★) doivent rester alimentés en cas de coupure réseau, via un inverseur de sources. Règle de dimensionnement retenue : S<sub>GE</sub> ≥ 1,25 × S<sub>prioritaire</sub> (marge pour les démarrages et le vieillissement). Gamme : ${GE.join(', ')} kVA.`,
      q: [{ k: 'Sp', l: 'Puissance apparente des charges prioritaires', u: 'kVA', a: p.Sp, tol: 0.05 }, { k: 'ge', l: 'Groupe électrogène retenu', u: 'kVA', choice: GE, a: p.geKva }],
      sol: `Prioritaires : P = ${kv(p.Pp, 1)} kW, Q = ${kv(p.Qp, 1)} kvar, S = ${kv(p.Sp, 1)} kVA → 1,25 × S = ${kv(1.25 * p.Sp, 1)} kVA → <b>${p.geKva} kVA</b>.` });
    if (p.lvl >= 3) {
      const share = p.vfdShare;
      const best = share > 0.25 ? 2 : share > 0.1 ? 1 : 0;
      s.push({ t: 'Harmoniques et compensation', intro: `Les variateurs représentent environ <b>${Math.round(share * 100)} %</b> de la puissance du poste. Ils injectent des courants harmoniques (rangs 5, 7, 11…) qui peuvent entrer en résonance avec la batterie de condensateurs.`,
        q: [{ k: 'h', l: 'Quelle solution retiens-tu ?', choice: ['Rien de particulier, batterie standard', 'Batterie de condensateurs à selfs anti-harmoniques (désaccordée)', 'Batterie désaccordée + filtre actif d\'harmoniques au TGBT'], a: best, labels: true }],
        sol: share > 0.25 ? 'Au-delà de ~25 % de charges non linéaires, la batterie doit être désaccordée et un filtrage actif (ou des variateurs à faible taux d\'harmoniques) est nécessaire pour respecter les limites de distorsion.' : share > 0.1 ? 'Entre ~10 et 25 % : une batterie standard risquerait la résonance et la surchauffe ; une batterie à selfs anti-harmoniques suffit.' : 'Moins de ~10 % de charges non linéaires : une batterie standard convient.' });
    }
    if (p.lvl >= 4) {
      const opts = ['TT', 'TN-C', 'TN-S', 'IT avec contrôleur permanent d\'isolement'];
      const a = p.crit === 'it' ? 2 : p.crit === 'continuity' ? 3 : 2;
      s.push({ t: 'Schéma de liaison à la terre', intro: `Le poste est privé (HTA/BT). Exigence du client : ${p.crit === 'it' ? 'équipements informatiques sensibles, CEM irréprochable, maintenance par un personnel qualifié.' : p.crit === 'continuity' ? 'la continuité de service est vitale : un premier défaut d\'isolement ne doit pas arrêter le procédé.' : 'production continue en deux équipes, personnel de maintenance qualifié, nombreux variateurs.'}`,
        q: [{ k: 'slt', l: 'Régime retenu', choice: opts, a, labels: true }],
        sol: p.crit === 'it' ? 'TN-S : neutre et PE séparés, pas de courant harmonique dans le PE, bonne CEM ; c\'est la référence pour les data centers. Le TN-C est interdit avec du matériel informatique (courants dans le PEN).' : p.crit === 'continuity' ? 'IT : le premier défaut est seulement signalé par le CPI et recherché sans arrêt ; il faut alors déconnecter les filtres CEM des variateurs et former le personnel.' : 'TN-S : déclenchement au premier défaut par les protections, PE propre malgré les harmoniques des variateurs. Le TN-C est déconseillé avec beaucoup de variateurs (harmoniques de rang 3 dans le PEN).' });
    }
    if (p.lvl >= 5) {
      const Ir = f.In;
      s.push({ t: 'Sélectivité TGBT → atelier', intro: `En tête du tableau de l'atelier « ${esc(f.at)} », un disjoncteur de <b>${Math.round(Ir / 2)} A</b> protège le plus gros départ. En amont, le départ TGBT est réglé à <b>${Ir} A</b>. Les deux appareils sont à déclencheur électronique réglable.`,
        q: [{ k: 'sel', l: 'Comment garantir la sélectivité totale ?', choice: ['Rien à faire : le rapport des calibres suffit toujours', 'Rapport I<sub>r</sub> amont / aval ≥ 1,6 et seuils magnétiques dans un rapport ≥ 2, plus une temporisation courte retard (sélectivité chronométrique) en amont, vérifiés sur les tables du constructeur', 'Mettre un fusible en amont de chaque disjoncteur'], a: 1, labels: true }],
        sol: 'La sélectivité ampèremétrique (rapport des I<sub>r</sub> ≥ 1,6, des I<sub>m</sub> ≥ 2) ne suffit pas pour les forts courants de court-circuit : on ajoute une temporisation (chronométrique) ou on s\'appuie sur la sélectivité énergétique garantie par les tables constructeur.' });
    }
    return s;
  }

  /* Synoptique du site (SVG) */
  function synoptic(p, revealed) {
    const W = Math.max(760, p.ateliers.length * 170 + 60), H = 520;
    const busY = 230, x0 = 40;
    const stamp = (x, y, t) => `<g transform="translate(${x},${y})"><rect x="-4" y="-14" width="${t.length * 6.6 + 8}" height="19" rx="4" class="stamp"/><text class="stamp-t">${t}</text></g>`;
    let s = `<svg class="synoptic" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">`;
    s += `<text class="syn-t" x="${x0}" y="24">RÉSEAU HTA 20 kV</text><line class="syn-l hta" x1="${x0}" y1="34" x2="${W - 40}" y2="34"/>`;
    const tx = [W / 2 - (p.nT > 1 ? 90 : 0), W / 2 + 90].slice(0, p.nT);
    tx.forEach((x, i) => {
      s += `<line class="syn-l hta" x1="${x}" y1="34" x2="${x}" y2="78"/><circle class="syn-tr" cx="${x}" cy="96" r="18"/><circle class="syn-tr" cx="${x}" cy="120" r="18"/><line class="syn-l" x1="${x}" y1="138" x2="${x}" y2="${busY}"/>`;
      s += `<text class="syn-s" x="${x + 26}" y="104">T${i + 1}</text>`;
      if (revealed.kva) s += stamp(x + 26, 124, `${p.kva} kVA`);
    });
    s += `<rect class="syn-bus" x="${x0}" y="${busY - 5}" width="${W - 80}" height="10" rx="3"/><text class="syn-t" x="${x0}" y="${busY - 14}">TGBT 400 V</text>`;
    if (revealed.P) s += stamp(x0 + 90, busY - 22, `S = ${kv(p.S0)} kVA`);
    if (revealed.Icc) s += stamp(x0 + 220, busY - 22, `Icc ${kv(p.Icc, 1)} kA`);
    // compensation
    s += `<line class="syn-l" x1="${W - 90}" y1="${busY}" x2="${W - 90}" y2="${busY - 60}"/><path class="syn-cap" d="M${W - 104} ${busY - 60} h28 M${W - 104} ${busY - 68} h28"/><text class="syn-s" x="${W - 140}" y="${busY - 80}">Compensation</text>`;
    if (revealed.Qc) s += stamp(W - 160, busY - 96, `${kv(p.Qc)} kvar`);
    // groupe électrogène
    if (p.lvl >= 2) { s += `<circle class="syn-ge" cx="${x0 + 30}" cy="110" r="22"/><text class="syn-s" x="${x0 + 18}" y="115">G</text><line class="syn-l dash" x1="${x0 + 30}" y1="132" x2="${x0 + 30}" y2="${busY}"/><text class="syn-s" x="${x0 + 58}" y="104">Groupe de secours</text>`; if (revealed.ge) s += stamp(x0 + 58, 124, `${p.geKva} kVA`); }
    // ateliers
    const cw = (W - 80) / p.ateliers.length;
    p.ateliers.forEach((a, i) => {
      const x = x0 + i * cw + cw / 2, isF = a.n === p.feeder.at;
      s += `<line class="syn-l${isF ? ' feed' : ''}" x1="${x}" y1="${busY + 5}" x2="${x}" y2="${busY + 50}"/><path class="syn-brk" d="M${x - 6} ${busY + 22} l12 -8"/>`;
      s += `<rect class="syn-at${isF ? ' feed' : ''}" x="${x - cw / 2 + 8}" y="${busY + 50}" width="${cw - 16}" height="${H - busY - 60}" rx="10"/>`;
      s += `<text class="syn-an" x="${x}" y="${busY + 70}" text-anchor="middle">${esc(a.n.length > 22 ? a.n.slice(0, 21) + '…' : a.n)}</text><text class="syn-s" x="${x}" y="${busY + 84}" text-anchor="middle">${a.dist} m · ${a.nCirc} circuits</text>`;
      a.loads.forEach((l, k) => {
        const y = busY + 104 + k * 34;
        s += `<g transform="translate(${x - cw / 2 + 18},${y})"><circle r="10" class="syn-m${l.vfd ? ' vfd' : ''}"/><text class="syn-mt" text-anchor="middle" y="4">${l.cos === 1 || l.n.includes('clairage') ? 'R' : 'M'}</text>
          <text class="syn-ln" x="16" y="-1">${l.prio ? '★ ' : ''}${esc(l.n.length > 24 ? l.n.slice(0, 23) + '…' : l.n)}</text><text class="syn-lv" x="16" y="11">${l.qty} × ${AA.fmt(l.P)} kW · ku ${l.ku} · cos ${l.cos}${l.vfd ? ' · var.' : ''}</text></g>`;
      });
      if (isF && revealed.feeder) s += stamp(x - cw / 2 + 14, busY + 42, `${p.feeder.In} A · ${p.feeder.S} mm²`);
    });
    return s + '</svg>';
  }

  D.TYPES.projet = {
    name: 'Grand projet industriel', icon: 'cube', min: 2,
    desc: 'Un site complet généré au hasard : des dizaines de récepteurs, poste HTA/BT, secours, harmoniques. Mène le projet étape par étape comme un ingénieur d\'affaires.',
    gen(r, lvl) { return build(r, lvl); },
    play(main, p, done) {
      const st = stages(p);
      const revealed = {};
      let idx = 0, pts = 0;
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Grand projet · ${['', 'Initiation', 'Confirmé', 'Avancé', 'Expert', 'Maître'][p.lvl]} · ${st.length} étapes</p><h1>${esc(p.site)}</h1>
        <p>${p.ateliers.length} ateliers, ${p.ateliers.reduce((a, x) => a + x.nCirc, 0)} circuits, ${p.ateliers.reduce((a, x) => a + x.loads.length, 0)} types de récepteurs. Tu es chargé·e d'affaires : du bilan de puissance jusqu'aux choix d'ingénierie. ★ = récepteur prioritaire (secours).</p></div></div>
        <div class="card syn-card"><div class="syn-wrap"></div></div>
        <div class="proj-steps"></div>`;
      const syn = main.querySelector('.syn-wrap');
      const drawSyn = () => { syn.innerHTML = synoptic(p, revealed); };
      drawSyn();
      const box = main.querySelector('.proj-steps');
      const nav = () => `<div class="proj-nav">${st.map((x, i) => `<span class="${i < idx ? 'done' : i === idx ? 'cur' : ''}">${i + 1}. ${esc(x.t)}</span>`).join('')}</div>`;
      function show() {
        if (idx >= st.length) return finish();
        const s = st[idx];
        box.innerHTML = nav() + `<div class="card"><p class="eyebrow">Étape ${idx + 1} / ${st.length}</p><h2>${esc(s.t)}</h2><p>${s.intro}</p>
          ${idx === 0 ? `<details class="memo"><summary>Détail des récepteurs (tableau)</summary>${table(p)}</details>` : ''}
          <div class="calc">${s.q.map((q, i) => `<div class="calc-row" data-i="${i}"><label>${q.l}</label><div class="num-in">${q.choice ? `<select class="sel"><option value="">—</option>${q.choice.map((v, j) => `<option value="${q.labels ? j : v}">${q.labels ? v.replace(/<[^>]+>/g, '') : AA.fmt(v)}</option>`).join('')}</select>` : '<input inputmode="decimal" placeholder="valeur">'}<span class="unit">${q.u || ''}</span></div></div>`).join('')}</div>
          <div class="row" style="margin-top:12px"><button class="btn primary js-ok">${ic.check}Valider l'étape</button></div><div class="js-fb"></div></div>`;
        box.querySelector('.js-ok').onclick = () => {
          let good = 0;
          s.q.forEach((q, i) => {
            const row = box.querySelector(`.calc-row[data-i="${i}"]`), el = row.querySelector('input,select');
            const v = parseFloat(String(el.value).replace(',', '.'));
            const ok = q.choice ? v === q.a : Math.abs(v - q.a) <= Math.abs(q.a) * q.tol;
            if (ok) good++; row.classList.add(ok ? 'ok' : 'ko'); el.disabled = true;
          });
          pts += good / s.q.length;
          ({ 'Bilan de puissance': () => { revealed.P = 1; }, 'Compensation de l\'énergie réactive': () => { revealed.Qc = 1; }, 'Poste de transformation': () => { revealed.kva = 1; }, 'Courant de court-circuit au TGBT': () => { revealed.Icc = 1; }, 'Groupe électrogène de secours': () => { revealed.ge = 1; } }[s.t] || (() => { if (s.t.startsWith('Départ')) revealed.feeder = 1; }))();
          drawSyn();
          box.querySelector('.js-ok').remove();
          box.querySelector('.js-fb').innerHTML = `<div class="calc-row"><div class="sol">${good === s.q.length ? `<p class="ok-t">${ic.check} Étape validée.</p>` : `<p class="bad-t">${good}/${s.q.length} juste${good > 1 ? 's' : ''}. La suite utilise les valeurs de référence.</p>`}${s.sol}</div></div><button class="btn primary js-next" style="margin-top:12px">${idx < st.length - 1 ? 'Étape suivante' : 'Terminer le projet'}${ic.arrow}</button>`;
          box.querySelector('.js-next').onclick = () => { idx++; show(); box.scrollIntoView({ behavior: 'smooth' }); };
        };
      }
      function finish() {
        const score = Math.round(pts / st.length * 100);
        box.innerHTML = nav() + `<div class="result"><p class="eyebrow">Projet livré</p><div class="score-big">${score}</div><p>${score >= 85 ? 'Dossier digne d\'un bureau d\'études.' : score >= 60 ? 'Projet réalisable, mais relis les étapes en rouge.' : 'Reprends les méthodes de calcul : un autre site t\'attend, avec d\'autres données.'}</p>
          <div class="row"><a class="btn primary" href="#/defi/projet/${Date.now()}/${p.lvl}">Nouveau site</a><a class="btn" href="#/defis">Défis</a></div></div>`;
        done(score);
      }
      show();
    }
  };
  function table(p) {
    return `<div class="tablecard"><table class="t mini"><tr><th>Atelier</th><th>Récepteur</th><th>Qté</th><th>P<sub>n</sub> kW</th><th>η</th><th>k<sub>u</sub></th><th>cos φ</th></tr>${p.ateliers.map(a => a.loads.map((l, i) => `<tr>${i === 0 ? `<td rowspan="${a.loads.length}">${esc(a.n)}<br><span class="muted">${a.nCirc} circuits</span></td>` : ''}<td>${l.prio ? '★ ' : ''}${esc(l.n)}</td><td>${l.qty}</td><td>${AA.fmt(l.P)}</td><td>${l.eta}</td><td>${l.ku}</td><td>${l.cos}</td></tr>`).join('')).join('')}</table></div>`;
  }

  AA.Projets = {
    build, stages,
    selfTest(log, eq) {
      let ok = true, why = '';
      for (let i = 0; i < 120; i++) {
        const p = build(AA.rng('p' + i), 1 + (i % 5));
        const f = p.feeder;
        if (!(p.kva >= (p.twin ? Math.max(p.S1 * (1 + p.ext) / 2, p.Sp) : p.S1 * (1 + p.ext)) - 1e-6 || p.kva === 2500)) { ok = false; why = 'transfo'; break; }
        if (!(f.Ib <= f.In && f.dU <= 3.0001 || f.S === 300)) { ok = false; why = 'départ ' + JSON.stringify(f); break; }
        if (!(p.geKva >= 1.25 * p.Sp - 1e-6 || p.geKva === 2000)) { ok = false; why = 'GE'; break; }
        if (!p.pdc) { ok = false; why = 'Icc ' + p.Icc; break; }
      }
      log(ok, 'Grands projets : 120 sites générés, transformateur, départ, groupe et pouvoir de coupure cohérents ' + why);
      // vérification à la main : 630 kVA, ucc 4 % → In 909 A, Icc 22,7 kA
      const In = 630000 / (Math.sqrt(3) * 400);
      eq([Math.round(In), Math.round(In * 100 / 4 / 100) / 10], [909, 22.7], 'Grands projets : 630 kVA, ucc 4 % → In = 909 A, Icc = 22,7 kA');
      const sigs = new Set(); for (let i = 0; i < 40; i++) sigs.add(build(AA.rng('q' + i), 4).sig);
      log(sigs.size === 40, `Grands projets : 40 sites tirés, ${sigs.size} tous différents`);
    }
  };
})();
