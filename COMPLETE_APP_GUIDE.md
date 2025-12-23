# 📋 Hướng Dẫn Hoàn Thiện Content Multiplier App

## 🎯 Tổng Quan

Content Multiplier là một ứng dụng AI-powered để tạo và quản lý ý tưởng nội dung đa nền tảng với các tính năng:
- ✅ Tạo ý tưởng nội dung bằng AI
- ✅ Hỗ trợ đa ngôn ngữ (Tiếng Anh, Tiếng Việt, Tiếng Pháp)
- ✅ Tích hợp stock images (Unsplash, Pexels)
- ✅ Xuất bản lên Twitter, LinkedIn
- ✅ RAG (Retrieval-Augmented Generation) với documents

---

## 📊 Trạng Thái Hiện Tại

| Thành phần | Trạng thái | Ghi chú |
|------------|------------|---------|
| Backend API | ⚠️ Chưa deploy | Cần push code và deploy lại |
| Frontend | ⚠️ Chưa deploy | Cần push code và deploy lại |
| Database | ✅ Đã có | PostgreSQL trên Railway/Supabase |
| Multi-language | ✅ Code xong | Cần deploy |
| Stock Images | ✅ Code xong | Cần thêm API keys |

---

## 🚀 CÁC BƯỚC THỰC HIỆN

### BƯỚC 1: Push Code Lên GitHub (QUAN TRỌNG NHẤT)

#### 1.1 Đổi sang HTTPS
```bash
cd /Users/queeniecao/.cursor/worktrees/content-multiplier/hta
git remote set-url origin https://github.com/annecao-ca/content-multiplier-DEC01.git
```

#### 1.2 Tạo Personal Access Token
1. Mở: https://github.com/settings/tokens/new
2. Điền thông tin:
   - **Note**: `content-multiplier`
   - **Expiration**: 90 days
   - **Scopes**: ✅ Tick **repo**
3. Click **Generate token**
4. **COPY TOKEN NGAY** (chỉ hiện 1 lần!)

#### 1.3 Push code
```bash
git push origin HEAD:content-multiplier
```
- **Username**: `annecao-ca`
- **Password**: Paste token vừa tạo

#### 1.4 Lưu credentials (không cần nhập lại)
```bash
git config --global credential.helper store
```

---

### BƯỚC 2: Thêm API Keys Vào Railway

#### 2.1 Đăng nhập Railway
1. Truy cập: https://railway.app
2. Login với GitHub

#### 2.2 Thêm biến môi trường
1. Chọn project backend
2. Click tab **Variables**
3. Thêm các biến sau:

| Tên biến | Giá trị | Nguồn |
|----------|---------|-------|
| `UNSPLASH_ACCESS_KEY` | (API key của bạn) | https://unsplash.com/developers |
| `PEXELS_API_KEY` | (API key của bạn) | https://www.pexels.com/api/ |
| `GEMINI_API_KEY` | (API key của bạn) | https://makersuite.google.com/app/apikey |

#### 2.3 Kiểm tra các biến đã có
Đảm bảo đã có các biến sau:
- `DATABASE_URL` (PostgreSQL connection string)
- `DEEPSEEK_API_KEY` hoặc `OPENAI_API_KEY`
- `PORT` = `3001`

---

### BƯỚC 3: Chạy Database Migration

#### 3.1 Kết nối database
Lấy `DATABASE_URL` từ Railway Variables, format:
```
postgresql://username:password@host:port/database
```

#### 3.2 Chạy migration
```bash
# Sử dụng psql hoặc công cụ database
psql $DATABASE_URL < infra/migrations/014_add_language_support.sql
```

Hoặc chạy trực tiếp trên Railway:
1. Vào project PostgreSQL
2. Click **Data** tab
3. Mở **Query**
4. Paste nội dung file `014_add_language_support.sql`
5. Execute

---

### BƯỚC 4: Cập nhật Frontend Vercel

