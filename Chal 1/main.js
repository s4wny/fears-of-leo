'use strict';

console.log("v1");

(function(window) {
	var testJson = '{"Area":[[1,1,1], [1,0,1], [1,1,1]]}';
	var testJson = '{"Area":[[1,1,0,0,0], [1,0,0,0,1], [1,0,1,0,1], [0,0,1,0,0], [0,1,1,1,0], [0,0,0,0,0], [0,1,1,1,1]]}';
	
	// GLOBAL VARZ
	var canvas, ctx, keysPressed;

	// CONFIG
	var TILE_SIZE = 10;

	var TILE_TYPES = {
		WALL : 1,
		PLAYER : 4,
		EMPTY : 0,
	}
	
	var KEYPRESS_INTERVAL = 100;

	var PORT = 8080;
	var IP = "192.168.204.30"; // Filip
	var IP = "127.0.0.1"; // Local
	var SERVER_URL = "http://"+ IP +":"+ PORT;

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

	 	createPlayer("SuperUnicorn");
		listenForKeypressed();
		listenForMovement();
		getMapFromServerAndRender();
	};

	function getMapFromServerAndRender() {
		$.getJSON(SERVER_URL).done(function(map) {
			console.log("Map", map);
		
			var canvasWidth = map.Area[0].length * TILE_SIZE;
			var canvasHeight = map.Area.length * TILE_SIZE;

			resizeCanvas(canvasWidth, canvasHeight);
			drawMap(map);
		}).fail(function(res) { console.log(res); });
	}

	function resizeCanvas(width, height) {
		canvas.width = width;
		canvas.height = height;
	}

	function drawMap(map) {
		map.Area.forEach(function(row, i) {
			row.forEach(function(type, j) {
				switch(type) {
					case TILE_TYPES.WALL:
						drawSquare(j, i, 'black');
						break;
					case TILE_TYPES.PLAYER:
						drawSquare(j, i, 'blue');
						break;
					case TILE_TYPES.EMPTY:
						break;
					default:
						console.warn("Undefined type!!", type);
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
	
	function intToColor(input) {
		var ret = "rgb(";
		ret += parseInt(input%256) + ',';
		input = Math.floor(input/256);
		ret += parseInt(input%256) + ',';
		input = Math.floor(input/256);
		ret += parseInt(input%256) + ')';
		return ret;
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

			var command = {command : "move", name: "swag", dx: 1, dy: 1};
			var dx = 0;
			var dy = 0;

			dy += (keysPressed[ALLOWED_KEYS.up])    ? 1 : 0;
			dy += (keysPressed[ALLOWED_KEYS.down])  ? -1 : 0;
			dx += (keysPressed[ALLOWED_KEYS.right]) ? 1 : 0;
			dx += (keysPressed[ALLOWED_KEYS.left])  ? -1 : 0;
			command.dx = dx;
			command.dy = dy;

			unsetAllKeysPressed();

			$.post(SERVER_URL, command)
			.done(function(res) {
				console.log(res);
			})
			.fail(function(res) {
				console.error(res);
			});

		}, KEYPRESS_INTERVAL);
	}

	function createPlayer(username) {
		var command = {command: 'create', name: username};

		$.post(SERVER_URL, command)
		.done(function(res) {
			console.log(res);
		})
		.fail(function(res) {
			console.error(res);
		});
	}
})(window);


