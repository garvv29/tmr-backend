const Driver = require('../models/Driver');
const Bus = require('../models/Bus');

class DriverController {
  // Create new driver (admin only)
  static async createDriver(req, res) {
    try {
      const {
        driverName,
        phoneNumber,
        licenseNumber,
        licenseType,
        licenseExpiry,
        operatorId,
        experience,
        address,
        emergencyContact
      } = req.body;

      // Validation
      if (!driverName || !phoneNumber || !licenseNumber || !licenseType || !operatorId) {
        return res.status(400).json({
          error: 'All required fields must be provided',
          required: ['driverName', 'phoneNumber', 'licenseNumber', 'licenseType', 'operatorId']
        });
      }

      // Check if driver with phone number already exists
      const existingDriverByPhone = await Driver.findByPhone(phoneNumber);
      if (existingDriverByPhone) {
        return res.status(400).json({ error: 'Driver with this phone number already exists' });
      }

      // Check if driver with license number already exists
      const existingDriverByLicense = await Driver.findByLicense(licenseNumber);
      if (existingDriverByLicense) {
        return res.status(400).json({ error: 'Driver with this license number already exists' });
      }

      // Validate license type
      const validLicenseTypes = ['light', 'heavy', 'commercial'];
      if (!validLicenseTypes.includes(licenseType)) {
        return res.status(400).json({
          error: 'Invalid license type',
          validTypes: validLicenseTypes
        });
      }

      // Create driver
      const driver = new Driver({
        driverName,
        phoneNumber,
        licenseNumber,
        licenseType,
        licenseExpiry,
        operatorId,
        experience,
        address,
        emergencyContact
      });

      await driver.save();

      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        driver: driver.toJSON()
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all drivers
  static async getAllDrivers(req, res) {
    try {
      const { operatorId, status, available } = req.query;
      let drivers;

      if (available === 'true') {
        drivers = await Driver.getAvailableDrivers(operatorId);
      } else if (operatorId) {
        drivers = await Driver.getByOperator(operatorId);
      } else {
        // For master_admin, get all drivers - need to import db from firebase
        const { db } = require('../../config/firebase');
        const snapshot = await db.collection('drivers').orderBy('driverName').get();
        drivers = snapshot.docs.map(doc => new Driver({ id: doc.id, ...doc.data() }));
      }

      // Filter by status if provided
      if (status) {
        drivers = drivers.filter(driver => driver.status === status);
      }

      res.json({
        success: true,
        drivers: drivers.map(driver => driver.toJSON()),
        count: drivers.length
      });
    } catch (error) {
      console.error('Error getting drivers:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get driver by ID
  static async getDriverById(req, res) {
    try {
      const { id } = req.params;
      const driver = await Driver.findById(id);

      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Get assigned bus details if any
      const assignedBus = await driver.getAssignedBus();

      res.json({
        success: true,
        driver: driver.toJSON(),
        assignedBus: assignedBus ? {
          id: assignedBus.id,
          busNumber: assignedBus.busNumber,
          vehicleNumber: assignedBus.vehicleNumber,
          status: assignedBus.status,
          currentRouteId: assignedBus.currentRouteId
        } : null
      });
    } catch (error) {
      console.error('Error getting driver:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get drivers by operator
  static async getDriversByOperator(req, res) {
    try {
      const { operatorId } = req.params;
      const drivers = await Driver.getByOperator(operatorId);

      res.json({
        success: true,
        operatorId,
        drivers: drivers.map(driver => driver.toJSON()),
        count: drivers.length
      });
    } catch (error) {
      console.error('Error getting drivers by operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update driver details (admin only)
  static async updateDriver(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Check if phone number is being updated and if it conflicts
      if (updates.phoneNumber && updates.phoneNumber !== driver.phoneNumber) {
        const existingDriver = await Driver.findByPhone(updates.phoneNumber);
        if (existingDriver) {
          return res.status(400).json({ error: 'Phone number already exists' });
        }
      }

      // Check if license number is being updated and if it conflicts
      if (updates.licenseNumber && updates.licenseNumber !== driver.licenseNumber) {
        const existingDriver = await Driver.findByLicense(updates.licenseNumber);
        if (existingDriver) {
          return res.status(400).json({ error: 'License number already exists' });
        }
      }

      await driver.updateDetails(updates);

      res.json({
        success: true,
        message: 'Driver updated successfully',
        driver: driver.toJSON()
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update driver status
  static async updateDriverStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Valid status is required',
          validStatuses
        });
      }

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      await driver.updateStatus(status);

      res.json({
        success: true,
        message: 'Driver status updated successfully',
        driver: driver.toJSON()
      });
    } catch (error) {
      console.error('Error updating driver status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Assign driver to bus (admin only)
  static async assignDriverToBus(req, res) {
    try {
      const { id } = req.params;
      const { busId } = req.body;

      if (!busId) {
        return res.status(400).json({ error: 'Bus ID is required' });
      }

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Check if driver is available
      if (!driver.isAvailable()) {
        return res.status(400).json({ 
          error: 'Driver is not available for assignment',
          reasons: {
            status: driver.status !== 'active' ? 'Driver is not active' : null,
            alreadyAssigned: driver.assignedBusId ? 'Driver already assigned to another bus' : null,
            licenseExpired: !driver.isLicenseValid() ? 'Driver license has expired' : null
          }
        });
      }

      // Verify bus exists and is available
      const bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      if (bus.driverId && bus.driverId !== id) {
        return res.status(400).json({ error: 'Bus is already assigned to another driver' });
      }

      // Assign driver to bus
      await driver.assignToBus(busId);
      
      // Also update bus with driver info
      await bus.assignDriver(id);

      res.json({
        success: true,
        message: 'Driver assigned to bus successfully',
        driver: driver.toJSON(),
        bus: {
          id: bus.id,
          busNumber: bus.busNumber,
          vehicleNumber: bus.vehicleNumber
        }
      });
    } catch (error) {
      console.error('Error assigning driver to bus:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Remove driver from bus (admin only)
  static async removeDriverFromBus(req, res) {
    try {
      const { id } = req.params;

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      if (!driver.assignedBusId) {
        return res.status(400).json({ error: 'Driver is not assigned to any bus' });
      }

      const busId = driver.assignedBusId;

      // Remove driver from bus
      await driver.removeFromBus();

      // Also update bus to remove driver
      const bus = await Bus.findById(busId);
      if (bus) {
        await bus.updateDetails({ driverId: null });
      }

      res.json({
        success: true,
        message: 'Driver removed from bus successfully',
        driver: driver.toJSON()
      });
    } catch (error) {
      console.error('Error removing driver from bus:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Search drivers
  static async searchDrivers(req, res) {
    try {
      const { query, type } = req.query;

      if (!query) {
        return res.status(400).json({
          error: 'Search query is required',
          example: '/api/drivers/search?query=John&type=name'
        });
      }

      let drivers;
      if (type === 'phone') {
        const driver = await Driver.findByPhone(query);
        drivers = driver ? [driver] : [];
      } else if (type === 'license') {
        const driver = await Driver.findByLicense(query);
        drivers = driver ? [driver] : [];
      } else {
        drivers = await Driver.searchByName(query);
      }

      res.json({
        success: true,
        query,
        type: type || 'name',
        drivers: drivers.map(driver => driver.toJSON()),
        count: drivers.length
      });
    } catch (error) {
      console.error('Error searching drivers:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get available drivers for operator
  static async getAvailableDrivers(req, res) {
    try {
      const { operatorId } = req.params;
      const drivers = await Driver.getAvailableDrivers(operatorId);

      res.json({
        success: true,
        operatorId,
        availableDrivers: drivers.map(driver => driver.toJSON()),
        count: drivers.length
      });
    } catch (error) {
      console.error('Error getting available drivers:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DriverController;