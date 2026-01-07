import { mockTicketGenerator } from './mock-ticket.service.js';
import { incidentService } from '../incident/incident.service.js';
import { AuthContext } from '../../models/types.js';

export class TicketSchedulerService {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private ticketCount: number = 0;
    private startTime: Date | null = null;
    private authContext: AuthContext | null = null;

    /**
     * Start automatic ticket generation
     */
    start(intervalMinutes: number = 3, authContext: AuthContext): void {
        if (this.isRunning) {
            throw new Error('Ticket scheduler is already running');
        }

        this.authContext = authContext;
        this.isRunning = true;
        this.startTime = new Date();
        this.ticketCount = 0;

        console.log(`🎫 Starting automatic ticket generation every ${intervalMinutes} minutes`);

        // Generate first ticket immediately
        this.generateTicket();

        // Set up interval for subsequent tickets
        const intervalMs = intervalMinutes * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.generateTicket();
        }, intervalMs);
    }

    /**
     * Stop automatic ticket generation
     */
    stop(): void {
        if (!this.isRunning) {
            throw new Error('Ticket scheduler is not running');
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        const endTime = new Date();
        const duration = this.startTime ? endTime.getTime() - this.startTime.getTime() : 0;
        const durationMinutes = Math.round(duration / 60000);

        console.log(`🛑 Stopped automatic ticket generation. Generated ${this.ticketCount} tickets over ${durationMinutes} minutes`);
    }

    /**
     * Get scheduler status
     */
    getStatus(): {
        isRunning: boolean;
        ticketCount: number;
        startTime: Date | null;
        uptime: number | null;
        nextTicketIn: number | null;
    } {
        const now = new Date();
        const uptime = this.startTime ? now.getTime() - this.startTime.getTime() : null;

        // Calculate next ticket time (this is approximate since we don't track exact interval timing)
        const nextTicketIn = this.isRunning && this.intervalId ? null : null;

        return {
            isRunning: this.isRunning,
            ticketCount: this.ticketCount,
            startTime: this.startTime,
            uptime: uptime,
            nextTicketIn: nextTicketIn
        };
    }

    /**
     * Generate a single ticket
     */
    private async generateTicket(): Promise<void> {
        if (!this.authContext) {
            console.error('❌ No auth context available for ticket generation');
            return;
        }

        try {
            const mockTicket = mockTicketGenerator.generateMockTicket();
            const { requesterName, ...incidentData } = mockTicket;

            const incident = await incidentService.create(incidentData, this.authContext);
            this.ticketCount++;

            console.log(`✅ Auto-generated ticket #${this.ticketCount}: ${incident.number} - ${incident.title}`);
            console.log(`   Priority: ${incident.priority} | Requester: ${requesterName} | Time: ${new Date().toISOString()}`);
        } catch (error) {
            console.error('❌ Failed to auto-generate ticket:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Force generate a ticket immediately (for testing)
     */
    async generateNow(authContext: AuthContext): Promise<void> {
        const originalAuthContext = this.authContext;
        this.authContext = authContext;
        await this.generateTicket();
        this.authContext = originalAuthContext;
    }
}

export const ticketScheduler = new TicketSchedulerService();