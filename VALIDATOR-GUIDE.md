# 🛡️ AI VALIDATOR - Hướng dẫn sử dụng

## 🎯 Tổng quan

**AI Validator** là module kiểm tra dữ liệu từ AI và tự động retry nếu sai format.

### Vấn đề giải quyết:

❌ AI đôi khi trả về dữ liệu không đúng format  
❌ Thiếu fields bắt buộc  
❌ Độ dài không đạt yêu cầu  
❌ Kiểu dữ liệu sai  

### Giải pháp:

✅ Validate theo rules tùy chỉnh  
✅ Tự động retry với feedback  
✅ JSON schema validation  
✅ Custom validation logic  
✅ Error messages chi tiết  

---

## 📝 Files đã tạo

```
✅ packages/utils/ai-validator.ts (450+ dòng)
   → Validator module chính

✅ packages/utils/ai-validator-examples.ts (400+ dòng)
   → 7 ví dụ sử dụng

✅ apps/api/src/services/validated-idea-generator.ts (350+ dòng)
   → Service với validation

✅ test-validator.ts (200+ dòng)
   → Test file

✅ VALIDATOR-GUIDE.md (file này)
   → Hướng dẫn đầy đủ
```

---

## 🚀 Quick Start

### 1. Validate đơn giản

```typescript
import { AIValidator, IdeaValidator } from './packages/utils/ai-validator';

const validator = new AIValidator();

const idea = {
  title: 'How AI Transforms Marketing',
  description: 'Detailed explanation about AI in marketing...',
  rationale: 'AI adoption increased 300% in 2024...'
};

const result = validator.validateItem(idea, IdeaValidator.basicRules);

if (result.valid) {
  console.log('✅ Valid!', result.data);
} else {
  console.log('❌ Invalid!');
  result.errors.forEach(err => {
    console.log(`- ${err.field}: ${err.message}`);
  });
}
```

### 2. Retry khi validation fail

```typescript
import { retryWithValidation } from './packages/utils/ai-validator';

const result = await retryWithValidation({
  validator,
  rules: IdeaValidator.basicRules,
  maxRetries: 3,
  
  generatePrompt: async (feedback) => {
    // Call AI với feedback
    let prompt = 'Generate content idea...';
    
    if (feedback) {
      prompt += `\n\n${feedback}`; // Thêm feedback từ lần trước
    }
    
    const response = await callAI(prompt);
    return response;
  }
});

console.log('Valid data:', result.data);
```

---

## 📖 API Reference

### `AIValidator`

Class chính để validate dữ liệu.

#### Constructor

```typescript
new AIValidator(config?: {
  maxRetries?: number;
  retryDelay?: number;
  generateFeedback?: boolean;
})
```

#### Methods

##### `validateItem(item, rules): ValidationResult`

Validate một object theo rules.

```typescript
const result = validator.validateItem(
  { title: '...', description: '...' },
  [
    { field: 'title', required: true, type: 'string', minLength: 10 },
    { field: 'description', required: true, type: 'string', minLength: 20 }
  ]
);
```

##### `validateArray(items, rules): ValidationResult`

Validate array of objects.

```typescript
const result = validator.validateArray(
  [idea1, idea2, idea3],
  IdeaValidator.basicRules
);

console.log(`Valid: ${result.data.length}/${items.length}`);
```

##### `validateWithSchema(data, schema): ValidationResult`

Validate với JSON Schema (AJV).

```typescript
const result = validator.validateWithSchema(
  { ideas: [...] },
  IdeaValidator.schema
);
```

##### `generateFeedback(errors): string`

Tạo feedback message cho AI.

```typescript
if (!result.valid) {
  const feedback = validator.generateFeedback(result.errors);
  // Send feedback to AI
}
```

---

### `retryWithValidation()`

Function retry với validation loop.

```typescript
retryWithValidation({
  validator: AIValidator,
  rules?: ValidationRule[],
  schema?: object,
  maxRetries?: number,
  onRetry?: (attempt, errors) => void,
  generatePrompt: (feedback?) => Promise<any>
})
```

---

## 🎨 Validation Rules

### Basic Rule Structure

```typescript
{
  field: string;           // Tên field
  required?: boolean;      // Bắt buộc?
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;      // Độ dài tối thiểu
  maxLength?: number;      // Độ dài tối đa
  pattern?: RegExp;        // Regex pattern
  custom?: (value, item) => boolean | string;  // Custom logic
}
```

### Ví dụ Rules

#### 1. String validation

```typescript
{
  field: 'title',
  required: true,
  type: 'string',
  minLength: 10,
  maxLength: 200
}
```

#### 2. Array validation

