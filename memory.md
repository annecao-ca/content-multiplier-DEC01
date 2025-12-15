# Content Multiplier - Mailchimp Configuration Guide

## Tổng quan

Mailchimp được sử dụng để gửi email campaigns trong Content Multiplier. Hệ thống sử dụng Mailchimp API v3.0 để tạo và gửi campaigns.

## Các trường cấu hình cần thiết

Khi config Mailchimp, bạn cần cung cấp 6 thông tin sau:

1. **API Key** (`apiKey`)
   - API key từ Mailchimp account
   - Format: `abc123456789abcdef...` (không bao gồm datacenter suffix)
   - Ví dụ: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6-us1` → chỉ lấy phần trước `-us1`

2. **Server Prefix** (`serverPrefix`)
   - Datacenter của Mailchimp account
   - Format: `us1`, `us2`, `us3`, `eu1`, etc.
   - Thường nằm ở cuối API key (sau dấu `-`)

3. **List ID** (`listId`)
   - ID của Audience/List muốn gửi email
   - Format: `bf4770006e` (alphanumeric)
   - Cách tìm: Mailchimp Dashboard → Audience → Settings → Audience ID

4. **From Name** (`fromName`)
   - Tên hiển thị trong email (sender name)
   - Ví dụ: `Hoang Dung AI`, `Content Multiplier`

5. **From Email** (`fromEmail`)
   - Email address của người gửi
   - Phải là email đã được verify trong Mailchimp
   - Ví dụ: `vietemt@gmail.com`

6. **Reply To Email** (`replyToEmail`)
   - Email nhận reply từ người nhận
   - Ví dụ: `vietemt@gmail.com`

## Cách lấy thông tin từ Mailchimp

### 1. Lấy API Key

1. Đăng nhập vào Mailchimp Dashboard: https://mailchimp.com/
2. Click vào profile icon (góc trên bên phải)
3. Chọn **Account & Billing** → **Extras** → **API keys**
4. Tạo API key mới hoặc copy API key hiện có
5. **Lưu ý**: API key có format `xxxxx-us1`, phần `us1` là datacenter → tách riêng

### 2. Lấy Server Prefix (Datacenter)

- Server prefix thường nằm ở cuối API key (sau dấu `-`)
- Ví dụ: API key `abc123-us1` → Server prefix là `us1`
- Hoặc xem trong Mailchimp Dashboard → Account → Settings → Account details

### 3. Lấy List ID (Audience ID)

1. Vào Mailchimp Dashboard
2. Click **Audience** (menu bên trái)
3. Chọn **All contacts** hoặc audience cụ thể
4. Click **Settings** → **Audience name and defaults**
5. Scroll xuống phần **Audience ID** → Copy ID (format: `bf4770006e`)

### 4. Verify Email Address

1. Vào **Audience** → **Settings** → **Audience name and defaults**
2. Scroll xuống phần **Email address for this audience**
3. Đảm bảo email bạn dùng cho `fromEmail` và `replyToEmail` đã được verify
4. Nếu chưa verify, Mailchimp sẽ gửi verification email

## Cách config trong Content Multiplier

### Qua UI (Frontend)

1. Vào **Settings** → **Publishing**
2. Tìm platform **Mailchimp** trong danh sách
3. Click nút **Configure** (hoặc **Connect** nếu chưa config)
4. Điền đầy đủ 6 trường:
   - MailChimp API Key
   - Server Prefix (Datacenter)
   - List ID (Audience ID)
   - From Name
   - From Email
   - Reply To Email
5. Click **Lưu cấu hình**

### Qua API (Backend)

**Endpoint**: `POST /api/publishing/credentials/mailchimp`

**Request Body**:
```json
{
  "apiKey": "abc123456789abcdef",
  "serverPrefix": "us1",
  "listId": "bf4770006e",
  "fromName": "Hoang Dung AI",
  "fromEmail": "vietemt@gmail.com",
  "replyToEmail": "vietemt@gmail.com"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "MailChimp credentials saved successfully"
}
```

## Cách hoạt động của Publishing

### Flow khi publish

1. **Tạo Campaign**: Hệ thống tạo Mailchimp campaign với:
   - Type: `regular`
   - Recipients: List ID đã config
   - Settings: Subject, From Name, Reply To

2. **Set Content**: Thêm HTML và text content vào campaign

3. **Send Campaign**: Gửi campaign ngay lập tức (không schedule trong Mailchimp)

### API Endpoints liên quan

- `POST /api/publishing/publish` - Publish content ngay
- `POST /api/publishing/publish` (với `scheduled_at`) - Schedule publish
- `GET /api/publishing/status/:pack_id` - Xem status publishing
- `GET /api/publishing/credentials/mailchimp/config` - Lấy config hiện tại

### Scheduled Publishing

Nếu bạn schedule publish (chọn thời gian tương lai):
- Job được tạo với `status='pending'` và `scheduled_at=<thời gian>`
- Worker chạy mỗi 60 giây để xử lý các job đã tới hạn
- Khi tới hạn, job được xử lý như publish ngay

## Troubleshooting

### Mailchimp vẫn pending

**Nguyên nhân**:
1. Job được schedule nhưng chưa tới hạn → đợi worker xử lý
2. Worker chưa chạy → kiểm tra backend logs có `[Scheduler] Scheduled worker started`
3. Credentials sai → kiểm tra API key, server prefix, list ID

**Giải pháp**:
- Nếu muốn publish ngay: **không chọn** scheduled time (để trống)
- Kiểm tra backend đang chạy và worker đã start
- Verify credentials trong Mailchimp Dashboard

### Lỗi "Mailchimp campaign creation error"

**Nguyên nhân**:
- API key không đúng hoặc đã expire
- Server prefix không khớp với API key
- List ID không tồn tại hoặc không có quyền truy cập

**Giải pháp**:
- Tạo API key mới trong Mailchimp
- Đảm bảo server prefix đúng (thường là `us1`, `us2`, `us3`)
- Kiểm tra List ID trong Audience Settings

### Lỗi "Mailchimp credentials not configured"

**Nguyên nhân**:
- Chưa config Mailchimp credentials
- Credentials đã bị xóa hoặc inactive

**Giải pháp**:
- Vào Settings → Publishing → Configure Mailchimp
- Điền đầy đủ 6 trường và lưu lại

### Email không được gửi

**Nguyên nhân**:
- From email chưa được verify trong Mailchimp
- List ID không có subscribers
- Campaign bị lỗi khi send

**Giải pháp**:
- Verify email trong Mailchimp Dashboard
- Kiểm tra Audience có subscribers
- Xem logs backend để biết lỗi cụ thể

## Code References

### Backend Files

- `apps/api/src/services/publishing/email.ts` - MailchimpService implementation
- `apps/api/src/services/publishing/orchestrator.ts` - Publishing orchestrator với scheduled worker
- `apps/api/src/routes/publishing.ts` - API endpoints cho Mailchimp config

### Frontend Files

- `apps/web/app/components/MailChimpConfigForm.tsx` - Form config Mailchimp
- `apps/web/app/settings/publishing/page.tsx` - Settings page với Mailchimp config

## Notes

- Mailchimp API rate limit: 10 requests/second
- Campaign được gửi ngay sau khi tạo (không schedule trong Mailchimp)
- Scheduled publishing được xử lý bởi worker chạy mỗi 60 giây
- Credentials được lưu encrypted trong database
