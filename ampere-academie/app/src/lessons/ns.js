/* Niveau « Solaire, stockage et ASI » : photovoltaïque, architectures, stockage, dimensionnement, ASI. */
(function () {
  'use strict';
  const L = AA.L;


  /* Schémas interactifs */
  AA.VISDATA.HOT.pv = [`<svg viewBox="0 0 640 230" class="hot-svg">
    <g data-spot="mod"><rect x="10" y="30" width="110" height="70" rx="3" class="h-blue"/><path d="M47 30 v70 M84 30 v70 M10 53 h110 M10 76 h110" class="h-line" style="stroke:#fff;opacity:.5"/><text x="18" y="120" class="h-txt">Chaîne de modules</text></g>
    <path d="M120 50 H170 M120 80 H170" class="h-line"/>
    <g data-spot="bj"><rect x="170" y="25" width="110" height="85" rx="4" class="h-dev"/><text x="178" y="42" class="h-txt">Coffret DC</text></g>
    <g data-spot="fus"><rect x="180" y="52" width="16" height="30" class="h-win"/><text x="178" y="98" class="h-txt" style="font-size:10px">gPV</text></g>
    <g data-spot="spdc"><rect x="208" y="52" width="22" height="30" class="h-win"/><text x="205" y="98" class="h-txt" style="font-size:10px">SPD</text></g>
    <g data-spot="sect"><rect x="242" y="52" width="28" height="30" class="h-win"/><circle cx="256" cy="67" r="7" class="h-knob"/></g>
    <path d="M280 50 H330 M280 80 H330" class="h-line"/>
    <g data-spot="ond"><rect x="330" y="20" width="90" height="100" rx="6" class="h-dev"/><text x="342" y="64" class="h-txt">Onduleur</text><path d="M345 90 q8 -10 16 0 t16 0 t16 0" class="h-line"/></g>
    <path d="M420 70 H460" class="h-line"/>
    <g data-spot="ac"><rect x="460" y="30" width="80" height="80" rx="4" class="h-dev"/><text x="468" y="50" class="h-txt">Coffret AC</text><rect x="470" y="60" width="14" height="30" class="h-win"/><rect x="490" y="60" width="14" height="30" class="h-win"/><rect x="510" y="60" width="18" height="30" class="h-win"/></g>
    <path d="M540 70 H570" class="h-line"/>
    <g data-spot="cpt"><rect x="570" y="40" width="60" height="60" rx="4" class="h-dev"/><text x="580" y="74" class="h-txt">kWh</text></g>
    <g data-spot="terre"><path d="M65 100 V200 H600 V100 M370 120 V200 M500 110 V200" class="h-line" style="stroke:#2e7d32;stroke-dasharray:5 3"/><text x="250" y="218" class="h-txt">Liaison équipotentielle des masses (vert-jaune)</text></g></svg>`,
  { mod: ['Champ photovoltaïque', 'Modules raccordés en série (chaîne) : les tensions s\'additionnent. En courant continu, même à faible ensoleillement, la tension à vide est présente : un module éclairé ne se « coupe » pas.'],
    bj: ['Coffret de protection côté continu', 'Regroupe les protections du côté continu. Il est marqué « Attention : conducteurs actifs sous tension même après sectionnement côté continu ».'],
    fus: ['Fusibles gPV', 'Fusibles spéciaux photovoltaïques. Nécessaires quand plusieurs chaînes sont en parallèle et que le courant inverse possible dépasse la tenue des modules (en pratique dès 3 chaînes en parallèle) ; calibre entre 1,5 et 2,4 fois Isc et au plus le courant inverse admissible du module (IEC 62548).'],
    spdc: ['Parafoudre continu', 'Protège l\'onduleur et les modules contre les surtensions de foudre côté continu ; obligatoire selon la longueur des câbles et la densité de foudroiement.'],
    sect: ['Interrupteur-sectionneur continu', 'Permet d\'isoler l\'onduleur du champ. Il doit être prévu pour couper du courant continu à la tension maximale de la chaîne : un arc continu ne s\'éteint pas tout seul.'],
    ond: ['Onduleur', 'Recherche le point de puissance maximale (MPPT) et convertit le continu en alternatif synchronisé sur le réseau. Il intègre une protection de découplage : il cesse d\'injecter si le réseau disparaît (anti-îlotage), pour la sécurité des agents du réseau.'],
    ac: ['Coffret côté alternatif', 'Disjoncteur dédié, dispositif différentiel (de type adapté à l\'onduleur, selon la notice), parafoudre alternatif si nécessaire.'],
    cpt: ['Comptage', 'Compteur de production et/ou d\'injection selon le contrat (vente totale, autoconsommation avec vente du surplus).'],
    terre: ['Mise à la terre', 'Les cadres des modules, les structures et les masses sont reliés à la terre par une liaison équipotentielle.'] }, 'Installation photovoltaïque raccordée au réseau'];

  AA.VISDATA.HOT.ups = [`<svg viewBox="0 0 620 220" class="hot-svg">
    <g data-spot="in"><rect x="10" y="80" width="70" height="50" rx="4" class="h-dev"/><text x="18" y="110" class="h-txt">Réseau</text></g>
    <path d="M80 105 H120" class="h-line"/><path d="M100 105 V40 H420 V105" class="h-line"/><path d="M100 105 V190 H420 V105" class="h-line" style="stroke-dasharray:6 4"/>
    <g data-spot="red"><rect x="120" y="85" width="80" height="40" rx="3" class="h-dev"/><text x="126" y="110" class="h-txt">Redresseur</text></g>
    <path d="M200 105 H240" class="h-line"/>
    <g data-spot="bat"><rect x="225" y="135" width="50" height="40" rx="3" class="h-win"/><path d="M235 148 h30 M240 160 h20" class="h-line"/><text x="226" y="195" class="h-txt" style="font-size:10px">Batteries</text></g>
    <path d="M250 105 V135" class="h-line"/>
    <g data-spot="ond"><rect x="280" y="85" width="80" height="40" rx="3" class="h-dev"/><text x="290" y="110" class="h-txt">Onduleur</text></g>
    <path d="M360 105 H420" class="h-line"/>
    <g data-spot="bps"><rect x="210" y="25" width="100" height="30" rx="3" class="h-win"/><text x="218" y="45" class="h-txt" style="font-size:11px">Bypass statique</text></g>
    <g data-spot="bpm"><rect x="210" y="175" width="100" height="30" rx="3" class="h-win" style="opacity:.8"/><text x="214" y="195" class="h-txt" style="font-size:10.5px">Bypass maintenance</text></g>
    <path d="M420 105 H470" class="h-line"/>
    <g data-spot="out"><rect x="470" y="75" width="140" height="60" rx="4" class="h-dev"/><text x="480" y="102" class="h-txt">Charges sensibles</text><text x="480" y="120" class="h-txt" style="font-size:10px">serveurs, automates</text></g></svg>`,
  { in: ['Réseau d\'alimentation', 'Source normale ; souvent deux arrivées séparées pour le redresseur et pour le bypass.'],
    red: ['Redresseur-chargeur', 'Convertit l\'alternatif en continu, alimente l\'onduleur et maintient les batteries chargées.'],
    bat: ['Batteries', 'Prennent le relais instantanément si le réseau disparaît. Durée de vie réduite par la chaleur : pour les batteries au plomb, la règle usuelle est une durée de vie divisée par deux à chaque hausse de 10 °C au-dessus de 20-25 °C.'],
    ond: ['Onduleur', 'Recrée en permanence une tension sinusoïdale propre (double conversion) : la charge ne voit jamais le réseau directement.'],
    bps: ['Bypass statique', 'Commutateur électronique qui transfère la charge sur le réseau sans coupure en cas de surcharge ou de défaut de l\'onduleur, puis la reprend.'],
    bpm: ['Bypass de maintenance', 'Commutateur manuel qui alimente la charge directement par le réseau pour isoler complètement l\'ASI pendant une intervention.'],
    out: ['Utilisation', 'Les charges critiques. Les charges non critiques (éclairage, chauffage) ne sont pas raccordées à l\'ASI pour ne pas réduire son autonomie.'] }, 'ASI à double conversion'];

  /* ================= LEÇONS ================= */
  L.nsm1l1 = { min: 8, why: "Comprendre ce qui se passe dans une cellule explique toutes les caractéristiques d'un module.", screens: [[
    { h: 'L\'effet photovoltaïque' },
    { p: "Une cellule photovoltaïque est une jonction de silicium dopé. La lumière arrache des électrons qui, poussés par le champ électrique de la jonction, créent un courant continu. Une cellule au silicium donne une tension à vide d'environ 0,6 à 0,7 V : on en relie donc des dizaines en série dans un <b>module</b>." },
    { photos: ['champpv'] },
    { table: { head: ['Technologie', 'Rendement typique des modules (2024-2026)', 'Remarque'], rows: [['Monocristallin PERC (type p)', '≈ 20 à 22 %', 'Très répandu jusqu\'au milieu des années 2020'], ['TOPCon (type n)', '≈ 21 à 23 %', 'Meilleur comportement en température'], ['Hétérojonction HJT (type n)', '≈ 21 à 23 %', 'Très faible coefficient de température'], ['Bifacial', '+ 5 à 15 % de production', 'Capte aussi la lumière réfléchie par le sol (albédo)']] } }
  ]] };
  L.nsm1l2 = { min: 9, why: "Les grandeurs de la fiche technique (Voc, Isc, Vmp, Imp) servent à chaque calcul de dimensionnement.", screens: [[
    { h: 'La courbe I-V' },
    { list: ['<b>Isc</b> : courant de court-circuit (tension nulle) ; proportionnel à l\'ensoleillement.', '<b>Voc</b> : tension à vide (courant nul) ; augmente quand il fait froid.', '<b>MPP</b> : point de puissance maximale (Vmp, Imp) ; l\'onduleur le recherche en permanence.', '<b>Conditions STC</b> : 1 000 W/m², cellules à 25 °C, spectre AM 1,5. La puissance crête (Wc) est mesurée dans ces conditions.'] },
    { p: "Utilise le labo ci-dessous : fais varier l'ensoleillement et la température, et retrouve le point de puissance maximale." }
  ]] };
  L.nsm1l3 = { min: 9, why: "La chaleur et l'ombre sont les deux pertes que le concepteur doit anticiper.", screens: [[
    { h: 'Température et ombrage' },
    { list: ['La puissance baisse d\'environ <b>0,3 à 0,4 % par °C</b> au-dessus de 25 °C (cellules). En plein été, les cellules dépassent souvent 60 °C.', 'Dans une chaîne, les modules sont en série : <b>la cellule la plus faible limite le courant</b>.', 'Les <b>diodes de dérivation</b> (souvent 3 par module) contournent une partie ombrée pour limiter la perte et éviter les points chauds.'] },
    { num: { id: 'tcoef', gen: r => { const P = r.pick([400, 425, 450]), c = r.pick([0.29, 0.34, 0.39]), T = r.pick([55, 60, 65, 70]); return { q: `Module de <b>${P} Wc</b>, coefficient de puissance <b>−${AA.fmt(c)} %/°C</b>, cellules à <b>${T} °C</b>, ensoleillement 1 000 W/m². Puissance disponible ?`, a: P * (1 - c / 100 * (T - 25)), unit: 'W', tol: 0.01, sol: `P = ${P} × (1 − ${AA.fmt(c / 100, 4)} × (${T} − 25)) = ${AA.fmt(P * (1 - c / 100 * (T - 25)), 1)} W` }; } } }
  ]] };
  L.nsm1l4 = { min: 8, why: "Une bonne orientation vaut plus qu'un module supplémentaire.", screens: [[
    { h: 'Ressource solaire, orientation, inclinaison' },
    { p: "L'ensoleillement d'un site s'exprime en <b>kWh/m²/jour</b>, qu'on lit aussi comme un nombre d'« heures équivalentes de plein soleil » à 1 000 W/m². Ordres de grandeur : 1 à 1,5 en hiver dans le nord de la France, 4 à 6 dans une grande partie de l'Afrique." },
    { list: ['Orientation idéale : vers l\'équateur (plein sud dans l\'hémisphère nord, plein nord dans l\'hémisphère sud).', 'Inclinaison : proche de la latitude pour le meilleur bilan annuel ; au moins 10 à 15° pour que la pluie nettoie les modules.', 'Pour un site isolé, on dimensionne sur le mois le plus défavorable.'] }
  ]] };
  L.nsm2l1 = { min: 8, why: "Le raccordement au réseau est l'installation la plus répandue : vente totale ou autoconsommation.", screens: [[
    { h: 'Installation raccordée au réseau' },
    { list: ['<b>Vente totale</b> : toute la production est injectée et vendue.', '<b>Autoconsommation avec vente du surplus</b> : on consomme d\'abord sa production, l\'excédent part sur le réseau.', '<b>Autoconsommation totale</b> : sans injection (un dispositif empêche l\'injection).', 'L\'onduleur <b>se coupe en l\'absence de réseau</b> (protection de découplage) : sans batterie, une installation raccordée ne fonctionne pas pendant une coupure.'] },
    { photos: ['onduleurpv'] }
  ]] };
  L.nsm2l2 = { min: 8, why: "Sans réseau, l'installation doit fournir toute l'énergie, jour et nuit, beau temps et mauvais temps.", screens: [[
    { h: 'Site isolé' },
    { p: "Modules → régulateur de charge → batteries → onduleur autonome (ou appareils en continu). Le dimensionnement se fait sur le besoin journalier et le mois le moins ensoleillé, avec une autonomie de plusieurs jours pour passer les périodes nuageuses." },
    { tip: "<b>Essaie</b>Dans le simulateur, coche les appareils, puis trouve la plus petite installation qui ne coupe pas pendant les 14 jours. Change la météo : la robustesse compte autant que la moyenne." }
  ]] };
  L.nsm2l3 = { min: 8, why: "L'hybride combine réseau, solaire et batterie : c'est la solution la plus courante aujourd'hui pour se secourir.", screens: [[
    { h: 'Installation hybride' },
    { p: "Un <b>onduleur hybride</b> gère à la fois les modules, la batterie, le réseau (et parfois un groupe électrogène). Il stocke le surplus de la journée pour le soir et, s'il possède une sortie de secours, alimente les circuits prioritaires pendant une coupure du réseau." },
    { warn: "<b>Sortie secourue</b>Tous les onduleurs hybrides n'assurent pas le secours, et le temps de basculement varie (de quelques millisecondes à plusieurs secondes). Vérifier la fiche technique si des équipements sensibles sont raccordés." }
  ]] };
  L.nsm2l4 = { min: 8, why: "Le choix de l'électronique conditionne la production, la sécurité et la maintenance.", screens: [[
    { h: 'Les familles d\'onduleurs' },
    { table: { head: ['Type', 'Principe', 'Atouts', 'Limites'], rows: [['Central', 'Un gros onduleur pour tout le champ', 'Coût par kW faible', 'Centrales au sol ; panne = tout s\'arrête'], ['String', 'Un onduleur par groupe de chaînes', 'Standard résidentiel et tertiaire', 'Sensible aux ombrages partiels'], ['Micro-onduleurs', 'Un petit onduleur sous chaque module', 'Pas de haute tension continue, suivi par module', 'Plus cher, électronique en toiture'], ['Optimiseurs + onduleur', 'Convertisseur continu-continu par module', 'Gère les ombrages, suivi par module', 'Électronique en toiture']] } }
  ]] };
  L.nsm2l5 = { min: 9, why: "Un schéma photovoltaïque se lit de gauche à droite, du continu vers l'alternatif.", screens: [[
    { h: 'Lire un schéma photovoltaïque' },
    { p: "Clique chaque élément du schéma : modules, coffret de protection continu, onduleur, coffret alternatif, comptage, terre." }
  ]] };
  L.nsm3l1 = { min: 8, why: "La technologie de batterie fixe la durée de vie, l'énergie utilisable et la sécurité de l'installation.", screens: [[
    { h: 'Plomb ou lithium fer phosphate ?' },
    { photos: ['lfp'] },
    { table: { head: ['', 'Plomb (AGM, gel)', 'LiFePO4'], rows: [['Tension d\'un élément', '2 V', '3,2 V (12,8 V en 4 éléments, 51,2 V en 16)'], ['Décharge recommandée', '≈ 50 %', '80 à 90 %'], ['Cycles typiques', '≈ 500 à 1 500', '≈ 3 000 à 6 000 et plus'], ['Rendement', '≈ 80 à 85 %', '≈ 95 %'], ['Gestion', 'Simple', 'BMS obligatoire'], ['Froid', 'Capacité réduite', 'Charge interdite sous 0 °C (le BMS la bloque)']] } }
  ]] };
  L.nsm3l2 = { min: 9, why: "Ah, Wh, DoD, C-rate : sans ces notions, on achète une batterie trop petite ou qui meurt en deux ans.", screens: [[
    { h: 'Capacité, énergie, décharge' },
    { formula: 'E (Wh) = U (V) × C (Ah)', small: 'Énergie utilisable = E × profondeur de décharge (DoD)' },
    { list: ['<b>DoD</b> (profondeur de décharge) : part de la capacité qu\'on s\'autorise à utiliser.', '<b>C-rate</b> : courant rapporté à la capacité. 0,5 C pour une batterie de 200 Ah = 100 A (décharge en 2 h).', 'Plus la décharge est profonde, plus le nombre de cycles diminue (fortement pour le plomb).'] },
    { num: { id: 'bat', gen: r => { const U = r.pick([12.8, 25.6, 51.2]), C = r.pick([100, 200, 280]), d = r.pick([0.8, 0.9]); return { q: `Batterie LiFePO4 <b>${AA.fmt(U)} V ${C} Ah</b>, profondeur de décharge autorisée <b>${d * 100} %</b>. Énergie utilisable ?`, a: U * C * d / 1000, unit: 'kWh', tol: 0.01, sol: `${AA.fmt(U)} × ${C} × ${d} = ${AA.fmt(U * C * d / 1000, 2)} kWh` }; } } }
  ]] };
  L.nsm3l3 = { min: 7, why: "Une batterie lithium sans BMS est dangereuse ; avec, elle est l'une des plus sûres.", screens: [[
    { h: 'Le BMS' },
    { list: ['Surveille la tension de <b>chaque élément</b> et coupe en cas de surcharge ou de décharge profonde.', '<b>Équilibre</b> les éléments pour qu\'ils aient le même état de charge.', 'Limite le courant de charge et de décharge, surveille la température.', 'Communique avec l\'onduleur ou le régulateur (bus CAN ou RS485) pour adapter la charge.'] },
    { warn: "<b>Protection du câblage batterie</b>Un court-circuit sur une batterie délivre des milliers d'ampères : fusible ou disjoncteur continu adapté au plus près de la batterie, sections calculées, outils isolés." }
  ]] };
  L.nsm3l4 = { min: 8, why: "Le régulateur MPPT récupère jusqu'à 30 % d'énergie de plus qu'un régulateur PWM dans de nombreux cas.", screens: [[
    { h: 'PWM ou MPPT' },
    { p: "Un <b>régulateur PWM</b> relie directement les modules à la batterie : le module travaille à la tension de la batterie, souvent loin de son point de puissance maximale. Un <b>régulateur MPPT</b> convertit la tension : le module travaille à son MPP et l'excès de tension devient du courant de charge." },
    { tip: "<b>Compare</b>Avec un module 60 cellules sur une batterie 12 V, le PWM gaspille plus de la moitié de la puissance : ce couplage n'est possible qu'avec un MPPT." }
  ]] };
  L.nsm4l1 = { min: 9, why: "Tout dimensionnement commence par un bilan honnête des consommations.", screens: [[
    { h: 'Le bilan énergétique' },
    { formula: 'E (Wh/j) = Σ P (W) × durée d\'utilisation (h/j)' },
    { list: ['Lister chaque appareil, sa puissance réelle (plaque ou mesure au wattmètre) et sa durée d\'utilisation.', 'Les appareils à moteur ou à compresseur ont des pointes au démarrage : elles comptent pour la puissance de l\'onduleur, pas pour l\'énergie.', 'Ajouter le rendement de l\'onduleur (≈ 90 à 95 %).'] },
    { num: { id: 'bilan', gen: r => { const n = r.int(2, 4); const L2 = r.shuffle(AA.SOLAR.APPL).slice(0, n); const E = AA.SOLAR.dailyNeed(L2); return { q: `Calcule le besoin journalier : ${L2.map(l => `${l[0]} (${l[1]} W, ${l[2]} h/j)`).join(' ; ')}.`, a: E, unit: 'Wh/j', tol: 0.01, sol: L2.map(l => `${l[1]} × ${l[2]}`).join(' + ') + ` = ${AA.fmt(E, 0)} Wh/j` }; } } }
  ]] };
  L.nsm4l2 = { min: 9, why: "La puissance crête du champ découle du besoin et de l'ensoleillement du mois le plus défavorable.", screens: [[
    { h: 'Puissance du champ' },
    { formula: 'P<sub>c</sub> (Wc) = E / (η<sub>ond</sub> × H × PR)', small: 'H : ensoleillement en kWh/m²/j (heures équivalentes) ; PR : ratio de performance (pertes de température, câbles, poussière, ≈ 0,75 à 0,85)' },
    { num: { id: 'pc', gen: r => { const E = r.pick([1500, 2400, 3200, 4800]), H = r.pick([3.5, 4.2, 5, 5.6]); const P = E / (0.93 * H * 0.8); return { q: `Besoin <b>${E} Wh/j</b>, ensoleillement <b>${AA.fmt(H)} kWh/m²/j</b>, onduleur 93 %, PR 0,8. Puissance crête minimale ?`, a: P, unit: 'Wc', tol: 0.02, sol: `P = ${E} / (0,93 × ${AA.fmt(H)} × 0,8) = ${AA.fmt(P, 0)} Wc, soit ${Math.ceil(P / 425)} modules de 425 Wc.` }; } } }
  ]] };
  L.nsm4l3 = { min: 9, why: "La batterie porte la nuit et les jours sans soleil : sa capacité se calcule, elle ne se devine pas.", screens: [[
    { h: 'Capacité du parc de batteries' },
    { formula: 'C (Wh) = E × N / (DoD × η<sub>bat</sub>)', small: 'N : nombre de jours d\'autonomie ; en Ah : diviser par la tension du parc' },
    { num: { id: 'cbat', gen: r => { const E = r.pick([1800, 2500, 4000]), N = r.pick([1, 2, 3]), U = r.pick([24, 48]); const C = E / 0.93 * N / (0.9 * 0.95); return { q: `Besoin <b>${E} Wh/j</b> (côté alternatif, onduleur 93 %), autonomie <b>${N} jour(s)</b>, LiFePO4 (DoD 90 %, rendement 95 %), parc en <b>${U} V</b>. Capacité en Ah ?`, a: C / U, unit: 'Ah', tol: 0.03, sol: `C = ${E} / 0,93 × ${N} / (0,9 × 0,95) = ${AA.fmt(C, 0)} Wh ; / ${U} V = ${AA.fmt(C / U, 0)} Ah` }; } } }
  ]] };
  L.nsm4l4 = { min: 10, why: "Une erreur sur la tension d'une chaîne détruit un onduleur au premier matin d'hiver.", screens: [[
    { h: 'Chaînes de modules et onduleur' },
    { list: ['<b>Tension à vide par grand froid</b> : Voc(Tmin) = Ns × Voc × (1 + β × (Tmin − 25)), avec β négatif. Elle doit rester sous la tension maximale de l\'onduleur.', '<b>Tension MPP par forte chaleur</b> : elle doit rester au-dessus du minimum de la plage MPPT.', '<b>Tension MPP par grand froid</b> : sous le maximum de la plage MPPT.', '<b>Courant</b> : Np × Isc au plus égal au courant de court-circuit admissible de l\'entrée.'] },
    { num: { id: 'voc', gen: r => { const N = r.pick([10, 12, 14]), V = r.pick([37.5, 38.9, 41.2]), b = r.pick([0.25, 0.27, 0.3]), T = r.pick([-15, -10, -5]); const Voc = N * V * (1 + b / 100 * (25 - T)); return { q: `Chaîne de <b>${N} modules</b>, Voc = <b>${V} V</b>, coefficient −${b} %/°C, température minimale <b>${T} °C</b>. Tension à vide de la chaîne ?`, a: Voc, unit: 'V', tol: 0.01, sol: `${N} × ${V} × (1 + ${AA.fmt(b / 100, 4)} × ${25 - T}) = ${AA.fmt(Voc, 1)} V` }; } } }
  ]] };
  L.nsm4l5 = { min: 9, why: "Le courant continu ne passe pas par zéro : un arc continu ne s'éteint pas seul. Les protections doivent en tenir compte.", screens: [[
    { h: 'Câbles et protections côté continu' },
    { list: ['Câbles solaires double isolation, résistants aux UV (par exemple H1Z2Z2-K selon l\'EN 50618), section telle que I<sub>z</sub> ≥ 1,25 × Isc.', 'Chute de tension côté continu : recommandation de 1 %, au plus 3 % (guide UTE C 15-712-1).', 'Connecteurs de la même marque et du même modèle de part et d\'autre : mélanger des connecteurs « compatibles » crée des échauffements.', 'Fusibles gPV quand le courant inverse possible dépasse la tenue des modules (en pratique à partir de 3 chaînes en parallèle).', 'Interrupteur-sectionneur et parafoudre adaptés au courant continu et à la tension maximale.'] }
  ]] };
  L.nsm4l6 = { min: 15, why: "Le projet complet réunit tout le niveau : bilan, champ, batterie, simulation et coût.", screens: [[
    { h: 'Projet : maison autonome' },
    { p: "Choisis les appareils d'une maison, l'ensoleillement du site et la technologie de batterie, puis trouve la combinaison la moins chère qui ne coupe jamais sur 14 jours de météo variable. Ensuite, relève le défi « Site isolé photovoltaïque » : chaque client est différent." }
  ]] };
  L.nsm5l1 = { min: 7, why: "Une micro-coupure de 20 millisecondes suffit à redémarrer un serveur ou un automate : l'ASI l'en empêche.", screens: [[
    { h: 'Pourquoi une alimentation sans interruption' },
    { photos: ['asi'] },
    { list: ['Coupures longues et <b>micro-coupures</b> (de quelques millisecondes à quelques secondes).', 'Creux et surtensions, variations de fréquence (surtout sur groupe électrogène).', 'Perturbations transitoires et harmoniques.', 'Usages : informatique, automates, équipements médicaux, télécommunications, éclairage de sécurité.'] }
  ]] };
  L.nsm5l2 = { min: 10, why: "Les trois technologies d'ASI n'offrent pas du tout le même niveau de protection : il faut choisir selon la charge.", screens: [[
    { h: 'Trois technologies (IEC 62040-3)' },
    { table: { head: ['Technologie', 'Fonctionnement normal', 'Sur coupure', 'Usage'], rows: [['VFD — off-line (attente passive)', 'La charge est alimentée directement par le réseau, à travers un filtre', 'Basculement sur l\'onduleur en quelques millisecondes', 'Postes de travail, petits équipements peu sensibles'], ['VI — interactive (line-interactive)', 'Réseau régulé en tension par un autotransformateur', 'Basculement en quelques millisecondes', 'Petits serveurs, réseaux, commerce'], ['VFI — double conversion (on-line)', 'L\'onduleur alimente en permanence, à partir du redresseur', 'Aucun basculement : la batterie prend le relais sans coupure', 'Équipements critiques, salles informatiques, industrie, médical']] } }
  ]] };
  L.nsm5l3 = { min: 8, why: "Les bypass permettent d'entretenir une ASI sans couper ce qu'elle alimente.", screens: [[
    { h: 'Bypass statique et bypass de maintenance' },
    { p: "Clique les éléments du schéma d'une ASI à double conversion pour découvrir le rôle de chacun." }
  ]] };
  L.nsm5l4 = { min: 10, why: "Une ASI sous-dimensionnée bascule en bypass à la première pointe ; une ASI trop grande coûte cher et vieillit inutilement.", screens: [[
    { h: 'Dimensionner une ASI' },
    { list: ['Vérifier <b>la puissance active (kW) et la puissance apparente (kVA)</b> : les deux doivent être couvertes. Une ASI de 10 kVA à facteur de puissance de sortie 0,9 délivre au plus 9 kW.', 'Prévoir une marge (souvent 20 à 25 %) pour les extensions et les pointes.', '<b>Autonomie</b> : énergie de la batterie × rendement de l\'onduleur / puissance de la charge (les fabricants fournissent des tables, plus fiables que ce calcul pour le plomb à fort courant).'] },
    { num: { id: 'aut', gen: r => { const N = r.pick([16, 20, 32]), Ah = r.pick([7, 9, 12]), P = r.pick([1200, 2000, 3000]); const t = N * 12 * Ah * 0.92 / P * 60; return { q: `Batterie de <b>${N} blocs de 12 V ${Ah} Ah</b>, onduleur 92 %, charge <b>${P} W</b>. Autonomie estimée (calcul simple) ?`, a: t, unit: 'min', tol: 0.03, sol: `E = ${N} × 12 × ${Ah} = ${N * 12 * Ah} Wh ; t = ${N * 12 * Ah} × 0,92 / ${P} × 60 = ${AA.fmt(t, 1)} min (en pratique un peu moins pour le plomb déchargé rapidement).` }; } } }
  ]] };
  L.nsm5l5 = { min: 10, why: "En industrie, l'ASI ne travaille jamais seule : elle couvre le temps de démarrage du groupe électrogène.", screens: [[
    { h: 'ASI, groupe électrogène, inverseur de sources' },
    { list: ['À la coupure, l\'<b>ASI</b> alimente immédiatement les charges critiques.', 'Le <b>groupe électrogène</b> démarre et se stabilise (typiquement une dizaine de secondes).', 'L\'<b>inverseur de sources</b> (automatique) bascule l\'installation sur le groupe ; au retour du réseau, il rebascule.', 'Le groupe doit être dimensionné pour l\'ASI : les ASI modernes à redresseur IGBT demandent souvent 1,25 à 1,5 fois leur puissance ; suivre la recommandation du fabricant.', 'Redondance <b>N+1</b> : une ASI de plus que nécessaire, pour tolérer une panne.'] }
  ]] };

  Object.assign(AA.VISMAP, {
    nsm1l1: [{ sim: 'lab', opts: { id: 'pv' } }], nsm1l2: [{ sim: 'lab', opts: { id: 'pv' } }], nsm1l3: [{ sim: 'shade' }], nsm1l4: [{ sim: 'orient' }],
    nsm2l1: [{ hot: 'pv' }], nsm2l2: [{ sim: 'offgrid' }], nsm2l3: [{ sim: 'offgrid' }], nsm2l4: [{ sim: 'shade' }], nsm2l5: [{ hot: 'pv' }],
    nsm3l1: [{ sim: 'battery' }], nsm3l2: [{ sim: 'battery' }], nsm3l3: [{ sim: 'battery' }], nsm3l4: [{ sim: 'mppt' }],
    nsm4l1: [{ sim: 'offgrid' }], nsm4l2: [{ sim: 'offgrid' }], nsm4l3: [{ sim: 'offgrid' }], nsm4l4: [{ sim: 'strings' }], nsm4l5: [{ hot: 'pv' }], nsm4l6: [{ sim: 'offgrid' }],
    nsm5l1: [{ sim: 'ups' }], nsm5l2: [{ sim: 'ups' }], nsm5l3: [{ hot: 'ups' }], nsm5l4: [{ sim: 'ups' }], nsm5l5: [{ sim: 'ats' }]
  });
})();
