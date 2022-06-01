import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  // testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  modulePathIgnorePatterns: ['tmp', '<rootDir>/dist/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // collect coverage throws off the ts-jest source maps :(
  // see https://intellij-support.jetbrains.com/hc/en-us/community/posts/360004708619-TypeScript-and-Jest-debugger-stops-only-on-breakpoints-in-tests-never-in-source-files?page=1#community_comment_360000714019
  collectCoverage: false,
  verbose: false,
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/../../setup-jest.ts'],
  preset: 'ts-jest',
};

export default config;
