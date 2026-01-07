import * as fc from 'fast-check';

// Configure fast-check to run 100 iterations minimum as per design doc
export const propertyTestConfig = {
  numRuns: 100,
  verbose: true
};

// Common arbitraries for property testing
export const arbitraries = {
  priority: fc.constantFrom('Critical', 'High', 'Medium', 'Low'),
  incidentStatus: fc.constantFrom('New', 'InProgress', 'Pending', 'Resolved', 'Closed'),
  problemStatus: fc.constantFrom('New', 'UnderInvestigation', 'KnownError', 'Resolved', 'Closed'),
  changeType: fc.constantFrom('Standard', 'Normal', 'Emergency'),
  changeStatus: fc.constantFrom('Draft', 'Submitted', 'Approved', 'Rejected', 'Scheduled', 'InProgress', 'Completed', 'Failed', 'Cancelled'),
  riskLevel: fc.constantFrom('Low', 'Medium', 'High', 'Critical'),
  ciType: fc.constantFrom('Server', 'Application', 'Database', 'Network', 'Service', 'Other'),
  ciStatus: fc.constantFrom('Active', 'Inactive', 'Maintenance', 'Retired'),
  relationshipType: fc.constantFrom('DependsOn', 'Contains', 'ConnectsTo', 'RunsOn', 'UsedBy'),
  uuid: fc.uuid(),
  nonEmptyString: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  futureDate: fc.date({ min: new Date() }),
  pastDate: fc.date({ max: new Date() })
};
