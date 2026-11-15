# Journal de recherche : un nouvel algorithme de planification et de suivi

## Séance 1 · 15 novembre 2026

### Point de départ

Objectif fixé : trouver un concept de planification et de suivi de trajectoire plus performant que ce qui existe, en allant chercher des idées dans tous les domaines, puis le tester, le vérifier et le comparer honnêtement aux meilleures méthodes.

### 1. Ce que dit la littérature

La revue complète est dans `CARTOGRAPHIE.md`. À retenir :

- Le domaine est très actif et encombré. Beaucoup d'idées « venues d'ailleurs » ont déjà été essayées : champs de potentiel (électrostatique), fourmis, Physarum, intégrale de chemin (physique statistique, à l'origine de MPPI), bandes élastiques, diffusion.
- La référence récente la plus proche de nos idées est le **MPPI multimodal** (2025) : plusieurs MPPI en parallèle, un par route topologiquement différente.
- L'idée de « garder un début de trajectoire commun tant que le futur est incertain » existe déjà sous les noms de commande **contingente** ou **en branches**, y compris dans une version MPPI (2024).
- Aucune publication repérée n'utilise la règle du τ̇ de la psychologie écologique comme filtre de sécurité d'un MPPI, ni l'accumulation de preuves (modèle de dérive-diffusion) pour choisir entre routes. Absence de résultat ne veut pas dire absence de travaux : une revue plus poussée sera nécessaire avant de revendiquer une nouveauté.

### 2. Le laboratoire

Construit avant toute invention, parce que sans banc d'essai fiable, on ne peut rien affirmer :

- robot unicycle avec limites réalistes d'accélération, bruit d'actionneur et de mesure ;
- 7 scènes, dont des obstacles mobiles qui **changent d'intention sans prévenir** (tourner, s'arrêter, accélérer) et des mobiles plus rapides que le robot ;
- références : A* + poursuite pure, DWA, MPPI, MPPI multimodal ;
- un **oracle** (MPPI qui connaît le futur exact des obstacles) pour mesurer la marge réellement disponible ;
- comparaisons appariées avec intervalles de confiance, et graines d'évaluation jamais utilisées pour régler.

### 3. Les essais

| Version | Idée | Inspiration | Résultat |
|---|---|---|---|
| v1 | routes topologiques + choix par valeur d'option sur 5 futurs + gouverneur τ̇ | topologie, finance (options réelles), météorologie (ensembles), psychologie écologique | **échec** : 81 % de succès contre 96 % pour le MPPI multimodal. Noter chaque échantillon sur tous les futurs rend le robot trop prudent : il hésite, perd du temps, finit par se faire percuter. |
| v2 | futurs qui divergent progressivement, ensemble utilisé seulement pour choisir le mode, hystérésis | idem, plus le modèle de dérive-diffusion | **égalité** avec les références (91 % contre 92 %), mais plus lent |
| v3 | coût en temps avant collision (loi des piétons de Karamouzas) et garde d'atteignabilité | physique des foules, sûreté passive | **pas de gain** significatif ; la garde seule dégrade |
| v4 | feux d'alignement avant les goulets et attention (exploration resserrée près des obstacles) | navigation maritime, attention visuelle | gain apparent qui venait d'un **défaut du banc** (couloirs parfois infranchissables). Après correction, **dégradation** de 10 points |

Le gouverneur τ̇ ne s'est presque jamais déclenché : MPPI garde déjà assez de marge pour que la règle de freinage ne serve pas dans ces scènes.

### 4. Défauts du banc découverts et corrigés en cours de route

