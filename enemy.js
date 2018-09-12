/**
 * Creates a new Enemy, AKA the Glitch.
 * 
 * @constructor
 * @param {number} col Map column. 
 * @param {number} row Map row.
 */
$.Enemy = function(col, row) {
  this.col = (col % 152);
  this.row = (row % 104);
  //this.colour = [ 'rgba(255, 0, 0, 1)', 'rgba(0, 255, 0, 1)', 'rgba(255, 255, 0, 1)' ][(col % 3)];
  this.colour = 'hsla(' + ((this.col * 10) % 360) + ', 100%, 80%, 0.6)';
  this.x = this.col * $.Constants.CELL_WIDTH + ($.Constants.CELL_WIDTH / 2);
  this.y = this.row * $.Constants.CELL_WIDTH + ($.Constants.CELL_WIDTH / 2);
  this.key = 'e_' + col + '_' + row;
  this.canvas = this.buildCanvas(col, $.Constants.CELL_WIDTH, $.Constants.CELL_WIDTH);
  this.bulletDelay = 0;
  this.targetMiner = 0;
  
  // Calculate facing direction.
  var rightBlock = $.Map.data[((this.col + 1) % 152) + (this.row * 152)];
  var leftBlock = $.Map.data[(this.col == 0? 151 : this.col - 1) + (this.row * 152)];
  var topBlock = $.Map.data[this.col + ((this.row == 0? 103 : this.row - 1) * 152)];
  var bottomBlock = $.Map.data[this.col + (((this.row + 1) % 104) * 152)];

  if (rightBlock == '#') this.direction = 0;
  if (leftBlock == '#') this.direction = 1;
  if (topBlock == '#') this.direction = 2;
  if (bottomBlock == '#') this.direction = 3;
};
/**
 * Updates the Enemy for the current frame. 
 */
$.Enemy.prototype.update = function() {
  // On average, once every 50 frames, the Enemy will check to see if it should fire a
  // bullet at Ego. There is a delay of 3 frames to protect against bullets being fired 
  // too quickly.
  if ($.Game.running && ((Math.random() * 5) < 1) && (this.bulletDelay <= 0)) {

    //var headingToEgo = Math.atan2(this.y - $.ego.y, this.x - $.ego.x) + (180 * Math.PI / 180);
    var distToEgo = Math.round($.Util.dist($.ego, this));
    
    // Only fire within a certain range, i.e. just within visual screen.
    if (distToEgo < 350) {
      
      // Check the 10 miners, one each update. Reduce random to 5, so 5 * 10 miners = 50
      var miner = $.Game.miners[this.targetMiner];
      // We only both to shoot online miners. When they're offline, it would be a waste of bullets.
      if (miner.online) {
        var headingToMiner = Math.atan2(this.y - miner.y, this.x - miner.x) + (180 * Math.PI / 180);
        var distToMiner = Math.round($.Util.dist(miner, this));
        
        if (distToMiner < 350) {
          var currentStep = 1;
          var lineOfSightToEgo = true;
          
          while (lineOfSightToEgo && (currentStep < distToMiner)) {
            // Look at next pixel.
            var testX = this.x + Math.cos(headingToMiner) * Math.round(currentStep);
            var testY = this.y + Math.sin(headingToMiner) * Math.round(currentStep);
            
            var blocked  = $.Map.circleIsBlocked(testX, testY, 1);
            if (!blocked) {
              currentStep++;
            } else {
              lineOfSightToEgo = false;
            }
          }
          
          // If in range, and has line of sight, then fire!
          if (lineOfSightToEgo) {
            for (var bulletNum = 0; bulletNum < 5; bulletNum++) {
              if ($.Game.bullets[bulletNum] == null) {
                var startX = this.x + Math.cos(headingToMiner) * Math.round($.Constants.CELL_WIDTH / 2);
                var startY = this.y + Math.sin(headingToMiner) * Math.round($.Constants.CELL_WIDTH / 2);
                $.Game.bullets[bulletNum] = new $.Bullet(startX, startY, headingToMiner);
                $.Sound.play('bomb');
                break;
              }
            }
          }
        
          // This is the enforced 3 frame delay between Bombs.
          this.bulletDelay = 3;
        }
      }
    }
    
  } else {
    this.bulletDelay--;
    this.targetMiner = ((this.targetMiner + 1) % 10);
  }
};

