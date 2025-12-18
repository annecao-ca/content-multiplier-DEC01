# Token-Based Chunking Guide

## 📚 Tổng quan

Hệ thống đã được nâng cấp từ **character-based chunking** lên **token-based chunking** để cải thiện chất lượng embedding và tìm kiếm.

### Tại sao Token-based?

**Character-based problems:**
```
"Hello world" = 11 characters
"你好世界" = 4 characters

→ Không công bằng với các ngôn ngữ khác
→ Không reflect actual cost (OpenAI tính theo tokens)
→ Có thể cắt giữa từ/câu
```

**Token-based benefits:**
```
"Hello world" ≈ 2-3 tokens
"你好世界" ≈ 4-6 tokens

✅ Công bằng hơn giữa các ngôn ngữ
✅ Chính xác với OpenAI pricing
✅ Cắt theo semantic units (từ/câu)
```

---

## 🔧 Implementation

### 1. Basic Token Chunking

```typescript
import { chunkTextByTokens } from './services/chunking.ts';

const chunks = chunkTextByTokens(text, {
  chunkTokens: 800,    // ~800 tokens per chunk
  overlapTokens: 50,   // ~50 tokens overlap
  model: 'text-embedding-3-small'
});

// Result:
[
  {
    content: "...",
    index: 0,
    startToken: 0,
    endToken: 800,
    tokenCount: 800
  },
  {
    content: "...",
    index: 1,
    startToken: 750,    // Overlap: 800 - 50 = 750
    endToken: 1550,
    tokenCount: 800
  }
]
```

### 2. Smart Chunking (Sentence Boundaries)

```typescript
import { chunkTextSmart } from './services/chunking.ts';

// Tries to break at sentence boundaries
const chunks = chunkTextSmart(text, {
  chunkTokens: 800,
  overlapTokens: 50
});

// More natural breaks, better semantic preservation
```

### 3. Count Tokens

```typescript
import { countTokens } from './services/chunking.ts';

const tokens = countTokens("Your text here");
console.log(`This text has ${tokens} tokens`);
```

### 4. Estimate Chunk Count

```typescript
import { estimateChunkCount } from './services/chunking.ts';

const estimated = estimateChunkCount(text, 800, 50);
console.log(`Will create approximately ${estimated} chunks`);
```

---

## 🎯 Chunking Strategies

### Strategy 1: Fixed Size (Default)
```typescript
chunkTextByTokens(text, {
  chunkTokens: 800,
  overlapTokens: 50
});
```
- **Pros**: Consistent size, predictable costs
- **Cons**: May break mid-sentence
- **Use case**: Large documents, consistent processing

### Strategy 2: Smart (Sentence-aware)
```typescript
chunkTextSmart(text, {
  chunkTokens: 800,
  overlapTokens: 50
});
```
- **Pros**: Natural breaks, better context
- **Cons**: Variable chunk sizes
- **Use case**: Articles, blog posts, documentation

### Strategy 3: Small Chunks (High Precision)
```typescript
chunkTextByTokens(text, {
  chunkTokens: 400,
  overlapTokens: 50
});
```
- **Pros**: More precise search results
- **Cons**: More chunks = higher costs
- **Use case**: Q&A systems, fact retrieval

### Strategy 4: Large Chunks (Context)
```typescript
chunkTextByTokens(text, {
  chunkTokens: 1500,
  overlapTokens: 100
});
```
- **Pros**: More context per chunk
- **Cons**: Less precise, higher embedding cost per chunk
- **Use case**: Summarization, context-heavy tasks

---

## 📊 Comparison

### Character-based vs Token-based

| Aspect | Character-based | Token-based |
|--------|----------------|-------------|
| **Accuracy** | ❌ Varies by language | ✅ Consistent |
| **Cost Alignment** | ❌ Not aligned with API | ✅ Matches OpenAI |
| **Semantic** | ❌ May split words | ✅ Respects tokens |
| **Performance** | ✅ Fast | ⚠️ Slightly slower |
| **Setup** | ✅ No deps | ⚠️ Requires tiktoken |

### Chunking Parameters

| Chunk Size | Overlap | Chunks (for 2000 token text) | Use Case |
|------------|---------|------------------------------|----------|
| 400 | 50 | ~6 chunks | High precision |
| 800 | 50 | ~3 chunks | **Recommended** |
| 1500 | 100 | ~2 chunks | High context |

---

## 🚀 Usage in RAG System

### API Level

```typescript
// In rag.ts
await upsertDocument(
  {
    doc_id: 'doc-123',
    title: 'My Document',
    raw: 'Long text content...',
    // ... other metadata
  },
  llm.embed,
  true  // ← Enable token-based chunking
);
```

### Automatic Usage

Token-based chunking is **enabled by default** in the updated system:

```typescript
// Default behavior (token-based)
await upsertDocument(doc, llm.embed);

// Explicitly use character-based (legacy)
await upsertDocument(doc, llm.embed, false);
```

---

## 🧪 Testing

### Run Tests

```bash
cd apps/api
tsx src/services/test-chunking.ts
```

### Test Output Example

