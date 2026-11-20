import { LogWriter, writeLog } from '../middleware/loggingMiddleware';
import type { Server as HttpServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';

export const closeRealtimeAndHttp = (server: HttpServer, io: SocketIOServer) => new Promise<void>((resolve) => {
  io.disconnectSockets(true);
  // Socket.IO closes its transports and the underlying HTTP listener. Current
  // HTTP requests can drain, while upgraded sockets cannot keep it alive.
  io.close(() => resolve());
  server.closeIdleConnections();
});

interface ShutdownDependencies {
  markDraining: () => void;
  closeServer: () => Promise<void>;
  disconnectDatabase: () => Promise<void>;
  forceClose: () => void;
  exit: (code: number) => void;
  timeoutMs?: number;
  write?: LogWriter;
}

/** One bounded drain shared by process signals, startup and fatal-error paths. */
export function createShutdown(services: ShutdownDependencies) {
  let closing: Promise<void> | undefined;
  let requestedCode = 0;
  return (reason: 'SIGTERM' | 'SIGINT' | 'startup_failure' | 'unhandled_rejection' | 'uncaught_exception', code = 0) => {
    if (code) requestedCode = 1;
    if (closing) return closing;
    const write = services.write || writeLog;
    services.markDraining();
    write({ level: code ? 'error' : 'info', event: 'shutdown_started', reason });
    closing = new Promise<void>((resolve) => {
      let finished = false;
      const finish = (exitCode: number) => {
        if (finished) return;
        finished = true;
        clearTimeout(deadline);
        write({ level: exitCode ? 'error' : 'info', event: 'shutdown_complete', exitCode });
        services.exit(exitCode);
        resolve();
      };
      const deadline = setTimeout(() => {
        try { services.forceClose(); } catch { /* Exit still enforces the deadline. */ }
        finish(1);
      }, services.timeoutMs || 10_000);
      Promise.resolve().then(() => services.closeServer()).then(() => services.disconnectDatabase())
        .then(() => finish(requestedCode)).catch(() => finish(1));
    });
    return closing;
  };
}
