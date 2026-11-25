/* Ampère Académie — effets.
 * Volontairement sobres : aucun effet ne suit la souris. Seul le changement de thème est animé :
 * la nouvelle ambiance se répand en cercle depuis le point de clic, comme une goutte d'encre dans l'eau.
 * Désactivé si l'utilisateur a réduit les animations. */
(function () {
  'use strict';
  const S = AA.state;
  const motionOK = () => S.settings.motion !== false && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  AA.setTheme = (theme, ev) => {
    S.settings.theme = theme; AA.save();
    const apply = () => { AA.applyTheme(); if (AA.placeBlob) AA.placeBlob(); };
    if (ev && document.startViewTransition && motionOK()) {
      document.documentElement.style.setProperty('--vx', ev.clientX + 'px');
      document.documentElement.style.setProperty('--vy', ev.clientY + 'px');
      document.startViewTransition(apply);
    } else apply();
  };
})();
