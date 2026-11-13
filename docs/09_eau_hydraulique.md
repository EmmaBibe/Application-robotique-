# 9. Eau et hydraulique

Schéma de principe en annexe : `annexes/schema_hydraulique.svg`.

## 9.1 Besoins en eau

D'après la simulation (document 08) et les estimations de nettoyage :

| Poste | Moyenne | Pointe (octobre) | Annuel |
|---|---|---|---|
| Transpiration des cultures (100 m²) | 280 L/j | 330 L/j | ≈ 100 m³ |
| Mur évaporatif | 115 L/j | 280 L/j | ≈ 40 m³ |
| Renouvellements de solution, purges, nettoyage, sas | 40 L/j | 60 L/j | ≈ 15 m³ |
| **Total** | **≈ 435 L/j** | **≈ 670 L/j** | **≈ 155 m³** |

Rapporté à la production, cela donne environ 40 à 50 L par kilo de tomate (au rendement médian de 25 kg/m²) et 10 à 20 L par kilo de légume-feuille, contre plus de 100 L/kg pour une tomate de plein champ irriguée sous ce climat (pertes par évaporation du sol, percolation, rendements plus faibles). L'hors-sol recyclé divise la consommation par deux à quatre, et l'écart grandit avec le rendement.

## 9.2 Ressources

**Eau de pluie** : toiture de 100 m² en projection, pluviométrie d'environ 1 180 mm/an, coefficient de collecte 0,85 : environ 100 m³/an, presque entièrement de novembre à mars. Avec une citerne de 10 m³, on en valorise une partie seulement, parce que la saison des pluies remplit la citerne plus vite qu'on ne la vide. Estimation : 35 à 45 % des besoins annuels couverts par la pluie (10 m³), 45 à 55 % avec 20 m³.

**Eau de forage ou de réseau** : complément indispensable de mai à octobre. Un forage dédié coûte de 3 000 à 6 000 $ selon la profondeur ; il est prévu en configuration complète et pour l'extension. En configuration optimisée, on part du réseau REGIDESO ou d'un forage existant sur la parcelle, avec une réserve tampon.

Faut-il une citerne plus grande pour se passer du forage ? Il faudrait stocker environ 80 m³ pour traverser la saison sèche, soit 8 000 à 12 000 $ de citerne en ferrociment. Ce n'est pas justifié au pilote ; c'est envisageable pour l'extension, dont la toiture de 1 000 m² collecte 1 000 m³ par an.

## 9.3 Traitement de l'eau d'appoint

Il dépend de l'analyse (document 05, §5.5). Chaîne complète prévue :

1. Eau de pluie : filtre à feuilles, premier flot rejeté, citerne opaque fermée (pas de lumière : pas d'algues ; moustiquaire sur les évents).
2. Eau de forage : préfiltre à sédiments 50 µm, filtre à charbon actif, puis osmoseur 100 L/h si l'analyse l'exige (métaux, sodium, bore, dureté excessive).
3. Cuve tampon d'eau traitée de 1 m³ dans le local technique, avec sonde de niveau, qui alimente les deux circuits de fertirrigation et le pad.

## 9.4 Circuit fruits (goutte-à-goutte sur seaux hollandais)

- **Cuve de solution** de 500 L, couverte et opaque, avec sondes CE, pH et température.
- **Dosage** : trois pompes péristaltiques (A, B, acide) commandées par l'automate, avec mélange par recirculation dans la cuve. Les pompes péristaltiques ont été préférées aux injecteurs proportionnels hydrauliques (type Dosatron) parce qu'elles permettent des doses précises pilotées par la mesure et qu'elles sont réparables avec un simple tuyau de rechange.
- **Pompe d'irrigation** : 0,37 kW, 2 m³/h sous 2,5 bar, filtre à disques 120 mesh en sortie.
- **Réseau** : rampe principale PE 32 mm dans l'allée, rampes secondaires PE 16 mm le long des rangs, goutteurs autorégulants anti-vidange de 2 L/h, un goutteur par plant (deux pour les seaux à deux plants), piquets de distribution dans le substrat.
- **Contrôle d'arrosage** : un piquet témoin sur une balance de drainage. Le volume drainé est mesuré par un auget basculeur sur la gouttière témoin (complète : balance qui pèse un groupe de 6 seaux, pour suivre l'absorption en continu).
- **Retour** : les gouttières de drainage ramènent l'eau vers un collecteur dans l'allée, puis vers une cuve de drainage de 200 L. Une pompe de reprise envoie le drainage à travers un filtre de 50 µm et un stérilisateur UV-C (débit de 1 m³/h pour une dose de 250 mJ/cm² au moins en fin de vie de lampe) vers la cuve de solution.
- **Autonomie en cas de panne de pompe** : le fond du seau hollandais garde environ 1 L de réserve ; la perlite humide tient 2 à 4 h par forte chaleur. L'alarme « pas d'irrigation depuis X minutes en journée » prévient le technicien.

## 9.5 Circuit feuilles (radeaux flottants)

