import { query, getClient, transaction } from '../../db/connection.js';
import {
  Change,
  CreateChangeDTO,
  UpdateChangeDTO,
  ChangeSchedule,
  ApprovalRecord,
  ImplementationResult,
  ApprovalDecision
} from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class ChangeRepository {
  async create(data: CreateChangeDTO, requester: string): Promise<Change> {
    return transaction(async (client) => {
      const changeId = uuidv4();
      const changeNumber = await this.generateChangeNumber();
      
      const result = await client.query(
        `INSERT INTO changes 
         (id, number, title, description, type, status, risk_level, priority, requester, assignee, rollback_plan, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          changeId,
          changeNumber,
          data.title,
          data.description,
          data.type,
          'Draft',
          data.riskLevel,
          data.priority,
          requester,
          data.assignee || null,
          data.rollbackPlan
        ]
      );
      
      if (data.affectedCIs && data.affectedCIs.length > 0) {
        for (const ciId of data.affectedCIs) {
          await client.query(
            'INSERT INTO change_cis (change_id, ci_id) VALUES ($1, $2)',
            [changeId, ciId]
          );
        }
      }
      
      return this.mapRowToChange(result.rows[0], [], data.affectedCIs || []);
    });
  }
  
  async getById(id: string): Promise<Change | null> {
    const result = await query('SELECT * FROM changes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const approvals = await this.getApprovals(id);
    const affectedCIs = await this.getAffectedCIs(id);
    
    return this.mapRowToChange(result.rows[0], approvals, affectedCIs);
  }
  
  async update(id: string, data: UpdateChangeDTO): Promise<Change> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    if (data.assignee !== undefined) {
      updates.push(`assignee = $${paramIndex++}`);
      values.push(data.assignee);
    }
    if (data.rollbackPlan !== undefined) {
      updates.push(`rollback_plan = $${paramIndex++}`);
      values.push(data.rollbackPlan);
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    await query(
      `UPDATE changes SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    const change = await this.getById(id);
    if (!change) {
      throw new Error('Change not found after update');
    }
    return change;
  }
  
  async submitForApproval(id: string): Promise<Change> {
    await query(
      'UPDATE changes SET status = $1, updated_at = NOW() WHERE id = $2',
      ['Submitted', id]
    );
    
    const change = await this.getById(id);
    if (!change) {
      throw new Error('Change not found');
    }
    return change;
  }
  
  async approve(id: string, decision: ApprovalDecision, approverId: string): Promise<Change> {
    return transaction(async (client) => {
      await client.query(
        `INSERT INTO approval_records (id, change_id, approver_id, decision, timestamp, comments)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [uuidv4(), id, approverId, decision.decision, decision.comments || null]
      );
      
      const newStatus = decision.decision === 'Approved' ? 'Approved' : 'Rejected';
      await client.query(
        'UPDATE changes SET status = $1, updated_at = NOW() WHERE id = $2',
        [newStatus, id]
      );
      
      const change = await this.getById(id);
      if (!change) {
        throw new Error('Change not found');
      }
      return change;
    });
  }
  
  async schedule(id: string, schedule: ChangeSchedule): Promise<Change> {
    await query(
      'UPDATE changes SET schedule = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [JSON.stringify(schedule), 'Scheduled', id]
    );
    
    const change = await this.getById(id);
    if (!change) {
      throw new Error('Change not found');
    }
    return change;
  }
  
  async recordImplementation(id: string, result: ImplementationResult): Promise<Change> {
    const status = result.outcome === 'Successful' ? 'Completed' : 'Failed';
    
    await query(
      'UPDATE changes SET implementation = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [JSON.stringify(result), status, id]
    );
    
    const change = await this.getById(id);
    if (!change) {
      throw new Error('Change not found');
    }
    return change;
  }
  
  async checkScheduleConflicts(schedule: ChangeSchedule): Promise<Change[]> {
    const result = await query(
      `SELECT * FROM changes 
       WHERE status = 'Scheduled' 
       AND schedule IS NOT NULL
       AND (
         (schedule->>'plannedStart')::timestamp <= $1 AND (schedule->>'plannedEnd')::timestamp >= $2
         OR (schedule->>'plannedStart')::timestamp <= $3 AND (schedule->>'plannedEnd')::timestamp >= $4
         OR (schedule->>'plannedStart')::timestamp >= $2 AND (schedule->>'plannedEnd')::timestamp <= $3
       )`,
      [schedule.plannedEnd, schedule.plannedStart, schedule.plannedEnd, schedule.plannedStart]
    );
    
    const changes: Change[] = [];
    for (const row of result.rows) {
      const approvals = await this.getApprovals(row.id);
      const affectedCIs = await this.getAffectedCIs(row.id);
      changes.push(this.mapRowToChange(row, approvals, affectedCIs));
    }
    
    return changes;
  }
  
  private async getApprovals(changeId: string): Promise<ApprovalRecord[]> {
    const result = await query(
      'SELECT * FROM approval_records WHERE change_id = $1 ORDER BY timestamp DESC',
      [changeId]
    );
    
    return result.rows.map(row => ({
      approverId: row.approver_id,
      decision: row.decision,
      timestamp: row.timestamp,
      comments: row.comments
    }));
  }
  
  private async getAffectedCIs(changeId: string): Promise<string[]> {
    const result = await query(
      'SELECT ci_id FROM change_cis WHERE change_id = $1',
      [changeId]
    );
    
    return result.rows.map(row => row.ci_id);
  }
  
  private mapRowToChange(row: any, approvals: ApprovalRecord[], affectedCIs: string[]): Change {
    return {
      id: row.id,
      number: row.number,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      riskLevel: row.risk_level,
      priority: row.priority,
      requester: row.requester,
      assignee: row.assignee,
      affectedCIs,
      approvals,
      schedule: row.schedule,
      implementation: row.implementation,
      rollbackPlan: row.rollback_plan,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  
  private async generateChangeNumber(): Promise<string> {
    const result = await query('SELECT COUNT(*) as count FROM changes');
    const count = parseInt(result.rows[0].count) + 1;
    return `CHG${count.toString().padStart(7, '0')}`;
  }
}

export const changeRepository = new ChangeRepository();
