'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Send, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from './ui'
import { Button } from './ui/button'

export interface Derivative {
  id: string
  platform: string
  content: string
  status?: 'draft' | 'ready' | 'published' | 'failed'
  createdAt?: Date | string
}

export interface MultiPublishQueueProps {
  /**
   * Danh sách derivatives
   */
  derivatives: Derivative[]
  /**
   * Callback khi publish thành công
   */
  onPublishSuccess?: (publishedIds: string[]) => void
  /**
   * Callback khi publish thất bại
   */
  onPublishError?: (error: Error, failedIds: string[]) => void
  /**
   * Custom className
   */
  className?: string
}

/**
 * MultiPublishQueue - Component để chọn và publish nhiều derivatives
 * 
 * @example
 * ```tsx
 * <MultiPublishQueue
 *   derivatives={derivatives}
 *   onPublishSuccess={(ids) => console.log('Published:', ids)}
 *   onPublishError={(error, ids) => console.error('Failed:', error, ids)}
 * />
 * ```
 */
export function MultiPublishQueue({
  derivatives,
  onPublishSuccess,
  onPublishError,
  className,
}: MultiPublishQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState<Set<string>>(new Set())
  const [published, setPublished] = useState<Set<string>>(new Set())
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const toast = useToast()

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === derivatives.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(derivatives.map((d) => d.id)))
    }
  }

  const handlePublish = async () => {
    if (selectedIds.size === 0) {
      toast.warning('No items selected', 'Please select at least one derivative to publish')
      return
    }

    const idsToPublish = Array.from(selectedIds)
    setPublishing(new Set(idsToPublish))
    setFailed(new Set())
    setPublished(new Set())

    const publishedIds: string[] = []
    const failedIds: string[] = []

    for (const id of idsToPublish) {
      try {
        const derivative = derivatives.find((d) => d.id === id)
        if (!derivative) {
          failedIds.push(id)
          continue
        }

        // Call publish API
        const response = await fetch('/api/publishing/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            derivative_id: id,
            platform: derivative.platform,
            content: derivative.content,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to publish ${id}`)
        }

        const data = await response.json()

        // Log event to database
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'derivative.published',
            payload: {
              derivative_id: id,
              platform: derivative.platform,
              published_at: new Date().toISOString(),
            },
          }),
        })

        publishedIds.push(id)
        setPublished((prev) => new Set([...prev, id]))
      } catch (error) {
        console.error(`Failed to publish ${id}:`, error)
        failedIds.push(id)
        setFailed((prev) => new Set([...prev, id]))
      }
    }

    setPublishing(new Set())
    setSelectedIds(new Set())

    if (publishedIds.length > 0) {
      toast.success(
        `Published ${publishedIds.length} derivative${publishedIds.length > 1 ? 's' : ''}`,
        'Content has been published successfully'
      )
      onPublishSuccess?.(publishedIds)
    }

    if (failedIds.length > 0) {
      toast.error(
        `Failed to publish ${failedIds.length} derivative${failedIds.length > 1 ? 's' : ''}`,
        'Please check the errors and try again'
      )
      onPublishError?.(
        new Error(`Failed to publish ${failedIds.length} items`),
        failedIds
      )
    }
  }

  const allSelected = selectedIds.size === derivatives.length && derivatives.length > 0
  const someSelected = selectedIds.size > 0 && selectedIds.size < derivatives.length

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAll}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Select all"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : 'Select derivatives to publish'}
            </span>
          </div>
          <Button
            onClick={handlePublish}
            disabled={selectedIds.size === 0 || publishing.size > 0}
            className="flex items-center gap-2"
          >
            {publishing.size > 0 ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish Selected ({selectedIds.size})
              </>
            )}
          </Button>
        </div>

        {/* Derivatives List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {derivatives.map((derivative) => {
            const isSelected = selectedIds.has(derivative.id)
            const isPublishing = publishing.has(derivative.id)
            const isPublished = published.has(derivative.id)
            const isFailed = failed.has(derivative.id)

            return (
              <div
                key={derivative.id}
                className={cn(
                  'px-4 py-3 flex items-start gap-3 transition-colors',
                  isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                  isPublished && 'bg-green-50 dark:bg-green-900/20',
                  isFailed && 'bg-red-50 dark:bg-red-900/20'
                )}
              >
                <button
                  onClick={() => toggleSelection(derivative.id)}
                  className="mt-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  disabled={isPublishing || isPublished}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {derivative.platform.charAt(0).toUpperCase() + derivative.platform.slice(1)}
                    </span>
                    {derivative.status && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          derivative.status === 'published'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : derivative.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        )}
                      >
                        {derivative.status}
                      </span>
                    )}
                    {isPublishing && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                    {isPublished && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {isFailed && <XCircle className="w-4 h-4 text-red-600" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {derivative.content}
                  </p>
                  {derivative.createdAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Created: {new Date(derivative.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {derivatives.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No derivatives available
          </div>
        )}
      </div>
    </div>
  )
}

