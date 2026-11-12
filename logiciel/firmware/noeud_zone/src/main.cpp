// Automate de zone de la serre.
//
// Rôle : lire les capteurs Modbus RTU, publier les mesures en MQTT, appliquer
// les consignes du serveur tant qu'elles sont fraîches, et basculer seul en
// mode autonome (régulation de repli) si le serveur ou le réseau disparaît.
// Les sécurités (vent, pluie, aération des bassins) sont toujours appliquées
// localement, quel que soit l'état du serveur.

#include <Arduino.h>
#include <ETH.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ModbusMaster.h>
#include <esp_task_wdt.h>
#include "config.h"

WiFiClient reseau;
PubSubClient mqtt(reseau);
ModbusMaster bus;

// ---------------------------------------------------------------- état
struct Mesures {
  float t = NAN, hr = NAN, co2 = NAN;
  float ec = NAN, ph = NAN, tSol = NAN, o2 = NAN;
  float tStockage = NAN;
  bool  valide = false;
} mes;

struct Consigne {
  float ouvrant = 0, ecran = 0;
  int   extracteur = 0;
  bool  pad = false, brassage = false, co2 = false;
  String stockage = "arret";
  uint32_t recueMs = 0;
  uint32_t validiteMs = 0;
} cons;

struct Meteo {           // relayée par l'automate eau-énergie via MQTT
  float vent = 0;
  bool  pluie = false;
  uint32_t recueMs = 0;
} meteo;

bool ethOk = false;
bool modeAutonome = true;
float positionOuvrant = 0;   // estimée par le temps de course (%)
float positionEcran = 0;
uint32_t dernierePublication = 0, derniereLecture = 0;

// ---------------------------------------------------------------- réseau
void evenementReseau(WiFiEvent_t ev) {
  if (ev == ARDUINO_EVENT_ETH_GOT_IP) ethOk = true;
  if (ev == ARDUINO_EVENT_ETH_DISCONNECTED || ev == ARDUINO_EVENT_ETH_STOP) ethOk = false;
}

String sujet(const char* suffixe) {
  return String(SITE) + "/" + ZONE + "/" + suffixe;
}

void surMessage(char* topic, byte* payload, unsigned int len) {
  JsonDocument doc;
  if (deserializeJson(doc, payload, len)) return;
  String t(topic);
  if (t == sujet("consigne")) {
    cons.ouvrant    = doc["ouvrant_pct"] | 0.0f;
    cons.ecran      = doc["ecran_pct"] | 0.0f;
    cons.extracteur = doc["ventilateurs_extraction"] | 0;
    cons.pad        = doc["pad"] | false;
    cons.brassage   = doc["brassage"] | false;
    cons.co2        = doc["co2"] | false;
    cons.stockage   = String((const char*)(doc["stockage_mode"] | "arret"));
    cons.validiteMs = (uint32_t)(doc["validite_s"] | 120) * 1000UL;
    cons.recueMs    = millis();
  } else if (t == String(SITE) + "/meteo/mesure") {
    meteo.vent  = doc["vent"] | 0.0f;
    meteo.pluie = doc["pluie"] | false;
    meteo.recueMs = millis();
  }
}

void connecterMqtt() {
  if (mqtt.connected() || !ethOk) return;
  String id = String("aut-") + ZONE;
  if (mqtt.connect(id.c_str(), MQTT_UTILISATEUR, MQTT_MOT_DE_PASSE,
                   sujet("disponibilite").c_str(), 1, true, "hors_ligne")) {
    mqtt.publish(sujet("disponibilite").c_str(), "en_ligne", true);
    mqtt.subscribe(sujet("consigne").c_str(), 1);
    mqtt.subscribe((String(SITE) + "/meteo/mesure").c_str());
  }
}

// ---------------------------------------------------------------- capteurs
// Lecture de deux registres de maintien (valeur x10) ; renvoie false en cas d'échec.
bool lire2(uint8_t adresse, uint16_t reg, float& a, float& b, float echelle = 10.0f) {
  bus.begin(adresse, Serial2);
  if (bus.readHoldingRegisters(reg, 2) != bus.ku8MBSuccess) return false;
  a = (int16_t)bus.getResponseBuffer(0) / echelle;
  b = (int16_t)bus.getResponseBuffer(1) / echelle;
  return true;
}

bool lire1(uint8_t adresse, uint16_t reg, float& a, float echelle = 10.0f) {
  bus.begin(adresse, Serial2);
  if (bus.readHoldingRegisters(reg, 1) != bus.ku8MBSuccess) return false;
  a = (int16_t)bus.getResponseBuffer(0) / echelle;
  return true;
}

