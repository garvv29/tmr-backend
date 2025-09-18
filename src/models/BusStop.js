const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class BusStop {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.stopName = data.stopName;
    this.stopCode = data.stopCode || null; // Optional short code like GT-001
    this.coordinates = data.coordinates || null;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.amenities = data.amenities || []; // ['Shelter', 'Seating', 'Water', 'Toilet', 'Food']
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Generate stop code automatically if not provided
  static generateStopCode(city, sequence) {
    const cityCode = city.substring(0, 3).toUpperCase();
    return `${cityCode}-${sequence.toString().padStart(3, '0')}`;
  }

  // Save bus stop to Firestore
  async save() {
    try {
      await db.collection('busStops').doc(this.id).set(this.toJSON());
      console.log(`✅ Bus Stop created: ${this.stopName} (${this.city})`);
      return this;
    } catch (error) {
      throw new Error(`Error saving bus stop: ${error.message}`);
    }
  }

  // Find bus stop by ID
  static async findById(id) {
    try {
      const doc = await db.collection('busStops').doc(id).get();
      return doc.exists ? new BusStop({ id: doc.id, ...doc.data() }) : null;
    } catch (error) {
      throw new Error(`Error finding bus stop: ${error.message}`);
    }
  }

  // Find bus stop by name and city
  static async findByNameAndCity(stopName, city) {
    try {
      const snapshot = await db.collection('busStops')
        .where('stopName', '==', stopName)
        .where('city', '==', city)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new BusStop({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding bus stop by name and city: ${error.message}`);
    }
  }

  // Find bus stop by code
  static async findByCode(stopCode) {
    try {
      const snapshot = await db.collection('busStops')
        .where('stopCode', '==', stopCode)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new BusStop({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding bus stop by code: ${error.message}`);
    }
  }

  // Get bus stops by city
  static async getByCity(city) {
    try {
      const snapshot = await db.collection('busStops')
        .where('city', '==', city)
        .where('isActive', '==', true)
        .orderBy('stopName')
        .get();
      
      return snapshot.docs.map(doc => new BusStop({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting bus stops by city: ${error.message}`);
    }
  }

  // Get bus stops by state
  static async getByState(state) {
    try {
      const snapshot = await db.collection('busStops')
        .where('state', '==', state)
        .where('isActive', '==', true)
        .orderBy('city')
        .orderBy('stopName')
        .get();
      
      return snapshot.docs.map(doc => new BusStop({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting bus stops by state: ${error.message}`);
    }
  }

  // Search bus stops by name
  static async searchByName(searchTerm) {
    try {
      const snapshot = await db.collection('busStops')
        .where('isActive', '==', true)
        .get();
      
      const stops = snapshot.docs
        .map(doc => new BusStop({ id: doc.id, ...doc.data() }))
        .filter(stop => 
          stop.stopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stop.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return stops;
    } catch (error) {
      throw new Error(`Error searching bus stops: ${error.message}`);
    }
  }

  // Get nearby bus stops (within radius)
  static async getNearbyStops(latitude, longitude, radiusKm = 5) {
    try {
      const snapshot = await db.collection('busStops')
        .where('isActive', '==', true)
        .get();
      
      const stops = snapshot.docs
        .map(doc => new BusStop({ id: doc.id, ...doc.data() }))
        .filter(stop => {
          if (!stop.coordinates) return false;
          
          const distance = BusStop.calculateDistance(
            latitude, longitude,
            stop.coordinates.latitude, stop.coordinates.longitude
          );
          
          return distance <= radiusKm;
        })
        .map(stop => ({
          ...stop.toJSON(),
          distance: BusStop.calculateDistance(
            latitude, longitude,
            stop.coordinates.latitude, stop.coordinates.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);
      
      return stops;
    } catch (error) {
      throw new Error(`Error getting nearby stops: ${error.message}`);
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Get all active bus stops
  static async getActiveStops() {
    try {
      const snapshot = await db.collection('busStops')
        .where('isActive', '==', true)
        .orderBy('state')
        .orderBy('city')
        .orderBy('stopName')
        .get();
      
      return snapshot.docs.map(doc => new BusStop({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting active bus stops: ${error.message}`);
    }
  }

  // Update bus stop details
  async updateDetails(updates) {
    try {
      const allowedUpdates = [
        'stopName', 'stopCode', 'coordinates', 'address', 'amenities', 'isActive'
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
      throw new Error(`Error updating bus stop details: ${error.message}`);
    }
  }

  // Add amenity to bus stop
  async addAmenity(amenity) {
    try {
      if (!this.amenities.includes(amenity)) {
        this.amenities.push(amenity);
        this.updatedAt = new Date().toISOString();
        await this.save();
      }
      return this;
    } catch (error) {
      throw new Error(`Error adding amenity: ${error.message}`);
    }
  }

  // Remove amenity from bus stop
  async removeAmenity(amenity) {
    try {
      this.amenities = this.amenities.filter(a => a !== amenity);
      this.updatedAt = new Date().toISOString();
      await this.save();
      return this;
    } catch (error) {
      throw new Error(`Error removing amenity: ${error.message}`);
    }
  }

  // Get routes that use this bus stop
  async getRoutes() {
    try {
      const Route = require('./Route');
      const snapshot = await db.collection('routes')
        .where('busStops', 'array-contains', this.id)
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => new Route({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting routes for bus stop: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      stopName: this.stopName,
      stopCode: this.stopCode,
      coordinates: this.coordinates,
      address: this.address,
      city: this.city,
      state: this.state,
      amenities: this.amenities,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = BusStop;