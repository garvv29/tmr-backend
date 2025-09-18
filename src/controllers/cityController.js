const admin = require('firebase-admin');

class CityController {
  // Get all cities from bus stops data
  static async getAllCities(req, res) {
    try {
      const db = admin.firestore();
      
      console.log('🔍 Fetching cities from Firestore...');
      
      // First try to get from cities collection
      const citiesRef = db.collection('cities');
      const citiesSnapshot = await citiesRef.get();
      
      console.log(`📊 Cities collection size: ${citiesSnapshot.size}`);
      console.log(`📊 Cities collection empty: ${citiesSnapshot.empty}`);
      
      if (!citiesSnapshot.empty) {
        const citiesData = [];
        citiesSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`📍 Processing city doc ${doc.id}:`, data);
          citiesData.push({
            id: doc.id,
            cityName: data.cityName,
            state: data.state || 'Unknown',
            country: data.country || 'India',
            coordinates: data.coordinates || { latitude: 0, longitude: 0 },
            isActive: data.isActive !== false,
            majorLandmarks: data.majorLandmarks || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });
        
        console.log(`✅ Returning ${citiesData.length} cities:`, citiesData);
        
        return res.json({
          success: true,
          cities: citiesData,
          count: citiesData.length
        });
      }
      
      // Fallback: get from busStops collection
      const busStopsRef = db.collection('busStops');
      const snapshot = await busStopsRef.get();
      
      const citiesSet = new Set();
      const citiesData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.city && !citiesSet.has(data.city)) {
          citiesSet.add(data.city);
          citiesData.push({
            id: data.city.toLowerCase().replace(/\s+/g, '_'),
            cityName: data.city,
            state: data.state || 'Unknown',
            country: data.country || 'India',
            coordinates: {
              latitude: data.coordinates?.latitude || 0,
              longitude: data.coordinates?.longitude || 0
            },
            isActive: true,
            majorLandmarks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
      
      res.json({
        success: true,
        cities: citiesData,
        count: citiesData.length
      });
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cities',
        message: error.message
      });
    }
  }

  // Search cities by name
  static async searchCities(req, res) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      const db = admin.firestore();
      
      // First try to search in cities collection
      const citiesRef = db.collection('cities');
      const citiesSnapshot = await citiesRef.get();
      
      const citiesData = [];
      
      if (!citiesSnapshot.empty) {
        citiesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.cityName && data.cityName.toLowerCase().includes(query.toLowerCase())) {
            citiesData.push({
              id: doc.id,
              cityName: data.cityName,
              state: data.state || 'Unknown',
              country: data.country || 'India',
              coordinates: data.coordinates || { latitude: 0, longitude: 0 },
              isActive: data.isActive !== false,
              majorLandmarks: data.majorLandmarks || [],
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            });
          }
        });
      }
      
      // If no results from cities, try busStops collection
      if (citiesData.length === 0) {
        const busStopsRef = db.collection('busStops');
        const snapshot = await busStopsRef.get();
        
        const citiesSet = new Set();
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.city && data.city.toLowerCase().includes(query.toLowerCase()) && !citiesSet.has(data.city)) {
            citiesSet.add(data.city);
            citiesData.push({
              id: data.city.toLowerCase().replace(/\s+/g, '_'),
              cityName: data.city,
              state: data.state || 'Unknown',
              country: data.country || 'India',
              coordinates: {
                latitude: data.coordinates?.latitude || 0,
                longitude: data.coordinates?.longitude || 0
              },
              isActive: true,
              majorLandmarks: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });
      }
      
      res.json({
        success: true,
        cities: citiesData,
        count: citiesData.length
      });
    } catch (error) {
      console.error('Error searching cities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search cities',
        message: error.message
      });
    }
  }

  // Get city by ID
  static async getCityById(req, res) {
    try {
      const { id } = req.params;
      
      const db = admin.firestore();
      
      // First try to get from cities collection
      const cityDoc = await db.collection('cities').doc(id).get();
      
      if (cityDoc.exists) {
        const data = cityDoc.data();
        const cityData = {
          id: cityDoc.id,
          cityName: data.cityName,
          state: data.state || 'Unknown',
          country: data.country || 'India',
          coordinates: data.coordinates || { latitude: 0, longitude: 0 },
          isActive: data.isActive !== false,
          majorLandmarks: data.majorLandmarks || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
        
        return res.json({
          success: true,
          city: cityData
        });
      }
      
      // Fallback: search by city name in busStops
      const cityName = id.replace(/_/g, ' ');
      const busStopsRef = db.collection('busStops');
      const snapshot = await busStopsRef.where('city', '==', cityName).limit(1).get();
      
      if (snapshot.empty) {
        return res.status(404).json({
          success: false,
          error: 'City not found'
        });
      }

      const data = snapshot.docs[0].data();
      const cityData = {
        id: data.city.toLowerCase().replace(/\s+/g, '_'),
        cityName: data.city,
        state: data.state || 'Unknown',
        country: data.country || 'India',
        coordinates: {
          latitude: data.coordinates?.latitude || 0,
          longitude: data.coordinates?.longitude || 0
        },
        isActive: true,
        majorLandmarks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        city: cityData
      });
    } catch (error) {
      console.error('Error fetching city:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch city',
        message: error.message
      });
    }
  }
}

module.exports = CityController;