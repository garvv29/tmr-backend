const express = require('express');
const router = express.Router();
const BusController = require('../controllers/busController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/search', BusController.searchBuses);
router.get('/:id', BusController.getBusById);
router.get('/:id/location', BusController.getLiveLocation);
router.get('/operator/:operatorId', BusController.getBusesByOperator);
router.get('/', BusController.getAllBuses);

// Protected routes (authentication required)
router.post('/', verifyToken, hasPermission(['master_admin', 'admin']), BusController.createBus);
router.put('/:id', verifyToken, hasPermission(['master_admin', 'admin']), BusController.updateBus);

// Driver management (admin only)
router.post('/:id/assign-driver', verifyToken, hasPermission(['master_admin', 'admin']), BusController.assignDriver);
router.post('/:id/assign-route', verifyToken, hasPermission(['master_admin', 'admin']), BusController.assignRoute);
router.put('/:id/status', verifyToken, hasPermission(['master_admin', 'admin']), BusController.updateStatus);

// Location updates (driver access)
router.put('/:id/location', verifyToken, hasPermission(['master_admin', 'admin', 'driver']), BusController.updateLocation);

module.exports = router;