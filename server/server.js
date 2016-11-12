var express = require('express');
var bodyparser = require('body-parser');
var Dungeon = require('dungeon-generator')

var dungeon = genereateDungeon();
var DUNGEON_WIDTH = dungeon.size[0];
var DUNGEON_HEIGHT = dungeon.size[1];
var map = parseDungeonDataIntoArray();

var SPEED_LIMIT = 100;

/**
 * Player structure:
 * {
 *      pos:{x:0, y:0},
 *      last_time_move:0
 *      last_time_scan:0
 * }
 */
var players = {};

var app = express();

app.use(bodyparser.urlencoded({
    extended: true
}));

app.get('/command', function(req, res){
    res = addCrosHeaders(res);

    var command = req.query.command;
    var name = req.query.name;
    console.log(req.query)

    switch(command) {
        case 'create':
            if ( name in players ) {
                res.end(JSON.stringify({"success": false, "message": "Username already in use"}));
                return
            }
            players[name] = {pos:get_rand_pos(), last_time_move: get_current_time(), last_time_scan: get_current_time()}
            res.end(JSON.stringify({"success": true, "message": ""}));
            break;

        case 'move':
            var dx = parseInt(req.query.dx);
            var dy = parseInt(req.query.dy);
            
            res.end(JSON.stringify(move_player(name, dx, dy)));
            break;

        case 'scan':
            if ( !(name in players) ) {
                res.end(JSON.stringify({"success": false, "message": "User does not exist"}));
                return
            }

            player = players[name];

            var scan = getSquaresAroundPlayer(player);
            players[name].last_time_scan = get_current_time();
            res.end(JSON.stringify(scan));
            break;

        default:
            res.end(JSON.stringify({"success": false, "message": "Command not found"}));
            return
    }
});

app.listen(8080, function() {
    console.log("Listen to port 8080");
    remove_inactive_players();
});

function remove_inactive_players(){
    setInterval(function(){
        for(var name in players) {
            if ((get_current_time() - players[name].last_time_scan) > 10000) {
                delete players[name];
            }
        }
    }, SPEED_LIMIT);
}

function move_player(name, dx, dy) {
    if ( ([-1, 0, 1].indexOf(dx) === -1 || [-1,0,1].indexOf(dy) === -1) ) {
        return {"success": false, "message": "Move not allowed"};
    }

    if ( !(name in players) ) {
        return {"success": false, "message": "User does not exist"};
    }

    player = players[name];
    
    if ( (get_current_time() - player.last_time_move) < SPEED_LIMIT) {
        return {"success": false, "message": "You need to wait a bit longer to move again"};
    }

    if ( map[ parseInt(player.pos.y) + dy][parseInt(player.pos.x) + dx] == 1 ) {
        return {"success": false, "message": "You walked into a wall"};
    }
    
    for (var p_name in players) {
        other_player = players[p_name];
        if(other_player.pos.x == player.pos.x + dx && other_player.pos.y == player.pos.y + dy) {
            return {"success": false, "message": "You walked into another player"};
        }
    }

    player.last_time_move = get_current_time();
    player.pos.x += dx;
    player.pos.y += dy;
    players[name] = player;

    return {"success": true, "message": ""};
}
/** 
 * 7x7 map around player
 */
function getSquaresAroundPlayer(player) {
    var Area = [];
    for (var y = -3; y <= 3; y++) {
        Area.push([]);

        for (var x = -3; x <= 3; x++) {
            
            if(typeof map[y+player.pos.y] === "undefined" || typeof map[y+player.pos.y][x+player.pos.x] === "undefined") {
                Area[y+3].push(1);
            } else {
                var is_wall = map[y+player.pos.y][x+player.pos.x] ? 1 : 0;
                Area[y+3].push(is_wall);
            }
        }
    }
    
    // Other player around you
    var entities = []
    for(var name in players) {
        other_player = players[name];
        if(Math.abs(other_player.pos.x - player.pos.x) <= 3 && Math.abs(other_player.pos.y - player.pos.y) <= 3) {
            entities.push({"name":name, "x":other_player.pos.x, "y":other_player.pos.y});
        }
    }

    return {Area:Area, entities:entities};
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

    return map;
}

function get_rand_pos(){
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
