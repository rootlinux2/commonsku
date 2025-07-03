// This file is used to set up the test environment

// Source map support is optional for better error stacks
try {
  // Check if the modules exist before trying to use them
  if (require.resolve('source-map-support') && require.resolve('source-map')) {
    require('source-map-support').install();
  }
} catch (error) {
  // Just log it but continue - source maps are helpful but not critical
  console.log('Source map support not available:', error.message);
  console.log(
    'For better error stacks, run: yarn add --dev source-map source-map-support',
  );
}

// Set default timeout for tests
jest.setTimeout(15000); // 15 seconds
