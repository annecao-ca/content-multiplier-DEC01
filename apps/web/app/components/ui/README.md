# UI Components Library

Thư viện các component UI tái sử dụng được, tương thích với Tailwind CSS và shadcn/ui.

## 📦 Components

### 1. Toast (`Toast.tsx`)

Toast notification system với hook `useToast()` để hiển thị thông báo.

**Features:**
- ✅ Tự động biến mất sau 3 giây (có thể tùy chỉnh)
- ✅ 4 variants: success, error, info, warning
- ✅ Vị trí góc phải màn hình
- ✅ Animation slide-in từ bên phải

**Usage:**

```tsx
'use client'

import { ToastProvider, useToast } from '@/app/components/ui'

function MyComponent() {
  const toast = useToast()

  const handleSuccess = () => {
    toast.success('Operation completed!', 'Your changes have been saved.')
  }

  const handleError = () => {
    toast.error('Operation failed', 'Please try again.')
  }

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  )
}

// Wrap your app with ToastProvider
function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  )
}
```

**API:**
- `toast.success(title, description?)`
- `toast.error(title, description?)`
- `toast.info(title, description?)`
- `toast.warning(title, description?)`
- `toast.showToast({ title, description, variant, duration? })`
- `toast.hideToast(id)`

---

### 2. EmptyState (`EmptyState.tsx`)

Component hiển thị khi không có dữ liệu.

**Features:**
- ✅ Icon hoặc Lucide icon
- ✅ Title và description
- ✅ Optional action button
- ✅ Căn giữa trong container
- ✅ Tương thích dark mode

**Usage:**

```tsx
import { EmptyState } from '@/app/components/ui'
import { FileText } from 'lucide-react'

function MyPage() {
  return (
    <EmptyState
      icon={FileText}
      title="No documents yet"
      description="Get started by uploading your first document."
      actionLabel="Upload Document"
      onAction={() => console.log('Upload clicked')}
    />
  )
}
```

**Props:**
- `icon?: LucideIcon | React.ReactNode`
- `title: string`
- `description: string`
- `actionLabel?: string`
- `onAction?: () => void`
- `className?: string`
- `children?: React.ReactNode`

---

### 3. SkeletonList (`SkeletonList.tsx`)

Loading skeleton cho danh sách items.

**Features:**
- ✅ Shimmer effect với `animate-pulse`
- ✅ Responsive grid layout
- ✅ Nhiều types: ideas, briefs, drafts, packs
- ✅ Customizable count

**Usage:**

```tsx
import { SkeletonList } from '@/app/components/ui'

function IdeasPage() {
  const { loading, ideas } = useIdeas()

  if (loading) {
    return <SkeletonList type="ideas" count={6} />
  }

  return <IdeasList ideas={ideas} />
}
```

**Props:**
- `count?: number` (default: 6)
- `type?: 'ideas' | 'briefs' | 'drafts' | 'packs' | 'default'`
- `className?: string`

**Additional Components:**
- `<Skeleton className="..." />` - Individual skeleton element
- `<SkeletonCard />` - Pre-built skeleton card

---

### 4. ThemeToggle (`ThemeToggle.tsx`)

Nút chuyển đổi dark/light mode.

**Features:**
- ✅ Lưu theme vào localStorage
- ✅ Hỗ trợ system preference
- ✅ Icon Sun/Moon từ Lucide
- ✅ Tự động detect system theme

**Usage:**

```tsx
import { ThemeToggle } from '@/app/components/ui'

function Header() {
  return (
    <header>
      <ThemeToggle className="ml-auto" />
    </header>
  )
}
```

**Props:**
- `className?: string`
- `showLabel?: boolean` (default: false)

**Hook:**

```tsx
import { useTheme } from '@/app/components/ui'

function MyComponent() {
  const { theme, setTheme, mounted } = useTheme()

  if (!mounted) return null

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
    </div>
  )
}
```

---

### 5. Modal (`Modal.tsx`)

Component hiển thị hộp thoại xác nhận hoặc thông báo.

**Features:**
- ✅ Dựa trên shadcn/ui Dialog
- ✅ Confirm/Cancel buttons
- ✅ Destructive variant cho delete actions
- ✅ Custom content support

**Usage:**

```tsx
import { Modal, ConfirmModal } from '@/app/components/ui'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete Item</button>
      
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          console.log('Confirmed!')
          setIsOpen(false)
        }}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </>
  )
}
```

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `title: string`
- `description?: string`
- `confirmLabel?: string` (default: "Confirm")
- `cancelLabel?: string` (default: "Cancel")
- `onConfirm?: () => void`
- `onCancel?: () => void`
- `variant?: 'default' | 'destructive'`
- `children?: React.ReactNode`
- `className?: string`
- `showCloseButton?: boolean` (default: true)

---

### 6. Badge (`badge.tsx`)

Component hiển thị trạng thái với màu sắc tự động.

**Features:**
- ✅ Status variants: draft, review, approved, published
- ✅ Style variants: default, secondary, outline, destructive
- ✅ Tương thích dark mode
- ✅ Auto color theo status

**Usage:**

```tsx
import { Badge } from '@/app/components/ui'

function StatusBadge({ status }: { status: 'draft' | 'review' | 'approved' | 'published' }) {
  return <Badge status={status}>{status}</Badge>
}

// Or use variant
<Badge variant="default">Default</Badge>
<Badge variant="destructive">Error</Badge>
```

**Status Colors:**
- `draft`: Gray
- `review`: Yellow
- `approved`: Blue
- `published`: Green

**Props:**
- `variant?: 'default' | 'secondary' | 'outline' | 'destructive'`
- `status?: 'draft' | 'review' | 'approved' | 'published'`
- `className?: string`
- `...props` (HTMLDivElement attributes)

---

## 🎨 Styling

Tất cả components sử dụng Tailwind CSS và tương thích với dark mode thông qua CSS variables:

- `bg-muted` / `text-muted-foreground`
- `bg-background` / `text-foreground`
- `border-border`
- etc.

## 📝 Import

```tsx
// Import individual components
import { ToastProvider, useToast } from '@/app/components/ui'
import { EmptyState } from '@/app/components/ui'
import { SkeletonList } from '@/app/components/ui'
import { ThemeToggle } from '@/app/components/ui'
import { Modal, ConfirmModal } from '@/app/components/ui'
import { Badge } from '@/app/components/ui'

// Or import from index
import {
  ToastProvider,
  useToast,
  EmptyState,
  SkeletonList,
  ThemeToggle,
  Modal,
  ConfirmModal,
  Badge
} from '@/app/components/ui'
```

## 🔧 Setup

1. **ToastProvider**: Wrap your app root với `ToastProvider`:

```tsx
// app/layout.tsx
import { ToastProvider } from '@/app/components/ui'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
```

2. **Theme Toggle**: Đảm bảo Tailwind config có `darkMode: ["class"]` (đã có sẵn)

3. **CSS Variables**: Đảm bảo `globals.css` có CSS variables cho dark mode (đã có sẵn)

## 🎯 Best Practices

1. **Toast**: Sử dụng cho các thông báo ngắn hạn, tự động biến mất
2. **EmptyState**: Hiển thị khi danh sách rỗng, kèm action để user có thể thêm dữ liệu
3. **SkeletonList**: Hiển thị khi đang load data, giúp UX tốt hơn
4. **ThemeToggle**: Đặt trong header/navigation bar
5. **Modal**: Dùng cho confirmations và important actions
6. **Badge**: Dùng để hiển thị status, tags, labels

