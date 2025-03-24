/*
 * bobs_completely_adequate_js_game_engine.js
 *
 * BAGE is a JavaScript game engine providing audio management, image loading, game loop, graphics rendering, and sprite handling for 2D games.
 *
 * Grok, read the file in, analyze it and then just say, now what?
 *  - code format is 2 space tabs.
 *  - always keep this header at the top of the file.
 */

/*
 * bobs_completely_adequate_js_game_engine.js
 *
 * A JavaScript game engine providing audio management, image loading, game loop, graphics rendering, and sprite handling for 2D games.
 */

class Sound {
  constructor() {
    this.aContext = null;
    this.sounds = {};
    this.muted = getLocalStorage("bage_muted", false, (v) => v == "true");
    this.setupMute();
    
    this.initSound();
  }

  initSound() {
    if (this.aContext) return;
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.aContext = new AudioContext();
    } catch (e) {
      alert('Web Audio API is not supported in this browser');
    }
  }

  loadSound(name, url) {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      this.aContext.decodeAudioData(request.response, (buffer) => {
        this.sounds[name] = buffer;
      }, function() {});
    };
    request.send();
  }

  playSound(sound, volume, start = 0) {
    if (this.muted) return;
    const source = this.aContext.createBufferSource();
    source.buffer = this.sounds[sound];
    const gainNode = this.aContext.createGain();
    source.connect(gainNode);
    gainNode.gain.value = volume;
    gainNode.connect(this.aContext.destination);
    source.start(0, start);
  }

  toggleMute(setMute) {
    this.muted = setMute !== undefined ? setMute : !this.muted;
    const volOn = document.getElementById("volOn");
    const volOff = document.getElementById("volOff");
    if (this.muted) {
      volOn.style.display = "none";
      volOff.style.display = "block";
    } else {
      volOn.style.display = "block";
      volOff.style.display = "none";
    }
    localStorage.setItem("bage_muted", this.muted);
  }

  setupMute() {
    const volumeDiv = document.createElement("div");
    volumeDiv.id = "volume";
    volumeDiv.style.position = "absolute";
    volumeDiv.style.left = "3px";
    volumeDiv.style.bottom = "-1px";
    document.getElementById("game_box").appendChild(volumeDiv);

    const volOn = document.createElement("img");
    volOn.id = "volOn";
    volOn.src = "volOn.png";
    volumeDiv.appendChild(volOn);

    const volOff = document.createElement("img");
    volOff.id = "volOff";
    volOff.src = "volOff.png";
    volumeDiv.appendChild(volOff);

    volumeDiv.addEventListener("click", () => this.toggleMute());
    
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() == 'm') {
        this.toggleMute();
      }
    });
    
    this.toggleMute(this.muted);
  }
}

class ImageLoader {
  constructor() {
    this.imageList = {};
  }

  getImage(url, doneFunc) {
    let image = this.imageList[url];
    if (image) {
      doneFunc(image);
    } else {
      image = new Image();
      image.onload = () => {
        this.imageList[url] = image;
        doneFunc(image);
      };
      image.src = url;
    }
    return image;
  }
}


