import { query } from '../../db/connection.js';
import {
  SLA,
  CreateSLADTO,
  SLADeadlines,
  SLABreach,
  SLAMetrics,
  SLAMetricsCriteria,
  Incident,
  AuthContext,
  EscalationType
} from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class SLAService {
  async defineSLA(sla: CreateSLADTO, context: AuthContext): Promise<SLA> {
    const slaId = uuidv4();
    
    const result = await query(
      `INSERT INTO slas 
       (id, name, priority, category, response_time_minutes, resolution_time_minutes, business_hours_only, escalation_thresholds, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        slaId,
        sla.name,
        sla.priority,
        sla.category || null,
        sla.responseTimeMinutes,
        sla.resolutionTimeMinutes,
        sla.businessHoursOnly || false,
        sla.escalationThresholds ? JSON.stringify(sla.escalationThresholds) : null
      ]
    );
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      priority: result.rows[0].priority,
      category: result.rows[0].category,
      responseTimeMinutes: result.rows[0].response_time_minutes,
      resolutionTimeMinutes: result.rows[0].resolution_time_minutes,
      businessHoursOnly: result.rows[0].business_hours_only,
      escalationThresholds: result.rows[0].escalation_thresholds || [],
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  }
  
  async calculateDeadlines(incident: Incident): Promise<SLADeadlines> {
    // Find matching SLA
    const result = await query(
      `SELECT * FROM slas 
       WHERE priority = $1 AND (category IS NULL OR category = $2)
       ORDER BY category DESC NULLS LAST
       LIMIT 1`,
      [incident.priority, incident.category]
    );
    
    if (result.rows.length === 0) {
      throw new Error('No matching SLA found');
    }
    
    const sla = result.rows[0];
    const now = new Date();
    
    const responseDeadline = new Date(now.getTime() + sla.response_time_minutes * 60000);
    const resolutionDeadline = new Date(now.getTime() + sla.resolution_time_minutes * 60000);
    
    const deadlines: SLADeadlines = {
      responseDeadline,
      resolutionDeadline,
      slaId: sla.id,
      breached: false
    };
    
    // Store SLA deadlines
    await query(
      `INSERT INTO sla_deadlines 
       (id, incident_id, sla_id, response_deadline, resolution_deadline, breached)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), incident.id, sla.id, responseDeadline, resolutionDeadline, false]
    );
    
    return deadlines;
  }
  
  async checkBreaches(): Promise<SLABreach[]> {
    const now = new Date();
    
    const result = await query(
      `SELECT sd.*, i.status 
       FROM sla_deadlines sd
       JOIN incidents i ON sd.incident_id = i.id
       WHERE sd.breached = false 
       AND (sd.resolution_deadline < $1 OR sd.response_deadline < $1)
       AND i.status NOT IN ('Resolved', 'Closed')`,
      [now]
    );
    
    const breaches: SLABreach[] = [];
    
    for (const row of result.rows) {
      const breachType = row.response_deadline < now ? 'response' : 'resolution';
      
      // Mark as breached
      await query(
        'UPDATE sla_deadlines SET breached = true, breached_at = NOW() WHERE id = $1',
        [row.id]
      );
      
      breaches.push({
        incidentId: row.incident_id,
        slaId: row.sla_id,
        breachedAt: now,
        breachType
      });
    }
    
    return breaches;
  }
  
  async getMetrics(criteria: SLAMetricsCriteria, context: AuthContext): Promise<SLAMetrics> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (criteria.dateFrom) {
      conditions.push(`i.created_at >= $${paramIndex++}`);
      values.push(criteria.dateFrom);
    }
    
    if (criteria.dateTo) {
      conditions.push(`i.created_at <= $${paramIndex++}`);
      values.push(criteria.dateTo);
    }
    
    if (criteria.priority) {
      conditions.push(`i.priority = $${paramIndex++}`);
      values.push(criteria.priority);
    }
    
    if (criteria.category) {
      conditions.push(`i.category = $${paramIndex++}`);
      values.push(criteria.category);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN sd.breached THEN 1 ELSE 0 END) as breached,
         AVG(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.created_at)) / 60) as avg_resolution_time
       FROM incidents i
       LEFT JOIN sla_deadlines sd ON i.id = sd.incident_id
       ${whereClause}`,
      values
    );
    
    const row = result.rows[0];
    const total = parseInt(row.total) || 0;
    const breached = parseInt(row.breached) || 0;
    
    return {
      totalTickets: total,
      breachedCount: breached,
      compliancePercentage: total > 0 ? ((total - breached) / total) * 100 : 100,
      averageResponseTime: 0,
      averageResolutionTime: parseFloat(row.avg_resolution_time) || 0,
      byPriority: {},
      byCategory: {}
    };
  }
  
  async triggerEscalation(incidentId: string, escalationType: EscalationType): Promise<void> {
    // Implementation would send notifications to configured roles
    // For now, just log the escalation
    console.log(`Escalation triggered for incident ${incidentId}: ${escalationType}`);
  }
}

export const slaService = new SLAService();
