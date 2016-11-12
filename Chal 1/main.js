'use strict';
(function(window) {
	var testJson = '{"Area":[[1,1,1], [1,0,1], [1,1,1]]}';
	var testJson = '{"Area":[[1,1,0,0,0], [1,0,0,0,1], [1,0,1,0,1], [0,0,1,0,0], [0,1,1,1,0], [0,0,0,0,0], [0,1,1,1,1]]}';
	var canvas, ctx;
	var tileSize = 50;

	var WALL = 1;
	var PORT = 8080;

	$(document).ready(function() {
		canvas = document.getElementById("js-game");
		ctx = canvas.getContext("2d");

		main();
	});

	function main() {
		$.getJSON('http://localhost:'+ PORT).done(function(map) {
			console.log(map);
			console.log("Map", map);
		
			var canvasWidth = map.Area[0].length * tileSize;
			var canvasHeight = map.Area.length * tileSize;

			resizeCanvas(canvasWidth, canvasHeight);
			drawMap(map);
		}).fail(function(res) { console.log(res); });

		/*
		var map = JSON.parse(testJson);
		console.log("Map", map);
		
		var canvasWidth = map.Area[0].length * tileSize;
		var canvasHeight = map.Area.length * tileSize;

		resizeCanvas(canvasWidth, canvasHeight);
		drawMap(map);*/
	};

	function resizeCanvas(width, height) {
		canvas.width = width;
		canvas.height = height;
	}

	function drawMap(map) {
		map.Area.forEach(function(row, i) {
			row.forEach(function(isWall, j) {
				if(isWall == WALL)
					ctx.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
			});
		});
	}

})(window);

console.log("v1");




