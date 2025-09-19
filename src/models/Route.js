const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Route {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.routeName = data.routeName;
    this.routeNumber = data.routeNumber;
    this.operatorId = data.operatorId;
    this.startLocation = data.startLocation;
    this.endLocation = data.endLocation;
    this.startCoordinates = data.startCoordinates || null;
    this.endCoordinates = data.endCoordinates || null;
    this.totalDistance = data.totalDistance || 0;
    this.estimatedDuration = data.estimatedDuration || 0; // in minutes
    this.busStops = data.busStops || []; // Array of stop IDs in order
    this.totalStops = data.totalStops || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Save route to Firestore
  async save() {
    try {
      await db.collection('routes').doc(this.id).set(this.toJSON());
      console.log(`✅ Route created: ${this.routeName} (${this.routeNumber})`);
      return this;
    } catch (error) {
      throw new Error(`Error saving route: ${error.message}`);
    }
  }

  // Find route by ID
  static async findById(id) {
    try {
      const doc = await db.collection('routes').doc(id).get();
      return doc.exists ? new Route({ id: doc.id, ...doc.data() }) : null;
    } catch (error) {
      throw new Error(`Error finding route: ${error.message}`);
    }
  }

  // Find route by route number
  static async findByRouteNumber(routeNumber) {
    try {
      const snapshot = await db.collection('routes')
        .where('routeNumber', '==', routeNumber)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Route({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding route by number: ${error.message}`);
    }
  }

  // Get routes by operator
  static async getByOperator(operatorId) {
    try {
      const snapshot = await db.collection('routes')
        .where('operatorId', '==', operatorId)
        .where('isActive', '==', true)
        .orderBy('routeNumber')
        .get();
      
      return snapshot.docs.map(doc => new Route({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting routes by operator: ${error.message}`);
    }
  }

  // Get routes by start/end locations
  static async getRoutesByLocations(startLocation, endLocation) {
    try {
      const snapshot = await db.collection('routes')
        .where('startLocation', '==', startLocation)
        .where('endLocation', '==', endLocation)
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => new Route({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting routes by locations: ${error.message}`);
    }
  }

  // Search routes by city
  static async searchByCity(cityName) {
    try {
      const snapshot = await db.collection('routes')
        .where('isActive', '==', true)
        .get();
      
      const routes = snapshot.docs
        .map(doc => new Route({ id: doc.id, ...doc.data() }))
        .filter(route => 
          route.startLocation.toLowerCase().includes(cityName.toLowerCase()) ||
          route.endLocation.toLowerCase().includes(cityName.toLowerCase())
        );
      
      return routes;
    } catch (error) {
      throw new Error(`Error searching routes by city: ${error.message}`);
    }
  }

  // Get all active routes
  static async getActiveRoutes() {
    try {
      const snapshot = await db.collection('routes')
        .where('isActive', '==', true)
        .get();
      
      // Sort in memory instead of using orderBy to avoid composite index requirement
      const routes = snapshot.docs.map(doc => new Route({ id: doc.id, ...doc.data() }));
      return routes.sort((a, b) => a.routeNumber.localeCompare(b.routeNumber));
    } catch (error) {
      throw new Error(`Error getting active routes: ${error.message}`);
    }
  }

  // Add bus stop to route
  async addBusStop(stopId, position = null) {
    try {
      if (position !== null && position >= 0 && position <= this.busStops.length) {
        this.busStops.splice(position, 0, stopId);
      } else {
        this.busStops.push(stopId);
      }
      
      this.totalStops = this.busStops.length;
      this.updatedAt = new Date().toISOString();
      await this.save();
      return this;
    } catch (error) {
      throw new Error(`Error adding bus stop: ${error.message}`);
    }
  }

  // Remove bus stop from route
  async removeBusStop(stopId) {
    try {
      this.busStops = this.busStops.filter(id => id !== stopId);
      this.totalStops = this.busStops.length;
      this.updatedAt = new Date().toISOString();
      await this.save();
      return this;
    } catch (error) {
      throw new Error(`Error removing bus stop: ${error.message}`);
    }
  }

  // Update route details
  async updateDetails(updates) {
    try {
      const allowedUpdates = [
        'routeName', 'startLocation', 'endLocation', 'startCoordinates', 
        'endCoordinates', 'totalDistance', 'estimatedDuration', 'isActive'
      ];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          this[field] = updates[field];
        }
      });
      
      this.updatedAt = new Date().toISOString();
      await this.save();
      return this;
    } catch (error) {
      throw new Error(`Error updating route details: ${error.message}`);
    }
  }

  // Calculate estimated arrival times for stops
  calculateStopTimings() {
    const timingsPerStop = this.estimatedDuration / Math.max(this.totalStops - 1, 1);
    return this.busStops.map((stopId, index) => ({
      stopId,
      estimatedTime: Math.round(index * timingsPerStop),
      distanceFromStart: (this.totalDistance / Math.max(this.totalStops - 1, 1)) * index
    }));
  }

  // Get route with populated stop details
  async getRouteWithStops() {
    try {
      const BusStop = require('./BusStop');
      const stopDetails = await Promise.all(
        this.busStops.map(async (stopId) => {
          const stop = await BusStop.findById(stopId);
          return stop ? stop.toJSON() : null;
        })
      );

      return {
        ...this.toJSON(),
        stopDetails: stopDetails.filter(stop => stop !== null),
        estimatedTimings: this.calculateStopTimings()
      };
    } catch (error) {
      throw new Error(`Error getting route with stops: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      routeName: this.routeName,
      routeNumber: this.routeNumber,
      operatorId: this.operatorId,
      startLocation: this.startLocation,
      endLocation: this.endLocation,
      startCoordinates: this.startCoordinates,
      endCoordinates: this.endCoordinates,
      totalDistance: this.totalDistance,
      estimatedDuration: this.estimatedDuration,
      busStops: this.busStops,
      totalStops: this.totalStops,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Route;