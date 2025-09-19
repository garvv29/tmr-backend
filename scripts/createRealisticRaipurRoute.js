const admin = require('firebase-admin');

class CreateRaipurRoute {
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

  async createRaipurRoute() {
    console.log('🚌 Creating realistic Raipur bus route...');
    
    try {
      // Delete existing route if exists
      await this.deleteExistingRoute();
      
      // Create the realistic route
      await this.createRoute();
      
      // Create bus stops with proper coordinates
      await this.createBusStops();
      
      // Create route-stop mappings
      await this.createRouteStops();
      
      console.log('🎉 Realistic Raipur route created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating route:', error);
      throw error;
    }
  }

  async deleteExistingRoute() {
    console.log('🗑️ Cleaning up existing data...');
    
    // Delete existing route
    await this.db.collection('routes').doc('route_raipur_004').delete();
    
    // Delete existing route stops
    const routeStops = await this.db.collection('routeStops')
      .where('routeId', '==', 'route_raipur_004')
      .get();
    
    for (const doc of routeStops.docs) {
      await doc.ref.delete();
    }
    
    console.log('✅ Cleanup completed');
  }

  async createRoute() {
    const route = {
      id: 'route_raipur_004',
      routeName: 'Railway Station to Magneto Mall',
      routeNumber: 'R004',
      startLocation: 'Raipur Railway Station',
      endLocation: 'Magneto Mall',
      startCoordinates: {
        latitude: 21.2497,
        longitude: 81.6947
      },
      endCoordinates: {
        latitude: 21.2144,
        longitude: 81.6736
      },
      totalDistance: 12.5, // More realistic distance
      estimatedDuration: 45, // 45 minutes
      operatorId: 'operator_cg_001',
      busStops: [], // Will be populated after creating stops
      totalStops: 6, // Including start and end
      isActive: true,
      routeType: 'city',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.db.collection('routes').doc(route.id).set(route);
    console.log('✅ Route created:', route.routeName);
  }

  async createBusStops() {
    console.log('📍 Creating bus stops with real Raipur coordinates...');
    
    const stops = [
      {
        id: 'stop_raipur_railway',
        stopName: 'Raipur Railway Station',
        stopCode: 'RRS001',
        coordinates: {
          latitude: 21.2497,
          longitude: 81.6947
        },
        address: 'Railway Station Road, Raipur, Chhattisgarh',
        amenities: ['Parking', 'Waiting Area', 'Restroom', 'Food Court'],
        isMinorStop: false,
        isActive: true
      },
      {
        id: 'stop_ghadi_chowk',
        stopName: 'Ghadi Chowk',
        stopCode: 'GDC002',
        coordinates: {
          latitude: 21.2351,
          longitude: 81.6932
        },
        address: 'Ghadi Chowk, Raipur, Chhattisgarh',
        amenities: ['Parking', 'ATM'],
        isMinorStop: false,
        isActive: true
      },
      {
        id: 'stop_marine_drive',
        stopName: 'Marine Drive',
        stopCode: 'MDR003',
        coordinates: {
          latitude: 21.2280,
          longitude: 81.6895
        },
        address: 'Marine Drive Road, Raipur, Chhattisgarh',
        amenities: ['Parking', 'Food Stalls'],
        isMinorStop: false,
        isActive: true
      },
      {
        id: 'stop_telibandha',
        stopName: 'Telibandha',
        stopCode: 'TLB004',
        coordinates: {
          latitude: 21.2201,
          longitude: 81.6834
        },
        address: 'Telibandha, Raipur, Chhattisgarh',
        amenities: ['Parking', 'Waiting Area'],
        isMinorStop: false,
        isActive: true
      },
      {
        id: 'stop_vip_road_chowk',
        stopName: 'VIP Road Chowk',
        stopCode: 'VRC005',
        coordinates: {
          latitude: 21.2167,
          longitude: 81.6789
        },
        address: 'VIP Road, Raipur, Chhattisgarh',
        amenities: ['Parking', 'ATM', 'Shopping'],
        isMinorStop: false,
        isActive: true
      },
      {
        id: 'stop_magneto_mall',
        stopName: 'Magneto Mall',
        stopCode: 'MAG006',
        coordinates: {
          latitude: 21.2144,
          longitude: 81.6736
        },
        address: 'GE Road, Magneto Mall, Raipur, Chhattisgarh',
        amenities: ['Parking', 'Shopping', 'Food Court', 'Restroom', 'ATM'],
        isMinorStop: false,
        isActive: true
      }
    ];

    for (const stop of stops) {
      await this.db.collection('busStops').doc(stop.id).set(stop);
      console.log(`✅ Created stop: ${stop.stopName}`);
    }
  }

  async createRouteStops() {
    console.log('🔗 Creating route-stop mappings...');
    
    const routeStops = [
      {
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_railway',
        stopOrder: 1,
        busStopsHere: true,
        arrivalTime: '09:00',
        departureTime: '09:02',
        distanceFromStart: 0
      },
      {
        routeId: 'route_raipur_004',
        stopId: 'stop_ghadi_chowk',
        stopOrder: 2,
        busStopsHere: true,
        arrivalTime: '09:08',
        departureTime: '09:10',
        distanceFromStart: 2.5
      },
      {
        routeId: 'route_raipur_004',
        stopId: 'stop_marine_drive',
        stopOrder: 3,
        busStopsHere: true,
        arrivalTime: '09:16',
        departureTime: '09:18',
        distanceFromStart: 5.0
      },
      {
        routeId: 'route_raipur_004',
        stopId: 'stop_telibandha',
        stopOrder: 4,
        busStopsHere: true,
        arrivalTime: '09:24',
        departureTime: '09:26',
        distanceFromStart: 7.5
      },
      {
        routeId: 'route_raipur_004',
        stopId: 'stop_vip_road_chowk',
        stopOrder: 5,
        busStopsHere: true,
        arrivalTime: '09:32',
        departureTime: '09:34',
        distanceFromStart: 10.0
      },
      {
        routeId: 'route_raipur_004',
        stopId: 'stop_magneto_mall',
        stopOrder: 6,
        busStopsHere: true,
        arrivalTime: '09:40',
        departureTime: '09:42',
        distanceFromStart: 12.5
      }
    ];

    for (const routeStop of routeStops) {
      const docRef = this.db.collection('routeStops').doc();
      await docRef.set({
        ...routeStop,
        id: docRef.id,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Created route-stop mapping: ${routeStop.stopOrder}`);
    }

    // Update route with bus stops array
    const stopIds = routeStops.map(rs => rs.stopId);
    await this.db.collection('routes').doc('route_raipur_004').update({
      busStops: stopIds,
      totalStops: stopIds.length,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Updated route with stop references');
  }
}

// Run the route creation
async function main() {
  try {
    const creator = new CreateRaipurRoute();
    await creator.createRaipurRoute();
    console.log('🎉 Realistic Raipur route setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Route creation failed:', error);
    process.exit(1);
  }
}

main();