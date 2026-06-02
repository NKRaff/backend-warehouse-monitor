import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
      exclude: ['src/main.ts', '**/*.dto.ts', '**/*.repository.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        perFile: true,
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['./src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['./test/**/*.test.ts'],
          exclude: ['./test/**/*.e2e.test.ts'],
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['./test/**/*.e2e.test.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
