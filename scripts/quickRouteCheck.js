const admin = require('firebase-admin');

// Simple route checker
class QuickRouteCheck {
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

  async checkRoute() {
    try {
      console.log('🔍 Checking route_raipur_004...');
      
      const routeDoc = await this.db.collection('routes').doc('route_raipur_004').get();
      
      if (!routeDoc.exists) {
        console.log('❌ Route not found');
        return;
      }
      
      const route = routeDoc.data();
      console.log('✅ Route found:');
      console.log(`   Name: ${route.routeName}`);
      console.log(`   ${route.startLocation} → ${route.endLocation}`);
      console.log(`   Distance: ${route.totalDistance} km`);
      console.log(`   Duration: ${route.estimatedDuration} min`);
      
      // Check stops
      const routeStops = await this.db.collection('routeStops')
        .where('routeId', '==', 'route_raipur_004')
        .get();
      
      console.log(`   Stops: ${routeStops.size}`);
      
      if (routeStops.size > 0) {
        console.log('   Stop Details:');
        const sortedDocs = routeStops.docs.sort((a, b) => a.data().stopOrder - b.data().stopOrder);
        
        for (const doc of sortedDocs) {
          const stopData = doc.data();
          const stopDoc = await this.db.collection('busStops').doc(stopData.stopId).get();
          const stop = stopDoc.data();
          
          console.log(`     ${stopData.stopOrder}. ${stop.stopName} (${stopData.arrivalTime})`);
        }
      }
      
      console.log('🎉 Route check completed!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run check
new QuickRouteCheck().checkRoute().then(() => process.exit(0));