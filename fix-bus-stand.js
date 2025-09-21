const { db } = require('./config/firebase');

async function fixBusStandCoordinates() {
  try {
    console.log('🔧 Fixing bus stand coordinates...');
    
    const busStopsRef = db.collection('busStops');
    const snapshot = await busStopsRef.where('stopName', '==', 'bus stand').get();
    
    if (snapshot.empty) {
      console.log('❌ Bus stand not found');
      return;
    }
    
    console.log(`📍 Found ${snapshot.size} bus stand(s)`);
    
    for (const doc of snapshot.docs) {
      console.log('Current data:', doc.data());
      
      // Update with proper Raipur coordinates (Railway Station area)
      await doc.ref.update({
        coordinates: {
          _latitude: 21.2551,
          _longitude: 81.6296
        },
        latitude: 21.2551,
        longitude: 81.6296,
        address: 'Railway Station, Raipur, Chhattisgarh',
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Updated bus stand coordinates to Raipur Railway Station');
    }
    
    // Verify the update
    const updatedSnapshot = await busStopsRef.where('stopName', '==', 'bus stand').get();
    updatedSnapshot.forEach(doc => {
      console.log('✅ Verified updated data:', doc.data());
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixBusStandCoordinates();