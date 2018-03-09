const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const requestIp = require('request-ip');
const redis = require("redis");
const client = redis.createClient();
require("colors");

var connected = [];
var room = '';

function consoleLog(event, method, msg = undefined) {
    console.log(event.red + '.' + method.yellow + (msg !== undefined ? (' => ' + msg) : ''));
}

function removeUser(connected, username){
    var index = connected.indexOf(username);
    if (index !== -1) {
        connected.splice(index, 1);
    }
    return connected;
}

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile(__dirname + '/rooms.html'));

app.get('/:room', function (req, res) {
    room = req.params.room;
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    consoleLog('socket', 'connection', 'Un utilisateur vient de de connecter dans le salon ' + room);

    socket.on('chat.join', (data) => {
        const json = JSON.parse(data);

        // 1. Save username
        socket.room = room;
        socket.username = json.username;
        socket.ip = requestIp.getClientIp(socket.request);
        consoleLog('socket', 'chat.join', socket.username + ' vient de rejoindre le chat.');

        client.lpush('users', JSON.stringify({'username': socket.username, "ip": socket.ip}), (err, res) => {
            consoleLog('redis','lpush' , res);
        });

        // 2. Update users list
        connected.push(socket.username);
        socket.broadcast.emit( 'chat.join', JSON.stringify(connected) );
        socket.emit('chat.join', JSON.stringify(connected));


        // 3. Get the 10 last messages
        client.lrange('messages', 0, 50, (err, res) => {
            //consoleLog('redis','lrange' , res);
            for (let data of res.reverse()) {
                socket.emit('chat.message', data);
            }
        });

        // 4. Set the client room
        socket.emit('chat.room', socket.room);

    });

    socket.on('chat.message', (message) => {
        consoleLog('socket','chat.message' , socket.username + ' : ' + message);

        // Write message in Redis
        client.lpush('messages', JSON.stringify({'username': socket.username, "message": message, "room": socket.room}), (err, res) => {
            consoleLog('redis','lpush' , res);
        });
        // Broadcast the message
        io.emit('chat.message', JSON.stringify({'username': socket.username, "message": message, "room": socket.room}));
        //socket.emit('chat.message', JSON.stringify({'username': socket.username, "message": message, "room": socket.room}));
    });

    // A user is typing
    socket.on('chat.typing', function(){
        //consoleLog('socket', 'chat.typing', socket.username);
        socket.broadcast.emit('chat.typing', socket.username);
    });

    socket.on('disconnect', function(){
        consoleLog('socket', 'disconnect');
        connected = removeUser(connected, socket.username);
        //socket.broadcast.emit('chat.leave', JSON.stringify({'username': socket.username}));
        socket.broadcast.emit('chat.leave', JSON.stringify(connected));
    });
});
// KEYS user:*

http.listen(3000, () => console.log('Example app listening on port 3000!'.green));