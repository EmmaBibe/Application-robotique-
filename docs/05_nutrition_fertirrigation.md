# 5. Nutrition des plantes et fertirrigation

## 5.1 Principes retenus

1. **Rien n'est perdu.** Le drainage des seaux hollandais et l'eau des bassins sont recyclés après filtration et désinfection. La consommation d'engrais d'une culture hors-sol recyclée est de 30 à 50 % inférieure à celle d'une culture en solution perdue, et l'environnement ne reçoit pas de nitrates.
2. **Deux circuits indépendants**, fruits et feuilles, chacun avec sa propre cuve de solution, sa propre désinfection UV et ses propres sondes. Une maladie racinaire ou une erreur de dosage reste confinée.
3. **Des recettes calculées à partir de l'analyse de l'eau.** L'eau de pluie est presque pure ; l'eau de forage peut contenir du calcium, du magnésium, des bicarbonates et des métaux. Le script `logiciel/outils/calcul_solution.py` recalcule les doses à partir de l'analyse.
4. **Des corrections douces et plafonnées.** L'automate corrige la CE puis le pH par petites doses, attend le mélange, et suspend le dosage si une sonde donne une valeur incohérente (code dans `logiciel/serre_core/fertirrigation.py`).
5. **Un contrôle humain hebdomadaire** : mesure manuelle de CE et pH avec un appareil de poche étalonné, comparée aux sondes en ligne ; analyse complète de la solution au laboratoire une fois par mois la première année.

## 5.2 Recettes de base (eau de pluie ou osmosée)

Concentrations de la solution donnée aux plantes, en mmol/L (macroéléments) et µmol/L (oligoéléments). Inspirées des références de Sonneveld et Voogt (Wageningen) pour la culture sur substrat et en eau.

| Élément | Fruits, jeunes plants | Fruits, production | Feuilles |
|---|---|---|---|
| NO3 | 12,0 | 16,0 | 12,0 |
| NH4 | 0,8 | 1,0 | 0,8 |
| H2PO4 | 1,2 | 1,5 | 1,0 |
| K | 6,0 | 9,5 | 6,0 |
| Ca | 4,0 | 5,0 | 4,0 |
| Mg | 1,5 | 2,4 | 1,5 |
| SO4 | 2,2 | 3,9 | 2,4 |
| Fe (µmol/L) | 15 | 15 | 25 |
| Mn | 10 | 10 | 5 |
| Zn | 5 | 5 | 4 |
| B | 30 | 30 | 25 |
| Cu | 0,75 | 0,75 | 0,75 |
| Mo | 0,5 | 0,5 | 0,5 |
| CE estimée (mS/cm) | 1,8 | 2,5 | 1,8 |
| pH visé | 5,6 - 6,0 | 5,6 - 6,0 | 5,8 - 6,2 |

