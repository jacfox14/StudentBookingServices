/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@sbs/shared$': '<rootDir>/../shared/src/index.ts',
    '^@sbs/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      diagnostics: { ignoreCodes: ['TS151001', 'TS151002'] },
    }],
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  globalSetup: '<rootDir>/jest.globalSetup.cjs',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testTimeout: 30000,
  // Clear module registry between test files to avoid model re-initialization errors
  clearMocks: true,
  restoreMocks: true,
};
