const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Route {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.routeId = data.routeId || data.routeNumber || `ROUTE${Date.now()}`;
    this.name = data.name || data.routeName || '';
    this.description = data.description || `Route from ${data.fromLocation || data.startLocation} to ${data.toLocation || data.endLocation}`;
    this.type = data.type || data.routeType || 'linear'; // linear | circular | express
    this.stops = data.stops || []; // Array of stop objects with details
    
    // Support both old and new field names
    this.fromLocation = data.fromLocation || data.startLocation || '';
    this.toLocation = data.toLocation || data.endLocation || '';
    this.startLocation = data.startLocation || data.fromLocation || '';
    this.endLocation = data.endLocation || data.toLocation || '';
    
    // Handle location coordinates
    this.startCoordinates = data.startCoordinates || data.fromCoordinates || null;
    this.endCoordinates = data.endCoordinates || data.toCoordinates || null;
    
    this.distance = data.distance || data.totalDistance || 0;
    this.totalDistance = data.totalDistance || data.distance || 0;
    this.estimatedDuration = data.estimatedDuration || 0; // in minutes
    this.operatingHours = data.operatingHours || { startTime: '06:00', endTime: '22:00' };
    this.operatingDays = data.operatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    this.frequency = data.frequency || 30; // in minutes
    this.fare = data.fare || { adultFare: 10, childFare: 5, seniorFare: 8 };
    this.assignedBusIds = data.assignedBusIds || data.assignedBuses || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.status = data.status || 'active'; // active | inactive
    this.category = data.category || data.city || 'city'; // city | intercity | express | local
    this.city = data.city || data.category || 'Raipur';
    this.routeType = data.routeType || data.type || 'linear';
    this.dailyRides = data.dailyRides || 0;
    this.totalPassengers = data.totalPassengers || 0;
    
    // Keep old fields for backward compatibility
    this.routeName = data.routeName || this.name;
    this.routeNumber = data.routeNumber || this.routeId;
    this.operatorId = data.operatorId;
    this.busStops = data.busStops || []; // Array of stop IDs in order (old format)
    this.totalStops = data.totalStops || this.stops.length;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
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

  // Find route by routeId (new field)
  static async findByRouteId(routeId) {
    try {
      const snapshot = await db.collection('routes')
        .where('routeId', '==', routeId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Route({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding route by routeId: ${error.message}`);
    }
  }

  // Find route by route number (updated to check both fields)
  static async findByRouteNumber(routeNumber) {
    try {
      // Try routeId first, then routeNumber field
      let route = await this.findByRouteId(routeNumber);
      if (route) return route;

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

  // Find routes that contain both from and to stops
  // Find routes that match from and to locations (updated for your database)
  static async findRoutesBetweenStops(fromStopName, toStopName) {
    try {
      console.log(`🔍 Searching routes from "${fromStopName}" to "${toStopName}"`);
      
      // Get all active routes from your database
      const routesSnapshot = await db.collection('routes')
        .where('status', '==', 'active')
        .get();
      
      const matchingRoutes = [];
      
      for (const doc of routesSnapshot.docs) {
        const routeData = { id: doc.id, ...doc.data() };
        const route = new Route(routeData);
        
        // Check if route matches fromLocation and toLocation (case insensitive)
        const fromMatches = route.fromLocation?.toLowerCase().includes(fromStopName.toLowerCase()) ||
                           route.startLocation?.toLowerCase().includes(fromStopName.toLowerCase());
        
        const toMatches = route.toLocation?.toLowerCase().includes(toStopName.toLowerCase()) ||
                         route.endLocation?.toLowerCase().includes(toStopName.toLowerCase());
        
        // Also check route name for location matches
        const nameContainsFrom = route.name?.toLowerCase().includes(fromStopName.toLowerCase());
        const nameContainsTo = route.name?.toLowerCase().includes(toStopName.toLowerCase());
        
        if ((fromMatches || nameContainsFrom) && (toMatches || nameContainsTo)) {
          console.log(`✅ Found matching route: ${route.name} (${route.fromLocation} → ${route.toLocation})`);
          matchingRoutes.push(route);
        }
      }
      
      console.log(`📍 Total ${matchingRoutes.length} routes found`);
      return matchingRoutes;
    } catch (error) {
      console.error('❌ Error finding routes:', error);
      throw new Error(`Error finding routes between stops: ${error.message}`);
    }
  }

  // Get assigned buses for this route
  async getAssignedBuses() {
    try {
      if (!this.assignedBusIds || this.assignedBusIds.length === 0) {
        return [];
      }
      
      const Bus = require('./Bus');
      const buses = await Promise.all(
        this.assignedBusIds.map(async (busId) => {
          const bus = await Bus.findById(busId);
          return bus ? bus.toJSON() : null;
        })
      );
      
      return buses.filter(bus => bus !== null);
    } catch (error) {
      throw new Error(`Error getting assigned buses: ${error.message}`);
    }
  }  // Get all active routes
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

  // Convert to JSON with new schema
  toJSON() {
    return {
      id: this.id,
      routeId: this.routeId,
      name: this.name,
      description: this.description,
      type: this.type,
      routeType: this.routeType,
      stops: this.stops,
      fromLocation: this.fromLocation,
      toLocation: this.toLocation,
      startLocation: this.startLocation,
      endLocation: this.endLocation,
      distance: this.distance,
      totalDistance: this.totalDistance,
      estimatedDuration: this.estimatedDuration,
      operatingHours: this.operatingHours,
      operatingDays: this.operatingDays,
      frequency: this.frequency,
      fare: this.fare,
      assignedBusIds: this.assignedBusIds,
      assignedBuses: this.assignedBuses,
      isActive: this.isActive,
      status: this.status,
      category: this.category,
      city: this.city,
      dailyRides: this.dailyRides,
      totalPassengers: this.totalPassengers,
      // Keep old fields for backward compatibility
      routeName: this.routeName,
      routeNumber: this.routeNumber,
      operatorId: this.operatorId,
      startCoordinates: this.startCoordinates,
      endCoordinates: this.endCoordinates,
      busStops: this.busStops,
      totalStops: this.totalStops,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get public data (for API responses)
  toPublicJSON() {
    return {
      id: this.id,
      routeId: this.routeId,
      name: this.name,
      description: this.description,
      type: this.type,
      stops: this.stops,
      startLocation: this.startLocation,
      endLocation: this.endLocation,
      totalDistance: this.totalDistance,
      estimatedDuration: this.estimatedDuration,
      operatingHours: this.operatingHours,
      frequency: this.frequency,
      fare: this.fare,
      isActive: this.isActive,
      category: this.category
    };
  }
}

module.exports = Route;