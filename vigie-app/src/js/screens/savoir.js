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
      <div class="tl"><b>Toutes les difficultés, et le C++</b><span>Séance 8</span><p>On cumule tout ce qui peut mal tourner sur un vrai robot, puis on compte aussi son temps de réflexion. VIGIE garde son avance sur DRA-MPPI tant que le calcul ne compte pas, et la perd quand ses calculs en Python le ralentissent. Réécrit en C++, il prend les mêmes décisions, environ dix fois plus vite ; à ce rythme, il retrouve l'essentiel de son avance (+2,9 points), sans qu'elle soit démontrée.</p></div>
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
      <p class="small muted">Ce que coûte VIGIE : 51 ms de calcul par décision en médiane, contre 7 ms pour DRA-MPPI et 87 ms pour T-MPC++, sur un ordinateur de bureau. Avec 400 trajectoires au lieu de 912, il descend à 37 ms sans perte mesurable.</p>
      <h3>Toutes les difficultés à la fois</h3>
      <p>Sur un vrai robot, les ennuis se cumulent. On les a donc tous réunis sur 60 nouveaux mondes par scène, soit 660 mondes : vue limitée à 5 m et masquée par les obstacles, une détection sur dix perdue, mesures en retard, roues qui patinent, carte inconnue au départ, piétons qui réagissent au robot. Puis on a rejoué les mêmes mondes en comptant le temps de calcul : tant que le programme réfléchit, le robot garde sa dernière commande. Quatre méthodes, deux façons de compter : 660 × 4 × 2 = 5 280 essais.</p>
      <table><thead><tr><th>Toutes les difficultés</th><th>Sans compter le calcul</th><th>En comptant le calcul (Python)</th></tr></thead><tbody>
        <tr><td>T-MPC++</td><td>85,5 %</td><td>76,5 %</td></tr>
        <tr><td><b>VIGIE 6</b></td><td><b>84,5 %</b></td><td><b>82,1 %</b></td></tr>
        <tr><td>VIGIE 6 à 400 trajectoires</td><td>83,5 %</td><td>81,4 %</td></tr>
        <tr><td>DRA-MPPI</td><td>81,2 %</td><td>81,8 %</td></tr></tbody></table>
      <p>Sans compter le calcul, VIGIE garde <b>+3,3 points</b> sur DRA-MPPI (de +0,3 à +6,5, significatif) et fait jeu égal avec T-MPC++ (−0,9, de −3,8 à +2,1). En comptant le calcul, son avance sur DRA-MPPI disparaît (+0,3, de −2,7 à +3,3) : en Python, certaines de ses décisions prennent près d'une demi-seconde et le robot roule pendant ce temps sur une commande périmée. T-MPC++, le plus lent des trois en Python, perd 8,9 points ; VIGIE le devance alors de 5,6 points, mais cet écart mesure la lenteur des programmes plus que les méthodes : on ne le présente pas comme une victoire.</p>
      <h3>VIGIE en C++</h3>
      <p>VIGIE 6 a été réécrit en C++ pour un robot réel. Sur 7 827 décisions enregistrées dans les onze scènes et les trois conditions, il donne la même commande que la version de cette application à moins d'un milliardième près. Sur un cœur d'ordinateur de bureau, il décide en 6 ms en moyenne et en 40 ms dans le pire cas (en Python, le pire cas d'un trajet tourne autour de 450 ms), loin sous le dixième de seconde dont il dispose. Avec 400 trajectoires au lieu de 912 : 3 ms en moyenne, 32 ms au pire.</p>
      <h3>Au rythme du C++</h3>
      <p>On a rejoué les mêmes 660 mondes, toutes difficultés réunies, avec un retard de calcul fixe pour tout le monde : 50 ms (le pire cas du C++ sur ordinateur de bureau), puis 100 ms (un calculateur embarqué plus lent). 5 280 essais de plus.</p>
      <table><thead><tr><th>Toutes les difficultés</th><th>Retard 50 ms</th><th>Retard 100 ms</th></tr></thead><tbody>
        <tr><td>T-MPC++</td><td>82,4 %</td><td>80,2 %</td></tr>
        <tr><td>VIGIE 6</td><td>82,7 %</td><td>80,3 %</td></tr>
        <tr><td>VIGIE 6 à 400 trajectoires</td><td>83,6 %</td><td>81,7 %</td></tr>
        <tr><td>DRA-MPPI</td><td>79,8 %</td><td>78,8 %</td></tr></tbody></table>
      <p>VIGIE 6 retrouve l'essentiel de son avance sur DRA-MPPI : <b>+2,9 points à 50 ms</b>, contre +0,3 avec les temps du Python. Mais l'intervalle touche zéro (de −0,2 à +5,9) : ce n'est pas démontré. À 100 ms, l'avance tombe à +1,5 (de −1,5 à +4,5). La version à 400 trajectoires est la seule dont l'avance reste significative à 50 ms : +3,8 (de +0,6 à +7,1). Le retard étant le même pour tous, ce n'est pas sa vitesse qui joue : elle encaisse mieux le retard, sans qu'on sache encore pourquoi.</p>
      <p class="small muted">T-MPC++ n'a pas été réécrit en C++ : on lui a donné le même retard par hypothèse. C'est lui qui en souffre le plus (−3,0 puis −5,3 points), d'où l'égalité avec VIGIE ; on ne la présente pas comme une victoire.</p>
      <h3>Des mondes corrigés, des piétons qui s'évitent</h3>
      <p>Une relecture extérieure a trouvé un défaut dans nos mondes : les piétons traversaient les obstacles fixes, et certains démarraient dedans. On a corrigé (placement vérifié, piétons qui glissent le long des obstacles) puis rejoué la comparaison sur 660 mondes neufs, sans retoucher aucune méthode. Puis on a refait marcher les mêmes piétons selon un second modèle, celui des forces sociales, où chacun évite les autres et les obstacles. 5 940 essais pour chaque modèle.</p>
      <table><thead><tr><th>Mondes corrigés</th><th>Piétons simples</th><th>Forces sociales</th></tr></thead><tbody>
        <tr><td>VIGIE 6</td><td>88,9 %</td><td>78,9 %</td></tr>
        <tr><td>T-MPC++</td><td>87,6 %</td><td>79,9 %</td></tr>
        <tr><td>DRA-MPPI</td><td>85,5 %</td><td>76,6 %</td></tr></tbody></table>
      <p>L'avance sur DRA-MPPI <b>tient dans les deux cas</b> : +3,4 points (de +1,9 à +4,9) avec les piétons simples, presque autant que sur les anciens mondes, et +2,3 (de +0,5 à +4,1) avec les forces sociales. Face à T-MPC++, c'est toujours l'égalité : +1,4 puis −1,1, sans écart significatif. VIGIE heurte le moins souvent dans les deux cas.</p>
      <p>Deux leçons. Aux carrefours, une partie de l'avance de VIGIE venait des personnes qui sortaient des murs : sur les mondes corrigés, il n'y fait plus que jeu égal avec DRA-MPPI. Et avec les forces sociales, la porte étroite devient très difficile : un flux continu la traverse, occupée 86 % du temps. VIGIE y tombe à 33 % de réussite, surtout parce qu'il attend une ouverture qui ne vient pas, alors que T-MPC++ se faufile (67 %). C'est le défaut que le prochain chantier doit corriger.</p>`)}
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
    ${sec('Fiche technique, pour un relecteur', `
      <p>Tout ce qu'il faut pour vérifier ou contester les chiffres de cette page. Le détail, essai par essai, est dans le dépôt de recherche (<code>recherche/planificateur</code>) : journal (<code>JOURNAL.md</code>), plans écrits avant chaque campagne (<code>PLAN_SEANCE7.md</code>, <code>PLAN_SEANCE8.md</code>), fichiers de résultats bruts (<code>final_seance7.csv</code>, <code>seance8_tout.csv</code>).</p>
      <h3>Le monde simulé</h3>
      <ul>
        <li>Arène de 20 m × 20 m, arrivée atteinte à moins de 0,5 m, 45 s au plus par trajet. Trois issues : arrivé, collision, temps dépassé.</li>
        <li>Robot à deux roues de 25 kg, rayon 0,3 m, 1,5 m/s et 2 rad/s au plus. Une décision tous les dixièmes de seconde ; la physique tourne à 100 Hz : commande transmise avec 50 ms de retard, régulateur sur chaque roue, masse et inertie.</li>
        <li>Personnes mesurées avec un bruit de 5 cm, suivies par un filtre de Kalman qui estime leur vitesse et continue de prédire celles qui disparaissent un instant.</li>
        <li>Onze scènes : forêt d'obstacles, carrefour, couloir, piège en U, foule, foule dense, carrefour rapide, traversée, porte étroite, angles morts, poursuite. Chaque monde est tiré au hasard à partir d'un numéro (graine), le même pour toutes les méthodes.</li>
      </ul>
      <h3>Les conditions</h3>
      <ul>
        <li><b>Vision complète</b> ; <b>perception limitée</b> (5 m, masquage par les obstacles, une détection sur dix perdue) ; <b>piétons qui réagissent</b> au robot.</li>
        <li><b>Toutes les difficultés</b> : les trois ensemble, plus deux périodes de retard des mesures, des roues qui patinent (erreur de gain et dérive tirées par monde) et une carte découverte en roulant.</li>
        <li><b>En comptant le calcul</b> : le planificateur n'est rappelé que lorsqu'il a fini ; s'il est occupé, le robot garde sa dernière commande, qui prend effet 50 ms plus le temps de calcul mesuré. Temps mesurés sur nos programmes Python, un processus par cœur.</li>
      </ul>
      <h3>Les méthodes comparées</h3>
      <ul>
        <li><b>VIGIE 6</b> : jusqu'à quatre options guidées (trois itinéraires et un chemin dans l'espace et le temps, recalculés une décision sur dix), 128 trajectoires chacune, plus une option libre à 400 trajectoires : au plus 912 trajectoires par décision, sur un horizon de 2,5 s. L'option déjà suivie reçoit un bonus de cohérence (× 0,75).</li>
        <li><b>DRA-MPPI</b> (Trevisan et al., 2025) et <b>T-MPC++</b> (de Groot et al., 2024) : recodés d'après leurs publications, pas à partir du code de leurs auteurs, avec la liste des adaptations, et réglés avec le même effort que VIGIE. Toutes les méthodes reçoivent les mêmes mesures, la même mémoire de carte et la même compensation du retard (prédicteur de Smith).</li>
      </ul>
      <h3>Comment on juge</h3>
      <ul>
        <li>Mondes de jugement jamais utilisés pendant la mise au point : graines 5000 à 5099 pour l'évaluation finale (100 mondes × 11 scènes × 3 conditions × 4 méthodes = 13 200 essais), 6000 à 6059 pour « toutes les difficultés » (5 280 essais), 8000 à 8059 pour les mondes corrigés (5 940 essais par modèle de piétons).</li>
        <li>Comparaisons appariées, monde par monde ; intervalle de confiance à 95 % par bootstrap (4 000 rééchantillonnages des mondes). Un écart est dit significatif quand l'intervalle exclut zéro.</li>
        <li>Règles de décision écrites avant chaque campagne, dans les fichiers de plan. La règle actuelle : une variante n'est adoptée que si elle gagne au moins 1 point sur des mondes neufs, sans recul significatif dans aucune condition.</li>
        <li>Vérifications automatiques : plus de 250 tests du banc de recherche ; le programme de cette application prend les mêmes décisions que le banc Python (33 vérifications) ; la version C++ donne la même commande que cette application à moins de 1e-9 près ; les mondes corrigés font bouger les piétons comme le Python, à l'arrondi près.</li>
      </ul>
      <h3>Ce qu'un relecteur doit savoir</h3>
      <ul>
        <li>Les scènes et le modèle de piétons ont été conçus par nous. Jusqu'à l'évaluation finale, les piétons traversaient les obstacles fixes dans le carrefour, le carrefour rapide, le couloir et le piège en U, et certains démarraient dedans (signalé par une relecture extérieure). Les mondes corrigés (version 2) vérifient le placement et font glisser les piétons le long des obstacles ; c'est la version de cette application. L'avance sur DRA-MPPI a été vérifiée sur ces mondes et avec un second modèle de piétons (forces sociales) ; les anciens résultats restent publiés tels quels. Dans la condition réactive, ceux qui réagissent sont fixés par leur rang dans la scène, les mêmes pour toutes les méthodes.</li>
        <li>Le suivi reçoit des positions bruitées et estime lui-même les vitesses, mais l'identité de chaque personne lui est donnée : il ne se trompe jamais de personne. La position du robot est recalée sur sa vraie position, avec du bruit : ce n'est pas une vraie localisation par lidar.</li>
        <li>Les trajectoires essayées par les planificateurs suivent un modèle simple (le robot obéit tout de suite à la vitesse demandée), alors que le robot simulé a de l'inertie. C'est le même modèle pour toutes les méthodes ; un modèle interne des moteurs (VIGIE 4) n'avait rien apporté.</li>
        <li>Les écarts par scène portent sur 60 à 300 situations : utiles pour repérer des tendances, fragiles un par un, puisque onze scènes sont comparées à la fois.</li>
        <li>Les temps de calcul viennent de programmes Python ; seuls VIGIE et DRA-MPPI ont été réécrits en C++. Le classement « en C++ » face à T-MPC++ n'est pas connu.</li>
        <li>La prudence aux angles morts garde une vitesse plancher de 0,15 m/s, un choix de réglage non optimisé.</li>
      </ul>`)}
    ${sec('Les mots à connaître', `<dl class="gl">${GLOSSAIRE.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`)}
    ${sec('Les limites, sans détour', `<ul>
      <li><b>Tout est en simulation.</b> Le robot simulé a des moteurs, une inertie et des mesures en retard, mais aucun essai n'a encore été fait sur un vrai robot.</li>
      <li><b>Des piétons simulés, pas de vraies personnes.</b> Dans un tiers des essais de l'évaluation finale, la plupart des piétons voient le robot et s'écartent ; aucun modèle ne remplace pour autant de vrais gens.</li>
      <li><b>VIGIE ne bat pas T-MPC++</b> : égalité sur l'évaluation finale et sur les mondes corrigés. Il bat nettement DRA-MPPI, y compris sur les mondes corrigés et avec un second modèle de piétons.</li>
      <li><b>Devant un flux continu</b>, à la porte étroite avec des piétons qui s'évitent entre eux, VIGIE est trop patient : 33 % de réussite contre 67 % pour T-MPC++.</li>
      <li><b>VIGIE calcule plus</b> que DRA-MPPI, environ sept fois plus longtemps. En Python, ses recalculs de route, un cycle sur dix, dépassent le dixième de seconde ; quand ce temps compte et que toutes les difficultés se cumulent, il perd son avance sur DRA-MPPI. En C++, son pire cas tombe à 40 ms sur un ordinateur de bureau ; rejoué avec ce retard, il garde +2,9 points sur DRA-MPPI, mais l'intervalle touche zéro, et à 100 ms il ne reste que +1,5. Sur un calculateur embarqué plus lent, le temps réel reste à mesurer.</li>
      <li><b>Quand toutes les difficultés se cumulent</b>, VIGIE ne fait que jeu égal avec T-MPC++, qui va aussi un peu plus vite (1,35 s par trajet). Il perd nettement face à lui à la poursuite, où quelqu'un suit le robot : −16,7 points sur 60 mondes (de −30 à −3).</li>
      <li><b>Aux angles morts, quand la vue est limitée</b>, VIGIE reste fragile : tu peux le voir dans le simulateur.</li>
      <li><b>Ses briques ne sont pas inventées de zéro</b> : routes multiples (T-MPC), probabilité de collision (DRA-MPPI), zones cachées (OA-MPC). Ce qui est propre à VIGIE, c'est leur combinaison et la façon dont elle a été mesurée.</li>
      <li>Le chemin qui sait attendre est un guide géométrique : la commande l'adapte ensuite à ce que le robot peut faire.</li></ul>`)}
    ${sec('Comment cette application calcule', `
      <p>Le simulateur, l'Atelier et le Banc font tourner les mêmes programmes que le banc de recherche : VIGIE 6, DRA-MPPI, le robot réaliste, le suivi des personnes et les onze scènes, réécrits en JavaScript. 33 tests vérifient que, pour les mêmes entrées, ils prennent les mêmes décisions qu'en Python, au millionième près, et que les réglages de l'Atelier font exactement ce qu'ils annoncent. Les mondes sont tirés au hasard selon les mêmes règles que le banc.</p>
      <p>Dans le simulateur, « Modifier ce monde » permet de déplacer l'arrivée et le départ, de poser ou retirer des obstacles et des personnes (qui marchent, flânent, suivent le robot ou restent immobiles). Le monde dessiné est construit tel quel, sans nouveau tirage, et les deux robots y roulent avec les mêmes programmes que dans les scènes du banc. Un code permet de le garder ou de le partager.</p>
      <p>Tout se calcule sur ton appareil, hors ligne. Rien n'est envoyé ailleurs.</p>`)}
  </div>`;
}
