Dưới đây là **README** ngắn gọn, đủ để bạn (hoặc AI coding agent) **cài đặt và chạy MVP Content Multiplier** trên máy local.

---

# Content Multiplier – README cài đặt & chạy

> 📖 **Xem User Workflow Guide**: [USER_WORKFLOW.md](USER_WORKFLOW.md) - Hướng dẫn chi tiết về quy trình làm việc từ ý tưởng đến xuất bản

## Tổng quan (high-level)

- **Frontend**: Next.js/React (App Router), thanh điều hướng cố định, hỗ trợ EN/VN với `LanguageContext`, các trang quy trình (Ideas → Briefs → Content Packs → Settings), trình soạn thảo Markdown (ảnh base64, embed, xuất tài liệu), gọi API bằng `fetch` và lưu ngôn ngữ trong `localStorage`.
- **Backend**: Fastify (TypeScript), PostgreSQL + `pgvector`, RAG tuỳ chọn, xác thực JSON bằng schema, telemetry sự kiện, guardrails; multi‑LLM (`OpenAI`, `DeepSeek`, `Anthropic`, `Gemini`, `Grok`) cấu hình qua `settingsStore`.
- **Hạ tầng & mở rộng**: Monorepo (web/api/packages), Docker Compose cho DB + migrations SQL; thiết kế sẵn hệ thống xuất bản (OAuth, hàng đợi, retry, webhooks, MXH/Email/CMS) cho các tích hợp tiếp theo.

## 1) Yêu cầu hệ thống

* **Node.js** ≥ 18 LTS
* **pnpm** ≥ 8 (khuyến nghị) – cài: `npm i -g pnpm`
* **Docker + Docker Compose** (để chạy Postgres + pgvector)
* Hệ điều hành: macOS / Linux / WSL2 (Windows)

> Nếu bạn không dùng Docker, có thể tự cài Postgres 15+ và enable `pgvector`, nhưng README này giả định dùng Docker.

---

## 2) Clone & cấu trúc dự án

```bash
git clone https://github.com/your-org/content-multiplier.git
cd content-multiplier
```

Cấu trúc (rút gọn):

```
content-multiplier/
  apps/
    api/            # Fastify API
    web/            # Next.js frontend
  packages/
    schemas/        # JSON Schemas dùng chung
    types/          # (tuỳ chọn) Types dùng chung
    utils/          # LLM client, validator, RAG helpers
  infra/
    docker-compose.yml
    migrations/     # SQL migrations (pg + pgvector)
  scripts/
    dev.sh
  .env.example
  README.md
```

---

## 3) Biến môi trường

Sao chép file `.env.example` thành `.env` (root) và chỉnh sửa:

```bash
cp .env.example .env
```

Ví dụ nội dung:

```
# Database
DATABASE_URL=postgres://cm:cm@localhost:5432/cm

# LLM
OPENAI_API_KEY=sk-xxx
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini

# API
PORT=3001
```

> Bạn có thể dùng nhà cung cấp LLM khác; sửa code `LLMClient` tương ứng.

---

## 4) Khởi tạo hạ tầng (DB + pgvector)

### 4.1 Chạy Postgres qua Docker

```bash
docker compose -f infra/docker-compose.yml up -d
```

Kiểm tra container chạy: `docker ps`

### 4.2 Chạy migration

```bash
./scripts/dev.sh
```

Script sẽ:

* Bật Docker (nếu chưa)
* Chạy SQL migration `infra/migrations/001_init.sql` (tạo bảng + `pgvector`)
* (Nếu có) các file migration bổ sung như `002_events_extensions.sql`

> Nếu lỗi kết nối DB, kiểm tra `DATABASE_URL` trong `.env`.

---

## 5) Cài dependencies

Ở thư mục root:

```bash
pnpm install
```

> Nếu dùng npm/yarn: hãy chuyển sang pnpm để đồng bộ workspace.

---

## 6) Chạy API & Web

### 6.1 API (Fastify)

```bash
cd apps/api
pnpm dev   # hoặc pnpm start nếu đã build
```

* API chạy ở `http://localhost:3001`
* Kiểm tra health nhanh: (tuỳ bạn có route ping/health), hoặc xem log terminal.

### 6.2 Web (Next.js)

Mở terminal khác:

```bash
cd apps/web
pnpm dev
```

* Web chạy ở `http://localhost:3000`
* Proxy `/api/*` → `http://localhost:3001` (cấu hình trong `next.config.mjs` hoặc route handlers)

---

## 7) Kiểm tra nhanh (Happy Path)

> 💡 **Lưu ý**: Để hiểu rõ hơn về workflow và cách sử dụng từng tính năng, vui lòng xem [USER_WORKFLOW.md](USER_WORKFLOW.md)

### 7.1 Tạo 10 ý tưởng (Ideas)

```bash
curl -X POST http://localhost:3001/api/ideas/generate \
 -H 'Content-Type: application/json' \
 -H 'x-user-id: alice' -H 'x-user-role: CL' \
 -d '{"persona":"Content Lead","industry":"SaaS","corpus_hints":"automation, guardrails"}'
```

* Kỳ vọng: API trả mảng 10 idea + đã lưu DB.
* Xem list (nếu có route GET) hoặc mở UI tại `http://localhost:3000/ideas`.

### 7.2 Chọn 1 idea

```bash
curl -X POST http://localhost:3001/api/ideas/2025-10-12-ops-guardrails/select \
 -H 'x-user-id: alice' -H 'x-user-role: CL'
```

