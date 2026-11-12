# 10. Électricité et énergie

Schéma unifilaire en annexe : `annexes/schema_unifilaire.svg`. Calculs reproductibles : `python -m outils.dimensionnement_energie` (dossier `logiciel/`), résultats dans `donnees/bilan_puissance.csv` et `donnees/bilan_energie_mensuel.csv`.

## 10.1 Principe

1. Le solaire est la source principale.
2. Les batteries LiFePO4 assurent la nuit et les journées couvertes.
3. Le réseau SNEL recharge les batteries quand il est présent, sans jamais être indispensable.
4. Un groupe électrogène démarre automatiquement en dernier recours (batterie sous 15 %, pas de réseau, pas de soleil).
5. Les charges sont classées par priorité ; l'automate déleste les moins vitales quand l'état de charge baisse (code : `logiciel/serre_core/energie.py`).

## 10.2 Bilan des charges

| Charge | Puissance | Heures/jour | kWh/jour | Priorité |
|---|---|---|---|---|
| Automates, capteurs, serveur, routeur 4G, caméras | 60 W | 24 | 1,44 | 0 (jamais délestée) |
| Surpresseur d'aération des bassins | 80 W | 24 | 1,92 | 0 |
| Pompe d'irrigation fruits | 370 W | 1,5 | 0,56 | 1 |
| Recirculation drainage + UV fruits | 160 W | 6 | 0,96 | 1 |
| Filtration + UV bassins | 150 W | 6 | 0,90 | 1 |
| Ventilateurs de brassage | 180 W | 12 | 2,16 | 1 |
| Moteurs d'ouvrants et d'écran | 250 W | 0,8 | 0,20 | 1 |
| Aérothermes et pompe du stockage thermique | 380 W | saisonnier | 1,0 à 4,1 | 1 |
| Chambre froide (moyenne) | 900 W | 3 | 2,70 | 2 |
| Extracteurs + pompe du pad | 1 200 W | saisonnier | 0,4 à 5,9 | 2 |
| Refroidisseur de solution | 500 W | 3 (saison chaude) | 1,50 | 2 |
| LED de germination | 200 W | 14 | 2,80 | 3 |
| Osmoseur et transfert | 400 W | 1 | 0,40 | 3 |
| Éclairage, prises, divers | 150 W | 3 | 0,45 | 3 |

Puissance appelée maximale simultanée : environ 3,5 kW (extracteurs, pompe d'irrigation, chambre froide et refroidisseur en même temps un après-midi d'octobre). Pointes de démarrage des moteurs : 2 à 3 fois la puissance nominale pendant quelques dixièmes de seconde, d'où un onduleur de 5 kW minimum (8 kW en configuration complète).

## 10.3 Consommation mois par mois (configuration complète)

| Mois | Total kWh/j | Dont la nuit | Irradiation sur le plan des panneaux (kWh/m²/j) | Puissance crête nécessaire (kWc) |
|---|---|---|---|---|
| Janvier | 20,7 | 6,7 | 5,20 | 5,30 |
| Février | 20,6 | 6,7 | 5,30 | 5,18 |
| Mars | 20,9 | 6,7 | 5,51 | 5,06 |
| Avril | 21,1 | 7,4 | 5,82 | 4,82 |
| Mai | 21,4 | 9,3 | 5,82 | 4,91 |
| Juin | 20,1 | 9,5 | 5,62 | 4,78 |
| Juillet | 20,2 | 9,5 | 5,93 | 4,54 |
| Août | 20,6 | 7,9 | 6,55 | 4,19 |
| Septembre | 21,8 | 6,7 | 6,86 | 4,24 |
| Octobre | 22,9 | 6,5 | 6,66 | 4,58 |
| Novembre | 22,5 | 6,5 | 5,62 | 5,33 |
| Décembre | 20,8 | 6,6 | 5,10 | 5,43 |

Consommation annuelle : environ 7 700 kWh. Mois dimensionnant : décembre (moins de soleil, saison des pluies), 5,4 kWc nets.

Remarque : la consommation est remarquablement stable sur l'année, parce que les postes saisonniers se relaient (extracteurs en saison chaude, stockage thermique en saison fraîche). C'est un bon signe pour un système solaire.

## 10.4 Dimensionnement

**Configuration complète**

- Champ photovoltaïque : 5,43 kWc nets + 15 % de marge (vieillissement, poussière de saison sèche) : **12 modules de 550 Wc = 6,6 kWc**, ratio de performance 0,75, inclinaison 12° plein nord.
- Batterie : nuit la plus chargée (9,5 kWh) + une journée complète de charges vitales sans soleil (8,1 kWh) = 17,7 kWh utiles, soit 19,6 kWh bruts à 90 % de profondeur de décharge : **4 modules LiFePO4 de 5,12 kWh (48 V) = 20,5 kWh**.
- Onduleur hybride : 8 kW, entrée réseau et entrée groupe, deux trackers MPPT.
- Groupe de secours : 5 kVA essence ou diesel, démarrage automatique par contact sec de l'onduleur.

