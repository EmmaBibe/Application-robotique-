// Les mots du simulateur : noms des options, phrase « pourquoi ce choix », détail des notes, visite guidée.
// Chaque phrase est construite à partir de valeurs réellement calculées par le robot à cet instant.

export const fmt = (x, d = 1) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = p => p < 0.001 ? 'moins de 0,1 %' : p < 0.01 ? `${fmt(p * 100, 1)} %` : `${fmt(p * 100, 0)} %`;

/** Côté d'un itinéraire, vu depuis le robot qui regarde le drapeau : moyenne de l'écart latéral sur les 8 prochains mètres. */
function side(guide, s, goal) {
  const dx = goal[0] - s[0], dy = goal[1] - s[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  let sum = 0, n = 0;
  for (const p of guide) {
    const rx = p[0] - s[0], ry = p[1] - s[1], along = rx * ux + ry * uy;
    if (along < 0.5 || along > 8) continue;
    sum += ux * ry - uy * rx; n++;
  }
  return n ? sum / n : 0;
}

/** Noms lisibles et couleur (k : 0 tout droit, 1 gauche, 2 droite) de chaque option. */
export function nameOptions(cands, s, goal) {
  const out = cands.map(c => {
    if (c.type === 'libre') return { short: 'Improvisation', long: 'L\'improvisation (sans itinéraire imposé)', k: -1 };
    if (c.type === 'espace-temps') return { short: 'Chemin qui sait attendre', long: 'Le chemin qui sait attendre (planifié dans l\'espace et le temps)', k: -2 };
    const o = side(c.guide || [], s, goal);
    if (Math.abs(o) < 0.6) return { short: 'Tout droit', long: 'L\'itinéraire tout droit', k: 0, o };
    return o > 0 ? { short: 'Par la gauche', long: 'L\'itinéraire par la gauche', k: 1, o } : { short: 'Par la droite', long: 'L\'itinéraire par la droite', k: 2, o };
  });
  // deux itinéraires du même côté : le plus écarté devient « large »
  for (const k of [0, 1, 2]) {
    const same = out.filter(n => n.k === k);
    if (same.length > 1) same.sort((a, b) => Math.abs(b.o) - Math.abs(a.o)).forEach((n, i) => { if (i === 0 && k) { n.short = `Large ${n.short.toLowerCase()}`; n.long = n.long.replace('L\'itinéraire', 'L\'itinéraire large'); } });
  }
  return out;
}

/** Détail de la note d'une option : danger, murs et poteaux, lenteur, virages ; fidélité ; note finale. */
export function noteParts(c, ideal) {
  const lenteur = Math.max(0, c.br.progression - ideal);
  return { danger: c.br.risque, obstacles: c.br.obstacles, lenteur, virages: c.br.virage, fidelite: c.w < 1, score: c.score, J: c.J };
}

const dom = (a, b) => {
  const keys = [['danger', 'moins dangereux'], ['lenteur', 'plus rapide'], ['obstacles', 'plus loin des murs et des poteaux'], ['virages', 'plus direct, avec moins de virages']];
  let best = null, bd = 0;
  for (const [k, txt] of keys) { const d = b[k] - a[k]; if (d > bd) { bd = d; best = txt; } }
  return best;
};

/** La phrase principale : ce que fait VIGIE et pourquoi, à cet instant. */
export function headline(vb, names, robot) {
  if (!vb) return { title: 'VIGIE a terminé.', text: '' };
  if (vb.empty) return { title: 'Aucun itinéraire trouvé : VIGIE s\'arrête.', text: 'Toutes ses routes sont bouchées pour l\'instant ; il attend que la voie se libère.' };
  const i = vb.chosen, ch = vb.cands[i], nm = names[i], P = vb.cands.map(c => noteParts(c, vb.ideal));
  const others = vb.cands.map((c, k) => k).filter(k => k !== i).sort((a, b) => vb.cands[a].score - vb.cands[b].score);
  const runner = others[0];
  let title, text = '';
  if (vb.switched) title = `Il change d'avis : ${nm.long.toLowerCase()}.`;
  else if (ch.w < 1) title = `Il garde le cap : ${nm.long.toLowerCase()}.`;
  else title = `Il choisit ${nm.long.toLowerCase()}.`;
  if (runner !== undefined) {
    const r = vb.cands[runner], why = dom(P[i], P[runner]);
    if (ch.w < 1 && r.J < ch.J) text = `${names[runner].short} aurait été un peu mieux noté, mais pas assez pour changer d'avis : son itinéraire actuel profite du bonus de fidélité (note × 0,75).`;
    else if (vb.switched) text = `Le nouvel itinéraire est nettement meilleur que l'ancien${why ? ` : ${why}` : ''}.`;
    else text = why ? `Par rapport à « ${names[runner].short.toLowerCase()} », c'est ${why}.` : 'Les options sont presque à égalité.';
  }
  const risk = ch.pmax;
  text += ` Sur ce plan, le plus grand risque de contact est de ${pct(risk)}${risk >= 0.001 ? `, dans ${fmt((ch.tmax + 1) * 0.1)} s` : ''}.`;
  if (vb.cap && vb.cap.active) text += ` Il ralentit à ${fmt(vb.cap.vmax)} m/s : quelqu'un pourrait surgir de derrière un obstacle.`;
  return { title, text };
}

export function outcomeWord(o) { return o === 'succes' ? 'arrivé' : o === 'collision' ? 'collision' : o === 'temps' ? 'temps dépassé' : 'en route'; }

// ------------------------------------------------------------------ visite guidée
export const TOUR = [
  { title: 'Voici VIGIE', layers: {}, view: 'maquette', text: 'Le petit robot blanc au liseré turquoise, c\'est <b>VIGIE</b>. Sa mission : rejoindre le <b>drapeau</b> sans toucher personne. Les figurines sont des personnes qui marchent <b>sans le voir</b> : c\'est à lui d\'être prudent. Tout ce que tu vas voir en lumière, ce sont ses pensées.' },
  { title: 'Il regarde, dix fois par seconde', layers: { voit: true }, view: 'maquette', text: 'Son capteur (le petit dôme qui tourne sur son dos) mesure où sont les personnes. Un anneau <span class="v3d-c sense">bleu</span> : il la voit en ce moment. <span class="v3d-c amber">Ambre</span> : il ne la voit plus, mais s\'en souvient et devine où elle est. <span class="v3d-c grey">Gris</span> : il ne sait pas qu\'elle est là. Avec « perception limitée », il ne voit qu\'à 5 m et les obstacles cachent ce qui est derrière.' },
  { title: 'Il imagine l\'avenir', layers: { imagine: true }, view: 'maquette', text: 'Pour chaque personne, il prolonge sa marche tout droit pendant 2,5 secondes. Le halo s\'élargit avec le temps : plus on regarde loin, moins on est sûr. Sa couleur dit si cette personne a été <span class="v3d-c ok">prévisible</span> ou <span class="v3d-c danger">surprenante</span> jusqu\'ici : VIGIE le mesure en comparant ses prévisions à ce qui s\'est passé.' },
  { title: 'Où est le danger ?', layers: { danger: true }, view: 'plan', text: 'Le sol rougit là où le robot aurait une chance de toucher quelqu\'un <b>dans une seconde</b> (le curseur règle cet instant). C\'est une vraie probabilité, la même que celle de DRA-MPPI, mais calculée exactement plutôt que par tirage au sort.' },
  { title: 'Plusieurs idées de chemin', layers: { options: true }, view: 'maquette', text: 'À chaque instant, VIGIE garde plusieurs idées en tête : jusqu\'à <b>trois itinéraires</b> qui contournent les obstacles par des côtés différents, un <span class="v3d-c pink">chemin qui sait attendre</span> (il peut prévoir de s\'arrêter pour laisser passer quelqu\'un) et une <b>improvisation</b> libre. Chaque idée est un plan de 2,5 secondes, dessiné en lumière.' },
  { title: 'Comment il choisit', layers: { options: true }, view: 'maquette', panel: 'decision', text: 'Chaque idée reçoit une note de pénalités : <b>danger</b>, <b>murs et poteaux</b>, <b>lenteur</b> et <b>virages</b>. La plus petite note gagne. Le panneau « Sa décision » montre ces notes en direct ; touche une option pour la voir seule sur la maquette.' },
  { title: 'Il ne change pas d\'avis pour rien', layers: { options: true }, view: 'maquette', panel: 'decision', text: 'Si une idée continue l\'itinéraire qu\'il suivait déjà, sa note est multipliée par <b>0,75</b>. Il ne change donc de route que si l\'autre est nettement meilleure : c\'est ce qui l\'empêche de zigzaguer devant un obstacle. Règle reprise de T-MPC, une méthode publiée en 2024.' },
  { title: 'Des centaines d\'essais', layers: { options: true, essais: true }, view: 'suivre', text: 'Pour améliorer chaque idée, il essaie des centaines de petites variations (128 par itinéraire, 400 pour l\'improvisation), note chacune et fait une moyenne qui favorise les meilleures. C\'est la méthode <b>MPPI</b>. Les fils fins montrent une partie des essais de l\'improvisation : les plus nets sont les mieux notés.' },
  { title: 'Seul le premier pas compte', layers: { options: true }, view: 'suivre', play: true, text: 'Il prévoit 2,5 secondes, mais n\'exécute que le premier dixième de seconde. Puis il regarde à nouveau et recommence tout. Lance la lecture : ses plans se redessinent dix fois par seconde. Ses mesures arrivent aussi avec un léger retard : il le compense en rejouant ses dernières commandes (prédicteur de Smith, 1957).' },
  { title: 'Face à la référence', layers: { options: true }, view: 'maquette', showDra: true, panel: 'compare', text: 'Le robot <span class="v3d-c amber">ambre</span> est <b>DRA-MPPI</b> (2025), la meilleure référence de notre comparaison. Lui n\'a qu\'une idée : l\'improvisation. Dans les passages étroits et les angles morts, avoir plusieurs plans et savoir attendre change tout : sur 100 mondes jamais vus, VIGIE a réussi 88,9 % des trajets contre 85,1 %. Ce n\'est pas le cas dans chaque monde : il en perd aussi.' },
  { title: 'Le temps devient la hauteur', layers: { options: true }, view: 'espace', spaceTime: true, text: 'Vue espace-temps : plus c\'est haut, plus c\'est tard. Chaque personne laisse un <b>tube</b> qui monte et s\'élargit. Un plan qui ne traverse aucun tube est un plan sans collision prévue. Quand le <span class="v3d-c pink">chemin qui sait attendre</span> monte tout droit, c\'est que le robot prévoit d\'attendre sur place.' },
];

export const GLOSSAIRE = [
  ['Planificateur', 'Le programme qui décide, à chaque instant, quelle vitesse et quel virage donner au robot.'],
  ['MPPI', 'Méthode qui essaie des centaines de variations d\'un plan, note chacune, et fait une moyenne qui favorise les meilleures.'],
  ['Probabilité de collision', 'Chance que le robot touche une personne à un instant donné, compte tenu de l\'incertitude sur l\'endroit où elle sera.'],
  ['Itinéraires (routes topologiques)', 'Façons différentes de contourner les obstacles : par la gauche, par la droite, tout droit.'],
  ['Chemin qui sait attendre', 'Plan calculé dans l\'espace et le temps : il peut prévoir de s\'arrêter pour laisser passer quelqu\'un. C\'est un guide géométrique, que la commande adapte ensuite aux possibilités du robot.'],
  ['Bonus de fidélité', 'La note de l\'itinéraire déjà suivi est multipliée par 0,75 : le robot ne change d\'avis que si c\'est nettement mieux.'],
  ['Prudence aux angles morts', 'Derrière un obstacle qui cache une zone, le robot imagine une personne qui pourrait surgir à 1,5 m/s, et roule assez lentement pour pouvoir s\'arrêter avant elle.'],
  ['Prédicteur de Smith', 'Les mesures arrivent avec un peu de retard : le robot rejoue ses dernières commandes pour estimer où il est vraiment.'],
  ['DRA-MPPI', 'La référence : un MPPI qui utilise la probabilité de collision (Trevisan et al., 2025). Une seule option, sans itinéraires ni attente planifiée.'],
];
