import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from './models/User';
import { Tournament } from './models/Tournament';
import { getJwtSecret } from './config/jwt';
import { createOriginPolicy } from './config/cors';

interface SocketAccount {
  id: string;
  isActive: boolean;
}

interface RealtimeDependencies {
  getSecret: () => string;
  findAccount: (id: string) => Promise<SocketAccount | null>;
  tournamentExists: (id: string) => Promise<boolean>;
  environment: NodeJS.ProcessEnv;
}

type Acknowledge = (response: { success: boolean; message?: string }) => void;
const objectIdPattern = /^[a-f\d]{24}$/i;
const MAX_TIMER_MS = 2_147_483_647;

const dependencies: RealtimeDependencies = {
  getSecret: getJwtSecret,
  findAccount: async (id) => {
    const account = await User.findById(id).select('_id isActive').lean();
    return account ? { id: account._id.toString(), isActive: account.isActive === true } : null;
  },
  tournamentExists: async (id) => Boolean(await Tournament.exists({ _id: id })),
  environment: process.env,
};

export const createRealtimeServer = (server: HttpServer, overrides: Partial<RealtimeDependencies> = {}) => {
  const services = { ...dependencies, ...overrides };
  const originPolicy = createOriginPolicy(services.environment);
  const io = new SocketIOServer(server, {
    cors: { origin: originPolicy.origin, methods: ['GET', 'POST'] },
    // Browser CORS does not protect WebSocket upgrades; enforce the policy here too.
    allowRequest: (request, callback) => callback(null, originPolicy.isAllowed(request.headers.origin)),
    maxHttpBufferSize: 32 * 1024,
  });

  io.use(async (socket, next) => {
    try {
      const token: unknown = socket.handshake.auth?.token;
      if (typeof token !== 'string' || !token || token.length > 8192) {
        throw new Error('Invalid token');
      }
      const decoded = jwt.verify(token, services.getSecret(), { algorithms: ['HS256'] }) as JwtPayload;
      if (typeof decoded !== 'object' || typeof decoded.id !== 'string' ||
          !objectIdPattern.test(decoded.id) || typeof decoded.exp !== 'number' ||
          !Number.isFinite(decoded.exp)) {
        throw new Error('Invalid token');
      }
      const account = await services.findAccount(decoded.id);
      if (!account || !account.isActive) throw new Error('Account unavailable');
      socket.data.userId = account.id;
      socket.data.expiresAt = decoded.exp * 1000;
      next();
    } catch {
      // Do not disclose account existence, database errors, or token contents.
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId: string = socket.data.userId;
    // Existing booking/social publishers target this server-derived user ID.
    socket.join(userId);

    let expiryTimer: NodeJS.Timeout;
    const scheduleExpiry = () => {
      const remaining = socket.data.expiresAt - Date.now();
      if (remaining <= 0) return socket.disconnect(true);
      expiryTimer = setTimeout(scheduleExpiry, Math.min(remaining, MAX_TIMER_MS));
      expiryTimer.unref();
    };
    scheduleExpiry();

    const isStillActive = async (): Promise<boolean> => {
      if (Date.now() >= socket.data.expiresAt) return false;
      const account = await services.findAccount(userId);
      return Boolean(account?.isActive);
    };
    // Recheck account disabling for long-lived connections, including passive readers.
    let revalidating = false;
    const accountTimer = setInterval(async () => {
      if (revalidating) return;
      revalidating = true;
      try {
        if (!await isStillActive()) socket.disconnect(true);
      } catch {
        socket.disconnect(true);
      } finally {
        revalidating = false;
      }
    }, 30_000);
    accountTimer.unref();

    // Each authenticated account can read tournaments through the REST API. Match
    // that policy here and verify existence; private notification rooms have no
    // client-controlled join handler at all.
    let joinAttempts = 0;
    let windowStarted = Date.now();
    let pendingSubscriptions = 0;
    socket.on('join_tournament_room', async (id: unknown, acknowledge?: Acknowledge) => {
      const reply = (success: boolean, message?: string) => {
        if (typeof acknowledge === 'function') acknowledge({ success, message });
      };
      if (Date.now() - windowStarted >= 60_000) {
        windowStarted = Date.now();
        joinAttempts = 0;
      }
      if (++joinAttempts > 20 || socket.rooms.size + pendingSubscriptions >= 12) {
        return reply(false, 'Too many tournament subscriptions');
      }
      if (typeof id !== 'string' || !objectIdPattern.test(id)) {
        return reply(false, 'Invalid tournament');
      }
      // Reserve capacity before asynchronous lookups, including concurrent joins.
      pendingSubscriptions++;
      try {
        if (!await isStillActive()) {
          reply(false, 'Not authorized');
          socket.disconnect(true);
          return;
        }
        if (!await services.tournamentExists(id)) return reply(false, 'Tournament not found');
        if (!socket.connected) return;
        await socket.join(`tournament_${id}`);
        reply(true);
      } catch {
        reply(false, 'Unable to subscribe to tournament');
      } finally {
        pendingSubscriptions--;
      }
    });

    socket.on('leave_tournament_room', (id: unknown) => {
      if (typeof id === 'string' && objectIdPattern.test(id)) socket.leave(`tournament_${id}`);
    });

    socket.on('disconnect', () => {
      clearTimeout(expiryTimer);
      clearInterval(accountTimer);
    });
  });

  return io;
};