> Thay `idea_id` bằng ID thật (từ bước trên).

### 7.3 Ingest tài liệu RAG (tuỳ chọn)

```bash
curl -X POST http://localhost:3001/api/rag/ingest \
 -H 'Content-Type: application/json' \
 -d '{"doc_id":"doc1","title":"Policy 2025","url":"https://example.com","raw":"Full text content ..."}'
```

### 7.4 Tạo Brief từ RAG + LLM

```bash
curl -X POST http://localhost:3001/api/briefs/generate \
 -H 'Content-Type: application/json' \
 -H 'x-user-id: bob' -H 'x-user-role: WR' \
 -d '{"brief_id":"BRF-001","idea_id":"2025-10-12-ops-guardrails","query":"LLM guardrails policy"}'
```

### 7.5 Tạo Draft

```bash
curl -X POST http://localhost:3001/api/packs/draft \
 -H 'Content-Type: application/json' \
 -H 'x-user-id: bob' -H 'x-user-role: WR' \
 -d '{"pack_id":"PACK-001","brief_id":"BRF-001","audience":"Ops Director"}'
```

### 7.6 Sinh Derivatives + SEO

```bash
curl -X POST http://localhost:3001/api/packs/derivatives \
 -H 'Content-Type: application/json' \
 -H 'x-user-id: bob' -H 'x-user-role: WR' \
 -d '{"pack_id":"PACK-001"}'
```

### 7.7 Export lịch phân phối

CSV:

```bash
curl http://localhost:3001/api/events/distribution/PACK-001.csv -H 'x-user-id: mops' -H 'x-user-role: MOps'
```

ICS:

```bash
curl http://localhost:3001/api/events/distribution/PACK-001.ics -H 'x-user-id: mops' -H 'x-user-role: MOps'
```

### 7.8 Publish (sau khi qua guardrails)

```bash
curl -X POST http://localhost:3001/api/packs/publish \
 -H 'Content-Type: application/json' \
 -H 'x-user-id: alice' -H 'x-user-role: CL' \
 -d '{"pack_id":"PACK-001"}'
```

> Nếu guardrails fail (thiếu citations, v.v.), API sẽ trả lỗi – hãy sửa draft/ledger rồi thử lại.

---

## 8) Telemetry / Analytics (kiểm tra nhanh)

### 8.1 Liệt kê số sự kiện theo loại trong 24h

```sql
SELECT event_type, COUNT(*)
FROM events
WHERE created_at >= now() - interval '1 day'
GROUP BY event_type
ORDER BY 2 DESC;
```

### 8.2 Chuỗi sự kiện của 1 pack

```sql
SELECT event_type, created_at
FROM events
WHERE pack_id = 'PACK-001'
ORDER BY created_at;
```

### 8.3 Guardrail pass rate

```sql
SELECT
  SUM( (payload->>'ok')::boolean::int )::float / COUNT(*) AS pass_rate
FROM events
WHERE event_type IN ('guardrail.pass','guardrail.fail');
```

---

## 9) Lỗi thường gặp & cách xử lý

* **`psql: could not connect`** → Kiểm tra Docker đang chạy, port `5432`, và `DATABASE_URL`.
* **Schema JSON fail** → LLM trả sai định dạng: bật “JSON-only” trong prompt, thêm retry/repair; kiểm tra AJV error.
* **Citations thiếu** → `claims_ledger` cần ≥ 1 nguồn cho mỗi claim; dùng RAG để lấy snippets/URL đáng tin.
* **CORS/Proxy** (Web gọi API lỗi) → cấu hình proxy trong Next.js (hoặc dùng `NEXT_PUBLIC_API_BASE`).
* **OPENAI\_API\_KEY thiếu** → set đúng key trong `.env`; restart API.
* **Chi phí LLM** → bật cache theo hash prompt + schema; giảm temperature; ghép batch.

---

## 10) Scripts hữu ích

* **Khởi động nhanh toàn bộ (DB + migrations):**

  ```bash
  ./scripts/dev.sh
  ```
* **Refresh materialized views (nếu dùng):**

  ```sql
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pack_kpis;
  ```

---

## 11) Nâng cấp sau MVP (gợi ý)

* API post lên LinkedIn/X/ESP (Buffer/Hootsuite hoặc native)
* Golden set evals + prompt A/B
* Fine-tuning giọng thương hiệu
* Localization (i18n)
* UI Dashboard nâng cao (cycle time by stage, guardrail breakdown)

---

## 12) Tài liệu tham khảo

* **[USER_WORKFLOW.md](USER_WORKFLOW.md)** - Hướng dẫn chi tiết về user workflow, từ generate ideas đến publish & distribute, bao gồm diagrams và best practices
* **[RAG_PIPELINE_SETUP.md](RAG_PIPELINE_SETUP.md)** - Hướng dẫn thiết lập RAG pipeline
* **[PUBLISHING_INTEGRATION_PLAN.md](PUBLISHING_INTEGRATION_PLAN.md)** - Kế hoạch tích hợp publishing
* **[ALL-DOCS-INDEX.md](ALL-DOCS-INDEX.md)** - Index tất cả tài liệu trong project

---

## 13) Bản quyền & bảo mật

* Không log PII vào `events.payload`.
* Lưu bản thảo/dữ liệu gốc trong bảng chuyên dụng; sự kiện chỉ lưu siêu dữ liệu (độ dài, đếm, mã loại).
* Bật HTTPS và auth trước khi đưa ra môi trường ngoài.

---



