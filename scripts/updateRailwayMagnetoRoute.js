const admin = require('firebase-admin');

class UpdateRailwayMagnetoRoute {
  constructor() {
    // Initialize Firebase Admin (reuse existing initialization)
    if (!admin.apps.length) {
      try {
        console.log('🔥 Initializing Firebase Admin...');
        const serviceAccount = require('../config/serviceAccountKey.json');
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin initialized successfully');
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        process.exit(1);
      }
    }
    this.db = admin.firestore();
  }

  async updateRoute() {
    console.log('🔄 Updating Railway Station to Magneto Mall route...');
    
    try {
      // First, get all route stops for this route to build the busStops array
      const routeStopsSnapshot = await this.db
        .collection('routeStops')
        .where('routeId', '==', 'route_raipur_004')
        .get();

      const busStops = [];
      let totalStops = 0;

      if (!routeStopsSnapshot.empty) {
        // Sort route stops by stopOrder and collect stop IDs
        const stops = routeStopsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.stopOrder - b.stopOrder);

        totalStops = stops.length;
        
        for (const stop of stops) {
          busStops.push(stop.stopId);
        }
      }

      // Update the route with proper fields
      const updatedRoute = {
        startCoordinates: {
          latitude: 21.2497,    // Raipur Railway Station coordinates
          longitude: 81.6947
        },
        endCoordinates: {
          latitude: 21.2144,    // Magneto Mall coordinates  
          longitude: 81.6736
        },
        totalDistance: 8.5,     // Distance in kilometers
        busStops: busStops,     // Array of stop IDs in order
        totalStops: totalStops, // Number of stops
        updatedAt: new Date().toISOString()
      };

      await this.db.collection('routes').doc('route_raipur_004').update(updatedRoute);
      
      console.log('✅ Route updated successfully!');
      console.log(`📍 Start coordinates: ${updatedRoute.startCoordinates.latitude}, ${updatedRoute.startCoordinates.longitude}`);
      console.log(`📍 End coordinates: ${updatedRoute.endCoordinates.latitude}, ${updatedRoute.endCoordinates.longitude}`);
      console.log(`📏 Total distance: ${updatedRoute.totalDistance} km`);
      console.log(`🚏 Total stops: ${updatedRoute.totalStops}`);
      console.log(`🚌 Bus stops: [${updatedRoute.busStops.join(', ')}]`);

    } catch (error) {
      console.error('❌ Error updating route:', error);
      throw error;
    }
  }
}

// Run the update
async function main() {
  try {
    const updater = new UpdateRailwayMagnetoRoute();
    await updater.updateRoute();
    console.log('🎉 Route update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Route update failed:', error);
    process.exit(1);
  }
}

main();