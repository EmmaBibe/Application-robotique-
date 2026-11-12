# 16. Feuille de route et points de décision

Le projet avance par phases. Chaque phase se termine par une décision explicite, prise sur des critères chiffrés fixés à l'avance. On ne passe à la phase suivante que si les critères sont remplis.

## 16.1 Vue d'ensemble

| Phase | Durée | Coût | Objet | Décision de sortie |
|---|---|---|---|---|
| 0. Validation terrain | 2 à 3 mois | 2 000 à 3 000 $ | Terrain, eau, marché, devis | Lancer ou non le pilote |
| 1a. Construction du pilote | 4 à 5 mois | 55 220 $ | Serre, annexe, équipements, mise en service | Réception technique |
| 1b. Exploitation du pilote | 12 à 18 mois | Charges d'exploitation (environ 7 800 $/an) | Produire, vendre, mesurer, apprendre | Étendre, prolonger, ou arrêter |
| 2. Extension à 1 000 m² | 6 mois de travaux | 114 730 $ | Montée en échelle | Revue annuelle |
| 3. Consolidation | Années 4 et suivantes | Autofinancement | Optimisation, certification, éventuellement 2 000 m² | |

## 16.2 Phase 0 : validation terrain (mois 1 à 3)

**Tâches**

1. Recherche et choix du terrain selon les critères du document 07 ; vérification du titre par un notaire.
2. **Analyse d'eau complète** sur le point d'eau du terrain (laboratoire universitaire ou privé de Lubumbashi) et analyse de sol pour les fondations.
3. **Enquête de prix et de volumes** auprès d'au moins 15 acheteurs professionnels (supermarchés, hôtels, restaurants, sociétés de restauration minière) et relevé des prix en rayon toutes les deux semaines pendant deux mois. Grille fournie : `donnees/enquete_prix_modele.csv`.
4. Recueil de **lettres d'intention** (volumes hebdomadaires, prix, conditions de paiement).
5. Trois devis par lot : structure de serre, couverture et filets, énergie solaire, équipements hydrauliques, construction de l'annexe.
6. Constitution de la société, ouverture des comptes, demande d'agrément pour les exonérations sur le matériel.
7. Recrutement ou identification de l'ouvrier-technicien ; identification d'un agronome d'appui.

**Critères pour lancer le pilote**

| Critère | Seuil |
|---|---|
| Eau | Analyse compatible avec l'hydroponie, directement ou après osmose |
| Terrain | Titre vérifié, accès, électricité, sécurité |
| Prix relevés | En moyenne ≥ 90 % des prix médians du modèle |
| Lettres d'intention | Au moins 3 acheteurs, pour au moins 60 % de la production prévue du pilote |
| Devis | Total ≤ budget + 10 % |
| Financement | Fonds propres disponibles pour le pilote et 8 000 $ de fonds de roulement |

## 16.3 Phase 1a : construction (mois 4 à 8)

| Mois | Tâches |
|---|---|
| 4 | Commandes des équipements importés (délai 6 à 10 semaines) ; terrassement, plateforme, drainage ; installation de la station météo |
| 5 | Fondations, longrines, dalle de l'annexe ; construction de l'annexe ; réception des premiers lots |
| 6 | Montage de la structure, couverture, filets, ouvrants, écran ; prise de terre et paratonnerre |
| 7 | Hydraulique (citerne, cuves, bassins, réseau goutte-à-goutte), électricité, énergie solaire, armoires, capteurs, réseau |
| 8 | Mise en service : tests de chaque fonction, test de coupure totale, étalonnages, formation de l'équipe, premiers semis en chambre de germination |

**Réception technique** : liste de contrôle signée (étanchéité aux insectes, fonctionnement des ouvrants et des sécurités vent/pluie, autonomie énergétique mesurée sur 24 h, précision des sondes, alarmes testées, mode autonome des automates vérifié).

**Calage avec le calendrier cultural** : idéalement, la serre est prête fin juillet pour planter tomates et poivrons à la mi-août (semis en juin-juillet dans la chambre de germination, qui doit donc être fonctionnelle un mois avant le reste). Si le chantier commence en mars, ce calage est atteint. Sinon, démarrer par les feuilles, qui n'ont pas de saison.

## 16.4 Phase 1b : exploitation du pilote (mois 9 à 20 au minimum)

**Jalons**

| Mois depuis la mise en service | Jalon |
|---|---|
| 1 | Premières récoltes de feuilles ; premières livraisons |
| 3 | Premières récoltes de tomates ; revue des recettes climatiques avec les premières données |
| 6 | Bilan intermédiaire : rendements, prix, pertes, incidents, consommations ; recalage du modèle financier |
| 10 | Fin de la première saison de fruits ; vide sanitaire |
| 12 | **Bilan annuel et décision** |
| 18 | Décision définitive si la décision à 12 mois était « prolonger » |

**Critères de décision à 12 mois** (repris de la synthèse)

| Indicateur | « Go » extension | « Stop » |
|---|---|---|
| Tomate, rendement annualisé | ≥ 28 kg/m² | < 20 kg/m² |
| Laitue, têtes vendables par m² de radeau et par an | ≥ 220 | < 160 |
| Prix moyen obtenu | ≥ 110 % du médian | < 90 % |
| Indice global prix x rendement (calculé par le modèle) | ≥ 1,2 | < 1,0 |
| Clients réguliers | ≥ 4 | < 2 |
| Pertes et invendus | ≤ 8 % | > 15 % |
| Incidents sanitaires majeurs (> 20 % d'une culture détruite) | 0 | ≥ 2 |
| Disponibilité de la supervision | ≥ 98 % | < 90 % |

Entre les deux : prolonger de 6 mois en traitant les causes identifiées, ou étendre partiellement (300 à 400 m²).

**Procédure de décision** : remplacer dans le modèle financier les hypothèses par les valeurs mesurées (onglet Cultures : rendements et prix ; onglet OPEX : charges réelles), relire la VAN de l'extension, et décider. Le calcul prend une heure.

## 16.5 Phase 2 : extension (après décision favorable)

- Dimensionnement définitif à partir des données du pilote (mélange de cultures, surfaces, équipements).
- Recherche de financement avec les données mesurées et les contrats clients.
- Travaux en saison sèche (mai à octobre) de préférence.
- Mise en production progressive par blocs, montée en charge sur deux ans.

## 16.6 Indicateurs suivis en continu

Production (kg par culture et par m²), ventes (prix moyen réalisé par produit et par canal), pertes, consommations (eau, énergie, engrais par kg), disponibilité des équipements, incidents sanitaires, heures de travail par kg, satisfaction des clients (livraisons conformes et à l'heure). Ils sont affichés dans l'onglet « Pilotage » de la supervision et exportables pour le bilan.

## 16.7 Planning synthétique

```
Mois      1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26
Phase 0   ████████
Constr.            ███████████████
Pilote                            ████████████████████████████████████
Décision                                                  ◆        (◆)
Extension                                                    ███████████████████
```
