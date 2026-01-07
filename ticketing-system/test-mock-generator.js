// Simple test script for the Mock Ticket Generator API
// Run this after starting the server with: node test-mock-generator.js

const BASE_URL = 'http://localhost:3000';

// Mock authentication token (replace with real token in production)
const AUTH_TOKEN = 'your-jwt-token-here';

async function testMockGenerator() {
    console.log('🎫 Testing Mock Ticket Generator API\n');

    try {
        // Test 1: Generate a single mock ticket (preview)
        console.log('1️⃣ Testing single ticket generation (preview)...');
        const singleTicketResponse = await fetch(`${BASE_URL}/api/mock-generator/ticket`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        
        if (singleTicketResponse.ok) {
            const singleTicket = await singleTicketResponse.json();
            console.log('✅ Single ticket generated:');
            console.log(`   Title: ${singleTicket.ticket.title}`);
            console.log(`   Priority: ${singleTicket.ticket.priority}`);
            console.log(`   Category: ${singleTicket.ticket.category}`);
            console.log(`   Requester: ${singleTicket.ticket.requesterName}\n`);
        } else {
            console.log('❌ Failed to generate single ticket\n');
        }

        // Test 2: Generate multiple tickets (preview mode)
        console.log('2️⃣ Testing multiple tickets generation (preview)...');
        const multipleTicketsResponse = await fetch(`${BASE_URL}/api/mock-generator/tickets?count=3&createInSystem=false`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (multipleTicketsResponse.ok) {
            const multipleTickets = await multipleTicketsResponse.json();
            console.log(`✅ Generated ${multipleTickets.tickets.length} tickets (preview mode):`);
            multipleTickets.tickets.forEach((ticket, index) => {
                console.log(`   ${index + 1}. ${ticket.title} [${ticket.priority}]`);
            });
            console.log();
        } else {
            console.log('❌ Failed to generate multiple tickets\n');
        }

        // Test 3: Create tickets in system (uncomment if you have proper auth)
        /*
        console.log('3️⃣ Testing ticket creation in system...');
        const createTicketsResponse = await fetch(`${BASE_URL}/api/mock-generator/tickets?count=2&createInSystem=true`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (createTicketsResponse.ok) {
            const createdTickets = await createTicketsResponse.json();
            console.log(`✅ Created ${createdTickets.tickets.length} tickets in system:`);
            createdTickets.tickets.forEach((ticket, index) => {
                console.log(`   ${index + 1}. ${ticket.number}: ${ticket.title}`);
            });
            console.log();
        } else {
            console.log('❌ Failed to create tickets in system\n');
        }
        */

        console.log('🎉 Mock Ticket Generator API test completed!');
        console.log('\n📝 To use with real authentication:');
        console.log('   1. Start the server: npm run dev');
        console.log('   2. Get a valid JWT token from the auth endpoint');
        console.log('   3. Replace AUTH_TOKEN in this script');
        console.log('   4. Uncomment the creation test above');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the server is running on http://localhost:3000');
        console.log('   Start it with: npm run dev');
    }
}

// Run the test
testMockGenerator();