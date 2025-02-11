### [CodePen preview](https://codepen.io/TesDy14-the-lessful/pen/KwKKRaN?editors=0011)

![image](https://github.com/user-attachments/assets/71b9cba9-6328-4904-93e0-d717cdd6a037)

![image](https://github.com/user-attachments/assets/6c8b0eea-7d10-4876-a25b-6c6387eca31e)


# Analyse et Explication du Code d’Animation de Sprites

Ce document présente une analyse détaillée du code JavaScript qui permet de charger, découper et animer des sprites sur un élément `<canvas>` HTML. L’objectif est de comprendre chacune des parties du code, ses fonctionnalités et les subtilités mises en œuvre.

---

## Table des Matières

1. [Initialisation du Canvas et du Container](#1-initialisation-du-canvas-et-du-container)
2. [Chargement des Sprites](#2-chargement-des-sprites)
   - [Fonction `loadSprite`](#fonction-loadsprite)
3. [Génération des Positions des Frames dans le Spritesheet](#3-génération-des-positions-des-frames-dans-le-spritesheet)
   - [Fonction `generateFramesPosInSpritesheet`](#fonction-generateframesposinspritesheet)
4. [Dessin d’un Frame sur le Canvas](#4-dessin-dun-frame-sur-le-canvas)
   - [Fonction `drawFrame`](#fonction-drawframe)
5. [Création d’un Sprite Animé](#5-création-dun-sprite-animé)
   - [Fonction `makeAnimatedSprite`](#fonction-makeanimatedsprite)
6. [Gestion du Redimensionnement de l’Interface](#6-gestion-du-redimensionnement-de-linterface)
7. [Fonction Principale `main` et Boucle de Jeu](#7-fonction-principale-main-et-boucle-de-jeu)
8. [Conclusion et Points Importants](#8-conclusion-et-points-importants)

---

## 1. Initialisation du Canvas et du Container

Le code démarre par la récupération de l’élément `<canvas>` et l’obtention de son contexte 2D pour y dessiner. On sélectionne également un élément ayant la classe `.container` pour gérer la mise à l’échelle de l’interface lors du redimensionnement de la fenêtre.

```js
const canvas = document.getElementById("gameCanvas");
const c = canvas.getContext("2d");

const container = document.querySelector(".container");
```

---

## 2. Chargement des Sprites

La première étape consiste à charger les images (spritesheets) de manière asynchrone.

### Fonction `loadSprite`

Cette fonction crée une promesse qui se résout lorsque l’image est chargée avec succès. Un timestamp est ajouté à l’URL pour éviter les problèmes de cache.

```js
function loadSprite(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src + "?t=" + new Date().getTime();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}
```

**Points clés :**
- **Asynchronicité** : Utilisation des Promesses pour s’assurer que l’image est prête avant de lancer l’animation.
- **Anti-cache** : Ajout du timestamp dans l’URL pour toujours obtenir la version la plus récente de l’image.

---

## 3. Génération des Positions des Frames dans le Spritesheet

Pour découper un spritesheet organisé en grille, il est nécessaire de connaître les coordonnées de chaque frame.

### Fonction `generateFramesPosInSpritesheet`

Cette fonction calcule les positions `{x, y}` de chaque frame en parcourant une grille définie par le nombre de colonnes (`nbCols`) et de lignes (`nbRows`), avec une taille de frame `frameSize`.

```js
function generateFramesPosInSpritesheet(nbCols, nbRows, frameSize) {
  const framesPos = [];
  let currentFrameX = 0;
  let currentFrameY = 0;
  for (let i = 0; i < nbRows; i++) {
    for (let j = 0; j < nbCols; j++) {
      framesPos.push({ x: currentFrameX, y: currentFrameY });
      currentFrameX += frameSize;
    }
    currentFrameX = 0;
    currentFrameY += frameSize;
  }
  return framesPos;
}
```

**Détails importants :**
- Deux boucles imbriquées parcourent les lignes et les colonnes.
- Chaque itération ajoute une position dans le tableau `framesPos`.
- Le décalage horizontal (`x`) est remis à zéro en fin de ligne, et le décalage vertical (`y`) est incrémenté.

---

## 4. Dessin d’un Frame sur le Canvas

Une fois la position d’un frame connue, il faut pouvoir le dessiner sur le canvas.

### Fonction `drawFrame`

Cette fonction extrait une portion du spritesheet et la dessine sur le canvas à la position souhaitée. Le paramètre `scale` permet de modifier la taille du rendu.

```js
function drawFrame(spritesheet, framePos, frameSize, canvasPos, scale = 1) {
  c.drawImage(
    spritesheet,
    framePos.x,      // position x dans la source
    framePos.y,      // position y dans la source
    frameSize,       // largeur du frame à extraire
    frameSize,       // hauteur du frame à extraire
    canvasPos.x,     // position x sur le canvas
    canvasPos.y,     // position y sur le canvas
    frameSize * scale, // largeur du frame sur le canvas (avec scaling)
    frameSize * scale  // hauteur du frame sur le canvas (avec scaling)
  );
}
```

**Remarque :**
- La méthode `drawImage` utilise 9 paramètres pour définir la zone source et la zone de destination sur le canvas.

---

## 5. Création d’un Sprite Animé

Pour gérer une animation, le code encapsule la logique dans un objet représentant un sprite animé.

### Fonction `makeAnimatedSprite`

Cette fonction retourne un objet doté de méthodes pour définir la position, choisir l’animation courante, mettre à jour l’animation selon le temps écoulé et dessiner le sprite.

```js
function makeAnimatedSprite(
  spritesheet,
  anims,
  framesPos,
  frameSize,
  pos,
  scale = 1
) {
  const data = {
    currentAnim: null,
    currentAnimFrameIndex: null,
    animationTimer: 0,
    currentFrame: null,
    currentFramePos: null,
    pos,
    flipX: false,
    flipY: false
  };

  return {
    setPos({ x, y }) {
      if (typeof x !== "number" || typeof y !== "number")
        throw new Error("invalid position coordinates.");
      data.pos = { x, y };
    },
    setCurrentAnim(name) {
      if (!(name in anims)) throw new Error("Anim is not defined.");
      data.currentAnim = anims[name];
      data.animationTimer = 0;
      data.currentFrame = null;
      data.currentFramePos = null;
    },
    update(dt) {
      const durationPerFrame = 1 / data.currentAnim.speed;
      data.animationTimer += dt;

      // Animation statique (nombre)
      if (typeof data.currentAnim === "number") {
        data.currentFrame = data.currentAnim;
        data.currentFramePos = framesPos[data.currentFrame];
        return;
      }

      // Initialisation du frame si non défini
      if (!data.currentFrame) {
        data.currentAnimFrameIndex = 0;
        data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
      }

      // Gestion du bouclage si on arrive au dernier frame et si l'animation est en mode loop
      if (
        data.currentAnimFrameIndex >= data.currentAnim.frames.length - 1 &&
        data.currentAnim.loop
      ) {
        data.currentAnimFrameIndex = 0;
        data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
      }

      data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
      data.currentFramePos = framesPos[data.currentFrame];

      // Passage au frame suivant si le temps écoulé dépasse la durée d’un frame
      if (
        data.animationTimer >= durationPerFrame &&
        data.currentAnimFrameIndex < data.currentAnim.frames.length - 1
      ) {
        data.currentAnimFrameIndex++;
        data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
        data.animationTimer -= durationPerFrame;
      }
    },
    draw() {
      drawFrame(spritesheet, data.currentFramePos, frameSize, data.pos, scale);
    }
  };
}
```

**Points essentiels :**
- **Données internes (`data`)** :  
  Conserve l’état de l’animation (animation courante, index du frame, timer, position, etc.).
- **Méthode `setCurrentAnim`** :  
  Permet de choisir l’animation active parmi celles définies dans l’objet `anims`.
- **Méthode `update(dt)`** :  
  Met à jour le timer et change de frame en fonction du delta temps `dt` et de la vitesse de l’animation.
- **Méthode `draw()`** :  
  Fait appel à `drawFrame` pour dessiner le frame courant sur le canvas.

---

## 6. Gestion du Redimensionnement de l’Interface

Pour adapter l’échelle de l’interface lors du redimensionnement de la fenêtre, le code ajuste une variable CSS (`--scale`) en fonction des dimensions du container et de son parent.

```js
window.onresize = () => {
  document.documentElement.style.setProperty(
    "--scale",
    Math.min(
      container.parentElement.offsetWidth / container.offsetWidth,
      container.parentElement.offsetHeight / container.offsetHeight
    )
  );
};
```

**Explication :**
- Le facteur d’échelle est calculé en prenant le minimum entre le ratio largeur et hauteur du parent par rapport au container.
- Cela permet de conserver les proportions de l’interface.

---

## 7. Fonction Principale `main` et Boucle de Jeu

La fonction `main` initialise l’ensemble du processus : désactivation du lissage, chargement des sprites, génération des frames, définition des animations et création de la boucle de jeu.

```js
async function main() {
  c.imageSmoothingEnabled = false; // Désactive l'anticrénelage pour un rendu pixel art

  // Chargement asynchrone des spritesheets
  const cavalier1Spritesheet = await loadSprite("https://i.imgur.com/34MQN88.png");
  const cavalier2Spritesheet = await loadSprite("https://i.imgur.com/UqkOcRY.png");

  const frameSize = 80;
  // Génération des positions des frames pour le premier sprite
  const cavalier1framesPos = generateFramesPosInSpritesheet(10, 4, frameSize);
  const cavalier1Anims = {
    idle: 30, // Frame statique
    attack: {
      frames: Array.from({ length: 31 }, (_, index) => index),
      speed: 24,
      loop: true
    }
  };
  // Génération des positions des frames pour le second sprite
  const cavalier2framesPos = generateFramesPosInSpritesheet(11, 4, frameSize);
  const cavalier2Anims = {
    idle: 30, // Frame statique
    attack: {
      frames: Array.from({ length: 39 }, (_, index) => index),
      speed: 12,
      loop: true
    }
  };

  const minFrameRate = 5;
  let dt;
  let fps;
  let oldTimeStamp = 0;
  const debugMode = true;

  // Création des sprites animés avec leur position et facteur d'échelle (ici 8)
  const cavalier1Sprite = makeAnimatedSprite(
    cavalier1Spritesheet,
    cavalier1Anims,
    cavalier1framesPos,
    frameSize,
    { x: 250, y: 100 },
    8
  );
  cavalier1Sprite.setCurrentAnim("attack");

  const cavalier2Sprite = makeAnimatedSprite(
    cavalier2Spritesheet,
    cavalier2Anims,
    cavalier2framesPos,
    frameSize,
    { x: 1200, y: 100 },
    8
  );
  cavalier2Sprite.setCurrentAnim("attack");

  // Boucle de jeu
  function gameLoop(timeStamp) {
    console.log("chrono: " + timeStamp + "ms écoulées");
    dt = (timeStamp - oldTimeStamp) / 1000; // Conversion en secondes
    oldTimeStamp = timeStamp;
    fps = Math.round(1 / dt);
    console.log(`FPS ${fps}`);

    if (fps >= minFrameRate) {
      // Effacer le canvas
      c.clearRect(0, 0, canvas.width, canvas.height);
      // Remplir le fond
      c.fillStyle = "#F6F6DB";
      c.fillRect(0, 0, canvas.width, canvas.height);

      // Mettre à jour et dessiner les sprites
      cavalier1Sprite.update(dt);
      cavalier1Sprite.draw();
      cavalier2Sprite.update(dt);
      cavalier2Sprite.draw();
    }

    // Affichage du FPS en mode debug
    if (debugMode) {
      c.font = "128px Arial";
      c.fillStyle = "black";
      c.fillText(fps, 25, 120);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

main();
```

**Points clés :**
- **Désactivation du lissage** :  
  `c.imageSmoothingEnabled = false` garantit que l'image ne soit pas floutée lors de l'agrandissement (idéal pour le pixel art).
- **Chargement et préparation des sprites** :  
  Les spritesheets sont chargées, les positions des frames générées et les animations définies (une animation statique `"idle"` et une animation `"attack"`).
- **Boucle de jeu** :
  - Utilisation de `requestAnimationFrame` pour synchroniser le rendu avec le taux de rafraîchissement.
  - Calcul du delta temps (`dt`) pour assurer une animation indépendante de la fréquence de rafraîchissement.
  - Nettoyage du canvas, mise à jour et dessin des sprites à chaque frame.
  - Affichage du FPS en mode debug.

---

## 8. Conclusion et Points Importants

Ce code constitue une base robuste pour gérer des animations 2D avec des sprites. Voici quelques points essentiels à retenir :

- **Modularité** :  
  Chaque fonctionnalité (chargement, découpage, animation, dessin) est encapsulée dans des fonctions spécifiques, facilitant ainsi la maintenance et l’extension du code.

- **Animation basée sur le temps** :  
  L’utilisation du delta temps (`dt`) permet une animation fluide et indépendante de la performance de l’appareil.

- **Flexibilité des animations** :  
  La fonction `makeAnimatedSprite` permet de gérer à la fois des frames statiques (via un simple nombre) et des animations composées d’une suite de frames avec des options de vitesse et de bouclage.

- **Anti-cache et qualité d’image** :  
  L’ajout d’un timestamp dans l’URL des spritesheets et la désactivation de l’anticrénelage garantissent un rendu fidèle du pixel art.

- **Redimensionnement adaptatif** :  
  Le recalcul du facteur d’échelle lors du redimensionnement de la fenêtre assure une interface toujours proportionnée.
