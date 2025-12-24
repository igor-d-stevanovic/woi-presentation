const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🚀 Running performance tests with Allure integration...\n');

// Function to check if server is ready
function checkServerReady(port, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = () => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/api/tasks',
                method: 'GET',
                timeout: 2000
            }, (res) => {
                resolve(true);
            });

            req.on('error', () => {
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Server not ready after ${timeout}ms`));
                } else {
                    setTimeout(check, 500);
                }
            });

            req.end();
        };

        check();
    });
}

async function runPerfTests() {
    let serverProcess = null;

    try {
        // Start the server
        console.log('🔄 Starting server...');
        serverProcess = spawn('node', ['server.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
        });

        // Wait for server to be ready
        console.log('⏳ Waiting for server to be ready...');
        await checkServerReady(3000);
        console.log('✅ Server is ready\n');

        // Create k6-results directory if it doesn't exist
        const k6Dir = path.join(__dirname, 'k6-results');
        if (!fs.existsSync(k6Dir)) {
            fs.mkdirSync(k6Dir, { recursive: true });
        }

        // Run performance tests
        const tests = [
            { name: 'Create Task', script: 'perf:create-task' },
            { name: 'Get Tasks', script: 'perf:get-tasks' },
            { name: 'Update Task', script: 'perf:update-task' },
            { name: 'Delete Task', script: 'perf:delete-task' },
            { name: 'Load UI', script: 'perf:load-ui' }
        ];

        console.log('📊 Running Performance Tests...\n');

        for (const test of tests) {
            console.log(`🏃 Running ${test.name} test...`);
            try {
                execSync(`npm run ${test.script}`, { stdio: 'inherit' });
                console.log(`✅ ${test.name} test completed\n`);
            } catch (error) {
                console.log(`❌ ${test.name} test failed: ${error.message}\n`);
                // Continue with other tests
            }
        }

        // Convert K6 results to Allure format
        console.log('🔄 Converting K6 results to Allure format...');
        try {
            execSync('npm run perf:allure', { stdio: 'inherit' });
            console.log('✅ Results converted to Allure format\n');
        } catch (error) {
            console.log(`❌ Failed to convert results: ${error.message}\n`);
        }

        console.log('🎉 Performance testing completed!');

    } catch (error) {
        console.error('❌ Error during performance testing:', error.message);
    } finally {
        // Stop the server
        if (serverProcess) {
            console.log('🛑 Stopping server...');
            serverProcess.kill('SIGTERM');

            // Wait a bit for graceful shutdown
            setTimeout(() => {
                if (!serverProcess.killed) {
                    serverProcess.kill('SIGKILL');
                }
                console.log('✅ Server stopped');
            }, 2000);
        }
    }
}

runPerfTests();