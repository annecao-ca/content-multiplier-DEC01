# Token-Based Chunking - Quick Start ⚡

## 🚀 5-Minute Setup

### 1. Install Dependencies (Done ✅)
```bash
cd apps/api
npm install tiktoken  # Already installed
```

### 2. Start Services
```bash
# Terminal 1: API
cd apps/api
npm run dev

# Terminal 2: Web (optional)
cd apps/web
npm run dev
```

---

## 🧪 Test Immediately

### Test 1: Run Unit Tests (30 seconds)
```bash
cd apps/api
tsx src/services/test-chunking.ts
```

**Expected output:**
```
🧪 TOKEN-BASED CHUNKING TESTS
============================================================
📊 TEST 1: Count Tokens
Long text tokens: 356

📊 TEST 3: Token-based Chunking
Chunks created: 3
  Chunk 0: Tokens: 200 (0-200)
  ...

✅ ALL TESTS COMPLETED
```

### Test 2: Upload Document (1 minute)
```bash
curl -X POST http://localhost:8080/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "quick-test",
    "title": "Token Chunking Test",
    "raw": "Artificial intelligence is transforming industries. Machine learning enables systems to learn from data. Deep learning uses neural networks for complex tasks. Natural language processing helps computers understand human language. Computer vision allows machines to interpret visual information. AI applications span healthcare, finance, retail, and more.",
    "useTokenChunking": true
  }'
```

**Expected response:**
```json
{
  "doc_id": "quick-test",
  "chunks": 1,
  "tokens": 67,
  "chunkingMethod": "token-based"
}
```

✅ **Success!** Token chunking is working!

### Test 3: Verify Chunks
```bash
# Check database
psql -U postgres -d content_multiplier -c "
SELECT 
  chunk_id,
  LENGTH(content) as chars,
  LEFT(content, 80) as preview
FROM doc_chunks
WHERE doc_id = 'quick-test';
"
```

---

## 📝 Usage in Your Code

### Basic Import
```typescript
import { chunkTextByTokens } from './services/chunking.ts';
```

### Quick Example
```typescript
const text = "Your long text here...";

// Simple chunking
const chunks = chunkTextByTokens(text, {
  chunkTokens: 800,
  overlapTokens: 50
});

console.log(`Created ${chunks.length} chunks`);
chunks.forEach(chunk => {
  console.log(`Chunk ${chunk.index}: ${chunk.tokenCount} tokens`);
});
```

---

## 🎯 Common Use Cases

### Case 1: Upload Document with Token Chunking (Default)
```bash
curl -X POST http://localhost:8080/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "my-doc",
    "title": "My Document",
    "raw": "Content here...",
    "useTokenChunking": true
  }'
```

### Case 2: Count Tokens Before Upload
```typescript
import { countTokens, estimateChunkCount } from './services/chunking.ts';

const text = "...";
const tokens = countTokens(text);
const chunks = estimateChunkCount(text, 800, 50);

console.log(`Text has ${tokens} tokens`);
console.log(`Will create ~${chunks} chunks`);
```

### Case 3: Custom Chunk Sizes
```typescript
// Small chunks (precise search)
chunkTextByTokens(text, { chunkTokens: 400, overlapTokens: 50 });

// Large chunks (more context)
chunkTextByTokens(text, { chunkTokens: 1200, overlapTokens: 100 });
```

### Case 4: Smart Chunking (Sentence Boundaries)
```typescript
import { chunkTextSmart } from './services/chunking.ts';

const chunks = chunkTextSmart(text, {
  chunkTokens: 800,
  overlapTokens: 50
});
// Breaks at sentence boundaries when possible
```

---

## 📊 Quick Comparison

### Test Both Methods
```bash
# Run comparison test
./test-token-chunking.sh
```

**Output shows:**
```
Token-based:
  • Chunks: 3
  • Tokens: 2150
  • Method: token-based

Character-based:
  • Chunks: 7
  • Method: character-based

✅ Token-based created FEWER chunks (more efficient)
```

---

## 🔧 Configuration Options

### Default (Recommended)
```typescript
{
  chunkTokens: 800,
  overlapTokens: 50,
  model: 'text-embedding-3-small'
}
```

### For Q&A Systems
```typescript
{
  chunkTokens: 400,
  overlapTokens: 50
}
```

### For Long Documents
```typescript
{
  chunkTokens: 1200,
  overlapTokens: 100
}
```

---

## ✅ Verify It's Working

### Check 1: API Response
```bash
curl -X POST http://localhost:8080/rag/documents \
  -d '{"doc_id":"test","title":"Test","raw":"Hello world"}' \
  | jq '.chunkingMethod'

# Should output: "token-based"
```

### Check 2: Console Logs
Look for in API terminal:
```
[RAG] Token-based chunking: 1 chunks, 3 tokens
```

### Check 3: Search Quality
```bash
curl -X POST http://localhost:8080/rag/search \
  -d '{"query":"your query","topK":3}' \
  | jq '.[] | .score'

# Higher scores = better chunking
```

---

## 🐛 Quick Troubleshooting

### Problem: "Cannot find module 'tiktoken'"
```bash
cd apps/api
npm install tiktoken
```

### Problem: Chunking fails
Check console for errors. Fallback to character-based:
```typescript
await upsertDocument(doc, llm.embed, false);
```

### Problem: Too many chunks
Increase chunk size:
```typescript
{ chunkTokens: 1200 }
```

### Problem: Too few chunks
Decrease chunk size:
```typescript
{ chunkTokens: 400 }
```

---

## 📚 Learn More

- **Complete Guide**: `TOKEN_CHUNKING_GUIDE.md`
- **Implementation Details**: `TOKEN_CHUNKING_SUMMARY.md`
- **Source Code**: `apps/api/src/services/chunking.ts`
- **Tests**: `apps/api/src/services/test-chunking.ts`

---

## 💡 Pro Tips

1. **Use Token Chunking by Default**
   - More accurate
   - Better search results
   - Aligned with API costs

2. **Adjust Chunk Size by Content**
   - Short docs (articles): 400-600 tokens
   - Long docs (books): 800-1200 tokens
   - Code: 600-800 tokens

3. **Keep Some Overlap**
   - 50-100 tokens recommended
   - Prevents context loss
   - Better search continuity

4. **Monitor Token Usage**
   ```typescript
   const tokens = countTokens(text);
   console.log(`This will cost ~${tokens * 0.00001}¢`);
   ```

5. **Test with Your Data**
   ```bash
   tsx src/services/test-chunking.ts
   ```

---

## 🎉 You're Ready!

Token-based chunking is now active. All new documents will automatically use it for better RAG quality! 🚀

**Next Steps:**
1. Upload some real documents
2. Test search quality
3. Adjust chunk sizes if needed
4. Enjoy better RAG results!

---

## 🆘 Need Help?

- Check `TOKEN_CHUNKING_GUIDE.md` for detailed docs
- Run tests to verify: `tsx src/services/test-chunking.ts`
- Check console logs for errors
- Verify tiktoken is installed: `npm list tiktoken`





























