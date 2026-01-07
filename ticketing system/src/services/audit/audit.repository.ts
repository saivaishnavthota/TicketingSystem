import { query } from '../../db/connection.js';
import { AuditLog, AuditEntry, AuditSearchCriteria, PaginatedResult } from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class AuditRepository {
  /**
   * Create an immutable audit log entry
   */
  async log(entry: AuditEntry, ipAddress?: string): Promise<AuditLog> {
    const auditId = uuidv4();
    
    const result = await query(
      `INSERT INTO audit_logs 
       (id, timestamp, user_id, action, resource_type, resource_id, before_state, after_state, metadata, ip_address)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        auditId,
        entry.userId,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.beforeState ? JSON.stringify(entry.beforeState) : null,
        entry.afterState ? JSON.stringify(entry.afterState) : null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress || null
      ]
    );
    
    return this.mapRowToAuditLog(result.rows[0]);
  }
  
  /**
   * Search audit logs with filters and pagination
   */
  async search(criteria: AuditSearchCriteria): Promise<PaginatedResult<AuditLog>> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (criteria.dateFrom) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(criteria.dateFrom);
    }
    
    if (criteria.dateTo) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(criteria.dateTo);
    }
    
    if (criteria.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(criteria.userId);
    }
    
    if (criteria.action) {
      conditions.push(`action = $${paramIndex++}`);
      values.push(criteria.action);
    }
    
    if (criteria.resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      values.push(criteria.resourceType);
    }
    
    if (criteria.resourceId) {
      conditions.push(`resource_id = $${paramIndex++}`);
      values.push(criteria.resourceId);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results
    const page = criteria.page || 1;
    const pageSize = criteria.pageSize || 50;
    const offset = (page - 1) * pageSize;
    
    values.push(pageSize, offset);
    const dataResult = await query(
      `SELECT * FROM audit_logs ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );
    
    const data = dataResult.rows.map(row => this.mapRowToAuditLog(row));
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
  
  /**
   * Get audit logs for a specific record
   */
  async getByRecordId(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    const result = await query(
      `SELECT * FROM audit_logs
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY timestamp DESC`,
      [resourceType, resourceId]
    );
    
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }
  
  private mapRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      beforeState: row.before_state,
      afterState: row.after_state,
      metadata: row.metadata,
      ipAddress: row.ip_address
    };
  }
}

export const auditRepository = new AuditRepository();
