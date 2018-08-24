/*
 * IDEAS:
 * 
 * - Mines have energy "crystals" that usually provide the energy to drive mining machines
 * - Alien parasites awoken from hibernation within the mined minerals
 * - Alien parasites start absorbing energy from crystals
 * - Some parasites absorb blue, some green, some red, leaving all crystals discharged
 * - Automated machines shut down due to lack of power
 * - Ego can store energy in discharged crystals to bring them back online. Needs to be white to work.
 * - When all crystals in an area are white, that area brought back online
 * - Lines around edges of area glow white when area online (grey when not online)
 * - Health is shown by amount of light around ego. It reduces as health goes down.
 * - Mining machines start up when area brough back online. They start digging.
 * - Doors?
 * - 
 */

/**
 * Creates a new Ego. This is the main character whom the player controls. The
 * name originates with the old Sierra On-Line 3D animated adventure games. There
 * should be only one instance of this class.
 * 
 * @constructor
 */
$.Ego = function() {
  this.reset();
  this.size = $.Constants.CELL_WIDTH - 9;
  this.texture = 0.95;
  this.canvas = this.buildCanvas();
};

/**
 * Makes a particle of the flame trail behind the ship.
 */
$.Ego.prototype.makeFlame = function() {
  this.speed = {x: -1.5+Math.random()*1.5, y: -1.5+Math.random()*1.5};
  if ($.ego && $.ego.x && $.ego.y) {
    this.location = {x: $.ego.x, y: $.ego.y};
  }
  else {
    this.location = {x: 357, y: 63};
  }
  this.radius = ((($.Constants.CELL_WIDTH - 9) * Math.random()) / 2) + 2;
  this.life = 20+Math.random()*10;
  this.remainingLife = this.life;
}

/**
 * Resets Ego's state back to the game start state.
 */
$.Ego.prototype.reset = function() {
  this.x = 357;
  this.y = 63;
  this.power = 0;
  this.health = 0;
  this.direction = 0;
  this.facing = 3;
  this.powerUp(694);
  this.heading = 0;
  this.step = 10;
  this.hit = false;
  this.flame = [];
  for (var i = 0; i < 100; i++) {
    this.flame.push(new this.makeFlame());
  }
};

/**
 * Builds the background image canvas for the Ego.
 */
$.Ego.prototype.buildCanvas = function() {
  // Create a single canvas to render the sprite sheet for the four directions.
  var ctx = $.Util.create2dContext(this.size * 4, this.size);
  
  for (var f = 0; f < 4; f++) {
    ctx.drawImage($.Util.renderSphere(this.size, f + 1, 'white', this.texture, 'black'), f * this.size, 0);
  }
  
  return ctx.canvas;
};

/**
 * Adjusts the power property by the given amount, which could be either
 * negative or positive. It is invoked whenever Ego's power is set at reset, 
 * and also when Ego is hit by the Glitch.
 * 
 * @param {number} amount The amount to adjust the power by.
 */
$.Ego.prototype.powerUp = function(amount) {
  this.power += amount;
  
  if (this.power < 0) {
    // If the power goes below 0, it is the end of the game.
    this.power = 0;
    $.Game.gameover();
  }
  
  // Removing the style at this point ensures that we clear any previous 
  // transition. We don't what positive changes to use a transition since 
  // the change does't render while the absorb key is pressed down.
  $.power.removeAttribute('style');
  
  if (amount < 0) {
    // If the change was negative, then we apply a CSS transition since the
    // change for a hit is quite larger. This stops the power bar from making
    // quite jarring jumps in value. The transition makes this change smoother.
    $.power.style.transition = 'width 0.5s';
  }
  
  // Adjust the size of the power bar on screen to represent the new power value.
  $.power.style.width = this.power + 'px';
};

/**
 * Draws the main player.
 */
