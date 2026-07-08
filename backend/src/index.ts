import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { globalLimiter } from './middlewares/rateLimiter';
import { config } from './config';
import routes from './routes';
import { startCronJobs } from './cron/auctionCron';
import { getRedis } from './cache/redis';
import { initLogger } from './utils/logger';
import { initFcm } from './services/pushNotificationService';
import { errorHandler } from './middlewares/errorHandler';
import { setupGracefulShutdown } from './utils/gracefulShutdown';
import { requestIdMiddleware } from './middlewares/requestId';

// Initialize Sentry / Logging
initLogger();
initFcm();

const app = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = config.allowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Request ID tracing
app.use(requestIdMiddleware);

// Rate Limiting
app.use(globalLimiter);

// Routes
app.use('/', routes);

// Centralized error handling middleware
app.use(errorHandler);

// Base route for LB healthcheck without auth
app.get('/lb-health', (req, res) => {
  const redis = getRedis();
  res.status(200).json({
    status: 'ok',
    redis: redis ? 'connected' : 'unavailable (running without cache)'
  });
});

const server = app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  // Initialize Redis connection
  getRedis();
  // Start background jobs
  startCronJobs();
});

setupGracefulShutdown(server);

