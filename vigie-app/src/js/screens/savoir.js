// Ce qu'on sait, et ce qu'on ne sait pas : VIGIE en une page, son histoire, ses résultats, ses limites.
// Tous les chiffres viennent du journal de recherche (recherche/planificateur/JOURNAL.md).
import { GLOSSAIRE } from '../sims/vigie3d/explain.js';

const sec = (title, html, open = false) => `<details class="sec" ${open ? 'open' : ''}><summary>${title}</summary><div>${html}</div></details>`;

export default function savoir(view) {
  view.innerHTML = `<div class="page">
    <h1>Ce qu'on sait, et ce qu'on ne sait pas</h1>
    <p class="lead">L'histoire de VIGIE, racontée avec ses réussites et ses erreurs. Tous les chiffres viennent du journal de recherche, essai par essai.</p>
    ${sec('VIGIE en une page', `
      <p>VIGIE conduit un robot à deux roues (25 kg, 1,5 m/s au plus) jusqu'à un drapeau, parmi des personnes qui ne le voient pas. Dix fois par seconde :</p>
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
      <div class="tl ko"><b>La grande correction</b><span>Séance 7</span><p>En relisant les publications, on découvre que la « référence » utilisée depuis le début était mal attribuée, et plus faible que la vraie méthode publiée. Une fois les vraies références codées et réglées avec le même soin, l'avance de VIGIE 3 disparaît. On l'a dit, et on est reparti de là.</p></div>
      <div class="tl"><b>VIGIE 6</b><span>Séance 7</span><p>On étudie monde par monde où il perd. Trois corrections : la probabilité de collision de DRA-MPPI, une même carte pour ses deux planificateurs, la règle de cohérence de T-MPC ; puis l'improvisation parmi ses options. Sur 40 mondes neufs : 86,7 % contre 81,4 % pour la meilleure référence, +5,3 points, écart significatif.</p></div>
    </div>`)}
    ${sec('Les résultats d\'aujourd\'hui', `
      <table><thead><tr><th>Sur 40 mondes neufs (2 640 essais)</th><th>Réussite</th><th>Collisions en roulant</th></tr></thead><tbody>
        <tr><td><b>VIGIE 6</b></td><td><b>86,7 %</b></td><td><b>10,7 %</b></td></tr>
        <tr><td>DRA-MPPI (2025), la référence</td><td>81,4 %</td><td>15,9 %</td></tr></tbody></table>
      <p>Écart : <b>+5,3 points</b>, intervalle de confiance à 95 % de +2,8 à +8,0 ; 95 mondes gagnés, 48 perdus. Plus forts gains : porte étroite (+22,5), angles morts (+13,8), traversée (+11,2).</p>
      <p>La version de cette application, réécrite pour ton téléphone, retrouve le même avantage : +4,3 points sur 1 760 essais (intervalle de +1,9 à +6,8).</p>
      <p class="small muted">T-MPC++, l'autre référence, n'a pas couru dans cette validation : sur la série de mondes précédente, il faisait jeu égal avec DRA-MPPI (81,7 % contre 81,5 %).</p>
      <p class="small muted">Prochaine étape : l'évaluation finale sur 100 mondes jamais utilisés, avec des piétons qui voient le robot et d'autres qui ne le voient pas.</p>`)}
    ${sec('Les idées essayées, puis abandonnées', `
      <table><thead><tr><th>Idée</th><th>Ce qui s'est passé</th></tr></thead><tbody>
        <tr><td>Une incertitude qui s'adapte à chaque personne</td><td>Le robot se figeait : −17,5 points.</td></tr>
        <tr><td>Des personnes imaginées derrière les angles morts, dans le calcul du risque</td><td>Prometteur sur 20 essais, sans effet sur 880 : le hasard des petits échantillons.</td></tr>
        <tr><td>L'incertitude du filtre de suivi dans le risque</td><td>Une personne qui vient d'apparaître paraît menaçante partout : −15,2 points.</td></tr>
        <tr><td>Une règle du code de la route aux carrefours</td><td>+2 points pendant la mise au point, rien sur des mondes neufs.</td></tr>
        <tr><td>Un modèle interne des roues</td><td>Pas de gain significatif.</td></tr></tbody></table>
      <p>Abandonner une idée, c'est aussi un résultat : chacune a été jugée sur des mondes qu'elle n'avait pas vus, avec une règle de décision écrite avant l'essai.</p>`)}
    ${sec('Les méthodes de référence', `
      <p><b>DRA-MPPI</b> — Trevisan et al., IROS 2025. Un MPPI qui calcule la probabilité de collision avec plusieurs personnes à la fois. La référence officielle de nos comparaisons.</p>
      <p><b>T-MPC++</b> — de Groot, Ferranti, Gavrila et Alonso-Mora, IEEE Transactions on Robotics, 2024. Plusieurs trajectoires de « classes » différentes optimisées en parallèle, avec une préférence pour la classe déjà suivie. VIGIE lui a emprunté cette règle de cohérence, et l'idée d'une option sans route imposée.</p>
      <p><b>OA-MPC</b> — Firoozi et al., IEEE Transactions on Control Systems Technology, 2025. Navigation sûre avec des personnes cachées : une piste pour les angles morts.</p>
      <p class="small muted">Les deux premières ont été recodées d'après leurs publications, avec la liste des adaptations, et réglées avec le même effort que VIGIE.</p>`)}
    ${sec('Les mots à connaître', `<dl class="gl">${GLOSSAIRE.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`)}
    ${sec('Les limites, sans détour', `<ul>
      <li><b>Tout est en simulation.</b> Le robot simulé a des moteurs, une inertie et des mesures en retard, mais aucun essai n'a encore été fait sur un vrai robot.</li>
      <li><b>Les personnes ne voient pas le robot</b> dans la plupart des essais : c'est plus dur que la réalité. L'évaluation finale ajoutera des personnes qui l'évitent.</li>
      <li><b>Aux angles morts, quand la vue est limitée</b>, VIGIE reste fragile : tu peux le voir dans le simulateur.</li>
      <li><b>Ses briques ne sont pas inventées de zéro</b> : routes multiples (T-MPC), probabilité de collision (DRA-MPPI), zones cachées (OA-MPC). Ce qui est propre à VIGIE, c'est leur combinaison et la façon dont elle a été mesurée.</li>
      <li>Le chemin qui sait attendre est un guide géométrique : la commande l'adapte ensuite à ce que le robot peut faire.</li></ul>`)}
    ${sec('Comment cette application calcule', `
      <p>Le simulateur, l'Atelier et le Banc font tourner les mêmes programmes que le banc de recherche : VIGIE 6, DRA-MPPI, le robot réaliste, le suivi des personnes et les onze scènes, réécrits en JavaScript. 33 tests vérifient que, pour les mêmes entrées, ils prennent les mêmes décisions qu'en Python, au millionième près, et que les réglages de l'Atelier font exactement ce qu'ils annoncent. Les mondes sont tirés au hasard selon les mêmes règles que le banc.</p>
      <p>Tout se calcule sur ton téléphone, hors ligne. Rien n'est envoyé ailleurs.</p>`)}
  </div>`;
}