- **Deux bassins** indépendants, 4,0 x 4,2 m, 25 cm d'eau, environ 4,2 m³ chacun. Construction : cadre en blocs de ciment ou en panneaux, liner EPDM ou PE alimentaire de 1 mm, isolation latérale en polystyrène extrudé, bassins semi-enterrés de 20 cm pour la stabilité thermique.
- **Radeaux** en polystyrène extrudé haute densité de 30 à 40 mm, de qualité alimentaire, percés selon la densité de la culture, blancs sur la face supérieure.
- **Aération** : un surpresseur (80 W) alimente des diffuseurs poreux au fond de chaque bassin (un diffuseur par 1,5 m² environ). Objectif : oxygène dissous ≥ 6 mg/L. Le surpresseur est une charge de priorité 0 sur l'énergie : il n'est jamais délesté. Un second surpresseur de secours, en courant continu 24 V, se met en route automatiquement si le premier s'arrête.
- **Circulation et désinfection** : une petite pompe fait circuler l'eau de chaque bassin à travers un filtre et un UV-C quelques heures par jour, et homogénéise la température et la concentration.
- **Dosage** : une station par bassin (A, B, acide) ou une station partagée avec des vannes, mais **jamais de mélange des eaux** des deux bassins.
- **Refroidissement** : un refroidisseur à eau (pompe à chaleur de 500 W) sur le bassin frais, en marche de jour sur le solaire en saison chaude, avec consigne à 20 °C. Le bassin tempéré n'en a pas besoin.
- **Autonomie** : en cas de coupure totale (énergie et secours), les radeaux tiennent plusieurs heures sans aération, quelques jours avec le surpresseur de secours sur batterie. C'est la raison principale du choix des radeaux plutôt que du NFT.

## 9.6 Pad

Circuit indépendant : bac de 300 L, pompe de 100 W, gouttière de distribution, alimentation prioritaire en eau de pluie. Purge de 10 % du bac chaque semaine pour limiter l'entartrage. Ce circuit n'est jamais relié aux circuits de culture.

## 9.7 Matériaux et bonnes pratiques

- Tous les tuyaux et cuves en contact avec la solution : opaques (noir ou blanc sur noir), qualité alimentaire.
- Pas de cuivre ni de laiton dans les circuits de solution (le cuivre est toxique pour les racines au-delà de quelques dizaines de µg/L, et la région en est déjà chargée).
- Vannes manuelles d'isolement sur chaque branche, purge en point bas, clapets anti-retour avant chaque injection.
- Bac de rétention sous les cuves d'acide, rinçage des yeux à proximité.
- Étiquetage de chaque tuyau (couleur et sens d'écoulement) : fruits en rouge, feuilles en vert, eau traitée en bleu, drainage en marron.

## 9.8 Liste des équipements hydrauliques (pilote, configuration optimisée)

| Équipement | Quantité | Caractéristiques |
|---|---|---|
| Citerne d'eau de pluie | 1 | 10 m³, PE opaque ou ferrociment |
| Cuve tampon d'eau traitée | 1 | 1 m³ |
| Filtres eau d'appoint | 1 jeu | Sédiments 50 µm + charbon actif |
| Cuves de solution mère | 6 | 100 L (A, B, acide pour chaque circuit) |
| Pompes doseuses péristaltiques | 6 | 0 à 10 L/h, commande par impulsion 24 V |
| Cuve de solution fruits | 1 | 500 L |
| Pompe d'irrigation | 1 | 0,37 kW, 2 m³/h, 2,5 bar |
| Filtre à disques | 1 | 120 mesh |
| Goutteurs autorégulants anti-vidange | ≈ 150 | 2 L/h |
| Seaux hollandais | ≈ 110 | 10 L, avec siphon |
| Perlite | ≈ 1,2 m³ | Calibre 2-5 mm |
| Cuve de drainage + pompe de reprise | 1 | 200 L, 0,12 kW |
| Stérilisateurs UV-C | 2 | 1 m³/h, ≥ 250 mJ/cm² |
| Bassins à radeaux | 2 | 16,8 m², liner EPDM |
| Radeaux | ≈ 25 | 1,2 x 1,0 m environ, XPS 35 mm |
| Surpresseur + secours 24 V | 1 + 1 | 80 W |
| Refroidisseur de solution | 1 | 500 W (option la première année si budget serré) |
| Pompe et bac du pad | 1 | 100 W, 300 L |
| Débitmètres à impulsions | 3 | Eau d'appoint, irrigation fruits, appoint bassins |
| Capteurs de niveau | 5 | Citerne, cuve tampon, cuve de solution, cuve de drainage, bac du pad |

## 9.8 Eau de l'unité aquacole (tranches 2 et 3)

- **Volume** : 32 m³ de bacs en tranche 2, 64 m³ en tranche 3, remplis à l'eau de pluie traitée ou au forage (jamais d'eau de surface).
- **Renouvellement** : 5 % du volume par jour (1,6 puis 3,2 m³/j), prélevés dans le bassin de reprise après le biofiltre, filtrés à 50 µm, désinfectés aux UV, puis envoyés au bassin tampon de 2 m³ qui alimente les radeaux et la cuve des fruits. Cette eau couvre 55 à 60 % des besoins en eau des cultures en saison sèche : l'élevage ne consomme presque pas d'eau en plus de la serre.
- **Qualité visée dans les bacs** : oxygène > 5 mg/L, température 26-28 °C (28-29 °C en écloserie), pH 7,0-7,5, ammoniaque non ionisée < 0,05 mg/L, nitrite < 1 mg/L, nitrate 50 à 150 mg/L d'azote.
- **Boues** : 3,6 puis 7,2 kg de matière sèche par jour, purgées du décanteur vers un minéralisateur aéré (10 à 15 jours), dont le surnageant rejoint le bassin tampon ; le résidu est composté.
- **Aucun rejet liquide** dans le milieu : toute l'eau sortant des bacs est absorbée par les cultures.
- P&ID : planche H04 du dossier de plans.
