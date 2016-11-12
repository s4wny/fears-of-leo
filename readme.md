# Fears of leo

Javascript and node.js based game.


## Client

Usage: 

 - npm install
 - node webserver.js
 - visit localhost:8080


Note that webserver.js depends on a IRC server (irc.leovegas.com, #dungeon) where servers annonunce their existence. 
The `js/client.js` will connect to `webserver.js/ircServers` which will return a list of all active servers. Via the GUI a user then chooses a server. `js/client.js` will then communicate with the server.

## Server

Server will connect to the IRC server (irc.leovegas.com, #dungeon) and annonuce that it is online. Other clients can then connect to the server.

Usage: 
 - npm install
 - node server.js