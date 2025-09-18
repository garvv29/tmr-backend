const express = require('express');
const router = express.Router();
const RouteController = require('../controllers/routeController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/search', RouteController.searchRoutes);
router.get('/:id', RouteController.getRouteById);
router.get('/', RouteController.getAllRoutes);

// Protected routes (authentication required)
router.post('/', verifyToken, hasPermission(['master_admin', 'admin']), RouteController.createRoute);
router.put('/:id', verifyToken, hasPermission(['master_admin', 'admin']), RouteController.updateRoute);
router.post('/:id/stops', verifyToken, hasPermission(['master_admin', 'admin']), RouteController.addBusStopToRoute);
router.delete('/:id/stops/:stopId', verifyToken, hasPermission(['master_admin', 'admin']), RouteController.removeBusStopFromRoute);

// Get routes by operator
router.get('/operator/:operatorId', RouteController.getRoutesByOperator);

module.exports = router;