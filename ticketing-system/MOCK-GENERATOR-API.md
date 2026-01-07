# Mock Ticket Generator API

The Mock Ticket Generator provides AI-powered automatic ticket/incident generation for testing and demonstration purposes.

## Endpoints

### 1. Generate Single Mock Ticket (Preview)
```
GET /api/mock-generator/ticket
```

**Description:** Generates a single mock ticket without creating it in the system.

**Response:**
```json
{
  "message": "Generated mock ticket",
  "ticket": {
    "title": "Email server not responding",
    "description": "Users are experiencing intermittent connectivity issues when trying to access the service.",
    "priority": "High",
    "requesterName": "John Smith",
    "timestamp": "2026-01-07T12:00:00.000Z"
  },
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

### 2. Generate Multiple Mock Tickets
```
POST /api/mock-generator/tickets?count=5&createInSystem=false
```

**Query Parameters:**
- `count` (optional): Number of tickets to generate (default: 1, max: 50)
- `createInSystem` (optional): Whether to create tickets in the system (default: false)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (createInSystem=false):**
```json
{
  "message": "Generated 5 mock tickets (not created in system)",
  "tickets": [
    {
      "title": "VPN connection issues",
      "description": "The system appears to be running slowly and users are reporting timeout errors.",
      "priority": "Medium",
      "requesterName": "Sarah Johnson",
      "timestamp": "2026-01-07T12:00:00.000Z"
    }
  ],
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

**Response (createInSystem=true):**
```json
{
  "message": "Successfully generated and created 5 mock tickets",
  "tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "number": "INC-2026-001",
      "title": "VPN connection issues",
      "description": "The system appears to be running slowly and users are reporting timeout errors.",
      "status": "New",
      "priority": "Medium",
      "reporter": "user-id",
      "requesterName": "Sarah Johnson",
      "createdAt": "2026-01-07T12:00:00.000Z",
      "updatedAt": "2026-01-07T12:00:00.000Z"
    }
  ],
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

### 3. Bulk Create Tickets with Scheduling
```
POST /api/mock-generator/bulk-create
```

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "count": 20,
  "intervalSeconds": 10,
  "maxConcurrent": 3
}
```

**Parameters:**
- `count`: Number of tickets to create (max: 100)
- `intervalSeconds`: Interval between ticket creation (default: 5 seconds)
- `maxConcurrent`: Maximum concurrent creations (default: 5)

**Response:**
```json
{
  "message": "Bulk ticket creation started. Creating 20 tickets with 10s intervals.",
  "status": "in_progress",
  "estimatedCompletionTime": "2026-01-07T12:03:20.000Z",
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

## Mock Data Features

### Priority Distribution
The generator uses realistic priority distribution:
- **Low**: 40% of tickets
- **Medium**: 35% of tickets  
- **High**: 20% of tickets
- **Critical**: 5% of tickets

### Ticket Fields
Mock tickets are generated with the following fields:
- **Subject/Title**: Realistic IT issue descriptions
- **Priority**: High, Medium, Low, Critical (with weighted distribution)
- **Requester Name**: Realistic user names
- **Description**: Detailed problem descriptions
- **Timestamp**: Current generation time
- **Category**: Set to "General" (required by system but not varied)

### Sample Subjects
- Email server not responding
- Unable to access shared drive
- Printer not working in office
- VPN connection issues
- Application crashes on startup
- Database connection timeout
- Website loading slowly
- Password reset not working
- And many more...

### Sample Requester Names
The system includes 25+ realistic requester names for variety.

## Authentication & Permissions

All endpoints require:
1. Valid JWT token in Authorization header
2. `create` permission for `incident` resource (for creation endpoints)

## Usage Examples

### Quick Test (Generate without creating)
```bash
curl -X GET "http://localhost:3000/api/mock-generator/ticket" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create 10 Mock Tickets
```bash
curl -X POST "http://localhost:3000/api/mock-generator/tickets?count=10&createInSystem=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bulk Create with Timing Control
```bash
curl -X POST "http://localhost:3000/api/mock-generator/bulk-create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 50,
    "intervalSeconds": 15,
    "maxConcurrent": 2
  }'
```

## Error Handling

The API returns standard error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Maximum 100 tickets can be created in bulk",
    "timestamp": "2026-01-07T12:00:00.000Z",
    "requestId": "abc123"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid parameters
- `MOCK_GENERATION_ERROR`: Failed to generate mock data
- `BULK_CREATION_ERROR`: Failed to start bulk creation
- `INTERNAL_ERROR`: Unexpected server error

## Integration Notes

1. **Rate Limiting**: The API respects the global rate limiting middleware
2. **Audit Logging**: All created tickets are logged in the audit system
3. **SLA Integration**: Created tickets will have SLA deadlines calculated automatically
4. **Permissions**: Uses the existing RBAC system for access control