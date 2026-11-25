/* Ampère Académie — défi « Intervention sur site » : un bon d'intervention regroupe plusieurs équipements en panne
 * (2 à 4 selon le niveau, chacun avec 1 à 3 défauts simultanés). Chaque équipement se dépanne sur son folio vivant
 * (moteur du défi « Diagnostic de panne ») ; la note finale est la moyenne, pénalisée si un équipement est abandonné. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const D = AA.Defis; if (!D || !D.TYPES || !D.TYPES.panne) return;
  const P = D.TYPES.panne, T = AA.TECH;
  const EQUIP = {
    simple: "Éclairage du local technique", vaetvient: "Éclairage du couloir (va-et-vient)", telerupteur: "Éclairage du hall (télérupteur)", double: "Éclairage de l'atelier (double allumage)",
    minuterie: "Minuterie de l'escalier", dol: 'Pompe de relevage', multipostes: 'Convoyeur commandé de deux postes', acoups: "Treuil de levage (approche par à-coups)",
    inversion: 'Porte sectionnelle (deux sens)', etoile: "Ventilateur d'extraction (étoile-triangle)", fdc: 'Chariot de transfert (fins de course)'
  };
  const POOL = lvl => lvl <= 1 ? ['simple', 'vaetvient', 'telerupteur', 'double', 'minuterie'] : lvl === 2 ? ['vaetvient', 'telerupteur', 'minuterie', 'dol', 'multipostes'] : lvl === 3 ? ['telerupteur', 'dol', 'multipostes', 'acoups', 'inversion'] : ['dol', 'multipostes', 'acoups', 'inversion', 'etoile', 'fdc'];
  const NB = lvl => lvl <= 1 ? 2 : lvl <= 3 ? 3 : 4;

  D.TYPES.intervention = {
    name: 'Intervention sur site', icon: 'bug', min: 1,
    desc: "Un bon d'intervention, plusieurs équipements en panne sur le même site, parfois plusieurs défauts par équipement. Plus le niveau monte, plus il y a d'équipements et de défauts, avec un budget de mesures et un temps limité.",
    gen(r, lvl) {
      const cids = r.shuffle(POOL(lvl)).slice(0, NB(lvl));
      const subs = cids.map(cid => P.gen(r, lvl, cid));
      const site = r.pick(T.SITES), who = r.pick(T.WHO);
      return { subs, site, who, lvl, sig: cids.join('-') + subs.map(s => s.faults.map(f => f.id + f.f).join('')).join('|') };
    },
    play(main, inst, done) {
      const res = inst.subs.map(() => null);
      let cur = null, t0 = Date.now();
      main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Intervention sur site</p><h1>Bon d'intervention : ${esc(inst.site)}</h1></div></div><div class="js-list"></div><div class="js-stage"></div>`;
      const list = main.querySelector('.js-list'), stage = main.querySelector('.js-stage');
      const showList = () => {
        if (cur && cur.leave) cur.leave(); cur = null; stage.innerHTML = '';
        const left = res.filter(x => x === null).length;
        list.style.display = '';
        list.innerHTML = `<div class="brief"><b>${esc(inst.who)}</b> ${esc(AA.de(inst.site))} a ouvert un bon pour ${inst.subs.length} équipements. Traite-les dans l'ordre que tu juges le plus pertinent (sécurité et production d'abord) ; chaque équipement se dépanne sur son folio.${inst.subs.some(s => s.faults.length > 1) ? ' <b>Plusieurs défauts</b> peuvent coexister sur un même équipement : le dossier le précise.' : ''}</div>
          <div class="grid g2" style="margin-top:14px">${inst.subs.map((s, i) => `<div class="card"><p class="eyebrow">Équipement ${i + 1}${s.faults.length > 1 ? ` · ${s.faults.length} défauts` : ''}</p><h3>${esc(EQUIP[s.cid] || s.cid)}</h3><p class="muted">« ${esc(s.sy[0] || '')} »</p>
            ${res[i] === null ? `<button class="btn primary sm js-go" data-i="${i}">${ic.bolt}Intervenir</button>` : `<p class="${res[i] >= 50 ? 'ok-t' : 'bad-t'}">Traité — note ${res[i]}</p>`}</div>`).join('')}</div>
          ${left ? '' : final()}`;
        list.querySelectorAll('.js-go').forEach(b => b.onclick = () => open(+b.dataset.i));
        if (!left) done(score());
      };
      const score = () => Math.round(res.reduce((a, b) => a + b, 0) / res.length);
      const final = () => { const m = Math.round((Date.now() - t0) / 60000); return `<div class="result" style="margin-top:14px"><div class="score-big">${score()}</div><p>Intervention terminée en ${m} min environ : ${res.filter(x => x > 0).length}/${res.length} équipement(s) remis en service.</p>
        <p class="muted">Pense au compte rendu : pour chaque équipement, le symptôme constaté, les mesures faites, l'organe remplacé et l'essai de fonctionnement final.</p><div class="row"><a class="btn primary" href="#/defi/intervention/${Date.now()}">Nouvelle intervention</a><a class="btn" href="#/defis">Défis</a></div></div>`; };
      const open = i => {
        list.style.display = 'none';
        stage.innerHTML = `<div class="row" style="margin-bottom:8px"><button class="btn sm ghost js-back">← Bon d'intervention</button><span class="muted">Équipement ${i + 1} / ${inst.subs.length} : ${esc(EQUIP[inst.subs[i].cid] || '')}</span></div><div class="js-p"></div>`;
        const host = stage.querySelector('.js-p');
        stage.querySelector('.js-back').onclick = showList;
        cur = P.play(host, inst.subs[i], s => {
          res[i] = s;
          const row = host.querySelector('.result .row');
          if (row) { row.innerHTML = `<button class="btn primary js-next">Retour au bon d'intervention</button>`; row.querySelector('.js-next').onclick = showList; }
        });
      };
      showList();
      return { leave: () => { if (cur && cur.leave) cur.leave(); } };
    }
  };
})();
