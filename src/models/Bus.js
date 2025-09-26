const { db, rtdb } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Indian Vehicle Number Formats by State
const VEHICLE_NUMBER_PATTERNS = {
  'Punjab': /^PB\d{2}[A-Z]{1,2}\d{4}$/,
  'Delhi': /^DL\d{2}[A-Z]{1,2}\d{4}$/,
  'Maharashtra': /^MH\d{2}[A-Z]{1,2}\d{4}$/,
  'Karnataka': /^KA\d{2}[A-Z]{1,2}\d{4}$/,
  'Tamil Nadu': /^TN\d{2}[A-Z]{1,2}\d{4}$/,
  'Gujarat': /^GJ\d{2}[A-Z]{1,2}\d{4}$/,
  'Rajasthan': /^RJ\d{2}[A-Z]{1,2}\d{4}$/,
  'Uttar Pradesh': /^UP\d{2}[A-Z]{1,2}\d{4}$/,
  'West Bengal': /^WB\d{2}[A-Z]{1,2}\d{4}$/,
  'Haryana': /^HR\d{2}[A-Z]{1,2}\d{4}$/
};

class Bus {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.busId = data.busId || data.busNumber || `BUS${Date.now()}`;
    this.busName = data.busName || `Bus ${this.busId}`;
    this.licensePlate = data.licensePlate || data.registrationNumber || data.busNumber;
    this.capacity = parseInt(data.capacity) || 0;
    this.model = data.model || 'Unknown';
    this.manufacturer = data.manufacturer || 'Unknown';
    this.yearOfManufacture = parseInt(data.yearOfManufacture) || parseInt(data.year) || new Date().getFullYear();
    this.status = data.status || data.currentStatus || 'inactive'; // active | inactive | maintenance | en_route | breakdown
    this.currentLocation = data.currentLocation || null;
    this.assignedRouteId = data.assignedRouteId || data.routeId || null;
    this.assignedDriverIds = data.assignedDriverIds || (data.driverId ? [data.driverId] : []);
    this.features = data.features || data.amenities || []; // AC, WiFi, GPS, CCTV, USB_Charging
    this.maintenanceSchedule = data.maintenanceSchedule || null;
    this.fuelType = data.fuelType || 'diesel'; // diesel | petrol | electric | hybrid
    this.registrationDate = data.registrationDate || new Date();
    this.insuranceInfo = data.insuranceInfo || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.operatorId = data.operatorId; // Keep for backward compatibility
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  // Validate Indian vehicle number format
  static validateVehicleNumber(busNumber, state) {
    const pattern = VEHICLE_NUMBER_PATTERNS[state];
    return pattern ? pattern.test(busNumber.replace(/[-\s]/g, '')) : true;
  }

