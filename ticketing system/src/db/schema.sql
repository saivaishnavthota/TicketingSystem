-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  resource VARCHAR(255) NOT NULL,
  actions TEXT[] NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('New', 'InProgress', 'Pending', 'Resolved', 'Closed')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  category VARCHAR(255) NOT NULL,
  assignee UUID REFERENCES users(id),
  reporter UUID NOT NULL REFERENCES users(id),
  linked_problem_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Incident history table
CREATE TABLE IF NOT EXISTS incident_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('New', 'UnderInvestigation', 'KnownError', 'Resolved', 'Closed')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  category VARCHAR(255) NOT NULL,
  assignee UUID REFERENCES users(id),
  root_cause JSONB,
  known_error_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Add foreign key for incident-problem linking
ALTER TABLE incidents ADD CONSTRAINT fk_incident_problem 
  FOREIGN KEY (linked_problem_id) REFERENCES problems(id) ON DELETE SET NULL;

-- Problem-Incident junction table
CREATE TABLE IF NOT EXISTS problem_incidents (
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, incident_id)
);

-- Known errors table
CREATE TABLE IF NOT EXISTS known_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  workaround TEXT NOT NULL,
  permanent_fix TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Update problems table to reference known errors
ALTER TABLE problems ADD CONSTRAINT fk_problem_known_error 
  FOREIGN KEY (known_error_id) REFERENCES known_errors(id) ON DELETE SET NULL;

-- Changes table
CREATE TABLE IF NOT EXISTS changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Standard', 'Normal', 'Emergency')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Scheduled', 'InProgress', 'Completed', 'Failed', 'Cancelled')),
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  requester UUID NOT NULL REFERENCES users(id),
  assignee UUID REFERENCES users(id),
  rollback_plan TEXT NOT NULL,
  schedule JSONB,
  implementation JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Approval records table
CREATE TABLE IF NOT EXISTS approval_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_id UUID NOT NULL REFERENCES changes(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(50) NOT NULL CHECK (decision IN ('Approved', 'Rejected')),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  comments TEXT
);

-- Configuration items table
CREATE TABLE IF NOT EXISTS configuration_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Server', 'Application', 'Database', 'Network', 'Service', 'Other')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Retired')),
  owner UUID NOT NULL REFERENCES users(id),
  attributes JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CI relationships table
CREATE TABLE IF NOT EXISTS ci_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_ci_id UUID NOT NULL REFERENCES configuration_items(id) ON DELETE CASCADE,
  target_ci_id UUID NOT NULL REFERENCES configuration_items(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('DependsOn', 'Contains', 'ConnectsTo', 'RunsOn', 'UsedBy')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Incident-CI junction table
CREATE TABLE IF NOT EXISTS incident_cis (
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  ci_id UUID REFERENCES configuration_items(id) ON DELETE CASCADE,
  PRIMARY KEY (incident_id, ci_id)
);

-- Change-CI junction table
CREATE TABLE IF NOT EXISTS change_cis (
  change_id UUID REFERENCES changes(id) ON DELETE CASCADE,
  ci_id UUID REFERENCES configuration_items(id) ON DELETE CASCADE,
  PRIMARY KEY (change_id, ci_id)
);

-- SLAs table
CREATE TABLE IF NOT EXISTS slas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  category VARCHAR(255),
  response_time_minutes INTEGER NOT NULL,
  resolution_time_minutes INTEGER NOT NULL,
  business_hours_only BOOLEAN NOT NULL DEFAULT false,
  escalation_thresholds JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SLA deadlines table (for tracking incident SLAs)
CREATE TABLE IF NOT EXISTS sla_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  sla_id UUID NOT NULL REFERENCES slas(id),
  response_deadline TIMESTAMP NOT NULL,
  resolution_deadline TIMESTAMP NOT NULL,
  breached BOOLEAN NOT NULL DEFAULT false,
  breached_at TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('Create', 'Update', 'Delete', 'StatusChange', 'Approve', 'Reject', 'Assign', 'AccessDenied')),
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  metadata JSONB,
  ip_address VARCHAR(45)
);

-- Governance policies table
CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(100) NOT NULL,
  rules JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_assignee ON incidents(assignee);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_changes_status ON changes(status);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_ci_relationships_source ON ci_relationships(source_ci_id);
CREATE INDEX idx_ci_relationships_target ON ci_relationships(target_ci_id);
