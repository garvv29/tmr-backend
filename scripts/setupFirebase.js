const admin = require('firebase-admin');
require('dotenv').config(); // Load environment variables

// Firebase setup script to create initial database structure
class FirebaseSetup {
  constructor() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      try {
        const serviceAccount = require('../config/serviceAccountKey.json');
        
        const config = {
          credential: admin.credential.cert(serviceAccount)
        };
        
        // Add database URL if available
        if (process.env.FIREBASE_DATABASE_URL) {
          config.databaseURL = process.env.FIREBASE_DATABASE_URL;
        }
        
        admin.initializeApp(config);
        console.log('✅ Firebase Admin initialized successfully');
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        console.log('📝 Make sure serviceAccountKey.json exists in config folder');
        process.exit(1);
      }
    }
    
    this.db = admin.firestore();
    // Only initialize rtdb if URL is provided
    this.rtdb = process.env.FIREBASE_DATABASE_URL ? admin.database() : null;
  }

  // Create sample data for all collections
  async createInitialData() {
    console.log('🔥 Setting up Firebase Database...');
    
    try {
      // 1. Create sample cities
      await this.createSampleCities();
      
      // 2. Create sample bus operators
      await this.createSampleBusOperators();
      
      // 3. Create sample bus stops
      await this.createSampleBusStops();
      
      // 4. Create sample drivers
      await this.createSampleDrivers();
      
      // 5. Create sample buses
      await this.createSampleBuses();
      
      // 6. Create sample routes
      await this.createSampleRoutes();
      
      // 7. Create sample route stops
      await this.createSampleRouteStops();
      
      // 8. Create sample schedules
      await this.createSampleSchedules();
      
      // 9. Setup Realtime Database structure
      await this.setupRealtimeDatabase();
      
      console.log('✅ Firebase Database setup completed successfully!');
      
    } catch (error) {
      console.error('❌ Error setting up Firebase Database:', error);
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
        totalBusStops: 0,
        totalRoutes: 0,
        majorLandmarks: ["Golden Temple", "Jallianwala Bagh", "Wagah Border"]
      },
      {
        cityName: "Chandigarh",
        state: "Punjab",
        country: "India",
        coordinates: { latitude: 30.7333, longitude: 76.7794 },
        isActive: true,
        totalBusStops: 0,
        totalRoutes: 0,
        majorLandmarks: ["Rock Garden", "Sukhna Lake", "Rose Garden"]
      },
      {
        cityName: "Ludhiana",
        state: "Punjab",
        country: "India",
        coordinates: { latitude: 30.9009, longitude: 75.8573 },
        isActive: true,
        totalBusStops: 0,
        totalRoutes: 0,
        majorLandmarks: ["Punjab Agricultural University", "Clock Tower"]
      },
      {
        cityName: "Delhi",
        state: "Delhi",
        country: "India",
        coordinates: { latitude: 28.6139, longitude: 77.2090 },
        isActive: true,
        totalBusStops: 0,
        totalRoutes: 0,
        majorLandmarks: ["Red Fort", "India Gate", "Qutub Minar"]
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
          email: "info@punjabroadways.gov.in",
          website: "https://punjabroadways.gov.in"
        },
        address: {
          street: "Transport Bhawan, Sector 17",
          city: "Chandigarh",
          state: "Punjab",
          pincode: "160017"
        },
        operatingStates: ["Punjab", "Haryana", "Delhi", "Himachal Pradesh"],
        licenseInfo: {
          licenseNumber: "PB-TRANS-2023",
          issueDate: "2023-01-01",
          expiryDate: "2028-01-01"
        },
        isActive: true,
        totalBuses: 0,
        totalRoutes: 0
      },
      {
        operatorName: "SSIPMT",
        operatorType: "government", 
        registrationNumber: "PB-OP-2023-002",
        contactInfo: {
          phone: "+91-183-2555000",
          email: "info@ssipmt.org",
          website: "https://ssipmt.org"
        },
        address: {
          street: "SSIPMT Complex, Ranjit Avenue",
          city: "Amritsar",
          state: "Punjab", 
          pincode: "143001"
        },
        operatingStates: ["Punjab"],
        licenseInfo: {
          licenseNumber: "PB-SSIPMT-2023",
          issueDate: "2023-01-01",
          expiryDate: "2028-01-01"
        },
        isActive: true,
        totalBuses: 0,
        totalRoutes: 0
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
        amenities: ["shelter", "seating", "lighting", "cctv"],
        isActive: true,
        nearbyLandmarks: ["Golden Temple Complex", "Heritage Street"]
      },
      {
        stopName: "Bus Stand Amritsar",
        stopCode: "AMR002", 
        coordinates: { latitude: 31.6307, longitude: 74.8756 },
        address: "GT Road, Near Railway Station, Amritsar",
        city: "Amritsar",
        state: "Punjab",
        amenities: ["shelter", "seating", "lighting", "cctv", "waiting_room"],
        isActive: true,
        nearbyLandmarks: ["Railway Station", "GT Road"]
      },
      {
        stopName: "ISBT Sector 17",
        stopCode: "CHD001",
        coordinates: { latitude: 30.7400, longitude: 76.7800 },
        address: "Sector 17, Chandigarh",
        city: "Chandigarh", 
        state: "Punjab",
        amenities: ["shelter", "seating", "lighting", "cctv", "waiting_room", "food_court"],
        isActive: true,
        nearbyLandmarks: ["Sector 17 Market", "City Centre"]
      },
      {
        stopName: "ISBT Kashmere Gate",
        stopCode: "DEL001",
        coordinates: { latitude: 28.6667, longitude: 77.2333 },
        address: "Kashmere Gate, Delhi",
        city: "Delhi",
        state: "Delhi", 
        amenities: ["shelter", "seating", "lighting", "cctv", "waiting_room", "food_court"],
        isActive: true,
        nearbyLandmarks: ["Red Fort", "Kashmere Gate Metro Station"]
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
    
    const drivers = [
      {
        driverName: "Rajesh Kumar",
        phoneNumber: "+91-98765-43210",
        licenseNumber: "PB-DL-2020-123456",
        licenseType: "commercial",
        licenseExpiry: "2030-06-15",
        assignedBusId: null,
        status: "active",
        experience: 8,
        address: {
          street: "Model Town",
          city: "Amritsar", 
          state: "Punjab",
          pincode: "143001"
        },
        emergencyContact: {
          name: "Sunita Kumar",
          phone: "+91-98765-12345",
          relation: "wife"
        }
      },
      {
        driverName: "Harpreet Singh",
        phoneNumber: "+91-98765-43211", 
        licenseNumber: "PB-DL-2019-789012",
        licenseType: "commercial",
        licenseExpiry: "2029-08-20",
        assignedBusId: null,
        status: "active",
        experience: 12,
        address: {
          street: "Ranjit Avenue",
          city: "Amritsar",
          state: "Punjab", 
          pincode: "143001"
        },
        emergencyContact: {
          name: "Simran Kaur",
          phone: "+91-98765-12346",
          relation: "wife"
        }
      }
    ];

    // Get first operator ID for assignment
    const operatorsSnapshot = await this.db.collection('busOperators').limit(1).get();
    const operatorId = operatorsSnapshot.docs[0]?.id;

    for (const driver of drivers) {
      const docRef = this.db.collection('drivers').doc();
      await docRef.set({
        id: docRef.id,
        operatorId: operatorId,
        ...driver,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${drivers.length} drivers`);
  }

  async createSampleBuses() {
    console.log('🚌 Creating sample buses...');
    
    const buses = [
      {
        busNumber: "PB-01-001",
        vehicleNumber: "PB 02 AB 1234",
        busModel: "Tata Ultra 1018", 
        capacity: 45,
        driverId: null,
        coDriverId: null,
        currentRouteId: null,
        status: "active",
        amenities: ["ac", "wifi", "charging_ports", "cctv"],
        registrationInfo: {
          registrationDate: "2023-06-15",
          fitnessExpiryDate: "2025-06-15", 
          insuranceExpiryDate: "2025-03-30"
        },
        lastMaintenanceDate: "2025-08-15",
        isActive: true
      },
      {
        busNumber: "PB-01-002",
        vehicleNumber: "PB 02 CD 5678",
        busModel: "Ashok Leyland Viking",
        capacity: 52,
        driverId: null,
        coDriverId: null, 
        currentRouteId: null,
        status: "active",
        amenities: ["ac", "cctv"],
        registrationInfo: {
          registrationDate: "2023-07-20",
          fitnessExpiryDate: "2025-07-20",
          insuranceExpiryDate: "2025-04-15"
        },
        lastMaintenanceDate: "2025-08-20",
        isActive: true
      }
    ];

    // Get first operator ID for assignment
    const operatorsSnapshot = await this.db.collection('busOperators').limit(1).get();
    const operatorId = operatorsSnapshot.docs[0]?.id;

    for (const bus of buses) {
      const docRef = this.db.collection('buses').doc();
      await docRef.set({
        id: docRef.id,
        operatorId: operatorId,
        ...bus,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${buses.length} buses`);
  }

  async createSampleRoutes() {
    console.log('🛣️ Creating sample routes...');
    
    const routes = [
      {
        routeName: "Amritsar to Delhi Express",
        routeNumber: "AMR-DEL-001", 
        startLocation: "Golden Temple, Amritsar",
        endLocation: "ISBT Kashmere Gate, Delhi",
        startCoordinates: { latitude: 31.6200, longitude: 74.8765 },
        endCoordinates: { latitude: 28.6667, longitude: 77.2333 },
        totalDistance: 458,
        estimatedDuration: 480,
        totalStops: 4,
        routeType: "intercity",
        isActive: true,
        fare: {
          baseFare: 350,
          acFare: 450, 
          currency: "INR"
        }
      },
      {
        routeName: "Amritsar City Local",
        routeNumber: "AMR-LOC-001",
        startLocation: "Bus Stand Amritsar", 
        endLocation: "Golden Temple",
        startCoordinates: { latitude: 31.6307, longitude: 74.8756 },
        endCoordinates: { latitude: 31.6200, longitude: 74.8765 },
        totalDistance: 15,
        estimatedDuration: 45,
        totalStops: 8,
        routeType: "local", 
        isActive: true,
        fare: {
          baseFare: 10,
          acFare: 15,
          currency: "INR"
        }
      }
    ];

    // Get first operator ID for assignment  
    const operatorsSnapshot = await this.db.collection('busOperators').limit(1).get();
    const operatorId = operatorsSnapshot.docs[0]?.id;

    for (const route of routes) {
      const docRef = this.db.collection('routes').doc();
      await docRef.set({
        id: docRef.id,
        operatorId: operatorId,
        ...route,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Created ${routes.length} routes`);
  }

  async createSampleRouteStops() {
    console.log('🚏 Creating sample route stops...');
    
    // Get route and stop IDs
    const routesSnapshot = await this.db.collection('routes').get();
    const stopsSnapshot = await this.db.collection('busStops').get();
    
    if (routesSnapshot.empty || stopsSnapshot.empty) {
      console.log('⚠️ No routes or stops found, skipping route stops creation');
      return;
    }

    const routes = routesSnapshot.docs;
    const stops = stopsSnapshot.docs;
    
    // Create route stops for first route (Amritsar to Delhi)
    const routeStops = [
      {
        routeId: routes[0].id,
        busStopId: stops[1].id, // Bus Stand Amritsar
        stopOrder: 1,
        arrivalTime: "06:30",
        departureTime: "06:30", 
        distanceFromStart: 0,
        fareFromStart: 0,
        estimatedDuration: 0,
        isActive: true
      },
      {
        routeId: routes[0].id,
        busStopId: stops[0].id, // Golden Temple
        stopOrder: 2,
        arrivalTime: "06:45",
        departureTime: "06:50",
        distanceFromStart: 5,
        fareFromStart: 10,
        estimatedDuration: 15,
        isActive: true
      },
      {
        routeId: routes[0].id,
        busStopId: stops[2].id, // ISBT Sector 17 Chandigarh
        stopOrder: 3,
        arrivalTime: "10:30", 
        departureTime: "10:45",
        distanceFromStart: 230,
        fareFromStart: 150,
        estimatedDuration: 240,
        isActive: true
      },
      {
        routeId: routes[0].id,
        busStopId: stops[3].id, // ISBT Kashmere Gate Delhi
        stopOrder: 4,
        arrivalTime: "14:30",
        departureTime: "14:30",
        distanceFromStart: 458,
        fareFromStart: 350, 
        estimatedDuration: 480,
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
    
    // Get route, bus, and driver IDs
    const routesSnapshot = await this.db.collection('routes').limit(1).get();
    const busesSnapshot = await this.db.collection('buses').limit(1).get();
    const driversSnapshot = await this.db.collection('drivers').limit(1).get();
    
    if (routesSnapshot.empty || busesSnapshot.empty || driversSnapshot.empty) {
      console.log('⚠️ Missing routes, buses, or drivers, skipping schedules creation');
      return;
    }

    const routeId = routesSnapshot.docs[0].id;
    const busId = busesSnapshot.docs[0].id;
    const driverId = driversSnapshot.docs[0].id;

    const schedules = [
      {
        routeId: routeId,
        busId: busId,
        driverId: driverId,
        scheduleDate: "2025-09-18",
        departureTime: "06:30",
        arrivalTime: "14:30", 
        status: "scheduled",
        actualDepartureTime: null,
        actualArrivalTime: null,
        delay: 0,
        passengerCount: 0,
        revenue: 0,
        fuelCost: 0,
        notes: ""
      },
      {
        routeId: routeId,
        busId: busId,
        driverId: driverId,
        scheduleDate: "2025-09-19",
        departureTime: "06:30", 
        arrivalTime: "14:30",
        status: "scheduled",
        actualDepartureTime: null,
        actualArrivalTime: null,
        delay: 0,
        passengerCount: 0,
        revenue: 0,
        fuelCost: 0,
        notes: ""
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

  async setupRealtimeDatabase() {
    console.log('⚡ Setting up Realtime Database structure...');
    
    if (!this.rtdb) {
      console.log('⚠️ Realtime Database URL not configured, skipping real-time setup');
      console.log('💡 Add FIREBASE_DATABASE_URL to .env file to enable real-time features');
      return;
    }

    try {
      // Create initial structure for real-time data
      const realtimeData = {
        busLocations: {
          ".info": "Live bus location tracking"
        },
        driverStatus: {
          ".info": "Live driver status tracking"  
        },
        routeStatus: {
          ".info": "Live route status tracking"
        }
      };

      await this.rtdb.ref().set(realtimeData);
      console.log('✅ Realtime Database structure created');
    } catch (error) {
      console.error('❌ Error setting up Realtime Database:', error.message);
      console.log('⚠️ Continuing with Firestore setup only...');
    }
  }

  // Helper method to run the complete setup
  static async run() {
    const setup = new FirebaseSetup();
    await setup.createInitialData();
    process.exit(0);
  }
}

// Run setup if called directly
if (require.main === module) {
  FirebaseSetup.run().catch(console.error);
}

module.exports = FirebaseSetup;