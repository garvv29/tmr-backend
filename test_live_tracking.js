const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test live tracking functionality
async function testLiveTracking() {
  console.log('🚌 Testing Live Tracking Functionality...\n');

  try {
    // Test 1: Update bus location
    console.log('1. Testing location update...');
    const locationData = {
      latitude: 21.2497,
      longitude: 81.6297,
      speed: 35,
      heading: 180,
      timestamp: new Date().toISOString(),
      routeId: 'route_railway_magneto',
      currentStopIndex: 2
    };

    const updateResponse = await axios.post(`${BASE_URL}/api/location/update`, {
      busId: 'CG04HC1212',
      ...locationData
    });

    console.log('✅ Location update response:', updateResponse.data);

    // Test 2: Get live location
    console.log('\n2. Testing get live location...');
    const liveResponse = await axios.get(`${BASE_URL}/api/location/live/CG04HC1212`);
    console.log('✅ Live location response:', liveResponse.data);

    // Test 3: Get Route 004 live buses
    console.log('\n3. Testing Route 004 live buses...');
    const routeLiveResponse = await axios.get(`${BASE_URL}/api/location/route004/live`);
    console.log('✅ Route 004 live buses:', routeLiveResponse.data);

    // Test 4: Search bus by license plate
    console.log('\n4. Testing license plate search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/bus/search/license/CG04HC1212`);
    console.log('✅ License plate search:', searchResponse.data);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testLiveTracking();