const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.get('/', (req, res) => res.send('WebRTC signaling server'));

// Health check endpoint (for container orchestration)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bonicare-webrtc',
    timestamp: new Date().toISOString()
  });
});

io.on('connection', socket => {
  console.log('🔹 Peer connected', socket.id);
  socket.on('call:ping', () => socket.emit('call:pong'));
  socket.on('call:join', data => {
    const room = io.sockets.adapter.rooms.get(data.appointmentId);
    const peerCount = room?.size ?? 0;
    const initiator = peerCount === 0;
    socket.join(data.appointmentId);
    socket.emit('call:joined', { appointmentId: data.appointmentId, initiator, peerCount: peerCount + 1 });
    if (peerCount > 0) {
      socket.to(data.appointmentId).emit('call:peer-joined', {
        appointmentId: data.appointmentId,
        peerCount: peerCount + 1,
      });
    }
  });
  socket.on('call:offer', data => socket.to(data.appointmentId).emit('call:offer', data));
  socket.on('call:answer', data => socket.to(data.appointmentId).emit('call:answer', data));
  socket.on('call:ice-candidate', data => socket.to(data.appointmentId).emit('call:ice-candidate', data));
  socket.on('call:leave', data => {
    socket.leave(data.appointmentId);
    socket.to(data.appointmentId).emit('call:peer-left', {
      appointmentId: data.appointmentId,
    });
  });
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      socket.to(roomId).emit('call:peer-left', { appointmentId: roomId });
    }
  });
  socket.on('disconnect', () => console.log('🔻 Peer disconnected'));
});

const PORT = process.env.WEBRTC_PORT || 5002;
server.listen(PORT, () => console.log(`🚀 Signaling server listening on ${PORT}`));
