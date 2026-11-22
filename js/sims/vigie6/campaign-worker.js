// Fil de calcul des campagnes (banc de poche, atelier) : fait courir plusieurs concurrents sur une liste de mondes
// et renvoie, monde par monde, l'issue et la durée de chacun. Mêmes épisodes que le simulateur et le banc de recherche.
import { createEpisode } from './episode.js';
import { ensureTable } from './risk.js';

let token = 0;
self.onmessage = e => {
  const m = e.data;
  if (m.type === 'stop') { token++; return; }
  if (m.type !== 'jobs') return;
  const my = ++token;
  if (m.tab) ensureTable(m.tab); else ensureTable();
  const jobs = m.jobs.slice();
  const next = () => {
    if (my !== token) return;
    const job = jobs.shift();
    if (!job) { self.postMessage({ type: 'idle' }); return; }
    const res = {};
    for (const c of job.contenders) {
      const ep = createEpisode(job.scene, job.seed, c.which, job.cond, c.params || {});
      while (!ep.outcome) ep.step();
      res[c.key] = { out: ep.outcome, t: Math.round(ep.t * 10) / 10 };
    }
    self.postMessage({ type: 'result', id: job.id, job, res });
    setTimeout(next, 0);
  };
  next();
};
