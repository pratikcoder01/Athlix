require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = async () => {
  // Config db import internally to prevent load sequence errors
  const db = require('./config/db');
  await db();
};

const PORT = process.env.PORT || 5000;

// Initialize Server
const server = http.createServer(app);

// Start Database & Web Server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`🚀 DojoPro Backend Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

// Handle process crashes gracefully
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`💥 Uncaught Exception: ${err.message}`);
  process.exit(1);
});

startServer();
