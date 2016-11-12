var express = require('express');
var bodyparser = require('body-parser');

// Advertice server
var advertice = require('./irc.js');
var create_dungeon = require('./dungeon.js');

var SPEED_LIMIT = 100;

/**
 * Player structure:
 * {
 *      pos:{x:0, y:0},
 *      last_time_move:0
 *      last_time_scan:0
 * }
 *
 * Monster structure:
 * {
 *      pos:{x:0, y:0},
 * }
 */

var players = {};
var monsters = [];
var dungeon = create_dungeon("abdc");

var app = express();

app.use(bodyparser.urlencoded({
    extended: true
}));

app.get('/command', function(req, res){
    res = addCrosHeaders(res);

    var command = req.query.command;
    var name = req.query.name;

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
            if ( !(name in players) ) {
                return
            }

            var dx = parseInt(req.query.dx);
            var dy = parseInt(req.query.dy);
            
            res.end(JSON.stringify(move_player(name, dx, dy)));
            break;

        case 'scan':
            if ( !(name in players) ) {
                return
            }

            player = players[name];

            var scan = getSquaresAroundPlayer(player);
            players[name].last_time_scan = get_current_time();
            res.end(JSON.stringify(scan));
            break;

    }
});

app.listen(8080, function() {
    console.log("Listen to port 8080");
    remove_inactive_players();
    advertice();
    monsters.push(get_rand_pos());
    monsters.push(get_rand_pos());
    if(is_move_allowed(monsters[0], 0, 0) || is_move_allowed({x:0, y:0}, 0, 0)) {
        console.log("You function upp")
    }
    auto_monster()
});

function auto_monster(){
    setInterval(function(){
        for(var i = 0; i < monsters.length; i++) {
            move_monster(i, Math.floor(Math.random()*3)-1, Math.floor(Math.random()*3)-1);
        }
    }, 1000);
}

function remove_inactive_players(){
    setInterval(function(){
        for(var name in players) {
            if ((get_current_time() - players[name].last_time_scan) > 10000) {
                delete players[name];
            }
        }
    }, SPEED_LIMIT);
}

function is_move_allowed(old_pos, dx, dy) {
    if ( ([-1, 0, 1].indexOf(dx) === -1 || [-1,0,1].indexOf(dy) === -1) ) {
        return false;
    }

    if ( dungeon.map[old_pos.y + dy][old_pos.x + dx] == 1 ) {
        return false;
    }

    for (var i = 0; i < monsters.length; i++) {
        if(monsters[i].x === old_pos.x + dx && monsters[i].y === old_pos.y + dy){
            return false;
        }
    }

    for (var p_name in players) {
        other_player = players[p_name];
        if(other_player.pos.x == old_pos.x + dx && other_player.pos.y == old_pos.y + dy) {
            return false;
        }
    }

    return true;
}

function move_pos(old_pos, dx, dy) {
    if(is_move_allowed(old_pos, dx, dy)) {
        old_pos.x += dx;
        old_pos.y += dy;
    }
    return old_pos;
}

function move_monster(index, dx, dy) {
    monsters[index] = move_pos(monsters[index], dx, dy);
}

function move_player(name, dx, dy) {
    player = players[name];
   
    if ((get_current_time() - player.last_time_move) < SPEED_LIMIT) {
        return;
    } 

    player.pos = move_pos(player.pos, dx, dy);
    player.last_time_move = get_current_time();

    players[name] = player;
}

/** 
 * 7x7 dungeon.map around player
 */
function getSquaresAroundPlayer(player) {
    var Area = [];
    for (var y = -3; y <= 3; y++) {
        Area.push([]);

        for (var x = -3; x <= 3; x++) {
            
            if(typeof dungeon.map[y+player.pos.y] === "undefined" || typeof dungeon.map[y+player.pos.y][x+player.pos.x] === "undefined") {
                Area[y+3].push(1);
            } else {
                var is_wall = dungeon.map[y+player.pos.y][x+player.pos.x] ? 1 : 0;
                Area[y+3].push(is_wall);
            }
        }
    }
    
    // Other player around you
    var entities = []
    for(var name in players) {
        other_player = players[name];
        if(Math.abs(other_player.pos.x - player.pos.x) <= 3 && Math.abs(other_player.pos.y - player.pos.y) <= 3) {
            entities.push({"name":name, "type":"player", "x":other_player.pos.x, "y":other_player.pos.y});
        }
    }

    for(var i = 0; i < monsters.length; i++){
        entities.push({"name":"monsterssss", "type":"monster", "x":monsters[i].x, "y":monsters[i].y});
    }

    return {Area:Area, entities:entities};
}

function get_rand_pos(){
    while(true) {
        var x = Math.floor(Math.random()*dungeon.width);
        var y = Math.floor(Math.random()*dungeon.height);
        if(is_move_allowed({x:x, y:y}, 0, 0)) {
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

