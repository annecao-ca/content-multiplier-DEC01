import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Test environment
        environment: 'node',
        
        // Global setup/teardown
        globalSetup: './tests/setup.ts',
        
        // Test file patterns
        include: [
            'tests/**/*.test.ts',
            'tests/**/*.spec.ts',
            'src/**/*.test.ts',
            'src/**/*.spec.ts'
        ],
        
        // Exclude patterns
        exclude: [
            'node_modules',
            'dist',
            '.next'
        ],
        
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/index.ts',
                'src/**/*.d.ts'
            ],
            thresholds: {
                lines: 50,
                functions: 50,
                branches: 50,
                statements: 50
            }
        },
        
        // Timeouts
        testTimeout: 10000,
        hookTimeout: 10000,
        
        // Reporter
        reporters: ['verbose'],
        
        // Watch mode
        watch: false,
        
        // Parallel execution
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false
            }
        }
    },
    
    // Resolve aliases
    resolve: {
        alias: {
            '@': './src',
            '@tests': './tests'
        }
    }
})

