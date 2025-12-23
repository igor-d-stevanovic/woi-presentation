module.exports = {
  testEnvironment: 'allure-jest/jsdom',
  testEnvironmentOptions: {
    resultsDir: 'allure-results'
  },
  testMatch: ['**/minimal.test.js']
};
