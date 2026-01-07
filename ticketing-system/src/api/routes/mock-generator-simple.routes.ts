import { Router } from 'express';
import { mockTicketGenerator } from '../../services/mock-generator/mock-ticket.service.js';
import { ticketScheduler } from '../../services/mock-generator/ticket-scheduler.service.js';
import { incidentService } from '../../services/incident/incident.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * Generate and create mock tickets (simplified version without complex permissions)
 * POST /api/mock-generator-simple/tickets
 * Query params:
 * - count: number of tickets to generate (default: 1, max: 50)
 * - createInSystem: whether to actually create the tickets in the system (default: false)
 */
router.post('/tickets', async (req, res) => {
    try {
        const count = Math.min(parseInt(req.query.count as string) || 1, 50);
        const createInSystem = req.query.createInSystem === 'true';

        // Generate mock tickets
        const mockTickets = mockTicketGenerator.generateMockTickets(count);

        if (createInSystem) {
            // Create tickets in the system
            const createdTickets = [];
            for (const mockTicket of mockTickets) {
                try {
                    // Extract requesterName and create the incident DTO
                    const { requesterName, ...incidentData } = mockTicket;

                    const incident = await incidentService.create(incidentData, req.auth!);
                    createdTickets.push({
                        ...incident,
                        requesterName
                    });
                } catch (error) {
                    console.error('Failed to create mock ticket:', error);
                    // Continue with other tickets even if one fails
                }
            }

            res.status(201).json({
                message: `Successfully generated and created ${createdTickets.length} mock tickets`,
                tickets: createdTickets,
                timestamp: new Date().toISOString()
            });
        } else {
            // Just return the generated mock data without creating
            res.json({
                message: `Generated ${mockTickets.length} mock tickets (not created in system)`,
                tickets: mockTickets.map(ticket => ({
                    ...ticket,
                    timestamp: new Date().toISOString()
                })),
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(500).json({
            error: {
                code: 'MOCK_GENERATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to generate mock tickets',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

/**
 * Generate a single mock ticket
 * GET /api/mock-generator-simple/ticket
 */
router.get('/ticket', async (req, res) => {
    try {
        const mockTicket = mockTicketGenerator.generateMockTicket();

        res.json({
            message: 'Generated mock ticket',
            ticket: {
                ...mockTicket,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: 'MOCK_GENERATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to generate mock ticket',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

/**
 * Start automatic ticket generation (simplified)
 * POST /api/mock-generator-simple/scheduler/start
 */
router.post('/scheduler/start', async (req, res) => {
    try {
        const { intervalMinutes = 2 } = req.body;

        if (intervalMinutes < 1 || intervalMinutes > 60) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Interval must be between 1 and 60 minutes',
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }

        ticketScheduler.start(intervalMinutes, req.auth!);

        res.json({
            message: `Automatic ticket generation started. Creating tickets every ${intervalMinutes} minutes.`,
            status: 'started',
            intervalMinutes: intervalMinutes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({
            error: {
                code: 'SCHEDULER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to start scheduler',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

/**
 * Stop automatic ticket generation
 * POST /api/mock-generator-simple/scheduler/stop
 */
router.post('/scheduler/stop', async (req, res) => {
    try {
        ticketScheduler.stop();

        res.json({
            message: 'Automatic ticket generation stopped',
            status: 'stopped',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({
            error: {
                code: 'SCHEDULER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to stop scheduler',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

/**
 * Get scheduler status
 * GET /api/mock-generator-simple/scheduler/status
 */
router.get('/scheduler/status', async (req, res) => {
    try {
        const status = ticketScheduler.getStatus();

        res.json({
            message: 'Scheduler status retrieved',
            scheduler: {
                ...status,
                uptimeMinutes: status.uptime ? Math.round(status.uptime / 60000) : null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: 'SCHEDULER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get scheduler status',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

/**
 * Generate a ticket immediately (for testing)
 * POST /api/mock-generator-simple/scheduler/generate-now
 */
router.post('/scheduler/generate-now', async (req, res) => {
    try {
        await ticketScheduler.generateNow(req.auth!);

        res.json({
            message: 'Ticket generated immediately',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: 'GENERATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to generate ticket',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

export default router;