const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function showAvailableData() {
  const db = admin.firestore();
  
  console.log('🚌 AVAILABLE BUS NUMBERS FOR TESTING:');
  console.log('=====================================');
  
  // Get all buses
  const busesSnapshot = await db.collection('buses').get();
  busesSnapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. Bus Number: ${data.busNumber}`);
    console.log(`   Vehicle: ${data.vehicleNumber}`);
    console.log(`   Model: ${data.busModel}`);
    console.log(`   Capacity: ${data.capacity}`);
    console.log(`   Status: ${data.status}`);
    console.log('');
  });
  
  console.log('🗺️ AVAILABLE CITIES FOR ROUTE SEARCH:');
  console.log('=====================================');
  
  // Get all cities
  const citiesSnapshot = await db.collection('cities').get();
  citiesSnapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.cityName}, ${data.state}`);
  });
  
  console.log('');
  console.log('🚏 AVAILABLE BUS STOPS:');
  console.log('========================');
  
  // Get all bus stops
  const stopsSnapshot = await db.collection('busStops').get();
  stopsSnapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.stopName} (${data.city})`);
  });
  
  console.log('');
  console.log('🛤️ AVAILABLE ROUTES:');
  console.log('====================');
  
  // Get all routes
  const routesSnapshot = await db.collection('routes').get();
  routesSnapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. Route ${data.routeNumber}: ${data.startLocation} → ${data.endLocation}`);
    console.log(`   Distance: ${data.totalDistance}km, Duration: ${data.estimatedDuration} mins`);
    console.log('');
  });
  
  process.exit(0);
}

showAvailableData().catch(console.error);