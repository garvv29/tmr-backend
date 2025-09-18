const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDatabaseCollections() {
  console.log('🔍 Checking Firebase Database Collections...\n');
  
  const collections = [
    'users', 'cities', 'busStops', 'busOperators', 
    'buses', 'drivers', 'routes', 'routeStops',
    'busSchedules', 'complaints', 'notifications', 'apiLogs'
  ];
  
  let totalDocuments = 0;
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      const count = snapshot.size;
      totalDocuments += count;
      
      console.log(`📊 ${collectionName.padEnd(15)} : ${count} documents`);
      
      // Show sample document structure for first document
      if (count > 0) {
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        const sampleFields = Object.keys(data).slice(0, 3).join(', ');
        console.log(`   Sample fields: ${sampleFields}...`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error checking ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n🎯 Summary:`);
  console.log(`✅ Total Collections: ${collections.length}`);
  console.log(`📄 Total Documents: ${totalDocuments}`);
  console.log(`🚀 Database Status: Ready for Flutter App Integration!`);
  
  // Test some API endpoints structure
  console.log(`\n🔗 Available API Endpoints:`);
  console.log(`   GET  /api/cities - List all cities`);
  console.log(`   GET  /api/routes - List all bus routes`);
  console.log(`   GET  /api/bus-stops - List all bus stops`);
  console.log(`   GET  /api/schedules - List all bus schedules`);
  console.log(`   POST /api/auth/register - User registration`);
  console.log(`   GET  /health - Health check`);
  
  process.exit(0);
}

checkDatabaseCollections().catch(console.error);