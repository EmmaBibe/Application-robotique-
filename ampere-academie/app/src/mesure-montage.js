/* Ampère Académie — mesure analogique sur un montage réel : source continue, deux résistances en série.
 * L'apprenant choisit l'appareil (voltmètre ou ampèremètre), son branchement (en parallèle ou en série),
 * le calibre, puis lit l'échelle et calcule la valeur. Appareil de classe 1,5 : erreur maximale ± 1,5 % du calibre.
 * Valeurs théoriques : I = U / (R1 + R2) ; U2 = U × R2 / (R1 + R2) (appareil supposé parfait). */
(function () {
  'use strict';
  const SIMS = AA.SIMS, css = n => AA.css(n);
  const M = AA.MONTAGE = {};
  M.CAL = [1.5, 5, 15, 50, 150, 500];
  M.E12 = [100, 150, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700];
  M.gen = r => { const U = r.pick([12, 24, 48]), R1 = r.pick(M.E12), R2 = r.pick(M.E12), q = r.pick(['U2', 'I', 'U2', 'I', 'U']); return { U, R1, R2, q }; };
  M.value = c => c.q === 'I' ? c.U / (c.R1 + c.R2) * 1000 : c.q === 'U2' ? c.U * c.R2 / (c.R1 + c.R2) : c.U;
  M.best = v => M.CAL.find(x => x >= v - 1e-9);
  M.reading = (c, dev, wiring) => {
    // ce que mesure réellement l'appareil selon son branchement
    if (dev === 'A' && wiring === 'par') return { err: 'Ampèremètre branché en parallèle : il court-circuite l\'élément. Le fusible de protection de l\'appareil fond (ou l\'appareil est détruit). Un ampèremètre se branche toujours en série.' };
    if (dev === 'V' && wiring === 'ser') return { val: c.U, warn: 'Voltmètre branché en série : sa très grande résistance interne bloque presque tout le courant, il indique pratiquement la tension de la source et le circuit ne fonctionne plus. Un voltmètre se branche en parallèle.' };
    if (c.q === 'I' && dev === 'V') return { val: M.value({ ...c, q: 'U2' }), warn: 'Tu mesures une tension, alors que l\'on te demande un courant.' };
    if (c.q !== 'I' && dev === 'A') return { val: M.value({ ...c, q: 'I' }), warn: 'Tu mesures un courant, alors que l\'on te demande une tension.' };
    return { val: M.value(c) };
  };

  SIMS.anamontage = el => {
    const rng = AA.rng(Date.now() ^ 9191);
    let c = M.gen(rng), dev = 'V', wiring = 'par', cal = 500, needle = 0, vel = 0, last = 0, alive = true;
    el.innerHTML = `<div class="simcard vis-ana"><div class="ana-wrap"><canvas class="ana-cv"></canvas><button class="btn sm ana-big">⤢ Agrandir</button></div>
      <div class="mm-circ"><canvas class="mm-cv"></canvas></div>
      <div class="ana-side"><p class="js-q" style="font-size:15px"></p>
        <div class="row"><div class="field"><label>Appareil</label><div class="seg js-d"><button data-v="V" class="on">Voltmètre</button><button data-v="A">Ampèremètre</button></div></div>
        <div class="field"><label>Branchement</label><div class="seg js-w"><button data-v="par" class="on">En parallèle sur l'élément</button><button data-v="ser">En série dans le circuit</button></div></div></div>
        <div class="field"><label>Calibre</label><div class="ana-cal js-c"></div></div>
        <div class="num-in"><input inputmode="decimal" placeholder="valeur lue"><span class="unit js-u">V</span><button class="btn primary sm js-ok">Vérifier</button><button class="btn sm ghost js-n">Autre montage</button></div><div class="js-fb"></div></div></div>`;
    const cvs = el.querySelector('.ana-cv'), g = cvs.getContext('2d'), cc = el.querySelector('.mm-cv'), g2 = cc.getContext('2d');
    let W = 0, H = 0, W2 = 0, H2 = 0;
    const size = () => { const d = window.devicePixelRatio || 1; let rc = cvs.getBoundingClientRect(); W = rc.width; H = rc.height; cvs.width = W * d; cvs.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); rc = cc.getBoundingClientRect(); W2 = rc.width; H2 = rc.height; cc.width = W2 * d; cc.height = H2 * d; g2.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(size); ro.observe(cvs); ro.observe(cc); size();
    const unit = () => dev === 'A' ? 'mA' : 'V';
    const calBtns = () => { el.querySelector('.js-c').innerHTML = M.CAL.map(x => `<button data-c="${x}" class="${x === cal ? 'on' : ''}">${AA.fmt(x)} ${unit()}</button>`).join(''); el.querySelectorAll('.js-c button').forEach(b => b.onclick = () => { cal = +b.dataset.c; calBtns(); }); el.querySelector('.js-u').textContent = unit(); };
    const question = () => { el.querySelector('.js-q').innerHTML = `Source continue <b>${c.U} V</b>, R1 = <b>${AA.fmt(c.R1)} Ω</b>, R2 = <b>${AA.fmt(c.R2)} Ω</b> en série. À mesurer : <b>${c.q === 'I' ? 'le courant dans le circuit' : c.q === 'U2' ? 'la tension aux bornes de R2' : 'la tension de la source'}</b>.`; };
    const seg = (cls, cb) => el.querySelectorAll(cls + ' button').forEach(b => b.onclick = () => { el.querySelectorAll(cls + ' button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); });
    seg('.js-d', v => { dev = v; cal = 500; calBtns(); }); seg('.js-w', v => { wiring = v; });
    el.querySelector('.ana-big').onclick = e => { const w = el.querySelector('.ana-wrap'); w.classList.toggle('big'); e.target.textContent = w.classList.contains('big') ? '⤡ Réduire' : '⤢ Agrandir'; };
    el.querySelector('.js-n').onclick = () => { c = M.gen(rng); cal = 500; calBtns(); question(); el.querySelector('.js-fb').innerHTML = ''; el.querySelector('input').value = ''; };
    el.querySelector('.js-ok').onclick = () => {
      const rd = M.reading(c, dev, wiring), fb = el.querySelector('.js-fb'), want = M.value(c), wu = c.q === 'I' ? 'mA' : 'V';
      if (rd.err) { fb.innerHTML = `<p class="bad-t">${rd.err}</p>`; return; }
      const v = parseFloat(el.querySelector('input').value.replace(',', '.')), best = M.best(want);
      const small = (AA.VIS.anaScale(cal) === 15 ? 0.25 : 0.1) / AA.VIS.anaScale(cal) * cal;
      const okWire = !rd.warn, okCal = okWire && cal === best, okRead = isFinite(v) && Math.abs(v - rd.val) <= Math.max(small, 0.01) && rd.val <= cal * 1.0001;
      fb.innerHTML = `<p class="${okWire && okCal && okRead ? 'ok-t' : 'bad-t'}">${rd.warn ? rd.warn + ' ' : ''}${okRead ? 'Lecture correcte.' : rd.val > cal ? 'Aiguille en butée : prends un calibre plus grand.' : 'Lecture inexacte.'} ${okWire ? (okCal ? 'Calibre optimal.' : `Calibre non optimal : le plus précis était ${AA.fmt(best)} ${wu}.`) : ''}</p>
        <p class="muted">Valeur théorique : ${AA.fmt(want, 3)} ${wu}. Sur le calibre ${AA.fmt(cal)} ${unit()}, un appareil de classe 1,5 peut se tromper de ± ${AA.fmt(0.015 * cal, 3)} ${unit()}${okWire ? `, soit ± ${AA.fmt(0.015 * cal / want * 100, 1)} % de la valeur mesurée` : ''}. Sur le calibre ${AA.fmt(best)} ${wu} : ± ${AA.fmt(0.015 * best / want * 100, 1)} %. Plus l'aiguille dévie, plus la mesure est précise.</p>`;
    };
    const frame = tm => {
      if (!alive || !cvs.isConnected) { ro.disconnect(); return; }
      const dt = last ? Math.min(0.05, (tm - last) / 1000) : 0; last = tm;
      const rd = M.reading(c, dev, wiring), target = rd.err ? 0 : Math.min(1.05, rd.val / cal);
      vel += ((target - needle) * 60 - vel * 9) * dt; needle += vel * dt; if (needle > 1.05) { needle = 1.05; vel = 0; }
      AA.VIS.anaDraw(g, W, H, needle, dev === 'A' ? 'mA ⎓' : 'V ⎓');
      // schéma du montage et de l'appareil
      g2.clearRect(0, 0, W2, H2); const y1 = 30, y2 = H2 - 30, xa = 40, xb = W2 - 60;
      g2.strokeStyle = css('--ink'); g2.lineWidth = 2;
      const res = (x, y, lbl) => { g2.strokeRect(x - 26, y - 9, 52, 18); g2.fillStyle = css('--ink'); g2.font = '600 12px Segoe UI'; g2.fillText(lbl, x - 12, y - 14); };
      g2.beginPath(); g2.moveTo(xa, y2); g2.lineTo(xa, y1); g2.lineTo(xb, y1); g2.lineTo(xb, y2); g2.lineTo(xa, y2); g2.stroke();
      g2.fillStyle = css('--surface'); g2.fillRect(xa - 12, (y1 + y2) / 2 - 14, 24, 28); g2.strokeRect(xa - 12, (y1 + y2) / 2 - 14, 24, 28); g2.fillStyle = css('--ink'); g2.font = '700 11px Segoe UI'; g2.fillText(c.U + ' V', xa + 16, (y1 + y2) / 2 + 4);
      const r1x = xa + (xb - xa) * 0.35, r2x = xa + (xb - xa) * 0.7;
      g2.fillStyle = css('--surface'); [r1x, r2x].forEach(x => g2.fillRect(x - 26, y1 - 9, 52, 18)); res(r1x, y1, 'R1'); res(r2x, y1, 'R2');
      const mx = dev === 'A' && wiring === 'ser' ? (xa + r1x) / 2 : wiring === 'ser' ? (xa + r1x) / 2 : (c.q === 'U' ? xa + 50 : r2x), col = rd.err ? css('--bad') : rd.warn ? css('--warn') : css('--ok');
      g2.strokeStyle = col; g2.lineWidth = 2;
      if (wiring === 'par') { const xl = c.q === 'U' ? xa : r2x - 32, xr = c.q === 'U' ? xa + 100 : r2x + 32; g2.beginPath(); g2.moveTo(xl, y1); g2.lineTo(xl, y1 + 40); g2.lineTo(xr, y1 + 40); g2.lineTo(xr, y1); g2.stroke(); g2.fillStyle = css('--surface'); g2.beginPath(); g2.arc((xl + xr) / 2, y1 + 40, 14, 0, 7); g2.fill(); g2.stroke(); g2.fillStyle = col; g2.font = '700 13px Segoe UI'; g2.fillText(dev, (xl + xr) / 2 - 5, y1 + 45); }
      else { g2.fillStyle = css('--surface'); g2.beginPath(); g2.arc(mx, y1, 14, 0, 7); g2.fill(); g2.stroke(); g2.fillStyle = col; g2.font = '700 13px Segoe UI'; g2.fillText(dev, mx - 5, y1 + 5); }
      requestAnimationFrame(frame);
    };
    calBtns(); question(); requestAnimationFrame(frame);
    return () => { alive = false; ro.disconnect(); };
  };
  Object.assign(AA.SIMFORM, { anamontage: ['Valeur = (graduation lue / pleine échelle) × calibre', 'I = U / (R1 + R2) ; U2 = U × R2 / (R1 + R2)', 'Erreur maximale (classe 1,5) = ± 1,5 % du calibre : choisir le plus petit calibre qui ne met pas l\'aiguille en butée'] });
  Object.assign(AA.VISMAP, { nmm3l2: [{ sim: 'analog' }, { sim: 'anamontage' }], nmm3l3: [{ sim: 'anamontage' }] });
})();
