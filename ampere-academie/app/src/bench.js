/* Ampère Académie — banc de schéma réutilisable (Atelier, leçons, défis).
 * AA.bench(host, circuitId, opts) -> { sim, view, st, destroy }
 * opts : meter (affiche le multimètre), overload (bouton de surcharge), fault {id,f}, noInterlock,
 *        faults (liste de pannes), tools (boutons en plus), onAct, onProbe, height */
(function () {
  'use strict';
  const { Sim } = window.AASim;
  const { SchemaView } = window.AASchema;

  AA.bench = function (host, cid, o) {
    o = o || {};
    const circ = window.AACircuits.C[cid];
    const sim = new Sim(circ);
    (o.faults || (o.fault ? [o.fault] : [])).forEach(f => sim.setFault(f.id, f.f));
    if (o.noInterlock) { sim.setFault('KM1.21', 'stuck'); sim.setFault('KM2.21', 'stuck'); }
    const st = { lastV: null, lastPair: null, lastAct: null, wasRunning: false, didTrip: false, measures: 0, actions: 0, rDanger: 0 };
    const hasMotor = !!circ.parts.find(p => p.type === 'motor3');
    host.innerHTML = `<div class="wb-main"${o.height ? ` style="height:${o.height}"` : ''}>
      <div class="wb-tools">
        <div class="seg" role="tablist">
          <button class="on" data-mode="operate" title="Manœuvrer les appareils">${AA.ic.hand}<span>Manœuvrer</span></button>
          <button data-mode="meter" title="Mesurer avec le multimètre">${AA.ic.meter}<span>Multimètre</span></button>
        </div>
        <button class="btn sm ghost on" data-act="pot" title="Colorer les conducteurs selon leur potentiel">${AA.ic.eye}<span class="m-hide">Potentiels</span></button>
        ${o.overload && hasMotor ? `<button class="btn sm" data-act="overload">${AA.ic.flame}<span>Surcharger le moteur</span></button>` : ''}
        ${o.tools || ''}
        <span class="spacer"></span>
        <button class="btn sm ghost icon" data-act="reset" title="Remettre au repos">${AA.ic.reset}</button>
        <button class="btn sm ghost icon" data-act="fit" title="Recadrer">${AA.ic.fit}</button>
      </div>
      <div class="wb-canvas"></div>
      <div class="meter" hidden>
        <div class="lcd"><small class="mode">V∿</small><span class="val">- - -</span></div>
        <div class="dial"><button class="on" data-m="V">V</button><button data-m="R">Ω</button></div>
        <div class="hint">Clique deux points de test : COM puis V</div>
      </div>
      <div class="bench-hint">Clic : appuyer · Maj+clic ou double-clic : maintenir enfoncé · molette : zoom</div>
    </div>`;
    const canvas = host.querySelector('.wb-canvas');
    const meter = host.querySelector('.meter');
    let mmode = 'V';
    const view = new SchemaView(canvas, sim, {
      showFaults: !!o.showFaults,
      onProbe: pr => {
        if (pr.length === 2) { st.measures++; st.lastPair = [pr[0].net, pr[1].net]; measure(); if (o.onProbe) o.onProbe(st); }
        else meter.querySelector('.val').textContent = '- - -';
      },
      onPick: id => { if (o.onPick) o.onPick(id); }
    });
    function measure() {
      if (!st.lastPair) return;
      const r = sim.measure(st.lastPair[0], st.lastPair[1], mmode);
      const lcd = meter.querySelector('.lcd');
      lcd.classList.toggle('danger', !!r.danger);
      meter.querySelector('.mode').textContent = mmode === 'R' ? 'Ω' : (r.ac === false ? 'V⎓' : 'V∿');
      meter.querySelector('.val').textContent = r.danger ? '⚠ U>0' : r.text;
      if (mmode === 'V') st.lastV = r; else st.lastR = r;
      if (r.danger && !st._dangerShown) { st.rDanger++; st._dangerShown = true; AA.toast('<b>Ohmmètre sous tension !</b> Mesure fausse et appareil en danger. Consigne d\'abord.', 'bad'); }
      if (!r.danger) st._dangerShown = false;
      if (r.beep) AA.click(2400, 0.08);
    }
    const off = sim.on((type, d) => {
      if (type === 'act') { st.lastAct = String(d.id).split(/[.:]/)[0]; st.actions++; AA.click(d.down === false ? 900 : 1500, 0.03); }
      if (type === 'trip') { st.didTrip = true; AA.toast(`<b>${AA.esc(d.id)}</b> a déclenché (${AA.esc(d.why)})`, 'bad'); AA.click(220, 0.18); }
      if (o.onAct) o.onAct(type, d, st);
    });
    const tick = setInterval(() => {
      if (!host.isConnected) { destroy(); return; }
      if (sim.motor.M1 && sim.motor.M1.state === 'run') st.wasRunning = true;
      if (st.lastPair && view.probe.length === 2) measure();
      if (o.onTick) o.onTick(sim, st);
    }, 120);
    host.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
      host.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
      view.setMode(b.dataset.mode);
      meter.hidden = b.dataset.mode !== 'meter';
    }));
    meter.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
      mmode = b.dataset.m; meter.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); measure();
    }));
    host.querySelector('[data-act=pot]').addEventListener('click', e => {
      const b = e.currentTarget; b.classList.toggle('on'); view.svg.classList.toggle('show-pot', b.classList.contains('on'));
    });
    host.querySelector('[data-act=reset]').addEventListener('click', () => { sim.resetAll(); });
    host.querySelector('[data-act=fit]').addEventListener('click', () => view.fit());
    const ov = host.querySelector('[data-act=overload]');
    if (ov) ov.addEventListener('click', () => {
      const f = sim.byId.F2 && sim.byId.F2.fault === 'overload';
      sim.setFault('F2', f ? null : 'overload');
      ov.classList.toggle('on', !f);
      ov.querySelector('span').textContent = f ? 'Surcharger le moteur' : 'Surcharge en cours…';
    });
    if (o.meter) host.querySelector('[data-mode=meter]').click();
    function destroy() { clearInterval(tick); off(); view.destroy(); }
    return { sim, view, st, destroy, host };
  };

  /* Liste de missions vérifiées en direct sur un banc */
  AA.taskList = function (wrap, bench, tasks, onDone) {
    let i = 0, finished = false;
    wrap.innerHTML = `<div class="tasks card"><p class="eyebrow">Missions</p><ol>${tasks.map((t, k) => `<li data-k="${k}"><span class="st"></span>${t.t}</li>`).join('')}</ol></div>`;
    const lis = [...wrap.querySelectorAll('li')];
    const paint = () => lis.forEach((li, k) => { li.classList.toggle('done', k < i); li.classList.toggle('cur', k === i); });
    paint();
    const t = setInterval(() => {
      if (!wrap.isConnected) { clearInterval(t); return; }
      if (finished) return;
      const task = tasks[i];
      let ok = false;
      try { ok = task.ok(bench.sim, bench.st); } catch (e) { ok = false; }
      if (ok) {
        i++; paint(); AA.click(1800, 0.06);
        bench.st.lastAct = null;
        if (i >= tasks.length) { finished = true; wrap.querySelector('.tasks').classList.add('all'); if (onDone) onDone(); }
      }
    }, 150);
    return { get done() { return finished; }, get count() { return i; } };
  };
})();
