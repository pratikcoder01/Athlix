import dotenv from 'dotenv';
dotenv.config();

import './config/firebase';
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import connectDB from './config/db';
import { validateRuntimeConfig } from './config/runtime';
import { createRealtimeServer } from './socket';
import { createShutdown, closeRealtimeAndHttp } from './utils/lifecycle';
import { writeLog } from './middleware/loggingMiddleware';

const server = http.createServer({
  requestTimeout: 60_000,
  headersTimeout: 15_000,
  keepAliveTimeout: 5_000,
}, app);
const io = createRealtimeServer(server);
app.set('io', io);

const shutdown = createShutdown({
  markDraining: () => { app.locals.draining = true; },
  closeServer: () => closeRealtimeAndHttp(server, io),
  disconnectDatabase: () => mongoose.disconnect(),
  forceClose: () => { io.disconnectSockets(true); server.closeAllConnections(); },
  exit: (code) => process.exit(code),
});

process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
process.once('SIGINT', () => { void shutdown('SIGINT'); });
process.once('unhandledRejection', () => { void shutdown('unhandled_rejection', 1); });
process.once('uncaughtException', () => { void shutdown('uncaught_exception', 1); });

const startServer = async () => {
  const configuration = validateRuntimeConfig();
  await connectDB();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(configuration.port, () => {
      server.off('error', reject);
      resolve();
    });
  });
  writeLog({ level: 'info', event: 'server_listening', port: configuration.port });
};

void startServer().catch(() => { void shutdown('startup_failure', 1); });
