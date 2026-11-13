# 11. Électronique, automates et IIoT

Synoptique en annexe : `annexes/synoptique_iiot.svg`. Liste complète des capteurs et actionneurs, avec quantités et prix indicatifs : `donnees/liste_capteurs_actionneurs.csv`. Micrologiciel des automates de zone : `logiciel/firmware/noeud_zone/`.

## 11.1 Exigences

1. **La serre survit sans le serveur et sans internet.** Chaque automate de zone applique seul les sécurités et une régulation de repli.
2. **Des capteurs fiables, comparés à une référence.** Un capteur faux est pire que pas de capteur, parce qu'il pilote les actionneurs dans la mauvaise direction. Chaque grandeur critique a un contrôle croisé (instrument de poche, second capteur, cohérence physique).
3. **Réparable sur place.** Composants standard, protocoles ouverts, pièces de rechange en stock, documentation en français.
4. **Mesurer pour comprendre**, pas seulement pour piloter : les données alimentent le suivi agronomique et les essais.

## 11.2 Architecture en trois niveaux

**Niveau terrain** : capteurs et actionneurs.

- Capteurs industriels sur bus RS485 en Modbus RTU (température, HR, CO2, rayonnement, CE, pH, oxygène, niveaux, énergie). Un bus par zone, câble blindé à paires torsadées, résistances de fin de ligne, alimentation 24 V.
- Entrées tout-ou-rien (contacts de porte, fins de course, détecteurs de fuite), entrées 4-20 mA (niveaux), impulsions (débitmètres, auget de drainage).
- Sorties relais et contacteurs pour les moteurs, impulsions pour les pompes doseuses.

**Niveau zone** : trois automates identiques, chacun construit sur la carte **CAZ-1** conçue pour le projet (ESP32, Ethernet, RS485, 8 entrées isolées, 6 relais, 2 entrées 4-20 mA ; schéma, circuit imprimé et dossier de fabrication au chapitre 18 et dans `electronique/caz1/`), complétée d'un module 16 relais Modbus pour les sorties non critiques. À défaut de cartes fabriquées, un automate ESP32 industriel du commerce (rail DIN, 24 V, RS485, Ethernet) remplit les mêmes fonctions avec le même micrologiciel.

| Automate | Zone | Fonctions |
|---|---|---|
| AUT-F | Compartiment fruits | Climat fruits (ouvrants, écran, pad, extracteur, brassage, stockage thermique), irrigation, dosage du circuit fruits |
| AUT-L | Compartiment feuilles + pépinière | Climat feuilles, aération et dosage des bassins, refroidisseur de solution, LED et chauffage de germination |
| AUT-E | Local technique | Eau (citerne, filtration, osmoseur, cuve tampon), énergie (lecture onduleur et BMS, délestage, démarrage du groupe), sas, détecteurs de fuite, station météo |

Chaque automate lit ses capteurs toutes les 5 secondes, publie les mesures toutes les 30 secondes (et immédiatement en cas de changement brutal), reçoit les consignes du serveur, et **passe en mode autonome** s'il ne reçoit plus de consigne pendant 2 minutes : régulation simple de repli (aération par seuils, fermeture en cas de vent ou de pluie, aération des bassins maintenue, irrigation sur minuterie de sécurité), et alarme locale (voyant et sirène).

**Niveau supervision** : un serveur local (mini-PC industriel sans ventilateur, ou Raspberry Pi 5 avec SSD, sur alimentation secourue) qui héberge :

- le courtier MQTT (Mosquitto) ;
- le service de régulation qui calcule les consignes à partir des recettes, de la météo et des mesures (code `logiciel/serre_core/`) ;
- la base de séries temporelles (InfluxDB) ;
- l'interface de supervision et les tableaux d'analyse (Grafana) ;
- l'envoi des alertes (SMS par le routeur 4G, messagerie quand internet est disponible) ;
- la synchronisation différée vers un serveur distant (sauvegarde, accès à distance).

