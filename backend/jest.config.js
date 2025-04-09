module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['./src/__tests__/setup.js'],
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}; 