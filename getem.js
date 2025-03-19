
var sprites=[];

var koopas=[];
var fireballs=[];
var goodies=[];

var obstacles=[];

var message;
var scoreLbl;
var score;

var levelLbl;
var level;

var loc = {x:0,y:0};

var vieww = 1200;
var viewh = 900;

var areaGrid = [];
var grid = {x:undefined,y:undefined};

updateCurGrid = function()
{
	return;
	
	var ngx = Math.floor(mario.x / canvas.width);
	var ngy = Math.floor(mario.y / canvas.height);	
	
	if(ngx != grid.x || ngy != grid.y)
	{
		grid.x=ngx;
		grid.y=ngy;
		
		levelLbl.text(grid.x+","+grid.y);
		
		for( var gx=grid.x-1;gx<=grid.x+1;gx++){
			for( var gy=grid.y-1;gy<=grid.y+1;gy++){
				fillGrid(gx,gy);
			}
		}
	}
}

function fillGrid(gx,gy)
{	
	var gti = gx+','+gy;
	var gridTile = areaGrid[gti];
	
	if( gridTile != undefined ){
		return;
	}
	
	var offset = {
		x: gx*canvas.width,
		y: gy*canvas.height
	};
	
	var waters = [];
	var lw;
	for( var i=0; i<60; i++ )
	{		
		var water = new Sprite({
			url:"water-1.png",
			tileOrX:0,
			tileOrY:0,
			tileWidth:16,
			tileHeight:16,
			frameCount:3,
			animate:true,
			aniSpeed:800,
			visible:true
		});
		
		if( i==0 || Math.random()<.01){
			putSpriteRandomPos(water,offset);
			water.flow = Math.floor(Math.random()*4);
			waters.push(water);
		}else{
			var lw = waters[Math.floor(Math.random()*waters.length)];
			if( flow( water, lw, waters ) ){
				waters.push(water);
			}else{
				i--;
			}
		}
	}
		
	
	for( var i=0; i<80; i++ ){
		var grass = new Sprite({
			url:"grass-sum-1.png",
			tileOrX:0,
			tileOrY:0,
			tileWidth:9,
			tileHeight:7,
			hitTestWidth:9,
			hitTestHeight:7,
			frameCount:4,
			animate:true,
			aniSpeed:600,
			visible:true
		});
		
		putSpriteRandomPos(grass,offset);
		
		if( ! grass.hitTestList(grass.x,grass.y,waters) )
		{
		}else{
			removeSprite(grass);
		}
		
	}
	
	var trees = [];
	for( var i=0; i<80; i++ ){
		var tree = new Sprite({
			url:"tree-sum-1.png",
			tileOrX:0,
			tileOrY:0,
			tileWidth:10,
			tileHeight:16,
			visible:true
		});
		
		putSpriteRandomPos(tree,offset);
		
		if( ! tree.hitTestList(tree.x,tree.y,waters) && 
			! tree.hitTestList(tree.x,tree.y,trees) )
		{
			trees.push(tree);
		}else{
			removeSprite(tree);
			i--;
		}
		
	}
	
	for( var i=0; i<trees.length; i++ ){
		obstacles.push(trees[i]);
	}
	for( var i=0; i<waters.length; i++ ){
		obstacles.push(waters[i]);
	}
	
	hiLbl.html(obstacles.length);
	
	areaGrid[gti] = 'howdy1';
}

function flow(to, from, hitList, tries)
{
	tries = tries!=undefined ? ++tries : 0;
	
	if(tries>3){  return false;  }
	
	to.flow = from.flow;
	
	if(Math.random()<.01){
		to.flow = (4 + to.flow + (Math.random()<.5 ? -1 : 1)) % 4;
	}
	
	var x = from.x + 16*getDirX(to.flow);
	var y = from.y + 16*getDirY(to.flow);
	
	to.flow = from.flow;
	
	if( ! to.hitTestList(x,y,hitList) )
	{	
		to.put(x,y);
		hitList.push(to);
		
		return true;
	}else{
		return flow(to, from, hitList, tries);
	}
}

function getDirX(dir){
	return dir==1 ? 1 : dir==3 ? -1 : 0;
}
function getDirY(dir){
	return dir==0 ? 1 : dir==2 ? -1 : 0;
}


