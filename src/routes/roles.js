const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/roleController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Initialize default roles (public endpoint)
router.post('/initialize', RoleController.createDefaultRoles);

// Get all roles (public endpoint for role options)
router.get('/', RoleController.getAllRoles);

// Get role by ID (authenticated users)
router.get('/:id', verifyToken, RoleController.getRoleById);

// Update role permissions (master admin only)
router.put('/:id', verifyToken, hasPermission('roles'), RoleController.updateRole);

module.exports = router;