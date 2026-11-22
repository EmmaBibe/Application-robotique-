// Accueil : introduction en trois écrans (première visite), puis tableau de bord.
import { store } from '../lib/store.js';
import { fmt } from '../lib/ui.js';

// Illustrations vues de dessus, dans le style de la maquette du simulateur.
const person = (x, y, c, a = 0) => `<g transform="translate(${x} ${y})"><circle r="15" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="2"/><circle r="8" fill="${c}"/><path d="M0 0 L${13 * Math.cos(a)} ${13 * Math.sin(a)}" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></g>`;
const robot = (x, y) => `<g transform="translate(${x} ${y})"><circle r="17" fill="var(--panel)" stroke="var(--accent)" stroke-width="4"/><circle r="6" fill="var(--text)" opacity=".85"/><rect x="12" y="-4" width="9" height="8" rx="2" fill="var(--accent)"/></g>`;
const plate = inner => `<svg viewBox="0 0 320 200" role="img" aria-hidden="true"><rect x="6" y="6" width="308" height="188" rx="18" fill="var(--panel)" stroke="var(--line)"/>
  <g stroke="var(--line)" stroke-width="1" opacity=".7">${Array.from({ length: 9 }, (_, k) => `<path d="M${38 + k * 31} 10V190"/>`).join('')}${Array.from({ length: 5 }, (_, k) => `<path d="M10 ${38 + k * 31}H310"/>`).join('')}</g>${inner}</svg>`;
const flag = (x, y) => `<g transform="translate(${x} ${y})"><circle r="13" fill="var(--accent)" opacity=".18"/><path d="M0 8V-16" stroke="var(--text)" stroke-width="2"/><path d="M0 -16 L13 -11 L0 -6Z" fill="var(--accent)"/></g>`;
const PC = ['#e07a5f', '#81b29a', '#e9c46a', '#5b8fc7', '#b5838d', '#d4a373'];

