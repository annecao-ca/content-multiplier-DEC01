# Document Management System - Hướng dẫn đầy đủ

## 📚 Tổng quan

Hệ thống quản lý tài liệu RAG (Retrieval-Augmented Generation) với các tính năng:
- ✅ Upload tài liệu với metadata đầy đủ (author, published_date, tags)
- ✅ Tự động chunking và vector embeddings
- ✅ Tìm kiếm similarity search thông minh
- ✅ Lọc kết quả theo tác giả và chủ đề
- ✅ Giao diện quản lý trực quan

---

## 🗄️ Database Schema

### Migration 007: Extend Documents Table

```sql
ALTER TABLE documents 
ADD COLUMN author TEXT,
ADD COLUMN published_date DATE,
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN description TEXT,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Indexes for performance
CREATE INDEX idx_documents_author ON documents(author);
CREATE INDEX idx_documents_published_date ON documents(published_date);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
```

**Cấu trúc bảng documents hiện tại:**
- `doc_id` (PRIMARY KEY) - ID tài liệu
- `title` - Tiêu đề
- `url` - URL nguồn
- `raw` - Nội dung gốc
- `author` ✨ NEW - Tác giả
- `published_date` ✨ NEW - Ngày xuất bản
- `tags` ✨ NEW - Mảng chủ đề
- `description` ✨ NEW - Mô tả ngắn
- `created_at` - Ngày tạo
- `updated_at` ✨ NEW - Ngày cập nhật

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:8080/rag
```

### 1. Tạo/Cập nhật tài liệu
```http
POST /rag/documents
Content-Type: application/json

{
  "doc_id": "doc-123",
  "title": "Machine Learning Basics",
  "author": "John Doe",
  "published_date": "2024-01-15",
  "tags": ["AI", "Machine Learning", "Tutorial"],
  "description": "Introduction to ML concepts",
  "raw": "Content here...",
  "url": "https://example.com/ml-basics"
}
```

**Response:**
```json
{
  "doc_id": "doc-123",
  "chunks": 5
}
```

### 2. Lấy danh sách tài liệu
```http
GET /rag/documents

# Với filters
GET /rag/documents?author=John%20Doe&tags=AI&tags=ML
```

**Response:**
```json
[
  {
    "doc_id": "doc-123",
    "title": "Machine Learning Basics",
    "author": "John Doe",
    "published_date": "2024-01-15",
    "tags": ["AI", "Machine Learning"],
    "url": "https://example.com/ml-basics",
    "description": "...",
    "created_at": "2024-12-02T10:00:00Z",
    "updated_at": "2024-12-02T10:00:00Z"
  }
]
```

### 3. Lấy chi tiết tài liệu
```http
GET /rag/documents/:doc_id
```

### 4. Xóa tài liệu
```http
DELETE /rag/documents/:doc_id
```

### 5. Tìm kiếm similarity search
```http
POST /rag/search
Content-Type: application/json

{
  "query": "How does machine learning work?",
  "topK": 5,
  "filters": {
    "author": "John Doe",
    "tags": ["AI", "Tutorial"],
    "published_after": "2024-01-01",
    "published_before": "2024-12-31"
  }
}
```

**Response:**
```json
[
  {
    "content": "Chunk of text matching the query...",
    "score": 0.87,
    "doc_id": "doc-123",
    "title": "Machine Learning Basics",
    "author": "John Doe",
    "published_date": "2024-01-15",
    "tags": ["AI", "Machine Learning"],
    "url": "https://example.com/ml-basics"
  }
]
```

### 6. Thống kê
```http
GET /rag/stats
```

**Response:**
```json
{
  "total_documents": 42,
  "total_chunks": 315,
  "unique_authors": 8,
  "all_tags": ["AI", "ML", "Tutorial", "Research"]
}
```

### 7. Lấy danh sách tác giả
```http
GET /rag/authors
```

### 8. Lấy danh sách tags
```http
GET /rag/tags
```

---

## 💻 Frontend Components

### 1. DocumentForm
Form tạo/chỉnh sửa tài liệu với đầy đủ metadata.

**Usage:**
```tsx
import { DocumentForm } from '@/app/components/DocumentForm'

<DocumentForm
  mode="create"
  onSubmit={async (data) => {
    await fetch('/api/rag/documents', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }}
/>
```

**Fields:**
- Tiêu đề * (required)
- Tác giả
- Ngày xuất bản
- URL nguồn
- Tags (multiple)
- Mô tả
- Nội dung * (required)

### 2. DocumentSearch
Component tìm kiếm với similarity search và filters.

**Usage:**
```tsx
import { DocumentSearch } from '@/app/components/DocumentSearch'

<DocumentSearch
  onSearch={async (query, filters) => {
    const response = await fetch('/api/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters })
    })
    return response.json()
  }}
  availableAuthors={['John Doe', 'Jane Smith']}
  availableTags={['AI', 'ML', 'Tutorial']}
/>
```

**Features:**
- Semantic search box
- Filter panel (collapsible)
- Author dropdown
- Date range picker
- Tag selector (multi-select)
- Result cards with score

### 3. DocumentCard
Card hiển thị thông tin tài liệu.

**Usage:**
```tsx
import { DocumentCard } from '@/app/components/DocumentCard'

