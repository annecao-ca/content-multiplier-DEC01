# RAG Components Documentation

Bộ components để xây dựng RAG (Retrieval-Augmented Generation) system với tính năng upload documents, inline citations, và footnotes.

## 📦 Components Overview

### 1. DocumentUpload
Dialog component cho phép upload tài liệu với drag-drop interface.

**Features:**
- ✅ Drag and drop zone với dotted border và hover effect
- ✅ File input ẩn, trigger bằng click
- ✅ Preview file name và size sau khi chọn
- ✅ Progress bar khi đang upload
- ✅ Validation và error handling

**Usage:**
```tsx
import { DocumentUpload } from '@/app/components/DocumentUpload'

function MyComponent() {
  const handleUpload = async (file: File) => {
    // Upload logic here
    await uploadToServer(file)
  }

  return (
    <DocumentUpload 
      onUpload={handleUpload}
      accept=".pdf,.doc,.docx,.txt"
    />
  )
}
```

**Props:**
- `onUpload?: (file: File) => Promise<void>` - Callback khi upload file
- `trigger?: React.ReactNode` - Custom trigger button (optional)
- `accept?: string` - File types accepted (default: `.pdf,.doc,.docx,.txt`)

---

### 2. DocumentCard
Card component để hiển thị thông tin tài liệu đã upload.

**Features:**
- ✅ shadcn Card với hover effect
- ✅ Hiển thị title, URL, upload date
- ✅ Delete button với AlertDialog confirmation
- ✅ Truncate long URLs tự động
- ✅ Icon và styling đẹp mắt

**Usage:**
```tsx
import { DocumentCard } from '@/app/components/DocumentCard'

function MyComponent() {
  const handleDelete = async (id: string) => {
    await deleteDocument(id)
  }

  return (
    <DocumentCard
      id="doc-1"
      title="My Document.pdf"
      url="https://example.com/doc.pdf"
      uploadDate={new Date()}
      onDelete={handleDelete}
    />
  )
}
```

**Props:**
- `id: string` - Unique document ID
- `title: string` - Document title
- `url?: string` - Document URL (optional)
- `uploadDate: Date` - Upload date
- `onDelete?: (id: string) => Promise<void>` - Delete callback
- `className?: string` - Additional CSS classes

---

### 3. InlineCitation
Component để parse và hiển thị citations [1], [2] trong text với tooltip.

**Features:**
- ✅ Parse [1], [2], [3] từ text tự động
- ✅ Replace với Badge component (variant=outline)
- ✅ Hover shows Tooltip với source snippet
- ✅ Click scroll to footnote section với smooth animation
- ✅ Highlight animation khi scroll đến footnote

**Usage:**
```tsx
import { ParsedContentWithCitations } from '@/app/components/InlineCitation'

const sources = [
  {
    id: 1,
    title: 'Source Title',
    snippet: 'This is a snippet from the source...',
    url: 'https://example.com/source'
  }
]

const content = "This is content with citation [1] and another [2]."

function MyComponent() {
  return (
    <ParsedContentWithCitations
      content={content}
      sources={sources}
      onCitationClick={(num) => console.log('Clicked:', num)}
    />
  )
}
```

**Props:**
- `content: string` - Text content với citations [1], [2], etc.
- `sources: Source[]` - Array of source objects
- `onCitationClick?: (citationNumber: number) => void` - Custom click handler

**Source Type:**
```typescript
interface Source {
  id: number
  title: string
  snippet: string
  url?: string
}
```

---

### 4. Footnotes
Accordion component để hiển thị chi tiết các citations.

**Features:**
- ✅ Accordion component từ shadcn
- ✅ Mỗi item: [1] Title - URL
- ✅ AccordionContent: retrieved snippet
- ✅ Copy button cho URL
- ✅ Open link button
- ✅ Highlight animation khi được scroll đến

**Usage:**
```tsx
import { Footnotes } from '@/app/components/Footnotes'

const sources = [
  {
    id: 1,
    title: 'Source Title',
    snippet: 'This is a snippet from the source...',
    url: 'https://example.com/source'
  }
]

function MyComponent() {
  return <Footnotes sources={sources} />
}
```

**Props:**
- `sources: Source[]` - Array of source objects
- `className?: string` - Additional CSS classes

---

## 🎨 Complete Example

Xem `RAGDemo.tsx` để có ví dụ đầy đủ về cách kết hợp tất cả components:

```tsx
import { RAGDemo } from '@/app/components/RAGDemo'

function Page() {
  return <RAGDemo />
}
```

## 🚀 Features Checklist

### DocumentUpload
- ✅ shadcn Dialog component
- ✅ Drag-drop zone (dotted border, hover effect)
- ✅ File input hidden, trigger on click
- ✅ Preview uploaded file name
- ✅ Progress bar khi uploading

### DocumentCard
- ✅ shadcn Card với hover effect
- ✅ Title, URL, upload date
- ✅ Delete button với AlertDialog confirmation
- ✅ Truncate long URLs

### InlineCitation
- ✅ Parse [1], [2] from text
- ✅ Replace với Badge component (variant=outline)
- ✅ Hover shows Tooltip với source snippet
- ✅ Click scroll to footnote section

### Footnotes
- ✅ Accordion component from shadcn
- ✅ Each item: [1] Title - URL
- ✅ AccordionContent: retrieved snippet
- ✅ Copy button cho URL

## 📚 Dependencies

Các dependencies cần thiết đã được cài đặt:
- `@radix-ui/react-dialog`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `lucide-react` (for icons)

## 🎯 Usage Tips

1. **Document Upload**: Sử dụng trong settings page hoặc document management page
2. **Citations**: Tích hợp vào content editor hoặc preview
3. **Footnotes**: Luôn đặt ở cuối content để dễ reference
4. **Styling**: Tất cả components đều support custom className để override styles

## 🔧 Customization

Các components sử dụng Tailwind CSS và có thể customize dễ dàng:
- Colors: Thay đổi `indigo-*` thành màu khác
- Sizing: Adjust padding, margin, font sizes
- Animations: Modify transition, animation durations

## 📝 Notes

- Tất cả components đều có `'use client'` directive
- Support TypeScript với full type definitions
- Responsive design với Tailwind breakpoints
- Accessibility-friendly với ARIA labels và semantic HTML













