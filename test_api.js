// Test file to check all our backend APIs
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPIs() {
  console.log('🚀 Testing Track My Ride Backend APIs\n');

  try {
    // 1. Test Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // 2. Initialize Default Roles
    console.log('2️⃣ Initializing Default Roles...');
    const rolesInitResponse = await axios.post(`${BASE_URL}/roles/initialize`);
    console.log('✅ Roles Initialized:', rolesInitResponse.data);
    console.log('');

    // 3. Get All Roles
    console.log('3️⃣ Getting All Roles...');
    const allRolesResponse = await axios.get(`${BASE_URL}/roles`);
    console.log('✅ All Roles:', allRolesResponse.data);
    console.log('');

    // 4. Test User Login (without actual phone verification for now)
    console.log('4️⃣ Testing User Login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
        phoneNumber: '+919876543210'
      });
      console.log('✅ Login Response:', loginResponse.data);
    } catch (error) {
      console.log('ℹ️ User not found (expected):', error.response?.data?.error);
    }
    console.log('');

    console.log('🎉 All API tests completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Server is running properly ✅');
    console.log('2. Default roles are created ✅');
    console.log('3. Ready to create users and test authentication');

  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:3000');
    console.log('✅ Server is running on port 3000\n');
    await testAPIs();
  } catch (error) {
    console.log('❌ Server is not running on port 3000');
    console.log('👉 Please start the server first:');
    console.log('   cd "c:\\Users\\garvc\\Desktop\\Track My Ride\\backend"');
    console.log('   npm start');
  }
}

checkServer();