const axios = require('axios');

async function testRegistration() {
  try {
    const testData = {
      name: "Test User",
      email: "test@example.com",
      password: "Test@123",
      meterNumber: "ABC123",
      address: "123 Test Street, Test City",
      phone: "1234567890"
    };

    console.log('Testing registration with data:', testData);
    
    const response = await axios.post('http://localhost:5000/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRegistration();
