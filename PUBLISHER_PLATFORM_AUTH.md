# Multi-platform Publisher - Platform Authentication

## Overview
Enhanced the Multi-platform Publisher page with Mailchimp, WordPress support and comprehensive platform authentication.

## New Features

### 1. Additional Platforms
Added two new platforms to `DerivativeTabs`:
- **Mailchimp** (5000 character limit) - For email campaigns
- **WordPress** (10000 character limit) - For blog posts

### 2. Platform Authentication Component
Created `PlatformAuth.tsx` with the following features:

#### Features:
- **Visual Connection Status**: Color-coded cards (green=connected, red=expired, yellow=expiring soon)
- **OAuth Flow Support**: Simulated OAuth connection workflow
- **Token Expiry Tracking**: Displays expiry dates and warnings
- **Account Details**: Shows username, email, last connected date
- **Quick Connect/Disconnect**: One-click connection management
- **Status Badges**: Clear visual indicators for each platform status

#### Supported Platforms:
1. Twitter/X
2. LinkedIn
3. Facebook
4. Instagram
5. TikTok
6. Mailchimp (NEW)
7. WordPress (NEW)

### 3. Publisher Page Updates

#### New Tab: "Platform Auth"
- Added dedicated tab for managing platform connections
- Positioned between "Content Editor" and "Analytics"
- Clean, organized interface for all platform authentications

#### State Management:
```typescript
// Authentication statuses for all platforms
authStatuses: Record<string, PlatformAuthStatus>

// Each status includes:
- connected: boolean
- username?: string
- email?: string
- lastConnected?: Date
- tokenExpiry?: Date
```

#### Handlers:
- `handleConnect(platformId)`: Initiates OAuth flow (simulated)
- `handleDisconnect(platformId)`: Revokes platform access

## Component Structure

```
apps/web/app/
├── components/
│   ├── PlatformAuth.tsx          # NEW: Platform authentication component
│   ├── DerivativeTabs.tsx        # UPDATED: Added Mailchimp, WordPress
│   └── derivatives-ui.ts         # UPDATED: Exported PlatformAuth
└── publisher/
    └── page.tsx                  # UPDATED: Integrated auth features
```

## Usage Example

### In Publisher Page:
```typescript
<PlatformAuth
  platforms={authPlatforms}
  authStatuses={authStatuses}
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
/>
```

### Platform Configuration:
```typescript
const authPlatforms: PlatformAuthConfig[] = [
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: <MailchimpIcon />,
    description: 'Connect Mailchimp to send email campaigns',
  },
  // ... more platforms
]
```

## Visual Indicators

### Connection States:
- 🟢 **Connected**: Green border, checkmark badge
- 🔴 **Expired**: Red border, X badge, error message
- 🟡 **Expiring Soon**: Yellow border, warning badge
- ⚪ **Disconnected**: Default border, connect button

### Token Expiry Warnings:
- Shows warning 7 days before expiry
- Displays exact expiry date
- Provides re-authentication prompt

## Integration Flow

1. **User clicks "Platform Auth" tab**
2. **Views all available platforms** with connection status
3. **Clicks "Connect"** on desired platform
4. **OAuth flow initiated** (currently simulated)
5. **Platform shows as connected** with account details
6. **User can now publish** to connected platforms

## Future Enhancements

### Production OAuth:
```typescript
const handleConnect = async (platformId: string) => {
  // Redirect to OAuth provider
  window.location.href = `/api/oauth/${platformId}/authorize`
}
```

### Token Refresh:
- Automatic token refresh before expiry
- Background refresh without user interaction
- Webhook support for revocation events

### Publishing Integration:
- Check connection status before publishing
- Show connection warnings in export flow
- Batch publish to multiple platforms

## Testing

### To test the new features:

1. Navigate to: `http://localhost:3000/publisher`
2. Click "Platform Auth" tab
3. Click "Connect" on any platform
4. Observe simulated OAuth flow (1.5s)
5. View connected status with mock account details
6. Switch to "Content Editor" tab
7. Test Mailchimp and WordPress tabs
8. Verify character count badges work correctly

### Expected Behavior:
- Connecting takes ~1.5 seconds
- Status changes to "Connected" with green badge
- Account details appear (username, email, dates)
- Token expiry set to 30 days from now
- Disconnect button appears
- Can switch between platforms seamlessly

## Component Props

### PlatformAuth:
```typescript
interface PlatformAuthProps {
  platforms: PlatformAuthConfig[]      // Platform configurations
  authStatuses?: Record<string, PlatformAuthStatus>  // Current statuses
  onConnect?: (platformId: string) => Promise<void>  // Connect handler
  onDisconnect?: (platformId: string) => Promise<void> // Disconnect handler
  className?: string                   // Optional styling
}
```

### PlatformAuthConfig:
```typescript
interface PlatformAuthConfig {
  id: string                          // Unique platform ID
  name: string                        // Display name
  icon: React.ReactNode               // Platform icon
  description: string                 // Helper text
  requiredFields?: string[]           // Optional: required auth fields
}
```

### PlatformAuthStatus:
```typescript
interface PlatformAuthStatus {
  connected: boolean                  // Connection state
  username?: string                   // User account name
  email?: string                      // User email
  lastConnected?: Date                // Last successful connection
  tokenExpiry?: Date                  // OAuth token expiry
}
```

## Files Modified

1. `apps/web/app/components/DerivativeTabs.tsx`
   - Added Mailchimp icon component
   - Added WordPress icon component
   - Updated DEFAULT_PLATFORMS array

2. `apps/web/app/components/PlatformAuth.tsx` (NEW)
   - Complete authentication UI component
   - Connection status visualization
   - OAuth flow simulation

3. `apps/web/app/publisher/page.tsx`
   - Added platform icons
   - Added authStatuses state
   - Added connect/disconnect handlers
   - Added "Platform Auth" tab
   - Integrated PlatformAuth component

4. `apps/web/app/components/derivatives-ui.ts`
   - Exported PlatformAuth component
   - Exported related types

## Dependencies

All features use existing dependencies:
- `lucide-react`: Icons (Check, X, Link2, AlertCircle)
- Existing UI components: Button, Card, Badge, Tabs
- React hooks: useState
- TypeScript for type safety

No new dependencies required!

## Status

✅ Mailchimp platform added  
✅ WordPress platform added  
✅ PlatformAuth component created  
✅ OAuth simulation implemented  
✅ Token expiry tracking added  
✅ Visual status indicators working  
✅ Connect/disconnect flows functional  
✅ Integration with Publisher page complete  

Ready for testing at: `http://localhost:3000/publisher`