```typescript
{
  field: 'tags',
  required: false,
  type: 'array',
  minLength: 1  // Ít nhất 1 item
}
```

#### 3. Number validation

```typescript
{
  field: 'score',
  required: false,
  type: 'number',
  custom: (value) => {
    return value >= 0 && value <= 5 ? true : 'Score must be 0-5';
  }
}
```

#### 4. Custom validation

```typescript
{
  field: 'email',
  required: true,
  type: 'string',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  custom: (value) => {
    if (value.includes('+')) {
      return 'Email cannot contain +';
    }
    return true;
  }
}
```

---

## 💡 Preset Validators

### `IdeaValidator.basicRules`

Validate ideas với 3 fields cơ bản:

```typescript
- title: 10-200 chars
- description: 20-1000 chars
- rationale: 20-500 chars
```

### `IdeaValidator.extendedRules`

Thêm các fields:

```typescript
- target_audience: array
- tags: array
- score: 0-5
```

### `IdeaValidator.schema`

JSON Schema cho validation:

```typescript
{
  ideas: [
    {
      title: string (10-200),
      description: string (20-1000),
      rationale: string (20-500),
      ...
    }
  ]
}
```

---

## 🔄 Retry Flow

```
1. Generate prompt
   ↓
2. Call AI
   ↓
3. Validate response
   ↓
   Valid? ✅ → Return data
   ↓ No
4. Generate feedback
   ↓
5. Retry với feedback
   ↓
   (Lặp lại bước 1-5 tối đa N lần)
```

### Ví dụ Retry Flow

```typescript
Attempt 1: AI trả về
{
  title: "AI",  // ❌ Quá ngắn
  description: "About AI",  // ❌ Quá ngắn
  rationale: "Important"  // ❌ Quá ngắn
}

Feedback: 
"- title: must be at least 10 characters
 - description: must be at least 20 characters
 - rationale: must be at least 20 characters"

Attempt 2: AI fix và trả về
{
  title: "How AI Transforms Marketing",  // ✅
  description: "AI revolutionizes marketing strategies...",  // ✅
  rationale: "AI adoption grew 300% making this relevant..."  // ✅
}

Result: ✅ Success!
```

---

## 🛠️ Use Cases

### Use Case 1: Validate content ideas

```typescript
const validator = new AIValidator();

const ideas = await generateIdeasFromAI();

const result = validator.validateArray(ideas, [
  { field: 'title', required: true, minLength: 10 },
  { field: 'description', required: true, minLength: 20 },
  { field: 'rationale', required: true, minLength: 20 }
]);

if (result.valid) {
  await saveToDatabase(result.data);
} else {
  console.error('Validation failed:', result.errors);
}
```

### Use Case 2: Retry với feedback

```typescript
const result = await retryWithValidation({
  validator: new AIValidator(),
  rules: IdeaValidator.basicRules,
  maxRetries: 3,
  
  generatePrompt: async (feedback) => {
    const prompt = buildPrompt(persona, industry, feedback);
    const response = await callAI(prompt);
    return response;
  }
});

// result.data đảm bảo đã valid
await saveToDatabase(result.data);
```

### Use Case 3: Custom validation cho business logic

```typescript
const customRules = [
  {
    field: 'title',
    required: true,
    type: 'string',
    custom: (value) => {
      // Title không được chứa từ "spam"
      if (value.toLowerCase().includes('spam')) {
        return 'Title cannot contain spam';
      }
      // Title phải có ít nhất 1 số
      if (!/\d/.test(value)) {
        return 'Title should contain at least one number';
      }
      return true;
    }
  }
];

const result = validator.validateItem(idea, customRules);
```

---

## 📊 Validation Result Structure

```typescript
{
  valid: boolean;
  errors: [
    {
      field: string;      // Field name
      message: string;    // Error message
      value?: any;        // Actual value
    }
  ];
  data?: any;  // Valid data (chỉ có khi valid = true)
}
```

### Ví dụ

```typescript
// Valid
{
  valid: true,
  errors: [],
  data: { title: '...', description: '...' }
}

// Invalid
{
  valid: false,
  errors: [
    {
      field: 'title',
      message: 'Field \'title\' must be at least 10 characters',
      value: 'AI'
    },
    {
      field: 'description',
      message: 'Field \'description\' is required',
      value: undefined
    }
  ]
}
```

---

## 🧪 Testing

### Test local (không cần API key)

```bash
npx tsx test-validator.ts
```

Tests:
- ✅ Simple validation
- ✅ Array validation
- ✅ Feedback generation
- ✅ JSON schema validation
- ⏭️  Retry with AI (requires API key)

### Test với real AI

Set API key trong `.env`:

```bash
OPENAI_API_KEY=sk-xxx...
```

