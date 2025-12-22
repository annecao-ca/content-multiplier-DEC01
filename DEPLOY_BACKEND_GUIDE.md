# 🚀 Hướng Dẫn Deploy Backend cho Vercel Frontend

## Vấn Đề

Frontend trên Vercel (https://content-multiplier-dec-01.vercel.app) đang cố kết nối với `http://localhost:3001`, nhưng localhost chỉ tồn tại trên máy local, không phải trên Vercel.

## Giải Pháp

### Option 1: Deploy Backend lên Railway (Recommended)

**Bước 1: Tạo tài khoản Railway**
- Truy cập https://railway.app
- Đăng ký/đăng nhập với GitHub

**Bước 2: Deploy Backend**
```bash
# Từ thư mục root project
cd apps/api

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Deploy
railway up
```

**Bước 3: Set Environment Variables trên Railway**
Trong Railway Dashboard, thêm các biến:
```
DATABASE_URL=postgres://... (copy từ Railway PostgreSQL service)
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
JWT_SECRET=xxx
NODE_ENV=production
```

**Bước 4: Lấy Railway URL**
Railway sẽ cung cấp URL như: `https://your-api-xxx.railway.app`

**Bước 5: Cập nhật Vercel Environment Variables**
1. Vào Vercel Dashboard > Project Settings > Environment Variables
2. Thêm: `NEXT_PUBLIC_API_URL=https://your-api-xxx.railway.app`
3. Redeploy frontend

---

### Option 2: Deploy Backend lên Render

**Bước 1: Tạo tài khoản Render**
- Truy cập https://render.com
- Đăng ký với GitHub

**Bước 2: Create Web Service**
1. Click "New" > "Web Service"
2. Connect GitHub repo
3. Set:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

**Bước 3: Add Environment Variables trên Render**
```
DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
JWT_SECRET=xxx
NODE_ENV=production
```

**Bước 4: Get Render URL**
Render sẽ cung cấp URL như: `https://your-api.onrender.com`

**Bước 5: Update Vercel**
1. Vercel Dashboard > Project Settings > Environment Variables
2. Add: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
3. Redeploy

---

### Option 3: Deploy cả hai trên Railway

Railway hỗ trợ monorepo, bạn có thể deploy cả frontend và backend:

```bash
# Deploy API
cd apps/api
railway up

# Deploy Web (optional - có thể giữ Vercel)
cd apps/web
railway up
```

---

## Cấu Hình CORS

Sau khi có backend URL, cập nhật CORS trong `apps/api/src/index.ts`:

```typescript
await app.register(cors, {
    origin: [
        'http://localhost:3000',
        'http://localhost:3002',
        'https://content-multiplier-dec-01.vercel.app', // Thêm Vercel URL
        'https://*.vercel.app',
        /\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
})
```

---

## Kiểm Tra

Sau khi deploy, test API:
```bash
curl https://your-api-url.railway.app/api/health
```

Nếu trả về `{"status":"ok"}`, backend đã hoạt động!

---

## Tóm Tắt

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://content-multiplier-dec-01.vercel.app |
| Backend | Railway/Render | https://your-api-xxx.railway.app |
| Database | Railway/Supabase | postgres://... |

**Environment Variables trên Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-api-xxx.railway.app
```


