const mockConsole = () => {
  const mock = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };

  // Store original console methods
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Replace console methods with mocks
  console.log = mock.log;
  console.error = mock.error;
  console.warn = mock.warn;
  console.info = mock.info;
  console.debug = mock.debug;

  // Return mock functions for assertions
  return mock;
};

module.exports = mockConsole; 