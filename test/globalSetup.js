// Global setup runs once before all tests
export default async function () {
  // Don't use any Jest globals here - they're not available in globalSetup
  console.log('Test environment initializing...');

  // Set environment variables if needed
  process.env.NODE_ENV = 'test';

  return {};
}
