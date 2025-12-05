/**
 * Test suite for token-based chunking
 * Run: tsx src/services/test-chunking.ts
 */

import { 
    chunkTextByTokens, 
    chunkTextByCharacters,
    countTokens,
    estimateChunkCount,
    chunkTextSmart 
} from './chunking.ts';

// Test text samples
const shortText = "This is a short text for testing.";

const mediumText = `
Artificial intelligence is revolutionizing how we work and live. 
Machine learning algorithms can now recognize patterns in data that 
humans might miss. Deep learning, a subset of machine learning, uses 
neural networks with multiple layers to process information. Natural 
language processing enables computers to understand human language. 
Computer vision allows machines to interpret visual information.
`;

const longText = `
Artificial intelligence (AI) is transforming industries worldwide. From healthcare 
to finance, from manufacturing to retail, AI applications are becoming increasingly 
prevalent. Machine learning, a core component of AI, enables systems to learn from 
data without explicit programming. Deep learning, using neural networks with many 
layers, has achieved remarkable success in image recognition, speech processing, 
and natural language understanding.

In healthcare, AI assists in diagnosis, drug discovery, and personalized treatment 
plans. Radiologists use AI-powered tools to detect anomalies in medical images with 
greater accuracy. In finance, AI algorithms detect fraudulent transactions, optimize 
trading strategies, and provide personalized financial advice. Manufacturing benefits 
from AI through predictive maintenance, quality control, and supply chain optimization.

The retail industry leverages AI for recommendation systems, inventory management, 
and customer service chatbots. Natural language processing powers virtual assistants 
like Siri, Alexa, and Google Assistant. Computer vision enables autonomous vehicles 
to navigate roads safely. AI is also making strides in creative fields, generating 
art, music, and even writing.

However, AI development raises important ethical considerations. Bias in training 
data can lead to unfair outcomes. Privacy concerns arise from extensive data collection. 
Job displacement is a real concern as automation increases. Ensuring AI systems are 
transparent, accountable, and aligned with human values is crucial. Researchers and 
policymakers are working on frameworks for responsible AI development.

The future of AI holds tremendous promise. Advances in quantum computing may 
dramatically accelerate AI capabilities. AGI (Artificial General Intelligence), 
systems with human-like general intelligence, remains a long-term goal. As AI 
continues to evolve, it will likely reshape society in ways we can only begin 
to imagine. The key is ensuring this powerful technology benefits all of humanity.
`.trim();

console.log('🧪 TOKEN-BASED CHUNKING TESTS');
console.log('=' .repeat(60));
console.log('');

// Test 1: Count tokens
console.log('📊 TEST 1: Count Tokens');
console.log('-'.repeat(60));
console.log(`Short text tokens: ${countTokens(shortText)}`);
console.log(`Medium text tokens: ${countTokens(mediumText)}`);
console.log(`Long text tokens: ${countTokens(longText)}`);
console.log('');

// Test 2: Character-based chunking (legacy)
console.log('📊 TEST 2: Character-based Chunking (Legacy)');
console.log('-'.repeat(60));
const charChunks = chunkTextByCharacters(longText, 500, 50);
console.log(`Chunks created: ${charChunks.length}`);
charChunks.forEach((chunk, i) => {
    console.log(`  Chunk ${i}: ${chunk.length} chars - "${chunk.slice(0, 50)}..."`);
});
console.log('');

// Test 3: Token-based chunking
console.log('📊 TEST 3: Token-based Chunking');
console.log('-'.repeat(60));
const tokenChunks = chunkTextByTokens(longText, {
    chunkTokens: 200,
    overlapTokens: 20
});
console.log(`Chunks created: ${tokenChunks.length}`);
tokenChunks.forEach(chunk => {
    console.log(`  Chunk ${chunk.index}:`);
    console.log(`    Tokens: ${chunk.tokenCount} (${chunk.startToken}-${chunk.endToken})`);
    console.log(`    Content: "${chunk.content.slice(0, 80)}..."`);
});
console.log('');

// Test 4: Smart chunking (sentence boundaries)
console.log('📊 TEST 4: Smart Chunking (Sentence Boundaries)');
console.log('-'.repeat(60));
const smartChunks = chunkTextSmart(longText, {
    chunkTokens: 200,
    overlapTokens: 20
});
console.log(`Chunks created: ${smartChunks.length}`);
smartChunks.forEach(chunk => {
    console.log(`  Chunk ${chunk.index}:`);
    console.log(`    Tokens: ${chunk.tokenCount}`);
    console.log(`    Starts with: "${chunk.content.slice(0, 60)}..."`);
    console.log(`    Ends with: "...${chunk.content.slice(-60)}"`);
});
console.log('');

