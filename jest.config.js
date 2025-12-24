module.exports = {
  // Use jsdom environment (not allure-jest - it doesn't work properly)
  testEnvironment: 'jsdom',
  
  // Setup files to run after jest is initialized
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'unit-tests.html',
      expand: true,
      pageTitle: 'Unit Test Report'
    }],
    ['<rootDir>/allure-reporter.js', {
      resultsDir: 'allure-results'
    }]
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'script.js',
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
  },
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  
  // Transform files
  transform: {},
  
  // Verbose output
  verbose: true
};
