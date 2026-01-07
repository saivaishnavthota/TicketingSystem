# Implementation Plan

- [x] 1. Set up project structure and core infrastructure

  - [x] 1.1 Initialize Node.js/TypeScript project with Express.js


    - Create package.json with dependencies (express, typescript, vitest, fast-check, pg, redis, jsonwebtoken)
    - Configure tsconfig.json for strict TypeScript
    - Set up project directory structure (src/services, src/models, src/api, src/middleware)
    - _Requirements: 4.1, 4.4_
  - [x] 1.2 Set up database schema and migrations


    - Create PostgreSQL schema for all entities (incidents, problems, changes, CIs, roles, audit_logs, SLAs)
    - Implement database connection pool and query utilities
    - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.1, 8.1_
  - [x] 1.3 Configure testing framework


    - Set up Vitest configuration
    - Configure fast-check for property-based testing
    - Create test utilities and fixtures
    - _Requirements: 9.3_

- [x] 2. Implement core data models and serialization

  - [x] 2.1 Create TypeScript interfaces and types


    - Define Incident, Problem, Change, ConfigurationItem, Role, Permission, AuditLog, SLA types
    - Implement Priority, Status, and other enum types
    - _Requirements: 1.1, 1.3, 2.1, 3.1, 5.1, 6.1, 7.1, 8.1_
  - [x] 2.2 Implement JSON serialization/deserialization utilities


    - Create serializers for all domain objects
    - Implement date/time serialization with ISO 8601 format
    - Add validation for incoming JSON payloads
    - _Requirements: 9.1, 9.2, 9.4, 9.5_
  - [ ]* 2.3 Write property test for JSON round-trip
    - **Property 24: JSON Serialization Round-Trip**
    - **Validates: Requirements 9.3**
  - [ ]* 2.4 Write property test for date serialization format
    - **Property 25: Date Serialization Format**
    - **Validates: Requirements 9.5**

- [x] 3. Implement authentication and RBAC service

  - [x] 3.1 Implement JWT authentication


    - Create token generation with expiry
    - Implement token validation middleware
    - Add refresh token rotation
    - _Requirements: 4.1_
  - [ ]* 3.2 Write property test for token expiry
    - **Property 13: Authentication Token Expiry**
    - **Validates: Requirements 4.1**
  - [x] 3.3 Implement Role and Permission models


    - Create Role entity with hierarchical parent support
    - Implement Permission entity with resource and actions
    - Create UserRole association
    - _Requirements: 5.1, 5.3_
  - [x] 3.4 Implement RBAC service


    - Implement assignRole, removeRole, getUserPermissions
    - Implement checkPermission with hierarchy evaluation
    - Create permission middleware for API routes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 3.5 Write property test for role permission grant
    - **Property 15: Role Permission Grant**
    - **Validates: Requirements 5.1**
  - [ ]* 3.6 Write property test for permission hierarchy inheritance
    - **Property 16: Permission Hierarchy Inheritance**
    - **Validates: Requirements 5.3**

