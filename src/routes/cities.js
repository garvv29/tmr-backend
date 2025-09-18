const express = require('express');
const router = express.Router();
const CityController = require('../controllers/cityController');

// Public routes
router.get('/', CityController.getAllCities);
router.get('/search', CityController.searchCities);
router.get('/:id', CityController.getCityById);

module.exports = router;