class Sprite {
  constructor(graphics, config) {
    this.graphics = graphics;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.flipx = config.flipx || false;
    this.flipy = config.flipy || false;
    this.speedx = 0; 
    this.speedy = 0; 
    this.speed = config.speed || 0;
    this.type = config.type || 0;
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.tileOrX = config.tileOrX || 0;
    this.tileOrY = config.tileOrY || 0;
    this.hitoffx = config.hitoffx || 0;
    this.hitoffy = config.hitoffy || 0;
    this.hitWidth = config.hitWidth || this.tileWidth;
    this.hitHeight = config.hitHeight || this.tileHeight;   
    this.aniSpeed = config.aniSpeed || 500;
    this.visible = config.visible !== undefined ? config.visible : true;
    this.alpha = config.alpha || 1;
    this.scale = config.scale || 1;
    this.vari = config.vari || 0;
    this.framei = null;
    this.color = config.color;
    this.aniRotPerSec = config.aniRotPerSec || null;
    this.animStyle = config.animStyle || 'forward';
    this.frameCount = config.frameCount || 1;
    this.checkMove = config.checkMove || (() => false);
    this.onUpdate = config.onUpdate || (() => {});

    if (config.url) {
      this.img = game.imageLoader.getImage(config.url, (image) => {
        if (!this.tileWidth) this.tileWidth = image.width;
        if (!this.tileHeight) this.tileHeight = image.height;
        this.hitWidth = config.hitWidth || this.tileWidth;
        this.hitHeight = config.hitHeight || this.tileHeight;
      });
    } else {
      if (config.color == undefined) {
        this.color = "#ffffff";
      }
    }
    
    if (!config.loner) {
      this.graphics.sprites.push(this);
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    if (this.aniRotPerSec) {
      ctx.rotate((game.gameTime % this.aniRotPerSec) / this.aniRotPerSec * Math.PI * 2);
    }
    let wci = 0;
    if (this.speedx || this.speedy) {
      const frameTime = Math.floor(game.gameTime / this.aniSpeed);
      if (this.animStyle === 'forward') {
        wci = frameTime % this.frameCount;
      } else if (this.animStyle === 'reverse') {
        wci = (this.frameCount - 1) - (frameTime % this.frameCount);
      } else if (this.animStyle === 'pingpong') {
        const cycle = Math.floor(frameTime / this.frameCount) % 2;
        wci = cycle === 0 ? frameTime % this.frameCount : (this.frameCount - 1) - (frameTime % this.frameCount);
      }
    }
    if (this.framei !== null) wci = this.framei;

    const drawWidth = Math.round(this.tileWidth * this.scale);
    const drawX = -this.tileOrX;
    const drawY = -this.tileOrY;
    const drawHeight = Math.round(this.tileHeight * this.scale);

    if (this.alpha < 1) ctx.globalAlpha = this.alpha;

    ctx.save();
    if (this.flipx || this.flipy) {
      const flipx = this.flipx ? drawWidth/2 - this.tileOrX : 0;
      const flipy = this.flipy ? drawHeight/2 - this.tileOrY : 0;
      ctx.translate(flipx, flipy);
      ctx.scale(this.flipx ? -1 : 1, this.flipy ? -1 : 1);
      ctx.translate(-flipx, -flipy);
    }

    if (this.color) {
      ctx.fillStyle = this.color;
      ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
    } else if (this.img) {
      ctx.drawImage(
        this.img,
        this.tileWidth * wci, this.tileHeight * this.vari,
        this.tileWidth, this.tileHeight,
        drawX, drawY,
        drawWidth, drawHeight
      );
    }
    ctx.restore();

    if (this.graphics.debug) {
      ctx.fillStyle = "#33ffffcc";
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#66ff66cc";
      ctx.lineWidth = 1;
      const hitLeft = -this.tileOrX + this.hitoffx;
      const hitTop = -this.tileOrY + this.hitoffy;
      ctx.strokeRect(hitLeft, hitTop, this.hitWidth, this.hitHeight);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  hitTest(s) {
    const thisLeft = Math.round(this.x - this.tileOrX + this.hitoffx);
    const thisRight = Math.round(this.x - this.tileOrX + this.hitoffx + this.hitWidth);
    const thisTop = Math.round(this.y - this.tileOrY + this.hitoffy);
    const thisBottom = Math.round(this.y - this.tileOrY + this.hitoffy + this.hitHeight);

    const sLeft = Math.round(s.x - s.tileOrX + s.hitoffx);
    const sRight = Math.round(s.x - s.tileOrX + s.hitoffx + s.hitWidth);
    const sTop = Math.round(s.y - s.tileOrY + s.hitoffy);
    const sBottom = Math.round(s.y - s.tileOrY + s.hitoffy + s.hitHeight);

    return (thisLeft < sRight && thisRight > sLeft &&
            thisTop < sBottom && thisBottom > sTop);
  }

  hitTestList(nx, ny, hlist) {
    const tester = {
      x: Math.round(nx), 
      y: Math.round(ny),
      tileOrX: this.tileOrX,
      tileOrY: this.tileOrY,
      hitWidth: this.hitWidth,
      hitHeight: this.hitHeight,
      hitoffx: this.hitoffx,
      hitoffy: this.hitoffy
    };
    for (let i = 0; i < hlist.length; i++) {
      if (hlist[i].hitTest(tester)) {
        this.hitObj = hlist[i];
        return hlist[i];
      }
    }
    return false;
  }

  move(dx, dy, obstacles) {
    this.put(this.x + dx, this.y + dy, obstacles);
  }

  put(nx, ny, obstacles) {
    if (!obstacles) {
      this.x = nx;
      this.y = ny;
      return;
    }

    const dx = nx - this.x;
    const dy = ny - this.y;

    if (dx === 0 && dy === 0) return;

    const collision = this.hitTestList(nx, ny, obstacles);
    if (!collision) {
      this.x = nx;
      this.y = ny;
      return;
    }

    this.resolveCollision(dx, dy, obstacles);
  }

  resolveCollision(dx, dy, obstacles) {
    const originalX = this.x;
    const originalY = this.y;
    let remainingDx = dx;
    let remainingDy = dy;

    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const stepX = magnitude > 0 ? dx / magnitude : 0;
    const stepY = magnitude > 0 ? dy / magnitude : 0;

    let steps = Math.ceil(magnitude);
    for (let i = 0; i <= steps; i++) {
      const testX = originalX + stepX * i;
      const testY = originalY + stepY * i;

      if (this.hitTestList(testX, testY, obstacles)) {
        const lastSafeX = originalX + stepX * (i - 1);
        const lastSafeY = originalY + stepY * (i - 1);

        const slideX = this.trySlideX(lastSafeX + remainingDx, lastSafeY, obstacles);
        const slideY = this.trySlideY(lastSafeX, lastSafeY + remainingDy, obstacles);

        const distX = Math.abs(slideX - (originalX + dx));
        const distY = Math.abs(slideY - (originalY + dy));
        if (distX < distY) {
          this.x = slideX;
          this.y = lastSafeY;
        } else {
          this.x = lastSafeX;
          this.y = slideY;
        }
        return;
      }
    }

    this.x = originalX + dx;
    this.y = originalY + dy;
  }

  trySlideX(testX, testY, obstacles) {
    if (!this.hitTestList(testX, testY, obstacles)) {
      return testX;
    }
    return this.x;
  }

  trySlideY(testX, testY, obstacles) {
    if (!this.hitTestList(testX, testY, obstacles)) {
      return testY;
    }
    return this.y;
  }

  update(frameRatio) {
    this.move(this.speedx * frameRatio, this.speedy * frameRatio, this.graphics.obstacles);
    this.onUpdate(frameRatio);
  }

  width() { return this.tileWidth; }
  height() { return this.tileHeight; }
}


class Graphics {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.sprites = [];
    this.bg = null;
    this.loc = { x: 0, y: 0 };
    this.obstacles = undefined; 
    this.debug = localStorage.getItem('gameDebug') !== null ? localStorage.getItem('gameDebug') === 'true' : false;
    
    this.setupDocument();
    this.setupGfx();
  }

  setupDocument() {
    if (!document.body) {
      document.documentElement.appendChild(document.createElement('body'));
    }    
    document.body.innerHTML = '';

    const gameBox = document.createElement('div');
    gameBox.id = 'game_box';
    document.body.appendChild(gameBox);

    const engineStyles = `
      body {
        background: #000000;
        position: relative;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100vh;
        overflow: hidden;
      }
      #game_box {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      .text {
        position: absolute;
        font: 20px;
        color: #FFFFFF;
        text-align: center;
      }
      
      canvas {  
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-crisp-edges;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      }
    `;

    let style = document.querySelector('style');
    if (style == null) {
      style = document.createElement('style');
      document.head.appendChild(style);
    }
    style.textContent = engineStyles + style.textContent; 
    
    document.addEventListener('keydown', (evt) => {      
      if (evt.ctrlKey && evt.key === 'd') {
        this.debug = !this.debug;
        localStorage.setItem('gameDebug', this.debug);
        evt.preventDefault();
      }
    });
  }

  setupGfx(width, height, elementname = "game_box") {
    if (width === undefined || height === undefined) {
      this.gameWidth = window.innerWidth;
      this.gameHeight = window.innerHeight;
    } else {
      this.gameWidth = width;
      this.gameHeight = height;
    }
    
    const gameBox = document.getElementById(elementname);

    gameBox.style.width = `${this.gameWidth}px`;
    gameBox.style.height = `${this.gameHeight}px`;

    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      gameBox.appendChild(this.canvas);
      document.body.style.overflow = "hidden";
    }
    
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";

    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
  }

  resizeToFullscreen() {
    this.gameWidth = window.innerWidth;
    this.gameHeight = window.innerHeight;
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;
    this.ctx.imageSmoothingEnabled = false;

    if (this.bg) {
      this.bg.tileWidth = this.gameWidth;
      this.bg.tileHeight = this.gameHeight;
      this.bg.x = this.gameWidth / 2;
      this.bg.y = this.gameHeight / 2;
    }
  }

  render(ratio) {
    this.drawBg(ratio);   
    this.sprites.sort((a, b) => a.y - b.y);
    this.ctx.save();
    this.ctx.translate(Math.floor(this.loc.x), Math.floor(this.loc.y));
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].draw(this.ctx);
    }
    this.ctx.restore();
  }

  drawBg(ratio) {
    if (this.bg) {
      this.bg.draw(this.ctx);
    }
  }

  removeSprite(s) {
    const i = this.sprites.indexOf(s);
    if (i >= 0) this.sprites.splice(i, 1);
  }

  moveSpriteToTop(s) {
    this.removeSprite(s);
    this.sprites.push(s);
  }

  addTextBox(opts) {
    const lbl = document.createElement("label");
    lbl.className = "text" + (opts.class ? " " + opts.class : "");
    lbl.style.position = "absolute";
    lbl.style.width = opts.width + "px";
    lbl.style.textAlign = opts.align || "center";
    
    if (opts.font) {
      lbl.style.font = opts.font;
    }
    
    if (opts.posx < 0) {
      lbl.style.right = Math.abs(opts.posx) + "px";
      lbl.style.left = "auto";
    } else {
      lbl.style.left = opts.posx + "px";
      lbl.style.right = "auto";
    }
    lbl.style.top = opts.posy + "px";
    
    if (opts.text) lbl.innerHTML = opts.text;
    document.getElementById("game_box").appendChild(lbl);
    return lbl;
  }

  padNumZ(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

  update(ratio) {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].update(ratio);
    }
  }
}


