const express = require('express');
const router = express.Router();
const BusOperatorController = require('../controllers/busOperatorController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Create bus operator (admin only)
router.post('/', verifyToken, hasPermission('buses'), BusOperatorController.createOperator);

// Get all operators (public access for app users)
router.get('/', BusOperatorController.getAllOperators);

// Get operators by city (public access)
router.get('/city/:city', BusOperatorController.getOperatorsByCity);

// Get operator by ID (public access)
router.get('/:id', BusOperatorController.getOperatorById);

// Update operator (admin only)
router.put('/:id', verifyToken, hasPermission('buses'), BusOperatorController.updateOperator);

// Deactivate operator (admin only)
router.delete('/:id', verifyToken, hasPermission('buses'), BusOperatorController.deactivateOperator);

module.exports = router;