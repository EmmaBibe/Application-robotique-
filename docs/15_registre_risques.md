# 15. Registre des risques

Le registre complet (20 risques, avec causes, mesures, plan de réponse et responsable) est dans `donnees/registre_risques.csv`, pour être tenu à jour dans un tableur. Il est revu chaque mois pendant le pilote.

Criticité = probabilité (1 à 5) x gravité (1 à 5). Au-delà de 12 : risque majeur, suivi mensuel obligatoire.

## 15.1 Carte des risques

| Gravité \ Probabilité | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **5** | | R05 ToBRFV, R19 foncier | R04 Tuta et aleurodes, R13 eau contaminée | **R01 prix** | |
| **4** | | R08 coup de chaleur, R12 onduleur, R20 qualité | R02 volumes, R06 Pythium, R10 tempête, R16 ruptures, R17 départ du technicien | **R03 rendements** | |
| **3** | | R09 froid extrême | R18 budget | R07 maladies foliaires, R14 vols | |
| **2** | | | R15 supervision | | R11 coupures SNEL |

## 15.2 Les quatre risques majeurs

**R01. Prix obtenus inférieurs aux hypothèses (criticité 20).** C'est le risque numéro un : le modèle financier montre qu'une baisse de 26 % des prix ramène l'EBE à zéro. La parade commence avant d'investir : enquête de prix auprès d'au moins quinze acheteurs professionnels, lettres d'intention, positionnement sur la saison des pluies et sur la qualité sanitaire (produits analysés). Pendant le pilote, chaque vente est enregistrée avec son prix réel : l'indicateur est connu en continu.

**R03. Rendements inférieurs aux hypothèses (criticité 16).** Toute nouvelle exploitation hors-sol connaît une courbe d'apprentissage. Parades : formation sérieuse, appui d'un agronome spécialisé les six premiers mois (visites et suivi à distance grâce aux données), deux variétés par culture, recalage des recettes sur les mesures. Les données de la supervision permettent de comprendre un écart de rendement au lieu de le subir.

**R04. Introduction de Tuta absoluta ou d'aleurodes porteuses de virus (criticité 15).** Parades physiques (filets, sas), prophylaxie (plants produits sur place, hygiène), surveillance (pièges intérieurs et extérieurs), vide sanitaire annuel, lutte biologique. Le cloisonnement en deux compartiments limite les dégâts à une moitié de la serre.

**R13. Eau contaminée ou indisponible (criticité 15).** L'analyse d'eau fait partie des conditions préalables à l'achat ou la location du terrain. La récupération d'eau de pluie et, si nécessaire, l'osmoseur sécurisent la qualité.

## 15.3 Risques acceptés

- **Coupures SNEL** : probabilité maximale, mais gravité faible grâce à l'autonomie énergétique. C'est le seul risque « certain » du projet et il est neutralisé par conception.
- **Panne de supervision** : les automates fonctionnent seuls ; le risque est une perte de données, pas une perte de culture.

## 15.4 Le risque de tout arrêter

Le pire cas raisonnable : après deux ans de pilote, les prix et les rendements sont décevants et l'on arrête. Le terrain est libéré, le matériel revendu (environ 35 % de sa valeur : panneaux solaires, batteries, pompes, chambre froide, structure démontable se revendent bien à Lubumbashi). Perte nette estimée : environ 43 000 $ dans le scénario médian, 47 500 $ dans le scénario prudent (onglet `Pilote_seul` du modèle). C'est le montant que le porteur de projet doit être prêt à perdre, et il ne doit pas l'emprunter.
