/* Ampère Académie — défi « Électrotechnique » : une étude chiffrée enchaînée (moteur, transformateur ou four
 * triphasé), données tirées au hasard, de plus en plus de questions selon le niveau. Chaque réponse est
 * vérifiée à 2 % près ; la correction détaille chaque calcul. Formules identiques à celles des leçons n4/n5. */
(function () {
  'use strict';
  const { esc, ic } = AA;
  const sq3 = Math.sqrt(3), W = 2 * Math.PI * 50;
  const f = (x, d) => AA.fmt(x, d == null ? 2 : d);
  const E = AA.ELECDEFI = {};

  E.scenarios = {
    moteur(r) {
      const Pu = r.pick([4, 5.5, 7.5, 11, 15, 22, 30, 45]), p = r.pick([1, 2, 2, 3]), g = r.pick([0.025, 0.03, 0.035, 0.04, 0.05]);
      const eta = r.pick([0.86, 0.88, 0.9, 0.91, 0.93]), cos = r.pick([0.8, 0.82, 0.84, 0.85, 0.86, 0.88]);
      const ns = 3000 / p, n = Math.round(ns * (1 - g)), Pa = Pu / eta, In = Pa * 1000 / (sq3 * 400 * cos);
      const gr = (ns - n) / ns, Cu = Pu * 1000 / (n * 2 * Math.PI / 60);
      const t1 = Math.tan(Math.acos(cos)), t2 = Math.tan(Math.acos(0.95)), Qc = Pa * (t1 - t2), C = Qc * 1000 / (3 * 400 * 400 * W) * 1e6;
      return {
        sig: 'm' + Pu + p + n + eta + cos,
        brief: `Moteur asynchrone triphasé 400 V, 50 Hz, à <b>${2 * p} pôles</b>. Plaque : puissance utile <b>${f(Pu)} kW</b>, rendement <b>${f(eta)}</b>, cos φ <b>${f(cos)}</b>, vitesse <b>${n} tr/min</b>.`,
        steps: [
          { q: 'Puissance absorbée P<sub>abs</sub>', a: Pa, u: 'kW', sol: `P_abs = P_u / η = ${f(Pu)} / ${f(eta)} = ${f(Pa)} kW` },
          { q: 'Courant en ligne I', a: In, u: 'A', sol: `I = P_abs / (√3 U cos φ) = ${f(Pa * 1000, 0)} / (√3 × 400 × ${f(cos)}) = ${f(In, 1)} A` },
          { q: 'Glissement g', a: gr * 100, u: '%', sol: `n_s = 60 f / p = ${ns} tr/min ; g = (${ns} − ${n}) / ${ns} = ${f(gr * 100)} %` },
          { q: 'Couple utile C<sub>u</sub>', a: Cu, u: 'N·m', sol: `C_u = P_u / Ω = ${f(Pu * 1000, 0)} / (${n} × 2π / 60) = ${f(Cu, 1)} N·m` },
          { q: 'Puissance réactive des condensateurs pour relever le cos φ à 0,95', a: Qc, u: 'kvar', sol: `Q_c = P_abs (tan φ₁ − tan φ₂) = ${f(Pa)} × (${f(t1, 3)} − ${f(t2, 3)}) = ${f(Qc)} kvar` },
          { q: 'Capacité de chaque condensateur (batterie couplée en triangle)', a: C, u: 'µF', sol: `C = Q_c / (3 U² ω) = ${f(Qc * 1000, 0)} / (3 × 400² × 314,16) = ${f(C, 1)} µF` }
        ]
      };
    },
    transfo(r) {
      const Sn = r.pick([250, 400, 630, 1000]), P0 = { 250: 360, 400: 430, 630: 600, 1000: 770 }[Sn] * r.pick([1, 1.2, 1.5]), Pk = { 250: 3250, 400: 4600, 630: 6500, 1000: 10500 }[Sn];
      const x = r.pick([0.4, 0.5, 0.6, 0.75, 0.9]), cos = r.pick([0.8, 0.85, 0.9, 0.95]), ucc = Sn <= 630 ? 4 : 6;
      const P2 = x * Sn * cos, Pcu = Pk * x * x / 1000, eta = P2 / (P2 + P0 / 1000 + Pcu), xo = Math.sqrt(P0 / Pk), Icc = Sn * 1000 / (sq3 * 410 * ucc / 100) / 1000;
      return {
        sig: 't' + Sn + P0 + x + cos,
        brief: `Transformateur HTA/BT de <b>${Sn} kVA</b> (u<sub>cc</sub> = ${ucc} %, tension à vide 410 V). Pertes à vide <b>${f(P0, 0)} W</b>, pertes en charge nominale <b>${f(Pk, 0)} W</b>. Il débite <b>${f(x * 100, 0)} %</b> de sa puissance nominale sous un cos φ de <b>${f(cos)}</b>.`,
        steps: [
          { q: 'Puissance active fournie P<sub>2</sub>', a: P2, u: 'kW', sol: `P₂ = x S_n cos φ = ${f(x)} × ${Sn} × ${f(cos)} = ${f(P2, 1)} kW` },
          { q: 'Pertes cuivre à cette charge', a: Pcu * 1000, u: 'W', sol: `P_cu = P_k x² = ${f(Pk, 0)} × ${f(x)}² = ${f(Pcu * 1000, 0)} W` },
          { q: 'Rendement η', a: eta * 100, u: '%', tol: 0.001, sol: `η = P₂ / (P₂ + P₀ + P_cu) = ${f(P2, 1)} / (${f(P2, 1)} + ${f(P0 / 1000, 3)} + ${f(Pcu, 3)}) = ${f(eta * 100, 2)} %` },
          { q: 'Charge (en % de S<sub>n</sub>) donnant le rendement maximal', a: xo * 100, u: '%', sol: `x = √(P₀ / P_k) = √(${f(P0, 0)} / ${f(Pk, 0)}) = ${f(xo * 100, 1)} %` },
          { q: 'Courant de court-circuit aux bornes BT (réseau amont négligé)', a: Icc, u: 'kA', sol: `I_cc = S_n / (√3 U₂₀ u_cc) = ${Sn * 1000} / (√3 × 410 × ${ucc / 100}) = ${f(Icc, 1)} kA` }
        ]
      };
    },
    four(r) {
      const R = r.pick([10, 15, 20, 23, 30, 40, 46]), cp = r.pick(['Y', 'D']);
      const Iy = 230 / R, Py = 3 * 230 * 230 / R, Id = sq3 * 400 / R, Pd = 3 * 400 * 400 / R;
      const I = cp === 'Y' ? Iy : Id, P = cp === 'Y' ? Py : Pd, P2 = cp === 'Y' ? Pd : Py;
      return {
        sig: 'f' + R + cp,
        brief: `Four triphasé : trois résistances de <b>${R} Ω</b> couplées en <b>${cp === 'Y' ? 'étoile' : 'triangle'}</b> sur un réseau 230/400 V.`,
        steps: [
          { q: 'Tension aux bornes de chaque résistance', a: cp === 'Y' ? 230 : 400, u: 'V', sol: cp === 'Y' ? 'En étoile, chaque résistance reçoit la tension simple V = 230 V.' : 'En triangle, chaque résistance reçoit la tension composée U = 400 V.' },
          { q: 'Courant en ligne', a: I, u: 'A', sol: cp === 'Y' ? `I = V / R = 230 / ${R} = ${f(I)} A` : `J = U / R = 400 / ${R} = ${f(400 / R)} A ; I = J √3 = ${f(I)} A` },
          { q: 'Puissance totale', a: P / 1000, u: 'kW', sol: `P = 3 × ${cp === 'Y' ? '230' : '400'}² / ${R} = ${f(P / 1000, 2)} kW` },
          { q: `Puissance si l'on passe en ${cp === 'Y' ? 'triangle' : 'étoile'}`, a: P2 / 1000, u: 'kW', sol: `Chaque résistance reçoit ${cp === 'Y' ? '400 V au lieu de 230 V : puissance multipliée par 3' : '230 V au lieu de 400 V : puissance divisée par 3'}, soit ${f(P2 / 1000, 2)} kW.` },
          { q: 'Courant en ligne dans ce nouveau couplage', a: cp === 'Y' ? Id : Iy, u: 'A', sol: cp === 'Y' ? `I = √3 × 400 / ${R} = ${f(Id)} A` : `I = 230 / ${R} = ${f(Iy)} A` }
        ]
      };
    }
  };
  E.count = lvl => Math.min(6, 2 + lvl);
  E.parse = v => { const t = String(v).replace(/\s/g, '').replace(',', '.'); return t === '' ? NaN : Number(t); };
  E.ok = (val, a, tol) => isFinite(val) && Math.abs(val - a) <= Math.abs(a) * (tol || 0.02) + 1e-9;

  const register = () => {
    if (!AA.Defis || !AA.Defis.TYPES) return;
    AA.Defis.TYPES.electrotech = {
      name: 'Électrotechnique', icon: 'bolt', min: 2,
      desc: 'Une étude chiffrée complète (moteur, transformateur ou four) aux valeurs toujours différentes. Plus ton niveau monte, plus l\'étude va loin.',
      gen(r, lvl) {
        const k = r.pick(Object.keys(E.scenarios)), s = E.scenarios[k](r);
        return { k, lvl, brief: s.brief, steps: s.steps.slice(0, E.count(lvl)), sig: s.sig + lvl };
      },
      play(main, inst, done) {
        main.innerHTML = `<div class="page-head"><div><p class="eyebrow">Défi · Électrotechnique</p><h1>L'étude du jour</h1></div></div>
          <div class="brief">${inst.brief} Réponds à chaque question (tolérance 2 %), puis valide l'ensemble.</div>
          <div class="grid" style="margin-top:16px">${inst.steps.map((s, i) => `<div class="card numq" data-i="${i}"><p class="eyebrow">Question ${i + 1}</p><p class="q">${s.q}</p>
            <div class="num-in"><input inputmode="decimal" placeholder="Ta réponse"><span class="unit">${esc(s.u)}</span></div><div class="js-c"></div></div>`).join('')}</div>
          <button class="btn primary js-ok" style="margin-top:14px">${ic.check}Valider l'étude</button><div class="js-fb"></div>`;
        let finished = false;
        main.querySelector('.js-ok').onclick = () => {
          let good = 0;
          inst.steps.forEach((s, i) => {
            const c = main.querySelector(`[data-i="${i}"]`), v = E.parse(c.querySelector('input').value), ok = E.ok(v, s.a, s.tol);
            if (ok) good++;
            c.querySelector('.js-c').innerHTML = `<p class="${ok ? 'ok-t' : 'bad-t'}" style="margin:10px 0 0">${ok ? '✔' : '✘'} ${esc(s.sol)}</p>`;
          });
          const score = Math.round(100 * good / inst.steps.length);
          main.querySelector('.js-fb').innerHTML = `<div class="result ${score >= 50 ? 'win' : 'lose'}"><div class="score-big">${score}</div><p>${good} réponse${good > 1 ? 's' : ''} juste${good > 1 ? 's' : ''} sur ${inst.steps.length}. Chaque calcul est détaillé sous sa question.</p></div>`;
          if (!finished) { finished = true; done(score); }
        };
      }
    };
  };
  register();
})();
