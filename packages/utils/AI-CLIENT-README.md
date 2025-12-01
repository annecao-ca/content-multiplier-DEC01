# 🤖 AI Client - Universal LLM Integration

Module tích hợp đa nhà cung cấp AI với retry mechanism, temperature control, và JSON mode.

## 🎯 Tính năng

✅ **Hỗ trợ 5 providers**: OpenAI, Gemini, Anthropic, DeepSeek, Grok  
✅ **Retry mechanism**: Tự động retry tối đa 3 lần khi gặp lỗi  
✅ **Temperature control**: Điều chỉnh độ sáng tạo từ 0.0 - 2.0  
✅ **JSON mode**: Bắt buộc AI trả về JSON hợp lệ  
✅ **Batch processing**: Xử lý nhiều prompts song song  
✅ **Token tracking**: Theo dõi số tokens sử dụng  
✅ **Error handling**: Xử lý lỗi chi tiết với exponential backoff  

---

## 📦 Cài đặt

```bash
cd packages/utils
npm install
```

**Dependencies được cài tự động:**
- `openai` - OpenAI SDK
- `@anthropic-ai/sdk` - Anthropic Claude SDK
- `@google/generative-ai` - Google Gemini SDK

---

## 🚀 Quick Start

### 1. Cấu hình API Keys

Thêm vào file `.env`:

```bash
# Chọn ít nhất 1 provider
OPENAI_API_KEY=sk-xxx...
GEMINI_API_KEY=xxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
DEEPSEEK_API_KEY=sk-xxx...
GROK_API_KEY=xai-xxx...
```

### 2. Sử dụng cơ bản

```typescript
import { AIClient } from './packages/utils/ai-client';

const client = new AIClient();

const response = await client.complete({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    prompt: 'Viết một bài blog về AI (100 từ)',
    temperature: 0.7
});

console.log(response.content);
```

---

## 📖 API Reference

### `AIClient`

Class chính để gọi AI với retry mechanism.

#### Constructor

```typescript
new AIClient(retryConfig?: Partial<RetryConfig>)
```

**RetryConfig:**
```typescript
{
    maxRetries: number;        // Mặc định: 3
    initialDelay: number;      // Mặc định: 1000ms
    maxDelay: number;          // Mặc định: 10000ms
    backoffMultiplier: number; // Mặc định: 2
}
```

#### Methods

##### `complete(request: AIRequest): Promise<AIResponse>`

Gọi AI với retry logic.

**AIRequest:**
```typescript
{
    provider: 'openai' | 'gemini' | 'anthropic' | 'deepseek' | 'grok';
    apiKey: string;
    model?: string;           // Mặc định: model tốt nhất của provider
    prompt: string;
    systemPrompt?: string;
    temperature?: number;     // 0.0 - 2.0, mặc định: 0.7
    maxTokens?: number;
    jsonMode?: boolean;       // Bắt buộc trả JSON
    stream?: boolean;         // Streaming (chưa support)
}
```

**AIResponse:**
```typescript
{
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: {
        prompt: number;
        completion: number;
        total: number;
    };
    finishReason?: string;
}
```

##### `testConnection(provider, apiKey): Promise<boolean>`

Test xem API key có hoạt động không.

```typescript
const isValid = await client.testConnection('openai', 'sk-xxx');
console.log(isValid ? 'Valid' : 'Invalid');
```

---

### Helper Functions

#### `generateContent()`

Quick helper để gọi AI một cách đơn giản.

```typescript
import { generateContent } from './packages/utils/ai-client';

const content = await generateContent(
    'openai',
    process.env.OPENAI_API_KEY!,
    'Viết về AI',
    {
        temperature: 0.8,
        maxTokens: 500,
        jsonMode: false
    }
);
```

#### `generateBatch()`

Xử lý nhiều prompts song song.

```typescript
import { generateBatch } from './packages/utils/ai-client';

const prompts = [
    'Viết slogan cho AI company',
    'Viết slogan cho Fintech company',
    'Viết slogan cho EdTech company'
];

const results = await generateBatch(
    'openai',
    process.env.OPENAI_API_KEY!,
    prompts,
    {
        temperature: 0.9,
        concurrency: 2  // Chạy 2 requests song song
    }
);
```

---

## 🎨 Ví dụ sử dụng

### Ví dụ 1: Điều chỉnh Temperature

```typescript
// Temperature thấp = Deterministic, ít sáng tạo
const conservative = await generateContent('openai', apiKey, prompt, {
    temperature: 0.1
});

// Temperature cao = Creative, nhiều biến thể
const creative = await generateContent('openai', apiKey, prompt, {
    temperature: 1.5
});
```

