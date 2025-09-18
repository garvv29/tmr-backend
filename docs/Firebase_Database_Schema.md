# Track My Ride - Firebase Database Schema
## 🔥 Firestore Collections Structure

### 1. 👥 **users** Collection
```javascript
// Document ID: user's Firebase UID
{
  id: "user_uid_here",
  name: "John Doe",
  email: "john@example.com",
  phoneNumber: "+91-98765-43210",
  role: "admin", // master_admin, admin, driver, user
  operatorId: "operator_id", // null for regular users
  isActive: true,
  profileImage: "https://...",
  preferences: {
    language: "en", // en, hi, pa
    notifications: true,
    theme: "light"
  },
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z",
  lastLoginAt: "2025-09-18T10:00:00Z"
}
```

### 2. 🏙️ **cities** Collection
```javascript
// Document ID: auto-generated
{
  id: "city_uuid",
  cityName: "Amritsar",
  state: "Punjab",
  country: "India",
  coordinates: {
    latitude: 31.6340,
    longitude: 74.8723
  },
  isActive: true,
  totalBusStops: 150,
  totalRoutes: 45,
  majorLandmarks: ["Golden Temple", "Jallianwala Bagh"],
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 3. 🚏 **busStops** Collection
```javascript
// Document ID: auto-generated
{
  id: "stop_uuid",
  stopName: "Golden Temple",
  stopCode: "AMR001",
  coordinates: {
    latitude: 31.6200,
    longitude: 74.8765
  },
  address: "Golden Temple Road, Amritsar",
  city: "Amritsar",
  state: "Punjab",
  amenities: ["shelter", "seating", "lighting", "cctv"],
  isActive: true,
  nearbyLandmarks: ["Golden Temple Complex", "Heritage Street"],
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 4. 🏢 **busOperators** Collection
```javascript
// Document ID: auto-generated
{
  id: "operator_uuid",
  operatorName: "Punjab Roadways",
  operatorType: "government", // government, private
  registrationNumber: "PB-OP-2023-001",
  contactInfo: {
    phone: "+91-98765-43210",
    email: "info@punjabroadways.gov.in",
    website: "https://punjabroadways.gov.in"
  },
  address: {
    street: "Transport Bhawan",
    city: "Chandigarh",
    state: "Punjab",
    pincode: "160017"
  },
  operatingStates: ["Punjab", "Haryana", "Delhi"],
  licenseInfo: {
    licenseNumber: "PB-TRANS-2023",
    issueDate: "2023-01-01",
    expiryDate: "2028-01-01"
  },
  isActive: true,
  totalBuses: 250,
  totalRoutes: 35,
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 5. 🚌 **buses** Collection
```javascript
// Document ID: auto-generated
{
  id: "bus_uuid",
  busNumber: "PB-01-001",
  vehicleNumber: "PB 02 AB 1234",
  busModel: "Tata Ultra 1018",
  capacity: 45,
  operatorId: "operator_uuid",
  driverId: "driver_uuid", // null if not assigned
  coDriverId: "co_driver_uuid", // optional
  currentRouteId: "route_uuid", // null if not on route
  status: "active", // active, inactive, maintenance, en_route
  amenities: ["ac", "wifi", "charging_ports", "cctv"],
  registrationInfo: {
    registrationDate: "2023-06-15",
    fitnessExpiryDate: "2025-06-15",
    insuranceExpiryDate: "2025-03-30"
  },
  lastMaintenanceDate: "2025-08-15",
  isActive: true,
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 6. 👨‍💼 **drivers** Collection
```javascript
// Document ID: auto-generated
{
  id: "driver_uuid",
  driverName: "Rajesh Kumar",
  phoneNumber: "+91-98765-43210",
  licenseNumber: "PB-DL-2020-123456",
  licenseType: "commercial", // light, heavy, commercial
  licenseExpiry: "2030-06-15",
  operatorId: "operator_uuid",
  assignedBusId: "bus_uuid", // null if not assigned
  status: "active", // active, inactive, suspended
  experience: 8, // years
  address: {
    street: "Model Town",
    city: "Amritsar",
    state: "Punjab",
    pincode: "143001"
  },
  emergencyContact: {
    name: "Sunita Kumar",
    phone: "+91-98765-12345",
    relation: "wife"
  },
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 7. 🛣️ **routes** Collection
```javascript
// Document ID: auto-generated
{
  id: "route_uuid",
  routeName: "Amritsar to Delhi Express",
  routeNumber: "AMR-DEL-001",
  operatorId: "operator_uuid",
  startLocation: "Golden Temple, Amritsar",
  endLocation: "ISBT Kashmere Gate, Delhi",
  startCoordinates: {
    latitude: 31.6200,
    longitude: 74.8765
  },
  endCoordinates: {
    latitude: 28.6667,
    longitude: 77.2333
  },
  totalDistance: 458, // km
  estimatedDuration: 480, // minutes
  totalStops: 12,
  routeType: "intercity", // local, intercity, express
  isActive: true,
  fare: {
    baseFare: 350,
    acFare: 450,
    currency: "INR"
  },
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 8. 🚏 **routeStops** Collection (Junction Table)
```javascript
// Document ID: auto-generated
{
  id: "route_stop_uuid",
  routeId: "route_uuid",
  busStopId: "stop_uuid",
  stopOrder: 1, // sequence in route
  arrivalTime: "10:30", // scheduled time
  departureTime: "10:35", // scheduled time
  distanceFromStart: 0, // km from route start
  fareFromStart: 0, // fare from route start
  estimatedDuration: 0, // minutes from route start
  isActive: true,
  createdAt: "2025-09-18T10:00:00Z"
}
```

### 9. 📅 **busSchedules** Collection
```javascript
// Document ID: auto-generated
{
  id: "schedule_uuid",
  routeId: "route_uuid",
  busId: "bus_uuid",
  driverId: "driver_uuid",
  scheduleDate: "2025-09-18",
  departureTime: "06:30",
  arrivalTime: "14:30",
  status: "scheduled", // scheduled, started, completed, cancelled, delayed
  actualDepartureTime: "06:35", // actual time
  actualArrivalTime: null, // will be updated when completed
  delay: 5, // minutes
  passengerCount: 42,
  revenue: 14700, // total collection
  fuelCost: 3500,
  notes: "Traffic jam at Ludhiana bypass",
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 10. 📧 **complaints** Collection
```javascript
// Document ID: auto-generated
{
  id: "complaint_uuid",
  userId: "user_uuid",
  busId: "bus_uuid", // optional
  routeId: "route_uuid", // optional
  operatorId: "operator_uuid", // optional
  complaintType: "service", // service, safety, cleanliness, staff_behavior, other
  title: "Bus was very late",
  description: "The bus was 45 minutes late from scheduled time",
  priority: "medium", // low, medium, high, critical
  status: "open", // open, in_progress, resolved, closed
  attachments: ["image1_url", "image2_url"],
  reportedDate: "2025-09-18T10:00:00Z",
  assignedTo: "admin_user_uuid",
  resolvedDate: null,
  resolution: null,
  userRating: null, // 1-5 rating after resolution
  createdAt: "2025-09-18T10:00:00Z",
  updatedAt: "2025-09-18T10:00:00Z"
}
```

### 11. 🔔 **notifications** Collection
```javascript
// Document ID: auto-generated
{
  id: "notification_uuid",
  userId: "user_uuid", // null for broadcast notifications
  title: "Bus Delayed",
  message: "Your bus AMR-DEL-001 is running 20 minutes late",
  type: "delay", // delay, cancellation, route_change, general, emergency
  category: "service", // service, promotional, system, emergency
  data: {
    busId: "bus_uuid",
    routeId: "route_uuid",
    estimatedDelay: 20
  },
  isRead: false,
  priority: "medium", // low, medium, high
  expiryDate: "2025-09-19T10:00:00Z",
  createdAt: "2025-09-18T10:00:00Z",
  readAt: null
}
```

### 12. 📊 **apiLogs** Collection
```javascript
// Document ID: auto-generated
{
  id: "log_uuid",
  userId: "user_uuid", // null for public APIs
  endpoint: "/api/routes/search",
  method: "GET",
  statusCode: 200,
  responseTime: 245, // milliseconds
  requestData: {
    query: "Amritsar to Delhi",
    page: 1
  },
  responseSize: 1024, // bytes
  userAgent: "TrackMyRide-App/1.0.0",
  ipAddress: "192.168.1.100",
  timestamp: "2025-09-18T10:00:00Z",
  errorMessage: null // if status >= 400
}
```

## 🔥 **Firebase Realtime Database Structure**

### Live Bus Tracking (Real-time)
```javascript
// Path: /busLocations/{busId}
{
  "bus_uuid": {
    latitude: 31.6340,
    longitude: 74.8723,
    speed: 45, // km/h
    heading: 180, // degrees (0-360)
    timestamp: "2025-09-18T10:15:30Z",
    busId: "bus_uuid",
    driverId: "driver_uuid",
    routeId: "route_uuid",
    status: "en_route" // en_route, stopped, break
  }
}
```

### Live Driver Status
```javascript
// Path: /driverStatus/{driverId}
{
  "driver_uuid": {
    isOnline: true,
    currentBusId: "bus_uuid",
    lastSeen: "2025-09-18T10:15:30Z",
    dutyStatus: "on_duty" // on_duty, off_duty, break
  }
}
```

### Live Route Status
```javascript
// Path: /routeStatus/{routeId}
{
  "route_uuid": {
    activeBuses: ["bus_uuid1", "bus_uuid2"],
    lastUpdated: "2025-09-18T10:15:30Z",
    totalActiveBuses: 2
  }
}
```