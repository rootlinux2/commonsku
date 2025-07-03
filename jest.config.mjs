export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(@octokit)/)'], // transform @octokit to ESM
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // fix imports without .js extension
  },
  testMatch: ['**/test/**/*.test.ts'],
};
