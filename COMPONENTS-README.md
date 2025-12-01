# 🎨 UI Components - Quick Start

## ✨ Đã tạo 5 components + 1 demo page

```
✅ IdeaForm - Form tạo idea mới
✅ GenerateIdeasButton - Generate từ AI
✅ IdeaList - Hiển thị danh sách
✅ IdeaEmptyState - Empty state
✅ Toast - Notifications
✅ Demo Page - /ideas-demo
```

---

## 🚀 Chạy demo ngay (3 bước)

### Bước 1: Chạy Backend

```bash
cd apps/api
npm run dev
```

### Bước 2: Chạy Frontend

```bash
cd apps/web
npm run dev
```

### Bước 3: Mở trình duyệt

```
http://localhost:3000/ideas-demo
```

---

## 📖 Usage - Copy & Paste

### 1. Import components

```tsx
import IdeaForm from './components/ideas/IdeaForm';
import GenerateIdeasButton from './components/ideas/GenerateIdeasButton';
import IdeaList from './components/ideas/IdeaList';
import IdeaEmptyState from './components/ideas/IdeaEmptyState';
import { ToastContainer, useToast } from './components/ideas/Toast';
```

### 2. Sử dụng trong page

```tsx
'use client';

import { useState } from 'react';
import { useToast } from './components/ideas/Toast';

export default function MyPage() {
  const [ideas, setIdeas] = useState([]);
  const toast = useToast();
  
  const handleGenerate = async (params) => {
    const res = await fetch('/api/ideas/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    if (res.ok) {
      toast.success('Generated ideas! 🎉');
      // Reload ideas
    } else {
      toast.error('Failed!');
    }
  };
  
  return (
    <div>
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.hideToast} />
      
      {/* Generate Button */}
      <GenerateIdeasButton onGenerate={handleGenerate} />
      
      {/* Ideas List or Empty State */}
      {ideas.length === 0 ? (
        <IdeaEmptyState />
      ) : (
        <IdeaList ideas={ideas} />
      )}
    </div>
  );
}
```

---

## 🎯 Component Features

### IdeaForm
- ✅ Form validation
- ✅ Error messages
- ✅ Loading states
- ✅ Auto-reset sau submit

### GenerateIdeasButton
- ✅ Beautiful modal
- ✅ Sliders (count, temperature)
- ✅ Loading spinner
- ✅ Error handling

### IdeaList
- ✅ Card layout
- ✅ Status badges
- ✅ Select/Delete buttons
- ✅ Scores & tags display

### IdeaEmptyState
- ✅ Gradient background
- ✅ Call-to-action buttons
- ✅ Quick tips

### Toast
- ✅ 4 types: success, error, warning, info
- ✅ Auto-hide (5s)
- ✅ Easy hook: `useToast()`

---

## 📁 Files

```
apps/web/components/ideas/
├── IdeaForm.tsx              (200 lines)
├── GenerateIdeasButton.tsx   (250 lines)
├── IdeaList.tsx              (200 lines)
├── IdeaEmptyState.tsx        (100 lines)
└── Toast.tsx                 (200 lines)

apps/web/app/ideas-demo/
└── page.tsx                  (200 lines)

Total: ~1,150 lines
```

---

## 🎨 Screenshots

### Empty State
```
┌──────────────────────────────┐
│          💡                  │
│      No Ideas Yet            │
│                              │
│ [🚀 Generate]  [✏️ Create]  │
└──────────────────────────────┘
```

### Generate Modal
```
┌──────────────────────────────┐
│ 🎨 Generate Ideas        ×  │
├──────────────────────────────┤
│ Persona: [_____________]     │
│ Industry: [____________]     │
│ Count: ├───●────┤ 10         │
│ Temp:  ├────●───┤ 0.8        │
│                              │
│ [Cancel]  [🚀 Generate]     │
└──────────────────────────────┘
```

### Idea Card
```
┌──────────────────────────────┐
│ #1  Title Here      [✅]     │
├──────────────────────────────┤
│ Description...               │
│ 👤 Persona | 🏢 Industry    │
│ [⭐ Select]   [🗑️ Delete]   │
└──────────────────────────────┘
```

### Toast
```
┌──────────────────────────────┐
│ ✅ Success            ×      │
│ Ideas generated!             │
└──────────────────────────────┘
```

---

## 🧪 Test Checklist

- [ ] Chạy `npm run dev` thành công
- [ ] Mở http://localhost:3000/ideas-demo
- [ ] Empty state hiển thị
- [ ] Click "Generate Ideas" → Modal mở
- [ ] Submit form → Loading spinner
- [ ] Success → Toast hiển thị
- [ ] Ideas hiển thị trong list
- [ ] Select/Delete buttons hoạt động

---

## 📚 Docs đầy đủ

Xem file **COMPONENTS-GUIDE.md** để có:
- API reference chi tiết
- Advanced examples
- Customization guide
- Troubleshooting

---

## 💬 Cần hỗ trợ?

Nếu cần:
- Thêm features mới
- Fix bugs
- Customize styles
- Performance optimization

Hãy cho tôi biết! 😊

---

**Chúc code vui vẻ! 🎉**

