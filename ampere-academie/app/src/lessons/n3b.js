/* Niveau 3 — appareillage industriel, démarrages à courant réduit. */
(function () {
  'use strict';
  const L = AA.L;

  L.n3m1l1 = {
    min: 9, why: "Le contacteur est l'appareil le plus répandu des armoires industrielles : il commande la puissance avec un petit signal.",
    screens: [
      [
        { h: 'Anatomie d\'un contacteur' },
        { list: ['<b>Bobine</b> (A1-A2) : alimentée, elle attire une armature mobile.', '<b>Pôles de puissance</b> (1-2, 3-4, 5-6) : se ferment avec l\'armature, alimentent le récepteur.', '<b>Contacts auxiliaires</b> (13-14, 21-22…) : petits contacts pour la commande (auto-maintien, verrouillages, signalisation).', 'Une <b>chambre de coupure</b> éteint l\'arc qui se forme à l\'ouverture sous charge.'] },
        { table: { head: ['Catégorie d\'emploi', 'Utilisation'], rows: [['AC-1', 'Charges peu inductives (résistances de chauffage)'], ['AC-3', 'Moteurs à cage : démarrage, coupure du moteur lancé (cas le plus courant)'], ['AC-4', 'Moteurs à cage : marche par à-coups, inversion, freinage par contre-courant (usure sévère)']] } },
        { quiz: { q: 'Un contacteur choisi en AC-3 pour 9 A pilote un moteur souvent inversé en marche. Risque ?', opts: ['Aucun', 'Usure rapide des contacts : il faut le choisir pour la catégorie AC-4, donc plus gros', 'La bobine grille', 'Le moteur tourne moins vite'], a: 1, why: 'En AC-4 le contacteur coupe le courant de démarrage (6 à 8 × In) : il doit être largement surdimensionné par rapport à l\'AC-3.' } }
      ]
    ]
  };

  L.n3m1l2 = {
    min: 9, why: "Le moteur est cher et long à remplacer : sa protection contre la surcharge doit être réglée finement.",
    screens: [
      [
        { h: 'Relais thermique et disjoncteur-moteur' },
        { p: "Le <b>relais thermique</b> mesure l'échauffement provoqué par le courant dans chaque phase. Il est <b>réglé sur le courant nominal du moteur</b> lu sur la plaque. Il détecte aussi la marche en monophasé (une phase manquante) par déséquilibre." },
        { table: { head: ['Classe de déclenchement', 'Temps maximal à 7,2 × I<sub>r</sub>', 'Usage'], rows: [['10 A / 10', '≤ 10 s', 'Démarrages normaux (la plupart des moteurs)'], ['20', '≤ 20 s', 'Démarrages longs (ventilateurs à forte inertie)'], ['30', '≤ 30 s', 'Démarrages très longs (broyeurs, centrifugeuses)']] } },
        { p: "Le <b>disjoncteur-moteur</b> réunit dans un seul appareil le déclencheur thermique réglable et un déclencheur magnétique (≈ 12-14 × I<sub>r</sub>) : il remplace l'ensemble fusibles aM + relais thermique pour les petites et moyennes puissances." },
        { num: { id: 'th1', gen: r => { const P = r.pick([1.5, 2.2, 4, 5.5, 7.5]), I = { 1.5: 3.5, 2.2: 4.9, 4: 8.2, 5.5: 11, 7.5: 14.8 }[P]; return { q: `Plaque moteur : <b>${AA.fmt(P)} kW, 400 V, ${AA.fmt(I)} A</b>, couplage étoile direct sur le réseau. Sur quelle valeur règles-tu le relais thermique ?`, a: I, unit: 'A', tol: 0.02, sol: `On règle sur le courant nominal de plaque à la tension d'utilisation : ${AA.fmt(I)} A.` }; } } }
      ]
    ]
  };

  L.n3m1l3 = {
    min: 6, why: "Le sectionneur isole l'installation pour intervenir en sécurité ; il n'est pas fait pour couper un courant.",
    screens: [
      [
        { h: 'Le sectionneur porte-fusibles' },
        { list: ['Il assure la <b>séparation</b> : distance d\'ouverture garantie, souvent avec coupure visible ou indication fiable.', 'Il se manœuvre <b>à vide</b> : un contact de précoupure dans le circuit de commande fait retomber le contacteur avant l\'ouverture des pôles.', 'Il est <b>cadenassable</b> en position ouverte : c\'est l\'organe de consignation.', 'Il porte souvent les fusibles (aM pour un moteur).'] },
        { quiz: { q: 'Pourquoi un sectionneur possède-t-il un contact de précoupure ?', opts: ['Pour allumer un voyant', 'Pour couper la bobine du contacteur avant que ses propres pôles ne s\'ouvrent : il n\'a pas de pouvoir de coupure en charge', 'Pour mesurer le courant', 'Pour la terre'], a: 1, why: 'C\'est le contacteur qui coupe la charge ; le sectionneur s\'ouvre ensuite sans arc.' } }
      ]
    ]
  };

  L.n3m1l4 = {
    min: 9, why: "Les temporisations sont la mémoire du temps dans les automatismes câblés : étoile-triangle, préavis, ventilation après arrêt…",
    screens: [
      [
        { h: 'Travail ou repos ?' },
        { table: { head: ['Type', 'Quand la bobine est alimentée', 'Quand la bobine est coupée'], rows: [['Temporisé au travail (retard à l\'enclenchement)', 'Les contacts basculent <b>après</b> la durée réglée', 'Les contacts reviennent immédiatement'], ['Temporisé au repos (retard au déclenchement)', 'Les contacts basculent immédiatement', 'Les contacts reviennent <b>après</b> la durée réglée']] } },
        { real: "<b>Exemples</b>Au travail : passage étoile → triangle, préavis sonore avant démarrage. Au repos : ventilateur de refroidissement qui tourne encore 3 minutes après l'arrêt d'un four." },
        { quiz: { q: 'Un ventilateur doit continuer à tourner 2 min après l\'arrêt d\'une machine. Quelle temporisation ?', opts: ['Au travail', 'Au repos', 'Aucune', 'Un compteur'], a: 1, why: 'L\'action continue après la disparition de la commande : retard au déclenchement (repos).' } }
      ]
    ]
  };

  L.n3m1l5 = {
    min: 7, why: "L'interface homme-machine doit être comprise par n'importe quel opérateur, sans erreur possible.",
    screens: [
      [
        { h: 'Couleurs des boutons et voyants (IEC 60204-1)' },
        { table: { head: ['Couleur', 'Bouton', 'Voyant'], rows: [['Rouge', 'Arrêt d\'urgence (sur fond jaune), arrêt', 'Urgence, état dangereux'], ['Jaune', 'Intervention pour supprimer une condition anormale', 'Anomalie, attention'], ['Vert', 'Marche, mise en service', 'Fonctionnement normal'], ['Bleu', 'Action obligatoire (réarmement)', 'Action obligatoire de l\'opérateur'], ['Blanc / gris / noir', 'Fonctions générales (marche, arrêt sauf urgence)', 'Information neutre']] } },
        { warn: "<b>Arrêt d'urgence</b>Bouton rouge « coup de poing » sur fond jaune, à accrochage, contacts à ouverture positive, câblé directement ou via un relais de sécurité ; son déverrouillage ne doit jamais redémarrer la machine." },
        { quiz: { q: 'Quelle couleur pour le bouton de réarmement après un défaut ?', opts: ['Vert', 'Bleu', 'Rouge', 'Jaune sur fond rouge'], a: 1, why: 'Action obligatoire de l\'opérateur : bleu.' } }
      ]
    ]
  };

  L.n3m3l1 = {
    min: 7, why: "Le courant de démarrage d'un moteur fait chuter la tension du réseau et sollicite la mécanique : on doit savoir le limiter.",
    screens: [
      [
        { h: 'Le problème du démarrage direct' },
        { p: "À la mise sous tension, un moteur asynchrone absorbe <b>6 à 8 fois son courant nominal</b> pendant le démarrage. Pour un 45 kW (≈ 80 A), cela fait plus de 500 A : chute de tension pour les autres récepteurs, déclenchements, à-coups mécaniques sur les courroies et les réducteurs." },
        { table: { head: ['Procédé', 'Courant de démarrage', 'Couple de démarrage', 'Remarque'], rows: [['Direct', '6 à 8 In', '1,5 à 2,5 Cn', 'Simple, économique, petites puissances'], ['Étoile-triangle', '÷ 3 (≈ 2 à 2,7 In)', '÷ 3', 'Moteur prévu en triangle sur le réseau (plaque 400/690 V)'], ['Démarreur progressif', 'Réglable (2 à 5 In)', 'Réduit (∝ U²)', 'Rampe douce, arrêt progressif (pompes)'], ['Variateur de fréquence', '≈ In à 1,5 In', 'Cn dès l\'arrêt', 'Le plus performant, permet de faire varier la vitesse']] } },
        { num: { id: 'dem1', gen: r => { const In = r.pick([28, 42, 80, 140]), k = r.pick([6, 7, 8]); return { q: `Moteur de <b>${In} A</b> nominal, rapport Id/In = <b>${k}</b>. Courant de démarrage en étoile-triangle ?`, a: In * k / 3, unit: 'A', tol: 0.03, sol: `Direct : ${In * k} A ; en étoile le courant en ligne est divisé par 3 : ${AA.fmt(In * k / 3, 0)} A.` }; } } }
      ]
    ]
  };

  L.n3m3l2 = {
    min: 14, why: "L'étoile-triangle est le démarrage à courant réduit le plus répandu : il faut savoir le lire, le câbler et le dépanner.",
    screens: [
      [
        { h: 'Pourquoi le courant est divisé par 3' },
        { p: "En <b>étoile</b>, chaque enroulement reçoit la tension simple, 400/√3 ≈ 230 V. En <b>triangle</b>, il reçoit la tension composée, 400 V. Le courant dans un enroulement est donc √3 fois plus faible en étoile, et le courant en ligne (qui vaut √3 fois le courant d'enroulement en triangle) est divisé par 3 au total. Le couple, proportionnel au carré de la tension, est lui aussi divisé par 3." },
        { warn: "<b>Condition indispensable</b>Le moteur doit fonctionner en <b>triangle</b> sur le réseau : plaque 400/690 V pour un réseau 400 V. Un moteur 230/400 V est déjà en étoile en fonctionnement normal : impossible de le démarrer en étoile-triangle." },
        { circuit: 'etoile', guide: true, meter: false, tasks: [
          { t: 'Démarre : vérifie que le moteur part en étoile (KM1 + KM2)', ok: s => s.motor.M1.state === 'run' && s.motor.M1.coupling === 'Y' },
          { t: 'Attends le passage en triangle (KM1 + KM3)', ok: s => s.motor.M1.state === 'run' && s.motor.M1.coupling === 'D' },
          { t: 'Arrête la machine', ok: (s, v) => s.motor.M1.state === 'stop' && v.wasRunning }
        ] }
      ],
      [
        { h: 'Mesure-le toi-même' },
        { p: "Passe en mode Multimètre et mesure la tension aux bornes d'un enroulement (entre U1 et U2, c'est-à-dire entre la sortie de F2 et le haut de KM2) pendant l'étoile, puis pendant le triangle." },
        { circuit: 'etoile', meter: true, tasks: [
          { t: 'Mesure ≈ 230 V sur un enroulement en étoile', ok: (s, v) => s.motor.M1.coupling === 'Y' && v.lastV && Math.round(v.lastV.value) === 231 },
          { t: 'Mesure ≈ 400 V sur un enroulement en triangle', ok: (s, v) => s.motor.M1.coupling === 'D' && v.lastV && Math.round(v.lastV.value) === 400 }
        ] },
        { quiz: { q: 'Le contact temporisé KA1 55-56 est soudé. Symptôme ?', opts: ['Le moteur démarre en triangle', 'Le moteur reste en étoile : KM2 ne retombe pas et son contact 21-22 empêche KM3 de coller', 'Court-circuit immédiat', 'Rien'], a: 1, why: 'Le verrouillage joue son rôle : le moteur reste en étoile, avec un couple réduit qui le fait peiner en charge.' } },
        { recap: ['Étoile : 230 V par enroulement, courant et couple ÷ 3.', 'Triangle : 400 V par enroulement.', 'KM2 et KM3 verrouillés électriquement (et mécaniquement en pratique).', 'Relais thermique réglé à In/√3 quand il est placé dans les enroulements.'] }
      ]
    ]
  };

  L.n3m3l5 = {
    min: 8, why: "Le démarreur progressif est la solution moderne pour les pompes et les convoyeurs, sans les à-coups de l'étoile-triangle.",
    screens: [
      [
        { h: 'Le démarreur progressif' },
        { p: "Des thyristors montés tête-bêche sur chaque phase découpent la sinusoïde : la tension appliquée au moteur monte progressivement selon une rampe réglable. Le courant de démarrage est limité, le couple augmente sans à-coup. En fin de rampe, un contacteur de court-circuitage (by-pass) prend souvent le relais pour supprimer les pertes." },
        { list: ['Rampe d\'accélération et de décélération réglables : la décélération douce supprime le coup de bélier des pompes.', 'Limitation de courant réglable (par exemple 3 × In).', 'Ne permet pas de faire varier la vitesse en régime établi : la fréquence reste celle du réseau.'] },
        { quiz: { q: 'Pour une pompe dont l\'arrêt brutal fait claquer les clapets (coup de bélier), on choisit plutôt…', opts: ['Un démarrage direct', 'Un étoile-triangle', 'Un démarreur progressif avec rampe de décélération', 'Un moteur plus gros'], a: 2, why: 'La décélération contrôlée ralentit la colonne d\'eau et supprime le coup de bélier.' } }
      ]
    ]
  };
})();