Uncomment test 4 trong `test-validator.ts` rồi chạy lại.

---

## 🔧 Integration Examples

### Example 1: Simple API endpoint

```typescript
// API route
app.post('/generate-ideas', async (req, res) => {
  const { persona, industry } = req.body;
  
  const validator = new AIValidator();
  
  // Generate từ AI
  const ideas = await generateFromAI(persona, industry);
  
  // Validate
  const result = validator.validateArray(ideas, IdeaValidator.basicRules);
  
  if (result.valid) {
    await saveToDatabase(result.data);
    return res.json({ ok: true, ideas: result.data });
  } else {
    return res.status(400).json({ 
      ok: false, 
      errors: result.errors 
    });
  }
});
```

### Example 2: With retry logic

```typescript
import { validatedIdeaGenerator } from './services/validated-idea-generator';

app.post('/generate-ideas-validated', async (req, res) => {
  const { persona, industry, count } = req.body;
  
  try {
    const result = await validatedIdeaGenerator.generate({
      persona,
      industry,
      count
    });
    
    // Đảm bảo đã validated
    return res.json({
      ok: true,
      ideas: result.ideas,
      metadata: result.metadata
    });
    
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});
```

### Example 3: Frontend integration

```tsx
async function generateIdeas() {
  const response = await fetch('/api/generate-ideas-validated', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      persona: 'Marketing Manager',
      industry: 'SaaS',
      count: 10
    })
  });
  
  const data = await response.json();
  
  if (data.ok) {
    // Data đã được validated
    setIdeas(data.ideas);
    console.log(`Generated in ${data.metadata.attempts} attempts`);
  } else {
    alert(`Error: ${data.error}`);
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: "Validation failed after N attempts"

**Cause**: AI không thể tạo dữ liệu đúng format sau N lần thử.

**Fix**:
1. Kiểm tra prompt có rõ ràng không
2. Tăng `maxRetries`
3. Giảm requirements (ví dụ: minLength)
4. Thử model khác

### Issue 2: "Field required but missing"

**Cause**: AI không trả về field bắt buộc.

**Fix**:
1. Thêm examples vào prompt
2. Emphasize required fields
3. Use JSON mode

### Issue 3: Validation quá strict

**Cause**: Rules quá nghiêm ngặt.

**Fix**:
```typescript
// Thay vì:
{ minLength: 100 }

// Dùng:
{ minLength: 20 }
```

---

## 📈 Best Practices

### 1. Reasonable lengths

```typescript
// ❌ Too strict
{ field: 'description', minLength: 500 }

// ✅ Reasonable
{ field: 'description', minLength: 20, maxLength: 1000 }
```

### 2. Clear error messages

```typescript
{
  field: 'email',
  custom: (value) => {
    if (!value.includes('@')) {
      return 'Email must contain @';  // ✅ Clear
    }
    return true;
  }
}
```

### 3. Optional vs Required

```typescript
// Chỉ required cho fields quan trọng
{ field: 'title', required: true },
{ field: 'description', required: true },
{ field: 'tags', required: false }  // Optional
```

### 4. Retry limits

```typescript
// ❌ Too many
{ maxRetries: 10 }  // Tốn cost, chậm

// ✅ Optimal
{ maxRetries: 3 }   // Đủ để fix errors
```

### 5. Feedback quality

```typescript
onRetry: (attempt, errors) => {
  // Log để debug
  console.log(`Attempt ${attempt}: ${errors.length} errors`);
  
  // Track metrics
  trackMetric('validation.retry', { attempt, errorCount: errors.length });
}
```

---

## 💰 Cost Considerations

Mỗi lần retry tốn tokens:

| Retries | Tokens | Cost (GPT-4o-mini) |
|---------|--------|--------------------|
| 1 attempt | 3,000 | $0.0003 |
| 2 attempts | 6,000 | $0.0006 |
| 3 attempts | 9,000 | $0.0009 |

**Tips:**
- Set `maxRetries` hợp lý (2-3)
- Clear prompts giảm retry
- Cache valid results

---

## 🎉 Summary

Bạn đã có:

✅ **Validator module** với validation rules  
✅ **Retry mechanism** với feedback loop  
✅ **Preset validators** cho common cases  
✅ **JSON schema validation**  
✅ **Custom validation logic**  
✅ **Full examples** và documentation  
✅ **Test file** để demo  

**Total: ~1,400 dòng code**

---

## 💬 Câu hỏi?

Nếu cần:
- Thêm validation rules mới
- Custom validators cho use case khác
- Integration examples cụ thể
- Performance optimization

Hãy cho tôi biết! 😊

---

**Happy Validating! 🛡️**

