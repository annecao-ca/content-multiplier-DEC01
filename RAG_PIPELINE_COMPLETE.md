# RAG Pipeline - Hoàn chỉnh với Metadata

## 📋 Tổng quan

Pipeline RAG đã được mở rộng với đầy đủ metadata support:
- ✅ Migration SQL cho metadata columns
- ✅ Endpoint `/api/rag/ingest` với metadata
- ✅ Query PostgreSQL với cosine similarity + filters
- ✅ Frontend form với metadata inputs
- ✅ Hiển thị metadata trong UI

---

## 1. Database Schema

### Migration: `010_extend_documents_metadata.sql`

```sql
-- Thêm các cột metadata
ALTER TABLE documents ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS published_date TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author);
CREATE INDEX IF NOT EXISTS idx_documents_published_date ON documents(published_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
```

**Cấu trúc bảng documents:**
- `doc_id` (TEXT, PRIMARY KEY)
- `title` (TEXT)
- `url` (TEXT)
- `raw` (TEXT) - nội dung gốc
- `embedding` (vector(1536)) - document-level embedding
- `author` (TEXT) - tác giả
- `published_date` (TIMESTAMPTZ) - ngày xuất bản
- `tags` (TEXT[]) - mảng tags
- `description` (TEXT) - mô tả
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 2. API Endpoint: POST /api/rag/ingest

### Request Body

```json
{
  "doc_id": "doc-001",
  "raw": "Nội dung tài liệu...",
  "title": "Tiêu đề",
  "url": "https://example.com",
  "author": "John Doe",
  "published_date": "2024-01-15T10:30:00Z",
  "tags": ["marketing", "AI"],
  "description": "Mô tả tài liệu",
  "useTokenChunking": true,
  "createVersion": true
}
```

### Response

```json
{
  "success": true,
  "doc_id": "doc-001",
  "chunks": 5,
  "tokens": 2500,
  "chunkingMethod": "token-based",
  "documentEmbedding": true,
  "isNewVersion": false,
  "message": "Document ingested successfully"
}
```

### Quy trình xử lý:

1. **Validation**: Kiểm tra `doc_id` và `raw` bắt buộc
2. **Date Processing**: Convert `published_date` sang ISO string
3. **Tags Processing**: Convert string/array sang TEXT[]
4. **Chunking**: Chia nhỏ văn bản (token-based hoặc character-based)
5. **Embedding**: 
   - Tạo embeddings cho từng chunk
   - Tạo embedding cho toàn bộ document
6. **Storage**:
   - Lưu document metadata vào `documents`
   - Lưu chunks + embeddings vào `doc_chunks`
   - Lưu document-level embedding vào `documents.embedding`

---

## 3. Query PostgreSQL với Cosine Similarity + Filters

### Query cơ bản:

```sql
SELECT 
    d.doc_id,
    d.title,
    d.author,
    d.published_date,
    d.tags,
    1 - (d.embedding <=> $1::vector(1536)) AS similarity_score
FROM documents d
WHERE 
    d.author = 'John Doe'
    AND d.tags @> ARRAY['marketing']::text[]
    AND d.embedding IS NOT NULL
ORDER BY d.embedding <=> $1::vector(1536) ASC
LIMIT 10;
```

### Query với chunk-level:

```sql
SELECT 
    dc.content,
    1 - (dc.embedding <=> $1::vector) AS score,
    dc.doc_id,
    d.title,
    d.author,
    d.tags
FROM doc_chunks dc
JOIN documents d ON dc.doc_id = d.doc_id
WHERE 
    d.author = 'John Doe'
    AND d.tags @> ARRAY['marketing']::text[]
ORDER BY dc.embedding <=> $1::vector ASC
LIMIT 10;
```

**File đầy đủ**: `query-documents-by-similarity.sql`

---

## 4. Frontend (Next.js)

### Form Upload: `DocumentForm.tsx`

**Input Fields:**
- ✅ Title (required)
- ✅ Author (text input)
- ✅ Published Date (datetime-local)
- ✅ Tags (multi-select với available tags + manual input)
- ✅ Description (textarea)
- ✅ Content/Raw (textarea, required)
- ✅ URL (optional)