// Test 5: Estimate chunk count
console.log('📊 TEST 5: Estimate Chunk Count');
console.log('-'.repeat(60));
const totalTokens = countTokens(longText);
const estimatedChunks = estimateChunkCount(longText, 200, 20);
const actualChunks = chunkTextByTokens(longText, { chunkTokens: 200, overlapTokens: 20 });
console.log(`Total tokens: ${totalTokens}`);
console.log(`Estimated chunks: ${estimatedChunks}`);
console.log(`Actual chunks: ${actualChunks.length}`);
console.log(`Estimation accuracy: ${Math.abs(estimatedChunks - actualChunks.length) <= 1 ? '✓ Accurate' : '✗ Off'}`);
console.log('');

// Test 6: Different chunk sizes
console.log('📊 TEST 6: Different Chunk Sizes');
console.log('-'.repeat(60));
[100, 200, 400, 800].forEach(size => {
    const chunks = chunkTextByTokens(longText, { chunkTokens: size, overlapTokens: 50 });
    console.log(`  ${size} tokens/chunk → ${chunks.length} chunks`);
});
console.log('');

// Test 7: Different overlap sizes
console.log('📊 TEST 7: Different Overlap Sizes');
console.log('-'.repeat(60));
[0, 25, 50, 100].forEach(overlap => {
    const chunks = chunkTextByTokens(longText, { chunkTokens: 200, overlapTokens: overlap });
    console.log(`  ${overlap} token overlap → ${chunks.length} chunks`);
});
console.log('');

// Test 8: Comparison
console.log('📊 TEST 8: Comparison - Character vs Token Chunking');
console.log('-'.repeat(60));
const text800chars = "a".repeat(800);
const text800tokens = Array(800).fill("word").join(" ");

console.log('800 characters of "a":');
console.log(`  Character chunking: ${chunkTextByCharacters(text800chars, 800, 0).length} chunks`);
console.log(`  Token chunking: ${chunkTextByTokens(text800chars, { chunkTokens: 800, overlapTokens: 0 }).length} chunks`);

console.log('800 words:');
console.log(`  Character chunking: ${chunkTextByCharacters(text800tokens, 800, 0).length} chunks`);
console.log(`  Token chunking: ${chunkTextByTokens(text800tokens, { chunkTokens: 800, overlapTokens: 0 }).length} chunks`);
console.log('');

// Test 9: Verify overlap
console.log('📊 TEST 9: Verify Overlap');
console.log('-'.repeat(60));
const overlapTest = chunkTextByTokens(mediumText, { chunkTokens: 50, overlapTokens: 10 });
if (overlapTest.length >= 2) {
    const chunk1 = overlapTest[0].content;
    const chunk2 = overlapTest[1].content;
    const chunk1End = chunk1.slice(-50);
    const chunk2Start = chunk2.slice(0, 50);
    const hasOverlap = chunk2.includes(chunk1End.split(' ').pop() || '');
    console.log(`  Chunk 1 ends with: "...${chunk1End}"`);
    console.log(`  Chunk 2 starts with: "${chunk2Start}..."`);
    console.log(`  Has overlap: ${hasOverlap ? '✓ Yes' : '✗ No'}`);
} else {
    console.log('  Not enough chunks to test overlap');
}
console.log('');

// Test 10: Performance
console.log('📊 TEST 10: Performance');
console.log('-'.repeat(60));
const largeText = longText.repeat(10);
const largeTokens = countTokens(largeText);

console.log(`Large text: ${largeTokens} tokens`);

console.time('  Character chunking');
const charResult = chunkTextByCharacters(largeText, 800, 100);
console.timeEnd('  Character chunking');
console.log(`    → ${charResult.length} chunks`);

console.time('  Token chunking');
const tokenResult = chunkTextByTokens(largeText, { chunkTokens: 800, overlapTokens: 100 });
console.timeEnd('  Token chunking');
console.log(`    → ${tokenResult.length} chunks`);

console.time('  Smart chunking');
const smartResult = chunkTextSmart(largeText, { chunkTokens: 800, overlapTokens: 100 });
console.timeEnd('  Smart chunking');
console.log(`    → ${smartResult.length} chunks`);

console.log('');
console.log('=' .repeat(60));
console.log('✅ ALL TESTS COMPLETED');