**Configuration optimisée (retenue pour le budget)**

- **6 modules de 550 Wc = 3,3 kWc**, **2 modules de 5,12 kWh = 10,2 kWh**, onduleur hybride 5 kW.
- Ce système couvre la totalité des charges vitales (priorités 0 et 1) jour et nuit, et environ 70 % de la consommation totale. Le complément vient du réseau SNEL quand il est présent (recharge prioritaire des batteries) et d'un groupe existant ou loué.
- Extension facile : l'onduleur et la structure de toiture acceptent le doublement du champ et des batteries.

## 10.5 Délestage

| État de charge (SOC) | Charges autorisées |
|---|---|
| Réseau présent | Toutes ; recharge des batteries si SOC < 60 % |
| SOC ≥ 55 % | Toutes |
| 35 % ≤ SOC < 55 % | Priorités 0, 1, 2 (LED de germination et osmoseur reportés) |
| 20 % ≤ SOC < 35 % | Priorités 0 et 1 (chambre froide, extracteurs, refroidisseur coupés) |
| SOC < 20 % | Priorité 0 seulement |
| SOC < 15 %, pas de réseau, pas de soleil | Démarrage du groupe |

Quand le soleil fournit plus de 3 kW, les seuils sont relâchés de 15 points : on profite de la production pour faire tourner les charges reportées. La chambre froide est pilotée pour descendre à 2 °C en milieu de journée (stockage de froid dans les produits et les parois) et peut ainsi rester coupée plusieurs heures la nuit sans dépasser 6 °C.

## 10.6 Distribution et protections

- **Côté continu** : boîtier de raccordement avec fusibles par chaîne, interrupteur-sectionneur DC, parafoudre DC type 2 ; câbles solaires 6 mm² double isolation ; liaison batterie en 35 à 50 mm² avec fusible de tête et sectionneur.
- **Côté alternatif** : tableau général basse tension dans le local technique, disjoncteur général, différentiel 30 mA sur tous les circuits (milieu humide), parafoudre AC type 1+2 en tête, départs séparés par priorité (contacteurs commandés par l'automate pour le délestage).
- **Circuits en serre** : indice de protection IP65 minimum pour tout équipement en serre (humidité, brumisation, nettoyage au jet), câbles sous gaine, boîtes de dérivation étanches en hauteur, aucune prise au sol.
- **Commande en 24 V continu** pour les automates, capteurs et électrovannes : sûr pour le personnel en milieu humide, alimenté par une alimentation secourue.
- **Surpresseur de secours 24 V** branché directement sur l'alimentation secourue.

## 10.7 Terre et foudre

La région du Katanga est parmi les plus foudroyées d'Afrique. Une serre métallique isolée sur un terrain dégagé est exposée.

- Prise de terre en boucle (câble cuivre nu de 35 mm² en fond de fouille autour de la serre et de l'annexe) complétée par des piquets, résistance visée inférieure à 10 Ω, mesurée à la réception.
- Liaison équipotentielle de la structure de la serre, de la structure des panneaux, des cuves métalliques et des armoires.
- Paratonnerre à tige simple sur un mât dominant la serre et l'annexe (étude par un installateur qualifié), descentes séparées du réseau électrique.
- Parafoudres en tête sur l'arrivée SNEL, sur le DC solaire, sur la ligne RS485 vers la station météo extérieure et sur l'Ethernet.
- Station météo et antennes 4G reliées à la terre.

## 10.8 Choix des équipements

- **Modules** : monocristallins de 540 à 560 Wc, de marque reconnue (fiche technique et garantie de 25 ans en production), cadre aluminium, verre trempé 3,2 mm.
- **Onduleur hybride** : marque ayant un distributeur et un service après-vente à Lubumbashi, communication Modbus ou RS485 avec l'automate (lecture du SOC, des puissances, de l'état réseau), fonction de démarrage automatique du groupe.
- **Batteries** : LiFePO4 48 V en modules de 5 kWh environ, BMS communicant (CAN ou RS485) avec l'onduleur, garantie de 6 000 cycles à 80 % de profondeur de décharge, installées dans le local technique entre 15 et 30 °C.
- Trois devis d'installateurs locaux, avec visite du site, schéma et note de calcul.

## 10.9 Coût du kWh

Configuration complète : environ 14 500 $ pour l'ensemble énergie, avec un remplacement des batteries vers la 10e année et de l'onduleur vers la 10e-12e année. Sur 20 ans, le coût du kWh produit et stocké ressort entre 0,15 et 0,20 $/kWh, soit l'ordre du tarif SNEL, mais disponible à 100 %, et trois fois moins cher que le groupe électrogène.
