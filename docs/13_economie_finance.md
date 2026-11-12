# 13. Économie, financement et comptabilité

Modèle complet et modifiable : `finance/modele_financier_serre_lubumbashi.xlsx` (toutes les cellules de résultat sont des formules ; le scénario se choisit en `Hypotheses!B4`). Le script `finance/generer_modele.py` régénère le classeur.

Tous les montants sont en dollars US constants, rendu Lubumbashi, hors terrain. Le dollar est la monnaie de référence des transactions professionnelles à Lubumbashi ; les achats en francs congolais sont convertis au taux indicatif de 2 265 CDF/USD (BCC, fin octobre 2026).

## 13.1 Investissements

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
| Imprévus (10 %) | 5 020 $ | |
| **Total phase 1** | **55 220 $** | Amortissement annuel : 5 508 $ |

### Phase 2 : extension de 900 m²

114 730 $ (127 $/m²), dont structures multi-tunnels fabriquées localement 22 500 $, couverture et filets 10 800 $, énergie complémentaire 13 000 $, bassins 8 400 $, génie civil 8 000 $, conditionnement et froid 7 000 $, imprévus 10 430 $. Détail dans l'onglet CAPEX.

### Repères de prix

Ces montants sont des estimations établies à partir de prix de fournisseurs d'Afrique australe et d'Asie, majorés du transport, du dédouanement et de l'installation. Ils doivent être confirmés par trois devis par lot avant engagement (voir feuille de route). Les postes les plus incertains : batteries, structure (prix de l'acier galvanisé), main-d'œuvre de montage.

## 13.2 Charges d'exploitation

| Poste | Pilote (100 m²) | Ferme complète (1 000 m²) |
|---|---|---|
| Personnel | 2 760 $ (1 ouvrier-technicien) | 14 640 $ (1 chef de culture, 3 ouvriers, 1 gardien) |
| Charges sociales (15 %) | 414 $ | 2 196 $ |
| Semences et jeunes plants | 300 $ | 2 800 $ |
| Engrais et acide | 350 $ | 3 200 $ |
| Substrat, éponges, godets | 250 $ | 1 800 $ |
| Protection biologique et pièges | 150 $ | 1 200 $ |
| Emballages | 300 $ | 4 500 $ |
| Analyses de laboratoire | 300 $ | 800 $ |
| Énergie d'appoint (SNEL, carburant) | 250 $ | 2 500 $ |
| Eau d'appoint, forage | 100 $ | 400 $ |
| Maintenance et pièces | 900 $ | 3 500 $ |
| Livraison | 480 $ | 3 000 $ |
| Télécom et abonnements | 240 $ | 500 $ |
| Gardiennage et assurance | 600 $ | 2 400 $ |
| Administration, comptabilité, taxes locales | 300 $ | 1 500 $ |
| Commercialisation | 100 $ | 800 $ |
| **Total** | **7 794 $** | **45 736 $** |

Le personnel représente 41 % des charges de la ferme complète. Les besoins en main-d'œuvre ont été estimés à environ 2 h/m²/an pour les fruits, 5 h/m²/an pour les feuilles (repiquage, récolte, parage, nettoyage des radeaux), plus le conditionnement, la pépinière et la livraison, soit environ 5 900 h/an pour 1 000 m², ou 3 personnes à plein temps plus l'encadrement.

## 13.3 Chiffre d'affaires

Détail par culture au document 03 (§3.6) et dans l'onglet Cultures. Synthèse en régime de croisière :

| | Prudent | Médian | Optimiste |
|---|---|---|---|
| CA brut du pilote | 3 100 $ | 6 040 $ | 9 900 $ |
| CA brut par m², extension | 36 $ | 69 $ | 111 $ |
| CA net de la ferme complète (après pertes) | 30 700 $ | 61 800 $ | 103 200 $ |

