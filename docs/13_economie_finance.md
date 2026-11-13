# 13. Économie, financement et comptabilité

Modèle complet et modifiable : `finance/modele_financier_serre_lubumbashi.xlsx` (toutes les cellules de résultat sont des formules ; le scénario se choisit en `Hypotheses!B4`). Le script `finance/generer_modele.py` régénère le classeur.

Tous les montants sont en dollars US constants, rendu Lubumbashi, hors terrain. Le dollar est la monnaie de référence des transactions professionnelles à Lubumbashi ; les achats en francs congolais sont convertis au taux indicatif de 2 265 CDF/USD (BCC, fin octobre 2026).

## 13.1 Trajectoire et investissements

La ferme se construit en trois tranches, chacune décidée sur les résultats mesurés de la précédente (chapitre 16) :

| Phase | Année | Contenu | Investissement | Amortissement annuel |
|---|---|---|---|---|
| 1 | 0 | Pilote de 100 m² et infrastructures communes, pilote aquacole (2 bacs de 3 m³) et essais de reproduction du Clarias | 62 920 $ | 6 588 $ |
| 2 | 2 | +900 m² de serres (ferme de 1 000 m²), bâtiment aquacole, écloserie, grossissement de 5 t/an | 180 950 $ | 17 680 $ |
| 3 | 4 | +1 000 m² de serres orientées fruits (ferme de 2 000 m²), second module de grossissement (10 t/an au total) | 124 080 $ | 12 521 $ |
| | | **Total** | **367 950 $** | |

L'aquaculture représente 80 200 $ de ce total (pilote 7 700 $, unité de la tranche 2 avec ses imprévus 66 220 $, module de la tranche 3 avec ses imprévus 14 300 $). Pourquoi l'aquaculture, et dans quelle forme : chapitre 19.

### Phase 1 : pilote de 100 m² et infrastructures communes (configuration optimisée)

| Poste | Montant | Amortissement |
|---|---|---|
| Études, topographie, analyses sol et eau, autorisations | 800 $ | 5 ans |
| Terrassement, plateforme, drainage | 1 500 $ | 20 ans |
| Fondations (plots et longrines) | 1 500 $ | 20 ans |
| Structure acier galvanisé, chapelle gothique 10 x 10 m | 5 000 $ | 20 ans |
| Film diffusant de toiture | 900 $ | 5 ans |
| Pignons (polycarbonate en partie basse) et cloison | 1 400 $ | 10 ans |
| Ouvrants motorisés avec filets 50 mesh | 1 800 $ | 10 ans |
| Écran d'ombrage et thermique motorisé | 1 200 $ | 8 ans |
| Murs évaporatifs (2 sections) et 2 extracteurs | 2 500 $ | 10 ans |
| Stockage thermique 6 m³ et aérotherme | 1 600 $ | 15 ans |
| Brassage d'air | 400 $ | 8 ans |
| Culture sur substrat fruits | 1 800 $ | 8 ans |
| Bassins à radeaux | 1 800 $ | 10 ans |
| Station de fertirrigation 2 circuits et UV-C | 2 500 $ | 8 ans |
| Eau de pluie, citerne 10 m³, filtration | 2 500 $ | 15 ans |
| Énergie : 3,3 kWc, onduleur 5 kW, batterie 10 kWh, protections | 6 900 $ | 10 à 20 ans |
| Électricité intérieure | 1 200 $ | 15 ans |
| Supervision IIoT (capteurs, sondes, automates, serveur, 4G, caméras) | 6 100 $ | 6 ans |
| Pépinière et chambre de germination | 800 $ | 6 ans |
| Annexe 10 x 3 m | 3 500 $ | 20 ans |
| Chambre froide 3 m³ | 1 500 $ | 10 ans |
| Matériel de récolte et conditionnement | 700 $ | 5 ans |
| Clôture et éclairage de sécurité | 1 500 $ | 15 ans |
| Mise en service et formation | 800 $ | 5 ans |
| Pilote aquacole : abri isolé de 4 x 3 m, 2 bacs de 3 m³, décanteur, biofiltre, aération, thermoplongeur de 1 kW, couplage aux radeaux | 5 200 $ | 8 ans |
| Essais de reproduction du Clarias et formation aquacole | 1 800 $ | 5 ans |
| Imprévus (10 %) | 5 720 $ | |
| **Total phase 1** | **62 920 $** | |

### Phase 2 : tranche de 900 m² et unité aquacole

