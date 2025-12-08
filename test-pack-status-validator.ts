/**
 * TEST: Pack Status Validator
 * 
 * Quick test file để verify status transition logic
 */

import { validatePackStatusTransition, getValidNextStatuses, isFinalStatus, getStatusWorkflow } from './packages/utils/pack-status-validator';

console.log('========== PACK STATUS VALIDATOR TESTS ==========\n');

// Test 1: Valid transitions
console.log('✅ Test 1: Valid Transitions');
const validTests = [
    ['draft', 'review'],
    ['review', 'approved'],
    ['review', 'draft'],
    ['approved', 'published'],
    ['approved', 'review'],
    ['draft', 'draft'] // Same status (no-op)
];

for (const [current, next] of validTests) {
    const result = validatePackStatusTransition(current, next);
    console.log(`  ${current} → ${next}:`, result.passed ? '✅ PASS' : '❌ FAIL', result.error || '');
}

console.log('\n❌ Test 2: Invalid Transitions');
const invalidTests = [
    ['draft', 'published'],
    ['draft', 'approved'],
    ['review', 'published'],
    ['published', 'draft'],
    ['published', 'review'],
    ['published', 'approved']
];

for (const [current, next] of invalidTests) {
    const result = validatePackStatusTransition(current, next);
    console.log(`  ${current} → ${next}:`, result.passed ? '✅ UNEXPECTED' : '❌ BLOCKED');
    if (result.error) {
        console.log(`    Error: ${result.error}`);
    }
}

// Test 3: Invalid inputs
console.log('\n⚠️ Test 3: Invalid Inputs');
const invalidInputs = [
    ['invalid', 'review'],
    ['draft', 'invalid'],
    [null, 'review'],
    ['draft', null],
    ['', 'review']
];

for (const [current, next] of invalidInputs) {
    const result = validatePackStatusTransition(current as any, next as any);
    console.log(`  ${current} → ${next}:`, result.passed ? '✅ UNEXPECTED' : '❌ BLOCKED');
    if (result.error) {
        console.log(`    Error: ${result.error}`);
    }
}

// Test 4: Helper functions
console.log('\n🔧 Test 4: Helper Functions');
console.log('  getValidNextStatuses("draft"):', getValidNextStatuses('draft'));
console.log('  getValidNextStatuses("review"):', getValidNextStatuses('review'));
console.log('  getValidNextStatuses("approved"):', getValidNextStatuses('approved'));
console.log('  getValidNextStatuses("published"):', getValidNextStatuses('published'));

console.log('\n  isFinalStatus("draft"):', isFinalStatus('draft'));
console.log('  isFinalStatus("published"):', isFinalStatus('published'));

// Test 5: Workflow visualization
console.log('\n📊 Test 5: Status Workflow');
console.log(getStatusWorkflow());

console.log('\n========== ALL TESTS COMPLETED ==========');















