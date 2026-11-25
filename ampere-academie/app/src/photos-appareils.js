/* Ampère Académie — photographies d'appareillage (Wikimedia Commons, licences libres ; crédits affichés dans le profil). */
(function () {
  'use strict';
  const C = (title, author, license, licenseUrl) => ({ title, author, license, licenseUrl, page: 'https://commons.wikimedia.org/wiki/' + encodeURI(('File:' + title).replace(/ /g, '_')) });
  Object.assign(AA.PHOTOS, {
    contacteur: Object.assign({ src: 'img/app-contacteur.jpg', cap: 'Contacteur tripolaire : bornes de puissance 1 L1, 3 L2, 5 L3 en haut, 2 T1, 4 T2, 6 T3 en bas ; contact auxiliaire 13-14 ; bobine A1-A2' }, C('Contactor DIN IEK.jpg', 'Kae', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0')),
    thermique: Object.assign({ src: 'img/app-thermique.jpg', cap: 'Relais thermique : sorties de puissance 2 T1, 4 T2, 6 T3, contact 95-96 (NC), molette de réglage du courant, bouton de réarmement' }, C('GE MTO3N.JPG', 'Dmitry G', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0')),
    disjoncteur: Object.assign({ src: 'img/app-disjoncteur.jpg', cap: 'Disjoncteur bipolaire C16 sur rail DIN : bornes 1 et 3 en haut, 2 et 4 en bas (repères visibles sur le symbole)' }, C('Circuit breaker 2 pole on DIN rail.JPG', 'Kae', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0')),
    telerupteur: Object.assign({ src: 'img/app-telerupteur.jpg', cap: 'Télérupteur modulaire pour rail DIN (vu de dessus) : bobine et contact sont accessibles par les bornes à vis latérales' }, C('Stromstossschalter.jpg', 'Manfred Dohmen (Mdo at German Wikipedia)', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/')),
    relais: Object.assign({ src: 'img/app-relais.jpg', cap: 'Relais embrochable à bobine 220 V~ et trois inverseurs : on distingue la bobine (orange) et les contacts mobiles' }, C('11pin 3PDT relay.jpg', '32RB17', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en')),
    relaisbase: Object.assign({ src: 'img/app-relaisbase.jpg', cap: 'Culot du même relais : 11 broches numérotées de 1 à 11. Le rôle de chaque broche est donné par le fabricant (marquage, notice) et se vérifie à l\'ohmmètre' }, C('11pin 3PDT relay base.jpg', '32RB17', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en')),
    interrupteur: Object.assign({ src: 'img/app-interrupteur.jpg', cap: 'Interrupteur apparent à deux touches, démonté : boîtier, mécanisme et touches' }, C('Construction of 2-way light switch.JPG', 'Dmitry G', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0'))
  });
})();
