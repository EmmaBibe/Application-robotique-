# Synthèse décisionnelle

Serre agricole en environnement contrôlé, Lubumbashi (Haut-Katanga, RDC)
Pilote de 10 m x 10 m, puis ferme intégrée serres et aquaculture de 1 000 à 2 000 m². Version 1.2, novembre 2026.

---

## 1. La question posée

Peut-on produire à Lubumbashi, toute l'année, des légumes frais (tomate, poivron, piment, amarante, choux, épinard, céleri, poireau, oignon, ail) dans une serre pilotée, économe en énergie et en engrais, à risque sanitaire minimal, avec un suivi fin par capteurs, et en tirer une activité rentable ?

La réponse courte : techniquement oui, sans difficulté majeure. Économiquement, oui sous conditions, et ces conditions ne peuvent être vérifiées qu'en faisant tourner un pilote. Ce dossier décrit ce pilote en détail, ce qu'il coûte, ce qu'il doit prouver, et à partir de quels résultats il faut passer à l'échelle ou s'arrêter.

## 2. Ce que l'étude a établi

**Le climat de Lubumbashi est favorable, à condition de traiter trois périodes.** L'altitude (environ 1 230 m) donne des journées douces et un ensoleillement fort toute l'année (5 à 6,6 kWh/m²/j). Les difficultés sont concentrées sur :

- les nuits froides de juin-juillet (minimales moyennes de 7 °C, pointes plus basses) ;
- la chaleur sèche de septembre-octobre (maximales de 31 à 33 °C, HR sous 40 %) ;
- l'humidité nocturne de la saison des pluies (novembre-mars), où l'air extérieur est saturé.

La simulation thermique de la serre (modèle fourni dans `logiciel/`) montre que la combinaison retenue (écran thermique, stock d'eau chaude de 6 à 10 m³ chargé par l'excès de chaleur du jour, mur évaporatif pour la saison chaude) maintient la température entre 13,4 et 30,6 °C toute l'année sans aucun chauffage fossile. Une serre simple sans ces équipements descendrait à 8,6 °C en juillet et monterait à 37,6 °C en octobre.

**Le sol est un danger, l'hors-sol est une réponse.** Plus de 75 % des sols maraîchers de Lubumbashi sont contaminés au cuivre et au cobalt (thèse Mununga Katebe, ULiège 2024) et les légumes-feuilles vendus sur les marchés en contiennent. Les cultures hydroponiques étudiées dans la même thèse ne présentaient pas de métaux dans leurs parties consommées. Produire hors-sol avec une eau contrôlée n'est donc pas un luxe technologique : c'est un argument commercial et sanitaire fort (« légumes analysés sans métaux lourds »).

**L'éclairage artificiel intégral (ferme verticale) est à exclure pour ces cultures.** Une tomate a besoin d'environ 25 mol de lumière par m² et par jour. Fournir cela avec des LED sur 100 m² demanderait environ 300 kWh par jour, soit quinze fois la consommation totale de la serre retenue (environ 21 kWh/j). Le soleil de Lubumbashi est gratuit et abondant : la conception est une serre éclairée naturellement, la lumière artificielle étant limitée à la chambre de germination.

**L'énergie peut être autonome.** Avec 3 à 6,6 kWc de panneaux et 10 à 20 kWh de batteries LiFePO4, le site fonctionne sans le réseau SNEL, qui reste un appoint, et un petit groupe électrogène sert de dernier recours. Les fonctions vitales (aération des bassins, automates, alarmes) sont alimentées en priorité et tiennent plus de 24 h sans soleil.

**Le calendrier tombe bien.** Les tomates de plein champ autour de Lubumbashi abondent en saison sèche (prix bas en juillet) et souffrent en saison des pluies (prix qui doublent, comme en mars 2026). Le plan de culture place la récolte de tomates et poivrons de novembre à juin, puis un vide sanitaire en juillet, mois le plus froid : on vend quand le marché est cher et on coupe le cycle des ravageurs quand la plante pousserait mal de toute façon.

**Toutes les cultures demandées ne méritent pas une place en serre.** L'évaluation plante par plante (document 03) conclut :

