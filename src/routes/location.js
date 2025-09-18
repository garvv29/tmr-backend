const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/bus/:busId', LocationController.getBusLocation);
router.get('/route/:routeId/active', LocationController.getRouteActiveBuses);
router.get('/area/active', LocationController.getAreaActiveBuses);
router.get('/stats', LocationController.getTrackingStats);

// Driver/Admin routes (authentication required)
router.put('/bus/:busId', verifyToken, hasPermission(['master_admin', 'admin', 'driver']), LocationController.updateBusLocation);
router.delete('/bus/:busId', verifyToken, hasPermission(['master_admin', 'admin', 'driver']), LocationController.stopLocationTracking);

// Admin only routes
router.get('/bus/:busId/history', verifyToken, hasPermission(['master_admin', 'admin']), LocationController.getBusLocationHistory);

module.exports = router;