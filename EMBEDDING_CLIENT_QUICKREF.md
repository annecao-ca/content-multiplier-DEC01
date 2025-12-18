# EmbeddingClient - Quick Reference Card ⚡

## 🚀 30-Second Start

```typescript
import { EmbeddingClient } from './services/embedding-client.ts';

const client = new EmbeddingClient({
  provider: 'openai',
  openai: { apiKey: process.env.OPENAI_API_KEY || '' },
});

const result = await client.embed(['Your text here']);
console.log(result.embeddings); // Array of vectors
```

---

## 📝 Code Examples

### OpenAI
```typescript
const client = new EmbeddingClient({
  provider: 'openai',
  openai: { apiKey: 'sk-...' },
});
const result = await client.embed(['Text']);
// → 1536 dimensions (text-embedding-3-small)
```

### Cohere
```typescript
const client = new EmbeddingClient({
  provider: 'cohere',
  cohere: { apiKey: '...' },
});
const result = await client.embed(['Text']);
// → 1024 dimensions (embed-english-v3.0)
```

### Hugging Face
```typescript
const client = new EmbeddingClient({
  provider: 'huggingface',
  huggingface: { apiKey: 'hf_...' },
});
const result = await client.embed(['Text']);
// → 384 dimensions (all-MiniLM-L6-v2)
```

---

## 🔧 Factory Functions

```typescript
// Quick create
import { createEmbeddingClient } from './services/embedding-client.ts';
const client = createEmbeddingClient('openai', 'sk-...');

// From environment
import { createEmbeddingClientFromEnv } from './services/embedding-client.ts';
const client = createEmbeddingClientFromEnv();
```

---

## 📊 Model Override

```typescript
// Override default model
const result = await client.embed(
  ['Text'],
  'text-embedding-3-large' // Override
);
// → 3072 dimensions
```

---

## 🧪 Test

```bash
cd apps/api
tsx src/services/test-embedding-client.ts
```

---

## 📚 Full Docs

- **Guide**: `EMBEDDING_CLIENT_GUIDE.md`
- **Examples**: `apps/api/src/services/embedding-examples.ts`
- **Summary**: `EMBEDDING_CLIENT_SUMMARY.md`

---

## ✅ Done!

**3 providers, 1 interface, unlimited possibilities!** 🎉
























