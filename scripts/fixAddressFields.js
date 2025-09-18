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

async function fixBusOperatorAddresses() {
  console.log('🔧 Fixing Bus Operator Address Field Inconsistencies...\n');
  
  try {
    // Get all bus operators
    const snapshot = await db.collection('busOperators').get();
    
    if (snapshot.empty) {
      console.log('⚠️ No bus operators found');
      return;
    }
    
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentAddress = data.address || {};
      
      console.log(`📋 Checking operator: ${data.operatorName}`);
      console.log(`   Current address fields: ${Object.keys(currentAddress).join(', ')}`);
      
      // Standardize address structure
      const standardizedAddress = {
        street: currentAddress.street || currentAddress.address || 'Not specified',
        city: currentAddress.city || 'Not specified',
        state: currentAddress.state || 'Punjab',
        pincode: currentAddress.pincode || '000000'
      };
      
      // Update the document with standardized address
      await doc.ref.update({
        address: standardizedAddress,
        updatedAt: new Date()
      });
      
      console.log(`   ✅ Updated with fields: ${Object.keys(standardizedAddress).join(', ')}`);
      console.log('');
      updatedCount++;
    }
    
    console.log(`🎯 Summary:`);
    console.log(`✅ Updated ${updatedCount} bus operators`);
    console.log(`📋 All operators now have consistent address structure:`);
    console.log(`   - street (string)`);
    console.log(`   - city (string)`);
    console.log(`   - state (string)`);
    console.log(`   - pincode (string)`);
    
  } catch (error) {
    console.error('❌ Error fixing address fields:', error);
    throw error;
  }
}

// Also fix any other collections that might have address inconsistencies
async function fixOtherAddressFields() {
  console.log('\n🔧 Checking other collections for address inconsistencies...\n');
  
  // Fix user addresses
  const usersSnapshot = await db.collection('users').get();
  let userUpdates = 0;
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    if (data.address && typeof data.address === 'object') {
      const currentAddress = data.address;
      
      const standardizedAddress = {
        street: currentAddress.street || 'Not specified',
        city: currentAddress.city || 'Not specified', 
        state: currentAddress.state || 'Punjab',
        pincode: currentAddress.pincode || '000000'
      };
      
      await doc.ref.update({
        address: standardizedAddress,
        updatedAt: new Date()
      });
      
      userUpdates++;
    }
  }
  
  if (userUpdates > 0) {
    console.log(`✅ Updated ${userUpdates} user addresses`);
  }
  
  // Fix bus stop addresses if needed
  const stopsSnapshot = await db.collection('busStops').get();
  let stopUpdates = 0;
  
  for (const doc of stopsSnapshot.docs) {
    const data = doc.data();
    if (!data.state) {
      await doc.ref.update({
        state: 'Punjab',
        updatedAt: new Date()
      });
      stopUpdates++;
    }
  }
  
  if (stopUpdates > 0) {
    console.log(`✅ Updated ${stopUpdates} bus stop states`);
  }
}

async function main() {
  try {
    await fixBusOperatorAddresses();
    await fixOtherAddressFields();
    
    console.log('\n🎉 Address field standardization completed!');
    console.log('🔍 You can now check Firebase console to verify consistency');
    
  } catch (error) {
    console.error('❌ Fix operation failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { fixBusOperatorAddresses, fixOtherAddressFields };