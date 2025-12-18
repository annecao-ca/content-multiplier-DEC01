# 🔑 Hướng dẫn lấy Gemini API Key

## ✅ API Key hiện tại của bạn

Từ file `.env`, API key của bạn là:
```
GEMINI_API_KEY=AIzaSyA0dVcAwPfF790eFN0x_sF6b8vQS_EepUo
```

**Status:** ✅ **API Key hoạt động tốt!**

Tôi đã test và verify:
- ✅ API key format đúng (bắt đầu bằng `AIzaSy...`)
- ✅ Có quyền truy cập Gemini API
- ✅ List models thành công
- ✅ Generate content thành công

---

## 🔍 Kiểm tra API Key

### Test nhanh:

```bash
# Test list models
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"

# Nếu thấy danh sách models → API key đúng ✅
# Nếu thấy lỗi 403/401 → API key sai ❌
```

### Test generate:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello"}]
    }]
  }'
```

---

## 📝 Cách lấy API Key mới (nếu cần)

### Bước 1: Truy cập Google AI Studio

**Link 1 (Khuyến nghị):**
```
https://aistudio.google.com/app/apikey
```

**Link 2 (Google Cloud Console):**
```
https://console.cloud.google.com/apis/credentials
```

### Bước 2: Đăng nhập

- Đăng nhập bằng Google Account của bạn
- Chọn hoặc tạo Google Cloud Project

### Bước 3: Tạo API Key

1. Click **"Create API Key"** hoặc **"+ Create credentials"**
2. Chọn project:
   - **"Create API key in existing project"** (nếu đã có project)
   - **"Create API key in new project"** (nếu tạo mới)
3. **Copy API key** (dạng: `AIzaSy...` khoảng 39 ký tự)

### Bước 4: (Optional) Set Restrictions

1. Click vào API key vừa tạo
2. **Application restrictions:**
   - **None** (cho development)
   - **IP addresses** (cho production)
3. **API restrictions:**
   - **Restrict key** → Chọn **"Generative Language API"**
4. **Save**

### Bước 5: Thêm vào .env

```bash
# Mở file .env
nano /Users/queeniecao/content-multiplier-git/content-multiplier/.env

# Thay dòng:
GEMINI_API_KEY=AIzaSyA0dVcAwPfF790eFN0x_sF6b8vQS_EepUo

# Thành API key mới:
GEMINI_API_KEY=AIzaSy...your-new-key...

# Save: Ctrl+X → Y → Enter
```

### Bước 6: Restart Backend

```bash
# Kill backend
lsof -ti:3001 | xargs kill -9

# Start lại
cd apps/api && npm run dev
```

---

## ⚠️ Lưu ý quan trọng

### Format đúng của API Key:

✅ **Đúng:**
- `AIzaSyA0dVcAwPfF790eFN0x_sF6b8vQS_EepUo` (39 ký tự)
- Bắt đầu bằng `AIzaSy...`
- Chứa chữ, số, và dấu gạch dưới

❌ **Sai:**
- `AlzaSy...` (chữ `l` thường thay vì `I`)
- `sk-...` (đây là OpenAI key)
- `sk-ant-...` (đây là Anthropic key)
- Quá ngắn (< 30 ký tự)
- Có khoảng trắng

### Enable API:

Đảm bảo **Generative Language API** đã được enable:

1. Vào: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Chọn project của bạn
3. Click **"ENABLE"**
4. Đợi vài giây

### Quota & Limits:

**Free Tier:**
- ✅ 2 triệu tokens/ngày
- ✅ 60 requests/phút
- ✅ Không cần thẻ tín dụng
- ✅ Không giới hạn thời gian

**Rate Limits:**
- Requests per minute: 60
- Requests per day: 1,500
- Tokens per minute: 1,000,000
- Tokens per day: 2,000,000

---

## 🧪 Verify API Key

### Test script:

```bash
# Test API key
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY" | python3 -m json.tool

# Nếu thấy:
# {
#   "models": [
#     {
#       "name": "models/gemini-2.5-flash",
#       ...
#     }
#   ]
# }
# → ✅ API key đúng!

# Nếu thấy:
# {
#   "error": {
#     "code": 403,
#     "message": "API key not valid..."
#   }
# }
# → ❌ API key sai hoặc chưa enable API
```

---

## 🔧 Troubleshooting

### Lỗi: "API key not valid"

**Nguyên nhân:**
1. API key sai format
2. API chưa được enable
3. API key bị restrict (IP, domain, etc.)

**Cách fix:**
1. Kiểm tra format: Phải bắt đầu bằng `AIzaSy...`
2. Enable API: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
3. Remove restrictions: Vào API key settings → Set "None" cho restrictions

### Lỗi: "Quota exceeded"

**Nguyên nhân:**
- Đã dùng hết quota free tier (2M tokens/ngày)

**Cách fix:**
1. Đợi đến ngày mai (quota reset)
2. Upgrade lên paid plan
3. Tạo API key mới (nếu có nhiều Google accounts)

### Lỗi: "Permission denied"

**Nguyên nhân:**
- API key không có quyền truy cập Generative Language API

**Cách fix:**
1. Vào API key settings
2. **API restrictions** → Chọn **"Don't restrict key"** hoặc thêm **"Generative Language API"**

---

## 📊 So sánh API Keys

| Provider | Format | Free Tier | Card Required? |
|----------|--------|-----------|----------------|
| **Gemini** | `AIzaSy...` | 2M tokens/day | ❌ No |
| OpenAI | `sk-...` | $5 credit | ✅ Yes |
| Anthropic | `sk-ant-...` | Limited | ✅ Yes |
| DeepSeek | `sk-...` | Free API | ❌ No |

**→ Gemini là lựa chọn tốt nhất cho free tier!** 🏆

---

## ✅ Kết luận

**API Key của bạn:**
- ✅ Format đúng
- ✅ Hoạt động tốt
- ✅ Có quyền truy cập Gemini API

**Vấn đề hiện tại KHÔNG phải do API key!**

Vấn đề là **JSON parsing** - response từ Gemini bị cắt ngắn (incomplete JSON). Tôi đã cải thiện parsing logic với 7 strategies để extract ideas từ incomplete JSON.

**Hãy test lại và xem backend console logs để debug tiếp!** 😊

---

**Questions?** Xem backend console logs hoặc test API key trực tiếp với curl commands ở trên!

























