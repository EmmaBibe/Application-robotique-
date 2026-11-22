// Simulateur plein écran, avec mode pronostic et code de monde à partager.
import vigie3d from '../sims/vigie3d.js';
import { store } from '../lib/store.js';
import { OUT, fmt, worldCode, parseCode, copy, toast, esc, CONDS, SCENES } from '../lib/ui.js';

const GUESSES = [['deux', 'Les deux'], ['vigie', 'Seulement VIGIE'], ['dra', 'Seulement la référence'], ['aucun', 'Aucun des deux']];
const actual = r => (r.vigie === 'succes' && r.dra === 'succes' ? 'deux' : r.vigie === 'succes' ? 'vigie' : r.dra === 'succes' ? 'dra' : 'aucun');

export default function simulateur(view, params) {
  const s = store.get();
  const fromCode = params.code ? parseCode(params.code) : null;
  const start = fromCode || (params.scene ? { scene: params.scene, seed: +params.seed || 1, cond: params.cond || 'nominal' } : null);
  const atelier = params.atelier === '1' && s.atelierParams ? s.atelierParams : null;
  let prono = params.prono === '1', guess = null, ctrl = null;

  view.innerHTML = `
    <div class="sim-tools">
      <button class="btn ${prono ? 'on' : ''}" data-a="prono" aria-pressed="${prono}">Pronostic : ${prono ? 'oui' : 'non'}</button>
      <button class="btn" data-a="code">Code du monde</button>
      ${atelier ? '<button class="btn on" data-a="official" title="Revenir au VIGIE officiel">Réglages de l\'Atelier · revenir à VIGIE 6</button>' : ''}
    </div>
    <div class="sim-host"></div>`;
  const host = view.querySelector('.sim-host');

  ctrl = vigie3d(host, {
    fill: true, start, params: atelier || {}, quality: s.settings.quality,
    // le premier monde est annoncé pendant la construction du simulateur : on attend qu'il soit prêt
    onWorld: w => { if (prono) setTimeout(() => ask(w), 0); },
    onEnd: r => {
      store.update(st => { st.worlds++; });
      if (prono && guess) reveal(r);
    },
  });
  if (params.tour === '1') setTimeout(() => host.querySelector('.v3d-tourbtn')?.click(), 400);

  // ---------------------------------------------------------------- pronostic
  function overlay(html) {
    let el = ctrl.stage.querySelector('.prono');
    if (!el) { el = document.createElement('div'); el.className = 'prono'; ctrl.stage.appendChild(el); }
    el.innerHTML = `<div class="prono-card">${html}</div>`; el.hidden = false;
    return el;
  }
  const closeOverlay = () => { const el = ctrl.stage.querySelector('.prono'); if (el) el.hidden = true; };
  function ask(w) {
    guess = null; ctrl.pause(); ctrl.setHideOutcomes(true);
    const el = overlay(`<h3>Ton pronostic</h3><p>${esc(SCENES[w.scene])}, ${esc(CONDS[w.cond].toLowerCase())}, monde n° ${w.seed}. Avant de regarder : qui atteindra le drapeau sans rien toucher ?</p>
      <div class="prono-opts">${GUESSES.map(([v, l]) => `<button class="btn" data-g="${v}">${l}</button>`).join('')}</div>`);
    el.onclick = e => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      guess = b.dataset.g; closeOverlay(); ctrl.play();
    };
  }
  function reveal(r) {
    const truth = actual(r), ok = truth === guess;
    store.update(st => {
      const P = st.pronostic; P.n++; if (ok) { P.ok++; P.streak++; P.best = Math.max(P.best, P.streak); } else P.streak = 0;
      P.last = [{ code: worldCode(r), guess, truth }, ...P.last].slice(0, 20);
    });
    ctrl.setHideOutcomes(false);
    const P = store.get().pronostic, label = Object.fromEntries(GUESSES);
    const el = overlay(`<div class="prono-res"><span class="big">${ok ? 'Bien vu !' : 'Raté…'}</span>
      VIGIE : ${OUT[r.vigie]}${r.vigie === 'succes' ? ` en ${fmt(r.tVigie)} s` : ''}.<br>Référence : ${OUT[r.dra]}${r.dra === 'succes' ? ` en ${fmt(r.tDra)} s` : ''}.<br>
      <span class="small muted">Ton choix : ${label[guess].toLowerCase()} · ${P.ok} réussi${P.ok > 1 ? 's' : ''} sur ${P.n} · série : ${P.streak}</span></div>
      <p class="small muted" style="margin:.6rem 0">Fais glisser la chronologie pour revoir les moments clés : c'est souvent là que se joue la différence.</p>
      <div class="row"><button class="btn" data-a="stay">Revoir</button><button class="btn primary" data-a="next">Monde suivant</button></div>`);
    el.onclick = e => {
      const a = e.target.closest('button')?.dataset.a; if (!a) return;
      closeOverlay();
      if (a === 'next') { const w = ctrl.world(); ctrl.load({ ...w, seed: w.seed + 1 }); }
    };
  }

  // ---------------------------------------------------------------- barre d'outils
  view.querySelector('.sim-tools').addEventListener('click', async e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'prono') {
      prono = !prono; e.target.closest('button').classList.toggle('on', prono); e.target.closest('button').textContent = `Pronostic : ${prono ? 'oui' : 'non'}`;
      if (prono) ask(ctrl.world()); else { guess = null; closeOverlay(); ctrl.setHideOutcomes(false); }
    } else if (a === 'official') {
      location.hash = `#/simulateur?code=${worldCode(ctrl.world())}`;
    } else if (a === 'code') {
      const code = worldCode(ctrl.world());
      const el = overlay(`<h3>Code du monde</h3><p>Chaque monde est défini par sa scène, son numéro et sa condition. Partage ce code : n'importe qui retrouvera exactement le même monde dans l'application.</p>
        <div class="code-box"><input value="${code}" aria-label="Code du monde" spellcheck="false" autocapitalize="off"><button class="btn" data-a="copy">Copier</button></div>
        <div class="row" style="margin-top:.7rem;justify-content:flex-end"><button class="btn ghost" data-a="close">Fermer</button><button class="btn primary" data-a="open">Ouvrir ce code</button></div>`);
      el.onclick = async ev => {
        const b = ev.target.closest('button')?.dataset.a; if (!b) return;
        const val = el.querySelector('input').value;
        if (b === 'copy') toast(await copy(val) ? 'Code copié.' : 'Copie impossible : recopie le code à la main.');
        else if (b === 'close') closeOverlay();
        else if (b === 'open') { const w = parseCode(val); if (!w) { toast('Code invalide. Exemple : goulot-3-perception'); return; } closeOverlay(); ctrl.load(w); }
      };
    }
  });

  return () => ctrl && ctrl();
}
