# SSE Draft Generation Endpoint

## Endpoint: `POST /api/packs/draft-stream`

Endpoint này tạo draft content từ brief và stream kết quả theo thời gian thực qua **Server-Sent Events (SSE)**.

## Request

### Headers
```
Content-Type: application/json
x-user-id: <user_id>
x-user-role: <role>
```

### Body Parameters
```json
{
  "pack_id": "string (required)",
  "brief_id": "string (required)",
  "audience": "string (optional)",
  "language": "string (optional, default: 'en')"
}
```

### Example Request (JavaScript/Fetch)
```javascript
const response = await fetch('http://localhost:3001/api/packs/draft-stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'demo-user',
    'x-user-role': 'WR'
  },
  body: JSON.stringify({
    pack_id: 'PACK-001',
    brief_id: 'BRF-001',
    audience: 'Marketing Managers',
    language: 'en'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');
  
  for (const line of lines) {
    if (line.startsWith('event:')) {
      const eventType = line.split('event: ')[1];
      const dataLine = lines[lines.indexOf(line) + 1];
      const data = JSON.parse(dataLine.split('data: ')[1]);
      
      console.log(eventType, data);
    }
  }
}
```

### Example Request (EventSource - simpler)
```javascript
// Note: EventSource only supports GET, so you need to use fetch with streaming
// or implement a wrapper
```

### Example Request (cURL)
```bash
curl -X POST http://localhost:3001/api/packs/draft-stream \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: demo-user' \
  -H 'x-user-role: WR' \
  -N \
  -d '{
    "pack_id": "PACK-001",
    "brief_id": "BRF-001",
    "audience": "Marketing Managers"
  }'
```

## Response (SSE Events)

### Event Types

#### 1. `status`
Thông báo trạng thái hiện tại

```
event: status
data: {"message":"Fetching brief..."}
```

```
event: status
data: {"message":"Generating content with AI..."}
```

```
event: status
data: {"message":"Saving to database..."}
```

#### 2. `chunk`
Từng đoạn nội dung được stream về

```
event: chunk
data: {"chunk":"# Introduction\n\nIn today's...","progress":10}
```

```
event: chunk
data: {"chunk":" rapidly evolving landscape...","progress":15}
```

#### 3. `complete`
Hoàn tất generation

```
event: complete
data: {
  "pack_id": "PACK-001",
  "word_count": 1456,
  "status": "draft",
  "message": "Draft created successfully"
}
```

#### 4. `error`
Lỗi xảy ra

```
event: error
data: {"message":"Brief not found"}
```

```
event: error
data: {"message":"AI generation failed","details":"API key not configured"}
```

## Database Updates

Sau khi hoàn tất, endpoint sẽ tự động:

1. **Lưu vào `content_packs` table** với các giá trị:
   - `pack_id`: ID từ request
   - `brief_id`: ID của brief
   - `draft_content`: Full markdown content
   - `draft_markdown`: Same as draft_content (backward compatibility)
   - `word_count`: Số từ tính được (tự động)
   - `claims_ledger`: Claims từ brief (JSONB)
   - `status`: 'draft'
   - `created_at`: Current timestamp
   - `updated_at`: Current timestamp (auto-updated by trigger)

2. **Log telemetry event**: `pack.draft_created` với payload:
   ```json
   {
     "word_count": 1456,
     "chunks": 25
   }
   ```

## Frontend Example (React)

```tsx
import { useState, useEffect } from 'react';

function DraftGenerator({ packId, briefId, audience }) {
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [wordCount, setWordCount] = useState(0);

  const generateDraft = async () => {
    setStatus('generating');
    setContent('');
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/packs/draft-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
          'x-user-role': 'WR'
        },
        body: JSON.stringify({
          pack_id: packId,
          brief_id: briefId,
          audience: audience,
          language: 'en'
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const [eventLine, dataLine] = line.split('\n');
          if (!eventLine.startsWith('event:') || !dataLine?.startsWith('data:')) continue;

          const event = eventLine.replace('event: ', '').trim();
          const data = JSON.parse(dataLine.replace('data: ', ''));

          switch (event) {
            case 'status':
              setStatus(data.message);
              break;
            case 'chunk':
              setContent(prev => prev + data.chunk);
              setProgress(data.progress);
              break;
            case 'complete':
              setStatus('complete');
              setWordCount(data.word_count);
              break;
            case 'error':
              setError(data.message);
              setStatus('error');
              break;
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <button onClick={generateDraft} disabled={status === 'generating'}>
        {status === 'generating' ? 'Generating...' : 'Generate Draft'}
      </button>
      
      {status === 'generating' && (
        <div>
          <p>Status: {status}</p>
          <progress value={progress} max="100">{progress}%</progress>
        </div>
      )}
      
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      
      {content && (
        <div>
          <h3>Draft Preview ({wordCount} words)</h3>
          <div dangerouslySetInnerHTML={{ __html: marked(content) }} />
        </div>
      )}
    </div>
  );
}
```

## Features

✅ **Real-time streaming**: Content được stream về frontend từng đoạn  
✅ **Progress tracking**: Frontend biết được % hoàn thành  
✅ **Auto word count**: Tự động tính số từ  
✅ **Auto save to DB**: Tự động lưu khi hoàn tất  
✅ **Error handling**: Các lỗi được báo rõ ràng qua SSE  
✅ **Telemetry logging**: Tự động log event vào analytics  
✅ **Auto-update timestamp**: Cột `updated_at` tự động cập nhật qua trigger  

## Testing

```bash
# Test with cURL
curl -X POST http://localhost:3001/api/packs/draft-stream \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test' \
  -H 'x-user-role: WR' \
  -N \
  -d '{"pack_id":"TEST-001","brief_id":"BRF-001","audience":"Test Audience"}'

# Expected output:
# event: status
# data: {"message":"Fetching brief..."}
#
# event: status
# data: {"message":"Generating content with AI..."}
#
# event: chunk
# data: {"chunk":"# Title\n\nIntro...","progress":10}
# ...
# event: complete
# data: {"pack_id":"TEST-001","word_count":1456,"status":"draft","message":"Draft created successfully"}
```

## Migration Note

Endpoint này sử dụng các cột mới trong bảng `content_packs`:
- `draft_content` (TEXT)
- `word_count` (INTEGER)
- `updated_at` (TIMESTAMPTZ with auto-update trigger)

Đảm bảo đã chạy migration `006_update_content_packs.sql` trước khi sử dụng.















