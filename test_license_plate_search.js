const axios = require('axios');

async function testLicensePlateSearch() {
    const baseURL = 'http://localhost:3000/api';
    
    try {
        console.log('🔍 Testing License Plate Search API...\n');
        
        // Test with your bus license plate "CG04HC1212"
        const licensePlate = 'CG04HC1212';
        console.log(`Searching for bus with license plate: ${licensePlate}`);
        
        const response = await axios.get(`${baseURL}/buses/search/license-plate`, {
            params: { licensePlate }
        });
        
        console.log('\n✅ API Response:');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Message:', response.data.message);
        
        if (response.data.data) {
            const bus = response.data.data;
            console.log('\n🚌 Bus Details:');
            console.log('- Bus ID:', bus.busId);
            console.log('- Bus Name:', bus.busName);
            console.log('- License Plate:', bus.licensePlate);
            console.log('- Model:', bus.busModel || bus.model);
            console.log('- Type:', bus.busType);
            console.log('- Capacity:', bus.capacity);
            console.log('- Status:', bus.status);
            console.log('- Route ID:', bus.routeId);
            
            if (bus.currentAssignment) {
                console.log('\n📋 Current Assignment:');
                console.log('- Assignment ID:', bus.currentAssignment.id);
                console.log('- Route ID:', bus.currentAssignment.routeId);
                console.log('- Status:', bus.currentAssignment.status);
            }
            
            if (bus.currentRoute) {
                console.log('\n🛣️  Current Route:');
                console.log('- Route Name:', bus.currentRoute.routeName);
                console.log('- From:', bus.currentRoute.fromLocation);
                console.log('- To:', bus.currentRoute.toLocation);
            }
        } else {
            console.log('\n❌ No bus found with this license plate');
        }
        
    } catch (error) {
        console.error('\n❌ Error testing API:', error.response?.data || error.message);
    }
}

// Test with different license plate formats
async function testMultipleLicensePlates() {
    const licensePlates = [
        'CG04HC1212',
        'cg04hc1212',  // lowercase
        'CG-04-HC-1212', // with dashes
        'INVALID123'  // invalid plate
    ];
    
    for (const plate of licensePlates) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Testing: ${plate}`);
        console.log(`${'='.repeat(50)}`);
        
        try {
            const response = await axios.get('http://localhost:3000/api/buses/search/license-plate', {
                params: { licensePlate: plate }
            });
            
            if (response.data.success && response.data.data) {
                console.log('✅ Found:', response.data.data.busName);
            } else {
                console.log('❌ Not found');
            }
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.error || error.message);
        }
    }
}

// Run tests
testLicensePlateSearch()
    .then(() => testMultipleLicensePlates())
    .then(() => console.log('\n🏁 All tests completed!'));