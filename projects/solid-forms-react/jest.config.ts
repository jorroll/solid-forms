import type { InitialOptionsTsJest } from 'ts-jest';
import baseConfig from '../../jest.config';

const config: InitialOptionsTsJest = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
      babelConfig: {
        presets: ['babel-preset-solid', '@babel/preset-env'],
      },
    },
  },
};

export default config;
