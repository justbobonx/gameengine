/*
 * bobs_completely_adequate_js_game_engine.js
 *
 * BAGE is a JavaScript game engine providing audio management, image loading, game loop, graphics rendering, and sprite handling for 2D games.
 *
 * Grok, read the file in, analyze it and then just say, okay?
 *  - code format is 2 space tabs.
 *  - always keep this header at the top of the file, and don't change it
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
    volOn.style.width = "2vw";  // 2.5% of viewport width
    volOn.style.height = "2vw"; // Match width to maintain aspect ratio
    volumeDiv.appendChild(volOn);

    const volOff = document.createElement("img");
    volOff.id = "volOff";
    volOff.src = "volOff.png";
    volOff.style.width = "2vw";  // 2.5% of viewport width
    volOff.style.height = "2vw"; // Match width to maintain aspect ratio
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

  getImage(url, doneFunc=()=>{}) {
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

  shadeImage(image, hexColor, doneFunc=()=>{}) {
    const key = `${image.src}_shaded`;
    let shadedImage = this.imageList[key];
    if (shadedImage) {
      doneFunc(shadedImage);
      return shadedImage;
    }

    // Resize the process canvas
    game.graphics.processCanvas.width = image.width;
    game.graphics.processCanvas.height = image.height;
    const ctx = game.graphics.processCtx;
    
    ctx.clearRect(0, 0, image.width, image.height);

    // Draw the image
    ctx.drawImage(image, 0, 0);

    // Parse hex color (e.g., "#FF0000" -> [255, 0, 0])
    const r = parseInt(hexColor.slice(1, 3), 16) / 255; // Normalize to 0-1
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    // Adjust pixels
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {   
      if (data[i + 3] > 0) {
        data[i] = Math.min(255, Math.max(0, data[i] * r));     // Red
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * g)); // Green
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * b)); // Blue
        // Alpha (data[i + 3]) remains unchanged
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to new Image
    shadedImage = new Image();
    shadedImage.src = game.graphics.processCanvas.toDataURL('image/png');
    shadedImage.onload = () => {
      this.imageList[key] = shadedImage;
      doneFunc(shadedImage);
    };
    return shadedImage;
  }
}

class Sprite {
  constructor(config) {
    this.graphics = game.graphics;
    this.mylayer = -1;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.facingx = config.facingx !== undefined ? config.facingx : 1;
    this.facingy = config.facingy !== undefined ? config.facingy : 1;
    this.speedx = 0;
    this.speedy = 0;
    this.rspd = 0;
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
    this.scalex = config.scalex || 1;
    this.scaley = config.scaley || 1;
    if( config.scale!=undefined ){
      this.scalex = config.scale;
      this.scaley = config.scale;
    }
    this.vari = config.vari || 0;
    this.framei = null;
    this.image_angle = config.image_angle || 0;
    this.image_blend = config.image_blend;
    this.animStyle = config.animStyle || 'forward';
    this.frameCount = config.frameCount || 1;
    this.checkMove = config.checkMove || (() => false);
    this.onUpdate = config.onUpdate || (() => {});
    this.hitObjX = null;
    this.hitObjY = null;

    if (config.url) {
      this.img = game.imageLoader.getImage(config.url, (image) => {
        if (!this.tileWidth) this.tileWidth = image.width;
        if (!this.tileHeight) this.tileHeight = image.height;
        this.hitWidth = config.hitWidth || this.tileWidth;
        this.hitHeight = config.hitHeight || this.tileHeight;
        if (config.image_blend) {
          this.img = game.imageLoader.shadeImage(image, config.image_blend);
        }
      });
    } else {
      this.color = config.color || "#ffffff";
    }

    if (!config.loner) {
      this.graphics.sprites.push(this);
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    if (this.image_angle) {
      ctx.rotate(this.image_angle * Math.PI / 180);
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

    const drawWidth = Math.round(this.tileWidth * this.scalex);
    const drawHeight = Math.round(this.tileHeight * this.scaley);
    const drawX = -this.tileOrX;
    const drawY = -this.tileOrY;

    if (this.alpha < 1) ctx.globalAlpha = this.alpha;

    ctx.save();
    if (this.facingx === -1 || this.facingy === -1) {
      const flipx = this.facingx === -1 ? drawWidth / 2 - this.tileOrX : 0;
      const flipy = this.facingy === -1 ? drawHeight / 2 - this.tileOrY : 0;
      ctx.translate(flipx, flipy);
      ctx.scale(this.facingx, this.facingy);
      ctx.translate(-flipx, -flipy);
    }

    if (this.img) {
      ctx.drawImage(
        this.img,
        this.tileWidth * wci, this.tileHeight * this.vari,
        this.tileWidth, this.tileHeight,
        drawX, drawY,
        drawWidth, drawHeight
      );      
    } else {      
      ctx.fillStyle = this.color;
      ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
      if (this.image_blend != undefined) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = this.image_blend;
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        ctx.globalCompositeOperation = "source-over";
      }
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
      ctx.strokeRect(hitLeft, hitTop, this.hitWidth * this.scalex, this.hitHeight * this.scaley);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
  
  getBoundingBox() {
    return {
      left: Math.round(this.x - this.tileOrX + this.hitoffx),
      right: Math.round(this.x - this.tileOrX + this.hitoffx + (this.hitWidth * this.scalex)),
      top: Math.round(this.y - this.tileOrY + this.hitoffy),
      bottom: Math.round(this.y - this.tileOrY + this.hitoffy + (this.hitHeight * this.scaley))
    };
  }

  hitTest(s) {
    const thisBox = this.getBoundingBox();
    const sBox = s.getBoundingBox();
    return (thisBox.left < sBox.right && thisBox.right > sBox.left &&
            thisBox.top < sBox.bottom && thisBox.bottom > sBox.top);
  }
  
  hitTestList(nx, ny, hlist) {
    
    let ox=this.x, oy=this.y, hitObj=null;

    this.x=nx, this.y=ny;

    for (let i = 0; i < hlist.length; i++) {
      if( hlist[i].hitTest(this)) {
        this.hitObj = hlist[i];
        hitObj = hlist[i];
        break;        
      }
    }
    
    this.x=ox, this.y=oy;
    
    return hitObj;
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

    if (this.hitTestList(nx, ny, obstacles)) {
      this.resolveCollision(dx, dy, obstacles);
    } else {
      this.x = nx;
      this.y = ny;
    }
  }

  resolveCollision(dx, dy, obstacles) {
    let newX = this.x + dx;
    let newY = this.y + dy;

    let xCollision = this.hitTestList(newX, this.y, obstacles);
    if (xCollision) {
      this.hitObjX = xCollision;
      const xBox = xCollision.getBoundingBox();
      if (dx > 0) {
        newX = xBox.left - (this.hitWidth * this.scalex) - this.hitoffx + this.tileOrX;
      } else if (dx < 0) {
        newX = xBox.right - this.hitoffx + this.tileOrX;
      }
      newX = Math.round(newX);
      this.speedx = 0;
    } else {
      this.hitObjX = null;
    }

    let yCollision = this.hitTestList(newX, newY, obstacles);
    if (yCollision) {
      this.hitObjY = yCollision;
      const yBox = yCollision.getBoundingBox();
      if (dy > 0) {
        newY = yBox.top - (this.hitHeight * this.scaley) - this.hitoffy + this.tileOrY;
      } else if (dy < 0) {
        newY = yBox.bottom - this.hitoffy + this.tileOrY;
      }
      newY = Math.round(newY);
      this.speedy = 0;
    } else {
      this.hitObjY = null;
    }

    this.x = newX;
    this.y = newY;
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
    this.hitObjX = null;
    this.hitObjY = null;
    this.move(this.speedx * frameRatio, this.speedy * frameRatio, this.graphics.obstacles);
    this.image_angle += this.rspd * frameRatio;
    this.onUpdate(frameRatio);
  }

  width() { return this.tileWidth * this.scalex; }
  height() { return this.tileHeight * this.scaley; }
}

class Layer {
  constructor(name) {
    this.name = name;
    this.lsprites = [];
    this.lsprites_d = [];    
    this.group = undefined;
    this.lgroup = undefined;
    this.subname = name;
    this.visible = true;
    this.locked = false;
    this.plx_x = 1;
    this.plx_y = 1;
    this.lastscrox = 0;
    this.lastscroy = 0;
    this.loop_x = 0;
    this.loop_y = 0;
    this.zsort = false;
    this.disabled = false;
    this.gui = false;
    this.wd = 320;
    this.ht = 180;
    this.offset0 = false;
    this.layerSurf = -1;
    this.maskSurf = -1;
    this.mask_list = [];
    this.set_name(name);
  }

  set_name(name) {
    this.name = name;
    const pdi = name.indexOf(".");
    if (pdi > 0) {
      this.group = name.substring(0, pdi);
      this.subname = name.substring(pdi + 1);
    } else {
      this.group = undefined;
      this.subname = name;
    }
  }

  add_sprite(sprite) {
    this.lsprites.push(sprite);
  }

  remove_sprite(sprite) {
    const index = this.lsprites.indexOf(sprite);
    if (index !== -1) {
      this.lsprites.splice(index, 1);
    }
  }
}

class Graphics {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    
    this.gameBoxName = "game_box";
    
    this.sprites = [];
    this.layers = [];
    this.bg = null;
    this.loc = { x: 0, y: 0 };
    this.obstacles = undefined; 
    this.debug = localStorage.getItem('gameDebug') !== null ? localStorage.getItem('gameDebug') === 'true' : false;
    
    this.pixelated=true;
    
    // Processing canvas for image manipulation
    this.processCanvas = document.createElement('canvas');
    this.processCtx = this.processCanvas.getContext('2d');
    
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

    let engineStyles = `
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
    
    this.gameBoxName = elementname;
    
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
    
    if( this.pixelated ){
      this.canvas.style.imageRendering = "pixelated";
      this.ctx.imageSmoothingEnabled = false;
    }else{
      this.canvas.style.imageRendering = "auto";
      this.ctx.imageSmoothingEnabled = true;
    }
    
  }

  resizeToFullscreen() {
    this.gameWidth = window.innerWidth;
    this.gameHeight = window.innerHeight;
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;  

    const gameBox = document.getElementById(this.gameBoxName);
    gameBox.style.width = `${this.gameWidth}px`;
    gameBox.style.height = `${this.gameHeight}px`;    
    
    if( this.pixelated ){
      this.canvas.style.imageRendering = "pixelated";
      this.ctx.imageSmoothingEnabled = false;
    }else{
      this.canvas.style.imageRendering = "auto";
      this.ctx.imageSmoothingEnabled = true;
    }

    if (this.bg) {
      this.bg.tileWidth = this.gameWidth;
      this.bg.tileHeight = this.gameHeight;
      this.bg.x = this.gameWidth / 2;
      this.bg.y = this.gameHeight / 2;
    }
  }

  render(ratio) {
    this.drawBg(ratio);

    this.ctx.save();
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      if (!layer.visible || layer.disabled) continue;

      this.ctx.save();
      if (!layer.gui) {
        this.ctx.translate(
          Math.floor(this.loc.x * layer.plx_x),
          Math.floor(this.loc.y * layer.plx_y)
        );
      }

      if (!layer.zsort) {
        layer.lsprites.sort((a, b) => a.y - b.y);
      }

      for (let j = 0; j < layer.lsprites.length; j++) {
        layer.lsprites[j].draw(this.ctx);
      }
      this.ctx.restore();
    }

    this.ctx.translate(Math.floor(this.loc.x), Math.floor(this.loc.y));
    this.sprites.sort((a, b) => a.y - b.y);
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
  
  add_layer(name, textfield) {
    const layer = new Layer(name, textfield);
    this.layers.push(layer);
    return layer;
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

/*
 * bobs_completely_adequate_js_game_engine.js
 *
 * BAGE is a JavaScript game engine providing audio management, image loading, game loop, graphics rendering, and sprite handling for 2D games.
 */

