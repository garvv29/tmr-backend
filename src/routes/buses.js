const express = require('express');
const router = express.Router();
const BusController = require('../controllers/busController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/search', BusController.searchBuses);
router.get('/search/license-plate', BusController.searchBusByLicensePlate);
router.get('/active', BusController.getActiveBuses);
router.get('/route/:routeId', BusController.getBusesByRoute);
router.get('/:id', BusController.getBusById);
router.get('/', BusController.getAllBuses);

// Protected routes (authentication required)
router.post('/', verifyToken, hasPermission(['master_admin', 'admin']), BusController.createBus);
router.put('/:id', verifyToken, hasPermission(['master_admin', 'admin']), BusController.updateBus);

// Driver management (admin only)
router.post('/:busId/assign-driver', verifyToken, hasPermission(['master_admin', 'admin']), BusController.assignDriver);
router.delete('/:busId/driver/:driverId', verifyToken, hasPermission(['master_admin', 'admin']), BusController.removeDriver);
router.post('/:busId/assign-route', verifyToken, hasPermission(['master_admin', 'admin']), BusController.assignRoute);

// Location updates (driver access)
router.put('/:id/location', verifyToken, hasPermission(['master_admin', 'admin', 'driver']), BusController.updateBusLocation);

module.exports = router;