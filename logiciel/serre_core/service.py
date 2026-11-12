"""Service de régulation : écoute les mesures MQTT et publie les consignes.

Lancement :
    python -m serre_core.service --broker localhost --compartiment fruits

Le service ne commande jamais un actionneur directement : il publie une
consigne avec une durée de validité. L'automate de zone l'applique si elle
est fraîche, sinon il reste en mode autonome (voir firmware/noeud_zone).
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from dataclasses import asdict
from datetime import date

from .alarmes import GestionnaireAlarmes
from .climat import Mesures, RegulateurClimat
from .energie import decider
from .recettes import charger_recettes, consignes_compartiment

log = logging.getLogger("serre.service")

SITE = "serre/lub1"
VALIDITE_S = 120

# Lots en place : en exploitation, cette liste vient de la base des lots
# saisie dans l'interface. Ici, un exemple pour chaque compartiment.
LOTS_EXEMPLE = {
    "fruits": [{"culture": "tomate", "date_semis": date(2026, 7, 15)}],
    "feuilles": [
        {"culture": "chou_chine", "date_semis": date(2026, 10, 20)},
        {"culture": "amarante", "date_semis": date(2026, 10, 25)},
    ],
}


class EtatSite:
    def __init__(self):
        self.air: dict = {}
        self.meteo: dict = {}
        self.stockage: dict = {}
        self.energie: dict = {}


def construire_mesures(e: EtatSite) -> Mesures | None:
    try:
        return Mesures(
            t_int=e.air["t"], hr_int=e.air["hr"], co2_ppm=e.air.get("co2", 420),
            t_ext=e.meteo["t"], hr_ext=e.meteo["hr"], rayonnement_ext=e.meteo["ray"],
            vent_m_s=e.meteo["vent"], pluie=e.meteo.get("pluie", False),
            t_stockage=e.stockage.get("t", 20.0), jour=e.meteo["ray"] > 5,
            t_feuille=e.air.get("t_feuille"),
        )
    except KeyError:
        return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--broker", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--utilisateur", default="regulation")
    ap.add_argument("--mot-de-passe", default="")
    ap.add_argument("--compartiment", default="fruits", choices=["fruits", "feuilles"])
    ap.add_argument("--periode", type=int, default=30)
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    import paho.mqtt.client as mqtt  # dépendance optionnelle

    recettes = charger_recettes()
    reg = RegulateurClimat()
    alarmes = GestionnaireAlarmes()
    etat = EtatSite()
    comp = a.compartiment

    def sur_message(client, _ud, msg):
        try:
            data = json.loads(msg.payload)
        except ValueError:
            return
        t = msg.topic
        if t == f"{SITE}/{comp}/mesure/air":
            etat.air = data
        elif t == f"{SITE}/meteo/mesure":
            etat.meteo = data
        elif t == f"{SITE}/{comp}/mesure/stockage":
            etat.stockage = data
        elif t == f"{SITE}/energie/mesure":
            etat.energie = data

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"regulation-{comp}")
    if a.mot_de_passe:
        client.username_pw_set(a.utilisateur, a.mot_de_passe)
    client.will_set(f"{SITE}/regulation/{comp}/disponibilite", "hors_ligne", retain=True)
    client.on_message = sur_message
    client.connect(a.broker, a.port, keepalive=60)
    for sujet in (f"{SITE}/{comp}/mesure/#", f"{SITE}/meteo/mesure", f"{SITE}/energie/mesure"):
        client.subscribe(sujet)
    client.publish(f"{SITE}/regulation/{comp}/disponibilite", "en_ligne", retain=True)
    client.loop_start()

    while True:
        time.sleep(a.periode)
        m = construire_mesures(etat)
        if m is None:
            log.warning("mesures incomplètes, pas de consigne publiée")
            continue
        c = consignes_compartiment(recettes, LOTS_EXEMPLE[comp], date.today())
        cmd = reg.calculer(m, c)

        # filtre énergie : on n'autorise pas les extracteurs si la charge est délestée
        if etat.energie:
            d = decider(etat.energie.get("soc", 100), etat.energie.get("reseau", False), etat.energie.get("pv_w", 0))
            if "extracteurs_pad" in d.charges_delestees and cmd.pad:
                cmd.pad, cmd.ventilateurs_extraction = False, 0
                cmd.ouvrant_pct = 100.0
                cmd.raisons.append("énergie basse : refroidissement évaporatif suspendu, aération maximale")

        charge = asdict(cmd)
        charge.update({"validite_s": VALIDITE_S, "ts": int(time.time()), "culture": c.culture, "stade": c.stade})
        client.publish(f"{SITE}/{comp}/consigne", json.dumps(charge, ensure_ascii=False), qos=1)

        valeurs = {"t_int": m.t_int, "hr_int": m.hr_int, "co2_ppm": m.co2_ppm}
        if etat.energie:
            valeurs["soc"] = etat.energie.get("soc", 100)
        for regle, evt in alarmes.evaluer(time.time(), valeurs):
            client.publish(f"{SITE}/{comp}/alarme", json.dumps({
                "code": regle.code, "niveau": regle.niveau, "message": regle.message, "etat": evt,
            }, ensure_ascii=False), qos=1, retain=False)
        log.info("consigne %s : %s", comp, "; ".join(cmd.raisons) or "rien à signaler")


if __name__ == "__main__":
    main()
