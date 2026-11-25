/* Ampère Académie — bandeau « Les formules » ajouté sous les simulations qui n'affichent pas déjà leurs relations.
 * Chaque entrée décrit exactement ce que calcule ou illustre la simulation correspondante. */
(function () {
  'use strict';
  const F = AA.SIMFORM = {
    electrons: ['I = Q / t', '1 A = 1 coulomb par seconde ≈ 6,24 × 10¹⁸ électrons par seconde'],
    scope: ['Û = U<sub>eff</sub> × √2', 'T = 1 / f', 'Pour 230 V efficaces : Û ≈ 325 V'],
    body: ['I = U / Z<sub>corps</sub>', 'Z<sub>corps</sub> : de l\'ordre de 1 000 à 2 000 Ω sous 230 V (peau sèche, grande surface de contact), plus faible si la peau est mouillée (IEC 60479-1)'],
    rcd: ['I<sub>Δ</sub> = I<sub>phase</sub> − I<sub>neutre</sub>', 'Pas de déclenchement en dessous de I<sub>Δn</sub>/2, déclenchement assuré à I<sub>Δn</sub>'],
    surge: ['U<sub>vue</sub> ≈ U<sub>p</sub> + L × di/dt', 'Ordre de grandeur retenu ici : environ 1 kV par mètre de liaison pour une onde de foudre — d\'où des liaisons les plus courtes possible (≤ 0,5 m conseillé)'],
    joule: ['P = R × I²', 'Une connexion mal serrée (R plus grande) chauffe davantage pour le même courant'],
    contactor: ['Fermeture assurée entre 85 % et 110 % de U<sub>c</sub>', 'Retombée entre 20 % et 75 % de U<sub>c</sub> en alternatif (IEC 60947-4-1)'],
    thermal: ['Classe 10 : déclenchement entre 2 et 10 s à 7,2 × I<sub>r</sub>, à froid', 'Pas de déclenchement en 2 h à 1,05 I<sub>r</sub> ; déclenchement en moins de 2 h à 1,2 I<sub>r</sub> (IEC 60947-4-1)'],
    chrono: ['Temporisation travail (TON) : Q passe à 1 quand l\'entrée est à 1 depuis PT', 'Temporisation repos (TOF) : Q reste à 1 pendant PT après la retombée de l\'entrée'],
    pnp: ['Capteur PNP : à la détection, la sortie est reliée au +24 V', 'L\'entrée de l\'automate (la charge) est raccordée entre la sortie du capteur et le 0 V'],
    rms: ['U<sub>eff</sub> = Û / √2 (sinusoïde seulement)', 'Facteur de crête = Û / U<sub>eff</sub> (√2 ≈ 1,41 pour une sinusoïde)'],
    oscillo: ['Tension crête = nombre de divisions × (V/div)', 'Période T = nombre de divisions × (temps/div)', 'f = 1 / T'],
    analog: ['Valeur = (graduation lue / pleine échelle de la graduation) × calibre', 'Classe 1,5 : erreur maximale ± 1,5 % du calibre, d\'où une lecture idéale dans le dernier tiers de l\'échelle'],
    megger: ['R<sub>iso</sub> = U<sub>essai</sub> / I<sub>fuite</sub>', 'Circuits de 50 à 500 V : essai sous 500 V continu, R<sub>iso</sub> ≥ 1 MΩ (IEC 60364-6)'],
    earth: ['R<sub>E</sub> = U<sub>EP</sub> / I<sub>EC</sub>', 'Méthode des 62 % : piquet de tension placé à 62 % de la distance entre la prise de terre et le piquet de courant'],
    rcdtest: ['Différentiel de type général (IEC 61008-1) : coupure ≤ 300 ms à I<sub>Δn</sub>', '≤ 150 ms à 2 I<sub>Δn</sub> ; ≤ 40 ms à 5 I<sub>Δn</sub>'],
    thermocam: ['La caméra mesure un rayonnement, pas une température', 'Émissivité ε : métal brillant ≈ 0,1, peinture ou ruban isolant noir ≈ 0,95 — une valeur mal réglée fausse la mesure'],
    champ: ['n<sub>s</sub> = 60 f / p', 'Courants triphasés dans trois bobines décalées de 120° : champ d\'amplitude constante (3/2 × celui d\'une bobine) qui tourne'],
    fresnel: ['Z = √(R² + (X<sub>L</sub> − X<sub>C</sub>)²)', 'tan φ = (X<sub>L</sub> − X<sub>C</sub>) / R', 'I = U / Z'],
    clock: ['Décalage = indice horaire × 30°', 'Exemple : Dyn11 → tension BT décalée de 330° en retard (soit 30° en avance) sur la HT'],
    powerflow: ['P<sub>tr</sub> = P<sub>abs</sub> − p<sub>fer stator</sub> − p<sub>Joule stator</sub>', 'p<sub>Joule rotor</sub> = g × P<sub>tr</sub>', 'P<sub>u</sub> = (1 − g) P<sub>tr</sub> − p<sub>méca</sub> ; η = P<sub>u</sub> / P<sub>abs</sub>'],
    mppt: ['P = U × I', 'PWM : le module est tiré à la tension de la batterie ; MPPT : il travaille à sa tension de puissance maximale et le convertisseur adapte la tension'],
    shade: ['Dans une chaîne série, le courant est imposé par la cellule la plus faible', 'Les diodes de dérivation court-circuitent le sous-groupe ombré : on perd sa tension, pas toute la chaîne'],
    strings: ['U<sub>co chaîne</sub>(T<sub>min</sub>) = n × U<sub>co</sub> × (1 + β<sub>U</sub> (T<sub>min</sub> − 25 °C)), β<sub>U</sub> < 0', 'Doit rester sous la tension maximale d\'entrée de l\'onduleur ; à chaud, U<sub>mpp</sub> doit rester dans la plage MPPT'],
    battery: ['Énergie utilisable = C (Ah) × U (V) × profondeur de décharge', 'Plus la décharge quotidienne est profonde, moins la batterie fait de cycles'],
    ats: ['Autonomie de l\'ASI ≥ démarrage du groupe + stabilisation + commutation', 'Pendant ce temps, l\'ASI seule alimente la charge sensible'],
    ups: ['VFD (off-line) : la charge est sur le réseau, bascule sur l\'onduleur en cas de coupure', 'VI (line-interactive) : régulation de tension, bascule courte', 'VFI (double conversion) : la charge est toujours alimentée par l\'onduleur, aucun temps de transfert (IEC 62040-3)'],
    domaines: ['Courant alternatif : TBT ≤ 50 V ; BT ≤ 1 000 V ; HTA ≤ 50 kV ; HTB au-delà', 'Courant continu : TBT ≤ 120 V ; BT ≤ 1 500 V ; HTA ≤ 75 kV ; HTB au-delà (NF C 18-510)'],
    icc: ['I<sub>cc</sub> = U<sub>20</sub> / (√3 × √(R² + X²))', 'X = X<sub>réseau</sub> + X<sub>transfo</sub> + λ L ; R = ρ L / S ; X<sub>transfo</sub> = u<sub>cc</sub> × U<sub>20</sub>² / S<sub>n</sub>'],
    bilan: ['P = k<sub>s</sub> × Σ k<sub>u</sub> P<sub>n</sub>', 'Q = k<sub>s</sub> × Σ k<sub>u</sub> P<sub>n</sub> tan φ', 'S = √(P² + Q²)'],
    filiation: ['Condition : pouvoir de coupure de l\'appareil (ou de l\'association testée) ≥ I<sub>cc</sub> présumé au point d\'installation'],
    tt: ['I<sub>d</sub> = U<sub>0</sub> / (R<sub>A</sub> + R<sub>B</sub>)', 'U<sub>c</sub> = R<sub>A</sub> × I<sub>d</sub> ; condition R<sub>A</sub> × I<sub>Δn</sub> ≤ 50 V'],
    breaker: ['Courbe B : magnétique entre 3 et 5 I<sub>n</sub> ; C : 5 à 10 I<sub>n</sub> ; D : 10 à 20 I<sub>n</sub> (IEC 60898-1)', 'Thermique : pas de déclenchement en 1 h à 1,13 I<sub>n</sub>, déclenchement en moins de 1 h à 1,45 I<sub>n</sub>'],
    orient: ['Règle simple : inclinaison optimale annuelle ≈ latitude du site', 'Un écart d\'orientation modéré (± 30°) coûte peu de production'],
    stepper: null, transfoloss: null
  };
  AA.addFormula = (d, key) => {
    const f = F[key]; if (!f || !d) return;
    const card = d.querySelector('.simcard') || d.firstElementChild; if (!card || card.querySelector('.simf')) return;
    card.insertAdjacentHTML('beforeend', `<div class="simf"><span class="eyebrow">Les formules</span><ul>${f.map(x => `<li>${x}</li>`).join('')}</ul></div>`);
  };
})();
