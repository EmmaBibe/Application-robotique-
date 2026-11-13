# 1. Contexte : Lubumbashi et ses contraintes

Ce document rassemble les données de terrain qui conditionnent la conception. Quand une donnée n'a pas pu être vérifiée par une source fiable, elle est signalée comme telle, avec la manière de l'obtenir.

## 1.1 Situation

- Coordonnées : environ 11,67° S, 27,48° E.
- Altitude : 1 200 à 1 300 m selon les quartiers (référence de calcul : 1 230 m, pression atmosphérique moyenne 87,5 kPa).
- Population : de l'ordre de 2,5 à 3 millions d'habitants, deuxième ville du pays, capitale économique du Haut-Katanga, au cœur de la ceinture cuprifère.
- Frontière zambienne (poste de Kasumbalesa) à environ 90 km : principale porte d'entrée des marchandises venant de Zambie et d'Afrique australe.

## 1.2 Climat

Climat tropical d'altitude à saison sèche marquée (Cwa). Les normales ci-dessous sont des valeurs de travail recoupées entre plusieurs bases (WorldClim, relevés de l'Université de Lubumbashi, sources météo publiques). Les sources divergent de 10 % sur la pluviométrie (1 060 à 1 230 mm/an). Le fichier source est `donnees/climat_lubumbashi_mensuel.csv`.

| Mois | T max (°C) | T min (°C) | Pluie (mm) | HR moy. (%) | Rayonnement (kWh/m²/j) | Durée du jour (h) |
|---|---|---|---|---|---|---|
| Janvier | 27,0 | 16,5 | 245 | 82 | 5,0 | 12,8 |
| Février | 27,2 | 16,5 | 225 | 82 | 5,1 | 12,5 |
| Mars | 27,3 | 16,0 | 205 | 80 | 5,3 | 12,2 |
| Avril | 27,5 | 14,0 | 55 | 72 | 5,6 | 11,8 |
| Mai | 26,8 | 10,5 | 5 | 60 | 5,6 | 11,5 |
| Juin | 25,5 | 7,5 | 0 | 52 | 5,4 | 11,3 |
| Juillet | 25,8 | 7,0 | 0 | 47 | 5,7 | 11,4 |
| Août | 28,5 | 9,5 | 1 | 40 | 6,3 | 11,7 |
| Septembre | 31,5 | 13,0 | 5 | 36 | 6,6 | 12,0 |
| Octobre | 32,5 | 16,0 | 30 | 42 | 6,4 | 12,4 |
| Novembre | 29,5 | 17,0 | 160 | 68 | 5,4 | 12,7 |
| Décembre | 27,2 | 16,8 | 255 | 80 | 4,9 | 12,9 |

Lecture agronomique :

- **Quatre saisons pour la serre.** Pluies chaudes et humides (novembre à mars), transition (avril), sèche fraîche (mai à juillet), sèche chaude (août à octobre).
- **Le froid est nocturne et court.** Les journées de juin-juillet restent à 25 °C. Le problème n'est donc pas de chauffer en continu mais de garder la chaleur du jour pour la nuit, ce qui oriente vers un stockage thermique plutôt qu'un chauffage.
- **La chaleur est sèche.** En septembre-octobre l'air extérieur est à moins de 40 % d'HR : un mur évaporatif abaisse l'air entrant de 8 à 10 °C. En saison des pluies, il ne sert presque plus, mais il fait aussi moins chaud.
- **L'humidité nocturne de saison des pluies** est le principal facteur de maladies foliaires (mildiou, botrytis, cladosporiose). L'air extérieur la nuit étant saturé, ventiler ne suffit pas : il faut une légère élévation de température.
- **La lumière est abondante** : environ 2 000 kWh/m²/an, soit près du double des Pays-Bas. C'est l'atout majeur du site, et la raison pour laquelle la conception mise sur la lumière naturelle.
- **Photopériode** : 11,3 h en juin à 12,9 h en décembre. Les oignons à bulbe doivent être des variétés de jours courts ; le reste des cultures n'est pas affecté.
- **Orages violents** en début de saison des pluies, avec rafales et grêle possible, et une densité de foudroiement parmi les plus élevées au monde dans la région des Grands Lacs et du Katanga. Conséquences : structure dimensionnée au vent, ouvrants qui se ferment automatiquement, protection foudre et parafoudres soignés.

**Action recommandée** : installer la station météo du projet (prévue au lot IIoT) dès le début du chantier. Six mois de mesures sur la parcelle valent mieux que n'importe quelle base de données.

## 1.3 Électricité

