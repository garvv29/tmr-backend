const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Role {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.roleName = data.roleName; // master_admin, admin, driver
    this.displayName = data.displayName;
    this.permissions = data.permissions || {};
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Save role to Firestore
  async save() {
    try {
      await db.collection('roles').doc(this.id).set(this.toJSON());
      console.log(`✅ Role created: ${this.roleName}`);
      return this;
    } catch (error) {
      throw new Error(`Error saving role: ${error.message}`);
    }
  }

  // Find role by ID
  static async findById(id) {
    try {
      const doc = await db.collection('roles').doc(id).get();
      return doc.exists ? new Role({ id: doc.id, ...doc.data() }) : null;
    } catch (error) {
      throw new Error(`Error finding role: ${error.message}`);
    }
  }

  // Find role by name
  static async findByName(roleName) {
    try {
      const snapshot = await db.collection('roles')
        .where('roleName', '==', roleName)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Role({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding role by name: ${error.message}`);
    }
  }

  // Get all roles
  static async getAll() {
    try {
      const snapshot = await db.collection('roles').get();
      return snapshot.docs.map(doc => new Role({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting all roles: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      roleName: this.roleName,
      displayName: this.displayName,
      permissions: this.permissions,
      createdAt: this.createdAt
    };
  }
}

module.exports = Role;