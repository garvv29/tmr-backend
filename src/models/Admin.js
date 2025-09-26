const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Admin {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.adminId = data.adminId || `ADMIN${Date.now()}`;
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password || ''; // Should be hashed before storing
    this.role = data.role || 'admin'; // super-admin | admin | moderator
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || null;
    this.permissions = data.permissions || ['buses', 'drivers', 'routes'];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  // Save admin to database
  async save() {
    try {
      const adminData = this.toJSON();
      await db.collection('admins').doc(this.id).set(adminData);
      console.log(`✅ Admin ${this.name} saved successfully`);
    } catch (error) {
      console.error('Error saving admin:', error);
      throw error;
    }
  }

  // Find admin by ID
  static async findById(id) {
    try {
      const doc = await db.collection('admins').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new Admin({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding admin by ID:', error);
      throw error;
    }
  }

  // Find admin by email
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('admins')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Admin({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding admin by email:', error);
      throw error;
    }
  }

  // Find admin by adminId
  static async findByAdminId(adminId) {
    try {
      const snapshot = await db.collection('admins')
        .where('adminId', '==', adminId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Admin({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding admin by adminId:', error);
      throw error;
    }
  }

  // Get all admins
  static async getAllAdmins() {
    try {
      const snapshot = await db.collection('admins')
        .where('isActive', '==', true)
        .orderBy('name')
        .get();
      
      return snapshot.docs.map(doc => new Admin({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all admins:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      this.lastLogin = new Date();
      this.updatedAt = new Date();
      
      await db.collection('admins').doc(this.id).update({
        lastLogin: this.lastLogin,
        updatedAt: this.updatedAt
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Check if admin has permission
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.role === 'super-admin';
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      adminId: this.adminId,
      name: this.name,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      permissions: this.permissions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
      // Note: password is excluded from JSON output for security
    };
  }

  // Get public data (for API responses)
  toPublicJSON() {
    return {
      id: this.id,
      adminId: this.adminId,
      name: this.name,
      role: this.role,
      permissions: this.permissions
    };
  }
}

module.exports = Admin;