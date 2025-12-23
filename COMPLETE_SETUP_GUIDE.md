# 🚀 Content Multiplier - Hướng Dẫn Hoàn Thiện Toàn Diện

## 📋 Tổng Quan App

**Content Multiplier** là ứng dụng AI-powered để:
- 🧠 Tạo ý tưởng nội dung (Ideas) bằng AI
- 📝 Chuyển ý tưởng thành Brief chi tiết
- 📦 Tạo Content Packs với nhiều định dạng (Blog, Twitter, LinkedIn, Email)
- 🌐 Hỗ trợ đa ngôn ngữ (EN/VI/FR)
- 🖼️ Tích hợp Stock Images (Unsplash/Pexels)
- 📊 RAG Pipeline cho nội dung chính xác

---

## ✅ Checklist Hoàn Thiện

### Đã hoàn thành ✅
- [x] Frontend (Next.js) với UI hoàn chỉnh
- [x] Backend API (Fastify) với tất cả routes
- [x] Database migrations (PostgreSQL + pgvector)
- [x] Multi-language support (EN/VI/FR)
- [x] Stock image integration (Unsplash/Pexels)
- [x] LLM integration (OpenAI, DeepSeek, Gemini, Anthropic)

### Cần hoàn thành 🔄
- [ ] Push code mới lên GitHub
- [ ] Thêm API keys vào Railway (Unsplash, Pexels)
- [ ] Verify deployment hoạt động

---

## 📤 BƯỚC 1: Push Code Lên GitHub

### 1.1 Tạo Personal Access Token

1. Truy cập: https://github.com/settings/tokens/new
2. Cấu hình:
   - **Note**: `content-multiplier-push`
   - **Expiration**: 90 days
   - **Scopes**: ✅ Tick `repo`
3. Click **"Generate token"**
4. **Copy token ngay** (chỉ hiện 1 lần!)

### 1.2 Đổi Remote và Push

```bash
# Di chuyển đến thư mục project
cd /Users/queeniecao/.cursor/worktrees/content-multiplier/hta

# Đổi remote sang HTTPS
git remote set-url origin https://github.com/annecao-ca/content-multiplier-DEC01.git

# Lưu credentials
git config --global credential.helper store

# Push code
git push origin HEAD:content-multiplier
```

Khi được hỏi:
- **Username**: GitHub username của bạn
- **Password**: Paste Personal Access Token (không phải mật khẩu)

---

## 🔑 BƯỚC 2: Cấu Hình API Keys

### 2.1 Unsplash API (Đã có)

Bạn đã có Unsplash API key rồi ✅

### 2.2 Pexels API (Tùy chọn)

1. Truy cập: https://www.pexels.com/api/
2. Click **"Get Started"** → Đăng ký
3. Vào Dashboard → Copy API Key

### 2.3 Thêm Keys vào Railway

1. Đăng nhập: https://railway.app
2. Vào project của bạn
3. Click vào **service** (backend)
4. Chọn tab **"Variables"**
5. Thêm các biến sau:

| Variable Name | Value |
|---------------|-------|
| `UNSPLASH_ACCESS_KEY` | (API key Unsplash của bạn) |
| `PEXELS_API_KEY` | (API key Pexels - tùy chọn) |

6. Railway sẽ tự động redeploy

---

## 🌐 BƯỚC 3: Kiểm Tra Deployment

### 3.1 Kiểm tra Backend (Railway)

```bash
# Health check
curl https://content-multiplier-dec01-production.up.railway.app/health

# Test image service
curl https://content-multiplier-dec01-production.up.railway.app/api/images/status

# Test languages endpoint
curl https://content-multiplier-dec01-production.up.railway.app/api/ideas/languages
```

### 3.2 Kiểm tra Frontend (Vercel)

Truy cập: https://content-multiplier-dec-01.vercel.app

Kiểm tra các trang:
- `/` - Trang chủ
- `/ideas` - Tạo ý tưởng
- `/briefs` - Tạo briefs
- `/packs` - Content packs
- `/settings` - Cài đặt

---

## 🛠️ BƯỚC 4: Test Các Tính Năng

### 4.1 Test Tạo Ý Tưởng Đa Ngôn Ngữ

```bash
# Tiếng Việt
curl -X POST https://content-multiplier-dec01-production.up.railway.app/api/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{"persona": "Marketing Manager", "industry": "SaaS", "count": 3, "language": "vi"}'

# Tiếng Pháp
curl -X POST https://content-multiplier-dec01-production.up.railway.app/api/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{"persona": "Marketing Manager", "industry": "SaaS", "count": 3, "language": "fr"}'
```

### 4.2 Test Tìm Kiếm Hình Ảnh

```bash
# Tìm kiếm hình marketing
curl "https://content-multiplier-dec01-production.up.railway.app/api/images/search?query=digital+marketing&count=5"

# Gợi ý hình cho nội dung
curl -X POST https://content-multiplier-dec01-production.up.railway.app/api/images/suggest \
  -H "Content-Type: application/json" \
  -d '{"title": "AI in Marketing", "content": "How AI transforms digital marketing strategies"}'
```

---

## 🖥️ BƯỚC 5: Chạy Local (Development)

### 5.1 Yêu Cầu

- Node.js ≥ 18
- pnpm ≥ 8 (`npm i -g pnpm`)
- Docker + Docker Compose

