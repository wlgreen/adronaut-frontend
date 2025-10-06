#!/usr/bin/env node

/**
 * Database Storage Verification Test
 * Tests the artifact database storage workflow using Supabase client
 */

const fs = require('fs');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

console.log('💾 Database Storage Verification Test');
console.log('=' .repeat(50));

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
  uploadedArtifacts: []
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

async function testDatabaseStorage() {
  const BACKEND_URL = 'https://adronaut-production.up.railway.app';
  const TEST_PROJECT_ID = uuidv4();

  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test Project ID: ${TEST_PROJECT_ID}`);

  // Test 1: Create a test file and upload it
  console.log('\n📤 Testing File Upload with Database Storage...');

  try {
    // Create test file
    const testFile = '/tmp/db-test.csv';
    const content = 'campaign_id,impressions,clicks,cost\ntest_camp,500,25,12.25';
    fs.writeFileSync(testFile, content);

    // Upload file
    const uploadStart = Date.now();
    const uploadResult = execSync(
      `curl -s -X POST -F "file=@${testFile}" "${BACKEND_URL}/upload?project_id=${TEST_PROJECT_ID}"`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    const uploadTime = Date.now() - uploadStart;

    let uploadData;
    try {
      uploadData = JSON.parse(uploadResult);
    } catch (e) {
      addTest('Upload response parsing', false, `Invalid JSON: ${uploadResult}`);
      return;
    }

    const uploadSuccess = uploadData.success === true;
    addTest('File upload successful', uploadSuccess,
      `Response: ${JSON.stringify(uploadData)} (${uploadTime}ms)`);

    if (uploadSuccess) {
      testResults.uploadedArtifacts.push({
        projectId: TEST_PROJECT_ID,
        artifactId: uploadData.artifact_id,
        backendProjectId: uploadData.project_id,
        uploadTime: uploadTime
      });
    }

    // Cleanup test file
    fs.unlinkSync(testFile);

  } catch (error) {
    addTest('File upload test', false, `Error: ${error.message}`);
  }

  // Test 2: Verify artifact appears in database (using direct Supabase connection)
  console.log('\n🔍 Testing Direct Database Verification...');

  // For this test, we'll need to check the database directly
  // Let's test if we can access Supabase from the frontend environment

  try {
    // Check if we can load the supabase client
    const supabaseTest = `
      const { createClient } = require('@supabase/supabase-js');

      // Load environment variables
      require('dotenv').config({ path: '.env.local' });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.log('MISSING_CREDENTIALS');
        process.exit(1);
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test connection by checking artifacts table
      supabase
        .from('artifacts')
        .select('artifact_id')
        .eq('project_id', '${TEST_PROJECT_ID}')
        .then(({ data, error }) => {
          if (error) {
            console.log('ERROR:' + JSON.stringify(error));
          } else {
            console.log('SUCCESS:' + JSON.stringify(data));
          }
        })
        .catch(err => {
          console.log('EXCEPTION:' + err.message);
        });
    `;

    fs.writeFileSync('/tmp/supabase-test.js', supabaseTest);

    const dbTestResult = execSync(`cd /Users/liangwang/adronaut/web && node /tmp/supabase-test.js`, {
      encoding: 'utf-8',
      timeout: 30000
    });

    fs.unlinkSync('/tmp/supabase-test.js');

    if (dbTestResult.includes('SUCCESS:')) {
      const dataMatch = dbTestResult.match(/SUCCESS:(.+)/);
      const artifacts = dataMatch ? JSON.parse(dataMatch[1]) : [];

      const foundArtifact = artifacts.length > 0;
      addTest('Artifact found in database', foundArtifact,
        `Found ${artifacts.length} artifacts for project ${TEST_PROJECT_ID}`);

      // Check if our uploaded artifact is in the results
      if (testResults.uploadedArtifacts.length > 0) {
        const expectedArtifactId = testResults.uploadedArtifacts[0].artifactId;
        const foundExpected = artifacts.some(a => a.artifact_id === expectedArtifactId);
        addTest('Uploaded artifact in database', foundExpected,
          `Looking for artifact ${expectedArtifactId} in results`);
      }
    } else if (dbTestResult.includes('MISSING_CREDENTIALS')) {
      addTest('Database credentials available', false, 'Supabase credentials not found in .env.local');
    } else if (dbTestResult.includes('ERROR:')) {
      const errorMatch = dbTestResult.match(/ERROR:(.+)/);
      const error = errorMatch ? JSON.parse(errorMatch[1]) : { message: 'Unknown error' };
      addTest('Database query execution', false, `Supabase error: ${error.message}`);
    } else {
      addTest('Database connection test', false, `Unexpected result: ${dbTestResult}`);
    }

  } catch (error) {
    addTest('Database verification test', false, `Error: ${error.message}`);
  }

  // Test 3: Check if uploaded artifacts have correct metadata
  console.log('\n📋 Testing Artifact Metadata...');

  if (testResults.uploadedArtifacts.length > 0) {
    for (const artifact of testResults.uploadedArtifacts) {
      // Test if artifact has required fields
      const hasArtifactId = !!artifact.artifactId;
      const hasProjectId = !!artifact.backendProjectId;

      addTest(`Artifact metadata complete: ${artifact.artifactId}`,
        hasArtifactId && hasProjectId,
        `artifact_id: ${artifact.artifactId}, project_id: ${artifact.backendProjectId}`);

      // Test if project IDs match (frontend vs backend)
      const projectIdsMatch = artifact.projectId === artifact.backendProjectId;
      addTest(`Project ID consistency: ${artifact.artifactId}`,
        projectIdsMatch,
        `Frontend: ${artifact.projectId}, Backend: ${artifact.backendProjectId}`);
    }
  } else {
    addTest('Artifact metadata test', false, 'No uploaded artifacts to test');
  }

  // Test 4: Performance analysis
  console.log('\n⚡ Testing Upload Performance...');

  if (testResults.uploadedArtifacts.length > 0) {
    const avgUploadTime = testResults.uploadedArtifacts.reduce((sum, a) => sum + a.uploadTime, 0) / testResults.uploadedArtifacts.length;

    // Consider anything over 30 seconds as slow
    const isPerformant = avgUploadTime < 30000;
    addTest('Upload performance acceptable', isPerformant,
      `Average upload time: ${avgUploadTime}ms (target: <30000ms)`);

    if (avgUploadTime > 60000) {
      addTest('Upload speed critical issue', false,
        `Upload time ${avgUploadTime}ms is critically slow (>60s)`);
    }
  }
}

async function main() {
  try {
    await testDatabaseStorage();

    // Generate results
    console.log('\n' + '='.repeat(50));
    console.log('📊 DATABASE STORAGE TEST RESULTS');
    console.log('='.repeat(50));

    const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;

    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);

    // Key findings
    console.log('\n🎯 KEY FINDINGS:');

    const uploadTest = testResults.tests.find(t => t.name === 'File upload successful');
    const dbTest = testResults.tests.find(t => t.name === 'Artifact found in database');
    const perfTest = testResults.tests.find(t => t.name === 'Upload performance acceptable');

    console.log(`File Upload: ${uploadTest?.passed ? '✅ Working' : '❌ Failed'}`);
    console.log(`Database Storage: ${dbTest?.passed ? '✅ Working' : dbTest ? '❌ Failed' : '❓ Not tested'}`);
    console.log(`Performance: ${perfTest?.passed ? '✅ Good' : perfTest ? '❌ Slow' : '❓ Not tested'}`);

    // Detailed failures
    const failures = testResults.tests.filter(t => !t.passed);
    if (failures.length > 0) {
      console.log('\n🔍 DETAILED FAILURES:');
      failures.forEach(test => {
        console.log(`❌ ${test.name}: ${test.details}`);
      });
    }

    // Uploaded artifacts summary
    if (testResults.uploadedArtifacts.length > 0) {
      console.log('\n📁 UPLOADED ARTIFACTS:');
      testResults.uploadedArtifacts.forEach((artifact, i) => {
        console.log(`${i + 1}. Artifact ID: ${artifact.artifactId}`);
        console.log(`   Project ID: ${artifact.projectId}`);
        console.log(`   Backend Project ID: ${artifact.backendProjectId}`);
        console.log(`   Upload Time: ${artifact.uploadTime}ms`);
      });
    }

    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        passRate: parseFloat(passRate)
      },
      keyFindings: {
        fileUpload: uploadTest?.passed || false,
        databaseStorage: dbTest?.passed || false,
        performance: perfTest?.passed || false
      },
      uploadedArtifacts: testResults.uploadedArtifacts,
      tests: testResults.tests
    };

    fs.writeFileSync('/Users/liangwang/adronaut/web/database-storage-test-report.json',
      JSON.stringify(reportData, null, 2));
    console.log(`\n📋 Report saved to: database-storage-test-report.json`);

    // Determine overall success
    const criticalTestsPassed = (uploadTest?.passed || false) &&
                               (passRate >= 60); // At least 60% pass rate

    process.exit(criticalTestsPassed ? 0 : 1);

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}