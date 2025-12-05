# EmbeddingClient Guide - Multi-Provider Embeddings

## 📚 Tổng quan

`EmbeddingClient` là một class thống nhất cho phép tạo embeddings từ nhiều nhà cung cấp khác nhau:
- ✅ **OpenAI** - text-embedding-3-small, text-embedding-3-large
- ✅ **Cohere** - embed-english-v3.0, embed-multilingual-v3.0
- ✅ **Hugging Face** - sentence-transformers models

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/api
npm install openai  # Already installed
# Cohere và Hugging Face sử dụng fetch API (built-in)
```

### 2. Set Environment Variables

```env
# .env file
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...
HUGGINGFACE_API_KEY=hf_...

# Choose provider (default: openai)
EMBEDDING_PROVIDER=openai  # or 'cohere' or 'huggingface'
```

### 3. Basic Usage

```typescript
import { EmbeddingClient } from './services/embedding-client.ts';

// Create client
const client = new EmbeddingClient({
  provider: 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
});

// Create embeddings
const result = await client.embed([
  'Machine learning is transforming industries.',
  'Deep learning uses neural networks.',
]);

console.log(result.embeddings); // Array of embedding vectors
```

---

## 📖 Usage Examples

### Example 1: OpenAI Provider

```typescript
import { EmbeddingClient } from './services/embedding-client.ts';

const client = new EmbeddingClient({
  provider: 'openai',
  openai: {
    apiKey: 'sk-your-openai-key',
    defaultModel: 'text-embedding-3-small', // Optional
  },
});

const texts = [
  'Artificial intelligence is the future.',
  'Machine learning enables pattern recognition.',
];

const result = await client.embed(texts);

console.log(`Provider: ${result.provider}`);
console.log(`Model: ${result.model}`);
console.log(`Dimensions: ${result.dimensions}`); // 1536
console.log(`Embeddings: ${result.embeddings.length} vectors`);
```

**Output:**
```
Provider: openai
Model: text-embedding-3-small
Dimensions: 1536
Embeddings: 2 vectors
```

---

### Example 2: Cohere Provider

```typescript
import { EmbeddingClient } from './services/embedding-client.ts';

const client = new EmbeddingClient({
  provider: 'cohere',
  cohere: {
    apiKey: 'your-cohere-key',
    defaultModel: 'embed-english-v3.0', // Optional
  },
});

const texts = [
  'Natural language processing helps computers understand text.',
  'Computer vision enables image recognition.',
];

const result = await client.embed(texts);

console.log(`Provider: ${result.provider}`);
console.log(`Dimensions: ${result.dimensions}`); // 1024
```

**Available Cohere Models:**
- `embed-english-v3.0` (1024 dims)
- `embed-english-light-v3.0` (384 dims)
- `embed-multilingual-v3.0` (1024 dims)
- `embed-multilingual-light-v3.0` (384 dims)

---

### Example 3: Hugging Face Provider

```typescript
import { EmbeddingClient } from './services/embedding-client.ts';

const client = new EmbeddingClient({
  provider: 'huggingface',
  huggingface: {
    apiKey: 'hf_your-token',
    defaultModel: 'sentence-transformers/all-MiniLM-L6-v2', // Optional
  },
});

const texts = [
  'AI is transforming industries worldwide.',
  'Deep learning powers modern AI applications.',
];

const result = await client.embed(texts);

console.log(`Provider: ${result.provider}`);
console.log(`Dimensions: ${result.dimensions}`); // 384
```

**Available Hugging Face Models:**
- `sentence-transformers/all-MiniLM-L6-v2` (384 dims)
- `sentence-transformers/all-mpnet-base-v2` (768 dims)
- `intfloat/multilingual-e5-base` (768 dims)
- `BAAI/bge-large-en-v1.5` (1024 dims)

---

### Example 4: Factory Function (Simple)

```typescript
import { createEmbeddingClient } from './services/embedding-client.ts';

// Quick creation
const client = createEmbeddingClient(
  'openai',
  process.env.OPENAI_API_KEY || '',
  'text-embedding-3-small' // Optional model
);

const result = await client.embed(['Simple text embedding.']);
```

---

### Example 5: From Environment Variables

```typescript
import { createEmbeddingClientFromEnv } from './services/embedding-client.ts';

// Reads from environment:
// - EMBEDDING_PROVIDER (default: 'openai')
// - OPENAI_API_KEY, COHERE_API_KEY, HUGGINGFACE_API_KEY
// - EMBEDDING_MODEL, COHERE_EMBEDDING_MODEL, etc.

const client = createEmbeddingClientFromEnv();
const result = await client.embed(['Text from environment config.']);
```

---

### Example 6: Custom Model Override

```typescript
const client = new EmbeddingClient({
  provider: 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'text-embedding-3-small',
  },
});

// Override default model for this call
const result = await client.embed(
  ['Using large model for this embedding.'],
  'text-embedding-3-large' // Override
);

console.log(`Dimensions: ${result.dimensions}`); // 3072 (large model)
```

---

### Example 7: Batch Processing

```typescript
const client = new EmbeddingClient({
  provider: 'openai',
  openai: { apiKey: process.env.OPENAI_API_KEY || '' },
});

// Process multiple texts at once
const texts = [
  'Document 1 about machine learning.',
  'Document 2 about deep learning.',
  'Document 3 about neural networks.',
  // ... more documents
];