### 5.2 Cài Đặt

```bash
# Clone project
cd /Users/queeniecao/.cursor/worktrees/content-multiplier/hta

# Cài dependencies
pnpm install

# Copy env file
cp .env.example .env
```

### 5.3 Cấu Hình `.env`

Chỉnh sửa file `.env`:

```env
# Database
DATABASE_URL=postgres://cm:cm@localhost:5432/cm

# LLM (chọn 1 trong các option)
OPENAI_API_KEY=sk-xxx
# hoặc
DEEPSEEK_API_KEY=xxx
# hoặc
GEMINI_API_KEY=xxx

# Stock Images
UNSPLASH_ACCESS_KEY=xxx
PEXELS_API_KEY=xxx

# API Config
PORT=3001
```

### 5.4 Chạy Database

```bash
# Khởi động PostgreSQL
docker compose -f infra/docker-compose.yml up -d

# Chạy migrations
./scripts/dev.sh
```

### 5.5 Chạy App

Terminal 1 (Backend):
```bash
cd apps/api
pnpm dev
# API chạy tại http://localhost:3001
```

Terminal 2 (Frontend):
```bash
cd apps/web
pnpm dev
# Web chạy tại http://localhost:3000
```

---

## 📊 Cấu Trúc Project

```
content-multiplier/
├── apps/
│   ├── api/                 # Backend Fastify
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   │   ├── ideas.ts
│   │   │   │   ├── briefs.ts
│   │   │   │   ├── packs.ts
│   │   │   │   ├── images.ts     # ✅ NEW: Stock images
│   │   │   │   └── ...
│   │   │   ├── services/    # Business logic
│   │   │   │   ├── idea-generator.ts
│   │   │   │   ├── translation.ts # ✅ NEW: Multi-lang
│   │   │   │   ├── image-service.ts # ✅ NEW
│   │   │   │   └── ...
│   │   │   └── index.ts     # Entry point
│   │   └── package.json
│   │
│   └── web/                 # Frontend Next.js
│       ├── app/
│       │   ├── ideas/       # Ideas page
│       │   ├── briefs/      # Briefs page
│       │   ├── packs/       # Packs page
│       │   ├── components/
│       │   │   ├── LanguageSelector.tsx # ✅ NEW
│       │   │   ├── ImagePicker.tsx      # ✅ NEW
│       │   │   └── ...
│       │   └── translations.ts
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml   # PostgreSQL + pgvector
│   └── migrations/          # SQL migrations
│       ├── 001_init.sql
│       ├── ...
│       └── 014_add_language_support.sql # ✅ NEW
│
├── packages/
│   ├── schemas/             # JSON Schemas
│   ├── types/               # TypeScript types
│   └── utils/               # Shared utilities
│
└── package.json             # Root workspace
```

---

## 🔧 Troubleshooting

### Lỗi Push GitHub

```
Permission denied (publickey)
```
**Giải pháp**: Dùng HTTPS thay SSH (xem Bước 1.2)

### Lỗi Railway Deploy

Kiểm tra logs trong Railway Dashboard:
1. Vào project → Deployments
2. Click vào deployment mới nhất
3. Xem logs để tìm lỗi

### Lỗi Database

```
connection refused
```
**Giải pháp**: 
- Kiểm tra DATABASE_URL đúng format
- Verify database đang chạy

### Lỗi CORS

```
CORS error
```
**Giải pháp**: Đã được fix trong code, cần redeploy Railway

### Lỗi API Key

```
Unsplash/Pexels not configured
```
**Giải pháp**: Thêm API keys vào Railway Variables

---

## 📱 Sử Dụng App

### Workflow Cơ Bản

1. **Tạo Ideas** (`/ideas`)
   - Chọn ngôn ngữ (EN/VI/FR)
   - Nhập persona, industry
   - Click "Generate Ideas"
   - Chọn ideas hay để phát triển

2. **Tạo Brief** (`/briefs`)
   - Chọn idea đã lưu
   - Thêm context, keywords
   - Generate brief chi tiết

3. **Tạo Content Pack** (`/packs`)
   - Từ brief, tạo nội dung cho nhiều platform
   - Blog post, Twitter thread, LinkedIn, Email
   - Thêm hình ảnh từ stock photos

4. **Xuất Bản** (`/publisher`)
   - Kết nối các nền tảng (Twitter, LinkedIn...)
   - Lên lịch đăng bài
   - Theo dõi analytics

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra file `MULTI_LANGUAGE_SETUP.md` để biết chi tiết về tính năng mới
2. Xem `USER_WORKFLOW.md` để hiểu quy trình sử dụng
3. Kiểm tra logs trong Railway/Vercel dashboard

---

## 🎉 Sau Khi Hoàn Thành

Khi tất cả bước trên hoàn tất, bạn sẽ có:

✅ App hoạt động đầy đủ với:
- Frontend tại: https://content-multiplier-dec-01.vercel.app
- Backend API tại: https://content-multiplier-dec01-production.up.railway.app

✅ Các tính năng:
- Tạo ý tưởng nội dung bằng AI (3 ngôn ngữ)
- Tích hợp stock images (Unsplash + Pexels)
- RAG pipeline cho nội dung chính xác
- Multi-LLM support

---

*Cập nhật lần cuối: December 22, 2025*

