'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { File, Trash2, ExternalLink, User, Calendar, Tag } from 'lucide-react'

interface DocumentCardProps {
  id: string
  title: string
  url?: string
  author?: string
  published_date?: string
  tags?: string[]
  description?: string
  uploadDate: Date
  onDelete?: (id: string) => Promise<void>
  className?: string
}

export function DocumentCard({
  id,
  title,
  url,
  author,
  published_date,
  tags,
  description,
  uploadDate,
  onDelete,
  className = '',
}: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    
    setDeleting(true)
    try {
      await onDelete(id)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj)
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
    } catch {
      return dateStr
    }
  }

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
  }

  return (
    <div 
      className={`rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all overflow-hidden max-h-52 flex flex-col ${className}`}
    >
      <div className="p-4 flex flex-col gap-2 flex-1 min-h-0">
        {/* Header: Icon + Title + Delete */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-1.5 bg-white/5 rounded-lg flex-shrink-0">
              <File className="h-4 w-4 text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-base font-semibold text-white">{title}</h3>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="bg-slate-900/50 border border-white/10 rounded-full p-1.5 text-white/50 hover:text-red-400 hover:border-red-500/50 transition-colors flex-shrink-0 disabled:opacity-50"
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border border-slate-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-50">Xác nhận xóa tài liệu</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Bạn có chắc chắn muốn xóa tài liệu "{title}"? 
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Metadata: Upload date, Published date, Author */}
        <div className="space-y-1">
          <div className="truncate text-xs text-white/50">
            Tạo: {formatDate(uploadDate)}
          </div>
          {published_date && (
            <div className="flex items-center gap-1 text-xs text-white/50 truncate">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Xuất bản: {formatDateTime(published_date)}</span>
            </div>
          )}
          {author && (
            <div className="flex items-center gap-1 text-xs text-white/50 truncate">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{author}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-sm text-white/70 break-words">{description}</p>
        )}
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag className="h-3 w-3 text-white/40 mt-0.5 flex-shrink-0" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-white/10 text-white/80 text-[11px] rounded-full px-2 py-0.5 break-words"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* URL */}
        {url && (
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-white/10 mt-auto">
            <ExternalLink className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 hover:underline truncate break-all"
              title={url}
            >
              {truncateUrl(url, 40)}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}



