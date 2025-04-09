// Increase timeout for all tests
jest.setTimeout(10000);

// Add any global test setup here
beforeAll(async () => {
  // Add global setup if needed
});

// Clean up after all tests
afterAll(async () => {
  // Add global cleanup if needed
});

// Reset any mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 