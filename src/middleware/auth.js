const { auth } = require('../../config/firebase');
const User = require('../models/User');

// Verify Firebase token and get user
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user by phone number from Firebase token
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(401).json({ error: 'Phone number not found in token' });
    }

    // Get user details from our database
    const user = await User.findByPhone(phoneNumber);
    if (!user) {
      return res.status(401).json({ error: 'User not found in database' });
    }
    
    req.user = decodedToken;
    req.userDetails = user;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user has specific role
const hasRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userDetails) {
        return res.status(403).json({ error: 'User not found' });
      }

      const userWithRole = await req.userDetails.getUserWithRole();
      const userRole = userWithRole.role?.roleName;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(403).json({ error: 'Permission check failed' });
    }
  };
};

// Check specific permission
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.userDetails) {
        return res.status(403).json({ error: 'User not found' });
      }

      const userWithRole = await req.userDetails.getUserWithRole();
      const permissions = userWithRole.role?.permissions || {};

      if (!permissions[permission]) {
        return res.status(403).json({ 
          error: `Missing permission: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(403).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = { 
  verifyToken, 
  hasRole, 
  hasPermission 
};