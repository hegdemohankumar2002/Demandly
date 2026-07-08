import * as Sentry from '@sentry/node';
import winston from 'winston';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

// Define log level based on environment
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Configure Winston transports
const winstonLogger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    isProduction ? winston.format.json() : winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
      })
    )
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export function initLogger() {
  if (SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
      });
      winstonLogger.info('[SENTRY] Initialized successfully');
    } catch (e) {
      winstonLogger.error('[SENTRY] Failed to initialize Sentry', { error: e });
    }
  } else {
    winstonLogger.info('[SENTRY] DSN not found, running without Sentry monitoring');
  }
}

export const logger = {
  info: (msg: string, meta?: any) => {
    winstonLogger.info(msg, meta);
  },
  error: (msg: string, error?: any) => {
    // If the error object is passed, extract message and stack
    const meta = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
      
    winstonLogger.error(msg, meta);
    
    if (SENTRY_DSN) {
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(`${msg}: ${JSON.stringify(error)}`);
      }
    }
  },
  warn: (msg: string, meta?: any) => {
    winstonLogger.warn(msg, meta);
  },
  debug: (msg: string, meta?: any) => {
    winstonLogger.debug(msg, meta);
  }
};