Les feuilles (laitue en tête) rapportent environ deux fois plus au m² que les fruits. Le mélange de l'extension (350 m² de fruits, 550 m² de feuilles) en tient compte ; une variante plus orientée feuilles améliore l'EBE de 4 000 $ environ, au prix d'un risque commercial plus élevé (il faut écouler plus de 500 laitues par semaine).

## 13.4 Résultats du projet (scénario médian)

| Année | 0 | 1 | 2 | 3 | 4 | 5 | 6 à 9 | 10 |
|---|---|---|---|---|---|---|---|---|
| CA net | 0 | 3 057 | 5 002 | 44 742 | 56 096 | 61 773 | 61 773 | 61 773 |
| Charges d'exploitation | 0 | -7 794 | -7 794 | -41 183 | -44 218 | -45 736 | -45 736 | -45 736 |
| EBE | 0 | -4 737 | -2 792 | 3 559 | 11 878 | 16 037 | 16 037 | 16 037 |
| Investissements | -55 220 | 0 | -114 730 | 0 | 0 | 0 | 0 | 0 |
| Trésorerie cumulée (après impôt, valeur résiduelle en année 10) | -55 220 | -59 988 | -177 559 | -174 447 | -163 130 | -147 711 | ... | -36 623 |

VAN à 12 % : -92 600 $. TRI sur 10 ans : -3,5 %. Besoin de financement maximal : 177 600 $.

## 13.5 Les trois scénarios

| | Prudent | Médian | Optimiste |
|---|---|---|---|
| EBE de croisière | -15 100 $ | 16 000 $ | 57 400 $ |
| VAN à 12 % | -210 000 $ | -92 600 $ | +25 900 $ |
| TRI 10 ans | négatif | -3,5 % | +15,6 % |
| Retour de trésorerie | jamais | au-delà de 10 ans | année 7 |
| Pilote seul, EBE annuel | -5 300 $ | -2 800 $ | +600 $ |
| Pilote seul sans salarié | -2 100 $ | +400 $ | +3 800 $ |

## 13.6 Sensibilité

EBE de croisière de la ferme complète (scénario médian) selon l'écart de prix (lignes) et de rendement (colonnes) :

| Prix \ Rendement | -30 % | -20 % | -10 % | 0 | +10 % | +20 % | +30 % |
|---|---|---|---|---|---|---|---|
| -30 % | -11 351 | -8 399 | -5 447 | -2 495 | 457 | 3 409 | 6 362 |
| -20 % | -7 027 | -3 457 | 113 | 3 683 | 7 252 | 10 822 | 14 392 |
| -10 % | -2 703 | 1 485 | 5 672 | 9 860 | 14 048 | 18 235 | 22 423 |
| 0 | 1 622 | 6 427 | 11 232 | 16 037 | 20 843 | 25 648 | 30 453 |
| +10 % | 5 946 | 11 369 | 16 792 | 22 215 | 27 638 | 33 061 | 38 484 |
| +20 % | 10 270 | 16 311 | 22 351 | 28 392 | 34 433 | 40 473 | 46 514 |
| +30 % | 14 594 | 21 252 | 27 911 | 34 569 | 41 228 | 47 886 | 54 545 |

Points de bascule :

- **EBE nul** : prix à 74 % du médian, à rendement médian.
- **Projet entier rentable à 12 % vu d'aujourd'hui** : EBE de croisière d'environ 48 000 $, soit un indice prix x rendement d'environ 1,5 (par exemple +25 % et +25 %).
- **Extension rentable à 12 % une fois le pilote réalisé** (le pilote étant alors une dépense passée) : indice d'environ 1,1. Calcul : VAN de l'extension seule de -24 800 $ à l'indice 1,0, +1 100 $ à 1,1, +27 100 $ à 1,2, +53 000 $ à 1,3. **D'où le seuil de décision « go » fixé à 1,2**, qui laisse une marge de sécurité.

## 13.7 Ce qui peut améliorer l'équation

