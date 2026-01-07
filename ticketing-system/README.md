# ITSM Platform

An ITIL-compliant IT Service Management (ITSM) platform providing a unified API-driven system for incident management, problem management, and change management.

## 🚀 Quick Start with Docker

```bash
# One-command setup
./quick-start.sh

# Or using Make
make install
```

That's it! The platform will be running with PostgreSQL, Redis, and the API.

**Access:**
- API: http://localhost:3000
- Health: http://localhost:3000/health
- Docs: See [DOCKER-SETUP.md](DOCKER-SETUP.md)

## Features

- **Incident Management**: Create, track, and resolve incidents with SLA tracking
- **Problem Management**: Root cause analysis and known error management
- **Change Management**: Approval workflows and schedule conflict detection
- **CMDB**: Configuration item tracking with relationship management and impact analysis
- **RBAC**: Role-based access control with hierarchical permissions
- **Audit Logging**: Immutable audit trails for all modifications
- **SLA Management**: Automated deadline calculation and breach detection
- **Governance**: Policy enforcement and compliance reporting
- **Mock Ticket Generator**: AI-powered automatic ticket generation for testing and demos

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **API Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Testing**: Vitest (unit tests), fast-check (property-based tests)

## Project Structure

```
src/
├── api/
│   └── routes/          # API route handlers
├── db/
│   ├── connection.ts    # Database connection pool
│   └── schema.sql       # Database schema
├── middleware/          # Express middleware
├── models/
│   └── types.ts         # TypeScript type definitions
├── services/            # Business logic services
│   ├── audit/
│   ├── auth/
│   ├── change/
│   ├── cmdb/
│   ├── governance/
│   ├── incident/
│   ├── problem/
│   ├── rbac/
│   └── sla/
├── tests/
│   └── utils/           # Test utilities
├── utils/
│   └── serialization.ts # JSON serialization utilities
└── index.ts             # Application entry point
```

## Setup

### Quick Start with Docker (Recommended)

1. **Clone and configure**:
```bash
git clone <repository-url>
cd itsm-platform
cp .env.example .env
# Edit .env with your configuration
```

2. **Start services**:
```bash
# Using Make (recommended)
make install

# Or using Docker Compose directly
docker-compose up -d
```

3. **Verify deployment**:
```bash
make health
# Or
curl http://localhost:3000/health
```

That's it! The platform is now running with PostgreSQL, Redis, and the API.

### Manual Setup (Without Docker)

#### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

#### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create database and run schema:
```bash
psql -U postgres -c "CREATE DATABASE itsm_platform;"
psql -U postgres -d itsm_platform -f src/db/schema.sql
```

4. Build the project:
```bash
npm run build
```

#### Running

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Docker Commands

```bash
# Start all services
make up

# Start with production config (includes Nginx)
make up-prod

# View logs
make logs

# Stop services
make down

# Backup database
make backup

# Restore database
make restore FILE=backup.sql.gz

# Generate SSL certificates
make ssl

# See all available commands
make help
```

## API Endpoints

### Incidents

- `POST /api/incidents` - Create incident
- `GET /api/incidents/:id` - Get incident by ID
- `PUT /api/incidents/:id` - Update incident
- `POST /api/incidents/:id/transition` - Change incident status
- `GET /api/incidents` - Search incidents with filters

### Mock Ticket Generator

- `GET /api/mock-generator/ticket` - Generate single mock ticket (preview)
- `POST /api/mock-generator/tickets` - Generate multiple mock tickets
- `POST /api/mock-generator/bulk-create` - Bulk create tickets with scheduling

For detailed mock generator API documentation, see [MOCK-GENERATOR-API.md](MOCK-GENERATOR-API.md).

### Authentication

All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Core Services Implemented

### 1. Incident Service
- Create incidents with validation (required fields, priority validation)
- Status transitions with history tracking
- Problem linking with bidirectional references
- Search with filters (status, priority, assignee, category, date range)

### 2. Problem Service
- Problem creation with incident associations
- Root cause analysis recording
- Known error management
- Problem resolution cascading to linked incidents

### 3. Change Service
- Change creation with type validation
- Approval workflow with decision recording
- Schedule conflict detection
- Implementation tracking
- Failed change incident creation

### 4. CMDB Service
- Configuration item management
- Relationship tracking (bidirectional)
- Impact analysis with relationship traversal
- Status propagation to dependent items

### 5. RBAC Service
- Role assignment and management
- Permission checking with hierarchy inheritance
- Unauthorized access logging

### 6. Audit Service
- Immutable audit log creation
- Search with filters
- Access denied event logging

### 7. SLA Service
- SLA definition and deadline calculation
- Breach detection and recording
- Escalation notifications
- Compliance metrics

### 8. Governance Service
- Policy definition and validation
- Compliance reporting
- Data retention management

## Design Principles

- **API-First**: All functionality exposed through RESTful APIs
- **Event-Driven**: State changes trigger events for webhooks
- **Audit-Complete**: Every modification creates immutable audit records
- **ITIL-Aligned**: Workflows follow ITIL v4 guidelines
- **Extensible**: Modular architecture for custom workflows

## Error Handling

All API errors follow a consistent structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "timestamp": "2026-01-07T...",
    "requestId": "unique-request-id"
  }
}
```

## Rate Limiting

- 100 requests per minute per IP
- Returns HTTP 429 with Retry-After header when exceeded

## License

MIT

## Production Deployment

For production deployment with Docker, monitoring, and scaling, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Key Production Features

- **Multi-stage Docker builds** for optimized image size
- **Health checks** for all services
- **Nginx reverse proxy** with rate limiting
- **Rate limiting** and security headers
- **Automated backups** with retention policy
- **Resource limits** and auto-restart
- **Non-root user** execution for security
- **Production-optimized** PostgreSQL and Redis configurations

**Note:** This setup uses HTTP only. For HTTPS/SSL, configure it at your load balancer or reverse proxy level (e.g., AWS ALB, Cloudflare, etc.).

Quick production start:
```bash
make up-prod
```
