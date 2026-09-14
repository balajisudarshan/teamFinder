import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (socket && socket.connected) {
    if (userId) socket.emit('join_user', userId);
    return socket;
  }

  // Use current origin with Vite proxy, or fallback to port 5000 if needed
  const socketUrl = window.location.origin;

  socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    if (userId) {
      socket.emit('join_user', userId);
    }
  });

  socket.on('disconnect', () => {
    // disconnected
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
