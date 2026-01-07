import { query, getClient, transaction } from '../../db/connection.js';
import {
  Problem,
  CreateProblemDTO,
  UpdateProblemDTO,
  RootCauseAnalysis,
  KnownError,
  KnownErrorDTO
} from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class ProblemRepository {
  /**
   * Create a new problem
   */
  async create(data: CreateProblemDTO, createdBy: string): Promise<Problem> {
    return transaction(async (client) => {
      const problemId = uuidv4();
      const problemNumber = await this.generateProblemNumber();
      
      const result = await client.query(
        `INSERT INTO problems 
         (id, number, title, description, status, priority, category, assignee, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          problemId,
          problemNumber,
          data.title,
          data.description,
          'New',
          data.priority,
          data.category,
          data.assignee || null
        ]
      );
      
      // Link incidents if provided
      if (data.linkedIncidentIds && data.linkedIncidentIds.length > 0) {
        for (const incidentId of data.linkedIncidentIds) {
          await client.query(
            'INSERT INTO problem_incidents (problem_id, incident_id) VALUES ($1, $2)',
            [problemId, incidentId]
          );
          
          // Update incident to reference problem
          await client.query(
            'UPDATE incidents SET linked_problem_id = $1, updated_at = NOW() WHERE id = $2',
            [problemId, incidentId]
          );
        }
      }
      
      return this.mapRowToProblem(result.rows[0], data.linkedIncidentIds || []);
    });
  }
  
  /**
   * Get problem by ID
   */
  async getById(id: string): Promise<Problem | null> {
    const result = await query('SELECT * FROM problems WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const linkedIncidentIds = await this.getLinkedIncidentIds(id);
    
    return this.mapRowToProblem(result.rows[0], linkedIncidentIds);
  }
  
  /**
   * Update problem
   */
  async update(id: string, data: UpdateProblemDTO): Promise<Problem> {
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
    
    await query(
      `UPDATE problems SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    const problem = await this.getById(id);
    if (!problem) {
      throw new Error('Problem not found after update');
    }
    return problem;
  }
  
  /**
   * Record root cause analysis
   */
  async recordRootCause(id: string, rootCause: RootCauseAnalysis): Promise<Problem> {
    await query(
      'UPDATE problems SET root_cause = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(rootCause), id]
    );
    
    const problem = await this.getById(id);
    if (!problem) {
      throw new Error('Problem not found after recording root cause');
    }
    return problem;
  }
  
  /**
   * Create known error
   */
  async createKnownError(problemId: string, data: KnownErrorDTO): Promise<KnownError> {
    return transaction(async (client) => {
      const knownErrorId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO known_errors 
         (id, problem_id, title, description, workaround, permanent_fix, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          knownErrorId,
          problemId,
          data.title,
          data.description,
          data.workaround,
          data.permanentFix || null
        ]
      );
      
      // Update problem to reference known error
      await client.query(
        'UPDATE problems SET known_error_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [knownErrorId, 'KnownError', problemId]
      );
      
      return {
        id: result.rows[0].id,
        problemId: result.rows[0].problem_id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        workaround: result.rows[0].workaround,
        permanentFix: result.rows[0].permanent_fix,
        createdAt: result.rows[0].created_at
      };
    });
  }
  
  /**
   * Resolve problem and update linked incidents
   */
  async resolve(id: string, resolutionNotes: string): Promise<Problem> {
    return transaction(async (client) => {
      await client.query(
        'UPDATE problems SET status = $1, resolved_at = NOW(), updated_at = NOW() WHERE id = $2',
        ['Resolved', id]
      );
      
      // Get linked incidents
      const linkedIncidentIds = await this.getLinkedIncidentIds(id);
      
      // Update all linked incidents with resolution information
      for (const incidentId of linkedIncidentIds) {
        await client.query(
          `UPDATE incidents 
           SET status = CASE WHEN status NOT IN ('Resolved', 'Closed') THEN 'Resolved' ELSE status END,
               resolved_at = CASE WHEN resolved_at IS NULL THEN NOW() ELSE resolved_at END,
               updated_at = NOW()
           WHERE id = $1`,
          [incidentId]
        );
      }
      
      const problem = await this.getById(id);
      if (!problem) {
        throw new Error('Problem not found after resolution');
      }
      return problem;
    });
  }
  
  /**
   * Get linked incident IDs
   */
  async getLinkedIncidentIds(problemId: string): Promise<string[]> {
    const result = await query(
      'SELECT incident_id FROM problem_incidents WHERE problem_id = $1',
      [problemId]
    );
    
    return result.rows.map(row => row.incident_id);
  }
  
  private mapRowToProblem(row: any, linkedIncidentIds: string[]): Problem {
    return {
      id: row.id,
      number: row.number,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      category: row.category,
      linkedIncidentIds,
      rootCause: row.root_cause,
      knownErrorId: row.known_error_id,
      assignee: row.assignee,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    };
  }
  
  private async generateProblemNumber(): Promise<string> {
    const result = await query(
      'SELECT COUNT(*) as count FROM problems'
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `PRB${count.toString().padStart(7, '0')}`;
  }
}

export const problemRepository = new ProblemRepository();
