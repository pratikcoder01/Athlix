const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Security and Logging Configurations
app.use(helmet());
app.use(cors({
  origin: '*', // Set to target client domains in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(loggingMiddleware);
app.use('/api/', rateLimitMiddleware); // Rate limiter guarding endpoints

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mapping Routing Endpoints
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/gyms', require('./routes/gymRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/tournaments', require('./routes/tournamentRoutes'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', message: 'DojoPro API is running smoothly' });
});

// Fallback 404 handler
app.use('*', (req, res, next) => {
  const error = new Error(`Endpoint ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Central Error Handler Middleware
app.use(errorMiddleware);

module.exports = app;