jQuery(document).ready( function($)
{	
	game = new Game(400,300);
	
	canvas=game.canvas;
	ctx=game.ctx;
	gameOver=game.gameOver;
	
	//setupGfx();
	
	title = addTextBox({
		posx: 0,
		posy: 150,
		width: canvas.width,
		text: "Little Bit<br\>Lost",
		class: "title"
	});
	
	message = addTextBox({
		posx: 0,
		posy: canvas.height/2,
		width: canvas.width,
		text: "<br\>Press [Enter] for<br\>New Game!"
	});
	
	scoreLbl = addTextBox({
		posx: -10,
		posy: 0,
		width: 300,
		align:"right"
	});
	
	levelLbl = addTextBox({
		posx: 10,
		posy: 0,
		width: 300,
		align:"left"	
	});
	
	hiLbl = addTextBox({
		posx: 10,
		posy: 0,
		width: canvas.width*3,
		text: "HI: 000000"
	});
	
	// hiNameLbl = $(document.createElement("label"))
		// .addClass("text")
		// .width( canvas.width )
		// .css( "text-align", "center" )
		// .css("left", 0 )
		// .css("top",24);
	// hiNameLbl.text("ENTER NAME>");
	// $("#game_box").append(hiNameLbl);
	
	hiScore = getStateVal('hiScore',0);
	hiLevel = getStateVal('hiLevel',0);
	hiName = getStateVal('hiName',"Mario");	
	
	
	// bg = new Sprite({
		// url:"grass.png",
		// tileWidth:1000,
		// tileHeight:680,
		// x:500,
		// y:340,
		// loner:true
	// })
	
	
	
	
	marioLil = new Sprite({
		url:"guy.png",
		//loner:true,
		tileOrX:0,
		tileOrY:0,
		tileWidth:10,
		tileHeight:16,
		speed:6,
		frameCount:2,
		aniSpeed:150,
		//alpha:.5,
		x:canvas.width/2,
		y:100,
		checkMove: function(m,nx,ny,hlist)
		{			
			return m.hitTestList(nx,ny,hlist);			
		},
		onUpdate: function(frameRatio)
		{
			this.onFloor = mario.hitTestList(mario.x,mario.y+1,obstacles);
			if( this.onFloor ){        
				mario.speedy = Math.min( mario.speedy,0 );
        //mario.y = mario.y+mario.yspeed;
			}else{
				mario.speedy += .25*frameRatio;				
			}
			
			//world center
			if( mario.x+loc.x<80){
				loc.x = 80-mario.x;
			}else
			if( canvas.width-(mario.x+loc.x)<80){
				loc.x = canvas.width-80-mario.x;
			}
			if( mario.y+loc.y<80){
				loc.y = 80-mario.y;
			}else
			if( canvas.height-(mario.y+loc.y)<80){
				loc.y = canvas.height-80-mario.y;
			}
			
			//if( mario.jump && new Date().getTime() - mario.jump > 300 ){
			if( mario.jump ){
				mario.jump=null;
				mario.framei=null;
				if(onFloor){
					mario.speedy=-3;
				}
			}
		}
	});
	
	var ground = new Sprite({
		//url:"guy.png",
		color: "#999988",
		//loner:true,
		tileOrX:0,
		tileOrY:0,
		tileWidth:128,
		tileHeight:16,
		x:canvas.width/2,
		y:canvas.height-48		
	});	
	obstacles.push(ground);
  ground = new Sprite({
		//url:"guy.png",
		color: "#999988",
		//loner:true,
		tileOrX:0,
		tileOrY:0,
		tileWidth:40,
		tileHeight:40,
		x:canvas.width/2-64,
		y:canvas.height-48		
	});	
	obstacles.push(ground);
   ground = new Sprite({
		//url:"guy.png",
		color: "#999988",
		//loner:true,
		tileOrX:0,
		tileOrY:0,
		tileWidth:40,
		tileHeight:80,
		x:canvas.width/2+64,
		y:canvas.height-48		
	});	
	obstacles.push(ground);
	
	mario=marioLil;
	
	// marioDead = new Sprite({
		// url:"marioDead.png",
		// tileOrX:0,
		// tileOrY:0,
		// tileWidth:45,
		// tileHeight:63,
		// speed:6,
		// frameCount:2,
		// animate:true,
		// aniSpeed:500,
		// visible:false
	// });
	
	// marioBig = new Sprite({
		// url:"marioBig.png",
		// tileOrX:0,
		// tileOrY:0,
		// tileWidth:48,
		// tileHeight:84,
		// speed:6,
		// frameCount:3,
		// aniSpeed:133,
		// visible:false
	// });
	
	// marioRainbow = new Sprite({
		// url:"marioRainbow.png",
		// tileOrX:0,
		// tileOrY:0,
		// tileWidth:48,
		// tileHeight:84,
		// speed:6,
		// frameCount:3,
		// aniSpeed:133,
		// visible:false
	// });
	
	
	gameOver=true;
	gameReset();
	
	// stump = new Sprite({
		// url:"SNES - zelda - OW Tiles.png",
		// tileOrX:1047,
		// tileOrY:249,
		// tileWidth:96,
		// tileHeight:96,
		// x:120,
		// y:140
	// });
	
	
	game_tic = function()
	{
		if( gameOver ){
			return;
		}		
		
	}
	
	initSound();
	// loadSound( "boom", "explode-1.wav" );
	// loadSound( "shot", "Harpoon.mp3" );
	// //loadSound( "shot", "fireball.wav" );
	// //loadSound( "ching", "Cha Ching.mp3" );
	// loadSound( "ching", "coin.wav" );
	// loadSound( "getBig", "powerup.wav" );
	// loadSound( "marioGrunt", "marioGrunt.wav" );
	// loadSound( "marioGrunt2", "Scream.mp3" );	
	// loadSound( "marioHit", "mario_oof.wav" );	
	// loadSound( "pause", "pause.wav" );		
	// loadSound( "koopaSplat", "Splat.mp3" );
	// loadSound( "koopaCry", "koopaCry.wav" );
	// loadSound( "koopaCry2", "Sheep.mp3" );
	// loadSound( "roar1", "roar-lion.mp3" );
	// loadSound( "bossCry", "died-lion.mp3" );
	// loadSound( "fireball", "fireball.mp3" );
	// loadSound( "levelUp", "1-up.wav" );
	// loadSound( "puAppears", "powerup_appears.wav" );
	// loadSound( "fallApart", "fall_apart.wav" );
});