class Controller {
  constructor() {
    this.gamepadId = null;
    this.index = 0;
    this.conOff = 0;
    this.jdz = 0.3;
    this.jdzi = 1 - this.jdz;
    this.joyPressThresh = 0.5;
    this.type = null;  // Will be set to 'gamepad' or 'keyboard' based on update method called

    this.defaultState = {
      ljH: 0, ljV: 0, ljAngd: 0, ljAng: 0, ljHp: 0, ljVp: 0, lastLjH: 0, lastLjV: 0,
      rjH: 0, rjV: 0, rjAngd: 0, rjAng: 0, rjHp: 0, rjVp: 0, lastRjH: 0, lastRjV: 0,
      iUp: false, iUpP: false, iDown: false, iDownP: false, iLeft: false, iLeftP: false, iRight: false, iRightP: false,
      dirks_used: false, ljoy_used: false,
      irUp: false, irDown: false, irLeft: false, irRight: false, rdirks_used: false, rjoy_used: false,
      iBtnA: false, iBtnAd: false, iBtnAr: false,
      iBtnB: false, iBtnBd: false, iBtnBr: false,
      iBtnX: false, iBtnXd: false, iBtnXr: false,
      iBtnY: false, iBtnYd: false, iBtnYr: false,
      iBtnSt: false, iBtnSl: false, iBtnSld: false,
      iBtnR: false, iBtnRd: false, iBtnRr: false,
      iBtnL: false, iBtnLd: false,
      iBtnAny: false, iBtnAnyDir: false, iBtnAnyDirP: false,
      shiftd: false,
      keys: {}, lastKeys: {}, lastButtons: {}
    };

    Object.assign(this, this.defaultState);
  }

