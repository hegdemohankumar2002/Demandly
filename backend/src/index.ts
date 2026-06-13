import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import { startCronJobs } from './cron/auctionCron';
import { getRedis } from './cache/redis';
import { initLogger } from './utils/logger';
import { initFcm } from './services/pushNotificationService';

// Initialize Sentry / Logging
initLogger();
initFcm();

const app = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

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

app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Routes
app.use('/api', routes);

// Base route for LB healthcheck without auth
app.get('/lb-health', (req, res) => {
  const redis = getRedis();
  res.status(200).json({
    status: 'ok',
    redis: redis ? 'connected' : 'unavailable (running without cache)'
  });
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  // Initialize Redis connection
  getRedis();
  // Start background jobs
  startCronJobs();
});

