import { defineConfig } from 'vite';
import { narrowSolidPlugin } from '@merged/react-solid/plugin';
import react from '@vitejs/plugin-react';

const external = ['react', 'solid-forms/core', 'solid-js', 'tslib'];

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/public-api.ts',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external,
    },
  },
  // plugins: [narrowSolidPlugin({ include: /\/src/ })],
});
