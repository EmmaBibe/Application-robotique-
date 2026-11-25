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
    variateur(r) {
      const fr = r.pick([20, 30, 35, 40, 45]), p = r.pick([1, 2, 3]), Un = 400, J = r.pick([0.5, 1, 2, 4, 8]), cyc = r.pick([20, 30, 60, 120]);
      const ns = 60 * fr / p, U = Un * fr / 50, bus = Math.SQRT2 * Un, n = Math.round(ns * 0.97), w = n * 2 * Math.PI / 60, Ek = 0.5 * J * w * w / 1000, Pm = Ek * 1000 / cyc;
      return {
        sig: 'v' + fr + p + J + cyc,
        brief: `Moteur asynchrone <b>${2 * p} pôles</b>, 400 V / 50 Hz, piloté en loi U/f par un variateur alimenté en 400 V triphasé. Il tourne à <b>${fr} Hz</b> (vitesse réelle ${n} tr/min) et entraîne une inertie totale de <b>${AA.fmt(J)} kg·m²</b>, freinée jusqu'à l'arrêt une fois toutes les <b>${cyc} s</b>.`,
        steps: [
          { q: 'Vitesse de synchronisme à cette fréquence', a: ns, u: 'tr/min', sol: `n_s = 60 f / p = 60 × ${fr} / ${p} = ${ns} tr/min` },
          { q: 'Tension appliquée au moteur (loi U/f)', a: U, u: 'V', sol: `U = 400 × ${fr} / 50 = ${AA.fmt(U, 0)} V` },
          { q: 'Tension du bus continu à vide', a: bus, u: 'V', sol: `U_bus ≈ √2 × 400 = ${AA.fmt(bus, 0)} V` },
          { q: 'Énergie cinétique à évacuer à chaque freinage', a: Ek, u: 'kJ', sol: `ω = 2π × ${n} / 60 = ${AA.fmt(w, 1)} rad/s ; E = ½ × ${AA.fmt(J)} × ω² = ${AA.fmt(Ek, 2)} kJ` },
          { q: 'Puissance moyenne que doit dissiper la résistance de freinage', a: Pm, u: 'W', sol: `P = E / durée du cycle = ${AA.fmt(Ek * 1000, 0)} / ${cyc} = ${AA.fmt(Pm, 0)} W` }
        ]
      };
    },
    maintenance(r) {
      const mtbf = r.pick([300, 600, 1200, 2500]), mttr = r.pick([3, 6, 10, 16]), r1 = r.pick([200, 500, 900]), k = r.pick([1.4, 2.6, 3.4]);
      const A = mtbf / (mtbf + mttr), Ar = 1 - (1 - A) * (1 - A), down = (1 - A) * 8760, downR = (1 - Ar) * 8760 * 60, r10 = Math.round(r1 * k);
      return {
        sig: 'm' + mtbf + mttr + r1 + k,
        brief: `Pompe de relevage critique : MTBF <b>${mtbf} h</b>, MTTR <b>${mttr} h</b>, fonctionnement 24 h/24 (8 760 h par an). Mesure d'isolement de son moteur : <b>${r1} MΩ</b> à 1 min, <b>${r10} MΩ</b> à 10 min.`,
        steps: [
          { q: 'Disponibilité de la pompe', a: A * 100, u: '%', tol: 0.0005, sol: `A = ${mtbf} / (${mtbf} + ${mttr}) = ${f(A * 100, 3)} %` },
          { q: 'Indisponibilité sur une année', a: down, u: 'h', sol: `(1 − A) × 8 760 = ${f(down, 1)} h` },
          { q: 'Disponibilité avec une seconde pompe identique en redondance', a: Ar * 100, u: '%', tol: 0.00001, sol: `A = 1 − (1 − ${f(A, 4)})² = ${f(Ar * 100, 5)} %` },
          { q: 'Indisponibilité annuelle avec la redondance', a: downR, u: 'min', sol: `(1 − A) × 8 760 × 60 = ${f(downR, 1)} min` },
          { q: 'Index de polarisation du moteur', a: r10 / r1, u: '', sol: `IP = ${r10} / ${r1} = ${f(r10 / r1, 2)} (repère usuel : < 2 douteux, 2 à 4 bon)` }
        ]
      };
    },
    protection(r) {
      const Is1 = r.pick([100, 150, 200]), tms1 = r.pick([0.05, 0.1, 0.15]), Is2 = Is1 * r.pick([2, 3]), If = Is1 * r.pick([8, 10, 15, 20]), marg = 0.3;
      const t = (Is, tms) => tms * 0.14 / (Math.pow(If / Is, 0.02) - 1), t1 = t(Is1, tms1), k2 = 0.14 / (Math.pow(If / Is2, 0.02) - 1), tms2 = (t1 + marg) / k2;
      return {
        sig: 'p' + Is1 + tms1 + Is2 + If,
        brief: `Deux relais à maximum de courant « normalement inverse » (IEC 60255-151 : t = TMS × 0,14 / ((I/I<sub>s</sub>)<sup>0,02</sup> − 1)) protègent un départ HTA et son arrivée. Relais aval : I<sub>s</sub> = <b>${Is1} A</b>, TMS = <b>${f(tms1)}</b>. Relais amont : I<sub>s</sub> = <b>${Is2} A</b>. Courant de défaut sur le départ : <b>${If} A</b>. Intervalle de sélectivité visé : <b>0,3 s</b>.`,
        steps: [
          { q: 'Rapport I / I<sub>s</sub> vu par le relais aval', a: If / Is1, u: '', sol: `${If} / ${Is1} = ${f(If / Is1, 2)}` },
          { q: 'Temps de déclenchement du relais aval', a: t1, u: 's', sol: `t = ${f(tms1)} × 0,14 / (${f(If / Is1, 2)}^0,02 − 1) = ${f(t1, 3)} s` },
          { q: 'Temps visé pour le relais amont', a: t1 + marg, u: 's', sol: `${f(t1, 3)} + 0,3 = ${f(t1 + marg, 3)} s` },
          { q: 'TMS à régler sur le relais amont', a: tms2, u: '', sol: `TMS = ${f(t1 + marg, 3)} / (0,14 / (${f(If / Is2, 2)}^0,02 − 1)) = ${f(tms2, 3)}` }
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