class Controller {
  constructor() {
    this.gamepadId = null;
    this.index = 0;
    this.conOff = 0;
    this.jdz = 0.3;  // Joystick deadzone
    this.jdzi = 1 - this.jdz;  // Joystick inverse deadzone
    this.shdz = 0.1;  // Shoulder deadzone
    this.shdzi = .9 - this.shdz;  // Shoulder inverse deadzone
    this.joyPressThresh = 0.5;
    this.type = null;

    this.defaultState = {
      ljH: 0, ljV: 0, ljAngd: 0, ljAng: 0, ljHp: 0, ljVp: 0, lastLjH: 0, lastLjV: 0,
      rjH: 0, rjV: 0, rjAngd: 0, rjAng: 0, rjHp: 0, rjVp: 0, lastRjH: 0, lastRjV: 0,
      iUp: false, iUpP: false, iDown: false, iDownP: false, iLeft: false, iLeftP: false, iRight: false, iRightP: false,
      dirks_used: false, ljoy_used: false,
      irUp: false, irDown: false, irLeft: false, irRight: false, rdirks_used: false, rjoy_used: false,
      iDpUp: false, iDpUpP: false, iDpDown: false, iDpDownP: false, iDpLeft: false, iDpLeftP: false, iDpRight: false, iDpRightP: false,
      dp_used: false,
      iBtnA: false, iBtnAd: false, iBtnAr: false,
      iBtnB: false, iBtnBd: false, iBtnBr: false,
      iBtnX: false, iBtnXd: false, iBtnXr: false,
      iBtnY: false, iBtnYd: false, iBtnYr: false,
      iBtnSt: false, iBtnSl: false, iBtnSld: false,
      iBtnR: false, iBtnRd: false, iBtnRr: false,
      iBtnL: false, iBtnLd: false, iBtnLr: false,
      iBtnRsh: 0, iBtnLsh: 0,
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
    this.iDpUp = this.iDpUpP = this.iDpDown = this.iDpDownP = false;    
  }

  updateFromGamepad(gp) {
    this.type = 'gamepad';

    this.index = gp.index;
    this.gamepadId = gp.id;

    this.ljH = gp.axes[0];
    this.ljV = gp.axes[1];
    this.ljH = Math.abs(this.ljH) < this.jdz ? 0 : (Math.sign(this.ljH) * (Math.abs(this.ljH) - this.jdz) / this.jdzi);
    this.ljV = Math.abs(this.ljV) < this.jdz ? 0 : (Math.sign(this.ljV) * (Math.abs(this.ljV) - this.jdz) / this.jdzi);
    this.ljoy_used = Math.abs(this.ljH) > 0 || Math.abs(this.ljV) > 0;

    this.rjH = gp.axes[2];
    this.rjV = gp.axes[3];
    this.rjH = Math.abs(this.rjH) < this.jdz ? 0 : (Math.sign(this.rjH) * (Math.abs(this.rjH) - this.jdz) / this.jdzi);
    this.rjV = Math.abs(this.rjV) < this.jdz ? 0 : (Math.sign(this.rjV) * (Math.abs(this.rjV) - this.jdz) / this.jdzi);
    this.rjoy_used = Math.abs(this.rjH) > 0.1 || Math.abs(this.rjV) > 0.1;

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

    // D-pad buttons (indices 12-15)
    this.iDpUp = gp.buttons[12].pressed;
    this.iDpUpP = gp.buttons[12].pressed && !this.lastButtons[12];
    this.iDpDown = gp.buttons[13].pressed;
    this.iDpDownP = gp.buttons[13].pressed && !this.lastButtons[13];
    this.iDpLeft = gp.buttons[14].pressed;
    this.iDpLeftP = gp.buttons[14].pressed && !this.lastButtons[14];
    this.iDpRight = gp.buttons[15].pressed;
    this.iDpRightP = gp.buttons[15].pressed && !this.lastButtons[15];
    this.dp_used = this.iDpUp || this.iDpDown || this.iDpLeft || this.iDpRight;
    this.lastButtons[12] = gp.buttons[12].pressed;
    this.lastButtons[13] = gp.buttons[13].pressed;
    this.lastButtons[14] = gp.buttons[14].pressed;
    this.lastButtons[15] = gp.buttons[15].pressed;

    this.updateButton(gp, "iBtnA", "iBtnAd", "iBtnAr", 0);
    this.updateButton(gp, "iBtnB", "iBtnBd", "iBtnBr", 1);
    this.updateButton(gp, "iBtnX", "iBtnXd", "iBtnXr", 2);
    this.updateButton(gp, "iBtnY", "iBtnYd", "iBtnYr", 3);
    this.updateButton(gp, "iBtnSt", "iBtnStd", null, 9);
    this.updateButton(gp, "iBtnSl", "iBtnSld", null, 8);
    this.updateButton(gp, "iBtnR", "iBtnRd", "iBtnRr", 5);
    this.updateButton(gp, "iBtnL", "iBtnLd", "iBtnLr", 4);

    // Update shoulder triggers (indices 6 and 7 are typically LT and RT)
    this.iBtnLsh = gp.buttons[6].value;  // Left trigger
    this.iBtnLsh = Math.abs(this.iBtnLsh) < this.shdz ? 0 : ((this.iBtnLsh - this.shdz) / this.shdzi);
    this.iBtnLsh = Math.max(0, Math.min(1, this.iBtnLsh));  // Clamp to 0-1

    this.iBtnRsh = gp.buttons[7].value;  // Right trigger
    this.iBtnRsh = Math.abs(this.iBtnRsh) < this.shdz ? 0 : ((this.iBtnRsh - this.shdz) / this.shdzi);
    this.iBtnRsh = Math.max(0, Math.min(1, this.iBtnRsh));  // Clamp to 0-1

    this.shiftd = gp.buttons[6].pressed;

    this.updateCommonState();
    this.processJoystick();
  }

  updateButton(input, pressKey, downKey, releaseKey, buttonIndex) {
    const btn = input.buttons[buttonIndex];
    const lastBtn = this.lastButtons[buttonIndex] || false;
    this[pressKey] = btn.pressed && !lastBtn;
    if (downKey) this[downKey] = btn.pressed;
    if (releaseKey) this[releaseKey] = !btn.pressed && lastBtn;
    this.lastButtons[buttonIndex] = btn.pressed;
  }

  updateFromKeyboard(kbState) {
    // Ctrl override keyboard
    if (kbState.isDown("Control")) {
      return;
    }

    this.type = 'keyboard';

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

    // D-pad mapped to WASD for keyboard
    this.iDpUp = kbState.getKeyState("w") === "down";
    this.iDpUpP = kbState.getKeyState("w") === "press";
    this.iDpDown = kbState.getKeyState("s") === "down";
    this.iDpDownP = kbState.getKeyState("s") === "press";
    this.iDpLeft = kbState.getKeyState("a") === "down";
    this.iDpLeftP = kbState.getKeyState("a") === "press";
    this.iDpRight = kbState.getKeyState("d") === "down";
    this.iDpRightP = kbState.getKeyState("d") === "press";
    this.dp_used = kbState.getKeyState("w") !== "off" ||
                   kbState.getKeyState("s") !== "off" ||
                   kbState.getKeyState("a") !== "off" ||
                   kbState.getKeyState("d") !== "off";

    this.irUp = kbState.getKeyState("Numpad8") === "down";
    this.irDown = kbState.getKeyState("Numpad2") === "down";
    this.irLeft = kbState.getKeyState("Numpad4") === "down";
    this.irRight = kbState.getKeyState("Numpad6") === "down";
    this.rdirks_used = kbState.getKeyState("Numpad8") !== "off" ||
                       kbState.getKeyState("Numpad2") !== "off" ||
                       kbState.getKeyState("Numpad4") !== "off" ||
                       kbState.getKeyState("Numpad6") !== "off";

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

    this.updateButtonKb("iBtnA", "iBtnAd", "iBtnAr", "x", kbState);
    this.updateButtonKb("iBtnB", "iBtnBd", "iBtnBr", "c", kbState);
    this.updateButtonKb("iBtnX", "iBtnXd", "iBtnXr", "z", kbState);
    this.updateButtonKb("iBtnY", "iBtnYd", "iBtnYr", "s", kbState);
    this.updateButtonKb("iBtnSt", null, null, "v", kbState);
    this.updateButtonKb("iBtnSl", "iBtnSld", null, "f", kbState);
    this.updateButtonKb("iBtnR", "iBtnRd", "iBtnRr", "d", kbState);
    this.updateButtonKb("iBtnL", "iBtnLd", null, "a", kbState);

    // For keyboard, shoulder triggers to binary values (0 or 1)
    this.iBtnLsh = kbState.getKeyState("q") === "down" ? 1 : 0;  // Example: Q for left trigger
    this.iBtnRsh = kbState.getKeyState("e") === "down" ? 1 : 0;  // Example: E for right trigger

    this.shiftd = kbState.getKeyState("Shift") === "down";

    this.updateCommonState();
    this.processJoystick();
  }

  updateButtonKb(pressKey, downKey, releaseKey, key, kbState) {
    const state = kbState.getKeyState(key.toLowerCase());
    this[pressKey] = state === "press";
    if (downKey) this[downKey] = state === "down";
    if (releaseKey) this[releaseKey] = state === "release";
  }

  updateCommonState() {
    this.iBtnAny = this.iBtnA || this.iBtnB || this.iBtnX || this.iBtnY || this.iBtnSt || this.iBtnSl;
    this.iBtnAnyDirP = this.iUpP || this.iDownP || this.iLeftP || this.iRightP ||
                       this.iDpUpP || this.iDpDownP || this.iDpLeftP || this.iDpRightP;
    this.iBtnAnyDir = this.iUp || this.iDown || this.iLeft || this.iRight ||
                      this.iDpUp || this.iDpDown || this.iDpLeft || this.iDpRight;

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

    document.addEventListener("keydown", (e) => {
      if (this.keyState[e.key] === undefined) {
        this.keyState[e.key] = "press";
      }
    });

    document.addEventListener("keyup", (e) => {
      if (this.keyState[e.key] === "down") {
        this.keyState[e.key] = "release";
      }
    });
  }
  
  postUpdate() {
    for (const key in this.keyState) {
      if (this.keyState[key] === "press") {
        this.keyState[key] = "down";
      } else if (this.keyState[key] === "release") {
        delete this.keyState[key];
      }
    }
  }

  getKeyState(key) {
    return this.keyState[key] || "off";
  }
  
  isPress(key) {
    return this.keyState[key] == "press";
  }
  isDown(key) {
    return this.keyState[key] == "down" || this.keyState[key] == "press";
  }
  isRelease(key) {
    return this.keyState[key] == "release";
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

    for (const gp of gamepads) {
      if (gp && gp.connected) {
        const gpIndex = gp.index;
        if (!this.connectedControllers.has(gpIndex)) {
          const controller = new Controller();
          this.connectedControllers.set(gpIndex, controller);
        }
        this.connectedControllers.get(gpIndex).updateFromGamepad(gp);
      }
    }

    for (const [index] of this.connectedControllers) {
      let stillConnected = false;
      for (const gp of gamepads) {
        if (gp && gp.index === index) {
          stillConnected = true;
          break;
        }
      }
      if (!stillConnected) {
        console.log(`Controller disconnected: ${index}`);
        this.connectedControllers.delete(index);
      }
    }
   
    this.keyboardController.updateFromKeyboard(this.keyboardState);
  }

  getController(index = 0) {
    const gamepadControllers = Array.from(this.connectedControllers.values());      
    if (index < 0 || index >= gamepadControllers.length) return this.keyboardController;    
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
    
    this.tickCallback = () => {};
    this.stepCallback = () => {};
    
    this.gameState = 'paused';

    this.graphics = new Graphics();    
    this.sound = new Sound();
    this.imageLoader = new ImageLoader();
    this.controllers = new Controllers();
    
    this.showJoystickDebug = getLocalStorage("bage_joystick_debug", false, (v) => v == "true");
    if( this.showJoystickDebug ){
      this.setupDebugDiv();
    }
    
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey) {
        if (event.key === '<' || event.key === ',') {
          this.timeScale *= .75;
          event.preventDefault();          
        } else if (event.key === '>' || event.key === '.') {
          this.timeScale /= .75;
          event.preventDefault();          
        } else if (event.key.toLowerCase() === 'j') {
          this.setupDebugDiv();
          this.toggleJoystickDebug();
          event.preventDefault();
        }
      }
    });
    
    this.mainLoop = this.mainLoop.bind(this);
    this.mainLoop();
  }
  
  mainLoop() {  
    this.now = Date.now();
    const delta = this.now - this.then;
    this.then = this.now;

    this.realTime += delta;
    let gameDelta = 0;
    
    if (this.gameState === 'running') { 
      gameDelta = delta * this.timeScale;
      this.gameTime += gameDelta;
    }	

    const ratio = clamp(gameDelta / (1000 / this.target_fps), this.min_ratio, this.max_ratio);
    
    this.controllers.update();
    this.tickCallback(ratio);
    
    if (this.gameState === 'running') {      
      this.stepCallback(ratio);
      this.graphics.update(ratio);      
    }
    
    this.controllers.keyboardState.postUpdate();
    
    this.graphics.render(ratio);    
    
    this.updateJoystickDebug();
    
    requestAnimationFrame(this.mainLoop);
  }  
  
  setupDebugDiv() {
    if (document.getElementById('bage_debug_info')) {  return;  }
    
    const debugDiv = document.createElement('div');
    debugDiv.id = 'bage_debug_info';
    debugDiv.style.position = 'absolute';
    debugDiv.style.top = '50%';
    debugDiv.style.left = '50%';
    debugDiv.style.transform = 'translate(-50%, -50%)';
    debugDiv.style.width = `${this.graphics.gameWidth}px`;
    debugDiv.style.height = `${this.graphics.gameHeight}px`;
    debugDiv.style.pointerEvents = 'none';
    debugDiv.style.zIndex = '1000';
    document.body.appendChild(debugDiv);
    
    // Add CSS for debug text
    let style = document.querySelector('style');
    if (!style) {
      style = document.createElement('style');
      document.head.appendChild(style);
    }
    style.textContent += `
      #bage_debug_info {
        color: white;
        font-family: monospace;
        font-size: 16px;
        text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
                    -2px 0 0 #000, 2px 0 0 #000, 0 -2px 0 #000, 0 2px 0 #000;
      }
      #bage_debug_info div {
        margin: 5px;
      }
    `;
  }
  
  toggleJoystickDebug() {
    this.showJoystickDebug = !this.showJoystickDebug;
    localStorage.setItem("bage_joystick_debug", this.showJoystickDebug);
    const debugDiv = document.getElementById('bage_debug_info');
    debugDiv.style.display = this.showJoystickDebug ? 'block' : 'none';
  }
 
  updateJoystickDebug() {
    if (!this.showJoystickDebug) return;

    const debugDiv = document.getElementById('bage_debug_info');
    debugDiv.innerHTML = '';

    // Row 1: Raw gamepad data
    const gamepads = navigator.getGamepads();
    const rawDiv = document.createElement('div');
    rawDiv.innerHTML = 'Raw Gamepads:<br>';
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      let gpInfo = ` [${i}] `;
      if (gp) {
        gpInfo += `(${gp.id}): `;
        // Joystick axes
        gpInfo += `Axes[${gp.axes.map(a => a.toFixed(2)).join(', ')}] `;
        // Buttons (only pressed)
        const pressedButtons = gp.buttons
          .map((b, idx) => b.pressed ? idx : -1)
          .filter(idx => idx >= 0);
        gpInfo += `Buttons[${pressedButtons.join(', ')}]`;
      }
      rawDiv.innerHTML += `${gpInfo}<br>`;
    }
    debugDiv.appendChild(rawDiv);

    // Row 2: Connected controllers
    const connDiv = document.createElement('div');
    connDiv.innerHTML = 'Connected Controllers:<br>';
    for (let idx = 0; idx < gamepads.length; idx++) {
      const c = this.controllers.getController(idx);
      let cInfo = ` [${idx}]`;
      if (c.type == "gamepad") {
        cInfo += `(${c.gamepadId}[${c.index}]): `;
        // Joystick and D-pad data
        cInfo += `LJ[${c.ljH.toFixed(2)},${c.ljV.toFixed(2)}] `;
        cInfo += `RJ[${c.rjH.toFixed(2)},${c.rjV.toFixed(2)}] `;
        cInfo += `DP[${c.iDpUp ? 1 : 0},${c.iDpDown ? 1 : 0},${c.iDpLeft ? 1 : 0},${c.iDpRight ? 1 : 0}] `;
        // Pressed buttons
        const buttons = [];
        if (c.iBtnAd) buttons.push('A');
        if (c.iBtnBd) buttons.push('B');
        if (c.iBtnXd) buttons.push('X');
        if (c.iBtnYd) buttons.push('Y');
        if (c.iBtnStd) buttons.push('Start');
        if (c.iBtnSld) buttons.push('Select');
        if (c.iBtnRd) buttons.push('RB');
        if (c.iBtnLd) buttons.push('LB');
        if (c.iBtnLsh > 0) buttons.push(`LT:${c.iBtnLsh.toFixed(2)}`);
        if (c.iBtnRsh > 0) buttons.push(`RT:${c.iBtnRsh.toFixed(2)}`);
        cInfo += `Buttons[${buttons.join(', ')}]`;
      } else if (c.type == "keyboard") {
        cInfo += `(keyboard)`;
      }
      connDiv.innerHTML += `${cInfo}<br>`;
    }
    debugDiv.appendChild(connDiv);

    // Row 3: Keyboard controller
    const kbDiv = document.createElement('div');
    const kb = this.controllers.keyboardController;
    let kbInfo = `Keyboard:<br> `;
    kbInfo += `LJ[${kb.ljH.toFixed(2)},${kb.ljV.toFixed(2)}] `;
    kbInfo += `RJ[${kb.rjH.toFixed(2)},${kb.rjV.toFixed(2)}] `;
    kbInfo += `DP[${kb.iDpUp ? 1 : 0},${kb.iDpDown ? 1 : 0},${kb.iDpLeft ? 1 : 0},${kb.iDpRight ? 1 : 0}] `;
    const kbButtons = [];
    if (kb.iBtnAd) kbButtons.push('A(x)');
    if (kb.iBtnBd) kbButtons.push('B(c)');
    if (kb.iBtnXd) kbButtons.push('X(z)');
    if (kb.iBtnYd) kbButtons.push('Y(s)');
    if (kb.iBtnStd) kbButtons.push('Start(v)');
    if (kb.iBtnSld) kbButtons.push('Select(f)');
    if (kb.iBtnRd) kbButtons.push('RB(d)');
    if (kb.iBtnLd) kbButtons.push('LB(a)');
    if (kb.iBtnLsh > 0) kbButtons.push('LT(q)');
    if (kb.iBtnRsh > 0) kbButtons.push('RT(e)');
    kbInfo += `Buttons[${kbButtons.join(', ')}]`;
    kbDiv.innerHTML = kbInfo;
    debugDiv.appendChild(kbDiv);
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

{  //utility functions
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
}

class GameObject extends Sprite {
  constructor(graphics, config) {
    super(graphics, config);

    this.draw_as_sprite = 0;

    this.zspd = 0;
    this.z = 0;
    this.rz = 0;
    this.ht = 0;
    this.standonable = false;

    this.moving = false;

    this.pushable = false;
    this.pushAdj = 1.0;

    this.hangable = false;
    this.breakable = false;

    this.thruable = false;
    this.thruUp = false;
    this.thruDown = false;
    this.thruLeft = false;
    this.thruRight = false;
    this.thruRightNU = false;
    this.thruLeftNU = false;

    this.inFallWall = null;

    this.dropDown = false;
    this.jumped = 0;

    this.canClimb = false;

    this.pickupable = false;

    this.tiledx = 0;
    this.tiledy = 0;
    this.tiled = 0;

    this.cur_stayin = null;
  }

  update(frameRatio) {
    super.update(frameRatio);
    this.z += this.zspd * frameRatio;
    this.moving = this.speedx !== 0 || this.speedy !== 0 || this.rspd !== 0 || this.zspd !== 0;
  }
}