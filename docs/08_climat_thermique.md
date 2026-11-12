# 8. Climat intérieur, thermique et ventilation

## 8.1 Objectifs climatiques

Les consignes par culture et par stade sont dans `donnees/recettes_climat.json`. Pour la conception, on retient les enveloppes suivantes :

| Grandeur | Compartiment fruits | Compartiment feuilles |
|---|---|---|
| Température de jour | 22 à 26 °C, maximum toléré 30 °C | 18 à 24 °C, maximum toléré 28 °C |
| Température de nuit | 15 à 17 °C, minimum toléré 12 °C | 12 à 16 °C, minimum toléré 8 °C |
| Moyenne sur 24 h | 19 à 21 °C | 16 à 20 °C |
| Humidité relative | 60 à 85 %, éviter plus de 90 % plus de 2 h | 60 à 85 % |
| DPV | 0,5 à 1,2 kPa | 0,4 à 1,0 kPa |
| Lumière (DLI) | 20 à 25 mol/m²/j | 14 à 17 mol/m²/j |
| Température de solution | ≤ 25 °C | ≤ 21-22 °C (bassin frais), ≤ 24-26 °C (bassin tempéré) |

Le **DPV** (déficit de pression de vapeur) est l'indicateur central : il traduit la force qui fait transpirer la plante. Trop bas (air saturé), la plante ne transpire plus, n'absorbe plus de calcium et les maladies fongiques se développent. Trop haut (air sec et chaud), elle ferme ses stomates et arrête de pousser. La régulation vise une plage de DPV plutôt qu'une humidité relative fixe.

## 8.2 Lumière

Le rayonnement global extérieur va de 4,9 kWh/m²/j (décembre) à 6,6 (septembre). Avec une transmission de 70 % (film diffusant et structure) et environ 2,1 µmol de lumière utile par joule de rayonnement solaire, la lumière disponible sous serre est de :

- 26 à 35 mol/m²/j sans écran, soit au-dessus des besoins de toutes les cultures ;
- c'est pourquoi un **écran d'ombrage** (50 % d'ombrage, fermé à 70 %) est utilisé aux heures les plus chaudes : la lumière en excès ne fait que chauffer la serre.

Aucun éclairage artificiel n'est nécessaire en production. La chambre de germination de l'annexe est éclairée par LED (spectre blanc horticole, efficacité ≥ 2,7 µmol/J, 150 à 250 µmol/m²/s, 14 à 16 h par jour).

## 8.3 Modèle de simulation

Le modèle (`logiciel/serre_core/simulateur.py`) représente la serre par un nœud thermique (air, végétation, surface du sol) et un nœud d'humidité, au pas d'une minute, et le régulateur réel du projet (`climat.py`) pilote les actionneurs simulés. Les journées types sont générées depuis les normales mensuelles. Ce modèle n'a pas la prétention d'un outil de recherche ; il sert à comparer les options et à tester la régulation. Il devra être recalé avec les mesures du pilote.

Hypothèses principales : couverture U = 4 W/m²K (6,5 en film simple sans écran), surface de paroi 314 m² pour 100 m² au sol, transmission 70 %, capacité thermique effective 60 kJ/m²K, ventilation naturelle maximale 0,012 + 0,004 x vent (m³/s par m² au sol) réduite de 40 % par le filet, extracteurs 0,023 m³/s/m² par étage, efficacité du pad 80 %, stock de 10 m³ et échangeurs de 1 200 W/K, culture adulte transpirant selon une forme simplifiée du modèle de Stanghellini.

## 8.4 Résultats : configuration retenue (tomate en production)

| Mois | T min intérieure | T max intérieure | Heures > 30 °C | Heures < 12 °C | Heures HR > 90 % | DPV moyen de jour | Transpiration (L/j) | Eau du pad (L/j) | Chaleur déstockée la nuit (kWh) |
|---|---|---|---|---|---|---|---|---|---|
| Janvier | 17,9 | 30,2 | 0,3 | 0 | 11,2 | 0,70 | 272 | 72 | 6,5 |
| Février | 17,9 | 30,6 | 0,7 | 0 | 11,0 | 0,74 | 278 | 73 | 6,3 |
| Mars | 17,5 | 29,8 | 0 | 0 | 10,5 | 0,70 | 260 | 84 | 6,4 |
| Avril | 17,4 | 28,1 | 0 | 0 | 7,3 | 0,67 | 258 | 120 | 14,4 |
| Mai | 15,5 | 28,0 | 0 | 0 | 3,1 | 0,72 | 261 | 72 | 30,1 |
| Juin | 13,7 | 28,1 | 0 | 0 | 3,9 | 0,69 | 252 | 19 | 35,0 |
| Juillet | 13,7 | 28,1 | 0 | 0 | 3,9 | 0,77 | 263 | 17 | 36,1 |
| Août | 13,4 | 28,0 | 0 | 0 | 2,4 | 0,99 | 291 | 143 | 15,9 |
| Septembre | 15,4 | 28,1 | 0 | 0 | 1,6 | 1,21 | 323 | 239 | 8,0 |
| Octobre | 17,8 | 29,1 | 0 | 0 | 1,3 | 1,21 | 327 | 276 | 6,1 |
| Novembre | 18,5 | 29,3 | 0 | 0 | 5,7 | 0,86 | 287 | 157 | 5,3 |
| Décembre | 18,2 | 29,9 | 0 | 0 | 10,3 | 0,71 | 269 | 79 | 5,8 |

## 8.5 Comparaison des variantes

| Variante | Janvier T min / T max | Juillet T min / T max | Octobre T min / T max | Heures < 12 °C en juillet | Heures > 30 °C en octobre |
|---|---|---|---|---|---|
| Retenue (écran + stock + pad) | 17,9 / 30,2 | 13,7 / 28,1 | 17,8 / 29,1 | 0 | 0 |
| Sans stockage thermique | 17,9 / 31,5 | 9,8 / 28,1 | 17,8 / 29,7 | 5,2 | 0 |
| Sans écran | 17,5 / 30,2 | 12,6 / 28,2 | 17,4 / 30,1 | 0 | 0,4 |
| Sans mur évaporatif | 17,9 / 31,2 | 13,6 / 28,5 | 17,8 / 34,5 | 0 | 8,2 |
| Serre simple (aucun des trois) | 17,3 / 32,0 | 8,6 / 31,3 | 17,0 / 37,6 | 6,6 | 8,2 |

Lecture :

- Le **stockage thermique** est l'équipement décisif pour l'hiver : +3,9 °C de minimale en juillet et aucune heure sous 12 °C.
- Le **mur évaporatif** est décisif pour octobre : -5,4 °C de maximale et plus aucune heure au-dessus de 30 °C (au-delà de 32 °C, la tomate ne noue plus).
- L'**écran** apporte un gain modeste mais utile dans les deux saisons, et il est indispensable pour ombrer les jeunes plants et les feuilles.
- Le seul problème que la conception ne résout pas complètement est **l'humidité nocturne de saison des pluies** (10 à 11 h par nuit au-dessus de 90 % d'HR de décembre à mars). L'air extérieur la nuit est lui-même saturé ; ventiler ne sèche pas. La parade combine une légère élévation de température par déstockage, le brassage d'air, l'effeuillage, des densités raisonnables et des variétés résistantes. Si les maladies foliaires restent un problème malgré cela, l'étape suivante serait un déshumidificateur à pompe à chaleur (2 à 3 kWh par nuit), à évaluer avec les mesures du pilote.

