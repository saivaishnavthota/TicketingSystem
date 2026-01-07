// Generate a sample JWT token for testing the Mock Ticket Generator API
// Run with: node generate-sample-token.js

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'; // Extended for testing

// Sample user data for testing
const sampleUser = {
  userId: 'test-user-123',
  roles: ['admin', 'incident-manager'],
  permissions: [
    'create:incident',
    'read:incident', 
    'update:incident',
    'delete:incident',
    'create:problem',
    'read:problem',
    'update:problem'
  ],
  type: 'access'
};

function generateSampleToken() {
  try {
    const token = jwt.sign(sampleUser, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    console.log('🎫 Sample Bearer Token Generated Successfully!\n');
    console.log('📋 Token Details:');
    console.log(`   User ID: ${sampleUser.userId}`);
    console.log(`   Roles: ${sampleUser.roles.join(', ')}`);
    console.log(`   Permissions: ${sampleUser.permissions.length} permissions`);
    console.log(`   Expires: ${JWT_EXPIRY} from now\n`);
    
    console.log('🔑 Bearer Token:');
    console.log(`Bearer ${token}\n`);
    
    console.log('📝 Usage Examples:\n');
    
    console.log('1️⃣ Generate single mock ticket:');
    console.log(`curl -X GET "http://localhost:3000/api/mock-generator/ticket" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"\n`);
    
    console.log('2️⃣ Generate 5 mock tickets (preview):');
    console.log(`curl -X POST "http://localhost:3000/api/mock-generator/tickets?count=5&createInSystem=false" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"\n`);
    
    console.log('3️⃣ Create 3 tickets in system:');
    console.log(`curl -X POST "http://localhost:3000/api/mock-generator/tickets?count=3&createInSystem=true" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json"\n`);
    
    console.log('4️⃣ Bulk create 10 tickets with 5s intervals:');
    console.log(`curl -X POST "http://localhost:3000/api/mock-generator/bulk-create" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"count": 10, "intervalSeconds": 5, "maxConcurrent": 2}'\n`);
    
    console.log('⚠️  Note: Make sure your server is running with: npm run dev');
    
    return token;
    
  } catch (error) {
    console.error('❌ Failed to generate token:', error.message);
    return null;
  }
}

// Generate and display the token
const token = generateSampleToken();

// Also export for programmatic use
export { token as sampleBearerToken };