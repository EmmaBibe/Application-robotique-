import { frame, canvas, theme, text, circle, segmented, button, buttons, readout, checkbox, loop, fmt, randn, note } from '../core/kit.js';

// Bac à sable : l'étudiant écrit le programme d'un robot suiveur de ligne en JavaScript.
// Même logique que sur un Arduino : on lit les capteurs, on décide, on commande les moteurs, et on recommence.

const STARTERS = {
  simple: `// Ton robot a 5 capteurs infrarouges sous lui.
// capteurs[0] = tout à gauche ... capteurs[4] = tout à droite
// Chaque valeur va de 0 (sol blanc) à 1 (ligne noire).
// Tu renvoies la vitesse de chaque roue, entre -1 et 1.

function controle(capteurs, memoire, dt) {
  const g = capteurs[0] + capteurs[1];
  const d = capteurs[3] + capteurs[4];

  if (g > d) return { gauche: 0.2, droite: 0.6 };  // ligne à gauche : on tourne à gauche
  if (d > g) return { gauche: 0.6, droite: 0.2 };  // ligne à droite
  return { gauche: 0.6, droite: 0.6 };              // centré : tout droit
}`,
  p: `// Version proportionnelle : on calcule OÙ est la ligne,
// puis on corrige proportionnellement à l'écart.

function controle(capteurs, memoire, dt) {
  const poids = [-2, -1, 0, 1, 2];
  let somme = 0, total = 0;
  for (let i = 0; i < 5; i++) {
    somme += poids[i] * capteurs[i];
    total += capteurs[i];
  }
  // position de la ligne : -2 (gauche) ... +2 (droite)
  const erreur = total > 0.05 ? somme / total : (memoire.derniere || 0);
  memoire.derniere = erreur;

  const Kp = 0.25;
  const base = 0.55;
  const correction = Kp * erreur;
  return { gauche: base + correction, droite: base - correction };
}`,
  pid: `// À toi de compléter : ajoute les termes I et D.
// Astuce : memoire garde ses valeurs d'un appel à l'autre.

function controle(capteurs, memoire, dt) {
  const poids = [-2, -1, 0, 1, 2];
  let somme = 0, total = 0;
  for (let i = 0; i < 5; i++) { somme += poids[i] * capteurs[i]; total += capteurs[i]; }
  const erreur = total > 0.05 ? somme / total : Math.sign(memoire.e || 0) * 2.5;

  memoire.integrale = (memoire.integrale || 0) + erreur * dt;
  const derivee = (erreur - (memoire.e || 0)) / dt;
  memoire.e = erreur;

  const Kp = 0.3, Ki = 0.0, Kd = 0.02;
  const u = Kp * erreur + Ki * memoire.integrale + Kd * derivee;
  const base = 0.7;
  return { gauche: base + u, droite: base - u };
}`,
};