- [x] 4. Implement Audit service

  - [x] 4.1 Implement AuditLog model and repository


    - Create immutable audit log storage
    - Implement log method with before/after state capture
    - _Requirements: 6.1_
  - [x] 4.2 Implement audit log search


    - Add filtering by date range, user, action type, affected record
    - Implement pagination for search results
    - _Requirements: 6.3_
  - [ ]* 4.3 Write property test for audit log completeness
    - **Property 18: Audit Log Immutability and Completeness**
    - **Validates: Requirements 6.1**
  - [ ]* 4.4 Write property test for audit log search filters
    - **Property 19: Audit Log Search Filter Correctness**
    - **Validates: Requirements 6.3**
  - [x] 4.5 Implement unauthorized access logging


    - Log access denied events with full context
    - _Requirements: 5.5_
  - [ ]* 4.6 Write property test for unauthorized access denial and logging
    - **Property 17: Unauthorized Access Denial and Logging**
    - **Validates: Requirements 5.2, 5.5**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Incident service

  - [x] 6.1 Implement Incident model and repository


    - Create Incident entity with all fields
    - Implement CRUD operations
    - Add status transition history tracking
    - _Requirements: 1.1, 1.4_
  - [x] 6.2 Implement incident creation with validation


    - Validate required fields (title, description, priority, category)
    - Validate priority values
    - Generate unique identifier and set initial status
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 6.3 Write property test for incident creation invariants
    - **Property 1: Incident Creation Invariants**
    - **Validates: Requirements 1.1**
  - [ ]* 6.4 Write property test for required field validation
    - **Property 2: Required Field Validation**
    - **Validates: Requirements 1.2**
  - [ ]* 6.5 Write property test for priority value validation
    - **Property 3: Priority Value Validation**
    - **Validates: Requirements 1.3**
  - [x] 6.6 Implement incident status transitions


    - Create transition method with history recording
    - Capture timestamp and user information
    - _Requirements: 1.4_
  - [ ]* 6.7 Write property test for status transition history
    - **Property 4: Status Transition History**
    - **Validates: Requirements 1.4**
  - [x] 6.8 Implement incident search with filters


    - Add filtering by status, priority, assignee, category, date range
    - Implement pagination
    - _Requirements: 1.6_
  - [ ]* 6.9 Write property test for incident search filter correctness
    - **Property 6: Incident Search Filter Correctness**
    - **Validates: Requirements 1.6**

- [x] 7. Implement Problem service

  - [x] 7.1 Implement Problem model and repository


    - Create Problem entity with all fields
    - Implement CRUD operations
    - _Requirements: 2.1_
  - [x] 7.2 Implement problem-incident linking


    - Create bidirectional linking between problems and incidents
    - Implement linkToProblem method on incident service
    - _Requirements: 1.5, 2.1_
  - [ ]* 7.3 Write property test for bidirectional incident-problem linking
    - **Property 5: Bidirectional Incident-Problem Linking**
    - **Validates: Requirements 1.5, 2.1**
  - [x] 7.4 Implement root cause analysis recording


    - Add recordRootCause method
    - Store cause category and description
    - _Requirements: 2.2_
  - [x] 7.5 Implement known error management

    - Create KnownError entity
    - Implement createKnownError method
    - _Requirements: 2.3_
  - [x] 7.6 Implement problem resolution with incident cascade

    - Update all linked incidents when problem is resolved
    - _Requirements: 2.4_
  - [ ]* 7.7 Write property test for problem resolution cascades
    - **Property 7: Problem Resolution Cascades to Incidents**
    - **Validates: Requirements 2.4**
  - [x] 7.8 Implement problem query with metrics


    - Return incident counts and impact metrics
    - _Requirements: 2.5_
  - [ ]* 7.9 Write property test for problem query metrics accuracy
    - **Property 8: Problem Query Metrics Accuracy**
    - **Validates: Requirements 2.5**

- [x] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Change service

  - [x] 9.1 Implement Change model and repository


    - Create Change entity with all fields
    - Implement CRUD operations
    - _Requirements: 3.1_
  - [x] 9.2 Implement change creation with type validation


    - Validate change type (Standard, Normal, Emergency)
    - _Requirements: 3.1_
  - [ ]* 9.3 Write property test for change type validation
    - **Property 9: Change Type Validation**
    - **Validates: Requirements 3.1**
  - [x] 9.4 Implement approval workflow

    - Create approval routing based on type and risk level
    - Record approval decisions with timestamp and approver
    - _Requirements: 3.2, 3.3_
  - [ ]* 9.5 Write property test for approval record completeness
    - **Property 10: Approval Record Completeness**
    - **Validates: Requirements 3.3**
  - [x] 9.6 Implement change scheduling with conflict detection

    - Validate schedule against existing change windows
    - Detect and report conflicts
    - _Requirements: 3.4_
  - [ ]* 9.7 Write property test for change schedule conflict detection
    - **Property 11: Change Schedule Conflict Detection**
    - **Validates: Requirements 3.4**
  - [x] 9.8 Implement change implementation tracking

    - Record actual start/end times and outcome
    - Support rollback documentation
    - _Requirements: 3.5_
  - [x] 9.9 Implement failed change incident creation

    - Create incident when change implementation fails
    - _Requirements: 3.6_
  - [ ]* 9.10 Write property test for failed change creates incident
    - **Property 12: Failed Change Creates Incident**
    - **Validates: Requirements 3.6**

