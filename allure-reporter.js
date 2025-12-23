const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class AllureReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    this.resultsDir = this._options.resultsDir || 'allure-results';
    this.historyDir = path.join(this.resultsDir, 'history');
    this.testResults = new Map(); // Track test UUIDs by test file
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  onRunStart() {
    console.log('[Allure] Starting test run...');
    this.testResults.clear();
    
    // Preserve history from previous report if it exists
    this.preserveHistory();
  }

  preserveHistory() {
    const reportHistoryDir = path.join('allure-report', 'history');
    
    if (fs.existsSync(reportHistoryDir)) {
      // Copy history from previous report to current results
      if (!fs.existsSync(this.historyDir)) {
        fs.mkdirSync(this.historyDir, { recursive: true });
      }
      
      try {
        const historyFiles = fs.readdirSync(reportHistoryDir);
        historyFiles.forEach(file => {
          const srcPath = path.join(reportHistoryDir, file);
          const destPath = path.join(this.historyDir, file);
          fs.copyFileSync(srcPath, destPath);
        });
        console.log(`[Allure] Preserved ${historyFiles.length} history files`);
      } catch (error) {
        console.warn(`[Allure] Could not preserve history: ${error.message}`);
      }
    } else {
      console.log('[Allure] No previous history found, starting fresh');
    }
  }

  generateHistoryId(testName, suiteName) {
    // Generate consistent hash for history tracking
    const fullName = `${suiteName} > ${testName}`;
    return crypto.createHash('md5').update(fullName).digest('hex');
  }

  onTestResult(test, testResult) {
    const testFile = path.basename(test.path);
    const testUuids = [];

    testResult.testResults.forEach((result) => {
      const testUuid = uuidv4();
      testUuids.push(testUuid); // Track for container
      const suiteName = result.ancestorTitles.join(' > ') || testFile;
      
      // Extract test category from test name (HAPPY PATH, FAILURE MODE, EDGE CASE)
      const categoryMatch = result.title.match(/^(HAPPY PATH|FAILURE MODE|EDGE CASE):/);
      const category = categoryMatch ? categoryMatch[1] : 'Test';
      
      // Generate consistent historyId for trend tracking
      const historyId = this.generateHistoryId(result.title, suiteName);
      
      const allureResult = {
        uuid: testUuid,
        historyId: historyId,
        name: result.title,
        fullName: result.fullName,
        status: this.getStatus(result.status),
        stage: 'finished',
        start: result.startTime || testResult.perfStats.start,
        stop: result.endTime || testResult.perfStats.end,
        duration: result.duration || 0,
        description: `Test from ${testFile}\n\nFull path: ${result.fullName}`,
        descriptionHtml: `<p><strong>Test file:</strong> ${testFile}</p><p><strong>Suite:</strong> ${suiteName}</p><p><strong>Category:</strong> ${category}</p>`,
        labels: [
          { name: 'suite', value: suiteName },
          { name: 'parentSuite', value: 'TodoApp - Unit Tests' },
          { name: 'subSuite', value: result.ancestorTitles[result.ancestorTitles.length - 1] || testFile },
          { name: 'testClass', value: testFile },
          { name: 'testMethod', value: result.title },
          { name: 'package', value: path.dirname(test.path) },
          { name: 'framework', value: 'jest' },
          { name: 'language', value: 'javascript' },
          { name: 'layer', value: 'unit' },
          { name: 'tag', value: category.toLowerCase().replace(' ', '-') }
        ],
        links: [],
        parameters: [],
        steps: this.generateSteps(result)
      };

      // Add failure details if test failed
      if (result.status === 'failed' && result.failureMessages) {
        allureResult.statusDetails = {
          message: result.failureMessages[0].split('\n')[0],
          trace: result.failureMessages.join('\n')
        };
      }

      // Write result file
      const resultFilename = `${testUuid}-result.json`;
      const resultPath = path.join(this.resultsDir, resultFilename);
      
      try {
        fs.writeFileSync(resultPath, JSON.stringify(allureResult, null, 2));
      } catch (error) {
        console.error(`[Allure] Failed to write result file: ${error.message}`);
      }
    });

    // Store test UUIDs for this file
    this.testResults.set(test.path, testUuids);

    // Write container file for the test suite
    this.writeContainer(test, testResult, testUuids);
  }

  writeContainer(test, testResult, testUuids) {
    const containerUuid = uuidv4();
    const testFile = path.basename(test.path);
    
    const container = {
      uuid: containerUuid,
      name: testFile.replace('.test.js', ' - Test Suite'),
      start: testResult.perfStats.start,
      stop: testResult.perfStats.end,
      children: testUuids  // Use the actual test UUIDs
    };

    const containerFilename = `${containerUuid}-container.json`;
    const containerPath = path.join(this.resultsDir, containerFilename);
    
    try {
      fs.writeFileSync(containerPath, JSON.stringify(container, null, 2));
    } catch (error) {
      console.error(`[Allure] Failed to write container file: ${error.message}`);
    }
  }

  onRunComplete() {
    // Write environment info
    const envInfo = {
      'Node Version': process.version,
      'Platform': process.platform,
      'Jest Version': require('jest/package.json').version
    };
    
    const envPath = path.join(this.resultsDir, 'environment.properties');
    const envContent = Object.entries(envInfo)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    try {
      fs.writeFileSync(envPath, envContent);
    } catch (error) {
      console.error(`[Allure] Failed to write environment.properties: ${error.message}`);
    }

    // Write categories configuration
    const categories = [
      {
        name: 'Happy Path Tests',
        matchedStatuses: ['passed'],
        messageRegex: '.*HAPPY PATH.*'
      },
      {
        name: 'Failure Mode Tests',
        matchedStatuses: ['passed'],
        messageRegex: '.*FAILURE MODE.*'
      },
      {
        name: 'Edge Case Tests',
        matchedStatuses: ['passed'],
        messageRegex: '.*EDGE CASE.*'
      },
      {
        name: 'Test Failures',
        matchedStatuses: ['failed']
      }
    ];

    const categoriesPath = path.join(this.resultsDir, 'categories.json');
    try {
      fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    } catch (error) {
      console.error(`[Allure] Failed to write categories.json: ${error.message}`);
    }

    // Write executor info for better execution tracking
    const executor = {
      name: 'Jest',
      type: 'jest',
      buildName: `Test Run ${new Date().toISOString()}`,
      buildUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined,
      reportUrl: process.env.ALLURE_REPORT_URL || undefined
    };

    const executorPath = path.join(this.resultsDir, 'executor.json');
    try {
      fs.writeFileSync(executorPath, JSON.stringify(executor, null, 2));
      console.log(`[Allure] Results written to ${this.resultsDir}/`);
      console.log(`[Allure] Files created: ${fs.readdirSync(this.resultsDir).length}`);
    } catch (error) {
      console.error(`[Allure] Failed to write executor.json: ${error.message}`);
    }
  }

  getStatus(jestStatus) {
    switch (jestStatus) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'skipped':
      case 'pending':
      case 'disabled':
        return 'skipped';
      default:
        return 'unknown';
    }
  }

  generateSteps(result) {
    // Generate synthetic steps based on test execution
    const steps = [];
    
    // Step 1: Setup
    steps.push({
      name: 'Setup test environment',
      status: 'passed',
      stage: 'finished',
      start: result.startTime || Date.now(),
      stop: result.startTime ? result.startTime + 10 : Date.now() + 10
    });

    // Step 2: Execute test
    const testDuration = result.duration || 0;
    const executeStart = result.startTime ? result.startTime + 10 : Date.now() + 10;
    steps.push({
      name: `Execute: ${result.title.substring(0, 100)}`,
      status: this.getStatus(result.status),
      stage: 'finished',
      start: executeStart,
      stop: executeStart + Math.max(testDuration - 20, 10)
    });

    // Step 3: Assertions (if test passed or failed)
    if (result.status === 'passed' || result.status === 'failed') {
      const assertStart = executeStart + Math.max(testDuration - 20, 10);
      steps.push({
        name: result.status === 'passed' ? 'Verify expectations (passed)' : 'Verify expectations (failed)',
        status: this.getStatus(result.status),
        stage: 'finished',
        start: assertStart,
        stop: result.endTime || assertStart + 10,
        statusDetails: result.status === 'failed' && result.failureMessages ? {
          message: result.failureMessages[0].split('\n')[0]
        } : undefined
      });
    }

    return steps;
  }
}

module.exports = AllureReporter;