Serres : 114 730 $ imprévus compris (127 $/m²), dont structures multi-tunnels fabriquées localement 22 500 $, couverture et filets 10 800 $, énergie complémentaire 13 000 $, bassins 8 400 $, génie civil 8 000 $, conditionnement et froid 7 000 $.

Aquaculture : 66 220 $ imprévus compris, dont bâtiment 15 x 10 m 10 500 $, écloserie 9 000 $, module de grossissement de 32 m³ 14 000 $, chauffe-eau solaire et pompe à chaleur 6 500 $, énergie (+4 kWc, +15 kWh) 8 000 $, couplage aux cultures 3 500 $, aération 2 200 $, capteurs et automate 3 000 $, salle de préparation du poisson 3 500 $.

### Phase 3 : tranche de 1 000 m²

124 080 $ imprévus compris : structures 25 000 $, couverture 12 000 $, ombrage 4 000 $, pad et extracteurs 4 500 $, substrat pour 650 m² de fruits 13 000 $, radeaux 240 m² 5 300 $, énergie (+6 kWc, +15 kWh) 9 000 $, génie civil 8 000 $, second module de grossissement 13 000 $, et le reste (fertirrigation, stockage d'eau, électricité, capteurs, froid, clôture) 21 000 $. Coût par m² de serre : 111 $, l'essentiel des équipements communs existant déjà.

### Repères de prix

Ces montants sont des estimations établies à partir de prix de fournisseurs d'Afrique australe et d'Asie, majorés du transport, du dédouanement et de l'installation. Ils doivent être confirmés par trois devis par lot avant engagement (voir feuille de route). Les postes les plus incertains : batteries, structure (prix de l'acier galvanisé), main-d'œuvre de montage, équipements aquacoles importés (biofiltre, soufflantes).

## 13.2 Charges d'exploitation

| Poste | Pilote | Ferme 1 000 m² | Ferme 2 000 m² |
|---|---|---|---|
| Personnel serres et commun | 2 760 $ | 14 640 $ | 27 480 $ |
| Personnel aquacole | 0 $ | 7 560 $ | 9 720 $ |
| Charges sociales (15 %) | 414 $ | 3 330 $ | 5 580 $ |
| Semences et jeunes plants | 300 $ | 2 800 $ | 5 600 $ |
| Engrais et acide | 350 $ | 3 200 $ | 6 400 $ |
| Économie d'engrais apportée par l'eau des poissons | -61 $ | -1 120 $ | -2 240 $ |
| Substrat, éponges, godets | 250 $ | 1 800 $ | 3 900 $ |
| Protection biologique et pièges | 150 $ | 1 200 $ | 2 400 $ |
| Emballages | 300 $ | 4 500 $ | 8 600 $ |
| Analyses de laboratoire | 300 $ | 800 $ | 1 200 $ |
| Énergie d'appoint (SNEL, carburant) | 250 $ | 2 500 $ | 4 800 $ |
| Eau d'appoint, forage | 100 $ | 400 $ | 800 $ |
| Maintenance et pièces | 900 $ | 3 500 $ | 6 500 $ |
| Livraison | 480 $ | 3 000 $ | 5 600 $ |
| Télécom et abonnements | 240 $ | 500 $ | 600 $ |
| Gardiennage et assurance | 600 $ | 2 400 $ | 3 400 $ |
| Administration, comptabilité, taxes locales | 300 $ | 1 500 $ | 2 200 $ |
| Commercialisation | 100 $ | 800 $ | 1 500 $ |
| Aliment poisson | 200 $ | 6 900 $ | 13 800 $ |
| Écloserie (aliments larvaires, artémia, hormones) | 100 $ | 5 826 $ | 6 252 $ |
| Glace, caisses, transport, intrants aquacoles | 50 $ | 800 $ | 1 600 $ |
| Énergie, entretien et commercialisation aquacoles | 250 $ | 3 100 $ | 4 200 $ |
| **Total (scénario médian)** | **8 333 $** | **69 936 $** | **119 892 $** |

Effectifs : à 1 000 m², un chef de culture (500 $/mois), trois ouvriers et un gardien (180 $/mois), un technicien aquacole (450 $/mois) et un ouvrier aquacole ; à 2 000 m², un chef de culture (600 $/mois), six ouvriers, un assistant commercial et livreur (250 $/mois), deux gardiens, le technicien aquacole et deux ouvriers aquacoles. Les besoins en main-d'œuvre des serres ont été estimés à environ 2 h/m²/an pour les fruits et 5 h/m²/an pour les feuilles, plus le conditionnement, la pépinière et la livraison. Les lignes aquacoles varient avec le scénario (aliment et écloserie) ; le total est donné pour le scénario médian.