function scorePoints(points)
{
	score = score + points;
					
	scoreLbl.text("SCORE: "+padNumZ(score,6));
	
	if( score >= nextLevelAt )
	{	
		levelUp();
	}	
}



function gameReset(gt)
{
	gameType=gt;
	playSound("pause",1,0);
	
	//remove old stuff
	for( var i=0; i<koopas.length; i++ )
	{
		removeSprite(koopas[i]);
	}
	koopas.length=0;
	
	for( var i=0; i<fireballs.length; i++ ){
		removeSprite(fireballs[i]);
	}
	fireballs.length=0;
	
	for( var i=0; i<goodies.length; i++ ){
		removeSprite(goodies[i]);
	}
	goodies.length=0;
		
	//revive marios
	// marioDead.visible=false;
	// marioBig.visible=false;
	
	mario=marioLil;
	
	mario.visible=true;
	
	mario.put( canvas.width/2, canvas.height/2 );
	
	//moveSpriteToTop( mario );
	
	score=0;
	scoreLbl.text("SCORE: 000000");
	
	level=1;
	nextLevelAt=1000;
	levelLbl.text("LEVEL: 1");
	
	lastKillLevel=1;
	
	koopaSpeed = 3;
	marioSpeed = 2;
	fbSpeed = 12;
	
	message.hide();	
	title.hide();
	
	gameOver=false;
	
	koopaAddTime = 1300;

}








var b_render = render;
render = function(ratio)
{
	updateCurGrid();
	
	b_render(ratio);
};


drawBg = function(ratio)
{
	//ctx.fillStyle = "#66FF33";		
	ctx.fillStyle = "#111133";		
	ctx.fillRect(0,0,canvas.width,canvas.height);
}


var keysDown={};

