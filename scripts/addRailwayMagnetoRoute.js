const admin = require('firebase-admin');

class AddRailwayMagnetoRoute {
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

  async addRailwayMagnetoRoute() {
    console.log('🚂➡️🏢 Adding Railway Station to Magneto Mall route...');
    
    // Add the new route
    const route = {
      id: 'route_raipur_004',
      routeName: 'Railway Station to Magneto Mall',
      routeNumber: 'R004',
      startLocation: 'Raipur Railway Station',
      endLocation: 'Magneto Mall',
      distance: 8.5,
      estimatedDuration: 45,
      operatorId: 'operator_cg_001',
      busId: 'bus_raipur_001',
      isActive: true,
      fare: 20,
      routeType: 'city',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.db.collection('routes').doc(route.id).set(route);
    console.log('✅ Added route:', route.routeName);

    // Add intermediate stops (including minor stops)
    const additionalStops = [
      // Minor stop - Platform Junction
      {
        id: 'stop_raipur_009',
        stopName: 'Platform Junction',
        stopCode: 'PLJ009',
        coordinates: {
          latitude: 21.2520,
          longitude: 81.6150
        },
        address: 'Platform Junction, Near Railway Station, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Junction'],
        isActive: true,
        isMinorStop: true, // New field to identify minor stops
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Minor stop - Gandhi Chowk
      {
        id: 'stop_raipur_010',
        stopName: 'Gandhi Chowk',
        stopCode: 'GDC010',
        coordinates: {
          latitude: 21.2495,
          longitude: 81.6180
        },
        address: 'Gandhi Chowk, Main Road, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Market', 'ATM'],
        isActive: true,
        isMinorStop: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Minor stop - Medical College Junction
      {
        id: 'stop_raipur_011',
        stopName: 'Medical College Junction',
        stopCode: 'MCJ011',
        coordinates: {
          latitude: 21.2400,
          longitude: 81.6300
        },
        address: 'Medical College Junction, Ring Road, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Hospital', 'Medical College'],
        isActive: true,
        isMinorStop: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Minor stop - Ring Road Square
      {
        id: 'stop_raipur_012',
        stopName: 'Ring Road Square',
        stopCode: 'RRS012',
        coordinates: {
          latitude: 21.2350,
          longitude: 81.6380
        },
        address: 'Ring Road Square, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Shopping', 'Restaurants'],
        isActive: true,
        isMinorStop: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Add the new stops
    for (const stop of additionalStops) {
      await this.db.collection('busStops').doc(stop.id).set(stop);
    }
    console.log(`✅ Added ${additionalStops.length} additional stops`);

    // Add route stops (including minor stops that bus doesn't stop at)
    const routeStops = [
      // Stop 1: Railway Station (Bus stops here)
      {
        id: 'rs_004_001',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_001', // Railway Station
        stopOrder: 1,
        arrivalTime: '06:00',
        departureTime: '06:02',
        busStopsHere: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 2: Platform Junction (Minor stop - bus doesn't stop)
      {
        id: 'rs_004_002',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_009', // Platform Junction
        stopOrder: 2,
        arrivalTime: '06:05',
        departureTime: '06:05', // Same time = no stop
        busStopsHere: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 3: Gandhi Chowk (Minor stop - bus doesn't stop)
      {
        id: 'rs_004_003',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_010', // Gandhi Chowk
        stopOrder: 3,
        arrivalTime: '06:08',
        departureTime: '06:08',
        busStopsHere: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 4: Nagar Clock Tower (Bus stops here)
      {
        id: 'rs_004_004',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_005', // Nagar Clock Tower
        stopOrder: 4,
        arrivalTime: '06:12',
        departureTime: '06:14',
        busStopsHere: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 5: Civil Lines (Bus stops here)
      {
        id: 'rs_004_005',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_006', // Civil Lines
        stopOrder: 5,
        arrivalTime: '06:18',
        departureTime: '06:20',
        busStopsHere: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 6: Pandri (Bus stops here)
      {
        id: 'rs_004_006',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_007', // Pandri
        stopOrder: 6,
        arrivalTime: '06:25',
        departureTime: '06:27',
        busStopsHere: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 7: Medical College Junction (Minor stop - bus doesn't stop)
      {
        id: 'rs_004_007',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_011', // Medical College Junction
        stopOrder: 7,
        arrivalTime: '06:32',
        departureTime: '06:32',
        busStopsHere: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 8: Ring Road Square (Minor stop - bus doesn't stop)
      {
        id: 'rs_004_008',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_012', // Ring Road Square
        stopOrder: 8,
        arrivalTime: '06:38',
        departureTime: '06:38',
        busStopsHere: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Stop 9: Magneto Mall (Bus stops here - Final destination)
      {
        id: 'rs_004_009',
        routeId: 'route_raipur_004',
        stopId: 'stop_raipur_004', // Magneto Mall
        stopOrder: 9,
        arrivalTime: '06:45',
        departureTime: '06:45',
        busStopsHere: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Add all route stops
    for (const routeStop of routeStops) {
      await this.db.collection('routeStops').doc(routeStop.id).set(routeStop);
    }
    
    console.log(`✅ Added ${routeStops.length} route stops (including minor stops)`);
    console.log('🎉 Railway Station to Magneto Mall route setup complete!');
  }

  async run() {
    try {
      await this.addRailwayMagnetoRoute();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  }
}

// Run the script
const setupRoute = new AddRailwayMagnetoRoute();
setupRoute.run();