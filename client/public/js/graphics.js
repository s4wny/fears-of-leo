'use strict';

console.log("Graphics v1");

(function(window) {
    var graphics = {};

    // GLOBAL VARZ
    var canvas, ctx;
    var TILE_SIZE = 50;

    var TILE_TYPES = {
        WALL : 1,
        PLAYER : 'player',
        FLOOR : 0,
    }


    graphics.initCanvas = function() {
        canvas = document.getElementById("js-game");
        ctx = canvas.getContext("2d");
    }

    /** 
     * width, height = _number_ of tiles.
     */
    graphics.resizeCanvas = function(width, height) {
        canvas.width = width * TILE_SIZE;
        canvas.height = height * TILE_SIZE;
    }

    /**
     * Graphics related function
     */
    graphics.drawMap = function(map) {
        map.forEach(function(row, i) {
            row.forEach(function(tile, j) {
                switch(tile) {
                    case TILE_TYPES.WALL:
                        var isOccupied = [0,0,0,0];
                        if(i > 0 && map[i-1][j]) isOccupied[0] = 1;
                        if(j > 0 && map[i][j-1]) isOccupied[3] = 1;
                        if(map.length > i+1 && map[i+1][j]) isOccupied[2] = 1;
                        if(map[i].length > j+1 && map[i][j+1]) isOccupied[1] = 1;

                        var corners = [1,1,1,1];
                        if(isOccupied[0] || isOccupied[1]) corners[1] = 0;
                        if(isOccupied[1] || isOccupied[2]) corners[3] = 0;
                        if(isOccupied[2] || isOccupied[3]) corners[2] = 0;
                        if(isOccupied[3] || isOccupied[0]) corners[0] = 0;

                        graphics.drawRoundSquare(j, i, corners, 'black');
                        break;
                    case TILE_TYPES.FLOOR:
                        break;
                    default:
                        console.warn("Undefined type!!", tile);
                        break;
                }
            });
        });
    }

    graphics.drawEntities = function(entities, playerName) {
        var myX, myY;
        entities.forEach(function(entity) {
            if(entity.name == playerName) {
                myX = entity.x;
                myY = entity.y;
                return;
            }
        });

        entities.forEach(function(entity) {
            var corners = [1,1,1,1];
            graphics.drawRoundSquare(entity.x - myX + 3, entity.y - myY + 3, corners, graphics.stringToColor(entity.name));
        });
    }

    graphics.drawRoundSquare = function(x, y, corners, color) {
      graphics.drawRect((x + 0.2) * TILE_SIZE, y * TILE_SIZE, 0.6 * TILE_SIZE, TILE_SIZE, color);
      graphics.drawRect(x * TILE_SIZE, (y + 0.2) * TILE_SIZE, TILE_SIZE, 0.6 * TILE_SIZE, color);
      if(corners[0]) {
        graphics.drawCircle((x + 0.2) * TILE_SIZE, (y + 0.2) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        graphics.drawRect(x * TILE_SIZE, y * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
      if(corners[1]) {
        graphics.drawCircle((x + 0.8) * TILE_SIZE, (y + 0.2) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        graphics.drawRect((x + 0.8) * TILE_SIZE, y * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
      if(corners[2]) {
        graphics.drawCircle((x + 0.2) * TILE_SIZE, (y + 0.8) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        graphics.drawRect(x * TILE_SIZE, (y + 0.8) * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
      if(corners[3]) {
        graphics.drawCircle((x + 0.8) * TILE_SIZE, (y + 0.8) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        graphics.drawRect((x + 0.8) * TILE_SIZE, (y + 0.8) * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
    }

    graphics.drawSquare = function(x, y, color) {
        graphics.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, color)
    }

    graphics.drawRect = function(x, y, w, h, color) {
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+w,y);
        ctx.lineTo(x+w,y+h);
        ctx.lineTo(x,y+h);
        ctx.closePath();

        ctx.fill();
    }

    graphics.drawCircle = function(x, y, r, color) {
    	var angle = 0;

    	ctx.fillStyle = color;
    	ctx.beginPath();
    	ctx.moveTo(r * Math.cos(angle) + x, r * Math.sin(angle) + y);
    	while(angle < 2 * Math.PI){
    		angle += 2 * Math.PI / 16;
    		ctx.lineTo(r * Math.cos(angle) + x, r * Math.sin(angle) + y);
    	}
    	ctx.closePath();

    	ctx.fill();
    }

    graphics.intToColor = function(input){
        var ret = "rgb(";
        ret += input%256 + ',';
        input = Math.floor(input/256);
        ret += input%256 + ',';
        input = Math.floor(input/256);
        ret += input%256 + ')';
        return ret;
    }

    graphics.stringToColor = function(input) {
        var hash = 0;

        if (input.length == 0)
            return hash;

        for (var i = 0; i < input.length; i++) {
            var char = input.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        if(hash < 0) {
            hash *= -1;
        }

        return graphics.intToColor(hash);
    }

    window.graphics = graphics;
})(window);
