// Réglages : thème, qualité graphique, remise à zéro, à propos.
import { store } from '../lib/store.js';
import { applyTheme } from '../main.js';
import { APP_VERSION, toast } from '../lib/ui.js';

export default function reglages(view) {
  const s = store.get().settings;
  const opt = (v, l, cur) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`;
  view.innerHTML = `<div class="page">
    <h1>Réglages</h1>
    <label class="field"><span>Thème</span><select data-k="theme">${opt('auto', 'Automatique (suit le téléphone)', s.theme)}${opt('dark', 'Sombre', s.theme)}${opt('light', 'Clair', s.theme)}</select></label>
    <label class="field"><span>Qualité graphique du simulateur</span><select data-k="quality">${opt('auto', 'Automatique', s.quality)}${opt('high', 'Élevée (ombres fines, plus de détails)', s.quality)}${opt('eco', 'Économe (pour les téléphones modestes ou la batterie)', s.quality)}</select></label>
    <p class="small muted">La qualité s'applique au prochain monde ouvert dans le simulateur.</p>
    <h2>Mes données</h2>
    <div class="row"><button class="btn" data-a="prono">Remettre à zéro mes pronostics</button><button class="btn" data-a="camp">Effacer mes comparaisons</button><button class="btn" data-a="intro">Revoir la présentation</button></div>
    <p class="small muted">Tout reste sur ce téléphone : pas de compte, pas de publicité, pas d'envoi de données.</p>
    <h2>À propos</h2>
    <div class="card"><p><b>VIGIE</b>, version ${APP_VERSION}. Planificateur VIGIE 6 et référence DRA-MPPI, identiques au banc de recherche de RoboMaster.</p>
      <p>Affichage 3D : three.js (licence MIT). Calculs entièrement locaux, fonctionne hors ligne.</p></div>
  </div>`;
  view.addEventListener('change', e => {
    const k = e.target.dataset.k; if (!k) return;
    store.update(st => { st.settings[k] = e.target.value; });
    if (k === 'theme') applyTheme();
    toast('Réglage enregistré.');
  });
  view.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'prono') { store.reset('pronostic'); toast('Pronostics remis à zéro.'); }
    else if (a === 'camp') { store.update(st => { st.campaigns = []; }); toast('Comparaisons effacées.'); }
    else if (a === 'intro') { store.update(st => { st.onboarded = false; }); location.hash = '#/accueil'; }
  });
}
