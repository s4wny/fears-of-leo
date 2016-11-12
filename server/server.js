var os = require('os');
var express = require('express');
var bodyparser = require('body-parser');
var Dungeon = require('dungeon-generator')
var irc = require('irc')

var dungeon = genereateDungeon();
var DUNGEON_WIDTH = dungeon.size[0];
var DUNGEON_HEIGHT = dungeon.size[1];
var map = parseDungeonDataIntoArray();
var irc_client = createIRC()

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


/**
 * Monster structure:
 * {
 *      pos:{x:0, y:0},
 * }
 */

var monsters = [];

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
    advertice();
    monsters.push(get_rand_pos());
    monsters.push(get_rand_pos());
    auto_monster()
});

function auto_monster(){
    setInterval(function(){
        for(var i = 0; i < monsters.lenght; i++) {
            move_monster(i, Math.floor(Math.random()*3)-1, Math.floor(Math.random()*3)-1);
        }
    }, 1000);
}
function advertice(){
    var ifaces = os.networkInterfaces();
    var address = "";
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                //console.log(ifname + ':' + alias, iface.address);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                address = iface.address;
            }
            ++alias;
            return false;
        });
    });

    setInterval(function(){
        irc_client.say("#dungeon", JSON.stringify({"name":"UFU", "address":address+':8080', "info":"Unicorns for unicode"}))
    }, 5000);
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

function move_monster(index, dx, dy) {
    if ( ([-1, 0, 1].indexOf(dx) === -1 || [-1,0,1].indexOf(dy) === -1) ) {
        return {"success": false, "message": "Move not allowed"};
    }

    entity = monsters[index];

    if ( map[ parseInt(entity.y) + dy][parseInt(entity.x) + dx] == 1 ) {
        return {"success": false, "message": "You walked into a wall"};
    }
    
    for (var i = 0; i < monsters.length; i++) {
        if (i == index) {
            continue;
        }

        if(monsters[i].x === entity.x + dx && monsters[i].y === entity.y + dy){
            return {"success": false, "message": "You walked into another player"};
        }
    }
    
    for (var p_name in players) {
        other_player = players[p_name];
        if(other_player.pos.x == entity.x + dx && other_player.pos.y == entity.y + dy) {
            return {"success": false, "message": "You walked into another player"};
        }
    }

    entity.x += dx;
    entity.y += dy;
    monsters[index] = entity;

    return {"success": true, "message": ""};
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

    for (var i = 0; i < monsters.length; i++) {
        if(monsters[i].x === player.pos.x + dx && monsters[i].y === player.pos.y + dy){
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

    for(var i = 0; i < monsters.length; i++){
        entities.push({"name":"monsterssss", "x":monsters[i].x, "y":monsters[i].y});
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

function createIRC(){
    return new irc.Client('irc.leovegas.com', 'Unicorns', {
        channels: ['#dungeon'],
    }); 
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
