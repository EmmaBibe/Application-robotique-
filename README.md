# Serre agricole autonome en environnement contrôlé, Lubumbashi

Étude de faisabilité complète d'une serre pilote de 10 m x 10 m pour la production de légumes frais toute l'année à Lubumbashi (Haut-Katanga, RDC), et de son passage à une ferme de 1 000 m².

Le dossier couvre l'agronomie, l'architecture et le génie civil, la thermique, l'hydraulique, l'électricité et l'énergie solaire, l'électronique et l'IIoT, le logiciel de supervision, l'économie, la comptabilité, l'exploitation et les risques. Les calculs sont reproductibles : le modèle thermique, le dimensionnement énergétique, les solutions nutritives et le modèle financier sont fournis sous forme de code et de tableur.

## Par où commencer

1. **`docs/00_synthese_decisionnelle.md`** : la réponse à la question « faut-il se lancer ? », en cinq pages.
2. **`Etude_faisabilite_serre_Lubumbashi.docx`** : le dossier complet en un seul document, imprimable.
3. **`finance/modele_financier_serre_lubumbashi.xlsx`** : le modèle financier, à mettre à jour avec vos propres prix et rendements.
4. **`simulateurs/index.html`** : les simulateurs (s'ouvrent d'un double-clic, sans internet) : maquette 3D vivante de toute la serre, simulateur des systèmes (schémas animés : qui fait quoi, quand, sous quelles conditions, avec pannes provocables), carte électronique en 3D.
5. **`plans/Dossier_plans_et_schemas.pdf`** : 16 planches A3 (génie civil, P&ID, unifilaire, commande, câblage, réseau, logique, listes d'E/S et de câbles).
6. **`electronique/Dossier_carte_CAZ-1.pdf`** : la carte automate de zone (schéma KiCad, circuit imprimé routé, nomenclature, Gerbers de fabrication dans `electronique/caz1/fabrication/`).
7. **`logiciel/dashboard/index.html`** : le démonstrateur de l'interface de supervision.

## En bref

- **Concept** : serre semi-fermée éclairée par le soleil, culture entièrement hors-sol (le sol de Lubumbashi est massivement contaminé au cuivre et au cobalt), deux compartiments indépendants (fruits sur substrat, feuilles sur radeaux flottants), refroidissement évaporatif en saison chaude, chaleur du jour stockée dans l'eau pour les nuits froides, énergie solaire avec batteries et délestage par priorités, supervision locale qui fonctionne sans internet.
- **Climat simulé dans la serre** : entre 13,4 et 30,6 °C toute l'année, sans chauffage fossile (contre 8,6 à 37,6 °C pour une serre simple).
- **Consommation électrique** : environ 21 kWh/jour, 7 700 kWh/an.
- **Investissement** : 55 220 $ pour le pilote et les infrastructures communes ; 114 730 $ pour l'extension à 1 000 m².
- **Rentabilité** : le pilote seul est un outil d'apprentissage, pas une affaire. La ferme de 1 000 m² est rentable si les rendements et les prix mesurés pendant le pilote dépassent d'environ 10 à 20 % les hypothèses médianes. Les seuils de décision sont fixés à l'avance.
- **Risque maximal accepté** : environ 43 000 $ si l'on arrête après deux ans de pilote.

## Contenu du dépôt

```
docs/                          Dossier d'étude (17 documents) et plans
  00_synthese_decisionnelle.md
  01_contexte_lubumbashi.md     climat, énergie, eau, sols, ravageurs, marché, cadre légal
  02_choix_conception.md        registre des décisions et matrices de choix
  03_strategie_cultures.md      évaluation plante par plante, surfaces, calendriers
  04_fiches_cultures.md         14 fiches techniques de culture
  05_nutrition_fertirrigation.md
  06_biosecurite_protection.md
  07_architecture_genie_civil.md
  08_climat_thermique.md        résultats de simulation et dimensionnement
  09_eau_hydraulique.md
  10_electricite_energie.md
  11_electronique_iiot.md
  12_logiciel_supervision.md
  13_economie_finance.md
  14_exploitation_procedures.md
  15_registre_risques.md
  16_feuille_de_route.md        phases et critères de décision
  17_sources.md
  18_simulateurs_et_carte_electronique.md
  annexes/                      plan de masse, plan de la serre, coupe, synoptique, unifilaire, hydraulique (SVG et PNG)
donnees/                       Données et paramètres (CSV, JSON)
  climat_lubumbashi_mensuel.csv
  recettes_climat.json          consignes par culture et par stade, lues par le logiciel
  simulation_climat_mensuelle.csv, simulation_variantes.csv
  bilan_puissance.csv, bilan_energie_mensuel.csv
  liste_capteurs_actionneurs.csv
  calendrier_production.csv     planning hebdomadaire des semis, repiquages et récoltes
  registre_risques.csv
  enquete_prix_modele.csv       grille d'enquête de marché
simulateurs/                   Maquette 3D, simulateur des systèmes, carte en 3D, moteurs de simulation
plans/                         Générateur et dossier PDF des 16 planches A3
electronique/caz1/             Carte CAZ-1 : conception.py (source unique), schéma et PCB KiCad, fabrication
electronique/outils/           Routeur de pistes et utilitaires KiCad
documents/                     Mise en page des PDF (WeasyPrint) et figures
finance/
  modele_financier_serre_lubumbashi.xlsx
  generer_modele.py
logiciel/                      Code de supervision et de régulation
  serre_core/                   psychrométrie, recettes, régulation climatique, fertirrigation, énergie, alarmes, simulateur
  tests/                        tests automatiques
  outils/                       étude climatique, dimensionnement énergétique, calcul des solutions nutritives
  edge/                         déploiement Docker (MQTT, InfluxDB, Telegraf, Grafana, régulation, interface)
  firmware/noeud_zone/          micrologiciel des automates de zone (ESP32, PlatformIO)
  dashboard/                    démonstrateur de l'interface de supervision
```

## Reproduire les calculs

Python 3.10 ou plus récent.

```
cd logiciel
pip install pytest openpyxl
python -m pytest                          # tests du noyau de régulation
python -m outils.etude_climatique         # simulation des 12 mois et des variantes
python -m outils.dimensionnement_energie  # bilan électrique, solaire et batteries
python -m outils.calcul_solution --hco3 3 --ca 1.2 --mg 0.6   # solutions nutritives selon l'analyse d'eau
cd ..
python finance/generer_modele.py          # régénère le classeur financier
```

## Limites connues

- Les prix de vente et les volumes de marché sont des estimations : l'enquête de la phase 0 doit les confirmer avant tout engagement.
- Le modèle thermique est un modèle simplifié à un nœud. Il sert à comparer des options ; il sera recalé avec les mesures du pilote.
- Les coûts d'investissement sont des estimations rendues Lubumbashi ; trois devis par lot sont prévus avant commande.
- Le micrologiciel des automates est à compiler et à tester sur banc, avec les capteurs réellement achetés (les registres Modbus varient d'un fabricant à l'autre), avant installation.
