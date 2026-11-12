// Configuration matérielle et réglages de repli. À adapter au câblage réel
// de chaque armoire (voir le schéma de l'armoire de zone).
#pragma once

#define SITE "serre/lub1"

// --- réseau (les identifiants réels ne sont jamais versionnés : fichier secrets.h)
#if __has_include("secrets.h")
#include "secrets.h"
#else
#define MQTT_SERVEUR "192.168.10.2"
#define MQTT_UTILISATEUR "aut-" ZONE
#define MQTT_MOT_DE_PASSE "a-changer"
#endif

// --- bus RS485 (Modbus RTU, 9600 bauds 8N1). Les autres broches de la carte
// sont prises par l'interface Ethernet.
#define PIN_RS485_RX 36
#define PIN_RS485_TX 4
#define PIN_RS485_DE 5
#define PIN_VOYANT_AUTONOME 2

// --- adresses Modbus
#define ADR_TH   1   // température / humidité sous abri ventilé
#define ADR_CO2  2
#define ADR_EC   3
#define ADR_PH   4
#define ADR_TSOL 5
#define ADR_O2   6   // feuilles uniquement
#define ADR_TSTO 7   // fruits uniquement : cuve de stockage thermique
#define ADR_ES   10  // module 16 relais / 16 entrées

// --- canaux de sortie du module d'E/S (relais)
#define Q_OUV_OUVRE        0
#define Q_OUV_FERME        1
#define Q_ECR_OUVRE        2
#define Q_ECR_FERME        3
#define Q_PAD              4
#define Q_EXTRACTEUR_V1    5
#define Q_EXTRACTEUR_V2    6
#define Q_BRASSAGE         7
#define Q_STOCKAGE         8
#define Q_CO2              9   // fruits
#define Q_AERATION_BASSINS_ARRET 9   // feuilles : relais à ouverture, repos = surpresseur en marche

// --- canaux d'entrée du module d'E/S (contacts secs)
#define IN_OUV_FIN_O    0
#define IN_OUV_FIN_F    1
#define IN_ECR_FIN_O    2
#define IN_ECR_FIN_F    3
#define IN_ANEMO_ALARME 4

// --- mécanique
#define DUREE_COURSE_OUVRANT_S 180.0f
#define DUREE_COURSE_ECRAN_S   240.0f

// --- sécurité et repli
#define VENT_LIMITE     10.0f
#define VENT_FERMETURE  14.0f
#ifdef ZONE_FRUITS
#define T_AERATION_REPLI  25.0f
#define T_CHAUFFAGE_REPLI 15.0f
#else
#define T_AERATION_REPLI  23.0f
#define T_CHAUFFAGE_REPLI 12.0f
#endif
