var os = require('os');
var irc = require('irc');
var irc_client = createIRC();


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

function createIRC(){
    return new irc.Client('irc.leovegas.com', 'Unicorns', {
        channels: ['#dungeon'],
    }); 
}

module.exports = function(){
    advertice()
}