- Le réseau SNEL dessert Lubumbashi de façon irrégulière : délestages programmés de 6 à 12 heures par jour selon les périodes et les quartiers, coupures liées aux vols de câbles en cuivre (cas documentés sur l'axe Likasi-Lubumbashi et à Kipushi en 2025), transformateurs saturés. Le remplacement de transformateurs en cours en 2026 améliore la situation dans certains quartiers.
- Tarif : de l'ordre de 0,14 $/kWh pour le réseau d'après une analyse de 2024 ; le kWh produit par groupe électrogène revient entre 0,40 et 0,65 $. La grille tarifaire officielle pour un client professionnel basse tension doit être demandée à la SNEL ou à l'ARE avant le choix final.
- Le secteur minier du Katanga investit massivement dans le solaire (centrales avec stockage sur des mines de cuivre) : les installateurs, onduleurs et batteries LiFePO4 sont disponibles localement, mais les prix publics sont rares. Il faudra trois devis.

**Conséquence de conception** : la serre ne doit jamais dépendre du réseau pour survivre. Le réseau est une source d'appoint qui recharge les batteries quand il est présent.

## 1.4 Eau

- La REGIDESO dessert une partie de la ville, avec des interruptions fréquentes et une pression variable.
- Les forages privés sont courants. Profondeur typique à confirmer localement (souvent 30 à 80 m).
- **Risque de contamination minérale.** La région est l'une des plus riches au monde en cuivre et cobalt, et plusieurs études documentent la pollution des eaux et des sols autour des sites miniers et métallurgiques (métaux, parfois arsenic, plomb, uranium dans les rivières et les puits de la région de Kolwezi selon une enquête de 2026). Pour Lubumbashi, la qualité de l'eau des puits maraîchers (quartier Luwowoshi par exemple) a fait l'objet d'études, mais aucune donnée de métaux applicable à une parcelle donnée ne peut être tirée de la littérature.
- **L'eau de pluie** est abondante de novembre à mars, peu minéralisée, idéale pour l'hydroponie. Elle ne couvre pas la saison sèche sans un stockage très coûteux.

**Conséquence de conception** : analyse complète de l'eau de la parcelle avant tout engagement (métaux Cu, Co, Mn, Zn, Pb, Cd, As, Ni, Fe ; bicarbonates ; Ca, Mg, Na, Cl, SO4 ; bore ; pH ; CE ; bactériologie). Le choix du traitement (simple filtration, ou osmose inverse) en dépend. L'eau de pluie est récupérée systématiquement.

## 1.5 Sols

- La thèse de F. Mununga Katebe (ULiège, 2024) indique que le cuivre et le cobalt sont responsables de la contamination de plus de 75 % des sols des jardins maraîchers de Lubumbashi, que les amendements organo-calcaires ne ramènent pas les légumes sous les seuils de toxicité, et que les cultures hydroponiques étudiées ne présentaient pas de métaux dans leurs parties aériennes.
- Les études de Mpundu et collègues (2013, 2017) ont mesuré des teneurs élevées en éléments traces dans les légumes-feuilles vendus sur onze marchés de la ville.

**Conséquence de conception** : culture entièrement hors-sol, sol de la serre recouvert (dalle ou toile tissée sur gravier), aucune poussière de sol en contact avec les cultures. Les analyses de métaux des produits deviennent un outil commercial (bulletin d'analyse remis aux clients professionnels).

## 1.6 Ravageurs et maladies présents dans la région

- **Tuta absoluta** (mineuse de la tomate) : signalée en RDC depuis 2016 (Kinshasa), et décrite en 2026 comme une menace majeure pour la tomate dans des essais menés à Lubumbashi en 2023-2024, avec des résistances aux insecticides classiques (la cyperméthrine s'y montre inefficace). Elle est présente dans toute l'Afrique australe et orientale.
- Aleurodes (Bemisia tabaci, vecteur du virus TYLCV de l'enroulement jaune de la tomate), thrips (vecteurs de tospovirus), pucerons, acariens tétranyques.
- Maladies : flétrissement bactérien (Ralstonia), fusarioses, Pythium en hydroponie chaude, mildiou, alternariose, oïdium, botrytis.
- Le virus ToBRFV (virus du fruit rugueux brun de la tomate) se répand dans le monde par les semences et les mains ; sa présence en RDC n'est pas documentée à notre connaissance, mais le risque d'introduction par des semences non certifiées est réel.

**Conséquence de conception** : filets anti-insectes 50 mesh minimum, sas, semences certifiées de variétés résistantes, hygiène stricte, piégeage et lutte biologique. Détail au document 06.

## 1.7 Marché

**Ce que l'on sait :**

- Lubumbashi dépend largement des produits frais importés de Zambie et, pour les supermarchés, d'Afrique du Sud. Les prix sont instables : au marché Hewa Bora, le prix de la caisse de tomates a presque doublé en une journée en mars 2026, puis la caisse est passée de 35 000 à 25 000 FC (-28,5 %) en juillet 2026 grâce à l'abondance de la récolte locale de saison sèche.
- Taux de change indicatif fin octobre 2026 : 2 265 CDF pour 1 USD (interbancaire), 2 327 au marché parallèle.
- Une caisse de tomates de marché (de l'ordre de 20 à 25 kg) à 25 000-35 000 FC représente environ 0,45 à 0,75 $/kg. **Il est impossible, et inutile, de concurrencer ce prix.** La serre doit vendre autre chose : régularité, calibre, propreté, absence de métaux et de résidus, disponibilité en saison des pluies.

**Les clients visés :**

1. Supermarchés et supérettes haut de gamme (produits aujourd'hui importés d'Afrique du Sud, chers et fatigués par le transport).
2. Hôtels et restaurants (besoin de régularité, de laitues, d'aromatiques).
3. Cantines et sociétés de restauration des entreprises minières (gros volumes, contrats annuels, sensibilité forte à la sécurité alimentaire de leur personnel).
4. Particuliers aisés et expatriés, par abonnement de paniers livrés.

**Ce que l'on ne sait pas encore et qu'il faut mesurer avant d'investir** (phase 0, voir feuille de route) : les prix réellement pratiqués par produit et par canal, les volumes hebdomadaires que chaque acheteur peut prendre, les exigences (emballage, calibre, délais de paiement). Une grille d'enquête est fournie dans `donnees/enquete_prix_modele.csv`.

### Poisson et pisciculture

Le poisson frais vendu à Lubumbashi vient des lacs du nord de la province (Moero, barrages), de Zambie (tilapia d'élevage) ou de l'importation en congelé ; le poisson frais local est cher et irrégulier. La pisciculture en étangs existe autour de la ville (tilapia du Nil, Clarias), mais les synthèses sur la filière en RDC citent pour le Haut-Katanga la non-maîtrise de la reproduction artificielle et de l'élevage larvaire du Clarias, et l'alimentation inadaptée des jeunes stades, comme premiers freins. L'alevin de Clarias de 10 g s'y vend 0,3 à 0,5 $, celui de tilapia 0,25 à 0,4 $. Les prix de marché du poisson de table en Afrique subsaharienne se situent entre 2,5 et 5 $/kg selon la FAO ; aucune cotation récente fiable n'a été trouvée pour Lubumbashi : l'enquête de la phase 0 doit la fournir (chapitre 19).

## 1.8 Cadre légal et administratif (points à vérifier avec un juriste local)

- Forme de société : SARL ou SAS selon l'Acte uniforme OHADA, immatriculation par le Guichet unique de création d'entreprise.
- Foncier : la loi n° 11/022 du 24 décembre 2011 portant principes fondamentaux relatifs à l'agriculture encadre la détention des concessions agricoles (conditions de nationalité de l'exploitant). Une parcelle urbaine ou périurbaine sous certificat d'enregistrement peut relever d'un autre régime : à confirmer.
- Autorisation de bâtir auprès des services provinciaux de l'urbanisme pour l'annexe maçonnée.
- Fiscalité : TVA à 16 %, impôt sur les bénéfices à 30 % avec minimum d'imposition, cotisations sociales employeur (CNSS, INPP, ONEM). Des avantages (exonérations de droits sur le matériel agricole importé) peuvent être obtenus via un agrément au Code des investissements (ANAPI) ou au titre de la loi agricole : la démarche est recommandée, le gain sur les droits d'entrée du matériel peut dépasser 10 % du budget d'équipement.
- Comptabilité : SYSCOHADA révisé (voir document 13).

## 1.9 Logistique et approvisionnement

- Disponible localement ou en Zambie voisine : tubes acier galvanisés, ciment, blocs, tôles, PVC, pompes standard, câbles, panneaux solaires, onduleurs, batteries, engrais de base.
- À importer (Afrique du Sud, Kenya, Europe ou Chine) : film de serre technique diffusant, filets anti-insectes de qualité, écrans aluminisés, panneaux de refroidissement (pad), engrais solubles de qualité hydroponique, chélates de fer, sondes de qualité (pH, CE, oxygène), auxiliaires de lutte biologique (disponibilité régionale à vérifier, sinon recours aux biopesticides).
- Délais réalistes : 4 à 10 semaines pour un conteneur via Durban ou Dar es Salaam puis la route, plus le dédouanement. Le planning en tient compte.

## 1.10 Sécurité

Les vols de câbles et de matériel sont fréquents. Les panneaux solaires, batteries et pompes sont des cibles. La conception prévoit : clôture, éclairage, gardiennage de nuit, caméras reliées à la supervision, fixation antivol des panneaux, local technique fermé en maçonnerie.
