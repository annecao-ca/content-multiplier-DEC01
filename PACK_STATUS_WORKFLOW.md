# Pack Status Workflow

## Overview

Hệ thống quản lý trạng thái của content pack theo một workflow chuẩn với validation để đảm bảo chất lượng.

## Status States

| Status | Description | Màu sắc UI |
|--------|-------------|-----------|
| `draft` | Bản nháp đang được viết | 🟡 Vàng |
| `review` | Đang chờ review/phê duyệt | 🔵 Xanh dương |
| `approved` | Đã được phê duyệt, sẵn sàng publish | 🟢 Xanh lá |
| `published` | Đã xuất bản (final state) | 🟣 Tím |

## Transition Rules

### Valid Transitions

```
draft ──→ review ──→ approved ──→ published
  ↑         ↓           ↓
  └─────────┴───────────┘
```

#### Forward Flow (Happy Path)
- ✅ `draft` → `review`: Submit cho reviewer
- ✅ `review` → `approved`: Approve content
- ✅ `approved` → `published`: Publish ra public

#### Backward Flow (Revision/Fix)
- ✅ `review` → `draft`: Gửi lại cho writer sửa
- ✅ `approved` → `review`: Gửi lại review nếu phát hiện vấn đề

#### No-op
- ✅ Any status → Same status: Allowed (không thay đổi gì)

### Invalid Transitions

- ❌ `draft` → `approved`: Phải qua review trước
- ❌ `draft` → `published`: Phải qua review và approved trước
- ❌ `review` → `published`: Phải approved trước
- ❌ `published` → ANY: Published là final state, không thể thay đổi

## API Usage

### Endpoint: `POST /api/packs/update-status`

#### Request
```bash
curl -X POST http://localhost:3001/api/packs/update-status \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: alice' \
  -H 'x-user-role: CL' \
  -d '{
    "pack_id": "PACK-001",
    "status": "review"
  }'
```

#### Success Response (200)
```json
{
  "ok": true,
  "pack_id": "PACK-001",
  "previous_status": "draft",
  "current_status": "review",
  "updated_at": "2025-12-01T14:30:00.000Z"
}
```

#### Error Response - Invalid Transition (400)
```json
{
  "ok": false,
  "error": "Invalid transition: 'draft' → 'published'. Allowed transitions from 'draft': review",
  "current_status": "draft",
  "requested_status": "published",
  "valid_next_statuses": ["review"]
}
```

#### Error Response - Pack Not Found (404)
```json
{
  "ok": false,
  "error": "Pack not found"
}
```

## Code Usage

### Basic Validation

```typescript
import { validatePackStatusTransition } from '@/packages/utils/pack-status-validator';

// Valid transition
const result1 = validatePackStatusTransition('draft', 'review');
console.log(result1);
// { passed: true }

// Invalid transition
const result2 = validatePackStatusTransition('draft', 'published');
console.log(result2);
// { 
//   passed: false, 
//   error: "Invalid transition: 'draft' → 'published'. Allowed transitions from 'draft': review" 
// }
```

### Get Valid Next Statuses

```typescript
import { getValidNextStatuses } from '@/packages/utils/pack-status-validator';

const validNext = getValidNextStatuses('review');
console.log(validNext);
// ['approved', 'draft']
```

### Check Final Status

```typescript
import { isFinalStatus } from '@/packages/utils/pack-status-validator';

console.log(isFinalStatus('draft'));      // false
console.log(isFinalStatus('published'));  // true
```

## Frontend Integration Example

### React Component

```tsx
import { useState, useEffect } from 'react';

function PackStatusManager({ pack }) {
  const [validNext, setValidNext] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch valid next statuses from API
    fetch(`/api/packs/${pack.pack_id}/valid-statuses`)
      .then(r => r.json())
      .then(data => setValidNext(data.valid_next_statuses || []));
  }, [pack.pack_id, pack.status]);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/packs/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_id: pack.pack_id,
          status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update status');
        return;
      }

      // Success - reload pack or update local state
      console.log('Status updated:', data);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Current Status: {pack.status}</h3>
      
      {validNext.length > 0 && (
        <div>
          <p>Available actions:</p>
          {validNext.map(status => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              disabled={loading}
            >
              Move to {status}
            </button>
          ))}
        </div>
      )}
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
```

## Workflow Scenarios

### Scenario 1: Happy Path (No Issues)
1. Writer tạo draft → status: `draft`
2. Writer submit → `draft` → `review`
3. Reviewer approve → `review` → `approved`
4. Marketing publish → `approved` → `published` ✅

### Scenario 2: Needs Revision
1. Writer tạo draft → status: `draft`
2. Writer submit → `draft` → `review`
3. Reviewer tìm thấy lỗi → `review` → `draft`
4. Writer sửa và submit lại → `draft` → `review`
5. Reviewer approve → `review` → `approved`
6. Marketing publish → `approved` → `published` ✅

### Scenario 3: Post-Approval Issue
1. Content đã approved → status: `approved`
2. Phát hiện vấn đề nghiêm trọng → `approved` → `review`
3. Reviewer check lại → `review` → `approved`
4. Marketing publish → `approved` → `published` ✅

## Testing

Run test file:
```bash
npx tsx test-pack-status-validator.ts
```

Expected output:
```
========== PACK STATUS VALIDATOR TESTS ==========

✅ Test 1: Valid Transitions
  draft → review: ✅ PASS
  review → approved: ✅ PASS
  review → draft: ✅ PASS
  approved → published: ✅ PASS
  approved → review: ✅ PASS
  draft → draft: ✅ PASS

❌ Test 2: Invalid Transitions
  draft → published: ❌ BLOCKED
    Error: Invalid transition: 'draft' → 'published'. Allowed transitions from 'draft': review
  draft → approved: ❌ BLOCKED
  ...

========== ALL TESTS COMPLETED ==========
```

## Database Trigger

Migration `006_update_content_packs.sql` đã tạo trigger tự động update `updated_at`:

```sql
CREATE TRIGGER update_content_packs_updated_at
    BEFORE UPDATE ON content_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Mỗi khi status thay đổi, `updated_at` tự động được set = `now()`.

## Telemetry

Mỗi status transition được log vào bảng `events`:

```json
{
  "event_type": "pack.status_changed",
  "pack_id": "PACK-001",
  "actor_id": "alice",
  "actor_role": "CL",
  "payload": {
    "from": "draft",
    "to": "review"
  }
}
```

## Best Practices

1. **Always validate before transition**: Gọi `validatePackStatusTransition` trước khi update DB
2. **Show valid options to user**: Dùng `getValidNextStatuses` để hiển thị các action button phù hợp
3. **Handle published state carefully**: Published không thể revert, cần confirm rõ ràng
4. **Log all transitions**: Để audit trail và analytics
5. **Update UI optimistically**: Update UI ngay, nếu API fail thì revert

## Security Notes

- Kiểm tra `actor_role` trước khi cho phép transitions nhất định:
  - `draft → review`: Chỉ WR (Writer) hoặc CL (Content Lead)
  - `review → approved`: Chỉ CL hoặc Admin
  - `approved → published`: Chỉ CL hoặc MOps (Marketing Ops)
- Published packs không nên cho edit/delete

## Future Enhancements

- [ ] Add `rejected` status (từ review → rejected thay vì draft)
- [ ] Add `scheduled` status (giữa approved và published)
- [ ] Add transition timestamps tracking
- [ ] Add transition comments/notes
- [ ] Add bulk status updates
- [ ] Add status change notifications (email, Slack)















