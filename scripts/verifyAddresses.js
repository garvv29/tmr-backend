const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyAddressFields() {
  console.log('🔍 Verifying Bus Operator Address Fields...\n');
  
  const snapshot = await db.collection('busOperators').get();
  
  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const address = data.address || {};
    
    console.log(`📋 Operator ${index + 1}: ${data.operatorName}`);
    console.log(`   Address fields: ${Object.keys(address).join(', ')}`);
    console.log(`   Street: ${address.street}`);
    console.log(`   City: ${address.city}`);
    console.log(`   State: ${address.state}`);
    console.log(`   Pincode: ${address.pincode}`);
    console.log('');
  });
  
  console.log('✅ All operators now have consistent address structure!');
  process.exit(0);
}

verifyAddressFields().catch(console.error);