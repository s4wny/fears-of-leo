'use strict';

console.log("v1");

(function(window) {
	var testJson = '{"Area":[[1,1,1], [1,0,1], [1,1,1]]}';
	var testJson = '{"Area":[[1,1,0,0,0], [1,0,0,0,1], [1,0,1,0,1], [0,0,1,0,0], [0,1,1,1,0], [0,0,0,0,0], [0,1,1,1,1]]}';
	
	var canvas, ctx;
	var tileSize = 50;

	var WALL = 1;
	var PORT = 8080;
	var PLAYER = 4;
	var IP = "192.168.204.30";

	$(document).ready(function() {
		canvas = document.getElementById("js-game");
		ctx = canvas.getContext("2d");

		main();
	});

	function main() {
		$.getJSON('http://'+ IP +':'+ PORT).done(function(map) {
			console.log("Map", map);
		
			var canvasWidth = map.Area[0].length * tileSize;
			var canvasHeight = map.Area.length * tileSize;

			resizeCanvas(canvasWidth, canvasHeight);
			drawMap(map);
		}).fail(function(res) { console.log(res); });
	};

	function resizeCanvas(width, height) {
		canvas.width = width;
		canvas.height = height;
	}

	function drawMap(map) {
		map.Area.forEach(function(row, i) {
			row.forEach(function(type, j) {
				switch(type) {
					case WALL:
						drawSquare(j, i, 'black');
						break;
					case PLAYER:
						drawSquare(j, i, 'blue');
						break;
					default:
						console.warn("Undefined type!!", type);
						break;
				}
			});
		});
	}

	function drawSquare(x, y, color) {
		drawRect(x * tileSize, y * tileSize, tileSize, tileSize, color)
	}

	function drawRect(x, y, w, h, color) {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, w, h);
	}

})(window);


