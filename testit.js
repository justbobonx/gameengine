/*
 * testit.js
 * Tests the updated BAGE engine with larger grid-aligned terrain
 *
 * Code Format: Use 2-space tabs for indentation
 */

var sprites = [];
var obstacles = [];

var scoreLbl;
var score;

var levelLbl;
var level;

var loc = { x: 0, y: 0 };

var marioSpeed = 2;
var mario;
var middleY;

const game = new Game();

function centerCameraOn(worldX, worldY) {
  loc.x = game.graphics.canvas.width / 2 - worldX;
  loc.y = game.graphics.canvas.height / 2 - worldY;
  game.graphics.loc = loc;
}

function goFullscreen() {
  const oldW = game.graphics.canvas.width;
  const oldH = game.graphics.canvas.height;
  game.graphics.resizeToFullscreen();
  loc.x += (game.graphics.canvas.width - oldW) / 2;
  loc.y += (game.graphics.canvas.height - oldH) / 2;
  game.graphics.loc = loc;
}

window.onload = function () {
  game.graphics.resizeToFullscreen();
  window.addEventListener("resize", goFullscreen);

  // Set up text boxes
  scoreLbl = game.graphics.addTextBox({
    posx: -10,
    posy: 10,
    width: 300,
    font: "12px Arial",
    align: "right",
    text: ""
  });

  levelLbl = game.graphics.addTextBox({
    posx: 10,
    posy: 10,
    width: 300,
    font: "12px Arial",
    align: "left",
    text: "Level 1"
  });

  // Create Mario sprite
  mario = new Sprite({
    url: "guy.png",
    tileWidth: 10,
    tileHeight: 16,
    hitoffx: 2,
    hitoffy: 3,
    hitWidth: 6,
    hitHeight: 12,
    tileOrX: 5,
    tileOrY: 15,
    speed: 6,
    frameCount: 2,
    aniSpeed: 150,
    x: 0,
    y: 96,
    onUpdate: function (frameRatio) {
      this.onFloor = this.hitTestList(this.x, Math.round(this.y + 1), obstacles);
      if (this.onFloor) {
        this.speedy = Math.min(this.speedy, 0);
      } else {
        this.speedy += 0.25 * frameRatio;
      }

      // Handle jump
      if (this.jump) {
        this.jump = null;
        this.framei = null;
        if (this.onFloor) {
          this.speedy = -3;
        }
      }

      // Check for fall-off and reset at world x=0
      if (this.y > game.graphics.canvas.height + 200) {
        this.put(0, middleY - 40, obstacles);
        this.speedx = 0;
        this.speedy = 0;
        centerCameraOn(0, this.y);
      }

      // Camera following with edge deadzones; start already has x=0 at center
      if (this.x + loc.x < 80) {
        loc.x = 80 - this.x;
      } else if (game.graphics.canvas.width - (this.x + loc.x) < 80) {
        loc.x = game.graphics.canvas.width - 80 - this.x;
      }
      if (this.y + loc.y < 100) {
        loc.y = 100 - this.y;
      } else if (game.graphics.canvas.height - (this.y + loc.y) < 100) {
        loc.y = game.graphics.canvas.height - 100 - this.y;
      }
      game.graphics.loc = loc;
    }
  });
  sprites.push(mario);
  game.graphics.obstacles = obstacles;

  // Generate larger procedural terrain and get middle platform Y
  middleY = generateTerrain();
  if (middleY == null) {
    middleY = game.graphics.canvas.height / 2;
  }

  // Initialize game state: guy at world x=0, camera puts that at screen center
  score = 0;
  level = 1;
  mario.visible = true;
  mario.put(0, middleY - 60);
  centerCameraOn(0, mario.y);

  // Set up game loop
  game.setTickCallback(game_tick);
  game.setStepCallback(game_step);
  game.setGameState("running");
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else if (h < 360) { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

const gridSize = 8;

function randInt(min, max) {
  const range = max - min;
  const randomStep = Math.floor(Math.random() * (range + 1));
  return (min + randomStep) * gridSize;
}

function generateTerrain() {
  const canvasWidth = game.graphics.canvas.width;
  const canvasHeight = game.graphics.canvas.height;

  let currentX = -2000; // Left edge
  let currentTopY = canvasHeight - gridSize * randInt(2, 4);
  let midY;

  while (currentX < 2000) {
    const width = randInt(1, 6);
    const scaleX = width / 32;
    const height = randInt(2, 6);
    const scaleY = height / 32;

    const hue = Math.floor(Math.random() * 361);
    const saturation = Math.floor(Math.random() * 11) + 90;
    const lightness = 50;
    const color = hslToHex(hue, saturation, lightness);

    const platform = new Sprite({
      url: "floor.png",
      image_blend: color,
      scalex: scaleX,
      scaley: scaleY,
      x: currentX,
      y: currentTopY
    });
    obstacles.push(platform);

    if (currentX < 0 && currentX + width > 0) {
      midY = currentTopY;
    }

    currentX += width + randInt(-2, 4);
    currentTopY += randInt(-2, 2);
  }

  return midY;
}

function game_tick(ratio) {
  updateMarioDir();
}

function game_step(ratio) {
  scoreLbl.innerHTML =
    `X: ${mario.x.toFixed(1).padStart(6)}  Y: ${mario.y.toFixed(1).padStart(6)}<br>` +
    `Sx: ${mario.speedx.toFixed(1).padStart(4)}  Sy: ${mario.speedy.toFixed(1).padStart(4)}  ` +
    `${mario.onFloor ? "Floor" : "Air"}  Facing: ${mario.facingx}`;

  // Draw controller debug
  drawControllerDebug();
}

game.graphics.drawBg = function () {
  game.graphics.ctx.fillStyle = "#111133";
  game.graphics.ctx.fillRect(0, 0, game.graphics.canvas.width, game.graphics.canvas.height);
  drawControllerDebug();
};

function updateMarioDir() {
  const controller = game.controllers.getController();

  mario.speedx = 0;
  mario.speedy = mario.speedy || 0;

  if (controller.iLeft) mario.speedx -= marioSpeed;
  if (controller.iRight) mario.speedx += marioSpeed;

  if (controller.iBtnA) {
    if (!mario.jump) {
      mario.jump = new Date().getTime();
      mario.jumped = true;
      mario.framei = 2;
    }
  }

  if (mario.speedx < 0) mario.facingx = -1;
  else if (mario.speedx > 0) mario.facingx = 1;
}

// New function to draw controller debug in upper left
function drawControllerDebug() {
  const controller = game.controllers.getController();
  const ctx = game.graphics.ctx;

  // Save context state and set up text styling
  ctx.save();
  ctx.font = "10px monospace";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Position starting at top-left (10, 10)
  let x = 10;
  let y = 10;
  const lineHeight = 12;

  // Helper function to add a line of text
  function addLine(label, value) {
    ctx.fillText(`${label.padEnd(10)}: ${value}`, x, y);
    y += lineHeight;
  }

  // Restore context state
  ctx.restore();
}
