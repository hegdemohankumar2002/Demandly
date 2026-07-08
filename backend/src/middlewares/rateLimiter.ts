import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const globalLimiter = config.disableRateLimit
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // Limit each IP to 500 requests per 15 minutes
      message: { error: 'Too many requests from this IP, please try again later.' }
    });

export const authLimiter = config.disableRateLimit
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 15, // Limit each IP to 15 login/register attempts per 15 minutes
      message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
    });
