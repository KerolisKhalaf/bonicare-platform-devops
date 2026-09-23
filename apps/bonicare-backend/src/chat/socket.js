import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { saveMessage, updateMessageStatus } from '../services/messageService.js';
import { sendNotification } from '../notification/notificationService.js';

export const initSocket = async (server) => {
  const io = new Server(server, { cors: { origin: '*' } });
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    socket.on('sendMessage', async (data) => {
      try {
        const message = await saveMessage(data);
        io.to(data.conversationId).emit('newMessage', message);
        if (data.receiverId) {
          void sendNotification(data.receiverId, 'chat_message', 'push', data.content)
            .catch((err) => console.error('Chat notification failed:', err.message));
        }
      } catch (err) {
        socket.emit('error', 'Message could not be saved.');
      }
    });

    socket.on('joinConversation', (id) => socket.join(id));
  });


  // For debugging: log all events
io.on("connection", (socket) => {
  console.log("✅ CONNECTED:", socket.id);

  socket.onAny((event, data) => {
    console.log("📩 EVENT:", event, data);
  });
});

  return io;
};

