# 🚌 Track My Ride - Firebase Database Setup

## 📋 Database Collections

### 🔥 Firestore Collections

| Collection | Purpose | Access Level |
|------------|---------|-------------|
| **users** | User profiles and authentication | Authenticated users |
| **cities** | City master data | Public read |
| **busStops** | Bus stop locations and info | Public read |
| **busOperators** | Bus operator companies | Public read |
| **buses** | Bus fleet management | Public read, Admin write |
| **drivers** | Driver profiles and licenses | Restricted access |
| **routes** | Bus route definitions | Public read |
| **routeStops** | Route-stop junction table | Public read |
| **busSchedules** | Daily bus schedules | Public read |
| **complaints** | User feedback and issues | User/Admin access |
| **notifications** | Push notifications | User-specific |
| **apiLogs** | API usage tracking | Admin only |

### ⚡ Realtime Database

| Path | Purpose | Access Level |
|------|---------|-------------|
| **busLocations/{busId}** | Live GPS tracking | Public read, Driver write |
| **driverStatus/{driverId}** | Driver online status | Driver/Admin access |
| **routeStatus/{routeId}** | Active buses on route | Public read |

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database** and **Realtime Database**
3. Download `serviceAccountKey.json` from Project Settings > Service Accounts
4. Place it in `backend/config/serviceAccountKey.json`

### 3. Environment Variables
Create `.env` file in backend folder:
```env
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
PORT=3000
NODE_ENV=development
```

### 4. Setup Database Structure
```bash
npm run setup-firebase
```

### 5. Deploy Security Rules

#### Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

#### Realtime Database Rules:
```bash
firebase deploy --only database
```

## 📊 Sample Data

The setup script creates sample data for:
- ✅ **4 Cities** (Amritsar, Chandigarh, Ludhiana, Delhi)
- ✅ **2 Bus Operators** (Punjab Roadways, SSIPMT)
- ✅ **4 Bus Stops** (Golden Temple, Bus Stands, ISBT)
- ✅ **2 Drivers** (with proper licenses)
- ✅ **2 Buses** (with Indian vehicle numbers)
- ✅ **2 Routes** (Intercity + Local)
- ✅ **Route Stops** (with timing and fare info)
- ✅ **Bus Schedules** (daily schedules)

## 🔐 Security Model

### Role-Based Access:
- **master_admin**: Full system access
- **admin**: Operator-level management
- **driver**: Bus operation and location updates
- **user**: Public data access and complaints

### Data Privacy:
- Personal driver info is restricted
- Live locations are public for transparency
- User complaints are private
- API logs are admin-only

## 📱 API Integration

### Public Endpoints (No Auth):
```
GET /api/routes/search - Search bus routes
GET /api/bus-stops/nearby - Find nearby stops
GET /api/location/area/active - Track live buses
GET /api/buses/:id - Get bus info
```

### Protected Endpoints (Auth Required):
```
POST /api/drivers - Create driver (Admin)
PUT /api/buses/:id/status - Update bus status (Admin)
PUT /api/location/bus/:id - Update bus location (Driver)
POST /api/complaints - Submit complaint (User)
```

## 🔧 Database Indexes

### Firestore Composite Indexes:
```javascript
// busStops collection
city (Ascending) + isActive (Ascending)
state (Ascending) + isActive (Ascending)

// buses collection  
operatorId (Ascending) + status (Ascending)
status (Ascending) + isActive (Ascending)

// routes collection
operatorId (Ascending) + isActive (Ascending)
startLocation (Ascending) + endLocation (Ascending)

// routeStops collection
routeId (Ascending) + stopOrder (Ascending)

// busSchedules collection
scheduleDate (Ascending) + status (Ascending)
routeId (Ascending) + scheduleDate (Ascending)

// complaints collection
userId (Ascending) + status (Ascending)
status (Ascending) + priority (Ascending)

// apiLogs collection
timestamp (Descending) + statusCode (Ascending)
```

## 📈 Data Growth Planning

### Storage Estimates:
- **Firestore**: ~50MB for 1000 buses, 10000 stops
- **Realtime DB**: ~1MB for 1000 active buses
- **Storage**: Profile images, complaint attachments

### Scaling Considerations:
- Partition large cities by zones
- Archive old schedules and logs
- Use Cloud Functions for heavy operations
- Implement data lifecycle policies

## 🛠️ Maintenance

### Daily Tasks:
- Monitor API usage in logs
- Check driver license expiries
- Update bus maintenance schedules

### Weekly Tasks:
- Clean old location data
- Archive resolved complaints
- Update route timings based on data

### Monthly Tasks:
- Generate operator reports
- Update city landmarks
- Review security rules

## 🚨 Monitoring & Alerts

Set up Firebase Performance Monitoring for:
- API response times
- Database read/write operations
- Real-time connection counts
- Error rates and patterns

## 📞 Support

For database-related issues:
- Check Firebase Console logs
- Review security rules
- Monitor quota usage
- Contact system admin for access issues