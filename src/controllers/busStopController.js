const BusStop = require('../models/BusStop');

class BusStopController {
  // Create new bus stop (admin only)
  static async createBusStop(req, res) {
    try {
      const {
        stopName,
        stopCode,
        coordinates,
        address,
        city,
        state,
        amenities
      } = req.body;

      // Validation
      if (!stopName || !address || !city || !state) {
        return res.status(400).json({
          error: 'All required fields must be provided',
          required: ['stopName', 'address', 'city', 'state']
        });
      }

      // Check if bus stop already exists in same city
      const existingStop = await BusStop.findByNameAndCity(stopName, city);
      if (existingStop) {
        return res.status(400).json({ error: 'Bus stop with this name already exists in this city' });
      }

      // Create bus stop
      const busStop = new BusStop({
        stopName,
        stopCode,
        coordinates,
        address,
        city,
        state,
        amenities: amenities || []
      });

      await busStop.save();

      res.status(201).json({
        success: true,
        message: 'Bus stop created successfully',
        busStop: busStop.toJSON()
      });
    } catch (error) {
      console.error('Error creating bus stop:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all bus stops (public access)
  static async getAllBusStops(req, res) {
    try {
      const { city, state } = req.query;
      let busStops;

      if (city) {
        busStops = await BusStop.getByCity(city);
      } else if (state) {
        busStops = await BusStop.getByState(state);
      } else {
        busStops = await BusStop.getActiveStops();
      }

      res.json({
        success: true,
        busStops: busStops.map(stop => stop.toJSON()),
        count: busStops.length
      });
    } catch (error) {
      console.error('Error getting bus stops:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get bus stop by ID
  static async getBusStopById(req, res) {
    try {
      const { id } = req.params;
      const busStop = await BusStop.findById(id);

      if (!busStop) {
        return res.status(404).json({ error: 'Bus stop not found' });
      }

      // Get routes that use this stop
      const routes = await busStop.getRoutes();

      res.json({
        success: true,
        busStop: busStop.toJSON(),
        routes: routes.map(route => ({
          id: route.id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          startLocation: route.startLocation,
          endLocation: route.endLocation
        }))
      });
    } catch (error) {
      console.error('Error getting bus stop:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Search bus stops
  static async searchBusStops(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          error: 'Search query is required',
          example: '/api/bus-stops/search?query=Golden Temple'
        });
      }

      const busStops = await BusStop.searchByName(query);

      res.json({
        success: true,
        query,
        busStops: busStops.map(stop => stop.toJSON()),
        count: busStops.length
      });
    } catch (error) {
      console.error('Error searching bus stops:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get nearby bus stops
  static async getNearbyBusStops(req, res) {
    try {
      const { latitude, longitude, radius = 5 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required',
          example: '/api/bus-stops/nearby?latitude=31.6340&longitude=74.8723&radius=5'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);

      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        return res.status(400).json({ error: 'Invalid coordinate or radius values' });
      }

      const nearbyStops = await BusStop.getNearbyStops(lat, lng, radiusKm);

      res.json({
        success: true,
        location: { latitude: lat, longitude: lng },
        radius: radiusKm,
        nearbyStops,
        count: nearbyStops.length
      });
    } catch (error) {
      console.error('Error getting nearby bus stops:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update bus stop (admin only)
  static async updateBusStop(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const busStop = await BusStop.findById(id);
      if (!busStop) {
        return res.status(404).json({ error: 'Bus stop not found' });
      }

      await busStop.updateDetails(updates);

      res.json({
        success: true,
        message: 'Bus stop updated successfully',
        busStop: busStop.toJSON()
      });
    } catch (error) {
      console.error('Error updating bus stop:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get bus stops by city
  static async getBusStopsByCity(req, res) {
    try {
      const { city } = req.params;
      const busStops = await BusStop.getByCity(city);

      res.json({
        success: true,
        city,
        busStops: busStops.map(stop => stop.toJSON()),
        count: busStops.length
      });
    } catch (error) {
      console.error('Error getting bus stops by city:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get bus stops by state
  static async getBusStopsByState(req, res) {
    try {
      const { state } = req.params;
      const busStops = await BusStop.getByState(state);

      res.json({
        success: true,
        state,
        busStops: busStops.map(stop => stop.toJSON()),
        count: busStops.length
      });
    } catch (error) {
      console.error('Error getting bus stops by state:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BusStopController;