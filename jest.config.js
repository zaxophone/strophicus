module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // bundled audio is a number (an asset id) in the app; any number will do in tests
  moduleNameMapper: { '\\.mp3$': '<rootDir>/src/testing/assetStub.js' },
};