  // Format vehicle number for display (PB-03-BC-1234)
  static formatVehicleNumber(busNumber) {
    const cleaned = busNumber.replace(/[-\s]/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 10)}`;
    }
    return busNumber;
  }

  // Save bus to Firestore
  async save() {
    try {
      await db.collection('buses').doc(this.id).set(this.toJSON());
      console.log(`✅ Bus created: ${this.busNumber}`);
      return this;
    } catch (error) {
      throw new Error(`Error saving bus: ${error.message}`);
    }
  }

  // Find bus by ID
  static async findById(id) {
    try {
      const doc = await db.collection('buses').doc(id).get();
      return doc.exists ? new Bus({ id: doc.id, ...doc.data() }) : null;
    } catch (error) {
      throw new Error(`Error finding bus: ${error.message}`);
    }
  }

  // Find bus by busId (new field)
  static async findByBusId(busId) {
    try {
      const snapshot = await db.collection('buses')
        .where('busId', '==', busId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Bus({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding bus by busId: ${error.message}`);
    }
  }

  // Find bus by license plate (case insensitive, format flexible)
  static async findByLicensePlate(licensePlate) {
    try {
      // Normalize the search term - remove spaces, dashes, convert to uppercase
      const normalizedSearch = licensePlate.replace(/[-\s]/g, '').toUpperCase();
      
      console.log(`🔍 Searching for license plate: ${licensePlate} (normalized: ${normalizedSearch})`);
      
      // Get all buses and search in memory for flexible matching
      const snapshot = await db.collection('buses').get();
      
      if (snapshot.empty) return null;
      
      // Search through all buses for a match
      for (const doc of snapshot.docs) {
        const busData = doc.data();
        const busLicensePlate = busData.licensePlate;
        
        if (busLicensePlate) {
          // Normalize the bus license plate the same way
          const normalizedBusPlate = busLicensePlate.replace(/[-\s]/g, '').toUpperCase();
          
          // Check for exact match
          if (normalizedBusPlate === normalizedSearch) {
            console.log(`✅ Found matching bus: ${busData.busName} (${busLicensePlate})`);
            return new Bus({ id: doc.id, ...busData });
          }
        }
      }
      
      console.log(`❌ No bus found with license plate: ${licensePlate}`);
      return null;
    } catch (error) {
      throw new Error(`Error finding bus by license plate: ${error.message}`);
    }
  }

  // Find bus by number (keep for backward compatibility)
  static async findByNumber(busNumber) {
    try {
      // Try busId first, then busNumber field, then licensePlate
      let bus = await this.findByBusId(busNumber);
      if (bus) return bus;

      const snapshot = await db.collection('buses')
        .where('busNumber', '==', busNumber)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return await this.findByLicensePlate(busNumber);
      }
      
      const doc = snapshot.docs[0];
      return new Bus({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding bus by number: ${error.message}`);
    }
  }

  // Get buses by operator
  static async getByOperator(operatorId) {
    try {
      const snapshot = await db.collection('buses')
        .where('operatorId', '==', operatorId)
        .where('isActive', '==', true)
        .orderBy('busNumber')
        .get();
      
      return snapshot.docs.map(doc => new Bus({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting buses by operator: ${error.message}`);
    }
  }

  // Get buses by route
  static async getByRoute(routeId) {
    try {
      const snapshot = await db.collection('buses')
        .where('routeId', '==', routeId)
        .where('isActive', '==', true)
        .orderBy('busNumber')
        .get();
      
      return snapshot.docs.map(doc => new Bus({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting buses by route: ${error.message}`);
    }
  }

  // Get online buses (for tracking)
  static async getOnlineBuses() {
    try {
      const snapshot = await db.collection('buses')
        .where('isOnline', '==', true)
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => new Bus({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting online buses: ${error.message}`);
    }
  }

  // Get all buses
  static async getAllBuses() {
    try {
      const snapshot = await db.collection('buses')
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => new Bus({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting all buses: ${error.message}`);
    }
  }

  // Get active buses
  static async getActiveBuses() {
    try {
      const snapshot = await db.collection('buses')
        .where('status', '==', 'active')
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => new Bus({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting active buses: ${error.message}`);
    }
  }

  // Assign route to bus
  async assignRoute(routeId) {
    try {
      this.routeId = routeId;
      this.updatedAt = new Date().toISOString();
      await this.save();
    } catch (error) {
      throw new Error(`Error assigning route: ${error.message}`);
    }
  }

  // Driver selects this bus from driver app
  async assignDriver(driverId) {
    try {
      this.driverId = driverId;
      this.isOnline = true;
      this.currentStatus = 'running';
      this.updatedAt = new Date().toISOString();
      await this.save();
      
      // Update real-time status
      await this.updateRealtimeStatus();
    } catch (error) {
      throw new Error(`Error assigning driver: ${error.message}`);
    }
  }

  // Update bus status
  async updateStatus(status) {
    try {
      const validStatuses = ['running', 'parked', 'maintenance', 'breakdown'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      this.currentStatus = status;
      this.isOnline = status === 'running';
      this.lastUpdated = new Date().toISOString();
      this.updatedAt = new Date().toISOString();
      
      await this.save();
      await this.updateRealtimeStatus();
    } catch (error) {
      throw new Error(`Error updating status: ${error.message}`);
    }
  }

  // Update real-time location from driver app
  async updateRealtimeLocation(locationData) {
    try {
      const { latitude, longitude, accuracy, timestamp } = locationData;
      
      // Get previous location for speed/heading calculation
      const prevLocation = await this.getCurrentLocation();
      
      let speed = 0;
      let heading = 0;
      
      if (prevLocation && prevLocation.latitude && prevLocation.longitude) {
        // Calculate speed (km/h)
        const distance = this.calculateDistance(
          prevLocation.latitude, prevLocation.longitude,
          latitude, longitude
        );
        const timeDiff = (timestamp - prevLocation.timestamp) / 1000; // seconds
        speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0; // km/h
        
        // Calculate heading (bearing)
        heading = this.calculateBearing(
          prevLocation.latitude, prevLocation.longitude,
          latitude, longitude
        );
      }

      const locationUpdateData = {
        busId: this.id,
        busNumber: this.busNumber,
        operatorId: this.operatorId,
        routeId: this.routeId,
        driverId: this.driverId,
        latitude,
        longitude,
        accuracy,
        speed: Math.round(speed * 100) / 100, // Round to 2 decimal places
        heading: Math.round(heading),
        status: this.currentStatus,
        isOnline: this.isOnline,
        timestamp,
        lastUpdate: new Date().toISOString()
      };

      // Save to Realtime Database for live tracking
      await rtdb.ref(`busLocations/${this.id}`).set(locationUpdateData);
      
      this.lastUpdated = new Date().toISOString();
      await this.save();
    } catch (error) {
      throw new Error(`Error updating realtime location: ${error.message}`);
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  }

  // Calculate bearing (heading) between two coordinates
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  // Update real-time status only
  async updateRealtimeStatus() {
    try {
      const statusData = {
        status: this.currentStatus,
        isOnline: this.isOnline,
        timestamp: Date.now(),
        lastUpdate: new Date().toISOString()
      };

      await rtdb.ref(`busLocations/${this.id}`).update(statusData);
    } catch (error) {
      throw new Error(`Error updating realtime status: ${error.message}`);
    }
  }

  // Get current location from realtime database
  async getCurrentLocation() {
    try {
      const snapshot = await rtdb.ref(`busLocations/${this.id}`).once('value');
      return snapshot.val();
    } catch (error) {
      throw new Error(`Error getting current location: ${error.message}`);
    }
  }

  // Convert to JSON with new schema
  toJSON() {
    return {
      id: this.id,
      busId: this.busId,
      busName: this.busName,
      licensePlate: this.licensePlate,
      capacity: this.capacity,
      model: this.model,
      manufacturer: this.manufacturer,
      yearOfManufacture: this.yearOfManufacture,
      status: this.status,
      currentLocation: this.currentLocation,
      assignedRouteId: this.assignedRouteId,
      assignedDriverIds: this.assignedDriverIds,
      features: this.features,
      maintenanceSchedule: this.maintenanceSchedule,
      fuelType: this.fuelType,
      registrationDate: this.registrationDate,
      insuranceInfo: this.insuranceInfo,
      isActive: this.isActive,
      // Keep old fields for backward compatibility
      busNumber: this.busId, // Fallback
      operatorId: this.operatorId,
      amenities: this.features, // Fallback
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get public data (for API responses)
  toPublicJSON() {
    return {
      id: this.id,
      busId: this.busId,
      busName: this.busName,
      licensePlate: this.licensePlate,
      capacity: this.capacity,
      status: this.status,
      currentLocation: this.currentLocation,
      assignedRouteId: this.assignedRouteId,
      features: this.features,
      isActive: this.isActive
    };
  }
}

module.exports = Bus;