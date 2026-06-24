import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import loggingMiddleware from './middleware/loggingMiddleware';
import rateLimitMiddleware from './middleware/rateLimitMiddleware';
import errorMiddleware from './middleware/errorMiddleware';

// Import routes
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import academyRoutes from './routes/academyRoutes';
import bookingRoutes from './routes/bookingRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import postRoutes from './routes/postRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// Security and Logging Configuration
app.use(helmet());
app.use(
  cors({
    origin: '*', // Set to target client domains in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(loggingMiddleware);
app.use('/api/', rateLimitMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Mappings
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/academies', academyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'ATHLIX API is running smoothly',
  });
});

// Fallback 404 handler
app.use('*', (req, res, next) => {
  const error: any = new Error(`Endpoint ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Central Error Handler Middleware
app.use(errorMiddleware);

export default app;
