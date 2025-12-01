# 🎨 COMPONENTS GUIDE - Idea Management UI

## 📦 Tổng quan

Tôi đã tạo một **bộ component UI hoàn chỉnh** cho quản lý content ideas với:

✅ **IdeaForm** - Form tạo idea mới  
✅ **GenerateIdeasButton** - Generate từ AI với modal  
✅ **IdeaList** - Hiển thị danh sách ideas  
✅ **IdeaEmptyState** - Empty state đẹp  
✅ **Toast** - Notifications với auto-hide  
✅ **Demo Page** - Trang demo đầy đủ  

**Tech Stack:**
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ React Hooks

---

## 📁 Files đã tạo (6 files, ~1,000+ dòng)

### Components:

```
✅ apps/web/components/ideas/IdeaForm.tsx
   → Form tạo idea mới với validation

✅ apps/web/components/ideas/GenerateIdeasButton.tsx
   → Button + Modal để generate từ AI

✅ apps/web/components/ideas/IdeaList.tsx
   → Bảng hiển thị danh sách ideas

✅ apps/web/components/ideas/IdeaEmptyState.tsx
   → Empty state khi chưa có data

✅ apps/web/components/ideas/Toast.tsx
   → Toast notifications + useToast hook

✅ apps/web/app/ideas-demo/page.tsx
   → Trang demo hoàn chỉnh
```

---

## 🚀 Quick Start

### 1. Chạy ứng dụng

```bash
# Terminal 1: Backend
cd apps/api
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

### 2. Mở demo page

```
http://localhost:3000/ideas-demo
```

---

## 📖 Component API

### 1. **IdeaForm**

Form để tạo idea mới.

#### Props:

```typescript
interface IdeaFormProps {
  onSubmit: (data: IdeaFormData) => void;  // Callback khi submit
  loading?: boolean;                        // Loading state
}

interface IdeaFormData {
  title: string;
  description: string;
  persona: string;
  industry: string;
}
```

#### Usage:

```tsx
import IdeaForm from './components/ideas/IdeaForm';

function MyPage() {
  const handleSubmit = async (data: IdeaFormData) => {
    console.log('Creating idea:', data);
    // Call API to save
  };
  
  return (
    <IdeaForm onSubmit={handleSubmit} loading={false} />
  );
}
```

#### Features:

- ✅ 4 fields: title, description, persona, industry
- ✅ Validation tự động (min length)
- ✅ Error messages
- ✅ Auto-clear errors khi typing
- ✅ Disabled state khi loading
- ✅ Reset form sau submit

---

### 2. **GenerateIdeasButton**

Button mở modal để generate ideas từ AI.

#### Props:

```typescript
interface GenerateIdeasButtonProps {
  onGenerate: (params: GenerateIdeasParams) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

interface GenerateIdeasParams {
  persona: string;
  industry: string;
  corpusHints?: string;
  count?: number;
  temperature?: number;
}
```

#### Usage:

```tsx
import GenerateIdeasButton from './components/ideas/GenerateIdeasButton';

function MyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleGenerate = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      if (!res.ok) throw new Error('Failed');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <GenerateIdeasButton
      onGenerate={handleGenerate}
      loading={loading}
      error={error}
    />
  );
}
```

#### Features:

- ✅ Modal popup đẹp
- ✅ Form với persona, industry, hints
- ✅ Count slider (5-20)
- ✅ Temperature slider (0-2)
- ✅ Loading spinner
- ✅ Error display
- ✅ Auto-close modal sau success

---

### 3. **IdeaList**

Hiển thị bảng danh sách ideas.

#### Props:

```typescript
interface IdeaListProps {
  ideas: Idea[];
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  persona?: string;
  industry?: string;
  status?: 'proposed' | 'selected' | 'discarded';
  scores?: {
    novelty?: number;
    demand?: number;
    fit?: number;
    white_space?: number;
  };
  tags?: string[];
  created_at?: string;
}
```

#### Usage:

```tsx
import IdeaList from './components/ideas/IdeaList';