Classés du plus au moins accessible :

1. **Vendre plus cher en vendant mieux** : contrats annuels avec des cantines minières et des hôtels (régularité payée), paniers par abonnement aux particuliers (+35 % sur le prix, à saisir dans `Hypotheses!B18`), mise en avant des analyses sans métaux lourds.
2. **Monter en rendement** : les potentiels publiés sont 30 à 60 % au-dessus des médians retenus ; la courbe d'apprentissage du pilote doit le montrer.
3. **Réduire le coût de l'extension** : fabrication locale des structures, achats groupés, exonération des droits sur le matériel agricole (agrément ANAPI).
4. **Partager les coûts fixes** : gardiennage, véhicule et administration avec une autre activité, ou passer à 2 000 m² pour diluer l'encadrement.
5. **Valoriser les invendus** : séchage des piments, sauces, purées.
6. **Financements à coût réduit** : subventions ou prêts concessionnels de bailleurs pour l'agriculture urbaine et la sécurité alimentaire, cofinancement d'entreprises minières au titre de leurs cahiers des charges sociaux, partenariat avec l'Université de Lubumbashi (la configuration « vitrine R&D » devient alors pertinente).

## 13.8 Financement

| Source | Avantages | Contraintes |
|---|---|---|
| Fonds propres | Pas de remboursement pendant l'apprentissage | Montant limité ; c'est la source normale pour le pilote |
| Banques commerciales locales | Montants possibles pour l'extension | Taux en dollars élevés (souvent 12 à 20 %), garanties exigées, durées courtes |
| Institutions de microfinance | Accessibles | Montants faibles, taux élevés |
| Crédit-bail sur l'énergie solaire (installateurs) | Préserve la trésorerie | Coût total plus élevé |
| Partenaire minier ou industriel (contrat d'achat + avance) | Débouché garanti, financement adossé | Exigences de qualité et de volume |
| Bailleurs, programmes d'agriculture et de sécurité alimentaire | Subventions ou taux bas | Dossiers longs, conditions de rapportage |

**Recommandation** : pilote sur fonds propres (55 000 $ environ, plus un fonds de roulement de 8 000 $ pour la première année) ; extension financée seulement après les résultats du pilote, en combinant un contrat d'achat avec un ou deux gros clients, un prêt bancaire pour 50 à 60 % et des fonds propres pour le reste. Le dossier de prêt s'appuiera sur les données mesurées du pilote, ce qui est un argument beaucoup plus fort qu'une étude.

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
| 70 | 702 Ventes de produits finis | Ventes de légumes |

**Comptabilité analytique** recommandée dès le pilote : une section par culture (fruits, feuilles, essais) et une section « infrastructures communes ». Les heures de travail, les intrants et l'énergie (grâce aux sous-compteurs) sont imputés par culture. On connaît ainsi la marge réelle de chaque produit au bout de six mois, et le mélange de cultures de l'extension se décide sur des faits.

## 13.11 Indicateurs de pilotage économique

| Indicateur | Formule | Cible ferme complète (médian) |
|---|---|---|
| CA net par m² de serre | CA net / surface | ≥ 62 $/m²/an |
| Coût de revient complet par kg de tomate | (charges + amortissements imputés) / kg vendus | < prix de vente |
| Taux de pertes et invendus | pertes / production | ≤ 8 % |
| Productivité du travail | kg vendus / heure travaillée | à mesurer en phase 1 |
| Énergie par kg produit | kWh / kg | 3 à 4 kWh/kg au pilote (infrastructures surdimensionnées pour 100 m²), objectif < 1,5 kWh/kg pour la ferme complète |
| Eau par kg produit | L / kg | 40 à 50 L/kg en tomate, 10 à 20 L/kg en feuilles |
| Délai de paiement clients | créances / CA x 365 | ≤ 30 jours |
| Taux de service | livraisons conformes et à l'heure / livraisons | ≥ 95 % |
