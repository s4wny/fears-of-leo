'use strict';

console.log("Client v1");

(function(window, graphics) {
    // GLOBAL VARZ
    var keysPressed;

    // CONFIG
    var POLL_RATE = 100;

    var KEYPRESS_INTERVAL = 100;

    var SERVER_URL;
    var PLAYER_NAME;

    var ALLOWED_KEYS = {
        left : 37,
        up : 38,
        right : 39,
        down : 40,
    }

    // Don't put code here, put in main.
    $(document).ready(function() {
        main();
    });

    function main() {
        graphics.initCanvas();

        addActiveServersToHTMLList();
        connectToServerOnBtnClick(function() {
            createPlayer(PLAYER_NAME);
            getMapFromServerAndRender();

            listenForKeypressed();
            listenForMovement();
            automaticallyUpdateMap();
        });
    };

    function connectToServerOnBtnClick(cb) {
        $("#js-connect-to-server").on('click', function() {
            PLAYER_NAME = prompt("Enter a unicorn name:");
            SERVER_URL = $("#js-server-list").val();

            cb();
        });
    }

    function addActiveServersToHTMLList() {
        $.getJSON('/ircServers').done(function(ircServers) {
            var html = "";

            for(var ip in ircServers) {
                html += "<option value='http://"+ htmlEncode(ip) +"'>"+ htmlEncode(ircServers[ip].name) +" ("+ htmlEncode(ip) +")</option>"
            }

            console.log(ircServers, html);

            $("#js-server-list").html(html);
        }).fail(function(res) {
            console.error(res);
        });
    }

    function automaticallyUpdateMap() {
        setInterval(function() {
            getMapFromServerAndRender();
        }, POLL_RATE);
    }

    function getMapFromServerAndRender() {
        $.get({
            url: SERVER_URL + '/command',
            data: {command: 'scan', name: PLAYER_NAME},
            dataType: 'JSON'})
        .done(function(result) {
            var map = result.Area;

            graphics.resizeCanvas(map[0].length, map.length);
            graphics.drawMap(map);
            graphics.drawEntities(result.entities, PLAYER_NAME);
        }).fail(function(res) { console.log(res); });
    }

    function htmlEncode(value){
        return $('<div/>').text(value).html();
    }

    /**
     * Is any of the ALLOWED_KEYS pressed?
     */
    function isAnyAllowedKeyPress() {
        var anyAllowdKeyIsPressed = false;
        for(var key in ALLOWED_KEYS) {
            if(keysPressed[ALLOWED_KEYS[key]] === true) {
                anyAllowdKeyIsPressed = true;
            }
        }

        return anyAllowdKeyIsPressed;
    }

    function unsetAllKeysPressed() {
        for (var key in keysPressed) {
            delete keysPressed[key];
        }
    }

    /**
     * Set keysPressed[key] to true on KEYDOWN
     * Unset on KEYUP
     */
    function listenForKeypressed() {
        keysPressed = {};

        $(document).keydown(function (e) {
            keysPressed[e.which] = true;
        });

        $(document).keyup(function (e) {
            delete keysPressed[e.which];
        });
    }


    function listenForMovement() {
        setInterval(function() {
            // Don't send command if no relevant key is pressed
            if(!isAnyAllowedKeyPress()) {
                return;
            }

            var command = {command : "move", name: PLAYER_NAME, dx: 1, dy: 1};
            var dx = 0;
            var dy = 0;

            dy += (keysPressed[ALLOWED_KEYS.up])    ? -1 : 0;
            dy += (keysPressed[ALLOWED_KEYS.down])  ? 1 : 0;
            dx += (keysPressed[ALLOWED_KEYS.right]) ? 1 : 0;
            dx += (keysPressed[ALLOWED_KEYS.left])  ? -1 : 0;
            command.dx = dx;
            command.dy = dy;

            unsetAllKeysPressed();

            $.get({
                url: SERVER_URL + '/command',
                data: command,
                dataType: 'JSON'})
            .done(function(res) {
                console.log(res);
                getMapFromServerAndRender();
            })
            .fail(function(res) {
                console.error(res);
            });

        }, KEYPRESS_INTERVAL);
    }

    function createPlayer(username) {
        $.get({
            url: SERVER_URL + '/command',
            data: {command: 'create', name: username},
            dataType: 'JSON'})
        .done(function(res) {
            console.log(res);
        })
        .fail(function(res) {
            console.error(res);
        });
    }
})(window, window.graphics);
