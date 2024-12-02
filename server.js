const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: 'http://localhost:3000', // Replace with your frontend URL
        methods: ['GET', 'POST'],
    },
});
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors());

// In-memory storage for chat messages
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room
    socket.on('joinRoom', (obj) => {
        console.log(obj)
        let roomid=obj.par.roomid;
        socket.join(roomid);
        if (!rooms[roomid]) rooms[roomid] = [];
        console.log(`User ${obj.username} joined room ${roomid}`);
    });

    // Handle incoming messages
    socket.on('message', ({ obj, message }) => {
        console.log(obj);
        if (rooms[obj.par.roomid]) {
            const msg = { id: socket.id, message , username:obj.username, color:obj.color };
            rooms[obj.par.roomid].push(msg);
            io.to(obj.par.roomid).emit('message', msg); // Send the message to all users in the room
        }
    });

    // Leave a room
    socket.on('leaveRoom', (obj) => {
        socket.leave(obj.par.roomid);
        console.log(`User ${socket.id} left room ${obj.par.roomid}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Clear messages when a server closes
app.post('/closeRoom/:roomId', (req, res) => {
    const { roomId } = req.params;
    delete rooms[roomId];
    io.to(roomId).emit('roomClosed');
    console.log(`Room ${roomId} closed`);
    res.send({ message: `Room ${roomId} has been closed.` });
});

// Serve frontend (if necessary)
app.use(express.static('public'));

server.listen(3500, () => {
    console.log('Server is running on http://localhost:3500');
});
