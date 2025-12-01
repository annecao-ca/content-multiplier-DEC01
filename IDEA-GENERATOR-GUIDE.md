# 💡 IDEA GENERATOR - Hướng dẫn sử dụng

## 🎯 Tổng quan

Module **Idea Generator** giúp sinh ra content ideas tự động từ AI dựa trên:
- **Persona** (đối tượng khách hàng)
- **Industry** (ngành nghề)
- **Corpus hints** (gợi ý chủ đề)

### Tính năng chính:

✅ AI sinh 10 ý tưởng nội dung chất lượng cao  
✅ Retry mechanism (tự động thử lại 3 lần nếu lỗi)  
✅ Temperature control (điều chỉnh độ sáng tạo)  
✅ Hỗ trợ tiếng Anh và tiếng Việt  
✅ Tự động lưu vào database  
✅ Token tracking và metadata  

---

## 📝 Files đã tạo

```
✅ apps/api/src/services/idea-generator.ts (400+ dòng)
   → Service chính để generate ideas

✅ apps/api/src/routes/ideas.ts (updated)
   → API endpoint /api/ideas/generate

✅ test-idea-generator.ts (200+ dòng)
   → File test và demo

✅ IDEA-GENERATOR-GUIDE.md (file này)
   → Hướng dẫn đầy đủ
```

---

## 🚀 Quick Start

### 1. Đảm bảo backend đang chạy

```bash
cd apps/api
npm run dev
```

Backend sẽ chạy tại `http://localhost:3001`

### 2. Test ngay bằng curl

```bash
curl -X POST http://localhost:3001/api/ideas/generate \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -H "x-user-role: CL" \
  -d '{
    "persona": "Marketing Manager at B2B SaaS",
    "industry": "SaaS",
    "corpus_hints": "AI, automation, productivity",
    "count": 5,
    "temperature": 0.8
  }'
```

### 3. Hoặc test bằng file test

```bash
npx tsx test-idea-generator.ts
```

---

## 📖 API Reference

### POST `/api/ideas/generate`

Sinh ra content ideas từ AI.

#### Request Headers

```
Content-Type: application/json
x-user-id: [user_id]
x-user-role: [CL|WR|MOps|...]
```

#### Request Body

```typescript
{
  persona: string;          // Bắt buộc: Đối tượng khách hàng
  industry: string;         // Bắt buộc: Ngành nghề
  corpus_hints?: string;    // Tùy chọn: Gợi ý chủ đề
  language?: 'en' | 'vn';   // Tùy chọn: Ngôn ngữ (mặc định: 'en')
  count?: number;           // Tùy chọn: Số lượng ideas (mặc định: 10)
  temperature?: number;     // Tùy chọn: Độ sáng tạo 0.0-2.0 (mặc định: 0.8)
}
```

#### Response

```typescript
{
  ok: true,
  ideas: [
    {
      idea_id: string;
      one_liner: string;
      angle?: string;
      personas: string[];
      why_now: string[];
      evidence: Array<{
        title?: string;
        url: string;
        quote: string;
      }>;
      scores: {
        novelty: number;      // 0-5
        demand: number;       // 0-5
        fit: number;          // 0-5
        white_space: number;  // 0-5
      };
      status: 'proposed' | 'selected' | 'discarded';
      tags?: string[];
    }
  ],
  metadata: {
    generated: number;        // Số ideas được tạo
    saved: number;           // Số ideas được lưu
    provider: string;        // AI provider (openai, gemini, etc.)
    model: string;           // Model được dùng
    tokensUsed?: {           // Token usage
      prompt: number;
      completion: number;
      total: number;
    };
    durationMs: number;      // Thời gian thực hiện
  }
}
```

---

## 💻 Ví dụ sử dụng

### Ví dụ 1: Basic usage (JavaScript/TypeScript)

```typescript
async function generateIdeas() {
  const response = await fetch('http://localhost:3001/api/ideas/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'user-123',
      'x-user-role': 'CL'
    },
    body: JSON.stringify({
      persona: 'Startup Founder in Tech',
      industry: 'Technology',
      corpus_hints: 'AI, SaaS, Startup Growth'
    })
  });
  
  const data = await response.json();
  
  console.log(`Generated ${data.ideas.length} ideas`);
  data.ideas.forEach(idea => {
    console.log(`- ${idea.one_liner}`);
  });
}
```

### Ví dụ 2: Với temperature control

```typescript
// Conservative (ít sáng tạo, chính xác hơn)
const conservativeIdeas = await generateIdeas({
  persona: 'CFO at Enterprise',
  industry: 'Finance',
  temperature: 0.3
});

// Balanced (cân bằng)
const balancedIdeas = await generateIdeas({
  persona: 'Marketing Manager',
  industry: 'E-commerce',
  temperature: 0.7
});

// Creative (rất sáng tạo)
const creativeIdeas = await generateIdeas({
  persona: 'Content Creator',
  industry: 'Media',
  temperature: 1.2
});
```

