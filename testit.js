/*
 * testit.js
 * Tests the updated BAGE engine
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

window.onload = function () {  
  game.graphics.setupGfx(400, 300);

  // Set up text boxes using the engine's addTextBox method
  scoreLbl = game.graphics.addTextBox({
    posx: -10,
    posy: 0,
    width: 300,
    font: "10px Arial",
    align: "right",
    text: ""
  });

  levelLbl = game.graphics.addTextBox({
    posx: 10,
    posy: 0,
    width: 300,
    font: "10px Arial",
    align: "left",
    text: ""
  });

  // Create Mario sprite
  mario = new Sprite(game.graphics, {
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
    x: game.graphics.canvas.width / 2,
    y: 100,
    onUpdate: function (frameRatio) {
      this.onFloor = this.hitTestList(this.x, Math.round(this.y + 1), obstacles);
      if (this.onFloor) {
        this.speedy = Math.min(this.speedy, 0);
      } else {
        this.speedy += 0.25 * frameRatio; // Gravity scaled by frameRatio
      }

      // Update camera location
      if (this.x + loc.x < 80) {
        loc.x = 80 - this.x;
      } else if (game.graphics.canvas.width - (this.x + loc.x) < 80) {
        loc.x = game.graphics.canvas.width - 80 - this.x;
      }
      if (this.y + loc.y < 80) {
        loc.y = 80 - this.y;
      } else if (game.graphics.canvas.height - (this.y + loc.y) < 80) {
        loc.y = game.graphics.canvas.height - 80 - this.y;
      }
      game.graphics.loc = loc; // Update graphics loc for rendering

      // Handle jump
      if (this.jump) {
        this.jump = null;
        this.framei = null;
        if (this.onFloor) {
          this.speedy = -3; // Jump strength
        }
      }
    }
  });
  sprites.push(mario);
  game.graphics.obstacles = obstacles; // Assign obstacles to graphics

  // Create ground obstacles
  var ground = new Sprite(game.graphics, {
    color: "#999988",
    tileWidth: 128,
    tileHeight: 16,
    x: game.graphics.canvas.width / 2 - 64,
    y: game.graphics.canvas.height - 30 - 16
  });
  obstacles.push(ground);

  ground = new Sprite(game.graphics, {
    color: "#99aa88",
    tileWidth: 40,
    tileHeight: 40,
    x: game.graphics.canvas.width / 2 - 64 - 40,
    y: game.graphics.canvas.height - 30 - 34
  });
  obstacles.push(ground);
  
  ground = new Sprite(game.graphics, {
    color: "#99cc88",
    tileWidth: 10,
    tileHeight: 20,
    x: game.graphics.canvas.width / 2 - 64,
    y: game.graphics.canvas.height - 30 - 24
  });
  obstacles.push(ground);
  
  ground = new Sprite(game.graphics, {
    color: "#99cc88",
    tileWidth: 10,
    tileHeight: 20,
    x: game.graphics.canvas.width / 2 + 64 - 10,
    y: game.graphics.canvas.height - 30 - 24,
    flipx: true
  });
  obstacles.push(ground);

  ground = new Sprite(game.graphics, {
    color: "#999988",
    tileWidth: 40,
    tileHeight: 80,
    x: game.graphics.canvas.width / 2 + 64,
    y: game.graphics.canvas.height - 30 - 80
  });
  obstacles.push(ground);

  // Initialize game state
  score = 0;
  level = 1;
  mario.visible = true;
  mario.put(game.graphics.canvas.width / 2, game.graphics.canvas.height / 2, obstacles);

  // Set up the game loop
  game.setTickCallback( game_tick );
  game.setStepCallback( game_step );
  
  game.setGameState("running");  
}

 
function game_tick(ratio) {
  updateMarioDir();
}

function game_step(ratio) {
  scoreLbl.innerHTML = `x: ${mario.x.toFixed(1)}, y:${mario.y.toFixed(1)}  ${mario.onFloor ? "F" : " "} ${mario.flipx ? "-" : ""}<br>` +
    `Sx:${mario.speedx.toFixed(1).padStart(5, " ")}  Sy:${mario.speedy.toFixed(1).padStart(5, " ")}`;
}
  
  
// Override drawBg to set a solid background color
game.graphics.drawBg = function () {
  game.graphics.ctx.fillStyle = "#111133";
  game.graphics.ctx.fillRect(0, 0, game.graphics.canvas.width, game.graphics.canvas.height);
};

function updateMarioDir() {
  const controller = game.controllers.getController();
  
  mario.speedx = 0;
  mario.speedy = mario.speedy || 0;

  if (controller.iLeft) mario.speedx -= marioSpeed;
  if (controller.iRight) mario.speedx += marioSpeed;
  //if (controller.iUp) mario.speedy -= marioSpeed;
  //if (controller.iDown) mario.speedy += marioSpeed;

  if (controller.iBtnAd) { // 'X' key pressed for jump
    if (!mario.jump) {
      mario.jump = new Date().getTime();
      mario.framei = 2;
    }
  }

  if (mario.speedx < 0) mario.flipx = true;
  else if (mario.speedx > 0) mario.flipx = false;
}