const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function convertK6ToAllure(k6ResultsDir, allureResultsDir) {
    console.log('🔄 Converting K6 results to Allure format...');

    // Ensure allure results directory exists
    if (!fs.existsSync(allureResultsDir)) {
        fs.mkdirSync(allureResultsDir, { recursive: true });
    }

    // Get all K6 result files
    const k6Files = fs.readdirSync(k6ResultsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(k6ResultsDir, file));

    console.log(`Found ${k6Files.length} K6 result files`);

    k6Files.forEach((k6File, index) => {
        try {
            const fileName = path.basename(k6File, '.json');
            const testName = fileName.replace('k6-results-', '').replace(/-/g, ' ');

            // Read and parse K6 JSON (it's a stream of JSON objects)
            const k6Data = fs.readFileSync(k6File, 'utf8')
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));

            // Extract basic metrics
            const metrics = {};
            k6Data.forEach(item => {
                if (item.type === 'Metric') {
                    metrics[item.data.name] = item.data;
                }
            });

            // Find check results
            const checks = k6Data.filter(item =>
                item.type === 'Point' &&
                item.data.tags &&
                item.data.tags.check
            );

            // Calculate test status based on checks
            const failedChecks = checks.filter(check => check.data.value === 0).length;
            const status = failedChecks === 0 ? 'passed' : 'failed';

            // Create Allure result
            const allureResult = {
                name: `K6 Performance Test: ${testName}`,
                status: status,
                description: `Performance test results for ${testName}\n\nFailed checks: ${failedChecks}/${checks.length}`,
                start: Date.now() - 30000, // Assume 30 seconds ago
                stop: Date.now(),
                uuid: uuidv4(),
                historyId: uuidv4(),
                testCaseId: uuidv4(),
                fullName: `k6.${testName.replace(/\s+/g, '')}`,
                labels: [
                    { name: 'tag', value: 'performance' },
                    { name: 'tag', value: 'k6' },
                    { name: 'suite', value: 'Performance Tests' },
                    { name: 'host', value: process.env.COMPUTERNAME || 'localhost' },
                    { name: 'thread', value: `k6-${index}` },
                    { name: 'framework', value: 'k6' },
                    { name: 'language', value: 'javascript' }
                ]
            };

            // Add some basic metrics as steps or parameters
            if (metrics.http_reqs) {
                allureResult.parameters = [
                    { name: 'Total Requests', value: checks.length.toString() },
                    { name: 'Failed Checks', value: failedChecks.toString() },
                    { name: 'Status', value: status }
                ];
            }

            // Write Allure result
            const allureFileName = `${uuidv4()}-result.json`;
            const allureFilePath = path.join(allureResultsDir, allureFileName);
            fs.writeFileSync(allureFilePath, JSON.stringify(allureResult, null, 2));

            console.log(`✅ Converted ${fileName} -> ${allureFileName} (${status})`);

        } catch (error) {
            console.error(`❌ Failed to convert ${k6File}:`, error.message);
        }
    });

    console.log('🎉 K6 to Allure conversion completed!');
}

// Run the conversion
const k6ResultsDir = path.join(__dirname, 'k6-results');
const allureResultsDir = path.join(__dirname, 'allure-results');

if (fs.existsSync(k6ResultsDir)) {
    convertK6ToAllure(k6ResultsDir, allureResultsDir);
} else {
    console.log('❌ k6-results directory not found');
}