const Role = require('../models/Role');

class RoleController {
  // Create default roles
  static async createDefaultRoles(req, res) {
    try {
      const defaultRoles = [
        {
          roleName: 'master_admin',
          displayName: 'Master Admin',
          permissions: {
            users: true,
            buses: true,
            routes: true,
            drivers: true,
            analytics: true,
            complaints: true,
            roles: true,
            system: true
          }
        },
        {
          roleName: 'admin',
          displayName: 'Admin',
          permissions: {
            users: false,
            buses: true,
            routes: true,
            drivers: true,
            analytics: true,
            complaints: true,
            roles: false,
            system: false
          }
        },
        {
          roleName: 'driver',
          displayName: 'Driver',
          permissions: {
            users: false,
            buses: false,
            routes: false,
            drivers: false,
            analytics: false,
            complaints: false,
            roles: false,
            system: false,
            own_bus: true,
            live_tracking: true
          }
        }
      ];

      const createdRoles = [];
      
      for (const roleData of defaultRoles) {
        // Check if role already exists
        const existingRole = await Role.findByName(roleData.roleName);
        
        if (!existingRole) {
          const role = new Role(roleData);
          await role.save();
          createdRoles.push(role);
        } else {
          createdRoles.push(existingRole);
        }
      }

      res.json({
        success: true,
        message: 'Default roles created/verified successfully',
        roles: createdRoles.map(role => role.toJSON())
      });
    } catch (error) {
      console.error('Error creating default roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all roles
  static async getAllRoles(req, res) {
    try {
      const roles = await Role.getAll();
      
      res.json({
        success: true,
        roles: roles.map(role => role.toJSON()),
        count: roles.length
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get role by ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({
        success: true,
        role: role.toJSON()
      });
    } catch (error) {
      console.error('Error getting role:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all roles
  static async getAllRoles(req, res) {
    try {
      const roles = await Role.getAll();
      res.json({
        success: true,
        roles,
        count: roles.length
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get role by ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({
        success: true,
        role
      });
    } catch (error) {
      console.error('Error getting role:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update role
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!permissions) {
        return res.status(400).json({ error: 'Permissions are required' });
      }

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Update permissions
      role.permissions = permissions;
      await role.save();

      res.json({
        success: true,
        message: 'Role updated successfully',
        role
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RoleController;