export default function linecode(root, opts = {}, api = {}) {
  const f = frame(root, { title: opts.title || 'Programme ton robot suiveur de ligne', tag: 'Programmation embarquée', height: 380, stacked: true });
  let trackId = opts.track || 'ovale', running = false, noise = true, solved = false;
  const target = opts.goal === 'lap' ? 14 : null;

  const editor = document.createElement('textarea');
  editor.className = 'code-area';
  editor.spellcheck = false;
  editor.value = STARTERS[opts.starter || 'simple'];
  editor.setAttribute('aria-label', 'Code du robot');
  editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); const s = editor.selectionStart; editor.setRangeText('  ', s, editor.selectionEnd, 'end'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); start(); }
  });
  const left = document.createElement('div');
  left.style.gridColumn = '1 / -1';
  left.appendChild(editor);
  f.ctrl.appendChild(left);

  const col1 = document.createElement('div'); col1.className = 'stack';
  const col2 = document.createElement('div'); col2.className = 'stack';
  f.ctrl.append(col1, col2);
  segmented(col1, { label: 'Piste', value: trackId, options: [{ label: 'Ovale', value: 'ovale' }, { label: 'Sinueuse', value: 'sinueuse' }, { label: 'Huit', value: 'huit' }], onChange: v => { trackId = v; buildTrack(); resetRobot(); } });
  segmented(col1, { label: 'Code de départ', value: opts.starter || 'simple', options: [{ label: 'Tout ou rien', value: 'simple' }, { label: 'Proportionnel', value: 'p' }, { label: 'PID à finir', value: 'pid' }], onChange: v => { editor.value = STARTERS[v]; } });
  checkbox(col1, { label: 'Capteurs bruités (comme en vrai)', value: noise, onChange: v => { noise = v; } });
  const bb = buttons(col2);
  button(bb, 'Téléverser et lancer', start, 'primary');
  button(bb, 'Stop', () => { running = false; });
  const ro = readout(col2, [['t', 'Chrono du tour'], ['best', 'Meilleur tour'], ['cp', 'Points de passage'], ['out', 'Sorties de piste']]);
  const con = document.createElement('div');
  con.className = 'console';
  con.textContent = 'Prêt. Ctrl + Entrée pour lancer.';
  col2.appendChild(con);
  note(col2, target ? `<b>Défi</b> : boucle un tour complet de l'ovale en moins de ${target} s sans sortir de la piste.` : 'Le robot exécute ta fonction 50 fois par seconde. <code>console.log()</code> écrit ici.');

  let track = [], cps = [], robot, fn, mem, lapT, best = null, nextCp, outs, outFlag, logs;

  function buildTrack() {
    track = [];
    const n = 400;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      let x, y;
      if (trackId === 'ovale') { x = 2.2 * Math.cos(t); y = 1.2 * Math.sin(t); }
      else if (trackId === 'sinueuse') { x = 2.2 * Math.cos(t); y = 1.25 * Math.sin(t) + 0.25 * Math.sin(5 * t); }
      else { x = 2.2 * Math.sin(t); y = 1.2 * Math.sin(2 * t); }
      track.push([x, y]);
    }
    cps = [0, 100, 200, 300].map(i => track[i]);
  }
  function resetRobot() {
    const [x0, y0] = track[0], [x1, y1] = track[1];
    robot = { x: x0, y: y0, th: Math.atan2(y1 - y0, x1 - x0), vl: 0, vr: 0 };
    lapT = 0; nextCp = 1; outs = 0; outFlag = false; mem = {};
  }
  buildTrack(); resetRobot();

  function guard(code) {
    // protection minimale contre les boucles infinies
    return code.replace(/\b(for|while)\s*\(([^)]*)\)\s*\{/g, (m) => `${m} if (++__garde > 1e6) throw new Error("Boucle infinie ?");`);
  }
  function print(msg, cls) {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = msg;
    con.appendChild(line);
    while (con.childNodes.length > 60) con.removeChild(con.firstChild);
    con.scrollTop = con.scrollHeight;
  }
  function start() {
    con.textContent = '';
    logs = 0;
    try {
      const fakeConsole = { log: (...a) => { if (logs++ < 40) print(a.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(' ')); } };
      const factory = new Function('console', 'Math', `"use strict"; let __garde = 0;\n${guard(editor.value)}\n;return (c, m, d) => { __garde = 0; return controle(c, m, d); };`);
      fn = factory(fakeConsole, Math);
      if (typeof fn !== 'function') throw new Error('La fonction controle est introuvable.');
      resetRobot();
      running = true;
      print('Programme téléversé. Le robot démarre.', 'ok');
    } catch (e) {
      running = false;
      print('Erreur : ' + e.message, 'err');
    }
  }

  function distToTrack(x, y) {
    let best = Infinity;
    for (let i = 0; i < track.length; i++) {
      const [ax, ay] = track[i], [bx, by] = track[(i + 1) % track.length];
      const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / l2));
      const d = Math.hypot(x - ax - t * ex, y - ay - t * ey);
      if (d < best) best = d;
    }
    return best;
  }
  const LINE = 0.04; // demi-largeur de la ligne : 4 cm
  function sensorPts() {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const lat = (2 - i) * 0.03, fw = 0.1;
      pts.push([robot.x + Math.cos(robot.th) * fw - Math.sin(robot.th) * lat, robot.y + Math.sin(robot.th) * fw + Math.cos(robot.th) * lat]);
    }
    return pts;
  }
  function readSensors() {
    return sensorPts().map(([x, y]) => {
      const d = distToTrack(x, y);
      let v = d < LINE ? 1 : Math.max(0, 1 - (d - LINE) / 0.015);
      if (noise) v = Math.max(0, Math.min(1, v + 0.06 * randn()));
      return Number(v.toFixed(3));
    });
  }

  const cv = canvas(f.stage);
  let acc = 0;
  const lp = loop(root, dt => {
    if (running) {
      acc += dt;
      while (acc >= 0.02) {
        acc -= 0.02;
        const s = readSensors();
        let out;
        try { out = fn(s, mem, 0.02); }
        catch (e) { running = false; print('Erreur pendant l\'exécution : ' + e.message, 'err'); break; }
        const cl = v => Math.max(-1, Math.min(1, Number(v) || 0));
        const tl = cl(out && out.gauche), tr = cl(out && out.droite); // 1 → 1 m/s
        // les moteurs ne répondent pas instantanément
        robot.vl += (tl - robot.vl) * 0.25; robot.vr += (tr - robot.vr) * 0.25;
        const v = (robot.vl + robot.vr) / 2, w = (robot.vr - robot.vl) / 0.12;
        robot.x += v * Math.cos(robot.th) * 0.02; robot.y += v * Math.sin(robot.th) * 0.02; robot.th += w * 0.02;
        lapT += 0.02;
        const d = distToTrack(robot.x, robot.y);
        if (d > 0.12 && !outFlag) { outFlag = true; outs++; print(`Sortie de piste à ${fmt(lapT, 1)} s`, 'err'); }
        if (d < 0.06) outFlag = false;
        if (d > 0.6) { running = false; print('Robot perdu. Corrige ton programme et relance.', 'err'); }
        const cp = cps[nextCp % 4];
        if (Math.hypot(robot.x - cp[0], robot.y - cp[1]) < 0.15) {
          if (nextCp % 4 === 0) {
            print(`Tour bouclé en ${fmt(lapT, 2)} s (${outs} sortie${outs > 1 ? 's' : ''}).`, 'ok');
            if (!outs && (best === null || lapT < best)) best = lapT;
            if (target && !solved && trackId === 'ovale' && !outs && lapT < target) { solved = true; f.message(`Défi réussi : ${fmt(lapT, 2)} s, zéro sortie. Ton code tournerait tel quel, à la syntaxe près, sur un Arduino.`); api.success && api.success(); }
            lapT = 0; outs = 0;
          }
          nextCp++;
        }
      }
    }
    draw();
  });

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#e9e4d8'; ctx.fillRect(0, 0, W, H);
    const S = Math.min(W / 5.2, H / 3.2), cx = W / 2, cy = H / 2;
    const P = (x, y) => [cx + x * S, cy - y * S];
    ctx.strokeStyle = '#151515'; ctx.lineWidth = LINE * 2 * S; ctx.lineJoin = 'round';
    ctx.beginPath(); track.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); ctx.stroke();
    cps.forEach(([x, y], i) => { const [px, py] = P(x, y); circle(ctx, px, py, 0.15 * S, null, i === nextCp % 4 ? '#e08a00' : '#b8b0a0', 1.5); });
    const [sx, sy] = P(...track[0]);
    ctx.fillStyle = '#d43'; ctx.fillRect(sx - 2, sy - 0.12 * S, 4, 0.24 * S);
    const [rx, ry] = P(robot.x, robot.y);
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(-robot.th);
    ctx.fillStyle = '#1e6fd9'; ctx.fillRect(-0.06 * S, -0.07 * S, 0.17 * S, 0.14 * S);
    ctx.fillStyle = '#222'; ctx.fillRect(-0.04 * S, -0.085 * S, 0.06 * S, 0.02 * S); ctx.fillRect(-0.04 * S, 0.065 * S, 0.06 * S, 0.02 * S);
    ctx.restore();
    const s = readSensors();
    sensorPts().forEach(([x, y], i) => { const [px, py] = P(x, y); circle(ctx, px, py, 3.5, s[i] > 0.5 ? '#e33' : '#4c4', '#000', 1); });
    // barre-graphe des capteurs
    s.forEach((v, i) => {
      const bx = 12 + i * 18, by = 14;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(bx, by, 14, 40);
      ctx.fillStyle = '#222'; ctx.fillRect(bx, by + 40 * (1 - v), 14, 40 * v);
    });
    text(ctx, 'capteurs', 12, 68, { color: '#444', size: 10 });
    ro.set('t', `${fmt(lapT, 2)} s`);
    ro.set('best', best === null ? '—' : `${fmt(best, 2)} s`);
    ro.set('cp', `${(nextCp - 1) % 4} / 4`);
    ro.set('out', `${outs}`, outs ? 'var(--danger)' : '');
  }
  return () => { lp.stop(); cv.destroy(); };
}
