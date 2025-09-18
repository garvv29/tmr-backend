const express = require('express');
const router = express.Router();
const BusStopController = require('../controllers/busStopController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/search', BusStopController.searchBusStops);
router.get('/nearby', BusStopController.getNearbyBusStops);
router.get('/city/:city', BusStopController.getBusStopsByCity);
router.get('/state/:state', BusStopController.getBusStopsByState);
router.get('/:id', BusStopController.getBusStopById);
router.get('/', BusStopController.getAllBusStops);

// Protected routes (authentication required)
router.post('/', verifyToken, hasPermission(['master_admin', 'admin']), BusStopController.createBusStop);
router.put('/:id', verifyToken, hasPermission(['master_admin', 'admin']), BusStopController.updateBusStop);

module.exports = router;