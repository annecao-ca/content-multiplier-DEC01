# Project Memory - Content Multiplier / RAG Pipeline

> **Cập nhật lần cuối**: 2025-12-05  
> **GitHub Repo**: https://github.com/annecao-ca/content-multiplier-DEC01  
> **Trạng thái**: ✅ RAG Pipeline hoàn chỉnh + UI Dark Theme đồng nhất với multi-provider embedding support (OpenAI, DeepSeek, Gemini)

## Tóm tắt tính năng chính
- ✅ **RAG Pipeline hoàn chỉnh**: Ingest documents với metadata, chunking, embedding, similarity search
- ✅ **Multi-provider Embedding**: Hỗ trợ OpenAI, DeepSeek, Gemini, Cohere, HuggingFace
- ✅ **Document Management UI**: Upload, form nhập tay, search với filters, stats dashboard
- ✅ **Inline Citations & Footnotes**: Hiển thị citations trong draft với tooltips và footnotes
- ✅ **Database Schema**: PostgreSQL + pgvector với migrations đầy đủ
- ✅ **Document Versioning**: Hỗ trợ versioning cho documents
- ✅ **Test Scripts**: Scripts test cho RAG pipeline, DeepSeek embedding, document API

## RAG & Documents (hiện tại)
- Đã mở rộng schema `documents` với metadata:
  - `author TEXT`, `published_date TIMESTAMPTZ`, `tags TEXT[]`, `description TEXT`, `embedding vector(1536)`, `updated_at TIMESTAMPTZ`.
  - Indexes: `idx_documents_author`, `idx_documents_published_date`, `idx_documents_tags`, `idx_documents_embedding`.
- Đã tạo và chạy migration `010_extend_documents_metadata.sql` + `009_add_vector_to_documents.sql` + `007_extend_documents.sql` (qua Docker `infra-db-1`).
- Endpoint `POST /api/rag/ingest`:
  - Nhận metadata (author, published_date, tags, description, url, title).
  - Chunking token-based (hoặc fallback character-based).
  - Gọi embedding API (tự động dùng provider từ `EMBEDDING_PROVIDER`, mặc định OpenAI) để tạo:
    - Embedding cho từng chunk (lưu vào `doc_chunks.embedding`).
    - Embedding cho toàn bộ document (lưu `documents.embedding`).
  - Lưu/ cập nhật document + metadata + embeddings.
  - Hỗ trợ multi-provider: OpenAI, DeepSeek, Gemini, Cohere, HuggingFace (cấu hình qua env vars).
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

## Multi-Provider Embedding Support (DeepSeek, OpenAI, Gemini, etc.)
- Đã tích hợp hỗ trợ nhiều embedding providers:
  - **OpenAI**: `text-embedding-3-small` (dim = 1536) - mặc định
  - **DeepSeek**: `deepseek-embedding` hoặc `deepseek-chat` (OpenAI-compatible endpoint tại `https://api.deepseek.com`)
  - **Gemini**: `text-embedding-004` (qua GoogleGenerativeAI SDK)
  - **Cohere**: `embed-english-v3.0` (cấu hình sẵn, chưa test)
  - **HuggingFace**: `sentence-transformers/all-MiniLM-L6-v2` (cấu hình sẵn, chưa test)
- Cấu hình qua biến môi trường:
  - `EMBEDDING_PROVIDER`: `'openai' | 'deepseek' | 'gemini' | 'cohere' | 'huggingface'` (default: `'openai'`)
  - `DEEPSEEK_API_KEY`: API key cho DeepSeek (nếu dùng DeepSeek)
  - `GEMINI_API_KEY`: API key cho Gemini (nếu dùng Gemini)
  - `EMBEDDING_MODEL`: Model name cụ thể (override default của provider)
- Implementation:
  - `apps/api/src/services/llm.ts`: Class `MultiProviderLLM` với method `embed()` tự động detect provider từ `env.EMBEDDING_PROVIDER`
  - DeepSeek dùng OpenAI client với `baseURL: 'https://api.deepseek.com'`
  - Gemini dùng `GoogleGenerativeAI` SDK riêng
- Test script: `test-deepseek-embedding.ts` - test trực tiếp DeepSeek embedding API

## Lưu ý kỹ thuật
- API base cho frontend: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
- Đã thêm CORS cho:
  - `http://localhost:3000`
  - `http://localhost:3002`
- Embedding model mặc định: `text-embedding-3-small` (dim = 1536) - có thể đổi qua `EMBEDDING_PROVIDER` và `EMBEDDING_MODEL`.
- Đảm bảo API key tương ứng được set trong `.env`:
  - `OPENAI_API_KEY` (nếu dùng OpenAI)
  - `DEEPSEEK_API_KEY` (nếu dùng DeepSeek)
  - `GEMINI_API_KEY` (nếu dùng Gemini)

