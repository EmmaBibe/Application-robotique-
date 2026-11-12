# Logiciel de régulation et de supervision

## Organisation

| Dossier | Contenu |
|---|---|
| `serre_core/psychro.py` | Pression de vapeur, DPV, point de rosée, température humide, sortie d'un mur évaporatif, conversions lumière |
| `serre_core/recettes.py` | Lecture de `donnees/recettes_climat.json`, calcul du stade d'un lot, fusion des consignes d'un compartiment |
| `serre_core/climat.py` | Régulateur climatique par priorités (sécurité, température, humidité, écran, stockage thermique, CO2, intégration de température), avec la raison de chaque décision |
| `serre_core/fertirrigation.py` | Irrigation par somme de rayonnement ajustée sur le drainage, corrections EC et pH plafonnées, surveillance des bassins |
| `serre_core/energie.py` | Délestage par priorités selon l'état de charge, recharge réseau, démarrage du groupe |
| `serre_core/alarmes.py` | Règles d'alarme temporisées, acquittement |
| `serre_core/meteo.py` | Journées types à partir des normales de Lubumbashi |
| `serre_core/simulateur.py` | Modèle thermique et hydrique de la serre, piloté par le vrai régulateur |
| `serre_core/service.py` | Service MQTT : lit les mesures, publie les consignes et les alarmes |
| `outils/` | Études reproductibles (climat, énergie, solutions nutritives) |
| `tests/` | Tests automatiques (pytest) |
| `edge/` | Déploiement Docker Compose du serveur local |
| `firmware/noeud_zone/` | Micrologiciel ESP32 des automates de zone |
| `dashboard/` | Démonstrateur de l'interface (HTML autonome, données simulées) |

## Tests

```
pip install pytest
python -m pytest
```

## Installation du serveur local

Matériel : mini-PC industriel sans ventilateur ou Raspberry Pi 5 avec SSD, sur alimentation secourue, système Linux avec Docker.

```
cd edge
cp .env.exemple .env          # puis remplacer chaque mot de passe
# créer le fichier des mots de passe MQTT (voir mosquitto/passwd.LISEZMOI)
docker compose up -d
```

Services :

| Service | Adresse | Rôle |
|---|---|---|
| Mosquitto | port 1883 | Courtier MQTT, accès authentifié et listes d'accès par automate |
| InfluxDB | http://serveur:8086 | Base de mesures (rétention 90 jours des mesures brutes, agrégats à configurer) |
| Telegraf | - | Collecte des messages MQTT vers InfluxDB |
| Grafana | http://serveur:3000 | Analyses et tableaux |
| Régulation fruits / feuilles | - | `serre_core.service`, un par compartiment |
| Interface | http://serveur:8080 | Interface d'exploitation |

## Automates de zone

```
cd firmware/noeud_zone
pio run -e fruits -t upload
pio run -e feuilles -t upload
```

Avant le premier téléversement : créer `src/secrets.h` avec l'adresse du serveur et les identifiants MQTT de l'automate, et vérifier dans `src/config.h` les adresses Modbus et les registres des capteurs achetés. Tester chaque automate sur banc (capteurs branchés, relais à vide) avant de le raccorder aux moteurs : sens de rotation des ouvrants, fins de course, coupure réseau et passage en mode autonome.

## Principes de sûreté

- L'automate de zone ne dépend pas du serveur : sans consigne fraîche depuis 2 minutes, il applique sa régulation de repli.
- Les sécurités vent et pluie sont appliquées par l'automate, quelle que soit la consigne reçue.
- Le surpresseur des bassins est câblé sur un relais à ouverture : il tourne même si l'automate ou le module d'E/S tombe en panne.
- Le dosage d'engrais et d'acide n'a lieu que sur ordre du serveur, par petites doses plafonnées, et s'arrête si une sonde donne une valeur incohérente.