Le fichier `donnees/simulation_variantes.csv` contient tous les résultats ; la commande `python -m outils.etude_climatique` les recalcule.

## 8.6 Ventilation naturelle

- Ouvrants de toiture (un par versant) et latéraux (murs nord et sud), tous équipés de filets 50 mesh tendus sur cadre.
- Ouverture proportionnelle à l'écart entre la température intérieure et la consigne d'aération (bande de 4 °C).
- Limitations automatiques : 30 % au-delà de 10 m/s de vent, fermeture au-delà de 14 m/s, 20 % par pluie (côté au vent fermé en priorité).
- Ouverture minimale de 10 % quand l'HR dépasse la consigne et que la température le permet.

## 8.7 Refroidissement évaporatif

**Dimensionnement (par compartiment de 50 m²)** :

- Débit d'air nécessaire : 0,04 m³/s par m² au niveau de la mer, majoré de 15 % pour l'altitude de 1 230 m : 0,046 m³/s/m², soit 2,3 m³/s (8 300 m³/h).
- Un extracteur de 1,25 m (50 pouces) à moteur à haut rendement fournit 9 000 à 10 000 m³/h sous 25 Pa pour 0,55 kW : un extracteur par compartiment.
- Pad en cellulose de 100 mm : vitesse frontale recommandée 1,25 m/s, soit 1,8 m² minimum. Le filet anti-insectes posé devant le pad réduit la surface libre de moitié environ : on retient 5 m x 1,5 m = 7,5 m² par compartiment, ce qui garde une vitesse faible et une bonne efficacité.
- Le pad est alimenté par une pompe de 100 W et une gouttière de distribution, avec retour dans un bac de 300 L (appoint automatique, purge périodique pour limiter l'entartrage). L'eau de pluie est réservée en priorité au pad en saison chaude, car elle n'entartre pas.

**Performances** : en octobre, air extérieur à 32,5 °C et 30 % d'HR, l'air sort du pad à environ 22,7 °C et 73 % d'HR (calcul psychrométrique du module `psychro.py`). Consommation d'eau du pad : 140 à 280 L/j de août à novembre, presque rien en juin-juillet.

**Logique de mode** : le régulateur bascule en « mode évaporatif » si la température intérieure dépasse la consigne d'aération de plus de 3 °C, en journée, avec une HR extérieure inférieure à 65 %. Les ouvrants se ferment, le pad s'humidifie, l'extracteur démarre (deux vitesses). Retour en ventilation naturelle si la température repasse sous la consigne d'aération ou si l'air extérieur devient humide (HR > 70 %).

## 8.8 Écran

- Écran tissé aluminisé à bandes, 50 % d'ombrage, environ 45 % d'économie d'énergie la nuit, perméable à la vapeur.
- **Jour** : fermé à 70 % quand le rayonnement extérieur dépasse 650 W/m² et que la serre approche de la consigne d'aération.
- **Nuit** : fermé à 100 % quand la température extérieure est à moins de 5 °C au-dessus de la consigne de chauffage ; entrouvert à 95 % si l'HR intérieure dépasse 92 % (évacuation de l'humidité vers le volume sous toiture).
- Deux sections motorisées indépendantes, une par compartiment.