## UI Refactoring - Dark Theme Consistency (2025-12-05)
- ✅ **Đồng bộ UI toàn bộ app**: Tất cả pages sử dụng dark theme giống Dashboard & Ideas
- ✅ **DashboardHero Component**: Gradient hero (`from-[#7c3aed] via-[#9333ea] to-[#db2777]`) cho tất cả pages
  - Đã áp dụng cho: `/briefs`, `/packs`, `/analytics`, `/settings`, `/documents`
- ✅ **Webflow UI Kit**: Tạo components mới trong `webflow-ui.tsx`:
  - `AppShell`, `AppNavbar`, `Section`, `PageHeader`
  - `Card`, `SubCard`, `StatCard`, `EmptyState`
  - `PrimaryButton`, `Badge`, `Grid`, `Tabs`, `Table`
  - `Input`, `Textarea`, `Select` với dark theme support
- ✅ **DocumentCard Improvements**:
  - Truncate text: Title (1 dòng), Description (2 dòng), Metadata (1 dòng)
  - Layout: `flex flex-col`, `max-h-52 overflow-hidden`, `space-y-2`
  - Border style: `border-white/5 bg-white/5 hover:bg-white/10`
  - Text colors: `text-white`, `text-white/70`, `text-white/50`
- ✅ **Pages đã refactor**:
  - `/briefs`: DashboardHero + dark cards + EmptyState trong Card
  - `/packs`: DashboardHero + dark cards + gradient buttons
  - `/analytics`: DashboardHero + filter card dark + StatCard đồng nhất
  - `/settings`: DashboardHero + dark navigation cards + LLM config card
  - `/documents`: DashboardHero + DocumentCard với truncate + dark theme
- ✅ **Consistent Styling**:
  - Background: `bg-slate-950` cho tất cả pages
  - Cards: `bg-slate-900/70 border border-slate-800 rounded-3xl`
  - SubCards: `bg-slate-800/50 border-slate-700`
  - Primary buttons: Gradient `from-[#a855f7] via-[#ec4899] to-[#f97316]`
  - Typography: `text-slate-50` (titles), `text-slate-400` (descriptions)

## GitHub Repository
- Code đã được push lên: **https://github.com/annecao-ca/content-multiplier-DEC01**
- Branch: `2025-12-05-9f92-a1bef`
- Commit mới nhất: "Refactor UI: Dark theme consistency across all pages" (commit `0c83688`)
- Tổng cộng: 101 files changed, 6,151 insertions(+), 2,426 deletions(-)
- File `.env` đã được `.gitignore` loại trừ (an toàn cho secrets)

## Files & Scripts mới
- Test scripts:
  - `test-deepseek-embedding.ts`: Test DeepSeek embedding model trực tiếp
  - `test-deepseek.ts`: Test DeepSeek API key và chat completions
  - `test-rag-pipeline.sh`: Test toàn bộ RAG pipeline (ingest + search với filters)
- Migration scripts:
  - `run-migration-010.sh`: Chạy migration `010_extend_documents_metadata.sql`
  - `run-migrations.sh`: Chạy tất cả migrations theo thứ tự
- Documentation:
  - `DEEPSEEK_SETUP_COMPLETE.md`: Hướng dẫn setup DeepSeek
  - `DEEPSEEK_TEST_RESULT.md`: Kết quả test DeepSeek
  - `Memory.md`: File này - tổng hợp tất cả những gì đã làm

## UI Components mới (2025-12-05)
- **`apps/web/app/components/webflow-ui.tsx`**: UI kit components với dark theme support
  - Layout: `AppShell`, `AppNavbar`, `Section`, `PageHeader`
  - Cards: `Card`, `SubCard`, `CardHeader`, `CardTitle`, `CardDescription`
  - Stats & Empty: `StatCard`, `EmptyState`
  - Buttons & Badges: `PrimaryButton`, `Badge`
  - Forms: `Input`, `Textarea`, `Select`
  - Tables: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
  - Tabs: `Tabs` component
  - Grid: `Grid` layout component
- **`apps/web/app/components/dashboard-ui.tsx`**: Dashboard-specific components
  - `DashboardHero`: Gradient hero với title, description, CTA
  - `ActivityItemDark`: Activity row với hover states
  - `ActivitySection`: Section wrapper cho activity list
  - `PageHeaderDark`: PageHeader với dark background (deprecated, dùng DashboardHero thay thế)
- **`apps/web/app/components/ThemeProvider.tsx`**: Theme context provider
  - Quản lý dark/light theme state
  - Lưu preference vào localStorage
- **Updated Components**:
  - `DocumentCard.tsx`: Truncate text, line-clamp, overflow handling, dark theme
  - `DocumentForm.tsx`: Dark theme cho dialog và form inputs
  - `DocumentUpload.tsx`: Dark theme cho dialog và drag-drop zone
  - `DocumentSearch.tsx`: Dark theme cho search bar và results


