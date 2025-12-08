'use client'

import React from 'react'
import { cn } from '@/app/lib/utils'

export interface LoadingSkeletonProps {
  /**
   * Số lượng skeleton items
   */
  count?: number
  /**
   * Custom className
   */
  className?: string
  /**
   * Variant: 'text', 'card', 'avatar', 'button', 'custom'
   */
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'custom'
  /**
   * Width (CSS value)
   */
  width?: string
  /**
   * Height (CSS value)
   */
  height?: string
  /**
   * Rounded corners
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

/**
 * LoadingSkeleton - Component với shimmer effect cho loading states
 * 
 * @example
 * ```tsx
 * <LoadingSkeleton variant="card" count={3} />
 * ```
 */
export function LoadingSkeleton({
  count = 1,
  className,
  variant = 'text',
  width,
  height,
  rounded = 'md',
}: LoadingSkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  const variantStyles = {
    text: {
      defaultWidth: 'w-full',
      defaultHeight: 'h-4',
    },
    card: {
      defaultWidth: 'w-full',
      defaultHeight: 'h-32',
    },
    avatar: {
      defaultWidth: 'w-12',
      defaultHeight: 'h-12',
    },
    button: {
      defaultWidth: 'w-24',
      defaultHeight: 'h-10',
    },
    custom: {
      defaultWidth: width || 'w-full',
      defaultHeight: height || 'h-4',
    },
  }

  const style = variantStyles[variant]

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'relative overflow-hidden',
            roundedClasses[rounded],
            style.defaultWidth,
            style.defaultHeight,
            className
          )}
          style={{
            width: width || undefined,
            height: height || undefined,
          }}
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-r',
              'from-gray-200 via-gray-300 to-gray-200',
              'dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
              'animate-shimmer'
            )}
            style={{
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      ))}
    </>
  )
}

/**
 * LoadingSkeletonCard - Pre-built card skeleton
 */
export function LoadingSkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <LoadingSkeleton variant="avatar" rounded="full" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton variant="text" width="60%" />
              <LoadingSkeleton variant="text" width="40%" />
            </div>
          </div>
          <LoadingSkeleton variant="text" count={3} />
          <div className="flex gap-4">
            <LoadingSkeleton variant="button" width="80px" />
            <LoadingSkeleton variant="button" width="80px" />
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * LoadingSkeletonPreview - Skeleton cho preview components
 */
export function LoadingSkeletonPreview() {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="avatar" rounded="full" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" width="30%" />
          <LoadingSkeleton variant="text" width="50%" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" width="80%" />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-2">
        <LoadingSkeleton variant="button" width="60px" height="32px" />
        <LoadingSkeleton variant="button" width="60px" height="32px" />
        <LoadingSkeleton variant="button" width="60px" height="32px" />
      </div>
    </div>
  )
}