## 11.3 Réseau

- Ethernet filaire entre les armoires et le serveur, commutateur PoE industriel qui alimente aussi les caméras.
- Routeur 4G industriel double SIM (deux opérateurs) avec bascule automatique.
- Point d'accès Wi-Fi étanche pour les tablettes et téléphones de l'équipe.
- Parafoudres sur toutes les lignes qui sortent des bâtiments (station météo, caméra extérieure).
- **Cybersécurité** : réseau de la serre séparé, aucun port ouvert depuis internet, accès à distance uniquement par tunnel chiffré (VPN de type WireGuard) initié depuis le site, comptes nominatifs avec mot de passe fort, MQTT avec authentification et listes d'accès par automate, mises à jour planifiées et sauvegarde quotidienne de la configuration et des données.

## 11.4 Plan des sujets MQTT

Organisation inspirée de la norme ISA-95 (site / zone / équipement / grandeur), en JSON :

```
serre/lub1/fruits/mesure/air        {"t": 24.1, "hr": 71, "co2": 455, "ts": 1731400000}
serre/lub1/fruits/mesure/solution   {"ec": 2.9, "ph": 5.9, "t": 22.4}
serre/lub1/fruits/etat/actionneurs  {"ouvrant": 35, "ecran": 0, "pad": false, "extracteur": 0, "brassage": true, "stockage": "arret"}
serre/lub1/fruits/consigne          {"ouvrant": 40, "ecran": 0, ..., "raisons": ["..."], "validite_s": 120}
serre/lub1/feuilles/mesure/bassin1  {"ec": 1.8, "ph": 6.0, "t": 20.6, "o2": 7.4}
serre/lub1/eau/mesure/niveaux       {"citerne": 64, "tampon": 80, "cuve_fruits": 55}
serre/lub1/energie/mesure           {"soc": 78, "pv_w": 2450, "charge_w": 980, "reseau": false}
serre/lub1/meteo/mesure             {"t": 29.0, "hr": 38, "ray": 820, "vent": 3.1, "pluie": false}
serre/lub1/+/alarme                 {"code": "O2_BAS", "niveau": "critique", "message": "...", "etat": "leve"}
serre/lub1/+/disponibilite          "en_ligne" / "hors_ligne" (message de dernière volonté MQTT)
```

Les consignes portent une durée de validité : l'automate qui reçoit une consigne périmée l'ignore et reste en mode autonome.

## 11.5 Capteurs : choix et points de vigilance

| Grandeur | Choix | Vigilance |
|---|---|---|
| Température et HR de l'air | Capteur capacitif industriel sous **abri ventilé**, au milieu de la culture, à hauteur des têtes | Un capteur au soleil sans abri ventilé surestime de 3 à 5 °C ; le capteur d'HR dérive : contrôle mensuel avec un psychromètre |
| CO2 | NDIR à double faisceau ou à auto-étalonnage désactivé | L'auto-étalonnage « fond de 400 ppm » des capteurs bon marché est faux dans une serre (le CO2 descend sous 400 ppm en journée) |
| Rayonnement | Pyranomètre extérieur (déclenchement de l'irrigation, gestion de l'écran) ; capteur PAR intérieur (DLI réellement reçu) | Nettoyage hebdomadaire du dôme (poussière de saison sèche) |
| CE | Sonde à 4 électrodes compensée en température | Contrôle hebdomadaire, solution étalon 1,41 mS/cm |
| pH | Électrode industrielle à gel, montée en dérivation | Étalonnage toutes les 2 semaines (tampons 4 et 7), remplacement tous les 12 à 18 mois, ne jamais laisser sécher |
| Oxygène dissous | Sonde optique luminescente | Plus chère qu'une sonde galvanique, mais sans membrane ni électrolyte à changer |
| Température de feuille | Thermomètre infrarouge visant le couvert (configuration complète) | Donne le DPV feuille et le risque de condensation |
| Substrat | Capteur FDR ou TDR d'humidité et de CE dans un seau témoin | Ne remplace pas la balance de drainage |
| Drainage | Auget basculeur (optimisée) ou pesée continue d'un groupe de seaux (complète) | Indicateur roi de l'irrigation |
| Énergie | Lecture de l'onduleur et du BMS + compteurs Modbus par départ | Permet de connaître le coût énergétique de chaque fonction |

