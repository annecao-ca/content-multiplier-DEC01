'use client'

import React from 'react'
import { ThumbsUp, MessageCircle, Repeat2, Send } from 'lucide-react'
import { cn } from '@/app/lib/utils'

export interface LinkedInPreviewProps {
  /**
   * Tên hiển thị của người dùng
   */
  name?: string
  /**
   * Headline/Job title (ví dụ: "Software Engineer at Company")
   */
  headline?: string
  /**
   * URL của avatar (nếu không có sẽ dùng default)
   */
  avatar?: string
  /**
   * Nội dung post
   */
  content: string
  /**
   * Timestamp (Date object hoặc ISO string)
   */
  timestamp?: Date | string
  /**
   * Số lượt like (mặc định: ẩn nếu không có)
   */
  likeCount?: number
  /**
   * Số lượt comment (mặc định: ẩn nếu không có)
   */
  commentCount?: number
  /**
   * Số lượt repost/share (mặc định: ẩn nếu không có)
   */
  repostCount?: number
  /**
   * Custom className
   */
  className?: string
  /**
   * Hiển thị "Promoted" badge
   */
  promoted?: boolean
  /**
   * Company/Organization name (hiển thị dưới headline)
   */
  company?: string
}

/**
 * LinkedInPreview - Component hiển thị preview LinkedIn post giống LinkedIn thật
 * 
 * @example
 * ```tsx
 * <LinkedInPreview
 *   name="John Doe"
 *   headline="Software Engineer"
 *   company="Tech Corp"
 *   content="Excited to share my latest project!"
 *   timestamp={new Date()}
 *   likeCount={50}
 *   commentCount={12}
 *   repostCount={5}
 * />
 * ```
 */
export function LinkedInPreview({
  name = 'LinkedIn User',
  headline,
  company,
  avatar,
  content,
  timestamp,
  likeCount,
  commentCount,
  repostCount,
  className,
  promoted = false,
}: LinkedInPreviewProps) {
  // Format timestamp
  const formatTimestamp = (ts?: Date | string): string => {
    if (!ts) return 'now'
    
    const date = typeof ts === 'string' ? new Date(ts) : ts
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    // Format as date if older than a week
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Default avatar với gradient background
  const getDefaultAvatar = () => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-700',
      'bg-gradient-to-br from-indigo-500 to-indigo-700',
      'bg-gradient-to-br from-purple-500 to-purple-700',
      'bg-gradient-to-br from-pink-500 to-pink-700',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div
      className={cn(
        'w-full max-w-[552px] bg-white dark:bg-gray-900',
        'rounded-lg border border-gray-200 dark:border-gray-800',
        'overflow-hidden',
        className
      )}
    >
      {/* Profile Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const nextSibling = target.nextElementSibling as HTMLElement
                  if (nextSibling) nextSibling.classList.remove('hidden')
                }}
              />
            ) : null}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg border border-gray-200 dark:border-gray-700',
                avatar ? 'hidden' : getDefaultAvatar()
              )}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Name, Headline, Timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                {name}
              </h3>
              {promoted && (
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Promoted
                </span>
              )}
            </div>
            
            {headline && (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight mb-0.5">
                {headline}
              </p>
            )}
            
            {company && (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight mb-0.5">
                {company}
              </p>
            )}
            
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(timestamp)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
              <svg
                className="w-3 h-3 text-gray-400 dark:text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* More options button */}
          <button
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="More options"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>

      {/* Engagement Stats */}
      {(likeCount !== undefined && likeCount > 0) || 
       (commentCount !== undefined && commentCount > 0) || 
       (repostCount !== undefined && repostCount > 0) ? (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            {likeCount !== undefined && likeCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex items-center -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-blue-600 border border-white dark:border-gray-900 flex items-center justify-center">
                    <ThumbsUp className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="w-4 h-4 rounded-full bg-blue-500 border border-white dark:border-gray-900 flex items-center justify-center">
                    <ThumbsUp className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <span>{likeCount}</span>
              </div>
            )}
            {commentCount !== undefined && commentCount > 0 && (
              <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
            )}
            {repostCount !== undefined && repostCount > 0 && (
              <span>{repostCount} repost{repostCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      ) : null}

      {/* Engagement Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around px-2 py-1">
          {/* Like */}
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            aria-label="Like"
          >
            <ThumbsUp className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Like
            </span>
          </button>

          {/* Comment */}
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            aria-label="Comment"
          >
            <MessageCircle className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Comment
            </span>
          </button>

          {/* Repost */}
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            aria-label="Repost"
          >
            <Repeat2 className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Repost
            </span>
          </button>

          {/* Send */}
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            aria-label="Send"
          >
            <Send className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Send
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

