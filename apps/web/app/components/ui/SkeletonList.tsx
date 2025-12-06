'use client'

import React from 'react'
import { cn } from '@/app/lib/utils'

export type SkeletonListType = 'ideas' | 'briefs' | 'drafts' | 'packs' | 'default'

export interface SkeletonListProps {
  count?: number
  type?: SkeletonListType
  className?: string
}

export function SkeletonList({ count = 6, type = 'default', className }: SkeletonListProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  const renderSkeleton = (index: number) => {
    switch (type) {
      case 'ideas':
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        )

      case 'briefs':
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        )

      case 'drafts':
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-1/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        )

      case 'packs':
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        )

      default:
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        type === 'ideas' || type === 'briefs' || type === 'drafts' || type === 'packs'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1',
        className
      )}
    >
      {skeletons.map(renderSkeleton)}
    </div>
  )
}

// Individual skeleton components for more granular control
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

