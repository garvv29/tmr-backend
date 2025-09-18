const admin = require('firebase-admin');
require('dotenv').config();

// Setup script for Raipur, Chhattisgarh focused database
class RaipurDatabaseSetup {
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

  async clearAllData() {
    console.log('🧹 Clearing all existing data...');
    
    const collections = [
      'cities', 'busStops', 'routes', 'routeStops', 'buses', 
      'drivers', 'busOperators', 'busSchedules', 'complaints', 
      'notifications', 'users', 'roles'
    ];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await this.db.collection(collectionName).get();
        const batch = this.db.batch();
        
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        if (!snapshot.empty) {
          await batch.commit();
          console.log(`🗑️ Cleared ${snapshot.size} documents from ${collectionName}`);
        }
      } catch (error) {
        console.log(`⚠️ Warning: Could not clear ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('✅ Data clearing completed');
  }

  async createRaipurData() {
    console.log('🏙️ Setting up Raipur, Chhattisgarh database...');
    
    try {
      await this.createRaipurCity();
      await this.createBusOperators();
      await this.createBusStops();
      await this.createDrivers();
      await this.createBuses();
      await this.createRoutes();
      await this.createRouteStops();
      await this.createSchedules();
      
      console.log('✅ Raipur database setup completed successfully!');
      
    } catch (error) {
      console.error('❌ Error setting up Raipur database:', error);
      throw error;
    }
  }

  async createRaipurCity() {
    console.log('📍 Creating Raipur city data...');
    
    const cityData = {
      id: 'city_raipur_001',
      cityName: 'Raipur',
      state: 'Chhattisgarh',
      country: 'India',
      coordinates: {
        latitude: 21.2514,
        longitude: 81.6296
      },
      isActive: true,
      majorLandmarks: [
        'Raipur Railway Station',
        'City Center Mall',
        'Telibandha Pond',
        'Marine Drive',
        'Magneto Mall',
        'Nagar Clock Tower'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.db.collection('cities').doc('city_raipur_001').set(cityData);
    console.log('✅ Created Raipur city');
  }

  async createBusOperators() {
    console.log('🏢 Creating bus operators...');
    
    const operators = [
      {
        id: 'operator_cg_001',
        operatorName: 'CG State Transport',
        contactNumber: '+91-771-2234567',
        email: 'info@cgstatetransport.gov.in',
        address: 'Transport Bhawan, Raipur, Chhattisgarh',
        isActive: true,
        licenseNumber: 'CG-ST-2024-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'operator_raipur_002',
        operatorName: 'Raipur City Bus Service',
        contactNumber: '+91-771-2345678',
        email: 'contact@raipurcitybus.com',
        address: 'Civil Lines, Raipur, Chhattisgarh',
        isActive: true,
        licenseNumber: 'CG-RCB-2024-002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const operator of operators) {
      await this.db.collection('busOperators').doc(operator.id).set(operator);
    }
    
    console.log(`✅ Created ${operators.length} bus operators`);
  }

  async createBusStops() {
    console.log('🚏 Creating Raipur bus stops...');
    
    const busStops = [
      {
        id: 'stop_raipur_001',
        stopName: 'Raipur Railway Station',
        stopCode: 'RRS001',
        coordinates: {
          latitude: 21.2497,
          longitude: 81.6220
        },
        address: 'Railway Station Road, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Waiting Room', 'Ticket Counter', 'Water Facility', 'Washroom'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_002',
        stopName: 'City Center Mall',
        stopCode: 'CCM002',
        coordinates: {
          latitude: 21.2360,
          longitude: 81.6420
        },
        address: 'City Center Mall, Pandri, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Shopping Mall', 'Food Court', 'Parking'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_003',
        stopName: 'Marine Drive',
        stopCode: 'MD003',
        coordinates: {
          latitude: 21.2400,
          longitude: 81.6150
        },
        address: 'Marine Drive, Telibandha, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Lake View', 'Walking Area', 'Food Stalls'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_004',
        stopName: 'Magneto Mall',
        stopCode: 'MM004',
        coordinates: {
          latitude: 21.2550,
          longitude: 81.6380
        },
        address: 'Magneto Mall, Ring Road, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Shopping Mall', 'Cinema', 'Restaurants'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_005',
        stopName: 'Nagar Clock Tower',
        stopCode: 'NCT005',
        coordinates: {
          latitude: 21.2514,
          longitude: 81.6296
        },
        address: 'Clock Tower Chowk, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Historic Monument', 'Market Area'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_006',
        stopName: 'Civil Lines',
        stopCode: 'CL006',
        coordinates: {
          latitude: 21.2470,
          longitude: 81.6250
        },
        address: 'Civil Lines, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Government Offices', 'Banking'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_007',
        stopName: 'Pandri',
        stopCode: 'PND007',
        coordinates: {
          latitude: 21.2300,
          longitude: 81.6400
        },
        address: 'Pandri Main Road, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Residential Area', 'Schools'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_raipur_008',
        stopName: 'Shankar Nagar',
        stopCode: 'SN008',
        coordinates: {
          latitude: 21.2600,
          longitude: 81.6500
        },
        address: 'Shankar Nagar, Raipur',
        city: 'Raipur',
        state: 'Chhattisgarh',
        amenities: ['Residential Area', 'Markets'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const stop of busStops) {
      await this.db.collection('busStops').doc(stop.id).set(stop);
    }
    
    console.log(`✅ Created ${busStops.length} bus stops`);
  }

  async createDrivers() {
    console.log('👨‍💼 Creating drivers...');
    
    const drivers = [
      {
        id: 'driver_raipur_001',
        driverName: 'Ramesh Kumar',
        licenseNumber: 'CG-DL-2024-001',
        phoneNumber: '+91-9876543210',
        experience: 8,
        operatorId: 'operator_cg_001',
        isActive: true,
        address: 'Shankar Nagar, Raipur',
        emergencyContact: '+91-9876543211',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'driver_raipur_002',
        driverName: 'Suresh Patel',
        licenseNumber: 'CG-DL-2024-002',
        phoneNumber: '+91-9876543220',
        experience: 12,
        operatorId: 'operator_cg_001',
        isActive: true,
        address: 'Civil Lines, Raipur',
        emergencyContact: '+91-9876543221',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'driver_raipur_003',
        driverName: 'Mohan Singh',
        licenseNumber: 'CG-DL-2024-003',
        phoneNumber: '+91-9876543230',
        experience: 5,
        operatorId: 'operator_raipur_002',
        isActive: true,
        address: 'Pandri, Raipur',
        emergencyContact: '+91-9876543231',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const driver of drivers) {
      await this.db.collection('drivers').doc(driver.id).set(driver);
    }
    
    console.log(`✅ Created ${drivers.length} drivers`);
  }

  async createBuses() {
    console.log('🚌 Creating buses...');
    
    const buses = [
      {
        id: 'bus_raipur_001',
        busNumber: 'CG-07-A-1001',
        vehicleNumber: 'CG07A1001',
        busModel: 'Tata Starbus',
        capacity: 40,
        operatorId: 'operator_cg_001',
        driverId: 'driver_raipur_001',
        status: 'active',
        amenities: ['AC', 'GPS Tracking', 'CCTV'],
        fuelType: 'Diesel',
        manufacturingYear: 2022,
        lastMaintenance: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'bus_raipur_002',
        busNumber: 'CG-07-B-2001',
        vehicleNumber: 'CG07B2001',
        busModel: 'Ashok Leyland Viking',
        capacity: 35,
        operatorId: 'operator_cg_001',
        driverId: 'driver_raipur_002',
        status: 'active',
        amenities: ['Non-AC', 'GPS Tracking'],
        fuelType: 'Diesel',
        manufacturingYear: 2021,
        lastMaintenance: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'bus_raipur_003',
        busNumber: 'CG-07-C-3001',
        vehicleNumber: 'CG07C3001',
        busModel: 'Mahindra Bus',
        capacity: 30,
        operatorId: 'operator_raipur_002',
        driverId: 'driver_raipur_003',
        status: 'active',
        amenities: ['AC', 'GPS Tracking', 'USB Charging'],
        fuelType: 'CNG',
        manufacturingYear: 2023,
        lastMaintenance: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const bus of buses) {
      await this.db.collection('buses').doc(bus.id).set(bus);
    }
    
    console.log(`✅ Created ${buses.length} buses`);
  }

  async createRoutes() {
    console.log('🛣️ Creating routes...');
    
    const routes = [
      {
        id: 'route_raipur_001',
        routeName: 'Railway Station to Marine Drive',
        routeNumber: 'R001',
        startLocation: 'Raipur Railway Station',
        endLocation: 'Marine Drive',
        distance: 5.2,
        estimatedDuration: 25,
        operatorId: 'operator_cg_001',
        busId: 'bus_raipur_001',
        isActive: true,
        fare: 15,
        routeType: 'city',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'route_raipur_002',
        routeName: 'City Center to Magneto Mall',
        routeNumber: 'R002',
        startLocation: 'City Center Mall',
        endLocation: 'Magneto Mall',
        distance: 3.8,
        estimatedDuration: 18,
        operatorId: 'operator_cg_001',
        busId: 'bus_raipur_002',
        isActive: true,
        fare: 12,
        routeType: 'city',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'route_raipur_003',
        routeName: 'Pandri to Shankar Nagar',
        routeNumber: 'R003',
        startLocation: 'Pandri',
        endLocation: 'Shankar Nagar',
        distance: 7.5,
        estimatedDuration: 35,
        operatorId: 'operator_raipur_002',
        busId: 'bus_raipur_003',
        isActive: true,
        fare: 18,
        routeType: 'city',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const route of routes) {
      await this.db.collection('routes').doc(route.id).set(route);
    }
    
    console.log(`✅ Created ${routes.length} routes`);
  }

  async createRouteStops() {
    console.log('🚏 Creating route stops...');
    
    const routeStops = [
      // Route 1: Railway Station to Marine Drive
      {
        id: 'rs_001_001',
        routeId: 'route_raipur_001',
        stopId: 'stop_raipur_001',
        stopOrder: 1,
        arrivalTime: '06:00',
        departureTime: '06:02',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_001_002',
        routeId: 'route_raipur_001',
        stopId: 'stop_raipur_005',
        stopOrder: 2,
        arrivalTime: '06:08',
        departureTime: '06:10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_001_003',
        routeId: 'route_raipur_001',
        stopId: 'stop_raipur_006',
        stopOrder: 3,
        arrivalTime: '06:15',
        departureTime: '06:17',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_001_004',
        routeId: 'route_raipur_001',
        stopId: 'stop_raipur_003',
        stopOrder: 4,
        arrivalTime: '06:23',
        departureTime: '06:25',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      
      // Route 2: City Center to Magneto Mall
      {
        id: 'rs_002_001',
        routeId: 'route_raipur_002',
        stopId: 'stop_raipur_002',
        stopOrder: 1,
        arrivalTime: '06:30',
        departureTime: '06:32',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_002_002',
        routeId: 'route_raipur_002',
        stopId: 'stop_raipur_007',
        stopOrder: 2,
        arrivalTime: '06:35',
        departureTime: '06:37',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_002_003',
        routeId: 'route_raipur_002',
        stopId: 'stop_raipur_004',
        stopOrder: 3,
        arrivalTime: '06:45',
        departureTime: '06:47',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      
      // Route 3: Pandri to Shankar Nagar
      {
        id: 'rs_003_001',
        routeId: 'route_raipur_003',
        stopId: 'stop_raipur_007',
        stopOrder: 1,
        arrivalTime: '07:00',
        departureTime: '07:02',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_003_002',
        routeId: 'route_raipur_003',
        stopId: 'stop_raipur_005',
        stopOrder: 2,
        arrivalTime: '07:12',
        departureTime: '07:14',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_003_003',
        routeId: 'route_raipur_003',
        stopId: 'stop_raipur_004',
        stopOrder: 3,
        arrivalTime: '07:25',
        departureTime: '07:27',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rs_003_004',
        routeId: 'route_raipur_003',
        stopId: 'stop_raipur_008',
        stopOrder: 4,
        arrivalTime: '07:32',
        departureTime: '07:35',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const routeStop of routeStops) {
      await this.db.collection('routeStops').doc(routeStop.id).set(routeStop);
    }
    
    console.log(`✅ Created ${routeStops.length} route stops`);
  }

  async createSchedules() {
    console.log('📅 Creating bus schedules...');
    
    const schedules = [
      {
        id: 'schedule_001',
        routeId: 'route_raipur_001',
        busId: 'bus_raipur_001',
        startTime: '06:00',
        endTime: '22:00',
        frequency: 30, // minutes
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'schedule_002',
        routeId: 'route_raipur_002',
        busId: 'bus_raipur_002',
        startTime: '06:30',
        endTime: '21:30',
        frequency: 45, // minutes
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'schedule_003',
        routeId: 'route_raipur_003',
        busId: 'bus_raipur_003',
        startTime: '07:00',
        endTime: '20:00',
        frequency: 60, // minutes
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const schedule of schedules) {
      await this.db.collection('busSchedules').doc(schedule.id).set(schedule);
    }
    
    console.log(`✅ Created ${schedules.length} schedules`);
  }
}

// Main execution
async function setupRaipurDatabase() {
  console.log('🚀 Starting Raipur Database Setup...');
  
  const setup = new RaipurDatabaseSetup();
  
  try {
    await setup.clearAllData();
    await setup.createRaipurData();
    
    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('📋 Summary:');
    console.log('   🏙️ City: Raipur, Chhattisgarh');
    console.log('   🚏 Bus Stops: 8 locations');
    console.log('   🛣️ Routes: 3 routes');
    console.log('   🚌 Buses: 3 buses');
    console.log('   👨‍💼 Drivers: 3 drivers');
    console.log('   🏢 Operators: 2 operators');
    console.log('   📅 Schedules: 3 schedules');
    console.log('');
    console.log('📱 You can now test the app with Raipur data!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the setup
if (require.main === module) {
  setupRaipurDatabase();
}

module.exports = { RaipurDatabaseSetup };