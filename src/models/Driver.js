const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Driver {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.driverId = data.driverId || `DRV${Date.now()}`;
    this.firstName = data.firstName || data.driverName?.split(' ')[0] || '';
    this.lastName = data.lastName || data.driverName?.split(' ').slice(1).join(' ') || '';
    this.dateOfBirth = data.dateOfBirth || null;
    this.gender = data.gender || 'male';
    this.contactInfo = {
      phone: data.phone || data.phoneNumber || data.contactInfo?.phone || '',
      email: data.email || data.contactInfo?.email || '',
      emergencyContact: data.emergencyContact || data.contactInfo?.emergencyContact || ''
    };
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    };
    this.licenseInfo = {
      licenseNumber: data.licenseNumber || data.licenseInfo?.licenseNumber || '',
      licenseType: data.licenseType || data.licenseInfo?.licenseType || 'commercial',
      expiryDate: data.licenseExpiry || data.licenseInfo?.expiryDate || null,
      issuingAuthority: data.issuingAuthority || data.licenseInfo?.issuingAuthority || 'RTO'
    };
    this.employeeId = data.employeeId || `EMP${Date.now()}`;
    this.joiningDate = data.joiningDate || new Date();
    this.salary = data.salary || 0;
    this.experience = parseInt(data.experience) || 0;
    this.assignedBusIds = data.assignedBusIds || (data.assignedBusId ? [data.assignedBusId] : []);
    this.currentLocation = data.currentLocation || null;
    this.isOnDuty = data.isOnDuty || false;
    this.isActive = data.isActive !== undefined ? data.isActive : (data.status === 'active');
    this.emergencyContact = data.emergencyContact || {
      name: '',
      relationship: '',
      phone: ''
    };
    this.medicalCertificate = data.medicalCertificate || null;
    this.trainingRecords = data.trainingRecords || [];
    // Keep old fields for backward compatibility
    this.operatorId = data.operatorId;
    this.status = data.status || (this.isActive ? 'active' : 'inactive');
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
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

  // Find driver by driverId (new field)
  static async findByDriverId(driverId) {
    try {
      const snapshot = await db.collection('drivers')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Driver({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding driver by driverId:', error);
      throw error;
    }
  }

  // Find driver by phone number (updated to use contactInfo)
  static async findByPhone(phoneNumber) {
    try {
      // Try new contactInfo.phone field first
      let snapshot = await db.collection('drivers')
        .where('contactInfo.phone', '==', phoneNumber)
        .get();
      
      if (snapshot.empty) {
        // Fallback to old phoneNumber field
        snapshot = await db.collection('drivers')
          .where('phoneNumber', '==', phoneNumber)
          .get();
      }
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Driver({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding driver by phone:', error);
      throw error;
    }
  }

  // Find driver by license number (updated to use licenseInfo)
  static async findByLicense(licenseNumber) {
    try {
      // Try new licenseInfo.licenseNumber field first
      let snapshot = await db.collection('drivers')
        .where('licenseInfo.licenseNumber', '==', licenseNumber)
        .get();
      
      if (snapshot.empty) {
        // Fallback to old licenseNumber field
        snapshot = await db.collection('drivers')
          .where('licenseNumber', '==', licenseNumber)
          .get();
      }
      
      if (snapshot.empty) return null;
      
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

  // Validate license expiry (updated for new schema)
  isLicenseValid() {
    const expiryDate = this.licenseInfo?.expiryDate || this.licenseExpiry;
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    return expiry > new Date();
  }

  // Check if driver is available for assignment (updated for new schema)
  isAvailable() {
    return this.isActive && 
           this.assignedBusIds.length === 0 && 
           this.isLicenseValid();
  }

  // Convert to JSON with new schema
  toJSON() {
    return {
      id: this.id,
      driverId: this.driverId,
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      contactInfo: this.contactInfo,
      address: this.address,
      licenseInfo: this.licenseInfo,
      employeeId: this.employeeId,
      joiningDate: this.joiningDate,
      salary: this.salary,
      experience: this.experience,
      assignedBusIds: this.assignedBusIds,
      currentLocation: this.currentLocation,
      isOnDuty: this.isOnDuty,
      isActive: this.isActive,
      emergencyContact: this.emergencyContact,
      medicalCertificate: this.medicalCertificate,
      trainingRecords: this.trainingRecords,
      // Keep old fields for backward compatibility
      driverName: `${this.firstName} ${this.lastName}`.trim(),
      phoneNumber: this.contactInfo.phone,
      licenseNumber: this.licenseInfo.licenseNumber,
      licenseType: this.licenseInfo.licenseType,
      licenseExpiry: this.licenseInfo.expiryDate,
      operatorId: this.operatorId,
      status: this.status,
      assignedBusId: this.assignedBusIds[0] || null,
      isLicenseValid: this.isLicenseValid(),
      isAvailable: this.isAvailable(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get public data (for API responses)
  toPublicJSON() {
    return {
      id: this.id,
      driverId: this.driverId,
      firstName: this.firstName,
      lastName: this.lastName,
      contactInfo: {
        phone: this.contactInfo.phone
      },
      experience: this.experience,
      isOnDuty: this.isOnDuty,
      isActive: this.isActive
    };
  }
}

module.exports = Driver;