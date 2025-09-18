const User = require('../models/User');
const Role = require('../models/Role');

class UserController {
  // Create user (admin or driver)
  static async createUser(req, res) {
    try {
      const { phoneNumber, fullName, roleName, city } = req.body;

      // Validation
      if (!phoneNumber || !fullName || !roleName || !city) {
        return res.status(400).json({ 
          error: 'Phone number, full name, role, and city are required' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      // Get role ID
      const role = await Role.findByName(roleName);
      if (!role) {
        return res.status(400).json({ error: 'Invalid role name' });
      }

      // Create user
      const user = new User({
        phoneNumber,
        fullName,
        roleId: role.id,
        city
      });

      await user.save();

      // Return user with role details
      const userWithRole = await user.getUserWithRole();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userWithRole
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Login user
  static async loginUser(req, res) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Find user
      const user = await User.findByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update last login
      await user.updateLastLogin();

      // Get user with role details
      const userWithRole = await user.getUserWithRole();

      res.json({
        success: true,
        message: 'Login successful',
        user: userWithRole
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get user profile
  static async getUserProfile(req, res) {
    try {
      const user = req.userDetails;
      const userWithRole = await user.getUserWithRole();

      res.json({
        success: true,
        user: userWithRole
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update user profile
  static async updateUserProfile(req, res) {
    try {
      const user = req.userDetails;
      const { fullName, city } = req.body;

      // Update allowed fields
      if (fullName) user.fullName = fullName;
      if (city) user.city = city;

      await user.save();

      const userWithRole = await user.getUserWithRole();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userWithRole
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req, res) {
    try {
      const { role } = req.query;
      let users;

      if (role) {
        const roleObj = await Role.findByName(role);
        if (!roleObj) {
          return res.status(400).json({ error: 'Invalid role name' });
        }
        users = await User.findByRole(roleObj.id);
      } else {
        // Get all users logic would need to be implemented
        users = [];
      }

      // Get users with role details
      const usersWithRoles = await Promise.all(
        users.map(user => user.getUserWithRole())
      );

      res.json({
        success: true,
        users: usersWithRoles,
        count: usersWithRoles.length
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Add device token
  static async addDeviceToken(req, res) {
    try {
      const user = req.userDetails;
      const { deviceToken } = req.body;

      if (!deviceToken) {
        return res.status(400).json({ error: 'Device token is required' });
      }

      await user.addDeviceToken(deviceToken);

      res.json({
        success: true,
        message: 'Device token added successfully'
      });
    } catch (error) {
      console.error('Error adding device token:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;