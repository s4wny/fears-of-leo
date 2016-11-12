var express = require('express');
var bodyparser = require('body-parser');
var irc = require('irc');

var CONFIG_IRC = {
    host: 'irc.leovegas.com',
    username: 'UFU_client',
    channel: '#dungeon'
}

var gameServers = {};

var app = express();

app.use(express.static('public'));
app.use(bodyparser.urlencoded({
    extended: true
}));

app.get('/ircServers', function(req, res) {
    res.end(JSON.stringify(gameServers));
});

app.listen(8080, function() {
    console.log("Listen to port 8080");

    listenForNewServers();
    removeOldServers();
});

function listenForNewServers() {
    var client = new irc.Client(CONFIG_IRC.host, CONFIG_IRC.username, {
        channels: [CONFIG_IRC.channel],
    });

    // Assume that all message on the IRC are valid JSON and
    client.addListener('message', function (from, to, message) {
        try {
            var server = JSON.parse(message);

            gameServers[server.address] = {
                name: server.name,
                addedAt: new Date().getTime(),
            };
        } catch(e) {
            console.warn("Malformed server, skipping.", message);
        }
    });
}

function removeOldServers() {
    var timeInterval = 1000*10;

    setInterval(function() {
        for (gameServer in gameServers) {
            if(new Date().getTime() - timeInterval > gameServers[gameServer].addedAt) {
                console.log("Removed old server:", gameServers[gameServer]);
                delete gameServers[gameServer];
            }
        }
    }, timeInterval);
}