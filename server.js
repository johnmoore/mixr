var io = require('socket.io').listen(42069, {log: true});

var clients = [];
var groups = [];
var sockets = {};
var ready = {};
var games = {};


io.sockets.on('connection', function(client){

    console.log('joined');
    client.myid = -1;
    
    client.on('ready', function(data){
        console.log("ready from " + client.myid);
        ready[client.myid] = true;
        var i = 0;
        var checkgroup = -1;
        for (i=0; i<groups.length; i++) {
            if (groups[i].indexOf(client.myid) >= 0) {
                checkgroup = i;
                break;
            }
        }
        console.log("checkgroup: " + checkgroup);
        if (checkgroup < 0) {
            console.log("error!!");
            return; //should never happen
        }
        console.log(ready);
        var pass = true;
        for (i=0; i<groups[checkgroup].length; i++) {
            if (ready[groups[checkgroup][i]] == false) {
                pass = false;
            }
        }
        console.log("pass? " + pass);
        if (pass && groups[checkgroup].length >= 2) {
            console.log("begin");
            //begin game
            var head = [];
            var gc = [];
            for (j=0; j<groups[checkgroup].length; j++) {
                sockets[groups[checkgroup][j]].join(groups[checkgroup][0]);
                sockets[groups[checkgroup][j]].gameid = groups[checkgroup][0];
                head.push(0);
                sockets[groups[checkgroup][j]].playerid = j;
                gc.push(sockets[groups[checkgroup][j]]);
            }
            console.log("Pre-group:");
            console.log(groups);
            games[groups[checkgroup][0]] = {players: groups[checkgroup], headings: head, headnum: 0, piecemap: null, gameclients: gc};
            console.log("Started game. Games:");
            console.log(games);
            console.log("Groups:");
            console.log(groups);
            for (j=0; j<groups[checkgroup].length; j++) {
                sockets[groups[checkgroup][j]].emit('start', groups[checkgroup].length);
            }
            groups.splice(checkgroup, 1);
        }
    });

    client.on('swipesend', function(data){
        console.log("quad:"+data.quadrant);
        if (data.quadrant < 0 || data.quadrant >= games[client.gameid].players.length) {
            return;
        }
        var recipient = games[client.gameid].piecemap[client.playerid][data.quadrant].name;
        console.log("recipient: "+recipient);
        console.log("gameid: " + client.gameid);
        console.log(games[client.gameid].gameclients);
        var c = games[client.gameid].gameclients[recipient];
        c.emit('swiperecv', data.swipedata);
    });

    client.on('heading', function(data){
        console.log("heading received:" + data);
        console.log("number:" + data.heading);
        games[client.gameid].headings[client.playerid] = data.heading;
        games[client.gameid].headnum += 1;
        if (games[client.gameid].headnum == games[client.gameid].players.length) {
            console.log("headings all arrived, making piecemap");
            games[client.gameid].piecemap = setupPiePieces(games[client.gameid].headings);
        }
    });

    client.on('recon', function(data) {
        if (data.myid) {
            client.myid = data.myid;
            sockets[client.myid] = client;
            if (ready[client.myid] != true) {
                ready[client.myid] = false;
            }
        }   
        console.log(ready);
        var foundid = -1;
        var i = 0;
        for (i = 0; i<clients.length; i++) {
            if (clients[i].id == data.myid) {
                foundid = i;
                break;
            }
        }
        if (foundid >= 0) {
            clients[i] = {id: data.myid, see: data.see};
        } else {
            clients.push({id: data.myid, see: data.see});
        }
        console.log('1 clients:');
        console.log(clients);
        groups = genConnectedDevices(clients);
        console.log('1 groups:');
        console.log(groups);
        //update clients
        updateClientCounts();
    });

    client.on('disconnect', function() {
        var foundid = -1;
        var i = 0;
        var j = 0;
        for (i = 0; i<clients.length; i++) {
            if (clients[i].id == client.myid) {
                foundid = i;
            }
            for (j = 0; j<clients[i].see.length; j++) {
                if (clients[i].see[j] == client.myid) {
                    clients[i].see.splice(j,1);
                }
            }
        }
        if (foundid >= 0) {
            clients.splice(foundid, 1);
        }
        console.log('2 clients:');
        console.log(clients);
        groups = genConnectedDevices(clients);
        updateClientCounts();
        console.log('2 groups:');
        console.log(groups);
    });

 });

function updateClientCounts() {
    for (i=0; i<groups.length; i++) {
        for (j=0; j<groups[i].length; j++) {
            if (sockets[groups[i][j]]) {
                sockets[groups[i][j]].emit('numclients', groups[i].length);
            }
        }
    }
}

function setupPiePieces(angles) {
    //copy the array for good measure
    //go through the array
    var piePieceMap = [];
    for (var i = 0; i < angles.length; i++) {
        var me = i;
        var toSort = [];
        for (var j = 0; j < angles.length; j++) {
            if (j != me) {
                var difference = angles[j] - angles[me];
                if (difference < 0) {
                    difference += 360;
                }
                toSort.push({ name: j, value: difference});
            }
        }
        toSort.sort(custom_compare).reverse();
        var array = toSort.slice(0);
        piePieceMap.push(array);
    }
    return piePieceMap;
}

function custom_compare (a,b) {
  return a.value - b.value;
}

function genConnectedDevices(idTable) {
    var array = [];

    var explored = [];
    if (idTable.length > 0) {
        for (var i = 0; i < idTable.length; i++) {
            var connectedComponent = [];
            var idStack = [];
            var iPhone = idTable[i];
            if (explored.indexOf(iPhone.id) == -1) {
                idStack.push(iPhone.id);
                explored.push(iPhone.id);
                while (idStack.length > 0) {
                    var currentId = idStack.pop();
                    //add the current id to the connected component
                    connectedComponent.push(currentId);

                    var iPhone = findiPhone(idTable, currentId);
                    // console.log(iPhone.see[1]);
                    for (var j = 0; j < iPhone.see.length; j++) {
                        if (explored.indexOf(iPhone.see[j]) == -1) {
                            // console.log(iPhone.see[j]);
                            idStack.push(iPhone.see[j]);
                            explored.push(iPhone.see[j]);
                        }
                    }
                }
            }
            if (connectedComponent.length > 0) {
                array.push(connectedComponent);
            }
        }
    }
    return array;
}

function findiPhone(idTable, id) {
    for (var i = idTable.length - 1; i >= 0; i--) {
        if (idTable[i].id == id) {
            return idTable[i];
        }
    }
    return {id: id, see:[]};
}