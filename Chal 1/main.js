'use strict';

console.log("v1");

(function(window) {
    // GLOBAL VARZ
    var canvas, ctx, keysPressed;

    // CONFIG
    var TILE_SIZE = 50;

    var TILE_TYPES = {
        WALL : 'wall',
        PLAYER : 'player',
        FLOOR : 'floor',
    }
    
    var KEYPRESS_INTERVAL = 100;

    var PORT = 8080;
    var IP = "192.168.204.30"; // Filip
    var IP = "127.0.0.1"; // Local
    var SERVER_URL = "http://"+ IP +":"+ PORT;

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

        PLAYER_NAME = prompt("Enter a unicorn name:");

        createPlayer(PLAYER_NAME);
        getMapFromServerAndRender();

        listenForKeypressed();
        listenForMovement();
    };

    function getMapFromServerAndRender() {
        $.post({
            url: SERVER_URL + '/command',
            data: {command: 'scan', name: PLAYER_NAME},
            dataType: 'JSON'})
        .done(function(result) {
            var map = result.data;
        
            var canvasWidth = map[0].length * TILE_SIZE;
            var canvasHeight = map.length * TILE_SIZE;

            resizeCanvas(canvasWidth, canvasHeight);
            drawMap(map);
        }).fail(function(res) { console.log(res); });
    }

    function resizeCanvas(width, height) {
        canvas.width = width;
        canvas.height = height;
    }

    /**
     * Graphics related function
     */
    function drawMap(map) {
        map.forEach(function(row, i) {
            row.forEach(function(tile, j) {
                switch(tile.type) {
                    case TILE_TYPES.WALL:
                        drawSquare(j, i, 'black');
                        break;
                    case TILE_TYPES.PLAYER:
                        drawSquare(j, i, stringToColor(tile.name));
                        break;
                    case TILE_TYPES.FLOOR:
                        break;
                    default:
                        console.warn("Undefined type!!", tile.type, type);
                        break;
                }
            });
        });
    }

    function drawSquare(x, y, color) {
        drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, color)
    }

    function drawRect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
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

            $.post({
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
        $.post({
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


