/* Leçons pratiques appuyées sur les schémas animés : éclairage, mesure, commande de moteurs, dépannage.
 * Bloc { circuit, tasks } : le schéma vivant + une liste de missions vérifiées en direct sur la simulation. */
(function () {
  'use strict';
  const L = AA.L;
  const run = s => s.motor.M1 && s.motor.M1.state === 'run';

  L.n0m4l1 = {
    min: 10, why: "Le multimètre est l'outil n°1 du dépanneur. Savoir quoi mesurer, où et sur quel calibre évite à la fois les erreurs de diagnostic et les accidents.",
    screens: [
      [
        { h: 'Trois appareils en un' },
        { table: { head: ['Fonction', 'Symbole', 'Branchement', 'Circuit'], rows: [['Voltmètre', 'V∿ / V⎓', 'En parallèle, entre 2 points', 'Sous tension'], ['Ampèremètre', 'A', 'En série (ou pince)', 'Sous tension'], ['Ohmmètre / continuité', 'Ω / bip', 'Aux bornes de l\'élément', '<b>Hors tension</b> obligatoirement']] } },
        { warn: "<b>Jamais d'ohmmètre sous tension</b>L'ohmmètre injecte son propre petit courant. Sous tension, la mesure est fausse et on peut détruire l'appareil. Dans l'Atelier, le multimètre te le signalera… dans la vraie vie, c'est l'étincelle." }
      ],
      [
        { h: 'À toi de mesurer' },
        { p: "Passe en mode <b>Multimètre</b>, puis clique sur deux points de test (cercles turquoise) : le premier reçoit la pointe noire (COM), le second la rouge (V)." },
        { circuit: 'simple', meter: true, tasks: [
          { t: 'Mesure 230 V entre la phase (L) et le neutre (N)', ok: (s, v) => v.lastV && Math.round(v.lastV.value) === 231 },
          { t: 'Ferme S1 et vérifie que la lampe s\'allume', ok: s => s.lamp.E1 },
          { t: 'Ouvre Q1 et constate 0 V aux bornes de la lampe', ok: (s, v) => !s.byId.Q1.st.on && v.lastV && v.lastV.value < 1 && v.lastPair && v.lastPair.includes('l2') }
        ] },
        { recap: ['Voltmètre en parallèle, ampèremètre en série, ohmmètre hors tension.', 'Toujours vérifier le multimètre sur une source connue avant et après une VAT.'] }
      ]
    ]
  };

  L.n2m1l1 = {
    min: 6, why: "Le circuit le plus simple du métier, mais il contient déjà la règle d'or : on coupe toujours la phase.",
    screens: [
      [
        { h: 'Simple allumage' },
        { p: "Un interrupteur unipolaire commande un point lumineux. Le disjoncteur 10 A protège un circuit d'éclairage câblé en 1,5 mm²." },
        { circuit: 'simple', tasks: [
          { t: 'Allume la lampe', ok: s => s.lamp.E1 },
          { t: 'Coupe le circuit avec le disjoncteur Q1', ok: s => !s.byId.Q1.st.on },
          { t: 'Réarme Q1 et éteins avec S1', ok: s => s.byId.Q1.st.on && !s.byId.S1.st.on }
        ] },
        { warn: "<b>Pourquoi couper la phase ?</b>Si l'interrupteur coupait le neutre, la douille resterait sous tension lampe éteinte : danger lors d'un changement d'ampoule." },
        { quiz: { q: 'Quelle section et quelle protection pour un circuit d\'éclairage en logement (NF C 15-100) ?', opts: ['1,5 mm² et disjoncteur 16 A', '1,5 mm² et disjoncteur 10 A (ou 16 A selon les cas)', '2,5 mm² et disjoncteur 32 A', '0,75 mm² et fusible 6 A'], a: 1, why: 'Éclairage : 1,5 mm² cuivre, protégé par disjoncteur 10 A ou 16 A selon la norme en vigueur ; 10 A est le choix le plus courant.' } }
      ]
    ]
  };

  L.n2m1l3 = {
    min: 8, why: "Commander une lampe depuis deux endroits est un classique d'examen… et une logique (le OU exclusif) que tu retrouveras en automatisme.",
    screens: [
      [
        { h: 'Deux commutateurs, deux navettes' },
        { p: "Chaque commutateur aiguille la phase sur l'une des deux <b>navettes</b>. La lampe s'allume quand le chemin est continu de SA1 à SA2." },
        { circuit: 'vaetvient', tasks: [
          { t: 'Allume la lampe depuis SA1', ok: (s, v) => s.lamp.E1 && v.lastAct === 'SA1' },
          { t: 'Éteins-la depuis SA2', ok: (s, v) => !s.lamp.E1 && v.lastAct === 'SA2' },
          { t: 'Rallume-la depuis SA2', ok: (s, v) => s.lamp.E1 && v.lastAct === 'SA2' }
        ] },
        { table: { head: ['SA1', 'SA2', 'Lampe'], rows: [['1', '1', 'éteinte'], ['1', '2', 'allumée'], ['2', '1', 'allumée'], ['2', '2', 'éteinte']] } },
        { think: { q: "Comment commander la même lampe depuis 3 endroits ?", a: "On ajoute un <b>permutateur</b> (inverseur double) entre les deux commutateurs, sur les navettes : il croise ou non les deux navettes. Au-delà de 3 points, on préfère un <b>télérupteur</b> avec des poussoirs en parallèle." } }
      ]
    ]
  };

  L.n2m1l4 = {
    min: 7, why: "Le télérupteur introduit une idée clé : un appareil qui garde un état en mémoire après une simple impulsion.",
    screens: [
      [
        { h: 'Une impulsion, un changement d\'état' },
        { p: "Les poussoirs, câblés en parallèle, envoient une impulsion à la bobine du télérupteur KL1. À chaque impulsion, son mécanisme bascule le contact." },
        { circuit: 'telerupteur', tasks: [
          { t: 'Allume avec S1', ok: (s, v) => s.lamp.E1 && v.lastAct === 'S1' },
          { t: 'Éteins avec S3', ok: (s, v) => !s.lamp.E1 && v.lastAct === 'S3' },
          { t: 'Allume avec S2', ok: (s, v) => s.lamp.E1 && v.lastAct === 'S2' }
        ] },
        { real: "<b>Avantage</b>Seulement 3 fils vers chaque poussoir quel que soit leur nombre, et un circuit de commande qui peut être en très basse tension pour plus de sécurité." },
        { quiz: { q: 'Que se passe-t-il si on maintient un poussoir enfoncé ?', opts: ['La lampe clignote', 'Rien de plus : seul le front (début d\'impulsion) fait basculer', 'Le disjoncteur déclenche', 'La lampe s\'éteint au relâchement'], a: 1, why: "Le basculement se fait à l'appel de la bobine. Attention cependant : une bobine de télérupteur n'est pas prévue pour rester alimentée en permanence, elle chaufferait." } }
      ]
    ]
  };

  L.n3m2l1 = {
    min: 12, why: "C'est LE schéma de l'industrie : des millions de machines démarrent ainsi. Toute la logique à relais part de l'auto-maintien.",
    screens: [
      [
        { h: 'Deux circuits, deux rôles' },
        { p: "Un schéma de moteur se lit en deux parties : le <b>circuit de puissance</b> (400 V triphasé, gros courants, vers le moteur) et le <b>circuit de commande</b> (ici 230 V, faibles courants, la « logique »). Le contacteur <b>KM1</b> fait le lien : sa bobine est dans la commande, ses pôles dans la puissance." },
        { circuit: 'dol', guide: true, tasks: [
          { t: 'Démarre le moteur', ok: run },
          { t: 'Relâche S2 : le moteur doit continuer à tourner', ok: s => run(s) && !s.byId.S2.st.pressed },
          { t: 'Arrête le moteur', ok: (s, v) => !run(s) && v.wasRunning }
        ] }
      ],
      [
        { h: 'L\'auto-maintien, la mémoire du circuit' },
        { p: "Le contact <b>KM1 13-14</b>, câblé en parallèle sur S2, se ferme dès que KM1 colle. Quand tu relâches S2, le courant passe par lui : KM1 « se maintient » lui-même. Pour l'arrêter, il faut couper ce chemin : c'est le rôle de <b>S1</b>, contact à ouverture placé en série." },
        { tip: "<b>Priorité à l'arrêt</b>Si on appuie en même temps sur S1 et S2, le moteur ne démarre pas : S1 coupe tout en amont. C'est une exigence de sécurité." },
        { quiz: { q: 'Pourquoi le bouton Arrêt est-il un contact à ouverture (NF) et non à fermeture ?', opts: ['Par habitude', "Si son fil est coupé, la machine s'arrête (ou ne démarre pas) : la panne va dans le sens de la sécurité", 'Il est moins cher', 'Pour économiser un fil'], a: 1, why: "C'est le principe de sécurité positive : une rupture de fil ou un contact défectueux doit provoquer l'arrêt, jamais empêcher l'arrêt." } },
        { quiz: { q: 'Le relais thermique F2 déclenche. Que se passe-t-il ?', opts: ['Ses pôles de puissance s\'ouvrent', 'Son contact 95-96 s\'ouvre et coupe la bobine de KM1, son 97-98 allume le voyant défaut', 'Le disjoncteur Q1 déclenche aussi', 'Le moteur ralentit'], a: 1, why: "Le relais thermique ne coupe pas la puissance lui-même : il agit via son contact 95-96 dans la commande. C'est KM1 qui coupe le moteur." } }
      ],
      [
        { h: 'Provoque une surcharge' },
        { p: "Démarre le moteur, puis clique sur <b>Surcharger le moteur</b>. Observe : F2 chauffe, déclenche, KM1 retombe, H2 s'allume. Essaie ensuite de réarmer F2 trop tôt." },
        { circuit: 'dol', overload: true, tasks: [
          { t: 'Fais déclencher le relais thermique F2 en charge', ok: s => s.byId.F2.st.tripped },
          { t: 'Attends le refroidissement et réarme F2', ok: (s, v) => v.didTrip && !s.byId.F2.st.tripped },
          { t: 'Redémarre le moteur', ok: (s, v) => v.didTrip && run(s) }
        ] },
        { recap: ['Puissance : Q1 → KM1 → F2 → M1. Commande : F1 → F2 (95-96) → S1 → S2 // KM1 (13-14) → bobine KM1.', 'Auto-maintien = contact du contacteur en parallèle sur le bouton Marche.', 'Arrêt en série, à ouverture : sécurité positive et priorité à l\'arrêt.'] }
      ]
    ]
  };

  L.n3m2l4 = {
    min: 12, why: "Inverser deux phases inverse le sens de rotation : simple en apparence, mais une erreur de verrouillage provoque un court-circuit franc.",
    screens: [
      [
        { h: 'Croiser deux phases' },
        { p: "KM1 alimente le moteur en L1-L2-L3, KM2 en L3-L2-L1. Le champ tournant change de sens, le moteur aussi." },
        { circuit: 'inversion', guide: true, tasks: [
          { t: 'Fais tourner le moteur en marche avant', ok: s => s.motor.M1.state === 'run' && s.motor.M1.dir > 0 },
          { t: 'Essaie la marche arrière sans arrêter : rien ne doit se passer', ok: (s, v) => s.motor.M1.dir > 0 && v.lastAct === 'S3' },
          { t: 'Passe en marche arrière correctement', ok: s => s.motor.M1.state === 'run' && s.motor.M1.dir < 0 }
        ] }
      ],
      [
        { h: 'Et sans verrouillage ?' },
        { p: "Les contacts <b>KM2 21-22</b> (dans la branche de KM1) et <b>KM1 21-22</b> (dans celle de KM2) empêchent les deux contacteurs de coller ensemble. Si les deux collaient, L1 et L3 seraient reliées directement : <b>court-circuit</b>." },
        { warn: "<b>Verrouillage mécanique en plus</b>Dans la réalité on ajoute aussi un verrouillage mécanique entre les deux contacteurs : un contacteur soudé ou une manœuvre manuelle forcée ne doit jamais pouvoir provoquer un court-circuit." },
        { quiz: { q: 'Dans le schéma, quelle protection déclenche si KM1 et KM2 collent ensemble ?', opts: ['Le fusible F1 de commande', 'Le disjoncteur-moteur Q1', 'Le relais thermique F2', 'Aucune'], a: 1, why: 'Le court-circuit est dans le circuit de puissance, en amont de F2 : c\'est le déclencheur magnétique de Q1 qui coupe. F2 ne protège que des surcharges.' } },
        { recap: ['Inverser deux phases = inverser le sens de rotation.', 'Verrouillage électrique croisé par contacts 21-22 (NF).', "Pour changer de sens : passer par l'arrêt."] }
      ]
    ]
  };

  L.n3m2l5 = {
    min: 10, why: "Comprendre les verrouillages, c'est comprendre comment on empêche une machine de faire ce qu'elle ne doit jamais faire.",
    screens: [
      [
        { h: 'Expérience : supprime le verrouillage' },
        { p: "Ici, les deux contacts de verrouillage ont été shuntés (pontés) par un câbleur pressé. Appuie sur S2, puis sur S3… et observe ce qui arrive au disjoncteur Q1." },
        { circuit: 'inversion', noInterlock: true, tasks: [
          { t: 'Provoque le court-circuit en collant KM1 puis KM2', ok: s => s.byId.Q1.st.tripped },
          { t: 'Remarque : les deux contacteurs restent collés côté commande', ok: s => s.byId.Q1.st.tripped && s.coil.KM1 && s.coil.KM2 }
        ] },
        { think: { q: 'Pourquoi KM1 et KM2 restent-ils collés après le déclenchement de Q1 ?', a: "Parce que Q1 ne coupe que la puissance. La commande est alimentée par F1, en amont, indépendamment de Q1. Dans la réalité, on ajoute souvent un contact auxiliaire de Q1 en série dans la commande pour tout couper." } },
        { recap: ['Un verrouillage absent ou ponté transforme une fausse manœuvre en court-circuit.', 'Chaque protection a son rôle : Q1 (court-circuit puissance), F2 (surcharge moteur), F1 (commande).'] }
      ]
    ]
  };

  L.n9m1l3 = {
    min: 14, why: "La méthode du voltmètre permet de localiser une panne en quelques mesures, sans rien démonter.",
    screens: [
      [
        { h: 'Suivre la tension, point par point' },
        { p: "Pointe noire (COM) sur le <b>neutre</b>. Avec la pointe rouge, remonte le circuit de commande depuis la source : tant que tu lis 230 V, la phase arrive. Le premier point où tu lis 0 V se trouve juste après l'élément ouvert." },
        { tip: "<b>Variante</b>Mesurer aux bornes de chaque contact : 0 V sur un contact fermé (normal), 230 V sur un contact qui devrait être fermé = c'est lui le coupable." },
        { circuit: 'dol', meter: true, fault: { id: 'S1', f: 'open' }, tasks: [
          { t: 'Constate le symptôme : S2 ne démarre pas le moteur', ok: (s, v) => v.lastAct === 'S2' && !run(s) },
          { t: 'Mesure 230 V entre la sortie de F2 (96) et N', ok: (s, v) => v.lastV && Math.round(v.lastV.value) === 231 && v.lastPair && v.lastPair.includes('c2') && v.lastPair.includes('N') },
          { t: 'Trouve le point à 0 V juste après l\'élément défaillant', ok: (s, v) => v.lastV && v.lastV.value < 1 && v.lastPair && v.lastPair.includes('c3') && v.lastPair.includes('N') }
        ] },
        { quiz: { q: '230 V en entrée de S1 (borne 1), 0 V en sortie (borne 2), S1 non enfoncé. Conclusion ?', opts: ['La bobine de KM1 est coupée', 'Le contact de S1 est ouvert alors qu\'il devrait être fermé : S1 défectueux ou fil desserré', 'Le fusible F1 a fondu', 'Le moteur est bloqué'], a: 1, why: "Un contact NF au repos doit laisser passer la tension. 230 V d'un côté et 0 V de l'autre : il est ouvert. On consigne, on vérifie le serrage, puis on teste S1 à l'ohmmètre." } }
      ]
    ]
  };
})();
