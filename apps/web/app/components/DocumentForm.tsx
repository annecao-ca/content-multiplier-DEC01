'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { X, Plus, FileText } from 'lucide-react'

export interface DocumentFormData {
  doc_id?: string
  title: string
  author: string
  published_date: string
  tags: string[]
  description: string
  raw: string
  url?: string
}

interface DocumentFormProps {
  document?: DocumentFormData
  onSubmit: (data: DocumentFormData) => Promise<void>
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
  availableTags?: string[] // Available tags for multi-select
}

export function DocumentForm({ 
  document,
  onSubmit,
  trigger,
  mode = 'create',
  availableTags = []
}: DocumentFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  
  const [formData, setFormData] = useState<DocumentFormData>({
    doc_id: document?.doc_id,
    title: document?.title || '',
    author: document?.author || '',
    published_date: document?.published_date || '',
    tags: document?.tags || [],
    description: document?.description || '',
    raw: document?.raw || '',
    url: document?.url || '',
  })

  const handleChange = (field: keyof DocumentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    handleChange('tags', formData.tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.raw) {
      alert('Tiêu đề và nội dung là bắt buộc')
      return
    }
    
    setLoading(true)
    
    try {
      // Generate doc_id if creating new
      if (mode === 'create' && !formData.doc_id) {
        formData.doc_id = `doc-${Date.now()}`
      }
      
      await onSubmit(formData)
      setOpen(false)
      
      // Reset form if creating new
      if (mode === 'create') {
        setFormData({
          title: '',
          author: '',
          published_date: '',
          tags: [],
          description: '',
          raw: '',
          url: '',
        })
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Thêm tài liệu' : 'Chỉnh sửa'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? '📝 Thêm tài liệu mới' : '✏️ Chỉnh sửa tài liệu'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin tài liệu. Hệ thống sẽ tự động chia nhỏ văn bản và tạo vector để tìm kiếm.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Nhập tiêu đề tài liệu"
                required
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Tác giả</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleChange('author', e.target.value)}
                placeholder="Nhập tên tác giả"
              />
            </div>

            {/* Published Date */}
            <div className="space-y-2">
              <Label htmlFor="published_date">Ngày xuất bản</Label>
              <Input
                id="published_date"
                type="datetime-local"
                value={formData.published_date 
                  ? (() => {
                      // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
                      try {
                        const date = new Date(formData.published_date)
                        if (!isNaN(date.getTime())) {
                          // Get local datetime in format YYYY-MM-DDTHH:mm
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          const hours = String(date.getHours()).padStart(2, '0')
                          const minutes = String(date.getMinutes()).padStart(2, '0')
                          return `${year}-${month}-${day}T${hours}:${minutes}`
                        }
                      } catch {}
                      return formData.published_date.slice(0, 16)
                    })()
                  : ''
                }
                onChange={(e) => {
                  // Store datetime-local value, will be converted to ISO on submit
                  handleChange('published_date', e.target.value || '')
                }}
              />
              <p className="text-xs text-gray-500">
                Chọn ngày và giờ xuất bản (sẽ được lưu dạng TIMESTAMPTZ)
              </p>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">URL nguồn</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com/document"
              />
            </div>

            {/* Tags - Multi-select */}
            <div className="space-y-2">
              <Label htmlFor="tags">Chủ đề (Tags)</Label>
              
              {/* Available tags dropdown */}
              {availableTags.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Chọn từ tags có sẵn:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter(tag => !formData.tags.includes(tag))
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-400"
                          onClick={() => handleChange('tags', [...formData.tags, tag])}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Manual tag input */}
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Nhập tag mới và nhấn Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Selected tags */}
              {formData.tags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Tags đã chọn:</p>
                  <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-gray-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả ngắn</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Nhập mô tả ngắn về tài liệu"
                rows={2}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="raw">
                Nội dung <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="raw"
                value={formData.raw}
                onChange={(e) => handleChange('raw', e.target.value)}
                placeholder="Dán nội dung tài liệu vào đây..."
                rows={10}
                required
              />
              <p className="text-xs text-gray-500">
                <FileText className="inline h-3 w-3 mr-1" />
                Nội dung sẽ được tự động chia nhỏ thành chunks và tạo vector embeddings
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo tài liệu' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



