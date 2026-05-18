import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
      exclude: ['src/main.ts', '**/*.dto.ts', '**/*.repository.ts'],
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
        },
      },
    ],
  },
})