void lireCapteurs() {
  bool ok = lire2(ADR_TH, 0x0000, mes.t, mes.hr);
  float co2;
  if (lire1(ADR_CO2, 0x0005, co2, 1.0f)) mes.co2 = co2;
  float ec, ph;
  if (lire1(ADR_EC, 0x0000, ec, 100.0f)) mes.ec = ec;
  if (lire1(ADR_PH, 0x0000, ph, 100.0f)) mes.ph = ph;
  float ts;
  if (lire1(ADR_TSOL, 0x0000, ts)) mes.tSol = ts;
#ifdef ZONE_FEUILLES
  float o2;
  if (lire1(ADR_O2, 0x0000, o2, 100.0f)) mes.o2 = o2;
#endif
#ifdef ZONE_FRUITS
  float tsto;
  if (lire1(ADR_TSTO, 0x0000, tsto)) mes.tStockage = tsto;
#endif
  // contrôle de vraisemblance : un capteur hors plage est ignoré
  mes.valide = ok && mes.t > -5 && mes.t < 60 && mes.hr >= 0 && mes.hr <= 100;
}

// ---------------------------------------------------------------- E/S déportées
// Les relais et les contacts sont sur un module d'E/S Modbus (adresse ADR_ES) :
// les broches de l'ESP32 restent libres pour l'Ethernet et le bus RS485.
uint16_t sorties = 0;      // image des bobines à écrire
uint16_t entrees = 0xFFFF; // image des entrées (1 = contact ouvert)
bool esOk = false;

void ecrire(int canal, bool etat) {
  if (etat) sorties |= (1u << canal); else sorties &= ~(1u << canal);
}

bool lireEntree(int canal) {   // renvoie l'état électrique : LOW = contact fermé
  return (entrees >> canal) & 1u ? HIGH : LOW;
}

void echangerES() {
  bus.begin(ADR_ES, Serial2);
  bus.setTransmitBuffer(0, sorties);
  esOk = bus.writeMultipleCoils(0, 16) == bus.ku8MBSuccess;
  if (bus.readDiscreteInputs(0, 16) == bus.ku8MBSuccess) {
    // contacts actifs à l'état bas : on inverse pour garder la convention LOW = fermé
    entrees = ~bus.getResponseBuffer(0);
  }
}

void avantEmission() { digitalWrite(PIN_RS485_DE, HIGH); }
void apresEmission() { digitalWrite(PIN_RS485_DE, LOW); }

// ---------------------------------------------------------------- actionneurs
// Ouvrant et écran : moteurs à deux sens, position estimée par temps de course,
// recalée à chaque fin de course.
void piloterMoteur(int pinOuvre, int pinFerme, int pinFinOuvert, int pinFinFerme,
                   float& position, float cible, float dureeCourseS, float dtS) {
  const float tolerance = 3.0f;
  if (lireEntree(pinFinFerme) == LOW) position = 0;
  if (lireEntree(pinFinOuvert) == LOW) position = 100;
  if (cible > position + tolerance && lireEntree(pinFinOuvert) == HIGH) {
    ecrire(pinFerme, false);
    ecrire(pinOuvre, true);
    position = min(100.0f, position + 100.0f * dtS / dureeCourseS);
  } else if (cible < position - tolerance && lireEntree(pinFinFerme) == HIGH) {
    ecrire(pinOuvre, false);
    ecrire(pinFerme, true);
    position = max(0.0f, position - 100.0f * dtS / dureeCourseS);
  } else {
    ecrire(pinOuvre, false);
    ecrire(pinFerme, false);
  }
}

// Régulation de repli, volontairement simple, utilisée sans serveur.
Consigne consigneAutonome() {
  Consigne c;
  if (!mes.valide) {            // sans mesure fiable : position prudente
    c.ouvrant = 20;
    c.brassage = true;
    return c;
  }
  if (mes.t > T_AERATION_REPLI) c.ouvrant = constrain((mes.t - T_AERATION_REPLI) * 25.0f, 0, 100);
  if (mes.hr > 90 && mes.t > T_CHAUFFAGE_REPLI) c.ouvrant = max(c.ouvrant, 10.0f);
  if (mes.t > T_AERATION_REPLI + 6) { c.ouvrant = 0; c.pad = true; c.extracteur = 2; }
  if (mes.t < T_CHAUFFAGE_REPLI) { c.ouvrant = 0; c.ecran = 100; c.stockage = "decharge"; }
  c.brassage = mes.hr > 85 || c.stockage != "arret";
  return c;
}

