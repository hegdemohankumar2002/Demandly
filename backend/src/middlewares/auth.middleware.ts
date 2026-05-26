import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    res.status(401).json({ error: 'Access denied. No API key provided.' });
    return;
  }

  if (apiKey !== config.masterApiKey) {
    res.status(403).json({ error: 'Invalid API key.' });
    return;
  }

  next();
};
