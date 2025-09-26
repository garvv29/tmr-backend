const axios = require('axios');

async function testRouteById() {
    const baseURL = 'http://localhost:3000/api';
    
    try {
        console.log('🔍 Testing Route by ID API...\n');
        
        // Your bus has routeId: "lamdUhviyl7gN3iOrMB1"
        const routeId = 'lamdUhviyl7gN3iOrMB1';
        console.log(`Fetching route with ID: ${routeId}`);
        
        const response = await axios.get(`${baseURL}/routes/${routeId}`);
        
        console.log('\n✅ API Response:');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        
        if (response.data.data) {
            const route = response.data.data;
            console.log('\n🛣️ Route Details:');
            console.log('- Route ID:', route.id);
            console.log('- Route Name:', route.routeName);
            console.log('- From Location:', route.fromLocation);
            console.log('- To Location:', route.toLocation);
            console.log('- Distance:', route.distance);
            console.log('- Duration:', route.estimatedDuration);
            console.log('- City:', route.city);
            console.log('- Status:', route.status);
            
        } else {
            console.log('\n❌ No route found with this ID');
        }
        
    } catch (error) {
        console.error('\n❌ Error testing API:', error.response?.data || error.message);
    }
}

// Test combined bus + route data
async function testBusWithRoute() {
    const baseURL = 'http://localhost:3000/api';
    
    try {
        console.log('\n🚌 Testing Bus + Route Integration...\n');
        
        // First get bus details
        const busResponse = await axios.get(`${baseURL}/buses/search/license-plate`, {
            params: { licensePlate: 'CG04HC1212' }
        });
        
        if (busResponse.data.success && busResponse.data.data) {
            const bus = busResponse.data.data;
            console.log('✅ Bus found:', bus.busName);
            console.log('📍 Route ID from bus:', bus.routeId);
            
            if (bus.routeId) {
                // Now get route details
                const routeResponse = await axios.get(`${baseURL}/routes/${bus.routeId}`);
                
                if (routeResponse.data.success && routeResponse.data.data) {
                    const route = routeResponse.data.data;
                    console.log('\n✅ Route found:', route.routeName);
                    console.log('🗺️ Route path:', `${route.fromLocation} → ${route.toLocation}`);
                } else {
                    console.log('\n❌ Route not found for ID:', bus.routeId);
                }
            } else {
                console.log('\n⚠️ Bus has no route assigned');
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error in integration test:', error.response?.data || error.message);
    }
}

// Run tests
testRouteById()
    .then(() => testBusWithRoute())
    .then(() => console.log('\n🏁 All tests completed!'));