```
📊 TEST 1: Count Tokens
------------------------------------------------------------
Short text tokens: 8
Medium text tokens: 87
Long text tokens: 356

📊 TEST 2: Character-based Chunking (Legacy)
------------------------------------------------------------
Chunks created: 6
  Chunk 0: 500 chars - "Artificial intelligence (AI) is transforming..."
  ...

📊 TEST 3: Token-based Chunking
------------------------------------------------------------
Chunks created: 3
  Chunk 0:
    Tokens: 200 (0-200)
    Content: "Artificial intelligence (AI) is transforming industries worldwide..."
  ...
```

---

## 📈 Performance Considerations

### Token Counting Speed

```typescript
// Fast: ~1ms for 1000 tokens
countTokens(shortText);

// Medium: ~5ms for 10,000 tokens  
countTokens(mediumText);

// Slower: ~50ms for 100,000 tokens
countTokens(veryLongText);
```

### Chunking Speed

For a 2000-token document:
- Character chunking: ~1ms
- Token chunking: ~5ms
- Smart chunking: ~10ms

**Recommendation**: Token-based is worth the slight overhead for better quality.

---

## 🔄 Migration Guide

### For Existing Documents

```bash
# Option 1: Keep old chunks (no action needed)
# System works with both character and token chunks

# Option 2: Re-chunk existing documents
curl -X POST http://localhost:8080/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "existing-doc-id",
    "title": "...",
    "raw": "...",
    ...
  }'
# This will delete old chunks and create new token-based chunks
```

### Code Migration

**Before:**
```typescript
const chunks = splitText(text, 800, 100);
```

**After:**
```typescript
const chunks = smartChunk(text, {
  chunkTokens: 800,
  overlapTokens: 50
});
```

---

## ⚙️ Configuration

### Environment Variables

```env
# In apps/api/.env
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_TOKENS=800
OVERLAP_TOKENS=50
USE_TOKEN_CHUNKING=true
```

### Default Settings

```typescript
// Default configuration
{
  chunkTokens: 800,      // ~800 tokens per chunk
  overlapTokens: 50,     // ~50 tokens overlap (6.25%)
  model: 'text-embedding-3-small'
}
```

### Recommended Settings by Use Case

**Q&A System:**
```typescript
{ chunkTokens: 400, overlapTokens: 50 }
```

**General RAG (Default):**
```typescript
{ chunkTokens: 800, overlapTokens: 50 }
```

**Long-form Content:**
```typescript
{ chunkTokens: 1200, overlapTokens: 100 }
```

**Multi-language:**
```typescript
{ chunkTokens: 600, overlapTokens: 60 }
```

---

## 🎓 How It Works

### Token Encoding Process

```
Text: "Hello world! How are you?"
  ↓
Tokenize using tiktoken
  ↓
Tokens: [9906, 1917, 0, 2650, 527, 499, 30]
  ↓
Split into chunks (e.g., 3 tokens per chunk with 1 overlap)
  ↓
Chunk 1: [9906, 1917, 0]       → "Hello world!"
Chunk 2: [0, 2650, 527]         → "! How are"
Chunk 3: [527, 499, 30]         → "are you?"
  ↓
Decode back to text
```

### Overlap Mechanism

```
Chunk 1: tokens 0-800
Chunk 2: tokens 750-1550  (overlap: 750-800)
Chunk 3: tokens 1500-2300 (overlap: 1500-1550)
```

Overlap ensures context continuity between chunks.

---

## 📚 API Reference

### `chunkTextByTokens(text, config)`

**Parameters:**
- `text: string` - Input text to chunk
- `config.chunkTokens?: number` - Target chunk size (default: 800)
- `config.overlapTokens?: number` - Overlap size (default: 50)
- `config.model?: string` - Model for tokenization (default: 'text-embedding-3-small')

**Returns:** `TextChunk[]`

### `chunkTextSmart(text, config)`

Smart chunking with sentence boundary detection.

### `countTokens(text, model)`

Count tokens in text.

### `estimateChunkCount(text, chunkTokens, overlapTokens)`

Estimate number of chunks without actually chunking.

---

## ✅ Best Practices

1. **Use Token-based by Default**
   - More accurate
   - Better alignment with API costs
   - Better semantic preservation

2. **Choose Appropriate Chunk Size**
   - 400-800 tokens for most cases
   - Smaller for precise retrieval
   - Larger for context-heavy tasks

3. **Use Overlap**
   - 50-100 tokens recommended
   - Prevents information loss at boundaries

4. **Consider Smart Chunking**
   - For human-written content
   - Better readability
   - More natural context

5. **Test with Your Data**
   - Different content types may need different settings
   - Use the test script to evaluate

---

## 🐛 Troubleshooting

### Issue: Chunking fails
**Solution:** Check tiktoken is installed:
```bash
npm install tiktoken
```

### Issue: Too many chunks
**Solution:** Increase `chunkTokens`:
```typescript
{ chunkTokens: 1200, overlapTokens: 100 }
```

### Issue: Missing context
**Solution:** Increase overlap:
```typescript
{ chunkTokens: 800, overlapTokens: 100 }
```

### Issue: Slow performance
**Solution:** Use character-based for very large texts:
```typescript
await upsertDocument(doc, llm.embed, false);
```

---

## 🎉 Summary

✅ **Token-based chunking implemented**
✅ **Smart chunking with sentence boundaries**
✅ **Backward compatible with character-based**
✅ **Configurable chunk sizes and overlap**
✅ **Testing suite included**
✅ **Production-ready**

**Recommendation:** Use token-based chunking (default) for all new documents!
























