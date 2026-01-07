import { CreateIncidentDTO, Priority } from '../../models/types.js';

interface MockTicketTemplate {
    subjects: string[];
    descriptions: string[];
    requesterNames: string[];
}

export class MockTicketGeneratorService {
    private templates: MockTicketTemplate = {
        subjects: [
            'Email server not responding',
            'Unable to access shared drive',
            'Printer not working in office',
            'VPN connection issues',
            'Application crashes on startup',
            'Database connection timeout',
            'Website loading slowly',
            'Password reset not working',
            'File server disk space full',
            'Network connectivity issues',
            'Software license expired',
            'Backup job failed',
            'Security certificate expired',
            'User account locked out',
            'Phone system down',
            'Video conferencing not working',
            'Mobile app sync issues',
            'Report generation failing',
            'API endpoint returning errors',
            'System performance degradation',
            'Login page not loading',
            'File upload functionality broken',
            'Email notifications not sending',
            'Calendar integration issues',
            'Remote desktop connection failed'
        ],
        descriptions: [
            'Users are experiencing intermittent connectivity issues when trying to access the service.',
            'The system appears to be running slowly and users are reporting timeout errors.',
            'Multiple users have reported that they cannot complete their daily tasks due to this issue.',
            'The service has been unavailable for the past 30 minutes affecting productivity.',
            'Error messages are appearing when users try to perform routine operations.',
            'The application is crashing unexpectedly during peak usage hours.',
            'Users are unable to save their work and are losing data.',
            'The system is returning HTTP 500 errors when processing requests.',
            'Performance has degraded significantly since the last update.',
            'Users are experiencing authentication failures when logging in.',
            'The service is not responding to requests and appears to be down.',
            'Data synchronization between systems has stopped working.',
            'Users report that the interface is not loading properly.',
            'Critical business processes are being impacted by this outage.',
            'The system is generating excessive error logs and alerts.',
            'Users cannot access important files needed for their work.',
            'The service is experiencing high latency and slow response times.',
            'Automated processes are failing to complete successfully.',
            'Users are seeing blank pages instead of the expected content.',
            'The system is not processing transactions correctly.'
        ],
        requesterNames: [
            'John Smith',
            'Sarah Johnson',
            'Michael Brown',
            'Emily Davis',
            'David Wilson',
            'Lisa Anderson',
            'Robert Taylor',
            'Jennifer Martinez',
            'Christopher Lee',
            'Amanda White',
            'Matthew Garcia',
            'Jessica Rodriguez',
            'Daniel Thompson',
            'Ashley Martinez',
            'James Anderson',
            'Michelle Thomas',
            'Kevin Jackson',
            'Stephanie White',
            'Brian Harris',
            'Nicole Clark',
            'Ryan Lewis',
            'Samantha Walker',
            'Justin Hall',
            'Rachel Allen',
            'Brandon Young'
        ]
    };

    private priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

    /**
     * Generate a single mock ticket
     */
    generateMockTicket(): CreateIncidentDTO & { requesterName: string } {
        const subject = this.getRandomElement(this.templates.subjects);
        const description = this.getRandomElement(this.templates.descriptions);
        const requesterName = this.getRandomElement(this.templates.requesterNames);
        const priority = this.getRandomPriority();

        return {
            title: subject,
            description: description,
            priority: priority,
            category: 'General', // Default category since it's required by CreateIncidentDTO
            requesterName: requesterName
        };
    }

    /**
     * Generate multiple mock tickets
     */
    generateMockTickets(count: number): (CreateIncidentDTO & { requesterName: string })[] {
        const tickets = [];
        for (let i = 0; i < count; i++) {
            tickets.push(this.generateMockTicket());
        }
        return tickets;
    }

    /**
     * Generate mock tickets with weighted priority distribution
     * Low: 40%, Medium: 35%, High: 20%, Critical: 5%
     */
    private getRandomPriority(): Priority {
        const random = Math.random();
        if (random < 0.05) return 'Critical';
        if (random < 0.25) return 'High';
        if (random < 0.60) return 'Medium';
        return 'Low';
    }

    /**
     * Get random element from array
     */
    private getRandomElement<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Add custom templates for more variety
     */
    addCustomTemplates(templates: Partial<MockTicketTemplate>): void {
        if (templates.subjects) {
            this.templates.subjects.push(...templates.subjects);
        }
        if (templates.descriptions) {
            this.templates.descriptions.push(...templates.descriptions);
        }
        if (templates.requesterNames) {
            this.templates.requesterNames.push(...templates.requesterNames);
        }
    }
}

export const mockTicketGenerator = new MockTicketGeneratorService();