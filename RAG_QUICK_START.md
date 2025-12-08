# RAG Components - Quick Start Guide

## 🚀 Quick Start trong 5 phút

### 1. Dependencies (Đã cài sẵn) ✅
```bash
# Các packages đã được cài đặt:
@radix-ui/react-dialog
@radix-ui/react-tooltip
@radix-ui/react-accordion
@radix-ui/react-alert-dialog
```

### 2. Xem Demo ngay
```bash
cd apps/web
npm run dev
```

Truy cập: **http://localhost:3000/rag-demo**

---

## 📖 Cách sử dụng từng component

### 1️⃣ Upload Document

```tsx
import { DocumentUpload } from '@/app/components/DocumentUpload'

function MyPage() {
  const handleUpload = async (file: File) => {
    // Upload file lên server
    const formData = new FormData()
    formData.append('file', file)
    await fetch('/api/documents', {
      method: 'POST',
      body: formData
    })
  }

  return <DocumentUpload onUpload={handleUpload} />
}
```

### 2️⃣ Hiển thị Documents

```tsx
import { DocumentCard } from '@/app/components/DocumentCard'

function DocumentList() {
  const documents = [
    {
      id: '1',
      title: 'My Document.pdf',
      url: 'https://example.com/doc.pdf',
      uploadDate: new Date()
    }
  ]

  const handleDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {documents.map(doc => (
        <DocumentCard
          key={doc.id}
          {...doc}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

### 3️⃣ Content với Citations

```tsx
import { ParsedContentWithCitations } from '@/app/components/InlineCitation'

function ContentView() {
  const content = "Machine learning rất quan trọng [1]. React Hooks cũng vậy [2]."
  
  const sources = [
    {
      id: 1,
      title: 'ML Guide',
      snippet: 'Machine learning là...',
      url: 'https://example.com/ml'
    },
    {
      id: 2,
      title: 'React Docs',
      snippet: 'Hooks cho phép...',
      url: 'https://react.dev/hooks'
    }
  ]

  return (
    <div>
      <ParsedContentWithCitations
        content={content}
        sources={sources}
      />
    </div>
  )
}
```

### 4️⃣ Footnotes Section

```tsx
import { Footnotes } from '@/app/components/Footnotes'

function ContentWithFootnotes() {
  const sources = [
    {
      id: 1,
      title: 'Source Title',
      snippet: 'Excerpt from source...',
      url: 'https://example.com'
    }
  ]

  return (
    <div>
      {/* Your content here */}
      <Footnotes sources={sources} />
    </div>
  )
}
```

---

## 🎯 Complete Example

```tsx
'use client'

import { useState } from 'react'
import { DocumentUpload } from '@/app/components/DocumentUpload'
import { DocumentCard } from '@/app/components/DocumentCard'
import { ParsedContentWithCitations } from '@/app/components/InlineCitation'
import { Footnotes } from '@/app/components/Footnotes'

export default function MyRAGPage() {
  const [documents, setDocuments] = useState([])
  
  const sources = [
    {
      id: 1,
      title: 'AI Research Paper',
      snippet: 'Artificial intelligence is transforming...',
      url: 'https://example.com/ai'
    }
  ]

  const content = "AI đang thay đổi thế giới [1]."

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Upload Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">📤 Documents</h2>
        <DocumentUpload 
          onUpload={async (file) => {
            // Handle upload
          }}
        />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {documents.map(doc => (
            <DocumentCard key={doc.id} {...doc} />
          ))}
        </div>
      </section>

      {/* Content Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">📝 Content</h2>
        <div className="bg-white p-6 rounded-lg border">
          <ParsedContentWithCitations
            content={content}
            sources={sources}
          />
        </div>
      </section>

      {/* Footnotes Section */}
      <Footnotes sources={sources} />
    </div>
  )
}
```

---

## 🎨 Styling Tips

### Custom Colors
```tsx
// Thay đổi màu chính từ indigo sang blue
<DocumentCard 
  className="hover:border-blue-400"
  // ...
/>
```

### Custom Trigger Button
```tsx
<DocumentUpload 
  trigger={
    <button className="custom-button">
      My Custom Button
    </button>
  }
/>
```

### Custom Width
```tsx
<Footnotes 
  sources={sources}
  className="max-w-4xl mx-auto"
/>
```

---

## 🔗 Import Paths

Tất cả components có thể import từ:
```tsx
// Individual imports
import { DocumentUpload } from '@/app/components/DocumentUpload'
import { DocumentCard } from '@/app/components/DocumentCard'
import { ParsedContentWithCitations } from '@/app/components/InlineCitation'
import { Footnotes } from '@/app/components/Footnotes'

// Or bulk import
import {
  DocumentUpload,
  DocumentCard,
  ParsedContentWithCitations,
  Footnotes
} from '@/app/components/rag'
```

---

## 📚 More Info

- Full documentation: `/apps/web/app/components/RAG_COMPONENTS_README.md`
- Demo page: `/apps/web/app/rag-demo/page.tsx`
- Types: `/apps/web/app/components/types.ts`

---

## ⚡ Pro Tips

1. **Performance**: Sử dụng `useMemo` cho parsed content nếu content lớn
2. **Accessibility**: Components đã support keyboard navigation
3. **Mobile**: Tất cả đều responsive, test trên mobile
4. **Loading**: Add loading states cho better UX
5. **Error Handling**: Wrap trong try-catch cho production

---

## 🐛 Troubleshooting

### Component không render?
- Check import paths
- Verify 'use client' directive
- Check console for errors

### Tooltip không show?
- Cần TooltipProvider ở parent level
- Check z-index conflicts

### Animations không chạy?
- Verify tailwindcss-animate installed
- Check tailwind.config.js có keyframes

### Upload không hoạt động?
- Implement onUpload handler
- Check file size limits
- Verify accept prop

---

## 🎉 That's it!

Bạn đã sẵn sàng sử dụng RAG components! 

Visit **http://localhost:3000/rag-demo** để xem live demo.















