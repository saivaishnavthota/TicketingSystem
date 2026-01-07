import { auditRepository } from './audit.repository.js';
import { AuditEntry, AuditLog, AuditSearchCriteria, PaginatedResult, AuthContext } from '../../models/types.js';

export class AuditService {
  /**
   * Log an audit entry
   */
  async log(entry: AuditEntry, ipAddress?: string): Promise<void> {
    await auditRepository.log(entry, ipAddress);
  }
  
  /**
   * Search audit logs with filters
   */
  async search(criteria: AuditSearchCriteria, context: AuthContext): Promise<PaginatedResult<AuditLog>> {
    return auditRepository.search(criteria);
  }
  
  /**
   * Get audit logs for a specific record
   */
  async getByRecordId(resourceType: string, resourceId: string, context: AuthContext): Promise<AuditLog[]> {
    return auditRepository.getByRecordId(resourceType, resourceId);
  }
  
  /**
   * Helper to log data modifications
   */
  async logModification(
    userId: string,
    action: 'Create' | 'Update' | 'Delete',
    resourceType: string,
    resourceId: string,
    beforeState?: unknown,
    afterState?: unknown,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType,
      resourceId,
      beforeState,
      afterState
    }, ipAddress);
  }
  
  /**
   * Helper to log access denied events
   */
  async logAccessDenied(
    userId: string,
    resourceType: string,
    resourceId: string,
    attemptedAction: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'AccessDenied',
      resourceType,
      resourceId,
      metadata: { attemptedAction }
    }, ipAddress);
  }
}

export const auditService = new AuditService();
