const admin = require('firebase-admin');

// You need to put your serviceAccountKey.json file in this config folder
// Download it from Firebase Console: Project Settings > Service Accounts > Generate new private key

let db, rtdb, auth;

try {
  // Initialize Firebase Admin (you'll need to add serviceAccountKey.json)
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
    // storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Commented out for now
  });

  db = admin.firestore(); // For static data
  rtdb = admin.database(); // For real-time tracking
  auth = admin.auth(); // For authentication

  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.log('❌ Firebase initialization failed:', error.message);
  console.log('📝 Please add serviceAccountKey.json to config folder');
  
  // Create dummy objects to prevent crashes during development
  db = { collection: () => ({ doc: () => ({}) }) };
  rtdb = { ref: () => ({ set: () => Promise.resolve(), on: () => {}, off: () => {} }) };
  auth = { verifyIdToken: () => Promise.reject('Firebase not initialized') };
}

module.exports = { admin, db, rtdb, auth };