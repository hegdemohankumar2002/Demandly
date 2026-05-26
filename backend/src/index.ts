import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import { startCronJobs } from './cron/auctionCron';
import { getRedis } from './cache/redis';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors()); // Configure this to limit origins in production
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

