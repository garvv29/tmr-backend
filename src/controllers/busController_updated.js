const Bus = require('../models/Bus');
const Route = require('../models/Route');
const LiveLocation = require('../models/LiveLocation');
const admin = require('firebase-admin');

class BusController {
  // Create new bus (updated for new schema)
  static async createBus(req, res) {
    try {
      const {
        busId,
        busName,
        licensePlate,
        capacity,
        model,
        manufacturer,
        yearOfManufacture,
        features,
        fuelType,
        insuranceInfo,
        // Keep backward compatibility
        busNumber,
        vehicleNumber,
        busModel,
        amenities,
        operatorId
      } = req.body;

      // Validation for new schema
      const finalBusId = busId || busNumber;
      const finalLicensePlate = licensePlate || vehicleNumber;
      const finalBusName = busName || `Bus ${finalBusId}`;
      const finalModel = model || busModel;
      const finalFeatures = features || amenities || [];

      if (!finalBusId || !finalLicensePlate || !capacity) {
        return res.status(400).json({
          success: false,
          error: 'Required fields missing',
          required: ['busId (or busNumber)', 'licensePlate (or vehicleNumber)', 'capacity']
        });
      }

      // Check if bus with busId already exists
      const existingBus = await Bus.findByBusId(finalBusId);
      if (existingBus) {
        return res.status(400).json({ 
          success: false,
          error: 'Bus with this ID already exists' 
        });
      }

      // Check if license plate already exists
      const existingLicense = await Bus.findByLicensePlate(finalLicensePlate);
      if (existingLicense) {
        return res.status(400).json({ 
          success: false,
          error: 'Bus with this license plate already exists' 
        });
      }

      // Create bus with new schema
      const bus = new Bus({
        busId: finalBusId,
        busName: finalBusName,
        licensePlate: finalLicensePlate,
        capacity: parseInt(capacity),
        model: finalModel,
        manufacturer: manufacturer || 'Unknown',
        yearOfManufacture: yearOfManufacture || new Date().getFullYear(),
        features: finalFeatures,
        fuelType: fuelType || 'diesel',
        insuranceInfo: insuranceInfo || null,
        operatorId: operatorId // Keep for backward compatibility
      });

      await bus.save();

      res.status(201).json({
        success: true,
        message: 'Bus created successfully',
        data: bus.toPublicJSON()
      });
    } catch (error) {
      console.error('Error creating bus:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get all buses (updated response format)
  static async getAllBuses(req, res) {
    try {
      const { operatorId, status, activeOnly, page = 1, limit = 20 } = req.query;
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

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedBuses = buses.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedBuses.map(bus => bus.toPublicJSON()),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(buses.length / limit),
          totalItems: buses.length,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting buses:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get bus by ID (updated response format)
  static async getBusById(req, res) {
    try {
      const { id } = req.params;
      // Try to find by ID first, then by busId
      let bus = await Bus.findById(id);
      if (!bus) {
        bus = await Bus.findByBusId(id);
      }

      if (!bus) {
        return res.status(404).json({ 
          success: false,
          error: 'Bus not found' 
        });
      }

      // Get current route if bus is active
      let currentRoute = null;
      if (bus.status === 'active' && bus.assignedRouteId) {
        currentRoute = await Route.findById(bus.assignedRouteId);
      }

      // Get live location
      const liveLocation = await LiveLocation.findByEntityId(bus.id, 'bus');

      res.json({
        success: true,
        data: {
          bus: bus.toPublicJSON(),
          currentRoute: currentRoute ? currentRoute.toPublicJSON() : null,
          liveLocation: liveLocation ? liveLocation.toPublicJSON() : null
        }
      });
    } catch (error) {
      console.error('Error getting bus by ID:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Update bus location (new method for live tracking)
  static async updateBusLocation(req, res) {
    try {
      const { id } = req.params;
      const { lat, lng, address, speed, heading, accuracy } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      const bus = await Bus.findById(id) || await Bus.findByBusId(id);
      if (!bus) {
        return res.status(404).json({ 
          success: false,
          error: 'Bus not found' 
        });
      }

      // Update bus current location
      bus.currentLocation = { lat: parseFloat(lat), lng: parseFloat(lng), address: address || '' };
      await bus.save();

      // Create or update live location
      let liveLocation = await LiveLocation.findByEntityId(bus.id, 'bus');
      if (!liveLocation) {
        liveLocation = new LiveLocation({
          entityId: bus.id,
          entityType: 'bus',
          routeId: bus.assignedRouteId
        });
      }

      await liveLocation.updateLocation(lat, lng, speed || 0, heading || 0, accuracy || 0);

      res.json({
        success: true,
        message: 'Bus location updated successfully',
        data: liveLocation.toPublicJSON()
      });
    } catch (error) {
      console.error('Error updating bus location:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get buses by route
  static async getBusesByRoute(req, res) {
    try {
      const { routeId } = req.params;
      const buses = await Bus.getByRoute(routeId);

      // Get live locations for all buses
      const busesWithLocations = await Promise.all(
        buses.map(async (bus) => {
          const liveLocation = await LiveLocation.findByEntityId(bus.id, 'bus');
          return {
            ...bus.toPublicJSON(),
            liveLocation: liveLocation ? liveLocation.toPublicJSON() : null
          };
        })
      );

      res.json({
        success: true,
        data: busesWithLocations,
        count: busesWithLocations.length
      });
    } catch (error) {
      console.error('Error getting buses by route:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Update bus details
  static async updateBus(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      let bus = await Bus.findById(id);
      if (!bus) {
        bus = await Bus.findByBusId(id);
      }

      if (!bus) {
        return res.status(404).json({ 
          success: false,
          error: 'Bus not found' 
        });
      }

      // Update bus properties
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id') {
          bus[key] = updates[key];
        }
      });

      await bus.save();

      res.json({
        success: true,
        message: 'Bus updated successfully',
        data: bus.toPublicJSON()
      });
    } catch (error) {
      console.error('Error updating bus:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Assign driver to bus
  static async assignDriver(req, res) {
    try {
      const { busId } = req.params;
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          error: 'Driver ID is required'
        });
      }

      const bus = await Bus.findById(busId) || await Bus.findByBusId(busId);
      if (!bus) {
        return res.status(404).json({ 
          success: false,
          error: 'Bus not found' 
        });
      }

      // Add driver to assignedDriverIds if not already assigned
      if (!bus.assignedDriverIds.includes(driverId)) {
        bus.assignedDriverIds.push(driverId);
        await bus.save();
      }

      res.json({
        success: true,
        message: 'Driver assigned to bus successfully',
        data: bus.toPublicJSON()
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Remove driver from bus
  static async removeDriver(req, res) {
    try {
      const { busId, driverId } = req.params;

      const bus = await Bus.findById(busId) || await Bus.findByBusId(busId);
      if (!bus) {
        return res.status(404).json({ 
          success: false,
          error: 'Bus not found' 
        });
      }

      // Remove driver from assignedDriverIds
      bus.assignedDriverIds = bus.assignedDriverIds.filter(id => id !== driverId);
      await bus.save();

      res.json({
        success: true,
        message: 'Driver removed from bus successfully',
        data: bus.toPublicJSON()
      });
    } catch (error) {
      console.error('Error removing driver:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Assign route to bus
  static async assignRoute(req, res) {
    try {
      const { busId } = req.params;
      const { routeId } = req.body;

      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required'
        });
      }

      const bus = await Bus.findById(busId) || await Bus.findByBusId(busId);
      if (!bus) {
        return res.status(404).json({ 
          success: false,
          error: 'Bus not found' 
        });
      }

      const route = await Route.findById(routeId) || await Route.findByRouteId(routeId);
      if (!route) {
        return res.status(404).json({ 
          success: false,
          error: 'Route not found' 
        });
      }

      bus.assignedRouteId = route.id;
      await bus.save();

      res.json({
        success: true,
        message: 'Route assigned to bus successfully',
        data: {
          bus: bus.toPublicJSON(),
          route: route.toPublicJSON()
        }
      });
    } catch (error) {
      console.error('Error assigning route:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get active buses (with live locations)
  static async getActiveBuses(req, res) {
    try {
      const { routeId } = req.query;
      let buses;

      if (routeId) {
        buses = await Bus.getByRoute(routeId);
      } else {
        buses = await Bus.getActiveBuses();
      }

      // Get live locations for all active buses
      const activeBusesWithLocations = await Promise.all(
        buses
          .filter(bus => bus.status === 'active')
          .map(async (bus) => {
            const liveLocation = await LiveLocation.findByEntityId(bus.id, 'bus');
            return {
              ...bus.toPublicJSON(),
              liveLocation: liveLocation ? liveLocation.toPublicJSON() : null
            };
          })
      );

      res.json({
        success: true,
        data: activeBusesWithLocations,
        count: activeBusesWithLocations.length
      });
    } catch (error) {
      console.error('Error getting active buses:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Search buses
  static async searchBuses(req, res) {
    try {
      const { query, route, status } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const buses = await Bus.getAllBuses();
      
      // Filter buses based on search criteria
      const filteredBuses = buses.filter(bus => {
        const matchesQuery = bus.busId.toLowerCase().includes(query.toLowerCase()) ||
                           bus.busName.toLowerCase().includes(query.toLowerCase()) ||
                           bus.licensePlate.toLowerCase().includes(query.toLowerCase());
        
        const matchesRoute = !route || bus.assignedRouteId === route;
        const matchesStatus = !status || bus.status === status;
        
        return matchesQuery && matchesRoute && matchesStatus;
      });

      res.json({
        success: true,
        data: filteredBuses.map(bus => bus.toPublicJSON()),
        count: filteredBuses.length
      });
    } catch (error) {
      console.error('Error searching buses:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = BusController;