const result = await client.embed(texts);
// All embeddings created in one API call (more efficient)
```

---

### Example 8: Switching Providers

```typescript
// Same interface, different providers
const providers = ['openai', 'cohere', 'huggingface'];

for (const provider of providers) {
  const client = new EmbeddingClient({
    provider: provider as any,
    openai: provider === 'openai' ? { apiKey: '...' } : undefined,
    cohere: provider === 'cohere' ? { apiKey: '...' } : undefined,
    huggingface: provider === 'huggingface' ? { apiKey: '...' } : undefined,
  });
  
  const result = await client.embed(['Same text, different provider.']);
  console.log(`${provider}: ${result.dimensions} dimensions`);
}
```

---

### Example 9: Integration with RAG System

```typescript
import { EmbeddingClient } from './services/embedding-client.ts';
import { upsertDocument } from './services/rag.ts';

// Create embedding client
const embeddingClient = new EmbeddingClient({
  provider: 'openai',
  openai: { apiKey: process.env.OPENAI_API_KEY || '' },
});

// Wrapper function for RAG system
async function embedForRAG(texts: string[]): Promise<number[][]> {
  const result = await embeddingClient.embed(texts);
  return result.embeddings;
}

// Use in RAG system
await upsertDocument(
  {
    doc_id: 'doc-123',
    title: 'My Document',
    raw: 'Content here...',
  },
  embedForRAG, // Pass embedding function
  true // Use token chunking
);
```

---

## 🔧 API Reference

### EmbeddingClient Class

```typescript
class EmbeddingClient {
  constructor(config: EmbeddingClientConfig);
  
  // Create embeddings
  embed(texts: string[], model?: string): Promise<EmbeddingResult>;
  
  // Get provider info
  getProvider(): EmbeddingProvider;
  getProviderType(): ProviderType;
  getDimensions(model?: string): number;
}
```

### EmbeddingResult Interface

```typescript
interface EmbeddingResult {
  embeddings: number[][];  // Array of embedding vectors
  provider: string;        // 'openai' | 'cohere' | 'huggingface'
  model: string;          // Model name used
  dimensions: number;     // Embedding dimensions
  tokens?: number;        // Tokens processed (if available)
}
```

### EmbeddingClientConfig

```typescript
interface EmbeddingClientConfig {
  provider: 'openai' | 'cohere' | 'huggingface';
  openai?: OpenAIProviderConfig;
  cohere?: CohereProviderConfig;
  huggingface?: HuggingFaceProviderConfig;
}
```

---

## 📊 Provider Comparison

| Provider | Default Model | Dimensions | Cost | Speed | Best For |
|----------|---------------|------------|------|-------|----------|
| **OpenAI** | text-embedding-3-small | 1536 | $$ | Fast | General purpose, high quality |
| **Cohere** | embed-english-v3.0 | 1024 | $$ | Fast | Multilingual, semantic search |
| **Hugging Face** | all-MiniLM-L6-v2 | 384 | Free/$$ | Medium | Open source, cost-effective |

---

## 🎯 Use Cases

### 1. Cost Optimization
```typescript
// Use Hugging Face for development (free tier)
const devClient = new EmbeddingClient({
  provider: 'huggingface',
  huggingface: { apiKey: 'hf_...' },
});

// Use OpenAI for production (better quality)
const prodClient = new EmbeddingClient({
  provider: 'openai',
  openai: { apiKey: 'sk-...' },
});
```

### 2. Multilingual Support
```typescript
// Cohere multilingual model
const client = new EmbeddingClient({
  provider: 'cohere',
  cohere: {
    apiKey: '...',
    defaultModel: 'embed-multilingual-v3.0',
  },
});
```

### 3. High-Dimensional Embeddings
```typescript
// OpenAI large model (3072 dimensions)
const client = new EmbeddingClient({
  provider: 'openai',
  openai: {
    apiKey: '...',
    defaultModel: 'text-embedding-3-large',
  },
});
```

---

## 🧪 Testing

### Run Examples

```bash
cd apps/api
tsx src/services/embedding-examples.ts
```

### Test Individual Provider

```typescript
import { exampleOpenAI } from './services/embedding-examples.ts';

await exampleOpenAI();
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Provider selection
EMBEDDING_PROVIDER=openai  # or 'cohere' or 'huggingface'

# OpenAI
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small

# Cohere
COHERE_API_KEY=...
COHERE_EMBEDDING_MODEL=embed-english-v3.0

# Hugging Face
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

## 🐛 Troubleshooting

### Issue: "API key is required"
**Solution:** Set environment variable or pass in config

### Issue: "Unsupported provider"
**Solution:** Use 'openai', 'cohere', or 'huggingface'

### Issue: Different dimensions
**Solution:** Each provider has different dimensions. Make sure your database vector column matches.

### Issue: Rate limiting
**Solution:** Add retry logic or use different provider

---

## 📚 More Examples

See `apps/api/src/services/embedding-examples.ts` for complete examples:
- OpenAI usage
- Cohere usage
- Hugging Face usage
- Factory functions
- Batch processing
- Provider switching
- RAG integration

---

## ✅ Summary

✅ **Multi-provider support** - OpenAI, Cohere, Hugging Face
✅ **Unified interface** - Same API for all providers
✅ **Flexible configuration** - Environment or explicit config
✅ **Model override** - Use different models per call
✅ **Production ready** - Error handling, type safety
✅ **Well documented** - Complete examples and guides

**Ready to use!** 🚀








