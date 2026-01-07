import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth/auth.service.js';
import { AuthContext } from '../models/types.js';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Middleware to validate JWT token and attach auth context to request
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Missing or invalid authorization header',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const authContext = authService.validateToken(token);
    req.auth = authContext;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: error instanceof Error ? error.message : 'Invalid token',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
}
