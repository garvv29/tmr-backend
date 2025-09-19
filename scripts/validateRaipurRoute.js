const admin = require('firebase-admin');

class ValidateRaipurRoute {
  constructor() {
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

  async validateRoute() {
    console.log('🔍 Validating Raipur route setup...');
    
    try {
      // Check route exists
      await this.checkRoute();
      
      // Check bus stops
      await this.checkBusStops();
      
      // Check route-stop mappings
      await this.checkRouteStops();
      
      // Validate coordinates
      await this.validateCoordinates();
      
      console.log('✅ Route validation completed successfully!');
      
    } catch (error) {
      console.error('❌ Route validation failed:', error);
      throw error;
    }
  }

  async checkRoute() {
    console.log('📍 Checking route data...');
    
    const routeDoc = await this.db.collection('routes').doc('route_raipur_004').get();
    
    if (!routeDoc.exists) {
      throw new Error('Route does not exist!');
    }
    
    const route = routeDoc.data();
    
    console.log(`   Route Name: ${route.routeName}`);
    console.log(`   Start: ${route.startLocation} (${route.startCoordinates.latitude}, ${route.startCoordinates.longitude})`);
    console.log(`   End: ${route.endLocation} (${route.endCoordinates.latitude}, ${route.endCoordinates.longitude})`);
    console.log(`   Distance: ${route.totalDistance} km`);
    console.log(`   Duration: ${route.estimatedDuration} minutes`);
    console.log(`   Total Stops: ${route.totalStops}`);
    console.log(`   Bus Stops Array: ${route.busStops.length} items`);
    
    console.log('✅ Route data looks good');
  }

  async checkBusStops() {
    console.log('🚏 Checking bus stops...');
    
    const expectedStops = [
      'stop_raipur_railway',
      'stop_ghadi_chowk', 
      'stop_marine_drive',
      'stop_telibandha',
      'stop_vip_road_chowk',
      'stop_magneto_mall'
    ];
    
    for (const stopId of expectedStops) {
      const stopDoc = await this.db.collection('busStops').doc(stopId).get();
      
      if (!stopDoc.exists) {
        throw new Error(`Bus stop ${stopId} does not exist!`);
      }
      
      const stop = stopDoc.data();
      console.log(`   ✅ ${stop.stopName} (${stop.coordinates.latitude}, ${stop.coordinates.longitude})`);
    }
    
    console.log('✅ All bus stops found');
  }

  async checkRouteStops() {
    console.log('🔗 Checking route-stop mappings...');
    
    const routeStops = await this.db.collection('routeStops')
      .where('routeId', '==', 'route_raipur_004')
      .orderBy('stopOrder')
      .get();
    
    if (routeStops.empty) {
      throw new Error('No route-stop mappings found!');
    }
    
    console.log(`   Found ${routeStops.size} route-stop mappings:`);
    
    for (const doc of routeStops.docs) {
      const mapping = doc.data();
      
      // Get stop details
      const stopDoc = await this.db.collection('busStops').doc(mapping.stopId).get();
      const stop = stopDoc.data();
      
      console.log(`   ${mapping.stopOrder}. ${stop.stopName} - ${mapping.arrivalTime} (${mapping.distanceFromStart} km)`);
    }
    
    console.log('✅ Route-stop mappings look good');
  }

  async validateCoordinates() {
    console.log('📐 Validating coordinates...');
    
    const routeStops = await this.db.collection('routeStops')
      .where('routeId', '==', 'route_raipur_004')
      .orderBy('stopOrder')
      .get();
    
    const coordinates = [];
    
    for (const doc of routeStops.docs) {
      const mapping = doc.data();
      const stopDoc = await this.db.collection('busStops').doc(mapping.stopId).get();
      const stop = stopDoc.data();
      
      const coord = {
        name: stop.stopName,
        lat: stop.coordinates.latitude,
        lng: stop.coordinates.longitude
      };
      
      coordinates.push(coord);
      
      // Check if coordinates are in Raipur range
      if (coord.lat < 21.2 || coord.lat > 21.3 || coord.lng < 81.6 || coord.lng > 81.7) {
        console.log(`   ⚠️  Warning: ${coord.name} might be outside Raipur area`);
      }
    }
    
    // Calculate distances between consecutive stops
    console.log('   Route distances:');
    for (let i = 0; i < coordinates.length - 1; i++) {
      const curr = coordinates[i];
      const next = coordinates[i + 1];
      
      const distance = this.calculateDistance(curr.lat, curr.lng, next.lat, next.lng);
      console.log(`   ${curr.name} → ${next.name}: ${distance.toFixed(2)} km`);
    }
    
    console.log('✅ Coordinate validation completed');
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Run validation
async function main() {
  try {
    const validator = new ValidateRaipurRoute();
    await validator.validateRoute();
    console.log('🎉 Route validation successful!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  }
}

main();