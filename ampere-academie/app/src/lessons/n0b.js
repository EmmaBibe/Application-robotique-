/* Niveau 0 — modules « Le danger électrique » (suite) et « Habilitation et consignation » (NF C 18-510). */
(function () {
  'use strict';
  const L = AA.L;

  L.n0m2l2 = {
    min: 8, why: "Toutes les protections d'une installation répondent à l'un de ces deux risques. Les distinguer, c'est comprendre à quoi sert chaque appareil.",
    screens: [
      [
        { h: 'Deux façons de se faire électriser' },
        { table: { head: ['', 'Contact direct', 'Contact indirect'], rows: [['Ce qu\'on touche', 'Une partie active normalement sous tension (conducteur dénudé, borne)', 'Une masse métallique mise accidentellement sous tension par un défaut d\'isolement'], ['Exemple', 'Doigt dans une borne de prise démontée', 'Carcasse de lave-linge dont un fil interne a perdu son isolant'], ['Protections', 'Isolation, enveloppes (IP2X), éloignement, obstacles, et en complément le différentiel 30 mA', 'Mise à la terre des masses + coupure automatique (différentiel), double isolation (classe II), très basse tension de sécurité']] } },
        { analogy: "<b>Le piège du contact indirect</b>Rien ne signale le danger : l'appareil fonctionne normalement, sa carcasse est simplement sous tension. C'est pour cela que la protection doit être automatique." },
        { quiz: { q: 'Un ouvrier touche le bâti métallique d\'une perceuse dont le câble interne est abîmé. Contact…', opts: ['direct', 'indirect', 'ni l\'un ni l\'autre', 'par induction'], a: 1, why: 'Le bâti est une masse, normalement hors tension, devenue dangereuse à cause d\'un défaut : contact indirect.' } }
      ],
      [
        { h: 'La chaîne de protection contre les contacts indirects' },
        { p: "Dans un logement (schéma TT), le défaut d'isolement fait circuler un courant de la masse vers la terre. Le dispositif différentiel compare le courant qui part par la phase et celui qui revient par le neutre : dès que la différence dépasse son seuil (IΔn), il coupe." },
        { formula: 'R<sub>A</sub> × I<sub>Δn</sub> ≤ U<sub>L</sub>', small: 'R_A : résistance de la prise de terre — U_L : tension limite de sécurité (50 V en local sec)' },
        { num: { id: 'tt1', gen: r => { const I = r.pick([0.03, 0.3, 0.5]); return { q: `Avec un dispositif différentiel de <b>${I * 1000} mA</b> en tête et U<sub>L</sub> = 50 V, quelle est la résistance de terre maximale ?`, a: 50 / I, unit: 'Ω', tol: 0.02, sol: `R_A ≤ U_L / IΔn = 50 / ${AA.fmt(I)} = ${AA.fmt(50 / I, 0)} Ω. En pratique on vise beaucoup moins (≤ 100 Ω est la valeur couramment recommandée en logement).` }; } } },
        { recap: ['Contact direct : partie active. Contact indirect : masse en défaut.', 'Contre l\'indirect : masses à la terre + coupure automatique, ou double isolation.', 'Le 30 mA est aussi une protection complémentaire contre le contact direct.'] }
      ]
    ]
  };

  L.n0m2l4 = {
    min: 6, why: "La tension limite de sécurité fixe ce qu'une installation doit garantir en cas de défaut, selon que le local est sec ou mouillé.",
    screens: [
      [
        { h: 'Tension limite conventionnelle U<sub>L</sub>' },
        { p: "C'est la tension de contact la plus élevée qu'on considère supportable sans danger pendant un temps indéfini. Elle dépend de l'état de la peau, donc du local." },
        { table: { head: ['Conditions', 'Alternatif', 'Continu lisse'], rows: [['Locaux secs ou humides (cas général)', '50 V', '120 V'], ['Locaux mouillés (chantiers extérieurs, salles d\'eau…)', '25 V', '60 V']] } },
        { real: "<b>Conséquence directe</b>En dessous de ces valeurs, on parle de TBTS (très basse tension de sécurité) quand la source est isolée (transformateur de sécurité) : c'est le cas des éclairages de piscine, des baladeuses de chantier ou des circuits de commande en 24 V." },
        { quiz: { q: 'Pourquoi les circuits de commande industriels sont-ils souvent en 24 V ?', opts: ['Parce que c\'est moins cher', 'Parce que 24 V est en dessous de la tension limite même en local mouillé : un contact avec un bouton ou un capteur n\'est pas dangereux', 'Parce que les contacteurs ne fonctionnent qu\'en 24 V', 'Pour économiser l\'énergie'], a: 1, why: '24 V < 25 V (alternatif, local mouillé) et < 60 V (continu, local mouillé) : le personnel qui manipule les organes de commande est protégé.' } },
        { recap: ['U_L = 50 V AC / 120 V DC en général.', 'U_L = 25 V AC / 60 V DC en local mouillé.', 'TBTS : tension inférieure à U_L, issue d\'une source de sécurité isolée.'] }
      ]
    ]
  };

  L.n0m2l5 = {
    min: 6, why: "Face à une électrisation, les bons gestes dans le bon ordre sauvent la victime sans faire une seconde victime.",
    screens: [
      [
        { h: 'Protéger, alerter, secourir' },
        { list: ['<b>Ne jamais toucher la victime</b> tant qu\'elle est en contact avec la source.', '<b>Couper le courant</b> : disjoncteur, arrêt d\'urgence, sectionneur. En basse tension, si c\'est impossible, éloigner la victime avec un objet isolant sec (manche en bois, chaise), en étant soi-même isolé du sol.', '<b>Alerter</b> : 15 (SAMU), 18 (pompiers) ou 112 (numéro d\'urgence européen). Préciser « électrisation ».', '<b>Secourir</b> : si la victime ne respire pas, massage cardiaque et défibrillateur automatisé (DAE) ; si elle respire, position latérale de sécurité et surveillance.'] },
        { warn: "<b>Haute tension</b>Au voisinage d'une ligne ou d'un poste HTA/HTB, ne vous approchez pas : la tension peut amorcer un arc à distance. Faites couper par l'exploitant du réseau." },
        { quiz: { q: 'Un collègue est collé à une machine sous tension. Ton premier geste ?', opts: ['Le tirer par le bras', 'Couper l\'alimentation (arrêt d\'urgence, disjoncteur)', 'Appeler le 15 puis attendre', 'Lui jeter de l\'eau'], a: 1, why: 'Le toucher ferait de toi une seconde victime. On supprime d\'abord la cause : on coupe.' } },
        { tip: "<b>Même si tout semble aller bien</b>Toute personne électrisée doit consulter un médecin : des troubles du rythme cardiaque ou des brûlures internes peuvent apparaître plusieurs heures après." }
      ]
    ]
  };

  L.n0m3l1 = {
    min: 6, why: "Sans habilitation, aucune personne ne peut légalement travailler sur ou à proximité d'une installation électrique.",
    screens: [
      [
        { h: 'L\'habilitation électrique' },
        { p: "L'habilitation est la <b>reconnaissance, par l'employeur, de la capacité d'une personne à accomplir en sécurité</b> les tâches électriques qui lui sont confiées. Elle est délivrée après une formation adaptée, se matérialise par un <b>titre d'habilitation</b> signé, et précise les ouvrages et opérations autorisés." },
        { list: ['Elle ne remplace pas la compétence technique : elle la complète par la maîtrise des risques.', 'Elle est personnelle et liée à un employeur.', 'Le recyclage est recommandé tous les 3 ans (et à chaque changement de poste ou d\'installation).', 'Le document de référence en France est la norme NF C 18-510.'] },
        { quiz: { q: 'Qui délivre l\'habilitation électrique ?', opts: ['L\'organisme de formation', 'L\'employeur, après formation', 'L\'inspection du travail', 'Le fournisseur d\'électricité'], a: 1, why: 'L\'organisme forme et donne un avis ; c\'est l\'employeur qui habilite par un titre signé.' } }
      ]
    ]
  };

  L.n0m3l2 = {
    min: 10, why: "Lire un symbole d'habilitation, c'est savoir instantanément ce qu'une personne a le droit de faire.",
    screens: [
      [
        { h: 'Décoder un symbole' },
        { table: { head: ['Position', 'Signification', 'Valeurs'], rows: [['1re lettre', 'Domaine de tension', '<b>B</b> = BT et TBT ; <b>H</b> = HTA et HTB'], ['Chiffre', 'Rôle', '<b>0</b> = travaux non électriques ; <b>1</b> = exécutant ; <b>2</b> = chargé de travaux'], ['Lettre suivante', 'Nature des opérations', '<b>V</b> voisinage ; <b>T</b> travaux sous tension ; <b>R</b> intervention BT générale ; <b>S</b> intervention BT élémentaire ; <b>C</b> consignation ; <b>E</b> opérations spécifiques (essai, mesurage, vérification, manœuvre) ; <b>P</b> photovoltaïque']] } },
        { table: { head: ['Symbole', 'Exemple de personne'], rows: [['B0 / H0V', 'Peintre, maçon travaillant dans un local électrique'], ['BS', 'Agent qui remplace un fusible, réarme un disjoncteur, raccorde un appareil sur un circuit protégé'], ['B1V', 'Électricien qui exécute des travaux près de pièces nues sous tension, sous la direction d\'un chargé de travaux'], ['B2V', 'Chargé de travaux qui dirige une équipe'], ['BR', 'Dépanneur : recherche de pannes, mesures, raccordements en BT'], ['BC', 'Chargé de consignation : met l\'installation hors tension en sécurité'], ['BE Mesurage / BE Manœuvre', 'Technicien qui ne fait que mesurer, ou que manœuvrer']] } }
      ],
      [
        { h: 'Quel titre pour quelle tâche ?' },
        { quiz: { q: 'Un technicien de maintenance doit rechercher l\'origine d\'une panne dans une armoire 400 V et remplacer le contacteur défectueux. Il lui faut au minimum…', opts: ['B0', 'BS', 'BR', 'H2V'], a: 2, why: 'Recherche de panne, mesures et remplacement de matériel en BT : intervention générale, BR.' } },
        { quiz: { q: 'Un agent d\'entretien doit seulement réarmer un disjoncteur et remplacer une lampe. Il lui faut…', opts: ['BS', 'BR', 'B2V', 'BC'], a: 0, why: 'Opérations simples sur circuit protégé : intervention élémentaire, BS.' } },
        { recap: ['B = basse tension, H = haute tension.', '0 non électricien, 1 exécutant, 2 chargé de travaux.', 'R = dépannage BT, S = élémentaire, C = consignation, V = voisinage, E = essais/mesures/manœuvres.'] }
      ]
    ]
  };

  L.n0m3l3 = {
    min: 10, why: "La consignation est la seule façon de travailler hors tension en étant certain que la tension ne reviendra pas.",
    screens: [
      [
        { h: 'Les étapes de la consignation' },
        { list: ['<b>Pré-identifier</b> l\'ouvrage sur les schémas et sur place.', '<b>Séparer</b> l\'ouvrage de toutes ses sources d\'énergie (y compris secours, groupes, onduleurs, condensateurs, retours par d\'autres circuits).', '<b>Condamner</b> les organes de séparation en position ouverte : cadenas personnel, pancarte « Ne pas manœuvrer — travaux ».', '<b>Identifier</b> l\'ouvrage sur le lieu même du travail.', '<b>Vérifier l\'absence de tension</b> (VAT) sur chaque conducteur actif, au plus près du point de travail.', '<b>Mettre à la terre et en court-circuit</b> (MALT-CC) : obligatoire en HTA ; en BT dès qu\'il existe un risque de tension induite, de réalimentation ou de charge capacitive.'] },
        { warn: "<b>Couper n'est pas consigner</b>Un disjoncteur ouvert peut être refermé par quelqu'un d'autre, un variateur garde ses condensateurs chargés plusieurs minutes, un groupe électrogène peut démarrer seul. Seule la consignation complète protège." }
      ],
      [
        { h: 'Mise en ordre' },
        { think: { q: 'Tu dois remplacer un contacteur dans une armoire. Le disjoncteur général est ouvert. Que manque-t-il avant de toucher ?', a: "La condamnation (cadenas et pancarte sur l'appareil de séparation, de préférence un sectionneur à coupure visible), l'identification de l'armoire, puis la <b>VAT</b> sur les bornes du contacteur. Penser aussi aux circuits de commande alimentés par une autre source (24 V d'un automate, alimentation d'une armoire voisine)." } },
        { quiz: { q: 'Dans quel ordre ?', opts: ['VAT, séparation, condamnation', 'Séparation, condamnation, identification, VAT, MALT-CC', 'Condamnation, VAT, séparation', 'MALT-CC, VAT, séparation'], a: 1, why: 'On sépare, on verrouille, on identifie sur place, on vérifie l\'absence de tension, puis on met à la terre si nécessaire.' } },
        { recap: ['Séparer — condamner — identifier — VAT — MALT-CC.', 'Toutes les sources, y compris de secours et capacitives.', 'Le chargé de consignation (BC/HC) délivre une attestation au chargé de travaux.'] }
      ]
    ]
  };

  L.n0m3l4 = {
    min: 7, why: "La VAT est le geste qui garantit qu'on peut toucher. Une VAT mal faite, c'est une fausse sécurité.",
    screens: [
      [
        { h: 'Vérifier l\'absence de tension' },
        { list: ['Utiliser un <b>VAT conforme</b> (NF EN 61243-3 en BT), adapté à la tension, en bon état.', '<b>Tester le VAT avant</b> sur une source sous tension connue (ou son testeur intégré).', 'Vérifier <b>entre tous les conducteurs</b> : chaque phase entre elles, chaque phase et le neutre, chaque phase et la terre.', '<b>Tester le VAT après</b> la vérification : s\'il est tombé en panne entre-temps, la mesure ne vaut rien.', 'Porter les <b>EPI</b> pendant la VAT : à ce moment, on suppose que la tension peut être présente.'] },
        { warn: "<b>Le multimètre n'est pas un VAT</b>Un multimètre sur un mauvais calibre, une pointe mal enfoncée ou une pile faible peuvent afficher 0 V sous tension. Le VAT est conçu pour ce seul usage, avec des indications redondantes." },
        { quiz: { q: 'Sur un circuit triphasé avec neutre, combien de vérifications au minimum ?', opts: ['3', '4', '6', '10 (4 conducteurs actifs + terre, toutes les combinaisons)'], a: 3, why: 'L1-L2, L1-L3, L2-L3, L1-N, L2-N, L3-N et chaque conducteur actif / terre (L1-PE, L2-PE, L3-PE, N-PE) : 10 combinaisons.' } }
      ]
    ]
  };

  L.n0m3l5 = {
    min: 6, why: "Les équipements de protection sont la dernière barrière quand tout le reste a échoué : encore faut-il les choisir et les porter correctement.",
    screens: [
      [
        { h: 'Les équipements du technicien' },
        { table: { head: ['Équipement', 'Rôle', 'Repère'], rows: [['Gants isolants', 'Protègent du contact électrique', 'Classe 00 : 500 V ; classe 0 : 1 000 V (alternatif). Vérifier l\'étanchéité avant chaque usage, porter des surgants'], ['Écran facial anti-UV / arc', 'Protège le visage d\'un arc électrique (flash, projections)', 'Porté sur un casque isolant'], ['Vêtements non propagateurs de flamme', 'Ne s\'enflamment pas et ne fondent pas sur la peau en cas d\'arc', 'Manches longues, fermés'], ['Outils isolés', 'Évitent le contact et les courts-circuits', 'Double triangle et « 1 000 V » (IEC 60900)'], ['Tapis ou tabouret isolant', 'Isole du sol', 'Pour les manœuvres']] } },
        { real: "<b>Le vrai danger de l'arc</b>Un court-circuit franc dans un tableau dégage en quelques millisecondes une énergie capable de brûler gravement à plus d'un mètre. Les EPI d'arc sont là pour ça, même si on ne touche rien." },
        { recap: ['Gants classe 0 en BT, vérifiés avant usage.', 'Écran facial + vêtements non propagateurs contre l\'arc.', 'Outils marqués 1 000 V, double triangle.'] }
      ]
    ]
  };
})();
