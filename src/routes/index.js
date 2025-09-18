const express = require('express');
const router = express.Router();

// Import route modules
const roleRoutes = require('./roles');
const userRoutes = require('./users');
const busOperatorRoutes = require('./busOperators');
const routeRoutes = require('./routeRoutes');
const busStopRoutes = require('./busStops');
const busRoutes = require('./buses');
const driverRoutes = require('./drivers');
const locationRoutes = require('./location');
const cityRoutes = require('./cities');

// Define API routes
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/bus-operators', busOperatorRoutes);
router.use('/routes', routeRoutes);
router.use('/bus-stops', busStopRoutes);
router.use('/buses', busRoutes);
router.use('/drivers', driverRoutes);
router.use('/location', locationRoutes);
router.use('/cities', cityRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Track My Ride API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: ['/api/roles', '/api/users'],
      management: ['/api/bus-operators', '/api/buses', '/api/drivers'],
      routing: ['/api/routes', '/api/bus-stops'],
      tracking: ['/api/location/bus/:id', '/api/location/route/:id/active'],
      public: ['/api/routes/search', '/api/bus-stops/nearby', '/api/location/area/active']
    }
  });
});

module.exports = router;