## 13.3 Chiffre d'affaires

Détail par culture au document 03 (§3.6) et dans l'onglet Cultures ; aquaculture dans l'onglet Poissons et au chapitre 19. Synthèse en régime de croisière :

| | Prudent | Médian | Optimiste |
|---|---|---|---|
| CA brut des légumes, pilote | 3 100 $ | 6 040 $ | 9 900 $ |
| CA brut des légumes par m², tranche 2 (mélange initial) | 36 $ | 69 $ | 111 $ |
| CA brut des légumes par m², tranche 3 (orientée fruits) | 29 $ | 57 $ | 95 $ |
| CA aquacole, ferme de 1 000 m² | 19 200 $ | 38 200 $ | 67 400 $ |
| CA aquacole, ferme de 2 000 m² | 31 100 $ | 53 900 $ | 86 800 $ |
| **CA net total, ferme de 2 000 m²** | **87 600 $** | **168 000 $** | **279 800 $** |

Les feuilles (laitue en tête) rapportent environ deux fois plus au m² que les fruits, mais leur marché est plus étroit : la tranche 3 est donc orientée fruits (tomates, poivrons, piments), au prix d'un chiffre d'affaires par m² plus bas et d'un risque commercial plus faible. Dans le scénario médian, l'aquaculture représente 32 % du chiffre d'affaires de la ferme de 2 000 m², dont 42 % viennent des alevins.

## 13.4 Résultats du projet (scénario médian)

| Année | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 à 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| CA net | 0 | 3 574 | 5 849 | 71 465 | 90 454 | 147 564 | 161 169 | 167 971 | 167 971 |
| dont aquaculture | 0 | 517 | 846 | 26 722 | 34 358 | 49 148 | 52 282 | 53 850 | 53 850 |
| Charges d'exploitation | 0 | -8 333 | -8 333 | -62 544 | -67 472 | -113 898 | -117 894 | -119 892 | -119 892 |
| EBE | 0 | -4 758 | -2 484 | 8 921 | 22 982 | 33 667 | 43 275 | 48 079 | 48 079 |
| Investissements | -62 920 | 0 | -180 950 | 0 | -124 080 | 0 | 0 | 0 | 0 |
| Trésorerie cumulée (après impôt, valeur résiduelle en année 10) | -62 920 | -67 714 | -251 207 | -243 000 | -345 003 | -312 812 | -271 483 | -226 791 à -137 407 | -19 125 |

VAN à 12 % : -140 800 $. TRI sur 10 ans : -1,0 %. Besoin de financement maximal : 345 000 $ (en année 4, si les trois tranches sont construites).

## 13.5 Les trois scénarios

| | Prudent | Médian | Optimiste |
|---|---|---|---|
| EBE à 1 000 m² (année 4) | -24 100 $ | 23 000 $ | 87 200 $ |
| EBE de croisière à 2 000 m² | -38 000 $ | 48 100 $ | 162 800 $ |
| VAN à 12 % | -413 500 $ | -140 800 $ | +127 100 $ |
| TRI 10 ans | négatif | -1,0 % | +21,5 % |
| Retour de trésorerie | jamais | au-delà de 10 ans | année 7 |
| Pilote seul, EBE annuel | -5 200 $ | -2 500 $ | +1 200 $ |
| Pilote seul sans salarié | -2 500 $ | +300 $ | +3 900 $ |

Comparaison avec et sans aquaculture, et à 1 000 ou 2 000 m² : chapitre 19 (§19.9). En résumé : l'aquaculture fait passer le TRI médian de la ferme de 1 000 m² de -3,5 % à -0,2 % et le TRI optimiste de la ferme de 2 000 m² de 17,3 % à 21,5 % ; elle aggrave le scénario prudent.

## 13.6 Sensibilité

EBE de croisière de la ferme de 2 000 m² (scénario médian, aquaculture au médian) selon l'écart de prix (lignes) et de rendement (colonnes) des légumes :

