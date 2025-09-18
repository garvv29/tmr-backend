const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Driver {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.driverName = data.driverName;
    this.phoneNumber = data.phoneNumber;
    this.licenseNumber = data.licenseNumber;
    this.licenseType = data.licenseType; // 'light', 'heavy', 'commercial'
    this.licenseExpiry = data.licenseExpiry;
    this.operatorId = data.operatorId;
    this.status = data.status || 'active'; // 'active', 'inactive', 'suspended'
    this.assignedBusId = data.assignedBusId || null;
    this.experience = data.experience; // years
    this.address = data.address;
    this.emergencyContact = data.emergencyContact;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save driver to database
  async save() {
    try {
      const driverData = this.toJSON();
      await db.collection('drivers').doc(this.id).set(driverData);
      console.log(`✅ Driver ${this.driverName} saved successfully`);
    } catch (error) {
      console.error('Error saving driver:', error);
      throw error;
    }
  }

  // Find driver by ID
  static async findById(id) {
    try {
      const doc = await db.collection('drivers').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new Driver({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding driver by ID:', error);
      throw error;
    }
  }

  // Find driver by phone number
  static async findByPhone(phoneNumber) {
    try {
      const snapshot = await db.collection('drivers')
        .where('phoneNumber', '==', phoneNumber)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return new Driver({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding driver by phone:', error);
      throw error;
    }
  }

  // Find driver by license number
  static async findByLicense(licenseNumber) {
    try {
      const snapshot = await db.collection('drivers')
        .where('licenseNumber', '==', licenseNumber)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return new Driver({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding driver by license:', error);
      throw error;
    }
  }

  // Get all drivers by operator
  static async getByOperator(operatorId) {
    try {
      const snapshot = await db.collection('drivers')
        .where('operatorId', '==', operatorId)
        .orderBy('driverName')
        .get();
      
      return snapshot.docs.map(doc => 
        new Driver({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Error getting drivers by operator:', error);
      throw error;
    }
  }

  // Get available drivers (not assigned to any bus)
  static async getAvailableDrivers(operatorId = null) {
    try {
      let query = db.collection('drivers')
        .where('status', '==', 'active')
        .where('assignedBusId', '==', null);
      
      if (operatorId) {
        query = query.where('operatorId', '==', operatorId);
      }
      
      const snapshot = await query.orderBy('driverName').get();
      
      return snapshot.docs.map(doc => 
        new Driver({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Error getting available drivers:', error);
      throw error;
    }
  }

  // Search drivers by name
  static async searchByName(searchTerm) {
    try {
      const snapshot = await db.collection('drivers')
        .where('driverName', '>=', searchTerm)
        .where('driverName', '<=', searchTerm + '\uf8ff')
        .orderBy('driverName')
        .limit(20)
        .get();
      
      return snapshot.docs.map(doc => 
        new Driver({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Error searching drivers:', error);
      throw error;
    }
  }

  // Update driver details
  async updateDetails(updates) {
    try {
      // Don't allow updating certain fields
      const allowedUpdates = {
        driverName: updates.driverName,
        phoneNumber: updates.phoneNumber,
        licenseNumber: updates.licenseNumber,
        licenseType: updates.licenseType,
        licenseExpiry: updates.licenseExpiry,
        experience: updates.experience,
        address: updates.address,
        emergencyContact: updates.emergencyContact,
        updatedAt: new Date()
      };

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => {
        if (allowedUpdates[key] === undefined) {
          delete allowedUpdates[key];
        }
      });

      // Update local instance
      Object.assign(this, allowedUpdates);

      // Update in database
      await db.collection('drivers').doc(this.id).update(allowedUpdates);
      console.log(`✅ Driver ${this.driverName} updated successfully`);
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  // Update driver status
  async updateStatus(newStatus) {
    try {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      this.status = newStatus;
      this.updatedAt = new Date();

      await db.collection('drivers').doc(this.id).update({
        status: newStatus,
        updatedAt: this.updatedAt
      });

      console.log(`✅ Driver ${this.driverName} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  // Assign driver to bus
  async assignToBus(busId) {
    try {
      this.assignedBusId = busId;
      this.updatedAt = new Date();

      await db.collection('drivers').doc(this.id).update({
        assignedBusId: busId,
        updatedAt: this.updatedAt
      });

      console.log(`✅ Driver ${this.driverName} assigned to bus ${busId}`);
    } catch (error) {
      console.error('Error assigning driver to bus:', error);
      throw error;
    }
  }

  // Remove driver from bus
  async removeFromBus() {
    try {
      this.assignedBusId = null;
      this.updatedAt = new Date();

      await db.collection('drivers').doc(this.id).update({
        assignedBusId: null,
        updatedAt: this.updatedAt
      });

      console.log(`✅ Driver ${this.driverName} removed from bus assignment`);
    } catch (error) {
      console.error('Error removing driver from bus:', error);
      throw error;
    }
  }

  // Get assigned bus details
  async getAssignedBus() {
    try {
      if (!this.assignedBusId) {
        return null;
      }

      const Bus = require('./Bus');
      return await Bus.findById(this.assignedBusId);
    } catch (error) {
      console.error('Error getting assigned bus:', error);
      throw error;
    }
  }

  // Validate license expiry
  isLicenseValid() {
    if (!this.licenseExpiry) return false;
    const expiryDate = new Date(this.licenseExpiry);
    return expiryDate > new Date();
  }

  // Check if driver is available for assignment
  isAvailable() {
    return this.status === 'active' && 
           this.assignedBusId === null && 
           this.isLicenseValid();
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      driverName: this.driverName,
      phoneNumber: this.phoneNumber,
      licenseNumber: this.licenseNumber,
      licenseType: this.licenseType,
      licenseExpiry: this.licenseExpiry,
      operatorId: this.operatorId,
      status: this.status,
      assignedBusId: this.assignedBusId,
      experience: this.experience,
      address: this.address,
      emergencyContact: this.emergencyContact,
      isLicenseValid: this.isLicenseValid(),
      isAvailable: this.isAvailable(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Driver;