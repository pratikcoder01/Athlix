import dotenv from 'dotenv';
dotenv.config();

// Initialise Firebase Admin SDK before any routes are loaded
import './config/firebase';

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import connectDB from './config/db';


const PORT = process.env.PORT || 5000;

// Initialize Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Set to target client domains in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
});

// Store socket IO instance in Express app context
app.set('io', io);

// Socket.io connection handlers
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User joins a personal room based on their userId
  socket.on('join_user_room', (userId: string) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 User joined room: ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start Database & Web Server
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(
      `🚀 ATHLIX Backend Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
    );
  });
};

// Handle process crashes gracefully
process.on('unhandledRejection', (err: any) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: any) => {
  console.error(`💥 Uncaught Exception: ${err.message}`);
  process.exit(1);
});

startServer();
