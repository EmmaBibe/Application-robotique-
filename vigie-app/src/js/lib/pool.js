// Plusieurs fils de calcul pour les campagnes : chaque monde est joué par tous les concurrents, résultats renvoyés au fil de l'eau.
export function runCampaign(jobs, opts = {}) {
  try { return runWorkers(jobs, opts); } catch (e) { console.warn('fils de calcul indisponibles, calcul dans la page', e); return runHere(jobs, opts); }
}

// Solution de secours : mêmes calculs dans la page, par petits morceaux pour garder l'écran réactif.
function runHere(jobs, { onResult, onDone } = {}) {
  let stopped = false;
  (async () => {
    const { createEpisode } = await import('../sims/vigie6/episode.js');
    const { ensureTable } = await import('../sims/vigie6/risk.js'); ensureTable();
    for (const job of jobs) {
      if (stopped) return;
      const res = {};
      for (const c of job.contenders) {
        const ep = createEpisode(job.scene, job.seed, c.which, job.cond, c.params || {});
        while (!ep.outcome) { for (let k = 0; k < 20 && !ep.outcome; k++) ep.step(); await new Promise(r => setTimeout(r, 0)); if (stopped) return; }
        res[c.key] = { out: ep.outcome, t: Math.round(ep.t * 10) / 10 };
      }
      onResult && onResult({ type: 'result', id: job.id, job, res });
    }
    if (!stopped) onDone && onDone();
  })();
  return { stop() { stopped = true; }, workers: 1 };
}

function runWorkers(jobs, { onResult, onDone, workers } = {}) {
  const n = Math.max(1, Math.min(workers || 3, (navigator.hardwareConcurrency || 2) - 1, jobs.length));
  const ws = [], queues = Array.from({ length: n }, () => []);
  jobs.forEach((j, i) => queues[i % n].push(j));
  let idle = 0, stopped = false, got = false, fellBack = false, fb = null;
  for (let k = 0; k < n; k++) {
    const w = new Worker(new URL('../sims/vigie6/campaign-worker.js', import.meta.url), { type: 'module' });
    w.onmessage = e => {
      if (stopped) return;
      if (e.data.type === 'result') { got = true; onResult && onResult(e.data); }
      else if (e.data.type === 'idle') { w.terminate(); if (++idle === n) onDone && onDone(); }
    };
    w.onerror = err => {
      console.error(err); w.terminate();
      if (!got && !fellBack) { fellBack = true; stopped = true; ws.forEach(x => x.terminate()); fb = runHere(jobs, { onResult, onDone }); return; }
      if (++idle === n) onDone && onDone();
    };
    w.postMessage({ type: 'jobs', jobs: queues[k] });
    ws.push(w);
  }
  return { stop() { stopped = true; ws.forEach(w => w.terminate()); if (fb) fb.stop(); }, get workers() { return fellBack ? 1 : n; } };
}
