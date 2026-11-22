// Plusieurs fils de calcul pour les campagnes : chaque monde est joué par tous les concurrents, résultats renvoyés au fil de l'eau.
export function runCampaign(jobs, { onResult, onDone, workers } = {}) {
  const n = Math.max(1, Math.min(workers || 3, (navigator.hardwareConcurrency || 2) - 1, jobs.length));
  const ws = [], queues = Array.from({ length: n }, () => []);
  jobs.forEach((j, i) => queues[i % n].push(j));
  let idle = 0, stopped = false;
  for (let k = 0; k < n; k++) {
    const w = new Worker(new URL('../sims/vigie6/campaign-worker.js', import.meta.url), { type: 'module' });
    w.onmessage = e => {
      if (stopped) return;
      if (e.data.type === 'result') onResult && onResult(e.data);
      else if (e.data.type === 'idle') { w.terminate(); if (++idle === n) onDone && onDone(); }
    };
    w.onerror = err => { console.error(err); w.terminate(); if (++idle === n) onDone && onDone(); };
    w.postMessage({ type: 'jobs', jobs: queues[k] });
    ws.push(w);
  }
  return { stop() { stopped = true; ws.forEach(w => w.terminate()); }, workers: n };
}
