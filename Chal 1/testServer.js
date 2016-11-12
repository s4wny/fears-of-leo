var http = require('http');
const PORT=8080; 

//Create a server
var server = http.createServer(function(req, res) {
	var a = {"Area":[[1,1,0,0,0], [1,0,0,0,1], [1,0,1,0,1], [0,0,1,0,0], [0,1,1,1,0], [0,0,0,0,0], [1,1,1,1,1]]};

	// CROS
	res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.end(JSON.stringify(a));
});

server.listen(PORT, function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});