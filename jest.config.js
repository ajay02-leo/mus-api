/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 15000,
  globals: { 'ts-jest': { tsconfig: { module: 'commonjs' } } },
  setupFilesAfterFramework: [],
  verbose: true,
}
