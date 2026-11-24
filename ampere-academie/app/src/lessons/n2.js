/* Niveau 2 — Installations domestiques : éclairage (compléments), protections, tableau de répartition (NF C 15-100). */
(function () {
  'use strict';
  const L = AA.L;

  L.n2m1l2 = {
    min: 6, why: "Le double allumage commande deux groupes de lampes depuis un même boîtier : simple, mais à câbler sans erreur.",
    screens: [
      [
        { h: 'Double allumage' },
        { p: "Un <b>interrupteur double</b> (deux mécanismes dans un même boîtier) commande deux circuits de lampes indépendants. La phase arrive sur une borne commune et repart vers chacun des deux points lumineux ; le neutre va directement aux lampes." },
        { quiz: { q: 'Combien de conducteurs (hors PE) entre l\'interrupteur double et le plafond où sont les deux lampes ?', opts: ['1', '2 : un retour par lampe', '3 : deux retours et le neutre', '4'], a: 1, why: 'Entre l\'interrupteur et les lampes : les deux retours (un par lampe). La phase arrive à l\'interrupteur ; le neutre est distribué au plafond depuis la boîte de dérivation.' } },
        { recap: ['Phase vers le commun de l\'interrupteur double.', 'Un retour par circuit de lampe.', 'Le neutre ne passe jamais par l\'interrupteur.'] }
      ]
    ]
  };

  L.n2m1l5 = {
    min: 7, why: "Minuteries et détecteurs automatisent l'éclairage des parties communes et font économiser l'énergie.",
    screens: [
      [
        { h: 'Minuterie et détection' },
        { p: "Une <b>minuterie</b> fonctionne comme un télérupteur temporisé : une impulsion sur un poussoir allume l'éclairage pour une durée réglable (1 à 10 min typiquement), puis l'éteint seule. Un <b>détecteur de présence</b> remplace les poussoirs par un capteur infrarouge et peut tenir compte de la luminosité." },
        { list: ['Minuterie à effet : un nouvel appui relance la durée complète.', 'Préavis d\'extinction : la lumière baisse ou clignote avant de s\'éteindre (obligatoire dans certaines parties communes).', 'Raccordement 3 fils ou 4 fils selon la présence de voyants lumineux dans les poussoirs.'] },
        { quiz: { q: 'Dans une cage d\'escalier de 4 étages, quelle solution est la plus adaptée ?', opts: ['Un va-et-vient', 'Une minuterie commandée par des poussoirs à chaque étage', 'Un interrupteur simple', 'Un variateur'], a: 1, why: 'Plusieurs points de commande et extinction automatique : minuterie (ou détecteurs).' } }
      ]
    ]
  };

  L.n2m3l1 = {
    min: 7, why: "Le fusible est la protection la plus ancienne et reste irremplaçable dans certains cas.",
    screens: [
      [
        { h: 'Le fusible' },
        { p: "Un élément métallique calibré fond quand le courant dépasse sa valeur pendant un certain temps : plus la surintensité est forte, plus il fond vite (caractéristique temps-courant inverse)." },
        { table: { head: ['Type', 'Usage', 'Protège contre'], rows: [['gG', 'Usage général (câbles, circuits)', 'Surcharges et courts-circuits'], ['aM', 'Accompagnement moteur', 'Courts-circuits seulement : supporte le courant de démarrage ; associé à un relais thermique'], ['gR / aR', 'Électronique de puissance (ultra-rapides)', 'Courts-circuits, protection des semi-conducteurs']] } },
        { real: "<b>Pourquoi encore des fusibles ?</b>Très grand pouvoir de coupure (souvent 100 kA et plus) pour un faible coût, limitation du courant de court-circuit, aucun vieillissement mécanique." },
        { quiz: { q: 'Quel fusible associer à un relais thermique sur un départ moteur ?', opts: ['gG', 'aM', 'aR', 'Aucun'], a: 1, why: 'aM : il laisse passer la pointe de démarrage et coupe les courts-circuits ; le relais thermique gère la surcharge.' } }
      ]
    ]
  };

  L.n2m3l2 = {
    min: 8, why: "Le disjoncteur combine deux protections dans un appareil réarmable : il faut comprendre les deux.",
    screens: [
      [
        { h: 'Thermique et magnétique' },
        { list: ['<b>Déclencheur thermique</b> : un bilame s\'échauffe avec le courant et se courbe. Lent, il protège contre les <b>surcharges</b> (quelques ampères de trop pendant des minutes).', '<b>Déclencheur magnétique</b> : une bobine attire un noyau dès que le courant atteint plusieurs fois I<sub>n</sub>. Quasi instantané (quelques millisecondes), il protège contre les <b>courts-circuits</b>.', '<b>Pouvoir de coupure</b> : courant de court-circuit maximal que l\'appareil sait couper sans se détruire (3 000 A, 6 000 A, 10 000 A…).'] },
        { warn: "<b>Pouvoir de coupure</b>Un disjoncteur dont le pouvoir de coupure est inférieur au courant de court-circuit possible à son point d'installation peut exploser. C'est l'une des étapes des grands projets des défis." },
        { quiz: { q: 'Un circuit de prises protégé en 20 A alimente 4 500 W de radiateurs (19,6 A)… puis 5 500 W (23,9 A). Que se passe-t-il ?', opts: ['Le magnétique déclenche immédiatement', 'Le thermique finit par déclencher au bout de quelques minutes', 'Rien, 23,9 A c\'est proche de 20', 'Le différentiel déclenche'], a: 1, why: 'Surcharge modérée (≈ 1,2 × In) : c\'est le rôle du thermique, qui coupe après un temps d\'autant plus long que le dépassement est faible.' } }
      ]
    ]
  };

  L.n2m3l3 = {
    min: 8, why: "Choisir la courbe, c'est éviter à la fois les déclenchements intempestifs et les courts-circuits mal coupés.",
    screens: [
      [
        { h: 'Courbes B, C, D' },
        { table: { head: ['Courbe', 'Seuil magnétique', 'Usage'], rows: [['B', '3 à 5 × I<sub>n</sub>', 'Grandes longueurs de câble, générateurs, circuits où le courant de court-circuit est faible'], ['C', '5 à 10 × I<sub>n</sub>', 'Usage général : logements, éclairage, prises, la plupart des récepteurs'], ['D', '10 à 20 × I<sub>n</sub>', 'Forts appels de courant : transformateurs, moteurs à démarrage difficile']] } },
        { num: { id: 'courbe1', gen: r => { const In = r.pick([10, 16, 20, 32]), c = r.pick(['B', 'C', 'D']); const hi = { B: 5, C: 10, D: 20 }[c]; return { q: `Disjoncteur <b>${In} A courbe ${c}</b>. À partir de quel courant le déclenchement magnétique est-il garanti ?`, a: In * hi, unit: 'A', tol: 0.01, sol: `Courbe ${c} : déclenchement magnétique garanti à ${hi} × In = ${In * hi} A.` }; } } },
        { quiz: { q: 'Un transformateur 230/24 V de 400 VA provoque des déclenchements à la mise sous tension de son disjoncteur courbe C. Que faire ?', opts: ['Mettre un calibre beaucoup plus gros', 'Passer en courbe D (appel de courant magnétisant)', 'Supprimer la protection', 'Passer en courbe B'], a: 1, why: 'L\'appel de courant à l\'enclenchement d\'un transformateur peut atteindre 10 à 20 fois son courant nominal : courbe D.' } }
      ]
    ]
  };

  L.n2m3l4 = {
    min: 9, why: "Le dispositif différentiel 30 mA est l'appareil qui sauve le plus de vies dans une installation.",
    screens: [
      [
        { h: 'Le dispositif différentiel' },
        { p: "Un tore magnétique entoure tous les conducteurs actifs (phase et neutre). En fonctionnement normal, le courant aller égale le courant retour : les champs s'annulent. Si une partie du courant s'échappe par la terre (défaut d'isolement, personne électrisée), un déséquilibre apparaît : dès qu'il dépasse le seuil <b>IΔn</b>, l'appareil coupe." },
        { table: { head: ['Sensibilité', 'Rôle'], rows: [['30 mA (haute sensibilité)', 'Protection des personnes, y compris complémentaire contre le contact direct'], ['300 mA', 'Protection contre les risques d\'incendie'], ['500 mA (type S, retardé)', 'Disjoncteur de branchement en tête d\'installation (sélectif avec les 30 mA en aval)']] } },
        { quiz: { q: 'Un différentiel protège-t-il contre un court-circuit entre phase et neutre ?', opts: ['Oui', 'Non : le courant aller reste égal au courant retour, il ne voit aucune différence', 'Oui s\'il est de 30 mA', 'Seulement en triphasé'], a: 1, why: 'Il ne mesure que la fuite vers la terre. Le court-circuit phase-neutre doit être coupé par un disjoncteur ou un fusible.' } }
      ],
      [
        { h: 'Les types de différentiels' },
        { table: { head: ['Type', 'Détecte', 'Exemples d\'usage'], rows: [['AC', 'Courants de défaut alternatifs sinusoïdaux', 'Éclairage, prises, chauffage'], ['A', 'AC + courants avec composante continue pulsée', 'Plaques de cuisson, lave-linge (exigé par la NF C 15-100), appareils électroniques'], ['F', 'A + courants à fréquences mixtes', 'Appareils à variateur monophasé (pompes à chaleur, lave-linge modernes)'], ['B', 'F + courants continus lisses', 'Variateurs triphasés, bornes de recharge sans détection DC intégrée, photovoltaïque']] } },
        { recap: ['Le différentiel compare aller et retour : il voit les fuites à la terre.', '30 mA = personnes, 300 mA = incendie, 500 mA type S en tête.', 'Choisir le type selon les récepteurs électroniques en aval.'] }
      ]
    ]
  };

  L.n2m3l6 = {
    min: 6, why: "Une surtension de foudre détruit l'électronique en une fraction de seconde : le parafoudre la dévie à la terre.",
    screens: [
      [
        { h: 'Le parafoudre' },
        { p: "Placé en tête de tableau entre les conducteurs actifs et la terre, il présente une très forte impédance en temps normal et devient conducteur pendant une surtension, ce qui écrête la tension vue par l'installation." },
        { list: ['Obligatoire selon la NF C 15-100 dans certaines zones et configurations (bâtiment équipé de paratonnerre, alimentation aérienne en zone à forte densité de foudroiement…), recommandé ailleurs.', 'Toujours associé à sa protection (disjoncteur ou fusible de déconnexion).', 'Liaisons les plus courtes possible (règle des 50 cm) : un fil long ajoute une tension inductive pendant le choc.'] },
        { quiz: { q: 'Pourquoi les liaisons d\'un parafoudre doivent-elles être très courtes ?', opts: ['Pour l\'esthétique', 'Parce que l\'inductance d\'un fil long crée une surtension supplémentaire pendant l\'onde de foudre très rapide', 'Pour économiser du câble', 'Pour le refroidissement'], a: 1, why: 'L\'onde de foudre a un front très raide : chaque mètre de câble ajoute environ 1 kV de surtension.' } }
      ]
    ]
  };

  L.n2m4l1 = {
    min: 8, why: "Le tableau de répartition est le cœur de l'installation : son architecture décide de la sécurité et du confort.",
    screens: [
      [
        { h: 'Architecture d\'un tableau de logement' },
        { list: ['<b>AGCP</b> (appareil général de commande et de protection) : le disjoncteur de branchement, différentiel 500 mA type S, réglé selon l\'abonnement.', '<b>Interrupteurs différentiels 30 mA</b> (40 A ou 63 A) : chacun protège un groupe de circuits.', '<b>Disjoncteurs divisionnaires</b> : un par circuit, calibrés selon la section.', 'Bornier de terre, répartiteur, peignes d\'alimentation.'] },
        { real: "<b>Règle de répartition</b>Un interrupteur différentiel 30 mA protège au maximum 8 circuits, et on répartit les circuits de même nature (éclairage, prises) sur plusieurs différentiels : un défaut ne doit pas plonger tout le logement dans le noir." },
        { quiz: { q: 'Un logement compte 19 circuits. Combien d\'interrupteurs différentiels 30 mA au minimum ?', opts: ['1', '2', '3', '19'], a: 2, why: '8 circuits maximum par différentiel : 19 / 8 → 3 différentiels.' } }
      ]
    ]
  };

  L.n2m4l2 = {
    min: 6, why: "Une bonne répartition limite les conséquences d'un défaut et facilite le dépannage.",
    screens: [
      [
        { h: 'Répartir les circuits' },
        { list: ['Séparer éclairage et prises d\'une même pièce sur deux différentiels différents.', 'Les circuits exigeant un type A (plaque de cuisson, lave-linge) sur un différentiel de type A.', 'Prévoir 20 % de place libre dans le tableau pour les évolutions.', 'Repérer chaque disjoncteur par une étiquette claire (« Prises cuisine », « Éclairage chambres »).'] },
        { quiz: { q: 'Pourquoi ne pas mettre tous les éclairages sur le même différentiel ?', opts: ['C\'est interdit par le fournisseur', 'Un défaut sur n\'importe quel circuit de ce groupe éteindrait toute la lumière du logement', 'Pour économiser', 'Le différentiel chaufferait'], a: 1, why: 'On garde toujours de l\'éclairage dans le logement en cas de déclenchement d\'un différentiel.' } }
      ]
    ]
  };

  L.n2m4l4 = {
    min: 8, why: "Sans prise de terre, le différentiel ne peut pas protéger contre les contacts indirects en schéma TT.",
    screens: [
      [
        { h: 'Terre et équipotentialité' },
        { list: ['<b>Prise de terre</b> : boucle à fond de fouille ou piquet, reliée à la borne principale de terre.', '<b>Conducteur de protection (PE)</b> vert-jaune jusqu\'à chaque prise et chaque appareil de classe I.', '<b>Liaison équipotentielle principale</b> : canalisations métalliques (eau, gaz, chauffage) reliées à la borne de terre.', '<b>Liaison équipotentielle supplémentaire</b> dans les salles d\'eau : toutes les masses et éléments conducteurs reliés entre eux.'] },
        { num: { id: 'terre2', gen: r => { const R = r.pick([20, 35, 60, 90, 150]); return { q: `La terre mesure <b>${R} Ω</b>. Quelle tension de contact apparaît sur une masse en défaut juste avant que le différentiel 500 mA ne déclenche ?`, a: R * 0.5, unit: 'V', tol: 0.02, sol: `U = R × IΔn = ${R} × 0,5 = ${AA.fmt(R * 0.5)} V ${R * 0.5 > 50 ? '> 50 V : dangereux, il faut améliorer la terre ou ajouter un différentiel plus sensible.' : '≤ 50 V : acceptable en local sec.'}` }; } } },
        { recap: ['Prise de terre + PE + liaisons équipotentielles = protection contre les contacts indirects.', 'R × IΔn ≤ 50 V.'] }
      ]
    ]
  };

  L.n2m4l5 = {
    min: 7, why: "Avant de mettre sous tension, on contrôle : c'est la dernière occasion de trouver une erreur sans danger.",
    screens: [
      [
        { h: 'Autocontrôle et mise en service' },
        { list: ['Hors tension : <b>continuité</b> des conducteurs de protection (chaque prise, chaque masse).', 'Hors tension : <b>isolement</b> entre conducteurs et entre conducteurs et terre au mégohmmètre (500 V DC pour les circuits 230/400 V, valeur minimale 1 MΩ).', '<b>Mesure de la prise de terre</b>.', 'Sous tension : <b>test des différentiels</b> (bouton test, puis appareil de mesure : courant et temps de déclenchement).', '<b>Polarité</b> des prises et vérification que les interrupteurs coupent la phase.'] },
        { quiz: { q: 'Quelle valeur minimale d\'isolement pour un circuit 230 V testé sous 500 V continu ?', opts: ['1 kΩ', '0,5 MΩ', '1 MΩ', '100 MΩ'], a: 2, why: 'IEC 60364-6 / NF C 15-100 : 1 MΩ minimum sous 500 V DC pour les circuits jusqu\'à 500 V.' } },
        { recap: ['Continuité PE, isolement, terre, différentiels, polarité.', 'Toujours hors tension pour continuité et isolement.'] }
      ]
    ]
  };
})();
