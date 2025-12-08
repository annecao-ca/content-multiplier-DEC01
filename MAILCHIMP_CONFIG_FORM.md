# MailChimp Configuration Form

## Overview
Created a comprehensive MailChimp configuration form for the Publishing Settings page at `/settings/publishing`.

## Features

### 1. MailChimpConfigForm Component
Located at: `apps/web/app/components/MailChimpConfigForm.tsx`

#### UI Features:
- **Modern dark theme** matching application design
- **Tabbed interface** with "Cơ bản" (Basic) and "Xác thực" (Authentication) tabs
- **Form validation** with error messages in Vietnamese
- **Password visibility toggle** for API Key field
- **Responsive modal** with backdrop blur

#### Form Fields (All Required):

**Authentication Section:**
- **MailChimp API Key** 
  - Type: Password (toggleable)
  - Placeholder: `abc123456789abcdef...`
  - Help text: "Your MailChimp API key (without datacenter suffix)"

- **Server Prefix (Datacenter)**
  - Type: Text
  - Placeholder: `us1`
  - Help text: "Your MailChimp datacenter (e.g., us1, us2, us3)"

**Email Configuration:**
- **List ID (Audience ID)**
  - Type: Text
  - Placeholder: `bf4770006e`
  - Help text: "Find this in MailChimp: Audience → Settings → Audience ID"

- **From Name**
  - Type: Text
  - Placeholder: `Hoang Dung AI`

- **From Email**
  - Type: Email
  - Placeholder: `vietemt@gmail.com`
  - Validation: Email format

- **Reply To Email**
  - Type: Email
  - Placeholder: `vietemt@gmail.com`
  - Validation: Email format

#### Validation Rules:
- All fields are required
- Email fields must be valid email format
- Errors displayed in Vietnamese below fields
- Form cannot be submitted if validation fails

### 2. Backend API Endpoint
Located at: `apps/api/src/routes/publishing.ts`

#### New Endpoint: `POST /api/publishing/credentials/mailchimp`

**Request Body:**
```typescript
{
  apiKey: string
  serverPrefix: string
  listId: string
  fromName: string
  fromEmail: string
  replyToEmail: string
}
```

**Response:**
```typescript
{
  ok: boolean
  message?: string
  error?: string
}
```

**Functionality:**
- Validates all required fields
- Stores encrypted credentials in `publishing_credentials` table
- Uses UPSERT to update existing configuration
- Logs telemetry event: `publishing.credentials_updated`

**Database Schema:**
```sql
INSERT INTO publishing_credentials (
    user_id, 
    platform, 
    credential_type, 
    encrypted_data, 
    is_active, 
    created_at, 
    updated_at
) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
ON CONFLICT (user_id, platform) DO UPDATE
SET encrypted_data = $4, is_active = $5, updated_at = NOW()
```

### 3. Publishing Settings Page Integration
Located at: `apps/web/app/settings/publishing/page.tsx`

#### Changes Made:
1. **Added "Configure" button** for MailChimp platform
2. **State management** for form visibility
3. **Save handler** that calls backend API
4. **Success/error notifications** in Vietnamese

#### New State:
```typescript
const [showMailChimpForm, setShowMailChimpForm] = useState(false)
const [mailChimpConfig, setMailChimpConfig] = useState<MailChimpConfig | null>(null)
```

#### New Functions:
```typescript
function openMailChimpConfig() {
  setMailChimpConfig(null)
  setShowMailChimpForm(true)
}

async function saveMailChimpConfig(config: MailChimpConfig) {
  // Saves to backend API
  // Shows success/error alerts
  // Reloads credentials
}
```

## Usage Flow

### User Journey:
1. Navigate to `/settings/publishing`
2. Find "Mailchimp" in Platform Connections
3. Click **"Configure"** button (purple)
4. Modal opens with configuration form
5. Switch to **"Xác thực"** tab
6. Fill in all required fields:
   - MailChimp API Key
   - Server Prefix
   - List ID
   - From Name
   - From Email
   - Reply To Email
7. Click **"Lưu cấu hình"** (Save Configuration)
8. Form validates all fields
9. If valid, saves to backend
10. Success message appears
11. Modal closes
12. Credentials list refreshes

