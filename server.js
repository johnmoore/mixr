var io = require('socket.io').listen(42069, {log: true});

var clients = [];
var groups = [];
var sockets = {};
var piePieceMap = [];


io.sockets.on('connection', function(client){

    console.log('joined');
    client.myid = -1;
    
    client.on('message', function(msg, err){
        /*console.log(i);
        i=i+1;
        k = Object.keys(io.sockets.manager.roomClients[client.id]);
        if (k[1] != undefined) {
            chan = k[1].substring(1, k[1].length);
           client.broadcast.to(chan).emit('message', msg);
        }*/
    });

    client.on('recon', function(data) {
        if (data.myid) {
            client.myid = data.myid;
            sockets[client.myid] = client;
        }
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

    client.on('subscribe', function(data) { 
        client.join(data.room); 
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