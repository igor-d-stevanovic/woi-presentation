const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🚀 Running all tests with Allure reporting...\n');

// Create allure-results directory if it doesn't exist
const allureDir = path.join(__dirname, 'allure-results');
if (!fs.existsSync(allureDir)) {
    fs.mkdirSync(allureDir, { recursive: true });
}

async function runAllTests() {
    const results = {
        unit: { passed: false, error: null },
        api: { passed: false, error: null },
        e2e_python: { passed: false, error: null },
        e2e_playwright: { passed: false, error: null },
        perf: { passed: false, error: null }
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
let serverProcess = null;
try {
    // Start the server for API tests
    console.log('🔄 Starting server for API tests...');
    serverProcess = spawn('node', ['server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 10000);
        const checkReady = () => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/tasks',
                method: 'GET',
                timeout: 2000
            }, () => {
                clearTimeout(timeout);
                resolve();
            });
            req.on('error', () => setTimeout(checkReady, 500));
            req.end();
        };
        checkReady();
    });

    console.log('✅ Server ready for API tests');

    // Clean up tasks from previous performance tests
    console.log('🧹 Cleaning up tasks from previous tests...');
    execSync('npm run test:api:cleanup', { stdio: 'inherit' });

    execSync('npm run test:api', { stdio: 'inherit' });
    results.api.passed = true;
    console.log('✅ API tests passed\n');
} catch (error) {
    results.api.error = error.message;
    console.log('❌ API tests failed\n');
} finally {
    // Stop the server
    if (serverProcess) {
        console.log('🛑 Stopping server...');
        serverProcess.kill();
        console.log('✅ Server stopped\n');
    }
}

// Run Python E2E tests
console.log('🐍 Running Python E2E Tests...');
try {
    execSync('c:\\Development\\woi-presentation\\.venv\\Scripts\\python.exe -m pytest tests/ -v --alluredir=allure-results', { stdio: 'inherit' });
    results.e2e_python.passed = true;
    console.log('✅ Python E2E tests passed\n');
} catch (error) {
    results.e2e_python.error = error.message;
    console.log('❌ Python E2E tests failed\n');
}

// Run Playwright E2E tests
console.log('🎭 Running Playwright E2E Tests...');
try {
    execSync('npm run test:e2e:pw', { stdio: 'inherit' });
    results.e2e_playwright.passed = true;
    console.log('✅ Playwright E2E tests passed\n');
} catch (error) {
    results.e2e_playwright.error = error.message;
    console.log('❌ Playwright E2E tests failed\n');
}

// Run Performance tests
console.log('⚡ Running Performance Tests...');
try {
    execSync('npm run perf:local', { stdio: 'inherit' });
    results.perf.passed = true;
    console.log('✅ Performance tests passed\n');
} catch (error) {
    results.perf.error = error.message;
    console.log('❌ Performance tests failed\n');
}

// Generate Allure report
console.log('📊 Allure results are ready for manual report generation');
console.log('   Run: allure generate allure-results --clean -o allure-report');
console.log('   Then: allure open allure-report');
console.log('✅ Allure results generated\n');

// Print summary
console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Unit Tests: ${results.unit.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`API Tests:  ${results.api.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Python E2E Tests: ${results.e2e_python.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Playwright E2E Tests: ${results.e2e_playwright.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Performance Tests: ${results.perf.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log('='.repeat(50));

const allPassed = results.unit.passed && results.api.passed && results.e2e_python.passed && results.e2e_playwright.passed && results.perf.passed;
process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(console.error);