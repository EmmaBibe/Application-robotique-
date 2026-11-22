# Application VIGIE

Application mobile dédiée au planificateur VIGIE : comprendre de l'intérieur comment il perçoit, imagine et décide, face à la meilleure référence publiée (DRA-MPPI).

## Ce qu'elle contient

| Écran | Rôle |
|---|---|
| Accueil | présentation en trois écrans pour un débutant, puis accès à tout le reste |
| Simulateur | le simulateur 3D « Dans la tête de VIGIE », plein écran ; mode pronostic (deviner qui atteindra le drapeau avant de regarder) ; code de monde à partager |
| Atelier « et si… ? » | modifier un réglage de VIGIE (fidélité, poids du danger, itinéraires, chemin qui sait attendre, improvisation, prudence aux angles morts, essais) et le faire courir contre le VIGIE officiel et la référence |
| Banc de poche | comparer VIGIE 6 et la référence sur une série de mondes, avec écart apparié et intervalle de confiance (bootstrap), comme dans le banc de recherche |
| Savoir | VIGIE en une page, son histoire de la version 1 à 6, les résultats, les idées abandonnées, les références, le glossaire, les limites |
| Réglages | thème, qualité graphique, données locales |

## Une seule version de VIGIE

L'application n'a pas sa propre copie du planificateur : `build.mjs` copie, depuis le dépôt, le cœur partagé avec RoboMaster (`js/sims/vigie6/`, `js/sims/vigie3d*`, `js/sims/vigie-core.js`, `js/vendor/three/`, `css/vigie3d.css`). C'est ce cœur que vérifie `recherche/planificateur/parite_js.py` (test 32 du banc) : mêmes décisions que le banc Python pour les mêmes entrées, et réglages de l'Atelier qui font exactement ce qu'ils annoncent (valeurs par défaut identiques au VIGIE officiel).

## Construire

```
node vigie-app/build.mjs             # assemble vigie-app/dist/www (application web, hors ligne)
vigie-app/android/build-apk.sh       # APK Android : vigie-app/android/VIGIE.apk
```

Prérequis de l'APK : Node, JDK 17+, SDK Android (platforms;android-34, build-tools;35.0.0). La clé de signature `vigie-app/android/vigie.keystore` est conservée dans le dépôt pour que les mises à jour s'installent par-dessus la version précédente.
