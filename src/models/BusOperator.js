const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class BusOperator {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.operatorName = data.operatorName;
    this.contactPerson = data.contactPerson;
    this.phoneNumber = data.phoneNumber;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.totalBuses = data.totalBuses || 0;
    this.totalRoutes = data.totalRoutes || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Save operator to Firestore
  async save() {
    try {
      await db.collection('busOperators').doc(this.id).set(this.toJSON());
      console.log(`✅ Bus Operator created: ${this.operatorName} (${this.state})`);
      return this;
    } catch (error) {
      throw new Error(`Error saving bus operator: ${error.message}`);
    }
  }

  // Find operator by ID
  static async findById(id) {
    try {
      const doc = await db.collection('busOperators').doc(id).get();
      return doc.exists ? new BusOperator({ id: doc.id, ...doc.data() }) : null;
    } catch (error) {
      throw new Error(`Error finding bus operator: ${error.message}`);
    }
  }

  // Find operator by name
  static async findByName(operatorName) {
    try {
      const snapshot = await db.collection('busOperators')
        .where('operatorName', '==', operatorName)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new BusOperator({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding operator by name: ${error.message}`);
    }
  }

  // Get all active operators
  static async getActiveOperators() {
    try {
      const snapshot = await db.collection('busOperators')
        .where('isActive', '==', true)
        .orderBy('operatorName')
        .get();
      
      return snapshot.docs.map(doc => new BusOperator({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting active operators: ${error.message}`);
    }
  }

  // Get operators by city
  static async getOperatorsByCity(city) {
    try {
      const snapshot = await db.collection('busOperators')
        .where('city', '==', city)
        .where('isActive', '==', true)
        .orderBy('operatorName')
        .get();
      
      return snapshot.docs.map(doc => new BusOperator({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting operators by city: ${error.message}`);
    }
  }

  // Get operators by state (Punjab focus)
  static async getOperatorsByState(state) {
    try {
      const snapshot = await db.collection('busOperators')
        .where('state', '==', state)
        .where('isActive', '==', true)
        .orderBy('operatorName')
        .get();
      
      return snapshot.docs.map(doc => new BusOperator({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting operators by state: ${error.message}`);
    }
  }

  // Update operator details
  async updateDetails(updates) {
    try {
      const allowedUpdates = [
        'contactPerson', 'phoneNumber', 'address', 'isActive'
      ];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          this[field] = updates[field];
        }
      });
      
      this.updatedAt = new Date().toISOString();
      await this.save();
      return this;
    } catch (error) {
      throw new Error(`Error updating operator: ${error.message}`);
    }
  }

  // Update bus/route counts
  async updateCounts(busCount, routeCount) {
    try {
      if (busCount !== undefined) this.totalBuses = busCount;
      if (routeCount !== undefined) this.totalRoutes = routeCount;
      
      this.updatedAt = new Date().toISOString();
      await this.save();
    } catch (error) {
      throw new Error(`Error updating counts: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      operatorName: this.operatorName,
      contactPerson: this.contactPerson,
      phoneNumber: this.phoneNumber,
      address: this.address,
      city: this.city,
      state: this.state,
      isActive: this.isActive,
      totalBuses: this.totalBuses,
      totalRoutes: this.totalRoutes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = BusOperator;