const ILL = {
  foule: plate(`${flag(282, 100)}${robot(46, 104)}${person(130, 70, PC[0], 1.9)}${person(168, 128, PC[1], 3.6)}${person(205, 58, PC[2], 2.4)}${person(226, 150, PC[3], 4.2)}${person(150, 170, PC[4], 5.6)}${person(250, 92, PC[5], 3.1)}`),
  idees: plate(`${flag(282, 100)}
    <path d="M46 104 C 110 40, 200 40, 282 100" fill="none" stroke="#2aa7ff" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <path d="M46 104 C 110 168, 200 168, 282 100" fill="none" stroke="#a78bfa" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <path d="M46 104 C 120 96, 190 112, 282 100" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round"/>
    <g fill="#f472b6">${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${70 + k * 9}" cy="${118 + k * 2}" r="3"/>`).join('')}</g>
    ${person(170, 126, PC[0], 3.4)}${person(150, 66, PC[3], 1.2)}${robot(46, 104)}`),
  juge: `<svg viewBox="0 0 320 200" role="img" aria-hidden="true"><rect x="6" y="6" width="308" height="188" rx="18" fill="var(--panel)" stroke="var(--line)"/>
    <rect x="34" y="40" width="214" height="30" rx="8" fill="var(--accent)" opacity=".8"/><text x="44" y="60" font-size="14" font-weight="700" fill="#04121a">VIGIE 6 · 86,7 %</text>
    <rect x="34" y="82" width="201" height="30" rx="8" fill="#ffb547" opacity=".85"/><text x="44" y="102" font-size="14" font-weight="700" fill="#04121a">Référence · 81,4 %</text>
    <path d="M34 150 H286" stroke="var(--line)" stroke-width="2"/><path d="M120 140 V160" stroke="var(--faint)" stroke-width="2"/>
    <rect x="148" y="144" width="70" height="12" rx="6" fill="#2aa7ff" opacity=".45"/><circle cx="182" cy="150" r="9" fill="#2aa7ff" stroke="var(--panel)" stroke-width="3"/>
    <text x="120" y="178" font-size="11" fill="var(--faint)" text-anchor="middle">0</text><text x="182" y="178" font-size="11" fill="var(--faint)" text-anchor="middle">+5,3 points</text></svg>`,
};

const SLIDES = [
  ['foule', 'Un robot au milieu des gens', 'VIGIE est un programme qui conduit un petit robot jusqu\'à un drapeau, au milieu de personnes qui marchent sans le regarder. Dix fois par seconde, il doit décider : vitesse, virage.'],
  ['idees', 'Il compare plusieurs idées', 'Au lieu de suivre un seul plan, il en garde plusieurs en tête : des itinéraires différents, un chemin qui sait attendre, une improvisation. Il note chacun, et choisit le moins risqué.'],
  ['juge', 'Et on le juge honnêtement', 'Il est comparé à la meilleure méthode publiée que nous ayons pu reproduire, sur des mondes qu\'il n\'a jamais vus. Ici, tu verras ses réussites, ses échecs, et pourquoi.'],
];

export default function accueil(view) {
  const s = store.get(), P = s.pronostic;
  view.innerHTML = `
    <div class="hero">${ILL.idees}<h1>VIGIE</h1><p>Entre dans la tête d'un robot qui décide : ce qu'il voit, ce qu'il imagine, les idées qu'il compare, et pourquoi il choisit l'une d'elles.</p></div>
    <div class="page">
      <a class="card link" href="#/simulateur?tour=1"><span class="ic">◎</span><span class="tx"><h3>Regarder VIGIE réfléchir</h3><p>Le vrai robot en 3D, avec une visite guidée pas à pas.</p></span><span class="chev">›</span></a>
      <a class="card link" href="#/simulateur?prono=1"><span class="ic">?</span><span class="tx"><h3>Faire un pronostic</h3><p>Avant chaque monde, devine qui atteindra le drapeau.</p></span><span class="chev">›</span></a>
      <a class="card link" href="#/atelier"><span class="ic">⚙</span><span class="tx"><h3>Atelier « et si… ? »</h3><p>Change un réglage de son cerveau et regarde ce que ça donne.</p></span><span class="chev">›</span></a>
      <a class="card link" href="#/banc"><span class="ic">▤</span><span class="tx"><h3>Banc de poche</h3><p>Lance ta propre comparaison et juge comme un chercheur.</p></span><span class="chev">›</span></a>
      <a class="card link" href="#/savoir"><span class="ic">✦</span><span class="tx"><h3>Ce qu'on sait, et ce qu'on ne sait pas</h3><p>L'histoire de VIGIE, ses résultats, ses limites.</p></span><span class="chev">›</span></a>
      <h2>Tes pronostics</h2>
      <div class="stats">
        <div class="stat"><b>${P.n ? fmt(100 * P.ok / P.n, 0) + ' %' : '—'}</b><span>réussis (${P.ok} sur ${P.n})</span></div>
        <div class="stat"><b>${P.streak}</b><span>série en cours</span></div>
        <div class="stat"><b>${s.worlds}</b><span>mondes regardés</span></div>
      </div>
    </div>`;
  if (!s.onboarded) showIntro(view);
}

function showIntro(view) {
  let i = 0;
  const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Présentation');
  const draw = () => {
    const [ill, title, text] = SLIDES[i];
    el.innerHTML = `<div class="slide">${ILL[ill]}<h2>${title}</h2><p>${text}</p></div>
      <div class="dots">${SLIDES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="row" style="justify-content:space-between"><button class="btn ghost" data-a="skip">Passer</button><button class="btn primary" data-a="next">${i === SLIDES.length - 1 ? 'C\'est parti' : 'Suivant'}</button></div>`;
  };
  el.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'next' && i < SLIDES.length - 1) { i++; draw(); return; }
    store.update(s => { s.onboarded = true; }); el.remove();
  });
  draw(); document.body.appendChild(el);
}
