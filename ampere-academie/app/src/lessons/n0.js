/* Niveau 0 — L'électricité, enfin comprise. Chaque leçon : écrans successifs de blocs. */
(function () {
  'use strict';
  const L = AA.L;

  L.n0m1l1 = {
    min: 7, why: "Tout ce que tu câbleras, mesureras ou dépanneras repose sur cette idée : un courant, c'est un débit de charges.",
    screens: [
      [
        { h: 'Un courant, c\'est un débit' },
        { p: "Dans un fil de cuivre, des milliards d'<b>électrons libres</b> peuvent se déplacer d'atome en atome. Quand on les pousse tous dans le même sens, on obtient un <b>courant électrique</b>." },
        { analogy: "<b>Comme l'eau dans un tuyau</b>Le courant, c'est le débit : combien de charges passent à un endroit du fil chaque seconde. Plus il en passe, plus le courant est intense." },
        { sim: 'electrons' },
        { formula: 'I = <var>Q</var> / <var>t</var>', small: 'I en ampères (A), Q en coulombs (C), t en secondes (s)' },
        { p: "<b>1 ampère</b>, c'est 1 coulomb par seconde, soit environ <b>6,24 × 10<sup>18</sup> électrons</b> qui traversent la section du fil chaque seconde." }
      ],
      [
        { h: 'Deux sens à connaître' },
        { p: "Historiquement, on a choisi que le courant va du <b>+</b> vers le <b>−</b> à l'extérieur du générateur : c'est le <b>sens conventionnel</b>, celui de tous les schémas. Les électrons, eux, vont en réalité dans l'autre sens." },
        { tip: "<b>Ce qu'il faut retenir</b>Sur un schéma, une flèche de courant suit toujours le sens conventionnel. Le sens réel des électrons n'intervient presque jamais dans le métier." },
        { real: "<b>Sur le terrain</b>Les électrons avancent très lentement (de l'ordre du dixième de millimètre par seconde), mais la « poussée » se propage presque à la vitesse de la lumière : la lampe s'allume dès qu'on ferme l'interrupteur." },
        { quiz: { q: 'Dans un fil, 3 coulombs passent en 2 secondes. Quel est le courant ?', opts: ['0,67 A', '1,5 A', '6 A', '3 A'], a: 1, why: 'I = Q / t = 3 / 2 = 1,5 A.' } }
      ],
      [
        { h: 'Mesurer un courant' },
        { p: "Le courant se mesure avec un <b>ampèremètre</b>, qu'on place <b>en série</b> : le courant doit le traverser. Il faut donc ouvrir le circuit pour l'insérer… ou utiliser une <b>pince ampèremétrique</b> qui mesure le champ magnétique autour du fil, sans rien débrancher." },
        { warn: "<b>Erreur classique</b>Brancher un ampèremètre en parallèle sur une source revient à faire un court-circuit : le fusible du multimètre fond (dans le meilleur des cas)." },
        { quiz: { q: 'Comment branche-t-on un ampèremètre ?', opts: ['En parallèle sur le récepteur', 'En série dans le circuit', 'Entre la phase et la terre', 'Peu importe'], a: 1, why: "Le courant doit traverser l'appareil : il se place en série, comme un compteur d'eau sur un tuyau." } },
        { recap: ['Le courant I est un débit de charges, en ampères (A).', 'I = Q / t.', 'Sens conventionnel : du + vers le − à l\'extérieur du générateur.', "L'ampèremètre se branche en série ; la pince mesure sans ouvrir le circuit."] }
      ]
    ]
  };

  L.n0m1l2 = {
    min: 7, why: "La tension est ce qui pousse le courant. Savoir où elle est présente, c'est savoir où est le danger.",
    screens: [
      [
        { h: 'La tension, une différence' },
        { p: "Pour qu'un courant circule, il faut une <b>différence de potentiel</b> entre deux points : c'est la <b>tension</b>, notée <b>U</b>, en <b>volts (V)</b>. Une tension se mesure toujours <b>entre deux points</b>." },
        { analogy: "<b>Comme un dénivelé</b>L'eau ne coule que s'il y a une différence de hauteur. Deux réservoirs au même niveau, reliés par un tuyau : rien ne bouge. C'est pareil pour les charges électriques." },
        { table: { head: ['Source', 'Tension'], rows: [['Pile bâton', '1,5 V continu'], ['Batterie de voiture', '12 V continu'], ['Circuit de commande d\'automate', '24 V continu'], ['Prise domestique', '230 V alternatif'], ['Entre deux phases (industrie)', '400 V alternatif']] } }
      ],
      [
        { h: "Pourquoi l'oiseau ne craint rien" },
        { p: "Un oiseau posé sur une seule ligne électrique a ses deux pattes <b>au même potentiel</b> : aucune tension entre elles, donc aucun courant ne le traverse. S'il touchait en même temps un autre conducteur ou le pylône, la tension serait appliquée à son corps." },
        { warn: "<b>Pour toi, c'est pareil</b>Ce n'est pas le fil qui tue, c'est la tension appliquée entre deux points de ton corps (main-main, main-pieds). Les pieds au sol suffisent à fermer le circuit par la terre." },
        { quiz: { q: 'Le voltmètre se branche…', opts: ['en série dans le circuit', 'en parallèle, entre les deux points à comparer', 'uniquement sur la terre', 'à la place du fusible'], a: 1, why: 'Une tension est une différence entre deux points : on pose une pointe de touche sur chacun, en parallèle.' } }
      ],
      [
        { h: "Ce qu'on mesure dans une armoire" },
        { p: "Dans l'Atelier, tu pourras promener les pointes du multimètre sur un vrai schéma sous tension. Trois réflexes de dépanneur :" },
        { list: ['Entre phase et neutre : ≈ 230 V.', 'Entre deux phases : ≈ 400 V.', "Aux bornes d'un contact <b>fermé</b> : ≈ 0 V (pas de différence). Aux bornes d'un contact <b>ouvert</b> alimenté : toute la tension !"] },
        { think: { q: 'Tu mesures 230 V aux bornes d\'un bouton d\'arrêt fermé au repos. Qu\'en déduis-tu ?', a: "Un contact fermé ne doit présenter aucune tension à ses bornes. Si tu lis 230 V, c'est qu'il est en réalité <b>ouvert</b> : contact défectueux, fil desserré ou bouton enfoncé. C'est exactement ainsi qu'on localise une panne." } },
        { recap: ['La tension U (volts) est une différence de potentiel entre deux points.', 'Le voltmètre se branche en parallèle.', 'Contact fermé : 0 V à ses bornes. Contact ouvert sous tension : toute la tension.'] }
      ]
    ]
  };

  L.n0m1l3 = {
    min: 9, why: "La loi d'Ohm relie les trois grandeurs : elle sert à chaque calcul, chaque choix de composant, chaque diagnostic.",
    screens: [
      [
        { h: 'La résistance freine le courant' },
        { p: "Tout matériau s'oppose plus ou moins au passage du courant : c'est sa <b>résistance R</b>, en <b>ohms (Ω)</b>. Le cuivre résiste très peu (conducteur), le PVC énormément (isolant)." },
        { formula: 'U = <var>R</var> × <var>I</var>', small: "U en volts, R en ohms, I en ampères — et donc I = U / R, R = U / I" },
        { sim: 'ohm' },
        { tip: "<b>Joue avec le simulateur</b>Double la tension : le courant double. Double la résistance : le courant est divisé par deux. C'est toute la loi d'Ohm." }
      ],
      [
        { h: 'À toi de calculer' },
        { num: { id: 'ohm1', gen: r => { const R = r.pick([10, 22, 47, 100, 220, 470]); const U = r.pick([12, 24, 48]); return { q: `Une résistance de <b>${R} Ω</b> est alimentée sous <b>${U} V</b>. Quel courant la traverse ?`, a: U / R, unit: 'A', tol: 0.02, sol: `I = U / R = ${U} / ${R} = ${AA.fmt(U / R, 3)} A` }; } } },
        { num: { id: 'ohm2', gen: r => { const I = r.pick([0.5, 1, 2, 2.5, 4]); const R = r.pick([6, 12, 24, 46]); return { q: `Un récepteur de <b>${R} Ω</b> est parcouru par <b>${AA.fmt(I)} A</b>. Quelle tension à ses bornes ?`, a: R * I, unit: 'V', tol: 0.02, sol: `U = R × I = ${R} × ${AA.fmt(I)} = ${AA.fmt(R * I)} V` }; } } }
      ],
      [
        { h: 'La résistance dans le métier' },
        { real: "<b>Bobine de contacteur</b>Une bobine 230 V a une résistance de quelques centaines d'ohms. Mesurée hors tension à l'ohmmètre : une valeur infinie (OL) signale une bobine coupée ; une valeur proche de 0 Ω, une bobine en court-circuit." },
        { p: "La résistance d'un câble dépend de sa longueur L, de sa section S et du matériau (résistivité ρ) :" },
        { formula: 'R = <var>ρ</var> × L / S', small: 'ρ cuivre ≈ 0,0225 Ω·mm²/m (valeur normalisée pour les calculs de chute de tension)' },
        { num: { id: 'ohm3', gen: r => { const L = r.pick([20, 35, 50, 80]); const S = r.pick([1.5, 2.5, 4]); const R = 0.0225 * 2 * L / S; return { q: `Un circuit monophasé de <b>${L} m</b> (aller + retour = ${2 * L} m de conducteur) est câblé en <b>${AA.fmt(S)} mm²</b> cuivre. Résistance totale des deux conducteurs ?`, a: R, unit: 'Ω', tol: 0.03, sol: `R = 0,0225 × ${2 * L} / ${AA.fmt(S)} = ${AA.fmt(R, 3)} Ω` }; } } },
        { recap: ['U = R × I : la base de tout calcul.', 'R en ohms (Ω), mesurée hors tension.', 'R d\'un câble = ρ × L / S : plus il est long et fin, plus il résiste.'] }
      ]
    ]
  };

  L.n0m1l4 = {
    min: 8, why: "La puissance détermine la taille des câbles, des protections, et la facture d'électricité.",
    screens: [
      [
        { h: 'Puissance : le débit d\'énergie' },
        { formula: 'P = <var>U</var> × <var>I</var>', small: 'P en watts (W) — vrai en continu et pour les récepteurs résistifs en alternatif' },
        { p: "Un radiateur de 2 000 W sous 230 V absorbe I = P / U = 2 000 / 230 ≈ <b>8,7 A</b>. C'est ce courant qui chauffe les câbles : c'est pour lui qu'on choisit la section et le calibre du disjoncteur." },
        { analogy: "<b>Puissance et énergie</b>La puissance, c'est la vitesse à laquelle on remplit un seau. L'énergie, c'est la quantité d'eau dans le seau au bout d'un certain temps." },
        { formula: 'E = <var>P</var> × <var>t</var>', small: 'E en wattheures (Wh) si P en watts et t en heures — 1 kWh = 1 000 Wh' }
      ],
      [
        { h: 'Calculs de terrain' },
        { num: { id: 'pui1', gen: r => { const P = r.pick([1500, 2000, 2500, 3000, 3500]); return { q: `Un chauffe-eau de <b>${P} W</b> sous <b>230 V</b>. Quel courant absorbe-t-il ?`, a: P / 230, unit: 'A', tol: 0.02, sol: `I = P / U = ${P} / 230 = ${AA.fmt(P / 230, 2)} A` }; } } },
        { num: { id: 'pui2', gen: r => { const P = r.pick([1200, 2000, 2400, 3000]); const h = r.pick([2, 3, 4, 6]); const prix = r.pick([0.2, 0.25, 0.3]); return { q: `Un four de <b>${P} W</b> fonctionne <b>${h} h</b>. Le kWh coûte <b>${AA.fmt(prix)} €</b>. Combien coûte cette cuisson ?`, a: P / 1000 * h * prix, unit: '€', tol: 0.02, sol: `E = ${P / 1000} kW × ${h} h = ${AA.fmt(P / 1000 * h)} kWh ; coût = ${AA.fmt(P / 1000 * h)} × ${AA.fmt(prix)} = ${AA.fmt(P / 1000 * h * prix)} €` }; } } },
        { quiz: { q: 'Deux radiateurs de 2 000 W sur le même circuit 230 V protégé en 16 A. Que se passe-t-il ?', opts: ['Rien, c\'est prévu pour', 'Le courant (≈ 17,4 A) dépasse 16 A : le disjoncteur finit par déclencher', 'Les radiateurs chauffent deux fois moins', 'La tension monte à 460 V'], a: 1, why: 'I = 4 000 / 230 ≈ 17,4 A > 16 A : surcharge. Le déclencheur thermique coupe après un certain temps. Il faut deux circuits.' } },
        { recap: ['P = U × I (watts).', 'E = P × t (wattheures, kilowattheures).', 'Le courant absorbé fixe la section du câble et le calibre de la protection.'] }
      ]
    ]
  };

  L.n0m1l5 = {
    min: 8, why: "Le réseau est alternatif, les automates et l'électronique sont en continu : il faut maîtriser les deux.",
    screens: [
      [
        { h: 'Continu ou alternatif ?' },
        { p: "En <b>continu</b> (DC, ⎓), la tension garde le même sens et la même valeur : piles, batteries, alimentations 24 V. En <b>alternatif</b> (AC, ∿), elle change de sens régulièrement en suivant une sinusoïde : c'est le réseau de distribution." },
        { sim: 'scope' },
        { p: "En Europe, la fréquence est de <b>50 Hz</b> : 50 alternances complètes par seconde, soit une période T = 1 / 50 = <b>20 ms</b>." }
      ],
      [
        { h: 'Valeur efficace et valeur crête' },
        { p: "Les « 230 V » sont une <b>valeur efficace</b> : celle d'une tension continue qui chaufferait autant une résistance. La sinusoïde monte en réalité jusqu'à sa <b>valeur crête</b> :" },
        { formula: 'Û = <var>U</var><sub>eff</sub> × √2', small: '230 V efficaces ⇒ ≈ 325 V crête' },
        { warn: "<b>Isolation</b>Un isolant, un condensateur ou un composant électronique doit supporter la valeur crête (325 V sur le 230 V, ≈ 566 V entre phases en 400 V), pas seulement la valeur efficace." },
        { num: { id: 'ac1', gen: r => { const U = r.pick([24, 48, 110, 230, 400]); return { q: `Une tension sinusoïdale vaut <b>${U} V</b> efficaces. Quelle est sa valeur crête ?`, a: U * Math.SQRT2, unit: 'V', tol: 0.02, sol: `Û = ${U} × √2 = ${AA.fmt(U * Math.SQRT2, 1)} V` }; } } },
        { quiz: { q: 'Quelle est la période d\'une tension à 60 Hz (réseau nord-américain) ?', opts: ['60 ms', '16,7 ms', '20 ms', '6 ms'], a: 1, why: 'T = 1 / f = 1 / 60 ≈ 0,0167 s = 16,7 ms.' } },
        { recap: ['DC : sens constant. AC : sinusoïde, 50 Hz en Europe (T = 20 ms).', '230 V = valeur efficace ; crête ≈ 325 V.', 'Les multimètres affichent la valeur efficace (TRMS pour les signaux déformés).'] }
      ]
    ]
  };

  L.n0m1l6 = {
    min: 10, why: "La plaque signalétique est la carte d'identité d'un appareil : la lire correctement évite les erreurs de câblage les plus coûteuses.",
    screens: [
      [
        { h: 'La carte d\'identité d\'un moteur' },
        { p: "Clique sur chaque inscription de la plaque pour savoir ce qu'elle signifie et comment elle sert sur le terrain." },
        { sim: 'nameplate' }
      ],
      [
        { h: 'Le piège du 230/400 V' },
        { p: "Un moteur marqué <b>230 V Δ / 400 V Y</b> a des enroulements prévus pour 230 V. Sur un réseau 400 V entre phases, on le couple en <b>étoile (Y)</b> : chaque enroulement reçoit 400 / √3 ≈ 230 V. Sur un réseau 230 V entre phases, on le couple en <b>triangle (Δ)</b>." },
        { warn: "<b>Erreur fatale pour le moteur</b>Coupler en triangle un moteur 230/400 V sur un réseau 400 V applique 400 V à des enroulements prévus pour 230 V : il surchauffe et grille en quelques minutes." },
        { quiz: { q: 'Réseau 3 × 400 V, moteur 230 V Δ / 400 V Y. Quel couplage ?', opts: ['Triangle', 'Étoile', 'Peu importe', 'Il ne peut pas fonctionner'], a: 1, why: 'Chaque enroulement supporte 230 V. En étoile sur 400 V, il reçoit 400/√3 ≈ 230 V. Correct.' } },
        { num: { id: 'np1', gen: r => { const P = r.pick([2.2, 3, 4, 5.5, 7.5]); const eta = r.pick([0.84, 0.86, 0.88]); const cos = r.pick([0.8, 0.82, 0.85]); const I = P * 1000 / eta / (Math.sqrt(3) * 400 * cos); return { q: `Moteur triphasé 400 V : P utile <b>${AA.fmt(P)} kW</b>, rendement <b>η = ${AA.fmt(eta)}</b>, <b>cos φ = ${AA.fmt(cos)}</b>. Quel courant nominal en ligne ?`, a: I, unit: 'A', tol: 0.03, sol: `I = P / (η × √3 × U × cos φ) = ${P * 1000} / (${AA.fmt(eta)} × 1,732 × 400 × ${AA.fmt(cos)}) = ${AA.fmt(I, 2)} A` }; } } },
        { recap: ['La puissance de plaque est la puissance mécanique utile.', 'Couplage : chaque enroulement doit recevoir la plus petite tension de la plaque.', 'I = P / (η × √3 × U × cos φ) en triphasé.'] }
      ]
    ]
  };

  L.n0m2l1 = {
    min: 8, why: "Connaître les seuils de danger, c'est comprendre pourquoi les règles de sécurité ne se négocient pas.",
    screens: [
      [
        { h: 'Électrisation, électrocution' },
        { p: "On parle d'<b>électrisation</b> quand le courant traverse le corps, et d'<b>électrocution</b> quand cette électrisation entraîne la mort. Ce qui fait les dégâts, c'est l'<b>intensité</b> du courant, sa <b>durée</b> et son <b>trajet</b> (le cœur sur le trajet main-main ou main-pieds)." },
        { sim: 'body' },
        { tip: "<b>Pourquoi 30 mA ?</b>Le dispositif différentiel 30 mA coupe avant que le courant de fuite dans un corps n'atteigne les zones de paralysie respiratoire et de fibrillation, à condition d'agir vite (en quelques dizaines de millisecondes)." }
      ],
      [
        { h: 'Ce qui fixe le courant : la loi d\'Ohm, encore' },
        { p: "La résistance du corps humain varie énormément : de quelques milliers d'ohms peau sèche à moins de 1 000 Ω peau mouillée ou sous forte tension. Sous 230 V avec 1 000 Ω : I = 230 / 1 000 = <b>230 mA</b>. Mortel." },
        { num: { id: 'body1', gen: r => { const R = r.pick([1000, 1500, 2000, 5000]); const U = r.pick([50, 230, 400]); return { q: `Résistance du corps <b>${R} Ω</b>, tension de contact <b>${U} V</b>. Quel courant (en mA) traverse le corps ?`, a: U / R * 1000, unit: 'mA', tol: 0.02, sol: `I = U / R = ${U} / ${R} = ${AA.fmt(U / R, 3)} A = ${AA.fmt(U / R * 1000, 0)} mA` }; } } },
        { warn: "<b>Brûlures internes</b>Le courant chauffe les tissus sur son passage : les lésions visibles sont souvent minimes alors que les dégâts internes sont graves. Toute victime d'électrisation doit être vue par un médecin." },
        { recap: ['Le danger dépend de l\'intensité, du temps et du trajet.', '≈ 10 mA : on ne peut plus lâcher. ≈ 30 mA : paralysie respiratoire. ≈ 75 mA : fibrillation cardiaque.', 'Le différentiel 30 mA est la protection des personnes.'] }
      ]
    ]
  };

  L.n0m2l3 = {
    min: 6, why: "Le domaine de tension détermine l'habilitation nécessaire, les distances à respecter et les équipements à porter.",
    screens: [
      [
        { h: 'Les domaines de tension' },
        { p: "La norme NF C 18-510 classe les installations selon leur tension nominale :" },
        { table: { head: ['Domaine', 'Alternatif', 'Continu lisse'], rows: [['TBT — très basse tension', 'U ≤ 50 V', 'U ≤ 120 V'], ['BT — basse tension', '50 V < U ≤ 1 000 V', '120 V < U ≤ 1 500 V'], ['HTA — haute tension A', '1 kV < U ≤ 50 kV', '1,5 kV < U ≤ 75 kV'], ['HTB — haute tension B', 'U > 50 kV', 'U > 75 kV']] } },
        { real: "<b>Où les trouve-t-on ?</b>24 V continu : commande d'automates (TBT). 230/400 V : logements et usines (BT). 20 kV : réseau de distribution qui alimente les postes de transformation (HTA). 63 à 400 kV : transport (HTB)." },
        { quiz: { q: 'Une armoire de commande alimentée en 400 V triphasé relève du domaine…', opts: ['TBT', 'BT', 'HTA', 'HTB'], a: 1, why: '400 V alternatif est compris entre 50 V et 1 000 V : basse tension (BT).' } },
        { quiz: { q: 'Un circuit de commande en 24 V continu relève du domaine…', opts: ['TBT', 'BT', 'HTA', 'Aucun'], a: 0, why: '24 V continu ≤ 120 V : très basse tension.' } },
        { recap: ['TBT ≤ 50 V AC / 120 V DC.', 'BT jusqu\'à 1 000 V AC / 1 500 V DC.', 'HTA jusqu\'à 50 kV AC, HTB au-delà.'] }
      ]
    ]
  };
})();
