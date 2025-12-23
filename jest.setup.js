// Jest setup file
require('@testing-library/jest-dom');

// Mark that we're in a Jest test environment
global.jestTestEnvironment = true;

// Create a more complete localStorage mock
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn();

// Mock fetch for unit tests (will fail gracefully, allowing localStorage fallback)
global.fetch = jest.fn(() =>
  Promise.reject(new Error('Network request failed'))
);

// Suppress console warnings/errors during tests unless explicitly needed
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only show errors that aren't expected API fallback messages
    const message = args.join(' ');
    if (!message.includes('Failed to load from API') && !message.includes('Network request failed')) {
      originalConsoleError(...args);
    }
  });
  
  console.warn = jest.fn();
  
  console.log = jest.fn((...args) => {
    // Only show logs that aren't API availability messages
    const message = args.join(' ');
    if (!message.includes('API unavailable') && !message.includes('Loaded') && !message.includes('todos from')) {
      originalConsoleLog(...args);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
