const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/bus/:busId', LocationController.getBusLocation);
router.get('/route/:routeId/active', LocationController.getRouteActiveBuses);
// router.get('/area/active', LocationController.getAreaActiveBuses);
// router.get('/stats', LocationController.getTrackingStats);

// Live tracking routes (for Route 004)
router.post('/update', LocationController.updateLocation); // Driver app posts location
router.get('/live/:busId', LocationController.getLiveLocation); // User app gets bus location
router.get('/route004/live', LocationController.getRoute004LiveLocations); // Get all Route 004 buses

// Driver/Admin routes (authentication required)
router.put('/bus/:busId', verifyToken, hasPermission(['master_admin', 'admin', 'driver']), LocationController.updateBusLocation);
// router.delete('/bus/:busId', verifyToken, hasPermission(['master_admin', 'admin', 'driver']), LocationController.stopLocationTracking);

// Admin only routes
router.get('/bus/:busId/history', verifyToken, hasPermission(['master_admin', 'admin']), LocationController.getBusLocationHistory);

module.exports = router;