### Ví dụ 3: Tiếng Việt

```typescript
const response = await fetch('http://localhost:3001/api/ideas/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user-123',
    'x-user-role': 'CL'
  },
  body: JSON.stringify({
    persona: 'Giám đốc Marketing tại công ty Fintech',
    industry: 'Fintech',
    corpus_hints: 'Thanh toán số, ví điện tử, blockchain',
    language: 'vn',
    count: 10,
    temperature: 0.8
  })
});
```

### Ví dụ 4: Từ Frontend (React)

```tsx
import { useState } from 'react';

function IdeaGenerator() {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  
  const [formData, setFormData] = useState({
    persona: '',
    industry: '',
    corpus_hints: '',
    count: 10,
    temperature: 0.8
  });
  
  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setIdeas(data.ideas);
        alert(`Generated ${data.ideas.length} ideas!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Generate Content Ideas</h2>
      
      <input
        placeholder="Persona (e.g., Marketing Manager)"
        value={formData.persona}
        onChange={e => setFormData({...formData, persona: e.target.value})}
      />
      
      <input
        placeholder="Industry (e.g., SaaS)"
        value={formData.industry}
        onChange={e => setFormData({...formData, industry: e.target.value})}
      />
      
      <input
        placeholder="Corpus hints (optional)"
        value={formData.corpus_hints}
        onChange={e => setFormData({...formData, corpus_hints: e.target.value})}
      />
      
      <label>
        Temperature: {formData.temperature}
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={formData.temperature}
          onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
        />
      </label>
      
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Ideas'}
      </button>
      
      <div>
        {ideas.map((idea, i) => (
          <div key={i}>
            <h3>{idea.one_liner}</h3>
            <p>Personas: {idea.personas.join(', ')}</p>
            <p>Scores: Novelty={idea.scores.novelty}, Demand={idea.scores.demand}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Temperature Guide

Temperature điều khiển độ sáng tạo của AI:

| Temperature | Phong cách | Khi nào dùng |
|-------------|-----------|--------------|
| **0.0 - 0.3** | Conservative, Deterministic | Content factual, data-driven, B2B formal |
| **0.4 - 0.7** | Balanced | General content, blog posts, articles |
| **0.8 - 1.0** | Creative | Brainstorming, creative content, social media |
| **1.1 - 1.5** | Very Creative | Experimental, out-of-the-box ideas |
| **1.6 - 2.0** | Extreme | Testing, exploration (có thể không consistent) |

### Ví dụ:

```typescript
// Cho CFO/CEO (factual, professional)
temperature: 0.2

// Cho Marketing Manager (balanced)
temperature: 0.7

// Cho Content Creator (creative)
temperature: 1.1

// Brainstorming session (very creative)
temperature: 1.4
```

---

## 📊 Ý tưởng được tạo có gì?

Mỗi ý tưởng bao gồm:

### 1. **idea_id** (string)
ID duy nhất (ví dụ: `idea-123e4567-e89b-12d3-a456-426614174000`)

### 2. **one_liner** (string)
Tiêu đề ngắn gọn, hấp dẫn (50-80 ký tự)

Ví dụ:
- "How AI is Transforming B2B SaaS Onboarding in 2025"
- "5 Automation Mistakes Killing Your Startup's Productivity"

### 3. **angle** (string, optional)
Góc nhìn độc đáo

Ví dụ: "Focus on the hidden costs of manual processes that most startups ignore"

### 4. **personas** (string[])
Đối tượng mục tiêu cụ thể

Ví dụ: `["Marketing Manager at B2B SaaS, 30-40 years old", "Startup Founder"]`

### 5. **why_now** (string[])
Lý do tại sao ý tưởng này phù hợp ngay bây giờ

Ví dụ:
- "AI adoption in SaaS increased 300% in 2024"
- "Remote work creating demand for automation tools"

### 6. **evidence** (array)
Bằng chứng hỗ trợ từ nguồn tin đáng tin

```typescript
[
  {
    title: "2024 SaaS Trends Report",
    url: "https://example.com/report",
    quote: "78% of SaaS companies invested in AI in 2024"
  }
]
```

### 7. **scores** (object)
Đánh giá khách quan (0-5)

```typescript
{
  novelty: 4,        // Độ mới lạ, độc đáo
  demand: 5,         // Nhu cầu thị trường
  fit: 4,            // Phù hợp với persona/industry
  white_space: 3     // Khoảng trống cạnh tranh
}
```

### 8. **status** (enum)
- `proposed` - Ý tưởng mới
- `selected` - Đã chọn để phát triển
- `discarded` - Từ chối

### 9. **tags** (string[], optional)
Tags phân loại

Ví dụ: `["AI", "SaaS", "Automation", "Productivity"]`

---

## 🔧 Cách tích hợp vào Frontend hiện tại

### Bước 1: Update Ideas Page

File: `apps/web/app/ideas/page.tsx`

```tsx
'use client';

import { useState } from 'react';

export default function IdeasPage() {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  
  const [persona, setPersona] = useState('');
  const [industry, setIndustry] = useState('');
  const [corpusHints, setCorpusHints] = useState('');
  const [count, setCount] = useState(10);
  const [temperature, setTemperature] = useState(0.8);
  
  const handleGenerate = async () => {
    if (!persona || !industry) {
      alert('Please enter persona and industry');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          persona,
          industry,
          corpus_hints: corpusHints,
          count,
          temperature
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setIdeas(data.ideas);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Content Ideas</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Persona *
            </label>
            <input
              type="text"
              placeholder="e.g., Marketing Manager at B2B SaaS"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Industry *
            </label>
            <input
              type="text"
              placeholder="e.g., SaaS, E-commerce, Fintech"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Topic Hints (optional)
          </label>
          <input
            type="text"
            placeholder="e.g., AI, automation, productivity"
            value={corpusHints}
            onChange={(e) => setCorpusHints(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Ideas: {count}
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Temperature: {temperature.toFixed(1)} 
              {temperature < 0.5 ? ' (Conservative)' : temperature < 0.9 ? ' (Balanced)' : ' (Creative)'}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={loading || !persona || !industry}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? '🔄 Generating...' : '🚀 Generate Ideas'}
        </button>
      </div>
      
      {ideas.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Generated {ideas.length} Ideas
          </h2>
          
          <div className="grid gap-4">
            {ideas.map((idea, index) => (
              <div key={idea.idea_id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">
                  {index + 1}. {idea.one_liner}
                </h3>
                
                {idea.angle && (
                  <p className="text-gray-600 mb-3">{idea.angle}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {idea.tags?.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Novelty:</span> {idea.scores.novelty}/5
                  </div>
                  <div>
                    <span className="font-medium">Demand:</span> {idea.scores.demand}/5
                  </div>
                  <div>
                    <span className="font-medium">Fit:</span> {idea.scores.fit}/5
                  </div>
                  <div>
                    <span className="font-medium">White Space:</span> {idea.scores.white_space}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Lỗi: "Missing required fields"

```json
{
  "ok": false,
  "error": "Missing required fields: persona and industry"
}
```

**Fix**: Đảm bảo gửi cả `persona` và `industry` trong request body.

### Lỗi: "API key not configured"

```json
{
  "ok": false,
  "error": "API key not configured for provider: openai"
}
```

**Fix**: Set API key trong `.env` hoặc qua Settings page.

### Lỗi: "Failed to generate ideas"

**Possible causes:**
1. Rate limit (quá nhiều requests)
2. Invalid API key
3. Network timeout

**Fix**: Kiểm tra logs trong backend console.

### Lỗi: "No valid ideas generated"

AI trả về nhưng không có ý tưởng hợp lệ.

**Fix**: 
- Thử tăng `temperature`
- Thử prompt cụ thể hơn
- Kiểm tra model có support JSON mode không

---

## 📈 Performance Tips

### 1. Optimize số lượng ideas

```typescript
// ❌ Bad: Tạo quá nhiều
{ count: 50 }  // Chậm, tốn tokens

// ✅ Good: Số lượng hợp lý
{ count: 10 }  // Fast, cost-effective
```

### 2. Cache results

```typescript
// Cache ideas để tránh gọi lại
const cachedIdeas = localStorage.getItem('ideas');
if (cachedIdeas) {
  return JSON.parse(cachedIdeas);
}
```

### 3. Batch processing

Nếu cần nhiều sets of ideas, gọi song song:

```typescript
const [saasIdeas, ecommerceIdeas, fintechIdeas] = await Promise.all([
  generateIdeas({ persona: '...', industry: 'SaaS' }),
  generateIdeas({ persona: '...', industry: 'E-commerce' }),
  generateIdeas({ persona: '...', industry: 'Fintech' })
]);
```

---

## 💰 Cost Estimation

Ước tính cost cho mỗi lần generate (OpenAI GPT-4o-mini):

| Ideas | Tokens | Cost |
|-------|--------|------|
| 5 ideas | ~2,000 | $0.0002 |
| 10 ideas | ~3,500 | $0.0004 |
| 20 ideas | ~6,000 | $0.0007 |

**Note**: Costs có thể thay đổi tùy provider và model.

---

## 📚 Related Documentation

- **AI Client**: `packages/utils/AI-CLIENT-README.md`
- **API Routes**: `apps/api/src/routes/ideas.ts`
- **Service**: `apps/api/src/services/idea-generator.ts`
- **Test**: `test-idea-generator.ts`

---

## 🎉 Summary

Bạn đã có một **Idea Generator** hoàn chỉnh với:

✅ AI sinh ideas tự động  
✅ Retry mechanism  
✅ Temperature control  
✅ Lưu vào database  
✅ Token tracking  
✅ Full documentation  

**Happy Generating! 🚀**