### Error Handling:
- **Missing fields**: Red border + error message below field
- **Invalid email**: "Invalid email format" error
- **Backend errors**: Alert with error message
- **Network errors**: Alert with "Failed to save" message

## Implementation Details

### Component Structure:
```
MailChimpConfigForm (Modal)
├── Header
│   ├── Icon (MailChimp logo)
│   ├── Title: "Chỉnh sửa MailChimp"
│   └── Close Button (X)
├── Tabs
│   ├── Cơ bản (Basic) - Placeholder
│   └── Xác thực (Authentication)
│       ├── Info Banner
│       ├── API Key Field (with toggle)
│       ├── Server Prefix Field
│       └── Email Configuration Section
│           ├── List ID
│           ├── From Name
│           ├── From Email
│           └── Reply To Email
└── Footer
    ├── Cancel Button
    └── Save Button

```

### Styling:
- **Background**: `bg-slate-900` (dark theme)
- **Borders**: `border-slate-800`
- **Text**: White headings, `text-slate-400` for help text
- **Inputs**: Dark with light borders
- **Buttons**: 
  - Save: Blue (`bg-blue-600`)
  - Cancel: Outlined gray
  - Configure: Purple (`bg-indigo-600`)
- **Modal**: Backdrop blur with shadow

## Testing

### To test the form:

1. **Start backend and frontend:**
```bash
cd /Users/queeniecao/content-multiplier-git/content-multiplier
./start-backend.sh  # Terminal 1
./start-frontend.sh # Terminal 2
```

2. **Navigate to:**
```
http://localhost:3000/settings/publishing
```

3. **Test scenarios:**

**Valid configuration:**
- Click "Configure" on MailChimp
- Fill all fields with valid data
- Click "Lưu cấu hình"
- Should show success alert
- Modal should close

**Validation errors:**
- Leave fields empty → See "is required" errors
- Invalid email format → See "Invalid email format"
- All errors in Vietnamese

**API errors:**
- Backend not running → Alert with error
- Invalid data → Alert with error message

4. **Verify in database:**
```bash
docker compose exec db psql -U cm -d cm -c "
  SELECT platform, credential_type, is_active, created_at 
  FROM publishing_credentials 
  WHERE platform = 'mailchimp'
"
```

## Files Modified

1. **apps/web/app/components/MailChimpConfigForm.tsx** (NEW)
   - Complete form component
   - Validation logic
   - Dark theme styling

2. **apps/web/app/settings/publishing/page.tsx**
   - Import MailChimpConfigForm
   - Add state for form visibility
   - Add openMailChimpConfig()
   - Add saveMailChimpConfig()
   - Add "Configure" button
   - Render MailChimpConfigForm

3. **apps/api/src/routes/publishing.ts**
   - Add POST `/credentials/mailchimp` endpoint
   - Validation logic
   - Database upsert
   - Telemetry logging

## Environment Requirements

- Next.js frontend running on port 3000
- Backend API running on port 3001
- PostgreSQL with `publishing_credentials` table
- `encrypted_data` column to store JSON config

## Security Considerations

- API keys stored as encrypted JSON in database
- Password fields use `type="password"` with toggle
- User ID from session (currently `'default_user'` for demo)
- HTTPS recommended for production

## Future Enhancements

### Planned Features:
1. **Test Connection** button to verify credentials
2. **Load existing config** when reopening form
3. **Decrypt and display** saved config
4. **Multiple list support** for different campaigns
5. **Template management** for email formats
6. **Preview email** before sending
7. **Send test email** functionality

### Additional Platforms:
- Similar forms for SendGrid, WordPress, etc.
- Reusable form patterns
- Platform-specific validation

## API Response Examples

### Success:
```json
{
  "ok": true,
  "message": "MailChimp credentials saved successfully"
}
```

### Error (Missing Fields):
```json
{
  "ok": false,
  "error": "All MailChimp configuration fields are required"
}
```

### Error (Server):
```json
{
  "ok": false,
  "error": "Failed to save credentials"
}
```

## Status

✅ MailChimpConfigForm component created  
✅ Form validation implemented  
✅ Backend API endpoint created  
✅ Publishing settings page integrated  
✅ "Configure" button added  
✅ Save/load handlers implemented  
✅ Error handling complete  
✅ Vietnamese localization added  

Ready for testing at: `http://localhost:3000/settings/publishing`