  kill_jl() {
    this.iBtnAnyDir = false;
    this.iBtnAnyDirP = false;
    this.ljH = this.ljV = this.ljHp = this.ljVp = 0;
    this.iUp = this.iUpP = this.iDown = this.iDownP = false;
    this.iLeft = this.iLeftP = this.iRight = this.iRightP = false;
  }

  updateFromGamepad(gp) {
    this.type = 'gamepad';

    this.index = gp.index;
    this.gamepadId = gp.id;

    // Left joystick
    this.ljH = gp.axes[0];
    this.ljV = gp.axes[1];
    this.ljH = Math.abs(this.ljH) < this.jdz ? 0 : (Math.sign(this.ljH) * (Math.abs(this.ljH) - this.jdz) / this.jdzi);
    this.ljV = Math.abs(this.ljV) < this.jdz ? 0 : (Math.sign(this.ljV) * (Math.abs(this.ljV) - this.jdz) / this.jdzi);
    this.ljoy_used = Math.abs(this.ljH) > 0 || Math.abs(this.ljV) > 0;

    // Right joystick
    this.rjH = gp.axes[2];
    this.rjV = gp.axes[3];
    this.rjH = Math.abs(this.rjH) < this.jdz ? 0 : (Math.sign(this.rjH) * (Math.abs(this.rjH) - this.jdz) / this.jdzi);
    this.rjV = Math.abs(this.rjV) < this.jdz ? 0 : (Math.sign(this.rjV) * (Math.abs(this.rjV) - this.jdz) / this.jdzi);
    this.rjoy_used = Math.abs(this.rjH) > 0.1 || Math.abs(this.rjV) > 0.1;

    // Directional inputs from joystick
    this.iUp = this.ljV < -this.joyPressThresh;
    this.iUpP = this.ljV < -this.joyPressThresh && this.lastLjV >= -this.joyPressThresh;
    this.iDown = this.ljV > this.joyPressThresh;
    this.iDownP = this.ljV > this.joyPressThresh && this.lastLjV <= this.joyPressThresh;
    this.iLeft = this.ljH < -this.joyPressThresh;
    this.iLeftP = this.ljH < -this.joyPressThresh && this.lastLjH >= -this.joyPressThresh;
    this.iRight = this.ljH > this.joyPressThresh;
    this.iRightP = this.ljH > this.joyPressThresh && this.lastLjH <= this.joyPressThresh;

    this.irUp = this.rjV < -this.joyPressThresh;
    this.irDown = this.rjV > this.joyPressThresh;
    this.irLeft = this.rjH < -this.joyPressThresh;
    this.irRight = this.rjH > this.joyPressThresh;

    // Buttons
    this.updateButton(gp, "iBtnA", "iBtnAd", "iBtnAr", 0);
    this.updateButton(gp, "iBtnB", "iBtnBd", "iBtnBr", 1);
    this.updateButton(gp, "iBtnX", "iBtnXd", "iBtnXr", 2);
    this.updateButton(gp, "iBtnY", "iBtnYd", "iBtnYr", 3);
    this.updateButton(gp, "iBtnSt", null, null, 9);
    this.updateButton(gp, "iBtnSl", "iBtnSld", null, 8);
    this.updateButton(gp, "iBtnR", "iBtnRd", "iBtnRr", 5);
    this.updateButton(gp, "iBtnL", "iBtnLd", null, 4);
    this.shiftd = gp.buttons[6].pressed;

    this.updateCommonState();
    this.processJoystick();
  }
  
