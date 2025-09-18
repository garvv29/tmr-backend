const BusOperator = require('../models/BusOperator');

class BusOperatorController {
  // Create new bus operator (admin only)
  static async createOperator(req, res) {
    try {
      const {
        operatorName,
        contactPerson,
        phoneNumber,
        address,
        city,
        state
      } = req.body;

      // Validation
      if (!operatorName || !contactPerson || !phoneNumber || !address || !city || !state) {
        return res.status(400).json({
          error: 'All required fields must be provided',
          required: ['operatorName', 'contactPerson', 'phoneNumber', 'address', 'city', 'state']
        });
      }

      // Check if operator already exists
      const existingOperator = await BusOperator.findByName(operatorName);
      if (existingOperator) {
        return res.status(400).json({ error: 'Bus operator with this name already exists' });
      }

      // Create operator
      const operator = new BusOperator({
        operatorName,
        contactPerson,
        phoneNumber,
        address,
        city,
        state
      });

      await operator.save();

      res.status(201).json({
        success: true,
        message: 'Bus operator created successfully',
        operator: operator.toJSON()
      });
    } catch (error) {
      console.error('Error creating bus operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all active operators
  static async getAllOperators(req, res) {
    try {
      const { city } = req.query;
      let operators;

      if (city) {
        operators = await BusOperator.getOperatorsByCity(city);
      } else {
        operators = await BusOperator.getActiveOperators();
      }

      res.json({
        success: true,
        operators: operators.map(op => op.toJSON()),
        count: operators.length
      });
    } catch (error) {
      console.error('Error getting operators:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get operator by ID
  static async getOperatorById(req, res) {
    try {
      const { id } = req.params;
      const operator = await BusOperator.findById(id);

      if (!operator) {
        return res.status(404).json({ error: 'Bus operator not found' });
      }

      res.json({
        success: true,
        operator: operator.toJSON()
      });
    } catch (error) {
      console.error('Error getting operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update operator details (admin only)
  static async updateOperator(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const operator = await BusOperator.findById(id);
      if (!operator) {
        return res.status(404).json({ error: 'Bus operator not found' });
      }

      await operator.updateDetails(updates);

      res.json({
        success: true,
        message: 'Bus operator updated successfully',
        operator: operator.toJSON()
      });
    } catch (error) {
      console.error('Error updating operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Deactivate operator (admin only)
  static async deactivateOperator(req, res) {
    try {
      const { id } = req.params;
      const operator = await BusOperator.findById(id);

      if (!operator) {
        return res.status(404).json({ error: 'Bus operator not found' });
      }

      await operator.deactivate();

      res.json({
        success: true,
        message: 'Bus operator deactivated successfully'
      });
    } catch (error) {
      console.error('Error deactivating operator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get operators by city (public endpoint)
  static async getOperatorsByCity(req, res) {
    try {
      const { city } = req.params;
      const operators = await BusOperator.getOperatorsByCity(city);

      res.json({
        success: true,
        city,
        operators: operators.map(op => ({
          id: op.id,
          operatorName: op.operatorName,
          totalBuses: op.totalBuses,
          totalRoutes: op.totalRoutes
        })),
        count: operators.length
      });
    } catch (error) {
      console.error('Error getting operators by city:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BusOperatorController;