/**
 * Test suite for Citation Validator Middleware
 * Run: tsx src/middleware/test-citation-validator.ts
 */

import {
    extractDocId,
    extractDocIdsFromClaims,
    validateDocIds,
    validateCitations,
} from './citation-validator.ts';
import { q } from '../db.ts';

// Test data
const testClaims = [
    {
        claim: 'Machine learning is transforming industries.',
        sources: [
            { url: 'doc:doc-123' },
            { url: 'doc:doc-456' },
        ],
    },
    {
        claim: 'AI applications are everywhere.',
        sources: [
            { url: 'doc:doc-789' },
            { url: 'https://example.com/article' }, // Not a doc reference
        ],
    },
];

async function testExtractDocId() {
    console.log('\n🧪 Test 1: Extract Doc ID');
    console.log('='.repeat(50));
    
    const testCases = [
        { input: 'doc:doc-123', expected: 'doc-123' },
        { input: 'doc:doc-123#chunk-1', expected: 'doc-123' },
        { input: 'doc:test-doc-id', expected: 'test-doc-id' },
        { input: 'https://example.com', expected: null },
        { input: 'not-a-doc-ref', expected: null },
        { input: '', expected: null },
        { input: null, expected: null },
    ];
    
    let passed = 0;
    for (const testCase of testCases) {
        const result = extractDocId(testCase.input as any);
        const success = result === testCase.expected;
        if (success) passed++;
        console.log(`${success ? '✅' : '❌'} "${testCase.input}" → ${result} (expected: ${testCase.expected})`);
    }
    
    console.log(`\n${passed}/${testCases.length} tests passed`);
    return passed === testCases.length;
}

async function testExtractDocIdsFromClaims() {
    console.log('\n🧪 Test 2: Extract Doc IDs from Claims');
    console.log('='.repeat(50));
    
    const docIds = extractDocIdsFromClaims(testClaims);
    const expected = new Set(['doc-123', 'doc-456', 'doc-789']);
    
    const success = 
        docIds.size === expected.size &&
        Array.from(docIds).every(id => expected.has(id));
    
    console.log(`Extracted doc_ids: ${Array.from(docIds).join(', ')}`);
    console.log(`Expected: ${Array.from(expected).join(', ')}`);
    console.log(`${success ? '✅' : '❌'} Test ${success ? 'passed' : 'failed'}`);
    
    return success;
}

