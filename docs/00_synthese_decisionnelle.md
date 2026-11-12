# Synthèse décisionnelle

Serre agricole en environnement contrôlé, Lubumbashi (Haut-Katanga, RDC)
Surface de culture de référence : 10 m x 10 m. Version 1.0, novembre 2026.

---

## 1. La question posée

Peut-on produire à Lubumbashi, toute l'année, des légumes frais (tomate, poivron, piment, amarante, choux, épinard, céleri, poireau, oignon, ail) dans une serre pilotée, économe en énergie et en engrais, à risque sanitaire minimal, avec un suivi fin par capteurs, et en tirer une activité rentable ?

La réponse courte : techniquement oui, sans difficulté majeure. Économiquement, oui sous conditions, et ces conditions ne peuvent être vérifiées qu'en faisant tourner un pilote. Ce dossier décrit ce pilote en détail, ce qu'il coûte, ce qu'il doit prouver, et à partir de quels résultats il faut passer à l'échelle ou s'arrêter.

## 2. Ce que l'étude a établi

**Le climat de Lubumbashi est favorable, à condition de traiter trois périodes.** L'altitude (environ 1 230 m) donne des journées douces et un ensoleillement fort toute l'année (5 à 6,6 kWh/m²/j). Les difficultés sont concentrées sur :

- les nuits froides de juin-juillet (minimales moyennes de 7 °C, pointes plus basses) ;
- la chaleur sèche de septembre-octobre (maximales de 31 à 33 °C, HR sous 40 %) ;
- l'humidité nocturne de la saison des pluies (novembre-mars), où l'air extérieur est saturé.

La simulation thermique de la serre (modèle fourni dans `logiciel/`) montre que la combinaison retenue (écran thermique, stock d'eau chaude de 6 à 10 m³ chargé par l'excès de chaleur du jour, mur évaporatif pour la saison chaude) maintient la température entre 13,4 et 30,6 °C toute l'année sans aucun chauffage fossile. Une serre simple sans ces équipements descendrait à 8,6 °C en juillet et monterait à 37,6 °C en octobre.

**Le sol est un danger, l'hors-sol est une réponse.** Plus de 75 % des sols maraîchers de Lubumbashi sont contaminés au cuivre et au cobalt (thèse Mununga Katebe, ULiège 2024) et les légumes-feuilles vendus sur les marchés en contiennent. Les cultures hydroponiques étudiées dans la même thèse ne présentaient pas de métaux dans leurs parties consommées. Produire hors-sol avec une eau contrôlée n'est donc pas un luxe technologique : c'est un argument commercial et sanitaire fort (« légumes analysés sans métaux lourds »).

**L'éclairage artificiel intégral (ferme verticale) est à exclure pour ces cultures.** Une tomate a besoin d'environ 25 mol de lumière par m² et par jour. Fournir cela avec des LED sur 100 m² demanderait environ 300 kWh par jour, soit quinze fois la consommation totale de la serre retenue (environ 21 kWh/j). Le soleil de Lubumbashi est gratuit et abondant : la conception est une serre éclairée naturellement, la lumière artificielle étant limitée à la chambre de germination.

**L'énergie peut être autonome.** Avec 3 à 6,6 kWc de panneaux et 10 à 20 kWh de batteries LiFePO4, le site fonctionne sans le réseau SNEL, qui reste un appoint, et un petit groupe électrogène sert de dernier recours. Les fonctions vitales (aération des bassins, automates, alarmes) sont alimentées en priorité et tiennent plus de 24 h sans soleil.

**Le calendrier tombe bien.** Les tomates de plein champ autour de Lubumbashi abondent en saison sèche (prix bas en juillet) et souffrent en saison des pluies (prix qui doublent, comme en mars 2026). Le plan de culture place la récolte de tomates et poivrons de novembre à juin, puis un vide sanitaire en juillet, mois le plus froid : on vend quand le marché est cher et on coupe le cycle des ravageurs quand la plante pousserait mal de toute façon.

**Toutes les cultures demandées ne méritent pas une place en serre.** L'évaluation plante par plante (document 03) conclut :

| Culture | Verdict |
|---|---|
| Tomate, poivron, piment | Retenus, compartiment « fruits », culture sur substrat |
| Chou de Chine, épinard, céleri, poireau | Retenus, compartiment « feuilles », radeaux flottants |
| Amarante | Retenue mais en petite surface : excellente culture, prix de vente faible |
| Oignon | Retenu sous forme d'oignon vert (cébette). Le bulbe n'a pas sa place en serre |
| Chou pommé, ail | Essais seulement. Trop peu de valeur au m², à produire en plein champ |

L'étude recommande d'ajouter la laitue et des aromatiques (basilic, coriandre, persil) : ce sont les cultures qui rapportent le plus au m² en hydroponie, et elles financent les autres.

## 3. Ce que coûte le projet et ce qu'il rapporte

Montants en dollars US, rendu Lubumbashi, hors terrain. Détail dans `finance/modele_financier_serre_lubumbashi.xlsx`.

| | Phase 1 : pilote 100 m² | Phase 2 : extension 900 m² | Total |
|---|---|---|---|
| Investissement | 55 220 $ | 114 730 $ | 169 950 $ |
| Coût par m² de serre | 552 $ | 127 $ | |

