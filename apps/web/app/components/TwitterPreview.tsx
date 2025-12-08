'use client'

import React from 'react'
import { MessageCircle, Repeat2, Heart, Share } from 'lucide-react'
import { cn } from '@/app/lib/utils'

export interface TwitterPreviewProps {
  /**
   * Tên hiển thị của người dùng
   */
  name?: string
  /**
   * Username (@username)
   */
  username?: string
  /**
   * URL của avatar (nếu không có sẽ dùng default)
   */
  avatar?: string
  /**
   * Nội dung tweet
   */
  content: string
  /**
   * Timestamp (Date object hoặc ISO string)
   */
  timestamp?: Date | string
  /**
   * Số lượt reply (mặc định: ẩn nếu không có)
   */
  replyCount?: number
  /**
   * Số lượt retweet (mặc định: ẩn nếu không có)
   */
  retweetCount?: number
  /**
   * Số lượt like (mặc định: ẩn nếu không có)
   */
  likeCount?: number
  /**
   * Custom className
   */
  className?: string
  /**
   * Hiển thị verified badge
   */
  verified?: boolean
}

/**
 * TwitterPreview - Component hiển thị preview tweet giống Twitter/X thật
 * 
 * @example
 * ```tsx
 * <TwitterPreview
 *   name="John Doe"
 *   username="johndoe"
 *   content="This is a sample tweet content!"
 *   timestamp={new Date()}
 *   replyCount={5}
 *   retweetCount={12}
 *   likeCount={42}
 * />
 * ```
 */
export function TwitterPreview({
  name = 'Twitter User',
  username = 'twitteruser',
  avatar,
  content,
  timestamp,
  replyCount,
  retweetCount,
  likeCount,
  className,
  verified = false,
}: TwitterPreviewProps) {
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
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    
    // Format as date if older than a week
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Default avatar với gradient background
  const getDefaultAvatar = () => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
    ]
    const index = username.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div
      className={cn(
        'w-full max-w-[598px] border-b border-gray-200 dark:border-gray-800',
        'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors',
        className
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
              avatar ? 'hidden' : getDefaultAvatar()
            )}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name, Username, Timestamp */}
          <div className="flex items-center gap-1 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white text-[15px] leading-5">
              {name}
            </span>
            {verified && (
              <svg
                viewBox="0 0 22 22"
                className="w-4 h-4 text-blue-500 dark:text-blue-400"
                fill="currentColor"
              >
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44-.54-.354-1.17-.551-1.816-.57-.646-.02-1.277.177-1.816.57-.54.354-1.086.853-1.44 1.245-.607-.223-1.264-.27-1.897-.14-.634.13-1.218.437-1.687.882-.445.47-.75 1.053-.882 1.687-.13.633-.083 1.29.14 1.897-.587.273-1.086.705-1.44 1.245-.354.54-.551 1.17-.57 1.816.02.647.177 1.277.57 1.817.354.54.853 1.086 1.245 1.44.223.606.27 1.263.14 1.896-.13.634-.437 1.218-.882 1.688-.47.443-1.053.75-1.687.882-.633.132-1.29.178-1.897.14-.273.586-.705 1.084-1.246 1.439-.54.354-1.185.55-1.816.57-.647.02-1.276-.177-1.817-.57-.54-.354-1.086-.853-1.44-1.245-.606.223-1.263.27-1.896.14-.634-.13-1.218-.437-1.688-.882-.443-.47-.75-1.053-.882-1.687-.132-.633-.178-1.29-.14-1.897.586-.273 1.084-.704 1.439-1.246.354-.54.55-1.17.57-1.816.02-.646-.177-1.276-.57-1.817-.354-.54-.852-1.085-1.245-1.44-.223-.607-.27-1.264-.14-1.897.13-.634.437-1.218.882-1.687.47-.445 1.053-.75 1.687-.882.633-.13 1.29-.083 1.897.14.273-.586.704-1.086 1.245-1.44.54-.354 1.17-.552 1.817-.57.646-.02 1.277.177 1.816.57.54.354 1.086.853 1.44 1.245.606-.223 1.263-.27 1.896-.14.634.13 1.218.437 1.687.882.445.47.75 1.053.882 1.687.132.633.178 1.29.14 1.897.273.586.705 1.084 1.246 1.439.54.354 1.185.55 1.816.57.647.02 1.276-.177 1.817-.57.54-.354 1.086-.853 1.44-1.245.606.223 1.263.27 1.896.14.634-.13 1.218-.437 1.688-.882.443-.47.75-1.053.882-1.687.132-.633.178-1.29.14-1.897.586-.273 1.084-.704 1.439-1.246.354-.54.55-1.17.57-1.816.02-.646-.177-1.276-.57-1.817-.354-.54-.852-1.085-1.245-1.44-.223-.607-.27-1.264-.14-1.897.13-.634.437-1.218.882-1.687.47-.445 1.053-.75 1.687-.882.633-.13 1.29-.083 1.897.14.273-.586.704-1.086 1.245-1.44.54-.354 1.17-.552 1.817-.57zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
              </svg>
            )}
            <span className="text-gray-500 dark:text-gray-400 text-[15px] leading-5">
              @{username}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-[15px] leading-5">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-[15px] leading-5">
              {formatTimestamp(timestamp)}
            </span>
          </div>

          {/* Tweet Content */}
          <div className="mb-3">
            <p className="text-[15px] leading-5 text-gray-900 dark:text-white whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>

          {/* Interaction Buttons */}
          <div className="flex items-center justify-between max-w-[425px] mt-1">
            {/* Reply */}
            <button
              className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              aria-label="Reply"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              {replyCount !== undefined && replyCount > 0 && (
                <span className="text-xs">{replyCount}</span>
              )}
            </button>

            {/* Retweet */}
            <button
              className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
              aria-label="Retweet"
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
              {retweetCount !== undefined && retweetCount > 0 && (
                <span className="text-xs">{retweetCount}</span>
              )}
            </button>

            {/* Like */}
            <button
              className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              aria-label="Like"
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              {likeCount !== undefined && likeCount > 0 && (
                <span className="text-xs">{likeCount}</span>
              )}
            </button>

            {/* Share */}
            <button
              className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              aria-label="Share"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <Share className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

