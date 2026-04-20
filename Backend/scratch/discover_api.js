import axios from 'axios';

const endpoints = [
  'https://api.easyslip.com/v1/verify',
  'https://api.easyslip.com/api/v1/verify',
  'https://developer.easyslip.com/v1/verify',
  'https://developer.easyslip.com/api/v1/verify',
  'https://api.easyslip.com/v2/verify',
  'https://api.easyslip.com/api/v2/verify',
];

console.log('🔍 Starting API Endpoint Discovery...');

async function testEndpoints() {
  for (const url of endpoints) {
    try {
      console.log(`📡 Testing: ${url}`);
      const res = await axios.get(url); // Most APIs return 405 or 401 on GET, but not 404 if endpoint exists
      console.log(`✅ Success (GET): ${url} -> Status: ${res.status}`);
    } catch (err) {
      if (err.response) {
        if (err.response.status !== 404) {
          console.log(`🎯 FOUND! (Resp: ${err.response.status}): ${url}`);
        } else {
          console.log(`❌ 404 Not Found: ${url}`);
        }
      } else {
        console.log(`⚠️ Network Error: ${url} -> ${err.message}`);
      }
    }
  }
  console.log('🏁 Discovery Finished.');
}

testEndpoints();
