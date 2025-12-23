const { allure } = require('jest-allure/dist/setup');

// Helper function for adding steps
global.allureStep = async (name, callback) => {
  reporter.startStep(name);
  try {
    const result = await callback();
    reporter.endStep('passed');
    return result;
  } catch (error) {
    reporter.endStep('failed');
    throw error;
  }
};

// Add labels to all tests
beforeEach(() => {
  reporter.epic('TodoApp');
  reporter.feature('Unit Tests');
  reporter.label('layer', 'unit');
});
