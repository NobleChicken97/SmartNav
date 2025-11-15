/* eslint-disable no-console, no-undef */
/**
 * Simple API Test Script
 * Tests the Firebase-integrated backend endpoints
 */

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoint(method, path, data = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log(`\n✅ ${method} ${path}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`\n❌ ${method} ${path}`);
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🔥 Testing Firebase-Integrated Backend\n');
  console.log('='.repeat(50));

  // Test 1: Get all locations (public)
  console.log('\n📍 Test 1: Get all locations (Firestore)');
  await testEndpoint('GET', '/locations');

  // Test 2: Get all events (public)
  console.log('\n📅 Test 2: Get all events (Firestore)');
  await testEndpoint('GET', '/events');

  // Test 3: Register new user (Firebase Auth)
  console.log('\n👤 Test 3: Register new user');
  const testEmail = `test${Date.now()}@example.com`;
  const registerResult = await testEndpoint('POST', '/auth/register', {
    email: testEmail,
    password: 'Test123!@#',
    name: 'Test User',
    role: 'user'
  });

  let authToken = null;
  if (registerResult.success && registerResult.data.token) {
    authToken = registerResult.data.token;
  }

  // Test 4: Login with created user
  if (!authToken) {
    console.log('\n🔐 Test 4: Login with test user');
    const loginResult = await testEndpoint('POST', '/auth/login', {
      email: testEmail,
      password: 'Test123!@#'
    });

    if (loginResult.success && loginResult.data.token) {
      authToken = loginResult.data.token;
    }
  }

  // Test 5: Get current user (protected route)
  if (authToken) {
    console.log('\n👨‍💼 Test 5: Get current user profile (protected)');
    await testEndpoint('GET', '/auth/me', null, authToken);
  } else {
    console.log('\n⚠️ Test 5: Skipped (no auth token)');
  }

  // Test 6: Create location (protected, organizer/admin)
  if (authToken) {
    console.log('\n📍 Test 6: Create location (protected)');
    await testEndpoint('POST', '/locations', {
      name: 'Test Location',
      description: 'Created via API test',
      address: '123 Test St',
      coordinates: {
        type: 'Point',
        coordinates: [76.3638, 30.3535]
      },
      category: 'other'
    }, authToken);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Test Suite Complete!\n');
}

runTests().catch(console.error);