function MyPage() {
  const [ideas, setIdeas] = useState([]);
  
  const handleSelect = async (id) => {
    await fetch(`/api/ideas/${id}/select`, { method: 'POST' });
    // Reload ideas
  };
  
  const handleDelete = async (id) => {
    await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
    // Reload ideas
  };
  
  return (
    <IdeaList
      ideas={ideas}
      onSelect={handleSelect}
      onDelete={handleDelete}
    />
  );
}
```

#### Features:

- ✅ Card layout đẹp
- ✅ Color coding theo status
- ✅ Show scores (novelty, demand, fit, white_space)
- ✅ Tags display
- ✅ Select/Delete buttons
- ✅ Hover effects
- ✅ Created date display

---

### 4. **IdeaEmptyState**

Empty state khi chưa có ideas.

#### Props:

```typescript
interface IdeaEmptyStateProps {
  onGenerateClick?: () => void;
}
```

#### Usage:

```tsx
import IdeaEmptyState from './components/ideas/IdeaEmptyState';

function MyPage() {
  const [ideas, setIdeas] = useState([]);
  
  if (ideas.length === 0) {
    return (
      <IdeaEmptyState
        onGenerateClick={() => {
          // Trigger generate modal
        }}
      />
    );
  }
  
  return <IdeaList ideas={ideas} />;
}
```

#### Features:

- ✅ Beautiful gradient background
- ✅ Large icon
- ✅ Call-to-action buttons
- ✅ Quick tips section
- ✅ Responsive design

---

### 5. **Toast**

Toast notifications với auto-hide.

#### Components:

```typescript
// Single Toast
<Toast
  type="success"
  message="Idea created!"
  duration={5000}
  onClose={() => {}}
/>

// Toast Container (hiển thị nhiều toasts)
<ToastContainer toasts={toasts} onClose={hideToast} />
```

#### Hook: `useToast()`

```tsx
import { useToast } from './components/ideas/Toast';

function MyPage() {
  const toast = useToast();
  
  // Show toasts
  toast.success('Success message!');
  toast.error('Error message!');
  toast.warning('Warning message!');
  toast.info('Info message!');
  
  return (
    <div>
      {/* Your content */}
      
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.hideToast} />
    </div>
  );
}
```

#### Features:

- ✅ 4 types: success, error, warning, info
- ✅ Auto-hide sau 5 giây (configurable)
- ✅ Slide-in animation
- ✅ Close button
- ✅ Stack multiple toasts
- ✅ Easy hook API

---

## 💻 Complete Example

### Demo Page Code:

```tsx
'use client';

