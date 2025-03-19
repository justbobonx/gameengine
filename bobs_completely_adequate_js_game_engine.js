////////////////////////////////////////////////////////
// bobs_completely_adeuqate_js_game_engine.js     //////
// BoCAJGE
////////////////////////////////////////////////////////



//default callbacks
game_tic=function(){};
init_sounds=function(){};



//game object
function Game( w,h )
{
	this.gameWidth=w;
	this.gameHeight=h;	
	
	this.canvas;	
	this.ctx;	
	
	setupGfx(this);
	
	this.gameOver=true;		
	
	initSound();
	init_sounds();
	
	gameInt = setInterval( function()
	{
		game_tic();
	},20);
	
	setupMute();
	
	requestAnimationFrame(main);
	
	function setupGfx(g)
	{
		var canvas = document.createElement("canvas");	
		
		$("#game_box").append(canvas);
		
		$("body").css('overflow','hidden');
		
		var ctx = canvas.getContext("2d");
		//ctx.globalCompositeOperation = "source-over";
		ctx.imageSmoothingEnabled = false;
			
		canvas.width = g.gameWidth;
		canvas.height = g.gameHeight;
		
		g.canvas=canvas;
		g.ctx=ctx;
		// canvas.width = $(window).width();
		// canvas.height = $(window).height();
	}
	
	this.createBg = function()
	{
		ctx.fillStyle = "#6dab51";		
		ctx.fillRect(0,0,canvas.width,canvas.height);
		
		var grassCols = [ "#65a24a","#6ba950","#669f4d","#6ca453"]//,"#6dab51","#65a24a","#6ba950","#669f4d","#6ca453","#6dab51","#65a24a","#6ba950","#669f4d","#6ca453","#80ab4e","#3ca246" ]
		
		for( x=0; x<canvas.width; x++ ){
			for( y=0; y<canvas.height; y++ ){
				ctx.fillStyle = grassCols[Math.floor(Math.random()*4)]
				ctx.fillRect(x,y,1,1);
			}
		}
		
		var bgURL = canvas.toDataURL();
		
		bg = new Sprite({
			url:bgURL,
			tileWidth: canvas.width,
			tileHeight: canvas.height,
			x:canvas.width/2,
			y:canvas.height/2,
			loner:true
		});
	}

}




///////////////////////////////////////////////////////////////////////////////////////////////////
// rendering///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

var obstacles=undefined;

var render = function( ratio )
{	
	drawBg(ratio);
	
	for( var i=0; i< sprites.length;i++ )
	{
		sprites[i].update(ratio);
	}	
	
	sprites.sort( (a,b) => { return a.y - b.y; } );
	
	ctx.save();
	ctx.translate( Math.floor(loc.x),Math.floor(loc.y));
	
	for( var i=0; i< sprites.length;i++ ){	
		sprites[i].draw(ctx);
	}
	
	ctx.restore();
};

var target_fps=20;
var min_ratio=.5;
var max_ratio=1.5;
var now;
var then = Date.now();
var main = function ()
{
	now = Date.now();
	var delta = now - then;
	then = now;
	
	var ratio = delta / target_fps;
	ratio = Math.min(Math.max( ratio, min_ratio ), max_ratio );
	//console.log( ratio );
	
	render(ratio);	
	
	requestAnimationFrame(main);	
};


var drawBg = function(ratio)
{
	//bg color fill
	//ctx.fillStyle = "#66FF33";
	//ctx.fillRect(0,0,canvas.width,canvas.height);
	
	bg.draw(ctx);
}

////////////////////////////////////////////////////////////////////////
// Sprites /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


