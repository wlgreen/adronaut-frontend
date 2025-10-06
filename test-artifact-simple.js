#!/usr/bin/env node

/**
 * Simple Artifact Upload Test Using curl
 * Tests the backend API endpoints directly to identify issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

console.log('🔍 Simple Artifact Upload Test');
console.log('=' .repeat(50));

const BACKEND_URL = 'https://adronaut-production.up.railway.app';
const TEST_PROJECT_ID = `test-${uuidv4()}`;

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
  testResults.tests.push({ name, passed, details });
}

// Create test file
function createTestFile() {
  const testDir = '/tmp/adronaut-test';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testFile = path.join(testDir, 'test-upload.csv');
  const content = 'campaign_id,impressions,clicks,cost\ncamp_1,1000,50,25.50\ncamp_2,2000,100,45.75';
  fs.writeFileSync(testFile, content);
  return testFile;
}

async function runTests() {
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test Project ID: ${TEST_PROJECT_ID}`);

  // Test 1: Check if backend is reachable
  console.log('\n🌐 Testing Backend Connectivity...');

  try {
    const result = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" "${BACKEND_URL}" --connect-timeout 10`, {
      encoding: 'utf-8',
      timeout: 15000
    });

    const httpStatus = result.match(/HTTPSTATUS:(\d+)/);
    const statusCode = httpStatus ? parseInt(httpStatus[1]) : 0;

    if (statusCode > 0 && statusCode < 500) {
      addTest('Backend reachable', true, `HTTP ${statusCode}`);
    } else {
      addTest('Backend reachable', false, `HTTP ${statusCode}`);
    }
  } catch (error) {
    addTest('Backend reachable', false, `Connection failed: ${error.message}`);
  }

  // Test 2: Test root endpoint
  console.log('\n🏠 Testing Root Endpoint...');

  try {
    const result = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" "${BACKEND_URL}/" --connect-timeout 10`, {
      encoding: 'utf-8',
      timeout: 15000
    });

    const httpStatus = result.match(/HTTPSTATUS:(\d+)/);
    const statusCode = httpStatus ? parseInt(httpStatus[1]) : 0;
    const response = result.replace(/HTTPSTATUS:\d+/, '').trim();

    addTest('Root endpoint accessible', statusCode === 200, `HTTP ${statusCode}, Response: ${response.substring(0, 100)}`);
  } catch (error) {
    addTest('Root endpoint accessible', false, error.message);
  }

  // Test 3: Test upload endpoint availability
  console.log('\n📤 Testing Upload Endpoint...');

  try {
    const result = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" "${BACKEND_URL}/upload" --connect-timeout 10`, {
      encoding: 'utf-8',
      timeout: 15000
    });

    const httpStatus = result.match(/HTTPSTATUS:(\d+)/);
    const statusCode = httpStatus ? parseInt(httpStatus[1]) : 0;
    const response = result.replace(/HTTPSTATUS:\d+/, '').trim();

    // 405 Method Not Allowed is expected for GET on upload endpoint
    const isExpected = [200, 405, 422].includes(statusCode);
    addTest('Upload endpoint exists', isExpected, `HTTP ${statusCode}, Response: ${response.substring(0, 200)}`);
  } catch (error) {
    addTest('Upload endpoint exists', false, error.message);
  }

  // Test 4: Test file upload
  console.log('\n📁 Testing File Upload...');

  const testFile = createTestFile();

  try {
    const uploadUrl = `${BACKEND_URL}/upload?project_id=${TEST_PROJECT_ID}`;
    const curlCommand = `curl -s -w "HTTPSTATUS:%{http_code}" -X POST -F "file=@${testFile}" "${uploadUrl}" --connect-timeout 30 --max-time 60`;

    console.log(`  Running: ${curlCommand}`);

    const result = execSync(curlCommand, {
      encoding: 'utf-8',
      timeout: 70000
    });

    const httpStatus = result.match(/HTTPSTATUS:(\d+)/);
    const statusCode = httpStatus ? parseInt(httpStatus[1]) : 0;
    const response = result.replace(/HTTPSTATUS:\d+/, '').trim();

    const isSuccess = statusCode >= 200 && statusCode < 300;
    addTest('File upload', isSuccess, `HTTP ${statusCode}, Response: ${response.substring(0, 300)}`);

    if (isSuccess) {
      try {
        const jsonResponse = JSON.parse(response);
        addTest('Upload response is valid JSON', true, `Keys: ${Object.keys(jsonResponse).join(', ')}`);
      } catch (e) {
        addTest('Upload response is valid JSON', false, 'Response is not valid JSON');
      }
    }

  } catch (error) {
    addTest('File upload', false, `Error: ${error.message}`);
  }

  // Test 5: Test artifacts listing
  console.log('\n📋 Testing Artifacts Listing...');

  try {
    const artifactsUrl = `${BACKEND_URL}/artifacts/${TEST_PROJECT_ID}`;
    const result = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" "${artifactsUrl}" --connect-timeout 10`, {
      encoding: 'utf-8',
      timeout: 15000
    });

    const httpStatus = result.match(/HTTPSTATUS:(\d+)/);
    const statusCode = httpStatus ? parseInt(httpStatus[1]) : 0;
    const response = result.replace(/HTTPSTATUS:\d+/, '').trim();

    const isSuccess = statusCode >= 200 && statusCode < 300;
    addTest('Artifacts listing endpoint', isSuccess, `HTTP ${statusCode}, Response: ${response.substring(0, 200)}`);

    if (isSuccess) {
      try {
        const jsonResponse = JSON.parse(response);
        const isArray = Array.isArray(jsonResponse);
        addTest('Artifacts response is array', isArray, `Type: ${typeof jsonResponse}, Length: ${isArray ? jsonResponse.length : 'N/A'}`);
      } catch (e) {
        addTest('Artifacts response is valid JSON', false, 'Response is not valid JSON');
      }
    }

  } catch (error) {
    addTest('Artifacts listing endpoint', false, error.message);
  }

  // Test 6: Database connection test (if available)
  console.log('\n💾 Testing Database Connection...');

  try {
    const dbTestUrl = `${BACKEND_URL}/db-test`;
    const result = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" "${dbTestUrl}" --connect-timeout 10`, {
      encoding: 'utf-8',
      timeout: 15000
    });

    const httpStatus = result.match(/HTTPSTATUS:(\d+)/);
    const statusCode = httpStatus ? parseInt(httpStatus[1]) : 0;
    const response = result.replace(/HTTPSTATUS:\d+/, '').trim();

    const isSuccess = statusCode >= 200 && statusCode < 300;
    addTest('Database test endpoint', isSuccess, `HTTP ${statusCode}, Response: ${response.substring(0, 200)}`);

  } catch (error) {
    addTest('Database test endpoint', false, error.message);
  }

  // Cleanup
  try {
    fs.unlinkSync(testFile);
    fs.rmdirSync(path.dirname(testFile));
    addTest('Test cleanup', true, 'Temporary files removed');
  } catch (error) {
    addTest('Test cleanup', false, error.message);
  }
}

async function main() {
  try {
    await runTests();

    console.log('\n' + '='.repeat(50));
    console.log('📊 SIMPLE TEST RESULTS');
    console.log('='.repeat(50));

    const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;

    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);

    // Analysis
    const uploadTest = testResults.tests.find(t => t.name === 'File upload');
    const backendReachable = testResults.tests.find(t => t.name === 'Backend reachable');
    const artifactsTest = testResults.tests.find(t => t.name === 'Artifacts listing endpoint');

    console.log('\n🎯 KEY FINDINGS:');
    console.log(`Backend Connectivity: ${backendReachable?.passed ? '✅ Working' : '❌ Failed'}`);
    console.log(`File Upload: ${uploadTest?.passed ? '✅ Working' : '❌ Failed'}`);
    console.log(`Database Access: ${artifactsTest?.passed ? '✅ Working' : '❌ Failed'}`);

    // Show detailed failures
    const failures = testResults.tests.filter(t => !t.passed);
    if (failures.length > 0) {
      console.log('\n🔍 DETAILED FAILURES:');
      failures.forEach(test => {
        console.log(`❌ ${test.name}: ${test.details}`);
      });
    }

    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      testConfig: {
        backendUrl: BACKEND_URL,
        projectId: TEST_PROJECT_ID
      },
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        passRate: parseFloat(passRate)
      },
      keyFindings: {
        backendConnectivity: backendReachable?.passed || false,
        fileUpload: uploadTest?.passed || false,
        databaseAccess: artifactsTest?.passed || false
      },
      tests: testResults.tests
    };

    fs.writeFileSync('/Users/liangwang/adronaut/web/simple-test-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\n📋 Report saved to: simple-test-report.json`);

    process.exit(0);

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}