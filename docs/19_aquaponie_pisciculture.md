# 19. Aquaponie et pisciculture : ce que les poissons apportent vraiment

L'association poissons et légumes revient dans presque tous les articles sur l'agriculture urbaine, souvent présentée comme un cercle vertueux qui rendrait la ferme à la fois plus écologique et plus rentable. Ce chapitre vérifie ces promesses une par une, avec les chiffres du projet, puis décrit l'unité aquacole retenue, son dimensionnement et ce qu'elle change aux résultats. Calculs : `logiciel/outils/bilan_aquaponie.py` (bilans de matière, d'eau, de chaleur et d'énergie) et onglet `Poissons` du classeur financier.

## 19.1 La réponse courte

- **Oui, l'association est utile à Lubumbashi**, mais pas pour les raisons qu'on lit le plus souvent. Les poissons ne rendent pas les légumes moins chers à produire : l'économie d'engrais est réelle mais modeste (environ 35 % de la facture d'engrais, soit 1 100 à 2 200 $ par an). Ce qu'ils apportent surtout, c'est **un deuxième produit vendu sur un marché profond** (le poisson frais manque en ville, une grande partie est importée congelée), **une activité d'écloserie** qui répond à un manque identifié dans la province, et une **diversification** qui rend la ferme moins dépendante du prix des légumes.
- **La forme retenue est l'aquaponie « découplée »** : les poissons et les plantes ont chacun leur circuit, et l'eau des poissons est envoyée vers les cultures en quantité réglée. Le système « couplé » des démonstrations (une seule boucle d'eau) impose un compromis de pH, de température et de traitements qui pénalise les deux productions.
- **L'espèce de base est le poisson-chat africain (Clarias gariepinus)**. Il respire l'air en surface : une panne d'aération, fréquente avec les coupures du réseau, ne tue pas le cheptel en une heure comme pour le tilapia. Il se reproduit en écloserie avec une technique maîtrisée et il est connu des consommateurs.
- **Ce que cela change aux chiffres** (scénario médian) : pour la ferme de 1 000 m², l'excédent brut d'exploitation passe de 16 000 à 30 000 $ par an, le TRI de -3,5 % à -0,2 %, et le prix des légumes en dessous duquel la ferme de 2 000 m² perd de l'argent tombe de 74 % à 58 % des prix médians. En scénario optimiste, le TRI de la ferme de 2 000 m² passe de 17,3 % à 21,5 %. En scénario prudent, l'aquaculture creuse les pertes : c'est un pari supplémentaire, pas une assurance.
- **Liberté de surface** : agrandir ne suffit pas à rendre le projet rentable dans le scénario médian, parce que la marge par mètre carré est faible, pas parce que la ferme est trop petite. La surface cible devient 2 000 m² de serres et une unité aquacole de 10 t/an avec écloserie, atteinte en trois tranches, chacune décidée sur les résultats mesurés de la précédente.

## 19.2 Ce qu'on lit et ce qui est vrai

| On lit | Ce que disent les chiffres |
|---|---|
| « Les poissons nourrissent les plantes gratuitement » | L'aliment des poissons est acheté (1,0 à 1,5 $/kg). Le poisson en fixe environ un tiers, le reste ressort dans l'eau et les boues. Les plantes récupèrent l'azote et le phosphore, mais le potassium, le fer et le calcium manquent toujours : il faut les ajouter. Bilan pour la ferme de 2 000 m² : azote couvert à 140 %, phosphore à 170 %, potassium à 23 % (19.7). Économie réelle : un tiers de la facture d'engrais. |
| « 90 % d'eau en moins » | Vrai par rapport à un étang ou au maraîchage de plein champ. Faux par rapport à l'hydroponie recirculée du projet, déjà très économe. Le vrai gain est ailleurs : l'eau renouvelée des bacs (5 % par jour) n'est pas rejetée, elle arrose les cultures. L'élevage ne consomme donc presque pas d'eau en plus. |
| « De meilleurs rendements » | Les essais publiés donnent, en aquaponie découplée, des rendements de légumes proches de l'hydroponie (de -10 % à +30 % selon les études et les cultures). En système couplé, les fruits (tomate, poivron) produisent nettement moins, faute de potassium et à cause du pH élevé. |
| « C'est bio » | On ne peut traiter ni les plantes ni l'eau avec des produits nocifs pour les poissons : la lutte biologique déjà prévue devient une obligation. C'est un bon argument de vente, mais pas une certification. |
| « C'est rentable » | La littérature est prudente : la rentabilité dépend de la taille et des prix de vente ; plusieurs études africaines trouvent des ratios bénéfice/coût voisins de 1,1, plombés par l'énergie et les équipements importés. Dans ce projet, l'aquaculture se rembourse à peu près dans le scénario médian, très bien dans l'optimiste, mal dans le prudent. |
| « Les poissons chauffent la serre » | Non : 64 m³ d'eau à 27 °C stockent environ 74 kWh par degré, mais cette chaleur doit être fournie (soleil) avant d'être rendue. L'eau des bacs sert surtout de volant thermique stable pour l'écloserie et le grossissement. |

## 19.3 Ce que l'aquaculture apporte réellement au projet

1. **Un produit à marché profond.** Une ferme de 2 000 m² met en vente chaque semaine environ 700 laitues, 230 kg de tomates, 75 kg de poivrons et plus de 250 kg d'autres légumes-feuilles ; les écouler à bon prix est la contrainte principale du projet (chapitres 3 et 13). Dix tonnes de poisson par an, c'est moins de 200 kg par semaine dans une ville de plus de deux millions d'habitants où le poisson frais est cher et souvent importé congelé : la vente n'est pas le goulot.
2. **Une écloserie là où les alevins manquent.** Les synthèses sur la pisciculture en RDC citent, pour le Haut-Katanga, la non-maîtrise de la reproduction artificielle et de l'élevage larvaire du Clarias comme le premier frein de la filière ; l'alevin de 10 g s'y vend 0,3 à 0,5 $. Une écloserie demande peu de surface et peu d'aliment, mais de l'eau chaude et stable (27 à 29 °C) toute l'année : c'est exactement ce qu'une ferme sous serre, équipée d'un chauffe-eau solaire et d'une supervision, sait fournir. Dans le modèle, les alevins vendus représentent 40 % du chiffre d'affaires aquacole et plus de la moitié de sa marge.
3. **Une ferme moins fragile.** Avec l'aquaculture, la ferme de 2 000 m² reste à l'équilibre d'exploitation tant que les légumes se vendent au moins à 58 % des prix médians (74 % sans poissons).
4. **Des infrastructures partagées.** Énergie solaire et batteries, groupe électrogène, forage, citerne, supervision et alarmes, chambre froide, véhicule, gardiennage, comptabilité, clientèle de restaurants et de cantines : l'aquaculture utilise ce que la serre finance déjà.
5. **Des intrants recyclés.** Azote et phosphore des rejets valorisés par les plantes, eau de renouvellement réutilisée à 100 %, boues compostées : aucun rejet d'eau chargée dans le milieu.
6. **Une image cohérente.** « Légumes analysés sans métaux lourds, poissons élevés sans hormones de croissance ni antibiotiques préventifs, rien n'est rejeté » : c'est un discours rare à Lubumbashi, et vérifiable.

## 19.4 Ce qu'elle coûte et ce qu'elle risque

- **Investissement** : 80 200 $ sur l'ensemble du projet (pilote 7 700 $, unité de 5 t/an avec écloserie 66 000 $ en tranche 2, second module de grossissement 14 300 $ en tranche 3, imprévus compris).
- **Personnel qualifié** : un technicien aquacole formé (reproduction, élevage larvaire, qualité de l'eau) et un à deux ouvriers. La compétence est rare localement : elle se forme pendant le pilote (stage dans une écloserie de Zambie ou à l'Université de Lubumbashi).
- **Dépendance à l'aliment importé** : l'aliment extrudé de qualité vient aujourd'hui surtout des fabricants zambiens. L'aliment pèse plus de 80 % des coûts variables du poisson de table. Une hausse de 20 % de son prix retire environ 2 800 $ par an à la ferme de 2 000 m².
- **Électricité** : l'aération est la charge vitale numéro un. Le Clarias limite le risque (il survit plusieurs heures sans aération), mais l'écloserie, elle, ne le supporte pas. L'aération et l'écloserie sont donc sur le départ prioritaire secouru, avant les automates.
- **Maladies et mortalités** : un circuit fermé, une quarantaine des géniteurs et l'absence d'eau de rivière limitent le risque, sans l'annuler. Une mortalité massive coûte un cycle (4 à 6 mois de chiffre d'affaires poisson).
- **Concurrence** : le tilapia d'élevage zambien et le poisson congelé importé fixent un plafond aux prix. Le Clarias vendu vivant ou très frais, et les alevins, échappent en partie à cette concurrence.
- **Vol** : le poisson vivant se vole facilement ; le bâtiment aquacole est fermé, sous caméra et dans l'enceinte gardée.

## 19.5 Couplée ou découplée

| Critère | Aquaponie couplée (une boucle) | Aquaponie découplée (retenue) |
|---|---|---|
| pH | Compromis à 7,0 : trop haut pour les plantes (fer, phosphore, manganèse bloqués), trop bas pour la nitrification optimale | Poissons à 7,0-7,5 ; solutions des plantes à 5,8-6,2 comme aujourd'hui |
| Température | Une seule : le Clarias veut 26-28 °C, le bassin frais des laitues 20 °C | Chaque circuit à sa température ; l'eau des poissons entre dans les cultures en petite quantité |
| Nutriments | Carences en potassium, fer, calcium : fruits pénalisés | Compléments dosés dans le circuit des plantes ; la station de fertirrigation existante continue à piloter CE et pH |
| Maladie ou traitement | Impossible de traiter l'un sans toucher l'autre | Vanne fermée : chaque circuit vit seul plusieurs jours |
| Dimensionnement | Rapport poissons/plantes rigide | Rapport souple, ajusté par le débit envoyé aux cultures |
| Complexité | Simple en apparence | Une vanne, un bassin tampon, un minéralisateur et un UV de plus |

Le circuit découplé reprend l'architecture déjà retenue pour la serre (circuits fruits et feuilles séparés, désinfection UV, dosage automatique) : l'eau des poissons devient simplement l'eau d'appoint, filtrée et désinfectée, des circuits de culture.

## 19.6 Quelle espèce

| Critère | Poisson-chat africain (Clarias gariepinus) | Tilapia du Nil (Oreochromis niloticus) |
|---|---|---|
| Respiration | Aérienne en complément : survit à une panne d'aération | Strictement aquatique : mort en 1 à 3 h sans aération à forte densité |
| Densité en circuit recirculé | 100 à 300 kg/m³ possibles ; 60 kg/m³ en moyenne retenus | 40 à 60 kg/m³ |
| Température optimale | 25 à 30 °C ; croissance faible sous 22 °C | 27 à 30 °C ; croissance arrêtée sous 20 °C |
| Indice de conversion | 0,9 à 1,3 avec un aliment extrudé | 1,3 à 1,7 |
| Durée d'élevage | 5 à 6 mois de 10 g à 800 g | 6 à 7 mois de 5 g à 400-500 g |
| Reproduction | Induite par hormone (extrait d'hypophyse ou produit du commerce) sur les géniteurs seulement ; technique simple, élevage larvaire délicat (cannibalisme) | Spontanée, mais il faut des alevins monosexes (traitement hormonal des larves ou alevins importés de Zambie) |
| Marché à Lubumbashi | Connu, vendu vivant ou fumé ; à confirmer par l'enquête | Très apprécié ; en concurrence directe avec le tilapia zambien |
| Statut | Espèce indigène du bassin du Congo | Espèce introduite, déjà élevée dans la région |

**Choix** : Clarias pour l'écloserie et l'essentiel du grossissement, tilapia possible en complément si l'enquête de prix le justifie (un bac du module 2 peut lui être réservé). Le Clarias élevé ici n'a reçu aucune hormone : seuls les géniteurs reçoivent une injection pour déclencher la ponte, comme dans toutes les écloseries.

## 19.7 Dimensionnement et bilans

Calcul de `logiciel/outils/bilan_aquaponie.py` (résultats dans `donnees/bilan_aquaponie.csv`). Hypothèses : aliment à 38 % de protéines, indice de conversion 1,15, poisson entier à 2,56 % d'azote, 75 % de l'azote rejeté sous forme dissoute, 50 % de l'azote des boues récupéré par le minéralisateur, 30 % de pertes par dénitrification (fourchette 20 à 50 %).

| | Ferme 1 000 m² (tranche 2) | Ferme 2 000 m² (tranche 3) |
|---|---|---|
| Poisson de table produit | 5 t/an | 10 t/an |
| Aliment distribué | 15,8 kg/j | 31,5 kg/j |
| Volume de bacs (grossissement, écloserie, quarantaine) | 32 m³ | 64 m³ |
| Densité moyenne en grossissement | 57 kg/m³ | 57 kg/m³ |
| Azote mis à disposition des plantes / besoin | 372 / 267 g/j, soit 139 % (99 % si 50 % de pertes) | 744 / 526 g/j, soit 141 % (101 %) |
| Phosphore | 171 % du besoin | 170 % du besoin |
| Potassium | 23 % du besoin : à compléter | 23 % du besoin : à compléter |
| Aliment par m² de radeau | 38 g/j | 48 g/j |
| Eau renouvelée des bacs, envoyée aux cultures | 1,6 m³/j (60 % de l'eau des cultures en saison sèche) | 3,2 m³/j (55 %) |
| Boues (matière sèche) | 3,6 kg/j | 7,2 kg/j |
| Chaleur à fournir en juillet (bacs couverts et isolés, eau d'appoint) | 25 kWh/j | 50 kWh/j |
| Chauffe-eau solaire 20 m² | 56 kWh/j, soit 223 % | 56 kWh/j, soit 112 % |
| Inertie de l'eau des bacs | 37 kWh par degré | 74 kWh par degré |
| Électricité (air-lift, écloserie, capteurs) | 0,6 kW en continu, 14 kWh/j | 1,0 kW en continu, 24 kWh/j |
| Électricité par kg de poisson | 1,1 kWh | 0,9 kWh |

Lecture :

- **Le rapport poissons/plantes est cohérent.** Avec 38 à 48 g d'aliment par m² de radeau et par jour, on est dans la fourchette usuelle des systèmes de production (40 à 50 g/m²/j pour les feuilles dans les guides de la FAO). L'azote produit dépasse un peu les besoins ; l'excédent est piloté par le nitrate des bacs (cible 50 à 150 mg/L d'azote nitrique, toléré par le Clarias) : quand il monte, on envoie davantage d'eau vers les fruits et l'on exporte plus de boues vers le compost.
- **Le potassium reste à acheter** (sulfate de potassium, ou potasse en solution qui sert en même temps à remonter le pH des bacs), avec le fer chélaté, le calcium et le magnésium (chaux et dolomie, qui tamponnent aussi le pH).
- **La chaleur n'est pas un problème** grâce aux couvercles isolants et au chauffe-eau solaire ; la pompe à chaleur ne sert qu'en appoint (trois jours couverts consécutifs en juillet) et pour l'écloserie à 28-29 °C.
- **L'électricité aquacole** ajoute 14 à 24 kWh/j aux 21 kWh/j de la serre pilote : d'où les 4 kWc et 15 kWh de batterie supplémentaires de la tranche 2.

## 19.8 L'unité aquacole

### Implantation

Un bâtiment de 15 x 10 m accolé au côté est de l'annexe, au sud des serres pour ne leur faire aucune ombre (planche A05) : dalle avec caniveaux et pente, murs en panneaux isolés, toiture en polycarbonate double paroi pour l'éclairage naturel (les poissons n'aiment pas la lumière directe : ombrage intérieur au-dessus des bacs). Accès unique par le sas de l'annexe, pédiluve, local à aliment au sec et à l'abri des rongeurs.

### Chaîne de traitement de l'eau (par module de 32 m³)

1. **Bacs d'élevage** : 4 bacs circulaires de 8 m³ à fond conique, sortie centrale, couvercles isolants à moitié ajourés.
2. **Décanteur à flux radial** : retire les matières en suspension ; purge automatique deux fois par jour vers le minéralisateur.
3. **Biofiltre à lit mobile** (MBBR) : 4 m³ de média en mouvement, aéré ; transforme l'ammoniaque en nitrate.
4. **Dégazage et réoxygénation** : la colonne d'air-lift relève l'eau, chasse le CO2 et l'oxygène en même temps ; une soufflante en service, une en secours automatique.
5. **Bassin de reprise** : point de prélèvement vers les cultures (5 % du volume par jour), appoint d'eau de pluie traitée, dosage de potasse et de chaux pour tenir le pH entre 7,0 et 7,5.
6. **Vers les cultures** : filtre à sac 50 µm, lampe UV, bassin tampon de 2 m³, puis pompe doseuse vers les bassins de radeaux et la cuve des fruits, sous contrôle de la station de fertirrigation (CE, pH, complément potassium-fer-calcium).
7. **Minéralisateur** : les boues séjournent 10 à 15 jours, aérées ; le surnageant, riche en phosphore et en azote, rejoint le bassin tampon ; le reste est composté.

### Écloserie

- Géniteurs (20 femelles et 10 mâles de 1 à 2 kg), renouvelés par tiers chaque année, en quarantaine 30 jours à leur arrivée.
- Ponte induite par injection aux femelles, fécondation à sec, incubation sur claies à 27-28 °C (éclosion en 24 à 30 h).
- Élevage larvaire en 6 bacs de 1 m³ : nauplii d'artémia les 5 premiers jours, puis micro-granulés ; tri par taille tous les 5 à 7 jours contre le cannibalisme.
- Objectif : 6 à 8 pontes par an, alevins de 5 à 10 g en 5 à 6 semaines ; besoin interne 7 000 à 14 000 alevins par an, le reste vendu (90 000 dans le scénario médian).

### Supervision

Un quatrième automate de zone (AUT-P, même carte CAZ-1 que les autres) : oxygène dissous dans chaque bac, température, pH, niveau, débit de la colonne d'air-lift, état des soufflantes, nitrate et nitrite mesurés à la trousse deux fois par semaine et saisis dans la supervision. Alarmes critiques par SMS : oxygène inférieur à 3 mg/L, température hors de 24-31 °C, soufflante arrêtée, niveau bas. La ration du jour est calculée par la supervision à partir de la biomasse estimée et de la température, puis ajustée à l'appétit (distribution manuelle, observée).

### Sécurité sanitaire

- Pas d'eau de surface : eau de pluie traitée et forage seulement.
- L'eau des poissons n'arrose jamais les feuilles : elle passe sous les radeaux et dans les goutteurs.
- Analyses E. coli et salmonelles sur les feuilles et sur l'eau du bassin tampon une fois par mois, plus après chaque incident.
- Aucun antibiotique en prévention ; en cas de maladie, le circuit des poissons est isolé des cultures avant tout traitement.

## 19.9 Ce que cela donne en chiffres

Classeur `finance/modele_financier_serre_lubumbashi.xlsx`, onglet `Poissons`, régime de croisière.

| Aquaculture, scénario médian | Pilote | Ferme 1 000 m² | Ferme 2 000 m² |
|---|---|---|---|
| Poisson de table | 0,3 t | 5 t | 10 t |
| Alevins vendus | 0 | 90 000 | 90 000 |
| Chiffre d'affaires aquacole | 940 $ | 38 175 $ | 53 850 $ |
| dont alevins | 0 | 22 500 $ | 22 500 $ |
| Aliment | 414 $ | 6 900 $ | 13 800 $ |
| Écloserie (aliments larvaires, artémia, hormones) | 26 $ | 5 826 $ | 6 252 $ |
| Glace, caisses, transport, intrants | 48 $ | 800 $ | 1 600 $ |
| Marge sur coûts variables | 453 $ | 24 649 $ | 32 198 $ |
| Coût variable par kg de poisson de table | 1,63 $ | 1,63 $ | 1,63 $ |

Après personnel aquacole (8 700 à 11 200 $ par an charges comprises), énergie d'appoint et entretien (3 100 à 4 200 $), l'aquaculture ajoute environ 14 000 $ (1 000 m²) à 19 000 $ (2 000 m²) à l'excédent brut d'exploitation dans le scénario médian, pour 73 700 à 80 200 $ investis (pilote compris).

**Comparaison des configurations** (10 ans, actualisation 12 %, impôt et valeur résiduelle compris) :

| Configuration | Investissement total | EBE de croisière prudent / médian / optimiste | TRI prudent / médian / optimiste | VAN médiane |
|---|---|---|---|---|
| Serres seules, 1 000 m² (projet initial) | 169 950 $ | -15 100 / 16 000 / 57 400 $ | négatif / -3,5 % / 15,6 % | -92 600 $ |
| Serres seules, 2 000 m² | 279 700 $ | -28 600 / 29 000 / 107 900 $ | négatif / -4,3 % / 17,3 % | -130 700 $ |
| Serres + aquaculture, 1 000 m² | 243 900 $ | -21 900 / 30 000 / 101 000 $ | négatif / -0,2 % / 20,6 % | -104 000 $ |
| **Serres + aquaculture, 2 000 m² (référence)** | **368 000 $** | **-38 000 / 48 100 / 162 800 $** | **négatif / -1,0 % / 21,5 %** | **-140 800 $** |

Ce tableau dit trois choses :

1. **L'aquaculture améliore le résultat dans les scénarios médian et optimiste** (+14 000 et +44 000 $ d'EBE à 1 000 m²) et le dégrade dans le prudent : sa valeur actuelle nette est légèrement négative dans le médian (-11 000 $ à 1 000 m², soit un rendement propre d'environ 7 % sur 10 ans au lieu des 12 % demandés ; 33 % dans l'optimiste), très positive dans l'optimiste (+63 000 $), négative dans le prudent (-86 000 $). C'est un investissement à fort effet de levier, dont le résultat dépend de deux inconnues : le nombre d'alevins réellement vendus et le prix du poisson.
2. **L'agrandissement à 2 000 m² ne paie que si les prix et rendements mesurés dépassent nettement les médians** (indice prix x rendement des légumes d'environ 1,4). Dans le scénario médian, la tranche 3 a une valeur actuelle négative (-37 000 $, rendement propre de -3 %) ; dans l'optimiste, elle ajoute 38 000 $ (rendement propre de 26 %).
3. **Aucune configuration n'est rentable à 12 % avec les hypothèses médianes.** Il faut, pour la ferme intégrée de 2 000 m², un indice prix x rendement des légumes d'environ 1,5 (par exemple +25 % et +20 %), ou une combinaison de ventes directes, de prix du poisson et de ventes d'alevins plus favorable que le médian (tableau ci-dessous). Le pilote sert précisément à mesurer ces valeurs.

**EBE de croisière de la ferme de 2 000 m² selon le prix du poisson et les ventes d'alevins** (légumes au médian) :

| Prix du poisson \ alevins vendus | 0 | 30 000 | 60 000 | 90 000 | 120 000 | 150 000 |
|---|---|---|---|---|---|---|
| 2,40 $/kg | 22 400 | 28 100 | 33 800 | 39 500 | 45 200 | 50 900 |
| 2,80 $/kg | 26 200 | 31 900 | 37 600 | 43 300 | 49 000 | 54 700 |
| 3,30 $/kg | 31 000 | 36 700 | 42 400 | 48 100 | 53 800 | 59 500 |
| 3,80 $/kg | 35 700 | 41 400 | 47 100 | 52 800 | 58 500 | 64 200 |
| 4,30 $/kg | 40 500 | 46 200 | 51 900 | 57 600 | 63 300 | 69 000 |

Chaque tranche de 30 000 alevins vendus vaut 5 700 $ d'EBE ; chaque 50 cents de plus sur le kilo de poisson vaut 4 750 $. L'écloserie est donc le premier levier à prouver.

## 19.10 Ce que change la liberté de surface

La question « quelle surface pour bien gagner sa vie ? » a été traitée en faisant varier la surface de 1 000 à 3 000 m², avec et sans aquaculture. Trois constats :

- **Les frais fixes ne sont pas le problème principal.** Ils sont dilués en passant de 1 000 à 2 000 m², mais la marge par m² de légumes reste de l'ordre de 15 à 25 $ par an dans le scénario médian, pour un investissement de 115 à 127 $ par m² : quelle que soit la surface, l'investissement se rembourse en plus de 6 ans avant impôt.
- **Le marché limite les feuilles.** Au-delà d'environ 800 m² de compartiment feuilles, il faudrait écouler plus de 500 kg de feuilles (ou 2 000 laitues) par semaine, davantage que ce que les clients professionnels identifiés peuvent absorber. La tranche 3 est donc orientée fruits (650 m² de tomates, poivrons et piments pour 350 m² de feuilles), dont le marché est plus profond.
- **Ce qui fait la différence, c'est le prix obtenu et le rendement atteint**, puis l'écloserie. Une ferme de 2 000 m² bien vendue (indice 1,3 sur les légumes) dégage environ 82 000 $ d'EBE ; une ferme de 3 000 m² mal vendue perd de l'argent.

D'où la trajectoire retenue : **pilote, puis 1 000 m² avec l'unité aquacole, puis 2 000 m²**, chaque tranche décidée sur les résultats mesurés (chapitre 16). Le terrain recherché doit permettre les 2 000 m² de serres, le bâtiment aquacole, l'annexe, les citernes et les panneaux, soit une parcelle d'environ 80 x 60 m (4 800 m²) clôturée, dont le plan de masse est donné à la planche A05 du dossier de plans.

## 19.11 Ce que le pilote aquacole doit prouver

Le pilote comprend deux bacs de 3 m³ de Clarias, couverts et isolés, dans un abri de 4 x 3 m accolé à l'annexe (à l'emplacement du futur bâtiment aquacole), chauffés par un thermoplongeur de 1 kW sur thermostat et couplés au bassin tempéré des radeaux, plus un poste d'essais de reproduction. Il fonctionne dans les simulateurs (vue « Aquaculture » du simulateur des systèmes, domaine « Aquaculture » de la maquette 3D). Seuils de décision pour l'unité aquacole de la tranche 2, sur 12 mois :

| Indicateur | Seuil « go » | Seuil « stop » |
|---|---|---|
| Survie en grossissement | ≥ 85 % | < 75 % |
| Indice de conversion mesuré | ≤ 1,3 | > 1,5 |
| Pontes réussies (plus de 5 000 alevins de 5 g chacune) | ≥ 3 | 0 |
| Pisciculteurs ayant passé commande ou signé une lettre d'intention pour des alevins | ≥ 5 (≥ 60 000 alevins/an) | < 2 |
| Prix moyen du poisson de table obtenu | ≥ 3,0 $/kg | < 2,5 $/kg |
| Prix de l'aliment rendu ferme | ≤ 1,30 $/kg | > 1,60 $/kg |
| Légumes des radeaux alimentés par l'eau des poissons, rendement relatif à l'hydroponie seule | ≥ 90 % | < 80 % |

Si l'écloserie ne réussit pas mais que le grossissement est bon, la tranche 2 se fait avec un grossissement de 5 t/an en achetant les alevins ; si le grossissement échoue, la tranche 2 se fait sans aquaculture et le modèle financier revient aux résultats « serres seules ».

## 19.12 À vérifier en phase 0, avant toute dépense

1. **Le marché des alevins** : nombre de pisciculteurs dans un rayon de 100 km (étangs de Kipopo, Kasapa, Kasumbalesa, Likasi), alevins achetés par an, prix, origine, saison.
2. **Le prix du poisson** : relevés mensuels sur trois marchés et deux supermarchés, poisson vivant et frais, Clarias et tilapia.
3. **L'aliment** : prix rendu Lubumbashi chez deux fabricants zambiens, droits de douane et délais ; disponibilité de l'aliment de démarrage et de l'artémia.
4. **Les autorisations** : déclaration d'activité aquacole auprès de l'inspection provinciale de la pêche et de l'élevage, règles sur le transport de poisson vivant et la vente d'alevins.
5. **Les géniteurs** : origine sanitaire connue, de préférence d'une écloserie établie.
6. **La compétence** : identifier le technicien aquacole et organiser sa formation pendant le pilote.