1. La graine du bruit de mesure dépendait de `hash()` de Python, qui change à chaque processus : résultats non reproductibles. Corrigé.
2. Quelques couloirs étaient infranchissables (obstacle aléatoire dans l'ouverture). Le générateur vérifie maintenant la faisabilité.
3. Le bruit de mesure consommait le même générateur aléatoire que l'évolution du monde, donc l'oracle ne voyait pas le vrai futur. Corrigé.

Les résultats v1 à v3 ont été obtenus avant ces corrections. Seule la campagne finale ci-dessous fait foi.

### 5. Campagne finale (graines 300 à 329, 7 scènes, 1 680 épisodes)

| Méthode | Succès | Collisions | Temps moyen | Calcul |
|---|---|---|---|---|
| Oracle (connaît le futur) | 99 % | 1 % | 17,5 s | 8 ms |
| MPPI | 94 % | 6 % | 17,8 s | 2 ms |
| Options topologiques v2 | 94 % | 5 % | 21,4 s | 19 ms |
| MPPI multimodal | 93 % | 5 % | 18,7 s | 17 ms |
| MPPI + coût τ (Karamouzas) | 91 % | 8 % | 19,2 s | 11 ms |
| MPPI + feux d'alignement | 84 % | 6 % | 19,6 s | 4 ms |
| DWA | 80 % | 3 % | 14,8 s | 1 ms |
| A* + poursuite pure | 55 % | 45 % | 12,8 s | 1 ms |

Détails par scène dans `resultats_final.md`, graphique dans `succes_final.png`.

### 6. Ce qu'on a appris

**Aucune de nos variantes ne bat MPPI sur l'ensemble des scènes.** C'est le résultat honnête de cette séance.

Mais deux constats orientent la suite :

1. **La marge restante est petite dans ce banc** : l'oracle fait 99 %, MPPI 94 %. Un algorithme parfait en prédiction ne gagnerait que 5 points. Pour qu'une invention puisse montrer sa valeur, il faut des conditions où les méthodes actuelles échouent vraiment.

2. **La valeur d'option dépend du type d'incertitude**, et c'est le résultat le plus intéressant de la séance :
   - dans la **foule errante** (obstacles qui changent souvent de direction au hasard), les options topologiques v2 font **97 % contre 77 %** pour MPPI : +20 points, intervalle de confiance à 95 % [+3 ; +37], 7 mondes gagnés pour 1 perdu ;
   - dans le **carrefour rapide** (obstacles rapides mais prévisibles), elles font **80 % contre 97 %** : −17 points, intervalle [−30 ; −3], 0 gagné pour 5 perdus.

   Garder ses options paie quand le futur est vraiment imprévisible, et coûte cher quand il faut décider vite face à des mobiles prévisibles. La figure `trajectoires_foule_301.png` montre aussi le défaut à corriger : des boucles d'hésitation (41 s au lieu de 16 s).

### 7. Prochaine séance

**Hypothèse à tester (v5) : une valeur d'option qui s'adapte à la prévisibilité mesurée.** Les météorologues vérifient en permanence si l'éventail de leurs prévisions d'ensemble correspond aux erreurs réellement observées. On fera de même : pour chaque obstacle, on mesure en ligne l'erreur entre sa position prédite il y a une seconde et sa position réelle. Si l'obstacle est prévisible, on resserre l'éventail des futurs et le robot décide vite. S'il est erratique, on l'ouvre et le robot garde ses options. Ajouter aussi un coût d'hésitation pour supprimer les boucles.

Critère de réussite fixé à l'avance : faire au moins aussi bien que MPPI dans chaque scène (pas de perte significative) et mieux dans la foule errante, sur des graines neuves.

**Durcir le banc**, pour mesurer là où les méthodes actuelles échouent vraiment :
- perception limitée (portée de 5 m, obstacles masqués derrière d'autres) ;
- carte inconnue au départ ;
- obstacles qui réagissent au robot (évitement réciproque) ;
- latence de 100 à 200 ms entre mesure et commande ;
- glissement des roues, robot plus lent que les obstacles.

**Pistes encore non testées** de la cartographie : paysage de la peur (carte de risque apprise des quasi-collisions), lignes de désir (routes qui se renforcent avec l'usage).