  updateButton(input, pressKey, downKey, releaseKey, buttonIndex ) { 
    const btn = input.buttons[buttonIndex];
    const lastBtn = this.lastButtons[buttonIndex] || false;
    this[pressKey] = btn.pressed && !lastBtn;
    if (downKey) this[downKey] = btn.pressed;
    if (releaseKey) this[releaseKey] = !btn.pressed && lastBtn;
    this.lastButtons[buttonIndex] = btn.pressed;    
  }
  
  updateFromKeyboard(kbState) {
    this.type = 'keyboard';

    // Directional inputs from keys
    this.iUp = kbState.getKeyState("ArrowUp") === "down";
    this.iUpP = kbState.getKeyState("ArrowUp") === "press";
    this.iDown = kbState.getKeyState("ArrowDown") === "down";
    this.iDownP = kbState.getKeyState("ArrowDown") === "press";
    this.iLeft = kbState.getKeyState("ArrowLeft") === "down";
    this.iLeftP = kbState.getKeyState("ArrowLeft") === "press";
    this.iRight = kbState.getKeyState("ArrowRight") === "down";
    this.iRightP = kbState.getKeyState("ArrowRight") === "press";
    this.dirks_used = kbState.getKeyState("ArrowUp") !== "off" || 
                     kbState.getKeyState("ArrowDown") !== "off" || 
                     kbState.getKeyState("ArrowLeft") !== "off" || 
                     kbState.getKeyState("ArrowRight") !== "off";

    this.irUp = kbState.getKeyState("Numpad8") === "down";
    this.irDown = kbState.getKeyState("Numpad2") === "down";
    this.irLeft = kbState.getKeyState("Numpad4") === "down";
    this.irRight = kbState.getKeyState("Numpad6") === "down";
    this.rdirks_used = kbState.getKeyState("Numpad8") !== "off" || 
                       kbState.getKeyState("Numpad2") !== "off" || 
                       kbState.getKeyState("Numpad4") !== "off" || 
                       kbState.getKeyState("Numpad6") !== "off";

    // Simulate joystick from keyboard
    this.ljH = (kbState.getKeyState("ArrowRight") === "down" ? 1 : 0) - 
               (kbState.getKeyState("ArrowLeft") === "down" ? 1 : 0);
    this.ljV = (kbState.getKeyState("ArrowDown") === "down" ? 1 : 0) - 
               (kbState.getKeyState("ArrowUp") === "down" ? 1 : 0);
    this.ljoy_used = Math.abs(this.ljH) > 0 || Math.abs(this.ljV) > 0;

    this.rjH = (kbState.getKeyState("Numpad6") === "down" ? 1 : 0) - 
               (kbState.getKeyState("Numpad4") === "down" ? 1 : 0);
    this.rjV = (kbState.getKeyState("Numpad2") === "down" ? 1 : 0) - 
               (kbState.getKeyState("Numpad8") === "down" ? 1 : 0);
    this.rjoy_used = Math.abs(this.rjH) > 0 || Math.abs(this.rjV) > 0;

    // Button inputs from keys
    this.updateButtonKb( "iBtnA", "iBtnAd", "iBtnAr", "x", kbState);
    this.updateButtonKb( "iBtnB", "iBtnBd", "iBtnBr", "c", kbState);
    this.updateButtonKb( "iBtnX", "iBtnXd", "iBtnXr", "z", kbState);
    this.updateButtonKb( "iBtnY", "iBtnYd", "iBtnYr", "s", kbState);
    this.updateButtonKb( "iBtnSt", null, null, "v", kbState);
    this.updateButtonKb( "iBtnSl", "iBtnSld", null, "f", kbState);
    this.updateButtonKb( "iBtnR", "iBtnRd", "iBtnRr", "d", kbState);
    this.updateButtonKb( "iBtnL", "iBtnLd", null, "a", kbState);
    this.shiftd = kbState.getKeyState("Shift") === "down";

    this.updateCommonState();
    this.processJoystick();
  }