import { useState, useEffect } from 'react';
import IdeaForm from '../components/ideas/IdeaForm';
import GenerateIdeasButton from '../components/ideas/GenerateIdeasButton';
import IdeaList from '../components/ideas/IdeaList';
import IdeaEmptyState from '../components/ideas/IdeaEmptyState';
import { ToastContainer, useToast } from '../components/ideas/Toast';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Load ideas
  const loadIdeas = async () => {
    const res = await fetch('/api/ideas');
    const data = await res.json();
    setIdeas(data);
  };
  
  // Create idea
  const handleCreate = async (formData) => {
    toast.info('Creating idea...');
    
    // Call API
    await createIdeaAPI(formData);
    
    await loadIdeas();
    toast.success('Idea created! 🎉');
  };
  
  // Generate ideas
  const handleGenerate = async (params) => {
    setLoading(true);
    toast.info(`Generating ${params.count} ideas...`);
    
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      if (!res.ok) throw new Error('Failed');
      
      await loadIdeas();
      toast.success('Ideas generated! 🎉');
      
    } catch (err) {
      toast.error('Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadIdeas(); }, []);
  
  return (
    <div>
      <ToastContainer toasts={toast.toasts} onClose={toast.hideToast} />
      
      <GenerateIdeasButton onGenerate={handleGenerate} loading={loading} />
      
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

## 🎨 UI Screenshots (Text)

### Empty State:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                     💡                          │
│              (Large blue circle)                │
│                                                 │
│               No Ideas Yet                      │
│                                                 │
│  Get started by generating AI-powered content   │
│        ideas or create your own manually        │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ 🚀 Generate with │  │ ✏️ Create        │   │
│  │    AI            │  │    Manually      │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
│  💡 Quick Tips:                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │🎯 Be    │ │🔥 Use   │ │⚡ Adjust│          │
│  │Specific │ │Keywords │ │Creative │          │
│  └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────┘
```

### Generate Modal:

```
┌─────────────────────────────────────────────────┐
│ 🎨 Generate Content Ideas              ×       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Persona (Target Audience) *                    │
│ ┌─────────────────────────────────────────────┐│
│ │ Marketing Manager at B2B SaaS              ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Industry *                                      │
│ ┌─────────────────────────────────────────────┐│
│ │ SaaS                                        ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Topic Hints (Optional)                          │
│ ┌─────────────────────────────────────────────┐│
│ │ AI, automation, productivity                ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Number of Ideas: 10                             │
│ ├────────●──────────────────┤                  │
│ 5                          20                   │
│                                                 │
│ Creativity: 0.8 (Balanced)                      │
│ ├────────────●────────────┤                    │
│ Factual              Creative                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Cancel]              [🚀 Generate Ideas]      │
└─────────────────────────────────────────────────┘
```

### Idea Card:

```
┌─────────────────────────────────────────────────┐
│ #1  How AI Transforms Modern Marketing    ✅   │
│                                    Selected     │
├─────────────────────────────────────────────────┤
│ This article explores how artificial           │
│ intelligence is revolutionizing marketing...    │
│                                                 │
│ 👤 Persona: Marketing Manager                  │
│ 🏢 Industry: SaaS                              │
│                                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │Novelty  │ │Demand   │ │Fit      │           │
│ │  4/5    │ │  5/5    │ │  4/5    │           │
│ └─────────┘ └─────────┘ └─────────┘           │
│                                                 │
│ #AI  #SaaS  #Marketing                         │
│                                                 │
│ [⭐ Select]                    [🗑️ Delete]     │
└─────────────────────────────────────────────────┘
```

### Toast Notification:

```
┌─────────────────────────────────┐
│ ✅ Success               ×      │
│ Successfully generated 10 ideas!│
└─────────────────────────────────┘
(Auto-hide sau 5 giây)
```

---

## 🎯 Component Features

### IdeaForm:

✅ 4 input fields (title, description, persona, industry)  
✅ Validation tự động  
✅ Error messages inline  
✅ Auto-clear errors  
✅ Disabled state  
✅ Submit handler  

### GenerateIdeasButton:

✅ Modal popup đẹp  
✅ Sticky header/footer  
✅ 2 form fields + 2 sliders  
✅ Loading spinner  
✅ Error display  
✅ Auto-close  

### IdeaList:

✅ Card layout responsive  
✅ Status badges (color-coded)  
✅ Scores display (4 metrics)  
✅ Tags chips  
✅ Select/Delete actions  
✅ Hover effects  
✅ Created date  

### IdeaEmptyState:

✅ Gradient background  
✅ Large icon  
✅ 2 CTA buttons  
✅ Quick tips section  
✅ Responsive  

### Toast:

✅ 4 types (success, error, warning, info)  
✅ Slide-in animation  
✅ Auto-hide (5s)  
✅ Close button  
✅ Stack multiple  
✅ useToast hook  

---

## 💻 Usage Examples

### Example 1: Basic Page

```tsx
'use client';

import { useState } from 'react';
import GenerateIdeasButton from './components/ideas/GenerateIdeasButton';
import IdeaList from './components/ideas/IdeaList';
import { ToastContainer, useToast } from './components/ideas/Toast';

export default function Page() {
  const [ideas, setIdeas] = useState([]);
  const toast = useToast();
  
  const handleGenerate = async (params) => {
    const res = await fetch('/api/ideas/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    if (res.ok) {
      toast.success('Generated 10 ideas!');
      // Reload ideas
    } else {
      toast.error('Failed to generate');
    }
  };
  
  return (
    <div>
      <ToastContainer toasts={toast.toasts} onClose={toast.hideToast} />
      <GenerateIdeasButton onGenerate={handleGenerate} />
      <IdeaList ideas={ideas} />
    </div>
  );
}
```

### Example 2: With Empty State

```tsx
return (
  <div>
    {ideas.length === 0 ? (
      <IdeaEmptyState onGenerateClick={openGenerateModal} />
    ) : (
      <IdeaList ideas={ideas} />
    )}
  </div>
);
```

### Example 3: With Manual Creation

```tsx
import IdeaForm from './components/ideas/IdeaForm';

const [showForm, setShowForm] = useState(false);

const handleCreate = async (data) => {
  await fetch('/api/ideas', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  toast.success('Idea created!');
  setShowForm(false);
};

return (
  <div>
    <button onClick={() => setShowForm(true)}>
      Create New Idea
    </button>
    
    {showForm && (
      <IdeaForm onSubmit={handleCreate} />
    )}
  </div>
);
```

---

## 🎨 Styling với Tailwind

### Color Palette:

```css
Primary (Blue):
- bg-blue-600, hover:bg-blue-700
- text-blue-900, text-blue-600

Success (Green):
- bg-green-600, hover:bg-green-700
- text-green-900, text-green-600

Error (Red):
- bg-red-50, border-red-500
- text-red-900

Neutral (Gray):
- bg-gray-50, bg-gray-100
- text-gray-600, text-gray-900
```

### Common Classes:

```css
Card: bg-white rounded-lg shadow-md border border-gray-200 p-6
Button: px-6 py-3 rounded-lg font-semibold transition-all
Input: w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
```

---

## 🧪 Testing Checklist

### IdeaForm:

- [ ] Submit với đầy đủ fields → Success
- [ ] Submit thiếu title → Error "Title is required"
- [ ] Title < 10 chars → Error "must be at least 10 characters"
- [ ] Description < 20 chars → Error
- [ ] Disabled state khi loading
- [ ] Form reset sau submit

### GenerateIdeasButton:

- [ ] Click button → Modal opens
- [ ] Click × → Modal closes
- [ ] Submit thiếu persona/industry → Alert
- [ ] Generate → Loading spinner shows
- [ ] Generate → Inputs disabled
- [ ] Success → Modal closes + Toast shows
- [ ] Error → Error message shows

### IdeaList:

- [ ] Display all ideas
- [ ] Status color-coding works
- [ ] Select button → Calls onSelect
- [ ] Delete button → Shows confirm dialog
- [ ] Scores display correctly
- [ ] Tags display correctly

### IdeaEmptyState:

- [ ] Shows when ideas.length === 0
- [ ] Generate button works
- [ ] Manual create button works

### Toast:

- [ ] Success toast → Green
- [ ] Error toast → Red
- [ ] Auto-hide after 5s
- [ ] Close button works
- [ ] Multiple toasts stack

---

## 📱 Responsive Design

### Breakpoints:

```css
Mobile: < 768px
  - Single column layout
  - Full width buttons
  - Stacked cards

Tablet: 768px - 1024px
  - 2-column grid for stats
  - Side-by-side buttons

Desktop: > 1024px
  - Max width 1200px
  - 3-column stats
  - Optimized spacing
```

---

## 🎉 Summary

Đã tạo **6 components production-ready**:

| Component | Lines | Features |
|-----------|-------|----------|
| IdeaForm | ~200 | Validation, errors, disabled states |
| GenerateIdeasButton | ~250 | Modal, sliders, loading, errors |
| IdeaList | ~200 | Cards, status, scores, actions |
| IdeaEmptyState | ~100 | Gradient, CTAs, tips |
| Toast | ~200 | 4 types, auto-hide, hook |
| Demo Page | ~200 | Complete integration |

**Total: ~1,150 dòng code**

---

## 🚀 Next Steps

### 1. Xem demo ngay

```
http://localhost:3000/ideas-demo
```

### 2. Test tất cả features

- Create idea manually
- Generate ideas with AI
- Select/Delete ideas
- See toasts appear

### 3. Customize

- Thay đổi colors trong Tailwind
- Thêm animations
- Add more fields
- Customize validation rules

---

## 💬 Cần gì nữa?

Nếu cần:
- Dark mode support
- More animations
- Additional components
- Custom hooks
- Performance optimization

Hãy cho tôi biết! 😊

---

**Happy Coding! 🎨✨**

