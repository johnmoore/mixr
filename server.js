var io = require('socket.io').listen(42069, {log: true});

var clients = [];
var groups = [];
var sockets = {};
var status = {};
var games = {};
var fbdata = {};


io.sockets.on('connection', function(client){

    console.log('joined');
    client.myid = -1;

    client.on('ready', function(data){
        console.log("ready from " + client.myid);
        status[client.myid].ready = true;
        fbdata[client.myid] = data.fbdata;
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
        console.log(status);
        var pass = true;
        for (i=0; i<groups[checkgroup].length; i++) {
            if (status[groups[checkgroup][i]] == undefined || status[groups[checkgroup][i]].ready == false) {
                pass = false;
                console.log("pass false");
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
            games[groups[checkgroup][0]] = {players: groups[checkgroup], headings: head, headnum: 0, piecemap: null, gameclients: gc, pool: null, allids: null};
            console.log("Started game. Games:");
            console.log(games);
            console.log("Groups:");
            console.log(groups);
            for (j=0; j<groups[checkgroup].length; j++) {
                sockets[groups[checkgroup][j]].emit('start', groups[checkgroup].length);
            }
            var totaldata = [];
            for (i=0; i<groups[checkgroup].length; i++) {
                console.log("fb data:"+fbdata[groups[checkgroup][i]]);
                totaldata.push(fbdata[groups[checkgroup][i]]);
            }
            console.log("totaldata here: " + totaldata);
            postToPHP(totaldata, groups[checkgroup][0]);
            groups.splice(checkgroup, 1);
        }
    });

    // client.on('swipesend', function(data){
    //     console.log("quad:"+data.quadrant);
    //     if (data.quadrant < 0 || data.quadrant >= games[client.gameid].players.length) {
    //         return;
    //     }
    //     if (games[client.gameid].piecemap == null) {
    //         return;
    //     }
    //     var recipient = games[client.gameid].piecemap[client.playerid][data.quadrant].name;
    //     console.log("recipient: "+recipient);
    //     console.log("gameid: " + client.gameid);
    //     console.log(games[client.gameid].gameclients);
    //     var c = games[client.gameid].gameclients[recipient];
    //     c.emit('swiperecv', data.swipedata);
    // });

    client.on('liked', function(data){
        delete pool[data.id];
        var gameOver = checkIfGameOver();
        if (gameOver) {
            //TODO
            return;
        }
    });

    client.on('sendPerson', function(data){
        console.log("quad:"+data.quadrant);
        if (data.quadrant < 0 || data.quadrant >= games[client.gameid].players.length) {
            return;
        }
        if (games[client.gameid].piecemap == null) {
            return;
        }
        var recipient = games[client.gameid].piecemap[client.playerid][data.quadrant].name;
        console.log("recipient: "+recipient);
        console.log("gameid: " + client.gameid);
        console.log(games[client.gameid].gameclients);

        if (pool[data.id][1].indexOf(recipient) != -1) {
            delete pool[data.id];
            var gameOver = checkIfGameOver();
            if (gameOver) {
                //TODO
                return;
            }
        }
        else {
            if (pool[data.id][0] != recipient) {
                pool[data.id][1].push(recipient);
            }
        }

        var c = games[client.gameid].gameclients[recipient];
        c.emit('swiperecv', data.swipedata);
    });

    client.on('heading', function(data){
        console.log("heading received:" + data);
        console.log("number:" + data.heading);
        games[client.gameid].headings[client.playerid] = data.heading;
        games[client.gameid].headnum += 1;
        status[client.myid].heading = true;
        if (games[client.gameid].headnum == games[client.gameid].players.length) {
            console.log("headings all arrived, making piecemap");
            games[client.gameid].piecemap = setupPiePieces(games[client.gameid].headings);
        }
        checkIfStart(client.gameid);
    });

    client.on('loaded', function(data){
        console.log("loaded received:" + data);
        status[client.myid].loaded = true;
        checkIfStart(client.gameid);
    });

    client.on('recon', function(data) {
        if (data.myid) {
            client.myid = data.myid;
            sockets[client.myid] = client;
            if (status[client.myid] == undefined || status[client.myid] == null) {
                status[client.myid] = {};
                status[client.myid].ready = false;
                status[client.myid].heading = false;
                status[client.myid].loaded = false;
            } else if (status[client.myid].ready != true) {
                status[client.myid].ready = false;
                status[client.myid].heading = false;
                status[client.myid].loaded = false;
            }
        }   
        console.log(status);
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

function checkIfGameOver() {
    var size = Object.size(pool);
    if (size <= 0) {
        return true;
    }
    return false;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

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

function checkIfStart(gameid) {
    var i = 0;
    cont = true;
    for (i=0; i<games[gameid].players.length; i++) {
        if (status[games[gameid].players[i]].loaded == false || status[games[gameid].players[i]].heading == false) {
            cont = false;
        }
    }
    if (cont) {
        var i = 0;
        for (i=0; i<games[gameid].players.length; i++) {
            sockets[games[gameid].players[i]].emit('play', true);
        }
    }
}

function responseFromPHP(responseString) {
    console.log(responseString);
    var resultObject = JSON.parse(responseString);
    console.log(responseString);
    //instantiate the group friend pool
    var pool = {};
    var gameid = -1;
    allids = [];
    for (var user in resultObject) {
        if (user == "gameid") {
            gameid = resultObject[user];
            continue;
        }
        if (typeof resultObject[user] !== 'function') {
            console.log("Key is " + user + ", value is" + resultObject[user]);
            for (var i = resultObject[user].length - 1; i >= 0; i--) {
                pool[resultObject[user][i]] = [user,[]];
            }
            allids = allids.concat(resultObject[user]);
        }
    }
    if (gameid < 0) {
        return;
    }
    games[gameid].allids = allids;
    games[gameid].pool = pool;
    //TODO emit appropriate data to each iphone (10 close friends, all friends)
    var i = 0;
    for (i=0; i<games[gameid].players.length; i++) {
        sockets[games[gameid].players[i]].emit('ids', {all: allids, mine: resultObject[fbdata[games[gameid].players[i]].id]});
    }
}

function postToPHP(jsonstr, gid) {
var http = require('http');

jsonstr = {persons: jsonstr, gameid: gid};
var userString = JSON.stringify(jsonstr);
console.log(userString);
var headers = {
  'Content-Type': 'application/json',
  'Content-Length': userString.length
};

var options = {
  host: 'www.lukesorenson.info',
  port: 80,
  path: '/mixr/facebookParse.php',
  method: 'POST',
  headers: headers
};

// Setup the request.  The options parameter is
// the object we defined above.
var req = http.request(options, function(res) {
  res.setEncoding('utf-8');

  var responseString = '';

  res.on('data', function(data) {
    responseString += data;
  });

  res.on('end', function() {
    responseFromPHP(responseString);
  });
});

req.on('error', function(e) {
  // TODO: handle error.
});

req.write(userString);
req.end();
}