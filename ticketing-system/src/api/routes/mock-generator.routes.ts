import { Router } from 'express';
import { mockTicketGenerator } from '../../services/mock-generator/mock-ticket.service.js';
import { incidentService } from '../../services/incident/incident.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * Generate and create mock tickets
 * POST /api/mock-generator/tickets
 * Query params:
 * - count: number of tickets to generate (default: 1, max: 50)
 * - createInSystem: whether to actually create the tickets in the system (default: false)
 */
router.post('/tickets', requirePermission('create', 'incident'), async (req, res) => {
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
 * GET /api/mock-generator/ticket
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
 * Bulk generate and create tickets with scheduling
 * POST /api/mock-generator/bulk-create
 * Body:
 * - count: number of tickets to create
 * - intervalSeconds: interval between ticket creation (default: 5 seconds)
 * - maxConcurrent: maximum concurrent creations (default: 5)
 */
router.post('/bulk-create', requirePermission('create', 'incident'), async (req, res) => {
    try {
        const { count = 10, intervalSeconds = 5, maxConcurrent = 5 } = req.body;

        if (count > 100) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Maximum 100 tickets can be created in bulk',
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }

        // Start the bulk creation process asynchronously
        const creationPromise = bulkCreateTickets(count, intervalSeconds, maxConcurrent, req.auth!);

        res.status(202).json({
            message: `Bulk ticket creation started. Creating ${count} tickets with ${intervalSeconds}s intervals.`,
            status: 'in_progress',
            estimatedCompletionTime: new Date(Date.now() + (count * intervalSeconds * 1000)).toISOString(),
            timestamp: new Date().toISOString()
        });

        // Execute the bulk creation (fire and forget)
        creationPromise.catch(error => {
            console.error('Bulk ticket creation failed:', error);
        });

    } catch (error) {
        res.status(500).json({
            error: {
                code: 'BULK_CREATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to start bulk ticket creation',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
});

/**
 * Helper method for bulk ticket creation
 */
async function bulkCreateTickets(count: number, intervalSeconds: number, maxConcurrent: number, authContext: any) {
    const semaphore = new Array(maxConcurrent).fill(null);
    let completed = 0;

    for (let i = 0; i < count; i++) {
        // Wait for available slot
        await Promise.race(semaphore.filter(p => p !== null));

        // Create ticket
        const slotIndex = semaphore.findIndex(p => p === null);
        semaphore[slotIndex] = (async () => {
            try {
                const mockTicket = mockTicketGenerator.generateMockTicket();
                const { requesterName, ...incidentData } = mockTicket;

                await incidentService.create(incidentData, authContext);
                completed++;
                console.log(`Created mock ticket ${completed}/${count}: ${mockTicket.title}`);
            } catch (error) {
                console.error(`Failed to create mock ticket ${i + 1}:`, error);
            } finally {
                semaphore[slotIndex] = null;
            }
        })();

        // Wait for interval before next ticket
        if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
        }
    }

    // Wait for all remaining tickets to complete
    await Promise.all(semaphore.filter(p => p !== null));
    console.log(`Bulk ticket creation completed. Created ${completed}/${count} tickets.`);
}

export default router;