$.Ego.prototype.draw = function() {
  $.sctx.globalCompositeOperation = "lighter";

  for (var i = 0; i < this.flame.length; i++) {
    var p = this.flame[i];
    p.opacity = Math.round(p.remainingLife/p.life*100)/100
    var tempX = p.location.x + Math.cos(this.heading);
    var tempY = p.location.y + Math.sin(this.heading);
    
    $.Util.fillCircle(
        $.sctx, 
        tempX - this.x - p.radius - 1,
        tempY - this.y - p.radius - 1, 
        p.radius * 2,  
        'rgba(226, 88, 34,' + p.opacity + ')');
    
    p.remainingLife--;
    p.radius--;
    p.location.x -= p.speed.x;
    p.location.y -= p.speed.y;

    if ((p.remainingLife < 0) || (p.radius < 0)) {
      this.flame[i] = new this.makeFlame();
    }
  }
  
  $.sctx.globalCompositeOperation = "source-over";
  $.sctx.drawImage(this.canvas, 
      (this.size * this.facing), 0, this.size, this.size,
      -(this.size/2), -(this.size/2), this.size, this.size);
  
  if ($.Game.dragNow) {
    $.sctx.save();
    $.sctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    $.sctx.lineWidth = 1;
    $.sctx.moveTo(
        $.Game.dragNow.x - (~~($.Constants.WRAP_WIDTH / 2)), 
        $.Game.dragNow.y - (~~($.Constants.WRAP_HEIGHT / 2)));
    $.sctx.lineTo(0, 0);
    $.sctx.stroke();
    $.sctx.restore();
  }
};

/**
 * 
 */
$.Ego.prototype.findNewPos = function() {
  var startStep = this.step * $.Game.stepFactor;
  var currentStep = startStep;
  var foundNewPos = false;
  
  while (!foundNewPos && (currentStep > 0)) {
    // Attempt to move.
    var newXPos = this.x + Math.cos(this.heading) * Math.round(currentStep);
    var newYPos = this.y + Math.sin(this.heading) * Math.round(currentStep);
    
    var blocked = $.Map.circleIsBlocked(newXPos, newYPos, this.size/2);
    if (blocked) {
      currentStep--;
    } else {
      foundNewPos = true;
    }
  }
  
  if (currentStep != startStep) {
    this.heading = null;
  }
  
  if (foundNewPos) {
    return {newXPos: newXPos, newYPos: newYPos};
  } else {
    return null;
  }
};

/**
 * Updates Ego for the current frame. Checks the direction keys to see if
 * Ego's direction and movement needs to change. It also handles jumping,
 * firing bullets, and hitting the Glitch.
 */
$.Ego.prototype.update = function() {
  // Handle player "firing". It actually fires the whole ship.
  //if ($.Game.mouseButton) {
  if ($.Game.dragEnd && $.Game.dragStart) {
    $.Game.mouseButton = 0;
    
    // TODO: Temporary hack
    $.Game.xMouse = $.Game.dragEnd.x;
    $.Game.yMouse = $.Game.dragEnd.y;

    var dragDist = $.Util.dist($.Game.dragEnd, $.Game.dragStart); 
    console.log("dist: " + dragDist);
    
    $.Game.dragEnd = $.Game.dragStart = $.Game.dragNow = null;
    
    if (this.heading == null) {
      // The player is always in the middle of the window, so we calculate the heading from that point.
      var playerScreenX = (~~($.Constants.WRAP_WIDTH / 2));
      var playerScreenY = (~~($.Constants.WRAP_HEIGHT / 2));
      this.heading = Math.atan2(playerScreenY - $.Game.yMouse, playerScreenX - $.Game.xMouse) + ((($.Game.rotateAngle + 180) % 360) * Math.PI / 180);
    }
  }

  if (this.heading != null) {
    var newPos = this.findNewPos();
    if (newPos) {
      // Apply the new position.
      this.y = newPos.newYPos;
      this.x = newPos.newXPos;

      // Check the map bounds for wrap around.
      if (this.x < 0) {
        // Increment by width of room in pixels.
        this.x += $.Constants.ROOM_X_PIXELS;
      }
      if (this.y < 0) {
        // Increment by height of room in pixels.
        this.y += $.Constants.ROOM_Y_PIXELS;
      }
      if (this.x >= $.Constants.ROOM_X_PIXELS) {
        // Decrement by width of room in pixels.
        this.x -= $.Constants.ROOM_X_PIXELS;
      }
      if (this.y >= $.Constants.ROOM_Y_PIXELS) {
        // Decrement by height of room in pixels.
        this.y -= $.Constants.ROOM_Y_PIXELS;
      }
    }
  }
};
