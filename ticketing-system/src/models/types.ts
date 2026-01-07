// Common types
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'New' | 'InProgress' | 'Pending' | 'Resolved' | 'Closed';
export type ProblemStatus = 'New' | 'UnderInvestigation' | 'KnownError' | 'Resolved' | 'Closed';
export type ChangeType = 'Standard' | 'Normal' | 'Emergency';
export type ChangeStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Scheduled' | 'InProgress' | 'Completed' | 'Failed' | 'Cancelled';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type CIType = 'Server' | 'Application' | 'Database' | 'Network' | 'Service' | 'Other';
export type CIStatus = 'Active' | 'Inactive' | 'Maintenance' | 'Retired';
export type RelationshipType = 'DependsOn' | 'Contains' | 'ConnectsTo' | 'RunsOn' | 'UsedBy';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'assign';
export type AuditAction = 'Create' | 'Update' | 'Delete' | 'StatusChange' | 'Approve' | 'Reject' | 'Assign' | 'AccessDenied';

// Auth Context
export interface AuthContext {
  userId: string;
  roles: string[];
  permissions: string[];
  tokenExpiry: Date;
}

// Incident
export interface Incident {
  id: string;
  number: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: Priority;
  category: string;
  assignee?: string;
  reporter: string;
  affectedCIs: string[];
  linkedProblemId?: string;
  slaDeadlines?: SLADeadlines;
  history: StatusTransition[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface StatusTransition {
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus;
  timestamp: Date;
  userId: string;
  comment?: string;
}

export interface CreateIncidentDTO {
  title: string;
  description: string;
  priority: Priority;
  category: string;
  assignee?: string;
  affectedCIs?: string[];
}

export interface UpdateIncidentDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  category?: string;
  assignee?: string;
  affectedCIs?: string[];
}

export interface IncidentSearchCriteria {
  status?: IncidentStatus;
  priority?: Priority;
  assignee?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// Problem
export interface Problem {
  id: string;
  number: string;
  title: string;
  description: string;
  status: ProblemStatus;
  priority: Priority;
  category: string;
  linkedIncidentIds: string[];
  rootCause?: RootCauseAnalysis;
  knownErrorId?: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface RootCauseAnalysis {
  causeCategory: string;
  description: string;
  analyzedBy: string;
  analyzedAt: Date;
}

export interface KnownError {
  id: string;
  problemId: string;
  title: string;
  description: string;
  workaround: string;
  permanentFix?: string;
  createdAt: Date;
}

export interface CreateProblemDTO {
  title: string;
  description: string;
  priority: Priority;
  category: string;
  linkedIncidentIds?: string[];
  assignee?: string;
}

export interface UpdateProblemDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  category?: string;
  assignee?: string;
}

export interface KnownErrorDTO {
  title: string;
  description: string;
  workaround: string;
  permanentFix?: string;
}

export interface ResolutionDTO {
  resolutionNotes: string;
}

// Change
export interface Change {
  id: string;
  number: string;
  title: string;
  description: string;
  type: ChangeType;
  status: ChangeStatus;
  riskLevel: RiskLevel;
  priority: Priority;
  requester: string;
  assignee?: string;
  affectedCIs: string[];
  approvals: ApprovalRecord[];
  schedule?: ChangeSchedule;
  implementation?: ImplementationResult;
  rollbackPlan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRecord {
  approverId: string;
  decision: 'Approved' | 'Rejected';
  timestamp: Date;
  comments?: string;
}

export interface ChangeSchedule {
  plannedStart: Date;
  plannedEnd: Date;
  changeWindow?: string;
}

export interface ImplementationResult {
  actualStart: Date;
  actualEnd: Date;
  outcome: 'Successful' | 'Failed' | 'PartialSuccess';
  notes?: string;
  rollbackPerformed: boolean;
}

export interface CreateChangeDTO {
  title: string;
  description: string;
  type: ChangeType;
  riskLevel: RiskLevel;
  priority: Priority;
  rollbackPlan: string;
  affectedCIs?: string[];
  assignee?: string;
}

export interface UpdateChangeDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  assignee?: string;
  rollbackPlan?: string;
}

export interface ApprovalDecision {
  decision: 'Approved' | 'Rejected';
  comments?: string;
}

// Configuration Item
export interface ConfigurationItem {
  id: string;
  name: string;
  type: CIType;
  status: CIStatus;
  owner: string;
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CIRelationship {
  id: string;
  sourceCIId: string;
  targetCIId: string;
  relationshipType: RelationshipType;
  createdAt: Date;
}

export interface CreateCIDTO {
  name: string;
  type: CIType;
  status: CIStatus;
  attributes?: Record<string, unknown>;
}

export interface UpdateCIDTO {
  name?: string;
  status?: CIStatus;
  attributes?: Record<string, unknown>;
}

export interface CIRelationshipDTO {
  sourceCIId: string;
  targetCIId: string;
  relationshipType: RelationshipType;
}

export interface ImpactAnalysisResult {
  rootCI: ConfigurationItem;
  affectedCIs: ConfigurationItem[];
  relationshipPaths: RelationshipPath[];
}

export interface RelationshipPath {
  path: ConfigurationItem[];
  relationshipTypes: RelationshipType[];
}

// RBAC
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parentRoleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: PermissionAction[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface CreateRoleDTO {
  name: string;
  description: string;
  permissionIds: string[];
  parentRoleId?: string;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissionIds?: string[];
  parentRoleId?: string;
}

// Audit
export interface AuditEntry {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface AuditSearchCriteria {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  page?: number;
  pageSize?: number;
}

// SLA
export interface SLA {
  id: string;
  name: string;
  priority: Priority;
  category?: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  businessHoursOnly: boolean;
  escalationThresholds: EscalationThreshold[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SLADeadlines {
  responseDeadline: Date;
  resolutionDeadline: Date;
  slaId: string;
  breached: boolean;
  breachedAt?: Date;
}

export interface EscalationThreshold {
  percentageRemaining: number;
  notifyRoles: string[];
}

export interface CreateSLADTO {
  name: string;
  priority: Priority;
  category?: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  businessHoursOnly?: boolean;
  escalationThresholds?: EscalationThreshold[];
}

export interface SLAMetrics {
  totalTickets: number;
  breachedCount: number;
  compliancePercentage: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  byPriority: Record<Priority, SLAMetricsSummary>;
  byCategory: Record<string, SLAMetricsSummary>;
}

export interface SLAMetricsSummary {
  total: number;
  breached: number;
  compliancePercentage: number;
}

export interface SLAMetricsCriteria {
  dateFrom?: Date;
  dateTo?: Date;
  priority?: Priority;
  category?: string;
}

export interface SLABreach {
  incidentId: string;
  slaId: string;
  breachedAt: Date;
  breachType: 'response' | 'resolution';
}

export type EscalationType = 'response' | 'resolution';

// Governance
export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  rules: PolicyRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  field: string;
  condition: 'required' | 'equals' | 'notEquals' | 'in' | 'notIn' | 'matches';
  value: unknown;
  message: string;
}

export interface CreatePolicyDTO {
  name: string;
  description: string;
  resourceType: string;
  rules: PolicyRule[];
}

export interface PolicyValidationResult {
  valid: boolean;
  violations: PolicyViolation[];
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  rule: PolicyRule;
  actualValue: unknown;
  timestamp: Date;
}

export interface GovernanceAction {
  resourceType: string;
  action: string;
  data: Record<string, unknown>;
}

export interface ViolationCriteria {
  dateFrom?: Date;
  dateTo?: Date;
  policyId?: string;
  resourceType?: string;
}

export interface ComplianceReport {
  period: { from: Date; to: Date };
  totalActions: number;
  violations: PolicyViolation[];
  complianceRate: number;
  byPolicy: Record<string, { violations: number; complianceRate: number }>;
}

export interface ReportCriteria {
  dateFrom: Date;
  dateTo: Date;
  resourceType?: string;
}

// Pagination
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