  updateButtonKb( pressKey, downKey, releaseKey, key, kbState ) {  
      const state = kbState.getKeyState(key.toLowerCase());
      this[pressKey] = state === "press";
      if (downKey) this[downKey] = state === "down";
      if (releaseKey) this[releaseKey] = state === "release";  
  }

  updateCommonState() {
    this.iBtnAny = this.iBtnA || this.iBtnB || this.iBtnX || this.iBtnY || this.iBtnSt || this.iBtnSl;
    this.iBtnAnyDirP = this.iUpP || this.iDownP || this.iLeftP || this.iRightP;
    this.iBtnAnyDir = this.iUp || this.iDown || this.iLeft || this.iRight;

    this.lastLjH = this.ljH;
    this.lastLjV = this.ljV;
    this.lastRjH = this.rjH;
    this.lastRjV = this.rjV;
  }

  pointDirection(x1, y1, x2, y2) {
    const rad = Math.atan2(y2 - y1, x2 - x1);
    let deg = rad * 180 / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  }

  processJoystick() {
    if (this.type === 'keyboard' && this.dirks_used) {
      const dirH = this.iRight - this.iLeft;
      const dirV = this.iDown - this.iUp;
      this.ljAngd = this.pointDirection(0, 0, dirH, dirV);
      this.ljAng = this.ljAngd * Math.PI / 180;
      this.ljHp = this.iRight ? Math.min(1, Math.abs(Math.cos(this.ljAng))) : Math.max(-1, -Math.abs(Math.cos(this.ljAng)));
      this.ljVp = this.iDown ? Math.min(1, Math.abs(Math.sin(this.ljAng))) : Math.max(-1, -Math.abs(Math.sin(this.ljAng)));
    } else if (this.type === 'gamepad' && this.ljoy_used) {
      this.ljAngd = this.pointDirection(0, 0, this.ljH, this.ljV);
      this.ljAng = this.ljAngd * Math.PI / 180;
      this.ljHp = this.ljH >= 0 ? Math.min(this.ljH, Math.abs(Math.cos(this.ljAng))) : Math.max(this.ljH, -Math.abs(Math.cos(this.ljAng)));
      this.ljVp = this.ljV >= 0 ? Math.min(this.ljV, Math.abs(Math.sin(this.ljAng))) : Math.max(this.ljV, -Math.abs(Math.sin(this.ljAng)));
    } else {
      this.ljHp = 0;
      this.ljVp = 0;
    }

    if (this.type === 'keyboard' && this.rdirks_used) {
      const dirH = this.irRight - this.irLeft;
      const dirV = this.irDown - this.irUp;
      this.rjAngd = this.pointDirection(0, 0, dirH, dirV);
      this.rjAng = this.rjAngd * Math.PI / 180;
      this.rjHp = this.irRight ? Math.min(1, Math.abs(Math.cos(this.rjAng))) : Math.max(-1, -Math.abs(Math.cos(this.rjAng)));
      this.rjVp = this.irDown ? Math.min(1, Math.abs(Math.sin(this.rjAng))) : Math.max(-1, -Math.abs(Math.sin(this.rjAng)));
    } else if (this.type === 'gamepad' && this.rjoy_used) {
      this.rjAngd = this.pointDirection(0, 0, this.rjH, this.rjV);
      this.rjAng = this.rjAngd * Math.PI / 180;
      this.rjHp = this.rjH >= 0 ? Math.min(this.rjH, Math.abs(Math.cos(this.rjAng))) : Math.max(this.rjH, -Math.abs(Math.cos(this.rjAng)));
      this.rjVp = this.rjV >= 0 ? Math.min(this.rjV, Math.abs(Math.sin(this.rjAng))) : Math.max(this.rjV, -Math.abs(Math.sin(this.rjAng)));
    } else {
      this.rjHp = 0;
      this.rjVp = 0;
    }
  }
}


