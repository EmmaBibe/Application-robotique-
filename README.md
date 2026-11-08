# RoboMaster

Un parcours complet pour apprendre la robotique en partant de zéro, jusqu'au niveau attendu en Master, et au-delà.

L'idée : on ne mémorise pas une notion avant de l'avoir manipulée. Chaque leçon montre le phénomène de la source jusqu'au résultat (du courant dans un fil jusqu'au robot qui tourne), puis propose des simulateurs à manipuler, des quiz, des exercices corrigés, du code à écrire et des défis.

Fonctionne sur ordinateur et sur téléphone, s'installe comme une application et marche hors connexion. Aucun compte, aucune donnée envoyée : la progression reste sur l'appareil.

## Contenu

- **68 leçons** réparties en **19 modules** et **4 phases** :
  1. *Fondations* : bien démarrer, mathématiques, physique, électronique, programmation
  2. *Le cœur de la robotique* : mécanique et actionneurs, systèmes embarqués, robots mobiles, bras manipulateurs, commande et asservissements
  3. *Le robot intelligent* : perception et capteurs, vision, localisation et SLAM, planification, intelligence artificielle, ROS 2
  4. *L'ingénieur de demain* : ingénierie système et sécurité, créativité et invention, robotique de demain
- **21 simulateurs interactifs** : vecteurs, cercle trigonométrique, matrices de transformation, profil de mouvement, masse-ressort, engrenages, loi d'Ohm, PWM et pont en H, conversion analogique-numérique, robot différentiel et odométrie, bras 2 axes (modèles direct et inverse), PID, capteurs de distance (lidar, ultrason, infrarouge), filtrage et Kalman, filtre particulaire, A* et compagnie, convolution d'images, neurone artificiel, Q-learning, suiveur de ligne programmable, graphe ROS 2
- **41 exercices de code** corrigés automatiquement, des dizaines d'exercices numériques et de quiz
- **Défis** : réglages de PID, choix de résistance, labyrinthe qui piège A*, tour chronométré du suiveur de ligne, et des défis créatifs à réaliser hors de l'écran
- **Révision espacée** (boîtes de Leitner) avec plus de 200 cartes
- **Carnet d'ingénieur** pour noter idées (problème, idée, prototype, test) et réflexions, exportable
- **Projets réels** avec matériel, budget et étapes : veilleuse, suiveur de ligne, bras à servos, gyropode, robot autonome sous ROS 2
- **Guide du Master** : programme type, outils à maîtriser, calendrier conseillé, stage et débouchés
- Glossaire français-anglais, recherche globale, minuteur de concentration, niveaux, badges, série de jours, thème clair et sombre

## Lancer l'application

Aucune dépendance, aucune étape de compilation. Il suffit de servir le dossier avec n'importe quel serveur web statique :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Le mode hors ligne et l'installation nécessitent HTTPS (ou `localhost`). Pour publier, GitHub Pages, Netlify ou n'importe quel hébergement statique conviennent.

**Installer sur téléphone** : ouvrir le site, puis « Ajouter à l'écran d'accueil » dans le menu du navigateur.
**Installer sur ordinateur** : icône d'installation dans la barre d'adresse (Chrome, Edge).

**Changer d'appareil** : Profil → Exporter ma progression, puis Importer sur l'autre appareil.

## Organisation du code

```
index.html              coquille de l'application
css/app.css             styles (thème sombre et clair, mobile et bureau)
js/app.js               routeur et pages (accueil, parcours, leçon, labo, révision...)
js/core/                stockage local, gamification, interface, outils de dessin
js/views/blocks.js      rendu des blocs de leçon (quiz, exercices, code, défis...)
js/sims/                un fichier par simulateur, chargé à la demande
js/content/             le contenu pédagogique (un fichier par groupe de modules)
tools/build-sw.mjs      régénère sw.js (liste des fichiers mis en cache hors ligne)
```

### Ajouter ou modifier une leçon

Les leçons sont écrites dans `js/content/m-*.js` avec de petites fonctions (`P`, `H`, `Sim`, `Q`, `Exo`, `Code`, `Defi`...) définies dans `js/content/b.js`. Exemple :

```js
Q('q1', 'Que mesure un codeur ?', ['Une distance', 'Une rotation', 'Une température'], 1, 'Il compte les pas de rotation d\'un axe.'),
Exo('e1', 'Convertis 90° en radians.', { answer: 1.5708, tol: 0.001, sol: 'π/2 ≈ 1,571 rad' }),
Sim('pid', { Kp: 2 }),
```

Après toute modification, régénérer la liste du cache hors ligne :

```bash
node tools/build-sw.mjs
```

## Application Android (APK)

Le dossier `android/` contient une coquille Android minimale qui embarque l'application web et la fait tourner hors connexion. Pour reconstruire l'APK :

```bash
export ANDROID_HOME=/chemin/vers/android-sdk   # avec platforms;android-34 et build-tools;35.0.0
./android/build-apk.sh                         # produit android/RoboMaster.apk
```

Le script n'utilise ni Gradle ni Android Studio : aapt2, javac, d8, zipalign et apksigner suffisent. La clé `android/robomaster.keystore` sert uniquement aux versions de test ; elle est conservée pour que chaque nouvelle APK s'installe par-dessus la précédente sans perdre la progression.
