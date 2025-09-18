const Bus = require('../models/Bus');
const Route = require('../models/Route');
const admin = require('firebase-admin');

class BusController {
  // Create new bus (admin only)
  static async createBus(req, res) {
    try {
      const {
        busNumber,
        vehicleNumber,
        busModel,
        capacity,
        amenities,
        operatorId
      } = req.body;

      // Validation
      if (!busNumber || !vehicleNumber || !capacity || !operatorId) {
        return res.status(400).json({
          error: 'All required fields must be provided',
          required: ['busNumber', 'vehicleNumber', 'capacity', 'operatorId']
        });
      }

      // Check if bus with vehicle number already exists
      const existingBus = await Bus.findByVehicleNumber(vehicleNumber);
      if (existingBus) {
        return res.status(400).json({ error: 'Bus with this vehicle number already exists' });
      }

      // Create bus
      const bus = new Bus({
        busNumber,
        vehicleNumber,
        busModel,
        capacity,
        amenities: amenities || [],
        operatorId
      });

      await bus.save();

      res.status(201).json({
        success: true,
        message: 'Bus created successfully',
        bus: bus.toJSON()
      });
    } catch (error) {
      console.error('Error creating bus:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all buses
  static async getAllBuses(req, res) {
    try {
      const { operatorId, status, activeOnly } = req.query;
      let buses;

      if (operatorId) {
        buses = await Bus.getByOperator(operatorId);
      } else if (activeOnly === 'true') {
        buses = await Bus.getActiveBuses();
      } else {
        buses = await Bus.getAllBuses();
      }

      // Filter by status if provided
      if (status) {
        buses = buses.filter(bus => bus.status === status);
      }

      res.json({
        success: true,
        buses: buses.map(bus => bus.toJSON()),
        count: buses.length
      });
    } catch (error) {
      console.error('Error getting buses:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get bus by ID
  static async getBusById(req, res) {
    try {
      const { id } = req.params;
      const bus = await Bus.findById(id);

      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      // Get current route if bus is active
      let currentRoute = null;
      if (bus.status === 'active' && bus.currentRouteId) {
        currentRoute = await Route.findById(bus.currentRouteId);
      }

      // Get live location
      const liveLocation = await bus.getLiveLocation();

      res.json({
        success: true,
        bus: bus.toJSON(),
        currentRoute: currentRoute ? {
          id: currentRoute.id,
          routeName: currentRoute.routeName,
          routeNumber: currentRoute.routeNumber,
          startLocation: currentRoute.startLocation,
          endLocation: currentRoute.endLocation
        } : null,
        liveLocation
      });
    } catch (error) {
      console.error('Error getting bus:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get buses by operator
  static async getBusesByOperator(req, res) {
    try {
      const { operatorId } = req.params;
      const buses = await Bus.getByOperator(operatorId);

      res.json({
        success: true,
        operatorId,
        buses: buses.map(bus => bus.toJSON()),
        count: buses.length
      });
    } catch (error) {
      console.error('Error getting buses by operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update bus details (admin only)
  static async updateBus(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const bus = await Bus.findById(id);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      await bus.updateDetails(updates);

      res.json({
        success: true,
        message: 'Bus updated successfully',
        bus: bus.toJSON()
      });
    } catch (error) {
      console.error('Error updating bus:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Assign driver to bus (admin only)
  static async assignDriver(req, res) {
    try {
      const { id } = req.params;
      const { driverId, coDriverId } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      const bus = await Bus.findById(id);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      await bus.assignDriver(driverId, coDriverId);

      res.json({
        success: true,
        message: 'Driver assigned successfully',
        bus: bus.toJSON()
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Assign route to bus (admin only)
  static async assignRoute(req, res) {
    try {
      const { id } = req.params;
      const { routeId } = req.body;

      if (!routeId) {
        return res.status(400).json({ error: 'Route ID is required' });
      }

      const bus = await Bus.findById(id);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      // Verify route exists
      const route = await Route.findById(routeId);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      await bus.assignRoute(routeId);

      res.json({
        success: true,
        message: 'Route assigned successfully',
        bus: bus.toJSON(),
        route: {
          id: route.id,
          routeName: route.routeName,
          routeNumber: route.routeNumber
        }
      });
    } catch (error) {
      console.error('Error assigning route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update bus status
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'inactive', 'maintenance', 'en_route'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Valid status is required',
          validStatuses
        });
      }

      const bus = await Bus.findById(id);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      await bus.updateStatus(status);

      res.json({
        success: true,
        message: 'Bus status updated successfully',
        bus: bus.toJSON()
      });
    } catch (error) {
      console.error('Error updating bus status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update bus location (driver only)
  static async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        });
      }

      const bus = await Bus.findById(id);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      // Verify driver is assigned to this bus
      if (req.user.role === 'driver' && bus.driverId !== req.user.uid) {
        return res.status(403).json({ error: 'Access denied: Not assigned to this bus' });
      }

      await bus.updateLocation(latitude, longitude);

      res.json({
        success: true,
        message: 'Location updated successfully',
        location: { latitude, longitude }
      });
    } catch (error) {
      console.error('Error updating bus location:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get bus live location
  static async getLiveLocation(req, res) {
    try {
      const { id } = req.params;

      const bus = await Bus.findById(id);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      const liveLocation = await bus.getLiveLocation();

      if (!liveLocation) {
        return res.status(404).json({ error: 'Live location not available' });
      }

      res.json({
        success: true,
        busId: id,
        liveLocation
      });
    } catch (error) {
      console.error('Error getting bus live location:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Search buses
  static async searchBuses(req, res) {
    try {
      const { query, type } = req.query;

      if (!query) {
        return res.status(400).json({
          error: 'Search query is required',
          example: '/api/buses/search?query=PB 02&type=vehicle'
        });
      }

      let buses;
      if (type === 'vehicle') {
        buses = await Bus.searchByVehicleNumber(query);
      } else {
        buses = await Bus.searchByBusNumber(query);
      }

      res.json({
        success: true,
        query,
        type: type || 'busNumber',
        buses: buses.map(bus => bus.toJSON()),
        count: buses.length
      });
    } catch (error) {
      console.error('Error searching buses:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BusController;