| Culture | Verdict |
|---|---|
| Tomate, poivron, piment | Retenus, compartiment « fruits », culture sur substrat |
| Chou de Chine, épinard, céleri, poireau | Retenus, compartiment « feuilles », radeaux flottants |
| Amarante | Retenue mais en petite surface : excellente culture, prix de vente faible |
| Oignon | Retenu sous forme d'oignon vert (cébette). Le bulbe n'a pas sa place en serre |
| Chou pommé, ail | Essais seulement. Trop peu de valeur au m², à produire en plein champ |

L'étude recommande d'ajouter la laitue et des aromatiques (basilic, coriandre, persil) : ce sont les cultures qui rapportent le plus au m² en hydroponie, et elles financent les autres.

**Les poissons ont leur place, mais pas pour les raisons qu'on lit le plus souvent** (chapitre 19). L'eau des poissons couvre l'azote et le phosphore des cultures, mais seulement un quart du potassium : l'économie d'engrais est d'un tiers environ, soit 1 000 à 2 000 $ par an. Ce que l'aquaculture apporte vraiment, c'est un deuxième produit sur un marché profond (le poisson frais manque en ville), une écloserie de poisson-chat (Clarias) là où les alevins font défaut dans la province, et une ferme moins dépendante du prix des légumes. La forme retenue est « découplée » : poissons et plantes ont chacun leur circuit et l'eau des bacs sert d'eau d'appoint, filtrée et désinfectée, aux cultures. Le Clarias, qui respire l'air en surface, supporte les pannes d'aération que provoquent les coupures du réseau.

## 3. Ce que coûte le projet et ce qu'il rapporte

Montants en dollars US, rendu Lubumbashi, hors terrain. Détail dans `finance/modele_financier_serre_lubumbashi.xlsx` et au chapitre 13.

La ferme se construit en trois tranches, chacune décidée sur les résultats mesurés de la précédente :

| | Phase 1 : pilote | Phase 2 : 1 000 m² et aquaculture | Phase 3 : 2 000 m² | Total |
|---|---|---|---|---|
| Contenu | 100 m² de serre, annexe, énergie, supervision, 2 bacs de 3 m³ | +900 m² de serres, écloserie, grossissement 5 t/an | +1 000 m² orientés fruits, grossissement 10 t/an | |
| Investissement | 62 920 $ | 180 950 $ | 124 080 $ | 367 950 $ |
| Année | 0 | 2 | 4 | |