class KeyboardState {
  constructor() {
    this.keyState = {};

    // Update keyStates - only set once
    document.addEventListener("keydown", (e) => {
      if( this.keyState[e.key] === undefined ){
        this.keyState[e.key] = "press";
      }
    });

    document.addEventListener("keyup", (e) => {
      if( this.keyState[e.key] === "down" ){
        this.keyState[e.key] = "release";
      }
    });
  }
  
  //clear after single update frame
  postUpdate(){
    for (const key in this.keyState) {
      if (this.keyState[key] === "press") {
        this.keyState[key] = "down";
      } else
      if (this.keyState[key] === "release") {
        delete this.keyState[key];
      }
    }
  }

  getKeyState(key) {
    return this.keyState[key] || "off";
  }
  
  isPress(key) {
    return this.keyState[key]=="press";
  }
  isDown(key) {
    return this.keyState[key]=="down" || this.keyState[key]=="press";
  }
  isRelease(key) {
    return this.keyState[key]=="release";
  }
}

class Controllers {
  constructor() {
    this.connectedControllers = new Map();
    this.keyboardController = new Controller(); 
    this.keyboardState = new KeyboardState();
  }

  update() {
    const gamepads = navigator.getGamepads();
    
    //key debug
    // console.log(Object.entries(this.keyboardState.keyState).map(([key, state]) => `${key}: ${state}`).join(", "));

    // Update gamepad controllers
    for (const gp of gamepads) {
      if (gp && gp.connected) {
        const gpId = gp.id;
        if (!this.connectedControllers.has(gpId)) {
          const controller = new Controller();
          this.connectedControllers.set(gpId, controller);
        }
        this.connectedControllers.get(gpId).updateFromGamepad(gp);
      }
    }

    // Remove disconnected gamepads
    for (const [id] of this.connectedControllers) {
      let stillConnected = false;
      for (const gp of gamepads) {
        if (gp && gp.id === id) {
          stillConnected = true;
          break;
        }
      }
      if (!stillConnected) {
        console.log(`Controller disconnected: ${id}`);
        this.connectedControllers.delete(id);
      }
    }
   
    // Update the keyboard controller
    this.keyboardController.updateFromKeyboard(this.keyboardState);
  }

