import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
        '**/*.d.ts',
      ],
      thresholds: {
        // Current baseline - increase as coverage improves
        lines: 20,
        functions: 13,
        branches: 17,
        statements: 20,
      },
    },
  },
});