<DocumentCard
  id="doc-123"
  title="Document Title"
  url="https://example.com/doc"
  uploadDate={new Date()}
  onDelete={async (id) => {
    await fetch(`/api/rag/documents/${id}`, {
      method: 'DELETE'
    })
  }}
/>
```

---

## 🚀 Quick Start

### 1. Chạy migration
```bash
# Connect to PostgreSQL
psql -U postgres -d content_multiplier

# Run migration
\i infra/migrations/007_extend_documents.sql
```

### 2. Start API server
```bash
cd apps/api
npm install
npm run dev
# API runs on http://localhost:8080
```

### 3. Start web app
```bash
cd apps/web
npm install
npm run dev
# Web runs on http://localhost:3000
```

### 4. Truy cập Document Management
```
http://localhost:3000/documents
```

---

## 📖 Use Cases

### Case 1: Thêm tài liệu từ web
```typescript
const response = await fetch('/rag/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    doc_id: `doc-${Date.now()}`,
    title: 'AI Research Paper',
    author: 'OpenAI',
    published_date: '2024-01-15',
    tags: ['AI', 'Research', 'GPT'],
    description: 'Latest research on language models',
    raw: 'Full text content...',
    url: 'https://openai.com/research/paper'
  })
})
```

### Case 2: Tìm kiếm và lọc
```typescript
const results = await fetch('/rag/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is transformer architecture?',
    topK: 5,
    filters: {
      author: 'OpenAI',
      tags: ['AI', 'Research'],
      published_after: '2023-01-01'
    }
  })
})
```

### Case 3: Lấy tất cả tài liệu của tác giả
```typescript
const docs = await fetch('/rag/documents?author=OpenAI')
  .then(r => r.json())
```

---

## 🎯 Workflow

### 1. Upload Document Flow
```
User uploads document
  ↓
DocumentForm validates input
  ↓
POST /rag/documents
  ↓
RAG service:
  - Saves to documents table (with metadata)
  - Chunks text into smaller pieces
  - Generates embeddings for each chunk
  - Saves chunks to doc_chunks table
  ↓
Success response
```

### 2. Search Flow
```
User enters search query + filters
  ↓
DocumentSearch component
  ↓
POST /rag/search
  ↓
RAG service:
  - Generates embedding for query
  - Searches similar vectors in doc_chunks
  - Applies filters (author, tags, dates)
  - Returns top K results with metadata
  ↓
Display results with score
```

---

## 🔧 Configuration

### Environment Variables

**API (apps/api/.env):**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/content_multiplier
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
```

**Web (apps/web/.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 📊 Performance Tips

### 1. Indexing
Đã tạo indexes cho:
- `author` - B-tree index
- `published_date` - B-tree index
- `tags` - GIN index (array)
- `title` - Full-text search index

### 2. Chunk Size
Default: 800 characters with 100 overlap
```typescript
// In rag.ts
splitText(raw, chunkSize = 800, overlap = 100)
```

### 3. Embedding Model
Using OpenAI `text-embedding-3-small` (1536 dimensions)

---

## 🧪 Testing

### Manual Test

1. **Add Document:**
   - Navigate to `/documents`
   - Click "Thêm tài liệu"
   - Fill form with test data
   - Submit

2. **Search:**
   - Switch to "Tìm kiếm thông minh" tab
   - Enter query
   - Apply filters
   - Check results

3. **Delete:**
   - Click delete button on document card
   - Confirm deletion

### API Test

```bash
# Test create document
curl -X POST http://localhost:8080/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-1",
    "title": "Test Document",
    "author": "Test Author",
    "tags": ["test"],
    "raw": "This is test content about machine learning and AI."
  }'

# Test search
curl -X POST http://localhost:8080/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "topK": 3
  }'

# Test list with filters
curl "http://localhost:8080/rag/documents?author=Test%20Author"

# Test stats
curl http://localhost:8080/rag/stats
```

---

## 🐛 Troubleshooting

### Problem: Embeddings fail
**Solution:** Check OPENAI_API_KEY is set correctly

### Problem: Search returns no results
**Solution:** 
1. Verify documents have been chunked
2. Check `doc_chunks` table has embeddings
3. Ensure query is semantic (not exact match)

### Problem: Filters not working
**Solution:**
1. Check array syntax for tags filter
2. Verify date format (YYYY-MM-DD)
3. Check author exact match

---

## 📚 Files Created

### Backend
- `infra/migrations/007_extend_documents.sql`
- `apps/api/src/services/rag.ts` (updated)
- `apps/api/src/routes/rag.ts` (updated)

### Frontend
- `apps/web/app/components/DocumentForm.tsx`
- `apps/web/app/components/DocumentSearch.tsx`
- `apps/web/app/components/ui/label.tsx`
- `apps/web/app/components/ui/textarea.tsx`
- `apps/web/app/documents/page.tsx`

### Documentation
- `DOCUMENT_MANAGEMENT_GUIDE.md` (this file)

---

## ✨ Summary

Đã mở rộng thành công hệ thống quản lý tài liệu với:

✅ Database schema với metadata (author, published_date, tags)
✅ Chunking và embeddings tự động
✅ Similarity search với filters
✅ Giao diện quản lý đầy đủ
✅ API endpoints hoàn chỉnh
✅ Documentation chi tiết

**Status:** 100% Complete! 🎉





















