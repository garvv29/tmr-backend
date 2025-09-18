# Track My Ride Backend API Testing Guide

## 🚀 Start Server
```bash
cd "c:\Users\garvc\Desktop\Track My Ride\backend"
npm start
```

## 🧪 Manual API Testing Commands

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Initialize Default Roles
```bash
curl -X POST http://localhost:3000/api/roles/initialize -H "Content-Type: application/json"
```

### 3. Get All Roles
```bash
curl http://localhost:3000/api/roles
```

### 4. Test User Login (will fail initially - user doesn't exist)
```bash
curl -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" -d "{\"phoneNumber\":\"+919876543210\"}"
```

## 🎯 Expected Results

### Health Check Response:
```json
{
  "status": "OK",
  "message": "Track My Ride API is running",
  "timestamp": "2025-09-17T..."
}
```

### Roles Initialization Response:
```json
{
  "success": true,
  "message": "Default roles created successfully",
  "roles": [
    {
      "roleName": "master_admin",
      "displayName": "Master Admin",
      "permissions": {...}
    },
    {
      "roleName": "admin", 
      "displayName": "Admin",
      "permissions": {...}
    },
    {
      "roleName": "driver",
      "displayName": "Driver", 
      "permissions": {...}
    }
  ]
}
```

### All Roles Response:
```json
{
  "success": true,
  "roles": [...],
  "count": 3
}
```

## 🔐 Authentication System Features

✅ **Role-Based Access Control**
- `master_admin`: Full system access
- `admin`: Limited management access  
- `driver`: Own bus/route access only

✅ **Firebase Integration**
- Phone number authentication
- Token-based security
- Firestore database

✅ **API Endpoints Ready**
- `/api/roles/*` - Role management
- `/api/users/*` - User management
- Ready for buses, routes, tracking APIs

## 🎯 Next Steps After Testing

1. **Create First Admin User** (requires Firebase Auth token)
2. **Add Bus Operators Table**
3. **Add Buses and Routes Tables**
4. **Implement Real-time Tracking**
5. **Connect with Flutter App**