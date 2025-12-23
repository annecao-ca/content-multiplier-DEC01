# Multi-Language & Stock Image Setup Guide

## Đã hoàn thành ✅

Các tính năng sau đã được implement và test thành công:

### 1. Multi-Language Content Generation
- ✅ Hỗ trợ 3 ngôn ngữ: English (EN), Vietnamese (VI), French (FR)
- ✅ Language selector trên UI với cờ quốc gia
- ✅ API endpoint `/api/ideas/languages`
- ✅ Translation service để dịch nội dung

### 2. Stock Image Integration  
- ✅ Tích hợp Unsplash API
- ✅ Tích hợp Pexels API
- ✅ ImagePicker component
- ✅ API endpoints `/api/images/search`, `/api/images/suggest`

### 3. Database
- ✅ Migration 014 đã được apply thành công
- ✅ Cột `language` và `media` đã được thêm

---

## Bước tiếp theo để hoàn thiện

### Bước 1: Push code lên GitHub

Mở Terminal và chạy lệnh sau:

```bash
cd /Users/queeniecao/.cursor/worktrees/content-multiplier/hta

# Xác thực với GitHub (nếu cần)
git config credential.helper store

# Push code
git push origin HEAD:content-multiplier
```

Nếu được hỏi username/password:
- **Username**: GitHub username của bạn
- **Password**: Personal Access Token (không phải mật khẩu thường)

Tạo Personal Access Token tại: https://github.com/settings/tokens

### Bước 2: Thêm API keys trên Railway

1. Truy cập Railway Dashboard: https://railway.app/dashboard
2. Chọn project **content-multiplier-dec01**
3. Vào **Variables** tab
4. Thêm 2 biến môi trường mới:

| Key | Value | Nguồn |
|-----|-------|-------|
| `UNSPLASH_ACCESS_KEY` | (API key của bạn) | https://unsplash.com/developers |
| `PEXELS_API_KEY` | (API key của bạn) | https://www.pexels.com/api/ |

### Bước 3: Lấy API Keys (Miễn phí)

#### Unsplash API:
1. Truy cập https://unsplash.com/developers
2. Đăng ký tài khoản (nếu chưa có)
3. Tạo "New Application"
4. Copy "Access Key"

#### Pexels API:
1. Truy cập https://www.pexels.com/api/
2. Click "Get Started"
3. Đăng ký và xác nhận email
4. Copy API Key từ dashboard

### Bước 4: Redeploy Railway

Sau khi thêm API keys, Railway sẽ tự động redeploy.
Hoặc bạn có thể click "Redeploy" trong Railway dashboard.

---

## Test sau khi hoàn thành

### Test Multi-Language:
```bash
# Tạo ý tưởng tiếng Việt
curl -X POST https://content-multiplier-dec01-production.up.railway.app/api/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{"persona": "Marketing Manager", "industry": "SaaS", "count": 2, "language": "vi"}'

# Tạo ý tưởng tiếng Pháp  
curl -X POST https://content-multiplier-dec01-production.up.railway.app/api/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{"persona": "Marketing Manager", "industry": "SaaS", "count": 2, "language": "fr"}'
```

### Test Image Search:
```bash
# Kiểm tra trạng thái
curl https://content-multiplier-dec01-production.up.railway.app/api/images/status

# Tìm kiếm hình ảnh
curl "https://content-multiplier-dec01-production.up.railway.app/api/images/search?query=marketing&count=5"
```

---

## Sử dụng trên UI

1. Truy cập https://content-multiplier-dec-01.vercel.app/ideas
2. Chọn ngôn ngữ từ dropdown "Content Language"
3. Nhấn "Generate Ideas" 
4. Ý tưởng sẽ được tạo bằng ngôn ngữ đã chọn

---

## Cấu trúc file mới

```
apps/api/src/
├── services/
│   ├── image-service.ts      ✅ NEW
│   ├── translation.ts        ✅ NEW
│   └── idea-generator.ts     ✅ UPDATED
├── routes/
│   ├── images.ts             ✅ NEW
│   └── ideas.ts              ✅ UPDATED
└── env.ts                    ✅ UPDATED

apps/web/app/
├── components/
│   ├── ImagePicker.tsx       ✅ NEW
│   └── LanguageSelector.tsx  ✅ NEW
├── ideas/
│   └── page.tsx              ✅ UPDATED
└── translations.ts           ✅ UPDATED (thêm French)

infra/migrations/
└── 014_add_language_support.sql  ✅ NEW & APPLIED
```

