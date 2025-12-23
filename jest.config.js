module.exports = {
  // Use jsdom environment for DOM testing
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
    }]
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'script.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Transform files
  transform: {},
  
  // Verbose output
  verbose: true
};
