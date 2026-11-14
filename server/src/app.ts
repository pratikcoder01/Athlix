import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import loggingMiddleware from './middleware/loggingMiddleware';
import rateLimitMiddleware, { authLimiter } from './middleware/rateLimitMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import { createOriginPolicy } from './config/cors';
import { createHealthRoutes } from './routes/healthRoutes';

// Import routes
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import academyRoutes from './routes/academyRoutes';
import bookingRoutes from './routes/bookingRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import postRoutes from './routes/postRoutes';
import aiRoutes from './routes/aiRoutes';
import cvRoutes from './routes/cvRoutes';

const app = express();
const proxyHops = process.env.TRUST_PROXY_HOPS || '0';
if (!/^[0-3]$/.test(proxyHops)) throw new Error('Invalid TRUST_PROXY_HOPS configuration');
app.set('trust proxy', Number(proxyHops));
app.disable('x-powered-by');

// Security and Logging Configuration
app.use(loggingMiddleware);
app.use(helmet());

const originPolicy = createOriginPolicy();

app.use(
  cors({
    origin: originPolicy.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-ID'],
  })
);
app.use('/api', createHealthRoutes());
app.use('/api/', rateLimitMiddleware);
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/firebase'], authLimiter);

app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: false, limit: '128kb', parameterLimit: 100 }));

// Routing Mappings
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/academies', academyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cv', cvRoutes);

// Fallback 404 handler
app.use('*', (req, res, next) => {
  const error = Object.assign(new Error('Endpoint not found'), { statusCode: 404 });
  error.statusCode = 404;
  next(error);
});

// Central Error Handler Middleware
app.use(errorMiddleware);

export default app;
