import { incidentRepository } from './incident.repository.js';
import { auditService } from '../audit/audit.service.js';
import {
  Incident,
  CreateIncidentDTO,
  UpdateIncidentDTO,
  IncidentSearchCriteria,
  PaginatedResult,
  AuthContext,
  IncidentStatus,
  Priority
} from '../../models/types.js';

const VALID_PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export class IncidentService {
  /**
   * Create a new incident with validation
   */
  async create(data: CreateIncidentDTO, context: AuthContext): Promise<Incident> {
    // Validate required fields
    this.validateRequiredFields(data);
    
    // Validate priority
    this.validatePriority(data.priority);
    
    const incident = await incidentRepository.create(data, context.userId);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Create',
      'Incident',
      incident.id,
      undefined,
      incident
    );
    
    return incident;
  }
  
  /**
   * Get incident by ID
   */
  async getById(id: string, context: AuthContext): Promise<Incident | null> {
    return incidentRepository.getById(id);
  }
  
  /**
   * Update incident
   */
  async update(id: string, data: UpdateIncidentDTO, context: AuthContext): Promise<Incident> {
    const before = await incidentRepository.getById(id);
    if (!before) {
      throw new Error('Incident not found');
    }
    
    // Validate priority if provided
    if (data.priority) {
      this.validatePriority(data.priority);
    }
    
    const incident = await incidentRepository.update(id, data);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Update',
      'Incident',
      incident.id,
      before,
      incident
    );
    
    return incident;
  }
  
  /**
   * Transition incident status
   */
  async transition(id: string, newStatus: IncidentStatus, context: AuthContext, comment?: string): Promise<Incident> {
    const before = await incidentRepository.getById(id);
    if (!before) {
      throw new Error('Incident not found');
    }
    
    const incident = await incidentRepository.transition(id, newStatus, context.userId, comment);
    
    // Log audit entry
    await auditService.log({
      userId: context.userId,
      action: 'StatusChange',
      resourceType: 'Incident',
      resourceId: incident.id,
      beforeState: { status: before.status },
      afterState: { status: newStatus },
      metadata: { comment }
    });
    
    return incident;
  }
  
  /**
   * Link incident to problem
   */
  async linkToProblem(incidentId: string, problemId: string, context: AuthContext): Promise<void> {
    await incidentRepository.linkToProblem(incidentId, problemId);
    
    // Log audit entry
    await auditService.log({
      userId: context.userId,
      action: 'Update',
      resourceType: 'Incident',
      resourceId: incidentId,
      metadata: { linkedProblemId: problemId }
    });
  }
  
  /**
   * Search incidents with filters
   */
  async search(criteria: IncidentSearchCriteria, context: AuthContext): Promise<PaginatedResult<Incident>> {
    return incidentRepository.search(criteria);
  }
  
  /**
   * Validate required fields
   */
  private validateRequiredFields(data: CreateIncidentDTO): void {
    const errors: string[] = [];
    
    if (!data.title || data.title.trim() === '') {
      errors.push('title is required');
    }
    
    if (!data.description || data.description.trim() === '') {
      errors.push('description is required');
    }
    
    if (!data.priority) {
      errors.push('priority is required');
    }
    
    if (!data.category || data.category.trim() === '') {
      errors.push('category is required');
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }
  
  /**
   * Validate priority value
   */
  private validatePriority(priority: Priority): void {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(
        'Invalid priority',
        [`priority must be one of: ${VALID_PRIORITIES.join(', ')}`]
      );
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const incidentService = new IncidentService();
