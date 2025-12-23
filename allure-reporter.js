const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AllureReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    this.resultsDir = this._options.resultsDir || 'allure-results';
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  onRunStart() {
    console.log('[Allure] Starting test run...');
  }

  onTestResult(test, testResult) {
    testResult.testResults.forEach((result) => {
      const testUuid = uuidv4();
      const testFile = path.basename(test.path);
      
      const allureResult = {
        uuid: testUuid,
        historyId: result.fullName,
        name: result.title,
        fullName: result.fullName,
        status: this.getStatus(result.status),
        stage: 'finished',
        start: result.startTime || testResult.perfStats.start,
        stop: result.endTime || testResult.perfStats.end,
        duration: result.duration || 0,
        labels: [
          { name: 'suite', value: result.ancestorTitles.join(' > ') || testFile },
          { name: 'testClass', value: testFile },
          { name: 'testMethod', value: result.title },
          { name: 'package', value: path.dirname(test.path) },
          { name: 'framework', value: 'jest' },
          { name: 'language', value: 'javascript' }
        ],
        links: []
      };

      // Add failure details if test failed
      if (result.status === 'failed' && result.failureMessages) {
        allureResult.statusDetails = {
          message: result.failureMessages[0],
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
      console.log(`[Allure] Results written to ${this.resultsDir}/`);
      console.log(`[Allure] Files created: ${fs.readdirSync(this.resultsDir).length}`);
    } catch (error) {
      console.error(`[Allure] Failed to write environment.properties: ${error.message}`);
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
}

module.exports = AllureReporter;
