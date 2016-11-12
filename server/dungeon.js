var Dungeon = require('dungeon-generator')

function genereateDungeon(seed) {
    var dungeon = new Dungeon({
        size: [100, 100], 
        seed:seed,
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

module.exports = function(seed) {

    var dungeon = genereateDungeon(seed);
    var DUNGEON_WIDTH = dungeon.size[0];
    var DUNGEON_HEIGHT = dungeon.size[1];
    var map = [];

    for(var y = 0; y < DUNGEON_HEIGHT; y++) {
        map.push([]);
        for(var x = 0; x < DUNGEON_WIDTH; x++) {
            map[y].push(dungeon.walls.get([x,y]) ? 1 : 0);
        }
    }

    return {map:map, width:DUNGEON_WIDTH, height:DUNGEON_HEIGHT};
}