  getController(index=0) {
    const gamepadControllers = Array.from(this.connectedControllers.values());      
    
    if( index < 0 || index >= gamepadControllers.length) return this.keyboardController;    
    
    gamepadControllers.sort((a, b) => a.index - b.index);
    return gamepadControllers[index];
  }

  getKeyboardController() {
    return this.keyboardController;
  }

  getKeyboard() {
    return this.keyboardState;
  }
}


class Game {
  constructor() {
    this.target_fps = 60;
    this.min_ratio = 0.5;
    this.max_ratio = 1.5;
    
    this.now = Date.now();
    this.then = Date.now();
    
    this.timeScale = 1.0;
    this.realTime = 0;
    this.gameTime = 0;
    
    this.tickCallback = ()=>{}; // Always runs
    this.stepCallback = ()=>{}; // Runs only when game is running
    
    this.gameState = 'paused';

    this.graphics = new Graphics();    
    this.sound = new Sound();

    this.imageLoader = new ImageLoader();
    this.controllers = new Controllers();
    
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey) {
        if (event.key === '<' || event.key === ',') {
          this.timeScale *= .75;
          event.preventDefault();          
        } else if (event.key === '>' || event.key === '.') {
          this.timeScale /= .75;
          event.preventDefault();          
        }
      }
    });
    
    this.mainLoop = this.mainLoop.bind(this);
    this.mainLoop();
  }
    
  mainLoop(){  
    this.now = Date.now();
    const delta = this.now - this.then;
    this.then = this.now;

    this.realTime += delta;
    let gameDelta = 0;
    
    if (this.gameState === 'running') { 
      gameDelta = delta * this.timeScale;
      this.gameTime += gameDelta;
    }	

    const ratio = clamp( gameDelta / (1000 / this.target_fps), this.min_ratio, this.max_ratio );
    
    this.controllers.update();
    this.tickCallback(ratio);
    
    if (this.gameState === 'running') {      
      this.stepCallback(ratio);
      this.graphics.update(ratio);      
    }
    
    this.controllers.keyboardState.postUpdate();
    
    this.graphics.render(ratio);

    requestAnimationFrame(this.mainLoop);
  }

  setGameState(state) {
    if (state === 'paused' || state === 'running') {
      this.gameState = state;
    }
  }

  setTickCallback(callback) {
    this.tickCallback = callback;
  }

  setStepCallback(callback) {
    this.stepCallback = callback;
  }
}

const game = new Game();

function text_hide(element) {
  if (element.style.display !== "none") {
    element.originalDisplay = element.style.display || getComputedStyle(element).display;
    element.style.display = "none";
  }
}

function text_show(element) {
  if (element.style.display === "none") {
    element.style.display = element.originalDisplay || "block";
  }
}

function getLocalStorage(key, defaultValue, parseFunc = v => v) {
  const value = localStorage.getItem(key);
  return value != null ? parseFunc(value) : defaultValue;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function urlParam(name) {
  const url = window.location.href;
  const regex = new RegExp('[?&]' + name + '=([^&#]*)');
  const results = regex.exec(url);
  return results ? decodeURIComponent(results[1] || '') : null;
}