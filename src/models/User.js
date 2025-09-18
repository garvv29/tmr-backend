const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');
const Role = require('./Role');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.phoneNumber = data.phoneNumber;
    this.fullName = data.fullName;
    this.roleId = data.roleId;
    this.city = data.city;
    this.deviceTokens = data.deviceTokens || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt || null;
  }

  // Save user to Firestore
  async save() {
    try {
      await db.collection('users').doc(this.id).set(this.toJSON());
      console.log(`✅ User created: ${this.phoneNumber}`);
      return this;
    } catch (error) {
      throw new Error(`Error saving user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const doc = await db.collection('users').doc(id).get();
      return doc.exists ? new User({ id: doc.id, ...doc.data() }) : null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by phone number
  static async findByPhone(phoneNumber) {
    try {
      const snapshot = await db.collection('users')
        .where('phoneNumber', '==', phoneNumber)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new User({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding user by phone: ${error.message}`);
    }
  }

  // Get users by role
  static async findByRole(roleId) {
    try {
      const snapshot = await db.collection('users')
        .where('roleId', '==', roleId)
        .get();
      
      return snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding users by role: ${error.message}`);
    }
  }

  // Get user with role details
  async getUserWithRole() {
    try {
      const role = await Role.findById(this.roleId);
      return {
        ...this.toJSON(),
        role: role ? role.toJSON() : null
      };
    } catch (error) {
      throw new Error(`Error getting user with role: ${error.message}`);
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      this.lastLoginAt = new Date().toISOString();
      this.updatedAt = new Date().toISOString();
      await this.save();
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }

  // Add device token for notifications
  async addDeviceToken(token) {
    try {
      if (!this.deviceTokens.includes(token)) {
        this.deviceTokens.push(token);
        this.updatedAt = new Date().toISOString();
        await this.save();
      }
    } catch (error) {
      throw new Error(`Error adding device token: ${error.message}`);
    }
  }

  // Remove device token
  async removeDeviceToken(token) {
    try {
      this.deviceTokens = this.deviceTokens.filter(t => t !== token);
      this.updatedAt = new Date().toISOString();
      await this.save();
    } catch (error) {
      throw new Error(`Error removing device token: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      phoneNumber: this.phoneNumber,
      fullName: this.fullName,
      roleId: this.roleId,
      city: this.city,
      deviceTokens: this.deviceTokens,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    };
  }
}

module.exports = User;