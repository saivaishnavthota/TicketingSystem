import { Router } from 'express';
import { incidentService } from '../../services/incident/incident.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission('create', 'incident'), async (req, res) => {
  try {
    const incident = await incidentService.create(req.body, req.auth!);
    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create incident',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
});

router.get('/:id', requirePermission('read', 'incident'), async (req, res) => {
  try {
    const incident = await incidentService.getById(req.params.id, req.auth!);
    if (!incident) {
      res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Incident not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve incident',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
});

router.put('/:id', requirePermission('update', 'incident'), async (req, res) => {
  try {
    const incident = await incidentService.update(req.params.id, req.body, req.auth!);
    res.json(incident);
  } catch (error) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update incident',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
});

router.post('/:id/transition', requirePermission('update', 'incident'), async (req, res) => {
  try {
    const { status, comment } = req.body;
    const incident = await incidentService.transition(req.params.id, status, req.auth!, comment);
    res.json(incident);
  } catch (error) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to transition incident',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
});

router.get('/', requirePermission('read', 'incident'), async (req, res) => {
  try {
    const criteria = {
      status: req.query.status as any,
      priority: req.query.priority as any,
      assignee: req.query.assignee as string,
      category: req.query.category as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
    };
    const result = await incidentService.search(criteria, req.auth!);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search incidents',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
});

export default router;
