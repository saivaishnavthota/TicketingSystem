import { changeRepository } from './change.repository.js';
import { incidentService } from '../incident/incident.service.js';
import { auditService } from '../audit/audit.service.js';
import {
  Change,
  CreateChangeDTO,
  UpdateChangeDTO,
  ChangeSchedule,
  ApprovalDecision,
  ImplementationResult,
  AuthContext,
  ChangeType
} from '../../models/types.js';

const VALID_CHANGE_TYPES: ChangeType[] = ['Standard', 'Normal', 'Emergency'];

export class ChangeService {
  async create(data: CreateChangeDTO, context: AuthContext): Promise<Change> {
    // Validate change type
    if (!VALID_CHANGE_TYPES.includes(data.type)) {
      throw new Error(`Invalid change type. Must be one of: ${VALID_CHANGE_TYPES.join(', ')}`);
    }
    
    const change = await changeRepository.create(data, context.userId);
    
    await auditService.logModification(
      context.userId,
      'Create',
      'Change',
      change.id,
      undefined,
      change
    );
    
    return change;
  }
  
  async getById(id: string, context: AuthContext): Promise<Change | null> {
    return changeRepository.getById(id);
  }
  
  async update(id: string, data: UpdateChangeDTO, context: AuthContext): Promise<Change> {
    const before = await changeRepository.getById(id);
    if (!before) {
      throw new Error('Change not found');
    }
    
    const change = await changeRepository.update(id, data);
    
    await auditService.logModification(
      context.userId,
      'Update',
      'Change',
      change.id,
      before,
      change
    );
    
    return change;
  }
  
  async submitForApproval(id: string, context: AuthContext): Promise<Change> {
    const change = await changeRepository.submitForApproval(id);
    
    await auditService.log({
      userId: context.userId,
      action: 'StatusChange',
      resourceType: 'Change',
      resourceId: id,
      afterState: { status: 'Submitted' }
    });
    
    return change;
  }
  
  async approve(id: string, decision: ApprovalDecision, context: AuthContext): Promise<Change> {
    const change = await changeRepository.approve(id, decision, context.userId);
    
    await auditService.log({
      userId: context.userId,
      action: decision.decision === 'Approved' ? 'Approve' : 'Reject',
      resourceType: 'Change',
      resourceId: id,
      metadata: { comments: decision.comments }
    });
    
    return change;
  }
  
  async schedule(id: string, schedule: ChangeSchedule, context: AuthContext): Promise<Change> {
    // Check for conflicts
    const conflicts = await changeRepository.checkScheduleConflicts(schedule);
    if (conflicts.length > 0) {
      throw new Error(`Schedule conflicts with ${conflicts.length} existing change(s)`);
    }
    
    const change = await changeRepository.schedule(id, schedule);
    
    await auditService.logModification(
      context.userId,
      'Update',
      'Change',
      change.id,
      undefined,
      { schedule }
    );
    
    return change;
  }
  
  async recordImplementation(id: string, result: ImplementationResult, context: AuthContext): Promise<Change> {
    const change = await changeRepository.recordImplementation(id, result);
    
    // If implementation failed, create an incident
    if (result.outcome === 'Failed') {
      await incidentService.create({
        title: `Failed Change: ${change.title}`,
        description: `Change ${change.number} failed during implementation. ${result.notes || ''}`,
        priority: change.priority,
        category: 'Change Implementation Failure',
        affectedCIs: change.affectedCIs
      }, context);
    }
    
    await auditService.logModification(
      context.userId,
      'Update',
      'Change',
      change.id,
      undefined,
      { implementation: result }
    );
    
    return change;
  }
  
  async checkScheduleConflicts(schedule: ChangeSchedule): Promise<Change[]> {
    return changeRepository.checkScheduleConflicts(schedule);
  }
}

export const changeService = new ChangeService();
