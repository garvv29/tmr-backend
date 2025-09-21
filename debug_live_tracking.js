const { rtdb } = require('./config/firebase');

async function debugLiveTracking() {
  try {
    console.log('🔍 Debugging live tracking data...');
    
    // Check what's in the liveTracking node
    const snapshot = await rtdb.ref('liveTracking').once('value');
    const data = snapshot.val();
    
    console.log('📊 Raw liveTracking data:', JSON.stringify(data, null, 2));
    
    if (data) {
      console.log('\n🚌 Found buses:', Object.keys(data));
      
      Object.keys(data).forEach(busId => {
        const busData = data[busId];
        console.log(`\n🚌 Bus ${busId}:`);
        console.log(`  - Route ID: ${busData.routeId}`);
        console.log(`  - Location: ${busData.latitude}, ${busData.longitude}`);
        console.log(`  - Timestamp: ${busData.timestamp}`);
        console.log(`  - Is Active: ${busData.isActive}`);
        
        // Check timestamp age
        const locationTime = new Date(busData.timestamp);
        const now = new Date();
        const ageInMinutes = (now - locationTime) / (1000 * 60);
        console.log(`  - Age: ${ageInMinutes.toFixed(2)} minutes`);
        console.log(`  - Is Recent: ${ageInMinutes <= 5}`);
        
        // Check route match
        console.log(`  - Route matches 'route_railway_magneto': ${busData.routeId === 'route_railway_magneto'}`);
      });
    } else {
      console.log('❌ No data found in liveTracking node');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugLiveTracking();