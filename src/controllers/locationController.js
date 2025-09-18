const { rtdb } = require('../../config/firebase');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

class LocationController {
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

      // Get all bus locations for this route
      const locationsSnapshot = await rtdb.ref('busLocations')
        .orderByChild('routeId')
        .equalTo(routeId)
        .once('value');

      const locationsData = locationsSnapshot.val() || {};
      const activeBuses = [];

      // Filter recent locations (within last 10 minutes)
      const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);

      for (const [busId, locationData] of Object.entries(locationsData)) {
        const locationTime = new Date(locationData.timestamp);
        if (locationTime >= cutoffTime) {
          // Get bus details
          const bus = await Bus.findById(busId);
          activeBuses.push({
            ...locationData,
            busDetails: bus ? {
              busNumber: bus.busNumber,
              vehicleNumber: bus.vehicleNumber
            } : null
          });
        }
      }

      res.json({
        success: true,
        routeId,
        routeName: route.routeName,
        activeBuses,
        count: activeBuses.length
      });
    } catch (error) {
      console.error('Error getting route active buses:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all active buses in a city/area
  static async getAreaActiveBuses(req, res) {
    try {
      const { city, state } = req.query;
      const { latitude, longitude, radius = 10 } = req.query;

      let activeBuses = [];

      if (latitude && longitude) {
        // Get buses within radius
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const radiusKm = parseFloat(radius);

        const locationsSnapshot = await rtdb.ref('busLocations').once('value');
        const locationsData = locationsSnapshot.val() || {};

        const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);

        for (const [busId, locationData] of Object.entries(locationsData)) {
          const locationTime = new Date(locationData.timestamp);
          if (locationTime >= cutoffTime) {
            // Calculate distance
            const distance = LocationController.calculateDistance(
              lat, lng, 
              locationData.latitude, locationData.longitude
            );

            if (distance <= radiusKm) {
              const bus = await Bus.findById(busId);
              activeBuses.push({
                ...locationData,
                distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
                busDetails: bus ? {
                  busNumber: bus.busNumber,
                  vehicleNumber: bus.vehicleNumber
                } : null
              });
            }
          }
        }
      } else {
        // Get all recent active buses
        const locationsSnapshot = await rtdb.ref('busLocations').once('value');
        const locationsData = locationsSnapshot.val() || {};
        const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);

        for (const [busId, locationData] of Object.entries(locationsData)) {
          const locationTime = new Date(locationData.timestamp);
          if (locationTime >= cutoffTime) {
            const bus = await Bus.findById(busId);
            activeBuses.push({
              ...locationData,
              busDetails: bus ? {
                busNumber: bus.busNumber,
                vehicleNumber: bus.vehicleNumber
              } : null
            });
          }
        }
      }

      res.json({
        success: true,
        area: { city, state, latitude, longitude, radius },
        activeBuses,
        count: activeBuses.length
      });
    } catch (error) {
      console.error('Error getting area active buses:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get bus location history
  static async getBusLocationHistory(req, res) {
    try {
      const { busId } = req.params;
      const { hours = 24 } = req.query;

      // In a real implementation, you would store location history
      // For now, we'll just return the current location
      const locationSnapshot = await rtdb.ref(`busLocations/${busId}`).once('value');
      const locationData = locationSnapshot.val();

      if (!locationData) {
        return res.status(404).json({ error: 'No location history available' });
      }

      res.json({
        success: true,
        busId,
        hours: parseInt(hours),
        locationHistory: [locationData], // In real app, this would be an array of historical locations
        message: 'Full location history tracking will be implemented with location storage'
      });
    } catch (error) {
      console.error('Error getting bus location history:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Stop location tracking (driver/admin)
  static async stopLocationTracking(req, res) {
    try {
      const { busId } = req.params;

      // Verify bus exists
      const bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      // Verify permissions
      if (req.user.role === 'driver' && bus.driverId !== req.user.uid) {
        return res.status(403).json({ error: 'Access denied: Not assigned to this bus' });
      }

      // Remove from real-time tracking
      await rtdb.ref(`busLocations/${busId}`).remove();

      // Update bus status to inactive
      await bus.updateStatus('inactive');

      res.json({
        success: true,
        message: 'Location tracking stopped successfully',
        busId
      });
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Helper function to calculate distance between two points
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Get real-time tracking statistics
  static async getTrackingStats(req, res) {
    try {
      const locationsSnapshot = await rtdb.ref('busLocations').once('value');
      const locationsData = locationsSnapshot.val() || {};

      const now = new Date();
      const cutoffTime = new Date(now - 10 * 60 * 1000); // 10 minutes ago

      let activeBuses = 0;
      let totalBuses = Object.keys(locationsData).length;

      for (const locationData of Object.values(locationsData)) {
        const locationTime = new Date(locationData.timestamp);
        if (locationTime >= cutoffTime) {
          activeBuses++;
        }
      }

      res.json({
        success: true,
        stats: {
          totalTrackedBuses: totalBuses,
          currentlyActiveBuses: activeBuses,
          inactiveBuses: totalBuses - activeBuses,
          lastUpdated: now.toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting tracking stats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = LocationController;