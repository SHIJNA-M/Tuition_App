/**
 * System Validation Script
 * 
 * This script performs automated validation of the Tuition Center Management System API.
 * It tests core functionality and reports results.
 * 
 * Usage: node scripts/validate-system.js
 * 
 * Prerequisites:
 * - Server must be running on http://localhost:3001
 * - MongoDB must be connected
 * - Environment variables must be configured
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to log test results
function logTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) {
      console.log(`  ${colors.yellow}${message}${colors.reset}`);
    }
  }
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log(`\n${colors.cyan}=== Testing Health Check ===${colors.reset}`);
  
  try {
    const response = await axios.get('http://localhost:3001/health');
    logTest('Health check endpoint responds', response.status === 200);
    logTest('Health check returns success', response.data.status === 'ok');
  } catch (error) {
    logTest('Health check endpoint responds', false, error.message);
  }
}

// Test 2: User Registration
async function testUserRegistration() {
  console.log(`\n${colors.cyan}=== Testing User Registration ===${colors.reset}`);
  
  const timestamp = Date.now();
  const testUser = {
    first_name: 'Test',
    last_name: 'User',
    email: `test.user.${timestamp}@example.com`,
    mobile: `+1234567${timestamp.toString().slice(-3)}`,
    role: 'Student'
  };
  
  const result = await apiRequest('POST', '/auth/register', testUser);
  
  logTest('User registration endpoint responds', result.success || result.status === 201);
  logTest('Registration returns userId', result.data?.userId !== undefined);
  logTest('Registration returns success message', result.data?.success === true);
  
  // Test duplicate email
  const duplicateResult = await apiRequest('POST', '/auth/register', testUser);
  logTest('Duplicate email returns 409 Conflict', duplicateResult.status === 409);
  
  // Test invalid email
  const invalidEmailUser = { ...testUser, email: 'invalid-email' };
  const invalidResult = await apiRequest('POST', '/auth/register', invalidEmailUser);
  logTest('Invalid email returns 400 Bad Request', invalidResult.status === 400);
  
  return result.data?.userId;
}

// Test 3: Academic Structure
async function testAcademicStructure(adminToken) {
  console.log(`\n${colors.cyan}=== Testing Academic Structure ===${colors.reset}`);
  
  if (!adminToken) {
    console.log(`${colors.yellow}Skipping academic structure tests (no admin token)${colors.reset}`);
    return;
  }
  
  const headers = { Authorization: `Bearer ${adminToken}` };
  
  // Test board creation
  const boardData = {
    name: `Test Board ${Date.now()}`,
    description: 'Test board for validation'
  };
  
  const boardResult = await apiRequest('POST', '/boards', boardData, headers);
  logTest('Board creation endpoint responds', boardResult.success || boardResult.status === 201);
  
  const boardId = boardResult.data?.board?.id;
  
  if (boardId) {
    // Test subject creation
    const subjectData = {
      name: `Test Subject ${Date.now()}`,
      description: 'Test subject'
    };
    
    const subjectResult = await apiRequest('POST', `/boards/${boardId}/subjects`, subjectData, headers);
    logTest('Subject creation endpoint responds', subjectResult.success || subjectResult.status === 201);
    
    // Test get boards
    const getBoardsResult = await apiRequest('GET', '/boards', null, headers);
    logTest('Get boards endpoint responds', getBoardsResult.success);
    logTest('Get boards returns array', Array.isArray(getBoardsResult.data?.boards));
  }
  
  // Test academic structure endpoint
  const structureResult = await apiRequest('GET', '/academic-structure', null, headers);
  logTest('Academic structure endpoint responds', structureResult.success);
  logTest('Academic structure returns array', Array.isArray(structureResult.data?.structure));
}

// Test 4: Authorization
async function testAuthorization() {
  console.log(`\n${colors.cyan}=== Testing Authorization ===${colors.reset}`);
  
  // Test without token
  const noTokenResult = await apiRequest('GET', '/users');
  logTest('Protected endpoint without token returns 401', noTokenResult.status === 401);
  
  // Test with invalid token
  const invalidTokenResult = await apiRequest('GET', '/users', null, {
    Authorization: 'Bearer invalid-token'
  });
  logTest('Protected endpoint with invalid token returns 401', invalidTokenResult.status === 401);
}

// Test 5: Error Handling
async function testErrorHandling() {
  console.log(`\n${colors.cyan}=== Testing Error Handling ===${colors.reset}`);
  
  // Test 404 for non-existent endpoint
  const notFoundResult = await apiRequest('GET', '/non-existent-endpoint');
  logTest('Non-existent endpoint returns 404', notFoundResult.status === 404);
  
  // Test validation errors
  const invalidData = {
    first_name: '',
    last_name: '',
    email: 'invalid',
    mobile: 'invalid',
    role: 'InvalidRole'
  };
  
  const validationResult = await apiRequest('POST', '/auth/register', invalidData);
  logTest('Invalid data returns 400 Bad Request', validationResult.status === 400);
  logTest('Validation error includes error message', validationResult.error?.error !== undefined);
}

// Test 6: Database Connection
async function testDatabaseConnection() {
  console.log(`\n${colors.cyan}=== Testing Database Connection ===${colors.reset}`);
  
  // Test health check which verifies database
  try {
    const response = await axios.get('http://localhost:3001/health');
    logTest('Database connection verified via health check', response.data.status === 'ok');
  } catch (error) {
    logTest('Database connection verified via health check', false, error.message);
  }
}

// Test 7: Configuration Loading
async function testConfigurationLoading() {
  console.log(`\n${colors.cyan}=== Testing Configuration Loading ===${colors.reset}`);
  
  // Check if server is running (indicates config loaded)
  try {
    await axios.get('http://localhost:3001/health');
    logTest('Server started successfully (config loaded)', true);
  } catch (error) {
    logTest('Server started successfully (config loaded)', false, 'Server not responding');
  }
  
  // Test CORS headers
  try {
    const response = await axios.get('http://localhost:3001/health');
    logTest('CORS headers present', response.headers['access-control-allow-origin'] !== undefined);
  } catch (error) {
    logTest('CORS headers present', false);
  }
}

// Main validation function
async function runValidation() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   Tuition Center Management System - Validation       ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Starting validation at: ${new Date().toISOString()}\n`);
  
  try {
    // Run all tests
    await testHealthCheck();
    await testDatabaseConnection();
    await testConfigurationLoading();
    await testAuthorization();
    await testErrorHandling();
    await testUserRegistration();
    // Note: Academic structure test requires admin token
    // await testAcademicStructure(adminToken);
    
    // Print summary
    console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║                   Validation Summary                   ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`\nTotal Tests: ${testResults.total}`);
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    
    if (testResults.failed === 0) {
      console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
      console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
      console.log('1. Run manual tests using Postman collection');
      console.log('2. Complete validation checklist in docs/VALIDATION_CHECKLIST.md');
      console.log('3. Review test scenarios in docs/TEST_SCENARIOS.md');
      console.log('4. Proceed to deployment preparation');
    } else {
      console.log(`\n${colors.red}✗ Some tests failed. Please review and fix issues.${colors.reset}`);
      console.log(`\n${colors.cyan}Troubleshooting:${colors.reset}`);
      console.log('1. Ensure server is running on http://localhost:3001');
      console.log('2. Verify MongoDB connection');
      console.log('3. Check environment variables in .env');
      console.log('4. Review error messages above');
    }
    
    console.log(`\nValidation completed at: ${new Date().toISOString()}\n`);
    
    // Exit with appropriate code
    process.exit(testResults.failed === 0 ? 0 : 1);
    
  } catch (error) {
    console.error(`\n${colors.red}Validation failed with error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run validation if executed directly
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation };
