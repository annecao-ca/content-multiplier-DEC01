/**
 * Test script for Facebook Configuration
 * Tests the FacebookConfig interface and validation logic
 */

interface FacebookConfig {
  configName: string
  defaultHashtags: string
  timezone: string
  appId: string
  appSecret: string
  pageAccessToken: string
  pageId: string
  pageName?: string
  enableLinkPreview?: boolean
  defaultScheduling?: 'immediate' | 'scheduled'
}

// Validation function (mirrors the component logic)
function validateConfig(config: Partial<FacebookConfig>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!config.configName || config.configName.trim() === '') {
    errors.configName = 'Tên cấu hình là bắt buộc'
  }

  if (!config.appId || config.appId.trim() === '') {
    errors.appId = 'App ID là bắt buộc'
  }

  if (!config.appSecret || config.appSecret.trim() === '') {
    errors.appSecret = 'App Secret là bắt buộc'
  }

  if (!config.pageAccessToken || config.pageAccessToken.trim() === '') {
    errors.pageAccessToken = 'Page Access Token là bắt buộc'
  }

  if (!config.pageId || config.pageId.trim() === '') {
    errors.pageId = 'Page ID là bắt buộc'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Test cases
const testCases = [
  {
    name: 'Empty config',
    config: {},
    expectedValid: false,
    expectedErrors: ['configName', 'appId', 'appSecret', 'pageAccessToken', 'pageId']
  },
  {
    name: 'Missing configName',
    config: {
      appId: 'test-app-id',
      appSecret: 'test-secret',
      pageAccessToken: 'test-token',
      pageId: '123456789'
    },
    expectedValid: false,
    expectedErrors: ['configName']
  },
  {
    name: 'Missing appId',
    config: {
      configName: 'Test Config',
      appSecret: 'test-secret',
      pageAccessToken: 'test-token',
      pageId: '123456789'
    },
    expectedValid: false,
    expectedErrors: ['appId']
  },
  {
    name: 'Valid minimal config',
    config: {
      configName: 'Test Facebook Config',
      appId: 'test-app-id-123',
      appSecret: 'test-app-secret-456',
      pageAccessToken: 'test-page-access-token-789',
      pageId: '123456789'
    },
    expectedValid: true,
    expectedErrors: []
  },
  {
    name: 'Valid full config',
    config: {
      configName: 'My Facebook',
      defaultHashtags: '#marketing, #content',
      timezone: 'Asia/Ho_Chi_Minh',
      appId: 'test-app-id-123',
      appSecret: 'test-app-secret-456',
      pageAccessToken: 'test-page-access-token-789',
      pageId: '123456789',
      pageName: 'Test Page',
      enableLinkPreview: true,
      defaultScheduling: 'immediate'
    },
    expectedValid: true,
    expectedErrors: []
  },
  {
    name: 'Config with empty strings',
    config: {
      configName: '',
      appId: '   ',
      appSecret: 'test-secret',
      pageAccessToken: 'test-token',
      pageId: '123456789'
    },
    expectedValid: false,
    expectedErrors: ['configName', 'appId']
  }
]

// Run tests
console.log('===================================')
console.log('Facebook Config Validation Tests')
console.log('===================================\n')

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const result = validateConfig(testCase.config)
  const isValid = result.valid === testCase.expectedValid
  const errorKeys = Object.keys(result.errors)
  const errorsMatch = testCase.expectedErrors.every(err => errorKeys.includes(err)) &&
                     errorKeys.length === testCase.expectedErrors.length

  if (isValid && errorsMatch) {
    console.log(`✓ ${testCase.name}`)
    passed++
  } else {
    console.log(`✗ ${testCase.name}`)
    console.log(`  Expected valid: ${testCase.expectedValid}, Got: ${result.valid}`)
    console.log(`  Expected errors: ${testCase.expectedErrors.join(', ')}`)
    console.log(`  Got errors: ${errorKeys.join(', ')}`)
    failed++
  }
}

console.log('\n===================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('===================================')

// Test timezone validation
console.log('\n===================================')
console.log('Timezone Validation')
console.log('===================================\n')

const validTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Australia/Sydney',
  'Australia/Melbourne'
]

const testTimezones = ['UTC', 'Asia/Ho_Chi_Minh', 'Invalid/Timezone', 'America/New_York']

for (const tz of testTimezones) {
  const isValid = validTimezones.includes(tz)
  console.log(`${isValid ? '✓' : '✗'} ${tz} ${isValid ? '(valid)' : '(invalid)'}`)
}

// Test hashtag format
console.log('\n===================================')
console.log('Hashtag Format Tests')
console.log('===================================\n')

const hashtagTests = [
  { input: '#marketing, #content', valid: true },
  { input: 'marketing, content', valid: false },
  { input: '#marketing #content', valid: false }, // missing comma
  { input: '#marketing, #content, #social', valid: true },
  { input: '', valid: true } // optional field
]

for (const test of hashtagTests) {
  const hasCommas = test.input.includes(',') || test.input === ''
  const allStartWithHash = test.input === '' || test.input.split(',').every(tag => tag.trim().startsWith('#'))
  const isValid = hasCommas && allStartWithHash
  
  if (isValid === test.valid) {
    console.log(`✓ "${test.input}" ${isValid ? '(valid)' : '(invalid)'}`)
  } else {
    console.log(`✗ "${test.input}" Expected: ${test.valid ? 'valid' : 'invalid'}, Got: ${isValid ? 'valid' : 'invalid'}`)
  }
}

console.log('\n===================================')
console.log('All tests completed!')
console.log('===================================')
