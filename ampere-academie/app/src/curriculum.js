/* Ampère Académie — programme complet, de zéro au niveau ingénieur.
 * Chaque module : titre + leçons « identifiant|titre ». Les leçons rédigées sont dans src/lessons/*.js (AA.L[id]).
 * Les modules marqués sim:'...' s'appuient sur un simulateur de l'Atelier, du Coffret 3D ou de l'Automate. */
(function () {
  'use strict';
  const M = (id, t, list, extra) => Object.assign({ id, t, lessons: list.map((s, i) => { const [a, b] = s.split('|'); return { id: id + 'l' + (i + 1), t: a, tag: b || '' }; }) }, extra || {});
  window.AA.CURRICULUM = [
    {
      id: 'n0', n: 0, t: "L'électricité, enfin comprise", sub: 'Apprenti', d: "Ce qu'est vraiment le courant, la tension, la puissance — et comment ne jamais se mettre en danger.",
      modules: [
        M('n0m1', 'Les grandeurs fondamentales', ['Le courant électrique : des charges qui se déplacent', 'La tension : la « pression » électrique', 'La résistance et la loi d\'Ohm', 'Puissance et énergie : watts, kilowattheures, facture', 'Courant continu et courant alternatif', 'Bilan : lire une plaque signalétique']),
        M('n0m2', 'Le danger électrique', ['Ce que le courant fait au corps humain', 'Contact direct, contact indirect', 'Les domaines de tension (TBT, BT, HTA, HTB)', 'Les tensions limites de sécurité', 'Le premier réflexe en cas d\'électrisation']),
        M('n0m3', 'Habilitation et consignation', ['Pourquoi une habilitation ? (NF C 18-510)', 'Les symboles B0, B1V, B2V, BR, BC, BS, BE', 'Les 5 étapes de la consignation', 'VAT : vérifier l\'absence de tension', 'Équipements de protection individuelle']),
        M('n0m4', 'Outillage et mesures', ['Le multimètre : voltmètre, ampèremètre, ohmmètre|sim', 'Mesurer une tension sans risque|sim', 'La pince ampèremétrique', 'Les catégories de mesure CAT II, III, IV', 'Outillage isolé 1000 V'], { sim: 'atelier' })
      ]
    },
    {
      id: 'n1', n: 1, t: 'Lire et dessiner un schéma', sub: 'Aide-électricien', d: 'Le langage universel des électriciens : symboles normalisés, repérage, conventions de dessin.',
      modules: [
        M('n1m1', 'Les symboles IEC 60617', ['Pourquoi des symboles normalisés', 'Contacts : à fermeture (NO), à ouverture (NF)|sim', 'Bobines, voyants, récepteurs|sim', 'Protections : fusibles, disjoncteurs, relais|sim', 'Organes de commande : poussoirs, interrupteurs, capteurs|sim', 'Mémo des 60 symboles indispensables']),
        M('n1m2', 'Les types de schémas', ['Schéma architectural et synoptique', 'Schéma unifilaire', 'Schéma multifilaire', 'Schéma développé (commande et puissance)', 'Plan d\'implantation et de câblage', 'Lire un schéma : la méthode en 5 questions']),
        M('n1m3', 'Repérage et dossier', ['Repérer les appareils (IEC 81346 : Q, K, F, S, H, M…)', 'Repérer les bornes (13-14, 21-22, A1-A2, 95-96)', 'Les folios, colonnes et renvois', 'Le cartouche et la nomenclature', 'Repérer les conducteurs et les borniers']),
        M('n1m4', 'Conducteurs et câbles', ['Âme, isolant, gaine : anatomie d\'un câble', 'Couleurs normalisées (phase, neutre, PE, commande)', 'Sections et courants admissibles', 'Câbles rigides, souples, embouts de câblage', 'Désignations U-1000 R2V, H07V-K, H07RN-F'])
      ]
    },
    {
      id: 'n2', n: 2, t: 'Installations domestiques', sub: 'Électricien', d: "Du point lumineux au tableau complet d'un logement, selon la NF C 15-100.",
      modules: [
        M('n2m1', 'Les circuits d\'éclairage', ['Simple allumage|sim', 'Double allumage', 'Va-et-vient|sim', 'Télérupteur|sim', 'Minuterie et détecteur de présence', 'Variateur et éclairage LED']),
        M('n2m2', 'Prises et circuits spécialisés', ['Prises 16 A : nombre, section, protection', 'Circuits spécialisés : four, lave-linge, plaque', 'Volets roulants et VMC', 'Borne de recharge de véhicule électrique']),
        M('n2m3', 'Les protections', ['Fusible : principe et calibres', 'Disjoncteur magnéto-thermique', 'Courbes B, C, D : choisir la bonne', 'Le différentiel 30 mA : sauver des vies', 'Types AC, A, F, B', 'Parafoudre']),
        M('n2m4', 'Le tableau de répartition', ['Architecture d\'un tableau (AGCP, interdifférentiels)', 'Répartition des circuits par différentiel', 'Peigne, bornier, repérage', 'Mise à la terre et liaison équipotentielle', 'Mise en service et contrôles']),
        M('n2m5', 'Projet : électrifier un appartement', ['Cahier des charges et plan', 'Schéma unifilaire complet', 'Liste du matériel et chiffrage', 'Autocontrôle avant mise sous tension'])
      ]
    },
    {
      id: 'n3', n: 3, t: 'Commande des moteurs', sub: "Câbleur d'armoire", d: "Le cœur de l'industrie : contacteurs, protections moteur, démarrages, verrouillages.",
      modules: [
        M('n3m1', 'L\'appareillage industriel', ['Le contacteur : bobine, pôles, contacts auxiliaires', 'Le relais thermique et le disjoncteur-moteur', 'Le sectionneur porte-fusibles', 'Relais temporisés travail et repos', 'Boutons, voyants, arrêt d\'urgence']),
        M('n3m2', 'Les schémas de base', ['Démarrage direct et auto-maintien|sim', 'Commande depuis plusieurs postes', 'Marche par à-coups', 'Inversion du sens de marche|sim', 'Verrouillages électriques et mécaniques|sim', 'Fins de course et va-et-vient automatique'], { sim: 'atelier' }),
        M('n3m3', 'Les démarrages à courant réduit', ['Pourquoi limiter le courant de démarrage', 'Étoile-triangle', 'Démarrage statorique par résistances', 'Démarrage rotorique', 'Démarreur progressif (électronique)']),
        M('n3m4', 'Moteurs particuliers', ['Moteur deux vitesses Dahlander', 'Moteur à deux enroulements séparés', 'Freinage par contre-courant', 'Freinage par injection de courant continu', 'Moteur monophasé à condensateur']),
        M('n3m5', 'Câblage d\'armoire', ['Implantation : rails DIN, goulottes, borniers|3d', 'Règles de câblage propre et repéré|3d', 'Du schéma au câblage pas à pas|3d', 'Essais à vide, essais en charge', 'Projet : coffret de démarrage direct complet|3d'], { sim: 'coffret' })
      ]
    },
    {
      id: 'n4', n: 4, t: 'Électrotechnique', sub: 'Technicien', d: "Comprendre les machines : triphasé, puissances, transformateurs, moteurs asynchrones.",
      modules: [
        M('n4m1', 'Le régime alternatif', ['Valeurs efficaces, période, fréquence', 'Déphasage et vecteurs de Fresnel', 'Puissances active, réactive, apparente', 'Facteur de puissance et compensation', 'Réseau triphasé : tensions simples et composées', 'Couplage étoile et triangle des récepteurs']),
        M('n4m2', 'Le transformateur', ['Principe et rapport de transformation', 'Transformateur de commande et de sécurité', 'Pertes et rendement', 'Transformateurs triphasés et couplages']),
        M('n4m3', 'Le moteur asynchrone', ['Le champ tournant', 'Glissement et vitesse', 'Plaque signalétique : tout comprendre', 'Couple, courant, caractéristiques', 'Bilan des puissances et rendement', 'Choisir un moteur pour une machine']),
        M('n4m4', 'Autres machines', ['Moteur à courant continu', 'Machine synchrone et alternateur', 'Moteurs pas-à-pas et servomoteurs', 'Moteurs à aimants permanents'])
      ]
    },
    {
      id: 'n5', n: 5, t: 'Concevoir une installation', sub: 'Technicien', d: 'Dimensionner, protéger, choisir : le travail du bureau d\'études.',
      modules: [
        M('n5m1', 'Dimensionner les canalisations', ['Courant d\'emploi et facteurs de correction', 'Choix de la section (Iz)', 'Chute de tension', 'Courants de court-circuit (Icc)', 'Contraintes thermiques']),
        M('n5m2', 'Protéger', ['Pouvoir de coupure', 'Sélectivité ampèremétrique, chronométrique, énergétique', 'Filiation (coordination)', 'Coordination type 1 et type 2 des départs moteurs']),
        M('n5m3', 'Schémas de liaison à la terre', ['Régime TT', 'Régime TN-C et TN-S', 'Régime IT et contrôleur d\'isolement', 'Choisir un régime de neutre']),
        M('n5m4', 'L\'équipement électrique des machines', ['IEC 60204-1 : les exigences essentielles', 'Indices IP et IK', 'Compatibilité électromagnétique', 'Dossier technique et marquage CE']),
        M('n5m5', 'Projet : dossier électrique complet', ['Synoptique et bilan de puissance', 'Folios de puissance et de commande', 'Borniers, nomenclature, implantation', 'Revue de conception'])
      ]
    },
    {
      id: 'n6', n: 6, t: 'Automates programmables I', sub: 'Technicien automaticien', d: 'Remplacer le câblage par un programme : architecture, entrées-sorties, Ladder, Grafcet.',
      modules: [
        M('n6m1', 'Découvrir l\'automate', ['De la logique câblée à la logique programmée', 'Architecture : alimentation, CPU, cartes E/S', 'Le cycle automate (lecture, traitement, écriture)|plc', 'Adressage des entrées-sorties et mémoires|plc']),
        M('n6m2', 'Câbler l\'automate', ['Entrées TOR 24 V : PNP et NPN', 'Capteurs : inductifs, capacitifs, photoélectriques', 'Sorties relais et transistors', 'Câbler l\'arrêt d\'urgence (hors automate)']),
        M('n6m3', 'Programmer en Ladder', ['Contacts et bobines|plc', 'Auto-maintien et priorité à l\'arrêt|plc', 'Bobines SET/RESET|plc', 'Fronts montants et descendants|plc', 'Temporisations TON, TOF, TP|plc', 'Compteurs CTU, CTD|plc'], { sim: 'automate' }),
        M('n6m4', 'Le Grafcet (IEC 60848)', ['Étapes, transitions, réceptivités', 'Actions continues, mémorisées, temporisées', 'Divergences en OU et en ET', 'Du Grafcet au Ladder', 'Mode marche/arrêt et GEMMA'])
      ]
    },
    {
      id: 'n7', n: 7, t: 'Automates programmables II', sub: 'Technicien supérieur', d: 'Les langages IEC 61131-3, l\'analogique, la régulation et la sécurité.',
      modules: [
        M('n7m1', 'Les langages IEC 61131-3', ['Ladder (LD)', 'Blocs fonctionnels (FBD)', 'Texte structuré (ST)', 'SFC : le Grafcet programmé', 'Fonctions et blocs réutilisables']),
        M('n7m2', 'L\'analogique', ['Signaux 0-10 V et 4-20 mA', 'Mise à l\'échelle', 'Capteurs de température, pression, niveau', 'Filtrage et seuils']),
        M('n7m3', 'La régulation', ['Boucle ouverte, boucle fermée', 'Le PID : P, I, D expliqués', 'Réglage d\'une boucle', 'Régulation de niveau : projet']),
        M('n7m4', 'Sécurité et structure', ['Automates de sécurité et relais de sécurité', 'Structurer un programme', 'Gestion des défauts et alarmes', 'Mise en service et sauvegarde'])
      ]
    },
    {
      id: 'n8', n: 8, t: 'Variation de vitesse & réseaux', sub: "Chargé d'affaires", d: 'Variateurs, servomoteurs, supervision et réseaux de terrain.',
      modules: [
        M('n8m1', 'Variateurs de fréquence', ['Principe : redresseur, bus continu, onduleur', 'Loi U/f et contrôle vectoriel', 'Paramétrage d\'un variateur', 'Câblage, CEM, filtres', 'Freinage et récupération d\'énergie']),
        M('n8m2', 'Servomoteurs et mouvement', ['Codeurs et résolveurs', 'Boucles de position, vitesse, couple', 'Axes coordonnés']),
        M('n8m3', 'Réseaux industriels', ['Modèle OSI appliqué à l\'industrie', 'Modbus RTU et TCP', 'Profinet, EtherNet/IP, EtherCAT', 'IO-Link', 'Cybersécurité industrielle (IEC 62443)']),
        M('n8m4', 'Supervision', ['IHM : concevoir un écran utile', 'SCADA et historisation', 'Industrie 4.0 et données'])
      ]
    },
    {
      id: 'n9', n: 9, t: 'Maintenance & diagnostic', sub: 'Ingénieur junior', d: 'Trouver une panne vite, sûrement, et empêcher qu\'elle revienne.',
      modules: [
        M('n9m1', 'Méthode de dépannage', ['Recueillir les symptômes', 'Raisonner sur le schéma|sim', 'Mesures sous tension : méthode du voltmètre|sim', 'Mesures hors tension : continuité et isolement|sim', 'Remettre en service et rendre compte'], { sim: 'defis' }),
        M('n9m2', 'Les mesures avancées', ['Mesure d\'isolement (mégohmmètre)', 'Mesure de terre et de boucle', 'Analyse de réseau et harmoniques', 'Thermographie infrarouge']),
        M('n9m3', 'Organiser la maintenance', ['Corrective, préventive, conditionnelle, prédictive', 'AMDEC', 'Indicateurs : MTBF, MTTR, disponibilité', 'GMAO et pièces de rechange'])
      ]
    },
    {
      id: 'n10', n: 10, t: 'Ingénierie électrique', sub: 'Ingénieur expert', d: 'Sûreté de fonctionnement, sécurité machines, énergie et direction de projets.',
      modules: [
        M('n10m1', 'Sécurité des machines', ['Directive machines et analyse de risques', 'ISO 13849 : catégories et niveaux PL', 'IEC 62061 : SIL', 'Concevoir une fonction de sécurité']),
        M('n10m2', 'Réseaux de distribution', ['Postes HTA/BT', 'Protection des réseaux HTA', 'Groupes électrogènes et ASI', 'Production photovoltaïque raccordée']),
        M('n10m3', 'Énergie et performance', ['Qualité de l\'énergie', 'Efficacité énergétique des moteurs', 'Audit énergétique', 'Stockage et micro-réseaux']),
        M('n10m4', 'Conduire un projet', ['Du besoin au cahier des charges', 'Planification et budget', 'Réception, documentation, formation', 'Projet final : ligne de production complète'])
      ]
    }
  ];
  AA.L = AA.L || {};
  AA.allLessons = () => { const out = []; AA.CURRICULUM.forEach(lv => lv.modules.forEach(m => m.lessons.forEach(l => out.push(Object.assign({ level: lv, module: m }, l))))); return out; };
  AA.findLesson = id => AA.allLessons().find(l => l.id === id);
})();