#### 4.1 Kiểm tra biến môi trường Vercel
1. Truy cập: https://vercel.com/dashboard
2. Chọn project frontend
3. Vào **Settings** → **Environment Variables**
4. Đảm bảo có:

| Tên | Giá trị |
|-----|---------|
| `NEXT_PUBLIC_API_URL` | URL của Railway backend |

Ví dụ: `https://content-multiplier-dec01-production.up.railway.app`

#### 4.2 Redeploy
Sau khi push code, Vercel sẽ tự động deploy.
Hoặc vào **Deployments** → Click **Redeploy**

---

### BƯỚC 5: Kiểm Tra Hoạt Động

#### 5.1 Test Backend
```bash
# Health check
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Test languages endpoint
curl https://YOUR-RAILWAY-URL.up.railway.app/api/ideas/languages

# Test image status
curl https://YOUR-RAILWAY-URL.up.railway.app/api/images/status
```

#### 5.2 Test Frontend
Truy cập Vercel URL và kiểm tra:
1. Trang chủ load đúng
2. Vào `/ideas` - kiểm tra Language Selector
3. Thử tạo ý tưởng với ngôn ngữ khác nhau

---

## 🔧 THÔNG TIN KỸ THUẬT

### Cấu trúc Project

```
content-multiplier/
├── apps/
│   ├── api/                 # Backend (Fastify + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/     # API endpoints
│   │   │   ├── services/   # Business logic
│   │   │   └── middleware/ # Auth, rate-limit, etc.
│   │   └── package.json
│   │
│   └── web/                 # Frontend (Next.js + TypeScript)
│       ├── app/
│       │   ├── components/ # React components
│       │   ├── ideas/      # Ideas page
│       │   └── page.tsx    # Home page
│       └── package.json
│
├── infra/
│   └── migrations/          # SQL migrations
│
└── packages/                # Shared packages
```

### Các API Endpoints Chính

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/health` | GET | Health check |
| `/api/ideas` | GET | Lấy danh sách ý tưởng |
| `/api/ideas/generate` | POST | Tạo ý tưởng mới |
| `/api/ideas/languages` | GET | Danh sách ngôn ngữ |
| `/api/images/search` | GET | Tìm kiếm stock images |
| `/api/images/suggest` | GET | Gợi ý hình ảnh theo topic |

### Biến Môi Trường Backend

```env
# Database
DATABASE_URL=postgresql://...

# AI Models
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
GEMINI_API_KEY=...

# Stock Images
UNSPLASH_ACCESS_KEY=...
PEXELS_API_KEY=...

# Server
PORT=3001
```

### Biến Môi Trường Frontend

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
```

---

## 🐛 TROUBLESHOOTING

### Lỗi Push GitHub
```
Permission denied (publickey)
```
**Giải pháp**: Dùng HTTPS thay SSH và tạo Personal Access Token

### Lỗi Backend không phản hồi
1. Kiểm tra logs trên Railway Dashboard
2. Đảm bảo `DATABASE_URL` đúng
3. Kiểm tra PORT = 3001

### Lỗi Frontend không kết nối Backend
1. Kiểm tra `NEXT_PUBLIC_API_URL` trên Vercel
2. Đảm bảo CORS được cấu hình

### Lỗi tạo ý tưởng thất bại
1. Kiểm tra API keys (DeepSeek/OpenAI/Gemini)
2. Chạy migration database

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Railway Logs: https://railway.app → Project → Logs
2. Vercel Logs: https://vercel.com → Project → Functions → Logs
3. Database: Railway → PostgreSQL → Query tab

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Push code lên GitHub thành công
- [ ] Railway backend đang chạy
- [ ] Vercel frontend đang chạy
- [ ] Thêm UNSPLASH_ACCESS_KEY
- [ ] Thêm PEXELS_API_KEY (optional)
- [ ] Chạy migration 014
- [ ] Test tạo ý tưởng đa ngôn ngữ
- [ ] Test tìm kiếm hình ảnh