function Sprite( config )
{
	this.x = config.x != undefined ? config.x : 0;
	this.y = config.y != undefined ? config.y : 0;
	
	this.flip = config.flip != undefined ? config.flip : false;
	
	this.speedx=0;
	this.speedy=0;
	
	this.speed = config.speed != undefined ? config.speed : 0;
	
	this.type = config.type != undefined ? config.type : 0;
	
	var tileWidth = config.tileWidth;
	var tileHeight = config.tileHeight;
	
	var tileWidthDiv2 = Math.floor(config.tileWidth/2);
	var tileHeightDiv2 = Math.floor(config.tileHeight/2);
	
	this.hitTestWidth = config.hitTestwWidth!=undefined ? config.hitTestwWidth : tileWidth/2 * .8;
	this.hitTestHeight = config.hitTestHeight!=undefined ? config.hitTestHeight : tileHeight/2 * .8;
	
	var tileOrX = config.tileOrX != undefined ? config.tileOrX : 0;
	var tileOrY = config.tileOrY != undefined ? config.tileOrY : 0;
	
	var aniSpeed = config.aniSpeed != undefined ? config.aniSpeed : 500;
	
	this.visible = config.visible != undefined ? config.visible : true;
	
	this.alpha = config.alpha != undefined ? config.alpha : 1;
	
	this.scale = config.scale != undefined ? config.scale : 1;
	
	var me=this;
	
	if(config.url){
		var img = ImageLoader.getImage( config.url, function(image)
		{
			if( tileWidth == undefined ){  tileWidth = image.width;  }
			if( tileHeight == undefined ){  tileHeight = image.height;  }
		
			if( config.loner != true )
			{
				sprites.push(me);
			}
			
			me.hitTestWidth = config.hitTestwWidth!=undefined ? config.hitTestwWidth : tileWidth/2 * .8;
			me.hitTestHeight = config.hitTestHeight!=undefined ? config.hitTestHeight : tileHeight/2 * .8;		
		});
	}
	
	this.color;
	if( config.color ){	
		this.color=config.color;
		if( config.loner != true )
		{
			sprites.push(me);
		}
	}
	
	var animStyle = config.animStyle != undefined ? config.animStyle : 'forward';
	
	var frameCount = config.frameCount != undefined ? config.frameCount : 1;
	
	this.vari=0;
	
	this.framei=null;
	
	//default callbacks
	var checkMove = config.checkMove || function(){return false;};
	var onUpdate = config.onUpdate || function(){};
	
	this.draw = function(ctx)
	{
		var wci=0;
		
		if( ! this.visible ){
			return;
		}
		
		ctx.save();
		ctx.translate( Math.floor(this.x),Math.floor(this.y));
		
		// if( this.scale != 1 ){
			// ctx.scale( this.scale * (this.flip ? -1 : 1),
						  // this.scale );
		// }
		// else
		if(this.flip){			
			ctx.scale(-1,1);
		}
		
		if( config.animate || ( this.speedx || this.speedy) )
		{			
			wci = Math.floor(now/aniSpeed) % frameCount;
			
			if( config.aniRotPerSec ){
				ctx.rotate( (now%config.aniRotPerSec)/config.aniRotPerSec * Math.PI*2 );
			}
		}
		else{
			wci = 0;
		}
		
		if( this.framei != null ){
			wci=this.framei;
		}
		
		ctx.translate( -tileWidthDiv2, -tileHeightDiv2 );
		
		// ctx.shadowBlur=8;
		// ctx.shadowOffsetX=4;
		// ctx.shadowOffsetY=4;
		// ctx.shadowColor="#000000";
		
		if( this.alpha < 1 ){		
			ctx.globalAlpha=this.alpha;
		}
		
		if(this.color)
		{
			ctx.fillStyle = this.color;
			ctx.fillRect(
				0,0,
				Math.round(tileWidth*this.scale),
				Math.round(tileHeight*this.scale)
			);
		}
		else{		
			//ctx.drawImage(img, -img.width/2, -img.height/2);
			//console.log( tileOrX + tileWidth*wci, tileOrY + tileHeight*this.vari);
			ctx.drawImage(
				  img,
				  tileOrX + tileWidth*wci,
				  tileOrY + tileHeight*this.vari,
				  tileWidth,
				  tileHeight,
				  0,
				  0,
				  Math.round(tileWidth*this.scale),
				  Math.round(tileHeight*this.scale));
		}
		
		
		ctx.restore();
	};

	
	this.hitTest = function(s)
	{
		return ( Math.abs( this.x - s.x ) < this.hitTestWidth+s.hitTestWidth && 
			     Math.abs( this.y - s.y ) < this.hitTestHeight+s.hitTestHeight )		
	}	
	
	this.hitTestList = function(nx,ny,hlist)
	{
		var tester = {
			x: nx,
			y: ny,
			hitTestWidth: this.hitTestWidth,
			hitTestHeight: this.hitTestHeight
		}
		for( var i=0; i<hlist.length; i++ )
		{
			var hitter = hlist[i];
			
			if( hitter.hitTest( tester ) )
			{
				this.hitObj=hitter;
				return hitter;
			}
		}
		return false;
	}

	this.move = function(dx,dy, obstacles)
	{		
		this.put( this.x+dx, this.y+dy, obstacles );
	}
	
	this.put = function( nx,ny, obstacles)
	{
		if( obstacles )
		{
			if( nx != this.x && ! checkMove(this,nx,this.y, obstacles) ){
				this.x=nx;
			}
			
      var diff = Math.sign(ny-this.y);
      for( ; Math.floor(ny)!=Math.floor(this.y); ny-=diff ){
        //if( ny != this.y && ! checkMove(this,this.x,ny, obstacles) ){
        if( Math.floor(ny)==Math.floor(this.y) || !checkMove(this,this.x,ny, obstacles) ){
          this.y=ny;
          break;			
        }
      }
			
			//check x again after y might move it
			if( nx != this.x && ! checkMove(this,nx,this.y, obstacles) ){
				this.x=nx;
			}
		}
		else
		{
			this.x=nx;
			this.y=ny;
		}
	}
	
	this.update = function(frameRatio)
	{
		this.move(this.speedx*frameRatio,this.speedy*frameRatio,obstacles);
		
		onUpdate(frameRatio);
	}

	this.width = function(){
		return tileWidth;
	}
	
	this.height = function(){
		return tileHeight;
	}
	
}