La phase 1 porte presque toutes les infrastructures communes (annexe, sas, énergie, supervision, chambre froide, stockage d'eau), d'où son coût élevé au m². Ces équipements servent ensuite à toute la ferme.

Résultats de la ferme complète (1 000 m²) en régime de croisière :

| Scénario | CA net annuel | EBE annuel | TRI sur 10 ans |
|---|---|---|---|
| Prudent | 30 700 $ | -15 100 $ | négatif |
| Médian | 61 800 $ | 16 000 $ | -3,5 % |
| Optimiste | 103 200 $ | 57 400 $ | +16 % |

Ces chiffres doivent être lus sans complaisance :

1. **Avec les hypothèses médianes, l'investissement complet ne se rembourse pas en dix ans.** La ferme dégage un excédent d'exploitation positif (16 000 $/an) mais insuffisant face à 170 000 $ investis.
2. **Le résultat dépend presque entièrement de deux inconnues : le rendement réellement obtenu et le prix réellement payé par les clients.** Entre le scénario prudent et l'optimiste, l'écart d'EBE est de 72 000 $ par an pour la même serre.
3. **Le seuil de viabilité est identifiable.** Avec les rendements médians, l'EBE devient nul si les prix tombent à 74 % des prix médians. Vu d'aujourd'hui, pour que le projet entier (pilote compris) rémunère le capital à 12 %, il faut un indice prix x rendement d'environ 1,5 fois le médian (par exemple +25 % sur les prix et +25 % sur les rendements). Mais la décision d'extension se prend après le pilote, quand son coût est déjà engagé : à ce moment-là, l'extension seule est rentable à 12 % dès que l'indice mesuré atteint 1,1 fois le médian. C'est cet écart qui justifie de commencer petit : le pilote coûte cher au m², mais il évite d'engager 115 000 $ à l'aveugle.
4. **Le pilote seul n'est pas une affaire rentable.** À 100 m², le chiffre d'affaires (environ 5 000 $/an) ne peut pas porter un salaire et les frais fixes. Si le porteur de projet fait lui-même le travail, le pilote s'équilibre à peu près. C'est un outil d'apprentissage et de preuve commerciale.

## 4. Recommandation

**Lancer le pilote, en le considérant comme l'achat d'une information, pas comme une affaire.**

- Budget pilote recommandé : 55 220 $ (configuration « optimisée »). Une configuration « vitrine R&D » plus instrumentée (environ 105 000 $) n'a de sens qu'avec un partenaire qui la finance (université, entreprise minière dans le cadre de sa responsabilité sociale, bailleur).
- Perte maximale si l'on abandonne après deux ans, matériel revendu à 35 % : environ 43 000 $. C'est le risque réel à accepter.
- Durée : 12 à 18 mois de production avant de décider.

**Ne décider l'extension que si le pilote atteint, sur 12 mois glissants :**

| Indicateur | Seuil « go » | Seuil « stop » |
|---|---|---|
| Tomate, rendement annualisé | ≥ 28 kg/m² | < 20 kg/m² |
| Laitue, têtes vendables par m² de radeau et par an | ≥ 220 | < 160 |
| Prix moyen obtenu, tous produits | ≥ 110 % du médian | < 90 % |
| Indice global prix x rendement (modèle financier) | ≥ 1,2 | < 1,0 |
| Clients professionnels sous contrat ou commande régulière | ≥ 4 | < 2 |
| Pertes et invendus | ≤ 8 % | > 15 % |
| Incidents sanitaires ayant détruit plus de 20 % d'une culture | 0 | ≥ 2 |
| Disponibilité de la supervision (données reçues) | ≥ 98 % | < 90 % |

Entre les deux seuils : prolonger le pilote de six mois en corrigeant ce qui coince, ou étendre plus modestement (300 à 400 m²) en recalculant avec les valeurs mesurées.

Le modèle financier est construit pour que ces valeurs mesurées remplacent les hypothèses en quelques minutes.

## 5. Ce qui fait la différence de ce projet

- Hors-sol intégral et eau maîtrisée : produits analysés, sans métaux lourds, argument rare à Lubumbashi.
- Deux compartiments indépendants (fruits / feuilles), chacun avec son propre circuit d'eau désinfecté aux UV : une maladie racinaire ne traverse pas la serre.
- Sas de biosécurité, filets anti-insectes 50 mesh, vide sanitaire annuel, lutte biologique : on vise zéro traitement chimique de synthèse sur les produits récoltés.
- Climat piloté par l'excès de chaleur du jour, stocké dans l'eau pour la nuit : pas de chauffage au gaz ni au charbon.
- Supervision locale autonome (fonctionne sans internet), alertes SMS, tableau de bord qui montre la serre comme un organisme vivant : chaque lot de plantes, de la graine à la récolte, avec son climat, sa solution, ses photos et son historique. Un mode « recherche » permet de mener des essais comparatifs et d'exporter les données.

## 6. Où trouver quoi

| Besoin | Document |
|---|---|
| Comprendre le contexte local (climat, énergie, eau, marché, sols) | `01_contexte_lubumbashi.md` |
| Pourquoi chaque choix technique a été fait | `02_choix_conception.md` |
| Stratégie de cultures, verdict plante par plante | `03_strategie_cultures.md`, `04_fiches_cultures.md` |
| Solutions nutritives | `05_nutrition_fertirrigation.md` |
| Biosécurité et protection des cultures | `06_biosecurite_protection.md` |
| Bâtiment, structure, génie civil | `07_architecture_genie_civil.md` |
| Climat, thermique, ventilation | `08_climat_thermique.md` |
| Eau et hydraulique | `09_eau_hydraulique.md` |
| Électricité et énergie | `10_electricite_energie.md` |
| Capteurs, automates, réseau | `11_electronique_iiot.md` |
| Logiciel de supervision et interface | `12_logiciel_supervision.md` |
| Économie, financement, comptabilité | `13_economie_finance.md` |
| Exploitation au quotidien | `14_exploitation_procedures.md` |
| Risques | `15_registre_risques.md` |
| Planning et étapes de décision | `16_feuille_de_route.md` |
| Sources | `17_sources.md` |
