module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/api.test.js'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    testTimeout: 10000,
    reporters: [
        'default',
        ['jest-html-reporters', {
            publicPath: './test-reports',
            filename: 'api-tests.html',
            expand: true,
            pageTitle: 'API Test Report'
        }],
        ['<rootDir>/allure-reporter.js', {
            resultsDir: 'allure-results'
        }]
    ],
    
    // Coverage configuration
    collectCoverageFrom: [
        'server.js',
        '!node_modules/**',
        '!coverage/**'
    ],

    // Coverage reporters
    coverageReporters: ['json', 'json-summary', 'lcov', 'text', 'html'],
    
    // Coverage directory
    coverageDirectory: 'coverage',
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    }
};
