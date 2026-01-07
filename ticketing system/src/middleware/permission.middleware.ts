import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac/rbac.service.js';
import { auditService } from '../services/audit/audit.service.js';

/**
 * Middleware factory to check if user has required permission
 */
export function requirePermission(permission: string, resource?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }
    
    try {
      const hasPermission = await rbacService.checkPermission(
        req.auth.userId,
        permission,
        resource
      );
      
      if (!hasPermission) {
        // Log access denied event
        const resourceId = req.params.id || 'unknown';
        await auditService.logAccessDenied(
          req.auth.userId,
          resource || 'unknown',
          resourceId,
          permission,
          req.ip
        );
        
        res.status(403).json({
          error: {
            code: 'PERMISSION_DENIED',
            message: `Permission '${permission}' required for resource '${resource || 'any'}'`,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error checking permissions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  };
}
