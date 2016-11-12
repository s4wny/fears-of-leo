'use strict';

console.log("v1");

(function(window) {
    // GLOBAL VARZ
    var canvas, ctx, keysPressed;

    // CONFIG
    var TILE_SIZE = 50;
    var POLL_RATE = 100;

    var TILE_TYPES = {
        WALL : 1,
        PLAYER : 'player',
        FLOOR : 0,
    }

    var KEYPRESS_INTERVAL = 100;

    var SERVER_URL;
    var PLAYER_NAME;

    var ALLOWED_KEYS = {
        left : 37,
        up : 38,
        right : 39,
        down : 40,
    }

    // Don't put code here, put in main.
    $(document).ready(function() {
        main();
    });

    function main() {
        canvas = document.getElementById("js-game");
        ctx = canvas.getContext("2d");

        addActiveServersToHTMLList();
        connectToServerOnBtnClick(function() {
            createPlayer(PLAYER_NAME);
            getMapFromServerAndRender();

            listenForKeypressed();
            listenForMovement();
            automaticallyUpdateMap();
        });
    };

    function connectToServerOnBtnClick(cb) {
        $("#js-connect-to-server").on('click', function() {
            PLAYER_NAME = prompt("Enter a unicorn name:");
            SERVER_URL = $("#js-server-list").val();

            cb();
        });
    }

    function addActiveServersToHTMLList() {
        $.getJSON('/ircServers').done(function(ircServers) {
            var html = "";

            for(var ip in ircServers) {
                html += "<option value='http://"+ htmlEncode(ip) +"'>"+ htmlEncode(ircServers[ip].name) +" ("+ htmlEncode(ip) +")</option>"
            }

            console.log(ircServers, html);

            $("#js-server-list").html(html);
        }).fail(function(res) {
            console.error(res);
        });
    }

    function automaticallyUpdateMap() {
        setInterval(function() {
            getMapFromServerAndRender();
        }, POLL_RATE);
    }

    function getMapFromServerAndRender() {
        $.get({
            url: SERVER_URL + '/command',
            data: {command: 'scan', name: PLAYER_NAME},
            dataType: 'JSON'})
        .done(function(result) {
            var map = result.Area;

            var canvasWidth = map[0].length * TILE_SIZE;
            var canvasHeight = map.length * TILE_SIZE;

            resizeCanvas(canvasWidth, canvasHeight);
            drawMap(map);
            drawEntities(result.entities);
        }).fail(function(res) { console.log(res); });
    }

    function resizeCanvas(width, height) {
        canvas.width = width;
        canvas.height = height;
    }

    function htmlEncode(value){
        return $('<div/>').text(value).html();
    }

    /**
     * Graphics related function
     */
    function drawMap(map) {
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

                        drawRoundSquare(j, i, corners, 'black');
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

    function drawEntities(entities) {
        var myX, myY;
        entities.forEach(function(entity) {
            if(entity.name == PLAYER_NAME) {
                myX = entity.x;
                myY = entity.y;
                return;
            }
        });

        entities.forEach(function(entity) {
            var corners = [1,1,1,1];
            drawRoundSquare(entity.x - myX + 3, entity.y - myY + 3, corners, stringToColor(entity.name));
        });
    }

    function drawRoundSquare(x, y, corners, color) {
      drawRect((x + 0.2) * TILE_SIZE, y * TILE_SIZE, 0.6 * TILE_SIZE, TILE_SIZE, color);
      drawRect(x * TILE_SIZE, (y + 0.2) * TILE_SIZE, TILE_SIZE, 0.6 * TILE_SIZE, color);
      if(corners[0]) {
        drawCircle((x + 0.2) * TILE_SIZE, (y + 0.2) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        drawRect(x * TILE_SIZE, y * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
      if(corners[1]) {
        drawCircle((x + 0.8) * TILE_SIZE, (y + 0.2) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        drawRect((x + 0.8) * TILE_SIZE, y * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
      if(corners[2]) {
        drawCircle((x + 0.2) * TILE_SIZE, (y + 0.8) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        drawRect(x * TILE_SIZE, (y + 0.8) * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
      if(corners[3]) {
        drawCircle((x + 0.8) * TILE_SIZE, (y + 0.8) * TILE_SIZE, TILE_SIZE * 0.2, color);
      } else {
        drawRect((x + 0.8) * TILE_SIZE, (y + 0.8) * TILE_SIZE, 0.2 * TILE_SIZE, 0.2 * TILE_SIZE, color);
      }
    }

    function drawSquare(x, y, color) {
        drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, color)
    }

    function drawRect(x, y, w, h, color) {
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+w,y);
        ctx.lineTo(x+w,y+h);
        ctx.lineTo(x,y+h);
        ctx.closePath();

        ctx.fill();
    }

    function drawCircle(x, y, r, color) {

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

    function intToColor(input){
        var ret = "rgb(";
        ret += input%256 + ',';
        input = Math.floor(input/256);
        ret += input%256 + ',';
        input = Math.floor(input/256);
        ret += input%256 + ')';
        return ret;
    }

    function stringToColor(input) {
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

        return intToColor(hash);
    }


    /**
     * Is any of the ALLOWED_KEYS pressed?
     */
    function isAnyAllowedKeyPress() {
        var anyAllowdKeyIsPressed = false;
        for(var key in ALLOWED_KEYS) {
            if(keysPressed[ALLOWED_KEYS[key]] === true) {
                anyAllowdKeyIsPressed = true;
            }
        }

        return anyAllowdKeyIsPressed;
    }

    function unsetAllKeysPressed() {
        for (var key in keysPressed) {
            delete keysPressed[key];
        }
    }

    /**
     * Set keysPressed[key] to true on KEYDOWN
     * Unset on KEYUP
     */
    function listenForKeypressed() {
        keysPressed = {};

        $(document).keydown(function (e) {
            keysPressed[e.which] = true;
        });

        $(document).keyup(function (e) {
            delete keysPressed[e.which];
        });
    }


    function listenForMovement() {
        setInterval(function() {
            // Don't send command if no relevant key is pressed
            if(!isAnyAllowedKeyPress()) {
                return;
            }

            var command = {command : "move", name: PLAYER_NAME, dx: 1, dy: 1};
            var dx = 0;
            var dy = 0;

            dy += (keysPressed[ALLOWED_KEYS.up])    ? -1 : 0;
            dy += (keysPressed[ALLOWED_KEYS.down])  ? 1 : 0;
            dx += (keysPressed[ALLOWED_KEYS.right]) ? 1 : 0;
            dx += (keysPressed[ALLOWED_KEYS.left])  ? -1 : 0;
            command.dx = dx;
            command.dy = dy;

            unsetAllKeysPressed();

            $.get({
                url: SERVER_URL + '/command',
                data: command,
                dataType: 'JSON'})
            .done(function(res) {
                console.log(res);
                getMapFromServerAndRender();
            })
            .fail(function(res) {
                console.error(res);
            });

        }, KEYPRESS_INTERVAL);
    }

    function createPlayer(username) {
        $.get({
            url: SERVER_URL + '/command',
            data: {command: 'create', name: username},
            dataType: 'JSON'})
        .done(function(res) {
            console.log(res);
        })
        .fail(function(res) {
            console.error(res);
        });
    }
})(window);