document.addEventListener('keydown', function(evt)
{
	keysDown[evt.keyCode]=true;
	
	if( evt.keyCode == 77 ) // M for mute
	{		
		toggleMute();
	}
	
	// if( evt.keyCode==8){
		// var oldText = hiNameLbl.text();
		// if( oldText.length>11 ){
			// hiNameLbl.text( oldText.substring( 0, oldText.length-1 ) );
		// }
	// }else{
		// var oldText = hiNameLbl.text();
		// if( oldText.length < 21 ){
			// hiNameLbl.text( oldText + String.fromCharCode(evt.keyCode) );		
		// }
	// }
	
	
	if(gameOver)
	{
		if( evt.keyCode == 13 ) // enter
		{
			gameReset();
		}
		
		if( evt.keyCode == 66 ) // enter
		{
			gameReset('bomber');
		}
	
		return;
	}	
	
	if( evt.keyCode == 37 ) // left
	{		
		updateMarioDir();
	}else
	if( evt.keyCode == 39 ) // right
	{	
		updateMarioDir();
    }else
	if( evt.keyCode == 38 ) // up
	{
		updateMarioDir();
	}else
	if( evt.keyCode == 40 ) // down
	{
		updateMarioDir();
	}else
	//if( evt.keyCode == 90 ) // z
	//asdw
	if( evt.keyCode == 65 || evt.keyCode == 83 || evt.keyCode == 68 || evt.keyCode == 87 )
	{	
		//shootFireBall();	
		//panWorld();
	}
	
	if( evt.keyCode == 32 ) // space
	{
		if( ! mario.jump ){
			mario.jump = new Date().getTime();
			mario.framei=2;
		}
	}
}
, false);


function updateMarioDir()
{
	mario.speedx = 0;
	mario.speedy = 0;
	
	if( keysDown[37] ) // left
	{		
		mario.speedx -= marioSpeed;
	}
	if( keysDown[39] ) // right
	{	
		mario.speedx += marioSpeed;
    }
	if( keysDown[38] ) // up
	{
		mario.speedy -= marioSpeed;
	}
	if( keysDown[40] ) // down
	{
		mario.speedy += marioSpeed;
	}
	
	//change his graphic orientation, only when not 0
	if( mario.speedx<0 ){ mario.flip=true; } else
	if( mario.speedx>0 ){ mario.flip=false; }
	
	//diagonal speed
	if( mario.speedx != 0 && mario.speedy != 0 ){
		mario.speedx *= .707;
		mario.speedy *= .707;
	}
}


document.addEventListener('keyup', function(evt)
{
	keysDown[evt.keyCode]=false;
	
	if(gameOver){
		return;
	}
	
	if( evt.keyCode == 37 ) // left
	{
		updateMarioDir();
	}else
	if( evt.keyCode == 39 ) // right
	{
		updateMarioDir();
    }else
	if( evt.keyCode == 38 ) // up
	{
		updateMarioDir();
	}else
	if( evt.keyCode == 40 ) // down
	{
		updateMarioDir();
	}else
	if( evt.keyCode == 32 ) // space
	{
		//mario.put(0,0);
	}
	
	if( evt.keyCode == 65 || evt.keyCode == 83 || evt.keyCode == 68 || evt.keyCode == 87 )
	{	
		//shootFireBall(true);
	}
}
, false);