## 8.9 Stockage thermique

**Principe** : le jour, quand l'air de la serre dépasse la consigne de jour de plus de 3 °C, un aérotherme (batterie eau/air et ventilateur) souffle l'air chaud à travers une batterie où circule l'eau du stock : l'eau se réchauffe, la serre se refroidit un peu. La nuit, quand la serre descend sous la consigne de chauffage, le même aérotherme restitue la chaleur.

**Dimensionnement** :

- Besoin d'une nuit froide de juillet : environ 35 kWh de chaleur (sortie de la simulation).
- 1 m³ d'eau stocke 1,16 kWh par degré : avec une variation de 6 à 8 °C dans la journée, 6 à 10 m³ suffisent.
- La simulation montre que la puissance d'échange limite davantage que le volume : 600 W/K d'échangeur donnent 12,7 °C de minimale en juillet, 1 200 W/K donnent 13,7 °C, quel que soit le volume entre 6 et 15 m³. On retient deux aérothermes (environ 1 200 W/K au total) et 6 m³ (optimisée) à 10 m³ (complète).
- Configuration optimisée : trois cuves noires de 2 m³ dans la serre, qui échangent aussi passivement avec l'air (masse thermique). Configuration complète : cuve béton ou PE enterrée, isolée par 10 cm de polystyrène extrudé, sous l'allée.
- Consommation électrique : 0,3 kW de ventilateurs et 80 W de pompe, soit 1 à 4 kWh/j selon la saison.

**Usage en saison des pluies** : le même stock sert à déshumidifier. Quand l'HR nocturne dépasse la consigne et que le stock est plus chaud de 3 °C que la serre, l'aérotherme élève légèrement la température avec un entrebâillement de 5 % des ouvrants. C'est la méthode la plus économe disponible.

**Secours** : pour les nuits exceptionnelles (minimales extérieures sous 4 °C, plusieurs fois par décennie), un aérotherme électrique de 3 kW est prévu, utilisable uniquement si le réseau SNEL ou le groupe est disponible.

## 8.10 Brassage de l'air

Quatre ventilateurs horizontaux de 45 W (deux par compartiment) créent une circulation en boucle à 0,3-0,5 m/s au niveau des plantes. Ils homogénéisent la température, évitent les poches d'air saturé autour des feuilles la nuit (prévention du botrytis et de la nécrose marginale des laitues) et améliorent l'échange avec les aérothermes. Ils tournent quand l'HR approche de la consigne, quand l'écran est fermé, quand le DPV est trop bas, ou quand le stockage est actif.

## 8.11 Dioxyde de carbone

- L'enrichissement en CO2 n'a d'intérêt que serre fermée. À Lubumbashi, la serre est ventilée la plus grande partie de la journée : le CO2 injecté repartirait dehors.
- La seule fenêtre utile est le début de matinée (serre encore fermée, lumière montante). Gain estimé : 5 à 8 % de rendement en tomate, à condition de disposer d'une source de CO2 bon marché (bouteilles de CO2 alimentaire, éventuellement auprès des brasseries locales).
- **Décision** : pas d'enrichissement en configuration optimisée. En configuration complète, injection par bouteille et électrovanne, uniquement ouvrants fermés (≤ 10 %) et rayonnement > 150 W/m², consigne 600 à 700 ppm. Le capteur de CO2 reste utile dans tous les cas : il signale une serre trop fermée où les plantes ont épuisé le CO2 (sous 350 ppm, la photosynthèse ralentit), et le régulateur ouvre alors un peu.

## 8.12 Stratégie de régulation résumée

Ordre de priorité (code : `logiciel/serre_core/climat.py`) :

1. Sécurité de la structure (vent, pluie).
2. Température : déstockage si trop froid, aération proportionnelle si trop chaud, bascule évaporative si très chaud et sec.
3. Humidité et DPV : aération minimale, déstockage de déshumidification, brassage, entrebâillement d'écran.
4. Écran : ombrage de jour, isolation de nuit.
5. CO2 seulement serre fermée.
6. Économie d'énergie par intégration de température : la consigne de nuit baisse jusqu'à 1,5 °C si la moyenne des dernières 24 h est déjà au-dessus de la cible.

Chaque décision du régulateur est accompagnée d'une raison en clair (« pluie : ouvrants limités », « chauffage par déstockage »), affichée dans l'interface. Le technicien sait toujours pourquoi un moteur bouge.
