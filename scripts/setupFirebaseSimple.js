const admin = require('firebase-admin');
require('dotenv').config();

// Simplified Firebase setup script - Firestore only
class FirebaseSetup {
  constructor() {
    if (!admin.apps.length) {
      try {
        console.log('🔥 Initializing Firebase Admin...');
        const serviceAccount = require('../config/serviceAccountKey.json');
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin initialized successfully (Firestore only)');
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        process.exit(1);
      }
    }
    
    this.db = admin.firestore();
  }

  async createInitialData() {
    console.log('🔥 Setting up Firestore Database...');
    
    try {
      await this.createSampleCities();
      await this.createSampleBusOperators();
      await this.createSampleBusStops();
      await this.createSampleDrivers();
      await this.createSampleBuses();
      await this.createSampleRoutes();
      await this.createSampleRouteStops();
      await this.createSampleSchedules();
      
      console.log('✅ Firestore Database setup completed successfully!');
      console.log('📱 You can now start the backend server with: npm start');
      
    } catch (error) {
      console.error('❌ Error setting up Firestore Database:', error);
      throw error;
    }
  }

  async createSampleCities() {
    console.log('📍 Creating sample cities...');
    
    const cities = [
      {
        cityName: "Amritsar",
        state: "Punjab",
        country: "India",
        coordinates: { latitude: 31.6340, longitude: 74.8723 },
        isActive: true,
        majorLandmarks: ["Golden Temple", "Jallianwala Bagh", "Wagah Border"]
      },
      {
        cityName: "Chandigarh", 
        state: "Punjab",
        country: "India",
        coordinates: { latitude: 30.7333, longitude: 76.7794 },
        isActive: true,
        majorLandmarks: ["Rock Garden", "Sukhna Lake", "Rose Garden"]
      },
      {
        cityName: "Ludhiana",
        state: "Punjab", 
        country: "India",
        coordinates: { latitude: 30.9009, longitude: 75.8573 },
        isActive: true,
        majorLandmarks: ["Punjab Agricultural University", "Clock Tower"]
      }
    ];

    for (const city of cities) {
      const docRef = this.db.collection('cities').doc();
      await docRef.set({
        id: docRef.id,
        ...city,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${cities.length} cities`);
  }

  async createSampleBusOperators() {
    console.log('🏢 Creating sample bus operators...');
    
    const operators = [
      {
        operatorName: "Punjab Roadways",
        operatorType: "government",
        registrationNumber: "PB-OP-2023-001",
        contactInfo: {
          phone: "+91-172-2740363",
          email: "info@punjabroadways.gov.in"
        },
        address: {
          city: "Chandigarh",
          state: "Punjab"
        },
        operatingStates: ["Punjab", "Haryana", "Delhi"],
        isActive: true
      },
      {
        operatorName: "SSIPMT",
        operatorType: "government",
        registrationNumber: "PB-OP-2023-002", 
        contactInfo: {
          phone: "+91-183-2555000",
          email: "info@ssipmt.org"
        },
        address: {
          city: "Amritsar",
          state: "Punjab"
        },
        operatingStates: ["Punjab"],
        isActive: true
      }
    ];

    for (const operator of operators) {
      const docRef = this.db.collection('busOperators').doc();
      await docRef.set({
        id: docRef.id,
        ...operator,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${operators.length} bus operators`);
  }

  async createSampleBusStops() {
    console.log('🚏 Creating sample bus stops...');
    
    const busStops = [
      {
        stopName: "Golden Temple",
        stopCode: "AMR001",
        coordinates: { latitude: 31.6200, longitude: 74.8765 },
        address: "Golden Temple Road, Amritsar",
        city: "Amritsar",
        state: "Punjab",
        amenities: ["shelter", "seating", "lighting"],
        isActive: true
      },
      {
        stopName: "Bus Stand Amritsar", 
        stopCode: "AMR002",
        coordinates: { latitude: 31.6307, longitude: 74.8756 },
        address: "GT Road, Near Railway Station, Amritsar",
        city: "Amritsar",
        state: "Punjab",
        amenities: ["shelter", "seating", "waiting_room"],
        isActive: true
      }
    ];

    for (const stop of busStops) {
      const docRef = this.db.collection('busStops').doc();
      await docRef.set({
        id: docRef.id,
        ...stop,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${busStops.length} bus stops`);
  }

  async createSampleDrivers() {
    console.log('👨‍💼 Creating sample drivers...');
    
    // Get first operator for assignment
    const operatorsSnapshot = await this.db.collection('busOperators').limit(1).get();
    if (operatorsSnapshot.empty) {
      console.log('⚠️ No operators found, skipping drivers');
      return;
    }
    const operatorId = operatorsSnapshot.docs[0].id;

    const drivers = [
      {
        driverName: "Rajesh Kumar",
        phoneNumber: "+91-98765-43210",
        licenseNumber: "PB-DL-2020-123456",
        licenseType: "commercial",
        licenseExpiry: "2030-06-15",
        operatorId: operatorId,
        status: "active",
        experience: 8
      }
    ];

    for (const driver of drivers) {
      const docRef = this.db.collection('drivers').doc();
      await docRef.set({
        id: docRef.id,
        ...driver,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${drivers.length} drivers`);
  }

  async createSampleBuses() {
    console.log('🚌 Creating sample buses...');
    
    // Get first operator for assignment
    const operatorsSnapshot = await this.db.collection('busOperators').limit(1).get();
    if (operatorsSnapshot.empty) {
      console.log('⚠️ No operators found, skipping buses');
      return;
    }
    const operatorId = operatorsSnapshot.docs[0].id;

    const buses = [
      {
        busNumber: "PB-01-001",
        vehicleNumber: "PB 02 AB 1234",
        busModel: "Tata Ultra 1018",
        capacity: 45,
        operatorId: operatorId,
        status: "active",
        amenities: ["ac", "cctv"],
        isActive: true
      }
    ];

    for (const bus of buses) {
      const docRef = this.db.collection('buses').doc();
      await docRef.set({
        id: docRef.id,
        ...bus,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${buses.length} buses`);
  }

  async createSampleRoutes() {
    console.log('🛣️ Creating sample routes...');
    
    // Get first operator for assignment
    const operatorsSnapshot = await this.db.collection('busOperators').limit(1).get();
    if (operatorsSnapshot.empty) {
      console.log('⚠️ No operators found, skipping routes');
      return;
    }
    const operatorId = operatorsSnapshot.docs[0].id;

    const routes = [
      {
        routeName: "Amritsar City Local",
        routeNumber: "AMR-LOC-001",
        operatorId: operatorId,
        startLocation: "Bus Stand Amritsar",
        endLocation: "Golden Temple",
        startCoordinates: { latitude: 31.6307, longitude: 74.8756 },
        endCoordinates: { latitude: 31.6200, longitude: 74.8765 },
        totalDistance: 15,
        estimatedDuration: 45,
        routeType: "local",
        isActive: true
      }
    ];

    for (const route of routes) {
      const docRef = this.db.collection('routes').doc();
      await docRef.set({
        id: docRef.id,
        ...route,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${routes.length} routes`);
  }

  async createSampleRouteStops() {
    console.log('🚏 Creating sample route stops...');
    
    const routesSnapshot = await this.db.collection('routes').limit(1).get();
    const stopsSnapshot = await this.db.collection('busStops').limit(2).get();
    
    if (routesSnapshot.empty || stopsSnapshot.empty) {
      console.log('⚠️ No routes or stops found, skipping route stops');
      return;
    }

    const routeId = routesSnapshot.docs[0].id;
    const stops = stopsSnapshot.docs;
    
    const routeStops = [
      {
        routeId: routeId,
        busStopId: stops[1].id, // Bus Stand
        stopOrder: 1,
        arrivalTime: "06:30",
        departureTime: "06:30",
        distanceFromStart: 0,
        isActive: true
      },
      {
        routeId: routeId,
        busStopId: stops[0].id, // Golden Temple 
        stopOrder: 2,
        arrivalTime: "06:45",
        departureTime: "06:45",
        distanceFromStart: 15,
        isActive: true
      }
    ];

    for (const routeStop of routeStops) {
      const docRef = this.db.collection('routeStops').doc();
      await docRef.set({
        id: docRef.id,
        ...routeStop,
        createdAt: new Date()
      });
    }
    
    console.log(`✅ Created ${routeStops.length} route stops`);
  }

  async createSampleSchedules() {
    console.log('📅 Creating sample schedules...');
    
    const routesSnapshot = await this.db.collection('routes').limit(1).get();
    const busesSnapshot = await this.db.collection('buses').limit(1).get();
    
    if (routesSnapshot.empty || busesSnapshot.empty) {
      console.log('⚠️ No routes or buses found, skipping schedules');
      return;
    }

    const routeId = routesSnapshot.docs[0].id;
    const busId = busesSnapshot.docs[0].id;

    const schedules = [
      {
        routeId: routeId,
        busId: busId,
        scheduleDate: "2025-09-18",
        departureTime: "06:30",
        arrivalTime: "07:15", 
        status: "scheduled"
      }
    ];

    for (const schedule of schedules) {
      const docRef = this.db.collection('busSchedules').doc();
      await docRef.set({
        id: docRef.id,
        ...schedule,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${schedules.length} schedules`);
  }

  static async run() {
    try {
      const setup = new FirebaseSetup();
      await setup.createInitialData();
      console.log('🎉 Database setup completed! You can now run: npm start');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
    process.exit(0);
  }
}

if (require.main === module) {
  FirebaseSetup.run();
}

module.exports = FirebaseSetup;