// function Sprite( config )
// {
	// this.x = config.x != undefined ? config.x : 0;
	// this.y = config.y != undefined ? config.y : 0;
	
	// this.flip = config.flip != undefined ? config.flip : false;
	
	// this.speedx=0;
	// this.speedy=0;
	
	// this.speed = config.speed != undefined ? config.speed : 0;
	
	// this.type = config.type != undefined ? config.type : 0;
	
	// var tileWidth = config.tileWidth;
	// var tileHeight = config.tileHeight;
	
	// var tileWidthDiv2 = Math.floor(config.tileWidth/2);
	// var tileHeightDiv2 = Math.floor(config.tileHeight/2);
	
	// this.hitTestWidth = tileWidth/2 * .8;
	// this.hitTestHeight = tileHeight/2 * .8;
	
	// var tileOrX = config.tileOrX != undefined ? config.tileOrX : 0;
	// var tileOrY = config.tileOrY != undefined ? config.tileOrY : 0;
	
	// var aniSpeed = config.aniSpeed != undefined ? config.aniSpeed : 500;
	
	// this.visible = config.visible != undefined ? config.visible : true;
	
	// this.alpha = config.alpha != undefined ? config.alpha : 1;
	
	// var me=this;
	
	// if( config.loner != true )
	// {
		// sprites.push(me);
	// }
	
	// var img = ImageLoader.getImage( config.url, function(image)
	// {
		// if( tileWidth == undefined ){  tileWidth = image.width;  }
		// if( tileHeight == undefined ){  tileHeight = image.height;  }
		
		// me.hitTestWidth = tileWidth/2 * .8;
		// me.hitTestHeight = tileHeight/2 * .8;
	// });
	
	// var animStyle = config.animStyle != undefined ? config.animStyle : 'forward';
	
	// var frameCount = config.frameCount != undefined ? config.frameCount : 1;
	
	// this.vari=0;
	
	// this.framei=null;
	
	// var checkMove = config.checkMove || function(){return false;};
	
	// var onUpdate = config.onUpdate || function(){};
	
	// this.draw = function(ctx)
	// {
		// var wci=0;
		
		// if( ! this.visible ){
			// return;
		// }
		
		// ctx.save();
		// ctx.translate( Math.floor(this.x),Math.floor(this.y));
		
		// if(this.flip){
			// ctx.scale(-1,1);
		// }
		
		// if( config.animate || ( this.speedx || this.speedy) )
		// {			
			// wci = Math.floor(now/aniSpeed) % frameCount;
			
			// if( config.aniRotPerSec ){
				// ctx.rotate( (now%config.aniRotPerSec)/config.aniRotPerSec * Math.PI*2 );
			// }
		// }
		// else{
			// wci = 0;
		// }
		
		// if( this.framei != null ){
			// wci=this.framei;
		// }
		
		// ctx.translate( -tileWidthDiv2, -tileHeightDiv2 );
		
		// // ctx.shadowBlur=8;
		// // ctx.shadowOffsetX=4;
		// // ctx.shadowOffsetY=4;
		// // ctx.shadowColor="#000000";
		
		// if( this.alpha < 1 ){		
			// ctx.globalAlpha=this.alpha;
		// }
		
		// //ctx.drawImage(img, -img.width/2, -img.height/2);
		// //console.log( tileOrX + tileWidth*wci, tileOrY + tileHeight*this.vari);
		// ctx.drawImage(
           // img,
           // tileOrX + tileWidth*wci,
           // tileOrY + tileHeight*this.vari,
           // tileWidth,
           // tileHeight,
           // 0,
           // 0,
           // tileWidth,
           // tileHeight);
		
		// ctx.restore();
	// };
	
	// this.hitTest = function(s)
	// {		
		// return ( Math.abs( this.x - s.x ) < this.hitTestWidth+s.hitTestWidth && 
			     // Math.abs( this.y - s.y ) < this.hitTestHeight+s.hitTestHeight )		
	// }
	
	// this.lastx=0;
	// this.lasty=0;
	
	// this.move = function(dx,dy)
	// {
		// this.lastx=this.x;
		// this.lasty=this.y;
		
		// this.put( this.x+dx, this.y+dy );
	// }
	
	// this.put = function(nx,ny)
	// {
		// if( nx != this.x && ! checkMove(this,nx,this.y, obstacles) ){
			// this.x=nx;
		// }
		
		// if( ny != this.y && ! checkMove(this,this.x,ny, obstacles) ){
			// this.y=ny;
		// }
		
		// //check x again after y maigh move it
		// if( nx != this.x && ! checkMove(this,nx,this.y, obstacles) ){
			// this.x=nx;
		// }
	// }
	
	// this.update = function(frameRatio)
	// {
		// this.move(this.speedx*frameRatio,this.speedy*frameRatio);
		
		// onUpdate(frameRatio);
	// }
	
	// this.width = function(){
		// return tileWidth;
	// }
	
	// this.height = function(){
		// return tileHeight;
	// }
// }


