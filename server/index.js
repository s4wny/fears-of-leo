const http = require('http');
const Dungeon = require('dungeon-generator')

var dungeon = new Dungeon({
    size: [100, 100], 
    seed:"abcd",
    rooms: {
        any: {
            min_size: [2, 3],
            max_size: [5, 6]
        }
    },
    max_corridor_length: 6,
    min_corridor_length: 2,
    corridor_density: 0.5, //corridors per room 
    symmetric_rooms: false, // exits must be in the center of a wall if true 
    interconnects: 1, //extra corridors to connect rooms and make circular paths. not 100% guaranteed 
    max_interconnect_length: 10,
    room_count: 10
});

dungeon.generate();
dungeon.print()

http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    let data = {Area:[]}

    for(y = 0; y < dungeon.size[0]; y++) {
        data.Area.push([]);
        for(x = 0; x < dungeon.size[1]; x++) {
            data.Area[y].push(dungeon.walls.get([x,y])?1:0)
        }
    }

    res.write(JSON.stringify(data))
    res.end();
}).listen(8080);

