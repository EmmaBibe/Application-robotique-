/* Ampère Académie — données techniques des défis (valeurs normatives vérifiées).
 * Courants admissibles : IEC 60364-5-52 tableau B.52.4 (cuivre, isolant PVC), méthodes B1 et C.
 * Facteurs de correction : B.52.14 (température ambiante, PVC) et B.52.17 (groupement, jointifs sur une surface).
 * Chute de tension : NF C 15-100 §525, u = b (ρ1 L/S cos φ + λ L sin φ) Ib, ρ1 = 0,0225 Ω·mm²/m, λ = 0,08 mΩ/m. */
(function () {
  'use strict';
  const D = AA.TECH = {};
  D.SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
  D.IZ = {
    C2: [19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299],
    C3: [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259],
    B2: [17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269],
    B3: [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239]
  };
  D.POSE = { C: 'fixé directement aux parois (méthode C)', B: 'sous conduit apparent (méthode B1)' };
  D.KT = { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.00, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71 };
  D.KG = { 1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60, 6: 0.57 };
  D.CALIBRES = [2, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
  D.RHO = 0.0225; D.LAMBDA = 0.00008;
  D.TRANSFOS = [100, 160, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500];
  D.ucc = kva => (kva <= 630 ? 4 : 6);

  D.dU = (tri, L, S, cos, Ib) => {
    const sin = Math.sqrt(1 - cos * cos);
    const u = (tri ? 1 : 2) * (D.RHO * L / S * cos + D.LAMBDA * L * sin) * Ib;
    return u / 230 * 100;
  };
  /* Dimensionnement complet d'une canalisation (protection par disjoncteur) */
  D.size = ({ Ib, tri, pose, T, n, L, cos, limit, Ir }) => {
    const In = Ir || D.CALIBRES.find(c => c >= Ib - 1e-9);
    const k = D.KT[T] * D.KG[n];
    const izReq = In / k;
    const tab = D.IZ[pose + (tri ? '3' : '2')];
    let i = tab.findIndex(v => v >= izReq - 1e-9);
    const iTherm = i;
    while (i < D.SECTIONS.length - 1 && D.dU(tri, L, D.SECTIONS[i], cos, Ib) > limit) i++;
    return { In, k, izReq, Sth: D.SECTIONS[iTherm], S: D.SECTIONS[i], Iz: tab[i] * k, dU: D.dU(tri, L, D.SECTIONS[i], cos, Ib), dUth: D.dU(tri, L, D.SECTIONS[iTherm], cos, Ib), upsized: i > iTherm };
  };

  /* Contextes pour varier les énoncés */
  D.SITES = ['une boulangerie industrielle', 'une station de pompage communale', 'un atelier de menuiserie', 'une cimenterie', 'une laiterie', 'une scierie', 'un centre de tri des déchets', 'une usine d\'embouteillage', 'une station d\'épuration', 'un entrepôt frigorifique', 'une carrière de granulats', 'une imprimerie', 'une usine textile', 'un hôpital (local technique)', 'une ferme aquacole', 'un parking souterrain', 'une brasserie', 'une fonderie d\'aluminium', 'un port de pêche', 'une sucrerie'];
  D.WHO = ['Le chef d\'équipe', 'L\'opérateur de nuit', 'Le responsable de production', 'Le conducteur de ligne', 'La technicienne de maintenance', 'Le client', 'Le gardien du site', 'L\'agent d\'exploitation'];
  D.WHEN = ['ce matin à la prise de poste', 'depuis le week-end', 'après un orage', 'depuis le nettoyage haute pression d\'hier', 'après le remplacement d\'un bouton', 'de façon répétée depuis deux jours', 'juste après une coupure du réseau', 'depuis l\'intervention d\'un sous-traitant'];
})();