// function removeSprite( s )
// {
	// var i = sprites.indexOf(s);
	
	// if( i>=0 ){	
		// sprites.splice(i,1);	
	// }
// }

// function moveSpriteToTop( s )
// {
	// removeSprite( s );
	// sprites.push( s );
// }


// ImageLoader = new function()
// {
	// var imageList = {};
	
	// this.getImage = function( url, doneFunc )
	// {
		// var image = imageList[url];
		// if( image != undefined )
		// {
			// doneFunc(image);
		// }else
		// {
			// image = new Image();				
			// image.onload = function()
			// {
				// imageList[url]=image;
				// doneFunc(image);
			// }
			// image.src = url;		
		// }	
		
		// return image;
	// }

// };


// function addTextBox( opts )
// {
	// var lbl = $(document.createElement("label"))
		// .addClass( "text" + ( opts.class ? " "+opts.class : "") )
		// .width( opts.width )
		// .css( "text-align", ( opts.align ? opts.align : "center") )
		// .css( ( opts.posx<0 ? "right" : "left") , Math.abs(opts.posx) )
		// .css("top", opts.posy );
	
	// if( opts.text ){
		// lbl.html( opts.text );
	// }
	
	// $("#game_box").append(lbl);
	
	// return lbl;
// }

// function padNumZ(num, size) {
    // var s = num+"";
    // while (s.length < size) s = "0" + s;
    // return s;
// }




// ////////////////////////////////////////////////////////////////////////
// // sounds //////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////


// var aContext=null;
// function initSound()
// {
	// if( aContext!=null){  return;  }
	
    // try
	// {	
		// // Fix up for prefixing
		// window.AudioContext = window.AudioContext||window.webkitAudioContext;
		// aContext = new AudioContext();
	// }
	// catch(e) {
		// alert('Web Audio API is not supported in this browser');
	// }
// }


// sounds={};

// function loadSound( name, url )
// {
	// var request = new XMLHttpRequest();
	// request.open('GET', url, true);
	// request.responseType = 'arraybuffer';

	// // Decode asynchronously
	// request.onload = function()
	// {
		// aContext.decodeAudioData( request.response, function(buffer) {
			// sounds[name] = buffer;
		// }, function(){} );
	// }
	// request.send();
// }

// function playSound( sound, volume, start )
// {
	// <!-- if( muted ){   return;  } -->
	
	// <!-- if( start == undefined ){  start=0;  } -->

	// <!-- var source = aContext.createBufferSource();	 -->
		// <!-- source.buffer = sounds[sound]; -->
	// <!-- var gainNode = aContext.createGain(); -->
		// <!-- source.connect(gainNode); -->
		// <!-- gainNode.gain.value = volume; -->
		// <!-- gainNode.connect(aContext.destination); -->
	// <!-- //source.connect( aContext.destination ); -->
	// <!-- source.start(0,start); -->
// }

// function setupMute()
// {
	// var volumeDiv = $(document.createElement("div"))
		// .attr("id","volume")
		// .css("position","absolute")		
		// .css("left", 3 )
		// .css("bottom", -1);
	// $("#game_box").append(volumeDiv);
	
	// volOn = $(document.createElement("img"))
		// .attr("id","volOn")
		// .attr('src','volOn.png');
	// $("#volume").append(volOn);
	
	// volOff = $(document.createElement("img"))
		// .attr("id","volOn")
		// .attr('src','volOff.png');		
	// $("#volume").append(volOff);
	
	// volumeDiv.on('click', function()
	// {
		// toggleMute();
	// });
	
	// toggleMute( $.urlParam('muted')=='true' );
// }



// function toggleMute( setMute )
// {
	// muted = setMute!=undefined ? setMute : !muted;
		
	// if(muted){
		// volOn.hide();
		// volOff.show();
	// }else{
		// volOn.show();
		// volOff.hide();
	// }
// }


// //////

// $.urlParam = function(name){
    // var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    // if (results==null){
       // return null;
    // }
    // else{
       // return decodeURIComponent( results[1] || 0 );
    // }
// }


// shot = new Audio("explode-1.wav");
// shot.volume=.5;
// shot.load();

// function playSound(s)
// {
	// //s.pause();
	// s.currentTime=1;
	// s.play();
// }

