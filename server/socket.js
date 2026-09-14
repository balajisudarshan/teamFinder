const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    // User joins their personal room based on user ID
    socket.on('join_user', (userId) => {
      if (userId) {
        const room = `user:${userId.toString()}`;
        socket.join(room);
        socket.userId = userId;
      }
    });

    socket.on('disconnect', () => {
      // Clean up on disconnect
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('Socket.IO has not been initialized yet.');
  }
  return io;
};

const emitToUser = (userId, eventName, payload) => {
  if (!io || !userId) return false;
  try {
    const room = `user:${userId.toString()}`;
    io.to(room).emit(eventName, payload);
    return true;
  } catch (err) {
    console.error(`Failed to emit ${eventName} to user ${userId}:`, err);
    return false;
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
