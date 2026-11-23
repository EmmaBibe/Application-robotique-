// Ce qu'on sait, et ce qu'on ne sait pas : VIGIE en une page, son histoire, ses résultats, ses limites.
// Tous les chiffres viennent du journal de recherche (recherche/planificateur/JOURNAL.md).
import { GLOSSAIRE } from '../sims/vigie3d/explain.js';

const sec = (title, html, open = false) => `<details class="sec" ${open ? 'open' : ''}><summary>${title}</summary><div>${html}</div></details>`;

export default function savoir(view) {
  view.innerHTML = `<div class="page">
    <h1>Ce qu'on sait, et ce qu'on ne sait pas</h1>
    <p class="lead">L'histoire de VIGIE, racontée avec ses réussites et ses erreurs. Tous les chiffres viennent du journal de recherche, essai par essai.</p>
    ${sec('VIGIE en une page', `
      <p>VIGIE conduit un robot à deux roues (25 kg, 1,5 m/s au plus) jusqu'à un drapeau, parmi des personnes qui, le plus souvent, ne le voient pas. Dix fois par seconde :</p>
      <ol>
        <li><b>Il regarde.</b> Son capteur mesure où sont les personnes ; un filtre estime leur vitesse et continue de suivre celles qui disparaissent un instant.</li>
        <li><b>Il imagine.</b> Il prolonge la marche de chacun sur 2,5 s, avec une incertitude qui grandit, et mesure qui se montre imprévisible.</li>
        <li><b>Il envisage plusieurs idées.</b> Jusqu'à trois itinéraires, un chemin qui sait attendre, une improvisation.</li>
        <li><b>Il les améliore.</b> Pour chaque idée, des centaines de petites variations essayées et notées (méthode MPPI).</li>
        <li><b>Il choisit.</b> La note la plus basse gagne : danger (une vraie probabilité de contact), murs, lenteur, virages. L'itinéraire qu'il suit déjà reçoit un bonus (× 0,75).</li>
        <li><b>Il agit, un dixième de seconde.</b> Puis il recommence. Il compense aussi le retard de ses mesures et ralentit près des angles morts.</li>
      </ol>`, true)}
    ${sec('Son histoire, de VIGIE 1 à VIGIE 6', `<div class="timeline">
      <div class="tl"><b>VIGIE 1</b><span>Séance 2</span><p>Les cinq idées qui donnent son nom : Valeur d'option, Imprévisibilité mesurée pour chaque personne, Gestes réflexes, Inertie d'engagement, Ensemble de routes. Mondes neufs : 96 % de réussite, significativement mieux que MPPI seul (+2,2 points), à égalité avec la référence de l'époque.</p></div>
      <div class="tl"><b>VIGIE 2</b><span>Séance 3</span><p>Quatre routes, virages francs parmi les essais, compensation du retard des mesures (prédicteur de Smith). Aussi sûr que la référence (95 % contre 95 %) et 0,38 s plus rapide, de façon significative.</p></div>
      <div class="tl"><b>VIGIE 3</b><span>Séances 4 à 6</span><p>Robot réaliste (moteurs, inertie, mesures en retard), scènes plus dures. Une route dans l'espace et le temps qui sait attendre, et la prudence aux angles morts. Sur 60 mondes neufs : nettement meilleur à la porte étroite (+10,8 points) et aux angles morts (+11,7), mais pas d'avance globale significative (+1,9).</p></div>
      <div class="tl ko"><b>VIGIE 4 et 5</b><span>Séances 5 et 6</span><p>VIGIE 4 calcule sa vitesse le long de chaque route avec la dynamique du robot et un modèle interne de ses moteurs ; VIGIE 5 ajoute une règle inspirée du code de la route (ne pas s'engager si l'on risque d'être bloqué). Aucun gain confirmé sur des mondes neufs : ni l'un ni l'autre n'est adopté.</p></div>
      <div class="tl ko"><b>La grande correction</b><span>Séance 7</span><p>En relisant les publications, on découvre que la « référence » utilisée depuis le début était mal attribuée, et plus faible que la vraie méthode publiée. Une fois les vraies références codées et réglées avec le même soin, l'avance de VIGIE 3 disparaît sur les mondes de mise au point. On l'a dit, et on est reparti de là.</p></div>
      <div class="tl"><b>VIGIE 6</b><span>Séance 7</span><p>On étudie monde par monde où il perd. Trois corrections : la probabilité de collision de DRA-MPPI, une même carte pour ses deux planificateurs, la règle de cohérence de T-MPC ; puis l'improvisation parmi ses options. Sur 40 mondes neufs : +5,3 points face à la meilleure référence. Puis l'évaluation finale, sur 100 mondes jamais utilisés : 88,9 % de réussite contre 85,1 % pour DRA-MPPI, +3,8 points, écart significatif. T-MPC++ fait jeu égal.</p></div>
    </div>`)}
    ${sec('Les résultats d\'aujourd\'hui', `
      <table><thead><tr><th>Évaluation finale : 100 mondes jamais utilisés (13 200 essais)</th><th>Réussite</th><th>Collisions en roulant</th></tr></thead><tbody>
        <tr><td><b>VIGIE 6</b></td><td><b>88,9 %</b></td><td><b>9,2 %</b></td></tr>
        <tr><td>T-MPC++ (2024)</td><td>88,5 %</td><td>10,9 %</td></tr>
        <tr><td>VIGIE 3</td><td>87,6 %</td><td>10,6 %</td></tr>
        <tr><td>DRA-MPPI (2025), la référence</td><td>85,1 %</td><td>12,6 %</td></tr></tbody></table>
      <p>Face à DRA-MPPI : <b>+3,8 points</b>, intervalle de confiance à 95 % de +2,6 à +5,1 ; 271 situations gagnées, 145 perdues. L'écart est net en vision complète (+4,1) et avec des piétons qui voient le robot (+5,3), mais pas quand la vue est limitée (+2,1, de −0,5 à +4,5). Plus forts gains : couloir (+13,3), porte étroite (+10,0), angles morts (+9,3), traversée (+6,3).</p>
      <p>Face à T-MPC++ : <b>égalité</b>, +0,5 point (de −0,8 à +1,7). VIGIE gagne aux carrefours (+6), T-MPC++ à la porte étroite (+8), et il va 1,9 s plus vite par trajet.</p>
      <p>Deux contrôles demandés par une relecture extérieure. À budget de calcul égal (400 trajectoires essayées par décision chacun), VIGIE garde +4,7 points sur DRA-MPPI : son avance vient de sa conception, pas d'un calcul plus long. Et en vérifiant le trajet entre deux décisions, aucun contact ne passe inaperçu.</p>
      <p>La version de cette application, réécrite pour ton téléphone, retrouve le même avantage : +4,3 points sur 1 760 essais (intervalle de +1,9 à +6,8).</p>
      <p class="small muted">Ce que coûte VIGIE : 51 ms de calcul par décision en médiane, contre 7 ms pour DRA-MPPI et 87 ms pour T-MPC++, sur un ordinateur de bureau. Avec 400 trajectoires au lieu de 912, elle descend à 37 ms sans perte mesurable.</p>
      <p class="small muted">Prochaine étape : réécrire VIGIE en C++ pour qu'elle tienne ses dix décisions par seconde même dans le pire cas, puis la monter sur un prototype.</p>`)}
    ${sec('Les idées essayées, puis abandonnées', `
      <table><thead><tr><th>Idée</th><th>Ce qui s'est passé</th></tr></thead><tbody>
        <tr><td>Une incertitude qui s'adapte à chaque personne</td><td>Le robot se figeait : −17,5 points.</td></tr>
        <tr><td>Des personnes imaginées derrière les angles morts, dans le calcul du risque</td><td>Prometteur sur 20 essais, sans effet sur 880 : le hasard des petits échantillons.</td></tr>
        <tr><td>L'incertitude du filtre de suivi dans le risque</td><td>Une personne qui vient d'apparaître paraît menaçante partout : −15,2 points.</td></tr>
        <tr><td>Une règle du code de la route aux carrefours</td><td>+2 points pendant la mise au point, rien sur des mondes neufs.</td></tr>
        <tr><td>Un modèle interne des roues</td><td>Pas de gain significatif.</td></tr>
        <tr><td>N'apprendre l'imprévisibilité d'une personne que de vraies mesures, pas de ses positions prolongées quand elle est cachée</td><td>Juste sur le principe, mais +0,2 point seulement : sous le seuil fixé d'avance, pas adopté.</td></tr></tbody></table>
      <p>Abandonner une idée, c'est aussi un résultat : chacune a été jugée sur des mondes qu'elle n'avait pas vus, avec une règle de décision écrite avant l'essai.</p>`)}
    ${sec('Les méthodes de référence', `
      <p><b>DRA-MPPI</b> — Trevisan et al., IROS 2025. Un MPPI qui calcule la probabilité de collision avec plusieurs personnes à la fois. La référence officielle de nos comparaisons.</p>
      <p><b>T-MPC++</b> — de Groot, Ferranti, Gavrila et Alonso-Mora, IEEE Transactions on Robotics, 2024. Plusieurs trajectoires de « classes » différentes optimisées en parallèle, avec une préférence pour la classe déjà suivie. VIGIE lui a emprunté cette règle de cohérence, et l'idée d'une option sans route imposée.</p>
      <p><b>OA-MPC</b> — Firoozi et al., IEEE Transactions on Control Systems Technology, 2025. Navigation sûre avec des personnes cachées : une piste pour les angles morts.</p>
      <p class="small muted">Les deux premières ont été recodées d'après leurs publications, avec la liste des adaptations, et réglées avec le même effort que VIGIE.</p>`)}
    ${sec('Les mots à connaître', `<dl class="gl">${GLOSSAIRE.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`)}
    ${sec('Les limites, sans détour', `<ul>
      <li><b>Tout est en simulation.</b> Le robot simulé a des moteurs, une inertie et des mesures en retard, mais aucun essai n'a encore été fait sur un vrai robot.</li>
      <li><b>Des piétons simulés, pas de vraies personnes.</b> Dans un tiers des essais de l'évaluation finale, la plupart des piétons voient le robot et s'écartent ; aucun modèle ne remplace pour autant de vrais gens.</li>
      <li><b>VIGIE ne bat pas T-MPC++</b> : égalité sur l'évaluation finale. Elle bat nettement DRA-MPPI.</li>
      <li><b>VIGIE calcule plus</b> que DRA-MPPI, environ sept fois plus longtemps, et ses recalculs de route, un cycle sur dix, dépassent encore le dixième de seconde dans le programme de recherche.</li>
      <li><b>Aux angles morts, quand la vue est limitée</b>, VIGIE reste fragile : tu peux le voir dans le simulateur.</li>
      <li><b>Ses briques ne sont pas inventées de zéro</b> : routes multiples (T-MPC), probabilité de collision (DRA-MPPI), zones cachées (OA-MPC). Ce qui est propre à VIGIE, c'est leur combinaison et la façon dont elle a été mesurée.</li>
      <li>Le chemin qui sait attendre est un guide géométrique : la commande l'adapte ensuite à ce que le robot peut faire.</li></ul>`)}
    ${sec('Comment cette application calcule', `
      <p>Le simulateur, l'Atelier et le Banc font tourner les mêmes programmes que le banc de recherche : VIGIE 6, DRA-MPPI, le robot réaliste, le suivi des personnes et les onze scènes, réécrits en JavaScript. 33 tests vérifient que, pour les mêmes entrées, ils prennent les mêmes décisions qu'en Python, au millionième près, et que les réglages de l'Atelier font exactement ce qu'ils annoncent. Les mondes sont tirés au hasard selon les mêmes règles que le banc.</p>
      <p>Dans le simulateur, « Modifier ce monde » permet de déplacer l'arrivée et le départ, de poser ou retirer des obstacles et des personnes (qui marchent, flânent, suivent le robot ou restent immobiles). Le monde dessiné est construit tel quel, sans nouveau tirage, et les deux robots y roulent avec les mêmes programmes que dans les scènes du banc. Un code permet de le garder ou de le partager.</p>
      <p>Tout se calcule sur ton appareil, hors ligne. Rien n'est envoyé ailleurs.</p>`)}
  </div>`;
}
