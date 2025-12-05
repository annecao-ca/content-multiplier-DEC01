# RAG Pipeline Setup Guide - Hoàn chỉnh

## 🚀 Quick Start

### 1. Database Setup

```bash
# Chạy migrations
psql $DATABASE_URL -f infra/migrations/001_init.sql
psql $DATABASE_URL -f infra/migrations/007_extend_documents.sql
psql $DATABASE_URL -f infra/migrations/009_add_vector_to_documents.sql
psql $DATABASE_URL -f infra/migrations/010_extend_documents_metadata.sql
```

Hoặc nếu dùng Docker:
```bash
docker exec -i infra-db-1 psql -U cm -d cm < infra/migrations/010_extend_documents_metadata.sql
```

### 2. Backend Setup

```bash
cd apps/api
npm install
npm run dev
```

Backend sẽ chạy trên `http://localhost:3001`

### 3. Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

Frontend sẽ chạy trên `http://localhost:3000`

### 4. Test Pipeline

```bash
# Chạy test script
./test-rag-pipeline.sh
```

---

## 📊 Database Schema

### Bảng `documents`

```sql
CREATE TABLE documents (
  doc_id TEXT PRIMARY KEY,
  title TEXT,
  url TEXT,
  raw TEXT,
  embedding vector(1536),        -- Document-level embedding
  author TEXT,                   -- ✅ Metadata
  published_date TIMESTAMPTZ,    -- ✅ Metadata
  tags TEXT[],                   -- ✅ Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes

```sql
-- Vector similarity search
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);

-- Metadata filters
CREATE INDEX idx_documents_author ON documents(author);
CREATE INDEX idx_documents_published_date ON documents(published_date);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
```

---

## 🔌 API Endpoints

### POST /api/rag/ingest

**Upload document với metadata**

```bash
curl -X POST http://localhost:3001/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "doc-001",
    "raw": "Content here...",
    "title": "Title",
    "author": "John Doe",
    "published_date": "2024-01-15T10:30:00Z",
    "tags": ["marketing", "AI"],
    "description": "Description"
  }'
```

### POST /api/rag/search

**Semantic search với filters**

```bash
curl -X POST http://localhost:3001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "marketing strategies",
    "topK": 10,
    "searchType": "chunks",
    "filters": {
      "author": "John Doe",
      "tags": ["marketing"]
    }
  }'
```

**Search Types:**
- `chunks` (default): Search trong document chunks (chi tiết hơn)
- `documents`: Search ở document level (nhanh hơn)

### GET /api/rag/documents

**List documents với filters**

```bash
curl "http://localhost:3001/api/rag/documents?author=John%20Doe&tags=marketing"
```

---

## 🎨 Frontend Usage

### Upload Document

1. Navigate to `http://localhost:3000/documents`
2. Click "Thêm tài liệu"
3. Fill form:
   - Title (required)
   - Author (optional)
   - Published Date (datetime picker)
   - Tags (multi-select hoặc manual input)
   - Description (optional)
   - Content (required)
4. Submit → Document được ingest với metadata

### Search với Filters

1. Go to "Tìm kiếm thông minh" tab
2. Enter search query
3. Click "Filters" để mở filter panel
4. Select:
   - Author (dropdown)
   - Tags (multi-select)
   - Date range
5. Click "Tìm kiếm"

---

## 📝 Example Queries

### Query 1: Tìm documents của author cụ thể

```sql
SELECT 
    doc_id, title, author, tags,
    1 - (embedding <=> $1::vector(1536)) AS similarity
FROM documents
WHERE 
    author = 'John Doe'
    AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector(1536) ASC
LIMIT 10;
```

### Query 2: Tìm documents với tags

```sql
SELECT 
    doc_id, title, tags,
    1 - (embedding <=> $1::vector(1536)) AS similarity
FROM documents
WHERE 
    tags @> ARRAY['marketing']::text[]
    AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector(1536) ASC
LIMIT 10;
```

### Query 3: Combined filters

```sql
SELECT 
    doc_id, title, author, tags, published_date,
    1 - (embedding <=> $1::vector(1536)) AS similarity
FROM documents
WHERE 
    author = 'John Doe'
    AND tags @> ARRAY['marketing']::text[]
    AND published_date >= '2024-01-01'::TIMESTAMPTZ
    AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector(1536) ASC
LIMIT 10;
```

Xem file `query-documents-by-similarity.sql` để biết thêm chi tiết.

---

## ✅ Checklist

- [x] Migration SQL cho metadata columns
- [x] Endpoint `/api/rag/ingest` với metadata
- [x] Query PostgreSQL với cosine similarity + filters
- [x] Frontend form với metadata inputs
- [x] Hiển thị metadata trong UI
- [x] Document-level search function
- [x] Test script
- [x] Documentation

---

## 🐛 Troubleshooting

### Backend không chạy
```bash
# Kiểm tra port 3001
lsof -ti:3001

# Khởi động backend
cd apps/api && npm run dev
```

### Migration errors
```bash
# Kiểm tra pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Chạy lại migration
psql $DATABASE_URL -f infra/migrations/010_extend_documents_metadata.sql
```

### Embedding errors
```bash
# Kiểm tra OPENAI_API_KEY
echo $OPENAI_API_KEY

# Test embedding
curl -X POST http://localhost:3001/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{"doc_id":"test","raw":"test content"}'
```

---

## 📚 Additional Resources

- `RAG_PIPELINE_COMPLETE.md` - Chi tiết implementation
- `query-documents-by-similarity.sql` - PostgreSQL queries
- `test-rag-pipeline.sh` - Test script
- `CITATION_VALIDATOR_GUIDE.md` - Citation validation

