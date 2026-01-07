import { query, getClient, transaction } from '../../db/connection.js';
import {
  ConfigurationItem,
  CreateCIDTO,
  UpdateCIDTO,
  CIRelationship,
  CIRelationshipDTO,
  ImpactAnalysisResult,
  RelationshipPath,
  CIStatus
} from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class CMDBRepository {
  async createCI(data: CreateCIDTO, owner: string): Promise<ConfigurationItem> {
    const ciId = uuidv4();
    
    const result = await query(
      `INSERT INTO configuration_items 
       (id, name, type, status, owner, attributes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        ciId,
        data.name,
        data.type,
        data.status,
        owner,
        data.attributes ? JSON.stringify(data.attributes) : null
      ]
    );
    
    return this.mapRowToCI(result.rows[0]);
  }
  
  async getCI(id: string): Promise<ConfigurationItem | null> {
    const result = await query(
      'SELECT * FROM configuration_items WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToCI(result.rows[0]);
  }
  
  async updateCI(id: string, data: UpdateCIDTO): Promise<ConfigurationItem> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.attributes !== undefined) {
      updates.push(`attributes = $${paramIndex++}`);
      values.push(JSON.stringify(data.attributes));
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    await query(
      `UPDATE configuration_items SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    const ci = await this.getCI(id);
    if (!ci) {
      throw new Error('CI not found after update');
    }
    return ci;
  }
  
  async createRelationship(relationship: CIRelationshipDTO): Promise<CIRelationship> {
    const relationshipId = uuidv4();
    
    const result = await query(
      `INSERT INTO ci_relationships 
       (id, source_ci_id, target_ci_id, relationship_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        relationshipId,
        relationship.sourceCIId,
        relationship.targetCIId,
        relationship.relationshipType
      ]
    );
    
    return {
      id: result.rows[0].id,
      sourceCIId: result.rows[0].source_ci_id,
      targetCIId: result.rows[0].target_ci_id,
      relationshipType: result.rows[0].relationship_type,
      createdAt: result.rows[0].created_at
    };
  }
  
  async getRelationships(ciId: string): Promise<CIRelationship[]> {
    const result = await query(
      `SELECT * FROM ci_relationships 
       WHERE source_ci_id = $1 OR target_ci_id = $1`,
      [ciId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      sourceCIId: row.source_ci_id,
      targetCIId: row.target_ci_id,
      relationshipType: row.relationship_type,
      createdAt: row.created_at
    }));
  }
  
  async analyzeImpact(ciId: string): Promise<ImpactAnalysisResult> {
    const rootCI = await this.getCI(ciId);
    if (!rootCI) {
      throw new Error('CI not found');
    }
    
    const affectedCIs: ConfigurationItem[] = [];
    const relationshipPaths: RelationshipPath[] = [];
    const visited = new Set<string>();
    
    await this.traverseRelationships(ciId, [], [], visited, affectedCIs, relationshipPaths);
    
    return {
      rootCI,
      affectedCIs,
      relationshipPaths
    };
  }
  
  async updateStatus(id: string, status: CIStatus): Promise<ConfigurationItem> {
    await query(
      'UPDATE configuration_items SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    
    // Propagate status to dependent CIs
    const relationships = await query(
      'SELECT target_ci_id FROM ci_relationships WHERE source_ci_id = $1 AND relationship_type = $2',
      [id, 'DependsOn']
    );
    
    for (const row of relationships.rows) {
      await this.updateStatus(row.target_ci_id, status);
    }
    
    const ci = await this.getCI(id);
    if (!ci) {
      throw new Error('CI not found after status update');
    }
    return ci;
  }
  
  private async traverseRelationships(
    ciId: string,
    currentPath: ConfigurationItem[],
    currentRelTypes: any[],
    visited: Set<string>,
    affectedCIs: ConfigurationItem[],
    relationshipPaths: RelationshipPath[]
  ): Promise<void> {
    if (visited.has(ciId)) {
      return;
    }
    
    visited.add(ciId);
    
    const ci = await this.getCI(ciId);
    if (!ci) {
      return;
    }
    
    if (currentPath.length > 0) {
      affectedCIs.push(ci);
      relationshipPaths.push({
        path: [...currentPath, ci],
        relationshipTypes: [...currentRelTypes]
      });
    }
    
    const relationships = await query(
      'SELECT * FROM ci_relationships WHERE source_ci_id = $1',
      [ciId]
    );
    
    for (const row of relationships.rows) {
      await this.traverseRelationships(
        row.target_ci_id,
        [...currentPath, ci],
        [...currentRelTypes, row.relationship_type],
        visited,
        affectedCIs,
        relationshipPaths
      );
    }
  }
  
  private mapRowToCI(row: any): ConfigurationItem {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      owner: row.owner,
      attributes: row.attributes || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const cmdbRepository = new CMDBRepository();
