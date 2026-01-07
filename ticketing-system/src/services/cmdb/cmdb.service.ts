import { cmdbRepository } from './cmdb.repository.js';
import { auditService } from '../audit/audit.service.js';
import {
  ConfigurationItem,
  CreateCIDTO,
  UpdateCIDTO,
  CIRelationship,
  CIRelationshipDTO,
  ImpactAnalysisResult,
  CIStatus,
  AuthContext
} from '../../models/types.js';

export class CMDBService {
  async createCI(data: CreateCIDTO, context: AuthContext): Promise<ConfigurationItem> {
    const ci = await cmdbRepository.createCI(data, context.userId);
    
    await auditService.logModification(
      context.userId,
      'Create',
      'ConfigurationItem',
      ci.id,
      undefined,
      ci
    );
    
    return ci;
  }
  
  async getCI(id: string, context: AuthContext): Promise<ConfigurationItem | null> {
    return cmdbRepository.getCI(id);
  }
  
  async updateCI(id: string, data: UpdateCIDTO, context: AuthContext): Promise<ConfigurationItem> {
    const before = await cmdbRepository.getCI(id);
    if (!before) {
      throw new Error('CI not found');
    }
    
    const ci = await cmdbRepository.updateCI(id, data);
    
    await auditService.logModification(
      context.userId,
      'Update',
      'ConfigurationItem',
      ci.id,
      before,
      ci
    );
    
    return ci;
  }
  
  async createRelationship(relationship: CIRelationshipDTO, context: AuthContext): Promise<CIRelationship> {
    const rel = await cmdbRepository.createRelationship(relationship);
    
    await auditService.logModification(
      context.userId,
      'Create',
      'CIRelationship',
      rel.id,
      undefined,
      rel
    );
    
    return rel;
  }
  
  async getRelationships(ciId: string, context: AuthContext): Promise<CIRelationship[]> {
    return cmdbRepository.getRelationships(ciId);
  }
  
  async analyzeImpact(ciId: string, context: AuthContext): Promise<ImpactAnalysisResult> {
    return cmdbRepository.analyzeImpact(ciId);
  }
  
  async updateStatus(id: string, status: CIStatus, context: AuthContext): Promise<ConfigurationItem> {
    const before = await cmdbRepository.getCI(id);
    if (!before) {
      throw new Error('CI not found');
    }
    
    const ci = await cmdbRepository.updateStatus(id, status);
    
    await auditService.logModification(
      context.userId,
      'Update',
      'ConfigurationItem',
      ci.id,
      before,
      ci
    );
    
    return ci;
  }
}

export const cmdbService = new CMDBService();
