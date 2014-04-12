var io = require('socket.io').listen(42069, {log: false});
io.sockets.on('connection', function(client){

    console.log('joined');
    
    client.on('message', function(msg, err){
    	console.log(i);
    	i=i+1;
    	k = Object.keys(io.sockets.manager.roomClients[client.id]);
    	if (k[1] != undefined) {
    		chan = k[1].substring(1, k[1].length);
     	   client.broadcast.to(chan).emit('message', msg);
    	}
    });

    client.on('subscribe', function(data) { 
    	var hash = crypto.createHash('md5').update(data.room).digest('hex').substring(0, 8).toLowerCase();
        console.log('joining room', hash);
        k = Object.keys(io.sockets.manager.roomClients[client.id]);
        client.join(hash); 
    });

    client.on('channel', function(data) { 
    	console.log('joining room', data.room.toLowerCase());
        client.join(data.room); 
    });
 });
