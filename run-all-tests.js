const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running all tests with Allure reporting...\n');

// Create allure-results directory if it doesn't exist
const allureDir = path.join(__dirname, 'allure-results');
if (!fs.existsSync(allureDir)) {
    fs.mkdirSync(allureDir, { recursive: true });
}

const results = {
    unit: { passed: false, error: null },
    api: { passed: false, error: null },
    e2e: { passed: false, error: null }
};

// Run unit tests
console.log('📝 Running Unit Tests...');
try {
    execSync('npm run test:unit', { stdio: 'inherit' });
    results.unit.passed = true;
    console.log('✅ Unit tests passed\n');
} catch (error) {
    results.unit.error = error.message;
    console.log('❌ Unit tests failed\n');
}

// Run API tests
console.log('🔌 Running API Tests...');
try {
    execSync('npm run test:api', { stdio: 'inherit' });
    results.api.passed = true;
    console.log('✅ API tests passed\n');
} catch (error) {
    results.api.error = error.message;
    console.log('❌ API tests failed\n');
}

// Run E2E tests
console.log('🎭 Running E2E Tests...');
try {
    execSync('pytest tests/ -v --alluredir=allure-results', { stdio: 'inherit' });
    results.e2e.passed = true;
    console.log('✅ E2E tests passed\n');
} catch (error) {
    results.e2e.error = error.message;
    console.log('❌ E2E tests failed\n');
}

// Generate Allure report
console.log('📊 Generating Allure Report...');
try {
    execSync('npx allure generate allure-results --clean -o allure-report', { stdio: 'inherit' });
    console.log('✅ Allure report generated\n');
    
    console.log('🌐 Opening Allure Report...');
    execSync('npx allure open allure-report', { stdio: 'inherit' });
} catch (error) {
    console.log('❌ Failed to generate Allure report:', error.message);
}

// Print summary
console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Unit Tests: ${results.unit.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`API Tests:  ${results.api.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`E2E Tests:  ${results.e2e.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log('='.repeat(50));

const allPassed = results.unit.passed && results.api.passed && results.e2e.passed;
process.exit(allPassed ? 0 : 1);
