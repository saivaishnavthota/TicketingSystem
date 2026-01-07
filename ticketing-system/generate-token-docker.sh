#!/bin/bash

# Generate sample JWT token for Docker environment
# Usage: ./generate-token-docker.sh

echo "🐳 Generating sample JWT token in Docker environment..."
echo ""

# Generate token inside the API container
docker exec -it itsm-api node -e "
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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

const token = jwt.sign(sampleUser, JWT_SECRET, { expiresIn: '24h' });

console.log('🎫 Sample Bearer Token Generated Successfully!');
console.log('');
console.log('📋 Token Details:');
console.log('   User ID: ' + sampleUser.userId);
console.log('   Roles: ' + sampleUser.roles.join(', '));
console.log('   Permissions: ' + sampleUser.permissions.length + ' permissions');
console.log('   Expires: 24h from now');
console.log('');
console.log('🔑 Bearer Token:');
console.log('Bearer ' + token);
console.log('');
console.log('📝 Usage Examples (Docker):');
console.log('');
console.log('1️⃣ Generate single mock ticket:');
console.log('curl -X GET \"http://localhost:3000/api/mock-generator/ticket\" \\\\');
console.log('  -H \"Authorization: Bearer ' + token + '\"');
console.log('');
console.log('2️⃣ Generate 5 mock tickets (preview):');
console.log('curl -X POST \"http://localhost:3000/api/mock-generator/tickets?count=5&createInSystem=false\" \\\\');
console.log('  -H \"Authorization: Bearer ' + token + '\"');
console.log('');
console.log('3️⃣ Create 3 tickets in system:');
console.log('curl -X POST \"http://localhost:3000/api/mock-generator/tickets?count=3&createInSystem=true\" \\\\');
console.log('  -H \"Authorization: Bearer ' + token + '\" \\\\');
console.log('  -H \"Content-Type: application/json\"');
console.log('');
console.log('4️⃣ Bulk create 10 tickets with 5s intervals:');
console.log('curl -X POST \"http://localhost:3000/api/mock-generator/bulk-create\" \\\\');
console.log('  -H \"Authorization: Bearer ' + token + '\" \\\\');
console.log('  -H \"Content-Type: application/json\" \\\\');
console.log('  -d \'{\"count\": 10, \"intervalSeconds\": 5, \"maxConcurrent\": 2}\'');
console.log('');
console.log('⚠️  Note: Your API is running at http://localhost:3000');
"

echo ""
echo "✅ Token generated successfully!"
echo "💡 You can also run: make shell-api to get a shell inside the container"