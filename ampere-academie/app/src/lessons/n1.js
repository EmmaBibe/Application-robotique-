/* Niveau 1 — Lire et dessiner un schéma : symboles IEC 60617, types de schémas, repérage, conducteurs. */
(function () {
  'use strict';
  const L = AA.L;

  L.n1m1l1 = {
    min: 5, why: "Un schéma est un langage international : un électricien japonais et un électricien sénégalais lisent le même folio sans traduction.",
    screens: [
      [
        { h: 'Un langage universel' },
        { p: "Les symboles graphiques sont définis par la norme internationale <b>IEC 60617</b> (reprise en Europe par l'EN 60617). Ils représentent <b>la fonction</b> d'un appareil, pas son aspect : un contact se dessine de la même façon qu'il soit dans un bouton, un contacteur ou un relais." },
        { list: ['Les organes sont dessinés <b>au repos</b> : non alimentés, non actionnés, protections enclenchées.', 'Les schémas de commande se lisent de haut en bas (de la phase vers le neutre) et de gauche à droite.', 'Un même appareil peut avoir ses éléments dispersés sur plusieurs folios : bobine ici, contacts là-bas. Ils portent le même repère (KM1) et des renvois.'] },
        { quiz: { q: 'Comment est dessiné un bouton Arrêt sur un schéma ?', opts: ['Enfoncé', 'Au repos, c\'est-à-dire fermé (contact à ouverture non actionné)', 'Ouvert', 'Peu importe'], a: 1, why: 'Tout organe est représenté au repos. Un contact à ouverture au repos est fermé.' } }
      ]
    ]
  };

  L.n1m1l2 = {
    min: 8, why: "Le contact est l'élément le plus fréquent d'un schéma. Confondre fermeture et ouverture, c'est inverser toute la logique.",
    screens: [
      [
        { h: 'Contacts à fermeture et à ouverture' },
        { symbols: [['no', 'Contact à fermeture (NO)', 'Ouvert au repos, se ferme quand on l\'actionne'], ['nc', 'Contact à ouverture (NF)', 'Fermé au repos, s\'ouvre quand on l\'actionne'], ['ton_no', 'NO temporisé', 'Se ferme après un délai'], ['ton_nc', 'NF temporisé', 'S\'ouvre après un délai'], ['th_nc', 'NF thermique', 'Contact 95-96 du relais thermique'], ['th_no', 'NO thermique', 'Contact 97-98 (signalisation de défaut)']] },
        { p: "Les bornes des contacts auxiliaires suivent une règle de numérotation : le <b>chiffre des unités</b> indique la fonction, le <b>chiffre des dizaines</b> le numéro d'ordre du contact sur l'appareil." },
        { table: { head: ['Unités', 'Fonction', 'Exemples'], rows: [['1-2', 'Contact à ouverture (NF)', '11-12, 21-22'], ['3-4', 'Contact à fermeture (NO)', '13-14, 23-24'], ['5-6', 'NF temporisé ou spécial', '55-56, 95-96 (thermique)'], ['7-8', 'NO temporisé ou spécial', '67-68, 97-98 (thermique)']] } }
      ],
      [
        { h: 'Vérifie tes réflexes' },
        { quiz: { q: 'Un contact repéré 43-44 est…', opts: ['un NF, 4e contact', 'un NO, 4e contact', 'un NF temporisé', 'une bobine'], a: 1, why: 'Unités 3-4 : fermeture ; dizaine 4 : quatrième contact de l\'appareil.' } },
        { quiz: { q: 'Sur un contacteur au repos, on mesure la continuité entre 21 et 22. Résultat normal ?', opts: ['Continuité (≈ 0 Ω)', 'Ouvert (OL)', 'Cela dépend de la bobine', '230 V'], a: 0, why: '21-22 est un contact à ouverture : fermé au repos.' } },
        { recap: ['NO (fermeture) : ouvert au repos. NF (ouverture) : fermé au repos.', 'Numérotation : unités 1-2 NF, 3-4 NO, 5-6 et 7-8 temporisés/spéciaux.', '95-96 et 97-98 : contacts du relais thermique.'] }
      ]
    ]
  };

  L.n1m1l3 = {
    min: 7, why: "Les récepteurs sont ce que le circuit commande : bobines, voyants, moteurs. Les reconnaître permet de lire la finalité d'un schéma.",
    screens: [
      [
        { h: 'Bobines, voyants, moteurs' },
        { symbols: [['coil', 'Bobine de contacteur / relais', 'Bornes A1-A2'], ['coil_ton', 'Bobine temporisée au travail', 'Le contact bascule après le délai'], ['telerupt', 'Télérupteur', 'Change d\'état à chaque impulsion'], ['lamp', 'Voyant / lampe', 'Bornes X1-X2'], ['motor3', 'Moteur triphasé', 'Bornes U, V, W']] },
        { real: "<b>Lire un schéma de commande</b>Chaque ligne verticale se termine presque toujours par un récepteur. Pour comprendre une ligne, pars du récepteur et remonte : « cette bobine est alimentée si… »." },
        { quiz: { q: 'Que représente un rectangle relié par A1 et A2 ?', opts: ['Un fusible', 'Une bobine de contacteur ou de relais', 'Une résistance chauffante', 'Un bornier'], a: 1, why: 'A1-A2 : bornes normalisées d\'une bobine.' } }
      ]
    ]
  };

  L.n1m1l4 = {
    min: 8, why: "Chaque protection a son symbole et son rôle. Les confondre conduit à des choix dangereux.",
    screens: [
      [
        { h: 'Les symboles des protections' },
        { symbols: [['fuse', 'Fusible', 'Coupe en fondant ; protège contre les surintensités'], ['cb', 'Disjoncteur', 'Coupe en cas de surcharge ou de court-circuit, réarmable'], ['breaker3', 'Disjoncteur-moteur tripolaire', 'Protection magnétique + thermique réglable'], ['thermal3', 'Relais thermique', 'Détecte la surcharge du moteur, agit via 95-96']] },
        { table: { head: ['Appareil', 'Court-circuit', 'Surcharge', 'Coupe le circuit lui-même ?'], rows: [['Fusible gG', 'Oui', 'Oui', 'Oui (une fois)'], ['Fusible aM', 'Oui', 'Non (accompagnement moteur)', 'Oui'], ['Disjoncteur', 'Oui (magnétique)', 'Oui (thermique)', 'Oui'], ['Relais thermique', 'Non', 'Oui', 'Non : il ouvre un contact de commande']] } },
        { quiz: { q: 'Un relais thermique seul suffit-il à protéger un moteur ?', opts: ['Oui', 'Non : il ne protège pas contre les courts-circuits, il faut des fusibles aM ou un disjoncteur magnétique en amont', 'Oui si le moteur est petit', 'Non, il faut un différentiel'], a: 1, why: 'Le relais thermique est lent et n\'ouvre pas le circuit de puissance : un court-circuit doit être coupé par une protection en amont.' } }
      ]
    ]
  };

  L.n1m1l5 = {
    min: 7, why: "Les organes de commande sont l'interface entre l'humain ou la machine et le circuit.",
    screens: [
      [
        { h: 'Poussoirs, interrupteurs, capteurs' },
        { symbols: [['pb_no', 'Bouton-poussoir NO', 'Marche : contact à fermeture, retour par ressort'], ['pb_nc', 'Bouton-poussoir NF', 'Arrêt : contact à ouverture'], ['pbm_nc', 'Arrêt d\'urgence', 'Coup de poing à accrochage, ouverture positive'], ['sw1', 'Interrupteur', 'Reste dans la position choisie'], ['sw2', 'Commutateur', 'Aiguille vers l\'une ou l\'autre sortie'], ['ls_no', 'Fin de course', 'Actionné par la machine']] },
        { warn: "<b>Arrêt d'urgence</b>Il reste enfoncé (accrochage) jusqu'à un déverrouillage volontaire, et ses contacts sont à <b>ouverture positive</b> : ils s'ouvrent mécaniquement même si le contact est soudé. On ne le confie jamais seul à un automate standard." },
        { recap: ['Marche = NO, Arrêt = NF, arrêt d\'urgence = NF à accrochage et ouverture positive.', 'Poussoir : retour automatique. Interrupteur : position maintenue.', 'Fin de course : actionné par la machine elle-même.'] }
      ]
    ]
  };

  L.n1m1l6 = {
    min: 6, why: "Un mémo pour réviser d'un coup d'œil.",
    screens: [
      [
        { h: 'Mémo des symboles du métier' },
        { symbols: [['no', 'NO', 'Fermeture'], ['nc', 'NF', 'Ouverture'], ['pb_no', 'Poussoir NO', 'Marche'], ['pb_nc', 'Poussoir NF', 'Arrêt'], ['pbm_nc', 'AU', 'Arrêt d\'urgence'], ['coil', 'Bobine', 'A1-A2'], ['coil_ton', 'Bobine tempo', 'Retard au travail'], ['lamp', 'Voyant', 'X1-X2'], ['fuse', 'Fusible', ''], ['cb', 'Disjoncteur', ''], ['km3', 'Pôles de contacteur', '1-2, 3-4, 5-6'], ['breaker3', 'Disjoncteur-moteur', ''], ['thermal3', 'Relais thermique', ''], ['motor3', 'Moteur 3~', 'U V W'], ['sw2', 'Commutateur', 'Va-et-vient']] },
        { tip: "<b>Pour aller plus loin</b>Ouvre l'Atelier : chaque symbole y est vivant, tu peux l'actionner et voir son effet sur le circuit." }
      ]
    ]
  };

  L.n1m2l1 = {
    min: 6, why: "Avant le détail des fils, un projet se pense en blocs : c'est le rôle des schémas d'architecture.",
    screens: [
      [
        { h: 'Voir l\'installation de haut' },
        { p: "Le <b>schéma synoptique</b> (ou architectural) représente l'installation par blocs reliés par des flèches : poste de livraison → TGBT → tableaux divisionnaires → récepteurs. Il ne montre ni les fils ni les bornes, seulement l'organisation et les flux d'énergie ou d'information." },
        { real: "<b>Dans les grands projets</b>C'est le premier document d'une étude : il sert à discuter avec le client, à faire le bilan de puissance et à découper le projet en lots. Les grands projets des défis commencent par un synoptique." },
        { quiz: { q: 'Quel schéma pour présenter l\'organisation d\'une usine au client ?', opts: ['Le schéma développé', 'Le synoptique', 'Le plan de câblage', 'Le schéma multifilaire'], a: 1, why: 'Le synoptique montre l\'architecture d\'ensemble, sans détail de câblage.' } }
      ]
    ]
  };

  L.n1m2l2 = {
    min: 7, why: "L'unifilaire est le schéma des tableaux électriques : un trait représente un circuit entier, quel que soit le nombre de conducteurs.",
    screens: [
      [
        { h: 'Le schéma unifilaire' },
        { p: "Un seul trait par circuit ; de petites barres obliques indiquent le nombre de conducteurs (/// = 3). On y lit d'un coup d'œil : protections, calibres, sections, différentiels, répartition des circuits." },
        { table: { head: ['Indication sur l\'unifilaire', 'Signification'], rows: [['3G2,5', 'Câble 3 conducteurs dont un vert-jaune, 2,5 mm²'], ['20 A', 'Calibre du disjoncteur'], ['30 mA type A', 'Interrupteur différentiel haute sensibilité, type A'], ['5G16', 'Câble 5 conducteurs (3 phases, neutre, PE) de 16 mm²']] } },
        { quiz: { q: 'Que signifie « 3G1,5 » ?', opts: ['3 câbles de 1,5 mm²', 'Un câble à 3 conducteurs dont un vert-jaune, section 1,5 mm²', '3 circuits protégés à 1,5 A', 'Un câble de 3 m'], a: 1, why: 'Le G signale la présence d\'un conducteur vert-jaune (protection) dans le câble.' } }
      ]
    ]
  };

  L.n1m2l3 = {
    min: 6, why: "Le multifilaire représente chaque conducteur : c'est le schéma qu'on suit pour raccorder.",
    screens: [
      [
        { h: 'Le schéma multifilaire' },
        { p: "Chaque conducteur est dessiné. Il montre exactement quelles bornes sont reliées entre elles, avec leurs repères. Pour un circuit de puissance triphasé, on voit les trois phases (et le neutre, le PE) passer d'appareil en appareil." },
        { p: "Les circuits de puissance des folios de l'Atelier sont dessinés en multifilaire : trois traits L1, L2, L3 traversent le disjoncteur-moteur, le contacteur et le relais thermique jusqu'au moteur." },
        { quiz: { q: 'Pour câbler un départ moteur pas à pas, on utilise plutôt…', opts: ['Le synoptique', 'L\'unifilaire', 'Le multifilaire et le schéma développé', 'Le plan du bâtiment'], a: 2, why: 'Le câbleur a besoin de chaque conducteur et de chaque borne.' } }
      ]
    ]
  };

  L.n1m2l4 = {
    min: 8, why: "Le schéma développé est la forme reine de l'industrie : c'est lui qui explique le fonctionnement d'une machine.",
    screens: [
      [
        { h: 'Puissance et commande séparées' },
        { p: "Le schéma <b>développé</b> sépare le circuit de puissance et le circuit de commande. La commande est dessinée en lignes verticales entre deux traits horizontaux (phase en haut, neutre en bas), chaque élément à sa place logique, sans tenir compte de sa position physique." },
        { circuit: 'dol', guide: true },
        { quiz: { q: 'Dans un schéma développé, où trouve-t-on les contacts d\'un contacteur ?', opts: ['Tous dessinés à côté de sa bobine', 'Là où leur fonction l\'exige, chacun dans sa ligne, avec le repère du contacteur et un renvoi vers sa bobine', 'Uniquement dans la puissance', 'Sur un folio séparé'], a: 1, why: 'Les éléments d\'un même appareil sont dispersés selon la logique du circuit ; les renvois sous la bobine indiquent où sont ses contacts.' } }
      ]
    ]
  };

  L.n1m2l5 = {
    min: 6, why: "Le plan d'implantation et le schéma de câblage transforment le schéma en armoire réelle.",
    screens: [
      [
        { h: 'De la feuille à l\'armoire' },
        { list: ['<b>Plan d\'implantation</b> : position réelle des appareils sur la plaque de montage (rails, goulottes, borniers), à l\'échelle.', '<b>Plan de câblage</b> : liste ou dessin des liaisons fil à fil, avec repères de bornes, sections et couleurs.', '<b>Nomenclature</b> : liste du matériel avec références, quantités et fournisseurs.'] },
        { real: "<b>Dans le Coffret 3D</b>Le coffret de démarrage direct est implanté comme un vrai : disjoncteur-moteur en haut, contacteur et relais thermique au milieu, bornier en bas, goulottes entre les rangées." },
        { quiz: { q: 'Quel document donne la position exacte des appareils sur la plaque ?', opts: ['Le schéma développé', 'Le plan d\'implantation', 'La nomenclature', 'Le synoptique'], a: 1, why: 'L\'implantation est un plan à l\'échelle de la plaque de montage.' } }
      ]
    ]
  };

  L.n1m2l6 = {
    min: 8, why: "Une méthode systématique évite de se perdre dans un schéma de 50 folios.",
    screens: [
      [
        { h: 'Lire un schéma en 5 questions' },
        { list: ['<b>Que fait la machine ?</b> Lire le cartouche, le synoptique, la description du fonctionnement.', '<b>D\'où vient l\'énergie ?</b> Repérer l\'arrivée, les protections de tête, les tensions (puissance, commande).', '<b>Quels sont les récepteurs ?</b> Moteurs, résistances, électrovannes, voyants : ce que le schéma doit piloter.', '<b>Qu\'est-ce qui les commande ?</b> Pour chaque récepteur, remonter la ligne : quelles conditions doivent être réunies ?', '<b>Quelles sécurités ?</b> Arrêt d\'urgence, verrouillages, protections, priorité à l\'arrêt.'] },
        { circuit: 'inversion', guide: true, tasks: [{ t: 'Applique la méthode : fais tourner le moteur dans les deux sens en respectant les verrouillages', ok: (s, v) => { v._a = v._a || s.motor.M1.dir > 0 && s.motor.M1.state === 'run'; v._b = v._b || s.motor.M1.dir < 0 && s.motor.M1.state === 'run'; return v._a && v._b; } }] },
        { recap: ['Fonction → énergie → récepteurs → conditions → sécurités.', 'Toujours partir du récepteur et remonter.'] }
      ]
    ]
  };

  L.n1m3l1 = {
    min: 8, why: "Chaque appareil porte un repère unique qui le relie au schéma, à la nomenclature et à l'étiquette dans l'armoire.",
    screens: [
      [
        { h: 'Repérer les appareils' },
        { p: "La norme <b>IEC 81346-2</b> classe les objets par lettre selon leur fonction. En France, l'usage conserve souvent les repères historiques à deux lettres (KM, KA)." },
        { table: { head: ['Lettre', 'Fonction', 'Exemples'], rows: [['Q', 'Commuter un circuit d\'énergie', 'Sectionneur, disjoncteur, disjoncteur-moteur (Q1)'], ['K (KM, KA)', 'Traiter un signal / commuter', 'Contacteur KM1, relais auxiliaire KA1'], ['F', 'Protéger', 'Fusible F1, relais thermique F2'], ['S', 'Commande manuelle', 'Bouton S1, commutateur SA1'], ['B', 'Capter une grandeur', 'Capteur B1, fin de course'], ['H', 'Signaler', 'Voyant H1, klaxon HA1'], ['M', 'Mouvoir', 'Moteur M1'], ['T', 'Transformer', 'Transformateur T1'], ['X', 'Raccorder', 'Bornier X1, connecteur'], ['W', 'Câble', 'W12']] } },
        { quiz: { q: 'Un relais temporisé se repère généralement…', opts: ['M2', 'KA1', 'F3', 'X1'], a: 1, why: 'Relais auxiliaire (y compris temporisé) : K, souvent KA.' } }
      ]
    ]
  };

  L.n1m3l2 = {
    min: 6, why: "Les numéros de bornes permettent de câbler et de dépanner sans ambiguïté.",
    screens: [
      [
        { h: 'Repérer les bornes' },
        { table: { head: ['Élément', 'Bornes'], rows: [['Pôles de puissance d\'un contacteur', '1-2, 3-4, 5-6 (entrée impaire, sortie paire)'], ['Bobine', 'A1-A2'], ['Contacts auxiliaires', '13-14, 21-22, 33-34…'], ['Relais thermique', 'Puissance 1-2, 3-4, 5-6 ; contacts 95-96 (NF), 97-98 (NO)'], ['Moteur triphasé', 'U1 V1 W1 / U2 V2 W2'], ['Voyant', 'X1-X2']] } },
        { quiz: { q: 'Côté puissance, le réseau arrive sur les bornes…', opts: ['2-4-6', '1-3-5', 'A1-A2', '95-96'], a: 1, why: 'Bornes impaires côté alimentation, paires côté récepteur.' } }
      ]
    ]
  };

  L.n1m3l3 = {
    min: 7, why: "Dans un dossier de 40 folios, les renvois sont le fil d'Ariane qui relie bobines et contacts.",
    screens: [
      [
        { h: 'Folios, colonnes et renvois' },
        { p: "Chaque folio est découpé en colonnes numérotées en haut. Sous chaque bobine, un petit tableau liste ses contacts et la colonne où chacun se trouve (par exemple « 13-14 /6 » : le contact 13-14 est dessiné colonne 6). Inversement, un contact peut porter la référence de sa bobine." },
        { circuit: 'dol' },
        { quiz: { q: 'Sous la bobine KM1 de ce folio, que signifie « 23-24 NO /7 » ?', opts: ['KM1 a 7 contacts', 'Le contact à fermeture 23-24 de KM1 est dessiné dans la colonne 7', 'Il faut 7 secondes', 'Borne 7 du bornier'], a: 1, why: 'C\'est un renvoi : on retrouve le contact 23-24 (qui alimente le voyant H1) dans la colonne 7.' } }
      ]
    ]
  };

  L.n1m3l4 = {
    min: 5, why: "Le cartouche identifie le document : sans lui, impossible de savoir si on travaille sur la bonne version.",
    screens: [
      [
        { h: 'Le cartouche et la nomenclature' },
        { list: ['Nom du projet et de l\'installation', 'Titre et numéro du folio, nombre total de folios', 'Indice de révision (A, B, C…) et date : on travaille toujours sur la dernière révision', 'Auteur, vérificateur, approbateur'] },
        { p: "La <b>nomenclature</b> associe chaque repère à une désignation, une référence fabricant et une quantité. Elle sert à commander le matériel et à le remplacer à l'identique." },
        { quiz: { q: 'Deux folios portent le même numéro, révisions B et D. Lequel suivre ?', opts: ['B', 'D, la plus récente', 'Le plus lisible', 'Celui qui est dans l\'armoire'], a: 1, why: 'La révision la plus récente fait foi (après vérification que l\'installation y est conforme).' } }
      ]
    ]
  };

  L.n1m3l5 = {
    min: 6, why: "Un fil repéré aux deux bouts se retrouve en quelques secondes ; un fil anonyme peut coûter une heure de recherche.",
    screens: [
      [
        { h: 'Repérer conducteurs et borniers' },
        { list: ['Chaque conducteur porte un repère à ses deux extrémités (bague ou manchon), identique au numéro d\'équipotentielle du schéma.', 'Le bornier X1 regroupe les liaisons avec l\'extérieur ; chaque borne est numérotée.', 'Bornes bleues pour le neutre, vert-jaune pour le PE.', 'Les liaisons vers la porte (boutons, voyants) passent par un faisceau souple.'] },
        { recap: ['Un repère par équipotentielle, aux deux bouts.', 'Tout ce qui sort de l\'armoire passe par le bornier.'] }
      ]
    ]
  };

  L.n1m4l1 = {
    min: 6, why: "Connaître la constitution d'un câble permet de le choisir et de le mettre en œuvre correctement.",
    screens: [
      [
        { h: 'Anatomie d\'un câble' },
        { list: ['<b>Âme</b> : le métal conducteur (cuivre ou aluminium), rigide (un ou quelques brins) ou souple (nombreux brins fins).', '<b>Isolant</b> : enveloppe de chaque conducteur (PVC, PR, caoutchouc).', '<b>Gaine</b> : protection mécanique et chimique de l\'ensemble.', 'Parfois un <b>écran</b> ou une <b>armure</b> (CEM, protection mécanique).'] },
        { quiz: { q: 'On appelle « fil » ou « conducteur isolé »…', opts: ['Un conducteur avec son seul isolant, sans gaine', 'Un câble multiconducteur gainé', 'Un câble armé', 'Une barre de cuivre'], a: 0, why: 'Un conducteur isolé (comme le H07V-U) n\'a pas de gaine : il doit être protégé par un conduit ou une goulotte.' } }
      ]
    ]
  };

  L.n1m4l2 = {
    min: 7, why: "Les couleurs permettent d'identifier un conducteur au premier regard — et une erreur de couleur peut tuer.",
    screens: [
      [
        { h: 'Couleurs normalisées' },
        { table: { head: ['Conducteur', 'Couleur'], rows: [['Protection (PE)', 'Vert-jaune, exclusivement'], ['Neutre', 'Bleu clair'], ['Phases (installations)', 'Marron, noir, gris (toute couleur sauf vert-jaune et bleu)'], ['Puissance dans une armoire de machine (IEC 60204-1)', 'Noir'], ['Commande en alternatif', 'Rouge'], ['Commande en continu', 'Bleu foncé'], ['Circuits alimentés par une source extérieure, restant sous tension armoire coupée', 'Orange']] } },
        { warn: "<b>Le vert-jaune est sacré</b>Il ne sert qu'au conducteur de protection. L'utiliser comme phase, même « temporairement », met en danger tous ceux qui interviendront après." },
        { quiz: { q: 'Dans une armoire, des fils orange signalent…', opts: ['Le neutre', 'Des circuits qui restent sous tension quand on ouvre le sectionneur général', 'La terre', 'Le 24 V'], a: 1, why: 'Orange (IEC 60204-1) : conducteurs alimentés par une source extérieure, non coupés par le sectionneur de la machine. Attention avant d\'intervenir.' } }
      ]
    ]
  };

  L.n1m4l3 = {
    min: 8, why: "Une section trop faible chauffe ; trop forte, elle coûte cher. Le choix se calcule.",
    screens: [
      [
        { h: 'Section et courant admissible' },
        { p: "Le courant admissible <b>I<sub>z</sub></b> d'un conducteur dépend de sa section, du matériau, de l'isolant, du mode de pose, de la température ambiante et du nombre de circuits voisins. Il est donné par des tableaux normalisés (IEC 60364-5-52)." },
        { table: { head: ['Section cuivre', 'I<sub>z</sub> PVC, pose C, 2 conducteurs chargés, 30 °C'], rows: [['1,5 mm²', '19,5 A'], ['2,5 mm²', '27 A'], ['4 mm²', '36 A'], ['6 mm²', '46 A'], ['10 mm²', '63 A']] } },
        { p: "En logement, la NF C 15-100 simplifie avec des couples section / protection : 1,5 mm² → 16 A (éclairage, ou prises en nombre limité), 2,5 mm² → 20 A (prises, circuits spécialisés), 6 mm² → 32 A (plaque de cuisson)." },
        { tip: "<b>Pour t'entraîner</b>Le défi « Dimensionnement » te fait choisir sections et protections avec des conditions de pose et de température toujours différentes." }
      ]
    ]
  };

  L.n1m4l4 = {
    min: 6, why: "Un bon conducteur mal serti ou mal serré devient un point chaud : c'est une cause majeure d'incendie électrique.",
    screens: [
      [
        { h: 'Rigide, souple, embouts' },
        { list: ['Âme <b>rigide</b> : installations fixes, se serre directement dans la borne.', 'Âme <b>souple</b> : armoires, machines, liaisons mobiles ; toujours avec un <b>embout de câblage serti</b> pour que tous les brins soient pris.', 'Respecter le <b>couple de serrage</b> indiqué par le fabricant (tournevis dynamométrique).', 'Ne jamais étamer un conducteur souple à mettre sous vis : la soudure flue et le serrage se relâche.'] },
        { quiz: { q: 'Pourquoi sertir un embout sur un conducteur souple ?', opts: ['Pour l\'esthétique', 'Pour que tous les brins soient serrés et éviter échauffement et brins libres', 'Pour l\'isoler', 'C\'est interdit'], a: 1, why: 'Sans embout, des brins s\'écartent ou se cisaillent, la surface de contact diminue, la connexion chauffe.' } }
      ]
    ]
  };

  L.n1m4l5 = {
    min: 6, why: "La désignation d'un câble résume toute sa fiche technique en quelques caractères.",
    screens: [
      [
        { h: 'Lire une désignation' },
        { table: { head: ['Désignation', 'Ce que c\'est', 'Usage'], rows: [['H07V-U / H07V-R', 'Conducteur isolé PVC, rigide (U monobrin, R multibrins), 450/750 V', 'Sous conduit ou goulotte'], ['H07V-K', 'Conducteur isolé PVC, souple', 'Câblage d\'armoire'], ['U-1000 R2V', 'Câble rigide gainé, isolant PR, 0,6/1 kV', 'Installation fixe, enterré sous fourreau'], ['H07RN-F', 'Câble souple caoutchouc, gaine néoprène', 'Alimentation d\'appareils mobiles, chantiers']] } },
        { p: "Dans « H07 », <b>H</b> signale un type harmonisé européen, <b>07</b> une tension assignée de 450/750 V." },
        { quiz: { q: 'Pour alimenter une machine mobile sur un chantier extérieur, on choisit…', opts: ['H07V-U', 'H07RN-F', 'H07V-K', 'Un câble téléphonique'], a: 1, why: 'Souple, résistant aux huiles, aux intempéries et à l\'abrasion : H07RN-F.' } }
      ]
    ]
  };
})();
