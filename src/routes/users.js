const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken, hasPermission } = require('../middleware/auth');

// Create user (admin only)
router.post('/', verifyToken, hasPermission('users'), UserController.createUser);

// Login user (public)
router.post('/login', UserController.loginUser);

// Get user profile (authenticated users)
router.get('/profile', verifyToken, UserController.getUserProfile);

// Update user profile (authenticated users)
router.put('/profile', verifyToken, UserController.updateUserProfile);

// Get all users (admin only)
router.get('/', verifyToken, hasPermission('users'), UserController.getAllUsers);

// Add device token for notifications (authenticated users)
router.post('/device-token', verifyToken, UserController.addDeviceToken);

module.exports = router;