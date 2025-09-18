const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase if not already done
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

const db = admin.firestore();

class ConsistentDataSetup {
  
  async clearAllData() {
    console.log('🗑️  Clearing all existing data...');
    
    const collections = [
      'cities', 'busStops', 'busOperators', 'drivers', 
      'buses', 'routes', 'routeStops', 'busSchedules',
      'users', 'roles', 'complaints', 'notifications', 'apiLogs'
    ];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`✅ Cleared ${collectionName} collection (${snapshot.size} documents)`);
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found or already empty`);
      }
    }
  }
  
  async createConsistentData() {
    console.log('📊 Creating consistent data structure...');
    
    // Create Cities - matching Flutter City model exactly
    await this.createCities();
    
    // Create Bus Stops - matching Flutter BusStop model exactly  
    await this.createBusStops();
    
    // Create Bus Operators
    await this.createBusOperators();
    
    // Create Drivers
    await this.createDrivers();
    
    // Create Buses
    await this.createBuses();
    
    console.log('✅ All consistent data created successfully!');
  }
  
  async createCities() {
    console.log('🏙️  Creating cities...');
    
    const cities = [
      {
        id: 'city_chandigarh_001',
        cityName: 'Chandigarh',
        state: 'Punjab',
        country: 'India',
        coordinates: {
          latitude: 30.7333,
          longitude: 76.7794
        },
        isActive: true,
        majorLandmarks: ['Rock Garden', 'Sukhna Lake', 'Rose Garden'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'city_amritsar_001', 
        cityName: 'Amritsar',
        state: 'Punjab',
        country: 'India',
        coordinates: {
          latitude: 31.6340,
          longitude: 74.8723
        },
        isActive: true,
        majorLandmarks: ['Golden Temple', 'Jallianwala Bagh', 'Wagah Border'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'city_delhi_001',
        cityName: 'Delhi', 
        state: 'Delhi',
        country: 'India',
        coordinates: {
          latitude: 28.7041,
          longitude: 77.1025
        },
        isActive: true,
        majorLandmarks: ['Red Fort', 'India Gate', 'Lotus Temple'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    for (const city of cities) {
      await db.collection('cities').doc(city.id).set(city);
    }
    
    console.log(`✅ Created ${cities.length} cities`);
  }
  
  async createBusStops() {
    console.log('🚏 Creating bus stops...');
    
    const busStops = [
      {
        id: 'stop_chandigarh_001',
        stopName: 'Sector 17 Bus Stand',
        stopCode: 'CHD17',
        coordinates: {
          latitude: 30.7373,
          longitude: 76.7809
        },
        address: 'Sector 17, Chandigarh',
        city: 'Chandigarh',
        state: 'Punjab',
        amenities: ['Waiting Area', 'Food Court', 'Parking'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_chandigarh_002',
        stopName: 'ISBT Chandigarh',
        stopCode: 'CHDISBT',
        coordinates: {
          latitude: 30.7194,
          longitude: 76.8103
        },
        address: 'ISBT, Sector 43, Chandigarh',
        city: 'Chandigarh', 
        state: 'Punjab',
        amenities: ['Waiting Hall', 'Restaurants', 'Ticket Counter'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_amritsar_001',
        stopName: 'Golden Temple Station',
        stopCode: 'AMRGT',
        coordinates: {
          latitude: 31.6199,
          longitude: 74.8765
        },
        address: 'Near Golden Temple, Amritsar',
        city: 'Amritsar',
        state: 'Punjab', 
        amenities: ['Shelter', 'Information Board'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'stop_delhi_001',
        stopName: 'Kashmiri Gate ISBT',
        stopCode: 'DELKG',
        coordinates: {
          latitude: 28.6667,
          longitude: 77.2167
        },
        address: 'Kashmiri Gate, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        amenities: ['AC Waiting Hall', 'Food Court', 'Cloak Room'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    for (const stop of busStops) {
      await db.collection('busStops').doc(stop.id).set(stop);
    }
    
    console.log(`✅ Created ${busStops.length} bus stops`);
  }
  
  async createBusOperators() {
    console.log('🏢 Creating bus operators...');
    
    const operators = [
      {
        id: 'operator_001',
        operatorName: 'Punjab Roadways',
        licenseNumber: 'PR2024001',
        contactInfo: {
          phone: '+91-172-2740000',
          email: 'info@punjabroadways.com',
          address: 'Transport Bhawan, Chandigarh'
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    for (const operator of operators) {
      await db.collection('busOperators').doc(operator.id).set(operator);
    }
    
    console.log(`✅ Created ${operators.length} bus operators`);
  }
  
  async createDrivers() {
    console.log('👨‍💼 Creating drivers...');
    
    const drivers = [
      {
        id: 'driver_001',
        name: 'Ravi Kumar',
        licenseNumber: 'PB05DL123456',
        phone: '+91-98765-43210',
        operatorId: 'operator_001',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    for (const driver of drivers) {
      await db.collection('drivers').doc(driver.id).set(driver);
    }
    
    console.log(`✅ Created ${drivers.length} drivers`);
  }
  
  async createBuses() {
    console.log('🚌 Creating buses...');
    
    const buses = [
      {
        id: 'bus_001',
        busNumber: 'PB05-1234',
        vehicleNumber: 'PB05AB1234',
        busModel: 'Tata Starbus',
        capacity: 40,
        operatorId: 'operator_001',
        driverId: 'driver_001',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    for (const bus of buses) {
      await db.collection('buses').doc(bus.id).set(bus);
    }
    
    console.log(`✅ Created ${buses.length} buses`);
  }
}

async function main() {
  try {
    const setup = new ConsistentDataSetup();
    
    console.log('🚀 Starting consistent data setup...');
    
    // Clear all existing data
    await setup.clearAllData();
    
    // Create fresh consistent data
    await setup.createConsistentData();
    
    console.log('🎉 Setup completed successfully!');
    console.log('📱 You can now test the Flutter app with consistent data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();