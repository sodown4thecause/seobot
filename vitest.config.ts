import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
    resolve: {
        alias: [
            { find: '@', replacement: resolve(__dirname, './') },
            { find: /^server-only$/, replacement: resolve(__dirname, './tests/mocks/server-only.ts') },
        ],
    },
})
