var express = require('express');
var bodyparser = require('body-parser');

var app = express();

app.use(express.static('public'));
app.use(bodyparser.urlencoded({
    extended: true
}));

app.get('/ircServers', function(req, res) {
	res.end("Tja");
});

app.listen(8080, function() {
    console.log("Listen to port 8080");
});