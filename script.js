const canvas = document.getElementById("gameCanvas");
const c = canvas.getContext("2d");

const container = document.querySelector(".container");

/** SPRITES */
function loadSprite(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src + "?t=" + new Date().getTime();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

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

function drawFrame(spritesheet, framePos, frameSize, canvasPos, scale = 1) {
  c.drawImage(
    spritesheet,
    framePos.x,
    framePos.y,
    frameSize,
    frameSize,
    canvasPos.x,
    canvasPos.y,
    frameSize * scale,
    frameSize * scale
  );
}

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

      if (typeof data.currentAnim === "number") {
        data.currentFrame = data.currentAnim;
        data.currentFramePos = framesPos[data.currentFrame];
        return;
      }

      if (!data.currentFrame) {
        data.currentAnimFrameIndex = 0;
        data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
      }

      if (
        data.currentAnimFrameIndex >= data.currentAnim.frames.length - 1 &&
        data.currentAnim.loop
      ) {
        data.currentAnimFrameIndex = 0;
        data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
      }

      data.currentFrame = data.currentAnim.frames[data.currentAnimFrameIndex];
      data.currentFramePos = framesPos[data.currentFrame];

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
/** END SPRITES */

window.onresize = () => {
  document.documentElement.style.setProperty(
    "--scale",
    Math.min(
      container.parentElement.offsetWidth / container.offsetWidth,
      container.parentElement.offsetHeight / container.offsetHeight
    )
  );
};

async function main() {
  c.imageSmoothingEnabled = false; // ne pas lisser l'image (évite un effet flou)
  const cavalier1Spritesheet = await loadSprite(
    "https://i.imgur.com/34MQN88.png"
  );
  const cavalier2Spritesheet = await loadSprite(
    "https://i.imgur.com/UqkOcRY.png"
  );

  const frameSize = 80;
  const cavalier1framesPos = generateFramesPosInSpritesheet(10, 4, frameSize);
  const cavalier1Anims = {
    idle: 30,
    attack: {
      frames: Array.from({ length: 31 }, (_, index) => index),
      speed: 24,
      loop: true
    }
  };
  const cavalier2framesPos = generateFramesPosInSpritesheet(11, 4, frameSize);
  const cavalier2Anims = {
    idle: 30,
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

  function gameLoop(timeStamp) {
    console.log("chrono: " + timeStamp + "ms ecoulées");
    dt = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    fps = Math.round(1 / dt);
    console.log(`FPS ${fps}`);

    if (fps >= minFrameRate) {
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = "#F6F6DB";
      c.fillRect(0, 0, canvas.width, canvas.height);

      cavalier1Sprite.update(dt);
      cavalier1Sprite.draw();
      cavalier2Sprite.update(dt);
      cavalier2Sprite.draw();
    }

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
