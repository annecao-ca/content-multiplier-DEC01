/**
 * Test suite for Document Versioning
 * Run: tsx src/services/test-document-versioning.ts
 */

import {
    createDocumentVersion,
    getDocumentVersions,
    getDocumentVersion,
    getDocumentVersionSummary,
    deleteDocumentVersion,
    setCurrentVersion,
} from './document-versioning.ts';
import { llm } from './llm.ts';
import { q } from '../db.ts';

const TEST_DOC_ID = 'test-versioning-doc';

async function cleanup() {
    await q('DELETE FROM documents WHERE doc_id = $1', [TEST_DOC_ID]);
}

async function testCreateVersions() {
    console.log('\n🧪 Test 1: Create Multiple Versions');
    console.log('='.repeat(50));
    
    try {
        // Version 1
        const v1 = await createDocumentVersion(
            {
                doc_id: TEST_DOC_ID,
                title: 'Test Document v1',
                raw: 'This is version 1 of the document. Machine learning is important.',
                author: 'Test Author',
                tags: ['AI', 'ML'],
            },
            llm.embed,
            true,
            'test-user-1'
        );
        
        console.log(`✅ Version 1 created: ${v1.version_id} (v${v1.version_number})`);
        console.log(`   Chunks: ${v1.chunks}`);
        
        // Version 2
        const v2 = await createDocumentVersion(
            {
                doc_id: TEST_DOC_ID,
                title: 'Test Document v2',
                raw: 'This is version 2 of the document. Machine learning and deep learning are important.',
                author: 'Test Author',
                tags: ['AI', 'ML', 'DL'],
            },
            llm.embed,
            true,
            'test-user-2'
        );
        
        console.log(`✅ Version 2 created: ${v2.version_id} (v${v2.version_number})`);
        console.log(`   Chunks: ${v2.chunks}`);
        
        // Version 3
        const v3 = await createDocumentVersion(
            {
                doc_id: TEST_DOC_ID,
                title: 'Test Document v3',
                raw: 'This is version 3. Machine learning, deep learning, and neural networks are transforming industries.',
                author: 'Test Author',
                tags: ['AI', 'ML', 'DL', 'NN'],
            },
            llm.embed,
            true,
            'test-user-3'
        );
        
        console.log(`✅ Version 3 created: ${v3.version_id} (v${v3.version_number})`);
        console.log(`   Chunks: ${v3.chunks}`);
        
        return { v1, v2, v3 };
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return null;
    }
}

async function testGetVersions() {
    console.log('\n🧪 Test 2: Get All Versions');
    console.log('='.repeat(50));
    
    try {
        const versions = await getDocumentVersions(TEST_DOC_ID);
        
        console.log(`✅ Found ${versions.length} versions:`);
        versions.forEach(v => {
            console.log(`   v${v.version_number}: ${v.version_id}`);
            console.log(`      Title: ${v.title}`);
            console.log(`      Created: ${v.created_at}`);
            console.log(`      Chunks: ${v.chunk_count}`);
            console.log(`      Length: ${v.content_length} chars`);
        });
        
        return versions.length === 3;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testGetVersionSummary() {
    console.log('\n🧪 Test 3: Get Version Summary');
    console.log('='.repeat(50));
    
    try {
        const summary = await getDocumentVersionSummary(TEST_DOC_ID);
        
        if (!summary) {
            console.log('❌ Summary not found');
            return false;
        }
        
        console.log(`✅ Document: ${summary.doc_id}`);
        console.log(`   Title: ${summary.title}`);
        console.log(`   Current version: ${summary.current_version}`);
        console.log(`   Total versions: ${summary.total_versions}`);
        console.log(`   Latest version ID: ${summary.latest_version_id}`);
        console.log(`   Versions:`);
        summary.versions.forEach(v => {
            console.log(`      v${v.version_number}: ${v.version_id} (${v.chunk_count} chunks)`);
        });
        
        return summary.total_versions === 3;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testGetSpecificVersion() {
    console.log('\n🧪 Test 4: Get Specific Version');
    console.log('='.repeat(50));
    
    try {
        const versions = await getDocumentVersions(TEST_DOC_ID);
        const version1 = versions.find(v => v.version_number === 1);
        
        if (!version1) {
            console.log('❌ Version 1 not found');
            return false;
        }
        
        const version = await getDocumentVersion(version1.version_id);
        
        if (!version) {
            console.log('❌ Version not found');
            return false;
        }
        
        console.log(`✅ Version ${version.version_number}:`);
        console.log(`   ID: ${version.version_id}`);
        console.log(`   Title: ${version.title}`);
        console.log(`   Content preview: ${version.raw.substring(0, 100)}...`);
        console.log(`   Chunks: ${version.chunk_count}`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testSetCurrentVersion() {
    console.log('\n🧪 Test 5: Set Current Version');
    console.log('='.repeat(50));
    
    try {
        // Set version 2 as current
        await setCurrentVersion(TEST_DOC_ID, 2);
        
        const summary = await getDocumentVersionSummary(TEST_DOC_ID);
        
        if (summary?.current_version === 2) {
            console.log('✅ Version 2 set as current');
            return true;
        } else {
            console.log(`❌ Current version is ${summary?.current_version}, expected 2`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testDeleteVersion() {
    console.log('\n🧪 Test 6: Delete Version');
    console.log('='.repeat(50));
    
    try {
        const versions = await getDocumentVersions(TEST_DOC_ID);
        const versionToDelete = versions.find(v => v.version_number === 1);
        
        if (!versionToDelete) {
            console.log('❌ Version 1 not found');
            return false;
        }
        
        await deleteDocumentVersion(versionToDelete.version_id);
        
        const versionsAfter = await getDocumentVersions(TEST_DOC_ID);
        
        if (versionsAfter.length === 2) {
            console.log('✅ Version 1 deleted successfully');
            console.log(`   Remaining versions: ${versionsAfter.length}`);
            return true;
        } else {
            console.log(`❌ Expected 2 versions, got ${versionsAfter.length}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testVersionNumbering() {
    console.log('\n🧪 Test 7: Version Numbering');
    console.log('='.repeat(50));
    
    try {
        // Create another version after deletion
        const v4 = await createDocumentVersion(
            {
                doc_id: TEST_DOC_ID,
                title: 'Test Document v4',
                raw: 'This is version 4, created after deleting v1.',
            },
            llm.embed,
            true
        );
        
        console.log(`✅ Version 4 created: v${v4.version_number}`);
        
        // Version number should be 4 (not 3, because v1 was deleted but numbering continues)
        if (v4.version_number === 4) {
            console.log('✅ Version numbering correct (continues after deletion)');
            return true;
        } else {
            console.log(`❌ Expected version 4, got ${v4.version_number}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🚀 Document Versioning Test Suite');
    console.log('='.repeat(50));
    
    // Cleanup first
    await cleanup();
    
    const tests = [
        { name: 'Create Versions', fn: testCreateVersions },
        { name: 'Get All Versions', fn: testGetVersions },
        { name: 'Get Version Summary', fn: testGetVersionSummary },
        { name: 'Get Specific Version', fn: testGetSpecificVersion },
        { name: 'Set Current Version', fn: testSetCurrentVersion },
        { name: 'Delete Version', fn: testDeleteVersion },
        { name: 'Version Numbering', fn: testVersionNumbering },
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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    }
    
    // Final cleanup
    await cleanup();
    
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













