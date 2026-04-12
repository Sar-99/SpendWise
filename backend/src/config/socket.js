const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    },
    transports: ['websocket'], // только websocket для стабильности
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) return next(new Error('Invalid token'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.id} (${socket.id})`);

    socket.on('subscribe', (profileId) => {
      socket.join(`profile:${profileId}`);
      console.log(`User ${socket.user.id} subscribed to profile:${profileId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.id} (${socket.id}), reason: ${reason}`);
    });
  });

  return io;
}

function getSocket() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { initSocket, getSocket };