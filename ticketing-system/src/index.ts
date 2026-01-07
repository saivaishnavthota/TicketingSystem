import express from 'express';
import incidentsRouter from './api/routes/incidents.routes.js';
import mockGeneratorRouter from './api/routes/mock-generator.routes.js';
import mockGeneratorSimpleRouter from './api/routes/mock-generator-simple.routes.js';
import { rateLimit } from './middleware/rate-limit.middleware.js';
import { ticketScheduler } from './services/mock-generator/ticket-scheduler.service.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from './db/connection.js';

const app = express();
const PORT = process.env.PORT || 3000;

// System user ID for scheduler (fixed UUID)
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Ensure system user exists for scheduler operations
 */
async function ensureSystemUser(): Promise<void> {
  try {
    // Check if system user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [SYSTEM_USER_ID]
    );

    if (existingUser.rows.length === 0) {
      // Create system user
      await query(
        `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [
          SYSTEM_USER_ID,
          'system-scheduler',
          'system-scheduler@internal.local',
          'system-user-no-login' // Not a real password hash since this user shouldn't login
        ]
      );
      console.log('✅ System user created for scheduler');
    }
  } catch (error) {
    console.error('❌ Failed to ensure system user exists:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

app.use(express.json());
app.use(rateLimit);

app.get('/', (req, res) => {
  res.json({
    name: 'ITSM Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      incidents: '/api/incidents',
      mockGenerator: '/api/mock-generator',
      mockGeneratorSimple: '/api/mock-generator-simple'
    },
    documentation: 'See README.md for API documentation'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/incidents', incidentsRouter);
app.use('/api/mock-generator', mockGeneratorRouter);
app.use('/api/mock-generator-simple', mockGeneratorSimpleRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
});

app.listen(PORT, async () => {
  console.log(`ITSM Platform API listening on port ${PORT}`);

  try {
    // Ensure system user exists
    await ensureSystemUser();

    // Auto-start the ticket scheduler with 2-minute interval
    const defaultAuthContext = {
      userId: SYSTEM_USER_ID,
      roles: ['system'],
      permissions: ['incident:create'],
      tokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    };

    // Check if scheduler is already running (shouldn't be on fresh start, but safety check)
    const status = ticketScheduler.getStatus();
    if (!status.isRunning) {
      ticketScheduler.start(2, defaultAuthContext);
      console.log('🎫 Automatic ticket scheduler started (2-minute interval)');
    } else {
      console.log('🎫 Ticket scheduler already running');
    }
  } catch (error) {
    console.error('❌ Failed to initialize system:', error instanceof Error ? error.message : 'Unknown error');
  }
});

export default app;