## 11.6 Robustesse

- Armoires IP65 en hauteur, presse-étoupes, déshydratant, ventilation filtrée pour l'armoire du local technique.
- Alimentation 24 V secourue (batterie tampon) indépendante de l'onduleur principal : en cas d'arrêt de l'onduleur, les automates, le routeur et le surpresseur de secours restent alimentés plusieurs heures.
- Chien de garde matériel sur chaque automate (redémarrage en cas de blocage), et surveillance croisée : le serveur signale un automate muet, l'automate signale un serveur muet.
- Stock de rechange sur site : un automate de zone préprogrammé, une sonde pH, une sonde CE, une alimentation 24 V, un capteur T/HR, des relais, des fusibles, une lampe UV, un jeu de tuyaux de pompe doseuse.

## 11.7 Étalonnage et maintenance

| Fréquence | Opération |
|---|---|
| Hebdomadaire | Contrôle croisé CE et pH au portable ; nettoyage des dômes des capteurs de rayonnement ; vérification des pièges et caméras |
| Bimensuelle | Étalonnage pH |
| Mensuelle | Étalonnage CE ; contrôle T/HR au psychromètre de référence ; test des fins de course des ouvrants ; test de bascule du surpresseur de secours |
| Trimestrielle | Test de coupure totale (simulation de panne réseau, onduleur, serveur) et vérification du mode autonome ; contrôle des serrages électriques |
| Annuelle | Remplacement des lampes UV ; vérification du CO2 avec une bouteille étalon ; mesure de la prise de terre ; remplacement préventif des électrodes pH |

Chaque étalonnage est saisi dans la supervision : la date, la valeur avant et après, la personne. Le tableau de bord signale les capteurs « en retard d'étalonnage ».

## 11.8 Évolutions prévues

- Comptage automatique des insectes sur pièges photographiés (modèle de vision entraîné sur les espèces locales).
- Estimation de la croissance par caméra (surface foliaire des laitues sur radeau, nombre de bouquets de tomates).
- Capteurs sans fil LoRaWAN pour les serres de l'extension (moins de câblage sur 1 000 m²), avec passerelle sur le serveur existant.
- Jumeau numérique recalé : le modèle de simulation est ajusté en continu sur les mesures, pour anticiper la nuit à venir (faut-il charger davantage le stock thermique cet après-midi ?).

## 11.9 Automate de l'unité aquacole (tranches 2 et 3)

Un quatrième automate, **AUT-P**, sur la même carte CAZ-1, gère l'unité aquacole :

| Entrée ou sortie | Usage |
|---|---|
| RS485 Modbus | Sondes d'oxygène optiques (une par bac de grossissement et une pour l'écloserie), température, pH du bassin de reprise |
| Entrées 4-20 mA | Niveaux du bassin de reprise et du bassin tampon |
| Entrées isolées | Pressostat de chaque soufflante, détecteur de fuite, porte du bâtiment, défaut de la pompe à chaleur |
| Relais | Soufflante de secours, électrovanne de purge du décanteur, pompe vers le bassin tampon, pompe à chaleur, pompes doseuses de potasse et de chaux (via relais d'interface) |

Sécurités programmées localement, sans le serveur : bascule sur la soufflante de secours si la pression d'air chute ; arrêt de l'envoi d'eau vers les cultures si l'UV est en défaut ; alarme locale et SMS si l'oxygène descend sous 3 mg/L dans un bac. Les nitrites et nitrates sont mesurés à la trousse deux fois par semaine et saisis dans la supervision (les sondes en ligne fiables sont trop chères pour cette taille).