La phase 1 porte presque toutes les infrastructures communes (annexe, sas, énergie, supervision, chambre froide, stockage d'eau), d'où son coût élevé au m². Ces équipements servent ensuite à toute la ferme.

Résultats en régime de croisière :

| Scénario | CA net, 2 000 m² | dont poissons et alevins | EBE à 1 000 m² | EBE à 2 000 m² | TRI sur 10 ans |
|---|---|---|---|---|---|
| Prudent | 87 600 $ | 31 100 $ | -24 100 $ | -38 000 $ | négatif |
| Médian | 168 000 $ | 53 900 $ | 23 000 $ | 48 100 $ | -1,0 % |
| Optimiste | 279 800 $ | 86 800 $ | 87 200 $ | 162 800 $ | +21,5 % |

Ces chiffres doivent être lus sans complaisance :

1. **Avec les hypothèses médianes, aucune configuration ne rémunère le capital à 12 %.** La ferme intégrée de 2 000 m² dégage 48 000 $ d'excédent par an, contre 16 000 $ pour la ferme de 1 000 m² sans poissons du projet initial, mais l'investissement a doublé. Les poissons font gagner environ trois points de TRI ; l'agrandissement, à lui seul, n'en fait gagner aucun.
2. **Le résultat dépend de trois inconnues : le prix réellement payé pour les légumes, le rendement réellement obtenu, et le nombre d'alevins vendus aux pisciculteurs.** Entre le scénario prudent et l'optimiste, l'écart d'EBE est de 200 000 $ par an pour la même ferme.
3. **Les seuils sont identifiables.** La ferme de 2 000 m² reste à l'équilibre d'exploitation tant que les légumes se vendent au moins à 58 % des prix médians (74 % sans aquaculture). Pour que le projet entier rémunère le capital à 12 %, il faut un indice prix x rendement des légumes d'environ 1,5, ou une combinaison équivalente de ventes directes, de prix du poisson et d'alevins vendus. Mais chaque tranche se décide une fois la précédente payée : la tranche 2 avec aquaculture se rentabilise dès que les prix des légumes atteignent environ 1,2 fois le médian (c'est le seuil « go » retenu) ; la tranche 3 demande environ 1,4.
4. **L'aquaculture est un pari à fort levier.** Dans le scénario médian, son rendement propre est d'environ 7 % ; dans l'optimiste, 33 % ; dans le prudent, elle creuse la perte. Son premier levier est l'écloserie : chaque tranche de 30 000 alevins vendus vaut environ 5 700 $ d'EBE par an.
5. **Le pilote seul n'est pas une affaire rentable.** À 100 m², le chiffre d'affaires ne peut pas porter un salaire et les frais fixes. Si le porteur de projet fait lui-même le travail, le pilote s'équilibre à peu près. C'est un outil d'apprentissage et de preuve commerciale.

## 4. Recommandation

**Lancer le pilote, en le considérant comme l'achat d'une information, pas comme une affaire.**

- Budget pilote recommandé : 62 920 $ (configuration « optimisée », pilote aquacole compris). Une configuration « vitrine R&D » plus instrumentée (environ 112 000 $) n'a de sens qu'avec un partenaire qui la finance (université, entreprise minière dans le cadre de sa responsabilité sociale, bailleur).
- Perte maximale si l'on abandonne après deux ans, matériel revendu à 35 % : environ 48 000 $. C'est le risque réel à accepter.
- Durée : 12 à 18 mois de production avant de décider.
- Terrain : prévoir dès le départ une parcelle d'environ 80 x 60 m (4 800 m², planche A05), pour ne pas fermer la porte aux tranches 2 et 3.

**Ne décider la tranche 2 que si le pilote atteint, sur 12 mois glissants :**

| Indicateur | Seuil « go » | Seuil « stop » |
|---|---|---|
| Tomate, rendement annualisé | ≥ 28 kg/m² | < 20 kg/m² |
| Laitue, têtes vendables par m² de radeau et par an | ≥ 220 | < 160 |
| Prix moyen obtenu, tous légumes | ≥ 110 % du médian | < 90 % |
| Indice global prix x rendement (modèle financier) | ≥ 1,2 | < 1,0 |
| Clients professionnels sous contrat ou commande régulière | ≥ 4 | < 2 |
| Pertes et invendus | ≤ 8 % | > 15 % |
| Incidents sanitaires ayant détruit plus de 20 % d'une culture | 0 | ≥ 2 |
| Disponibilité de la supervision (données reçues) | ≥ 98 % | < 90 % |
| Poissons : survie, indice de conversion | ≥ 85 %, ≤ 1,3 | < 75 %, > 1,5 |
| Écloserie : pontes réussies, pisciculteurs engagés | ≥ 3 pontes, ≥ 5 acheteurs | 0 ponte, < 2 acheteurs |
| Prix du poisson obtenu, prix de l'aliment rendu | ≥ 3,0 $/kg, ≤ 1,30 $/kg | < 2,5 $/kg, > 1,60 $/kg |

Entre les deux seuils : prolonger le pilote de six mois en corrigeant ce qui coince, ou étendre plus modestement (300 à 400 m²) en recalculant avec les valeurs mesurées. Si seuls les critères aquacoles échouent, la tranche 2 se fait sans aquaculture (ou avec un grossissement alimenté en alevins achetés si seule l'écloserie échoue).

**La tranche 3 (2 000 m²) ne se décide que 18 mois après la mise en service de la tranche 2**, si l'indice prix x rendement mesuré atteint 1,4 et si l'EBE de la ferme de 1 000 m² dépasse 40 000 $ par an (chapitre 16, §16.6). Une ferme de 1 000 m² bien vendue vaut mieux qu'une ferme de 2 000 m² mal vendue.

Le modèle financier est construit pour que ces valeurs mesurées remplacent les hypothèses en quelques minutes.

## 5. Ce qui fait la différence de ce projet

- Hors-sol intégral et eau maîtrisée : produits analysés, sans métaux lourds, argument rare à Lubumbashi.
- Deux compartiments indépendants (fruits / feuilles), chacun avec son propre circuit d'eau désinfecté aux UV : une maladie racinaire ne traverse pas la serre.
- Sas de biosécurité, filets anti-insectes 50 mesh, vide sanitaire annuel, lutte biologique : on vise zéro traitement chimique de synthèse sur les produits récoltés.
- Climat piloté par l'excès de chaleur du jour, stocké dans l'eau pour la nuit : pas de chauffage au gaz ni au charbon.
- Aquaculture découplée : écloserie de Clarias et poisson de table élevés sans hormones de croissance ni antibiotiques préventifs ; l'eau renouvelée des bacs arrose les cultures, rien n'est rejeté.
- Supervision locale autonome (fonctionne sans internet), alertes SMS, tableau de bord qui montre la serre comme un organisme vivant : chaque lot de plantes, de la graine à la récolte, avec son climat, sa solution, ses photos et son historique. Un mode « recherche » permet de mener des essais comparatifs et d'exporter les données.

## 6. Se mettre dans la serre avant d'investir

Trois simulateurs, fonctionnant hors ligne, permettent d'éprouver la conception avant toute dépense (chapitre 18) :

- **la maquette 3D vivante**, où l'on se promène dans les allées, où le soleil est à sa vraie place pour chaque mois et chaque heure, où les ouvrants, l'écran, le mur évaporatif et les extracteurs bougent selon le climat calculé, où l'eau et l'énergie circulent dans les tuyaux et les câbles ;
- **le simulateur des systèmes**, qui montre, schéma par schéma (climat, fertirrigation, bassins, eau, électricité, électronique et IIoT, aquaculture), qui fait quoi, quand et sous quelles conditions, et comment la ferme réagit à dix pannes que l'on peut provoquer ;
- **la supervision**, l'écran que le technicien utilisera sur site.

Ils sont complétés par un dossier de plans A3 de 18 planches (génie civil, plan de masse de la ferme intégrée, P&ID dont l'unité aquacole, unifilaire, commande, câblage, réseau, logique, listes d'E/S et de câbles) et par le dossier de fabrication de la carte électronique des automates (schéma KiCad, circuit imprimé, Gerbers, nomenclature).

## 7. Où trouver quoi

| Besoin | Document |
|---|---|
| Comprendre le contexte local (climat, énergie, eau, marché, sols) | `01_contexte_lubumbashi.md` |
| Pourquoi chaque choix technique a été fait | `02_choix_conception.md` |
| Stratégie de cultures, verdict plante par plante | `03_strategie_cultures.md`, `04_fiches_cultures.md` |
| Solutions nutritives | `05_nutrition_fertirrigation.md` |
| Biosécurité et protection des cultures | `06_biosecurite_protection.md` |
| Bâtiment, structure, génie civil | `07_architecture_genie_civil.md` |
| Climat, thermique, ventilation | `08_climat_thermique.md` |
| Eau et hydraulique | `09_eau_hydraulique.md` |
| Électricité et énergie | `10_electricite_energie.md` |
| Capteurs, automates, réseau | `11_electronique_iiot.md` |
| Logiciel de supervision et interface | `12_logiciel_supervision.md` |
| Économie, financement, comptabilité | `13_economie_finance.md` |
| Exploitation au quotidien | `14_exploitation_procedures.md` |
| Risques | `15_registre_risques.md` |
| Planning et étapes de décision | `16_feuille_de_route.md` |
| Sources | `17_sources.md` |
| Simulateurs 2D et 3D, dossier de plans, carte électronique CAZ-1 | `18_simulateurs_et_carte_electronique.md` |
| Aquaponie et pisciculture : ce que les poissons apportent, unité aquacole, chiffres | `19_aquaponie_pisciculture.md` |