function removeSprite( s )
{
	var i = sprites.indexOf(s);
	
	if( i>=0 ){	
		sprites.splice(i,1);	
	}
}

function moveSpriteToTop( s )
{
	removeSprite( s );
	sprites.push( s );
}




ImageLoader = new function()
{
	var imageList = {};
	
	this.getImage = function( url, doneFunc )
	{
		var image = imageList[url];
		if( image != undefined )
		{
			doneFunc(image);
		}else
		{
			image = new Image();				
			image.onload = function()
			{
				imageList[url]=image;
				doneFunc(image);
			}
			image.src = url;		
		}	
		
		return image;
	}

};


function addTextBox( opts )
{
	var lbl = $(document.createElement("label"))
		.addClass( "text" + ( opts.class ? " "+opts.class : "") )
		.width( opts.width )
		.css( "text-align", ( opts.align ? opts.align : "center") )
		.css( ( opts.posx<0 ? "right" : "left") , Math.abs(opts.posx) )
		.css("top", opts.posy );
	
	if( opts.text ){
		lbl.html( opts.text );
	}
	
	$("#game_box").append(lbl);
	
	return lbl;
}


function padNumZ(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}



////////////////////////////////////////////////////////////////////////
// sounds //////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


var aContext=null;
function initSound()
{
	if( aContext!=null){  return;  }
	
    try
	{	
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		aContext = new AudioContext();
	}
	catch(e) {
		alert('Web Audio API is not supported in this browser');
	}
}


var sounds={};

function loadSound( name, url )
{
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	// Decode asynchronously
	request.onload = function()
	{
		aContext.decodeAudioData( request.response, function(buffer) {
			sounds[name] = buffer;
		}, function(){} );
	}
	request.send();
}

function playSound( sound, volume, start )
{
	if( muted ){   return;  }
	
	if( start == undefined ){  start=0;  }

	var source = aContext.createBufferSource();	
		source.buffer = sounds[sound];
	var gainNode = aContext.createGain();
		source.connect(gainNode);
		gainNode.gain.value = volume;
		gainNode.connect(aContext.destination);
	//source.connect( aContext.destination );
	source.start(0,start);
}

function setupMute()
{
	
	var volumeDiv = $(document.createElement("div"))
		.attr("id","volume")
		.css("position","absolute")		
		.css("left", 3 )
		.css("bottom", -1);
	$("#game_box").append(volumeDiv);
	
	volOn = $(document.createElement("img"))
		.attr("id","volOn")
		.attr('src','volOn.png');
	$("#volume").append(volOn);
	
	volOff = $(document.createElement("img"))
		.attr("id","volOn")
		.attr('src','volOff.png');		
	$("#volume").append(volOff);
	
	volumeDiv.on('click', function()
	{
		toggleMute();
	});
	
	toggleMute( $.urlParam('muted')=='true' );
}

function toggleMute( setMute )
{
	muted = setMute!=undefined ? setMute : !muted;
		
	if(muted){
		volOn.hide();
		volOff.show();
	}else{
		volOn.show();
		volOff.hide();
	}
}


//other sound way
// function loadSound( s_name, vol )
// {
// 	var s = new Audio( s_name );
// 	s.volume = vol!=undefined ? vol : .5;
// 	s.load();
// 	return s;
// }
//
// function playSound(s)
// {
	// //s.pause();
	// s.currentTime=1;
	// s.play();
// }



////////////////////////////////////////////////////////////////////////
// controls ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////
// misc ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURIComponent( results[1] || 0 );
    }
}

