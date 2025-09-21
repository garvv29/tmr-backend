const { rtdb } = require('../../config/firebase');
const admin = require('firebase-admin');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

class LocationController {
  // In-memory storage for live tracking (since Firebase rtdb is not configured)
  static liveTrackingData = {};

  // Update bus location (driver only)
  static async updateBusLocation(req, res) {
    try {
      const { busId } = req.params;
      const { latitude, longitude, speed, heading } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        });
      }

      // Verify bus exists
      const bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      // Verify driver is assigned to this bus (unless admin)
      if (req.user.role === 'driver' && bus.driverId !== req.user.uid) {
        return res.status(403).json({ error: 'Access denied: Not assigned to this bus' });
      }

      // Create location data
      const locationData = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        timestamp: new Date().toISOString(),
        busId: busId,
        driverId: bus.driverId,
        routeId: bus.currentRouteId || null
      };

      // Update real-time location in Firebase Realtime Database
      await rtdb.ref(`busLocations/${busId}`).set(locationData);

      // Also update bus status to 'en_route' if currently inactive
      if (bus.status === 'inactive') {
        await bus.updateStatus('en_route');
      }

      res.json({
        success: true,
        message: 'Location updated successfully',
        location: locationData
      });
    } catch (error) {
      console.error('Error updating bus location:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get live bus location
  static async getBusLocation(req, res) {
    try {
      const { busId } = req.params;

      // Get location from Realtime Database
      const locationSnapshot = await rtdb.ref(`busLocations/${busId}`).once('value');
      const locationData = locationSnapshot.val();

      if (!locationData) {
        return res.status(404).json({ error: 'Live location not available' });
      }

      // Check if location is recent (within last 5 minutes)
      const locationTime = new Date(locationData.timestamp);
      const now = new Date();
      const diffMinutes = (now - locationTime) / (1000 * 60);

      res.json({
        success: true,
        busId,
        location: locationData,
        isRecent: diffMinutes <= 5,
        lastUpdateMinutes: Math.round(diffMinutes)
      });
    } catch (error) {
      console.error('Error getting bus location:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all active bus locations for a route
  static async getRouteActiveBuses(req, res) {
    try {
      const { routeId } = req.params;

      // Verify route exists
      const route = await Route.findById(routeId);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      // Get all bus locations from Realtime Database
      const locationsSnapshot = await rtdb.ref('busLocations').once('value');
      const locationsData = locationsSnapshot.val() || {};

      const activeBuses = [];
      const now = new Date();

      Object.keys(locationsData).forEach(busId => {
        const locationData = locationsData[busId];
        
        // Filter by route and recent activity
        if (locationData.routeId === routeId) {
          const locationTime = new Date(locationData.timestamp);
          const diffMinutes = (now - locationTime) / (1000 * 60);
          
          if (diffMinutes <= 10) { // Consider active if updated within 10 minutes
            activeBuses.push({
              busId,
              ...locationData,
              isRecent: diffMinutes <= 5,
              lastUpdateMinutes: Math.round(diffMinutes)
            });
          }
        }
      });

      res.json({
        success: true,
        routeId,
        activeBuses,
        totalActiveBuses: activeBuses.length
      });
    } catch (error) {
      console.error('Error getting route active buses:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // LIVE TRACKING METHODS FOR ROUTE 004
  
  // Update live location (simplified for driver app)
  static async updateLocation(req, res) {
    try {
      const { busId, routeId, latitude, longitude, timestamp, accuracy, speed, heading } = req.body;

      // Validate required fields
      if (!busId || !routeId || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: busId, routeId, latitude, longitude'
        });
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates'
        });
      }

      // Store in memory for testing (instead of Firebase)
      LocationController.liveTrackingData[busId] = {
        busId,
        routeId,
        latitude,
        longitude,
        timestamp: timestamp || new Date().toISOString(),
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
        isActive: true,
        lastUpdated: new Date().toISOString()
      };

      console.log(`📍 Live location updated for bus ${busId} on route ${routeId}: ${latitude}, ${longitude}`);
      console.log(`🗃️ Stored in memory. Total buses tracked: ${Object.keys(LocationController.liveTrackingData).length}`);

      res.status(200).json({
        success: true,
        message: 'Live location updated successfully',
        data: {
          busId,
          routeId,
          latitude,
          longitude,
          timestamp: timestamp || new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error updating live location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update live location',
        error: error.message
      });
    }
  }

  // Get live location for a specific bus
  static async getLiveLocation(req, res) {
    try {
      const { busId } = req.params;
      
      const busData = LocationController.liveTrackingData[busId];
      
      if (!busData) {
        return res.status(404).json({
          success: false,
          message: 'Live location not found for this bus'
        });
      }

      // Check if location is recent (within last 5 minutes)
      const locationTime = new Date(busData.timestamp);
      const now = new Date();
      const ageInMinutes = (now - locationTime) / (1000 * 60);

      res.status(200).json({
        success: true,
        data: {
          ...busData,
          isStale: ageInMinutes > 5,
          ageMinutes: Math.round(ageInMinutes * 10) / 10,
          source: 'memory'
        }
      });

    } catch (error) {
      console.error('Error getting live location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get live location',
        error: error.message
      });
    }
  }

  // Get all live locations for Route 004
  static async getRoute004LiveLocations(req, res) {
    try {
      const routeId = 'route_railway_magneto'; // Route 004

      const locations = [];
      const now = new Date();

      // Check in-memory data
      Object.keys(LocationController.liveTrackingData).forEach(busId => {
        const busData = LocationController.liveTrackingData[busId];
        if (busData.routeId === routeId && busData.isActive) {
          const locationTime = new Date(busData.timestamp);
          const ageInMinutes = (now - locationTime) / (1000 * 60);

          // Only include recent locations (within 5 minutes)
          if (ageInMinutes <= 5) {
            locations.push({
              busId,
              routeId: busData.routeId,
              latitude: busData.latitude,
              longitude: busData.longitude,
              timestamp: busData.timestamp,
              speed: busData.speed,
              heading: busData.heading,
              isActive: true,
              ageMinutes: Math.round(ageInMinutes * 10) / 10
            });
          }
        }
      });

      console.log(`🔍 Route 004 search: Found ${locations.length} active buses`);
      console.log(`📊 All tracked buses: ${Object.keys(LocationController.liveTrackingData).length}`);

      res.status(200).json({
        success: true,
        route: 'Route 004 - Railway Station to Magneto Mall',
        data: locations,
        totalActiveBuses: locations.length
      });

    } catch (error) {
      console.error('Error getting Route 004 live locations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Route 004 live locations',
        error: error.message
      });
    }
  }
}

module.exports = LocationController;