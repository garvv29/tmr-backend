const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driverController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (limited access)
router.get('/search', DriverController.searchDrivers);
router.get('/:id', DriverController.getDriverById);

// Admin routes (full access)
router.get('/', verifyToken, hasPermission(['master_admin', 'admin']), DriverController.getAllDrivers);
router.post('/', verifyToken, hasPermission(['master_admin', 'admin']), DriverController.createDriver);
router.put('/:id', verifyToken, hasPermission(['master_admin', 'admin']), DriverController.updateDriver);
router.put('/:id/status', verifyToken, hasPermission(['master_admin', 'admin']), DriverController.updateDriverStatus);

// Driver assignment routes
router.post('/:id/assign-bus', verifyToken, hasPermission(['master_admin', 'admin']), DriverController.assignDriverToBus);
router.delete('/:id/assign-bus', verifyToken, hasPermission(['master_admin', 'admin']), DriverController.removeDriverFromBus);

// Get drivers by operator
router.get('/operator/:operatorId', DriverController.getDriversByOperator);
router.get('/operator/:operatorId/available', DriverController.getAvailableDrivers);

module.exports = router;