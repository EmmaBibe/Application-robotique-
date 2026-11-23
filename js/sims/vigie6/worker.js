// Fil de calcul : fait tourner la course sans ralentir l'affichage, et envoie les images par paquets.
import { createRun } from './runner.js';
import { ensureTable } from './risk.js';

let run = null, token = 0;

self.onmessage = e => {
  const m = e.data;
  if (m.type === 'start') {
    const my = ++token;
    const tab = ensureTable();
    self.postMessage({ type: 'table', tab: tab.slice() });
    run = createRun(m.scene, m.seed, m.cond, m.params || {}, m.spec || null, m.tmax || undefined);
    self.postMessage({ type: 'info', info: run.info, initial: run.initial });
    const pump = () => {
      if (my !== token) return;
      const batch = [], t0 = Date.now();
      while (!run.done && Date.now() - t0 < 40) { const f = run.step(); if (f) batch.push(f); }
      if (batch.length) self.postMessage({ type: 'frames', frames: batch });
      if (run.done) self.postMessage({ type: 'done' });
      else setTimeout(pump, 0);
    };
    pump();
  } else if (m.type === 'stop') { token++; run = null; }
};