async function testValidateDocIds() {
    console.log('\n🧪 Test 3: Validate Doc IDs');
    console.log('='.repeat(50));
    
    // Create test documents
    const testDocIds = ['test-doc-1', 'test-doc-2', 'test-doc-3'];
    
    try {
        // Insert test documents
        for (const docId of testDocIds) {
            await q(
                'INSERT INTO documents(doc_id, title, raw) VALUES ($1, $2, $3) ON CONFLICT (doc_id) DO NOTHING',
                [docId, `Test Document ${docId}`, 'Test content']
            );
        }
        
        // Test 1: All valid
        const allValid = new Set(['test-doc-1', 'test-doc-2']);
        const result1 = await validateDocIds(allValid);
        console.log(`Test 1 - All valid: ${result1.valid ? '✅' : '❌'}`);
        console.log(`  Missing: ${result1.missing.length}`);
        
        // Test 2: Some missing
        const someMissing = new Set(['test-doc-1', 'non-existent-doc']);
        const result2 = await validateDocIds(someMissing);
        console.log(`Test 2 - Some missing: ${!result2.valid ? '✅' : '❌'}`);
        console.log(`  Missing: ${result2.missing.join(', ')}`);
        
        // Test 3: All missing
        const allMissing = new Set(['non-existent-1', 'non-existent-2']);
        const result3 = await validateDocIds(allMissing);
        console.log(`Test 3 - All missing: ${!result3.valid ? '✅' : '❌'}`);
        console.log(`  Missing: ${result3.missing.join(', ')}`);
        
        // Test 4: Empty set
        const empty = new Set<string>();
        const result4 = await validateDocIds(empty);
        console.log(`Test 4 - Empty set: ${result4.valid ? '✅' : '❌'}`);
        
        // Cleanup
        for (const docId of testDocIds) {
            await q('DELETE FROM documents WHERE doc_id = $1', [docId]);
        }
        
        const allPassed = result1.valid && !result2.valid && !result3.valid && result4.valid;
        return allPassed;
    } catch (error: any) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testValidateCitations() {
    console.log('\n🧪 Test 4: Validate Citations (Full Flow)');
    console.log('='.repeat(50));
    
    // Create test documents
    const testDocIds = ['test-citation-1', 'test-citation-2'];
    
    try {
        // Insert test documents
        for (const docId of testDocIds) {
            await q(
                'INSERT INTO documents(doc_id, title, raw) VALUES ($1, $2, $3) ON CONFLICT (doc_id) DO NOTHING',
                [docId, `Test Document ${docId}`, 'Test content']
            );
        }
        
        // Test 1: Valid citations
        const validClaims = [
            {
                claim: 'Test claim 1',
                sources: [{ url: 'doc:test-citation-1' }],
            },
            {
                claim: 'Test claim 2',
                sources: [{ url: 'doc:test-citation-2' }],
            },
        ];
        
        try {
            await validateCitations(validClaims);
            console.log('✅ Test 1 - Valid citations: PASSED');
        } catch (error: any) {
            console.log(`❌ Test 1 - Valid citations: FAILED - ${error.message}`);
            return false;
        }
        
        // Test 2: Invalid citations (missing doc_id)
        const invalidClaims = [
            {
                claim: 'Test claim',
                sources: [{ url: 'doc:non-existent-doc' }],
            },
        ];
        
        try {
            await validateCitations(invalidClaims);
            console.log('❌ Test 2 - Invalid citations: FAILED (should have thrown error)');
            return false;
        } catch (error: any) {
            console.log('✅ Test 2 - Invalid citations: PASSED (correctly threw error)');
            console.log(`   Error message: ${error.message}`);
        }
        
        // Test 3: Mixed valid/invalid
        const mixedClaims = [
            {
                claim: 'Valid claim',
                sources: [{ url: 'doc:test-citation-1' }],
            },
            {
                claim: 'Invalid claim',
                sources: [{ url: 'doc:non-existent' }],
            },
        ];
        
        try {
            await validateCitations(mixedClaims);
            console.log('❌ Test 3 - Mixed citations: FAILED (should have thrown error)');
            return false;
        } catch (error: any) {
            console.log('✅ Test 3 - Mixed citations: PASSED (correctly threw error)');
        }
        
        // Test 4: No doc references (only URLs)
        const noDocClaims = [
            {
                claim: 'Test claim',
                sources: [{ url: 'https://example.com' }],
            },
        ];
        
        try {
            await validateCitations(noDocClaims);
            console.log('✅ Test 4 - No doc references: PASSED');
        } catch (error: any) {
            console.log(`❌ Test 4 - No doc references: FAILED - ${error.message}`);
            return false;
        }
        
        // Cleanup
        for (const docId of testDocIds) {
            await q('DELETE FROM documents WHERE doc_id = $1', [docId]);
        }
        
        return true;
    } catch (error: any) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testEdgeCases() {
    console.log('\n🧪 Test 5: Edge Cases');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Empty claims_ledger
        await validateCitations([]);
        console.log('✅ Empty claims_ledger: PASSED');
        
        // Test 2: Null claims_ledger
        await validateCitations(null as any);
        console.log('✅ Null claims_ledger: PASSED');
        
        // Test 3: Claims without sources
        await validateCitations([
            { claim: 'Test', sources: [] },
        ]);
        console.log('✅ Claims without sources: PASSED');
        
        // Test 4: Claims with null sources
        await validateCitations([
            { claim: 'Test', sources: null },
        ]);
        console.log('✅ Claims with null sources: PASSED');
        
        // Test 5: Malformed claims
        await validateCitations([
            { claim: 'Test' }, // No sources field
        ]);
        console.log('✅ Malformed claims: PASSED');
        
        return true;
    } catch (error: any) {
        console.error(`❌ Edge cases failed: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🚀 Citation Validator Test Suite');
    console.log('='.repeat(50));
    
    const tests = [
        { name: 'Extract Doc ID', fn: testExtractDocId },
        { name: 'Extract Doc IDs from Claims', fn: testExtractDocIdsFromClaims },
        { name: 'Validate Doc IDs', fn: testValidateDocIds },
        { name: 'Validate Citations', fn: testValidateCitations },
        { name: 'Edge Cases', fn: testEdgeCases },
    ];
    
    const results: Array<{ name: string; passed: boolean }> = [];
    
    for (const test of tests) {
        try {
            const passed = await test.fn();
            results.push({ name: test.name, passed: passed || false });
        } catch (error: any) {
            console.error(`\n❌ ${test.name} failed: ${error.message}`);
            results.push({ name: test.name, passed: false });
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
    });
    
    console.log(`\n${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️  Some tests failed');
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}
























