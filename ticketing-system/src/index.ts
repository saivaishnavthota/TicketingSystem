import express from 'express';
import incidentsRouter from './api/routes/incidents.routes.js';
import mockGeneratorRouter from './api/routes/mock-generator.routes.js';
import mockGeneratorSimpleRouter from './api/routes/mock-generator-simple.routes.js';
import { rateLimit } from './middleware/rate-limit.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`ITSM Platform API listening on port ${PORT}`);
});

export default app;
