# Project Memory - Content Multiplier / RAG Pipeline

## RAG & Documents (hiện tại)
- Đã mở rộng schema `documents` với metadata:
  - `author TEXT`, `published_date TIMESTAMPTZ`, `tags TEXT[]`, `description TEXT`, `embedding vector(1536)`, `updated_at TIMESTAMPTZ`.
  - Indexes: `idx_documents_author`, `idx_documents_published_date`, `idx_documents_tags`, `idx_documents_embedding`.
- Đã tạo và chạy migration `010_extend_documents_metadata.sql` + `009_add_vector_to_documents.sql` + `007_extend_documents.sql` (qua Docker `infra-db-1`).
- Endpoint `POST /api/rag/ingest`:
  - Nhận metadata (author, published_date, tags, description, url, title).
  - Chunking token-based (hoặc fallback character-based).
  - Gọi OpenAI embedding (text-embedding-3-small) để tạo:
    - Embedding cho từng chunk (lưu vào `doc_chunks.embedding`).
    - Embedding cho toàn bộ document (lưu `documents.embedding`).
  - Lưu/ cập nhật document + metadata + embeddings.
- Endpoint `POST /api/rag/search`:
  - `searchType = "chunks"`: search trên `doc_chunks` + join `documents`.
  - `searchType = "documents"`: dùng `retrieveDocuments()` search trên `documents.embedding`.
  - Hỗ trợ filters: `author`, `tags[]`, `published_after`, `published_before`.

## Frontend (Documents & RAG UI)
- Trang `/documents`:
  - Header có:
    - `DocumentUpload` (drag-drop, hidden file input, progress bar %; call `/api/rag/ingest` bằng text file).
    - `DocumentForm` (form nhập tay: title, author, published_date (datetime-local), tags multi-select, description, content).
  - Stats cards: tổng documents, chunks, authors, tags (gọi `/api/rag/stats`).
  - Danh sách documents: `DocumentCard` hiển thị title, created_at, author, published_date, tags (badges), description, url; có xóa với AlertDialog.
  - Tab “Tìm kiếm thông minh” dùng `DocumentSearch`:
    - Input query + filters (author dropdown, tags multi-select, date range).
    - Gọi `/api/rag/search` (mặc định `searchType: "chunks"`), hiển thị content + score.

## Inline Citations & Footnotes
- Component `ParsedContentWithCitations`:
  - Parse `[1]`, `[2]`, ... từ text với regex, thay bằng `InlineCitation` (Badge outline + Tooltip).
  - Tooltip hiển thị `source.title`, `source.snippet`, `source.url`.
  - Click citation scroll tới `#footnote-n` với highlight.
- Component `Footnotes`:
  - Accordion từng nguồn `[n] Title - URL`, nội dung là snippet.
  - Nút “Copy URL” + “Mở link” (ExternalLink).
- Trang `packs/[id]` (pack detail):
  - Khi **không edit** draft:
    - Hiển thị `ParsedContentWithCitations` cho `pack.draft_markdown` dùng `pack.claims_ledger` làm `sources`.
    - Hiển thị `Footnotes` bên dưới, map từ `claims_ledger`.

## Demo RAG Components
- `RAGDemo` component (chưa gắn vào route chính, nhưng dùng làm playground):
  - Cho thấy: `DocumentUpload + DocumentCard + ParsedContentWithCitations + Footnotes` hoạt động cùng nhau.
  - `onUpload` hiện gọi `/api/rag/ingest` với file content (dạng text) để ingest demo docs.

## Scripts & Docs
- Scripts:
  - `run-migration-010.sh`, `run-migrations.sh`: script chạy migrations (auto detect Docker/psql).
  - `test-rag-pipeline.sh`: ingest 2 docs + test nhiều kiểu search (no filters, author, tags, combined, document-level).
- Docs liên quan:
  - `RAG_METADATA_IMPLEMENTATION_SUMMARY.md`
  - `RAG_PIPELINE_COMPLETE.md`, `RAG_PIPELINE_SETUP.md`, `RAG_PIPELINE_COMPLETE_CHECKLIST.md`
  - `MIGRATION_GUIDE.md`
  - `query-documents-by-similarity.sql`

## Lưu ý kỹ thuật
- API base cho frontend: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
- Đã thêm CORS cho:
  - `http://localhost:3000`
  - `http://localhost:3002`
- Embedding model: `text-embedding-3-small` (dim = 1536).
- Đảm bảo `OPENAI_API_KEY` (hoặc provider tương ứng) được set trong `.env`.



