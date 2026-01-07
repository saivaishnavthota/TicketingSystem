import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 100;

/**
 * Rate limiting middleware
 * Returns 429 with retry-after header when limit exceeded
 */
export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || 'unknown';
  const now = Date.now();
  
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
    next();
    return;
  }
  
  store[key].count++;
  
  if (store[key].count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    
    res.status(429)
      .header('Retry-After', retryAfter.toString())
      .json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
          details: {
            retryAfter: retryAfter
          }
        }
      });
    return;
  }
  
  next();
}