void appliquer(const Consigne& c, float dtS) {
  float ouvrant = c.ouvrant;
  // Sécurités locales, prioritaires sur toute consigne
  bool meteoFraiche = millis() - meteo.recueMs < 120000UL;
  if (meteoFraiche) {
    if (meteo.vent >= VENT_FERMETURE) ouvrant = 0;
    else if (meteo.vent >= VENT_LIMITE) ouvrant = min(ouvrant, 30.0f);
    if (meteo.pluie) ouvrant = min(ouvrant, 20.0f);
  }
  if (lireEntree(IN_ANEMO_ALARME) == LOW) ouvrant = 0;  // contact direct de l'anémomètre

  piloterMoteur(Q_OUV_OUVRE, Q_OUV_FERME, IN_OUV_FIN_O, IN_OUV_FIN_F,
                positionOuvrant, ouvrant, DUREE_COURSE_OUVRANT_S, dtS);
  piloterMoteur(Q_ECR_OUVRE, Q_ECR_FERME, IN_ECR_FIN_O, IN_ECR_FIN_F,
                positionEcran, c.ecran, DUREE_COURSE_ECRAN_S, dtS);
  ecrire(Q_PAD, c.pad);
  ecrire(Q_EXTRACTEUR_V1, c.extracteur == 1);
  ecrire(Q_EXTRACTEUR_V2, c.extracteur >= 2);   // contacteurs verrouillés électriquement entre eux
  ecrire(Q_BRASSAGE, c.brassage);
  ecrire(Q_STOCKAGE, c.stockage != "arret");
#ifdef ZONE_FRUITS
  ecrire(Q_CO2, c.co2 && positionOuvrant < 10);
#endif
#ifdef ZONE_FEUILLES
  // Relais câblé en logique inverse (repos = marche) : le surpresseur tourne
  // même si le module d'E/S ou l'automate tombe en panne.
  ecrire(Q_AERATION_BASSINS_ARRET, false);
#endif
  echangerES();
}

// ---------------------------------------------------------------- publication
void publier() {
  if (!mqtt.connected()) return;
  JsonDocument air;
  air["t"] = mes.t; air["hr"] = mes.hr; air["co2"] = mes.co2;
  char buf[512];
  serializeJson(air, buf);
  mqtt.publish(sujet("mesure/air").c_str(), buf);

  JsonDocument sol;
  sol["ec"] = mes.ec; sol["ph"] = mes.ph; sol["t"] = mes.tSol;
#ifdef ZONE_FEUILLES
  sol["o2"] = mes.o2;
#endif
  serializeJson(sol, buf);
  mqtt.publish(sujet("mesure/solution").c_str(), buf);

#ifdef ZONE_FRUITS
  JsonDocument sto;
  sto["t"] = mes.tStockage;
  serializeJson(sto, buf);
  mqtt.publish(sujet("mesure/stockage").c_str(), buf);
#endif

  JsonDocument et;
  et["ouvrant"] = positionOuvrant; et["ecran"] = positionEcran;
  et["mode_autonome"] = modeAutonome;
  et["module_es"] = esOk;
  serializeJson(et, buf);
  mqtt.publish(sujet("etat/actionneurs").c_str(), buf);
}

// ---------------------------------------------------------------- programme
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);
  pinMode(PIN_RS485_DE, OUTPUT);
  digitalWrite(PIN_RS485_DE, LOW);
  bus.preTransmission(avantEmission);
  bus.postTransmission(apresEmission);
  pinMode(PIN_VOYANT_AUTONOME, OUTPUT);
  WiFi.onEvent(evenementReseau);
  ETH.begin();
  mqtt.setServer(MQTT_SERVEUR, 1883);
  mqtt.setCallback(surMessage);
  esp_task_wdt_config_t wdt = {.timeout_ms = 30000, .idle_core_mask = 0, .trigger_panic = true};
  esp_task_wdt_reconfigure(&wdt);
  esp_task_wdt_add(NULL);
}

void loop() {
  static uint32_t precedent = millis();
  uint32_t maintenant = millis();
  float dtS = (maintenant - precedent) / 1000.0f;
  precedent = maintenant;

  esp_task_wdt_reset();
  connecterMqtt();
  mqtt.loop();

  if (maintenant - derniereLecture >= 5000) {
    lireCapteurs();
    derniereLecture = maintenant;
  }

  bool consigneFraiche = cons.recueMs != 0 && (maintenant - cons.recueMs) < cons.validiteMs;
  modeAutonome = !consigneFraiche;
  digitalWrite(PIN_VOYANT_AUTONOME, modeAutonome ? HIGH : LOW);
  appliquer(consigneFraiche ? cons : consigneAutonome(), dtS);

  if (maintenant - dernierePublication >= 30000) {
    publier();
    dernierePublication = maintenant;
  }
  delay(100);
}
