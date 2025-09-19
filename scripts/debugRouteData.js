const admin = require('firebase-admin');

class DebugRouteData {
  constructor() {
    if (!admin.apps.length) {
      try {
        const serviceAccount = require('../config/serviceAccountKey.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } catch (error) {
        console.error('Firebase init error:', error.message);
        process.exit(1);
      }
    }
    this.db = admin.firestore();
  }

  async debugRoute() {
    try {
      console.log('🔍 Debugging route_raipur_004 data...\n');
      
      // 1. Check route data
      const routeDoc = await this.db.collection('routes').doc('route_raipur_004').get();
      const route = routeDoc.data();
      
      console.log('📍 ROUTE DATA:');
      console.log(`   Start: ${route.startLocation}`);
      console.log(`   Start Coords: ${route.startCoordinates.latitude}, ${route.startCoordinates.longitude}`);
      console.log(`   End: ${route.endLocation}`);
      console.log(`   End Coords: ${route.endCoordinates.latitude}, ${route.endCoordinates.longitude}`);
      console.log(`   Bus Stops Array: ${JSON.stringify(route.busStops)}\n`);
      
      // 2. Check individual bus stops
      console.log('🚏 BUS STOPS DATA:');
      for (const stopId of route.busStops) {
        const stopDoc = await this.db.collection('busStops').doc(stopId).get();
        if (stopDoc.exists) {
          const stop = stopDoc.data();
          console.log(`   ${stopId}:`);
          console.log(`     Name: ${stop.stopName}`);
          console.log(`     Coords: ${stop.coordinates.latitude}, ${stop.coordinates.longitude}`);
          console.log(`     Address: ${stop.address}`);
        } else {
          console.log(`   ❌ ${stopId}: NOT FOUND`);
        }
      }
      
      // 3. Check route-stops mappings (without orderBy to avoid index requirement)
      console.log('\n🔗 ROUTE-STOPS MAPPINGS:');
      const routeStops = await this.db.collection('routeStops')
        .where('routeId', '==', 'route_raipur_004')
        .get();
      
      // Sort in memory
      const sortedDocs = routeStops.docs.sort((a, b) => a.data().stopOrder - b.data().stopOrder);
      
      for (const doc of sortedDocs) {
        const mapping = doc.data();
        console.log(`   ${mapping.stopOrder}. Stop ID: ${mapping.stopId}`);
        console.log(`      Arrival: ${mapping.arrivalTime}`);
        console.log(`      Distance: ${mapping.distanceFromStart} km`);
        console.log(`      Bus Stops Here: ${mapping.busStopsHere}`);
      }
      
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }
}

// Run debug
new DebugRouteData().debugRoute().then(() => process.exit(0));