**Features:**
- Multi-select tags từ available tags
- Manual tag input
- Date/time picker
- Validation

### Document List: `documents/page.tsx`

**Hiển thị:**
- Stats dashboard (total docs, chunks, authors, tags)
- Document grid với metadata
- Search với filters

### Document Card: `DocumentCard.tsx`

**Hiển thị metadata:**
- Title
- Author (với icon)
- Published date (formatted)
- Tags (badges)
- Description
- URL (external link)
- Created date

---

## 5. Workflow Hoàn chỉnh

### Upload Document

```
User fills form
  ↓
Frontend validates
  ↓
POST /api/rag/ingest
  {
    doc_id, raw, title, url,
    author, published_date, tags, description
  }
  ↓
Backend:
  1. Validate & process metadata
  2. Chunk text (token-based)
  3. Generate embeddings (text-embedding-3-small)
  4. Save to documents table
  5. Save chunks to doc_chunks table
  6. Save document embedding
  ↓
Response: { success, doc_id, chunks, tokens, ... }
  ↓
Frontend: Refresh document list
```

### Search với Filters

```
User enters query + applies filters
  ↓
POST /api/rag/search
  {
    query: "search text",
    topK: 10,
    filters: {
      author: "John Doe",
      tags: ["marketing"]
    }
  }
  ↓
Backend:
  1. Embed query
  2. Vector similarity search
  3. Apply metadata filters
  4. Return top K results
  ↓
Frontend: Display results with scores
```

---

## 6. API Endpoints

### RAG Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/ingest` | POST | Upload document với metadata |
| `/api/rag/documents` | GET | List documents (với filters) |
| `/api/rag/documents/:id` | GET | Get single document |
| `/api/rag/search` | POST | Semantic search với filters |
| `/api/rag/stats` | GET | Statistics |
| `/api/rag/authors` | GET | List authors |
| `/api/rag/tags` | GET | List tags |

---

## 7. Testing

### Test Upload với Metadata

```bash
curl -X POST http://localhost:3001/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-doc-001",
    "raw": "Content about marketing and AI...",
    "title": "Marketing AI Guide",
    "author": "John Doe",
    "published_date": "2024-01-15T10:30:00Z",
    "tags": ["marketing", "AI"],
    "description": "A comprehensive guide"
  }'
```

### Test Search với Filters

```bash
curl -X POST http://localhost:3001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "marketing strategies",
    "topK": 5,
    "filters": {
      "author": "John Doe",
      "tags": ["marketing"]
    }
  }'
```

---

## 8. Files Modified/Created

### Backend
- ✅ `infra/migrations/010_extend_documents_metadata.sql`
- ✅ `apps/api/src/routes/rag.ts` - Updated `/ingest` endpoint
- ✅ `apps/api/src/services/rag.ts` - Updated `upsertDocument`
- ✅ `apps/api/src/services/document-versioning.ts` - Updated metadata handling

### Frontend
- ✅ `apps/web/app/components/DocumentForm.tsx` - Added metadata inputs
- ✅ `apps/web/app/components/DocumentCard.tsx` - Display metadata
- ✅ `apps/web/app/documents/page.tsx` - Updated API calls & display

### Documentation
- ✅ `query-documents-by-similarity.sql` - PostgreSQL queries
- ✅ `RAG_PIPELINE_COMPLETE.md` - This file

---

## 9. Next Steps

1. ✅ Run migration: `psql $DATABASE_URL -f infra/migrations/010_extend_documents_metadata.sql`
2. ✅ Test upload với metadata
3. ✅ Test search với filters
4. ✅ Verify metadata hiển thị trong UI

---

## 10. Notes

- **Embedding Model**: `text-embedding-3-small` (1536 dimensions)
- **Chunking**: Token-based (800 tokens, 50 overlap) hoặc character-based
- **Similarity**: Cosine similarity (1 - distance)
- **Indexes**: GIN index cho tags, B-tree cho author/date, ivfflat cho embedding