- [x] 10. Implement CMDB service

  - [x] 10.1 Implement ConfigurationItem model and repository


    - Create CI entity with type, status, owner, attributes
    - Implement CRUD operations
    - _Requirements: 7.1_
  - [x] 10.2 Implement CI relationships

    - Create CIRelationship entity
    - Support relationship types (DependsOn, Contains, ConnectsTo, RunsOn, UsedBy)
    - Implement bidirectional navigation
    - _Requirements: 7.2_
  - [ ]* 10.3 Write property test for CI relationship bidirectionality
    - **Property 20: CI Relationship Bidirectionality**
    - **Validates: Requirements 7.2**
  - [x] 10.4 Implement CI linking to incidents and changes

    - Add affectedCIs field support
    - _Requirements: 7.3_
  - [x] 10.5 Implement impact analysis

    - Traverse CI relationships
    - Return all affected items
    - _Requirements: 7.4_
  - [ ]* 10.6 Write property test for impact analysis completeness
    - **Property 21: Impact Analysis Completeness**
    - **Validates: Requirements 7.4**
  - [x] 10.7 Implement CI status propagation

    - Update dependent items on status change
    - _Requirements: 7.5_

- [x] 11. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement SLA service

  - [x] 12.1 Implement SLA model and repository


    - Create SLA entity with response/resolution time targets
    - Store escalation thresholds
    - _Requirements: 8.1_
  - [x] 12.2 Implement SLA deadline calculation

    - Calculate deadlines based on priority and category
    - Support business hours calculation
    - _Requirements: 8.2_
  - [ ]* 12.3 Write property test for SLA deadline calculation
    - **Property 22: SLA Deadline Calculation**
    - **Validates: Requirements 8.2**
  - [x] 12.4 Implement SLA breach detection

    - Check for imminent breaches
    - Mark breached tickets with timestamp
    - _Requirements: 8.3, 8.4_
  - [ ]* 12.5 Write property test for SLA breach recording
    - **Property 23: SLA Breach Recording**
    - **Validates: Requirements 8.4**
  - [x] 12.6 Implement escalation notifications

    - Trigger notifications at warning thresholds
    - _Requirements: 8.3_
  - [x] 12.7 Implement SLA metrics

    - Calculate compliance percentages
    - Generate breach statistics by category and priority
    - _Requirements: 8.5_

- [x] 13. Implement Governance service

  - [x] 13.1 Implement GovernancePolicy model and repository


    - Create policy entity with rules
    - _Requirements: 6.2_
  - [x] 13.2 Implement policy validation

    - Validate actions against policy rules
    - Enforce during ticket creation and state transitions
    - _Requirements: 6.2_
  - [x] 13.3 Implement compliance reporting

    - Generate policy adherence metrics
    - Track violations
    - _Requirements: 6.4_
  - [x] 13.4 Implement data retention

    - Archive or purge records based on retention policies
    - _Requirements: 6.5_

- [x] 14. Implement API layer

  - [x] 14.1 Create Express.js API routes


    - Define routes for all services (incidents, problems, changes, CIs, SLAs)
    - Implement OpenAPI validation middleware
    - _Requirements: 4.2, 4.4_
  - [x] 14.2 Implement rate limiting


    - Add rate limiter middleware
    - Return 429 with retry-after header
    - _Requirements: 4.5_
  - [ ]* 14.3 Write property test for rate limit response format
    - **Property 14: Rate Limit Response Format**
    - **Validates: Requirements 4.5**
  - [x] 14.4 Implement webhook dispatcher

    - Configure webhook endpoints
    - Send event notifications
    - _Requirements: 4.3_
  - [x] 14.5 Implement consistent error response structure

    - Create error handler middleware
    - Return JSON errors with consistent structure
    - _Requirements: 4.4_

- [x] 15. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