| Prix \ Rendement | -30 % | -20 % | -10 % | 0 | +10 % | +20 % | +30 % |
|---|---|---|---|---|---|---|---|
| -30 % | -2 464 | 2 972 | 8 407 | 13 843 | 19 278 | 24 714 | 30 149 |
| -20 % | 5 525 | 12 102 | 18 678 | 25 255 | 31 831 | 38 408 | 44 985 |
| -10 % | 13 513 | 21 231 | 28 949 | 36 667 | 44 385 | 52 103 | 59 821 |
| 0 | 21 502 | 30 361 | 39 220 | 48 079 | 56 938 | 65 797 | 74 656 |
| +10 % | 29 490 | 39 491 | 49 491 | 59 491 | 69 491 | 79 492 | 89 492 |
| +20 % | 37 479 | 48 620 | 59 762 | 70 903 | 82 045 | 93 186 | 104 328 |
| +30 % | 45 467 | 57 750 | 70 033 | 82 315 | 94 598 | 106 881 | 119 164 |

Points de bascule :

- **EBE nul** : prix des légumes à 58 % du médian, à rendement médian (74 % pour une ferme sans aquaculture).
- **Prix des légumes +10, +20, +30, +40 %** (le reste au médian) : TRI de 1,9 %, 4,5 %, 6,9 % et 9,2 %.
- **Projet entier rentable à 12 % vu d'aujourd'hui** : indice prix x rendement des légumes d'environ 1,5, ou une combinaison (ventes directes, prix du poisson, alevins vendus) d'effet équivalent.
- **Décision par tranche** : une fois le pilote fait, la tranche 2 avec aquaculture se juge sur sa propre valeur ; elle devient positive à 12 % quand les prix des légumes atteignent 1,2 fois le médian (valeur actuelle de la tranche : -28 700 $ au médian, -12 900 $ à +10 %, +2 000 $ à +20 %), d'où le seuil « go » de 1,2 ; le rendement propre de l'aquaculture seule est de 7 % au médian et de 33 % dans l'optimiste ; la tranche 3 n'est rentable que si l'indice prix x rendement des légumes mesuré atteint environ 1,4 (sa valeur actuelle est de -37 000 $ au médian, -9 000 $ avec des prix supérieurs de 30 %, +38 000 $ dans l'optimiste). **D'où le seuil « go » de la tranche 3 fixé à un indice de 1,4.**

L'onglet Sensibilite du classeur donne aussi l'EBE selon le prix du poisson et le nombre d'alevins vendus (reproduit au §19.9).

## 13.7 Ce qui peut améliorer l'équation

Classés du plus au moins accessible :

1. **Vendre plus cher en vendant mieux** : contrats annuels avec des cantines minières et des hôtels (régularité payée), paniers par abonnement aux particuliers (+35 % sur le prix, à saisir dans `Hypotheses!B18`), mise en avant des analyses sans métaux lourds ; poisson vendu vivant ou très frais en point de vente propre.
2. **Prouver l'écloserie** : chaque tranche de 30 000 alevins vendus vaut 5 700 $ d'EBE par an, pour un investissement de 9 000 $. C'est le levier le plus rentable du projet, et le plus incertain : il dépend du nombre de pisciculteurs acheteurs.
3. **Monter en rendement** : les potentiels publiés sont 30 à 60 % au-dessus des médians retenus pour les légumes ; un indice de conversion de 1,0 au lieu de 1,15 vaut 1 800 $ par an sur l'aliment.
4. **Réduire le coût des tranches** : fabrication locale des structures et des bacs (ferrociment), achats groupés, exonération des droits sur le matériel agricole et aquacole (agrément ANAPI).
5. **Partager les coûts fixes** : gardiennage, véhicule et administration avec une autre activité.
6. **Valoriser les invendus et les coproduits** : séchage des piments, sauces ; compost des boues de poissons vendu aux maraîchers ; poisson fumé.
7. **Financements à coût réduit** : subventions ou prêts concessionnels de bailleurs pour l'agriculture urbaine, l'aquaculture et la sécurité alimentaire, cofinancement d'entreprises minières au titre de leurs cahiers des charges sociaux, partenariat avec l'Université de Lubumbashi.

## 13.8 Financement

