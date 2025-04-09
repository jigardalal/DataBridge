/**
 * Creates a mock console object with spied methods
 * @returns {Object} Mock console with jest spies for log, error, warn, and info
 */
function mockConsole() {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    info: jest.spyOn(console, 'info').mockImplementation(() => {})
  };
}

module.exports = mockConsole; 