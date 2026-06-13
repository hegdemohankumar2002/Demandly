import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initLogger() {
  if (SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
      });
      console.log('[SENTRY] Initialized successfully');
    } catch (e) {
      console.error('[SENTRY] Failed to initialize Sentry:', e);
    }
  } else {
    console.log('[SENTRY] DSN not found, running without Sentry monitoring');
  }
}

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
    if (SENTRY_DSN) {
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(`${msg}: ${JSON.stringify(error)}`);
      }
    }
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : '');
  }
};