**Hướng dẫn chọn temperature:**
- `0.0 - 0.3`: Factual content, code, data analysis
- `0.4 - 0.7`: Balanced, general content
- `0.8 - 1.2`: Creative writing, brainstorming
- `1.3 - 2.0`: Experimental, very creative

### Ví dụ 2: JSON Mode

```typescript
const response = await client.complete({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    prompt: `Tạo content plan với format:
    {
        "title": "...",
        "posts": [
            { "day": "Monday", "content": "..." }
        ]
    }`,
    jsonMode: true
});

const data = JSON.parse(response.content);
console.log(data.title);
```

### Ví dụ 3: System Prompt

```typescript
const systemPrompt = `Bạn là content writer chuyên nghiệp.
Tone: friendly, engaging.
Luôn có ví dụ cụ thể.`;

const content = await generateContent('openai', apiKey, prompt, {
    systemPrompt,
    temperature: 0.7
});
```

### Ví dụ 4: So sánh Providers

```typescript
const prompt = 'Viết về AI trong marketing';

const providers = ['openai', 'gemini', 'anthropic', 'deepseek'];

for (const provider of providers) {
    const start = Date.now();
    const content = await generateContent(
        provider,
        getApiKey(provider),
        prompt
    );
    console.log(`${provider}: ${Date.now() - start}ms`);
    console.log(content);
}
```

### Ví dụ 5: Custom Retry Config

```typescript
const client = new AIClient({
    maxRetries: 5,           // Thử 5 lần
    initialDelay: 500,       // Delay đầu 500ms
    maxDelay: 10000,         // Max 10s
    backoffMultiplier: 2     // Tăng gấp đôi mỗi lần
});

// Delays: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
```

### Ví dụ 6: Error Handling

```typescript
try {
    const response = await client.complete({
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        prompt: 'Generate content',
        temperature: 0.7
    });
    
    console.log(response.content);
    
} catch (error: any) {
    if (error.message.includes('API key')) {
        console.error('Invalid API key');
    } else if (error.message.includes('rate limit')) {
        console.error('Rate limit exceeded');
    } else if (error.message.includes('timeout')) {
        console.error('Request timeout');
    } else {
        console.error('Unknown error:', error.message);
    }
}
```

---

## 🎯 Use Cases

### 1. Tạo Content Ideas

```typescript
const response = await client.complete({
    provider: 'openai',
    apiKey: apiKey,
    systemPrompt: 'You are a content strategist.',
    prompt: 'Generate 10 blog post ideas about AI in healthcare. Return as JSON array.',
    jsonMode: true,
    temperature: 0.9  // Creative
});

const ideas = JSON.parse(response.content);
```

### 2. Viết Blog Post

```typescript
const blogPost = await generateContent(
    'anthropic',
    apiKey,
    'Write a 500-word blog post about AI trends in 2025',
    {
        systemPrompt: 'Professional tech writer. Use examples and data.',
        temperature: 0.7,
        maxTokens: 1500
    }
);
```

### 3. Tạo Social Media Content

```typescript
const platforms = ['Twitter', 'LinkedIn', 'Facebook'];

const posts = await generateBatch(
    'openai',
    apiKey,
    platforms.map(p => `Create a post for ${p} about AI in marketing`),
    {
        temperature: 0.8,
        concurrency: 3
    }
);
```

### 4. SEO Optimization

```typescript
const seoData = await client.complete({
    provider: 'openai',
    apiKey: apiKey,
    prompt: `Analyze this article and provide SEO recommendations:
    
    [Article content...]
    
    Return JSON: {
        "keywords": [...],
        "metaDescription": "...",
        "title": "...",
        "improvements": [...]
    }`,
    jsonMode: true,
    temperature: 0.3  // Factual
});
```

### 5. Content Translation

```typescript
const translated = await generateContent(
    'gemini',
    apiKey,
    `Translate to Vietnamese (maintain tone and style):
    
    ${englishContent}`,
    {
        temperature: 0.2  // Precise
    }
);
```

---

## ⚙️ Default Models

Mỗi provider có model mặc định tối ưu:

| Provider | Default Model | Notes |
|----------|--------------|-------|
| OpenAI | `gpt-4o-mini` | Fast, cost-effective |
| Gemini | `gemini-1.5-flash` | Fast, free tier |
| Anthropic | `claude-3-5-sonnet-20241022` | Best reasoning |
| DeepSeek | `deepseek-chat` | Fast, affordable |
| Grok | `grok-beta` | X.AI's model |

