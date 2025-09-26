const { db, rtdb } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class LiveLocation {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.entityId = data.entityId || ''; // Bus ID or Driver ID
    this.entityType = data.entityType || 'bus'; // bus | driver
    this.currentLocation = data.currentLocation || {
      lat: data.lat || data.latitude || 0,
      lng: data.lng || data.longitude || 0,
      address: data.address || ''
    };
    this.speed = data.speed || 0; // km/h
    this.heading = data.heading || 0; // Degrees (0-360)
    this.accuracy = data.accuracy || 0; // GPS accuracy in meters
    this.timestamp = data.timestamp || new Date();
    this.isOnline = data.isOnline !== undefined ? data.isOnline : true;
    this.routeId = data.routeId || null;
    this.nextStopId = data.nextStopId || null;
    this.estimatedArrival = data.estimatedArrival || null;
    this.batteryLevel = data.batteryLevel || null; // 0-100
    this.networkType = data.networkType || null; // wifi | 4g | 3g | 2g
    this.lastUpdated = data.lastUpdated || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  // Save live location to both Firestore and Realtime Database
  async save() {
    try {
      // Save to Firestore for persistence
      await db.collection('liveLocations').doc(this.id).set(this.toJSON());
      
      // Save to Realtime Database for live tracking
      const realtimeData = {
        lat: this.currentLocation.lat,
        lng: this.currentLocation.lng,
        speed: this.speed,
        heading: this.heading,
        timestamp: Date.now(),
        isOnline: this.isOnline,
        routeId: this.routeId,
        nextStopId: this.nextStopId,
        batteryLevel: this.batteryLevel,
        lastUpdated: Date.now()
      };

      const realtimePath = `liveTracking/${this.entityType}s/${this.entityId}`;
      await rtdb.ref(realtimePath).set(realtimeData);
      
      console.log(`✅ Live location updated for ${this.entityType} ${this.entityId}`);
    } catch (error) {
      console.error('Error saving live location:', error);
      throw error;
    }
  }

  // Find live location by entity ID
  static async findByEntityId(entityId, entityType = 'bus') {
    try {
      const snapshot = await db.collection('liveLocations')
        .where('entityId', '==', entityId)
        .where('entityType', '==', entityType)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new LiveLocation({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding live location:', error);
      throw error;
    }
  }

  // Get live location from Realtime Database
  static async getLiveFromRTDB(entityId, entityType = 'bus') {
    try {
      const realtimePath = `liveTracking/${entityType}s/${entityId}`;
      const snapshot = await rtdb.ref(realtimePath).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting live location from RTDB:', error);
      throw error;
    }
  }

  // Get all active live locations
  static async getAllActiveLiveLocations(entityType = 'bus') {
    try {
      const snapshot = await db.collection('liveLocations')
        .where('entityType', '==', entityType)
        .where('isOnline', '==', true)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new LiveLocation({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active live locations:', error);
      throw error;
    }
  }

  // Get live locations by route
  static async getByRoute(routeId) {
    try {
      const snapshot = await db.collection('liveLocations')
        .where('routeId', '==', routeId)
        .where('isOnline', '==', true)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new LiveLocation({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting live locations by route:', error);
      throw error;
    }
  }

  // Update location from GPS data
  async updateLocation(lat, lng, speed = 0, heading = 0, accuracy = 0) {
    try {
      this.currentLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: this.currentLocation.address || ''
      };
      this.speed = parseFloat(speed);
      this.heading = parseInt(heading);
      this.accuracy = parseFloat(accuracy);
      this.timestamp = new Date();
      this.lastUpdated = new Date();
      this.isOnline = true;

      await this.save();
    } catch (error) {
      throw new Error(`Error updating location: ${error.message}`);
    }
  }

  // Set entity offline
  async setOffline() {
    try {
      this.isOnline = false;
      this.lastUpdated = new Date();
      
      // Update Firestore
      await db.collection('liveLocations').doc(this.id).update({
        isOnline: false,
        lastUpdated: this.lastUpdated
      });

      // Update Realtime Database
      const realtimePath = `liveTracking/${this.entityType}s/${this.entityId}`;
      await rtdb.ref(realtimePath).update({
        isOnline: false,
        lastUpdated: Date.now()
      });
    } catch (error) {
      throw new Error(`Error setting offline: ${error.message}`);
    }
  }

  // Calculate distance from another location
  distanceFrom(lat, lng) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat - this.currentLocation.lat) * Math.PI / 180;
    const dLon = (lng - this.currentLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.currentLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      entityId: this.entityId,
      entityType: this.entityType,
      currentLocation: this.currentLocation,
      speed: this.speed,
      heading: this.heading,
      accuracy: this.accuracy,
      timestamp: this.timestamp,
      isOnline: this.isOnline,
      routeId: this.routeId,
      nextStopId: this.nextStopId,
      estimatedArrival: this.estimatedArrival,
      batteryLevel: this.batteryLevel,
      networkType: this.networkType,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get public data (for API responses)
  toPublicJSON() {
    return {
      entityId: this.entityId,
      entityType: this.entityType,
      currentLocation: this.currentLocation,
      speed: this.speed,
      heading: this.heading,
      timestamp: this.timestamp,
      isOnline: this.isOnline,
      routeId: this.routeId,
      nextStopId: this.nextStopId,
      estimatedArrival: this.estimatedArrival
    };
  }
}

module.exports = LiveLocation;