/* Ampère Académie — effets d'interaction : halo « pointe de touche » qui suit la souris, étincelles au clic,
 * aimantation légère des commandes, changement de thème par révélation circulaire. Désactivés si
 * l'utilisateur a réduit les animations ou utilise un écran tactile. */
(function () {
  'use strict';
  const S = AA.state;
  const motionOK = () => S.settings.motion !== false && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
  const HOT = 'a, button, .part.manual, .tp, .cell, .io, .opt, [data-k], .row[tabindex], input[type=range], select';

  /* Halo qui suit le pointeur avec un léger retard (ressort) */
  if (fine) {
    const h = document.createElement('div'); h.className = 'fx-halo'; document.body.appendChild(h);
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      h.style.transform = `translate(${x}px,${y}px)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      if (!motionOK() || e.pointerType !== 'mouse') { h.classList.remove('show'); return; }
      tx = e.clientX; ty = e.clientY; h.classList.add('show');
      const hot = e.target.closest && e.target.closest(HOT);
      h.classList.toggle('hot', !!hot);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    addEventListener('pointerdown', () => h.classList.add('press'));
    addEventListener('pointerup', () => h.classList.remove('press'));
    document.addEventListener('mouseleave', () => h.classList.remove('show'));
  }

  /* Étincelles : un petit arc rayonnant au point de clic sur une commande */
  addEventListener('pointerdown', e => {
    if (!motionOK()) return;
    const t = e.target.closest && e.target.closest('.btn, .mod, .device, .big-push, .opt, .theme-card, .seg button, .circuit-pill');
    if (!t) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'fx-spark'); s.setAttribute('viewBox', '0 0 80 80');
    let d = '';
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2 + Math.random() * 0.4, r1 = 12, r2 = 24 + Math.random() * 10, m = (r1 + r2) / 2, j = (Math.random() - 0.5) * 6;
      const p = (r, o) => `${40 + Math.cos(a) * r + Math.cos(a + 1.57) * o},${40 + Math.sin(a) * r + Math.sin(a + 1.57) * o}`;
      d += `M${p(r1, 0)} L${p(m, j)} L${p(r2, 0)} `;
    }
    s.innerHTML = `<circle cx="40" cy="40" r="20"/><path d="${d}"/>`;
    s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 560);
  }, { passive: true });

  /* Aimantation : les commandes se penchent vers le pointeur */
  if (fine) {
    addEventListener('pointermove', e => {
      if (!motionOK()) return;
      const t = e.target.closest && e.target.closest('.btn:not(.icon), .device, .theme-card');
      if (AA._mag && AA._mag !== t) { AA._mag.style.translate = ''; AA._mag = null; }
      if (!t) return;
      const r = t.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      t.style.translate = `${(dx * 5).toFixed(1)}px ${(dy * 4).toFixed(1)}px`;
      AA._mag = t;
    }, { passive: true });
  }

  /* Changement de thème avec révélation circulaire depuis le point de clic */
  AA.setTheme = (theme, ev) => {
    S.settings.theme = theme; AA.save();
    const apply = () => AA.applyTheme();
    if (ev && document.startViewTransition && motionOK()) {
      document.documentElement.style.setProperty('--vx', ev.clientX + 'px');
      document.documentElement.style.setProperty('--vy', ev.clientY + 'px');
      document.startViewTransition(apply);
    } else apply();
  };
})();
