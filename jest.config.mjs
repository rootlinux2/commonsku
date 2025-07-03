export default {
  preset: 'ts-jest/presets/default', // Use the correct ts-jest preset path
  testEnvironment: 'node', // Set the test environment to Node.js
  extensionsToTreatAsEsm: ['.ts'], // Treat TypeScript files as ES modules
  moduleFileExtensions: ['ts', 'js'], // Recognize TypeScript and JavaScript files
  testMatch: ['**/test/**/*.test.ts'], // Match test files in the specified directory
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit)/)', // Ensure @octokit is transformed
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Map .js imports to their corresponding files without the extension
  },
  rootDir: './', // Set the root directory for Jest
};
