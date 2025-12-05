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
    <Card 
      className={`transition-all hover:shadow-md hover:border-indigo-300 ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <File className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{title}</CardTitle>
              <CardDescription className="mt-1 space-y-1">
                <div className="text-xs text-gray-500">
                  Tạo: {formatDate(uploadDate)}
                </div>
                {published_date && (
                  <div className="flex items-center gap-1 text-xs text-indigo-600">
                    <Calendar className="h-3 w-3" />
                    <span>Xuất bản: {formatDateTime(published_date)}</span>
                  </div>
                )}
                {author && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    <span>{author}</span>
                  </div>
                )}
              </CardDescription>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa tài liệu "{title}"? 
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag className="h-3 w-3 text-gray-400 mt-1" />
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

      {url && (
          <div className="flex items-center space-x-2 text-sm pt-2 border-t">
            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 hover:underline truncate"
              title={url}
            >
              {truncateUrl(url)}
            </a>
          </div>
        )}
        </CardContent>
    </Card>
  )
}



