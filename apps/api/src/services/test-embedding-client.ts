/**
 * Test suite for EmbeddingClient
 * Run: tsx src/services/test-embedding-client.ts
 */

import {
    EmbeddingClient,
    createEmbeddingClient,
    createEmbeddingClientFromEnv,
} from './embedding-client.ts';

// Test texts
const testTexts = [
    'Machine learning is a subset of artificial intelligence.',
    'Deep learning uses neural networks with multiple layers.',
    'Natural language processing helps computers understand human language.',
];

async function testOpenAI() {
    console.log('\n🧪 Testing OpenAI Provider');
    console.log('='.repeat(50));
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = new EmbeddingClient({
            provider: 'openai',
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
            },
        });
        
        const result = await client.embed(testTexts);
        
        console.log(`✅ Provider: ${result.provider}`);
        console.log(`✅ Model: ${result.model}`);
        console.log(`✅ Dimensions: ${result.dimensions}`);
        console.log(`✅ Embeddings: ${result.embeddings.length} vectors`);
        console.log(`✅ First embedding length: ${result.embeddings[0].length}`);
        
        // Verify dimensions
        if (result.dimensions === 1536) {
            console.log('✅ Dimensions correct (text-embedding-3-small)');
        } else {
            console.log(`⚠️  Unexpected dimensions: ${result.dimensions}`);
        }
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testCohere() {
    console.log('\n🧪 Testing Cohere Provider');
    console.log('='.repeat(50));
    
    if (!process.env.COHERE_API_KEY) {
        console.log('⚠️  COHERE_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = new EmbeddingClient({
            provider: 'cohere',
            cohere: {
                apiKey: process.env.COHERE_API_KEY,
            },
        });
        
        const result = await client.embed(testTexts);
        
        console.log(`✅ Provider: ${result.provider}`);
        console.log(`✅ Model: ${result.model}`);
        console.log(`✅ Dimensions: ${result.dimensions}`);
        console.log(`✅ Embeddings: ${result.embeddings.length} vectors`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testHuggingFace() {
    console.log('\n🧪 Testing Hugging Face Provider');
    console.log('='.repeat(50));
    
    if (!process.env.HUGGINGFACE_API_KEY) {
        console.log('⚠️  HUGGINGFACE_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = new EmbeddingClient({
            provider: 'huggingface',
            huggingface: {
                apiKey: process.env.HUGGINGFACE_API_KEY,
            },
        });
        
        const result = await client.embed(testTexts);
        
        console.log(`✅ Provider: ${result.provider}`);
        console.log(`✅ Model: ${result.model}`);
        console.log(`✅ Dimensions: ${result.dimensions}`);
        console.log(`✅ Embeddings: ${result.embeddings.length} vectors`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testFactoryFunction() {
    console.log('\n🧪 Testing Factory Function');
    console.log('='.repeat(50));
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = createEmbeddingClient(
            'openai',
            process.env.OPENAI_API_KEY,
            'text-embedding-3-small'
        );
        
        const result = await client.embed(['Test text']);
        
        console.log(`✅ Created client using factory function`);
        console.log(`✅ Provider: ${result.provider}`);
        console.log(`✅ Model: ${result.model}`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testFromEnv() {
    console.log('\n🧪 Testing From Environment');
    console.log('='.repeat(50));
    
    try {
        const client = createEmbeddingClientFromEnv();
        const result = await client.embed(['Test from env']);
        
        console.log(`✅ Created client from environment`);
        console.log(`✅ Provider: ${result.provider}`);
        console.log(`✅ Model: ${result.model}`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testModelOverride() {
    console.log('\n🧪 Testing Model Override');
    console.log('='.repeat(50));
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = new EmbeddingClient({
            provider: 'openai',
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                defaultModel: 'text-embedding-3-small',
            },
        });
        
        // Override with large model
        const result = await client.embed(
            ['Test with large model'],
            'text-embedding-3-large'
        );
        
        console.log(`✅ Default model: text-embedding-3-small`);
        console.log(`✅ Override model: ${result.model}`);
        console.log(`✅ Dimensions: ${result.dimensions}`);
        
        if (result.dimensions === 3072) {
            console.log('✅ Large model dimensions correct (3072)');
        }
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testBatchProcessing() {
    console.log('\n🧪 Testing Batch Processing');
    console.log('='.repeat(50));
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = new EmbeddingClient({
            provider: 'openai',
            openai: { apiKey: process.env.OPENAI_API_KEY },
        });
        
        const largeBatch = Array(10).fill(0).map((_, i) => `Document ${i + 1} about AI.`);
        
        const startTime = Date.now();
        const result = await client.embed(largeBatch);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Processed ${largeBatch.length} texts`);
        console.log(`✅ Time: ${duration}ms`);
        console.log(`✅ Average: ${(duration / largeBatch.length).toFixed(2)}ms per text`);
        console.log(`✅ Embeddings: ${result.embeddings.length}`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testDimensions() {
    console.log('\n🧪 Testing Dimensions');
    console.log('='.repeat(50));
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set, skipping test');
        return;
    }
    
    try {
        const client = new EmbeddingClient({
            provider: 'openai',
            openai: { apiKey: process.env.OPENAI_API_KEY },
        });
        
        // Test different models
        const models = [
            { name: 'text-embedding-3-small', expected: 1536 },
            { name: 'text-embedding-3-large', expected: 3072 },
        ];
        
        for (const model of models) {
            const dimensions = client.getDimensions(model.name);
            console.log(`✅ ${model.name}: ${dimensions} dimensions`);
            
            if (dimensions === model.expected) {
                console.log(`   ✓ Correct`);
            } else {
                console.log(`   ✗ Expected ${model.expected}, got ${dimensions}`);
            }
        }
        
        return true;
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🚀 EmbeddingClient Test Suite');
    console.log('='.repeat(50));
    
    const tests = [
        { name: 'OpenAI', fn: testOpenAI },
        { name: 'Cohere', fn: testCohere },
        { name: 'Hugging Face', fn: testHuggingFace },
        { name: 'Factory Function', fn: testFactoryFunction },
        { name: 'From Environment', fn: testFromEnv },
        { name: 'Model Override', fn: testModelOverride },
        { name: 'Batch Processing', fn: testBatchProcessing },
        { name: 'Dimensions', fn: testDimensions },
    ];
    
    const results: Array<{ name: string; passed: boolean }> = [];
    
    for (const test of tests) {
        const passed = await test.fn() || false;
        results.push({ name: test.name, passed });
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait between tests
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
        console.log('⚠️  Some tests failed or were skipped (check API keys)');
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}





