| Source | Avantages | Contraintes |
|---|---|---|
| Fonds propres | Pas de remboursement pendant l'apprentissage | Montant limité ; c'est la source normale pour le pilote |
| Banques commerciales locales | Montants possibles pour l'extension | Taux en dollars élevés (souvent 12 à 20 %), garanties exigées, durées courtes |
| Institutions de microfinance | Accessibles | Montants faibles, taux élevés |
| Crédit-bail sur l'énergie solaire (installateurs) | Préserve la trésorerie | Coût total plus élevé |
| Partenaire minier ou industriel (contrat d'achat + avance) | Débouché garanti, financement adossé | Exigences de qualité et de volume |
| Bailleurs, programmes d'agriculture et de sécurité alimentaire | Subventions ou taux bas | Dossiers longs, conditions de rapportage |

**Recommandation** : pilote sur fonds propres (63 000 $ environ, plus un fonds de roulement de 8 000 $ pour la première année) ; tranche 2 (181 000 $) financée seulement après les résultats du pilote, en combinant un contrat d'achat avec un ou deux gros clients, un prêt bancaire pour 50 à 60 % et des fonds propres pour le reste ; tranche 3 (124 000 $) financée en partie par l'autofinancement de la tranche 2. Les dossiers de prêt s'appuieront sur les données mesurées, ce qui est un argument beaucoup plus fort qu'une étude.

## 13.9 Fiscalité (à valider avec un comptable agréé)

- TVA : 16 % ; les produits agricoles frais peuvent bénéficier d'un régime particulier, à vérifier ; la TVA sur les équipements est récupérable si l'entreprise est assujettie.
- Impôt sur les bénéfices : 30 %, avec un minimum d'imposition calculé sur le chiffre d'affaires (le modèle retient 1 %).
- Cotisations sociales employeur : CNSS, INPP, ONEM (le modèle retient 15 % des salaires bruts).
- Droits d'entrée sur le matériel : exonération possible au titre du Code des investissements (ANAPI) ou de la loi agricole, à demander avant les importations.
- Taxes provinciales et municipales : à intégrer dans le poste « administration » après consultation.

## 13.10 Organisation comptable (SYSCOHADA révisé)

Comptes principaux à ouvrir :

| Classe | Comptes | Usage |
|---|---|---|
| 2 | 231 Bâtiments ; 2341 Installations techniques ; 241 Matériel et outillage agricole ; 2441 Matériel de bureau et informatique ; 245 Matériel de transport | Serre, annexe, équipements, supervision, véhicule |
| 28 | Amortissements correspondants | Selon les durées du modèle |
| 31 / 32 | Matières et fournitures (semences, engrais, substrat, emballages) | Stocks de consommables |
| 34 / 36 | Produits en cours, produits finis | Cultures en place et récoltes non vendues (valorisation en fin d'exercice) |
| 60 | 601 Achats de marchandises ; 602 Matières premières et fournitures ; 604 Matières consommables ; 605 Autres achats (eau, énergie) | Charges d'intrants |
| 61 / 62 / 63 | Transports, services extérieurs (entretien, assurances, télécom, honoraires) | |
| 64 | Impôts et taxes | |
| 66 | Charges de personnel | |
| 68 | Dotations aux amortissements | |
| 70 | 702 Ventes de produits finis | Ventes de légumes, de poisson et d'alevins (sous-comptes distincts) |

**Comptabilité analytique** recommandée dès le pilote : une section par culture (fruits, feuilles, essais), une section « écloserie », une section « poisson de table » et une section « infrastructures communes ». Les heures de travail, les intrants et l'énergie (grâce aux sous-compteurs) sont imputés par culture. On connaît ainsi la marge réelle de chaque produit au bout de six mois, et le mélange de cultures de l'extension se décide sur des faits.

## 13.11 Indicateurs de pilotage économique

| Indicateur | Formule | Cible ferme complète (médian) |
|---|---|---|
| CA net des légumes par m² de serre | CA net légumes / surface | ≥ 57 $/m²/an |
| Coût variable par kg de poisson | (aliment + alevins + intrants) / kg vendus | ≤ 1,7 $/kg |
| Alevins vendus par ponte | alevins vendus / pontes | à mesurer en phase 1 |
| Coût de revient complet par kg de tomate | (charges + amortissements imputés) / kg vendus | < prix de vente |
| Taux de pertes et invendus | pertes / production | ≤ 8 % |
| Productivité du travail | kg vendus / heure travaillée | à mesurer en phase 1 |
| Énergie par kg produit | kWh / kg | 3 à 4 kWh/kg au pilote (infrastructures surdimensionnées pour 100 m²), objectif < 1,5 kWh/kg pour la ferme complète |
| Eau par kg produit | L / kg | 40 à 50 L/kg en tomate, 10 à 20 L/kg en feuilles |
| Délai de paiement clients | créances / CA x 365 | ≤ 30 jours |
| Taux de service | livraisons conformes et à l'heure / livraisons | ≥ 95 % |
