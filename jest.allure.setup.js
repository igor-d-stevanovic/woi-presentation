// Helper to wrap steps in Allure when available
global.allureStep = async (name, fn) => {
  const allure = global.allure;
  if (!allure) return fn();
  try {
    allure.startStep(name);
    const res = await fn();
    allure.endStep('passed');
    return res;
  } catch (err) {
    allure.endStep('failed');
    throw err;
  }
};

beforeEach(() => {
  if (global.allure) {
    global.allure.label('layer', 'unit');
    global.allure.epic('TodoApp');
  }
});
