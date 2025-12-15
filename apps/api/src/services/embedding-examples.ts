/**
 * EmbeddingClient Usage Examples
 * 
 * Demonstrates how to use EmbeddingClient with different providers
 */

import {
    EmbeddingClient,
    createEmbeddingClient,
    createEmbeddingClientFromEnv,
    type EmbeddingClientConfig,
} from './embedding-client.ts';

// ============================================
// EXAMPLE 1: OpenAI Provider
// ============================================

export async function exampleOpenAI() {
    console.log('\n📝 Example 1: OpenAI Embedding');
    console.log('='.repeat(50));
    
    // Create client with OpenAI
    const client = new EmbeddingClient({
        provider: 'openai',
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            defaultModel: 'text-embedding-3-small',
        },
    });
    
    const texts = [
        'Machine learning is a subset of artificial intelligence.',
        'Deep learning uses neural networks with multiple layers.',
    ];
    
    try {
        const result = await client.embed(texts);
        
        console.log(`Provider: ${result.provider}`);
        console.log(`Model: ${result.model}`);
        console.log(`Dimensions: ${result.dimensions}`);
        console.log(`Number of embeddings: ${result.embeddings.length}`);
        console.log(`First embedding length: ${result.embeddings[0].length}`);
        console.log(`First 5 values: [${result.embeddings[0].slice(0, 5).join(', ')}...]`);
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 2: Cohere Provider
// ============================================

export async function exampleCohere() {
    console.log('\n📝 Example 2: Cohere Embedding');
    console.log('='.repeat(50));
    
    // Create client with Cohere
    const client = new EmbeddingClient({
        provider: 'cohere',
        cohere: {
            apiKey: process.env.COHERE_API_KEY || '',
            defaultModel: 'embed-english-v3.0',
        },
    });
    
    const texts = [
        'Natural language processing enables computers to understand text.',
        'Computer vision allows machines to interpret visual information.',
    ];
    
    try {
        const result = await client.embed(texts);
        
        console.log(`Provider: ${result.provider}`);
        console.log(`Model: ${result.model}`);
        console.log(`Dimensions: ${result.dimensions}`);
        console.log(`Number of embeddings: ${result.embeddings.length}`);
        console.log(`First embedding length: ${result.embeddings[0].length}`);
        console.log(`First 5 values: [${result.embeddings[0].slice(0, 5).join(', ')}...]`);
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 3: Hugging Face Provider
// ============================================

export async function exampleHuggingFace() {
    console.log('\n📝 Example 3: Hugging Face Embedding');
    console.log('='.repeat(50));
    
    // Create client with Hugging Face
    const client = new EmbeddingClient({
        provider: 'huggingface',
        huggingface: {
            apiKey: process.env.HUGGINGFACE_API_KEY || '',
            defaultModel: 'sentence-transformers/all-MiniLM-L6-v2',
        },
    });
    
    const texts = [
        'Artificial intelligence is transforming industries.',
        'AI applications span healthcare, finance, and retail.',
    ];
    
    try {
        const result = await client.embed(texts);
        
        console.log(`Provider: ${result.provider}`);
        console.log(`Model: ${result.model}`);
        console.log(`Dimensions: ${result.dimensions}`);
        console.log(`Number of embeddings: ${result.embeddings.length}`);
        console.log(`First embedding length: ${result.embeddings[0].length}`);
        console.log(`First 5 values: [${result.embeddings[0].slice(0, 5).join(', ')}...]`);
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 4: Factory Function (Simple)
// ============================================

export async function exampleFactoryFunction() {
    console.log('\n📝 Example 4: Factory Function');
    console.log('='.repeat(50));
    
    // Create client using factory function
    const client = createEmbeddingClient(
        'openai',
        process.env.OPENAI_API_KEY || '',
        'text-embedding-3-small'
    );
    
    const texts = ['This is a test sentence.'];
    
    try {
        const result = await client.embed(texts);
        console.log(`Created embeddings using ${result.provider}`);
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 5: From Environment Variables
// ============================================

export async function exampleFromEnv() {
    console.log('\n📝 Example 5: From Environment Variables');
    console.log('='.repeat(50));
    
    // Create client from environment variables
    // Reads EMBEDDING_PROVIDER, OPENAI_API_KEY, etc.
    const client = createEmbeddingClientFromEnv();
    
    const texts = ['Embedding from environment configuration.'];
    
    try {
        const result = await client.embed(texts);
        console.log(`Provider from env: ${result.provider}`);
        console.log(`Model: ${result.model}`);
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 6: Custom Model Override
// ============================================

export async function exampleCustomModel() {
    console.log('\n📝 Example 6: Custom Model Override');
    console.log('='.repeat(50));
    
    const client = new EmbeddingClient({
        provider: 'openai',
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            defaultModel: 'text-embedding-3-small',
        },
    });
    
    const texts = ['Using a different model for this embedding.'];
    
    try {
        // Override default model
        const result = await client.embed(texts, 'text-embedding-3-large');
        
        console.log(`Provider: ${result.provider}`);
        console.log(`Model (overridden): ${result.model}`);
        console.log(`Dimensions: ${result.dimensions}`);
        console.log(`Note: text-embedding-3-large has ${result.dimensions} dimensions`);
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 7: Batch Processing
// ============================================

export async function exampleBatchProcessing() {
    console.log('\n📝 Example 7: Batch Processing');
    console.log('='.repeat(50));
    
    const client = new EmbeddingClient({
        provider: 'openai',
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
        },
    });
    
    // Large batch of texts
    const texts = [
        'First document about machine learning.',
        'Second document about deep learning.',
        'Third document about neural networks.',
        'Fourth document about natural language processing.',
        'Fifth document about computer vision.',
    ];
    
    try {
        const startTime = Date.now();
        const result = await client.embed(texts);
        const duration = Date.now() - startTime;
        
        console.log(`Processed ${texts.length} texts in ${duration}ms`);
        console.log(`Average time per text: ${(duration / texts.length).toFixed(2)}ms`);
        console.log(`Total embeddings: ${result.embeddings.length}`);
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// EXAMPLE 8: Switching Providers
// ============================================

export async function exampleSwitchingProviders() {
    console.log('\n📝 Example 8: Switching Providers');
    console.log('='.repeat(50));
    
    const text = 'Compare embeddings from different providers.';
    
    const providers: Array<{ type: 'openai' | 'cohere' | 'huggingface'; name: string }> = [
        { type: 'openai', name: 'OpenAI' },
        { type: 'cohere', name: 'Cohere' },
        { type: 'huggingface', name: 'Hugging Face' },
    ];
    
    const results: Array<{ provider: string; dimensions: number; embedding: number[] }> = [];
    
    for (const provider of providers) {
        try {
            const client = new EmbeddingClient({
                provider: provider.type,
                openai: provider.type === 'openai' ? {
                    apiKey: process.env.OPENAI_API_KEY || '',
                } : undefined,
                cohere: provider.type === 'cohere' ? {
                    apiKey: process.env.COHERE_API_KEY || '',
                } : undefined,
                huggingface: provider.type === 'huggingface' ? {
                    apiKey: process.env.HUGGINGFACE_API_KEY || '',
                } : undefined,
            });
            
            const result = await client.embed([text]);
            results.push({
                provider: provider.name,
                dimensions: result.dimensions,
                embedding: result.embeddings[0],
            });
            
            console.log(`✅ ${provider.name}: ${result.dimensions} dimensions`);
        } catch (error: any) {
            console.log(`❌ ${provider.name}: ${error.message}`);
        }
    }
    
    console.log(`\nSuccessfully created embeddings from ${results.length} providers`);
    return results;
}

// ============================================
// EXAMPLE 9: Integration with RAG System
// ============================================

export async function exampleRAGIntegration() {
    console.log('\n📝 Example 9: RAG System Integration');
    console.log('='.repeat(50));
    
    // Create embedding client
    const client = new EmbeddingClient({
        provider: 'openai',
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
        },
    });
    
    // Simulate document chunks
    const chunks = [
        'Machine learning is transforming industries.',
        'Deep learning uses neural networks.',
        'AI applications are everywhere.',
    ];
    
    try {
        // Create embeddings for chunks
        const result = await client.embed(chunks);
        
        console.log(`Created embeddings for ${chunks.length} chunks`);
        console.log(`Provider: ${result.provider}`);
        console.log(`Dimensions: ${result.dimensions}`);
        
        // In real RAG system, you would:
        // 1. Store embeddings in database
        // 2. Use for similarity search
        // 3. Retrieve relevant chunks
        
        // Example: Calculate similarity between first two chunks
        const embedding1 = result.embeddings[0];
        const embedding2 = result.embeddings[1];
        
        // Cosine similarity
        const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
        const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
        const similarity = dotProduct / (magnitude1 * magnitude2);
        
        console.log(`Similarity between chunk 1 and 2: ${similarity.toFixed(4)}`);
        
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

export async function runAllExamples() {
    console.log('\n🚀 Running All EmbeddingClient Examples');
    console.log('='.repeat(50));
    
    const examples = [
        { name: 'OpenAI', fn: exampleOpenAI },
        { name: 'Cohere', fn: exampleCohere },
        { name: 'Hugging Face', fn: exampleHuggingFace },
        { name: 'Factory Function', fn: exampleFactoryFunction },
        { name: 'From Env', fn: exampleFromEnv },
        { name: 'Custom Model', fn: exampleCustomModel },
        { name: 'Batch Processing', fn: exampleBatchProcessing },
        { name: 'Switching Providers', fn: exampleSwitchingProviders },
        { name: 'RAG Integration', fn: exampleRAGIntegration },
    ];
    
    for (const example of examples) {
        try {
            await example.fn();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between examples
        } catch (error: any) {
            console.error(`\n❌ ${example.name} failed: ${error.message}`);
        }
    }
    
    console.log('\n✅ All examples completed!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllExamples().catch(console.error);
}





















