import { query } from '../../db/connection.js';
import {
  GovernancePolicy,
  CreatePolicyDTO,
  PolicyValidationResult,
  PolicyViolation,
  GovernanceAction,
  ViolationCriteria,
  ComplianceReport,
  ReportCriteria,
  AuthContext
} from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class GovernanceService {
  async definePolicy(policy: CreatePolicyDTO, context: AuthContext): Promise<GovernancePolicy> {
    const policyId = uuidv4();
    
    const result = await query(
      `INSERT INTO governance_policies 
       (id, name, description, resource_type, rules, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING *`,
      [
        policyId,
        policy.name,
        policy.description,
        policy.resourceType,
        JSON.stringify(policy.rules)
      ]
    );
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      resourceType: result.rows[0].resource_type,
      rules: result.rows[0].rules,
      enabled: result.rows[0].enabled,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  }
  
  async validateAction(action: GovernanceAction): Promise<PolicyValidationResult> {
    // Get all enabled policies for this resource type
    const result = await query(
      'SELECT * FROM governance_policies WHERE resource_type = $1 AND enabled = true',
      [action.resourceType]
    );
    
    const violations: PolicyViolation[] = [];
    
    for (const row of result.rows) {
      const policy = row;
      const rules = policy.rules;
      
      for (const rule of rules) {
        const fieldValue = action.data[rule.field];
        let violated = false;
        
        switch (rule.condition) {
          case 'required':
            violated = fieldValue === undefined || fieldValue === null || fieldValue === '';
            break;
          case 'equals':
            violated = fieldValue !== rule.value;
            break;
          case 'notEquals':
            violated = fieldValue === rule.value;
            break;
          case 'in':
            violated = !Array.isArray(rule.value) || !rule.value.includes(fieldValue);
            break;
          case 'notIn':
            violated = Array.isArray(rule.value) && rule.value.includes(fieldValue);
            break;
          case 'matches':
            violated = typeof fieldValue === 'string' && !new RegExp(rule.value as string).test(fieldValue);
            break;
        }
        
        if (violated) {
          violations.push({
            policyId: policy.id,
            policyName: policy.name,
            rule,
            actualValue: fieldValue,
            timestamp: new Date()
          });
        }
      }
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
  
  async getViolations(criteria: ViolationCriteria, context: AuthContext): Promise<PolicyViolation[]> {
    // This would query a violations log table
    // For now, return empty array
    return [];
  }
  
  async generateComplianceReport(criteria: ReportCriteria, context: AuthContext): Promise<ComplianceReport> {
    // Get audit logs for the period
    const result = await query(
      `SELECT COUNT(*) as total
       FROM audit_logs
       WHERE timestamp >= $1 AND timestamp <= $2
       ${criteria.resourceType ? 'AND resource_type = $3' : ''}`,
      criteria.resourceType 
        ? [criteria.dateFrom, criteria.dateTo, criteria.resourceType]
        : [criteria.dateFrom, criteria.dateTo]
    );
    
    const totalActions = parseInt(result.rows[0].total) || 0;
    
    return {
      period: { from: criteria.dateFrom, to: criteria.dateTo },
      totalActions,
      violations: [],
      complianceRate: 100,
      byPolicy: {}
    };
  }
}

export const governanceService = new GovernanceService();