Les bilans ioniques sont équilibrés (25,3 meq/L de cations et d'anions pour la recette de production). La CE de travail est ensuite ajustée par simple dilution ou concentration autour de cette base, selon les consignes de chaque stade (`donnees/recettes_climat.json`).

## 5.3 Doses d'engrais pour 1 000 L de solution finale (eau de pluie)

| Engrais (qualité soluble) | Fruits, production | Fruits, jeunes plants | Feuilles |
|---|---|---|---|
| Nitrate de calcium (15,5 % N, 19 % Ca) | 1 080 g | 864 g | 864 g |
| Nitrate de potassium (13-0-46) | 506 g | 324 g | 324 g |
| Phosphate monopotassique (0-52-34) | 204 g | 163 g | 136 g |
| Sulfate de magnésium heptahydraté | 592 g | 370 g | 370 g |
| Sulfate de potassium (0-0-50) | 262 g | 139 g | 157 g |
| Chélate de fer DTPA 11 % | 7,6 g | 7,6 g | 12,7 g |
| Sulfate de manganèse monohydraté | 1,7 g | 1,7 g | 0,8 g |
| Sulfate de zinc heptahydraté | 1,4 g | 1,4 g | 1,2 g |
| Acide borique | 1,9 g | 1,9 g | 1,5 g |
| Sulfate de cuivre pentahydraté | 0,19 g | 0,19 g | 0,19 g |
| Molybdate de sodium dihydraté | 0,12 g | 0,12 g | 0,12 g |

En période chaude et très lumineuse (septembre-octobre), le chélate DTPA peut être remplacé par un chélate EDDHA, plus stable au-dessus de pH 6,5, si les analyses montrent un fer insuffisant dans la solution de drainage.

## 5.4 Solutions mères

Deux cuves de 100 L par circuit, concentrées 100 fois (10 L de A et 10 L de B pour 1 000 L de solution finale) :

- **Cuve A** : nitrate de calcium, la moitié du nitrate de potassium, chélate de fer.
- **Cuve B** : l'autre moitié du nitrate de potassium, phosphate monopotassique, sulfates de magnésium et de potassium, oligoéléments.
- **Cuve C** : acide (acide nitrique dilué ou acide phosphorique) pour la correction du pH. Une cuve de base (hydroxyde de potassium dilué) n'est utile qu'avec l'eau de pluie, dont le pH dérive parfois vers le bas dans les bassins.

Le calcium et les sulfates ou phosphates ne se mélangent jamais en solution concentrée (précipité de gypse ou de phosphate de calcium). C'est la seule règle à ne jamais enfreindre.

Pour une solution mère de fruits (100 L de A et 100 L de B, soit 10 000 L de solution finale) : 10,8 kg de nitrate de calcium et 2,53 kg de nitrate de potassium dans A ; 2,53 kg de nitrate de potassium, 2,04 kg de phosphate monopotassique, 5,92 kg de sulfate de magnésium et 2,62 kg de sulfate de potassium dans B. Toutes ces quantités sont sous les limites de solubilité à 20 °C (la plus contraignante, le sulfate de potassium, est à 26 g/L pour une solubilité d'environ 110 g/L).

## 5.5 Cas d'une eau de forage

Exemple d'une eau dure contenant 1,2 mmol/L de Ca, 0,6 mmol/L de Mg et 3 mmol/L de bicarbonates :

- le calcium et le magnésium de l'eau sont déduits des apports (nitrate de calcium ramené à 821 g, sulfate de magnésium à 444 g pour 1 000 L) ;
- on neutralise 2,5 mmol/L de bicarbonates en en laissant 0,5 comme tampon : environ 190 mL d'acide nitrique à 60 % pour 1 000 L, ce qui apporte aussi 2,5 mmol/L de nitrate, retirés du nitrate de potassium ;
- commande : `python -m outils.calcul_solution --hco3 3 --ca 1.2 --mg 0.6`

Si l'analyse révèle des métaux au-dessus des limites (Cu > 0,2 mg/L, Mn > 0,5 mg/L, Zn > 1 mg/L, toute trace significative de Pb, Cd, As, Co), du sodium ou des chlorures au-dessus de 2 mmol/L, ou du bore au-dessus de 0,5 mg/L, l'eau de forage passe par l'osmoseur avant usage. Un osmoseur de 100 L/h suffit pour le pilote (consommation journalière d'environ 0,5 m³ en pointe), avec un rendement de 50 à 70 % ; le concentrat sert au nettoyage.

## 5.6 Gestion du drainage recyclé (fruits)

- Le drainage est collecté dans une cuve de 200 L, filtré à 50 µm, désinfecté aux UV-C (dose ≥ 250 mJ/cm², efficace sur Fusarium, Pythium et la plupart des virus en eau claire), puis remélangé à l'eau neuve avant le dosage A/B.
- Le sodium, les chlorures et les sulfates non consommés s'accumulent peu à peu. Quand la CE du drainage dépasse la consigne de plus de 1 mS/cm malgré la dilution, ou quand le sodium dépasse 4 mmol/L à l'analyse, une partie du drainage est évacuée vers la fosse de valorisation (arrosage des haies et des cultures de plein champ extérieures). Avec de l'eau de pluie, cela arrive rarement.
- Les indicateurs suivis chaque jour : volume apporté, volume drainé (balance de drainage), pourcentage de drainage, CE et pH apportés et drainés.

## 5.7 Gestion des bassins (feuilles)

- Volume par bassin : environ 4,2 m³ (16,8 m² x 0,25 m).
- Aération permanente par surpresseur et diffuseurs : oxygène dissous au-dessus de 6 mg/L, alarme sous 5 mg/L.
- La CE baisse au fil des jours (les plantes absorbent) et l'eau s'évapore : l'automate ajoute de la solution neuve et doses A/B pour rester à la consigne.
- Renouvellement partiel (30 %) toutes les 6 à 8 semaines, et vidange complète deux fois par an.
- **Température de solution** : c'est le facteur sanitaire principal. Au-dessus de 22 °C pour le bassin frais, le Pythium s'installe. Moyens : bassins isolés sous les radeaux (polystyrène extrudé sur les côtés), ombrage de la serre, et en saison chaude un petit refroidisseur à eau (pompe à chaleur de 500 W) sur le bassin frais, qui fonctionne en journée sur le solaire.
- Une désinfection UV en dérivation (quelques heures par jour) limite la charge en spores sans stériliser complètement le bassin. Des micro-organismes bénéfiques (Trichoderma, Bacillus) peuvent être apportés après chaque vidange : à tester en mode essai.

## 5.8 Consommation annuelle d'engrais estimée (pilote)

Ordre de grandeur pour 100 m² : 150 à 200 m³ de solution consommée par an, soit environ 120 kg de nitrate de calcium, 60 kg de nitrate de potassium, 25 kg de phosphate monopotassique, 65 kg de sulfate de magnésium, 30 kg de sulfate de potassium, 1 kg de chélate de fer, et quelques centaines de grammes d'oligoéléments. Coût estimé : 300 à 400 $ par an, rendu Lubumbashi.

## 5.9 Calendrier des contrôles

| Fréquence | Contrôle |
|---|---|
| En continu | CE, pH, température, oxygène dissous (bassins), volumes et drainage |
| Chaque jour | Lecture du tableau de bord, vérification des alarmes, contrôle visuel des racines (bassins) |
| Chaque semaine | Mesure manuelle CE et pH, comparaison aux sondes ; nettoyage des préfiltres |
| Toutes les deux semaines | Étalonnage des sondes pH (tampons 4 et 7) et CE (1,41 mS/cm) |
| Chaque mois (1re année) | Analyse de laboratoire de la solution apportée et drainée : macro, oligo, Na, Cl |
| Chaque trimestre | Analyse foliaire d'une culture ; analyse de l'eau d'appoint |
| Chaque semestre | Analyse de métaux lourds sur produits récoltés (argument commercial) |
