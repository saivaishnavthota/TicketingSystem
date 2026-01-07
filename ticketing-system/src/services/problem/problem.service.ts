import { problemRepository } from './problem.repository.js';
import { incidentRepository } from '../incident/incident.repository.js';
import { auditService } from '../audit/audit.service.js';
import {
  Problem,
  CreateProblemDTO,
  UpdateProblemDTO,
  RootCauseAnalysis,
  KnownError,
  KnownErrorDTO,
  ResolutionDTO,
  AuthContext,
  Incident
} from '../../models/types.js';

export class ProblemService {
  /**
   * Create a new problem
   */
  async create(data: CreateProblemDTO, context: AuthContext): Promise<Problem> {
    const problem = await problemRepository.create(data, context.userId);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Create',
      'Problem',
      problem.id,
      undefined,
      problem
    );
    
    return problem;
  }
  
  /**
   * Get problem by ID
   */
  async getById(id: string, context: AuthContext): Promise<Problem | null> {
    return problemRepository.getById(id);
  }
  
  /**
   * Update problem
   */
  async update(id: string, data: UpdateProblemDTO, context: AuthContext): Promise<Problem> {
    const before = await problemRepository.getById(id);
    if (!before) {
      throw new Error('Problem not found');
    }
    
    const problem = await problemRepository.update(id, data);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Update',
      'Problem',
      problem.id,
      before,
      problem
    );
    
    return problem;
  }
  
  /**
   * Record root cause analysis
   */
  async recordRootCause(id: string, rootCause: RootCauseAnalysis, context: AuthContext): Promise<Problem> {
    const before = await problemRepository.getById(id);
    if (!before) {
      throw new Error('Problem not found');
    }
    
    const problem = await problemRepository.recordRootCause(id, rootCause);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Update',
      'Problem',
      problem.id,
      before,
      problem
    );
    
    return problem;
  }
  
  /**
   * Create known error
   */
  async createKnownError(problemId: string, knownError: KnownErrorDTO, context: AuthContext): Promise<KnownError> {
    const ke = await problemRepository.createKnownError(problemId, knownError);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Create',
      'KnownError',
      ke.id,
      undefined,
      ke
    );
    
    return ke;
  }
  
  /**
   * Resolve problem and update linked incidents
   */
  async resolve(id: string, resolution: ResolutionDTO, context: AuthContext): Promise<Problem> {
    const before = await problemRepository.getById(id);
    if (!before) {
      throw new Error('Problem not found');
    }
    
    const problem = await problemRepository.resolve(id, resolution.resolutionNotes);
    
    // Log audit entry
    await auditService.logModification(
      context.userId,
      'Update',
      'Problem',
      problem.id,
      before,
      problem
    );
    
    return problem;
  }
  
  /**
   * Get linked incidents
   */
  async getLinkedIncidents(id: string, context: AuthContext): Promise<Incident[]> {
    const incidentIds = await problemRepository.getLinkedIncidentIds(id);
    
    const incidents: Incident[] = [];
    for (const incidentId of incidentIds) {
      const incident = await incidentRepository.getById(incidentId);
      if (incident) {
        incidents.push(incident);
      }
    }
    
    return incidents;
  }
}

export const problemService = new ProblemService();