**Custom model:**
```typescript
await client.complete({
    provider: 'openai',
    model: 'gpt-4o',  // Override default
    // ...
});
```

---

## 🔍 Retry Logic

Retry tự động khi gặp:
- ✅ Rate limit (429)
- ✅ Server errors (500, 502, 503, 504)
- ✅ Timeout errors
- ✅ Network errors (ECONNRESET, ETIMEDOUT)

**Không retry:**
- ❌ Invalid API key (401)
- ❌ Invalid request (400)
- ❌ Permission denied (403)

**Exponential backoff:**
```
Attempt 1: 1000ms
Attempt 2: 2000ms
Attempt 3: 4000ms
```

---

## 📊 Token Tracking

Mỗi response trả về thông tin tokens:

```typescript
const response = await client.complete({...});

console.log(response.tokensUsed);
// {
//   prompt: 50,
//   completion: 200,
//   total: 250
// }
```

**Estimate cost:**
```typescript
const costPerToken = 0.00001; // OpenAI GPT-4o-mini
const cost = response.tokensUsed!.total * costPerToken;
console.log(`Cost: $${cost.toFixed(4)}`);
```

---

## 🚨 Error Handling

### Common Errors

#### 1. Invalid API Key
```
Error: Failed after 1 attempts. Last error: Invalid API key
```
**Fix:** Kiểm tra API key trong `.env`

#### 2. Rate Limit
```
Error: Rate limit exceeded
```
**Fix:** Đợi hoặc upgrade plan

#### 3. Token Limit
```
Error: Maximum context length exceeded
```
**Fix:** Giảm `maxTokens` hoặc rút gọn prompt

#### 4. JSON Parse Error
```
Error: Invalid JSON response
```
**Fix:** Thêm instruction rõ ràng hơn trong prompt

---

## 🎓 Best Practices

### 1. **Chọn Provider phù hợp**
- OpenAI: General-purpose, reliable
- Gemini: Fast, có free tier
- Anthropic: Reasoning tasks, long context
- DeepSeek: Cost-effective, code generation
- Grok: Conversational, real-time

### 2. **Optimize Temperature**
```typescript
// Factual content
{ temperature: 0.1 - 0.3 }

// General content
{ temperature: 0.5 - 0.7 }

// Creative writing
{ temperature: 0.8 - 1.2 }
```

### 3. **Use System Prompt**
```typescript
const systemPrompt = `
Role: [Who is the AI?]
Style: [How should it write?]
Constraints: [What to avoid?]
Format: [Output format?]
`;
```

### 4. **Handle Errors Gracefully**
```typescript
try {
    return await client.complete({...});
} catch (error) {
    // Fallback to cached content
    // Or return default message
    // Or retry with different provider
}
```

### 5. **Batch for Efficiency**
```typescript
// ❌ Bad: Sequential
for (const prompt of prompts) {
    await generateContent(...);
}

// ✅ Good: Parallel
await generateBatch(..., { concurrency: 3 });
```

### 6. **Monitor Costs**
```typescript
let totalCost = 0;
response.tokensUsed && (
    totalCost += response.tokensUsed.total * COST_PER_TOKEN
);
console.log(`Total cost: $${totalCost}`);
```

---

## 🧪 Testing

Chạy ví dụ:

```bash
cd packages/utils
npx tsx ai-client-examples.ts
```

Test connection:

```typescript
import { aiClient } from './ai-client';

const isValid = await aiClient.testConnection(
    'openai',
    process.env.OPENAI_API_KEY!
);

console.log(isValid ? '✅ Connected' : '❌ Failed');
```

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Multi-provider support (5 providers)
- ✅ Retry mechanism với exponential backoff
- ✅ Temperature control
- ✅ JSON mode
- ✅ Batch processing
- ✅ Token tracking
- ✅ Error handling

### Planned Features
- 🔜 Streaming support
- 🔜 Image generation
- 🔜 Function calling
- 🔜 Embeddings API
- 🔜 Cache support
- 🔜 Cost tracking dashboard

---

## 🤝 Contributing

Có ý tưởng? Tạo issue hoặc PR!

---

## 📄 License

MIT

---

## 🆘 Support

Gặp vấn đề? Check:
1. API keys trong `.env`
2. Dependencies đã cài (`npm install`)
3. Network connection
4. Provider status (check status pages)

---

**Happy Coding! 🚀**

