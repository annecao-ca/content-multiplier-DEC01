/**
 * Global test setup
 * Runs before all tests
 */

import { config } from 'dotenv'

export default async function setup() {
    // Load test environment
    config({ path: '.env.test' })
    
    // Set test environment variables
    process.env.NODE_ENV = 'test'
    process.env.LOG_LEVEL = 'error' // Reduce noise in tests
    
    console.log('🧪 Test environment initialized')
}

export async function teardown() {
    console.log('🧪 Test environment cleaned up')
}

