const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function comprehensiveDatabaseAudit() {
  console.log('🔍 Comprehensive Database Consistency Audit\n');
  console.log('=' .repeat(60));
  
  const issues = [];
  let totalCollections = 0;
  let totalDocuments = 0;
  
  // Define expected schema for each collection
  const expectedSchemas = {
    users: ['id', 'name', 'email', 'phoneNumber', 'role', 'address', 'isActive', 'createdAt', 'updatedAt'],
    cities: ['id', 'cityName', 'state', 'country', 'coordinates', 'isActive', 'createdAt', 'updatedAt'],
    busStops: ['id', 'stopName', 'stopCode', 'coordinates', 'address', 'city', 'state', 'amenities', 'isActive', 'createdAt', 'updatedAt'],
    busOperators: ['id', 'operatorName', 'operatorType', 'registrationNumber', 'contactInfo', 'address', 'operatingStates', 'isActive', 'createdAt', 'updatedAt'],
    buses: ['id', 'busNumber', 'vehicleNumber', 'busModel', 'capacity', 'operatorId', 'status', 'amenities', 'isActive', 'createdAt', 'updatedAt'],
    drivers: ['id', 'driverName', 'phoneNumber', 'licenseNumber', 'licenseType', 'licenseExpiry', 'operatorId', 'status', 'experience', 'createdAt', 'updatedAt'],
    routes: ['id', 'routeName', 'routeNumber', 'operatorId', 'startLocation', 'endLocation', 'startCoordinates', 'endCoordinates', 'totalDistance', 'estimatedDuration', 'routeType', 'isActive', 'createdAt', 'updatedAt'],
    routeStops: ['id', 'routeId', 'busStopId', 'stopOrder', 'arrivalTime', 'departureTime', 'distanceFromStart', 'isActive', 'createdAt'],
    busSchedules: ['id', 'routeId', 'busId', 'scheduleDate', 'departureTime', 'arrivalTime', 'status', 'createdAt', 'updatedAt'],
    complaints: ['id', 'userId', 'title', 'description', 'category', 'status', 'priority', 'createdAt', 'updatedAt'],
    notifications: ['id', 'userId', 'title', 'message', 'type', 'isRead', 'createdAt'],
    apiLogs: ['id', 'endpoint', 'method', 'userId', 'ipAddress', 'userAgent', 'responseTime', 'statusCode', 'timestamp']
  };

  const collections = Object.keys(expectedSchemas);
  
  for (const collectionName of collections) {
    console.log(`\n🔍 Auditing Collection: ${collectionName.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    try {
      const snapshot = await db.collection(collectionName).get();
      const docCount = snapshot.size;
      totalDocuments += docCount;
      totalCollections++;
      
      console.log(`📊 Documents: ${docCount}`);
      
      if (docCount === 0) {
        issues.push(`⚠️  ${collectionName}: No documents found`);
        console.log(`⚠️  No documents found`);
        continue;
      }
      
      const expectedFields = expectedSchemas[collectionName];
      const fieldConsistency = {};
      const addressConsistency = {};
      const coordinateConsistency = {};
      
      // Analyze each document
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const actualFields = Object.keys(data);
        
        // Check field presence
        expectedFields.forEach(field => {
          if (!fieldConsistency[field]) fieldConsistency[field] = 0;
          if (data.hasOwnProperty(field)) fieldConsistency[field]++;
        });
        
        // Check address structure consistency (if has address field)
        if (data.address && typeof data.address === 'object') {
          const addressFields = Object.keys(data.address);
          const addressKey = addressFields.sort().join(',');
          if (!addressConsistency[addressKey]) addressConsistency[addressKey] = 0;
          addressConsistency[addressKey]++;
        }
        
        // Check coordinates structure consistency
        if (data.coordinates && typeof data.coordinates === 'object') {
          const coordFields = Object.keys(data.coordinates);
          const coordKey = coordFields.sort().join(',');
          if (!coordinateConsistency[coordKey]) coordinateConsistency[coordKey] = 0;
          coordinateConsistency[coordKey]++;
        }
      });
      
      // Report field consistency
      console.log(`📋 Field Consistency:`);
      expectedFields.forEach(field => {
        const count = fieldConsistency[field] || 0;
        const percentage = ((count / docCount) * 100).toFixed(1);
        const status = count === docCount ? '✅' : '⚠️';
        console.log(`   ${status} ${field}: ${count}/${docCount} (${percentage}%)`);
        
        if (count !== docCount) {
          issues.push(`${collectionName}: ${field} missing in ${docCount - count} documents`);
        }
      });
      
      // Report address consistency
      if (Object.keys(addressConsistency).length > 0) {
        console.log(`🏠 Address Structure Consistency:`);
        Object.entries(addressConsistency).forEach(([structure, count]) => {
          console.log(`   ${structure}: ${count} documents`);
        });
        
        if (Object.keys(addressConsistency).length > 1) {
          issues.push(`${collectionName}: Inconsistent address structures found`);
        }
      }
      
      // Report coordinates consistency
      if (Object.keys(coordinateConsistency).length > 0) {
        console.log(`📍 Coordinates Structure Consistency:`);
        Object.entries(coordinateConsistency).forEach(([structure, count]) => {
          console.log(`   ${structure}: ${count} documents`);
        });
        
        if (Object.keys(coordinateConsistency).length > 1) {
          issues.push(`${collectionName}: Inconsistent coordinate structures found`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error auditing ${collectionName}:`, error.message);
      issues.push(`${collectionName}: Audit failed - ${error.message}`);
    }
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`📊 Total Collections: ${totalCollections}/12`);
  console.log(`📄 Total Documents: ${totalDocuments}`);
  console.log(`❗ Issues Found: ${issues.length}`);
  
  if (issues.length === 0) {
    console.log('\n🎉 ✅ DATABASE IS FULLY CONSISTENT!');
    console.log('🚀 Ready for Flutter app integration!');
  } else {
    console.log('\n⚠️  Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n📱 Next Steps:');
  if (issues.length === 0) {
    console.log('   ✅ Database is consistent - Start Flutter integration');
    console.log('   🔗 Test API endpoints with Flutter app');
    console.log('   📋 Implement real-time features');
  } else {
    console.log('   🔧 Fix the issues listed above');
    console.log('   🔄 Re-run this audit');
    console.log('   📱 Then proceed to Flutter integration');
  }
  
  process.exit(0);
}

if (require.main === module) {
  comprehensiveDatabaseAudit();
}

module.exports = { comprehensiveDatabaseAudit };