/**
 * Draws this Enemy on the given context using the given col and row. Note
 * that this may be different from the Enemy's internal col and row due to 
 * the way that the map is doubled in both directions.
 * 
 * @param {2dContext} ctx The 2D context to draw the Enemy on.
 * @param {number} col The column to draw the Enemy at.
 * @param {number} row The row to draw the Enemy at.
 */
$.Enemy.prototype.draw = function(ctx, col, row) {
  ctx.shadowColor   = this.colour;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur    = 10;
  
  switch (this.direction) {
    case 0: // Right
      ctx.drawImage(this.canvas, 
          0, 0, 
          $.Constants.CELL_WIDTH / 2 + 2,
          $.Constants.CELL_WIDTH,
          col * $.Constants.CELL_WIDTH + ($.Constants.CELL_WIDTH / 2) - 2, 
          row * $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH / 2 + 2,
          $.Constants.CELL_WIDTH
          );
      break;
      
    case 1: // Left
      ctx.drawImage(this.canvas, 
          $.Constants.CELL_WIDTH / 2, 0, 
          $.Constants.CELL_WIDTH / 2 + 2,
          $.Constants.CELL_WIDTH,
          col * $.Constants.CELL_WIDTH, 
          row * $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH / 2 + 2,
          $.Constants.CELL_WIDTH
          );
      break;
      
    case 2: // Top
      ctx.drawImage(this.canvas, 
          0, $.Constants.CELL_WIDTH / 2, 
          $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH / 2 + 2,
          col * $.Constants.CELL_WIDTH, 
          row * $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH / 2 + 2
          );
      break;
      
    case 3: // Bottom
      ctx.drawImage(this.canvas, 
          0, 0, 
          $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH / 2 + 2,
          col * $.Constants.CELL_WIDTH, 
          row * $.Constants.CELL_WIDTH + ($.Constants.CELL_WIDTH / 2) - 2,
          $.Constants.CELL_WIDTH,
          $.Constants.CELL_WIDTH / 2 + 2
          );
      break;
  }
  
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

/**
 * 
 */
$.Enemy.prototype.buildCanvas = function(seed, iconWidth, iconHeight) {
  var hashRand = [];
  var random = new $.Util.random(seed);
  for (var i=0; i<20; i++) {
    hashRand[i] = random(2147483647);
  }
  
  var ctx = $.Util.create2dContext(iconWidth, iconHeight);
  var shadowRadius = (iconWidth / 2);
  
  ctx.beginPath();
  ctx.arc(shadowRadius, shadowRadius, shadowRadius - 3, 0, 2 * Math.PI);
  ctx.clip();
  
  var blockDensityX = 13;
  var blockDensityY = 13;
  var blockWidth = iconWidth / blockDensityX;
  var blockHeight = iconHeight / blockDensityY;
  var blockMidX = ((blockDensityX + 1) / 2);
  var blockMidY = ((blockDensityY + 1) / 2);
  
  for (var x = 0; x < blockDensityX; x++) {
    var i = x < blockMidX ? x : (blockDensityX - 1) - x;
    for (var y = 0; y < blockDensityY; y++) {
      var j = y < blockMidY ? y : (blockDensityY - 1) - y;
      if ((hashRand[i] >> j & 1) == 1) {
        ctx.fillStyle = this.colour;
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.0)';
      }
      ctx.beginPath();
      ctx.rect(x * blockWidth, y * blockHeight, blockWidth, blockHeight);
      ctx.fill();
    }
  }
  
  return ctx.canvas;
};
