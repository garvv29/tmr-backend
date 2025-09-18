# Track My Ride - Firebase Project Setup

## 🔥 Quick Firebase Setup Guide

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `trackmyride123` (या जो भी आप चाहें)
4. Enable Google Analytics (optional)

### Step 2: Enable Required Services

#### Enable Firestore Database:
1. Go to "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select location: `asia-south1` (Mumbai) or `asia-southeast1` (Singapore)

#### Enable Realtime Database (Optional for live tracking):
1. Go to "Realtime Database" in left sidebar  
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location: Same as Firestore
5. Copy the database URL (looks like: `https://projectname-default-rtdb.asia-southeast1.firebasedatabase.app/`)

### Step 3: Get Service Account Key
1. Go to Project Settings (⚙️ icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Rename it to `serviceAccountKey.json`
6. Place it in `backend/config/serviceAccountKey.json`

### Step 4: Update Environment Variables
Update your `.env` file:
```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app/
```

### Step 5: Test Setup
```bash
# Only Firestore setup (works without Realtime Database)
npm run setup-firebase

# Check if server starts
npm start
```

## 🚨 Common Issues

### Issue 1: "Can't determine Firebase Database URL"
**Solution:** Either:
- Add proper FIREBASE_DATABASE_URL to .env
- Or skip Realtime Database for now (only affects live tracking)

### Issue 2: "serviceAccountKey.json not found"
**Solution:** 
- Download service account key from Firebase Console
- Place in `backend/config/serviceAccountKey.json`

### Issue 3: "Permission denied"
**Solution:**
- Make sure Firestore is in "test mode"
- Or deploy the security rules from `docs/firestore.rules`

## 📋 What Gets Created

### Firestore Collections:
- ✅ users (0 documents initially)
- ✅ cities (4 sample cities)
- ✅ busStops (4 sample stops)  
- ✅ busOperators (2 operators)
- ✅ drivers (2 sample drivers)
- ✅ buses (2 sample buses)
- ✅ routes (2 sample routes)
- ✅ routeStops (route-stop mappings)
- ✅ busSchedules (sample schedules)
- ✅ complaints (0 initially)
- ✅ notifications (0 initially)
- ✅ apiLogs (0 initially)

### Realtime Database (if configured):
- ✅ busLocations/ (live GPS tracking)
- ✅ driverStatus/ (driver online status)
- ✅ routeStatus/ (active buses per route)

## 🔧 Manual Firestore Setup (Alternative)

If script fails, manually create collections in Firebase Console:

1. Go to Firestore Database
2. Start collection: `cities`
3. Add sample document:
```json
{
  "cityName": "Amritsar",
  "state": "Punjab", 
  "country": "India",
  "coordinates": {
    "latitude": 31.6340,
    "longitude": 74.8723
  },
  "isActive": true,
  "createdAt": "2025-09-18T10:00:00Z"
}
```

Repeat for other collections as needed.

## ✅ Verification

After setup, verify:
1. ✅ Firebase Console shows all collections
2. ✅ Backend server starts without errors: `npm start`
3. ✅ Health check works: `http://localhost:3000/health`
4. ✅ API endpoints respond: `http://localhost:3000/api/cities`