const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addSampleRouteData() {
  try {
    console.log('🚀 Adding sample route data...');

    // Sample Bus Stops
    const busStops = [
      {
        id: 'stop_001',
        stopName: 'Connaught Place',
        stopCode: 'CP001',
        latitude: 28.6315,
        longitude: 77.2167,
        address: 'Connaught Place, New Delhi',
        amenities: ['WiFi', 'Shelter', 'CCTV'],
        isActive: true
      },
      {
        id: 'stop_002', 
        stopName: 'India Gate',
        stopCode: 'IG002',
        latitude: 28.6129,
        longitude: 77.2295,
        address: 'India Gate, New Delhi',
        amenities: ['Shelter', 'CCTV'],
        isActive: true
      },
      {
        id: 'stop_003',
        stopName: 'Red Fort',
        stopCode: 'RF003',
        latitude: 28.6562,
        longitude: 77.2410,
        address: 'Red Fort, Old Delhi',
        amenities: ['Shelter', 'Food Court'],
        isActive: true
      },
      {
        id: 'stop_004',
        stopName: 'Karol Bagh',
        stopCode: 'KB004',
        latitude: 28.6544,
        longitude: 77.1910,
        address: 'Karol Bagh Metro Station',
        amenities: ['WiFi', 'Shelter', 'CCTV', 'ATM'],
        isActive: true
      },
      {
        id: 'stop_005',
        stopName: 'AIIMS',
        stopCode: 'AIIMS005',
        latitude: 28.5672,
        longitude: 77.2100,
        address: 'AIIMS Hospital, New Delhi',
        amenities: ['Medical Aid', 'Shelter', 'CCTV'],
        isActive: true
      }
    ];

    // Add bus stops
    console.log('📍 Adding bus stops...');
    for (const stop of busStops) {
      await db.collection('bus_stops').doc(stop.id).set(stop);
      console.log(`✅ Added stop: ${stop.stopName}`);
    }

    // Sample Routes with proper bus stop sequences
    const routes = [
      {
        id: 'route_001',
        routeName: 'CP to Red Fort Express',
        routeNumber: '101',
        operatorId: 'dtc_001',
        startLocation: 'Connaught Place',
        endLocation: 'Red Fort',
        startCoordinates: { lat: 28.6315, lng: 77.2167 },
        endCoordinates: { lat: 28.6562, lng: 77.2410 },
        totalDistance: 8.5,
        estimatedDuration: 35,
        busStops: ['stop_001', 'stop_002', 'stop_003'], // CP -> India Gate -> Red Fort
        totalStops: 3,
        assignedBusIds: ['bus_001', 'bus_002'],
        isActive: true
      },
      {
        id: 'route_002', 
        routeName: 'Karol Bagh to AIIMS',
        routeNumber: '205',
        operatorId: 'dtc_001',
        startLocation: 'Karol Bagh',
        endLocation: 'AIIMS',
        startCoordinates: { lat: 28.6544, lng: 77.1910 },
        endCoordinates: { lat: 28.5672, lng: 77.2100 },
        totalDistance: 12.3,
        estimatedDuration: 45,
        busStops: ['stop_004', 'stop_001', 'stop_002', 'stop_005'], // Karol Bagh -> CP -> India Gate -> AIIMS
        totalStops: 4,
        assignedBusIds: ['bus_003', 'bus_004'],
        isActive: true
      }
    ];

    // Add routes
    console.log('🚌 Adding routes...');
    for (const route of routes) {
      await db.collection('routes').doc(route.id).set(route);
      console.log(`✅ Added route: ${route.routeName} (${route.routeNumber})`);
    }

    // Sample Buses
    const buses = [
      {
        id: 'bus_001',
        busNumber: 'DL1PC1234',
        operatorId: 'dtc_001',
        busType: 'Standard',
        capacity: 40,
        isActive: true,
        currentStatus: 'active',
        fuel: 'CNG',
        amenities: ['AC', 'GPS']
      },
      {
        id: 'bus_002',
        busNumber: 'DL1PC5678', 
        operatorId: 'dtc_001',
        busType: 'Low Floor',
        capacity: 35,
        isActive: true,
        currentStatus: 'active',
        fuel: 'CNG',
        amenities: ['GPS', 'WiFi']
      },
      {
        id: 'bus_003',
        busNumber: 'DL1PC9012',
        operatorId: 'dtc_001', 
        busType: 'AC',
        capacity: 42,
        isActive: true,
        currentStatus: 'active',
        fuel: 'CNG',
        amenities: ['AC', 'GPS', 'WiFi']
      },
      {
        id: 'bus_004',
        busNumber: 'DL1PC3456',
        operatorId: 'dtc_001',
        busType: 'Standard',
        capacity: 38,
        isActive: true,
        currentStatus: 'active', 
        fuel: 'CNG',
        amenities: ['GPS']
      }
    ];

    // Add buses
    console.log('🚍 Adding buses...');
    for (const bus of buses) {
      await db.collection('buses').doc(bus.id).set(bus);
      console.log(`✅ Added bus: ${bus.busNumber}`);
    }

    // Sample Bus Operators
    const operators = [
      {
        id: 'dtc_001',
        operatorName: 'Delhi Transport Corporation',
        operatorCode: 'DTC',
        contactNumber: '+91-11-23456789',
        email: 'info@dtc.gov.in',
        isActive: true
      }
    ];

    // Add operators
    console.log('🏢 Adding operators...');
    for (const operator of operators) {
      await db.collection('bus_operators').doc(operator.id).set(operator);
      console.log(`✅ Added operator: ${operator.operatorName}`);
    }

    console.log('🎉 Sample data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Bus Stops: ${busStops.length}`);
    console.log(`- Routes: ${routes.length}`);
    console.log(`- Buses: ${buses.length}`);
    console.log(`- Operators: ${operators.length}`);
    
    console.log('\n🔍 Test these searches:');
    console.log('- From: "Connaught" To: "Red Fort" -> Should find Route 101');
    console.log('- From: "Karol" To: "AIIMS" -> Should find Route 205');
    console.log('- From: "CP" To: "India Gate" -> Should find both routes');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run the function
addSampleRouteData().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Failed to add sample data:', error);
  process.exit(1);
});