/* Niveau 6 — Automates programmables I : architecture, câblage, programmation Ladder (exercices vérifiés). */
(function () {
  'use strict';
  const L = AA.L;
  const sw = (a, n) => ({ a, n, kind: 'sw' }), pb = (a, n) => ({ a, n, kind: 'pb' });

  L.n6m1l1 = {
    min: 6, why: "Comprendre ce que l'automate remplace, c'est comprendre pourquoi il a envahi toute l'industrie.",
    screens: [
      [
        { h: 'De la logique câblée à la logique programmée' },
        { table: { head: ['', 'Logique câblée (relais)', 'Logique programmée (automate)'], rows: [['Modifier le fonctionnement', 'Recâbler', 'Modifier le programme'], ['Temporisations, compteurs', 'Un relais par fonction', 'Des dizaines, sans matériel supplémentaire'], ['Diagnostic', 'Multimètre, schéma', 'Visualisation en ligne de l\'état de chaque variable'], ['Communication', 'Aucune', 'Supervision, réseaux, données de production'], ['Sécurité', 'Très robuste, simple', 'Les fonctions de sécurité restent câblées ou confiées à un automate de sécurité']] } },
        { real: "<b>Ce qui ne change pas</b>Les capteurs, les boutons, les contacteurs et les moteurs restent les mêmes. Seule la « logique » qui décide passe des fils et des relais à un programme." },
        { quiz: { q: 'Quelle fonction ne doit pas être confiée à un automate standard ?', opts: ['Une temporisation de préavis', 'L\'arrêt d\'urgence', 'Le comptage de pièces', 'L\'allumage d\'un voyant'], a: 1, why: 'L\'arrêt d\'urgence doit fonctionner même si le programme plante : câblage direct, relais ou automate de sécurité certifiés.' } }
      ]
    ]
  };

  L.n6m1l2 = {
    min: 6, why: "Savoir ce qu'il y a dans le boîtier aide à diagnostiquer : alimentation, CPU, entrées, sorties.",
    screens: [
      [
        { h: 'Architecture d\'un automate' },
        { list: ['<b>Alimentation</b> : fournit le 24 V DC à l\'automate (et souvent aux capteurs).', '<b>Unité centrale (CPU)</b> : exécute le programme, gère la mémoire et les communications.', '<b>Cartes d\'entrées</b> : reçoivent les signaux des boutons et capteurs (TOR : tout ou rien ; analogiques : 0-10 V, 4-20 mA).', '<b>Cartes de sorties</b> : commandent bobines de contacteurs, voyants, électrovannes (relais ou transistors).', '<b>Coupleurs de communication</b> : Ethernet, Profinet, Modbus… vers les écrans et la supervision.'] },
        { quiz: { q: 'Un voyant de défaut clignote sur la carte d\'alimentation de l\'automate, toutes les sorties sont à 0. Par où commences-tu ?', opts: ['Par le programme', 'Par la tension d\'alimentation et la protection de l\'alimentation 24 V', 'Par les moteurs', 'Par le réseau'], a: 1, why: 'Sans alimentation correcte, rien ne fonctionne : on commence toujours par l\'énergie.' } }
      ]
    ]
  };

  L.n6m1l3 = {
    min: 8, why: "Le cycle automate explique des comportements qui surprennent : un front qui n'est vu qu'une fois, une sortie écrite deux fois.",
    screens: [
      [
        { h: 'Le cycle automate' },
        { list: ['<b>1. Lecture des entrées</b> : l\'automate photographie l\'état de toutes les entrées dans une mémoire image.', '<b>2. Traitement</b> : il exécute le programme du premier au dernier réseau, en utilisant cette image.', '<b>3. Écriture des sorties</b> : il applique d\'un coup les résultats aux sorties physiques.', 'Puis il recommence, typiquement toutes les 1 à 50 ms (ici 20 ms).'] },
        { warn: "<b>Piège classique</b>Si une même sortie est écrite par deux bobines dans deux réseaux différents, seule la dernière compte. Une sortie = une seule bobine (ou un couple SET/RESET)." },
        { plc: { task: 'Pour découvrir l\'éditeur : fais en sorte que <b>Q0.0</b> recopie l\'entrée <b>I0.0</b>. Place un contact NO I0.0 dans la colonne 1, des fils jusqu\'à la dernière colonne, et une bobine Q0.0. Passe en RUN et manœuvre I0.0.', names: { 'I0.0': 'Interrupteur', 'Q0.0': 'Voyant' }, inputs: [sw('I0.0', 'Interrupteur'), sw('I0.1', 'Interrupteur')], test: { table: [[{ 'I0.0': 0 }, { 'Q0.0': 0 }], [{ 'I0.0': 1 }, { 'Q0.0': 1 }]] }, sol: 'Un contact NO transmet le « courant logique » quand son bit vaut 1.' } }
      ]
    ]
  };

  L.n6m1l4 = {
    min: 6, why: "L'adressage relie le programme au câblage réel : une erreur d'adresse, et c'est le mauvais moteur qui démarre.",
    screens: [
      [
        { h: 'Adressage des variables' },
        { table: { head: ['Adresse', 'Nature', 'Exemple'], rows: [['I0.0 … I0.7', 'Entrées TOR (octet 0, bits 0 à 7)', 'Bouton Marche sur I0.1'], ['Q0.0 … Q0.7', 'Sorties TOR', 'Bobine KM1 sur Q0.0'], ['M0.0 …', 'Mémoires internes (bits)', 'Mémoire de défaut'], ['T0 …', 'Temporisations', 'Préavis de 3 s'], ['C0 …', 'Compteurs', 'Nombre de pièces']] } },
        { p: "La <b>table des entrées-sorties</b> (ou table des mnémoniques) associe chaque adresse à un nom parlant (« S1_Arrêt », « KM1_Moteur ») et à un repère du schéma. C'est le document qui fait le lien entre l'électricien et le programmeur." },
        { quiz: { q: 'Quelle adresse désigne le 3e bit de l\'octet de sorties 0 ?', opts: ['I0.3', 'Q0.2', 'Q0.3', 'M0.2'], a: 1, why: 'Les bits sont numérotés à partir de 0 : le troisième est le bit 2, donc Q0.2.' } }
      ]
    ]
  };

  L.n6m2l1 = {
    min: 8, why: "Raccorder un capteur PNP sur une entrée prévue pour du NPN, et rien ne fonctionne. Il faut comprendre le sens du courant.",
    screens: [
      [
        { h: 'Entrées 24 V : PNP et NPN' },
        { table: { head: ['Capteur', 'Sa sortie commute…', 'Entrée d\'automate compatible'], rows: [['PNP', 'le +24 V vers l\'entrée (fil noir)', 'Entrée « sink » (logique positive) : commun des entrées au 0 V'], ['NPN', 'le 0 V vers l\'entrée', 'Entrée « source » (logique négative) : commun au +24 V']] } },
        { p: "Couleurs habituelles des capteurs 3 fils : <b>marron</b> +24 V, <b>bleu</b> 0 V, <b>noir</b> sortie. En Europe, le PNP est de loin le plus répandu." },
        { quiz: { q: 'Un capteur PNP détecte une pièce. Que mesure-t-on entre son fil noir et le 0 V ?', opts: ['0 V', '≈ 24 V', '230 V', '12 V'], a: 1, why: 'La sortie PNP relie le +24 V au fil noir quand elle est active.' } },
        { tip: "<b>Contacts à ouverture et sécurité positive</b>Un bouton Arrêt câblé en NF donne un 1 au repos : si le fil est coupé, l'entrée passe à 0 et le programme voit « arrêt ». C'est la même logique que dans les schémas à relais." }
      ]
    ]
  };

  L.n6m3l1 = {
    min: 10, why: "Contacts en série = ET, contacts en parallèle = OU : toute la logique combinatoire tient dans cette idée.",
    screens: [
      [
        { h: 'ET, OU, NON en Ladder' },
        { list: ['Deux contacts <b>en série</b> sur une ligne : la bobine est alimentée si les deux conditions sont vraies (ET).', 'Deux contacts <b>en parallèle</b> (deux lignes reliées par des liens verticaux) : l\'une OU l\'autre suffit.', 'Un contact <b>NF</b> (contact fermé au repos) : vrai quand le bit vaut 0 (NON).'] },
        { tip: "<b>Créer une branche parallèle</b>Ajoute une ligne (bouton « + Ligne »), place le second contact en dessous du premier, puis avec l'outil « Lien vertical » clique la case située juste à droite des deux contacts (colonne 2) pour refermer la branche." },
        { plc: { task: 'Programme deux sorties : <b>Q0.0 = I0.0 ET I0.1</b> (une presse qui exige les deux mains) et <b>Q0.1 = I0.0 OU I0.1</b>. Utilise deux réseaux.', names: { 'I0.0': 'Main gauche', 'I0.1': 'Main droite', 'Q0.0': 'Presse', 'Q0.1': 'Voyant' }, inputs: [sw('I0.0', 'Main gauche'), sw('I0.1', 'Main droite')], test: { table: [[{ 'I0.0': 0, 'I0.1': 0 }, { 'Q0.0': 0, 'Q0.1': 0 }], [{ 'I0.0': 1, 'I0.1': 0 }, { 'Q0.0': 0, 'Q0.1': 1 }], [{ 'I0.0': 0, 'I0.1': 1 }, { 'Q0.0': 0, 'Q0.1': 1 }], [{ 'I0.0': 1, 'I0.1': 1 }, { 'Q0.0': 1, 'Q0.1': 1 }]] }, sol: 'Série pour le ET, branches parallèles pour le OU.' } }
      ]
    ]
  };

  L.n6m3l2 = {
    min: 10, why: "L'auto-maintien en Ladder est la traduction exacte du schéma à relais : c'est le premier programme de tout automaticien.",
    screens: [
      [
        { h: 'Marche / arrêt avec priorité à l\'arrêt' },
        { p: "Le bouton Arrêt S1 est câblé en <b>NF</b> sur I0.0 : l'entrée vaut <b>1 au repos</b> et 0 quand on appuie. Dans le programme, on l'utilise donc avec un contact <b>NO</b> : il laisse passer tant qu'on n'appuie pas." },
        { plc: { task: 'Écris : un appui sur <b>S2 Marche (I0.1)</b> met <b>Q0.0</b> à 1, qui reste à 1 après le relâchement ; un appui sur <b>S1 Arrêt (I0.0, câblé NF)</b> le remet à 0 ; si on appuie sur les deux, l\'arrêt l\'emporte.', names: { 'I0.0': 'S1 Arrêt (NF)', 'I0.1': 'S2 Marche', 'Q0.0': 'KM1' }, inputs: [{ a: 'I0.0', n: 'S1 Arrêt (NF)', kind: 'pb', nc: true }, pb('I0.1', 'S2 Marche')],
          test: { seq: [[0, { 'I0.0': 1, 'I0.1': 0 }], [0.5, { 'I0.1': 1 }], [0.8, { 'I0.1': 0 }], [2, { 'I0.0': 0 }], [2.3, { 'I0.0': 1 }], [3, { 'I0.0': 0, 'I0.1': 1 }], [3.5, { 'I0.0': 1, 'I0.1': 0 }]], at: [[0.3, { 'Q0.0': 0 }], [0.7, { 'Q0.0': 1 }], [1.5, { 'Q0.0': 1 }], [2.2, { 'Q0.0': 0 }], [2.8, { 'Q0.0': 0 }], [3.3, { 'Q0.0': 0 }], [4, { 'Q0.0': 0 }]], dur: 4.5 },
          sol: 'Ligne 1 : [I0.1] puis [I0.0] puis bobine Q0.0 ; ligne 2 : [Q0.0] en parallèle sur I0.1. Le contact d\'arrêt en série, après la branche parallèle, donne la priorité à l\'arrêt.' } }
      ]
    ]
  };

  L.n6m3l3 = {
    min: 8, why: "SET et RESET mémorisent un état sans boucle d'auto-maintien : pratique pour les défauts et les séquences.",
    screens: [
      [
        { h: 'Bobines SET et RESET' },
        { p: "Une bobine <b>S</b> met le bit à 1 quand elle est alimentée, et il <b>reste à 1</b>. Une bobine <b>R</b> le remet à 0. Si les deux sont alimentées dans le même cycle, c'est la <b>dernière exécutée</b> qui gagne : placer le RESET après le SET donne la priorité à l'arrêt." },
        { plc: { task: 'Mémorise un défaut : quand le capteur de niveau haut <b>I0.2</b> passe à 1, le voyant d\'alarme <b>Q0.1</b> s\'allume et reste allumé même si le niveau redescend. Le bouton d\'acquittement <b>I0.3</b> l\'éteint, mais seulement si le niveau n\'est plus haut.', names: { 'I0.2': 'Niveau haut', 'I0.3': 'Acquittement', 'Q0.1': 'Alarme' }, inputs: [sw('I0.2', 'Niveau haut'), pb('I0.3', 'Acquittement')],
          test: { seq: [[0, { 'I0.2': 0, 'I0.3': 0 }], [0.5, { 'I0.2': 1 }], [1, { 'I0.2': 0 }], [1.5, { 'I0.2': 1 }], [1.8, { 'I0.3': 1 }], [2.1, { 'I0.3': 0 }], [2.5, { 'I0.2': 0 }], [3, { 'I0.3': 1 }], [3.3, { 'I0.3': 0 }]], at: [[0.3, { 'Q0.1': 0 }], [0.8, { 'Q0.1': 1 }], [1.3, { 'Q0.1': 1 }], [2.3, { 'Q0.1': 1 }], [2.8, { 'Q0.1': 1 }], [3.5, { 'Q0.1': 0 }]], dur: 4 },
          sol: 'Réseau 1 : [I0.2] → (S) Q0.1. Réseau 2 : [I0.3][/I0.2] → (R) Q0.1.' } }
      ]
    ]
  };

  L.n6m3l4 = {
    min: 10, why: "Un front détecte un changement, pas un état : il sert à compter, à basculer, à réagir une seule fois.",
    screens: [
      [
        { h: 'Fronts montants et descendants' },
        { p: "Un contact <b>P</b> (front montant) n'est vrai que pendant <b>un seul cycle</b>, celui où le bit passe de 0 à 1. Un contact <b>N</b> (front descendant) au passage de 1 à 0." },
        { plc: { task: 'Programme un <b>télérupteur</b> : chaque appui sur le poussoir <b>I0.0</b> inverse l\'état de la lampe <b>Q0.0</b>. Indice : une mémoire M0.0 vraie pendant un cycle à chaque appui, puis Q0.0 = (M0.0 ET NON Q0.0) OU (NON M0.0 ET Q0.0).', names: { 'I0.0': 'Poussoir', 'Q0.0': 'Lampe', 'M0.0': 'Impulsion' }, inputs: [pb('I0.0', 'Poussoir')],
          test: { seq: [[0, { 'I0.0': 0 }], [0.5, { 'I0.0': 1 }], [1, { 'I0.0': 0 }], [1.5, { 'I0.0': 1 }], [2, { 'I0.0': 0 }], [2.5, { 'I0.0': 1 }], [3.5, { 'I0.0': 0 }]], at: [[0.3, { 'Q0.0': 0 }], [0.8, { 'Q0.0': 1 }], [1.3, { 'Q0.0': 1 }], [1.8, { 'Q0.0': 0 }], [2.3, { 'Q0.0': 0 }], [3.2, { 'Q0.0': 1 }], [3.8, { 'Q0.0': 1 }]], dur: 4 },
          sol: 'Réseau 1 : [P I0.0] → ( ) M0.0. Réseau 2 : ligne 1 [M0.0][/Q0.0], ligne 2 [/M0.0][Q0.0], branches réunies avant la bobine Q0.0.' } }
      ]
    ]
  };

  L.n6m3l5 = {
    min: 10, why: "Les temporisations programmées remplacent les relais temporisés : il faut maîtriser TON et TOF.",
    screens: [
      [
        { h: 'TON et TOF' },
        { table: { head: ['Bloc', 'Comportement'], rows: [['TON (retard à la montée)', 'La sortie passe à 1 quand l\'entrée est restée à 1 pendant PT ; retombe dès que l\'entrée tombe'], ['TOF (retard à la retombée)', 'La sortie passe à 1 tout de suite ; elle reste à 1 pendant PT après la retombée de l\'entrée'], ['TP (impulsion)', 'Une impulsion de durée PT à chaque front montant']] } },
        { plc: { task: 'Anti-rebond d\'un capteur : le voyant <b>Q0.0</b> ne doit s\'allumer que si le capteur <b>I0.0</b> reste à 1 pendant au moins <b>2 s</b>, et s\'éteindre dès qu\'il retombe. Utilise une temporisation T0 (TON, PT = 2) puis un contact T0.', names: { 'I0.0': 'Capteur', 'Q0.0': 'Voyant' }, inputs: [sw('I0.0', 'Capteur')],
          test: { seq: [[0, { 'I0.0': 0 }], [0.5, { 'I0.0': 1 }], [1.5, { 'I0.0': 0 }], [2, { 'I0.0': 1 }], [5, { 'I0.0': 0 }]], at: [[1.2, { 'Q0.0': 0 }], [2.4, { 'Q0.0': 0 }], [3.7, { 'Q0.0': 0 }], [4.3, { 'Q0.0': 1 }], [5.3, { 'Q0.0': 0 }]], dur: 6 },
          sol: 'Réseau 1 : [I0.0] → TON T0, PT = 2 s. Réseau 2 : [T0] → ( ) Q0.0.' } }
      ]
    ]
  };

  L.n6m3l6 = {
    min: 10, why: "Compter des pièces, des cycles, des défauts : le compteur est partout dans la production.",
    screens: [
      [
        { h: 'Le compteur CTU' },
        { p: "À chaque front montant de son entrée, le compteur <b>CTU</b> ajoute 1 à sa valeur courante CV. Son bit (C0) passe à 1 quand CV atteint la présélection PV. Une bobine RESET sur C0 remet CV à 0." },
        { plc: { task: 'Une caisse est pleine après <b>4 bouteilles</b> détectées par <b>I0.0</b> : le voyant <b>Q0.0</b> s\'allume alors. Le bouton <b>I0.1</b> remet à zéro (nouvelle caisse).', names: { 'I0.0': 'Capteur bouteille', 'I0.1': 'Nouvelle caisse', 'Q0.0': 'Caisse pleine' }, inputs: [pb('I0.0', 'Capteur bouteille'), pb('I0.1', 'Nouvelle caisse')],
          test: { seq: [[0, { 'I0.0': 0, 'I0.1': 0 }], [0.3, { 'I0.0': 1 }], [0.5, { 'I0.0': 0 }], [0.8, { 'I0.0': 1 }], [1, { 'I0.0': 0 }], [1.3, { 'I0.0': 1 }], [1.5, { 'I0.0': 0 }], [2, { 'I0.0': 1 }], [2.2, { 'I0.0': 0 }], [2.8, { 'I0.1': 1 }], [3, { 'I0.1': 0 }], [3.3, { 'I0.0': 1 }], [3.5, { 'I0.0': 0 }]], at: [[1.8, { 'Q0.0': 0 }], [2.5, { 'Q0.0': 1 }], [3.2, { 'Q0.0': 0 }], [3.8, { 'Q0.0': 0 }]], dur: 4 },
          sol: 'Réseau 1 : [I0.0] → CTU C0, PV = 4. Réseau 2 : [I0.1] → (R) C0. Réseau 3 : [C0] → ( ) Q0.0.' } },
        { tip: "<b>Prêt pour le vrai défi ?</b>Les cahiers des charges de la page Défis combinent tout cela : préavis, sécurités, temporisation et comptage, avec des entrées-sorties attribuées au hasard." }
      ]
    ]
  };
})();
