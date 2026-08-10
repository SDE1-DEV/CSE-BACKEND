import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    env: {
      NODE_ENV: 'test',
      EXECUTION_ENGINE: 'mock',
      JWT_SECRET: 'test-jwt-secret-for-testing',
      JWT_REFRESH_SECRET: 'test-refresh-secret-for-testing',
      SUPABASE_URL: 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY: 'placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'placeholder',
      CLIENT_URL: 'http://localhost:5173',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/tests/**',
        'src/server.ts',
        'src/**/*.d.ts',
        'src/config/swagger.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
