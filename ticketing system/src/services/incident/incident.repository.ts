import { query, getClient, transaction } from '../../db/connection.js';
import { 
  Incident, 
  CreateIncidentDTO, 
  UpdateIncidentDTO, 
  IncidentSearchCriteria, 
  PaginatedResult,
  StatusTransition,
  IncidentStatus
} from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class IncidentRepository {
  /**
   * Create a new incident
   */
  async create(data: CreateIncidentDTO, reporter: string): Promise<Incident> {
    return transaction(async (client) => {
      const incidentId = uuidv4();
      const incidentNumber = await this.generateIncidentNumber();
      
      const result = await client.query(
        `INSERT INTO incidents 
         (id, number, title, description, status, priority, category, assignee, reporter, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          incidentId,
          incidentNumber,
          data.title,
          data.description,
          'New',
          data.priority,
          data.category,
          data.assignee || null,
          reporter
        ]
      );
      
      // Record initial status transition
      await client.query(
        `INSERT INTO incident_history (id, incident_id, from_status, to_status, timestamp, user_id)
         VALUES ($1, $2, NULL, $3, NOW(), $4)`,
        [uuidv4(), incidentId, 'New', reporter]
      );
      
      // Link affected CIs if provided
      if (data.affectedCIs && data.affectedCIs.length > 0) {
        for (const ciId of data.affectedCIs) {
          await client.query(
            'INSERT INTO incident_cis (incident_id, ci_id) VALUES ($1, $2)',
            [incidentId, ciId]
          );
        }
      }
      
      return this.mapRowToIncident(result.rows[0], [], data.affectedCIs || []);
    });
  }
  
  /**
   * Get incident by ID
   */
  async getById(id: string): Promise<Incident | null> {
    const result = await query('SELECT * FROM incidents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const history = await this.getIncidentHistory(id);
    const affectedCIs = await this.getAffectedCIs(id);
    
    return this.mapRowToIncident(result.rows[0], history, affectedCIs);
  }
  
  /**
   * Update incident
   */
  async update(id: string, data: UpdateIncidentDTO): Promise<Incident> {
    return transaction(async (client) => {
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
      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }
      if (data.assignee !== undefined) {
        updates.push(`assignee = $${paramIndex++}`);
        values.push(data.assignee);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
      await client.query(
        `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
      
      // Update affected CIs if provided
      if (data.affectedCIs !== undefined) {
        await client.query('DELETE FROM incident_cis WHERE incident_id = $1', [id]);
        for (const ciId of data.affectedCIs) {
          await client.query(
            'INSERT INTO incident_cis (incident_id, ci_id) VALUES ($1, $2)',
            [id, ciId]
          );
        }
      }
      
      const incident = await this.getById(id);
      if (!incident) {
        throw new Error('Incident not found after update');
      }
      return incident;
    });
  }
  
  /**
   * Transition incident status
   */
  async transition(id: string, newStatus: IncidentStatus, userId: string, comment?: string): Promise<Incident> {
    return transaction(async (client) => {
      // Get current status
      const currentResult = await client.query(
        'SELECT status FROM incidents WHERE id = $1',
        [id]
      );
      
      if (currentResult.rows.length === 0) {
        throw new Error('Incident not found');
      }
      
      const currentStatus = currentResult.rows[0].status;
      
      // Update status
      const updateQuery = newStatus === 'Resolved' || newStatus === 'Closed'
        ? 'UPDATE incidents SET status = $1, resolved_at = NOW(), updated_at = NOW() WHERE id = $2'
        : 'UPDATE incidents SET status = $1, updated_at = NOW() WHERE id = $2';
      
      await client.query(updateQuery, [newStatus, id]);
      
      // Record transition in history
      await client.query(
        `INSERT INTO incident_history (id, incident_id, from_status, to_status, timestamp, user_id, comment)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
        [uuidv4(), id, currentStatus, newStatus, userId, comment || null]
      );
      
      const incident = await this.getById(id);
      if (!incident) {
        throw new Error('Incident not found after transition');
      }
      return incident;
    });
  }
  
  /**
   * Link incident to problem
   */
  async linkToProblem(incidentId: string, problemId: string): Promise<void> {
    await transaction(async (client) => {
      await client.query(
        'UPDATE incidents SET linked_problem_id = $1, updated_at = NOW() WHERE id = $2',
        [problemId, incidentId]
      );
      
      await client.query(
        'INSERT INTO problem_incidents (problem_id, incident_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [problemId, incidentId]
      );
    });
  }
  
  /**
   * Search incidents with filters
   */
  async search(criteria: IncidentSearchCriteria): Promise<PaginatedResult<Incident>> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (criteria.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(criteria.status);
    }
    
    if (criteria.priority) {
      conditions.push(`priority = $${paramIndex++}`);
      values.push(criteria.priority);
    }
    
    if (criteria.assignee) {
      conditions.push(`assignee = $${paramIndex++}`);
      values.push(criteria.assignee);
    }
    
    if (criteria.category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(criteria.category);
    }
    
    if (criteria.dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(criteria.dateFrom);
    }
    
    if (criteria.dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(criteria.dateTo);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM incidents ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results
    const page = criteria.page || 1;
    const pageSize = criteria.pageSize || 50;
    const offset = (page - 1) * pageSize;
    
    values.push(pageSize, offset);
    const dataResult = await query(
      `SELECT * FROM incidents ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );
    
    const data: Incident[] = [];
    for (const row of dataResult.rows) {
      const history = await this.getIncidentHistory(row.id);
      const affectedCIs = await this.getAffectedCIs(row.id);
      data.push(this.mapRowToIncident(row, history, affectedCIs));
    }
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
  
  private async getIncidentHistory(incidentId: string): Promise<StatusTransition[]> {
    const result = await query(
      `SELECT * FROM incident_history WHERE incident_id = $1 ORDER BY timestamp ASC`,
      [incidentId]
    );
    
    return result.rows.map(row => ({
      fromStatus: row.from_status,
      toStatus: row.to_status,
      timestamp: row.timestamp,
      userId: row.user_id,
      comment: row.comment
    }));
  }
  
  private async getAffectedCIs(incidentId: string): Promise<string[]> {
    const result = await query(
      'SELECT ci_id FROM incident_cis WHERE incident_id = $1',
      [incidentId]
    );
    
    return result.rows.map(row => row.ci_id);
  }
  
  private mapRowToIncident(row: any, history: StatusTransition[], affectedCIs: string[]): Incident {
    return {
      id: row.id,
      number: row.number,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      category: row.category,
      assignee: row.assignee,
      reporter: row.reporter,
      affectedCIs,
      linkedProblemId: row.linked_problem_id,
      history,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    };
  }
  
  private async generateIncidentNumber(): Promise<string> {
    const result = await query(
      'SELECT COUNT(*) as count FROM incidents'
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `INC${count.toString().padStart(7, '0')}`;
  }
}

export const incidentRepository = new IncidentRepository();
