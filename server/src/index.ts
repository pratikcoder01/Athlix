import dotenv from 'dotenv';
dotenv.config();

// Initialise Firebase Admin SDK before any routes are loaded
import './config/firebase';

import http from 'http';
import app from './app';
import connectDB from './config/db';
import { createRealtimeServer } from './socket';


const PORT = process.env.PORT || 5000;

// Initialize Server
const server = http.createServer(app);

// Initialize Socket.io
const io = createRealtimeServer(server);

// Store socket IO instance in Express app context
app.set('io', io);

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
