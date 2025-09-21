const Route = require('../models/Route');
const BusStop = require('../models/BusStop');
const admin = require('firebase-admin');

class RouteController {
  // Create new route (admin only)
  static async createRoute(req, res) {
    try {
      const {
        routeName,
        routeNumber,
        operatorId,
        startLocation,
        endLocation,
        startCoordinates,
        endCoordinates,
        totalDistance,
        estimatedDuration,
        busStops
      } = req.body;

      // Validation
      if (!routeName || !routeNumber || !operatorId || !startLocation || !endLocation) {
        return res.status(400).json({
          error: 'All required fields must be provided',
          required: ['routeName', 'routeNumber', 'operatorId', 'startLocation', 'endLocation']
        });
      }

      // Check if route number already exists
      const existingRoute = await Route.findByRouteNumber(routeNumber);
      if (existingRoute) {
        return res.status(400).json({ error: 'Route with this number already exists' });
      }

      // Create route
      const route = new Route({
        routeName,
        routeNumber,
        operatorId,
        startLocation,
        endLocation,
        startCoordinates,
        endCoordinates,
        totalDistance,
        estimatedDuration,
        busStops: busStops || [],
        totalStops: busStops ? busStops.length : 0
      });

      await route.save();

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        route: route.toJSON()
      });
    } catch (error) {
      console.error('Error creating route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all routes (public access)
  static async getAllRoutes(req, res) {
    try {
      const { operatorId, city } = req.query;
      let routes;

      if (operatorId) {
        routes = await Route.getByOperator(operatorId);
      } else if (city) {
        routes = await Route.searchByCity(city);
      } else {
        routes = await Route.getActiveRoutes();
      }

      res.json({
        success: true,
        routes: routes.map(route => route.toJSON()),
        count: routes.length
      });
    } catch (error) {
      console.error('Error getting routes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get route by ID with stop details
  static async getRouteById(req, res) {
    try {
      const { id } = req.params;
      const route = await Route.findById(id);

      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      const routeWithStops = await route.getRouteWithStops();

      res.json({
        success: true,
        route: routeWithStops
      });
    } catch (error) {
      console.error('Error getting route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Search routes between locations
  static async searchRoutes(req, res) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          error: 'From and to locations are required',
          example: '/api/routes/search?from=Amritsar&to=Ludhiana'
        });
      }

      const routes = await Route.getRoutesByLocations(from, to);

      res.json({
        success: true,
        from,
        to,
        routes: routes.map(route => route.toJSON()),
        count: routes.length
      });
    } catch (error) {
      console.error('Error searching routes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update route (admin only)
  static async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const route = await Route.findById(id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      await route.updateDetails(updates);

      res.json({
        success: true,
        message: 'Route updated successfully',
        route: route.toJSON()
      });
    } catch (error) {
      console.error('Error updating route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Add bus stop to route (admin only)
  static async addBusStopToRoute(req, res) {
    try {
      const { id } = req.params;
      const { stopId, position } = req.body;

      if (!stopId) {
        return res.status(400).json({ error: 'Stop ID is required' });
      }

      const route = await Route.findById(id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      // Verify bus stop exists
      const busStop = await BusStop.findById(stopId);
      if (!busStop) {
        return res.status(404).json({ error: 'Bus stop not found' });
      }

      await route.addBusStop(stopId, position);

      res.json({
        success: true,
        message: 'Bus stop added to route successfully',
        route: route.toJSON()
      });
    } catch (error) {
      console.error('Error adding bus stop to route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Remove bus stop from route (admin only)
  static async removeBusStopFromRoute(req, res) {
    try {
      const { id, stopId } = req.params;

      const route = await Route.findById(id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      await route.removeBusStop(stopId);

      res.json({
        success: true,
        message: 'Bus stop removed from route successfully',
        route: route.toJSON()
      });
    } catch (error) {
      console.error('Error removing bus stop from route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get routes by operator (public access)
  static async getRoutesByOperator(req, res) {
    try {
      const { operatorId } = req.params;
      const routes = await Route.getByOperator(operatorId);

      res.json({
        success: true,
        operatorId,
        routes: routes.map(route => route.toJSON()),
        count: routes.length
      });
    } catch (error) {
      console.error('Error getting routes by operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get detailed stops for a specific route
  static async getRouteStops(req, res) {
    try {
      const { id } = req.params;
      
      // Get route stops with bus stop details
      const routeStopsSnapshot = await admin.firestore()
        .collection('routeStops')
        .where('routeId', '==', id)
        .get();

      if (routeStopsSnapshot.empty) {
        return res.status(404).json({ 
          error: 'No stops found for this route',
          routeId: id
        });
      }

      const stops = [];
      
      // Get detailed information for each stop
      for (const doc of routeStopsSnapshot.docs) {
        const routeStopData = doc.data();
        
        // Get bus stop details
        const busStopDoc = await admin.firestore()
          .collection('busStops')
          .doc(routeStopData.stopId)
          .get();

        if (busStopDoc.exists) {
          const busStopData = busStopDoc.data();
          
          stops.push({
            routeStopId: doc.id,
            stopOrder: routeStopData.stopOrder,
            busStopsHere: routeStopData.busStopsHere || true,
            arrivalTime: routeStopData.arrivalTime,
            departureTime: routeStopData.departureTime,
            stopDetails: {
              id: busStopData.id,
              stopName: busStopData.stopName,
              stopCode: busStopData.stopCode,
              coordinates: busStopData.coordinates,
              address: busStopData.address,
              amenities: busStopData.amenities || [],
              isMinorStop: busStopData.isMinorStop || false
            }
          });
        }
      }

      // Sort stops by stopOrder in memory to avoid composite index requirement
      stops.sort((a, b) => a.stopOrder - b.stopOrder);

      res.json({
        success: true,
        routeId: id,
        stops,
        totalStops: stops.length,
        busStops: stops.filter(stop => stop.busStopsHere).length,
        minorStops: stops.filter(stop => !stop.busStopsHere).length
      });
    } catch (error) {
      console.error('Error getting route stops:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Search routes between two bus stops
  static async searchRoutesBetweenStops(req, res) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          error: 'Both from and to parameters are required'
        });
      }

      // Find routes that contain both stops
      const routes = await Route.findRoutesBetweenStops(from, to);

      if (routes.length === 0) {
        return res.json({
          success: true,
          message: 'No routes found between the specified stops',
          routes: [],
          totalRoutes: 0
        });
      }

      // Get detailed route information with assigned buses
      const routesWithBuses = await Promise.all(
        routes.map(async (route) => {
          const routeDetails = await route.getRouteWithStops();
          const assignedBuses = await route.getAssignedBuses();
          
          return {
            ...routeDetails,
            assignedBuses,
            totalBuses: assignedBuses.length,
            activeBuses: assignedBuses.filter(bus => bus.isActive && bus.currentStatus !== 'maintenance').length
          };
        })
      );

      res.json({
        success: true,
        message: `Found ${routes.length} route(s) between ${from} and ${to}`,
        routes: routesWithBuses,
        totalRoutes: routes.length,
        searchCriteria: { from, to }
      });
    } catch (error) {
      console.error('Error searching routes between stops:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get buses running on a specific route
  static async getRouteBuses(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Route ID is required' });
      }

      const route = await Route.findById(id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      const assignedBuses = await route.getAssignedBuses();

      // Get additional bus details with driver information
      const Bus = require('../models/Bus');
      const Driver = require('../models/Driver');
      
      const busesWithDetails = await Promise.all(
        assignedBuses.map(async (bus) => {
          let driverDetails = null;
          if (bus.driverId) {
            const driver = await Driver.findById(bus.driverId);
            if (driver) {
              driverDetails = {
                id: driver.id,
                driverName: driver.driverName,
                phoneNumber: driver.phoneNumber,
                licenseNumber: driver.licenseNumber,
                experience: driver.experience
              };
            }
          }

          return {
            ...bus,
            driverDetails,
            routeInfo: {
              routeId: route.id,
              routeName: route.routeName,
              routeNumber: route.routeNumber,
              totalDistance: route.totalDistance,
              estimatedDuration: route.estimatedDuration
            }
          };
        })
      );

      res.json({
        success: true,
        route: {
          id: route.id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          startLocation: route.startLocation,
          endLocation: route.endLocation,
          totalDistance: route.totalDistance,
          estimatedDuration: route.estimatedDuration,
          frequency: route.frequency,
          fare: route.fare,
          operatingHours: route.operatingHours,
          category: route.category
        },
        buses: busesWithDetails,
        totalBuses: busesWithDetails.length,
        activeBuses: busesWithDetails.filter(bus => bus.isActive && bus.currentStatus !== 'maintenance').length,
        runningBuses: busesWithDetails.filter(bus => bus.currentStatus === 'running').length
      });
    } catch (error) {
      console.error('Error getting route buses:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RouteController;