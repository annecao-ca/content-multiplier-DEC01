# ⚡ Quick Start - Tính năng sinh ý tưởng AI

## 🎉 TẤT CẢ ĐÃ SẴN SÀNG!

**Tin tốt:** Tất cả code đã được implement! Bạn chỉ cần chạy là xong! 🚀

---

## 🚀 Chạy ngay (30 giây)

### 1. Setup API Keys

```bash
# Mở file .env và thêm OpenAI API key
cd /Users/queeniecao/content-multiplier-git/content-multiplier
nano .env
```

Thêm dòng này:
```
OPENAI_API_KEY=sk-your-key-here
```

### 2. Start Backend

```bash
cd apps/api
npm run dev
```

### 3. Start Frontend

```bash
# Terminal mới
cd apps/web
npm run dev
```

### 4. Mở trình duyệt

```
http://localhost:3000/ideas-demo
```

---

## 🎯 Sử dụng

1. Click nút **"🚀 Generate Ideas"** (màu xanh lá)
2. Nhập:
   - **Persona:** Marketing Manager
   - **Industry:** SaaS
3. Click **"Generate Ideas"**
4. Đợi 5-10 giây (Loading spinner)
5. Xem 10 ý tưởng mới! ✅

---

## 📁 Files quan trọng

### Backend:
```
packages/utils/ai-client.ts          → LLMClient class
apps/api/src/routes/ideas.ts         → POST /api/ideas/generate
apps/api/src/services/idea-generator.ts → Generate service
```

### Frontend:
```
apps/web/components/ideas/GenerateIdeasButton.tsx → Generate button
apps/web/components/ideas/IdeaList.tsx            → Display ideas
apps/web/app/ideas-demo/page.tsx                  → Demo page
```

---

## ✅ Checklist tính năng

- [x] ✅ LLMClient với OpenAI, Gemini, Anthropic, DeepSeek
- [x] ✅ Endpoint POST /api/ideas/generate
- [x] ✅ AJV validation
- [x] ✅ Retry logic (max 3 lần, exponential backoff)
- [x] ✅ Lưu vào PostgreSQL
- [x] ✅ Form nhập persona, industry
- [x] ✅ Nút "Generate Ideas"
- [x] ✅ Loading spinner
- [x] ✅ Error handling
- [x] ✅ Display 10 ideas
- [x] ✅ Toast notifications

**TẤT CẢ ĐÃ XONG!** 🎊

---

## 🧪 Test nhanh

### Test Backend API:

```bash
curl -X POST http://localhost:3001/api/ideas/generate \
  -H "Content-Type: application/json" \
  -H "x-user-id: test" \
  -H "x-user-role: CL" \
  -d '{
    "persona": "Marketing Manager",
    "industry": "SaaS",
    "count": 5
  }'
```

### Test Frontend:

1. Mở: `http://localhost:3000/ideas-demo`
2. Click "Generate Ideas"
3. Fill form
4. Generate
5. Xem kết quả

---

## 📖 Docs đầy đủ

Xem chi tiết tại:

- **COMPLETE-FEATURE-GUIDE.md** - Full guide (2000+ lines)
- **COMPONENTS-GUIDE.md** - UI components API
- **DEPENDENCIES-SUMMARY.md** - Dependencies details
- **ALL-DOCS-INDEX.md** - Tổng hợp tất cả docs

---

## 💡 Example Usage

### Backend API Call:

```typescript
const response = await fetch('/api/ideas/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user-123',
    'x-user-role': 'CL'
  },
  body: JSON.stringify({
    persona: 'Marketing Manager',
    industry: 'SaaS',
    count: 10,
    temperature: 0.8
  })
});

const data = await response.json();
console.log(data.ideas); // Array of 10 ideas
```

### Frontend Component:

```tsx
import GenerateIdeasButton from './components/ideas/GenerateIdeasButton';

<GenerateIdeasButton
  onGenerate={async (params) => {
    const res = await fetch('/api/ideas/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    // Handle response
  }}
  loading={false}
  error={null}
/>
```

---

## 🔧 Troubleshooting

### Lỗi: "OPENAI_API_KEY not found"
→ Thêm API key vào file `.env`

### Lỗi: "Port 3001 already in use"
→ Kill process: `lsof -ti:3001 | xargs kill -9`

### Lỗi: "Database connection failed"
→ Start PostgreSQL: `docker compose -f infra/docker-compose.yml up -d`

### Frontend không connect được backend
→ Check backend đang chạy: `curl http://localhost:3001/api/ideas`

---

## 🎉 Hoàn tất!

**Tất cả đã sẵn sàng sử dụng!**

Chỉ cần:
1. ✅ Add API key vào `.env`
2. ✅ Run backend (`npm run dev`)
3. ✅ Run frontend (`npm run dev`)
4. ✅ Open browser → Generate ideas!

**Enjoy! 🚀✨**

---

**Questions?** Xem [COMPLETE-FEATURE-GUIDE.md](COMPLETE-FEATURE-GUIDE.md) để biết thêm chi tiết!

