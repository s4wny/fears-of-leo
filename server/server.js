var express = require('express');
var bodyparser = require('body-parser');
var Dungeon = require('dungeon-generator')

var dungeon = genereateDungeon();
var DUNGEON_WIDTH = dungeon.size[0];
var DUNGEON_HEIGHT = dungeon.size[1];
var map = parseDungeonDataIntoArray();

console.log(map);

/**
 * Player structure:
 * {
 *      pos:{x:0, y:0},
 *      last_time_move:0
 * }
 */
var players = {};

var app = express();

app.use(bodyparser.urlencoded({
    extended: true
}));

app.post('/command', function(req, res){
    res = addCrosHeaders(res);

    var command = req.body.command;
    var name = req.body.name;

    switch(command) {
        case 'create':
            if ( name in players ) {
                res.end(JSON.stringify({"success": false, "message": "Username already in use"}));
                return
            }
            players[name] = {pos:get_rand_pos(), last_time_move: get_current_time()}
            res.end(JSON.stringify({"success": true, "message": ""}));
            break;

        case 'move':
            var dx = parseInt(req.body.dx);
            var dy = parseInt(req.body.dy);
            
            if ( !(name in players) ) {
                res.end(JSON.stringify({"success": false, "message": "User does not exist"}));
                return
            }

            player = players[name];
            
            if ( ([-1, 0, 1].indexOf(dx) === -1 || [-1,0,1].indexOf(dy) === -1) ) {
                res.end(JSON.stringify({"success": false, "message": "Move not allowed"}));
                return
            }
            
            if ( (get_current_time() - player.last_time_move) < 500) {
                res.end(JSON.stringify({"success": false, "message": "You need to wait a bit longer to move again"}));
                return
            }

            if ( map[ parseInt(player.pos.y) + dy][parseInt(player.pos.x) + dx] == 1 ) {
                res.end(JSON.stringify({"success": false, "message": "You walked into a wall"}));
                return
            }
            
            player.last_time_move = get_current_time();
            player.pos.x += dx;
            player.pos.y += dy;
            players[name] = player;
            res.end(JSON.stringify({"success": true, "message": ""}));
            break;

        case 'scan':
            if ( !(name in players) ) {
                res.end(JSON.stringify({"success": false, "message": "User does not exist"}));
                return
            }

            player = players[name];
            mapAroundPlayer = getSquaresAroundPlayer(player);

            res.end(JSON.stringify({"success": true, "data": mapAroundPlayer, "message": ""}));
            break;
        default:
            res.end(JSON.stringify({"success": false, "message": "Command not found"}));
            return
    }
});

app.listen(8080, function() {
    console.log("Listen to port 8080");
});

/** 
 * 3x3 map around player
 */
function getSquaresAroundPlayer(player) {
    var mapAroundPlayer = [];
    for (var i = -1; i <= 1; i++) {
        mapAroundPlayer.push([]);
        for (var j = -1; j <= 1; j++) {
            mapAroundPlayer[i+1].push(map[i+player.pos.y][j+player.pos.x] ? 1 : 0);
        }
    }

    return mapAroundPlayer;
}

function genereateDungeon() {
    var dungeon = new Dungeon({
        size: [100, 100], 
        seed:"abcd",
        rooms: {
            any: {
                min_size: [2, 3],
                max_size: [5, 6],
                max_exits: 4
            }
        },
        max_corridor_length: 10,
        min_corridor_length: 2,
        corridor_density: 0.5, //corridors per room 
        symmetric_rooms: false, // exits must be in the center of a wall if true 
        interconnects: 1, //extra corridors to connect rooms and make circular paths. not 100% guaranteed 
        max_interconnect_length: 10,
        room_count: Math.floor(Math.random()*10)+4
    });

    dungeon.generate();
    dungeon.print();
    console.log("Dungeon size:", dungeon.size);

    return dungeon;
}

function parseDungeonDataIntoArray() {
    var map = [];

    for(var y = 0; y < DUNGEON_HEIGHT; y++) {
        map.push([]);
        for(var x = 0; x < DUNGEON_WIDTH; x++) {
            map[y].push(dungeon.walls.get([x,y]) ? 1 : 0);
        }
    }

    console.log("parseDungeonDataIntoArray", map);

    return map;
}

function get_rand_pos(){
    console.log("map2", map);
    while(true) {
        var x = Math.floor(Math.random()*DUNGEON_WIDTH);
        var y = Math.floor(Math.random()*DUNGEON_HEIGHT);
        if( !map[y][x] ) {
            return {x:x, y:y};
        }
    }
}

function get_current_time() { // Returns millisec
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    }
    return Date.now()
}

function addCrosHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    return res;
}